/**
 * MapGenerator -- Map setup for 2-4 player games
 *
 * Generates the initial game state:
 * - 2-4 player start positions in clockwise pattern:
 *     Position 0 (Brabanders): top-left
 *     Position 1 (Randstad):   bottom-right
 *     Position 2 (Limburgers): top-right
 *     Position 3 (Belgen):     bottom-left
 * - Balanced gold mines (2 near each base + contested centre mines)
 * - Tree groves (1+ near each base)
 * - Decoration props (trees, rocks) scattered across the map
 * - Starting units: 3 workers + 1 Town Hall per faction
 *
 * Returns a GeneratedMap with all positions so that the ECS world
 * and renderer can be populated.
 *
 * When playerCount=2, the layout is identical to the original PoC map.
 */

import {
  FactionId,
  UnitTypeId,
  BuildingTypeId,
  MAP_SIZE,
  type MapDefinition,
  type SpawnPoint,
  type GoldMineSpawn,
  type TreeResourceSpawn,
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

/** Default wood per tree resource node. */
const DEFAULT_WOOD_AMOUNT = 300;

/** Number of tree resource clusters (groves) for 2-player maps. */
const TREE_GROVE_COUNT = 4;

/** Trees per grove. */
const TREES_PER_GROVE_MIN = 3;
const TREES_PER_GROVE_MAX = 5;

/** Spacing between trees in a grove. */
const GROVE_SPREAD = 3.0;

/** Tree grove distance from base (similar to mines). */
const GROVE_NEAR_OFFSET = 18;

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
  readonly treeResources: readonly TreeResourceSpawn[];
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
// Spawn position configuration (clockwise from top-left)
// ---------------------------------------------------------------------------

/**
 * Base positions for up to 4 players, defined as offsets from map centre.
 * Index matches the player slot:
 *   0 = top-left     (Brabanders)
 *   1 = bottom-right  (Randstad)
 *   2 = top-right     (Limburgers)
 *   3 = bottom-left   (Belgen)
 *
 * Each entry also defines a "direction towards centre" unit vector
 * used for placing nearby mines, groves, and worker rows.
 */
interface BasePositionConfig {
  /** X position (will be computed from halfMap + BASE_MARGIN). */
  readonly xSign: -1 | 1;
  /** Z position (will be computed from halfMap + BASE_MARGIN). */
  readonly zSign: -1 | 1;
  /** Faction assigned to this slot. */
  readonly factionId: FactionId;
  /** Direction towards map centre (unit vector components, +1 or -1). */
  readonly towardsCentreX: 1 | -1;
  readonly towardsCentreZ: 1 | -1;
}

const BASE_POSITIONS: readonly BasePositionConfig[] = [
  // Slot 0: top-left → Brabanders
  { xSign: -1, zSign: -1, factionId: FactionId.Brabanders, towardsCentreX: 1, towardsCentreZ: 1 },
  // Slot 1: bottom-right → Randstad
  { xSign: 1, zSign: 1, factionId: FactionId.Randstad, towardsCentreX: -1, towardsCentreZ: -1 },
  // Slot 2: top-right → Limburgers
  { xSign: 1, zSign: -1, factionId: FactionId.Limburgers, towardsCentreX: -1, towardsCentreZ: 1 },
  // Slot 3: bottom-left → Belgen
  { xSign: -1, zSign: 1, factionId: FactionId.Belgen, towardsCentreX: 1, towardsCentreZ: -1 },
];

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generate a complete map layout for 2-4 players.
 *
 * @param seed - Random seed for deterministic generation.
 * @param getHeight - Optional terrain height callback to avoid placing
 *   things in water. Defaults to 0 everywhere.
 * @param playerCount - Number of players (2-4). Defaults to 2 for
 *   backwards compatibility with the original PoC layout.
 */
export function generateMap(
  seed: number = 42,
  getHeight: HeightCallback = () => 0,
  playerCount: 2 | 3 | 4 = 2,
): GeneratedMap {
  const rng = createRng(seed);
  const halfMap = MAP_SIZE / 2;

  // -----------------------------------------------------------------------
  // 1. Spawn points for all active players
  // -----------------------------------------------------------------------

  const spawns: SpawnPoint[] = [];

  for (let slot = 0; slot < playerCount; slot++) {
    const cfg = BASE_POSITIONS[slot];
    spawns.push({
      x: cfg.xSign * (halfMap - BASE_MARGIN),
      z: cfg.zSign * (halfMap - BASE_MARGIN),
      factionId: cfg.factionId,
    });
  }

  // -----------------------------------------------------------------------
  // 2. Gold mines -- 2 near each base + contested centre mines
  // -----------------------------------------------------------------------

  const goldMines: GoldMineSpawn[] = [];

  for (let slot = 0; slot < playerCount; slot++) {
    const spawn = spawns[slot];
    const cfg = BASE_POSITIONS[slot];

    // Mine 1: offset along X axis towards centre
    goldMines.push({
      x: spawn.x + cfg.towardsCentreX * MINE_NEAR_OFFSET,
      z: spawn.z + cfg.towardsCentreZ * 2,
      amount: DEFAULT_GOLD_AMOUNT,
    });

    // Mine 2: offset along Z axis towards centre
    goldMines.push({
      x: spawn.x + cfg.towardsCentreX * 2,
      z: spawn.z + cfg.towardsCentreZ * MINE_NEAR_OFFSET,
      amount: DEFAULT_GOLD_AMOUNT,
    });
  }

  // Contested centre mines (always 2, richer than base mines)
  goldMines.push({
    x: -8 + rng() * 4,
    z: 8 - rng() * 4,
    amount: DEFAULT_GOLD_AMOUNT * 1.5,
  });
  goldMines.push({
    x: 8 - rng() * 4,
    z: -8 + rng() * 4,
    amount: DEFAULT_GOLD_AMOUNT * 1.5,
  });

  // -----------------------------------------------------------------------
  // 3. Buildings -- Town Hall per faction
  // -----------------------------------------------------------------------

  const buildings: BuildingSpawn[] = [];

  for (let slot = 0; slot < playerCount; slot++) {
    buildings.push({
      factionId: spawns[slot].factionId,
      buildingType: BuildingTypeId.TownHall,
      x: spawns[slot].x,
      z: spawns[slot].z,
    });
  }

  // -----------------------------------------------------------------------
  // 4. Starting units -- 3 workers per faction
  // -----------------------------------------------------------------------

  const units: UnitSpawn[] = [];

  for (let slot = 0; slot < playerCount; slot++) {
    const spawn = spawns[slot];
    const cfg = BASE_POSITIONS[slot];

    for (let i = 0; i < STARTING_WORKERS; i++) {
      units.push({
        factionId: spawn.factionId,
        unitType: UnitTypeId.Worker,
        x: spawn.x + cfg.towardsCentreX * (3 + i * WORKER_SPACING),
        z: spawn.z + cfg.towardsCentreZ * 3,
      });
    }
  }

  // -----------------------------------------------------------------------
  // 5. Tree resource groves (harvestable wood)
  // -----------------------------------------------------------------------

  const treeResources: TreeResourceSpawn[] = [];
  const groveCenters: { x: number; z: number }[] = [];

  if (playerCount === 2) {
    // Original 2-player layout: 2 groves near each base (4 total)
    for (let slot = 0; slot < 2; slot++) {
      const spawn = spawns[slot];
      const cfg = BASE_POSITIONS[slot];

      groveCenters.push({
        x: spawn.x + cfg.towardsCentreX * GROVE_NEAR_OFFSET,
        z: spawn.z + cfg.towardsCentreZ * GROVE_NEAR_OFFSET * 0.5,
      });
      groveCenters.push({
        x: spawn.x + cfg.towardsCentreX * GROVE_NEAR_OFFSET * 0.5,
        z: spawn.z + cfg.towardsCentreZ * GROVE_NEAR_OFFSET,
      });
    }
  } else {
    // 3-4 player layout: 1 grove near each base + 2 contested in centre
    for (let slot = 0; slot < playerCount; slot++) {
      const spawn = spawns[slot];
      const cfg = BASE_POSITIONS[slot];

      // 1 grove per base, placed diagonally towards centre
      groveCenters.push({
        x: spawn.x + cfg.towardsCentreX * GROVE_NEAR_OFFSET * 0.75,
        z: spawn.z + cfg.towardsCentreZ * GROVE_NEAR_OFFSET * 0.75,
      });
    }

    // 2 contested groves near map centre (mirrored)
    groveCenters.push({ x: -12, z: -12 });
    groveCenters.push({ x: 12, z: 12 });
  }

  for (let g = 0; g < groveCenters.length; g++) {
    const center = groveCenters[g];
    const treeCount = TREES_PER_GROVE_MIN + Math.floor(rng() * (TREES_PER_GROVE_MAX - TREES_PER_GROVE_MIN + 1));
    for (let t = 0; t < treeCount; t++) {
      const offsetX = (rng() - 0.5) * GROVE_SPREAD * 2;
      const offsetZ = (rng() - 0.5) * GROVE_SPREAD * 2;
      treeResources.push({
        x: center.x + offsetX,
        z: center.z + offsetZ,
        amount: DEFAULT_WOOD_AMOUNT,
      });
    }
  }

  // -----------------------------------------------------------------------
  // 6. Decoration props (trees and rocks)
  // -----------------------------------------------------------------------

  // Collect positions we want to avoid
  const avoidPositions: { x: number; z: number }[] = [
    ...spawns,
    ...goldMines,
    ...treeResources,
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
    spawns,
    goldMines,
    treeResources,
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
