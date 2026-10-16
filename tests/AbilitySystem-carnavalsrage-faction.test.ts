/**
 * AbilitySystem-carnavalsrage-faction.test.ts — Carnavalsrage (V) is a
 * Brabander-only ability. It must only activate when the PLAYER plays
 * Brabanders, and must spend the player's Gezelligheid. For any other
 * player faction V does nothing (previously it buffed the enemy
 * Brabanders AI and drained their Gezelligheid).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { activateCarnavalsrage, getCarnavalsrageState, resetAbilitySystem } from '../src/systems/AbilitySystem';
import { playerState } from '../src/core/PlayerState';
import { FactionId } from '../src/types/index';

describe('Carnavalsrage player-faction gate', () => {
  beforeEach(() => {
    playerState.reset();
    resetAbilitySystem();
    playerState.addGezelligheid(FactionId.Brabanders, 150);
    playerState.addGezelligheid(FactionId.Randstad, 150);
  });

  it('activates for a Brabander player and spends their Gezelligheid', () => {
    const before = playerState.getGezelligheid(FactionId.Brabanders);
    expect(activateCarnavalsrage(FactionId.Brabanders)).toBe(true);
    expect(getCarnavalsrageState().active).toBe(true);
    expect(playerState.getGezelligheid(FactionId.Brabanders)).toBe(before - 100);
  });

  it('does nothing for a non-Brabander player (no enemy buff, no spend)', () => {
    const brabBefore = playerState.getGezelligheid(FactionId.Brabanders);
    const randBefore = playerState.getGezelligheid(FactionId.Randstad);
    expect(activateCarnavalsrage(FactionId.Randstad)).toBe(false);
    expect(getCarnavalsrageState().active).toBe(false);
    expect(playerState.getGezelligheid(FactionId.Brabanders)).toBe(brabBefore);
    expect(playerState.getGezelligheid(FactionId.Randstad)).toBe(randBefore);
  });

  it('rejects Belgen and Limburgers too', () => {
    expect(activateCarnavalsrage(FactionId.Belgen)).toBe(false);
    expect(activateCarnavalsrage(FactionId.Limburgers)).toBe(false);
    expect(getCarnavalsrageState().active).toBe(false);
  });
});
