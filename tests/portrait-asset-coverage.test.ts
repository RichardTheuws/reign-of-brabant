// Regression: every (faction × building) and (faction × unit-type) mapping
// declared in portraitMap.ts must have a corresponding PNG on disk under
// public/assets/portraits/. Catches missing-asset deploys before they hit
// the HUD as a broken-image fallback.
import { describe, expect, it } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getBuildingPortraitUrl,
  getHeroPortraitUrl,
  getUnitPortraitUrl,
} from '../src/data/portraitMap';
import { FactionId, UnitTypeId, BuildingTypeId, HeroTypeId } from '../src/types/index';

const PUBLIC_ROOT = resolve(__dirname, '..', 'public');

function pngExists(url: string): { exists: boolean; sizeKb: number; path: string } {
  const path = resolve(PUBLIC_ROOT, url.replace(/^\//, ''));
  const exists = existsSync(path);
  const sizeKb = exists ? Math.round(statSync(path).size / 1024) : 0;
  return { exists, sizeKb, path };
}

const FACTIONS = [FactionId.Brabanders, FactionId.Randstad, FactionId.Limburgers, FactionId.Belgen];
const FACTION_NAMES: Record<FactionId, string> = {
  [FactionId.Brabanders]: 'brabant',
  [FactionId.Randstad]: 'randstad',
  [FactionId.Limburgers]: 'limburg',
  [FactionId.Belgen]: 'belgen',
};

describe('Portrait asset coverage — every mapped portrait has a PNG on disk', () => {
  describe('Buildings (4 factions × 12 building types = 48 portraits)', () => {
    const buildingTypes = [
      BuildingTypeId.TownHall,
      BuildingTypeId.Barracks,
      BuildingTypeId.LumberCamp,
      BuildingTypeId.Blacksmith,
      BuildingTypeId.Housing,
      BuildingTypeId.TertiaryResourceBuilding,
      BuildingTypeId.UpgradeBuilding,
      BuildingTypeId.FactionSpecial1,
      BuildingTypeId.FactionSpecial2,
      BuildingTypeId.DefenseTower,
      BuildingTypeId.SiegeWorkshop,
      BuildingTypeId.Bridge,
    ];

    for (const factionId of FACTIONS) {
      for (const buildingTypeId of buildingTypes) {
        const fac = FACTION_NAMES[factionId];
        const url = getBuildingPortraitUrl(factionId, buildingTypeId);
        it(`${fac} + building #${buildingTypeId} has a mapped URL and PNG file`, () => {
          expect(url, `mapping missing for ${fac}/${buildingTypeId}`).not.toBeNull();
          const { exists, path } = pngExists(url!);
          expect(exists, `PNG missing on disk: ${path}`).toBe(true);
        });
      }
    }
  });

  describe('Units (4 factions × 3-4 unit types)', () => {
    const factionUnitTypes: Record<FactionId, UnitTypeId[]> = {
      [FactionId.Brabanders]: [UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged, UnitTypeId.Support],
      [FactionId.Randstad]: [UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged, UnitTypeId.Support],
      [FactionId.Limburgers]: [UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged, UnitTypeId.Support],
      [FactionId.Belgen]: [UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged, UnitTypeId.Support],
    };

    for (const factionId of FACTIONS) {
      for (const unitTypeId of factionUnitTypes[factionId]) {
        const fac = FACTION_NAMES[factionId];
        const url = getUnitPortraitUrl(factionId, unitTypeId);
        it(`${fac} + unit #${unitTypeId} has a mapped URL and PNG file`, () => {
          expect(url, `mapping missing for ${fac}/${unitTypeId}`).not.toBeNull();
          const { exists, path } = pngExists(url!);
          expect(exists, `PNG missing on disk: ${path}`).toBe(true);
        });
      }
    }
  });

  describe('Heroes (8 mapped hero types)', () => {
    const heroes: HeroTypeId[] = [
      HeroTypeId.PrinsVanBrabant,
      HeroTypeId.BoerVanBrabant,
      HeroTypeId.DeCEO,
      HeroTypeId.DePoliticus,
      HeroTypeId.DeMijnwerker,
      HeroTypeId.DeVlaaibaas,
      HeroTypeId.DeChocolatier,
      HeroTypeId.DeFrituur,
    ];

    for (const heroId of heroes) {
      const url = getHeroPortraitUrl(heroId);
      it(`hero #${heroId} has a mapped URL and PNG file`, () => {
        expect(url, `mapping missing for hero ${heroId}`).not.toBeNull();
        const { exists, path } = pngExists(url!);
        expect(exists, `PNG missing on disk: ${path}`).toBe(true);
      });
    }
  });

  describe('Painted-vignette quality lock — minimum size enforced', () => {
    // Lower bound prevents accidentally re-introducing tiny placeholder assets.
    // Two pre-painted-vignette portraits remain (limburg/belgen-faction-special-1
    // ~280-360 KB) — those land above 250 KB so the bound here catches truly
    // tiny placeholders without false-positiving them. Tighten to 800 KB once
    // those two are regenerated in a future bundle.
    const MIN_BUILDING_KB = 250;
    const MIN_UNIT_KB = 200;

    const buildingTypes = [
      BuildingTypeId.TownHall, BuildingTypeId.Barracks, BuildingTypeId.LumberCamp,
      BuildingTypeId.Blacksmith, BuildingTypeId.Housing, BuildingTypeId.TertiaryResourceBuilding,
      BuildingTypeId.UpgradeBuilding, BuildingTypeId.FactionSpecial1, BuildingTypeId.FactionSpecial2,
      BuildingTypeId.DefenseTower, BuildingTypeId.SiegeWorkshop, BuildingTypeId.Bridge,
    ];

    it('all 48 building portraits are ≥ 800 KB (painted-vignette quality)', () => {
      const offenders: string[] = [];
      for (const factionId of FACTIONS) {
        for (const buildingTypeId of buildingTypes) {
          const url = getBuildingPortraitUrl(factionId, buildingTypeId)!;
          const { sizeKb, path } = pngExists(url);
          if (sizeKb < MIN_BUILDING_KB) offenders.push(`${path} (${sizeKb} KB)`);
        }
      }
      expect(offenders, `low-quality building portraits:\n${offenders.join('\n')}`).toEqual([]);
    });

    it('all unit + hero portraits are ≥ 200 KB (painted-vignette quality)', () => {
      const offenders: string[] = [];
      const factionUnitTypes: Record<FactionId, UnitTypeId[]> = {
        [FactionId.Brabanders]: [UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged, UnitTypeId.Support],
        [FactionId.Randstad]: [UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged],
        [FactionId.Limburgers]: [UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged],
        [FactionId.Belgen]: [UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged],
      };
      for (const factionId of FACTIONS) {
        for (const unitTypeId of factionUnitTypes[factionId]) {
          const url = getUnitPortraitUrl(factionId, unitTypeId)!;
          const { sizeKb, path } = pngExists(url);
          if (sizeKb < MIN_UNIT_KB) offenders.push(`${path} (${sizeKb} KB)`);
        }
      }
      const heroes: HeroTypeId[] = [
        HeroTypeId.PrinsVanBrabant, HeroTypeId.BoerVanBrabant, HeroTypeId.DeCEO, HeroTypeId.DePoliticus,
        HeroTypeId.DeMijnwerker, HeroTypeId.DeVlaaibaas, HeroTypeId.DeChocolatier, HeroTypeId.DeFrituur,
      ];
      for (const heroId of heroes) {
        const url = getHeroPortraitUrl(heroId)!;
        const { sizeKb, path } = pngExists(url);
        if (sizeKb < MIN_UNIT_KB) offenders.push(`${path} (${sizeKb} KB)`);
      }
      expect(offenders, `low-quality unit/hero portraits:\n${offenders.join('\n')}`).toEqual([]);
    });
  });
});
