/**
 * difficultyConfig.test.ts — locks the v0.55.0 asymmetry table.
 *
 * Easy makes the AI's economy weaker AND the player's stronger; hard does
 * the inverse on the AI side without nerfing the player. Normal is 1.0
 * across the board.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { gameConfig } from '../src/core/GameConfig';
import {
  getDifficultyGatherMult,
  getDifficultyProductionMult,
  getDifficultyStartingGoldMult,
} from '../src/data/difficultyConfig';
import { FactionId } from '../src/types/index';

const PLAYER = FactionId.Brabanders;
const AI = FactionId.Randstad;

describe('difficultyConfig — easy/normal/hard asymmetry', () => {
  beforeEach(() => {
    gameConfig.setPlayerFaction(PLAYER);
    gameConfig.setDifficulty('normal');
  });

  describe('normal — all multipliers are 1.0 (no handicap)', () => {
    beforeEach(() => gameConfig.setDifficulty('normal'));

    it('gather rate is 1.0 for both player and AI', () => {
      expect(getDifficultyGatherMult(PLAYER)).toBe(1.0);
      expect(getDifficultyGatherMult(AI)).toBe(1.0);
    });

    it('production speed mult is 1.0 for both', () => {
      expect(getDifficultyProductionMult(PLAYER)).toBe(1.0);
      expect(getDifficultyProductionMult(AI)).toBe(1.0);
    });

    it('starting gold mult is 1.0 for both', () => {
      expect(getDifficultyStartingGoldMult(PLAYER)).toBe(1.0);
      expect(getDifficultyStartingGoldMult(AI)).toBe(1.0);
    });
  });

  describe('easy — AI weaker, player stronger', () => {
    beforeEach(() => gameConfig.setDifficulty('easy'));

    it('player gathers faster (1.15×) and AI gathers slower (0.65×)', () => {
      expect(getDifficultyGatherMult(PLAYER)).toBeCloseTo(1.15, 2);
      expect(getDifficultyGatherMult(AI)).toBeCloseTo(0.65, 2);
    });

    it('AI production duration is 1.33× longer (slower training); player unchanged', () => {
      expect(getDifficultyProductionMult(PLAYER)).toBe(1.0);
      expect(getDifficultyProductionMult(AI)).toBeCloseTo(1.33, 2);
    });

    it('player starts with +50% gold; AI unchanged', () => {
      expect(getDifficultyStartingGoldMult(PLAYER)).toBe(1.5);
      expect(getDifficultyStartingGoldMult(AI)).toBe(1.0);
    });
  });

  describe('hard — AI stronger; player gets no nerf (just no boost)', () => {
    beforeEach(() => gameConfig.setDifficulty('hard'));

    it('AI gathers faster (1.15×); player at 1.0×', () => {
      expect(getDifficultyGatherMult(PLAYER)).toBe(1.0);
      expect(getDifficultyGatherMult(AI)).toBeCloseTo(1.15, 2);
    });

    it('AI production duration is 0.91× (faster training); player unchanged', () => {
      expect(getDifficultyProductionMult(PLAYER)).toBe(1.0);
      expect(getDifficultyProductionMult(AI)).toBeCloseTo(0.91, 2);
    });

    it('starting gold unchanged on both sides on hard', () => {
      expect(getDifficultyStartingGoldMult(PLAYER)).toBe(1.0);
      expect(getDifficultyStartingGoldMult(AI)).toBe(1.0);
    });
  });

  describe('player faction switch is respected (not hardcoded to Brabanders)', () => {
    it('after setPlayerFaction(Limburgers), Limburg gets player mods on easy', () => {
      gameConfig.setPlayerFaction(FactionId.Limburgers);
      gameConfig.setDifficulty('easy');
      expect(getDifficultyGatherMult(FactionId.Limburgers)).toBeCloseTo(1.15, 2);
      expect(getDifficultyStartingGoldMult(FactionId.Limburgers)).toBe(1.5);
      // Brabanders is now an AI faction — gets AI mods
      expect(getDifficultyGatherMult(FactionId.Brabanders)).toBeCloseTo(0.65, 2);
    });
  });

  describe('asymmetry sanity — easy is measurably easier than hard', () => {
    it('player gathers >1.7× as fast as AI on easy (1.15 / 0.65 ≈ 1.77)', () => {
      gameConfig.setDifficulty('easy');
      const ratio = getDifficultyGatherMult(PLAYER) / getDifficultyGatherMult(AI);
      expect(ratio).toBeGreaterThan(1.7);
    });

    it('player gathers <1.0× of AI on hard (1.0 / 1.15 ≈ 0.87)', () => {
      gameConfig.setDifficulty('hard');
      const ratio = getDifficultyGatherMult(PLAYER) / getDifficultyGatherMult(AI);
      expect(ratio).toBeLessThan(1.0);
    });
  });
});
