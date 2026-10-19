// @vitest-environment jsdom
/**
 * model-load-followups.test.ts
 *
 * Locks three follow-ups on the v0.65 lazy model loading:
 *  1. Ghost: choosing a building whose model is not loaded yet shows the 4x4
 *     placement box right away, tinted green/red like the model ghost; the
 *     player's whole build menu is warmed after the critical set.
 *  2. Retry: a failed model load is not memoised for the renderer's lifetime;
 *     the next request after MODEL_RETRY_DELAY_MS downloads again (max
 *     MODEL_MAX_LOAD_ATTEMPTS per match), a new match resets the memo, and a
 *     loaded model stays cached.
 *  3. Death position: a unit whose model is still downloading keeps its
 *     proxy (entityMeshMap entry) on the ECS position, so its death effect
 *     plays where it died, not at its spawn point.
 *
 * GLTFLoader is mocked with manually resolved / rejected promises.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
import { BuildingRenderer, BUILDING_MODEL_PATHS } from '../src/rendering/BuildingRenderer';
import {
  criticalModelKeys,
  warmModelKeys,
  playerBuildingTailKeys,
  ModelLoadFailures,
  MODEL_RETRY_DELAY_MS,
  MODEL_MAX_LOAD_ATTEMPTS,
  PLAYER_BUILDING_TYPES,
} from '../src/rendering/modelPreloadPlan';

const ROOT = resolve(__dirname, '..');
const flush = async (): Promise<void> => { for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0)); };

function settle(url: string, ok: boolean): Promise<void> {
  const d = pending.find((p) => p.url === url);
  expect(d, `no request for ${url}`).toBeTruthy();
  pending.splice(pending.indexOf(d!), 1);
  if (ok) d!.resolve(); else d!.reject();
  return flush();
}
/** Reject every open request (all fallbacks of a chain), until none are left. */
async function failAll(): Promise<void> {
  while (pending.length > 0) await settle(pending[0].url, false);
}

let clock = 0;
beforeEach(() => {
  pending.length = 0;
  requested.length = 0;
  clock = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

// ---------------------------------------------------------------------------
// 1. Ghost
// ---------------------------------------------------------------------------

describe('footprint ghost while the model downloads', () => {
  const tint = (group: THREE.Group): { fill: THREE.Color; edge: THREE.Color } => {
    const ghost = group.children.find((c) => c.name === 'building_ghost_footprint')!;
    const fill = ghost.children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh;
    const edge = ghost.children.find((c) => (c as THREE.LineLoop).isLineLoop) as THREE.LineLoop;
    return {
      fill: (fill.material as THREE.MeshBasicMaterial).color,
      edge: (edge.material as THREE.LineBasicMaterial).color,
    };
  };

  it('shows a 4x4 placement box at the cursor immediately (no model, no wait)', () => {
    const group = new THREE.Group();
    const r = new BuildingRenderer(group);
    r.showGhost('tower', 0, 5, 1, -3, true);
    expect(r.isFootprintGhost()).toBe(true);
    const ghost = group.children.find((c) => c.name === 'building_ghost_footprint');
    expect(ghost).toBeTruthy();
    expect(ghost!.position.toArray()).toEqual([5, 1, -3]);
    const box = new THREE.Box3().setFromObject(ghost!);
    expect(box.max.x - box.min.x).toBeCloseTo(4);
    expect(box.max.z - box.min.z).toBeCloseTo(4);
    expect(box.max.y - box.min.y).toBeLessThan(0.1); // flat: a placement box, not a stand-in model
    expect(requested).toEqual(['/assets/models/v02/brabanders/tower.glb']);
  });

  it('is green when valid and red when blocked, and follows the cursor without rebuilding', () => {
    const group = new THREE.Group();
    const r = new BuildingRenderer(group);
    r.showGhost('tower', 0, 0, 0, 0, true);
    expect(tint(group).fill.getHex()).toBe(0x00ff00);
    expect(tint(group).edge.getHex()).toBe(0x00ff00);
    const first = group.children.find((c) => c.name === 'building_ghost_footprint');
    r.showGhost('tower', 0, 2, 0, 2, false);
    expect(tint(group).fill.getHex()).toBe(0xff0000);
    expect(tint(group).edge.getHex()).toBe(0xff0000);
    expect(group.children.filter((c) => c.name === 'building_ghost_footprint')).toEqual([first]);
    expect(first!.position.x).toBe(2);
    expect(requested).toHaveLength(1); // the in-flight download is shared
  });

  it('hideGhost removes the footprint; switching type replaces it', () => {
    const group = new THREE.Group();
    const r = new BuildingRenderer(group);
    const n = group.children.length;
    r.showGhost('tower', 0, 0, 0, 0, true);
    r.showGhost('blacksmith', 0, 0, 0, 0, true);
    expect(group.children.length).toBe(n + 1);
    r.hideGhost();
    expect(group.children.length).toBe(n);
    expect(r.isFootprintGhost()).toBe(false);
  });

  it('a loaded type shows the model ghost straight away (no footprint)', async () => {
    const r = new BuildingRenderer(new THREE.Group());
    const p = r.preloadKeys(['tower_1']);
    await settle('/assets/models/v02/randstad/tower.glb', true);
    await p;
    r.showGhost('tower', 1, 0, 0, 0, true);
    expect(r.isFootprintGhost()).toBe(false);
  });
});

describe('player build menu is warmed after the critical set', () => {
  for (const faction of [0, 1, 2, 3]) {
    it(`faction ${faction}: tail covers every own building not already critical/warm, and each exists on disk`, () => {
      const critical = criticalModelKeys(
        [{ type: 'worker', factionId: faction }],
        [{ type: 'townhall', factionId: faction }],
        [(faction + 1) % 4],
      );
      const warm = warmModelKeys([faction, (faction + 1) % 4], faction, critical);
      const tail = playerBuildingTailKeys(faction, critical, warm);
      const all = new Set([...critical.buildings, ...warm.buildings, ...tail]);
      for (const t of ['tower', 'blacksmith', 'upgrade', 'special1', 'tertiary', 'advanced', 'siege-workshop']) {
        expect(tail, `${t}_${faction}`).toContain(`${t}_${faction}`);
      }
      for (const t of PLAYER_BUILDING_TYPES) expect(all.has(`${t}_${faction}`)).toBe(true);
      // No duplicates with the sets that are already loading, nothing of other factions.
      for (const k of tail) {
        expect(critical.buildings).not.toContain(k);
        expect(warm.buildings).not.toContain(k);
        expect(k.endsWith(`_${faction}`)).toBe(true);
        const url = BUILDING_MODEL_PATHS[k];
        expect(url, k).toBeTruthy();
        expect(existsSync(resolve(ROOT, 'public', url.replace(/^\//, ''))), url).toBe(true);
      }
      // Tower and Blacksmith (the usual first picks after the basics) come first.
      expect(tail.indexOf(`blacksmith_${faction}`)).toBeLessThan(2);
      expect(tail.indexOf(`tower_${faction}`)).toBeLessThan(2);
    });
  }

  it('Game starts the tail in the background building queue, after the critical set, never awaited', () => {
    const src = readFileSync(resolve(ROOT, 'src/core/Game.ts'), 'utf8');
    // Both skirmish and mission init pass the player tail to warmModels.
    expect(src.match(/this\.warmModels\(warm, loading, playerBuildingTailKeys\(/g)).toHaveLength(2);
    // warmModels chains the tail after the warm buildings and the critical set, one at a time.
    expect(src).toMatch(/Promise\.all\(\[warmBuildings, critical\]\)\s*\.then\(\(\) => this\.buildingRenderer\.prefetch\(playerTail, 1\)\)/);
    // The critical await still only waits for loadCriticalModels.
    expect(src).not.toMatch(/await[^;]*playerBuildingTailKeys/);
  });
});

// ---------------------------------------------------------------------------
// 2. Retry
// ---------------------------------------------------------------------------

describe('ModelLoadFailures', () => {
  it('retries only after the delay, not while a retry is running, and at most MAX attempts', () => {
    let t = 0;
    const f = new ModelLoadFailures(() => t);
    expect(f.canRetry('a')).toBe(false); // never failed
    f.recordFailure('a');
    expect(f.canRetry('a')).toBe(false);
    t = MODEL_RETRY_DELAY_MS - 1;
    expect(f.canRetry('a')).toBe(false);
    t = MODEL_RETRY_DELAY_MS;
    expect(f.canRetry('a')).toBe(true);
    f.markRetrying('a');
    expect(f.canRetry('a')).toBe(false);
    for (let i = 1; i < MODEL_MAX_LOAD_ATTEMPTS; i++) {
      f.recordFailure('a');
      t += MODEL_RETRY_DELAY_MS;
    }
    expect(f.canRetry('a')).toBe(false); // attempts used up
    expect(f.reset()).toEqual(['a']);
    expect(f.hasFailed('a')).toBe(false);
    f.recordFailure('b');
    f.recordSuccess('b');
    expect(f.hasFailed('b')).toBe(false);
  });
});

describe('BuildingRenderer — failed load is retried after backoff', () => {
  const URL = '/assets/models/v02/brabanders/tower.glb';

  async function failTower(r: BuildingRenderer): Promise<void> {
    void r.ensureLoaded('tower_0');
    await failAll();
  }

  it('next request after the delay downloads again; success fills buildings placed meanwhile', async () => {
    const r = new BuildingRenderer(new THREE.Group());
    const holder = r.addBuilding(21, 'tower', 0, 0, 0, 0, 1);
    await failAll();
    expect(r.isModelReady('tower_0')).toBe(false);
    const after1 = requested.length;

    // Within the backoff: no new download.
    clock += MODEL_RETRY_DELAY_MS - 1;
    r.showGhost('tower', 0, 0, 0, 0, true);
    void r.ensureLoaded('tower_0');
    expect(requested.length).toBe(after1);

    // After the backoff: the next request retries, once (not per frame).
    clock += 1;
    r.showGhost('tower', 0, 0, 0, 0, true);
    r.showGhost('tower', 0, 0, 0, 0, true);
    void r.ensureLoaded('tower_0');
    expect(requested.length).toBe(after1 + 1);
    expect(requested[requested.length - 1]).toBe(URL);
    await settle(URL, true);
    expect(r.isModelReady('tower_0')).toBe(true);
    expect(holder!.children.length).toBeGreaterThan(0);
    expect(r.pendingCount()).toBe(0);

    // A loaded model stays cached: no download, however long later.
    clock += 10 * MODEL_RETRY_DELAY_MS;
    await r.ensureLoaded('tower_0');
    r.addBuilding(22, 'tower', 0, 0, 0, 0, 1);
    expect(requested.length).toBe(after1 + 1);
  });

  it('gives up after MODEL_MAX_LOAD_ATTEMPTS downloads per match; a new match starts over at once', async () => {
    const r = new BuildingRenderer(new THREE.Group());
    await failTower(r);
    for (let i = 1; i < MODEL_MAX_LOAD_ATTEMPTS; i++) {
      clock += MODEL_RETRY_DELAY_MS;
      await failTower(r);
    }
    const towerRequests = (): number => requested.filter((u) => u === URL).length;
    expect(towerRequests()).toBe(MODEL_MAX_LOAD_ATTEMPTS);
    clock += 10 * MODEL_RETRY_DELAY_MS;
    void r.ensureLoaded('tower_0');
    expect(towerRequests()).toBe(MODEL_MAX_LOAD_ATTEMPTS);

    r.resetFailedLoads(); // new match
    void r.ensureLoaded('tower_0'); // no backoff after a reset
    expect(towerRequests()).toBe(MODEL_MAX_LOAD_ATTEMPTS + 1);
    await settle(URL, true);
    expect(r.isModelReady('tower_0')).toBe(true);
  });

  it('prefetch includes a failed key whose backoff has passed', async () => {
    const r = new BuildingRenderer(new THREE.Group());
    await failTower(r);
    const n = requested.length;
    await r.prefetch(['tower_0']);
    expect(requested.length).toBe(n);
    clock += MODEL_RETRY_DELAY_MS;
    const done = r.prefetch(['tower_0']);
    await flush();
    expect(requested.length).toBe(n + 1);
    await settle(URL, true);
    await done;
  });
});

describe('UnitRenderer — failed load is retried after backoff', () => {
  const ANIM = '/assets/models/v03/brabanders/heavy.glb';

  it('units drawn as fallback move to the real model when a later retry succeeds', async () => {
    const group = new THREE.Group();
    const r = new UnitRenderer(group);
    const proxy = r.addUnit(31, 'heavy', 0);
    await failAll(); // animated + static chain all 404
    expect(group.children.some((c) => c.name === 'fallback_heavy_0')).toBe(true);
    const n = requested.length;

    // Inside the backoff a new unit of that type does not re-download.
    clock += 1000;
    r.addUnit(32, 'heavy', 0);
    expect(requested.length).toBe(n);

    // After the backoff the next spawn retries.
    clock += MODEL_RETRY_DELAY_MS;
    r.addUnit(33, 'heavy', 0);
    expect(requested.length).toBe(n + 1);
    expect(requested[requested.length - 1]).toBe(ANIM);
    await settle(ANIM, true);

    expect(group.children.some((c) => c.name === 'fallback_heavy_0')).toBe(false);
    const anim = group.children.filter((c) => c.name.startsWith('anim_unit_')).map((c) => c.name).sort();
    expect(anim).toEqual(['anim_unit_31', 'anim_unit_32', 'anim_unit_33']);
    expect(r.getObject(31)).toBe(proxy); // callers keep their entityMeshMap entry
    expect(group.children).toContain(proxy);

    // Loaded: cached for good.
    clock += 10 * MODEL_RETRY_DELAY_MS;
    r.addUnit(34, 'heavy', 0);
    expect(requested.length).toBe(n + 1);
  });

  it('a new match retries a failed unit model immediately', async () => {
    const r = new UnitRenderer(new THREE.Group());
    void r.ensureLoaded('heavy_1');
    await failAll();
    const n = requested.length;
    await r.preloadKeys(['heavy_1']);
    expect(requested.length).toBe(n);
    r.resetFailedLoads();
    const p = r.preloadKeys(['heavy_1']);
    expect(requested.length).toBe(n + 1);
    await settle('/assets/models/v03/randstad/heavy.glb', true);
    await p;
    expect(r.isModelReady('heavy_1')).toBe(true);
  });

  it('Game resets the failure memo of both renderers at every match load', () => {
    const src = readFileSync(resolve(ROOT, 'src/core/Game.ts'), 'utf8');
    const body = src.slice(src.indexOf('private async loadCriticalModels('), src.indexOf('private warmModels('));
    expect(body).toContain('this.unitRenderer.resetFailedLoads();');
    expect(body).toContain('this.buildingRenderer.resetFailedLoads();');
  });
});

// ---------------------------------------------------------------------------
// 3. Death position
// ---------------------------------------------------------------------------

describe('UnitRenderer — proxy of a unit still waiting for its model', () => {
  it('follows the ECS position, so the death effect plays where the unit died', () => {
    const r = new UnitRenderer(new THREE.Group());
    const proxy = r.addUnit(41, 'siege', 2)!;
    proxy.position.set(10, 0, 10); // spawn point (as Game sets it)
    expect(r.pendingCount()).toBe(1);
    r.update(0.016, [{ eid: 41, x: 30, y: 2, z: -12, ry: 1.25, selected: false }]);
    expect(proxy.position.x).toBe(30);
    expect(proxy.position.z).toBe(-12);
    expect(proxy.position.y).toBeCloseTo(3); // same lift as an animated unit's proxy
    expect(proxy.rotation.y).toBeCloseTo(1.25);
    expect(r.pendingCount()).toBe(1); // still not drawn
  });
});
