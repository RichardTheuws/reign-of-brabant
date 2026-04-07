import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const MAP_SIZE = 128;
const SEGMENTS = 256;
const MAX_HEIGHT = 2.0;
const WATER_LEVEL = -1;
const NOISE_SCALE = 0.012;
const OCTAVES = 4;
const PERSISTENCE = 0.45;
const LACUNARITY = 2.2;

// Clean, saturated Brabant meadow palette
const COLOR_DEEP_GRASS = new THREE.Color('#48a035');
const COLOR_GRASS = new THREE.Color('#5cb840');
const COLOR_GRASS_LIGHT = new THREE.Color('#6ec850');
const COLOR_GRASS_LUSH = new THREE.Color('#55b042');
const COLOR_PATH = new THREE.Color('#c4a868');
const COLOR_SANDY = new THREE.Color('#d4b878');
const COLOR_HILL = new THREE.Color('#5aaa45');
const COLOR_HILL_TOP = new THREE.Color('#70b858');
const COLOR_WATER_EDGE = new THREE.Color('#4a8a5a');

/** Module-level reference to the water geometry so updateWater() can access it. */
let waterGeometry: THREE.BufferGeometry | null = null;

/** Simple deterministic hash for seeded random per vertex. */
function seededRandom(x: number, z: number): number {
  let h = (x * 374761393 + z * 668265263 + 1013904223) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff; // 0..1
}

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

  constructor() {
    this.geometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, SEGMENTS, SEGMENTS);
    this.geometry.rotateX(-Math.PI / 2);

    const vertexCount = (SEGMENTS + 1) * (SEGMENTS + 1);
    this.heightData = new Float32Array(vertexCount);
    this.detailNoise = new Float32Array(vertexCount);

    this.generateHeightmap();
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

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    (this.waterMesh.material as THREE.Material).dispose();
    this.waterMesh.geometry.dispose();
    if (this.gridOverlay) {
      this.gridOverlay.geometry.dispose();
      (this.gridOverlay.material as THREE.Material).dispose();
    }
  }

  private generateHeightmap(): void {
    const noise2D = createNoise2D();
    // Second noise function for vertex color detail variation
    const detailNoise2D = createNoise2D();
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
        // Gentle rolling hills — all terrain above 0, no underwater
        const raw = ((noiseValue + 1) / 2) * MAX_HEIGHT * edgeFalloff;
        const height = 0.1 + raw * 0.9; // range: 0.1 .. MAX_HEIGHT

        this.heightData[idx] = height;

        // High-frequency detail noise for vertex color variation
        this.detailNoise[idx] = detailNoise2D(nx * 80, nz * 80);
      }
    }

    // Flatten spawn areas so buildings don't end up on slopes
    const spawnPositions = [
      { x: 25, z: 25 }, { x: -25, z: -25 },
      { x: 25, z: -25 }, { x: -25, z: 25 },
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

    for (let i = 0; i < count; i++) {
      const height = this.heightData[i];
      const detail = this.detailNoise[i]; // -1..1 range

      // Derive grid coords for seeded random
      const ix = i % stride;
      const iz = Math.floor(i / stride);

      // Compute slope from vertex normal (steeper = lower ny)
      const ny = normals.getY(i);
      const slope = 1 - ny; // 0 = flat, ~1 = very steep

      // Normalized height 0..1
      const t = Math.min(1, height / MAX_HEIGHT);

      if (t < 0.2) {
        // Valley floors: deeper, richer green — slightly darkened
        color.lerpColors(COLOR_DEEP_GRASS, COLOR_GRASS_LUSH, t / 0.2);
        // Darken valleys for depth
        color.multiplyScalar(0.88 + t * 0.6);
      } else if (t < 0.45) {
        // Low-mid: lush meadow
        const mt = (t - 0.2) / 0.25;
        color.lerpColors(COLOR_GRASS_LUSH, COLOR_GRASS, mt);
      } else if (t < 0.65) {
        // Mid areas: standard green with dirt path patches
        const mt = (t - 0.45) / 0.2;
        color.lerpColors(COLOR_GRASS, COLOR_GRASS_LIGHT, mt);
        // Sandy dirt patches where noise is high
        if (detail > 0.3) {
          tmpColor.copy(COLOR_PATH);
          color.lerp(tmpColor, (detail - 0.3) * 0.45);
        }
      } else if (t < 0.85) {
        // Higher areas: lighter grass transitioning to hill color
        const ht = (t - 0.65) / 0.2;
        color.lerpColors(COLOR_GRASS_LIGHT, COLOR_HILL, ht);
      } else {
        // Hill tops: sun-bleached warm green
        const pt = (t - 0.85) / 0.15;
        color.lerpColors(COLOR_HILL, COLOR_HILL_TOP, Math.min(1, pt));
        // Brighten hilltops that catch sunlight
        color.multiplyScalar(1.05 + pt * 0.08);
      }

      // Slope-based blending: steep slopes get sandy/brown tones
      if (slope > 0.15) {
        tmpColor.copy(COLOR_SANDY);
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
