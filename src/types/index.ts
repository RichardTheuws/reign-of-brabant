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
 * 4 playable factions. Each mission explicitly defines which factions are
 * player-controlled and which are AI-controlled via MissionDefinition fields.
 */
export enum FactionId {
  Brabanders = 0,
  Randstad = 1,
  Limburgers = 2,
  Belgen = 3,
}

/**
 * Unit type identifiers -- matches archetype data arrays.
 *
 * Range 0-9: Universal types shared across all factions.
 * Faction-specific unit flavours are resolved at render/UI time,
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
  PrinsVanBrabant = 0,
  BoerVanBrabant = 1,
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
  /** Defensive structure with ranged attack (T2). */
  DefenseTower = 9,
  /** Produces siege units (T3). */
  SiegeWorkshop = 10,
  /** Crossable structure over a river (placement must be on a river tile). */
  Bridge = 11,
}

/**
 * Upgrade identifiers for the tech tree.
 *
 * 0-9: Universal upgrades (backwards compatible).
 * 10-19: Brabanders faction upgrades.
 * 20-29: Randstad faction upgrades.
 * 30-39: Limburgers faction upgrades.
 * 40-49: Belgen faction upgrades.
 */
export enum UpgradeId {
  // --- Universal upgrades (0-9) ---
  MeleeAttack1 = 0,
  MeleeAttack2 = 1,
  RangedAttack1 = 2,
  RangedAttack2 = 3,
  ArmorUpgrade1 = 4,
  ArmorUpgrade2 = 5,
  MoveSpeed1 = 6,
  /** Workers carry +5 wood per trip (LumberCamp tier 1). */
  WoodCarry1 = 7,
  /** Workers carry another +5 wood per trip — stacks with WoodCarry1. */
  WoodCarry2 = 8,
  /** Workers gather wood 25% faster. */
  WoodGather = 9,

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
  /** Hold position: attack enemies in weapon range but never chase/move. */
  HoldPosition = 9,
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

/** Armor type classification for damage modifiers. */
export enum ArmorType {
  Unarmored = 0,
  Light = 1,
  Medium = 2,
  Heavy = 3,
  /** Buildings have their own armor class — weak only to Siege. */
  Building = 4,
}

/** Attack type classification — determines bonus damage vs armor types. */
export enum AttackType {
  Melee = 0,
  Ranged = 1,
  Siege = 2,
  Magic = 3,
}

/** Unit ability activation type. */
export enum UnitAbilityType {
  /** Manually activated, has cooldown. */
  Active = 0,
  /** Always-on stat modifier, no activation needed. */
  Passive = 1,
  /** Radius-based buff/debuff, always active when alive. */
  Aura = 2,
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

/** Map size in world units (128x128 flat terrain with hills). Default for backwards compat. */
export const MAP_SIZE = 128;

/** Available map size options for skirmish mode. */
export type MapSizeOption = 80 | 128 | 192;
export const MAP_SIZES: Record<string, MapSizeOption> = {
  small: 80,
  medium: 128,
  large: 192,
} as const;

/** Heightmap resolution matches map size. */
export const HEIGHTMAP_RESOLUTION = 128;

// ---------------------------------------------------------------------------
// Skirmish Config
// ---------------------------------------------------------------------------

/** AI difficulty presets affecting grace period, production speed, and aggression. */
export interface AIDifficultyConfig {
  /** Seconds before AI starts attacking. Easy: 300, Normal: 180, Hard: 90. */
  gracePeriodSeconds: number;
  /** Multiplier on AI production speed. Easy: 0.7, Normal: 1.0, Hard: 1.3. */
  productionSpeedMultiplier: number;
  /** Aggression level 0-1. Easy: 0.3, Normal: 0.6, Hard: 0.9. */
  aggressionLevel: number;
}

/** Predefined AI difficulty presets. */
export const AI_DIFFICULTY_PRESETS: Record<string, AIDifficultyConfig> = {
  easy: { gracePeriodSeconds: 300, productionSpeedMultiplier: 0.7, aggressionLevel: 0.3 },
  normal: { gracePeriodSeconds: 180, productionSpeedMultiplier: 1.0, aggressionLevel: 0.6 },
  hard: { gracePeriodSeconds: 90, productionSpeedMultiplier: 1.3, aggressionLevel: 0.9 },
} as const;

/** Starting resource presets for skirmish mode. */
export type ResourcePreset = 'low' | 'medium' | 'high';
export const RESOURCE_PRESETS: Record<ResourcePreset, number> = {
  low: 200,
  medium: 500,
  high: 1000,
} as const;

/** Victory condition for skirmish mode. */
export type VictoryCondition = 'elimination';

/** Full skirmish configuration passed to map generation and game init. */
export interface SkirmishConfig {
  /** Number of players (1 human + N-1 AI). */
  playerCount: 2 | 3 | 4;
  /** Map size in world units. */
  mapSize: MapSizeOption;
  /** Map layout template. */
  mapTemplate: string;
  /** AI difficulty preset name. */
  aiDifficulty: 'easy' | 'normal' | 'hard';
  /** Starting gold amount. */
  startingResources: ResourcePreset;
  /** Whether fog of war is enabled. */
  fogOfWar: boolean;
  /** Victory condition. */
  victoryCondition: VictoryCondition;
}

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
export const AGGRO_RANGE = 12;

/** Self-defense radius: gathering/working units react to enemies this close. */
export const SELF_DEFENSE_RANGE = 6;

/** Minimum effective attack range for melee units. */
export const MINIMUM_MELEE_RANGE = 1.5;

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
// Upkeep Constants (Late-game scaling)
// ---------------------------------------------------------------------------

/** Upkeep tick interval in seconds. Each military unit costs gold every N seconds. */
export const UPKEEP_TICK_INTERVAL = 15;

/** Gold cost per military unit per upkeep tick. */
export const UPKEEP_COST_PER_UNIT = 1;

/** Combat effectiveness multiplier when gold is 0 and upkeep is owed. */
export const UPKEEP_DEBT_EFFECTIVENESS = 0.75;

// ---------------------------------------------------------------------------
// Resource Diminishing Returns Constants
// ---------------------------------------------------------------------------

/** Fraction of original resource remaining that triggers diminishing returns. */
export const DIMINISHING_RETURNS_THRESHOLD = 0.25;

/** Gather speed multiplier when a resource node is below the threshold. */
export const DIMINISHING_RETURNS_GATHER_MULT = 0.70;

// ---------------------------------------------------------------------------
// AI Late-Game Scaling Constants
// ---------------------------------------------------------------------------

/** Game time in seconds when AI tier 1 scaling kicks in. */
export const AI_SCALING_TIER1_TIME = 600; // 10 minutes

/** Game time in seconds when AI tier 2 scaling kicks in. */
export const AI_SCALING_TIER2_TIME = 1200; // 20 minutes

/** Tier 1: HP and damage bonus multiplier for AI units. */
export const AI_SCALING_TIER1_BONUS = 0.10; // +10%

/** Tier 2: HP and damage bonus multiplier for AI units. */
export const AI_SCALING_TIER2_BONUS = 0.20; // +20%

// ---------------------------------------------------------------------------
// Population Tier Warning Thresholds
// ---------------------------------------------------------------------------

/** Population ratio at which the HUD text turns yellow. */
export const POP_WARNING_THRESHOLD = 0.60;

/** Population ratio at which the HUD text turns orange. */
export const POP_DANGER_THRESHOLD = 0.80;

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

/** Faction colours are indexed by FactionId (0-3). */

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
  /** Attack type for damage modifier lookup. Defaults to Melee (range=0) or Ranged (range>0). */
  readonly attackType?: AttackType;
  /** Bonus damage multiplier vs buildings (for Siege units). Defaults to 1.0. */
  readonly siegeBonus?: number;
  /** Splash/AoE radius for siege projectiles. 0 or omitted = single target. */
  readonly splashRadius?: number;
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
  /** Attack type for damage modifier lookup. Defaults to Melee (range=0) or Ranged (range>0). */
  readonly attackType?: AttackType;
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
// Terrain Feature Types (rivers, bridges, rock walls, roads, tunnels)
// ---------------------------------------------------------------------------

/** A point along a river or road path. */
export interface PathPoint {
  readonly x: number;
  readonly z: number;
}

/** A river that carves through the terrain. Units cannot cross except at bridges. */
export interface RiverSpawn {
  /** Ordered points defining the river's center line. */
  readonly path: readonly PathPoint[];
  /** Width of the river in world units. */
  readonly width: number;
}

/** A bridge spanning a river. Acts as a choke point -- units can cross here. */
export interface BridgeSpawn {
  /** Center position of the bridge. */
  readonly x: number;
  readonly z: number;
  /** Rotation in radians (perpendicular to the river). */
  readonly rotation: number;
  /** Width of the bridge crossing. */
  readonly width: number;
  /** Length of the bridge (how far it spans). */
  readonly length: number;
}

/** An impassable rock wall formation. Forces units to path around. */
export interface RockWallSpawn {
  /** Ordered points defining the rock wall's center line. */
  readonly path: readonly PathPoint[];
  /** Thickness of the wall in world units. */
  readonly thickness: number;
}

/** A road/path between key locations. Units on roads get a speed bonus. */
export interface RoadSpawn {
  /** Ordered points defining the road's center line. */
  readonly path: readonly PathPoint[];
  /** Width of the road in world units. */
  readonly width: number;
}

/** A tunnel entrance/exit pair. Units enter one side and emerge at the other. */
export interface TunnelSpawn {
  /** Unique tunnel identifier. */
  readonly id: number;
  /** Entrance position. */
  readonly entrance: PathPoint;
  /** Exit position. */
  readonly exit: PathPoint;
  /** Travel time in seconds to traverse the tunnel. */
  readonly travelTime: number;
  /** Which faction owns this tunnel (null = neutral, usable by anyone). */
  readonly factionOwner: FactionId | null;
}

/** Biome type determines terrain color palette and visual style. */
export type BiomeType = 'meadow' | 'urban' | 'aquatic' | 'arid';

/** Road speed bonus multiplier for units walking on roads. */
export const ROAD_SPEED_BONUS = 1.35;

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

export interface UnitAbilityUsedEvent {
  readonly eid: number;
  readonly abilityId: string;
  readonly x: number;
  readonly z: number;
}

export interface UnitHealedEvent {
  readonly healerEid: number;
  readonly targetEid: number;
  readonly amount: number;
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
  'unit-healed': UnitHealedEvent;
  'unit-ability-used': UnitAbilityUsedEvent;
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
