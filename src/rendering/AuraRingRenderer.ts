/**
 * AuraRingRenderer.ts
 *
 * Translucent green ring on the ground showing the heal-aura radius around
 * the currently selected source-building. One ring shared across selections
 * (only one heal-source highlighted at a time). The ring is built once with
 * unit-radius geometry and scaled at `show()` so different aura sizes
 * (Worstenbroodjeskraam 8u, Vlaaiwinkel 10u, etc.) reuse the same mesh.
 */

import * as THREE from 'three';

const RING_SEGMENTS = 64;
const RING_COLOR = 0x44dd55;     // green for heal
const RING_OPACITY = 0.22;
const Y_OFFSET = 0.08;
const BORDER_WIDTH = 0.4;        // ring thickness in world units

export class AuraRingRenderer {
  private mesh: THREE.Mesh;
  private scene: THREE.Scene;
  private active = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Build at unit radius so we can scale per call.
    const geometry = new THREE.RingGeometry(1 - BORDER_WIDTH, 1, RING_SEGMENTS);
    geometry.rotateX(-Math.PI / 2);
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

  show(x: number, z: number, terrainY: number, radius: number): void {
    this.mesh.position.set(x, terrainY + Y_OFFSET, z);
    this.mesh.scale.set(radius, 1, radius);
    this.mesh.visible = true;
    this.active = true;
  }

  hide(): void {
    if (!this.active) return;
    this.mesh.visible = false;
    this.active = false;
  }

  isActive(): boolean { return this.active; }

  destroy(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
