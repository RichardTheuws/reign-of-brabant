/**
 * graphics-settings-wiring.test.ts -- Locks that the settings panel toggles
 * (shadows / bloom / particles / grid / edge-scroll) are actually read:
 *
 *  - gameSettings store: loads from localStorage, survives corrupt/blocked
 *    storage, persists updates, and notifies listeners on subscribe + change.
 *  - applyShadowSetting flips renderer.shadowMap.enabled + sun.castShadow.
 *  - PostProcessing.setBloomEnabled toggles the bloom pass.
 *  - ParticleSystem.setEnabled blocks spawning and clears live particles.
 *  - Rendering modules subscribe to the store (apply on load + on change).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  getGameSettings,
  updateGameSettings,
  onGameSettingsChange,
  resetGameSettingsForTests,
} from '../src/ui/gameSettings';
import { applyShadowSetting, applyAmbientParticleSetting } from '../src/rendering/Atmosphere';
import { ParticleSystem } from '../src/rendering/ParticleSystem';

// EffectComposer needs a real WebGL context; mock the addons so the
// PostProcessing class can be constructed against a fake renderer.
vi.mock('three/addons/postprocessing/EffectComposer.js', () => ({
  EffectComposer: class {
    passes: unknown[] = [];
    addPass(p: unknown) { this.passes.push(p); }
    render() {}
    setSize() {}
  },
}));
vi.mock('three/addons/postprocessing/RenderPass.js', () => ({
  RenderPass: class { enabled = true; },
}));
vi.mock('three/addons/postprocessing/UnrealBloomPass.js', () => ({
  UnrealBloomPass: class {
    enabled = true;
    resolution = new THREE.Vector2();
  },
}));
vi.mock('three/addons/postprocessing/OutlinePass.js', () => ({
  OutlinePass: class { enabled = true; selectedObjects: unknown[] = []; },
}));
vi.mock('three/addons/postprocessing/OutputPass.js', () => ({
  OutputPass: class { enabled = true; },
}));

import { PostProcessing } from '../src/rendering/PostProcessing';

function fakeRenderer() {
  return {
    shadowMap: { enabled: true, needsUpdate: false },
    getSize: (v: THREE.Vector2) => v.set(800, 600),
  } as unknown as THREE.WebGLRenderer;
}

function bloomPassOf(pp: PostProcessing): { enabled: boolean } {
  return (pp as unknown as { bloomPass: { enabled: boolean } }).bloomPass;
}

function aliveCount(ps: ParticleSystem): number {
  const meta = (ps as unknown as { meta: { alive: boolean }[] }).meta;
  return meta.filter((m) => m.alive).length;
}

// In-memory localStorage stub (vitest runs in node), same pattern as
// CampaignManager-save-migration.test.ts.
let store: Record<string, string> = {};
const memoryStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = String(v); },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { store = {}; },
};

beforeEach(() => {
  store = {};
  (globalThis as { localStorage?: unknown }).localStorage = memoryStorage;
  resetGameSettingsForTests();
});

describe('gameSettings store', () => {
  it('returns defaults when nothing is stored', () => {
    expect(getGameSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('loads persisted values merged over defaults', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ bloom: false, grid: true }));
    const s = getGameSettings();
    expect(s.bloom).toBe(false);
    expect(s.grid).toBe(true);
    expect(s.shadows).toBe(true);
  });

  it('falls back to defaults on corrupt JSON', () => {
    localStorage.setItem(SETTINGS_KEY, '{not json');
    expect(getGameSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('survives a throwing localStorage', () => {
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    expect(getGameSettings()).toEqual(DEFAULT_SETTINGS);
    expect(() => updateGameSettings({ particles: false })).not.toThrow();
    expect(getGameSettings().particles).toBe(false);
  });

  it('persists updates', () => {
    updateGameSettings({ edgeScroll: false });
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!).edgeScroll).toBe(false);
  });

  it('calls listeners immediately and on every change, until unsubscribed', () => {
    const fn = vi.fn();
    const off = onGameSettingsChange(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].edgeScroll).toBe(true);

    updateGameSettings({ edgeScroll: false });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[1][0].edgeScroll).toBe(false);

    off();
    updateGameSettings({ edgeScroll: true });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('shadow setting', () => {
  it('toggles renderer.shadowMap and the sun castShadow', () => {
    const renderer = fakeRenderer();
    const sun = new THREE.DirectionalLight();
    sun.castShadow = true;

    applyShadowSetting(renderer, sun, false);
    expect(renderer.shadowMap.enabled).toBe(false);
    expect(sun.castShadow).toBe(false);

    applyShadowSetting(renderer, sun, true);
    expect(renderer.shadowMap.enabled).toBe(true);
    expect(sun.castShadow).toBe(true);
    expect(renderer.shadowMap.needsUpdate).toBe(true);
  });

  it('hides ambient dust when particles are off', () => {
    const pts = new THREE.Points();
    applyAmbientParticleSetting(pts, false);
    expect(pts.visible).toBe(false);
    applyAmbientParticleSetting(pts, true);
    expect(pts.visible).toBe(true);
  });
});

describe('bloom setting', () => {
  it('PostProcessing applies stored bloom=false on construction and follows changes', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ bloom: false }));
    const pp = new PostProcessing(fakeRenderer(), new THREE.Scene(), new THREE.PerspectiveCamera());
    expect(bloomPassOf(pp).enabled).toBe(false);

    updateGameSettings({ bloom: true });
    expect(bloomPassOf(pp).enabled).toBe(true);

    pp.setBloomEnabled(false);
    expect(bloomPassOf(pp).enabled).toBe(false);
  });
});

describe('particles setting', () => {
  it('blocks spawning when disabled and clears live particles', () => {
    const ps = new ParticleSystem(new THREE.Scene());
    ps.spawnGoldSparkle(0, 0, 0);
    expect(aliveCount(ps)).toBeGreaterThan(0);

    updateGameSettings({ particles: false });
    expect(aliveCount(ps)).toBe(0);
    ps.spawnGoldSparkle(0, 0, 0);
    ps.spawnDeathEffect(0, 0, 0, 0xff0000);
    expect(aliveCount(ps)).toBe(0);

    updateGameSettings({ particles: true });
    ps.spawnGoldSparkle(0, 0, 0);
    expect(aliveCount(ps)).toBeGreaterThan(0);
  });

  it('applies stored particles=false on construction', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ particles: false }));
    const ps = new ParticleSystem(new THREE.Scene());
    ps.spawnGoldSparkle(0, 0, 0);
    expect(aliveCount(ps)).toBe(0);
  });
});
