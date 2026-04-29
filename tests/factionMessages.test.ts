import { describe, it, expect } from 'vitest';
import { getFactionMessage, type FactionMessageEvent } from '../src/data/factionMessages';
import { ExtendedFactionId } from '../src/data/factionData';

const FACTIONS: Array<{ id: ExtendedFactionId; label: string }> = [
  { id: ExtendedFactionId.Brabanders, label: 'Brabanders' },
  { id: ExtendedFactionId.Randstad, label: 'Randstad' },
  { id: ExtendedFactionId.Limburgers, label: 'Limburgers' },
  { id: ExtendedFactionId.Belgen, label: 'Belgen' },
];

const EVENTS: FactionMessageEvent[] = [
  'hero-spawn',
  'hero-death',
  'building-complete',
  'research-complete',
  'pop-cap-full',
];

// Per-factie tone-anchors: één frase die ECHT van die factie moet zijn,
// zodat een copy-paste tussen pools meteen valt.
const TONE_ANCHORS: Record<ExtendedFactionId, RegExp> = {
  [ExtendedFactionId.Brabanders]: /(ALAAF|pilske|jonge|klaor|gemokt|huiske)/i,
  [ExtendedFactionId.Randstad]: /(boardroom|sprint|capacity|opgeleverd|rolling|kantoorruimte)/i,
  [ExtendedFactionId.Limburgers]: /(jong|steen|sjoen|geboewd|mergelhof|goe doende)/i,
  [ExtendedFactionId.Belgen]: /(slagveld|friet|voila|atelier|allez|gildehuis)/i,
};

describe('getFactionMessage — coverage matrix (4 facties × 5 events)', () => {
  for (const faction of FACTIONS) {
    for (const event of EVENTS) {
      it(`${faction.label} / ${event} returns non-empty string`, () => {
        const msg = getFactionMessage(faction.id, event, { name: 'X', upgrade: 'Y' });
        expect(msg).toBeTruthy();
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
      });
    }
  }
});

describe('getFactionMessage — placeholder substitution', () => {
  it('vervangt {name} in hero-spawn', () => {
    const msg = getFactionMessage(ExtendedFactionId.Brabanders, 'hero-spawn', { name: 'Den Prins' });
    expect(msg).toContain('Den Prins');
    expect(msg).not.toContain('{name}');
  });

  it('vervangt {upgrade} in research-complete', () => {
    const msg = getFactionMessage(ExtendedFactionId.Randstad, 'research-complete', { upgrade: 'Boekhouder Bonus' });
    expect(msg).toContain('Boekhouder Bonus');
    expect(msg).not.toContain('{upgrade}');
  });

  it('laat onbekende placeholder letterlijk staan (regressie-signaal)', () => {
    const msg = getFactionMessage(ExtendedFactionId.Belgen, 'hero-spawn', {});
    expect(msg).toContain('{name}');
  });
});

describe('getFactionMessage — factie-tone leakage check', () => {
  for (const faction of FACTIONS) {
    it(`${faction.label} pool bevat tenminste één eigen tone-anchor over alle events`, () => {
      const corpus = EVENTS.map((e) => getFactionMessage(faction.id, e, { name: 'X', upgrade: 'Y' })).join(' | ');
      expect(corpus).toMatch(TONE_ANCHORS[faction.id]);
    });
  }

  it('Brabants ALAAF zit NIET in andere facties hero-spawn (live-bug v0.49.0)', () => {
    for (const faction of FACTIONS) {
      const msg = getFactionMessage(faction.id, 'hero-spawn', { name: 'X' });
      if (faction.id === ExtendedFactionId.Brabanders) {
        expect(msg).toMatch(/ALAAF/);
      } else {
        expect(msg).not.toMatch(/ALAAF/i);
      }
    }
  });
});

describe('getFactionMessage — fallback', () => {
  it('valt terug op Brabanders bij onbekende factionId', () => {
    const msg = getFactionMessage(99, 'hero-spawn', { name: 'X' });
    expect(msg).toMatch(/ALAAF/);
  });
});
