import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const MAP_SIZE = 128;
const SEGMENTS = 128;
const MAX_HEIGHT = 0.4;
const WATER_LEVEL = -1;
const NOISE_SCALE = 0.006;
const OCTAVES = 1;
const PERSISTENCE = 0.25;
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
        positions.setY(idx, height);

        // High-frequency detail noise for vertex color variation
        this.detailNoise[idx] = detailNoise2D(nx * 80, nz * 80);
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

      // Simple, clean color zones — mostly green with subtle variation
      const t = Math.min(1, height / MAX_HEIGHT); // 0..1 normalized height

      if (t < 0.3) {
        // Low areas: lush meadow green
        color.lerpColors(COLOR_GRASS_LUSH, COLOR_GRASS, t / 0.3);
      } else if (t < 0.6) {
        // Mid areas: standard green with detail-based patches
        const mt = (t - 0.3) / 0.3;
        color.lerpColors(COLOR_GRASS, COLOR_GRASS_LIGHT, mt);
        // Subtle dirt patches based on noise
        if (detail > 0.4) {
          tmpColor.copy(COLOR_PATH);
          color.lerp(tmpColor, (detail - 0.4) * 0.3);
        }
      } else if (t < 0.85) {
        // Higher areas: light grass to hill green
        const ht = (t - 0.6) / 0.25;
        color.lerpColors(COLOR_GRASS_LIGHT, COLOR_HILL, ht);
      } else {
        // Hill tops: sun-bleached
        const pt = (t - 0.85) / 0.15;
        color.lerpColors(COLOR_HILL, COLOR_HILL_TOP, Math.min(1, pt));
      }

      // Micro-variation: seeded random per vertex for +-4% brightness/hue shift
      const rng = seededRandom(ix, iz); // 0..1
      const brightnessShift = 0.96 + rng * 0.08; // 0.96 .. 1.04

      // Slight hue shift: nudge green channel differently from red/blue
      const hueShift = (seededRandom(ix + 9999, iz + 7777) - 0.5) * 0.024; // -0.012..+0.012

      // Also layer in the detail noise for additional organic variation
      const detailVariation = 0.988 + (detail * 0.5 + 0.5) * 0.024;

      const finalVariation = brightnessShift * detailVariation;

      colors[i * 3] = Math.min(1, color.r * finalVariation);
      colors[i * 3 + 1] = Math.min(1, (color.g + hueShift) * finalVariation);
      colors[i * 3 + 2] = Math.min(1, (color.b - hueShift * 0.5) * finalVariation);
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
    const waterGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, 64, 64);
    waterGeo.rotateX(-Math.PI / 2);

    // Store reference at module level so updateWater() can animate vertices
    waterGeometry = waterGeo;

    const waterMat = new THREE.MeshStandardMaterial({
      color: '#2a7aa0',
      transparent: true,
      opacity: 0.7,
      roughness: 0.15,
      metalness: 0.4,
      envMapIntensity: 0.8,
      side: THREE.DoubleSide,
    });

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
    // Two overlapping sine waves at different frequencies and directions
    const y = Math.sin(x * 0.5 + elapsed * 0.8) * 0.04
            + Math.sin(z * 0.3 + elapsed * 0.6) * 0.04;
    positions.setY(i, y);
  }
  positions.needsUpdate = true;
  waterGeometry.computeVertexNormals();
}
