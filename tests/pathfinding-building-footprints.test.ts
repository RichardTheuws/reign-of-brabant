/**
 * Building footprints in the NavGrid: units route around buildings, can
 * still reach them (build / deposit / melee), get out when a building lands
 * on top of them, and re-plan when a building is placed across their route.
 * Footprints follow every spawn path and are released on death / recycle /
 * cleanup.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, removeEntity } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Movement, Health, Building } from '../src/ecs/components';
import { IsUnit, IsDead, IsBuilding } from '../src/ecs/tags';
import { createMovementSystem } from '../src/systems/MovementSystem';
import { createDeathSystem } from '../src/systems/DeathSystem';
import { NavGrid } from '../src/pathfinding/NavGrid';
import { setActiveNavGrid, getUnitPathState } from '../src/pathfinding/UnitPathing';
import {
  registerBuildingFootprint, unregisterBuildingFootprint, resetBuildingFootprints,
  syncBuildingFootprints, getBuildingFootprint, buildingFootprintCount, BUILDING_FOOTPRINT_HALF,
} from '../src/pathfinding/BuildingFootprints';
import { spawnBuildingEntity } from '../src/entities/buildingSpawn';
import { createBuilding } from '../src/entities/factories';
import type { Terrain } from '../src/world/Terrain';
import {
  FactionId, BuildingTypeId, DEATH_TIMER, DEPOSIT_ARRIVAL_DISTANCE, MINIMUM_MELEE_RANGE,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const MAP = 64;
const open = { mapSize: MAP, isRiver: () => false };
const flatTerrain = { isOnRoad: () => false, getHeightAt: () => 0 } as unknown as Terrain;

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
  Movement.hasTarget[eid] = 0;
  return eid;
}

function moveTo(eid: number, x: number, z: number): void {
  Movement.targetX[eid] = x;
  Movement.targetZ[eid] = z;
  Movement.hasTarget[eid] = 1;
}

function run(world: World, sys: (w: World, dt: number) => void, eid: number, frames = 2000): Array<{ x: number; z: number }> {
  const trail: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < frames && Movement.hasTarget[eid] === 1; i++) {
    sys(world, 1 / 30);
    trail.push({ x: Position.x[eid], z: Position.z[eid] });
  }
  return trail;
}

function pathLength(sx: number, sz: number, pts: Array<{ x: number; z: number }>): number {
  let len = 0, ax = sx, az = sz;
  for (const p of pts) { len += Math.hypot(p.x - ax, p.z - az); ax = p.x; az = p.z; }
  return len;
}

beforeEach(() => {
  setActiveNavGrid(null);
  resetBuildingFootprints();
});

describe('NavGrid footprint layer', () => {
  it('blocks the cells inside the rect and frees exactly them again', () => {
    const g = NavGrid.fromTerrain(open);
    const fp = g.addFootprint(0, 0, 1.5, 1.5)!;
    // Integer centre: cell centres at +-0.5 and +-1.5 are inside -> 4x4 cells.
    expect(fp.c1x - fp.c0x + 1).toBe(4);
    expect(fp.c1z - fp.c0z + 1).toBe(4);
    expect(g.blockedCount).toBe(16);
    expect(g.isBlockedAt(0, 0)).toBe(true);
    expect(g.isBlockedAt(1.9, -1.9)).toBe(true);
    expect(g.isBlockedAt(2.1, 0)).toBe(false);
    g.removeFootprint(fp);
    expect(g.blockedCount).toBe(0);
  });

  it('refcounts overlapping footprints', () => {
    const g = NavGrid.fromTerrain(open);
    const a = g.addFootprint(0, 0, 1.5, 1.5)!;
    const b = g.addFootprint(2, 0, 1.5, 1.5)!; // overlaps a by two columns
    expect(g.isBlockedAt(1.5, 0)).toBe(true);
    g.removeFootprint(a);
    // Shared columns stay blocked by b; a's own columns are free.
    expect(g.isBlockedAt(1.5, 0)).toBe(true);
    expect(g.isBlockedAt(0.5, 0)).toBe(true);
    expect(g.isBlockedAt(-1.5, 0)).toBe(false);
    g.removeFootprint(b);
    expect(g.blockedCount).toBe(0);
  });

  it('never frees statically blocked (river) cells', () => {
    const g = NavGrid.fromTerrain({ mapSize: MAP, isRiver: (_x, z) => Math.abs(z) < 1 });
    const before = g.blockedCount;
    const fp = g.addFootprint(0, 0, 1.5, 1.5)!;
    g.removeFootprint(fp);
    expect(g.blockedCount).toBe(before);
    expect(g.isBlockedAt(0, 0)).toBe(true);
    const fp2 = g.addFootprint(0, 0, 1.5, 1.5)!;
    expect(fp2).not.toBeNull();
    g.clearFootprints();
    expect(g.blockedCount).toBe(before);
  });

  it('bumps the version on add (route re-validation trigger)', () => {
    const g = NavGrid.fromTerrain(open);
    const v = g.version;
    g.addFootprint(5, 5, 1.5, 1.5);
    expect(g.version).toBeGreaterThan(v);
  });
});

describe('findPath with buildings', () => {
  it('routes around a building: no segment crosses it, longer than the straight line', () => {
    const g = NavGrid.fromTerrain(open);
    g.addFootprint(0, 0, BUILDING_FOOTPRINT_HALF, BUILDING_FOOTPRINT_HALF);
    expect(g.isLineClear(-10, 0, 10, 0)).toBe(false);
    const path = g.findPath(-10, 0, 10, 0)!;
    expect(path).not.toBeNull();
    const pts = [{ x: -10, z: 0 }, ...path];
    for (let i = 0; i < pts.length - 1; i++) {
      expect(g.isLineClear(pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z)).toBe(true);
    }
    for (const p of path) expect(g.isBlockedAt(p.x, p.z)).toBe(false);
    expect(pathLength(-10, 0, path)).toBeGreaterThan(20);
    expect(path[path.length - 1]).toEqual({ x: 10, z: 0 });
  });

  it('snaps a goal inside a footprint to a walkable cell on the start side', () => {
    const g = NavGrid.fromTerrain(open);
    g.addFootprint(0, 0, BUILDING_FOOTPRINT_HALF, BUILDING_FOOTPRINT_HALF);
    for (const [sx, sz] of [[-12, 0], [12, 0], [0, -12], [0, 12]] as const) {
      const path = g.findPath(sx, sz, 0, 0)!;
      const end = path[path.length - 1];
      expect(g.isBlockedAt(end.x, end.z)).toBe(false);
      const d = Math.hypot(end.x, end.z);
      expect(d).toBeLessThan(4); // within UnitPathing's GOAL_ENTRY_DISTANCE -> free final leg
      // Same side as the start (no walk around the building)
      expect(end.x * sx + end.z * sz).toBeGreaterThan(0);
    }
  });

  it('starts a path from inside a footprint (building placed on the unit)', () => {
    const g = NavGrid.fromTerrain(open);
    g.addFootprint(0, 0, BUILDING_FOOTPRINT_HALF, BUILDING_FOOTPRINT_HALF);
    const path = g.findPath(0.2, 0.2, 10, 10);
    expect(path).not.toBeNull();
    expect(path![path!.length - 1]).toEqual({ x: 10, z: 10 });
  });
});

describe('MovementSystem around buildings', () => {
  it('walks around a building and arrives without entering it', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, 0, 0);
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, -10, 0.3);
    moveTo(u, 10, 0.3);
    const trail = run(world, sys, u);
    for (const p of trail) expect(grid.isBlockedAt(p.x, p.z)).toBe(false);
    expect(Movement.hasTarget[u]).toBe(0);
    expect(Math.hypot(Position.x[u] - 10, Position.z[u] - 0.3)).toBeLessThan(0.6);
  });

  it('reaches melee / deposit range of a building whose centre is the target, then stops', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    spawnBuildingEntity(world, BuildingTypeId.TownHall, FactionId.Brabanders, 0, 0);
    const sys = createMovementSystem(flatTerrain);
    for (const [sx, sz] of [[-15, 3], [12, -9], [0.4, 14]] as const) {
      const u = spawnUnit(world, sx, sz);
      moveTo(u, 0, 0); // gather/combat systems target the building centre
      run(world, sys, u, 1500);
      // Stopped by itself (no endless re-path) close enough to interact.
      expect(Movement.hasTarget[u]).toBe(0);
      const d = Math.hypot(Position.x[u], Position.z[u]);
      expect(d).toBeLessThan(MINIMUM_MELEE_RANGE);
      expect(d).toBeLessThan(DEPOSIT_ARRIVAL_DISTANCE);
      removeEntity(world, u);
    }
  });

  it('gets a unit out when a building is placed on top of it', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const u = spawnUnit(world, 0.3, -0.2);
    spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, 0, 0);
    expect(grid.isBlockedAt(0.3, -0.2)).toBe(true);
    const sys = createMovementSystem(flatTerrain);
    moveTo(u, 12, 8);
    run(world, sys, u);
    expect(Movement.hasTarget[u]).toBe(0);
    expect(Math.hypot(Position.x[u] - 12, Position.z[u] - 8)).toBeLessThan(0.6);
  });

  it('re-plans at once when a building is placed across a live route', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, -20, 0);
    moveTo(u, 20, 0);
    for (let i = 0; i < 10; i++) sys(world, 1 / 30);
    // Straight line of sight: no waypoints yet.
    expect(getUnitPathState(u)!.waypoints.length).toBe(0);

    spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, 0, 0);
    sys(world, 1 / 30); // re-validation + search in the same frame
    const st = getUnitPathState(u)!;
    expect(st.pending || st.waypoints.length > 0).toBe(true);
    // The new route avoids the building (not the stuck-repath fallback).
    expect(st.stuckRepaths).toBe(0);

    const trail = run(world, sys, u);
    for (const p of trail) expect(grid.isBlockedAt(p.x, p.z)).toBe(false);
    expect(Math.hypot(Position.x[u] - 20, Position.z[u])).toBeLessThan(0.6);
  });

  it('keeps a route that a new building does not touch', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const sys = createMovementSystem(flatTerrain);
    const u = spawnUnit(world, -20, 0);
    moveTo(u, 20, 0);
    sys(world, 1 / 30);
    spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, 0, 20);
    sys(world, 1 / 30);
    const st = getUnitPathState(u)!;
    expect(st.pending).toBe(false);
    expect(st.waypoints.length).toBe(0);
  });
});

describe('footprint registration lifecycle', () => {
  it('registers on spawnBuildingEntity and createBuilding (incl. construction sites)', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const a = spawnBuildingEntity(world, BuildingTypeId.TownHall, FactionId.Brabanders, -10, -10);
    const b = createBuilding(world, BuildingTypeId.Barracks, FactionId.Randstad, 10, 10, false);
    expect(Building.complete[b]).toBe(0);
    expect(getBuildingFootprint(a)).toBeDefined();
    expect(getBuildingFootprint(b)).toBeDefined();
    expect(grid.isBlockedAt(-10, -10)).toBe(true);
    expect(grid.isBlockedAt(10, 10)).toBe(true);
  });

  it('is stable for fractional (Float32) positions: the sweep does not churn', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const eid = spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, 10.3, -7.7);
    const fp = getBuildingFootprint(eid);
    const v = grid.version;
    syncBuildingFootprints(world);
    syncBuildingFootprints(world);
    expect(grid.version).toBe(v);
    expect(getBuildingFootprint(eid)).toBe(fp);
  });

  it('does not block for bridges', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const eid = spawnBuildingEntity(world, BuildingTypeId.Bridge, FactionId.Brabanders, 0, 0);
    syncBuildingFootprints(world);
    expect(getBuildingFootprint(eid)).toBeUndefined();
    expect(grid.blockedCount).toBe(0);
  });

  it('is a no-op without a grid; installing a grid + sync picks up existing buildings', () => {
    const world = replaceWorld();
    const eid = spawnBuildingEntity(world, BuildingTypeId.TownHall, FactionId.Brabanders, 5, 5);
    expect(buildingFootprintCount()).toBe(0);
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    resetBuildingFootprints();
    syncBuildingFootprints(world);
    expect(getBuildingFootprint(eid)).toBeDefined();
    expect(grid.isBlockedAt(5, 5)).toBe(true);
  });

  it('releases on the first death frame via DeathSystem and stays released after removal', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const death = createDeathSystem();
    const eid = spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, 0, 0);
    Health.current[eid] = 0;
    addComponent(world, eid, IsDead);
    death(world, 1 / 30);
    expect(grid.isBlockedAt(0, 0)).toBe(false);
    expect(getBuildingFootprint(eid)).toBeUndefined();
    for (let t = 0; t <= DEATH_TIMER + 0.5; t += 0.25) death(world, 0.25);
    expect(grid.blockedCount).toBe(0);
  });

  it('frees the old cells when the eid is recycled (sync sweep)', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const eid = spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, -8, 0);
    // Removed behind the registry's back (no DeathSystem) ...
    removeEntity(world, eid);
    syncBuildingFootprints(world);
    expect(grid.isBlockedAt(-8, 0)).toBe(false);
    expect(buildingFootprintCount()).toBe(0);

    // ... and an eid that comes back as a unit, or as a building elsewhere.
    const b1 = spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, -8, 0);
    Position.x[b1] = 12; // component data overwritten (recycle + re-init elsewhere)
    syncBuildingFootprints(world);
    expect(grid.isBlockedAt(-8, 0)).toBe(false);
    expect(grid.isBlockedAt(12, 0)).toBe(true);
    expect(grid.blockedCount).toBe(16);
  });

  it('releases an entity that lost IsBuilding', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    addComponent(world, eid, Building);
    addComponent(world, eid, IsBuilding);
    Position.x[eid] = 3; Position.z[eid] = 3;
    Building.typeId[eid] = BuildingTypeId.Housing;
    syncBuildingFootprints(world);
    expect(grid.isBlockedAt(3, 3)).toBe(true);
    removeEntity(world, eid);
    const u = spawnUnit(world, 0, 0); // likely the recycled eid
    expect(u).toBeGreaterThanOrEqual(0);
    syncBuildingFootprints(world);
    expect(grid.isBlockedAt(3, 3)).toBe(false);
  });

  it('unregister is idempotent and exact for overlapping buildings', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    registerBuildingFootprint(900, 0, 0, BuildingTypeId.Barracks);
    registerBuildingFootprint(901, 2, 0, BuildingTypeId.Barracks);
    unregisterBuildingFootprint(900);
    unregisterBuildingFootprint(900);
    expect(grid.isBlockedAt(1.5, 0)).toBe(true);
    expect(grid.isBlockedAt(-1.5, 0)).toBe(false);
    unregisterBuildingFootprint(901);
    expect(grid.blockedCount).toBe(0);
    void world;
  });

  it('resetBuildingFootprints (Game.cleanup) clears registry and grid cells', () => {
    const world = replaceWorld();
    const grid = NavGrid.fromTerrain(open);
    setActiveNavGrid(grid);
    spawnBuildingEntity(world, BuildingTypeId.TownHall, FactionId.Brabanders, 0, 0);
    spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Brabanders, 10, 0);
    expect(buildingFootprintCount()).toBe(2);
    resetBuildingFootprints();
    expect(buildingFootprintCount()).toBe(0);
    expect(grid.blockedCount).toBe(0);
  });

  it('a new active grid drops the previous grid registry', () => {
    const world = replaceWorld();
    setActiveNavGrid(NavGrid.fromTerrain(open));
    spawnBuildingEntity(world, BuildingTypeId.TownHall, FactionId.Brabanders, 0, 0);
    expect(buildingFootprintCount()).toBe(1);
    const fresh = NavGrid.fromTerrain(open);
    setActiveNavGrid(fresh);
    expect(buildingFootprintCount()).toBe(0);
    expect(fresh.blockedCount).toBe(0);
    // MovementSystem's sweep re-registers the live building on the new grid.
    createMovementSystem(flatTerrain)(world, 1 / 30);
    expect(fresh.isBlockedAt(0, 0)).toBe(true);
  });
});
