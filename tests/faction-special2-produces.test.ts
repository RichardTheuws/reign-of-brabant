// RED test for P0 Bug 4 — FactionSpecial2 produces wrong units.
//
// Current state (v0.37.2): Feestzaal / Parkeergarage / Mijnwerkerskamp / Rijschool
// are stored with `typeId: BuildingTypeId.Barracks` and `produces: [Infantry, Ranged]`.
// PRD §3 requires these to be typed FactionSpecial2 and produce Heavy/Siege-tier
// units. HUD already wires the button to BuildingTypeId.FactionSpecial2
// (src/ui/HUD.ts:246 etc.), so the data mismatch makes the button a ghost-action.
//
// These tests lock the post-fix contract: one FactionSpecial2 entry per faction,
// typed correctly, producing advanced units, priced as T3.

import { describe, it, expect } from 'vitest';
import { FACTION_BUILDINGS, ExtendedFactionId } from '../src/data/factionData';
import { BuildingTypeId, UnitTypeId } from '../src/types/index';

const FACTIONS = [
  ExtendedFactionId.Brabanders,
  ExtendedFactionId.Randstad,
  ExtendedFactionId.Limburgers,
  ExtendedFactionId.Belgen,
] as const;

describe('Bug 4 — FactionSpecial2 produces Heavy/Siege tier units', () => {
  for (const factionId of FACTIONS) {
    const factionName = ExtendedFactionId[factionId];

    describe(`faction ${factionName}`, () => {
      it('has exactly one FactionSpecial2 entry', () => {
        const entries = FACTION_BUILDINGS[factionId]
          .filter((b) => b.typeId === BuildingTypeId.FactionSpecial2);
        expect(entries).toHaveLength(1);
      });

      it('produces at least one Heavy or Siege unit', () => {
        const entry = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.FactionSpecial2);
        expect(entry).toBeDefined();
        const advanced = [UnitTypeId.Heavy, UnitTypeId.Siege] as const;
        const hasAdvanced = entry!.produces.some((u) => (advanced as readonly UnitTypeId[]).includes(u));
        expect(hasAdvanced).toBe(true);
      });

      it('does not duplicate the Barracks produce list', () => {
        const entry = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.FactionSpecial2);
        const barracks = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.Barracks);
        expect(entry).toBeDefined();
        expect(barracks).toBeDefined();
        expect(entry!.produces).not.toEqual(barracks!.produces);
      });

      it('does not train Workers (TownHall responsibility)', () => {
        const entry = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.FactionSpecial2);
        expect(entry!.produces).not.toContain(UnitTypeId.Worker);
      });

      it('is priced as Tier 3 (costGold >= 250, buildTime >= 40)', () => {
        const entry = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.FactionSpecial2);
        expect(entry!.costGold).toBeGreaterThanOrEqual(250);
        expect(entry!.buildTime).toBeGreaterThanOrEqual(40);
      });
    });
  }
});
