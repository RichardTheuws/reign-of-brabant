/**
 * Reign of Brabant -- Tech Tree System
 *
 * Manages upgrades researched at the Blacksmith (Smederij).
 * Each upgrade has a cost, research time, optional prerequisites, and an effect
 * that is applied to all existing and future units of the researching faction.
 *
 * Design:
 * - One research at a time per Blacksmith (tracked per building entity).
 * - Costs are gold-only for now; interface supports {gold, wood?} for future.
 * - When research completes, stat bonuses are applied retroactively to all
 *   existing units AND are tracked so newly created units also receive them.
 */

import { query, hasComponent } from 'bitecs';
import {
  Faction,
  UnitType,
  Attack,
  Armor,
  Movement,
  Building,
} from '../ecs/components';
import { IsUnit, IsBuilding, IsDead } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import {
  FactionId,
  UnitTypeId,
  UpgradeId,
} from '../types/index';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Upgrade cost interface (future-proof for wood)
// ---------------------------------------------------------------------------

export interface UpgradeCost {
  readonly gold: number;
  readonly wood?: number;
}

// ---------------------------------------------------------------------------
// Upgrade definition
// ---------------------------------------------------------------------------

export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly name: string;
  readonly description: string;
  readonly cost: UpgradeCost;
  /** Research duration in seconds. */
  readonly researchTime: number;
  /** Prerequisite upgrade that must be completed first. */
  readonly prerequisite: UpgradeId | null;
  /** Which unit types this upgrade affects. null = all unit types. */
  readonly affectsUnitTypes: readonly UnitTypeId[] | null;
  /** Flat bonus to Attack.damage. */
  readonly bonusDamage: number;
  /** Flat bonus to Armor.value. */
  readonly bonusArmor: number;
  /** Multiplicative speed bonus (e.g., 0.10 = +10%). Applied on top of base speed. */
  readonly bonusSpeedFraction: number;
}

// ---------------------------------------------------------------------------
// Upgrade data table
// ---------------------------------------------------------------------------

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  // UpgradeId.MeleeAttack1 = 0
  {
    id: UpgradeId.MeleeAttack1,
    name: 'Zwaardvechten I',
    description: 'Infanterie krijgt +2 aanval.',
    cost: { gold: 150 },
    researchTime: 30,
    prerequisite: null,
    affectsUnitTypes: [UnitTypeId.Infantry],
    bonusDamage: 2,
    bonusArmor: 0,
    bonusSpeedFraction: 0,
  },
  // UpgradeId.MeleeAttack2 = 1
  {
    id: UpgradeId.MeleeAttack2,
    name: 'Zwaardvechten II',
    description: 'Infanterie krijgt nog +2 aanval.',
    cost: { gold: 250 },
    researchTime: 45,
    prerequisite: UpgradeId.MeleeAttack1,
    affectsUnitTypes: [UnitTypeId.Infantry],
    bonusDamage: 2,
    bonusArmor: 0,
    bonusSpeedFraction: 0,
  },
  // UpgradeId.RangedAttack1 = 2
  {
    id: UpgradeId.RangedAttack1,
    name: 'Boogschieten I',
    description: 'Afstandstroepen krijgen +2 aanval.',
    cost: { gold: 150 },
    researchTime: 30,
    prerequisite: null,
    affectsUnitTypes: [UnitTypeId.Ranged],
    bonusDamage: 2,
    bonusArmor: 0,
    bonusSpeedFraction: 0,
  },
  // UpgradeId.RangedAttack2 = 3
  {
    id: UpgradeId.RangedAttack2,
    name: 'Boogschieten II',
    description: 'Afstandstroepen krijgen nog +2 aanval.',
    cost: { gold: 250 },
    researchTime: 45,
    prerequisite: UpgradeId.RangedAttack1,
    affectsUnitTypes: [UnitTypeId.Ranged],
    bonusDamage: 2,
    bonusArmor: 0,
    bonusSpeedFraction: 0,
  },
  // UpgradeId.ArmorUpgrade1 = 4
  {
    id: UpgradeId.ArmorUpgrade1,
    name: 'Bepantsering I',
    description: 'Alle eenheden krijgen +1 bepantsering.',
    cost: { gold: 200 },
    researchTime: 35,
    prerequisite: null,
    affectsUnitTypes: null,
    bonusDamage: 0,
    bonusArmor: 1,
    bonusSpeedFraction: 0,
  },
  // UpgradeId.ArmorUpgrade2 = 5
  {
    id: UpgradeId.ArmorUpgrade2,
    name: 'Bepantsering II',
    description: 'Alle eenheden krijgen nog +1 bepantsering.',
    cost: { gold: 300 },
    researchTime: 50,
    prerequisite: UpgradeId.ArmorUpgrade1,
    affectsUnitTypes: null,
    bonusDamage: 0,
    bonusArmor: 1,
    bonusSpeedFraction: 0,
  },
  // UpgradeId.MoveSpeed1 = 6
  {
    id: UpgradeId.MoveSpeed1,
    name: 'Snelle Mars I',
    description: 'Alle eenheden bewegen 10% sneller.',
    cost: { gold: 175 },
    researchTime: 40,
    prerequisite: null,
    affectsUnitTypes: null,
    bonusDamage: 0,
    bonusArmor: 0,
    bonusSpeedFraction: 0.10,
  },
];

/** Lookup upgrade definition by id. */
export function getUpgradeDefinition(id: UpgradeId): UpgradeDefinition {
  return UPGRADE_DEFINITIONS[id];
}

// ---------------------------------------------------------------------------
// Per-Blacksmith research state
// ---------------------------------------------------------------------------

interface ActiveResearch {
  upgradeId: UpgradeId;
  elapsed: number;
  duration: number;
}

// ---------------------------------------------------------------------------
// Per-faction research state
// ---------------------------------------------------------------------------

interface FactionTechState {
  /** Set of completed upgrade ids. */
  completed: Set<UpgradeId>;
  /** Active research keyed by Blacksmith entity id. */
  activeResearch: Map<number, ActiveResearch>;
}

// ---------------------------------------------------------------------------
// TechTreeSystem class
// ---------------------------------------------------------------------------

export class TechTreeSystem {
  private factions: Map<number, FactionTechState> = new Map();

  constructor() {
    this.reset();
  }

  /** Reset all research state (new game). */
  reset(): void {
    this.factions.clear();
    for (let i = 0; i < 4; i++) {
      this.factions.set(i, { completed: new Set(), activeResearch: new Map() });
    }
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /** Check if a faction has completed a specific upgrade. */
  isResearched(factionId: number, upgradeId: UpgradeId): boolean {
    return this.getFactionState(factionId).completed.has(upgradeId);
  }

  /** Check if a specific Blacksmith is currently researching. */
  isResearching(blacksmithEid: number, factionId: number): boolean {
    return this.getFactionState(factionId).activeResearch.has(blacksmithEid);
  }

  /** Get research progress for a Blacksmith. Returns null if not researching. */
  getResearchProgress(blacksmithEid: number, factionId: number): { upgradeId: UpgradeId; progress: number; remaining: number } | null {
    const active = this.getFactionState(factionId).activeResearch.get(blacksmithEid);
    if (!active) return null;
    const progress = Math.min(active.elapsed / active.duration, 1);
    const remaining = Math.max(active.duration - active.elapsed, 0);
    return { upgradeId: active.upgradeId, progress, remaining };
  }

  /** Get set of completed upgrade ids for a faction. */
  getCompleted(factionId: number): ReadonlySet<UpgradeId> {
    return this.getFactionState(factionId).completed;
  }

  /** Check if an upgrade's prerequisites are met for a faction. */
  canResearch(factionId: number, upgradeId: UpgradeId): boolean {
    const def = getUpgradeDefinition(upgradeId);
    const state = this.getFactionState(factionId);
    // Already researched
    if (state.completed.has(upgradeId)) return false;
    // Check prerequisite
    if (def.prerequisite !== null && !state.completed.has(def.prerequisite)) return false;
    return true;
  }

  // -------------------------------------------------------------------------
  // Commands
  // -------------------------------------------------------------------------

  /**
   * Start researching an upgrade at a specific Blacksmith.
   * Returns true if research started successfully.
   */
  startResearch(factionId: number, blacksmithEid: number, upgradeId: UpgradeId): boolean {
    const state = this.getFactionState(factionId);
    const def = getUpgradeDefinition(upgradeId);

    // Validate: not already researched
    if (state.completed.has(upgradeId)) return false;

    // Validate: prerequisites met
    if (def.prerequisite !== null && !state.completed.has(def.prerequisite)) return false;

    // Validate: Blacksmith not already researching
    if (state.activeResearch.has(blacksmithEid)) return false;

    // Validate: can afford gold
    if (!playerState.canAfford(factionId, def.cost.gold)) return false;

    // Deduct cost
    playerState.spend(factionId, def.cost.gold);

    // Start research
    state.activeResearch.set(blacksmithEid, {
      upgradeId,
      elapsed: 0,
      duration: def.researchTime,
    });

    // Emit event
    eventBus.emit('research-started', {
      factionId: factionId as FactionId,
      upgradeId,
      upgradeName: def.name,
    });

    return true;
  }

  // -------------------------------------------------------------------------
  // Update (called every frame from the system pipeline)
  // -------------------------------------------------------------------------

  update(world: GameWorld, dt: number): void {
    for (const [factionId, state] of this.factions) {
      const toComplete: Array<{ blacksmithEid: number; upgradeId: UpgradeId }> = [];

      for (const [blacksmithEid, research] of state.activeResearch) {
        // Verify Blacksmith still exists and is complete
        if (!hasComponent(world, blacksmithEid, IsBuilding) ||
            hasComponent(world, blacksmithEid, IsDead) ||
            Building.complete[blacksmithEid] !== 1) {
          // Blacksmith destroyed or not complete -- cancel research (gold is lost)
          state.activeResearch.delete(blacksmithEid);
          continue;
        }

        research.elapsed += dt;
        if (research.elapsed >= research.duration) {
          toComplete.push({ blacksmithEid, upgradeId: research.upgradeId });
        }
      }

      // Complete researches
      for (const { blacksmithEid, upgradeId } of toComplete) {
        state.activeResearch.delete(blacksmithEid);
        state.completed.add(upgradeId);
        const def = getUpgradeDefinition(upgradeId);

        // Apply upgrade to all existing units of this faction
        this.applyUpgradeToExistingUnits(world, factionId, def);

        // Emit event
        eventBus.emit('research-completed', {
          factionId: factionId as FactionId,
          upgradeId,
          upgradeName: def.name,
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Apply upgrades
  // -------------------------------------------------------------------------

  /**
   * Apply a single upgrade to all existing units of a faction.
   */
  private applyUpgradeToExistingUnits(world: GameWorld, factionId: number, def: UpgradeDefinition): void {
    const units = query(world, [Faction, UnitType, IsUnit]);
    for (const eid of units) {
      if (Faction.id[eid] !== factionId) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      this.applyUpgradeToEntity(eid, def);
    }
  }

  /**
   * Apply a single upgrade definition's bonuses to one entity.
   */
  private applyUpgradeToEntity(eid: number, def: UpgradeDefinition): void {
    const unitType = UnitType.id[eid] as UnitTypeId;

    // Check if this upgrade affects this unit type
    if (def.affectsUnitTypes !== null && !def.affectsUnitTypes.includes(unitType)) return;

    if (def.bonusDamage !== 0) {
      Attack.damage[eid] += def.bonusDamage;
    }
    if (def.bonusArmor !== 0) {
      Armor.value[eid] += def.bonusArmor;
    }
    if (def.bonusSpeedFraction !== 0) {
      Movement.speed[eid] *= (1 + def.bonusSpeedFraction);
    }
  }

  /**
   * Apply all completed upgrades for a faction to a single newly-created entity.
   * Called by Game.ts whenever a new unit is spawned.
   */
  applyAllUpgradesToNewUnit(eid: number, factionId: number): void {
    const state = this.factions.get(factionId);
    if (!state) return;
    for (const upgradeId of state.completed) {
      const def = getUpgradeDefinition(upgradeId);
      this.applyUpgradeToEntity(eid, def);
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private getFactionState(factionId: number): FactionTechState {
    let state = this.factions.get(factionId);
    if (!state) {
      state = { completed: new Set(), activeResearch: new Map() };
      this.factions.set(factionId, state);
    }
    return state;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const techTreeSystem = new TechTreeSystem();

// ---------------------------------------------------------------------------
// System factory (for SystemPipeline integration)
// ---------------------------------------------------------------------------

export function createTechTreeSystem() {
  return function techTreeSystemFn(world: GameWorld, dt: number): void {
    techTreeSystem.update(world, dt);
  };
}
