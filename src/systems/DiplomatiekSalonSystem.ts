/**
 * DiplomatiekSalonSystem.ts -- Belgen FactionSpecial1
 *
 * Every 90 seconds, each complete Belgen Diplomatiek Salon rolls a random
 * outcome: chocolade (+50 tertiary), resources (+200 gold +100 wood), or
 * spawn (1 free Bierbouwer Worker). A 'diplomatiek-event' bus event fires
 * so HUD/audio layers can react.
 *
 * Math.random() is in line with the existing codebase convention
 * (CombatSystem, ProductionSystem). Per-eid timer-state lives in a
 * module-scope Map; entries are cleaned up when their building disappears.
 */

import { query, hasComponent } from 'bitecs';
import { Position, Faction, Building } from '../ecs/components';
import { IsDead, IsBuilding } from '../ecs/tags';
import { FactionId, BuildingTypeId, UnitTypeId } from '../types/index';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import { createUnit } from '../entities/factories';
import type { GameWorld } from '../ecs/world';

const COOLDOWN_SECONDS = 90;
const CHOCOLADE_AMOUNT = 50;
const RESOURCES_GOLD = 200;
const RESOURCES_WOOD = 100;

const salonState = new Map<number, { cooldown: number }>();

/** Test-only: clear the per-eid timer state. */
export function _resetSalonState(): void {
  salonState.clear();
}

export function createDiplomatiekSalonSystem() {
  return function diplomatiekSalonSystem(world: GameWorld, dt: number): void {
    // 1) Find active Belgen Diplomatiek Salons
    const activeEids: number[] = [];
    const buildings = query(world, [Position, Building, Faction, IsBuilding]);
    for (const bEid of buildings) {
      if (Faction.id[bEid] !== FactionId.Belgen) continue;
      if (hasComponent(world, bEid, IsDead)) continue;
      if (Building.typeId[bEid] !== BuildingTypeId.FactionSpecial1) continue;
      if (Building.complete[bEid] !== 1) continue;
      activeEids.push(bEid);
    }

    // 2) Cleanup state for buildings that no longer exist
    for (const eid of salonState.keys()) {
      if (!activeEids.includes(eid)) salonState.delete(eid);
    }

    // 3) Tick each active building's cooldown; fire event on ready
    for (const eid of activeEids) {
      let state = salonState.get(eid);
      if (!state) {
        // Fresh spawn: start with full cooldown so build-rush can't insta-payout.
        salonState.set(eid, { cooldown: COOLDOWN_SECONDS });
        continue;
      }
      state.cooldown -= dt;
      if (state.cooldown > 0) continue;

      // Roll outcome
      const x = Position.x[eid];
      const z = Position.z[eid];
      const roll = Math.random();
      let outcome: 'chocolade' | 'resources' | 'spawn';
      if (roll < 0.33) {
        outcome = 'chocolade';
        playerState.addTertiary(FactionId.Belgen, CHOCOLADE_AMOUNT);
      } else if (roll < 0.66) {
        outcome = 'resources';
        playerState.addGold(FactionId.Belgen, RESOURCES_GOLD);
        playerState.addWood(FactionId.Belgen, RESOURCES_WOOD);
      } else {
        outcome = 'spawn';
        createUnit(world, UnitTypeId.Worker, FactionId.Belgen, x + 2, z);
      }
      eventBus.emit('diplomatiek-event', { outcome, x, z, eid });
      state.cooldown = COOLDOWN_SECONDS;
    }
  };
}
