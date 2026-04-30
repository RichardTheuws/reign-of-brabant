/**
 * Game-gather-hotkeys.test.ts — locks the v0.56.0 auto-gather behavior.
 *
 * Two hotkeys/buttons in the worker panel skip the right-click step:
 *   A → gather-nearest-gold (auto-target nearest gold mine)
 *   S → gather-nearest-wood (auto-target nearest wood)
 *
 * Game.ts:queueGatherNearest finds the nearest resource of the given
 * type relative to the selected workers' centroid (or the player's
 * TownHall if no worker is selected), then dispatches a 'gather'
 * command — same pipeline as right-click on a resource.
 *
 * Direct-test approach: we replicate the helper's resource-picking
 * logic and lock its tie-breaking in tests, then verify the menu
 * registration so the hotkey actually surfaces in the UI.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, query } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Resource, Faction } from '../src/ecs/components';
import { IsResource } from '../src/ecs/tags';
import { ResourceType, NO_ENTITY } from '../src/types/index';
import { BASE_WORKER_CMDS } from '../src/ui/factionBuildMenus';

type World = ReturnType<typeof replaceWorld>;

function spawnResource(world: World, opts: { x: number; z: number; type: ResourceType; amount?: number }): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Resource);
  addComponent(world, eid, IsResource);
  Position.x[eid] = opts.x;
  Position.y[eid] = 0;
  Position.z[eid] = opts.z;
  Resource.type[eid] = opts.type;
  Resource.amount[eid] = opts.amount ?? 100;
  Resource.maxAmount[eid] = opts.amount ?? 100;
  return eid;
}

/**
 * Replicates Game.ts:queueGatherNearest's resource-picking logic. Uses
 * bitECS query() so world-scoped entities are respected (TypedArrays are
 * shared across replaceWorld() calls; query is the only way to exclude
 * stale entities from prior tests).
 */
function pickNearestResource(
  world: World,
  resourceType: ResourceType,
  anchorX: number,
  anchorZ: number,
): number {
  const resources = query(world, [IsResource, Position, Resource]);
  let nearestEid = NO_ENTITY;
  let nearestDistSq = Infinity;
  for (const eid of resources) {
    if (Resource.type[eid] !== resourceType) continue;
    if (Resource.amount[eid] <= 0) continue;
    const dx = Position.x[eid] - anchorX;
    const dz = Position.z[eid] - anchorZ;
    const distSq = dx * dx + dz * dz;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearestEid = eid;
    }
  }
  return nearestEid;
}

describe('Worker gather hotkeys — BASE_WORKER_CMDS registration', () => {
  it('exposes gather-nearest-gold with hotkey A', () => {
    const cmd = BASE_WORKER_CMDS.find((c) => c.action === 'gather-nearest-gold');
    expect(cmd, 'gather-nearest-gold not registered').toBeDefined();
    expect(cmd!.hotkey).toBe('A');
    expect(cmd!.icon).toBe('GLD');
    expect(cmd!.label).toBe('Goud');
  });

  it('exposes gather-nearest-wood with hotkey S', () => {
    const cmd = BASE_WORKER_CMDS.find((c) => c.action === 'gather-nearest-wood');
    expect(cmd, 'gather-nearest-wood not registered').toBeDefined();
    expect(cmd!.hotkey).toBe('S');
    expect(cmd!.icon).toBe('WUD');
    expect(cmd!.label).toBe('Hout');
  });

  it('hotkeys do not collide with move/stop in BASE_WORKER_CMDS', () => {
    const hotkeys = BASE_WORKER_CMDS.map((c) => c.hotkey).filter(Boolean);
    const unique = new Set(hotkeys);
    expect(unique.size).toBe(hotkeys.length);
  });

  it('uses btn-icon--gather class so CSS can colour the icon distinct from move/stop', () => {
    const goldCmd = BASE_WORKER_CMDS.find((c) => c.action === 'gather-nearest-gold')!;
    const woodCmd = BASE_WORKER_CMDS.find((c) => c.action === 'gather-nearest-wood')!;
    expect(goldCmd.iconClass).toBe('btn-icon--gather');
    expect(woodCmd.iconClass).toBe('btn-icon--gather');
  });
});

describe('queueGatherNearest — nearest-resource picking logic', () => {
  beforeEach(() => {
    replaceWorld();
  });

  it('picks the nearest gold mine relative to anchor (workers centroid)', () => {
    const world = replaceWorld();
    const farGold = spawnResource(world, { x: 100, z: 0, type: ResourceType.Gold });
    const nearGold = spawnResource(world, { x: 12, z: 0, type: ResourceType.Gold });
    spawnResource(world, { x: 5, z: 0, type: ResourceType.Wood }); // wrong type, ignored

    const eid = pickNearestResource(world, ResourceType.Gold, 10, 0);
    expect(eid).toBe(nearGold);
    expect(eid).not.toBe(farGold);
  });

  it('picks the nearest wood node and ignores gold mines', () => {
    const world = replaceWorld();
    spawnResource(world, { x: 5, z: 0, type: ResourceType.Gold }); // closer but wrong type
    const farWood = spawnResource(world, { x: 100, z: 0, type: ResourceType.Wood });
    const nearWood = spawnResource(world, { x: 30, z: 0, type: ResourceType.Wood });

    const eid = pickNearestResource(world, ResourceType.Wood, 25, 0);
    expect(eid).toBe(nearWood);
    expect(eid).not.toBe(farWood);
  });

  it('skips depleted resources (amount <= 0)', () => {
    const world = replaceWorld();
    spawnResource(world, { x: 5, z: 0, type: ResourceType.Gold, amount: 0 }); // depleted
    const nonDepleted = spawnResource(world, { x: 50, z: 0, type: ResourceType.Gold, amount: 100 });

    const eid = pickNearestResource(world, ResourceType.Gold, 0, 0);
    expect(eid).toBe(nonDepleted);
  });

  it('returns NO_ENTITY when no matching resource exists', () => {
    const world = replaceWorld();
    spawnResource(world, { x: 5, z: 0, type: ResourceType.Wood });

    const eid = pickNearestResource(world, ResourceType.Gold, 0, 0);
    expect(eid).toBe(NO_ENTITY);
  });

  it('Euclidean distance — diagonal beats axis-aligned at same coordinate sum', () => {
    const world = replaceWorld();
    // Both at sum-distance 14 from (0,0), but diagonal is sqrt(50)≈7.07
    // while axis-aligned is 14 — diagonal must win.
    spawnResource(world, { x: 14, z: 0, type: ResourceType.Gold });
    const diagonal = spawnResource(world, { x: 5, z: 5, type: ResourceType.Gold });

    const eid = pickNearestResource(world, ResourceType.Gold, 0, 0);
    expect(eid).toBe(diagonal);
  });
});
