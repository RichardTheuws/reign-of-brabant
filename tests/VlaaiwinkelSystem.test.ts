/**
 * VlaaiwinkelSystem.test.ts -- Limburg FactionSpecial1 heal-pulse
 *
 * Periodic heal: every 5s, each Limburger unit within 10u of a complete
 * Limburger Vlaaiwinkel gains 10 HP. Multiple Vlaaiwinkels stack
 * (pulses × 10).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitType, Attack, Armor, Movement, Health, Building,
} from '../src/ecs/components';
import { IsUnit, IsBuilding } from '../src/ecs/tags';
import { createVlaaiwinkelSystem } from '../src/systems/VlaaiwinkelSystem';
import { FactionId, UnitTypeId, BuildingTypeId } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnVlaai(world: World, x: number, z: number, faction = FactionId.Limburgers, complete = true): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Position.x[eid] = x; Position.z[eid] = z;
  Building.typeId[eid] = BuildingTypeId.FactionSpecial1;
  Building.complete[eid] = complete ? 1 : 0;
  return eid;
}

function spawnUnit(
  world: World, x: number, z: number,
  faction = FactionId.Limburgers,
  hp = 50, hpMax = 100,
): number {
  const eid = addEntity(world);
  [Position, Faction, UnitType, Attack, Armor, Movement, Health, IsUnit]
    .forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Position.x[eid] = x; Position.z[eid] = z;
  UnitType.id[eid] = UnitTypeId.Infantry;
  Health.current[eid] = hp;
  Health.max[eid] = hpMax;
  return eid;
}

function tickInterval(sys: ReturnType<typeof createVlaaiwinkelSystem>, world: World): void {
  // 6s spans the 5s throttle exactly once.
  sys(world, 6.0);
}

beforeEach(() => {
  // No global state to reset; system uses local accumulator per instance.
});

describe('VlaaiwinkelSystem — passive heal', () => {
  it('Limburger unit within 10u → +10 HP', () => {
    const world = replaceWorld();
    const sys = createVlaaiwinkelSystem();
    spawnVlaai(world, 0, 0);
    const unit = spawnUnit(world, 5, 0); // dist² = 25 ≤ 100
    tickInterval(sys, world);
    expect(Health.current[unit]).toBe(60);
  });

  it('Limburger unit OUTSIDE 10u → no heal', () => {
    const world = replaceWorld();
    const sys = createVlaaiwinkelSystem();
    spawnVlaai(world, 0, 0);
    const unit = spawnUnit(world, 15, 0); // dist² = 225 > 100
    tickInterval(sys, world);
    expect(Health.current[unit]).toBe(50);
  });

  it('non-Limburger unit within radius → no heal (faction-locked)', () => {
    const world = replaceWorld();
    const sys = createVlaaiwinkelSystem();
    spawnVlaai(world, 0, 0);
    const unit = spawnUnit(world, 5, 0, FactionId.Brabanders);
    tickInterval(sys, world);
    expect(Health.current[unit]).toBe(50);
  });

  it('2 Vlaaiwinkels overlap → heal stacks (+20)', () => {
    const world = replaceWorld();
    const sys = createVlaaiwinkelSystem();
    spawnVlaai(world, 0, 0);
    spawnVlaai(world, 3, 0);
    const unit = spawnUnit(world, 1, 0);
    tickInterval(sys, world);
    expect(Health.current[unit]).toBe(70);
  });

  it('full-HP unit → clamped at max', () => {
    const world = replaceWorld();
    const sys = createVlaaiwinkelSystem();
    spawnVlaai(world, 0, 0);
    const unit = spawnUnit(world, 5, 0, FactionId.Limburgers, 95, 100);
    tickInterval(sys, world);
    expect(Health.current[unit]).toBe(100);
  });

  it('throttle: tick(4s) does not fire', () => {
    const world = replaceWorld();
    const sys = createVlaaiwinkelSystem();
    spawnVlaai(world, 0, 0);
    const unit = spawnUnit(world, 5, 0);
    sys(world, 4.0);
    expect(Health.current[unit]).toBe(50);
  });

  it('incomplete Vlaaiwinkel → no heal', () => {
    const world = replaceWorld();
    const sys = createVlaaiwinkelSystem();
    spawnVlaai(world, 0, 0, FactionId.Limburgers, false);
    const unit = spawnUnit(world, 5, 0);
    tickInterval(sys, world);
    expect(Health.current[unit]).toBe(50);
  });

  it('zero Vlaaiwinkels → early return, no errors', () => {
    const world = replaceWorld();
    const sys = createVlaaiwinkelSystem();
    const unit = spawnUnit(world, 5, 0);
    tickInterval(sys, world);
    expect(Health.current[unit]).toBe(50);
  });
});
