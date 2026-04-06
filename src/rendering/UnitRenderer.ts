/**
 * UnitRenderer.ts
 * Renders unit models using InstancedMesh for high-performance batched rendering.
 * One InstancedMesh per (unitType, factionId) combination.
 * Maintains lightweight proxy Object3Ds for raycasting compatibility.
 */

import * as THREE from 'three';
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

/** Selection highlight color (green tint on instance color). */
const SELECTION_COLOR = new THREE.Color(0.4, 1.0, 0.4);

/** Damage flash: red flash for 0.1s when a unit takes damage. */
const DAMAGE_FLASH_DURATION = 0.1;
const DAMAGE_FLASH_COLOR = new THREE.Color(1.0, 0.2, 0.2);

/** Default (neutral) instance color: white = no tinting. */
const DEFAULT_COLOR = new THREE.Color(1, 1, 1);

/** Idle bob: gentle up-and-down movement for idle units. */
const IDLE_BOB_AMPLITUDE = 0.08;
const IDLE_BOB_SPEED = 2.5;

/** Blob shadow parameters. */
const BLOB_SHADOW_SIZE = 0.6;
const BLOB_SHADOW_OPACITY = 0.2;

/** Maximum instances per (unitType, faction) bucket. */
const MAX_INSTANCES_PER_BUCKET = 128;

/** Size of the invisible hit-proxy box for raycasting (world units). */
const HIT_PROXY_SIZE = 0.8;
const HIT_PROXY_HEIGHT = 1.6;

// ---------------------------------------------------------------------------
// Internal: per-bucket data for one InstancedMesh
// ---------------------------------------------------------------------------

/** Tracks one InstancedMesh and the entities mapped into it. */
interface InstanceBucket {
  /** The InstancedMesh added to the scene. */
  mesh: THREE.InstancedMesh;
  /** Entity ID -> instance index within this bucket. */
  entityToIndex: Map<number, number>;
  /** Instance index -> entity ID (inverse mapping). */
  indexToEntity: Map<number, number>;
  /** Current number of active instances. */
  activeCount: number;
  /** Per-instance override scale (e.g. 1.8 for heroes). Defaults to 1.0. */
  instanceScales: Map<number, number>;
}

/**
 * Extract all meshes from a GLB scene and merge their geometries into a single
 * BufferGeometry + material. For models with a single mesh this is trivial;
 * for multi-mesh models we take the first mesh (consistent with PropRenderer).
 */
function extractFirstMesh(
  root: THREE.Group,
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  let found: THREE.Mesh | null = null;
  root.traverse((child) => {
    if (!found && (child as THREE.Mesh).isMesh) {
      found = child as THREE.Mesh;
    }
  });
  if (!found) return null;
  const mesh = found as THREE.Mesh;

  // Clone geometry so we can bake the mesh's world transform into it
  const geo = mesh.geometry.clone();
  mesh.updateWorldMatrix(true, false);
  geo.applyMatrix4(mesh.matrixWorld);

  const mat = Array.isArray(mesh.material)
    ? (mesh.material as THREE.Material[])[0]
    : (mesh.material as THREE.Material);

  return { geometry: geo, material: mat.clone() };
}

// ---------------------------------------------------------------------------
// UnitRenderer
// ---------------------------------------------------------------------------

export class UnitRenderer {
  /** Loaded & parsed source models (for reference / disposal). */
  private modelCache = new Map<ModelCacheKey, THREE.Group>();
  /** Track which models are v02 (keep PBR materials, no toon conversion). */
  private v02Models = new Set<ModelCacheKey>();
  /** InstancedMesh buckets keyed by ModelCacheKey. */
  private buckets = new Map<ModelCacheKey, InstanceBucket>();
  /** Entity id -> lightweight proxy Object3D (for raycasting + entityMeshMap compat). */
  private proxies = new Map<number, THREE.Object3D>();
  /** Entity id -> which bucket key it belongs to. */
  private entityBucketKey = new Map<number, ModelCacheKey>();
  /** Shared loader instance. */
  private loader = new GLTFLoader();
  /** Scene group that hosts all unit meshes. */
  private group: THREE.Group;

  /** Reusable temporaries to avoid per-frame allocations. */
  private _vec = new THREE.Vector3();
  private _mat4 = new THREE.Matrix4();
  private _pos = new THREE.Vector3();
  private _quat = new THREE.Quaternion();
  private _scale = new THREE.Vector3();
  private _euler = new THREE.Euler();
  private _color = new THREE.Color();

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

  /** Shared invisible hit-proxy geometry + material for raycasting. */
  private hitProxyGeo: THREE.BoxGeometry;
  private hitProxyMat: THREE.MeshBasicMaterial;

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

    // Hit-proxy: invisible box used only for raycasting
    this.hitProxyGeo = new THREE.BoxGeometry(HIT_PROXY_SIZE, HIT_PROXY_HEIGHT, HIT_PROXY_SIZE);
    this.hitProxyMat = new THREE.MeshBasicMaterial({
      visible: false,
      // Keeps the mesh in the scene graph for raycasting but never drawn
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

  /** Pre-load all unit GLB models (v02 with v01 fallback) and create InstancedMeshes. */
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
        const cacheKey = key as ModelCacheKey;
        if (isV02) this.v02Models.add(cacheKey);

        // v02 models are larger — use smaller scale; v01 needs upscale
        const scaleFactor = isV02 ? 0.5 : 1.5;
        root.scale.set(scaleFactor, scaleFactor, scaleFactor);
        root.updateMatrixWorld(true);

        // Enable shadow casting on all child meshes
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
        });

        this.modelCache.set(cacheKey, root);

        // Build InstancedMesh for this model key
        this.createBucket(cacheKey, root, isV02);
      }),
    );
    await Promise.all(promises);
  }

  /**
   * Create an InstancedMesh bucket from the loaded GLB root.
   */
  private createBucket(key: ModelCacheKey, root: THREE.Group, isV02: boolean): void {
    const data = extractFirstMesh(root);
    if (!data) {
      console.warn(`[UnitRenderer] GLB has no mesh children for key "${key}"`);
      return;
    }

    // Determine faction from key (e.g. "worker_0" -> factionId = 0)
    const factionId = parseInt(key.split('_')[1], 10);

    // Prepare material: v02 keeps PBR, v01 gets faction tint baked in
    let material = data.material;
    if (!isV02) {
      const tint = FACTION_TINTS[factionId];
      const origColor = ('color' in material && (material as THREE.MeshStandardMaterial).color instanceof THREE.Color)
        ? (material as THREE.MeshStandardMaterial).color.clone()
        : new THREE.Color(0x888888);
      if (tint) origColor.lerp(tint, 0.4);
      material = new THREE.MeshStandardMaterial({
        color: origColor,
        roughness: 0.8,
        metalness: 0.1,
      });
    }

    const im = new THREE.InstancedMesh(data.geometry, material, MAX_INSTANCES_PER_BUCKET);
    im.count = 0; // Start empty — we grow as units spawn
    im.castShadow = true;
    im.receiveShadow = false;
    im.frustumCulled = true;
    im.name = `instanced_${key}`;

    // Initialize instanceColor buffer (required for setColorAt)
    // Three.js doesn't create it by default — we must allocate it
    im.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_INSTANCES_PER_BUCKET * 3),
      3,
    );
    // Fill with white (neutral)
    for (let i = 0; i < MAX_INSTANCES_PER_BUCKET; i++) {
      im.setColorAt(i, DEFAULT_COLOR);
    }
    im.instanceColor.needsUpdate = true;

    this.group.add(im);

    const bucket: InstanceBucket = {
      mesh: im,
      entityToIndex: new Map(),
      indexToEntity: new Map(),
      activeCount: 0,
      instanceScales: new Map(),
    };
    this.buckets.set(key, bucket);
  }

  // -----------------------------------------------------------------------
  // Instance management
  // -----------------------------------------------------------------------

  /**
   * Create a visible unit instance for an ECS entity.
   * Returns a lightweight proxy Object3D so the caller can set initial position,
   * userData.eid, and store it in entityMeshMap for raycasting.
   */
  addUnit(eid: number, type: UnitTypeName, factionId: number): THREE.Object3D | null {
    if (this.proxies.has(eid)) return this.proxies.get(eid)!;

    const key: ModelCacheKey = `${type}_${factionId}`;
    const bucket = this.buckets.get(key);
    if (!bucket) {
      console.warn(`[UnitRenderer] No InstancedMesh bucket for key "${key}"`);
      return null;
    }

    if (bucket.activeCount >= MAX_INSTANCES_PER_BUCKET) {
      console.warn(`[UnitRenderer] Instance limit (${MAX_INSTANCES_PER_BUCKET}) reached for "${key}"`);
      return null;
    }

    // Assign next instance slot
    const instanceIndex = bucket.activeCount;
    bucket.entityToIndex.set(eid, instanceIndex);
    bucket.indexToEntity.set(instanceIndex, eid);
    bucket.activeCount++;
    bucket.mesh.count = bucket.activeCount;
    this.entityBucketKey.set(eid, key);

    // Set initial matrix (identity at origin — caller will set position)
    this._mat4.identity();
    bucket.mesh.setMatrixAt(instanceIndex, this._mat4);
    bucket.mesh.instanceMatrix.needsUpdate = true;

    // Set initial color to white (neutral)
    bucket.mesh.setColorAt(instanceIndex, DEFAULT_COLOR);
    if (bucket.mesh.instanceColor) bucket.mesh.instanceColor.needsUpdate = true;

    // Create a lightweight proxy Object3D for raycasting compatibility.
    // This is an invisible mesh that the caller's entityMeshMap and raycaster
    // can interact with normally (intersectObjects, userData.eid walk-up).
    const proxy = new THREE.Mesh(this.hitProxyGeo, this.hitProxyMat);
    proxy.name = `unit_${eid}`;
    proxy.userData.eid = eid;
    // The proxy intercepts `.scale` sets from the caller (e.g. heroes at 1.8x).
    // We watch for scale changes via a custom setter on userData.
    this.proxies.set(eid, proxy);
    this.group.add(proxy);

    // Create blob shadow for this unit
    const shadow = new THREE.Mesh(this.blobShadowGeo, this.blobShadowMat);
    shadow.renderOrder = 1;
    this.blobShadows.set(eid, shadow);
    this.group.add(shadow);

    return proxy;
  }

  /** Remove and dispose the mesh instance of a dead / removed entity. */
  removeUnit(eid: number): void {
    const key = this.entityBucketKey.get(eid);
    if (!key) return;

    const bucket = this.buckets.get(key);
    if (bucket) {
      const index = bucket.entityToIndex.get(eid);
      if (index !== undefined) {
        // Swap-remove: move the last active instance into this slot
        const lastIndex = bucket.activeCount - 1;

        if (index !== lastIndex) {
          // Copy last instance's matrix and color into the removed slot
          const lastEid = bucket.indexToEntity.get(lastIndex);
          if (lastEid !== undefined) {
            // Copy matrix
            bucket.mesh.getMatrixAt(lastIndex, this._mat4);
            bucket.mesh.setMatrixAt(index, this._mat4);

            // Copy color
            if (bucket.mesh.instanceColor) {
              bucket.mesh.getColorAt(lastIndex, this._color);
              bucket.mesh.setColorAt(index, this._color);
            }

            // Update mappings for the swapped entity
            bucket.entityToIndex.set(lastEid, index);
            bucket.indexToEntity.set(index, lastEid);
          }
        }

        // Remove the now-vacated last slot
        bucket.entityToIndex.delete(eid);
        bucket.indexToEntity.delete(lastIndex);
        bucket.instanceScales.delete(eid);
        bucket.activeCount--;
        bucket.mesh.count = bucket.activeCount;
        bucket.mesh.instanceMatrix.needsUpdate = true;
        if (bucket.mesh.instanceColor) bucket.mesh.instanceColor.needsUpdate = true;
      }
    }

    this.entityBucketKey.delete(eid);

    // Remove proxy
    const proxy = this.proxies.get(eid);
    if (proxy) {
      this.group.remove(proxy);
      this.proxies.delete(eid);
    }

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

  /** Get the proxy Three.js object for an entity (used by RenderSyncSystem / entityMeshMap). */
  getObject(eid: number): THREE.Object3D | undefined {
    return this.proxies.get(eid);
  }

  // -----------------------------------------------------------------------
  // Per-frame updates
  // -----------------------------------------------------------------------

  /**
   * Sync ECS Position/Rotation data into InstancedMesh transforms.
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

    // Track which buckets need matrix/color updates
    const dirtyMatrixBuckets = new Set<ModelCacheKey>();
    const dirtyColorBuckets = new Set<ModelCacheKey>();

    for (const data of positions) {
      const key = this.entityBucketKey.get(data.eid);
      if (!key) continue;
      const bucket = this.buckets.get(key);
      if (!bucket) continue;
      const instanceIndex = bucket.entityToIndex.get(data.eid);
      if (instanceIndex === undefined) continue;

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

      // --- Facing direction ---
      let facingY = data.ry;
      if (data.targetX !== undefined && data.targetZ !== undefined) {
        this._vec.set(data.targetX - data.x, 0, data.targetZ - data.z);
        if (this._vec.lengthSq() > 0.01) {
          facingY = Math.atan2(this._vec.x, this._vec.z);
        }
      }

      // --- Walking sway & forward lean ---
      const swayPhase = (data.eid * 0.9) % (Math.PI * 2);
      const sway = Math.sin(this.elapsedTime * 4 + swayPhase) * 0.03 * blend;
      const forwardLean = blend * 0.05;

      // --- Idle breathing: subtle Y-axis scale pulse ---
      const breathe = Math.sin(this.elapsedTime * Math.PI * 2 + data.eid * 0.5) * 0.02 * (1 - blend);

      // --- Compose instance matrix ---
      // Position: terrain height + offset to clear terrain + procedural bob
      this._pos.set(data.x, data.y + 0.5 + bob, data.z);

      // Rotation: facing Y + sway Z + forward lean X
      this._euler.set(forwardLean, facingY, sway);
      this._quat.setFromEuler(this._euler);

      // Scale: check if caller set a custom scale on the proxy (e.g. heroes)
      // Also apply idle breathing on Y axis
      const proxy = this.proxies.get(data.eid);
      const baseScale = proxy ? proxy.scale.x : 1.0;
      // Store per-entity scale if it differs from 1 (for heroes etc.)
      if (baseScale !== 1.0) {
        bucket.instanceScales.set(data.eid, baseScale);
      }
      const entityScale = bucket.instanceScales.get(data.eid) ?? 1.0;
      this._scale.set(entityScale, entityScale * (1.0 + breathe), entityScale);

      this._mat4.compose(this._pos, this._quat, this._scale);
      bucket.mesh.setMatrixAt(instanceIndex, this._mat4);
      dirtyMatrixBuckets.add(key);

      // --- Sync proxy position (for raycasting / entityMeshMap position queries) ---
      if (proxy) {
        proxy.position.set(data.x, data.y + 0.5 + bob, data.z);
        proxy.rotation.y = facingY;
      }

      // --- Instance color: selection highlight / damage flash ---
      const isFlashing = this.damageFlashTimers.has(data.eid);
      if (isFlashing) {
        bucket.mesh.setColorAt(instanceIndex, DAMAGE_FLASH_COLOR);
        dirtyColorBuckets.add(key);
      } else if (data.selected) {
        bucket.mesh.setColorAt(instanceIndex, SELECTION_COLOR);
        dirtyColorBuckets.add(key);
      } else {
        // Reset to neutral white
        bucket.mesh.setColorAt(instanceIndex, DEFAULT_COLOR);
        dirtyColorBuckets.add(key);
      }

      // --- Sync blob shadow position (slightly above ground) ---
      const shadow = this.blobShadows.get(data.eid);
      if (shadow) {
        shadow.position.set(data.x, data.y + 0.05, data.z);
      }
    }

    // Flush dirty buffers once per bucket (not per entity)
    for (const key of dirtyMatrixBuckets) {
      const bucket = this.buckets.get(key);
      if (bucket) {
        bucket.mesh.instanceMatrix.needsUpdate = true;
      }
    }
    for (const key of dirtyColorBuckets) {
      const bucket = this.buckets.get(key);
      if (bucket?.mesh.instanceColor) {
        bucket.mesh.instanceColor.needsUpdate = true;
      }
    }
  }

  /**
   * Trigger a damage flash on a unit (called when HP decreases).
   */
  triggerDamageFlash(eid: number): void {
    this.damageFlashTimers.set(eid, DAMAGE_FLASH_DURATION);

    // Apply flash color immediately
    const key = this.entityBucketKey.get(eid);
    if (!key) return;
    const bucket = this.buckets.get(key);
    if (!bucket) return;
    const index = bucket.entityToIndex.get(eid);
    if (index === undefined) return;

    bucket.mesh.setColorAt(index, DAMAGE_FLASH_COLOR);
    if (bucket.mesh.instanceColor) bucket.mesh.instanceColor.needsUpdate = true;
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
  // Cleanup
  // -----------------------------------------------------------------------

  /** Dispose all GPU resources held by this renderer. */
  destroy(): void {
    // Dispose all InstancedMesh buckets
    for (const [, bucket] of this.buckets) {
      this.group.remove(bucket.mesh);
      bucket.mesh.geometry.dispose();
      const mats = Array.isArray(bucket.mesh.material)
        ? bucket.mesh.material
        : [bucket.mesh.material];
      for (const mat of mats) mat.dispose();
      bucket.mesh.dispose();
      bucket.entityToIndex.clear();
      bucket.indexToEntity.clear();
      bucket.instanceScales.clear();
    }
    this.buckets.clear();

    // Dispose proxies
    for (const [, proxy] of this.proxies) {
      this.group.remove(proxy);
    }
    this.proxies.clear();
    this.entityBucketKey.clear();

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

    // Dispose hit-proxy shared resources
    this.hitProxyGeo.dispose();
    this.hitProxyMat.dispose();

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
    this.v02Models.clear();
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
