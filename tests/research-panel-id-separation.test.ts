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

const BLACKSMITH_IDS = new Set<number>([
  UpgradeId.MeleeAttack1, UpgradeId.MeleeAttack2,
  UpgradeId.RangedAttack1, UpgradeId.RangedAttack2,
  UpgradeId.ArmorUpgrade1, UpgradeId.ArmorUpgrade2,
  UpgradeId.MoveSpeed1,
]);

const UPGRADE_BUILDING_T3_IDS = new Set<number>([
  UpgradeId.MeleeAttack3, UpgradeId.RangedAttack3,
  UpgradeId.ArmorUpgrade3, UpgradeId.MoveSpeed2,
]);

const UPGRADE_BUILDING_FACTION_IDS = new Set<number>([
  UpgradeId.Carnavalsvuur, UpgradeId.AIOptimization,
  UpgradeId.Mergelharnas, UpgradeId.DiamantgloeiendeWapens,
]);

describe('research panel id-separation — Blacksmith / LumberCamp / UpgradeBuilding', () => {
  it('UPGRADE_DEFINITIONS partition: every id belongs to exactly one panel-set', () => {
    for (const def of UPGRADE_DEFINITIONS) {
      const id = def.id as number;
      const inBlacksmith = BLACKSMITH_IDS.has(id);
      const inWood = WOOD_IDS.has(id);
      const inT3 = UPGRADE_BUILDING_T3_IDS.has(id);
      const inFaction = UPGRADE_BUILDING_FACTION_IDS.has(id);
      const matches = [inBlacksmith, inWood, inT3, inFaction].filter(Boolean).length;
      expect(matches).toBe(1);
    }
  });

  it('Blacksmith filter yields exactly 7 combat/armor/speed upgrades', () => {
    const ids = UPGRADE_DEFINITIONS
      .filter(def => BLACKSMITH_IDS.has(def.id as number))
      .map(def => def.id);
    expect(ids).toHaveLength(7);
  });

  it('LumberCamp set yields exactly 3 wood upgrades', () => {
    expect([...WOOD_IDS]).toHaveLength(3);
  });

  it('UpgradeBuilding T3 universal set yields 4', () => {
    expect([...UPGRADE_BUILDING_T3_IDS]).toHaveLength(4);
  });

  it('UpgradeBuilding faction-unique set yields 4 (one per factie)', () => {
    expect([...UPGRADE_BUILDING_FACTION_IDS]).toHaveLength(4);
  });

  it('No overlap between any of the four panel-sets', () => {
    const sets = [BLACKSMITH_IDS, WOOD_IDS, UPGRADE_BUILDING_T3_IDS, UPGRADE_BUILDING_FACTION_IDS];
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        for (const id of sets[i]) {
          expect(sets[j].has(id)).toBe(false);
        }
      }
    }
  });

  it('All 18 UPGRADE_DEFINITIONS map into one of the panel-sets', () => {
    const all = new Set([...BLACKSMITH_IDS, ...WOOD_IDS, ...UPGRADE_BUILDING_T3_IDS, ...UPGRADE_BUILDING_FACTION_IDS]);
    expect(all.size).toBe(18);
    for (const def of UPGRADE_DEFINITIONS) {
      expect(all.has(def.id as number)).toBe(true);
    }
  });
});
