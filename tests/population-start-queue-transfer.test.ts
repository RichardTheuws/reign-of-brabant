/**
 * population-start-queue-transfer.test.ts -- follow-ups to the population
 * accounting fix (review 2026-10-16).
 *
 *  1. Campaign start: barracks/towers no longer give +5 cap, incomplete mission
 *     buildings no longer count, and pre-placed Heavy/Siege now cost their
 *     real population. Without compensation brabant-10/11/12, limburgers-8 and
 *     belgen-8 started over the cap. grantMissionStartingCapBonus() keeps each
 *     faction's free room at mission start exactly what it was before.
 *  2. Queue time (CommandSystem 'train') checked room for 1 while
 *     ProductionSystem needs the real cost: a Heavy/Siege that cannot fit was
 *     charged and then blocked the building's queue.
 *  3. transferOwnership moved `populationProvided ?? 5` for any complete
 *     building, while PopulationSystem grants barracks 0: it must move exactly
 *     what was granted.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { query } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Building, Faction, Production } from '../src/ecs/components';
import {
  resetPopulationSystem, syncBuildingPopulationCap, grantMissionStartingCapBonus,
  createPopulationSystem,
} from '../src/systems/PopulationSystem';
import { createCommandSystem, queueCommand } from '../src/systems/CommandSystem';
import { transferOwnership, resetDiplomacy } from '../src/systems/DiplomacySystem';
import { spawnBuildingEntity } from '../src/entities/buildingSpawn';
import { spawnBasicUnit, getUnitPopulationCost } from '../src/entities/factories';
import { BUILDING_ARCHETYPES } from '../src/entities/archetypes';
import {
  BRABANDERS_MISSIONS, LIMBURGERS_MISSIONS, BELGEN_MISSIONS, RANDSTAD_MISSIONS,
} from '../src/campaign/MissionDefinitions';
import type { MissionDefinition } from '../src/campaign/MissionDefinitions';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import { FactionId, BuildingTypeId, UnitTypeId, NO_PRODUCTION } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const STATS = {
  hp: 100, attack: 10, attackSpeed: 1, armor: 0, speed: 5, range: 1.5, sightRange: 10, carryCapacity: 10,
};

/** Mirror of Game._spawnMissionEntities + createBuildingEntity/createUnitEntity bookkeeping. */
function spawnMission(world: World, m: MissionDefinition): void {
  for (const b of m.buildings) {
    const eid = spawnBuildingEntity(world, b.buildingType, b.factionId, b.x, b.z);
    syncBuildingPopulationCap(world, eid);
    Building.complete[eid] = b.complete ? 1 : 0;
    Building.progress[eid] = b.complete ? 1 : 0;
  }
  for (const u of m.units) {
    spawnBasicUnit(world, u.unitType, u.factionId, u.x, 0, u.z, STATS);
    playerState.addPopulation(u.factionId, getUnitPopulationCost(u.factionId, u.unitType));
  }
}

/** Free room each faction had at mission start under the old rules (+5 default, 1 per unit). */
function legacyRoom(m: MissionDefinition, faction: number): number {
  let cap = 10;
  for (const b of m.buildings) {
    if (b.factionId !== faction) continue;
    cap += BUILDING_ARCHETYPES[b.buildingType]?.populationProvided ?? 5;
  }
  const pop = m.units.filter((u) => u.factionId === faction).length;
  return cap - pop;
}

const MISSIONS: MissionDefinition[] = [
  ...BRABANDERS_MISSIONS, ...LIMBURGERS_MISSIONS, ...BELGEN_MISSIONS, ...RANDSTAD_MISSIONS,
];

beforeEach(() => {
  playerState.reset();
  eventBus.clear();
  resetPopulationSystem();
  resetDiplomacy();
});

describe('mission start: free population room is preserved', () => {
  for (const m of MISSIONS) {
    it(`${m.id}: every faction starts with the same free room as before`, () => {
      const world = replaceWorld();
      spawnMission(world, m);
      grantMissionStartingCapBonus(world);
      createPopulationSystem()(world, 0.016); // sweep must not undo the bonus

      const factions = new Set<number>([
        ...m.buildings.map((b) => b.factionId), ...m.units.map((u) => u.factionId),
      ]);
      for (const f of factions) {
        const room = playerState.getPopulationMax(f) - playerState.getPopulation(f);
        expect(room, `faction ${f}`).toBeGreaterThanOrEqual(legacyRoom(m, f));
      }
    });
  }

  it('brabant-style start with a barracks and heavies is not over cap', () => {
    const world = replaceWorld();
    const F = FactionId.Brabanders;
    spawnBuildingEntity(world, BuildingTypeId.TownHall, F, 0, 0);
    spawnBuildingEntity(world, BuildingTypeId.Barracks, F, 10, 0);
    for (const eid of query(world, [Building])) syncBuildingPopulationCap(world, eid);
    for (let i = 0; i < 6; i++) {
      spawnBasicUnit(world, UnitTypeId.Heavy, F, i, 0, 5, STATS);
      playerState.addPopulation(F, getUnitPopulationCost(F, UnitTypeId.Heavy));
    }
    // Old rules: cap 10 + 10 + 5 = 25, pop 6 -> 19 free.
    grantMissionStartingCapBonus(world);
    expect(playerState.getPopulationMax(F) - playerState.getPopulation(F)).toBe(19);
  });
});

describe('queue-time room check uses the real unit cost', () => {
  it('a Siege that does not fit is rejected and not charged', () => {
    const world = replaceWorld();
    const F = FactionId.Brabanders;
    const shop = spawnBuildingEntity(world, BuildingTypeId.SiegeWorkshop, F, 0, 0);
    playerState.addGold(F, 10_000);
    playerState.addWood(F, 10_000);
    playerState.addPopulation(F, playerState.getPopulationMax(F) - 1); // 1 slot free
    const gold = playerState.getGold(F);
    expect(getUnitPopulationCost(F, UnitTypeId.Siege)).toBeGreaterThan(1);

    queueCommand({ type: 'train', buildingEid: shop, unitTypeId: UnitTypeId.Siege, cost: 0 });
    createCommandSystem()(world, 0.016);

    expect(Production.unitType[shop]).toBe(NO_PRODUCTION);
    expect(playerState.getGold(F)).toBe(gold);
  });

  it('a Worker still queues with 1 slot free', () => {
    const world = replaceWorld();
    const F = FactionId.Brabanders;
    const th = spawnBuildingEntity(world, BuildingTypeId.TownHall, F, 0, 0);
    playerState.addGold(F, 10_000);
    playerState.addPopulation(F, playerState.getPopulationMax(F) - 1);
    queueCommand({ type: 'train', buildingEid: th, unitTypeId: UnitTypeId.Worker, cost: 0 });
    createCommandSystem()(world, 0.016);
    expect(Production.unitType[th]).toBe(UnitTypeId.Worker);
  });
});

describe('transferOwnership moves exactly the granted cap', () => {
  it('a captured barracks moves no cap', () => {
    const world = replaceWorld();
    const eid = spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, 0, 0);
    syncBuildingPopulationCap(world, eid);
    const brab = playerState.getPopulationMax(FactionId.Brabanders);
    const rand = playerState.getPopulationMax(FactionId.Randstad);
    transferOwnership(world, eid, FactionId.Randstad);
    expect(playerState.getPopulationMax(FactionId.Brabanders)).toBe(brab);
    expect(playerState.getPopulationMax(FactionId.Randstad)).toBe(rand);
  });

  it('a captured housing moves its cap; destroying it later revokes from the new owner only', () => {
    const world = replaceWorld();
    const eid = spawnBuildingEntity(world, BuildingTypeId.Housing, FactionId.Brabanders, 0, 0);
    syncBuildingPopulationCap(world, eid);
    const provided = BUILDING_ARCHETYPES[BuildingTypeId.Housing].populationProvided!;
    const brab = playerState.getPopulationMax(FactionId.Brabanders);
    const rand = playerState.getPopulationMax(FactionId.Randstad);
    transferOwnership(world, eid, FactionId.Randstad);
    expect(Faction.id[eid]).toBe(FactionId.Randstad);
    expect(playerState.getPopulationMax(FactionId.Brabanders)).toBe(brab - provided);
    expect(playerState.getPopulationMax(FactionId.Randstad)).toBe(rand + provided);

    Building.complete[eid] = 0; // e.g. destroyed/removed path -> revoke
    syncBuildingPopulationCap(world, eid);
    expect(playerState.getPopulationMax(FactionId.Brabanders)).toBe(brab - provided);
    expect(playerState.getPopulationMax(FactionId.Randstad)).toBe(rand);
  });
});
