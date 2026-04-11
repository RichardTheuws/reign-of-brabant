/**
 * Reign of Brabant -- Map Tunnel System
 *
 * Handles map-level tunnel transport (neutral Limburg-style tunnels placed by
 * the MapGenerator). These are distinct from the Limburger faction's
 * UndergroundSystem, which uses Mijnschacht/Grot buildings.
 *
 * Map tunnels are pre-placed warp points on the terrain. Any faction's units
 * can use neutral tunnels. Faction-owned tunnels are restricted.
 *
 * Gameplay:
 *   - Units move-commanded to a tunnel entrance enter automatically
 *   - After travelTime seconds, they emerge at the exit
 *   - Units are hidden during transit (Y = -1000)
 *   - No surprise attack buff (that's a Limburger faction bonus only)
 */

import { query, hasComponent } from 'bitecs';
import { Position, Movement, Faction } from '../ecs/components';
import { IsUnit, IsDead } from '../ecs/tags';
import type { TunnelSpawn, FactionId } from '../types/index';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Distance from tunnel entrance to trigger entry. */
const TUNNEL_ENTRY_RADIUS = 2.5;

/** Off-screen Y position for units in transit. */
const TRANSIT_Y = -1000;

// ---------------------------------------------------------------------------
// Transit tracking
// ---------------------------------------------------------------------------

interface TunnelTransit {
  entityId: number;
  exitX: number;
  exitZ: number;
  exitTime: number;
  originalY: number;
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create the map tunnel system.
 * @param tunnels - Tunnel definitions from the generated map.
 */
export function createMapTunnelSystem(tunnels: readonly TunnelSpawn[]): SystemFn {
  const transits: TunnelTransit[] = [];

  // Pre-compute bidirectional tunnel pairs (entrance->exit and exit->entrance)
  const tunnelEndpoints: Array<{
    entryX: number;
    entryZ: number;
    exitX: number;
    exitZ: number;
    travelTime: number;
    factionOwner: FactionId | null;
  }> = [];

  for (const t of tunnels) {
    // Entrance -> Exit
    tunnelEndpoints.push({
      entryX: t.entrance.x,
      entryZ: t.entrance.z,
      exitX: t.exit.x,
      exitZ: t.exit.z,
      travelTime: t.travelTime,
      factionOwner: t.factionOwner,
    });
    // Exit -> Entrance (bidirectional)
    tunnelEndpoints.push({
      entryX: t.exit.x,
      entryZ: t.exit.z,
      exitX: t.entrance.x,
      exitZ: t.entrance.z,
      travelTime: t.travelTime,
      factionOwner: t.factionOwner,
    });
  }

  function mapTunnelSystem(world: GameWorld, _dt: number): void {
    const elapsed = world.meta.elapsed;
    const entities = query(world, [Position, Movement, Faction, IsUnit]);

    // 1. Check for units arriving at tunnel entrances
    for (const eid of entities) {
      if (hasComponent(world, eid, IsDead)) continue;
      // Skip units already in transit
      if (Position.y[eid] <= TRANSIT_Y + 1) continue;
      // Only check units that have just stopped moving (arrived)
      if (Movement.hasTarget[eid] === 1) continue;

      const ux = Position.x[eid];
      const uz = Position.z[eid];
      const fid = Faction.id[eid] as FactionId;

      for (const endpoint of tunnelEndpoints) {
        // Check faction restriction
        if (endpoint.factionOwner !== null && endpoint.factionOwner !== fid) continue;

        const dx = ux - endpoint.entryX;
        const dz = uz - endpoint.entryZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < TUNNEL_ENTRY_RADIUS) {
          // Already in transit check
          if (transits.some(t => t.entityId === eid)) break;

          // Enter tunnel: hide unit
          const originalY = Position.y[eid];
          Position.y[eid] = TRANSIT_Y;

          transits.push({
            entityId: eid,
            exitX: endpoint.exitX,
            exitZ: endpoint.exitZ,
            exitTime: elapsed + endpoint.travelTime,
            originalY,
          });
          break;
        }
      }
    }

    // 2. Process units in transit
    let i = transits.length;
    while (i--) {
      const transit = transits[i];
      if (elapsed >= transit.exitTime) {
        // Emerge from tunnel
        const eid = transit.entityId;
        Position.x[eid] = transit.exitX + (Math.random() - 0.5) * 2;
        Position.z[eid] = transit.exitZ + (Math.random() - 0.5) * 2;
        Position.y[eid] = transit.originalY;
        Movement.hasTarget[eid] = 0;

        // Remove from transit list
        transits.splice(i, 1);
      }
    }
  }

  // Expose tunnel data for minimap rendering
  (mapTunnelSystem as MapTunnelSystemFn).getTunnels = () => tunnels;
  (mapTunnelSystem as MapTunnelSystemFn).getTransitCount = () => transits.length;

  return mapTunnelSystem as SystemFn;
}

/** Extended system function type with public query methods. */
export type MapTunnelSystemFn = SystemFn & {
  getTunnels: () => readonly TunnelSpawn[];
  getTransitCount: () => number;
};
