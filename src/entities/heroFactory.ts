/**
 * Reign of Brabant -- Hero Factory
 *
 * Creates hero entities with all required ECS components.
 * Heroes are unique units: max 1 per type per player.
 * They have the IsHero tag, Hero + HeroAbilities components,
 * and cost 5 population.
 */

import { addEntity, addComponent } from 'bitecs';
import type { World } from 'bitecs';

import {
  FactionId,
  HeroTypeId,
  UnitTypeId,
  UnitAIState,
  ArmorType,
  NO_ENTITY,
  HERO_POPULATION_COST,
} from '../types/index';

import {
  Position,
  Rotation,
  Velocity,
  Movement,
  Health,
  Attack,
  Armor,
  Faction,
  UnitType,
  UnitAI,
  Visibility,
  PopulationCost,
  RenderRef,
  Hero,
  HeroAbilities,
  GezeligheidBonus,
  SummonTimer,
} from '../ecs/components';

import {
  IsUnit,
  IsHero,
  IsSummon,
} from '../ecs/tags';

import { HERO_ARCHETYPES } from './heroArchetypes';

// ---------------------------------------------------------------------------
// Tracking: which heroes exist per faction (max 1 per type)
// ---------------------------------------------------------------------------

/** Maps factionId -> Set of heroTypeIds currently alive (or reviving). */
const activeHeroes = new Map<number, Set<number>>();

/**
 * Check if a hero of this type already exists for the faction.
 */
export function isHeroActive(factionId: FactionId, heroTypeId: HeroTypeId): boolean {
  const set = activeHeroes.get(factionId);
  return set ? set.has(heroTypeId) : false;
}

/**
 * Mark a hero as active.
 */
export function markHeroActive(factionId: FactionId, heroTypeId: HeroTypeId): void {
  if (!activeHeroes.has(factionId)) {
    activeHeroes.set(factionId, new Set());
  }
  activeHeroes.get(factionId)!.add(heroTypeId);
}

/**
 * Mark a hero as inactive (permanently dead / removed -- not used in normal flow
 * because heroes revive, but useful for reset).
 */
export function markHeroInactive(factionId: FactionId, heroTypeId: HeroTypeId): void {
  const set = activeHeroes.get(factionId);
  if (set) set.delete(heroTypeId);
}

/**
 * Reset all hero tracking (on new game).
 */
export function resetHeroTracking(): void {
  activeHeroes.clear();
}

// ---------------------------------------------------------------------------
// Hero creation
// ---------------------------------------------------------------------------

/**
 * Create a hero entity.
 * Returns the entity ID, or -1 if the hero is already active for this faction.
 */
export function createHero(
  world: World,
  heroTypeId: HeroTypeId,
  factionId: FactionId,
  x: number,
  z: number,
  townHallX: number,
  townHallZ: number,
): number {
  // Enforce uniqueness
  if (isHeroActive(factionId, heroTypeId)) {
    return -1;
  }

  const arch = HERO_ARCHETYPES[heroTypeId];
  if (!arch) throw new Error(`Unknown HeroTypeId: ${heroTypeId}`);

  const eid = addEntity(world);

  // ----- Core unit components -----
  addComponent(world, eid, Position);
  addComponent(world, eid, Rotation);
  addComponent(world, eid, Velocity);
  addComponent(world, eid, Movement);
  addComponent(world, eid, Health);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitType);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Visibility);
  addComponent(world, eid, PopulationCost);
  addComponent(world, eid, RenderRef);
  addComponent(world, eid, IsUnit);

  // ----- Hero-specific components -----
  addComponent(world, eid, Hero);
  addComponent(world, eid, HeroAbilities);
  addComponent(world, eid, IsHero);
  addComponent(world, eid, GezeligheidBonus);

  // Position
  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;

  // Rotation
  Rotation.y[eid] = 0;

  // Velocity
  Velocity.x[eid] = 0;
  Velocity.z[eid] = 0;

  // Movement
  Movement.targetX[eid] = x;
  Movement.targetZ[eid] = z;
  Movement.speed[eid] = arch.speed;
  Movement.hasTarget[eid] = 0;

  // Health -- heroes are VISIBLY stronger
  Health.current[eid] = arch.hp;
  Health.max[eid] = arch.hp;

  // Attack
  Attack.damage[eid] = arch.attack;
  Attack.speed[eid] = arch.attackSpeed;
  Attack.range[eid] = arch.range;
  Attack.cooldown[eid] = arch.attackSpeed;
  Attack.timer[eid] = 0;

  // Armor
  Armor.value[eid] = arch.armor;
  Armor.type[eid] = arch.armorType;

  // Faction & Type
  Faction.id[eid] = factionId;
  // Heroes use Infantry UnitTypeId for rendering; the Hero component
  // carries the actual heroTypeId for logic.
  UnitType.id[eid] = UnitTypeId.Infantry;

  // AI state: idle
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  UnitAI.originX[eid] = x;
  UnitAI.originZ[eid] = z;

  // Visibility -- heroes see far
  Visibility.range[eid] = arch.sightRange;

  // Population
  PopulationCost.cost[eid] = HERO_POPULATION_COST;

  // RenderRef
  RenderRef.meshId[eid] = eid;

  // ----- Hero data -----
  Hero.heroTypeId[eid] = heroTypeId;
  Hero.reviveTimer[eid] = 0;
  Hero.reviveX[eid] = townHallX;
  Hero.reviveZ[eid] = townHallZ;

  // ----- Ability cooldowns -----
  const abilities = arch.abilities;
  HeroAbilities.ability0Id[eid] = 0;
  HeroAbilities.ability0Cooldown[eid] = 0;
  HeroAbilities.ability0MaxCd[eid] = abilities[0]?.cooldown ?? 0;
  HeroAbilities.ability1Id[eid] = 1;
  HeroAbilities.ability1Cooldown[eid] = 0;
  HeroAbilities.ability1MaxCd[eid] = abilities[1]?.cooldown ?? 0;
  HeroAbilities.ability2Id[eid] = 2;
  HeroAbilities.ability2Cooldown[eid] = 0;
  HeroAbilities.ability2MaxCd[eid] = abilities[2]?.cooldown ?? 0;

  // ----- Gezelligheid bonus init (for Brabanders heroes) -----
  GezeligheidBonus.nearbyCount[eid] = 0;
  GezeligheidBonus.attackMult[eid] = 1.0;
  GezeligheidBonus.speedMult[eid] = 1.0;
  GezeligheidBonus.armorMult[eid] = 1.0;
  GezeligheidBonus.passiveHeal[eid] = 0;
  GezeligheidBonus.damageReduction[eid] = 0;

  // Track this hero
  markHeroActive(factionId, heroTypeId);

  return eid;
}

/**
 * Create a temporary militia unit (for Boer van Brabant's Opstand ability).
 * Militia have short lifespan and auto-die.
 */
export function createMilitia(
  world: World,
  factionId: FactionId,
  x: number,
  z: number,
  lifespan: number,
): number {
  const eid = addEntity(world);

  addComponent(world, eid, Position);
  addComponent(world, eid, Rotation);
  addComponent(world, eid, Velocity);
  addComponent(world, eid, Movement);
  addComponent(world, eid, Health);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitType);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Visibility);
  addComponent(world, eid, PopulationCost);
  addComponent(world, eid, RenderRef);
  addComponent(world, eid, IsUnit);
  addComponent(world, eid, SummonTimer);
  addComponent(world, eid, IsSummon);

  Position.x[eid] = x;
  Position.y[eid] = 0;
  Position.z[eid] = z;
  Rotation.y[eid] = Math.random() * Math.PI * 2;
  Velocity.x[eid] = 0;
  Velocity.z[eid] = 0;

  Movement.targetX[eid] = x;
  Movement.targetZ[eid] = z;
  Movement.speed[eid] = 4.0;
  Movement.hasTarget[eid] = 0;

  Health.current[eid] = 60;
  Health.max[eid] = 60;

  Attack.damage[eid] = 8;
  Attack.speed[eid] = 1.5;
  Attack.range[eid] = 0;
  Attack.cooldown[eid] = 1.5;
  Attack.timer[eid] = 0;

  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Light;

  Faction.id[eid] = factionId;
  UnitType.id[eid] = UnitTypeId.Worker; // militia look like workers

  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  UnitAI.originX[eid] = x;
  UnitAI.originZ[eid] = z;

  Visibility.range[eid] = 6;
  PopulationCost.cost[eid] = 0; // summons don't cost pop
  RenderRef.meshId[eid] = eid;

  SummonTimer.remaining[eid] = lifespan;

  return eid;
}
