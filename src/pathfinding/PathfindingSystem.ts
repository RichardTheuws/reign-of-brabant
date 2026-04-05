/**
 * PathfindingSystem -- ECS system that bridges Movement components and the
 * NavMeshManager crowd simulation.
 *
 * Responsibilities:
 * 1. When an entity gains Movement.hasTarget === 1, register it with the crowd
 *    and request a move to the target position.
 * 2. Each frame, sync the crowd agent's computed position back into the ECS
 *    Position component.
 * 3. Detect stuck agents (position unchanged for > 3 seconds) and reset their
 *    path to unstick them.
 * 4. When an entity dies or no longer needs movement, remove its crowd agent.
 */

import { NavMeshManager } from './NavMeshManager';
import { distance2D } from '../utils/math';

// ---------------------------------------------------------------------------
// ECS component arrays -- set externally via `configure()` before first update
// ---------------------------------------------------------------------------

interface ECSComponents {
  // Position
  positionX: Float32Array;
  positionY: Float32Array;
  positionZ: Float32Array;

  // Movement
  movementTargetX: Float32Array;
  movementTargetZ: Float32Array;
  movementHasTarget: Uint8Array;
  movementSpeed: Float32Array;

  // Faction (to know which entities belong to which player)
  factionId: Uint8Array;

  // Health (to detect dead entities)
  healthCurrent: Float32Array;

  // Rotation (face movement direction)
  rotationY: Float32Array;
}

let ecs: ECSComponents | null = null;

// ---------------------------------------------------------------------------
// Tracking state
// ---------------------------------------------------------------------------

/** Set of entity IDs currently registered as crowd agents. */
const registeredAgents = new Set<number>();

/** Stuck detection: last known position + timer per entity. */
interface StuckTracker {
  lastX: number;
  lastZ: number;
  stuckTime: number;
}

const stuckTrackers = new Map<number, StuckTracker>();

/** How long an agent can stay in the same position before we consider it stuck. */
const STUCK_THRESHOLD = 3.0; // seconds

/** Distance below which we consider an agent "not moving". */
const STUCK_DISTANCE_THRESHOLD = 0.3;

/** Distance below which we consider an agent as "arrived". */
const ARRIVAL_DISTANCE = 1.0;

/** Agent default radius (used when not specified elsewhere). */
const DEFAULT_AGENT_RADIUS = 0.5;

// ---------------------------------------------------------------------------
// Terrain height callback -- set externally
// ---------------------------------------------------------------------------

type HeightCallback = (x: number, z: number) => number;
let getTerrainHeight: HeightCallback = () => 0;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const PathfindingSystem = {
  /**
   * Provide ECS component arrays so the system can read/write entity data.
   * Must be called once before the first `update()`.
   */
  configure(
    components: ECSComponents,
    terrainHeightFn: HeightCallback,
  ): void {
    ecs = components;
    getTerrainHeight = terrainHeightFn;
  },

  /**
   * Main update -- call once per fixed-update tick.
   *
   * @param dt - Fixed delta time in seconds.
   * @param entityIds - Array (or iterable) of all living entity IDs that can
   *   move (units, not buildings/resources).
   */
  update(dt: number, entityIds: readonly number[]): void {
    if (!ecs) return;

    // ----- Phase 1: Register / deregister agents -----
    for (const eid of entityIds) {
      const hasTarget = ecs.movementHasTarget[eid] === 1;
      const isDead = ecs.healthCurrent[eid] <= 0;
      const isRegistered = registeredAgents.has(eid);

      if (isDead && isRegistered) {
        // Entity died -- remove from crowd
        NavMeshManager.removeAgent(eid);
        registeredAgents.delete(eid);
        stuckTrackers.delete(eid);
        continue;
      }

      if (isDead) continue;

      if (hasTarget && !isRegistered) {
        // New movement command -- register with crowd
        NavMeshManager.addAgent(
          eid,
          ecs.positionX[eid],
          ecs.positionZ[eid],
          DEFAULT_AGENT_RADIUS,
          ecs.movementSpeed[eid] || 3,
        );
        registeredAgents.add(eid);

        // Request the move
        NavMeshManager.requestMove(
          eid,
          ecs.movementTargetX[eid],
          ecs.movementTargetZ[eid],
        );

        // Init stuck tracker
        stuckTrackers.set(eid, {
          lastX: ecs.positionX[eid],
          lastZ: ecs.positionZ[eid],
          stuckTime: 0,
        });
      } else if (hasTarget && isRegistered) {
        // Check if target changed (new move command on already-registered agent)
        // We detect this by checking if the target differs from what we last set
        // For simplicity, always re-request (crowd handles dedup internally)
        NavMeshManager.requestMove(
          eid,
          ecs.movementTargetX[eid],
          ecs.movementTargetZ[eid],
        );
      }
    }

    // ----- Phase 2: Update crowd simulation -----
    NavMeshManager.update(dt);

    // ----- Phase 3: Sync positions back from crowd to ECS -----
    for (const eid of registeredAgents) {
      const pos = NavMeshManager.getAgentPosition(eid);
      if (!pos) continue;

      ecs.positionX[eid] = pos.x;
      ecs.positionZ[eid] = pos.z;
      // Y from terrain to keep units grounded
      ecs.positionY[eid] = getTerrainHeight(pos.x, pos.z);

      // Face movement direction
      const vel = NavMeshManager.getAgentVelocity(eid);
      if (vel) {
        const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        if (speed > 0.1) {
          ecs.rotationY[eid] = Math.atan2(vel.x, vel.z);
        }
      }
    }

    // ----- Phase 4: Arrival & stuck detection -----
    for (const eid of registeredAgents) {
      if (ecs.movementHasTarget[eid] !== 1) continue;

      const tx = ecs.movementTargetX[eid];
      const tz = ecs.movementTargetZ[eid];
      const dist = distance2D(ecs.positionX[eid], ecs.positionZ[eid], tx, tz);

      // Arrival check
      if (dist < ARRIVAL_DISTANCE) {
        ecs.movementHasTarget[eid] = 0;
        stuckTrackers.delete(eid);
        // Keep agent registered -- it may get new commands later.
        // Only remove when entity dies.
        continue;
      }

      // Stuck detection
      const tracker = stuckTrackers.get(eid);
      if (tracker) {
        const moved = distance2D(
          ecs.positionX[eid],
          ecs.positionZ[eid],
          tracker.lastX,
          tracker.lastZ,
        );

        if (moved < STUCK_DISTANCE_THRESHOLD) {
          tracker.stuckTime += dt;
        } else {
          tracker.stuckTime = 0;
          tracker.lastX = ecs.positionX[eid];
          tracker.lastZ = ecs.positionZ[eid];
        }

        if (tracker.stuckTime >= STUCK_THRESHOLD) {
          // Agent is stuck -- cancel movement
          console.warn(`[PathfindingSystem] Agent ${eid} stuck for ${STUCK_THRESHOLD}s, resetting path`);
          ecs.movementHasTarget[eid] = 0;
          NavMeshManager.cancelMove(eid);
          stuckTrackers.delete(eid);
        }
      }
    }

    // ----- Phase 5: Clean up agents that no longer have targets -----
    // (We keep agents registered to avoid add/remove churn, but we can
    //  clean up agents for entities that have been idle for a long time.
    //  For the PoC, this is not critical -- we only remove on death.)
  },

  /**
   * Force-register an entity as a crowd agent without a movement target.
   * Useful for pre-registering units that will receive commands later.
   */
  registerAgent(eid: number, x: number, z: number, speed: number): void {
    if (registeredAgents.has(eid)) return;

    NavMeshManager.addAgent(eid, x, z, DEFAULT_AGENT_RADIUS, speed);
    registeredAgents.add(eid);
  },

  /**
   * Force-deregister an entity's crowd agent.
   */
  deregisterAgent(eid: number): void {
    if (!registeredAgents.has(eid)) return;
    NavMeshManager.removeAgent(eid);
    registeredAgents.delete(eid);
    stuckTrackers.delete(eid);
  },

  /**
   * Check if an entity is currently registered as a crowd agent.
   */
  isRegistered(eid: number): boolean {
    return registeredAgents.has(eid);
  },

  /**
   * Dispose all tracking state. Call on game end / cleanup.
   */
  dispose(): void {
    for (const eid of registeredAgents) {
      NavMeshManager.removeAgent(eid);
    }
    registeredAgents.clear();
    stuckTrackers.clear();
    ecs = null;
  },
};
