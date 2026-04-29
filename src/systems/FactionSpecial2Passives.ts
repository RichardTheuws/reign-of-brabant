/**
 * FactionSpecial2Passives — uniform passive across all 4 facties:
 *
 *   *Gewricht-uitstraling*: per active FactionSpecial2 building (Feestzaal /
 *   Parkeergarage / Mijnwerkerskamp / EU-Parlement) krijgen ALLE friendly
 *   units in die factie +1 sight range. Cap +3 per factie.
 *
 * Caches per-factie counts iedere `UPDATE_INTERVAL` seconden. VisionSystem
 * leest de helper en stamps de extended radius wanneer hij visibility-circles
 * tekent — geen per-unit Visibility.range[eid] mutatie nodig.
 *
 * Flavour-tekst kan per factie verschillen in HUD/info-rows — gameplay-
 * mechaniek is identiek om RTS-balance niet te verstoren.
 */

import { query, hasComponent } from 'bitecs';
import { Building, Faction } from '../ecs/components';
import { IsBuilding, IsDead } from '../ecs/tags';
import { FactionId, BuildingTypeId } from '../types/index';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

const UPDATE_INTERVAL = 1.0;

export const SIGHT_BONUS_PER_BUILDING = 1;
export const SIGHT_BONUS_CAP = 3;

const cachedCounts: Record<number, number> = {
  [FactionId.Brabanders]: 0,
  [FactionId.Randstad]: 0,
  [FactionId.Limburgers]: 0,
  [FactionId.Belgen]: 0,
};

export function getFactionSpecial2Count(factionId: number): number {
  return cachedCounts[factionId] ?? 0;
}

/** Sight bonus added to every visibility-stamp for the given faction. */
export function getFactionSpecial2SightBonus(factionId: number): number {
  const count = cachedCounts[factionId] ?? 0;
  return Math.min(count * SIGHT_BONUS_PER_BUILDING, SIGHT_BONUS_CAP);
}

export function resetFactionSpecial2Passives(): void {
  for (const k of Object.keys(cachedCounts)) {
    cachedCounts[k as unknown as number] = 0;
  }
}

export function createFactionSpecial2PassivesSystem(): SystemFn {
  let accumulator = 0;

  return function factionSpecial2PassivesSystem(world: GameWorld, dt: number): void {
    accumulator += dt;
    if (accumulator < UPDATE_INTERVAL) return;
    accumulator -= UPDATE_INTERVAL;

    cachedCounts[FactionId.Brabanders] = 0;
    cachedCounts[FactionId.Randstad] = 0;
    cachedCounts[FactionId.Limburgers] = 0;
    cachedCounts[FactionId.Belgen] = 0;

    const buildings = query(world, [Building, Faction, IsBuilding]);
    for (const bEid of buildings) {
      if (hasComponent(world, bEid, IsDead)) continue;
      if (Building.typeId[bEid] !== BuildingTypeId.FactionSpecial2) continue;
      if (Building.complete[bEid] !== 1) continue;
      const fid = Faction.id[bEid];
      if (cachedCounts[fid] !== undefined) cachedCounts[fid]++;
    }
  };
}
