/**
 * Reign of Brabant -- Player State
 *
 * Manages gold count and population per player.
 * 2 players: index 0 = human (Brabanders), index 1 = AI.
 * Exists outside ECS as singleton runtime state.
 */

import {
  FactionId,
  BUREAUCRACY_BASE_MULTIPLIER,
  BUREAUCRACY_STACK_BONUS,
  BUREAUCRACY_MAX_STACKS,
} from '../types/index';

// ---------------------------------------------------------------------------
// Per-player data
// ---------------------------------------------------------------------------
interface PlayerData {
  gold: number;
  wood: number;
  populationCurrent: number;
  populationMax: number;
  gezelligheid: number;
  /** Generic tertiary resource (Kolen, Chocolade, Havermoutmelk). Not used for Brabanders (use gezelligheid). */
  tertiary: number;
  /** Bureaucracy efficiency stacks (Randstad only). 0 for non-Randstad factions. */
  efficiencyStacks: number;
}

// ---------------------------------------------------------------------------
// PlayerState singleton
// ---------------------------------------------------------------------------
class PlayerStateManager {
  private players: PlayerData[] = [];

  constructor() {
    this.reset();
  }

  /**
   * Reset to initial values for a new game.
   * Player 0 (human) and Player 1 (AI) each start with:
   *   - 100 gold
   *   - 0 current population (units are added at map setup)
   *   - 10 max population (from starting Town Hall)
   */
  reset(): void {
    this.players = [
      { gold: 100, wood: 0, populationCurrent: 0, populationMax: 10, gezelligheid: 0, tertiary: 0, efficiencyStacks: 0 },
      { gold: 100, wood: 0, populationCurrent: 0, populationMax: 10, gezelligheid: 0, tertiary: 0, efficiencyStacks: 0 },
    ];
  }

  // -------------------------------------------------------------------------
  // Gold
  // -------------------------------------------------------------------------

  /** Check if player can afford a gold cost. */
  canAfford(factionId: number, cost: number): boolean {
    return this.players[factionId].gold >= cost;
  }

  /** Deduct gold. Returns false if insufficient. */
  spend(factionId: number, cost: number): boolean {
    if (!this.canAfford(factionId, cost)) return false;
    this.players[factionId].gold -= cost;
    return true;
  }

  /** Add gold to a player. */
  addGold(factionId: number, amount: number): void {
    this.players[factionId].gold += amount;
  }

  /** Get current gold for a player. */
  getGold(factionId: number): number {
    return this.players[factionId].gold;
  }

  // -------------------------------------------------------------------------
  // Wood
  // -------------------------------------------------------------------------

  /** Check if player can afford a wood cost. */
  canAffordWood(factionId: number, cost: number): boolean {
    return this.players[factionId].wood >= cost;
  }

  /** Deduct wood. Returns false if insufficient. */
  spendWood(factionId: number, cost: number): boolean {
    if (!this.canAffordWood(factionId, cost)) return false;
    this.players[factionId].wood -= cost;
    return true;
  }

  /** Add wood to a player. */
  addWood(factionId: number, amount: number): void {
    this.players[factionId].wood += amount;
  }

  /** Get current wood for a player. */
  getWood(factionId: number): number {
    return this.players[factionId].wood;
  }

  // -------------------------------------------------------------------------
  // Population
  // -------------------------------------------------------------------------

  /** Get current population count for a player. */
  getPopulation(factionId: number): number {
    return this.players[factionId].populationCurrent;
  }

  /** Get max population capacity for a player. */
  getPopulationMax(factionId: number): number {
    return this.players[factionId].populationMax;
  }

  /** Check if player has room for more units. */
  hasPopulationRoom(factionId: number, amount: number = 1): boolean {
    const p = this.players[factionId];
    return p.populationCurrent + amount <= p.populationMax;
  }

  /** Increase current population (when a unit is trained/spawned). */
  addPopulation(factionId: number, amount: number = 1): void {
    this.players[factionId].populationCurrent += amount;
  }

  /** Decrease current population (when a unit dies). */
  removePopulation(factionId: number, amount: number = 1): void {
    this.players[factionId].populationCurrent = Math.max(
      0,
      this.players[factionId].populationCurrent - amount,
    );
  }

  /** Increase max population (when a housing building completes). */
  addPopulationCapacity(factionId: number, amount: number): void {
    this.players[factionId].populationMax += amount;
  }

  // -------------------------------------------------------------------------
  // Gezelligheid (Brabander tertiary resource)
  // -------------------------------------------------------------------------

  /** Get current Gezelligheid for a player. */
  getGezelligheid(factionId: number): number {
    return this.players[factionId].gezelligheid;
  }

  /** Add Gezelligheid to a player. */
  addGezelligheid(factionId: number, amount: number): void {
    this.players[factionId].gezelligheid += amount;
  }

  /** Spend Gezelligheid. Returns false if insufficient. */
  spendGezelligheid(factionId: number, amount: number): boolean {
    if (this.players[factionId].gezelligheid < amount) return false;
    this.players[factionId].gezelligheid -= amount;
    return true;
  }

  // -------------------------------------------------------------------------
  // Tertiary Resource (Kolen, Chocolade, Havermoutmelk -- non-Brabanders)
  // -------------------------------------------------------------------------

  /** Get current tertiary resource for a faction. */
  getTertiary(factionId: number): number {
    return this.players[factionId].tertiary;
  }

  /** Add tertiary resource to a faction. */
  addTertiary(factionId: number, amount: number): void {
    this.players[factionId].tertiary += amount;
  }

  /** Spend tertiary resource. Returns false if insufficient. */
  spendTertiary(factionId: number, amount: number): boolean {
    if (this.players[factionId].tertiary < amount) return false;
    this.players[factionId].tertiary -= amount;
    return true;
  }

  /** Check if a faction can afford a tertiary resource cost. */
  canAffordTertiary(factionId: number, cost: number): boolean {
    return this.players[factionId].tertiary >= cost;
  }

  // -------------------------------------------------------------------------
  // Efficiency Stacks (Randstad Bureaucracy mechanic)
  // -------------------------------------------------------------------------

  /** Get current efficiency stacks for a player. */
  getEfficiencyStacks(factionId: number): number {
    return this.players[factionId].efficiencyStacks;
  }

  /**
   * Add an efficiency stack (Randstad only). Capped at BUREAUCRACY_MAX_STACKS.
   * Returns the new stack count.
   */
  addEfficiencyStack(factionId: number): number {
    const p = this.players[factionId];
    if (p.efficiencyStacks < BUREAUCRACY_MAX_STACKS) {
      p.efficiencyStacks++;
    }
    return p.efficiencyStacks;
  }

  /**
   * Get the bureaucracy speed modifier for a faction.
   * For Randstad: baseDuration * (1.2 - stacks * 0.03)
   * For other factions: 1.0 (no modification)
   */
  getBureaucracyModifier(factionId: number): number {
    if (factionId !== FactionId.Randstad) return 1.0;
    const stacks = this.players[factionId].efficiencyStacks;
    return BUREAUCRACY_BASE_MULTIPLIER - stacks * BUREAUCRACY_STACK_BONUS;
  }
}

/** Singleton instance -- import and use directly. */
export const playerState = new PlayerStateManager();
