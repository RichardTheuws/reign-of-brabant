/**
 * WorstenbroodjeskraamSystem — Brabant Worstenbroodjeskraam (Bundel 4A)
 *
 * Live-bug v0.37.36 (Richard 2026-04-28):
 *   "Het Brabantse gebouw heeft ook geen functie" — Brabant TertiaryResource
 *   archetype ontbrak volledig (alleen mesh-fallback in BUILDING_MODEL_PATHS).
 *
 * Fix: dedicated archetype + 3 functies (per v1.0 perfectie regel).
 *   1. Passive +0.5 Gezelligheid/sec per kraam.
 *   2. Trakteerronde click-action (50 Gez → 30s units +20% speed).
 *   3. Heal-aura — Brabant units in 8u radius regen +0.5 HP/sec.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Building, Health } from '../src/ecs/components';
import { IsBuilding, IsUnit } from '../src/ecs/tags';
import { playerState } from '../src/core/PlayerState';
import { FactionId, BuildingTypeId } from '../src/types/index';
import {
  activateTrakteerronde, isTrakteerrondeReady, getTrakteerrondeState,
  getTrakteerrondeSpeedMult, resetWorstenbroodjeskraamBuffs,
  createWorstenbroodjeskraamSystem,
  TRAKTEERRONDE_COST, TRAKTEERRONDE_DURATION, TRAKTEERRONDE_COOLDOWN, TRAKTEERRONDE_SPEED_MULT,
  KRAAM_GEZELLIGHEID_PER_SEC, KRAAM_HEAL_PER_SEC,
} from '../src/systems/WorstenbroodjeskraamSystem';

type World = ReturnType<typeof replaceWorld>;

const tickSystem = createWorstenbroodjeskraamSystem();
function tick(world: World, dt: number) { tickSystem(world, dt); }

function spawnKraam(world: World, x: number, z: number, faction = FactionId.Brabanders, complete = 1): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Building.typeId[eid] = BuildingTypeId.TertiaryResourceBuilding;
  Building.complete[eid] = complete;
  return eid;
}

function spawnUnit(world: World, x: number, z: number, faction = FactionId.Brabanders, hp = 50, maxHp = 100): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Health.current[eid] = hp;
  Health.max[eid] = maxHp;
  return eid;
}

beforeEach(() => {
  playerState.reset();
  resetWorstenbroodjeskraamBuffs();
});

// ---------------------------------------------------------------------------
// 1. Passive Gezelligheid generation
// ---------------------------------------------------------------------------
describe('Worstenbroodjeskraam — passive Gezelligheid', () => {
  it('generates +0.5 Gezelligheid/sec per complete kraam', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    const before = playerState.getGezelligheid(FactionId.Brabanders);
    tick(world, 1.0);
    expect(playerState.getGezelligheid(FactionId.Brabanders))
      .toBeCloseTo(before + KRAAM_GEZELLIGHEID_PER_SEC, 5);
  });

  it('scales linearly with kraam count', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    spawnKraam(world, 20, 0);
    spawnKraam(world, 40, 0);
    tick(world, 1.0);
    expect(playerState.getGezelligheid(FactionId.Brabanders))
      .toBeCloseTo(3 * KRAAM_GEZELLIGHEID_PER_SEC, 5);
  });

  it('skips incomplete (under-construction) kraampjes', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0, FactionId.Brabanders, /*complete*/ 0);
    tick(world, 1.0);
    expect(playerState.getGezelligheid(FactionId.Brabanders)).toBe(0);
  });

  it('skips non-Brabant TertiaryResource buildings', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0, FactionId.Randstad);
    spawnKraam(world, 10, 0, FactionId.Limburgers);
    tick(world, 1.0);
    expect(playerState.getGezelligheid(FactionId.Brabanders)).toBe(0);
  });

  it('throttles via 1.0s update interval (sub-second tick = no flux)', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    tick(world, 0.3);
    tick(world, 0.3);
    expect(playerState.getGezelligheid(FactionId.Brabanders)).toBe(0); // accumulator < 1.0
    tick(world, 0.5); // accumulator now 1.1, fires
    expect(playerState.getGezelligheid(FactionId.Brabanders))
      .toBeCloseTo(KRAAM_GEZELLIGHEID_PER_SEC, 5);
  });
});

// ---------------------------------------------------------------------------
// 2. Trakteerronde click-action
// ---------------------------------------------------------------------------
describe('Worstenbroodjeskraam — Trakteerronde click-action', () => {
  it('starts ready and inactive', () => {
    expect(isTrakteerrondeReady()).toBe(true);
    expect(getTrakteerrondeState().active).toBe(false);
  });

  it('cannot activate without enough Gezelligheid', () => {
    expect(activateTrakteerronde()).toBe(false);
  });

  it('activates and spends cost', () => {
    playerState.addGezelligheid(FactionId.Brabanders, TRAKTEERRONDE_COST);
    expect(activateTrakteerronde()).toBe(true);
    expect(playerState.getGezelligheid(FactionId.Brabanders)).toBe(0);
    expect(getTrakteerrondeState().active).toBe(true);
    expect(getTrakteerrondeState().remaining).toBe(TRAKTEERRONDE_DURATION);
  });

  it('+20% speed only for Brabanders while active', () => {
    playerState.addGezelligheid(FactionId.Brabanders, TRAKTEERRONDE_COST);
    activateTrakteerronde();
    expect(getTrakteerrondeSpeedMult(FactionId.Brabanders)).toBe(TRAKTEERRONDE_SPEED_MULT);
    expect(getTrakteerrondeSpeedMult(FactionId.Randstad)).toBe(1.0);
    expect(getTrakteerrondeSpeedMult(FactionId.Limburgers)).toBe(1.0);
    expect(getTrakteerrondeSpeedMult(FactionId.Belgen)).toBe(1.0);
  });

  it('expires after TRAKTEERRONDE_DURATION', () => {
    playerState.addGezelligheid(FactionId.Brabanders, TRAKTEERRONDE_COST);
    activateTrakteerronde();
    const world = replaceWorld();
    tick(world, TRAKTEERRONDE_DURATION + 0.1);
    expect(getTrakteerrondeState().active).toBe(false);
    expect(getTrakteerrondeSpeedMult(FactionId.Brabanders)).toBe(1.0);
  });

  it('cooldown blocks reactivation until elapsed', () => {
    playerState.addGezelligheid(FactionId.Brabanders, TRAKTEERRONDE_COST * 3);
    activateTrakteerronde();
    expect(activateTrakteerronde()).toBe(false); // already active
    const world = replaceWorld();
    tick(world, TRAKTEERRONDE_DURATION + 0.1); // expire active
    expect(activateTrakteerronde()).toBe(false); // still on cooldown
    tick(world, TRAKTEERRONDE_COOLDOWN + 0.1); // expire cooldown
    expect(isTrakteerrondeReady()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Heal-aura (passive)
// ---------------------------------------------------------------------------
describe('Worstenbroodjeskraam — heal aura', () => {
  it('Brabant unit within 8u of kraam regenerates +0.5 HP/sec', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    const unit = spawnUnit(world, 5, 0); // 5u away — inside radius
    Health.current[unit] = 50;
    tick(world, 1.0);
    expect(Health.current[unit]).toBeCloseTo(50 + KRAAM_HEAL_PER_SEC, 5);
  });

  it('unit outside 8u is NOT healed', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    const unit = spawnUnit(world, 10, 0); // 10u away — outside 8u radius
    Health.current[unit] = 50;
    tick(world, 1.0);
    expect(Health.current[unit]).toBe(50);
  });

  it('unit at full HP is NOT over-healed', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    const unit = spawnUnit(world, 0, 0, FactionId.Brabanders, /*hp*/ 100, /*max*/ 100);
    tick(world, 1.0);
    expect(Health.current[unit]).toBe(100);
  });

  it('heal does NOT stack across multiple kraampjes (first match wins)', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    spawnKraam(world, 1, 0); // both within 8u of unit at (3, 0)
    const unit = spawnUnit(world, 3, 0);
    Health.current[unit] = 50;
    tick(world, 1.0);
    expect(Health.current[unit]).toBeCloseTo(50 + KRAAM_HEAL_PER_SEC, 5);
  });

  it('non-Brabant units are NOT healed by Brabant kraam', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    const randstadUnit = spawnUnit(world, 3, 0, FactionId.Randstad, 50, 100);
    tick(world, 1.0);
    expect(Health.current[randstadUnit]).toBe(50);
  });

  it('heal clamps to max HP (no overflow)', () => {
    const world = replaceWorld();
    spawnKraam(world, 0, 0);
    const unit = spawnUnit(world, 0, 0, FactionId.Brabanders, /*hp*/ 99.9, /*max*/ 100);
    tick(world, 1.0);
    expect(Health.current[unit]).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Reset behaviour
// ---------------------------------------------------------------------------
describe('Worstenbroodjeskraam — reset', () => {
  it('resetWorstenbroodjeskraamBuffs clears active + cooldown', () => {
    playerState.addGezelligheid(FactionId.Brabanders, TRAKTEERRONDE_COST);
    activateTrakteerronde();
    expect(getTrakteerrondeState().active).toBe(true);
    resetWorstenbroodjeskraamBuffs();
    expect(getTrakteerrondeState().active).toBe(false);
    expect(getTrakteerrondeState().cooldown).toBe(0);
  });
});
