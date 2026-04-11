/**
 * Reign of Brabant -- Entity Archetypes
 *
 * Hardcoded stat data for all unit types and building types in the PoC.
 * Values sourced directly from PRD.md section 3.1 (Brabanders).
 *
 * These arrays are indexed by UnitTypeId / BuildingTypeId enums.
 */

import {
  UnitTypeId,
  BuildingTypeId,
  ArmorType,
  MINIMUM_MELEE_RANGE,
  type UnitArchetype,
  type BuildingArchetype,
  type GoldMineDefinition,
  type TreeResourceDefinition,
} from '../types/index';

// ---------------------------------------------------------------------------
// Unit Archetypes -- indexed by UnitTypeId
// ---------------------------------------------------------------------------

export const UNIT_ARCHETYPES: readonly UnitArchetype[] = [
  // UnitTypeId.Worker = 0 -- Boer
  {
    typeId: UnitTypeId.Worker,
    name: 'Worker',
    brabantName: 'Boer',
    hp: 60,
    attack: 5,
    attackSpeed: 1.5,     // 1.5s between attacks
    armor: 0,
    armorType: ArmorType.Unarmored,
    speed: 5.0,           // world units per second
    range: MINIMUM_MELEE_RANGE,
    buildTime: 15,        // seconds to train
    costGold: 50,
    costSecondary: 0,
    population: 1,
    sightRange: 8,
    carryCapacity: 10,    // resource carry capacity
  },

  // UnitTypeId.Infantry = 1 -- Carnavalvierder
  {
    typeId: UnitTypeId.Infantry,
    name: 'Infantry',
    brabantName: 'Carnavalvierder',
    hp: 80,
    attack: 9,
    attackSpeed: 1.3,     // 1.3s between attacks (DPS 6.92, was 8.33)
    armor: 1,
    armorType: ArmorType.Light,
    speed: 5.5,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 18,
    costGold: 75,
    costSecondary: 25,    // secondary resource (not used in PoC, gold only)
    population: 1,
    sightRange: 8,
    carryCapacity: 0,     // cannot gather
  },

  // UnitTypeId.Ranged = 2 -- Sluiper
  {
    typeId: UnitTypeId.Ranged,
    name: 'Ranged',
    brabantName: 'Sluiper',
    hp: 55,
    attack: 14,
    attackSpeed: 1.8,     // 1.8s between attacks (DPS 7.78, was 6.67)
    armor: 0,
    armorType: ArmorType.Light,
    speed: 6.0,
    range: 8,             // ranged: 8 world units
    buildTime: 22,
    costGold: 60,
    costSecondary: 40,
    population: 1,
    sightRange: 10,       // ranged units see further
    carryCapacity: 0,
  },

  // UnitTypeId.Heavy = 3 -- Tractorrijder
  {
    typeId: UnitTypeId.Heavy,
    name: 'Heavy',
    brabantName: 'Tractorrijder',
    hp: 200,
    attack: 20,
    attackSpeed: 2.0,     // 2.0s between attacks — slow but hard-hitting
    armor: 3,
    armorType: ArmorType.Heavy,
    speed: 4.0,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 35,
    costGold: 150,
    costSecondary: 100,
    population: 2,
    sightRange: 8,
    carryCapacity: 0,
  },
] as const;

// ---------------------------------------------------------------------------
// Randstad Unit Archetypes -- indexed by UnitTypeId
// Used when the AI faction is Randstad. Individually stronger/different stats.
// ---------------------------------------------------------------------------

export const RANDSTAD_UNIT_ARCHETYPES: readonly UnitArchetype[] = [
  // UnitTypeId.Worker = 0 -- Stagiair
  {
    typeId: UnitTypeId.Worker,
    name: 'Worker',
    brabantName: 'Stagiair',
    hp: 45,
    attack: 3,
    attackSpeed: 1.5,
    armor: 0,
    armorType: ArmorType.Unarmored,
    speed: 5.5,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 12,
    costGold: 35,
    costSecondary: 0,
    population: 1,
    sightRange: 8,
    carryCapacity: 8,
  },

  // UnitTypeId.Infantry = 1 -- Manager (ranged debuff specialist)
  {
    typeId: UnitTypeId.Infantry,
    name: 'Infantry',
    brabantName: 'Manager',
    hp: 75,
    attack: 10,
    attackSpeed: 1.5,
    armor: 1,
    armorType: ArmorType.Medium,
    speed: 4.5,
    range: 7,
    buildTime: 22,
    costGold: 95,
    costSecondary: 35,
    population: 1,
    sightRange: 9,
    carryCapacity: 0,
  },

  // UnitTypeId.Ranged = 2 -- Consultant (debuff specialist, modest direct damage)
  {
    typeId: UnitTypeId.Ranged,
    name: 'Ranged',
    brabantName: 'Consultant',
    hp: 55,
    attack: 5,
    attackSpeed: 1.8,
    armor: 0,
    armorType: ArmorType.Light,
    speed: 5.0,
    range: 9,
    buildTime: 20,
    costGold: 70,
    costSecondary: 50,
    population: 1,
    sightRange: 11,
    carryCapacity: 0,
  },

  // UnitTypeId.Heavy = 3 -- CorporateAdvocaat
  {
    typeId: UnitTypeId.Heavy,
    name: 'Heavy',
    brabantName: 'CorporateAdvocaat',
    hp: 220,
    attack: 18,
    attackSpeed: 2.2,
    armor: 4,
    armorType: ArmorType.Heavy,
    speed: 3.5,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 38,
    costGold: 170,
    costSecondary: 120,
    population: 2,
    sightRange: 8,
    carryCapacity: 0,
  },
] as const;

// ---------------------------------------------------------------------------
// Building Archetypes -- indexed by BuildingTypeId
// ---------------------------------------------------------------------------

export const BUILDING_ARCHETYPES: readonly BuildingArchetype[] = [
  // BuildingTypeId.TownHall = 0 -- Boerderij
  {
    typeId: BuildingTypeId.TownHall,
    name: 'Town Hall',
    brabantName: 'Boerderij',
    hp: 1500,
    costGold: 0,          // pre-placed, not buildable
    costSecondary: 0,
    buildTime: 0,         // instant (pre-placed at game start)
    sightRange: 12,
    produces: [UnitTypeId.Worker],
  },

  // BuildingTypeId.Barracks = 1 -- Cafe
  {
    typeId: BuildingTypeId.Barracks,
    name: 'Barracks',
    brabantName: 'Cafe',
    hp: 800,
    costGold: 200,
    costSecondary: 0,
    buildTime: 30,        // 30 seconds to construct
    sightRange: 10,
    produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
  },

  // BuildingTypeId.LumberCamp = 2 -- Houtzagerij
  {
    typeId: BuildingTypeId.LumberCamp,
    name: 'LumberCamp',
    brabantName: 'Houtzagerij',
    hp: 600,
    costGold: 100,
    costSecondary: 0,
    buildTime: 20,
    sightRange: 8,
    produces: [],
  },

  // BuildingTypeId.Blacksmith = 3 -- Smederij
  {
    typeId: BuildingTypeId.Blacksmith,
    name: 'Blacksmith',
    brabantName: 'Smederij',
    hp: 300,
    costGold: 200,
    costSecondary: 0,
    buildTime: 20,        // 20 seconds to construct
    sightRange: 8,
    produces: [],          // Does not produce units; researches upgrades instead
  },
] as const;

// ---------------------------------------------------------------------------
// Gold Mine Definition
// ---------------------------------------------------------------------------

export const GOLD_MINE: GoldMineDefinition = {
  hp: 99999,            // effectively indestructible in PoC
  defaultAmount: 1500,  // total gold in a mine
  sightRange: 0,        // resources don't reveal fog
} as const;

// ---------------------------------------------------------------------------
// Tree Resource Definition
// ---------------------------------------------------------------------------

export const TREE_RESOURCE: TreeResourceDefinition = {
  hp: 99999,            // effectively indestructible
  defaultAmount: 300,   // wood per tree
  sightRange: 0,        // resources don't reveal fog
} as const;

// ---------------------------------------------------------------------------
// Helper: get archetype by type ID
// ---------------------------------------------------------------------------

/** Look up unit archetype data by UnitTypeId. */
export function getUnitArchetype(typeId: UnitTypeId): UnitArchetype {
  const archetype = UNIT_ARCHETYPES[typeId];
  if (!archetype) {
    throw new Error(`Unknown UnitTypeId: ${typeId}`);
  }
  return archetype;
}

/** Look up Randstad unit archetype data by UnitTypeId. */
export function getRandstadUnitArchetype(typeId: UnitTypeId): UnitArchetype {
  const archetype = RANDSTAD_UNIT_ARCHETYPES[typeId];
  if (!archetype) {
    throw new Error(`Unknown Randstad UnitTypeId: ${typeId}`);
  }
  return archetype;
}

/** Look up building archetype data by BuildingTypeId. */
export function getBuildingArchetype(typeId: BuildingTypeId): BuildingArchetype {
  const archetype = BUILDING_ARCHETYPES[typeId];
  if (!archetype) {
    throw new Error(`Unknown BuildingTypeId: ${typeId}`);
  }
  return archetype;
}
