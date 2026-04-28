/**
 * VlaaiwinkelSystem.ts -- Limburg FactionSpecial1
 *
 * Periodic heal-pulse: every 5 seconds, every Limburger unit within 10u of a
 * complete Limburger Vlaaiwinkel gains 10 HP. Multiple Vlaaiwinkels stack
 * (overlap is rare in practice and the constant is easy to tune later).
 *
 * Pipeline phase: 'combat' (after CombatSystem) — heal may revert combat damage
 * within the same tick, which is the intended balance for a defensive faction.
 */

import { query, hasComponent } from 'bitecs';
import { Position, Faction, Building, Health } from '../ecs/components';
import { IsUnit, IsDead, IsBuilding } from '../ecs/tags';
import { FactionId, BuildingTypeId } from '../types/index';
import type { GameWorld } from '../ecs/world';

const VLAAIWINKEL_RADIUS_SQ = 100;   // 10u
const VLAAIWINKEL_HEAL_AMOUNT = 10;
const UPDATE_INTERVAL = 5.0;

export function createVlaaiwinkelSystem() {
  let accumulator = 0;

  return function vlaaiwinkelSystem(world: GameWorld, dt: number): void {
    accumulator += dt;
    if (accumulator < UPDATE_INTERVAL) return;
    accumulator -= UPDATE_INTERVAL;

    // Cache complete Limburger Vlaaiwinkel positions
    const tents: Array<{ x: number; z: number }> = [];
    const buildings = query(world, [Position, Building, Faction, IsBuilding]);
    for (const bEid of buildings) {
      if (Faction.id[bEid] !== FactionId.Limburgers) continue;
      if (hasComponent(world, bEid, IsDead)) continue;
      if (Building.typeId[bEid] !== BuildingTypeId.FactionSpecial1) continue;
      if (Building.complete[bEid] !== 1) continue;
      tents.push({ x: Position.x[bEid], z: Position.z[bEid] });
    }
    if (tents.length === 0) return;

    // Heal Limburger units within radius (stacks per overlapping shop)
    const units = query(world, [Position, Faction, IsUnit, Health]);
    for (const eid of units) {
      if (Faction.id[eid] !== FactionId.Limburgers) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      if (Health.current[eid] <= 0) continue;
      if (Health.current[eid] >= Health.max[eid]) continue;

      const px = Position.x[eid];
      const pz = Position.z[eid];
      let pulses = 0;
      for (const t of tents) {
        const dx = t.x - px;
        const dz = t.z - pz;
        if (dx * dx + dz * dz <= VLAAIWINKEL_RADIUS_SQ) pulses++;
      }
      if (pulses > 0) {
        Health.current[eid] = Math.min(
          Health.max[eid],
          Health.current[eid] + VLAAIWINKEL_HEAL_AMOUNT * pulses,
        );
      }
    }
  };
}
