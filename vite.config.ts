import { defineConfig, type Plugin } from 'vite';
import { resolve, join } from 'path';
import { existsSync, readdirSync, rmSync, statSync } from 'fs';

/**
 * Public assets that are git-tracked but referenced by nothing (src/, root
 * pages, public/ pages, JSON). Vite copies all of public/ into dist/, so these
 * would ship to production. They are removed from the outDir after the build;
 * the source files in public/ stay intact (scripts/docs/social use them).
 * Guarded by tests/dist-prune-unreferenced.test.ts: if code or a page starts
 * referencing one of these, that test fails instead of a production 404.
 * Paths are relative to the outDir (= relative to public/).
 */
export const DIST_PRUNE_PATHS: readonly string[] = [
  // Superseded high-poly unit generation (v02 / v03 are used) — ~121MB
  'assets/models/v02-upgrade',
  // Unused Randstad leftovers (manager unit uses infantry-v2.glb) — ~6.5MB
  'assets/models/v02/randstad/manager.glb',
  // v01 shared props; runtime uses v02/shared/{goldmine,tree_pine}.glb
  'assets/models/v01/shared',
  // Proof-of-concept models (props/rocks, tree_variant_1/2 and gameplay/ ARE used)
  'assets/models/poc/buildings',
  'assets/models/poc/units',
  'assets/models/poc/resources',
  'assets/models/poc/props/tree_variant_0.glb',
  // Crowdfunding media not used by any page (social source material only)
  'assets/steun/cinematic-preview-text-to-video.mp4',
  'assets/steun/concept-siege.webp',
  'assets/steun/concept-voices.webp',
  'assets/steun/hero-ceo.webp',
  'assets/steun/hero-frietkoning.webp',
  'assets/steun/hero-mijnbaas.webp',
  // Concept art (input for Meshy/portrait generation, not shown in-game)
  'assets/concepts',
  // Logo variants; pages use logo.png and logo-banner.png
  'assets/ui/logo-180.png',
  'assets/ui/logo-birefnet.png',
  'assets/ui/logo-hero.png',
  'assets/ui/logo-nav.png',
  'assets/ui/logo-new.png',
  'assets/ui/logo-recraft.png',
  'assets/ui/logo-transparent.png',
];

/** Basename patterns removed anywhere in the outDir: backups and Finder junk. */
export const DIST_PRUNE_FILE_PATTERNS: readonly RegExp[] = [
  /\.bak(\.[^/]+)?$/, // foo.bak, foo.bak.png, foo.bak.glb, foo.bak.mp3
  /^\.DS_Store$/,
];

function sizeOf(p: string): number {
  const st = statSync(p);
  if (!st.isDirectory()) return st.size;
  return readdirSync(p).reduce((n, e) => n + sizeOf(join(p, e)), 0);
}

/** Remove DIST_PRUNE_PATHS + pattern matches from `outDir`. */
export function pruneDistDir(outDir: string): { count: number; bytes: number } {
  let count = 0;
  let bytes = 0;
  const remove = (p: string) => {
    bytes += sizeOf(p);
    rmSync(p, { recursive: true, force: true });
    count++;
  };
  for (const rel of DIST_PRUNE_PATHS) {
    const p = join(outDir, rel);
    if (existsSync(p)) remove(p);
  }
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (DIST_PRUNE_FILE_PATTERNS.some((re) => re.test(e.name))) remove(p);
    }
  };
  if (existsSync(outDir)) walk(outDir);
  return { count, bytes };
}

function pruneDist(): Plugin {
  let outDir = '';
  return {
    name: 'rob-prune-dist',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const { count, bytes } = pruneDistDir(outDir);
      console.log(`[rob-prune-dist] removed ${count} unreferenced paths (${(bytes / 1048576).toFixed(1)} MB)`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: '/',

  plugins: [pruneDist()],

  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@ecs': resolve(__dirname, 'src/ecs'),
      '@systems': resolve(__dirname, 'src/systems'),
      '@world': resolve(__dirname, 'src/world'),
      '@entities': resolve(__dirname, 'src/entities'),
      '@factions': resolve(__dirname, 'src/factions'),
      '@combat': resolve(__dirname, 'src/combat'),
      '@ai': resolve(__dirname, 'src/ai'),
      '@pathfinding': resolve(__dirname, 'src/pathfinding'),
      '@camera': resolve(__dirname, 'src/camera'),
      '@input': resolve(__dirname, 'src/input'),
      '@rendering': resolve(__dirname, 'src/rendering'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@audio': resolve(__dirname, 'src/audio'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },

  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        play: resolve(__dirname, 'play/index.html'),
      },
    },
  },

  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ogg', '**/*.mp3', '**/*.wasm'],

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/voice-uploads': {
        target: 'http://localhost:3110',
        changeOrigin: false,
      },
    },
  },
}));
