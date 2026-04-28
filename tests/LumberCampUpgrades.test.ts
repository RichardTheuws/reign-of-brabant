/**
 * LumberCampUpgrades.test.ts -- v0.37.30 Bundel 1B
 *
 * Locks the wood-upgrade pipeline that runs on the LumberCamp:
 *  - 3 universal upgrades (WoodCarry1=7, WoodCarry2=8, WoodGather=9).
 *  - Cost-deduct + research-started event for each.
 *  - Retroactive apply to existing Workers.
 *  - applyAllUpgradesToNewUnit injects the buff into freshly spawned Workers.
 *  - Non-Worker units stay untouched (affectsUnitTypes guard).
 *  - Per-faction display-name overrides via getDisplayUpgradeName.
 *  - Stacking: WoodCarry1 + WoodCarry2 sum to +10 carryBonus.
 *  - completed-set guard prevents double-apply.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitType, Attack, Armor, Movement, Health, Building, Gatherer,
} from '../src/ecs/components';
import { IsUnit, IsBuilding, IsWorker } from '../src/ecs/tags';
import {
  techTreeSystem, getUpgradeDefinition,
} from '../src/systems/TechTreeSystem';
import { getDisplayUpgradeName } from '../src/data/factionData';
import { ExtendedFactionId } from '../src/data/factionData';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import {
  FactionId, UnitTypeId, BuildingTypeId, UpgradeId,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnLumberCamp(world: World, faction = FactionId.Brabanders, complete = true): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Building.typeId[eid] = BuildingTypeId.LumberCamp;
  Building.complete[eid] = complete ? 1 : 0;
  return eid;
}

function spawnWorker(world: World, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  [Position, Faction, UnitType, Attack, Armor, Movement, Health, Gatherer, IsUnit, IsWorker]
    .forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  UnitType.id[eid] = UnitTypeId.Worker;
  Attack.damage[eid] = 1;
  Armor.value[eid] = 0;
  Movement.speed[eid] = 3;
  Health.current[eid] = 40;
  Health.max[eid] = 40;
  Gatherer.carryCapacity[eid] = 10;
  Gatherer.carryBonus[eid] = 0;
  Gatherer.gatherSpeedMult[eid] = 1;
  return eid;
}

function spawnInfantry(world: World, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  [Position, Faction, UnitType, Attack, Armor, Movement, Health, Gatherer, IsUnit]
    .forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  UnitType.id[eid] = UnitTypeId.Infantry;
  Attack.damage[eid] = 10;
  Armor.value[eid] = 2;
  Movement.speed[eid] = 4;
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  Gatherer.carryBonus[eid] = 0;
  Gatherer.gatherSpeedMult[eid] = 1;
  return eid;
}

function spawnRanged(world: World, faction = FactionId.Brabanders): number {
  const eid = spawnInfantry(world, faction);
  UnitType.id[eid] = UnitTypeId.Ranged;
  return eid;
}

function completeResearch(world: World, factionId: number, lumberCampEid: number, id: UpgradeId): void {
  const def = getUpgradeDefinition(id);
  // Force enough gold + run research to completion in one tick.
  playerState.addGold(factionId, def.cost.gold);
  expect(techTreeSystem.startResearch(factionId, lumberCampEid, id)).toBe(true);
  techTreeSystem.update(world, def.researchTime + 0.01);
}

beforeEach(() => {
  techTreeSystem.reset();
  playerState.reset();
  eventBus.clear();
});

// ---------------------------------------------------------------------------
// Upgrade definitions
// ---------------------------------------------------------------------------

describe('LumberCamp wood-upgrades — definitions', () => {
  it('WoodCarry1 has bonusCarry=5, costGold=100, no prereq', () => {
    const def = getUpgradeDefinition(UpgradeId.WoodCarry1);
    expect(def.bonusCarry).toBe(5);
    expect(def.cost.gold).toBe(100);
    expect(def.prerequisite).toBeNull();
    expect(def.affectsUnitTypes).toEqual([UnitTypeId.Worker]);
  });

  it('WoodCarry2 has bonusCarry=5, costGold=175, requires WoodCarry1', () => {
    const def = getUpgradeDefinition(UpgradeId.WoodCarry2);
    expect(def.bonusCarry).toBe(5);
    expect(def.cost.gold).toBe(175);
    expect(def.prerequisite).toBe(UpgradeId.WoodCarry1);
  });

  it('WoodGather has +25% gather speed, costGold=200, no prereq', () => {
    const def = getUpgradeDefinition(UpgradeId.WoodGather);
    expect(def.bonusGatherSpeedFraction).toBe(0.25);
    expect(def.cost.gold).toBe(200);
    expect(def.prerequisite).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Cost-deduct + event emission
// ---------------------------------------------------------------------------

describe('LumberCamp wood-upgrades — startResearch cost & event', () => {
  it('WoodCarry1 deducts 100 gold and emits research-started', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    playerState.addGold(FactionId.Brabanders, 100);
    let evtFired = false;
    eventBus.on('research-started', (e) => { if (e.upgradeId === UpgradeId.WoodCarry1) evtFired = true; });

    expect(techTreeSystem.startResearch(FactionId.Brabanders, camp, UpgradeId.WoodCarry1)).toBe(true);
    // playerState.reset() seeds 100 gold per player; we top up by exact cost,
    // so balance returns to 100 after spend.
    expect(playerState.getGold(FactionId.Brabanders)).toBe(100);
    expect(evtFired).toBe(true);
  });

  it('WoodCarry2 deducts 175 gold (after WoodCarry1 done)', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry1);
    playerState.addGold(FactionId.Brabanders, 175);

    expect(techTreeSystem.startResearch(FactionId.Brabanders, camp, UpgradeId.WoodCarry2)).toBe(true);
    // playerState.reset() seeds 100 gold per player; we top up by exact cost,
    // so balance returns to 100 after spend.
    expect(playerState.getGold(FactionId.Brabanders)).toBe(100);
  });

  it('WoodGather deducts 200 gold and starts without prereq', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    playerState.addGold(FactionId.Brabanders, 200);

    expect(techTreeSystem.startResearch(FactionId.Brabanders, camp, UpgradeId.WoodGather)).toBe(true);
    // playerState.reset() seeds 100 gold per player; we top up by exact cost,
    // so balance returns to 100 after spend.
    expect(playerState.getGold(FactionId.Brabanders)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Retroactive application to existing Workers
// ---------------------------------------------------------------------------

describe('LumberCamp wood-upgrades — retroactive apply to existing Workers', () => {
  it('WoodCarry1 sets carryBonus=5 on existing Worker', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    const worker = spawnWorker(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry1);

    expect(Gatherer.carryBonus[worker]).toBe(5);
  });

  it('WoodCarry1 + WoodCarry2 stack to carryBonus=10', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    const worker = spawnWorker(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry1);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry2);

    expect(Gatherer.carryBonus[worker]).toBe(10);
  });

  it('WoodGather multiplies gatherSpeedMult by 1.25', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    const worker = spawnWorker(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodGather);

    expect(Gatherer.gatherSpeedMult[worker]).toBeCloseTo(1.25, 5);
  });
});

// ---------------------------------------------------------------------------
// applyAllUpgradesToNewUnit — buff inheritance for fresh spawns
// ---------------------------------------------------------------------------

describe('LumberCamp wood-upgrades — new-spawn inherits completed upgrades', () => {
  it('Worker spawned after WoodCarry1 receives carryBonus=5', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry1);

    const fresh = spawnWorker(world);
    techTreeSystem.applyAllUpgradesToNewUnit(fresh, FactionId.Brabanders);
    expect(Gatherer.carryBonus[fresh]).toBe(5);
  });

  it('Worker spawned after WoodCarry1+2 receives carryBonus=10', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry1);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry2);

    const fresh = spawnWorker(world);
    techTreeSystem.applyAllUpgradesToNewUnit(fresh, FactionId.Brabanders);
    expect(Gatherer.carryBonus[fresh]).toBe(10);
  });

  it('Worker spawned after WoodGather receives gatherSpeedMult=1.25', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodGather);

    const fresh = spawnWorker(world);
    techTreeSystem.applyAllUpgradesToNewUnit(fresh, FactionId.Brabanders);
    expect(Gatherer.gatherSpeedMult[fresh]).toBeCloseTo(1.25, 5);
  });
});

// ---------------------------------------------------------------------------
// Non-Worker isolation — affectsUnitTypes=[Worker] guard
// ---------------------------------------------------------------------------

describe('LumberCamp wood-upgrades — non-Worker units stay untouched', () => {
  it('Infantry unaffected by WoodCarry1', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    const inf = spawnInfantry(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry1);

    expect(Gatherer.carryBonus[inf]).toBe(0);
  });

  it('Ranged unaffected by WoodCarry2', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    const rng = spawnRanged(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry1);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodCarry2);

    expect(Gatherer.carryBonus[rng]).toBe(0);
  });

  it('Infantry unaffected by WoodGather', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    const inf = spawnInfantry(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodGather);

    expect(Gatherer.gatherSpeedMult[inf]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Per-faction display-name overrides
// ---------------------------------------------------------------------------

describe('LumberCamp wood-upgrades — per-faction display naming', () => {
  it('Brabanders WoodCarry1 → "Stevigere Manden"', () => {
    expect(getDisplayUpgradeName(ExtendedFactionId.Brabanders, UpgradeId.WoodCarry1).name)
      .toBe('Stevigere Manden');
  });

  it('Randstad WoodCarry1 → "Grotere Laptoptas"', () => {
    expect(getDisplayUpgradeName(ExtendedFactionId.Randstad, UpgradeId.WoodCarry1).name)
      .toBe('Grotere Laptoptas');
  });

  it('Limburgers WoodGather → "Snellere Oven"', () => {
    expect(getDisplayUpgradeName(ExtendedFactionId.Limburgers, UpgradeId.WoodGather).name)
      .toBe('Snellere Oven');
  });

  it('Belgen WoodCarry2 → "Mayo-Reserve"', () => {
    expect(getDisplayUpgradeName(ExtendedFactionId.Belgen, UpgradeId.WoodCarry2).name)
      .toBe('Mayo-Reserve');
  });
});

// ---------------------------------------------------------------------------
// Idempotence & double-apply guard
// ---------------------------------------------------------------------------

describe('LumberCamp wood-upgrades — guards', () => {
  it('cannot research same upgrade twice (completed-set blocks startResearch)', () => {
    const world = replaceWorld();
    const camp = spawnLumberCamp(world);
    completeResearch(world, FactionId.Brabanders, camp, UpgradeId.WoodGather);
    playerState.addGold(FactionId.Brabanders, 200);

    expect(techTreeSystem.startResearch(FactionId.Brabanders, camp, UpgradeId.WoodGather)).toBe(false);
  });
});
