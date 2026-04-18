/**
 * BuildSystem.test.ts -- Locks construction-progress accumulation.
 *
 * Audit context: full-playthrough audit Fase 3 stap 12 — workers bouwen
 * gebouwen via hotkeys → ghost preview → placement → worker loopt naartoe
 * → progress tikt op → gebouw completeert.
 *
 * BuildSystem itself is the "progress tikt op + completeert" half. The
 * placement-validation half lives in `validateBuildingPlacement` which
 * already has its own tests (placement-river-constraint, placement-
 * lumbercamp-structured). What was uncovered:
 *   - progress accumulates at BUILD_SPEED per worker per second
 *   - multiple workers stack
 *   - workers outside BUILD_RANGE do not contribute
 *   - workers of a different faction do not contribute
 *   - dead workers do not contribute
 *   - completion fires `building-placed` event with full payload
 *   - already-complete buildings are skipped
 *   - buildings with maxProgress<=0 are skipped (defensive)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, Building,
} from '../src/ecs/components';
import {
  IsUnit, IsWorker, IsBuilding, IsDead,
} from '../src/ecs/tags';
import { createBuildSystem } from '../src/systems/BuildSystem';
import { eventBus } from '../src/core/EventBus';
import { playerState } from '../src/core/PlayerState';
import {
  FactionId, BuildingTypeId,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const BUILD_RANGE = 2.5;
const BUILD_SPEED = 1.0;

function spawnBuilding(
  world: World,
  x: number = 0,
  z: number = 0,
  opts: { typeId?: number; faction?: number; maxProgress?: number; progress?: number; complete?: boolean } = {},
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = opts.faction ?? FactionId.Brabanders;
  Building.typeId[eid] = opts.typeId ?? BuildingTypeId.Barracks;
  Building.maxProgress[eid] = opts.maxProgress ?? 30;
  Building.progress[eid] = opts.progress ?? 0;
  Building.complete[eid] = opts.complete ? 1 : 0;
  return eid;
}

function spawnWorker(world: World, x: number, z: number, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, IsUnit);
  addComponent(world, eid, IsWorker);
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Faction.id[eid] = faction;
  return eid;
}

const tick = (world: World, dt: number) => createBuildSystem()(world, dt);

describe('BuildSystem — progress accumulation', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); eventBus.clear(); });

  it('1 worker in range adds BUILD_SPEED per second to progress', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world);
    spawnWorker(world, 1, 0);
    tick(world, 1.0);
    expect(Building.progress[building]).toBeCloseTo(BUILD_SPEED, 3);
  });

  it('2 workers stack — progress adds BUILD_SPEED × workerCount', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world);
    spawnWorker(world, 1, 0);
    spawnWorker(world, -1, 0);
    tick(world, 1.0);
    expect(Building.progress[building]).toBeCloseTo(BUILD_SPEED * 2, 3);
  });

  it('5 workers stack linearly', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world);
    for (let i = 0; i < 5; i++) spawnWorker(world, Math.cos(i) * 2, Math.sin(i) * 2);
    tick(world, 1.0);
    expect(Building.progress[building]).toBeCloseTo(BUILD_SPEED * 5, 3);
  });

  it('worker outside BUILD_RANGE does NOT contribute', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world);
    spawnWorker(world, BUILD_RANGE + 0.5, 0);
    tick(world, 1.0);
    expect(Building.progress[building]).toBe(0);
  });

  it('worker exactly at BUILD_RANGE contributes (boundary inclusive)', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world);
    spawnWorker(world, BUILD_RANGE, 0);
    tick(world, 1.0);
    expect(Building.progress[building]).toBeGreaterThan(0);
  });
});

describe('BuildSystem — faction filtering', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); eventBus.clear(); });

  it('worker of different faction does NOT contribute to enemy building', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world, 0, 0, { faction: FactionId.Brabanders });
    spawnWorker(world, 1, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(Building.progress[building]).toBe(0);
  });

  it('mixed-faction crowd: only same-faction workers count', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world, 0, 0, { faction: FactionId.Brabanders });
    spawnWorker(world, 1, 0, FactionId.Brabanders);
    spawnWorker(world, -1, 0, FactionId.Randstad);
    spawnWorker(world, 0, 1, FactionId.Limburgers);
    tick(world, 1.0);
    expect(Building.progress[building]).toBeCloseTo(BUILD_SPEED, 3); // only the Brabander
  });
});

describe('BuildSystem — dead-worker handling', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); eventBus.clear(); });

  it('dead worker does NOT contribute', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world);
    const w = spawnWorker(world, 1, 0);
    addComponent(world, w, IsDead);
    tick(world, 1.0);
    expect(Building.progress[building]).toBe(0);
  });
});

describe('BuildSystem — completion', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); eventBus.clear(); });

  it('marks building complete when progress >= maxProgress', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world, 0, 0, { maxProgress: 1.0 });
    spawnWorker(world, 1, 0);
    tick(world, 1.5); // adds 1.5 → exceeds maxProgress
    expect(Building.complete[building]).toBe(1);
    expect(Building.progress[building]).toBe(1.0);
  });

  it('clamps progress at maxProgress (no overflow)', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world, 0, 0, { maxProgress: 5 });
    for (let i = 0; i < 10; i++) spawnWorker(world, i * 0.2, 0);
    tick(world, 99); // way more than needed
    expect(Building.progress[building]).toBe(5);
  });

  it('emits `building-placed` event with full payload on completion', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world, 7, -3, {
      typeId: BuildingTypeId.Barracks,
      faction: FactionId.Belgen,
      maxProgress: 0.5,
    });
    spawnWorker(world, 7, -2, FactionId.Belgen);

    const events: Array<{
      entityId: number;
      factionId: number;
      buildingTypeId: number;
      x: number;
      z: number;
    }> = [];
    eventBus.on('building-placed', (ev) => events.push(ev));

    tick(world, 1.0);

    expect(events).toHaveLength(1);
    expect(events[0].entityId).toBe(building);
    expect(events[0].factionId).toBe(FactionId.Belgen);
    expect(events[0].buildingTypeId).toBe(BuildingTypeId.Barracks);
    expect(events[0].x).toBe(7);
    expect(events[0].z).toBe(-3);
  });

  it('does NOT re-emit `building-placed` on subsequent ticks after completion', () => {
    const world = replaceWorld();
    spawnBuilding(world, 0, 0, { maxProgress: 0.5 });
    spawnWorker(world, 1, 0);
    let count = 0;
    eventBus.on('building-placed', () => { count++; });
    tick(world, 1.0); // completes
    tick(world, 1.0); // already complete — should be skipped
    tick(world, 1.0);
    expect(count).toBe(1);
  });
});

describe('BuildSystem — defensive guards', () => {
  beforeEach(() => { replaceWorld(); playerState.reset(); eventBus.clear(); });

  it('skips buildings that are already complete', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world, 0, 0, { progress: 30, complete: true });
    spawnWorker(world, 1, 0);
    tick(world, 1.0);
    expect(Building.progress[building]).toBe(30); // unchanged
  });

  it('skips buildings with maxProgress <= 0 (defensive)', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world, 0, 0, { maxProgress: 0 });
    spawnWorker(world, 1, 0);
    tick(world, 1.0);
    expect(Building.progress[building]).toBe(0);
  });

  it('skips dead buildings', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world);
    addComponent(world, building, IsDead);
    spawnWorker(world, 1, 0);
    tick(world, 1.0);
    expect(Building.progress[building]).toBe(0);
  });

  it('a building with no workers in range does not progress', () => {
    const world = replaceWorld();
    const building = spawnBuilding(world);
    spawnWorker(world, 50, 50); // miles away
    tick(world, 1.0);
    expect(Building.progress[building]).toBe(0);
  });
});
