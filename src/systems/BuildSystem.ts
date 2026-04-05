/**
 * Reign of Brabant -- Build System
 *
 * Manages building construction.
 * Workers in range of an incomplete building increase its progress.
 * When progress reaches maxProgress, the building is marked complete.
 *
 * Build speed: 1.0 per second per worker (multiple workers stack).
 */

import { query, hasComponent } from 'bitecs';
import {
  Position,
  Building,
  Faction,
  UnitAI,
} from '../ecs/components';
import { IsBuilding, IsWorker, IsDead } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import { UnitAIState } from '../types/index';
import { onRandstadActionCompleted } from './BureaucracySystem';
import type { GameWorld } from '../ecs/world';

/** Distance within which a worker can contribute to construction. */
const BUILD_RANGE = 2.5;

/** Build progress per second per worker. */
const BUILD_SPEED = 1.0;

/**
 * Create the build system.
 */
export function createBuildSystem() {
  return function buildSystem(world: GameWorld, dt: number): void {
    const buildings = query(world, [Position, Building, IsBuilding]);

    for (const bEid of buildings) {
      // Skip already completed buildings
      if (Building.complete[bEid] === 1) continue;
      if (hasComponent(world, bEid, IsDead)) continue;

      const maxProgress = Building.maxProgress[bEid];
      if (maxProgress <= 0) continue;

      // Find workers in range of this building that belong to the same faction
      const factionId = Faction.id[bEid];
      const bx = Position.x[bEid];
      const bz = Position.z[bEid];
      const rangeSq = BUILD_RANGE * BUILD_RANGE;

      // Query all workers
      const workers = query(world, [Position, IsWorker]);
      let workerCount = 0;

      for (const wEid of workers) {
        if (Faction.id[wEid] !== factionId) continue;
        if (hasComponent(world, wEid, IsDead)) continue;

        // Check if worker is in "building" AI state or just nearby and idle
        // For PoC: any worker of same faction in range contributes
        const dx = Position.x[wEid] - bx;
        const dz = Position.z[wEid] - bz;
        const distSq = dx * dx + dz * dz;

        if (distSq <= rangeSq) {
          workerCount++;
        }
      }

      if (workerCount === 0) continue;

      // Apply build progress with Bureaucracy modifier for Randstad
      const bureaucracyMod = playerState.getBureaucracyModifier(factionId);
      const effectiveSpeed = BUILD_SPEED / bureaucracyMod;
      Building.progress[bEid] += effectiveSpeed * workerCount * dt;

      // Check completion
      if (Building.progress[bEid] >= maxProgress) {
        Building.progress[bEid] = maxProgress;
        Building.complete[bEid] = 1;

        // Notify Bureaucracy system of completed action
        onRandstadActionCompleted(factionId);

        // Emit building-complete event
        eventBus.emit('building-placed' as any, {
          entityId: bEid,
          factionId: factionId as any,
          buildingTypeId: Building.typeId[bEid],
          x: bx,
          z: bz,
        });
      }
    }
  };
}
