import { describe, it, expect } from 'vitest';
import {
  UPKEEP_DEBT_EFFECTIVENESS,
  DIMINISHING_RETURNS_THRESHOLD,
  DIMINISHING_RETURNS_GATHER_MULT,
  AI_SCALING_TIER1_TIME,
  AI_SCALING_TIER2_TIME,
  AI_SCALING_TIER1_BONUS,
  AI_SCALING_TIER2_BONUS,
  POP_WARNING_THRESHOLD,
  POP_DANGER_THRESHOLD,
} from '../src/types/index';
import { getAIHPScaling } from '../src/systems/CombatSystem';

describe('Late-Game Scaling Constants', () => {
  describe('upkeep debt effectiveness', () => {
    it('is 75% (0.75)', () => {
      expect(UPKEEP_DEBT_EFFECTIVENESS).toBe(0.75);
    });
  });

  describe('diminishing returns', () => {
    it('threshold is 25% of original amount', () => {
      expect(DIMINISHING_RETURNS_THRESHOLD).toBe(0.25);
    });

    it('gather speed multiplier is 70%', () => {
      expect(DIMINISHING_RETURNS_GATHER_MULT).toBe(0.70);
    });
  });

  describe('AI scaling tiers', () => {
    it('tier 1 activates at 10 minutes (600s)', () => {
      expect(AI_SCALING_TIER1_TIME).toBe(600);
    });

    it('tier 2 activates at 20 minutes (1200s)', () => {
      expect(AI_SCALING_TIER2_TIME).toBe(1200);
    });

    it('tier 1 gives +10% bonus', () => {
      expect(AI_SCALING_TIER1_BONUS).toBe(0.10);
    });

    it('tier 2 gives +20% bonus', () => {
      expect(AI_SCALING_TIER2_BONUS).toBe(0.20);
    });
  });

  describe('population warning thresholds', () => {
    it('warning at 60%', () => {
      expect(POP_WARNING_THRESHOLD).toBe(0.60);
    });

    it('danger at 80%', () => {
      expect(POP_DANGER_THRESHOLD).toBe(0.80);
    });
  });
});

describe('getAIHPScaling', () => {
  it('returns 1.0 before tier 1 time', () => {
    expect(getAIHPScaling(0)).toBe(1.0);
    expect(getAIHPScaling(300)).toBe(1.0);
    expect(getAIHPScaling(599)).toBe(1.0);
  });

  it('returns 1.1 at tier 1 time', () => {
    expect(getAIHPScaling(600)).toBeCloseTo(1.10);
    expect(getAIHPScaling(900)).toBeCloseTo(1.10);
  });

  it('returns 1.2 at tier 2 time', () => {
    expect(getAIHPScaling(1200)).toBeCloseTo(1.20);
    expect(getAIHPScaling(2000)).toBeCloseTo(1.20);
  });
});
