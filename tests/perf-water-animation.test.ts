/**
 * Perf v0.63: updateWater's typed-array fast path must be bit-identical to the
 * three.js reference (BufferAttribute accessors + computeVertexNormals).
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { animateWaterFast, animateWaterReference } from '../src/world/Terrain';

function waterPlane(size = 192, segs = 80): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(size, size, segs, segs);
  g.rotateX(-Math.PI / 2);
  return g;
}

function expectBitIdentical(a: THREE.BufferGeometry, b: THREE.BufferGeometry): void {
  const pa = a.attributes.position.array as Float32Array;
  const pb = b.attributes.position.array as Float32Array;
  const na = a.attributes.normal.array as Float32Array;
  const nb = b.attributes.normal.array as Float32Array;
  // Compare raw bits so -0 / NaN differences would also fail.
  expect(new Uint32Array(pa.buffer, pa.byteOffset, pa.length)).toEqual(new Uint32Array(pb.buffer, pb.byteOffset, pb.length));
  expect(new Uint32Array(na.buffer, na.byteOffset, na.length)).toEqual(new Uint32Array(nb.buffer, nb.byteOffset, nb.length));
}

describe('water animation fast path', () => {
  it('matches the reference bit-for-bit over a sequence of frames (real water plane)', () => {
    const ref = waterPlane();
    const fast = ref.clone();
    for (const t of [0, 1 / 60, 0.5, 3.3333, 17.25, 123.456, 1000.01]) {
      animateWaterReference(ref, t);
      expect(animateWaterFast(fast, t)).toBe(true);
      expectBitIdentical(ref, fast);
    }
  });

  it('matches the reference for randomised plane sizes, offsets and times', () => {
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let k = 0; k < 20; k++) {
      const segs = 1 + Math.floor(rnd() * 40);
      const g = new THREE.PlaneGeometry(10 + rnd() * 300, 10 + rnd() * 300, segs, 1 + Math.floor(rnd() * 40));
      g.rotateX(-Math.PI / 2);
      g.translate(rnd() * 50 - 25, 0, rnd() * 50 - 25);
      const fast = g.clone();
      const t = rnd() * 500;
      animateWaterReference(g, t);
      expect(animateWaterFast(fast, t)).toBe(true);
      expectBitIdentical(g, fast);
    }
  });

  it('handles degenerate triangles (shared vertex) exactly like computeVertexNormals', () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1], 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(12).fill(0), 3));
    g.setIndex([0, 1, 2, 1, 3, 2, 0, 0, 3, 2, 3, 3]);
    const fast = g.clone();
    animateWaterReference(g, 2.5);
    expect(animateWaterFast(fast, 2.5)).toBe(true);
    expectBitIdentical(g, fast);
  });

  it('declines (returns false) for layouts it does not support, leaving the geometry untouched', () => {
    const nonIndexed = waterPlane(20, 4).toNonIndexed();
    const before = (nonIndexed.attributes.position.array as Float32Array).slice();
    expect(animateWaterFast(nonIndexed, 1)).toBe(false);
    expect(nonIndexed.attributes.position.array).toEqual(before);

    const noNormals = waterPlane(20, 4);
    noNormals.deleteAttribute('normal');
    expect(animateWaterFast(noNormals, 1)).toBe(false);
  });
});
