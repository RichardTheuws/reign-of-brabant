/**
 * Bundel3-Boardroom.test.ts -- Randstad FactionSpecial1 ability
 *
 * Boardroom CEO Kwartaalcijfers: click to activate, +50% production speed for
 * 30s, 120s cooldown total. ProductionSystem reads boardroomBuff via 5th
 * duration-multiplier factor. Test the full state-machine + ProductionSystem
 * integration.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, Building, Production,
} from '../src/ecs/components';
import { IsBuilding } from '../src/ecs/tags';
import {
  activateBoardroom, isBoardroomReady, boardroomBuff, getBoardroomState,
  resetBureaucracy, createBureaucracySystem, BOARDROOM_PRODUCTION_MULT,
} from '../src/systems/BureaucracySystem';
import { createProductionSystem } from '../src/systems/ProductionSystem';
import { playerState } from '../src/core/PlayerState';
import {
  FactionId, BuildingTypeId, NO_PRODUCTION, UnitTypeId,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnProducingBuilding(world: World, faction: FactionId): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding, Production].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Building.typeId[eid] = BuildingTypeId.Barracks;
  Building.complete[eid] = 1;
  Production.unitType[eid] = UnitTypeId.Worker;
  Production.duration[eid] = 10; // 10s base
  Production.progress[eid] = 0;
  Production.queue0[eid] = NO_PRODUCTION;
  Production.queue1[eid] = NO_PRODUCTION;
  Production.queue2[eid] = NO_PRODUCTION;
  Production.queue3[eid] = NO_PRODUCTION;
  Production.queue4[eid] = NO_PRODUCTION;
  return eid;
}

beforeEach(() => {
  resetBureaucracy();
  playerState.reset();
});

describe('Boardroom — state machine', () => {
  it('initial: ready=true, active=false, cooldown=0', () => {
    expect(isBoardroomReady()).toBe(true);
    expect(boardroomBuff.active).toBe(false);
    expect(boardroomBuff.cooldown).toBe(0);
  });

  it('activate → active=true, remaining=30, cooldown=120', () => {
    expect(activateBoardroom()).toBe(true);
    expect(boardroomBuff.active).toBe(true);
    expect(boardroomBuff.remaining).toBe(30);
    expect(boardroomBuff.cooldown).toBe(120);
  });

  it('activate while already active → false (no double-fire)', () => {
    activateBoardroom();
    expect(activateBoardroom()).toBe(false);
    expect(boardroomBuff.remaining).toBe(30); // unchanged
  });

  it('tick 30s drops active=false, cooldown ≈ 90', () => {
    const world = replaceWorld();
    const sys = createBureaucracySystem();
    activateBoardroom();
    sys(world, 30.0);
    expect(boardroomBuff.active).toBe(false);
    expect(boardroomBuff.cooldown).toBeCloseTo(90, 1);
  });

  it('tick 120s total → cooldown=0, ready=true again', () => {
    const world = replaceWorld();
    const sys = createBureaucracySystem();
    activateBoardroom();
    sys(world, 60.0);
    sys(world, 60.5);
    expect(isBoardroomReady()).toBe(true);
    expect(boardroomBuff.cooldown).toBe(0);
  });

  it('getBoardroomState returns snapshot', () => {
    activateBoardroom();
    const s = getBoardroomState();
    expect(s.active).toBe(true);
    expect(s.remaining).toBe(30);
    expect(s.cooldown).toBe(120);
  });
});

describe('Boardroom — ProductionSystem integration', () => {
  it('Randstad: with active buff progresses faster than without', () => {
    const sys = createProductionSystem();
    // Without buff (with Randstad base bureaucracy)
    let world = replaceWorld();
    const idleEid = spawnProducingBuilding(world, FactionId.Randstad);
    sys(world, 0.5);
    const baselineProgress = Production.progress[idleEid];

    // With buff
    world = replaceWorld();
    activateBoardroom();
    const buffedEid = spawnProducingBuilding(world, FactionId.Randstad);
    sys(world, 0.5);
    const buffedProgress = Production.progress[buffedEid];

    expect(buffedProgress).toBeGreaterThan(baselineProgress);
    // ratio should be ~ 1 / 0.667 = 1.5x faster
    expect(buffedProgress / baselineProgress).toBeCloseTo(1 / BOARDROOM_PRODUCTION_MULT, 1);
  });

  it('Brabanders: Boardroom buff has NO effect (Randstad-only mod)', () => {
    const sys = createProductionSystem();
    let world = replaceWorld();
    const idleEid = spawnProducingBuilding(world, FactionId.Brabanders);
    sys(world, 0.5);
    const baselineProgress = Production.progress[idleEid];

    world = replaceWorld();
    activateBoardroom();
    const buffedEid = spawnProducingBuilding(world, FactionId.Brabanders);
    sys(world, 0.5);
    expect(Production.progress[buffedEid]).toBeCloseTo(baselineProgress, 4);
  });
});
