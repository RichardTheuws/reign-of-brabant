/**
 * Reign of Brabant -- Game Config Singleton
 *
 * Shared runtime config accessible by all systems.
 * Set once at game init, read by VisionSystem, CommandSystem, etc.
 */

import { FactionId } from '../types/index';

class GameConfigManager {
  private _playerFactionId: FactionId = FactionId.Brabanders;

  get playerFactionId(): FactionId {
    return this._playerFactionId;
  }

  setPlayerFaction(factionId: FactionId): void {
    this._playerFactionId = factionId;
  }

  isPlayerFaction(factionId: number): boolean {
    return factionId === this._playerFactionId;
  }
}

export const gameConfig = new GameConfigManager();
