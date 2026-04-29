/**
 * build-townhall menu entry per faction (v0.43.0)
 *
 * Live-bug Richard 2026-04-29: "we moeten ook zorgen dat we de town halls
 * zelf ook kunnen bouwen, voor als de gold mines opdrogen". Vóór deze
 * release was er geen `build-townhall` action in factionBuildMenus →
 * speler kon geen tweede TownHall plaatsen.
 *
 * Fix: alle 4 facties hebben een hotkey-H entry voor build-townhall met
 * factie-aware label. Cost-override (400g+250h) zit in
 * `world/buildingCost.ts` — getest in `buildingCost.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import { FACTION_WORKER_BUILDS } from '../src/ui/factionBuildMenus';
import { BuildingTypeId } from '../src/types/index';

describe('FACTION_WORKER_BUILDS — build-townhall entry per factie', () => {
  for (const faction of ['brabant', 'randstad', 'limburg', 'belgen'] as const) {
    it(`${faction} has build-townhall on hotkey H, tier 1`, () => {
      const entry = FACTION_WORKER_BUILDS[faction].find(b => b.action === 'build-townhall');
      expect(entry, `${faction} missing build-townhall`).toBeDefined();
      expect(entry?.hotkey).toBe('H');
      expect(entry?.buildingTypeId).toBe(BuildingTypeId.TownHall);
      expect(entry?.tier).toBe(1);
    });
  }

  it('alle 4 facties hebben factie-aware Town Hall labels (niet allemaal "Hoofdkantoor")', () => {
    const labels = (['brabant', 'randstad', 'limburg', 'belgen'] as const)
      .map(f => FACTION_WORKER_BUILDS[f].find(b => b.action === 'build-townhall')?.label);
    expect(labels.every(l => typeof l === 'string' && l.length > 0)).toBe(true);
    // Limburg + Belgen hebben unique flavour-namen (Mergelhoeve / Stadhuis).
    expect(new Set(labels).size).toBeGreaterThanOrEqual(3);
  });

  it('hotkey H is uniek (geen conflict met andere build-action)', () => {
    for (const faction of ['brabant', 'randstad', 'limburg', 'belgen'] as const) {
      const hCount = FACTION_WORKER_BUILDS[faction].filter(b => b.hotkey === 'H').length;
      expect(hCount, `${faction} heeft ${hCount} entries met hotkey H`).toBe(1);
    }
  });
});
