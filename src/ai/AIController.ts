/**
 * AIController -- Computer opponent AI
 *
 * Faction-aware AI that supports all 4 factions with unique strategies:
 *
 * **Brabanders (0):** "Gezelligheid Rush"
 *   - Cluster units, early aggression, Infantry-heavy (2:1 vs Ranged)
 *   - Attack threshold: 8 units
 *
 * **Randstad (1):** "Corporate Expansion"
 *   - Slow start, economy-first, balanced army
 *   - Attack threshold: 10 (or 8 with enough efficiency stacks)
 *
 * **Limburgers (2):** "Underground Ambush"
 *   - Build Mijnschacht early, defensive posture, elite strike force
 *   - Attack threshold: 6 units, prefer Heavy + Infantry
 *
 * **Belgen (3):** "Diplomatic Siege"
 *   - Build Chocolaterie early, defensive late-game, biggest army
 *   - Attack threshold: 12 units, prefer Ranged + Support
 *
 * The AI "cheats" slightly: it has perfect knowledge of the player's Town Hall
 * position (no fog of war restriction). This is intentional for the PoC to
 * ensure the AI can always find the player.
 */

import {
  FactionId,
  UnitTypeId,
  UnitAIState,
  StrategicAIPhase,
  MAP_SIZE,
  type EntityId,
} from '../types/index';
import { getFactionUnitArchetype } from '../data/factionData';
import { distance2D } from '../utils/math';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** How often the AI evaluates decisions (seconds). */
const DECISION_INTERVAL = 2.0;

/** Gold cost for a Barracks. */
const BARRACKS_COST = 200;

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
// Per-Faction Strategy Configuration
// ---------------------------------------------------------------------------

interface FactionStrategy {
  /** Name of the strategy for debug/logging. */
  name: string;
  /** Army size threshold to launch an attack. */
  attackThreshold: number;
  /** Time in seconds before forcing an attack regardless of army size. */
  forceAttackTime: number;
  /** Max workers the AI will train. */
  maxWorkers: number;
  /** Preferred unit training order (first = highest priority). */
  preferredUnits: UnitTypeId[];
  /** Ratio control: how many of preferredUnits[0] per preferredUnits[1]. */
  primaryToSecondaryRatio: number;
  /** Whether to build tertiary resource building early. */
  buildTertiaryEarly: boolean;
  /** Whether the faction clusters units (Brabanders Gezelligheid). */
  clusterUnits: boolean;
  /** Whether the faction is defensive in opening/midgame. */
  defensive: boolean;
  /** Whether to use Vergadering ability (Randstad-specific). */
  useVergadering: boolean;
}

const FACTION_STRATEGIES: Record<FactionId, FactionStrategy> = {
  // Brabanders: "Gezelligheid Rush" -- cluster units, early aggression
  [FactionId.Brabanders]: {
    name: 'Gezelligheid Rush',
    attackThreshold: 8,
    forceAttackTime: FORCE_ATTACK_TIME,
    maxWorkers: 5,
    preferredUnits: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    primaryToSecondaryRatio: 2, // 2 Infantry per 1 Ranged
    buildTertiaryEarly: false,
    clusterUnits: true,
    defensive: false,
    useVergadering: false,
  },

  // Randstad: "Corporate Expansion" -- slow start, balanced army
  [FactionId.Randstad]: {
    name: 'Corporate Expansion',
    attackThreshold: RANDSTAD_ATTACK_THRESHOLD,
    forceAttackTime: RANDSTAD_FORCE_ATTACK_TIME,
    maxWorkers: MAX_WORKERS,
    preferredUnits: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    primaryToSecondaryRatio: 2, // Balanced with slight Infantry preference
    buildTertiaryEarly: false,
    clusterUnits: false,
    defensive: false,
    useVergadering: true,
  },

  // Limburgers: "Underground Ambush" -- elite strike force, surprise attacks
  [FactionId.Limburgers]: {
    name: 'Underground Ambush',
    attackThreshold: 6,
    forceAttackTime: FORCE_ATTACK_TIME,
    maxWorkers: 5,
    preferredUnits: [UnitTypeId.Heavy, UnitTypeId.Infantry],
    primaryToSecondaryRatio: 1, // Equal Heavy and Infantry
    buildTertiaryEarly: true, // Build Mijnschacht early for Kolen
    clusterUnits: false,
    defensive: true,
    useVergadering: false,
  },

  // Belgen: "Diplomatic Siege" -- defensive, late-game, biggest army
  [FactionId.Belgen]: {
    name: 'Diplomatic Siege',
    attackThreshold: 12,
    forceAttackTime: 480, // 8 minutes -- very late
    maxWorkers: MAX_WORKERS,
    preferredUnits: [UnitTypeId.Ranged, UnitTypeId.Support],
    primaryToSecondaryRatio: 2, // 2 Ranged per 1 Support
    buildTertiaryEarly: true, // Build Chocolaterie early for Chocolade
    clusterUnits: false,
    defensive: true,
    useVergadering: false,
  },
};

// ---------------------------------------------------------------------------
// Command interface -- the AI issues commands that the AISystem executes
// ---------------------------------------------------------------------------

export enum AICommandType {
  /** Send workers to gather gold from nearest mine. */
  GatherGold = 'gather_gold',
  /** Build a Barracks at the AI's base area. */
  BuildBarracks = 'build_barracks',
  /** Build a tertiary resource building (Mijnschacht / Chocolaterie). */
  BuildTertiaryBuilding = 'build_tertiary_building',
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
  /** AI's heavy unit entity IDs. */
  heavy: readonly EntityId[];
  /** AI's support unit entity IDs. */
  support: readonly EntityId[];
  /** AI's Town Hall entity IDs (should be 1 for PoC). */
  townHalls: readonly EntityId[];
  /** AI's Barracks entity IDs. */
  barracks: readonly EntityId[];
  /** AI's Tertiary Resource Building entity IDs (Mijnschacht / Chocolaterie). */
  tertiaryBuildings: readonly EntityId[];

  /** All AI army entities (infantry + ranged + heavy + support). */
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
  /** Whether a tertiary resource building is under construction. */
  tertiaryUnderConstruction: boolean;
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
  /** The faction this AI plays as. Determines strategy. */
  readonly factionId: FactionId;

  /** The active strategy config derived from factionId. */
  private readonly strategy: FactionStrategy;

  private phase: StrategicAIPhase = StrategicAIPhase.Opening;
  private decisionTimer = 0;
  private hasScouted = false;
  private attackWaveCount = 0;
  private lastArmySize = 0;

  /** Pending commands to be consumed by the AISystem. */
  private pendingCommands: AICommand[] = [];

  constructor(factionId: FactionId = FactionId.Randstad) {
    this.factionId = factionId;
    this.strategy = FACTION_STRATEGIES[factionId] ?? FACTION_STRATEGIES[FactionId.Randstad];
  }

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

    // Calculate effective attack threshold
    let effectiveAttackThreshold = this.strategy.attackThreshold;

    // Randstad special: efficiency stacks can lower threshold
    if (this.factionId === FactionId.Randstad) {
      effectiveAttackThreshold = snapshot.efficiencyStacks >= RANDSTAD_AGGRESSIVE_STACKS
        ? ATTACK_THRESHOLD // With enough stacks, attack at base threshold
        : RANDSTAD_ATTACK_THRESHOLD;
    }

    const effectiveForceTime = this.strategy.forceAttackTime;

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
   * Faction-specific: Limburgers/Belgen prioritize tertiary building.
   */
  private runOpeningPhase(snapshot: AIWorldSnapshot): void {
    // 1. Ensure all workers are gathering
    this.issueGatherCommands(snapshot);

    // 2. Faction-specific: build tertiary resource building early
    if (this.strategy.buildTertiaryEarly) {
      this.tryBuildTertiaryBuilding(snapshot);
    }

    // 3. Build barracks when affordable
    if (
      snapshot.barracks.length === 0 &&
      !snapshot.barracksUnderConstruction &&
      snapshot.gold >= BARRACKS_COST
    ) {
      this.issueBuildBarracks(snapshot);
    }

    // 4. Train extra workers if we have few
    if (snapshot.workers.length < this.strategy.maxWorkers && snapshot.gold >= this.getUnitCost(UnitTypeId.Worker)) {
      this.issueTrainWorker(snapshot);
    }
  }

  /**
   * Midgame: train army units, scout, prepare for attack.
   * Faction-specific army composition and building priorities.
   */
  private runMidgamePhase(snapshot: AIWorldSnapshot): void {
    // 1. Keep workers gathering
    this.issueGatherCommands(snapshot);

    // 2. Train workers if below minimum
    if (snapshot.workers.length < 4 && snapshot.gold >= this.getUnitCost(UnitTypeId.Worker)) {
      this.issueTrainWorker(snapshot);
    }

    // 3. Faction-specific: keep building tertiary if needed
    if (this.strategy.buildTertiaryEarly) {
      this.tryBuildTertiaryBuilding(snapshot);
    }

    // 4. Train army units (faction-specific composition)
    if (!snapshot.isTraining && snapshot.barracks.length > 0) {
      this.issueTrainArmy(snapshot);
    }

    // 5. Scout with first military unit (defensive factions skip early scouting)
    if (!this.hasScouted && snapshot.army.length >= SCOUT_THRESHOLD) {
      if (!this.strategy.defensive || snapshot.army.length >= this.strategy.attackThreshold - 2) {
        this.issueScout(snapshot);
      }
    }

    // 6. Brabanders: cluster units near base for Gezelligheid bonus
    if (this.strategy.clusterUnits) {
      this.issueClusterCommands(snapshot);
    }
  }

  /**
   * Attack: send army to player base, continue training reinforcements.
   * Faction-specific: Randstad uses Vergadering, Brabanders rush clustered.
   */
  private runAttackPhase(snapshot: AIWorldSnapshot): void {
    // 1. Workers keep gathering
    this.issueGatherCommands(snapshot);

    // 2. Keep training
    if (!snapshot.isTraining && snapshot.barracks.length > 0) {
      this.issueTrainArmy(snapshot);
    }

    // 3. Randstad: try to use Eindeloze Vergadering before attacking
    if (this.strategy.useVergadering && snapshot.vergaderingReady && snapshot.enemyUnitPositions.length >= 3) {
      this.issueVergadering(snapshot);
    }

    // 4. Send attack wave when threshold is met
    const effectiveThreshold = this.getEffectiveAttackThreshold(snapshot);

    if (snapshot.army.length >= effectiveThreshold || snapshot.army.length > this.lastArmySize + 2) {
      this.issueAttackCommands(snapshot);
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
   * Try to build a tertiary resource building (Mijnschacht / Chocolaterie).
   * Only for factions that benefit from early tertiary resources.
   */
  private tryBuildTertiaryBuilding(snapshot: AIWorldSnapshot): void {
    // Don't build if we already have one or one is under construction
    if (snapshot.tertiaryBuildings.length > 0 || snapshot.tertiaryUnderConstruction) return;

    // Need at least a barracks first (don't delay military)
    if (snapshot.barracks.length === 0) return;

    // Tertiary building costs same as barracks for simplicity
    if (snapshot.gold < BARRACKS_COST) return;

    // Place offset from barracks in opposite direction
    const offsetX = snapshot.baseX + (snapshot.baseX > 0 ? -16 : 16);
    const offsetZ = snapshot.baseZ + (snapshot.baseZ > 0 ? -4 : 4);

    this.pendingCommands.push({
      type: AICommandType.BuildTertiaryBuilding,
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
   * Train army units from Barracks with faction-specific composition.
   *
   * Each faction has preferred unit types and a ratio controlling the mix.
   * Falls back to Infantry if the preferred unit type can't be afforded.
   */
  private issueTrainArmy(snapshot: AIWorldSnapshot): void {
    if (snapshot.barracks.length === 0) return;

    const barracksId = snapshot.barracks[0];
    const primary = this.strategy.preferredUnits[0];
    const secondary = this.strategy.preferredUnits[1] ?? primary;
    const ratio = this.strategy.primaryToSecondaryRatio;

    // Count current units by type for ratio balancing
    const primaryCount = this.getUnitCount(snapshot, primary);
    const secondaryCount = this.getUnitCount(snapshot, secondary);

    // Determine which unit to train based on ratio
    const shouldTrainSecondary = primaryCount >= secondaryCount * ratio && secondaryCount >= 0;
    const unitToTrain = shouldTrainSecondary ? secondary : primary;
    const cost = this.getUnitCost(unitToTrain);

    if (snapshot.gold >= cost) {
      this.pendingCommands.push({
        type: AICommandType.TrainUnit,
        targetEntityId: barracksId,
        unitType: unitToTrain,
      });
    } else if (snapshot.gold >= this.getUnitCost(UnitTypeId.Infantry) && unitToTrain !== UnitTypeId.Infantry) {
      // Fallback: train Infantry if we can't afford the preferred unit
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
   * Brabanders: cluster idle army units near base for Gezelligheid bonus.
   * Only commands idle units -- doesn't interrupt units already moving/fighting.
   */
  private issueClusterCommands(snapshot: AIWorldSnapshot): void {
    // Rally point: near the base
    const rallyX = snapshot.baseX + (snapshot.baseX > 0 ? -4 : 4);
    const rallyZ = snapshot.baseZ + (snapshot.baseZ > 0 ? -4 : 4);

    for (const unitId of snapshot.army) {
      const state = snapshot.getEntityState(unitId);
      if (state !== UnitAIState.Idle) continue;

      const pos = snapshot.getEntityPosition(unitId);
      if (!pos) continue;

      // Only command units that are far from the rally point
      const dist = distance2D(pos.x, pos.z, rallyX, rallyZ);
      if (dist > 10) {
        this.pendingCommands.push({
          type: AICommandType.MoveUnit,
          targetEntityId: unitId,
          targetX: rallyX + (Math.random() - 0.5) * 6, // Slight spread
          targetZ: rallyZ + (Math.random() - 0.5) * 6,
        });
      }
    }
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
   * Get the effective attack threshold, accounting for faction-specific modifiers.
   */
  private getEffectiveAttackThreshold(snapshot: AIWorldSnapshot): number {
    if (this.factionId === FactionId.Randstad) {
      return snapshot.efficiencyStacks >= RANDSTAD_AGGRESSIVE_STACKS
        ? ATTACK_THRESHOLD
        : RANDSTAD_ATTACK_THRESHOLD;
    }
    return this.strategy.attackThreshold;
  }

  /**
   * Get the count of a specific unit type from the snapshot.
   */
  private getUnitCount(snapshot: AIWorldSnapshot, unitType: UnitTypeId): number {
    switch (unitType) {
      case UnitTypeId.Infantry: return snapshot.infantry.length;
      case UnitTypeId.Ranged: return snapshot.ranged.length;
      case UnitTypeId.Heavy: return snapshot.heavy.length;
      case UnitTypeId.Support: return snapshot.support.length;
      default: return 0;
    }
  }

  /**
   * Get the gold cost for a unit type.
   */
  private getUnitCost(unitType: UnitTypeId): number {
    try {
      return getFactionUnitArchetype(this.factionId, unitType).costGold;
    } catch {
      return 50;
    }
  }

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

  /**
   * Get the strategy name for debug display.
   */
  get strategyName(): string {
    return this.strategy.name;
  }
}
