/**
 * MissionSystem.ts -- Runtime mission logic during gameplay.
 *
 * Responsibilities:
 * - Track objective progress in real-time
 * - Evaluate trigger conditions each frame
 * - Fire trigger actions (messages, spawns, victory)
 * - Track wave state (spawned, defeated)
 * - Calculate star rating at mission end
 * - Communicate with Game via callbacks
 */

import {
  type MissionDefinition,
  type MissionObjective,
  type TriggerCondition,
  type TriggerAction,
  type WaveDefinition,
  type MissionUnitSpawn,
} from './MissionDefinitions';
import { FactionId, BuildingTypeId } from '../types/index';

// ---------------------------------------------------------------------------
// Callback interface -- the Game provides these
// ---------------------------------------------------------------------------

export interface MissionCallbacks {
  /** Show a message overlay (narrator/hint). */
  showMessage: (text: string) => void;
  /** Spawn units on the map at runtime. Returns entity IDs. */
  spawnUnits: (units: MissionUnitSpawn[]) => number[];
  /** Signal victory to the game state machine. */
  triggerVictory: (stars: number, timeSeconds: number, bonusesCompleted: string[]) => void;
  /** Signal defeat. */
  triggerDefeat: () => void;
  /** Query: get current player gold. */
  getPlayerGold: () => number;
  /** Query: has player built a specific building type? */
  hasPlayerBuilding: (buildingType: BuildingTypeId) => boolean;
  /** Query: how many military units does the player have? */
  getPlayerArmyCount: () => number;
  /** Query: has a specific enemy building been destroyed? */
  isEnemyBuildingDestroyed: (factionId: FactionId, buildingType: BuildingTypeId) => boolean;
  /** Query: how many enemy buildings of any type have been destroyed? */
  getDestroyedEnemyBuildingCount: () => number;
  /** Query: how many player workers are alive? */
  getPlayerWorkerCount: () => number;
  /** Query: is the player Town Hall alive? */
  isPlayerTownHallAlive: () => boolean;
  /** Query: total player units alive (all types). */
  getPlayerTotalUnits: () => number;
  /** Query: total AI units alive. */
  getAITotalUnits: () => number;
  /** Query: total military units trained by player so far. */
  getPlayerMilitaryTrained: () => number;
}

// ---------------------------------------------------------------------------
// Objective runtime state
// ---------------------------------------------------------------------------

interface ObjectiveState {
  readonly objective: MissionObjective;
  currentValue: number;
  completed: boolean;
  failed: boolean;
}

// ---------------------------------------------------------------------------
// Wave runtime state
// ---------------------------------------------------------------------------

interface WaveState {
  readonly wave: WaveDefinition;
  spawned: boolean;
  spawnedEntityIds: number[];
  defeated: boolean;
}

// ---------------------------------------------------------------------------
// MissionSystem
// ---------------------------------------------------------------------------

export class MissionSystem {
  private mission: MissionDefinition | null = null;
  private callbacks: MissionCallbacks | null = null;
  private elapsed = 0;
  private active = false;
  private victoryTriggered = false;
  private defeatTriggered = false;

  // Victory confirmation delay: prevents victory firing in the same frame objectives update
  private victoryPendingSince = -1;
  private static readonly VICTORY_CONFIRM_DELAY = 0.5; // seconds

  // Runtime state
  private objectiveStates: ObjectiveState[] = [];
  private firedTriggers = new Set<string>();
  private waveStates: WaveState[] = [];

  // Tracking
  private initialWorkerCount = 0;
  private workersLost = 0;
  private townHallLostDuringMission = false;
  private militaryTrained = 0;
  private wavesDefeated = 0;

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Load a mission definition and start tracking. */
  start(mission: MissionDefinition, callbacks: MissionCallbacks, initialWorkerCount: number): void {
    this.mission = mission;
    this.callbacks = callbacks;
    this.elapsed = 0;
    this.active = true;
    this.victoryTriggered = false;
    this.defeatTriggered = false;
    this.victoryPendingSince = -1;
    this.firedTriggers.clear();
    this.initialWorkerCount = initialWorkerCount;
    this.workersLost = 0;
    this.townHallLostDuringMission = false;
    this.militaryTrained = 0;
    this.wavesDefeated = 0;

    // Initialize objective states
    this.objectiveStates = mission.objectives.map(obj => ({
      objective: obj,
      currentValue: 0,
      completed: false,
      failed: false,
    }));

    // Initialize wave states
    this.waveStates = mission.waves.map(w => ({
      wave: w,
      spawned: false,
      spawnedEntityIds: [],
      defeated: false,
    }));

    console.log(`[MissionSystem] Started mission: ${mission.title}`);
  }

  /** Stop tracking (cleanup). */
  stop(): void {
    this.active = false;
    this.mission = null;
    this.callbacks = null;
  }

  /** Whether the mission system is actively running. */
  get isActive(): boolean {
    return this.active;
  }

  /** Get current mission elapsed time. */
  get elapsedTime(): number {
    return this.elapsed;
  }

  /** Get current objectives and their states (for HUD display). */
  getObjectiveStates(): readonly ObjectiveState[] {
    return this.objectiveStates;
  }

  /** Get wave progress info. */
  getWaveProgress(): { total: number; defeated: number; currentWaveActive: boolean } {
    const total = this.waveStates.length;
    const defeated = this.waveStates.filter(w => w.defeated).length;
    const currentWaveActive = this.waveStates.some(w => w.spawned && !w.defeated);
    return { total, defeated, currentWaveActive };
  }

  // -----------------------------------------------------------------------
  // Notification methods (called by Game when events happen)
  // -----------------------------------------------------------------------

  /** Called when a player worker dies. */
  onWorkerLost(): void {
    this.workersLost++;
  }

  /** Called when the player Town Hall is destroyed. */
  onTownHallLost(): void {
    this.townHallLostDuringMission = true;
  }

  /** Called when a military unit finishes training for the player. */
  onMilitaryTrained(): void {
    this.militaryTrained++;
  }

  // -----------------------------------------------------------------------
  // Update (called every frame from Game.update)
  // -----------------------------------------------------------------------

  update(dt: number): void {
    if (!this.active || !this.mission || !this.callbacks) return;
    if (this.victoryTriggered || this.defeatTriggered) return;

    this.elapsed += dt;

    // 1. Update objective progress
    this.updateObjectives();

    // 2. Check triggers
    this.evaluateTriggers();

    // 3. Check wave states
    this.updateWaves();

    // 4. Check defeat conditions FIRST (defeat takes priority over victory)
    this.checkDefeat();

    // 5. Auto-victory: all non-bonus objectives complete (with confirmation delay)
    this.checkAutoVictory();
  }

  // -----------------------------------------------------------------------
  // Objective tracking
  // -----------------------------------------------------------------------

  private updateObjectives(): void {
    if (!this.callbacks || !this.mission) return;

    for (const state of this.objectiveStates) {
      if (state.completed || state.failed) continue;

      switch (state.objective.type) {
        case 'gather-gold':
          state.currentValue = this.callbacks.getPlayerGold();
          if (state.currentValue >= state.objective.targetValue) {
            state.completed = true;
          }
          break;

        case 'destroy-building':
          state.currentValue = this.callbacks.getDestroyedEnemyBuildingCount();
          if (state.currentValue >= state.objective.targetValue) {
            state.completed = true;
          }
          break;

        case 'survive-waves':
          state.currentValue = this.wavesDefeated;
          if (this.wavesDefeated >= state.objective.targetValue) {
            state.completed = true;
          }
          break;

        case 'train-units':
          state.currentValue = this.callbacks.getPlayerMilitaryTrained();
          if (state.currentValue >= state.objective.targetValue) {
            state.completed = true;
          }
          break;

        case 'build-building':
          if (this.callbacks.hasPlayerBuilding(BuildingTypeId.Barracks)) {
            state.currentValue = 1;
            state.completed = true;
          }
          break;

        case 'no-worker-loss':
          // This is evaluated at mission end; stays "completed" unless a worker dies
          state.completed = this.workersLost === 0;
          state.failed = this.workersLost > 0;
          break;

        case 'no-townhall-loss':
          state.completed = !this.townHallLostDuringMission;
          state.failed = this.townHallLostDuringMission;
          break;

        case 'have-units-at-end':
          // Evaluated continuously, resolved at mission end
          state.currentValue = this.callbacks.getPlayerTotalUnits();
          state.completed = state.currentValue >= state.objective.targetValue;
          break;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Trigger evaluation
  // -----------------------------------------------------------------------

  private evaluateTriggers(): void {
    if (!this.callbacks || !this.mission) return;

    for (const trigger of this.mission.triggers) {
      if (trigger.once && this.firedTriggers.has(trigger.id)) continue;

      if (this.evaluateCondition(trigger.condition)) {
        this.firedTriggers.add(trigger.id);
        this.executeTriggerActions(trigger.actions);
      }
    }
  }

  private evaluateCondition(condition: TriggerCondition): boolean {
    if (!this.callbacks) return false;

    switch (condition.type) {
      case 'time':
        return this.elapsed >= condition.seconds;

      case 'gold-reached':
        return this.callbacks.getPlayerGold() >= condition.amount;

      case 'building-built':
        return this.callbacks.hasPlayerBuilding(condition.buildingType);

      case 'army-count':
        return this.callbacks.getPlayerArmyCount() >= condition.count;

      case 'building-destroyed':
        return this.callbacks.isEnemyBuildingDestroyed(condition.factionId, condition.buildingType);

      case 'wave-defeated':
        return this.waveStates[condition.waveIndex]?.defeated ?? false;

      case 'all-waves-defeated':
        return this.waveStates.length > 0 && this.waveStates.every(w => w.defeated);

      default:
        return false;
    }
  }

  private executeTriggerActions(actions: readonly TriggerAction[]): void {
    if (!this.callbacks) return;

    for (const action of actions) {
      switch (action.type) {
        case 'message':
          this.callbacks.showMessage(action.text);
          break;

        case 'spawn-units':
          this.callbacks.spawnUnits(action.units);
          break;

        case 'spawn-wave': {
          const waveState = this.waveStates[action.waveIndex];
          if (waveState && !waveState.spawned) {
            waveState.spawned = true;
            const ids = this.callbacks.spawnUnits(waveState.wave.units);
            waveState.spawnedEntityIds = ids;
            if (waveState.wave.message) {
              // Wave message is already in the trigger, no double-fire
            }
          }
          break;
        }

        case 'victory':
          this.handleVictory();
          break;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Wave management
  // -----------------------------------------------------------------------

  private updateWaves(): void {
    if (!this.callbacks) return;

    for (const waveState of this.waveStates) {
      if (!waveState.spawned || waveState.defeated) continue;

      // Check if all spawned wave units are dead
      // We check by querying if AI has any units from this wave alive
      // Simple approach: if AI total units from this wave = 0
      const aliveCount = this.callbacks.getAITotalUnits();

      // A wave is defeated when no AI units remain on the map
      // Since we don't track individual wave entities perfectly in ECS,
      // we consider a wave defeated when ALL AI units are dead after it spawned
      if (aliveCount === 0) {
        waveState.defeated = true;
        this.wavesDefeated++;
        console.log(`[MissionSystem] Wave ${waveState.wave.index + 1} defeated! (${this.wavesDefeated}/${this.waveStates.length})`);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Victory / Defeat
  // -----------------------------------------------------------------------

  private checkAutoVictory(): void {
    if (this.victoryTriggered || this.defeatTriggered) return;
    if (!this.callbacks) return;

    // Never grant victory if TownHall is dead (defeat takes priority)
    if (!this.callbacks.isPlayerTownHallAlive()) return;

    const requiredObjectives = this.objectiveStates.filter(s => !s.objective.isBonus);
    const allRequiredComplete = requiredObjectives.length > 0 && requiredObjectives.every(s => s.completed);

    if (allRequiredComplete) {
      // Start confirmation delay to avoid same-frame victory
      if (this.victoryPendingSince < 0) {
        this.victoryPendingSince = this.elapsed;
        return;
      }
      // Wait for the confirmation delay to pass
      if (this.elapsed - this.victoryPendingSince >= MissionSystem.VICTORY_CONFIRM_DELAY) {
        this.handleVictory();
      }
    } else {
      // Objectives no longer all complete -- reset pending timer
      this.victoryPendingSince = -1;
    }
  }

  private handleVictory(): void {
    if (this.victoryTriggered || !this.callbacks || !this.mission) return;

    // Guard: refuse victory if any required objective is incomplete
    this.updateObjectives();
    const requiredIncomplete = this.objectiveStates.filter(s => !s.objective.isBonus && !s.completed);
    if (requiredIncomplete.length > 0) {
      console.log(`[MissionSystem] Victory blocked: ${requiredIncomplete.length} required objectives incomplete`);
      return;
    }

    this.victoryTriggered = true;

    const stars = this.calculateStars();
    const bonusesCompleted = this.objectiveStates
      .filter(s => s.objective.isBonus && s.completed)
      .map(s => s.objective.id);

    console.log(`[MissionSystem] Victory! Stars: ${stars}, Time: ${Math.floor(this.elapsed)}s, Bonuses: ${bonusesCompleted.join(', ')}`);
    this.callbacks.triggerVictory(stars, this.elapsed, bonusesCompleted);
    this.active = false;
  }

  private checkDefeat(): void {
    if (!this.callbacks || !this.mission) return;
    if (this.defeatTriggered || this.victoryTriggered) return;

    // TownHall destroyed = defeat (missionIndex > 0 to skip tutorial mission)
    if (this.mission.missionIndex > 0 && !this.callbacks.isPlayerTownHallAlive()) {
      this.defeatTriggered = true;
      this.victoryPendingSince = -1; // Cancel any pending victory
      this.callbacks.triggerDefeat();
      this.active = false;
      return;
    }

    // All units dead AND no gold to rebuild = defeat
    // Only check after a grace period (10s) so early-game doesn't instantly defeat
    if (this.elapsed > 10) {
      const totalUnits = this.callbacks.getPlayerTotalUnits();
      const gold = this.callbacks.getPlayerGold();
      if (totalUnits === 0 && gold < 50) {
        this.defeatTriggered = true;
        this.victoryPendingSince = -1; // Cancel any pending victory
        this.callbacks.triggerDefeat();
        this.active = false;
      }
    }
  }

  private calculateStars(): number {
    if (!this.mission) return 1;

    const { starThresholds } = this.mission;
    const allBonuses = this.objectiveStates
      .filter(s => s.objective.isBonus)
      .every(s => s.completed);

    // 3 stars: fast time OR all bonuses completed
    if (this.elapsed <= starThresholds.threeStarTime) return 3;
    if (starThresholds.allBonusesGrants3Stars && allBonuses) return 3;

    // 2 stars: moderate time
    if (this.elapsed <= starThresholds.twoStarTime) return 2;

    // 1 star: completed but slow and no bonuses
    return 1;
  }
}
