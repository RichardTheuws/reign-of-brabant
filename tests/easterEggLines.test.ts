import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Howl } from 'howler';
import { playUnitVoice, __easterEggRng } from '../src/audio/UnitVoices';
import { FactionId } from '../src/types/index';

vi.mock('howler', () => {
  const HowlMock = vi.fn();
  HowlMock.mockImplementation(function (this: any, opts: { src: string[] }) {
    this.play = vi.fn();
    this._src = opts.src;
  });
  return {
    Howl: HowlMock,
    Howler: { volume: vi.fn() },
  };
});

describe('UnitVoices easter-egg lines — 5% kans op signature line', () => {
  let originalRandom: () => number;
  let nextTime = 1_000_000;

  function advanceTime() {
    nextTime += 5000;
    vi.setSystemTime(nextTime);
  }

  beforeEach(() => {
    originalRandom = __easterEggRng.random;
    advanceTime();
    (Howl as any).mockClear();
  });

  afterEach(() => {
    __easterEggRng.random = originalRandom;
    vi.useRealTimers();
  });

  it('LOW random (< 0.05) op select → easter-egg line wordt afgespeeld', () => {
    __easterEggRng.random = vi.fn().mockReturnValueOnce(0.01).mockReturnValueOnce(0.0);
    playUnitVoice(FactionId.Brabanders, 'select');
    const calls = (Howl as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const src = calls[0][0].src[0];
    expect(src).toMatch(/easter-egg/);
    expect(src).toMatch(/brabanders/);
  });

  it('HIGH random (> 0.05) → géén easter-egg', () => {
    __easterEggRng.random = vi.fn().mockReturnValue(0.99);
    playUnitVoice(FactionId.Brabanders, 'select');
    const calls = (Howl as any).mock.calls;
    if (calls.length > 0) {
      const src = calls[0][0].src[0];
      expect(src).not.toMatch(/easter-egg/);
    }
  });

  it('easter-egg triggert NIET op move/attack', () => {
    __easterEggRng.random = vi.fn().mockReturnValue(0.0);
    playUnitVoice(FactionId.Brabanders, 'attack');
    const calls = (Howl as any).mock.calls;
    if (calls.length > 0) {
      const src = calls[0][0].src[0];
      expect(src).not.toMatch(/easter-egg/);
    }
  });

  it('elke factie heeft eigen easter-egg pool met juiste filenames', () => {
    const factions: Array<[FactionId, string]> = [
      [FactionId.Brabanders, 'brabanders'],
      [FactionId.Randstad, 'randstad'],
      [FactionId.Limburgers, 'limburgers'],
      [FactionId.Belgen, 'belgen'],
    ];

    for (const [fid, dir] of factions) {
      advanceTime();
      (Howl as any).mockClear();
      __easterEggRng.random = vi.fn().mockReturnValue(0.0);
      playUnitVoice(fid, 'select');
      const calls = (Howl as any).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const src = calls[0][0].src[0];
      expect(src).toMatch(new RegExp(`/${dir}/easter-egg/`));
    }
  });
});
