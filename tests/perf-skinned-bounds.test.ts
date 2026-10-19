/**
 * Perf v0.63: animated unit templates get their SkinnedMesh culling sphere up
 * front so clones (SkeletonUtils.clone) inherit it instead of CPU-skinning all
 * vertices on their first frustum test.
 */
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { precomputeSkinnedBounds } from '../src/rendering/UnitRenderer';

function makeSkinnedTemplate(): THREE.Group {
  const geo = new THREE.CylinderGeometry(0.5, 0.5, 2, 8, 4);
  geo.translate(0, 1, 0);
  const pos = geo.attributes.position;
  const skinIndex: number[] = [];
  const skinWeight: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const w = Math.min(1, Math.max(0, pos.getY(i) / 2));
    skinIndex.push(0, 1, 0, 0);
    skinWeight.push(1 - w, w, 0, 0);
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  const root = new THREE.Bone();
  const top = new THREE.Bone();
  top.position.y = 1;
  root.add(top);
  const mesh = new THREE.SkinnedMesh(geo, new THREE.MeshStandardMaterial());
  mesh.add(root);
  mesh.bind(new THREE.Skeleton([root, top]));
  const group = new THREE.Group();
  group.add(mesh);
  group.scale.setScalar(1.5); // UnitRenderer.registerAnimated scale
  group.updateMatrixWorld(true);
  return group;
}

const skinned = (o: THREE.Object3D): THREE.SkinnedMesh[] => {
  const out: THREE.SkinnedMesh[] = [];
  o.traverse((c) => { if ((c as THREE.SkinnedMesh).isSkinnedMesh) out.push(c as THREE.SkinnedMesh); });
  return out;
};

describe('precomputeSkinnedBounds', () => {
  it('computes each template sphere once and clones inherit an identical copy', () => {
    const template = makeSkinnedTemplate();
    expect(precomputeSkinnedBounds(template)).toBe(1);
    expect(precomputeSkinnedBounds(template)).toBe(0); // idempotent

    const [tm] = skinned(template);
    const clone = skeletonClone(template) as THREE.Group;
    const [cm] = skinned(clone);
    expect(cm.boundingSphere).not.toBeNull();
    expect(cm.boundingSphere).not.toBe(tm.boundingSphere); // own copy, not shared
    expect(cm.boundingSphere!.equals(tm.boundingSphere!)).toBe(true);
  });

  it('gives the same sphere a clone would compute lazily in the same pose (anywhere on the map)', () => {
    const template = makeSkinnedTemplate();
    const lazy = skeletonClone(template) as THREE.Group; // made before precompute: no sphere
    precomputeSkinnedBounds(template);
    const eager = skeletonClone(template) as THREE.Group;
    for (const g of [lazy, eager]) { g.position.set(-46, 0, 38); g.updateMatrixWorld(true); }

    const [lm] = skinned(lazy);
    const [em] = skinned(eager);
    expect(lm.boundingSphere).toBeNull();
    lm.computeBoundingSphere(); // what three.js would do on the first frustum test
    expect(em.boundingSphere!.center.distanceTo(lm.boundingSphere!.center)).toBeLessThan(1e-5);
    expect(Math.abs(em.boundingSphere!.radius - lm.boundingSphere!.radius)).toBeLessThan(1e-5);
  });

  it('means the first frustum test of a clone no longer skins the mesh on the CPU', () => {
    const template = makeSkinnedTemplate();
    precomputeSkinnedBounds(template);
    const clone = skeletonClone(template) as THREE.Group;
    clone.updateMatrixWorld(true);
    const [cm] = skinned(clone);
    const spy = vi.spyOn(cm, 'computeBoundingSphere');
    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    cam.position.set(0, 5, 10);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(true);
    const frustum = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse),
    );
    expect(frustum.intersectsObject(cm)).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });
});
