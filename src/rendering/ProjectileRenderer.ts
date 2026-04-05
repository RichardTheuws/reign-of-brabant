/**
 * ProjectileRenderer.ts
 * Manages arrow projectile rendering with arc trajectories and object pooling.
 * Max 50 simultaneous projectiles, auto-cleanup on impact.
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARROW_MODEL_PATH = 'assets/models/poc/gameplay/arrow.glb';
const MAX_PROJECTILES = 50;
/** Gravity for parabolic arc (world units/s^2). */
const ARC_GRAVITY = 15;
/** Minimum arc height above the straight-line midpoint. */
const MIN_ARC_PEAK = 2;

/** Trail: thin stretched mesh behind each arrow. */
const TRAIL_LENGTH = 1.2;
const TRAIL_OPACITY = 0.3;

/** Impact dust puff parameters. */
const MAX_IMPACTS = 30;
const IMPACT_PARTICLE_COUNT = 4;
const IMPACT_LIFETIME = 0.4; // seconds
const IMPACT_SPREAD = 0.6;
const IMPACT_RISE_SPEED = 1.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectileSpawnData {
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  /** Time in seconds the projectile takes to arrive. */
  duration: number;
}

interface ActiveProjectile {
  obj: THREE.Object3D;
  trail: THREE.Mesh;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  duration: number;
  elapsed: number;
  /** Pre-computed arc peak height. */
  peakY: number;
  active: boolean;
}

/** A single dust particle in an impact effect. */
interface ImpactParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  active: boolean;
}

// ---------------------------------------------------------------------------
// ProjectileRenderer
// ---------------------------------------------------------------------------

export class ProjectileRenderer {
  private loader = new GLTFLoader();
  private group: THREE.Group;

  private arrowSource: THREE.Object3D | null = null;
  private pool: ActiveProjectile[] = [];

  /** Trail shared resources. */
  private trailGeo: THREE.PlaneGeometry;
  private trailMat: THREE.MeshBasicMaterial;

  /** Impact particle pool. */
  private impactParticles: ImpactParticle[] = [];
  private impactGeo: THREE.SphereGeometry;
  private impactMat: THREE.MeshBasicMaterial;

  /** Reusable vectors to avoid per-frame allocations. */
  private _posA = new THREE.Vector3();
  private _posB = new THREE.Vector3();
  private _dir = new THREE.Vector3();

  constructor(parentGroup: THREE.Group) {
    this.group = parentGroup;

    // Trail: a small stretched plane
    this.trailGeo = new THREE.PlaneGeometry(0.03, TRAIL_LENGTH);
    this.trailMat = new THREE.MeshBasicMaterial({
      color: 0xccccaa,
      transparent: true,
      opacity: TRAIL_OPACITY,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Impact particle: tiny sphere
    this.impactGeo = new THREE.SphereGeometry(0.08, 4, 4);
    this.impactMat = new THREE.MeshBasicMaterial({
      color: 0xaa9977,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
  }

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  async preload(): Promise<void> {
    const gltf: GLTF = await this.loader.loadAsync(ARROW_MODEL_PATH);
    const root = gltf.scene;
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    this.arrowSource = root;

    // Pre-allocate pool
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const clone = root.clone(true);
      clone.visible = false;
      this.group.add(clone);

      // Create trail mesh for this projectile
      const trail = new THREE.Mesh(this.trailGeo, this.trailMat);
      trail.visible = false;
      trail.renderOrder = 2;
      this.group.add(trail);

      this.pool.push({
        obj: clone,
        trail,
        startX: 0,
        startY: 0,
        startZ: 0,
        targetX: 0,
        targetY: 0,
        targetZ: 0,
        duration: 1,
        elapsed: 0,
        peakY: 0,
        active: false,
      });
    }

    // Pre-allocate impact particle pool
    for (let i = 0; i < MAX_IMPACTS * IMPACT_PARTICLE_COUNT; i++) {
      const mesh = new THREE.Mesh(this.impactGeo, this.impactMat.clone());
      mesh.visible = false;
      this.group.add(mesh);
      this.impactParticles.push({
        mesh,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: IMPACT_LIFETIME,
        active: false,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Spawning
  // -----------------------------------------------------------------------

  /**
   * Spawn a new projectile that will follow a parabolic arc from start to target.
   * Returns true if a pool slot was available.
   */
  spawn(data: ProjectileSpawnData): boolean {
    const slot = this.acquireSlot();
    if (!slot) return false;

    slot.startX = data.startX;
    slot.startY = data.startY;
    slot.startZ = data.startZ;
    slot.targetX = data.targetX;
    slot.targetY = data.targetY;
    slot.targetZ = data.targetZ;
    slot.duration = Math.max(data.duration, 0.1);
    slot.elapsed = 0;
    slot.active = true;

    // Compute parabolic peak: midpoint Y + arc height
    const midY = (data.startY + data.targetY) * 0.5;
    const dx = data.targetX - data.startX;
    const dz = data.targetZ - data.startZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Higher arc for longer distances
    slot.peakY = midY + Math.max(MIN_ARC_PEAK, dist * 0.15);

    slot.obj.visible = true;
    slot.obj.position.set(data.startX, data.startY, data.startZ);

    return true;
  }

  // -----------------------------------------------------------------------
  // Per-frame update
  // -----------------------------------------------------------------------

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;

      p.elapsed += dt;
      const t = Math.min(p.elapsed / p.duration, 1);

      // Horizontal interpolation (linear)
      const x = p.startX + (p.targetX - p.startX) * t;
      const z = p.startZ + (p.targetZ - p.startZ) * t;

      // Vertical: parabolic arc
      // y(t) = (1-t)^2 * startY + 2*(1-t)*t * peakY + t^2 * targetY  (quadratic bezier)
      const oneMinusT = 1 - t;
      const y =
        oneMinusT * oneMinusT * p.startY +
        2 * oneMinusT * t * p.peakY +
        t * t * p.targetY;

      p.obj.position.set(x, y, z);

      // Orient arrow along its velocity direction
      // Velocity = derivative of the bezier curve
      const dt2 = 0.01;
      const t2 = Math.min(t + dt2, 1);
      const oneMinusT2 = 1 - t2;
      const nextX = p.startX + (p.targetX - p.startX) * t2;
      const nextY =
        oneMinusT2 * oneMinusT2 * p.startY +
        2 * oneMinusT2 * t2 * p.peakY +
        t2 * t2 * p.targetY;
      const nextZ = p.startZ + (p.targetZ - p.startZ) * t2;

      this._dir.set(nextX - x, nextY - y, nextZ - z);
      if (this._dir.lengthSq() > 0.0001) {
        this._dir.normalize();
        // Point the arrow in the velocity direction
        // Arrow model assumed to point along +Z
        p.obj.lookAt(p.obj.position.x + this._dir.x, p.obj.position.y + this._dir.y, p.obj.position.z + this._dir.z);
      }

      // Trail: position behind the arrow along velocity direction
      p.trail.visible = true;
      p.trail.position.set(
        x - this._dir.x * TRAIL_LENGTH * 0.5,
        y - this._dir.y * TRAIL_LENGTH * 0.5,
        z - this._dir.z * TRAIL_LENGTH * 0.5,
      );
      p.trail.lookAt(x + this._dir.x, y + this._dir.y, z + this._dir.z);

      // Auto-cleanup at impact
      if (t >= 1) {
        // Spawn impact dust puff
        this.spawnImpact(p.targetX, p.targetY, p.targetZ);
        this.releaseSlot(p);
      }
    }

    // Update impact particles
    this.updateImpactParticles(dt);
  }

  /**
   * Spawn a dust puff impact effect at the given position.
   */
  private spawnImpact(x: number, y: number, z: number): void {
    let spawned = 0;
    for (const particle of this.impactParticles) {
      if (particle.active) continue;
      if (spawned >= IMPACT_PARTICLE_COUNT) break;

      particle.active = true;
      particle.life = 0;
      particle.maxLife = IMPACT_LIFETIME + Math.random() * 0.1;
      particle.mesh.visible = true;
      particle.mesh.position.set(x, y + 0.1, z);
      particle.mesh.scale.setScalar(1);

      // Random outward velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = IMPACT_SPREAD + Math.random() * IMPACT_SPREAD * 0.5;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = IMPACT_RISE_SPEED + Math.random() * 0.5;
      particle.vz = Math.sin(angle) * speed;

      spawned++;
    }
  }

  /**
   * Update active impact particles (fade out + rise).
   */
  private updateImpactParticles(dt: number): void {
    for (const particle of this.impactParticles) {
      if (!particle.active) continue;

      particle.life += dt;
      const t = particle.life / particle.maxLife;

      if (t >= 1) {
        particle.active = false;
        particle.mesh.visible = false;
        continue;
      }

      // Move outward and upward
      particle.mesh.position.x += particle.vx * dt;
      particle.mesh.position.y += particle.vy * dt;
      particle.mesh.position.z += particle.vz * dt;

      // Decelerate
      particle.vx *= 0.95;
      particle.vy *= 0.92;
      particle.vz *= 0.95;

      // Fade out + shrink
      const alpha = 1 - t;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.6;
      particle.mesh.scale.setScalar(1 - t * 0.5);
    }
  }

  // -----------------------------------------------------------------------
  // Pool management
  // -----------------------------------------------------------------------

  private acquireSlot(): ActiveProjectile | null {
    for (const p of this.pool) {
      if (!p.active) return p;
    }
    return null; // Pool exhausted
  }

  private releaseSlot(p: ActiveProjectile): void {
    p.active = false;
    p.obj.visible = false;
    p.trail.visible = false;
  }

  /** Get the count of currently active projectiles. */
  get activeCount(): number {
    let count = 0;
    for (const p of this.pool) {
      if (p.active) count++;
    }
    return count;
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  destroy(): void {
    for (const p of this.pool) {
      this.group.remove(p.obj);
      this.disposeObject(p.obj);
      this.group.remove(p.trail);
    }
    this.pool.length = 0;

    // Dispose trail resources
    this.trailGeo.dispose();
    this.trailMat.dispose();

    // Dispose impact particles
    for (const particle of this.impactParticles) {
      this.group.remove(particle.mesh);
      (particle.mesh.material as THREE.Material).dispose();
    }
    this.impactParticles.length = 0;
    this.impactGeo.dispose();
    this.impactMat.dispose();

    if (this.arrowSource) {
      this.disposeObject(this.arrowSource);
      this.arrowSource = null;
    }
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) mat.dispose();
      }
    });
  }
}
