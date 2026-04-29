/**
 * FactionSpecial1Passives — Boardroom passive + Salon passive +
 * Vlaai-Trakteerronde click. v0.42.0 second-functies voor de overige 3
 * FactionSpecial1's (Brabant Carnavalstent had al z'n second-functie via
 * `CarnavalsoptochtSystem` v0.41.0).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Building } from '../src/ecs/components';
import { IsBuilding } from '../src/ecs/tags';
import { playerState } from '../src/core/PlayerState';
import { FactionId, BuildingTypeId, BUREAUCRACY_MAX_STACKS } from '../src/types/index';
import {
  createFactionSpecial1PassivesSystem, resetFactionSpecial1Passives,
  getBoardroomCount, getSalonCount,
  getCorporateSynergyExtraCap, getSalonProtocolCostMult,
  activateVlaaiTrakteer, isVlaaiTrakteerReady, getVlaaiTrakteerState,
  getVlaaiwinkelIntervalMult,
  CORPORATE_SYNERGY_PER_BOARDROOM, CORPORATE_SYNERGY_CAP,
  SALON_PROTOCOL_PER, SALON_PROTOCOL_CAP,
  VLAAI_TRAKTEER_COST, VLAAI_TRAKTEER_DURATION, VLAAI_TRAKTEER_COOLDOWN,
  VLAAI_TRAKTEER_INTERVAL_MULT,
} from '../src/systems/FactionSpecial1Passives';

type World = ReturnType<typeof replaceWorld>;
const tickSystem = createFactionSpecial1PassivesSystem();
function tick(world: World, dt: number) { tickSystem(world, dt); }

function spawnFS1(world: World, x: number, z: number, faction: number, complete = 1): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Building.typeId[eid] = BuildingTypeId.FactionSpecial1;
  Building.complete[eid] = complete;
  return eid;
}

beforeEach(() => {
  playerState.reset();
  resetFactionSpecial1Passives();
});

// ---------------------------------------------------------------------------
// Randstad Boardroom passive — Corporate Synergy
// ---------------------------------------------------------------------------
describe('Boardroom passive — Corporate Synergy', () => {
  it('initial cache is empty', () => {
    expect(getBoardroomCount()).toBe(0);
    expect(getCorporateSynergyExtraCap(FactionId.Randstad)).toBe(0);
  });

  it('counts complete Randstad Boardrooms after tick', () => {
    const world = replaceWorld();
    spawnFS1(world, 0, 0, FactionId.Randstad);
    spawnFS1(world, 10, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(getBoardroomCount()).toBe(2);
    expect(getCorporateSynergyExtraCap(FactionId.Randstad))
      .toBe(2 * CORPORATE_SYNERGY_PER_BOARDROOM);
  });

  it('caps extra cap at CORPORATE_SYNERGY_CAP (+3)', () => {
    const world = replaceWorld();
    for (let i = 0; i < 5; i++) spawnFS1(world, i * 10, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(getCorporateSynergyExtraCap(FactionId.Randstad)).toBe(CORPORATE_SYNERGY_CAP);
  });

  it('zero for non-Randstad', () => {
    const world = replaceWorld();
    spawnFS1(world, 0, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(getCorporateSynergyExtraCap(FactionId.Brabanders)).toBe(0);
    expect(getCorporateSynergyExtraCap(FactionId.Limburgers)).toBe(0);
    expect(getCorporateSynergyExtraCap(FactionId.Belgen)).toBe(0);
  });

  it('skips Brabant/Belgen FS1 from Boardroom-count', () => {
    const world = replaceWorld();
    spawnFS1(world, 0, 0, FactionId.Brabanders);
    spawnFS1(world, 10, 0, FactionId.Belgen);
    tick(world, 1.0);
    expect(getBoardroomCount()).toBe(0);
  });

  it('extends PlayerState efficiency-stack-cap via injected provider', () => {
    const world = replaceWorld();
    spawnFS1(world, 0, 0, FactionId.Randstad);
    spawnFS1(world, 10, 0, FactionId.Randstad);
    tick(world, 1.0);
    // With 2 boardrooms cap = 20 + 2 = 22.
    for (let i = 0; i < 25; i++) playerState.addEfficiencyStack(FactionId.Randstad);
    expect(playerState.getEfficiencyStacks(FactionId.Randstad)).toBe(BUREAUCRACY_MAX_STACKS + 2);
  });
});

// ---------------------------------------------------------------------------
// Belgen Diplomatiek Salon passive — Salon-protocol cost discount
// ---------------------------------------------------------------------------
describe('Salon passive — Salon-protocol cost discount', () => {
  it('1.0 cost-mult zonder Salons', () => {
    expect(getSalonProtocolCostMult(FactionId.Belgen)).toBe(1.0);
  });

  it('-10% per Salon, capped at -30%', () => {
    const world = replaceWorld();
    spawnFS1(world, 0, 0, FactionId.Belgen);
    spawnFS1(world, 10, 0, FactionId.Belgen);
    tick(world, 1.0);
    expect(getSalonProtocolCostMult(FactionId.Belgen)).toBeCloseTo(1 - 2 * SALON_PROTOCOL_PER, 5);
    expect(getSalonCount()).toBe(2);
  });

  it('caps at SALON_PROTOCOL_CAP (-30%) bij 4+ salons', () => {
    const world = replaceWorld();
    for (let i = 0; i < 4; i++) spawnFS1(world, i * 10, 0, FactionId.Belgen);
    tick(world, 1.0);
    expect(getSalonProtocolCostMult(FactionId.Belgen)).toBeCloseTo(1 - SALON_PROTOCOL_CAP, 5);
  });

  it('1.0 voor non-Belgen', () => {
    const world = replaceWorld();
    spawnFS1(world, 0, 0, FactionId.Belgen);
    tick(world, 1.0);
    expect(getSalonProtocolCostMult(FactionId.Brabanders)).toBe(1.0);
    expect(getSalonProtocolCostMult(FactionId.Randstad)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Limburg Vlaaiwinkel click — Vlaai-Trakteerronde
// ---------------------------------------------------------------------------
describe('Vlaai-Trakteerronde click', () => {
  it('starts ready and inactive', () => {
    expect(isVlaaiTrakteerReady()).toBe(true);
    expect(getVlaaiTrakteerState().active).toBe(false);
  });

  it('cannot activate without enough Kolen', () => {
    expect(activateVlaaiTrakteer()).toBe(false);
  });

  it('activates and spends Kolen', () => {
    playerState.addTertiary(FactionId.Limburgers, VLAAI_TRAKTEER_COST);
    expect(activateVlaaiTrakteer()).toBe(true);
    expect(playerState.getTertiary(FactionId.Limburgers)).toBe(0);
    expect(getVlaaiTrakteerState().active).toBe(true);
  });

  it('halves Vlaaiwinkel interval while active', () => {
    expect(getVlaaiwinkelIntervalMult()).toBe(1.0);
    playerState.addTertiary(FactionId.Limburgers, VLAAI_TRAKTEER_COST);
    activateVlaaiTrakteer();
    expect(getVlaaiwinkelIntervalMult()).toBe(VLAAI_TRAKTEER_INTERVAL_MULT);
  });

  it('expires after VLAAI_TRAKTEER_DURATION', () => {
    playerState.addTertiary(FactionId.Limburgers, VLAAI_TRAKTEER_COST);
    activateVlaaiTrakteer();
    const world = replaceWorld();
    tick(world, VLAAI_TRAKTEER_DURATION + 0.1);
    expect(getVlaaiTrakteerState().active).toBe(false);
    expect(getVlaaiwinkelIntervalMult()).toBe(1.0);
  });

  it('cooldown blocks reactivation until elapsed', () => {
    playerState.addTertiary(FactionId.Limburgers, VLAAI_TRAKTEER_COST * 2);
    activateVlaaiTrakteer();
    const world = replaceWorld();
    tick(world, VLAAI_TRAKTEER_DURATION + 0.1);
    expect(activateVlaaiTrakteer()).toBe(false); // cooldown
    tick(world, VLAAI_TRAKTEER_COOLDOWN + 0.1);
    expect(isVlaaiTrakteerReady()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
describe('FactionSpecial1Passives — reset', () => {
  it('clears all caches and buff state', () => {
    const world = replaceWorld();
    spawnFS1(world, 0, 0, FactionId.Randstad);
    spawnFS1(world, 0, 0, FactionId.Belgen);
    tick(world, 1.0);
    playerState.addTertiary(FactionId.Limburgers, VLAAI_TRAKTEER_COST);
    activateVlaaiTrakteer();

    resetFactionSpecial1Passives();

    expect(getBoardroomCount()).toBe(0);
    expect(getSalonCount()).toBe(0);
    expect(getVlaaiTrakteerState().active).toBe(false);
    expect(getVlaaiTrakteerState().cooldown).toBe(0);
  });
});
