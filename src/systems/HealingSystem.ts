/**
 * Reign of Brabant -- Healing System
 *
 * Support units automatically heal the most damaged friendly unit in range.
 * Uses the healRate from archetype data (stored on the Healer component).
 *
 * Behavior:
 * - Support units scan for wounded allies within their attack range
 * - They heal the ally with the lowest HP percentage
 * - Healing only occurs when the support unit is Idle or following (not attacking)
 * - Uses the attack timer for heal cooldown (reuses attack speed)
 */

import { query, hasComponent } from 'bitecs';
import {
  Position,
  Health,
  Attack,
  Faction,
  UnitAI,
  UnitType,
  Healer,
} from '../ecs/components';
import { IsUnit, IsDead } from '../ecs/tags';
import {
  UnitAIState,
  UnitTypeId,
  NO_ENTITY,
} from '../types/index';
import { eventBus } from '../core/EventBus';
import type { GameWorld } from '../ecs/world';

/**
 * Create the healing system.
 */
export function createHealingSystem() {
  return function healingSystem(world: GameWorld, dt: number): void {
    const allUnits = query(world, [Position, Health, UnitAI, UnitType, IsUnit]);

    for (const eid of allUnits) {
      // Only Support units heal
      if (UnitType.id[eid] !== UnitTypeId.Support) continue;
      if (!hasComponent(world, eid, Healer)) continue;
      if (hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue;

      const state = UnitAI.state[eid];
      // Support units heal when idle or moving (not when attacking)
      if (state === UnitAIState.Attacking || state === UnitAIState.Dead) continue;

      // Tick heal timer
      Healer.healTimer[eid] -= dt;
      if (Healer.healTimer[eid] > 0) continue;

      // Find most wounded ally in heal range
      const healRange = Healer.healRange[eid];
      const healRangeSq = healRange * healRange;
      const myFaction = Faction.id[eid];
      const px = Position.x[eid];
      const pz = Position.z[eid];

      let bestTarget = NO_ENTITY;
      let bestHpPct = 1.0;

      for (const other of allUnits) {
        if (other === eid) continue;
        if (Faction.id[other] !== myFaction) continue;
        if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

        // Only heal wounded units
        const hpPct = Health.current[other] / Health.max[other];
        if (hpPct >= 1.0) continue;

        const dx = Position.x[other] - px;
        const dz = Position.z[other] - pz;
        const distSq = dx * dx + dz * dz;
        if (distSq > healRangeSq) continue;

        if (hpPct < bestHpPct) {
          bestHpPct = hpPct;
          bestTarget = other;
        }
      }

      if (bestTarget === NO_ENTITY) {
        // No wounded ally -- don't reset timer, check again next frame
        Healer.healTimer[eid] = 0;
        continue;
      }

      // Heal the target
      const healAmount = Healer.healRate[eid];
      Health.current[bestTarget] = Math.min(
        Health.max[bestTarget],
        Health.current[bestTarget] + healAmount,
      );

      // Reset timer
      Healer.healTimer[eid] = Healer.healSpeed[eid];

      // Emit heal event for audio/visual feedback
      eventBus.emit('unit-healed', {
        healerEid: eid,
        targetEid: bestTarget,
        amount: healAmount,
        x: Position.x[bestTarget],
        z: Position.z[bestTarget],
      });
    }
  };
}
