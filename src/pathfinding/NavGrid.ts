/**
 * NavGrid -- walkability grid + A* for unit pathfinding.
 *
 * Why a grid and not the Recast navmesh: rivers are carved as a shallow height
 * dip (gentle banks, walkable slope) and are only marked impassable in
 * Terrain's riverMask, so a navmesh built from terrain.mesh treats the river
 * bed as walkable. The authoritative "can I stand here" data is the river mask
 * (bridges are already excluded from it) plus the rock-wall polylines, so we
 * rasterise exactly that into a coarse grid and run A* on it.
 *
 * Cell size defaults to 1 world unit: 128x128 = 16k cells for a medium map,
 * 192x192 = 37k for huge. Search state lives in reusable typed arrays, so a
 * path request allocates nothing but the returned waypoint list.
 *
 * Two layers: the static terrain mask (rivers, rock walls) and a dynamic,
 * refcounted occupancy layer for building footprints. `blocked` is the
 * combined view (static || occupancy > 0) so the A* hot loop reads one array.
 * Overlapping footprints stack; a cell frees only when its last footprint is
 * removed and it is not statically blocked.
 */

import type { PathPoint, RockWallSpawn } from '../types/index';

/** Extra clearance around rock-wall cores (the raised slope is not walkable either). */
const ROCK_WALL_MARGIN = 0.75;

/** Max ring radius (cells) when snapping a blocked start/goal to a walkable cell. */
const SNAP_SEARCH_RADIUS = 12;
/**
 * Goal inside a building footprint: walkable cells up to this much farther
 * from the goal than the closest one are equally good; among those the one
 * nearest the start wins, so a unit approaches a building from its own side
 * instead of walking around it.
 */
const GOAL_SNAP_SLACK = 1.0;

const SQRT2 = Math.SQRT2;

export interface NavGridTerrain {
  readonly mapSize: number;
  isRiver(worldX: number, worldZ: number): boolean;
}

function distanceToPolyline(px: number, pz: number, path: readonly PathPoint[]): number {
  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i].x, az = path[i].z;
    const abx = path[i + 1].x - ax, abz = path[i + 1].z - az;
    const ab2 = abx * abx + abz * abz;
    let t = ab2 > 0 ? ((px - ax) * abx + (pz - az) * abz) / ab2 : 0;
    t = Math.max(0, Math.min(1, t));
    const dx = px - (ax + t * abx), dz = pz - (az + t * abz);
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < min) min = d;
  }
  if (path.length === 1) {
    const dx = px - path[0].x, dz = pz - path[0].z;
    min = Math.sqrt(dx * dx + dz * dz);
  }
  return min;
}

/** Cell bounds (inclusive) of a rasterised footprint; pass back to removeFootprint(). */
export interface FootprintCells {
  readonly c0x: number;
  readonly c1x: number;
  readonly c0z: number;
  readonly c1z: number;
}

export class NavGrid {
  readonly size: number;
  readonly cellSize: number;
  readonly mapSize: number;
  private readonly half: number;
  /** 1 = blocked (combined: static terrain || occupancy > 0). */
  readonly blocked: Uint8Array;
  /** 1 = blocked by terrain (river / rock wall). Never changes after construction. */
  readonly staticBlocked: Uint8Array;
  /** Number of building footprints covering each cell. */
  readonly occupancy: Uint16Array;
  /** Bumped whenever a footprint is added (UnitPathing re-validates live routes). */
  version = 0;

  // Reusable A* scratch
  private readonly g: Float32Array;
  private readonly parent: Int32Array;
  private readonly stamp: Uint32Array;
  private readonly closed: Uint32Array;
  private readonly heap: Int32Array;
  private readonly heapF: Float32Array;
  private heapLen = 0;
  private searchId = 0;

  /** Nodes expanded by the last findPath() call (for per-frame budgeting). */
  lastExpanded = 0;

  constructor(mapSize: number, isBlocked: (x: number, z: number) => boolean, cellSize = 1) {
    this.mapSize = mapSize;
    this.cellSize = cellSize;
    this.size = Math.max(1, Math.ceil(mapSize / cellSize));
    this.half = mapSize / 2;
    const n = this.size * this.size;
    this.blocked = new Uint8Array(n);
    this.occupancy = new Uint16Array(n);
    this.g = new Float32Array(n);
    this.parent = new Int32Array(n);
    this.stamp = new Uint32Array(n);
    this.closed = new Uint32Array(n);
    this.heap = new Int32Array(n * 8 + 8);
    this.heapF = new Float32Array(n * 8 + 8);

    for (let cz = 0; cz < this.size; cz++) {
      for (let cx = 0; cx < this.size; cx++) {
        const x = this.cellCenterX(cx);
        const z = this.cellCenterZ(cz);
        if (isBlocked(x, z)) this.blocked[cz * this.size + cx] = 1;
      }
    }
    this.staticBlocked = this.blocked.slice();
  }

  /** Build from the live terrain (river mask, bridges excluded) + rock walls. */
  static fromTerrain(terrain: NavGridTerrain, rockWalls: readonly RockWallSpawn[] = [], cellSize = 1): NavGrid {
    return new NavGrid(terrain.mapSize, (x, z) => {
      if (terrain.isRiver(x, z)) return true;
      for (const wall of rockWalls) {
        if (distanceToPolyline(x, z, wall.path) < wall.thickness / 2 + ROCK_WALL_MARGIN) return true;
      }
      return false;
    }, cellSize);
  }

  get blockedCount(): number {
    let c = 0;
    for (let i = 0; i < this.blocked.length; i++) c += this.blocked[i];
    return c;
  }

  /**
   * Block the cells whose centre lies inside the axis-aligned rect
   * (x +- halfW, z +- halfD); at least the cell containing (x,z). Returns the
   * exact cell bounds -- removeFootprint() with the same object frees exactly
   * those cells, independent of any later change to the caller's data.
   * Returns null when the rect lies entirely off-map.
   */
  addFootprint(x: number, z: number, halfW: number, halfD: number): FootprintCells | null {
    const eps = 1e-6;
    const cs = this.cellSize;
    let c0x = Math.ceil((x - halfW + this.half) / cs - 0.5 - eps);
    let c1x = Math.floor((x + halfW + this.half) / cs - 0.5 + eps);
    let c0z = Math.ceil((z - halfD + this.half) / cs - 0.5 - eps);
    let c1z = Math.floor((z + halfD + this.half) / cs - 0.5 + eps);
    if (c1x < c0x) { c0x = c1x = Math.floor((x + this.half) / cs); }
    if (c1z < c0z) { c0z = c1z = Math.floor((z + this.half) / cs); }
    c0x = Math.max(0, c0x); c0z = Math.max(0, c0z);
    c1x = Math.min(this.size - 1, c1x); c1z = Math.min(this.size - 1, c1z);
    if (c1x < c0x || c1z < c0z) return null;
    const s = this.size;
    for (let cz = c0z; cz <= c1z; cz++) {
      for (let cx = c0x; cx <= c1x; cx++) {
        const i = cz * s + cx;
        if (this.occupancy[i] < 0xffff) this.occupancy[i]++;
        this.blocked[i] = 1;
      }
    }
    this.version++;
    return { c0x, c1x, c0z, c1z };
  }

  /** Release a footprint returned by addFootprint() (refcounted: overlaps stay blocked). */
  removeFootprint(fp: FootprintCells): void {
    const s = this.size;
    for (let cz = fp.c0z; cz <= fp.c1z; cz++) {
      for (let cx = fp.c0x; cx <= fp.c1x; cx++) {
        const i = cz * s + cx;
        if (this.occupancy[i] > 0) this.occupancy[i]--;
        if (this.occupancy[i] === 0) this.blocked[i] = this.staticBlocked[i];
      }
    }
  }

  /** Drop every footprint (back to the static terrain mask). */
  clearFootprints(): void {
    this.occupancy.fill(0);
    this.blocked.set(this.staticBlocked);
    this.version++;
  }

  cellCenterX(cx: number): number { return (cx + 0.5) * this.cellSize - this.half; }
  cellCenterZ(cz: number): number { return (cz + 0.5) * this.cellSize - this.half; }

  private toCell(v: number): number {
    const c = Math.floor((v + this.half) / this.cellSize);
    return c < 0 ? 0 : c >= this.size ? this.size - 1 : c;
  }

  cellIndex(x: number, z: number): number {
    return this.toCell(z) * this.size + this.toCell(x);
  }

  /** Off-map positions are treated as walkable (the map edge is not ours to police). */
  isBlockedAt(x: number, z: number): boolean {
    const fx = (x + this.half) / this.cellSize;
    const fz = (z + this.half) / this.cellSize;
    if (fx < 0 || fz < 0 || fx >= this.size || fz >= this.size) return false;
    return this.blocked[Math.floor(fz) * this.size + Math.floor(fx)] === 1;
  }

  /** True when the straight segment crosses no blocked cell (sampled at cellSize/4). */
  isLineClear(x0: number, z0: number, x1: number, z1: number): boolean {
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.sqrt(dx * dx + dz * dz);
    const step = this.cellSize * 0.25;
    const n = Math.max(1, Math.ceil(len / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (this.isBlockedAt(x0 + dx * t, z0 + dz * t)) return false;
    }
    return true;
  }

  /**
   * Nearest walkable cell index around `idx` (ring search), or -1. With a
   * `prefer` point (the path start), cells up to GOAL_SNAP_SLACK farther than
   * the closest one count as ties and the one nearest `prefer` wins.
   */
  private nearestWalkable(idx: number, preferX?: number, preferZ?: number): number {
    if (this.blocked[idx] === 0) return idx;
    const s = this.size;
    const cx = idx % s, cz = (idx / s) | 0;
    if (preferX === undefined || preferZ === undefined) {
      for (let r = 1; r <= SNAP_SEARCH_RADIUS; r++) {
        let best = -1, bestD = Infinity;
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
            const x = cx + dx, z = cz + dz;
            if (x < 0 || z < 0 || x >= s || z >= s) continue;
            const i = z * s + x;
            if (this.blocked[i]) continue;
            const d = dx * dx + dz * dz;
            if (d < bestD) { bestD = d; best = i; }
          }
        }
        if (best >= 0) return best;
      }
      return -1;
    }

    // Two-pass: closest distance m (in cells), then the start-nearest cell
    // among those within m + slack. Rings beyond m + slack cannot qualify.
    const slack = GOAL_SNAP_SLACK / this.cellSize;
    let m = Infinity;
    for (let r = 1; r <= SNAP_SEARCH_RADIUS && r <= m + slack; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const x = cx + dx, z = cz + dz;
          if (x < 0 || z < 0 || x >= s || z >= s) continue;
          if (this.blocked[z * s + x]) continue;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < m) m = d;
        }
      }
    }
    if (m === Infinity) return -1;
    let best = -1, bestP = Infinity;
    const rMax = Math.min(SNAP_SEARCH_RADIUS, Math.floor(m + slack));
    for (let dz = -rMax; dz <= rMax; dz++) {
      for (let dx = -rMax; dx <= rMax; dx++) {
        const x = cx + dx, z = cz + dz;
        if (x < 0 || z < 0 || x >= s || z >= s) continue;
        const i = z * s + x;
        if (this.blocked[i]) continue;
        if (Math.sqrt(dx * dx + dz * dz) > m + slack + 1e-6) continue;
        const px = this.cellCenterX(x) - preferX, pz = this.cellCenterZ(z) - preferZ;
        const p = px * px + pz * pz;
        if (p < bestP) { bestP = p; best = i; }
      }
    }
    return best;
  }

  /**
   * A* from (sx,sz) to (gx,gz). Returns smoothed waypoints (world coords,
   * excluding the start, ending at the goal -- or at the nearest walkable
   * point when the goal itself is blocked), or null when unreachable.
   */
  findPath(sx: number, sz: number, gx: number, gz: number): PathPoint[] | null {
    this.lastExpanded = 0;
    const s = this.size;
    const start = this.nearestWalkable(this.cellIndex(sx, sz));
    const goalRaw = this.cellIndex(gx, gz);
    // Goal inside a building footprint: approach from the start's side. Goals
    // in the terrain mask (river resources) keep the plain nearest snap -- the
    // start-side cell there may be on the other bank.
    const goal = this.occupancy[goalRaw] > 0
      ? this.nearestWalkable(goalRaw, sx, sz)
      : this.nearestWalkable(goalRaw);
    if (start < 0 || goal < 0) return null;
    const goalBlocked = goal !== goalRaw;
    const endX = goalBlocked ? this.cellCenterX(goal % s) : gx;
    const endZ = goalBlocked ? this.cellCenterZ((goal / s) | 0) : gz;

    if (start === goal) return [{ x: endX, z: endZ }];

    const id = ++this.searchId;
    const gcx = goal % s, gcz = (goal / s) | 0;
    const heur = (i: number): number => {
      const ddx = Math.abs((i % s) - gcx), ddz = Math.abs(((i / s) | 0) - gcz);
      return (ddx + ddz) + (SQRT2 - 2) * Math.min(ddx, ddz);
    };

    this.heapLen = 0;
    this.stamp[start] = id;
    this.g[start] = 0;
    this.parent[start] = -1;
    this.push(start, heur(start));

    let found = false;
    while (this.heapLen > 0) {
      const cur = this.pop();
      if (this.closed[cur] === id) continue;
      this.closed[cur] = id;
      this.lastExpanded++;
      if (cur === goal) { found = true; break; }

      const cx = cur % s, cz = (cur / s) | 0;
      const gCur = this.g[cur];
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dz === 0) continue;
          const nx = cx + dx, nz = cz + dz;
          if (nx < 0 || nz < 0 || nx >= s || nz >= s) continue;
          const ni = nz * s + nx;
          if (this.blocked[ni] || this.closed[ni] === id) continue;
          // No diagonal corner cutting
          if (dx !== 0 && dz !== 0 && (this.blocked[cz * s + nx] || this.blocked[nz * s + cx])) continue;
          const ng = gCur + (dx !== 0 && dz !== 0 ? SQRT2 : 1);
          if (this.stamp[ni] !== id || ng < this.g[ni]) {
            this.stamp[ni] = id;
            this.g[ni] = ng;
            this.parent[ni] = cur;
            this.push(ni, ng + heur(ni));
          }
        }
      }
    }
    if (!found) return null;

    // Reconstruct cell chain (goal -> start), then string-pull with line-of-sight.
    const cells: number[] = [];
    for (let c = goal; c !== -1; c = this.parent[c]) cells.push(c);
    cells.reverse();

    const pts: PathPoint[] = cells.map((c) => ({ x: this.cellCenterX(c % s), z: this.cellCenterZ((c / s) | 0) }));
    pts[0] = { x: sx, z: sz };
    pts[pts.length - 1] = { x: endX, z: endZ };

    const out: PathPoint[] = [];
    let anchor = pts[0];
    let i = 1;
    while (i < pts.length) {
      let j = i;
      while (j + 1 < pts.length && this.isLineClear(anchor.x, anchor.z, pts[j + 1].x, pts[j + 1].z)) j++;
      out.push(pts[j]);
      anchor = pts[j];
      i = j + 1;
    }
    return out;
  }

  // --- binary min-heap on f-score -------------------------------------------

  private push(node: number, f: number): void {
    let i = this.heapLen++;
    const h = this.heap, hf = this.heapF;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (hf[p] <= f) break;
      h[i] = h[p]; hf[i] = hf[p];
      i = p;
    }
    h[i] = node; hf[i] = f;
  }

  private pop(): number {
    const h = this.heap, hf = this.heapF;
    const top = h[0];
    const last = --this.heapLen;
    if (last > 0) {
      const node = h[last], f = hf[last];
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= last) break;
        const r = l + 1;
        const c = r < last && hf[r] < hf[l] ? r : l;
        if (hf[c] >= f) break;
        h[i] = h[c]; hf[i] = hf[c];
        i = c;
      }
      h[i] = node; hf[i] = f;
    }
    return top;
  }
}
