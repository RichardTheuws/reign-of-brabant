/**
 * building-card-research-panel-nested.test.ts (v0.44.0)
 *
 * Live-bug Richard 2026-04-29: "interfaces van de buildings zoals die van
 * de barracks maken" — Coworking Space / Starbucks toonden research-cards
 * als drijvend panel boven het building-card kastje, niet binnen. Voor
 * uniforme UI moet `#cmd-blacksmith` een DOM-child van `#building-card`
 * zijn, niet een sibling met absolute-positioning.
 *
 * Source-level invariant: in `play/index.html` zit het research-panel
 * binnen `<div id="building-card">…</div>`, niet als losse top-level
 * command-panel ergens anders in de DOM.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(
  resolve(__dirname, '..', 'play', 'index.html'),
  'utf-8',
);

describe('building-card research panel — DOM nesting', () => {
  it('#cmd-blacksmith zit binnen #building-card (niet als sibling)', () => {
    // Find the building-card open + close.
    const cardOpen = html.indexOf('<div id="building-card"');
    expect(cardOpen, '#building-card declaratie niet gevonden').toBeGreaterThan(-1);

    // Walk balanced div-tags from cardOpen until we hit the matching </div>.
    let depth = 0;
    let i = cardOpen;
    let cardClose = -1;
    while (i < html.length) {
      const nextOpen = html.indexOf('<div', i);
      const nextClose = html.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 1;
      } else {
        depth--;
        if (depth === 0) { cardClose = nextClose; break; }
        i = nextClose + 1;
      }
    }
    expect(cardClose, 'building-card closing tag niet gevonden').toBeGreaterThan(cardOpen);

    const cardInner = html.slice(cardOpen, cardClose);
    expect(cardInner, '#cmd-blacksmith hoort binnen #building-card te staan')
      .toMatch(/id="cmd-blacksmith"/);
  });

  it('research-panel heeft bcard-research-panel modifier-class voor nested-styling', () => {
    // class= en id= attributes kunnen in elke volgorde staan; check de div-tag.
    const tagMatch = html.match(/<div[^>]*id="cmd-blacksmith"[^>]*>/);
    expect(tagMatch).not.toBeNull();
    expect(tagMatch?.[0]).toContain('bcard-research-panel');
  });

  it('GEEN tweede #cmd-blacksmith als top-level command-panel', () => {
    // Heuristic: count occurrences of id="cmd-blacksmith" — should be exactly 1.
    const matches = html.match(/id="cmd-blacksmith"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('CSS heeft override regel voor #building-card .bcard-research-panel', () => {
    // Sanity: de override die de absolute-positioning intrekt moet aanwezig zijn,
    // anders gedraagt het nested panel zich nog steeds als drijvend command-panel.
    expect(html).toMatch(/#building-card\s+\.bcard-research-panel\s*\{/);
    expect(html).toMatch(/#building-card\s+\.bcard-research-panel[^}]*position:\s*static/);
  });
});
