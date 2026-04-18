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
  MINIMUM_MELEE_RANGE,
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
  Sluiper = 2,              // Ranged stealth
  Boerinneke = 3,             // Support / Healer
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
  Heuvelwacht = 27,         // Scout [Tier 1]
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
  // BRABANDERS -- Average base stats, shine when grouped (Gezelligheid)
  // Strength: Speed & group synergy | Weakness: Low individual armor
  // =========================================================================
  [ExtendedFactionId.Brabanders]: [
    // Boer (Worker) -- balanced worker, average carry
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
      range: MINIMUM_MELEE_RANGE,
      buildTime: 15,
      costGold: 50,
      costSecondary: 0,
      population: 1,
      sightRange: 8,
      carryCapacity: 10,
    },
    // Carnavalvierder (Infantry -- melee) -- fast, mid HP, low armor
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
      range: MINIMUM_MELEE_RANGE,
      buildTime: 18,
      costGold: 75,
      costSecondary: 25,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Sluiper (Ranged / Stealth) -- fast ranged, glass cannon
    {
      typeId: UnitTypeId.Ranged,
      name: 'Sluiper',
      brabantName: 'Sluiper',
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
    // Boerinneke (Support / Healer) -- fragile healer, decent range
    {
      typeId: UnitTypeId.Support,
      name: 'Boerinneke',
      brabantName: 'Boerinneke',
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
      healRate: 7,
    },
    // Muzikant (Buffer / Debuffer) [Tier 2] -- utility, very low combat
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
      range: MINIMUM_MELEE_RANGE,
      buildTime: 28,
      costGold: 100,
      costSecondary: 75,
      population: 1,
      sightRange: 10,
      carryCapacity: 0,
    },
    // Tractorrijder (Heavy / Cavalry) [Tier 2] -- mid-tank, mid-speed for Brabanders
    {
      typeId: UnitTypeId.Heavy,
      name: 'Tractorrijder',
      brabantName: 'Tractorrijder',
      hp: 200,
      attack: 22,
      attackSpeed: 2.0,
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
    // Frituurmeester (Siege) [Tier 3] -- anti-building specialist
    {
      typeId: UnitTypeId.Siege,
      name: 'Frituurmeester',
      brabantName: 'Frituurmeester',
      hp: 100,
      attack: 15,
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
      siegeBonus: 3.0,
      splashRadius: 3,
    },
    // Praalwagen (Super Siege) [Tier 3] -- slow, expensive, building-destroyer
    // Low base attack (anti-unit weak), high siegeBonus compensates vs buildings
    {
      typeId: UnitTypeId.Siege,
      name: 'Praalwagen',
      brabantName: 'Praalwagen',
      hp: 300,
      attack: 15,
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
      siegeBonus: 8.0,
      splashRadius: 5,
    },
  ],

  // =========================================================================
  // RANDSTAD -- Slow start, late-game power. Higher individual stats, expensive.
  // Strength: High individual unit power & range | Weakness: Slow speed, expensive early game
  // =========================================================================
  [ExtendedFactionId.Randstad]: [
    // Stagiair (Worker) -- cheap but fragile, low carry
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
      range: MINIMUM_MELEE_RANGE,
      buildTime: 12,
      costGold: 35,
      costSecondary: 0,
      population: 1,
      sightRange: 8,
      carryCapacity: 8,
    },
    // Manager (Ranged / Debuff) -- strong ranged harasser, expensive
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
    // Consultant (Debuff specialist) -- 0 direct damage is intentional
    {
      typeId: UnitTypeId.Ranged,
      name: 'Consultant',
      brabantName: 'Consultant',
      hp: 55,
      attack: 0, // does NO direct damage per PRD
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
    // Hipster (Scout) [Tier 2] -- very fast, fragile, great vision
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
    // HR-Medewerker (Support / Healer) [Tier 2] -- better range than Boerinneke, costlier
    {
      typeId: UnitTypeId.Support,
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
      sightRange: 9,
      carryCapacity: 0,
      healRate: 8,
    },
    // Corporate Advocaat (Heavy melee) [Tier 2] -- expensive powerhouse
    {
      typeId: UnitTypeId.Heavy,
      name: 'Corporate Advocaat',
      brabantName: 'Corporate Advocaat',
      hp: 180,
      attack: 18,
      attackSpeed: 2.0,
      armor: 4,
      armorType: ArmorType.Heavy,
      speed: 3.5,
      range: MINIMUM_MELEE_RANGE,
      buildTime: 35,
      costGold: 175,
      costSecondary: 125,
      population: 2,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Influencer (Ranged / AoE) [Tier 2] -- high range, glass cannon
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
    // Vastgoedmakelaar (Siege) [Tier 3] -- longest range siege, slow fire rate
    {
      typeId: UnitTypeId.Siege,
      name: 'Vastgoedmakelaar',
      brabantName: 'Vastgoedmakelaar',
      hp: 90,
      attack: 10, // 10 vs units, 40 vs buildings (4x siegeBonus)
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
      siegeBonus: 4.0,
      splashRadius: 4,
    },
  ],

  // =========================================================================
  // LIMBURGERS -- Durable but slow. High HP/Armor, low speed. Cheaper units.
  // Strength: HP & Armor (tankiest faction) | Weakness: Speed (slowest faction)
  // =========================================================================
  [ExtendedFactionId.Limburgers]: [
    // Mijnwerker (Worker) -- toughest worker, slow, armored
    {
      typeId: UnitTypeId.Worker,
      name: 'Mijnwerker',
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
    // Schutterij (Infantry -- melee) -- durable melee, slow, armored
    {
      typeId: UnitTypeId.Infantry,
      name: 'Schutterij',
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
    // Vlaaienwerper (Ranged / Specialist) -- AoE debuffer
    {
      typeId: UnitTypeId.Ranged,
      name: 'Vlaaienwerper',
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
    // Mergelridder (Heavy / Cavalry) -- tankiest unit in the game, slow
    {
      typeId: UnitTypeId.Heavy,
      name: 'Mergelridder',
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
    // Kolenbrander (Siege) [Tier 3] -- durable siege, DoT damage
    {
      typeId: UnitTypeId.Siege,
      name: 'Kolenbrander',
      brabantName: 'Kolenbrander',
      hp: 110,
      attack: 12, // 12 vs units, 48 vs buildings (4x siegeBonus)
      attackSpeed: 3.0,
      armor: 2,
      armorType: ArmorType.Medium,
      speed: 3.0,
      range: 10,
      buildTime: 40,
      costGold: 180,
      costSecondary: 130,
      population: 3,
      sightRange: 9,
      carryCapacity: 0,
      siegeBonus: 4.0,
      splashRadius: 3,
    },
    // Sjpion (Support / Healer) -- sturdy healer, moderate speed
    {
      typeId: UnitTypeId.Support,
      name: 'Sjpion',
      brabantName: 'Sjpion',
      hp: 60,
      attack: 6,
      attackSpeed: 1.5,
      armor: 1,
      armorType: ArmorType.Light,
      speed: 4.5,
      range: 7,
      buildTime: 25,
      costGold: 80,
      costSecondary: 55,
      population: 1,
      sightRange: 9,
      carryCapacity: 0,
      healRate: 7,
    },
    // Mijnrat (Stealth / Sabotage) [Tier 3] -- exception to slow rule: fast saboteur
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
      range: MINIMUM_MELEE_RANGE,
      buildTime: 20,
      costGold: 50,
      costSecondary: 40,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
    },
    // Heuvelwacht (Scout) [Tier 1] -- exception: fast scout, signature Limburgers unit
    {
      typeId: UnitTypeId.Ranged,
      name: 'Heuvelwacht',
      brabantName: 'Heuvelwacht',
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
  // BELGEN -- Versatile but fragile. High damage, low HP. Medium cost.
  // Strength: Damage output & versatility | Weakness: Low HP (most fragile faction)
  // =========================================================================
  [ExtendedFactionId.Belgen]: [
    // Frietkraamhouder (Worker) -- balanced, good economy
    {
      typeId: UnitTypeId.Worker,
      name: 'Frietkraamhouder',
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
    // Bierbouwer (Infantry -- melee) -- fast attacker, balanced
    {
      typeId: UnitTypeId.Infantry,
      name: 'Bierbouwer',
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
    // Chocolatier (Ranged) -- balanced ranged, good support
    {
      typeId: UnitTypeId.Ranged,
      name: 'Chocolatier',
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
    // Frituurridder (Heavy / Cavalry) -- balanced heavy, lower armor than Mergelridder
    {
      typeId: UnitTypeId.Heavy,
      name: 'Frituurridder',
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
    // Manneken Pis-kanon (Siege) -- highest building DPS, fragile glass cannon
    // Low base attack (anti-unit weak), high siegeBonus compensates vs buildings
    {
      typeId: UnitTypeId.Siege,
      name: 'Manneken Pis-kanon',
      brabantName: 'Manneken Pis-kanon',
      hp: 80,
      attack: 12,
      attackSpeed: 3.0,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 3.0,
      range: 10,
      buildTime: 40,
      costGold: 200,
      costSecondary: 150,
      population: 3,
      sightRange: 10,
      carryCapacity: 0,
      siegeBonus: 6.0,
      splashRadius: 3,
    },
    // Wafelzuster (Support / Healer) -- fast heal cycle, fragile
    {
      typeId: UnitTypeId.Support,
      name: 'Wafelzuster',
      brabantName: 'Wafelzuster',
      hp: 45,
      attack: 5,
      attackSpeed: 1.5,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 4.8,
      range: 6,
      buildTime: 24,
      costGold: 85,
      costSecondary: 60,
      population: 1,
      sightRange: 8,
      carryCapacity: 0,
      healRate: 7,
    },
    // Dubbele Spion (Stealth / Sabotage) -- infiltrator, fragile but fast
    {
      typeId: UnitTypeId.Ranged,
      name: 'Dubbele Spion',
      brabantName: 'Dubbele Spion',
      hp: 40,
      attack: 6,
      attackSpeed: 1.3,
      armor: 0,
      armorType: ArmorType.Light,
      speed: 6.0,
      range: MINIMUM_MELEE_RANGE,
      buildTime: 26,
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
      name: 'Kerktoren',
      brabantName: 'Kerktoren',
      hp: 900,
      costGold: 200,
      costSecondary: 200,
      buildTime: 35,
      sightRange: 10,
      produces: [],
    },
    // Feestzaal (Advanced unit building -- trains Heavy units, Tier 3)
    {
      typeId: BuildingTypeId.FactionSpecial2,
      name: 'Feestzaal',
      brabantName: 'Feestzaal',
      hp: 800,
      costGold: 300,
      costSecondary: 200,
      buildTime: 45,
      sightRange: 10,
      produces: [UnitTypeId.Heavy],
    },
    // Tractorschuur (Siege workshop -- trains Siege units, Tier 3)
    {
      typeId: BuildingTypeId.SiegeWorkshop,
      name: 'Tractorschuur',
      brabantName: 'Tractorschuur',
      hp: 750,
      costGold: 325,
      costSecondary: 225,
      buildTime: 45,
      sightRange: 9,
      produces: [UnitTypeId.Siege],
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
    // Hoofdkantoor (Town Hall) -- Randstad buildings are sturdier but more expensive
    {
      typeId: BuildingTypeId.TownHall,
      name: 'Hoofdkantoor',
      brabantName: 'Hoofdkantoor',
      hp: 1700,
      costGold: 0,
      costSecondary: 0,
      buildTime: 0,
      sightRange: 12,
      produces: [UnitTypeId.Worker],
    },
    // Vergaderzaal (Barracks) -- expensive but high HP
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
    // Coworking Space (Tech / Upgrade) -- most expensive tech building
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
    // Parkeergarage (Advanced unit building -- trains Heavy units, Tier 3)
    {
      typeId: BuildingTypeId.FactionSpecial2,
      name: 'Parkeergarage',
      brabantName: 'Parkeergarage',
      hp: 900,
      costGold: 350,
      costSecondary: 250,
      buildTime: 50,
      sightRange: 10,
      produces: [UnitTypeId.Heavy],
    },
    // Sloopwerf (Siege workshop -- trains Siege units, Tier 3)
    {
      typeId: BuildingTypeId.SiegeWorkshop,
      name: 'Sloopwerf',
      brabantName: 'Sloopwerf',
      hp: 850,
      costGold: 375,
      costSecondary: 275,
      buildTime: 50,
      sightRange: 9,
      produces: [UnitTypeId.Siege],
    },
    // Vinex-wijk (Housing)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Vinex-wijk',
      brabantName: 'Vinex-wijk',
      hp: 550,
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
    // Mergelhoeve (Town Hall) -- Limburgers buildings are tankiest
    {
      typeId: BuildingTypeId.TownHall,
      name: 'Mergelhoeve',
      brabantName: 'Mergelhoeve',
      hp: 1800,
      costGold: 0,
      costSecondary: 0,
      buildTime: 0,
      sightRange: 11,
      produces: [UnitTypeId.Worker],
    },
    // Schuttershal (Barracks) -- high HP barracks
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Schuttershal',
      brabantName: 'Schuttershal',
      hp: 950,
      costGold: 200,
      costSecondary: 0,
      buildTime: 34,
      sightRange: 10,
      produces: [UnitTypeId.Ranged], // Schutterij, Vlaaienwerper, Heuvelwacht
    },
    // Vlaaibakkerij (Resource gen -- primary) -- sturdy resource building
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Vlaaibakkerij',
      brabantName: 'Vlaaibakkerij',
      hp: 700,
      costGold: 130,
      costSecondary: 40,
      buildTime: 25,
      sightRange: 8,
      produces: [],
    },
    // Mergelgroeve (Resource gen -- secondary)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Mergelgroeve',
      brabantName: 'Mergelgroeve',
      hp: 700,
      costGold: 90,
      costSecondary: 90,
      buildTime: 25,
      sightRange: 8,
      produces: [],
    },
    // Mijnschacht (Tertiary resource + Tunnel) -- key strategic building
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Mijnschacht',
      brabantName: 'Mijnschacht',
      hp: 850,
      costGold: 175,
      costSecondary: 125,
      buildTime: 40,
      sightRange: 8,
      produces: [],
    },
    // Grot (Tunnel endpoint) -- cheaper tunnel endpoint, moderate HP
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Grot',
      brabantName: 'Grot',
      hp: 550,
      costGold: 125,
      costSecondary: 75,
      buildTime: 28,
      sightRange: 4,
      produces: [],
    },
    // Klooster (Tech / Upgrade) -- sturdy tech building
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Klooster',
      brabantName: 'Klooster',
      hp: 900,
      costGold: 250,
      costSecondary: 150,
      buildTime: 45,
      sightRange: 8,
      produces: [],
    },
    // Wachttoren (Defense tower) -- strongest defense tower
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Wachttoren',
      brabantName: 'Wachttoren',
      hp: 1050,
      costGold: 200,
      costSecondary: 175,
      buildTime: 35,
      sightRange: 12,
      produces: [],
    },
    // Mijnwerkerskamp (Advanced unit building -- trains Heavy units, Tier 3)
    {
      typeId: BuildingTypeId.FactionSpecial2,
      name: 'Mijnwerkerskamp',
      brabantName: 'Mijnwerkerskamp',
      hp: 950,
      costGold: 300,
      costSecondary: 200,
      buildTime: 46,
      sightRange: 10,
      produces: [UnitTypeId.Heavy],
    },
    // Steengroeve (Siege workshop -- trains Siege units, Tier 3)
    {
      typeId: BuildingTypeId.SiegeWorkshop,
      name: 'Steengroeve',
      brabantName: 'Steengroeve',
      hp: 900,
      costGold: 325,
      costSecondary: 225,
      buildTime: 46,
      sightRange: 9,
      produces: [UnitTypeId.Siege],
    },
    // Huuske (Housing) -- sturdy but cheap housing
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Huuske',
      brabantName: 'Huuske',
      hp: 550,
      costGold: 85,
      costSecondary: 40,
      buildTime: 20,
      sightRange: 8,
      produces: [],
    },
  ],

  // =========================================================================
  // BELGEN
  // =========================================================================
  [ExtendedFactionId.Belgen]: [
    // Stadhuis (Town Hall) -- Belgen buildings are cheaper/faster but lower HP
    {
      typeId: BuildingTypeId.TownHall,
      name: 'Stadhuis',
      brabantName: 'Stadhuis',
      hp: 1400,
      costGold: 0,
      costSecondary: 0,
      buildTime: 0,
      sightRange: 12,
      produces: [UnitTypeId.Worker],
    },
    // Frituur (Barracks) -- cheap barracks, fast build, lower HP
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Frituur',
      brabantName: 'Frituur',
      hp: 750,
      costGold: 175,
      costSecondary: 0,
      buildTime: 28,
      sightRange: 10,
      produces: [UnitTypeId.Infantry, UnitTypeId.Ranged],
    },
    // Abdij (Resource gen -- secondary / Trappist) -- cheap resource building
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Abdij',
      brabantName: 'Abdij',
      hp: 550,
      costGold: 130,
      costSecondary: 60,
      buildTime: 25,
      sightRange: 8,
      produces: [],
    },
    // Frietfabriek (Resource gen -- primary / Frieten)
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Frietfabriek',
      brabantName: 'Frietfabriek',
      hp: 500,
      costGold: 110,
      costSecondary: 40,
      buildTime: 22,
      sightRange: 8,
      produces: [],
    },
    // Chocolaterie (Tertiary resource) -- key strategic building, medium HP
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Chocolaterie',
      brabantName: 'Chocolaterie',
      hp: 550,
      costGold: 180,
      costSecondary: 90,
      buildTime: 28,
      sightRange: 8,
      produces: [],
    },
    // EU-Parlement (Tech / Upgrade) -- expensive but crucial
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'EU-Parlement',
      brabantName: 'EU-Parlement',
      hp: 700,
      costGold: 275,
      costSecondary: 150,
      buildTime: 42,
      sightRange: 8,
      produces: [],
    },
    // Rijschool (Advanced unit building -- trains Heavy units, Tier 3)
    {
      typeId: BuildingTypeId.FactionSpecial2,
      name: 'Rijschool',
      brabantName: 'Rijschool',
      hp: 700,
      costGold: 275,
      costSecondary: 175,
      buildTime: 42,
      sightRange: 10,
      produces: [UnitTypeId.Heavy],
    },
    // Frituurkanon-werkplaats (Siege workshop -- trains Siege units, Tier 3)
    {
      typeId: BuildingTypeId.SiegeWorkshop,
      name: 'Frituurkanon-werkplaats',
      brabantName: 'Frituurkanon-werkplaats',
      hp: 700,
      costGold: 300,
      costSecondary: 200,
      buildTime: 42,
      sightRange: 9,
      produces: [UnitTypeId.Siege],
    },
    // Wafelkraam (Support -- mobile heal) -- cheap, fragile
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Wafelkraam',
      brabantName: 'Wafelkraam',
      hp: 250,
      costGold: 80,
      costSecondary: 40,
      buildTime: 12,
      sightRange: 6,
      produces: [],
    },
    // Brusselse Woning (Housing) -- cheap housing
    {
      typeId: BuildingTypeId.LumberCamp,
      name: 'Brusselse Woning',
      brabantName: 'Brusselse Woning',
      hp: 450,
      costGold: 85,
      costSecondary: 40,
      buildTime: 18,
      sightRange: 8,
      produces: [],
    },
    // Surrealistisch Atelier (Special unit building)
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Surrealistisch Atelier',
      brabantName: 'Surrealistisch Atelier',
      hp: 600,
      costGold: 225,
      costSecondary: 175,
      buildTime: 36,
      sightRange: 10,
      produces: [UnitTypeId.Ranged],
    },
    // Commissiegebouw (Defense tower) -- moderate defense
    {
      typeId: BuildingTypeId.Barracks,
      name: 'Commissiegebouw',
      brabantName: 'Commissiegebouw',
      hp: 800,
      costGold: 200,
      costSecondary: 200,
      buildTime: 32,
      sightRange: 10,
      produces: [],
    },
    // Diplomatiek Salon (Diplomatie hub -- Tier 3) -- expensive strategic building
    {
      typeId: BuildingTypeId.Blacksmith,
      name: 'Diplomatiek Salon',
      brabantName: 'Diplomatiek Salon',
      hp: 650,
      costGold: 325,
      costSecondary: 225,
      buildTime: 46,
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
