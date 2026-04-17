// RED test for P0 Bug 2 — Bridge/DefenseTower placement ignores river-tile rule.
//
// Current state (v0.37.2): `validateBuildingPlacement` in
// src/systems/BuildSystem.ts accepts a DefenseTower on any non-water land tile.
// The terrain API exposes `isRiver(x,z)` (src/world/Terrain.ts:354-360), but
// `validateBuildingPlacement` never calls it, and its `terrain` param type does
// not include `isRiver`. As a result players can place bridges/towers anywhere,
// defeating the river-crossing map strategy.
//
// These tests lock the post-fix contract: DefenseTower (and any future Bridge
// type) MUST be placed on a river tile. The validator MUST call terrain.isRiver.

import { describe, it, expect, beforeEach } from 'vitest';
import { replaceWorld } from '../src/ecs/world';
import { validateBuildingPlacement } from '../src/systems/BuildSystem';
import { BuildingTypeId, FactionId } from '../src/types/index';

describe('Bug 2 — DefenseTower/Bridge requires river tile', () => {
  beforeEach(() => {
    replaceWorld();
  });

  // Rivier zone: x in [20, 30], z in [-2, 2]. Alles daarbuiten is land.
  const terrainStub = {
    getHeightAt: (_x: number, _z: number) => 1.0,
    isWater: (_x: number, _z: number) => false,
    isRiver: (x: number, z: number) => x >= 20 && x <= 30 && z >= -2 && z <= 2,
  };

  it('rejects DefenseTower on land (not on river)', () => {
    const world = replaceWorld();
    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.DefenseTower,
      FactionId.Brabanders,
      50,
      0,
      terrainStub,
    );
    expect(result.valid).toBe(false);
    expect(result.reason ?? '').toMatch(/rivier/i);
  });

  it('accepts DefenseTower on river tile', () => {
    const world = replaceWorld();
    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.DefenseTower,
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
      BuildingTypeId.DefenseTower,
      FactionId.Brabanders,
      50,
      0,
      spy,
    );
    expect(called).toBe(true);
  });
});
