// Shared helper for spawning a pre-placed building entity.
//
// Used by Game.ts for initial mission/skirmish setup, runtime build-complete
// spawns, and AI placements. Ensures every spawn path agrees on which ECS
// components go on a building (production, rally, population cap, etc.).
//
// Parallel to src/entities/factories.ts `createBuilding()` -- that helper
// resolves faction-specific stats via factionData; this helper uses the
// legacy BUILDING_ARCHETYPES fallback so pre-placed buildings (e.g. before
// a faction is fully wired) can still spawn. Both paths must agree on the
// component contract -- see tests/building-spawn-rally-contract.test.ts.

import { addEntity, addComponent } from 'bitecs';
import {
  Position, Health, Faction, Building, Visibility, Selected,
  Production, RallyPoint, Armor,
} from '../ecs/components';
import { IsBuilding } from '../ecs/tags';
import { BUILDING_ARCHETYPES } from './archetypes';
import { addFreshComponent } from './factories';
import { ArmorType, BuildingTypeId, type FactionId, NO_PRODUCTION, NO_ENTITY } from '../types/index';
import type { GameWorld } from '../ecs/world';

export interface BuildingSpawnOptions {
  /** Height callback so Position.y matches terrain. Defaults to 0. */
  getHeightAt?: (x: number, z: number) => number;
  /** Faction bitmask seed for Selected (legacy: 255 marks "visible to all"). */
  selectedBy?: number;
}

const DEFAULT_ARCH = {
  hp: 500,
  costGold: 150,
  costSecondary: 0,
  buildTime: 25,
  sightRange: 8,
  produces: [] as readonly number[],
  populationProvided: 0,
};

/**
 * Spawn a complete (already-constructed) building entity with all its
 * ECS components and return the eid.
 *
 * Includes RallyPoint for any production building (produces.length > 0),
 * so the HUD rally-button on e.g. TownHall / Barracks / FactionSpecial2 /
 * SiegeWorkshop actually finds the component it expects.
 */
export function spawnBuildingEntity(
  world: GameWorld,
  type: BuildingTypeId,
  faction: FactionId,
  x: number,
  z: number,
  opts: BuildingSpawnOptions = {},
): number {
  const eid = addEntity(world);
  const legacy = type < BUILDING_ARCHETYPES.length ? BUILDING_ARCHETYPES[type] : undefined;
  const arch = legacy ?? DEFAULT_ARCH;
  const y = opts.getHeightAt ? opts.getHeightAt(x, z) : 0;

  // Every component is added fresh (zeroed) and every field written:
  // bitECS recycles eids without clearing component data.
  addFreshComponent(world, eid, Position);
  Position.x[eid] = x;
  Position.y[eid] = y;
  Position.z[eid] = z;

  addFreshComponent(world, eid, Health);
  Health.current[eid] = arch.hp;
  Health.max[eid] = arch.hp;

  // Buildings have their own armor class (weak to Siege in the damage matrix),
  // same as factories.ts initBuilding().
  addFreshComponent(world, eid, Armor);
  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Building;

  addFreshComponent(world, eid, Faction);
  Faction.id[eid] = faction;

  addFreshComponent(world, eid, Building);
  Building.typeId[eid] = type;
  Building.complete[eid] = 1;
  Building.progress[eid] = 1;
  Building.maxProgress[eid] = arch.buildTime;

  addFreshComponent(world, eid, Visibility);
  Visibility.range[eid] = arch.sightRange || 12;

  addFreshComponent(world, eid, Selected);
  Selected.by[eid] = opts.selectedBy ?? 255;

  addComponent(world, eid, IsBuilding);

  if (arch.produces.length > 0) {
    addFreshComponent(world, eid, Production);
    Production.unitType[eid] = NO_PRODUCTION;
    Production.progress[eid] = 0;
    Production.duration[eid] = 0;
    Production.queue0[eid] = NO_PRODUCTION;
    Production.queue1[eid] = NO_PRODUCTION;
    Production.queue2[eid] = NO_PRODUCTION;
    Production.queue3[eid] = NO_PRODUCTION;
    Production.queue4[eid] = NO_PRODUCTION;

    addFreshComponent(world, eid, RallyPoint);
    RallyPoint.x[eid] = x + 3;
    RallyPoint.z[eid] = z;
    RallyPoint.resourceEid[eid] = NO_ENTITY;
  }

  return eid;
}
