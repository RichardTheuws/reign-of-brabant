/**
 * Reign of Brabant -- Command System
 *
 * Listens to player commands (from UI/input) and translates them into ECS
 * component writes on selected entities.
 *
 * Commands: move, attack, attack-move, gather, build, train, stop.
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
import { getFactionUnitArchetype } from '../data/factionData';
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

interface AttackMoveCommand {
  type: 'attack-move';
  targetX: number;
  targetZ: number;
}

interface StopCommand {
  type: 'stop';
}

interface HoldCommand {
  type: 'hold';
}

type Command = MoveCommand | AttackCommand | GatherCommand | BuildCommand | TrainCommand | AttackMoveCommand | StopCommand | HoldCommand;

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
// Faction-aware unit cost/build-time lookups via factionData.ts
// ---------------------------------------------------------------------------

function getUnitCostForFaction(factionId: number, unitTypeId: number): number {
  try {
    return getFactionUnitArchetype(factionId, unitTypeId).costGold;
  } catch {
    return 50;
  }
}

function getUnitWoodCostForFaction(factionId: number, unitTypeId: number): number {
  try {
    return getFactionUnitArchetype(factionId, unitTypeId).costSecondary ?? 0;
  } catch {
    return 0;
  }
}

function getUnitBuildTimeForFaction(factionId: number, unitTypeId: number): number {
  try {
    return getFactionUnitArchetype(factionId, unitTypeId).buildTime;
  } catch {
    return 15;
  }
}

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
        case 'attack-move':
          handleAttackMove(world, selectedUnits, cmd);
          break;
        case 'stop':
          handleStop(world, selectedUnits);
          break;
        case 'hold':
          handleHold(world, selectedUnits);
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

/**
 * Compute formation offsets for a group of units moving to the same target.
 * Places units in concentric rings around the target position.
 * Returns an array of [offsetX, offsetZ] pairs.
 */
function computeFormationOffsets(count: number): Array<[number, number]> {
  if (count <= 1) return [[0, 0]];

  const offsets: Array<[number, number]> = [[0, 0]]; // First unit goes to exact target
  const spacing = 1.8; // Space between units in the formation
  let placed = 1;
  let ring = 1;

  while (placed < count) {
    const radius = ring * spacing;
    const circumference = 2 * Math.PI * radius;
    const unitsInRing = Math.min(
      count - placed,
      Math.max(6, Math.floor(circumference / spacing)),
    );

    for (let i = 0; i < unitsInRing && placed < count; i++) {
      const angle = (i / unitsInRing) * 2 * Math.PI;
      offsets.push([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
      ]);
      placed++;
    }
    ring++;
  }

  return offsets;
}

function handleMove(world: GameWorld, units: number[], cmd: MoveCommand): void {
  const offsets = computeFormationOffsets(units.length);

  for (let i = 0; i < units.length; i++) {
    const eid = units[i];
    const [ox, oz] = offsets[i];

    Movement.targetX[eid] = cmd.targetX + ox;
    Movement.targetZ[eid] = cmd.targetZ + oz;
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

    if (dist > Attack.range[eid]) {
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

export function handleBuild(world: GameWorld, units: number[], cmd: BuildCommand): void {
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

  // Reset gather state so a mid-harvest worker doesn't get yanked back to
  // the resource by GatherSystem before it reaches the build site.
  Gatherer.state[nearestWorker] = 0; // NONE
  Gatherer.targetEid[nearestWorker] = NO_ENTITY;
}

function handleTrain(world: GameWorld, cmd: TrainCommand): void {
  const bEid = cmd.buildingEid;

  // Verify building exists and is complete
  if (!hasComponent(world, bEid, IsBuilding)) return;
  if (Building.complete[bEid] !== 1) return;

  const factionId = Faction.id[bEid];

  // Check cost -- gold from command or faction lookup, wood always from archetype.
  const cost = cmd.cost || getUnitCostForFaction(factionId, cmd.unitTypeId);
  const woodCost = getUnitWoodCostForFaction(factionId, cmd.unitTypeId);
  if (!playerState.canAfford(factionId, cost)) return;
  if (woodCost > 0 && !playerState.canAffordWood(factionId, woodCost)) return;

  // Check population
  if (!playerState.hasPopulationRoom(factionId)) return;

  // Deduct both resources at START of production
  playerState.spend(factionId, cost);
  if (woodCost > 0) playerState.spendWood(factionId, woodCost);

  // If building is not currently producing, start immediately
  if (Production.unitType[bEid] === NO_PRODUCTION) {
    Production.unitType[bEid] = cmd.unitTypeId;
    Production.progress[bEid] = 0;
    Production.duration[bEid] = getUnitBuildTimeForFaction(factionId, cmd.unitTypeId);
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

  // Queue full -- refund both resources
  playerState.addGold(factionId, cost);
  if (woodCost > 0) playerState.addWood(factionId, woodCost);
}

/**
 * Attack-move: units move to a target position but engage any enemies encountered along the way.
 * Implemented by setting UnitAI state to Moving with the aggro origin set to their current position,
 * so the CombatSystem's auto-aggro will still fire while they move.
 * Once they arrive, they go idle and auto-aggro takes over.
 */
function handleAttackMove(world: GameWorld, units: number[], cmd: AttackMoveCommand): void {
  const offsets = computeFormationOffsets(units.length);

  for (let i = 0; i < units.length; i++) {
    const eid = units[i];
    const [ox, oz] = offsets[i];

    Movement.targetX[eid] = cmd.targetX + ox;
    Movement.targetZ[eid] = cmd.targetZ + oz;
    Movement.hasTarget[eid] = 1;

    // Set to Idle so auto-aggro fires each frame while moving toward target.
    // The Movement system still moves them because hasTarget=1, and
    // CombatSystem's processAutoAggro checks idle units for enemies in range.
    UnitAI.state[eid] = UnitAIState.Idle;
    UnitAI.targetEid[eid] = NO_ENTITY;

    // Store move destination as leash origin so units return after killing
    UnitAI.originX[eid] = cmd.targetX + ox;
    UnitAI.originZ[eid] = cmd.targetZ + oz;

    // Reset gather state if worker
    if (hasComponent(world, eid, IsWorker)) {
      Gatherer.state[eid] = 0; // NONE
    }

    addComponent(world, eid, NeedsPathfinding);
  }
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

/**
 * Hold position: units stop moving but will attack enemies that come within
 * weapon range. They will NOT chase enemies that move away.
 */
function handleHold(world: GameWorld, units: number[]): void {
  for (const eid of units) {
    Movement.hasTarget[eid] = 0;
    UnitAI.state[eid] = UnitAIState.HoldPosition;
    UnitAI.targetEid[eid] = NO_ENTITY;

    if (hasComponent(world, eid, IsWorker)) {
      Gatherer.state[eid] = 0; // NONE
    }
  }
}
