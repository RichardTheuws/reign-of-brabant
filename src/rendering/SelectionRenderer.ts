/**
 * SelectionRenderer.ts
 * Renders selection circles under selected units, box-select rectangle
 * as a 2D HTML overlay, and billboard health bars above units.
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SELECTION_CIRCLE_PATH = '/assets/models/poc/gameplay/selection_circle.glb';
const MAX_SELECTION_CIRCLES = 50;
const MAX_HEALTH_BARS = 64;

const HEALTHBAR_WIDTH = 64;
const HEALTHBAR_HEIGHT = 24;
const HEALTHBAR_SPRITE_SCALE_X = 2.0;
const HEALTHBAR_SPRITE_SCALE_Y = 0.5;
const HEALTHBAR_Y_OFFSET = 2.5;

// HP colour thresholds (matching POC-UI.md: >50% green, >25% yellow, <25% red)
const HP_COLOR_HIGH = '#4CAF50';
const HP_COLOR_MID = '#FFC107';
const HP_COLOR_LOW = '#F44336';
const HP_BG_COLOR = 'rgba(0,0,0,0.6)';

const SELECTION_PULSE_SPEED = 4;
const SELECTION_PULSE_AMOUNT = 0.05;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectionData {
  eid: number;
  x: number;
  y: number;
  z: number;
  selected: boolean;
  isOwnFaction: boolean;
  hp: number;
  maxHp: number;
  name?: string;
}

interface HealthBarEntry {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  active: boolean;
}

// ---------------------------------------------------------------------------
// SelectionRenderer
// ---------------------------------------------------------------------------

export class SelectionRenderer {
  private loader = new GLTFLoader();
  private selectionGroup: THREE.Group;
  private healthBarGroup: THREE.Group;

  // Selection circles
  private circleSource: THREE.Object3D | null = null;
  private circlePool: THREE.Object3D[] = [];
  private activeCircles = new Map<number, THREE.Object3D>(); // eid -> circle

  // Health bars
  private healthBarPool: HealthBarEntry[] = [];
  private activeHealthBars = new Map<number, HealthBarEntry>(); // eid -> entry

  // Box select overlay (HTML)
  private boxSelectDiv: HTMLDivElement | null = null;

  // Time accumulator for pulsing
  private elapsedTime = 0;

  constructor(selectionGroup: THREE.Group, healthBarGroup: THREE.Group) {
    this.selectionGroup = selectionGroup;
    this.healthBarGroup = healthBarGroup;
    this.createBoxSelectDiv();
  }

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  async preload(): Promise<void> {
    const gltf: GLTF = await this.loader.loadAsync(SELECTION_CIRCLE_PATH);
    const root = gltf.scene;
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          (mat as THREE.Material).transparent = true;
          (mat as THREE.Material).depthWrite = false;
        }
      }
    });
    // Scale up selection circles to match new unit scale
    root.scale.set(1.5, 1.5, 1.5);
    this.circleSource = root;

    // Pre-allocate circle pool
    for (let i = 0; i < MAX_SELECTION_CIRCLES; i++) {
      const clone = root.clone(true);
      clone.visible = false;
      this.selectionGroup.add(clone);
      this.circlePool.push(clone);
    }

    // Pre-allocate health bar pool
    for (let i = 0; i < MAX_HEALTH_BARS; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = HEALTHBAR_WIDTH;
      canvas.height = HEALTHBAR_HEIGHT;
      const ctx = canvas.getContext('2d')!;
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(HEALTHBAR_SPRITE_SCALE_X, HEALTHBAR_SPRITE_SCALE_Y, 1);
      sprite.visible = false;
      this.healthBarGroup.add(sprite);
      this.healthBarPool.push({ sprite, canvas, ctx, texture, active: false });
    }
  }

  // -----------------------------------------------------------------------
  // Box select rectangle (HTML overlay)
  // -----------------------------------------------------------------------

  private createBoxSelectDiv(): void {
    this.boxSelectDiv = document.createElement('div');
    Object.assign(this.boxSelectDiv.style, {
      position: 'fixed',
      border: '1px dashed rgba(0, 255, 0, 0.8)',
      backgroundColor: 'rgba(0, 255, 0, 0.08)',
      pointerEvents: 'none',
      zIndex: '5',
      display: 'none',
    });
    document.body.appendChild(this.boxSelectDiv);
  }

  /**
   * Show or update the box-select rectangle.
   * Coordinates are in screen pixels.
   */
  showBoxSelect(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.boxSelectDiv) return;
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    Object.assign(this.boxSelectDiv.style, {
      display: 'block',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
  }

  /** Hide the box-select rectangle. */
  hideBoxSelect(): void {
    if (this.boxSelectDiv) {
      this.boxSelectDiv.style.display = 'none';
    }
  }

  // -----------------------------------------------------------------------
  // Per-frame update
  // -----------------------------------------------------------------------

  /**
   * Update selection circles and health bars for all relevant entities.
   * @param dt Delta time in seconds.
   * @param entities Array of entities to consider.
   */
  update(dt: number, entities: ReadonlyArray<SelectionData>): void {
    this.elapsedTime += dt;

    // Track which eids are still active this frame
    const activeEids = new Set<number>();

    for (const data of entities) {
      const needsCircle = data.selected;
      const needsHealthBar =
        data.selected || (data.hp < data.maxHp && data.hp > 0);

      // --- Selection circles ---
      if (needsCircle) {
        activeEids.add(data.eid);
        let circle: THREE.Object3D | null | undefined = this.activeCircles.get(data.eid);
        if (!circle) {
          circle = this.acquireCircle();
          if (circle) {
            this.activeCircles.set(data.eid, circle);
          }
        }
        if (circle) {
          circle.visible = true;
          circle.position.set(data.x, data.y + 0.05, data.z);
          // Pulse scale (1.5x base to match scaled units)
          const pulse = 1.5 + Math.sin(this.elapsedTime * SELECTION_PULSE_SPEED) * SELECTION_PULSE_AMOUNT * 1.5;
          circle.scale.setScalar(pulse);
          // Tint based on faction ownership
          this.tintCircle(circle, data.isOwnFaction);
        }
      }

      // --- Health bars ---
      if (needsHealthBar) {
        let entry: HealthBarEntry | null | undefined = this.activeHealthBars.get(data.eid);
        if (!entry) {
          entry = this.acquireHealthBar();
          if (entry) {
            this.activeHealthBars.set(data.eid, entry);
          }
        }
        if (entry) {
          entry.sprite.visible = true;
          entry.sprite.position.set(data.x, data.y + HEALTHBAR_Y_OFFSET, data.z);
          this.drawHealthBar(entry, data.hp, data.maxHp, data.name);
        }
      }
    }

    // Release circles for entities no longer selected
    for (const [eid, circle] of this.activeCircles) {
      if (!activeEids.has(eid)) {
        this.releaseCircle(circle);
        this.activeCircles.delete(eid);
      }
    }

    // Release health bars for entities that no longer need them
    const healthBarEids = new Set<number>();
    for (const data of entities) {
      if (data.selected || (data.hp < data.maxHp && data.hp > 0)) {
        healthBarEids.add(data.eid);
      }
    }
    for (const [eid, entry] of this.activeHealthBars) {
      if (!healthBarEids.has(eid)) {
        this.releaseHealthBar(entry);
        this.activeHealthBars.delete(eid);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Circle pool
  // -----------------------------------------------------------------------

  private acquireCircle(): THREE.Object3D | null {
    for (const c of this.circlePool) {
      if (!c.visible) return c;
    }
    return null; // Pool exhausted
  }

  private releaseCircle(circle: THREE.Object3D): void {
    circle.visible = false;
  }

  private tintCircle(circle: THREE.Object3D, isOwn: boolean): void {
    const color = isOwn ? 0x00ff00 : 0xff0000;
    circle.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          if ('color' in mat) {
            (mat as THREE.MeshBasicMaterial).color.setHex(color);
          }
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // Health bar pool & drawing
  // -----------------------------------------------------------------------

  private acquireHealthBar(): HealthBarEntry | null {
    for (const entry of this.healthBarPool) {
      if (!entry.active) {
        entry.active = true;
        return entry;
      }
    }
    return null;
  }

  private releaseHealthBar(entry: HealthBarEntry): void {
    entry.sprite.visible = false;
    entry.active = false;
  }

  private drawHealthBar(entry: HealthBarEntry, hp: number, maxHp: number, name?: string): void {
    const { ctx, canvas, texture } = entry;
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Name text at top
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (name) ctx.fillText(name, canvas.width / 2, 0, canvas.width);

    // HP bar below name
    const barY = 14;
    const barH = canvas.height - barY;
    let color: string;
    if (ratio > 0.5) {
      color = HP_COLOR_HIGH;
    } else if (ratio > 0.25) {
      color = HP_COLOR_MID;
    } else {
      color = HP_COLOR_LOW;
    }
    ctx.fillStyle = HP_BG_COLOR;
    ctx.fillRect(0, barY, canvas.width, barH);
    ctx.fillStyle = color;
    ctx.fillRect(0, barY, canvas.width * ratio, barH);

    texture.needsUpdate = true;
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  destroy(): void {
    // Circles
    for (const c of this.circlePool) {
      this.selectionGroup.remove(c);
      this.disposeObject(c);
    }
    this.circlePool.length = 0;
    this.activeCircles.clear();

    // Health bars
    for (const entry of this.healthBarPool) {
      this.healthBarGroup.remove(entry.sprite);
      entry.texture.dispose();
      entry.sprite.material.dispose();
    }
    this.healthBarPool.length = 0;
    this.activeHealthBars.clear();

    // Source model
    if (this.circleSource) {
      this.disposeObject(this.circleSource);
      this.circleSource = null;
    }

    // Box select HTML element
    if (this.boxSelectDiv) {
      this.boxSelectDiv.remove();
      this.boxSelectDiv = null;
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
