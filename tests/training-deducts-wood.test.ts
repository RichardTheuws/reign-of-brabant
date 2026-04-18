// RED test for Bug 12 — unit training only deducted gold, never wood.
//
// User feedback: "controleer of de benodigde resources (wood & gold)
// correct werken". The HUD shows '75g + 25h' for a Carnavalvierder but
// playerState.wood was never reduced.
//
// Root cause (v0.37.15): CommandSystem.handleTrain calls
// playerState.spend(factionId, cost) -- that method only touches gold.
// There is no spendWood() companion call.
//
// Post-fix contract: training a unit whose archetype has costSecondary > 0
// must also deduct that amount from the player's wood stockpile, and
// refuse the command if the player cannot afford BOTH.

import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, Health, Building, Production,
} from '../src/ecs/components';
import { IsBuilding } from '../src/ecs/tags';
import { queueCommand, createCommandSystem } from '../src/systems/CommandSystem';
import { playerState } from '../src/core/PlayerState';
import {
  FactionId, BuildingTypeId, UnitTypeId, NO_PRODUCTION,
} from '../src/types/index';

function spawnBarracks(
  world: ReturnType<typeof replaceWorld>,
  factionId: FactionId,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Health);
  addComponent(world, eid, Building);
  addComponent(world, eid, Production);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = 0;
  Position.z[eid] = 0;
  Faction.id[eid] = factionId;
  Health.current[eid] = 600;
  Health.max[eid] = 600;
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

describe('Bug 12 — unit training deducts both gold AND wood', () => {
  beforeEach(() => {
    replaceWorld();
    playerState.reset();
  });

  it('deducts wood when training a unit with costSecondary > 0', () => {
    const world = replaceWorld();
    playerState.reset();
    const f = FactionId.Brabanders;
    playerState.addGold(f, 500);    // plenty
    playerState.addWood(f, 500);    // plenty
    const startGold = playerState.getGold(f);
    const startWood = playerState.getWood(f);

    const barracks = spawnBarracks(world, f);

    // Carnavalvierder (Brabanders infantry) costs 75g + 25h
    queueCommand({
      type: 'train',
      buildingEid: barracks,
      unitTypeId: UnitTypeId.Infantry,
      cost: 0,
    });
    const system = createCommandSystem();
    system(world, 0.016);

    expect(playerState.getGold(f)).toBe(startGold - 75);
    expect(playerState.getWood(f)).toBe(startWood - 25);
  });

  it('refuses training if player cannot afford the wood cost', () => {
    const world = replaceWorld();
    playerState.reset();
    const f = FactionId.Brabanders;
    playerState.addGold(f, 500);
    // NO wood given -- default is whatever reset sets. Force it to 0.
    const initialWood = playerState.getWood(f);
    if (initialWood > 0) playerState.addWood(f, -initialWood);
    expect(playerState.getWood(f)).toBe(0);

    const barracks = spawnBarracks(world, f);
    const startGold = playerState.getGold(f);

    queueCommand({
      type: 'train',
      buildingEid: barracks,
      unitTypeId: UnitTypeId.Infantry, // needs 25 wood
      cost: 0,
    });
    const system = createCommandSystem();
    system(world, 0.016);

    // Nothing should change -- no production, no gold spent.
    expect(playerState.getGold(f)).toBe(startGold);
    expect(playerState.getWood(f)).toBe(0);
    expect(Production.unitType[barracks]).toBe(NO_PRODUCTION);
  });

  it('still deducts gold-only for units without a wood cost (Worker)', () => {
    const world = replaceWorld();
    playerState.reset();
    const f = FactionId.Brabanders;
    playerState.addGold(f, 500);
    const startGold = playerState.getGold(f);
    const startWood = playerState.getWood(f);

    const barracks = spawnBarracks(world, f);
    queueCommand({
      type: 'train',
      buildingEid: barracks,
      unitTypeId: UnitTypeId.Worker, // 50g, 0h
      cost: 0,
    });
    const system = createCommandSystem();
    system(world, 0.016);

    expect(playerState.getGold(f)).toBe(startGold - 50);
    expect(playerState.getWood(f)).toBe(startWood); // unchanged
  });
});
