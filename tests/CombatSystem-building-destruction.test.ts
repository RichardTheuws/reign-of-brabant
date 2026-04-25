/**
 * CombatSystem-building-destruction.test.ts -- Locks F4-stap 22.
 *
 * Audit-context: full-playthrough audit Fase 4 stap 22.
 *
 * Contract:
 *  - Buildings take damage like units (HP drains via processAttacking).
 *  - On Health<=0: IsDead tag added by CombatSystem (line 238-239 mirror for buildings).
 *  - Splash damage hits both units AND buildings within radius (lines 532-552).
 *  - Buildings can be auto-aggro targets when they're enemy faction (lines 278-293).
 *  - Cleanup: DeathSystem emits 'building-destroyed', removes entity (already
 *    locked in DeathSystem.test.ts).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, hasComponent, entityExists } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Movement, Attack, Armor, Health, Building,
} from '../src/ecs/components';
import { IsUnit, IsBuilding, IsDead } from '../src/ecs/tags';
import { createCombatSystem } from '../src/systems/CombatSystem';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import {
  FactionId, UnitAIState, NO_ENTITY, AttackType, ArmorType,
  BuildingTypeId,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnSiegeAttacker(world: World, x = 0, z = 0, splash = 0): number {
  const eid = addEntity(world);
  [Position, Faction, Movement, UnitAI, Attack, Armor, Health, IsUnit].forEach((c) =>
    addComponent(world, eid, c),
  );
  Position.x[eid] = x; Position.z[eid] = z;
  Faction.id[eid] = FactionId.Brabanders;
  Movement.hasTarget[eid] = 0;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  UnitAI.originX[eid] = 0; UnitAI.originZ[eid] = 0;
  Attack.damage[eid] = 30;
  Attack.range[eid] = 8;
  Attack.speed[eid] = 1.0; Attack.cooldown[eid] = 1.0;
  Attack.timer[eid] = 0;
  Attack.attackType[eid] = AttackType.Siege;
  Attack.siegeBonus[eid] = 1.0;
  Attack.splashRadius[eid] = splash;
  Armor.value[eid] = 0; Armor.type[eid] = ArmorType.Light;
  Health.current[eid] = 200; Health.max[eid] = 200;
  return eid;
}

function spawnBldg(
  world: World,
  x: number,
  z: number,
  hp = 100,
  faction = FactionId.Randstad,
  typeId = BuildingTypeId.TownHall,
): number {
  const eid = addEntity(world);
  [Position, Faction, Health, Armor, Building, IsBuilding].forEach((c) =>
    addComponent(world, eid, c),
  );
  Position.x[eid] = x; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Health.current[eid] = hp; Health.max[eid] = hp;
  Armor.value[eid] = 0; Armor.type[eid] = ArmorType.Building;
  Building.typeId[eid] = typeId;
  return eid;
}

const combat = createCombatSystem();
const tickCombat = (w: World, dt = 0.016) => combat(w, dt);

beforeEach(() => {
  playerState.reset();
  eventBus.clear();
});

// ---------------------------------------------------------------------------
// HP drain
// ---------------------------------------------------------------------------

describe('F4-stap 22 — building HP drain via direct attack', () => {
  it('Siege→Building 2x matrix bonus drains HP per tick', () => {
    const world = replaceWorld();
    const a = spawnSiegeAttacker(world);
    const b = spawnBldg(world, 1, 0, 100);
    UnitAI.state[a] = UnitAIState.Attacking;
    UnitAI.targetEid[a] = b;

    tickCombat(world);

    // Damage = 30 (base) * 1.0 (no siegeBonus) * 2.0 (Siege→Building) = 60
    expect(Health.current[b]).toBeCloseTo(40, 4);
  });

  it('IsDead tag added when building HP reaches 0', () => {
    const world = replaceWorld();
    const a = spawnSiegeAttacker(world);
    const b = spawnBldg(world, 1, 0, 30); // weak — one shot
    UnitAI.state[a] = UnitAIState.Attacking;
    UnitAI.targetEid[a] = b;

    tickCombat(world);

    expect(Health.current[b]).toBeLessThanOrEqual(0);
    expect(hasComponent(world, b, IsDead)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Auto-aggro picks up enemy buildings
// ---------------------------------------------------------------------------

describe('F4-stap 22 — auto-aggro engages enemy buildings', () => {
  it('idle unit targets enemy building within AGGRO_RANGE', () => {
    const world = replaceWorld();
    const a = spawnSiegeAttacker(world, 0, 0);
    UnitAI.state[a] = UnitAIState.Idle;
    const bldg = spawnBldg(world, 5, 0, 200);

    tickCombat(world);

    expect(UnitAI.state[a]).toBe(UnitAIState.Attacking);
    expect(UnitAI.targetEid[a]).toBe(bldg);
  });

  it('does NOT target same-faction buildings', () => {
    const world = replaceWorld();
    const a = spawnSiegeAttacker(world, 0, 0);
    UnitAI.state[a] = UnitAIState.Idle;
    spawnBldg(world, 5, 0, 200, FactionId.Brabanders); // friendly

    tickCombat(world);

    expect(UnitAI.state[a]).toBe(UnitAIState.Idle);
    expect(UnitAI.targetEid[a]).toBe(NO_ENTITY);
  });
});

// ---------------------------------------------------------------------------
// Splash hits buildings
// ---------------------------------------------------------------------------

describe('F4-stap 22 — splash damage hits buildings within radius', () => {
  it('splash applies to nearby enemy buildings (linear falloff)', () => {
    const world = replaceWorld();
    const a = spawnSiegeAttacker(world, 0, 0, 4); // splash radius 4
    const primary = spawnBldg(world, 1, 0, 1000);
    const splashed = spawnBldg(world, 2, 0, 1000); // 1 unit from primary, within 4
    const outOfRange = spawnBldg(world, 1, 8, 1000); // > radius from primary
    UnitAI.state[a] = UnitAIState.Attacking;
    UnitAI.targetEid[a] = primary;

    const splashedHpBefore = Health.current[splashed];
    const outHpBefore = Health.current[outOfRange];

    tickCombat(world);

    expect(Health.current[primary]).toBeLessThan(1000);     // primary hit
    expect(Health.current[splashed]).toBeLessThan(splashedHpBefore); // splash
    expect(Health.current[outOfRange]).toBe(outHpBefore);   // untouched
  });

  it('splash does NOT hit same-faction buildings (no friendly fire)', () => {
    const world = replaceWorld();
    const a = spawnSiegeAttacker(world, 0, 0, 4);
    const primary = spawnBldg(world, 1, 0, 1000);
    const friendly = spawnBldg(world, 2, 0, 1000, FactionId.Brabanders);
    UnitAI.state[a] = UnitAIState.Attacking;
    UnitAI.targetEid[a] = primary;
    const friendlyBefore = Health.current[friendly];

    tickCombat(world);

    expect(Health.current[friendly]).toBe(friendlyBefore);
  });
});
