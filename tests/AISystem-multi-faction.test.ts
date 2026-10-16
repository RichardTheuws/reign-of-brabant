// RED tests: in a 3-4 player skirmish only ONE AI played.
//
// AISystem held a single AIController, set from the first non-player spawn
// (Game.init) or mission.aiFactionIds[0] (initMission). Every other AI
// faction never built, trained or attacked. The hero-training throttle
// (aiHeroTimer) was a module-level counter, so it would also have been shared
// between controllers once there were several.
//
// Second bug: heroes use UnitTypeId.Infantry, so DeathSystem lowers the
// military (upkeep) count when one dies -- but hero spawns never raised it.
// Each hero death silently "uncounted" a real army unit.
//
// Post-fix contract:
//  - AISystem.setFactions([...]) creates one controller per AI faction, each
//    with its own state, base, timers and difficulty, all ticked each update.
//  - Commands and gold are per faction: a controller only builds/trains for
//    its own faction and spends its own gold.
//  - Skirmish: attack targets consider every opponent (all other factions are
//    hostile; there are no teams), picking the nearest enemy Town Hall.
//  - Missions (setFactions(..., { allied: true })): the AI factions are allied
//    against the player, so only non-AI factions are targets.
//  - reset() rebuilds every controller and clears per-controller timers.
//  - Hero spawns (AI + player + revival) add a military unit so hero death is
//    neutral.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { addEntity, addComponent, query } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Movement, Faction, UnitType, Building, Health, UnitAI, Gatherer,
  Resource, Production, Hero,
} from '../src/ecs/components';
import { IsBuilding, IsUnit, IsResource, IsHero, IsDead } from '../src/ecs/tags';
import { AISystem } from '../src/ai/AISystem';
import { playerState } from '../src/core/PlayerState';
import { resetHeroTracking } from '../src/entities/heroFactory';
import { createDeathSystem } from '../src/systems/DeathSystem';
import { createHeroSystem, resetHeroSystem } from '../src/systems/HeroSystem';
import { HERO_REVIVE_TIME } from '../src/types/index';
import {
  FactionId, BuildingTypeId, UnitTypeId, UnitAIState, NO_PRODUCTION, DEATH_TIMER,
  StrategicAIPhase,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

let world: World;
let ids: number[];
const isUnit = new Uint8Array(2048);
const isBuilding = new Uint8Array(2048);
const isResource = new Uint8Array(2048);
let trainCalls: { eid: number; unitType: UnitTypeId }[];
let spawnCalls: { type: BuildingTypeId; factionId: FactionId }[];
let deductCalls: { amount: number; factionId: number | undefined }[];
let gold: Record<number, number>;

function spawnBuilding(faction: FactionId, type: BuildingTypeId, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  addComponent(world, eid, Production);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Faction.id[eid] = faction;
  Building.typeId[eid] = type;
  Building.complete[eid] = 1;
  Building.progress[eid] = 1;
  Health.max[eid] = 1000;
  Health.current[eid] = 1000;
  Production.unitType[eid] = NO_PRODUCTION;
  isBuilding[eid] = 1;
  ids.push(eid);
  return eid;
}

function spawnUnit(faction: FactionId, type: UnitTypeId, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Movement);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitType);
  addComponent(world, eid, Health);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Gatherer);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Faction.id[eid] = faction;
  UnitType.id[eid] = type;
  Health.current[eid] = 50;
  Health.max[eid] = 50;
  UnitAI.state[eid] = UnitAIState.Idle;
  isUnit[eid] = 1;
  ids.push(eid);
  return eid;
}

function configureAI(): void {
  AISystem.configure(
    {
      positionX: Position.x,
      positionY: Position.y,
      positionZ: Position.z,
      movementTargetX: Movement.targetX,
      movementTargetZ: Movement.targetZ,
      movementHasTarget: Movement.hasTarget,
      movementSpeed: Movement.speed,
      factionId: Faction.id,
      unitTypeId: UnitType.id,
      buildingTypeId: Building.typeId,
      healthCurrent: Health.current,
      healthMax: Health.max,
      unitAIState: UnitAI.state,
      unitAITargetEid: UnitAI.targetEid,
      gathererState: Gatherer.state,
      gathererTargetEid: Gatherer.targetEid,
      resourceAmount: Resource.amount,
      productionUnitType: Production.unitType,
      productionProgress: Production.progress,
      productionTime: Production.duration,
      isUnit,
      isBuilding,
      isResource,
    },
    {
      spawnBuilding: (type, factionId) => {
        spawnCalls.push({ type, factionId });
        return -1;
      },
      startTraining: (eid, unitType) => {
        trainCalls.push({ eid, unitType });
        return true;
      },
      deductGold: (amount, factionId) => {
        deductCalls.push({ amount, factionId });
        const f = factionId ?? -1;
        if ((gold[f] ?? 0) < amount) return false;
        gold[f] -= amount;
        return true;
      },
      getGold: (factionId) => gold[factionId ?? -1] ?? 0,
      getAllEntityIds: () => ids,
    },
  );
}

/** Run one AI decision tick (DECISION_INTERVAL = 2s). */
function tick(): void {
  AISystem.update(2.5, 30);
}

const AIS = [FactionId.Randstad, FactionId.Limburgers, FactionId.Belgen] as const;
const BASES: Record<number, { x: number; z: number }> = {
  [FactionId.Brabanders]: { x: -40, z: -40 },
  [FactionId.Randstad]: { x: 40, z: 40 },
  [FactionId.Limburgers]: { x: 40, z: -40 },
  [FactionId.Belgen]: { x: -40, z: 40 },
};

beforeEach(() => {
  world = replaceWorld();
  ids = [];
  trainCalls = [];
  spawnCalls = [];
  deductCalls = [];
  gold = {
    [FactionId.Brabanders]: 5000,
    [FactionId.Randstad]: 5000,
    [FactionId.Limburgers]: 5000,
    [FactionId.Belgen]: 5000,
  };
  isUnit.fill(0);
  isBuilding.fill(0);
  isResource.fill(0);
  playerState.reset(4);
  resetHeroTracking();
  AISystem.setFactions([...AIS], 'normal');
  configureAI();
});

describe('AISystem: one controller per AI faction', () => {
  it('creates one controller per AI faction (deduplicated)', () => {
    expect(AISystem.factionIds).toEqual([...AIS]);
    AISystem.setFactions([FactionId.Randstad, FactionId.Randstad, FactionId.Belgen], 'hard');
    expect(AISystem.factionIds).toEqual([FactionId.Randstad, FactionId.Belgen]);
  });

  it('every AI faction builds a barracks for itself only', () => {
    for (const f of AIS) spawnBuilding(f, BuildingTypeId.TownHall, BASES[f].x, BASES[f].z);

    tick();

    const barracksFactions = spawnCalls
      .filter((c) => c.type === BuildingTypeId.Barracks)
      .map((c) => c.factionId)
      .sort();
    expect(barracksFactions).toEqual([...AIS].sort());
    // Each faction paid from its own treasury.
    for (const c of deductCalls) expect(AIS).toContain(c.factionId);
    for (const f of AIS) expect(gold[f]).toBeLessThan(5000);
    expect(gold[FactionId.Brabanders]).toBe(5000);
  });

  it('every AI faction trains from its own barracks only', () => {
    const barracksOf = new Map<number, FactionId>();
    for (const f of AIS) {
      spawnBuilding(f, BuildingTypeId.TownHall, BASES[f].x, BASES[f].z);
      const b = spawnBuilding(f, BuildingTypeId.Barracks, BASES[f].x + 5, BASES[f].z);
      barracksOf.set(b, f);
      for (let i = 0; i < 6; i++) spawnUnit(f, UnitTypeId.Worker, BASES[f].x, BASES[f].z);
    }
    // Player barracks must never be used by an AI.
    const playerBarracks = spawnBuilding(FactionId.Brabanders, BuildingTypeId.Barracks, -40, -35);

    tick();

    const trainedFactions = new Set(
      trainCalls.filter((c) => barracksOf.has(c.eid)).map((c) => barracksOf.get(c.eid)),
    );
    expect([...trainedFactions].sort()).toEqual([...AIS].sort());
    expect(trainCalls.some((c) => c.eid === playerBarracks)).toBe(false);
  });

  it('attacks the nearest opponent, which can be another AI', () => {
    // Randstad sits next to Limburgers; the player is far away.
    spawnBuilding(FactionId.Brabanders, BuildingTypeId.TownHall, -60, -60);
    spawnBuilding(FactionId.Randstad, BuildingTypeId.TownHall, 40, 40);
    spawnBuilding(FactionId.Randstad, BuildingTypeId.Barracks, 45, 40);
    spawnBuilding(FactionId.Limburgers, BuildingTypeId.TownHall, 40, 10);
    const army: number[] = [];
    for (let i = 0; i < 12; i++) army.push(spawnUnit(FactionId.Randstad, UnitTypeId.Infantry, 40, 38));
    AISystem.setFactions([FactionId.Randstad, FactionId.Limburgers], 'normal');

    tick();

    expect(AISystem.getPhase(FactionId.Randstad)).toBe(StrategicAIPhase.Attack);
    expect(Movement.targetX[army[0]]).toBe(40);
    expect(Movement.targetZ[army[0]]).toBe(10);
  });
});

describe('AISystem: mission AIs are allied (player is the only enemy)', () => {
  it('allied AIs ignore each other and attack the player', () => {
    // Same layout as the FFA test: Limburgers TH is nearer than the player's.
    spawnBuilding(FactionId.Brabanders, BuildingTypeId.TownHall, -60, -60);
    spawnBuilding(FactionId.Randstad, BuildingTypeId.TownHall, 40, 40);
    spawnBuilding(FactionId.Randstad, BuildingTypeId.Barracks, 45, 40);
    spawnBuilding(FactionId.Limburgers, BuildingTypeId.TownHall, 40, 10);
    const army: number[] = [];
    for (let i = 0; i < 12; i++) army.push(spawnUnit(FactionId.Randstad, UnitTypeId.Infantry, 40, 38));
    AISystem.setFactions([FactionId.Randstad, FactionId.Limburgers], 'normal', { allied: true });

    tick();

    expect(AISystem.getPhase(FactionId.Randstad)).toBe(StrategicAIPhase.Attack);
    expect(Movement.targetX[army[0]]).toBe(-60);
    expect(Movement.targetZ[army[0]]).toBe(-60);
  });

  it('setFactions without the option is free-for-all again', () => {
    AISystem.setFactions([FactionId.Randstad], 'normal', { allied: true });
    AISystem.setFactions([FactionId.Randstad, FactionId.Limburgers], 'normal');
    spawnBuilding(FactionId.Brabanders, BuildingTypeId.TownHall, -60, -60);
    spawnBuilding(FactionId.Randstad, BuildingTypeId.TownHall, 40, 40);
    spawnBuilding(FactionId.Randstad, BuildingTypeId.Barracks, 45, 40);
    spawnBuilding(FactionId.Limburgers, BuildingTypeId.TownHall, 40, 10);
    const army: number[] = [];
    for (let i = 0; i < 12; i++) army.push(spawnUnit(FactionId.Randstad, UnitTypeId.Infantry, 40, 38));

    tick();

    expect(Movement.targetZ[army[0]]).toBe(10);
  });
});

describe('AISystem: no shared mutable state between controllers', () => {
  it('each controller keeps its own decision timer', () => {
    for (const f of AIS) spawnBuilding(f, BuildingTypeId.TownHall, BASES[f].x, BASES[f].z);
    AISystem.setFactions([FactionId.Randstad], 'normal');
    AISystem.update(1.5, 1.5); // Randstad timer at 1.5s
    AISystem.setFactions([...AIS], 'normal'); // fresh controllers, timers 0
    AISystem.update(1.0, 2.5);
    // No controller reached the 2s decision interval.
    expect(spawnCalls).toHaveLength(0);
  });

  it('hero-training throttle is per controller (every AI gets its hero)', () => {
    for (const f of AIS) {
      spawnBuilding(f, BuildingTypeId.TownHall, BASES[f].x, BASES[f].z);
      spawnBuilding(f, BuildingTypeId.Barracks, BASES[f].x + 5, BASES[f].z);
      for (let i = 0; i < 10; i++) spawnUnit(f, UnitTypeId.Infantry, BASES[f].x, BASES[f].z);
    }

    // 150 hero checks per controller = one throttle window each.
    for (let i = 0; i < 150; i++) AISystem.update(0.001, 1);

    const heroFactions = new Set<number>();
    for (const eid of query(world, [Hero, IsHero])) heroFactions.add(Faction.id[eid]);
    expect([...heroFactions].sort()).toEqual([...AIS].sort());
  });

  it('reset() rebuilds every controller and clears hero timers', () => {
    for (const f of AIS) {
      spawnBuilding(f, BuildingTypeId.TownHall, BASES[f].x, BASES[f].z);
      spawnBuilding(f, BuildingTypeId.Barracks, BASES[f].x + 5, BASES[f].z);
      for (let i = 0; i < 10; i++) spawnUnit(f, UnitTypeId.Infantry, BASES[f].x, BASES[f].z);
    }
    for (let i = 0; i < 149; i++) AISystem.update(0.001, 1);
    tick(); // decision tick also advances hero timers to 150 -> heroes would spawn
    const before = query(world, [Hero, IsHero]).length;
    expect(before).toBe(3);

    // New match: same factions, everything reset.
    resetHeroTracking();
    AISystem.reset();
    expect(AISystem.factionIds).toEqual([...AIS]);
    for (const f of AIS) expect(AISystem.getPhase(f)).toBe(StrategicAIPhase.Opening);
    for (let i = 0; i < 149; i++) AISystem.update(0.001, 1);
    expect(query(world, [Hero, IsHero]).length).toBe(before); // timer restarted at 0
  });
});

describe('AISystem: hero spawn keeps the military count consistent', () => {
  it('AI hero death does not uncount a regular army unit', () => {
    const f = FactionId.Randstad;
    AISystem.setFactions([f], 'normal');
    spawnBuilding(f, BuildingTypeId.TownHall, 40, 40);
    spawnBuilding(f, BuildingTypeId.Barracks, 45, 40);
    for (let i = 0; i < 10; i++) spawnUnit(f, UnitTypeId.Infantry, 40, 40);
    playerState.addMilitaryUnit(f, 10); // the 10 trained infantry

    for (let i = 0; i < 150; i++) AISystem.update(0.001, 1);
    const heroes = query(world, [Hero, IsHero]);
    expect(heroes.length).toBe(1);
    expect(playerState.getMilitaryCount(f)).toBe(11);

    // Hero dies and is removed by DeathSystem.
    const death = createDeathSystem();
    addComponent(world, heroes[0], IsDead);
    death(world, 0.016);
    death(world, DEATH_TIMER + 0.1);
    expect(playerState.getMilitaryCount(f)).toBe(10);
  });
});

describe('Hero revival keeps the military count consistent', () => {
  it('a revived hero is counted, so its next death is neutral', () => {
    const f = FactionId.Randstad;
    resetHeroSystem();
    AISystem.setFactions([f], 'normal');
    spawnBuilding(f, BuildingTypeId.TownHall, 40, 40);
    spawnBuilding(f, BuildingTypeId.Barracks, 45, 40);
    for (let i = 0; i < 10; i++) spawnUnit(f, UnitTypeId.Infantry, 40, 40);
    playerState.addMilitaryUnit(f, 10);
    for (let i = 0; i < 150; i++) AISystem.update(0.001, 1);
    expect(playerState.getMilitaryCount(f)).toBe(11);

    const death = createDeathSystem();
    const heroSys = createHeroSystem();
    const killHero = (): void => {
      const [hero] = query(world, [Hero, IsHero]);
      addComponent(world, hero, IsDead);
      heroSys(world, 0.016); // registers the pending revival
      death(world, 0.016);
      death(world, DEATH_TIMER + 0.1);
    };

    killHero();
    expect(playerState.getMilitaryCount(f)).toBe(10);
    heroSys(world, HERO_REVIVE_TIME + 1); // revive
    expect(query(world, [Hero, IsHero]).length).toBe(1);
    expect(playerState.getMilitaryCount(f)).toBe(11);
    killHero();
    expect(playerState.getMilitaryCount(f)).toBe(10);
    resetHeroSystem();
  });
});

describe('Game wiring (source-level, Game needs WebGL)', () => {
  const src = readFileSync(resolve(__dirname, '..', 'src', 'core', 'Game.ts'), 'utf-8')
    .replace(/\/\/.*$/gm, '');

  it('skirmish init gives every non-player spawn faction a controller', () => {
    expect(src).toMatch(/AISystem\.setFactions\(\s*aiFactions/);
    expect(src).toMatch(/this\.map\.spawns[\s\S]{0,200}factionId !== this\.playerFactionId/);
  });

  it('mission init gives every mission.aiFactionIds entry a controller', () => {
    expect(src).toMatch(/AISystem\.setFactions\(\s*mission\.aiFactionIds/);
    // Mission AIs are allied against the player (briefings: 'alliantie ... tegen ons').
    expect(src).toMatch(/AISystem\.setFactions\(\s*mission\.aiFactionIds[^)]*allied:\s*true/);
    expect(src).not.toMatch(/AISystem\.setFaction\(\s*primaryAiFaction/);
  });

  it('player hero spawn adds a military unit', () => {
    const idx = src.indexOf('createHero(world, heroTypeId, this.playerFactionId');
    expect(idx).toBeGreaterThan(-1);
    expect(src.slice(idx, idx + 400)).toContain('addMilitaryUnit(this.playerFactionId)');
  });
});
