/**
 * @vitest-environment jsdom
 *
 * Terrain-grid-setting.test.ts -- the build grid follows the persisted 'grid'
 * setting (settings panel) and the G hotkey writes back to that setting, but
 * G typed into a text field does nothing.
 */
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { Terrain, type TerrainFeatures } from '../src/world/Terrain';
import { getGameSettings, updateGameSettings } from '../src/ui/gameSettings';

const MIN_FEATURES: TerrainFeatures = {
  biome: 'meadow', rivers: [], bridges: [], rockWalls: [], roads: [], tunnels: [], flattenPositions: [],
};

// One Terrain for the whole file: each instance registers a window G listener
// (the game creates exactly one, in main.ts).
let terrain: Terrain;

beforeAll(() => {
  // Minimal canvas-context mock (same as Terrain-rebuild-mapsize.test.ts)
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: '',
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) })),
  })) as never;
  terrain = new Terrain(MIN_FEATURES);
});

afterEach(() => updateGameSettings({ grid: false }));

describe('Terrain — grid setting', () => {
  it('grid overlay visibility follows the grid setting', () => {
    expect(terrain.gridMesh?.visible).toBe(false);
    updateGameSettings({ grid: true });
    expect(terrain.gridMesh?.visible).toBe(true);
    updateGameSettings({ grid: false });
    expect(terrain.gridMesh?.visible).toBe(false);
  });

  it('G toggles the persisted setting, but not while typing', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG' }));
    expect(getGameSettings().grid).toBe(true);
    expect(terrain.gridMesh?.visible).toBe(true);

    const input = document.createElement('textarea');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', bubbles: true }));
    expect(getGameSettings().grid).toBe(true);
    input.remove();
  });
});
