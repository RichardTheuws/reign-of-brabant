/**
 * @vitest-environment jsdom
 *
 * Pathfinding on real generated maps (not the synthetic straight river).
 *
 * Regressions locked here:
 * 1. Corner-cutting at waypoints: a unit counted a waypoint as passed within
 *    the waypoint radius, so the straight line to the next waypoint crossed
 *    blocked cells; the edge-slide then froze it forever (hasTarget stayed 1).
 *    Repro: classic 128 seed 42, P1 spawn (-49,-49) -> centre gold mine.
 * 2. Resources inside blocked cells (centre mines of classic sit in the river
 *    mask; islands/arena have trees + mines in river / rock-wall margin):
 *    workers stopped at the nearest walkable point, > GATHER_ARRIVAL_DISTANCE
 *    from the resource, so GatherSystem never switched to GATHERING.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Movement, Health } from '../src/ecs/components';
import { IsUnit } from '../src/ecs/tags';
import { createMovementSystem } from '../src/systems/MovementSystem';
import { NavGrid } from '../src/pathfinding/NavGrid';
import { setActiveNavGrid } from '../src/pathfinding/UnitPathing';
import { generateMap, type MapTemplate } from '../src/world/MapGenerator';
import { Terrain } from '../src/world/Terrain';
import { FactionId, GATHER_ARRIVAL_DISTANCE, type MapSizeOption } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const flatTerrain = { isOnRoad: () => false, getHeightAt: () => 0 } as unknown as Terrain;

beforeAll(() => {
  // three.js procedural textures need a canvas 2D context; a permissive stub is enough.
  const ctx: unknown = new Proxy({}, {
    get: (_t, k) => {
      if (k === 'createImageData' || k === 'getImageData') {
        return (w: unknown, h?: number) => {
          const W = typeof w === 'number' ? w : 4;
          return { data: new Uint8ClampedArray(W * (h ?? 4) * 4), width: W, height: h ?? 4 };
        };
      }
      if (k === 'measureText') return () => ({ width: 1 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') {
        return () => ({ addColorStop() {} });
      }
      if (k === 'canvas') return document.createElement('canvas');
      return () => {};
    },
    set: () => true,
  });
  HTMLCanvasElement.prototype.getContext = (() => ctx) as never;
  // Terrain kicks off bridge/tunnel GLB loads; skip them (relative URLs are
  // invalid in jsdom and only add visuals).
  GLTFLoader.prototype.load = (() => {}) as never;
});

beforeEach(() => setActiveNavGrid(null));

function buildMap(template: MapTemplate, size: number) {
  const map = generateMap(42, () => 0, 2, template, size as MapSizeOption);
  const terrain = new Terrain(map.terrainFeatures, size as MapSizeOption);
  const grid = NavGrid.fromTerrain(terrain, map.terrainFeatures.rockWalls ?? []);
  setActiveNavGrid(grid);
  return { map, grid };
}

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

/** Order a move and simulate until it stops; returns frames used (or -1 if still moving). */
function drive(world: World, sys: (w: World, dt: number) => void, eid: number, tx: number, tz: number, maxFrames = 4000): number {
  Movement.targetX[eid] = tx;
  Movement.targetZ[eid] = tz;
  Movement.hasTarget[eid] = 1;
  for (let f = 0; f < maxFrames; f++) {
    if (Movement.hasTarget[eid] === 0) return f;
    sys(world, 1 / 30);
  }
  return Movement.hasTarget[eid] === 0 ? maxFrames : -1;
}

describe('pathfinding on classic 128 (seed 42)', () => {
  it('never freezes at a waypoint: spawn -> centre gold mine arrives', () => {
    const { map } = buildMap('classic', 128);
    const world = replaceWorld();
    const sys = createMovementSystem(flatTerrain);
    const mine = map.goldMines.find((g) => Math.abs(g.x - 4.59) < 0.2)!;
    expect(mine).toBeDefined();
    for (const [sx, sz] of [[-49, -49], [-59, -49], [-49, -39]]) {
      const u = spawnUnit(world, sx, sz);
      expect(drive(world, sys, u, mine.x, mine.z)).toBeGreaterThanOrEqual(0);
      expect(Math.hypot(Position.x[u] - mine.x, Position.z[u] - mine.z)).toBeLessThan(GATHER_ARRIVAL_DISTANCE);
      Movement.hasTarget[u] = 0;
    }
  });

  it('150 random walkable start/goal pairs: none stuck, all arrive, never in a blocked cell', () => {
    const { grid } = buildMap('classic', 128);
    const world = replaceWorld();
    const sys = createMovementSystem(flatTerrain);
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    let stuck = 0;
    let far = 0;
    let inBlocked = 0;
    for (let k = 0; k < 150; k++) {
      let sx: number, sz: number, tx: number, tz: number;
      do { sx = rnd() * 110 - 55; sz = rnd() * 110 - 55; } while (grid.isBlockedAt(sx, sz));
      do { tx = rnd() * 110 - 55; tz = rnd() * 110 - 55; } while (grid.isBlockedAt(tx, tz));
      const u = spawnUnit(world, sx, sz);
      Movement.targetX[u] = tx; Movement.targetZ[u] = tz; Movement.hasTarget[u] = 1;
      let f = 0;
      for (; f < 4000 && Movement.hasTarget[u] === 1; f++) {
        sys(world, 1 / 30);
        if (grid.isBlockedAt(Position.x[u], Position.z[u])) inBlocked++;
      }
      if (Movement.hasTarget[u] === 1) stuck++;
      else if (Math.hypot(Position.x[u] - tx, Position.z[u] - tz) > 0.6) far++;
      Movement.hasTarget[u] = 0;
      sys(world, 1 / 30);
    }
    expect(stuck).toBe(0);
    expect(far).toBe(0);
    expect(inBlocked).toBe(0);
  });
});

describe('resources inside blocked cells stay gatherable', () => {
  for (const [template, size] of [['classic', 128], ['islands', 80], ['arena', 80]] as const) {
    it(`${template} ${size}: a worker reaches every blocked resource within gather range`, () => {
      const { map, grid } = buildMap(template, size);
      const world = replaceWorld();
      const sys = createMovementSystem(flatTerrain);
      const resources = [...map.goldMines, ...map.treeResources].filter((r) => grid.isBlockedAt(r.x, r.z));
      expect(resources.length).toBeGreaterThan(0);
      for (const r of resources) {
        // Start from both player sides.
        for (const sp of map.spawns.slice(0, 2)) {
          const u = spawnUnit(world, sp.x, sp.z);
          expect(drive(world, sys, u, r.x, r.z)).toBeGreaterThanOrEqual(0);
          expect(Math.hypot(Position.x[u] - r.x, Position.z[u] - r.z)).toBeLessThan(GATHER_ARRIVAL_DISTANCE);
          Movement.hasTarget[u] = 0;
          sys(world, 1 / 30);
        }
      }
    });
  }
});
