/**
 * HavermoutmelkSystem — Randstad TertiaryResource (Havermoutmelkbar) gameplay.
 *
 * Three concurrent functies, allemaal alleen actief voor FactionId.Randstad:
 *
 * 1. **Sprint Mode** (click-action) — kost 30 havermoutmelk → 60s window
 *    waarin alle Randstad gatherers +20% gather rate krijgen EN alle
 *    Randstad productie-gebouwen +20% production speed. 90s cooldown.
 *
 * 2. **Deadline Crunch** (click-action) — kost 50 havermoutmelk → 30s
 *    window waarin alle Randstad workers (stagiairs) +50% movement speed
 *    krijgen. 90s cooldown. Stack met Sprint Mode mogelijk.
 *
 * 3. **Stagiairsleger** (passive, voorraad-based) — per 100 havermoutmelk
 *    in voorraad krijgen Randstad gatherers +5% gather rate. Cap +25%
 *    (op 500+ voorraad). Stapelt multiplicatief met Sprint Mode (1.20 ×
 *    1.25 = 1.50 max gather mult).
 *
 * Tick-state: alleen Sprint Mode + Deadline Crunch buff-timers (Stagiairsleger
 * is puur afgeleid van current voorraad, geen cached state). Pipeline-fase:
 * 'faction' (na BureaucracySystem zodat Boardroom-buff al is geticked).
 */

import { playerState } from '../core/PlayerState';
import { FactionId } from '../types/index';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sprint Mode click-action. */
export const SPRINT_MODE_COST = 30;
export const SPRINT_MODE_DURATION = 60;
export const SPRINT_MODE_COOLDOWN = 90;
export const SPRINT_MODE_GATHER_MULT = 1.20;
/** Production-speed factor: divide duration by 1.20 → multiply by 1/1.20. */
export const SPRINT_MODE_PRODUCTION_MULT = 1 / 1.20;

/** Deadline Crunch click-action. */
export const DEADLINE_CRUNCH_COST = 50;
export const DEADLINE_CRUNCH_DURATION = 30;
export const DEADLINE_CRUNCH_COOLDOWN = 90;
export const DEADLINE_CRUNCH_SPEED_MULT = 1.50;

/** Stagiairsleger passive. */
export const STAGIAIRSLEGER_PER_STACK = 100;
export const STAGIAIRSLEGER_PER_STACK_MULT = 0.05;
export const STAGIAIRSLEGER_MAX_STACKS = 5;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

interface BuffState {
  active: boolean;
  remaining: number;
  cooldown: number;
}

export const sprintModeBuff: BuffState = { active: false, remaining: 0, cooldown: 0 };
export const deadlineCrunchBuff: BuffState = { active: false, remaining: 0, cooldown: 0 };

// ---------------------------------------------------------------------------
// Sprint Mode API
// ---------------------------------------------------------------------------

export function isSprintModeReady(): boolean {
  return !sprintModeBuff.active && sprintModeBuff.cooldown <= 0;
}

/**
 * Activate Sprint Mode if ready and Randstad has enough havermoutmelk.
 * Spends `SPRINT_MODE_COST` from FactionId.Randstad tertiary on success.
 */
export function activateSprintMode(): boolean {
  if (!isSprintModeReady()) return false;
  if (!playerState.spendTertiary(FactionId.Randstad, SPRINT_MODE_COST)) return false;
  sprintModeBuff.active = true;
  sprintModeBuff.remaining = SPRINT_MODE_DURATION;
  sprintModeBuff.cooldown = SPRINT_MODE_COOLDOWN;
  return true;
}

export function getSprintModeState(): BuffState {
  return { active: sprintModeBuff.active, remaining: sprintModeBuff.remaining, cooldown: sprintModeBuff.cooldown };
}

// ---------------------------------------------------------------------------
// Deadline Crunch API
// ---------------------------------------------------------------------------

export function isDeadlineCrunchReady(): boolean {
  return !deadlineCrunchBuff.active && deadlineCrunchBuff.cooldown <= 0;
}

export function activateDeadlineCrunch(): boolean {
  if (!isDeadlineCrunchReady()) return false;
  if (!playerState.spendTertiary(FactionId.Randstad, DEADLINE_CRUNCH_COST)) return false;
  deadlineCrunchBuff.active = true;
  deadlineCrunchBuff.remaining = DEADLINE_CRUNCH_DURATION;
  deadlineCrunchBuff.cooldown = DEADLINE_CRUNCH_COOLDOWN;
  return true;
}

export function getDeadlineCrunchState(): BuffState {
  return { active: deadlineCrunchBuff.active, remaining: deadlineCrunchBuff.remaining, cooldown: deadlineCrunchBuff.cooldown };
}

// ---------------------------------------------------------------------------
// Stagiairsleger passive (derived from voorraad)
// ---------------------------------------------------------------------------

/** Number of passive stacks based on current Randstad havermoutmelk voorraad (capped). */
export function getStagiairslegerStacks(): number {
  const voorraad = playerState.getTertiary(FactionId.Randstad);
  const stacks = Math.floor(voorraad / STAGIAIRSLEGER_PER_STACK);
  return Math.min(stacks, STAGIAIRSLEGER_MAX_STACKS);
}

/** Multiplicative gather bonus from Stagiairsleger passive. e.g. 3 stacks → 1.15. */
export function getStagiairslegerGatherMult(): number {
  return 1 + getStagiairslegerStacks() * STAGIAIRSLEGER_PER_STACK_MULT;
}

// ---------------------------------------------------------------------------
// Combined helpers (for GatherSystem / ProductionSystem / MovementSystem)
// ---------------------------------------------------------------------------

/**
 * Combined gather-rate multiplier for a Randstad worker.
 * Sprint Mode × Stagiairsleger (multiplicative). Returns 1.0 voor non-Randstad.
 */
export function getRandstadGatherMult(factionId: number): number {
  if (factionId !== FactionId.Randstad) return 1.0;
  const sprint = sprintModeBuff.active ? SPRINT_MODE_GATHER_MULT : 1.0;
  return sprint * getStagiairslegerGatherMult();
}

/**
 * Production-speed multiplier (applied to duration — lower = faster).
 * Returns Sprint Mode factor wanneer actief voor Randstad.
 */
export function getSprintModeProductionMod(factionId: number): number {
  if (factionId !== FactionId.Randstad) return 1.0;
  return sprintModeBuff.active ? SPRINT_MODE_PRODUCTION_MULT : 1.0;
}

/**
 * Worker movement-speed multiplier voor een Randstad worker tijdens
 * Deadline Crunch. Returns 1.0 voor non-Randstad of niet-actief.
 */
export function getDeadlineCrunchSpeedMult(factionId: number): number {
  if (factionId !== FactionId.Randstad) return 1.0;
  return deadlineCrunchBuff.active ? DEADLINE_CRUNCH_SPEED_MULT : 1.0;
}

// ---------------------------------------------------------------------------
// Tick (buff timers)
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

/** Reset all buffs to a fresh state (used by playerState.reset / new match). */
export function resetHavermoutmelkBuffs(): void {
  sprintModeBuff.active = false;
  sprintModeBuff.remaining = 0;
  sprintModeBuff.cooldown = 0;
  deadlineCrunchBuff.active = false;
  deadlineCrunchBuff.remaining = 0;
  deadlineCrunchBuff.cooldown = 0;
}

export function createHavermoutmelkSystem(): SystemFn {
  return function havermoutmelkSystem(_world: GameWorld, dt: number): void {
    tickBuff(sprintModeBuff, dt);
    tickBuff(deadlineCrunchBuff, dt);
  };
}
