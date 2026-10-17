/**
 * BuildingFootprints -- keeps building footprints in the active NavGrid.
 *
 * Every building blocks a square of grid cells so A* routes around it. The
 * footprint is a little smaller than the 4x4 placement box (BuildSystem's
 * BUILDING_FOOTPRINT) so the ring of walkable cells sits right against the
 * model; units that must touch the building (build, deposit, melee) path to
 * that ring and take UnitPathing's free final leg the last stretch in.
 *
 * Registration points:
 *  - spawnBuildingEntity() / factories.createBuilding(): every spawn path
 *    (map TownHalls, mission buildings, player construction sites, AI builds).
 *  - DeathSystem: released on the first IsDead frame (rubble does not block)
 *    and again, defensively, right before removeEntity.
 *  - syncBuildingFootprints(): a reconcile sweep, run by MovementSystem each
 *    frame and by Game.installNavGrid(). It registers live buildings that are
 *    missing (spawned before the grid existed, or via a path that skipped the
 *    hook) and releases entries whose eid died, vanished, stopped being a
 *    building, or was recycled into a building at another spot.
 *
 * The registry stores the exact cells each eid blocked, so release frees
 * exactly those cells even after bitECS recycled the eid and its component
 * data was overwritten. The registry belongs to one grid: when a different
 * grid becomes active (setActiveNavGrid at match start) it is dropped.
 */

import { query, hasComponent, entityExists } from 'bitecs';
import { Position, Building } from '../ecs/components';
import { IsBuilding, IsDead } from '../ecs/tags';
import { BuildingTypeId } from '../types/index';
import type { GameWorld } from '../ecs/world';
import type { NavGrid, FootprintCells } from './NavGrid';
import { getActiveNavGrid } from './UnitPathing';

/**
 * Half extent of a building's blocked square, in world units. The placement
 * box is 4x4 (half 2); 1.5 blocks the 3-4 cells whose centres fall inside it,
 * leaving the outer edge walkable.
 */
export const BUILDING_FOOTPRINT_HALF = 1.5;

interface Entry {
  x: number;
  z: number;
  cells: FootprintCells;
}

const registry = new Map<number, Entry>();
let registryGrid: NavGrid | null = null;

/** Active grid, dropping the registry when it belongs to a previous grid. */
function activeGrid(): NavGrid | null {
  const grid = getActiveNavGrid();
  if (grid !== registryGrid) {
    registry.clear();
    registryGrid = grid;
  }
  return grid;
}

/** Bridges span rivers and must stay walkable; everything else blocks. */
function blocksPath(typeId: number): boolean {
  return typeId !== BuildingTypeId.Bridge;
}

/**
 * Block the footprint of building `eid` at (x,z). Re-registering an eid at a
 * new position releases the old cells first. No-op without an active grid.
 */
export function registerBuildingFootprint(eid: number, x: number, z: number, typeId: number): void {
  const grid = activeGrid();
  if (!grid) return;
  // Position is Float32: store what the component holds so the sweep's
  // position check does not see a 10.3 vs 10.300000190734863 "move".
  x = Math.fround(x);
  z = Math.fround(z);
  const prev = registry.get(eid);
  if (prev) {
    if (prev.x === x && prev.z === z) return;
    grid.removeFootprint(prev.cells);
    registry.delete(eid);
  }
  if (!blocksPath(typeId)) return;
  const cells = grid.addFootprint(x, z, BUILDING_FOOTPRINT_HALF, BUILDING_FOOTPRINT_HALF);
  if (cells) registry.set(eid, { x, z, cells });
}

/** Free exactly the cells `eid` blocked. Safe to call twice / for unknown eids. */
export function unregisterBuildingFootprint(eid: number): void {
  const grid = activeGrid();
  const entry = registry.get(eid);
  if (!entry) return;
  registry.delete(eid);
  if (grid) grid.removeFootprint(entry.cells);
}

/** Drop all footprints (Game.cleanup and before installing a fresh grid). */
export function resetBuildingFootprints(): void {
  if (registryGrid && registryGrid === getActiveNavGrid()) registryGrid.clearFootprints();
  registry.clear();
  registryGrid = getActiveNavGrid();
}

/** Reconcile the registry with the live world (see module doc). */
export function syncBuildingFootprints(world: GameWorld): void {
  const grid = activeGrid();
  if (!grid) return;

  for (const [eid, entry] of registry) {
    if (
      !entityExists(world, eid)
      || !hasComponent(world, eid, IsBuilding)
      || hasComponent(world, eid, IsDead)
      || Position.x[eid] !== entry.x
      || Position.z[eid] !== entry.z
    ) {
      registry.delete(eid);
      grid.removeFootprint(entry.cells);
    }
  }

  for (const eid of query(world, [Position, Building, IsBuilding])) {
    if (registry.has(eid) || hasComponent(world, eid, IsDead)) continue;
    registerBuildingFootprint(eid, Position.x[eid], Position.z[eid], Building.typeId[eid]);
  }
}

/** Test/debug helper. */
export function getBuildingFootprint(eid: number): Readonly<{ x: number; z: number; cells: FootprintCells }> | undefined {
  activeGrid();
  return registry.get(eid);
}

/** Test/debug helper. */
export function buildingFootprintCount(): number {
  activeGrid();
  return registry.size;
}
