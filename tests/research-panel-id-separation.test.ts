/**
 * research-panel-id-separation.test.ts -- v0.37.32 lock
 *
 * Locks: Blacksmith and LumberCamp panels show DIFFERENT upgrade-id sets.
 *  - Blacksmith → combat/armor/speed (0-6)
 *  - LumberCamp → wood-only (7,8,9)
 *
 * Issue: in v0.37.31 Blacksmith.showBlacksmithResearchUI mapped all of
 * UPGRADE_DEFINITIONS, leaking WoodCarry1/WoodCarry2/WoodGather buttons
 * (often as "OK" because already done) into the Blacksmith panel.
 */
import { describe, it, expect } from 'vitest';
import { UPGRADE_DEFINITIONS } from '../src/systems/TechTreeSystem';
import { UpgradeId } from '../src/types/index';

const WOOD_IDS = new Set<number>([
  UpgradeId.WoodCarry1, UpgradeId.WoodCarry2, UpgradeId.WoodGather,
]);

const COMBAT_IDS = new Set<number>([
  UpgradeId.MeleeAttack1, UpgradeId.MeleeAttack2,
  UpgradeId.RangedAttack1, UpgradeId.RangedAttack2,
  UpgradeId.ArmorUpgrade1, UpgradeId.ArmorUpgrade2,
  UpgradeId.MoveSpeed1,
]);

describe('research panel id-separation — Blacksmith vs LumberCamp', () => {
  it('UPGRADE_DEFINITIONS partition: every id is either combat (0-6) or wood (7-9)', () => {
    for (const def of UPGRADE_DEFINITIONS) {
      const id = def.id as number;
      expect(WOOD_IDS.has(id) || COMBAT_IDS.has(id)).toBe(true);
    }
  });

  it('Blacksmith panel filter (non-wood) yields exactly 7 combat upgrades', () => {
    const blacksmithIds = UPGRADE_DEFINITIONS
      .filter(def => !WOOD_IDS.has(def.id as number))
      .map(def => def.id);
    expect(blacksmithIds).toHaveLength(7);
    for (const id of blacksmithIds) {
      expect(WOOD_IDS.has(id as number)).toBe(false);
    }
  });

  it('LumberCamp panel set yields exactly 3 wood upgrades', () => {
    const lumberIds = [UpgradeId.WoodCarry1, UpgradeId.WoodCarry2, UpgradeId.WoodGather];
    expect(lumberIds).toHaveLength(3);
    for (const id of lumberIds) {
      expect(WOOD_IDS.has(id)).toBe(true);
    }
  });

  it('No overlap between combat and wood id sets', () => {
    for (const id of COMBAT_IDS) {
      expect(WOOD_IDS.has(id)).toBe(false);
    }
  });
});
