/**
 * Reign of Brabant -- Audio Manager
 *
 * Centralised audio system built on Howler.js.
 * Handles SFX, music, ambient loops, UI sounds, and voice.
 *
 * Features:
 * - Per-category volume control (Music, SFX, UI, Voice, Ambient)
 * - Spatial audio: distance-based volume falloff
 * - Mute on blur (browser tab loses focus)
 * - Music crossfade with volume ducking during SFX/voice
 * - Global mute toggle
 */

import { Howl, Howler } from 'howler';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AudioCategory = 'music' | 'sfx' | 'ui' | 'voice' | 'ambient';

export interface SoundDefinition {
  /** Unique identifier for this sound. */
  id: string;
  /** URL to the audio file. */
  src: string;
  /** Audio category for volume grouping. */
  category: AudioCategory;
  /** Whether this sound should loop. */
  loop?: boolean;
  /** Base volume (0-1). Default: 1.0. */
  baseVolume?: number;
}

interface ActiveSound {
  howl: Howl;
  category: AudioCategory;
  baseVolume: number;
}

interface MusicTrack {
  howl: Howl;
  id: string;
}

// ---------------------------------------------------------------------------
// SFX path helper -- resolves to correct path in both dev and production
// ---------------------------------------------------------------------------

const SFX_BASE = '/assets/audio/sfx/';
const MUSIC_BASE = '/assets/audio/music/';

function sfxPath(filename: string): string {
  return `${SFX_BASE}${filename}`;
}

function musicPath(filename: string): string {
  return `${MUSIC_BASE}${filename}`;
}

// ---------------------------------------------------------------------------
// Sound registry -- all game sounds pre-defined
// ---------------------------------------------------------------------------

const SOUND_DEFINITIONS: SoundDefinition[] = [
  // Combat
  { id: 'sword_hit',        src: sfxPath('sword_hit.mp3'),        category: 'sfx', baseVolume: 0.7 },
  { id: 'arrow_shoot',      src: sfxPath('arrow_shoot.mp3'),      category: 'sfx', baseVolume: 0.6 },
  { id: 'arrow_impact',     src: sfxPath('arrow_impact.mp3'),     category: 'sfx', baseVolume: 0.6 },
  { id: 'unit_death',       src: sfxPath('unit_death.mp3'),       category: 'sfx', baseVolume: 0.8 },

  // Building
  { id: 'building_place',   src: sfxPath('building_place.mp3'),   category: 'sfx', baseVolume: 0.6 },
  { id: 'building_complete', src: sfxPath('building_complete.mp3'), category: 'sfx', baseVolume: 0.8 },
  { id: 'unit_trained',     src: sfxPath('unit_trained.mp3'),     category: 'sfx', baseVolume: 0.7 },

  // UI
  { id: 'click',            src: sfxPath('click.mp3'),            category: 'ui', baseVolume: 0.5 },
  { id: 'select_unit',      src: sfxPath('select_unit.mp3'),      category: 'ui', baseVolume: 0.5 },
  { id: 'error',            src: sfxPath('error.mp3'),            category: 'ui', baseVolume: 0.6 },
  { id: 'gold_deposit',     src: sfxPath('gold_deposit.mp3'),     category: 'ui', baseVolume: 0.5 },

  // Ambient
  { id: 'ambient_birds',    src: sfxPath('ambient_birds.mp3'),    category: 'ambient', loop: true, baseVolume: 0.25 },
  { id: 'ambient_wind',     src: sfxPath('ambient_wind.mp3'),     category: 'ambient', loop: true, baseVolume: 0.15 },

  // Ability
  { id: 'carnavalsrage',    src: sfxPath('carnavalsrage.mp3'),    category: 'sfx', baseVolume: 0.9 },
  { id: 'vergadering',      src: sfxPath('vergadering.mp3'),      category: 'sfx', baseVolume: 0.7 },
];

// ---------------------------------------------------------------------------
// AudioManager singleton
// ---------------------------------------------------------------------------

class AudioManager {
  private sounds = new Map<string, ActiveSound>();
  private categoryVolumes: Record<AudioCategory, number> = {
    music: 0.4,
    sfx: 0.7,
    ui: 0.5,
    voice: 0.8,
    ambient: 0.3,
  };
  private masterVolume = 1.0;
  private muted = false;

  // Currently playing music track
  private currentMusic: MusicTrack | null = null;

  // Ambient loops currently playing (howl id -> sound id)
  private ambientLoops = new Map<string, number>();

  // Spatial audio: camera position for distance calculations
  private cameraX = 0;
  private cameraZ = 0;

  // Cooldown tracking to prevent sound spam
  private lastPlayTime = new Map<string, number>();
  private readonly MIN_INTERVAL_MS = 80; // minimum ms between same sound

  // Volume ducking state
  private isDucking = false;
  private duckTimer = 0;

  // Initialised flag
  private initialized = false;

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  /**
   * Pre-load all sound definitions. Call once at game start.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Register all sound definitions
    for (const def of SOUND_DEFINITIONS) {
      const howl = new Howl({
        src: [def.src],
        loop: def.loop ?? false,
        volume: 0, // will be set dynamically
        preload: true,
        html5: def.loop ?? false, // use HTML5 audio for long ambient loops
      });

      this.sounds.set(def.id, {
        howl,
        category: def.category,
        baseVolume: def.baseVolume ?? 1.0,
      });
    }

    // Setup blur/focus handlers for auto-mute
    this.setupBlurHandlers();

    console.log(`[AudioManager] Initialized with ${SOUND_DEFINITIONS.length} sounds`);
  }

  // -------------------------------------------------------------------------
  // SFX Playback
  // -------------------------------------------------------------------------

  /**
   * Play a sound effect by its ID.
   * @param id - Sound identifier from SOUND_DEFINITIONS
   * @param position - Optional world position for spatial audio (x, z)
   * @param volumeOverride - Optional volume multiplier (0-1)
   */
  playSound(id: string, position?: { x: number; z: number }, volumeOverride?: number): void {
    if (this.muted) return;

    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`[AudioManager] Unknown sound: ${id}`);
      return;
    }

    // Cooldown check to prevent rapid-fire spam
    const now = performance.now();
    const lastTime = this.lastPlayTime.get(id) ?? 0;
    if (now - lastTime < this.MIN_INTERVAL_MS) return;
    this.lastPlayTime.set(id, now);

    // Calculate spatial volume
    let spatialMult = 1.0;
    if (position) {
      spatialMult = this.calculateSpatialVolume(position.x, position.z);
      if (spatialMult < 0.01) return; // Too far away to hear
    }

    // Final volume
    const catVol = this.categoryVolumes[sound.category];
    const baseVol = sound.baseVolume;
    const override = volumeOverride ?? 1.0;
    const finalVolume = this.masterVolume * catVol * baseVol * spatialMult * override;

    sound.howl.volume(Math.min(1.0, finalVolume));
    sound.howl.play();
  }

  // -------------------------------------------------------------------------
  // Music Playback
  // -------------------------------------------------------------------------

  /**
   * Play a music track with optional crossfade.
   * @param id - Sound ID of the music track
   * @param loop - Whether to loop (default true)
   * @param fadeMs - Crossfade duration in ms (default 2000)
   */
  playMusic(id: string, loop = true, fadeMs = 2000): void {
    if (this.muted) return;

    // Check if a music Howl is already registered
    let sound = this.sounds.get(id);

    if (!sound) {
      // Try to load as a music file
      const howl = new Howl({
        src: [musicPath(`${id}.mp3`)],
        loop,
        volume: 0,
        html5: true,
      });
      sound = { howl, category: 'music', baseVolume: 1.0 };
      this.sounds.set(id, sound);
    }

    // Fade out current music
    if (this.currentMusic) {
      const oldHowl = this.currentMusic.howl;
      oldHowl.fade(oldHowl.volume(), 0, fadeMs);
      const oldId = this.currentMusic.id;
      setTimeout(() => {
        // Only stop if it's still the old track
        if (this.currentMusic?.id !== oldId) {
          oldHowl.stop();
        }
      }, fadeMs);
    }

    // Fade in new music
    const targetVol = this.masterVolume * this.categoryVolumes.music * sound.baseVolume;
    sound.howl.volume(0);
    sound.howl.play();
    sound.howl.fade(0, targetVol, fadeMs);

    this.currentMusic = { howl: sound.howl, id };
  }

  /**
   * Stop current music with optional fade.
   * @param fadeMs - Fade out duration in ms (default 1000)
   */
  stopMusic(fadeMs = 1000): void {
    if (!this.currentMusic) return;

    const howl = this.currentMusic.howl;
    howl.fade(howl.volume(), 0, fadeMs);
    setTimeout(() => howl.stop(), fadeMs);
    this.currentMusic = null;
  }

  // -------------------------------------------------------------------------
  // Ambient Loops
  // -------------------------------------------------------------------------

  /**
   * Start an ambient loop by its sound ID.
   */
  startAmbient(id: string): void {
    if (this.ambientLoops.has(id)) return; // already playing

    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`[AudioManager] Unknown ambient: ${id}`);
      return;
    }

    const targetVol = this.masterVolume * this.categoryVolumes.ambient * sound.baseVolume;
    sound.howl.volume(0);
    const howlId = sound.howl.play();
    sound.howl.fade(0, targetVol, 2000);
    this.ambientLoops.set(id, howlId);
  }

  /**
   * Stop an ambient loop by its sound ID.
   */
  stopAmbient(id: string, fadeMs = 1000): void {
    const sound = this.sounds.get(id);
    if (!sound) return;

    sound.howl.fade(sound.howl.volume(), 0, fadeMs);
    setTimeout(() => {
      sound.howl.stop();
      this.ambientLoops.delete(id);
    }, fadeMs);
  }

  /**
   * Stop all ambient loops.
   */
  stopAllAmbient(fadeMs = 1000): void {
    for (const id of this.ambientLoops.keys()) {
      this.stopAmbient(id, fadeMs);
    }
  }

  // -------------------------------------------------------------------------
  // Volume Control
  // -------------------------------------------------------------------------

  /**
   * Set volume for a category (0-1).
   */
  setCategoryVolume(category: AudioCategory, volume: number): void {
    this.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  /**
   * Get volume for a category.
   */
  getCategoryVolume(category: AudioCategory): number {
    return this.categoryVolumes[category];
  }

  /**
   * Set master volume (0-1).
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }

  /**
   * Get master volume.
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Toggle global mute.
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    Howler.mute(this.muted);
    return this.muted;
  }

  /**
   * Set mute state directly.
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    Howler.mute(this.muted);
  }

  /**
   * Check if audio is muted.
   */
  isMuted(): boolean {
    return this.muted;
  }

  // -------------------------------------------------------------------------
  // Spatial Audio
  // -------------------------------------------------------------------------

  /**
   * Update the camera position for spatial audio calculations.
   * Call this each frame from the game loop.
   */
  updateCameraPosition(x: number, z: number): void {
    this.cameraX = x;
    this.cameraZ = z;
  }

  /**
   * Calculate volume multiplier based on distance from camera.
   * Uses inverse-square falloff with a max hearing range.
   */
  private calculateSpatialVolume(worldX: number, worldZ: number): number {
    const dx = worldX - this.cameraX;
    const dz = worldZ - this.cameraZ;
    const distSq = dx * dx + dz * dz;

    const MAX_HEAR_DIST = 60;   // Units beyond this are silent
    const FULL_VOL_DIST = 10;   // Units within this are at full volume
    const maxSq = MAX_HEAR_DIST * MAX_HEAR_DIST;
    const fullSq = FULL_VOL_DIST * FULL_VOL_DIST;

    if (distSq <= fullSq) return 1.0;
    if (distSq >= maxSq) return 0.0;

    // Smooth falloff (inverse distance, clamped)
    const dist = Math.sqrt(distSq);
    const t = (dist - FULL_VOL_DIST) / (MAX_HEAR_DIST - FULL_VOL_DIST);
    return 1.0 - t * t; // quadratic falloff
  }

  // -------------------------------------------------------------------------
  // Volume Ducking
  // -------------------------------------------------------------------------

  /**
   * Temporarily reduce music volume when important SFX plays.
   * Call when voice or important SFX triggers.
   */
  duckMusic(durationMs = 2000): void {
    if (!this.currentMusic || this.isDucking) return;

    this.isDucking = true;
    const currentVol = this.currentMusic.howl.volume();
    const duckedVol = currentVol * 0.3;

    this.currentMusic.howl.fade(currentVol, duckedVol, 200);

    clearTimeout(this.duckTimer);
    this.duckTimer = window.setTimeout(() => {
      if (this.currentMusic) {
        const targetVol = this.masterVolume * this.categoryVolumes.music;
        this.currentMusic.howl.fade(duckedVol, targetVol, 500);
      }
      this.isDucking = false;
    }, durationMs);
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private updateAllVolumes(): void {
    // Update ambient loop volumes
    for (const [id] of this.ambientLoops) {
      const sound = this.sounds.get(id);
      if (sound) {
        const vol = this.masterVolume * this.categoryVolumes[sound.category] * sound.baseVolume;
        sound.howl.volume(vol);
      }
    }

    // Update music volume
    if (this.currentMusic) {
      const musicSound = this.sounds.get(this.currentMusic.id);
      if (musicSound) {
        const vol = this.masterVolume * this.categoryVolumes.music * musicSound.baseVolume;
        this.currentMusic.howl.volume(vol);
      }
    }
  }

  private setupBlurHandlers(): void {
    let wasMuted = false;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        wasMuted = this.muted;
        if (!wasMuted) {
          Howler.mute(true);
        }
      } else {
        if (!wasMuted) {
          Howler.mute(false);
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /**
   * Stop all sounds and unload. Call on game cleanup.
   */
  dispose(): void {
    clearTimeout(this.duckTimer);
    Howler.unload();
    this.sounds.clear();
    this.ambientLoops.clear();
    this.currentMusic = null;
    this.initialized = false;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Global audio manager instance. */
export const audioManager = new AudioManager();
