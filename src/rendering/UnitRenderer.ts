/**
 * UnitRenderer.ts
 * Loads GLB unit models, clones per entity, syncs transforms from ECS,
 * highlights selected units and faces them toward their movement target.
 */

import * as THREE from 'three';
import { MeshToonMaterial } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The three unit types available in the PoC. */
export type UnitTypeName = 'worker' | 'infantry' | 'ranged';

/** Faction identifier as stored in the ECS Faction.id component. */
export const FACTION_ORANGE = 0;
export const FACTION_BLUE = 1;

/** Unique cache key for a unit model. */
type ModelCacheKey = `${UnitTypeName}_${number}`;

/** Map of model GLB asset paths — v02 (Meshy v6 production) with v01 fallback. */
const UNIT_MODEL_PATHS: Record<string, string> = {
  worker_0: 'assets/models/v02/brabanders/worker.glb',
  worker_1: 'assets/models/v02/randstad/worker.glb',
  infantry_0: 'assets/models/v02/brabanders/infantry.glb',
  infantry_1: 'assets/models/v02/randstad/infantry.glb',
  ranged_0: 'assets/models/v02/brabanders/ranged.glb',
  ranged_1: 'assets/models/v02/randstad/ranged.glb',
};

const UNIT_MODEL_FALLBACKS: Record<string, string> = {
  worker_0: 'assets/models/v01/brabanders/worker.glb',
  worker_1: 'assets/models/v01/randstad/worker.glb',
  infantry_0: 'assets/models/v01/brabanders/infantry.glb',
  infantry_1: 'assets/models/v01/randstad/infantry.glb',
  ranged_0: 'assets/models/v01/brabanders/ranged.glb',
  ranged_1: 'assets/models/v01/randstad/ranged.glb',
};

/** Faction team colors: applied as a strong tint to unit materials. */
const FACTION_TINTS: Record<number, THREE.Color> = {
  [FACTION_ORANGE]: new THREE.Color(0xff8830), // Brabanders: bright warm orange
  [FACTION_BLUE]: new THREE.Color(0x4070bb),   // Randstad: clear blue
};

/** Emissive glow colour for selected units. */
const SELECTION_EMISSIVE = new THREE.Color(0x44ff44);
const SELECTION_EMISSIVE_INTENSITY = 0.35;

/** Damage flash: red flash for 0.1s when a unit takes damage. */
const DAMAGE_FLASH_DURATION = 0.1;
const DAMAGE_FLASH_COLOR = new THREE.Color(0xff3333);
const DAMAGE_FLASH_INTENSITY = 0.8;

/** Idle bob: gentle up-and-down movement for idle units. */
const IDLE_BOB_AMPLITUDE = 0.08;
const IDLE_BOB_SPEED = 2.5;

/** Blob shadow parameters. */
const BLOB_SHADOW_SIZE = 1.2;
const BLOB_SHADOW_OPACITY = 0.35;

// ---------------------------------------------------------------------------
// UnitRenderer
// ---------------------------------------------------------------------------

export class UnitRenderer {
  /** Loaded & parsed source models ready to be cloned. */
  private modelCache = new Map<ModelCacheKey, THREE.Group>();
  /** Track which models are v02 (keep PBR materials, no toon conversion). */
  private v02Models = new Set<ModelCacheKey>();
  /** Entity id -> cloned scene root living in the scene graph. */
  private instances = new Map<number, THREE.Object3D>();
  /** Shared loader instance. */
  private loader = new GLTFLoader();
  /** Scene group that hosts all unit meshes. */
  private group: THREE.Group;
  /** Reusable vector to avoid per-frame allocations. */
  private _vec = new THREE.Vector3();

  /** Damage flash timers: eid -> remaining seconds. */
  private damageFlashTimers = new Map<number, number>();
  /** Previous positions for movement detection. */
  private prevPositions = new Map<number, { x: number; z: number }>();
  /** Movement blend factor per unit: 0 = idle, 1 = walking. */
  private moveBlend = new Map<number, number>();
  /** Blob shadow meshes: eid -> shadow mesh. */
  private blobShadows = new Map<number, THREE.Mesh>();
  /** Shared blob shadow geometry + material. */
  private blobShadowGeo: THREE.CircleGeometry;
  private blobShadowMat: THREE.MeshBasicMaterial;
  /** Elapsed time for idle bob calculation. */
  private elapsedTime = 0;

  /** Move indicator: green circle showing where a move command was issued. */
  private moveIndicator: THREE.Mesh | null = null;
  private moveIndicatorTimer = 0;

  constructor(parentGroup: THREE.Group) {
    this.group = parentGroup;

    // Pre-create shared blob shadow resources
    this.blobShadowGeo = new THREE.CircleGeometry(BLOB_SHADOW_SIZE, 12);
    this.blobShadowGeo.rotateX(-Math.PI / 2);
    this.blobShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: BLOB_SHADOW_OPACITY,
      depthWrite: false,
    });

    // Move indicator (hidden by default)
    const moveGeo = new THREE.RingGeometry(0.6, 0.9, 16);
    moveGeo.rotateX(-Math.PI / 2);
    const moveMat = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.moveIndicator = new THREE.Mesh(moveGeo, moveMat);
    this.moveIndicator.visible = false;
    this.moveIndicator.renderOrder = 2;
    this.group.add(this.moveIndicator);
  }

  // -----------------------------------------------------------------------
  // Asset loading
  // -----------------------------------------------------------------------

  /** Pre-load all unit GLB models (v02 with v01 fallback). */
  async preload(): Promise<void> {
    const entries = Object.entries(UNIT_MODEL_PATHS);
    const promises = entries.map(([key, path]) =>
      this.loader.loadAsync(path).catch(() => {
        const fallback = UNIT_MODEL_FALLBACKS[key];
        if (fallback) return this.loader.loadAsync(fallback);
        throw new Error(`No model found for ${key}`);
      }).then((gltf: GLTF) => {
        const root = gltf.scene;
        const isV02 = path.includes('/v02/');
        if (isV02) this.v02Models.add(key as ModelCacheKey);
        // v02 models are larger — use smaller scale; v01 needs upscale
        root.scale.set(isV02 ? 0.5 : 1.5, isV02 ? 0.5 : 1.5, isV02 ? 0.5 : 1.5);
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
   * Create a visible unit mesh for an ECS entity by cloning the cached model.
   * Returns the root Object3D so the caller can store a reference if needed.
   */
  addUnit(eid: number, type: UnitTypeName, factionId: number): THREE.Object3D | null {
    if (this.instances.has(eid)) return this.instances.get(eid)!;

    const key: ModelCacheKey = `${type}_${factionId}`;
    const source = this.modelCache.get(key);
    if (!source) {
      console.warn(`[UnitRenderer] No cached model for key "${key}"`);
      return null;
    }

    const clone = source.clone(true);
    const isV02 = this.v02Models.has(key);
    const tint = FACTION_TINTS[factionId];

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (isV02) {
          // v02: keep original PBR materials, just clone to avoid shared state
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => m.clone());
          } else {
            mesh.material = mesh.material.clone();
          }
        } else {
          // v01: convert to toon material with faction tint
          const applyTint = (m: THREE.Material): THREE.Material => {
            const origColor = ('color' in m && m.color instanceof THREE.Color)
              ? m.color.clone()
              : new THREE.Color(0x888888);
            if (tint) origColor.lerp(tint, 0.7);
            return new MeshToonMaterial({ color: origColor, transparent: false });
          };
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(applyTint);
          } else {
            mesh.material = applyTint(mesh.material);
          }
        }
      }
    });

    clone.name = `unit_${eid}`;
    (clone as THREE.Object3D).userData.eid = eid;
    this.instances.set(eid, clone);
    this.group.add(clone);

    // Create blob shadow for this unit
    const shadow = new THREE.Mesh(this.blobShadowGeo, this.blobShadowMat);
    shadow.renderOrder = 1;
    this.blobShadows.set(eid, shadow);
    this.group.add(shadow);

    return clone;
  }

  /** Remove and dispose the mesh of a dead / removed entity. */
  removeUnit(eid: number): void {
    const obj = this.instances.get(eid);
    if (!obj) return;
    this.group.remove(obj);
    this.disposeObject(obj);
    this.instances.delete(eid);

    // Remove blob shadow
    const shadow = this.blobShadows.get(eid);
    if (shadow) {
      this.group.remove(shadow);
      this.blobShadows.delete(eid);
    }
    // Clean up per-unit state
    this.damageFlashTimers.delete(eid);
    this.prevPositions.delete(eid);
    this.moveBlend.delete(eid);
  }

  /** Get the Three.js object for an entity (used by RenderSyncSystem). */
  getObject(eid: number): THREE.Object3D | undefined {
    return this.instances.get(eid);
  }

  // -----------------------------------------------------------------------
  // Per-frame updates
  // -----------------------------------------------------------------------

  /**
   * Sync ECS Position/Rotation data into Three.js transforms.
   * Called once per frame by RenderSyncSystem.
   *
   * @param dt Delta time in seconds.
   * @param positions - array of { eid, x, y, z, ry, selected, isIdle, targetX?, targetZ? }
   */
  update(
    dt: number,
    positions: ReadonlyArray<{
      eid: number;
      x: number;
      y: number;
      z: number;
      ry: number;
      selected: boolean;
      isIdle?: boolean;
      targetX?: number;
      targetZ?: number;
    }>,
  ): void {
    this.elapsedTime += dt;

    // Update damage flash timers
    for (const [eid, remaining] of this.damageFlashTimers) {
      const newRemaining = remaining - dt;
      if (newRemaining <= 0) {
        this.damageFlashTimers.delete(eid);
        // Clear flash emissive (will be re-set by highlight logic below)
        const obj = this.instances.get(eid);
        if (obj) this.clearDamageFlash(obj);
      } else {
        this.damageFlashTimers.set(eid, newRemaining);
      }
    }

    // Update move indicator fade
    if (this.moveIndicator && this.moveIndicator.visible) {
      this.moveIndicatorTimer -= dt;
      if (this.moveIndicatorTimer <= 0) {
        this.moveIndicator.visible = false;
      } else {
        (this.moveIndicator.material as THREE.MeshBasicMaterial).opacity =
          Math.min(0.6, this.moveIndicatorTimer * 2);
      }
    }

    for (const data of positions) {
      const obj = this.instances.get(data.eid);
      if (!obj) continue;

      // --- Movement detection ---
      const prev = this.prevPositions.get(data.eid);
      const isMoving = prev !== undefined &&
        (Math.abs(data.x - prev.x) > 0.01 || Math.abs(data.z - prev.z) > 0.01);
      if (prev) {
        prev.x = data.x;
        prev.z = data.z;
      } else {
        this.prevPositions.set(data.eid, { x: data.x, z: data.z });
      }

      // --- Smooth blend between idle (0) and walking (1) ---
      const blendTarget = isMoving ? 1.0 : 0.0;
      const blendCurrent = this.moveBlend.get(data.eid) ?? 0;
      const blend = blendCurrent + (blendTarget - blendCurrent) * Math.min(dt * 8, 1);
      this.moveBlend.set(data.eid, blend);

      // --- Procedural animation ---
      // Idle bob: gentle sine wave with per-unit phase offset
      const idlePhase = (data.eid * 0.7) % (Math.PI * 2);
      const idleBob = Math.sin(this.elapsedTime * IDLE_BOB_SPEED + idlePhase) * IDLE_BOB_AMPLITUDE;

      // Walk bob: bouncy footstep using abs(sin) for double-frequency bounce
      const walkPhase = (data.eid * 1.3) % (Math.PI * 2);
      const walkBob = Math.abs(Math.sin(this.elapsedTime * 8 + walkPhase)) * 0.12;

      // Blend between idle and walk bob
      const bob = idleBob * (1 - blend) + walkBob * blend;

      // Idle breathing: subtle Y-axis scale pulse (0.98 - 1.02 at 1 Hz)
      // Fades out when walking via (1 - blend)
      const breathe = Math.sin(this.elapsedTime * Math.PI * 2 + data.eid * 0.5) * 0.02 * (1 - blend);
      obj.scale.y = 1.0 + breathe;

      // Apply Y position: terrain height + procedural bob
      obj.position.set(data.x, data.y + bob, data.z);

      // --- Facing direction ---
      // Prefer movement target if supplied, else use ry
      if (data.targetX !== undefined && data.targetZ !== undefined) {
        this._vec.set(data.targetX - data.x, 0, data.targetZ - data.z);
        if (this._vec.lengthSq() > 0.01) {
          obj.rotation.y = Math.atan2(this._vec.x, this._vec.z);
        }
      } else {
        obj.rotation.y = data.ry;
      }

      // --- Walking sway & forward lean ---
      // Side-to-side sway (half step frequency = 4 Hz)
      const swayPhase = (data.eid * 0.9) % (Math.PI * 2);
      const sway = Math.sin(this.elapsedTime * 4 + swayPhase) * 0.03 * blend;
      obj.rotation.z = sway;

      // Forward lean when moving (~3 degrees)
      obj.rotation.x = blend * 0.05;

      // --- Selection highlight / damage flash ---
      const isFlashing = this.damageFlashTimers.has(data.eid);
      if (isFlashing) {
        this.applyDamageFlash(obj);
      } else {
        this.setHighlight(obj, data.selected);
      }

      // Sync blob shadow position (slightly above ground)
      const shadow = this.blobShadows.get(data.eid);
      if (shadow) {
        shadow.position.set(data.x, data.y + 0.03, data.z);
      }
    }
  }

  /**
   * Trigger a damage flash on a unit (called when HP decreases).
   */
  triggerDamageFlash(eid: number): void {
    this.damageFlashTimers.set(eid, DAMAGE_FLASH_DURATION);
    const obj = this.instances.get(eid);
    if (obj) this.applyDamageFlash(obj);
  }

  /**
   * Show a move indicator circle at the given world position.
   */
  showMoveIndicator(x: number, y: number, z: number): void {
    if (!this.moveIndicator) return;
    this.moveIndicator.position.set(x, y + 0.1, z);
    this.moveIndicator.visible = true;
    this.moveIndicatorTimer = 0.5; // visible for 0.5 seconds
    (this.moveIndicator.material as THREE.MeshBasicMaterial).opacity = 0.6;
  }

  // -----------------------------------------------------------------------
  // Selection highlight
  // -----------------------------------------------------------------------

  private setHighlight(obj: THREE.Object3D, highlighted: boolean): void {
    obj.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat instanceof MeshToonMaterial || mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
          if (highlighted) {
            mat.emissive.copy(SELECTION_EMISSIVE);
            mat.emissiveIntensity = SELECTION_EMISSIVE_INTENSITY;
          } else {
            mat.emissive.setScalar(0);
            mat.emissiveIntensity = 0;
          }
        }
      }
    });
  }

  private applyDamageFlash(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat instanceof MeshToonMaterial || mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
          mat.emissive.copy(DAMAGE_FLASH_COLOR);
          mat.emissiveIntensity = DAMAGE_FLASH_INTENSITY;
        }
      }
    });
  }

  private clearDamageFlash(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat instanceof MeshToonMaterial || mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
          mat.emissive.setScalar(0);
          mat.emissiveIntensity = 0;
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  /** Dispose all GPU resources held by this renderer. */
  destroy(): void {
    for (const [, obj] of this.instances) {
      this.group.remove(obj);
      this.disposeObject(obj);
    }
    this.instances.clear();

    // Dispose blob shadows
    for (const [, shadow] of this.blobShadows) {
      this.group.remove(shadow);
    }
    this.blobShadows.clear();
    this.blobShadowGeo.dispose();
    this.blobShadowMat.dispose();
    this.damageFlashTimers.clear();
    this.prevPositions.clear();
    this.moveBlend.clear();

    // Dispose move indicator
    if (this.moveIndicator) {
      this.group.remove(this.moveIndicator);
      this.moveIndicator.geometry.dispose();
      (this.moveIndicator.material as THREE.Material).dispose();
      this.moveIndicator = null;
    }

    // Dispose source models in cache
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
