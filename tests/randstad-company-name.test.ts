/**
 * randstad-company-name.test.ts — de factie is de regio, het bedrijf heet Polderdam Holding.
 *
 * De Randstad-factie mag niet als bedrijf "Randstad …" optreden (Randstad N.V.
 * is een bestaand merk). Het fictieve bedrijf heet Polderdam Holding. Deze test
 * scant alle spelertekst en pagina's op de oude bedrijfsnamen.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve, relative } from 'path';

const ROOT = resolve(__dirname, '..');

const FORBIDDEN = [
  'Randstad Corporat', // Corporatie, Corporation, Corporate (Humor)
  'Randstad Corp',
  'Randstad HQ',
  'Randstad Ontwikkelingsmaatschappij',
  'Randstad Development',
  'Randstad CEO',
  'Randstad N.V.',
  'Randstad B.V.',
];

function walk(dir: string, ext: RegExp, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (ext.test(e.name)) out.push(p);
  }
  return out;
}

/** iCloud duplicates ("foo 2.ts") and backups are not part of the app. */
const isNoise = (p: string) => / \d+\.[^/]+$/.test(p) || /\.bak(\.|$)/.test(p);

describe('Randstad is een regio, geen bedrijf', () => {
  const files = [
    ...walk(join(ROOT, 'src'), /\.ts$/),
    join(ROOT, 'index.html'),
    join(ROOT, 'play', 'index.html'),
    ...walk(join(ROOT, 'public'), /\.html$/),
  ].filter((p) => existsSync(p) && !isNoise(p));

  it('scant een redelijk aantal bestanden', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('geen oude bedrijfsnaam in src/ of de pagina\'s', () => {
    const hits: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8').toLowerCase();
      for (const needle of FORBIDDEN) {
        if (text.includes(needle.toLowerCase())) hits.push(`${relative(ROOT, f)} → "${needle}"`);
      }
    }
    expect(hits).toEqual([]);
  });
});
