import { describe, it, expect, beforeEach } from 'vitest';
import { playerState } from '../src/core/PlayerState';
import { FactionId } from '../src/types/index';

describe('PlayerState', () => {
  beforeEach(() => {
    playerState.reset();
  });

  describe('reset()', () => {
    it('creates 4 player slots by default', () => {
      playerState.reset();
      // All 4 factions should be accessible without throwing
      for (let i = 0; i < 4; i++) {
        expect(playerState.getGold(i)).toBe(100);
      }
    });

    it('creates 2 player slots when reset(2) is called', () => {
      playerState.reset(2);
      expect(playerState.getGold(0)).toBe(100);
      expect(playerState.getGold(1)).toBe(100);
    });
  });

  describe('gold operations', () => {
    it('works for factionId 0 (Brabanders)', () => {
      playerState.addGold(FactionId.Brabanders, 50);
      expect(playerState.getGold(FactionId.Brabanders)).toBe(150);
    });

    it('works for factionId 1 (Randstad)', () => {
      playerState.addGold(FactionId.Randstad, 200);
      expect(playerState.getGold(FactionId.Randstad)).toBe(300);
    });

    it('works for factionId 2 (Limburgers)', () => {
      playerState.addGold(FactionId.Limburgers, 75);
      expect(playerState.getGold(FactionId.Limburgers)).toBe(175);
    });

    it('works for factionId 3 (Belgen)', () => {
      playerState.addGold(FactionId.Belgen, 100);
      expect(playerState.getGold(FactionId.Belgen)).toBe(200);
    });

    it('spend deducts gold correctly', () => {
      playerState.spend(FactionId.Brabanders, 60);
      expect(playerState.getGold(FactionId.Brabanders)).toBe(40);
    });

    it('spend returns false when insufficient gold', () => {
      expect(playerState.spend(FactionId.Brabanders, 200)).toBe(false);
      expect(playerState.getGold(FactionId.Brabanders)).toBe(100);
    });
  });

  describe('wood operations', () => {
    it('works for factionId 0 (Brabanders)', () => {
      playerState.addWood(FactionId.Brabanders, 30);
      expect(playerState.getWood(FactionId.Brabanders)).toBe(30);
    });

    it('works for factionId 1 (Randstad)', () => {
      playerState.addWood(FactionId.Randstad, 50);
      expect(playerState.getWood(FactionId.Randstad)).toBe(50);
    });

    it('works for factionId 2 (Limburgers)', () => {
      playerState.addWood(FactionId.Limburgers, 25);
      expect(playerState.getWood(FactionId.Limburgers)).toBe(25);
    });

    it('works for factionId 3 (Belgen)', () => {
      playerState.addWood(FactionId.Belgen, 40);
      expect(playerState.getWood(FactionId.Belgen)).toBe(40);
    });

    it('spendWood returns false when insufficient', () => {
      expect(playerState.spendWood(FactionId.Brabanders, 10)).toBe(false);
      expect(playerState.getWood(FactionId.Brabanders)).toBe(0);
    });
  });

  describe('tertiary resource operations', () => {
    it('works for factionId 0 (Brabanders)', () => {
      playerState.addTertiary(FactionId.Brabanders, 10);
      expect(playerState.getTertiary(FactionId.Brabanders)).toBe(10);
    });

    it('works for factionId 1 (Randstad)', () => {
      playerState.addTertiary(FactionId.Randstad, 20);
      expect(playerState.getTertiary(FactionId.Randstad)).toBe(20);
    });

    it('works for factionId 2 (Limburgers)', () => {
      playerState.addTertiary(FactionId.Limburgers, 15);
      expect(playerState.getTertiary(FactionId.Limburgers)).toBe(15);
    });

    it('works for factionId 3 (Belgen)', () => {
      playerState.addTertiary(FactionId.Belgen, 25);
      expect(playerState.getTertiary(FactionId.Belgen)).toBe(25);
    });

    it('spendTertiary returns false when insufficient', () => {
      expect(playerState.spendTertiary(FactionId.Brabanders, 5)).toBe(false);
    });

    it('canAffordTertiary checks correctly', () => {
      playerState.addTertiary(FactionId.Limburgers, 10);
      expect(playerState.canAffordTertiary(FactionId.Limburgers, 5)).toBe(true);
      expect(playerState.canAffordTertiary(FactionId.Limburgers, 15)).toBe(false);
    });
  });

  describe('population tracking', () => {
    it('tracks population per faction', () => {
      playerState.addPopulation(FactionId.Brabanders, 3);
      playerState.addPopulation(FactionId.Randstad, 5);
      expect(playerState.getPopulation(FactionId.Brabanders)).toBe(3);
      expect(playerState.getPopulation(FactionId.Randstad)).toBe(5);
    });

    it('removePopulation does not go below 0', () => {
      playerState.removePopulation(FactionId.Brabanders, 10);
      expect(playerState.getPopulation(FactionId.Brabanders)).toBe(0);
    });

    it('hasPopulationRoom checks against max', () => {
      // Default max is 10
      playerState.addPopulation(FactionId.Brabanders, 9);
      expect(playerState.hasPopulationRoom(FactionId.Brabanders)).toBe(true);
      playerState.addPopulation(FactionId.Brabanders, 1);
      expect(playerState.hasPopulationRoom(FactionId.Brabanders)).toBe(false);
    });

    it('addPopulationCapacity increases max', () => {
      playerState.addPopulationCapacity(FactionId.Belgen, 5);
      expect(playerState.getPopulationMax(FactionId.Belgen)).toBe(15);
    });
  });

  describe('canAfford', () => {
    it('correctly checks per-faction gold', () => {
      expect(playerState.canAfford(FactionId.Brabanders, 100)).toBe(true);
      expect(playerState.canAfford(FactionId.Brabanders, 101)).toBe(false);
      expect(playerState.canAfford(FactionId.Randstad, 50)).toBe(true);
      expect(playerState.canAfford(FactionId.Belgen, 100)).toBe(true);
    });
  });

  describe('military unit tracking', () => {
    it('starts at 0 military units', () => {
      expect(playerState.getMilitaryCount(FactionId.Brabanders)).toBe(0);
    });

    it('addMilitaryUnit increments count', () => {
      playerState.addMilitaryUnit(FactionId.Brabanders, 3);
      expect(playerState.getMilitaryCount(FactionId.Brabanders)).toBe(3);
    });

    it('removeMilitaryUnit decrements count', () => {
      playerState.addMilitaryUnit(FactionId.Randstad, 5);
      playerState.removeMilitaryUnit(FactionId.Randstad, 2);
      expect(playerState.getMilitaryCount(FactionId.Randstad)).toBe(3);
    });

    it('removeMilitaryUnit does not go below 0', () => {
      playerState.addMilitaryUnit(FactionId.Limburgers, 2);
      playerState.removeMilitaryUnit(FactionId.Limburgers, 10);
      expect(playerState.getMilitaryCount(FactionId.Limburgers)).toBe(0);
    });

    it('tracks military units per faction independently', () => {
      playerState.addMilitaryUnit(FactionId.Brabanders, 4);
      playerState.addMilitaryUnit(FactionId.Randstad, 6);
      expect(playerState.getMilitaryCount(FactionId.Brabanders)).toBe(4);
      expect(playerState.getMilitaryCount(FactionId.Randstad)).toBe(6);
    });
  });

  describe('upkeep debt', () => {
    it('starts not in debt', () => {
      expect(playerState.isInUpkeepDebt(FactionId.Brabanders)).toBe(false);
    });

    it('setUpkeepDebt sets the flag', () => {
      playerState.setUpkeepDebt(FactionId.Brabanders, true);
      expect(playerState.isInUpkeepDebt(FactionId.Brabanders)).toBe(true);
    });

    it('setUpkeepDebt can clear the flag', () => {
      playerState.setUpkeepDebt(FactionId.Randstad, true);
      playerState.setUpkeepDebt(FactionId.Randstad, false);
      expect(playerState.isInUpkeepDebt(FactionId.Randstad)).toBe(false);
    });

    it('tracks upkeep debt per faction independently', () => {
      playerState.setUpkeepDebt(FactionId.Brabanders, true);
      playerState.setUpkeepDebt(FactionId.Randstad, false);
      expect(playerState.isInUpkeepDebt(FactionId.Brabanders)).toBe(true);
      expect(playerState.isInUpkeepDebt(FactionId.Randstad)).toBe(false);
    });
  });
});
