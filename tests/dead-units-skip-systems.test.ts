/**
 * Dead units (IsDead, awaiting DeathSystem removal) must not keep acting:
 * no attacking (CombatSystem), no moving (MovementSystem), no gathering
 * (GatherSystem) during the death-animation window.
 */
import { describe, it, expect } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Movement, Attack, Armor, Health, Gatherer, Resource,
} from '../src/ecs/components';
import { IsUnit, IsDead, IsWorker, IsResource } from '../src/ecs/tags';
import { createCombatSystem } from '../src/systems/CombatSystem';
import { createMovementSystem } from '../src/systems/MovementSystem';
import { createGatherSystem } from '../src/systems/GatherSystem';
import type { Terrain } from '../src/world/Terrain';
import {
  FactionId, UnitAIState, NO_ENTITY, AttackType, ArmorType, ResourceType, CARRY_CAPACITY,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnFighter(world: World, x: number, faction: FactionId): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Health);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x;
  Position.z[eid] = 0;
  Faction.id[eid] = faction;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Attack.damage[eid] = 10;
  Attack.range[eid] = 1.5;
  Attack.speed[eid] = 1.0;
  Attack.timer[eid] = 0;
  Attack.attackType[eid] = AttackType.Melee;
  Attack.siegeBonus[eid] = 1.0;
  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Light;
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  Movement.speed[eid] = 4;
  return eid;
}

const flatTerrain = {
  isOnRoad: () => false,
  getHeightAt: () => 0,
} as unknown as Terrain;

describe('Dead units stop acting', () => {
  it('a dead attacker deals no damage', () => {
    const world = replaceWorld();
    const attacker = spawnFighter(world, 0, FactionId.Brabanders);
    const target = spawnFighter(world, 1, FactionId.Randstad);
    UnitAI.state[target] = UnitAIState.HoldPosition;
    Attack.timer[target] = 99;
    UnitAI.state[attacker] = UnitAIState.Attacking;
    UnitAI.targetEid[attacker] = target;
    Health.current[attacker] = 0;
    addComponent(world, attacker, IsDead);

    createCombatSystem()(world, 0.016);

    expect(Health.current[target]).toBe(100);
  });

  it('a dead unit does not move', () => {
    const world = replaceWorld();
    const unit = spawnFighter(world, 0, FactionId.Brabanders);
    Movement.hasTarget[unit] = 1;
    Movement.targetX[unit] = 50;
    Movement.targetZ[unit] = 0;
    addComponent(world, unit, IsDead);

    createMovementSystem(flatTerrain)(world, 0.5);

    expect(Position.x[unit]).toBe(0);
  });

  it('a dead worker does not harvest', () => {
    const world = replaceWorld();
    const res = addEntity(world);
    addComponent(world, res, Position);
    addComponent(world, res, Resource);
    addComponent(world, res, IsResource);
    Position.x[res] = 0.5;
    Resource.type[res] = ResourceType.Gold;
    Resource.amount[res] = 500;
    Resource.maxAmount[res] = 500;

    const worker = addEntity(world);
    addComponent(world, worker, Position);
    addComponent(world, worker, Faction);
    addComponent(world, worker, Movement);
    addComponent(world, worker, Gatherer);
    addComponent(world, worker, IsUnit);
    addComponent(world, worker, IsWorker);
    Faction.id[worker] = FactionId.Brabanders;
    Gatherer.state[worker] = 2; // GATHERING
    Gatherer.targetEid[worker] = res;
    Gatherer.carrying[worker] = 0;
    Gatherer.carryCapacity[worker] = CARRY_CAPACITY;
    Gatherer.resourceType[worker] = ResourceType.Gold;
    addComponent(world, worker, IsDead);

    createGatherSystem()(world, 1.0);

    expect(Gatherer.carrying[worker]).toBe(0);
    expect(Resource.amount[res]).toBe(500);
  });
});
