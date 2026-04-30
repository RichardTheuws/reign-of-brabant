/**
 * Manager re-vamp (v0.52.0) — Randstad Infantry hybrid harasser.
 *
 * Stats lock-in:
 *   - hp     : 85 (was 70)
 *   - range  : 5  (was 7)
 *   - attack : 7  (was 9)
 *   - meleeBackup flag toggles ranged/melee mode based on target distance.
 *
 * Behaviour invariants (CombatSystem):
 *   - Default mode = ranged (Attack.range = 5, Attack.damage = 7).
 *   - When a tracked target enters MELEE_BACKUP_THRESHOLD tiles, the Manager
 *     swaps to melee mode (Attack.range = MINIMUM_MELEE_RANGE, damage = 7).
 *   - When the target leaves MELEE_BACKUP_THRESHOLD + MELEE_BACKUP_HYSTERESIS,
 *     the Manager swaps back to ranged.
 *
 * Regression invariant: Consultant (no meleeBackup flag) MUST keep range 9 and
 * does NOT get the MeleeBackup component — guards against accidental cross-unit
 * regression of the new flag.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent, hasComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position,
  Health,
  Attack,
  Armor,
  Faction,
  UnitAI,
  Movement,
  Velocity,
  UnitType,
  MeleeBackup,
} from '../src/ecs/components';
import { IsUnit } from '../src/ecs/tags';
import { createCombatSystem } from '../src/systems/CombatSystem';
import { getFactionUnitArchetype } from '../src/data/factionData';
import { createFactionUnit } from '../src/entities/factories';
import {
  FactionId,
  UnitTypeId,
  UnitAIState,
  AttackType,
  ArmorType,
  NO_ENTITY,
  MINIMUM_MELEE_RANGE,
  MELEE_BACKUP_THRESHOLD,
  MELEE_BACKUP_HYSTERESIS,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Spawn a bare attacker target — no MeleeBackup, no UnitAI; just a sandbag. */
function spawnSandbag(world: World, x: number, z: number, hp = 500): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Health);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Health.current[eid] = hp;
  Health.max[eid] = hp;
  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Unarmored;
  Faction.id[eid] = FactionId.Brabanders; // enemy of Randstad
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  return eid;
}

/** Spawn a Manager via the real factory so the MeleeBackup wiring is exercised. */
function spawnManager(world: World, x: number, z: number): number {
  return createFactionUnit(world, FactionId.Randstad, 'Manager', x, z);
}

// ---------------------------------------------------------------------------
// Stats lock-in (factionData)
// ---------------------------------------------------------------------------
describe('Manager re-vamp — stats lock', () => {
  it('Randstad Manager archetype has the v0.52.0 stats', () => {
    const arch = getFactionUnitArchetype(FactionId.Randstad, UnitTypeId.Infantry);
    expect(arch.name).toBe('Manager');
    expect(arch.hp).toBe(85);
    expect(arch.attack).toBe(7);
    expect(arch.range).toBe(5);
    expect(arch.armorType).toBe(ArmorType.Medium);
    expect(arch.armor).toBe(1);
  });

  it('Randstad Manager archetype declares meleeBackup: true', () => {
    const arch = getFactionUnitArchetype(FactionId.Randstad, UnitTypeId.Infantry);
    expect(arch.meleeBackup).toBe(true);
  });

  it('Randstad Consultant does NOT have the meleeBackup flag (regression)', () => {
    const arch = getFactionUnitArchetype(FactionId.Randstad, UnitTypeId.Ranged);
    expect(arch.name).toBe('Consultant');
    expect(arch.meleeBackup).toBeUndefined();
    expect(arch.range).toBe(9); // pure ranged debuffer, untouched
  });
});

// ---------------------------------------------------------------------------
// MeleeBackup component wiring
// ---------------------------------------------------------------------------
describe('Manager re-vamp — meleeBackup component', () => {
  beforeEach(() => { replaceWorld(); });

  it('spawned Manager has the MeleeBackup component with cached profiles', () => {
    const world = replaceWorld();
    const eid = spawnManager(world, 0, 0);

    expect(hasComponent(world, eid, MeleeBackup)).toBe(true);
    expect(MeleeBackup.mode[eid]).toBe(0); // default = ranged mode
    expect(MeleeBackup.rangedRange[eid]).toBe(5);
    expect(MeleeBackup.rangedDamage[eid]).toBe(7);
    expect(MeleeBackup.meleeRange[eid]).toBe(MINIMUM_MELEE_RANGE);
    expect(MeleeBackup.meleeDamage[eid]).toBe(7);
  });

  it('Attack.range / damage start in ranged mode after spawn', () => {
    const world = replaceWorld();
    const eid = spawnManager(world, 0, 0);

    expect(Attack.range[eid]).toBe(5);
    expect(Attack.damage[eid]).toBe(7);
    expect(Attack.attackType[eid]).toBe(AttackType.Ranged);
  });

  it('Consultant does NOT get the MeleeBackup component (regression)', () => {
    const world = replaceWorld();
    const consultant = createFactionUnit(world, FactionId.Randstad, 'Consultant', 0, 0);
    expect(hasComponent(world, consultant, MeleeBackup)).toBe(false);
  });

  it('a Brabander Carnavalvierder does NOT get MeleeBackup (regression)', () => {
    const world = replaceWorld();
    const cv = createFactionUnit(world, FactionId.Brabanders, 'Carnavalvierder', 0, 0);
    expect(hasComponent(world, cv, MeleeBackup)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CombatSystem — mode-switch behaviour
// ---------------------------------------------------------------------------
describe('Manager re-vamp — CombatSystem mode switch', () => {
  it('switches to melee mode when the target is within MELEE_BACKUP_THRESHOLD', () => {
    const world = replaceWorld();
    const manager = spawnManager(world, 0, 0);
    // Distance 1.5 tiles → well inside the 2-tile threshold
    const target = spawnSandbag(world, 1.5, 0);

    // Engage manually so processAttacking runs.
    UnitAI.state[manager] = UnitAIState.Attacking;
    UnitAI.targetEid[manager] = target;
    Attack.timer[manager] = 0; // ready to fire

    createCombatSystem()(world, 0.016);

    expect(MeleeBackup.mode[manager]).toBe(1);
    expect(Attack.range[manager]).toBe(MINIMUM_MELEE_RANGE);
    expect(Attack.damage[manager]).toBe(7);
  });

  it('stays in ranged mode when the target is just past the threshold', () => {
    const world = replaceWorld();
    const manager = spawnManager(world, 0, 0);
    // Distance 3 tiles → outside threshold (2 + 0.5 hysteresis = 2.5)
    const target = spawnSandbag(world, 3.0, 0);

    UnitAI.state[manager] = UnitAIState.Attacking;
    UnitAI.targetEid[manager] = target;
    Attack.timer[manager] = 0;

    createCombatSystem()(world, 0.016);

    expect(MeleeBackup.mode[manager]).toBe(0);
    expect(Attack.range[manager]).toBe(5);
    expect(Attack.damage[manager]).toBe(7);
  });

  it('switches BACK to ranged once the target moves outside the hysteresis band', () => {
    const world = replaceWorld();
    const manager = spawnManager(world, 0, 0);
    const target = spawnSandbag(world, 1.0, 0);

    UnitAI.state[manager] = UnitAIState.Attacking;
    UnitAI.targetEid[manager] = target;
    Attack.timer[manager] = 0;

    // 1) Target close → enter melee.
    createCombatSystem()(world, 0.016);
    expect(MeleeBackup.mode[manager]).toBe(1);
    expect(Attack.range[manager]).toBe(MINIMUM_MELEE_RANGE);

    // 2) Target moves out past threshold + hysteresis (2.5) → back to ranged.
    Position.x[target] = 4.0;
    Attack.timer[manager] = 0; // reset cooldown so the system processes
    createCombatSystem()(world, 0.016);

    expect(MeleeBackup.mode[manager]).toBe(0);
    expect(Attack.range[manager]).toBe(5);
    expect(Attack.damage[manager]).toBe(7);
  });

  it('hysteresis prevents flicker: at 2.0 tiles after entering melee, stays in melee', () => {
    const world = replaceWorld();
    const manager = spawnManager(world, 0, 0);
    const target = spawnSandbag(world, 1.0, 0);

    UnitAI.state[manager] = UnitAIState.Attacking;
    UnitAI.targetEid[manager] = target;
    Attack.timer[manager] = 0;

    createCombatSystem()(world, 0.016);
    expect(MeleeBackup.mode[manager]).toBe(1);

    // Move target to exactly the enter-threshold (2.0). Exit needs 2.5 → still melee.
    Position.x[target] = 2.0;
    Attack.timer[manager] = 0;
    createCombatSystem()(world, 0.016);

    expect(MeleeBackup.mode[manager]).toBe(1);
    expect(Attack.range[manager]).toBe(MINIMUM_MELEE_RANGE);
  });
});

// ---------------------------------------------------------------------------
// Constants sanity (so a future refactor doesn't silently drift the design)
// ---------------------------------------------------------------------------
describe('Manager re-vamp — constants', () => {
  it('MELEE_BACKUP_THRESHOLD matches the design spec (2 tiles)', () => {
    expect(MELEE_BACKUP_THRESHOLD).toBe(2);
  });
  it('MELEE_BACKUP_HYSTERESIS is small and positive', () => {
    expect(MELEE_BACKUP_HYSTERESIS).toBeGreaterThan(0);
    expect(MELEE_BACKUP_HYSTERESIS).toBeLessThan(MELEE_BACKUP_THRESHOLD);
  });
});
