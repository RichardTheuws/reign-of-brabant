/**
 * Reign of Brabant -- Population System
 *
 * Reduces population capacity when buildings are destroyed.
 *
 * When a building dies (tagged with IsDead), this system detects it and
 * subtracts the building's `populationProvided` value from the owning
 * faction's max population. Each dead building entity is tracked in a
 * processed set so the reduction is applied exactly once.
 *
 * Population *increase* on construction is handled by Game.ts
 * (createBuildingEntity) -- this system only handles the decrease.
 */

import { query, hasComponent } from 'bitecs';
import { Building, Faction } from '../ecs/components';
import { IsBuilding, IsDead } from '../ecs/tags';
import { BuildingTypeId } from '../types/index';
import { BUILDING_ARCHETYPES } from '../entities/archetypes';
import { playerState } from '../core/PlayerState';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the Population system.
 * Returns a SystemFn that watches for dying buildings and reduces
 * the owning faction's population capacity accordingly.
 */
export function createPopulationSystem(): SystemFn {
  /** Set of entity IDs whose population reduction has already been applied. */
  const processed = new Set<number>();

  return function populationSystem(world: GameWorld, _dt: number): void {
    const allBuildings = query(world, [Building, Faction, IsBuilding]);

    for (const eid of allBuildings) {
      // Only interested in dead buildings we haven't processed yet
      if (!hasComponent(world, eid, IsDead)) continue;
      if (processed.has(eid)) continue;

      // Mark as processed so we don't double-count
      processed.add(eid);

      // Only completed buildings contributed population capacity
      if (Building.complete[eid] !== 1) continue;

      const typeId = Building.typeId[eid] as BuildingTypeId;
      const factionId = Faction.id[eid];

      // Look up how much population this building type provided
      const archetype = typeId < BUILDING_ARCHETYPES.length
        ? BUILDING_ARCHETYPES[typeId]
        : undefined;
      const popProvided = archetype?.populationProvided ?? 5;

      playerState.removePopulationCapacity(factionId, popProvided);
    }

    // Periodically clean up processed set: remove entries for entities
    // that are no longer in the building query (already removed by DeathSystem)
    if (processed.size > 100) {
      const activeSet = new Set(allBuildings);
      for (const eid of processed) {
        if (!activeSet.has(eid)) {
          processed.delete(eid);
        }
      }
    }
  };
}
