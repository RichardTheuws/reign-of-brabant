/**
 * MijnschachtSystem — Limburg TertiaryResource (Mijnschacht) gameplay.
 *
 * The Mijnschacht already generates Kolen and acts as a tunnel endpoint via
 * UndergroundSystem. v0.48.0 adds two click-actions so the building has the
 * same multi-functie depth as the Brabant Worstenbroodjeskraam and Randstad
 * Havermoutmelkbar:
 *
 * 1. **Ploegendienst** (click) — 30 kolen → 60s window where all Limburg
 *    gatherers (Vlaaibakkers) gather 50% faster. 90s cooldown. Stacks
 *    multiplicatively with other gather-mults.
 *
 * 2. **Drukvuur** (click) — 50 kolen → 30s window where Limburg tunnel
 *    transit is -50% extra (1.5s base → 0.75s, or 0.75s upgraded → 0.375s).
 *    90s cooldown. Stacks with Geheime Gangen upgrade.
 *
 * Tick-state: only the two buff-timers. Pipeline-fase: 'faction'.
 */

import { playerState } from '../core/PlayerState';
import { FactionId } from '../types/index';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PLOEGENDIENST_COST = 30;
export const PLOEGENDIENST_DURATION = 60;
export const PLOEGENDIENST_COOLDOWN = 90;
export const PLOEGENDIENST_GATHER_MULT = 1.50;

export const DRUKVUUR_COST = 50;
export const DRUKVUUR_DURATION = 30;
export const DRUKVUUR_COOLDOWN = 90;
export const DRUKVUUR_TRANSIT_MULT = 0.5; // halve the transit duration

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

interface BuffState {
  active: boolean;
  remaining: number;
  cooldown: number;
}

export const ploegendienstBuff: BuffState = { active: false, remaining: 0, cooldown: 0 };
export const drukvuurBuff: BuffState = { active: false, remaining: 0, cooldown: 0 };

// ---------------------------------------------------------------------------
// Ploegendienst API
// ---------------------------------------------------------------------------

export function isPloegendienstReady(): boolean {
  return !ploegendienstBuff.active && ploegendienstBuff.cooldown <= 0;
}

export function activatePloegendienst(): boolean {
  if (!isPloegendienstReady()) return false;
  if (!playerState.spendTertiary(FactionId.Limburgers, PLOEGENDIENST_COST)) return false;
  ploegendienstBuff.active = true;
  ploegendienstBuff.remaining = PLOEGENDIENST_DURATION;
  ploegendienstBuff.cooldown = PLOEGENDIENST_COOLDOWN;
  return true;
}

export function getPloegendienstState(): BuffState {
  return { active: ploegendienstBuff.active, remaining: ploegendienstBuff.remaining, cooldown: ploegendienstBuff.cooldown };
}

/** Gather-rate multiplier for a Limburg worker. Returns 1.0 for non-Limburg. */
export function getLimburgGatherMult(factionId: number): number {
  if (factionId !== FactionId.Limburgers) return 1.0;
  return ploegendienstBuff.active ? PLOEGENDIENST_GATHER_MULT : 1.0;
}

// ---------------------------------------------------------------------------
// Drukvuur API
// ---------------------------------------------------------------------------

export function isDrukvuurReady(): boolean {
  return !drukvuurBuff.active && drukvuurBuff.cooldown <= 0;
}

export function activateDrukvuur(): boolean {
  if (!isDrukvuurReady()) return false;
  if (!playerState.spendTertiary(FactionId.Limburgers, DRUKVUUR_COST)) return false;
  drukvuurBuff.active = true;
  drukvuurBuff.remaining = DRUKVUUR_DURATION;
  drukvuurBuff.cooldown = DRUKVUUR_COOLDOWN;
  return true;
}

export function getDrukvuurState(): BuffState {
  return { active: drukvuurBuff.active, remaining: drukvuurBuff.remaining, cooldown: drukvuurBuff.cooldown };
}

/** Transit-duration multiplier for Limburg tunnels. Returns 1.0 when not active. */
export function getLimburgTunnelTransitMult(factionId: number): number {
  if (factionId !== FactionId.Limburgers) return 1.0;
  return drukvuurBuff.active ? DRUKVUUR_TRANSIT_MULT : 1.0;
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

function tickBuff(buff: BuffState, dt: number): void {
  if (buff.active) {
    buff.remaining -= dt;
    if (buff.remaining <= 0) {
      buff.active = false;
      buff.remaining = 0;
    }
  }
  if (buff.cooldown > 0) {
    buff.cooldown -= dt;
    if (buff.cooldown < 0) buff.cooldown = 0;
  }
}

export function resetMijnschachtBuffs(): void {
  ploegendienstBuff.active = false;
  ploegendienstBuff.remaining = 0;
  ploegendienstBuff.cooldown = 0;
  drukvuurBuff.active = false;
  drukvuurBuff.remaining = 0;
  drukvuurBuff.cooldown = 0;
}

export function createMijnschachtSystem(): SystemFn {
  return function mijnschachtSystem(_world: GameWorld, dt: number): void {
    tickBuff(ploegendienstBuff, dt);
    tickBuff(drukvuurBuff, dt);
  };
}
