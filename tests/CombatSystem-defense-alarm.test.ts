/**
 * CombatSystem — defense alarm (v0.45.0)
 *
 * Live-bug Richard 2026-04-29: "het defense mechanism van de troops nu
 * niet optimaal te functioneren als je aangevallen wordt in skirmish".
 * Pre-v0.45.0 retaliation triggerde alleen voor de DIRECT geraakte unit.
 * Nearby idle defenders moesten manueel worden geselecteerd om mee te
 * vechten — terwijl ze er pal naast stonden.
 *
 * Fix: `triggerNearbyDefense(world, victim, aggressor)` scant idle
 * friendly combat-units binnen ALARM_RADIUS (12u) en switched ze naar
 * Attacking met de aggressor als target. Workers blijven gathering;
 * HoldPosition units krijgen alleen target zonder state-switch; al
 * Attacking-units worden niet onderbroken; cap ALARM_MAX (5).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, Movement, UnitAI, Attack, Armor, Health,
} from '../src/ecs/components';
import { IsUnit, IsWorker, IsDead } from '../src/ecs/tags';
import { triggerNearbyDefense, ALARM_RADIUS, ALARM_MAX } from '../src/systems/CombatSystem';
import {
  FactionId, UnitAIState, NO_ENTITY, AttackType, ArmorType,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnSoldier(world: World, x: number, z: number, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Health);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Movement.speed[eid] = 4;
  Movement.hasTarget[eid] = 0;
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
  return eid;
}

function spawnWorker(world: World, x: number, z: number, faction = FactionId.Brabanders): number {
  const eid = spawnSoldier(world, x, z, faction);
  addComponent(world, eid, IsWorker);
  Attack.damage[eid] = 0; // workers normaal 0 dmg, ook niet-combat
  return eid;
}

beforeEach(() => {
  replaceWorld();
});

// ---------------------------------------------------------------------------
describe('CombatSystem — defense alarm', () => {
  it('idle nearby friendly combat-unit switches to Attacking with aggressor as target', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0, FactionId.Brabanders);
    Health.current[victim] = 50; // got hit
    const defender = spawnSoldier(world, 3, 0, FactionId.Brabanders); // 3u away — within 12u
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Randstad);

    triggerNearbyDefense(world, victim, aggressor);

    expect(UnitAI.state[defender]).toBe(UnitAIState.Attacking);
    expect(UnitAI.targetEid[defender]).toBe(aggressor);
  });

  it('idle defender outside ALARM_RADIUS is NOT alerted', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0);
    const farDefender = spawnSoldier(world, ALARM_RADIUS + 1, 0); // just outside
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Randstad);

    triggerNearbyDefense(world, victim, aggressor);

    expect(UnitAI.state[farDefender]).toBe(UnitAIState.Idle);
    expect(UnitAI.targetEid[farDefender]).toBe(NO_ENTITY);
  });

  it('worker (IsWorker) does NOT respond — keeps gathering', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0);
    const worker = spawnWorker(world, 2, 0);
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Randstad);

    triggerNearbyDefense(world, victim, aggressor);

    expect(UnitAI.state[worker]).toBe(UnitAIState.Idle);
    expect(UnitAI.targetEid[worker]).toBe(NO_ENTITY);
  });

  it('enemy faction units are NOT alerted to defend', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0, FactionId.Brabanders);
    const enemy = spawnSoldier(world, 3, 0, FactionId.Randstad);
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Belgen);

    triggerNearbyDefense(world, victim, aggressor);

    expect(UnitAI.state[enemy]).toBe(UnitAIState.Idle);
  });

  it('already-Attacking unit does NOT switch target (no thrash)', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0);
    const defender = spawnSoldier(world, 3, 0);
    UnitAI.state[defender] = UnitAIState.Attacking;
    const otherTarget = 99;
    UnitAI.targetEid[defender] = otherTarget;
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Randstad);

    triggerNearbyDefense(world, victim, aggressor);

    expect(UnitAI.targetEid[defender]).toBe(otherTarget); // unchanged
  });

  it('HoldPosition unit acquires target without state-switch', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0);
    const holder = spawnSoldier(world, 3, 0);
    UnitAI.state[holder] = UnitAIState.HoldPosition;
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Randstad);

    triggerNearbyDefense(world, victim, aggressor);

    expect(UnitAI.state[holder]).toBe(UnitAIState.HoldPosition); // state preserved
    expect(UnitAI.targetEid[holder]).toBe(aggressor);            // target acquired
  });

  it('caps at ALARM_MAX defenders (no base-wipe stampede)', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0);
    const defenders: number[] = [];
    for (let i = 0; i < ALARM_MAX + 3; i++) {
      defenders.push(spawnSoldier(world, i + 1, 0));
    }
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Randstad);

    triggerNearbyDefense(world, victim, aggressor);

    const alerted = defenders.filter(d => UnitAI.state[d] === UnitAIState.Attacking);
    expect(alerted.length).toBe(ALARM_MAX);
  });

  it('dead defender is skipped', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0);
    const deadDefender = spawnSoldier(world, 3, 0);
    addComponent(world, deadDefender, IsDead);
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Randstad);

    triggerNearbyDefense(world, victim, aggressor);

    expect(UnitAI.state[deadDefender]).toBe(UnitAIState.Idle); // ignored
  });

  it('non-combat unit (Attack.damage 0) is skipped', () => {
    const world = replaceWorld();
    const victim = spawnSoldier(world, 0, 0);
    const noncombat = spawnSoldier(world, 3, 0);
    Attack.damage[noncombat] = 0;
    const aggressor = spawnSoldier(world, 50, 50, FactionId.Randstad);

    triggerNearbyDefense(world, victim, aggressor);

    expect(UnitAI.state[noncombat]).toBe(UnitAIState.Idle);
  });
});
