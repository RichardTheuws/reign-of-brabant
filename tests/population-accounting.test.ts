/**
 * population-accounting.test.ts -- population current/cap must never drift.
 *
 * Confirmed bugs (audit 2026-10-16):
 *  1. ProductionSystem checked room for 1 and added 1 per trained unit, while
 *     Heavy/Siege cost 2-4 and DeathSystem subtracted the full PopulationCost.
 *     Summons cost 0 but DeathSystem used `cost || 1`, so an expiring militia
 *     subtracted 1 it never added.
 *  2. Population cap was granted at placement (also for buildings still under
 *     construction), never returned for a Housing destroyed before completion,
 *     and every building without populationProvided (barracks, towers) gave +5.
 *
 * Invariant locked here: populationCurrent === sum(PopulationCost) over living
 * units, populationMax === base + sum(populationProvided) over living,
 * completed buildings.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addComponent, query, hasComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Building, Faction, PopulationCost, Production } from '../src/ecs/components';
import { IsBuilding, IsDead, IsUnit } from '../src/ecs/tags';
import { createProductionSystem } from '../src/systems/ProductionSystem';
import { createDeathSystem } from '../src/systems/DeathSystem';
import { createPopulationSystem, resetPopulationSystem, syncBuildingPopulationCap } from '../src/systems/PopulationSystem';
import { spawnBuildingEntity } from '../src/entities/buildingSpawn';
import { createMilitia } from '../src/entities/heroFactory';
import { BUILDING_ARCHETYPES } from '../src/entities/archetypes';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import {
  FactionId, BuildingTypeId, UnitTypeId, DEATH_TIMER,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const F = FactionId.Brabanders;
const BASE_CAP = 10; // PlayerState.reset() starting cap

function livingPopSum(world: World, faction = F): number {
  let sum = 0;
  for (const eid of query(world, [IsUnit, Faction])) {
    if (Faction.id[eid] !== faction) continue;
    if (hasComponent(world, eid, IsDead)) continue;
    sum += hasComponent(world, eid, PopulationCost) ? PopulationCost.cost[eid] : 1;
  }
  return sum;
}

function expectedCap(world: World, faction = F): number {
  let cap = BASE_CAP;
  for (const eid of query(world, [IsBuilding, Building, Faction])) {
    if (Faction.id[eid] !== faction) continue;
    if (hasComponent(world, eid, IsDead)) continue;
    if (Building.complete[eid] !== 1) continue;
    cap += BUILDING_ARCHETYPES[Building.typeId[eid]]?.populationProvided ?? 0;
  }
  return cap;
}

function train(world: World, bEid: number, unitType: UnitTypeId): void {
  Production.unitType[bEid] = unitType;
  Production.progress[bEid] = 0;
  Production.duration[bEid] = 1;
  createProductionSystem()(world, 1.01);
}

const death = createDeathSystem();
const population = createPopulationSystem();

/** Tag dead and run DeathSystem until the entity is removed. */
function kill(world: World, eid: number): void {
  addComponent(world, eid, IsDead);
  population(world, 0.016);
  death(world, 0.016);
  death(world, DEATH_TIMER + 0.1);
}

beforeEach(() => {
  playerState.reset();
  eventBus.clear();
  resetPopulationSystem();
});

describe('unit population cost: train + death', () => {
  it('heavy/siege add and remove their real population cost', () => {
    const world = replaceWorld();
    playerState.addPopulationCapacity(F, 50);
    const shop = spawnBuildingEntity(world, BuildingTypeId.SiegeWorkshop, F, 0, 0);

    train(world, shop, UnitTypeId.Heavy);
    train(world, shop, UnitTypeId.Siege);
    train(world, shop, UnitTypeId.Infantry);
    const units = query(world, [IsUnit]).slice();
    expect(units.length).toBe(3);
    expect(livingPopSum(world)).toBeGreaterThan(3); // heavy/siege cost > 1
    expect(playerState.getPopulation(F)).toBe(livingPopSum(world));

    for (const eid of units) {
      kill(world, eid);
      expect(playerState.getPopulation(F)).toBe(livingPopSum(world));
    }
    expect(playerState.getPopulation(F)).toBe(0);
  });

  it('holds production when the unit cost does not fit the remaining room', () => {
    const world = replaceWorld();
    const shop = spawnBuildingEntity(world, BuildingTypeId.SiegeWorkshop, F, 0, 0);
    playerState.addPopulation(F, BASE_CAP - 1); // 1 slot free, heavy needs 2
    train(world, shop, UnitTypeId.Heavy);
    expect(query(world, [IsUnit]).length).toBe(0);
    expect(playerState.getPopulation(F)).toBe(BASE_CAP - 1);
    expect(Production.progress[shop]).toBe(1);
  });

  it('an expiring summon (cost 0) does not subtract population', () => {
    const world = replaceWorld();
    const shop = spawnBuildingEntity(world, BuildingTypeId.Barracks, F, 0, 0);
    train(world, shop, UnitTypeId.Infantry);
    expect(playerState.getPopulation(F)).toBe(1);
    const militia = createMilitia(world, F, 5, 5, 30);
    kill(world, militia);
    expect(playerState.getPopulation(F)).toBe(1);
    expect(playerState.getPopulation(F)).toBe(livingPopSum(world));
  });
});

describe('population cap from buildings', () => {
  it('housing destroyed under construction leaves no cap behind', () => {
    const world = replaceWorld();
    const house = spawnBuildingEntity(world, BuildingTypeId.Housing, F, 0, 0);
    Building.complete[house] = 0;
    Building.progress[house] = 0;
    syncBuildingPopulationCap(world, house);
    population(world, 0.016);
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP);
    kill(world, house);
    population(world, 0.016);
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP);
  });

  it('cap is granted on completion and removed exactly once on destruction', () => {
    const world = replaceWorld();
    const house = spawnBuildingEntity(world, BuildingTypeId.Housing, F, 0, 0);
    Building.complete[house] = 0;
    syncBuildingPopulationCap(world, house);
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP);

    Building.complete[house] = 1; // BuildSystem completion
    syncBuildingPopulationCap(world, house);
    syncBuildingPopulationCap(world, house); // idempotent
    population(world, 0.016);
    const provided = BUILDING_ARCHETYPES[BuildingTypeId.Housing].populationProvided!;
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP + provided);

    kill(world, house);
    population(world, 0.016);
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP);
  });

  it('barracks / tower give no cap; town hall and housing keep their values', () => {
    const world = replaceWorld();
    const barracks = spawnBuildingEntity(world, BuildingTypeId.Barracks, F, 0, 0);
    const tower = spawnBuildingEntity(world, BuildingTypeId.DefenseTower, F, 10, 0);
    population(world, 0.016);
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP);

    const th = spawnBuildingEntity(world, BuildingTypeId.TownHall, F, 20, 0);
    population(world, 0.016);
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP + 10);

    kill(world, barracks);
    kill(world, tower);
    population(world, 0.016);
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP + 10);
    expect(playerState.getPopulationMax(F)).toBe(expectedCap(world));
    void th;
  });

  it('pre-placed completed buildings grant cap immediately at match start', () => {
    const world = replaceWorld();
    const th = spawnBuildingEntity(world, BuildingTypeId.TownHall, F, 0, 0);
    syncBuildingPopulationCap(world, th); // Game.createBuildingEntity path
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP + 10);
    population(world, 0.016); // sweep does not double-grant
    expect(playerState.getPopulationMax(F)).toBe(BASE_CAP + 10);
  });
});

describe('invariant: scripted train / die / build / destroy sequence', () => {
  it('population == sum of living popCost and cap == base + completed providers', () => {
    const world = replaceWorld();
    const th = spawnBuildingEntity(world, BuildingTypeId.TownHall, F, 0, 0);
    syncBuildingPopulationCap(world, th);
    const shop = spawnBuildingEntity(world, BuildingTypeId.SiegeWorkshop, F, 10, 0);
    const check = () => {
      population(world, 0.016);
      expect(playerState.getPopulation(F)).toBe(livingPopSum(world));
      expect(playerState.getPopulationMax(F)).toBe(expectedCap(world));
    };
    check();

    train(world, th, UnitTypeId.Worker);
    train(world, shop, UnitTypeId.Heavy);
    train(world, shop, UnitTypeId.Siege);
    check();

    const house = spawnBuildingEntity(world, BuildingTypeId.Housing, F, 20, 0);
    Building.complete[house] = 0;
    syncBuildingPopulationCap(world, house);
    check();
    Building.complete[house] = 1;
    check();

    const [worker, heavy] = query(world, [IsUnit]).slice();
    kill(world, heavy);
    check();
    createMilitia(world, F, 3, 3, 30);
    check();
    kill(world, house);
    check();
    kill(world, worker);
    check();
  });
});
