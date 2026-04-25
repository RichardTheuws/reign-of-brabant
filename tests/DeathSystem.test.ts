/**
 * DeathSystem.test.ts -- Locks F4-stap 21: unit death + cleanup chain.
 *
 * Audit-context: full-playthrough audit Fase 4 stap 21.
 *
 * Contract:
 *  - First tick after IsDead tag: DeathTimer added, elapsed=0, Health clamped to 0.
 *  - Subsequent ticks: elapsed += dt.
 *  - elapsed >= DEATH_TIMER (2.0s): unit-died/building-destroyed event emitted,
 *    population deducted (workers cost 1, heroes cost PopulationCost.cost),
 *    military unit count decremented (non-worker units only),
 *    entity removed via bitecs removeEntity.
 *  - CombatSystem.processAttacking sees IsDead via clearAttackAndSeekNew →
 *    attackers stop targeting dead entities.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, hasComponent, entityExists } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Movement, Attack, Armor, Health, UnitType,
  Building, PopulationCost, DeathTimer,
} from '../src/ecs/components';
import { IsUnit, IsBuilding, IsDead } from '../src/ecs/tags';
import { createDeathSystem } from '../src/systems/DeathSystem';
import { createCombatSystem } from '../src/systems/CombatSystem';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import {
  FactionId, UnitAIState, NO_ENTITY, AttackType, ArmorType,
  UnitTypeId, BuildingTypeId, DEATH_TIMER,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnUnit(
  world: World,
  faction = FactionId.Brabanders,
  unitType = UnitTypeId.Worker,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Health);
  addComponent(world, eid, UnitType);
  addComponent(world, eid, IsUnit);
  Faction.id[eid] = faction;
  UnitType.id[eid] = unitType;
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  return eid;
}

function spawnBuildingEntity(
  world: World,
  faction = FactionId.Randstad,
  typeId = BuildingTypeId.TownHall,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Faction.id[eid] = faction;
  Building.typeId[eid] = typeId;
  Health.current[eid] = 1500;
  Health.max[eid] = 1500;
  return eid;
}

const death = createDeathSystem();
const tickDeath = (w: World, dt = 0.5) => death(w, dt);

beforeEach(() => {
  playerState.reset();
  eventBus.clear();
});

// ---------------------------------------------------------------------------
// First-tick init
// ---------------------------------------------------------------------------

describe('F4-stap 21 — DeathSystem first-tick init', () => {
  it('adds DeathTimer with elapsed=0 on first tick after IsDead', () => {
    const world = replaceWorld();
    const u = spawnUnit(world);
    addComponent(world, u, IsDead);

    expect(hasComponent(world, u, DeathTimer)).toBe(false);
    tickDeath(world, 0.016);

    expect(hasComponent(world, u, DeathTimer)).toBe(true);
    expect(DeathTimer.elapsed[u]).toBe(0);
  });

  it('clamps Health.current to 0 on first tick (sanity guard)', () => {
    const world = replaceWorld();
    const u = spawnUnit(world);
    Health.current[u] = 7;            // somehow > 0 when tagged
    addComponent(world, u, IsDead);

    tickDeath(world, 0.016);

    expect(Health.current[u]).toBe(0);
  });

  it('does not emit any event on first init tick', () => {
    const world = replaceWorld();
    const u = spawnUnit(world);
    let emitted = 0;
    eventBus.on('unit-died', () => { emitted += 1; });
    addComponent(world, u, IsDead);

    tickDeath(world, 0.016);

    expect(emitted).toBe(0);
    expect(entityExists(world, u)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Timer ticking & cleanup
// ---------------------------------------------------------------------------

describe('F4-stap 21 — DeathSystem tick & cleanup', () => {
  it('does not remove entity before DEATH_TIMER elapses', () => {
    const world = replaceWorld();
    const u = spawnUnit(world);
    addComponent(world, u, IsDead);
    tickDeath(world, 0.016); // init
    tickDeath(world, DEATH_TIMER - 0.5); // not enough yet

    expect(entityExists(world, u)).toBe(true);
    expect(DeathTimer.elapsed[u]).toBeCloseTo(DEATH_TIMER - 0.5, 4);
  });

  it('removes entity after DEATH_TIMER elapses', () => {
    const world = replaceWorld();
    const u = spawnUnit(world);
    addComponent(world, u, IsDead);
    tickDeath(world, 0.016);          // init
    tickDeath(world, DEATH_TIMER + 0.1); // crosses threshold

    expect(entityExists(world, u)).toBe(false);
  });

  it('emits unit-died event with correct payload', () => {
    const world = replaceWorld();
    const u = spawnUnit(world, FactionId.Brabanders, UnitTypeId.Worker);
    const events: any[] = [];
    eventBus.on('unit-died', (e: any) => { events.push(e); });
    addComponent(world, u, IsDead);

    tickDeath(world, 0.016);
    tickDeath(world, DEATH_TIMER + 0.1);

    expect(events).toHaveLength(1);
    expect(events[0].entityId).toBe(u);
    expect(events[0].factionId).toBe(FactionId.Brabanders);
    expect(events[0].unitTypeId).toBe(UnitTypeId.Worker);
  });

  it('emits building-destroyed event for buildings (not unit-died)', () => {
    const world = replaceWorld();
    const b = spawnBuildingEntity(world, FactionId.Randstad, BuildingTypeId.TownHall);
    const unitEvents: any[] = [];
    const bldgEvents: any[] = [];
    eventBus.on('unit-died', (e: any) => { unitEvents.push(e); });
    eventBus.on('building-destroyed', (e: any) => { bldgEvents.push(e); });
    addComponent(world, b, IsDead);

    tickDeath(world, 0.016);
    tickDeath(world, DEATH_TIMER + 0.1);

    expect(unitEvents).toHaveLength(0);
    expect(bldgEvents).toHaveLength(1);
    expect(bldgEvents[0].entityId).toBe(b);
    expect(bldgEvents[0].buildingTypeId).toBe(BuildingTypeId.TownHall);
    expect(entityExists(world, b)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Population & military unit accounting
// ---------------------------------------------------------------------------

describe('F4-stap 21 — population & military upkeep accounting', () => {
  it('worker death decrements population by 1, but NOT military', () => {
    const world = replaceWorld();
    const f = FactionId.Brabanders;
    playerState.addPopulation(f, 5);
    const popBefore = playerState.getPopulation(f);
    const milBefore = playerState.getMilitaryCount(f);

    const u = spawnUnit(world, f, UnitTypeId.Worker);
    addComponent(world, u, IsDead);
    tickDeath(world, 0.016);
    tickDeath(world, DEATH_TIMER + 0.1);

    expect(playerState.getPopulation(f)).toBe(popBefore - 1);
    expect(playerState.getMilitaryCount(f)).toBe(milBefore); // unchanged
  });

  it('non-worker unit death decrements both population AND military', () => {
    const world = replaceWorld();
    const f = FactionId.Brabanders;
    playerState.addPopulation(f, 5);
    playerState.addMilitaryUnit(f);
    const popBefore = playerState.getPopulation(f);
    const milBefore = playerState.getMilitaryCount(f);

    const u = spawnUnit(world, f, UnitTypeId.Infantry);
    addComponent(world, u, IsDead);
    tickDeath(world, 0.016);
    tickDeath(world, DEATH_TIMER + 0.1);

    expect(playerState.getPopulation(f)).toBe(popBefore - 1);
    expect(playerState.getMilitaryCount(f)).toBe(milBefore - 1);
  });

  it('hero death uses PopulationCost.cost when present', () => {
    const world = replaceWorld();
    const f = FactionId.Brabanders;
    playerState.addPopulation(f, 5);
    const popBefore = playerState.getPopulation(f);

    const u = spawnUnit(world, f, UnitTypeId.Hero);
    addComponent(world, u, PopulationCost);
    PopulationCost.cost[u] = 3;
    addComponent(world, u, IsDead);
    tickDeath(world, 0.016);
    tickDeath(world, DEATH_TIMER + 0.1);

    expect(playerState.getPopulation(f)).toBe(popBefore - 3);
  });
});

// ---------------------------------------------------------------------------
// CombatSystem ↔ DeathSystem interaction
// ---------------------------------------------------------------------------

describe('F4-stap 21 — CombatSystem stops attacking dead targets', () => {
  it('processAttacking clears attack on IsDead-tagged target', () => {
    const world = replaceWorld();
    const attacker = addEntity(world);
    [Position, Faction, Movement, UnitAI, Attack, Armor, Health, IsUnit].forEach((c) =>
      addComponent(world, attacker, c),
    );
    Position.x[attacker] = 0; Position.z[attacker] = 0;
    Faction.id[attacker] = FactionId.Brabanders;
    Attack.damage[attacker] = 10; Attack.range[attacker] = 5;
    Attack.speed[attacker] = 1.0; Attack.cooldown[attacker] = 1.0;
    Attack.timer[attacker] = 0;
    Attack.attackType[attacker] = AttackType.Melee;
    Attack.siegeBonus[attacker] = 1.0;
    Health.current[attacker] = 100; Health.max[attacker] = 100;
    Armor.value[attacker] = 0; Armor.type[attacker] = ArmorType.Light;
    UnitAI.state[attacker] = UnitAIState.Attacking;
    Movement.hasTarget[attacker] = 0;

    const target = addEntity(world);
    [Position, Faction, UnitAI, Health, Armor, IsUnit].forEach((c) =>
      addComponent(world, target, c),
    );
    Position.x[target] = 1; Position.z[target] = 0;
    Faction.id[target] = FactionId.Randstad;
    Health.current[target] = 50; Health.max[target] = 50;
    Armor.value[target] = 0; Armor.type[target] = ArmorType.Light;
    addComponent(world, target, IsDead);
    UnitAI.targetEid[attacker] = target;

    const combat = createCombatSystem();
    combat(world, 0.016);

    // Attacker should clear the dead target (clearAttackAndSeekNew)
    expect(UnitAI.state[attacker]).toBe(UnitAIState.Idle);
    expect(UnitAI.targetEid[attacker]).toBe(NO_ENTITY);
  });
});
