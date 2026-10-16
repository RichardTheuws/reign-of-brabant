/**
 * PropRenderer-clear-resource-props.test.ts — ghost gold mines / tree nodes.
 *
 * Bug: Game.cleanup() never cleared the per-entity resource props
 * (addGoldMine / addTreeResource). After returning to the menu and starting a
 * new match, the previous map's gold mines and harvestable trees stayed in
 * the scene as ghosts, and the eid-keyed maps made addGoldMine() return the
 * OLD mesh for a recycled eid (at the old position).
 *
 * Contract: clearResourceProps() removes every placed mine/tree node from the
 * group, empties the maps, disposes the per-clone materials, and keeps the
 * shared source geometry alive so the next match can clone again.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PropRenderer } from '../src/rendering/PropRenderer';

function makeSource(): { group: THREE.Group; geometry: THREE.BufferGeometry } {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
  return { group, geometry };
}

function setup() {
  const parent = new THREE.Group();
  const renderer = new PropRenderer(parent);
  const mine = makeSource();
  const tree = makeSource();
  // Inject source models directly — preload() needs GLB fetches.
  (renderer as unknown as { goldMineSource: THREE.Group }).goldMineSource = mine.group;
  (renderer as unknown as { treeResourceSource: THREE.Group }).treeResourceSource = tree.group;
  return { parent, renderer, mine, tree };
}

describe('PropRenderer.clearResourceProps', () => {
  it('removes all gold mines and tree resource nodes from the scene group', () => {
    const { parent, renderer } = setup();
    renderer.addGoldMine(1, 0, 0, 0);
    renderer.addGoldMine(2, 10, 0, 10);
    renderer.addTreeResource(3, 5, 0, 5);
    expect(parent.children.length).toBe(3);

    renderer.clearResourceProps();

    expect(parent.children.length).toBe(0);
    expect(renderer.getGoldMineObject(1)).toBeUndefined();
    expect(renderer.getGoldMineObject(2)).toBeUndefined();
    expect(renderer.getTreeResourceObject(3)).toBeUndefined();
  });

  it('places a fresh mesh at the new position for a recycled eid after clearing', () => {
    const { renderer } = setup();
    const old = renderer.addGoldMine(1, 0, 0, 0)!;
    renderer.clearResourceProps();
    const fresh = renderer.addGoldMine(1, 42, 0, -7)!;
    expect(fresh).not.toBe(old);
    expect(fresh.position.x).toBe(42);
    expect(fresh.position.z).toBe(-7);
  });

  it('disposes the per-clone materials but not the shared source geometry', () => {
    const { renderer, mine } = setup();
    const placed = renderer.addGoldMine(1, 0, 0, 0)!;
    const cloneMat = (placed.children[0] as THREE.Mesh).material as THREE.Material;
    let matDisposed = false;
    let geoDisposed = false;
    cloneMat.addEventListener('dispose', () => { matDisposed = true; });
    mine.geometry.addEventListener('dispose', () => { geoDisposed = true; });

    renderer.clearResourceProps();

    expect(matDisposed).toBe(true);
    expect(geoDisposed).toBe(false);
  });
});
