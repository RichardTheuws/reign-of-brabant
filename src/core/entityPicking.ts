import type * as THREE from 'three';
import { entityExists } from 'bitecs';
import { Position } from '../ecs/components';
import type { GameWorld } from '../ecs/world';

const CLICK_RADIUS = 5.0;

/**
 * Return the entity whose ECS Position is closest to world-space (x, z)
 * within CLICK_RADIUS, or null if no candidate is in range.
 *
 * Uses Position.x/z[eid] from the ECS world -- NOT mesh.position, which
 * can lag behind during frame interpolation and cause right-click
 * rally-targeting to miss resources.
 *
 * entityMeshMap is only used to enumerate picking candidates (rendered
 * entities); the Three.js transform itself is not consulted.
 */
export function findEntityAtPosition(
  world: GameWorld,
  entityMeshMap: Map<number, THREE.Object3D>,
  x: number,
  z: number,
): number | null {
  let closest: number | null = null;
  let closestDist = CLICK_RADIUS;

  for (const eid of entityMeshMap.keys()) {
    if (!entityExists(world, eid)) continue;
    const dx = Position.x[eid] - x;
    const dz = Position.z[eid] - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < closestDist) {
      closestDist = dist;
      closest = eid;
    }
  }

  return closest;
}
