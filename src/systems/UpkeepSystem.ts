/**
 * Reign of Brabant -- Upkeep System
 *
 * Deducts gold from each player based on their military unit count.
 * Runs on a fixed interval (UPKEEP_TICK_INTERVAL seconds).
 *
 * - Each military (non-worker) unit costs UPKEEP_COST_PER_UNIT gold per tick.
 * - When a player cannot pay upkeep (gold reaches 0), they enter "upkeep debt".
 * - Units in upkeep debt fight at UPKEEP_DEBT_EFFECTIVENESS (75%) attack/speed.
 * - Debt clears as soon as gold goes above 0.
 */

import { playerState } from '../core/PlayerState';
import {
  UPKEEP_TICK_INTERVAL,
  UPKEEP_COST_PER_UNIT,
} from '../types/index';
import type { GameWorld } from '../ecs/world';

// Per-player upkeep timers
const upkeepTimers: number[] = [0, 0, 0, 0];

/**
 * Create the upkeep system.
 */
export function createUpkeepSystem() {
  return function upkeepSystem(_world: GameWorld, dt: number): void {
    for (let factionId = 0; factionId < 4; factionId++) {
      upkeepTimers[factionId] += dt;

      if (upkeepTimers[factionId] >= UPKEEP_TICK_INTERVAL) {
        upkeepTimers[factionId] -= UPKEEP_TICK_INTERVAL;

        const militaryCount = playerState.getMilitaryCount(factionId);
        if (militaryCount <= 0) {
          playerState.setUpkeepDebt(factionId, false);
          continue;
        }

        const upkeepCost = militaryCount * UPKEEP_COST_PER_UNIT;
        const currentGold = playerState.getGold(factionId);

        if (currentGold >= upkeepCost) {
          // Can afford -- deduct and clear debt
          playerState.spend(factionId, upkeepCost);
          playerState.setUpkeepDebt(factionId, false);
        } else {
          // Cannot fully afford -- deduct what we can, enter debt
          if (currentGold > 0) {
            playerState.spend(factionId, currentGold);
          }
          playerState.setUpkeepDebt(factionId, true);
        }
      }

      // Clear debt immediately when gold recovers above 0
      if (playerState.isInUpkeepDebt(factionId) && playerState.getGold(factionId) > 0) {
        playerState.setUpkeepDebt(factionId, false);
      }
    }
  };
}

/**
 * Reset upkeep timers (call on game reset).
 */
export function resetUpkeepTimers(): void {
  for (let i = 0; i < upkeepTimers.length; i++) {
    upkeepTimers[i] = 0;
  }
}

/**
 * Get the upkeep cost per tick for a faction (for HUD display).
 */
export function getUpkeepPerTick(factionId: number): number {
  return playerState.getMilitaryCount(factionId) * UPKEEP_COST_PER_UNIT;
}
