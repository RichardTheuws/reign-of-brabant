/**
 * UpgradeBuildingResearch.test.ts -- Bundel 2A v0.37.33
 *
 * Locks the UpgradeBuilding research-pakket:
 *  - 4 T3 universal (MeleeAttack3=50, RangedAttack3=51, ArmorUpgrade3=52, MoveSpeed2=53)
 *  - 4 faction-unique (Carnavalsvuur=14, AIOptimization=24, Mergelharnas=34, DiamantgloeiendeWapens=44)
 *
 * Contracts:
 *  - canResearch with `world` arg returns false without complete UpgradeBuilding,
 *    true with one. Without `world`, the gate fails closed.
 *  - canResearch enforces prerequisite chain: MeleeAttack3 needs MeleeAttack2.
 *  - applyUpgradeToExistingUnits applies retroactively (Mergelharnas → Heavy +3 armor;
 *    non-Heavy untouched).
 *  - duplicate research is blocked by the completed-set.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitType, Attack, Armor, Movement, Health, Building,
} from '../src/ecs/components';
import { IsUnit, IsBuilding } from '../src/ecs/tags';
import {
  techTreeSystem, getUpgradeDefinition,
} from '../src/systems/TechTreeSystem';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import {
  FactionId, UnitTypeId, BuildingTypeId, UpgradeId,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnBuilding(world: World, typeId: BuildingTypeId, faction = FactionId.Brabanders, complete = true): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Building.typeId[eid] = typeId;
  Building.complete[eid] = complete ? 1 : 0;
  return eid;
}

function spawnUnit(world: World, type: UnitTypeId, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  [Position, Faction, UnitType, Attack, Armor, Movement, Health, IsUnit]
    .forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  UnitType.id[eid] = type;
  Attack.damage[eid] = 10;
  Armor.value[eid] = 2;
  Movement.speed[eid] = 4;
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  return eid;
}

function completeUpgrade(world: World, factionId: number, researcherEid: number, id: UpgradeId): void {
  const def = getUpgradeDefinition(id);
  playerState.addGold(factionId, def.cost.gold);
  expect(techTreeSystem.startResearch(factionId, researcherEid, id, world)).toBe(true);
  techTreeSystem.update(world, def.researchTime + 0.01);
}

beforeEach(() => {
  techTreeSystem.reset();
  playerState.reset();
  eventBus.clear();
});

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------

describe('UpgradeBuilding research — definitions', () => {
  it('MeleeAttack3 has bonusDamage=3, costGold=350, prereq MeleeAttack2, requiresUpgradeBuilding', () => {
    const def = getUpgradeDefinition(UpgradeId.MeleeAttack3);
    expect(def.bonusDamage).toBe(3);
    expect(def.cost.gold).toBe(350);
    expect(def.prerequisite).toBe(UpgradeId.MeleeAttack2);
    expect(def.requiresUpgradeBuilding).toBe(true);
    expect(def.affectsUnitTypes).toEqual([UnitTypeId.Infantry]);
  });

  it('Carnavalsvuur has bonusDamageFraction=0.10 + UpgradeBuilding gate, no prereq', () => {
    const def = getUpgradeDefinition(UpgradeId.Carnavalsvuur);
    expect(def.bonusDamageFraction).toBe(0.10);
    expect(def.prerequisite).toBeNull();
    expect(def.requiresUpgradeBuilding).toBe(true);
    expect(def.cost.gold).toBe(500);
  });

  it('Mergelharnas affects only Heavy units with bonusArmor=3', () => {
    const def = getUpgradeDefinition(UpgradeId.Mergelharnas);
    expect(def.affectsUnitTypes).toEqual([UnitTypeId.Heavy]);
    expect(def.bonusArmor).toBe(3);
  });

  it('DiamantgloeiendeWapens has bonusCritChance=0.05', () => {
    const def = getUpgradeDefinition(UpgradeId.DiamantgloeiendeWapens);
    expect(def.bonusCritChance).toBe(0.05);
  });

  it('AIOptimization has bonusProductionSpeedFraction=0.20', () => {
    const def = getUpgradeDefinition(UpgradeId.AIOptimization);
    expect(def.bonusProductionSpeedFraction).toBe(0.20);
  });
});

// ---------------------------------------------------------------------------
// canResearch gate-behaviour
// ---------------------------------------------------------------------------

describe('UpgradeBuilding research — canResearch gate', () => {
  it('canResearch fails without `world` argument (gate fails closed)', () => {
    const world = replaceWorld();
    spawnBuilding(world, BuildingTypeId.UpgradeBuilding);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack1);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack2);
    expect(techTreeSystem.canResearch(FactionId.Brabanders, UpgradeId.MeleeAttack3)).toBe(false);
  });

  it('canResearch fails without complete UpgradeBuilding even with prereq done', () => {
    const world = replaceWorld();
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack1);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack2);
    expect(techTreeSystem.canResearch(FactionId.Brabanders, UpgradeId.MeleeAttack3, world)).toBe(false);
  });

  it('canResearch fails when UpgradeBuilding exists but is incomplete', () => {
    const world = replaceWorld();
    spawnBuilding(world, BuildingTypeId.UpgradeBuilding, FactionId.Brabanders, false);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack1);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack2);
    expect(techTreeSystem.canResearch(FactionId.Brabanders, UpgradeId.MeleeAttack3, world)).toBe(false);
  });

  it('canResearch fails for the wrong faction (UpgradeBuilding belongs to Randstad, Brabant cannot research)', () => {
    const world = replaceWorld();
    spawnBuilding(world, BuildingTypeId.UpgradeBuilding, FactionId.Randstad);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack1);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack2);
    expect(techTreeSystem.canResearch(FactionId.Brabanders, UpgradeId.MeleeAttack3, world)).toBe(false);
  });

  it('canResearch passes when UpgradeBuilding complete + prereq done', () => {
    const world = replaceWorld();
    spawnBuilding(world, BuildingTypeId.UpgradeBuilding);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack1);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack2);
    expect(techTreeSystem.canResearch(FactionId.Brabanders, UpgradeId.MeleeAttack3, world)).toBe(true);
  });

  it('canResearch fails for T3 without T2 done (prerequisite chain)', () => {
    const world = replaceWorld();
    spawnBuilding(world, BuildingTypeId.UpgradeBuilding);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack1);
    expect(techTreeSystem.canResearch(FactionId.Brabanders, UpgradeId.MeleeAttack3, world)).toBe(false);
  });

  it('Carnavalsvuur gate passes with UpgradeBuilding (no prereq required)', () => {
    const world = replaceWorld();
    spawnBuilding(world, BuildingTypeId.UpgradeBuilding);
    expect(techTreeSystem.canResearch(FactionId.Brabanders, UpgradeId.Carnavalsvuur, world)).toBe(true);
  });

  it('startResearch also enforces UpgradeBuilding gate (defense-in-depth)', () => {
    const world = replaceWorld();
    const ub = spawnBuilding(world, BuildingTypeId.UpgradeBuilding, FactionId.Brabanders, false);
    playerState.addGold(FactionId.Brabanders, 500);
    expect(techTreeSystem.startResearch(FactionId.Brabanders, ub, UpgradeId.Carnavalsvuur, world)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Retroactive effects
// ---------------------------------------------------------------------------

describe('UpgradeBuilding research — retroactive effects', () => {
  it('Mergelharnas adds +3 armor to existing Heavy unit', () => {
    const world = replaceWorld();
    const ub = spawnBuilding(world, BuildingTypeId.UpgradeBuilding, FactionId.Limburgers);
    const heavy = spawnUnit(world, UnitTypeId.Heavy, FactionId.Limburgers);
    const armorBefore = Armor.value[heavy];
    completeUpgrade(world, FactionId.Limburgers, ub, UpgradeId.Mergelharnas);
    expect(Armor.value[heavy]).toBe(armorBefore + 3);
  });

  it('Mergelharnas does NOT touch Infantry (affectsUnitTypes filter)', () => {
    const world = replaceWorld();
    const ub = spawnBuilding(world, BuildingTypeId.UpgradeBuilding, FactionId.Limburgers);
    const inf = spawnUnit(world, UnitTypeId.Infantry, FactionId.Limburgers);
    const armorBefore = Armor.value[inf];
    completeUpgrade(world, FactionId.Limburgers, ub, UpgradeId.Mergelharnas);
    expect(Armor.value[inf]).toBe(armorBefore);
  });

  it('Mergelharnas + ArmorUpgrade1 stack additively on Heavy (+1 + +3 = +4)', () => {
    const world = replaceWorld();
    const ub = spawnBuilding(world, BuildingTypeId.UpgradeBuilding, FactionId.Limburgers);
    const heavy = spawnUnit(world, UnitTypeId.Heavy, FactionId.Limburgers);
    const armorBefore = Armor.value[heavy];
    completeUpgrade(world, FactionId.Limburgers, spawnBuilding(world, BuildingTypeId.Blacksmith, FactionId.Limburgers), UpgradeId.ArmorUpgrade1);
    completeUpgrade(world, FactionId.Limburgers, ub, UpgradeId.Mergelharnas);
    expect(Armor.value[heavy]).toBe(armorBefore + 4);
  });

  it('MeleeAttack3 retroactive on Infantry (+3 dmg)', () => {
    const world = replaceWorld();
    const ub = spawnBuilding(world, BuildingTypeId.UpgradeBuilding);
    const inf = spawnUnit(world, UnitTypeId.Infantry);
    const dmgBefore = Attack.damage[inf];
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack1);
    completeUpgrade(world, FactionId.Brabanders, spawnBuilding(world, BuildingTypeId.Blacksmith), UpgradeId.MeleeAttack2);
    completeUpgrade(world, FactionId.Brabanders, ub, UpgradeId.MeleeAttack3);
    expect(Attack.damage[inf]).toBe(dmgBefore + 2 + 2 + 3); // T1+T2+T3
  });
});

// ---------------------------------------------------------------------------
// Duplicate-research guard
// ---------------------------------------------------------------------------

describe('UpgradeBuilding research — guards', () => {
  it('cannot research Carnavalsvuur twice', () => {
    const world = replaceWorld();
    const ub = spawnBuilding(world, BuildingTypeId.UpgradeBuilding);
    completeUpgrade(world, FactionId.Brabanders, ub, UpgradeId.Carnavalsvuur);
    playerState.addGold(FactionId.Brabanders, 500);
    expect(techTreeSystem.startResearch(FactionId.Brabanders, ub, UpgradeId.Carnavalsvuur, world)).toBe(false);
  });

  it('cannot research Mergelharnas twice', () => {
    const world = replaceWorld();
    const ub = spawnBuilding(world, BuildingTypeId.UpgradeBuilding, FactionId.Limburgers);
    completeUpgrade(world, FactionId.Limburgers, ub, UpgradeId.Mergelharnas);
    playerState.addGold(FactionId.Limburgers, 500);
    expect(techTreeSystem.startResearch(FactionId.Limburgers, ub, UpgradeId.Mergelharnas, world)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Map-based getUpgradeDefinition (sparse-id support)
// ---------------------------------------------------------------------------

describe('getUpgradeDefinition — Map lookup supports sparse IDs', () => {
  it('returns Carnavalsvuur (id=14, sparse — array indices 10-13 are stub-only)', () => {
    const def = getUpgradeDefinition(UpgradeId.Carnavalsvuur);
    expect(def.id).toBe(UpgradeId.Carnavalsvuur);
    expect(def.name).toBe('Carnavalsvuur');
  });

  it('returns DiamantgloeiendeWapens (id=44, sparse)', () => {
    const def = getUpgradeDefinition(UpgradeId.DiamantgloeiendeWapens);
    expect(def.id).toBe(UpgradeId.DiamantgloeiendeWapens);
  });

  it('throws on unknown id', () => {
    expect(() => getUpgradeDefinition(99 as UpgradeId)).toThrow(/Unknown UpgradeId/);
  });
});
