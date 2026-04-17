// RED test for P0 Bug 1 — rally-point fails when targeting a resource.
//
// Current state (v0.37.2): Game.ts:2212 `findEntityAtPosition` reads
// mesh.position.{x,z} from entityMeshMap. During animation / frame
// interpolation the mesh transform drifts from the ECS Position component,
// so right-clicking on a resource's true ECS position can miss the entity
// and rally-point setup falls back to "no resource target".
//
// Post-fix contract: the function must consult Position.x/z[eid] from the
// ECS world, not mesh.position. The mesh map is only used to enumerate
// known entities.

import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Resource } from '../src/ecs/components';
import { IsResource } from '../src/ecs/tags';
import { ResourceType } from '../src/types/index';
import { findEntityAtPosition } from '../src/core/entityPicking';

function spawnTree(world: ReturnType<typeof replaceWorld>, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Resource);
  addComponent(world, eid, IsResource);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Resource.type[eid] = ResourceType.Wood;
  Resource.amount[eid] = 100;
  Resource.maxAmount[eid] = 100;
  return eid;
}

function stubMesh(x: number, z: number): THREE.Object3D {
  const obj = new THREE.Object3D();
  obj.position.set(x, 0, z);
  return obj;
}

describe('Bug 1 — findEntityAtPosition reads ECS Position, not mesh.position', () => {
  beforeEach(() => {
    replaceWorld();
  });

  it('finds the resource at its ECS Position even when the mesh has drifted', () => {
    const world = replaceWorld();
    const tree = spawnTree(world, 10, 0);

    // Mesh lags 5 units behind ECS truth (e.g. interpolation not yet flushed).
    const meshMap = new Map<number, THREE.Object3D>([[tree, stubMesh(15, 0)]]);

    // Player clicks on the ECS-truth position (10, 0).
    const hit = findEntityAtPosition(world, meshMap, 10, 0);
    expect(hit).toBe(tree);
  });

  it('returns null when no entity ECS-position is within the click radius', () => {
    const world = replaceWorld();
    const tree = spawnTree(world, 100, 100);
    const meshMap = new Map<number, THREE.Object3D>([[tree, stubMesh(0, 0)]]);

    // Click far from the tree's ECS position. Even though the mesh sits at
    // the origin, the ECS position is what should drive the hit-test.
    const hit = findEntityAtPosition(world, meshMap, 0, 0);
    expect(hit).toBeNull();
  });

  it('prefers the entity whose ECS Position is closest (ignores mesh lie)', () => {
    const world = replaceWorld();
    const close = spawnTree(world, 2, 0);
    const far = spawnTree(world, 4, 0);

    // Deliberately mislead mesh: "far" mesh is near origin, "close" mesh is
    // far away. A correct impl prefers `close` because its ECS position
    // is closer to the click.
    const meshMap = new Map<number, THREE.Object3D>([
      [close, stubMesh(20, 0)],
      [far, stubMesh(0.1, 0)],
    ]);

    const hit = findEntityAtPosition(world, meshMap, 0, 0);
    expect(hit).toBe(close);
  });
});
