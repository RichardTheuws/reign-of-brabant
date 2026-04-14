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
  Resource,
} from '../ecs/components';
import { IsBuilding, IsWorker, IsDead, IsResource } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import { FactionId, BuildingTypeId, ResourceType } from '../types/index';
import { onRandstadActionCompleted } from './BureaucracySystem';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Placement Validation
// ---------------------------------------------------------------------------

/** Building footprint size (all buildings use the same bounding box). */
const BUILDING_FOOTPRINT = 4;

/** Minimum distance from enemy buildings. */
const MIN_ENEMY_DISTANCE = 8;

/** Maximum distance from a tree resource for LumberCamp placement. */
const LUMBERCAMP_TREE_RANGE = 20;

export interface PlacementResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate whether a building can be placed at the given position.
 * Called by Game.ts before spawning a new building entity.
 *
 * Rules:
 * 1. No overlap with existing buildings (4x4 footprint collision)
 * 2. Not on water terrain
 * 3. Minimum 8 units from enemy buildings
 * 4. LumberCamp must be within 20 units of a tree resource
 */
export function validateBuildingPlacement(
  world: GameWorld,
  buildingTypeId: BuildingTypeId,
  factionId: number,
  x: number,
  z: number,
  terrain: { getHeightAt(x: number, z: number): number; isWater?(x: number, z: number): boolean },
): PlacementResult {
  // --- Rule 2: Terrain check (water) ---
  const onWater = terrain.isWater
    ? terrain.isWater(x, z)
    : terrain.getHeightAt(x, z) < 0.1;

  if (onWater) {
    return { valid: false, reason: 'Kan niet bouwen op water' };
  }

  // --- Rule 1 & 3: Check existing buildings ---
  const buildings = query(world, [Position, Building, IsBuilding]);

  for (const bEid of buildings) {
    // Skip dead buildings
    if (hasComponent(world, bEid, IsDead)) continue;

    const bx = Position.x[bEid];
    const bz = Position.z[bEid];

    // Axis-aligned bounding box overlap check (4x4 footprint)
    const overlapX = Math.abs(x - bx) < BUILDING_FOOTPRINT;
    const overlapZ = Math.abs(z - bz) < BUILDING_FOOTPRINT;

    if (overlapX && overlapZ) {
      return { valid: false, reason: 'Overlapt met een bestaand gebouw' };
    }

    // Rule 3: Minimum distance from enemy buildings
    if (Faction.id[bEid] !== factionId) {
      const dx = x - bx;
      const dz = z - bz;
      const distSq = dx * dx + dz * dz;

      if (distSq < MIN_ENEMY_DISTANCE * MIN_ENEMY_DISTANCE) {
        return { valid: false, reason: 'Te dicht bij een vijandelijk gebouw' };
      }
    }
  }

  // --- Rule 4: LumberCamp must be near a tree resource ---
  if (buildingTypeId === BuildingTypeId.LumberCamp) {
    const resources = query(world, [Position, Resource, IsResource]);
    const treeRangeSq = LUMBERCAMP_TREE_RANGE * LUMBERCAMP_TREE_RANGE;
    let hasNearbyTree = false;

    for (const rEid of resources) {
      if (Resource.type[rEid] !== ResourceType.Wood) continue;

      const dx = x - Position.x[rEid];
      const dz = z - Position.z[rEid];
      const distSq = dx * dx + dz * dz;

      if (distSq <= treeRangeSq) {
        hasNearbyTree = true;
        break;
      }
    }

    if (!hasNearbyTree) {
      return { valid: false, reason: 'Houtkamp moet binnen 20 eenheden van bomen staan' };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Build System (construction progress)
// ---------------------------------------------------------------------------

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
        eventBus.emit('building-placed', {
          entityId: bEid,
          factionId: factionId as FactionId,
          buildingTypeId: Building.typeId[bEid] as BuildingTypeId,
          x: bx,
          z: bz,
        });
      }
    }
  };
}
