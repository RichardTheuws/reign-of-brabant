/**
 * Reign of Brabant -- Gezelligheid System
 *
 * Core Brabander faction mechanic: units become stronger when near allies.
 * Scans all Brabander units every 500ms (not every frame) and calculates
 * group bonuses based on how many allies are within radius 15.
 *
 * Bonus tiers:
 *   1 unit:    +0%
 *   2-5 units: +10% attack, speed, armor
 *   6-10:      +20%
 *   11-20:     +30% + passive heal (1 HP/sec)
 *   20+:       +50% + damage reduction (20%)
 *
 * Also generates Gezelligheid resource points when units cluster together.
 */

import { query, hasComponent } from 'bitecs';
import {
  Position,
  Faction,
  Health,
  GezeligheidBonus,
  Building,
} from '../ecs/components';
import { IsUnit, IsDead, IsBuilding } from '../ecs/tags';
import { FactionId, BuildingTypeId, UpgradeId } from '../types/index';
import { playerState } from '../core/PlayerState';
import type { GameWorld } from '../ecs/world';
import { techTreeSystem } from './TechTreeSystem';

/** Carnavalsvuur aura: +10% damage in this radius around a Brabant TownHall (squared). */
const CARNAVALSVUUR_RADIUS_SQ = 64; // 8u
const CARNAVALSVUUR_DAMAGE_MULT = 1.10;

/** Carnavalstent aura: +20% damage in this radius around a Brabant FactionSpecial1 (Carnavalstent). */
const CARNAVALSTENT_RADIUS_SQ = 144; // 12u
const CARNAVALSTENT_ATTACK_MULT = 1.20;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Radius within which allies count for Gezelligheid bonus. */
const GEZELLIGHEID_RADIUS = 15;
const GEZELLIGHEID_RADIUS_SQ = GEZELLIGHEID_RADIUS * GEZELLIGHEID_RADIUS;

/** How often the system recalculates (in seconds). */
const UPDATE_INTERVAL = 0.5;

/** Gezelligheid resource generation rate per grouped unit per second. */
const GEZELLIGHEID_GEN_RATE = 0.5;

/** Passive heal rate for large groups (HP per second). */
const PASSIVE_HEAL_RATE = 1.0;

// ---------------------------------------------------------------------------
// Bonus tier definitions
// ---------------------------------------------------------------------------

interface BonusTier {
  minCount: number;
  attackMult: number;   // multiplier: 1.1 = +10%
  speedMult: number;
  armorMult: number;
  passiveHeal: boolean;
  damageReduction: number; // 0.0 = none, 0.2 = 20% reduction
}

const BONUS_TIERS: BonusTier[] = [
  { minCount: 20, attackMult: 1.40, speedMult: 1.40, armorMult: 1.40, passiveHeal: true, damageReduction: 0.15 },
  { minCount: 11, attackMult: 1.30, speedMult: 1.30, armorMult: 1.30, passiveHeal: true, damageReduction: 0.0 },
  { minCount: 6,  attackMult: 1.20, speedMult: 1.20, armorMult: 1.20, passiveHeal: false, damageReduction: 0.0 },
  { minCount: 2,  attackMult: 1.10, speedMult: 1.10, armorMult: 1.10, passiveHeal: false, damageReduction: 0.0 },
];

const NO_BONUS: BonusTier = {
  minCount: 0,
  attackMult: 1.0,
  speedMult: 1.0,
  armorMult: 1.0,
  passiveHeal: false,
  damageReduction: 0.0,
};

// ---------------------------------------------------------------------------
// Scratch values
// ---------------------------------------------------------------------------
let _dx = 0;
let _dz = 0;
let _distSq = 0;

/**
 * Determine the bonus tier for a given ally count (including self).
 */
function getTier(allyCount: number): BonusTier {
  for (const tier of BONUS_TIERS) {
    if (allyCount >= tier.minCount) {
      return tier;
    }
  }
  return NO_BONUS;
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the Gezelligheid system.
 * Returns a system function called each frame; internally throttles to 500ms.
 */
export function createGezeligheidSystem() {
  let accumulator = 0;

  return function gezeligheidSystem(world: GameWorld, dt: number): void {
    accumulator += dt;

    // Always apply passive heal at frame rate for smoothness
    applyPassiveHeal(world, dt);

    // Only recalculate bonuses every UPDATE_INTERVAL
    if (accumulator < UPDATE_INTERVAL) return;
    accumulator -= UPDATE_INTERVAL;

    const allUnits = query(world, [Position, Faction, IsUnit]);

    // Collect Brabander unit EIDs
    const brabanderUnits: number[] = [];
    for (const eid of allUnits) {
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      if (Health.current[eid] <= 0) continue;
      brabanderUnits.push(eid);
    }

    // For each Brabander unit, count nearby allies and set bonus
    let totalGroupedUnits = 0;

    for (const eid of brabanderUnits) {
      const px = Position.x[eid];
      const pz = Position.z[eid];
      let nearbyCount = 1; // count self

      for (const other of brabanderUnits) {
        if (other === eid) continue;

        _dx = Position.x[other] - px;
        _dz = Position.z[other] - pz;
        _distSq = _dx * _dx + _dz * _dz;

        if (_distSq <= GEZELLIGHEID_RADIUS_SQ) {
          nearbyCount++;
        }
      }

      // Determine tier and write to GezeligheidBonus component
      const tier = getTier(nearbyCount);

      GezeligheidBonus.nearbyCount[eid] = nearbyCount;
      GezeligheidBonus.attackMult[eid] = tier.attackMult;
      GezeligheidBonus.speedMult[eid] = tier.speedMult;
      GezeligheidBonus.armorMult[eid] = tier.armorMult;
      GezeligheidBonus.passiveHeal[eid] = tier.passiveHeal ? 1 : 0;
      GezeligheidBonus.damageReduction[eid] = tier.damageReduction;

      // Count grouped units for resource generation
      if (nearbyCount >= 2) {
        totalGroupedUnits++;
      }
    }

    // Generate Gezelligheid resource based on grouped units
    if (totalGroupedUnits > 0) {
      const generated = totalGroupedUnits * GEZELLIGHEID_GEN_RATE * UPDATE_INTERVAL;
      playerState.addGezelligheid(FactionId.Brabanders, generated);
    }

    // Carnavalsvuur aura: +10% attackMult on top of group-Gezelligheid for any
    // Brabant unit within 8u of a complete Brabant TownHall. Multiplicative
    // stack on the tier-bonus already written above.
    if (techTreeSystem.isResearched(FactionId.Brabanders, UpgradeId.Carnavalsvuur)) {
      const townHalls: Array<{ x: number; z: number }> = [];
      const buildings = query(world, [Position, Building, Faction, IsBuilding]);
      for (const bEid of buildings) {
        if (Faction.id[bEid] !== FactionId.Brabanders) continue;
        if (hasComponent(world, bEid, IsDead)) continue;
        if (Building.typeId[bEid] !== BuildingTypeId.TownHall) continue;
        if (Building.complete[bEid] !== 1) continue;
        townHalls.push({ x: Position.x[bEid], z: Position.z[bEid] });
      }
      for (const eid of brabanderUnits) {
        const px = Position.x[eid];
        const pz = Position.z[eid];
        for (const th of townHalls) {
          const dx = th.x - px;
          const dz = th.z - pz;
          if (dx * dx + dz * dz <= CARNAVALSVUUR_RADIUS_SQ) {
            GezeligheidBonus.attackMult[eid] *= CARNAVALSVUUR_DAMAGE_MULT;
            break;
          }
        }
      }
    }

    // Carnavalstent aura: +20% attackMult for Brabander units within 12u of a
    // complete Brabant Carnavalstent (FactionSpecial1). Multiplicative-stack on
    // the tier-bonus AND on Carnavalsvuur (1.10 × 1.20 = 1.32).
    const tents: Array<{ x: number; z: number }> = [];
    const allBuildings = query(world, [Position, Building, Faction, IsBuilding]);
    for (const bEid of allBuildings) {
      if (Faction.id[bEid] !== FactionId.Brabanders) continue;
      if (hasComponent(world, bEid, IsDead)) continue;
      if (Building.typeId[bEid] !== BuildingTypeId.FactionSpecial1) continue;
      if (Building.complete[bEid] !== 1) continue;
      tents.push({ x: Position.x[bEid], z: Position.z[bEid] });
    }
    if (tents.length > 0) {
      for (const eid of brabanderUnits) {
        const px = Position.x[eid];
        const pz = Position.z[eid];
        for (const t of tents) {
          const dx = t.x - px;
          const dz = t.z - pz;
          if (dx * dx + dz * dz <= CARNAVALSTENT_RADIUS_SQ) {
            GezeligheidBonus.attackMult[eid] *= CARNAVALSTENT_ATTACK_MULT;
            break;
          }
        }
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Passive heal (applied every frame for smooth healing)
// ---------------------------------------------------------------------------

function applyPassiveHeal(world: GameWorld, dt: number): void {
  const allUnits = query(world, [Position, Faction, IsUnit]);

  for (const eid of allUnits) {
    if (Faction.id[eid] !== FactionId.Brabanders) continue;
    if (hasComponent(world, eid, IsDead)) continue;
    if (GezeligheidBonus.passiveHeal[eid] !== 1) continue;

    const current = Health.current[eid];
    const max = Health.max[eid];
    if (current < max) {
      Health.current[eid] = Math.min(max, current + PASSIVE_HEAL_RATE * dt);
    }
  }
}
