/**
 * Reign of Brabant -- Music System
 *
 * Dynamically manages music based on game state:
 * - Faction themes during peaceful gameplay
 * - Battle music with 3 intensity levels based on active combat
 * - Boss battle theme when hero vs hero combat is detected
 * - Hysteresis: 5-second cooldown before dropping intensity level
 *
 * Uses AudioManager's public playMusic/stopMusic/duckMusic API.
 * Gracefully handles missing music files (AudioManager/Howler won't crash).
 */

import { query, hasComponent } from 'bitecs';
import { UnitAI, Faction } from '../ecs/components';
import { IsUnit, IsDead, IsHero } from '../ecs/tags';
import { UnitAIState, FactionId } from '../types/index';
import { audioManager } from '../audio/AudioManager';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Music track IDs (match filenames without .mp3 extension)
// ---------------------------------------------------------------------------

export const MUSIC_IDS = {
  MAIN_MENU: 'music_main_menu',
  BRABANDERS: 'music_brabanders',
  RANDSTAD: 'music_randstad',
  LIMBURGERS: 'music_limburgers',
  BELGEN: 'music_belgen',
  BATTLE_LOW: 'music_battle_low',
  BATTLE_MEDIUM: 'music_battle_medium',
  BATTLE_HIGH: 'music_battle_high',
  BOSS_BATTLE: 'music_boss_battle',
  VICTORY: 'music_victory',
  VICTORY_BRABANDERS: 'music_victory_brabanders',
  DEFEAT: 'music_defeat',
  CUTSCENE: 'music_cutscene',
  LOBBY: 'music_lobby',
  TUTORIAL: 'music_tutorial',
} as const;

// ---------------------------------------------------------------------------
// Track variants — multiple tracks per category, picked randomly
// ---------------------------------------------------------------------------

const FACTION_THEME_VARIANTS: Record<number, readonly string[]> = {
  [FactionId.Brabanders]: ['music_brabanders'],
  [FactionId.Randstad]: ['music_randstad'],
  [FactionId.Limburgers]: ['music_limburgers'],
  [FactionId.Belgen]: ['music_belgen'],
};

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Intensity levels
// ---------------------------------------------------------------------------

export enum BattleIntensity {
  None = 0,    // No combat -- faction theme
  Low = 1,     // 1-3 units in combat
  Medium = 2,  // 4-10 units in combat
  High = 3,    // 10+ units in combat
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const INTENSITY_THRESHOLDS = {
  LOW: 1,
  MEDIUM: 4,
  HIGH: 10,
} as const;

/** Seconds to wait before dropping an intensity level (hysteresis). */
const INTENSITY_DROP_COOLDOWN = 5.0;

/** How often to recalculate battle intensity (seconds). */
const UPDATE_INTERVAL = 0.5;

// ---------------------------------------------------------------------------
// MusicSystem state
// ---------------------------------------------------------------------------

interface MusicState {
  /** Current battle intensity level. */
  intensity: BattleIntensity;
  /** Target intensity based on latest scan. */
  targetIntensity: BattleIntensity;
  /** Timer for hysteresis: seconds since target dropped below current. */
  dropCooldownTimer: number;
  /** Currently playing music track ID. */
  currentTrackId: string;
  /** Player faction for theme selection. */
  playerFaction: FactionId;
  /** Whether the system is active (playing state). */
  active: boolean;
  /** Whether boss battle is active. */
  bossActive: boolean;
  /** Accumulator for update interval throttle. */
  updateTimer: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create the music system.
 *
 * @param playerFaction - The player's chosen faction (determines peace theme)
 * @returns Update function: (world, dt) => void
 */
export function createMusicSystem(playerFaction: FactionId = FactionId.Brabanders) {
  const state: MusicState = {
    intensity: BattleIntensity.None,
    targetIntensity: BattleIntensity.None,
    dropCooldownTimer: 0,
    currentTrackId: '',
    playerFaction,
    active: false,
    bossActive: false,
    updateTimer: 0,
  };

  /**
   * Start the music system -- plays faction theme.
   */
  function start(faction?: FactionId): void {
    if (faction !== undefined) state.playerFaction = faction;
    state.active = true;
    state.intensity = BattleIntensity.None;
    state.targetIntensity = BattleIntensity.None;
    state.dropCooldownTimer = 0;
    state.bossActive = false;
    state.updateTimer = 0;

    const themeId = getFactionTheme(state.playerFaction);
    playTrack(themeId);
  }

  /**
   * Stop the music system.
   */
  function stop(fadeMs = 1000): void {
    state.active = false;
    state.currentTrackId = '';
    audioManager.stopMusic(fadeMs);
  }

  /**
   * Play victory stinger.
   *
   * Brabanders krijgen hun themesong "Nie Fokke Mee Brabant" (track met tekst);
   * andere facties krijgen de generieke instrumentale victory-stinger.
   */
  function playVictory(winnerFactionId?: number): void {
    state.active = false;
    const trackId = winnerFactionId === FactionId.Brabanders
      ? MUSIC_IDS.VICTORY_BRABANDERS
      : MUSIC_IDS.VICTORY;
    playTrack(trackId, false, 1500);
  }

  /**
   * Play defeat stinger.
   */
  function playDefeat(): void {
    state.active = false;
    playTrack(MUSIC_IDS.DEFEAT, false, 1500);
  }

  /**
   * Main update loop -- called each frame.
   */
  function update(world: GameWorld, dt: number): void {
    if (!state.active) return;

    // Throttle intensity calculations
    state.updateTimer += dt;
    if (state.updateTimer < UPDATE_INTERVAL) return;
    state.updateTimer = 0;

    // Scan for units in combat
    const { attackingCount, heroVsHero } = scanCombat(world);

    // Determine target intensity
    const newTarget = getIntensityForCount(attackingCount);

    // Boss battle detection
    if (heroVsHero && !state.bossActive) {
      state.bossActive = true;
      playTrack(MUSIC_IDS.BOSS_BATTLE, true, 1500);
      return;
    }

    // Exit boss battle when no hero combat
    if (!heroVsHero && state.bossActive) {
      state.bossActive = false;
      // Fall through to normal intensity handling
    }

    // Skip normal intensity updates during boss battle
    if (state.bossActive) return;

    state.targetIntensity = newTarget;

    // Hysteresis: only drop intensity after cooldown
    if (state.targetIntensity < state.intensity) {
      state.dropCooldownTimer += UPDATE_INTERVAL;
      if (state.dropCooldownTimer >= INTENSITY_DROP_COOLDOWN) {
        // Drop one level at a time
        state.intensity = Math.max(state.targetIntensity, state.intensity - 1) as BattleIntensity;
        state.dropCooldownTimer = 0;
        switchToIntensityTrack(state.intensity);
      }
    } else {
      // Intensity stays same or increases -- reset cooldown
      state.dropCooldownTimer = 0;
      if (state.targetIntensity > state.intensity) {
        state.intensity = state.targetIntensity;
        switchToIntensityTrack(state.intensity);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function scanCombat(world: GameWorld): { attackingCount: number; heroVsHero: boolean } {
    const units = query(world, [UnitAI, Faction, IsUnit]);
    let attackingCount = 0;
    let heroVsHero = false;

    // Collect attacking heroes per faction for hero-vs-hero detection
    const attackingHeroesByFaction = new Map<number, number[]>();

    for (const eid of units) {
      if (hasComponent(world, eid, IsDead)) continue;
      if (UnitAI.state[eid] !== UnitAIState.Attacking) continue;

      attackingCount++;

      // Track attacking heroes
      if (hasComponent(world, eid, IsHero)) {
        const faction = Faction.id[eid];
        if (!attackingHeroesByFaction.has(faction)) {
          attackingHeroesByFaction.set(faction, []);
        }
        attackingHeroesByFaction.get(faction)!.push(eid);
      }
    }

    // Hero vs hero: at least two different factions have heroes attacking
    if (attackingHeroesByFaction.size >= 2) {
      heroVsHero = true;
    }

    return { attackingCount, heroVsHero };
  }

  function getIntensityForCount(count: number): BattleIntensity {
    if (count >= INTENSITY_THRESHOLDS.HIGH) return BattleIntensity.High;
    if (count >= INTENSITY_THRESHOLDS.MEDIUM) return BattleIntensity.Medium;
    if (count >= INTENSITY_THRESHOLDS.LOW) return BattleIntensity.Low;
    return BattleIntensity.None;
  }

  function switchToIntensityTrack(intensity: BattleIntensity): void {
    const trackId = getTrackForIntensity(intensity);
    // Always switch when returning to faction theme (random variant may differ)
    if (trackId !== state.currentTrackId || intensity === BattleIntensity.None) {
      playTrack(trackId);
    }
  }

  function getTrackForIntensity(intensity: BattleIntensity): string {
    switch (intensity) {
      case BattleIntensity.High: return MUSIC_IDS.BATTLE_HIGH;
      case BattleIntensity.Medium: return MUSIC_IDS.BATTLE_MEDIUM;
      case BattleIntensity.Low: return MUSIC_IDS.BATTLE_LOW;
      case BattleIntensity.None:
      default:
        return getFactionTheme(state.playerFaction);
    }
  }

  function getFactionTheme(faction: FactionId): string {
    const variants = FACTION_THEME_VARIANTS[faction];
    return variants ? pickRandom(variants) : MUSIC_IDS.BRABANDERS;
  }

  function playTrack(trackId: string, loop = true, fadeMs = 2000): void {
    if (trackId === state.currentTrackId) return;
    state.currentTrackId = trackId;
    audioManager.playMusic(trackId, loop, fadeMs);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    update,
    start,
    stop,
    playVictory,
    playDefeat,
    /** Get current battle intensity (for UI/debug). */
    getIntensity: () => state.intensity,
    /** Check if system is active. */
    isActive: () => state.active,
  };
}

/** Type of the object returned by createMusicSystem. */
export type MusicSystem = ReturnType<typeof createMusicSystem>;
