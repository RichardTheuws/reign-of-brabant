/**
 * Reign of Brabant -- Type System
 *
 * All enums, interfaces, and type definitions for the PoC.
 * This is the single source of truth for game data types.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Faction identifiers. PoC has 2: player (Brabanders) and AI (Randstad). */
export enum FactionId {
  Brabanders = 0,
  AI = 1,
  /** Alias for AI faction -- the Randstad bureaucrats. */
  Randstad = 1,
}

/** Unit type identifiers -- matches archetype data arrays. */
export enum UnitTypeId {
  Worker = 0,
  Infantry = 1,
  Ranged = 2,
}

/** Hero type identifiers. */
export enum HeroTypeId {
  // Brabanders heroes
  PrinsVanBrabansen = 0,
  BoerVanBrabansen = 1,
  // Randstad heroes
  DeCEO = 2,
  DePoliticus = 3,
}

/** Building type identifiers -- matches archetype data arrays. */
export enum BuildingTypeId {
  TownHall = 0,
  Barracks = 1,
  LumberCamp = 2,
  Blacksmith = 3,
}

/** Upgrade identifiers for the tech tree. */
export enum UpgradeId {
  MeleeAttack1 = 0,
  MeleeAttack2 = 1,
  RangedAttack1 = 2,
  RangedAttack2 = 3,
  ArmorUpgrade1 = 4,
  ArmorUpgrade2 = 5,
  MoveSpeed1 = 6,
}

/** Resource types. Gold (Worstenbroodjes) and Wood (Hout). */
export enum ResourceType {
  Gold = 0,
  Wood = 1,
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
  [FactionId.AI]: {
    worker: 0x3498db,
    infantry: 0x2980b9,
    ranged: 0x1f618d,
    townHall: 0x34495e,
    barracks: 0x2c3e50,
  },
} as const;

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
// Interfaces -- Runtime State
// ---------------------------------------------------------------------------

/** Per-player resource state (managed outside ECS in GameState). */
export interface PlayerResources {
  gold: number;
  wood: number;
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
