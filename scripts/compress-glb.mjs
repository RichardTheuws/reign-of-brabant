#!/usr/bin/env node
// Compress runtime GLBs for download size (v0.66.0).
//
//   node scripts/compress-glb.mjs public/assets/models/v02/belgen/townhall.glb ... [--write]
//
// Per file:
//   1. dedup + prune.
//   2. Geometry above SIMPLIFY_ABOVE vertices: weld + simplify to ~TARGET vertices
//      (error-bounded). Outliers only; the peers of these models sit at 13-22k.
//   3. v02 buildings: every map except baseColor (normal, metallicRoughness) to max 512px.
//   4. meshopt: quantized attributes + EXT_meshopt_compression (geometry and animation).
//      The game decodes it via createGLTFLoader() (src/rendering/gltfLoader.ts).
// Files that already carry EXT_meshopt_compression are skipped (quantizing twice loses precision).
// Without --write it only reports what it would do.
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, meshopt, prune, dedup } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const SIMPLIFY_ABOVE = 40000;
const TARGET = 22000;
const ERROR = 0.005;
// Simplify dents the flat walls of these (no normal map to hide it): meshopt only.
const NO_SIMPLIFY = ['/v02/randstad/advanced.glb'];

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const write = process.argv.includes('--write');
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

let before = 0;
let after = 0;
for (const file of files) {
  const doc = await io.read(file);
  const root = doc.getRoot();
  if (root.listExtensionsUsed().some((e) => e.extensionName === 'EXT_meshopt_compression')) {
    console.log(`skip (already meshopt) ${file}`);
    continue;
  }
  const verts = () => root.listMeshes().flatMap((m) => m.listPrimitives())
    .reduce((s, p) => s + (p.getAttribute('POSITION')?.getCount() ?? 0), 0);
  const v0 = verts();
  const notes = [];

  const steps = [dedup()];
  if (v0 > SIMPLIFY_ABOVE && !NO_SIMPLIFY.some((s) => file.includes(s))) {
    steps.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: TARGET / v0, error: ERROR }));
  }
  steps.push(prune());
  await doc.transform(...steps);

  if (file.includes('/v02/')) {
    const base = new Set(root.listMaterials().map((m) => m.getBaseColorTexture()).filter(Boolean));
    const normals = new Set(root.listMaterials().map((m) => m.getNormalTexture()).filter(Boolean));
    for (const tex of root.listTextures()) {
      if (base.has(tex)) continue;
      const [w, h] = tex.getSize() ?? [0, 0];
      if (Math.max(w, h) <= 512) continue;
      const isNormal = normals.has(tex);
      const img = await sharp(tex.getImage())
        .resize(512, 512, { fit: 'inside' })
        .jpeg({ quality: isNormal ? 92 : 90, chromaSubsampling: '4:4:4', mozjpeg: true })
        .toBuffer();
      tex.setImage(new Uint8Array(img)).setMimeType('image/jpeg');
      notes.push(`${isNormal ? 'normal' : 'map'} ${w}->512`);
    }
  }

  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const out = await io.writeBinary(doc);
  const size = fs.statSync(file).size;
  before += size;
  after += out.byteLength;
  if (write) fs.writeFileSync(file, out);
  console.log(`${file} ${Math.round(size / 1e3)}k -> ${Math.round(out.byteLength / 1e3)}k, verts ${v0} -> ${verts()} ${notes.join(', ')}`);
}
console.log(`${write ? 'wrote' : 'dry run'}: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`);
