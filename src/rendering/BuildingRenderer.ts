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

export type BuildingTypeName = 'townhall' | 'barracks' | 'blacksmith' | 'lumbercamp';

const BUILDING_MODEL_PATHS: Record<string, string> = {
  townhall_0: '/assets/models/v02/brabanders/townhall.glb',
  townhall_1: '/assets/models/v02/randstad/townhall.glb',
  barracks_0: '/assets/models/v02/brabanders/barracks.glb',
  barracks_1: '/assets/models/v02/randstad/barracks.glb',
  lumbercamp_0: '/assets/models/v02/brabanders/lumbercamp.glb',
  lumbercamp_1: '/assets/models/v02/randstad/lumbercamp.glb',
  blacksmith_0: '/assets/models/v02/brabanders/blacksmith.glb',
  blacksmith_1: '/assets/models/v02/randstad/blacksmith.glb',
  // Limburgers
  townhall_2: '/assets/models/v02/limburgers/townhall.glb',
  barracks_2: '/assets/models/v02/limburgers/barracks.glb',
  lumbercamp_2: '/assets/models/v02/limburgers/lumbercamp.glb',
  blacksmith_2: '/assets/models/v02/limburgers/blacksmith.glb',
  // Belgen
  townhall_3: '/assets/models/v02/belgen/townhall.glb',
  barracks_3: '/assets/models/v02/belgen/barracks.glb',
  lumbercamp_3: '/assets/models/v02/belgen/lumbercamp.glb',
  blacksmith_3: '/assets/models/v02/belgen/blacksmith.glb',
};

const BUILDING_MODEL_FALLBACKS: Record<string, string> = {
  townhall_0: '/assets/models/v01/brabanders/townhall.glb',
  townhall_1: '/assets/models/v01/randstad/townhall.glb',
  barracks_0: '/assets/models/v01/brabanders/barracks.glb',
  barracks_1: '/assets/models/v01/randstad/barracks.glb',
  lumbercamp_0: '/assets/models/v02/brabanders/lumbercamp.glb',
  lumbercamp_1: '/assets/models/v02/randstad/lumbercamp.glb',
  blacksmith_0: '/assets/models/v02/brabanders/blacksmith.glb',
  blacksmith_1: '/assets/models/v02/randstad/blacksmith.glb',
  // Limburgers (fallback to v02 dedicated models)
  townhall_2: '/assets/models/v01/brabanders/townhall.glb',
  barracks_2: '/assets/models/v01/brabanders/barracks.glb',
  lumbercamp_2: '/assets/models/v02/limburgers/lumbercamp.glb',
  blacksmith_2: '/assets/models/v02/limburgers/blacksmith.glb',
  // Belgen (fallback to v02 dedicated models)
  townhall_3: '/assets/models/v01/brabanders/townhall.glb',
  barracks_3: '/assets/models/v01/brabanders/barracks.glb',
  lumbercamp_3: '/assets/models/v02/belgen/lumbercamp.glb',
  blacksmith_3: '/assets/models/v02/belgen/blacksmith.glb',
};

type ModelCacheKey = `${BuildingTypeName}_${number}`;

/** Faction team colors: applied as a strong tint to building materials. */
const FACTION_TINTS: Record<number, THREE.Color> = {
  0: new THREE.Color(0xff8830), // Brabanders: bright warm orange
  1: new THREE.Color(0x4070bb), // Randstad: clear blue
  2: new THREE.Color(0x44dd44), // Limburgers: bright emerald green
  3: new THREE.Color(0xdd3344), // Belgen: bright crimson red
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

/** Status bar dimensions and positioning. */
const BAR_WIDTH = 2.4;
const BAR_HEIGHT = 0.25;
const BAR_Y_OFFSET = 4.2;
const BAR_HEALTH_Y_OFFSET = 3.85; // slightly below construction bar

// ---------------------------------------------------------------------------
// BuildingRenderer
// ---------------------------------------------------------------------------

export class BuildingRenderer {
  private modelCache = new Map<ModelCacheKey, THREE.Group>();
  private v02Models = new Set<ModelCacheKey>();
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

  /** Rally point flag markers: eid -> flag group. */
  private rallyFlags = new Map<number, THREE.Group>();
  /** Shared rally flag geometry. */
  private rallyPoleGeo: THREE.CylinderGeometry;
  private rallyFlagGeo: THREE.ConeGeometry;

  /** Construction progress bars: eid -> { bg, fill } group. */
  private progressBars = new Map<number, THREE.Group>();
  /** Health bars: eid -> { bg, fill } group. */
  private healthBars = new Map<number, THREE.Group>();
  /** Shared bar geometries. */
  private barBgGeo: THREE.PlaneGeometry;
  private barFillGeo: THREE.PlaneGeometry;
  /** Shared bar materials. */
  private progressBgMat: THREE.MeshBasicMaterial;
  private progressFillMat: THREE.MeshBasicMaterial;
  private healthBgMat: THREE.MeshBasicMaterial;
  private healthFillMat: THREE.MeshBasicMaterial;

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

    // Create shared rally flag geometry
    this.rallyPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6);
    this.rallyFlagGeo = new THREE.ConeGeometry(0.35, 0.5, 4);

    // Create shared status bar resources
    this.barBgGeo = new THREE.PlaneGeometry(BAR_WIDTH, BAR_HEIGHT);
    this.barFillGeo = new THREE.PlaneGeometry(1.0, BAR_HEIGHT); // width scaled per-instance

    this.progressBgMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.progressFillMat = new THREE.MeshBasicMaterial({
      color: 0x44bb44,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.healthBgMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.healthFillMat = new THREE.MeshBasicMaterial({
      color: 0xcc2222,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  // -----------------------------------------------------------------------
  // Asset loading
  // -----------------------------------------------------------------------

  /**
   * Pre-load building GLB models.
   * @param factions  Optional set of faction IDs to load. If omitted, loads all factions.
   * @param onProgress  Called after each model finishes loading with (loaded, total) counts.
   */
  async preload(factions?: Set<number>, onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const entries = Object.entries(BUILDING_MODEL_PATHS).filter(([key]) => {
      if (!factions) return true;
      const factionId = parseInt(key.split('_')[1], 10);
      return factions.has(factionId);
    });

    let loaded = 0;
    const total = entries.length;

    const promises = entries.map(([key, path]) =>
      this.loader.loadAsync(path).catch(() => {
        const fallback = BUILDING_MODEL_FALLBACKS[key];
        if (fallback) return this.loader.loadAsync(fallback);
        throw new Error(`No model found for ${key}`);
      }).then((gltf: GLTF) => {
        const root = gltf.scene;
        const isV02 = path.includes('/v02/');
        if (isV02) this.v02Models.add(key as ModelCacheKey);
        // v02 buildings at commanding scale; v01 needs more upscale
        root.scale.set(isV02 ? 2.8 : 1.8, isV02 ? 2.8 : 1.8, isV02 ? 2.8 : 1.8);
        // Enable shadow casting on all child meshes
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
        });
        this.modelCache.set(key as ModelCacheKey, root);

        loaded++;
        onProgress?.(loaded, total);
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
    const isV02 = this.v02Models.has(key);
    const tint = FACTION_TINTS[factionId];

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (isV02) {
          // v02: keep original PBR materials, just clone + set transparent for build progress
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => { const c = m.clone(); c.transparent = true; return c; });
          } else {
            mesh.material = mesh.material.clone();
            (mesh.material as THREE.Material).transparent = true;
          }
        } else {
          // v01: convert to toon material with faction tint
          const applyTint = (m: THREE.Material): THREE.Material => {
            const origColor = ('color' in m && m.color instanceof THREE.Color)
              ? m.color.clone() : new THREE.Color(0x888888);
            if (tint) origColor.lerp(tint, 0.4);
            return new MeshToonMaterial({ color: origColor, transparent: true });
          };
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(applyTint);
          } else {
            mesh.material = applyTint(mesh.material);
          }
        }
      }
    });

    // Lift buildings above terrain to prevent sinking (v02 models have center pivots)
    const yOffset = isV02 ? 2.5 : 1.2;
    clone.position.set(x, y + yOffset, z);
    clone.name = `building_${eid}`;
    clone.userData.eid = eid;
    clone.userData.buildingYOffset = yOffset;

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

    // Clean up associated status bars
    const pBar = this.progressBars.get(eid);
    if (pBar) { this.group.remove(pBar); this.progressBars.delete(eid); }
    const hBar = this.healthBars.get(eid);
    if (hBar) { this.group.remove(hBar); this.healthBars.delete(eid); }
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
      // Apply Y offset to prevent buildings sinking into terrain
      const yOff = obj.userData.buildingYOffset ?? 0.3;
      obj.position.set(data.x, data.y + yOff, data.z);
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

    // Update construction progress bars and health bars
    const activeProgressEids = new Set<number>();
    const activeHealthEids = new Set<number>();

    for (const data of buildings) {
      const isUnderConstruction = data.progress < 1.0;
      const isDamaged = data.hpRatio !== undefined && data.hpRatio < 1.0 && !isUnderConstruction;

      // -- Construction progress bar --
      if (isUnderConstruction) {
        activeProgressEids.add(data.eid);
        let barGroup = this.progressBars.get(data.eid);
        if (!barGroup) {
          barGroup = this.createBarGroup(this.progressBgMat, this.progressFillMat);
          barGroup.name = `progress_bar_${data.eid}`;
          this.progressBars.set(data.eid, barGroup);
          this.group.add(barGroup);
        }
        barGroup.visible = true;
        barGroup.position.set(data.x, data.y + BAR_Y_OFFSET, data.z);
        // Billboard: face the camera by rotating on X axis
        barGroup.rotation.x = -Math.PI / 4;
        this.updateBarFill(barGroup, data.progress);
      }

      // -- Health bar --
      if (isDamaged) {
        activeHealthEids.add(data.eid);
        let barGroup = this.healthBars.get(data.eid);
        if (!barGroup) {
          barGroup = this.createBarGroup(this.healthBgMat, this.healthFillMat);
          barGroup.name = `health_bar_${data.eid}`;
          this.healthBars.set(data.eid, barGroup);
          this.group.add(barGroup);
        }
        barGroup.visible = true;
        barGroup.position.set(data.x, data.y + BAR_HEALTH_Y_OFFSET, data.z);
        barGroup.rotation.x = -Math.PI / 4;
        this.updateBarFill(barGroup, data.hpRatio!);
      }
    }

    // Hide bars for buildings no longer needing them
    for (const [eid, bar] of this.progressBars) {
      if (!activeProgressEids.has(eid)) {
        bar.visible = false;
      }
    }
    for (const [eid, bar] of this.healthBars) {
      if (!activeHealthEids.has(eid)) {
        bar.visible = false;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Status bars (construction progress + health)
  // -----------------------------------------------------------------------

  /**
   * Create a bar group containing a background plane and a fill plane.
   * The fill plane is the first child (index 0), the background is second (index 1).
   */
  private createBarGroup(bgMat: THREE.MeshBasicMaterial, fillMat: THREE.MeshBasicMaterial): THREE.Group {
    const grp = new THREE.Group();
    grp.renderOrder = 5;

    // Background bar (full width)
    const bg = new THREE.Mesh(this.barBgGeo, bgMat);
    bg.renderOrder = 5;

    // Fill bar (scaled by ratio)
    const fill = new THREE.Mesh(this.barFillGeo, fillMat);
    fill.renderOrder = 6;
    fill.scale.set(BAR_WIDTH, 1, 1); // will be rescaled in updateBarFill
    fill.position.set(0, 0, 0.01); // slight Z offset to prevent z-fighting

    grp.add(fill); // index 0
    grp.add(bg);   // index 1
    return grp;
  }

  /**
   * Update the fill width and position of a bar group based on ratio (0..1).
   */
  private updateBarFill(barGroup: THREE.Group, ratio: number): void {
    const fill = barGroup.children[0] as THREE.Mesh;
    const clamped = Math.max(0, Math.min(ratio, 1));
    const fillWidth = BAR_WIDTH * clamped;
    fill.scale.set(fillWidth, 1, 1);
    // Anchor the fill bar to the left edge: offset so its left edge aligns with bg left edge
    fill.position.x = -BAR_WIDTH / 2 + fillWidth / 2;
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
  // Rally point flags
  // -----------------------------------------------------------------------

  /**
   * Show or update a rally point flag marker for a building.
   * Creates a small pole + cone flag in the faction's colour.
   */
  setRallyPoint(eid: number, x: number, z: number, factionId: number): void {
    // Remove existing flag for this building
    this.removeRallyPoint(eid);

    const tint = FACTION_TINTS[factionId] ?? new THREE.Color(0xffffff);

    // Pole (thin cylinder)
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x4a3a2a });
    const pole = new THREE.Mesh(this.rallyPoleGeo, poleMat);
    pole.position.set(0, 0.9, 0);

    // Flag (cone rotated sideways at top of pole)
    const flagMat = new THREE.MeshBasicMaterial({
      color: tint,
      transparent: true,
      opacity: 0.85,
    });
    const flag = new THREE.Mesh(this.rallyFlagGeo, flagMat);
    flag.position.set(0.2, 1.6, 0);
    flag.rotation.z = -Math.PI / 2;

    // Base ring (ground marker)
    const ringGeo = new THREE.RingGeometry(0.2, 0.4, 12);
    const ringMat = new THREE.MeshBasicMaterial({
      color: tint,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;

    const flagGroup = new THREE.Group();
    flagGroup.add(pole);
    flagGroup.add(flag);
    flagGroup.add(ring);
    flagGroup.position.set(x, 0, z);
    flagGroup.name = `rally_${eid}`;
    flagGroup.renderOrder = 2;

    this.rallyFlags.set(eid, flagGroup);
    this.group.add(flagGroup);
  }

  /** Remove the rally point flag for a building. */
  removeRallyPoint(eid: number): void {
    const flag = this.rallyFlags.get(eid);
    if (!flag) return;
    this.group.remove(flag);
    this.disposeObject(flag);
    this.rallyFlags.delete(eid);
  }

  /** Check if a building has a visible rally point flag. */
  hasRallyPoint(eid: number): boolean {
    return this.rallyFlags.has(eid);
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

    // Dispose rally flags
    for (const [, flag] of this.rallyFlags) {
      this.group.remove(flag);
      this.disposeObject(flag);
    }
    this.rallyFlags.clear();
    this.rallyPoleGeo.dispose();
    this.rallyFlagGeo.dispose();

    // Dispose status bars
    for (const [, bar] of this.progressBars) {
      this.group.remove(bar);
    }
    this.progressBars.clear();
    for (const [, bar] of this.healthBars) {
      this.group.remove(bar);
    }
    this.healthBars.clear();
    this.barBgGeo.dispose();
    this.barFillGeo.dispose();
    this.progressBgMat.dispose();
    this.progressFillMat.dispose();
    this.healthBgMat.dispose();
    this.healthFillMat.dispose();

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
