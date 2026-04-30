/**
 * TowerSystem — sniper-bonus vs Ranged units (v0.51.1, BACKLOG P2)
 *
 * Watchtowers are elevated firing platforms and act as a natural
 * counter to Ranged units (which rely on positioning, not armor).
 * Damage is multiplied by `TOWER_RANGED_BONUS` (1.5×) when the
 * closest enemy in range is a Ranged unit. All other unit-types
 * keep the 1.0× baseline (regression invariant). Entities without a
 * `UnitType` component (e.g. buildings) also fall back to 1.0×.
 *
 * The `tower-attack` event must carry the FINAL damage value so
 * downstream consumers (damage popups, particles, audio) can reflect
 * the bonus.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Building, Faction, Health, UnitType,
} from '../src/ecs/components';
import { IsBuilding, IsUnit } from '../src/ecs/tags';
import {
  createTowerSystem,
  TOWER_DAMAGE,
  TOWER_RANGED_BONUS,
  TOWER_ATTACK_SPEED,
} from '../src/systems/TowerSystem';
import { BuildingTypeId, UnitTypeId, FactionId } from '../src/types/index';
import { eventBus } from '../src/core/EventBus';

type World = ReturnType<typeof replaceWorld>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function spawnTower(world: World, x: number, z: number, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Building);
  addComponent(world, eid, Faction);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Building.typeId[eid] = BuildingTypeId.DefenseTower;
  Building.complete[eid] = 1;
  Building.progress[eid] = 1.0;
  Faction.id[eid] = faction;
  return eid;
}

function spawnUnit(
  world: World,
  x: number,
  z: number,
  unitTypeId: UnitTypeId,
  faction = FactionId.Randstad,
  hp = 100,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, UnitType);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Health.current[eid] = hp;
  Health.max[eid] = hp;
  UnitType.id[eid] = unitTypeId;
  return eid;
}

/** Spawns an enemy unit WITHOUT a UnitType component (mimics a building or stripped entity). */
function spawnUnitWithoutUnitType(
  world: World,
  x: number,
  z: number,
  faction = FactionId.Randstad,
  hp = 100,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, IsUnit); // queried by tower
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Health.current[eid] = hp;
  Health.max[eid] = hp;
  return eid;
}

// ---------------------------------------------------------------------------
// Event capture
// ---------------------------------------------------------------------------
type TowerAttackEvent = { towerEid: number; targetEid: number; damage: number };
let capturedEvents: TowerAttackEvent[] = [];
let unsubscribe: (() => void) | null = null;

beforeEach(() => {
  replaceWorld();
  capturedEvents = [];
  if (unsubscribe) unsubscribe();
  const handler = (event: TowerAttackEvent) => { capturedEvents.push(event); };
  eventBus.on('tower-attack' as never, handler as never);
  unsubscribe = () => eventBus.off('tower-attack' as never, handler as never);
});

// ---------------------------------------------------------------------------
describe('TowerSystem — sniper-bonus vs Ranged', () => {
  it('Tower vs Ranged target → 1.5× damage', () => {
    const world = replaceWorld();
    spawnTower(world, 0, 0, FactionId.Brabanders);
    const target = spawnUnit(world, 5, 0, UnitTypeId.Ranged, FactionId.Randstad, 100);

    const towerSystem = createTowerSystem();
    towerSystem(world, TOWER_ATTACK_SPEED + 0.01); // first tick fires immediately

    const expected = TOWER_DAMAGE * TOWER_RANGED_BONUS; // 22.5
    expect(Health.current[target]).toBeCloseTo(100 - expected, 5);
    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0].damage).toBeCloseTo(expected, 5);
    expect(capturedEvents[0].targetEid).toBe(target);
  });

  it('Tower vs Worker/Infantry/Heavy → 1.0× damage (regression baseline)', () => {
    const cases: Array<[UnitTypeId, string]> = [
      [UnitTypeId.Worker, 'Worker'],
      [UnitTypeId.Infantry, 'Infantry'],
      [UnitTypeId.Heavy, 'Heavy'],
    ];

    for (const [typeId, label] of cases) {
      const world = replaceWorld();
      capturedEvents = [];
      spawnTower(world, 0, 0, FactionId.Brabanders);
      const target = spawnUnit(world, 5, 0, typeId, FactionId.Randstad, 100);

      const towerSystem = createTowerSystem();
      towerSystem(world, TOWER_ATTACK_SPEED + 0.01);

      expect(Health.current[target], `${label} HP`).toBeCloseTo(100 - TOWER_DAMAGE, 5);
      expect(capturedEvents, `${label} events`).toHaveLength(1);
      expect(capturedEvents[0].damage, `${label} dmg`).toBeCloseTo(TOWER_DAMAGE, 5);
    }
  });

  it('Tower vs Hero/Special/Siege/Support → 1.0× damage (no bonus)', () => {
    const cases: Array<[UnitTypeId, string]> = [
      [UnitTypeId.Hero, 'Hero'],
      [UnitTypeId.Special, 'Special'],
      [UnitTypeId.Siege, 'Siege'],
      [UnitTypeId.Support, 'Support'],
    ];

    for (const [typeId, label] of cases) {
      const world = replaceWorld();
      capturedEvents = [];
      spawnTower(world, 0, 0, FactionId.Brabanders);
      const target = spawnUnit(world, 5, 0, typeId, FactionId.Randstad, 200);

      const towerSystem = createTowerSystem();
      towerSystem(world, TOWER_ATTACK_SPEED + 0.01);

      expect(Health.current[target], `${label} HP`).toBeCloseTo(200 - TOWER_DAMAGE, 5);
      expect(capturedEvents, `${label} events`).toHaveLength(1);
      expect(capturedEvents[0].damage, `${label} dmg`).toBeCloseTo(TOWER_DAMAGE, 5);
    }
  });

  it('Tower vs entity without UnitType component → 1.0× damage (fallback, no bonus)', () => {
    const world = replaceWorld();
    spawnTower(world, 0, 0, FactionId.Brabanders);
    const target = spawnUnitWithoutUnitType(world, 5, 0, FactionId.Randstad, 100);

    const towerSystem = createTowerSystem();
    towerSystem(world, TOWER_ATTACK_SPEED + 0.01);

    expect(Health.current[target]).toBeCloseTo(100 - TOWER_DAMAGE, 5);
    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0].damage).toBeCloseTo(TOWER_DAMAGE, 5);
  });

  it('event payload damage matches actual HP delta (Ranged + non-Ranged)', () => {
    // Two independent worlds — verifies event.damage is the FINAL computed
    // value, not the constant TOWER_DAMAGE.
    {
      const world = replaceWorld();
      capturedEvents = [];
      spawnTower(world, 0, 0, FactionId.Brabanders);
      const ranged = spawnUnit(world, 3, 0, UnitTypeId.Ranged, FactionId.Randstad, 100);
      const before = Health.current[ranged];
      createTowerSystem()(world, TOWER_ATTACK_SPEED + 0.01);
      const dealt = before - Health.current[ranged];
      expect(capturedEvents[0].damage).toBeCloseTo(dealt, 5);
      expect(dealt).toBeCloseTo(TOWER_DAMAGE * TOWER_RANGED_BONUS, 5);
    }
    {
      const world = replaceWorld();
      capturedEvents = [];
      spawnTower(world, 0, 0, FactionId.Brabanders);
      const infantry = spawnUnit(world, 3, 0, UnitTypeId.Infantry, FactionId.Randstad, 100);
      const before = Health.current[infantry];
      createTowerSystem()(world, TOWER_ATTACK_SPEED + 0.01);
      const dealt = before - Health.current[infantry];
      expect(capturedEvents[0].damage).toBeCloseTo(dealt, 5);
      expect(dealt).toBeCloseTo(TOWER_DAMAGE, 5);
    }
  });
});
