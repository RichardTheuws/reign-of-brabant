/**
 * TowerRangeRenderer.ts
 *
 * Renders a translucent ring on the ground around the currently selected
 * DefenseTower so the player can see its attack range. One ring is shared
 * across all selections — only one tower is highlighted at a time.
 */

import * as THREE from 'three';
import { TOWER_RANGE } from '../systems/TowerSystem';

const RING_INNER = TOWER_RANGE - 0.4;
const RING_OUTER = TOWER_RANGE + 0.1;
const RING_SEGMENTS = 64;
const RING_COLOR = 0xff6a1a;
const RING_OPACITY = 0.28;
const Y_OFFSET = 0.08; // raised slightly to avoid z-fight with terrain

export class TowerRangeRenderer {
  private mesh: THREE.Mesh;
  private scene: THREE.Scene;
  private active = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const geometry = new THREE.RingGeometry(RING_INNER, RING_OUTER, RING_SEGMENTS);
    geometry.rotateX(-Math.PI / 2); // lay flat on the XZ plane
    const material = new THREE.MeshBasicMaterial({
      color: RING_COLOR,
      transparent: true,
      opacity: RING_OPACITY,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.visible = false;
    this.mesh.renderOrder = 2;
    scene.add(this.mesh);
  }

  /** Position the ring at world (x, z) with terrain height + Y_OFFSET. */
  show(x: number, z: number, terrainY: number): void {
    this.mesh.position.set(x, terrainY + Y_OFFSET, z);
    this.mesh.visible = true;
    this.active = true;
  }

  hide(): void {
    if (!this.active) return;
    this.mesh.visible = false;
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
