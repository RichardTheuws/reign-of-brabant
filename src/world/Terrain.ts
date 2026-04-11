import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import type { BiomeType, RiverSpawn, BridgeSpawn, RockWallSpawn, RoadSpawn, TunnelSpawn, PathPoint } from '../types/index';

const MAP_SIZE = 128;
const SEGMENTS = 256;
const MAX_HEIGHT = 4.5;
const WATER_LEVEL = -1;
const NOISE_SCALE = 0.012;
const OCTAVES = 5;
const PERSISTENCE = 0.45;
const LACUNARITY = 2.2;

// ---------------------------------------------------------------------------
// Biome color palettes
// ---------------------------------------------------------------------------

interface BiomePalette {
  deepGrass: THREE.Color;
  grass: THREE.Color;
  grassLight: THREE.Color;
  grassLush: THREE.Color;
  path: THREE.Color;
  sandy: THREE.Color;
  hill: THREE.Color;
  hillTop: THREE.Color;
  waterEdge: THREE.Color;
}

const BIOME_PALETTES: Record<BiomeType, BiomePalette> = {
  // Classic Brabantse weilanden (default)
  meadow: {
    deepGrass: new THREE.Color('#48a035'),
    grass: new THREE.Color('#5cb840'),
    grassLight: new THREE.Color('#6ec850'),
    grassLush: new THREE.Color('#55b042'),
    path: new THREE.Color('#c4a868'),
    sandy: new THREE.Color('#d4b878'),
    hill: new THREE.Color('#5aaa45'),
    hillTop: new THREE.Color('#70b858'),
    waterEdge: new THREE.Color('#4a8a5a'),
  },
  // Stedelijk/industrieel (crossroads)
  urban: {
    deepGrass: new THREE.Color('#5a6b52'),
    grass: new THREE.Color('#6a7a60'),
    grassLight: new THREE.Color('#7a8a70'),
    grassLush: new THREE.Color('#607860'),
    path: new THREE.Color('#9a9080'),
    sandy: new THREE.Color('#8a8478'),
    hill: new THREE.Color('#687868'),
    hillTop: new THREE.Color('#788870'),
    waterEdge: new THREE.Color('#506858'),
  },
  // Water-dominant eilanden (islands)
  aquatic: {
    deepGrass: new THREE.Color('#3a9848'),
    grass: new THREE.Color('#4aaa55'),
    grassLight: new THREE.Color('#58b862'),
    grassLush: new THREE.Color('#42a24c'),
    path: new THREE.Color('#c8b878'),
    sandy: new THREE.Color('#d8c888'),
    hill: new THREE.Color('#4a9a55'),
    hillTop: new THREE.Color('#5aaa60'),
    waterEdge: new THREE.Color('#3a8a50'),
  },
  // Droog zand/arena
  arid: {
    deepGrass: new THREE.Color('#b8a050'),
    grass: new THREE.Color('#c8b060'),
    grassLight: new THREE.Color('#d4bc68'),
    grassLush: new THREE.Color('#c0a858'),
    path: new THREE.Color('#d8c890'),
    sandy: new THREE.Color('#e0d098'),
    hill: new THREE.Color('#c4b060'),
    hillTop: new THREE.Color('#d0bc68'),
    waterEdge: new THREE.Color('#a89848'),
  },
};

// Default palette (meadow) for backwards compatibility
let activePalette = BIOME_PALETTES.meadow;

/** Module-level reference to the water geometry so updateWater() can access it. */
let waterGeometry: THREE.BufferGeometry | null = null;

/** Simple deterministic hash for seeded random per vertex. */
function seededRandom(x: number, z: number): number {
  let h = (x * 374761393 + z * 668265263 + 1013904223) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff; // 0..1
}

/**
 * Calculate the minimum distance from a point to a polyline path.
 * Used for river carving, road marking, and rock wall placement.
 */
function distanceToPath(
  px: number,
  pz: number,
  path: readonly { readonly x: number; readonly z: number }[],
): number {
  let minDist = Infinity;

  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i].x;
    const az = path[i].z;
    const bx = path[i + 1].x;
    const bz = path[i + 1].z;

    // Project point onto segment
    const abx = bx - ax;
    const abz = bz - az;
    const apx = px - ax;
    const apz = pz - az;
    const ab2 = abx * abx + abz * abz;

    if (ab2 < 0.0001) {
      // Degenerate segment
      const d = Math.sqrt(apx * apx + apz * apz);
      if (d < minDist) minDist = d;
      continue;
    }

    let t = (apx * abx + apz * abz) / ab2;
    t = Math.max(0, Math.min(1, t));

    const closestX = ax + t * abx;
    const closestZ = az + t * abz;
    const dx = px - closestX;
    const dz = pz - closestZ;
    const d = Math.sqrt(dx * dx + dz * dz);

    if (d < minDist) minDist = d;
  }

  return minDist;
}

/** Configuration for terrain features passed from MapGenerator. */
export interface TerrainFeatures {
  readonly biome: BiomeType;
  readonly rivers: readonly RiverSpawn[];
  readonly bridges: readonly BridgeSpawn[];
  readonly rockWalls: readonly RockWallSpawn[];
  readonly roads: readonly RoadSpawn[];
  readonly tunnels: readonly TunnelSpawn[];
  /** Extra spawn/building positions to flatten (beyond the default 4). */
  readonly flattenPositions: readonly { x: number; z: number }[];
}

/** Default empty features for backwards compatibility. */
const DEFAULT_FEATURES: TerrainFeatures = {
  biome: 'meadow',
  rivers: [],
  bridges: [],
  rockWalls: [],
  roads: [],
  tunnels: [],
  flattenPositions: [],
};

export class Terrain {
  readonly mesh: THREE.Mesh;
  readonly waterMesh: THREE.Mesh;
  readonly mapSize = MAP_SIZE;

  /** Optional grid overlay, toggled with G key. */
  private gridOverlay: THREE.LineSegments | null = null;
  private gridVisible = false;

  private geometry: THREE.PlaneGeometry;
  private heightData: Float32Array;
  /** Detail noise for vertex color variation. */
  private detailNoise: Float32Array;

  /** Active terrain features (rivers, roads, etc.). */
  private features: TerrainFeatures;

  /** Feature visual meshes added to the scene (for disposal). */
  readonly featureMeshes: THREE.Object3D[] = [];

  /** River mask: true for grid cells that are river water. */
  private riverMask: Uint8Array;

  /** Road mask: true for grid cells on a road. */
  private roadMask: Uint8Array;

  constructor(features?: TerrainFeatures) {
    this.features = features ?? DEFAULT_FEATURES;
    activePalette = BIOME_PALETTES[this.features.biome] ?? BIOME_PALETTES.meadow;

    this.geometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, SEGMENTS, SEGMENTS);
    this.geometry.rotateX(-Math.PI / 2);

    const vertexCount = (SEGMENTS + 1) * (SEGMENTS + 1);
    this.heightData = new Float32Array(vertexCount);
    this.detailNoise = new Float32Array(vertexCount);
    this.riverMask = new Uint8Array(vertexCount);
    this.roadMask = new Uint8Array(vertexCount);

    this.generateHeightmap();
    this.carveRivers();
    this.raiseRockWalls();
    this.markRoads();
    this.applyVertexColors();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.FrontSide,
      roughness: 0.85,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;

    this.waterMesh = this.createWaterPlane();

    // Build visual meshes for terrain features
    this.buildFeatureVisuals();

    // Create grid overlay (hidden by default)
    this.gridOverlay = this.createGridOverlay();
    this.gridOverlay.visible = false;

    // Listen for G key to toggle grid
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyG' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.toggleGrid();
      }
    });
  }

  getHeightAt(worldX: number, worldZ: number): number {
    const halfSize = MAP_SIZE / 2;
    const localX = worldX + halfSize;
    const localZ = worldZ + halfSize;

    const gridX = (localX / MAP_SIZE) * SEGMENTS;
    const gridZ = (localZ / MAP_SIZE) * SEGMENTS;

    const ix = Math.floor(gridX);
    const iz = Math.floor(gridZ);

    if (ix < 0 || ix >= SEGMENTS || iz < 0 || iz >= SEGMENTS) {
      return 0;
    }

    const fx = gridX - ix;
    const fz = gridZ - iz;

    const stride = SEGMENTS + 1;
    const h00 = this.heightData[iz * stride + ix];
    const h10 = this.heightData[iz * stride + ix + 1];
    const h01 = this.heightData[(iz + 1) * stride + ix];
    const h11 = this.heightData[(iz + 1) * stride + ix + 1];

    if (fx + fz <= 1) {
      return h00 + fx * (h10 - h00) + fz * (h01 - h00);
    } else {
      return h11 + (1 - fx) * (h01 - h11) + (1 - fz) * (h10 - h11);
    }
  }

  /** Get the grid overlay mesh (for adding to scene). */
  get gridMesh(): THREE.LineSegments | null {
    return this.gridOverlay;
  }

  /** Toggle the building placement grid on/off. */
  toggleGrid(): void {
    this.gridVisible = !this.gridVisible;
    if (this.gridOverlay) {
      this.gridOverlay.visible = this.gridVisible;
    }
  }

  /** Get the active terrain features. */
  getFeatures(): Readonly<TerrainFeatures> {
    return this.features;
  }

  /**
   * Rebuild the terrain with new features.
   * Called when a new map is generated with specific terrain features.
   * Re-generates the heightmap, carves rivers, and rebuilds visuals.
   */
  rebuild(features: TerrainFeatures): void {
    this.features = features;
    activePalette = BIOME_PALETTES[features.biome] ?? BIOME_PALETTES.meadow;

    // Reset masks
    const vertexCount = (SEGMENTS + 1) * (SEGMENTS + 1);
    this.riverMask = new Uint8Array(vertexCount);
    this.roadMask = new Uint8Array(vertexCount);

    // Dispose old feature meshes
    for (const obj of this.featureMeshes) {
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else (m.material as THREE.Material).dispose();
        }
      });
    }
    this.featureMeshes.length = 0;

    // Rebuild everything
    this.generateHeightmap();
    this.carveRivers();
    this.raiseRockWalls();
    this.markRoads();
    this.applyVertexColors();
    this.buildFeatureVisuals();

    // Update geometry
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /** Check if a world position is on a road (for speed bonus). */
  isOnRoad(worldX: number, worldZ: number): boolean {
    const halfSize = MAP_SIZE / 2;
    const ix = Math.round(((worldX + halfSize) / MAP_SIZE) * SEGMENTS);
    const iz = Math.round(((worldZ + halfSize) / MAP_SIZE) * SEGMENTS);
    if (ix < 0 || ix > SEGMENTS || iz < 0 || iz > SEGMENTS) return false;
    return this.roadMask[iz * (SEGMENTS + 1) + ix] === 1;
  }

  /** Check if a world position is in a river (impassable except at bridges). */
  isRiver(worldX: number, worldZ: number): boolean {
    const halfSize = MAP_SIZE / 2;
    const ix = Math.round(((worldX + halfSize) / MAP_SIZE) * SEGMENTS);
    const iz = Math.round(((worldZ + halfSize) / MAP_SIZE) * SEGMENTS);
    if (ix < 0 || ix > SEGMENTS || iz < 0 || iz > SEGMENTS) return false;
    return this.riverMask[iz * (SEGMENTS + 1) + ix] === 1;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    (this.waterMesh.material as THREE.Material).dispose();
    this.waterMesh.geometry.dispose();
    if (this.gridOverlay) {
      this.gridOverlay.geometry.dispose();
      (this.gridOverlay.material as THREE.Material).dispose();
    }
    // Dispose feature meshes
    for (const obj of this.featureMeshes) {
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else (m.material as THREE.Material).dispose();
        }
      });
    }
    this.featureMeshes.length = 0;
  }

  private generateHeightmap(): void {
    const noise2D = createNoise2D();
    // Second noise function for vertex color detail variation
    const detailNoise2D = createNoise2D();
    // Third noise for plateau detection
    const plateauNoise2D = createNoise2D();
    const positions = this.geometry.attributes.position;
    const stride = SEGMENTS + 1;

    for (let iz = 0; iz <= SEGMENTS; iz++) {
      for (let ix = 0; ix <= SEGMENTS; ix++) {
        const idx = iz * stride + ix;

        const nx = ix / SEGMENTS;
        const nz = iz / SEGMENTS;

        let amplitude = 1;
        let frequency = 1;
        let noiseValue = 0;
        let maxAmplitude = 0;

        for (let o = 0; o < OCTAVES; o++) {
          noiseValue += amplitude * noise2D(
            nx * frequency / NOISE_SCALE,
            nz * frequency / NOISE_SCALE,
          );
          maxAmplitude += amplitude;
          amplitude *= PERSISTENCE;
          frequency *= LACUNARITY;
        }

        noiseValue /= maxAmplitude;

        const edgeFalloff = this.edgeFalloff(nx, nz);
        // More pronounced rolling hills with higher MAX_HEIGHT
        let raw = ((noiseValue + 1) / 2) * MAX_HEIGHT * edgeFalloff;
        let height = 0.1 + raw * 0.9;

        // Plateau effect: flatten tops of high terrain areas
        const plateauThreshold = MAX_HEIGHT * 0.65;
        if (height > plateauThreshold) {
          const plateauNoise = plateauNoise2D(nx * 30, nz * 30);
          // Some high areas become flat plateaus, others remain peaked
          if (plateauNoise > 0.1) {
            const excess = height - plateauThreshold;
            const dampen = 0.15 + (1 - plateauNoise) * 0.3;
            height = plateauThreshold + excess * dampen;
          }
        }

        // Cliff edges along water: steepen transitions near low areas
        if (height < 0.8 && height > 0.3) {
          const cliffNoise = noise2D(nx * 200, nz * 200);
          if (cliffNoise > 0.3) {
            // Sharpen the transition: push low areas lower for cliff effect
            height = height * 0.7;
          }
        }

        this.heightData[idx] = height;

        // High-frequency detail noise for vertex color variation
        this.detailNoise[idx] = detailNoise2D(nx * 80, nz * 80);
      }
    }

    // Flatten spawn areas so buildings don't end up on slopes
    // Combine default spawn positions with any custom flatten positions from features
    const spawnPositions = [
      { x: 25, z: 25 }, { x: -25, z: -25 },
      { x: 25, z: -25 }, { x: -25, z: 25 },
      ...this.features.flattenPositions,
    ];
    const flattenRadiusInner = 8;
    const flattenRadiusOuter = 15;
    const halfSize = MAP_SIZE / 2;

    for (let iz = 0; iz <= SEGMENTS; iz++) {
      for (let ix = 0; ix <= SEGMENTS; ix++) {
        const idx = iz * stride + ix;
        const worldX = (ix / SEGMENTS) * MAP_SIZE - halfSize;
        const worldZ = (iz / SEGMENTS) * MAP_SIZE - halfSize;

        for (const sp of spawnPositions) {
          const dx = worldX - sp.x;
          const dz = worldZ - sp.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < flattenRadiusOuter) {
            const flatHeight = 0.15; // near-zero base height for spawn areas
            if (dist <= flattenRadiusInner) {
              this.heightData[idx] = flatHeight;
            } else {
              const t = (dist - flattenRadiusInner) / (flattenRadiusOuter - flattenRadiusInner);
              // Smooth hermite interpolation
              const smooth = t * t * (3 - 2 * t);
              this.heightData[idx] = flatHeight + (this.heightData[idx] - flatHeight) * smooth;
            }
          }
        }

        positions.setY(idx, this.heightData[idx]);
      }
    }

    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private edgeFalloff(_nx: number, _nz: number): number {
    // No edge falloff — flat terrain to the edges, no black patches
    return 1;
  }

  private applyVertexColors(): void {
    const positions = this.geometry.attributes.position;
    const normals = this.geometry.attributes.normal;
    const count = positions.count;
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const tmpColor = new THREE.Color();
    const stride = SEGMENTS + 1;

    // Use active biome palette
    const pal = activePalette;

    // River water color
    const riverColor = new THREE.Color('#2a7a9a');
    // Road color
    const roadColor = new THREE.Color('#a09070');

    for (let i = 0; i < count; i++) {
      const height = this.heightData[i];
      const detail = this.detailNoise[i]; // -1..1 range

      // Derive grid coords for seeded random
      const ix = i % stride;
      const iz = Math.floor(i / stride);

      // Check if this vertex is a river or road cell
      const isRiverCell = this.riverMask[i] === 1;
      const isRoadCell = this.roadMask[i] === 1;

      if (isRiverCell) {
        // River vertices: blue water color with slight variation
        const rng = seededRandom(ix, iz);
        color.copy(riverColor);
        color.multiplyScalar(0.9 + rng * 0.2);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        continue;
      }

      if (isRoadCell) {
        // Road vertices: packed earth/dirt color
        const rng = seededRandom(ix, iz);
        color.copy(roadColor);
        color.multiplyScalar(0.92 + rng * 0.16);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        continue;
      }

      // Compute slope from vertex normal (steeper = lower ny)
      const ny = normals.getY(i);
      const slope = 1 - ny; // 0 = flat, ~1 = very steep

      // Normalized height 0..1
      const t = Math.min(1, height / MAX_HEIGHT);

      if (t < 0.2) {
        color.lerpColors(pal.deepGrass, pal.grassLush, t / 0.2);
        color.multiplyScalar(0.88 + t * 0.6);
      } else if (t < 0.45) {
        const mt = (t - 0.2) / 0.25;
        color.lerpColors(pal.grassLush, pal.grass, mt);
      } else if (t < 0.65) {
        const mt = (t - 0.45) / 0.2;
        color.lerpColors(pal.grass, pal.grassLight, mt);
        if (detail > 0.3) {
          tmpColor.copy(pal.path);
          color.lerp(tmpColor, (detail - 0.3) * 0.45);
        }
      } else if (t < 0.85) {
        const ht = (t - 0.65) / 0.2;
        color.lerpColors(pal.grassLight, pal.hill, ht);
      } else {
        const pt = (t - 0.85) / 0.15;
        color.lerpColors(pal.hill, pal.hillTop, Math.min(1, pt));
        color.multiplyScalar(1.05 + pt * 0.08);
      }

      // Slope-based blending: steep slopes get sandy/brown tones
      if (slope > 0.15) {
        tmpColor.copy(pal.sandy);
        const slopeFactor = Math.min(1, (slope - 0.15) * 3.0);
        color.lerp(tmpColor, slopeFactor * 0.5);
      }

      // Micro-variation: seeded random per vertex for +-6% brightness/hue shift
      const rng = seededRandom(ix, iz); // 0..1
      const brightnessShift = 0.94 + rng * 0.12; // 0.94 .. 1.06

      // Slight hue shift: nudge green channel for organic feel
      const hueShift = (seededRandom(ix + 9999, iz + 7777) - 0.5) * 0.035;

      // Detail noise drives green-shade patches (clumps of different grass)
      const detailFactor = detail * 0.5 + 0.5; // 0..1
      const detailVariation = 0.96 + detailFactor * 0.08; // 0.96..1.04

      // Extra green micro-patches: some vertices get slightly warmer/cooler green
      const patchRng = seededRandom(ix + 3141, iz + 2718);
      const patchShift = patchRng > 0.8 ? 0.04 : (patchRng < 0.2 ? -0.03 : 0);

      const finalVariation = brightnessShift * detailVariation;

      colors[i * 3] = Math.min(1, Math.max(0, color.r * finalVariation));
      colors[i * 3 + 1] = Math.min(1, Math.max(0, (color.g + hueShift + patchShift) * finalVariation));
      colors[i * 3 + 2] = Math.min(1, Math.max(0, (color.b - hueShift * 0.5) * finalVariation));
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();
  }

  // ---------------------------------------------------------------------------
  // Terrain feature manipulation (rivers, rock walls, roads)
  // ---------------------------------------------------------------------------

  /**
   * Carve rivers into the heightmap by lowering terrain along the river path
   * and marking the river mask. Bridge positions are excluded from carving.
   */
  private carveRivers(): void {
    if (this.features.rivers.length === 0) return;

    const stride = SEGMENTS + 1;
    const halfSize = MAP_SIZE / 2;
    const positions = this.geometry.attributes.position;

    // Build set of bridge positions for exclusion
    const bridges = this.features.bridges;

    for (const river of this.features.rivers) {
      const riverWidth = river.width;
      const halfWidth = riverWidth / 2;

      // For each vertex, check distance to the river path
      for (let iz = 0; iz <= SEGMENTS; iz++) {
        for (let ix = 0; ix <= SEGMENTS; ix++) {
          const idx = iz * stride + ix;
          const worldX = (ix / SEGMENTS) * MAP_SIZE - halfSize;
          const worldZ = (iz / SEGMENTS) * MAP_SIZE - halfSize;

          // Check if this point is under a bridge (skip carving there)
          let underBridge = false;
          for (const bridge of bridges) {
            const bdx = worldX - bridge.x;
            const bdz = worldZ - bridge.z;
            const bDist = Math.sqrt(bdx * bdx + bdz * bdz);
            if (bDist < bridge.width * 0.8) {
              underBridge = true;
              break;
            }
          }
          if (underBridge) continue;

          // Distance to river path (polyline)
          const dist = distanceToPath(worldX, worldZ, river.path);

          if (dist < halfWidth) {
            // Core river: below water level
            const depthFactor = 1 - (dist / halfWidth);
            const riverDepth = WATER_LEVEL - 0.5 * depthFactor;
            this.heightData[idx] = riverDepth;
            this.riverMask[idx] = 1;
            positions.setY(idx, riverDepth);
          } else if (dist < halfWidth + 2.0) {
            // River bank: steep transition
            const bankT = (dist - halfWidth) / 2.0;
            const bankSmooth = bankT * bankT * (3 - 2 * bankT);
            const bankHeight = WATER_LEVEL + (this.heightData[idx] - WATER_LEVEL) * bankSmooth;
            if (bankHeight < this.heightData[idx]) {
              this.heightData[idx] = bankHeight;
              positions.setY(idx, bankHeight);
            }
          }
        }
      }
    }

    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /**
   * Raise terrain under rock wall paths to create impassable formations.
   */
  private raiseRockWalls(): void {
    if (this.features.rockWalls.length === 0) return;

    const stride = SEGMENTS + 1;
    const halfSize = MAP_SIZE / 2;
    const positions = this.geometry.attributes.position;

    for (const wall of this.features.rockWalls) {
      const halfThick = wall.thickness / 2;
      const wallHeight = MAX_HEIGHT * 1.2; // Walls are taller than natural terrain

      for (let iz = 0; iz <= SEGMENTS; iz++) {
        for (let ix = 0; ix <= SEGMENTS; ix++) {
          const idx = iz * stride + ix;
          const worldX = (ix / SEGMENTS) * MAP_SIZE - halfSize;
          const worldZ = (iz / SEGMENTS) * MAP_SIZE - halfSize;

          const dist = distanceToPath(worldX, worldZ, wall.path);

          if (dist < halfThick) {
            // Core wall: maximum height
            this.heightData[idx] = wallHeight;
            positions.setY(idx, wallHeight);
          } else if (dist < halfThick + 1.5) {
            // Transition zone: smooth slope up to wall
            const t = (dist - halfThick) / 1.5;
            const smooth = t * t * (3 - 2 * t);
            const blended = wallHeight + (this.heightData[idx] - wallHeight) * smooth;
            if (blended > this.heightData[idx]) {
              this.heightData[idx] = blended;
              positions.setY(idx, blended);
            }
          }
        }
      }
    }

    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /**
   * Mark road cells on the terrain and slightly flatten road surfaces.
   */
  private markRoads(): void {
    if (this.features.roads.length === 0) return;

    const stride = SEGMENTS + 1;
    const halfSize = MAP_SIZE / 2;
    const positions = this.geometry.attributes.position;

    for (const road of this.features.roads) {
      const halfWidth = road.width / 2;

      for (let iz = 0; iz <= SEGMENTS; iz++) {
        for (let ix = 0; ix <= SEGMENTS; ix++) {
          const idx = iz * stride + ix;
          const worldX = (ix / SEGMENTS) * MAP_SIZE - halfSize;
          const worldZ = (iz / SEGMENTS) * MAP_SIZE - halfSize;

          const dist = distanceToPath(worldX, worldZ, road.path);

          if (dist < halfWidth) {
            this.roadMask[idx] = 1;
            // Slightly flatten roads: reduce local height variation
            // Average with neighbors would be complex; just smooth toward a local average
            const smoothHeight = this.heightData[idx] * 0.85 + 0.15 * 0.3;
            this.heightData[idx] = Math.max(0.15, smoothHeight);
            positions.setY(idx, this.heightData[idx]);
          }
        }
      }
    }

    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /**
   * Build 3D visual objects for terrain features (bridges, tunnel entrances).
   * These get added to featureMeshes array for the Game to add to the scene.
   */
  private buildFeatureVisuals(): void {
    // Bridge visuals: flat stone-colored planes spanning the river
    for (const bridge of this.features.bridges) {
      const bridgeGeo = new THREE.BoxGeometry(bridge.width, 0.3, bridge.length);
      const bridgeMat = new THREE.MeshStandardMaterial({
        color: '#8a7a6a',
        roughness: 0.9,
        metalness: 0.1,
      });
      const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
      const bridgeY = this.getHeightAt(bridge.x, bridge.z);
      bridgeMesh.position.set(bridge.x, Math.max(bridgeY, WATER_LEVEL + 0.3), bridge.z);
      bridgeMesh.rotation.y = bridge.rotation;
      bridgeMesh.castShadow = true;
      bridgeMesh.receiveShadow = true;
      this.featureMeshes.push(bridgeMesh);

      // Bridge railings (two thin boxes on each side)
      for (const side of [-1, 1]) {
        const railGeo = new THREE.BoxGeometry(0.2, 0.6, bridge.length);
        const railMat = new THREE.MeshStandardMaterial({
          color: '#6a5a4a',
          roughness: 0.85,
          metalness: 0.05,
        });
        const railMesh = new THREE.Mesh(railGeo, railMat);
        const offsetX = Math.cos(bridge.rotation) * side * (bridge.width / 2 - 0.15);
        const offsetZ = Math.sin(bridge.rotation) * side * (bridge.width / 2 - 0.15);
        railMesh.position.set(
          bridge.x + offsetX,
          bridgeMesh.position.y + 0.4,
          bridge.z + offsetZ,
        );
        railMesh.rotation.y = bridge.rotation;
        railMesh.castShadow = true;
        this.featureMeshes.push(railMesh);
      }
    }

    // Tunnel entrance visuals: cave/mine entrance with vertical archway
    for (const tunnel of this.features.tunnels) {
      for (const point of [tunnel.entrance, tunnel.exit]) {
        const tunnelY = this.getHeightAt(point.x, point.z);

        // Calculate rotation so the arch faces toward map center (0, 0)
        const facingAngle = Math.atan2(-point.z, -point.x);

        // Parent group for the entire tunnel entrance (rotated as a unit)
        const tunnelGroup = new THREE.Group();
        tunnelGroup.position.set(point.x, tunnelY, point.z);
        tunnelGroup.rotation.y = facingAngle;

        // --- 1. Stone archway (vertical half-torus) ---
        const archGeo = new THREE.TorusGeometry(1.4, 0.25, 8, 16, Math.PI);
        const archMat = new THREE.MeshStandardMaterial({
          color: '#6a5a4a',
          roughness: 0.85,
          metalness: 0.1,
        });
        const archMesh = new THREE.Mesh(archGeo, archMat);
        // Stand the half-torus upright: rotate so the arch rises vertically
        archMesh.rotation.z = Math.PI; // Flip so open side faces down
        archMesh.position.set(0, 1.4, 0); // Centered, raised to ground level
        archMesh.castShadow = true;
        tunnelGroup.add(archMesh);

        // --- 2. Stone blocks along the arch frame ---
        const stoneColors = ['#6a5a4a', '#7a6a5a', '#5e5248', '#74644e'];
        const numStones = 9;
        for (let i = 0; i < numStones; i++) {
          // Distribute stones along the arch (from left base to right base)
          const t = (i / (numStones - 1)) * Math.PI; // 0 to PI
          const stoneX = Math.cos(t) * 1.4;
          const stoneY = Math.sin(t) * 1.4;
          const stoneGeo = new THREE.BoxGeometry(
            0.35 + Math.random() * 0.15,
            0.3 + Math.random() * 0.1,
            0.4 + Math.random() * 0.1,
          );
          const stoneMat = new THREE.MeshStandardMaterial({
            color: stoneColors[i % stoneColors.length],
            roughness: 0.9,
            metalness: 0.05,
          });
          const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
          stoneMesh.position.set(stoneX, stoneY, 0);
          // Rotate each stone to follow the arch curvature
          stoneMesh.rotation.z = t - Math.PI / 2;
          stoneMesh.castShadow = true;
          tunnelGroup.add(stoneMesh);
        }

        // --- 3. Vertical dark opening (the cave depth) ---
        const openingGeo = new THREE.CircleGeometry(1.1, 20);
        const openingMat = new THREE.MeshStandardMaterial({
          color: '#0e0e0e',
          roughness: 1.0,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });
        const openingMesh = new THREE.Mesh(openingGeo, openingMat);
        // Place it vertical, slightly behind the arch
        openingMesh.rotation.y = Math.PI / 2;
        openingMesh.position.set(-0.15, 0.9, 0);
        tunnelGroup.add(openingMesh);

        // Inner darker circle for depth illusion
        const innerGeo = new THREE.CircleGeometry(0.7, 16);
        const innerMat = new THREE.MeshStandardMaterial({
          color: '#050505',
          roughness: 1.0,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        innerMesh.rotation.y = Math.PI / 2;
        innerMesh.position.set(-0.25, 0.85, 0);
        tunnelGroup.add(innerMesh);

        // --- 4. Ground stone ring marking (visible from above) ---
        const groundRingGeo = new THREE.RingGeometry(1.6, 2.2, 24);
        const groundRingMat = new THREE.MeshStandardMaterial({
          color: '#8a7a6a',
          roughness: 0.9,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });
        const groundRingMesh = new THREE.Mesh(groundRingGeo, groundRingMat);
        groundRingMesh.rotation.x = -Math.PI / 2;
        groundRingMesh.position.set(0, 0.06, 0);
        groundRingMesh.receiveShadow = true;
        tunnelGroup.add(groundRingMesh);

        // Subtle glow ring on the ground
        const glowGeo = new THREE.RingGeometry(1.2, 1.7, 24);
        const glowMat = new THREE.MeshBasicMaterial({
          color: tunnel.factionOwner !== null ? '#88aaff' : '#88ff88',
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.rotation.x = -Math.PI / 2;
        glowMesh.position.set(0, 0.08, 0);
        tunnelGroup.add(glowMesh);

        // --- 5. Lantern spheres on either side of the entrance ---
        const lanternColor = tunnel.factionOwner !== null ? '#6688cc' : '#66cc66';
        for (const side of [-1, 1]) {
          const lanternGeo = new THREE.SphereGeometry(0.15, 8, 8);
          const lanternMat = new THREE.MeshStandardMaterial({
            color: lanternColor,
            emissive: lanternColor,
            emissiveIntensity: 0.8,
            roughness: 0.3,
            metalness: 0.1,
          });
          const lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);
          lanternMesh.position.set(0.1, 1.8, side * 1.5);
          lanternMesh.castShadow = true;
          tunnelGroup.add(lanternMesh);

          // Small post/pole under each lantern
          const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6);
          const postMat = new THREE.MeshStandardMaterial({
            color: '#4a3a2a',
            roughness: 0.9,
            metalness: 0.1,
          });
          const postMesh = new THREE.Mesh(postGeo, postMat);
          postMesh.position.set(0.1, 0.9, side * 1.5);
          postMesh.castShadow = true;
          tunnelGroup.add(postMesh);
        }

        // --- 6. Side wall pillars for structure ---
        for (const side of [-1, 1]) {
          const pillarGeo = new THREE.BoxGeometry(0.35, 2.0, 0.35);
          const pillarMat = new THREE.MeshStandardMaterial({
            color: '#5e5248',
            roughness: 0.85,
            metalness: 0.1,
          });
          const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
          pillarMesh.position.set(0, 1.0, side * 1.15);
          pillarMesh.castShadow = true;
          tunnelGroup.add(pillarMesh);
        }

        this.featureMeshes.push(tunnelGroup);
      }
    }
  }

  private createGridOverlay(): THREE.LineSegments {
    const gridSize = 4; // 4 world units per grid cell (good for building placement)
    const halfMap = MAP_SIZE / 2;
    const lines: number[] = [];

    // Horizontal lines (along X)
    for (let z = -halfMap; z <= halfMap; z += gridSize) {
      lines.push(-halfMap, 0.15, z, halfMap, 0.15, z);
    }
    // Vertical lines (along Z)
    for (let x = -halfMap; x <= halfMap; x += gridSize) {
      lines.push(x, 0.15, -halfMap, x, 0.15, halfMap);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });

    const lineSegments = new THREE.LineSegments(geo, mat);
    lineSegments.renderOrder = 5;
    lineSegments.frustumCulled = false;
    return lineSegments;
  }

  private createWaterPlane(): THREE.Mesh {
    const waterGeo = new THREE.PlaneGeometry(MAP_SIZE * 1.5, MAP_SIZE * 1.5, 80, 80);
    waterGeo.rotateX(-Math.PI / 2);

    waterGeometry = waterGeo;

    const waterMat = new THREE.MeshStandardMaterial({
      color: '#1a6b8a',
      transparent: true,
      opacity: 0.82,
      roughness: 0.08,
      metalness: 0.6,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
    });

    // Add vertex colors for depth gradient (darker in center, lighter at edges)
    const colors = new Float32Array(waterGeo.attributes.position.count * 3);
    const deepColor = new THREE.Color('#0d4a6a');
    const shallowColor = new THREE.Color('#3a9ab8');
    const halfSize = MAP_SIZE * 0.75;
    for (let i = 0; i < waterGeo.attributes.position.count; i++) {
      const x = waterGeo.attributes.position.getX(i);
      const z = waterGeo.attributes.position.getZ(i);
      const dist = Math.sqrt(x * x + z * z) / halfSize;
      const t = Math.min(dist, 1);
      const c = deepColor.clone().lerp(shallowColor, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    waterGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    waterMat.vertexColors = true;

    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = WATER_LEVEL;
    return water;
  }
}

/**
 * Animate the water surface each frame with gentle overlapping sine waves.
 * @param elapsed - Total elapsed time in seconds (e.g. from a running clock).
 */
export function updateWater(elapsed: number): void {
  if (!waterGeometry) return;

  const positions = waterGeometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    // Three overlapping sine waves for realistic ocean-like movement
    const y = Math.sin(x * 0.3 + elapsed * 0.7) * 0.12
            + Math.sin(z * 0.2 + elapsed * 0.5) * 0.10
            + Math.sin((x + z) * 0.15 + elapsed * 1.1) * 0.06;
    positions.setY(i, y);
  }
  positions.needsUpdate = true;
  waterGeometry.computeVertexNormals();
}
