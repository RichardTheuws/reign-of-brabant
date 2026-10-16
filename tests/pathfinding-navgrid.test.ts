/**
 * Unit pathfinding: units must route around rivers (crossing only at bridges)
 * and rock walls instead of walking a straight line through them.
 *
 * Covers NavGrid (A* + smoothing), MovementSystem waypoint following,
 * re-path on target change, fallback to direct movement, per-frame budget,
 * and per-eid state cleanup (bitECS recycles eids).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Movement, Health } from '../src/ecs/components';
import { IsUnit, IsDead } from '../src/ecs/tags';
import { createMovementSystem } from '../src/systems/MovementSystem';
import { NavGrid } from '../src/pathfinding/NavGrid';
import {
  setActiveNavGrid, getUnitPathState, pendingPathCount, resetUnitPaths, PATH_NODE_BUDGET,
} from '../src/pathfinding/UnitPathing';
import type { Terrain } from '../src/world/Terrain';
import { FactionId } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const MAP = 64;
/** River band |z| < 3 across the whole map, bridge at 10 <= x <= 16. */
const riverTerrain = {
  mapSize: MAP,
  isRiver: (x: number, z: number) => Math.abs(z) < 3 && !(x >= 10 && x <= 16),
};
/** Same river without any bridge -- the far side is unreachable. */
const noBridgeTerrain = { mapSize: MAP, isRiver: (_x: number, z: number) => Math.abs(z) < 3 };

const flatTerrain = {
  isOnRoad: () => false,
  getHeightAt: () => 0,
} as unknown as Terrain;

function spawnUnit(world: World, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, Health);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Faction.id[eid] = FactionId.Brabanders;
  Health.current[eid] = 100;
  Movement.speed[eid] = 4;
  return eid;
}

function moveTo(eid: number, x: number, z: number): void {
  Movement.targetX[eid] = x;
  Movement.targetZ[eid] = z;
  Movement.hasTarget[eid] = 1;
}

/** Run until arrival (or max frames); returns visited positions. */
function run(world: World, sys: (w: World, dt: number) => void, eid: number, frames = 2000): Array<{ x: number; z: number }> {
  const trail: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < frames && Movement.hasTarget[eid] === 1; i++) {
    sys(world, 1 / 30);
    trail.push({ x: Position.x[eid], z: Position.z[eid] });
  }
  return trail;
}

beforeEach(() => {
  setActiveNavGrid(null);
});

describe('NavGrid', () => {
  it('marks river cells blocked and leaves the bridge walkable', () => {
    const g = NavGrid.fromTerrain(riverTerrain);
    expect(g.isBlockedAt(0, 0)).toBe(true);
    expect(g.isBlockedAt(13, 0)).toBe(false);
    expect(g.isBlockedAt(0, 10)).toBe(false);
  });

  it('blocks rock walls (core + margin)', () => {
    const g = NavGrid.fromTerrain({ mapSize: MAP, isRiver: () => false }, [
      { path: [{ x: -10, z: 5 }, { x: 10, z: 5 }], thickness: 2 },
    ]);
    expect(g.isBlockedAt(0, 5)).toBe(true);
    expect(g.isBlockedAt(0, 10)).toBe(false);
  });

  it('finds a path over the bridge whose segments never cross the river', () => {
    const g = NavGrid.fromTerrain(riverTerrain);
    const path = g.findPath(-10, -15, -10, 15);
    expect(path).not.toBeNull();
    const pts = [{ x: -10, z: -15 }, ...path!];
    for (let i = 0; i < pts.length - 1; i++) {
      expect(g.isLineClear(pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z)).toBe(true);
    }
    expect(pts[pts.length - 1]).toEqual({ x: -10, z: 15 });
    // Smoothed: a handful of corners, not one point per cell
    expect(path!.length).toBeLessThan(8);
  });

  it('returns null when the goal is unreachable', () => {
    const g = NavGrid.fromTerrain(noBridgeTerrain);
    expect(g.findPath(0, -15, 0, 15)).toBeNull();
  });

  it('snaps a blocked goal to the nearest walkable point', () => {
    const g = NavGrid.fromTerrain(riverTerrain);
    const path = g.findPath(-10, -15, -10, 0)!;
    const end = path[path.length - 1];
    expect(g.isBlockedAt(end.x, end.z)).toBe(false);
    expect(Math.abs(end.z)).toBeLessThan(5);
  });
});

describe('MovementSystem + pathfinding', () => {
  it('crosses the river only via the bridge and arrives', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(riverTerrain);
    setActiveNavGrid(grid);
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, -10, -15);
    moveTo(u, -10, 15);

    const trail = run(world, sys, u);

    for (const p of trail) expect(riverTerrain.isRiver(p.x, p.z)).toBe(false);
    expect(Movement.hasTarget[u]).toBe(0);
    expect(Math.hypot(Position.x[u] + 10, Position.z[u] - 15)).toBeLessThan(0.6);
    // Must actually have used the bridge
    expect(trail.some((p) => Math.abs(p.z) < 3 && p.x >= 10 && p.x <= 16)).toBe(true);
  });

  it('moves straight (no search) when line of sight is clear', () => {
    const world = replaceWorld();
    setActiveNavGrid(NavGrid.fromTerrain(riverTerrain));
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, -10, -15);
    moveTo(u, 10, -10);
    sys(world, 1 / 30);
    expect(pendingPathCount()).toBe(0);
    expect(getUnitPathState(u)!.waypoints.length).toBe(0);
  });

  it('re-paths when the target changes to the other side', () => {
    const world = replaceWorld();
    setActiveNavGrid(NavGrid.fromTerrain(riverTerrain));
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, -10, -15);
    moveTo(u, -20, -20); // same side, direct
    sys(world, 1 / 30);
    expect(getUnitPathState(u)!.waypoints.length).toBe(0);

    moveTo(u, -10, 15); // now across the river
    const trail = run(world, sys, u);
    expect(trail.length).toBeGreaterThan(0);
    for (const p of trail) expect(riverTerrain.isRiver(p.x, p.z)).toBe(false);
    expect(Math.abs(Position.z[u] - 15)).toBeLessThan(0.6);
  });

  it('falls back to direct movement without a grid', () => {
    const world = replaceWorld();
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, 0, -15);
    moveTo(u, 0, 15);
    sys(world, 1);
    expect(Position.x[u]).toBeCloseTo(0, 5);
    expect(Position.z[u]).toBeCloseTo(-11, 3);
  });

  it('unreachable goal: moves direct but never steps into the river', () => {
    const world = replaceWorld();
    setActiveNavGrid(NavGrid.fromTerrain(noBridgeTerrain));
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, 0, -15);
    moveTo(u, 0, 15);
    const trail = run(world, sys, u, 100);
    expect(getUnitPathState(u)?.direct).toBe(true);
    for (const p of trail) expect(noBridgeTerrain.isRiver(p.x, p.z)).toBe(false);
    expect(Position.z[u]).toBeGreaterThan(-5); // walked up to the bank
  });

  it('unreachable goal: stops at the bank (no frozen live order) and never enters the river', () => {
    const world = replaceWorld();
    setActiveNavGrid(NavGrid.fromTerrain(noBridgeTerrain));
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, 0, -15);
    moveTo(u, 0, 15);
    const trail = run(world, sys, u, 2000);
    for (const p of trail) expect(noBridgeTerrain.isRiver(p.x, p.z)).toBe(false);
    expect(Movement.hasTarget[u]).toBe(0);
    expect(Position.z[u]).toBeGreaterThan(-5);
  });

  it('budgets path searches per frame (spread-out units on a big map)', () => {
    const world = replaceWorld();
    // 192-unit map, bridge only at the far east edge -> every route is long.
    const big = { mapSize: 192, isRiver: (x: number, z: number) => Math.abs(z) < 3 && x < 85 };
    setActiveNavGrid(NavGrid.fromTerrain(big));
    const sys = createMovementSystem(flatTerrain);
    const units: number[] = [];
    for (let i = 0; i < 60; i++) {
      const u = spawnUnit(world, -90 + (i % 30) * 6, -20 - Math.floor(i / 30) * 40);
      moveTo(u, -85 + (i % 6) * 30, 60);
      units.push(u);
    }
    sys(world, 1 / 30);
    expect(pendingPathCount()).toBeGreaterThan(0); // not everything solved in frame 1
    expect(pendingPathCount()).toBeLessThan(60);
    for (let i = 0; i < 120 && pendingPathCount() > 0; i++) sys(world, 1 / 30);
    expect(pendingPathCount()).toBe(0);
    for (const u of units) expect(getUnitPathState(u)!.pending).toBe(false);
    expect(PATH_NODE_BUDGET).toBeGreaterThan(0);
  });

  it('a tight group commanded together resolves in one frame via a shared route', () => {
    const world = replaceWorld();
    setActiveNavGrid(NavGrid.fromTerrain(riverTerrain));
    const sys = createMovementSystem(flatTerrain);
    const units: number[] = [];
    for (let i = 0; i < 40; i++) {
      const u = spawnUnit(world, -12 + (i % 8), -16 + Math.floor(i / 8));
      moveTo(u, -10 + (i % 4), 15);
      units.push(u);
    }
    sys(world, 1 / 30);
    expect(pendingPathCount()).toBe(0);
    for (const u of units) expect(getUnitPathState(u)!.waypoints.length).toBeGreaterThan(0);
  });
});

describe('path state cleanup (eid recycling)', () => {
  it('drops state when the unit stops, dies, or a new grid is installed', () => {
    const world = replaceWorld();
    setActiveNavGrid(NavGrid.fromTerrain(riverTerrain));
    const sys = createMovementSystem(flatTerrain);
    const a = spawnUnit(world, -10, -15);
    const b = spawnUnit(world, -12, -15);
    moveTo(a, -10, 15);
    moveTo(b, -12, 15);
    sys(world, 1 / 30);
    expect(getUnitPathState(a)).toBeDefined();

    Movement.hasTarget[a] = 0;
    addComponent(world, b, IsDead);
    sys(world, 1 / 30);
    expect(getUnitPathState(a)).toBeUndefined();
    expect(getUnitPathState(b)).toBeUndefined();

    const c = spawnUnit(world, -10, -15);
    moveTo(c, -10, 15);
    sys(world, 1 / 30);
    expect(getUnitPathState(c)).toBeDefined();
    setActiveNavGrid(NavGrid.fromTerrain(riverTerrain));
    expect(getUnitPathState(c)).toBeUndefined();
    resetUnitPaths();
  });

  it('a recycled eid that appears elsewhere with the same goal re-plans', () => {
    const world = replaceWorld();
    setActiveNavGrid(NavGrid.fromTerrain(riverTerrain));
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, -10, -15);
    moveTo(u, -10, 15);
    sys(world, 1 / 30);
    sys(world, 1 / 30);
    // Same eid, teleported (recycled entity / tunnel exit) far away, same goal
    Position.x[u] = 25;
    Position.z[u] = -25;
    const trail = run(world, sys, u);
    for (const p of trail) expect(riverTerrain.isRiver(p.x, p.z)).toBe(false);
    expect(Math.abs(Position.z[u] - 15)).toBeLessThan(0.6);
  });
});
