import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const MAP_SIZE = 128;
const SEGMENTS = 128;
const MAX_HEIGHT = 3;
const WATER_LEVEL = 0;
const NOISE_SCALE = 0.02;
const OCTAVES = 4;
const PERSISTENCE = 0.45;
const LACUNARITY = 2.2;

// Richer green palette for more natural terrain
const COLOR_GRASS_LIGHT = new THREE.Color(0x5a9e4a);
const COLOR_GRASS = new THREE.Color(0x4a8c3f);
const COLOR_GRASS_DARK = new THREE.Color(0x3a7030);
const COLOR_GRASS_LUSH = new THREE.Color(0x4d9938);
const COLOR_PATH = new THREE.Color(0x8b7355);
const COLOR_WATER_SHORE = new THREE.Color(0x3a6a8a);
const COLOR_SHORE_FOAM = new THREE.Color(0x6a9ab0);
const COLOR_HILL = new THREE.Color(0x6a9a50);
const COLOR_HILL_TOP = new THREE.Color(0x7aaa5a);

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

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.FrontSide,
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
        let height = ((noiseValue + 1) / 2) * MAX_HEIGHT * edgeFalloff;

        if (height < WATER_LEVEL + 0.1) {
          height = WATER_LEVEL - 0.2;
        }

        this.heightData[idx] = height;
        positions.setY(idx, height);

        // High-frequency detail noise for vertex color variation
        this.detailNoise[idx] = detailNoise2D(nx * 80, nz * 80);
      }
    }

    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private edgeFalloff(nx: number, nz: number): number {
    const dx = Math.abs(nx - 0.5) * 2;
    const dz = Math.abs(nz - 0.5) * 2;
    const d = Math.max(dx, dz);
    if (d > 0.85) {
      return 1 - ((d - 0.85) / 0.15);
    }
    return 1;
  }

  private applyVertexColors(): void {
    const count = this.geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const height = this.heightData[i];
      const detail = this.detailNoise[i]; // -1..1 range

      if (height <= WATER_LEVEL + 0.15) {
        // Shore / water edge: blend between shore foam and water shore color
        const shoreT = Math.max(0, (height - (WATER_LEVEL - 0.2)) / 0.35);
        color.lerpColors(COLOR_WATER_SHORE, COLOR_SHORE_FOAM, shoreT);
      } else if (height < MAX_HEIGHT * 0.15) {
        // Low grass near water: lighter, lush green
        const t = (height - (WATER_LEVEL + 0.15)) / (MAX_HEIGHT * 0.15 - WATER_LEVEL - 0.15);
        color.lerpColors(COLOR_GRASS_LUSH, COLOR_GRASS_LIGHT, t);
      } else if (height < MAX_HEIGHT * 0.3) {
        // Main grassland: blend between light and standard grass using detail noise
        const t = (height - MAX_HEIGHT * 0.15) / (MAX_HEIGHT * 0.15);
        color.lerpColors(COLOR_GRASS_LIGHT, COLOR_GRASS, t);
        // Mix in lush variant based on detail noise for natural patchiness
        if (detail > 0.3) {
          const blend = (detail - 0.3) * 1.4;
          tmpColor.copy(COLOR_GRASS_LUSH);
          color.lerp(tmpColor, blend * 0.3);
        }
      } else if (height < MAX_HEIGHT * 0.5) {
        // Mid-height: darker grass
        const t = (height - MAX_HEIGHT * 0.3) / (MAX_HEIGHT * 0.2);
        color.lerpColors(COLOR_GRASS, COLOR_GRASS_DARK, t);
      } else if (height < MAX_HEIGHT * 0.7) {
        // Transition to dirt/path
        const t = (height - MAX_HEIGHT * 0.5) / (MAX_HEIGHT * 0.2);
        color.lerpColors(COLOR_GRASS_DARK, COLOR_PATH, t);
      } else if (height < MAX_HEIGHT * 0.85) {
        // Upper hills
        const t = (height - MAX_HEIGHT * 0.7) / (MAX_HEIGHT * 0.15);
        color.lerpColors(COLOR_PATH, COLOR_HILL, t);
      } else {
        // Hill tops: slightly brighter
        const t = (height - MAX_HEIGHT * 0.85) / (MAX_HEIGHT * 0.15);
        color.lerpColors(COLOR_HILL, COLOR_HILL_TOP, t);
      }

      // Subtle variation driven by detail noise instead of pure random
      const variation = 0.96 + (detail * 0.5 + 0.5) * 0.08;
      colors[i * 3] = color.r * variation;
      colors[i * 3 + 1] = color.g * variation;
      colors[i * 3 + 2] = color.b * variation;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
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
    const waterGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshLambertMaterial({
      color: 0x2a6496,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = WATER_LEVEL;
    return water;
  }
}
