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

/** The faction the AI plays as. Default: Randstad for backwards compatibility. */
let aiFactionId: FactionId = FactionId.Randstad;

let aiController = new AIController(aiFactionId);

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
   * Set the faction the AI plays as. Creates a new AIController with
   * faction-specific strategy. Call before the game starts or after reset().
   *
   * @default FactionId.Randstad (backwards compatible)
   */
  setFaction(factionId: FactionId): void {
    aiFactionId = factionId;
    aiController = new AIController(factionId);
  },

  /**
   * Get the faction the AI is currently playing as.
   */
  get factionId(): FactionId {
    return aiFactionId;
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
   * Reset the AI state (new game). Preserves the current faction setting.
   */
  reset(): void {
    aiController = new AIController(aiFactionId);
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
   * Get the AI strategy name for debug display.
   */
  get strategyName() {
    return aiController.strategyName;
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

  // Determine which faction the AI is and which faction the player is.
  // The player faction is whichever faction is NOT the AI.
  const aiFaction = aiFactionId;
  // For player detection: any faction that isn't the AI's is a potential enemy.
  // In a 2-player game, the player is always the "other" faction.
  const isEnemyFaction = (fid: number): boolean => fid !== aiFaction;

  const workers: EntityId[] = [];
  const infantry: EntityId[] = [];
  const ranged: EntityId[] = [];
  const heavy: EntityId[] = [];
  const support: EntityId[] = [];
  const townHalls: EntityId[] = [];
  const barracks: EntityId[] = [];
  const tertiaryBuildings: EntityId[] = [];
  const army: EntityId[] = [];
  const playerTownHallPositions: { x: number; z: number }[] = [];
  const goldMines: { eid: EntityId; x: number; z: number; amount: number }[] = [];
  const enemyUnitPositions: { eid: EntityId; x: number; z: number }[] = [];

  let barracksUnderConstruction = false;
  let tertiaryUnderConstruction = false;
  let isTraining = false;
  let baseX = MAP_SIZE / 4;
  let baseZ = MAP_SIZE / 4;

  for (const eid of allIds) {
    // Skip dead entities
    if (c.healthCurrent[eid] <= 0 && (c.isUnit[eid] === 1 || c.isBuilding[eid] === 1)) {
      continue;
    }

    const fid = c.factionId[eid];

    // AI units (match on the AI's actual faction)
    if (fid === aiFaction && c.isUnit[eid] === 1) {
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
        case UnitTypeId.Heavy:
          heavy.push(eid);
          army.push(eid);
          break;
        case UnitTypeId.Support:
          support.push(eid);
          army.push(eid);
          break;
      }
    }

    // AI buildings
    if (fid === aiFaction && c.isBuilding[eid] === 1) {
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
      } else if (buildingType === BuildingTypeId.TertiaryResourceBuilding) {
        // Tertiary resource buildings (Mijnschacht / Chocolaterie)
        if (c.healthCurrent[eid] > 0 && c.healthCurrent[eid] >= c.healthMax[eid]) {
          tertiaryBuildings.push(eid);
        } else {
          tertiaryUnderConstruction = true;
        }
      }

      // Check if any building is training
      if (c.productionUnitType[eid] !== 0xff) {
        isTraining = true;
      }
    }

    // Enemy Town Halls (attack target) -- any non-AI faction
    if (isEnemyFaction(fid) && c.isBuilding[eid] === 1) {
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

    // Enemy units -- for Vergadering targeting and other abilities
    if (isEnemyFaction(fid) && c.isUnit[eid] === 1) {
      enemyUnitPositions.push({
        eid,
        x: c.positionX[eid],
        z: c.positionZ[eid],
      });
    }
  }

  return {
    gold: cb.getGold(),
    elapsedTime,
    workers,
    infantry,
    ranged,
    heavy,
    support,
    townHalls,
    barracks,
    tertiaryBuildings,
    army,
    playerTownHallPositions,
    goldMinePositions: goldMines,
    baseX,
    baseZ,
    barracksUnderConstruction,
    tertiaryUnderConstruction,
    isTraining,

    // Randstad Bureaucracy data (returns 0/false for non-Randstad factions)
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
  aiHeroTimer += 1;
  if (aiHeroTimer < 150) return; // ~5 seconds at 30 calls/sec (AISystem runs every other frame)
  aiHeroTimer = 0;

  // Need 10+ army units before training heroes
  if (snapshot.army.length < 10) return;

  const heroTypes = getHeroTypesForFaction(aiFactionId);
  for (const heroTypeId of heroTypes) {
    if (isHeroActive(aiFactionId, heroTypeId)) continue;

    const arch = HERO_ARCHETYPES[heroTypeId];
    if (cb.getGold() < arch.costGold) continue;
    if (!playerState.hasPopulationRoom(aiFactionId, HERO_POPULATION_COST)) continue;

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
      aiFactionId,
      barracksX + 4,
      barracksZ + 2,
      thX,
      thZ,
    );
    if (heroEid >= 0) {
      playerState.addPopulation(aiFactionId, HERO_POPULATION_COST);
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

      // Spawn barracks entity (use the AI's actual faction)
      cb.spawnBuilding(BuildingTypeId.Barracks, aiFactionId, cmd.targetX, cmd.targetZ);

      // Add obstacle to navmesh
      NavMeshManager.addBoxObstacle(cmd.targetX, cmd.targetZ, 2, 2, 4);
      break;
    }

    case AICommandType.BuildTertiaryBuilding: {
      if (cmd.targetX == null || cmd.targetZ == null) break;

      // Tertiary building costs same as barracks (200 gold)
      const cost = 200;
      if (!cb.deductGold(cost)) break;

      // Spawn tertiary resource building (Mijnschacht / Chocolaterie)
      cb.spawnBuilding(BuildingTypeId.TertiaryResourceBuilding, aiFactionId, cmd.targetX, cmd.targetZ);

      // Add obstacle to navmesh
      NavMeshManager.addBoxObstacle(cmd.targetX, cmd.targetZ, 2, 2, 4);
      break;
    }

    case AICommandType.TrainUnit: {
      if (cmd.targetEntityId == null || cmd.unitType == null) break;

      // Check gold cost (must match AIController costs)
      let cost = 50; // Worker default
      if (cmd.unitType === UnitTypeId.Infantry) cost = 60;
      if (cmd.unitType === UnitTypeId.Ranged) cost = 80;
      if (cmd.unitType === UnitTypeId.Heavy) cost = 120;
      if (cmd.unitType === UnitTypeId.Support) cost = 100;

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
