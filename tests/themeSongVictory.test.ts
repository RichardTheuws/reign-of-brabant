import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioManager } from '../src/audio/AudioManager';
import { createMusicSystem, MUSIC_IDS } from '../src/systems/MusicSystem';
import { FactionId } from '../src/types/index';

describe('MusicSystem.playVictory — themesong alleen bij Brabander victory', () => {
  let playMusicSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    playMusicSpy = vi.spyOn(audioManager, 'playMusic').mockImplementation(() => {});
    playMusicSpy.mockClear();
  });

  afterEach(() => {
    playMusicSpy.mockRestore();
  });

  it('Brabanders victory → speelt themesong "music_victory_brabanders"', () => {
    const ms = createMusicSystem(FactionId.Brabanders);
    ms.playVictory(FactionId.Brabanders);
    expect(playMusicSpy).toHaveBeenCalledWith(MUSIC_IDS.VICTORY_BRABANDERS, false, 1500);
  });

  it('Randstad victory → speelt generieke "music_victory" (geen themesong)', () => {
    const ms = createMusicSystem(FactionId.Randstad);
    ms.playVictory(FactionId.Randstad);
    expect(playMusicSpy).toHaveBeenCalledWith(MUSIC_IDS.VICTORY, false, 1500);
    const trackIdsUsed = playMusicSpy.mock.calls.map(c => c[0]);
    expect(trackIdsUsed).not.toContain(MUSIC_IDS.VICTORY_BRABANDERS);
  });

  it('Limburgers victory → generieke victory', () => {
    const ms = createMusicSystem(FactionId.Limburgers);
    ms.playVictory(FactionId.Limburgers);
    expect(playMusicSpy).toHaveBeenCalledWith(MUSIC_IDS.VICTORY, false, 1500);
  });

  it('Belgen victory → generieke victory', () => {
    const ms = createMusicSystem(FactionId.Belgen);
    ms.playVictory(FactionId.Belgen);
    expect(playMusicSpy).toHaveBeenCalledWith(MUSIC_IDS.VICTORY, false, 1500);
  });

  it('victory zonder factionId → generieke victory (geen themesong-leak)', () => {
    const ms = createMusicSystem(FactionId.Brabanders);
    ms.playVictory();
    expect(playMusicSpy).toHaveBeenCalledWith(MUSIC_IDS.VICTORY, false, 1500);
  });

  it('themesong heeft eigen MUSIC_IDS key (regressie-signaal)', () => {
    expect(MUSIC_IDS.VICTORY_BRABANDERS).toBe('music_victory_brabanders');
    expect(MUSIC_IDS.VICTORY).toBe('music_victory');
    expect(MUSIC_IDS.VICTORY).not.toBe(MUSIC_IDS.VICTORY_BRABANDERS);
  });
});
