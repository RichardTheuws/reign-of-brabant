/**
 * gameSettings.ts -- Persisted player settings + change notification.
 *
 * Single source of truth for the settings panel (MenuScreens) and every
 * system that has to react to a toggle (renderer shadows, bloom pass,
 * particles, build grid, camera edge-scroll).
 *
 *   getGameSettings()            -> current values (loaded lazily from storage)
 *   updateGameSettings(patch)    -> merge, persist, notify listeners
 *   onGameSettingsChange(fn)     -> fn(settings) now AND on every change;
 *                                   returns an unsubscribe function
 *
 * localStorage access is always wrapped in try/catch (private mode, blocked
 * storage, corrupt JSON) and falls back to defaults.
 */

export const SETTINGS_KEY = 'rob-settings';

export interface GameSettings {
  musicVolume: number;   // 0-100
  sfxVolume: number;     // 0-100
  ambientVolume: number; // 0-100
  shadows: boolean;
  bloom: boolean;
  particles: boolean;
  edgeScroll: boolean;
  grid: boolean;
}

export const DEFAULT_SETTINGS: Readonly<GameSettings> = {
  musicVolume: 40,
  sfxVolume: 70,
  ambientVolume: 30,
  shadows: true,
  bloom: true,
  particles: true,
  edgeScroll: true,
  grid: false,
};

export type GameSettingsListener = (settings: Readonly<GameSettings>) => void;

let current: GameSettings | null = null;
const listeners = new Set<GameSettingsListener>();

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
  } catch { /* ignore corrupt data / unavailable storage */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* storage full / private mode */ }
}

/** Current settings (loaded from storage on first access). */
export function getGameSettings(): Readonly<GameSettings> {
  if (!current) current = loadSettings();
  return current;
}

/** Merge `patch` into the settings, persist, and notify all listeners. */
export function updateGameSettings(patch: Partial<GameSettings>): void {
  current = { ...getGameSettings(), ...patch };
  saveSettings(current);
  const snapshot = current;
  for (const fn of [...listeners]) {
    try {
      fn(snapshot);
    } catch (err) {
      console.warn('[settings] listener failed', err);
    }
  }
}

/**
 * Subscribe to settings. The listener is invoked immediately with the current
 * values (apply-on-load) and again after every update (apply-on-change).
 */
export function onGameSettingsChange(fn: GameSettingsListener): () => void {
  listeners.add(fn);
  fn(getGameSettings());
  return () => {
    listeners.delete(fn);
  };
}

/** Test helper: drop cached settings + listeners so the next read re-loads. */
export function resetGameSettingsForTests(): void {
  current = null;
  listeners.clear();
}
