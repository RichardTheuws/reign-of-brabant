/**
 * engineRuntime.ts -- the heavy half of /play/, loaded with a dynamic import().
 *
 * main.ts is the menu shell (state machine, menu/campaign UI, input routing).
 * Everything that needs three.js or the game systems lives here: renderer,
 * scene, atmosphere, terrain, camera, post-processing, particles, projectiles
 * and the Game instance. main.ts prefetches this chunk once the menu is idle
 * (the rotating 3D backdrop appears as soon as it is in) and awaits it before
 * a match starts, so the menu no longer waits for ~1 MB of engine code.
 *
 * The construction order below is the same as the former top of main.ts.
 */
import * as THREE from 'three';
import { EventBus } from './core/EventBus';
import { Terrain, updateWater } from './world/Terrain';
import { RTSCamera } from './camera/RTSCamera';
import { Game } from './core/Game';
import { initAtmosphere, updateAtmosphere } from './rendering/Atmosphere';
import { PostProcessing } from './rendering/PostProcessing';
import { ParticleSystem } from './rendering/ParticleSystem';
import { ProjectileRenderer } from './rendering/ProjectileRenderer';

export interface EngineRuntime {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly terrain: Terrain;
  readonly rtsCamera: RTSCamera;
  readonly eventBus: EventBus;
  readonly game: Game;
  /** Per-frame render work (atmosphere, water, particles, projectiles, post). */
  render(dt: number): void;
  resize(width: number, height: number): void;
}

export function createEngineRuntime(canvas: HTMLCanvasElement): EngineRuntime {
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x1a3a5c);

  // Scene + atmosphere: sky dome, fog, shadow-casting sun, dust particles
  const scene = new THREE.Scene();
  const sun = initAtmosphere(scene, renderer);
  scene.add(sun);
  // Ambient: slightly warm for a Brabant afternoon
  scene.add(new THREE.AmbientLight(0xfff8e8, 0.55));
  // Fill light from opposite side for softer shadows
  const fill = new THREE.DirectionalLight(0xccddff, 0.25);
  fill.position.set(30, 40, 40);
  scene.add(fill);

  // Terrain
  const terrain = new Terrain();
  scene.add(terrain.mesh);
  scene.add(terrain.waterMesh);
  if (terrain.gridMesh) scene.add(terrain.gridMesh);

  // Camera + post-processing (bloom + outlines)
  const rtsCamera = new RTSCamera(terrain.mapSize);
  const postProcessing = new PostProcessing(renderer, scene, rtsCamera.camera);

  // Event bus + game instance (created but NOT initialized until loading state)
  const eventBus = new EventBus();
  const particles = new ParticleSystem(scene);
  // Projectile group attached to scene; preloaded async right away.
  const projectileGroup = new THREE.Group();
  projectileGroup.name = 'projectiles';
  scene.add(projectileGroup);
  const projectiles = new ProjectileRenderer(projectileGroup);
  projectiles.preload().catch((err) => console.warn('[engine] projectile preload failed', err));
  const game = new Game(scene, terrain, rtsCamera, eventBus, particles, projectiles);

  let renderElapsed = 0;

  return {
    renderer,
    scene,
    terrain,
    rtsCamera,
    eventBus,
    game,
    render(dt: number): void {
      renderElapsed += dt;
      updateAtmosphere(dt);
      updateWater(renderElapsed);
      particles.update(dt);
      projectiles.update(dt);
      postProcessing.render();
    },
    resize(width: number, height: number): void {
      renderer.setSize(width, height);
      rtsCamera.resize(width, height);
      postProcessing.resize(width, height);
    },
  };
}
