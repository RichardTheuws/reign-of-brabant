/**
 * Reign of Brabant -- ECS Queries
 *
 * Pre-defined query functions wrapping bitECS 0.4.0's `query()`.
 *
 * In 0.4.0, queries are invoked inline: `query(world, [Comp1, Comp2])`.
 * These helpers provide named, consistent query patterns used across systems.
 *
 * Each function takes a world and returns a QueryResult (readonly entity ID array).
 */

import { query, Not, type World } from 'bitecs';
import {
  Position,
  UnitType,
  Selected,
  Movement,
  Gatherer,
  Building,
  Production,
  UnitAI,
  Health,
  Attack,
  Visibility,
  Resource,
  RenderRef,
  Rotation,
  Faction,
  DeathTimer,
  Hero,
  HeroAbilities,
  Stunned,
  SummonTimer,
} from './components';
import {
  IsUnit,
  IsBuilding,
  IsResource,
  IsDead,
  IsWorker,
  IsHero,
  IsReviving,
  IsSummon,
  NeedsPathfinding,
} from './tags';

// ---------------------------------------------------------------------------
// Unit Queries
// ---------------------------------------------------------------------------

/** All living units (have Position + UnitType + IsUnit, not dead). */
export function allUnits(world: World) {
  return query(world, [Position, UnitType, IsUnit, Not(IsDead)]);
}

/** All units currently selected by the player. */
export function selectedUnits(world: World) {
  return query(world, [Selected, IsUnit, Not(IsDead)]);
}

/** Units with an active movement target. */
export function movingUnits(world: World) {
  return query(world, [Movement, Position, IsUnit, Not(IsDead)]);
}

/** Worker units currently in a gathering state (have Gatherer component). */
export function gatheringUnits(world: World) {
  return query(world, [Gatherer, Position, IsWorker, Not(IsDead)]);
}

/** Units with combat capability (for CombatSystem). */
export function combatUnits(world: World) {
  return query(world, [Position, Attack, Health, UnitAI, IsUnit, Not(IsDead)]);
}

/** Worker units (for GatherSystem filtering and AI worker assignment). */
export function workerUnits(world: World) {
  return query(world, [Position, IsWorker, IsUnit, Not(IsDead)]);
}

// ---------------------------------------------------------------------------
// Building Queries
// ---------------------------------------------------------------------------

/** All buildings (completed or under construction). */
export function allBuildings(world: World) {
  return query(world, [Building, Position, IsBuilding, Not(IsDead)]);
}

/** Buildings currently producing units (Production.unitType !== 255). */
export function producingBuildings(world: World) {
  return query(world, [Building, Production, IsBuilding, Not(IsDead)]);
}

/** Buildings that are selected by the player. */
export function selectedBuildings(world: World) {
  return query(world, [Selected, Building, IsBuilding, Not(IsDead)]);
}

// ---------------------------------------------------------------------------
// Resource Queries
// ---------------------------------------------------------------------------

/** All resource nodes (gold mines) on the map. */
export function resourceNodes(world: World) {
  return query(world, [Resource, Position, IsResource]);
}

// ---------------------------------------------------------------------------
// Pathfinding Queries
// ---------------------------------------------------------------------------

/** Entities requesting pathfinding calculation (consumed by PathfindingSystem). */
export function entitiesNeedingPathfinding(world: World) {
  return query(world, [NeedsPathfinding, Position, Movement]);
}

// ---------------------------------------------------------------------------
// Death Queries
// ---------------------------------------------------------------------------

/** Entities marked as dead (pending removal by DeathSystem). */
export function deadEntities(world: World) {
  return query(world, [IsDead]);
}

/** Dead entities with an active death timer (animating death). */
export function dyingEntities(world: World) {
  return query(world, [IsDead, DeathTimer]);
}

// ---------------------------------------------------------------------------
// Visibility Queries
// ---------------------------------------------------------------------------

/** Entities with visibility for fog of war calculation. */
export function visibleEntities(world: World) {
  return query(world, [Position, Visibility, Faction, Not(IsDead)]);
}

// ---------------------------------------------------------------------------
// Render Queries
// ---------------------------------------------------------------------------

/** Entities that need Three.js transform sync (Position + Rotation + RenderRef). */
export function renderableEntities(world: World) {
  return query(world, [Position, Rotation, RenderRef]);
}

/** All entities with position and faction (for minimap rendering). */
export function minimapEntities(world: World) {
  return query(world, [Position, Faction, Not(IsDead)]);
}

// ---------------------------------------------------------------------------
// Selection Queries
// ---------------------------------------------------------------------------

/** All player-selectable entities (units + buildings with position and health). */
export function selectableEntities(world: World) {
  return query(world, [Position, Faction, Health, Not(IsDead)]);
}

// ---------------------------------------------------------------------------
// Hero Queries
// ---------------------------------------------------------------------------

/** All living hero units. */
export function heroUnits(world: World) {
  return query(world, [Position, Hero, HeroAbilities, IsUnit, IsHero, Not(IsDead)]);
}

/** Heroes currently reviving (dead, waiting to respawn). */
export function revivingHeroes(world: World) {
  return query(world, [Hero, IsHero, IsReviving]);
}

/** Stunned entities. */
export function stunnedEntities(world: World) {
  return query(world, [Stunned, Not(IsDead)]);
}

/** Temporary summons with a lifespan timer. */
export function summonedUnits(world: World) {
  return query(world, [SummonTimer, IsUnit, IsSummon, Not(IsDead)]);
}
