/**
 * CombatSystem-attack-move.test.ts -- Locks F4-stap 18: attack-move (A-key).
 *
 * Audit-context: full-playthrough audit Fase 4 stap 18. CombatSystem.test.ts
 * dekt alleen de pure damage-formule. Attack-move is een SAMENSPEL van
 * CommandSystem (zet state) en CombatSystem (auto-aggro tijdens move).
 *
 * Contract:
 *  - 'attack-move' command zet Movement.hasTarget=1, UnitAI.state=Idle,
 *    UnitAI.targetEid=NO_ENTITY, UnitAI.originX/Z = doelcoordinaten,
 *    voegt NeedsPathfinding toe.
 *  - Workers krijgen Gatherer.state=NONE (Bug 7-patroon).
 *  - Idle units met hasTarget=1 worden door CombatSystem.processAutoAggro
 *    onderzocht: zodra een vijand binnen AGGRO_RANGE komt → state=Attacking,
 *    targetEid wordt gezet — terwijl hasTarget=1 blijft (combat is autonoom).
 *  - Vijanden buiten AGGRO_RANGE worden NIET aangevallen.
 *  - Eigen factie wordt NIET als target gekozen.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, hasComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Movement, Selected, Attack, Armor, Health, Gatherer,
} from '../src/ecs/components';
import { IsUnit, IsWorker, NeedsPathfinding } from '../src/ecs/tags';
import { createCommandSystem, queueCommand } from '../src/systems/CommandSystem';
import { createCombatSystem } from '../src/systems/CombatSystem';
import {
  FactionId, UnitAIState, NO_ENTITY, AGGRO_RANGE, AttackType, ArmorType,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const GATHER_NONE = 0;
const GATHER_GATHERING = 2;

function spawnSelectedSoldier(
  world: World,
  x = 0,
  z = 0,
  faction = FactionId.Brabanders,
): number {
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
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = faction;
  Movement.speed[eid] = 4;
  Movement.hasTarget[eid] = 0;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  UnitAI.originX[eid] = 0;
  UnitAI.originZ[eid] = 0;
  Attack.damage[eid] = 10;
  Attack.range[eid] = 1.5;
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

function spawnSelectedWorker(world: World, x = 0, z = 0): number {
  const eid = spawnSelectedSoldier(world, x, z);
  addComponent(world, eid, IsWorker);
  addComponent(world, eid, Gatherer);
  Gatherer.state[eid] = GATHER_GATHERING;
  Gatherer.targetEid[eid] = 999;
  Gatherer.carrying[eid] = 5;
  return eid;
}

function spawnEnemy(world: World, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Health);
  addComponent(world, eid, Armor);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = FactionId.Randstad;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Attack.range[eid] = 1.5;
  Attack.damage[eid] = 5;
  Health.current[eid] = 50;
  Health.max[eid] = 50;
  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Light;
  return eid;
}

const command = createCommandSystem();
const combat = createCombatSystem();

const tickCommand = (world: World) => command(world, 0.016);
const tickCombat = (world: World) => combat(world, 0.016);

// ---------------------------------------------------------------------------
// Stap 18 — attack-move command writes
// ---------------------------------------------------------------------------

describe('F4-stap 18 — attack-move command writes', () => {
  let world: World;
  let unit: number;

  beforeEach(() => {
    world = replaceWorld();
    unit = spawnSelectedSoldier(world, 0, 0);
  });

  it('sets Movement.hasTarget=1 and Movement target coordinates', () => {
    queueCommand({ type: 'attack-move', targetX: 50, targetZ: 30 });
    tickCommand(world);

    expect(Movement.hasTarget[unit]).toBe(1);
    expect(Movement.targetX[unit]).toBeCloseTo(50, 5);
    expect(Movement.targetZ[unit]).toBeCloseTo(30, 5);
  });

  it('sets UnitAI.state=Idle (NOT Moving) so processAutoAggro keeps firing', () => {
    queueCommand({ type: 'attack-move', targetX: 50, targetZ: 30 });
    tickCommand(world);

    expect(UnitAI.state[unit]).toBe(UnitAIState.Idle);
    expect(UnitAI.targetEid[unit]).toBe(NO_ENTITY);
  });

  it('stores destination as leash origin (originX/Z)', () => {
    queueCommand({ type: 'attack-move', targetX: 50, targetZ: 30 });
    tickCommand(world);

    expect(UnitAI.originX[unit]).toBeCloseTo(50, 5);
    expect(UnitAI.originZ[unit]).toBeCloseTo(30, 5);
  });

  it('adds NeedsPathfinding tag', () => {
    queueCommand({ type: 'attack-move', targetX: 50, targetZ: 30 });
    tickCommand(world);

    expect(hasComponent(world, unit, NeedsPathfinding)).toBe(true);
  });

  it('resets Gatherer.state to NONE for workers (Bug 7 pattern)', () => {
    const worker = spawnSelectedWorker(world, 5, 5);
    expect(Gatherer.state[worker]).toBe(GATHER_GATHERING);

    queueCommand({ type: 'attack-move', targetX: 50, targetZ: 30 });
    tickCommand(world);

    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
  });

  it('does NOT command non-Selected units', () => {
    const other = spawnSelectedSoldier(world, 10, 10);
    Selected.by[other] = 255;
    UnitAI.state[other] = UnitAIState.Idle;
    Movement.hasTarget[other] = 0;

    queueCommand({ type: 'attack-move', targetX: 99, targetZ: 99 });
    tickCommand(world);

    expect(Movement.hasTarget[other]).toBe(0);
    expect(UnitAI.originX[other]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Stap 18 — auto-aggro fires while attack-moving
// ---------------------------------------------------------------------------

describe('F4-stap 18 — auto-aggro tijdens attack-move', () => {
  let world: World;
  let unit: number;

  beforeEach(() => {
    world = replaceWorld();
    unit = spawnSelectedSoldier(world, 0, 0);
    // Issue attack-move toward (50, 0)
    queueCommand({ type: 'attack-move', targetX: 50, targetZ: 0 });
    tickCommand(world);
  });

  it('engages enemy that appears within AGGRO_RANGE during move', () => {
    // Enemy spawns 8 units away (well inside AGGRO_RANGE=12)
    const enemy = spawnEnemy(world, 8, 0);
    expect(UnitAI.state[unit]).toBe(UnitAIState.Idle);

    tickCombat(world);

    expect(UnitAI.state[unit]).toBe(UnitAIState.Attacking);
    expect(UnitAI.targetEid[unit]).toBe(enemy);
  });

  it('ignores enemies outside AGGRO_RANGE', () => {
    // Enemy at distance > AGGRO_RANGE from unit at (0,0)
    spawnEnemy(world, AGGRO_RANGE + 5, 0);

    tickCombat(world);

    expect(UnitAI.state[unit]).toBe(UnitAIState.Idle);
    expect(UnitAI.targetEid[unit]).toBe(NO_ENTITY);
  });

  it('never targets same-faction units (no friendly fire aggro)', () => {
    // "Enemy" same faction, well within range
    const friendly = spawnEnemy(world, 5, 0);
    Faction.id[friendly] = FactionId.Brabanders;

    tickCombat(world);

    expect(UnitAI.state[unit]).toBe(UnitAIState.Idle);
    expect(UnitAI.targetEid[unit]).toBe(NO_ENTITY);
  });

  it('selects the closest enemy when multiple are in range', () => {
    const far = spawnEnemy(world, 10, 0);
    const near = spawnEnemy(world, 4, 0);
    spawnEnemy(world, 7, 0);

    tickCombat(world);

    expect(UnitAI.targetEid[unit]).toBe(near);
    expect(UnitAI.targetEid[unit]).not.toBe(far);
  });

  it('does NOT target dead enemies (IsDead skipped by aggro scan)', () => {
    const enemy = spawnEnemy(world, 6, 0);
    Health.current[enemy] = 0;
    // No IsDead tag yet; processAutoAggro also checks Health.current<=0
    tickCombat(world);

    expect(UnitAI.state[unit]).toBe(UnitAIState.Idle);
    expect(UnitAI.targetEid[unit]).toBe(NO_ENTITY);
  });
});
