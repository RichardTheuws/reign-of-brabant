/**
 * AIController -- Computer opponent AI for the PoC
 *
 * Implements a scripted build-order with timer-based attack waves.
 * Difficulty: Easy -- decisions every 2 seconds, simple priority system.
 *
 * Build Order:
 * 1. Start: 3 workers + 1 Town Hall (pre-spawned by MapGenerator)
 * 2. Workers gather gold
 * 3. At 200 gold: build Barracks
 * 4. When Barracks done: train Infantry continuously
 * 5. At 4+ army: scout (move 1 unit to map centre)
 * 6. At 8+ army: attack-move to player's Town Hall
 * 7. Repeat: train more units, send in waves
 *
 * The AI "cheats" slightly: it has perfect knowledge of the player's Town Hall
 * position (no fog of war restriction). This is intentional for the PoC to
 * ensure the AI can always find the player.
 */

import {
  FactionId,
  UnitTypeId,
  BuildingTypeId,
  UnitAIState,
  StrategicAIPhase,
  MAP_SIZE,
  type PlayerState,
  type EntityId,
} from '../types/index';
import { distance2D } from '../utils/math';
import {
  isVergaderingReady,
  activateVergadering,
  getRandstadEfficiencyStacks,
  isWerkoverlegActive,
} from '../systems/BureaucracySystem';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** How often the AI evaluates decisions (seconds). */
const DECISION_INTERVAL = 2.0;

/** Gold cost for a Barracks. */
const BARRACKS_COST = 200;

/** Gold cost for an Infantry unit. */
const INFANTRY_COST = 60;

/** Gold cost for a Ranged unit. */
const RANGED_COST = 80;

/** Gold cost for a Worker. */
const WORKER_COST = 50;

/** Max workers before AI stops training them. */
const MAX_WORKERS = 6;

/** Army size threshold to send a scout. */
const SCOUT_THRESHOLD = 4;

/** Army size threshold to launch an attack. */
const ATTACK_THRESHOLD = 8;

/** Randstad attack threshold: waits for more units due to slow start. */
const RANDSTAD_ATTACK_THRESHOLD = 10;

/** Randstad efficiency stacks needed before switching to aggressive play. */
const RANDSTAD_AGGRESSIVE_STACKS = 7;

/** Time in seconds before AI sends first attack regardless of army size. */
const FORCE_ATTACK_TIME = 300; // 5 minutes

/** Randstad force attack time: later due to slow start. */
const RANDSTAD_FORCE_ATTACK_TIME = 420; // 7 minutes

/** Barracks training time in seconds. */
const BARRACKS_BUILD_TIME = 30;

/** How long each unit takes to train (simplified, same for all). */
const UNIT_TRAIN_TIME = 15;

// ---------------------------------------------------------------------------
// Command interface -- the AI issues commands that the AISystem executes
// ---------------------------------------------------------------------------

export enum AICommandType {
  /** Send workers to gather gold from nearest mine. */
  GatherGold = 'gather_gold',
  /** Build a Barracks at the AI's base area. */
  BuildBarracks = 'build_barracks',
  /** Train a unit from a building. */
  TrainUnit = 'train_unit',
  /** Move a unit to a position (scout). */
  MoveUnit = 'move_unit',
  /** Attack-move army to a position. */
  AttackMove = 'attack_move',
  /** Activate Eindeloze Vergadering at a target point. */
  Vergadering = 'vergadering',
}

export interface AICommand {
  type: AICommandType;
  /** Target entity (e.g. building to train from, unit to command). */
  targetEntityId?: EntityId;
  /** Unit type to train. */
  unitType?: UnitTypeId;
  /** World position target. */
  targetX?: number;
  targetZ?: number;
}

// ---------------------------------------------------------------------------
// State snapshot -- the AISystem provides this each tick
// ---------------------------------------------------------------------------

export interface AIWorldSnapshot {
  /** AI's gold amount. */
  gold: number;
  /** Total elapsed game time in seconds. */
  elapsedTime: number;

  /** AI's worker entity IDs. */
  workers: readonly EntityId[];
  /** AI's infantry entity IDs. */
  infantry: readonly EntityId[];
  /** AI's ranged entity IDs. */
  ranged: readonly EntityId[];
  /** AI's Town Hall entity IDs (should be 1 for PoC). */
  townHalls: readonly EntityId[];
  /** AI's Barracks entity IDs. */
  barracks: readonly EntityId[];

  /** All AI army entities (infantry + ranged). */
  army: readonly EntityId[];

  /** Player's Town Hall positions (attack target). */
  playerTownHallPositions: readonly { x: number; z: number }[];

  /** Gold mine positions (for gathering). */
  goldMinePositions: readonly { eid: EntityId; x: number; z: number; amount: number }[];

  /** AI's spawn position (base). */
  baseX: number;
  baseZ: number;

  /** Entity position lookups. */
  getEntityPosition: (eid: EntityId) => { x: number; z: number } | null;
  /** Entity state lookup. */
  getEntityState: (eid: EntityId) => UnitAIState;

  /** Whether a barracks is currently being constructed. */
  barracksUnderConstruction: boolean;
  /** Whether a unit is currently being trained. */
  isTraining: boolean;

  // -- Randstad Bureaucracy data --

  /** Current efficiency stacks for Randstad faction. */
  efficiencyStacks: number;
  /** Whether werkoverleg is currently active. */
  werkoverlegActive: boolean;
  /** Whether Eindeloze Vergadering is available. */
  vergaderingReady: boolean;

  /** All enemy unit positions (for Vergadering targeting). */
  enemyUnitPositions: readonly { eid: EntityId; x: number; z: number }[];
}

// ---------------------------------------------------------------------------
// AIController
// ---------------------------------------------------------------------------

export class AIController {
  private phase: StrategicAIPhase = StrategicAIPhase.Opening;
  private decisionTimer = 0;
  private hasScouted = false;
  private attackWaveCount = 0;
  private lastArmySize = 0;

  /** Pending commands to be consumed by the AISystem. */
  private pendingCommands: AICommand[] = [];

  /**
   * Main update. Called every fixed-update tick.
   * Only evaluates decisions at DECISION_INTERVAL.
   */
  update(snapshot: AIWorldSnapshot, dt: number): AICommand[] {
    this.pendingCommands = [];

    this.decisionTimer += dt;
    if (this.decisionTimer < DECISION_INTERVAL) {
      return this.pendingCommands;
    }
    this.decisionTimer = 0;

    // Detect current phase
    this.phase = this.detectPhase(snapshot);

    // Run decision tree based on phase
    switch (this.phase) {
      case StrategicAIPhase.Opening:
        this.runOpeningPhase(snapshot);
        break;
      case StrategicAIPhase.Midgame:
        this.runMidgamePhase(snapshot);
        break;
      case StrategicAIPhase.Attack:
        this.runAttackPhase(snapshot);
        break;
    }

    return this.pendingCommands;
  }

  // -----------------------------------------------------------------------
  // Phase Detection
  // -----------------------------------------------------------------------

  private detectPhase(snapshot: AIWorldSnapshot): StrategicAIPhase {
    const armySize = snapshot.army.length;

    // Randstad AI: adjust thresholds for bureaucratic slow start
    const effectiveAttackThreshold = snapshot.efficiencyStacks >= RANDSTAD_AGGRESSIVE_STACKS
      ? ATTACK_THRESHOLD  // With enough stacks, attack at normal threshold
      : RANDSTAD_ATTACK_THRESHOLD; // Otherwise, build a bigger army first

    const effectiveForceTime = RANDSTAD_FORCE_ATTACK_TIME;

    // Force attack after time limit
    if (snapshot.elapsedTime >= effectiveForceTime && armySize >= 3) {
      return StrategicAIPhase.Attack;
    }

    // Attack when army is big enough
    if (armySize >= effectiveAttackThreshold) {
      return StrategicAIPhase.Attack;
    }

    // Still in opening if no barracks
    if (snapshot.barracks.length === 0) {
      return StrategicAIPhase.Opening;
    }

    return StrategicAIPhase.Midgame;
  }

  // -----------------------------------------------------------------------
  // Phase Strategies
  // -----------------------------------------------------------------------

  /**
   * Opening: get workers gathering, save up for Barracks.
   */
  private runOpeningPhase(snapshot: AIWorldSnapshot): void {
    // 1. Ensure all workers are gathering
    this.issueGatherCommands(snapshot);

    // 2. Build barracks when affordable
    if (
      snapshot.barracks.length === 0 &&
      !snapshot.barracksUnderConstruction &&
      snapshot.gold >= BARRACKS_COST
    ) {
      this.issueBuildBarracks(snapshot);
    }

    // 3. Train extra workers if we have few
    if (snapshot.workers.length < MAX_WORKERS && snapshot.gold >= WORKER_COST) {
      this.issueTrainWorker(snapshot);
    }
  }

  /**
   * Midgame: train army units, scout, prepare for attack.
   */
  private runMidgamePhase(snapshot: AIWorldSnapshot): void {
    // 1. Keep workers gathering
    this.issueGatherCommands(snapshot);

    // 2. Train workers if below minimum
    if (snapshot.workers.length < 4 && snapshot.gold >= WORKER_COST) {
      this.issueTrainWorker(snapshot);
    }

    // 3. Train army units
    if (!snapshot.isTraining && snapshot.barracks.length > 0) {
      this.issueTrainArmy(snapshot);
    }

    // 4. Scout with first military unit
    if (!this.hasScouted && snapshot.army.length >= SCOUT_THRESHOLD) {
      this.issueScout(snapshot);
    }
  }

  /**
   * Attack: send army to player base, continue training reinforcements.
   * Randstad AI: use Eindeloze Vergadering before major attacks.
   */
  private runAttackPhase(snapshot: AIWorldSnapshot): void {
    // 1. Workers keep gathering
    this.issueGatherCommands(snapshot);

    // 2. Keep training
    if (!snapshot.isTraining && snapshot.barracks.length > 0) {
      this.issueTrainArmy(snapshot);
    }

    // 3. Try to use Eindeloze Vergadering before attacking
    if (snapshot.vergaderingReady && snapshot.enemyUnitPositions.length >= 3) {
      this.issueVergadering(snapshot);
    }

    // 4. Send attack wave (Randstad uses adjusted threshold)
    const effectiveThreshold = snapshot.efficiencyStacks >= RANDSTAD_AGGRESSIVE_STACKS
      ? ATTACK_THRESHOLD : RANDSTAD_ATTACK_THRESHOLD;

    if (snapshot.army.length >= effectiveThreshold || snapshot.army.length > this.lastArmySize + 2) {
      this.issueAttackCommands(snapshot);
      this.lastArmySize = 0; // Reset after sending wave
      this.attackWaveCount++;
    }
  }

  // -----------------------------------------------------------------------
  // Command Issuers
  // -----------------------------------------------------------------------

  /**
   * Send idle workers to gather from the nearest gold mine.
   */
  private issueGatherCommands(snapshot: AIWorldSnapshot): void {
    for (const workerId of snapshot.workers) {
      const state = snapshot.getEntityState(workerId);

      // Only command idle workers
      if (state !== UnitAIState.Idle) continue;

      // Find nearest gold mine with resources
      const workerPos = snapshot.getEntityPosition(workerId);
      if (!workerPos) continue;

      const nearestMine = this.findNearestGoldMine(workerPos.x, workerPos.z, snapshot);
      if (nearestMine) {
        this.pendingCommands.push({
          type: AICommandType.GatherGold,
          targetEntityId: workerId,
          targetX: nearestMine.x,
          targetZ: nearestMine.z,
        });
      }
    }
  }

  /**
   * Place a Barracks near the AI base.
   */
  private issueBuildBarracks(snapshot: AIWorldSnapshot): void {
    // Place barracks offset from base
    const offsetX = snapshot.baseX + (snapshot.baseX > 0 ? -8 : 8);
    const offsetZ = snapshot.baseZ + (snapshot.baseZ > 0 ? -8 : 8);

    this.pendingCommands.push({
      type: AICommandType.BuildBarracks,
      targetX: offsetX,
      targetZ: offsetZ,
    });
  }

  /**
   * Train a worker from the Town Hall.
   */
  private issueTrainWorker(snapshot: AIWorldSnapshot): void {
    if (snapshot.townHalls.length === 0) return;

    this.pendingCommands.push({
      type: AICommandType.TrainUnit,
      targetEntityId: snapshot.townHalls[0],
      unitType: UnitTypeId.Worker,
    });
  }

  /**
   * Train army units from Barracks.
   * Mix of infantry (cheap) and ranged (more expensive).
   */
  private issueTrainArmy(snapshot: AIWorldSnapshot): void {
    if (snapshot.barracks.length === 0) return;

    const barracksId = snapshot.barracks[0];

    // Prefer infantry when gold is low, mix in ranged when gold is high
    if (snapshot.gold >= RANGED_COST && snapshot.infantry.length > snapshot.ranged.length * 2) {
      // Train ranged to balance composition
      this.pendingCommands.push({
        type: AICommandType.TrainUnit,
        targetEntityId: barracksId,
        unitType: UnitTypeId.Ranged,
      });
    } else if (snapshot.gold >= INFANTRY_COST) {
      // Train infantry (bread and butter)
      this.pendingCommands.push({
        type: AICommandType.TrainUnit,
        targetEntityId: barracksId,
        unitType: UnitTypeId.Infantry,
      });
    }
  }

  /**
   * Send 1 unit to scout the centre of the map.
   */
  private issueScout(snapshot: AIWorldSnapshot): void {
    if (snapshot.army.length === 0) return;

    const scoutId = snapshot.army[0];

    this.pendingCommands.push({
      type: AICommandType.MoveUnit,
      targetEntityId: scoutId,
      targetX: 0, // Map centre
      targetZ: 0,
    });

    this.hasScouted = true;
  }

  /**
   * Attack-move the entire army toward the player's Town Hall.
   */
  private issueAttackCommands(snapshot: AIWorldSnapshot): void {
    // Find player town hall position
    let attackX = -MAP_SIZE / 4;
    let attackZ = -MAP_SIZE / 4;

    if (snapshot.playerTownHallPositions.length > 0) {
      attackX = snapshot.playerTownHallPositions[0].x;
      attackZ = snapshot.playerTownHallPositions[0].z;
    }

    // Send all army units
    for (const unitId of snapshot.army) {
      this.pendingCommands.push({
        type: AICommandType.AttackMove,
        targetEntityId: unitId,
        targetX: attackX,
        targetZ: attackZ,
      });
    }

    this.lastArmySize = snapshot.army.length;
  }

  /**
   * Use Eindeloze Vergadering: target the densest cluster of enemy units.
   */
  private issueVergadering(snapshot: AIWorldSnapshot): void {
    if (snapshot.enemyUnitPositions.length === 0) return;

    // Find the centroid of enemy units as the best target
    let sumX = 0;
    let sumZ = 0;
    for (const pos of snapshot.enemyUnitPositions) {
      sumX += pos.x;
      sumZ += pos.z;
    }
    const targetX = sumX / snapshot.enemyUnitPositions.length;
    const targetZ = sumZ / snapshot.enemyUnitPositions.length;

    this.pendingCommands.push({
      type: AICommandType.Vergadering,
      targetX,
      targetZ,
    });
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Find the nearest gold mine with resources remaining.
   */
  private findNearestGoldMine(
    x: number,
    z: number,
    snapshot: AIWorldSnapshot,
  ): { eid: EntityId; x: number; z: number } | null {
    let bestMine: { eid: EntityId; x: number; z: number } | null = null;
    let bestDist = Infinity;

    for (const mine of snapshot.goldMinePositions) {
      if (mine.amount <= 0) continue;

      const dist = distance2D(x, z, mine.x, mine.z);
      if (dist < bestDist) {
        bestDist = dist;
        bestMine = mine;
      }
    }

    return bestMine;
  }

  /**
   * Reset the AI state (e.g. after army is wiped).
   */
  reset(): void {
    this.phase = StrategicAIPhase.Opening;
    this.decisionTimer = 0;
    this.hasScouted = false;
    this.attackWaveCount = 0;
    this.lastArmySize = 0;
    this.pendingCommands = [];
  }

  /**
   * Get the current AI phase for debug display.
   */
  get currentPhase(): StrategicAIPhase {
    return this.phase;
  }

  /**
   * Get the number of attack waves sent.
   */
  get wavesSent(): number {
    return this.attackWaveCount;
  }
}
