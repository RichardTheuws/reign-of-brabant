/**
 * gltfLoader.ts -- the one way the game creates a GLTFLoader.
 *
 * Every runtime GLB is stored with EXT_meshopt_compression (quantized,
 * meshopt-encoded geometry and animation; see scripts/compress-glb.mjs).
 * A loader without the meshopt decoder cannot read them, so all renderers
 * get their loader here.
 */
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export function createGLTFLoader(): GLTFLoader {
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
}
