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
  ResourceType,
  NO_PRODUCTION,
} from '../types/index';
import { getFactionUnitArchetype } from '../data/factionData';
import {
  AIController,
  AICommandType,
  type AICommand,
  type AIWorldSnapshot,
} from './AIController';
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
import { hasComponent, query } from 'bitecs';
import { Building, Production, Resource, Position } from '../ecs/components';
import { IsResource } from '../ecs/tags';
import { validateBuildingPlacement } from '../systems/BuildSystem';
import { getBuildingCost } from '../world/buildingCost';
import { getActiveNavGrid } from '../pathfinding/UnitPathing';
import type { GameWorld } from '../ecs/world';

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
  /** Deduct gold from the given AI faction. */
  deductGold: (amount: number, factionId?: number) => boolean;
  /** Get current gold of the given AI faction. */
  getGold: (factionId?: number) => number;
  /** Get all living entity IDs. */
  getAllEntityIds: () => readonly EntityId[];
}

let ecs: ECSComponents | null = null;
let callbacks: AISystemCallbacks | null = null;

// ---------------------------------------------------------------------------
// The AI controller instances -- one per AI faction
// ---------------------------------------------------------------------------

/** Per-faction AI state. Nothing mutable is shared between AI factions. */
interface AIFactionState {
  readonly factionId: FactionId;
  readonly controller: AIController;
  /** Update calls since the last hero-training check. */
  heroTimer: number;
}

let aiDifficulty = 'normal';

/**
 * Missions: the AI factions are allied against the player, so they never
 * target each other. Skirmish (default): free-for-all, there are no teams.
 */
let aiAllied = false;

/** AI factions in play. Default: Randstad for backwards compatibility. */
let aiStates: AIFactionState[] = [createAIState(FactionId.Randstad)];

function createAIState(factionId: FactionId): AIFactionState {
  return { factionId, controller: new AIController(factionId, aiDifficulty), heroTimer: 0 };
}

function findState(factionId?: FactionId): AIFactionState | undefined {
  return factionId == null ? aiStates[0] : aiStates.find(s => s.factionId === factionId);
}

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
   * Set a single AI faction. Shorthand for setFactions([factionId]).
   *
   * @default FactionId.Randstad (backwards compatible)
   */
  setFaction(factionId: FactionId, difficulty?: string): void {
    AISystem.setFactions([factionId], difficulty);
  },

  /**
   * Set the factions the AI plays as: one AIController (own strategy, state,
   * base and timers) per faction. Duplicates are ignored. Call before the
   * game starts or after reset(). Omitting difficulty keeps the current one.
   * `allied: true` (missions) makes the AI factions allies: only non-AI
   * factions are enemies. Omitted = free-for-all (skirmish).
   */
  setFactions(
    factionIds: readonly FactionId[],
    difficulty?: string,
    opts?: { allied?: boolean },
  ): void {
    if (difficulty) aiDifficulty = difficulty;
    aiAllied = opts?.allied ?? false;
    const unique = [...new Set(factionIds)];
    aiStates = unique.map(createAIState);
  },

  /**
   * Get the primary AI faction (the first one set).
   */
  get factionId(): FactionId {
    return aiStates[0]?.factionId ?? FactionId.Randstad;
  },

  /**
   * Get all AI factions currently in play.
   */
  get factionIds(): FactionId[] {
    return aiStates.map(s => s.factionId);
  },

  /**
   * Main update -- call once per fixed-update tick, AFTER player systems.
   */
  update(dt: number, elapsedTime: number): void {
    if (!ecs || !callbacks) return;

    for (const state of aiStates) {
      // Build world snapshot from this faction's point of view
      const snapshot = buildSnapshot(ecs, callbacks, elapsedTime, state.factionId);

      // Run AI decisions
      const commands = state.controller.update(snapshot, dt);

      // Execute commands
      for (const cmd of commands) {
        executeCommand(cmd, ecs, callbacks, state.factionId);
      }

      // AI Hero training: train heroes when army is 10+ and can afford
      tryTrainAIHeroes(ecs, callbacks, snapshot, state);
    }
  },

  /**
   * Reset the AI state (new game). Preserves the current faction settings.
   */
  reset(): void {
    aiStates = aiStates.map(s => createAIState(s.factionId));
  },

  /**
   * Get an AI faction's phase (primary faction when omitted).
   */
  getPhase(factionId?: FactionId) {
    return findState(factionId)?.controller.currentPhase;
  },

  /**
   * Get current AI phase for debug display (primary faction).
   */
  get phase() {
    return aiStates[0]?.controller.currentPhase;
  },

  /**
   * Get number of attack waves sent (primary faction).
   */
  get wavesSent() {
    return aiStates[0]?.controller.wavesSent ?? 0;
  },

  /**
   * Get the AI strategy name for debug display (primary faction).
   */
  get strategyName() {
    return aiStates[0]?.controller.strategyName ?? '';
  },

  /**
   * Dispose.
   */
  dispose(): void {
    for (const s of aiStates) {
      s.controller.reset();
      s.heroTimer = 0;
    }
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
  aiFaction: FactionId,
): AIWorldSnapshot {
  const allIds = cb.getAllEntityIds();

  // Skirmish (free-for-all): every faction that isn't this AI's own is an
  // enemy -- the human player and the other AI factions alike (no teams).
  // Missions (aiAllied): the AI factions are allies, only non-AI factions are
  // enemies. Neutral entities (resources) are only read via isResource.
  const isEnemyFaction = (fid: number): boolean =>
    fid !== aiFaction && !(aiAllied && aiStates.some(s => s.factionId === fid));

  const workers: EntityId[] = [];
  const infantry: EntityId[] = [];
  const ranged: EntityId[] = [];
  const heavy: EntityId[] = [];
  const support: EntityId[] = [];
  const townHalls: EntityId[] = [];
  const barracks: EntityId[] = [];
  const tertiaryBuildings: EntityId[] = [];
  const idleBarracks: EntityId[] = [];
  const housing: EntityId[] = [];
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
        // Check if barracks is complete (construction flag -- buildings never
        // heal, so a damaged barracks must still count as complete)
        if (Building.complete[eid] === 1) {
          barracks.push(eid);
          if (
            !hasComponent(ecsWorld, eid, Production) ||
            c.productionUnitType[eid] === NO_PRODUCTION
          ) {
            idleBarracks.push(eid);
          }
        } else {
          barracksUnderConstruction = true;
        }
      } else if (buildingType === BuildingTypeId.TertiaryResourceBuilding) {
        // Tertiary resource buildings (Mijnschacht / Chocolaterie)
        if (Building.complete[eid] === 1) {
          tertiaryBuildings.push(eid);
        } else {
          tertiaryUnderConstruction = true;
        }
      } else if (buildingType === BuildingTypeId.Housing) {
        housing.push(eid);
      }

      // Check if any completed production building is training (buildings
      // without a Production component read 0 here, not 0xff)
      if (
        Building.complete[eid] === 1 &&
        hasComponent(ecsWorld, eid, Production) &&
        c.productionUnitType[eid] !== 0xff
      ) {
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

    // Gold mines (no faction) -- trees are resources too, skip them
    if (c.isResource[eid] === 1 && Resource.type[eid] === ResourceType.Gold) {
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
    gold: cb.getGold(aiFaction),
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

    population: playerState.getPopulation(aiFaction),
    populationMax: playerState.getPopulationMax(aiFaction),
    idleBarracks,
    housing,

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

function tryTrainAIHeroes(
  c: ECSComponents,
  cb: AISystemCallbacks,
  snapshot: AIWorldSnapshot,
  state: AIFactionState,
): void {
  // Throttle: one check per 150 update calls. AISystem.update() runs once per
  // fixed-update tick (60 Hz), so that is ~2.5 seconds.
  state.heroTimer += 1;
  if (state.heroTimer < 150) return;
  state.heroTimer = 0;

  const aiFactionId = state.factionId;

  // Need 10+ army units before training heroes
  if (snapshot.army.length < 10) return;

  const heroTypes = getHeroTypesForFaction(aiFactionId);
  for (const heroTypeId of heroTypes) {
    if (isHeroActive(aiFactionId, heroTypeId)) continue;

    const arch = HERO_ARCHETYPES[heroTypeId];
    if (cb.getGold(aiFactionId) < arch.costGold) continue;
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

    cb.deductGold(arch.costGold, aiFactionId);
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
      // Heroes are UnitTypeId.Infantry, so DeathSystem counts their death as a
      // military loss -- count the spawn too, or a hero death uncounts a unit.
      playerState.addMilitaryUnit(aiFactionId);
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
  aiFactionId: FactionId,
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
      // Its NavGrid footprint is registered by spawnBuildingEntity().
      buildAIStructure(BuildingTypeId.Barracks, aiFactionId, cmd.targetX, cmd.targetZ, cb);
      break;
    }

    case AICommandType.BuildTertiaryBuilding: {
      if (cmd.targetX == null || cmd.targetZ == null) break;
      // Tertiary resource building (Mijnschacht / Chocolaterie)
      buildAIStructure(BuildingTypeId.TertiaryResourceBuilding, aiFactionId, cmd.targetX, cmd.targetZ, cb);
      break;
    }

    case AICommandType.BuildStructure: {
      if (cmd.buildingType == null || cmd.targetX == null || cmd.targetZ == null) break;
      buildAIStructure(cmd.buildingType, aiFactionId, cmd.targetX, cmd.targetZ, cb);
      break;
    }

    case AICommandType.TrainUnit: {
      if (cmd.targetEntityId == null || cmd.unitType == null) break;

      let cost: number;
      try {
        cost = getFactionUnitArchetype(aiFactionId, cmd.unitType).costGold;
      } catch {
        cost = 50;
      }

      if (!cb.deductGold(cost, aiFactionId)) break;

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

// ---------------------------------------------------------------------------
// AI building placement
// ---------------------------------------------------------------------------

/** Min centre distance between an AI building and any other building (4x4 box + a walkable lane). */
const AI_BUILD_SPACING = 6;
/** Keep AI buildings off the gold mines and the space workers use around them. */
const AI_MINE_CLEARANCE = 7;
/** Keep AI buildings off trees (trees are entities, not NavGrid cells). */
const AI_TREE_CLEARANCE = 3;
/** Rings searched around the preferred spot (world units). */
const AI_SITE_RINGS = [0, 6, 9, 12, 15, 18, 22, 26];

/**
 * Find a free spot for an AI building near (prefX, prefZ): the spot itself
 * first, then rings around it. A spot is free when the regular placement
 * rules pass (no overlap, not on the river, not next to an enemy building),
 * the 4x4 box is clear of NavGrid-blocked cells (river, rock walls, other
 * footprints), it keeps a walkable lane to other buildings and stays clear of
 * gold mines and trees. Returns null when nothing fits.
 */
export function findAIBuildSite(
  world: GameWorld,
  type: BuildingTypeId,
  factionId: FactionId,
  prefX: number,
  prefZ: number,
): { x: number; z: number } | null {
  const grid = getActiveNavGrid();
  const half = (grid?.mapSize ?? MAP_SIZE) / 2 - 4;
  const blockedAt = (x: number, z: number): boolean => grid?.isBlockedAt(x, z) ?? false;
  const terrain = {
    getHeightAt: () => 1,
    isWater: () => false,
    isRiver: (x: number, z: number) => blockedAt(x, z),
  };

  const resources = [...query(world, [Position, Resource, IsResource])];
  const buildings = [...query(world, [Position, Building])];

  const isFree = (x: number, z: number): boolean => {
    if (Math.abs(x) > half || Math.abs(z) > half) return false;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (blockedAt(x + dx, z + dz)) return false;
      }
    }
    for (const b of buildings) {
      if (Math.abs(Position.x[b] - x) < AI_BUILD_SPACING && Math.abs(Position.z[b] - z) < AI_BUILD_SPACING) {
        return false;
      }
    }
    for (const r of resources) {
      const clearance = Resource.type[r] === ResourceType.Gold ? AI_MINE_CLEARANCE : AI_TREE_CLEARANCE;
      const dx = Position.x[r] - x;
      const dz = Position.z[r] - z;
      if (dx * dx + dz * dz < clearance * clearance) return false;
    }
    return validateBuildingPlacement(world, type, factionId, x, z, terrain).valid;
  };

  for (const r of AI_SITE_RINGS) {
    const steps = r === 0 ? 1 : Math.max(8, Math.round((2 * Math.PI * r) / 3));
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = prefX + Math.cos(a) * r;
      const z = prefZ + Math.sin(a) * r;
      if (isFree(x, z)) return { x, z };
    }
  }
  return null;
}

/**
 * Pay for and spawn an AI building at a free site near (prefX, prefZ). Gold
 * is only taken once a site is found, so a crowded base does not eat gold.
 */
function buildAIStructure(
  type: BuildingTypeId,
  factionId: FactionId,
  prefX: number,
  prefZ: number,
  cb: AISystemCallbacks,
): EntityId | null {
  const site = findAIBuildSite(ecsWorld, type, factionId, prefX, prefZ);
  if (!site) return null;
  if (!cb.deductGold(getBuildingCost(type).goldCost, factionId)) return null;
  return cb.spawnBuilding(type, factionId, site.x, site.z);
}
