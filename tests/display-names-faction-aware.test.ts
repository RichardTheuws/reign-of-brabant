/**
 * display-names-faction-aware.test.ts -- Locks dat ALLE building-typen en
 * unit-typen per factie hun eigen naam tonen, in plaats van fallbacks
 * "Gebouw" of "Unit".
 *
 * Live-bug v0.37.27 (Richard 2026-04-25):
 *   - "Het gebouw dat je met C bouwt heeft geen naam" → UpgradeBuilding ontbrak
 *     in Game.getBuildingName mapping (fallback 'Gebouw').
 *   - "De getrainde units heten soms 'unit' in plaats van hun titel" →
 *     Heavy/Siege/Support ontbraken in Game.getUnitNameByType (fallback 'Unit').
 *
 * Strategie: in plaats van hardcoded mappings te onderhouden, gebruiken we
 * factionData als single source of truth. We exporteren helpers
 * `getDisplayBuildingName(factionId, typeId)` en `getDisplayUnitName(factionId, typeId)`
 * die `getFactionBuildingArchetype` / `getFactionUnitArchetype` gebruiken.
 */
import { describe, it, expect } from 'vitest';
import {
  getDisplayBuildingName, getDisplayUnitName,
} from '../src/data/factionData';
import {
  FactionId, BuildingTypeId, UnitTypeId,
} from '../src/types/index';

const FACTIONS = [FactionId.Brabanders, FactionId.Randstad, FactionId.Limburgers, FactionId.Belgen];

const BUILDING_TYPES: BuildingTypeId[] = [
  BuildingTypeId.TownHall,
  BuildingTypeId.Barracks,
  BuildingTypeId.LumberCamp,
  BuildingTypeId.Blacksmith,
  BuildingTypeId.Housing,
  BuildingTypeId.DefenseTower,
  BuildingTypeId.TertiaryResourceBuilding,
  BuildingTypeId.UpgradeBuilding,
  BuildingTypeId.FactionSpecial1,
  BuildingTypeId.FactionSpecial2,
  BuildingTypeId.SiegeWorkshop,
];

const UNIT_TYPES: UnitTypeId[] = [
  UnitTypeId.Worker,
  UnitTypeId.Infantry,
  UnitTypeId.Ranged,
  UnitTypeId.Heavy,
  UnitTypeId.Siege,
  UnitTypeId.Support,
];

const FALLBACK_BUILDING = 'Gebouw';
const FALLBACK_UNIT = 'Unit';

describe('Display names — building names per faction (no "Gebouw" fallback)', () => {
  for (const factionId of FACTIONS) {
    for (const typeId of BUILDING_TYPES) {
      it(`Faction ${FactionId[factionId]} → ${BuildingTypeId[typeId]} resolves to a real name`, () => {
        const name = getDisplayBuildingName(factionId, typeId);
        expect(name).toBeTruthy();
        expect(name).not.toBe(FALLBACK_BUILDING);
        expect(name.length).toBeGreaterThan(2);
      });
    }
  }

  it('UpgradeBuilding shows faction-specific name (Wagenbouwer/Innovatie Lab/Hoogoven/Diamantslijperij)', () => {
    expect(getDisplayBuildingName(FactionId.Brabanders, BuildingTypeId.UpgradeBuilding)).toBe('Wagenbouwer');
    expect(getDisplayBuildingName(FactionId.Randstad,   BuildingTypeId.UpgradeBuilding)).toBe('Innovatie Lab');
    expect(getDisplayBuildingName(FactionId.Limburgers, BuildingTypeId.UpgradeBuilding)).toBe('Hoogoven');
    expect(getDisplayBuildingName(FactionId.Belgen,     BuildingTypeId.UpgradeBuilding)).toBe('Diamantslijperij');
  });

  it('Barracks shows faction-specific name (Cafe/Vergaderzaal/Schuttershal/Frituur)', () => {
    expect(getDisplayBuildingName(FactionId.Brabanders, BuildingTypeId.Barracks)).toBe('Cafe');
    expect(getDisplayBuildingName(FactionId.Randstad,   BuildingTypeId.Barracks)).toBe('Vergaderzaal');
    expect(getDisplayBuildingName(FactionId.Limburgers, BuildingTypeId.Barracks)).toBe('Schuttershal');
    expect(getDisplayBuildingName(FactionId.Belgen,     BuildingTypeId.Barracks)).toBe('Frituur');
  });

  it('Blacksmith shows faction-specific name (Kermistent/Coworking Space/Klooster/EU-Parlement)', () => {
    expect(getDisplayBuildingName(FactionId.Brabanders, BuildingTypeId.Blacksmith)).toBe('Kermistent');
    expect(getDisplayBuildingName(FactionId.Randstad,   BuildingTypeId.Blacksmith)).toBe('Coworking Space');
    expect(getDisplayBuildingName(FactionId.Limburgers, BuildingTypeId.Blacksmith)).toBe('Klooster');
    expect(getDisplayBuildingName(FactionId.Belgen,     BuildingTypeId.Blacksmith)).toBe('EU-Parlement');
  });
});

describe('Display names — unit names per faction (no "Unit" fallback)', () => {
  for (const factionId of FACTIONS) {
    for (const typeId of UNIT_TYPES) {
      it(`Faction ${FactionId[factionId]} → ${UnitTypeId[typeId]} resolves to a real name`, () => {
        const name = getDisplayUnitName(factionId, typeId);
        expect(name).toBeTruthy();
        expect(name).not.toBe(FALLBACK_UNIT);
        expect(name.length).toBeGreaterThan(2);
      });
    }
  }

  it('Heavy units have faction-specific names (Tractorrijder/Corporate Advocaat/Mergelridder/Frituurridder)', () => {
    expect(getDisplayUnitName(FactionId.Brabanders, UnitTypeId.Heavy)).toBe('Tractorrijder');
    expect(getDisplayUnitName(FactionId.Randstad,   UnitTypeId.Heavy)).toBe('Corporate Advocaat');
    expect(getDisplayUnitName(FactionId.Limburgers, UnitTypeId.Heavy)).toBe('Mergelridder');
    expect(getDisplayUnitName(FactionId.Belgen,     UnitTypeId.Heavy)).toBe('Frituurridder');
  });

  it('Siege units have faction-specific names', () => {
    expect(getDisplayUnitName(FactionId.Brabanders, UnitTypeId.Siege)).toBe('Frituurmeester');
    expect(getDisplayUnitName(FactionId.Randstad,   UnitTypeId.Siege)).toBe('Vastgoedmakelaar');
    expect(getDisplayUnitName(FactionId.Limburgers, UnitTypeId.Siege)).toBe('Kolenbrander');
    expect(getDisplayUnitName(FactionId.Belgen,     UnitTypeId.Siege)).toBe('Manneken Pis-kanon');
  });

  it('Support units have faction-specific names', () => {
    expect(getDisplayUnitName(FactionId.Brabanders, UnitTypeId.Support)).toBe('Boerinneke');
    expect(getDisplayUnitName(FactionId.Randstad,   UnitTypeId.Support)).toBe('HR-Medewerker');
    expect(getDisplayUnitName(FactionId.Limburgers, UnitTypeId.Support)).toBe('Sjpion');
    expect(getDisplayUnitName(FactionId.Belgen,     UnitTypeId.Support)).toBe('Wafelzuster');
  });

  it('Worker/Infantry/Ranged still resolve correctly (regression check)', () => {
    expect(getDisplayUnitName(FactionId.Brabanders, UnitTypeId.Worker)).toBe('Boer');
    expect(getDisplayUnitName(FactionId.Brabanders, UnitTypeId.Infantry)).toBe('Carnavalvierder');
    expect(getDisplayUnitName(FactionId.Brabanders, UnitTypeId.Ranged)).toBe('Sluiper');
  });
});
