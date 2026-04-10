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
} from '../ecs/components';
import { IsWorker, IsBuilding, IsResource, IsDead, NeedsPathfinding } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import {
  ResourceType,
  HARVEST_RATE,
  CARRY_CAPACITY,
  GATHER_ARRIVAL_DISTANCE,
  DEPOSIT_ARRIVAL_DISTANCE,
  NO_ENTITY,
  BuildingTypeId,
  DIMINISHING_RETURNS_THRESHOLD,
  DIMINISHING_RETURNS_GATHER_MULT,
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
    findNearestResourceOrIdle(world, eid, Gatherer.resourceType[eid]);
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
      findNearestResourceOrIdle(world, eid, Gatherer.resourceType[eid]);
    }
    return;
  }

  // Harvest: +HARVEST_RATE per second (with diminishing returns for depleted resources)
  let effectiveRate = HARVEST_RATE;
  const maxAmount = Resource.maxAmount[targetEid];
  if (maxAmount > 0 && Resource.amount[targetEid] / maxAmount < DIMINISHING_RETURNS_THRESHOLD) {
    effectiveRate *= DIMINISHING_RETURNS_GATHER_MULT;
  }
  const harvestAmount = effectiveRate * dt;
  const capacity = Gatherer.carryCapacity[eid] || CARRY_CAPACITY;
  const remaining = capacity - Gatherer.carrying[eid];
  const available = Resource.amount[targetEid];
  const actual = Math.min(harvestAmount, remaining, available);

  Gatherer.carrying[eid] += actual;
  Resource.amount[targetEid] = Math.max(0, Resource.amount[targetEid] - actual);

  // Full capacity -- head to town hall
  if (Gatherer.carrying[eid] >= capacity) {
    startReturning(world, eid);
    return;
  }

  // Resource depleted while gathering
  if (Resource.amount[targetEid] <= 0) {
    if (Gatherer.carrying[eid] > 0) {
      startReturning(world, eid);
    } else {
      findNearestResourceOrIdle(world, eid, Gatherer.resourceType[eid]);
    }
  }
}

function processReturning(world: GameWorld, eid: number): void {
  // Find nearest deposit building for the carried resource type
  const factionId = Faction.id[eid];
  const resType = Gatherer.resourceType[eid];
  const depositEid = findNearestDepositBuilding(world, eid, factionId, resType);

  if (depositEid === NO_ENTITY) {
    // No deposit building -- go idle
    Gatherer.state[eid] = GATHER_NONE;
    return;
  }

  // Check if arrived at deposit building
  const dx = Position.x[depositEid] - Position.x[eid];
  const dz = Position.z[depositEid] - Position.z[eid];
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < DEPOSIT_ARRIVAL_DISTANCE) {
    // Deposit resources
    const amount = Math.floor(Gatherer.carrying[eid]);
    if (resType === ResourceType.Wood) {
      playerState.addWood(factionId, amount);
    } else {
      playerState.addGold(factionId, amount);
    }
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
      // Resource depleted, find another of the same type
      findNearestResourceOrIdle(world, eid, resType);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startReturning(world: GameWorld, eid: number): void {
  Gatherer.state[eid] = GATHER_RETURNING;

  const factionId = Faction.id[eid];
  const resType = Gatherer.resourceType[eid];
  const depositEid = findNearestDepositBuilding(world, eid, factionId, resType);

  if (depositEid === NO_ENTITY) {
    Gatherer.state[eid] = GATHER_NONE;
    return;
  }

  Movement.targetX[eid] = Position.x[depositEid];
  Movement.targetZ[eid] = Position.z[depositEid];
  Movement.hasTarget[eid] = 1;
  addComponent(world, eid, NeedsPathfinding);
}

/**
 * Find the nearest deposit building for the given resource type.
 * For Gold: TownHall
 * For Wood: LumberCamp preferred, TownHall as fallback
 */
function findNearestDepositBuilding(world: GameWorld, eid: number, factionId: number, resType: number): number {
  const buildings = query(world, [Position, Building, IsBuilding]);
  const px = Position.x[eid];
  const pz = Position.z[eid];
  let closestEid = NO_ENTITY;
  let closestDistSq = Infinity;

  // For wood: first try LumberCamp, then fall back to TownHall
  // For gold: only TownHall
  const primaryType = resType === ResourceType.Wood ? BuildingTypeId.LumberCamp : BuildingTypeId.TownHall;
  const fallbackType = BuildingTypeId.TownHall;

  // First pass: look for primary deposit type
  for (const bEid of buildings) {
    if (Building.typeId[bEid] !== primaryType) continue;
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

  // If wood and no LumberCamp found, fall back to TownHall
  if (closestEid === NO_ENTITY && resType === ResourceType.Wood) {
    for (const bEid of buildings) {
      if (Building.typeId[bEid] !== fallbackType) continue;
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
  }

  return closestEid;
}

/**
 * Find the nearest resource of the given type, or go idle.
 */
function findNearestResourceOrIdle(world: GameWorld, eid: number, resType: number): void {
  const resources = query(world, [Position, Resource, IsResource]);
  const px = Position.x[eid];
  const pz = Position.z[eid];
  let closestEid = NO_ENTITY;
  let closestDistSq = Infinity;

  for (const rEid of resources) {
    if (Resource.amount[rEid] <= 0) continue;
    if (hasComponent(world, rEid, IsDead)) continue;
    if (Resource.type[rEid] !== resType) continue;

    const dx = Position.x[rEid] - px;
    const dz = Position.z[rEid] - pz;
    const distSq = dx * dx + dz * dz;

    if (distSq < closestDistSq) {
      closestDistSq = distSq;
      closestEid = rEid;
    }
  }

  if (closestEid !== NO_ENTITY) {
    // Found a resource -- go gather
    Gatherer.targetEid[eid] = closestEid;
    Gatherer.resourceType[eid] = resType;
    Gatherer.state[eid] = GATHER_MOVING_TO_RESOURCE;
    Movement.targetX[eid] = Position.x[closestEid];
    Movement.targetZ[eid] = Position.z[closestEid];
    Movement.hasTarget[eid] = 1;
    addComponent(world, eid, NeedsPathfinding);
  } else {
    // No resources left -- go idle
    Gatherer.state[eid] = GATHER_NONE;
    Gatherer.targetEid[eid] = NO_ENTITY;
    Movement.hasTarget[eid] = 0;
  }
}
