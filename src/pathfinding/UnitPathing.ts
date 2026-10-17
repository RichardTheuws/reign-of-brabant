/**
 * UnitPathing -- per-unit path state on top of NavGrid, used by MovementSystem.
 *
 * - Movement.targetX/Z stays the authoritative final destination (every
 *   command/combat/gather system keeps writing it as before). This module only
 *   decides which point a unit steers toward this frame.
 * - Clear line of sight -> steer straight at the target (no search).
 * - Otherwise a path request is queued and solved within a per-frame node
 *   budget; units commanded together to the same spot share one search.
 * - No grid / unreachable target -> direct movement (old behaviour).
 * - Goal inside a blocked cell (resource placed in the river mask) but close to
 *   a reachable point -> path to that point, then a short free final leg into
 *   the goal so gather/attack arrival distances still work.
 * - A building placed across a live route (NavGrid.version bumped) -> the
 *   remaining route is re-checked on the unit's next step and re-planned when
 *   it now crosses a blocked cell (stuck detection would also catch it, but
 *   only after the unit has slid along the wall for STUCK_TIME).
 * - No progress for STUCK_TIME -> re-plan from the current position; after
 *   STUCK_MAX_REPATHS the unit stops (hasTarget=0) instead of freezing with a
 *   live order (e.g. at the bank of an unreachable goal, or behind a crowd).
 *
 * All state is keyed by eid. bitECS recycles eids, so state is dropped when a
 * unit stops, dies, or when a new grid is installed (every match start).
 */

import type { PathPoint } from '../types/index';
import type { NavGrid } from './NavGrid';

/** Re-evaluate the route when the target drifts this far from the planned goal. */
const REPATH_DISTANCE = 1.5;
/** Waypoint counts as reached within this radius. */
const WAYPOINT_RADIUS = 0.75;
/** A position jump this large between frames (tunnel, teleport, recycled eid) forces a re-plan. */
const TELEPORT_DISTANCE = 3;
/** A* node expansions allowed per frame across all requests (always >= 1 request). */
export const PATH_NODE_BUDGET = 24000;
/** Shared-path reuse: goals within this distance, starts within this distance. */
const SHARE_GOAL_DIST = 4;
const SHARE_START_DIST = 8;
/** Blocked goal within this distance of its nearest walkable point: allow a free final leg into it. */
const GOAL_ENTRY_DISTANCE = 4;
/** Free final leg into a blocked goal stops this close (below GATHER_ARRIVAL_DISTANCE = 1.5). */
export const BLOCKED_GOAL_STOP_DISTANCE = 1.25;
/** Progress check: moving less than STUCK_DISTANCE over STUCK_TIME seconds = stuck. */
const STUCK_DISTANCE = 0.25;
const STUCK_TIME = 1.0;
/** Re-plans from the current position before the unit gives up and stops. */
const STUCK_MAX_REPATHS = 3;

interface UnitPath {
  goalX: number;
  goalZ: number;
  /** Remaining waypoints; empty = steer at the live target. */
  waypoints: PathPoint[];
  idx: number;
  /** Goal itself is blocked: the last waypoint is the closest reachable point. */
  approx: boolean;
  /** Waiting for a search result. */
  pending: boolean;
  /** No route found -- move direct until the goal changes. */
  direct: boolean;
  /** Final leg may enter blocked cells (blocked goal next to the path end). */
  free: boolean;
  lastX: number;
  lastZ: number;
  /** Progress anchor for stuck detection. */
  progX: number;
  progZ: number;
  progTime: number;
  stuckRepaths: number;
  /** NavGrid.version the route was last validated against. */
  gridVersion: number;
}

/** Steering result codes. */
export const Steer = {
  /** Steer at Movement.target (direct). */
  Target: 0,
  /** Steer at the point written to `steerOut`. */
  Waypoint: 1,
  /** Path not ready yet -- hold position this frame. */
  Wait: 2,
  /** Reached the closest reachable point to a blocked goal, or gave up after repeated stuck re-plans -- stop. */
  ArrivedApprox: 3,
  /** Steer at Movement.target and allow entering blocked cells (no edge slide). */
  TargetFree: 4,
} as const;
export type Steer = typeof Steer[keyof typeof Steer];

let grid: NavGrid | null = null;
const paths = new Map<number, UnitPath>();
const queue: number[] = [];
const queued = new Set<number>();

interface SharedPath { startX: number; startZ: number; goalX: number; goalZ: number; waypoints: PathPoint[] }
let sharedThisFrame: SharedPath[] = [];

export const steerOut = { x: 0, z: 0 };

/** Install (or clear) the active grid. Drops all per-unit state. */
export function setActiveNavGrid(g: NavGrid | null): void {
  grid = g;
  resetUnitPaths();
}

export function getActiveNavGrid(): NavGrid | null {
  return grid;
}

export function resetUnitPaths(): void {
  paths.clear();
  queue.length = 0;
  queued.clear();
  sharedThisFrame = [];
}

export function clearUnitPath(eid: number): void {
  paths.delete(eid);
  queued.delete(eid);
}

/** Test/debug helper. */
export function getUnitPathState(eid: number): Readonly<UnitPath> | undefined {
  return paths.get(eid);
}

export function pendingPathCount(): number {
  return queued.size;
}

/**
 * Decide where `eid` steers this frame. Writes the point to `steerOut` when
 * returning Steer.Waypoint. `dt` (seconds) drives stuck detection.
 */
export function steerUnit(eid: number, px: number, pz: number, tx: number, tz: number, dt = 1 / 60): Steer {
  if (!grid) return Steer.Target;

  let st = paths.get(eid);
  const jumped = st !== undefined && Math.hypot(px - st.lastX, pz - st.lastZ) > TELEPORT_DISTANCE;
  if (!st || jumped || Math.hypot(tx - st.goalX, tz - st.goalZ) > REPATH_DISTANCE) {
    if (!st) {
      st = {
        goalX: tx, goalZ: tz, waypoints: [], idx: 0, approx: false, pending: false, direct: false, free: false,
        lastX: px, lastZ: pz, progX: px, progZ: pz, progTime: 0, stuckRepaths: 0, gridVersion: grid.version,
      };
      paths.set(eid, st);
    }
    st.goalX = tx; st.goalZ = tz;
    st.stuckRepaths = 0;
    planFrom(st, eid, px, pz);
  } else if (st.gridVersion !== grid.version) {
    // Footprints changed since this route was planned: re-plan only when the
    // rest of the route now crosses a blocked cell.
    if (!st.direct && !routeStillClear(st, px, pz)) planFrom(st, eid, px, pz);
  }
  st.gridVersion = grid.version;
  st.lastX = px; st.lastZ = pz;

  // Stuck detection: no real progress for STUCK_TIME -> re-plan from here.
  if (!st.pending) {
    if (Math.hypot(px - st.progX, pz - st.progZ) > STUCK_DISTANCE) {
      st.progX = px; st.progZ = pz; st.progTime = 0;
    } else if ((st.progTime += dt) > STUCK_TIME) {
      st.progX = px; st.progZ = pz; st.progTime = 0;
      if (++st.stuckRepaths > STUCK_MAX_REPATHS) {
        queued.delete(eid);
        return Steer.ArrivedApprox; // give up: stop rather than freeze with a live order
      }
      planFrom(st, eid, px, pz);
    }
  }

  if (st.direct) return Steer.Target;

  // Advance past reached waypoints. A waypoint only counts as passed when the
  // straight line from here to the next point is clear -- otherwise keep
  // steering at it (MovementSystem snaps onto it) so corners are never cut.
  while (st.idx < st.waypoints.length) {
    const w = st.waypoints[st.idx];
    const last = st.idx === st.waypoints.length - 1;
    if (last && !st.approx) break; // final leg steers at the live target
    const d = Math.hypot(w.x - px, w.z - pz);
    if (d > WAYPOINT_RADIUS) break;
    if (last) { st.idx++; return Steer.ArrivedApprox; }
    const nextLast = st.idx + 1 === st.waypoints.length - 1;
    // The final leg steers at the live target (unless approx).
    const liveNext = nextLast && !st.approx;
    const nx = liveNext ? tx : st.waypoints[st.idx + 1].x;
    const nz = liveNext ? tz : st.waypoints[st.idx + 1].z;
    // Free final leg into a blocked goal is never line-clear: require standing on w.
    const freeLeg = nextLast && st.free;
    if (d > 1e-3 && (freeLeg || !grid.isLineClear(px, pz, nx, nz))) break;
    st.idx++;
  }

  if (st.idx < st.waypoints.length) {
    const last = st.idx === st.waypoints.length - 1;
    if (last && !st.approx) return st.free ? Steer.TargetFree : Steer.Target;
    const w = st.waypoints[st.idx];
    steerOut.x = w.x; steerOut.z = w.z;
    return Steer.Waypoint;
  }
  if (st.pending) return Steer.Wait;
  return Steer.Target;
}

/**
 * True when the remaining route from (px,pz) is still free of blocked cells.
 * The leg into a blocked goal (free leg, or the approx end) is not checked:
 * it is allowed to enter blocked cells by design.
 */
function routeStillClear(st: UnitPath, px: number, pz: number): boolean {
  const g = grid!;
  let ax = px, az = pz;
  for (let i = st.idx; i < st.waypoints.length; i++) {
    const w = st.waypoints[i];
    const last = i === st.waypoints.length - 1;
    if (last && st.free) return true;
    if (!g.isLineClear(ax, az, w.x, w.z)) return false;
    ax = w.x; az = w.z;
  }
  if (st.approx || st.pending) return true;
  // Final leg (or the whole route when steering straight) to the live goal.
  // A goal that just became blocked needs a re-plan to get the free leg.
  return g.isLineClear(ax, az, st.goalX, st.goalZ);
}

/** (Re)plan toward st.goal from (px,pz): direct when clear, else share or queue a search. */
function planFrom(st: UnitPath, eid: number, px: number, pz: number): void {
  st.direct = false;
  st.approx = false;
  st.free = false;
  st.progX = px; st.progZ = pz; st.progTime = 0;
  if (grid!.isLineClear(px, pz, st.goalX, st.goalZ)) {
    st.waypoints = [];
    st.idx = 0;
    st.pending = false;
    queued.delete(eid);
  } else if (!tryShare(st, px, pz)) {
    // Keep following the previous route (if any) while the new one is pending.
    st.pending = true;
    if (!queued.has(eid)) { queued.add(eid); queue.push(eid); }
  }
}

function tryShare(st: UnitPath, px: number, pz: number): boolean {
  if (!grid) return false;
  for (const sp of sharedThisFrame) {
    if (Math.hypot(sp.goalX - st.goalX, sp.goalZ - st.goalZ) > SHARE_GOAL_DIST) continue;
    if (Math.hypot(sp.startX - px, sp.startZ - pz) > SHARE_START_DIST) continue;
    const wps = sp.waypoints;
    if (wps.length === 0) continue;
    const first = wps[0];
    const lastWp = wps[wps.length - 1];
    if (!grid.isLineClear(px, pz, first.x, first.z)) continue;
    if (!grid.isLineClear(lastWp.x, lastWp.z, st.goalX, st.goalZ)) continue;
    st.waypoints = wps.slice(0, -1);
    st.waypoints.push({ x: st.goalX, z: st.goalZ });
    st.idx = 0;
    st.pending = false;
    return true;
  }
  return false;
}

/**
 * Solve queued path requests within the node budget. `getPos` returns the
 * unit's current position (or null if it no longer exists / moves).
 */
export function processPathRequests(getPos: (eid: number) => PathPoint | null): void {
  sharedThisFrame = [];
  if (!grid || queue.length === 0) return;
  let used = 0;
  let solved = 0;
  while (queue.length > 0 && (solved === 0 || used < PATH_NODE_BUDGET)) {
    const eid = queue.shift()!;
    if (!queued.delete(eid)) continue;
    const st = paths.get(eid);
    const pos = getPos(eid);
    if (!st || !st.pending || !pos) continue;

    if (tryShare(st, pos.x, pos.z)) continue;

    const wps = grid.findPath(pos.x, pos.z, st.goalX, st.goalZ);
    used += grid.lastExpanded;
    solved++;
    st.pending = false;
    st.idx = 0;
    if (!wps) {
      st.waypoints = [];
      st.direct = true;
      continue;
    }
    const end = wps[wps.length - 1];
    const gap = Math.hypot(end.x - st.goalX, end.z - st.goalZ);
    st.approx = gap > 0.01;
    st.free = false;
    if (st.approx && gap <= GOAL_ENTRY_DISTANCE) {
      // Goal sits just inside a blocked cell (e.g. a mine in the river mask):
      // path to its nearest walkable point, then a free final leg into it.
      wps.push({ x: st.goalX, z: st.goalZ });
      st.approx = false;
      st.free = true;
    }
    st.waypoints = wps;
    if (!st.approx && !st.free) {
      sharedThisFrame.push({ startX: pos.x, startZ: pos.z, goalX: st.goalX, goalZ: st.goalZ, waypoints: wps });
    }
  }
}
