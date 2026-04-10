import { describe, it, expect, beforeEach } from 'vitest';
import { playerState } from '../src/core/PlayerState';
import { getUpkeepPerTick, resetUpkeepTimers } from '../src/systems/UpkeepSystem';
import { UPKEEP_COST_PER_UNIT, UPKEEP_TICK_INTERVAL } from '../src/types/index';
import { FactionId } from '../src/types/index';

describe('UpkeepSystem', () => {
  beforeEach(() => {
    playerState.reset();
    resetUpkeepTimers();
  });

  describe('getUpkeepPerTick', () => {
    it('returns 0 when no military units', () => {
      expect(getUpkeepPerTick(FactionId.Brabanders)).toBe(0);
    });

    it('returns correct cost based on military count', () => {
      playerState.addMilitaryUnit(FactionId.Brabanders, 5);
      expect(getUpkeepPerTick(FactionId.Brabanders)).toBe(5 * UPKEEP_COST_PER_UNIT);
    });

    it('returns per-faction values independently', () => {
      playerState.addMilitaryUnit(FactionId.Brabanders, 3);
      playerState.addMilitaryUnit(FactionId.Randstad, 8);
      expect(getUpkeepPerTick(FactionId.Brabanders)).toBe(3 * UPKEEP_COST_PER_UNIT);
      expect(getUpkeepPerTick(FactionId.Randstad)).toBe(8 * UPKEEP_COST_PER_UNIT);
    });
  });

  describe('upkeep constants', () => {
    it('tick interval is 15 seconds', () => {
      expect(UPKEEP_TICK_INTERVAL).toBe(15);
    });

    it('cost per unit is 1 gold', () => {
      expect(UPKEEP_COST_PER_UNIT).toBe(1);
    });
  });
});
