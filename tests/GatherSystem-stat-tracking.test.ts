/**
 * GatherSystem — gathered-stat tracking
 *
 * Live-bug v0.37.36 (Richard 2026-04-28):
 *   "Goud 0" op victory screen na een succesvolle Randstad-skirmish met
 *   actieve gold/wood-economie. Root cause: `Game.stats.resourcesGathered`
 *   werd geïnitialiseerd op 0 maar nooit geïncrementeerd; de end-match
 *   render gebruikt het rauwe stats-object.
 *
 * Fix: PlayerState heeft nu `recordGoldGathered` / `recordWoodGathered` die
 * naast de saldo-update een cumulative counter bijwerken. GatherSystem
 * gebruikt deze (niet meer `addGold/addWood`) op deposit-arrival, zodat
 * refunds (CommandSystem) en mission-grants (Game.startMission) niet
 * meetellen in de stat. Game.endMatch leest `getGoldGathered + getWoodGathered`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, Movement, Gatherer, Building,
} from '../src/ecs/components';
import {
  IsUnit, IsWorker, IsBuilding,
} from '../src/ecs/tags';
import { createGatherSystem } from '../src/systems/GatherSystem';
import { playerState } from '../src/core/PlayerState';
import {
  FactionId, BuildingTypeId, ResourceType, NO_ENTITY,
} from '../src/types/index';

const GATHER_RETURNING = 3;

type World = ReturnType<typeof replaceWorld>;

function spawnWorker(world: World, x: number, z: number, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, Gatherer);
  addComponent(world, eid, IsUnit);
  addComponent(world, eid, IsWorker);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Movement.speed[eid] = 4;
  Gatherer.targetEid[eid] = NO_ENTITY;
  Gatherer.resourceType[eid] = ResourceType.Gold;
  Gatherer.carrying[eid] = 0;
  Gatherer.carryCapacity[eid] = 10;
  Gatherer.state[eid] = 0;
  return eid;
}

function spawnTownHall(world: World, x: number, z: number, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Building.typeId[eid] = BuildingTypeId.TownHall;
  Building.complete[eid] = 1;
  return eid;
}

const tickSystem = createGatherSystem();
function tick(world: World, dt: number) { tickSystem(world, dt); }

describe('GatherSystem — gathered-stat tracking', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); });

  it('initial getGoldGathered / getWoodGathered are 0', () => {
    expect(playerState.getGoldGathered(FactionId.Brabanders)).toBe(0);
    expect(playerState.getWoodGathered(FactionId.Brabanders)).toBe(0);
  });

  it('gold drop-off increments goldGathered, not woodGathered', () => {
    const world = replaceWorld();
    spawnTownHall(world, 0, 0);
    const worker = spawnWorker(world, 1, 0);
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 8;
    Gatherer.resourceType[worker] = ResourceType.Gold;

    tick(world, 0.01);

    expect(playerState.getGoldGathered(FactionId.Brabanders)).toBe(8);
    expect(playerState.getWoodGathered(FactionId.Brabanders)).toBe(0);
  });

  it('wood drop-off increments woodGathered, not goldGathered', () => {
    const world = replaceWorld();
    spawnTownHall(world, 0, 0);
    const worker = spawnWorker(world, 1, 0);
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 5;
    Gatherer.resourceType[worker] = ResourceType.Wood;

    tick(world, 0.01);

    expect(playerState.getWoodGathered(FactionId.Brabanders)).toBe(5);
    expect(playerState.getGoldGathered(FactionId.Brabanders)).toBe(0);
  });

  it('multiple drop-offs accumulate', () => {
    const world = replaceWorld();
    spawnTownHall(world, 0, 0);
    const w1 = spawnWorker(world, 1, 0);
    const w2 = spawnWorker(world, 0, 1);
    Gatherer.state[w1] = GATHER_RETURNING; Gatherer.carrying[w1] = 8;
    Gatherer.state[w2] = GATHER_RETURNING; Gatherer.carrying[w2] = 6;
    Gatherer.resourceType[w1] = ResourceType.Gold;
    Gatherer.resourceType[w2] = ResourceType.Gold;

    tick(world, 0.01);

    expect(playerState.getGoldGathered(FactionId.Brabanders)).toBe(14);
  });

  it('refund via addGold does NOT count as gathered', () => {
    playerState.addGold(FactionId.Brabanders, 200);
    expect(playerState.getGold(FactionId.Brabanders)).toBe(300); // 100 start + 200 refund
    expect(playerState.getGoldGathered(FactionId.Brabanders)).toBe(0);
  });

  it('per-faction isolation — Brabant deposit doesn\'t leak to Randstad stat', () => {
    const world = replaceWorld();
    spawnTownHall(world, 0, 0, FactionId.Brabanders);
    const worker = spawnWorker(world, 1, 0, FactionId.Brabanders);
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 7;
    Gatherer.resourceType[worker] = ResourceType.Gold;

    tick(world, 0.01);

    expect(playerState.getGoldGathered(FactionId.Brabanders)).toBe(7);
    expect(playerState.getGoldGathered(FactionId.Randstad)).toBe(0);
  });

  it('reset() zeroes both counters', () => {
    playerState.recordGoldGathered(FactionId.Belgen, 100);
    playerState.recordWoodGathered(FactionId.Belgen, 50);
    playerState.reset();
    expect(playerState.getGoldGathered(FactionId.Belgen)).toBe(0);
    expect(playerState.getWoodGathered(FactionId.Belgen)).toBe(0);
  });
});
