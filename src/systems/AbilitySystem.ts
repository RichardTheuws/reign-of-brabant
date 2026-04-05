/**
 * Reign of Brabant -- Ability System
 *
 * Handles faction-specific abilities. Currently implements:
 * - Carnavalsrage (Brabanders): Costs 100 Gezelligheid, 30s buff on ALL
 *   Brabander units (+50% Attack, +25% Speed, +25% Armor).
 *   Cooldown: 180 seconds. Hotkey: R.
 *
 * Integrates with GezeligheidBonus component -- the rage multipliers
 * are added ON TOP of the Gezelligheid proximity bonuses.
 */

import { query, hasComponent } from 'bitecs';
import {
  Position,
  Faction,
  Health,
  GezeligheidBonus,
} from '../ecs/components';
import { IsUnit, IsDead } from '../ecs/tags';
import { FactionId } from '../types/index';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Gezelligheid cost to activate Carnavalsrage. */
const RAGE_COST = 100;

/** Duration of the Carnavalsrage buff in seconds. */
const RAGE_DURATION = 30;

/** Cooldown after Carnavalsrage ends before it can be used again. */
const RAGE_COOLDOWN = 180;

/** Buff multipliers during Carnavalsrage. */
const RAGE_ATTACK_MULT = 1.50;
const RAGE_SPEED_MULT = 1.25;
const RAGE_ARMOR_MULT = 1.25;

// ---------------------------------------------------------------------------
// Carnavalsrage State (module-level singleton)
// ---------------------------------------------------------------------------

export interface CarnavalsrageState {
  active: boolean;
  remainingDuration: number;
  cooldownRemaining: number;
}

const rageState: CarnavalsrageState = {
  active: false,
  remainingDuration: 0,
  cooldownRemaining: 0,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attempt to activate Carnavalsrage.
 * Returns true if successfully activated, false if insufficient
 * resources or still on cooldown.
 */
export function activateCarnavalsrage(): boolean {
  // Check cooldown
  if (rageState.cooldownRemaining > 0) return false;

  // Check if already active
  if (rageState.active) return false;

  // Check and spend Gezelligheid
  const current = playerState.getGezelligheid(FactionId.Brabanders);
  if (current < RAGE_COST) return false;

  playerState.spendGezelligheid(FactionId.Brabanders, RAGE_COST);

  rageState.active = true;
  rageState.remainingDuration = RAGE_DURATION;
  rageState.cooldownRemaining = 0;

  // Emit event for audio
  eventBus.emit('carnavalsrage-activated', { factionId: FactionId.Brabanders });

  return true;
}

/**
 * Get the current Carnavalsrage state for HUD display.
 */
export function getCarnavalsrageState(): Readonly<CarnavalsrageState> {
  return rageState;
}

/**
 * Get Carnavalsrage constants for HUD display.
 */
export function getCarnavalsrageConfig() {
  return {
    cost: RAGE_COST,
    duration: RAGE_DURATION,
    cooldown: RAGE_COOLDOWN,
  } as const;
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the ability system.
 */
export function createAbilitySystem() {
  return function abilitySystem(world: GameWorld, dt: number): void {
    // Update rage state timers
    if (rageState.active) {
      rageState.remainingDuration -= dt;
      if (rageState.remainingDuration <= 0) {
        // Rage ended -- start cooldown
        rageState.active = false;
        rageState.remainingDuration = 0;
        rageState.cooldownRemaining = RAGE_COOLDOWN;
      }
    } else if (rageState.cooldownRemaining > 0) {
      rageState.cooldownRemaining -= dt;
      if (rageState.cooldownRemaining < 0) {
        rageState.cooldownRemaining = 0;
      }
    }

    // Apply rage multipliers to all Brabander units' GezeligheidBonus
    if (rageState.active) {
      const allUnits = query(world, [Position, Faction, IsUnit]);
      for (const eid of allUnits) {
        if (Faction.id[eid] !== FactionId.Brabanders) continue;
        if (hasComponent(world, eid, IsDead)) continue;
        if (Health.current[eid] <= 0) continue;

        // Multiply the existing Gezelligheid bonus by the rage multipliers
        GezeligheidBonus.attackMult[eid] *= RAGE_ATTACK_MULT;
        GezeligheidBonus.speedMult[eid] *= RAGE_SPEED_MULT;
        GezeligheidBonus.armorMult[eid] *= RAGE_ARMOR_MULT;
      }
    }
  };
}
