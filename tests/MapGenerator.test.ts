import { describe, it, expect } from 'vitest';
import { generateMap, type MapTemplate } from '../src/world/MapGenerator';
import { FactionId } from '../src/types/index';

describe('MapGenerator', () => {
  describe('generateMap with 2 players', () => {
    const map = generateMap(42, () => 0, 2);

    it('returns exactly 2 spawns', () => {
      expect(map.spawns).toHaveLength(2);
    });

    it('returns exactly 2 buildings (Town Halls)', () => {
      expect(map.buildings).toHaveLength(2);
    });

    it('returns exactly 6 workers (3 per player)', () => {
      expect(map.units).toHaveLength(6);
    });

    it('spawn factions are Brabanders(0) and Randstad(1)', () => {
      const factions = map.spawns.map((s) => s.factionId);
      expect(factions).toContain(FactionId.Brabanders);
      expect(factions).toContain(FactionId.Randstad);
    });

    it('has at least 4 gold mines', () => {
      // 2 players * 2 near-base mines + 2 contested centre mines = 6
      expect(map.goldMines.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('generateMap with 3 players', () => {
    const map = generateMap(42, () => 0, 3);

    it('returns exactly 3 spawns', () => {
      expect(map.spawns).toHaveLength(3);
    });

    it('returns exactly 3 buildings (Town Halls)', () => {
      expect(map.buildings).toHaveLength(3);
    });

    it('returns exactly 9 workers (3 per player)', () => {
      expect(map.units).toHaveLength(9);
    });
  });

  describe('generateMap with 4 players', () => {
    const map = generateMap(42, () => 0, 4);

    it('returns exactly 4 spawns', () => {
      expect(map.spawns).toHaveLength(4);
    });

    it('returns exactly 4 buildings (Town Halls)', () => {
      expect(map.buildings).toHaveLength(4);
    });

    it('returns exactly 12 workers (3 per player)', () => {
      expect(map.units).toHaveLength(12);
    });

    it('spawn factions include all 4 factions', () => {
      const factions = map.spawns.map((s) => s.factionId);
      expect(factions).toContain(FactionId.Brabanders);
      expect(factions).toContain(FactionId.Randstad);
      expect(factions).toContain(FactionId.Limburgers);
      expect(factions).toContain(FactionId.Belgen);
    });

    it('has at least 8 gold mines', () => {
      // 4 players * 2 near-base mines + 2 contested centre mines = 10
      expect(map.goldMines.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('spawn uniqueness', () => {
    it('each spawn has a unique position (no two spawns at same x,z)', () => {
      const map = generateMap(42, () => 0, 4);
      const positions = map.spawns.map((s) => `${s.x},${s.z}`);
      const unique = new Set(positions);
      expect(unique.size).toBe(positions.length);
    });
  });

  describe('backward compatibility', () => {
    it('defaults to playerCount=2 when not specified', () => {
      const map = generateMap(42, () => 0);
      expect(map.spawns).toHaveLength(2);
      expect(map.buildings).toHaveLength(2);
      expect(map.units).toHaveLength(6);
    });
  });

  // ---------------------------------------------------------------------------
  // Terrain features tests
  // ---------------------------------------------------------------------------

  describe('terrain features', () => {
    it('classic template includes terrainFeatures with meadow biome', () => {
      const map = generateMap(42, () => 0, 2, 'classic');
      expect(map.terrainFeatures).toBeDefined();
      expect(map.terrainFeatures.biome).toBe('meadow');
    });

    it('crossroads template has urban biome', () => {
      const map = generateMap(42, () => 0, 2, 'crossroads');
      expect(map.terrainFeatures.biome).toBe('urban');
    });

    it('islands template has aquatic biome', () => {
      const map = generateMap(42, () => 0, 2, 'islands');
      expect(map.terrainFeatures.biome).toBe('aquatic');
    });

    it('arena template has arid biome', () => {
      const map = generateMap(42, () => 0, 2, 'arena');
      expect(map.terrainFeatures.biome).toBe('arid');
    });

    it('classic template has at least 1 river', () => {
      const map = generateMap(42, () => 0, 2, 'classic');
      expect(map.terrainFeatures.rivers.length).toBeGreaterThanOrEqual(1);
    });

    it('classic template has at least 2 bridges', () => {
      const map = generateMap(42, () => 0, 2, 'classic');
      expect(map.terrainFeatures.bridges.length).toBeGreaterThanOrEqual(2);
    });

    it('classic template has at least 2 tunnels', () => {
      const map = generateMap(42, () => 0, 2, 'classic');
      expect(map.terrainFeatures.tunnels.length).toBeGreaterThanOrEqual(2);
    });

    it('islands template has multiple rivers creating channels', () => {
      const map = generateMap(42, () => 0, 2, 'islands');
      expect(map.terrainFeatures.rivers.length).toBeGreaterThanOrEqual(2);
    });

    it('arena template has no rivers (dry arena)', () => {
      const map = generateMap(42, () => 0, 2, 'arena');
      expect(map.terrainFeatures.rivers).toHaveLength(0);
    });

    it('all templates have roads', () => {
      const templates: MapTemplate[] = ['classic', 'crossroads', 'islands', 'arena'];
      for (const template of templates) {
        const map = generateMap(42, () => 0, 2, template);
        expect(map.terrainFeatures.roads.length).toBeGreaterThan(0);
      }
    });

    it('tunnels have valid entrance/exit positions within map bounds', () => {
      const map = generateMap(42, () => 0, 2, 'classic');
      const halfMap = map.size / 2;
      for (const tunnel of map.terrainFeatures.tunnels) {
        expect(tunnel.entrance.x).toBeGreaterThanOrEqual(-halfMap);
        expect(tunnel.entrance.x).toBeLessThanOrEqual(halfMap);
        expect(tunnel.entrance.z).toBeGreaterThanOrEqual(-halfMap);
        expect(tunnel.entrance.z).toBeLessThanOrEqual(halfMap);
        expect(tunnel.exit.x).toBeGreaterThanOrEqual(-halfMap);
        expect(tunnel.exit.x).toBeLessThanOrEqual(halfMap);
        expect(tunnel.exit.z).toBeGreaterThanOrEqual(-halfMap);
        expect(tunnel.exit.z).toBeLessThanOrEqual(halfMap);
        expect(tunnel.travelTime).toBeGreaterThan(0);
      }
    });

    it('tunnels have unique IDs', () => {
      const map = generateMap(42, () => 0, 2, 'classic');
      const ids = map.terrainFeatures.tunnels.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('river paths have at least 2 points', () => {
      const map = generateMap(42, () => 0, 2, 'classic');
      for (const river of map.terrainFeatures.rivers) {
        expect(river.path.length).toBeGreaterThanOrEqual(2);
        expect(river.width).toBeGreaterThan(0);
      }
    });

    it('rock walls have at least 2 path points', () => {
      const map = generateMap(42, () => 0, 2, 'classic');
      for (const wall of map.terrainFeatures.rockWalls) {
        expect(wall.path.length).toBeGreaterThanOrEqual(2);
        expect(wall.thickness).toBeGreaterThan(0);
      }
    });
  });
});
