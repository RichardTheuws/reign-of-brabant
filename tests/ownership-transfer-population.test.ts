/**
 * ownership-transfer-population.test.ts -- conversions must move population
 *
 * Persuasion (Belgen), the Frietkoning decree and building captures used to
 * flip Faction.id only. The original owner kept the population / military
 * count (or pop-capacity, for buildings) and a later death was subtracted from
 * the new owner. transferOwnership() moves those counters with the entity.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Health, Faction, UnitType, PopulationCost, Building,
} from '../src/ecs/components';
import { IsUnit, IsBuilding } from '../src/ecs/tags';
import {
  createDiplomacySystem, persuadeUnit, resetDiplomacy, transferOwnership,
} from '../src/systems/DiplomacySystem';
import { BUILDING_ARCHETYPES } from '../src/entities/archetypes';
import { syncBuildingPopulationCap, resetPopulationSystem } from '../src/systems/PopulationSystem';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import { FactionId, UnitTypeId, BuildingTypeId } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnUnit(world: World, faction: number, type: UnitTypeId, pop: number): number {
  const eid = addEntity(world);
  [Position, Health, Faction, UnitType, PopulationCost, IsUnit].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  UnitType.id[eid] = type;
  PopulationCost.cost[eid] = pop;
  Health.current[eid] = 100; Health.max[eid] = 100;
  playerState.addPopulation(faction, pop);
  if (type !== UnitTypeId.Worker) playerState.addMilitaryUnit(faction);
  return eid;
}

beforeEach(() => {
  eventBus.clear();
  resetDiplomacy();
  resetPopulationSystem();
  playerState.reset();
});

describe('transferOwnership — units', () => {
  it('moves the unit\'s real popCost and military count to the new owner', () => {
    const world = replaceWorld();
    const eid = spawnUnit(world, FactionId.Randstad, UnitTypeId.Infantry, 2);
    const randPop = playerState.getPopulation(FactionId.Randstad);
    const randMil = playerState.getMilitaryCount(FactionId.Randstad);
    const belgPop = playerState.getPopulation(FactionId.Belgen);
    const belgMil = playerState.getMilitaryCount(FactionId.Belgen);

    transferOwnership(world, eid, FactionId.Belgen);

    expect(Faction.id[eid]).toBe(FactionId.Belgen);
    expect(playerState.getPopulation(FactionId.Randstad)).toBe(randPop - 2);
    expect(playerState.getMilitaryCount(FactionId.Randstad)).toBe(randMil - 1);
    expect(playerState.getPopulation(FactionId.Belgen)).toBe(belgPop + 2);
    expect(playerState.getMilitaryCount(FactionId.Belgen)).toBe(belgMil + 1);
  });

  it('workers move population but not the military count', () => {
    const world = replaceWorld();
    const eid = spawnUnit(world, FactionId.Brabanders, UnitTypeId.Worker, 1);
    transferOwnership(world, eid, FactionId.Belgen);
    expect(playerState.getPopulation(FactionId.Brabanders)).toBe(0);
    expect(playerState.getPopulation(FactionId.Belgen)).toBe(1);
    expect(playerState.getMilitaryCount(FactionId.Belgen)).toBe(0);
  });

  it('allows pop-cap overflow for converted units but still counts them', () => {
    const world = replaceWorld();
    const max = playerState.getPopulationMax(FactionId.Belgen);
    playerState.addPopulation(FactionId.Belgen, max); // Belgen are full
    const eid = spawnUnit(world, FactionId.Randstad, UnitTypeId.Infantry, 1);
    transferOwnership(world, eid, FactionId.Belgen);
    expect(Faction.id[eid]).toBe(FactionId.Belgen);
    expect(playerState.getPopulation(FactionId.Belgen)).toBe(max + 1);
  });

  it('is a no-op when the owner does not change', () => {
    const world = replaceWorld();
    const eid = spawnUnit(world, FactionId.Belgen, UnitTypeId.Infantry, 1);
    transferOwnership(world, eid, FactionId.Belgen);
    expect(playerState.getPopulation(FactionId.Belgen)).toBe(1);
    expect(playerState.getMilitaryCount(FactionId.Belgen)).toBe(1);
  });
});

describe('persuadeUnit — population follows the unit both ways', () => {
  it('persuasion moves pop to Belgen, the timed return moves it back', () => {
    const world = replaceWorld();
    const sys = createDiplomacySystem();
    sys(world, 0);
    playerState.addTertiary(FactionId.Belgen, 500);

    const eid = spawnUnit(world, FactionId.Randstad, UnitTypeId.Infantry, 1);
    expect(persuadeUnit(world, eid)).toBe(true);
    expect(playerState.getPopulation(FactionId.Randstad)).toBe(0);
    expect(playerState.getMilitaryCount(FactionId.Randstad)).toBe(0);
    expect(playerState.getPopulation(FactionId.Belgen)).toBe(1);
    expect(playerState.getMilitaryCount(FactionId.Belgen)).toBe(1);

    world.meta.elapsed += 10_000; // far past any persuasion duration
    sys(world, 0.016);

    expect(Faction.id[eid]).toBe(FactionId.Randstad);
    expect(playerState.getPopulation(FactionId.Randstad)).toBe(1);
    expect(playerState.getMilitaryCount(FactionId.Randstad)).toBe(1);
    expect(playerState.getPopulation(FactionId.Belgen)).toBe(0);
    expect(playerState.getMilitaryCount(FactionId.Belgen)).toBe(0);
  });
});

describe('transferOwnership — buildings', () => {
  it('a captured completed housing moves its pop-capacity', () => {
    const world = replaceWorld();
    const eid = addEntity(world);
    [Position, Health, Faction, Building, IsBuilding].forEach(c => addComponent(world, eid, c));
    Faction.id[eid] = FactionId.Brabanders;
    Building.typeId[eid] = BuildingTypeId.Housing;
    Building.complete[eid] = 1;
    syncBuildingPopulationCap(world, eid); // completion grants the cap
    const provided = BUILDING_ARCHETYPES[BuildingTypeId.Housing].populationProvided ?? 5;
    const brabMax = playerState.getPopulationMax(FactionId.Brabanders);
    const randMax = playerState.getPopulationMax(FactionId.Randstad);

    transferOwnership(world, eid, FactionId.Randstad);

    expect(Faction.id[eid]).toBe(FactionId.Randstad);
    expect(playerState.getPopulationMax(FactionId.Brabanders)).toBe(brabMax - provided);
    expect(playerState.getPopulationMax(FactionId.Randstad)).toBe(randMax + provided);
  });
});
