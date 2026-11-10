/**
 * dist-prune-dev-pages.test.ts — internal audit/preview pages stay out of dist.
 *
 * public/ holds working pages for voice casting, music A/B and animation
 * checks (voice-preview.html, voices-audit-*.html, music-preview.html, …).
 * Vite copies them into dist/ and the deploy swaps dist/ in as the web root,
 * so without the prune they are reachable on the live site.
 * vite.config.ts removes every top-level entry matching DIST_PRUNE_DEV_PAGES.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { DIST_PRUNE_DEV_PAGES, DIST_PRUNE_FILE_PATTERNS, pruneDistDir } from '../vite.config';

const ROOT = resolve(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

const isDevPage = (name: string) => DIST_PRUNE_DEV_PAGES.some((re) => re.test(name));
const topLevel = readdirSync(PUBLIC);

describe('dev/audit pages are pruned from dist', () => {
  it('covers every known audit and preview page in public/', () => {
    const expected = [
      'voice-preview.html',
      'music-preview.html',
      'audio-ab-preview.html',
      'animation-preview.html',
      'voice-cast-preview.html',
      '_preview',
      'voice-preview',
      ...topLevel.filter((n) => n.startsWith('voices-audit-')),
    ];
    for (const name of expected) expect(isDevPage(name), name).toBe(true);
  });

  it('every *preview* / *audit* entry in the public/ root is covered', () => {
    const leaks = topLevel.filter((n) => /preview|audit/i.test(n) && !isDevPage(n));
    expect(leaks).toEqual([]);
  });

  it('keeps the real pages', () => {
    for (const name of ['index.html', 'steun', 'deel', 'het-verhaal', 'updates', 'press', 'voice-files', 'assets', 'robots.txt']) {
      expect(isDevPage(name), name).toBe(false);
    }
  });

  it('no kept page links to a pruned dev page', () => {
    const pruned = topLevel.filter(isDevPage);
    const pages = [join(ROOT, 'index.html'), join(ROOT, 'play', 'index.html')];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (dir === PUBLIC && isDevPage(e.name)) continue;
        if (e.isDirectory()) { if (e.name !== 'assets') walk(p); }
        else if (e.name.endsWith('.html') && !/\.bak/.test(e.name)) pages.push(p);
      }
    };
    walk(PUBLIC);
    const hits: string[] = [];
    for (const page of pages.filter(existsSync)) {
      const text = readFileSync(page, 'utf8');
      for (const name of pruned) {
        if (text.includes(`href="/${name}`) || text.includes(`href="${name}`)) hits.push(`${page} → ${name}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('prompt-log batch JSON (_*-batch.json) is pruned and not loaded by the app', () => {
    expect(DIST_PRUNE_FILE_PATTERNS.some((re) => re.test('_randstad-v047-batch.json'))).toBe(true);
    expect(DIST_PRUNE_FILE_PATTERNS.some((re) => re.test('randstad-worker.png'))).toBe(false);
    const srcHits: string[] = [];
    const walkSrc = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walkSrc(p);
        else if (/\.(ts|js|json|html)$/.test(e.name) && readFileSync(p, 'utf8').includes('-batch.json')) srcHits.push(p);
      }
    };
    walkSrc(join(ROOT, 'src'));
    expect(srcHits).toEqual([]);
  });

  it('pruneDistDir removes them from the outDir root only', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rob-prune-dev-'));
    try {
      for (const f of [
        'voice-preview.html',
        'voices-audit-brabant.html',
        '_preview/cinematic/score.mp3',
        'voice-preview/test.mp3',
        'index.html',
        'steun/index.html',
        'assets/steun/cinematic-preview.mp4',
      ]) {
        mkdirSync(join(dir, f, '..'), { recursive: true });
        writeFileSync(join(dir, f), 'x');
      }
      pruneDistDir(dir);
      expect(existsSync(join(dir, 'voice-preview.html'))).toBe(false);
      expect(existsSync(join(dir, 'voices-audit-brabant.html'))).toBe(false);
      expect(existsSync(join(dir, '_preview'))).toBe(false);
      expect(existsSync(join(dir, 'voice-preview'))).toBe(false);
      expect(existsSync(join(dir, 'index.html'))).toBe(true);
      expect(existsSync(join(dir, 'steun/index.html'))).toBe(true);
      expect(existsSync(join(dir, 'assets/steun/cinematic-preview.mp4'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
