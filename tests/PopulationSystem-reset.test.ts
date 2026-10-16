/**
 * PopulationSystem-reset.test.ts — "new game starts on top of previous match".
 *
 * Bug: createPopulationSystem() kept its processed-eid Set inside the factory
 * closure. The pipeline is created once (Game constructor), so the Set survived
 * world resets between matches. bitECS recycles eids after a reset, so a
 * building dying next match with an eid that already died last match was
 * skipped — its population capacity was never subtracted.
 *
 * Contract: resetPopulationSystem() clears the processed set, and Game.cleanup()
 * calls it (asserted in Game-new-match-cleanup.test.ts).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Building, Faction } from '../src/ecs/components';
import { IsBuilding, IsDead } from '../src/ecs/tags';
import { createPopulationSystem, resetPopulationSystem } from '../src/systems/PopulationSystem';
import { playerState } from '../src/core/PlayerState';
import { FactionId, BuildingTypeId } from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnDeadTownHall(world: World): number {
  const eid = addEntity(world);
  addComponent(world, eid, Building);
  addComponent(world, eid, Faction);
  addComponent(world, eid, IsBuilding);
  addComponent(world, eid, IsDead);
  Building.typeId[eid] = BuildingTypeId.TownHall;
  Building.complete[eid] = 1;
  Faction.id[eid] = FactionId.Brabanders;
  return eid;
}

describe('PopulationSystem — processed set across world resets', () => {
  beforeEach(() => {
    playerState.reset();
    resetPopulationSystem?.();
  });

  it('applies the capacity reduction again for a recycled eid after resetPopulationSystem()', () => {
    const system = createPopulationSystem();

    // Match 1: town hall dies → capacity drops.
    let world = replaceWorld();
    playerState.addPopulationCapacity(FactionId.Brabanders, 20);
    const eid1 = spawnDeadTownHall(world);
    const before1 = playerState.getPopulationMax(FactionId.Brabanders);
    system(world, 0.016);
    const after1 = playerState.getPopulationMax(FactionId.Brabanders);
    expect(after1).toBeLessThan(before1);

    // New match: fresh world, same pipeline instance (as in Game.ts).
    resetPopulationSystem();
    playerState.reset();
    world = replaceWorld();
    playerState.addPopulationCapacity(FactionId.Brabanders, 20);
    const eid2 = spawnDeadTownHall(world);
    expect(eid2).toBe(eid1); // eid recycled — the precondition for the bug

    const before2 = playerState.getPopulationMax(FactionId.Brabanders);
    system(world, 0.016);
    const after2 = playerState.getPopulationMax(FactionId.Brabanders);
    expect(after2).toBeLessThan(before2);
  });
});
