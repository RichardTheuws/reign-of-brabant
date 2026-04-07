/**
 * Reign of Brabant -- Production System
 *
 * Ticks production progress on buildings with an active Production component.
 * When progress reaches 1.0, spawns the trained unit and shifts the queue.
 * Population cap is checked before spawning.
 *
 * Note: Gold is deducted at command time (in CommandSystem), not here.
 */

import { query, addEntity, addComponent, hasComponent } from 'bitecs';
import {
  Position,
  Production,
  Building,
  Faction,
  Health,
  Attack,
  Armor,
  Movement,
  UnitAI,
  Gatherer,
  Visibility,
  UnitType,
  Rotation,
  Selected,
  GezeligheidBonus,
  RallyPoint,
} from '../ecs/components';
import { IsBuilding, IsUnit, IsWorker, IsDead } from '../ecs/tags';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import {
  FactionId,
  UnitTypeId,
  UnitAIState,
  NO_PRODUCTION,
  NO_ENTITY,
  CARRY_CAPACITY,
  MAP_SIZE,
} from '../types/index';
import { onRandstadActionCompleted } from './BureaucracySystem';
import { ceoProductionBuff } from './HeroSystem';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Unit archetype stats (inline for PoC simplicity)
// ---------------------------------------------------------------------------
interface UnitTemplate {
  hp: number;
  attack: number;
  attackSpeed: number;
  armor: number;
  speed: number;
  range: number;
  sightRange: number;
  population: number;
  carryCapacity: number;
  isWorker: boolean;
}

const UNIT_TEMPLATES: Record<number, UnitTemplate> = {
  [UnitTypeId.Worker]: {
    hp: 30,
    attack: 5,
    attackSpeed: 2.0,
    armor: 0,
    speed: 4.5,
    range: 1.0,
    sightRange: 8,
    population: 1,
    carryCapacity: CARRY_CAPACITY,
    isWorker: true,
  },
  [UnitTypeId.Infantry]: {
    hp: 60,
    attack: 12,
    attackSpeed: 1.5,
    armor: 2,
    speed: 4.0,
    range: 1.0,
    sightRange: 8,
    population: 1,
    carryCapacity: 0,
    isWorker: false,
  },
  [UnitTypeId.Ranged]: {
    hp: 40,
    attack: 10,
    attackSpeed: 1.8,
    armor: 0,
    speed: 3.8,
    range: 6.0,
    sightRange: 10,
    population: 1,
    carryCapacity: 0,
    isWorker: false,
  },
};

/** Randstad-specific unit templates (individually stronger, different stats). */
const RANDSTAD_UNIT_TEMPLATES: Record<number, UnitTemplate> = {
  [UnitTypeId.Worker]: {
    hp: 45,
    attack: 3,
    attackSpeed: 1.5,
    armor: 0,
    speed: 5.5,
    range: 1.0,
    sightRange: 8,
    population: 1,
    carryCapacity: 8,   // Stagiair carries less
    isWorker: true,
  },
  [UnitTypeId.Infantry]: {
    hp: 70,
    attack: 9,
    attackSpeed: 1.5,
    armor: 1,
    speed: 4.5,
    range: 7.0,         // Manager is ranged!
    sightRange: 9,
    population: 1,
    carryCapacity: 0,
    isWorker: false,
  },
  [UnitTypeId.Ranged]: {
    hp: 55,
    attack: 7,
    attackSpeed: 1.8,
    armor: 0,
    speed: 5.0,
    range: 9.0,          // Consultant has longer range
    sightRange: 11,
    population: 1,
    carryCapacity: 0,
    isWorker: false,
  },
};

// Rally point offset from building center
const RALLY_OFFSET = 3.0;

/**
 * Create the production system.
 */
export function createProductionSystem() {
  return function productionSystem(world: GameWorld, dt: number): void {
    const buildings = query(world, [Building, Production, IsBuilding]);

    for (const bEid of buildings) {
      // Skip incomplete or dead buildings
      if (Building.complete[bEid] !== 1) continue;
      if (hasComponent(world, bEid, IsDead)) continue;

      // Skip if not producing anything
      if (Production.unitType[bEid] === NO_PRODUCTION) continue;

      // Tick progress
      const duration = Production.duration[bEid];
      if (duration <= 0) continue;

      // Apply Bureaucracy modifier for Randstad faction
      const factionId = Faction.id[bEid];
      const bureaucracyMod = playerState.getBureaucracyModifier(factionId);
      // Apply CEO Kwartaalcijfers production buff (+50% speed = 0.667 duration mult)
      const ceoBuff = (ceoProductionBuff.active && factionId === FactionId.Randstad)
        ? 0.667
        : 1.0;
      const effectiveDuration = duration * bureaucracyMod * ceoBuff;

      Production.progress[bEid] += dt / effectiveDuration;

      // Unit complete
      if (Production.progress[bEid] >= 1.0) {
        const unitTypeId = Production.unitType[bEid];

        // Check population cap before spawning
        if (playerState.hasPopulationRoom(factionId)) {
          spawnUnit(world, bEid, unitTypeId, factionId);
          playerState.addPopulation(factionId);

          // Notify Bureaucracy system of completed action
          onRandstadActionCompleted(factionId);
        }
        // If no room, the unit is simply lost (could be improved with
        // queue pausing, but PoC keeps it simple)

        // Shift queue: move next queued unit into production
        shiftQueue(bEid);
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Unit spawning
// ---------------------------------------------------------------------------

function spawnUnit(
  world: GameWorld,
  buildingEid: number,
  unitTypeId: number,
  factionId: number,
): void {
  // Use Randstad-specific templates for the Randstad/AI faction
  const templates = factionId === FactionId.Randstad ? RANDSTAD_UNIT_TEMPLATES : UNIT_TEMPLATES;
  const template = templates[unitTypeId];
  if (!template) return;

  const eid = addEntity(world);

  // Position at rally point (offset from building) with random scatter, clamped to map bounds
  addComponent(world, eid, Position);
  const halfMap = MAP_SIZE / 2;
  const scatterX = (Math.random() - 0.5) * 3.0; // +-1.5 units
  const scatterZ = (Math.random() - 0.5) * 3.0; // +-1.5 units
  Position.x[eid] = Math.max(-halfMap + 1, Math.min(halfMap - 1, Position.x[buildingEid] + RALLY_OFFSET + scatterX));
  Position.y[eid] = Position.y[buildingEid];
  Position.z[eid] = Math.max(-halfMap + 1, Math.min(halfMap - 1, Position.z[buildingEid] + RALLY_OFFSET + scatterZ));

  // Health
  addComponent(world, eid, Health);
  Health.current[eid] = template.hp;
  Health.max[eid] = template.hp;

  // Attack
  addComponent(world, eid, Attack);
  Attack.damage[eid] = template.attack;
  Attack.speed[eid] = template.attackSpeed;
  Attack.range[eid] = template.range;
  Attack.timer[eid] = 0;

  // Armor
  addComponent(world, eid, Armor);
  Armor.value[eid] = template.armor;

  // Movement
  addComponent(world, eid, Movement);
  Movement.speed[eid] = template.speed;
  Movement.hasTarget[eid] = 0;

  // Faction
  addComponent(world, eid, Faction);
  Faction.id[eid] = factionId;

  // UnitType
  addComponent(world, eid, UnitType);
  UnitType.id[eid] = unitTypeId;

  // UnitAI
  addComponent(world, eid, UnitAI);
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;

  // Visibility
  addComponent(world, eid, Visibility);
  Visibility.range[eid] = template.sightRange;

  // Rotation (for facing direction in renderer)
  addComponent(world, eid, Rotation);
  Rotation.y[eid] = 0;

  // Selected (default: not selected)
  addComponent(world, eid, Selected);
  Selected.by[eid] = 255;

  // GezeligheidBonus (initialize to neutral defaults; GezeligheidSystem
  // will write actual bonuses for Brabander units)
  addComponent(world, eid, GezeligheidBonus);
  GezeligheidBonus.nearbyCount[eid] = 0;
  GezeligheidBonus.attackMult[eid] = 1.0;
  GezeligheidBonus.speedMult[eid] = 1.0;
  GezeligheidBonus.armorMult[eid] = 1.0;
  GezeligheidBonus.passiveHeal[eid] = 0;
  GezeligheidBonus.damageReduction[eid] = 0;

  // Tags
  addComponent(world, eid, IsUnit);

  // Worker-specific
  if (template.isWorker) {
    addComponent(world, eid, IsWorker);
    addComponent(world, eid, Gatherer);
    Gatherer.state[eid] = 0;
    Gatherer.carryCapacity[eid] = template.carryCapacity;
    Gatherer.carrying[eid] = 0;
    Gatherer.targetEid[eid] = NO_ENTITY;
    Gatherer.previousTarget[eid] = NO_ENTITY;
  }

  // Send unit to rally point if building has a custom rally point set
  if (hasComponent(world, buildingEid, RallyPoint)) {
    const rx = RallyPoint.x[buildingEid];
    const rz = RallyPoint.z[buildingEid];
    // Check if rally point differs from the default offset position
    const defaultRallyX = Position.x[buildingEid] + 3;
    const defaultRallyZ = Position.z[buildingEid];
    const isCustomRally = Math.abs(rx - defaultRallyX) > 0.5 || Math.abs(rz - defaultRallyZ) > 0.5;
    if (isCustomRally) {
      Movement.targetX[eid] = rx;
      Movement.targetZ[eid] = rz;
      Movement.hasTarget[eid] = 1;
      UnitAI.state[eid] = UnitAIState.Moving;
    }
  }

  // Emit event
  eventBus.emit('unit-trained', {
    entityId: eid,
    factionId: factionId as FactionId,
    unitTypeId: unitTypeId as UnitTypeId,
    buildingEntityId: buildingEid,
  });
}

// ---------------------------------------------------------------------------
// Queue management
// ---------------------------------------------------------------------------

/**
 * Shift the production queue: move queue[0] into active production,
 * shift everything down by one slot.
 */
function shiftQueue(bEid: number): void {
  const slots = [
    Production.queue0,
    Production.queue1,
    Production.queue2,
    Production.queue3,
    Production.queue4,
  ];

  // Check if queue has another item
  const nextType = slots[0][bEid];

  if (nextType !== NO_PRODUCTION) {
    // Start producing next item
    Production.unitType[bEid] = nextType;
    Production.progress[bEid] = 0;

    // Determine build time for next unit
    const template = UNIT_TEMPLATES[nextType];
    if (template) {
      // Duration was already set when queued, but we recalculate for safety
      const buildTimes: Record<number, number> = {
        [UnitTypeId.Worker]: 12,
        [UnitTypeId.Infantry]: 18,
        [UnitTypeId.Ranged]: 20,
      };
      Production.duration[bEid] = buildTimes[nextType] || 15;
    }

    // Shift queue slots down
    for (let i = 0; i < slots.length - 1; i++) {
      slots[i][bEid] = slots[i + 1][bEid];
    }
    slots[slots.length - 1][bEid] = NO_PRODUCTION;
  } else {
    // Queue empty -- stop producing
    Production.unitType[bEid] = NO_PRODUCTION;
    Production.progress[bEid] = 0;
  }
}
