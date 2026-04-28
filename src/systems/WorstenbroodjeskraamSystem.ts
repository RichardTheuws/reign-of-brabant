/**
 * WorstenbroodjeskraamSystem — Brabant TertiaryResource (Worstenbroodjeskraam).
 *
 * Three concurrent functies, alleen actief voor FactionId.Brabanders:
 *
 * 1. **Passive Gezelligheid flux** — per voltooide Worstenbroodjeskraam
 *    +0.5 Gezelligheid/sec (los van proximity-based GezeligheidSystem).
 *
 * 2. **Trakteerronde** (click-action) — kost 50 Gezelligheid → 30s window
 *    waarin alle Brabant units in 10u radius rondom de gekozen kraam +20%
 *    movement speed krijgen. 90s cooldown. Buff is global op factie-niveau
 *    (eenvoud — Brabant kan max één tegelijk).
 *
 * 3. **Heal-aura** (passive) — Brabant units binnen 8u van een complete
 *    Worstenbroodjeskraam regenereren +0.5 HP/sec (geclamped op max HP).
 *    Stapelt NIET tussen meerdere kraampjes (eerste kraam-in-radius wint).
 *
 * Pipeline-fase: 'faction' (na BureaucracySystem, vóór UndergroundSystem
 * en gather/production).
 */

import { query, hasComponent } from 'bitecs';
import { Building, Faction, Position, Health } from '../ecs/components';
import { IsBuilding, IsUnit, IsDead } from '../ecs/tags';
import { FactionId, BuildingTypeId } from '../types/index';
import { playerState } from '../core/PlayerState';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Update tick (seconds) — keeps math cheap for heal/Gez sums. */
const UPDATE_INTERVAL = 1.0;

/** Passive Gezelligheid generation per kraam per second. */
export const KRAAM_GEZELLIGHEID_PER_SEC = 0.5;

/** Heal aura: HP per second per Brabant unit within HEAL_RADIUS_SQ. */
export const KRAAM_HEAL_PER_SEC = 0.5;
const HEAL_RADIUS = 8;
const HEAL_RADIUS_SQ = HEAL_RADIUS * HEAL_RADIUS;

/** Trakteerronde click-action. */
export const TRAKTEERRONDE_COST = 50;
export const TRAKTEERRONDE_DURATION = 30;
export const TRAKTEERRONDE_COOLDOWN = 90;
export const TRAKTEERRONDE_SPEED_MULT = 1.20;

// ---------------------------------------------------------------------------
// Module state — Trakteerronde buff is global per faction (Brabant only)
// ---------------------------------------------------------------------------

interface BuffState {
  active: boolean;
  remaining: number;
  cooldown: number;
}

export const trakteerrondeBuff: BuffState = { active: false, remaining: 0, cooldown: 0 };

// ---------------------------------------------------------------------------
// Click-action API
// ---------------------------------------------------------------------------

export function isTrakteerrondeReady(): boolean {
  return !trakteerrondeBuff.active && trakteerrondeBuff.cooldown <= 0;
}

/**
 * Activate Trakteerronde if ready and Brabant has enough Gezelligheid.
 * Spends `TRAKTEERRONDE_COST` from FactionId.Brabanders gezelligheid.
 */
export function activateTrakteerronde(): boolean {
  if (!isTrakteerrondeReady()) return false;
  if (!playerState.spendGezelligheid(FactionId.Brabanders, TRAKTEERRONDE_COST)) return false;
  trakteerrondeBuff.active = true;
  trakteerrondeBuff.remaining = TRAKTEERRONDE_DURATION;
  trakteerrondeBuff.cooldown = TRAKTEERRONDE_COOLDOWN;
  return true;
}

export function getTrakteerrondeState(): BuffState {
  return { active: trakteerrondeBuff.active, remaining: trakteerrondeBuff.remaining, cooldown: trakteerrondeBuff.cooldown };
}

/**
 * Movement-speed multiplier voor Brabant units tijdens Trakteerronde.
 * Returns 1.0 voor non-Brabanders of niet-actief.
 */
export function getTrakteerrondeSpeedMult(factionId: number): number {
  if (factionId !== FactionId.Brabanders) return 1.0;
  return trakteerrondeBuff.active ? TRAKTEERRONDE_SPEED_MULT : 1.0;
}

export function resetWorstenbroodjeskraamBuffs(): void {
  trakteerrondeBuff.active = false;
  trakteerrondeBuff.remaining = 0;
  trakteerrondeBuff.cooldown = 0;
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

export function createWorstenbroodjeskraamSystem(): SystemFn {
  let accumulator = 0;

  return function worstenbroodjeskraamSystem(world: GameWorld, dt: number): void {
    // -- Trakteerronde buff timer (every-frame for snappy expiration) --
    if (trakteerrondeBuff.active) {
      trakteerrondeBuff.remaining -= dt;
      if (trakteerrondeBuff.remaining <= 0) {
        trakteerrondeBuff.active = false;
        trakteerrondeBuff.remaining = 0;
      }
    }
    if (trakteerrondeBuff.cooldown > 0) {
      trakteerrondeBuff.cooldown -= dt;
      if (trakteerrondeBuff.cooldown < 0) trakteerrondeBuff.cooldown = 0;
    }

    // -- Throttle Gezelligheid + heal-aura ticks to UPDATE_INTERVAL --
    accumulator += dt;
    if (accumulator < UPDATE_INTERVAL) return;
    accumulator -= UPDATE_INTERVAL;

    // Find all complete Brabant Worstenbroodjeskraam (TertiaryResourceBuilding) buildings.
    const buildings = query(world, [Building, Faction, Position, IsBuilding]);
    const kraamEids: number[] = [];
    for (const bEid of buildings) {
      if (hasComponent(world, bEid, IsDead)) continue;
      if (Faction.id[bEid] !== FactionId.Brabanders) continue;
      if (Building.typeId[bEid] !== BuildingTypeId.TertiaryResourceBuilding) continue;
      if (Building.complete[bEid] !== 1) continue;
      kraamEids.push(bEid);
    }

    if (kraamEids.length === 0) return;

    // 1. Passive Gezelligheid generation (linear in count)
    playerState.addGezelligheid(
      FactionId.Brabanders,
      kraamEids.length * KRAAM_GEZELLIGHEID_PER_SEC * UPDATE_INTERVAL,
    );

    // 2. Heal-aura — for each Brabant unit, find first kraam within HEAL_RADIUS
    //    (don't stack across kraampjes; first match heals).
    const units = query(world, [Position, Faction, Health, IsUnit]);
    const healAmount = KRAAM_HEAL_PER_SEC * UPDATE_INTERVAL;

    for (const uEid of units) {
      if (hasComponent(world, uEid, IsDead)) continue;
      if (Faction.id[uEid] !== FactionId.Brabanders) continue;
      if (Health.current[uEid] >= Health.max[uEid]) continue; // already full

      const ux = Position.x[uEid];
      const uz = Position.z[uEid];

      for (const kEid of kraamEids) {
        const dx = Position.x[kEid] - ux;
        const dz = Position.z[kEid] - uz;
        if (dx * dx + dz * dz <= HEAL_RADIUS_SQ) {
          Health.current[uEid] = Math.min(
            Health.max[uEid],
            Health.current[uEid] + healAmount,
          );
          break; // first kraam-in-radius heals; no stacking
        }
      }
    }
  };
}
