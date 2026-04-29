/**
 * ChocolaterieSystem — Belgen TertiaryResource (Chocolaterie) passive.
 *
 * **Pralines voor Iedereen** (passive, voorraad-based) — per 100 Chocolade
 * in voorraad krijgt Belgen +5% duration op ALLE diplomatie-effecten
 * (Compromis Abilities + Chocolade-Overtuiging persuasions). Cap +25%
 * (op 500+ Chocolade voorraad).
 *
 * Stacks multiplicatief NIETS verder (alleen duration-extension). Werkt naast
 * de Salon-protocol cost-discount uit `FactionSpecial1Passives.ts` — beide
 * passives zijn additief bedoeld zodat Chocolaterie + Diplomatiek Salon samen
 * een "diplomatie-economie" maken.
 *
 * Geen tick-state: alle math is afgeleid van current voorraad. Geen pipeline
 * registratie nodig — DiplomacySystem leest de helper direct.
 */

import { playerState } from '../core/PlayerState';
import { FactionId } from '../types/index';

export const PRALINES_PER_STACK = 100;
export const PRALINES_PER_STACK_BONUS = 0.05;
export const PRALINES_MAX_STACKS = 5;

/** Number of stacks based on current Chocolade voorraad (capped). */
export function getPralinesStacks(): number {
  const voorraad = playerState.getTertiary(FactionId.Belgen);
  const stacks = Math.floor(voorraad / PRALINES_PER_STACK);
  return Math.min(stacks, PRALINES_MAX_STACKS);
}

/**
 * Multiplicative duration-bonus for Belgen diplomacy effects.
 * 0 stacks → 1.0, 5 stacks (500+ voorraad) → 1.25.
 */
export function getPralinesDurationMult(factionId: number): number {
  if (factionId !== FactionId.Belgen) return 1.0;
  return 1 + getPralinesStacks() * PRALINES_PER_STACK_BONUS;
}
