/**
 * Reign of Brabant -- Underground Network System
 *
 * Core Limburger faction mechanic: an underground tunnel network that enables
 * invisible unit transport between Mijnschachten and Grotten (cave endpoints).
 *
 * Key mechanics:
 *   - Mijnschachten and Grotten serve as tunnel endpoints (max 4, or 5 with upgrade)
 *   - All endpoints auto-connect into a single network per faction
 *   - Units enter a tunnel and transit for 3 seconds (1.5s with Geheime Gangen)
 *   - Max 12 units simultaneously in transit
 *   - Kolen maintenance: each Grot costs 1 Kolen per 30s; tunnels shut if Kolen = 0
 *   - Surprise attack bonus: +25% damage for 3 seconds after exiting a tunnel
 *   - Siege units CANNOT use tunnels
 *
 * Data lives outside the ECS as a singleton TunnelNetworkState per faction.
 * The system communicates via EventBus events:
 *   - 'tunnel-enter': request to send units into the tunnel
 *   - 'tunnel-exit': fired when units emerge from a tunnel
 *   - 'tunnel-network-changed': fired when endpoints are added/removed
 */

import { query, hasComponent, addComponent } from 'bitecs';
import {
  Position,
  Faction,
  Building,
  UnitType,
  StatBuff,
} from '../ecs/components';
import { IsBuilding, IsDead } from '../ecs/tags';
import {
  FactionId,
  BuildingTypeId,
  UnitTypeId,
} from '../types/index';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import { getLimburgTunnelTransitMult } from './MijnschachtSystem';
import type { GameWorld } from '../ecs/world';
import type { SystemFn } from './SystemPipeline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default transit duration in seconds. */
const DEFAULT_TRANSIT_DURATION = 3.0;

/** Transit duration with Geheime Gangen upgrade (50% faster). */
const UPGRADED_TRANSIT_DURATION = 1.5;

/** Maximum units in transit at the same time per network. */
const MAX_UNITS_IN_TRANSIT = 12;

/** Default maximum tunnel endpoints per network. */
const DEFAULT_MAX_ENDPOINTS = 4;

/** Maximum endpoints with Geheime Gangen upgrade. */
const UPGRADED_MAX_ENDPOINTS = 5;

/** Kolen maintenance cost per Grot per 30 seconds. */
const KOLEN_COST_PER_GROT = 1;

/** Kolen maintenance interval in seconds. */
const KOLEN_MAINTENANCE_INTERVAL = 30;

/** Surprise attack damage bonus (+25%). */
const SURPRISE_ATTACK_BONUS = 1.25;

/** Duration of the surprise attack buff in seconds. */
const SURPRISE_BUFF_DURATION = 3.0;

/** Off-screen Y position for units in transit. */
const TRANSIT_Y_POSITION = -1000;

/** How often to recalculate the network topology (seconds). */
const NETWORK_UPDATE_INTERVAL = 1.0;

// ---------------------------------------------------------------------------
// Tunnel Network Types
// ---------------------------------------------------------------------------

/** A single tunnel endpoint (Mijnschacht or Grot building). */
interface TunnelEndpoint {
  /** Entity ID of the Mijnschacht or Grot building. */
  buildingEid: number;
  /** World position of the building. */
  position: { x: number; z: number };
  /** Whether this is a Mijnschacht (true) or Grot (false). */
  isMijnschacht: boolean;
}

/** A unit currently in transit through the tunnel. */
interface TransitUnit {
  /** Entity ID of the unit. */
  entityId: number;
  /** Game time (world.meta.elapsed) when the unit entered the tunnel. */
  entryTime: number;
  /** Index of the exit endpoint in the network's endpoints array. */
  exitEndpointIndex: number;
  /** Duration of this transit in seconds. */
  transitDuration: number;
  /** Saved original Y position to restore if needed. */
  originalY: number;
}

/** Per-faction tunnel network state. */
interface TunnelNetworkState {
  /** Ordered list of tunnel endpoints. */
  endpoints: TunnelEndpoint[];
  /** Units currently travelling through the tunnel. */
  unitsInTransit: TransitUnit[];
  /** Whether the network is active (has Kolen for maintenance). */
  active: boolean;
  /** Accumulator for Kolen maintenance drain. */
  maintenanceAccumulator: number;
  /** Whether the Geheime Gangen upgrade is researched. */
  hasGeheimenGangenUpgrade: boolean;
}

// ---------------------------------------------------------------------------
// Event Payloads (extend GameEvents at integration time)
// ---------------------------------------------------------------------------

/** Payload for 'tunnel-enter' event. */
export interface TunnelEnterEvent {
  /** Faction requesting the tunnel transport. */
  readonly factionId: FactionId;
  /** Entity IDs of units to send into the tunnel. */
  readonly unitEids: readonly number[];
  /** Entity ID of the target exit endpoint building. */
  readonly exitBuildingEid: number;
}

/** Payload for 'tunnel-exit' event. */
export interface TunnelExitEvent {
  /** Faction whose units emerged. */
  readonly factionId: FactionId;
  /** Entity IDs of units that exited. */
  readonly unitEids: readonly number[];
  /** Position where units emerged. */
  readonly position: { x: number; z: number };
  /** Entity ID of the exit building. */
  readonly exitBuildingEid: number;
}

/** Payload for 'tunnel-network-changed' event. */
export interface TunnelNetworkChangedEvent {
  /** Faction whose network changed. */
  readonly factionId: FactionId;
  /** Number of active endpoints. */
  readonly endpointCount: number;
  /** Whether the network is active. */
  readonly active: boolean;
}

// ---------------------------------------------------------------------------
// Tunnel Building Type helpers
// ---------------------------------------------------------------------------

/**
 * Check if a building type is a tunnel endpoint.
 * Mijnschacht (TertiaryResourceBuilding) and Grot (FactionSpecial1)
 * are tunnel endpoints for the Limburgers.
 */
function isTunnelEndpointBuilding(buildingTypeId: number): boolean {
  return (
    buildingTypeId === BuildingTypeId.TertiaryResourceBuilding ||
    buildingTypeId === BuildingTypeId.FactionSpecial1
  );
}

/**
 * Check if a building type is a Mijnschacht (produces Kolen + is tunnel endpoint).
 */
function isMijnschacht(buildingTypeId: number): boolean {
  return buildingTypeId === BuildingTypeId.TertiaryResourceBuilding;
}

// ---------------------------------------------------------------------------
// System Factory
// ---------------------------------------------------------------------------

/**
 * Create the Underground Network system for the Limburgers faction.
 * Returns a SystemFn that processes tunnel networks each frame.
 */
export function createUndergroundSystem(): SystemFn {
  // Per-faction network state (only Limburgers use it, but keyed by factionId for extensibility)
  const networks = new Map<FactionId, TunnelNetworkState>();

  // Topology rebuild accumulator
  let topologyAccumulator = 0;

  // ---------------------------------------------------------------------------
  // Network state helpers
  // ---------------------------------------------------------------------------

  function getOrCreateNetwork(factionId: FactionId): TunnelNetworkState {
    let net = networks.get(factionId);
    if (!net) {
      net = {
        endpoints: [],
        unitsInTransit: [],
        active: true,
        maintenanceAccumulator: 0,
        hasGeheimenGangenUpgrade: false,
      };
      networks.set(factionId, net);
    }
    return net;
  }

  function getTransitDuration(net: TunnelNetworkState): number {
    return net.hasGeheimenGangenUpgrade
      ? UPGRADED_TRANSIT_DURATION
      : DEFAULT_TRANSIT_DURATION;
  }

  function getMaxEndpoints(net: TunnelNetworkState): number {
    return net.hasGeheimenGangenUpgrade
      ? UPGRADED_MAX_ENDPOINTS
      : DEFAULT_MAX_ENDPOINTS;
  }

  // ---------------------------------------------------------------------------
  // Rebuild tunnel topology from ECS buildings
  // ---------------------------------------------------------------------------

  function rebuildTopology(world: GameWorld): void {
    const allBuildings = query(world, [Position, Faction, Building, IsBuilding]);

    // Temporary collection per faction
    const factionEndpoints = new Map<FactionId, TunnelEndpoint[]>();

    for (const eid of allBuildings) {
      // Skip dead / under-construction buildings
      if (hasComponent(world, eid, IsDead)) continue;
      if (Building.complete[eid] !== 1) continue;

      const fid = Faction.id[eid] as FactionId;
      // Only Limburgers have tunnel networks
      if (fid !== FactionId.Limburgers) continue;

      const bType = Building.typeId[eid];
      if (!isTunnelEndpointBuilding(bType)) continue;

      if (!factionEndpoints.has(fid)) {
        factionEndpoints.set(fid, []);
      }

      const eps = factionEndpoints.get(fid)!;
      const net = getOrCreateNetwork(fid);

      // Respect max endpoint cap
      if (eps.length >= getMaxEndpoints(net)) continue;

      eps.push({
        buildingEid: eid,
        position: { x: Position.x[eid], z: Position.z[eid] },
        isMijnschacht: isMijnschacht(bType),
      });
    }

    // Update network state and emit change events
    for (const [fid, eps] of factionEndpoints) {
      const net = getOrCreateNetwork(fid);
      const prevCount = net.endpoints.length;
      net.endpoints = eps;

      if (eps.length !== prevCount) {
        (eventBus as EventBusAny).emit('tunnel-network-changed', {
          factionId: fid,
          endpointCount: eps.length,
          active: net.active,
        } satisfies TunnelNetworkChangedEvent);
      }
    }

    // Handle factions that lost all endpoints
    for (const [fid, net] of networks) {
      if (!factionEndpoints.has(fid)) {
        if (net.endpoints.length > 0) {
          net.endpoints = [];
          (eventBus as EventBusAny).emit('tunnel-network-changed', {
            factionId: fid,
            endpointCount: 0,
            active: false,
          } satisfies TunnelNetworkChangedEvent);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Kolen maintenance
  // ---------------------------------------------------------------------------

  function processMaintenanceCosts(dt: number): void {
    for (const [fid, net] of networks) {
      if (net.endpoints.length === 0) continue;

      // Count Grotten (Mijnschachten don't cost Kolen for tunnel maintenance
      // because they already produce Kolen)
      const grotCount = net.endpoints.filter((e) => !e.isMijnschacht).length;
      if (grotCount === 0) {
        // Only Mijnschachten -- no tunnel maintenance cost
        net.active = true;
        continue;
      }

      net.maintenanceAccumulator += dt;

      if (net.maintenanceAccumulator >= KOLEN_MAINTENANCE_INTERVAL) {
        net.maintenanceAccumulator -= KOLEN_MAINTENANCE_INTERVAL;

        const cost = grotCount * KOLEN_COST_PER_GROT;
        // Kolen is stored as tertiary resource (gezelligheid field in PlayerState)
        const currentKolen = playerState.getTertiary(fid);

        if (currentKolen >= cost) {
          playerState.spendTertiary(fid, cost);
          if (!net.active) {
            net.active = true;
            (eventBus as EventBusAny).emit('tunnel-network-changed', {
              factionId: fid,
              endpointCount: net.endpoints.length,
              active: true,
            } satisfies TunnelNetworkChangedEvent);
          }
        } else {
          // Not enough Kolen -- shut down tunnels
          if (net.active) {
            net.active = false;
            (eventBus as EventBusAny).emit('tunnel-network-changed', {
              factionId: fid,
              endpointCount: net.endpoints.length,
              active: false,
            } satisfies TunnelNetworkChangedEvent);
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Process units entering tunnels
  // ---------------------------------------------------------------------------

  function handleTunnelEnter(event: TunnelEnterEvent, world: GameWorld): void {
    const net = networks.get(event.factionId);
    if (!net || !net.active) return;
    if (net.endpoints.length < 2) return;

    // Find the exit endpoint
    const exitIdx = net.endpoints.findIndex(
      (e) => e.buildingEid === event.exitBuildingEid,
    );
    if (exitIdx < 0) return;

    // Drukvuur click-buff halves transit duration when active (Limburg only).
    const transitDuration = getTransitDuration(net) * getLimburgTunnelTransitMult(FactionId.Limburgers);
    const elapsed = world.meta.elapsed;

    for (const eid of event.unitEids) {
      // Check transit capacity
      if (net.unitsInTransit.length >= MAX_UNITS_IN_TRANSIT) break;

      // Validate unit is alive and belongs to the faction
      if (hasComponent(world, eid, IsDead)) continue;
      if (Faction.id[eid] !== event.factionId) continue;

      // Siege units cannot use tunnels
      if (UnitType.id[eid] === UnitTypeId.Siege) continue;

      // Don't allow units already in transit
      if (net.unitsInTransit.some((t) => t.entityId === eid)) continue;

      // Hide unit: move to off-screen Y position
      const originalY = Position.y[eid];
      Position.y[eid] = TRANSIT_Y_POSITION;

      net.unitsInTransit.push({
        entityId: eid,
        entryTime: elapsed,
        exitEndpointIndex: exitIdx,
        transitDuration,
        originalY,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Process units in transit (spawn at exit when transit completes)
  // ---------------------------------------------------------------------------

  function processTransitUnits(world: GameWorld): void {
    const elapsed = world.meta.elapsed;

    for (const [fid, net] of networks) {
      const completed: TransitUnit[] = [];
      const remaining: TransitUnit[] = [];

      for (const transit of net.unitsInTransit) {
        const timeInTransit = elapsed - transit.entryTime;

        if (timeInTransit >= transit.transitDuration) {
          completed.push(transit);
        } else {
          remaining.push(transit);
        }
      }

      net.unitsInTransit = remaining;

      if (completed.length === 0) continue;

      // Group by exit endpoint for batch processing
      const byExit = new Map<number, TransitUnit[]>();
      for (const transit of completed) {
        const group = byExit.get(transit.exitEndpointIndex) ?? [];
        group.push(transit);
        byExit.set(transit.exitEndpointIndex, group);
      }

      for (const [exitIdx, units] of byExit) {
        const endpoint = net.endpoints[exitIdx];
        if (!endpoint) {
          // Exit endpoint was destroyed during transit -- emergency surface spawn
          // Spawn at map center as fallback
          spawnUnitsAtPosition(units, { x: 64, z: 64 }, world);
          continue;
        }

        spawnUnitsAtPosition(units, endpoint.position, world);

        // Emit tunnel-exit event
        const exitedEids = units.map((t) => t.entityId);
        (eventBus as EventBusAny).emit('tunnel-exit', {
          factionId: fid,
          unitEids: exitedEids,
          position: { ...endpoint.position },
          exitBuildingEid: endpoint.buildingEid,
        } satisfies TunnelExitEvent);
      }
    }
  }

  /**
   * Place units at the exit position, restore Y, and apply surprise attack buff.
   * Units are spread in a small circle around the endpoint to avoid stacking.
   */
  function spawnUnitsAtPosition(
    transits: TransitUnit[],
    pos: { x: number; z: number },
    world: GameWorld,
  ): void {
    const count = transits.length;
    const spreadRadius = Math.min(count * 0.5, 4);

    for (let i = 0; i < count; i++) {
      const transit = transits[i];
      const eid = transit.entityId;

      // Spread units in a circle around the exit
      const angle = (i / count) * Math.PI * 2;
      Position.x[eid] = pos.x + Math.cos(angle) * spreadRadius;
      Position.z[eid] = pos.z + Math.sin(angle) * spreadRadius;
      Position.y[eid] = transit.originalY;

      // Apply surprise attack buff: +25% damage for 3 seconds
      applySurpriseAttackBuff(world, eid);
    }
  }

  /**
   * Apply the surprise attack buff to a unit that just exited a tunnel.
   * Uses the StatBuff component for temporary stat boosts.
   */
  function applySurpriseAttackBuff(world: GameWorld, eid: number): void {
    if (!hasComponent(world, eid, StatBuff)) {
      addComponent(world, eid, StatBuff);
    }
    StatBuff.attackMult[eid] = SURPRISE_ATTACK_BONUS;
    StatBuff.speedMult[eid] = 1.0;
    StatBuff.armorMult[eid] = 1.0;
    StatBuff.duration[eid] = SURPRISE_BUFF_DURATION;
  }

  // ---------------------------------------------------------------------------
  // Handle building destruction -- emergency surface spawn for in-transit units
  // ---------------------------------------------------------------------------

  function handleBuildingDestroyed(event: { entityId: number; factionId: FactionId }): void {
    for (const [_fid, net] of networks) {
      // Check if the destroyed building was a tunnel endpoint
      const epIdx = net.endpoints.findIndex((e) => e.buildingEid === event.entityId);
      if (epIdx < 0) continue;

      // Force-complete any transit units heading to this endpoint
      const stranded: TransitUnit[] = [];
      const remaining: TransitUnit[] = [];

      for (const transit of net.unitsInTransit) {
        if (transit.exitEndpointIndex === epIdx) {
          stranded.push(transit);
        } else {
          remaining.push(transit);
        }
      }

      net.unitsInTransit = remaining;

      // Surface-spawn stranded units at the destroyed building's last position
      if (stranded.length > 0) {
        const ep = net.endpoints[epIdx];
        for (const transit of stranded) {
          const eid = transit.entityId;
          Position.x[eid] = ep.position.x;
          Position.z[eid] = ep.position.z;
          Position.y[eid] = transit.originalY;
          // No surprise buff for emergency surface -- they're vulnerable
        }
      }

      // Remove the endpoint (topology will be rebuilt next interval)
      net.endpoints.splice(epIdx, 1);

      // Fix exit indices for remaining transit units
      for (const transit of net.unitsInTransit) {
        if (transit.exitEndpointIndex > epIdx) {
          transit.exitEndpointIndex--;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Subscribe to events
  // ---------------------------------------------------------------------------

  // We use `as any` cast on the eventBus only at the subscription site because
  // the tunnel events are not yet declared in GameEvents (new events).
  // At integration time these should be added to GameEvents in types/index.ts.
  type EventBusAny = {
    on: (event: string, cb: (...args: unknown[]) => void) => void;
    off: (event: string, cb: (...args: unknown[]) => void) => void;
    emit: (event: string, data: unknown) => void;
  };

  let tunnelEnterHandler: ((event: TunnelEnterEvent) => void) | null = null;
  let buildingDestroyedHandler:
    | ((event: { entityId: number; factionId: FactionId; buildingTypeId: number }) => void)
    | null = null;

  // ---------------------------------------------------------------------------
  // Public API: query network state (for UI, minimap, etc.)
  // ---------------------------------------------------------------------------

  /**
   * Get the current tunnel network state for a faction.
   * Useful for UI overlays (minimap lines between endpoints, transit indicators).
   */
  function getNetworkState(factionId: FactionId): Readonly<TunnelNetworkState> | null {
    return networks.get(factionId) ?? null;
  }

  /**
   * Enable the Geheime Gangen upgrade for a faction's tunnel network.
   * Called by TechTreeSystem when the upgrade is researched.
   */
  function enableGeheimenGangen(factionId: FactionId): void {
    const net = getOrCreateNetwork(factionId);
    net.hasGeheimenGangenUpgrade = true;
  }

  // Attach public API to the system function so external code can access it
  const publicApi = {
    getNetworkState,
    enableGeheimenGangen,
  };

  // ---------------------------------------------------------------------------
  // Main system function
  // ---------------------------------------------------------------------------

  function undergroundSystem(world: GameWorld, dt: number): void {
    // Lazy-subscribe to events on first call
    if (!tunnelEnterHandler) {
      tunnelEnterHandler = (event: TunnelEnterEvent) => handleTunnelEnter(event, world);
      (eventBus as unknown as EventBusAny).on('tunnel-enter', tunnelEnterHandler as (...args: unknown[]) => void);

      buildingDestroyedHandler = (event) => handleBuildingDestroyed(event);
      (eventBus as unknown as EventBusAny).on('building-destroyed', buildingDestroyedHandler as (...args: unknown[]) => void);
    }

    // Rebuild tunnel topology periodically (not every frame)
    topologyAccumulator += dt;
    if (topologyAccumulator >= NETWORK_UPDATE_INTERVAL) {
      topologyAccumulator -= NETWORK_UPDATE_INTERVAL;
      rebuildTopology(world);
    }

    // Process Kolen maintenance costs
    processMaintenanceCosts(dt);

    // Process units in transit (check if any have completed their journey)
    processTransitUnits(world);
  }

  // Attach public API to the function object
  Object.assign(undergroundSystem, publicApi);

  return undergroundSystem as SystemFn;
}

// ---------------------------------------------------------------------------
// Type export for the system with public API
// ---------------------------------------------------------------------------

/** The UndergroundSystem function with attached public API methods. */
export type UndergroundSystemFn = SystemFn & {
  getNetworkState: (factionId: FactionId) => Readonly<{
    endpoints: readonly {
      buildingEid: number;
      position: { x: number; z: number };
      isMijnschacht: boolean;
    }[];
    unitsInTransit: readonly {
      entityId: number;
      entryTime: number;
      exitEndpointIndex: number;
      transitDuration: number;
    }[];
    active: boolean;
    hasGeheimenGangenUpgrade: boolean;
  }> | null;
  enableGeheimenGangen: (factionId: FactionId) => void;
};
