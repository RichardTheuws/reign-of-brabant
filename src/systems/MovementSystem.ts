/**
 * Reign of Brabant -- Movement System
 *
 * Moves entities with Position + Movement toward their target.
 * Snaps Y to terrain height. Clears hasTarget on arrival.
 */

import { query, hasComponent } from 'bitecs';
import { Position, Movement, Rotation, GezeligheidBonus, Stunned } from '../ecs/components';
import { IsUnit } from '../ecs/tags';
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

      // Normalize direction and scale by speed * dt (with Gezelligheid bonus)
      _invDist = 1 / Math.max(_dist, 0.001);
      const effectiveSpeed = Movement.speed[eid] * (GezeligheidBonus.speedMult[eid] || 1.0);
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

      // Snap Y to terrain height
      Position.y[eid] = terrain.getHeightAt(Position.x[eid], Position.z[eid]);

      // Face movement direction
      Rotation.y[eid] = Math.atan2(_dx, _dz);
    }
  };
}
