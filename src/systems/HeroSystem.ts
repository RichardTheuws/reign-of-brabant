/**
 * Reign of Brabant -- Hero System
 *
 * Manages hero-specific logic:
 * 1. Ability cooldown ticking
 * 2. Ability execution (Q/W/E per hero)
 * 3. Stun processing
 * 4. Hero revival (60s timer after death)
 * 5. Summoned unit lifespan
 * 6. Invincibility + StatBuff duration tracking
 *
 * Runs after AbilitySystem (faction-wide abilities) and before CombatSystem.
 */

import { query, addComponent, removeComponent, hasComponent, entityExists } from 'bitecs';
import {
  Position,
  Health,
  Attack,
  Armor,
  Faction,
  UnitAI,
  Movement,
  Hero,
  HeroAbilities,
  Stunned,
  Invincible,
  StatBuff,
  SummonTimer,
  GezeligheidBonus,
  Production,
} from '../ecs/components';
import { IsUnit, IsHero, IsReviving, IsDead, IsSummon, IsBuilding } from '../ecs/tags';
import { eventBus } from '../core/EventBus';
import { playerState } from '../core/PlayerState';
import {
  FactionId,
  HeroTypeId,
  UnitAIState,
  NO_ENTITY,
  HERO_REVIVE_TIME,
  HERO_POPULATION_COST,
} from '../types/index';
import { HERO_ARCHETYPES } from '../entities/heroArchetypes';
import { createHero, createMilitia, markHeroInactive } from '../entities/heroFactory';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Module state: pending hero revivals
// ---------------------------------------------------------------------------

interface PendingRevival {
  heroTypeId: HeroTypeId;
  factionId: FactionId;
  timer: number;
  townHallX: number;
  townHallZ: number;
}

const pendingRevivals: PendingRevival[] = [];

/** Get pending revivals for HUD display. */
export function getPendingRevivals(): readonly PendingRevival[] {
  return pendingRevivals;
}

/** Reset hero system state (new game). */
export function resetHeroSystem(): void {
  pendingRevivals.length = 0;
}

// ---------------------------------------------------------------------------
// Ability activation API (called from Game.ts / input)
// ---------------------------------------------------------------------------

/** Currently targeted entity for targeted abilities. */
let abilityTargetEid: number = NO_ENTITY;

/**
 * Set the target for the next targeted ability.
 */
export function setAbilityTarget(eid: number): void {
  abilityTargetEid = eid;
}

/**
 * Attempt to activate a hero ability.
 * @param heroEid - The hero entity
 * @param slot - Ability slot (0=Q, 1=W, 2=E)
 * @returns true if successfully activated
 */
export function activateHeroAbility(
  world: GameWorld,
  heroEid: number,
  slot: number,
): boolean {
  if (!entityExists(world, heroEid)) return false;
  if (!hasComponent(world, heroEid, IsHero)) return false;
  if (hasComponent(world, heroEid, IsDead)) return false;
  if (hasComponent(world, heroEid, Stunned) && Stunned.duration[heroEid] > 0) return false;

  const heroTypeId = Hero.heroTypeId[heroEid] as HeroTypeId;
  const arch = HERO_ARCHETYPES[heroTypeId];
  if (!arch || slot >= arch.abilities.length) return false;

  const abilityDef = arch.abilities[slot];
  const factionId = Faction.id[heroEid] as FactionId;

  // Check cooldown
  const cd = getAbilityCooldown(heroEid, slot);
  if (cd > 0) return false;

  // Check gezelligheid cost
  if (abilityDef.gezelligheidCost) {
    const current = playerState.getGezelligheid(factionId);
    if (current < abilityDef.gezelligheidCost) return false;
    playerState.spendGezelligheid(factionId, abilityDef.gezelligheidCost);
  }

  // Set cooldown
  setAbilityCooldown(heroEid, slot, abilityDef.cooldown);

  // Execute ability effect
  executeAbility(world, heroEid, heroTypeId, abilityDef.id, factionId);

  // Emit event
  eventBus.emit('hero-ability-used', {
    entityId: heroEid,
    factionId,
    heroTypeId,
    abilityId: abilityDef.id,
    abilitySlot: slot,
  });

  return true;
}

// ---------------------------------------------------------------------------
// Cooldown helpers
// ---------------------------------------------------------------------------

function getAbilityCooldown(eid: number, slot: number): number {
  switch (slot) {
    case 0: return HeroAbilities.ability0Cooldown[eid];
    case 1: return HeroAbilities.ability1Cooldown[eid];
    case 2: return HeroAbilities.ability2Cooldown[eid];
    default: return Infinity;
  }
}

function setAbilityCooldown(eid: number, slot: number, value: number): void {
  switch (slot) {
    case 0: HeroAbilities.ability0Cooldown[eid] = value; break;
    case 1: HeroAbilities.ability1Cooldown[eid] = value; break;
    case 2: HeroAbilities.ability2Cooldown[eid] = value; break;
  }
}

// ---------------------------------------------------------------------------
// Ability execution
// ---------------------------------------------------------------------------

function executeAbility(
  world: GameWorld,
  heroEid: number,
  heroTypeId: HeroTypeId,
  abilityId: string,
  factionId: FactionId,
): void {
  const hx = Position.x[heroEid];
  const hz = Position.z[heroEid];

  switch (abilityId) {
    // ===== PRINS VAN BRABANSEN =====
    case 'prins-toespraak': {
      // +30% all stats to allies in radius 12, 20s
      const radius = 12;
      const radiusSq = radius * radius;
      const allUnits = query(world, [Position, Faction, IsUnit]);
      for (const eid of allUnits) {
        if (Faction.id[eid] !== factionId) continue;
        if (hasComponent(world, eid, IsDead)) continue;
        const dx = Position.x[eid] - hx;
        const dz = Position.z[eid] - hz;
        if (dx * dx + dz * dz <= radiusSq) {
          applyStatBuff(world, eid, 1.30, 1.30, 1.30, 20);
        }
      }
      break;
    }

    case 'prins-dansen': {
      // AoE stun radius 8, enemies dance 4s
      const radius = 8;
      const radiusSq = radius * radius;
      const allUnits = query(world, [Position, Faction, IsUnit]);
      for (const eid of allUnits) {
        if (Faction.id[eid] === factionId) continue;
        if (hasComponent(world, eid, IsDead)) continue;
        const dx = Position.x[eid] - hx;
        const dz = Position.z[eid] - hz;
        if (dx * dx + dz * dz <= radiusSq) {
          applyStun(world, eid, 4);
        }
      }
      break;
    }

    case 'prins-alaaf': {
      // All Brabandse units invincible 8s (map-wide)
      const allUnits = query(world, [Position, Faction, IsUnit]);
      for (const eid of allUnits) {
        if (Faction.id[eid] !== factionId) continue;
        if (hasComponent(world, eid, IsDead)) continue;
        applyInvincible(world, eid, 8);
      }
      break;
    }

    // ===== BOER VAN BRABANSEN =====
    case 'boer-mestverspreider': {
      // Cone AoE, 30 dmg + -40% speed 6s
      const coneRange = 10;
      const coneRangeSq = coneRange * coneRange;
      const coneHalfAngle = Math.PI / 6; // 30 degree cone = 15 deg half-angle
      const facing = Math.atan2(
        Movement.targetZ[heroEid] - hz,
        Movement.targetX[heroEid] - hx,
      );
      const allUnits = query(world, [Position, Faction, Health, IsUnit]);
      for (const eid of allUnits) {
        if (Faction.id[eid] === factionId) continue;
        if (hasComponent(world, eid, IsDead)) continue;
        const dx = Position.x[eid] - hx;
        const dz = Position.z[eid] - hz;
        const distSq = dx * dx + dz * dz;
        if (distSq > coneRangeSq) continue;
        const angle = Math.atan2(dz, dx);
        let diff = angle - facing;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) <= coneHalfAngle) {
          Health.current[eid] -= 30;
          if (Health.current[eid] <= 0) {
            addComponent(world, eid, IsDead);
          }
          // Slow: apply -40% speed buff for 6s
          applyStatBuff(world, eid, 1.0, 0.60, 1.0, 6);
        }
      }
      break;
    }

    case 'boer-opstand': {
      // Summon 6 militia around the hero
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const sx = hx + Math.cos(angle) * 3;
        const sz = hz + Math.sin(angle) * 3;
        createMilitia(world, factionId, sx, sz, 30);
      }
      break;
    }

    case 'boer-tractorcharge': {
      // Line charge: 25 units distance, 80 dmg + knockback
      const chargeDistance = 25;
      const chargeWidth = 2;
      const facing2 = Math.atan2(
        Movement.targetZ[heroEid] - hz,
        Movement.targetX[heroEid] - hx,
      );
      const dirX = Math.cos(facing2);
      const dirZ = Math.sin(facing2);
      const endX = hx + dirX * chargeDistance;
      const endZ = hz + dirZ * chargeDistance;

      // Move hero to end position
      Movement.targetX[heroEid] = endX;
      Movement.targetZ[heroEid] = endZ;
      Movement.hasTarget[heroEid] = 1;
      // Temporarily boost speed for charge
      Movement.speed[heroEid] = 20; // very fast charge

      // Damage all enemies in the charge path
      const allUnits = query(world, [Position, Faction, Health, IsUnit]);
      for (const eid of allUnits) {
        if (Faction.id[eid] === factionId) continue;
        if (hasComponent(world, eid, IsDead)) continue;
        const ex = Position.x[eid];
        const ez = Position.z[eid];
        // Project enemy onto charge line
        const toEX = ex - hx;
        const toEZ = ez - hz;
        const proj = toEX * dirX + toEZ * dirZ;
        if (proj < 0 || proj > chargeDistance) continue;
        const perpX = toEX - proj * dirX;
        const perpZ = toEZ - proj * dirZ;
        const perpDist = Math.sqrt(perpX * perpX + perpZ * perpZ);
        if (perpDist <= chargeWidth) {
          Health.current[eid] -= 80;
          if (Health.current[eid] <= 0) {
            addComponent(world, eid, IsDead);
          }
          // Knockback: push enemy away from charge line
          const knockX = perpX / (perpDist || 1) * 5;
          const knockZ = perpZ / (perpDist || 1) * 5;
          Position.x[eid] += knockX;
          Position.z[eid] += knockZ;
        }
      }
      break;
    }

    // ===== DE CEO =====
    case 'ceo-kwartaalcijfers': {
      // Randstad buildings +50% production 20s
      // We track this as a timed buff in module state
      ceoProductionBuff.active = true;
      ceoProductionBuff.remaining = 20;
      break;
    }

    case 'ceo-goldenhandshake': {
      // Target hero disabled 8s
      if (abilityTargetEid !== NO_ENTITY && entityExists(world, abilityTargetEid)) {
        if (hasComponent(world, abilityTargetEid, IsHero)) {
          applyStun(world, abilityTargetEid, 8);
        }
      }
      abilityTargetEid = NO_ENTITY;
      break;
    }

    case 'ceo-vijandige-overname': {
      // Capture enemy building <50% HP
      if (abilityTargetEid !== NO_ENTITY && entityExists(world, abilityTargetEid)) {
        if (hasComponent(world, abilityTargetEid, IsBuilding)) {
          const hpRatio = Health.current[abilityTargetEid] / Health.max[abilityTargetEid];
          if (hpRatio < 0.5 && Faction.id[abilityTargetEid] !== factionId) {
            // Capture: change faction
            Faction.id[abilityTargetEid] = factionId;
          }
        }
      }
      abilityTargetEid = NO_ENTITY;
      break;
    }

    // ===== DE POLITICUS =====
    case 'politicus-verkiezingsbelofte': {
      // Allies in radius 10 get +40% all stats, 15s
      const radius = 10;
      const radiusSq = radius * radius;
      const allUnits = query(world, [Position, Faction, IsUnit]);
      for (const eid of allUnits) {
        if (Faction.id[eid] !== factionId) continue;
        if (hasComponent(world, eid, IsDead)) continue;
        const dx = Position.x[eid] - hx;
        const dz = Position.z[eid] - hz;
        if (dx * dx + dz * dz <= radiusSq) {
          applyStatBuff(world, eid, 1.40, 1.40, 1.40, 15);
        }
      }
      break;
    }

    case 'politicus-lobby': {
      // Target enemy building: production 50% slower for 30s
      // Simplified: we slow down the target building by modifying production duration
      if (abilityTargetEid !== NO_ENTITY && entityExists(world, abilityTargetEid)) {
        if (hasComponent(world, abilityTargetEid, Production)) {
          // Double the production time (effectively 50% slower)
          Production.duration[abilityTargetEid] *= 1.5;
        }
      }
      abilityTargetEid = NO_ENTITY;
      break;
    }

    case 'politicus-kamerdebat': {
      // All units (friend AND foe) in radius 20 stop fighting 12s
      // Randstad units heal +5 HP/s during debat
      const radius = 20;
      const radiusSq = radius * radius;
      const allUnits = query(world, [Position, Faction, Health, IsUnit]);
      for (const eid of allUnits) {
        if (hasComponent(world, eid, IsDead)) continue;
        const dx = Position.x[eid] - hx;
        const dz = Position.z[eid] - hz;
        if (dx * dx + dz * dz <= radiusSq) {
          applyStun(world, eid, 12);
          // Randstad units get healing (tracked below)
          if (Faction.id[eid] === factionId) {
            kamerdebatHealing.push({ eid, remaining: 12 });
          }
        }
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Buff / debuff helpers
// ---------------------------------------------------------------------------

function applyStatBuff(
  world: GameWorld,
  eid: number,
  attackMult: number,
  speedMult: number,
  armorMult: number,
  duration: number,
): void {
  if (!hasComponent(world, eid, StatBuff)) {
    addComponent(world, eid, StatBuff);
  }
  // Use the strongest buff if stacking
  StatBuff.attackMult[eid] = Math.max(StatBuff.attackMult[eid] || 1, attackMult);
  StatBuff.speedMult[eid] = Math.max(StatBuff.speedMult[eid] || 1, speedMult);
  StatBuff.armorMult[eid] = Math.max(StatBuff.armorMult[eid] || 1, armorMult);
  StatBuff.duration[eid] = Math.max(StatBuff.duration[eid] || 0, duration);
}

function applyStun(world: GameWorld, eid: number, duration: number): void {
  if (!hasComponent(world, eid, Stunned)) {
    addComponent(world, eid, Stunned);
  }
  Stunned.duration[eid] = Math.max(Stunned.duration[eid] || 0, duration);
  // Stop movement
  Movement.hasTarget[eid] = 0;
  UnitAI.state[eid] = UnitAIState.Stunned;
  UnitAI.targetEid[eid] = NO_ENTITY;
}

function applyInvincible(world: GameWorld, eid: number, duration: number): void {
  if (!hasComponent(world, eid, Invincible)) {
    addComponent(world, eid, Invincible);
  }
  Invincible.duration[eid] = Math.max(Invincible.duration[eid] || 0, duration);
}

// ---------------------------------------------------------------------------
// Module state: CEO production buff
// ---------------------------------------------------------------------------

export const ceoProductionBuff = {
  active: false,
  remaining: 0,
};

// Module state: Kamerdebat healing
const kamerdebatHealing: Array<{ eid: number; remaining: number }> = [];

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the hero system.
 */
export function createHeroSystem() {
  return function heroSystem(world: GameWorld, dt: number): void {
    // 1. Tick ability cooldowns for all living heroes
    tickAbilityCooldowns(world, dt);

    // 2. Tick stun durations
    tickStuns(world, dt);

    // 3. Tick invincibility durations
    tickInvincibility(world, dt);

    // 4. Tick stat buffs
    tickStatBuffs(world, dt);

    // 5. Apply stat buffs to effective stats
    applyStatBuffsToStats(world);

    // 6. Tick summon lifespans
    tickSummons(world, dt);

    // 7. Process pending hero revivals
    tickRevivals(world, dt);

    // 8. CEO production buff timer
    if (ceoProductionBuff.active) {
      ceoProductionBuff.remaining -= dt;
      if (ceoProductionBuff.remaining <= 0) {
        ceoProductionBuff.active = false;
        ceoProductionBuff.remaining = 0;
      }
    }

    // 9. Kamerdebat healing
    for (let i = kamerdebatHealing.length - 1; i >= 0; i--) {
      const h = kamerdebatHealing[i];
      h.remaining -= dt;
      if (h.remaining <= 0 || !entityExists(world, h.eid)) {
        kamerdebatHealing.splice(i, 1);
        continue;
      }
      if (hasComponent(world, h.eid, Health)) {
        Health.current[h.eid] = Math.min(
          Health.max[h.eid],
          Health.current[h.eid] + 5 * dt,
        );
      }
    }

    // 10. Detect hero deaths and start revival
    detectHeroDeaths(world);
  };
}

// ---------------------------------------------------------------------------
// Tick functions
// ---------------------------------------------------------------------------

function tickAbilityCooldowns(world: GameWorld, dt: number): void {
  const heroes = query(world, [HeroAbilities, IsHero, IsUnit]);
  for (const eid of heroes) {
    if (hasComponent(world, eid, IsDead)) continue;
    if (HeroAbilities.ability0Cooldown[eid] > 0) {
      HeroAbilities.ability0Cooldown[eid] = Math.max(0, HeroAbilities.ability0Cooldown[eid] - dt);
    }
    if (HeroAbilities.ability1Cooldown[eid] > 0) {
      HeroAbilities.ability1Cooldown[eid] = Math.max(0, HeroAbilities.ability1Cooldown[eid] - dt);
    }
    if (HeroAbilities.ability2Cooldown[eid] > 0) {
      HeroAbilities.ability2Cooldown[eid] = Math.max(0, HeroAbilities.ability2Cooldown[eid] - dt);
    }
  }
}

function tickStuns(world: GameWorld, dt: number): void {
  const stunned = query(world, [Stunned]);
  for (const eid of stunned) {
    Stunned.duration[eid] -= dt;
    if (Stunned.duration[eid] <= 0) {
      removeComponent(world, eid, Stunned);
      // Return to idle if still alive
      if (!hasComponent(world, eid, IsDead)) {
        UnitAI.state[eid] = UnitAIState.Idle;
      }
    } else {
      // Keep stunned: prevent any state changes
      Movement.hasTarget[eid] = 0;
      UnitAI.state[eid] = UnitAIState.Stunned;
    }
  }
}

function tickInvincibility(world: GameWorld, dt: number): void {
  const invincibles = query(world, [Invincible]);
  for (const eid of invincibles) {
    Invincible.duration[eid] -= dt;
    if (Invincible.duration[eid] <= 0) {
      removeComponent(world, eid, Invincible);
    }
  }
}

function tickStatBuffs(world: GameWorld, dt: number): void {
  const buffed = query(world, [StatBuff]);
  for (const eid of buffed) {
    StatBuff.duration[eid] -= dt;
    if (StatBuff.duration[eid] <= 0) {
      // Reset multipliers
      StatBuff.attackMult[eid] = 1.0;
      StatBuff.speedMult[eid] = 1.0;
      StatBuff.armorMult[eid] = 1.0;
      removeComponent(world, eid, StatBuff);
    }
  }
}

/**
 * Apply StatBuff multipliers to the Gezelligheid bonus system
 * (which is already the stat multiplier pipeline).
 */
function applyStatBuffsToStats(world: GameWorld): void {
  const buffed = query(world, [StatBuff, IsUnit]);
  for (const eid of buffed) {
    if (hasComponent(world, eid, IsDead)) continue;
    // Multiply into GezeligheidBonus (which CombatSystem reads)
    if (hasComponent(world, eid, GezeligheidBonus)) {
      GezeligheidBonus.attackMult[eid] *= (StatBuff.attackMult[eid] || 1.0);
      GezeligheidBonus.speedMult[eid] *= (StatBuff.speedMult[eid] || 1.0);
      GezeligheidBonus.armorMult[eid] *= (StatBuff.armorMult[eid] || 1.0);
    }
  }
}

function tickSummons(world: GameWorld, dt: number): void {
  const summons = query(world, [SummonTimer, IsUnit, IsSummon]);
  for (const eid of summons) {
    if (hasComponent(world, eid, IsDead)) continue;
    SummonTimer.remaining[eid] -= dt;
    if (SummonTimer.remaining[eid] <= 0) {
      // Summon expired: kill it
      addComponent(world, eid, IsDead);
    }
  }
}

function tickRevivals(world: GameWorld, dt: number): void {
  for (let i = pendingRevivals.length - 1; i >= 0; i--) {
    const revival = pendingRevivals[i];
    revival.timer -= dt;
    if (revival.timer <= 0) {
      // Revive the hero at Town Hall
      const eid = createHero(
        world,
        revival.heroTypeId,
        revival.factionId,
        revival.townHallX + 3,
        revival.townHallZ + 3,
        revival.townHallX,
        revival.townHallZ,
      );
      if (eid >= 0) {
        // Add population back
        playerState.addPopulation(revival.factionId, HERO_POPULATION_COST);

        eventBus.emit('hero-revived', {
          entityId: eid,
          factionId: revival.factionId,
          heroTypeId: revival.heroTypeId,
        });
      }
      pendingRevivals.splice(i, 1);
    }
  }
}

function detectHeroDeaths(world: GameWorld): void {
  const deadHeroes = query(world, [Hero, IsHero, IsDead]);
  for (const eid of deadHeroes) {
    // Only process each death once (check if already in pending revivals)
    const heroTypeId = Hero.heroTypeId[eid] as HeroTypeId;
    const factionId = Faction.id[eid] as FactionId;

    const alreadyPending = pendingRevivals.some(
      r => r.heroTypeId === heroTypeId && r.factionId === factionId,
    );
    if (alreadyPending) continue;

    // Mark inactive so a new one can be created on revival
    markHeroInactive(factionId, heroTypeId);

    // Start revival timer
    pendingRevivals.push({
      heroTypeId,
      factionId,
      timer: HERO_REVIVE_TIME,
      townHallX: Hero.reviveX[eid],
      townHallZ: Hero.reviveZ[eid],
    });

    eventBus.emit('hero-died', {
      entityId: eid,
      factionId,
      heroTypeId,
    });
  }
}
