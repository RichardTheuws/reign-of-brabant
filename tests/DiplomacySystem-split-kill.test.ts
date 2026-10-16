/**
 * DiplomacySystem-split-kill.test.ts -- Belgen damage-split must mark kills dead
 *
 * Redirected split damage used to subtract HP without adding IsDead. DeathSystem
 * only processes [IsDead], so a split-killed enemy became a zombie.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, hasComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Health, Faction, Attack, Armor } from '../src/ecs/components';
import { IsUnit, IsDead } from '../src/ecs/tags';
import { createDiplomacySystem, resetDiplomacy } from '../src/systems/DiplomacySystem';
import { eventBus } from '../src/core/EventBus';
import { FactionId } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnUnit(world: World, faction: number, x: number, hp: number): number {
  const eid = addEntity(world);
  [Position, Health, Faction, Attack, Armor, IsUnit].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Position.x[eid] = x; Position.z[eid] = 0;
  Health.current[eid] = hp; Health.max[eid] = Math.max(hp, 100);
  Armor.value[eid] = 0;
  return eid;
}

beforeEach(() => {
  eventBus.clear();
  resetDiplomacy();
});

describe('DiplomacySystem — damage split kills', () => {
  it('enemy killed by split damage gets IsDead and HP clamped to 0', () => {
    const world = replaceWorld();
    const sys = createDiplomacySystem();
    sys(world, 0); // registers combat-hit listener

    const belg = spawnUnit(world, FactionId.Belgen, 0, 100);
    const attacker = spawnUnit(world, FactionId.Randstad, 20, 100);
    const victim = spawnUnit(world, FactionId.Randstad, 2, 1);
    Attack.damage[attacker] = 200; // big hit → large split

    eventBus.emit('combat-hit', { attackerEid: attacker, targetEid: belg } as never);
    sys(world, 0.016);

    expect(Health.current[victim]).toBe(0);
    expect(hasComponent(world, victim, IsDead)).toBe(true);
  });

  it('enemy that survives split damage is not marked dead', () => {
    const world = replaceWorld();
    const sys = createDiplomacySystem();
    sys(world, 0);

    const belg = spawnUnit(world, FactionId.Belgen, 0, 100);
    const attacker = spawnUnit(world, FactionId.Randstad, 20, 100);
    const victim = spawnUnit(world, FactionId.Randstad, 2, 1000);
    Attack.damage[attacker] = 200;

    eventBus.emit('combat-hit', { attackerEid: attacker, targetEid: belg } as never);
    sys(world, 0.016);

    expect(Health.current[victim]).toBeLessThan(1000);
    expect(hasComponent(world, victim, IsDead)).toBe(false);
  });
});
