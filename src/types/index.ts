/**
 * Reign of Brabant -- Type System
 *
 * All enums, interfaces, and type definitions for the game.
 * This is the single source of truth for game data types.
 *
 * Supports 4 factions: Brabanders, Randstad, Limburgers, Belgen.
 * Each faction has unique resource names, tertiary resources, and upgrades.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Faction identifiers.
 * 4 playable factions, with AI as backwards-compatible alias for Randstad.
 */
export enum FactionId {
  Brabanders = 0,
  Randstad = 1,
  Limburgers = 2,
  Belgen = 3,
  /** @deprecated Use Randstad instead. Kept for backwards compatibility. */
  AI = 1,
}

/**
 * Unit type identifiers -- matches archetype data arrays.
 *
 * Range 0-9: Universal types shared across all factions.
 * Faction-specific unit flavours are resolved via FactionConfig lookup,
 * not via separate enum values (keeps ECS u8 components compact).
 */
export enum UnitTypeId {
  /** Resource gatherer / builder. */
  Worker = 0,
  /** Melee combat unit. */
  Infantry = 1,
  /** Ranged combat unit. */
  Ranged = 2,
  /** Heavy melee unit (high HP, slow). */
  Heavy = 3,
  /** Siege unit (bonus vs buildings). */
  Siege = 4,
  /** Support / healer unit. */
  Support = 5,
  /** Faction-unique special unit. */
  Special = 6,
  /** Hero unit (spawned from TownHall, unique abilities). */
  Hero = 7,
}

/** Hero type identifiers. */
export enum HeroTypeId {
  // Brabanders heroes
  PrinsVanBrabansen = 0,
  BoerVanBrabansen = 1,
  // Randstad heroes
  DeCEO = 2,
  DePoliticus = 3,
  // Limburgers heroes
  DeMijnwerker = 4,
  DeVlaaibaas = 5,
  // Belgen heroes
  DeChocolatier = 6,
  DeFrituur = 7,
}

/**
 * Building type identifiers -- matches archetype data arrays.
 *
 * 0-3: Original buildings (backwards compatible).
 * 4-8: New building types for full game.
 */
export enum BuildingTypeId {
  /** Main base building. Deposits resources, produces workers/heroes. */
  TownHall = 0,
  /** Military production building. */
  Barracks = 1,
  /** Wood harvesting drop-off point. */
  LumberCamp = 2,
  /** Research building for upgrades. */
  Blacksmith = 3,
  /** Population capacity building. */
  Housing = 4,
  /** Tertiary resource generation building (faction-specific). */
  TertiaryResourceBuilding = 5,
  /** Advanced research / upgrade building. */
  UpgradeBuilding = 6,
  /** First faction-specific special building. */
  FactionSpecial1 = 7,
  /** Second faction-specific special building. */
  FactionSpecial2 = 8,
}

/**
 * Upgrade identifiers for the tech tree.
 *
 * 0-6: Universal upgrades (backwards compatible).
 * 10-19: Brabanders faction upgrades.
 * 20-29: Randstad faction upgrades.
 * 30-39: Limburgers faction upgrades.
 * 40-49: Belgen faction upgrades.
 */
export enum UpgradeId {
  // --- Universal upgrades (0-6, unchanged) ---
  MeleeAttack1 = 0,
  MeleeAttack2 = 1,
  RangedAttack1 = 2,
  RangedAttack2 = 3,
  ArmorUpgrade1 = 4,
  ArmorUpgrade2 = 5,
  MoveSpeed1 = 6,

  // --- Brabanders faction upgrades (10-19) ---
  /** Increases Gezelligheid generation rate. */
  GezelligheidsBoost = 10,
  /** Unlocks the Carnavalsrage ability. */
  Carnavalsrage = 11,
  /** Workers carry more resources. */
  BrabantseVlijt = 12,
  /** Infantry gains bonus damage when grouped. */
  SamenSterk = 13,

  // --- Randstad faction upgrades (20-29) ---
  /** Reduces Bureaucracy penalty. */
  EfficiencyConsultant = 20,
  /** Buildings produce units faster. */
  Agile = 21,
  /** Ranged units gain extra range. */
  PowerPointMastery = 22,
  /** Unlocks the Eindeloze Vergadering ability. */
  VergaderingProtocol = 23,

  // --- Limburgers faction upgrades (30-39) ---
  /** Increases Kolen generation rate. */
  DiepeSchacht = 30,
  /** Heavy units gain extra armor. */
  MergelPantsering = 31,
  /** Workers mine gold faster. */
  VlaaiMotivatie = 32,
  /** Siege units deal bonus damage to buildings. */
  Mijnbouwexplosief = 33,

  // --- Belgen faction upgrades (40-49) ---
  /** Increases Chocolade generation rate. */
  PralineProductie = 40,
  /** All units heal slowly over time. */
  BelgischeVerzetskracht = 41,
  /** Unlocks Trappist-powered unit buff. */
  TrappistBrouwerij = 42,
  /** Buildings cost less wood. */
  FritenvetFundering = 43,
}

/**
 * Resource types.
 *
 * 0-1: Primary resources shared by all factions (with faction-flavoured names).
 * 2-5: Tertiary resources, one per faction.
 */
export enum ResourceType {
  /** Primary resource. Worstenbroodjes / PowerPoints / Vlaai / Frieten. */
  Gold = 0,
  /** Secondary resource. Bier / LinkedIn / Mergel / Trappist. */
  Wood = 1,
  /** Brabanders tertiary resource. */
  Gezelligheid = 2,
  /** Limburgers tertiary resource. */
  Kolen = 3,
  /** Belgen tertiary resource. */
  Chocolade = 4,
  /** Randstad tertiary resource. */
  Havermoutmelk = 5,
}

/** Top-level game phase. */
export enum GamePhase {
  Loading = 0,
  Playing = 1,
  Victory = 2,
  Defeat = 3,
  Paused = 4,
}

/** Unit AI finite state machine states. */
export enum UnitAIState {
  Idle = 0,
  Moving = 1,
  Attacking = 2,
  MovingToResource = 3,
  Gathering = 4,
  Returning = 5,
  Dead = 6,
  Stunned = 7,
  Reviving = 8,
}

/** Hero ability slot identifiers (Q, W, E). */
export enum AbilitySlot {
  Q = 0,
  W = 1,
  E = 2,
}

/** Ability target type. */
export enum AbilityTargetType {
  /** No target needed (self / aura). */
  Self = 0,
  /** AoE around self. */
  SelfAoE = 1,
  /** Targeted on an enemy unit/building. */
  TargetEnemy = 2,
  /** Targeted on an ally. */
  TargetAlly = 3,
  /** AoE at a position. */
  PositionAoE = 4,
  /** Directional cone. */
  Cone = 5,
  /** Line charge. */
  Line = 6,
}

/** Strategic AI phases (scripted build order progression). */
export enum StrategicAIPhase {
  Opening = 0,
  Midgame = 1,
  Attack = 2,
}

/** Armor type classification for damage modifiers (future use, tracked now). */
export enum ArmorType {
  Unarmored = 0,
  Light = 1,
  Medium = 2,
  Heavy = 3,
}

// ---------------------------------------------------------------------------
// Constants -- Sentinel values
// ---------------------------------------------------------------------------

/** Sentinel: no entity target. */
export const NO_ENTITY = 0xffffffff; // u32 max

/** Sentinel: no unit being produced. */
export const NO_PRODUCTION = 0xff; // u8 max = 255

/** Max entities in the ECS world. */
export const MAX_ENTITIES = 1024;

/** Max production queue slots per building. */
export const MAX_QUEUE_SLOTS = 5;

// ---------------------------------------------------------------------------
// Map Constants
// ---------------------------------------------------------------------------

/** Map size in world units (128x128 flat terrain with hills). */
export const MAP_SIZE = 128;

/** Heightmap resolution matches map size. */
export const HEIGHTMAP_RESOLUTION = 128;

/** Max terrain height (simplex noise scale). */
export const HEIGHT_SCALE = 10;

// ---------------------------------------------------------------------------
// Gather Constants
// ---------------------------------------------------------------------------

/** Resource harvest rate: units per second while gathering. */
export const HARVEST_RATE = 2.0;

/** Default carry capacity for workers. */
export const CARRY_CAPACITY = 10;

/** Distance threshold to start gathering from a resource. */
export const GATHER_ARRIVAL_DISTANCE = 1.5;

/** Distance threshold to deposit resources at Town Hall. */
export const DEPOSIT_ARRIVAL_DISTANCE = 2.0;

// ---------------------------------------------------------------------------
// Combat Constants
// ---------------------------------------------------------------------------

/** Minimum damage per hit (after armor reduction). */
export const MIN_DAMAGE = 1;

/** Armor damage reduction factor: effective_damage = atk - armor * ARMOR_FACTOR. */
export const ARMOR_FACTOR = 0.5;

/** Auto-aggro radius: idle units detect enemies within this range. */
export const AGGRO_RANGE = 8;

/** Death animation duration in seconds before entity removal. */
export const DEATH_TIMER = 2.0;

// ---------------------------------------------------------------------------
// Hero Constants
// ---------------------------------------------------------------------------

/** Hero revive timer in seconds. */
export const HERO_REVIVE_TIME = 60;

/** Max number of ability slots per hero. */
export const MAX_ABILITY_SLOTS = 3;

/** Population cost for heroes. */
export const HERO_POPULATION_COST = 5;

/** Stun state: entity cannot move or attack. */
export const STUN_IMMUNITY_AFTER = 2.0;

// ---------------------------------------------------------------------------
// Bureaucracy Constants (Randstad faction mechanic)
// ---------------------------------------------------------------------------

/** Base duration multiplier for Randstad actions (20% slower). */
export const BUREAUCRACY_BASE_MULTIPLIER = 1.2;

/** Speed bonus per efficiency stack (3% faster per stack). */
export const BUREAUCRACY_STACK_BONUS = 0.03;

/** Maximum efficiency stacks. */
export const BUREAUCRACY_MAX_STACKS = 20;

/** Werkoverleg interval in game-time seconds (5 minutes). */
export const WERKOVERLEG_INTERVAL = 300;

/** Werkoverleg pause duration in seconds. */
export const WERKOVERLEG_DURATION = 8;

/** Eindeloze Vergadering ability radius. */
export const VERGADERING_RADIUS = 15;

/** Eindeloze Vergadering stun duration in seconds. */
export const VERGADERING_STUN_DURATION = 10;

/** Meeting Fatigue debuff duration in seconds. */
export const MEETING_FATIGUE_DURATION = 15;

/** Meeting Fatigue stat reduction (20%). */
export const MEETING_FATIGUE_REDUCTION = 0.20;

/** Eindeloze Vergadering cooldown in seconds. */
export const VERGADERING_COOLDOWN = 240;

/** Eindeloze Vergadering initial availability delay in seconds. */
export const VERGADERING_INITIAL_DELAY = 240;

// ---------------------------------------------------------------------------
// Timing Constants
// ---------------------------------------------------------------------------

/** Max delta time cap (20 FPS minimum sim rate). */
export const MAX_DELTA_TIME = 0.05;

/** Fog of war update frequency (updates per second). */
export const FOW_UPDATE_RATE = 5;

/** Minimap update frequency (updates per second). */
export const MINIMAP_UPDATE_RATE = 5;

/** Strategic AI update frequency (updates per second). */
export const STRATEGIC_AI_UPDATE_RATE = 1;

// ---------------------------------------------------------------------------
// Rendering Constants -- Faction Colors
// ---------------------------------------------------------------------------

export const FACTION_COLORS = {
  [FactionId.Brabanders]: {
    worker: 0xe8a839,
    infantry: 0xe67e22,
    ranged: 0xd35400,
    townHall: 0x8b4513,
    barracks: 0xa0522d,
  },
  [FactionId.Randstad]: {
    worker: 0x3498db,
    infantry: 0x2980b9,
    ranged: 0x1f618d,
    townHall: 0x34495e,
    barracks: 0x2c3e50,
  },
  [FactionId.Limburgers]: {
    worker: 0xc0c0c0,
    infantry: 0x808080,
    ranged: 0x696969,
    townHall: 0x4a4a4a,
    barracks: 0x5c5c5c,
  },
  [FactionId.Belgen]: {
    worker: 0xf0c040,
    infantry: 0xd4a017,
    ranged: 0xb8860b,
    townHall: 0x8b6914,
    barracks: 0x9b7d0a,
  },
} as const;

/**
 * Backwards-compatible alias: FACTION_COLORS[FactionId.AI] resolves to
 * FACTION_COLORS[FactionId.Randstad] because AI = 1 = Randstad.
 */

export const GOLD_MINE_COLOR = 0xffd700;
export const TREE_RESOURCE_COLOR = 0x228b22;

// ---------------------------------------------------------------------------
// Interfaces -- Archetype Data
// ---------------------------------------------------------------------------

/** Static stats for a unit type. Used by factories to initialize ECS components. */
export interface UnitArchetype {
  readonly typeId: UnitTypeId;
  readonly name: string;
  readonly brabantName: string;
  readonly hp: number;
  readonly attack: number;
  readonly attackSpeed: number; // seconds between attacks
  readonly armor: number;
  readonly armorType: ArmorType;
  readonly speed: number; // world units per second
  readonly range: number; // 0 = melee
  readonly buildTime: number; // seconds
  readonly costGold: number;
  readonly costSecondary: number; // not used in PoC (only Gold), kept for data completeness
  readonly population: number;
  readonly sightRange: number;
  readonly carryCapacity: number; // 0 for non-workers
  /** Optional wood cost (defaults to 0 if omitted). */
  readonly costWood?: number;
  /** Optional tertiary resource cost (defaults to 0 if omitted). */
  readonly costTertiary?: number;
  /** Bonus damage multiplier vs buildings (for Siege units). Defaults to 1.0. */
  readonly siegeBonus?: number;
  /** Heal rate per second (for Support units). 0 or omitted = no healing. */
  readonly healRate?: number;
  /** Which faction this archetype belongs to, if faction-specific. Omit for universal. */
  readonly factionId?: FactionId;
}

/** Static stats for a building type. */
export interface BuildingArchetype {
  readonly typeId: BuildingTypeId;
  readonly name: string;
  readonly brabantName: string;
  readonly hp: number;
  readonly costGold: number;
  readonly costSecondary: number;
  readonly buildTime: number; // seconds (0 = pre-placed, like TownHall)
  readonly sightRange: number;
  readonly produces: readonly UnitTypeId[];
  /** Optional wood cost (defaults to 0 if omitted). */
  readonly costWood?: number;
  /** Optional tertiary resource cost (defaults to 0 if omitted). */
  readonly costTertiary?: number;
  /** Population capacity provided by this building (for Housing). Defaults to 0. */
  readonly populationProvided?: number;
  /** Tertiary resource generation rate per second (for TertiaryResourceBuilding). */
  readonly tertiaryGenRate?: number;
  /** Available upgrades that can be researched at this building. */
  readonly researches?: readonly UpgradeId[];
  /** Which faction this archetype belongs to, if faction-specific. Omit for universal. */
  readonly factionId?: FactionId;
}

/** Gold mine definition. */
export interface GoldMineDefinition {
  readonly hp: number; // not destructible in PoC, but tracked
  readonly defaultAmount: number;
  readonly sightRange: number;
}

/** Tree resource definition. */
export interface TreeResourceDefinition {
  readonly hp: number;
  readonly defaultAmount: number;
  readonly sightRange: number;
}

/** Static stats for a hero unit type. */
export interface HeroArchetype {
  readonly heroTypeId: HeroTypeId;
  readonly name: string;
  readonly factionId: FactionId;
  readonly hp: number;
  readonly attack: number;
  readonly attackSpeed: number;
  readonly armor: number;
  readonly armorType: ArmorType;
  readonly speed: number;
  readonly range: number;
  readonly costGold: number;
  readonly costSecondary: number;
  readonly population: number;
  readonly sightRange: number;
  readonly buildTime: number;
  readonly abilities: readonly HeroAbilityDef[];
}

/** Definition of a hero ability. */
export interface HeroAbilityDef {
  readonly id: string;
  readonly name: string;
  readonly slot: AbilitySlot;
  readonly cooldown: number;
  readonly targetType: AbilityTargetType;
  readonly radius: number;
  readonly range: number;
  readonly duration: number;
  readonly description: string;
  /** Optional gezelligheid cost. */
  readonly gezelligheidCost?: number;
}

// ---------------------------------------------------------------------------
// Interfaces -- Faction Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for how a faction's tertiary resource works.
 * Each faction has a unique tertiary resource with different generation mechanics.
 */
export interface TertiaryResourceConfig {
  /** The ResourceType enum value for this faction's tertiary resource. */
  readonly resourceType: ResourceType;
  /** Display name of the tertiary resource. */
  readonly name: string;
  /** How the resource is generated (e.g. "proximity", "building", "combat", "passive"). */
  readonly generationMethod: 'proximity' | 'building' | 'combat' | 'passive';
  /** Base generation rate (units per second). */
  readonly baseRate: number;
  /** Short description of the mechanic for UI tooltips. */
  readonly description: string;
}

/**
 * Static configuration for a faction.
 * Contains all metadata, resource names, colours, and tertiary resource config.
 */
export interface FactionConfig {
  /** Faction enum value. */
  readonly factionId: FactionId;
  /** Display name of the faction. */
  readonly name: string;
  /** Short tagline / description. */
  readonly tagline: string;
  /** Primary colour (hex number for Three.js). */
  readonly primaryColor: number;
  /** Secondary colour (hex number for Three.js). */
  readonly secondaryColor: number;
  /** Faction-flavoured name for the Gold resource. */
  readonly goldName: string;
  /** Faction-flavoured name for the Wood resource. */
  readonly woodName: string;
  /** Tertiary resource configuration. */
  readonly tertiaryResource: TertiaryResourceConfig;
  /** Faction-specific passive description (e.g. Gezelligheid bonus, Bureaucracy). */
  readonly passiveDescription: string;
}

/**
 * Static faction configurations for all 4 factions.
 * Keyed by FactionId for O(1) lookup.
 */
export const FACTION_CONFIGS: Record<FactionId, FactionConfig> = {
  [FactionId.Brabanders]: {
    factionId: FactionId.Brabanders,
    name: 'Brabanders',
    tagline: 'Gezelligheid is onze kracht',
    primaryColor: 0xe67e22,
    secondaryColor: 0xe8a839,
    goldName: 'Worstenbroodjes',
    woodName: 'Bier',
    tertiaryResource: {
      resourceType: ResourceType.Gezelligheid,
      name: 'Gezelligheid',
      generationMethod: 'proximity',
      baseRate: 0.5,
      description: 'Gegenereerd wanneer units dicht bij elkaar staan. Meer units = meer Gezelligheid.',
    },
    passiveDescription: 'Groepsbonus: units nabij elkaar krijgen attack/speed/armor buffs.',
  },
  [FactionId.Randstad]: {
    factionId: FactionId.Randstad,
    name: 'Randstad',
    tagline: 'Efficiency through bureaucracy',
    primaryColor: 0x2980b9,
    secondaryColor: 0x3498db,
    goldName: 'PowerPoints',
    woodName: 'LinkedIn',
    tertiaryResource: {
      resourceType: ResourceType.Havermoutmelk,
      name: 'Havermoutmelk',
      generationMethod: 'passive',
      baseRate: 0.3,
      description: 'Passief gegenereerd over tijd. Versnelt naarmate efficiency stacks toenemen.',
    },
    passiveDescription: 'Bureaucratie: acties starten 20% trager maar versnellen met efficiency stacks.',
  },
  [FactionId.Limburgers]: {
    factionId: FactionId.Limburgers,
    name: 'Limburgers',
    tagline: 'Diep in de aarde, sterk als mergel',
    primaryColor: 0x808080,
    secondaryColor: 0xc0c0c0,
    goldName: 'Vlaai',
    woodName: 'Mergel',
    tertiaryResource: {
      resourceType: ResourceType.Kolen,
      name: 'Kolen',
      generationMethod: 'building',
      baseRate: 0.4,
      description: 'Gegenereerd door Mijnschacht gebouwen. Meer schachten = meer Kolen.',
    },
    passiveDescription: 'Mijnbouw: heavy units zijn goedkoper en sterker. Gebouwen hebben extra HP.',
  },
  [FactionId.Belgen]: {
    factionId: FactionId.Belgen,
    name: 'Belgen',
    tagline: 'Frieten, bier en compromissen',
    primaryColor: 0xd4a017,
    secondaryColor: 0xf0c040,
    goldName: 'Frieten',
    woodName: 'Trappist',
    tertiaryResource: {
      resourceType: ResourceType.Chocolade,
      name: 'Chocolade',
      generationMethod: 'combat',
      baseRate: 0.2,
      description: 'Gegenereerd door vijandelijke units te verslaan. Meer kills = meer Chocolade.',
    },
    passiveDescription: 'Veerkracht: alle units regenereren langzaam HP. Sterkere defence dan offence.',
  },
};

// ---------------------------------------------------------------------------
// Interfaces -- Runtime State
// ---------------------------------------------------------------------------

/** Per-player resource state (managed outside ECS in GameState). */
export interface PlayerResources {
  gold: number;
  wood: number;
  /** Tertiary resource amount (Gezelligheid / Kolen / Chocolade / Havermoutmelk). */
  tertiary: number;
}

/** Per-player population state. */
export interface PlayerPopulation {
  current: number;
  max: number;
}

/** Complete per-player state. */
export interface PlayerState {
  readonly factionId: FactionId;
  resources: PlayerResources;
  population: PlayerPopulation;
}

// ---------------------------------------------------------------------------
// Interfaces -- Upgrade Definition
// ---------------------------------------------------------------------------

/** Static definition of a tech tree upgrade. */
export interface UpgradeDefinition {
  readonly upgradeId: UpgradeId;
  readonly name: string;
  readonly description: string;
  /** Gold cost to research. */
  readonly costGold: number;
  /** Wood cost to research. */
  readonly costWood: number;
  /** Tertiary resource cost to research (0 for universal upgrades). */
  readonly costTertiary: number;
  /** Research time in seconds. */
  readonly researchTime: number;
  /** Which building type this upgrade is researched at. */
  readonly researchedAt: BuildingTypeId;
  /** Required upgrade that must be completed first (undefined = no prerequisite). */
  readonly prerequisite?: UpgradeId;
  /** Which faction this upgrade belongs to (undefined = universal / all factions). */
  readonly factionId?: FactionId;
}

// ---------------------------------------------------------------------------
// Interfaces -- Map
// ---------------------------------------------------------------------------

/** Spawn point for a player on the map. */
export interface SpawnPoint {
  readonly x: number;
  readonly z: number;
  readonly factionId: FactionId;
}

/** Gold mine placement on the map. */
export interface GoldMineSpawn {
  readonly x: number;
  readonly z: number;
  readonly amount: number;
}

/** Tree resource placement on the map. */
export interface TreeResourceSpawn {
  readonly x: number;
  readonly z: number;
  readonly amount: number;
}

/** Complete map definition for game setup. */
export interface MapDefinition {
  readonly size: number;
  readonly heightScale: number;
  readonly spawns: readonly SpawnPoint[];
  readonly goldMines: readonly GoldMineSpawn[];
  readonly treeResources: readonly TreeResourceSpawn[];
}

// ---------------------------------------------------------------------------
// Interfaces -- Events (EventBus payloads)
// ---------------------------------------------------------------------------

export interface UnitDiedEvent {
  readonly entityId: number;
  readonly factionId: FactionId;
  readonly unitTypeId: UnitTypeId;
  readonly killerEntityId: number | null;
}

export interface BuildingPlacedEvent {
  readonly entityId: number;
  readonly factionId: FactionId;
  readonly buildingTypeId: BuildingTypeId;
  readonly x: number;
  readonly z: number;
}

export interface ResourceDepositedEvent {
  readonly factionId: FactionId;
  readonly amount: number;
  readonly resourceType: ResourceType;
}

export interface UnitTrainedEvent {
  readonly entityId: number;
  readonly factionId: FactionId;
  readonly unitTypeId: UnitTypeId;
  readonly buildingEntityId: number;
}

export interface BuildingDestroyedEvent {
  readonly entityId: number;
  readonly factionId: FactionId;
  readonly buildingTypeId: BuildingTypeId;
}

export interface WerkoverlegEvent {
  readonly factionId: FactionId;
  readonly active: boolean;
  /** Entity IDs of affected buildings. */
  readonly buildingEids: readonly number[];
}

export interface VergaderingEvent {
  readonly factionId: FactionId;
  readonly x: number;
  readonly z: number;
  readonly affectedUnits: readonly number[];
}

export interface EfficiencyStackEvent {
  readonly factionId: FactionId;
  readonly stacks: number;
}

export interface HeroDiedEvent {
  readonly entityId: number;
  readonly factionId: FactionId;
  readonly heroTypeId: HeroTypeId;
}

export interface HeroRevivedEvent {
  readonly entityId: number;
  readonly factionId: FactionId;
  readonly heroTypeId: HeroTypeId;
}

export interface HeroAbilityUsedEvent {
  readonly entityId: number;
  readonly factionId: FactionId;
  readonly heroTypeId: HeroTypeId;
  readonly abilityId: string;
  readonly abilitySlot: AbilitySlot;
}

export interface CombatHitEvent {
  readonly attackerEid: number;
  readonly targetEid: number;
  readonly isRanged: boolean;
  readonly x: number;
  readonly z: number;
}

export interface CarnavalsrageActivatedEvent {
  readonly factionId: FactionId;
}

export interface ResearchStartedEvent {
  readonly factionId: FactionId;
  readonly upgradeId: UpgradeId;
  readonly upgradeName: string;
}

export interface ResearchCompletedEvent {
  readonly factionId: FactionId;
  readonly upgradeId: UpgradeId;
  readonly upgradeName: string;
}

/** Union type of all event names for the typed EventBus. */
export interface GameEvents {
  'unit-died': UnitDiedEvent;
  'building-placed': BuildingPlacedEvent;
  'resource-deposited': ResourceDepositedEvent;
  'unit-trained': UnitTrainedEvent;
  'building-destroyed': BuildingDestroyedEvent;
  'werkoverleg': WerkoverlegEvent;
  'vergadering': VergaderingEvent;
  'efficiency-stack': EfficiencyStackEvent;
  'hero-died': HeroDiedEvent;
  'hero-revived': HeroRevivedEvent;
  'hero-ability-used': HeroAbilityUsedEvent;
  'combat-hit': CombatHitEvent;
  'carnavalsrage-activated': CarnavalsrageActivatedEvent;
  'research-started': ResearchStartedEvent;
  'research-completed': ResearchCompletedEvent;
}

// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------

/** Entity ID type alias for readability. */
export type EntityId = number;

/** World type from bitECS (re-exported for convenience). */
export type { World as IWorld } from 'bitecs';
