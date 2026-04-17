// Entity picking helper — extracted from Game.ts so it can be unit-tested.
//
// STATE (v0.37.2): body currently uses mesh.position for distance calc, which
// drifts from ECS truth during animation/interpolation. P0 Bug 1 fix will
// replace the body to read Position.x/z[eid] from the ECS world. Tests in
// tests/rally-point-resource.test.ts lock the post-fix contract.

import type * as THREE from 'three';
import type { GameWorld } from '../ecs/world';

const CLICK_RADIUS = 5.0;

/**
 * Return the entity whose position is closest to (x, z) within CLICK_RADIUS,
 * or null if no entity is in range.
 *
 * The entityMeshMap parameter is accepted for API compatibility; the post-fix
 * implementation will primarily consult the ECS Position component of each
 * entity in the map rather than the Three.js mesh transform.
 */
export function findEntityAtPosition(
  _world: GameWorld,
  entityMeshMap: Map<number, THREE.Object3D>,
  x: number,
  z: number,
): number | null {
  let closest: number | null = null;
  let closestDist = CLICK_RADIUS;

  for (const [eid, mesh] of entityMeshMap) {
    const dx = mesh.position.x - x;
    const dz = mesh.position.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < closestDist) {
      closestDist = dist;
      closest = eid;
    }
  }

  return closest;
}
