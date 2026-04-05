/**
 * MapGenerator -- Map setup for the PoC
 *
 * Generates the initial game state:
 * - Player start position (top-left corner)
 * - AI start position (bottom-right corner)
 * - 4 gold mines (2 near each start, 2 contested in centre)
 * - Decoration props (trees, rocks) scattered across the map
 * - Starting units: 3 workers + 1 Town Hall per faction
 *
 * Returns a MapDefinition with all positions so that the ECS world
 * and renderer can be populated.
 */

import {
  FactionId,
  UnitTypeId,
  BuildingTypeId,
  MAP_SIZE,
  type MapDefinition,
  type SpawnPoint,
  type GoldMineSpawn,
} from '../types/index';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Margin from map edge for base placement. */
const BASE_MARGIN = 15;

/** Gold mine distance from base. */
const MINE_NEAR_OFFSET = 12;

/** Default gold per mine. */
const DEFAULT_GOLD_AMOUNT = 2000;

/** Number of starting workers per player. */
const STARTING_WORKERS = 3;

/** Spacing between workers at spawn. */
const WORKER_SPACING = 2.5;

/** Number of decorative trees. */
const TREE_COUNT = 120;

/** Number of decorative rocks. */
const ROCK_COUNT = 60;

/** Minimum distance between decorations and bases/mines. */
const DECO_MIN_DISTANCE = 8;

// ---------------------------------------------------------------------------
// Decoration definition
// ---------------------------------------------------------------------------

export enum DecoType {
  Tree = 0,
  Rock = 1,
}

export interface DecoSpawn {
  readonly type: DecoType;
  readonly x: number;
  readonly z: number;
  readonly scale: number;
  readonly rotationY: number;
}

// ---------------------------------------------------------------------------
// Starting unit definition
// ---------------------------------------------------------------------------

export interface UnitSpawn {
  readonly factionId: FactionId;
  readonly unitType: UnitTypeId;
  readonly x: number;
  readonly z: number;
}

// ---------------------------------------------------------------------------
// Building spawn definition
// ---------------------------------------------------------------------------

export interface BuildingSpawn {
  readonly factionId: FactionId;
  readonly buildingType: BuildingTypeId;
  readonly x: number;
  readonly z: number;
}

// ---------------------------------------------------------------------------
// Extended map definition returned by the generator
// ---------------------------------------------------------------------------

export interface GeneratedMap extends MapDefinition {
  readonly buildings: readonly BuildingSpawn[];
  readonly units: readonly UnitSpawn[];
  readonly decorations: readonly DecoSpawn[];
}

// ---------------------------------------------------------------------------
// Seeded random (deterministic for reproducible maps)
// ---------------------------------------------------------------------------

function createRng(seed: number): () => number {
  let state = seed;
  return () => {
    // Mulberry32
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Height callback type (provided by Terrain)
// ---------------------------------------------------------------------------

type HeightCallback = (x: number, z: number) => number;

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generate a complete map layout for the PoC.
 *
 * @param seed - Random seed for deterministic generation.
 * @param getHeight - Optional terrain height callback to avoid placing
 *   things in water. Defaults to 0 everywhere.
 */
export function generateMap(
  seed: number = 42,
  getHeight: HeightCallback = () => 0,
): GeneratedMap {
  const rng = createRng(seed);
  const halfMap = MAP_SIZE / 2;

  // -----------------------------------------------------------------------
  // 1. Player & AI spawn points
  // -----------------------------------------------------------------------

  // Player: top-left (negative X, negative Z in centered coordinate space)
  const playerSpawn: SpawnPoint = {
    x: -halfMap + BASE_MARGIN,
    z: -halfMap + BASE_MARGIN,
    factionId: FactionId.Brabanders,
  };

  // AI: bottom-right
  const aiSpawn: SpawnPoint = {
    x: halfMap - BASE_MARGIN,
    z: halfMap - BASE_MARGIN,
    factionId: FactionId.AI,
  };

  // -----------------------------------------------------------------------
  // 2. Gold mines -- 2 near each player, 2 in contested centre
  // -----------------------------------------------------------------------

  const goldMines: GoldMineSpawn[] = [
    // Near player (slightly offset to force worker travel)
    {
      x: playerSpawn.x + MINE_NEAR_OFFSET,
      z: playerSpawn.z + 2,
      amount: DEFAULT_GOLD_AMOUNT,
    },
    {
      x: playerSpawn.x + 2,
      z: playerSpawn.z + MINE_NEAR_OFFSET,
      amount: DEFAULT_GOLD_AMOUNT,
    },

    // Near AI
    {
      x: aiSpawn.x - MINE_NEAR_OFFSET,
      z: aiSpawn.z - 2,
      amount: DEFAULT_GOLD_AMOUNT,
    },
    {
      x: aiSpawn.x - 2,
      z: aiSpawn.z - MINE_NEAR_OFFSET,
      amount: DEFAULT_GOLD_AMOUNT,
    },

    // Contested centre mines
    {
      x: -8 + rng() * 4,
      z: 8 - rng() * 4,
      amount: DEFAULT_GOLD_AMOUNT * 1.5,
    },
    {
      x: 8 - rng() * 4,
      z: -8 + rng() * 4,
      amount: DEFAULT_GOLD_AMOUNT * 1.5,
    },
  ];

  // -----------------------------------------------------------------------
  // 3. Buildings -- Town Hall per faction
  // -----------------------------------------------------------------------

  const buildings: BuildingSpawn[] = [
    {
      factionId: FactionId.Brabanders,
      buildingType: BuildingTypeId.TownHall,
      x: playerSpawn.x,
      z: playerSpawn.z,
    },
    {
      factionId: FactionId.AI,
      buildingType: BuildingTypeId.TownHall,
      x: aiSpawn.x,
      z: aiSpawn.z,
    },
  ];

  // -----------------------------------------------------------------------
  // 4. Starting units -- 3 workers per faction
  // -----------------------------------------------------------------------

  const units: UnitSpawn[] = [];

  for (let i = 0; i < STARTING_WORKERS; i++) {
    // Player workers, arranged in a row near Town Hall
    units.push({
      factionId: FactionId.Brabanders,
      unitType: UnitTypeId.Worker,
      x: playerSpawn.x + 3 + i * WORKER_SPACING,
      z: playerSpawn.z + 3,
    });

    // AI workers
    units.push({
      factionId: FactionId.AI,
      unitType: UnitTypeId.Worker,
      x: aiSpawn.x - 3 - i * WORKER_SPACING,
      z: aiSpawn.z - 3,
    });
  }

  // -----------------------------------------------------------------------
  // 5. Decoration props (trees and rocks)
  // -----------------------------------------------------------------------

  // Collect positions we want to avoid
  const avoidPositions: { x: number; z: number }[] = [
    playerSpawn,
    aiSpawn,
    ...goldMines,
    ...buildings,
    ...units,
  ];

  const decorations: DecoSpawn[] = [];

  // Trees
  for (let i = 0; i < TREE_COUNT; i++) {
    const pos = findValidDecoPosition(rng, avoidPositions, halfMap, getHeight);
    if (pos) {
      const deco: DecoSpawn = {
        type: DecoType.Tree,
        x: pos.x,
        z: pos.z,
        scale: 0.8 + rng() * 0.6, // 0.8 - 1.4
        rotationY: rng() * Math.PI * 2,
      };
      decorations.push(deco);
      avoidPositions.push(pos);
    }
  }

  // Rocks
  for (let i = 0; i < ROCK_COUNT; i++) {
    const pos = findValidDecoPosition(rng, avoidPositions, halfMap, getHeight);
    if (pos) {
      const deco: DecoSpawn = {
        type: DecoType.Rock,
        x: pos.x,
        z: pos.z,
        scale: 0.5 + rng() * 0.8, // 0.5 - 1.3
        rotationY: rng() * Math.PI * 2,
      };
      decorations.push(deco);
      avoidPositions.push(pos);
    }
  }

  // -----------------------------------------------------------------------
  // Result
  // -----------------------------------------------------------------------

  return {
    size: MAP_SIZE,
    heightScale: 10,
    spawns: [playerSpawn, aiSpawn],
    goldMines,
    buildings,
    units,
    decorations,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find a random position that is:
 * - Within map bounds (with margin)
 * - Not too close to any avoid position
 * - Not in water (height > 0.1)
 *
 * Returns null after 20 failed attempts.
 */
function findValidDecoPosition(
  rng: () => number,
  avoidPositions: readonly { x: number; z: number }[],
  halfMap: number,
  getHeight: HeightCallback,
): { x: number; z: number } | null {
  const margin = 5;

  for (let attempt = 0; attempt < 20; attempt++) {
    const x = -halfMap + margin + rng() * (MAP_SIZE - margin * 2);
    const z = -halfMap + margin + rng() * (MAP_SIZE - margin * 2);

    // Skip water areas
    const h = getHeight(x, z);
    if (h < 0.1) continue;

    // Check distance to all avoid positions
    let tooClose = false;
    for (const pos of avoidPositions) {
      const dx = x - pos.x;
      const dz = z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < DECO_MIN_DISTANCE) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      return { x, z };
    }
  }

  return null;
}

/**
 * Get the player's spawn point from a generated map.
 */
export function getPlayerSpawn(map: GeneratedMap): SpawnPoint {
  return map.spawns.find((s) => s.factionId === FactionId.Brabanders)!;
}

/**
 * Get the AI's spawn point from a generated map.
 */
export function getAISpawn(map: GeneratedMap): SpawnPoint {
  return map.spawns.find((s) => s.factionId === FactionId.AI)!;
}
