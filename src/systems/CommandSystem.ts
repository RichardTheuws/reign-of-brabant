/**
 * Reign of Brabant -- Command System
 *
 * Listens to player commands (from UI/input) and translates them into ECS
 * component writes on selected entities.
 *
 * Commands: move, attack, gather, build, train, stop.
 * This system does NOT read input directly -- it processes commands queued
 * via the public `queueCommand()` method.
 */

import { query, addComponent, hasComponent, entityExists } from 'bitecs';
import {
  Position,
  Movement,
  UnitAI,
  Gatherer,
  Production,
  Building,
  Faction,
  Selected,
  Attack,
  Resource,
} from '../ecs/components';
import { IsUnit, IsWorker, IsBuilding, NeedsPathfinding } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import { UnitAIState, NO_ENTITY, NO_PRODUCTION } from '../types/index';
import { gameConfig } from '../core/GameConfig';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Command queue
// ---------------------------------------------------------------------------
interface MoveCommand {
  type: 'move';
  targetX: number;
  targetZ: number;
}

interface AttackCommand {
  type: 'attack';
  targetEid: number;
}

interface GatherCommand {
  type: 'gather';
  targetEid: number;
}

interface BuildCommand {
  type: 'build';
  buildingTypeId: number;
  x: number;
  z: number;
}

interface TrainCommand {
  type: 'train';
  buildingEid: number;
  unitTypeId: number;
  cost: number;
}

interface StopCommand {
  type: 'stop';
}

type Command = MoveCommand | AttackCommand | GatherCommand | BuildCommand | TrainCommand | StopCommand;

// Internal command buffer -- flushed each frame
const commandBuffer: Command[] = [];

/**
 * Queue a command to be processed next frame.
 * Called by input handlers, UI buttons, etc.
 */
export function queueCommand(cmd: Command): void {
  commandBuffer.push(cmd);
}

// ---------------------------------------------------------------------------
// Unit stat lookups for train costs (simplified PoC)
// ---------------------------------------------------------------------------
const UNIT_COSTS: Record<number, number> = {
  0: 50,  // Worker
  1: 75,  // Infantry
  2: 80,  // Ranged
};

const UNIT_BUILD_TIMES: Record<number, number> = {
  0: 12,  // Worker: 12 seconds
  1: 18,  // Infantry: 18 seconds
  2: 20,  // Ranged: 20 seconds
};

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

/**
 * Create the command system.
 */
export function createCommandSystem() {
  return function commandSystem(world: GameWorld, _dt: number): void {
    if (commandBuffer.length === 0) return;

    // Get selected player units
    const allUnits = query(world, [Selected, Position, IsUnit]);
    const selectedUnits: number[] = [];
    for (const eid of allUnits) {
      if (Selected.by[eid] === 0 && gameConfig.isPlayerFaction(Faction.id[eid])) {
        selectedUnits.push(eid);
      }
    }

    // Process each queued command
    for (const cmd of commandBuffer) {
      switch (cmd.type) {
        case 'move':
          handleMove(world, selectedUnits, cmd);
          break;
        case 'attack':
          handleAttack(world, selectedUnits, cmd);
          break;
        case 'gather':
          handleGather(world, selectedUnits, cmd);
          break;
        case 'build':
          // Build is handled separately -- not per-unit
          handleBuild(world, selectedUnits, cmd);
          break;
        case 'train':
          handleTrain(world, cmd);
          break;
        case 'stop':
          handleStop(world, selectedUnits);
          break;
      }
    }

    // Clear the buffer
    commandBuffer.length = 0;
  };
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

function handleMove(world: GameWorld, units: number[], cmd: MoveCommand): void {
  for (const eid of units) {
    Movement.targetX[eid] = cmd.targetX;
    Movement.targetZ[eid] = cmd.targetZ;
    Movement.hasTarget[eid] = 1;

    UnitAI.state[eid] = UnitAIState.Moving;
    UnitAI.targetEid[eid] = NO_ENTITY;

    // Reset gather state if worker
    if (hasComponent(world, eid, IsWorker)) {
      Gatherer.state[eid] = 0; // NONE
    }

    addComponent(world, eid, NeedsPathfinding);
  }
}

function handleAttack(world: GameWorld, units: number[], cmd: AttackCommand): void {
  // Validate target still exists (may have been destroyed between queue and execution)
  if (!entityExists(world, cmd.targetEid)) return;

  for (const eid of units) {
    UnitAI.state[eid] = UnitAIState.Attacking;
    UnitAI.targetEid[eid] = cmd.targetEid;

    // If target is out of range, move toward it
    const targetX = Position.x[cmd.targetEid];
    const targetZ = Position.z[cmd.targetEid];
    const dx = targetX - Position.x[eid];
    const dz = targetZ - Position.z[eid];
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Melee range = 0 in archetypes, use minimum 1.5
    const effectiveRange = Math.max(Attack.range[eid], 1.5);
    if (dist > effectiveRange) {
      Movement.targetX[eid] = targetX;
      Movement.targetZ[eid] = targetZ;
      Movement.hasTarget[eid] = 1;
      addComponent(world, eid, NeedsPathfinding);
    }

    // Reset gather state if worker
    if (hasComponent(world, eid, IsWorker)) {
      Gatherer.state[eid] = 0; // NONE
    }
  }
}

function handleGather(world: GameWorld, units: number[], cmd: GatherCommand): void {
  // Validate target resource still exists
  if (!entityExists(world, cmd.targetEid)) return;

  for (const eid of units) {
    // Only workers can gather
    if (!hasComponent(world, eid, IsWorker)) continue;

    Gatherer.state[eid] = 1; // MOVING_TO_RESOURCE
    Gatherer.targetEid[eid] = cmd.targetEid;
    Gatherer.carrying[eid] = 0;
    // Auto-detect resource type from the target resource node
    Gatherer.resourceType[eid] = Resource.type[cmd.targetEid];

    // Move to resource
    Movement.targetX[eid] = Position.x[cmd.targetEid];
    Movement.targetZ[eid] = Position.z[cmd.targetEid];
    Movement.hasTarget[eid] = 1;

    UnitAI.state[eid] = UnitAIState.MovingToResource;
    UnitAI.targetEid[eid] = cmd.targetEid;

    addComponent(world, eid, NeedsPathfinding);
  }
}

function handleBuild(world: GameWorld, units: number[], cmd: BuildCommand): void {
  // Find nearest worker among selected units
  let nearestWorker = -1;
  let nearestDist = Infinity;

  for (const eid of units) {
    if (!hasComponent(world, eid, IsWorker)) continue;
    const dx = cmd.x - Position.x[eid];
    const dz = cmd.z - Position.z[eid];
    const dist = dx * dx + dz * dz;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestWorker = eid;
    }
  }

  if (nearestWorker === -1) return;

  // Move worker to build site
  Movement.targetX[nearestWorker] = cmd.x;
  Movement.targetZ[nearestWorker] = cmd.z;
  Movement.hasTarget[nearestWorker] = 1;

  UnitAI.state[nearestWorker] = UnitAIState.Moving;
  addComponent(world, nearestWorker, NeedsPathfinding);
}

function handleTrain(world: GameWorld, cmd: TrainCommand): void {
  const bEid = cmd.buildingEid;

  // Verify building exists and is complete
  if (!hasComponent(world, bEid, IsBuilding)) return;
  if (Building.complete[bEid] !== 1) return;

  const factionId = Faction.id[bEid];

  // Check cost
  const cost = cmd.cost || UNIT_COSTS[cmd.unitTypeId] || 50;
  if (!playerState.canAfford(factionId, cost)) return;

  // Check population
  if (!playerState.hasPopulationRoom(factionId)) return;

  // Deduct gold at START of production
  playerState.spend(factionId, cost);

  // If building is not currently producing, start immediately
  if (Production.unitType[bEid] === NO_PRODUCTION) {
    Production.unitType[bEid] = cmd.unitTypeId;
    Production.progress[bEid] = 0;
    Production.duration[bEid] = UNIT_BUILD_TIMES[cmd.unitTypeId] || 15;
    return;
  }

  // Otherwise, add to queue (find first empty slot)
  const queueSlots = [
    Production.queue0,
    Production.queue1,
    Production.queue2,
    Production.queue3,
    Production.queue4,
  ];

  for (const slot of queueSlots) {
    if (slot[bEid] === NO_PRODUCTION) {
      slot[bEid] = cmd.unitTypeId;
      return;
    }
  }

  // Queue full -- refund
  playerState.addGold(factionId, cost);
}

function handleStop(world: GameWorld, units: number[]): void {
  for (const eid of units) {
    Movement.hasTarget[eid] = 0;
    UnitAI.state[eid] = UnitAIState.Idle;
    UnitAI.targetEid[eid] = NO_ENTITY;

    if (hasComponent(world, eid, IsWorker)) {
      Gatherer.state[eid] = 0; // NONE
    }
  }
}
