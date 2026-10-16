/**
 * UnitVoices availability + Howl-reuse regression tests.
 *
 * Bug (v0.60.3): every Randstad unit requested ability_1/2.mp3 and
 * idle_1/2.mp3 (also used for 'ready') from its per-unit folder, but those 32
 * files were never recorded → 404 in production on first use. The generic
 * faction fallback only kicked in after the 404 had marked the path failed.
 *
 * Coverage:
 *  (a) every path the voice system can request is a git-tracked file under
 *      public/ (only git-tracked files reach production via deploy-rob.sh)
 *  (b) Randstad idle/ability/ready never requests a per-unit file that does
 *      not exist, and plays the generic Randstad line instead
 *  (c) Howls are unloaded when their line ends / fails, so live instances do
 *      not grow unbounded when lines play repeatedly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Howl } from 'howler';
import {
  playUnitVoice,
  __easterEggRng,
  __allVoicePaths,
  MISSING_UNIT_VOICE_CATEGORIES,
} from '../src/audio/UnitVoices';
import { FactionId, UnitTypeId } from '../src/types/index';

vi.mock('howler', () => {
  const HowlMock = vi.fn();
  HowlMock.mockImplementation(function (this: any, opts: { src: string[] }) {
    this.play = vi.fn();
    this.playing = vi.fn(() => false);
    this.unload = vi.fn();
    this._src = opts.src;
    this._opts = opts;
  });
  return {
    Howl: HowlMock,
    Howler: { volume: vi.fn() },
  };
});

vi.mock('../src/audio/AudioManager', () => ({
  audioManager: {
    duckMusic: vi.fn(),
    playSound: vi.fn(),
  },
}));

const REPO_ROOT = resolve(__dirname, '..');
const TRACKED = new Set(
  execSync('git ls-files public/assets/audio/voices', { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((p) => '/' + p.replace(/^public\//, '')),
);

const RANDSTAD_UNIT_TYPES = [
  UnitTypeId.Worker,
  UnitTypeId.Infantry,
  UnitTypeId.Ranged,
  UnitTypeId.Heavy,
  UnitTypeId.Siege,
  UnitTypeId.Support,
  UnitTypeId.Special,
  UnitTypeId.Hero,
];

describe('UnitVoices — availability table matches the recorded files', () => {
  it('(a) every requestable voice path is a git-tracked file under public/', () => {
    const paths = __allVoicePaths();
    expect(paths.length).toBeGreaterThan(100);
    const missing = paths.filter((p) => !TRACKED.has(p));
    expect(missing).toEqual([]);
  });

  it('MISSING_UNIT_VOICE_CATEGORIES is not stale (listed categories really have no files)', () => {
    const stale: string[] = [];
    for (const [folder, categories] of Object.entries(MISSING_UNIT_VOICE_CATEGORIES)) {
      for (const cat of categories) {
        const prefix = `/assets/audio/voices/${folder}/${cat}_`;
        if ([...TRACKED].some((p) => p.startsWith(prefix))) stale.push(`${folder}/${cat}`);
      }
    }
    expect(stale).toEqual([]);
  });
});

describe('UnitVoices — Randstad missing categories route to generic pool', () => {
  let nextTime = 3_000_000;

  beforeEach(() => {
    nextTime += 5000;
    vi.setSystemTime(nextTime);
    (Howl as any).mockClear();
    __easterEggRng.random = () => 0.99; // no easter-eggs
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  for (const action of ['idle', 'ability', 'ready'] as const) {
    it(`(b) Randstad ${action} → no per-unit request, plays /randstad/<action>_N.mp3`, () => {
      for (const ut of RANDSTAD_UNIT_TYPES) {
        nextTime += 5000;
        vi.setSystemTime(nextTime);
        (Howl as any).mockClear();
    
        playUnitVoice(FactionId.Randstad, action, ut, 'male');

        const calls = (Howl as any).mock.calls;
        expect(calls.length).toBe(1);
        const src = calls[0][0].src[0] as string;
        expect(TRACKED.has(src)).toBe(true);
        const fileAction = action === 'ready' ? 'idle' : action;
        expect(src).toMatch(new RegExp(`^/assets/audio/voices/randstad/${fileAction}_\\d\\.mp3$`));
      }
    });
  }

  it('Randstad select still uses the recorded per-unit lines', () => {
    playUnitVoice(FactionId.Randstad, 'select', UnitTypeId.Infantry, 'male');
    const src = (Howl as any).mock.calls[0][0].src[0] as string;
    expect(src).toMatch(/\/randstad\/manager\/select_\d\.mp3$/);
  });
});

describe('UnitVoices — Howl instances do not accumulate', () => {
  let nextTime = 4_000_000;

  beforeEach(() => {
    (Howl as any).mockClear();
    __easterEggRng.random = () => 0.99;
    vi.spyOn(Math, 'random').mockReturnValue(0); // always pick variant 1
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const live = () =>
    ((Howl as any).mock.instances as any[]).filter((h) => h.unload.mock.calls.length === 0);

  it('(c) same line played 50× → every finished Howl is unloaded (0 live)', () => {
    for (let i = 0; i < 50; i++) {
      nextTime += 5000; // past the 800ms cooldown
      vi.setSystemTime(nextTime);
      playUnitVoice(FactionId.Brabanders, 'select', UnitTypeId.Worker, 'male');
      const instances = (Howl as any).mock.instances as any[];
      const h = instances[instances.length - 1];
      expect(h.play).toHaveBeenCalledTimes(1);
      h._opts.onplay?.();
      h._opts.onend?.();
    }
    expect((Howl as any).mock.instances.length).toBe(50);
    expect(live()).toHaveLength(0);
  });

  it('overlap preserved: a line still playing is not unloaded by the next one', () => {
    nextTime += 5000;
    vi.setSystemTime(nextTime);
    playUnitVoice(FactionId.Brabanders, 'select', UnitTypeId.Worker, 'male');
    nextTime += 1000; // past cooldown, first line has not ended
    vi.setSystemTime(nextTime);
    playUnitVoice(FactionId.Brabanders, 'select', UnitTypeId.Worker, 'male');
    expect((Howl as any).mock.instances.length).toBe(2);
    expect(live()).toHaveLength(2);
  });

  it('cooldown still suppresses rapid repeats (no extra Howl within 800ms)', () => {
    nextTime += 5000;
    vi.setSystemTime(nextTime);
    playUnitVoice(FactionId.Brabanders, 'select', UnitTypeId.Worker, 'male');
    vi.setSystemTime(nextTime + 100);
    playUnitVoice(FactionId.Brabanders, 'select', UnitTypeId.Worker, 'male');
    expect((Howl as any).mock.instances.length).toBe(1);
  });

  it('load error → Howl unloaded and path never requested again', () => {
    nextTime += 5000;
    vi.setSystemTime(nextTime);
    playUnitVoice(FactionId.Belgen, 'attack', UnitTypeId.Infantry, 'male');
    const first = (Howl as any).mock.instances[0];
    const failedSrc = first._src[0] as string;
    first._opts.onloaderror?.();
    expect(first.unload).toHaveBeenCalled();

    nextTime += 5000;
    vi.setSystemTime(nextTime);
    playUnitVoice(FactionId.Belgen, 'attack', UnitTypeId.Infantry, 'male');
    const second = (Howl as any).mock.instances[1];
    expect(second._src[0]).not.toBe(failedSrc);
  });
});
