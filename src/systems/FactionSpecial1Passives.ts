/**
 * FactionSpecial1Passives — second-functies voor Boardroom (Randstad),
 * Vlaaiwinkel (Limburg) en Diplomatiek Salon (Belgen). Brabant Carnavalstent
 * heeft zijn eigen `CarnavalsoptochtSystem`. Bedoeld om de v1.0 perfectie
 * "elk specialty-gebouw 2-3 functies"-regel symmetrisch te maken.
 *
 * | Factie    | Building            | Existing functie       | Toegevoegd door dit module                |
 * |-----------|---------------------|------------------------|-------------------------------------------|
 * | Randstad  | Boardroom           | Click Kwartaalcijfers  | **Corporate Synergy** passive (+stack-cap)|
 * | Limburg   | Vlaaiwinkel         | Heal aura passive      | **Vlaai-Trakteerronde** click (heal × 2)  |
 * | Belgen    | Diplomatiek Salon   | Diplomats / Persuasion | **Salon-protocol** passive (cost-discount)|
 *
 * Caches building-counts voor passives per UPDATE_INTERVAL. Click-buff
 * (Vlaai-Trakteerronde) heeft eigen timer.
 */

import { query, hasComponent } from 'bitecs';
import { Building, Faction } from '../ecs/components';
import { IsBuilding, IsDead } from '../ecs/tags';
import { FactionId, BuildingTypeId } from '../types/index';
import { playerState } from '../core/PlayerState';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UPDATE_INTERVAL = 1.0;

/** Randstad Corporate Synergy — per Boardroom: +1 efficiency stack-cap. */
export const CORPORATE_SYNERGY_PER_BOARDROOM = 1;
export const CORPORATE_SYNERGY_CAP = 3;

/** Belgen Salon-protocol — per Salon: -10% diplomatie-cost, cap -30%. */
export const SALON_PROTOCOL_PER = 0.10;
export const SALON_PROTOCOL_CAP = 0.30;

/** Limburg Vlaai-Trakteerronde click — kost Kolen, halveert heal-interval. */
export const VLAAI_TRAKTEER_COST = 100;
export const VLAAI_TRAKTEER_DURATION = 30;
export const VLAAI_TRAKTEER_COOLDOWN = 90;
export const VLAAI_TRAKTEER_INTERVAL_MULT = 0.5; // 5s → 2.5s

// ---------------------------------------------------------------------------
// Cached state
// ---------------------------------------------------------------------------

let cachedBoardroomCount = 0;
let cachedSalonCount = 0;

interface BuffState { active: boolean; remaining: number; cooldown: number; }
export const vlaaiTrakteerBuff: BuffState = { active: false, remaining: 0, cooldown: 0 };

// ---------------------------------------------------------------------------
// Public getters
// ---------------------------------------------------------------------------

export function getBoardroomCount(): number {
  return cachedBoardroomCount;
}

export function getSalonCount(): number {
  return cachedSalonCount;
}

/** Extra efficiency-stack-cap voor Randstad (linear per Boardroom, capped). */
export function getCorporateSynergyExtraCap(factionId: number): number {
  if (factionId !== FactionId.Randstad) return 0;
  return Math.min(cachedBoardroomCount * CORPORATE_SYNERGY_PER_BOARDROOM, CORPORATE_SYNERGY_CAP);
}

/**
 * Discount-multiplier voor Belgen diplomatie-acties.
 * Returns 1.0 voor non-Belgen of zonder Salon. Anders 1.0 - sum(discount) → bv 0.7 bij 3 Salons.
 */
export function getSalonProtocolCostMult(factionId: number): number {
  if (factionId !== FactionId.Belgen) return 1.0;
  const discount = Math.min(cachedSalonCount * SALON_PROTOCOL_PER, SALON_PROTOCOL_CAP);
  return 1 - discount;
}

// ---------------------------------------------------------------------------
// Vlaai-Trakteerronde click-action API
// ---------------------------------------------------------------------------

export function isVlaaiTrakteerReady(): boolean {
  return !vlaaiTrakteerBuff.active && vlaaiTrakteerBuff.cooldown <= 0;
}

export function activateVlaaiTrakteer(): boolean {
  if (!isVlaaiTrakteerReady()) return false;
  if (!playerState.spendTertiary(FactionId.Limburgers, VLAAI_TRAKTEER_COST)) return false;
  vlaaiTrakteerBuff.active = true;
  vlaaiTrakteerBuff.remaining = VLAAI_TRAKTEER_DURATION;
  vlaaiTrakteerBuff.cooldown = VLAAI_TRAKTEER_COOLDOWN;
  return true;
}

export function getVlaaiTrakteerState(): BuffState {
  return { active: vlaaiTrakteerBuff.active, remaining: vlaaiTrakteerBuff.remaining, cooldown: vlaaiTrakteerBuff.cooldown };
}

/**
 * Interval-multiplier for VlaaiwinkelSystem: 1.0 normaal, 0.5 tijdens buff.
 * Lower = faster heal cycles.
 */
export function getVlaaiwinkelIntervalMult(): number {
  return vlaaiTrakteerBuff.active ? VLAAI_TRAKTEER_INTERVAL_MULT : 1.0;
}

export function resetFactionSpecial1Passives(): void {
  cachedBoardroomCount = 0;
  cachedSalonCount = 0;
  vlaaiTrakteerBuff.active = false;
  vlaaiTrakteerBuff.remaining = 0;
  vlaaiTrakteerBuff.cooldown = 0;
}

// Wire Corporate Synergy into PlayerState.addEfficiencyStack via setter
// pattern (avoids circular import). Runs once on module load.
playerState.extraStackCapProvider = getCorporateSynergyExtraCap;

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

export function createFactionSpecial1PassivesSystem(): SystemFn {
  let accumulator = 0;

  return function factionSpecial1PassivesSystem(world: GameWorld, dt: number): void {
    // Vlaai-Trakteer buff timer — every-frame for snappy expiration.
    if (vlaaiTrakteerBuff.active) {
      vlaaiTrakteerBuff.remaining -= dt;
      if (vlaaiTrakteerBuff.remaining <= 0) {
        vlaaiTrakteerBuff.active = false;
        vlaaiTrakteerBuff.remaining = 0;
      }
    }
    if (vlaaiTrakteerBuff.cooldown > 0) {
      vlaaiTrakteerBuff.cooldown -= dt;
      if (vlaaiTrakteerBuff.cooldown < 0) vlaaiTrakteerBuff.cooldown = 0;
    }

    // Throttle building-count refresh.
    accumulator += dt;
    if (accumulator < UPDATE_INTERVAL) return;
    accumulator -= UPDATE_INTERVAL;

    cachedBoardroomCount = 0;
    cachedSalonCount = 0;

    const buildings = query(world, [Building, Faction, IsBuilding]);
    for (const bEid of buildings) {
      if (hasComponent(world, bEid, IsDead)) continue;
      if (Building.typeId[bEid] !== BuildingTypeId.FactionSpecial1) continue;
      if (Building.complete[bEid] !== 1) continue;
      const fid = Faction.id[bEid];
      if (fid === FactionId.Randstad) cachedBoardroomCount++;
      else if (fid === FactionId.Belgen) cachedSalonCount++;
    }
  };
}
