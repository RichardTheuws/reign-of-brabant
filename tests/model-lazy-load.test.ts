// @vitest-environment jsdom
/**
 * model-lazy-load.test.ts
 *
 * Locks the on-demand model contract (v0.65):
 *  - a unit/building added before its model arrived gets a proxy/holder right
 *    away but draws nothing (no placeholder box, no blob shadow) until the
 *    model is there; then it appears without any caller action
 *  - removing it while it waits means it never appears
 *  - every key is set up once per renderer (second match: no re-download)
 *  - prefetch respects its concurrency limit
 *  - a building ghost for an unloaded type starts the download
 *
 * GLTFLoader is mocked with manually resolved promises.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

interface Deferred { url: string; resolve: () => void; reject: () => void }
const pending: Deferred[] = [];
const requested: string[] = [];

function fakeGltf(url: string): unknown {
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
  return { scene, animations: url.includes('/v03/') || url.includes('/heroes/') ? [new THREE.AnimationClip('Idle', 1, [])] : [] };
}

vi.mock('three/addons/loaders/GLTFLoader.js', () => {
  class GLTFLoader {
    setMeshoptDecoder(): this { return this; }
    loadAsync(url: string): Promise<unknown> {
      requested.push(url);
      return new Promise((res, rej) => {
        pending.push({ url, resolve: () => res(fakeGltf(url)), reject: () => rej(new Error(`404 ${url}`)) });
      });
    }
  }
  return { GLTFLoader };
});

import { UnitRenderer } from '../src/rendering/UnitRenderer';
import { BuildingRenderer } from '../src/rendering/BuildingRenderer';

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
async function resolveUrl(url: string): Promise<void> {
  const d = pending.find((p) => p.url === url);
  expect(d, `no request for ${url}`).toBeTruthy();
  pending.splice(pending.indexOf(d!), 1);
  d!.resolve();
  await flush();
}
const drawn = (group: THREE.Group): number => group.children.filter((c) => c.name.startsWith('anim_unit_') || c.name.startsWith('instanced_')).length;

beforeEach(() => {
  pending.length = 0;
  requested.length = 0;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('UnitRenderer — unit spawned before its model', () => {
  it('returns a proxy, draws nothing, and appears once the model arrives', async () => {
    const group = new THREE.Group();
    const r = new UnitRenderer(group);
    const before = group.children.length;
    const proxy = r.addUnit(7, 'heavy', 0);
    expect(proxy).not.toBeNull();
    expect(proxy!.userData.eid).toBe(7);
    expect(r.pendingCount()).toBe(1);
    expect(group.children.length).toBe(before); // no proxy, no shadow, no box
    expect(requested).toEqual(['/assets/models/v03/brabanders/heavy.glb']);

    await resolveUrl('/assets/models/v03/brabanders/heavy.glb');
    expect(r.pendingCount()).toBe(0);
    expect(drawn(group)).toBe(1);
    expect(group.children).toContain(proxy); // same proxy the caller stored
    expect(r.getObject(7)).toBe(proxy);
    const stats = r.getModelWaitStats();
    expect(stats.waited).toBe(1);
    expect(stats.pending).toBe(0);
  });

  it('several units of the same type share one download', async () => {
    const group = new THREE.Group();
    const r = new UnitRenderer(group);
    r.addUnit(1, 'ranged', 1);
    r.addUnit(2, 'ranged', 1);
    r.addUnit(3, 'ranged', 1);
    expect(requested).toEqual(['/assets/models/v03/randstad/ranged.glb']);
    await resolveUrl('/assets/models/v03/randstad/ranged.glb');
    expect(drawn(group)).toBe(3);
  });

  it('a unit removed while waiting never appears', async () => {
    const group = new THREE.Group();
    const r = new UnitRenderer(group);
    r.addUnit(5, 'support', 2);
    r.removeUnit(5);
    expect(r.pendingCount()).toBe(0);
    await resolveUrl('/assets/models/v03/limburgers/support.glb');
    expect(drawn(group)).toBe(0);
    expect(r.getObject(5)).toBeUndefined();
  });

  it('sets each key up once: a second preload (next match) downloads nothing', async () => {
    const r = new UnitRenderer(new THREE.Group());
    const p = r.preloadKeys(['worker_0', 'worker_1']);
    await resolveUrl('/assets/models/v03/brabanders/worker.glb');
    await resolveUrl('/assets/models/v03/randstad/worker.glb');
    await p;
    requested.length = 0;
    await r.preloadKeys(['worker_0', 'worker_1']);
    expect(requested).toEqual([]);
    expect(r.isModelReady('worker_0')).toBe(true);
  });

  it('prefetch keeps at most `concurrency` downloads in flight', async () => {
    const r = new UnitRenderer(new THREE.Group());
    const done = r.prefetch(['infantry_0', 'ranged_0', 'infantry_1'], 1);
    await flush();
    expect(requested).toEqual(['/assets/models/v03/brabanders/infantry.glb']);
    await resolveUrl('/assets/models/v03/brabanders/infantry.glb');
    expect(requested).toHaveLength(2);
    await resolveUrl('/assets/models/v03/brabanders/ranged.glb');
    await resolveUrl('/assets/models/v03/randstad/infantry.glb');
    await done;
    expect(requested).toHaveLength(3);
  });

  it('ignores unknown keys', async () => {
    const r = new UnitRenderer(new THREE.Group());
    await r.ensureLoaded('dragon_0');
    await r.prefetch(['dragon_0']);
    expect(requested).toEqual([]);
  });
});

describe('BuildingRenderer — building placed before its model', () => {
  it('returns an empty holder that becomes the model root when it arrives', async () => {
    const group = new THREE.Group();
    const r = new BuildingRenderer(group);
    const holder = r.addBuilding(11, 'tower', 1, 10, 2, -4, 0);
    expect(holder).not.toBeNull();
    expect(holder!.name).toBe('building_11');
    expect(holder!.userData.eid).toBe(11);
    expect(holder!.children).toHaveLength(0); // nothing drawn while waiting
    expect(r.pendingCount()).toBe(1);
    expect(requested).toEqual(['/assets/models/v02/randstad/tower.glb']);

    await resolveUrl('/assets/models/v02/randstad/tower.glb');
    expect(r.pendingCount()).toBe(0);
    expect(r.getObject(11)).toBe(holder);
    expect(holder!.children.length).toBeGreaterThan(0);
    expect(holder!.scale.x).toBeCloseTo(2.8);
    expect(holder!.userData.buildingYOffset).toBe(2.5);
    expect(holder!.position.y).toBeCloseTo(4.5);
    // Build progress 0 -> construction-site opacity on the adopted materials
    const mesh = holder!.children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh;
    expect((mesh.material as THREE.Material).opacity).toBeCloseTo(0.15);
    expect(r.getModelWaitStats().waited).toBe(1);
  });

  it('a building removed while waiting is never filled', async () => {
    const r = new BuildingRenderer(new THREE.Group());
    const holder = r.addBuilding(12, 'housing', 0, 0, 0, 0, 1);
    r.removeBuilding(12);
    await resolveUrl('/assets/models/v02/brabanders/housing.glb');
    expect(holder!.children).toHaveLength(0);
    expect(r.getObject(12)).toBeUndefined();
  });

  it('later placements of a loaded type render immediately (one download)', async () => {
    const r = new BuildingRenderer(new THREE.Group());
    await Promise.all([r.preloadKeys(['barracks_0']), resolveUrl('/assets/models/v02/brabanders/barracks.glb')]);
    const b = r.addBuilding(13, 'barracks', 0, 0, 0, 0, 1);
    expect(b!.children.length).toBeGreaterThan(0);
    expect(r.pendingCount()).toBe(0);
    expect(requested).toEqual(['/assets/models/v02/brabanders/barracks.glb']);
  });

  it('showing a ghost for an unloaded type starts the download; the model ghost replaces the footprint after', async () => {
    const group = new THREE.Group();
    const r = new BuildingRenderer(group);
    const n = group.children.length;
    r.showGhost('blacksmith', 0, 1, 0, 1, true);
    expect(requested).toEqual(['/assets/models/v02/brabanders/blacksmith.glb']);
    expect(r.isFootprintGhost()).toBe(true);
    expect(group.children.length).toBe(n + 1);
    await resolveUrl('/assets/models/v02/brabanders/blacksmith.glb');
    r.showGhost('blacksmith', 0, 1, 0, 1, true);
    expect(r.isFootprintGhost()).toBe(false);
    expect(group.children.length).toBe(n + 1); // footprint swapped for the model, not added
    const ghost = group.children[group.children.length - 1];
    expect(ghost.name).not.toBe('building_ghost_footprint');
    expect(requested).toHaveLength(1);
  });
});
