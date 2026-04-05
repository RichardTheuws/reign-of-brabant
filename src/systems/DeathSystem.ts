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
  Position,
  Hero,
  PopulationCost,
} from '../ecs/components';
import { IsDead, IsUnit, IsBuilding, IsHero } from '../ecs/tags';
import { eventBus } from '../core/EventBus';
import { playerState } from '../core/PlayerState';
import { DEATH_TIMER, HERO_POPULATION_COST } from '../types/index';
import type { GameWorld } from '../ecs/world';

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
        continue;
      }

      // Tick timer
      DeathTimer.elapsed[eid] += dt;

      if (DeathTimer.elapsed[eid] >= DEATH_TIMER) {
        // Emit death event before removal
        const factionId = Faction.id[eid];
        const unitTypeId = UnitType.id[eid];

        if (hasComponent(world, eid, IsUnit)) {
          // Heroes cost more population; use actual PopulationCost if available
          const popCost = hasComponent(world, eid, PopulationCost)
            ? (PopulationCost.cost[eid] || 1)
            : 1;
          playerState.removePopulation(factionId, popCost);

          eventBus.emit('unit-died', {
            entityId: eid,
            factionId: factionId as any,
            unitTypeId: unitTypeId as any,
            killerEntityId: null,
          });
        }

        if (hasComponent(world, eid, IsBuilding)) {
          eventBus.emit('building-destroyed', {
            entityId: eid,
            factionId: factionId as any,
            buildingTypeId: Building.typeId[eid],
          });
        }

        // Remove entity from ECS world
        removeEntity(world, eid);
      }
    }
  };
}
