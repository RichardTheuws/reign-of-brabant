/**
 * play-initial-bundle.test.ts -- build guard for the /play/ code split.
 *
 * /play/ used to ship one 1.4 MB chunk; the menu waited for the whole engine.
 * main.ts is now a menu shell and the engine (three.js, Game, systems,
 * renderers) comes in through a dynamic import() of src/engineRuntime.ts.
 *
 * This test runs a real production build (in memory, no public/ copy) and
 * asserts on the Rollup output:
 * - the JS that /play/index.html loads up front (entry + its static imports)
 *   stays under 400 kB raw;
 * - Game, engineRuntime and three.js are not in that initial JS;
 * - the engine is reachable as a dynamic import of the entry;
 * - no source module is bundled into two chunks (module-level singletons such
 *   as gameSettings, audioManager, the ECS world/components stay single);
 * - play/index.html only references initial chunks (no eager engine preload).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { build } from 'vite';
import { resolve, join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import type { RollupOutput, OutputChunk, OutputAsset } from 'rollup';

const ROOT = resolve(__dirname, '..');
const INITIAL_JS_BUDGET_BYTES = 400 * 1000; // 400 kB raw, as Vite reports kB

const norm = (id: string) => id.split('\\').join('/');

let chunks: OutputChunk[] = [];
let assets: OutputAsset[] = [];

beforeAll(async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'rob-play-bundle-'));
  try {
    const result = await build({
      root: ROOT,
      configFile: resolve(ROOT, 'vite.config.ts'),
      logLevel: 'silent',
      publicDir: false,
      build: { write: false, outDir, emptyOutDir: true },
    });
    const outputs = (Array.isArray(result) ? result : [result]) as RollupOutput[];
    for (const o of outputs) {
      for (const item of o.output) {
        if (item.type === 'chunk') chunks.push(item);
        else assets.push(item);
      }
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}, 240_000);

function playEntry(): OutputChunk {
  const entry = chunks.find((c) => c.isEntry && c.facadeModuleId && norm(c.facadeModuleId).endsWith('/play/index.html'));
  if (!entry) throw new Error('no /play/ entry chunk in build output');
  return entry;
}

/** Entry chunk + everything it imports statically (what the page loads up front). */
function initialChunks(): OutputChunk[] {
  const byName = new Map(chunks.map((c) => [c.fileName, c]));
  const seen = new Map<string, OutputChunk>();
  const visit = (c: OutputChunk) => {
    if (seen.has(c.fileName)) return;
    seen.set(c.fileName, c);
    for (const imp of c.imports) {
      const next = byName.get(imp);
      if (next) visit(next);
    }
  };
  visit(playEntry());
  return [...seen.values()];
}

const modulesOf = (cs: OutputChunk[]) => cs.flatMap((c) => Object.keys(c.modules).map(norm));

describe('/play/ initial bundle', () => {
  it(`initial JS stays under ${INITIAL_JS_BUDGET_BYTES / 1000} kB raw`, () => {
    const initial = initialChunks();
    const bytes = initial.reduce((n, c) => n + Buffer.byteLength(c.code, 'utf8'), 0);
    // eslint-disable-next-line no-console
    console.log(`[play-initial-bundle] initial JS ${(bytes / 1000).toFixed(1)} kB in ${initial.map((c) => c.fileName).join(', ')}`);
    expect(bytes).toBeGreaterThan(0);
    expect(bytes).toBeLessThan(INITIAL_JS_BUDGET_BYTES);
  });

  it('Game, engineRuntime and three.js are not in the initial JS', () => {
    const mods = modulesOf(initialChunks());
    expect(mods.some((m) => m.endsWith('/src/core/Game.ts'))).toBe(false);
    expect(mods.some((m) => m.endsWith('/src/engineRuntime.ts'))).toBe(false);
    expect(mods.some((m) => m.includes('/node_modules/three/'))).toBe(false);
    expect(mods.some((m) => m.includes('/src/rendering/'))).toBe(false);
  });

  it('the engine is a dynamic import of the /play/ entry and contains Game', () => {
    const engine = chunks.find((c) => c.facadeModuleId && norm(c.facadeModuleId).endsWith('/src/engineRuntime.ts'));
    expect(engine, 'engineRuntime chunk').toBeDefined();
    expect(playEntry().dynamicImports).toContain(engine!.fileName);
    const reachable = new Set<string>();
    const byName = new Map(chunks.map((c) => [c.fileName, c]));
    const visit = (c: OutputChunk) => {
      if (reachable.has(c.fileName)) return;
      reachable.add(c.fileName);
      c.imports.forEach((i) => byName.get(i) && visit(byName.get(i)!));
    };
    visit(engine!);
    const engineMods = modulesOf([...reachable].map((n) => byName.get(n)!));
    expect(engineMods.some((m) => m.endsWith('/src/core/Game.ts'))).toBe(true);
  });

  it('no module is bundled twice (singletons stay single)', () => {
    const owner = new Map<string, string>();
    const dupes: string[] = [];
    for (const c of chunks) {
      for (const id of Object.keys(c.modules)) {
        if (Object.keys(c.modules[id]).length === 0) continue;
        const prev = owner.get(id);
        if (prev && prev !== c.fileName) dupes.push(`${id} in ${prev} and ${c.fileName}`);
        else owner.set(id, c.fileName);
      }
    }
    expect(dupes).toEqual([]);
    // The shared singletons live in exactly one chunk.
    for (const suffix of ['/src/ui/gameSettings.ts', '/src/audio/AudioManager.ts', '/src/ecs/components.ts']) {
      const holders = chunks.filter((c) => Object.keys(c.modules).some((m) => norm(m).endsWith(suffix)));
      expect(holders.length, suffix).toBe(1);
    }
  });

  it('play/index.html loads only initial chunks (no eager engine preload)', () => {
    const html = assets.find((a) => norm(a.fileName) === 'play/index.html');
    expect(html, 'play/index.html asset').toBeDefined();
    const source = String(html!.source);
    const refs = [...source.matchAll(/<(?:script|link)[^>]+(?:src|href)="\/?([^"]+\.js)"/g)].map((m) => m[1]);
    const initial = new Set(initialChunks().map((c) => c.fileName));
    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) expect(initial.has(r), r).toBe(true);
  });
});
