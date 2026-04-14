/**
 * Reign of Brabant -- Unit Ability System
 *
 * Processes non-hero unit abilities each frame:
 * 1. Cooldown ticking for active abilities
 * 2. Active effect duration tracking
 * 3. Aura application (buff/debuff nearby units)
 * 4. Auto-activation for AI units
 *
 * Active abilities are triggered by:
 * - Player: hotkey (handled by CommandSystem, calls activateUnitAbility)
 * - AI: auto-triggered when conditions are met (cooldown ready + valid targets)
 *
 * Passive abilities and auras are processed automatically every frame.
 */

import { query, hasComponent, addComponent } from 'bitecs';
import {
  Position,
  Health,
  Attack,
  Movement,
  Faction,
  UnitAI,
  UnitType,
  UnitAbility,
  Stunned,
  Invincible,
  StatBuff,
} from '../ecs/components';
import { IsUnit, IsBuilding, IsDead } from '../ecs/tags';
import {
  UnitAIState,
  UnitAbilityType,
  AbilityTargetType,
  NO_ENTITY,
} from '../types/index';
import { getAbilityDef } from '../data/unitAbilityRegistry';
import { gameConfig } from '../core/GameConfig';
import { eventBus } from '../core/EventBus';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Public API: activate a unit's active ability
// ---------------------------------------------------------------------------

/**
 * Attempt to activate the unit ability on the given entity.
 * Returns true if successfully activated.
 */
export function activateUnitAbility(world: GameWorld, eid: number): boolean {
  if (!hasComponent(world, eid, UnitAbility)) return false;
  if (UnitAbility.hasAbility[eid] === 0) return false;

  // Check cooldown
  if (UnitAbility.cooldown[eid] > 0) return false;

  // Check if already active
  if (UnitAbility.activeDuration[eid] > 0) return false;

  // Check if stunned or dead
  if (hasComponent(world, eid, Stunned) && Stunned.duration[eid] > 0) return false;
  if (hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) return false;

  const def = getAbilityDef(UnitAbility.abilityId[eid]);
  if (!def || def.type !== UnitAbilityType.Active) return false;

  // Check proximity requirements (e.g., Polonaise needs 5+ nearby allies)
  if (def.minNearbyAllies && def.minNearbyAllies > 0) {
    const nearby = countNearbyAllies(world, eid, def.radius);
    if (nearby < def.minNearbyAllies) return false;
  }

  // Activate
  UnitAbility.activeDuration[eid] = def.duration > 0 ? def.duration : 0.1; // instant = brief flash
  UnitAbility.cooldown[eid] = def.cooldown;

  // Apply instant effects
  applyAbilityEffect(world, eid, def);

  // Emit event
  eventBus.emit('unit-ability-used', {
    eid,
    abilityId: def.id,
    x: Position.x[eid],
    z: Position.z[eid],
  });

  return true;
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

export function createUnitAbilitySystem() {
  return function unitAbilitySystem(world: GameWorld, dt: number): void {
    const units = query(world, [Position, Health, UnitAbility, IsUnit]);

    for (const eid of units) {
      if (hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue;
      if (UnitAbility.hasAbility[eid] === 0) continue;

      // Tick cooldown
      if (UnitAbility.cooldown[eid] > 0) {
        UnitAbility.cooldown[eid] = Math.max(0, UnitAbility.cooldown[eid] - dt);
      }

      // Tick active duration
      if (UnitAbility.activeDuration[eid] > 0) {
        UnitAbility.activeDuration[eid] -= dt;
        if (UnitAbility.activeDuration[eid] <= 0) {
          UnitAbility.activeDuration[eid] = 0;
          // Effect expired -- could clean up buff here
        }
      }

      // Auto-activate for AI units when cooldown ready
      const factionId = Faction.id[eid];
      if (!gameConfig.isPlayerFaction(factionId)) {
        autoActivateAI(world, eid);
      }
    }

    // Process auras (separate pass -- auras affect other units)
    processAuras(world);
  };
}

// ---------------------------------------------------------------------------
// AI auto-activation
// ---------------------------------------------------------------------------

function autoActivateAI(world: GameWorld, eid: number): void {
  if (UnitAbility.cooldown[eid] > 0) return;
  if (UnitAbility.activeDuration[eid] > 0) return;

  const def = getAbilityDef(UnitAbility.abilityId[eid]);
  if (!def || def.type !== UnitAbilityType.Active) return;

  const state = UnitAI.state[eid];

  // Only auto-activate during combat or idle near enemies
  if (state !== UnitAIState.Attacking && state !== UnitAIState.Idle) return;

  // Check if there are valid targets nearby
  const hasTargets = hasNearbyEnemies(world, eid, def.radius > 0 ? def.radius : 10);
  if (!hasTargets && def.effect.damage) return; // Offensive abilities need targets
  if (!hasTargets && def.effect.stunDuration) return; // Stuns need targets

  // For buff abilities, check if in combat
  if (def.effect.attackMult && (def.effect.attackMult > 1 || def.effect.speedMult)) {
    if (state !== UnitAIState.Attacking) return;
  }

  activateUnitAbility(world, eid);
}

// ---------------------------------------------------------------------------
// Aura processing
// ---------------------------------------------------------------------------

function processAuras(world: GameWorld): void {
  const units = query(world, [Position, Health, UnitAbility, IsUnit]);

  for (const eid of units) {
    if (hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue;
    if (UnitAbility.hasAbility[eid] === 0) continue;

    const def = getAbilityDef(UnitAbility.abilityId[eid]);
    if (!def || def.type !== UnitAbilityType.Aura) continue;

    const myFaction = Faction.id[eid];
    const px = Position.x[eid];
    const pz = Position.z[eid];
    const radiusSq = def.radius * def.radius;

    // Apply aura to nearby units
    const allUnits = query(world, [Position, Health, Attack, IsUnit]);
    for (const other of allUnits) {
      if (other === eid) continue;
      if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

      const dx = Position.x[other] - px;
      const dz = Position.z[other] - pz;
      const distSq = dx * dx + dz * dz;
      if (distSq > radiusSq) continue;

      const isAlly = Faction.id[other] === myFaction;

      // Friendly aura (buff)
      if (isAlly && def.effect.attackSpeedMult) {
        // Reduce attack speed (faster attacks)
        // Apply as a temporary modifier that resets each frame
        // We modify Attack.speed directly but need to restore it -- use StatBuff
        if (!hasComponent(world, other, StatBuff)) {
          addComponent(world, other, StatBuff);
          StatBuff.attackMult[other] = 1.0;
          StatBuff.speedMult[other] = 1.0;
          StatBuff.armorMult[other] = 1.0;
          StatBuff.duration[other] = 0.2; // refresh each frame
        }
        // Stack attack speed buff
        if (StatBuff.duration[other] < 0.5) {
          StatBuff.attackMult[other] = Math.max(StatBuff.attackMult[other], 1.0 / def.effect.attackSpeedMult);
          StatBuff.duration[other] = 0.2;
        }
      }

      // Enemy aura (debuff)
      if (!isAlly && def.effect.attackMult && def.effect.attackMult < 1.0) {
        // Reduce enemy accuracy/damage
        if (!hasComponent(world, other, StatBuff)) {
          addComponent(world, other, StatBuff);
          StatBuff.attackMult[other] = 1.0;
          StatBuff.speedMult[other] = 1.0;
          StatBuff.armorMult[other] = 1.0;
          StatBuff.duration[other] = 0.2;
        }
        if (StatBuff.duration[other] < 0.5) {
          StatBuff.attackMult[other] = Math.min(StatBuff.attackMult[other], def.effect.attackMult);
          StatBuff.duration[other] = 0.2;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Instant ability effects
// ---------------------------------------------------------------------------

function applyAbilityEffect(world: GameWorld, eid: number, def: ReturnType<typeof getAbilityDef>): void {
  if (!def) return;

  const myFaction = Faction.id[eid];
  const px = Position.x[eid];
  const pz = Position.z[eid];

  // AoE heal
  if (def.effect.heal && def.effect.heal > 0 && def.radius > 0) {
    const radiusSq = def.radius * def.radius;
    const allUnits = query(world, [Position, Health, IsUnit]);
    for (const other of allUnits) {
      if (Faction.id[other] !== myFaction) continue;
      if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

      const dx = Position.x[other] - px;
      const dz = Position.z[other] - pz;
      if (dx * dx + dz * dz > radiusSq) continue;

      Health.current[other] = Math.min(Health.max[other], Health.current[other] + def.effect.heal);
    }
  }

  // AoE stun
  if (def.effect.stunDuration && def.effect.stunDuration > 0 && def.radius > 0) {
    const radiusSq = def.radius * def.radius;
    const allUnits = query(world, [Position, Health, UnitAI, IsUnit]);
    for (const other of allUnits) {
      if (Faction.id[other] === myFaction) continue;
      if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

      const dx = Position.x[other] - px;
      const dz = Position.z[other] - pz;
      if (dx * dx + dz * dz > radiusSq) continue;

      addComponent(world, other, Stunned);
      Stunned.duration[other] = def.effect.stunDuration;
      UnitAI.state[other] = UnitAIState.Stunned;
    }
  }

  // Single target stun
  if (def.effect.stunDuration && def.effect.stunDuration > 0 && def.radius === 0) {
    const targetEid = UnitAI.targetEid[eid];
    if (targetEid !== NO_ENTITY && hasComponent(world, targetEid, UnitAI)) {
      addComponent(world, targetEid, Stunned);
      Stunned.duration[targetEid] = def.effect.stunDuration;
      UnitAI.state[targetEid] = UnitAIState.Stunned;
    }
  }

  // Self-buff (StatBuff for duration)
  if (def.duration > 0 && (def.effect.attackMult || def.effect.speedMult || def.effect.armorMult)) {
    // Apply buff to self and allies in radius
    const radiusSq = def.radius > 0 ? def.radius * def.radius : 0;
    const allUnits = query(world, [Position, Health, IsUnit]);

    for (const other of allUnits) {
      if (Faction.id[other] !== myFaction) continue;
      if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

      if (def.radius > 0) {
        const dx = Position.x[other] - px;
        const dz = Position.z[other] - pz;
        if (dx * dx + dz * dz > radiusSq) continue;
      } else if (other !== eid) {
        continue; // Self-only buff
      }

      addComponent(world, other, StatBuff);
      StatBuff.attackMult[other] = def.effect.attackMult ?? 1.0;
      StatBuff.speedMult[other] = def.effect.speedMult ?? 1.0;
      StatBuff.armorMult[other] = def.effect.armorMult ?? 1.0;
      StatBuff.duration[other] = def.duration;
    }
  }

  // Invincibility (Steenhuid)
  if (def.duration > 0 && def.id === 'steenhuid') {
    addComponent(world, eid, Invincible);
    Invincible.duration[eid] = def.duration;
  }

  // Line charge abilities (Volgas, Frituurcharge)
  if (def.targetType === AbilityTargetType.Line && def.effect.damage) {
    const facing = Math.atan2(
      Movement.targetZ[eid] - pz,
      Movement.targetX[eid] - px,
    );
    const dirX = Math.cos(facing);
    const dirZ = Math.sin(facing);
    const chargeRange = def.range;
    const chargeWidth = def.radius;

    const allUnits = query(world, [Position, Health, UnitAI, IsUnit]);
    for (const other of allUnits) {
      if (Faction.id[other] === myFaction) continue;
      if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

      const toX = Position.x[other] - px;
      const toZ = Position.z[other] - pz;
      const proj = toX * dirX + toZ * dirZ;
      if (proj < 0 || proj > chargeRange) continue;
      const perpX = toX - proj * dirX;
      const perpZ = toZ - proj * dirZ;
      const perpDist = Math.sqrt(perpX * perpX + perpZ * perpZ);
      if (perpDist > chargeWidth) continue;

      Health.current[other] -= def.effect.damage;
      if (Health.current[other] <= 0) {
        addComponent(world, other, IsDead);
      }

      // Knockback
      if (def.effect.knockback) {
        const pushDist = def.effect.knockback;
        const nx = perpX / (perpDist || 1);
        const nz = perpZ / (perpDist || 1);
        Position.x[other] += nx * pushDist;
        Position.z[other] += nz * pushDist;
      }

      // Speed debuff from charge
      if (def.effect.speedDebuff) {
        addComponent(world, other, StatBuff);
        StatBuff.speedMult[other] = def.effect.speedDebuff;
        StatBuff.attackMult[other] = 1.0;
        StatBuff.armorMult[other] = 1.0;
        StatBuff.duration[other] = def.effect.speedDebuffDuration ?? 5;
      }
    }

    // Move caster to end of charge line
    const endX = px + dirX * chargeRange;
    const endZ = pz + dirZ * chargeRange;
    Movement.targetX[eid] = endX;
    Movement.targetZ[eid] = endZ;
    Movement.hasTarget[eid] = 1;
    Movement.speed[eid] = 20; // fast charge

    // Self-disable after charge
    if (def.effect.selfDisableDuration) {
      addComponent(world, eid, Stunned);
      Stunned.duration[eid] = def.effect.selfDisableDuration;
    }
  }

  // AoE damage (Viral Post, etc.)
  if (def.effect.damage && def.effect.damage > 0 && def.radius > 0 && def.targetType !== AbilityTargetType.Line) {
    const radiusSq = def.radius * def.radius;
    const allUnits = query(world, [Position, Health, IsUnit]);
    let hits = 0;
    const maxHits = 3; // Viral Post hits max 3

    for (const other of allUnits) {
      if (hits >= maxHits) break;
      if (Faction.id[other] === myFaction) continue;
      if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

      const dx = Position.x[other] - px;
      const dz = Position.z[other] - pz;
      if (dx * dx + dz * dz > radiusSq) continue;

      Health.current[other] -= def.effect.damage;
      if (Health.current[other] <= 0) {
        addComponent(world, other, IsDead);
      }
      hits++;
    }
  }

  // Single target debuff (Performance Review)
  if (def.effect.attackMult && def.effect.attackMult < 1.0 && def.radius === 0 && def.duration > 0) {
    const targetEid = UnitAI.targetEid[eid];
    if (targetEid !== NO_ENTITY && hasComponent(world, targetEid, IsUnit)) {
      addComponent(world, targetEid, StatBuff);
      StatBuff.attackMult[targetEid] = def.effect.attackMult;
      StatBuff.speedMult[targetEid] = 1.0;
      StatBuff.armorMult[targetEid] = 1.0;
      StatBuff.duration[targetEid] = def.duration;
    }
  }

  // Building capture (Bod boven Vraagprijs)
  if (def.id === 'bod-boven-vraagprijs') {
    const targetEid = UnitAI.targetEid[eid];
    if (targetEid !== NO_ENTITY && hasComponent(world, targetEid, IsBuilding)) {
      if (Faction.id[targetEid] !== myFaction) {
        Faction.id[targetEid] = myFaction;
      }
    }
  }

  // Invisibility (Smokkelroute) -- prevent unit from being targeted
  if (def.effect.invisDuration && def.effect.invisDuration > 0) {
    // Use invincibility as a proxy for invisibility (enemies can't target)
    addComponent(world, eid, Invincible);
    Invincible.duration[eid] = def.effect.invisDuration;
    // Stop attacking while invisible
    if (UnitAI.state[eid] === UnitAIState.Attacking) {
      UnitAI.state[eid] = UnitAIState.Idle;
      UnitAI.targetEid[eid] = NO_ENTITY;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countNearbyAllies(world: GameWorld, eid: number, radius: number): number {
  const myFaction = Faction.id[eid];
  const px = Position.x[eid];
  const pz = Position.z[eid];
  const radiusSq = radius * radius;
  let count = 0;

  const units = query(world, [Position, Health, IsUnit]);
  for (const other of units) {
    if (other === eid) continue;
    if (Faction.id[other] !== myFaction) continue;
    if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

    const dx = Position.x[other] - px;
    const dz = Position.z[other] - pz;
    if (dx * dx + dz * dz <= radiusSq) count++;
  }
  return count;
}

function hasNearbyEnemies(world: GameWorld, eid: number, radius: number): boolean {
  const myFaction = Faction.id[eid];
  const px = Position.x[eid];
  const pz = Position.z[eid];
  const radiusSq = radius * radius;

  const units = query(world, [Position, Health, IsUnit]);
  for (const other of units) {
    if (Faction.id[other] === myFaction) continue;
    if (hasComponent(world, other, IsDead) || Health.current[other] <= 0) continue;

    const dx = Position.x[other] - px;
    const dz = Position.z[other] - pz;
    if (dx * dx + dz * dz <= radiusSq) return true;
  }
  return false;
}
