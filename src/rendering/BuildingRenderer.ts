/**
 * BuildingRenderer.ts
 * Loads GLB building models, manages placement ghosts (green/red tint),
 * under-construction opacity and completed buildings.
 */

import * as THREE from 'three';
import { MeshToonMaterial } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BuildingTypeName = 'townhall' | 'barracks';

const BUILDING_MODEL_PATHS: Record<string, string> = {
  townhall_0: 'assets/models/v01/brabanders/townhall.glb',
  townhall_1: 'assets/models/v01/randstad/townhall.glb',
  barracks_0: 'assets/models/v01/brabanders/barracks.glb',
  barracks_1: 'assets/models/v01/randstad/barracks.glb',
};

type ModelCacheKey = `${BuildingTypeName}_${number}`;

/** Faction team colors: applied as a strong tint to building materials. */
const FACTION_TINTS: Record<number, THREE.Color> = {
  0: new THREE.Color(0xff8830), // Brabanders: bright warm orange
  1: new THREE.Color(0x4070bb), // Randstad: clear blue
};

/** Ghost colours for placement preview. */
const GHOST_VALID_COLOR = new THREE.Color(0x00ff00);
const GHOST_INVALID_COLOR = new THREE.Color(0xff0000);
const GHOST_OPACITY = 0.45;

/** Production indicator: spinning gear above producing buildings. */
const GEAR_SPIN_SPEED = 2.0; // radians per second
const GEAR_Y_OFFSET = 3.0;
const GEAR_SIZE = 0.7;

/** Damage tint: red emissive increasing as HP decreases. */
const DAMAGE_TINT_COLOR = new THREE.Color(0xff2200);
const MAX_DAMAGE_EMISSIVE_INTENSITY = 0.5;

// ---------------------------------------------------------------------------
// BuildingRenderer
// ---------------------------------------------------------------------------

export class BuildingRenderer {
  private modelCache = new Map<ModelCacheKey, THREE.Group>();
  /** eid -> placed building instance. */
  private instances = new Map<number, THREE.Object3D>();
  /** The active placement ghost, if any. Null when no ghost is shown. */
  private ghost: THREE.Object3D | null = null;
  private ghostValid = true;
  private loader = new GLTFLoader();
  private group: THREE.Group;

  /** Production gear indicators: eid -> gear mesh. */
  private gearIndicators = new Map<number, THREE.Mesh>();
  /** Shared gear geometry + material. */
  private gearGeo: THREE.RingGeometry;
  private gearMat: THREE.MeshBasicMaterial;
  /** Elapsed time for gear rotation. */
  private elapsedTime = 0;

  constructor(parentGroup: THREE.Group) {
    this.group = parentGroup;

    // Create shared gear indicator resources
    this.gearGeo = new THREE.RingGeometry(GEAR_SIZE * 0.5, GEAR_SIZE, 8);
    this.gearMat = new THREE.MeshBasicMaterial({
      color: 0xddcc44,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  // -----------------------------------------------------------------------
  // Asset loading
  // -----------------------------------------------------------------------

  async preload(): Promise<void> {
    const entries = Object.entries(BUILDING_MODEL_PATHS);
    const promises = entries.map(([key, path]) =>
      this.loader.loadAsync(path).then((gltf: GLTF) => {
        const root = gltf.scene;
        // Scale up buildings for proper map presence
        root.scale.set(1.8, 1.8, 1.8);
        // Enable shadow casting on all child meshes
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
        });
        this.modelCache.set(key as ModelCacheKey, root);
      }),
    );
    await Promise.all(promises);
  }

  // -----------------------------------------------------------------------
  // Instance management
  // -----------------------------------------------------------------------

  /**
   * Add a building entity to the scene.
   * @param progress 0..1 build progress (0 = just placed, 1 = complete)
   */
  addBuilding(
    eid: number,
    type: BuildingTypeName,
    factionId: number,
    x: number,
    y: number,
    z: number,
    progress: number,
  ): THREE.Object3D | null {
    if (this.instances.has(eid)) return this.instances.get(eid)!;

    const key: ModelCacheKey = `${type}_${factionId}`;
    const source = this.modelCache.get(key);
    if (!source) {
      console.warn(`[BuildingRenderer] No cached model for key "${key}"`);
      return null;
    }

    const clone = source.clone(true);
    const tint = FACTION_TINTS[factionId];
    // Convert materials to MeshToonMaterial for stylized cel-shaded look
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const applyTint = (m: THREE.Material): THREE.Material => {
          // Extract base color from original material
          const origColor = ('color' in m && m.color instanceof THREE.Color)
            ? m.color.clone()
            : new THREE.Color(0x888888);

          // Apply faction tint (strong: 70% blend)
          if (tint) origColor.lerp(tint, 0.7);

          // Create toon material (transparent for build progress opacity)
          const toon = new MeshToonMaterial({
            color: origColor,
            transparent: true,
          });
          return toon;
        };
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(applyTint);
        } else {
          mesh.material = applyTint(mesh.material);
        }
      }
    });

    clone.position.set(x, y, z);
    clone.name = `building_${eid}`;
    clone.userData.eid = eid;

    this.applyBuildProgress(clone, progress);

    this.instances.set(eid, clone);
    this.group.add(clone);
    return clone;
  }

  /** Remove and dispose a building (destroyed or torn down). */
  removeBuilding(eid: number): void {
    const obj = this.instances.get(eid);
    if (!obj) return;
    this.group.remove(obj);
    this.disposeObject(obj);
    this.instances.delete(eid);
  }

  getObject(eid: number): THREE.Object3D | undefined {
    return this.instances.get(eid);
  }

  // -----------------------------------------------------------------------
  // Build progress
  // -----------------------------------------------------------------------

  /**
   * Update the visual build progress of a building.
   * 0 = barely visible wireframe feel, 1 = fully opaque.
   */
  updateBuildProgress(eid: number, progress: number): void {
    const obj = this.instances.get(eid);
    if (!obj) return;
    this.applyBuildProgress(obj, progress);
  }

  private applyBuildProgress(obj: THREE.Object3D, progress: number): void {
    // Clamp between 0.15 (minimum visible) and 1.0
    const opacity = 0.15 + Math.min(Math.max(progress, 0), 1) * 0.85;
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          (mat as THREE.Material).opacity = opacity;
          (mat as THREE.Material).transparent = opacity < 0.99;
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // Placement ghost
  // -----------------------------------------------------------------------

  /**
   * Show a semi-transparent ghost building at the given world position.
   * `valid` determines the tint colour (green = can place, red = blocked).
   */
  showGhost(type: BuildingTypeName, factionId: number, x: number, y: number, z: number, valid: boolean): void {
    const key: ModelCacheKey = `${type}_${factionId}`;
    const source = this.modelCache.get(key);
    if (!source) return;

    // Reuse ghost if already showing the same type; otherwise recreate
    if (!this.ghost || this.ghost.userData.ghostKey !== key) {
      this.hideGhost();
      const clone = source.clone(true);
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => {
              const c = m.clone();
              c.transparent = true;
              c.opacity = GHOST_OPACITY;
              c.depthWrite = false;
              return c;
            });
          } else {
            const c = mesh.material.clone();
            (c as THREE.Material).transparent = true;
            (c as THREE.Material).opacity = GHOST_OPACITY;
            (c as THREE.Material).depthWrite = false;
            mesh.material = c;
          }
        }
      });
      clone.userData.ghostKey = key;
      this.ghost = clone;
      this.group.add(clone);
    }

    this.ghost.position.set(x, y, z);
    this.ghostValid = valid;
    this.tintGhost(valid);
  }

  /** Hide and dispose the placement ghost. */
  hideGhost(): void {
    if (!this.ghost) return;
    this.group.remove(this.ghost);
    this.disposeObject(this.ghost);
    this.ghost = null;
  }

  private tintGhost(valid: boolean): void {
    if (!this.ghost) return;
    const color = valid ? GHOST_VALID_COLOR : GHOST_INVALID_COLOR;
    this.ghost.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          if (mat instanceof MeshToonMaterial || mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
            mat.emissive.copy(color);
            mat.emissiveIntensity = 0.5;
          }
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // Per-frame sync
  // -----------------------------------------------------------------------

  /**
   * Sync ECS building transforms, production indicators, and damage tint.
   */
  update(
    dt: number,
    buildings: ReadonlyArray<{
      eid: number;
      x: number;
      y: number;
      z: number;
      progress: number;
      isProducing?: boolean;
      hpRatio?: number;
    }>,
  ): void {
    this.elapsedTime += dt;

    // Track which eids are producing this frame
    const producingEids = new Set<number>();

    for (const data of buildings) {
      const obj = this.instances.get(data.eid);
      if (!obj) continue;
      obj.position.set(data.x, data.y, data.z);
      this.applyBuildProgress(obj, data.progress);

      // Damage tint: apply red emissive based on HP ratio
      if (data.hpRatio !== undefined && data.hpRatio < 1.0) {
        const intensity = (1.0 - data.hpRatio) * MAX_DAMAGE_EMISSIVE_INTENSITY;
        this.applyDamageTint(obj, intensity);
      } else {
        this.applyDamageTint(obj, 0);
      }

      // Production indicator
      if (data.isProducing) {
        producingEids.add(data.eid);
        let gear = this.gearIndicators.get(data.eid);
        if (!gear) {
          gear = new THREE.Mesh(this.gearGeo, this.gearMat);
          gear.renderOrder = 3;
          this.gearIndicators.set(data.eid, gear);
          this.group.add(gear);
        }
        gear.visible = true;
        gear.position.set(data.x, data.y + GEAR_Y_OFFSET, data.z);
        gear.rotation.z = this.elapsedTime * GEAR_SPIN_SPEED;
        // Face camera (billboard-like but just rotate on local axes)
        gear.rotation.x = -Math.PI / 4;
      }
    }

    // Hide gears for buildings no longer producing
    for (const [eid, gear] of this.gearIndicators) {
      if (!producingEids.has(eid)) {
        gear.visible = false;
      }
    }
  }

  /**
   * Apply red damage tint to building materials.
   */
  private applyDamageTint(obj: THREE.Object3D, intensity: number): void {
    obj.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat instanceof MeshToonMaterial || mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
          if (intensity > 0.01) {
            mat.emissive.copy(DAMAGE_TINT_COLOR);
            mat.emissiveIntensity = intensity;
          } else {
            mat.emissive.setScalar(0);
            mat.emissiveIntensity = 0;
          }
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  destroy(): void {
    this.hideGhost();

    for (const [, obj] of this.instances) {
      this.group.remove(obj);
      this.disposeObject(obj);
    }
    this.instances.clear();

    // Dispose gear indicators
    for (const [, gear] of this.gearIndicators) {
      this.group.remove(gear);
    }
    this.gearIndicators.clear();
    this.gearGeo.dispose();
    this.gearMat.dispose();

    for (const [, root] of this.modelCache) {
      this.disposeObject(root);
    }
    this.modelCache.clear();
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          mat.dispose();
        }
      }
    });
  }
}
