// @vitest-environment jsdom
/**
 * UnitRenderer-preload-dedupe.test.ts
 *
 * Locks the preload download contract:
 *  - a key with an animated (v03/hero) model never downloads its static v02 GLB
 *  - the static v02 → v01 chain is only used when the animated load fails
 *  - every URL is requested at most once per preload (heroes are in both lists)
 *  - onProgress fires exactly `total` times and ends at (total, total)
 *  - everything failing still yields a fallback box (addUnit returns a proxy)
 *
 * GLTFLoader is mocked: no network, no GLB parsing.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

const requested: string[] = [];
let failUrls = new Set<string>();
let failAll = false;

vi.mock('three/addons/loaders/GLTFLoader.js', () => {
  class GLTFLoader {
    setMeshoptDecoder(): this { return this; }
    loadAsync(url: string): Promise<unknown> {
      requested.push(url);
      if (failAll || failUrls.has(url)) return Promise.reject(new Error(`404 ${url}`));
      const scene = new THREE.Group();
      scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
      return Promise.resolve({ scene, animations: [new THREE.AnimationClip('Idle', 1, [])] });
    }
  }
  return { GLTFLoader };
});

import { UnitRenderer } from '../src/rendering/UnitRenderer';

function count(url: string): number {
  return requested.filter((u) => u === url).length;
}

describe('UnitRenderer.preload download dedupe', () => {
  let renderer: UnitRenderer;

  beforeEach(() => {
    requested.length = 0;
    failUrls = new Set();
    failAll = false;
    renderer = new UnitRenderer(new THREE.Group());
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('does not request any v02 GLB when every key has an animated model', async () => {
    await renderer.preload();
    expect(requested.filter((u) => u.includes('/v02/'))).toEqual([]);
    expect(requested.filter((u) => u.includes('/v01/'))).toEqual([]);
    expect(count('/assets/models/v03/brabanders/worker.glb')).toBe(1);
  });

  it('requests each URL at most once (heroes appear in both path lists)', async () => {
    await renderer.preload();
    expect(new Set(requested).size).toBe(requested.length);
    expect(count('/assets/models/heroes/brabant-prins.glb')).toBe(1);
  });

  it('falls back to v02 when the animated load rejects', async () => {
    failUrls.add('/assets/models/v03/brabanders/worker.glb');
    await renderer.preload(new Set([0]));
    expect(count('/assets/models/v03/brabanders/worker.glb')).toBe(1);
    expect(count('/assets/models/v02/brabanders/worker.glb')).toBe(1);
    expect(requested.filter((u) => u.includes('/v02/'))).toEqual(['/assets/models/v02/brabanders/worker.glb']);
    // Static bucket path renders the unit
    expect(renderer.addUnit(1, 'worker', 0)).not.toBeNull();
  });

  it('falls back to v01 when animated and v02 both reject', async () => {
    failUrls.add('/assets/models/v03/brabanders/worker.glb');
    failUrls.add('/assets/models/v02/brabanders/worker.glb');
    await renderer.preload(new Set([0]));
    expect(count('/assets/models/v01/brabanders/worker.glb')).toBe(1);
    expect(renderer.addUnit(1, 'worker', 0)).not.toBeNull();
  });

  it('does not re-request a failed hero URL as its own static path', async () => {
    failUrls.add('/assets/models/heroes/brabant-prins.glb');
    await renderer.preload(new Set([0]));
    expect(count('/assets/models/heroes/brabant-prins.glb')).toBe(1);
    expect(count('/assets/models/v02/brabanders/infantry.glb')).toBe(1);
    expect(renderer.addUnit(1, 'hero0', 0)).not.toBeNull();
  });

  it('onProgress reaches (total, total) with exactly total callbacks', async () => {
    const calls: Array<[number, number]> = [];
    await renderer.preload(new Set([0, 1]), (l, t) => calls.push([l, t]));
    const total = calls[0][1];
    expect(total).toBe(16); // 8 unit keys × 2 factions
    expect(calls).toHaveLength(total);
    expect(calls[calls.length - 1]).toEqual([total, total]);
    expect(calls.every(([, t]) => t === total)).toBe(true);
  });

  it('onProgress still reaches total and fallback boxes render when everything fails', async () => {
    failAll = true;
    const calls: Array<[number, number]> = [];
    await renderer.preload(new Set([2]), (l, t) => calls.push([l, t]));
    expect(calls[calls.length - 1]).toEqual([8, 8]);
    expect(calls).toHaveLength(8);
    expect(renderer.addUnit(7, 'siege', 2)).not.toBeNull();
    expect(new Set(requested).size).toBe(requested.length);
  });
});
