// @vitest-environment jsdom
/**
 * DamagePopups.test.ts -- Locks v0.46.0 floating damage-number invariants:
 *
 *  - Pool size is bounded (50) so DOM doesn't explode under heavy combat.
 *  - spawn() is a no-op for non-positive amounts (avoids `-0` / `+0` popups).
 *  - update() ages every active popup, hides expired ones, projects to screen.
 *  - kind drives the data-attribute used by CSS to colour crit / heal differently.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { DamagePopups } from '../src/ui/DamagePopups';

class FakeCamera {
  worldToScreen(_pos: THREE.Vector3): THREE.Vector2 {
    return new THREE.Vector2(640, 360);
  }
}

function activeCount(parent: HTMLElement): number {
  const popups = parent.querySelectorAll<HTMLDivElement>('.damage-popup');
  let n = 0;
  popups.forEach((el) => {
    if (parseFloat(el.style.opacity || '0') > 0) n++;
  });
  return n;
}

describe('DamagePopups', () => {
  let parent: HTMLElement;
  let popups: DamagePopups;
  const cam = new FakeCamera() as unknown as import('../src/camera/RTSCamera').RTSCamera;

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
    popups = new DamagePopups(parent);
  });

  it('creates a pool of 50 elements up front', () => {
    expect(parent.querySelectorAll('.damage-popup').length).toBe(50);
  });

  it('ignores non-positive damage amounts', () => {
    popups.spawn(0, 0, 0, 0);
    popups.spawn(-5, 0, 0, 0);
    expect(activeCount(parent)).toBe(0);
  });

  it('shows a damage popup with rounded text', () => {
    popups.spawn(15.4, 1, 2, 3);
    popups.update(0.016, cam);
    const el = parent.querySelector<HTMLDivElement>('.damage-popup[data-kind="damage"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('-15');
  });

  it('uses crit/heal data-kind for non-damage spawns', () => {
    popups.spawn(40, 0, 0, 0, 'crit');
    popups.spawn(8, 0, 0, 0, 'heal');
    popups.update(0.016, cam);
    expect(parent.querySelector('.damage-popup[data-kind="crit"]')!.textContent).toBe('-40!');
    expect(parent.querySelector('.damage-popup[data-kind="heal"]')!.textContent).toBe('+8');
  });

  it('hides popups after their lifetime', () => {
    popups.spawn(10, 0, 0, 0);
    popups.update(0.016, cam);
    expect(activeCount(parent)).toBe(1);
    // Fast-forward past the 1.0s lifetime.
    popups.update(1.2, cam);
    expect(activeCount(parent)).toBe(0);
  });

  it('caps active popups at the pool size', () => {
    for (let i = 0; i < 75; i++) popups.spawn(5, i, 0, 0);
    popups.update(0.016, cam);
    expect(activeCount(parent)).toBeLessThanOrEqual(50);
    // All 50 slots used.
    expect(activeCount(parent)).toBe(50);
  });
});
