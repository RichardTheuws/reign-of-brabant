/**
 * FogOfWarRenderer.ts
 *
 * Renders fog of war as a semi-transparent plane above the terrain.
 * Uses a 128x128 canvas texture driven by VisionSystem data.
 *
 * 3 visibility states:
 *   - Unexplored: black (fully opaque)
 *   - Explored:   dark grey (60% opacity)
 *   - Visible:    transparent
 *
 * Updates at 5 FPS (matching VisionSystem) to avoid GPU overhead.
 */

import * as THREE from 'three';
import { visionData } from '../systems/VisionSystem';
import { MAP_SIZE, FOW_UPDATE_RATE } from '../types/index';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FOW_RESOLUTION = 128;
/** Height offset above terrain to avoid z-fighting. */
const FOW_Y_OFFSET = 0.3;
/** Alpha for unexplored cells. */
const ALPHA_UNEXPLORED = 255;
/** Alpha for explored-but-not-visible cells. */
const ALPHA_EXPLORED = 153; // ~60%
/** Alpha for currently visible cells. */
const ALPHA_VISIBLE = 0;

// ---------------------------------------------------------------------------
// FogOfWarRenderer
// ---------------------------------------------------------------------------

export class FogOfWarRenderer {
  readonly mesh: THREE.Mesh;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private texture: THREE.CanvasTexture;
  private material: THREE.MeshBasicMaterial;
  private accumulator = 0;
  private updateInterval: number;

  constructor() {
    this.updateInterval = 1 / FOW_UPDATE_RATE;

    // Create offscreen canvas for the fog texture
    this.canvas = document.createElement('canvas');
    this.canvas.width = FOW_RESOLUTION;
    this.canvas.height = FOW_RESOLUTION;
    this.ctx = this.canvas.getContext('2d')!;
    this.imageData = this.ctx.createImageData(FOW_RESOLUTION, FOW_RESOLUTION);

    // Fill with black initially (unexplored)
    const pixels = this.imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 0;     // R
      pixels[i + 1] = 0; // G
      pixels[i + 2] = 0; // B
      pixels[i + 3] = ALPHA_UNEXPLORED; // A
    }
    this.ctx.putImageData(this.imageData, 0, 0);

    // Create texture from canvas
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;

    // Create material: transparent black overlay
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    });

    // Create plane geometry matching the terrain size
    const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
    geo.rotateX(-Math.PI / 2);

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.position.y = FOW_Y_OFFSET;
    this.mesh.renderOrder = 10; // Render after terrain
    this.mesh.frustumCulled = false;
  }

  /**
   * Update the fog texture. Only redraws at FOW_UPDATE_RATE (5 FPS).
   */
  update(dt: number): void {
    this.accumulator += dt;
    if (this.accumulator < this.updateInterval) return;
    this.accumulator -= this.updateInterval;

    const vis = visionData.visibleBuffer;
    const exp = visionData.exploredBuffer;
    const pixels = this.imageData.data;

    for (let z = 0; z < FOW_RESOLUTION; z++) {
      for (let x = 0; x < FOW_RESOLUTION; x++) {
        const bufIdx = z * FOW_RESOLUTION + x;
        // Canvas pixel index: flip Z since canvas Y=0 is top, world Z grows downward
        const pixIdx = (z * FOW_RESOLUTION + x) * 4;

        let alpha: number;
        if (vis[bufIdx] > 0) {
          alpha = ALPHA_VISIBLE;
        } else if (exp[bufIdx] > 0) {
          alpha = ALPHA_EXPLORED;
        } else {
          alpha = ALPHA_UNEXPLORED;
        }

        pixels[pixIdx] = 0;     // R
        pixels[pixIdx + 1] = 0; // G
        pixels[pixIdx + 2] = 0; // B
        pixels[pixIdx + 3] = alpha;
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    this.texture.needsUpdate = true;
  }

  /**
   * Check if a world position is currently visible (for minimap).
   */
  isVisible(wx: number, wz: number): boolean {
    const half = MAP_SIZE / 2;
    const bx = Math.floor(((wx + half) / MAP_SIZE) * FOW_RESOLUTION);
    const bz = Math.floor(((wz + half) / MAP_SIZE) * FOW_RESOLUTION);
    if (bx < 0 || bx >= FOW_RESOLUTION || bz < 0 || bz >= FOW_RESOLUTION) return false;
    return visionData.visibleBuffer[bz * FOW_RESOLUTION + bx] > 0;
  }

  /**
   * Check if a world position has been explored.
   */
  isExplored(wx: number, wz: number): boolean {
    const half = MAP_SIZE / 2;
    const bx = Math.floor(((wx + half) / MAP_SIZE) * FOW_RESOLUTION);
    const bz = Math.floor(((wz + half) / MAP_SIZE) * FOW_RESOLUTION);
    if (bx < 0 || bx >= FOW_RESOLUTION || bz < 0 || bz >= FOW_RESOLUTION) return false;
    return visionData.exploredBuffer[bz * FOW_RESOLUTION + bx] > 0;
  }

  /**
   * Dispose all GPU resources.
   */
  dispose(): void {
    this.texture.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}
