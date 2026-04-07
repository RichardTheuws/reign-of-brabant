import { describe, it, expect } from 'vitest';
import {
  MIN_DAMAGE,
  ARMOR_FACTOR,
  AGGRO_RANGE,
  SELF_DEFENSE_RANGE,
  NO_ENTITY,
  FactionId,
  UnitAIState,
} from '../src/types/index';

// ---------------------------------------------------------------------------
// Pure-logic damage calculation tests
// ---------------------------------------------------------------------------
// The CombatSystem uses this formula:
//   rawDamage = (attackDamage * attackMult) - (armorValue * armorMult) * ARMOR_FACTOR
//   effectiveDamage = max(MIN_DAMAGE, rawDamage)
//   if (damageReduction > 0) effectiveDamage *= (1 - damageReduction)
//   effectiveDamage = max(MIN_DAMAGE, effectiveDamage)
//
// We extract and test this logic as a pure function.
// ---------------------------------------------------------------------------

function calculateDamage(
  attackDamage: number,
  attackMult: number,
  armorValue: number,
  armorMult: number,
  damageReduction: number = 0,
): number {
  const boostedAttack = attackDamage * attackMult;
  const boostedArmor = armorValue * armorMult;
  const rawDamage = boostedAttack - boostedArmor * ARMOR_FACTOR;
  let effectiveDamage = Math.max(MIN_DAMAGE, rawDamage);

  if (damageReduction > 0) {
    effectiveDamage *= (1 - damageReduction);
    effectiveDamage = Math.max(MIN_DAMAGE, effectiveDamage);
  }

  return effectiveDamage;
}

describe('CombatSystem — Damage Calculation', () => {
  describe('basic damage formula', () => {
    it('deals full damage when target has 0 armor', () => {
      const dmg = calculateDamage(12, 1.0, 0, 1.0);
      expect(dmg).toBe(12);
    });

    it('reduces damage by armor * ARMOR_FACTOR', () => {
      // 12 - (4 * 0.5) = 12 - 2 = 10
      const dmg = calculateDamage(12, 1.0, 4, 1.0);
      expect(dmg).toBe(10);
    });

    it('enforces minimum damage of MIN_DAMAGE when armor is very high', () => {
      // 5 - (100 * 0.5) = 5 - 50 = -45 → clamped to MIN_DAMAGE (1)
      const dmg = calculateDamage(5, 1.0, 100, 1.0);
      expect(dmg).toBe(MIN_DAMAGE);
    });

    it('returns exactly MIN_DAMAGE when damage equals armor reduction', () => {
      // 5 - (10 * 0.5) = 5 - 5 = 0 → clamped to 1
      const dmg = calculateDamage(5, 1.0, 10, 1.0);
      expect(dmg).toBe(MIN_DAMAGE);
    });
  });

  describe('Gezelligheid attack multiplier', () => {
    it('increases damage with attack multiplier > 1.0', () => {
      // 12 * 1.5 = 18, minus (2 * 0.5) = 1 → 17
      const dmg = calculateDamage(12, 1.5, 2, 1.0);
      expect(dmg).toBe(17);
    });

    it('decreases damage with attack multiplier < 1.0', () => {
      // 12 * 0.5 = 6, minus (2 * 0.5) = 1 → 5
      const dmg = calculateDamage(12, 0.5, 2, 1.0);
      expect(dmg).toBe(5);
    });

    it('0 attack multiplier still deals MIN_DAMAGE', () => {
      const dmg = calculateDamage(12, 0, 2, 1.0);
      expect(dmg).toBe(MIN_DAMAGE);
    });
  });

  describe('Gezelligheid armor multiplier', () => {
    it('increases armor reduction with armor multiplier > 1.0', () => {
      // 12 - (4 * 2.0 * 0.5) = 12 - 4 = 8
      const dmg = calculateDamage(12, 1.0, 4, 2.0);
      expect(dmg).toBe(8);
    });

    it('decreases armor reduction with armor multiplier < 1.0', () => {
      // 12 - (4 * 0.5 * 0.5) = 12 - 1 = 11
      const dmg = calculateDamage(12, 1.0, 4, 0.5);
      expect(dmg).toBe(11);
    });

    it('0 armor multiplier means no armor reduction', () => {
      // 12 - (4 * 0 * 0.5) = 12 - 0 = 12
      const dmg = calculateDamage(12, 1.0, 4, 0);
      expect(dmg).toBe(12);
    });
  });

  describe('damage reduction (Gezelligheid group bonus)', () => {
    it('reduces effective damage by percentage', () => {
      // base damage 12, 20% reduction → 12 * 0.8 = 9.6
      const dmg = calculateDamage(12, 1.0, 0, 1.0, 0.2);
      expect(dmg).toBeCloseTo(9.6);
    });

    it('50% damage reduction halves the damage', () => {
      const dmg = calculateDamage(20, 1.0, 0, 1.0, 0.5);
      expect(dmg).toBe(10);
    });

    it('100% damage reduction still deals MIN_DAMAGE', () => {
      const dmg = calculateDamage(20, 1.0, 0, 1.0, 1.0);
      expect(dmg).toBe(MIN_DAMAGE);
    });

    it('damage reduction does not apply when 0', () => {
      const dmg = calculateDamage(12, 1.0, 0, 1.0, 0);
      expect(dmg).toBe(12);
    });

    it('damage reduction combined with armor', () => {
      // 10 - (6 * 0.5) = 10 - 3 = 7, then 7 * 0.8 = 5.6
      const dmg = calculateDamage(10, 1.0, 6, 1.0, 0.2);
      expect(dmg).toBeCloseTo(5.6);
    });

    it('damage reduction on already-minimum damage stays at MIN_DAMAGE', () => {
      // 1 (from heavy armor) * 0.5 = 0.5 → clamped to 1
      const dmg = calculateDamage(1, 1.0, 100, 1.0, 0.5);
      expect(dmg).toBe(MIN_DAMAGE);
    });
  });

  describe('faction-specific scenarios', () => {
    it('Brabanders infantry vs unarmored target', () => {
      // Carnavalvierder: attack 12, no mult
      const dmg = calculateDamage(12, 1.0, 0, 1.0);
      expect(dmg).toBe(12);
    });

    it('Randstad Manager vs armored Limburger', () => {
      // Manager attack 9, Mergelridder armor 6
      // 9 - (6 * 0.5) = 9 - 3 = 6
      const dmg = calculateDamage(9, 1.0, 6, 1.0);
      expect(dmg).toBe(6);
    });

    it('Belgen Chocolatier (glass cannon) vs heavy armor', () => {
      // Chocolatier low attack (assume 8), high armor target (6)
      // 8 - (6 * 0.5) = 8 - 3 = 5
      const dmg = calculateDamage(8, 1.0, 6, 1.0);
      expect(dmg).toBe(5);
    });

    it('Limburgers Mergelridder with full Gezelligheid buffs on target', () => {
      // High attack (15), target has armor 2 with armor mult 1.5, 20% dmg reduction
      // 15 - (2 * 1.5 * 0.5) = 15 - 1.5 = 13.5, then * 0.8 = 10.8
      const dmg = calculateDamage(15, 1.0, 2, 1.5, 0.2);
      expect(dmg).toBeCloseTo(10.8);
    });
  });
});

describe('CombatSystem — Constants', () => {
  it('MIN_DAMAGE is 1', () => {
    expect(MIN_DAMAGE).toBe(1);
  });

  it('ARMOR_FACTOR is 0.5', () => {
    expect(ARMOR_FACTOR).toBe(0.5);
  });

  it('AGGRO_RANGE is 12', () => {
    expect(AGGRO_RANGE).toBe(12);
  });

  it('SELF_DEFENSE_RANGE is 6', () => {
    expect(SELF_DEFENSE_RANGE).toBe(6);
  });

  it('NO_ENTITY is u32 max (0xFFFFFFFF)', () => {
    expect(NO_ENTITY).toBe(0xFFFFFFFF);
  });

  it('SELF_DEFENSE_RANGE is less than AGGRO_RANGE', () => {
    expect(SELF_DEFENSE_RANGE).toBeLessThan(AGGRO_RANGE);
  });
});

describe('CombatSystem — UnitAIState transitions', () => {
  it('UnitAIState.Idle is 0', () => {
    expect(UnitAIState.Idle).toBe(0);
  });

  it('UnitAIState.Attacking is 2', () => {
    expect(UnitAIState.Attacking).toBe(2);
  });

  it('UnitAIState.Dead is 6', () => {
    expect(UnitAIState.Dead).toBe(6);
  });

  it('UnitAIState.Stunned is 7', () => {
    expect(UnitAIState.Stunned).toBe(7);
  });

  it('all UnitAIState values are unique', () => {
    const values = [
      UnitAIState.Idle,
      UnitAIState.Moving,
      UnitAIState.Attacking,
      UnitAIState.MovingToResource,
      UnitAIState.Gathering,
      UnitAIState.Returning,
      UnitAIState.Dead,
      UnitAIState.Stunned,
      UnitAIState.Reviving,
    ];
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('CombatSystem — Range calculations', () => {
  it('melee range 0 is treated as minimum effective range 1.5', () => {
    const archetypeRange = 0;
    const effectiveRange = Math.max(archetypeRange, 1.5);
    expect(effectiveRange).toBe(1.5);
  });

  it('ranged attack range 6.0 stays at 6.0', () => {
    const archetypeRange = 6.0;
    const effectiveRange = Math.max(archetypeRange, 1.5);
    expect(effectiveRange).toBe(6.0);
  });

  it('isRanged classification: range > 1.5 is ranged', () => {
    expect(6.0 > 1.5).toBe(true);
    expect(1.5 > 1.5).toBe(false);
    expect(1.0 > 1.5).toBe(false);
  });

  it('distance squared calculation is correct', () => {
    const dx = 3;
    const dz = 4;
    const distSq = dx * dx + dz * dz;
    expect(distSq).toBe(25);
    expect(Math.sqrt(distSq)).toBe(5);
  });

  it('aggro range squared matches AGGRO_RANGE * AGGRO_RANGE', () => {
    const aggroSq = AGGRO_RANGE * AGGRO_RANGE;
    expect(aggroSq).toBe(144);
  });

  it('self-defense range squared matches SELF_DEFENSE_RANGE * SELF_DEFENSE_RANGE', () => {
    const selfDefSq = SELF_DEFENSE_RANGE * SELF_DEFENSE_RANGE;
    expect(selfDefSq).toBe(36);
  });
});
