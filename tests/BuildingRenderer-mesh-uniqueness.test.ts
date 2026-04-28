import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDING_MODEL_PATHS } from '@rendering/BuildingRenderer';

const FACTIONS = [
  { id: 0, slug: 'brabanders' },
  { id: 1, slug: 'randstad' },
  { id: 2, slug: 'limburgers' },
  { id: 3, slug: 'belgen' },
] as const;

const BUILDING_TYPES = [
  'townhall',
  'barracks',
  'blacksmith',
  'lumbercamp',
  'housing',
  'tower',
  'advanced',
  'siege-workshop',
  'tertiary',
  'upgrade',
  'special1',
] as const;

const projectRoot = resolve(__dirname, '..');

function pathsForFaction(factionId: number): string[] {
  return Object.entries(BUILDING_MODEL_PATHS)
    .filter(([key]) => key.endsWith(`_${factionId}`))
    .map(([, value]) => value);
}

describe('BuildingRenderer V02 mesh-uniqueness (Bundle 5)', () => {
  describe('per-faction unique GLB paths', () => {
    it('Randstad has 11 unique GLB paths (no fallback duplicates)', () => {
      const paths = pathsForFaction(1);
      expect(paths).toHaveLength(11);
      expect(new Set(paths).size).toBe(11);
    });

    it('Limburgers has 11 unique GLB paths (no fallback duplicates)', () => {
      const paths = pathsForFaction(2);
      expect(paths).toHaveLength(11);
      expect(new Set(paths).size).toBe(11);
    });

    it('Belgen has 11 unique GLB paths (no fallback duplicates)', () => {
      const paths = pathsForFaction(3);
      expect(paths).toHaveLength(11);
      expect(new Set(paths).size).toBe(11);
    });

    it('Brabanders has 11 unique GLB paths (Bundle 4A v0.37.41 — Worstenbroodjeskraam dedicated)', () => {
      const paths = pathsForFaction(0);
      expect(paths).toHaveLength(11);
      expect(new Set(paths).size).toBe(11);
      expect(BUILDING_MODEL_PATHS['tertiary_0']).toBe('/assets/models/v02/brabanders/worstenbroodjeskraam.glb');
    });
  });

  describe('cross-faction path isolation', () => {
    for (const f of FACTIONS) {
      it(`${f.slug} paths all live in /assets/models/v02/${f.slug}/`, () => {
        const paths = pathsForFaction(f.id);
        for (const p of paths) {
          expect(p).toMatch(new RegExp(`^/assets/models/v02/${f.slug}/`));
        }
      });
    }
  });

  describe('Bundle 5 target slots wired (not fallback)', () => {
    it('Randstad/Limburgers/Belgen tertiary use dedicated tertiary.glb', () => {
      expect(BUILDING_MODEL_PATHS['tertiary_1']).toBe('/assets/models/v02/randstad/tertiary.glb');
      expect(BUILDING_MODEL_PATHS['tertiary_2']).toBe('/assets/models/v02/limburgers/tertiary.glb');
      expect(BUILDING_MODEL_PATHS['tertiary_3']).toBe('/assets/models/v02/belgen/tertiary.glb');
    });

    it('All 4 factions upgrade use dedicated upgrade.glb', () => {
      expect(BUILDING_MODEL_PATHS['upgrade_0']).toBe('/assets/models/v02/brabanders/upgrade.glb');
      expect(BUILDING_MODEL_PATHS['upgrade_1']).toBe('/assets/models/v02/randstad/upgrade.glb');
      expect(BUILDING_MODEL_PATHS['upgrade_2']).toBe('/assets/models/v02/limburgers/upgrade.glb');
      expect(BUILDING_MODEL_PATHS['upgrade_3']).toBe('/assets/models/v02/belgen/upgrade.glb');
    });

    it('All 4 factions special1 use dedicated special1.glb', () => {
      expect(BUILDING_MODEL_PATHS['special1_0']).toBe('/assets/models/v02/brabanders/special1.glb');
      expect(BUILDING_MODEL_PATHS['special1_1']).toBe('/assets/models/v02/randstad/special1.glb');
      expect(BUILDING_MODEL_PATHS['special1_2']).toBe('/assets/models/v02/limburgers/special1.glb');
      expect(BUILDING_MODEL_PATHS['special1_3']).toBe('/assets/models/v02/belgen/special1.glb');
    });
  });

  describe('all V02 GLBs exist on disk', () => {
    for (const [key, path] of Object.entries(BUILDING_MODEL_PATHS)) {
      it(`${key} → ${path} exists`, () => {
        const fsPath = resolve(projectRoot, 'public' + path);
        expect(existsSync(fsPath), `Missing GLB: ${fsPath}`).toBe(true);
      });
    }
  });

  describe('every (type × faction) pair is mapped', () => {
    for (const t of BUILDING_TYPES) {
      for (const f of FACTIONS) {
        it(`${t}_${f.id} (${f.slug}) is mapped`, () => {
          const key = `${t}_${f.id}`;
          expect(BUILDING_MODEL_PATHS).toHaveProperty(key);
          expect(BUILDING_MODEL_PATHS[key]).toMatch(/\.glb$/);
        });
      }
    }
  });
});
