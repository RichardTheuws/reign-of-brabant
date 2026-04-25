/**
 * @vitest-environment jsdom
 *
 * Terrain-rebuild-mapsize.test.ts -- Locks v0.37.29 fix: Terrain.rebuild
 * accepteert nieuwe mapSize en herbouwt geometry.
 *
 * Live-bug v0.37.28 (Richard 2026-04-25): bij grote skirmish-map (192) bleef
 * terrain-mesh op default 128 staan → bruine ring buiten ±64, geen height,
 * geen placement, geen visueel terrain. Bij rebuild werd alleen `features`
 * gewijzigd, niet de geometry-grootte.
 *
 * We testen direct het Terrain-object via jsdom (canvas + DOM zijn nodig voor
 * three.js procedural normal maps).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Terrain, type TerrainFeatures } from '../src/world/Terrain';

const MIN_FEATURES: TerrainFeatures = {
  biome: 'meadow',
  rivers: [],
  bridges: [],
  rockWalls: [],
  roads: [],
  tunnels: [],
  flattenPositions: [],
};

beforeEach(() => {
  // Three.js needs a working canvas-context API for textures; mock it minimally
  // so generateProceduralNormalMap/RoughnessMap don't crash in the test env.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: '',
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) })),
  })) as never;
});

describe('Terrain.rebuild — geometry resizes to new mapSize', () => {
  it('default mapSize is 128', () => {
    const t = new Terrain(MIN_FEATURES);
    const geom = t.mesh.geometry as THREE.PlaneGeometry;
    expect(geom.parameters.width).toBe(128);
    expect(geom.parameters.height).toBe(128);
  });

  it('rebuild with mapSize=192 resizes geometry to 192×192', () => {
    const t = new Terrain(MIN_FEATURES);
    t.rebuild(MIN_FEATURES, 192);
    const geom = t.mesh.geometry as THREE.PlaneGeometry;
    expect(geom.parameters.width).toBe(192);
    expect(geom.parameters.height).toBe(192);
  });

  it('rebuild with mapSize=80 resizes geometry to 80×80', () => {
    const t = new Terrain(MIN_FEATURES);
    t.rebuild(MIN_FEATURES, 80);
    const geom = t.mesh.geometry as THREE.PlaneGeometry;
    expect(geom.parameters.width).toBe(80);
    expect(geom.parameters.height).toBe(80);
  });

  it('rebuild without mapSize keeps current size', () => {
    const t = new Terrain(MIN_FEATURES);
    t.rebuild(MIN_FEATURES, 192);
    t.rebuild(MIN_FEATURES); // no mapSize arg
    const geom = t.mesh.geometry as THREE.PlaneGeometry;
    expect(geom.parameters.width).toBe(192);
  });

  it('getHeightAt works for coordinates inside the new larger bounds', () => {
    const t = new Terrain(MIN_FEATURES);
    t.rebuild(MIN_FEATURES, 192);
    // Position at (-90, -90) used to be outside the 128-mesh; now valid.
    const h = t.getHeightAt(-90, -90);
    expect(Number.isFinite(h)).toBe(true);
  });

  it('segments scale with mapSize (2 per unit)', () => {
    const t = new Terrain(MIN_FEATURES);
    t.rebuild(MIN_FEATURES, 192);
    const geom = t.mesh.geometry as THREE.PlaneGeometry;
    // 192 * 2 = 384 segments
    expect(geom.parameters.widthSegments).toBe(384);
  });

  it('water plane resizes 1.5x mapSize', () => {
    const t = new Terrain(MIN_FEATURES);
    t.rebuild(MIN_FEATURES, 192);
    const waterGeom = t.waterMesh.geometry as THREE.PlaneGeometry;
    expect(waterGeom.parameters.width).toBe(192 * 1.5);
  });
});
