/**
 * TowerSystem — kills mark the target IsDead (zombie-unit regression).
 *
 * Pre-fix the tower only subtracted Health.current and never added the
 * IsDead tag. Nothing else sweeps HP<=0 into IsDead, so the target lived on
 * as a zombie (kept acting, never removed, population never freed) and the
 * tower stayed locked on it. Target selection must also skip HP<=0 units.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, hasComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Building, Faction, Health, UnitType } from '../src/ecs/components';
import { IsBuilding, IsUnit, IsDead } from '../src/ecs/tags';
import { createTowerSystem, TOWER_DAMAGE, TOWER_ATTACK_SPEED } from '../src/systems/TowerSystem';
import { BuildingTypeId, UnitTypeId, FactionId } from '../src/types/index';
import { eventBus } from '../src/core/EventBus';

type World = ReturnType<typeof replaceWorld>;

function spawnTower(world: World, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Building);
  addComponent(world, eid, Faction);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Building.typeId[eid] = BuildingTypeId.DefenseTower;
  Building.complete[eid] = 1;
  Building.progress[eid] = 1.0;
  Faction.id[eid] = FactionId.Brabanders;
  return eid;
}

function spawnEnemy(world: World, x: number, z: number, hp: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, UnitType);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = FactionId.Randstad;
  Health.current[eid] = hp;
  Health.max[eid] = 100;
  UnitType.id[eid] = UnitTypeId.Infantry;
  return eid;
}

type TowerAttackEvent = { towerEid: number; targetEid: number; damage: number };
let events: TowerAttackEvent[] = [];
let off: (() => void) | null = null;

beforeEach(() => {
  events = [];
  if (off) off();
  const handler = (e: TowerAttackEvent) => { events.push(e); };
  eventBus.on('tower-attack' as never, handler as never);
  off = () => eventBus.off('tower-attack' as never, handler as never);
});

describe('TowerSystem — lethal hit marks target dead', () => {
  it('adds IsDead and clamps HP to 0 when the tower kills its target', () => {
    const world = replaceWorld();
    spawnTower(world, 0, 0);
    const target = spawnEnemy(world, 5, 0, TOWER_DAMAGE - 1);

    createTowerSystem()(world, TOWER_ATTACK_SPEED + 0.01);

    expect(hasComponent(world, target, IsDead)).toBe(true);
    expect(Health.current[target]).toBe(0);
  });

  it('non-lethal hit does not mark the target dead', () => {
    const world = replaceWorld();
    spawnTower(world, 0, 0);
    const target = spawnEnemy(world, 5, 0, 100);

    createTowerSystem()(world, TOWER_ATTACK_SPEED + 0.01);

    expect(hasComponent(world, target, IsDead)).toBe(false);
    expect(Health.current[target]).toBeCloseTo(100 - TOWER_DAMAGE, 5);
  });

  it('skips HP<=0 units (no IsDead yet) and picks a live enemy instead', () => {
    const world = replaceWorld();
    spawnTower(world, 0, 0);
    spawnEnemy(world, 2, 0, 0); // closer, but already at 0 HP
    const live = spawnEnemy(world, 8, 0, 100);

    createTowerSystem()(world, TOWER_ATTACK_SPEED + 0.01);

    expect(events).toHaveLength(1);
    expect(events[0].targetEid).toBe(live);
  });
});
