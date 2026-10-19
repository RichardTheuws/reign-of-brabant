// Regression: runtime-loaded building, shared-prop and hero GLBs must stay
// within a load-time budget. Before the texture-resize + attribute-aware
// simplify pass, v02 buildings were up to 52MB (~1.4M tris, 2048^2 maps) and
// heroes 6-9.5MB — a 1v1 skirmish pulled ~200MB of building/hero payload.
// Also guards that no decoder-dependent compression (Draco / meshopt / KTX2)
// sneaks in: none of our GLTFLoaders configure a decoder.
// v0.65: normal maps (and every other opaque map) are JPEG instead of PNG
// (q92, 4:4:4 for normals): -81MB over the runtime set, render PSNR 44-55dB.
// Every runtime GLB (units included) must stay PNG-free; the per-texture
// budget dropped from 3MB to 1.25MB accordingly.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const PUBLIC_ROOT = resolve(ROOT, 'public');

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_TRIS = 150_000;
const MAX_TEXTURE_BYTES = 1.25 * 1024 * 1024;
const FORBIDDEN_EXTENSIONS = ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'];

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

  it.each(PATHS)('%s stays within size/triangle/texture budget and needs no decoder', (url) => {
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
