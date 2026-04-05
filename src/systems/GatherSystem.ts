/**
 * Reign of Brabant -- Gather System
 *
 * Manages the worker resource gathering loop:
 *   MOVING_TO_RESOURCE -> GATHERING -> RETURNING -> (repeat)
 *
 * Workers harvest gold from mines, carry up to carryCapacity (10),
 * return to nearest town hall to deposit, then auto-return to the mine.
 */

import { query, hasComponent, entityExists, addComponent } from 'bitecs';
import {
  Position,
  Gatherer,
  Resource,
  Movement,
  Faction,
  Building,
  Health,
} from '../ecs/components';
import { IsWorker, IsBuilding, IsResource, IsDead, NeedsPathfinding } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import {
  UnitAIState,
  HARVEST_RATE,
  CARRY_CAPACITY,
  GATHER_ARRIVAL_DISTANCE,
  DEPOSIT_ARRIVAL_DISTANCE,
  NO_ENTITY,
  BuildingTypeId,
} from '../types/index';
import type { GameWorld } from '../ecs/world';

// Gather states (matches Gatherer.state u8 values)
const GATHER_NONE = 0;
const GATHER_MOVING_TO_RESOURCE = 1;
const GATHER_GATHERING = 2;
const GATHER_RETURNING = 3;

/**
 * Create the gather system.
 */
export function createGatherSystem() {
  return function gatherSystem(world: GameWorld, dt: number): void {
    const workers = query(world, [Position, Gatherer, IsWorker]);

    for (const eid of workers) {
      const state = Gatherer.state[eid];
      if (state === GATHER_NONE) continue;

      switch (state) {
        case GATHER_MOVING_TO_RESOURCE:
          processMovingToResource(world, eid);
          break;
        case GATHER_GATHERING:
          processGathering(world, eid, dt);
          break;
        case GATHER_RETURNING:
          processReturning(world, eid);
          break;
      }
    }
  };
}

// ---------------------------------------------------------------------------
// State handlers
// ---------------------------------------------------------------------------

function processMovingToResource(world: GameWorld, eid: number): void {
  const targetEid = Gatherer.targetEid[eid];

  // Resource gone or depleted
  if (
    targetEid === NO_ENTITY ||
    !entityExists(world, targetEid) ||
    hasComponent(world, targetEid, IsDead) ||
    Resource.amount[targetEid] <= 0
  ) {
    findNearestMineOrIdle(world, eid);
    return;
  }

  // Check if arrived at resource
  const dx = Position.x[targetEid] - Position.x[eid];
  const dz = Position.z[targetEid] - Position.z[eid];
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < GATHER_ARRIVAL_DISTANCE) {
    // Start gathering -- stop movement
    Gatherer.state[eid] = GATHER_GATHERING;
    Movement.hasTarget[eid] = 0;
  }
}

function processGathering(world: GameWorld, eid: number, dt: number): void {
  const targetEid = Gatherer.targetEid[eid];

  // Resource gone
  if (
    targetEid === NO_ENTITY ||
    !entityExists(world, targetEid) ||
    Resource.amount[targetEid] <= 0
  ) {
    // If carrying something, go deposit first
    if (Gatherer.carrying[eid] > 0) {
      startReturning(world, eid);
    } else {
      findNearestMineOrIdle(world, eid);
    }
    return;
  }

  // Harvest: +HARVEST_RATE per second
  const harvestAmount = HARVEST_RATE * dt;
  const capacity = Gatherer.carryCapacity[eid] || CARRY_CAPACITY;
  const remaining = capacity - Gatherer.carrying[eid];
  const available = Resource.amount[targetEid];
  const actual = Math.min(harvestAmount, remaining, available);

  Gatherer.carrying[eid] += actual;
  Resource.amount[targetEid] -= actual;

  // Full capacity -- head to town hall
  if (Gatherer.carrying[eid] >= capacity) {
    startReturning(world, eid);
    return;
  }

  // Mine depleted while gathering
  if (Resource.amount[targetEid] <= 0) {
    if (Gatherer.carrying[eid] > 0) {
      startReturning(world, eid);
    } else {
      findNearestMineOrIdle(world, eid);
    }
  }
}

function processReturning(world: GameWorld, eid: number): void {
  // Find nearest own town hall
  const factionId = Faction.id[eid];
  const townHallEid = findNearestTownHall(world, eid, factionId);

  if (townHallEid === NO_ENTITY) {
    // No town hall -- go idle
    Gatherer.state[eid] = GATHER_NONE;
    return;
  }

  // Check if arrived at town hall
  const dx = Position.x[townHallEid] - Position.x[eid];
  const dz = Position.z[townHallEid] - Position.z[eid];
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < DEPOSIT_ARRIVAL_DISTANCE) {
    // Deposit gold
    const amount = Math.floor(Gatherer.carrying[eid]);
    playerState.addGold(factionId, amount);
    Gatherer.carrying[eid] = 0;

    // Auto-return to same resource
    const targetEid = Gatherer.targetEid[eid];
    if (
      targetEid !== NO_ENTITY &&
      entityExists(world, targetEid) &&
      Resource.amount[targetEid] > 0
    ) {
      Gatherer.state[eid] = GATHER_MOVING_TO_RESOURCE;
      Movement.targetX[eid] = Position.x[targetEid];
      Movement.targetZ[eid] = Position.z[targetEid];
      Movement.hasTarget[eid] = 1;
      addComponent(world, eid, NeedsPathfinding);
    } else {
      // Mine depleted, find another
      findNearestMineOrIdle(world, eid);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startReturning(world: GameWorld, eid: number): void {
  Gatherer.state[eid] = GATHER_RETURNING;

  const factionId = Faction.id[eid];
  const townHallEid = findNearestTownHall(world, eid, factionId);

  if (townHallEid === NO_ENTITY) {
    Gatherer.state[eid] = GATHER_NONE;
    return;
  }

  Movement.targetX[eid] = Position.x[townHallEid];
  Movement.targetZ[eid] = Position.z[townHallEid];
  Movement.hasTarget[eid] = 1;
  addComponent(world, eid, NeedsPathfinding);
}

function findNearestTownHall(world: GameWorld, eid: number, factionId: number): number {
  const buildings = query(world, [Position, Building, IsBuilding]);
  const px = Position.x[eid];
  const pz = Position.z[eid];
  let closestEid = NO_ENTITY;
  let closestDistSq = Infinity;

  for (const bEid of buildings) {
    if (Building.typeId[bEid] !== BuildingTypeId.TownHall) continue;
    if (Faction.id[bEid] !== factionId) continue;
    if (Building.complete[bEid] !== 1) continue;
    if (hasComponent(world, bEid, IsDead)) continue;

    const dx = Position.x[bEid] - px;
    const dz = Position.z[bEid] - pz;
    const distSq = dx * dx + dz * dz;

    if (distSq < closestDistSq) {
      closestDistSq = distSq;
      closestEid = bEid;
    }
  }

  return closestEid;
}

function findNearestMineOrIdle(world: GameWorld, eid: number): void {
  const resources = query(world, [Position, Resource, IsResource]);
  const px = Position.x[eid];
  const pz = Position.z[eid];
  let closestEid = NO_ENTITY;
  let closestDistSq = Infinity;

  for (const rEid of resources) {
    if (Resource.amount[rEid] <= 0) continue;
    if (hasComponent(world, rEid, IsDead)) continue;

    const dx = Position.x[rEid] - px;
    const dz = Position.z[rEid] - pz;
    const distSq = dx * dx + dz * dz;

    if (distSq < closestDistSq) {
      closestDistSq = distSq;
      closestEid = rEid;
    }
  }

  if (closestEid !== NO_ENTITY) {
    // Found a mine -- go gather
    Gatherer.targetEid[eid] = closestEid;
    Gatherer.state[eid] = GATHER_MOVING_TO_RESOURCE;
    Movement.targetX[eid] = Position.x[closestEid];
    Movement.targetZ[eid] = Position.z[closestEid];
    Movement.hasTarget[eid] = 1;
    addComponent(world, eid, NeedsPathfinding);
  } else {
    // No mines left -- go idle
    Gatherer.state[eid] = GATHER_NONE;
    Gatherer.targetEid[eid] = NO_ENTITY;
    Movement.hasTarget[eid] = 0;
  }
}
