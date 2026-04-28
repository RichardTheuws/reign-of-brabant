/**
 * Reign of Brabant -- Tower System
 *
 * Handles automatic ranged attacks for completed Defense Towers
 * (BuildingTypeId.DefenseTower = 9). Each tower scans for the closest
 * enemy unit in range and deals instant damage on a cooldown.
 *
 * | Stat         | Value        |
 * |--------------|--------------|
 * | Attack range | 14 units     |
 * | Damage       | 15 per hit   |
 * | Attack speed | 1.5 seconds  |
 * | Targeting    | Closest enemy|
 */

import { query, hasComponent } from 'bitecs';
import { Position, Building, Faction, Health } from '../ecs/components';
import { IsBuilding, IsUnit, IsDead } from '../ecs/tags';
import { BuildingTypeId } from '../types/index';
import { eventBus } from '../core/EventBus';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Attack range in world units. */
export const TOWER_RANGE = 14;

/** Squared attack range (avoids sqrt in distance checks). */
const TOWER_RANGE_SQ = TOWER_RANGE * TOWER_RANGE;

/** Damage dealt per attack. */
export const TOWER_DAMAGE = 15;

/** Seconds between attacks. */
export const TOWER_ATTACK_SPEED = 1.5;

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the Tower System.
 * Returns a SystemFn that processes Defense Tower attacks every frame,
 * using per-tower cooldowns to fire at the closest enemy in range.
 */
export function createTowerSystem(): SystemFn {
  /** Per-tower attack cooldown (seconds remaining). */
  const cooldowns = new Map<number, number>();

  return function towerSystem(world: GameWorld, dt: number): void {
    // Query all buildings and all units once per frame
    const allBuildings = query(world, [Building, Faction, Position, IsBuilding]);
    const allUnits = query(world, [Health, Faction, Position, IsUnit]);

    // Track which tower eids are still alive for cleanup
    const activeTowers = new Set<number>();

    for (const towerEid of allBuildings) {
      // Skip dead buildings
      if (hasComponent(world, towerEid, IsDead)) continue;

      // Only Defense Towers
      if (Building.typeId[towerEid] !== BuildingTypeId.DefenseTower) continue;

      // Must be fully constructed
      if (Building.complete[towerEid] !== 1) continue;

      activeTowers.add(towerEid);

      // Decrease cooldown
      const remaining = (cooldowns.get(towerEid) ?? 0) - dt;
      if (remaining > 0) {
        cooldowns.set(towerEid, remaining);
        continue;
      }

      // Ready to fire -- find closest enemy in range
      const towerX = Position.x[towerEid];
      const towerZ = Position.z[towerEid];
      const towerFaction = Faction.id[towerEid];

      let closestEid = -1;
      let closestDistSq = TOWER_RANGE_SQ;

      for (const unitEid of allUnits) {
        // Skip dead units
        if (hasComponent(world, unitEid, IsDead)) continue;

        // Skip friendly units
        if (Faction.id[unitEid] === towerFaction) continue;

        // Distance check (squared, no sqrt needed)
        const dx = Position.x[unitEid] - towerX;
        const dz = Position.z[unitEid] - towerZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestEid = unitEid;
        }
      }

      // No enemy found in range -- don't reset cooldown, try next frame
      if (closestEid === -1) {
        cooldowns.set(towerEid, 0);
        continue;
      }

      // Deal damage
      Health.current[closestEid] -= TOWER_DAMAGE;

      // Reset cooldown
      cooldowns.set(towerEid, TOWER_ATTACK_SPEED);

      // Emit event for audio/particles
      eventBus.emit('tower-attack' as never, {
        towerEid,
        targetEid: closestEid,
        damage: TOWER_DAMAGE,
      } as never);
    }

    // Clean up cooldown entries for towers that no longer exist
    for (const eid of cooldowns.keys()) {
      if (!activeTowers.has(eid)) {
        cooldowns.delete(eid);
      }
    }
  };
}
