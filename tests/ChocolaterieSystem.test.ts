/**
 * ChocolaterieSystem — Belgen passive (Pralines voor Iedereen, v0.48.0).
 *
 * Per 100 chocolade in voorraad → +5% diplomacy duration. Cap +25%.
 * Stacks linearly — alleen Belgen krijgt de bonus.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { playerState } from '../src/core/PlayerState';
import { FactionId } from '../src/types/index';
import {
  getPralinesStacks, getPralinesDurationMult,
  PRALINES_PER_STACK, PRALINES_PER_STACK_BONUS, PRALINES_MAX_STACKS,
} from '../src/systems/ChocolaterieSystem';

beforeEach(() => {
  playerState.reset();
});

describe('Pralines voor Iedereen (passive)', () => {
  it('returns 0 stacks at empty voorraad', () => {
    expect(getPralinesStacks()).toBe(0);
    expect(getPralinesDurationMult(FactionId.Belgen)).toBe(1.0);
  });

  it('scales linearly per 100 chocolade up to the cap', () => {
    for (let stacks = 1; stacks <= PRALINES_MAX_STACKS; stacks++) {
      playerState.reset();
      playerState.addTertiary(FactionId.Belgen, stacks * PRALINES_PER_STACK);
      expect(getPralinesStacks()).toBe(stacks);
      expect(getPralinesDurationMult(FactionId.Belgen)).toBeCloseTo(1 + stacks * PRALINES_PER_STACK_BONUS);
    }
  });

  it('caps at max-stacks even with overflowing voorraad', () => {
    playerState.addTertiary(FactionId.Belgen, PRALINES_PER_STACK * (PRALINES_MAX_STACKS + 5));
    expect(getPralinesStacks()).toBe(PRALINES_MAX_STACKS);
    expect(getPralinesDurationMult(FactionId.Belgen)).toBeCloseTo(1 + PRALINES_MAX_STACKS * PRALINES_PER_STACK_BONUS);
  });

  it('returns 1.0 for non-Belgen factions even with full voorraad', () => {
    playerState.addTertiary(FactionId.Brabanders, 1000);
    playerState.addTertiary(FactionId.Randstad, 1000);
    playerState.addTertiary(FactionId.Limburgers, 1000);
    expect(getPralinesDurationMult(FactionId.Brabanders)).toBe(1.0);
    expect(getPralinesDurationMult(FactionId.Randstad)).toBe(1.0);
    expect(getPralinesDurationMult(FactionId.Limburgers)).toBe(1.0);
  });
});
