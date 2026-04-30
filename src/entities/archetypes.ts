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
    attack: 10,
    attackSpeed: 1.2,     // 1.2s between attacks — synced with factionData.ts
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
    attack: 12,
    attackSpeed: 1.8,     // 1.8s between attacks — synced with factionData.ts
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
    attack: 22,
    attackSpeed: 2.0,     // 2.0s between attacks — synced with factionData.ts
    armor: 4,
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

  // UnitTypeId.Infantry = 1 -- Manager (hybrid harasser, v0.52.0 re-vamp).
  // Mid-range shooter (range 5) that switches to melee when targets close in.
  // See `meleeBackup` flag and CombatSystem.ts for the toggle mechanic.
  {
    typeId: UnitTypeId.Infantry,
    name: 'Infantry',
    brabantName: 'Manager',
    hp: 85,
    attack: 7,
    attackSpeed: 1.5,
    armor: 1,
    armorType: ArmorType.Medium,
    speed: 4.5,
    range: 5,
    buildTime: 22,
    costGold: 95,
    costSecondary: 35,
    population: 1,
    sightRange: 9,
    carryCapacity: 0,
    meleeBackup: true,
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
// Limburgers Unit Archetypes -- indexed by UnitTypeId
// Mining/defense faction: tougher, slower, heavy armor.
// ---------------------------------------------------------------------------

export const LIMBURGERS_UNIT_ARCHETYPES: readonly UnitArchetype[] = [
  // UnitTypeId.Worker = 0 -- Mijnwerker
  {
    typeId: UnitTypeId.Worker,
    name: 'Worker',
    brabantName: 'Mijnwerker',
    hp: 65,
    attack: 6,
    attackSpeed: 1.5,
    armor: 1,
    armorType: ArmorType.Light,
    speed: 4.5,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 16,
    costGold: 55,
    costSecondary: 0,
    population: 1,
    sightRange: 8,
    carryCapacity: 10,
  },

  // UnitTypeId.Infantry = 1 -- Schutterij
  {
    typeId: UnitTypeId.Infantry,
    name: 'Infantry',
    brabantName: 'Schutterij',
    hp: 90,
    attack: 10,
    attackSpeed: 1.4,
    armor: 2,
    armorType: ArmorType.Medium,
    speed: 4.5,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 20,
    costGold: 85,
    costSecondary: 30,
    population: 1,
    sightRange: 8,
    carryCapacity: 0,
  },

  // UnitTypeId.Ranged = 2 -- Vlaaienwerper
  {
    typeId: UnitTypeId.Ranged,
    name: 'Ranged',
    brabantName: 'Vlaaienwerper',
    hp: 50,
    attack: 12,
    attackSpeed: 2.0,
    armor: 0,
    armorType: ArmorType.Unarmored,
    speed: 5.0,
    range: 9,
    buildTime: 24,
    costGold: 65,
    costSecondary: 45,
    population: 1,
    sightRange: 10,
    carryCapacity: 0,
  },

  // UnitTypeId.Heavy = 3 -- Mergelridder
  {
    typeId: UnitTypeId.Heavy,
    name: 'Heavy',
    brabantName: 'Mergelridder',
    hp: 250,
    attack: 22,
    attackSpeed: 2.2,
    armor: 4,
    armorType: ArmorType.Heavy,
    speed: 3.5,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 40,
    costGold: 180,
    costSecondary: 120,
    population: 2,
    sightRange: 8,
    carryCapacity: 0,
  },
] as const;

// ---------------------------------------------------------------------------
// Belgen Unit Archetypes -- indexed by UnitTypeId
// Economy/diplomacy faction: balanced, good support, fast attack speed.
// ---------------------------------------------------------------------------

export const BELGEN_UNIT_ARCHETYPES: readonly UnitArchetype[] = [
  // UnitTypeId.Worker = 0 -- Frietkraamhouder
  {
    typeId: UnitTypeId.Worker,
    name: 'Worker',
    brabantName: 'Frietkraamhouder',
    hp: 55,
    attack: 4,
    attackSpeed: 1.5,
    armor: 0,
    armorType: ArmorType.Unarmored,
    speed: 5.0,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 14,
    costGold: 45,
    costSecondary: 0,
    population: 1,
    sightRange: 8,
    carryCapacity: 10,
  },

  // UnitTypeId.Infantry = 1 -- Bierbouwer
  {
    typeId: UnitTypeId.Infantry,
    name: 'Infantry',
    brabantName: 'Bierbouwer',
    hp: 85,
    attack: 9,
    attackSpeed: 1.2,
    armor: 1,
    armorType: ArmorType.Light,
    speed: 5.0,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 18,
    costGold: 70,
    costSecondary: 20,
    population: 1,
    sightRange: 8,
    carryCapacity: 0,
  },

  // UnitTypeId.Ranged = 2 -- Chocolatier
  {
    typeId: UnitTypeId.Ranged,
    name: 'Ranged',
    brabantName: 'Chocolatier',
    hp: 60,
    attack: 11,
    attackSpeed: 1.6,
    armor: 0,
    armorType: ArmorType.Light,
    speed: 5.5,
    range: 8,
    buildTime: 20,
    costGold: 55,
    costSecondary: 35,
    population: 1,
    sightRange: 10,
    carryCapacity: 0,
  },

  // UnitTypeId.Heavy = 3 -- Frituurridder
  {
    typeId: UnitTypeId.Heavy,
    name: 'Heavy',
    brabantName: 'Frituurridder',
    hp: 180,
    attack: 18,
    attackSpeed: 1.8,
    armor: 3,
    armorType: ArmorType.Heavy,
    speed: 4.0,
    range: MINIMUM_MELEE_RANGE,
    buildTime: 32,
    costGold: 140,
    costSecondary: 90,
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
    populationProvided: 10,
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
    produces: [UnitTypeId.Infantry, UnitTypeId.Ranged, UnitTypeId.Support],
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

  // BuildingTypeId.Housing = 4 -- Woonhuis
  {
    typeId: BuildingTypeId.Housing,
    name: 'Housing',
    brabantName: 'Woonhuis',
    hp: 400,
    costGold: 100,
    costSecondary: 0,
    buildTime: 25,
    sightRange: 6,
    produces: [],
    populationProvided: 10,
  },

  // BuildingTypeId.TertiaryResourceBuilding = 5 -- Factie-specifiek
  {
    typeId: BuildingTypeId.TertiaryResourceBuilding,
    name: 'Tertiary Resource',
    brabantName: 'Dorpsweide',
    hp: 500,
    costGold: 250,
    costSecondary: 0,
    buildTime: 35,
    sightRange: 8,
    produces: [],
    tertiaryGenRate: 1.5,
  },

  // BuildingTypeId.UpgradeBuilding = 6 -- Geavanceerde Smederij (T2 unlock)
  {
    typeId: BuildingTypeId.UpgradeBuilding,
    name: 'Advanced Blacksmith',
    brabantName: 'Geavanceerde Smederij',
    hp: 400,
    costGold: 350,
    costSecondary: 0,
    buildTime: 40,
    sightRange: 8,
    produces: [],
  },

  // BuildingTypeId.FactionSpecial1 = 7 -- Factie-specifiek gebouw 1
  {
    typeId: BuildingTypeId.FactionSpecial1,
    name: 'Faction Special 1',
    brabantName: 'Dorpsweide',
    hp: 600,
    costGold: 300,
    costSecondary: 0,
    buildTime: 40,
    sightRange: 10,
    produces: [],
  },

  // BuildingTypeId.FactionSpecial2 = 8 -- Factie-specifiek gebouw 2 (T3)
  {
    typeId: BuildingTypeId.FactionSpecial2,
    name: 'Faction Special 2',
    brabantName: 'Feestzaal',
    hp: 700,
    costGold: 400,
    costSecondary: 0,
    buildTime: 45,
    sightRange: 10,
    produces: [UnitTypeId.Heavy],
  },

  // BuildingTypeId.DefenseTower = 9 -- Verdedigingstoren (T2)
  {
    typeId: BuildingTypeId.DefenseTower,
    name: 'Defense Tower',
    brabantName: 'Wachttoren',
    hp: 500,
    costGold: 200,
    costSecondary: 0,
    buildTime: 30,
    sightRange: 14,
    produces: [],
  },

  // BuildingTypeId.SiegeWorkshop = 10 -- Belegeringswerkplaats (T3)
  {
    typeId: BuildingTypeId.SiegeWorkshop,
    name: 'Siege Workshop',
    brabantName: 'Tractorschuur',
    hp: 600,
    costGold: 350,
    costSecondary: 0,
    buildTime: 40,
    sightRange: 8,
    produces: [UnitTypeId.Siege],
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

/** Look up Limburgers unit archetype data by UnitTypeId. */
export function getLimburgersUnitArchetype(typeId: UnitTypeId): UnitArchetype {
  const archetype = LIMBURGERS_UNIT_ARCHETYPES[typeId];
  if (!archetype) {
    throw new Error(`Unknown Limburgers UnitTypeId: ${typeId}`);
  }
  return archetype;
}

/** Look up Belgen unit archetype data by UnitTypeId. */
export function getBelgenUnitArchetype(typeId: UnitTypeId): UnitArchetype {
  const archetype = BELGEN_UNIT_ARCHETYPES[typeId];
  if (!archetype) {
    throw new Error(`Unknown Belgen UnitTypeId: ${typeId}`);
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
