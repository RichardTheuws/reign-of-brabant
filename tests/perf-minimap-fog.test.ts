/**
 * Perf v0.63: composeMinimapFog (no canvas read-back) must produce the same
 * pixels as the original put -> getImageData -> darken-in-place loop.
 */
import { describe, it, expect } from 'vitest';
import { composeMinimapFog, VISION_BUFFER_SIZE } from '../src/ui/minimapFog';

/** The pre-v0.63 Game.updateMinimap loop, operating on a read-back copy. */
function legacyFog(terrain: Uint8ClampedArray, w: number, h: number, visibleBuf: Uint8Array, exploredBuf: Uint8Array): Uint8ClampedArray {
  const fowData = new Uint8ClampedArray(terrain); // == getImageData after putImageData(terrain) for opaque pixels
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const bx = Math.floor((px / w) * 128);
      const bz = Math.floor((py / h) * 128);
      const bufIdx = bz * 128 + bx;
      const pixIdx = (py * w + px) * 4;
      if (visibleBuf[bufIdx] > 0) {
        // keep
      } else if (exploredBuf[bufIdx] > 0) {
        fowData[pixIdx] = Math.round(fowData[pixIdx] * 0.4);
        fowData[pixIdx + 1] = Math.round(fowData[pixIdx + 1] * 0.4);
        fowData[pixIdx + 2] = Math.round(fowData[pixIdx + 2] * 0.4);
      } else {
        fowData[pixIdx] = 0;
        fowData[pixIdx + 1] = 0;
        fowData[pixIdx + 2] = 0;
      }
    }
  }
  return fowData;
}

describe('composeMinimapFog', () => {
  it('uses the 128x128 vision grid', () => {
    expect(VISION_BUFFER_SIZE).toBe(128);
  });

  it('matches the legacy read-back loop over randomised sizes and fog states', () => {
    let seed = 987654321;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (const [w, h] of [[200, 200], [173, 151], [128, 128], [64, 300], [257, 97]]) {
      const terrain = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < terrain.length; i++) terrain[i] = (i & 3) === 3 ? 255 : Math.floor(rnd() * 256);
      const visible = new Uint8Array(128 * 128);
      const explored = new Uint8Array(128 * 128);
      for (let i = 0; i < visible.length; i++) {
        const r = rnd();
        explored[i] = r < 0.6 ? 1 : 0;
        visible[i] = r < 0.25 ? 1 : 0;
      }
      const out = new Uint8ClampedArray(w * h * 4).fill(77); // stale content must be fully overwritten
      composeMinimapFog(terrain, out, w, h, visible, explored);
      expect(out).toEqual(legacyFog(terrain, w, h, visible, explored));
    }
  });

  it('is repeatable into the same reused buffer as fog changes', () => {
    const w = 50, h = 40;
    const terrain = new Uint8ClampedArray(w * h * 4).map((_, i) => ((i & 3) === 3 ? 255 : (i * 37) & 255));
    const visible = new Uint8Array(128 * 128);
    const explored = new Uint8Array(128 * 128);
    const out = new Uint8ClampedArray(w * h * 4);
    composeMinimapFog(terrain, out, w, h, visible, explored);
    expect(out).toEqual(legacyFog(terrain, w, h, visible, explored));
    explored.fill(1);
    visible.fill(1, 0, 4000);
    composeMinimapFog(terrain, out, w, h, visible, explored);
    expect(out).toEqual(legacyFog(terrain, w, h, visible, explored));
  });
});
