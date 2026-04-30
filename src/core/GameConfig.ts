/**
 * Reign of Brabant -- Game Config Singleton
 *
 * Shared runtime config accessible by all systems.
 * Set once at game init, read by VisionSystem, CommandSystem, etc.
 */

import { FactionId } from '../types/index';

export type Difficulty = 'easy' | 'normal' | 'hard';

class GameConfigManager {
  private _playerFactionId: FactionId = FactionId.Brabanders;
  private _difficulty: Difficulty = 'normal';

  get playerFactionId(): FactionId {
    return this._playerFactionId;
  }

  setPlayerFaction(factionId: FactionId): void {
    this._playerFactionId = factionId;
  }

  isPlayerFaction(factionId: number): boolean {
    return factionId === this._playerFactionId;
  }

  get difficulty(): Difficulty {
    return this._difficulty;
  }

  setDifficulty(difficulty: Difficulty): void {
    this._difficulty = difficulty;
  }
}

export const gameConfig = new GameConfigManager();
