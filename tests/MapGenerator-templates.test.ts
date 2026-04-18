/**
 * MapGenerator-templates.test.ts -- Coverage for all 8 templates × 2-4 players.
 *
 * The original MapGenerator.test.ts covers classic/crossroads/islands/arena.
 * This file fills the gap for fortress/river-valley/canyon/archipelago and
 * adds a robustness suite that validates structural invariants across
 * every (template, playerCount) combination plus several "weird" seeds.
 *
 * Audit context: full-playthrough audit Fase 2 stap 6 — "elk van 8 templates
 * genereert een consistente map (...) geen crashes bij rare seeds."
 */
import { describe, it, expect } from 'vitest';
import { generateMap, type MapTemplate } from '../src/world/MapGenerator';
import { FactionId, BuildingTypeId, UnitTypeId } from '../src/types/index';

const ALL_TEMPLATES: readonly MapTemplate[] = [
  'classic', 'crossroads', 'islands', 'arena',
  'fortress', 'river-valley', 'canyon', 'archipelago',
];
const VALID_BIOMES = new Set(['meadow', 'urban', 'aquatic', 'arid']);
const PLAYER_COUNTS: readonly (2 | 3 | 4)[] = [2, 3, 4];
const WEIRD_SEEDS: readonly number[] = [0, 1, -1, 42, 2147483647, -2147483648, 1234567890];

// ---------------------------------------------------------------------------
// Per-template smoke tests for the 4 templates without dedicated coverage
// ---------------------------------------------------------------------------

describe('Fortress template', () => {
  for (const playerCount of PLAYER_COUNTS) {
    it(`generates ${playerCount} spawns + townhalls + ${playerCount * 3} workers`, () => {
      const map = generateMap(42, () => 0, playerCount, 'fortress');
      expect(map.spawns).toHaveLength(playerCount);
      expect(map.buildings).toHaveLength(playerCount);
      expect(map.units).toHaveLength(playerCount * 3);
    });
  }

  it('has arid biome and no rivers (stronghold layout)', () => {
    const map = generateMap(42, () => 0, 2, 'fortress');
    expect(map.terrainFeatures.biome).toBe('arid');
    expect(map.terrainFeatures.rivers).toHaveLength(0);
  });

  it('has rockWalls forming the central fort (>= 4 segments)', () => {
    const map = generateMap(42, () => 0, 2, 'fortress');
    expect(map.terrainFeatures.rockWalls.length).toBeGreaterThanOrEqual(4);
  });

  it('has flanking tunnels with unique IDs and positive travelTime', () => {
    const map = generateMap(42, () => 0, 2, 'fortress');
    expect(map.terrainFeatures.tunnels.length).toBeGreaterThanOrEqual(1);
    const ids = map.terrainFeatures.tunnels.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of map.terrainFeatures.tunnels) {
      expect(t.travelTime).toBeGreaterThan(0);
    }
  });

  it('has 4 contested gold mines inside the fort (richer than border mines)', () => {
    const map = generateMap(42, () => 0, 2, 'fortress');
    const richMines = map.goldMines.filter(m => m.amount >= 3000);
    expect(richMines.length).toBeGreaterThanOrEqual(4);
  });
});

describe('River-Valley template', () => {
  for (const playerCount of PLAYER_COUNTS) {
    it(`generates ${playerCount} spawns + townhalls + ${playerCount * 3} workers`, () => {
      const map = generateMap(42, () => 0, playerCount, 'river-valley');
      expect(map.spawns).toHaveLength(playerCount);
      expect(map.buildings).toHaveLength(playerCount);
      expect(map.units).toHaveLength(playerCount * 3);
    });
  }

  it('has aquatic biome and exactly 1 river bisecting the map', () => {
    const map = generateMap(42, () => 0, 2, 'river-valley');
    expect(map.terrainFeatures.biome).toBe('aquatic');
    expect(map.terrainFeatures.rivers).toHaveLength(1);
  });

  it('has at least 5 bridges spanning the river', () => {
    const map = generateMap(42, () => 0, 2, 'river-valley');
    expect(map.terrainFeatures.bridges.length).toBeGreaterThanOrEqual(5);
  });

  it('has road segments along both river banks', () => {
    const map = generateMap(42, () => 0, 2, 'river-valley');
    expect(map.terrainFeatures.roads.length).toBeGreaterThanOrEqual(2);
  });

  it('places at least 3 gold mines per player + contested centre mines', () => {
    const map = generateMap(42, () => 0, 4, 'river-valley');
    // 4 players * 3 base mines + 4 bridge-side contested = 16
    expect(map.goldMines.length).toBeGreaterThanOrEqual(12);
  });
});

describe('Canyon template', () => {
  for (const playerCount of PLAYER_COUNTS) {
    it(`generates ${playerCount} spawns + townhalls + ${playerCount * 3} workers`, () => {
      const map = generateMap(42, () => 0, playerCount, 'canyon');
      expect(map.spawns).toHaveLength(playerCount);
      expect(map.buildings).toHaveLength(playerCount);
      expect(map.units).toHaveLength(playerCount * 3);
    });
  }

  it('returns a defined biome', () => {
    const map = generateMap(42, () => 0, 2, 'canyon');
    expect(VALID_BIOMES.has(map.terrainFeatures.biome)).toBe(true);
  });

  it('has rockWalls (canyon walls are rock)', () => {
    const map = generateMap(42, () => 0, 2, 'canyon');
    expect(map.terrainFeatures.rockWalls.length).toBeGreaterThan(0);
  });
});

describe('Archipelago template', () => {
  for (const playerCount of PLAYER_COUNTS) {
    it(`generates ${playerCount} spawns + townhalls + ${playerCount * 3} workers`, () => {
      const map = generateMap(42, () => 0, playerCount, 'archipelago');
      expect(map.spawns).toHaveLength(playerCount);
      expect(map.buildings).toHaveLength(playerCount);
      expect(map.units).toHaveLength(playerCount * 3);
    });
  }

  it('has aquatic biome with multiple rivers (channels between islands)', () => {
    const map = generateMap(42, () => 0, 2, 'archipelago');
    expect(map.terrainFeatures.biome).toBe('aquatic');
    expect(map.terrainFeatures.rivers.length).toBeGreaterThanOrEqual(2);
  });

  it('has bridges connecting the islands', () => {
    const map = generateMap(42, () => 0, 2, 'archipelago');
    expect(map.terrainFeatures.bridges.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Cross-template robustness invariants
// ---------------------------------------------------------------------------

describe('All templates × all player counts — structural invariants', () => {
  for (const template of ALL_TEMPLATES) {
    for (const playerCount of PLAYER_COUNTS) {
      describe(`${template} × ${playerCount}p`, () => {
        const map = generateMap(42, () => 0, playerCount, template);
        const halfMap = map.size / 2;

        it('returns the correct number of spawns/townhalls/workers', () => {
          expect(map.spawns).toHaveLength(playerCount);
          expect(map.buildings).toHaveLength(playerCount);
          expect(map.units).toHaveLength(playerCount * 3);
        });

        it('every building is a TownHall, every unit is a Worker', () => {
          for (const b of map.buildings) {
            expect(b.buildingType).toBe(BuildingTypeId.TownHall);
          }
          for (const u of map.units) {
            expect(u.unitType).toBe(UnitTypeId.Worker);
          }
        });

        it('every spawn has a TownHall at the same position', () => {
          for (const sp of map.spawns) {
            const matching = map.buildings.find(
              b => b.factionId === sp.factionId && Math.abs(b.x - sp.x) < 0.001 && Math.abs(b.z - sp.z) < 0.001,
            );
            expect(matching).toBeDefined();
          }
        });

        it('all spawn positions are within map bounds (±halfMap)', () => {
          for (const sp of map.spawns) {
            expect(Math.abs(sp.x)).toBeLessThanOrEqual(halfMap);
            expect(Math.abs(sp.z)).toBeLessThanOrEqual(halfMap);
          }
        });

        it('every spawn has a unique faction (no duplicate-faction games)', () => {
          const factions = map.spawns.map(s => s.factionId);
          expect(new Set(factions).size).toBe(factions.length);
        });

        it('every spawn position is unique', () => {
          const positions = map.spawns.map(s => `${s.x.toFixed(3)},${s.z.toFixed(3)}`);
          expect(new Set(positions).size).toBe(positions.length);
        });

        it('biome is one of the valid biome types', () => {
          expect(VALID_BIOMES.has(map.terrainFeatures.biome)).toBe(true);
        });

        it('returns at least 1 gold mine per player and at least 1 tree resource', () => {
          expect(map.goldMines.length).toBeGreaterThanOrEqual(playerCount);
          expect(map.treeResources.length).toBeGreaterThanOrEqual(1);
        });

        it('terrainFeatures arrays are all defined (never undefined)', () => {
          const tf = map.terrainFeatures;
          expect(Array.isArray(tf.rivers)).toBe(true);
          expect(Array.isArray(tf.bridges)).toBe(true);
          expect(Array.isArray(tf.rockWalls)).toBe(true);
          expect(Array.isArray(tf.roads)).toBe(true);
          expect(Array.isArray(tf.tunnels)).toBe(true);
        });
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Player slot ordering — first slot uses the player faction
// ---------------------------------------------------------------------------

describe('Spawn slot 0 — player position by convention', () => {
  it('slot 0 is always Brabanders (player default)', () => {
    // Player faction selection happens outside MapGenerator (Game.ts maps
    // selectedPlayerFaction → AI fills the rest). The convention is that
    // slot 0 belongs to Brabanders by default; AI factions fill 1..N-1.
    for (const template of ALL_TEMPLATES) {
      const map = generateMap(42, () => 0, 4, template);
      expect(map.spawns[0].factionId).toBe(FactionId.Brabanders);
    }
  });

  it('all 4 factions appear in 4-player games for every template', () => {
    const expected = new Set([FactionId.Brabanders, FactionId.Randstad, FactionId.Limburgers, FactionId.Belgen]);
    for (const template of ALL_TEMPLATES) {
      const map = generateMap(42, () => 0, 4, template);
      const got = new Set(map.spawns.map(s => s.factionId));
      expect(got).toEqual(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// Robustness — weird seeds must not crash any template
// ---------------------------------------------------------------------------

describe('Robustness — weird seeds do not crash any template', () => {
  for (const template of ALL_TEMPLATES) {
    for (const seed of WEIRD_SEEDS) {
      it(`${template} survives seed ${seed}`, () => {
        expect(() => generateMap(seed, () => 0, 2, template)).not.toThrow();
        const map = generateMap(seed, () => 0, 2, template);
        expect(map.spawns).toHaveLength(2);
        expect(map.buildings).toHaveLength(2);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Determinism — same seed → same map
// ---------------------------------------------------------------------------

describe('Determinism — identical seed yields identical layouts', () => {
  for (const template of ALL_TEMPLATES) {
    it(`${template} is deterministic for spawn positions`, () => {
      const a = generateMap(7777, () => 0, 4, template);
      const b = generateMap(7777, () => 0, 4, template);
      expect(a.spawns).toEqual(b.spawns);
      expect(a.buildings).toEqual(b.buildings);
      expect(a.goldMines).toEqual(b.goldMines);
    });
  }
});

// ---------------------------------------------------------------------------
// Map size scaling — small / medium / large
// ---------------------------------------------------------------------------

describe('Map size scaling — 80 / 128 / 192 all produce valid maps', () => {
  for (const template of ALL_TEMPLATES) {
    for (const size of [80, 128, 192] as const) {
      it(`${template} works at size ${size}`, () => {
        const map = generateMap(42, () => 0, 2, template, size);
        expect(map.size).toBe(size);
        expect(map.spawns).toHaveLength(2);
        // Spawns should be within the smaller bounds
        const halfMap = size / 2;
        for (const sp of map.spawns) {
          expect(Math.abs(sp.x)).toBeLessThanOrEqual(halfMap);
          expect(Math.abs(sp.z)).toBeLessThanOrEqual(halfMap);
        }
      });
    }
  }
});
