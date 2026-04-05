/**
 * PropRenderer.ts
 * Renders environment props (trees, rocks) using InstancedMesh for performance,
 * and gold mines as unique objects.
 */

import * as THREE from 'three';
import { MeshToonMaterial } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TREE_PATHS = [
  'assets/models/v02/shared/tree_pine.glb',
  'assets/models/poc/props/tree_variant_1.glb',
  'assets/models/poc/props/tree_variant_2.glb',
];

const ROCK_PATHS = [
  'assets/models/poc/props/rock_variant_0.glb',
  'assets/models/poc/props/rock_variant_1.glb',
  'assets/models/poc/props/rock_variant_2.glb',
];

const GOLD_MINE_PATH = 'assets/models/v02/shared/goldmine.glb';

/** Scale multipliers for props. */
const TREE_SCALE_MULTIPLIER = 1.5;
const ROCK_SCALE_MULTIPLIER = 1.3;

/** Maximum instances per variant (InstancedMesh budget). */
const MAX_INSTANCES_PER_VARIANT = 256;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface PropInstance {
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number;
  variant: number;
}

/**
 * Merges all child meshes of a GLB scene into a single merged
 * BufferGeometry + material array.  For PoC we take only the first
 * Mesh child to keep InstancedMesh simple.
 */
function extractFirstMesh(root: THREE.Group): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  let found: THREE.Mesh | null = null;
  root.traverse((child) => {
    if (!found && (child as THREE.Mesh).isMesh) {
      found = child as THREE.Mesh;
    }
  });
  if (!found) return null;
  return {
    geometry: (found as THREE.Mesh).geometry.clone(),
    material: (
      Array.isArray((found as THREE.Mesh).material)
        ? ((found as THREE.Mesh).material as THREE.Material[])[0]
        : (found as THREE.Mesh).material as THREE.Material
    ).clone(),
  };
}

/**
 * Blend two THREE.Color values by a given factor (0 = keep original, 1 = full tint).
 */
function blendColor(original: THREE.Color, tint: THREE.Color, factor: number): THREE.Color {
  return new THREE.Color(
    original.r + (tint.r - original.r) * factor,
    original.g + (tint.g - original.g) * factor,
    original.b + (tint.b - original.b) * factor,
  );
}

/**
 * Convert a material to MeshToonMaterial, blending its color with a tint.
 */
function toToonMaterial(
  mat: THREE.Material,
  tintHex: string,
  tintFactor: number,
): MeshToonMaterial {
  const srcColor =
    (mat as THREE.MeshStandardMaterial).color?.clone() ?? new THREE.Color(0x888888);
  const tint = new THREE.Color(tintHex);
  const blended = blendColor(srcColor, tint, tintFactor);
  const toon = new MeshToonMaterial({ color: blended });
  mat.dispose();
  return toon;
}

// ---------------------------------------------------------------------------
// PropRenderer
// ---------------------------------------------------------------------------

export class PropRenderer {
  private loader = new GLTFLoader();
  private group: THREE.Group;

  /** InstancedMeshes per tree variant (index 0-2). */
  private treeInstances: THREE.InstancedMesh[] = [];
  /** InstancedMeshes per rock variant (index 0-2). */
  private rockInstances: THREE.InstancedMesh[] = [];
  /** Source geometries/materials for disposal tracking. */
  private sourceGeometries: THREE.BufferGeometry[] = [];
  private sourceMaterials: THREE.Material[] = [];

  /** Gold mine source model. */
  private goldMineSource: THREE.Group | null = null;
  /** Placed gold mines: eid -> Object3D. */
  private goldMines = new Map<number, THREE.Object3D>();

  /** Temporary matrix for setting instance transforms. */
  private _mat4 = new THREE.Matrix4();
  private _pos = new THREE.Vector3();
  private _quat = new THREE.Quaternion();
  private _scale = new THREE.Vector3();

  constructor(parentGroup: THREE.Group) {
    this.group = parentGroup;
  }

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  async preload(): Promise<void> {
    const [treeGltfs, rockGltfs, mineGltf] = await Promise.all([
      Promise.all(TREE_PATHS.map((p) => this.loader.loadAsync(p))),
      Promise.all(ROCK_PATHS.map((p) => this.loader.loadAsync(p))),
      this.loader.loadAsync(GOLD_MINE_PATH),
    ]);

    // Build InstancedMesh per tree variant
    for (let ti = 0; ti < treeGltfs.length; ti++) {
      const gltf = treeGltfs[ti];
      const data = extractFirstMesh(gltf.scene);
      if (!data) {
        console.warn('[PropRenderer] Tree GLB has no mesh children');
        continue;
      }
      // v02 models keep PBR, v01/poc get toon conversion
      const isV02 = TREE_PATHS[ti].includes('/v02/');
      const toonMat = isV02 ? data.material : toToonMaterial(data.material, '#3a8828', 0.5);
      this.sourceGeometries.push(data.geometry);
      this.sourceMaterials.push(toonMat);
      const im = new THREE.InstancedMesh(data.geometry, toonMat, MAX_INSTANCES_PER_VARIANT);
      im.count = 0; // Start empty
      im.castShadow = true;
      im.receiveShadow = false;
      im.frustumCulled = false; // instances cover a wide area
      this.treeInstances.push(im);
      this.group.add(im);
    }

    // Build InstancedMesh per rock variant
    for (const gltf of rockGltfs) {
      const data = extractFirstMesh(gltf.scene);
      if (!data) {
        console.warn('[PropRenderer] Rock GLB has no mesh children');
        continue;
      }
      // Convert to toon material with grey tint
      const toonMat = toToonMaterial(data.material, '#8a8a80', 0.4);
      this.sourceGeometries.push(data.geometry);
      this.sourceMaterials.push(toonMat);
      const im = new THREE.InstancedMesh(data.geometry, toonMat, MAX_INSTANCES_PER_VARIANT);
      im.count = 0;
      im.castShadow = true;
      im.receiveShadow = false;
      im.frustumCulled = false;
      this.rockInstances.push(im);
      this.group.add(im);
    }

    // Gold mine source model — enable shadow casting
    mineGltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
      }
    });
    this.goldMineSource = mineGltf.scene;
  }

  // -----------------------------------------------------------------------
  // Batch placement (called once at map init)
  // -----------------------------------------------------------------------

  /**
   * Place trees onto the terrain.
   * @param trees Array of { x, y, z, rotY, scale, variant (0-2) }
   */
  placeTrees(trees: PropInstance[]): void {
    // Group by variant
    const buckets: PropInstance[][] = [[], [], []];
    for (const t of trees) {
      const v = Math.min(Math.max(t.variant, 0), 2);
      buckets[v].push(t);
    }

    for (let v = 0; v < 3; v++) {
      const im = this.treeInstances[v];
      if (!im) continue;
      const list = buckets[v];
      im.count = Math.min(list.length, MAX_INSTANCES_PER_VARIANT);
      for (let i = 0; i < im.count; i++) {
        const p = list[i];
        this._pos.set(p.x, p.y, p.z);
        this._quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, p.rotY);
        this._scale.setScalar(p.scale * TREE_SCALE_MULTIPLIER);
        this._mat4.compose(this._pos, this._quat, this._scale);
        im.setMatrixAt(i, this._mat4);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Place rocks onto the terrain.
   * @param rocks Array of { x, y, z, rotY, scale, variant (0-2) }
   */
  placeRocks(rocks: PropInstance[]): void {
    const buckets: PropInstance[][] = [[], [], []];
    for (const r of rocks) {
      const v = Math.min(Math.max(r.variant, 0), 2);
      buckets[v].push(r);
    }

    for (let v = 0; v < 3; v++) {
      const im = this.rockInstances[v];
      if (!im) continue;
      const list = buckets[v];
      im.count = Math.min(list.length, MAX_INSTANCES_PER_VARIANT);
      for (let i = 0; i < im.count; i++) {
        const p = list[i];
        this._pos.set(p.x, p.y, p.z);
        this._quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, p.rotY);
        this._scale.setScalar(p.scale * ROCK_SCALE_MULTIPLIER);
        this._mat4.compose(this._pos, this._quat, this._scale);
        im.setMatrixAt(i, this._mat4);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  }

  // -----------------------------------------------------------------------
  // Gold mines (unique objects)
  // -----------------------------------------------------------------------

  /**
   * Add a gold mine to the scene.
   * @returns The placed Object3D or null if the source model is missing.
   */
  addGoldMine(eid: number, x: number, y: number, z: number): THREE.Object3D | null {
    if (this.goldMines.has(eid)) return this.goldMines.get(eid)!;
    if (!this.goldMineSource) return null;

    const clone = this.goldMineSource.clone(true);
    const isV02 = GOLD_MINE_PATH.includes('/v02/');
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (isV02) {
          // v02: keep PBR materials
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => m.clone());
          } else {
            mesh.material = mesh.material.clone();
          }
        } else {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => toToonMaterial(m.clone(), '#d4a030', 0.6));
          } else {
            mesh.material = toToonMaterial(mesh.material.clone(), '#d4a030', 0.6);
          }
        }
      }
    });

    clone.position.set(x, y, z);
    clone.name = `goldmine_${eid}`;
    clone.userData.eid = eid;
    this.goldMines.set(eid, clone);
    this.group.add(clone);
    return clone;
  }

  /** Remove a depleted gold mine. */
  removeGoldMine(eid: number): void {
    const obj = this.goldMines.get(eid);
    if (!obj) return;
    this.group.remove(obj);
    this.disposeObject(obj);
    this.goldMines.delete(eid);
  }

  getGoldMineObject(eid: number): THREE.Object3D | undefined {
    return this.goldMines.get(eid);
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  destroy(): void {
    for (const im of this.treeInstances) {
      this.group.remove(im);
      im.dispose();
    }
    this.treeInstances.length = 0;

    for (const im of this.rockInstances) {
      this.group.remove(im);
      im.dispose();
    }
    this.rockInstances.length = 0;

    for (const g of this.sourceGeometries) g.dispose();
    for (const m of this.sourceMaterials) m.dispose();
    this.sourceGeometries.length = 0;
    this.sourceMaterials.length = 0;

    for (const [, obj] of this.goldMines) {
      this.group.remove(obj);
      this.disposeObject(obj);
    }
    this.goldMines.clear();

    if (this.goldMineSource) {
      this.disposeObject(this.goldMineSource);
      this.goldMineSource = null;
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
