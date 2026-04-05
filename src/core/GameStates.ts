/**
 * GameStates.ts -- Concrete state implementations for each game phase.
 *
 * MENU → FACTION_SELECT → LOADING → TUTORIAL / PLAYING → GAME_OVER → MENU
 */

import { GameStateId, type IGameState, type GameStateContext } from './GameState';
import { audioManager } from '../audio/AudioManager';

// ---------------------------------------------------------------------------
// Shared references (set by GameFlowController at boot)
// ---------------------------------------------------------------------------

export interface GameFlowDeps {
  showMainMenu: () => void;
  hideMainMenu: () => void;
  showFactionSelect: () => void;
  hideFactionSelect: () => void;
  showCampaignSelect: () => void;
  hideCampaignSelect: () => void;
  showBriefing: (missionId: string) => void;
  hideBriefing: () => void;
  showLoadingScreen: () => void;
  hideLoadingScreen: () => void;
  setGameHUDVisible: (v: boolean) => void;
  startGame: (tutorial: boolean) => Promise<void>;
  startMission: (missionId: string) => Promise<void>;
  updateGame: (dt: number) => void;
  updateMenuCamera: (dt: number) => void;
  startCameraIntro: () => void;
  updateLoadingProgress: (progress: number, label?: string) => void;
  isGameInitialized: () => boolean;
}

let deps: GameFlowDeps | null = null;

export function setGameFlowDeps(d: GameFlowDeps): void {
  deps = d;
}

function d(): GameFlowDeps {
  if (!deps) throw new Error('[GameStates] Dependencies not set. Call setGameFlowDeps first.');
  return deps;
}

// ---------------------------------------------------------------------------
// MENU state
// ---------------------------------------------------------------------------

export class MenuState implements IGameState {
  readonly id = GameStateId.MENU;

  enter(_ctx: GameStateContext): void {
    d().showMainMenu();
    d().setGameHUDVisible(false);
  }

  update(dt: number, _ctx: GameStateContext): void {
    d().updateMenuCamera(dt);
  }

  exit(_ctx: GameStateContext): void {
    d().hideMainMenu();
  }
}

// ---------------------------------------------------------------------------
// FACTION_SELECT state
// ---------------------------------------------------------------------------

export class FactionSelectState implements IGameState {
  readonly id = GameStateId.FACTION_SELECT;

  enter(_ctx: GameStateContext): void {
    d().showFactionSelect();
    d().setGameHUDVisible(false);
  }

  update(dt: number, _ctx: GameStateContext): void {
    // Keep the background 3D scene rendering with rotating camera
    d().updateMenuCamera(dt);
  }

  exit(_ctx: GameStateContext): void {
    d().hideFactionSelect();
  }
}

// ---------------------------------------------------------------------------
// CAMPAIGN_SELECT state
// ---------------------------------------------------------------------------

export class CampaignSelectState implements IGameState {
  readonly id = GameStateId.CAMPAIGN_SELECT;

  enter(_ctx: GameStateContext): void {
    d().showCampaignSelect();
    d().setGameHUDVisible(false);
  }

  update(dt: number, _ctx: GameStateContext): void {
    d().updateMenuCamera(dt);
  }

  exit(_ctx: GameStateContext): void {
    d().hideCampaignSelect();
  }
}

// ---------------------------------------------------------------------------
// BRIEFING state
// ---------------------------------------------------------------------------

export class BriefingState implements IGameState {
  readonly id = GameStateId.BRIEFING;

  enter(ctx: GameStateContext): void {
    const missionId = ctx.transitionData['missionId'] as string;
    d().showBriefing(missionId);
    d().setGameHUDVisible(false);
  }

  update(dt: number, _ctx: GameStateContext): void {
    d().updateMenuCamera(dt);
  }

  exit(_ctx: GameStateContext): void {
    d().hideBriefing();
  }
}

// ---------------------------------------------------------------------------
// LOADING state
// ---------------------------------------------------------------------------

export class LoadingState implements IGameState {
  readonly id = GameStateId.LOADING;
  private loadStarted = false;

  enter(ctx: GameStateContext): void {
    d().showLoadingScreen();
    d().setGameHUDVisible(false);
    this.loadStarted = false;

    // Start async loading
    const tutorial = ctx.transitionData['tutorial'] === true;
    const missionId = ctx.transitionData['missionId'] as string | undefined;

    // Simulate phased loading with progress
    const loadPhases: Array<{ label: string; progress: number }> = [
      { label: 'Terrein genereren...', progress: 0.1 },
      { label: 'Modellen laden...', progress: 0.3 },
      { label: 'Facties mobiliseren...', progress: 0.5 },
      { label: 'Worstenbroodjes bakken...', progress: 0.7 },
      { label: 'Bier tappen...', progress: 0.85 },
      { label: 'Vergaderagenda\'s invullen...', progress: 0.95 },
    ];

    // Run loading with progress updates
    const runLoad = async () => {
      this.loadStarted = true;

      for (const phase of loadPhases) {
        d().updateLoadingProgress(phase.progress, phase.label);
        // Small delay between phases for visual feedback
        await new Promise(r => setTimeout(r, 200));
      }

      // Initialize the game -- either campaign mission or skirmish
      if (missionId) {
        await d().startMission(missionId);
      } else {
        await d().startGame(tutorial);
      }

      d().updateLoadingProgress(1.0, 'Gereed!');
      await new Promise(r => setTimeout(r, 500));

      // Transition to playing or tutorial
      if (tutorial) {
        ctx.transition(GameStateId.TUTORIAL);
      } else {
        ctx.transition(GameStateId.PLAYING);
      }
    };

    runLoad().catch(err => {
      console.error('[LoadingState] Failed to load:', err);
    });
  }

  update(_dt: number, _ctx: GameStateContext): void {
    // Loading is async, nothing to do each frame
  }

  exit(_ctx: GameStateContext): void {
    d().hideLoadingScreen();
  }
}

// ---------------------------------------------------------------------------
// TUTORIAL state
// ---------------------------------------------------------------------------

export class TutorialState implements IGameState {
  readonly id = GameStateId.TUTORIAL;

  enter(_ctx: GameStateContext): void {
    d().setGameHUDVisible(true);
    d().startCameraIntro();
  }

  update(dt: number, _ctx: GameStateContext): void {
    d().updateGame(dt);
  }

  exit(_ctx: GameStateContext): void {
    // Tutorial overlay is cleaned up by Tutorial.stop()
  }
}

// ---------------------------------------------------------------------------
// PLAYING state
// ---------------------------------------------------------------------------

export class PlayingState implements IGameState {
  readonly id = GameStateId.PLAYING;

  enter(_ctx: GameStateContext): void {
    d().setGameHUDVisible(true);
    d().startCameraIntro();
  }

  update(dt: number, _ctx: GameStateContext): void {
    d().updateGame(dt);
  }

  exit(_ctx: GameStateContext): void {
    // Game pauses when leaving PLAYING
  }
}

// ---------------------------------------------------------------------------
// GAME_OVER state
// ---------------------------------------------------------------------------

export class GameOverState implements IGameState {
  readonly id = GameStateId.GAME_OVER;

  enter(_ctx: GameStateContext): void {
    // Game over overlay is shown by Game.triggerGameOver()
  }

  update(_dt: number, _ctx: GameStateContext): void {
    // Frozen state -- wait for player to click retry/menu
  }

  exit(_ctx: GameStateContext): void {
    // Cleanup handled by UI
  }
}
