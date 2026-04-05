import * as THREE from 'three';
import { clamp, lerp } from '@utils/math';

const PAN_SPEED = 30;
const ZOOM_SPEED = 6;
const MIN_ZOOM = 8;
const MAX_ZOOM = 80;
const EDGE_SCROLL_THRESHOLD = 20;
const EDGE_SCROLL_SPEED = 25;
const SMOOTHING = 0.1;
const CAMERA_ANGLE = (55 * Math.PI) / 180;

export class RTSCamera {
  readonly camera: THREE.PerspectiveCamera;

  private targetX = 0;
  private targetZ = 0;
  private currentX = 0;
  private currentZ = 0;
  private targetZoom = 25;
  private currentZoom = 25;
  private mapSize: number;
  private halfMap: number;

  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(mapSize: number) {
    this.mapSize = mapSize;
    this.halfMap = mapSize / 2;

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 500);
    this.updateCameraPosition();
  }

  update(
    dt: number,
    keys: Set<string>,
    mouseX: number,
    mouseY: number,
    canvasWidth: number,
    canvasHeight: number,
    scrollDelta: number,
  ): void {
    let dx = 0;
    let dz = 0;

    if (keys.has('KeyW') || keys.has('ArrowUp')) dz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) dz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

    if (mouseX >= 0 && mouseY >= 0) {
      if (mouseX < EDGE_SCROLL_THRESHOLD) dx -= EDGE_SCROLL_SPEED / PAN_SPEED;
      if (mouseX > canvasWidth - EDGE_SCROLL_THRESHOLD) dx += EDGE_SCROLL_SPEED / PAN_SPEED;
      if (mouseY < EDGE_SCROLL_THRESHOLD) dz -= EDGE_SCROLL_SPEED / PAN_SPEED;
      if (mouseY > canvasHeight - EDGE_SCROLL_THRESHOLD) dz += EDGE_SCROLL_SPEED / PAN_SPEED;
    }

    const speed = PAN_SPEED * (this.currentZoom / 40);
    this.targetX += dx * speed * dt;
    this.targetZ += dz * speed * dt;

    this.targetX = clamp(this.targetX, -this.halfMap, this.halfMap);
    this.targetZ = clamp(this.targetZ, -this.halfMap, this.halfMap);

    if (scrollDelta !== 0) {
      this.targetZoom += scrollDelta * ZOOM_SPEED;
      this.targetZoom = clamp(this.targetZoom, MIN_ZOOM, MAX_ZOOM);
    }

    const smoothFactor = 1 - Math.pow(1 - SMOOTHING, dt * 60);
    this.currentX = lerp(this.currentX, this.targetX, smoothFactor);
    this.currentZ = lerp(this.currentZ, this.targetZ, smoothFactor);
    this.currentZoom = lerp(this.currentZoom, this.targetZoom, smoothFactor);

    this.updateCameraPosition();
  }

  worldToScreen(position: THREE.Vector3): THREE.Vector2 {
    const projected = position.clone().project(this.camera);
    return new THREE.Vector2(
      (projected.x * 0.5 + 0.5) * window.innerWidth,
      (-projected.y * 0.5 + 0.5) * window.innerHeight,
    );
  }

  screenToWorld(screenX: number, screenY: number): THREE.Vector3 | null {
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const target = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, target);
    return hit ? target : null;
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setPosition(x: number, z: number): void {
    this.targetX = x;
    this.targetZ = z;
    this.currentX = x;
    this.currentZ = z;
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const offsetY = this.currentZoom * Math.sin(CAMERA_ANGLE);
    const offsetZ = this.currentZoom * Math.cos(CAMERA_ANGLE);

    this.camera.position.set(this.currentX, offsetY, this.currentZ + offsetZ);
    this.camera.lookAt(this.currentX, 0, this.currentZ);
  }
}
