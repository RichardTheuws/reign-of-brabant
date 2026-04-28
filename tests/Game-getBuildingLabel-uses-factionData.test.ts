/**
 * Game.getBuildingLabel must NEVER carry a hardcoded faction-label table.
 *
 * Live-bug v0.37.36 (Richard 2026-04-28 — Bundle 5 deploy):
 *   - HUD "Bouw: X" toonde labels die niet matchten met factionData-namen
 *     (Carnavalstent → "Dorpsweide", Boardroom → "Starbucks HQ", etc.).
 *     Root cause: Game.getBuildingLabel had een eigen Record-mapping van
 *     ghost-type → label per factie, gedupliceerd vs. factionData.
 *
 * Per memory `feedback_factiondata_single_source.md`:
 *   factionData = single source of truth, geen UI-mappings hardcoderen.
 *
 * This test asserts the source-file truth: the implementation delegates to
 * `getDisplayBuildingName` and contains no parallel factionLabels table.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const gameSource = readFileSync(
  resolve(__dirname, '..', 'src', 'core', 'Game.ts'),
  'utf-8',
);

describe('Game.getBuildingLabel — source-level invariants', () => {
  it('delegates to getDisplayBuildingName helper from factionData', () => {
    const labelFn = extractFunction(gameSource, 'getBuildingLabel');
    expect(labelFn).toMatch(/getDisplayBuildingName\(/);
  });

  it('does not hardcode any of the previously-wrong faction labels', () => {
    const labelFn = extractFunction(gameSource, 'getBuildingLabel');
    const wrongLabels = [
      'Starbucks HQ',
      'Geavanceerde Smederij',
      'Geavanceerd Parlement',
      'Geavanceerde Mijn',
      'Innovatielab',         // factionData heeft 'Innovatie Lab' (met spatie)
      'Kolenoven',
      'Dorpsweide',
      'Kantoor',
      'Mijnwerkerskamp',
      'Springstoflab',
      'Bouwplaats',
      'Atelier',
    ];
    for (const wrong of wrongLabels) {
      expect(
        labelFn,
        `getBuildingLabel must not contain hardcoded label "${wrong}"`,
      ).not.toContain(wrong);
    }
  });

  it('does not contain a Record<number, Record<string, string>> labels-table', () => {
    const labelFn = extractFunction(gameSource, 'getBuildingLabel');
    expect(labelFn).not.toMatch(/Record<number,\s*Record<string,\s*string>>/);
    expect(labelFn).not.toMatch(/factionLabels\s*[:=]/);
  });
});

/**
 * Extract the body of a method from a TS source string. Brittle but enough
 * for an invariant test. Walks balanced braces from the first `{` after the
 * method name until depth returns to 0.
 */
function extractFunction(source: string, name: string): string {
  // Match a method DEFINITION (preceded by access modifier or whitespace at line start),
  // not a call-site like `this.name(`.
  const re = new RegExp(`(?:^|\\n)\\s*(?:private |public |protected )?${name}\\s*\\(`);
  const match = re.exec(source);
  if (!match) throw new Error(`method ${name} definition not found in source`);
  const idx = match.index;
  const openBrace = source.indexOf('{', idx);
  if (openBrace < 0) throw new Error(`opening brace for ${name} not found`);
  let depth = 0;
  for (let i = openBrace; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(openBrace, i + 1);
    }
  }
  throw new Error(`unbalanced braces for ${name}`);
}
