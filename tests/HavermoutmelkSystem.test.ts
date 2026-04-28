/**
 * HavermoutmelkSystem — Randstad Havermoutmelkbar 3 functies
 *
 * Live-bug v0.37.36 (Richard 2026-04-28):
 *   "De havermoutmelkbar (en aanverwanten) heeft nog geen functie zo te zien".
 *   Root cause: TertiaryResourceSystem genereerde 2.0/sec havermoutmelk
 *   maar er was geen spend-callsite voor Randstad (Limburg-Kolen had
 *   tunnels, Belgen-Chocolade had diplomacy).
 *
 * Fix: 3 concurrent functies — Sprint Mode (click), Deadline Crunch (click),
 * Stagiairsleger (passive voorraad-based gather bonus).
 *
 * Per memory feedback_v1_perfection_multi_function.md: Voor v1.0 streven we
 * naar perfectie, kies altijd alle drie ipv één.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { playerState } from '../src/core/PlayerState';
import { FactionId } from '../src/types/index';
import {
  activateSprintMode, isSprintModeReady, getSprintModeState,
  activateDeadlineCrunch, isDeadlineCrunchReady, getDeadlineCrunchState,
  getStagiairslegerStacks, getStagiairslegerGatherMult,
  getRandstadGatherMult, getSprintModeProductionMod, getDeadlineCrunchSpeedMult,
  resetHavermoutmelkBuffs, createHavermoutmelkSystem,
  SPRINT_MODE_COST, SPRINT_MODE_DURATION, SPRINT_MODE_COOLDOWN,
  SPRINT_MODE_GATHER_MULT, SPRINT_MODE_PRODUCTION_MULT,
  DEADLINE_CRUNCH_COST, DEADLINE_CRUNCH_DURATION, DEADLINE_CRUNCH_COOLDOWN,
  DEADLINE_CRUNCH_SPEED_MULT,
  STAGIAIRSLEGER_PER_STACK, STAGIAIRSLEGER_PER_STACK_MULT, STAGIAIRSLEGER_MAX_STACKS,
} from '../src/systems/HavermoutmelkSystem';

const tickSystem = createHavermoutmelkSystem();
function tick(dt: number) { tickSystem({} as any, dt); }

beforeEach(() => {
  playerState.reset();
  resetHavermoutmelkBuffs();
});

// ---------------------------------------------------------------------------
// Sprint Mode (click-action A) — +20% gather + +20% production for 60s
// ---------------------------------------------------------------------------
describe('HavermoutmelkSystem — Sprint Mode (click-action)', () => {
  it('starts ready and inactive', () => {
    expect(isSprintModeReady()).toBe(true);
    expect(getSprintModeState().active).toBe(false);
  });

  it('cannot activate without enough havermoutmelk', () => {
    expect(playerState.getTertiary(FactionId.Randstad)).toBe(0);
    const fired = activateSprintMode();
    expect(fired).toBe(false);
    expect(getSprintModeState().active).toBe(false);
  });

  it('activates on sufficient havermoutmelk and spends the cost', () => {
    playerState.addTertiary(FactionId.Randstad, SPRINT_MODE_COST);
    const fired = activateSprintMode();
    expect(fired).toBe(true);
    expect(getSprintModeState().active).toBe(true);
    expect(getSprintModeState().remaining).toBe(SPRINT_MODE_DURATION);
    expect(getSprintModeState().cooldown).toBe(SPRINT_MODE_COOLDOWN);
    expect(playerState.getTertiary(FactionId.Randstad)).toBe(0);
  });

  it('blocks activation while active or on cooldown', () => {
    playerState.addTertiary(FactionId.Randstad, SPRINT_MODE_COST * 3);
    activateSprintMode();
    expect(activateSprintMode()).toBe(false); // already active
    tick(SPRINT_MODE_DURATION + 0.1); // expire active
    expect(getSprintModeState().active).toBe(false);
    expect(activateSprintMode()).toBe(false); // still on cooldown
  });

  it('expires after SPRINT_MODE_DURATION seconds and enters cooldown', () => {
    playerState.addTertiary(FactionId.Randstad, SPRINT_MODE_COST);
    activateSprintMode();
    tick(SPRINT_MODE_DURATION - 0.5);
    expect(getSprintModeState().active).toBe(true);
    tick(1);
    expect(getSprintModeState().active).toBe(false);
    expect(getSprintModeState().cooldown).toBeGreaterThan(0);
  });

  it('production-speed mod is +20% only for Randstad while active', () => {
    expect(getSprintModeProductionMod(FactionId.Randstad)).toBe(1.0);
    playerState.addTertiary(FactionId.Randstad, SPRINT_MODE_COST);
    activateSprintMode();
    expect(getSprintModeProductionMod(FactionId.Randstad)).toBe(SPRINT_MODE_PRODUCTION_MULT);
    expect(getSprintModeProductionMod(FactionId.Brabanders)).toBe(1.0);
  });

  it('does not affect non-Randstad factions even when active', () => {
    playerState.addTertiary(FactionId.Randstad, SPRINT_MODE_COST);
    activateSprintMode();
    expect(getRandstadGatherMult(FactionId.Limburgers)).toBe(1.0);
    expect(getRandstadGatherMult(FactionId.Brabanders)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Deadline Crunch (click-action B) — +50% worker speed for 30s
// ---------------------------------------------------------------------------
describe('HavermoutmelkSystem — Deadline Crunch (click-action)', () => {
  it('starts ready and inactive', () => {
    expect(isDeadlineCrunchReady()).toBe(true);
    expect(getDeadlineCrunchState().active).toBe(false);
  });

  it('cannot activate without enough havermoutmelk', () => {
    const fired = activateDeadlineCrunch();
    expect(fired).toBe(false);
  });

  it('activates and applies +50% worker speed to Randstad only', () => {
    playerState.addTertiary(FactionId.Randstad, DEADLINE_CRUNCH_COST);
    activateDeadlineCrunch();
    expect(getDeadlineCrunchSpeedMult(FactionId.Randstad)).toBe(DEADLINE_CRUNCH_SPEED_MULT);
    expect(getDeadlineCrunchSpeedMult(FactionId.Brabanders)).toBe(1.0);
    expect(getDeadlineCrunchSpeedMult(FactionId.Limburgers)).toBe(1.0);
    expect(getDeadlineCrunchSpeedMult(FactionId.Belgen)).toBe(1.0);
  });

  it('expires after DEADLINE_CRUNCH_DURATION', () => {
    playerState.addTertiary(FactionId.Randstad, DEADLINE_CRUNCH_COST);
    activateDeadlineCrunch();
    tick(DEADLINE_CRUNCH_DURATION + 0.1);
    expect(getDeadlineCrunchState().active).toBe(false);
    expect(getDeadlineCrunchSpeedMult(FactionId.Randstad)).toBe(1.0);
  });

  it('cooldown counts down and unblocks reactivation', () => {
    playerState.addTertiary(FactionId.Randstad, DEADLINE_CRUNCH_COST * 2);
    activateDeadlineCrunch();
    tick(DEADLINE_CRUNCH_DURATION + 0.1); // expire
    tick(DEADLINE_CRUNCH_COOLDOWN + 0.1); // expire cooldown
    expect(isDeadlineCrunchReady()).toBe(true);
    expect(activateDeadlineCrunch()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Stagiairsleger (passive C) — voorraad-based gather bonus
// ---------------------------------------------------------------------------
describe('HavermoutmelkSystem — Stagiairsleger (passive)', () => {
  it('zero stacks at 0 voorraad → 1.0 gather mult', () => {
    expect(getStagiairslegerStacks()).toBe(0);
    expect(getStagiairslegerGatherMult()).toBe(1.0);
  });

  it('1 stack per 100 voorraad', () => {
    playerState.addTertiary(FactionId.Randstad, 100);
    expect(getStagiairslegerStacks()).toBe(1);
    expect(getStagiairslegerGatherMult()).toBeCloseTo(1.05, 5);

    playerState.addTertiary(FactionId.Randstad, 100); // 200 total
    expect(getStagiairslegerStacks()).toBe(2);
  });

  it('caps at STAGIAIRSLEGER_MAX_STACKS', () => {
    playerState.addTertiary(FactionId.Randstad, 999);
    expect(getStagiairslegerStacks()).toBe(STAGIAIRSLEGER_MAX_STACKS);
    expect(getStagiairslegerGatherMult()).toBeCloseTo(
      1 + STAGIAIRSLEGER_MAX_STACKS * STAGIAIRSLEGER_PER_STACK_MULT,
      5,
    );
  });

  it('passive is voorraad-derived — spending reduces stacks immediately', () => {
    playerState.addTertiary(FactionId.Randstad, 250); // 2 stacks
    expect(getStagiairslegerStacks()).toBe(2);
    playerState.spendTertiary(FactionId.Randstad, 100); // → 150, 1 stack
    expect(getStagiairslegerStacks()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Combined gather mult — Sprint Mode × Stagiairsleger
// ---------------------------------------------------------------------------
describe('HavermoutmelkSystem — combined gather multipliers', () => {
  it('no buffs, no voorraad → 1.0 for Randstad', () => {
    expect(getRandstadGatherMult(FactionId.Randstad)).toBe(1.0);
  });

  it('only passive (200 voorraad, no Sprint) → 1.10', () => {
    playerState.addTertiary(FactionId.Randstad, 200);
    expect(getRandstadGatherMult(FactionId.Randstad)).toBeCloseTo(1.10, 5);
  });

  it('Sprint Mode + max passive stacks → 1.20 × 1.25 = 1.50', () => {
    playerState.addTertiary(FactionId.Randstad, 500 + SPRINT_MODE_COST); // 5 stacks + cost
    activateSprintMode();
    // After spending: voorraad = 500 → still 5 stacks
    expect(getStagiairslegerStacks()).toBe(STAGIAIRSLEGER_MAX_STACKS);
    expect(getRandstadGatherMult(FactionId.Randstad)).toBeCloseTo(
      SPRINT_MODE_GATHER_MULT * (1 + STAGIAIRSLEGER_MAX_STACKS * STAGIAIRSLEGER_PER_STACK_MULT),
      5,
    );
  });

  it('Sprint Mode without voorraad bonus → exactly SPRINT_MODE_GATHER_MULT', () => {
    playerState.addTertiary(FactionId.Randstad, SPRINT_MODE_COST);
    activateSprintMode();
    // Voorraad now 0 — no Stagiairsleger bonus
    expect(getRandstadGatherMult(FactionId.Randstad)).toBeCloseTo(SPRINT_MODE_GATHER_MULT, 5);
  });
});

// ---------------------------------------------------------------------------
// Reset behaviour
// ---------------------------------------------------------------------------
describe('HavermoutmelkSystem — reset', () => {
  it('resetHavermoutmelkBuffs clears active state and cooldowns', () => {
    playerState.addTertiary(FactionId.Randstad, SPRINT_MODE_COST + DEADLINE_CRUNCH_COST);
    activateSprintMode();
    activateDeadlineCrunch();
    expect(getSprintModeState().active).toBe(true);
    expect(getDeadlineCrunchState().active).toBe(true);

    resetHavermoutmelkBuffs();

    expect(getSprintModeState().active).toBe(false);
    expect(getSprintModeState().cooldown).toBe(0);
    expect(getDeadlineCrunchState().active).toBe(false);
    expect(getDeadlineCrunchState().cooldown).toBe(0);
  });
});
