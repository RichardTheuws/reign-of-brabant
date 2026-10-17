// AI build order (v0.62.1).
//
// Gate measurement v0.61.0 / v0.62.0 (1v1 skirmish, AI Randstad on normal,
// 300 s): the AI placed its Town Hall + one Barracks in the first 30 s and
// then nothing else. Cause: AIController had no build order past the first
// Barracks -- it never built Housing (production stalls at the Town Hall's
// 20 population), never a second Barracks (and trained from barracks[0]
// only, gated on a global isTraining flag), so gold piled up to ~1500 by 5:00.
// It was identical in v0.61 and v0.62: not a footprint/NavGrid regression.
//
// Contract after the fix:
//  - Housing when free population <= housingSlack (before army training).
//  - Extra Barracks up to maxBarracks (easy 1 / normal 2 / hard 3) and a
//    tertiary building, from gold left after training + buildReserve.
//  - Every idle Barracks trains, not only the first one.
//  - The AISystem places AI buildings on a free site (no overlap, not on
//    NavGrid-blocked cells, clear of gold mines) and only charges gold once a
//    site is found.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { AIController, AICommandType, type AIWorldSnapshot, type AICommand } from '../src/ai/AIController';
import { AISystem, findAIBuildSite } from '../src/ai/AISystem';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Movement, Faction, UnitType, Building, Health, UnitAI, Gatherer,
  Resource, Production,
} from '../src/ecs/components';
import { IsBuilding, IsResource } from '../src/ecs/tags';
import { NavGrid } from '../src/pathfinding/NavGrid';
import { setActiveNavGrid } from '../src/pathfinding/UnitPathing';
import { playerState } from '../src/core/PlayerState';
import {
  FactionId, BuildingTypeId, UnitTypeId, UnitAIState, ResourceType, NO_PRODUCTION,
} from '../src/types/index';

// ---------------------------------------------------------------------------
// AIController (pure decision logic)
// ---------------------------------------------------------------------------

function snapshot(over: Partial<AIWorldSnapshot> = {}): AIWorldSnapshot {
  return {
    gold: 0,
    elapsedTime: 60,
    workers: [1, 2, 3, 4, 5],
    infantry: [],
    ranged: [],
    heavy: [],
    support: [],
    townHalls: [100],
    barracks: [101],
    tertiaryBuildings: [],
    army: [],
    playerTownHallPositions: [{ x: -40, z: -40 }],
    goldMinePositions: [],
    baseX: 40,
    baseZ: 40,
    barracksUnderConstruction: false,
    tertiaryUnderConstruction: false,
    isTraining: false,
    efficiencyStacks: 0,
    werkoverlegActive: false,
    vergaderingReady: false,
    enemyUnitPositions: [],
    population: 8,
    populationMax: 20,
    idleBarracks: [101],
    housing: [],
    getEntityPosition: () => ({ x: 40, z: 40 }),
    getEntityState: () => UnitAIState.Gathering,
    ...over,
  };
}

/** One decision tick (DECISION_INTERVAL = 2 s). */
function decide(ai: AIController, snap: AIWorldSnapshot): AICommand[] {
  return ai.update(snap, 2.5);
}

const builds = (cmds: AICommand[], type?: BuildingTypeId) =>
  cmds.filter(c => c.type === AICommandType.BuildStructure && (type == null || c.buildingType === type));

describe('AIController build order', () => {
  it('builds Housing when the population is about to hit its cap', () => {
    const ai = new AIController(FactionId.Randstad, 'normal');
    const cmds = decide(ai, snapshot({ gold: 150, population: 16, populationMax: 20 }));
    expect(builds(cmds, BuildingTypeId.Housing)).toHaveLength(1);
  });

  it('puts Housing before army training when gold is short', () => {
    const ai = new AIController(FactionId.Randstad, 'normal');
    // 120 gold: Housing (100) fits, Housing + any unit does not.
    const cmds = decide(ai, snapshot({ gold: 120, population: 18, populationMax: 20 }));
    expect(builds(cmds, BuildingTypeId.Housing)).toHaveLength(1);
    expect(cmds.some(c => c.type === AICommandType.TrainUnit && c.targetEntityId === 101)).toBe(false);
  });

  it('does not build Housing while there is population room', () => {
    const ai = new AIController(FactionId.Randstad, 'normal');
    const cmds = decide(ai, snapshot({ gold: 150, population: 5, populationMax: 20 }));
    expect(builds(cmds, BuildingTypeId.Housing)).toHaveLength(0);
  });

  it('adds a second Barracks on normal when gold piles up', () => {
    const ai = new AIController(FactionId.Randstad, 'normal');
    const cmds = decide(ai, snapshot({ gold: 1500 }));
    expect(builds(cmds, BuildingTypeId.Barracks)).toHaveLength(1);
  });

  it('builds a tertiary building once the Barracks cap is reached', () => {
    const ai = new AIController(FactionId.Brabanders, 'normal');
    const cmds = decide(ai, snapshot({ gold: 1500, barracks: [101, 102], idleBarracks: [] }));
    expect(builds(cmds, BuildingTypeId.Barracks)).toHaveLength(0);
    expect(builds(cmds, BuildingTypeId.TertiaryResourceBuilding)).toHaveLength(1);
  });

  it('keeps Barracks count ordered by difficulty: easy 1 < normal 2 < hard 3', () => {
    const maxBarracks = (difficulty: string): number => {
      for (let n = 1; n <= 5; n++) {
        const ai = new AIController(FactionId.Randstad, difficulty);
        const ids = Array.from({ length: n }, (_, i) => 101 + i);
        const cmds = decide(ai, snapshot({ gold: 5000, barracks: ids, idleBarracks: [] }));
        if (builds(cmds, BuildingTypeId.Barracks).length === 0) return n;
      }
      return Infinity;
    };
    expect(maxBarracks('easy')).toBe(1);
    expect(maxBarracks('normal')).toBe(2);
    expect(maxBarracks('hard')).toBe(3);
  });

  it('counts a Barracks under construction toward the cap', () => {
    const ai = new AIController(FactionId.Randstad, 'normal');
    const cmds = decide(ai, snapshot({ gold: 1500, barracksUnderConstruction: true }));
    expect(builds(cmds, BuildingTypeId.Barracks)).toHaveLength(0);
  });

  it('keeps a gold reserve for the army before optional buildings (easy)', () => {
    const ai = new AIController(FactionId.Randstad, 'easy');
    // Tertiary costs 250, easy keeps 150 back: 300 gold is not enough after
    // training one unit, 1500 is.
    const poor = decide(ai, snapshot({ gold: 300, barracks: [101], idleBarracks: [] }));
    expect(builds(poor, BuildingTypeId.TertiaryResourceBuilding)).toHaveLength(0);
    const rich = decide(new AIController(FactionId.Randstad, 'easy'), snapshot({ gold: 1500, barracks: [101], idleBarracks: [] }));
    expect(builds(rich, BuildingTypeId.TertiaryResourceBuilding)).toHaveLength(1);
  });

  it('trains from every idle Barracks, not only the first', () => {
    const ai = new AIController(FactionId.Randstad, 'normal');
    const cmds = decide(ai, snapshot({ gold: 1000, barracks: [101, 102], idleBarracks: [101, 102] }));
    const trainers = cmds.filter(c => c.type === AICommandType.TrainUnit).map(c => c.targetEntityId);
    expect(trainers).toContain(101);
    expect(trainers).toContain(102);
  });

  it('issues at most one tertiary building per decision for Limburgers/Belgen (early path + expansion)', () => {
    // Review repro: buildTertiaryEarly emitted BuildTertiaryBuilding and the
    // expansion step read the same snapshot and emitted a second tertiary.
    const tertiaryCmds = (cmds: AICommand[]) => cmds.filter(c =>
      c.type === AICommandType.BuildTertiaryBuilding ||
      (c.type === AICommandType.BuildStructure && c.buildingType === BuildingTypeId.TertiaryResourceBuilding));
    for (const faction of [FactionId.Limburgers, FactionId.Belgen]) {
      for (const [difficulty, cap] of [['easy', 1], ['normal', 2], ['hard', 3]] as const) {
        for (const gold of [500, 700, 1500, 5000]) {
          const ids = Array.from({ length: cap }, (_, i) => 101 + i);
          const ai = new AIController(faction, difficulty);
          const cmds = decide(ai, snapshot({ gold, barracks: ids, idleBarracks: [] }));
          expect(tertiaryCmds(cmds), `${faction}/${difficulty}/${gold}`).toHaveLength(1);
        }
      }
    }
  });

  it('does not spend more gold in one decision than it has', () => {
    const ai = new AIController(FactionId.Randstad, 'hard');
    const cmds = decide(ai, snapshot({ gold: 260, population: 19, populationMax: 20, barracks: [101, 102], idleBarracks: [101, 102] }));
    // Housing (100) + at most what is left for units; no Barracks (200) on top.
    expect(builds(cmds, BuildingTypeId.Barracks)).toHaveLength(0);
    expect(builds(cmds, BuildingTypeId.Housing)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// AISystem (snapshot + placement + execution against a real ECS world)
// ---------------------------------------------------------------------------

type World = ReturnType<typeof replaceWorld>;
const AI = FactionId.Randstad;

let world: World;
let ids: number[];
const isUnit = new Uint8Array(1024);
const isBuilding = new Uint8Array(1024);
const isResource = new Uint8Array(1024);
let gold: number;
let spawned: { type: BuildingTypeId; x: number; z: number }[];
let trainCalls: number[];
let deducted: number[];

function addBuilding(type: BuildingTypeId, x: number, z: number, faction: number = AI, producing = false): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Faction.id[eid] = faction;
  Building.typeId[eid] = type;
  Building.complete[eid] = 1;
  Building.progress[eid] = 1;
  Health.max[eid] = 1000;
  Health.current[eid] = 1000;
  if (type === BuildingTypeId.Barracks || type === BuildingTypeId.TownHall) {
    addComponent(world, eid, Production);
    Production.unitType[eid] = producing ? UnitTypeId.Infantry : NO_PRODUCTION;
  }
  isBuilding[eid] = 1;
  ids.push(eid);
  return eid;
}

function addGoldMine(x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Resource);
  addComponent(world, eid, IsResource);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Resource.type[eid] = ResourceType.Gold;
  Resource.amount[eid] = 1500;
  Faction.id[eid] = 255;
  isResource[eid] = 1;
  ids.push(eid);
  return eid;
}

function configureAI(): void {
  AISystem.configure(
    {
      positionX: Position.x, positionY: Position.y, positionZ: Position.z,
      movementTargetX: Movement.targetX, movementTargetZ: Movement.targetZ,
      movementHasTarget: Movement.hasTarget, movementSpeed: Movement.speed,
      factionId: Faction.id, unitTypeId: UnitType.id, buildingTypeId: Building.typeId,
      healthCurrent: Health.current, healthMax: Health.max,
      unitAIState: UnitAI.state, unitAITargetEid: UnitAI.targetEid,
      gathererState: Gatherer.state, gathererTargetEid: Gatherer.targetEid,
      resourceAmount: Resource.amount,
      productionUnitType: Production.unitType, productionProgress: Production.progress,
      productionTime: Production.duration,
      isUnit, isBuilding, isResource,
    },
    {
      spawnBuilding: (type, _f, x, z) => {
        spawned.push({ type, x, z });
        return addBuilding(type, x, z);
      },
      startTraining: (eid) => { trainCalls.push(eid); return true; },
      deductGold: (amount) => { if (gold < amount) return false; gold -= amount; deducted.push(amount); return true; },
      getGold: () => gold,
      getAllEntityIds: () => ids,
    },
  );
}

beforeEach(() => {
  world = replaceWorld();
  ids = [];
  spawned = [];
  trainCalls = [];
  deducted = [];
  isUnit.fill(0);
  isBuilding.fill(0);
  isResource.fill(0);
  playerState.reset();
  setActiveNavGrid(null);
  AISystem.setFaction(AI, 'normal');
  configureAI();
});

afterEach(() => {
  setActiveNavGrid(null);
});

describe('AISystem build order execution', () => {
  it('builds Housing when the AI is at its population cap (the v0.62.0 stall)', () => {
    addBuilding(BuildingTypeId.TownHall, 40, 40);
    addBuilding(BuildingTypeId.Barracks, 32, 32, AI, /*producing*/ true);
    playerState.addPopulation(AI, 10); // reset() = 0/10 -> full
    gold = 150;

    AISystem.update(2.5, 60);

    expect(spawned.map(s => s.type)).toContain(BuildingTypeId.Housing);
    expect(deducted).toContain(100); // Housing cost from the archetype
  });

  it('expands to a second Barracks with surplus gold and trains from both', () => {
    addBuilding(BuildingTypeId.TownHall, 40, 40);
    const first = addBuilding(BuildingTypeId.Barracks, 32, 32);
    gold = 1500;

    AISystem.update(2.5, 60);
    expect(spawned.filter(s => s.type === BuildingTypeId.Barracks)).toHaveLength(1);

    const second = ids[ids.length - 1];
    trainCalls = [];
    AISystem.update(2.5, 62);
    expect(trainCalls).toContain(first);
    expect(trainCalls).toContain(second);
  });

  it('places AI buildings on free ground: no overlap, not on blocked cells, away from gold', () => {
    // River along x in [44, 60] (blocked), base at (40,40), gold mine next to it.
    const grid = new NavGrid(128, (x) => x >= 44 && x <= 60);
    setActiveNavGrid(grid);
    addBuilding(BuildingTypeId.TownHall, 40, 40);
    const mineX = 34, mineZ = 40;
    addGoldMine(mineX, mineZ);

    const placed: { x: number; z: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const site = findAIBuildSite(world, BuildingTypeId.Housing, AI, 40, 40);
      expect(site).not.toBeNull();
      placed.push(site!);
      addBuilding(BuildingTypeId.Housing, site!.x, site!.z);
    }
    const all = [{ x: 40, z: 40 }, ...placed];
    for (const p of placed) {
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        expect(grid.isBlockedAt(p.x + dx, p.z + dz)).toBe(false);
      }
      expect(Math.hypot(p.x - mineX, p.z - mineZ)).toBeGreaterThanOrEqual(7);
      for (const q of all) {
        if (q === p) continue;
        expect(Math.max(Math.abs(p.x - q.x), Math.abs(p.z - q.z))).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('does not charge gold when no free site exists', () => {
    // Everything blocked: no site anywhere.
    setActiveNavGrid(new NavGrid(128, () => true));
    addBuilding(BuildingTypeId.TownHall, 40, 40);
    addBuilding(BuildingTypeId.Barracks, 32, 32, AI, true); // midgame: build order runs
    playerState.addPopulation(AI, 10);
    gold = 150;

    AISystem.update(2.5, 60);

    expect(spawned).toHaveLength(0);
    expect(deducted).not.toContain(100); // Housing was never paid for
  });

  it('snapshot reports population and idle Barracks', () => {
    addBuilding(BuildingTypeId.TownHall, 40, 40);
    const busy = addBuilding(BuildingTypeId.Barracks, 32, 32, AI, true);
    const idle = addBuilding(BuildingTypeId.Barracks, 48, 32);
    playerState.addPopulation(AI, 4);
    gold = 1000;

    trainCalls = [];
    AISystem.update(2.5, 60);

    expect(trainCalls).toContain(idle);
    expect(trainCalls).not.toContain(busy);
  });
});
