// RED test for P0 Bug 3 — LumberCamp placement returns unstructured reason.
//
// Current state (v0.37.2): `validateBuildingPlacement` returns
// {valid: false, reason: 'Houtkamp moet binnen 20 eenheden van bomen staan'}
// when no wood is in range. The HUD cannot show the player WHERE the nearest
// wood is or HOW FAR it is, so the rule (src/systems/BuildSystem.ts:100-122)
// remains invisible UX — player keeps clicking until they guess right.
//
// These tests lock the post-fix contract: PlacementResult exposes a structured
// failure payload (code + details) so the HUD can render ghost-preview hints
// (highlight nearest tree, show distance, etc.) in a follow-up P1 fix.

import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Resource } from '../src/ecs/components';
import { IsResource } from '../src/ecs/tags';
import { validateBuildingPlacement } from '../src/systems/BuildSystem';
import {
  BuildingTypeId,
  FactionId,
  ResourceType,
} from '../src/types/index';

// Shape of the extended PlacementResult expected after fix. We assert via
// a local type so the test compiles against the current interface, then
// casts the actual return value.
interface ExpectedPlacementResult {
  valid: boolean;
  reason?: string;
  code?: string;
  details?: {
    nearestWoodEid?: number;
    nearestWoodDistance?: number;
    nearestWoodPosition?: { x: number; z: number };
    requiredMaxDistance?: number;
  };
}

const terrainStub = {
  getHeightAt: (_x: number, _z: number) => 1.0,
  isWater: (_x: number, _z: number) => false,
  isRiver: (_x: number, _z: number) => false,
};

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

describe('Bug 3 — LumberCamp placement exposes structured failure payload', () => {
  beforeEach(() => {
    replaceWorld();
  });

  it('reports nearest wood distance & position when placement is invalid', () => {
    const world = replaceWorld();
    const tree = spawnTree(world, 34, 0);

    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.LumberCamp,
      FactionId.Brabanders,
      0,
      0,
      terrainStub,
    ) as ExpectedPlacementResult;

    expect(result.valid).toBe(false);
    expect(result.code).toBe('LUMBERCAMP_TOO_FAR_FROM_WOOD');
    expect(result.details).toBeDefined();
    expect(result.details!.nearestWoodEid).toBe(tree);
    expect(result.details!.nearestWoodDistance).toBeCloseTo(34, 0);
    expect(result.details!.nearestWoodPosition).toEqual({ x: 34, z: 0 });
    expect(result.details!.requiredMaxDistance).toBe(20);
  });

  it('returns valid=true with no code/details when wood is in range', () => {
    const world = replaceWorld();
    spawnTree(world, 15, 0);

    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.LumberCamp,
      FactionId.Brabanders,
      0,
      0,
      terrainStub,
    ) as ExpectedPlacementResult;

    expect(result.valid).toBe(true);
    expect(result.code).toBeUndefined();
    expect(result.details).toBeUndefined();
  });

  it('picks the NEAREST wood by distance when multiple are out of range', () => {
    const world = replaceWorld();
    spawnTree(world, 50, 0);
    const closer = spawnTree(world, 25, 0);

    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.LumberCamp,
      FactionId.Brabanders,
      0,
      0,
      terrainStub,
    ) as ExpectedPlacementResult;

    expect(result.valid).toBe(false);
    expect(result.details?.nearestWoodEid).toBe(closer);
    expect(result.details?.nearestWoodDistance).toBeCloseTo(25, 0);
  });

  it('reports no nearest wood when ZERO trees exist on the map', () => {
    const world = replaceWorld();
    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.LumberCamp,
      FactionId.Brabanders,
      0,
      0,
      terrainStub,
    ) as ExpectedPlacementResult;

    expect(result.valid).toBe(false);
    expect(result.code).toBe('LUMBERCAMP_NO_WOOD_ON_MAP');
  });
});
