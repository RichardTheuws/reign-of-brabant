/**
 * Reign of Brabant -- Entity Factories
 *
 * Factory functions that create fully initialized ECS entities.
 * Each factory:
 *   1. Adds a new entity to the world
 *   2. Registers all required components
 *   3. Sets component values from archetype data
 *   4. Returns the entity ID
 *
 * Supports all 4 factions via factionData lookups with fallback to
 * the legacy UNIT_ARCHETYPES / BUILDING_ARCHETYPES for backward compatibility.
 *
 * Uses bitECS 0.4.0 API: addEntity(world), addComponents(world, eid, ...components)
 */

import { addEntity, addComponent } from 'bitecs';
import type { World } from 'bitecs';

import {
  FactionId,
  UnitTypeId,
  BuildingTypeId,
  ResourceType,
  UnitAIState,
  NO_ENTITY,
  NO_PRODUCTION,
  CARRY_CAPACITY,
  type UnitArchetype,
  type BuildingArchetype,
} from '../types/index';

import {
  Position,
  Rotation,
  Movement,
  Health,
  Attack,
  Armor,
  Faction,
  UnitType,
  UnitAI,
  Gatherer,
  Building,
  Production,
  RallyPoint,
  Visibility,
  Resource,
  PopulationCost,
  RenderRef,
  Velocity,
} from '../ecs/components';

import {
  IsUnit,
  IsBuilding,
  IsResource,
  IsWorker,
} from '../ecs/tags';

import {
  UNIT_ARCHETYPES,
  BUILDING_ARCHETYPES,
  GOLD_MINE,
  TREE_RESOURCE,
} from './archetypes';

import {
  getFactionUnitArchetype,
  getFactionUnitByName,
  getFactionBuildingArchetype,
  getUnitsForFaction,
  ExtendedUnitTypeId,
} from '../data/factionData';

// ---------------------------------------------------------------------------
// Internal: archetype resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolve unit archetype for a given faction and unit type.
 * Priority: factionData lookup → legacy UNIT_ARCHETYPES fallback.
 *
 * This ensures backward compatibility: Brabanders Worker/Infantry/Ranged
 * resolve to the exact same stats as before (factionData mirrors archetypes.ts
 * for the base 3 types), while new factions and new unit types (Heavy, Siege,
 * Support, Special) are served from factionData.
 */
function resolveUnitArchetype(factionId: FactionId, unitTypeId: UnitTypeId): UnitArchetype {
  try {
    return getFactionUnitArchetype(factionId, unitTypeId);
  } catch {
    // Fallback to legacy archetypes (indexed by UnitTypeId 0-2)
    const legacy = UNIT_ARCHETYPES[unitTypeId];
    if (legacy) return legacy;
    throw new Error(
      `No unit archetype found for factionId=${factionId}, unitTypeId=${unitTypeId}`,
    );
  }
}

/**
 * Resolve building archetype for a given faction and building type.
 * Priority: factionData lookup → legacy BUILDING_ARCHETYPES fallback.
 */
function resolveBuildingArchetype(factionId: FactionId, buildingTypeId: BuildingTypeId): BuildingArchetype {
  try {
    return getFactionBuildingArchetype(factionId, buildingTypeId);
  } catch {
    // Fallback to legacy archetypes (indexed by BuildingTypeId 0-3)
    const legacy = BUILDING_ARCHETYPES[buildingTypeId];
    if (legacy) return legacy;
    throw new Error(
      `No building archetype found for factionId=${factionId}, buildingTypeId=${buildingTypeId}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Internal: shared unit initialization
// ---------------------------------------------------------------------------

/**
 * Initialize common components for any unit entity.
 * Resolves stats from factionData (with legacy fallback) so each faction
 * gets its own unit flavour automatically.
 * Returns the entity ID.
 */
function initUnit(
  world: World,
  unitTypeId: UnitTypeId,
  factionId: FactionId,
  x: number,
  z: number,
): number {
  const eid = addEntity(world);
  const arch = resolveUnitArchetype(factionId, unitTypeId);

  // Register all unit components
  addComponent(world, eid, Position);
  addComponent(world, eid, Rotation);
  addComponent(world, eid, Velocity);
  addComponent(world, eid, Movement);
  addComponent(world, eid, Health);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitType);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Visibility);
  addComponent(world, eid, PopulationCost);
  addComponent(world, eid, RenderRef);
  addComponent(world, eid, IsUnit);

  // Position
  Position.x[eid] = x;
  Position.y[eid] = 0; // Will be set by terrain height lookup
  Position.z[eid] = z;

  // Rotation (face a default direction)
  Rotation.y[eid] = 0;

  // Velocity (initially stationary)
  Velocity.x[eid] = 0;
  Velocity.z[eid] = 0;

  // Movement (no target initially)
  Movement.targetX[eid] = x;
  Movement.targetZ[eid] = z;
  Movement.speed[eid] = arch.speed;
  Movement.hasTarget[eid] = 0;

  // Health
  Health.current[eid] = arch.hp;
  Health.max[eid] = arch.hp;

  // Attack
  Attack.damage[eid] = arch.attack;
  Attack.speed[eid] = arch.attackSpeed;
  Attack.range[eid] = arch.range;
  Attack.cooldown[eid] = arch.attackSpeed;
  Attack.timer[eid] = 0; // Ready to attack immediately

  // Armor
  Armor.value[eid] = arch.armor;
  Armor.type[eid] = arch.armorType;

  // Faction & Type
  Faction.id[eid] = factionId;
  UnitType.id[eid] = unitTypeId;

  // AI state: idle
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  UnitAI.originX[eid] = x;
  UnitAI.originZ[eid] = z;

  // Visibility
  Visibility.range[eid] = arch.sightRange;

  // Population
  PopulationCost.cost[eid] = arch.population;

  // RenderRef (use entity ID as mesh key)
  RenderRef.meshId[eid] = eid;

  return eid;
}

/**
 * Initialize common components for any unit entity from a pre-resolved archetype.
 * Used by createFactionUnit() where the archetype is looked up by name.
 * Returns the entity ID.
 */
function initUnitFromArchetype(
  world: World,
  arch: UnitArchetype,
  factionId: FactionId,
  x: number,
  z: number,
): number {
  const eid = addEntity(world);

  // Register all unit components
  addComponent(world, eid, Position);
  addComponent(world, eid, Rotation);
  addComponent(world, eid, Velocity);
  addComponent(world, eid, Movement);
  addComponent(world, eid, Health);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitType);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Visibility);
  addComponent(world, eid, PopulationCost);
  addComponent(world, eid, RenderRef);
  addComponent(world, eid, IsUnit);

  // Position
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;

  // Rotation
  Rotation.y[eid] = 0;

  // Velocity
  Velocity.x[eid] = 0;
  Velocity.z[eid] = 0;

  // Movement
  Movement.targetX[eid] = x;
  Movement.targetZ[eid] = z;
  Movement.speed[eid] = arch.speed;
  Movement.hasTarget[eid] = 0;

  // Health
  Health.current[eid] = arch.hp;
  Health.max[eid] = arch.hp;

  // Attack
  Attack.damage[eid] = arch.attack;
  Attack.speed[eid] = arch.attackSpeed;
  Attack.range[eid] = arch.range;
  Attack.cooldown[eid] = arch.attackSpeed;
  Attack.timer[eid] = 0;

  // Armor
  Armor.value[eid] = arch.armor;
  Armor.type[eid] = arch.armorType;

  // Faction & Type
  Faction.id[eid] = factionId;
  UnitType.id[eid] = arch.typeId;

  // AI state: idle
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  UnitAI.originX[eid] = x;
  UnitAI.originZ[eid] = z;

  // Visibility
  Visibility.range[eid] = arch.sightRange;

  // Population
  PopulationCost.cost[eid] = arch.population;

  // RenderRef
  RenderRef.meshId[eid] = eid;

  return eid;
}

// ---------------------------------------------------------------------------
// Unit Factories
// ---------------------------------------------------------------------------

/**
 * Create a Worker (Boer) entity.
 * Workers can gather resources and build buildings.
 */
export function createWorker(
  world: World,
  factionId: FactionId,
  x: number,
  z: number,
): number {
  const eid = initUnit(world, UnitTypeId.Worker, factionId, x, z);

  // Resolve faction-specific carry capacity
  const arch = resolveUnitArchetype(factionId, UnitTypeId.Worker);

  // Workers get the Gatherer component and IsWorker tag
  addComponent(world, eid, Gatherer);
  addComponent(world, eid, IsWorker);

  // Initialize gatherer state
  Gatherer.state[eid] = UnitAIState.Idle;
  Gatherer.targetEid[eid] = NO_ENTITY;
  Gatherer.carrying[eid] = 0;
  Gatherer.carryCapacity[eid] = arch.carryCapacity || CARRY_CAPACITY;
  Gatherer.resourceType[eid] = ResourceType.Gold;

  return eid;
}

/**
 * Create an Infantry (Carnavalvierder) entity.
 * Melee combat unit with light armor.
 */
export function createInfantry(
  world: World,
  factionId: FactionId,
  x: number,
  z: number,
): number {
  return initUnit(world, UnitTypeId.Infantry, factionId, x, z);
}

/**
 * Create a Ranged (Sluiper) entity.
 * Ranged combat unit that throws bierpullen.
 */
export function createRanged(
  world: World,
  factionId: FactionId,
  x: number,
  z: number,
): number {
  return initUnit(world, UnitTypeId.Ranged, factionId, x, z);
}

// ---------------------------------------------------------------------------
// Internal: shared building initialization
// ---------------------------------------------------------------------------

/**
 * Initialize common components for any building entity.
 * Resolves stats from factionData (with legacy fallback) so each faction
 * gets its own building flavour automatically.
 * Returns the entity ID.
 */
function initBuilding(
  world: World,
  buildingTypeId: BuildingTypeId,
  factionId: FactionId,
  x: number,
  z: number,
  startComplete: boolean,
): number {
  const eid = addEntity(world);
  const arch = resolveBuildingArchetype(factionId, buildingTypeId);

  // Register all building components
  addComponent(world, eid, Position);
  addComponent(world, eid, Rotation);
  addComponent(world, eid, Health);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Building);
  addComponent(world, eid, Visibility);
  addComponent(world, eid, RenderRef);
  addComponent(world, eid, IsBuilding);

  // Position
  Position.x[eid] = x;
  Position.y[eid] = 0; // Will be set by terrain height lookup
  Position.z[eid] = z;

  // Rotation
  Rotation.y[eid] = 0;

  // Health
  Health.current[eid] = startComplete ? arch.hp : arch.hp * 0.1; // 10% HP while building
  Health.max[eid] = arch.hp;

  // Faction
  Faction.id[eid] = factionId;

  // Building state
  Building.typeId[eid] = buildingTypeId;
  Building.complete[eid] = startComplete ? 1 : 0;
  Building.progress[eid] = startComplete ? 1.0 : 0.0;
  Building.maxProgress[eid] = arch.buildTime;

  // Visibility
  Visibility.range[eid] = arch.sightRange;

  // RenderRef
  RenderRef.meshId[eid] = eid;

  return eid;
}

// ---------------------------------------------------------------------------
// Building Factories
// ---------------------------------------------------------------------------

/**
 * Create a Town Hall (Boerderij) entity.
 * Pre-placed at game start, produces Workers.
 * Always starts complete (buildTime=0).
 */
export function createTownHall(
  world: World,
  factionId: FactionId,
  x: number,
  z: number,
): number {
  const eid = initBuilding(world, BuildingTypeId.TownHall, factionId, x, z, true);

  // Town Hall can produce units
  addComponent(world, eid, Production);
  addComponent(world, eid, RallyPoint);

  // Initialize production (idle)
  Production.unitType[eid] = NO_PRODUCTION;
  Production.progress[eid] = 0;
  Production.duration[eid] = 0;
  Production.queue0[eid] = NO_PRODUCTION;
  Production.queue1[eid] = NO_PRODUCTION;
  Production.queue2[eid] = NO_PRODUCTION;
  Production.queue3[eid] = NO_PRODUCTION;
  Production.queue4[eid] = NO_PRODUCTION;

  // Rally point: slightly in front of building
  RallyPoint.x[eid] = x + 4;
  RallyPoint.z[eid] = z;

  return eid;
}

/**
 * Create a Barracks (Cafe) entity.
 * Produces Infantry and Ranged units.
 * Starts under construction unless startComplete is specified.
 */
export function createBarracks(
  world: World,
  factionId: FactionId,
  x: number,
  z: number,
  startComplete = false,
): number {
  const eid = initBuilding(world, BuildingTypeId.Barracks, factionId, x, z, startComplete);

  // Barracks can produce units
  addComponent(world, eid, Production);
  addComponent(world, eid, RallyPoint);

  // Initialize production (idle)
  Production.unitType[eid] = NO_PRODUCTION;
  Production.progress[eid] = 0;
  Production.duration[eid] = 0;
  Production.queue0[eid] = NO_PRODUCTION;
  Production.queue1[eid] = NO_PRODUCTION;
  Production.queue2[eid] = NO_PRODUCTION;
  Production.queue3[eid] = NO_PRODUCTION;
  Production.queue4[eid] = NO_PRODUCTION;

  // Rally point: slightly in front of building
  RallyPoint.x[eid] = x + 3;
  RallyPoint.z[eid] = z;

  return eid;
}

/**
 * Create a Blacksmith (Smederij) entity.
 * Research building for unit upgrades.
 * Starts under construction unless startComplete is specified.
 */
export function createBlacksmith(
  world: World,
  factionId: FactionId,
  x: number,
  z: number,
  startComplete = false,
): number {
  const eid = initBuilding(world, BuildingTypeId.Blacksmith, factionId, x, z, startComplete);
  // Blacksmith does not produce units -- no Production/RallyPoint components needed
  return eid;
}

// ---------------------------------------------------------------------------
// Resource Factories
// ---------------------------------------------------------------------------

/**
 * Create a Gold Mine (Worstenbroodjes) entity.
 * Resource node that workers can gather from.
 */
export function createGoldMine(
  world: World,
  x: number,
  z: number,
  amount?: number,
): number {
  const eid = addEntity(world);
  const mineAmount = amount ?? GOLD_MINE.defaultAmount;

  // Register resource components
  addComponent(world, eid, Position);
  addComponent(world, eid, Resource);
  addComponent(world, eid, RenderRef);
  addComponent(world, eid, IsResource);

  // Position
  Position.x[eid] = x;
  Position.y[eid] = 0; // Will be set by terrain height lookup
  Position.z[eid] = z;

  // Resource data
  Resource.type[eid] = ResourceType.Gold;
  Resource.amount[eid] = mineAmount;
  Resource.maxAmount[eid] = mineAmount;

  // RenderRef
  RenderRef.meshId[eid] = eid;

  return eid;
}

/**
 * Create a Tree Resource (Hout) entity.
 * Resource node that workers can gather wood from.
 */
export function createTreeResource(
  world: World,
  x: number,
  z: number,
  amount?: number,
): number {
  const eid = addEntity(world);
  const treeAmount = amount ?? TREE_RESOURCE.defaultAmount;

  // Register resource components
  addComponent(world, eid, Position);
  addComponent(world, eid, Resource);
  addComponent(world, eid, RenderRef);
  addComponent(world, eid, IsResource);

  // Position
  Position.x[eid] = x;
  Position.y[eid] = 0; // Will be set by terrain height lookup
  Position.z[eid] = z;

  // Resource data
  Resource.type[eid] = ResourceType.Wood;
  Resource.amount[eid] = treeAmount;
  Resource.maxAmount[eid] = treeAmount;

  // RenderRef
  RenderRef.meshId[eid] = eid;

  return eid;
}

/**
 * Create a Lumber Camp (Houtzagerij) entity.
 * Drop-off point for wood. Does not produce units.
 * Starts under construction unless startComplete is specified.
 */
export function createLumberCamp(
  world: World,
  factionId: FactionId,
  x: number,
  z: number,
  startComplete = false,
): number {
  const eid = initBuilding(world, BuildingTypeId.LumberCamp, factionId, x, z, startComplete);
  // Lumber Camp does not produce units -- no Production/RallyPoint components needed
  return eid;
}

// ---------------------------------------------------------------------------
// Generic Factory (create unit by type ID)
// ---------------------------------------------------------------------------

/**
 * Create any unit by its UnitTypeId. Dispatches to the correct factory.
 * Useful for ProductionSystem which needs to spawn by type dynamically.
 *
 * Supports all UnitTypeId values (Worker, Infantry, Ranged, Heavy, Siege,
 * Support, Special, Hero). Worker gets the Gatherer component; all others
 * are initialized as combat units via initUnit() which resolves faction-
 * specific stats from factionData.
 */
export function createUnit(
  world: World,
  unitTypeId: UnitTypeId,
  factionId: FactionId,
  x: number,
  z: number,
): number {
  switch (unitTypeId) {
    case UnitTypeId.Worker:
      return createWorker(world, factionId, x, z);
    case UnitTypeId.Infantry:
      return createInfantry(world, factionId, x, z);
    case UnitTypeId.Ranged:
      return createRanged(world, factionId, x, z);
    case UnitTypeId.Heavy:
    case UnitTypeId.Siege:
    case UnitTypeId.Support:
    case UnitTypeId.Special:
    case UnitTypeId.Hero:
      // All new unit types: resolve from factionData directly
      return initUnit(world, unitTypeId, factionId, x, z);
    default: {
      // Exhaustive guard: should never be reached
      const _exhaustive: never = unitTypeId;
      throw new Error(`Unknown UnitTypeId: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Generic Factory (create building by type ID)
// ---------------------------------------------------------------------------

/**
 * Create any building by its BuildingTypeId. Resolves faction-specific stats
 * from factionData with legacy fallback.
 *
 * Buildings that can produce units (produces.length > 0) automatically get
 * Production and RallyPoint components.
 */
export function createBuilding(
  world: World,
  buildingTypeId: BuildingTypeId,
  factionId: FactionId,
  x: number,
  z: number,
  startComplete = false,
): number {
  const eid = initBuilding(world, buildingTypeId, factionId, x, z, startComplete);
  const arch = resolveBuildingArchetype(factionId, buildingTypeId);

  // Auto-add Production + RallyPoint for buildings that can produce units
  if (arch.produces.length > 0) {
    addComponent(world, eid, Production);
    addComponent(world, eid, RallyPoint);

    Production.unitType[eid] = NO_PRODUCTION;
    Production.progress[eid] = 0;
    Production.duration[eid] = 0;
    Production.queue0[eid] = NO_PRODUCTION;
    Production.queue1[eid] = NO_PRODUCTION;
    Production.queue2[eid] = NO_PRODUCTION;
    Production.queue3[eid] = NO_PRODUCTION;
    Production.queue4[eid] = NO_PRODUCTION;

    RallyPoint.x[eid] = x + 3;
    RallyPoint.z[eid] = z;
  }

  return eid;
}

// ---------------------------------------------------------------------------
// Faction-specific Factory (create unit by ExtendedUnitTypeId / name)
// ---------------------------------------------------------------------------

/**
 * Create a faction-specific unit by its name in the factionData registry.
 * This is the primary factory for units that don't map to the 3 base
 * UnitTypeId values (Worker, Infantry, Ranged), such as Tractorrijder,
 * Mergelridder, Corporate Advocaat, etc.
 *
 * For the 3 base types, prefer createUnit() for backward compatibility.
 *
 * @param world - bitECS world
 * @param factionId - Faction (0-3)
 * @param unitName - Exact unit name from factionData (e.g. 'Mergelridder', 'Tractorrijder')
 * @param x - Spawn X position
 * @param z - Spawn Z position
 * @returns Entity ID of the created unit
 */
export function createFactionUnit(
  world: World,
  factionId: FactionId,
  unitName: string,
  x: number,
  z: number,
): number {
  const arch = getFactionUnitByName(factionId, unitName);
  const eid = initUnitFromArchetype(world, arch, factionId, x, z);

  // Workers get the Gatherer component and IsWorker tag
  if (arch.typeId === UnitTypeId.Worker) {
    addComponent(world, eid, Gatherer);
    addComponent(world, eid, IsWorker);

    Gatherer.state[eid] = UnitAIState.Idle;
    Gatherer.targetEid[eid] = NO_ENTITY;
    Gatherer.carrying[eid] = 0;
    Gatherer.carryCapacity[eid] = arch.carryCapacity || CARRY_CAPACITY;
    Gatherer.resourceType[eid] = ResourceType.Gold;
  }

  return eid;
}

/**
 * Create a faction-specific unit by its ExtendedUnitTypeId.
 * Looks up the unit by matching the ExtendedUnitTypeId index in the faction's
 * unit list from factionData.
 *
 * @param world - bitECS world
 * @param factionId - Faction (0-3)
 * @param extendedTypeId - ExtendedUnitTypeId value
 * @param x - Spawn X position
 * @param z - Spawn Z position
 * @returns Entity ID of the created unit
 */
export function createFactionUnitByExtendedId(
  world: World,
  factionId: FactionId,
  extendedTypeId: ExtendedUnitTypeId,
  x: number,
  z: number,
): number {
  // ExtendedUnitTypeId values are laid out per-faction in factionData.
  // We find the unit in the faction's unit list by matching the index offset.
  const units = getUnitsForFaction(factionId);
  const factionOffset = factionId * 10; // Brabanders=0, Randstad=10, Limburgers=20, Belgen=30
  const localIndex = (extendedTypeId as number) - factionOffset;

  if (localIndex < 0 || localIndex >= units.length) {
    throw new Error(
      `ExtendedUnitTypeId ${extendedTypeId} out of range for faction ${factionId} ` +
      `(expected ${factionOffset}-${factionOffset + units.length - 1})`,
    );
  }

  const arch = units[localIndex];
  const eid = initUnitFromArchetype(world, arch, factionId, x, z);

  // Workers get the Gatherer component and IsWorker tag
  if (arch.typeId === UnitTypeId.Worker) {
    addComponent(world, eid, Gatherer);
    addComponent(world, eid, IsWorker);

    Gatherer.state[eid] = UnitAIState.Idle;
    Gatherer.targetEid[eid] = NO_ENTITY;
    Gatherer.carrying[eid] = 0;
    Gatherer.carryCapacity[eid] = arch.carryCapacity || CARRY_CAPACITY;
    Gatherer.resourceType[eid] = ResourceType.Gold;
  }

  return eid;
}
