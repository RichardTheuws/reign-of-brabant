// RED tests for three AISystem snapshot bugs that stall the AI opponent.
//
// 1. isTraining was set for ANY building whose Production.unitType !== 0xff.
//    Buildings without a Production component (TertiaryResourceBuilding,
//    built early by Limburgers/Belgen) read 0 there, so isTraining stayed
//    true forever and the AI stopped training its army.
// 2. A barracks only counted as complete when health >= max. Buildings never
//    heal, so one hit made it "under construction" forever: no training, and
//    no new barracks either (barracksUnderConstruction blocks the build).
// 3. The gold-mine list included every resource (trees too), so idle workers
//    could be sent to "gather gold" from a tree.
//
// Post-fix contract: the snapshot uses Building.complete for construction
// state, only counts real Production components for isTraining, and only
// lists Gold resources as gold mines.

import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Movement, Faction, UnitType, Building, Health, UnitAI, Gatherer,
  Resource, Production,
} from '../src/ecs/components';
import { IsBuilding, IsUnit, IsResource } from '../src/ecs/tags';
import { AISystem } from '../src/ai/AISystem';
import {
  FactionId, BuildingTypeId, UnitTypeId, UnitAIState, ResourceType, NO_PRODUCTION,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

const AI = FactionId.Limburgers;

let world: World;
let ids: number[];
const isUnit = new Uint8Array(1024);
const isBuilding = new Uint8Array(1024);
const isResource = new Uint8Array(1024);
let trainCalls: { eid: number; unitType: UnitTypeId }[];

function spawnBuilding(
  type: BuildingTypeId,
  opts: { hp?: number; maxHp?: number; complete?: boolean; production?: boolean } = {},
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = 10;
  Position.z[eid] = 10;
  Faction.id[eid] = AI;
  Building.typeId[eid] = type;
  Building.complete[eid] = opts.complete === false ? 0 : 1;
  Building.progress[eid] = opts.complete === false ? 0 : 1;
  Health.max[eid] = opts.maxHp ?? 1000;
  Health.current[eid] = opts.hp ?? Health.max[eid];
  if (opts.production !== false) {
    addComponent(world, eid, Production);
    Production.unitType[eid] = NO_PRODUCTION;
  } else {
    // No Production component -- the shared array reads its default (0).
    Production.unitType[eid] = 0;
  }
  isBuilding[eid] = 1;
  ids.push(eid);
  return eid;
}

function spawnWorker(x: number, z: number): number {
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
  Faction.id[eid] = AI;
  UnitType.id[eid] = UnitTypeId.Worker;
  Health.current[eid] = 50;
  Health.max[eid] = 50;
  UnitAI.state[eid] = UnitAIState.Idle;
  isUnit[eid] = 1;
  ids.push(eid);
  return eid;
}

function spawnResource(type: ResourceType, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Resource);
  addComponent(world, eid, IsResource);
  Position.x[eid] = x;
  Position.z[eid] = z;
  Resource.type[eid] = type;
  Resource.amount[eid] = 500;
  Resource.maxAmount[eid] = 500;
  Faction.id[eid] = 255;
  isResource[eid] = 1;
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
      spawnBuilding: () => -1,
      startTraining: (eid, unitType) => {
        trainCalls.push({ eid, unitType });
        return true;
      },
      deductGold: () => true,
      getGold: () => 5000,
      getAllEntityIds: () => ids,
    },
  );
}

/** Run one AI decision tick (DECISION_INTERVAL = 2s). */
function tick(): void {
  AISystem.update(2.5, 30);
}

beforeEach(() => {
  world = replaceWorld();
  ids = [];
  trainCalls = [];
  isUnit.fill(0);
  isBuilding.fill(0);
  isResource.fill(0);
  AISystem.setFaction(AI, 'normal');
  configureAI();
});

describe('AISystem snapshot: building state', () => {
  it('still trains army when a completed tertiary building (no Production) exists', () => {
    spawnBuilding(BuildingTypeId.TownHall);
    const barracks = spawnBuilding(BuildingTypeId.Barracks);
    spawnBuilding(BuildingTypeId.TertiaryResourceBuilding, { production: false });

    tick();

    expect(trainCalls.some((c) => c.eid === barracks)).toBe(true);
  });

  it('still trains army from a damaged-but-complete barracks', () => {
    spawnBuilding(BuildingTypeId.TownHall);
    const barracks = spawnBuilding(BuildingTypeId.Barracks, { hp: 300, maxHp: 1000 });
    spawnBuilding(BuildingTypeId.TertiaryResourceBuilding, { production: false, hp: 100 });

    tick();

    expect(trainCalls.some((c) => c.eid === barracks)).toBe(true);
  });

  it('does not train from a barracks that is still under construction', () => {
    spawnBuilding(BuildingTypeId.TownHall);
    const barracks = spawnBuilding(BuildingTypeId.Barracks, { complete: false });

    tick();

    expect(trainCalls.some((c) => c.eid === barracks)).toBe(false);
  });
});

describe('AISystem snapshot: gold mines', () => {
  it('sends idle workers to a gold mine, never to a nearer tree', () => {
    spawnBuilding(BuildingTypeId.TownHall);
    const worker = spawnWorker(0, 0);
    spawnResource(ResourceType.Wood, 2, 0);
    const mine = spawnResource(ResourceType.Gold, 20, 0);

    tick();

    expect(Movement.hasTarget[worker]).toBe(1);
    expect(Movement.targetX[worker]).toBe(20);
    expect(Gatherer.targetEid[worker]).toBe(mine);
  });
});
