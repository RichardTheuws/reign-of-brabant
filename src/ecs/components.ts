/**
 * Reign of Brabant -- ECS Components
 *
 * bitECS v0.4 SoA component definitions. Each component is a plain object
 * with typed arrays for high-performance per-entity data access.
 *
 * Convention: arrays are pre-allocated to MAX_ENTITIES for zero-alloc frame loops.
 */

import { MAX_ENTITIES } from '../types/index';

// ---------------------------------------------------------------------------
// Helper: create typed arrays of MAX_ENTITIES (zero-filled)
// ---------------------------------------------------------------------------
const f32 = () => new Float32Array(MAX_ENTITIES);
const u8 = () => new Uint8Array(MAX_ENTITIES);
const u32 = () => new Uint32Array(MAX_ENTITIES);

// ---------------------------------------------------------------------------
// Position -- world-space coordinates
// ---------------------------------------------------------------------------
export const Position = {
  x: f32(),
  y: f32(),
  z: f32(),
};

// ---------------------------------------------------------------------------
// Velocity -- current movement vector (set by MovementSystem)
// ---------------------------------------------------------------------------
export const Velocity = {
  x: f32(),
  z: f32(),
};

// ---------------------------------------------------------------------------
// Rotation -- euler Y rotation (facing direction)
// ---------------------------------------------------------------------------
export const Rotation = {
  y: f32(),
};

// ---------------------------------------------------------------------------
// Movement -- target-based movement
// ---------------------------------------------------------------------------
export const Movement = {
  targetX: f32(),
  targetZ: f32(),
  speed: f32(),    // world units per second
  hasTarget: u8(), // 1 = moving toward target, 0 = idle
};

// ---------------------------------------------------------------------------
// Health -- hit points
// ---------------------------------------------------------------------------
export const Health = {
  current: f32(),
  max: f32(),
};

// ---------------------------------------------------------------------------
// Attack -- offensive stats
// ---------------------------------------------------------------------------
export const Attack = {
  damage: f32(),
  speed: f32(),     // seconds between attacks (cooldown duration)
  range: f32(),     // attack range in world units (0 = melee)
  cooldown: f32(),  // reset value for timer (same as speed, cached for clarity)
  timer: f32(),     // countdown until next attack (decremented by dt)
};

// ---------------------------------------------------------------------------
// Armor -- defensive stats
// ---------------------------------------------------------------------------
export const Armor = {
  value: f32(),
  type: u8(),       // ArmorType enum
};

// ---------------------------------------------------------------------------
// Faction -- player ownership
// ---------------------------------------------------------------------------
export const Faction = {
  id: u8(),         // FactionId enum (0 = player, 1 = AI)
};

// ---------------------------------------------------------------------------
// UnitType -- which archetype this entity is
// ---------------------------------------------------------------------------
export const UnitType = {
  id: u8(),         // UnitTypeId enum
};

// ---------------------------------------------------------------------------
// Selected -- selection state for player units
// ---------------------------------------------------------------------------
export const Selected = {
  by: u8(),         // 0 = selected by player, 255 = not selected
};

// ---------------------------------------------------------------------------
// UnitAI -- finite state machine for unit behavior
// ---------------------------------------------------------------------------
export const UnitAI = {
  state: u8(),      // UnitAIState enum
  targetEid: u32(), // entity id of current target (NO_ENTITY = none)
  originX: f32(),   // leash origin X (position to return to)
  originZ: f32(),   // leash origin Z (position to return to)
};

// ---------------------------------------------------------------------------
// Gatherer -- resource gathering state (workers only)
// ---------------------------------------------------------------------------
export const Gatherer = {
  state: u8(),          // UnitAIState (MOVING_TO_RESOURCE, GATHERING, RETURNING)
  targetEid: u32(),     // entity id of resource node
  carrying: f32(),      // current amount carried
  carryCapacity: f32(), // max carry (typically 10)
  resourceType: u8(),   // ResourceType enum
  previousTarget: u32(), // entity id of resource node before combat interrupted (for auto-resume)
};

// ---------------------------------------------------------------------------
// Building -- building construction and type
// ---------------------------------------------------------------------------
export const Building = {
  typeId: u8(),       // BuildingTypeId enum
  complete: u8(),     // 1 = construction finished, 0 = under construction
  progress: f32(),    // construction progress (0.0 to 1.0)
  maxProgress: f32(), // total build time in seconds
};

// ---------------------------------------------------------------------------
// Production -- unit training queue
// ---------------------------------------------------------------------------
export const Production = {
  unitType: u8(),    // UnitTypeId being produced (255 = none)
  progress: f32(),   // 0.0 to 1.0
  duration: f32(),   // total train time in seconds
  // Queue slots (max 5) -- each stores a UnitTypeId (255 = empty)
  queue0: u8(),
  queue1: u8(),
  queue2: u8(),
  queue3: u8(),
  queue4: u8(),
};

// ---------------------------------------------------------------------------
// RallyPoint -- where newly produced units move to
// ---------------------------------------------------------------------------
export const RallyPoint = {
  x: f32(),
  z: f32(),
};

// ---------------------------------------------------------------------------
// Visibility -- sight range for fog of war
// ---------------------------------------------------------------------------
export const Visibility = {
  range: f32(),     // sight radius in world units
};

// ---------------------------------------------------------------------------
// Resource -- resource node (gold mine)
// ---------------------------------------------------------------------------
export const Resource = {
  type: u8(),       // ResourceType enum
  amount: f32(),    // remaining resources
  maxAmount: f32(), // starting total
};

// ---------------------------------------------------------------------------
// PopulationCost -- population slots consumed by this entity
// ---------------------------------------------------------------------------
export const PopulationCost = {
  cost: u8(),       // typically 1 for all PoC units
};

// ---------------------------------------------------------------------------
// RenderRef -- links ECS entity to Three.js mesh (index/id)
// ---------------------------------------------------------------------------
export const RenderRef = {
  meshId: u32(),    // used as key in EntityMeshManager
};

// ---------------------------------------------------------------------------
// Path -- pathfinding waypoints reference
// ---------------------------------------------------------------------------
export const Path = {
  pathId: u32(),          // index into PathBuffer
  waypointIndex: u32(),   // current waypoint being followed
  waypointCount: u32(),   // total waypoints in path
};

// ---------------------------------------------------------------------------
// DeathTimer -- tracks time since entity died (for cleanup)
// ---------------------------------------------------------------------------
export const DeathTimer = {
  elapsed: f32(),   // seconds since death (removed at DEATH_TIMER)
};

// ---------------------------------------------------------------------------
// GezeligheidBonus -- Brabander faction proximity bonus
// ---------------------------------------------------------------------------
export const GezeligheidBonus = {
  nearbyCount: u32(),       // number of nearby allies (including self)
  attackMult: f32(),        // attack multiplier (1.0 = no bonus)
  speedMult: f32(),         // speed multiplier (1.0 = no bonus)
  armorMult: f32(),         // armor multiplier (1.0 = no bonus)
  passiveHeal: u8(),        // 1 = passive heal active, 0 = inactive
  damageReduction: f32(),   // 0.0 = none, 0.2 = 20% damage reduction
};

// ---------------------------------------------------------------------------
// Hero -- hero unit data
// ---------------------------------------------------------------------------
export const Hero = {
  heroTypeId: u8(),         // HeroTypeId enum
  reviveTimer: f32(),       // countdown until revive (0 = alive)
  reviveX: f32(),           // Town Hall X for revival
  reviveZ: f32(),           // Town Hall Z for revival
};

// ---------------------------------------------------------------------------
// HeroAbilities -- per-hero ability cooldown tracking (3 slots: Q, W, E)
// ---------------------------------------------------------------------------
export const HeroAbilities = {
  // Slot Q
  ability0Id: u8(),         // ability index (references HeroArchetype.abilities)
  ability0Cooldown: f32(),  // current cooldown remaining (0 = ready)
  ability0MaxCd: f32(),     // max cooldown for this ability
  // Slot W
  ability1Id: u8(),
  ability1Cooldown: f32(),
  ability1MaxCd: f32(),
  // Slot E
  ability2Id: u8(),
  ability2Cooldown: f32(),
  ability2MaxCd: f32(),
};

// ---------------------------------------------------------------------------
// Stunned -- entity is stunned and cannot act
// ---------------------------------------------------------------------------
export const Stunned = {
  duration: f32(),          // remaining stun time in seconds
};

// ---------------------------------------------------------------------------
// Invincible -- entity cannot take damage
// ---------------------------------------------------------------------------
export const Invincible = {
  duration: f32(),          // remaining invincibility time in seconds
};

// ---------------------------------------------------------------------------
// StatBuff -- temporary stat multiplier
// ---------------------------------------------------------------------------
export const StatBuff = {
  attackMult: f32(),        // 1.0 = no buff
  speedMult: f32(),         // 1.0 = no buff
  armorMult: f32(),         // 1.0 = no buff
  duration: f32(),          // remaining buff time (0 = expired)
};

// ---------------------------------------------------------------------------
// SummonTimer -- temporary summoned unit lifespan
// ---------------------------------------------------------------------------
export const SummonTimer = {
  remaining: f32(),         // seconds until auto-death
};
