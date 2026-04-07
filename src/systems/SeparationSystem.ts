/**
 * Reign of Brabant -- Separation System
 *
 * Prevents units from stacking on the exact same position by applying
 * a gentle push-apart force when idle or arriving units overlap.
 *
 * Uses a spatial grid for O(n) performance instead of O(n^2) pairwise checks.
 * Only nudges units that are idle or have just arrived (not actively moving
 * toward a distant target) to avoid interfering with pathfinding.
 */

import { query, hasComponent } from 'bitecs';
import { Position, Movement, UnitAI, Stunned } from '../ecs/components';
import { IsUnit, IsDead } from '../ecs/tags';
import { UnitAIState, MAP_SIZE } from '../types/index';
import type { GameWorld } from '../ecs/world';

/** Grid cell size in world units. Should be >= separation radius. */
const CELL_SIZE = 3.0;

/** Minimum distance between units before separation kicks in. */
const SEPARATION_RADIUS = 1.2;
const SEPARATION_RADIUS_SQ = SEPARATION_RADIUS * SEPARATION_RADIUS;

/** How strongly units push apart (world units per second). */
const SEPARATION_STRENGTH = 2.5;

/** Grid dimensions (MAP_SIZE / CELL_SIZE, rounded up). */
const GRID_DIM = Math.ceil(MAP_SIZE / CELL_SIZE) + 2; // +2 for safety margin

/** Flat grid: each cell stores start index + count into a packed entity array. */
const cellStart = new Int32Array(GRID_DIM * GRID_DIM);
const cellCount = new Int32Array(GRID_DIM * GRID_DIM);

/** Packed entity array (reused each frame). */
const packedEids = new Int32Array(1024); // MAX_ENTITIES
let packedLen = 0;

/**
 * Convert world coordinate to grid index.
 */
function toGrid(val: number): number {
  const halfMap = MAP_SIZE / 2;
  const g = Math.floor((val + halfMap) / CELL_SIZE);
  return Math.max(0, Math.min(GRID_DIM - 1, g));
}

/**
 * Create the separation system.
 */
export function createSeparationSystem() {
  return function separationSystem(world: GameWorld, dt: number): void {
    const units = query(world, [Position, Movement, IsUnit]);

    // Only process units that should be nudged (idle, gathering, or just arrived)
    const candidates: number[] = [];
    for (const eid of units) {
      if (hasComponent(world, eid, IsDead)) continue;
      if (hasComponent(world, eid, Stunned) && Stunned.duration[eid] > 0) continue;

      const state = UnitAI.state[eid];
      const hasTarget = Movement.hasTarget[eid] === 1;

      // Only separate units that aren't actively path-following long distances
      if (state === UnitAIState.Idle ||
          state === UnitAIState.Gathering ||
          (!hasTarget && state !== UnitAIState.Dead)) {
        candidates.push(eid);
      }
    }

    if (candidates.length < 2) return;

    // --- Build spatial grid ---
    cellStart.fill(-1);
    cellCount.fill(0);
    packedLen = candidates.length;

    // Count phase: tally how many entities per cell
    for (let i = 0; i < candidates.length; i++) {
      const eid = candidates[i];
      const gx = toGrid(Position.x[eid]);
      const gz = toGrid(Position.z[eid]);
      cellCount[gz * GRID_DIM + gx]++;
    }

    // Prefix sum to compute cell start indices
    let offset = 0;
    for (let c = 0; c < GRID_DIM * GRID_DIM; c++) {
      if (cellCount[c] > 0) {
        cellStart[c] = offset;
        offset += cellCount[c];
        cellCount[c] = 0; // Reset for insertion phase
      }
    }

    // Insert entities into packed array
    for (let i = 0; i < candidates.length; i++) {
      const eid = candidates[i];
      const gx = toGrid(Position.x[eid]);
      const gz = toGrid(Position.z[eid]);
      const cellIdx = gz * GRID_DIM + gx;
      const slot = cellStart[cellIdx] + cellCount[cellIdx];
      packedEids[slot] = eid;
      cellCount[cellIdx]++;
    }

    // --- Apply separation ---
    const halfMap = MAP_SIZE / 2;

    for (let i = 0; i < candidates.length; i++) {
      const eid = candidates[i];
      const px = Position.x[eid];
      const pz = Position.z[eid];
      const gx = toGrid(px);
      const gz = toGrid(pz);

      let pushX = 0;
      let pushZ = 0;

      // Check this cell and 8 neighbors
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = gx + dx;
          const nz = gz + dz;
          if (nx < 0 || nx >= GRID_DIM || nz < 0 || nz >= GRID_DIM) continue;

          const cellIdx = nz * GRID_DIM + nx;
          const start = cellStart[cellIdx];
          if (start < 0) continue;
          const count = cellCount[cellIdx];

          for (let j = 0; j < count; j++) {
            const other = packedEids[start + j];
            if (other === eid) continue;

            const ox = Position.x[other] - px;
            const oz = Position.z[other] - pz;
            const distSq = ox * ox + oz * oz;

            if (distSq < SEPARATION_RADIUS_SQ && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const overlap = SEPARATION_RADIUS - dist;
              const invDist = 1 / dist;
              // Push away from the other unit, scaled by overlap
              pushX -= ox * invDist * overlap;
              pushZ -= oz * invDist * overlap;
            } else if (distSq <= 0.0001) {
              // Exactly overlapping -- push in a random direction
              const angle = Math.random() * Math.PI * 2;
              pushX += Math.cos(angle) * SEPARATION_RADIUS * 0.5;
              pushZ += Math.sin(angle) * SEPARATION_RADIUS * 0.5;
            }
          }
        }
      }

      // Apply the accumulated push
      if (pushX !== 0 || pushZ !== 0) {
        const pushMag = Math.sqrt(pushX * pushX + pushZ * pushZ);
        const maxStep = SEPARATION_STRENGTH * dt;
        const scale = Math.min(maxStep / pushMag, 1);
        const newX = px + pushX * scale;
        const newZ = pz + pushZ * scale;
        // Clamp to map bounds
        Position.x[eid] = Math.max(-halfMap + 0.5, Math.min(halfMap - 0.5, newX));
        Position.z[eid] = Math.max(-halfMap + 0.5, Math.min(halfMap - 0.5, newZ));
      }
    }
  };
}
