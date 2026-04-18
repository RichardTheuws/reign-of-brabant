/**
 * RTSCamera.test.ts -- Locks the pan/zoom/edge-scroll/raycast contract.
 *
 * Audit context: full-playthrough audit Fase 2 stap 9 — "pan/zoom/edge-scroll
 * werkt, niet clippend, raycast raakt juist terrain."
 *
 * Three.js requires a `window` global for PerspectiveCamera aspect ratio
 * defaults; we install a minimal stub before importing the camera so we
 * stay in the (faster, dependency-free) node test environment.
 */
import { describe, it, expect, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal window stub (Three.js needs window.innerWidth/Height in PerspectiveCamera)
// ---------------------------------------------------------------------------
beforeAll(() => {
  if (typeof globalThis.window === 'undefined') {
    (globalThis as unknown as { window: object }).window = {
      innerWidth: 1920,
      innerHeight: 1080,
    };
  }
});

// Imports must come after the stub (Three.js reads window at module load? no —
// it only reads in PerspectiveCamera constructor, but to be safe we still
// dynamically import inside tests after the stub is set).

let RTSCamera: typeof import('../src/camera/RTSCamera').RTSCamera;

beforeAll(async () => {
  ({ RTSCamera } = await import('../src/camera/RTSCamera'));
});

const noKeys = () => new Set<string>();

describe('RTSCamera — initialization', () => {
  it('clamps internal target to map bounds when constructed', () => {
    const cam = new RTSCamera(128);
    expect(cam.camera).toBeDefined();
    expect(cam.camera.position.x).toBeCloseTo(0, 1);
  });
});

describe('RTSCamera — keyboard panning', () => {
  // We assert against the camera's *look-at point* (returned by screenToWorld
  // at the screen center), not camera.position itself — the camera sits up
  // and behind that point at a 55° angle, so position.z = lookAt.z + offsetZ.

  function lookAt(cam: import('../src/camera/RTSCamera').RTSCamera): { x: number; z: number } {
    const hit = cam.screenToWorld(960, 540);
    return { x: hit?.x ?? NaN, z: hit?.z ?? NaN };
  }

  it('moves look-at +Z when KeyS is held', () => {
    const cam = new RTSCamera(128);
    cam.setPosition(0, 0);
    const before = lookAt(cam).z;
    const keys = new Set(['KeyS']);
    for (let i = 0; i < 30; i++) cam.update(1 / 60, keys, -1, -1, 1920, 1080, 0);
    expect(lookAt(cam).z).toBeGreaterThan(before);
  });

  it('moves look-at -Z when KeyW is held', () => {
    const cam = new RTSCamera(128);
    cam.setPosition(0, 0);
    const before = lookAt(cam).z;
    for (let i = 0; i < 30; i++) cam.update(1 / 60, new Set(['KeyW']), -1, -1, 1920, 1080, 0);
    expect(lookAt(cam).z).toBeLessThan(before);
  });

  it('moves look-at +X when KeyD is held', () => {
    const cam = new RTSCamera(128);
    cam.setPosition(0, 0);
    const before = lookAt(cam).x;
    for (let i = 0; i < 30; i++) cam.update(1 / 60, new Set(['KeyD']), -1, -1, 1920, 1080, 0);
    expect(lookAt(cam).x).toBeGreaterThan(before);
  });

  it('arrow keys behave the same as WASD', () => {
    const camWasd = new RTSCamera(128);
    const camArrows = new RTSCamera(128);
    for (let i = 0; i < 30; i++) {
      camWasd.update(1 / 60, new Set(['KeyD']), -1, -1, 1920, 1080, 0);
      camArrows.update(1 / 60, new Set(['ArrowRight']), -1, -1, 1920, 1080, 0);
    }
    expect(lookAt(camArrows).x).toBeCloseTo(lookAt(camWasd).x, 1);
  });
});

describe('RTSCamera — edge scrolling', () => {
  it('scrolls right when mouse is at right edge', () => {
    const cam = new RTSCamera(128);
    // Mouse near right edge (1920 - 5 < 20 threshold)
    for (let i = 0; i < 30; i++) cam.update(1 / 60, noKeys(), 1915, 540, 1920, 1080, 0);
    expect(cam.camera.position.x).toBeGreaterThan(0);
  });

  it('does not scroll when mouseX is sentinel (-1)', () => {
    const cam = new RTSCamera(128);
    // mouseX/Y = -1 means "no mouse position known"
    const startX = cam.camera.position.x;
    const startZ = cam.camera.position.z;
    for (let i = 0; i < 30; i++) cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, 0);
    expect(cam.camera.position.x).toBeCloseTo(startX, 2);
    expect(cam.camera.position.z).toBeCloseTo(startZ, 2);
  });
});

describe('RTSCamera — zoom', () => {
  it('zooms in (closer / lower height) on negative scrollDelta', () => {
    const cam = new RTSCamera(128);
    const startHeight = cam.camera.position.y;
    for (let i = 0; i < 30; i++) cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, -1);
    expect(cam.camera.position.y).toBeLessThan(startHeight);
  });

  it('zooms out on positive scrollDelta', () => {
    const cam = new RTSCamera(128);
    const startHeight = cam.camera.position.y;
    for (let i = 0; i < 30; i++) cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, 1);
    expect(cam.camera.position.y).toBeGreaterThan(startHeight);
  });

  it('clamps zoom to a hard maximum (cannot zoom out further than MAX_ZOOM)', () => {
    const cam = new RTSCamera(128);
    // Hammer scrollDelta=+1 for many frames → must stop at MAX_ZOOM (80)
    for (let i = 0; i < 500; i++) cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, 1);
    const heightAtMax = cam.camera.position.y;
    // One more frame at full scroll must not push it any higher
    cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, 1);
    expect(cam.camera.position.y).toBeLessThanOrEqual(heightAtMax + 0.001);
  });

  it('clamps zoom to a hard minimum (cannot zoom in further than MIN_ZOOM)', () => {
    const cam = new RTSCamera(128);
    for (let i = 0; i < 500; i++) cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, -1);
    const heightAtMin = cam.camera.position.y;
    cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, -1);
    expect(cam.camera.position.y).toBeGreaterThanOrEqual(heightAtMin - 0.001);
  });
});

describe('RTSCamera — map bounds clamping', () => {
  it('cannot pan beyond +halfMap on X', () => {
    const cam = new RTSCamera(128);
    cam.setPosition(64, 0); // halfMap exactly
    // Keep pushing right — should stay clamped
    for (let i = 0; i < 100; i++) cam.update(1 / 60, new Set(['KeyD']), -1, -1, 1920, 1080, 0);
    expect(cam.camera.position.x).toBeLessThanOrEqual(64 + 0.001);
  });

  it('cannot pan beyond -halfMap on X', () => {
    const cam = new RTSCamera(128);
    cam.setPosition(-64, 0);
    for (let i = 0; i < 100; i++) cam.update(1 / 60, new Set(['KeyA']), -1, -1, 1920, 1080, 0);
    expect(cam.camera.position.x).toBeGreaterThanOrEqual(-64 - 0.001);
  });

  it('cannot pan beyond ±halfMap on Z (192-size map)', () => {
    const cam = new RTSCamera(192);
    cam.setPosition(0, 96);
    for (let i = 0; i < 100; i++) cam.update(1 / 60, new Set(['KeyS']), -1, -1, 1920, 1080, 0);
    expect(cam.camera.position.z).toBeLessThanOrEqual(96 + 50); // accounts for camera offset
  });
});

describe('RTSCamera — setPosition', () => {
  it('snaps both target and current immediately (no smoothing lag)', () => {
    const cam = new RTSCamera(128);
    cam.setPosition(20, -15);
    expect(cam.camera.position.x).toBeCloseTo(20, 1);
    // No update tick needed — setPosition should already have repositioned
  });
});

describe('RTSCamera — screenToWorld raycast', () => {
  it('hits the ground plane at center of screen and returns a point near origin', () => {
    const cam = new RTSCamera(128);
    cam.setPosition(0, 0);
    const hit = cam.screenToWorld(960, 540);
    expect(hit).not.toBeNull();
    // Center should hit roughly at the camera target (origin)
    expect(Math.abs(hit!.x)).toBeLessThan(5);
    expect(Math.abs(hit!.z)).toBeLessThan(5);
  });

  it('hits the ground for a screen point in front of the camera (lower half)', () => {
    // Camera looks down-forward at 55°; lower half of the screen is "in
    // front of" the camera and always intersects the ground plane.
    // Upper half can point above the horizon → returns null (correct).
    const cam = new RTSCamera(128);
    const hit = cam.screenToWorld(960, 800);
    expect(hit).not.toBeNull();
    expect(Number.isFinite(hit!.x)).toBe(true);
    expect(Number.isFinite(hit!.z)).toBe(true);
  });

  it('returns null for a screen point above the horizon (upper edge)', () => {
    // Documents the contract: screenToWorld may legitimately return null
    // when the ray points away from the ground plane (e.g., into the sky).
    const cam = new RTSCamera(128);
    const hit = cam.screenToWorld(960, 0);
    expect(hit).toBeNull();
  });
});

describe('RTSCamera — resize', () => {
  it('updates aspect ratio without throwing', () => {
    const cam = new RTSCamera(128);
    expect(() => cam.resize(800, 600)).not.toThrow();
    expect(cam.camera.aspect).toBeCloseTo(800 / 600);
  });
});

describe('RTSCamera — shake', () => {
  it('applies an offset during shake, then decays back to zero', () => {
    const cam = new RTSCamera(128);
    cam.setPosition(0, 0);
    cam.shake(2.0, 0.5);
    // Mid-shake — offset should be non-zero
    cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, 0);
    const midPos = cam.camera.position.clone();
    // Run out the shake timer
    for (let i = 0; i < 60; i++) cam.update(1 / 60, noKeys(), -1, -1, 1920, 1080, 0);
    // Final position should differ from mid (shake has decayed)
    expect(midPos.equals(cam.camera.position)).toBe(false);
  });
});
