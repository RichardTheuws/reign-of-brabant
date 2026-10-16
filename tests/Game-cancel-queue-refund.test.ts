/**
 * Game-cancel-queue-refund.test.ts -- cancelling a unit refunds what was charged
 *
 * CommandSystem.handleTrain charges gold AND wood (costSecondary) at queue
 * time. Game.cancelProductionQueueItem only refunded gold, so every cancel of
 * a wood-costing unit silently burned the wood.
 *
 * Behavioral test: the private method is invoked on Game.prototype with a
 * minimal `this` (Game itself needs WebGL to construct).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Health, Building, Production } from '../src/ecs/components';
import { IsBuilding } from '../src/ecs/tags';
import { Game } from '../src/core/Game';
import { playerState } from '../src/core/PlayerState';
import { getUnitsForFaction } from '../src/data/factionData';
import { FactionId, BuildingTypeId, NO_PRODUCTION, type UnitTypeId } from '../src/types/index';

const FACTION = FactionId.Brabanders;

function spawnBarracks(): number {
  const world = replaceWorld();
  const eid = addEntity(world);
  [Position, Faction, Health, Building, Production, IsBuilding].forEach(c => addComponent(world, eid, c));
  Faction.id[eid] = FACTION;
  Building.typeId[eid] = BuildingTypeId.Barracks;
  Building.complete[eid] = 1;
  Production.unitType[eid] = NO_PRODUCTION;
  Production.queue0[eid] = NO_PRODUCTION;
  Production.queue1[eid] = NO_PRODUCTION;
  Production.queue2[eid] = NO_PRODUCTION;
  Production.queue3[eid] = NO_PRODUCTION;
  Production.queue4[eid] = NO_PRODUCTION;
  return eid;
}

function cancel(buildingId: number, queueIndex: number): void {
  const fakeThis = {
    playerFactionId: FACTION,
    playerState,
    hud: null,
    selectedEntities: [] as number[],
    onSelectionChanged: () => {},
  };
  (Game.prototype as unknown as {
    cancelProductionQueueItem: (b: number, i: number) => void;
  }).cancelProductionQueueItem.call(fakeThis, buildingId, queueIndex);
}

const woodUnit = getUnitsForFaction(FACTION).find(u => u.costSecondary > 0 && u.costGold > 0)!;

beforeEach(() => {
  playerState.reset();
});

describe('cancelProductionQueueItem refunds every charged resource', () => {
  it('fixture: a Brabander unit with a wood cost exists', () => {
    expect(woodUnit).toBeTruthy();
  });

  it('cancelling the unit in production refunds gold and wood', () => {
    const b = spawnBarracks();
    Production.unitType[b] = woodUnit.typeId as UnitTypeId;
    const gold = playerState.getGold(FACTION);
    const wood = playerState.getWood(FACTION);

    cancel(b, 0);

    expect(Production.unitType[b]).toBe(NO_PRODUCTION);
    expect(playerState.getGold(FACTION)).toBe(gold + woodUnit.costGold);
    expect(playerState.getWood(FACTION)).toBe(wood + woodUnit.costSecondary);
  });

  it('cancelling a queued unit refunds gold and wood', () => {
    const b = spawnBarracks();
    Production.unitType[b] = woodUnit.typeId as UnitTypeId;
    Production.queue0[b] = woodUnit.typeId as UnitTypeId;
    const gold = playerState.getGold(FACTION);
    const wood = playerState.getWood(FACTION);

    cancel(b, 1);

    expect(Production.queue0[b]).toBe(NO_PRODUCTION);
    expect(playerState.getGold(FACTION)).toBe(gold + woodUnit.costGold);
    expect(playerState.getWood(FACTION)).toBe(wood + woodUnit.costSecondary);
  });
});
