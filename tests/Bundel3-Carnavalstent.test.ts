/**
 * Bundel3-Carnavalstent.test.ts -- Brabant FactionSpecial1 aura
 *
 * Carnavalstent aura: +20% attackMult on Brabander units within 12u radius.
 * Multiplicative-stack with Carnavalsvuur (1.10 × 1.20 = 1.32) and tier-bonus.
 * Non-stacking between multiple Carnavalstents (break after first hit).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitType, Attack, Armor, Movement, Health, Building,
  GezeligheidBonus,
} from '../src/ecs/components';
import { IsUnit, IsBuilding } from '../src/ecs/tags';
import { createGezeligheidSystem } from '../src/systems/GezeligheidSystem';
import { techTreeSystem } from '../src/systems/TechTreeSystem';
import { playerState } from '../src/core/PlayerState';
import {
  FactionId, UnitTypeId, BuildingTypeId, UpgradeId,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnTent(world: World, x: number, z: number, faction = FactionId.Brabanders, complete = true): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Position.x[eid] = x; Position.z[eid] = z;
  Building.typeId[eid] = BuildingTypeId.FactionSpecial1;
  Building.complete[eid] = complete ? 1 : 0;
  return eid;
}

function spawnTownHall(world: World, x: number, z: number, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Position.x[eid] = x; Position.z[eid] = z;
  Building.typeId[eid] = BuildingTypeId.TownHall;
  Building.complete[eid] = 1;
  return eid;
}

function spawnUnit(world: World, x: number, z: number, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  [Position, Faction, UnitType, Attack, Armor, Movement, Health, GezeligheidBonus, IsUnit]
    .forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Position.x[eid] = x; Position.z[eid] = z;
  UnitType.id[eid] = UnitTypeId.Infantry;
  Attack.damage[eid] = 10;
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  GezeligheidBonus.attackMult[eid] = 1.0;
  GezeligheidBonus.speedMult[eid] = 1.0;
  GezeligheidBonus.armorMult[eid] = 1.0;
  return eid;
}

function tickTwice(system: ReturnType<typeof createGezeligheidSystem>, world: World): void {
  // Two 0.6s ticks crosses the 500ms throttle to ensure the bonus pass runs.
  system(world, 0.6);
  system(world, 0.0);
}

beforeEach(() => {
  techTreeSystem.reset();
  playerState.reset();
});

describe('Carnavalstent — Brabant FactionSpecial1 aura', () => {
  it('Brabander unit within 12u of Carnavalstent → attackMult *= 1.20', () => {
    const world = replaceWorld();
    const sys = createGezeligheidSystem();
    spawnTent(world, 0, 0);
    const unit = spawnUnit(world, 5, 0); // dist² = 25 ≤ 144
    tickTwice(sys, world);
    expect(GezeligheidBonus.attackMult[unit]).toBeCloseTo(1.20, 5);
  });

  it('Brabander unit OUTSIDE 12u → no aura applied', () => {
    const world = replaceWorld();
    const sys = createGezeligheidSystem();
    spawnTent(world, 0, 0);
    const unit = spawnUnit(world, 20, 0); // dist² = 400 > 144
    tickTwice(sys, world);
    expect(GezeligheidBonus.attackMult[unit]).toBeCloseTo(1.0, 5);
  });

  it('incomplete Carnavalstent → no aura', () => {
    const world = replaceWorld();
    const sys = createGezeligheidSystem();
    spawnTent(world, 0, 0, FactionId.Brabanders, false);
    const unit = spawnUnit(world, 5, 0);
    tickTwice(sys, world);
    expect(GezeligheidBonus.attackMult[unit]).toBeCloseTo(1.0, 5);
  });

  it('non-Brabant unit within radius → no aura (faction-locked)', () => {
    const world = replaceWorld();
    const sys = createGezeligheidSystem();
    spawnTent(world, 0, 0);
    const unit = spawnUnit(world, 5, 0, FactionId.Randstad);
    tickTwice(sys, world);
    expect(GezeligheidBonus.attackMult[unit]).toBeCloseTo(1.0, 5);
  });

  it('2 Carnavalstents in overlap → aura does NOT stack (1.20, not 1.44)', () => {
    const world = replaceWorld();
    const sys = createGezeligheidSystem();
    spawnTent(world, 0, 0);
    spawnTent(world, 3, 0);
    const unit = spawnUnit(world, 1, 0); // in radius of both
    tickTwice(sys, world);
    expect(GezeligheidBonus.attackMult[unit]).toBeCloseTo(1.20, 5);
  });

  it('Carnavalstent + Carnavalsvuur stack multiplicatively (1.20 × 1.10 = 1.32)', () => {
    const world = replaceWorld();
    const sys = createGezeligheidSystem();
    techTreeSystem.getCompleted(FactionId.Brabanders); // ensure faction state inited
    // Force-research Carnavalsvuur (write to internal completed-set via faction state init)
    const state = (techTreeSystem as unknown as { factions: Map<number, { completed: Set<UpgradeId> }> }).factions;
    state.get(FactionId.Brabanders)?.completed.add(UpgradeId.Carnavalsvuur);
    spawnTownHall(world, 0, 0);
    spawnTent(world, 2, 0);
    const unit = spawnUnit(world, 1, 0); // in both 8u TownHall and 12u tent radius
    tickTwice(sys, world);
    expect(GezeligheidBonus.attackMult[unit]).toBeCloseTo(1.32, 4);
  });
});
