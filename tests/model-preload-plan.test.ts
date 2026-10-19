// @vitest-environment jsdom
/**
 * model-preload-plan.test.ts
 *
 * Locks the match-load contract (v0.65): the loading screen only waits for
 * the models of what is on the map at the start (Town Halls + workers), the
 * background "warm" set stays small, and every key in both sets resolves to
 * a GLB on disk. Before this, a 1v1 awaited all 2x(6 units + 2 heroes + 14
 * buildings) models: ~80MB and ~72s on Fast 4G before the HUD appeared.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateMap } from '../src/world/MapGenerator';
import { BuildingTypeId, UnitTypeId } from '../src/types/index';
import {
  criticalModelKeys,
  warmModelKeys,
  AI_OPENING_BUILDING_TYPES,
  WARM_PLAYER_BUILDING_TYPES,
  WARM_UNIT_TYPES,
  WARM_PLAYER_UNIT_TYPES,
} from '../src/rendering/modelPreloadPlan';
import { primaryUnitModelUrl } from '../src/rendering/UnitRenderer';
import { BUILDING_MODEL_PATHS } from '../src/rendering/BuildingRenderer';

const ROOT = resolve(__dirname, '..');
const MB = 1024 * 1024;

function fileBytes(url: string | null | undefined): number {
  expect(url, 'key has no model path').toBeTruthy();
  const file = resolve(ROOT, 'public', url!.replace(/^\//, ''));
  expect(existsSync(file), `missing ${url}`).toBe(true);
  return statSync(file).size;
}

function unitBytes(keys: string[]): number {
  return keys.reduce((n, k) => n + fileBytes(primaryUnitModelUrl(k)), 0);
}
function buildingBytes(keys: string[]): number {
  return keys.reduce((n, k) => n + fileBytes(BUILDING_MODEL_PATHS[k]), 0);
}

const TEMPLATES = ['classic', 'crossroads', 'islands', 'arena', 'fortress', 'river-valley', 'canyon', 'archipelago'] as const;

describe('critical model set — what the HUD waits for', () => {
  for (const template of TEMPLATES) {
    for (const players of [2, 3, 4] as const) {
      it(`${template} / ${players} players: only start Town Halls and workers`, () => {
        const map = generateMap(42, () => 0, players, template);
        // The structural premise: a skirmish starts with Town Halls + workers only.
        expect(new Set(map.buildings.map((b) => b.buildingType))).toEqual(new Set([BuildingTypeId.TownHall]));
        expect(new Set(map.units.map((u) => u.unitType))).toEqual(new Set([UnitTypeId.Worker]));

        const crit = criticalModelKeys(
          map.units.map((u) => ({ type: 'worker', factionId: u.factionId })),
          map.buildings.map((b) => ({ type: 'townhall', factionId: b.factionId })),
        );
        const factions = new Set(map.spawns.map((s) => s.factionId));
        expect(crit.units.sort()).toEqual([...factions].map((f) => `worker_${f}`).sort());
        expect(crit.buildings.sort()).toEqual([...factions].map((f) => `townhall_${f}`).sort());
      });
    }
  }

  it('dedupes keys (many workers -> one model)', () => {
    const crit = criticalModelKeys(
      [{ type: 'worker', factionId: 0 }, { type: 'worker', factionId: 0 }, { type: 'worker', factionId: 1 }],
      [{ type: 'townhall', factionId: 0 }],
    );
    expect(crit).toEqual({ units: ['worker_0', 'worker_1'], buildings: ['townhall_0'] });
  });

  // Every 1v1 pairing (player a vs AI b): the HUD waits for <= 20MB of models
  // (the heaviest pairs involve Belgen/Limburgers, whose Town Halls and
  // Barracks are geometry-heavy). Brabanders vs Randstad: ~7.5MB.
  for (const a of [0, 1, 2, 3]) {
    for (const b of [0, 1, 2, 3]) {
      if (a >= b) continue;
      it(`1v1 factions ${a} vs ${b}: critical models <= 20MB, critical + warm <= 36MB`, () => {
        const crit = criticalModelKeys(
          [{ type: 'worker', factionId: a }, { type: 'worker', factionId: b }],
          [{ type: 'townhall', factionId: a }, { type: 'townhall', factionId: b }],
          [b],
        );
        expect(crit.buildings.sort()).toEqual([`barracks_${b}`, `housing_${b}`, `townhall_${a}`, `townhall_${b}`].sort());
        const critBytes = unitBytes(crit.units) + buildingBytes(crit.buildings);
        expect(critBytes).toBeLessThanOrEqual(20 * MB);
        const warm = warmModelKeys([a, b], a, crit);
        const warmBytes = unitBytes(warm.units) + buildingBytes(warm.buildings);
        expect(critBytes + warmBytes).toBeLessThanOrEqual(36 * MB);
      });
    }
  }
});

describe('warm model set — background after the HUD', () => {
  it('is the short list: infantry/ranged, player housing/barracks/lumbercamp + heroes', () => {
    expect([...WARM_UNIT_TYPES]).toEqual(['infantry', 'ranged']);
    expect([...WARM_PLAYER_BUILDING_TYPES]).toEqual(['housing', 'barracks', 'lumbercamp']);
    expect([...WARM_PLAYER_UNIT_TYPES]).toEqual(['hero0', 'hero1']);
  });

  it('downloads the AI side first', () => {
    const crit = criticalModelKeys([{ type: 'worker', factionId: 2 }, { type: 'worker', factionId: 3 }], [{ type: 'townhall', factionId: 2 }, { type: 'townhall', factionId: 3 }], [3]);
    const warm = warmModelKeys([2, 3], 2, crit);
    expect(warm.buildings).toEqual(['housing_2', 'barracks_2', 'lumbercamp_2']);
    expect(warm.units).toEqual(['infantry_3', 'ranged_3', 'infantry_2', 'ranged_2', 'hero0_2', 'hero1_2']);
  });

  it('AI opening buildings (critical) cover every building type the AI builds early', () => {
    const ai =readFileSync(resolve(ROOT, 'src/ai/AIController.ts'), 'utf8');
    const built = new Set([...ai.matchAll(/issueBuild\(snapshot, BuildingTypeId\.(\w+)/g)].map((m) => m[1]));
    // Tertiary is conditional (strategy flag) and loads on demand.
    built.delete('TertiaryResourceBuilding');
    expect([...built].sort()).toEqual(['Barracks', 'Housing']);
    expect([...AI_OPENING_BUILDING_TYPES].sort()).toEqual(['barracks', 'housing']);
  });

  it('skips critical keys, includes only the player heroes, and leaves elite/late models on demand', () => {
    const crit = criticalModelKeys([{ type: 'worker', factionId: 0 }, { type: 'worker', factionId: 1 }], [{ type: 'townhall', factionId: 0 }, { type: 'townhall', factionId: 1 }], [1]);
    const warm = warmModelKeys([0, 1], 0, crit);
    expect(warm.units.sort()).toEqual(['hero0_0', 'hero1_0', 'infantry_0', 'infantry_1', 'ranged_0', 'ranged_1']);
    expect(warm.buildings.sort()).toEqual(['barracks_0', 'housing_0', 'lumbercamp_0']);
    for (const k of [...warm.units, ...warm.buildings]) {
      expect(k).not.toMatch(/^(heavy|siege|support|townhall|worker|tower|advanced|blacksmith|upgrade|special1|tertiary|siege-workshop)_/);
    }
  });
});

describe('Game wiring', () => {
  const game = readFileSync(resolve(ROOT, 'src/core/Game.ts'), 'utf8');

  it('never awaits a whole-faction preload at match start', () => {
    expect(game).not.toMatch(/unitRenderer\.preload\(/);
    expect(game).not.toMatch(/buildingRenderer\.preload\(/);
    // skirmish + mission: critical load started, warm set started, then awaited
    expect(game.match(/const loading = this\.loadCriticalModels\(critical\);/g)).toHaveLength(2);
    expect(game.match(/await loading;/g)).toHaveLength(2);
  });

  it('warms in the background and prefetches queued unit types', () => {
    expect(game).toMatch(/const warm = warmModelKeys\(/);
    expect(game).toMatch(/this\.warmModels\(warm, /);
    expect(game).toMatch(/this\.prefetchQueuedUnitModels\(dt\)/);
  });
});
