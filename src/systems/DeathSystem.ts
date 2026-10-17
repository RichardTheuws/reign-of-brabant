/**
 * Reign of Brabant -- Death System
 *
 * Processes entities tagged with IsDead:
 *   1. On first frame of death: initialize death timer.
 *   2. Tick timer for 2 seconds (death animation window).
 *   3. After timer expires: remove entity from world, emit event.
 *
 * Mesh cleanup is handled by the render layer listening to the event.
 */

import { query, removeEntity, hasComponent, addComponent } from 'bitecs';
import {
  DeathTimer,
  Health,
  Faction,
  UnitType,
  Building,
  PopulationCost,
} from '../ecs/components';
import { IsDead, IsUnit, IsBuilding } from '../ecs/tags';
import { eventBus } from '../core/EventBus';
import { playerState } from '../core/PlayerState';
import { FactionId, UnitTypeId, BuildingTypeId, DEATH_TIMER } from '../types/index';
import type { GameWorld } from '../ecs/world';
import { unregisterBuildingFootprint } from '../pathfinding/BuildingFootprints';

/**
 * Create the death system.
 */
export function createDeathSystem() {
  return function deathSystem(world: GameWorld, dt: number): void {
    const deadEntities = query(world, [IsDead]);

    for (const eid of deadEntities) {
      // Initialize death timer on first encounter
      if (!hasComponent(world, eid, DeathTimer)) {
        addComponent(world, eid, DeathTimer);
        DeathTimer.elapsed[eid] = 0;

        // Ensure health is clamped to 0
        if (hasComponent(world, eid, Health)) {
          Health.current[eid] = 0;
        }
        // A destroyed (or cancelled) building stops blocking paths at once;
        // the rubble is not an obstacle during the death animation.
        if (hasComponent(world, eid, IsBuilding)) unregisterBuildingFootprint(eid);
        continue;
      }

      // Tick timer
      DeathTimer.elapsed[eid] += dt;

      if (DeathTimer.elapsed[eid] >= DEATH_TIMER) {
        // Emit death event before removal
        const factionId = Faction.id[eid];
        const unitTypeId = UnitType.id[eid];

        if (hasComponent(world, eid, IsUnit)) {
          // Subtract exactly what was added at spawn: PopulationCost (heroes 5,
          // heavy/siege 2-4, summons 0 -- 0 stays 0). Legacy entities without
          // the component count as 1.
          const popCost = hasComponent(world, eid, PopulationCost)
            ? PopulationCost.cost[eid]
            : 1;
          if (popCost > 0) playerState.removePopulation(factionId, popCost);

          // Track military unit loss for upkeep system
          if (unitTypeId !== UnitTypeId.Worker) {
            playerState.removeMilitaryUnit(factionId);
          }

          eventBus.emit('unit-died', {
            entityId: eid,
            factionId: factionId as FactionId,
            unitTypeId: unitTypeId as UnitTypeId,
            killerEntityId: null,
          });
        }

        if (hasComponent(world, eid, IsBuilding)) {
          eventBus.emit('building-destroyed', {
            entityId: eid,
            factionId: factionId as FactionId,
            buildingTypeId: Building.typeId[eid] as BuildingTypeId,
          });
        }

        // Release before the eid can be recycled (no-op if already released).
        unregisterBuildingFootprint(eid);

        // Remove entity from ECS world
        removeEntity(world, eid);
      }
    }
  };
}
