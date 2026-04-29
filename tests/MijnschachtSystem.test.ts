/**
 * MijnschachtSystem — Limburg Mijnschacht 2 click-actions (v0.48.0)
 *
 * Locks the contract:
 *  - Ploegendienst: 30 kolen → +50% Limburg gather rate for 60s, 90s CD
 *  - Drukvuur: 50 kolen → tunnel transit ×0.5 for 30s, 90s CD
 *  - Both are Limburg-only (other factions get 1.0 mults)
 *  - Buffs decay correctly via the system tick
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { playerState } from '../src/core/PlayerState';
import { FactionId } from '../src/types/index';
import {
  activatePloegendienst, isPloegendienstReady, getPloegendienstState,
  activateDrukvuur, isDrukvuurReady, getDrukvuurState,
  getLimburgGatherMult, getLimburgTunnelTransitMult,
  resetMijnschachtBuffs, createMijnschachtSystem,
  PLOEGENDIENST_COST, PLOEGENDIENST_DURATION, PLOEGENDIENST_COOLDOWN, PLOEGENDIENST_GATHER_MULT,
  DRUKVUUR_COST, DRUKVUUR_DURATION, DRUKVUUR_COOLDOWN, DRUKVUUR_TRANSIT_MULT,
} from '../src/systems/MijnschachtSystem';

const tickSystem = createMijnschachtSystem();
function tick(dt: number) { tickSystem({} as never, dt); }

beforeEach(() => {
  playerState.reset();
  resetMijnschachtBuffs();
});

describe('Ploegendienst (click)', () => {
  it('starts ready and inactive', () => {
    expect(isPloegendienstReady()).toBe(true);
    expect(getPloegendienstState().active).toBe(false);
  });

  it('rejects activation without enough kolen', () => {
    expect(activatePloegendienst()).toBe(false);
    expect(getPloegendienstState().active).toBe(false);
  });

  it('activates and spends the cost', () => {
    playerState.addTertiary(FactionId.Limburgers, PLOEGENDIENST_COST);
    expect(activatePloegendienst()).toBe(true);
    expect(playerState.getTertiary(FactionId.Limburgers)).toBe(0);
    expect(getPloegendienstState().active).toBe(true);
    expect(getPloegendienstState().remaining).toBe(PLOEGENDIENST_DURATION);
  });

  it('multiplies gather rate for Limburg only while active', () => {
    playerState.addTertiary(FactionId.Limburgers, PLOEGENDIENST_COST);
    activatePloegendienst();
    expect(getLimburgGatherMult(FactionId.Limburgers)).toBe(PLOEGENDIENST_GATHER_MULT);
    expect(getLimburgGatherMult(FactionId.Brabanders)).toBe(1.0);
    expect(getLimburgGatherMult(FactionId.Randstad)).toBe(1.0);
  });

  it('expires after duration and enters cooldown', () => {
    playerState.addTertiary(FactionId.Limburgers, PLOEGENDIENST_COST);
    activatePloegendienst();
    tick(PLOEGENDIENST_DURATION + 0.1);
    expect(getPloegendienstState().active).toBe(false);
    expect(isPloegendienstReady()).toBe(false);
    expect(getLimburgGatherMult(FactionId.Limburgers)).toBe(1.0);
  });

  it('becomes ready again after cooldown', () => {
    playerState.addTertiary(FactionId.Limburgers, PLOEGENDIENST_COST);
    activatePloegendienst();
    tick(PLOEGENDIENST_COOLDOWN + 0.1);
    expect(isPloegendienstReady()).toBe(true);
  });
});

describe('Drukvuur (click)', () => {
  it('halves tunnel transit for Limburg only while active', () => {
    playerState.addTertiary(FactionId.Limburgers, DRUKVUUR_COST);
    expect(activateDrukvuur()).toBe(true);
    expect(getLimburgTunnelTransitMult(FactionId.Limburgers)).toBe(DRUKVUUR_TRANSIT_MULT);
    expect(getLimburgTunnelTransitMult(FactionId.Brabanders)).toBe(1.0);
  });

  it('rejects double-activation while active', () => {
    playerState.addTertiary(FactionId.Limburgers, DRUKVUUR_COST * 2);
    activateDrukvuur();
    expect(isDrukvuurReady()).toBe(false);
    expect(activateDrukvuur()).toBe(false);
    // Second activation must NOT spend the cost.
    expect(playerState.getTertiary(FactionId.Limburgers)).toBe(DRUKVUUR_COST);
  });

  it('expires after duration', () => {
    playerState.addTertiary(FactionId.Limburgers, DRUKVUUR_COST);
    activateDrukvuur();
    tick(DRUKVUUR_DURATION + 0.1);
    expect(getDrukvuurState().active).toBe(false);
    expect(getLimburgTunnelTransitMult(FactionId.Limburgers)).toBe(1.0);
  });
});
