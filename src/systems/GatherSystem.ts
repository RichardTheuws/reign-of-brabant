/**
 * Reign of Brabant -- Gather System
 *
 * Manages the worker resource gathering loop:
 *   MOVING_TO_RESOURCE -> GATHERING -> RETURNING -> (repeat)
 *
 * Workers harvest gold from mines, carry up to carryCapacity (10),
 * return to nearest town hall to deposit, then auto-return to the mine.
 *
 * Jam recovery: UnitPathing gives up (clears Movement.hasTarget) after a few
 * fruitless stuck re-plans, and stops at the closest reachable point when a
 * goal is walled in. A worker in MOVING_TO_RESOURCE / RETURNING that ends up
 * without a move order outside interaction range -- or that keeps a move
 * order but makes no headway -- would otherwise stand there forever. The
 * watchdog below re-issues the order with escalation (same target, detour
 * via a free cell on another side, a nearby node / drop-off) and backoff.
 *
 * Disabled workers are left alone: fighting back, holding position, Stunned
 * component, and the Randstad Eindeloze Vergadering (which forces UnitAI Idle
 * + no move order every frame instead of using Stunned). A worker that still
 * has a gather job but whose UnitAI was left on Idle (after a stun, or after
 * a fight without a previous target) gets its gather UnitAI state back, so
 * SeparationSystem stops shoving it around mid-walk.
 */

import { query, hasComponent, entityExists, addComponent } from 'bitecs';
import {
  Position,
  Gatherer,
  Resource,
  Movement,
  Faction,
  Building,
  UnitAI,
  Stunned,
} from '../ecs/components';
import { IsWorker, IsBuilding, IsResource, IsDead, NeedsPathfinding } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import {
  ResourceType,
  HARVEST_RATE,
  CARRY_CAPACITY,
  GATHER_ARRIVAL_DISTANCE,
  DEPOSIT_ARRIVAL_DISTANCE,
  NO_ENTITY,
  BuildingTypeId,
  DIMINISHING_RETURNS_THRESHOLD,
  DIMINISHING_RETURNS_GATHER_MULT,
  UnitAIState,
} from '../types/index';
import { getRandstadGatherMult } from './HavermoutmelkSystem';
import { getLimburgGatherMult } from './MijnschachtSystem';
import { getDifficultyGatherMult } from '../data/difficultyConfig';
import { clearUnitPath, getActiveNavGrid } from '../pathfinding/UnitPathing';
import { isVergaderingStunned } from './BureaucracySystem';
import type { GameWorld } from '../ecs/world';

// Gather states (matches Gatherer.state u8 values)
const GATHER_NONE = 0;
const GATHER_MOVING_TO_RESOURCE = 1;
const GATHER_GATHERING = 2;
const GATHER_RETURNING = 3;

// ---------------------------------------------------------------------------
// Jam recovery tuning
// ---------------------------------------------------------------------------

/** Without a move order outside range for this long (s) -> first recovery. */
export const JAM_IDLE_GRACE = 0.4;
/** With a move order, the worker must move this far ... */
const JAM_PROGRESS_DISTANCE = 0.5;
/** ... within this many seconds, or the worker counts as jammed. */
export const JAM_NO_PROGRESS_TIME = 5;
/** Backoff between recovery attempts: base * 2^(n-1), capped. */
const JAM_BACKOFF_BASE = 0.5;
const JAM_BACKOFF_MAX = 4;
/** Detour points sit this far from the target (outside a 4x4 building / mine footprint). */
const JAM_DETOUR_RADIUS = 4;
/**
 * Redirect (escalation step 3) to another tree only within this distance of
 * the original one -- a neighbour in the same grove. Gold never redirects: a
 * base has one or two mines, and "the nearest other mine" can be across the
 * map (58 units on crossroads 192).
 */
const JAM_REDIRECT_NODE_RADIUS = 10;
/** Redirect to another drop-off only when the trip is at most this much longer. */
const JAM_REDIRECT_DEPOSIT_SLACK = 10;
/** Drop recovery entries of workers not seen for this long (s). */
const JAM_PRUNE_AGE = 5;
/** UnitAI states in which a stationary gatherer is busy with something else. */
const BUSY_AI_STATES: ReadonlySet<number> = new Set([
  UnitAIState.Attacking, UnitAIState.HoldPosition, UnitAIState.Stunned, UnitAIState.Dead,
]);

interface JamWatch {
  /** Gather state + target the entry belongs to (recycled eid / new order -> fresh entry). */
  state: number;
  goal: number;
  /** Progress anchor: last position the worker moved JAM_PROGRESS_DISTANCE away from, and when. */
  ax: number;
  az: number;
  anchorAt: number;
  /** When the worker was first seen without a move order outside range (-1 = not). */
  idleSince: number;
  /** Recovery attempts since the worker last reached its goal. */
  attempts: number;
  /** Earliest time the next attempt may fire. */
  nextAt: number;
  /** Currently walking a detour: on arrival re-issue the real goal at once. */
  detour: boolean;
  /** Drop-off the worker was redirected to (RETURNING), or NO_ENTITY. */
  altDeposit: number;
  seenAt: number;
}

/** Test/debug: number of recovery orders issued by the most recent gather system. */
export let gatherJamRecoveries = 0;

interface GatherCtx {
  now: number;
  jams: Map<number, JamWatch>;
}

/**
 * Create the gather system.
 */
export function createGatherSystem() {
  const ctx: GatherCtx = { now: 0, jams: new Map() };
  let lastPrune = 0;
  gatherJamRecoveries = 0;
  return function gatherSystem(world: GameWorld, dt: number): void {
    ctx.now += dt;
    const workers = query(world, [Position, Gatherer, IsWorker]);

    for (const eid of workers) {
      // Skip dead workers -- DeathSystem removes them after the death animation
      if (hasComponent(world, eid, IsDead)) { ctx.jams.delete(eid); continue; }

      const state = Gatherer.state[eid];
      if (state === GATHER_NONE) { ctx.jams.delete(eid); continue; }
      restoreGatherAIState(world, eid);

      switch (state) {
        case GATHER_MOVING_TO_RESOURCE:
          processMovingToResource(world, eid, ctx);
          break;
        case GATHER_GATHERING:
          ctx.jams.delete(eid);
          processGathering(world, eid, dt);
          break;
        case GATHER_RETURNING:
          processReturning(world, eid, ctx);
          break;
      }
    }

    if (ctx.now - lastPrune > JAM_PRUNE_AGE) {
      lastPrune = ctx.now;
      for (const [eid, w] of ctx.jams) if (ctx.now - w.seenAt > JAM_PRUNE_AGE) ctx.jams.delete(eid);
    }
  };
}

// ---------------------------------------------------------------------------
// State handlers
// ---------------------------------------------------------------------------

function processMovingToResource(world: GameWorld, eid: number, ctx: GatherCtx): void {
  const targetEid = Gatherer.targetEid[eid];

  // Resource gone or depleted
  if (
    targetEid === NO_ENTITY ||
    !entityExists(world, targetEid) ||
    hasComponent(world, targetEid, IsDead) ||
    Resource.amount[targetEid] <= 0
  ) {
    findNearestResourceOrIdle(world, eid, Gatherer.resourceType[eid]);
    return;
  }

  // Check if arrived at resource
  const dx = Position.x[targetEid] - Position.x[eid];
  const dz = Position.z[targetEid] - Position.z[eid];
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < GATHER_ARRIVAL_DISTANCE) {
    // Start gathering -- stop movement
    Gatherer.state[eid] = GATHER_GATHERING;
    Movement.hasTarget[eid] = 0;
    ctx.jams.delete(eid);
    return;
  }

  watchForJam(world, eid, ctx, targetEid);
}

function processGathering(world: GameWorld, eid: number, dt: number): void {
  const targetEid = Gatherer.targetEid[eid];

  // Resource gone
  if (
    targetEid === NO_ENTITY ||
    !entityExists(world, targetEid) ||
    Resource.amount[targetEid] <= 0
  ) {
    // If carrying something, go deposit first
    if (Gatherer.carrying[eid] > 0) {
      startReturning(world, eid);
    } else {
      findNearestResourceOrIdle(world, eid, Gatherer.resourceType[eid]);
    }
    return;
  }

  // Harvest: +HARVEST_RATE per second (with diminishing returns for depleted resources)
  let effectiveRate = HARVEST_RATE;
  const maxAmount = Resource.maxAmount[targetEid];
  if (maxAmount > 0 && Resource.amount[targetEid] / maxAmount < DIMINISHING_RETURNS_THRESHOLD) {
    effectiveRate *= DIMINISHING_RETURNS_GATHER_MULT;
  }
  // Per-worker gather-rate multiplier from upgrades (defensive: 0 → 1 fallback for legacy entities).
  const speedMult = Gatherer.gatherSpeedMult[eid];
  if (speedMult > 0) effectiveRate *= speedMult;
  // Randstad-only: Sprint Mode buff (click-action) × Stagiairsleger passive (voorraad-based).
  effectiveRate *= getRandstadGatherMult(Faction.id[eid]);
  // Limburg-only: Ploegendienst click-buff (Mijnschacht).
  effectiveRate *= getLimburgGatherMult(Faction.id[eid]);
  // Difficulty asymmetry: easy gives the player 1.15× and the AI 0.65×;
  // hard gives the AI 1.15× and leaves the player at 1.0×.
  effectiveRate *= getDifficultyGatherMult(Faction.id[eid]);
  const harvestAmount = effectiveRate * dt;
  const baseCapacity = Gatherer.carryCapacity[eid] || CARRY_CAPACITY;
  const capacity = baseCapacity + (Gatherer.carryBonus[eid] || 0);
  const remaining = capacity - Gatherer.carrying[eid];
  const available = Resource.amount[targetEid];
  const actual = Math.min(harvestAmount, remaining, available);

  Gatherer.carrying[eid] += actual;
  Resource.amount[targetEid] = Math.max(0, Resource.amount[targetEid] - actual);

  // Full capacity -- head to town hall
  if (Gatherer.carrying[eid] >= capacity) {
    startReturning(world, eid);
    return;
  }

  // Resource depleted while gathering
  if (Resource.amount[targetEid] <= 0) {
    if (Gatherer.carrying[eid] > 0) {
      startReturning(world, eid);
    } else {
      findNearestResourceOrIdle(world, eid, Gatherer.resourceType[eid]);
    }
  }
}

function processReturning(world: GameWorld, eid: number, ctx: GatherCtx): void {
  // Find nearest deposit building for the carried resource type
  const factionId = Faction.id[eid];
  const resType = Gatherer.resourceType[eid];
  let depositEid = findNearestDepositBuilding(world, eid, factionId, resType);
  // Jam recovery may have sent the worker to another drop-off: head there.
  const alt = ctx.jams.get(eid)?.altDeposit ?? NO_ENTITY;
  if (alt !== NO_ENTITY && isValidDeposit(world, alt, factionId, resType)) depositEid = alt;

  if (depositEid === NO_ENTITY) {
    // No deposit building -- go idle
    Gatherer.state[eid] = GATHER_NONE;
    return;
  }

  // Check if arrived at deposit building
  const dx = Position.x[depositEid] - Position.x[eid];
  const dz = Position.z[depositEid] - Position.z[eid];
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist >= DEPOSIT_ARRIVAL_DISTANCE) {
    watchForJam(world, eid, ctx, depositEid);
    return;
  }

  ctx.jams.delete(eid);
  // Deposit resources
  const amount = Math.floor(Gatherer.carrying[eid]);
  if (resType === ResourceType.Wood) {
    playerState.recordWoodGathered(factionId, amount);
  } else {
    playerState.recordGoldGathered(factionId, amount);
  }
  Gatherer.carrying[eid] = 0;

  // Auto-return to same resource
  const targetEid = Gatherer.targetEid[eid];
  if (
    targetEid !== NO_ENTITY &&
    entityExists(world, targetEid) &&
    Resource.amount[targetEid] > 0
  ) {
    Gatherer.state[eid] = GATHER_MOVING_TO_RESOURCE;
    Movement.targetX[eid] = Position.x[targetEid];
    Movement.targetZ[eid] = Position.z[targetEid];
    Movement.hasTarget[eid] = 1;
    addComponent(world, eid, NeedsPathfinding);
  } else {
    // Resource depleted, find another of the same type
    findNearestResourceOrIdle(world, eid, resType);
  }
}

// ---------------------------------------------------------------------------
// Jam recovery
// ---------------------------------------------------------------------------

/**
 * Called each frame for a worker that is heading for `goalEid` (resource in
 * MOVING_TO_RESOURCE, drop-off in RETURNING) and is still outside
 * interaction range. Detects "no move order" (pathing gave up / stopped at
 * the closest reachable point) and "move order without headway", and
 * re-issues the order with escalation and backoff.
 */
function watchForJam(world: GameWorld, eid: number, ctx: GatherCtx, goalEid: number): void {
  // Fighting back (CombatSystem keeps the gather state to resume afterwards),
  // holding position or stunned: not a jam, and not ours to move.
  if (
    (hasComponent(world, eid, UnitAI) && BUSY_AI_STATES.has(UnitAI.state[eid]))
    || isDisabled(world, eid)
  ) {
    ctx.jams.delete(eid);
    return;
  }
  const now = ctx.now;
  const state = Gatherer.state[eid];
  const px = Position.x[eid];
  const pz = Position.z[eid];
  let w = ctx.jams.get(eid);
  if (!w || w.state !== state || w.goal !== goalEid) {
    // New order / other goal / recycled eid. Within the same gather state the
    // escalation carries over (a redirect changes the goal mid-recovery).
    const prev = w !== undefined && w.state === state ? w : undefined;
    w = {
      state, goal: goalEid, ax: px, az: pz, anchorAt: now, idleSince: -1,
      attempts: prev?.attempts ?? 0, nextAt: prev?.nextAt ?? 0,
      detour: prev?.detour ?? false, altDeposit: prev?.altDeposit ?? NO_ENTITY, seenAt: now,
    };
    ctx.jams.set(eid, w);
  }
  w.seenAt = now;

  let jammed = false;
  if (Movement.hasTarget[eid] === 1) {
    w.idleSince = -1;
    if (Math.hypot(px - w.ax, pz - w.az) > JAM_PROGRESS_DISTANCE) {
      w.ax = px; w.az = pz; w.anchorAt = now;
    } else if (now - w.anchorAt > JAM_NO_PROGRESS_TIME) {
      jammed = true;
    }
  } else {
    if (w.detour) {
      // Reached the detour point: straight on to the real goal.
      w.detour = false;
      w.ax = px; w.az = pz; w.anchorAt = now;
      issueMove(world, eid, Position.x[goalEid], Position.z[goalEid]);
      return;
    }
    if (w.idleSince < 0) w.idleSince = now;
    jammed = now - w.idleSince >= JAM_IDLE_GRACE;
  }
  if (!jammed || now < w.nextAt) return;

  w.attempts++;
  w.nextAt = now + Math.min(JAM_BACKOFF_MAX, JAM_BACKOFF_BASE * 2 ** (w.attempts - 1));
  w.ax = px; w.az = pz; w.anchorAt = now; w.idleSince = -1;
  w.detour = false;
  gatherJamRecoveries++;

  // Escalation cycle: 0 = same goal again, 1 = detour via another side,
  // 2 = a nearby node / drop-off (a detour when there is none or it is too far).
  const step = (w.attempts - 1) % 3;
  if (step === 2 && redirect(world, eid, w, goalEid)) return;
  if (step >= 1) {
    const angle = Math.atan2(pz - Position.z[goalEid], px - Position.x[goalEid])
      + w.attempts * 2.39996; // golden angle: every detour tries a new side
    const p = findDetourPoint(Position.x[goalEid], Position.z[goalEid], angle);
    if (p) {
      w.detour = true;
      issueMove(world, eid, p.x, p.z);
      return;
    }
  }
  issueMove(world, eid, Position.x[goalEid], Position.z[goalEid]);
}

/**
 * Third escalation step: send the worker to a nearby resource node of the same
 * type (MOVING_TO_RESOURCE) or another drop-off (RETURNING). False when there
 * is no alternative.
 */
function redirect(world: GameWorld, eid: number, w: JamWatch, goalEid: number): boolean {
  const resType = Gatherer.resourceType[eid];
  if (Gatherer.state[eid] === GATHER_MOVING_TO_RESOURCE) {
    if (resType === ResourceType.Gold) return false;
    const alt = findNearestResource(world, eid, resType, goalEid);
    if (alt === NO_ENTITY) return false;
    if (Math.hypot(Position.x[alt] - Position.x[goalEid], Position.z[alt] - Position.z[goalEid])
      > JAM_REDIRECT_NODE_RADIUS) return false;
    Gatherer.targetEid[eid] = alt;
    issueMove(world, eid, Position.x[alt], Position.z[alt]);
    return true;
  }
  const alt = findNearestDepositBuilding(world, eid, Faction.id[eid], resType, goalEid);
  if (alt === NO_ENTITY) return false;
  const px = Position.x[eid];
  const pz = Position.z[eid];
  if (Math.hypot(Position.x[alt] - px, Position.z[alt] - pz)
    > Math.hypot(Position.x[goalEid] - px, Position.z[goalEid] - pz) + JAM_REDIRECT_DEPOSIT_SLACK) return false;
  w.altDeposit = alt;
  issueMove(world, eid, Position.x[alt], Position.z[alt]);
  return true;
}

/** Stunned (component) or held by the Eindeloze Vergadering: disabled, not idle. */
function isDisabled(world: GameWorld, eid: number): boolean {
  return isVergaderingStunned(eid) || (hasComponent(world, eid, Stunned) && Stunned.duration[eid] > 0);
}

/**
 * A worker with a gather job whose UnitAI was left on Idle (Vergadering /
 * Stunned ended, or CombatSystem.clearAttackAndSeekNew without a previous
 * target) is gathering again: give it the gather UnitAI state back. On Idle,
 * SeparationSystem keeps pushing it while it walks, so it stops short of the
 * drop-off / node, and the HUD and animation show it as idle.
 */
function restoreGatherAIState(world: GameWorld, eid: number): void {
  if (!hasComponent(world, eid, UnitAI) || UnitAI.state[eid] !== UnitAIState.Idle) return;
  if (isDisabled(world, eid)) return;
  UnitAI.state[eid] = UnitAIState.MovingToResource;
}

/** Walkable point JAM_DETOUR_RADIUS from (x,z), searching around `angle`. */
function findDetourPoint(x: number, z: number, angle: number): { x: number; z: number } | null {
  const grid = getActiveNavGrid();
  for (let i = 0; i < 12; i++) {
    // 0, +30deg, -30deg, +60deg, ... around the preferred side.
    const off = Math.ceil(i / 2) * (Math.PI / 6) * (i % 2 === 1 ? 1 : -1);
    for (const r of [JAM_DETOUR_RADIUS, JAM_DETOUR_RADIUS + 1.5]) {
      const px = x + Math.cos(angle + off) * r;
      const pz = z + Math.sin(angle + off) * r;
      if (!grid || !grid.isBlockedAt(px, pz)) return { x: px, z: pz };
    }
  }
  return null;
}

/** Fresh move order: drop the old route so the planner starts from scratch. */
function issueMove(world: GameWorld, eid: number, x: number, z: number): void {
  clearUnitPath(eid);
  Movement.targetX[eid] = x;
  Movement.targetZ[eid] = z;
  Movement.hasTarget[eid] = 1;
  addComponent(world, eid, NeedsPathfinding);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startReturning(world: GameWorld, eid: number): void {
  Gatherer.state[eid] = GATHER_RETURNING;

  const factionId = Faction.id[eid];
  const resType = Gatherer.resourceType[eid];
  const depositEid = findNearestDepositBuilding(world, eid, factionId, resType);

  if (depositEid === NO_ENTITY) {
    Gatherer.state[eid] = GATHER_NONE;
    return;
  }

  Movement.targetX[eid] = Position.x[depositEid];
  Movement.targetZ[eid] = Position.z[depositEid];
  Movement.hasTarget[eid] = 1;
  addComponent(world, eid, NeedsPathfinding);
}

/** True when `bEid` is a live, completed drop-off of `factionId` for `resType`. */
function isValidDeposit(world: GameWorld, bEid: number, factionId: number, resType: number): boolean {
  if (!entityExists(world, bEid) || !hasComponent(world, bEid, IsBuilding) || hasComponent(world, bEid, IsDead)) return false;
  if (Faction.id[bEid] !== factionId || Building.complete[bEid] !== 1) return false;
  const t = Building.typeId[bEid];
  return t === BuildingTypeId.TownHall || (resType === ResourceType.Wood && t === BuildingTypeId.LumberCamp);
}

/**
 * Find the nearest deposit building for the given resource type.
 * For Gold: TownHall
 * For Wood: LumberCamp preferred, TownHall as fallback
 */
function findNearestDepositBuilding(
  world: GameWorld, eid: number, factionId: number, resType: number, exclude: number = NO_ENTITY,
): number {
  const buildings = query(world, [Position, Building, IsBuilding]);
  const px = Position.x[eid];
  const pz = Position.z[eid];
  let closestEid = NO_ENTITY;
  let closestDistSq = Infinity;

  // For wood: first try LumberCamp, then fall back to TownHall
  // For gold: only TownHall
  const primaryType = resType === ResourceType.Wood ? BuildingTypeId.LumberCamp : BuildingTypeId.TownHall;
  const fallbackType = BuildingTypeId.TownHall;

  // First pass: look for primary deposit type
  for (const bEid of buildings) {
    if (bEid === exclude) continue;
    if (Building.typeId[bEid] !== primaryType) continue;
    if (Faction.id[bEid] !== factionId) continue;
    if (Building.complete[bEid] !== 1) continue;
    if (hasComponent(world, bEid, IsDead)) continue;

    const dx = Position.x[bEid] - px;
    const dz = Position.z[bEid] - pz;
    const distSq = dx * dx + dz * dz;

    if (distSq < closestDistSq) {
      closestDistSq = distSq;
      closestEid = bEid;
    }
  }

  // If wood and no LumberCamp found, fall back to TownHall
  if (closestEid === NO_ENTITY && resType === ResourceType.Wood) {
    for (const bEid of buildings) {
      if (bEid === exclude) continue;
      if (Building.typeId[bEid] !== fallbackType) continue;
      if (Faction.id[bEid] !== factionId) continue;
      if (Building.complete[bEid] !== 1) continue;
      if (hasComponent(world, bEid, IsDead)) continue;

      const dx = Position.x[bEid] - px;
      const dz = Position.z[bEid] - pz;
      const distSq = dx * dx + dz * dz;

      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closestEid = bEid;
      }
    }
  }

  return closestEid;
}

/**
 * Find the nearest resource of the given type, or go idle.
 */
function findNearestResourceOrIdle(world: GameWorld, eid: number, resType: number): void {
  const closestEid = findNearestResource(world, eid, resType);

  if (closestEid !== NO_ENTITY) {
    // Found a resource -- go gather
    Gatherer.targetEid[eid] = closestEid;
    Gatherer.resourceType[eid] = resType;
    Gatherer.state[eid] = GATHER_MOVING_TO_RESOURCE;
    Movement.targetX[eid] = Position.x[closestEid];
    Movement.targetZ[eid] = Position.z[closestEid];
    Movement.hasTarget[eid] = 1;
    addComponent(world, eid, NeedsPathfinding);
  } else {
    // No resources left -- go idle
    Gatherer.state[eid] = GATHER_NONE;
    Gatherer.targetEid[eid] = NO_ENTITY;
    Movement.hasTarget[eid] = 0;
  }
}

/** Nearest live resource node of `resType` (optionally excluding one), or NO_ENTITY. */
function findNearestResource(world: GameWorld, eid: number, resType: number, exclude: number = NO_ENTITY): number {
  const resources = query(world, [Position, Resource, IsResource]);
  const px = Position.x[eid];
  const pz = Position.z[eid];
  let closestEid = NO_ENTITY;
  let closestDistSq = Infinity;

  for (const rEid of resources) {
    if (rEid === exclude) continue;
    if (Resource.amount[rEid] <= 0) continue;
    if (hasComponent(world, rEid, IsDead)) continue;
    if (Resource.type[rEid] !== resType) continue;

    const dx = Position.x[rEid] - px;
    const dz = Position.z[rEid] - pz;
    const distSq = dx * dx + dz * dz;

    if (distSq < closestDistSq) {
      closestDistSq = distSq;
      closestEid = rEid;
    }
  }

  return closestEid;
}
