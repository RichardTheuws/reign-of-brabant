/**
 * DamagePopups.ts
 *
 * Pool of floating "-15" damage numbers projected from world to screen.
 * Each popup floats upward and fades over POPUP_LIFETIME seconds.
 *
 * Bounded pool prevents DOM explosion at 200+ units in combat (recycles
 * oldest active popup when pool is full).
 */

import * as THREE from 'three';
import type { RTSCamera } from '../camera/RTSCamera';

const POOL_SIZE = 50;
const POPUP_LIFETIME = 1.0;          // seconds
const POPUP_RISE = 60;                // pixels travelled upward
const SPAWN_JITTER = 24;              // horizontal jitter so stacks fan out

interface PopupSlot {
  el: HTMLDivElement;
  active: boolean;
  age: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  jitterX: number;
  // Snapshot screen position written each frame (avoids re-allocation).
  screenX: number;
  screenY: number;
}

export class DamagePopups {
  private container: HTMLDivElement;
  private slots: PopupSlot[] = [];
  private cursor = 0;
  private readonly _v3 = new THREE.Vector3();

  constructor(parent: HTMLElement = document.body) {
    this.container = document.createElement('div');
    this.container.className = 'damage-popup-layer';
    parent.appendChild(this.container);

    for (let i = 0; i < POOL_SIZE; i++) {
      const el = document.createElement('div');
      el.className = 'damage-popup';
      el.style.opacity = '0';
      this.container.appendChild(el);
      this.slots.push({
        el,
        active: false,
        age: 0,
        worldX: 0, worldY: 0, worldZ: 0,
        jitterX: 0,
        screenX: 0, screenY: 0,
      });
    }
  }

  /**
   * Spawn a damage number above the entity. Picks the next free slot,
   * or recycles the oldest active slot when the pool is full.
   */
  spawn(amount: number, worldX: number, worldY: number, worldZ: number, kind: 'damage' | 'crit' | 'heal' = 'damage'): void {
    if (amount <= 0) return;

    const slot = this.acquireSlot();
    slot.active = true;
    slot.age = 0;
    slot.worldX = worldX;
    slot.worldY = worldY;
    slot.worldZ = worldZ;
    slot.jitterX = (Math.random() - 0.5) * SPAWN_JITTER;

    const el = slot.el;
    el.dataset.kind = kind;
    if (kind === 'heal') {
      el.textContent = `+${Math.round(amount)}`;
    } else if (kind === 'crit') {
      el.textContent = `-${Math.round(amount)}!`;
    } else {
      el.textContent = `-${Math.round(amount)}`;
    }
    el.style.opacity = '1';
  }

  private acquireSlot(): PopupSlot {
    // Try next-cursor pass for a free slot.
    for (let i = 0; i < POOL_SIZE; i++) {
      const idx = (this.cursor + i) % POOL_SIZE;
      const s = this.slots[idx];
      if (!s.active) {
        this.cursor = (idx + 1) % POOL_SIZE;
        return s;
      }
    }

    // All active — recycle the oldest.
    let oldestIdx = 0;
    let oldestAge = -1;
    for (let i = 0; i < POOL_SIZE; i++) {
      if (this.slots[i].age > oldestAge) {
        oldestAge = this.slots[i].age;
        oldestIdx = i;
      }
    }
    this.cursor = (oldestIdx + 1) % POOL_SIZE;
    return this.slots[oldestIdx];
  }

  /**
   * Tick all active popups: age them, project to screen, write transform.
   * Hides expired popups; their slot becomes free.
   */
  update(dt: number, camera: RTSCamera): void {
    for (const slot of this.slots) {
      if (!slot.active) continue;

      slot.age += dt;
      if (slot.age >= POPUP_LIFETIME) {
        slot.active = false;
        slot.el.style.opacity = '0';
        continue;
      }

      const t = slot.age / POPUP_LIFETIME;
      this._v3.set(slot.worldX, slot.worldY, slot.worldZ);
      const screen = camera.worldToScreen(this._v3);
      slot.screenX = screen.x + slot.jitterX;
      slot.screenY = screen.y - t * POPUP_RISE;

      // Fade-out curve (ease-out): 1 → 0.85 → 0
      const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      slot.el.style.transform = `translate(${slot.screenX - 24}px, ${slot.screenY - 12}px)`;
      slot.el.style.opacity = opacity.toFixed(2);
    }
  }

  destroy(): void {
    this.container.remove();
    this.slots.length = 0;
  }
}
