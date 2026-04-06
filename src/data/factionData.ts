/**
 * Reign of Brabant -- Faction Data (Data-Driven Unit & Building Definitions)
 *
 * Complete unit and building stat definitions for all 4 factions.
 * Sources: PRD.md (Brabanders, Randstad), SUB-PRD-LIMBURGERS.md, SUB-PRD-BELGEN.md.
 *
 * This module is ADDITIVE -- it does NOT replace archetypes.ts.
 * The existing archetypes.ts remains backwards compatible for the PoC.
 */

import {
  UnitTypeId,
  BuildingTypeId,
  ArmorType,
  type UnitArchetype,
  type BuildingArchetype,
} from '../types/index';

// ---------------------------------------------------------------------------
// Extended Enums -- All unit types across all 4 factions
// ---------------------------------------------------------------------------

/**
 * Extended unit type identifiers covering every unit in all 4 factions.
 * Values are unique across factions to allow global lookups.
 */
export enum ExtendedUnitTypeId {
  // --- Brabanders (0-9) ---
  Boer = 0,
  Carnavalvierder = 1,
  Kansen = 2,               // "Sluiper" / Ranged stealth
  Boerinne = 3,             // Support / Healer
  Muzikant = 4,             // Buffer / Debuffer [Tier 2]
  Tractorrijder = 5,        // Heavy / Cavalry [Tier 2]
  Frituurmeester = 6,       // Siege [Tier 3]
  Praalwagen = 7,           // Super Siege [Tier 3]
  PrinsVanBrabant = 8,      // Hero: Tank / Buffer
  BoerVanBrabant = 9,       // Hero: Tank / Summoner

  // --- Randstad (10-19) ---
  Stagiair = 10,
  Manager = 11,             // Ranged / Debuff
  Consultant = 12,          // Debuff specialist
  Hipster = 13,             // Scout [Tier 2]
  HRMedewerker = 14,        // Support / Healer [Tier 2]
  CorporateAdvocaat = 15,   // Heavy melee [Tier 2]
  Influencer = 16,          // Ranged / AoE [Tier 2]
  Vastgoedmakelaar = 17,    // Siege [Tier 3]
  DeCEO = 18,               // Hero: Commander / Buffer
  DePoliticus = 19,         // Hero: Caster / Manipulator

  // --- Limburgers (20-29) ---
  Mijnwerker = 20,
  Schutterij = 21,          // Infantry (ranged)
  Vlaaienwerper = 22,       // Ranged / Specialist
  Mergelridder = 23,        // Heavy / Cavalry
  Kolenbrander = 24,        // Siege [Tier 3]
  Sjpion = 25,              // Support / Healer
  Mijnrat = 26,             // Stealth / Sabotage [Tier 3]
  Heuvelansen = 27,         // Scout [Tier 1]
  DeMijnbaas = 28,          // Hero: Tank / Controller
  DeMaasridder = 29,        // Hero: Caster / Disruptor

  // --- Belgen (30-38) ---
  Frietkraamhouder = 30,
  Bierbouwer = 31,          // Infantry (melee)
  Chocolatier = 32,         // Ranged
  Frituurridder = 33,       // Heavy / Cavalry
  MannekenPisKanon = 34,    // Siege
  Wafelzuster = 35,         // Support / Healer
  DubbeleSpion = 36,        // Stealth / Sabotage
  DeFrietkoning = 37,       // Hero: Tank / Support
  DeAbdijbrouwer = 38,      // Hero: Monk / Caster
}

/**
 * Extended building type identifiers covering every building in all 4 factions.
 * Values are unique across factions to allow global lookups.
 */
export enum ExtendedBuildingTypeId {
  // --- Brabanders (0-9) ---
  Boerderij = 0,            // Town Hall
  Cafe = 1,                 // Barracks
  Bakkerij = 2,             // Resource gen (primary)
  Brouwerij = 3,            // Resource gen (secondary)
  Kermistent = 4,           // Tech / Upgrade
  Kerk = 5,                 // Defense tower
  Feestzaal = 6,            // Advanced unit building
  Dorpsweide = 7,           // Special (Gezelligheid burst)
  Frietkar = 8,             // Support (mobile heal)
  Boerenhoeve = 9,          // Housing
  Houtzagerij = 10,         // Lumber Camp

  // --- Randstad (11-18) ---
  Hoofdkantoor = 11,        // Town Hall
  Vergaderzaal = 12,        // Barracks
  Starbucks = 13,           // Resource gen + buff
  Netwerkborrel = 14,       // Resource gen (secondary)
  CoworkingSpace = 15,      // Tech / Upgrade
  Parkeergarage = 16,       // Advanced unit building
  VinexWijk = 17,           // Housing
  KantoorToren = 18,        // Defense tower

  // --- Limburgers (19-28) ---
  Mergelhoeve = 19,         // Town Hall
  Schuttershal = 20,        // Barracks
  Vlaaibakkerij = 21,       // Resource gen (primary)
  MergelgroeveBldg = 22,    // Resource gen (secondary)
  Mijnschacht = 23,         // Tertiary resource + tunnel
  Grot = 24,                // Tunnel endpoint
  Klooster = 25,            // Tech / Upgrade
  Wachttoren = 26,          // Defense tower
  Mijnwerkerskamp = 27,     // Advanced unit building
  Huuske = 28,              // Housing

  // --- Belgen (29-40) ---
  Stadhuis = 29,            // Town Hall
  Frituur = 30,             // Barracks
  Abdij = 31,               // Resource gen (secondary)
  Frietfabriek = 32,        // Resource gen (primary)
  ChocolaterieBldg = 33,    // Tertiary resource
  EUParlement = 34,         // Tech / Upgrade
  Rijschool = 35,           // Advanced unit building
  Wafelkraam = 36,          // Support (mobile heal)
  BrusselseWoning = 37,     // Housing
  SurrealistischAtelier = 38, // Special unit building
  Commissiegebouw = 39,     // Defense tower
  DiplomatiekSalon = 40,    // Diplomatie hub (Tier 3)
}

// ---------------------------------------------------------------------------
// Faction ID extension -- add Limburgers and Belgen
// ---------------------------------------------------------------------------

/**
 * Extended faction identifiers including all 4 factions.
 * Compatible with the original FactionId enum (0 = Brabanders, 1 = Randstad).
 */
export enum ExtendedFactionId {
  Brabanders = 0,
  Randstad = 1,
  Limburgers = 2,
  Belgen = 3,
}

// ---------------------------------------------------------------------------
// FACTION_UNITS -- Complete unit data for all 4 factions
// ---------------------------------------------------------------------------

/**
 * All unit archetypes per faction. Uses the existing UnitArchetype interface
 * from types/index.ts. The `typeId` field uses UnitTypeId for backwards
 * compat on the 3 base types (Worker/Infantry/Ranged), and stores the
 * ExtendedUnitTypeId in the `name` field's corresponding enum for future use.
 *
 * Note: Hero units are NOT in this map -- they live in heroArchetypes.ts.
 * This map only contains trainable non-hero units.
 */
export const FACTION_UNITS: Record<number, readonly UnitArchetype[]> = {
  // =========================================================================
  // BRABANDERS
  // =========================================================================
  [ExtendedFactionId.Brabanders]: [
    // Boer (Worker)
    {
      typeId: UnitTypeId.Worker,
      name: 'Boer',
      brabantName: 'Boer',
      hp: 60,
      attack: 5,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Unarmored,
      speed: 5.0,
      range: 0,
      buildTime: 15,
      costGold: 50,
      costSecondary: 0,
      population: 1,
      sightRange: 8,
      carryCapacity: 10,
    },
    // Carnavalvierder (Infantry -- melee)
    {
      typeId: UnitTypeId.Infantry,
      name: 'Carnavalvierder',
      brabantName: 'Carnavalvierder',
      hp: 80,
      attack: 10,
      attackSpeed: 1.2,
      armor: 1,
      armorType: ArmorType.Light,
      speed: 5.5,
      range: 0,
      buildTime: 18,
      costGold: 75,
      costSecondary: 25,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Kansen (Ranged / Stealth)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Kansen',
      brabantName: 'Kansen',
      hp: 55,
      attack: 12,
      attackSpeed: 1.8,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 6.0,
      range: 8,
      buildTime: 22,
      costGold: 60,
      costSecondary: 40,
      population: 1,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Boerinne (Support / Healer)
    {
      typeId: UnitTypeId.Ranged, // healer uses ranged slot
      name: 'Boerinne',
      brabantName: 'Boerinne',
      hp: 50,
      attack: 8,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 5.0,
      range: 6,
      buildTime: 25,
      costGold: 80,
      costSecondary: 60,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Muzikant (Buffer / Debuffer) [Tier 2]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Muzikant',
      brabantName: 'Muzikant',
      hp: 45,
      attack: 5,
      attackSpeed: 2.0,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 5.0,
      range: 0,
      buildTime: 28,
      costGold: 100,
      costSecondary: 75,
      population: 1,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Tractorrijder (Heavy / Cavalry) [Tier 2]
    {
      typeId: UnitTypeId.Infantry,
      name: 'Tractorrijder',
      brabantName: 'Tractorrijder',
      hp: 200,
      attack: 22,
      attackSpeed: 2.0,
      armor: 4,
      armorType: ArmorType.Heavy,
      speed: 4.0,
      range: 0,
      buildTime: 35,
      costGold: 150,
      costSecondary: 100,
      population: 2,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Frituurmeester (Siege) [Tier 3]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Frituurmeester',
      brabantName: 'Frituurmeester',
      hp: 100,
      attack: 15, // 15 vs units, 45 vs buildings (building bonus handled in combat)
      attackSpeed: 3.0,
      armor: 1,
      armorType: ArmorType.Medium,
      speed: 3.5,
      range: 10,
      buildTime: 40,
      costGold: 200,
      costSecondary: 150,
      population: 3,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Praalwagen (Super Siege) [Tier 3]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Praalwagen',
      brabantName: 'Praalwagen',
      hp: 300,
      attack: 60, // buildings only
      attackSpeed: 4.0,
      armor: 3,
      armorType: ArmorType.Heavy,
      speed: 2.5,
      range: 12,
      buildTime: 55,
      costGold: 300,
      costSecondary: 250,
      population: 4,
      sightRange: 10,
      carryCapacity: 0,
    },
  ],

  // =========================================================================
  // RANDSTAD
  // =========================================================================
  [ExtendedFactionId.Randstad]: [
    // Stagiair (Worker)
    {
      typeId: UnitTypeId.Worker,
      name: 'Stagiair',
      brabantName: 'Stagiair',
      hp: 45,
      attack: 3,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Unarmored,
      speed: 5.5,
      range: 0,
      buildTime: 12,
      costGold: 35,
      costSecondary: 0,
      population: 1,
      sightRange: 8,
      carryCapacity: 8,
    },
    // Manager (Ranged / Debuff)
    {
      typeId: UnitTypeId.Infantry,
      name: 'Manager',
      brabantName: 'Manager',
      hp: 70,
      attack: 9,
      attackSpeed: 1.5,
      armor: 1,
      armorType: ArmorType.Medium,
      speed: 4.5,
      range: 7,
      buildTime: 22,
      costGold: 90,
      costSecondary: 30,
      population: 1,
      sightRange: 9,
      carryCapacity: 0,
    },
    // Consultant (Debuff specialist)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Consultant',
      brabantName: 'Consultant',
      hp: 55,
      attack: 0, // does NO direct damage
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
    // Hipster (Scout) [Tier 2]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Hipster',
      brabantName: 'Hipster',
      hp: 40,
      attack: 6,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 7.5,
      range: 5,
      buildTime: 15,
      costGold: 50,
      costSecondary: 30,
      population: 1,
      sightRange: 14,
      carryCapacity: 0,
    },
    // HR-Medewerker (Support / Healer) [Tier 2]
    {
      typeId: UnitTypeId.Ranged,
      name: 'HR-Medewerker',
      brabantName: 'HR-Medewerker',
      hp: 55,
      attack: 5,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 4.5,
      range: 7,
      buildTime: 25,
      costGold: 90,
      costSecondary: 70,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Corporate Advocaat (Heavy melee) [Tier 2]
    {
      typeId: UnitTypeId.Infantry,
      name: 'Corporate Advocaat',
      brabantName: 'Corporate Advocaat',
      hp: 180,
      attack: 18,
      attackSpeed: 2.0,
      armor: 4,
      armorType: ArmorType.Heavy,
      speed: 3.5,
      range: 0,
      buildTime: 35,
      costGold: 175,
      costSecondary: 125,
      population: 2,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Influencer (Ranged / AoE) [Tier 2]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Influencer',
      brabantName: 'Influencer',
      hp: 45,
      attack: 8,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 5.5,
      range: 8,
      buildTime: 20,
      costGold: 80,
      costSecondary: 60,
      population: 1,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Vastgoedmakelaar (Siege) [Tier 3]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Vastgoedmakelaar',
      brabantName: 'Vastgoedmakelaar',
      hp: 90,
      attack: 10, // 10 vs units, 50 vs buildings
      attackSpeed: 3.5,
      armor: 1,
      armorType: ArmorType.Medium,
      speed: 3.5,
      range: 11,
      buildTime: 45,
      costGold: 225,
      costSecondary: 175,
      population: 3,
      sightRange: 10,
      carryCapacity: 0,
    },
  ],

  // =========================================================================
  // LIMBURGERS
  // =========================================================================
  [ExtendedFactionId.Limburgers]: [
    // Mijnwerker (Worker)
    {
      typeId: UnitTypeId.Worker,
      name: 'Mijnwerker',
      brabantName: 'Mijnwerker',
      hp: 65,
      attack: 7,
      attackSpeed: 1.5,
      armor: 1,
      armorType: ArmorType.Light,
      speed: 4.5,
      range: 0,
      buildTime: 16,
      costGold: 55,
      costSecondary: 0,
      population: 1,
      sightRange: 8,
      carryCapacity: 10,
    },
    // Schutterij (Infantry -- ranged)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Schutterij',
      brabantName: 'Schutterij',
      hp: 70,
      attack: 14,
      attackSpeed: 1.8,
      armor: 1,
      armorType: ArmorType.Medium,
      speed: 4.5,
      range: 9,
      buildTime: 22,
      costGold: 85,
      costSecondary: 35,
      population: 1,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Vlaaienwerper (Ranged / Specialist)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Vlaaienwerper',
      brabantName: 'Vlaaienwerper',
      hp: 50,
      attack: 10,
      attackSpeed: 1.6,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 5.0,
      range: 8,
      buildTime: 18,
      costGold: 65,
      costSecondary: 45,
      population: 1,
      sightRange: 9,
      carryCapacity: 0,
    },
    // Mergelridder (Heavy / Cavalry)
    {
      typeId: UnitTypeId.Infantry,
      name: 'Mergelridder',
      brabantName: 'Mergelridder',
      hp: 250,
      attack: 20,
      attackSpeed: 2.0,
      armor: 5,
      armorType: ArmorType.Heavy,
      speed: 3.0,
      range: 0,
      buildTime: 35,
      costGold: 175,
      costSecondary: 125,
      population: 2,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Kolenbrander (Siege) [Tier 3]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Kolenbrander',
      brabantName: 'Kolenbrander',
      hp: 95,
      attack: 12, // 12 vs units, 48 vs buildings
      attackSpeed: 3.0,
      armor: 1,
      armorType: ArmorType.Medium,
      speed: 3.5,
      range: 10,
      buildTime: 40,
      costGold: 200,
      costSecondary: 150,
      population: 3,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Sjpion (Support / Healer)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Sjpion',
      brabantName: 'Sjpion',
      hp: 55,
      attack: 6,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 5.0,
      range: 7,
      buildTime: 25,
      costGold: 85,
      costSecondary: 65,
      population: 1,
      sightRange: 9,
      carryCapacity: 0,
    },
    // Mijnrat (Stealth / Sabotage) [Tier 3]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Mijnrat',
      brabantName: 'Mijnrat',
      hp: 30,
      attack: 4,
      attackSpeed: 1.2,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 6.0,
      range: 0,
      buildTime: 20,
      costGold: 50,
      costSecondary: 40,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Heuvelansen (Scout) [Tier 1]
    {
      typeId: UnitTypeId.Ranged,
      name: 'Heuvelansen',
      brabantName: 'Heuvelansen',
      hp: 35,
      attack: 5,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 8.0,
      range: 4,
      buildTime: 12,
      costGold: 40,
      costSecondary: 20,
      population: 1,
      sightRange: 14,
      carryCapacity: 0,
    },
  ],

  // =========================================================================
  // BELGEN
  // =========================================================================
  [ExtendedFactionId.Belgen]: [
    // Frietkraamhouder (Worker)
    {
      typeId: UnitTypeId.Worker,
      name: 'Frietkraamhouder',
      brabantName: 'Frietkraamhouder',
      hp: 55,
      attack: 5,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 4.5,
      range: 0,
      buildTime: 15,
      costGold: 50,
      costSecondary: 0,
      population: 1,
      sightRange: 8,
      carryCapacity: 12,
    },
    // Bierbouwer (Infantry -- melee)
    {
      typeId: UnitTypeId.Infantry,
      name: 'Bierbouwer',
      brabantName: 'Bierbouwer',
      hp: 90,
      attack: 12,
      attackSpeed: 1.2,
      armor: 1,
      armorType: ArmorType.Light,
      speed: 5.0,
      range: 0,
      buildTime: 18,
      costGold: 80,
      costSecondary: 30,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Chocolatier (Ranged)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Chocolatier',
      brabantName: 'Chocolatier',
      hp: 50,
      attack: 15,
      attackSpeed: 1.8,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 4.5,
      range: 8,
      buildTime: 22,
      costGold: 100,
      costSecondary: 60,
      population: 1,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Frituurridder (Heavy / Cavalry)
    {
      typeId: UnitTypeId.Infantry,
      name: 'Frituurridder',
      brabantName: 'Frituurridder',
      hp: 220,
      attack: 22,
      attackSpeed: 2.0,
      armor: 4,
      armorType: ArmorType.Heavy,
      speed: 4.0,
      range: 0,
      buildTime: 35,
      costGold: 180,
      costSecondary: 130,
      population: 2,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Manneken Pis-kanon (Siege)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Manneken Pis-kanon',
      brabantName: 'Manneken Pis-kanon',
      hp: 80,
      attack: 12, // 12 vs units, 55 vs buildings
      attackSpeed: 3.0,
      armor: 1,
      armorType: ArmorType.Medium,
      speed: 3.0,
      range: 10,
      buildTime: 40,
      costGold: 200,
      costSecondary: 150,
      population: 3,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Wafelzuster (Support / Healer)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Wafelzuster',
      brabantName: 'Wafelzuster',
      hp: 55,
      attack: 6,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 4.5,
      range: 6,
      buildTime: 25,
      costGold: 90,
      costSecondary: 65,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Dubbele Spion (Stealth / Sabotage)
    {
      typeId: UnitTypeId.Ranged,
      name: 'Dubbele Spion',
      brabantName: 'Dubbele Spion',
      hp: 40,
      attack: 6,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 6.0,
      range: 0,
      buildTime: 28,
      costGold: 90,
      costSecondary: 70,
      population: 1,
      sightRange: 10,
      carryCapacity: 0,
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// FACTION_BUILDINGS -- Complete building data for all 4 factions
// ---------------------------------------------------------------------------

export const FACTION_BUILDINGS: Record<number, readonly BuildingArchetype[]> = {
  // =========================================================================
  // BRABANDERS
  // =========================================================================
  [ExtendedFactionId.Brabanders]: [
    // Boerderij (Town Hall)
    {
      typeId: BuildingTypeId.TownHall,
      name: 'Boerderij',
      brabantName: 'Boerderij',
      hp: 1500,
      costGold: 0,
      costSecondary: 0,
      buildTime: 0,
      sightRange: 12,
      produces: [UnitTypeId.Worker],
    },
    // Cafe (Barracks)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Cafe',
      brabantName: 'Cafe',
      hp: 800,
      costGold: 200,
      costSecondary: 0,
      buildTime: 30,
      sightRange: 10,
      produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    },
    // Bakkerij (Resource gen -- primary)
    {
      typeId: BuildingTypeId.LumberCamp, // resource building slot
      name: 'Bakkerij',
      brabantName: 'Bakkerij',
      hp: 600,
      costGold: 150,
      costSecondary: 50,
      buildTime: 25,
      sightRange: 8,
      produces: [],
    },
    // Brouwerij (Resource gen -- secondary)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Brouwerij',
      brabantName: 'Brouwerij',
      hp: 600,
      costGold: 100,
      costSecondary: 100,
      buildTime: 25,
      sightRange: 8,
      produces: [],
    },
    // Kermistent (Tech / Upgrade)
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Kermistent',
      brabantName: 'Kermistent',
      hp: 700,
      costGold: 250,
      costSecondary: 150,
      buildTime: 40,
      sightRange: 8,
      produces: [],
    },
    // Kerk (Defense tower)
    {
      typeId: BuildingTypeId.Barracks, // defense tower slot
      name: 'Kerk',
      brabantName: 'Kerk',
      hp: 900,
      costGold: 200,
      costSecondary: 200,
      buildTime: 35,
      sightRange: 10,
      produces: [],
    },
    // Feestzaal (Advanced unit building)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Feestzaal',
      brabantName: 'Feestzaal',
      hp: 800,
      costGold: 300,
      costSecondary: 200,
      buildTime: 45,
      sightRange: 10,
      produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    },
    // Dorpsweide (Special -- Gezelligheid burst)
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Dorpsweide',
      brabantName: 'Dorpsweide',
      hp: 400,
      costGold: 150,
      costSecondary: 100,
      buildTime: 20,
      sightRange: 8,
      produces: [],
    },
    // Frietkar (Support -- mobile heal)
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Frietkar',
      brabantName: 'Frietkar',
      hp: 300,
      costGold: 100,
      costSecondary: 50,
      buildTime: 15,
      sightRange: 6,
      produces: [],
    },
    // Boerenhoeve (Housing)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Boerenhoeve',
      brabantName: 'Boerenhoeve',
      hp: 500,
      costGold: 100,
      costSecondary: 50,
      buildTime: 20,
      sightRange: 8,
      produces: [],
    },
    // Houtzagerij (Lumber Camp)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Houtzagerij',
      brabantName: 'Houtzagerij',
      hp: 600,
      costGold: 100,
      costSecondary: 0,
      buildTime: 20,
      sightRange: 8,
      produces: [],
    },
  ],

  // =========================================================================
  // RANDSTAD
  // =========================================================================
  [ExtendedFactionId.Randstad]: [
    // Hoofdkantoor (Town Hall)
    {
      typeId: BuildingTypeId.TownHall,
      name: 'Hoofdkantoor',
      brabantName: 'Hoofdkantoor',
      hp: 1800,
      costGold: 0,
      costSecondary: 0,
      buildTime: 0,
      sightRange: 12,
      produces: [UnitTypeId.Worker],
    },
    // Vergaderzaal (Barracks)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Vergaderzaal',
      brabantName: 'Vergaderzaal',
      hp: 900,
      costGold: 250,
      costSecondary: 0,
      buildTime: 36,
      sightRange: 10,
      produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    },
    // Starbucks (Resource gen + buff)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Starbucks',
      brabantName: 'Starbucks',
      hp: 600,
      costGold: 200,
      costSecondary: 75,
      buildTime: 30,
      sightRange: 8,
      produces: [],
    },
    // Netwerkborrel (Resource gen -- secondary)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Netwerkborrel',
      brabantName: 'Netwerkborrel',
      hp: 600,
      costGold: 150,
      costSecondary: 100,
      buildTime: 30,
      sightRange: 8,
      produces: [],
    },
    // Coworking Space (Tech / Upgrade)
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Coworking Space',
      brabantName: 'Coworking Space',
      hp: 800,
      costGold: 300,
      costSecondary: 175,
      buildTime: 48,
      sightRange: 8,
      produces: [],
    },
    // Parkeergarage (Advanced unit building)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Parkeergarage',
      brabantName: 'Parkeergarage',
      hp: 900,
      costGold: 350,
      costSecondary: 250,
      buildTime: 50,
      sightRange: 10,
      produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    },
    // Vinex-wijk (Housing)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Vinex-wijk',
      brabantName: 'Vinex-wijk',
      hp: 600,
      costGold: 125,
      costSecondary: 75,
      buildTime: 24,
      sightRange: 8,
      produces: [],
    },
    // Kantoor-toren (Defense tower)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Kantoor-toren',
      brabantName: 'Kantoor-toren',
      hp: 1000,
      costGold: 250,
      costSecondary: 250,
      buildTime: 40,
      sightRange: 12,
      produces: [],
    },
  ],

  // =========================================================================
  // LIMBURGERS
  // =========================================================================
  [ExtendedFactionId.Limburgers]: [
    // Mergelhoeve (Town Hall)
    {
      typeId: BuildingTypeId.TownHall,
      name: 'Mergelhoeve',
      brabantName: 'Mergelhoeve',
      hp: 1600,
      costGold: 0,
      costSecondary: 0,
      buildTime: 0,
      sightRange: 12,
      produces: [UnitTypeId.Worker],
    },
    // Schuttershal (Barracks)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Schuttershal',
      brabantName: 'Schuttershal',
      hp: 850,
      costGold: 225,
      costSecondary: 0,
      buildTime: 32,
      sightRange: 10,
      produces: [UnitTypeId.Ranged], // Schutterij, Vlaaienwerper, Heuvelansen
    },
    // Vlaaibakkerij (Resource gen -- primary)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Vlaaibakkerij',
      brabantName: 'Vlaaibakkerij',
      hp: 600,
      costGold: 150,
      costSecondary: 50,
      buildTime: 25,
      sightRange: 8,
      produces: [],
    },
    // Mergelgroeve (Resource gen -- secondary)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Mergelgroeve',
      brabantName: 'Mergelgroeve',
      hp: 600,
      costGold: 100,
      costSecondary: 100,
      buildTime: 25,
      sightRange: 8,
      produces: [],
    },
    // Mijnschacht (Tertiary resource + Tunnel)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Mijnschacht',
      brabantName: 'Mijnschacht',
      hp: 750,
      costGold: 200,
      costSecondary: 150,
      buildTime: 40,
      sightRange: 8,
      produces: [],
    },
    // Grot (Tunnel endpoint)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Grot',
      brabantName: 'Grot',
      hp: 500,
      costGold: 150,
      costSecondary: 100,
      buildTime: 30,
      sightRange: 4,
      produces: [],
    },
    // Klooster (Tech / Upgrade)
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Klooster',
      brabantName: 'Klooster',
      hp: 800,
      costGold: 275,
      costSecondary: 175,
      buildTime: 45,
      sightRange: 8,
      produces: [],
    },
    // Wachttoren (Defense tower)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Wachttoren',
      brabantName: 'Wachttoren',
      hp: 900,
      costGold: 200,
      costSecondary: 200,
      buildTime: 35,
      sightRange: 12,
      produces: [],
    },
    // Mijnwerkerskamp (Advanced unit building)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Mijnwerkerskamp',
      brabantName: 'Mijnwerkerskamp',
      hp: 850,
      costGold: 325,
      costSecondary: 225,
      buildTime: 48,
      sightRange: 10,
      produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    },
    // Huuske (Housing)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Huuske',
      brabantName: 'Huuske',
      hp: 500,
      costGold: 100,
      costSecondary: 50,
      buildTime: 20,
      sightRange: 8,
      produces: [],
    },
  ],

  // =========================================================================
  // BELGEN
  // =========================================================================
  [ExtendedFactionId.Belgen]: [
    // Stadhuis (Town Hall)
    {
      typeId: BuildingTypeId.TownHall,
      name: 'Stadhuis',
      brabantName: 'Stadhuis',
      hp: 1600,
      costGold: 0,
      costSecondary: 0,
      buildTime: 0,
      sightRange: 12,
      produces: [UnitTypeId.Worker],
    },
    // Frituur (Barracks)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Frituur',
      brabantName: 'Frituur',
      hp: 850,
      costGold: 200,
      costSecondary: 0,
      buildTime: 32,
      sightRange: 10,
      produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    },
    // Abdij (Resource gen -- secondary / Trappist)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Abdij',
      brabantName: 'Abdij',
      hp: 650,
      costGold: 150,
      costSecondary: 75,
      buildTime: 28,
      sightRange: 8,
      produces: [],
    },
    // Frietfabriek (Resource gen -- primary / Frieten)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Frietfabriek',
      brabantName: 'Frietfabriek',
      hp: 600,
      costGold: 125,
      costSecondary: 50,
      buildTime: 25,
      sightRange: 8,
      produces: [],
    },
    // Chocolaterie (Tertiary resource)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Chocolaterie',
      brabantName: 'Chocolaterie',
      hp: 600,
      costGold: 200,
      costSecondary: 100,
      buildTime: 30,
      sightRange: 8,
      produces: [],
    },
    // EU-Parlement (Tech / Upgrade)
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'EU-Parlement',
      brabantName: 'EU-Parlement',
      hp: 800,
      costGold: 300,
      costSecondary: 175,
      buildTime: 45,
      sightRange: 8,
      produces: [],
    },
    // Rijschool (Advanced unit building)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Rijschool',
      brabantName: 'Rijschool',
      hp: 800,
      costGold: 300,
      costSecondary: 200,
      buildTime: 42,
      sightRange: 10,
      produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    },
    // Wafelkraam (Support -- mobile heal)
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Wafelkraam',
      brabantName: 'Wafelkraam',
      hp: 300,
      costGold: 100,
      costSecondary: 50,
      buildTime: 15,
      sightRange: 6,
      produces: [],
    },
    // Brusselse Woning (Housing)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Brusselse Woning',
      brabantName: 'Brusselse Woning',
      hp: 500,
      costGold: 100,
      costSecondary: 50,
      buildTime: 20,
      sightRange: 8,
      produces: [],
    },
    // Surrealistisch Atelier (Special unit building)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Surrealistisch Atelier',
      brabantName: 'Surrealistisch Atelier',
      hp: 700,
      costGold: 250,
      costSecondary: 200,
      buildTime: 40,
      sightRange: 10,
      produces: [UnitTypeId.Ranged],
    },
    // Commissiegebouw (Defense tower)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Commissiegebouw',
      brabantName: 'Commissiegebouw',
      hp: 900,
      costGold: 225,
      costSecondary: 225,
      buildTime: 35,
      sightRange: 10,
      produces: [],
    },
    // Diplomatiek Salon (Diplomatie hub -- Tier 3)
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Diplomatiek Salon',
      brabantName: 'Diplomatiek Salon',
      hp: 750,
      costGold: 350,
      costSecondary: 250,
      buildTime: 50,
      sightRange: 10,
      produces: [],
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Get all unit archetypes for a given faction.
 * @param factionId - ExtendedFactionId (0-3) or FactionId (0-1)
 */
export function getUnitsForFaction(factionId: number): readonly UnitArchetype[] {
  const units = FACTION_UNITS[factionId];
  if (!units) {
    throw new Error(`Unknown factionId: ${factionId}. Expected 0-3 (Brabanders, Randstad, Limburgers, Belgen).`);
  }
  return units;
}

/**
 * Get all building archetypes for a given faction.
 * @param factionId - ExtendedFactionId (0-3) or FactionId (0-1)
 */
export function getBuildingsForFaction(factionId: number): readonly BuildingArchetype[] {
  const buildings = FACTION_BUILDINGS[factionId];
  if (!buildings) {
    throw new Error(`Unknown factionId: ${factionId}. Expected 0-3 (Brabanders, Randstad, Limburgers, Belgen).`);
  }
  return buildings;
}

/**
 * Get a specific unit archetype by faction and unit name.
 * Searches by the `name` field (case-insensitive).
 *
 * @param factionId - ExtendedFactionId (0-3)
 * @param unitName - Unit name (e.g. 'Boer', 'Mijnwerker', 'Stagiair')
 * @returns The matching UnitArchetype
 * @throws Error if not found
 */
export function getFactionUnitByName(factionId: number, unitName: string): UnitArchetype {
  const units = getUnitsForFaction(factionId);
  const lowerName = unitName.toLowerCase();
  let found: UnitArchetype | undefined;
  for (let i = 0; i < units.length; i++) {
    if (units[i].name.toLowerCase() === lowerName) {
      found = units[i];
      break;
    }
  }
  if (!found) {
    const names: string[] = [];
    for (let i = 0; i < units.length; i++) names.push(units[i].name);
    throw new Error(
      `Unit "${unitName}" not found for faction ${factionId}. Available: ${names.join(', ')}`,
    );
  }
  return found;
}

/**
 * Get a specific unit archetype by faction and UnitTypeId.
 * Returns the FIRST matching unit with that typeId for the faction.
 * For factions with multiple units sharing a typeId (e.g. multiple Ranged units),
 * use getFactionUnitByName() or getUnitsForFaction() instead.
 *
 * @param factionId - ExtendedFactionId (0-3)
 * @param unitTypeId - UnitTypeId enum value (Worker, Infantry, Ranged)
 * @returns The first matching UnitArchetype
 * @throws Error if not found
 */
export function getFactionUnitArchetype(factionId: number, unitTypeId: UnitTypeId): UnitArchetype {
  const units = getUnitsForFaction(factionId);
  for (let i = 0; i < units.length; i++) {
    if (units[i].typeId === unitTypeId) return units[i];
  }
  throw new Error(`No unit with typeId ${unitTypeId} found for faction ${factionId}.`);
}

/**
 * Get a specific building archetype by faction and building name.
 * Searches by the `name` field (case-insensitive).
 *
 * @param factionId - ExtendedFactionId (0-3)
 * @param buildingName - Building name (e.g. 'Boerderij', 'Mergelhoeve')
 * @returns The matching BuildingArchetype
 * @throws Error if not found
 */
export function getFactionBuildingByName(factionId: number, buildingName: string): BuildingArchetype {
  const buildings = getBuildingsForFaction(factionId);
  const lowerName = buildingName.toLowerCase();
  let found: BuildingArchetype | undefined;
  for (let i = 0; i < buildings.length; i++) {
    if (buildings[i].name.toLowerCase() === lowerName) {
      found = buildings[i];
      break;
    }
  }
  if (!found) {
    const names: string[] = [];
    for (let i = 0; i < buildings.length; i++) names.push(buildings[i].name);
    throw new Error(
      `Building "${buildingName}" not found for faction ${factionId}. Available: ${names.join(', ')}`,
    );
  }
  return found;
}

/**
 * Get a specific building archetype by faction and BuildingTypeId.
 * Returns the FIRST matching building with that typeId for the faction.
 *
 * @param factionId - ExtendedFactionId (0-3)
 * @param buildingTypeId - BuildingTypeId enum value
 * @returns The first matching BuildingArchetype
 * @throws Error if not found
 */
export function getFactionBuildingArchetype(
  factionId: number,
  buildingTypeId: BuildingTypeId,
): BuildingArchetype {
  const buildings = getBuildingsForFaction(factionId);
  for (let i = 0; i < buildings.length; i++) {
    if (buildings[i].typeId === buildingTypeId) return buildings[i];
  }
  throw new Error(`No building with typeId ${buildingTypeId} found for faction ${factionId}.`);
}

/**
 * Get all worker-type units across all factions.
 * Useful for comparing faction worker strengths.
 */
export function getAllWorkers(): Array<{ factionId: number; unit: UnitArchetype }> {
  const result: Array<{ factionId: number; unit: UnitArchetype }> = [];
  for (const factionId of [
    ExtendedFactionId.Brabanders,
    ExtendedFactionId.Randstad,
    ExtendedFactionId.Limburgers,
    ExtendedFactionId.Belgen,
  ]) {
    const factionUnits = FACTION_UNITS[factionId];
    if (factionUnits) {
      for (let i = 0; i < factionUnits.length; i++) {
        if (factionUnits[i].typeId === UnitTypeId.Worker) {
          result.push({ factionId, unit: factionUnits[i] });
          break;
        }
      }
    }
  }
  return result;
}

/**
 * Get a faction's Town Hall building archetype.
 * Convenience helper since every faction has exactly one Town Hall.
 */
export function getTownHall(factionId: number): BuildingArchetype {
  return getFactionBuildingArchetype(factionId, BuildingTypeId.TownHall);
}

/**
 * Get a faction's primary barracks building archetype.
 * Convenience helper for the main unit-producing building.
 */
export function getBarracks(factionId: number): BuildingArchetype {
  return getFactionBuildingArchetype(factionId, BuildingTypeId.Barracks);
}
