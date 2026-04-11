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
  Gatherer,
  Resource,
  GezeligheidBonus,
  Stunned,
  Invincible,
} from '../ecs/components';
import { IsUnit, IsBuilding, IsWorker, IsResource, IsDead, NeedsPathfinding } from '../ecs/tags';
import {
  UnitAIState,
  MIN_DAMAGE,
  ARMOR_FACTOR,
  AGGRO_RANGE,
  SELF_DEFENSE_RANGE,
  NO_ENTITY,
  MINIMUM_MELEE_RANGE,
  UPKEEP_DEBT_EFFECTIVENESS,
  AI_SCALING_TIER1_TIME,
  AI_SCALING_TIER2_TIME,
  AI_SCALING_TIER1_BONUS,
  AI_SCALING_TIER2_BONUS,
} from '../types/index';
import { playerState } from '../core/PlayerState';
import { gameConfig } from '../core/GameConfig';
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
      } else if (UnitAI.state[eid] === UnitAIState.HoldPosition) {
        processHoldPosition(world, eid, units, dt);
      } else if (
        UnitAI.state[eid] === UnitAIState.Gathering ||
        UnitAI.state[eid] === UnitAIState.MovingToResource ||
        UnitAI.state[eid] === UnitAIState.Returning
      ) {
        // Workers self-defend when enemies are very close
        processSelfDefense(world, eid, units);
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
  const range = Attack.range[eid];
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
  let attackerDamage = Attack.damage[eid] * (GezeligheidBonus.attackMult[eid] || 1.0);
  const targetArmor = Armor.value[targetEid] * (GezeligheidBonus.armorMult[targetEid] || 1.0);

  // Upkeep debt: reduce attack effectiveness
  const attackerFaction = Faction.id[eid];
  if (playerState.isInUpkeepDebt(attackerFaction)) {
    attackerDamage *= UPKEEP_DEBT_EFFECTIVENESS;
  }

  // AI late-game scaling: boost AI (non-player) unit damage
  if (!gameConfig.isPlayerFaction(attackerFaction)) {
    const elapsed = world.meta.elapsed;
    const aiScaling = getAIScalingMult(elapsed);
    if (aiScaling > 1.0) {
      attackerDamage *= aiScaling;
    }
  }

  const rawDamage = attackerDamage - targetArmor * ARMOR_FACTOR;
  let effectiveDamage = Math.max(MIN_DAMAGE, rawDamage);

  // Apply damage reduction from Gezelligheid (target's group bonus)
  const dmgReduction = GezeligheidBonus.damageReduction[targetEid] || 0;
  if (dmgReduction > 0) {
    effectiveDamage *= (1 - dmgReduction);
    effectiveDamage = Math.max(MIN_DAMAGE, effectiveDamage);
  }

  Health.current[targetEid] -= effectiveDamage;

  // Damage triggers self-defense: non-attacking units retaliate against attacker
  if (hasComponent(world, targetEid, UnitAI) && hasComponent(world, targetEid, IsUnit)) {
    const targetState = UnitAI.state[targetEid];
    if (targetState !== UnitAIState.Attacking && targetState !== UnitAIState.Dead) {
      // Save gather target for workers so they can auto-resume after combat
      if (hasComponent(world, targetEid, IsWorker) && Gatherer.targetEid[targetEid] !== NO_ENTITY) {
        Gatherer.previousTarget[targetEid] = Gatherer.targetEid[targetEid];
      }

      UnitAI.state[targetEid] = UnitAIState.Attacking;
      UnitAI.targetEid[targetEid] = eid;
      Movement.hasTarget[targetEid] = 0;
    }
  }

  // Emit combat-hit event for audio
  const isRanged = Attack.range[eid] > MINIMUM_MELEE_RANGE;
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
// Hold position: attack enemies in weapon range, but never move/chase
// ---------------------------------------------------------------------------

/**
 * Hold position behavior: scan for enemies within ATTACK range (not aggro range).
 * If an enemy is in range, attack it in-place. Never move toward or chase enemies.
 */
function processHoldPosition(
  world: GameWorld,
  eid: number,
  allUnits: ReturnType<typeof query>,
  dt: number,
): void {
  const myFaction = Faction.id[eid];
  const px = Position.x[eid];
  const pz = Position.z[eid];
  const range = Attack.range[eid];
  const rangeSq = range * range;

  // If we have an active target, check if it's still valid and in range
  const currentTarget = UnitAI.targetEid[eid];
  if (currentTarget !== NO_ENTITY) {
    if (
      !entityExists(world, currentTarget) ||
      hasComponent(world, currentTarget, IsDead) ||
      Health.current[currentTarget] <= 0
    ) {
      // Target gone -- clear and scan for new target
      UnitAI.targetEid[eid] = NO_ENTITY;
    } else {
      _dx = Position.x[currentTarget] - px;
      _dz = Position.z[currentTarget] - pz;
      _distSq = _dx * _dx + _dz * _dz;

      if (_distSq <= rangeSq) {
        // Target still in range -- tick attack timer and fire
        Attack.timer[eid] -= dt;
        if (Attack.timer[eid] <= 0) {
          // Check invincibility
          if (hasComponent(world, currentTarget, Invincible) && Invincible.duration[currentTarget] > 0) {
            Attack.timer[eid] = Attack.speed[eid];
            return;
          }

          let attackerDamage = Attack.damage[eid] * (GezeligheidBonus.attackMult[eid] || 1.0);
          const targetArmor = Armor.value[currentTarget] * (GezeligheidBonus.armorMult[currentTarget] || 1.0);

          if (playerState.isInUpkeepDebt(myFaction)) {
            attackerDamage *= UPKEEP_DEBT_EFFECTIVENESS;
          }
          if (!gameConfig.isPlayerFaction(myFaction)) {
            const elapsed = world.meta.elapsed;
            const aiScaling = getAIScalingMult(elapsed);
            if (aiScaling > 1.0) attackerDamage *= aiScaling;
          }

          const rawDamage = attackerDamage - targetArmor * ARMOR_FACTOR;
          const effectiveDamage = Math.max(MIN_DAMAGE, rawDamage);
          Health.current[currentTarget] = Math.max(0, Health.current[currentTarget] - effectiveDamage);
          Attack.timer[eid] = Attack.speed[eid];

          const isRangedHold = Attack.range[eid] > MINIMUM_MELEE_RANGE;
          eventBus.emit('combat-hit', {
            attackerEid: eid,
            targetEid: currentTarget,
            isRanged: isRangedHold,
            x: Position.x[currentTarget],
            z: Position.z[currentTarget],
          });
        }
        return;
      } else {
        // Target moved out of range -- do NOT chase, clear target
        UnitAI.targetEid[eid] = NO_ENTITY;
      }
    }
  }

  // No active target -- scan for closest enemy within weapon range
  let closestEid = NO_ENTITY;
  let closestDistSq = rangeSq;

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

  // Also check enemy buildings in weapon range
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
    UnitAI.targetEid[eid] = closestEid;
    // Stay in HoldPosition state -- do NOT transition to Attacking (which would chase)
  }
}

// ---------------------------------------------------------------------------
// Self-defense: workers interrupt gathering when enemies are very close
// ---------------------------------------------------------------------------

function processSelfDefense(world: GameWorld, eid: number, allUnits: { readonly length: number; readonly [n: number]: number }): void {
  const selfDefenseSq = SELF_DEFENSE_RANGE * SELF_DEFENSE_RANGE;
  const myFaction = Faction.id[eid];
  let closestEid = NO_ENTITY;
  let closestDistSq = selfDefenseSq;

  for (let i = 0; i < allUnits.length; i++) {
    const other = allUnits[i];
    if (other === eid) continue;
    if (Faction.id[other] === myFaction) continue;
    if (hasComponent(world, other, IsDead)) continue;

    _dx = Position.x[other] - Position.x[eid];
    _dz = Position.z[other] - Position.z[eid];
    _distSq = _dx * _dx + _dz * _dz;
    if (_distSq < closestDistSq) {
      closestDistSq = _distSq;
      closestEid = other;
    }
  }

  if (closestEid !== NO_ENTITY) {
    // Save gather target before switching to combat so we can resume after
    if (hasComponent(world, eid, IsWorker) && Gatherer.targetEid[eid] !== NO_ENTITY) {
      Gatherer.previousTarget[eid] = Gatherer.targetEid[eid];
    }

    UnitAI.state[eid] = UnitAIState.Attacking;
    UnitAI.targetEid[eid] = closestEid;
    Movement.hasTarget[eid] = 0;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clear current attack target and attempt to find a new enemy
 * within sight range (AGGRO_RANGE). If none found, go idle.
 * Workers auto-return to their previous gathering task if applicable.
 */
function clearAttackAndSeekNew(world: GameWorld, eid: number): void {
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Movement.hasTarget[eid] = 0;

  // Workers: auto-resume gathering if they had a previous gather target
  if (hasComponent(world, eid, IsWorker)) {
    const prevTarget = Gatherer.previousTarget[eid];
    if (
      prevTarget !== NO_ENTITY &&
      prevTarget !== 0 &&
      entityExists(world, prevTarget) &&
      !hasComponent(world, prevTarget, IsDead) &&
      hasComponent(world, prevTarget, IsResource) &&
      Resource.amount[prevTarget] > 0
    ) {
      // Resume gathering from the previous resource node
      Gatherer.state[eid] = 1; // MOVING_TO_RESOURCE
      Gatherer.targetEid[eid] = prevTarget;
      Gatherer.resourceType[eid] = Resource.type[prevTarget];

      Movement.targetX[eid] = Position.x[prevTarget];
      Movement.targetZ[eid] = Position.z[prevTarget];
      Movement.hasTarget[eid] = 1;

      UnitAI.state[eid] = UnitAIState.MovingToResource;
      UnitAI.targetEid[eid] = prevTarget;

      addComponent(world, eid, NeedsPathfinding);

      // Clear previous target so we don't re-trigger
      Gatherer.previousTarget[eid] = NO_ENTITY;
      return;
    }

    // Clear stale previous target
    Gatherer.previousTarget[eid] = NO_ENTITY;
  }
}

// ---------------------------------------------------------------------------
// AI Late-Game Scaling
// ---------------------------------------------------------------------------

/**
 * Get the damage/HP multiplier for AI units based on elapsed game time.
 * Returns 1.0 (no bonus) before tier 1 time, scales up in tiers.
 */
function getAIScalingMult(elapsedSeconds: number): number {
  if (elapsedSeconds >= AI_SCALING_TIER2_TIME) {
    return 1.0 + AI_SCALING_TIER2_BONUS;
  }
  if (elapsedSeconds >= AI_SCALING_TIER1_TIME) {
    return 1.0 + AI_SCALING_TIER1_BONUS;
  }
  return 1.0;
}

/**
 * Get the AI HP scaling multiplier for use by ProductionSystem when spawning AI units.
 * Exported so other systems can query the current scaling tier.
 */
export function getAIHPScaling(elapsedSeconds: number): number {
  return getAIScalingMult(elapsedSeconds);
}
