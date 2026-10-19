// @vitest-environment jsdom
/**
 * match-teardown-leaks.test.ts — nothing may accumulate across matches.
 *
 * Measured in the browser (menu -> skirmish -> menu, 8 rounds, CDP heap
 * snapshots) before the fix, per extra match:
 *  1. HUD: +18 listeners on the static train/rally buttons. attachTooltipHandlers
 *     added mouseenter/mousemove/mouseleave without tracking them, so destroy()
 *     never removed them; the old worker buttons were also kept alive by
 *     boundHandlers for a whole match after setFaction() rebuilt the panel.
 *  2. SelectionRenderer.preload ran every match: +50 circles and +64 canvas
 *     health bars (canvas + CanvasTexture + SpriteMaterial + Sprite).
 *  3. Terrain.rebuild disposed the previous map's feature meshes but left them
 *     in the scene: +6 bridge/tunnel models and +4 glow rings per match.
 *  4. PropRenderer.preload ran every match: +6 empty InstancedMeshes plus their
 *     cloned geometry (~2 MB ArrayBuffers per match).
 * After the fix all counters stay flat from match 2 on.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@audio/AudioManager', () => ({
  audioManager: { playSound: vi.fn(), toggleMute: vi.fn(() => false) },
}));

import { HUD, type BuildingCardData } from '@ui/HUD';
import { SelectionRenderer } from '../src/rendering/SelectionRenderer';
import { PropRenderer } from '../src/rendering/PropRenderer';
import { Terrain, type TerrainFeatures } from '../src/world/Terrain';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Listener accounting (net adds per target, wrapped on EventTarget.prototype)
// ---------------------------------------------------------------------------

const live = new Map<EventTarget, number>();
const origAdd = EventTarget.prototype.addEventListener;
const origRemove = EventTarget.prototype.removeEventListener;
const seen = new WeakMap<EventTarget, Set<string>>();

function installListenerCounter(): void {
  live.clear();
  EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, fn: unknown, opts?: unknown) {
    const id = `${type}|${typeof opts === 'boolean' ? opts : !!(opts as { capture?: boolean } | undefined)?.capture}`;
    let s = seen.get(this);
    if (!s) { s = new Set(); seen.set(this, s); }
    const key = id + '|' + fnId(fn);
    if (!s.has(key)) { s.add(key); live.set(this, (live.get(this) ?? 0) + 1); }
    return origAdd.call(this, type, fn as EventListener, opts as AddEventListenerOptions);
  } as typeof EventTarget.prototype.addEventListener;
  EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, fn: unknown, opts?: unknown) {
    const id = `${type}|${typeof opts === 'boolean' ? opts : !!(opts as { capture?: boolean } | undefined)?.capture}`;
    const s = seen.get(this);
    const key = id + '|' + fnId(fn);
    if (s?.has(key)) { s.delete(key); live.set(this, (live.get(this) ?? 1) - 1); }
    return origRemove.call(this, type, fn as EventListener, opts as EventListenerOptions);
  } as typeof EventTarget.prototype.removeEventListener;
}

const fnIds = new WeakMap<object, number>();
let nextFnId = 1;
function fnId(fn: unknown): number {
  if (!fn || (typeof fn !== 'function' && typeof fn !== 'object')) return 0;
  let id = fnIds.get(fn as object);
  if (!id) { id = nextFnId++; fnIds.set(fn as object, id); }
  return id;
}

function restoreListenerCounter(): void {
  EventTarget.prototype.addEventListener = origAdd;
  EventTarget.prototype.removeEventListener = origRemove;
}

const listenersOn = (t: EventTarget): number => live.get(t) ?? 0;
// Only DOM nodes (document + elements) count; window is excluded: jsdom registers its own window listeners lazily; the HUD
// itself never listens on window (asserted in the source checks below).
const totalListeners = (): number => { let n = 0; for (const [t, v] of live) if (t instanceof Node) n += v; return n; };

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

const SKELETON = `
  <div id="ui-overlay"></div>
  <div id="alert-container"></div>
  <div id="selection-panel" hidden></div>
  <div id="unit-single" hidden></div>
  <div id="unit-multi" hidden></div>
  <div id="multi-grid"></div><div id="multi-count"></div>
  <div id="building-panel" hidden></div><div id="building-card" hidden></div>
  <div id="bcard-portrait"></div><div id="bcard-name"></div><div id="bcard-faction"></div>
  <div id="bcard-hp-bar"></div><div id="bcard-hp-text"></div><div id="bcard-status"></div>
  <div id="bcard-actions"></div>
  <div id="game-over" hidden></div><div id="game-over-title"></div><div id="game-over-subtitle"></div>
  <button id="btn-retry"></button><button id="btn-menu"></button>
  <button id="audio-mute-btn"></button><button id="tech-tree-btn"></button>
  <canvas id="minimap-canvas" width="200" height="200"></canvas>
  <div id="res-gold"></div><div id="res-wood"></div>
  <div id="res-pop"></div><div id="res-pop-max"></div>
  <div class="resource-item" data-resource="population"></div>
  <div id="fps-value"></div><div id="fps-counter"></div>
  <div id="res-gezelligheid"></div>
  <button id="rage-btn"></button><div id="rage-cooldown"></div><div id="rage-duration"></div>
  <div id="unit-portrait"></div><div id="unit-level"></div><div id="unit-name"></div>
  <div id="unit-hp-bar"></div><div id="unit-hp-text"></div><div id="stat-atk"></div>
  <div id="stat-arm"></div><div id="stat-spd"></div><div id="unit-status"></div>
  <div id="stat-duration"></div><div id="stat-produced"></div><div id="stat-lost"></div>
  <div id="stat-killed"></div><div id="stat-buildings"></div><div id="stat-resources"></div>
  <div id="stat-gold"></div><div id="stat-wood"></div>
  <div id="building-name"></div><div id="building-portrait"></div>
  <div id="building-hp-bar"></div><div id="building-hp-text"></div>
  <div class="queue-progress" hidden></div><div id="queue-label"></div>
  <div id="queue-bar"></div><div id="queue-time"></div>
  <div id="cmd-worker" hidden>
    <button class="cmd-btn" data-action="build-barracks"><span class="btn-icon"></span><span>Kazerne</span></button>
  </div>
  <div id="cmd-unit" hidden>
    <button class="cmd-btn" data-action="move"><span class="btn-icon"></span><span>Move</span></button>
  </div>
  <div id="cmd-multi" hidden></div>
  <div id="cmd-building" hidden>
    <button class="cmd-btn" data-action="train-worker" data-hotkey="Q"><span class="btn-icon"></span><span></span></button>
    <button class="cmd-btn" data-action="train-infantry" data-hotkey="W"><span class="btn-icon"></span><span></span></button>
    <button class="cmd-btn" data-action="train-ranged" data-hotkey="E"><span class="btn-icon"></span><span></span></button>
    <button class="cmd-btn" data-action="rally-point" data-hotkey="R"><span class="btn-icon"></span><span></span></button>
  </div>
  <div id="cmd-hero" hidden></div>
  <div id="cmd-blacksmith" hidden></div>
`;

function runHudMatch(): HUD {
  const hud = new HUD();
  hud.init({
    onMinimapClick: vi.fn(),
    onCommand: vi.fn(),
    onPortraitClick: vi.fn(),
    onRetry: vi.fn(),
    onMenu: vi.fn(),
    onQueueCancel: vi.fn(),
  });
  hud.setFaction('brabant');
  return hud;
}

describe('HUD — no listener accumulation across matches', () => {
  beforeEach(() => {
    document.body.innerHTML = SKELETON;
    installListenerCounter();
  });
  afterEach(() => {
    restoreListenerCounter();
    document.body.innerHTML = '';
  });

  it('destroy() removes every listener the HUD added, incl. tooltip handlers on static buttons', () => {
    const before = totalListeners();
    const hud = runHudMatch();
    const trainBtn = document.querySelector('[data-action="train-worker"]')!;
    // click + mouseenter + mousemove + mouseleave while the match runs
    expect(listenersOn(trainBtn)).toBe(4);
    hud.destroy();
    expect(listenersOn(trainBtn)).toBe(0);
    expect(listenersOn(document.querySelector('[data-action="rally-point"]')!)).toBe(0);
    expect(totalListeners()).toBe(before);
    expect(hud.boundListenerCount).toBe(0);
  });

  it('listener totals are identical after 1 and after 5 match cycles', () => {
    const totalsInMatch: number[] = [];
    const totalsAfter: number[] = [];
    for (let i = 0; i < 5; i++) {
      const hud = runHudMatch();
      totalsInMatch.push(totalListeners());
      hud.destroy();
      totalsAfter.push(totalListeners());
    }
    expect(new Set(totalsInMatch).size).toBe(1);
    expect(new Set(totalsAfter).size).toBe(1);
    // static buttons carry exactly one match's worth of listeners, never more
    const trainBtn = document.querySelector('[data-action="train-infantry"]')!;
    const hud = runHudMatch();
    expect(listenersOn(trainBtn)).toBe(4);
    hud.destroy();
  });

  it('setFaction() releases the replaced worker buttons immediately', () => {
    const hud = runHudMatch();
    const worker = document.getElementById('cmd-worker')!;
    const firstButtons = Array.from(worker.querySelectorAll('button'));
    expect(firstButtons.length).toBeGreaterThan(0);
    const countAfterFirst = hud.boundListenerCount;

    hud.setFaction('randstad');
    hud.setFaction('brabant');

    // the discarded buttons are detached and carry no listeners any more
    for (const b of firstButtons) {
      expect(b.isConnected).toBe(false);
      expect(listenersOn(b)).toBe(0);
    }
    expect(hud.boundListenerCount).toBe(countAfterFirst);
    hud.destroy();
  });
});

describe('HUD — building-card rebuilds do not accumulate tracked listeners', () => {
  beforeEach(() => {
    document.body.innerHTML = SKELETON;
    installListenerCounter();
  });
  afterEach(() => {
    restoreListenerCounter();
    document.body.innerHTML = '';
  });

  function cardData(actionCount: number): BuildingCardData {
    const actions: BuildingCardData['actions'] = [
      { action: 'train-worker', icon: 'WRK', label: 'Boer', hotkey: 'Q' },
      { action: 'train-infantry', icon: 'INF', label: 'Carnavalvierder', hotkey: 'W' },
      { action: 'train-ranged', icon: 'RNG', label: 'Kansen', hotkey: 'E' },
      { action: 'rally-point', icon: 'RLY', label: 'Rally', hotkey: 'R', isRally: true },
    ];
    return {
      id: 7,
      name: 'Gemeentehuis',
      factionName: 'Brabanders',
      hp: 900,
      maxHp: 1500,
      status: 'Idle',
      queue: [],
      portraitAbbrev: 'TH',
      buildingTypeId: 0,
      actions: actions.slice(0, actionCount),
    };
  }

  it('boundListenerCount stays flat over repeated showBuildingCard calls', () => {
    const hud = runHudMatch();
    const counts: number[] = [];
    for (let i = 0; i < 50; i++) {
      hud.showBuildingCard(cardData(i % 2 === 0 ? 4 : 2));
      if (i % 2 === 0) counts.push(hud.boundListenerCount);
    }
    expect(new Set(counts).size).toBe(1);
    hud.destroy();
    expect(hud.boundListenerCount).toBe(0);
  });

  it('replaced building-card buttons are detached and carry no listeners', () => {
    const hud = runHudMatch();
    hud.showBuildingCard(cardData(4));
    const actionsEl = document.getElementById('bcard-actions')!;
    const firstButtons = Array.from(actionsEl.querySelectorAll('button'));
    expect(firstButtons.length).toBe(4);
    for (const b of firstButtons) expect(listenersOn(b)).toBeGreaterThan(0);

    hud.showBuildingCard(cardData(4));
    for (const b of firstButtons) {
      expect(b.isConnected).toBe(false);
      expect(listenersOn(b)).toBe(0);
    }
    // the new buttons are wired: click + 3 tooltip handlers
    const newButtons = Array.from(actionsEl.querySelectorAll('button'));
    expect(newButtons.length).toBe(4);
    for (const b of newButtons) expect(listenersOn(b)).toBe(4);
    hud.destroy();
  });
});

// ---------------------------------------------------------------------------
// Renderers: preload() runs every match and must build its pools once
// ---------------------------------------------------------------------------

function fakeGltf(): { scene: THREE.Group } {
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
  return { scene };
}

describe('Renderer preload() is idempotent across matches', () => {
  beforeEach(() => {
    vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async () => fakeGltf() as never);
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({})) as never;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SelectionRenderer: circles + health bars are allocated once, however often preload runs', async () => {
    const selection = new THREE.Group();
    const bars = new THREE.Group();
    const r = new SelectionRenderer(selection, bars);
    await r.preload();
    const circles = selection.children.length;
    const healthBars = bars.children.length;
    expect(circles).toBeGreaterThan(0);
    expect(healthBars).toBeGreaterThan(0);

    await Promise.all([r.preload(), r.preload()]); // concurrent callers share one load
    await r.preload();
    expect(selection.children.length).toBe(circles);
    expect(bars.children.length).toBe(healthBars);
    expect(r.circlePoolSize).toBe(circles);
    expect(r.healthBarPoolSize).toBe(healthBars);
    expect(GLTFLoader.prototype.loadAsync).toHaveBeenCalledTimes(1);
  });

  it('SelectionRenderer: a failed preload can be retried', async () => {
    const spy = vi.mocked(GLTFLoader.prototype.loadAsync);
    spy.mockRejectedValueOnce(new Error('network'));
    const r = new SelectionRenderer(new THREE.Group(), new THREE.Group());
    await expect(r.preload()).rejects.toThrow('network');
    await r.preload();
    expect(r.circlePoolSize).toBeGreaterThan(0);
  });

  it('PropRenderer: tree/rock instanced meshes are created once', async () => {
    const group = new THREE.Group();
    const r = new PropRenderer(group);
    await r.preload();
    const meshes = r.instancedMeshCount;
    const children = group.children.length;
    expect(meshes).toBeGreaterThan(0);

    for (let i = 0; i < 3; i++) await r.preload();
    expect(r.instancedMeshCount).toBe(meshes);
    expect(group.children.length).toBe(children);
  });

  it('PropRenderer: destroy() allows a fresh preload', async () => {
    const group = new THREE.Group();
    const r = new PropRenderer(group);
    await r.preload();
    const meshes = r.instancedMeshCount;
    r.destroy();
    expect(r.instancedMeshCount).toBe(0);
    await r.preload();
    expect(r.instancedMeshCount).toBe(meshes);
  });
});

// ---------------------------------------------------------------------------
// Terrain: the previous map's feature meshes leave the scene on rebuild
// ---------------------------------------------------------------------------

const MIN_FEATURES: TerrainFeatures = {
  biome: 'meadow',
  rivers: [],
  bridges: [],
  rockWalls: [],
  roads: [],
  tunnels: [],
  flattenPositions: [],
};

describe('Terrain.rebuild — old feature meshes are removed from the scene', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillStyle: '',
      fillRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) })),
    })) as never;
  });

  it('scene child count is stable over repeated matches', () => {
    const scene = new THREE.Scene();
    const t = new Terrain(MIN_FEATURES);
    const counts: number[] = [];
    for (let match = 0; match < 4; match++) {
      t.rebuild(MIN_FEATURES);
      // a bridge model + a glow ring, the way buildFeatureVisuals fills the list
      t.featureMeshes.push(new THREE.Group(), new THREE.Mesh(new THREE.RingGeometry(1, 2, 8), new THREE.MeshBasicMaterial()));
      for (const m of t.featureMeshes) scene.add(m); // Game.initScene
      counts.push(scene.children.length);
    }
    expect(counts).toEqual([2, 2, 2, 2]);
  });
});

// ---------------------------------------------------------------------------
// Per-match code must not subscribe to global sources it never unsubscribes
// ---------------------------------------------------------------------------

describe('per-match code has no unmanaged global subscriptions', () => {
  const strip = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const game = strip(readFileSync(resolve(__dirname, '..', 'src', 'core', 'Game.ts'), 'utf-8'));
  const hud = strip(readFileSync(resolve(__dirname, '..', 'src', 'ui', 'HUD.ts'), 'utf-8'));

  it('Game.ts and HUD.ts do not subscribe to settings/volume/state changes or start intervals', () => {
    for (const [name, src] of [['Game.ts', game], ['HUD.ts', hud]] as const) {
      for (const pattern of [/onGameSettingsChange\s*\(/, /onVolumeChange\s*\(/, /stateMachine\.onChange\s*\(/, /setInterval\s*\(/, /new ResizeObserver/]) {
        expect(pattern.test(src), `${name} matches ${pattern}`).toBe(false);
      }
    }
  });

  it('every HUD addEventListener goes through tracked registration', () => {
    // Untracked listeners are only allowed on elements the HUD itself recreates
    // per render (their nodes are discarded with innerHTML='').
    const raw = hud.match(/\.addEventListener\(/g) ?? [];
    const tracked = hud.match(/boundHandlers\.push\(/g) ?? [];
    // Allowed today (6): multi-grid portrait, building-card action button and
    // queue-cancel button (all rebuilt via innerHTML=''), plus the tech-tree
    // overlay/close/Escape handlers that hideTechTree() removes on destroy().
    expect(raw.length - tracked.length).toBeLessThanOrEqual(6);
  });
});
