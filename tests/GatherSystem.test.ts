/**
 * GatherSystem.test.ts -- Locks the worker resource-gathering loop.
 *
 * Audit context: full-playthrough audit Fase 3 stappen 10-11 — workers
 * gather wood/gold (right-click → travel → harvest → deposit → repeat).
 * Pre-audit there was zero direct test coverage of GatherSystem despite
 * it being the heart of the economy. This file fills that gap.
 *
 * State machine under test:
 *   NONE (0)
 *     → MOVING_TO_RESOURCE (1)  -- once a target is assigned
 *     → GATHERING (2)            -- on arrival within GATHER_ARRIVAL_DISTANCE
 *     → RETURNING (3)            -- when carrying == capacity
 *     → MOVING_TO_RESOURCE       -- after deposit, auto-resume same resource
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, Movement, Gatherer, Resource, Building,
} from '../src/ecs/components';
import {
  IsUnit, IsWorker, IsBuilding, IsResource,
} from '../src/ecs/tags';
import { createGatherSystem } from '../src/systems/GatherSystem';
import { playerState } from '../src/core/PlayerState';
import {
  FactionId, BuildingTypeId, ResourceType,
  HARVEST_RATE, CARRY_CAPACITY,
  GATHER_ARRIVAL_DISTANCE, DEPOSIT_ARRIVAL_DISTANCE,
  DIMINISHING_RETURNS_THRESHOLD, DIMINISHING_RETURNS_GATHER_MULT,
  NO_ENTITY,
} from '../src/types/index';

const GATHER_NONE = 0;
const GATHER_MOVING = 1;
const GATHER_GATHERING = 2;
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
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = faction;
  Movement.speed[eid] = 4;
  Gatherer.state[eid] = GATHER_NONE;
  Gatherer.targetEid[eid] = NO_ENTITY;
  Gatherer.carrying[eid] = 0;
  Gatherer.carryCapacity[eid] = CARRY_CAPACITY;
  Gatherer.resourceType[eid] = ResourceType.Gold;
  return eid;
}

function spawnResource(world: World, x: number, z: number, type: number, amount: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Resource);
  addComponent(world, eid, IsResource);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Resource.type[eid] = type;
  Resource.amount[eid] = amount;
  Resource.maxAmount[eid] = amount;
  return eid;
}

function spawnBuilding(world: World, x: number, z: number, typeId: number, faction = FactionId.Brabanders, complete = true): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = faction;
  Building.typeId[eid] = typeId;
  Building.complete[eid] = complete ? 1 : 0;
  return eid;
}

function assignGather(world: World, worker: number, resource: number): void {
  Gatherer.targetEid[worker] = resource;
  Gatherer.resourceType[worker] = Resource.type[resource];
  Gatherer.state[worker] = GATHER_MOVING;
  Movement.targetX[worker] = Position.x[resource];
  Movement.targetZ[worker] = Position.z[resource];
  Movement.hasTarget[worker] = 1;
}

const tick = (world: World, dt: number) => createGatherSystem()(world, dt);

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

describe('GatherSystem — state transitions', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); });

  it('idle workers (state=NONE) are skipped (no state change)', () => {
    const world = replaceWorld();
    const worker = spawnWorker(world, 0, 0);
    tick(world, 1.0);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
  });

  it('MOVING_TO_RESOURCE → GATHERING when within arrival distance', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 100);
    // Place worker JUST inside the arrival radius
    const worker = spawnWorker(world, 0.5, 0.5);
    assignGather(world, worker, gold);
    tick(world, 0.01);
    expect(Gatherer.state[worker]).toBe(GATHER_GATHERING);
    expect(Movement.hasTarget[worker]).toBe(0); // movement halted
  });

  it('MOVING_TO_RESOURCE stays MOVING when farther than arrival distance', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 100);
    const worker = spawnWorker(world, GATHER_ARRIVAL_DISTANCE + 1, 0);
    assignGather(world, worker, gold);
    tick(world, 0.01);
    expect(Gatherer.state[worker]).toBe(GATHER_MOVING);
  });

  it('GATHERING → RETURNING when carrying reaches capacity', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 100);
    spawnBuilding(world, 30, 0, BuildingTypeId.TownHall);
    const worker = spawnWorker(world, 0.5, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    Gatherer.carrying[worker] = CARRY_CAPACITY - 0.5; // almost full
    tick(world, 1.0); // 1s at HARVEST_RATE=2 fills the rest and overflows
    expect(Gatherer.state[worker]).toBe(GATHER_RETURNING);
    expect(Gatherer.carrying[worker]).toBeLessThanOrEqual(CARRY_CAPACITY);
  });
});

// ---------------------------------------------------------------------------
// Harvesting math
// ---------------------------------------------------------------------------

describe('GatherSystem — harvesting math', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); });

  it('carries HARVEST_RATE per second', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 100);
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    tick(world, 1.0);
    expect(Gatherer.carrying[worker]).toBeCloseTo(HARVEST_RATE, 2);
  });

  it('decrements resource amount by exactly what was carried', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 100);
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    tick(world, 0.5);
    const carried = Gatherer.carrying[worker];
    expect(Resource.amount[gold]).toBeCloseTo(100 - carried, 3);
  });

  it('respects carry capacity — cannot carry more than CARRY_CAPACITY', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 1000);
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    tick(world, 999); // way more than needed to fill
    expect(Gatherer.carrying[worker]).toBeLessThanOrEqual(CARRY_CAPACITY);
  });

  it('applies diminishing returns when resource < threshold', () => {
    const world = replaceWorld();
    // Resource at <25% of max: amount=20, max=100
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 20);
    Resource.maxAmount[gold] = 100;
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    tick(world, 1.0);
    const expected = HARVEST_RATE * DIMINISHING_RETURNS_GATHER_MULT;
    expect(Gatherer.carrying[worker]).toBeCloseTo(expected, 2);
  });

  it('does NOT apply diminishing returns when resource is fresh', () => {
    const world = replaceWorld();
    // Resource at 80% — well above threshold
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 80);
    Resource.maxAmount[gold] = 100;
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    tick(world, 1.0);
    expect(Gatherer.carrying[worker]).toBeCloseTo(HARVEST_RATE, 2);
  });
});

// ---------------------------------------------------------------------------
// Resource exhaustion / disappearance
// ---------------------------------------------------------------------------

describe('GatherSystem — resource exhaustion', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); });

  it('depleted-while-gathering with carry → starts RETURNING (not idle)', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 0.1);
    spawnBuilding(world, 30, 0, BuildingTypeId.TownHall);
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    Gatherer.carrying[worker] = 5;
    tick(world, 1.0); // depletes the 0.1
    expect(Gatherer.state[worker]).toBe(GATHER_RETURNING);
  });

  it('arrives at already-empty resource with no carry → looks for another resource of same type', () => {
    // Realistic case: resource was emptied by another worker before arrival.
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 0); // empty
    const otherGold = spawnResource(world, 25, 25, ResourceType.Gold, 100);
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    Gatherer.carrying[worker] = 0;
    tick(world, 1.0);
    expect(Gatherer.state[worker]).toBe(GATHER_MOVING);
    expect(Gatherer.targetEid[worker]).toBe(otherGold);
  });

  it('depletes-while-gathering with even tiny carry → returns to deposit (not idle)', () => {
    // Documents the edge: any non-zero carry routes to deposit, even dust
    // gathered from the very last bit of a node.
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 0.05);
    spawnBuilding(world, 30, 0, BuildingTypeId.TownHall);
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    Gatherer.carrying[worker] = 0;
    tick(world, 1.0); // harvests the 0.05 → carry=0.05 → triggers RETURNING
    expect(Gatherer.state[worker]).toBe(GATHER_RETURNING);
  });

  it('all resources depleted with no carry → goes idle (state NONE)', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 0);
    const worker = spawnWorker(world, 0, 0);
    assignGather(world, worker, gold);
    Gatherer.state[worker] = GATHER_GATHERING;
    Gatherer.carrying[worker] = 0;
    tick(world, 1.0);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
  });
});

// ---------------------------------------------------------------------------
// Deposit logic — gold to TownHall, wood prefers LumberCamp
// ---------------------------------------------------------------------------

describe('GatherSystem — deposit routing', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); });

  it('gold deposit at TownHall adds to player gold and resets carry', () => {
    const world = replaceWorld();
    const townHall = spawnBuilding(world, 0, 0, BuildingTypeId.TownHall);
    const worker = spawnWorker(world, 1, 0); // within deposit radius
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 8;
    Gatherer.resourceType[worker] = ResourceType.Gold;
    Gatherer.targetEid[worker] = NO_ENTITY;
    const before = playerState.getGold(FactionId.Brabanders);
    tick(world, 0.01);
    expect(playerState.getGold(FactionId.Brabanders)).toBe(before + 8);
    expect(Gatherer.carrying[worker]).toBe(0);
    void townHall;
  });

  it('wood deposit prefers LumberCamp over TownHall when both exist', () => {
    const world = replaceWorld();
    spawnBuilding(world, 0, 0, BuildingTypeId.TownHall);
    const lumberCamp = spawnBuilding(world, 5, 5, BuildingTypeId.LumberCamp);
    const worker = spawnWorker(world, 5, 4); // closer to lumber camp
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 8;
    Gatherer.resourceType[worker] = ResourceType.Wood;
    Gatherer.targetEid[worker] = NO_ENTITY;
    tick(world, 0.01);
    // Worker arrives within DEPOSIT_ARRIVAL_DISTANCE of lumber camp at (5, 5)
    // and from (5, 4) the distance is 1 — well inside DEPOSIT_ARRIVAL_DISTANCE
    expect(Gatherer.carrying[worker]).toBe(0);
    void lumberCamp;
  });

  it('wood falls back to TownHall when no LumberCamp exists', () => {
    const world = replaceWorld();
    spawnBuilding(world, 0, 0, BuildingTypeId.TownHall);
    const worker = spawnWorker(world, 1, 0);
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 6;
    Gatherer.resourceType[worker] = ResourceType.Wood;
    const before = playerState.getWood(FactionId.Brabanders);
    tick(world, 0.01);
    expect(playerState.getWood(FactionId.Brabanders)).toBe(before + 6);
  });

  it('no deposit building of own faction → state NONE', () => {
    const world = replaceWorld();
    // Enemy TownHall — should NOT be used as deposit
    spawnBuilding(world, 0, 0, BuildingTypeId.TownHall, FactionId.Randstad);
    const worker = spawnWorker(world, 0, 0, FactionId.Brabanders);
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 5;
    tick(world, 0.01);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
  });

  it('incomplete TownHall is NOT a valid deposit target (must be complete)', () => {
    const world = replaceWorld();
    spawnBuilding(world, 0, 0, BuildingTypeId.TownHall, FactionId.Brabanders, /*complete*/ false);
    const worker = spawnWorker(world, 1, 0);
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 5;
    tick(world, 0.01);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
  });

  it('after deposit, worker auto-returns to the same resource if not depleted', () => {
    const world = replaceWorld();
    spawnBuilding(world, 0, 0, BuildingTypeId.TownHall);
    const gold = spawnResource(world, 30, 0, ResourceType.Gold, 100);
    const worker = spawnWorker(world, 1, 0);
    Gatherer.state[worker] = GATHER_RETURNING;
    Gatherer.carrying[worker] = 8;
    Gatherer.resourceType[worker] = ResourceType.Gold;
    Gatherer.targetEid[worker] = gold;
    tick(world, 0.01);
    expect(Gatherer.state[worker]).toBe(GATHER_MOVING);
    expect(Gatherer.targetEid[worker]).toBe(gold);
  });
});

// ---------------------------------------------------------------------------
// End-to-end: multi-tick gather → deposit → resume
// ---------------------------------------------------------------------------

describe('GatherSystem — full round-trip simulation', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); });

  it('worker starts adjacent to gold, fills capacity, deposits, has +CARRY_CAPACITY gold', () => {
    const world = replaceWorld();
    const gold = spawnResource(world, 0, 0, ResourceType.Gold, 100);
    spawnBuilding(world, 1.5, 0, BuildingTypeId.TownHall);
    const worker = spawnWorker(world, 0.5, 0);
    assignGather(world, worker, gold);
    const start = playerState.getGold(FactionId.Brabanders);

    // Frame 1: arrival → GATHERING
    tick(world, 0.01);
    expect(Gatherer.state[worker]).toBe(GATHER_GATHERING);

    // Frames 2..: harvest until full
    // CARRY_CAPACITY=10 / HARVEST_RATE=2 = 5 seconds of gathering
    for (let i = 0; i < 600; i++) tick(world, 0.01);

    // Move worker manually to deposit position (no movement system in test)
    Position.x[worker] = 1.5;
    Position.z[worker] = 0;

    // One more tick → deposit
    tick(world, 0.01);

    expect(playerState.getGold(FactionId.Brabanders)).toBe(start + CARRY_CAPACITY);
  });
});
