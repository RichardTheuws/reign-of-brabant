// Regression: runtime-loaded building, shared-prop and hero GLBs must stay
// within a load-time budget. Before the texture-resize + attribute-aware
// simplify pass, v02 buildings were up to 52MB (~1.4M tris, 2048^2 maps) and
// heroes 6-9.5MB — a 1v1 skirmish pulled ~200MB of building/hero payload.
// v0.66: every runtime GLB is meshopt-compressed (EXT_meshopt_compression,
// scripts/compress-glb.mjs); all loaders come from createGLTFLoader(), which
// configures the meshopt decoder. Draco and KTX2 stay forbidden: no loader
// configures those decoders.
// v0.65: normal maps (and every other opaque map) are JPEG instead of PNG
// (q92, 4:4:4 for normals): -81MB over the runtime set, render PSNR 44-55dB.
// Every runtime GLB (units included) must stay PNG-free; the per-texture
// budget dropped from 3MB to 1.25MB accordingly.
// v0.66: geometry outliers simplified, non-baseColor building maps 512px,
// meshopt everywhere: the runtime set went from 118MB to 50MB; per-file
// budget 6MB -> 1.5MB.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const PUBLIC_ROOT = resolve(ROOT, 'public');

const MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_TRIS = 150_000;
const MAX_TEXTURE_BYTES = 1.25 * 1024 * 1024;
const FORBIDDEN_EXTENSIONS = ['KHR_draco_mesh_compression', 'KHR_texture_basisu'];

/** Collect every '/assets/models/(v02|heroes)/...glb' literal from the renderer sources. */
function runtimeModelPaths(): string[] {
  const sources = [
    'src/rendering/BuildingRenderer.ts',
    'src/rendering/UnitRenderer.ts',
    'src/rendering/PropRenderer.ts',
    'src/world/Terrain.ts',
  ];
  const paths = new Set<string>();
  for (const src of sources) {
    const text = readFileSync(resolve(ROOT, src), 'utf8');
    for (const m of text.matchAll(/'(\/assets\/models\/(?:v02\/(?!(?:brabanders|randstad|limburgers|belgen)\/(?:worker|infantry|infantry-v2|ranged|heavy|siege|support)\.glb)[^']+|heroes\/[^']+)\.glb)'/g)) {
      paths.add(m[1]);
    }
  }
  return [...paths].sort();
}

/** Every '/assets/models/...glb' literal any runtime source references. */
function allRuntimeModelPaths(): string[] {
  const sources = [
    'src/rendering/BuildingRenderer.ts',
    'src/rendering/UnitRenderer.ts',
    'src/rendering/PropRenderer.ts',
    'src/rendering/SelectionRenderer.ts',
    'src/rendering/ProjectileRenderer.ts',
    'src/world/Terrain.ts',
  ];
  const paths = new Set<string>();
  for (const src of sources) {
    const text = readFileSync(resolve(ROOT, src), 'utf8');
    for (const m of text.matchAll(/'(\/assets\/models\/[^']+\.glb)'/g)) paths.add(m[1]);
  }
  return [...paths].sort();
}

interface GlbJson {
  extensionsUsed?: string[];
  extensionsRequired?: string[];
  meshes?: { primitives: { indices?: number; attributes: Record<string, number> }[] }[];
  accessors?: { count: number }[];
  images?: { bufferView?: number; mimeType?: string }[];
  bufferViews?: { byteLength: number }[];
}

function readGlbJson(file: string): GlbJson {
  const buf = readFileSync(file);
  expect(buf.readUInt32LE(0)).toBe(0x46546c67); // 'glTF'
  const jsonLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8')) as GlbJson;
}

function triangleCount(json: GlbJson): number {
  let tris = 0;
  for (const mesh of json.meshes ?? []) {
    for (const prim of mesh.primitives) {
      const acc = prim.indices !== undefined ? prim.indices : prim.attributes.POSITION;
      tris += (json.accessors?.[acc]?.count ?? 0) / 3;
    }
  }
  return tris;
}

const PATHS = runtimeModelPaths();

describe('GLB payload budget — v02 buildings/props + heroes', () => {
  it('finds the runtime path tables (buildings, bridge/tunnel, goldmine, 8 heroes)', () => {
    expect(PATHS.length).toBeGreaterThanOrEqual(50);
    expect(PATHS).toContain('/assets/models/v02/shared/bridge.glb');
    expect(PATHS.filter((p) => p.startsWith('/assets/models/heroes/'))).toHaveLength(8);
  });

  it.each(PATHS)('%s stays within size/triangle/texture budget and is meshopt-compressed', (url) => {
    const file = resolve(PUBLIC_ROOT, url.replace(/^\//, ''));
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThanOrEqual(MAX_BYTES);

    const json = readGlbJson(file);
    expect(triangleCount(json)).toBeLessThanOrEqual(MAX_TRIS);
    for (const img of json.images ?? []) {
      if (img.bufferView === undefined) continue;
      expect(json.bufferViews?.[img.bufferView]?.byteLength ?? 0).toBeLessThanOrEqual(MAX_TEXTURE_BYTES);
    }
    const exts = [...(json.extensionsUsed ?? []), ...(json.extensionsRequired ?? [])];
    for (const ext of FORBIDDEN_EXTENSIONS) expect(exts).not.toContain(ext);
    expect(exts).toContain('EXT_meshopt_compression');
  });
});

const ALL_PATHS = allRuntimeModelPaths().filter((url) => existsSync(resolve(PUBLIC_ROOT, url.replace(/^\//, ''))));

describe('GLB texture format — no PNG in runtime models', () => {
  it('scans the full runtime set (units, buildings, heroes, props)', () => {
    expect(ALL_PATHS.length).toBeGreaterThanOrEqual(100);
    expect(ALL_PATHS).toContain('/assets/models/v03/brabanders/worker.glb');
  });

  it.each(ALL_PATHS)('%s embeds only JPEG textures', (url) => {
    const json = readGlbJson(resolve(PUBLIC_ROOT, url.replace(/^\//, '')));
    const png = (json.images ?? []).filter((img) => img.mimeType === 'image/png');
    expect(png).toEqual([]);
  });
});

/** Animated units (v03) and the shared gameplay/prop models: the ones that load in every match. */
const PRIMARY_EXTRA = ALL_PATHS.filter((url) => /^\/assets\/models\/(v03|poc)\//.test(url));

describe('GLB compression — v03 units and props', () => {
  it('covers every animated unit and the gameplay props', () => {
    expect(PRIMARY_EXTRA.filter((u) => u.includes('/v03/'))).toHaveLength(24);
    expect(PRIMARY_EXTRA).toContain('/assets/models/poc/gameplay/selection_circle.glb');
  });

  it.each(PRIMARY_EXTRA)('%s is meshopt-compressed and within budget', (url) => {
    const file = resolve(PUBLIC_ROOT, url.replace(/^\//, ''));
    expect(statSync(file).size).toBeLessThanOrEqual(MAX_BYTES);
    expect(readGlbJson(file).extensionsUsed ?? []).toContain('EXT_meshopt_compression');
  });
});

describe('GLTFLoader construction', () => {
  it('every runtime loader is created via createGLTFLoader (meshopt decoder set)', () => {
    const sources = [
      'src/rendering/BuildingRenderer.ts',
      'src/rendering/UnitRenderer.ts',
      'src/rendering/PropRenderer.ts',
      'src/rendering/SelectionRenderer.ts',
      'src/rendering/ProjectileRenderer.ts',
      'src/world/Terrain.ts',
    ];
    for (const src of sources) {
      const text = readFileSync(resolve(ROOT, src), 'utf8');
      expect(text, src).not.toMatch(/new GLTFLoader\(/);
      expect(text, src).toMatch(/createGLTFLoader\(\)/);
    }
    expect(readFileSync(resolve(ROOT, 'src/rendering/gltfLoader.ts'), 'utf8')).toMatch(/setMeshoptDecoder\(MeshoptDecoder\)/);
  });
});

describe('model-viewer pages decode meshopt', () => {
  it('/updates/ sets a self-hosted meshopt decoder before model-viewer loads', () => {
    const html = readFileSync(resolve(PUBLIC_ROOT, 'updates/index.html'), 'utf8');
    const cfg = html.indexOf("meshoptDecoderLocation: '/assets/vendor/meshopt_decoder-1.2.0.js'");
    const mv = html.indexOf('model-viewer.min.js');
    expect(cfg).toBeGreaterThan(-1);
    expect(cfg).toBeLessThan(mv);
    expect(existsSync(resolve(PUBLIC_ROOT, 'assets/vendor/meshopt_decoder-1.2.0.js'))).toBe(true);
  });
});
