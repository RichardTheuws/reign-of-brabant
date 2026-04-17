// RED test for P0 Bug 5 — SiegeWorkshop ghost feature.
//
// Current state (v0.37.2): HUD at src/ui/HUD.ts:246-285 renders a
// "build-siege-workshop" button per faction (Tractorschuur / Sloopwerf /
// Steengroeve / Frituurkanon-werkplaats) wired to
// BuildingTypeId.SiegeWorkshop. But FACTION_BUILDINGS
// (src/data/factionData.ts:799-1312) contains NO entry with
// typeId === BuildingTypeId.SiegeWorkshop for any faction. Clicking the
// button enters placement mode, lets the player place a building, then
// production lookups find nothing => siege units unreachable.
//
// These tests lock the contract: one SiegeWorkshop entry per faction with
// faction-flavoured name matching HUD label, producing Siege units, T3 priced.

import { describe, it, expect } from 'vitest';
import { FACTION_BUILDINGS, ExtendedFactionId } from '../src/data/factionData';
import { BuildingTypeId, UnitTypeId } from '../src/types/index';

const FACTIONS = [
  ExtendedFactionId.Brabanders,
  ExtendedFactionId.Randstad,
  ExtendedFactionId.Limburgers,
  ExtendedFactionId.Belgen,
] as const;

// HUD labels from src/ui/HUD.ts:246-285 — data.name should match this
// exactly so tooltips / build-menu stay in sync with the data layer.
const HUD_SIEGE_LABELS: Record<number, string> = {
  [ExtendedFactionId.Brabanders]: 'Tractorschuur',
  [ExtendedFactionId.Randstad]: 'Sloopwerf',
  [ExtendedFactionId.Limburgers]: 'Steengroeve',
  [ExtendedFactionId.Belgen]: 'Frituurkanon-werkplaats',
};

describe('Bug 5 — SiegeWorkshop data exists per faction (HUD/data parity)', () => {
  for (const factionId of FACTIONS) {
    const factionName = ExtendedFactionId[factionId];

    describe(`faction ${factionName}`, () => {
      it('has a SiegeWorkshop entry in FACTION_BUILDINGS', () => {
        const siege = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.SiegeWorkshop);
        expect(siege, `SiegeWorkshop missing for faction ${factionName}`).toBeDefined();
      });

      it('produces Siege units', () => {
        const siege = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.SiegeWorkshop);
        expect(siege!.produces).toContain(UnitTypeId.Siege);
      });

      it('is priced as Tier 3 (costGold >= 300, buildTime >= 40)', () => {
        const siege = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.SiegeWorkshop);
        expect(siege!.costGold).toBeGreaterThanOrEqual(300);
        expect(siege!.buildTime).toBeGreaterThanOrEqual(40);
      });

      it('has a non-empty faction-flavoured name', () => {
        const siege = FACTION_BUILDINGS[factionId]
          .find((b) => b.typeId === BuildingTypeId.SiegeWorkshop);
        expect(siege!.name.length).toBeGreaterThan(2);
      });
    });
  }

  it('data.name per faction matches HUD build-menu label (parity guard)', () => {
    for (const factionId of FACTIONS) {
      const siege = FACTION_BUILDINGS[factionId]
        .find((b) => b.typeId === BuildingTypeId.SiegeWorkshop);
      expect(siege, `SiegeWorkshop missing for faction ${ExtendedFactionId[factionId]}`).toBeDefined();
      expect(siege!.name).toBe(HUD_SIEGE_LABELS[factionId]);
    }
  });
});
