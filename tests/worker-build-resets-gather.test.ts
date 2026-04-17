// RED test for Bug 7 — worker resumes harvesting instead of finishing the building.
//
// Root cause (v0.37.7): CommandSystem.handleBuild sets Movement.target and
// UnitAI.state=Moving for the worker, but forgets to reset Gatherer.state.
// For `move` (CommandSystem.ts:223) and `attack` (line 254) we do
// `Gatherer.state = 0` -- the build path omits it. A worker that was
// mid-harvest when build is issued keeps its Gatherer state, GatherSystem
// then redirects Movement back to the resource, and the building never
// gets finished.
//
// Post-fix contract: handleBuild must reset Gatherer.state to 0 (NONE)
// for the chosen worker, matching move/attack behaviour.

import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Gatherer, Movement,
} from '../src/ecs/components';
import { IsUnit, IsWorker } from '../src/ecs/tags';
import { handleBuild } from '../src/systems/CommandSystem';
import { FactionId, UnitAIState, NO_ENTITY, BuildingTypeId } from '../src/types/index';

function spawnWorker(
  world: ReturnType<typeof replaceWorld>,
  x: number,
  z: number,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Gatherer);
  addComponent(world, eid, IsUnit);
  addComponent(world, eid, IsWorker);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = FactionId.Brabanders;
  Movement.speed[eid] = 4;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  return eid;
}

describe('Bug 7 — handleBuild resets Gatherer.state so the worker actually builds', () => {
  beforeEach(() => {
    replaceWorld();
  });

  it('clears Gatherer.state for the chosen worker after a build command', () => {
    const world = replaceWorld();
    const worker = spawnWorker(world, 0, 0);
    // Worker is mid-harvest: state=2 (HARVESTING), carrying wood, targeting a resource.
    Gatherer.state[worker] = 2;
    Gatherer.targetEid[worker] = 999;
    Gatherer.carrying[worker] = 5;

    handleBuild(world, [worker], {
      type: 'build',
      x: 20,
      z: 0,
      buildingTypeId: BuildingTypeId.Barracks,
    });

    expect(Gatherer.state[worker]).toBe(0);
    expect(UnitAI.state[worker]).toBe(UnitAIState.Moving);
    expect(Movement.hasTarget[worker]).toBe(1);
  });

  it('routes the worker to the build site position', () => {
    const world = replaceWorld();
    const worker = spawnWorker(world, 0, 0);
    Gatherer.state[worker] = 1; // MOVING_TO_RESOURCE

    handleBuild(world, [worker], {
      type: 'build',
      x: 15,
      z: 7,
      buildingTypeId: BuildingTypeId.Barracks,
    });

    expect(Movement.targetX[worker]).toBe(15);
    expect(Movement.targetZ[worker]).toBe(7);
    expect(Gatherer.state[worker]).toBe(0);
  });

  it('picks the nearest worker when multiple are selected', () => {
    const world = replaceWorld();
    const close = spawnWorker(world, 10, 0);
    const far = spawnWorker(world, 100, 0);
    Gatherer.state[close] = 2;
    Gatherer.state[far] = 2;

    handleBuild(world, [close, far], {
      type: 'build',
      x: 12,
      z: 0,
      buildingTypeId: BuildingTypeId.Barracks,
    });

    // Only the chosen (closest) worker is redirected -- the other one may
    // stay gathering. What matters: the one we redirect must NOT still be
    // stuck in gather state.
    expect(Gatherer.state[close]).toBe(0);
  });
});
