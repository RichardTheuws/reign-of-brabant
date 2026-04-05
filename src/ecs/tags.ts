/**
 * Reign of Brabant -- ECS Tag Components
 *
 * Tags are zero-size components used as markers / dirty flags.
 * In bitECS v0.4, a tag is simply an empty object reference.
 */

/** Marks an entity as a unit (worker, infantry, ranged). */
export const IsUnit = {};

/** Marks an entity as a building (town hall, barracks). */
export const IsBuilding = {};

/** Marks an entity as a resource node (gold mine). */
export const IsResource = {};

/** Marks an entity as dead -- queued for removal by DeathSystem. */
export const IsDead = {};

/** Marks a unit as a worker (can gather and build). */
export const IsWorker = {};

/** Marks an entity as needing a new path from PathfindingSystem. */
export const NeedsPathfinding = {};

/** Marks an entity as a hero unit. */
export const IsHero = {};

/** Marks a hero as dead-but-reviving (not yet removed from world). */
export const IsReviving = {};

/** Marks an entity as a temporary summon (militia, etc.). */
export const IsSummon = {};
