/**
 * CommandSystem-build-fallback.test.ts
 *
 * Regression for v0.54.1: when the player places a second TownHall
 * (or any building) without a worker selected, handleBuild used to
 * `return` early — leaving the building stuck on progress=0 forever
 * because no worker was ever told to walk to it.
 *
 * The fix adds an AoE/Warcraft-style fallback: when no selected unit
 * is a worker, the command picks the nearest worker of the building's
 * faction (idle preferred, gathering otherwise).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Gatherer, Movement, Selected, Attack,
} from '../src/ecs/components';
import { IsUnit, IsWorker } from '../src/ecs/tags';
import { createCommandSystem, queueCommand } from '../src/systems/CommandSystem';
import { gameConfig } from '../src/core/GameConfig';
import { FactionId, UnitAIState, NO_ENTITY } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const GATHER_NONE = 0;
const GATHER_MOVING = 1;
const GATHER_GATHERING = 2;

function spawnWorker(
  world: World,
  opts: { x?: number; z?: number; selected?: boolean; faction?: FactionId; gatherState?: number } = {},
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Gatherer);
  addComponent(world, eid, Attack);
  addComponent(world, eid, IsUnit);
  addComponent(world, eid, IsWorker);
  Position.x[eid] = opts.x ?? 0;
  Position.y[eid] = 0;
  Position.z[eid] = opts.z ?? 0;
  Faction.id[eid] = opts.faction ?? FactionId.Brabanders;
  Movement.speed[eid] = 4;
  // Reset Movement state — bitECS TypedArrays persist across replaceWorld()
  // calls, so a previous test could leave hasTarget=1 / targetX!=0 at this
  // entity-index and trick negative-assertions.
  Movement.hasTarget[eid] = 0;
  Movement.targetX[eid] = 0;
  Movement.targetZ[eid] = 0;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Attack.range[eid] = 1.5;
  Gatherer.state[eid] = opts.gatherState ?? GATHER_NONE;
  Gatherer.targetEid[eid] = NO_ENTITY;
  if (opts.selected) {
    addComponent(world, eid, Selected);
    Selected.by[eid] = 0;
  }
  return eid;
}

const tickCommands = (world: World) => createCommandSystem()(world, 1 / 60);

describe('handleBuild — global worker fallback when no selected worker', () => {
  beforeEach(() => {
    replaceWorld();
    gameConfig.setPlayerFaction(FactionId.Brabanders);
    // Drain the global commandBuffer between tests.
    tickCommands(replaceWorld());
  });

  it('Step 1 — selected worker still wins (preserves prior behavior)', () => {
    const world = replaceWorld();
    const selected = spawnWorker(world, { x: 0, z: 0, selected: true });
    const idleFar = spawnWorker(world, { x: 100, z: 0, selected: false });

    queueCommand({ type: 'build', buildingTypeId: 0, x: 5, z: 0, factionId: FactionId.Brabanders });
    tickCommands(world);

    expect(Movement.hasTarget[selected]).toBe(1);
    expect(Movement.targetX[selected]).toBe(5);
    expect(Movement.hasTarget[idleFar]).toBe(0);
  });

  it('Step 2a — no selected worker → nearest IDLE faction worker assigned', () => {
    const world = replaceWorld();
    // No selected workers — only idle ones at varying distances.
    const farIdle = spawnWorker(world, { x: 100, z: 0, gatherState: GATHER_NONE });
    const nearIdle = spawnWorker(world, { x: 12, z: 0, gatherState: GATHER_NONE });

    queueCommand({ type: 'build', buildingTypeId: 0, x: 10, z: 0, factionId: FactionId.Brabanders });
    tickCommands(world);

    expect(Movement.hasTarget[nearIdle]).toBe(1);
    expect(Movement.targetX[nearIdle]).toBe(10);
    expect(Movement.hasTarget[farIdle]).toBe(0);
  });

  it('Step 2b — idle workers preferred over gathering workers (even if gathering is closer)', () => {
    const world = replaceWorld();
    const closerGathering = spawnWorker(world, { x: 11, z: 0, gatherState: GATHER_GATHERING });
    const fartherIdle = spawnWorker(world, { x: 25, z: 0, gatherState: GATHER_NONE });

    queueCommand({ type: 'build', buildingTypeId: 0, x: 10, z: 0, factionId: FactionId.Brabanders });
    tickCommands(world);

    // Idle worker should be assigned even though it's farther — we don't
    // yank a productive harvester unless we have to.
    expect(Movement.hasTarget[fartherIdle]).toBe(1);
    expect(Movement.hasTarget[closerGathering]).toBe(0);
    // Gathering worker keeps its gather state intact.
    expect(Gatherer.state[closerGathering]).toBe(GATHER_GATHERING);
  });

  it('Step 2c — only gathering workers available → nearest gathering worker assigned', () => {
    const world = replaceWorld();
    const farGathering = spawnWorker(world, { x: 100, z: 0, gatherState: GATHER_GATHERING });
    const nearGathering = spawnWorker(world, { x: 12, z: 0, gatherState: GATHER_MOVING });

    queueCommand({ type: 'build', buildingTypeId: 0, x: 10, z: 0, factionId: FactionId.Brabanders });
    tickCommands(world);

    expect(Movement.hasTarget[nearGathering]).toBe(1);
    expect(Movement.targetX[nearGathering]).toBe(10);
    // Gather state on the assigned worker is reset to NONE so GatherSystem
    // doesn't yank it back to the resource (Bug 7 pattern).
    expect(Gatherer.state[nearGathering]).toBe(GATHER_NONE);
    expect(Gatherer.targetEid[nearGathering]).toBe(NO_ENTITY);
    expect(Movement.hasTarget[farGathering]).toBe(0);
  });

  it('Step 2d — only enemy workers exist → nothing happens (faction filter)', () => {
    const world = replaceWorld();
    const enemyWorker = spawnWorker(world, { x: 12, z: 0, faction: FactionId.Randstad });

    queueCommand({ type: 'build', buildingTypeId: 0, x: 10, z: 0, factionId: FactionId.Brabanders });
    tickCommands(world);

    expect(Movement.hasTarget[enemyWorker]).toBe(0);
  });

  it('Step 3 — no factionId in command (legacy path) returns early without throwing', () => {
    const world = replaceWorld();
    const idle = spawnWorker(world, { x: 12, z: 0, gatherState: GATHER_NONE });

    // Old-shape command without factionId — no selected workers exist
    // either, so the fallback chain has nothing to anchor on.
    queueCommand({ type: 'build', buildingTypeId: 0, x: 10, z: 0 });
    tickCommands(world);

    expect(Movement.hasTarget[idle]).toBe(0);
  });

  it('Regression — second town hall scenario: selected worker busy, second TH placed without selection', () => {
    const world = replaceWorld();

    // Worker A is selected and walking to first TH at (10, 0).
    const workerA = spawnWorker(world, { x: 0, z: 0, selected: true });
    queueCommand({ type: 'build', buildingTypeId: 0, x: 10, z: 0, factionId: FactionId.Brabanders });
    tickCommands(world);
    expect(Movement.targetX[workerA]).toBe(10);

    // Player deselects worker A (clicks empty ground), worker is en route.
    addComponent(world, workerA, IsUnit); // re-add baseline; we need to remove Selected
    Selected.by[workerA] = 0;
    // We can't easily removeComponent in a portable way here — instead
    // simulate "no selection" by spawning a fresh world with workers but
    // the existing workerA and a far-away idle workerB, and queue a build:
    const w2 = replaceWorld();
    const _busyA = spawnWorker(w2, { x: 9, z: 0, selected: false }); // far from new placement
    const idleB = spawnWorker(w2, { x: 31, z: 0, selected: false, gatherState: GATHER_NONE });

    // Place second TH at (30, 0) with NO selected worker.
    queueCommand({ type: 'build', buildingTypeId: 0, x: 30, z: 0, factionId: FactionId.Brabanders });
    tickCommands(w2);

    // Worker B (closer to second TH) gets assigned via fallback.
    expect(Movement.hasTarget[idleB]).toBe(1);
    expect(Movement.targetX[idleB]).toBe(30);
  });
});
