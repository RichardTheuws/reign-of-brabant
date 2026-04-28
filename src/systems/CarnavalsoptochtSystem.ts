/**
 * CarnavalsoptochtSystem — Brabant Carnavalstent click-action (v0.41.0).
 *
 * Bestaande Carnavalstent had alleen passive +20% damage aura (Bundle 3
 * via GezeligheidSystem). Per `feedback_v1_perfection_multi_function`
 * krijgt elk specialty-gebouw 2-3 functies; deze module voegt een
 * tweede tijdelijke buff toe als click-action op de Carnavalstent.
 *
 * **Carnavalsoptocht**: kost 75 Gezelligheid → 30s alle Brabant units
 * +25% movement speed (parade-effect). 90s cooldown.
 *
 * Stacks multiplicatief met:
 *  - Trakteerronde (Worstenbroodjeskraam click): 1.20 × 1.25 = 1.50.
 *  - GezeligheidBonus.speedMult (passive aura): los traject.
 */

import { playerState } from '../core/PlayerState';
import { FactionId } from '../types/index';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CARNAVALSOPTOCHT_COST = 75;
export const CARNAVALSOPTOCHT_DURATION = 30;
export const CARNAVALSOPTOCHT_COOLDOWN = 90;
export const CARNAVALSOPTOCHT_SPEED_MULT = 1.25;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

interface BuffState { active: boolean; remaining: number; cooldown: number; }

export const carnavalsoptochtBuff: BuffState = { active: false, remaining: 0, cooldown: 0 };

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export function isCarnavalsoptochtReady(): boolean {
  return !carnavalsoptochtBuff.active && carnavalsoptochtBuff.cooldown <= 0;
}

export function activateCarnavalsoptocht(): boolean {
  if (!isCarnavalsoptochtReady()) return false;
  if (!playerState.spendGezelligheid(FactionId.Brabanders, CARNAVALSOPTOCHT_COST)) return false;
  carnavalsoptochtBuff.active = true;
  carnavalsoptochtBuff.remaining = CARNAVALSOPTOCHT_DURATION;
  carnavalsoptochtBuff.cooldown = CARNAVALSOPTOCHT_COOLDOWN;
  return true;
}

export function getCarnavalsoptochtState(): BuffState {
  return { active: carnavalsoptochtBuff.active, remaining: carnavalsoptochtBuff.remaining, cooldown: carnavalsoptochtBuff.cooldown };
}

/** Speed multiplier for Brabant units while Carnavalsoptocht is active. */
export function getCarnavalsoptochtSpeedMult(factionId: number): number {
  if (factionId !== FactionId.Brabanders) return 1.0;
  return carnavalsoptochtBuff.active ? CARNAVALSOPTOCHT_SPEED_MULT : 1.0;
}

export function resetCarnavalsoptocht(): void {
  carnavalsoptochtBuff.active = false;
  carnavalsoptochtBuff.remaining = 0;
  carnavalsoptochtBuff.cooldown = 0;
}

// ---------------------------------------------------------------------------
// System factory (every-frame timer tick)
// ---------------------------------------------------------------------------

export function createCarnavalsoptochtSystem(): SystemFn {
  return function carnavalsoptochtSystem(_world: GameWorld, dt: number): void {
    if (carnavalsoptochtBuff.active) {
      carnavalsoptochtBuff.remaining -= dt;
      if (carnavalsoptochtBuff.remaining <= 0) {
        carnavalsoptochtBuff.active = false;
        carnavalsoptochtBuff.remaining = 0;
      }
    }
    if (carnavalsoptochtBuff.cooldown > 0) {
      carnavalsoptochtBuff.cooldown -= dt;
      if (carnavalsoptochtBuff.cooldown < 0) carnavalsoptochtBuff.cooldown = 0;
    }
  };
}
