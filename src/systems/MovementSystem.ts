/**
 * Reign of Brabant -- Movement System
 *
 * Moves entities with Position + Movement toward their target.
 * Snaps Y to terrain height. Clears hasTarget on arrival.
 */

import { query, hasComponent } from 'bitecs';
import { Position, Movement, Rotation, GezeligheidBonus, Stunned, Faction } from '../ecs/components';
import { IsUnit, IsWorker } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import { UPKEEP_DEBT_EFFECTIVENESS, ROAD_SPEED_BONUS } from '../types/index';
import { getDeadlineCrunchSpeedMult } from './HavermoutmelkSystem';
import type { Terrain } from '../world/Terrain';
import type { GameWorld } from '../ecs/world';

// Reusable scratch values to avoid per-frame allocations
let _dx = 0;
let _dz = 0;
let _dist = 0;
let _invDist = 0;

/** Distance threshold to consider "arrived" at target. */
const ARRIVAL_THRESHOLD = 0.5;

/**
 * Create the movement system bound to a terrain instance.
 * Returns a system function that can be called each frame.
 */
export function createMovementSystem(terrain: Terrain) {
  return function movementSystem(world: GameWorld, dt: number): void {
    const entities = query(world, [Position, Movement, IsUnit]);

    for (const eid of entities) {
      // Skip entities not actively moving
      if (Movement.hasTarget[eid] === 0) continue;

      // Skip stunned entities
      if (hasComponent(world, eid, Stunned) && Stunned.duration[eid] > 0) continue;

      // Direction to target
      _dx = Movement.targetX[eid] - Position.x[eid];
      _dz = Movement.targetZ[eid] - Position.z[eid];
      _dist = Math.sqrt(_dx * _dx + _dz * _dz);

      // Check arrival
      if (_dist < ARRIVAL_THRESHOLD) {
        Movement.hasTarget[eid] = 0;
        continue;
      }

      // Normalize direction and scale by speed * dt (with Gezelligheid bonus + road bonus + upkeep debt)
      _invDist = 1 / Math.max(_dist, 0.001);
      let effectiveSpeed = Movement.speed[eid] * (GezeligheidBonus.speedMult[eid] || 1.0);

      // Road speed bonus: units on roads move faster
      if (terrain.isOnRoad(Position.x[eid], Position.z[eid])) {
        effectiveSpeed *= ROAD_SPEED_BONUS;
      }

      // Upkeep debt: reduce movement speed
      if (playerState.isInUpkeepDebt(Faction.id[eid])) {
        effectiveSpeed *= UPKEEP_DEBT_EFFECTIVENESS;
      }

      // Deadline Crunch (Randstad Havermoutmelkbar click-action) — workers only.
      if (hasComponent(world, eid, IsWorker)) {
        effectiveSpeed *= getDeadlineCrunchSpeedMult(Faction.id[eid]);
      }
      const stepX = _dx * _invDist * effectiveSpeed * dt;
      const stepZ = _dz * _invDist * effectiveSpeed * dt;

      // Clamp step to not overshoot target
      const stepMag = Math.sqrt(stepX * stepX + stepZ * stepZ);
      if (stepMag >= _dist) {
        // Snap to target
        Position.x[eid] = Movement.targetX[eid];
        Position.z[eid] = Movement.targetZ[eid];
        Movement.hasTarget[eid] = 0;
      } else {
        Position.x[eid] += stepX;
        Position.z[eid] += stepZ;
      }

      // Smooth Y to terrain height (lerp to avoid vertical jitter on micro-bumps)
      const targetY = terrain.getHeightAt(Position.x[eid], Position.z[eid]);
      Position.y[eid] += (targetY - Position.y[eid]) * Math.min(dt * 12, 1);

      // Face movement direction
      Rotation.y[eid] = Math.atan2(_dx, _dz);
    }
  };
}
