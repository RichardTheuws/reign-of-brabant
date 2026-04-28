/**
 * Reign of Brabant -- Bureaucracy System
 *
 * Implements the Randstad faction's unique Bureaucracy mechanic:
 *
 * 1. **Efficiency Stacks**: Each completed action (unit trained, building built)
 *    grants +1 efficiency stack. Stacks permanently reduce action duration.
 *    Formula: baseDuration * (1.2 - stacks * 0.03)
 *      - 0 stacks: 1.2x (20% slower)
 *      - 7 stacks: 0.99x (roughly normal)
 *      - 20 stacks: 0.6x (40% faster!)
 *
 * 2. **Werkoverleg**: Every 5 minutes of game time, ALL Randstad production
 *    buildings pause for 8 seconds. Visual: "coffee" icon above buildings.
 *    This is the Achilles' heel -- attacking during werkoverleg = max impact.
 *
 * 3. **Eindeloze Vergadering**: Ability (AI-only for v0.1) that stuns all
 *    enemy units in radius 15 for 10 seconds, followed by a "Meeting Fatigue"
 *    debuff (-20% stats for 15 seconds). Available after 4 minutes, 240s cooldown.
 */

import { query, hasComponent } from 'bitecs';
import {
  Position,
  Building,
  Production,
  Faction,
  Attack,
  Movement,
  UnitAI,
} from '../ecs/components';
import { IsBuilding, IsUnit, IsDead } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import {
  FactionId,
  UnitAIState,
  NO_PRODUCTION,
  WERKOVERLEG_INTERVAL,
  WERKOVERLEG_DURATION,
  VERGADERING_RADIUS,
  VERGADERING_STUN_DURATION,
  MEETING_FATIGUE_DURATION,
  MEETING_FATIGUE_REDUCTION,
  VERGADERING_COOLDOWN,
  VERGADERING_INITIAL_DELAY,
} from '../types/index';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** Timer tracking werkoverleg cycle (resets every WERKOVERLEG_INTERVAL). */
let werkoverlegTimer = 0;

/** Whether werkoverleg is currently active (buildings paused). */
let werkoverlegActive = false;

/** Remaining duration of current werkoverleg pause. */
let werkoverlegRemaining = 0;

/** Saved production state for buildings during werkoverleg. */
const pausedProduction = new Map<number, { unitType: number; progress: number; duration: number }>();

// -- Eindeloze Vergadering state --

/** Cooldown timer for Eindeloze Vergadering (counts down). */
let vergaderingCooldown = VERGADERING_INITIAL_DELAY;

/** Whether vergadering stun is currently active. */
let vergaderingStunActive = false;

/** Remaining stun duration. */
let vergaderingStunRemaining = 0;

/** Whether meeting fatigue debuff is active. */
let meetingFatigueActive = false;

/** Remaining fatigue duration. */
let meetingFatigueRemaining = 0;

/** Entity IDs affected by vergadering stun. */
const stunnedUnits = new Set<number>();

/** Entity IDs affected by meeting fatigue, with their original stats. */
const fatiguedUnits = new Map<number, { attack: number; speed: number }>();

// ---------------------------------------------------------------------------
// Boardroom — CEO Kwartaalcijfers ability (Randstad FactionSpecial1)
// ---------------------------------------------------------------------------

/** Per-faction-instance buff (singleton — only one Boardroom buff active at a time). */
export const boardroomBuff = { active: false, remaining: 0, cooldown: 0 };

const BOARDROOM_DURATION = 30;
const BOARDROOM_COOLDOWN = 120;
/** Production duration multiplier when Boardroom buff is active (0.667 = +50% speed). */
export const BOARDROOM_PRODUCTION_MULT = 0.667;

/** Activate the Boardroom buff if cooldown has elapsed. Returns true on success. */
export function activateBoardroom(): boolean {
  if (boardroomBuff.active || boardroomBuff.cooldown > 0) return false;
  boardroomBuff.active = true;
  boardroomBuff.remaining = BOARDROOM_DURATION;
  boardroomBuff.cooldown = BOARDROOM_COOLDOWN;
  return true;
}

export function isBoardroomReady(): boolean {
  return !boardroomBuff.active && boardroomBuff.cooldown <= 0;
}

export function getBoardroomState() {
  return { active: boardroomBuff.active, remaining: boardroomBuff.remaining, cooldown: boardroomBuff.cooldown };
}

function tickBoardroom(dt: number): void {
  if (boardroomBuff.active) {
    boardroomBuff.remaining -= dt;
    if (boardroomBuff.remaining <= 0) {
      boardroomBuff.active = false;
      boardroomBuff.remaining = 0;
    }
  }
  if (boardroomBuff.cooldown > 0) {
    boardroomBuff.cooldown -= dt;
    if (boardroomBuff.cooldown < 0) boardroomBuff.cooldown = 0;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create the Bureaucracy System.
 *
 * Should run early in the economy phase, BEFORE ProductionSystem and BuildSystem,
 * so those systems can read the werkoverleg pause state.
 */
export function createBureaucracySystem() {
  return function bureaucracySystem(world: GameWorld, dt: number): void {
    const elapsed = world.meta.elapsed;

    // -- Boardroom buff timer (Randstad FactionSpecial1 ability) --
    tickBoardroom(dt);

    // -- Werkoverleg cycle --
    updateWerkoverleg(world, dt);

    // -- Eindeloze Vergadering --
    updateVergadering(world, dt, elapsed);

    // -- Meeting Fatigue --
    updateMeetingFatigue(world, dt);

    // -- Vergadering cooldown --
    if (vergaderingCooldown > 0) {
      vergaderingCooldown -= dt;
    }
  };
}

// ---------------------------------------------------------------------------
// Werkoverleg
// ---------------------------------------------------------------------------

function updateWerkoverleg(world: GameWorld, dt: number): void {
  if (werkoverlegActive) {
    werkoverlegRemaining -= dt;
    if (werkoverlegRemaining <= 0) {
      endWerkoverleg(world);
    }
    return;
  }

  werkoverlegTimer += dt;

  if (werkoverlegTimer >= WERKOVERLEG_INTERVAL) {
    werkoverlegTimer -= WERKOVERLEG_INTERVAL;
    startWerkoverleg(world);
  }
}

function startWerkoverleg(world: GameWorld): void {
  werkoverlegActive = true;
  werkoverlegRemaining = WERKOVERLEG_DURATION;
  pausedProduction.clear();

  const buildings = query(world, [Building, Production, IsBuilding]);
  const affectedEids: number[] = [];

  for (const bEid of buildings) {
    if (Faction.id[bEid] !== FactionId.Randstad) continue;
    if (Building.complete[bEid] !== 1) continue;
    if (hasComponent(world, bEid, IsDead)) continue;

    // Only pause buildings that are actively producing
    if (Production.unitType[bEid] !== NO_PRODUCTION) {
      pausedProduction.set(bEid, {
        unitType: Production.unitType[bEid],
        progress: Production.progress[bEid],
        duration: Production.duration[bEid],
      });
      // Freeze production by setting duration to a huge value
      // ProductionSystem divides dt by duration, so this effectively pauses it
      Production.duration[bEid] = 999999;
    }
    affectedEids.push(bEid);
  }

  eventBus.emit('werkoverleg', {
    factionId: FactionId.Randstad,
    active: true,
    buildingEids: affectedEids,
  });
}

function endWerkoverleg(world: GameWorld): void {
  werkoverlegActive = false;

  // Restore paused production
  for (const [bEid, saved] of pausedProduction) {
    if (!hasComponent(world, bEid, IsBuilding)) continue;
    if (hasComponent(world, bEid, IsDead)) continue;

    Production.unitType[bEid] = saved.unitType;
    Production.progress[bEid] = saved.progress;
    Production.duration[bEid] = saved.duration;
  }
  pausedProduction.clear();

  // Collect affected building eids for event
  const buildings = query(world, [Building, IsBuilding]);
  const affectedEids: number[] = [];
  for (const bEid of buildings) {
    if (Faction.id[bEid] !== FactionId.Randstad) continue;
    if (Building.complete[bEid] !== 1) continue;
    affectedEids.push(bEid);
  }

  eventBus.emit('werkoverleg', {
    factionId: FactionId.Randstad,
    active: false,
    buildingEids: affectedEids,
  });
}

// ---------------------------------------------------------------------------
// Eindeloze Vergadering
// ---------------------------------------------------------------------------

/**
 * Attempt to use the Eindeloze Vergadering ability.
 * Called by AIController when it decides to use the ability.
 *
 * @returns true if the ability was successfully activated
 */
export function activateVergadering(
  world: GameWorld,
  targetX: number,
  targetZ: number,
): boolean {
  if (vergaderingCooldown > 0) return false;
  if (vergaderingStunActive) return false;

  // Find all enemy units in radius
  const units = query(world, [Position, IsUnit]);
  const radiusSq = VERGADERING_RADIUS * VERGADERING_RADIUS;
  const affected: number[] = [];

  for (const eid of units) {
    if (Faction.id[eid] === FactionId.Randstad) continue;
    if (hasComponent(world, eid, IsDead)) continue;

    const dx = Position.x[eid] - targetX;
    const dz = Position.z[eid] - targetZ;
    const distSq = dx * dx + dz * dz;

    if (distSq <= radiusSq) {
      affected.push(eid);
      stunnedUnits.add(eid);

      // Stun: stop movement and set to Idle
      Movement.hasTarget[eid] = 0;
      UnitAI.state[eid] = UnitAIState.Idle;
    }
  }

  if (affected.length === 0) return false;

  vergaderingStunActive = true;
  vergaderingStunRemaining = VERGADERING_STUN_DURATION;
  vergaderingCooldown = VERGADERING_COOLDOWN;

  eventBus.emit('vergadering', {
    factionId: FactionId.Randstad,
    x: targetX,
    z: targetZ,
    affectedUnits: affected,
  });

  return true;
}

function updateVergadering(world: GameWorld, dt: number, _elapsed: number): void {
  if (!vergaderingStunActive) return;

  vergaderingStunRemaining -= dt;

  // Keep stunned units idle
  for (const eid of stunnedUnits) {
    if (!hasComponent(world, eid, IsUnit)) {
      stunnedUnits.delete(eid);
      continue;
    }
    if (hasComponent(world, eid, IsDead)) {
      stunnedUnits.delete(eid);
      continue;
    }
    Movement.hasTarget[eid] = 0;
    UnitAI.state[eid] = UnitAIState.Idle;
  }

  if (vergaderingStunRemaining <= 0) {
    // Stun ended -- apply Meeting Fatigue debuff
    vergaderingStunActive = false;
    applyMeetingFatigue(world);
    stunnedUnits.clear();
  }
}

// ---------------------------------------------------------------------------
// Meeting Fatigue
// ---------------------------------------------------------------------------

function applyMeetingFatigue(world: GameWorld): void {
  meetingFatigueActive = true;
  meetingFatigueRemaining = MEETING_FATIGUE_DURATION;
  fatiguedUnits.clear();

  for (const eid of stunnedUnits) {
    if (!hasComponent(world, eid, IsUnit)) continue;
    if (hasComponent(world, eid, IsDead)) continue;

    // Save original stats
    fatiguedUnits.set(eid, {
      attack: Attack.damage[eid],
      speed: Movement.speed[eid],
    });

    // Apply -20% to all stats
    Attack.damage[eid] *= (1 - MEETING_FATIGUE_REDUCTION);
    Movement.speed[eid] *= (1 - MEETING_FATIGUE_REDUCTION);
  }
}

function updateMeetingFatigue(world: GameWorld, dt: number): void {
  if (!meetingFatigueActive) return;

  meetingFatigueRemaining -= dt;

  if (meetingFatigueRemaining <= 0) {
    // Restore original stats
    for (const [eid, original] of fatiguedUnits) {
      if (!hasComponent(world, eid, IsUnit)) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      Attack.damage[eid] = original.attack;
      Movement.speed[eid] = original.speed;
    }
    fatiguedUnits.clear();
    meetingFatigueActive = false;
  }
}

// ---------------------------------------------------------------------------
// Efficiency Stack Tracking (called by ProductionSystem and BuildSystem)
// ---------------------------------------------------------------------------

/**
 * Notify the bureaucracy system that a Randstad action completed.
 * Adds an efficiency stack and emits an event.
 */
export function onRandstadActionCompleted(factionId: number): void {
  if (factionId !== FactionId.Randstad) return;

  const stacks = playerState.addEfficiencyStack(factionId);
  eventBus.emit('efficiency-stack', { factionId: factionId as FactionId, stacks });
}

// ---------------------------------------------------------------------------
// Query helpers (for AI and other systems)
// ---------------------------------------------------------------------------

/** Whether werkoverleg is currently active. */
export function isWerkoverlegActive(): boolean {
  return werkoverlegActive;
}

/** Whether Eindeloze Vergadering is available (off cooldown). */
export function isVergaderingReady(): boolean {
  return vergaderingCooldown <= 0 && !vergaderingStunActive;
}

/** Get current vergadering cooldown remaining (0 = ready). */
export function getVergaderingCooldown(): number {
  return Math.max(0, vergaderingCooldown);
}

/** Get current efficiency stacks for the Randstad faction. */
export function getRandstadEfficiencyStacks(): number {
  return playerState.getEfficiencyStacks(FactionId.Randstad);
}

/**
 * Reset all bureaucracy system state (for new game).
 */
export function resetBureaucracy(): void {
  werkoverlegTimer = 0;
  werkoverlegActive = false;
  werkoverlegRemaining = 0;
  pausedProduction.clear();
  vergaderingCooldown = VERGADERING_INITIAL_DELAY;
  vergaderingStunActive = false;
  vergaderingStunRemaining = 0;
  meetingFatigueActive = false;
  meetingFatigueRemaining = 0;
  stunnedUnits.clear();
  fatiguedUnits.clear();
  boardroomBuff.active = false;
  boardroomBuff.remaining = 0;
  boardroomBuff.cooldown = 0;
}
