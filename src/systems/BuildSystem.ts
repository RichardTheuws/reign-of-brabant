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

export interface PlacementFailureDetails {
  /** ECS entity id of the nearest wood resource, if any exists on the map. */
  nearestWoodEid?: number;
  /** Euclidean distance (world units) to the nearest wood resource. */
  nearestWoodDistance?: number;
  /** World-space position of the nearest wood resource. */
  nearestWoodPosition?: { x: number; z: number };
  /** The proximity threshold that was enforced (e.g. 20 units for LumberCamp). */
  requiredMaxDistance?: number;
}

export interface PlacementResult {
  valid: boolean;
  reason?: string;
  /** Stable machine-readable failure code so UI can localize / render hints. */
  code?: string;
  /** Structured context for UX (ghost preview, tooltips, distance hints). */
  details?: PlacementFailureDetails;
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
  terrain: {
    getHeightAt(x: number, z: number): number;
    isWater?(x: number, z: number): boolean;
    isRiver?(x: number, z: number): boolean;
  },
): PlacementResult {
  const onRiver = terrain.isRiver ? terrain.isRiver(x, z) : false;

  // --- Rule 2a: Bridge MUST be on a river tile (and skips the water rule). ---
  if (buildingTypeId === BuildingTypeId.Bridge) {
    if (!onRiver) {
      return { valid: false, reason: 'Bruggen kunnen alleen over een rivier gebouwd worden' };
    }
    // Bridges do not participate in the generic water/collision/enemy rules
    // below -- they are a river-exclusive structure.
    return { valid: true };
  }

  // --- Rule 2b: Other buildings cannot stand on water/rivers ---
  const onWater = terrain.isWater
    ? terrain.isWater(x, z)
    : terrain.getHeightAt(x, z) < 0.1;

  if (onWater || onRiver) {
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

    let nearestEid: number | undefined;
    let nearestDistSq = Infinity;

    for (const rEid of resources) {
      if (Resource.type[rEid] !== ResourceType.Wood) continue;
      const dx = x - Position.x[rEid];
      const dz = z - Position.z[rEid];
      const distSq = dx * dx + dz * dz;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearestEid = rEid;
      }
    }

    if (nearestEid === undefined) {
      return {
        valid: false,
        reason: 'Geen bomen op de kaart -- Houtkamp kan nergens staan',
        code: 'LUMBERCAMP_NO_WOOD_ON_MAP',
        details: { requiredMaxDistance: LUMBERCAMP_TREE_RANGE },
      };
    }

    if (nearestDistSq > treeRangeSq) {
      const dist = Math.sqrt(nearestDistSq);
      return {
        valid: false,
        reason: `Houtkamp moet binnen ${LUMBERCAMP_TREE_RANGE} eenheden van bomen staan (dichtste: ${dist.toFixed(0)})`,
        code: 'LUMBERCAMP_TOO_FAR_FROM_WOOD',
        details: {
          nearestWoodEid: nearestEid,
          nearestWoodDistance: dist,
          nearestWoodPosition: { x: Position.x[nearestEid], z: Position.z[nearestEid] },
          requiredMaxDistance: LUMBERCAMP_TREE_RANGE,
        },
      };
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
 * Format the construction-status string for a building card.
 *
 * Mirrors the training-units pattern (`Training X (12s)`) by appending a
 * `(Xs)` suffix to "Under construction" while progress < maxProgress. The
 * remaining time uses `Math.ceil` and is computed at 1 worker / no
 * bureaucracy modifier — same convention as `Production` queue.
 *
 * Returns `null` when the building is already complete (caller decides what
 * the idle/training status should be), so this helper has a single, clear
 * responsibility.
 */
export function formatConstructionStatus(
  progress: number,
  maxProgress: number,
  complete: number,
): string | null {
  if (complete === 1) return null;
  if (!(maxProgress > 0)) return 'Under construction';
  const remaining = Math.max(0, maxProgress - progress);
  if (remaining <= 0) return 'Under construction';
  return `Under construction (${Math.ceil(remaining)}s)`;
}

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
