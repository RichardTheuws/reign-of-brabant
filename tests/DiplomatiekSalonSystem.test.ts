/**
 * DiplomatiekSalonSystem.test.ts -- Belgen FactionSpecial1 random event
 *
 * Every 90s a complete Belgen Diplomatiek Salon rolls a random outcome:
 * chocolade (+50 tertiary), resources (+200 gold +100 wood), or spawn (1
 * free Bierbouwer Worker). 'diplomatiek-event' bus event fires.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addEntity, addComponent, query } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, Building, UnitType,
} from '../src/ecs/components';
import { IsBuilding, IsUnit, IsWorker } from '../src/ecs/tags';
import { createDiplomatiekSalonSystem, _resetSalonState } from '../src/systems/DiplomatiekSalonSystem';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import {
  FactionId, BuildingTypeId, UnitTypeId,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnSalon(world: World, x: number, z: number, faction = FactionId.Belgen, complete = true): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Position.x[eid] = x; Position.z[eid] = z;
  Building.typeId[eid] = BuildingTypeId.FactionSpecial1;
  Building.complete[eid] = complete ? 1 : 0;
  return eid;
}

beforeEach(() => {
  playerState.reset();
  eventBus.clear();
  _resetSalonState();
  vi.restoreAllMocks();
});

describe('DiplomatiekSalonSystem — timer + outcomes', () => {
  it('fresh spawn: first tick sets 90s cooldown, no event yet', () => {
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0);
    let fired = 0;
    eventBus.on('diplomatiek-event', () => { fired++; });
    sys(world, 0);
    expect(fired).toBe(0);
  });

  it('<90s: no event', () => {
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0);
    let fired = 0;
    eventBus.on('diplomatiek-event', () => { fired++; });
    sys(world, 0);
    sys(world, 89);
    expect(fired).toBe(0);
  });

  it('outcome = chocolade (random < 0.33): +50 tertiary', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0);
    sys(world, 0);
    sys(world, 91);
    expect(playerState.getTertiary(FactionId.Belgen)).toBe(50);
  });

  it('outcome = resources (0.33 ≤ random < 0.66): +200g +100w', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0);
    sys(world, 0);
    sys(world, 91);
    expect(playerState.getGold(FactionId.Belgen)).toBe(100 + 200); // start 100 + 200
    expect(playerState.getWood(FactionId.Belgen)).toBe(100);
  });

  it('outcome = spawn (random ≥ 0.66): new Belgen Worker entity', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0);
    const beforeWorkers = query(world, [IsUnit, IsWorker, Faction]).filter(e => Faction.id[e] === FactionId.Belgen).length;
    sys(world, 0);
    sys(world, 91);
    const afterWorkers = query(world, [IsUnit, IsWorker, Faction]).filter(e => Faction.id[e] === FactionId.Belgen).length;
    expect(afterWorkers).toBe(beforeWorkers + 1);
  });

  it('event-payload contains outcome + position + eid', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    const eid = spawnSalon(world, 7, 13);
    let captured: { outcome: string; x: number; z: number; eid: number } | null = null;
    eventBus.on('diplomatiek-event', (e) => { captured = e; });
    sys(world, 0);
    sys(world, 91);
    expect(captured).not.toBeNull();
    expect(captured!.outcome).toBe('resources');
    expect(captured!.x).toBe(7);
    expect(captured!.z).toBe(13);
    expect(captured!.eid).toBe(eid);
  });

  it('non-Belgen FactionSpecial1 (Brabant Carnavalstent) → no event', () => {
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0, FactionId.Brabanders);
    let fired = 0;
    eventBus.on('diplomatiek-event', () => { fired++; });
    sys(world, 0);
    sys(world, 91);
    expect(fired).toBe(0);
  });

  it('incomplete Salon → no event', () => {
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0, FactionId.Belgen, false);
    let fired = 0;
    eventBus.on('diplomatiek-event', () => { fired++; });
    sys(world, 0);
    sys(world, 91);
    expect(fired).toBe(0);
  });

  it('cooldown resets to 90s after firing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0);
    let fired = 0;
    eventBus.on('diplomatiek-event', () => { fired++; });
    sys(world, 0);
    sys(world, 91); // first fire
    expect(fired).toBe(1);
    sys(world, 89); // < cooldown
    expect(fired).toBe(1);
    sys(world, 2); // crosses cooldown
    expect(fired).toBe(2);
  });

  it('2 Salons → independent timers', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const world = replaceWorld();
    const sys = createDiplomatiekSalonSystem();
    spawnSalon(world, 0, 0);
    spawnSalon(world, 50, 50);
    let fired = 0;
    eventBus.on('diplomatiek-event', () => { fired++; });
    sys(world, 0);
    sys(world, 91);
    expect(fired).toBe(2);
  });
});
