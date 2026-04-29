/**
 * Reign of Brabant -- Diplomacy System
 *
 * Implements the Belgen faction's unique Diplomatie / Het Compromis mechanic:
 *
 * 1. **Compromis Abilities** (4 types, cost Chocolade):
 *    - Wapenstilstand:        50 Chocolade, 30s ceasefire, 120s cooldown
 *    - Handelsovereenkomst:   30 Chocolade, 60s +20% gather, 90s cooldown
 *    - Culturele Uitwisseling: 40 Chocolade, 20s copy passive, 180s cooldown
 *    - Niet-aanvalspact:      60 Chocolade, 45s building protection, 150s cooldown
 *
 * 2. **Chocolade-Overtuiging** (hero ability):
 *    - Persuade neutral/enemy units (25 Chocolade each, max 3, 30s duration)
 *
 * 3. **Commissie Oprichten** (passive):
 *    - 3+ Belgische gebouwen: enemy production in radius 25 is 15% slower
 *    - Does NOT stack (max 1 commissie effect per enemy building)
 *
 * 4. **Damage Split** (passive):
 *    - If a Belgische unit takes >30 damage in a single hit:
 *      40% of excess damage is redistributed to enemies in radius 8
 *      Requires at least 1 enemy in range, otherwise no effect
 */

import { query, hasComponent } from 'bitecs';
import {
  Position,
  Building,
  Production,
  Faction,
  Attack,
  Health,
  UnitType,
  Armor,
} from '../ecs/components';
import { IsBuilding, IsUnit, IsDead } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import {
  FactionId,
  UnitTypeId,
  MIN_DAMAGE,
  ARMOR_FACTOR,
} from '../types/index';
import { getSalonProtocolCostMult } from './FactionSpecial1Passives';
import { getPralinesDurationMult } from './ChocolaterieSystem';
import type { GameWorld } from '../ecs/world';
import type { CombatHitEvent } from '../types/index';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// -- Compromis costs (Chocolade) --
const CEASEFIRE_COST = 50;
const TRADE_COST = 30;
const CULTURAL_COST = 40;
const NON_AGGRESSION_COST = 60;

// -- Compromis durations (seconds) --
const CEASEFIRE_DURATION = 30;
const TRADE_DURATION = 60;
const CULTURAL_DURATION = 20;
const NON_AGGRESSION_DURATION = 45;

// -- Compromis cooldowns (seconds) --
const CEASEFIRE_COOLDOWN = 120;
const TRADE_COOLDOWN = 90;
const CULTURAL_COOLDOWN = 180;
const NON_AGGRESSION_COOLDOWN = 150;

// -- Trade bonus --
const TRADE_GATHER_BONUS = 0.20; // +20% for both parties

// -- Chocolade-Overtuiging --
const PERSUASION_COST = 25;          // Chocolade per unit
const PERSUASION_DURATION = 30;      // seconds
const PERSUASION_MAX_UNITS = 3;      // max simultaneously persuaded

// -- Commissie Oprichten --
const COMMISSIE_BUILDING_THRESHOLD = 3; // minimum Belgische gebouwen
const COMMISSIE_RADIUS = 25;
const COMMISSIE_RADIUS_SQ = COMMISSIE_RADIUS * COMMISSIE_RADIUS;
const COMMISSIE_SLOWDOWN = 0.15;     // 15% slower production

// -- Damage Split --
const DAMAGE_SPLIT_THRESHOLD = 30;   // minimum single-hit damage to trigger
const DAMAGE_SPLIT_RATIO = 0.40;     // 40% of excess redistributed
const DAMAGE_SPLIT_RADIUS = 8;
const DAMAGE_SPLIT_RADIUS_SQ = DAMAGE_SPLIT_RADIUS * DAMAGE_SPLIT_RADIUS;

// -- System throttle for commissie scan --
const COMMISSIE_UPDATE_INTERVAL = 1.0; // recalculate every 1 second

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompromisType = 'ceasefire' | 'trade' | 'cultural' | 'non-aggression';

interface ActiveCompromis {
  type: CompromisType;
  targetFaction: number;
  startTime: number;
  duration: number;
}

interface PersuadedUnit {
  entityId: number;
  originalFaction: number;
  returnTime: number; // game elapsed time when unit returns
}

interface CompromisConfig {
  cost: number;
  duration: number;
  cooldown: number;
}

const COMPROMIS_CONFIGS: Record<CompromisType, CompromisConfig> = {
  ceasefire: { cost: CEASEFIRE_COST, duration: CEASEFIRE_DURATION, cooldown: CEASEFIRE_COOLDOWN },
  trade: { cost: TRADE_COST, duration: TRADE_DURATION, cooldown: TRADE_COOLDOWN },
  cultural: { cost: CULTURAL_COST, duration: CULTURAL_DURATION, cooldown: CULTURAL_COOLDOWN },
  'non-aggression': { cost: NON_AGGRESSION_COST, duration: NON_AGGRESSION_DURATION, cooldown: NON_AGGRESSION_COOLDOWN },
};

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** Currently active compromis agreements. Max 1 per target faction. */
let activeCompromissen: ActiveCompromis[] = [];

/** Per-type cooldown timers (count down to 0). */
const compromisCooldowns: Record<CompromisType, number> = {
  ceasefire: 0,
  trade: 0,
  cultural: 0,
  'non-aggression': 0,
};

/** Units currently persuaded by Chocolade-Overtuiging. */
let persuadedUnits: PersuadedUnit[] = [];

/** Set of enemy building EIDs currently affected by Commissie slowdown. */
const commissieAffectedBuildings = new Set<number>();

/** Original production durations saved before Commissie slowdown was applied. */
const commissieOriginalDurations = new Map<number, number>();

/** Accumulator for throttled Commissie recalculation. */
let commissieAccumulator = 0;

/** Pending damage split entries queued from combat-hit events this frame. */
const pendingDamageSplits: Array<{
  targetEid: number;
  attackerEid: number;
  damageDealt: number;
}> = [];

/** Whether the combat-hit listener has been registered. */
let listenerRegistered = false;

// ---------------------------------------------------------------------------
// Compromis cost/duration/cooldown helpers
// ---------------------------------------------------------------------------

function getCompromisCost(type: CompromisType): number {
  return COMPROMIS_CONFIGS[type].cost;
}

function getCompromisDuration(type: CompromisType): number {
  return COMPROMIS_CONFIGS[type].duration;
}

function getCompromisCooldownDuration(type: CompromisType): number {
  return COMPROMIS_CONFIGS[type].cooldown;
}

// ---------------------------------------------------------------------------
// Public API -- Compromis activation
// ---------------------------------------------------------------------------

/**
 * Attempt to activate a Compromis with a target faction.
 *
 * @returns true if successfully activated
 */
export function activateCompromis(
  world: GameWorld,
  type: CompromisType,
  targetFaction: number,
): boolean {
  // Validate: Belgen only
  if (targetFaction === FactionId.Belgen) return false;

  // Check cooldown
  if (compromisCooldowns[type] > 0) return false;

  // Check: max 1 active compromis per target faction
  if (activeCompromissen.some((c) => c.targetFaction === targetFaction)) return false;

  // Check Chocolade cost
  const cost = getCompromisCost(type);
  if (!playerState.spendTertiary(FactionId.Belgen, cost)) return false;

  // Activate — Pralines voor Iedereen passive (Chocolaterie) extends duration.
  const compromis: ActiveCompromis = {
    type,
    targetFaction,
    startTime: world.meta.elapsed,
    duration: getCompromisDuration(type) * getPralinesDurationMult(FactionId.Belgen),
  };

  activeCompromissen.push(compromis);
  compromisCooldowns[type] = getCompromisCooldownDuration(type);

  eventBus.emit('compromis-activated' as keyof import('../types/index').GameEvents, {
    type,
    targetFaction,
    duration: compromis.duration,
    cost,
  } as never);

  return true;
}

/**
 * Break a compromis unilaterally. Belgen lose 20 Chocolade as penalty.
 *
 * @returns true if a compromis was found and broken
 */
export function breakCompromis(targetFaction: number): boolean {
  const idx = activeCompromissen.findIndex((c) => c.targetFaction === targetFaction);
  if (idx === -1) return false;

  activeCompromissen.splice(idx, 1);

  // Penalty: lose 20 Chocolade (spend, but don't fail if insufficient)
  const currentChocolade = playerState.getTertiary(FactionId.Belgen);
  if (currentChocolade >= 20) {
    playerState.spendTertiary(FactionId.Belgen, 20);
  } else {
    // Can't afford full penalty -- spend whatever is available
    playerState.spendTertiary(FactionId.Belgen, currentChocolade);
  }

  eventBus.emit('compromis-broken' as keyof import('../types/index').GameEvents, {
    targetFaction,
  } as never);

  return true;
}

// ---------------------------------------------------------------------------
// Public API -- Chocolade-Overtuiging
// ---------------------------------------------------------------------------

/**
 * Persuade an enemy unit with Chocolade.
 * The unit temporarily fights for the Belgen for PERSUASION_DURATION seconds.
 *
 * @returns true if persuasion was successful
 */
export function persuadeUnit(world: GameWorld, targetEid: number): boolean {
  // Validate target exists and is a unit
  if (!hasComponent(world, targetEid, IsUnit)) return false;
  if (hasComponent(world, targetEid, IsDead)) return false;

  // Cannot persuade own units
  const targetFaction = Faction.id[targetEid];
  if (targetFaction === FactionId.Belgen) return false;

  // Cannot persuade heroes or workers
  const unitType = UnitType.id[targetEid];
  if (unitType === UnitTypeId.Hero || unitType === UnitTypeId.Worker) return false;

  // Check max persuaded units
  if (persuadedUnits.length >= PERSUASION_MAX_UNITS) return false;

  // Already persuaded?
  if (persuadedUnits.some((p) => p.entityId === targetEid)) return false;

  // Check Chocolade cost (Salon-protocol passive: per Diplomatiek Salon -10%, cap -30%).
  const persuasionCost = Math.ceil(PERSUASION_COST * getSalonProtocolCostMult(FactionId.Belgen));
  if (!playerState.spendTertiary(FactionId.Belgen, persuasionCost)) return false;

  // Switch faction
  const originalFaction = Faction.id[targetEid];
  Faction.id[targetEid] = FactionId.Belgen;

  // Pralines voor Iedereen passive: extend duration based on chocolade voorraad.
  const duration = PERSUASION_DURATION * getPralinesDurationMult(FactionId.Belgen);

  persuadedUnits.push({
    entityId: targetEid,
    originalFaction,
    returnTime: world.meta.elapsed + duration,
  });

  eventBus.emit('unit-persuaded' as keyof import('../types/index').GameEvents, {
    entityId: targetEid,
    originalFaction,
    newFaction: FactionId.Belgen,
    duration,
  } as never);

  return true;
}

// ---------------------------------------------------------------------------
// Public API -- Query helpers
// ---------------------------------------------------------------------------

/**
 * Check if a ceasefire is active between two factions.
 * Returns true if Belgen have a ceasefire with the specified faction,
 * OR if the specified faction has a ceasefire with the Belgen.
 */
export function isCeasefireActive(faction1: number, faction2: number): boolean {
  // One of them must be Belgen
  if (faction1 !== FactionId.Belgen && faction2 !== FactionId.Belgen) return false;

  const otherFaction = faction1 === FactionId.Belgen ? faction2 : faction1;

  return activeCompromissen.some(
    (c) => c.type === 'ceasefire' && c.targetFaction === otherFaction,
  );
}

/**
 * Check if a non-aggression pact prevents attacks on buildings of a faction.
 * Returns true if the targetFaction cannot attack buildings of protectedFaction.
 */
export function isNonAggressionActive(attackerFaction: number, buildingOwnerFaction: number): boolean {
  // Non-aggression pact: target faction cannot attack Belgische buildings
  // AND Belgen cannot attack target faction's buildings
  if (attackerFaction === FactionId.Belgen) {
    return activeCompromissen.some(
      (c) => c.type === 'non-aggression' && c.targetFaction === buildingOwnerFaction,
    );
  }
  if (buildingOwnerFaction === FactionId.Belgen) {
    return activeCompromissen.some(
      (c) => c.type === 'non-aggression' && c.targetFaction === attackerFaction,
    );
  }
  return false;
}

/**
 * Get the trade bonus multiplier for a faction.
 * Returns 1.0 + TRADE_GATHER_BONUS if an active trade agreement exists,
 * otherwise 1.0.
 */
export function getTradeBonus(factionId: number): number {
  if (factionId === FactionId.Belgen) {
    // Belgen benefit from any active trade agreement
    if (activeCompromissen.some((c) => c.type === 'trade')) {
      return 1.0 + TRADE_GATHER_BONUS;
    }
    return 1.0;
  }

  // Other factions benefit only if Belgen have a trade agreement targeting them
  if (activeCompromissen.some((c) => c.type === 'trade' && c.targetFaction === factionId)) {
    return 1.0 + TRADE_GATHER_BONUS;
  }
  return 1.0;
}

/**
 * Get the production slowdown multiplier for a specific building entity.
 * Returns 0.0 (no slowdown) if Commissie is not active for this building,
 * or COMMISSIE_SLOWDOWN (0.15) if it is.
 *
 * Usage in ProductionSystem: duration *= (1.0 + getProductionSlowdown(buildingEid))
 */
export function getProductionSlowdown(buildingEid: number): number {
  if (commissieAffectedBuildings.has(buildingEid)) {
    return COMMISSIE_SLOWDOWN;
  }
  return 0;
}

/**
 * Get all active compromis agreements (read-only snapshot).
 */
export function getActiveCompromissen(): ReadonlyArray<Readonly<ActiveCompromis>> {
  return activeCompromissen;
}

/**
 * Get the cooldown remaining for a specific compromis type.
 */
export function getCompromisCooldownRemaining(type: CompromisType): number {
  return Math.max(0, compromisCooldowns[type]);
}

/**
 * Get the number of currently persuaded units.
 */
export function getPersuadedUnitCount(): number {
  return persuadedUnits.length;
}

/**
 * Check if a specific compromis type is ready (off cooldown, no duplicate active).
 */
export function isCompromisReady(type: CompromisType, targetFaction: number): boolean {
  if (compromisCooldowns[type] > 0) return false;
  if (activeCompromissen.some((c) => c.targetFaction === targetFaction)) return false;
  const cost = getCompromisCost(type);
  return playerState.getTertiary(FactionId.Belgen) >= cost;
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the Diplomacy System.
 *
 * Should run in the 'faction' phase, after GezeligheidSystem and BureaucracySystem,
 * before CombatSystem so ceasefire/non-aggression checks are up to date.
 */
export function createDiplomacySystem() {
  return function diplomacySystem(world: GameWorld, dt: number): void {
    const elapsed = world.meta.elapsed;

    // Register combat-hit listener once (for damage split tracking)
    if (!listenerRegistered) {
      registerCombatHitListener(world);
      listenerRegistered = true;
    }

    // 1. Tick compromis cooldowns
    tickCooldowns(dt);

    // 2. Tick active compromissen -- expire when duration exceeded
    tickActiveCompromissen(world, elapsed);

    // 3. Process persuaded units -- return to original faction after duration
    processPersuadedUnits(world, elapsed);

    // 4. Commissie effect -- slow enemy production near Belgische buildings
    commissieAccumulator += dt;
    if (commissieAccumulator >= COMMISSIE_UPDATE_INTERVAL) {
      commissieAccumulator -= COMMISSIE_UPDATE_INTERVAL;
      updateCommissieEffect(world);
    }

    // 5. Damage split -- process pending splits from combat events
    processDamageSplits(world);
  };
}

// ---------------------------------------------------------------------------
// Cooldown management
// ---------------------------------------------------------------------------

function tickCooldowns(dt: number): void {
  const types: CompromisType[] = ['ceasefire', 'trade', 'cultural', 'non-aggression'];
  for (const type of types) {
    if (compromisCooldowns[type] > 0) {
      compromisCooldowns[type] = Math.max(0, compromisCooldowns[type] - dt);
    }
  }
}

// ---------------------------------------------------------------------------
// Active compromissen tick
// ---------------------------------------------------------------------------

function tickActiveCompromissen(world: GameWorld, elapsed: number): void {
  const toRemove: number[] = [];

  for (let i = activeCompromissen.length - 1; i >= 0; i--) {
    const c = activeCompromissen[i];
    const timeActive = elapsed - c.startTime;

    if (timeActive >= c.duration) {
      toRemove.push(i);

      eventBus.emit('compromis-expired' as keyof import('../types/index').GameEvents, {
        type: c.type,
        targetFaction: c.targetFaction,
      } as never);
    }
  }

  // Remove expired (iterate in reverse so indices stay valid)
  for (const idx of toRemove) {
    activeCompromissen.splice(idx, 1);
  }
}

// ---------------------------------------------------------------------------
// Persuaded units processing
// ---------------------------------------------------------------------------

function processPersuadedUnits(world: GameWorld, elapsed: number): void {
  const toReturn: number[] = [];

  for (let i = persuadedUnits.length - 1; i >= 0; i--) {
    const p = persuadedUnits[i];

    // Check if unit is dead or removed
    if (!hasComponent(world, p.entityId, IsUnit) || hasComponent(world, p.entityId, IsDead)) {
      toReturn.push(i);
      continue;
    }

    // Check if duration expired
    if (elapsed >= p.returnTime) {
      // Return to original faction
      Faction.id[p.entityId] = p.originalFaction;

      eventBus.emit('unit-returned' as keyof import('../types/index').GameEvents, {
        entityId: p.entityId,
        originalFaction: p.originalFaction,
      } as never);

      toReturn.push(i);
    }
  }

  // Remove processed (iterate in reverse)
  for (const idx of toReturn) {
    persuadedUnits.splice(idx, 1);
  }
}

// ---------------------------------------------------------------------------
// Commissie Oprichten -- production slowdown aura
// ---------------------------------------------------------------------------

function updateCommissieEffect(world: GameWorld): void {
  // Count Belgische completed buildings
  const allBuildings = query(world, [Building, Position, IsBuilding]);
  let belgenBuildingCount = 0;
  const belgenBuildingPositions: Array<{ x: number; z: number }> = [];

  for (const bEid of allBuildings) {
    if (Faction.id[bEid] !== FactionId.Belgen) continue;
    if (Building.complete[bEid] !== 1) continue;
    if (hasComponent(world, bEid, IsDead)) continue;

    belgenBuildingCount++;
    belgenBuildingPositions.push({
      x: Position.x[bEid],
      z: Position.z[bEid],
    });
  }

  // Restore previously slowed buildings
  restoreCommissieBuildings(world);

  // Need 3+ Belgische buildings for Commissie effect to activate
  if (belgenBuildingCount < COMMISSIE_BUILDING_THRESHOLD) return;

  // Find enemy production buildings within radius of ANY Belgische building
  for (const bEid of allBuildings) {
    if (Faction.id[bEid] === FactionId.Belgen) continue;
    if (Building.complete[bEid] !== 1) continue;
    if (hasComponent(world, bEid, IsDead)) continue;
    // Only affect buildings that can produce
    if (Production.duration[bEid] <= 0) continue;

    // Check if within radius of any Belgische building
    const bx = Position.x[bEid];
    const bz = Position.z[bEid];

    for (const belPos of belgenBuildingPositions) {
      const dx = bx - belPos.x;
      const dz = bz - belPos.z;
      const distSq = dx * dx + dz * dz;

      if (distSq <= COMMISSIE_RADIUS_SQ) {
        // Apply slowdown (does NOT stack)
        if (!commissieAffectedBuildings.has(bEid)) {
          commissieAffectedBuildings.add(bEid);
          commissieOriginalDurations.set(bEid, Production.duration[bEid]);
          // Slow production by increasing duration
          Production.duration[bEid] *= (1.0 + COMMISSIE_SLOWDOWN);
        }
        break; // Don't double-apply from multiple Belgische buildings
      }
    }
  }
}

function restoreCommissieBuildings(world: GameWorld): void {
  for (const bEid of commissieAffectedBuildings) {
    // Only restore if building still exists and is alive
    if (hasComponent(world, bEid, IsBuilding) && !hasComponent(world, bEid, IsDead)) {
      const originalDuration = commissieOriginalDurations.get(bEid);
      if (originalDuration !== undefined) {
        Production.duration[bEid] = originalDuration;
      }
    }
  }
  commissieAffectedBuildings.clear();
  commissieOriginalDurations.clear();
}

// ---------------------------------------------------------------------------
// Damage Split -- passive for Belgische units
// ---------------------------------------------------------------------------

/**
 * Register a listener on the 'combat-hit' event to detect when Belgische
 * units take large hits and queue damage splits.
 */
function registerCombatHitListener(_world: GameWorld): void {
  eventBus.on('combat-hit', (event: CombatHitEvent) => {
    const targetEid = event.targetEid;

    // Only applies to Belgische units
    if (Faction.id[targetEid] !== FactionId.Belgen) return;

    // Calculate the damage that was dealt (reconstruct from attack stats)
    const attackerEid = event.attackerEid;
    const attackerDamage = Attack.damage[attackerEid];
    const targetArmor = Armor.value[targetEid] * ARMOR_FACTOR;
    const rawDamage = attackerDamage - targetArmor;
    const effectiveDamage = Math.max(MIN_DAMAGE, rawDamage);

    // Check threshold
    if (effectiveDamage > DAMAGE_SPLIT_THRESHOLD) {
      pendingDamageSplits.push({
        targetEid,
        attackerEid,
        damageDealt: effectiveDamage,
      });
    }
  });
}

function processDamageSplits(world: GameWorld): void {
  if (pendingDamageSplits.length === 0) return;

  const allUnits = query(world, [Position, Health, Faction, IsUnit]);

  for (const split of pendingDamageSplits) {
    const { targetEid, damageDealt } = split;

    // Skip if the Belgische unit is already dead
    if (!hasComponent(world, targetEid, IsUnit)) continue;
    if (hasComponent(world, targetEid, IsDead)) continue;

    // Calculate excess damage above threshold
    const excessDamage = damageDealt - DAMAGE_SPLIT_THRESHOLD;
    const splitDamage = excessDamage * DAMAGE_SPLIT_RATIO;

    if (splitDamage <= 0) continue;

    // Find closest enemy unit within radius (not the attacker)
    const tx = Position.x[targetEid];
    const tz = Position.z[targetEid];

    const enemiesInRange: Array<{ eid: number; distSq: number }> = [];

    for (const eid of allUnits) {
      if (eid === targetEid) continue;
      // Must be an enemy of the Belgen
      if (Faction.id[eid] === FactionId.Belgen) continue;
      if (hasComponent(world, eid, IsDead)) continue;

      const dx = Position.x[eid] - tx;
      const dz = Position.z[eid] - tz;
      const distSq = dx * dx + dz * dz;

      if (distSq <= DAMAGE_SPLIT_RADIUS_SQ) {
        enemiesInRange.push({ eid, distSq });
      }
    }

    // Need at least 1 enemy in range
    if (enemiesInRange.length === 0) continue;

    // Distribute split damage evenly across all enemies in range
    const damagePerEnemy = splitDamage / enemiesInRange.length;

    for (const enemy of enemiesInRange) {
      Health.current[enemy.eid] -= damagePerEnemy;

      // Note: death check is handled by DeathSystem which runs after us
    }

    // Heal the Belgische unit for the split amount (damage was redirected)
    Health.current[targetEid] += splitDamage;
    // Cap at max HP
    Health.current[targetEid] = Math.min(
      Health.current[targetEid],
      Health.max[targetEid],
    );

    eventBus.emit('damage-split' as keyof import('../types/index').GameEvents, {
      belgianUnitEid: targetEid,
      splitDamage,
      affectedEnemies: enemiesInRange.map((e) => e.eid),
      x: tx,
      z: tz,
    } as never);
  }

  // Clear pending
  pendingDamageSplits.length = 0;
}

// ---------------------------------------------------------------------------
// Reset (for new game)
// ---------------------------------------------------------------------------

/**
 * Reset all diplomacy system state for a new game.
 */
export function resetDiplomacy(): void {
  activeCompromissen = [];
  compromisCooldowns.ceasefire = 0;
  compromisCooldowns.trade = 0;
  compromisCooldowns.cultural = 0;
  compromisCooldowns['non-aggression'] = 0;
  persuadedUnits = [];
  commissieAffectedBuildings.clear();
  commissieOriginalDurations.clear();
  commissieAccumulator = 0;
  pendingDamageSplits.length = 0;
  listenerRegistered = false;
}
