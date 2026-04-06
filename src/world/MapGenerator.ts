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
  // 6. Decoration props (trees and rocks)
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
  // 6. Decorations -- more trees (denser map)
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
  // 6. Decorations -- fewer trees (open centre), normal rocks
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
  // 6. Decorations -- normal amount
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
