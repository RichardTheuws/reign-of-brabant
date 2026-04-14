/**
 * ProjectileRenderer.ts
 * Manages arrow projectile rendering with arc trajectories and object pooling.
 * Max 50 simultaneous projectiles, auto-cleanup on impact.
 *
 * Trail system: each projectile has a ribbon trail (8-point fading line) plus
 * small spark particles that detach as it flies, creating a dramatic arc.
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARROW_MODEL_PATH = '/assets/models/poc/gameplay/arrow.glb';
const MAX_PROJECTILES = 50;
/** Gravity for parabolic arc (world units/s^2). */
const ARC_GRAVITY = 15;
/** Minimum arc height above the straight-line midpoint. */
const MIN_ARC_PEAK = 2;

/** Ribbon trail: number of historical positions stored per projectile. */
const TRAIL_POINTS = 8;
/** Minimum distance (squared) before recording a new trail point. */
const TRAIL_MIN_DIST_SQ = 0.04; // 0.2^2
/** Duration (seconds) for the trail to fade out after projectile impact. */
const TRAIL_FADEOUT_DURATION = 0.2;

/** Trail spark particles spawned along the flight path. */
const MAX_TRAIL_SPARKS = MAX_PROJECTILES * 12; // 12 sparks per projectile max
const TRAIL_SPARK_LIFETIME = 0.35; // seconds
const TRAIL_SPARK_SPAWN_INTERVAL = 0.04; // seconds between spark spawns

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
  /** Projectile type: 'arrow' (default) or 'siege' (larger, fiery arc). */
  projectileType?: 'arrow' | 'siege';
}

interface ActiveProjectile {
  obj: THREE.Object3D;
  /** Ribbon trail line object. */
  trail: THREE.Line;
  /** Ring buffer of trail positions (TRAIL_POINTS entries, each 3 floats). */
  trailPositions: Float32Array;
  /** Ring buffer of trail vertex colors (TRAIL_POINTS entries, each 3 floats RGB). */
  trailColors: Float32Array;
  /** How many points have been recorded so far (capped at TRAIL_POINTS). */
  trailCount: number;
  /** Timer for spark particle spawning. */
  sparkTimer: number;
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
  /** When > 0 the projectile has hit and the trail is fading out. */
  fadeOut: number;
  /** Projectile type for rendering differences. */
  projectileType: 'arrow' | 'siege';
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

/** A small spark particle left behind along the trail. */
interface TrailSpark {
  mesh: THREE.Mesh;
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

  /** Shared trail line material (vertex colors drive per-point opacity). */
  private trailMat: THREE.LineBasicMaterial;

  /** Trail spark pool. */
  private trailSparks: TrailSpark[] = [];
  private trailSparkGeo: THREE.SphereGeometry;
  private trailSparkMat: THREE.MeshBasicMaterial;

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

    // Trail: a line with vertex colors for per-point fade
    this.trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    // Trail spark: tiny bright sphere
    this.trailSparkGeo = new THREE.SphereGeometry(0.04, 4, 3);
    this.trailSparkMat = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.8,
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

      // Create ribbon trail line for this projectile
      const trailPositions = new Float32Array(TRAIL_POINTS * 3);
      const trailColors = new Float32Array(TRAIL_POINTS * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailGeo.setAttribute('color', new THREE.Float32BufferAttribute(trailColors, 3));
      // Start with 0 draw range so nothing renders until we have points
      trailGeo.setDrawRange(0, 0);

      const trail = new THREE.Line(trailGeo, this.trailMat);
      trail.visible = false;
      trail.renderOrder = 2;
      trail.frustumCulled = false; // trails are small, skip culling overhead
      this.group.add(trail);

      this.pool.push({
        obj: clone,
        trail,
        trailPositions,
        trailColors,
        trailCount: 0,
        sparkTimer: 0,
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
        fadeOut: 0,
        projectileType: 'arrow',
      });
    }

    // Pre-allocate trail spark pool
    for (let i = 0; i < MAX_TRAIL_SPARKS; i++) {
      const mesh = new THREE.Mesh(this.trailSparkGeo, this.trailSparkMat.clone());
      mesh.visible = false;
      this.group.add(mesh);
      this.trailSparks.push({
        mesh,
        life: 0,
        maxLife: TRAIL_SPARK_LIFETIME,
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

    const isSiege = data.projectileType === 'siege';
    slot.projectileType = isSiege ? 'siege' : 'arrow';

    slot.startX = data.startX;
    slot.startY = data.startY;
    slot.startZ = data.startZ;
    slot.targetX = data.targetX;
    slot.targetY = data.targetY;
    slot.targetZ = data.targetZ;
    slot.duration = Math.max(data.duration, 0.1);
    slot.elapsed = 0;
    slot.active = true;
    slot.fadeOut = 0;

    // Reset trail state
    slot.trailCount = 0;
    slot.sparkTimer = 0;
    slot.trailPositions.fill(0);
    slot.trailColors.fill(0);
    (slot.trail.geometry as THREE.BufferGeometry).setDrawRange(0, 0);
    slot.trail.visible = false;

    // Compute parabolic peak: midpoint Y + arc height
    const midY = (data.startY + data.targetY) * 0.5;
    const dx = data.targetX - data.startX;
    const dz = data.targetZ - data.startZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Siege: higher arc, larger visual
    if (isSiege) {
      slot.peakY = midY + Math.max(MIN_ARC_PEAK * 2, dist * 0.3);
      slot.obj.scale.set(2.5, 2.5, 2.5);
    } else {
      slot.peakY = midY + Math.max(MIN_ARC_PEAK, dist * 0.15);
      slot.obj.scale.set(1, 1, 1);
    }

    slot.obj.visible = true;
    slot.obj.position.set(data.startX, data.startY, data.startZ);

    return true;
  }

  // -----------------------------------------------------------------------
  // Per-frame update
  // -----------------------------------------------------------------------

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) {
        // Handle post-impact trail fade-out
        if (p.fadeOut > 0) {
          p.fadeOut -= dt;
          if (p.fadeOut <= 0) {
            p.trail.visible = false;
            p.fadeOut = 0;
          } else {
            // Fade all trail vertex colors toward black (simulates alpha fade)
            const fadeFactor = Math.max(p.fadeOut / TRAIL_FADEOUT_DURATION, 0);
            for (let i = 0; i < p.trailCount * 3; i++) {
              p.trailColors[i] *= fadeFactor;
            }
            const geo = p.trail.geometry as THREE.BufferGeometry;
            geo.attributes.color.needsUpdate = true;
          }
        }
        continue;
      }

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

      // ------ Ribbon trail update ------
      this.updateTrailRibbon(p, x, y, z);

      // ------ Trail spark particles ------
      p.sparkTimer += dt;
      if (p.sparkTimer >= TRAIL_SPARK_SPAWN_INTERVAL) {
        p.sparkTimer -= TRAIL_SPARK_SPAWN_INTERVAL;
        this.spawnTrailSpark(x, y, z);
      }

      // Auto-cleanup at impact
      if (t >= 1) {
        // Spawn impact dust puff
        this.spawnImpact(p.targetX, p.targetY, p.targetZ);
        this.releaseSlot(p);
      }
    }

    // Update trail spark particles
    this.updateTrailSparks(dt);

    // Update impact particles
    this.updateImpactParticles(dt);
  }

  // -----------------------------------------------------------------------
  // Ribbon trail helpers
  // -----------------------------------------------------------------------

  /**
   * Push the current projectile position into the ribbon trail ring buffer
   * and update the Line geometry + vertex colors.
   */
  private updateTrailRibbon(p: ActiveProjectile, x: number, y: number, z: number): void {
    const positions = p.trailPositions;
    const colors = p.trailColors;

    // Only add a new point if the projectile moved enough since the last recorded point
    let shouldAdd = true;
    if (p.trailCount > 0) {
      const li = (p.trailCount - 1) * 3;
      const dx = x - positions[li];
      const dy = y - positions[li + 1];
      const dz = z - positions[li + 2];
      if (dx * dx + dy * dy + dz * dz < TRAIL_MIN_DIST_SQ) {
        shouldAdd = false;
      }
    }

    if (shouldAdd) {
      if (p.trailCount < TRAIL_POINTS) {
        // Still filling the buffer — append
        const idx = p.trailCount * 3;
        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
        p.trailCount++;
      } else {
        // Buffer full — shift everything forward, append at end
        for (let i = 0; i < (TRAIL_POINTS - 1) * 3; i++) {
          positions[i] = positions[i + 3];
        }
        const last = (TRAIL_POINTS - 1) * 3;
        positions[last] = x;
        positions[last + 1] = y;
        positions[last + 2] = z;
      }
    } else if (p.trailCount > 0) {
      // Update the head point in-place so the trail sticks to the projectile
      const li = (p.trailCount - 1) * 3;
      positions[li] = x;
      positions[li + 1] = y;
      positions[li + 2] = z;
    }

    // Rebuild vertex colors: tail (index 0) fades to near-black, head (last) is bright
    // LineBasicMaterial vertex colors are RGB — fade is achieved by darkening the tail.
    for (let i = 0; i < p.trailCount; i++) {
      const alpha = p.trailCount > 1 ? i / (p.trailCount - 1) : 1;
      const ci = i * 3;
      // Warm white at head (1.0, 0.93, 0.7), fading toward dark amber at tail
      colors[ci]     = alpha * 1.0;   // R
      colors[ci + 1] = alpha * 0.93;  // G
      colors[ci + 2] = alpha * 0.7;   // B
    }

    // Update geometry
    const geo = p.trail.geometry as THREE.BufferGeometry;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.setDrawRange(0, p.trailCount);

    p.trail.visible = p.trailCount >= 2;
  }

  // -----------------------------------------------------------------------
  // Trail spark particles
  // -----------------------------------------------------------------------

  /**
   * Spawn a tiny spark particle at the given world position.
   */
  private spawnTrailSpark(x: number, y: number, z: number): void {
    for (const s of this.trailSparks) {
      if (s.active) continue;
      s.active = true;
      s.life = 0;
      s.maxLife = TRAIL_SPARK_LIFETIME + Math.random() * 0.1;
      s.mesh.visible = true;
      // Slight random offset so sparks don't stack exactly
      s.mesh.position.set(
        x + (Math.random() - 0.5) * 0.1,
        y + (Math.random() - 0.5) * 0.1,
        z + (Math.random() - 0.5) * 0.1,
      );
      s.mesh.scale.setScalar(0.8 + Math.random() * 0.4);
      return;
    }
    // Pool exhausted — skip this spark (non-critical visual)
  }

  /**
   * Update active trail spark particles (fade + shrink).
   */
  private updateTrailSparks(dt: number): void {
    for (const s of this.trailSparks) {
      if (!s.active) continue;
      s.life += dt;
      const t = s.life / s.maxLife;
      if (t >= 1) {
        s.active = false;
        s.mesh.visible = false;
        continue;
      }
      // Fade out and shrink
      const alpha = 1 - t;
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.8;
      s.mesh.scale.setScalar(alpha * (0.8 + 0.4 * (1 - t)));
    }
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
    // Don't hide trail immediately — start fade-out so it lingers briefly
    if (p.trailCount >= 2) {
      p.fadeOut = TRAIL_FADEOUT_DURATION;
    } else {
      p.trail.visible = false;
      p.fadeOut = 0;
    }
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
      (p.trail.geometry as THREE.BufferGeometry).dispose();
    }
    this.pool.length = 0;

    // Dispose trail shared material
    this.trailMat.dispose();

    // Dispose trail spark particles
    for (const s of this.trailSparks) {
      this.group.remove(s.mesh);
      (s.mesh.material as THREE.Material).dispose();
    }
    this.trailSparks.length = 0;
    this.trailSparkGeo.dispose();
    this.trailSparkMat.dispose();

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
