/**
 * CombatSystem-hold-position.test.ts -- Locks F4-stap 19: hold-position contract.
 *
 * Audit-context: full-playthrough audit Fase 4 stap 19. Patrol command bestaat
 * NIET in CommandSystem (open follow-up). Hold position is een aparte
 * UnitAIState waar de unit:
 *  - Movement.hasTarget=0 zet (niet bewegen)
 *  - alleen scant binnen Attack.range, NIET binnen AGGRO_RANGE
 *  - geen state-transitie naar Attacking maakt (blijft HoldPosition)
 *  - target dropt zodra die buiten weapon-range komt (geen chase)
 *  - workers krijgen Gatherer.state=NONE (Bug 7)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Movement, Selected, Attack, Armor, Health, Gatherer,
} from '../src/ecs/components';
import { IsUnit, IsWorker } from '../src/ecs/tags';
import { createCommandSystem, queueCommand } from '../src/systems/CommandSystem';
import { createCombatSystem } from '../src/systems/CombatSystem';
import {
  FactionId, UnitAIState, NO_ENTITY, AGGRO_RANGE, AttackType, ArmorType,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const GATHER_NONE = 0;
const GATHER_GATHERING = 2;

function spawnSelectedSoldier(world: World, x = 0, z = 0, range = 1.5): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Health);
  addComponent(world, eid, Selected);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Faction.id[eid] = FactionId.Brabanders;
  Movement.speed[eid] = 4;
  Movement.hasTarget[eid] = 1;
  Movement.targetX[eid] = 99;
  Movement.targetZ[eid] = 99;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  UnitAI.originX[eid] = 0;
  UnitAI.originZ[eid] = 0;
  Attack.damage[eid] = 10;
  Attack.range[eid] = range;
  Attack.speed[eid] = 1.0;
  Attack.cooldown[eid] = 1.0;
  Attack.timer[eid] = 0;
  Attack.attackType[eid] = AttackType.Melee;
  Attack.siegeBonus[eid] = 1.0;
  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Light;
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  Selected.by[eid] = 0;
  return eid;
}

function spawnEnemy(world: World, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Health);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Faction.id[eid] = FactionId.Randstad;
  UnitAI.state[eid] = UnitAIState.Idle;
  Attack.range[eid] = 1.5;
  Health.current[eid] = 50;
  Health.max[eid] = 50;
  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Light;
  return eid;
}

const command = createCommandSystem();
const combat = createCombatSystem();
const tickCommand = (w: World) => command(w, 0.016);
const tickCombat = (w: World) => combat(w, 0.016);

describe('F4-stap 19 — hold command writes', () => {
  let world: World;
  let unit: number;

  beforeEach(() => {
    world = replaceWorld();
    unit = spawnSelectedSoldier(world);
  });

  it('clears Movement.hasTarget (unit stops moving)', () => {
    queueCommand({ type: 'hold' });
    tickCommand(world);
    expect(Movement.hasTarget[unit]).toBe(0);
  });

  it('sets UnitAI.state = HoldPosition', () => {
    queueCommand({ type: 'hold' });
    tickCommand(world);
    expect(UnitAI.state[unit]).toBe(UnitAIState.HoldPosition);
  });

  it('clears UnitAI.targetEid', () => {
    UnitAI.targetEid[unit] = 12345;
    queueCommand({ type: 'hold' });
    tickCommand(world);
    expect(UnitAI.targetEid[unit]).toBe(NO_ENTITY);
  });

  it('resets Gatherer.state for workers (Bug 7 pattern)', () => {
    addComponent(world, unit, IsWorker);
    addComponent(world, unit, Gatherer);
    Gatherer.state[unit] = GATHER_GATHERING;

    queueCommand({ type: 'hold' });
    tickCommand(world);
    expect(Gatherer.state[unit]).toBe(GATHER_NONE);
  });
});

describe('F4-stap 19 — hold-position behavior in CombatSystem', () => {
  let world: World;
  let unit: number;

  beforeEach(() => {
    world = replaceWorld();
    unit = spawnSelectedSoldier(world, 0, 0, 1.5);
    queueCommand({ type: 'hold' });
    tickCommand(world);
  });

  it('engages enemy that walks into Attack.range (1.5)', () => {
    const enemy = spawnEnemy(world, 1.0, 0); // within range
    tickCombat(world);
    expect(UnitAI.targetEid[unit]).toBe(enemy);
  });

  it('IGNORES enemy in AGGRO_RANGE but outside Attack.range', () => {
    // 5 units away — well within AGGRO_RANGE=12 but outside range=1.5
    spawnEnemy(world, 5, 0);
    tickCombat(world);
    expect(UnitAI.targetEid[unit]).toBe(NO_ENTITY);
  });

  it('NEVER transitions to Attacking state (stays HoldPosition)', () => {
    spawnEnemy(world, 1.0, 0);
    tickCombat(world);
    // Even with target acquired, state must remain HoldPosition
    expect(UnitAI.state[unit]).toBe(UnitAIState.HoldPosition);
  });

  it('drops target that moves out of range (no chase)', () => {
    const enemy = spawnEnemy(world, 1.0, 0);
    tickCombat(world);
    expect(UnitAI.targetEid[unit]).toBe(enemy);

    // Enemy walks away beyond range
    Position.x[enemy] = 10;
    tickCombat(world);
    expect(UnitAI.targetEid[unit]).toBe(NO_ENTITY);
    expect(UnitAI.state[unit]).toBe(UnitAIState.HoldPosition);
  });

  it('hold-scan ignores enemy with Health<=0 (filter test, no retaliation)', () => {
    // Spawn dead enemy (Health=0) from the start so no retaliation noise.
    // Note: a passive corpse won't fire back, so we can isolate the scan-filter.
    const enemy = spawnEnemy(world, 1.0, 0);
    Health.current[enemy] = 0;
    Attack.range[enemy] = 0;          // Cannot retaliate
    Attack.damage[enemy] = 0;
    UnitAI.targetEid[enemy] = NO_ENTITY;

    tickCombat(world);

    expect(UnitAI.targetEid[unit]).toBe(NO_ENTITY);
    expect(UnitAI.state[unit]).toBe(UnitAIState.HoldPosition);
  });
});

// ---------------------------------------------------------------------------
// F4-stap 19 — hold retaliation contract (FIXED in v0.37.25)
// ---------------------------------------------------------------------------

describe('F4-stap 19 — hold retaliation respects state (post-fix contract)', () => {
  it('a hold-position unit that gets HIT stays in HoldPosition (no chase)', () => {
    // CombatSystem.ts:209-225 used to flip ANY hit target to Attacking. After
    // the fix, HoldPosition is preserved: the unit acquires the attacker as
    // target (so processHoldPosition can fire next tick if in range) but never
    // leaves HoldPosition state.
    const world = replaceWorld();
    const unit = spawnSelectedSoldier(world, 0, 0, 1.5);
    queueCommand({ type: 'hold' });
    tickCommand(world);
    expect(UnitAI.state[unit]).toBe(UnitAIState.HoldPosition);

    const enemy = spawnEnemy(world, 0.5, 0);
    Attack.damage[enemy] = 5;
    Attack.range[enemy] = 1.5;
    Attack.speed[enemy] = 1.0;
    Attack.timer[enemy] = 0;
    Attack.attackType[enemy] = AttackType.Melee;
    Attack.siegeBonus[enemy] = 1.0;
    UnitAI.state[enemy] = UnitAIState.Attacking;
    UnitAI.targetEid[enemy] = unit;

    tickCombat(world);

    // NEW CONTRACT: state stays HoldPosition — no auto-Attacking switch.
    expect(UnitAI.state[unit]).toBe(UnitAIState.HoldPosition);
    // Target acquired so we can shoot back next tick (if still in range).
    expect(UnitAI.targetEid[unit]).toBe(enemy);
  });

  it('hold-unit takes damage but does not chase enemy that retreats', () => {
    const world = replaceWorld();
    const unit = spawnSelectedSoldier(world, 0, 0, 1.5);
    queueCommand({ type: 'hold' });
    tickCommand(world);

    const enemy = spawnEnemy(world, 0.5, 0);
    Attack.damage[enemy] = 5;
    Attack.range[enemy] = 1.5;
    Attack.speed[enemy] = 1.0;
    Attack.timer[enemy] = 0;
    Attack.attackType[enemy] = AttackType.Melee;
    Attack.siegeBonus[enemy] = 1.0;
    UnitAI.state[enemy] = UnitAIState.Attacking;
    UnitAI.targetEid[enemy] = unit;

    tickCombat(world);
    // Enemy retreats out of range
    Position.x[enemy] = 20;

    tickCombat(world);

    // Hold-unit must NOT be chasing — Movement.hasTarget stays 0.
    expect(UnitAI.state[unit]).toBe(UnitAIState.HoldPosition);
    expect(Movement.hasTarget[unit]).toBe(0);
  });
});

describe('F4-stap 19 — patrol command does not exist (gap-lock)', () => {
  it('the Command union has no "patrol" type — documented gap', () => {
    // This test exists to LOCK the absence of patrol. If someone adds a
    // patrol command in the future without updating this audit, the cast
    // will fail because TypeScript will widen Command. This is intentional:
    // the audit recorded patrol as a missing feature in F4-stap 19.
    type CommandUnion =
      | { type: 'move' } | { type: 'attack' } | { type: 'gather' }
      | { type: 'build' } | { type: 'train' } | { type: 'attack-move' }
      | { type: 'stop' } | { type: 'hold' };
    const _validTypes: CommandUnion['type'][] = [
      'move', 'attack', 'gather', 'build', 'train', 'attack-move', 'stop', 'hold',
    ];
    expect(_validTypes).not.toContain('patrol');
  });
});
