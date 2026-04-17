// RED test for P1 Bug 6 — pre-generated map-bridges must align to river paths.
//
// User-reported symptom: "bruggen staan nog random verdeeld over het terrein
// en niet alleen over rivers".
//
// Root cause (v0.37.6): generateRiverValley and generateArchipelago place
// bridges at ASSUMED positions (z=0 on river-valley; on circle at
// centerIslandRadius on archipelago) while the actual river paths are
// wiggled by RNG. For higher wiggle amplitudes the bridge ends up sitting
// next to the river instead of crossing it.
//
// Post-fix contract (enforced by tests): every bridge in terrainFeatures
// must be within BRIDGE_MAX_OFFSET_FROM_RIVER world-units of its closest
// river-path point. The two templates that ship bridges (river-valley,
// archipelago) must both pass this invariant across several seeds.

import { describe, it, expect } from 'vitest';
import { generateMap } from '../src/world/MapGenerator';

// Post-fix: bridges must be "on" a river path. We allow ~half the channel
// width (rivers are several units wide) as tolerance.
const BRIDGE_MAX_OFFSET_FROM_RIVER = 4.0;

function distSqToPath(
  x: number,
  z: number,
  path: ReadonlyArray<{ x: number; z: number }>,
): number {
  let min = Infinity;
  for (const p of path) {
    const dx = x - p.x;
    const dz = z - p.z;
    const d = dx * dx + dz * dz;
    if (d < min) min = d;
  }
  return min;
}

function minBridgeRiverDistance(map: ReturnType<typeof generateMap>): number {
  const { bridges, rivers } = map.terrainFeatures;
  if (bridges.length === 0) return 0;
  if (rivers.length === 0) return Infinity; // bridges exist without any rivers -> worst case

  let worst = 0;
  for (const b of bridges) {
    let bestDistSq = Infinity;
    for (const river of rivers) {
      const d = distSqToPath(b.x, b.z, river.path);
      if (d < bestDistSq) bestDistSq = d;
    }
    const dist = Math.sqrt(bestDistSq);
    if (dist > worst) worst = dist;
  }
  return worst;
}

describe('Bug 6 — map bridges align to river paths', () => {
  describe('template: river-valley', () => {
    const seeds = [1, 42, 1337, 8675, 20260417];

    for (const seed of seeds) {
      it(`seed=${seed}, 2 players: every bridge sits on a river`, () => {
        const map = generateMap(seed, () => 0, 2, 'river-valley', 128);
        expect(map.terrainFeatures.bridges.length).toBeGreaterThan(0);
        const worst = minBridgeRiverDistance(map);
        expect(worst).toBeLessThanOrEqual(BRIDGE_MAX_OFFSET_FROM_RIVER);
      });
    }
  });

  describe('template: archipelago', () => {
    const seeds = [1, 42, 1337];

    for (const seed of seeds) {
      for (const playerCount of [2, 3, 4] as const) {
        it(`seed=${seed}, ${playerCount} players: every bridge sits on a river`, () => {
          const map = generateMap(seed, () => 0, playerCount, 'archipelago', 128);
          expect(map.terrainFeatures.bridges.length).toBeGreaterThan(0);
          const worst = minBridgeRiverDistance(map);
          expect(worst).toBeLessThanOrEqual(BRIDGE_MAX_OFFSET_FROM_RIVER);
        });
      }
    }
  });

  it('regression guard: no map template ships bridges without any rivers', () => {
    const templates = [
      'classic', 'crossroads', 'islands', 'arena',
      'fortress', 'river-valley', 'canyon', 'archipelago',
    ] as const;

    for (const template of templates) {
      const map = generateMap(42, () => 0, 2, template, 128);
      if (map.terrainFeatures.bridges.length > 0) {
        expect(
          map.terrainFeatures.rivers.length,
          `template ${template} has bridges but no rivers`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
