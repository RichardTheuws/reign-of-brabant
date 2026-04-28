/**
 * CarnavalsoptochtSystem — Brabant Carnavalstent click-action (v0.41.0).
 *
 * Live-bug v0.40.0 (Richard 2026-04-28): "Bij de carnavalstent zie ik
 * geen mogelijke upgrades / functies". Carnavalstent had alleen passive
 * +20% damage aura via GezeligheidSystem — geen click-action zichtbaar.
 *
 * Fix: tweede tijdelijke buff "Carnavalsoptocht" — kost 75 Gez → 30s
 * alle Brabant units +25% movement speed. 90s cooldown.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { playerState } from '../src/core/PlayerState';
import { FactionId } from '../src/types/index';
import {
  activateCarnavalsoptocht, isCarnavalsoptochtReady, getCarnavalsoptochtState,
  getCarnavalsoptochtSpeedMult, resetCarnavalsoptocht,
  createCarnavalsoptochtSystem,
  CARNAVALSOPTOCHT_COST, CARNAVALSOPTOCHT_DURATION, CARNAVALSOPTOCHT_COOLDOWN,
  CARNAVALSOPTOCHT_SPEED_MULT,
} from '../src/systems/CarnavalsoptochtSystem';

const tickSystem = createCarnavalsoptochtSystem();
function tick(dt: number) { tickSystem({} as any, dt); }

beforeEach(() => {
  playerState.reset();
  resetCarnavalsoptocht();
});

describe('Carnavalsoptocht — click-action', () => {
  it('starts ready and inactive', () => {
    expect(isCarnavalsoptochtReady()).toBe(true);
    expect(getCarnavalsoptochtState().active).toBe(false);
  });

  it('cannot activate without enough Gezelligheid', () => {
    expect(playerState.getGezelligheid(FactionId.Brabanders)).toBe(0);
    expect(activateCarnavalsoptocht()).toBe(false);
  });

  it('activates and spends cost', () => {
    playerState.addGezelligheid(FactionId.Brabanders, CARNAVALSOPTOCHT_COST);
    expect(activateCarnavalsoptocht()).toBe(true);
    expect(playerState.getGezelligheid(FactionId.Brabanders)).toBe(0);
    expect(getCarnavalsoptochtState().active).toBe(true);
    expect(getCarnavalsoptochtState().remaining).toBe(CARNAVALSOPTOCHT_DURATION);
  });

  it('applies +25% speed only to Brabanders while active', () => {
    playerState.addGezelligheid(FactionId.Brabanders, CARNAVALSOPTOCHT_COST);
    activateCarnavalsoptocht();
    expect(getCarnavalsoptochtSpeedMult(FactionId.Brabanders)).toBe(CARNAVALSOPTOCHT_SPEED_MULT);
    expect(getCarnavalsoptochtSpeedMult(FactionId.Randstad)).toBe(1.0);
    expect(getCarnavalsoptochtSpeedMult(FactionId.Limburgers)).toBe(1.0);
    expect(getCarnavalsoptochtSpeedMult(FactionId.Belgen)).toBe(1.0);
  });

  it('expires after CARNAVALSOPTOCHT_DURATION', () => {
    playerState.addGezelligheid(FactionId.Brabanders, CARNAVALSOPTOCHT_COST);
    activateCarnavalsoptocht();
    tick(CARNAVALSOPTOCHT_DURATION + 0.1);
    expect(getCarnavalsoptochtState().active).toBe(false);
    expect(getCarnavalsoptochtSpeedMult(FactionId.Brabanders)).toBe(1.0);
  });

  it('blocks reactivation while active or on cooldown', () => {
    playerState.addGezelligheid(FactionId.Brabanders, CARNAVALSOPTOCHT_COST * 3);
    activateCarnavalsoptocht();
    expect(activateCarnavalsoptocht()).toBe(false); // already active
    tick(CARNAVALSOPTOCHT_DURATION + 0.1); // expire
    expect(activateCarnavalsoptocht()).toBe(false); // still on cooldown
    tick(CARNAVALSOPTOCHT_COOLDOWN + 0.1); // expire cooldown
    expect(isCarnavalsoptochtReady()).toBe(true);
    expect(activateCarnavalsoptocht()).toBe(true);
  });

  it('reset clears active and cooldown', () => {
    playerState.addGezelligheid(FactionId.Brabanders, CARNAVALSOPTOCHT_COST);
    activateCarnavalsoptocht();
    expect(getCarnavalsoptochtState().active).toBe(true);
    resetCarnavalsoptocht();
    expect(getCarnavalsoptochtState().active).toBe(false);
    expect(getCarnavalsoptochtState().cooldown).toBe(0);
  });
});
