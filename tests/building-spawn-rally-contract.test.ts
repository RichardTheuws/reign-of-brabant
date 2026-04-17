// Regression test for P1 Bug 8 — rally-point button showed
// "Dit gebouw kan geen rally point hebben" on productiegebouwen.
//
// Root cause: Game.ts `createBuildingEntity` added Production but forgot
// RallyPoint for production buildings, while factories.ts `createBuilding`
// added both. Pre-placed buildings (skirmish/mission init) went through
// the Game.ts path and therefore couldn't accept a rally point.
//
// Fix: consolidated into shared helper `spawnBuildingEntity` that always
// adds RallyPoint when produces.length > 0. These tests lock the contract
// so the two spawn paths can't drift apart again.

import { describe, it, expect, beforeEach } from 'vitest';
import { hasComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { RallyPoint, Production, Building } from '../src/ecs/components';
import { spawnBuildingEntity } from '../src/entities/buildingSpawn';
import { createBuilding } from '../src/entities/factories';
import { BuildingTypeId, FactionId } from '../src/types/index';

const PRODUCTION_BUILDINGS = [
  BuildingTypeId.TownHall,
  BuildingTypeId.Barracks,
  BuildingTypeId.FactionSpecial2,
  BuildingTypeId.SiegeWorkshop,
] as const;

const NON_PRODUCTION_BUILDINGS = [
  BuildingTypeId.Blacksmith,
  BuildingTypeId.LumberCamp,
  BuildingTypeId.Housing,
  BuildingTypeId.DefenseTower,
] as const;

describe('Building spawn — RallyPoint contract', () => {
  beforeEach(() => {
    replaceWorld();
  });

  describe('spawnBuildingEntity (legacy / pre-placed path)', () => {
    for (const type of PRODUCTION_BUILDINGS) {
      it(`adds RallyPoint to BuildingTypeId=${type} (production building)`, () => {
        const world = replaceWorld();
        const eid = spawnBuildingEntity(world, type, FactionId.Brabanders, 0, 0);
        expect(hasComponent(world, eid, RallyPoint)).toBe(true);
        expect(hasComponent(world, eid, Production)).toBe(true);
        expect(Building.complete[eid]).toBe(1);
      });
    }

    for (const type of NON_PRODUCTION_BUILDINGS) {
      it(`does NOT add RallyPoint to BuildingTypeId=${type} (non-production)`, () => {
        const world = replaceWorld();
        const eid = spawnBuildingEntity(world, type, FactionId.Brabanders, 0, 0);
        expect(hasComponent(world, eid, RallyPoint)).toBe(false);
        expect(hasComponent(world, eid, Production)).toBe(false);
      });
    }
  });

  describe('createBuilding (faction-resolved / runtime path)', () => {
    for (const type of PRODUCTION_BUILDINGS) {
      it(`adds RallyPoint to BuildingTypeId=${type} for all 4 factions`, () => {
        for (const factionId of [
          FactionId.Brabanders,
          FactionId.Randstad,
          FactionId.Limburgers,
          FactionId.Belgen,
        ]) {
          const world = replaceWorld();
          const eid = createBuilding(world, type, factionId, 0, 0, true);
          expect(hasComponent(world, eid, RallyPoint)).toBe(true);
          expect(hasComponent(world, eid, Production)).toBe(true);
        }
      });
    }
  });

  it('both spawn paths agree on the RallyPoint contract', () => {
    for (const type of PRODUCTION_BUILDINGS) {
      const world = replaceWorld();
      const a = spawnBuildingEntity(world, type, FactionId.Brabanders, 0, 0);
      const b = createBuilding(world, type, FactionId.Brabanders, 10, 0, true);
      expect(hasComponent(world, a, RallyPoint))
        .toBe(hasComponent(world, b, RallyPoint));
    }
  });
});
