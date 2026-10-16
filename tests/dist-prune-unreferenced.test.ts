/**
 * dist-prune-unreferenced.test.ts — guard for the build-time dist prune list.
 *
 * Everything under public/ is copied verbatim into dist/ and ships to
 * production. vite.config.ts has a small plugin (`pruneDist`) that deletes an
 * explicit list of unreferenced public assets (~170MB of old model
 * generations, concept art, logo variants, *.bak files) from the outDir after
 * the build. Source files in public/ stay untouched.
 *
 * Risk: a later change starts using one of those files → it works in dev
 * (served from public/) but 404s in production. This test fails first:
 * for every pruned path it asserts that no src/ code and no HTML/JSON/CSS page
 * references it (full path, last two path segments, and — when no kept file
 * shares it — the bare basename).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, resolve, basename, relative } from 'path';
import { tmpdir } from 'os';
import { DIST_PRUNE_PATHS, DIST_PRUNE_FILE_PATTERNS, pruneDistDir } from '../vite.config';

const ROOT = resolve(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** iCloud duplicates ("foo 2.ts") and backups are not part of the app. */
const isNoise = (p: string) => / \d+\.[^/]+$/.test(p) || /\.bak(\.|$)/.test(basename(p));

const isPruned = (relPublic: string) =>
  DIST_PRUNE_PATHS.some((p) => relPublic === p || relPublic.startsWith(p + '/')) ||
  DIST_PRUNE_FILE_PATTERNS.some((re) => re.test(basename(relPublic)));

const publicFiles = walk(PUBLIC).map((p) => relative(PUBLIC, p).split('\\').join('/'));

/** Text that the shipped app / pages can reference assets from. */
const corpus: Array<[string, string]> = [
  ...walk(join(ROOT, 'src')).filter((p) => /\.(ts|js|json|css|html)$/.test(p)),
  join(ROOT, 'index.html'),
  join(ROOT, 'play', 'index.html'),
  ...publicFiles
    .filter((p) => /\.(html|json|css|js|xml|webmanifest|txt)$/.test(p) && !isPruned(p))
    .map((p) => join(PUBLIC, p)),
]
  .filter((p) => existsSync(p) && !isNoise(p))
  .map((p) => [relative(ROOT, p), readFileSync(p, 'utf8')]);

/** Basenames of public files that are NOT pruned (e.g. v02/randstad/infantry.glb). */
const keptBasenames = new Set(publicFiles.filter((p) => !isPruned(p)).map((p) => basename(p)));

function needlesFor(path: string): string[] {
  const segs = path.split('/');
  const needles = [path, segs.slice(-2).join('/')];
  const bn = segs[segs.length - 1];
  // Directories: last segment is too generic ("units"); files: only when unique.
  if (bn.includes('.') && !keptBasenames.has(bn)) needles.push(bn);
  return needles;
}

describe('dist prune list (vite.config.ts)', () => {
  it('has a non-empty, relative, assets-only list', () => {
    expect(DIST_PRUNE_PATHS.length).toBeGreaterThan(0);
    for (const p of DIST_PRUNE_PATHS) {
      expect(p, p).toMatch(/^assets\//);
      expect(p, p).not.toMatch(/\.\.|^\/|\/$/);
    }
  });

  it.each(DIST_PRUNE_PATHS.map((p) => [p]))('%s is not referenced by src/ or any page', (path) => {
    const hits: string[] = [];
    for (const needle of needlesFor(path)) {
      for (const [file, text] of corpus) {
        if (text.includes(needle)) hits.push(`${file} → "${needle}"`);
      }
    }
    expect(hits, `pruned from dist but referenced (would 404 in production):\n${hits.join('\n')}`).toEqual([]);
  });

  it('no src/ code or page references a *.bak asset', () => {
    const hits = corpus.filter(([, t]) => /\.bak(\.[a-z0-9]+)?['"`)\s]/i.test(t)).map(([f]) => f);
    expect(hits).toEqual([]);
  });

  it('keeps assets the runtime and preview pages need', () => {
    for (const keep of [
      'assets/models/poc/gameplay/arrow.glb',
      'assets/models/poc/gameplay/selection_circle.glb',
      'assets/models/poc/props/rock_variant_0.glb',
      'assets/models/poc/props/tree_variant_1.glb',
      'assets/models/v02/randstad/infantry-v2.glb',
      'assets/models/v02/randstad/barracks.glb',
      'assets/models/v01/randstad/infantry.glb',
      'assets/models/test/infantry-animated.glb', // animation-preview.html
      'assets/steun/cinematic-preview.mp4',
      'assets/ui/logo.png',
      'assets/ui/logo-banner.png',
    ]) {
      expect(isPruned(keep), keep).toBe(false);
    }
  });
});

describe('pruneDistDir', () => {
  it('removes listed paths and *.bak / .DS_Store files, leaves the rest', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rob-prune-'));
    try {
      const files = [
        'assets/models/v02-upgrade/brabanders/infantry.glb',
        'assets/models/v02/randstad/manager.glb',
        'assets/models/v02/randstad/infantry.glb',
        'assets/portraits/brabant-boer.bak.png',
        'assets/portraits/brabant-boer.png',
        'assets/.DS_Store',
        'index.html.bak',
        'index.html',
      ];
      for (const f of files) {
        mkdirSync(join(dir, f, '..'), { recursive: true });
        writeFileSync(join(dir, f), 'x');
      }
      const removed = pruneDistDir(dir);
      expect(removed.count).toBeGreaterThanOrEqual(5);
      expect(existsSync(join(dir, 'assets/models/v02-upgrade'))).toBe(false);
      expect(existsSync(join(dir, 'assets/models/v02/randstad/manager.glb'))).toBe(false);
      expect(existsSync(join(dir, 'assets/portraits/brabant-boer.bak.png'))).toBe(false);
      expect(existsSync(join(dir, 'assets/.DS_Store'))).toBe(false);
      expect(existsSync(join(dir, 'index.html.bak'))).toBe(false);
      expect(existsSync(join(dir, 'assets/models/v02/randstad/infantry.glb'))).toBe(true);
      expect(existsSync(join(dir, 'assets/portraits/brabant-boer.png'))).toBe(true);
      expect(existsSync(join(dir, 'index.html'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
