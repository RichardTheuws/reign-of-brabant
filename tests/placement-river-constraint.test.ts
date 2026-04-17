// Test for P0 Bug 2 — Bridge placement must respect river tiles.
//
// Before the fix (v0.37.2): `validateBuildingPlacement` in BuildSystem.ts
// had no concept of rivers — its `terrain` param type didn't even include
// `isRiver`, so bridges/crossings could be placed on any non-water tile.
// `Terrain.isRiver(x,z)` existed (src/world/Terrain.ts:354-360) but was
// never wired in. This broke river-crossing map strategy entirely.
//
// After the fix (v0.37.5):
//   - `BuildingTypeId.Bridge = 11` added.
//   - terrain param accepts optional `isRiver(x,z)`.
//   - Bridge placement requires isRiver === true; other buildings reject
//     river tiles as well (rivers are non-buildable like water).

import { describe, it, expect, beforeEach } from 'vitest';
import { replaceWorld } from '../src/ecs/world';
import { validateBuildingPlacement } from '../src/systems/BuildSystem';
import { BuildingTypeId, FactionId } from '../src/types/index';

describe('Bug 2 — Bridge requires river tile', () => {
  beforeEach(() => {
    replaceWorld();
  });

  // Rivier zone: x in [20, 30], z in [-2, 2]. Alles daarbuiten is land.
  const terrainStub = {
    getHeightAt: (_x: number, _z: number) => 1.0,
    isWater: (_x: number, _z: number) => false,
    isRiver: (x: number, z: number) => x >= 20 && x <= 30 && z >= -2 && z <= 2,
  };

  it('rejects Bridge on land (not on river)', () => {
    const world = replaceWorld();
    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.Bridge,
      FactionId.Brabanders,
      50,
      0,
      terrainStub,
    );
    expect(result.valid).toBe(false);
    expect(result.reason ?? '').toMatch(/rivier/i);
  });

  it('accepts Bridge on river tile', () => {
    const world = replaceWorld();
    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.Bridge,
      FactionId.Brabanders,
      25,
      0,
      terrainStub,
    );
    expect(result.valid).toBe(true);
  });

  it('calls terrain.isRiver() during placement validation (regression guard)', () => {
    const world = replaceWorld();
    let called = false;
    const spy = {
      getHeightAt: terrainStub.getHeightAt,
      isWater: terrainStub.isWater,
      isRiver: (x: number, z: number) => {
        called = true;
        return terrainStub.isRiver(x, z);
      },
    };
    validateBuildingPlacement(
      world,
      BuildingTypeId.Bridge,
      FactionId.Brabanders,
      50,
      0,
      spy,
    );
    expect(called).toBe(true);
  });
});
