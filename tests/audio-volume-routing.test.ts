/**
 * Audio volume-routing regression tests.
 *
 * Bugs (v0.60.4):
 *  1. Unit voices played at a fixed volume (0.6 / 0.7), so the SFX slider in
 *     the settings menu did nothing for them.
 *  2. AudioManager.playSound set the volume on the whole Howl instead of on
 *     the new playback id, so a distant copy of a sound turned down a nearby
 *     copy that was already playing.
 *  3. Ambient loops were never stopped on match cleanup, and stopAmbient only
 *     dropped the loop from its bookkeeping after the fade, so a restart within
 *     the fade window could not start the loop again.
 *  4. MUSIC_IDS CUTSCENE / LOBBY / TUTORIAL pointed at mp3s that do not exist.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const howls: any[] = [];

vi.mock('howler', () => {
  const HowlMock = vi.fn();
  HowlMock.mockImplementation(function (this: any, opts: any) {
    let nextId = 1;
    this._opts = opts;
    this._src = opts.src;
    this.play = vi.fn(() => nextId++);
    this.volume = vi.fn(() => 0.5);
    this.fade = vi.fn();
    this.stop = vi.fn();
    this.unload = vi.fn();
    this.playing = vi.fn(() => false);
    howls.push(this);
  });
  return {
    Howl: HowlMock,
    Howler: { volume: vi.fn(), mute: vi.fn(), unload: vi.fn() },
  };
});

import { audioManager } from '../src/audio/AudioManager';
import { playUnitVoice, __easterEggRng } from '../src/audio/UnitVoices';
import { MUSIC_IDS } from '../src/systems/MusicSystem';
import { FactionId } from '../src/types/index';

function howlFor(src: string): any {
  const h = howls.find((x) => x._src[0].endsWith(src));
  if (!h) throw new Error(`no Howl for ${src}`);
  return h;
}

let now = 10_000_000;
function nextVoiceSlot(): void {
  now += 5000;
  vi.setSystemTime(now);
}

beforeAll(() => {
  vi.stubGlobal('document', { addEventListener: vi.fn(), hidden: false });
  vi.useFakeTimers();
  audioManager.init();
});

beforeEach(() => {
  audioManager.setCategoryVolume('sfx', 0.7);
  audioManager.setCategoryVolume('voice', 0.8);
  __easterEggRng.random = () => 0.99; // never an easter egg
  nextVoiceSlot();
});

describe('AudioManager.playSound — per playback id volume', () => {
  it('sets the volume on the new sound id, not on the whole Howl', () => {
    const h = howlFor('sword_hit.mp3');
    h.volume.mockClear();
    h.play.mockClear();

    const perf = vi.spyOn(performance, 'now');
    audioManager.updateCameraPosition(0, 0);
    perf.mockReturnValue(1_000_000);
    audioManager.playSound('sword_hit', { x: 0, z: 0 });
    perf.mockReturnValue(1_000_200); // past the per-sound spam cooldown
    audioManager.playSound('sword_hit', { x: 40, z: 0 });
    perf.mockRestore();

    const ids = h.play.mock.results.map((r: any) => r.value);
    expect(ids).toHaveLength(2);
    expect(h.volume).toHaveBeenCalledTimes(2);
    for (const [i, call] of h.volume.mock.calls.entries()) {
      expect(call).toHaveLength(2);
      expect(call[1]).toBe(ids[i]);
    }
    // the distant copy is quieter than the near one
    expect(h.volume.mock.calls[1][0]).toBeLessThan(h.volume.mock.calls[0][0]);
  });
});

describe('UnitVoices — follow the voice volume setting ("Stemmen")', () => {
  it('default settings keep the historic voice loudness (0.6)', () => {
    playUnitVoice(FactionId.Brabanders, 'select');
    const h = howls[howls.length - 1];
    expect(h._opts.volume).toBeCloseTo(0.6, 5);
  });

  it('voice slider at 0 silences voices; halving it halves them', () => {
    audioManager.setCategoryVolume('voice', 0);
    playUnitVoice(FactionId.Brabanders, 'select');
    expect(howls[howls.length - 1]._opts.volume).toBe(0);

    nextVoiceSlot();
    audioManager.setCategoryVolume('voice', 0.4);
    playUnitVoice(FactionId.Brabanders, 'move');
    expect(howls[howls.length - 1]._opts.volume).toBeCloseTo(0.3, 5);
  });

  it('the SFX slider no longer changes voice loudness', () => {
    audioManager.setCategoryVolume('sfx', 0);
    playUnitVoice(FactionId.Brabanders, 'select');
    expect(howls[howls.length - 1]._opts.volume).toBeCloseTo(0.6, 5);
  });

  it('a slider change while a line plays updates that line live', () => {
    playUnitVoice(FactionId.Belgen, 'attack');
    const h = howls[howls.length - 1];
    h.volume.mockClear();

    audioManager.setCategoryVolume('voice', 0);
    expect(h.volume).toHaveBeenLastCalledWith(0);

    // after the line ends it is no longer touched
    h._opts.onend();
    h.volume.mockClear();
    audioManager.setCategoryVolume('voice', 0.8);
    expect(h.volume).not.toHaveBeenCalled();
  });
});

describe('AudioManager ambient loops — stopped on cleanup', () => {
  it('stopAllAmbient stops each loop by playback id and allows an immediate restart', () => {
    const birds = howlFor('ambient_birds.mp3');
    birds.play.mockClear();
    birds.stop.mockClear();
    birds.fade.mockClear();

    audioManager.startAmbient('ambient_birds');
    const firstId = birds.play.mock.results[0].value;
    expect(birds.fade).toHaveBeenLastCalledWith(0, expect.any(Number), 2000, firstId);

    audioManager.stopAllAmbient(500);
    // restart within the fade window (next match) must start a new loop
    audioManager.startAmbient('ambient_birds');
    expect(birds.play).toHaveBeenCalledTimes(2);
    const secondId = birds.play.mock.results[1].value;

    vi.advanceTimersByTime(600);
    expect(birds.stop).toHaveBeenCalledWith(firstId);
    expect(birds.stop).not.toHaveBeenCalledWith(secondId);
    expect(birds.stop).not.toHaveBeenCalledWith();

    audioManager.stopAllAmbient(0);
    vi.advanceTimersByTime(10);
    expect(birds.stop).toHaveBeenCalledWith(secondId);
  });
});

describe('MusicSystem MUSIC_IDS — every id has a shipped mp3', () => {
  it('maps every track id to a git-tracked file', () => {
    const tracked = new Set(
      execSync('git ls-files public/assets/audio/music', {
        cwd: resolve(__dirname, '..'),
        encoding: 'utf8',
      })
        .split('\n')
        .filter(Boolean),
    );
    const missing = Object.values(MUSIC_IDS).filter(
      (id) => !tracked.has(`public/assets/audio/music/${id}.mp3`),
    );
    expect(missing).toEqual([]);
  });
});
