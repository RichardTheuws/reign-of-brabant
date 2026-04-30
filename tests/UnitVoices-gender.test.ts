/**
 * UnitVoices gender-aware fallback tests.
 *
 * Coverage:
 *  (a) Male unit pulls from male generic pool
 *  (b) Female unit pulls from female generic pool
 *  (c) Mixed unit picks from union of both pools
 *  (d) Female fallback warns + uses male pool when female pool is empty
 *  (e) getUnitVoiceGender resolves the gender flag from factionData
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Howl } from 'howler';
import {
  playUnitVoice,
  __easterEggRng,
  __resetFallbackWarnings,
  __getGenericPool,
} from '../src/audio/UnitVoices';
import { FactionId, UnitTypeId } from '../src/types/index';
import { getUnitVoiceGender } from '../src/data/factionData';

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

vi.mock('../src/audio/AudioManager', () => ({
  audioManager: {
    duckMusic: vi.fn(),
    playSound: vi.fn(),
  },
}));

describe('UnitVoices — gender-aware generic pool', () => {
  let nextTime = 2_000_000;

  function advanceTime() {
    nextTime += 5000;
    vi.setSystemTime(nextTime);
  }

  beforeEach(() => {
    advanceTime();
    (Howl as any).mockClear();
    // Disable easter-eggs deterministically (always > 0.05)
    __easterEggRng.random = () => 0.99;
    __resetFallbackWarnings();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // (a) Male unit → male pool
  // -------------------------------------------------------------------------
  describe('(a) male gender → male pool', () => {
    it('Limburgers male → path under /limburgers/ (Reinoud or nick) and NOT /limburgers/female/', () => {
      // Force fallback to generic by passing an unknown unitTypeId-equivalent
      // — but Limburgers heroes/specials all have per-unit pools, so we test
      // the resolver directly to be deterministic.
      const malePool = __getGenericPool(FactionId.Limburgers, 'select', 'male');
      const femalePool = __getGenericPool(FactionId.Limburgers, 'select', 'female');

      expect(malePool.length).toBeGreaterThan(0);
      // Male pool must NOT include female-folder paths
      for (const p of malePool) {
        expect(p).not.toMatch(/\/limburgers\/female\//);
      }
      // Sanity: female pool DOES include them (precondition for next tests)
      expect(femalePool.some(p => /\/limburgers\/female\//.test(p))).toBe(true);
    });

    it('Belgen male → no Sharon paths, only base belgen lines', () => {
      const malePool = __getGenericPool(FactionId.Belgen, 'select', 'male');
      expect(malePool.length).toBeGreaterThan(0);
      for (const p of malePool) {
        expect(p).not.toMatch(/\/belgen\/sharon\//);
      }
    });
  });

  // -------------------------------------------------------------------------
  // (b) Female unit → female pool
  // -------------------------------------------------------------------------
  describe('(b) female gender → female pool', () => {
    it('Limburgers female → all paths under /limburgers/female/', () => {
      const pool = __getGenericPool(FactionId.Limburgers, 'select', 'female');
      expect(pool.length).toBeGreaterThan(0);
      for (const p of pool) {
        expect(p).toMatch(/\/limburgers\/female\//);
      }
    });

    it('Belgen female → all paths under /belgen/sharon/ (Sharon Vlaams)', () => {
      const pool = __getGenericPool(FactionId.Belgen, 'select', 'female');
      expect(pool.length).toBeGreaterThan(0);
      for (const p of pool) {
        expect(p).toMatch(/\/belgen\/sharon\//);
      }
    });
  });

  // -------------------------------------------------------------------------
  // (c) Mixed gender → union of both pools (or non-empty pool if one missing)
  // -------------------------------------------------------------------------
  describe('(c) mixed gender → union of pools', () => {
    it('Limburgers mixed → pool includes BOTH male (no /female/) and female paths', () => {
      const mixed = __getGenericPool(FactionId.Limburgers, 'select', 'mixed');
      const hasMale = mixed.some(p => /\/limburgers\/select_/.test(p) || /\/limburgers\/nick\//.test(p));
      const hasFemale = mixed.some(p => /\/limburgers\/female\//.test(p));
      expect(hasMale).toBe(true);
      expect(hasFemale).toBe(true);
    });

    it('Brabanders mixed → falls back to male pool (no female pool defined)', () => {
      const mixed = __getGenericPool(FactionId.Brabanders, 'select', 'mixed');
      const malePool = __getGenericPool(FactionId.Brabanders, 'select', 'male');
      expect(mixed).toEqual(malePool);
    });
  });

  // -------------------------------------------------------------------------
  // (d) Empty female pool → warn + male fallback
  // -------------------------------------------------------------------------
  describe('(d) empty female pool → console.warn + male-pool fallback', () => {
    it('Brabanders female → uses male pool and emits a console.warn', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const pool = __getGenericPool(FactionId.Brabanders, 'select', 'female');
      const malePool = __getGenericPool(FactionId.Brabanders, 'select', 'male');

      expect(pool).toEqual(malePool);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/Female pool empty/);
      expect(warnSpy.mock.calls[0][0]).toMatch(/faction 0/);
    });

    it('warn is de-duplicated per (factionId, action) pair', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      __getGenericPool(FactionId.Randstad, 'select', 'female');
      __getGenericPool(FactionId.Randstad, 'select', 'female');
      __getGenericPool(FactionId.Randstad, 'select', 'female');

      // Same (faction, action) → only 1 warn
      expect(warnSpy).toHaveBeenCalledTimes(1);

      __getGenericPool(FactionId.Randstad, 'attack', 'female');
      // Different action → 2nd warn
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // (e) getUnitVoiceGender — factionData lookup
  // -------------------------------------------------------------------------
  describe('(e) getUnitVoiceGender — factionData integration', () => {
    it('returns "male" for Brabanders Boer (worker)', () => {
      expect(getUnitVoiceGender(FactionId.Brabanders, UnitTypeId.Worker)).toBe('male');
    });

    it('returns "female" for Brabanders Boerinneke (support)', () => {
      expect(getUnitVoiceGender(FactionId.Brabanders, UnitTypeId.Support)).toBe('female');
    });

    it('returns "female" for Belgen Wafelzuster (support)', () => {
      expect(getUnitVoiceGender(FactionId.Belgen, UnitTypeId.Support)).toBe('female');
    });

    it('returns "male" for Limburgers Mijnwerker (worker)', () => {
      expect(getUnitVoiceGender(FactionId.Limburgers, UnitTypeId.Worker)).toBe('male');
    });

    it('returns "male" for Randstad Manager (infantry, Serge)', () => {
      expect(getUnitVoiceGender(FactionId.Randstad, UnitTypeId.Infantry)).toBe('male');
    });

    it('returns "mixed" for unknown unitTypeId (graceful fallback, no throw)', () => {
      // Hero (7) is not in FACTION_UNITS map → throws → caught → mixed
      expect(getUnitVoiceGender(FactionId.Brabanders, UnitTypeId.Hero)).toBe('mixed');
    });
  });

  // -------------------------------------------------------------------------
  // (f) End-to-end via playUnitVoice — verify the chosen src honours gender
  // -------------------------------------------------------------------------
  describe('(f) playUnitVoice end-to-end', () => {
    it('female + Limburgers + unknown unitTypeId → plays a /limburgers/female/ file', () => {
      // Force pure-fallback by passing an unsupported unitTypeId (Hero=7 has
      // a per-unit folder, but we want generic). Pass undefined → straight
      // to generic fallback.
      playUnitVoice(FactionId.Limburgers, 'select', undefined, 'female');
      const calls = (Howl as any).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const src = calls[0][0].src[0] as string;
      expect(src).toMatch(/\/limburgers\/female\//);
    });

    it('male + Belgen → never plays /belgen/sharon/ files', () => {
      // Use unitTypeId for Worker (Frietkraamhouder, mixed) but force male via gender param
      playUnitVoice(FactionId.Belgen, 'select', undefined, 'male');
      const calls = (Howl as any).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const src = calls[0][0].src[0] as string;
      expect(src).not.toMatch(/\/belgen\/sharon\//);
    });
  });
});
