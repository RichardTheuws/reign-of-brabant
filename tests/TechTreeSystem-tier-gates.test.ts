/**
 * TechTreeSystem-tier-gates.test.ts -- Locks F5-stappen 25 + 26.
 *
 * Audit-context: full-playthrough audit Fase 5 stappen 25 (Tier 2 unlock) en
 * 26 (Tier 3 gate, audit-04 circulair).
 *
 * Audit-04 finding: UpgradeBuilding ontbreekt in FACTION_BUILDINGS voor alle
 * 4 facties → Tier 3 gates (FactionSpecial2, SiegeWorkshop) zijn permanent
 * vergrendeld. We locken dit hier en de fix werkt deze tests groen.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Building } from '../src/ecs/components';
import { IsBuilding } from '../src/ecs/tags';
import { techTreeSystem } from '../src/systems/TechTreeSystem';
import { FACTION_BUILDINGS, getBuildingsForFaction } from '../src/data/factionData';
import { FactionId, BuildingTypeId } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnBuildingEntity(
  world: World,
  faction: number,
  typeId: BuildingTypeId,
  complete: 0 | 1 = 1,
): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding].forEach((c) => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Building.typeId[eid] = typeId;
  Building.complete[eid] = complete;
  return eid;
}

beforeEach(() => {
  techTreeSystem.reset();
});

// ---------------------------------------------------------------------------
// F5-stap 25 — Tier 2 unlock requires completed Blacksmith
// ---------------------------------------------------------------------------

const TIER_2_TYPES: BuildingTypeId[] = [
  BuildingTypeId.Housing,
  BuildingTypeId.DefenseTower,
  BuildingTypeId.TertiaryResourceBuilding,
  BuildingTypeId.FactionSpecial1,
  BuildingTypeId.UpgradeBuilding,
];

describe('F5-stap 25 — Tier 2 gate (requires completed Blacksmith)', () => {
  for (const t2 of TIER_2_TYPES) {
    it(`canBuildBuilding(${BuildingTypeId[t2]}) = false without Blacksmith`, () => {
      const world = replaceWorld();
      expect(
        techTreeSystem.canBuildBuilding(FactionId.Brabanders, t2, world),
      ).toBe(false);
    });

    it(`canBuildBuilding(${BuildingTypeId[t2]}) = false with INCOMPLETE Blacksmith`, () => {
      const world = replaceWorld();
      spawnBuildingEntity(world, FactionId.Brabanders, BuildingTypeId.Blacksmith, 0);
      expect(
        techTreeSystem.canBuildBuilding(FactionId.Brabanders, t2, world),
      ).toBe(false);
    });

    it(`canBuildBuilding(${BuildingTypeId[t2]}) = true once Blacksmith completes`, () => {
      const world = replaceWorld();
      spawnBuildingEntity(world, FactionId.Brabanders, BuildingTypeId.Blacksmith, 1);
      expect(
        techTreeSystem.canBuildBuilding(FactionId.Brabanders, t2, world),
      ).toBe(true);
    });
  }

  it('Blacksmith from another faction does NOT unlock Tier 2', () => {
    const world = replaceWorld();
    spawnBuildingEntity(world, FactionId.Randstad, BuildingTypeId.Blacksmith, 1);
    expect(
      techTreeSystem.canBuildBuilding(FactionId.Brabanders, BuildingTypeId.Housing, world),
    ).toBe(false);
  });

  it('T1 buildings never blocked (TownHall/Barracks/LumberCamp/Blacksmith)', () => {
    const world = replaceWorld();
    for (const t1 of [
      BuildingTypeId.TownHall,
      BuildingTypeId.Barracks,
      BuildingTypeId.LumberCamp,
      BuildingTypeId.Blacksmith,
    ]) {
      expect(techTreeSystem.canBuildBuilding(FactionId.Brabanders, t1, world)).toBe(true);
    }
  });

  it('getUnlockedTier returns 2 once Blacksmith complete', () => {
    const world = replaceWorld();
    expect(techTreeSystem.getUnlockedTier(FactionId.Brabanders, world)).toBe(1);
    spawnBuildingEntity(world, FactionId.Brabanders, BuildingTypeId.Blacksmith, 1);
    expect(techTreeSystem.getUnlockedTier(FactionId.Brabanders, world)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// F5-stap 26 — Tier 3 gate
// ---------------------------------------------------------------------------

const TIER_3_TYPES: BuildingTypeId[] = [
  BuildingTypeId.FactionSpecial2,
  BuildingTypeId.SiegeWorkshop,
];

describe('F5-stap 26 — Tier 3 gate (requires completed UpgradeBuilding)', () => {
  for (const t3 of TIER_3_TYPES) {
    it(`canBuildBuilding(${BuildingTypeId[t3]}) = false with only Blacksmith`, () => {
      const world = replaceWorld();
      spawnBuildingEntity(world, FactionId.Brabanders, BuildingTypeId.Blacksmith, 1);
      expect(
        techTreeSystem.canBuildBuilding(FactionId.Brabanders, t3, world),
      ).toBe(false);
    });

    it(`canBuildBuilding(${BuildingTypeId[t3]}) = true once UpgradeBuilding completes`, () => {
      const world = replaceWorld();
      spawnBuildingEntity(world, FactionId.Brabanders, BuildingTypeId.UpgradeBuilding, 1);
      expect(
        techTreeSystem.canBuildBuilding(FactionId.Brabanders, t3, world),
      ).toBe(true);
    });
  }

  it('getUnlockedTier returns 3 with UpgradeBuilding complete', () => {
    const world = replaceWorld();
    spawnBuildingEntity(world, FactionId.Brabanders, BuildingTypeId.UpgradeBuilding, 1);
    expect(techTreeSystem.getUnlockedTier(FactionId.Brabanders, world)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// F5-stap 26 — Audit-04 finding: UpgradeBuilding data MUST exist per faction
// ---------------------------------------------------------------------------

describe('F5-stap 26 — UpgradeBuilding archetype required for every faction (audit-04)', () => {
  const FACTIONS = [
    { id: FactionId.Brabanders, label: 'Brabanders' },
    { id: FactionId.Randstad,   label: 'Randstad' },
    { id: FactionId.Limburgers, label: 'Limburgers' },
    { id: FactionId.Belgen,     label: 'Belgen' },
  ];

  for (const f of FACTIONS) {
    it(`${f.label} has a BuildingTypeId.UpgradeBuilding entry in FACTION_BUILDINGS`, () => {
      const archetypes = getBuildingsForFaction(f.id);
      const upgrade = archetypes.find((a) => a.typeId === BuildingTypeId.UpgradeBuilding);
      expect(
        upgrade,
        `${f.label} mist UpgradeBuilding archetype — Tier 3 (FactionSpecial2 + SiegeWorkshop) is daardoor onbereikbaar.`,
      ).toBeDefined();
      expect(upgrade!.name).toBeTruthy();
      expect(upgrade!.costGold).toBeGreaterThan(0);
      expect(upgrade!.hp).toBeGreaterThan(0);
      expect(upgrade!.buildTime).toBeGreaterThan(0);
    });
  }

  it('all 4 factions appear in FACTION_BUILDINGS map', () => {
    expect(FACTION_BUILDINGS[FactionId.Brabanders]).toBeDefined();
    expect(FACTION_BUILDINGS[FactionId.Randstad]).toBeDefined();
    expect(FACTION_BUILDINGS[FactionId.Limburgers]).toBeDefined();
    expect(FACTION_BUILDINGS[FactionId.Belgen]).toBeDefined();
  });
});
