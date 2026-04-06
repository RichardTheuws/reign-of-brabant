/**
 * Reign of Brabant -- Tertiary Resource System
 *
 * Generates faction-specific tertiary resources from completed buildings
 * of type TertiaryResourceBuilding (BuildingTypeId = 5).
 *
 * | Faction     | Resource       | Rate per building |
 * |-------------|----------------|-------------------|
 * | Randstad    | Havermoutmelk  | 2.0 / sec         |
 * | Limburgers  | Kolen          | 1.5 / sec         |
 * | Belgen      | Chocolade      | 1.5 / sec         |
 *
 * Brabanders are SKIPPED -- their tertiary resource (Gezelligheid) is
 * handled by GezeligheidSystem via proximity-based generation.
 *
 * Update interval: 1.0 second (not every frame).
 */

import { query, hasComponent } from 'bitecs';
import { Building, Faction, Position } from '../ecs/components';
import { IsBuilding, IsDead } from '../ecs/tags';
import { FactionId, BuildingTypeId } from '../types/index';
import { playerState } from '../core/PlayerState';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How often the system recalculates (in seconds). */
const UPDATE_INTERVAL = 1.0;

/**
 * Tertiary resource generation rate per completed building, per second.
 * Keyed by FactionId. Brabanders omitted (handled by GezeligheidSystem).
 */
const TERTIARY_RATES: Partial<Record<FactionId, number>> = {
  [FactionId.Randstad]: 2.0,
  [FactionId.Limburgers]: 1.5,
  [FactionId.Belgen]: 1.5,
};

/** Faction IDs that use building-based tertiary generation. */
const BUILDING_FACTIONS: readonly FactionId[] = [
  FactionId.Randstad,
  FactionId.Limburgers,
  FactionId.Belgen,
];

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the Tertiary Resource system.
 * Returns a SystemFn that scans tertiary resource buildings every 1.0s
 * and adds generated resources to PlayerState.
 */
export function createTertiaryResourceSystem(): SystemFn {
  let accumulator = 0;

  return function tertiaryResourceSystem(world: GameWorld, dt: number): void {
    accumulator += dt;
    if (accumulator < UPDATE_INTERVAL) return;
    accumulator -= UPDATE_INTERVAL;

    // Query all buildings in the world
    const allBuildings = query(world, [Building, Faction, Position, IsBuilding]);

    // Count completed tertiary resource buildings per faction
    const buildingCounts: Partial<Record<FactionId, number>> = {};

    for (const eid of allBuildings) {
      // Skip dead buildings
      if (hasComponent(world, eid, IsDead)) continue;

      // Only tertiary resource buildings
      if (Building.typeId[eid] !== BuildingTypeId.TertiaryResourceBuilding) continue;

      // Must be fully constructed
      if (Building.complete[eid] !== 1) continue;

      const factionId = Faction.id[eid] as FactionId;

      // Skip Brabanders -- GezeligheidSystem handles their tertiary resource
      if (factionId === FactionId.Brabanders) continue;

      buildingCounts[factionId] = (buildingCounts[factionId] ?? 0) + 1;
    }

    // Generate tertiary resources for each faction with buildings
    for (const factionId of BUILDING_FACTIONS) {
      const count = buildingCounts[factionId];
      if (!count) continue;

      const rate = TERTIARY_RATES[factionId];
      if (!rate) continue;

      const amount = count * rate * UPDATE_INTERVAL;
      playerState.addTertiary(factionId, amount);
    }
  };
}
