/**
 * PostProcessing.ts
 * Adds bloom and outline post-processing effects to the RTS renderer.
 *
 * Usage:
 *   const pp = new PostProcessing(renderer, scene, camera);
 *   // in game loop: pp.render() instead of renderer.render(scene, camera)
 *   // on resize:    pp.resize(w, h)
 *   // selection:    pp.setOutlinedObjects([...meshes])
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class PostProcessing {
  private composer: EffectComposer;
  private outlinePass: OutlinePass;
  private bloomPass: UnrealBloomPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    const size = renderer.getSize(new THREE.Vector2());

    // --- Effect Composer ---------------------------------------------------
    this.composer = new EffectComposer(renderer);

    // 1. Base scene render
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 2. Subtle bloom (glow on bright areas)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.45, // strength  – noticeable glow
      0.5,  // radius
      0.6,  // threshold – catches more bright surfaces
    );
    this.composer.addPass(this.bloomPass);

    // 3. Selection outlines (green)
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(size.x, size.y),
      scene,
      camera,
    );
    this.outlinePass.edgeStrength = 3.0;
    this.outlinePass.edgeGlow = 0.5;
    this.outlinePass.edgeThickness = 1.5;
    this.outlinePass.visibleEdgeColor = new THREE.Color(0x44ff44); // green
    this.outlinePass.hiddenEdgeColor = new THREE.Color(0x22aa22); // darker green behind objects
    this.outlinePass.pulsePeriod = 0; // steady, no pulse
    this.composer.addPass(this.outlinePass);

    // 4. Final tone-mapping / color-space conversion
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Call this instead of renderer.render(scene, camera). */
  render(): void {
    this.composer.render();
  }

  /** Resize render targets when the window changes. */
  resize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  /** Set (or clear) the objects that receive a selection outline. */
  setOutlinedObjects(objects: THREE.Object3D[]): void {
    this.outlinePass.selectedObjects = objects;
  }
}
