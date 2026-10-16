/**
 * CombatSystem — hold-position kills mark the target IsDead.
 *
 * Pre-fix processHoldPosition clamped HP to 0 but never added IsDead
 * (the normal Attacking path does), leaving a 0-HP zombie that DeathSystem
 * never removes.
 */
import { describe, it, expect } from 'vitest';
import { addEntity, addComponent, hasComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, UnitAI, Movement, Attack, Armor, Health } from '../src/ecs/components';
import { IsUnit, IsDead } from '../src/ecs/tags';
import { createCombatSystem } from '../src/systems/CombatSystem';
import { FactionId, UnitAIState, NO_ENTITY, AttackType, ArmorType } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnFighter(world: World, x: number, faction: FactionId, hp: number, state: UnitAIState): number {
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
  UnitAI.state[eid] = state;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Attack.damage[eid] = 10;
  Attack.range[eid] = 1.5;
  Attack.speed[eid] = 1.0;
  Attack.timer[eid] = 0;
  Attack.attackType[eid] = AttackType.Melee;
  Attack.siegeBonus[eid] = 1.0;
  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Light;
  Health.current[eid] = hp;
  Health.max[eid] = 100;
  return eid;
}

describe('CombatSystem — hold-position lethal hit', () => {
  it('adds IsDead to the target and clears the holder target', () => {
    const world = replaceWorld();
    const holder = spawnFighter(world, 0, FactionId.Brabanders, 100, UnitAIState.HoldPosition);
    // Enemy on HoldPosition too so it does not swing back this tick.
    const victim = spawnFighter(world, 1, FactionId.Randstad, 5, UnitAIState.HoldPosition);
    Attack.timer[victim] = 99;
    UnitAI.targetEid[holder] = victim;

    createCombatSystem()(world, 0.016);

    expect(Health.current[victim]).toBe(0);
    expect(hasComponent(world, victim, IsDead)).toBe(true);
    expect(UnitAI.targetEid[holder]).toBe(NO_ENTITY);
    expect(UnitAI.state[holder]).toBe(UnitAIState.HoldPosition);
  });
});
