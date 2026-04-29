/**
 * Reign of Brabant -- Faction Messages
 *
 * Centrale registry van factie-aware in-game alert strings.
 * Vervangt hardcoded NL-strings in HUD.showAlert callsites.
 *
 * Tone (zie .claude/agents/memory/scenario-writer.md + feedback_rob_tone.md):
 *   - Brabanders : Zuid-Oost Brabants dialect (un=v/o, ne=m, -ke verklein, "vat" ipv "pak")
 *   - Randstad   : Corporate / DevOps jargon (geen koffie)
 *   - Limburgers : Mergel-toon, kort, gewichtig, "ich/dich/sjoen"
 *   - Belgen     : Theatraal / droog absurd, "ge/gij" + Frans-flair
 *
 * Events (v0.49.0 ronde 1):
 *   - hero-spawn       : held verschijnt
 *   - hero-death       : held sterft
 *   - building-complete: gebouw klaar (gebruikt {name})
 *   - research-complete: upgrade onderzocht (gebruikt {upgrade})
 *   - pop-cap-full     : populatie vol bij train-poging
 */

import { ExtendedFactionId } from './factionData';

export type FactionMessageEvent =
  | 'hero-spawn'
  | 'hero-death'
  | 'building-complete'
  | 'research-complete'
  | 'pop-cap-full';

type MessagePool = Record<FactionMessageEvent, string[]>;

const MESSAGES: Record<ExtendedFactionId, MessagePool> = {
  [ExtendedFactionId.Brabanders]: {
    'hero-spawn': ['{name} stao d\'r — ALAAF!'],
    'hero-death': ['{name} is gevalle… vat un pilske, jonge.'],
    'building-complete': ['{name} is klaor — schôn wèrk!'],
    'research-complete': ['{upgrade} — gemokt!'],
    'pop-cap-full': ['Vol! Bouw d\'r un huiske bij.'],
  },
  [ExtendedFactionId.Randstad]: {
    'hero-spawn': ['{name} is gearriveerd. Boardroom open.'],
    'hero-death': ['{name} offline. ETA 60s. Sprint blijft staan.'],
    'building-complete': ['{name} opgeleverd. Conform planning.'],
    'research-complete': ['{upgrade} live. Rolling out.'],
    'pop-cap-full': ['Capacity reached. Schaal kantoorruimte op.'],
  },
  [ExtendedFactionId.Limburgers]: {
    'hero-spawn': ['{name} is eraan, jong.'],
    'hero-death': ['{name}… terug naor de steen.'],
    'building-complete': ['{name} is geboewd. Sjoen.'],
    'research-complete': ['{upgrade}. Goe doende.'],
    'pop-cap-full': ['Geen plek mie. Bouw nog ne mergelhof.'],
  },
  [ExtendedFactionId.Belgen]: {
    'hero-spawn': ['{name} betreedt het slagveld!'],
    'hero-death': ['{name} gevallen — de friet huilt.'],
    'building-complete': ['{name} voltooid — voila!'],
    'research-complete': ['{upgrade} ontwikkeld in \'t atelier.'],
    'pop-cap-full': ['Vol! Allez, nog \'n gildehuis erbij.'],
  },
};

/**
 * Geeft een factie-aware alert-string voor een event.
 *
 * Bij meerdere zinnen in de pool wordt willekeurig gekozen (Warcraft-style variatie).
 * Onbekende factionId → fallback Brabanders.
 *
 * Placeholders: {name}, {upgrade} -- vervangen door params, ontbrekende placeholders
 * blijven letterlijk staan zodat regressies opvallen ipv stil falen.
 */
export function getFactionMessage(
  factionId: number,
  eventKey: FactionMessageEvent,
  params: Record<string, string | number> = {},
): string {
  const pool = MESSAGES[factionId as ExtendedFactionId] ?? MESSAGES[ExtendedFactionId.Brabanders];
  const lines = pool[eventKey];
  const template = lines[Math.floor(Math.random() * lines.length)];
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}
