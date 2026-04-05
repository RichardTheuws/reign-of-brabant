# Reign of Brabant — Sub-PRD: Technical Architecture

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft
**Parent**: PRD.md v1.0.0
**Tech Stack**: Three.js, TypeScript, Vite, bitECS, recast-navigation-js, Yuka.js, Howler.js

---

## Inhoudsopgave

1. [ECS Architecture (bitECS)](#1-ecs-architecture-bitecs)
2. [Rendering Pipeline](#2-rendering-pipeline)
3. [Pathfinding Architecture](#3-pathfinding-architecture)
4. [AI Architecture](#4-ai-architecture)
5. [Save/Load Systeem](#5-saveload-systeem)
6. [Error Handling & Recovery](#6-error-handling--recovery)
7. [Performance Budget](#7-performance-budget)
8. [Build & Deployment](#8-build--deployment)
9. [Testing Strategy](#9-testing-strategy)
10. [Security](#10-security)

---

## 1. ECS Architecture (bitECS)

### 1.1 Waarom bitECS

bitECS gebruikt Structure-of-Arrays (SoA) met `Float32Array`/`Uint32Array` backing. Dit geeft cache-coherent iteration over duizenden entities en 335K+ ops/s op modern hardware. Elke component is een object met TypedArray properties -- geen class instanties, geen GC pressure.

### 1.2 World Setup

```typescript
import { createWorld, addEntity, addComponent, defineQuery, defineSystem } from 'bitecs';

// Eenmalig bij game start
const world = createWorld({
  maxEntities: 2048  // 400 units + 200 buildings + resources + projectiles + particles
});

// World metadata (niet-ECS, singleton)
interface WorldMeta {
  tick: number;                // Frame counter
  dt: number;                  // Delta time (seconds)
  time: number;                // Elapsed time (seconds)
  mapSize: [number, number];   // Map dimensions
  playerFaction: number;       // Local player faction ID
  gameState: 'loading' | 'playing' | 'paused' | 'ended';
}
```

### 1.3 Component Definities

Alle components zijn `defineComponent()` calls met TypedArray backing. Keuze voor `Float32Array` (f32) vs `Uint8Array` (u8) vs `Uint16Array` (u16) vs `Uint32Array` (u32) is gebaseerd op value range en precision.

```typescript
import { defineComponent, Types } from 'bitecs';
const { f32, u8, u16, u32, i32 } = Types;

// ============================================================
// SPATIAL COMPONENTS
// ============================================================

/** World-space position. Updated by MovementSystem. */
const Position = defineComponent({
  x: f32,   // World X (0..256 map units)
  y: f32,   // World Y (height, from terrain)
  z: f32    // World Z (0..256 map units)
});

/** Velocity vector. Set by MovementSystem, consumed by PositionIntegrationSystem. */
const Velocity = defineComponent({
  x: f32,
  y: f32,
  z: f32
});

/** Rotation around Y-axis in radians. Units face movement direction / attack target. */
const Rotation = defineComponent({
  y: f32
});

/** Bounding radius for collision detection and selection picking. */
const BoundingRadius = defineComponent({
  radius: f32  // World units
});

// ============================================================
// COMBAT COMPONENTS
// ============================================================

/** Health pool. Entities with Health.current <= 0 are marked for death. */
const Health = defineComponent({
  current: f32,
  max: f32
});

/** Attack capability. timer counts down; when <= 0, attack fires and resets to cooldown. */
const Attack = defineComponent({
  damage: f32,         // Base damage
  speed: f32,          // Attack interval (seconds)
  range: f32,          // Attack range (world units, 0 = melee)
  cooldown: f32,       // Reset value for timer
  timer: f32,          // Countdown to next attack
  bonusVsLight: f32,   // Multiplier vs Light armor (1.0 = no bonus)
  bonusVsMedium: f32,
  bonusVsHeavy: f32,
  bonusVsBuilding: f32
});

/** Armor values. type: 0=None, 1=Light, 2=Medium, 3=Heavy, 4=Building */
const Armor = defineComponent({
  value: f32,
  type: u8
});

/** Heal capability (Support units). */
const Heal = defineComponent({
  amount: f32,       // HP per heal
  speed: f32,        // Interval (seconds)
  range: f32,        // Heal range
  timer: f32         // Countdown
});

/** Projectile data. Attached to projectile entities, not the shooter. */
const Projectile = defineComponent({
  targetEid: u32,     // Target entity ID (0 = ground target)
  targetX: f32,       // Ground target X (if targetEid == 0)
  targetZ: f32,       // Ground target Z
  speed: f32,         // Travel speed (units/sec)
  damage: f32,        // Damage on impact
  splashRadius: f32,  // 0 = single target, >0 = AoE
  sourceEid: u32,     // Who fired this (for faction check)
  armorBonusType: u8  // Which armor type bonus to apply
});

// ============================================================
// MOVEMENT COMPONENTS
// ============================================================

/** Movement command. Set by InputSystem or AISystem. Consumed by PathfindingSystem. */
const Movement = defineComponent({
  speed: f32,         // Max move speed (units/sec)
  targetX: f32,       // Destination X
  targetZ: f32,       // Destination Z
  hasTarget: u8       // 0 = idle, 1 = has move target
});

/** Path data. Set by PathfindingSystem, consumed by SteeringSystem. */
const Path = defineComponent({
  waypointIndex: u16,  // Current waypoint index in shared path buffer
  waypointCount: u16,  // Total waypoints
  pathId: u32          // Reference into PathBuffer (shared ArrayBuffer)
});

/** Formation slot assignment. Set by FormationSystem. */
const FormationSlot = defineComponent({
  groupId: u32,       // Formation group ID
  offsetX: f32,       // Offset from group center
  offsetZ: f32
});

// ============================================================
// IDENTITY & OWNERSHIP COMPONENTS
// ============================================================

/** Faction membership. id: 0=Brabanders, 1=Randstad, 2=Limburgers, 3=Belgen, 255=Neutral */
const Faction = defineComponent({
  id: u8
});

/**
 * Unit archetype. id maps to UnitArchetypeRegistry.
 * 0=Worker, 1=Infantry, 2=Ranged, 3=Heavy, 4=Siege, 5=Support,
 * 6=Special, 7=Hero, 8=Scout
 */
const UnitType = defineComponent({
  id: u8,
  subId: u8   // Faction-specific unit ID (e.g., Brabanders Infantry = Carnavalvierder)
});

/** Selection state. by: playerIndex who selected this (255 = not selected). */
const Selected = defineComponent({
  by: u8
});

/** Control group membership. Bitfield: bit 0 = group 1, bit 8 = group 9. */
const ControlGroup = defineComponent({
  groups: u16  // Bitmask: groups 1-10
});

// ============================================================
// RESOURCE & ECONOMY COMPONENTS
// ============================================================

/** Resource node (gold mine, tree). */
const Resource = defineComponent({
  type: u8,          // 0=Primary(gold), 1=Secondary(lumber)
  amount: f32,       // Remaining amount
  capacity: f32,     // Max capacity (for UI display)
  maxGatherers: u8   // Max simultaneous gatherers (gold mines: 5, trees: 1)
});

/** Worker gathering state. */
const Gatherer = defineComponent({
  carrying: f32,     // Amount currently carried
  carryCapacity: f32, // Max carry (10 for most, 8 for Stagiair, 12 for Frietkraamhouder)
  resourceType: u8,  // What type being gathered
  targetEid: u32,    // Resource node entity being gathered from
  returnEid: u32,    // Town Hall entity to return to
  state: u8          // 0=idle, 1=moving_to_resource, 2=gathering, 3=returning
});

// ============================================================
// BUILDING COMPONENTS
// ============================================================

/**
 * Building data.
 * type: maps to BuildingArchetypeRegistry.
 * 0=TownHall, 1=Barracks, 2=ResourceGen, 3=Tech, 4=Tower, 5=Advanced, 6=Housing, 7=Special
 */
const Building = defineComponent({
  type: u8,
  progress: f32,     // 0.0 to 1.0 (construction progress)
  complete: u8,       // 0 = under construction, 1 = complete
  sightRange: f32,    // Fog of war sight range
  popProvided: u8     // Population capacity provided (housing = 8, townhall = 10)
});

/** Production queue. Buildings that train units. */
const Production = defineComponent({
  unitType: u8,       // Currently producing unit type (255 = none)
  unitSubId: u8,      // Faction-specific sub-ID
  progress: f32,      // 0.0 to 1.0
  duration: f32,      // Total build time in seconds
  rallyX: f32,        // Rally point X
  rallyZ: f32,        // Rally point Z
  queueSlot0: u8,     // Queue: unit type in slot 0 (255 = empty)
  queueSlot1: u8,
  queueSlot2: u8,
  queueSlot3: u8,
  queueSlot4: u8      // Max 5 units in queue
});

/** Passive resource generation (Bakkerij, Brouwerij, Starbucks, etc.) */
const ResourceGenerator = defineComponent({
  resourceType: u8,    // 0=Primary, 1=Secondary, 2=Tertiary
  amountPer10s: f32,   // Amount generated per 10 seconds
  timer: f32           // Countdown to next generation tick
});

// ============================================================
// VISIBILITY & FOG OF WAR
// ============================================================

/** Sight range for fog of war calculation. */
const Visibility = defineComponent({
  range: f32   // Sight range in world units
});

/** Stealth state (Kansen, Mijnrat, Dubbele Spion). */
const Stealth = defineComponent({
  active: u8,         // 0 = visible, 1 = stealthed
  duration: f32,      // Remaining stealth time
  detectionRange: f32 // Range at which enemies can detect (half normal sight)
});

// ============================================================
// ABILITY COMPONENTS
// ============================================================

/**
 * Active ability slots (max 4 per entity).
 * Each slot has: abilityId (from AbilityRegistry), cooldown timer, active flag.
 */
const Ability0 = defineComponent({ id: u16, cooldown: f32, timer: f32, active: u8 });
const Ability1 = defineComponent({ id: u16, cooldown: f32, timer: f32, active: u8 });
const Ability2 = defineComponent({ id: u16, cooldown: f32, timer: f32, active: u8 });
const Ability3 = defineComponent({ id: u16, cooldown: f32, timer: f32, active: u8 }); // Ultimate

/** Passive aura (Muzikansen, Consultant). Continuously applies effect to entities in range. */
const Aura = defineComponent({
  effectId: u16,     // AuraEffectRegistry ID
  range: f32,        // Aura radius
  affectsAllies: u8, // 1 = buffs allies
  affectsEnemies: u8 // 1 = debuffs enemies
});

/** Temporary buff/debuff applied to an entity. */
const StatusEffect = defineComponent({
  effectId: u16,      // StatusEffectRegistry ID
  duration: f32,      // Remaining duration
  attackMod: f32,     // Multiplier (1.0 = normal)
  speedMod: f32,
  armorMod: f32,
  stunned: u8,        // 1 = cannot act
  silenced: u8        // 1 = cannot use abilities
});

// Entities can have multiple status effects via tag components:
const StatusEffect0 = defineComponent({ ...StatusEffect });
const StatusEffect1 = defineComponent({ ...StatusEffect });
const StatusEffect2 = defineComponent({ ...StatusEffect });
// Max 3 simultaneous status effects per entity.

// ============================================================
// AI COMPONENTS
// ============================================================

/**
 * Unit AI finite state machine.
 * state: 0=Idle, 1=Moving, 2=Attacking, 3=Gathering, 4=Returning,
 *        5=Building, 6=Fleeing, 7=Patrolling, 8=HoldPosition, 9=AttackMove,
 *        10=Dead, 11=GuardPosition
 */
const UnitAI = defineComponent({
  state: u8,
  previousState: u8,
  targetEid: u32,       // Current target entity
  aggroRange: f32,      // Auto-attack acquisition range
  leashRange: f32,      // Max chase distance before returning
  leashX: f32,          // Origin point for leash calculation
  leashZ: f32,
  guardX: f32,          // Guard/patrol position
  guardZ: f32,
  stuckTimer: f32       // Seconds without meaningful movement
});

// ============================================================
// RENDERING HINT COMPONENTS (ECS → Renderer bridge)
// ============================================================

/** Links entity to an InstancedMesh instance index. */
const RenderInstance = defineComponent({
  meshGroupId: u16,    // Which InstancedMesh group (faction + unitType combo)
  instanceIndex: u32   // Index within that InstancedMesh
});

/** LOD level. Updated by LODSystem based on camera distance. */
const LODLevel = defineComponent({
  level: u8   // 0=High, 1=Medium, 2=Low
});

/** Animation state for skinned mesh units. */
const AnimationState = defineComponent({
  clipId: u8,          // 0=idle, 1=walk, 2=attack, 3=death, 4=gather, 5=ability
  blendWeight: f32,    // Crossfade weight (0.0 to 1.0)
  timeScale: f32       // Playback speed multiplier
});

// ============================================================
// TAG COMPONENTS (zero-size markers)
// ============================================================

const IsUnit = defineComponent();
const IsBuilding = defineComponent();
const IsResource = defineComponent();
const IsProjectile = defineComponent();
const IsHero = defineComponent();
const IsDead = defineComponent();        // Marked for death animation + cleanup
const IsWorker = defineComponent();
const NeedsPathfinding = defineComponent(); // Dirty flag: request new path
```

### 1.4 Entity Archetypes

Entity creation uses predefined archetype templates that bundle the right components:

```typescript
// Archetype: Brabanders Carnavalvierder
function createCarnavalvierder(world: World, x: number, z: number): number {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Rotation, eid);
  addComponent(world, BoundingRadius, eid);
  addComponent(world, Health, eid);
  addComponent(world, Attack, eid);
  addComponent(world, Armor, eid);
  addComponent(world, Movement, eid);
  addComponent(world, Faction, eid);
  addComponent(world, UnitType, eid);
  addComponent(world, Selected, eid);
  addComponent(world, ControlGroup, eid);
  addComponent(world, Visibility, eid);
  addComponent(world, UnitAI, eid);
  addComponent(world, RenderInstance, eid);
  addComponent(world, LODLevel, eid);
  addComponent(world, AnimationState, eid);
  addComponent(world, Ability0, eid); // Polonaise
  addComponent(world, IsUnit, eid);

  // Set initial values from archetype data
  Position.x[eid] = x;
  Position.z[eid] = z;
  Position.y[eid] = getTerrainHeight(x, z);
  Health.current[eid] = 80;
  Health.max[eid] = 80;
  Attack.damage[eid] = 10;
  Attack.speed[eid] = 1.2;
  Attack.range[eid] = 1.5; // melee reach
  Attack.cooldown[eid] = 1.2;
  Attack.timer[eid] = 0;
  Attack.bonusVsLight[eid] = 1.5;  // Melee → Light +50%
  Attack.bonusVsMedium[eid] = 1.0;
  Attack.bonusVsHeavy[eid] = 1.0;
  Attack.bonusVsBuilding[eid] = 1.0;
  Armor.value[eid] = 1;
  Armor.type[eid] = 1; // Light
  Movement.speed[eid] = 5.5;
  Movement.hasTarget[eid] = 0;
  Faction.id[eid] = 0; // Brabanders
  UnitType.id[eid] = 1; // Infantry
  UnitType.subId[eid] = 1; // Carnavalvierder
  Selected.by[eid] = 255;
  Visibility.range[eid] = 8;
  UnitAI.state[eid] = 0; // Idle
  UnitAI.aggroRange[eid] = 6;
  UnitAI.leashRange[eid] = 15;
  BoundingRadius.radius[eid] = 0.5;

  return eid;
}
```

**Archetype data wordt opgeslagen in een registry (JSON/TS) zodat `createUnit(world, factionId, unitSubId, x, z)` generiek werkt voor alle 30+ unit types.**

### 1.5 Entity Pooling

```typescript
class EntityPool {
  private pools: Map<string, number[]> = new Map(); // archetype → recycled eids
  private readonly maxPoolSize = 64; // per archetype

  recycle(world: World, eid: number, archetype: string): void {
    // Remove from active queries by removing tag components
    removeComponent(world, IsUnit, eid);
    removeComponent(world, IsBuilding, eid);
    // Reset health to prevent dead-entity interactions
    Health.current[eid] = 0;
    // Stash eid
    const pool = this.pools.get(archetype) ?? [];
    if (pool.length < this.maxPoolSize) {
      pool.push(eid);
      this.pools.set(archetype, pool);
    } else {
      removeEntity(world, eid); // Pool full, actually remove
    }
  }

  acquire(world: World, archetype: string): number | null {
    const pool = this.pools.get(archetype);
    if (pool && pool.length > 0) {
      return pool.pop()!;
    }
    return null; // Caller must addEntity()
  }
}
```

### 1.6 System Execution Order (Per Frame)

Systems execute in a deterministic order. Each system is a `defineSystem()` call that iterates over a `defineQuery()` result.

```
Frame Start (requestAnimationFrame)
│
├── 1. InputSystem              [0.2ms]   Read mouse/keyboard → commands
├── 2. CommandSystem             [0.1ms]   Translate commands → ECS component writes
│
├── 3. AISystem                  [1.5ms]   Unit FSM transitions, auto-attack, gather logic
├── 4. StrategicAISystem         [0.5ms]   (1x/sec) Opponent build orders, attack decisions
├── 5. AbilitySystem             [0.3ms]   Cooldown ticks, ability activation/deactivation
├── 6. StatusEffectSystem        [0.2ms]   Tick durations, remove expired effects
├── 7. AuraSystem                [0.3ms]   Apply/remove aura effects based on proximity
│
├── 8. PathfindingSystem         [1.0ms]   Consume NeedsPathfinding, write Path (via Worker)
├── 9. SteeringSystem            [0.5ms]   Follow path waypoints → write Velocity
├── 10. FormationSystem          [0.2ms]   Offset velocity for formation slots
├── 11. MovementSystem           [0.3ms]   Integrate velocity → update Position, terrain snap
├── 12. CollisionSystem          [0.5ms]   Unit-unit soft separation (no overlap)
│
├── 13. CombatSystem             [0.5ms]   Attack timer tick, damage application, death marking
├── 14. ProjectileSystem         [0.3ms]   Move projectiles, impact detection, AoE damage
├── 15. HealSystem               [0.1ms]   Auto-heal logic for support units
│
├── 16. ProductionSystem         [0.2ms]   Building training progress, unit spawning
├── 17. ResourceSystem           [0.2ms]   Passive resource generation, gathering delivery
├── 18. GezelligheidsSystem      [0.3ms]   Brabanders proximity bonus calculation
├── 19. BureaucratieSystem       [0.1ms]   Randstad efficiency stacks, werkoverleg pause
│
├── 20. DeathSystem              [0.2ms]   Process IsDead entities, trigger death anim, pool after 3s
├── 21. CleanupSystem            [0.1ms]   Remove expired projectiles, effects, pooled entities
│
├── 22. VisibilitySystem         [0.8ms]   (5-10 fps) Update fog of war texture
├── 23. LODSystem                [0.1ms]   Update LOD levels based on camera distance
├── 24. RenderSyncSystem         [0.5ms]   ECS Position → InstancedMesh matrix updates
├── 25. AnimationSystem          [0.3ms]   Update animation mixer, crossfades
│
├── 26. CameraSystem             [0.1ms]   Update camera from input (pan/zoom/rotate)
├── 27. MinimapSystem            [0.2ms]   Update minimap canvas
├── 28. UISystem                 [0.3ms]   Update HTML HUD (health bars, selection panel, resources)
├── 29. AudioSystem              [0.2ms]   Trigger/stop sounds based on events
│
Frame End → three.js renderer.render(scene, camera)
```

**Totaal systeem budget: ~9.3ms, headroom tot 16.6ms (60fps).**

### 1.7 Query Patterns

```typescript
// Units that need pathfinding recalculation
const needsPathQuery = defineQuery([Position, Movement, NeedsPathfinding, IsUnit]);

// All living units of a specific faction (used by AI, Gezelligheid)
const livingUnitsQuery = defineQuery([Position, Health, Faction, UnitAI, IsUnit]);
// Filter in system: if (Faction.id[eid] === targetFaction && Health.current[eid] > 0)

// Selected units (for input handling)
const selectedQuery = defineQuery([Selected, Position, IsUnit]);
// Filter: Selected.by[eid] === localPlayerIndex

// Combat targets in range (spatial query, not pure ECS)
// Use grid-based spatial hash, then check:
const combatQuery = defineQuery([Position, Health, Attack, UnitAI, IsUnit]);

// Workers currently gathering
const gatheringQuery = defineQuery([Position, Gatherer, Movement, IsWorker]);

// Buildings under construction
const constructionQuery = defineQuery([Position, Building, Health, IsBuilding]);
// Filter: Building.complete[eid] === 0

// Active projectiles
const projectileQuery = defineQuery([Position, Velocity, Projectile, IsProjectile]);

// Entities with status effects (for rendering indicators)
const statusQuery = defineQuery([Position, StatusEffect0]);

// Hero units (for hero panel UI)
const heroQuery = defineQuery([Position, Health, IsHero, IsUnit]);

// Aura emitters
const auraQuery = defineQuery([Position, Aura, Faction, IsUnit]);
```

### 1.8 Spatial Hash Grid

Voor combat range checks, aura proximity, en Gezelligheid berekening:

```typescript
class SpatialHashGrid {
  private cellSize: number;
  private cells: Map<number, number[]>; // hash → entity IDs

  constructor(cellSize: number = 8) { // 8 world units per cell
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  private hash(cx: number, cz: number): number {
    return cx * 73856093 ^ cz * 19349663; // Spatial hash function
  }

  clear(): void {
    this.cells.clear();
  }

  insert(eid: number, x: number, z: number): void {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    const h = this.hash(cx, cz);
    const cell = this.cells.get(h) ?? [];
    cell.push(eid);
    this.cells.set(h, cell);
  }

  /** Query all entities within radius. Returns entity IDs. */
  queryRadius(x: number, z: number, radius: number): number[] {
    const results: number[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCz = Math.floor((z - radius) / this.cellSize);
    const maxCz = Math.floor((z + radius) / this.cellSize);
    const r2 = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const cell = this.cells.get(this.hash(cx, cz));
        if (!cell) continue;
        for (const eid of cell) {
          const dx = Position.x[eid] - x;
          const dz = Position.z[eid] - z;
          if (dx * dx + dz * dz <= r2) {
            results.push(eid);
          }
        }
      }
    }
    return results;
  }
}

// Rebuilt every frame in MovementSystem (after position updates)
const spatialGrid = new SpatialHashGrid(8);
```

---

## 2. Rendering Pipeline

### 2.1 Scene Graph Structure

```
THREE.Scene
├── AmbientLight (soft white, intensity 0.4)
├── DirectionalLight (sun, intensity 0.8, casts shadows)
│   └── DirectionalLightHelper (debug only)
├── TerrainGroup
│   ├── TerrainMesh (heightmap-displaced plane, multi-texture splat material)
│   └── WaterPlane (transparent, animated UV offset)
├── FogOfWarMesh (fullscreen quad above terrain, custom shader)
├── UnitMeshGroup
│   ├── InstancedMesh_Brabanders_Worker (max 30 instances)
│   ├── InstancedMesh_Brabanders_Infantry (max 40 instances)
│   ├── InstancedMesh_Brabanders_Ranged (max 30 instances)
│   ├── ... (per faction × per unit type = ~32 InstancedMesh groups)
│   └── SkinnedMesh pool for hero units (max 8, individually animated)
├── BuildingMeshGroup
│   ├── InstancedMesh_Brabanders_TownHall (max 2)
│   ├── InstancedMesh_Brabanders_Cafe (max 5)
│   ├── ... (per faction × per building type = ~40 InstancedMesh groups)
│   └── ConstructionGhost (semi-transparent placement preview)
├── ResourceMeshGroup
│   ├── InstancedMesh_GoldMine (max 10)
│   ├── InstancedMesh_Tree_Oak (max 40)
│   ├── InstancedMesh_Tree_Pine (max 40)
│   └── InstancedMesh_Tree_Birch (max 20)
├── ProjectileGroup
│   ├── InstancedMesh_Arrow (max 64)
│   ├── InstancedMesh_Bierpul (max 32)
│   └── InstancedMesh_Spreadsheet (max 32)
├── EffectsGroup
│   ├── ParticleSystem_Confetti
│   ├── ParticleSystem_VlaaiSplash
│   ├── ParticleSystem_SpreadsheetRain
│   ├── ParticleSystem_Dust (movement)
│   └── SelectionCircles (InstancedMesh_Ring, max 100)
├── UIOverlayGroup (screenspace)
│   ├── HealthBarSprites (billboarded quads, max 100)
│   └── DamageNumbers (floating text, pooled)
└── SkyboxMesh (large sphere/box with gradient or cubemap)
```

### 2.2 InstancedMesh Per Unit Type Per Faction

Elke combinatie van (faction, unitType) krijgt een eigen `InstancedMesh`. Dit minimaliseert draw calls terwijl elke unit type zijn eigen geometry/material behoudt.

```typescript
interface MeshGroup {
  id: number;
  mesh: THREE.InstancedMesh;
  factionId: number;
  unitTypeId: number;
  maxInstances: number;
  activeCount: number;
  // LOD variants
  lodMeshes: [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry]; // High, Med, Low
  lodDistances: [number, number, number]; // [0, 30, 60] world units from camera
}

class InstancedMeshManager {
  private groups: Map<number, MeshGroup> = new Map(); // meshGroupId → MeshGroup
  private freeIndices: Map<number, number[]> = new Map(); // meshGroupId → free instance indices

  /** Register a new mesh group. Called during asset loading. */
  registerGroup(
    id: number,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxInstances: number,
    lodGeometries: [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry]
  ): void { /* ... */ }

  /** Allocate an instance slot. Returns instance index. */
  allocate(meshGroupId: number): number { /* ... */ }

  /** Free an instance slot (on unit death after cleanup). */
  free(meshGroupId: number, instanceIndex: number): void { /* ... */ }

  /** Update transform matrix for an instance. Called by RenderSyncSystem. */
  updateTransform(meshGroupId: number, instanceIndex: number, matrix: THREE.Matrix4): void {
    const group = this.groups.get(meshGroupId)!;
    group.mesh.setMatrixAt(instanceIndex, matrix);
    group.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Update instance color (for faction tinting, damage flash). */
  updateColor(meshGroupId: number, instanceIndex: number, color: THREE.Color): void {
    const group = this.groups.get(meshGroupId)!;
    group.mesh.setColorAt(instanceIndex, color);
    group.mesh.instanceColor!.needsUpdate = true;
  }
}
```

### 2.3 LOD System (3 Levels)

```typescript
// LOD distances (world units from camera target)
const LOD_THRESHOLDS = {
  HIGH_TO_MED: 40,    // < 40 units: full detail
  MED_TO_LOW: 80,     // 40-80 units: reduced (50% triangles)
  LOW_TO_CULL: 150    // > 150 units: not rendered (beyond max zoom)
};

// Vertex budgets per LOD
// LOD 0 (High):  100-200 verts (units), 200-500 verts (buildings)
// LOD 1 (Medium): 40-80 verts (units), 80-200 verts (buildings)
// LOD 2 (Low):    12-24 verts (units = colored box), 30-60 verts (buildings)

// LODSystem runs every frame, updates LODLevel component
// When LOD changes, RenderSyncSystem swaps InstancedMesh group
```

### 2.4 Frustum Culling

Three.js InstancedMesh heeft native frustum culling per mesh, niet per instance. We moeten zelf per-instance culling doen voor grote groepen:

```typescript
// In RenderSyncSystem:
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();

function updateFrustum(camera: THREE.PerspectiveCamera): void {
  projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projScreenMatrix);
}

// Per instance: check bounding sphere against frustum
// If outside: set instance matrix scale to 0 (effectively hiding it)
// This avoids removing/re-adding instances which is expensive
```

### 2.5 Terrain Rendering

```typescript
// Heightmap: 256x256 grayscale PNG → Float32Array
// Terrain mesh: PlaneGeometry(256, 256, 255, 255) = 65K vertices
// Height displacement in vertex shader for GPU efficiency

// Multi-texture splat map:
// R channel = grass weight
// G channel = dirt weight
// B channel = stone weight
// A channel = sand weight

const terrainMaterial = new THREE.ShaderMaterial({
  uniforms: {
    heightMap: { value: heightTexture },        // R16 height data
    splatMap: { value: splatTexture },          // RGBA weight map
    grassTexture: { value: grassTex },          // Tiled 512x512
    dirtTexture: { value: dirtTex },
    stoneTexture: { value: stoneTex },
    sandTexture: { value: sandTex },
    textureScale: { value: 32.0 },              // UV tiling factor
    heightScale: { value: 15.0 },               // Max terrain height
    fogOfWarTexture: { value: null },           // Set by VisibilitySystem
  },
  vertexShader: `
    uniform sampler2D heightMap;
    uniform float heightScale;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vec3 pos = position;
      float h = texture2D(heightMap, uv).r * heightScale;
      pos.y = h;
      vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D splatMap;
    uniform sampler2D grassTexture, dirtTexture, stoneTexture, sandTexture;
    uniform float textureScale;
    uniform sampler2D fogOfWarTexture;
    varying vec2 vUv;

    void main() {
      vec4 splat = texture2D(splatMap, vUv);
      vec2 tiledUv = vUv * textureScale;

      vec3 grass = texture2D(grassTexture, tiledUv).rgb;
      vec3 dirt  = texture2D(dirtTexture, tiledUv).rgb;
      vec3 stone = texture2D(stoneTexture, tiledUv).rgb;
      vec3 sand  = texture2D(sandTexture, tiledUv).rgb;

      vec3 color = grass * splat.r + dirt * splat.g + stone * splat.b + sand * splat.a;

      // Fog of war darkening
      float fow = texture2D(fogOfWarTexture, vUv).r;
      color *= mix(0.15, 1.0, fow); // 0.15 = unexplored darkness

      gl_FragColor = vec4(color, 1.0);
    }
  `
});
```

### 2.6 Fog of War Rendering

```typescript
class FogOfWarRenderer {
  private canvas: HTMLCanvasElement;       // 256x256 offscreen canvas
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private exploredBuffer: Uint8Array;      // Persistent explored state
  private visibleBuffer: Uint8Array;       // Per-frame visible state

  constructor(mapSize: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = mapSize;
    this.canvas.height = mapSize;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.exploredBuffer = new Uint8Array(mapSize * mapSize);
    this.visibleBuffer = new Uint8Array(mapSize * mapSize);
  }

  /**
   * Update at 5-10 fps (not every frame).
   * Iterates all entities with Visibility component.
   * Stamps circles into visibleBuffer.
   * Merges into exploredBuffer.
   * Renders to canvas → texture.
   */
  update(visibleEntities: { x: number; z: number; range: number }[]): void {
    // Clear visible buffer
    this.visibleBuffer.fill(0);

    // Stamp visibility circles
    for (const entity of visibleEntities) {
      this.stampCircle(entity.x, entity.z, entity.range);
    }

    // Merge: explored = max(explored, visible)
    for (let i = 0; i < this.exploredBuffer.length; i++) {
      if (this.visibleBuffer[i] > 0) {
        this.exploredBuffer[i] = 255;
      }
    }

    // Render to canvas: black = unexplored, dark grey = explored, transparent = visible
    const imageData = this.ctx.createImageData(256, 256);
    for (let i = 0; i < this.exploredBuffer.length; i++) {
      const explored = this.exploredBuffer[i] > 0;
      const visible = this.visibleBuffer[i] > 0;
      const idx = i * 4;
      // R channel: 0 = unexplored, 0.4 = explored, 1.0 = visible
      imageData.data[idx] = visible ? 255 : (explored ? 100 : 0);
      imageData.data[idx + 1] = imageData.data[idx];
      imageData.data[idx + 2] = imageData.data[idx];
      imageData.data[idx + 3] = 255;
    }
    this.ctx.putImageData(imageData, 0, 0);
    this.texture.needsUpdate = true;
  }

  private stampCircle(cx: number, cz: number, radius: number): void {
    const r2 = radius * radius;
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(255, Math.ceil(cx + radius));
    const minZ = Math.max(0, Math.floor(cz - radius));
    const maxZ = Math.min(255, Math.ceil(cz + radius));
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        if ((x - cx) ** 2 + (z - cz) ** 2 <= r2) {
          this.visibleBuffer[z * 256 + x] = 255;
        }
      }
    }
  }

  getTexture(): THREE.CanvasTexture { return this.texture; }
}
```

### 2.7 Health Bar Rendering

Billboarded quads boven elke unit. Alleen gerendered voor units in viewport en met HP < max.

```typescript
// HealthBarSystem renders as InstancedMesh with custom shader:
// - Green quad (current HP proportion)
// - Red quad behind (missing HP)
// - Billboard constraint: always faces camera
// - Only visible when: HP < max OR unit is selected
// - Fade out at LOD 2 distance

// Implementation: single InstancedMesh with 2 instances per visible bar
// Max 100 health bars visible simultaneously (pool + priority by distance)
```

### 2.8 Selection Circle Rendering

```typescript
// Flat ring mesh (torus with very flat tube radius)
// Color: green = own unit, red = enemy, yellow = neutral
// Rendered as InstancedMesh (max 100 instances = max selection)
// Z-fighting prevention: render at y = terrain_height + 0.05
// Pulsing animation: scale oscillation sin(time * 3) * 0.05 + 1.0
```

### 2.9 Particle Systems

```typescript
interface ParticleSystemConfig {
  maxParticles: number;
  emitRate: number;
  lifetime: [number, number];     // min/max seconds
  velocity: THREE.Vector3;
  velocitySpread: THREE.Vector3;
  gravity: number;
  size: [number, number];         // start/end size
  color: [THREE.Color, THREE.Color]; // start/end color
  texture: THREE.Texture;
  blending: THREE.Blending;
}

// Predefined particle systems:
const PARTICLE_CONFIGS = {
  confetti: {
    maxParticles: 200,
    emitRate: 50,
    lifetime: [1.5, 3.0],
    velocity: new THREE.Vector3(0, 8, 0),
    velocitySpread: new THREE.Vector3(4, 2, 4),
    gravity: -9.8,
    size: [0.3, 0.1],
    color: [new THREE.Color(1, 0.8, 0), new THREE.Color(1, 0, 0.5)],
    blending: THREE.AdditiveBlending
  },
  vlaaiSplash: {
    maxParticles: 30,
    emitRate: 0, // burst only
    lifetime: [0.8, 1.5],
    velocity: new THREE.Vector3(0, 5, 0),
    velocitySpread: new THREE.Vector3(3, 1, 3),
    gravity: -15,
    size: [0.5, 0.2],
    color: [new THREE.Color(0.8, 0.2, 0.1), new THREE.Color(0.6, 0.1, 0.05)],
    blending: THREE.NormalBlending
  },
  spreadsheetRain: {
    maxParticles: 100,
    emitRate: 20,
    lifetime: [2.0, 4.0],
    velocity: new THREE.Vector3(0, -3, 0),
    velocitySpread: new THREE.Vector3(1, 0.5, 1),
    gravity: -2,
    size: [0.4, 0.4],
    color: [new THREE.Color(1, 1, 1), new THREE.Color(0.8, 0.8, 0.8)],
    blending: THREE.NormalBlending
  },
  dustTrail: {
    maxParticles: 50,
    emitRate: 10,
    lifetime: [0.5, 1.0],
    velocity: new THREE.Vector3(0, 1, 0),
    velocitySpread: new THREE.Vector3(0.5, 0.3, 0.5),
    gravity: 0,
    size: [0.2, 0.6],
    color: [new THREE.Color(0.6, 0.5, 0.3), new THREE.Color(0.6, 0.5, 0.3)],
    blending: THREE.NormalBlending
  }
};

// Implementation: Points geometry with custom shader for per-particle
// size, color, and rotation. GPU-driven update via attribute buffers.
```

### 2.10 WebGPU vs WebGL Detection

```typescript
async function initRenderer(canvas: HTMLCanvasElement): Promise<THREE.WebGLRenderer | THREE.WebGPURenderer> {
  // Check WebGPU support
  if ('gpu' in navigator) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const { WebGPURenderer } = await import('three/webgpu');
        const renderer = new WebGPURenderer({ canvas, antialias: true });
        await renderer.init();
        console.log('[Renderer] WebGPU initialized');
        return renderer;
      }
    } catch (e) {
      console.warn('[Renderer] WebGPU failed, falling back to WebGL2:', e);
    }
  }

  // Fallback: WebGL2
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  console.log('[Renderer] WebGL2 initialized');
  return renderer;
}
```

### 2.11 Shadow Strategy

```typescript
// Desktop (WebGL2/WebGPU): PCF soft shadows
// - Shadow map resolution: 2048x2048
// - Cascaded shadow maps: 2 cascades (near: 0-50 units, far: 50-150 units)
// - Shadow bias: 0.0001
// - Only units and buildings cast shadows (not props/trees for perf)

// Mobile / Low-end: Blob shadows
// - Pre-baked circular shadow texture (64x64 grayscale)
// - Rendered as flat quads below each unit
// - InstancedMesh for all blob shadows (same approach as selection circles)
// - No real-time shadow mapping

const qualityLevel = detectQualityLevel(); // 'high' | 'medium' | 'low'

if (qualityLevel === 'high') {
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
} else {
  renderer.shadowMap.enabled = false;
  // Use blob shadow InstancedMesh instead
}
```

---

## 3. Pathfinding Architecture

### 3.1 recast-navigation-js Integration

```typescript
import { init as initRecast, NavMesh, NavMeshQuery, Crowd, TileCache } from 'recast-navigation';
import { threeToSoloNavMesh, threeToTiledNavMesh } from '@recast-navigation/three';

// WASM module loaded once at startup
await initRecast();
```

### 3.2 NavMesh Generation

**Timing**: NavMesh generated at map load from terrain geometry + static obstacles.

```typescript
interface NavMeshConfig {
  // Agent parameters
  agentRadius: 0.5,          // Unit collision radius
  agentHeight: 2.0,          // Unit height
  agentMaxClimb: 0.8,        // Max step height (stairs/ramps)
  agentMaxSlope: 45,         // Max walkable slope in degrees

  // Voxelization
  cellSize: 0.3,             // XZ voxel size (smaller = more accurate, slower)
  cellHeight: 0.2,           // Y voxel size

  // Region
  regionMinSize: 8,          // Minimum region area
  regionMergeSize: 20,       // Merge regions smaller than this

  // Polygonization
  edgeMaxLen: 12,            // Max edge length
  edgeMaxError: 1.3,         // Max distance from contour to navmesh edge
  vertsPerPoly: 6,           // Max verts per polygon

  // Detail mesh
  detailSampleDist: 6,
  detailSampleMaxError: 1,

  // Tiled NavMesh (for TileCache)
  tileSize: 32               // Tile size in cells (must be power of 2)
}
```

**NavMesh bouw bij map load (~200-500ms voor 256x256 map):**

```typescript
async function buildNavMesh(terrainMesh: THREE.Mesh, staticObstacles: THREE.Mesh[]): Promise<void> {
  const meshes = [terrainMesh, ...staticObstacles];

  // Build tiled navmesh (required for TileCache dynamic obstacles)
  const { navMesh, tileCache } = threeToTiledNavMesh(meshes, {
    ...NavMeshConfig,
    // TileCache specific
    maxObstacles: 128,        // Max dynamic obstacles (buildings)
  });

  // Store globally
  gameState.navMesh = navMesh;
  gameState.tileCache = tileCache;
  gameState.navMeshQuery = new NavMeshQuery(navMesh);
}
```

### 3.3 TileCache for Dynamic Obstacles (Buildings)

Wanneer een speler een gebouw plaatst of een gebouw wordt vernietigd, moet de NavMesh lokaal geupdate worden. TileCache maakt dit incrementeel (geen volledige rebuild).

```typescript
class DynamicObstacleManager {
  private obstacles: Map<number, number> = new Map(); // entityId → obstacleRef

  /** Called when a building is placed. */
  addBuildingObstacle(eid: number, x: number, z: number, width: number, depth: number): void {
    const obstacleRef = gameState.tileCache.addBoxObstacle(
      { x, y: 0, z },         // Position
      { x: width / 2, y: 2, z: depth / 2 }, // Half-extents
      0                        // Y-rotation
    );
    this.obstacles.set(eid, obstacleRef);

    // Recompute affected tiles
    gameState.tileCache.update(gameState.navMesh);
  }

  /** Called when a building is destroyed. */
  removeBuildingObstacle(eid: number): void {
    const ref = this.obstacles.get(eid);
    if (ref !== undefined) {
      gameState.tileCache.removeObstacle(ref);
      gameState.tileCache.update(gameState.navMesh);
      this.obstacles.delete(eid);
    }
  }
}
```

### 3.4 Crowd Pathfinding vs Individual Pathfinding

**Crowd** (recast-navigation `Crowd`): gebruikt voor groepen van 5+ units die hetzelfde doel hebben. Automatische local avoidance, velocity-based steering, smoother group movement.

**Individual** (recast-navigation `NavMeshQuery.computePath()`): gebruikt voor enkele units, workers op gather routes, scouts.

```typescript
class PathfindingManager {
  private crowd: Crowd;
  private query: NavMeshQuery;
  private agentMap: Map<number, number> = new Map(); // entityId → crowdAgentIndex

  constructor(navMesh: NavMesh) {
    this.crowd = new Crowd(navMesh, {
      maxAgents: 256,         // Max simultaneous crowd agents
      maxAgentRadius: 0.6
    });
    this.query = new NavMeshQuery(navMesh);
  }

  /** Request path for a single unit (worker, scout). */
  requestIndividualPath(eid: number, startX: number, startZ: number, endX: number, endZ: number): Float32Array {
    const start = this.query.findClosestPoint({ x: startX, y: 0, z: startZ });
    const end = this.query.findClosestPoint({ x: endX, y: 0, z: endZ });
    const path = this.query.computePath(start, end);
    // path = Float32Array of [x,y,z, x,y,z, ...] waypoints
    return path;
  }

  /** Add unit to crowd for group movement. */
  addToCrowd(eid: number, x: number, z: number, speed: number): void {
    const agentIndex = this.crowd.addAgent({ x, y: 0, z }, {
      radius: 0.5,
      height: 2.0,
      maxAcceleration: speed * 4,
      maxSpeed: speed,
      collisionQueryRange: 2.5,
      pathOptimizationRange: 10,
      separationWeight: 2.0
    });
    this.agentMap.set(eid, agentIndex);
  }

  /** Set crowd agent target. */
  setCrowdTarget(eid: number, targetX: number, targetZ: number): void {
    const agentIndex = this.agentMap.get(eid);
    if (agentIndex === undefined) return;
    const nearest = this.query.findClosestPoint({ x: targetX, y: 0, z: targetZ });
    this.crowd.requestMoveTarget(agentIndex, nearest);
  }

  /** Update crowd simulation. Called once per frame. */
  updateCrowd(dt: number): void {
    this.crowd.update(dt);
  }

  /** Read back crowd agent positions → write to ECS Position components. */
  syncPositions(): void {
    for (const [eid, agentIndex] of this.agentMap) {
      const pos = this.crowd.getAgentPosition(agentIndex);
      Position.x[eid] = pos.x;
      Position.z[eid] = pos.z;
      // Y from terrain
      Position.y[eid] = getTerrainHeight(pos.x, pos.z);
    }
  }

  removeFromCrowd(eid: number): void {
    const agentIndex = this.agentMap.get(eid);
    if (agentIndex !== undefined) {
      this.crowd.removeAgent(agentIndex);
      this.agentMap.delete(eid);
    }
  }
}
```

### 3.5 Web Worker for Pathfinding

Pathfinding berekeningen draaien off-main-thread om frame drops te voorkomen.

```typescript
// pathfinding.worker.ts
import { init, NavMesh, NavMeshQuery } from 'recast-navigation';

let navMeshQuery: NavMeshQuery;

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      await init();
      const navMesh = new NavMesh();
      navMesh.fromBinary(data.navMeshBinary); // Serialized navmesh
      navMeshQuery = new NavMeshQuery(navMesh);
      self.postMessage({ type: 'ready' });
      break;

    case 'findPath':
      const { requestId, startX, startZ, endX, endZ } = data;
      const start = navMeshQuery.findClosestPoint({ x: startX, y: 0, z: startZ });
      const end = navMeshQuery.findClosestPoint({ x: endX, y: 0, z: endZ });
      const path = navMeshQuery.computePath(start, end);
      self.postMessage({ type: 'pathResult', requestId, path }, [path.buffer]);
      break;
  }
};

// Main thread interface:
class PathfindingWorkerProxy {
  private worker: Worker;
  private pendingRequests: Map<number, (path: Float32Array) => void> = new Map();
  private nextRequestId = 0;

  constructor() {
    this.worker = new Worker(new URL('./pathfinding.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e) => this.handleMessage(e);
  }

  async init(navMeshBinary: ArrayBuffer): Promise<void> {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => {
        if (e.data.type === 'ready') resolve();
      };
      this.worker.postMessage({ type: 'init', data: { navMeshBinary } }, [navMeshBinary]);
    });
  }

  findPath(startX: number, startZ: number, endX: number, endZ: number): Promise<Float32Array> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      this.pendingRequests.set(requestId, resolve);
      this.worker.postMessage({ type: 'findPath', data: { requestId, startX, startZ, endX, endZ } });
    });
  }

  private handleMessage(e: MessageEvent): void {
    if (e.data.type === 'pathResult') {
      const resolve = this.pendingRequests.get(e.data.requestId);
      if (resolve) {
        resolve(e.data.path);
        this.pendingRequests.delete(e.data.requestId);
      }
    }
  }
}
```

### 3.6 Formation Movement

Wanneer meerdere units geselecteerd zijn en een move command krijgen:

```typescript
enum FormationType {
  BOX = 0,        // Default: vierkant grid
  LINE = 1,       // Horizontale lijn (aanvalsformatie)
  COLUMN = 2,     // Verticale lijn (mars formatie)
  WEDGE = 3       // V-vorm (charge)
}

class FormationManager {
  /**
   * Calculate formation offsets for N units moving to target.
   * Returns offset positions relative to formation center.
   */
  calculateSlots(
    unitCount: number,
    formation: FormationType,
    spacing: number = 2.0 // World units between units
  ): Array<{ offsetX: number; offsetZ: number }> {
    const slots: Array<{ offsetX: number; offsetZ: number }> = [];

    switch (formation) {
      case FormationType.BOX: {
        const cols = Math.ceil(Math.sqrt(unitCount));
        const rows = Math.ceil(unitCount / cols);
        for (let i = 0; i < unitCount; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          slots.push({
            offsetX: (col - (cols - 1) / 2) * spacing,
            offsetZ: (row - (rows - 1) / 2) * spacing
          });
        }
        break;
      }
      case FormationType.LINE: {
        for (let i = 0; i < unitCount; i++) {
          slots.push({
            offsetX: (i - (unitCount - 1) / 2) * spacing,
            offsetZ: 0
          });
        }
        break;
      }
      // ... WEDGE, COLUMN implementations
    }

    return slots;
  }

  /**
   * Assign units to closest formation slot (Hungarian algorithm simplified).
   * Melee units in front, ranged in back, heroes centered.
   */
  assignSlots(
    units: number[], // entity IDs
    slots: Array<{ offsetX: number; offsetZ: number }>,
    targetX: number,
    targetZ: number,
    facingAngle: number
  ): void {
    // Sort units: melee first, then ranged, heroes last
    // Simple greedy assignment: each unit → closest unassigned slot
    // Write to FormationSlot component
  }
}
```

### 3.7 Path Smoothing (String Pulling)

recast-navigation's `computePath()` returns waypoints on navmesh polygon edges. String pulling (Funnel Algorithm) is built into recast. Additional smoothing:

```typescript
// Post-processing: remove unnecessary waypoints
function smoothPath(path: Float32Array): Float32Array {
  // Simple line-of-sight optimization:
  // For each waypoint, check if direct line-of-sight exists to waypoint+2
  // If yes, remove waypoint+1
  // Repeat until no more removable waypoints
  // Uses navmesh raycast for line-of-sight check
}
```

### 3.8 Stuck Detection and Recovery

```typescript
// In AISystem, per-entity check:
const STUCK_THRESHOLD = 2.0;  // Seconds without meaningful movement
const STUCK_DISTANCE = 0.5;   // Minimum distance to count as "moving"

function checkStuck(eid: number, dt: number): boolean {
  if (Movement.hasTarget[eid] === 0) return false;

  // Compare current position to last known position
  const dx = Position.x[eid] - lastPositions.x[eid];
  const dz = Position.z[eid] - lastPositions.z[eid];
  const distMoved = Math.sqrt(dx * dx + dz * dz);

  if (distMoved < STUCK_DISTANCE * dt) {
    UnitAI.stuckTimer[eid] += dt;
  } else {
    UnitAI.stuckTimer[eid] = 0;
  }

  if (UnitAI.stuckTimer[eid] > STUCK_THRESHOLD) {
    // Recovery strategy:
    // 1. Request new path to same target
    // 2. If still stuck after 2nd path: add random offset to target (-3 to +3 units)
    // 3. If still stuck: teleport to nearest valid navmesh point (last resort, debug only)
    UnitAI.stuckTimer[eid] = 0;
    addComponent(world, NeedsPathfinding, eid); // Re-request path
    return true;
  }
  return false;
}
```

### 3.9 Bridge/Ramp Handling

Bridges and ramps are part of the terrain geometry used for NavMesh generation. The NavMesh configuration's `agentMaxClimb` (0.8) and `agentMaxSlope` (45 degrees) ensure correct navigation:

- **Bridges**: Modeled as flat geometry spanning water polygons. NavMesh generates walkable surface on bridge, unwalkable on water.
- **Ramps/hills**: Height differences < agentMaxClimb are seamless. Slopes > agentMaxSlope auto-excluded from NavMesh.
- **Chokepoints**: Bridge width determines NavMesh polygon width, naturally limiting unit throughput.

---

## 4. AI Architecture

### 4.1 Unit AI (Finite State Machine)

```
                              ┌──────────────────────────────────┐
                              │                                  │
                              ▼                                  │
         ┌──────┐   move cmd  ┌────────┐   arrived   ┌──────┐   │
    ────►│ IDLE │───────────►│ MOVING │──────────►│ IDLE │   │
         └──┬───┘            └───┬────┘            └──────┘   │
            │                    │                             │
            │ enemy in aggro     │ enemy in aggro              │
            │ range              │ range (attack-move)         │
            ▼                    ▼                             │
      ┌───────────┐         ┌───────────┐                     │
      │ ATTACKING │◄────────│ATTACK_MOVE│                     │
      └───┬──┬────┘         └───────────┘                     │
          │  │                                                │
          │  │ target dead                                    │
          │  └─────────────────────────────────────────────────┘
          │
          │ target out of leash range
          ▼
      ┌────────────┐   arrived at leash origin
      │  LEASHING  │──────────────────────────────► IDLE
      └────────────┘

     ┌──────────────────── WORKER STATES ────────────────────┐
     │                                                        │
     │  gather cmd    ┌───────────┐   at resource  ┌─────────┐│
     │  ──────────►  │MOVE_TO_RES│──────────────►│GATHERING││
     │               └───────────┘                └───┬─────┘│
     │                                                │      │
     │               ┌───────────┐   full inventory   │      │
     │  at town hall │ RETURNING │◄────────────────────┘      │
     │  ──────────►  └─────┬─────┘                           │
     │                     │                                  │
     │    deposit + auto-return to same resource              │
     │                     └──────────────────► MOVE_TO_RES   │
     └────────────────────────────────────────────────────────┘

     ┌──────────── BUILDER STATES ──────────────┐
     │                                           │
     │  build cmd   ┌──────────────┐  arrived    │
     │  ─────────► │MOVE_TO_BUILD │────────────►│
     │              └──────────────┘             │
     │                                           │
     │              ┌──────────┐  complete       │
     │              │ BUILDING │────────────► IDLE│
     │              └──────────┘                 │
     └───────────────────────────────────────────┘

     SPECIAL STATES:
     - HOLD_POSITION: Attacks enemies in range, does not move
     - GUARDING: Moves to guard point, attacks nearby enemies, returns to guard point
     - PATROLLING: Moves between 2+ waypoints, attacks enemies in aggro range, resumes patrol
     - DEAD: Play death animation, entity pooled after 3 seconds
     - FLEEING: Move away from threat (low HP workers)
```

### 4.2 Attack-Move Logic

```typescript
function attackMoveUpdate(eid: number, dt: number): void {
  // 1. Check for enemies within aggro range
  const nearbyEnemies = spatialGrid.queryRadius(
    Position.x[eid], Position.z[eid], UnitAI.aggroRange[eid]
  ).filter(target =>
    Faction.id[target] !== Faction.id[eid] &&
    Health.current[target] > 0 &&
    isFogVisible(target) // Don't attack invisible units
  );

  if (nearbyEnemies.length > 0) {
    // 2. Select target: closest enemy (can be customized: lowest HP, highest threat)
    const target = selectTarget(eid, nearbyEnemies);
    UnitAI.targetEid[eid] = target;
    UnitAI.state[eid] = AIState.ATTACKING;
  } else {
    // 3. Continue moving to destination
    if (Movement.hasTarget[eid] === 1) {
      // Still moving
    } else {
      // Arrived at destination, switch to IDLE (but retain attack-move aggro range)
      UnitAI.state[eid] = AIState.IDLE;
    }
  }
}
```

### 4.3 Auto-Attack (Aggro) and Leash

```typescript
// Aggro ranges (in world units):
// Worker:    3 (only attack very close enemies)
// Infantry:  6
// Ranged:    8 (= attack range)
// Heavy:     5
// Hero:      8
// Siege:     4 (focus on buildings)
// Support:   0 (never auto-attack, only auto-heal)

// Leash range: 15 units from origin (where the attack started or last move command position)
// After exceeding leash range: unit returns to leash origin and stops

// Target priority system (descending):
// 1. Units attacking the player's units (retaliation)
// 2. Closest unit within attack range
// 3. Closest unit within aggro range
// 4. Buildings (only if idle and no units nearby)
```

### 4.4 Gather-Return-Gather Loop

```typescript
function gatherUpdate(eid: number, dt: number): void {
  switch (Gatherer.state[eid]) {
    case GatherState.MOVING_TO_RESOURCE: {
      const targetEid = Gatherer.targetEid[eid];
      if (!hasComponent(world, Resource, targetEid) || Resource.amount[targetEid] <= 0) {
        // Resource depleted, find nearest same-type resource
        const nearest = findNearestResource(Position.x[eid], Position.z[eid], Gatherer.resourceType[eid]);
        if (nearest !== -1) {
          Gatherer.targetEid[eid] = nearest;
          addComponent(world, NeedsPathfinding, eid);
        } else {
          Gatherer.state[eid] = GatherState.IDLE;
        }
        return;
      }
      // Check if arrived at resource
      if (distanceTo(eid, targetEid) < 1.5) {
        Gatherer.state[eid] = GatherState.GATHERING;
        Movement.hasTarget[eid] = 0; // Stop moving
      }
      break;
    }

    case GatherState.GATHERING: {
      // Harvest rate: 1 unit per 0.5 seconds (for gold), 1 per 0.8s (for lumber)
      const rate = Gatherer.resourceType[eid] === 0 ? 2.0 : 1.25; // units/sec
      const harvested = Math.min(
        rate * dt,
        Gatherer.carryCapacity[eid] - Gatherer.carrying[eid],
        Resource.amount[Gatherer.targetEid[eid]]
      );
      Gatherer.carrying[eid] += harvested;
      Resource.amount[Gatherer.targetEid[eid]] -= harvested;

      // Full inventory → return
      if (Gatherer.carrying[eid] >= Gatherer.carryCapacity[eid]) {
        Gatherer.state[eid] = GatherState.RETURNING;
        // Set move target to nearest Town Hall
        const townHall = findNearestTownHall(Position.x[eid], Position.z[eid], Faction.id[eid]);
        Gatherer.returnEid[eid] = townHall;
        Movement.targetX[eid] = Position.x[townHall];
        Movement.targetZ[eid] = Position.z[townHall];
        Movement.hasTarget[eid] = 1;
        addComponent(world, NeedsPathfinding, eid);
      }
      break;
    }

    case GatherState.RETURNING: {
      if (distanceTo(eid, Gatherer.returnEid[eid]) < 2.0) {
        // Deposit resources
        playerResources[Faction.id[eid]][Gatherer.resourceType[eid]] += Gatherer.carrying[eid];
        Gatherer.carrying[eid] = 0;
        // Auto-return to same resource
        Gatherer.state[eid] = GatherState.MOVING_TO_RESOURCE;
        Movement.targetX[eid] = Position.x[Gatherer.targetEid[eid]];
        Movement.targetZ[eid] = Position.z[Gatherer.targetEid[eid]];
        Movement.hasTarget[eid] = 1;
        addComponent(world, NeedsPathfinding, eid);
      }
      break;
    }
  }
}
```

### 4.5 Builder AI (Queue Management)

```typescript
// Workers can be assigned a build queue:
// Right-click + Shift on building ghost → adds to queue
// Worker completes building 1, auto-moves to building 2, etc.

interface BuildQueue {
  items: Array<{
    buildingType: number;
    x: number;
    z: number;
  }>;
}

// Build progress:
// Worker must stand adjacent to building ghost
// Progress increases based on: 1.0 / buildTime per second (1 worker)
// Multiple workers on same building: diminishing returns
//   1 worker: 100% speed
//   2 workers: 170% speed
//   3 workers: 220% speed
//   4+ workers: no additional benefit
```

### 4.6 Strategic AI (Opponent AI)

#### Decision-Making Architecture

```typescript
class StrategicAI {
  private faction: number;
  private difficulty: Difficulty;
  private updateInterval = 1.0; // Seconds between decisions
  private timer = 0;
  private buildOrderIndex = 0;
  private currentPhase: 'opening' | 'midgame' | 'lategame' = 'opening';

  update(dt: number, gameState: GameState): void {
    this.timer += dt;
    if (this.timer < this.updateInterval) return;
    this.timer = 0;

    // Phase detection
    this.currentPhase = this.detectPhase(gameState);

    // Priority-based decision tree
    const decisions = [
      this.shouldBuildWorkers(gameState),
      this.shouldBuildSupply(gameState),
      this.shouldBuildArmy(gameState),
      this.shouldExpand(gameState),
      this.shouldAttack(gameState),
      this.shouldResearch(gameState),
      this.shouldDefend(gameState),
    ];

    // Sort by priority, execute top 3
    decisions.sort((a, b) => b.priority - a.priority);
    for (let i = 0; i < Math.min(3, decisions.length); i++) {
      if (decisions[i].priority > 0) {
        decisions[i].execute();
      }
    }
  }

  private detectPhase(gs: GameState): 'opening' | 'midgame' | 'lategame' {
    const time = gs.elapsedTime;
    if (time < 180) return 'opening';    // < 3 min
    if (time < 600) return 'midgame';    // 3-10 min
    return 'lategame';                    // > 10 min
  }
}
```

#### Build Order Scripting System

```typescript
interface BuildOrderStep {
  type: 'train' | 'build' | 'research' | 'wait';
  target: string;         // Unit/building/tech name
  count?: number;         // How many
  condition?: () => boolean; // Optional condition
  priority: number;       // 1-10, higher = more urgent
}

// Example: Brabanders Rush Build Order
const BRABANDERS_RUSH: BuildOrderStep[] = [
  { type: 'train', target: 'worker', count: 4, priority: 10 },    // Train 4 extra workers
  { type: 'build', target: 'cafe', count: 1, priority: 9 },       // Build Barracks
  { type: 'train', target: 'worker', count: 2, priority: 8 },     // 2 more workers
  { type: 'build', target: 'boerenhoeve', count: 1, priority: 7 },// Housing
  { type: 'train', target: 'carnavalvierder', count: 5, priority: 9 }, // 5 infantry
  { type: 'train', target: 'kansen', count: 3, priority: 8 },     // 3 ranged
  { type: 'wait', target: '', condition: () => armySize >= 8, priority: 0 }, // Wait for army
  // After this point, switch to adaptive decision tree
];

// Build order variants per faction:
// - BRABANDERS_RUSH: Fast infantry push
// - BRABANDERS_DEATHBALL: Slow economy → massive Gezelligheid ball
// - RANDSTAD_TURTLE: Economy focus → late-game power
// - RANDSTAD_CONSULTANT: Early Consultant harassment
// - LIMBURG_TUNNEL: Fast tunnel network → guerrilla
// - BELGEN_BOOM: Economic boom → diplomatie
```

#### Threat Map Generation

```typescript
class ThreatMap {
  private grid: Float32Array;  // 32x32 grid (each cell = 8x8 world units)
  private gridSize = 32;

  /** Rebuild every 2 seconds. */
  update(enemyUnits: number[]): void {
    this.grid.fill(0);

    for (const eid of enemyUnits) {
      const cx = Math.floor(Position.x[eid] / 8);
      const cz = Math.floor(Position.z[eid] / 8);
      if (cx < 0 || cx >= this.gridSize || cz < 0 || cz >= this.gridSize) continue;

      // Threat value = DPS of unit
      const dps = Attack.damage[eid] / Attack.speed[eid];
      const idx = cz * this.gridSize + cx;
      this.grid[idx] += dps;

      // Spread threat to adjacent cells (1-cell radius, half value)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dz === 0) continue;
          const nx = cx + dx;
          const nz = cz + dz;
          if (nx >= 0 && nx < this.gridSize && nz >= 0 && nz < this.gridSize) {
            this.grid[nz * this.gridSize + nx] += dps * 0.5;
          }
        }
      }
    }
  }

  /** Get threat level at world position. */
  getThreat(worldX: number, worldZ: number): number {
    const cx = Math.floor(worldX / 8);
    const cz = Math.floor(worldZ / 8);
    if (cx < 0 || cx >= this.gridSize || cz < 0 || cz >= this.gridSize) return 0;
    return this.grid[cz * this.gridSize + cx];
  }

  /** Find safest expansion location. */
  findSafestExpansion(goldMines: number[]): number {
    let bestEid = -1;
    let lowestThreat = Infinity;
    for (const eid of goldMines) {
      const threat = this.getThreat(Position.x[eid], Position.z[eid]);
      if (threat < lowestThreat) {
        lowestThreat = threat;
        bestEid = eid;
      }
    }
    return bestEid;
  }
}
```

#### Army Composition Decision Tree

```typescript
function decideArmyComposition(
  myFaction: number,
  enemyComposition: Map<string, number>, // unitType → count
  phase: 'opening' | 'midgame' | 'lategame'
): Map<string, number> {
  const desired = new Map<string, number>();

  // Counter-unit logic
  const enemyMelee = (enemyComposition.get('infantry') ?? 0) + (enemyComposition.get('heavy') ?? 0);
  const enemyRanged = enemyComposition.get('ranged') ?? 0;
  const enemySiege = enemyComposition.get('siege') ?? 0;

  if (enemyMelee > enemyRanged * 1.5) {
    // Enemy is melee-heavy → build ranged
    desired.set('ranged', Math.ceil(enemyMelee * 0.6));
    desired.set('infantry', Math.ceil(enemyMelee * 0.2));
  } else if (enemyRanged > enemyMelee * 1.5) {
    // Enemy is ranged-heavy → build heavy/cavalry
    desired.set('heavy', Math.ceil(enemyRanged * 0.5));
    desired.set('infantry', Math.ceil(enemyRanged * 0.3));
  } else {
    // Balanced → mixed composition
    desired.set('infantry', 8);
    desired.set('ranged', 5);
    desired.set('heavy', 3);
  }

  // Always include support in midgame+
  if (phase !== 'opening') {
    desired.set('support', 2);
  }

  // Late game: add siege
  if (phase === 'lategame') {
    desired.set('siege', 2);
  }

  return desired;
}
```

#### Difficulty Modifier System

```typescript
enum Difficulty {
  EASY = 0,
  MEDIUM = 1,
  HARD = 2,
  BRUTAL = 3
}

interface DifficultyModifiers {
  resourceMultiplier: number;       // AI resource gathering bonus
  buildSpeedMultiplier: number;     // AI build time reduction
  damageDealtMultiplier: number;    // AI unit damage bonus
  damageTakenMultiplier: number;    // Damage AI units take
  decisionSpeed: number;            // Seconds between AI decisions
  scouting: boolean;                // Does AI scout actively?
  microManagement: boolean;         // Does AI retreat injured units?
  techRush: boolean;                // Does AI rush to higher tiers?
  aggressionLevel: number;          // 0.0 (passive) to 1.0 (hyper-aggressive)
}

const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyModifiers> = {
  [Difficulty.EASY]: {
    resourceMultiplier: 0.8,
    buildSpeedMultiplier: 0.8,
    damageDealtMultiplier: 0.8,
    damageTakenMultiplier: 1.2,
    decisionSpeed: 2.0,
    scouting: false,
    microManagement: false,
    techRush: false,
    aggressionLevel: 0.3
  },
  [Difficulty.MEDIUM]: {
    resourceMultiplier: 1.0,
    buildSpeedMultiplier: 1.0,
    damageDealtMultiplier: 1.0,
    damageTakenMultiplier: 1.0,
    decisionSpeed: 1.0,
    scouting: true,
    microManagement: false,
    techRush: false,
    aggressionLevel: 0.5
  },
  [Difficulty.HARD]: {
    resourceMultiplier: 1.2,
    buildSpeedMultiplier: 1.15,
    damageDealtMultiplier: 1.1,
    damageTakenMultiplier: 0.9,
    decisionSpeed: 0.75,
    scouting: true,
    microManagement: true,
    techRush: true,
    aggressionLevel: 0.7
  },
  [Difficulty.BRUTAL]: {
    resourceMultiplier: 1.5,
    buildSpeedMultiplier: 1.3,
    damageDealtMultiplier: 1.2,
    damageTakenMultiplier: 0.8,
    decisionSpeed: 0.5,
    scouting: true,
    microManagement: true,
    techRush: true,
    aggressionLevel: 0.9
  }
};
```

---

## 5. Save/Load Systeem

### 5.1 What Gets Saved

```typescript
interface SaveFile {
  // Metadata
  version: string;            // Game version (for compatibility)
  timestamp: number;          // Unix timestamp
  saveSlot: number;           // 0-9
  mapName: string;
  difficulty: Difficulty;
  elapsedTime: number;        // Game time in seconds
  factionId: number;          // Player's faction

  // Game state
  entities: SavedEntity[];    // All living entities
  resources: Record<number, { primary: number; secondary: number; tertiary: number }>; // Per faction
  techTree: Record<number, number[]>;  // Faction → researched tech IDs
  fogOfWar: string;           // Base64-encoded explored buffer (Uint8Array → base64)

  // Camera
  camera: { x: number; y: number; z: number; targetX: number; targetZ: number; zoom: number };

  // AI state
  strategicAI: {
    phase: string;
    buildOrderIndex: number;
    efficiencyStacks: number;   // Randstad-specific
    gezelligheid: number;       // Brabanders-specific
    tunnelConnections: number[];// Limburg-specific
  };

  // Production queues
  productionQueues: Array<{
    buildingEid: number;
    queue: number[];
    currentProgress: number;
  }>;
}

interface SavedEntity {
  eid: number;
  archetype: string;           // e.g., "brabanders_carnavalvierder"
  position: [number, number, number];
  health: [number, number];    // [current, max]
  factionId: number;
  aiState: number;
  aiTarget: number;
  // Only include non-default component values (delta compression)
  gathering?: { carrying: number; resourceType: number; state: number };
  building?: { progress: number; complete: number };
  abilities?: Array<{ id: number; timer: number }>;
  statusEffects?: Array<{ effectId: number; duration: number }>;
}
```

### 5.2 Storage Format & Strategy

```typescript
// Format: JSON (human-readable, debuggable, reasonable size for RTS state)
// Compression: LZ-string for IndexedDB storage (50-70% size reduction)
// Average save size: ~50-200KB uncompressed, ~20-80KB compressed

import LZString from 'lz-string';

class SaveManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'reign-of-brabant-saves';
  private readonly STORE_NAME = 'saves';
  private readonly MAX_SLOTS = 10;
  private readonly AUTO_SAVE_INTERVAL = 120; // seconds
  private autoSaveTimer = 0;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'saveSlot' });
        }
      };
      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async save(slot: number, gameState: GameState): Promise<void> {
    const saveFile = this.serializeGameState(gameState);
    saveFile.saveSlot = slot;

    const compressed = LZString.compressToUTF16(JSON.stringify(saveFile));

    const tx = this.db!.transaction(this.STORE_NAME, 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    store.put({ saveSlot: slot, data: compressed, timestamp: Date.now(), version: saveFile.version });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async load(slot: number): Promise<SaveFile | null> {
    const tx = this.db!.transaction(this.STORE_NAME, 'readonly');
    const store = tx.objectStore(this.STORE_NAME);
    const request = store.get(slot);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (!request.result) { resolve(null); return; }
        const decompressed = LZString.decompressFromUTF16(request.result.data);
        const saveFile = JSON.parse(decompressed!) as SaveFile;

        // Version compatibility check
        if (!this.isCompatible(saveFile.version)) {
          console.warn(`Save file version ${saveFile.version} may be incompatible`);
          // Attempt migration
          this.migrateSave(saveFile);
        }

        resolve(saveFile);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Auto-save check (called from game loop). */
  tickAutoSave(dt: number, gameState: GameState): void {
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= this.AUTO_SAVE_INTERVAL) {
      this.autoSaveTimer = 0;
      this.save(0, gameState); // Slot 0 = auto-save
    }
  }

  /** Version compatibility: saves from same MAJOR version are compatible. */
  private isCompatible(saveVersion: string): boolean {
    const saveMajor = parseInt(saveVersion.split('.')[0]);
    const currentMajor = parseInt(GAME_VERSION.split('.')[0]);
    return saveMajor === currentMajor;
  }

  /** Migrate save from older minor versions. */
  private migrateSave(save: SaveFile): void {
    // Example: v0.1 → v0.2 added tertiary resources
    // If save doesn't have tertiary, initialize to 0
    // Each version bump adds a migration step
  }

  private serializeGameState(gs: GameState): SaveFile {
    // Iterate all entities, serialize non-default component values
    // Skip: projectiles, particles, temporary effects (reconstructed on load)
    // Include: units, buildings, resource nodes, gatherer states
    // ...
  }
}
```

### 5.3 Campaign Progress Save

```typescript
// Campaign progress is separate from game saves.
// Stored in localStorage (small, always available).

interface CampaignProgress {
  currentMission: number;         // 0-11 for Brabanders campaign
  completedMissions: number[];    // Completed mission indices
  bestTimes: Record<number, number>; // Mission → best completion time
  difficulty: Difficulty;
  unlockedFactions: number[];     // [0] = Brabanders (always), [2] = Limburgers (v1.0)
}

// localStorage key: 'rob-campaign-progress'
// Settings separate key: 'rob-settings'
```

### 5.4 Settings Save

```typescript
interface GameSettings {
  // Graphics
  quality: 'low' | 'medium' | 'high' | 'auto';
  shadows: boolean;
  particles: boolean;
  antialiasing: boolean;
  fpsTarget: 30 | 60;

  // Audio
  masterVolume: number;    // 0.0 - 1.0
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;

  // Controls
  edgeScrollSpeed: number; // 1-10
  edgeScrollEnabled: boolean;
  keyboardScrollSpeed: number;
  cameraRotationEnabled: boolean;

  // Gameplay
  showHealthBarsAlways: boolean;
  showDamageNumbers: boolean;
  confirmAttackOwn: boolean; // Confirm before attacking own units/buildings

  // Accessibility
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  uiScale: number;          // 0.8 - 1.5
  subtitles: boolean;
}

// Stored in localStorage: 'rob-settings'
// Loaded on game start, never lost on save file deletion
```

### 5.5 Multiplayer Replay Recording

```typescript
// For future multiplayer: deterministic replay via command log.
// Every player command is timestamped and logged.
// Replay = initial game state + ordered command list.
// This enables replay viewing AND server-side validation.

interface ReplayCommand {
  tick: number;           // Game tick (deterministic frame counter)
  playerId: number;
  type: 'move' | 'attack' | 'build' | 'train' | 'ability' | 'research' | 'rally' | 'stop' | 'hold';
  entityIds: number[];    // Selected entities
  targetX?: number;
  targetZ?: number;
  targetEid?: number;
  abilityId?: number;
  buildingType?: number;
  unitType?: number;
}

// Replay file: JSON array of ReplayCommands
// Compressed with LZ-string
// Stored in IndexedDB alongside saves
```

---

## 6. Error Handling & Recovery

### 6.1 Global Error Boundary

```typescript
class GameErrorBoundary {
  private errorCount = 0;
  private readonly MAX_ERRORS = 10;        // Auto-pause after 10 errors
  private readonly ERROR_WINDOW = 60_000;  // Reset counter after 60s without errors
  private lastErrorTime = 0;

  init(): void {
    window.addEventListener('error', (e) => this.handleError(e.error, e.filename, e.lineno));
    window.addEventListener('unhandledrejection', (e) => this.handleError(e.reason));
  }

  private handleError(error: Error | any, file?: string, line?: number): void {
    const now = Date.now();
    if (now - this.lastErrorTime > this.ERROR_WINDOW) {
      this.errorCount = 0;
    }
    this.lastErrorTime = now;
    this.errorCount++;

    console.error(`[GameError #${this.errorCount}]`, error, file, line);

    // Report to analytics (if available)
    this.reportError(error);

    if (this.errorCount >= this.MAX_ERRORS) {
      // Too many errors → pause game, show error dialog
      gameState.gameState = 'paused';
      showErrorDialog(
        'Er is een probleem opgetreden. Het spel is gepauzeerd.',
        'Je kunt proberen door te spelen of het spel opnieuw te laden.',
        [
          { label: 'Doorgaan', action: () => { gameState.gameState = 'playing'; this.errorCount = 0; } },
          { label: 'Auto-save laden', action: () => loadAutoSave() },
          { label: 'Herladen', action: () => window.location.reload() }
        ]
      );
    }
  }

  private reportError(error: any): void {
    // In production: send to lightweight error tracking
    // No external dependencies, just a simple POST to own endpoint
    if (import.meta.env.PROD) {
      fetch('/api/error-report', {
        method: 'POST',
        body: JSON.stringify({
          message: error?.message ?? String(error),
          stack: error?.stack,
          url: window.location.href,
          timestamp: Date.now(),
          gameVersion: GAME_VERSION
        }),
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {}); // Silent fail
    }
  }
}
```

### 6.2 WebGL Context Loss Recovery

```typescript
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault(); // Allows context restoration
  console.warn('[Renderer] WebGL context lost. Pausing game...');
  gameState.gameState = 'paused';
  showNotification('Grafische context verloren. Proberen te herstellen...');
});

canvas.addEventListener('webglcontextrestored', () => {
  console.log('[Renderer] WebGL context restored. Rebuilding...');
  // Three.js handles most recovery automatically
  // But we need to:
  // 1. Re-upload all textures (.needsUpdate = true)
  // 2. Re-upload all buffer geometries
  // 3. Re-compile all shaders
  rebuildAllMaterials();
  rebuildAllGeometries();
  gameState.gameState = 'playing';
  showNotification('Grafische context hersteld!');
});

function rebuildAllMaterials(): void {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
      const mat = obj.material as THREE.Material;
      mat.needsUpdate = true;
      if ('map' in mat && mat.map) (mat.map as THREE.Texture).needsUpdate = true;
    }
  });
}
```

### 6.3 Memory Leak Detection & Prevention

```typescript
class MemoryMonitor {
  private snapshots: number[] = [];
  private readonly CHECK_INTERVAL = 30_000; // 30 seconds
  private readonly LEAK_THRESHOLD = 50;     // MB growth over 5 minutes = likely leak

  init(): void {
    setInterval(() => this.check(), this.CHECK_INTERVAL);
  }

  private check(): void {
    if (!('memory' in performance)) return; // Chrome-only API
    const mem = (performance as any).memory;
    const usedMB = mem.usedJSHeapSize / (1024 * 1024);
    this.snapshots.push(usedMB);

    // Keep last 10 snapshots (5 minutes)
    if (this.snapshots.length > 10) this.snapshots.shift();

    // Detect linear growth
    if (this.snapshots.length >= 10) {
      const growth = this.snapshots[9] - this.snapshots[0];
      if (growth > this.LEAK_THRESHOLD) {
        console.warn(`[Memory] Potential leak detected: +${growth.toFixed(1)}MB over 5 minutes`);
        // Force GC-friendly cleanup
        entityPool.flush();
        particleSystem.compactBuffers();
      }
    }
  }
}

// Prevention patterns:
// 1. Entity pooling (see Section 1.5) - prevents entity garbage
// 2. Object pooling for THREE.Vector3, THREE.Matrix4 in hot paths
// 3. Never create closures in per-frame systems
// 4. Use pre-allocated TypedArrays in particle systems
// 5. Dispose Three.js geometries/materials/textures when removing mesh groups
// 6. WeakRef for event listener targets where applicable

// Shared temp objects (never allocate in hot loop)
const _tempVec3 = new THREE.Vector3();
const _tempMat4 = new THREE.Matrix4();
const _tempColor = new THREE.Color();
const _tempQuat = new THREE.Quaternion();
```

### 6.4 Performance Auto-Quality Adjustment

```typescript
class AdaptiveQuality {
  private fpsHistory: number[] = [];
  private readonly WINDOW = 60;        // 60 frames history
  private currentLevel: 'high' | 'medium' | 'low' = 'high';

  update(fps: number): void {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.WINDOW) this.fpsHistory.shift();
    if (this.fpsHistory.length < this.WINDOW) return;

    const avgFps = this.fpsHistory.reduce((a, b) => a + b) / this.WINDOW;

    if (avgFps < 25 && this.currentLevel !== 'low') {
      this.downgrade();
    } else if (avgFps < 45 && this.currentLevel === 'high') {
      this.currentLevel = 'medium';
      this.applyMedium();
    } else if (avgFps > 55 && this.currentLevel === 'low') {
      this.currentLevel = 'medium';
      this.applyMedium();
    } else if (avgFps > 58 && this.currentLevel === 'medium') {
      this.currentLevel = 'high';
      this.applyHigh();
    }
  }

  private downgrade(): void {
    this.currentLevel = 'low';
    // Disable shadows
    renderer.shadowMap.enabled = false;
    // Reduce particle count by 50%
    particleSystem.setMaxParticles(0.5);
    // Increase LOD distances (show low-poly earlier)
    LOD_THRESHOLDS.HIGH_TO_MED = 20;
    LOD_THRESHOLDS.MED_TO_LOW = 40;
    // Reduce fog of war update frequency
    fogOfWarUpdateInterval = 0.5; // 2 fps instead of 5-10
    // Disable antialiasing
    renderer.setPixelRatio(1);
    console.log('[Quality] Downgraded to LOW');
  }

  private applyMedium(): void {
    renderer.shadowMap.enabled = false;
    particleSystem.setMaxParticles(0.75);
    LOD_THRESHOLDS.HIGH_TO_MED = 30;
    LOD_THRESHOLDS.MED_TO_LOW = 60;
    fogOfWarUpdateInterval = 0.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    console.log('[Quality] Set to MEDIUM');
  }

  private applyHigh(): void {
    renderer.shadowMap.enabled = true;
    particleSystem.setMaxParticles(1.0);
    LOD_THRESHOLDS.HIGH_TO_MED = 40;
    LOD_THRESHOLDS.MED_TO_LOW = 80;
    fogOfWarUpdateInterval = 0.1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    console.log('[Quality] Set to HIGH');
  }
}
```

### 6.5 Asset Loading Failure Recovery

```typescript
class AssetLoader {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // ms

  async loadGLB(url: string): Promise<THREE.Group> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const gltf = await gltfLoader.loadAsync(url);
        return gltf.scene;
      } catch (error) {
        console.warn(`[AssetLoader] Failed to load ${url} (attempt ${attempt}/${this.MAX_RETRIES})`);
        if (attempt < this.MAX_RETRIES) {
          await new Promise(r => setTimeout(r, this.RETRY_DELAY * attempt));
        }
      }
    }

    // All retries failed → return placeholder
    console.error(`[AssetLoader] Could not load ${url}, using placeholder`);
    return this.createPlaceholder();
  }

  async loadTexture(url: string): Promise<THREE.Texture> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await textureLoader.loadAsync(url);
      } catch {
        if (attempt < this.MAX_RETRIES) {
          await new Promise(r => setTimeout(r, this.RETRY_DELAY * attempt));
        }
      }
    }
    // Placeholder: 1x1 magenta pixel (clearly visible as missing)
    const data = new Uint8Array([255, 0, 255, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }

  private createPlaceholder(): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
    group.add(new THREE.Mesh(geo, mat));
    return group;
  }
}
```

### 6.6 NaN Detection in Physics/Pathfinding

```typescript
// In MovementSystem, after position integration:
function validatePosition(eid: number): void {
  if (isNaN(Position.x[eid]) || isNaN(Position.y[eid]) || isNaN(Position.z[eid])) {
    console.error(`[NaN] Entity ${eid} has NaN position. Resetting to last valid.`);
    // Reset to leash origin (last known good position)
    Position.x[eid] = UnitAI.leashX[eid];
    Position.z[eid] = UnitAI.leashZ[eid];
    Position.y[eid] = getTerrainHeight(Position.x[eid], Position.z[eid]);
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;
    Velocity.z[eid] = 0;
    Movement.hasTarget[eid] = 0;
  }

  // Clamp to map bounds
  Position.x[eid] = Math.max(0, Math.min(255, Position.x[eid]));
  Position.z[eid] = Math.max(0, Math.min(255, Position.z[eid]));
}
```

### 6.7 Infinite Loop Prevention in AI

```typescript
// AI decision loop guard:
const MAX_AI_ITERATIONS = 100;

function aiSystemUpdate(world: World): void {
  const entities = livingUnitsQuery(world);
  let iterations = 0;

  for (const eid of entities) {
    if (iterations++ > MAX_AI_ITERATIONS * entities.length) {
      console.error('[AI] Iteration limit exceeded. Breaking.');
      break;
    }
    // ... process AI
  }
}

// FSM transition guard: max 3 state transitions per entity per frame
function processAIState(eid: number, dt: number): void {
  let transitionCount = 0;
  const MAX_TRANSITIONS = 3;

  while (transitionCount < MAX_TRANSITIONS) {
    const prevState = UnitAI.state[eid];
    updateState(eid, dt);
    if (UnitAI.state[eid] === prevState) break; // No transition = stable
    transitionCount++;
  }

  if (transitionCount >= MAX_TRANSITIONS) {
    console.warn(`[AI] Entity ${eid} exceeded max state transitions. Forcing IDLE.`);
    UnitAI.state[eid] = AIState.IDLE;
  }
}
```

### 6.8 Console Error Suppression in Production

```typescript
if (import.meta.env.PROD) {
  const originalWarn = console.warn;
  const originalError = console.error;
  const suppressedPatterns = [
    /THREE.WebGLRenderer: Context Lost/,
    /THREE.WebGLProgram: Shader Error/,  // Logged elsewhere
  ];

  console.warn = (...args: any[]) => {
    const msg = args[0]?.toString() ?? '';
    if (suppressedPatterns.some(p => p.test(msg))) return;
    originalWarn.apply(console, args);
  };

  // Never suppress console.error entirely — only filter known benign ones
  console.error = (...args: any[]) => {
    const msg = args[0]?.toString() ?? '';
    // Always pass through — but could filter known Three.js noise
    originalError.apply(console, args);
  };
}
```

---

## 7. Performance Budget

### 7.1 Frame Budget Breakdown (16.6ms for 60fps)

```
┌──────────────────────────────────────────────────────┐
│ Frame Budget: 16.6ms (60 FPS target)                 │
├──────────────────────────────────────────────────────┤
│ Rendering (Three.js draw calls)          │  8.0ms    │ 48%
│   ├── Scene graph traversal              │  0.5ms    │
│   ├── Frustum culling                    │  0.3ms    │
│   ├── InstancedMesh draw calls (~50)     │  4.0ms    │
│   ├── Terrain + fog of war              │  1.5ms    │
│   ├── Particles + effects               │  0.7ms    │
│   └── Shadow pass (desktop only)         │  1.0ms    │
│                                          │           │
│ AI + Pathfinding                         │  3.0ms    │ 18%
│   ├── Unit AI FSM updates                │  1.5ms    │
│   ├── Strategic AI (amortized)           │  0.2ms    │
│   ├── Pathfinding sync                   │  0.5ms    │
│   ├── Ability/status effect ticks        │  0.5ms    │
│   └── Aura + Gezelligheid calc           │  0.3ms    │
│                                          │           │
│ Physics + Collision                      │  2.0ms    │ 12%
│   ├── Movement integration               │  0.3ms    │
│   ├── Spatial hash rebuild               │  0.4ms    │
│   ├── Unit-unit soft collision            │  0.8ms    │
│   ├── Projectile movement + impact       │  0.3ms    │
│   └── Terrain height sampling            │  0.2ms    │
│                                          │           │
│ Audio                                    │  1.0ms    │  6%
│   ├── Sound trigger/stop decisions       │  0.3ms    │
│   ├── 3D spatial updates                 │  0.5ms    │
│   └── Music crossfade                    │  0.2ms    │
│                                          │           │
│ UI                                       │  1.0ms    │  6%
│   ├── Health bar updates                 │  0.3ms    │
│   ├── Selection panel                    │  0.2ms    │
│   ├── Minimap render                     │  0.3ms    │
│   └── Resource/population display        │  0.2ms    │
│                                          │           │
│ GC Headroom                              │  1.6ms    │ 10%
│   └── Reserved for garbage collection    │           │
│       spikes and variance                │           │
└──────────────────────────────────────────────────────┘
```

### 7.2 Memory Budget

```
┌──────────────────────────────────────────────────────┐
│ Total Memory Budget: 368 MB                          │
├──────────────────────────────────────────────────────┤
│ Textures                                 │ 256 MB    │
│   ├── Terrain (4x 512x512 splat)         │   4 MB    │
│   ├── Unit textures (32 types × 512x512) │  32 MB    │
│   ├── Building textures (40 × 512x512)   │  40 MB    │
│   ├── Prop textures (shared atlas)       │   8 MB    │
│   ├── Fog of war texture (256x256 R8)    │  0.06 MB  │
│   ├── Shadow maps (2048x2048 × 2)        │  32 MB    │
│   ├── UI textures (icons, portraits)     │  16 MB    │
│   └── Reserve (LOD variants, effects)    │ 124 MB    │
│                                          │           │
│ Geometry                                 │  64 MB    │
│   ├── Terrain mesh (65K verts)           │   2 MB    │
│   ├── Unit models (32 types × 3 LODs)    │  12 MB    │
│   ├── Building models (40 × 3 LODs)      │  18 MB    │
│   ├── Props (trees, rocks, fences)       │   8 MB    │
│   ├── InstancedMesh matrix buffers       │  16 MB    │
│   └── Projectile/particle geometry       │   8 MB    │
│                                          │           │
│ Audio                                    │  32 MB    │
│   ├── Music tracks (4 × OGG ~3MB each)  │  12 MB    │
│   ├── SFX sprites (compressed, shared)   │   8 MB    │
│   ├── Voice lines (per faction)          │  10 MB    │
│   └── Ambient/UI sounds                  │   2 MB    │
│                                          │           │
│ Game State (ECS + JS)                    │  16 MB    │
│   ├── ECS component arrays (2048 ents)   │   4 MB    │
│   ├── Spatial hash grid                  │   1 MB    │
│   ├── NavMesh + TileCache                │   4 MB    │
│   ├── Fog of war buffers                 │   0.5 MB  │
│   ├── Path buffers (waypoints)           │   2 MB    │
│   ├── AI state (threat map, etc.)        │   1 MB    │
│   └── JS runtime overhead               │   3.5 MB  │
└──────────────────────────────────────────────────────┘
```

### 7.3 Asset Budgets

```
Per Unit Model (GLB):
  LOD 0 (High):   80-200 vertices,  512x512 texture  →  5-15 KB
  LOD 1 (Medium): 30-80 vertices,   256x256 texture  →  3-8 KB
  LOD 2 (Low):    8-24 vertices,    no texture (vertex color) → 1-2 KB

Per Building Model (GLB):
  LOD 0 (High):   200-500 vertices, 512x512 texture  → 10-30 KB
  LOD 1 (Medium): 80-200 vertices,  256x256 texture  → 5-15 KB
  LOD 2 (Low):    30-60 vertices,   no texture        → 2-5 KB

Per Hero Model (GLB, Meshy-generated):
  LOD 0 (High):   1000-3000 verts,  1024x1024 PBR    → 50-200 KB
  LOD 1 (Medium): 300-800 verts,    512x512           → 20-60 KB
  LOD 2 (Low):    80-200 verts,     256x256           → 5-15 KB

Audio:
  Music track:     OGG, 128kbps, ~3min   → 2-4 MB
  SFX (single):    OGG, 64kbps, <2s      → 5-30 KB
  Voice line:      OGG, 64kbps, 1-3s     → 8-24 KB
  SFX sprite:      OGG, bundled          → 200-500 KB per faction

Textures:
  Terrain splat:   PNG, 512x512, RGBA    → 100-300 KB
  Unit texture:    PNG, 512x512, RGB     → 50-150 KB
  Icon/portrait:   PNG, 128x128, RGBA    → 10-30 KB
```

### 7.4 Draw Call Budget

```
Target: < 150 draw calls per frame

Breakdown:
  Terrain:                     1-2 draw calls
  Water:                       1 draw call
  Fog of war overlay:          1 draw call
  Skybox:                      1 draw call
  InstancedMesh groups:
    Active unit types (~8-12):  8-12 draw calls
    Active building types:      10-15 draw calls
    Props (trees, rocks):       3-5 draw calls
    Resource nodes:             2-3 draw calls
  Selection circles:           1 draw call (instanced)
  Health bars:                 1-2 draw calls (instanced)
  Projectiles:                 2-4 draw calls (instanced)
  Particles:                   3-5 draw calls (Points geometry)
  Shadow pass:                 duplicate of above (desktop only)
  ─────────────────────────────────────────
  Total (no shadows):          34-52 draw calls
  Total (with shadows):        68-104 draw calls
  Headroom:                    46-98 draw calls spare
```

---

## 8. Build & Deployment

### 8.1 Vite Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/games/reign-of-brabant/', // Deployment subpath on theuws.com

  build: {
    target: 'es2022',               // Modern browsers (WebGPU needs ES2022+)
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,               // No sourcemaps in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,        // Keep console.warn/error for error reporting
        drop_debugger: true,
        passes: 2
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core engine (always loaded)
          'engine': [
            'three',
            'bitecs',
            'recast-navigation',
            '@recast-navigation/three'
          ],
          // Audio (can be lazy-loaded)
          'audio': ['howler'],
          // Faction data (lazy per faction selection)
          'faction-brabanders': ['./src/factions/brabanders/index.ts'],
          'faction-randstad': ['./src/factions/randstad/index.ts'],
          'faction-limburgers': ['./src/factions/limburgers/index.ts'],
          'faction-belgen': ['./src/factions/belgen/index.ts'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,    // KB
  },

  worker: {
    format: 'es',                    // ES modules in workers
  },

  assetsInclude: ['**/*.glb', '**/*.ogg', '**/*.mp3'],

  optimizeDeps: {
    include: ['three', 'bitecs'],    // Pre-bundle heavy deps
  },

  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      // Required for SharedArrayBuffer (Web Workers + WASM)
    }
  }
});
```

### 8.2 Code Splitting Strategy

```
Initial Load (< 5 MB):
├── index.html                          ~2 KB
├── engine chunk (three + bitecs + recast) ~800 KB (gzipped)
├── core game loop + UI                 ~150 KB (gzipped)
├── main menu assets (logo, bg)         ~500 KB
└── Total initial:                      ~1.5 MB gzipped

On Game Start (lazy loaded):
├── Selected faction chunk              ~50 KB (gzipped)
├── Map data (JSON + heightmap)         ~200 KB
├── Shared props (trees, rocks)         ~300 KB (GLB)
├── Audio chunk (Howler + SFX sprite)   ~500 KB
└── Total game start:                   ~1 MB gzipped

During Gameplay (streamed on demand):
├── Music tracks (per track)            ~3 MB each
├── Voice lines (per faction)           ~500 KB
├── Hero models (when trained)          ~200 KB each
├── Opponent faction assets             ~500 KB
└── Total streaming:                    ~5 MB over session

Grand Total: ~8-10 MB per full session
```

### 8.3 Asset Optimization Pipeline

```bash
#!/bin/bash
# scripts/optimize-assets.sh

# 1. GLB optimization (gltf-transform)
npx @gltf-transform/cli optimize assets/models/**/*.glb \
  --compress draco \
  --texture-compress webp \
  --texture-resize 512

# 2. Texture compression (to KTX2 for GPU-compressed textures)
npx @gltf-transform/cli etc1s assets/models/**/*.glb \
  --slots "baseColorTexture"

# 3. Audio optimization
for f in assets/audio/**/*.wav; do
  ffmpeg -i "$f" -c:a libvorbis -q:a 4 "${f%.wav}.ogg" -y
done

# 4. Heightmap optimization (16-bit PNG → 8-bit, sufficient for 15m max height)
# Done in Vite plugin at build time

# 5. Generate asset manifest (for cache busting)
node scripts/generate-manifest.js > dist/asset-manifest.json
```

### 8.4 Bundle Size Targets

```
Chunk                          Target (gzipped)    Actual (estimate)
─────────────────────────────────────────────────────────────────
index.html + CSS               < 20 KB             ~10 KB
engine (three+bitecs+recast)   < 1 MB              ~800 KB
core game code                 < 200 KB            ~150 KB
faction chunk (each)           < 80 KB             ~50 KB
audio engine (howler)          < 30 KB             ~7 KB
─────────────────────────────────────────────────────────────────
Total JS bundles (initial):    < 1.5 MB            ~1.0 MB
Total with assets (initial):   < 5 MB              ~2.5 MB
Total all assets (full game):  < 20 MB             ~10-15 MB
```

### 8.5 Cache Strategy

```typescript
// Vite generates hashed filenames for all chunks: engine-[hash].js
// Static assets (GLB, OGG, PNG) also hashed: model-[hash].glb
// index.html: no-cache (always fresh)
// All other assets: Cache-Control: public, max-age=31536000, immutable

// .htaccess for theuws.com Apache server:
/*
<IfModule mod_headers.c>
  # HTML: always revalidate
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>

  # JS/CSS with hash: immutable cache
  <FilesMatch "\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # Assets: long cache
  <FilesMatch "\.(glb|ogg|mp3|png|jpg|webp|ktx2)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>

  # WASM: long cache
  <FilesMatch "\.wasm$">
    Header set Cache-Control "public, max-age=31536000, immutable"
    Header set Content-Type "application/wasm"
  </FilesMatch>

  # COOP/COEP headers for SharedArrayBuffer
  Header set Cross-Origin-Opener-Policy "same-origin"
  Header set Cross-Origin-Embedder-Policy "require-corp"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE application/javascript application/json text/html text/css application/wasm
</IfModule>
*/
```

### 8.6 Service Worker (Offline Play)

```typescript
// sw.ts - Opt-in service worker for offline play after first load
// Strategy: Cache-first for assets, Network-first for HTML

const CACHE_NAME = 'rob-v1';
const PRECACHE_URLS = [
  '/games/reign-of-brabant/',
  '/games/reign-of-brabant/index.html',
  // Engine chunks added dynamically from asset manifest
];

self.addEventListener('install', (e: ExtendableEvent) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('fetch', (e: FetchEvent) => {
  const url = new URL(e.request.url);

  // HTML: network-first
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request) as Promise<Response>)
    );
    return;
  }

  // Assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        const cache = caches.open(CACHE_NAME);
        cache.then(c => c.put(e.request, response.clone()));
        return response;
      });
    }) as Promise<Response>
  );
});

// Service worker registration (main thread):
// Only register after game loads to not block initial load
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/games/reign-of-brabant/sw.js');
  });
}
```

### 8.7 Deployment

```bash
# Deploy to theuws.com/games/reign-of-brabant/
# Uses existing FTP deployment infrastructure

# 1. Build
npm run build

# 2. Deploy via existing script
cd /Users/richardtheuws/Documents/games
bash deploy-ftp.sh reign-of-brabant

# This uploads dist/ to httpdocs/games/reign-of-brabant/ on 45.82.188.94
```

---

## 9. Testing Strategy

### 9.1 Unit Tests (Vitest)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',       // DOM for UI tests
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/core/**', 'src/combat/**', 'src/ai/**', 'src/entities/**'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
      }
    }
  }
});
```

**Test categories:**

```typescript
// src/combat/damage.test.ts
describe('Damage Calculation', () => {
  it('applies base damage minus armor reduction', () => {
    const damage = calculateDamage(10, 4, ArmorType.Medium, AttackType.Melee);
    expect(damage).toBe(8); // 10 - (4 * 0.5) = 8
  });

  it('applies minimum damage of 1', () => {
    const damage = calculateDamage(1, 100, ArmorType.Heavy, AttackType.Melee);
    expect(damage).toBe(1);
  });

  it('applies armor type bonus', () => {
    const damage = calculateDamage(10, 2, ArmorType.Light, AttackType.Melee);
    // Melee vs Light: +50% = 15 - 1 = 14
    expect(damage).toBe(14);
  });

  it('applies siege bonus vs buildings', () => {
    const damage = calculateDamage(15, 3, ArmorType.Building, AttackType.Siege);
    // Siege vs Building: +100% = 30 - 1.5 = 28.5
    expect(damage).toBe(28.5);
  });
});

// src/core/gezelligheid.test.ts
describe('Gezelligheid System', () => {
  it('gives no bonus to lone Brabanders unit', () => {
    const bonus = calculateGezelligheidsBonus(1, 15);
    expect(bonus.attackMod).toBe(1.0);
    expect(bonus.speedMod).toBe(1.0);
  });

  it('gives +10% for 2-5 units within range', () => {
    const bonus = calculateGezelligheidsBonus(4, 15);
    expect(bonus.attackMod).toBeCloseTo(1.1);
  });

  it('gives +50% and damage reduction for 20+ units', () => {
    const bonus = calculateGezelligheidsBonus(25, 15);
    expect(bonus.attackMod).toBeCloseTo(1.5);
    expect(bonus.damageReduction).toBeGreaterThan(0);
  });
});

// src/ai/unit-ai.test.ts
describe('Unit AI FSM', () => {
  it('transitions from IDLE to ATTACKING when enemy in aggro range', () => { /* ... */ });
  it('returns to IDLE after target is dead', () => { /* ... */ });
  it('leashes back to origin when chase exceeds leash range', () => { /* ... */ });
  it('auto-heals lowest HP ally for support units', () => { /* ... */ });
  it('gathers → returns → gathers loop for workers', () => { /* ... */ });
  it('does not exceed max state transitions per frame', () => { /* ... */ });
});

// src/entities/production.test.ts
describe('Production System', () => {
  it('trains unit and spawns at rally point', () => { /* ... */ });
  it('deducts resources on train start', () => { /* ... */ });
  it('queues up to 5 units', () => { /* ... */ });
  it('applies Bureaucratie slowdown for Randstad', () => { /* ... */ });
  it('applies Efficiency stack speedup for Randstad', () => { /* ... */ });
  it('pauses during Werkoverleg', () => { /* ... */ });
});
```

### 9.2 Integration Tests for ECS Systems

```typescript
// src/core/ecs-integration.test.ts
describe('ECS System Pipeline', () => {
  let world: World;

  beforeEach(() => {
    world = createWorld({ maxEntities: 256 });
  });

  it('full combat loop: attack command → damage → death → cleanup', () => {
    const attacker = createCarnavalvierder(world, 10, 10);
    const target = createCarnavalvierder(world, 11, 10); // Adjacent
    Faction.id[target] = 1; // Different faction

    // Issue attack command
    UnitAI.state[attacker] = AIState.ATTACKING;
    UnitAI.targetEid[attacker] = target;

    // Simulate frames until target dies
    const maxFrames = 1000;
    for (let i = 0; i < maxFrames; i++) {
      combatSystem(world);
      deathSystem(world);
      if (hasComponent(world, IsDead, target)) break;
    }

    expect(hasComponent(world, IsDead, target)).toBe(true);
    expect(Health.current[target]).toBeLessThanOrEqual(0);
  });

  it('pathfinding → movement → arrival triggers state change', () => { /* ... */ });
  it('resource gathering → delivery → resource increment', () => { /* ... */ });
  it('building placement → navmesh update → pathfinding reroute', () => { /* ... */ });
});
```

### 9.3 Balance Testing Framework

```typescript
// scripts/balance-test.ts
// Headless AI vs AI simulation for balance verification.
// Runs without renderer (ECS-only, no Three.js).

interface BalanceTestConfig {
  faction1: number;
  faction2: number;
  map: string;
  difficulty1: Difficulty;
  difficulty2: Difficulty;
  iterations: number;        // Number of games to simulate
  maxGameTime: number;       // Max game length in seconds
  speedMultiplier: number;   // 10x = run at 10x speed
}

interface BalanceTestResult {
  faction1Wins: number;
  faction2Wins: number;
  draws: number;             // Timeout
  avgGameLength: number;     // Seconds
  faction1AvgUnitsPeak: number;
  faction2AvgUnitsPeak: number;
  faction1AvgResourcesGathered: number;
  faction2AvgResourcesGathered: number;
}

async function runBalanceTest(config: BalanceTestConfig): Promise<BalanceTestResult> {
  const results: BalanceTestResult = { /* init zeroes */ };

  for (let i = 0; i < config.iterations; i++) {
    const game = createHeadlessGame(config);
    const outcome = game.simulate(config.maxGameTime, config.speedMultiplier);
    // Aggregate results
  }

  return results;
}

// Example usage:
// npm run balance -- --f1=brabanders --f2=randstad --games=100 --map=kempen
// Expected output:
// Brabanders vs Randstad (100 games, De Kempen):
//   Brabanders: 52 wins (52%)
//   Randstad:   45 wins (45%)
//   Draws:       3 (3%)
//   Target: 45-55% win rate per faction = BALANCED
```

### 9.4 Performance Regression Testing

```typescript
// scripts/perf-test.ts
// Spawns known scenario (200 units, 50 buildings) and measures frame times.

interface PerfTestResult {
  avgFps: number;
  p99FrameTime: number;     // 99th percentile frame time
  maxFrameTime: number;
  avgMemoryMB: number;
  drawCalls: number;
  triangles: number;
}

// Runs in real browser via Playwright:
// 1. Open game URL
// 2. Load test scenario (spawn 200 units)
// 3. Measure 300 frames
// 4. Assert: avgFps > 55, p99 < 25ms, drawCalls < 150

// CI integration:
// npm run perf-test
// Fails if any metric regresses > 10% from baseline
```

### 9.5 Browser Compatibility Matrix

```
Browser              Version    WebGPU    WebGL2    Status
─────────────────────────────────────────────────────────
Chrome (desktop)     120+       Yes       Yes       Primary target
Firefox (desktop)    125+       Flag*     Yes       Supported
Safari (desktop)     18+        Yes       Yes       Supported
Edge (desktop)       120+       Yes       Yes       Supported
Chrome (Android)     120+       No*       Yes       Secondary
Safari (iOS)         18+        Yes       Yes       Secondary
─────────────────────────────────────────────────────────
* Firefox WebGPU behind flag in 2026, likely default soon
* Chrome Android WebGPU rolling out 2026

Minimum requirements:
- WebGL 2.0 support (97%+ of browsers)
- ES2022 (async/await, optional chaining)
- SharedArrayBuffer (requires COOP/COEP headers)
- Web Workers
- IndexedDB
- Pointer Events API
```

### 9.6 Automated Screenshot Testing

```typescript
// Optional: visual regression with Playwright
// Captures game state at known scenarios and compares pixel-by-pixel

// Scenarios:
// 1. Main menu
// 2. Game start (Brabanders, De Kempen)
// 3. Battle (10 units fighting)
// 4. Full base (all buildings)
// 5. Fog of war transition

// Threshold: 0.1% pixel difference allowed (anti-aliasing variance)
// Tool: Playwright + pixelmatch

// npm run screenshot-test
// Generates: tests/screenshots/actual/*.png
// Compares:  tests/screenshots/baseline/*.png
// Diff:      tests/screenshots/diff/*.png
```

---

## 10. Security

### 10.1 Client-Side State Protection

```typescript
// Single-player: no server-side validation needed.
// State obfuscation is NOT implemented for MVP (effort vs value for single-player).
// If multiplayer is added, ALL game state must move server-side.

// Minimal protection against casual cheating:
// 1. Freeze Object.defineProperty on critical objects in production
// 2. Validate resource amounts before actions (can't spend more than you have)
// 3. Validate unit stats against archetype data (detect modified values)

function validateAction(action: GameAction, playerState: PlayerState): boolean {
  switch (action.type) {
    case 'train':
      // Check resources
      const cost = getUnitCost(action.unitType);
      if (playerState.primary < cost.primary || playerState.secondary < cost.secondary) {
        return false; // Insufficient resources
      }
      // Check population cap
      if (playerState.population + getUnitPop(action.unitType) > playerState.populationCap) {
        return false;
      }
      // Check tech requirements
      if (!playerState.techUnlocked.includes(getUnitTechReq(action.unitType))) {
        return false;
      }
      return true;

    case 'build':
      // Similar validation for building placement
      return true;

    default:
      return true;
  }
}
```

### 10.2 Multiplayer Server-Side Validation (Future)

```typescript
// Architecture: Authoritative server with client prediction.
// Server runs headless ECS simulation.
// Clients send commands, server validates and broadcasts state updates.

// Protocol: WebSocket + MessagePack binary encoding
// Tick rate: 10 ticks/second (server) → client interpolates
// Client sends: commands (move, attack, build, etc.)
// Server sends: entity state diffs (position, health, etc.)

// Lockstep alternative (for deterministic replay):
// Both clients run same simulation
// Only exchange commands (bandwidth: ~1 KB/s)
// Requires deterministic math (no floats? or fixed-point)
// Simpler but harder to prevent cheating

// Decision: defer to v2.0. MVP is single-player only.
```

### 10.3 API Key Protection

```typescript
// CRITICAL: No API keys in client code. Ever.

// fal.ai, ElevenLabs, Suno keys → ONLY in build-time scripts (Blender, asset generation)
// These keys never reach the browser bundle.

// If multiplayer needs a backend:
// - API keys in environment variables on server-mini (M4)
// - Proxy endpoint: /api/leaderboard → server validates → database
// - CORS: only allow theuws.com origin

// .env handling:
// - .env in .gitignore (already in project root)
// - Vite only exposes VITE_* prefixed vars to client
// - No VITE_ prefixed secrets allowed

// Vite env validation at build time:
if (import.meta.env.DEV) {
  const forbidden = Object.keys(import.meta.env).filter(k =>
    k.startsWith('VITE_') && (
      k.includes('KEY') || k.includes('SECRET') || k.includes('TOKEN')
    )
  );
  if (forbidden.length > 0) {
    throw new Error(`SECURITY: Found API keys in VITE_ env vars: ${forbidden.join(', ')}`);
  }
}
```

### 10.4 Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  media-src 'self' blob:;
  font-src 'self';
  connect-src 'self' https://api.theuws.com;
  worker-src 'self' blob:;
  child-src 'self' blob:;
">

<!--
Explanation:
- 'self': Only load resources from same origin
- 'wasm-unsafe-eval': Required for recast-navigation WASM
- 'unsafe-inline' on style: Required for Three.js dynamic styles + game UI
- data: blob: on img: Required for CanvasTexture (fog of war, dynamic textures)
- blob: on media: Required for Howler.js audio decoding
- blob: on worker: Required for Vite's worker bundling
- connect-src to api.theuws.com: For future leaderboard/multiplayer API
- No 'unsafe-eval': Prevents XSS via eval()
-->
```

### 10.5 XSS Prevention in Chat (Multiplayer, Future)

```typescript
// For multiplayer chat (v2.0):

function sanitizeChatMessage(input: string): string {
  // 1. Trim to max 200 characters
  const trimmed = input.slice(0, 200);

  // 2. HTML entity encoding (prevent injection)
  const encoded = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 3. No URLs (prevent phishing)
  const noUrls = encoded.replace(/https?:\/\/[^\s]+/gi, '[link verwijderd]');

  return noUrls;
}

// Chat is rendered via textContent (not innerHTML), providing additional XSS protection.
// DOM insertion:
// chatElement.textContent = sanitizeChatMessage(message);
// NEVER: chatElement.innerHTML = message;
```

---

## Appendix A: File Structure (Complete)

```
reign-of-brabant/
├── src/
│   ├── core/
│   │   ├── game.ts              # Main game class, loop, state machine
│   │   ├── world.ts             # bitECS world setup, entity pool
│   │   ├── components.ts        # All component definitions
│   │   ├── systems.ts           # System execution pipeline
│   │   ├── spatial-hash.ts      # SpatialHashGrid
│   │   ├── events.ts            # Game event bus (EventTarget)
│   │   └── registries.ts        # Archetype, ability, status effect registries
│   ├── world/
│   │   ├── terrain.ts           # Terrain mesh, heightmap, splat shader
│   │   ├── map-loader.ts        # Map JSON parser, entity spawner
│   │   ├── fog-of-war.ts        # FogOfWarRenderer
│   │   └── water.ts             # Water plane rendering
│   ├── entities/
│   │   ├── unit-factory.ts      # createUnit() generic factory
│   │   ├── building-factory.ts  # createBuilding() generic factory
│   │   ├── resource-factory.ts  # createResource() factory
│   │   └── projectile-factory.ts
│   ├── factions/
│   │   ├── brabanders/
│   │   │   ├── index.ts         # Faction data, unit archetypes, building archetypes
│   │   │   ├── gezelligheid.ts  # Gezelligheid system logic
│   │   │   └── carnavalsrage.ts # Faction ability
│   │   ├── randstad/
│   │   │   ├── index.ts
│   │   │   ├── bureaucratie.ts  # Efficiency stacks, werkoverleg
│   │   │   └── vergadering.ts   # Faction ability
│   │   ├── limburgers/
│   │   │   ├── index.ts
│   │   │   ├── tunnels.ts      # Underground network
│   │   │   └── vlaai-flood.ts  # Faction ability
│   │   └── belgen/
│   │       ├── index.ts
│   │       ├── diplomatie.ts   # Compromise mechanic
│   │       └── verwarring.ts   # Faction ability
│   ├── combat/
│   │   ├── damage.ts            # Damage calculation, armor types
│   │   ├── combat-system.ts     # CombatSystem (attack timing, target acquisition)
│   │   ├── projectile-system.ts # ProjectileSystem
│   │   ├── ability-system.ts    # AbilitySystem (cooldowns, activation)
│   │   ├── status-effects.ts    # StatusEffectSystem
│   │   ├── aura-system.ts       # AuraSystem
│   │   └── heal-system.ts       # HealSystem
│   ├── ai/
│   │   ├── unit-ai.ts           # UnitAI FSM
│   │   ├── strategic-ai.ts      # StrategicAI (opponent AI)
│   │   ├── build-orders.ts      # Build order definitions
│   │   ├── threat-map.ts        # ThreatMap
│   │   └── difficulty.ts        # Difficulty presets
│   ├── pathfinding/
│   │   ├── pathfinding-manager.ts  # PathfindingManager (crowd + individual)
│   │   ├── pathfinding.worker.ts   # Web Worker
│   │   ├── formation.ts            # FormationManager
│   │   ├── dynamic-obstacles.ts    # DynamicObstacleManager (TileCache)
│   │   └── navmesh-builder.ts      # NavMesh generation from terrain
│   ├── camera/
│   │   ├── rts-camera.ts           # Pan, zoom, rotate, edge scroll
│   │   └── minimap.ts              # Minimap canvas renderer
│   ├── input/
│   │   ├── input-manager.ts        # Keyboard + mouse state
│   │   ├── selection.ts            # Box select, click select, shift-select
│   │   ├── commands.ts             # Right-click contextual commands
│   │   ├── control-groups.ts       # Ctrl+1-9 groups
│   │   └── hotkeys.ts              # Ability hotkeys, building hotkeys
│   ├── rendering/
│   │   ├── renderer.ts             # WebGPU/WebGL init, render loop
│   │   ├── instanced-meshes.ts     # InstancedMeshManager
│   │   ├── lod-system.ts           # LOD level management
│   │   ├── health-bars.ts          # Billboarded health bar rendering
│   │   ├── selection-circles.ts    # Selection ring rendering
│   │   ├── particles.ts            # ParticleSystem manager
│   │   ├── render-sync.ts          # RenderSyncSystem (ECS → Three.js)
│   │   └── adaptive-quality.ts     # Auto-quality adjustment
│   ├── ui/
│   │   ├── hud.ts                  # Main HUD controller
│   │   ├── resource-panel.ts       # Top resource display
│   │   ├── unit-panel.ts           # Bottom unit info/portrait
│   │   ├── command-card.ts         # Action buttons (train, build, ability)
│   │   ├── minimap-ui.ts           # Minimap HTML overlay
│   │   ├── main-menu.ts            # Menu screens
│   │   ├── settings-menu.ts        # Settings UI
│   │   ├── save-load-menu.ts       # Save/load UI
│   │   └── notifications.ts        # In-game notifications
│   ├── audio/
│   │   ├── audio-manager.ts        # Howler.js wrapper, sound pools
│   │   ├── music-manager.ts        # Music tracks, crossfade, adaptive
│   │   └── voice-manager.ts        # Voice line playback, cooldowns
│   └── assets/
│       ├── asset-loader.ts         # GLB, texture, audio loading with retry
│       ├── asset-manifest.ts       # Generated manifest for cache busting
│       └── model-manager.ts        # Model instance management
├── assets/
│   ├── models/
│   │   ├── brabanders/             # Per-faction GLB files
│   │   ├── randstad/
│   │   ├── limburgers/
│   │   ├── belgen/
│   │   └── shared/                 # Trees, rocks, fences, resource nodes
│   ├── textures/
│   │   ├── terrain/                # Heightmaps, splat maps, tile textures
│   │   └── effects/                # Particle textures
│   ├── audio/
│   │   ├── music/                  # Background tracks (OGG)
│   │   ├── sfx/                    # Sound effect sprites (OGG)
│   │   └── voice/                  # Voice lines per faction (OGG)
│   ├── icons/                      # Unit portraits, ability icons (PNG)
│   ├── maps/                       # Map JSON definitions
│   └── ui/                         # Logo, OG image, menu backgrounds
├── scripts/
│   ├── blender/
│   │   └── generate_rts_assets.py  # Procedural Blender asset generation
│   ├── optimize-assets.sh          # GLB/texture/audio optimization
│   ├── balance-test.ts             # Headless AI vs AI balance testing
│   ├── perf-test.ts                # Performance regression testing
│   └── generate-manifest.js        # Asset manifest generator
├── tests/
│   ├── unit/                       # Vitest unit tests
│   ├── integration/                # ECS integration tests
│   └── screenshots/                # Visual regression baselines
├── public/
│   └── index.html
├── docs/
│   └── SUB-PRD-TECHNICAL.md        # This document
├── PRD.md
├── CHANGELOG.md
├── VERSION
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── .gitignore
```

---

## Appendix B: Technology Version Pinning

```json
{
  "dependencies": {
    "three": "^0.172.0",
    "bitecs": "^0.3.40",
    "recast-navigation": "^0.35.0",
    "@recast-navigation/three": "^0.35.0",
    "howler": "^2.2.4",
    "lz-string": "^1.5.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.2.0",
    "vitest": "^3.0.0",
    "@gltf-transform/cli": "^4.1.0",
    "terser": "^5.37.0"
  }
}
```

---

## Appendix C: Key Decisions & Rationale

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| ECS Library | bitECS vs miniplex vs ECSY | **bitECS** | Fastest (335K ops/s), SoA layout, TypedArrays, zero GC |
| Pathfinding | A* grid vs navmesh vs flow field | **recast-navigation navmesh** | Industry standard, WASM speed, crowd simulation, TileCache |
| AI Framework | Custom FSM vs behaviour tree vs Yuka.js | **Custom FSM + Yuka.js steering** | FSM simpler for RTS unit states, Yuka for steering behaviors |
| Rendering | InstancedMesh vs merged geometry vs individual meshes | **InstancedMesh per type** | Best draw call reduction, supports per-instance transform/color |
| Storage | localStorage vs IndexedDB vs File System API | **IndexedDB** | Larger quota (>50MB), async API, structured data |
| Save Format | Binary (protobuf) vs JSON | **JSON + LZ-string** | Debuggable, versionable, compression closes size gap |
| Audio | Tone.js vs Howler.js vs Web Audio raw | **Howler.js** | 7KB, sprite support, spatial audio, proven reliability |
| Terrain | Procedural noise vs heightmap image | **Heightmap image** | Art-directed via Depth Anything pipeline, predictable |
| Fog of War | Per-vertex vs shader texture vs stencil | **Shader texture mask** | GPU-efficient, smooth transitions, works with terrain shader |
| UI | Canvas overlay vs HTML/CSS vs React | **HTML/CSS overlay** | No framework overhead, CSS transitions, responsive |
| Multiplayer Prep | Lockstep vs client-server | **Command log (lockstep-ready)** | Enables deterministic replay now, multiplayer later |

---

*Document gegenereerd voor Reign of Brabant v0.1.0 MVP development. Alle specificaties zijn implementeerbaar met de genoemde tech stack op de huidige hardware (MacBook Pro M5 Pro / 48GB RAM).*
