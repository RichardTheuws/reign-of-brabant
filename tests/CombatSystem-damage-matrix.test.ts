/**
 * CombatSystem-damage-matrix.test.ts -- Locks F4-stap 20: damage/armor matrix.
 *
 * Audit-context: full-playthrough audit Fase 4 stap 20. Tests the FULL damage
 * pipeline as it's actually executed by createCombatSystem(), not just the
 * pure formula extracted in CombatSystem.test.ts.
 *
 * Pipeline order (CombatSystem.ts:163-201):
 *  1. attackerDamage = Attack.damage * GezeligheidBonus.attackMult
 *  2. siegeBonus if target is building (and Attack.siegeBonus > 1.0)
 *  3. armor-type modifier via DAMAGE_MODIFIERS table
 *  4. UPKEEP_DEBT_EFFECTIVENESS if attacker faction in upkeep debt
 *  5. AI scaling for non-player factions (skipped here, world.elapsed=0)
 *  6. rawDamage = attackerDamage - targetArmor*ARMOR_FACTOR
 *  7. effectiveDamage = max(MIN_DAMAGE, rawDamage)
 *  8. GezeligheidBonus.damageReduction on target
 *  9. effectiveDamage = max(MIN_DAMAGE, effectiveDamage)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Movement, Attack, Armor, Health,
} from '../src/ecs/components';
import { IsUnit, IsBuilding } from '../src/ecs/tags';
import { createCombatSystem } from '../src/systems/CombatSystem';
import {
  FactionId, UnitAIState, NO_ENTITY, AttackType, ArmorType, MIN_DAMAGE,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnAttacker(
  world: World,
  attackType: number,
  damage = 10,
  splash = 0,
  siegeBonus = 1.0,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Movement);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Health);
  addComponent(world, eid, IsUnit);
  Position.x[eid] = 0;
  Position.z[eid] = 0;
  Faction.id[eid] = FactionId.Brabanders;
  Movement.hasTarget[eid] = 0;
  UnitAI.state[eid] = UnitAIState.Attacking;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Attack.damage[eid] = damage;
  Attack.range[eid] = 5;
  Attack.speed[eid] = 1.0;
  Attack.cooldown[eid] = 1.0;
  Attack.timer[eid] = 0; // fire immediately
  Attack.attackType[eid] = attackType;
  Attack.siegeBonus[eid] = siegeBonus;
  Attack.splashRadius[eid] = splash;
  Armor.value[eid] = 0;
  Armor.type[eid] = ArmorType.Light;
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  return eid;
}

function spawnDefender(
  world: World,
  armorType: number,
  armorValue = 0,
  isBuilding = false,
  hp = 1000,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, UnitAI);
  addComponent(world, eid, Attack);
  addComponent(world, eid, Armor);
  addComponent(world, eid, Health);
  if (isBuilding) addComponent(world, eid, IsBuilding);
  else addComponent(world, eid, IsUnit);
  Position.x[eid] = 1.0; // within attacker range
  Position.z[eid] = 0;
  Faction.id[eid] = FactionId.Randstad;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Attack.damage[eid] = 0;
  Attack.range[eid] = 0;
  Attack.timer[eid] = 999;       // can't retaliate this tick
  Attack.attackType[eid] = AttackType.Melee;
  Attack.siegeBonus[eid] = 1.0;
  Armor.value[eid] = armorValue;
  Armor.type[eid] = armorType;
  Health.current[eid] = hp;
  Health.max[eid] = hp;
  return eid;
}

const combat = createCombatSystem();
const tickCombat = (w: World) => combat(w, 0.016);

// ---------------------------------------------------------------------------
// 4 × 5 DAMAGE_MODIFIERS table (CombatSystem.ts:55-61)
// ---------------------------------------------------------------------------
//                  Unarmored Light   Medium  Heavy   Building
// Melee            1.0       1.5     1.0     1.0     1.0
// Ranged           1.0       1.0     1.5     1.0     1.0
// Siege            1.0       1.0     1.0     1.0     2.0
// Magic            1.0       1.0     1.0     1.5     1.0
// ---------------------------------------------------------------------------

interface MatrixCase {
  attackType: number;
  armorType: number;
  expectedMultiplier: number;
  label: string;
}

const MATRIX: MatrixCase[] = [
  // Melee row
  { attackType: AttackType.Melee, armorType: ArmorType.Unarmored, expectedMultiplier: 1.0, label: 'Melee→Unarmored' },
  { attackType: AttackType.Melee, armorType: ArmorType.Light,     expectedMultiplier: 1.5, label: 'Melee→Light (PRD bonus +50%)' },
  { attackType: AttackType.Melee, armorType: ArmorType.Medium,    expectedMultiplier: 1.0, label: 'Melee→Medium' },
  { attackType: AttackType.Melee, armorType: ArmorType.Heavy,     expectedMultiplier: 1.0, label: 'Melee→Heavy' },
  { attackType: AttackType.Melee, armorType: ArmorType.Building,  expectedMultiplier: 1.0, label: 'Melee→Building' },
  // Ranged row
  { attackType: AttackType.Ranged, armorType: ArmorType.Unarmored, expectedMultiplier: 1.0, label: 'Ranged→Unarmored' },
  { attackType: AttackType.Ranged, armorType: ArmorType.Light,     expectedMultiplier: 1.0, label: 'Ranged→Light' },
  { attackType: AttackType.Ranged, armorType: ArmorType.Medium,    expectedMultiplier: 1.5, label: 'Ranged→Medium (PRD bonus +50%)' },
  { attackType: AttackType.Ranged, armorType: ArmorType.Heavy,     expectedMultiplier: 1.0, label: 'Ranged→Heavy' },
  { attackType: AttackType.Ranged, armorType: ArmorType.Building,  expectedMultiplier: 1.0, label: 'Ranged→Building' },
  // Siege row
  { attackType: AttackType.Siege,  armorType: ArmorType.Unarmored, expectedMultiplier: 1.0, label: 'Siege→Unarmored' },
  { attackType: AttackType.Siege,  armorType: ArmorType.Light,     expectedMultiplier: 1.0, label: 'Siege→Light' },
  { attackType: AttackType.Siege,  armorType: ArmorType.Medium,    expectedMultiplier: 1.0, label: 'Siege→Medium' },
  { attackType: AttackType.Siege,  armorType: ArmorType.Heavy,     expectedMultiplier: 1.0, label: 'Siege→Heavy' },
  { attackType: AttackType.Siege,  armorType: ArmorType.Building,  expectedMultiplier: 2.0, label: 'Siege→Building (PRD bonus +100%)' },
  // Magic row
  { attackType: AttackType.Magic,  armorType: ArmorType.Unarmored, expectedMultiplier: 1.0, label: 'Magic→Unarmored' },
  { attackType: AttackType.Magic,  armorType: ArmorType.Light,     expectedMultiplier: 1.0, label: 'Magic→Light' },
  { attackType: AttackType.Magic,  armorType: ArmorType.Medium,    expectedMultiplier: 1.0, label: 'Magic→Medium' },
  { attackType: AttackType.Magic,  armorType: ArmorType.Heavy,     expectedMultiplier: 1.5, label: 'Magic→Heavy (PRD bonus +50%)' },
  { attackType: AttackType.Magic,  armorType: ArmorType.Building,  expectedMultiplier: 1.0, label: 'Magic→Building' },
];

describe('F4-stap 20 — DAMAGE_MODIFIERS matrix locked via real CombatSystem', () => {
  for (const tc of MATRIX) {
    it(tc.label, () => {
      const world = replaceWorld();
      // Use damage=10, armor=0, so damage = 10 * mult exactly.
      const attacker = spawnAttacker(world, tc.attackType, 10);
      const defender = spawnDefender(world, tc.armorType, 0);
      UnitAI.targetEid[attacker] = defender;
      const startHp = Health.current[defender];

      tickCombat(world);

      const dealt = startHp - Health.current[defender];
      // Allow tiny FP noise from Float32Array storage
      expect(dealt).toBeCloseTo(10 * tc.expectedMultiplier, 4);
    });
  }
});

// ---------------------------------------------------------------------------
// MIN_DAMAGE clamp
// ---------------------------------------------------------------------------

describe('F4-stap 20 — MIN_DAMAGE clamp', () => {
  it('clamps to MIN_DAMAGE when armor*ARMOR_FACTOR exceeds attack', () => {
    const world = replaceWorld();
    const attacker = spawnAttacker(world, AttackType.Melee, 5); // low damage
    const defender = spawnDefender(world, ArmorType.Heavy, 100); // wall of armor
    UnitAI.targetEid[attacker] = defender;
    const startHp = Health.current[defender];

    tickCombat(world);

    const dealt = startHp - Health.current[defender];
    // 5 - 100*0.5 = -45 → clamp to MIN_DAMAGE
    expect(dealt).toBe(MIN_DAMAGE);
  });
});

// ---------------------------------------------------------------------------
// Siege bonus path (Attack.siegeBonus + DAMAGE_MODIFIERS combined)
// ---------------------------------------------------------------------------

describe('F4-stap 20 — siege bonus stacks with armor matrix', () => {
  it('Attack.siegeBonus only applies when target is a Building', () => {
    const world = replaceWorld();
    const attacker = spawnAttacker(world, AttackType.Siege, 10, 0, 3.0); // siegeBonus 3x
    const unitTarget = spawnDefender(world, ArmorType.Light, 0, false);
    UnitAI.targetEid[attacker] = unitTarget;
    const startHp = Health.current[unitTarget];

    tickCombat(world);

    // Siege→Light = 1.0 × no siegeBonus (target is Unit, not Building)
    expect(startHp - Health.current[unitTarget]).toBeCloseTo(10, 4);
  });

  it('Attack.siegeBonus stacks with Siege→Building 2x → 6x total', () => {
    const world = replaceWorld();
    const attacker = spawnAttacker(world, AttackType.Siege, 10, 0, 3.0);
    const bldg = spawnDefender(world, ArmorType.Building, 0, true);
    UnitAI.targetEid[attacker] = bldg;
    const startHp = Health.current[bldg];

    tickCombat(world);

    // 10 * 3.0 (siegeBonus) * 2.0 (matrix Siege→Building) = 60
    expect(startHp - Health.current[bldg]).toBeCloseTo(60, 4);
  });
});

// ---------------------------------------------------------------------------
// Armor reduction (subtractive, ARMOR_FACTOR=0.5)
// ---------------------------------------------------------------------------

describe('F4-stap 20 — armor reduction is subtractive (ARMOR_FACTOR)', () => {
  it('rawDamage = attackerDamage - armor*ARMOR_FACTOR', () => {
    const world = replaceWorld();
    const attacker = spawnAttacker(world, AttackType.Melee, 12);
    const defender = spawnDefender(world, ArmorType.Medium, 4); // Melee→Medium = 1.0 mult
    UnitAI.targetEid[attacker] = defender;
    const startHp = Health.current[defender];

    tickCombat(world);

    // 12 * 1.0 - 4 * 0.5 = 12 - 2 = 10
    expect(startHp - Health.current[defender]).toBeCloseTo(10, 4);
  });

  it('matrix bonus is applied BEFORE armor subtraction', () => {
    const world = replaceWorld();
    const attacker = spawnAttacker(world, AttackType.Melee, 10); // Melee→Light=1.5
    const defender = spawnDefender(world, ArmorType.Light, 4);
    UnitAI.targetEid[attacker] = defender;
    const startHp = Health.current[defender];

    tickCombat(world);

    // 10 * 1.5 - 4 * 0.5 = 15 - 2 = 13
    expect(startHp - Health.current[defender]).toBeCloseTo(13, 4);
  });
});
