/**
 * Reign of Brabant -- ECS World
 *
 * Creates and configures the bitECS v0.4 world instance.
 * The world is a plain object in 0.4 -- we extend it with game metadata.
 */

import { createWorld, resetWorld as bitResetWorld } from 'bitecs';

// ---------------------------------------------------------------------------
// World Metadata
// ---------------------------------------------------------------------------

export interface WorldMeta {
  /** Elapsed game time in seconds. */
  elapsed: number;
  /** Delta time for current frame in seconds. */
  deltaTime: number;
  /** Whether the game is paused. */
  paused: boolean;
  /** Current frame number (monotonically increasing). */
  frame: number;
}

// ---------------------------------------------------------------------------
// GameWorld type
// ---------------------------------------------------------------------------

/**
 * The game world type: bitECS world extended with our metadata.
 */
export type GameWorld = ReturnType<typeof createWorld> & { meta: WorldMeta };

// ---------------------------------------------------------------------------
// World Creation
// ---------------------------------------------------------------------------

/**
 * Create a new ECS world with metadata attached.
 */
export function createGameWorld(): GameWorld {
  const world = createWorld<{ meta: WorldMeta }>({
    meta: {
      elapsed: 0,
      deltaTime: 0,
      paused: false,
      frame: 0,
    },
  });
  return world as GameWorld;
}

// ---------------------------------------------------------------------------
// World Singleton
// ---------------------------------------------------------------------------

/** The global ECS world instance. */
export let world: GameWorld = createGameWorld();

/**
 * Reset the world to a clean state.
 * Removes all entities and components, resets metadata.
 * Used when starting a new game.
 */
export function resetGameWorld(): GameWorld {
  bitResetWorld(world);
  world.meta.elapsed = 0;
  world.meta.deltaTime = 0;
  world.meta.paused = false;
  world.meta.frame = 0;
  return world;
}

/**
 * Replace the world singleton entirely with a fresh instance.
 * Returns the new world. Use sparingly -- prefer resetGameWorld().
 */
export function replaceWorld(): GameWorld {
  world = createGameWorld();
  return world;
}
