import { describe, it, expect } from 'vitest';
import { generateMap } from '../src/world/MapGenerator';
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
});
