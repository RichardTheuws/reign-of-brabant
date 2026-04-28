/**
 * UpgradeBuildingPassivesSystem — passive auras voor de 4 UpgradeBuildings.
 *
 * Per v1.0 perfectie regel (`feedback_v1_perfection_multi_function`): elk
 * specialty-gebouw heeft 2-3 functies. UpgradeBuildings hadden alleen
 * "research panel + T3 gate" (1 functie); deze module voegt een unieke
 * passieve aura per factie toe.
 *
 * | Factie    | Naam                  | Effect                                          |
 * |-----------|-----------------------|-------------------------------------------------|
 * | Brabant   | Wagenbouwerij         | +0.3 Gezelligheid/sec per actieve Wagenbouwer.  |
 * | Randstad  | Innovatie Boost       | Per actief Innovatie Lab: alle Randstad units   |
 * |           |                       | +5% movement speed (gestapeld, cap +20%).       |
 * | Limburg   | Kolenrook             | Limburg units binnen 10u van een Hoogoven       |
 * |           |                       | krijgen +1 armor (gestapeld, cap +3).           |
 * | Belgen    | Geslepen Wapens       | Belgen units binnen 8u van een Diamantslijperij |
 * |           |                       | krijgen +5% crit chance (gestapeld, cap +15%).  |
 *
 * Performance: scanning UpgradeBuildings gebeurt 1×/sec en het resultaat
 * wordt gecachet. Combat- en MovementSystem lezen via cheap getters.
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

const UPDATE_INTERVAL = 1.0;

/** Brabant Wagenbouwerij — +0.3 Gez/sec per Wagenbouwer. */
export const WAGENBOUWERIJ_GEZ_PER_SEC = 0.3;

/** Randstad Innovatie Boost — speed mult per Lab + cap. */
export const INNOVATIE_PER_LAB = 0.05;
export const INNOVATIE_CAP = 0.20;

/** Limburg Kolenrook — armor per Hoogoven in radius + cap, radius. */
export const KOLENROOK_RADIUS = 10;
const KOLENROOK_RADIUS_SQ = KOLENROOK_RADIUS * KOLENROOK_RADIUS;
export const KOLENROOK_ARMOR_PER = 1;
export const KOLENROOK_CAP = 3;

/** Belgen Geslepen Wapens — crit per Diamantslijperij in radius + cap, radius. */
export const GESLEPEN_RADIUS = 8;
const GESLEPEN_RADIUS_SQ = GESLEPEN_RADIUS * GESLEPEN_RADIUS;
export const GESLEPEN_CRIT_PER = 0.05;
export const GESLEPEN_CAP = 0.15;

// ---------------------------------------------------------------------------
// Cached state (refreshed every UPDATE_INTERVAL)
// ---------------------------------------------------------------------------

let cachedWagenbouwerCount = 0;
let cachedInnovatieLabCount = 0;
let cachedHoogovens: Array<{ x: number; z: number }> = [];
let cachedDiamantslijperijen: Array<{ x: number; z: number }> = [];

// ---------------------------------------------------------------------------
// Public getters (read-only — used by Movement/Combat/Worsten systems)
// ---------------------------------------------------------------------------

/** Number of currently complete Brabant UpgradeBuildings (Wagenbouwers). */
export function getWagenbouwerCount(): number {
  return cachedWagenbouwerCount;
}

/**
 * Randstad Innovatie Boost movement multiplier. Returns 1.0 voor non-Randstad.
 * Stapelt linear per actief Lab tot CAP.
 */
export function getInnovatieBoostSpeedMult(factionId: number): number {
  if (factionId !== FactionId.Randstad) return 1.0;
  const bonus = Math.min(cachedInnovatieLabCount * INNOVATIE_PER_LAB, INNOVATIE_CAP);
  return 1 + bonus;
}

/**
 * Limburg Kolenrook armor bonus voor een unit op (x, z). Returns 0 voor
 * non-Limburgers of buiten alle radius. Capped op KOLENROOK_CAP.
 */
export function getKolenrookArmorAt(factionId: number, x: number, z: number): number {
  if (factionId !== FactionId.Limburgers) return 0;
  let count = 0;
  for (const h of cachedHoogovens) {
    const dx = h.x - x;
    const dz = h.z - z;
    if (dx * dx + dz * dz <= KOLENROOK_RADIUS_SQ) count++;
  }
  return Math.min(count * KOLENROOK_ARMOR_PER, KOLENROOK_CAP);
}

/**
 * Belgen Geslepen Wapens crit chance bonus voor een unit op (x, z).
 * Returns 0 voor non-Belgen of buiten alle radius. Capped op GESLEPEN_CAP.
 */
export function getGeslepenCritAt(factionId: number, x: number, z: number): number {
  if (factionId !== FactionId.Belgen) return 0;
  let count = 0;
  for (const d of cachedDiamantslijperijen) {
    const dx = d.x - x;
    const dz = d.z - z;
    if (dx * dx + dz * dz <= GESLEPEN_RADIUS_SQ) count++;
  }
  return Math.min(count * GESLEPEN_CRIT_PER, GESLEPEN_CAP);
}

/** Reset all cached state (used by playerState.reset / new match). */
export function resetUpgradeBuildingPassives(): void {
  cachedWagenbouwerCount = 0;
  cachedInnovatieLabCount = 0;
  cachedHoogovens = [];
  cachedDiamantslijperijen = [];
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

export function createUpgradeBuildingPassivesSystem(): SystemFn {
  let accumulator = 0;

  return function upgradeBuildingPassivesSystem(world: GameWorld, dt: number): void {
    accumulator += dt;
    if (accumulator < UPDATE_INTERVAL) return;
    accumulator -= UPDATE_INTERVAL;

    // Re-scan all complete UpgradeBuildings
    cachedWagenbouwerCount = 0;
    cachedInnovatieLabCount = 0;
    cachedHoogovens = [];
    cachedDiamantslijperijen = [];

    const buildings = query(world, [Building, Faction, Position, IsBuilding]);
    for (const bEid of buildings) {
      if (hasComponent(world, bEid, IsDead)) continue;
      if (Building.typeId[bEid] !== BuildingTypeId.UpgradeBuilding) continue;
      if (Building.complete[bEid] !== 1) continue;

      const fid = Faction.id[bEid];
      const x = Position.x[bEid];
      const z = Position.z[bEid];

      switch (fid) {
        case FactionId.Brabanders:
          cachedWagenbouwerCount++;
          break;
        case FactionId.Randstad:
          cachedInnovatieLabCount++;
          break;
        case FactionId.Limburgers:
          cachedHoogovens.push({ x, z });
          break;
        case FactionId.Belgen:
          cachedDiamantslijperijen.push({ x, z });
          break;
      }
    }

    // Brabant Wagenbouwerij — direct flux Gezelligheid based on count.
    if (cachedWagenbouwerCount > 0) {
      playerState.addGezelligheid(
        FactionId.Brabanders,
        cachedWagenbouwerCount * WAGENBOUWERIJ_GEZ_PER_SEC * UPDATE_INTERVAL,
      );
    }
  };
}
