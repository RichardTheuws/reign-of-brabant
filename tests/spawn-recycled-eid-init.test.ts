/**
 * spawn-recycled-eid-init.test.ts -- every spawn path must write every field.
 *
 * bitECS recycles eids immediately and does NOT clear component data. The
 * ProductionSystem template path (Worker/Infantry/Ranged), Game.createUnitEntity
 * (pre-placed units) and spawnBuildingEntity (pre-placed / runtime buildings)
 * only wrote a subset of fields, so a unit spawned on the eid of a dead
 * Frituurmeester inherited its splashRadius / siegeBonus / attackType, and
 * buildings had no Armor component at all (Armor.type read stale data, the
 * 2x Siege-vs-Building matrix bonus never applied).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, removeEntity, hasComponent, query } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Movement, Attack, Armor, Health, Production,
  PopulationCost, Gatherer, Building,
} from '../src/ecs/components';
import { IsUnit } from '../src/ecs/tags';
import { createProductionSystem } from '../src/systems/ProductionSystem';
import { createCombatSystem } from '../src/systems/CombatSystem';
import { spawnBuildingEntity } from '../src/entities/buildingSpawn';
import { createUnit, spawnBasicUnit } from '../src/entities/factories';
import { getFactionUnitArchetype } from '../src/data/factionData';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import {
  FactionId, BuildingTypeId, UnitTypeId, AttackType, ArmorType, UnitAIState, NO_ENTITY,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;
const F = FactionId.Brabanders;

/** Create a siege unit, give it stale-looking extra data, and remove it. */
function killSiege(world: World): number {
  const eid = createUnit(world, UnitTypeId.Siege, F, 5, 5);
  expect(Attack.splashRadius[eid]).toBeGreaterThan(0);
  expect(Attack.siegeBonus[eid]).toBeGreaterThan(1);
  Gatherer.gatherSpeedMult[eid] = 0;
  removeEntity(world, eid);
  return eid;
}

beforeEach(() => {
  playerState.reset();
  eventBus.clear();
});

describe('recycled eid -- unit spawn paths reset combat stats', () => {
  it('ProductionSystem Infantry on the eid of a dead siege unit has no splash / siege bonus', () => {
    const world = replaceWorld();
    playerState.addPopulationCapacity(F, 50);
    const barracks = spawnBuildingEntity(world, BuildingTypeId.Barracks, F, 0, 0);
    const deadEid = killSiege(world);

    Production.unitType[barracks] = UnitTypeId.Infantry;
    Production.progress[barracks] = 0;
    Production.duration[barracks] = 1;
    createProductionSystem()(world, 1.01);

    const units = query(world, [IsUnit]);
    expect(units.length).toBe(1);
    const eid = units[0];
    expect(eid).toBe(deadEid); // precondition: eid recycled

    const arch = getFactionUnitArchetype(F, UnitTypeId.Infantry);
    expect(Attack.splashRadius[eid]).toBe(0);
    expect(Attack.siegeBonus[eid]).toBe(1);
    // Same derivation as the archetype factory (range > 0 -> Ranged); the
    // point here is that it is not the dead siege unit's AttackType.Siege.
    expect(Attack.attackType[eid]).toBe(arch.attackType ?? (arch.range > 0 ? AttackType.Ranged : AttackType.Melee));
    expect(Attack.attackType[eid]).not.toBe(AttackType.Siege);
    expect(Attack.cooldown[eid]).toBeCloseTo(Attack.speed[eid], 5);
    expect(Armor.type[eid]).toBe(arch.armorType);
    expect(hasComponent(world, eid, PopulationCost)).toBe(true);
    expect(PopulationCost.cost[eid]).toBe(arch.population);
    expect(UnitAI.originX[eid]).toBeCloseTo(Position.x[eid], 5);
  });

  it('ProductionSystem Worker on a recycled eid gets a fully initialized Gatherer', () => {
    const world = replaceWorld();
    const th = spawnBuildingEntity(world, BuildingTypeId.TownHall, F, 0, 0);
    const deadEid = killSiege(world);
    Production.unitType[th] = UnitTypeId.Worker;
    Production.progress[th] = 0;
    Production.duration[th] = 1;
    createProductionSystem()(world, 1.01);
    const eid = query(world, [IsUnit])[0];
    expect(eid).toBe(deadEid);
    expect(Attack.splashRadius[eid]).toBe(0);
    expect(Attack.attackType[eid]).not.toBe(AttackType.Siege);
    expect(Gatherer.gatherSpeedMult[eid]).toBe(1);
    expect(Gatherer.carryBonus[eid]).toBe(0);
  });

  it('spawnBasicUnit (Game.createUnitEntity path) writes typing + population fields', () => {
    const world = replaceWorld();
    const deadEid = killSiege(world);
    const arch = getFactionUnitArchetype(F, UnitTypeId.Ranged);
    const eid = spawnBasicUnit(world, UnitTypeId.Ranged, F, 3, 0, 4, {
      hp: arch.hp, attack: arch.attack, attackSpeed: arch.attackSpeed, armor: arch.armor,
      speed: arch.speed, range: arch.range, sightRange: arch.sightRange, carryCapacity: 0,
    });
    expect(eid).toBe(deadEid);
    expect(Attack.splashRadius[eid]).toBe(0);
    expect(Attack.siegeBonus[eid]).toBe(1);
    expect(Attack.attackType[eid]).toBe(arch.attackType ?? AttackType.Ranged);
    expect(Armor.type[eid]).toBe(arch.armorType);
    expect(PopulationCost.cost[eid]).toBe(arch.population);
    expect(UnitAI.targetEid[eid]).toBe(NO_ENTITY);
  });
});

describe('buildings get Armor with the Building armor type', () => {
  it('spawnBuildingEntity on a recycled unit eid has Armor{value 0, type Building}', () => {
    const world = replaceWorld();
    const unit = createUnit(world, UnitTypeId.Heavy, F, 0, 0);
    Armor.value[unit] = 7;
    Armor.type[unit] = ArmorType.Heavy;
    removeEntity(world, unit);

    const b = spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Randstad, 1, 0);
    expect(b).toBe(unit);
    expect(hasComponent(world, b, Armor)).toBe(true);
    expect(Armor.type[b]).toBe(ArmorType.Building);
    expect(Armor.value[b]).toBe(0);
    expect(Building.progress[b]).toBe(1);
  });

  it('siege deals the 2x matrix bonus against a spawned building', () => {
    const world = replaceWorld();
    const building = spawnBuildingEntity(world, BuildingTypeId.Barracks, FactionId.Randstad, 1, 0);

    const attacker = addEntity(world);
    [Position, Faction, Movement, UnitAI, Attack, Armor, Health, IsUnit]
      .forEach(c => addComponent(world, attacker, c));
    Position.x[attacker] = 0; Position.z[attacker] = 0;
    Faction.id[attacker] = F;
    UnitAI.state[attacker] = UnitAIState.Attacking;
    UnitAI.targetEid[attacker] = building;
    Attack.damage[attacker] = 10;
    Attack.range[attacker] = 5;
    Attack.speed[attacker] = 1; Attack.cooldown[attacker] = 1; Attack.timer[attacker] = 0;
    Attack.attackType[attacker] = AttackType.Siege;
    Attack.siegeBonus[attacker] = 1.0;
    Attack.splashRadius[attacker] = 0;
    Health.current[attacker] = 100; Health.max[attacker] = 100;

    const startHp = Health.current[building];
    createCombatSystem()(world, 0.016);
    expect(startHp - Health.current[building]).toBeCloseTo(20, 4);
  });
});
