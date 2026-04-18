/**
 * CommandSystem-gatherer-reset.test.ts -- Locks the "Bug 7 pattern" across
 * EVERY command type, not just `build`.
 *
 * Background: v0.37.7 fixed Bug 7 — `handleBuild` forgot to reset
 * `Gatherer.state`, so a mid-harvest worker assigned to build instead got
 * yanked back to the resource by GatherSystem and never built anything.
 * Existing test `worker-build-resets-gather.test.ts` locks that case.
 *
 * BUT: every other command handler (move, attack, attack-move, stop, hold)
 * has the same pattern — a worker that's actively gathering must be released
 * from gather state before being given a new order. handleGather sets state
 * to MOVING_TO_RESOURCE (which is fine — that's still gather mode). All other
 * unit-targeted commands must reset to NONE.
 *
 * Audit context: full-playthrough audit Fase 3b stap 17 — "right-click
 * commands op getrainde units: move/attack/gather, correcte voice-lines,
 * **Gatherer.state reset voor alle commands (Bug 7 patroon)**".
 *
 * We test via the public `commandSystem` dispatch (private handlers can't
 * be imported directly). This also validates that the dispatch correctly
 * filters Selected + player-faction units.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Gatherer, Movement, Selected, Attack, Resource,
} from '../src/ecs/components';
import { IsUnit, IsWorker, IsResource } from '../src/ecs/tags';
import { createCommandSystem, queueCommand } from '../src/systems/CommandSystem';
import { gameConfig } from '../src/core/GameConfig';
import { FactionId, UnitAIState, NO_ENTITY, ResourceType } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const GATHER_NONE = 0;
const GATHER_MOVING = 1;
const GATHER_GATHERING = 2;

function spawnSelectedWorker(world: World, x = 0, z = 0): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Gatherer);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Selected);
  addComponent(world, eid, IsUnit);
  addComponent(world, eid, IsWorker);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = FactionId.Brabanders; // matches gameConfig default
  Movement.speed[eid] = 4;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Attack.range[eid] = 1.5;
  // Mark mid-harvest so we can verify reset
  Gatherer.state[eid] = GATHER_GATHERING;
  Gatherer.targetEid[eid] = 999; // arbitrary "old" target
  Gatherer.carrying[eid] = 5;
  Selected.by[eid] = 0; // selected by player slot 0
  return eid;
}

function spawnEnemyUnit(world: World, x = 50, z = 0): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = FactionId.Randstad; // not the player faction
  return eid;
}

function spawnResourceNode(world: World, x = 30, z = 0): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Resource);
  addComponent(world, eid, IsResource);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Resource.type[eid] = ResourceType.Gold;
  Resource.amount[eid] = 100;
  Resource.maxAmount[eid] = 100;
  return eid;
}

const tickCommands = (world: World) => createCommandSystem()(world, 1 / 60);

describe('CommandSystem — Gatherer.state reset across all command types (Bug 7 pattern)', () => {
  beforeEach(() => {
    replaceWorld();
    gameConfig.setPlayerFaction(FactionId.Brabanders);
    // Drain the global commandBuffer between tests by ticking a fresh world.
    // (queueCommand pushes to a module-level buffer; running commandSystem
    // empties it via the for-loop, even when there are no selected units.)
    const w = replaceWorld();
    tickCommands(w);
  });

  it('move: resets Gatherer.state to NONE for selected workers', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    queueCommand({ type: 'move', targetX: 20, targetZ: 0 });
    tickCommands(world);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
    expect(Movement.hasTarget[worker]).toBe(1);
  });

  it('attack: resets Gatherer.state to NONE', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    const enemy = spawnEnemyUnit(world);
    queueCommand({ type: 'attack', targetEid: enemy });
    tickCommands(world);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
    expect(UnitAI.state[worker]).toBe(UnitAIState.Attacking);
  });

  it('attack-move: resets Gatherer.state to NONE', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    queueCommand({ type: 'attack-move', targetX: 30, targetZ: 0 });
    tickCommands(world);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
    expect(Movement.hasTarget[worker]).toBe(1);
  });

  it('stop: resets Gatherer.state to NONE and halts movement', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    Movement.hasTarget[worker] = 1; // simulate in-motion
    queueCommand({ type: 'stop' });
    tickCommands(world);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
    expect(Movement.hasTarget[worker]).toBe(0);
    expect(UnitAI.state[worker]).toBe(UnitAIState.Idle);
  });

  it('hold: resets Gatherer.state to NONE and enters HoldPosition', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    queueCommand({ type: 'hold' });
    tickCommands(world);
    expect(Gatherer.state[worker]).toBe(GATHER_NONE);
    expect(UnitAI.state[worker]).toBe(UnitAIState.HoldPosition);
  });

  it('gather: switches to MOVING_TO_RESOURCE (gather is the ONE exception)', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    const node = spawnResourceNode(world);
    queueCommand({ type: 'gather', targetEid: node });
    tickCommands(world);
    expect(Gatherer.state[worker]).toBe(GATHER_MOVING);
    expect(Gatherer.targetEid[worker]).toBe(node);
    expect(Gatherer.carrying[worker]).toBe(0); // carry resets on new gather
  });

  it('move: clears UnitAI.targetEid (worker no longer locked to old target)', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    UnitAI.targetEid[worker] = 999;
    queueCommand({ type: 'move', targetX: 10, targetZ: 0 });
    tickCommands(world);
    expect(UnitAI.targetEid[worker]).toBe(NO_ENTITY);
  });
});

describe('CommandSystem — selection filtering', () => {
  beforeEach(() => {
    replaceWorld();
    gameConfig.setPlayerFaction(FactionId.Brabanders);
    const w = replaceWorld();
    tickCommands(w); // drain buffer
  });

  it('does NOT command workers that are not Selected (Selected.by !== 0)', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    Selected.by[worker] = 255; // unselected sentinel
    queueCommand({ type: 'move', targetX: 50, targetZ: 0 });
    tickCommands(world);
    // Worker should NOT have been commanded — stays gathering
    expect(Gatherer.state[worker]).toBe(GATHER_GATHERING);
  });

  it('does NOT command workers of a different faction (enemy units)', () => {
    const world = replaceWorld();
    const worker = spawnSelectedWorker(world);
    Faction.id[worker] = FactionId.Randstad; // not the player faction
    queueCommand({ type: 'move', targetX: 50, targetZ: 0 });
    tickCommands(world);
    // Should NOT have been commanded — Selected + faction filter blocks
    expect(Gatherer.state[worker]).toBe(GATHER_GATHERING);
  });

  it('non-worker units are NOT touched by Gatherer.state reset', () => {
    // A combat-only unit (no IsWorker) must not have its Gatherer.state
    // changed by any command — the conditional `if (hasComponent(IsWorker))`
    // protects the reset.
    const world = replaceWorld();
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    addComponent(world, eid, Faction);
    addComponent(world, eid, Movement);
    addComponent(world, eid, UnitAI);
    addComponent(world, eid, Gatherer); // present but unused (defensive)
    addComponent(world, eid, Attack);
    addComponent(world, eid, Selected);
    addComponent(world, eid, IsUnit);
    // intentionally NO IsWorker
    Faction.id[eid] = FactionId.Brabanders;
    Selected.by[eid] = 0;
    Movement.speed[eid] = 4;
    Gatherer.state[eid] = 7; // arbitrary sentinel; reset would clobber to 0
    Attack.range[eid] = 1.5;

    queueCommand({ type: 'move', targetX: 10, targetZ: 0 });
    tickCommands(world);
    // Gatherer.state untouched (the sentinel survives)
    expect(Gatherer.state[eid]).toBe(7);
  });
});
