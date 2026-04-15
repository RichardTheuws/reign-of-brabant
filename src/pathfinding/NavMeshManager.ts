/**
 * NavMeshManager -- recast-navigation-js integration
 *
 * Handles NavMesh generation from the terrain mesh, crowd-based multi-agent
 * pathfinding, and dynamic obstacle management for buildings.
 *
 * Uses @recast-navigation/three helpers to convert Three.js meshes directly
 * into Recast NavMesh data.  Falls back to simple direct movement when the
 * WASM module fails to initialise (e.g. on unsupported browsers).
 */

import type * as THREE from 'three';
import type { Crowd, CrowdAgent, NavMesh, NavMeshQuery, TileCache, Obstacle } from 'recast-navigation';
import { distance2D } from '../utils/math';

// ---------------------------------------------------------------------------
// Local Vector3 type for positions without importing Three.js Vector3.
// ---------------------------------------------------------------------------

/** Minimal Vector3-like used by recast-navigation. */
interface RcVec3 {
  x: number;
  y: number;
  z: number;
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** Recast modules -- populated after `init()`. */
let rcCrowd: Crowd | null = null;
let rcNavMesh: NavMesh | null = null;
let rcNavMeshQuery: NavMeshQuery | null = null;
let rcTileCache: TileCache | null = null;

/** Whether WASM init completed successfully. */
let recastReady = false;

// ---------------------------------------------------------------------------
// NavMesh config matching the PoC spec
// ---------------------------------------------------------------------------

const NAV_MESH_CONFIG = {
  cs: 0.3, // cellSize
  ch: 0.2, // cellHeight
  walkableSlopeAngle: 45,
  walkableHeight: 2,
  walkableClimb: 1,
  walkableRadius: 0.5,
  maxEdgeLen: 12,
  maxSimplificationError: 1.3,
  minRegionArea: 8,
  mergeRegionArea: 20,
  maxVertsPerPoly: 6,
  detailSampleDist: 6,
  detailSampleMaxError: 1,
} as const;

const TILE_CACHE_CONFIG = {
  ...NAV_MESH_CONFIG,
  tileSize: 32,
  maxObstacles: 128,
  expectedLayersPerTile: 4,
} as const;

const CROWD_MAX_AGENTS = 256;
const CROWD_MAX_AGENT_RADIUS = 0.6;

// ---------------------------------------------------------------------------
// Agent bookkeeping
// ---------------------------------------------------------------------------

interface AgentRecord {
  crowdAgent: CrowdAgent;
  entityId: number;
  radius: number;
  speed: number;
}

const agentsByEntity = new Map<number, AgentRecord>();
const obstacleRefs = new Map<number, Obstacle>();
let nextObstacleId = 1;

// ---------------------------------------------------------------------------
// Fallback: simple direct-movement positions when recast is unavailable
// ---------------------------------------------------------------------------

interface FallbackAgent {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  hasTarget: boolean;
  entityId: number;
}

const fallbackAgents = new Map<number, FallbackAgent>();

/** Optional terrain reference for river checks in fallback mode. */
let terrainRef: { isRiver: (x: number, z: number) => boolean } | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const NavMeshManager = {
  /** True once WASM is loaded and NavMesh is built. */
  get ready(): boolean {
    return recastReady;
  },

  /** True if running without real pathfinding (recast init failed). */
  get isFallback(): boolean {
    return !recastReady;
  },

  /**
   * Provide a terrain reference for river collision checks in fallback mode.
   * When Recast WASM is unavailable, fallback agents use this to avoid rivers.
   */
  setTerrain(terrain: { isRiver: (x: number, z: number) => boolean }): void {
    terrainRef = terrain;
  },

  // -----------------------------------------------------------------------
  // Initialisation
  // -----------------------------------------------------------------------

  /**
   * Initialise the recast-navigation WASM module and build a NavMesh from
   * the provided terrain mesh.
   *
   * This is async and MUST complete before any other method is called.
   * On failure it logs a warning and enables fallback direct-movement mode.
   */
  async init(terrainMesh: THREE.Mesh, staticObstacles: THREE.Mesh[] = []): Promise<void> {
    try {
      // Dynamic imports so the main bundle doesn't break if WASM fails
      const { init: initRecast } = await import('recast-navigation');
      const { threeToSoloNavMesh } = await import('@recast-navigation/three');
      const { Crowd, NavMeshQuery } = await import('recast-navigation');

      await initRecast();

      // Build solo navmesh (PoC -- no TileCache)
      const meshes = [terrainMesh, ...staticObstacles];
      const result = threeToSoloNavMesh(meshes, NAV_MESH_CONFIG);

      if (!result.success || !result.navMesh) {
        console.warn('[NavMeshManager] NavMesh generation failed, using fallback movement');
        return;
      }

      rcNavMesh = result.navMesh;
      rcNavMeshQuery = new NavMeshQuery(rcNavMesh);

      // Crowd for multi-agent movement
      rcCrowd = new Crowd(rcNavMesh, {
        maxAgents: CROWD_MAX_AGENTS,
        maxAgentRadius: CROWD_MAX_AGENT_RADIUS,
      });

      recastReady = true;
      console.log('[NavMeshManager] NavMesh built successfully, crowd ready');
    } catch (err) {
      console.warn('[NavMeshManager] recast-navigation init failed, using fallback movement:', err);
      recastReady = false;
    }
  },

  /**
   * Alternative init that also creates a TileCache for dynamic obstacles.
   * More expensive to build but supports addObstacle / removeObstacle.
   */
  async initWithTileCache(terrainMesh: THREE.Mesh, staticObstacles: THREE.Mesh[] = []): Promise<void> {
    try {
      const { init: initRecast } = await import('recast-navigation');
      const { threeToTileCache } = await import('@recast-navigation/three');
      const { Crowd, NavMeshQuery } = await import('recast-navigation');

      await initRecast();

      const meshes = [terrainMesh, ...staticObstacles];
      const result = threeToTileCache(meshes, TILE_CACHE_CONFIG);

      if (!result.success || !result.navMesh || !result.tileCache) {
        console.warn('[NavMeshManager] TileCache generation failed, falling back to solo navmesh');
        await this.init(terrainMesh, staticObstacles);
        return;
      }

      rcNavMesh = result.navMesh;
      rcTileCache = result.tileCache;
      rcNavMeshQuery = new NavMeshQuery(rcNavMesh);

      rcCrowd = new Crowd(rcNavMesh, {
        maxAgents: CROWD_MAX_AGENTS,
        maxAgentRadius: CROWD_MAX_AGENT_RADIUS,
      });

      recastReady = true;
      console.log('[NavMeshManager] TileCache + NavMesh built successfully');
    } catch (err) {
      console.warn('[NavMeshManager] TileCache init failed:', err);
      // Try fallback to solo
      await this.init(terrainMesh, staticObstacles);
    }
  },

  // -----------------------------------------------------------------------
  // Agent Management
  // -----------------------------------------------------------------------

  /**
   * Register an entity as a crowd agent at the given world position.
   */
  addAgent(entityId: number, x: number, z: number, radius: number, speed: number): void {
    if (agentsByEntity.has(entityId)) {
      this.removeAgent(entityId);
    }

    if (recastReady && rcCrowd) {
      const pos: RcVec3 = { x, y: 0, z };
      const crowdAgent = rcCrowd.addAgent(pos, {
        radius,
        height: 2.0,
        maxAcceleration: speed * 4,
        maxSpeed: speed,
        collisionQueryRange: Math.max(radius * 5, 2.5),
        pathOptimizationRange: 10,
        separationWeight: 2.0,
      });

      agentsByEntity.set(entityId, {
        crowdAgent,
        entityId,
        radius,
        speed,
      });
    } else {
      // Fallback
      fallbackAgents.set(entityId, {
        x,
        y: 0,
        z,
        targetX: x,
        targetZ: z,
        speed,
        hasTarget: false,
        entityId,
      });
    }
  },

  /**
   * Remove an entity's crowd agent.
   */
  removeAgent(entityId: number): void {
    if (recastReady && rcCrowd) {
      const record = agentsByEntity.get(entityId);
      if (record) {
        rcCrowd.removeAgent(record.crowdAgent);
        agentsByEntity.delete(entityId);
      }
    } else {
      fallbackAgents.delete(entityId);
    }
  },

  // -----------------------------------------------------------------------
  // Movement Requests
  // -----------------------------------------------------------------------

  /**
   * Request an agent to move to the given world-space target.
   * The crowd will compute a path and steer the agent there.
   */
  requestMove(entityId: number, targetX: number, targetZ: number): void {
    if (recastReady && rcCrowd && rcNavMeshQuery) {
      const record = agentsByEntity.get(entityId);
      if (!record) return;

      // Find the nearest valid point on the navmesh
      const result = rcNavMeshQuery.findClosestPoint({ x: targetX, y: 0, z: targetZ });
      if (result.success) {
        record.crowdAgent.requestMoveTarget(result.point);
      } else {
        // Target is off-navmesh, try raw position
        record.crowdAgent.requestMoveTarget({ x: targetX, y: 0, z: targetZ });
      }
    } else {
      // Fallback: simple direct movement
      const agent = fallbackAgents.get(entityId);
      if (agent) {
        agent.targetX = targetX;
        agent.targetZ = targetZ;
        agent.hasTarget = true;
      }
    }
  },

  /**
   * Stop an agent's current movement.
   */
  cancelMove(entityId: number): void {
    if (recastReady && rcCrowd) {
      const record = agentsByEntity.get(entityId);
      if (record) {
        record.crowdAgent.resetMoveTarget();
      }
    } else {
      const agent = fallbackAgents.get(entityId);
      if (agent) {
        agent.hasTarget = false;
      }
    }
  },

  /**
   * Teleport an agent to a new position (no pathfinding, instant).
   */
  teleportAgent(entityId: number, x: number, z: number): void {
    if (recastReady && rcCrowd) {
      const record = agentsByEntity.get(entityId);
      if (record) {
        record.crowdAgent.teleport({ x, y: 0, z });
      }
    } else {
      const agent = fallbackAgents.get(entityId);
      if (agent) {
        agent.x = x;
        agent.z = z;
      }
    }
  },

  // -----------------------------------------------------------------------
  // Per-frame update
  // -----------------------------------------------------------------------

  /**
   * Advance the crowd simulation by `dt` seconds.
   * Call once per fixed-update tick.
   */
  update(dt: number): void {
    if (recastReady && rcCrowd) {
      rcCrowd.update(dt);
    } else {
      // Fallback: move agents directly toward their targets
      for (const agent of fallbackAgents.values()) {
        if (!agent.hasTarget) continue;

        const dist = distance2D(agent.x, agent.z, agent.targetX, agent.targetZ);
        if (dist < 0.5) {
          agent.hasTarget = false;
          continue;
        }

        const dx = agent.targetX - agent.x;
        const dz = agent.targetZ - agent.z;
        const step = Math.min(agent.speed * dt, dist);
        const newX = agent.x + (dx / dist) * step;
        const newZ = agent.z + (dz / dist) * step;

        // Block movement into rivers (slide along edges if possible)
        if (terrainRef?.isRiver(newX, newZ)) {
          // Try sliding along edges: test X-only and Z-only movement
          if (!terrainRef.isRiver(newX, agent.z)) {
            agent.x = newX;
          } else if (!terrainRef.isRiver(agent.x, newZ)) {
            agent.z = newZ;
          }
          // else: blocked on all sides, don't move
        } else {
          agent.x = newX;
          agent.z = newZ;
        }
      }
    }
  },

  // -----------------------------------------------------------------------
  // Position Queries
  // -----------------------------------------------------------------------

  /**
   * Get the current position of a crowd agent.
   * Returns { x, y, z } or null if agent doesn't exist.
   */
  getAgentPosition(entityId: number): RcVec3 | null {
    if (recastReady && rcCrowd) {
      const record = agentsByEntity.get(entityId);
      if (!record) return null;
      const pos = record.crowdAgent.position();
      return { x: pos.x, y: pos.y, z: pos.z };
    } else {
      const agent = fallbackAgents.get(entityId);
      if (!agent) return null;
      return { x: agent.x, y: agent.y, z: agent.z };
    }
  },

  /**
   * Get the current velocity of a crowd agent.
   */
  getAgentVelocity(entityId: number): RcVec3 | null {
    if (recastReady && rcCrowd) {
      const record = agentsByEntity.get(entityId);
      if (!record) return null;
      const vel = record.crowdAgent.velocity();
      return { x: vel.x, y: vel.y, z: vel.z };
    }
    return null;
  },

  /**
   * Check if an agent has effectively stopped moving (velocity near zero).
   */
  isAgentIdle(entityId: number): boolean {
    if (recastReady && rcCrowd) {
      const record = agentsByEntity.get(entityId);
      if (!record) return true;
      const vel = record.crowdAgent.velocity();
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      return speed < 0.1;
    } else {
      const agent = fallbackAgents.get(entityId);
      return !agent || !agent.hasTarget;
    }
  },

  // -----------------------------------------------------------------------
  // Pathfinding Queries (individual, not crowd-based)
  // -----------------------------------------------------------------------

  /**
   * Compute a path between two world-space points.
   * Returns an array of waypoints or null on failure.
   */
  computePath(startX: number, startZ: number, endX: number, endZ: number): RcVec3[] | null {
    if (!recastReady || !rcNavMeshQuery) return null;

    const start = rcNavMeshQuery.findClosestPoint({ x: startX, y: 0, z: startZ });
    const end = rcNavMeshQuery.findClosestPoint({ x: endX, y: 0, z: endZ });

    if (!start.success || !end.success) return null;

    const result = rcNavMeshQuery.computePath(start.point, end.point);
    if (!result.success || !result.path) return null;

    return result.path.map((p: RcVec3) => ({ x: p.x, y: p.y, z: p.z }));
  },

  /**
   * Find the closest valid point on the navmesh to a world position.
   */
  findClosestPoint(x: number, z: number): RcVec3 | null {
    if (!recastReady || !rcNavMeshQuery) return { x, y: 0, z };

    const result = rcNavMeshQuery.findClosestPoint({ x, y: 0, z });
    if (!result.success) return { x, y: 0, z };

    return { x: result.point.x, y: result.point.y, z: result.point.z };
  },

  // -----------------------------------------------------------------------
  // Dynamic Obstacles (Buildings)
  // -----------------------------------------------------------------------

  /**
   * Add a cylindrical obstacle (e.g. round building or resource).
   * Returns an obstacle ID for later removal.
   */
  addObstacle(x: number, z: number, radius: number, height: number): number {
    const id = nextObstacleId++;

    if (recastReady && rcTileCache && rcNavMesh) {
      const result = rcTileCache.addCylinderObstacle({ x, y: 0, z }, radius, height);
      if (result.success && result.obstacle) {
        obstacleRefs.set(id, result.obstacle);
        rcTileCache.update(rcNavMesh);
      }
    }

    return id;
  },

  /**
   * Add a box obstacle (e.g. rectangular building).
   * Returns an obstacle ID for later removal.
   */
  addBoxObstacle(x: number, z: number, halfWidth: number, halfDepth: number, height: number): number {
    const id = nextObstacleId++;

    if (recastReady && rcTileCache && rcNavMesh) {
      const result = rcTileCache.addBoxObstacle(
        { x, y: 0, z },
        { x: halfWidth, y: height / 2, z: halfDepth },
        0, // no rotation
      );
      if (result.success && result.obstacle) {
        obstacleRefs.set(id, result.obstacle);
        rcTileCache.update(rcNavMesh);
      }
    }

    return id;
  },

  /**
   * Remove a previously added obstacle.
   */
  removeObstacle(obstacleId: number): void {
    if (recastReady && rcTileCache && rcNavMesh) {
      const obstacle = obstacleRefs.get(obstacleId);
      if (obstacle) {
        rcTileCache.removeObstacle(obstacle);
        rcTileCache.update(rcNavMesh);
        obstacleRefs.delete(obstacleId);
      }
    }
  },

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  /**
   * Dispose all recast resources.
   */
  dispose(): void {
    agentsByEntity.clear();
    fallbackAgents.clear();
    obstacleRefs.clear();
    rcCrowd = null;
    rcNavMesh = null;
    rcNavMeshQuery = null;
    rcTileCache = null;
    terrainRef = null;
    recastReady = false;
  },

  // -----------------------------------------------------------------------
  // Debug helpers
  // -----------------------------------------------------------------------

  /** Number of active crowd agents. */
  get agentCount(): number {
    return recastReady ? agentsByEntity.size : fallbackAgents.size;
  },

  /** Get the raw NavMesh for debug visualization. */
  get navMesh(): NavMesh | null {
    return rcNavMesh;
  },

  /** Get the raw Crowd for debug visualization (CrowdHelper). */
  get crowd(): Crowd | null {
    return rcCrowd;
  },
};
