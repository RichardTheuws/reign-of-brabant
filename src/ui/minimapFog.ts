/**
 * Minimap fog-of-war compositing (pure, no DOM).
 *
 * Perf: the minimap used to `putImageData(terrain)` and then
 * `getImageData()` the canvas back every game tick just to obtain a copy of
 * the terrain pixels to darken. That GPU->CPU readback is a pipeline stall on
 * accelerated canvases. The terrain cache is fully opaque (alpha 255), so the
 * read-back pixels are exactly the cache pixels: composing straight from the
 * cache into a reused buffer gives the same image with one put and no read.
 */

/** Vision buffers are VISION_BUFFER_SIZE x VISION_BUFFER_SIZE cells. */
export const VISION_BUFFER_SIZE = 128;

/**
 * Write terrain pixels darkened by fog into `out`:
 * visible -> unchanged, explored -> rgb * 0.4 (rounded), unexplored -> black.
 * Alpha is copied from the terrain. `terrain` and `out` are RGBA w*h buffers.
 */
export function composeMinimapFog(
  terrain: Uint8ClampedArray,
  out: Uint8ClampedArray,
  w: number,
  h: number,
  visibleBuf: Uint8Array,
  exploredBuf: Uint8Array,
): void {
  const N = VISION_BUFFER_SIZE;
  for (let py = 0; py < h; py++) {
    const rowBase = Math.floor((py / h) * N) * N;
    for (let px = 0; px < w; px++) {
      const bufIdx = rowBase + Math.floor((px / w) * N);
      const i = (py * w + px) * 4;
      if (visibleBuf[bufIdx] > 0) {
        out[i] = terrain[i];
        out[i + 1] = terrain[i + 1];
        out[i + 2] = terrain[i + 2];
      } else if (exploredBuf[bufIdx] > 0) {
        out[i] = Math.round(terrain[i] * 0.4);
        out[i + 1] = Math.round(terrain[i + 1] * 0.4);
        out[i + 2] = Math.round(terrain[i + 2] * 0.4);
      } else {
        out[i] = 0;
        out[i + 1] = 0;
        out[i + 2] = 0;
      }
      out[i + 3] = terrain[i + 3];
    }
  }
}
