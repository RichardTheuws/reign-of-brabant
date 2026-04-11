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
  type RiverSpawn,
  type BridgeSpawn,
  type RockWallSpawn,
  type RoadSpawn,
  type TunnelSpawn,
  type PathPoint,
  type BiomeType,
} from '../types/index';
import type { TerrainFeatures } from './Terrain';

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

// ---------------------------------------------------------------------------
// Map template type
// ---------------------------------------------------------------------------

export type MapTemplate = 'classic' | 'crossroads' | 'islands' | 'arena';

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
  /** Terrain features for this map (rivers, bridges, walls, roads, tunnels). */
  readonly terrainFeatures: TerrainFeatures;
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
 * @param mapTemplate - Map layout template. Defaults to 'classic' for
 *   backwards compatibility. Options: classic, crossroads, islands, arena.
 */
export function generateMap(
  seed: number = 42,
  getHeight: HeightCallback = () => 0,
  playerCount: 2 | 3 | 4 = 2,
  mapTemplate: MapTemplate = 'classic',
): GeneratedMap {
  const rng = createRng(seed);
  const halfMap = MAP_SIZE / 2;

  switch (mapTemplate) {
    case 'crossroads':
      return generateCrossroads(rng, getHeight, playerCount, halfMap);
    case 'islands':
      return generateIslands(rng, getHeight, playerCount, halfMap);
    case 'arena':
      return generateArena(rng, getHeight, playerCount, halfMap);
    case 'classic':
    default:
      return generateClassic(rng, getHeight, playerCount, halfMap);
  }
}

// ---------------------------------------------------------------------------
// Template: Classic (original behaviour)
// ---------------------------------------------------------------------------

function generateClassic(
  rng: () => number,
  getHeight: HeightCallback,
  playerCount: 2 | 3 | 4,
  halfMap: number,
): GeneratedMap {
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
  // 6. Terrain features: rivers, bridges, rock walls, roads, tunnels
  // -----------------------------------------------------------------------

  const terrainFeatures = generateClassicFeatures(rng, halfMap, spawns);

  // -----------------------------------------------------------------------
  // 7. Decoration props (trees and rocks)
  // -----------------------------------------------------------------------

  const { decorations } = generateDecorations(
    rng, getHeight, halfMap, TREE_COUNT, ROCK_COUNT,
    [...spawns, ...goldMines, ...treeResources, ...buildings, ...units],
  );

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
    terrainFeatures,
  };
}

// ---------------------------------------------------------------------------
// Template: Crossroads
//
// Players on N/S/E/W edges. Resources at the 4 intersections.
// Large contested gold cluster in the centre. Denser trees than default.
// ---------------------------------------------------------------------------

/**
 * Edge positions for the crossroads template.
 * Players sit on the N, S, E, W edges of the map.
 * Index mapping: 0=North, 1=South, 2=East, 3=West.
 */
const CROSSROADS_POSITIONS: readonly {
  /** X position offset from centre. */
  readonly dx: number;
  /** Z position offset from centre. */
  readonly dz: number;
  /** Direction X towards centre. */
  readonly towardsCentreX: 1 | -1 | 0;
  /** Direction Z towards centre. */
  readonly towardsCentreZ: 1 | -1 | 0;
  readonly factionId: FactionId;
}[] = [
  // Slot 0: North edge (top centre) → Brabanders
  { dx: 0, dz: -1, towardsCentreX: 0, towardsCentreZ: 1, factionId: FactionId.Brabanders },
  // Slot 1: South edge (bottom centre) → Randstad
  { dx: 0, dz: 1, towardsCentreX: 0, towardsCentreZ: -1, factionId: FactionId.Randstad },
  // Slot 2: East edge (right centre) → Limburgers
  { dx: 1, dz: 0, towardsCentreX: -1, towardsCentreZ: 0, factionId: FactionId.Limburgers },
  // Slot 3: West edge (left centre) → Belgen
  { dx: -1, dz: 0, towardsCentreX: 1, towardsCentreZ: 0, factionId: FactionId.Belgen },
];

function generateCrossroads(
  rng: () => number,
  getHeight: HeightCallback,
  playerCount: 2 | 3 | 4,
  halfMap: number,
): GeneratedMap {
  const edgeMargin = BASE_MARGIN;

  // -----------------------------------------------------------------------
  // 1. Spawn points on N/S/E/W edges
  // -----------------------------------------------------------------------

  const spawns: SpawnPoint[] = [];

  for (let slot = 0; slot < playerCount; slot++) {
    const cfg = CROSSROADS_POSITIONS[slot];
    spawns.push({
      x: cfg.dx * (halfMap - edgeMargin),
      z: cfg.dz * (halfMap - edgeMargin),
      factionId: cfg.factionId,
    });
  }

  // -----------------------------------------------------------------------
  // 2. Gold mines -- 1 near each base + clusters at 4 intersections + centre
  // -----------------------------------------------------------------------

  const goldMines: GoldMineSpawn[] = [];

  // 1 mine near each base (offset towards centre)
  for (let slot = 0; slot < playerCount; slot++) {
    const spawn = spawns[slot];
    const cfg = CROSSROADS_POSITIONS[slot];
    goldMines.push({
      x: spawn.x + cfg.towardsCentreX * MINE_NEAR_OFFSET + cfg.towardsCentreZ * 4,
      z: spawn.z + cfg.towardsCentreZ * MINE_NEAR_OFFSET + cfg.towardsCentreX * 4,
      amount: DEFAULT_GOLD_AMOUNT,
    });
  }

  // 4 intersection clusters (NE, SE, SW, NW quadrants)
  const intersectionOffset = halfMap * 0.35;
  const intersections = [
    { x: intersectionOffset, z: -intersectionOffset },   // NE
    { x: intersectionOffset, z: intersectionOffset },     // SE
    { x: -intersectionOffset, z: intersectionOffset },    // SW
    { x: -intersectionOffset, z: -intersectionOffset },   // NW
  ];
  for (const inter of intersections) {
    goldMines.push({
      x: inter.x + (rng() - 0.5) * 4,
      z: inter.z + (rng() - 0.5) * 4,
      amount: DEFAULT_GOLD_AMOUNT,
    });
  }

  // Large central gold cluster (3 mines close together -- high value contested)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + rng() * 0.3;
    const dist = 3 + rng() * 2;
    goldMines.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      amount: DEFAULT_GOLD_AMOUNT * 1.5,
    });
  }

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
    const cfg = CROSSROADS_POSITIONS[slot];
    // Place workers towards centre from base
    const workerDirX = cfg.towardsCentreX || (cfg.towardsCentreZ !== 0 ? 1 : 0);
    const workerDirZ = cfg.towardsCentreZ || (cfg.towardsCentreX !== 0 ? 1 : 0);

    for (let i = 0; i < STARTING_WORKERS; i++) {
      units.push({
        factionId: spawn.factionId,
        unitType: UnitTypeId.Worker,
        x: spawn.x + workerDirX * (3 + i * WORKER_SPACING),
        z: spawn.z + workerDirZ * (3 + i * WORKER_SPACING),
      });
    }
  }

  // -----------------------------------------------------------------------
  // 5. Tree resource groves -- denser than classic (more groves, more trees)
  // -----------------------------------------------------------------------

  const treeResources: TreeResourceSpawn[] = [];
  const groveCenters: { x: number; z: number }[] = [];

  // 2 groves near each base (flanking the approach to centre)
  for (let slot = 0; slot < playerCount; slot++) {
    const spawn = spawns[slot];
    const cfg = CROSSROADS_POSITIONS[slot];
    // Perpendicular offsets for flanking groves
    const perpX = cfg.towardsCentreZ !== 0 ? 1 : 0;
    const perpZ = cfg.towardsCentreX !== 0 ? 1 : 0;

    groveCenters.push({
      x: spawn.x + perpX * 14 + cfg.towardsCentreX * 8,
      z: spawn.z + perpZ * 14 + cfg.towardsCentreZ * 8,
    });
    groveCenters.push({
      x: spawn.x - perpX * 14 + cfg.towardsCentreX * 8,
      z: spawn.z - perpZ * 14 + cfg.towardsCentreZ * 8,
    });
  }

  // 4 groves along the "cross" paths (between intersections)
  groveCenters.push({ x: halfMap * 0.5, z: 0 });
  groveCenters.push({ x: -halfMap * 0.5, z: 0 });
  groveCenters.push({ x: 0, z: halfMap * 0.5 });
  groveCenters.push({ x: 0, z: -halfMap * 0.5 });

  // Larger groves (more trees per grove for the denser feel)
  const crossroadsTreesMin = TREES_PER_GROVE_MIN + 1;
  const crossroadsTreesMax = TREES_PER_GROVE_MAX + 2;

  for (let g = 0; g < groveCenters.length; g++) {
    const center = groveCenters[g];
    const treeCount = crossroadsTreesMin + Math.floor(rng() * (crossroadsTreesMax - crossroadsTreesMin + 1));
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
  // 6. Terrain features
  // -----------------------------------------------------------------------

  const terrainFeatures = generateCrossroadsFeatures(rng, halfMap, spawns);

  // -----------------------------------------------------------------------
  // 7. Decorations -- more trees (denser map)
  // -----------------------------------------------------------------------

  const { decorations } = generateDecorations(
    rng, getHeight, halfMap, TREE_COUNT + 60, ROCK_COUNT,
    [...spawns, ...goldMines, ...treeResources, ...buildings, ...units],
  );

  return {
    size: MAP_SIZE,
    heightScale: 10,
    spawns,
    goldMines,
    treeResources,
    buildings,
    units,
    decorations,
    terrainFeatures,
  };
}

// ---------------------------------------------------------------------------
// Template: Islands
//
// Players in corners but wider spread. Each base is a "peninsula" with
// concentrated nearby resources. Centre has 4 large contested mines.
// Few trees in centre (open battlefield).
// ---------------------------------------------------------------------------

function generateIslands(
  rng: () => number,
  getHeight: HeightCallback,
  playerCount: 2 | 3 | 4,
  halfMap: number,
): GeneratedMap {
  // Wider margin pushes bases further into corners (more spread out)
  const islandMargin = BASE_MARGIN + 6;

  // -----------------------------------------------------------------------
  // 1. Spawn points in corners (like classic but wider margin)
  // -----------------------------------------------------------------------

  const spawns: SpawnPoint[] = [];

  for (let slot = 0; slot < playerCount; slot++) {
    const cfg = BASE_POSITIONS[slot];
    spawns.push({
      x: cfg.xSign * (halfMap - islandMargin),
      z: cfg.zSign * (halfMap - islandMargin),
      factionId: cfg.factionId,
    });
  }

  // -----------------------------------------------------------------------
  // 2. Gold mines -- 3 near each base (peninsula resources) + 4 large centre
  // -----------------------------------------------------------------------

  const goldMines: GoldMineSpawn[] = [];

  for (let slot = 0; slot < playerCount; slot++) {
    const spawn = spawns[slot];
    const cfg = BASE_POSITIONS[slot];

    // Mine 1: close along X
    goldMines.push({
      x: spawn.x + cfg.towardsCentreX * 8,
      z: spawn.z + cfg.towardsCentreZ * 2,
      amount: DEFAULT_GOLD_AMOUNT,
    });

    // Mine 2: close along Z
    goldMines.push({
      x: spawn.x + cfg.towardsCentreX * 2,
      z: spawn.z + cfg.towardsCentreZ * 8,
      amount: DEFAULT_GOLD_AMOUNT,
    });

    // Mine 3: diagonal close (peninsula bonus)
    goldMines.push({
      x: spawn.x + cfg.towardsCentreX * 6,
      z: spawn.z + cfg.towardsCentreZ * 6,
      amount: DEFAULT_GOLD_AMOUNT * 0.75,
    });
  }

  // 4 large contested mines in centre (higher value)
  const centreSpread = 10;
  goldMines.push({ x: -centreSpread, z: 0, amount: DEFAULT_GOLD_AMOUNT * 2 });
  goldMines.push({ x: centreSpread, z: 0, amount: DEFAULT_GOLD_AMOUNT * 2 });
  goldMines.push({ x: 0, z: -centreSpread, amount: DEFAULT_GOLD_AMOUNT * 2 });
  goldMines.push({ x: 0, z: centreSpread, amount: DEFAULT_GOLD_AMOUNT * 2 });

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
  // 5. Tree resource groves -- concentrated near base (peninsula feel)
  //    Few/no groves in centre (open battlefield)
  // -----------------------------------------------------------------------

  const treeResources: TreeResourceSpawn[] = [];
  const groveCenters: { x: number; z: number }[] = [];

  // 3 groves per base, all very close (peninsula cluster)
  for (let slot = 0; slot < playerCount; slot++) {
    const spawn = spawns[slot];
    const cfg = BASE_POSITIONS[slot];

    // Grove cluster around base -- close offsets
    groveCenters.push({
      x: spawn.x + cfg.towardsCentreX * 10,
      z: spawn.z,
    });
    groveCenters.push({
      x: spawn.x,
      z: spawn.z + cfg.towardsCentreZ * 10,
    });
    groveCenters.push({
      x: spawn.x + cfg.towardsCentreX * 12,
      z: spawn.z + cfg.towardsCentreZ * 12,
    });
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
  // 6. Terrain features
  // -----------------------------------------------------------------------

  const terrainFeatures = generateIslandsFeatures(rng, halfMap, spawns);

  // -----------------------------------------------------------------------
  // 7. Decorations -- fewer trees (open centre), normal rocks
  // -----------------------------------------------------------------------

  const { decorations } = generateDecorations(
    rng, getHeight, halfMap, Math.floor(TREE_COUNT * 0.6), ROCK_COUNT,
    [...spawns, ...goldMines, ...treeResources, ...buildings, ...units],
  );

  return {
    size: MAP_SIZE,
    heightScale: 10,
    spawns,
    goldMines,
    treeResources,
    buildings,
    units,
    decorations,
    terrainFeatures,
  };
}

// ---------------------------------------------------------------------------
// Template: Arena
//
// All players start in a ring around map centre (radius ~25).
// Resources in the outer ring. Forces early combat.
// More gold mines but smaller amounts (1000 each).
// ---------------------------------------------------------------------------

function generateArena(
  rng: () => number,
  getHeight: HeightCallback,
  playerCount: 2 | 3 | 4,
  halfMap: number,
): GeneratedMap {
  const arenaRadius = 25;
  const arenaGoldAmount = 1000;

  // -----------------------------------------------------------------------
  // 1. Spawn points in a ring around centre
  // -----------------------------------------------------------------------

  const spawns: SpawnPoint[] = [];

  for (let slot = 0; slot < playerCount; slot++) {
    const angle = (slot / playerCount) * Math.PI * 2 - Math.PI / 2; // start from top
    spawns.push({
      x: Math.cos(angle) * arenaRadius,
      z: Math.sin(angle) * arenaRadius,
      factionId: BASE_POSITIONS[slot].factionId,
    });
  }

  // -----------------------------------------------------------------------
  // 2. Gold mines -- many small mines in outer ring + a few in inner ring
  // -----------------------------------------------------------------------

  const goldMines: GoldMineSpawn[] = [];

  // Outer ring: 8 mines distributed around the edges
  const outerRadius = halfMap - 12;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + rng() * 0.2;
    goldMines.push({
      x: Math.cos(angle) * outerRadius + (rng() - 0.5) * 4,
      z: Math.sin(angle) * outerRadius + (rng() - 0.5) * 4,
      amount: arenaGoldAmount,
    });
  }

  // Mid ring: 4 mines between players (contested but reachable)
  const midRadius = halfMap * 0.55;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4; // offset from player positions
    goldMines.push({
      x: Math.cos(angle) * midRadius + (rng() - 0.5) * 3,
      z: Math.sin(angle) * midRadius + (rng() - 0.5) * 3,
      amount: arenaGoldAmount,
    });
  }

  // Centre: 2 small mines (immediate fight incentive)
  goldMines.push({
    x: -3 + rng() * 2,
    z: -3 + rng() * 2,
    amount: arenaGoldAmount,
  });
  goldMines.push({
    x: 3 - rng() * 2,
    z: 3 - rng() * 2,
    amount: arenaGoldAmount,
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
    // Workers placed outward from centre (towards outer ring resources)
    const angle = (slot / playerCount) * Math.PI * 2 - Math.PI / 2;
    const outX = Math.cos(angle);
    const outZ = Math.sin(angle);

    for (let i = 0; i < STARTING_WORKERS; i++) {
      units.push({
        factionId: spawn.factionId,
        unitType: UnitTypeId.Worker,
        x: spawn.x + outX * (3 + i * WORKER_SPACING),
        z: spawn.z + outZ * (3 + i * WORKER_SPACING),
      });
    }
  }

  // -----------------------------------------------------------------------
  // 5. Tree resource groves -- scattered in outer ring
  // -----------------------------------------------------------------------

  const treeResources: TreeResourceSpawn[] = [];
  const groveCenters: { x: number; z: number }[] = [];

  // 6 groves in the outer ring
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + rng() * 0.3;
    const radius = halfMap - 18 + (rng() - 0.5) * 6;
    groveCenters.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
    });
  }

  // 1 small grove near each player (so they have some wood access)
  for (let slot = 0; slot < playerCount; slot++) {
    const spawn = spawns[slot];
    const angle = (slot / playerCount) * Math.PI * 2 - Math.PI / 2;
    groveCenters.push({
      x: spawn.x + Math.cos(angle) * 10,
      z: spawn.z + Math.sin(angle) * 10,
    });
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
  // 6. Terrain features
  // -----------------------------------------------------------------------

  const terrainFeatures = generateArenaFeatures(rng, halfMap, spawns);

  // -----------------------------------------------------------------------
  // 7. Decorations -- normal amount
  // -----------------------------------------------------------------------

  const { decorations } = generateDecorations(
    rng, getHeight, halfMap, TREE_COUNT, ROCK_COUNT,
    [...spawns, ...goldMines, ...treeResources, ...buildings, ...units],
  );

  return {
    size: MAP_SIZE,
    heightScale: 10,
    spawns,
    goldMines,
    treeResources,
    buildings,
    units,
    decorations,
    terrainFeatures,
  };
}

// ---------------------------------------------------------------------------
// Shared decoration generator (used by all templates)
// ---------------------------------------------------------------------------

function generateDecorations(
  rng: () => number,
  getHeight: HeightCallback,
  halfMap: number,
  treeCount: number,
  rockCount: number,
  avoidSeed: { x: number; z: number }[],
): { decorations: DecoSpawn[] } {
  const avoidPositions = [...avoidSeed];
  const decorations: DecoSpawn[] = [];

  // Trees
  for (let i = 0; i < treeCount; i++) {
    const pos = findValidDecoPosition(rng, avoidPositions, halfMap, getHeight);
    if (pos) {
      decorations.push({
        type: DecoType.Tree,
        x: pos.x,
        z: pos.z,
        scale: 0.8 + rng() * 0.6,
        rotationY: rng() * Math.PI * 2,
      });
      avoidPositions.push(pos);
    }
  }

  // Rocks
  for (let i = 0; i < rockCount; i++) {
    const pos = findValidDecoPosition(rng, avoidPositions, halfMap, getHeight);
    if (pos) {
      decorations.push({
        type: DecoType.Rock,
        x: pos.x,
        z: pos.z,
        scale: 0.5 + rng() * 0.8,
        rotationY: rng() * Math.PI * 2,
      });
      avoidPositions.push(pos);
    }
  }

  return { decorations };
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

// ---------------------------------------------------------------------------
// Terrain feature generators (per-template)
// ---------------------------------------------------------------------------

/**
 * Generate a sinuous river path between two points using randomized control points.
 */
function generateRiverPath(
  rng: () => number,
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  segments: number = 8,
): PathPoint[] {
  const path: PathPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Base line interpolation
    const baseX = startX + (endX - startX) * t;
    const baseZ = startZ + (endZ - startZ) * t;
    // Perpendicular wiggle (sinusoidal + random offset)
    const perpX = -(endZ - startZ);
    const perpZ = endX - startX;
    const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ);
    const normalizedPerpX = perpLen > 0 ? perpX / perpLen : 0;
    const normalizedPerpZ = perpLen > 0 ? perpZ / perpLen : 0;
    const wiggle = Math.sin(t * Math.PI * 2.5) * 8 + (rng() - 0.5) * 6;
    path.push({
      x: baseX + normalizedPerpX * wiggle,
      z: baseZ + normalizedPerpZ * wiggle,
    });
  }
  return path;
}

/**
 * Generate road path between two points with mild curves.
 */
function generateRoadPath(
  rng: () => number,
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  segments: number = 6,
): PathPoint[] {
  const path: PathPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const baseX = startX + (endX - startX) * t;
    const baseZ = startZ + (endZ - startZ) * t;
    // Mild curves (less than rivers)
    const perpX = -(endZ - startZ);
    const perpZ = endX - startX;
    const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ);
    const nx = perpLen > 0 ? perpX / perpLen : 0;
    const nz = perpLen > 0 ? perpZ / perpLen : 0;
    const curve = Math.sin(t * Math.PI) * 3 + (rng() - 0.5) * 2;
    // Don't curve start and end points
    const curveFactor = Math.sin(t * Math.PI); // 0 at ends, 1 at middle
    path.push({
      x: baseX + nx * curve * curveFactor,
      z: baseZ + nz * curve * curveFactor,
    });
  }
  return path;
}

/**
 * Classic template features:
 * - 1 river cutting diagonally across the map
 * - 2 bridges across the river
 * - 2 rock wall clusters near the center
 * - Roads connecting bases to center
 * - 2 neutral tunnels
 */
function generateClassicFeatures(
  rng: () => number,
  halfMap: number,
  spawns: readonly SpawnPoint[],
): TerrainFeatures {
  // River: flows from NW edge to SE edge (diagonal across map)
  const riverPath = generateRiverPath(
    rng,
    -halfMap + 10, -halfMap * 0.3,
    halfMap - 10, halfMap * 0.3,
    10,
  );

  const rivers: RiverSpawn[] = [{
    path: riverPath,
    width: 5,
  }];

  // Bridges: place 2 bridges across the river at strategic points
  // Bridge 1: near center-left
  const bridge1X = -halfMap * 0.2;
  const bridge1Z = interpolatePathZ(riverPath, bridge1X);
  // Bridge 2: near center-right
  const bridge2X = halfMap * 0.25;
  const bridge2Z = interpolatePathZ(riverPath, bridge2X);

  const riverAngle1 = getPathAngle(riverPath, bridge1X);
  const riverAngle2 = getPathAngle(riverPath, bridge2X);

  const bridges: BridgeSpawn[] = [
    {
      x: bridge1X,
      z: bridge1Z,
      rotation: riverAngle1 + Math.PI / 2,
      width: 5,
      length: 7,
    },
    {
      x: bridge2X,
      z: bridge2Z,
      rotation: riverAngle2 + Math.PI / 2,
      width: 5,
      length: 7,
    },
  ];

  // Rock walls: two formations flanking the center to create chokepoints
  const rockWalls: RockWallSpawn[] = [
    {
      path: [
        { x: -15, z: 15 },
        { x: -10, z: 18 },
        { x: -5, z: 20 },
      ],
      thickness: 3,
    },
    {
      path: [
        { x: 5, z: -20 },
        { x: 10, z: -18 },
        { x: 15, z: -15 },
      ],
      thickness: 3,
    },
  ];

  // Roads: connect each base towards the nearest bridge
  const roads: RoadSpawn[] = [];
  if (spawns.length >= 2) {
    // Road from player 0 base to bridge 1
    roads.push({
      path: generateRoadPath(rng, spawns[0].x, spawns[0].z, bridge1X, bridge1Z),
      width: 2.5,
    });
    // Road from player 1 base to bridge 2
    roads.push({
      path: generateRoadPath(rng, spawns[1].x, spawns[1].z, bridge2X, bridge2Z),
      width: 2.5,
    });
    // Road connecting the two bridges through center
    roads.push({
      path: generateRoadPath(rng, bridge1X, bridge1Z, bridge2X, bridge2Z, 4),
      width: 2.5,
    });
  }

  // Tunnels: 2 neutral tunnels that bypass the river
  const tunnels: TunnelSpawn[] = [
    {
      id: 1,
      entrance: { x: -halfMap * 0.5, z: -halfMap * 0.4 },
      exit: { x: -halfMap * 0.3, z: halfMap * 0.3 },
      travelTime: 4,
      factionOwner: null,
    },
    {
      id: 2,
      entrance: { x: halfMap * 0.3, z: -halfMap * 0.3 },
      exit: { x: halfMap * 0.5, z: halfMap * 0.4 },
      travelTime: 4,
      factionOwner: null,
    },
  ];

  return {
    biome: 'meadow',
    rivers,
    bridges,
    rockWalls,
    roads,
    tunnels,
    flattenPositions: [
      // Flatten around bridge locations
      { x: bridge1X, z: bridge1Z },
      { x: bridge2X, z: bridge2Z },
      // Flatten around tunnel entrances/exits
      ...tunnels.flatMap(t => [t.entrance, t.exit]),
    ],
  };
}

/**
 * Crossroads template features:
 * - No river (urban environment)
 * - Many rock wall formations (industrial ruins)
 * - Cross-shaped road network
 * - 3 tunnels connecting edges
 */
function generateCrossroadsFeatures(
  rng: () => number,
  halfMap: number,
  spawns: readonly SpawnPoint[],
): TerrainFeatures {
  const rivers: RiverSpawn[] = []; // No rivers in urban

  const bridges: BridgeSpawn[] = []; // No bridges needed

  // Rock walls: scattered industrial ruins and rubble
  const rockWalls: RockWallSpawn[] = [
    {
      path: [
        { x: -halfMap * 0.3, z: -halfMap * 0.3 },
        { x: -halfMap * 0.2, z: -halfMap * 0.25 },
        { x: -halfMap * 0.15, z: -halfMap * 0.15 },
      ],
      thickness: 2.5,
    },
    {
      path: [
        { x: halfMap * 0.15, z: halfMap * 0.15 },
        { x: halfMap * 0.2, z: halfMap * 0.25 },
        { x: halfMap * 0.3, z: halfMap * 0.3 },
      ],
      thickness: 2.5,
    },
    {
      path: [
        { x: halfMap * 0.3, z: -halfMap * 0.2 },
        { x: halfMap * 0.35, z: -halfMap * 0.3 },
      ],
      thickness: 2,
    },
    {
      path: [
        { x: -halfMap * 0.3, z: halfMap * 0.2 },
        { x: -halfMap * 0.35, z: halfMap * 0.3 },
      ],
      thickness: 2,
    },
  ];

  // Cross-shaped road network through center
  const roads: RoadSpawn[] = [
    // Vertical road (N-S)
    {
      path: [
        { x: 0, z: -halfMap + 10 },
        { x: 0 + (rng() - 0.5) * 3, z: -halfMap * 0.3 },
        { x: 0, z: 0 },
        { x: 0 + (rng() - 0.5) * 3, z: halfMap * 0.3 },
        { x: 0, z: halfMap - 10 },
      ],
      width: 3,
    },
    // Horizontal road (E-W)
    {
      path: [
        { x: -halfMap + 10, z: 0 },
        { x: -halfMap * 0.3, z: 0 + (rng() - 0.5) * 3 },
        { x: 0, z: 0 },
        { x: halfMap * 0.3, z: 0 + (rng() - 0.5) * 3 },
        { x: halfMap - 10, z: 0 },
      ],
      width: 3,
    },
  ];

  // Connect each spawn to the road network
  for (const spawn of spawns) {
    const closestRoadX = Math.abs(spawn.x) < Math.abs(spawn.z) ? spawn.x : 0;
    const closestRoadZ = Math.abs(spawn.z) < Math.abs(spawn.x) ? spawn.z : 0;
    roads.push({
      path: generateRoadPath(rng, spawn.x, spawn.z, closestRoadX, closestRoadZ, 4),
      width: 2.5,
    });
  }

  // Tunnels: 3 tunnels connecting quadrants
  const tunnels: TunnelSpawn[] = [
    {
      id: 1,
      entrance: { x: -halfMap * 0.4, z: -halfMap * 0.1 },
      exit: { x: halfMap * 0.1, z: -halfMap * 0.4 },
      travelTime: 3,
      factionOwner: null,
    },
    {
      id: 2,
      entrance: { x: halfMap * 0.4, z: halfMap * 0.1 },
      exit: { x: -halfMap * 0.1, z: halfMap * 0.4 },
      travelTime: 3,
      factionOwner: null,
    },
    {
      id: 3,
      entrance: { x: -halfMap * 0.35, z: halfMap * 0.35 },
      exit: { x: halfMap * 0.35, z: -halfMap * 0.35 },
      travelTime: 5,
      factionOwner: null,
    },
  ];

  return {
    biome: 'urban',
    rivers,
    bridges,
    rockWalls,
    roads,
    tunnels,
    flattenPositions: tunnels.flatMap(t => [t.entrance, t.exit]),
  };
}

/**
 * Islands template features:
 * - Multiple river channels creating island landmasses
 * - Bridges connecting the islands
 * - Minimal rock walls
 * - Roads on each island
 * - 4 tunnels (island-to-island shortcuts)
 */
function generateIslandsFeatures(
  rng: () => number,
  halfMap: number,
  spawns: readonly SpawnPoint[],
): TerrainFeatures {
  // Two rivers creating island channels
  const river1 = generateRiverPath(
    rng,
    -halfMap + 5, 0,
    halfMap - 5, 0,
    12,
  );
  const river2 = generateRiverPath(
    rng,
    0, -halfMap + 5,
    0, halfMap - 5,
    12,
  );

  const rivers: RiverSpawn[] = [
    { path: river1, width: 6 },
    { path: river2, width: 6 },
  ];

  // 4 bridges -- one in each quadrant connecting the islands
  const bridges: BridgeSpawn[] = [
    { x: -halfMap * 0.3, z: interpolatePathZ(river1, -halfMap * 0.3), rotation: getPathAngle(river1, -halfMap * 0.3) + Math.PI / 2, width: 5, length: 8 },
    { x: halfMap * 0.3, z: interpolatePathZ(river1, halfMap * 0.3), rotation: getPathAngle(river1, halfMap * 0.3) + Math.PI / 2, width: 5, length: 8 },
    { x: interpolatePathX(river2, -halfMap * 0.3), z: -halfMap * 0.3, rotation: getPathAngleAtZ(river2, -halfMap * 0.3) + Math.PI / 2, width: 5, length: 8 },
    { x: interpolatePathX(river2, halfMap * 0.3), z: halfMap * 0.3, rotation: getPathAngleAtZ(river2, halfMap * 0.3) + Math.PI / 2, width: 5, length: 8 },
  ];

  const rockWalls: RockWallSpawn[] = []; // Open terrain on islands

  // Short roads on each island connecting to bridges
  const roads: RoadSpawn[] = [];
  for (const spawn of spawns) {
    // Find nearest bridge
    let nearestBridge = bridges[0];
    let nearestDist = Infinity;
    for (const bridge of bridges) {
      const dx = spawn.x - bridge.x;
      const dz = spawn.z - bridge.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < nearestDist) {
        nearestDist = d;
        nearestBridge = bridge;
      }
    }
    roads.push({
      path: generateRoadPath(rng, spawn.x, spawn.z, nearestBridge.x, nearestBridge.z, 4),
      width: 2.5,
    });
  }

  // 4 tunnels: shortcuts under the water channels
  const tunnels: TunnelSpawn[] = [
    {
      id: 1,
      entrance: { x: -halfMap * 0.35, z: -halfMap * 0.35 },
      exit: { x: halfMap * 0.35, z: halfMap * 0.35 },
      travelTime: 5,
      factionOwner: null,
    },
    {
      id: 2,
      entrance: { x: halfMap * 0.35, z: -halfMap * 0.35 },
      exit: { x: -halfMap * 0.35, z: halfMap * 0.35 },
      travelTime: 5,
      factionOwner: null,
    },
    {
      id: 3,
      entrance: { x: -halfMap * 0.15, z: -halfMap * 0.15 },
      exit: { x: halfMap * 0.15, z: halfMap * 0.15 },
      travelTime: 3,
      factionOwner: null,
    },
    {
      id: 4,
      entrance: { x: halfMap * 0.15, z: -halfMap * 0.15 },
      exit: { x: -halfMap * 0.15, z: halfMap * 0.15 },
      travelTime: 3,
      factionOwner: null,
    },
  ];

  return {
    biome: 'aquatic',
    rivers,
    bridges,
    rockWalls,
    roads,
    tunnels,
    flattenPositions: [
      ...bridges.map(b => ({ x: b.x, z: b.z })),
      ...tunnels.flatMap(t => [t.entrance, t.exit]),
    ],
  };
}

/**
 * Arena template features:
 * - No rivers (dry arena)
 * - Ring of rock walls around center arena
 * - Radial roads from spawn positions to center
 * - 2 tunnels (opposite sides of the arena)
 */
function generateArenaFeatures(
  rng: () => number,
  halfMap: number,
  spawns: readonly SpawnPoint[],
): TerrainFeatures {
  const rivers: RiverSpawn[] = [];
  const bridges: BridgeSpawn[] = [];

  // Rock wall segments forming a broken ring around center
  const ringRadius = halfMap * 0.55;
  const rockWalls: RockWallSpawn[] = [];
  const gapAngles = spawns.map((_s, i) => (i / spawns.length) * Math.PI * 2 - Math.PI / 2);

  for (let i = 0; i < 8; i++) {
    const startAngle = (i / 8) * Math.PI * 2;
    const endAngle = ((i + 0.6) / 8) * Math.PI * 2;

    // Skip wall segments near spawn approach angles
    let nearGap = false;
    for (const gapAngle of gapAngles) {
      const midAngle = (startAngle + endAngle) / 2;
      const diff = Math.abs(((midAngle - gapAngle + Math.PI) % (Math.PI * 2)) - Math.PI);
      if (diff < 0.5) {
        nearGap = true;
        break;
      }
    }
    if (nearGap) continue;

    const segments = 4;
    const path: PathPoint[] = [];
    for (let s = 0; s <= segments; s++) {
      const angle = startAngle + (endAngle - startAngle) * (s / segments);
      const r = ringRadius + (rng() - 0.5) * 3;
      path.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
      });
    }
    rockWalls.push({ path, thickness: 2 });
  }

  // Radial roads from each spawn to center
  const roads: RoadSpawn[] = [];
  for (const spawn of spawns) {
    roads.push({
      path: generateRoadPath(rng, spawn.x, spawn.z, 0, 0, 5),
      width: 3,
    });
  }

  // 2 tunnels: opposite sides of the arena ring
  const tunnels: TunnelSpawn[] = [
    {
      id: 1,
      entrance: { x: -ringRadius * 0.9, z: 0 },
      exit: { x: ringRadius * 0.9, z: 0 },
      travelTime: 3,
      factionOwner: null,
    },
    {
      id: 2,
      entrance: { x: 0, z: -ringRadius * 0.9 },
      exit: { x: 0, z: ringRadius * 0.9 },
      travelTime: 3,
      factionOwner: null,
    },
  ];

  return {
    biome: 'arid',
    rivers,
    bridges,
    rockWalls,
    roads,
    tunnels,
    flattenPositions: tunnels.flatMap(t => [t.entrance, t.exit]),
  };
}

// ---------------------------------------------------------------------------
// Path interpolation helpers
// ---------------------------------------------------------------------------

/** Interpolate Z coordinate along a path at a given X position. */
function interpolatePathZ(path: readonly PathPoint[], targetX: number): number {
  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i];
    const p1 = path[i + 1];
    if ((p0.x <= targetX && p1.x >= targetX) || (p0.x >= targetX && p1.x <= targetX)) {
      const range = p1.x - p0.x;
      if (Math.abs(range) < 0.001) return (p0.z + p1.z) / 2;
      const t = (targetX - p0.x) / range;
      return p0.z + t * (p1.z - p0.z);
    }
  }
  // Fallback: closest endpoint
  const first = path[0];
  const last = path[path.length - 1];
  return Math.abs(first.x - targetX) < Math.abs(last.x - targetX) ? first.z : last.z;
}

/** Interpolate X coordinate along a path at a given Z position. */
function interpolatePathX(path: readonly PathPoint[], targetZ: number): number {
  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i];
    const p1 = path[i + 1];
    if ((p0.z <= targetZ && p1.z >= targetZ) || (p0.z >= targetZ && p1.z <= targetZ)) {
      const range = p1.z - p0.z;
      if (Math.abs(range) < 0.001) return (p0.x + p1.x) / 2;
      const t = (targetZ - p0.z) / range;
      return p0.x + t * (p1.x - p0.x);
    }
  }
  const first = path[0];
  const last = path[path.length - 1];
  return Math.abs(first.z - targetZ) < Math.abs(last.z - targetZ) ? first.x : last.x;
}

/** Get the angle of the path at a given X position (for bridge rotation). */
function getPathAngle(path: readonly PathPoint[], targetX: number): number {
  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i];
    const p1 = path[i + 1];
    if ((p0.x <= targetX && p1.x >= targetX) || (p0.x >= targetX && p1.x <= targetX)) {
      return Math.atan2(p1.z - p0.z, p1.x - p0.x);
    }
  }
  if (path.length >= 2) {
    return Math.atan2(path[1].z - path[0].z, path[1].x - path[0].x);
  }
  return 0;
}

/** Get the angle of the path at a given Z position. */
function getPathAngleAtZ(path: readonly PathPoint[], targetZ: number): number {
  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i];
    const p1 = path[i + 1];
    if ((p0.z <= targetZ && p1.z >= targetZ) || (p0.z >= targetZ && p1.z <= targetZ)) {
      return Math.atan2(p1.z - p0.z, p1.x - p0.x);
    }
  }
  if (path.length >= 2) {
    return Math.atan2(path[1].z - path[0].z, path[1].x - path[0].x);
  }
  return 0;
}

/**
 * Get the player's spawn point from a generated map.
 */
export function getPlayerSpawn(map: GeneratedMap): SpawnPoint {
  return map.spawns.find((s) => s.factionId === FactionId.Brabanders)!;
}

/**
 * Get a non-player spawn point from a generated map (for the AI opponent).
 * @param playerFactionId The player's faction ID to exclude.
 */
export function getAISpawn(map: GeneratedMap, playerFactionId?: FactionId): SpawnPoint {
  if (playerFactionId !== undefined) {
    return map.spawns.find((s) => s.factionId !== playerFactionId)!;
  }
  // Fallback: return the second spawn (index 1) for backwards compatibility
  return map.spawns[1] ?? map.spawns[0];
}
