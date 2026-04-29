/**
 * UnitRenderer.ts
 * Renders unit models using InstancedMesh for high-performance batched rendering.
 * One InstancedMesh per (unitType, factionId) combination.
 * Maintains lightweight proxy Object3Ds for raycasting compatibility.
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Unit types available for rendering (includes hero sub-types per faction). */
export type UnitTypeName = 'worker' | 'infantry' | 'ranged' | 'heavy' | 'siege' | 'support' | 'hero0' | 'hero1';

/** Faction identifier as stored in the ECS Faction.id component. */
export const FACTION_ORANGE = 0;
export const FACTION_BLUE = 1;
export const FACTION_GREEN = 2;
export const FACTION_RED = 3;

/** Unique cache key for a unit model. */
type ModelCacheKey = `${UnitTypeName}_${number}`;

/** Map of model GLB asset paths — v02 (Meshy v6 production) with v01 fallback. */
const UNIT_MODEL_PATHS: Record<string, string> = {
  worker_0: '/assets/models/v02/brabanders/worker.glb',
  worker_1: '/assets/models/v02/randstad/worker.glb',
  infantry_0: '/assets/models/v02/brabanders/infantry.glb',
  infantry_1: '/assets/models/v02/randstad/infantry-v2.glb',
  ranged_0: '/assets/models/v02/brabanders/ranged.glb',
  ranged_1: '/assets/models/v02/randstad/ranged.glb',
  // Limburgers
  worker_2: '/assets/models/v02/limburgers/worker.glb',
  infantry_2: '/assets/models/v02/limburgers/infantry.glb',
  ranged_2: '/assets/models/v02/limburgers/ranged.glb',
  // Belgen
  worker_3: '/assets/models/v02/belgen/worker.glb',
  infantry_3: '/assets/models/v02/belgen/infantry.glb',
  ranged_3: '/assets/models/v02/belgen/ranged.glb',
  // Heavy (dedicated GLBs — Meshy v6 image-to-3D, rigged)
  heavy_0: '/assets/models/v02/brabanders/heavy.glb',  // Tractorrijder
  heavy_1: '/assets/models/v02/randstad/heavy.glb',     // CorporateAdvocaat
  heavy_2: '/assets/models/v02/limburgers/heavy.glb',   // Mergelridder
  heavy_3: '/assets/models/v02/belgen/heavy.glb',       // Frituurridder
  // Siege (Meshy v6 image-to-3D)
  siege_0: '/assets/models/v02/brabanders/siege.glb',   // Tractorrijder kanon
  siege_1: '/assets/models/v02/randstad/siege.glb',      // Vastgoedmakelaar sloopkogel
  siege_2: '/assets/models/v02/limburgers/siege.glb',    // Kolenbrander mijnkar
  siege_3: '/assets/models/v02/belgen/siege.glb',        // Manneken Pis kanon
  // Support (Meshy v6 image-to-3D)
  support_0: '/assets/models/v02/brabanders/support.glb', // Boerinne
  support_1: '/assets/models/v02/randstad/support.glb',   // HR-Medewerker
  support_2: '/assets/models/v02/limburgers/support.glb', // Sjpion
  support_3: '/assets/models/v02/belgen/support.glb',     // Wafelzuster
  // Heroes (static fallback = same as animated path, they are self-contained GLBs)
  hero0_0: '/assets/models/heroes/brabant-prins.glb',
  hero1_0: '/assets/models/heroes/brabant-boer.glb',
  hero0_1: '/assets/models/heroes/randstad-ceo.glb',
  hero1_1: '/assets/models/heroes/randstad-politicus.glb',
  hero0_2: '/assets/models/heroes/limburg-mijnbaas.glb',
  hero1_2: '/assets/models/heroes/limburg-maasmeester.glb',
  hero0_3: '/assets/models/heroes/belgen-frietkoning.glb',
  hero1_3: '/assets/models/heroes/belgen-abdijbrouwer.glb',
};

const UNIT_MODEL_FALLBACKS: Record<string, string> = {
  worker_0: '/assets/models/v01/brabanders/worker.glb',
  worker_1: '/assets/models/v01/randstad/worker.glb',
  infantry_0: '/assets/models/v01/brabanders/infantry.glb',
  infantry_1: '/assets/models/v01/randstad/infantry.glb',
  ranged_0: '/assets/models/v01/brabanders/ranged.glb',
  ranged_1: '/assets/models/v01/randstad/ranged.glb',
  // Limburgers (fallback to Brabanders v01)
  worker_2: '/assets/models/v01/brabanders/worker.glb',
  infantry_2: '/assets/models/v01/brabanders/infantry.glb',
  ranged_2: '/assets/models/v01/brabanders/ranged.glb',
  // Belgen (fallback to Brabanders v01)
  worker_3: '/assets/models/v01/brabanders/worker.glb',
  infantry_3: '/assets/models/v01/brabanders/infantry.glb',
  ranged_3: '/assets/models/v01/brabanders/ranged.glb',
  // Heavy (dedicated GLBs — v02 models used for all quality tiers)
  heavy_0: '/assets/models/v02/brabanders/heavy.glb',
  heavy_1: '/assets/models/v02/randstad/heavy.glb',
  heavy_2: '/assets/models/v02/limburgers/heavy.glb',
  heavy_3: '/assets/models/v02/belgen/heavy.glb',
  // Siege (fallback to heavy)
  siege_0: '/assets/models/v02/brabanders/heavy.glb',
  siege_1: '/assets/models/v02/randstad/heavy.glb',
  siege_2: '/assets/models/v02/limburgers/heavy.glb',
  siege_3: '/assets/models/v02/belgen/heavy.glb',
  // Support (fallback to worker)
  support_0: '/assets/models/v02/brabanders/worker.glb',
  support_1: '/assets/models/v02/randstad/worker.glb',
  support_2: '/assets/models/v02/limburgers/worker.glb',
  support_3: '/assets/models/v02/belgen/worker.glb',
  // Heroes (fallback to infantry of same faction)
  hero0_0: '/assets/models/v02/brabanders/infantry.glb',
  hero1_0: '/assets/models/v02/brabanders/infantry.glb',
  hero0_1: '/assets/models/v02/randstad/infantry.glb',
  hero1_1: '/assets/models/v02/randstad/infantry.glb',
  hero0_2: '/assets/models/v02/limburgers/infantry.glb',
  hero1_2: '/assets/models/v02/limburgers/infantry.glb',
  hero0_3: '/assets/models/v02/belgen/infantry.glb',
  hero1_3: '/assets/models/v02/belgen/infantry.glb',
};

/** Animated model paths — only for (unitType, faction) combos that have skeletal animation. */
const ANIMATED_MODEL_PATHS: Record<string, string> = {
  // Brabanders
  worker_0: '/assets/models/v03/brabanders/worker.glb',
  infantry_0: '/assets/models/v03/brabanders/infantry.glb',
  ranged_0: '/assets/models/v03/brabanders/ranged.glb',
  // Randstad
  worker_1: '/assets/models/v03/randstad/worker.glb',
  infantry_1: '/assets/models/v03/randstad/infantry.glb',
  ranged_1: '/assets/models/v03/randstad/ranged.glb',
  // Limburgers
  worker_2: '/assets/models/v03/limburgers/worker.glb',
  infantry_2: '/assets/models/v03/limburgers/infantry.glb',
  ranged_2: '/assets/models/v03/limburgers/ranged.glb',
  // Belgen
  worker_3: '/assets/models/v03/belgen/worker.glb',
  infantry_3: '/assets/models/v03/belgen/infantry.glb',
  ranged_3: '/assets/models/v03/belgen/ranged.glb',
  // Heavy (dedicated GLBs — same v02 models used for v03 quality tier)
  heavy_0: '/assets/models/v02/brabanders/heavy.glb',
  heavy_1: '/assets/models/v02/randstad/heavy.glb',
  heavy_2: '/assets/models/v02/limburgers/heavy.glb',
  heavy_3: '/assets/models/v02/belgen/heavy.glb',
  // Heroes — unique models per faction (hero0 = primary, hero1 = secondary)
  hero0_0: '/assets/models/heroes/brabant-prins.glb',
  hero1_0: '/assets/models/heroes/brabant-boer.glb',
  hero0_1: '/assets/models/heroes/randstad-ceo.glb',
  hero1_1: '/assets/models/heroes/randstad-politicus.glb',
  hero0_2: '/assets/models/heroes/limburg-mijnbaas.glb',
  hero1_2: '/assets/models/heroes/limburg-maasmeester.glb',
  hero0_3: '/assets/models/heroes/belgen-frietkoning.glb',
  hero1_3: '/assets/models/heroes/belgen-abdijbrouwer.glb',
};

/** UnitAIState values (mirrored from types/index.ts to avoid circular imports). */
const enum AnimUnitAIState {
  Idle = 0,
  Moving = 1,
  Attacking = 2,
  MovingToResource = 3,
  Gathering = 4,
  Returning = 5,
  Dead = 6,
  Stunned = 7,
  Reviving = 8,
}

/** UnitTypeId values (mirrored from types/index.ts to avoid circular imports). */
const enum AnimUnitTypeId {
  Worker = 0,
  Infantry = 1,
  Ranged = 2,
  Heavy = 3,
  Siege = 4,
  Support = 5,
  Special = 6,
  Hero = 7,
}

/** One-shot animation clip names that should not loop. */
const ONE_SHOT_CLIPS = new Set([
  'Attack', 'RangedAttack', 'HeavyAttack', 'SiegeAttack', 'Heal', 'Death',
]);

/**
 * Resolve the best animation clip for a unit based on its AI state,
 * unit type, and which clips are actually available on the model.
 *
 * Falls back gracefully: if the ideal clip doesn't exist, picks
 * a universal fallback (Attack, Idle, Walk).
 */
function resolveAnimation(
  aiState: number | undefined,
  unitTypeId: number | undefined,
  availableClips: Set<string>,
): string {
  // Dead always wins
  if (aiState === AnimUnitAIState.Dead) return 'Death';

  // Movement states
  if (
    aiState === AnimUnitAIState.Moving ||
    aiState === AnimUnitAIState.MovingToResource ||
    aiState === AnimUnitAIState.Returning
  ) {
    return 'Walk';
  }

  // Gathering — workers get Gather clip if available
  if (aiState === AnimUnitAIState.Gathering) {
    if (availableClips.has('Gather')) return 'Gather';
    return 'Idle'; // fallback: no gather animation yet
  }

  // Stunned / Reviving — hold current pose (no dedicated animation yet)
  if (aiState === AnimUnitAIState.Stunned || aiState === AnimUnitAIState.Reviving) {
    return 'Idle';
  }

  // Attacking — unit type determines which attack animation
  if (aiState === AnimUnitAIState.Attacking) {
    // Support units: Heal > Attack (healers "attack" by healing allies)
    if (unitTypeId === AnimUnitTypeId.Support && availableClips.has('Heal')) {
      return 'Heal';
    }
    // Siege units: SiegeAttack > Attack
    if (unitTypeId === AnimUnitTypeId.Siege && availableClips.has('SiegeAttack')) {
      return 'SiegeAttack';
    }
    // Ranged units: RangedAttack > Attack
    if (unitTypeId === AnimUnitTypeId.Ranged && availableClips.has('RangedAttack')) {
      return 'RangedAttack';
    }
    // Heavy units: HeavyAttack > Attack
    if (unitTypeId === AnimUnitTypeId.Heavy && availableClips.has('HeavyAttack')) {
      return 'HeavyAttack';
    }
    return 'Attack'; // universal fallback
  }

  // Idle — siege units get SiegeIdle if available
  if (unitTypeId === AnimUnitTypeId.Siege && availableClips.has('SiegeIdle')) {
    return 'SiegeIdle';
  }

  return 'Idle';
}

/** Template loaded once per (unitType, faction) that has animations. */
interface AnimatedTemplate {
  scene: THREE.Group;
  clips: THREE.AnimationClip[];
}

/** Per animated unit instance. */
interface AnimatedUnit {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  /** Which animation clip names are available on this unit's model. */
  clipNames: Set<string>;
  currentAnim: string;
  prevAnim: string;
  /** Cached spawn-time Y scale so death-tween can restore it. */
  baseScaleY?: number;
}

/** Faction team colors: applied as a strong tint to unit materials. */
const FACTION_TINTS: Record<number, THREE.Color> = {
  [FACTION_ORANGE]: new THREE.Color(0xff8830), // Brabanders: bright warm orange
  [FACTION_BLUE]: new THREE.Color(0x4070bb),   // Randstad: clear blue
  [FACTION_GREEN]: new THREE.Color(0x44dd44),  // Limburgers: bright emerald green
  [FACTION_RED]: new THREE.Color(0xdd3344),    // Belgen: bright crimson red
};

/** Selection highlight color (green tint on instance color). */
const SELECTION_COLOR = new THREE.Color(0.4, 1.0, 0.4);

/** Damage flash: red flash for 0.1s when a unit takes damage. */
const DAMAGE_FLASH_DURATION = 0.1;
const DAMAGE_FLASH_COLOR = new THREE.Color(1.0, 0.2, 0.2);

/** Attack swing animation duration: brief enough that fast attackers chain cleanly. */
const ATTACK_SWING_DURATION = 0.28;
/** Peak forward-lean angle (radians) for melee thrust. */
const MELEE_LEAN_ANGLE = 0.32;
/** Peak backward-lean angle (radians) for ranged bow-pull recoil. */
const RANGED_RECOIL_ANGLE = 0.18;

/** Default (neutral) instance color: white = no tinting. */
const DEFAULT_COLOR = new THREE.Color(1, 1, 1);

/** Buff indicator: golden glow when unit has a stat buff. */
const BUFF_COLOR = new THREE.Color(1.0, 0.85, 0.3);

/** Stun indicator: grey tint when stunned. */
const STUN_COLOR = new THREE.Color(0.5, 0.5, 0.7);

/** Invincible indicator: bright golden shield glow. */
const INVINCIBLE_COLOR = new THREE.Color(1.0, 0.95, 0.5);

/** Idle bob: gentle up-and-down movement for idle units. */
const IDLE_BOB_AMPLITUDE = 0.08;
const IDLE_BOB_SPEED = 2.5;

/** Blob shadow parameters. */
const BLOB_SHADOW_SIZE = 1.0;
const BLOB_SHADOW_OPACITY = 0.2;

/** Maximum instances per (unitType, faction) bucket. */
const MAX_INSTANCES_PER_BUCKET = 128;

/** Size of the invisible hit-proxy box for raycasting (world units). */
const HIT_PROXY_SIZE = 1.2;
const HIT_PROXY_HEIGHT = 2.0;

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
  /** Attack swing animation: eid -> { remaining, isRanged }. */
  private attackSwingTimers = new Map<number, { remaining: number; isRanged: boolean }>();
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

  /** Animated model templates loaded once per (unitType, faction). */
  private animatedTemplates = new Map<ModelCacheKey, AnimatedTemplate>();
  /** Per-entity animated unit instances (eid -> AnimatedUnit). */
  private animatedUnits = new Map<number, AnimatedUnit>();

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

  /** Pre-load unit GLB models (v02 with v01 fallback) and create InstancedMeshes.
   *  @param factions  Optional set of faction IDs to load. If omitted, loads all factions.
   *  @param onProgress  Called after each model finishes loading with (loaded, total) counts.
   */
  async preload(factions?: Set<number>, onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const entries = Object.entries(UNIT_MODEL_PATHS).filter(([key]) => {
      if (!factions) return true;
      const factionId = parseInt(key.split('_')[1], 10);
      return factions.has(factionId);
    });

    const animEntries = Object.entries(ANIMATED_MODEL_PATHS).filter(([key]) => {
      if (!factions) return true;
      const factionId = parseInt(key.split('_')[1], 10);
      return factions.has(factionId);
    });

    let loaded = 0;
    const total = entries.length + animEntries.length;

    const promises = entries.map(([key, path]) =>
      this.loader.loadAsync(path).catch(() => {
        const fallback = UNIT_MODEL_FALLBACKS[key];
        if (fallback) return this.loader.loadAsync(fallback);
        return null;
      }).then((gltf: GLTF | null) => {
        const cacheKey = key as ModelCacheKey;
        const factionId = parseInt(key.split('_')[1], 10);

        if (!gltf) {
          console.warn(`[UnitRenderer] Model load failed for "${key}", using fallback box`);
          this.createFallbackBucket(cacheKey, factionId);
          loaded++;
          onProgress?.(loaded, total);
          return;
        }

        const root = gltf.scene;
        const isV02 = path.includes('/v02/');
        if (isV02) this.v02Models.add(cacheKey);

        const scaleFactor = isV02 ? 1.5 : 1.8;
        root.scale.set(scaleFactor, scaleFactor, scaleFactor);
        root.updateMatrixWorld(true);

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
        });

        this.modelCache.set(cacheKey, root);
        this.createBucket(cacheKey, root, isV02);

        // Verify bucket was created, fallback if extractFirstMesh failed
        if (!this.buckets.has(cacheKey)) {
          console.warn(`[UnitRenderer] No mesh extracted for "${key}", using fallback box`);
          this.createFallbackBucket(cacheKey, factionId);
        }

        loaded++;
        onProgress?.(loaded, total);
      }),
    );
    await Promise.all(promises);

    // Load animated models (skeletal animation GLBs)
    const animPromises = animEntries.map(([key, path]) =>
      this.loader.loadAsync(path).then((gltf: GLTF) => {
        const cacheKey = key as ModelCacheKey;
        const root = gltf.scene;

        // Scale animated models to match v02 static model size
        const scaleFactor = 1.5;
        root.scale.set(scaleFactor, scaleFactor, scaleFactor);
        root.updateMatrixWorld(true);

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
        });

        this.animatedTemplates.set(cacheKey, {
          scene: root,
          clips: gltf.animations,
        });

        console.log(
          `[UnitRenderer] Loaded animated model "${key}" with ${gltf.animations.length} clips:`,
          gltf.animations.map((c) => c.name),
        );

        loaded++;
        onProgress?.(loaded, total);
      }).catch((err) => {
        console.warn(`[UnitRenderer] Failed to load animated model "${key}":`, err);
        loaded++;
        onProgress?.(loaded, total);
      }),
    );
    await Promise.all(animPromises);
  }

  /** Create a simple colored box as fallback when GLB loading fails. */
  private createFallbackBucket(key: ModelCacheKey, factionId: number): void {
    const geo = new THREE.BoxGeometry(0.8, 1.4, 0.8);
    geo.translate(0, 0.7, 0);
    const tint = FACTION_TINTS[factionId] ?? new THREE.Color(0xcccccc);
    const mat = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.6, metalness: 0.1 });

    const im = new THREE.InstancedMesh(geo, mat, MAX_INSTANCES_PER_BUCKET);
    im.count = 0;
    im.castShadow = true;
    im.receiveShadow = false;
    im.frustumCulled = false;
    im.name = `fallback_${key}`;

    im.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_INSTANCES_PER_BUCKET * 3), 3,
    );
    for (let i = 0; i < MAX_INSTANCES_PER_BUCKET; i++) {
      im.setColorAt(i, DEFAULT_COLOR);
    }
    im.instanceColor.needsUpdate = true;

    this.group.add(im);
    this.buckets.set(key, {
      mesh: im, entityToIndex: new Map(), indexToEntity: new Map(),
      activeCount: 0, instanceScales: new Map(),
    });
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
    im.frustumCulled = false;
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

  /** Check if a given key has an animated template available. */
  private hasAnimated(key: ModelCacheKey): boolean {
    return this.animatedTemplates.has(key);
  }

  /**
   * Create a visible unit instance for an ECS entity.
   * Returns a lightweight proxy Object3D so the caller can set initial position,
   * userData.eid, and store it in entityMeshMap for raycasting.
   */
  addUnit(eid: number, type: UnitTypeName, factionId: number): THREE.Object3D | null {
    if (this.proxies.has(eid)) return this.proxies.get(eid)!;

    const key: ModelCacheKey = `${type}_${factionId}`;

    // --- Animated path: individual SkinnedMesh per unit ---
    if (this.hasAnimated(key)) {
      return this.addAnimatedUnit(eid, key);
    }

    // --- Static path: InstancedMesh batching ---
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

  /**
   * Add an animated unit: clone the template scene, set up AnimationMixer,
   * create proxy and blob shadow.
   */
  private addAnimatedUnit(eid: number, key: ModelCacheKey): THREE.Object3D | null {
    const template = this.animatedTemplates.get(key);
    if (!template) return null;

    // Deep clone the skinned mesh scene (preserves skeleton bindings)
    const model = skeletonClone(template.scene) as THREE.Group;
    model.name = `anim_unit_${eid}`;
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
        // Clone materials so damage flash doesn't affect all units
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
      }
    });

    this.group.add(model);

    // Create AnimationMixer and set up actions
    const mixer = new THREE.AnimationMixer(model);
    const actions = new Map<string, THREE.AnimationAction>();
    const clipNames = new Set<string>();

    for (const clip of template.clips) {
      const action = mixer.clipAction(clip);
      clipNames.add(clip.name);

      // One-shot clips play once; Death also clamps at final pose
      if (ONE_SHOT_CLIPS.has(clip.name)) {
        action.setLoop(THREE.LoopOnce, 1);
        if (clip.name === 'Death') {
          action.clampWhenFinished = true;
        }
      } else {
        // Idle, Walk, Gather, SiegeIdle, etc. loop continuously
        action.setLoop(THREE.LoopRepeat, Infinity);
      }

      actions.set(clip.name, action);
    }

    // Start with Idle
    const idleAction = actions.get('Idle');
    if (idleAction) {
      idleAction.play();
    }

    const animUnit: AnimatedUnit = {
      model,
      mixer,
      actions,
      clipNames,
      currentAnim: 'Idle',
      prevAnim: 'Idle',
    };
    this.animatedUnits.set(eid, animUnit);

    // Listen for one-shot clips finishing to return to Idle
    mixer.addEventListener('finished', (e: THREE.Event & { action?: THREE.AnimationAction }) => {
      const finishedAction = e.action;
      if (!finishedAction) return;
      const unit = this.animatedUnits.get(eid);
      if (!unit) return;

      const clipName = finishedAction.getClip().name;
      // All one-shot attack/ability clips return to Idle when done
      // Death stays clamped (clampWhenFinished)
      if (clipName !== 'Death' && ONE_SHOT_CLIPS.has(clipName)) {
        this.crossfadeAnimation(unit, 'Idle');
      }
    });

    // Create proxy for raycasting
    const proxy = new THREE.Mesh(this.hitProxyGeo, this.hitProxyMat);
    proxy.name = `unit_${eid}`;
    proxy.userData.eid = eid;
    this.proxies.set(eid, proxy);
    this.group.add(proxy);

    // Create blob shadow
    const shadow = new THREE.Mesh(this.blobShadowGeo, this.blobShadowMat);
    shadow.renderOrder = 1;
    this.blobShadows.set(eid, shadow);
    this.group.add(shadow);

    // Track the key for this entity (not in buckets, but we still track it)
    this.entityBucketKey.set(eid, key);

    return proxy;
  }

  /**
   * Crossfade from the current animation to a new one.
   */
  private crossfadeAnimation(unit: AnimatedUnit, targetAnim: string): void {
    if (unit.currentAnim === targetAnim) return;

    const currentAction = unit.actions.get(unit.currentAnim);
    const targetAction = unit.actions.get(targetAnim);
    if (!targetAction) return;

    unit.prevAnim = unit.currentAnim;
    unit.currentAnim = targetAnim;

    // Reset target action if it was a LoopOnce that already finished
    targetAction.reset();
    targetAction.play();
    targetAction.fadeIn(0.2);

    if (currentAction) {
      currentAction.fadeOut(0.2);
    }
  }

  /** Remove and dispose the mesh instance of a dead / removed entity. */
  removeUnit(eid: number): void {
    const key = this.entityBucketKey.get(eid);
    if (!key) return;

    // --- Animated path cleanup ---
    const animUnit = this.animatedUnits.get(eid);
    if (animUnit) {
      animUnit.mixer.stopAllAction();
      animUnit.mixer.uncacheRoot(animUnit.model);
      this.group.remove(animUnit.model);
      this.disposeObject(animUnit.model);
      animUnit.actions.clear();
      this.animatedUnits.delete(eid);
    } else {
      // --- Static (InstancedMesh) path cleanup ---
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
   * @param positions - array of { eid, x, y, z, ry, selected, isIdle, aiState?, unitTypeId?, targetX?, targetZ? }
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
      aiState?: number;
      unitTypeId?: number;
      targetX?: number;
      targetZ?: number;
      isBuffed?: boolean;
      isStunned?: boolean;
      isInvincible?: boolean;
      deathProgress?: number;
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

    // Update attack swing timers
    for (const [eid, swing] of this.attackSwingTimers) {
      const newRemaining = swing.remaining - dt;
      if (newRemaining <= 0) {
        this.attackSwingTimers.delete(eid);
      } else {
        this.attackSwingTimers.set(eid, { remaining: newRemaining, isRanged: swing.isRanged });
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

      // --- Animated unit path ---
      const animUnit = this.animatedUnits.get(data.eid);
      if (animUnit) {
        this.updateAnimatedUnit(dt, data, animUnit);
        continue;
      }

      // --- Static (InstancedMesh) path ---
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
      this._pos.set(data.x, data.y + 1.5 + bob, data.z);

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
        proxy.position.set(data.x, data.y + 1.5 + bob, data.z);
        proxy.rotation.y = facingY;
      }

      // --- Instance color: damage flash > selected > invincible > stunned > buffed > default ---
      const isFlashing = this.damageFlashTimers.has(data.eid);
      let instanceColor = DEFAULT_COLOR;
      if (isFlashing) {
        instanceColor = DAMAGE_FLASH_COLOR;
      } else if (data.selected) {
        instanceColor = SELECTION_COLOR;
      } else if (data.isInvincible) {
        instanceColor = INVINCIBLE_COLOR;
      } else if (data.isStunned) {
        instanceColor = STUN_COLOR;
      } else if (data.isBuffed) {
        instanceColor = BUFF_COLOR;
      }
      bucket.mesh.setColorAt(instanceIndex, instanceColor);
      dirtyColorBuckets.add(key);

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
   * Update a single animated unit: advance mixer, select animation, set position/rotation.
   */
  private updateAnimatedUnit(
    dt: number,
    data: {
      eid: number; x: number; y: number; z: number; ry: number;
      selected: boolean; isIdle?: boolean; aiState?: number;
      unitTypeId?: number;
      targetX?: number; targetZ?: number;
      isBuffed?: boolean; isStunned?: boolean; isInvincible?: boolean;
      deathProgress?: number;
    },
    animUnit: AnimatedUnit,
  ): void {
    // Advance animation mixer
    animUnit.mixer.update(dt);

    // --- Select animation based on AI state + unit type + available clips ---
    const targetAnim = resolveAnimation(data.aiState, data.unitTypeId, animUnit.clipNames);
    if (targetAnim !== animUnit.currentAnim) {
      // Don't interrupt Death animation
      if (animUnit.currentAnim !== 'Death') {
        this.crossfadeAnimation(animUnit, targetAnim);
      }
    }

    // --- Facing direction ---
    let facingY = data.ry;
    if (data.targetX !== undefined && data.targetZ !== undefined) {
      this._vec.set(data.targetX - data.x, 0, data.targetZ - data.z);
      if (this._vec.lengthSq() > 0.01) {
        facingY = Math.atan2(this._vec.x, this._vec.z);
      }
    }

    // --- Set position and rotation directly on the model ---
    // Model origin is at center (feet at ~-1.0); after 1.5x scale, need +1.5 Y offset
    animUnit.model.position.set(data.x, data.y + 1.5, data.z);
    animUnit.model.rotation.y = facingY;

    // --- Attack swing overlay: forward-lean (melee) or recoil (ranged) ---
    // Triangular curve peaks at 40% of duration: slow wind-up → snap → recover.
    const swing = this.attackSwingTimers.get(data.eid);
    if (swing && swing.remaining > 0) {
      const t = 1 - swing.remaining / ATTACK_SWING_DURATION; // 0 → 1
      // Wind-up 0..0.4 → 0..1, follow-through 0.4..1.0 → 1..0
      const intensity = t < 0.4 ? t / 0.4 : Math.max(0, 1 - (t - 0.4) / 0.6);
      const angle = swing.isRanged ? -RANGED_RECOIL_ANGLE * intensity : MELEE_LEAN_ANGLE * intensity;
      animUnit.model.rotation.x = angle;
    } else if (animUnit.model.rotation.x !== 0) {
      animUnit.model.rotation.x = 0;
    }

    // --- Death collapse + fade-out (overlays the Death clip) ---
    // Scale Y collapses 100% → 30% over the death window; opacity fades to 0
    // in the final 30%. Restore baseline when not dying.
    this.applyDeathTween(animUnit, data.deathProgress);

    // --- Sync proxy position (for raycasting) ---
    const proxy = this.proxies.get(data.eid);
    if (proxy) {
      proxy.position.set(data.x, data.y + 1.0, data.z);
      proxy.rotation.y = facingY;
    }

    // --- Sync blob shadow position ---
    const shadow = this.blobShadows.get(data.eid);
    if (shadow) {
      shadow.position.set(data.x, data.y + 0.05, data.z);
      // Fade shadow alongside body during death.
      const shadowMat = shadow.material as THREE.MeshBasicMaterial;
      const baseOpacity = 0.4;
      shadowMat.opacity = data.deathProgress !== undefined
        ? baseOpacity * Math.max(0, 1 - data.deathProgress)
        : baseOpacity;
    }

    // --- Damage flash / selection highlight / buff indicator for animated units ---
    const isFlashing = this.damageFlashTimers.has(data.eid);
    this.setAnimatedUnitEmissive(animUnit, isFlashing, data.selected, data.isBuffed, data.isStunned, data.isInvincible);
  }

  /**
   * Apply death visual: vertical collapse + opacity fade. Operates on the
   * animated-unit model directly so it stacks on top of any Death animation
   * clip when the GLB has one.
   */
  private applyDeathTween(animUnit: AnimatedUnit, deathProgress: number | undefined): void {
    const baseScaleY = animUnit.baseScaleY ?? animUnit.model.scale.y;
    if (animUnit.baseScaleY === undefined) {
      animUnit.baseScaleY = baseScaleY;
    }

    if (deathProgress === undefined || deathProgress <= 0) {
      animUnit.model.scale.y = baseScaleY;
      this.setAnimatedUnitOpacity(animUnit, 1);
      return;
    }

    // Y-collapse: 1.0 → 0.3 across the full timer.
    const collapse = 1 - 0.7 * deathProgress;
    animUnit.model.scale.y = baseScaleY * collapse;

    // Fade-out only kicks in during the final 30% so the collapse stays visible.
    const fade = deathProgress < 0.7 ? 1 : 1 - (deathProgress - 0.7) / 0.3;
    this.setAnimatedUnitOpacity(animUnit, Math.max(0, fade));
  }

  /**
   * Set transparency + opacity on every material in the animated unit.
   * Caches `transparent: true` so future fade frames are cheap.
   */
  private setAnimatedUnitOpacity(animUnit: AnimatedUnit, opacity: number): void {
    animUnit.model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as THREE.Material & { opacity?: number };
        if (opacity < 1 && !m.transparent) m.transparent = true;
        if (m.opacity !== undefined) m.opacity = opacity;
      }
    });
  }

  /**
   * Set emissive color on all materials of an animated unit model
   * for damage flash, selection highlight, and buff/debuff effects.
   */
  private setAnimatedUnitEmissive(
    animUnit: AnimatedUnit,
    isFlashing: boolean,
    isSelected: boolean,
    isBuffed?: boolean,
    isStunned?: boolean,
    isInvincible?: boolean,
  ): void {
    animUnit.model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if ('emissive' in mat) {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (isFlashing) {
            stdMat.emissive.copy(DAMAGE_FLASH_COLOR);
            stdMat.emissiveIntensity = 0.8;
          } else if (isSelected) {
            stdMat.emissive.copy(SELECTION_COLOR);
            stdMat.emissiveIntensity = 0.3;
          } else if (isInvincible) {
            stdMat.emissive.copy(INVINCIBLE_COLOR);
            stdMat.emissiveIntensity = 0.6;
          } else if (isStunned) {
            stdMat.emissive.copy(STUN_COLOR);
            stdMat.emissiveIntensity = 0.4;
          } else if (isBuffed) {
            stdMat.emissive.copy(BUFF_COLOR);
            stdMat.emissiveIntensity = 0.3;
          } else {
            stdMat.emissive.setScalar(0);
            stdMat.emissiveIntensity = 0;
          }
        }
      }
    });
  }

  /**
   * Trigger an attack swing animation on the attacker. Plays a brief
   * forward-lean (melee) or bow-pull-and-release (ranged) over ATTACK_SWING_DURATION.
   * Stacks on top of any GLB animation clip (procedural rotation overlay).
   */
  triggerAttackSwing(eid: number, isRanged: boolean): void {
    this.attackSwingTimers.set(eid, { remaining: ATTACK_SWING_DURATION, isRanged });
  }

  /**
   * Trigger a damage flash on a unit (called when HP decreases).
   */
  triggerDamageFlash(eid: number): void {
    this.damageFlashTimers.set(eid, DAMAGE_FLASH_DURATION);

    // Animated unit: apply emissive flash immediately
    const animUnit = this.animatedUnits.get(eid);
    if (animUnit) {
      this.setAnimatedUnitEmissive(animUnit, true, false);
      return;
    }

    // Static unit: apply flash color immediately
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
    // Dispose all animated unit instances
    for (const [, animUnit] of this.animatedUnits) {
      animUnit.mixer.stopAllAction();
      animUnit.mixer.uncacheRoot(animUnit.model);
      this.group.remove(animUnit.model);
      this.disposeObject(animUnit.model);
      animUnit.actions.clear();
    }
    this.animatedUnits.clear();

    // Dispose animated templates
    for (const [, template] of this.animatedTemplates) {
      this.disposeObject(template.scene);
    }
    this.animatedTemplates.clear();

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
