/**
 * Reign of Brabant -- Combat System
 *
 * Handles attack execution for entities in ATTACKING state.
 * - Range check: if target in range, tick attack timer and deal damage.
 * - If target out of range, set movement toward target.
 * - If target dead, clear attack target.
 * - Auto-aggro: idle units scan for nearby enemies.
 *
 * Damage formula: Attack.damage - (Armor.value * 0.5), minimum 1
 */

import { query, addComponent, hasComponent, entityExists } from 'bitecs';
import {
  Position,
  Health,
  Attack,
  Armor,
  Faction,
  UnitAI,
  Movement,
  GezeligheidBonus,
  Stunned,
  Invincible,
} from '../ecs/components';
import { IsUnit, IsBuilding, IsDead, NeedsPathfinding } from '../ecs/tags';
import {
  UnitAIState,
  MIN_DAMAGE,
  ARMOR_FACTOR,
  AGGRO_RANGE,
  NO_ENTITY,
} from '../types/index';
import { eventBus } from '../core/EventBus';
import type { GameWorld } from '../ecs/world';

// Scratch values
let _dx = 0;
let _dz = 0;
let _distSq = 0;
let _dist = 0;

/**
 * Create the combat system.
 */
export function createCombatSystem() {
  return function combatSystem(world: GameWorld, dt: number): void {
    const units = query(world, [Position, Attack, Health, UnitAI, IsUnit]);

    for (const eid of units) {
      // Skip stunned units -- they cannot act
      if (hasComponent(world, eid, Stunned) && Stunned.duration[eid] > 0) continue;

      const state = UnitAI.state[eid];

      // Transition Moving -> Idle when no movement target
      if (state === UnitAIState.Moving && Movement.hasTarget[eid] === 0) {
        UnitAI.state[eid] = UnitAIState.Idle;
      }
      // Transition Stunned -> Idle when stun ended
      if (state === UnitAIState.Stunned && !hasComponent(world, eid, Stunned)) {
        UnitAI.state[eid] = UnitAIState.Idle;
      }

      if (UnitAI.state[eid] === UnitAIState.Attacking) {
        processAttacking(world, eid, dt);
      } else if (UnitAI.state[eid] === UnitAIState.Idle) {
        processAutoAggro(world, eid, units);
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Attack processing
// ---------------------------------------------------------------------------

function processAttacking(world: GameWorld, eid: number, dt: number): void {
  const targetEid = UnitAI.targetEid[eid];

  // No target set
  if (targetEid === NO_ENTITY) {
    UnitAI.state[eid] = UnitAIState.Idle;
    return;
  }

  // Target no longer exists or is dead
  if (!entityExists(world, targetEid) || hasComponent(world, targetEid, IsDead) || Health.current[targetEid] <= 0) {
    clearAttackAndSeekNew(world, eid);
    return;
  }

  // Distance check
  _dx = Position.x[targetEid] - Position.x[eid];
  _dz = Position.z[targetEid] - Position.z[eid];
  _distSq = _dx * _dx + _dz * _dz;
  // Melee range = 0 in archetypes, use minimum effective range of 1.5
  const range = Math.max(Attack.range[eid], 1.5);
  const rangeSq = range * range;

  if (_distSq > rangeSq) {
    // Out of range -- move toward target
    Movement.targetX[eid] = Position.x[targetEid];
    Movement.targetZ[eid] = Position.z[targetEid];
    Movement.hasTarget[eid] = 1;
    addComponent(world, eid, NeedsPathfinding);
    return;
  }

  // In range -- stop moving
  Movement.hasTarget[eid] = 0;

  // Tick attack timer
  Attack.timer[eid] -= dt;
  if (Attack.timer[eid] > 0) return;

  // Check if target is invincible
  if (hasComponent(world, targetEid, Invincible) && Invincible.duration[targetEid] > 0) {
    // Reset cooldown but do no damage
    Attack.timer[eid] = Attack.speed[eid];
    return;
  }

  // Fire attack -- apply Gezelligheid bonus to attacker damage and target armor
  const attackerDamage = Attack.damage[eid] * (GezeligheidBonus.attackMult[eid] || 1.0);
  const targetArmor = Armor.value[targetEid] * (GezeligheidBonus.armorMult[targetEid] || 1.0);
  const rawDamage = attackerDamage - targetArmor * ARMOR_FACTOR;
  let effectiveDamage = Math.max(MIN_DAMAGE, rawDamage);

  // Apply damage reduction from Gezelligheid (target's group bonus)
  const dmgReduction = GezeligheidBonus.damageReduction[targetEid] || 0;
  if (dmgReduction > 0) {
    effectiveDamage *= (1 - dmgReduction);
    effectiveDamage = Math.max(MIN_DAMAGE, effectiveDamage);
  }

  Health.current[targetEid] -= effectiveDamage;

  // Emit combat-hit event for audio
  const isRanged = Attack.range[eid] > 1.5;
  eventBus.emit('combat-hit', {
    attackerEid: eid,
    targetEid,
    isRanged,
    x: Position.x[targetEid],
    z: Position.z[targetEid],
  });

  // Reset cooldown
  Attack.timer[eid] = Attack.speed[eid];

  // Check kill
  if (Health.current[targetEid] <= 0) {
    addComponent(world, targetEid, IsDead);
    clearAttackAndSeekNew(world, eid);
  }
}

// ---------------------------------------------------------------------------
// Auto-aggro for idle units
// ---------------------------------------------------------------------------

function processAutoAggro(
  world: GameWorld,
  eid: number,
  allUnits: ReturnType<typeof query>,
): void {
  const myFaction = Faction.id[eid];
  const px = Position.x[eid];
  const pz = Position.z[eid];
  const aggroSq = AGGRO_RANGE * AGGRO_RANGE;

  let closestEid = NO_ENTITY;
  let closestDistSq = aggroSq;

  // Check enemy units
  for (const other of allUnits) {
    if (other === eid) continue;
    if (Faction.id[other] === myFaction) continue;
    if (hasComponent(world, other, IsDead)) continue;
    if (Health.current[other] <= 0) continue;

    _dx = Position.x[other] - px;
    _dz = Position.z[other] - pz;
    _distSq = _dx * _dx + _dz * _dz;

    if (_distSq < closestDistSq) {
      closestDistSq = _distSq;
      closestEid = other;
    }
  }

  // Also check enemy buildings in aggro range
  const buildings = query(world, [Position, Health, IsBuilding]);
  for (const other of buildings) {
    if (Faction.id[other] === myFaction) continue;
    if (hasComponent(world, other, IsDead)) continue;
    if (Health.current[other] <= 0) continue;

    _dx = Position.x[other] - px;
    _dz = Position.z[other] - pz;
    _distSq = _dx * _dx + _dz * _dz;

    if (_distSq < closestDistSq) {
      closestDistSq = _distSq;
      closestEid = other;
    }
  }

  if (closestEid !== NO_ENTITY) {
    UnitAI.state[eid] = UnitAIState.Attacking;
    UnitAI.targetEid[eid] = closestEid;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clear current attack target and attempt to find a new enemy
 * within sight range (AGGRO_RANGE). If none found, go idle.
 */
function clearAttackAndSeekNew(world: GameWorld, eid: number): void {
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Movement.hasTarget[eid] = 0;
}
