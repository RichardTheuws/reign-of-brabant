/**
 * Reign of Brabant -- Population System
 *
 * Owns population *capacity* granted by buildings.
 *
 * Contract: a building contributes its `populationProvided` (TownHall and
 * Housing; every other type 0) to its owner's max population exactly while it
 * is alive AND complete. The grant happens on completion (BuildSystem calls
 * syncBuildingPopulationCap() before emitting 'building-placed'; Game.ts does
 * the same for pre-placed / AI-instant buildings) and is removed on
 * destruction only if it had been granted. The per-frame sweep reconciles any
 * other path (e.g. a mission building flipped to complete=0 after spawn).
 *
 * The granted amount per eid is tracked module-level so it can be cleared
 * between matches: the pipeline (and thus this system) outlives world resets,
 * and bitECS recycles eids.
 */

import { query, hasComponent, entityExists } from 'bitecs';
import { Building, Faction, PopulationCost } from '../ecs/components';
import { IsBuilding, IsDead, IsUnit, IsHero } from '../ecs/tags';
import { BUILDING_ARCHETYPES } from '../entities/archetypes';
import { playerState } from '../core/PlayerState';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

/** eid -> population capacity currently granted by that building. */
const granted = new Map<number, number>();

/** Clear the granted-cap bookkeeping (on new game / mission, after the world reset). */
export function resetPopulationSystem(): void {
  granted.clear();
}

/** Population capacity a building type provides (0 for non-housing types). */
export function getBuildingPopulationProvided(typeId: number): number {
  const archetype = typeId < BUILDING_ARCHETYPES.length ? BUILDING_ARCHETYPES[typeId] : undefined;
  return archetype?.populationProvided ?? 0;
}

/** Population capacity currently granted by this building eid (0 if none). */
export function getGrantedPopulationCap(eid: number): number {
  return granted.get(eid) ?? 0;
}

/**
 * Reconcile one building's cap grant with its state: grant when alive and
 * complete, revoke when dead / incomplete / gone. Idempotent.
 * Revocation goes to the current owner (ownership transfers move the cap).
 */
export function syncBuildingPopulationCap(world: GameWorld, eid: number): void {
  const isBuilding = entityExists(world, eid) && hasComponent(world, eid, IsBuilding);
  const want = isBuilding && !hasComponent(world, eid, IsDead) && Building.complete[eid] === 1
    ? getBuildingPopulationProvided(Building.typeId[eid])
    : 0;
  const have = granted.get(eid) ?? 0;
  if (want === have) return;

  const factionId = Faction.id[eid];
  if (want > have) playerState.addPopulationCapacity(factionId, want - have);
  else playerState.removePopulationCapacity(factionId, have - want);

  if (want > 0) granted.set(eid, want);
  else granted.delete(eid);
}

/**
 * Campaign start compensation. Mission layouts were balanced against the old
 * rules: every pre-placed building granted `populationProvided ?? 5` (also
 * when incomplete) and every pre-placed unit cost 1. Under the current rules
 * (cap only from complete TownHall/Housing, units cost their real population)
 * several missions would start over the cap. This grants each faction a flat
 * capacity bonus so its free room at mission start equals the old free room.
 * The bonus is faction-level (not tied to a building) and is cleared with
 * PlayerState.reset() on the next match. Never negative.
 *
 * Call once, right after the mission's buildings and units are spawned and
 * before heroes (heroes cost HERO_POPULATION_COST under both rules).
 * Returns the bonus granted per faction id.
 */
export function grantMissionStartingCapBonus(world: GameWorld): Map<number, number> {
  const delta = new Map<number, number>();
  const bump = (f: number, n: number) => delta.set(f, (delta.get(f) ?? 0) + n);

  for (const eid of query(world, [Building, Faction, IsBuilding])) {
    if (hasComponent(world, eid, IsDead)) continue;
    syncBuildingPopulationCap(world, eid); // complete may have been flipped after spawn
    const typeId = Building.typeId[eid];
    const archetype = typeId < BUILDING_ARCHETYPES.length ? BUILDING_ARCHETYPES[typeId] : undefined;
    const legacy = archetype?.populationProvided ?? 5;
    bump(Faction.id[eid], legacy - getGrantedPopulationCap(eid));
  }
  for (const eid of query(world, [IsUnit, Faction])) {
    if (hasComponent(world, eid, IsDead) || hasComponent(world, eid, IsHero)) continue;
    const cost = hasComponent(world, eid, PopulationCost) ? PopulationCost.cost[eid] : 1;
    bump(Faction.id[eid], cost - 1);
  }

  const bonus = new Map<number, number>();
  for (const [f, n] of delta) {
    if (n <= 0) continue;
    playerState.addPopulationCapacity(f, n);
    bonus.set(f, n);
  }
  return bonus;
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the Population system.
 * Returns a SystemFn that keeps every building's cap grant in sync with its
 * alive/complete state.
 */
export function createPopulationSystem(): SystemFn {
  return function populationSystem(world: GameWorld, _dt: number): void {
    for (const eid of query(world, [Building, Faction, IsBuilding])) {
      syncBuildingPopulationCap(world, eid);
    }

    // Buildings removed without passing through IsDead: drop their grant.
    for (const eid of granted.keys()) {
      if (!entityExists(world, eid) || !hasComponent(world, eid, IsBuilding)) {
        syncBuildingPopulationCap(world, eid);
      }
    }
  };
}
