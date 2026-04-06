/**
 * AISystem -- ECS system wrapper for the AI opponent
 *
 * Bridges the AIController (decision-making) with the ECS world.
 * Runs after all player systems in the pipeline.
 *
 * Responsibilities:
 * 1. Build the AIWorldSnapshot from ECS component data each tick
 * 2. Pass snapshot to AIController.update()
 * 3. Execute returned AICommands by modifying ECS components
 */

import {
  FactionId,
  UnitTypeId,
  BuildingTypeId,
  UnitAIState,
  HERO_POPULATION_COST,
  type EntityId,
  MAP_SIZE,
} from '../types/index';
import {
  AIController,
  AICommandType,
  type AICommand,
  type AIWorldSnapshot,
} from './AIController';
import { NavMeshManager } from '../pathfinding/NavMeshManager';
import {
  isVergaderingReady,
  activateVergadering,
  getRandstadEfficiencyStacks,
  isWerkoverlegActive,
} from '../systems/BureaucracySystem';
import { createHero, isHeroActive } from '../entities/heroFactory';
import { HERO_ARCHETYPES, getHeroTypesForFaction } from '../entities/heroArchetypes';
import { playerState } from '../core/PlayerState';
import { world as ecsWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// ECS component arrays -- set via configure()
// ---------------------------------------------------------------------------

interface ECSComponents {
  // Position
  positionX: Float32Array;
  positionY: Float32Array;
  positionZ: Float32Array;

  // Movement
  movementTargetX: Float32Array;
  movementTargetZ: Float32Array;
  movementHasTarget: Uint8Array;
  movementSpeed: Float32Array;

  // Faction
  factionId: Uint8Array;

  // Unit type
  unitTypeId: Uint8Array;

  // Building type
  buildingTypeId: Uint8Array;

  // Health
  healthCurrent: Float32Array;
  healthMax: Float32Array;

  // UnitAI state
  unitAIState: Uint8Array;
  unitAITargetEid: Uint32Array;

  // Gatherer
  gathererState: Uint8Array;
  gathererTargetEid: Uint32Array;

  // Resource
  resourceAmount: Float32Array;

  // Production
  productionUnitType: Uint8Array;
  productionProgress: Float32Array;
  productionTime: Float32Array;

  // Tags (bit flags or separate arrays)
  isUnit: Uint8Array;
  isBuilding: Uint8Array;
  isResource: Uint8Array;
}

/** Callbacks for actions the AISystem can't do with component writes alone. */
interface AISystemCallbacks {
  /** Spawn a building entity at the given position. Returns the new entity ID. */
  spawnBuilding: (type: BuildingTypeId, factionId: FactionId, x: number, z: number) => EntityId;
  /** Start training a unit from a building. */
  startTraining: (buildingEid: EntityId, unitType: UnitTypeId) => boolean;
  /** Deduct gold from the AI player. */
  deductGold: (amount: number) => boolean;
  /** Get current AI gold. */
  getGold: () => number;
  /** Get all living entity IDs. */
  getAllEntityIds: () => readonly EntityId[];
}

let ecs: ECSComponents | null = null;
let callbacks: AISystemCallbacks | null = null;

// ---------------------------------------------------------------------------
// The AI controller instance
// ---------------------------------------------------------------------------

const aiController = new AIController();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const AISystem = {
  /**
   * Provide ECS component arrays and action callbacks.
   * Must be called once before the first update().
   */
  configure(components: ECSComponents, cbs: AISystemCallbacks): void {
    ecs = components;
    callbacks = cbs;
  },

  /**
   * Main update -- call once per fixed-update tick, AFTER player systems.
   */
  update(dt: number, elapsedTime: number): void {
    if (!ecs || !callbacks) return;

    // Build world snapshot
    const snapshot = buildSnapshot(ecs, callbacks, elapsedTime);

    // Run AI decisions
    const commands = aiController.update(snapshot, dt);

    // Execute commands
    for (const cmd of commands) {
      executeCommand(cmd, ecs, callbacks);
    }

    // AI Hero training: train heroes when army is 10+ and can afford
    tryTrainAIHeroes(ecs, callbacks, snapshot);
  },

  /**
   * Reset the AI state (new game).
   */
  reset(): void {
    aiController.reset();
  },

  /**
   * Get current AI phase for debug display.
   */
  get phase() {
    return aiController.currentPhase;
  },

  /**
   * Get number of attack waves sent.
   */
  get wavesSent() {
    return aiController.wavesSent;
  },

  /**
   * Dispose.
   */
  dispose(): void {
    aiController.reset();
    ecs = null;
    callbacks = null;
  },
};

// ---------------------------------------------------------------------------
// Snapshot Builder
// ---------------------------------------------------------------------------

function buildSnapshot(
  c: ECSComponents,
  cb: AISystemCallbacks,
  elapsedTime: number,
): AIWorldSnapshot {
  const allIds = cb.getAllEntityIds();

  const workers: EntityId[] = [];
  const infantry: EntityId[] = [];
  const ranged: EntityId[] = [];
  const townHalls: EntityId[] = [];
  const barracks: EntityId[] = [];
  const army: EntityId[] = [];
  const playerTownHallPositions: { x: number; z: number }[] = [];
  const goldMines: { eid: EntityId; x: number; z: number; amount: number }[] = [];
  const enemyUnitPositions: { eid: EntityId; x: number; z: number }[] = [];

  let barracksUnderConstruction = false;
  let isTraining = false;
  let baseX = MAP_SIZE / 4;
  let baseZ = MAP_SIZE / 4;

  for (const eid of allIds) {
    // Skip dead entities
    if (c.healthCurrent[eid] <= 0 && (c.isUnit[eid] === 1 || c.isBuilding[eid] === 1)) {
      continue;
    }

    const fid = c.factionId[eid];

    // AI units
    if (fid === FactionId.AI && c.isUnit[eid] === 1) {
      const unitType = c.unitTypeId[eid];
      switch (unitType) {
        case UnitTypeId.Worker:
          workers.push(eid);
          break;
        case UnitTypeId.Infantry:
          infantry.push(eid);
          army.push(eid);
          break;
        case UnitTypeId.Ranged:
          ranged.push(eid);
          army.push(eid);
          break;
      }
    }

    // AI buildings
    if (fid === FactionId.AI && c.isBuilding[eid] === 1) {
      const buildingType = c.buildingTypeId[eid];
      if (buildingType === BuildingTypeId.TownHall) {
        townHalls.push(eid);
        // Use first town hall as base position
        baseX = c.positionX[eid];
        baseZ = c.positionZ[eid];
      } else if (buildingType === BuildingTypeId.Barracks) {
        // Check if barracks is complete (health > 0 and has full health)
        if (c.healthCurrent[eid] > 0 && c.healthCurrent[eid] >= c.healthMax[eid]) {
          barracks.push(eid);
        } else {
          barracksUnderConstruction = true;
        }
      }

      // Check if any building is training
      if (c.productionUnitType[eid] !== 0xff) {
        isTraining = true;
      }
    }

    // Player Town Halls (attack target)
    if (fid === FactionId.Brabanders && c.isBuilding[eid] === 1) {
      if (c.buildingTypeId[eid] === BuildingTypeId.TownHall) {
        playerTownHallPositions.push({
          x: c.positionX[eid],
          z: c.positionZ[eid],
        });
      }
    }

    // Gold mines (no faction)
    if (c.isResource[eid] === 1) {
      goldMines.push({
        eid,
        x: c.positionX[eid],
        z: c.positionZ[eid],
        amount: c.resourceAmount[eid],
      });
    }

    // Player (enemy) units -- for Vergadering targeting
    if (fid === FactionId.Brabanders && c.isUnit[eid] === 1) {
      enemyUnitPositions.push({
        eid,
        x: c.positionX[eid],
        z: c.positionZ[eid],
      });
    }
  }

  // Check if a barracks is under construction (has health < max and is AI's)
  // For PoC simplicity, we track this via a flag
  // A building "under construction" has buildingTypeId === Barracks but
  // health < healthMax (or buildProgress < 1.0)

  return {
    gold: cb.getGold(),
    elapsedTime,
    workers,
    infantry,
    ranged,
    townHalls,
    barracks,
    army,
    playerTownHallPositions,
    goldMinePositions: goldMines,
    baseX,
    baseZ,
    barracksUnderConstruction,
    isTraining,

    // Randstad Bureaucracy data
    efficiencyStacks: getRandstadEfficiencyStacks(),
    werkoverlegActive: isWerkoverlegActive(),
    vergaderingReady: isVergaderingReady(),
    enemyUnitPositions,

    getEntityPosition: (eid: EntityId) => {
      // Always return position -- entities always have a position
      return { x: c.positionX[eid], z: c.positionZ[eid] };
    },

    getEntityState: (eid: EntityId) => {
      return c.unitAIState[eid] as UnitAIState;
    },
  };
}

// ---------------------------------------------------------------------------
// AI Hero Training
// ---------------------------------------------------------------------------

/** Timer to throttle hero training checks. */
let aiHeroTimer = 0;

function tryTrainAIHeroes(
  c: ECSComponents,
  cb: AISystemCallbacks,
  snapshot: AIWorldSnapshot,
): void {
  // Only check every 5 seconds
  aiHeroTimer += 2; // Decision interval is 2s
  if (aiHeroTimer < 10) return;
  aiHeroTimer = 0;

  // Need 10+ army units before training heroes
  if (snapshot.army.length < 10) return;

  const heroTypes = getHeroTypesForFaction(FactionId.Randstad);
  for (const heroTypeId of heroTypes) {
    if (isHeroActive(FactionId.Randstad, heroTypeId)) continue;

    const arch = HERO_ARCHETYPES[heroTypeId];
    if (cb.getGold() < arch.costGold) continue;
    if (!playerState.hasPopulationRoom(FactionId.Randstad, HERO_POPULATION_COST)) continue;

    // Find AI barracks for spawn point
    let barracksX = snapshot.baseX;
    let barracksZ = snapshot.baseZ;
    for (const bEid of snapshot.barracks) {
      barracksX = c.positionX[bEid];
      barracksZ = c.positionZ[bEid];
      break;
    }

    // Find town hall for revival
    let thX = snapshot.baseX;
    let thZ = snapshot.baseZ;
    for (const thEid of snapshot.townHalls) {
      thX = c.positionX[thEid];
      thZ = c.positionZ[thEid];
      break;
    }

    cb.deductGold(arch.costGold);
    const heroEid = createHero(
      ecsWorld,
      heroTypeId,
      FactionId.Randstad,
      barracksX + 4,
      barracksZ + 2,
      thX,
      thZ,
    );
    if (heroEid >= 0) {
      playerState.addPopulation(FactionId.Randstad, HERO_POPULATION_COST);
    }
    break; // Only one hero per check cycle
  }
}

// ---------------------------------------------------------------------------
// Command Executor
// ---------------------------------------------------------------------------

function executeCommand(
  cmd: AICommand,
  c: ECSComponents,
  cb: AISystemCallbacks,
): void {
  switch (cmd.type) {
    case AICommandType.GatherGold: {
      if (cmd.targetEntityId == null || cmd.targetX == null || cmd.targetZ == null) break;
      const eid = cmd.targetEntityId;

      // Find the gold mine entity at this position
      const allIds = cb.getAllEntityIds();
      let mineEid = 0;
      let mineDist = Infinity;
      for (const id of allIds) {
        if (c.isResource[id] !== 1) continue;
        if (c.resourceAmount[id] <= 0) continue;
        const dx = c.positionX[id] - cmd.targetX!;
        const dz = c.positionZ[id] - cmd.targetZ!;
        const d = dx * dx + dz * dz;
        if (d < mineDist) {
          mineDist = d;
          mineEid = id;
        }
      }

      // Set movement target to gold mine position
      c.movementTargetX[eid] = cmd.targetX;
      c.movementTargetZ[eid] = cmd.targetZ;
      c.movementHasTarget[eid] = 1;
      c.unitAIState[eid] = UnitAIState.MovingToResource;

      // Also set gatherer state so GatherSystem picks it up
      c.gathererState[eid] = 1; // MOVING_TO_RESOURCE
      c.gathererTargetEid[eid] = mineEid;
      break;
    }

    case AICommandType.BuildBarracks: {
      if (cmd.targetX == null || cmd.targetZ == null) break;

      // Check gold
      const cost = 200; // BARRACKS_COST
      if (!cb.deductGold(cost)) break;

      // Spawn barracks entity
      cb.spawnBuilding(BuildingTypeId.Barracks, FactionId.AI, cmd.targetX, cmd.targetZ);

      // Add obstacle to navmesh
      NavMeshManager.addBoxObstacle(cmd.targetX, cmd.targetZ, 2, 2, 4);
      break;
    }

    case AICommandType.TrainUnit: {
      if (cmd.targetEntityId == null || cmd.unitType == null) break;

      // Check gold cost
      let cost = 50;
      if (cmd.unitType === UnitTypeId.Infantry) cost = 60;
      if (cmd.unitType === UnitTypeId.Ranged) cost = 80;

      if (!cb.deductGold(cost)) break;

      cb.startTraining(cmd.targetEntityId, cmd.unitType);
      break;
    }

    case AICommandType.MoveUnit: {
      if (cmd.targetEntityId == null || cmd.targetX == null || cmd.targetZ == null) break;
      const eid = cmd.targetEntityId;

      c.movementTargetX[eid] = cmd.targetX;
      c.movementTargetZ[eid] = cmd.targetZ;
      c.movementHasTarget[eid] = 1;
      c.unitAIState[eid] = UnitAIState.Moving;
      break;
    }

    case AICommandType.AttackMove: {
      if (cmd.targetEntityId == null || cmd.targetX == null || cmd.targetZ == null) break;
      const eid = cmd.targetEntityId;

      c.movementTargetX[eid] = cmd.targetX;
      c.movementTargetZ[eid] = cmd.targetZ;
      c.movementHasTarget[eid] = 1;
      // Attack-move: unit will engage enemies along the path
      // Using Moving state -- the UnitAI FSM in CombatSystem will handle
      // auto-aggro for units that encounter enemies while moving
      c.unitAIState[eid] = UnitAIState.Moving;
      break;
    }

    case AICommandType.Vergadering: {
      if (cmd.targetX == null || cmd.targetZ == null) break;
      // Activate the Eindeloze Vergadering ability through the BureaucracySystem
      activateVergadering(ecsWorld, cmd.targetX, cmd.targetZ);
      break;
    }
  }
}
