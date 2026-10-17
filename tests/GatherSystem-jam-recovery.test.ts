/**
 * @vitest-environment jsdom
 *
 * GatherSystem jam recovery (v0.62 risk): UnitPathing gives up after a few
 * fruitless stuck re-plans (clears Movement.hasTarget), and stops at the
 * closest reachable point when the goal is walled in. Before the fix a worker
 * in MOVING_TO_RESOURCE / RETURNING that ended up like that was never
 * re-ordered by GatherSystem and stood still forever.
 *
 * Real map (classic 128, seed 42), real MovementSystem + SeparationSystem +
 * GatherSystem, building footprints in the NavGrid. Jams are induced
 * deterministically: (a) workers that cannot move for a while (crowd stand-
 * in: speed 0 beyond the pathing give-up), (b) a drop-off / mine that is
 * temporarily walled in by footprints.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { addEntity, addComponent, query } from 'bitecs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Movement, Health, Gatherer, Resource, UnitAI } from '../src/ecs/components';
import { IsUnit, IsWorker, IsResource } from '../src/ecs/tags';
import { createMovementSystem } from '../src/systems/MovementSystem';
import { createSeparationSystem } from '../src/systems/SeparationSystem';
import { createGatherSystem, gatherJamRecoveries } from '../src/systems/GatherSystem';
import {
  createBureaucracySystem, activateVergadering, resetBureaucracy, isVergaderingStunned,
} from '../src/systems/BureaucracySystem';
import { NavGrid, type FootprintCells } from '../src/pathfinding/NavGrid';
import { setActiveNavGrid } from '../src/pathfinding/UnitPathing';
import { resetBuildingFootprints } from '../src/pathfinding/BuildingFootprints';
import { spawnBuildingEntity } from '../src/entities/buildingSpawn';
import { generateMap, type MapTemplate } from '../src/world/MapGenerator';
import { Terrain } from '../src/world/Terrain';
import { playerState } from '../src/core/PlayerState';
import {
  ResourceType, CARRY_CAPACITY, NO_ENTITY, UnitAIState, BuildingTypeId,
  VERGADERING_INITIAL_DELAY, VERGADERING_STUN_DURATION, MEETING_FATIGUE_DURATION,
  type MapSizeOption,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;
const flatTerrain = { isOnRoad: () => false, getHeightAt: () => 0 } as unknown as Terrain;
const DT = 1 / 30;
const GATHER_MOVING = 1;
const GATHER_RETURNING = 3;

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
  GLTFLoader.prototype.load = (() => {}) as never;
});

beforeEach(() => { setActiveNavGrid(null); resetBuildingFootprints(); playerState.reset(); resetBureaucracy(); });

interface Scene {
  world: World;
  grid: NavGrid;
  th: { x: number; z: number; factionId: number };
  node: number;
  workers: number[];
  step: () => void;
  delivered: () => number;
  /** Systems run between SeparationSystem and GatherSystem (SystemPipeline order: BureaucracySystem). */
  preGather: Array<(world: World, dt: number) => void>;
}

/** Start TownHalls, every node of `resType`, workers on the node nearest player `playerIdx`'s TownHall (default classic 128). */
function buildScene(
  resType: number, workerCount = 12, playerIdx = 0,
  template: MapTemplate = 'classic', mapSize = 128,
): Scene {
  const size = mapSize as MapSizeOption;
  const map = generateMap(42, () => 0, 2, template, size);
  const terrain = new Terrain(map.terrainFeatures, size);
  const grid = NavGrid.fromTerrain(terrain, map.terrainFeatures.rockWalls ?? []);
  setActiveNavGrid(grid);
  const world = replaceWorld();
  for (const b of map.buildings) spawnBuildingEntity(world, b.buildingType, b.factionId, b.x, b.z);
  const th = map.buildings[playerIdx];
  const pool = resType === ResourceType.Gold ? map.goldMines : map.treeResources;
  const nearest = [...pool].sort((a, b) =>
    Math.hypot(a.x - th.x, a.z - th.z) - Math.hypot(b.x - th.x, b.z - th.z))[0];

  let node = NO_ENTITY;
  for (const r of pool) {
    const e = addEntity(world);
    addComponent(world, e, Position); addComponent(world, e, Resource); addComponent(world, e, IsResource);
    Position.x[e] = r.x; Position.z[e] = r.z;
    Resource.type[e] = resType;
    // The shared node never runs dry (no depletion-driven retargeting in the measurement).
    const amount = r === nearest ? 1_000_000 : r.amount;
    Resource.amount[e] = amount; Resource.maxAmount[e] = amount;
    if (r === nearest) node = e;
  }

  const workers: number[] = [];
  for (let i = 0; i < workerCount; i++) {
    const e = addEntity(world);
    for (const c of [Position, Faction, Movement, Health, Gatherer, UnitAI, IsUnit, IsWorker]) addComponent(world, e, c);
    const a = (i / workerCount) * Math.PI * 2;
    Position.x[e] = th.x + Math.cos(a) * 3.2; Position.z[e] = th.z + Math.sin(a) * 3.2;
    Faction.id[e] = th.factionId; Health.current[e] = 60; Movement.speed[e] = 4;
    Gatherer.state[e] = GATHER_MOVING; Gatherer.targetEid[e] = node; Gatherer.carrying[e] = 0;
    Gatherer.carryCapacity[e] = CARRY_CAPACITY; Gatherer.resourceType[e] = resType; Gatherer.gatherSpeedMult[e] = 1;
    Movement.targetX[e] = Position.x[node]; Movement.targetZ[e] = Position.z[node]; Movement.hasTarget[e] = 1;
    UnitAI.state[e] = UnitAIState.MovingToResource;
    workers.push(e);
  }

  const move = createMovementSystem(flatTerrain);
  const sep = createSeparationSystem();
  const gather = createGatherSystem();
  const fac = th.factionId;
  const preGather: Scene['preGather'] = [];
  return {
    world, grid, th, node, workers, preGather,
    step: () => {
      world.meta.elapsed += DT;
      move(world, DT); sep(world, DT);
      for (const sys of preGather) sys(world, DT);
      gather(world, DT);
    },
    delivered: () => (resType === ResourceType.Gold ? playerState.getGoldGathered(fac) : playerState.getWoodGathered(fac)),
  };
}

/** Tracks, per worker, how long it has stood still while in MOVING_TO_RESOURCE / RETURNING. */
function stallTracker(workers: number[]) {
  const still = new Map<number, number>();
  const last = new Map<number, [number, number]>();
  let maxStall = 0;
  return {
    sample(): void {
      for (const e of workers) {
        const st = Gatherer.state[e];
        const p = last.get(e);
        const moved = !p || Math.hypot(Position.x[e] - p[0], Position.z[e] - p[1]) > 0.02;
        last.set(e, [Position.x[e], Position.z[e]]);
        if ((st === GATHER_MOVING || st === GATHER_RETURNING) && !moved) {
          const s = (still.get(e) ?? 0) + DT;
          still.set(e, s);
          maxStall = Math.max(maxStall, s);
        } else still.set(e, 0);
      }
    },
    get maxStall() { return maxStall; },
  };
}

function frozenCount(workers: number[]): number {
  return workers.filter((e) =>
    (Gatherer.state[e] === GATHER_MOVING || Gatherer.state[e] === GATHER_RETURNING)
    && Movement.hasTarget[e] === 0).length;
}

/** Wall in (x,z): a ring of footprints that leaves no walkable cell within reach. */
function wallIn(grid: NavGrid, x: number, z: number): FootprintCells[] {
  const fps: FootprintCells[] = [];
  for (let dx = -6; dx <= 6; dx += 3) {
    for (let dz = -6; dz <= 6; dz += 3) {
      const fp = grid.addFootprint(x + dx, z + dz, 1.5, 1.5);
      if (fp) fps.push(fp);
    }
  }
  return fps;
}

describe('12 workers, one node + one TownHall, 300 s (classic 128)', () => {
  for (const resType of [ResourceType.Gold, ResourceType.Wood]) {
    const label = resType === ResourceType.Gold ? 'gold mine' : 'tree';
    it(`${label}: no worker stands still > 10 s, delivery grows linearly, crowd stalls recover`, () => {
      const s = buildScene(resType);
      const track = stallTracker(s.workers);
      const perMinute: number[] = [];
      let minuteStart = 0;
      const frames = Math.round(300 / DT);
      // Crowd stand-in: at t = 100 s four workers cannot move for 4.5 s --
      // past UnitPathing's stuck give-up (4 x STUCK_TIME), so they lose
      // their move order mid-trip.
      const jammed = s.workers.slice(0, 4);
      const jamStart = Math.round(100 / DT);
      const jamEnd = Math.round(104.5 / DT);
      for (let f = 1; f <= frames; f++) {
        if (f === jamStart) for (const e of jammed) Movement.speed[e] = 0;
        if (f === jamEnd) for (const e of jammed) Movement.speed[e] = 4;
        s.step();
        track.sample();
        if (f % Math.round(60 / DT) === 0) {
          perMinute.push(s.delivered() - minuteStart);
          minuteStart = s.delivered();
        }
      }
      expect(track.maxStall).toBeLessThan(10);
      expect(frozenCount(s.workers)).toBe(0);
      // Linear: every 60 s block delivers within +-25 % of the average.
      const avg = perMinute.reduce((a, b) => a + b, 0) / perMinute.length;
      expect(avg).toBeGreaterThan(0);
      for (const m of perMinute) {
        expect(m).toBeGreaterThan(avg * 0.75);
        expect(m).toBeLessThan(avg * 1.25);
      }
      // No repath storm: a handful of recoveries, not one per frame.
      expect(gatherJamRecoveries).toBeLessThan(40);
    });
  }
});

describe('a worker whose path was given up is ordered again', () => {
  for (const state of [GATHER_MOVING, GATHER_RETURNING]) {
    const label = state === GATHER_MOVING ? 'MOVING_TO_RESOURCE' : 'RETURNING';
    it(`${label}: stuck past the re-plan limit, then free -> reaches its goal`, () => {
      const s = buildScene(ResourceType.Gold, 1);
      const w = s.workers[0];
      // Halfway between TownHall and mine, carrying a full load when returning.
      Position.x[w] = (s.th.x + Position.x[s.node]) / 2;
      Position.z[w] = (s.th.z + Position.z[s.node]) / 2 + 3;
      if (state === GATHER_RETURNING) {
        Gatherer.state[w] = GATHER_RETURNING;
        Gatherer.carrying[w] = CARRY_CAPACITY;
        Movement.targetX[w] = s.th.x; Movement.targetZ[w] = s.th.z;
      }
      Movement.speed[w] = 0;
      let gaveUpAt = -1;
      for (let f = 0; f < Math.round(6 / DT); f++) {
        s.step();
        if (gaveUpAt < 0 && Movement.hasTarget[w] === 0) gaveUpAt = f * DT;
      }
      // UnitPathing gave up (the precondition this fix is about).
      expect(gaveUpAt).toBeGreaterThan(3);
      Movement.speed[w] = 4;
      let done = false;
      for (let f = 0; f < Math.round(20 / DT) && !done; f++) {
        s.step();
        done = state === GATHER_MOVING ? Gatherer.state[w] === 2 : s.delivered() > 0;
      }
      expect(done).toBe(true);
    });
  }

  it('drop-off walled in, then opened again -> the worker deposits; backoff keeps retries low', () => {
    const s = buildScene(ResourceType.Gold, 1);
    const w = s.workers[0];
    Position.x[w] = s.th.x + 12; Position.z[w] = s.th.z + 12;
    Gatherer.state[w] = GATHER_RETURNING;
    Gatherer.carrying[w] = CARRY_CAPACITY;
    Movement.targetX[w] = s.th.x; Movement.targetZ[w] = s.th.z; Movement.hasTarget[w] = 1;
    const wall = wallIn(s.grid, s.th.x, s.th.z);
    for (let f = 0; f < Math.round(30 / DT); f++) s.step();
    expect(s.delivered()).toBe(0);
    // Unreachable for 30 s: retried with backoff (<= 4 s apart), not every frame.
    expect(gatherJamRecoveries).toBeGreaterThan(2);
    expect(gatherJamRecoveries).toBeLessThan(20);
    for (const fp of wall) s.grid.removeFootprint(fp);
    let f = 0;
    for (; f < Math.round(20 / DT) && s.delivered() === 0; f++) s.step();
    expect(s.delivered()).toBe(CARRY_CAPACITY);
    expect(Gatherer.state[w]).toBe(GATHER_MOVING);
  });

  it('AI-faction workers (P2) get the same recovery (one GatherSystem for all factions)', () => {
    const s = buildScene(ResourceType.Gold, 1, 1);
    expect(s.th.factionId).not.toBe(0);
    const w = s.workers[0];
    Position.x[w] = s.th.x + 8; Position.z[w] = s.th.z + 8;
    Movement.speed[w] = 0;
    for (let f = 0; f < Math.round(6 / DT); f++) s.step();
    Movement.speed[w] = 4;
    for (let f = 0; f < Math.round(20 / DT) && Gatherer.state[w] !== 2; f++) s.step();
    expect(Gatherer.state[w]).toBe(2);
    expect(gatherJamRecoveries).toBeGreaterThan(0);
  });

  it('a worker fighting back (UnitAI Attacking) is left alone', () => {
    const s = buildScene(ResourceType.Gold, 1);
    const w = s.workers[0];
    Position.x[w] = s.th.x + 10; Position.z[w] = s.th.z + 10;
    UnitAI.state[w] = UnitAIState.Attacking;
    Movement.hasTarget[w] = 0;
    for (let f = 0; f < Math.round(10 / DT); f++) s.step();
    expect(Movement.hasTarget[w]).toBe(0);
    expect(gatherJamRecoveries).toBe(0);
  });
});

/** Delivered per 60 s block over `minutes` minutes. */
function perMinute(s: Scene, minutes: number): number[] {
  const out: number[] = [];
  for (let m = 0; m < minutes; m++) {
    const d0 = s.delivered();
    for (let f = 0; f < Math.round(60 / DT); f++) s.step();
    out.push(s.delivered() - d0);
  }
  return out;
}

/**
 * Real Randstad Eindeloze Vergadering over the gather loop, BureaucracySystem
 * in the pipeline. Runs through the stun and the Meeting Fatigue that follows;
 * returns the recovery orders GatherSystem issued while the stun was on.
 */
function runVergadering(s: Scene): number {
  const bur = createBureaucracySystem();
  bur(s.world, VERGADERING_INITIAL_DELAY); // initial cooldown over
  s.preGather.push(bur);
  // Centred between TownHall and mine: the radius (15) covers the whole gather loop.
  const cx = (s.th.x + Position.x[s.node]) / 2;
  const cz = (s.th.z + Position.z[s.node]) / 2;
  expect(activateVergadering(s.world, cx, cz)).toBe(true);
  expect(s.workers.every((e) => isVergaderingStunned(e))).toBe(true);
  const r0 = gatherJamRecoveries;
  let stunFrames = 0;
  while (s.workers.some((e) => isVergaderingStunned(e))) { s.step(); stunFrames++; }
  expect(stunFrames * DT).toBeGreaterThan(VERGADERING_STUN_DURATION - 0.5);
  const duringStun = gatherJamRecoveries - r0;
  for (let f = 0; f < Math.round((MEETING_FATIGUE_DURATION + 0.5) / DT); f++) s.step();
  return duringStun;
}

describe('Eindeloze Vergadering (Randstad stun) is not a jam', () => {
  const maps: Array<[MapTemplate, number]> = [['classic', 128], ['crossroads', 192]];
  for (const [template, size] of maps) {
    it(`${template} ${size}: no recovery while stunned, home mine kept, gold/min back to normal`, () => {
      const s = buildScene(ResourceType.Gold, 12, 0, template, size);
      for (let f = 0; f < Math.round(60 / DT); f++) s.step(); // ramp-up
      const [before] = perMinute(s, 1);
      expect(before).toBeGreaterThan(0);

      expect(runVergadering(s)).toBe(0);
      expect(s.workers.map((e) => Gatherer.targetEid[e])).toEqual(s.workers.map(() => s.node));

      const after = perMinute(s, 3);
      // The stun leaves UnitAI on Idle; workers get their gather state back.
      for (const e of s.workers) expect(UnitAI.state[e]).toBe(UnitAIState.MovingToResource);
      expect(s.workers.map((e) => Gatherer.targetEid[e])).toEqual(s.workers.map(() => s.node));
      for (const m of after) expect(m).toBeGreaterThan(before * 0.85);
    });
  }

  it('a stunned worker that walks out of range is not re-ordered or retargeted during the stun', () => {
    const s = buildScene(ResourceType.Gold, 1, 0, 'crossroads', 192);
    const w = s.workers[0];
    Position.x[w] = s.th.x + 3; Position.z[w] = s.th.z;
    const bur = createBureaucracySystem();
    bur(s.world, VERGADERING_INITIAL_DELAY);
    s.preGather.push(bur);
    expect(activateVergadering(s.world, s.th.x, s.th.z)).toBe(true);
    for (let f = 0; f < Math.round(9 / DT); f++) {
      s.step();
      expect(Movement.hasTarget[w]).toBe(0);
      expect(UnitAI.state[w]).toBe(UnitAIState.Idle);
    }
    expect(gatherJamRecoveries).toBe(0);
    expect(Gatherer.targetEid[w]).toBe(s.node);
  });
});

describe('workers left on UnitAI Idle with a gather job (after a fight)', () => {
  it('get their gather state back and deliver at the normal rate', () => {
    const ref = buildScene(ResourceType.Gold, 12);
    for (let f = 0; f < Math.round(60 / DT); f++) ref.step();
    const normal = perMinute(ref, 2);

    playerState.reset();
    const s = buildScene(ResourceType.Gold, 12);
    // CombatSystem.clearAttackAndSeekNew without a previous target: Idle, no move order, gather state kept.
    for (const e of s.workers) { UnitAI.state[e] = UnitAIState.Idle; Movement.hasTarget[e] = 0; }
    for (let f = 0; f < Math.round(60 / DT); f++) s.step();
    const got = perMinute(s, 2);
    for (const e of s.workers) expect(UnitAI.state[e]).toBe(UnitAIState.MovingToResource);
    for (let i = 0; i < got.length; i++) expect(got[i]).toBeGreaterThan(normal[i] * 0.85);
  });
});

describe('redirect (escalation step 3) stays close to the original goal', () => {
  it('gold: walled-in home mine on crossroads 192 is never swapped for a far mine', () => {
    const s = buildScene(ResourceType.Gold, 1, 0, 'crossroads', 192);
    const w = s.workers[0];
    Position.x[w] = (s.th.x + Position.x[s.node]) / 2;
    Position.z[w] = (s.th.z + Position.z[s.node]) / 2;
    const wall = wallIn(s.grid, Position.x[s.node], Position.z[s.node]);
    for (let f = 0; f < Math.round(30 / DT); f++) {
      s.step();
      expect(Gatherer.targetEid[w]).toBe(s.node);
    }
    // Every escalation step ran at least once (the redirect step included).
    expect(gatherJamRecoveries).toBeGreaterThanOrEqual(3);
    for (const fp of wall) s.grid.removeFootprint(fp);
    for (let f = 0; f < Math.round(20 / DT) && Gatherer.state[w] !== 2; f++) s.step();
    expect(Gatherer.state[w]).toBe(2);
    expect(Gatherer.targetEid[w]).toBe(s.node);
  });

  it('wood: redirects to a tree in the same grove, never to one far away', () => {
    const s = buildScene(ResourceType.Wood, 1);
    const w = s.workers[0];
    const nx = Position.x[s.node];
    const nz = Position.z[s.node];
    const trees = query(s.world, [Resource]).filter((e) => e !== s.node);
    const dist = (e: number) => Math.hypot(Position.x[e] - nx, Position.z[e] - nz);
    // Only far trees left besides the target.
    for (const e of trees) if (dist(e) <= 10) Resource.amount[e] = 0;
    expect(trees.some((e) => Resource.amount[e] > 0)).toBe(true);
    Position.x[w] = (s.th.x + nx) / 2; Position.z[w] = (s.th.z + nz) / 2;
    const wall = wallIn(s.grid, nx, nz);
    for (let f = 0; f < Math.round(30 / DT); f++) s.step();
    expect(gatherJamRecoveries).toBeGreaterThanOrEqual(3);
    expect(Gatherer.targetEid[w]).toBe(s.node);

    // A live neighbour in the same grove is a valid redirect target.
    for (const fp of wall) s.grid.removeFootprint(fp);
    const near = trees.filter((e) => dist(e) <= 10).sort((a, b) => dist(a) - dist(b))[0];
    expect(near).toBeDefined();
    Resource.amount[near] = 500;
    const s2wall = wallIn(s.grid, nx, nz);
    const picked = new Set<number>();
    for (let f = 0; f < Math.round(30 / DT); f++) { s.step(); picked.add(Gatherer.targetEid[w]); }
    for (const fp of s2wall) s.grid.removeFootprint(fp);
    for (const t of picked) expect(t === s.node || dist(t) <= 10).toBe(true);
    expect(picked.has(near)).toBe(true);
  });

  it('drop-off: a far second TownHall is not used while the home TownHall is walled in', () => {
    const s = buildScene(ResourceType.Gold, 1);
    const w = s.workers[0];
    // Same faction, ~60 units away.
    const far = spawnBuildingEntity(s.world, BuildingTypeId.TownHall, s.th.factionId, s.th.x * 0.1, s.th.z * 0.1);
    expect(Math.hypot(Position.x[far] - s.th.x, Position.z[far] - s.th.z)).toBeGreaterThan(40);
    Position.x[w] = s.th.x + 12 * Math.sign(-s.th.x || 1); Position.z[w] = s.th.z + 12 * Math.sign(-s.th.z || 1);
    Gatherer.state[w] = GATHER_RETURNING;
    Gatherer.carrying[w] = CARRY_CAPACITY;
    Movement.targetX[w] = s.th.x; Movement.targetZ[w] = s.th.z; Movement.hasTarget[w] = 1;
    const wall = wallIn(s.grid, s.th.x, s.th.z);
    let closestToFar = Infinity;
    for (let f = 0; f < Math.round(30 / DT); f++) {
      s.step();
      closestToFar = Math.min(closestToFar, Math.hypot(Position.x[w] - Position.x[far], Position.z[w] - Position.z[far]));
    }
    expect(gatherJamRecoveries).toBeGreaterThanOrEqual(3);
    expect(s.delivered()).toBe(0);
    expect(closestToFar).toBeGreaterThan(20);
    for (const fp of wall) s.grid.removeFootprint(fp);
    for (let f = 0; f < Math.round(20 / DT) && s.delivered() === 0; f++) s.step();
    expect(s.delivered()).toBe(CARRY_CAPACITY);
  });
});
