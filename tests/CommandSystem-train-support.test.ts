/**
 * CommandSystem-train-support.test.ts -- P1 isoleert: D-hotkey train-support
 * produceert geen unit (live bevinding Richard v0.37.26).
 *
 * Test-strategie: bewijs eerst dat de productie-pipeline correct functioneert
 * voor Support-units bij ALLE 4 facties via queueCommand({type:'train',...}).
 * Als dat groen is → bug zit in UI/hotkey-laag (HUD of Game.ts keyboard handler).
 * Als rood → bug zit in CommandSystem of ProductionSystem voor Support.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, query } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, Building, Production, Health,
} from '../src/ecs/components';
import { IsBuilding, IsUnit } from '../src/ecs/tags';
import { createCommandSystem, queueCommand } from '../src/systems/CommandSystem';
import { createProductionSystem } from '../src/systems/ProductionSystem';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import { getFactionUnitArchetype } from '../src/data/factionData';
import {
  FactionId, UnitTypeId, BuildingTypeId, NO_PRODUCTION,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnBarracks(world: World, faction: number): number {
  const eid = addEntity(world);
  [Position, Faction, Building, Production, Health, IsBuilding].forEach((c) =>
    addComponent(world, eid, c),
  );
  Faction.id[eid] = faction;
  Building.typeId[eid] = BuildingTypeId.Barracks;
  Building.complete[eid] = 1;
  Building.progress[eid] = 30;
  Building.maxProgress[eid] = 30;
  Health.current[eid] = 800;
  Health.max[eid] = 800;
  Production.unitType[eid] = NO_PRODUCTION;
  Production.progress[eid] = 0;
  Production.duration[eid] = 0;
  Production.queue0[eid] = NO_PRODUCTION;
  Production.queue1[eid] = NO_PRODUCTION;
  Production.queue2[eid] = NO_PRODUCTION;
  Production.queue3[eid] = NO_PRODUCTION;
  Production.queue4[eid] = NO_PRODUCTION;
  return eid;
}

const command = createCommandSystem();
const production = createProductionSystem();

beforeEach(() => {
  playerState.reset();
  eventBus.clear();
});

const FACTIONS = [
  { id: FactionId.Brabanders, label: 'Brabanders', supportName: 'Boerinneke' },
  { id: FactionId.Randstad,   label: 'Randstad',   supportName: 'HR-Medewerker' },
  { id: FactionId.Limburgers, label: 'Limburgers', supportName: 'Sjpion' },
  { id: FactionId.Belgen,     label: 'Belgen',     supportName: 'Wafelzuster' },
];

// ---------------------------------------------------------------------------
// Anchor: Support archetype data exists for every faction
// ---------------------------------------------------------------------------

describe('train-support — Support unit archetype data per faction', () => {
  for (const f of FACTIONS) {
    it(`${f.label} has Support archetype with correct name`, () => {
      const arch = getFactionUnitArchetype(f.id, UnitTypeId.Support);
      expect(arch).toBeDefined();
      expect(arch.name).toBe(f.supportName);
      expect(arch.costGold).toBeGreaterThan(0);
      expect(arch.buildTime).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Productie-pipeline: queueCommand → CommandSystem → Production component
// ---------------------------------------------------------------------------

describe('train-support — CommandSystem queues Support training', () => {
  for (const f of FACTIONS) {
    it(`${f.label}: queueCommand sets Production.unitType to Support`, () => {
      const world = replaceWorld();
      const barracks = spawnBarracks(world, f.id);
      const arch = getFactionUnitArchetype(f.id, UnitTypeId.Support);
      // Make sure resources are sufficient
      playerState.addGold(f.id, 1000);
      playerState.addWood(f.id, 1000);
      playerState.addPopulation(f.id, 0);

      queueCommand({
        type: 'train',
        buildingEid: barracks,
        unitTypeId: UnitTypeId.Support,
        cost: arch.costGold,
      });
      command(world, 0.016);

      expect(Production.unitType[barracks]).toBe(UnitTypeId.Support);
      expect(Production.duration[barracks]).toBeCloseTo(arch.buildTime, 4);
      expect(Production.progress[barracks]).toBe(0);
    });
  }

  it('CommandSystem deducts gold AND wood when training Support', () => {
    const world = replaceWorld();
    const barracks = spawnBarracks(world, FactionId.Brabanders);
    const arch = getFactionUnitArchetype(FactionId.Brabanders, UnitTypeId.Support);

    playerState.addGold(FactionId.Brabanders, 1000);
    playerState.addWood(FactionId.Brabanders, 1000);
    const goldBefore = playerState.getGold(FactionId.Brabanders);
    const woodBefore = playerState.getWood(FactionId.Brabanders);

    queueCommand({
      type: 'train',
      buildingEid: barracks,
      unitTypeId: UnitTypeId.Support,
      cost: arch.costGold,
    });
    command(world, 0.016);

    expect(playerState.getGold(FactionId.Brabanders)).toBe(goldBefore - arch.costGold);
    expect(playerState.getWood(FactionId.Brabanders)).toBe(woodBefore - (arch.costSecondary ?? 0));
  });

  it('refuses if wood < costSecondary (no production)', () => {
    const world = replaceWorld();
    const barracks = spawnBarracks(world, FactionId.Brabanders);
    const arch = getFactionUnitArchetype(FactionId.Brabanders, UnitTypeId.Support);

    playerState.addGold(FactionId.Brabanders, 1000);
    // Wood = 0 (default), Boerinneke kost 60 wood

    queueCommand({
      type: 'train',
      buildingEid: barracks,
      unitTypeId: UnitTypeId.Support,
      cost: arch.costGold,
    });
    command(world, 0.016);

    expect(Production.unitType[barracks]).toBe(NO_PRODUCTION);
  });
});

// ---------------------------------------------------------------------------
// ProductionSystem: tick to completion → unit-trained event
// ---------------------------------------------------------------------------

describe('train-support — ProductionSystem completes training', () => {
  it('Brabanders Boerinneke spawns after buildTime', () => {
    const world = replaceWorld();
    const barracks = spawnBarracks(world, FactionId.Brabanders);
    Position.x[barracks] = 0; Position.z[barracks] = 0;
    const arch = getFactionUnitArchetype(FactionId.Brabanders, UnitTypeId.Support);

    playerState.addGold(FactionId.Brabanders, 1000);
    playerState.addWood(FactionId.Brabanders, 1000);

    const events: any[] = [];
    eventBus.on('unit-trained', (e: any) => { events.push(e); });

    queueCommand({
      type: 'train',
      buildingEid: barracks,
      unitTypeId: UnitTypeId.Support,
      cost: arch.costGold,
    });
    command(world, 0.016);

    production(world, arch.buildTime + 0.5);

    expect(events.length).toBeGreaterThanOrEqual(1);
    const last = events[events.length - 1];
    expect(last.unitTypeId).toBe(UnitTypeId.Support);
    expect(last.factionId).toBe(FactionId.Brabanders);
    expect(Production.unitType[barracks]).toBe(NO_PRODUCTION);
  });
});

// ---------------------------------------------------------------------------
// Same regression class: Heavy/Siege also spawn through ProductionSystem
// (live bug v0.37.27 — UNIT_TEMPLATES had no entries for them either).
// ---------------------------------------------------------------------------

describe('train-heavy / train-siege — ProductionSystem spawns advanced units', () => {
  for (const f of FACTIONS) {
    it(`${f.label}: Heavy unit spawns via ProductionSystem`, () => {
      const world = replaceWorld();
      const bldg = spawnBarracks(world, f.id);
      const arch = getFactionUnitArchetype(f.id, UnitTypeId.Heavy);
      playerState.addGold(f.id, 1000);
      playerState.addWood(f.id, 1000);

      const events: any[] = [];
      eventBus.on('unit-trained', (e: any) => { events.push(e); });

      queueCommand({ type: 'train', buildingEid: bldg, unitTypeId: UnitTypeId.Heavy, cost: arch.costGold });
      command(world, 0.016);
      // Randstad has 1.2x bureaucracy slowdown, so tick generously past buildTime.
      production(world, arch.buildTime * 1.5 + 1);

      const heavy = events.find((e) => e.unitTypeId === UnitTypeId.Heavy);
      expect(heavy, `${f.label} Heavy unit must emit unit-trained`).toBeDefined();
      expect(heavy!.factionId).toBe(f.id);
    });

    it(`${f.label}: Siege unit spawns via ProductionSystem`, () => {
      const world = replaceWorld();
      const bldg = spawnBarracks(world, f.id);
      const arch = getFactionUnitArchetype(f.id, UnitTypeId.Siege);
      playerState.addGold(f.id, 1000);
      playerState.addWood(f.id, 1000);

      const events: any[] = [];
      eventBus.on('unit-trained', (e: any) => { events.push(e); });

      queueCommand({ type: 'train', buildingEid: bldg, unitTypeId: UnitTypeId.Siege, cost: arch.costGold });
      command(world, 0.016);
      // Randstad has 1.2x bureaucracy slowdown, so tick generously past buildTime.
      production(world, arch.buildTime * 1.5 + 1);

      const siege = events.find((e) => e.unitTypeId === UnitTypeId.Siege);
      expect(siege, `${f.label} Siege unit must emit unit-trained`).toBeDefined();
      expect(siege!.factionId).toBe(f.id);
    });

    it(`${f.label}: Support unit spawns via ProductionSystem (D-hotkey contract)`, () => {
      const world = replaceWorld();
      const bldg = spawnBarracks(world, f.id);
      const arch = getFactionUnitArchetype(f.id, UnitTypeId.Support);
      playerState.addGold(f.id, 1000);
      playerState.addWood(f.id, 1000);

      const events: any[] = [];
      eventBus.on('unit-trained', (e: any) => { events.push(e); });

      queueCommand({ type: 'train', buildingEid: bldg, unitTypeId: UnitTypeId.Support, cost: arch.costGold });
      command(world, 0.016);
      // Randstad has 1.2x bureaucracy slowdown, so tick generously past buildTime.
      production(world, arch.buildTime * 1.5 + 1);

      const sup = events.find((e) => e.unitTypeId === UnitTypeId.Support);
      expect(sup, `${f.label} Support unit must emit unit-trained`).toBeDefined();
      expect(sup!.factionId).toBe(f.id);
    });
  }
});
