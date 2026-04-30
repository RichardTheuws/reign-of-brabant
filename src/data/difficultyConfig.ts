/**
 * Reign of Brabant -- Difficulty Config
 *
 * Per-difficulty multipliers applied to gather rate, production speed,
 * and starting resources. Centralizes the asymmetric handicaps that
 * make 'easy' actually feel easy and 'hard' actually feel hard.
 *
 * Reads `gameConfig.playerFactionId` + `gameConfig.difficulty` to decide
 * whether a given factionId is the player or the AI, then returns the
 * appropriate side of the multiplier pair.
 *
 * AI aggression-timing tweaks (attackThreshold, forceAttackTime,
 * maxWorkers) live in `src/ai/AIController.ts` and stay there — those
 * are strategic, while the multipliers below are economic.
 *
 * v0.55.0 reasoning: prior easy-mode only delayed the AI's first attack;
 * its economy was untouched, so by attack-time the AI had a bigger army
 * than the player. The fix is to handicap the AI's economy AND give the
 * player a starting boost — two axes for one feel.
 */

import { gameConfig, type Difficulty } from '../core/GameConfig';

export interface DifficultyModifiers {
  /** Multiplier on gather rate for the side. 1.0 = unchanged. */
  gatherMult: number;
  /** Multiplier on training/research speed (lower = faster). 1.0 = unchanged. */
  productionSpeedMult: number;
  /** Multiplier on starting gold. 1.0 = unchanged. */
  startingGoldMult: number;
}

/** Player-side modifiers per difficulty. */
const PLAYER_MODS: Record<Difficulty, DifficultyModifiers> = {
  easy:   { gatherMult: 1.15, productionSpeedMult: 1.00, startingGoldMult: 1.50 },
  normal: { gatherMult: 1.00, productionSpeedMult: 1.00, startingGoldMult: 1.00 },
  hard:   { gatherMult: 1.00, productionSpeedMult: 1.00, startingGoldMult: 1.00 },
};

/** AI-side modifiers per difficulty. */
const AI_MODS: Record<Difficulty, DifficultyModifiers> = {
  easy:   { gatherMult: 0.65, productionSpeedMult: 1.33, startingGoldMult: 1.00 },
  normal: { gatherMult: 1.00, productionSpeedMult: 1.00, startingGoldMult: 1.00 },
  hard:   { gatherMult: 1.15, productionSpeedMult: 0.91, startingGoldMult: 1.00 },
};

/**
 * Modifiers for a specific faction at the current difficulty.
 * Player faction → PLAYER_MODS, AI faction → AI_MODS.
 */
export function getDifficultyModifiers(factionId: number): DifficultyModifiers {
  const table = gameConfig.isPlayerFaction(factionId) ? PLAYER_MODS : AI_MODS;
  return table[gameConfig.difficulty];
}

/** Convenience accessors used by hot-path systems. */
export function getDifficultyGatherMult(factionId: number): number {
  return getDifficultyModifiers(factionId).gatherMult;
}

/**
 * `productionSpeedMult` divides Production.duration:
 *   effectiveDuration = baseDuration * productionSpeedMult
 * easy AI has 1.33× duration (slower training), hard AI has 0.91× (faster).
 */
export function getDifficultyProductionMult(factionId: number): number {
  return getDifficultyModifiers(factionId).productionSpeedMult;
}

export function getDifficultyStartingGoldMult(factionId: number): number {
  return getDifficultyModifiers(factionId).startingGoldMult;
}
