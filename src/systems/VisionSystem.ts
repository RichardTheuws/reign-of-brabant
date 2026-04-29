/**
 * Reign of Brabant -- Vision System
 *
 * Calculates visibility for fog of war.
 * For each player unit with Position + Visibility:
 *   - Mark area as visible (circle with radius = sightRange).
 * Outputs a Set of visible enemy entity IDs.
 *
 * Runs at reduced frequency (5 FPS) for performance.
 * The actual fog texture rendering is done by FogOfWarRenderer.
 */

import { query, hasComponent } from 'bitecs';
import {
  Position,
  Visibility,
  Faction,
} from '../ecs/components';
import { IsDead } from '../ecs/tags';
import { FOW_UPDATE_RATE, MAP_SIZE } from '../types/index';
import { gameConfig } from '../core/GameConfig';
import { getFactionSpecial2SightBonus } from './FactionSpecial2Passives';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Vision data output -- shared with renderer
// ---------------------------------------------------------------------------

/** Visibility buffer: 128x128, one byte per cell (0 = not visible, 1 = visible). */
const BUFFER_SIZE = MAP_SIZE;

export interface VisionData {
  /** Current frame visibility (reset each update). */
  readonly visibleBuffer: Uint8Array;
  /** Persistent explored buffer (never goes back to 0). */
  readonly exploredBuffer: Uint8Array;
  /** Set of enemy entity IDs currently visible to the player. */
  readonly visibleEnemies: Set<number>;
  /** Vision sources for the renderer (position + range). */
  readonly sources: Array<{ x: number; z: number; range: number }>;
}

/** Singleton vision data -- consumed by FogOfWarRenderer and RenderSyncSystem. */
export const visionData: VisionData = {
  visibleBuffer: new Uint8Array(BUFFER_SIZE * BUFFER_SIZE),
  exploredBuffer: new Uint8Array(BUFFER_SIZE * BUFFER_SIZE),
  visibleEnemies: new Set(),
  sources: [],
};

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

/**
 * Create the vision system.
 */
export function createVisionSystem() {
  let accumulator = 0;
  const updateInterval = 1 / FOW_UPDATE_RATE;

  return function visionSystem(world: GameWorld, dt: number): void {
    accumulator += dt;
    if (accumulator < updateInterval) return;
    accumulator -= updateInterval;

    // Reset per-update data
    visionData.visibleBuffer.fill(0);
    visionData.visibleEnemies.clear();
    visionData.sources.length = 0;

    // Collect visibility sources from player entities (units + buildings)
    const allEntities = query(world, [Position, Visibility, Faction]);

    for (const eid of allEntities) {
      if (hasComponent(world, eid, IsDead)) continue;

      if (gameConfig.isPlayerFaction(Faction.id[eid])) {
        const wx = Position.x[eid];
        const wz = Position.z[eid];
        // FactionSpecial2 passive — per active building +1 sight, cap +3.
        const range = Visibility.range[eid] + getFactionSpecial2SightBonus(Faction.id[eid]);

        // Store source for renderer
        visionData.sources.push({ x: wx, z: wz, range });

        // Stamp visibility circle into buffer
        stampCircle(wx, wz, range);
      }
    }

    // Merge into explored buffer
    const vis = visionData.visibleBuffer;
    const exp = visionData.exploredBuffer;
    for (let i = 0, len = vis.length; i < len; i++) {
      if (vis[i] > exp[i]) {
        exp[i] = vis[i];
      }
    }

    // Determine which enemy entities are visible
    for (const eid of allEntities) {
      if (gameConfig.isPlayerFaction(Faction.id[eid])) continue;
      if (hasComponent(world, eid, IsDead)) continue;

      const bufIdx = worldToBufferIndex(Position.x[eid], Position.z[eid]);
      if (bufIdx >= 0 && vis[bufIdx] > 0) {
        visionData.visibleEnemies.add(eid);
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert world coordinates to buffer index.
 * World space: [-MAP_SIZE/2 .. +MAP_SIZE/2]
 * Buffer space: [0 .. BUFFER_SIZE-1]
 */
function worldToBufferIndex(wx: number, wz: number): number {
  const half = MAP_SIZE / 2;
  const bx = Math.floor(((wx + half) / MAP_SIZE) * BUFFER_SIZE);
  const bz = Math.floor(((wz + half) / MAP_SIZE) * BUFFER_SIZE);

  if (bx < 0 || bx >= BUFFER_SIZE || bz < 0 || bz >= BUFFER_SIZE) return -1;
  return bz * BUFFER_SIZE + bx;
}

/**
 * Stamp a filled circle into the visibility buffer.
 * Uses integer rasterization (Bresenham-style) for speed.
 */
function stampCircle(wx: number, wz: number, worldRadius: number): void {
  const half = MAP_SIZE / 2;
  const scale = BUFFER_SIZE / MAP_SIZE;

  const cx = Math.floor((wx + half) * scale);
  const cz = Math.floor((wz + half) * scale);
  const r = Math.ceil(worldRadius * scale);

  const rSq = r * r;
  const minX = Math.max(0, cx - r);
  const maxX = Math.min(BUFFER_SIZE - 1, cx + r);
  const minZ = Math.max(0, cz - r);
  const maxZ = Math.min(BUFFER_SIZE - 1, cz + r);

  const buf = visionData.visibleBuffer;

  for (let z = minZ; z <= maxZ; z++) {
    const dz = z - cz;
    const dzSq = dz * dz;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      if (dx * dx + dzSq <= rSq) {
        buf[z * BUFFER_SIZE + x] = 1;
      }
    }
  }
}
