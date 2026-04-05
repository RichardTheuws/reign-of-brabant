# Reign of Brabant -- PoC Architecture

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft
**Parent**: PRD.md v1.0.0, SUB-PRD-TECHNICAL.md v1.0.0
**Scope**: Proof of Concept -- 1 factie (Brabanders) vs AI, 3 unit types, 2 gebouwen, 1 resource

---

## Inhoudsopgave

1. [PoC Scope & Afbakening](#1-poc-scope--afbakening)
2. [Complete Bestandslijst](#2-complete-bestandslijst)
3. [Dependency Graph](#3-dependency-graph)
4. [System Execution Order](#4-system-execution-order)
5. [Data Flow](#5-data-flow)
6. [Render Architectuur](#6-render-architectuur)
7. [Code Patterns](#7-code-patterns)
8. [Implementatie Volgorde](#8-implementatie-volgorde)

---

## 1. PoC Scope & Afbakening

### Wat WEL in het PoC zit

| Feature | Detail |
|---------|--------|
| Facties | 1: Brabanders (speler, oranje) vs Brabanders (AI, blauw) |
| Units | Worker (Boer), Infantry (Carnavalvierder), Ranged (Kansen) |
| Gebouwen | Town Hall (Boerderij), Barracks (Cafe) |
| Resources | Gold (Worstenbroodjes) -- gold mines op de map |
| Terrein | Flat met heuvels (simplex noise heightmap, 128x128) |
| Pathfinding | recast-navigation-js (solo navmesh, geen TileCache) |
| Camera | RTS pan (WASD/edge scroll), zoom (scrollwiel) |
| Selection | Click select, box select, Shift+click append |
| Commands | Right-click move, right-click attack, right-click gather |
| Combat | Basic damage = attack - armor*0.5, min 1 |
| AI | Scripted build order + attack timer (geen threat map) |
| UI | HTML/CSS HUD: resources, unit count, selection panel, minimap |
| Fog of War | Basic visibility circles per unit, 3-state (unexplored/explored/visible) |

### Wat NIET in het PoC zit

- Geen tech tree / upgrades
- Geen abilities / status effects / auras
- Geen projectielen (ranged units doen instant damage op afstand)
- Geen formation movement
- Geen LOD systeem
- Geen particle effects
- Geen audio
- Geen save/load
- Geen shadows
- Geen Web Worker pathfinding (alles op main thread)
- Geen entity pooling
- Geen crowd pathfinding (alleen individueel)
- Geen building construction animation (instant placement + build timer)
- Geen control groups
- Gezelligheid mechanic wordt NIET geimplementeerd (v1.0 feature)

---

## 2. Complete Bestandslijst

### Project Root

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 1 | `package.json` | NPM dependencies, scripts | 40 | -- | P0 |
| 2 | `tsconfig.json` | TypeScript configuratie (strict, ES2022) | 25 | -- | P0 |
| 3 | `vite.config.ts` | Vite build config, dev server, base path | 35 | vite | P0 |
| 4 | `index.html` | Entry point, canvas + HUD container | 80 | -- | P0 |
| 5 | `.gitignore` | node_modules, dist, .env | 15 | -- | P0 |

### `src/` -- Applicatie Entry

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 6 | `src/main.ts` | Bootstrap: init renderer, ECS world, asset loading, game loop start | 120 | core/Game, core/AssetLoader | P0 |
| 7 | `src/constants.ts` | Alle magic numbers: map size, unit stats, timing, kleuren | 150 | -- | P0 |

### `src/core/` -- Game Engine Core

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 8 | `src/core/Game.ts` | Game class: world, systems pipeline, game loop (rAF), pause/resume, dt calc | 180 | ecs/World, systems/*, renderer/SceneManager | P0 |
| 9 | `src/core/GameState.ts` | Singleton game state: player resources, population, game status, elapsed time | 80 | -- | P0 |
| 10 | `src/core/AssetLoader.ts` | GLTFLoader + TextureLoader wrapper, loading screen progress, placeholder fallbacks | 120 | three | P1 |
| 11 | `src/core/EventBus.ts` | Typed pub/sub event bus voor cross-system communicatie (unit-died, building-placed, resource-deposited) | 80 | -- | P0 |

### `src/ecs/` -- Entity Component System

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 12 | `src/ecs/components.ts` | Alle bitECS component definities (Position, Velocity, Health, Attack, Armor, Movement, Faction, UnitType, Selected, Gatherer, Building, Production, Visibility, UnitAI, RenderRef, Resource) | 200 | bitecs | P0 |
| 13 | `src/ecs/world.ts` | createWorld wrapper met maxEntities=1024, WorldMeta interface | 40 | bitecs | P0 |
| 14 | `src/ecs/queries.ts` | Alle defineQuery calls: livingUnits, selectedUnits, movingUnits, combatUnits, workers, buildings, resources, renderableEntities, visibilityEntities | 80 | bitecs, components | P0 |
| 15 | `src/ecs/archetypes.ts` | Factory functions: createWorker(), createInfantry(), createRanged(), createTownHall(), createBarracks(), createGoldMine() -- zet alle component values uit constants | 220 | bitecs, components, constants | P1 |
| 16 | `src/ecs/tags.ts` | Tag components (zero-size): IsUnit, IsBuilding, IsResource, IsDead, IsWorker, NeedsPathfinding | 30 | bitecs | P0 |

### `src/systems/` -- ECS Systems (1 bestand per system)

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 17 | `src/systems/InputSystem.ts` | Leest mouse/keyboard events, schrijft naar InputState buffer (mouse pos, buttons, keys, dragRect). Geen ECS queries -- puur input capture. | 200 | input/InputState | P0 |
| 18 | `src/systems/CameraSystem.ts` | Leest InputState (WASD, edge scroll, zoom). Update camera position/zoom. Clamp aan map bounds. | 150 | input/InputState, renderer/CameraController | P0 |
| 19 | `src/systems/SelectionSystem.ts` | Click select (raycaster), box select (screen-space rect vs unit screen positions). Schrijft Selected component. Shift=append, click=replace. | 220 | ecs/queries, input/InputState, renderer/SceneManager | P1 |
| 20 | `src/systems/CommandSystem.ts` | Vertaalt right-click naar ECS commands: move (set Movement target), attack (set UnitAI target+state), gather (set Gatherer target+state), build (spawn building entity). | 250 | ecs/queries, ecs/components, input/InputState, core/GameState, pathfinding/PathfindingManager | P1 |
| 21 | `src/systems/PathfindingSystem.ts` | Query entities met NeedsPathfinding tag. Roept PathfindingManager.findPath() aan. Schrijft path waypoints naar Path component. Verwijdert NeedsPathfinding tag. | 120 | ecs/queries, ecs/tags, pathfinding/PathfindingManager | P1 |
| 22 | `src/systems/MovementSystem.ts` | Entities met Movement.hasTarget=1 en Path: volg waypoints, update Position.x/y/z, snap Y naar terrain hoogte, face movement direction (Rotation.y). Bij arrival: clear hasTarget. | 180 | ecs/queries, ecs/components, terrain/Terrain | P1 |
| 23 | `src/systems/CombatSystem.ts` | Entities in ATTACKING state: check range, tick attack timer, apply damage (Attack.damage - Armor.value*0.5, min 1). Bij HP<=0: add IsDead tag. Auto-aggro: idle units detect nearby enemies via SpatialGrid. | 250 | ecs/queries, ecs/components, ecs/tags, utils/SpatialGrid | P2 |
| 24 | `src/systems/GatherSystem.ts` | Workers in gather states: MOVING_TO_RESOURCE check arrival, GATHERING tick carry amount + deplete resource, RETURNING check arrival + deposit to GameState.resources + auto-return. | 200 | ecs/queries, ecs/components, core/GameState, ecs/tags | P1 |
| 25 | `src/systems/ProductionSystem.ts` | Buildings met Production.unitType != 255: tick progress, spawn unit entity bij completion, deduct resources, update rally point. Queue management (5 slots). | 180 | ecs/queries, ecs/components, ecs/archetypes, core/GameState | P1 |
| 26 | `src/systems/AISystem.ts` | Unit AI FSM: Idle (scan aggro range), Moving (check arrival), Attacking (check target alive, check range, leash check), Gathering (delegate to GatherSystem), Dead (skip). Max 3 state transitions per frame. | 300 | ecs/queries, ecs/components, utils/SpatialGrid | P2 |
| 27 | `src/systems/StrategicAISystem.ts` | Opponent AI: scripted build order (train workers, build barracks, train army), attack timer (5 min = send army to player base), resource check before spending, difficulty modifiers. Runs 1x/sec. | 350 | ecs/queries, ecs/archetypes, core/GameState, ecs/components | P2 |
| 28 | `src/systems/DeathSystem.ts` | Query IsDead entities. Start 2s death timer. Na timer: remove entity (removeEntity). Emit unit-died event. | 80 | ecs/queries, ecs/tags, core/EventBus | P2 |
| 29 | `src/systems/FogOfWarSystem.ts` | Query alle entities met Visibility component van player faction. Stamp circles in visibility buffer. Merge explored buffer. Update fog texture. Draait op 5fps (accumuleer dt). | 150 | ecs/queries, ecs/components, renderer/FogOfWarRenderer | P2 |
| 30 | `src/systems/RenderSyncSystem.ts` | Koppelt ECS Position/Rotation aan Three.js Object3D transforms. Itereer alle entities met RenderRef, update Object3D.position en Object3D.rotation uit ECS components. | 120 | ecs/queries, ecs/components, renderer/EntityMeshManager | P0 |
| 31 | `src/systems/UISystem.ts` | Update HTML DOM: resource display, population count, selected units panel (icon, hp bar, name), building production progress bar, minimap re-render trigger. | 200 | ecs/queries, core/GameState, ui/HUD | P2 |
| 32 | `src/systems/MinimapSystem.ts` | Render minimap op offscreen canvas: terrain achtergrond, unit dots (groen=eigen, rood=vijand), building squares, camera viewport rect. Click op minimap = move camera. | 180 | ecs/queries, ecs/components, terrain/Terrain, input/InputState | P2 |

### `src/input/` -- Input Handling

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 33 | `src/input/InputState.ts` | Singleton input state buffer: mouseX, mouseY, mouseWorldX, mouseWorldZ, leftDown, rightDown, keysDown (Map), dragStart, dragEnd, dragActive, scrollDelta | 100 | -- | P0 |
| 34 | `src/input/InputHandler.ts` | Registreert DOM event listeners (mousedown, mouseup, mousemove, keydown, keyup, wheel, contextmenu). Schrijft naar InputState. Raycaster voor mouse-to-world projection. Prevent defaults. | 200 | input/InputState, renderer/SceneManager | P0 |

### `src/renderer/` -- Three.js Rendering

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 35 | `src/renderer/SceneManager.ts` | Maakt en beheert THREE.Scene, THREE.WebGLRenderer, THREE.PerspectiveCamera. Resize handler. render() aanroep. Bevat references naar alle scene groups. | 150 | three | P0 |
| 36 | `src/renderer/CameraController.ts` | Camera state: position (x,y,z), target (x,z), zoom level. Methods: pan(dx,dz), zoom(delta), clampToBounds(). Smooth interpolation. Edge scroll detection. | 160 | three, constants | P0 |
| 37 | `src/renderer/TerrainRenderer.ts` | Maakt terrain mesh: PlaneGeometry displaced met heightmap data. Simpele multi-color material (geen splat shader in PoC -- gebruik vertex colors: groen=gras, bruin=heuvel). getHeightAt(x,z) method. | 180 | three, terrain/Terrain | P0 |
| 38 | `src/renderer/EntityMeshManager.ts` | Beheert Three.js meshes voor alle ECS entities. Mapping: entityId -> THREE.Object3D (Mesh of Group). Methods: createMesh(eid, type, faction), removeMesh(eid), getMesh(eid). Gebruikt simpele geometrieen (BoxGeometry, CylinderGeometry, ConeGeometry) per unit type -- geen GLB in PoC. Faction kleur via MeshLambertMaterial. | 250 | three, constants | P0 |
| 39 | `src/renderer/SelectionRenderer.ts` | Render selectie-cirkels (flat ring meshes) onder geselecteerde units. Box select rectangle (HTML div overlay). Kleuren: groen=eigen, rood=vijand. | 120 | three, ecs/queries, ecs/components | P1 |
| 40 | `src/renderer/HealthBarRenderer.ts` | Billboarded health bars boven units: groen quad (current HP) + rood quad (missing HP). Alleen zichtbaar als HP < max of unit selected. Canvas-based sprite approach. | 150 | three, ecs/queries, ecs/components | P2 |
| 41 | `src/renderer/FogOfWarRenderer.ts` | Offscreen canvas (128x128) voor fog of war texture. stampCircle() methode. 3 states: zwart (unexplored), donkergrijs (explored), transparant (visible). CanvasTexture op een fullscreen quad boven terrain. | 160 | three | P2 |
| 42 | `src/renderer/MinimapRenderer.ts` | Offscreen canvas (200x200) voor minimap. Tekent terrain achtergrondkleur, unit dots, building rects, camera viewport. Exposed als HTML canvas element in HUD. | 150 | terrain/Terrain, ecs/queries | P2 |

### `src/terrain/` -- Terrain Generation & Data

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 43 | `src/terrain/Terrain.ts` | Terrain data class: heightmap Float32Array (128x128), getHeightAt(x,z) met bilineaire interpolatie, mapSize, heightScale. Geen rendering -- puur data. | 100 | -- | P0 |
| 44 | `src/terrain/TerrainGenerator.ts` | Genereert heightmap via simplex noise. Parameters: mapSize (128), heightScale (10), octaves (4), persistence (0.5). Spawnt gold mines + start posities. | 120 | terrain/Terrain, utils/SimplexNoise | P0 |

### `src/pathfinding/` -- Pathfinding

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 45 | `src/pathfinding/PathfindingManager.ts` | Wrapper rond recast-navigation-js. init(): bouw navmesh van terrain mesh. findPath(startX, startZ, endX, endZ): retourneer waypoint array. addObstacle()/removeObstacle() voor buildings (simpele rebuild in PoC). | 200 | recast-navigation, @recast-navigation/three, terrain/Terrain | P1 |
| 46 | `src/pathfinding/PathBuffer.ts` | Shared path storage: Map van pathId -> Float32Array (waypoints). Allocate/free path slots. Max 256 active paths. | 80 | -- | P1 |

### `src/ai/` -- Strategic AI

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 47 | `src/ai/BuildOrder.ts` | Scripted build order data: array van { type, target, count, condition } stappen. BRABANDERS_RUSH preset: 4 extra workers -> barracks -> 5 infantry + 3 ranged -> attack. | 100 | -- | P2 |
| 48 | `src/ai/AIController.ts` | AI player controller: bezit van resources (aparte teller), execute build order stappen, train units via ProductionSystem, attack decision (timer-based: na 5 min stuur alles naar player base). | 250 | ai/BuildOrder, ecs/archetypes, ecs/components, core/GameState | P2 |

### `src/ui/` -- User Interface (HTML/CSS)

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 49 | `src/ui/HUD.ts` | HUD manager: cacht DOM references, update methods voor elk HUD element. init() bindt aan DOM. | 150 | -- | P1 |
| 50 | `src/ui/hud.css` | Stijlen voor alle HUD elementen: resource bar (top), minimap (bottom-left), selection panel (bottom-center), action panel (bottom-right) | 250 | -- | P1 |

### `src/utils/` -- Utility Classes

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 51 | `src/utils/SpatialGrid.ts` | Spatial hash grid voor proximity queries. cellSize=8. insert(eid, x, z), queryRadius(x, z, radius) -> eid[]. Rebuilt elke frame. | 100 | ecs/components | P1 |
| 52 | `src/utils/SimplexNoise.ts` | Simplex noise implementatie (2D) voor terrain generatie. Publiek domein algoritme, geen dependency. | 120 | -- | P0 |
| 53 | `src/utils/math.ts` | Helpers: clamp(), lerp(), distance2D(), angleBetween(), worldToScreen(), screenToWorld() | 60 | -- | P0 |

### `src/map/` -- Map Setup

| # | Pad | Verantwoordelijkheid | Regels | Dependencies | Prioriteit |
|---|-----|---------------------|--------|-------------|-----------|
| 54 | `src/map/MapSetup.ts` | Spawnt initieel game state: 2x TownHall (player + AI), 4-6x GoldMine, start workers (3 per speler). Posities gebaseerd op terrain (hoeken van de map). | 120 | ecs/archetypes, terrain/Terrain, core/GameState | P1 |

### Totaal: 54 bestanden

### Samenvatting per directory

| Directory | Bestanden | Totaal regels (geschat) |
|-----------|-----------|------------------------|
| Root config | 5 | 195 |
| `src/` | 2 | 270 |
| `src/core/` | 4 | 460 |
| `src/ecs/` | 5 | 570 |
| `src/systems/` | 16 | 3,030 |
| `src/input/` | 2 | 300 |
| `src/renderer/` | 8 | 1,320 |
| `src/terrain/` | 2 | 220 |
| `src/pathfinding/` | 2 | 280 |
| `src/ai/` | 2 | 350 |
| `src/ui/` | 2 | 400 |
| `src/utils/` | 3 | 280 |
| `src/map/` | 1 | 120 |
| **Totaal** | **54** | **~7,795** |

---

## 3. Dependency Graph

### 3.1 Layer Diagram

```
Layer 0 (geen dependencies)
├── src/constants.ts
├── src/utils/SimplexNoise.ts
├── src/utils/math.ts
├── src/input/InputState.ts
└── src/core/EventBus.ts

Layer 1 (hangt af van Layer 0 + npm packages)
├── src/ecs/components.ts         ← bitecs
├── src/ecs/tags.ts               ← bitecs
├── src/ecs/world.ts              ← bitecs
├── src/terrain/Terrain.ts        ← (geen deps)
├── src/ai/BuildOrder.ts          ← (geen deps)
└── src/pathfinding/PathBuffer.ts ← (geen deps)

Layer 2 (hangt af van Layer 0-1)
├── src/ecs/queries.ts            ← components, tags
├── src/core/GameState.ts         ← (geen deps, maar wordt door velen geimporteerd)
├── src/terrain/TerrainGenerator.ts ← Terrain, SimplexNoise
├── src/renderer/SceneManager.ts  ← three
├── src/renderer/CameraController.ts ← three, constants
└── src/utils/SpatialGrid.ts      ← components

Layer 3 (hangt af van Layer 0-2)
├── src/ecs/archetypes.ts         ← components, tags, constants, world
├── src/renderer/TerrainRenderer.ts ← three, Terrain
├── src/renderer/EntityMeshManager.ts ← three, constants
├── src/renderer/FogOfWarRenderer.ts ← three
├── src/renderer/MinimapRenderer.ts ← Terrain, queries
├── src/renderer/SelectionRenderer.ts ← three, queries, components
├── src/renderer/HealthBarRenderer.ts ← three, queries, components
├── src/input/InputHandler.ts     ← InputState, SceneManager
├── src/pathfinding/PathfindingManager.ts ← recast-navigation, Terrain
└── src/ui/HUD.ts                 ← (DOM only)

Layer 4 (ECS Systems -- hangt af van alles hierboven)
├── src/systems/InputSystem.ts       ← InputState
├── src/systems/CameraSystem.ts      ← InputState, CameraController
├── src/systems/SelectionSystem.ts   ← queries, InputState, SceneManager
├── src/systems/CommandSystem.ts     ← queries, components, InputState, GameState, PathfindingManager
├── src/systems/PathfindingSystem.ts ← queries, tags, PathfindingManager
├── src/systems/MovementSystem.ts    ← queries, components, Terrain
├── src/systems/CombatSystem.ts      ← queries, components, tags, SpatialGrid
├── src/systems/GatherSystem.ts      ← queries, components, GameState, tags
├── src/systems/ProductionSystem.ts  ← queries, components, archetypes, GameState
├── src/systems/AISystem.ts          ← queries, components, SpatialGrid
├── src/systems/StrategicAISystem.ts ← queries, archetypes, GameState, components
├── src/systems/DeathSystem.ts       ← queries, tags, EventBus
├── src/systems/FogOfWarSystem.ts    ← queries, components, FogOfWarRenderer
├── src/systems/RenderSyncSystem.ts  ← queries, components, EntityMeshManager
├── src/systems/UISystem.ts          ← queries, GameState, HUD
└── src/systems/MinimapSystem.ts     ← queries, components, Terrain, InputState

Layer 5 (Orchestratie)
├── src/map/MapSetup.ts           ← archetypes, Terrain, GameState
├── src/ai/AIController.ts        ← BuildOrder, archetypes, components, GameState
├── src/core/Game.ts              ← world, alle systems, SceneManager, Terrain*, MapSetup
└── src/main.ts                   ← Game, AssetLoader
```

### 3.2 Build-First Volgorde

Bestanden moeten in deze volgorde gebouwd worden (elke stap kan pas na voltooiing van de vorige):

```
Stap 1: constants.ts, math.ts, SimplexNoise.ts, InputState.ts, EventBus.ts
Stap 2: components.ts, tags.ts, world.ts, Terrain.ts, PathBuffer.ts, BuildOrder.ts
Stap 3: queries.ts, GameState.ts, TerrainGenerator.ts, SceneManager.ts, CameraController.ts, SpatialGrid.ts
Stap 4: archetypes.ts, EntityMeshManager.ts, TerrainRenderer.ts, FogOfWarRenderer.ts, InputHandler.ts, PathfindingManager.ts, HUD.ts, hud.css
Stap 5: Alle Systems (parallel -- ze importeren dezelfde dependencies)
Stap 6: MapSetup.ts, AIController.ts
Stap 7: Game.ts, AssetLoader.ts
Stap 8: main.ts, index.html, vite.config.ts
```

### 3.3 NPM Dependencies

```json
{
  "dependencies": {
    "three": "^0.172.0",
    "bitecs": "^0.3.43",
    "recast-navigation": "^0.35.0",
    "@recast-navigation/three": "^0.35.0"
  },
  "devDependencies": {
    "vite": "^6.2.0",
    "typescript": "^5.7.0",
    "@types/three": "^0.172.0",
    "vitest": "^3.0.0"
  }
}
```

---

## 4. System Execution Order

### 4.1 Per-Frame Pipeline

```
requestAnimationFrame(gameLoop)
│
│  dt = clock.getDelta()  (capped at 0.05s = 20fps minimum)
│
├── Phase 1: INPUT CAPTURE
│   ├── 1. InputSystem          [0.1ms]
│   └── 2. CameraSystem         [0.1ms]
│
├── Phase 2: PLAYER INTENT
│   ├── 3. SelectionSystem      [0.2ms]
│   └── 4. CommandSystem         [0.2ms]
│
├── Phase 3: AI DECISIONS
│   ├── 5. AISystem             [0.8ms]   (unit-level FSM)
│   └── 6. StrategicAISystem    [0.3ms]   (runs 1x/sec, amortized)
│
├── Phase 4: MOVEMENT
│   ├── 7. PathfindingSystem    [0.5ms]
│   └── 8. MovementSystem       [0.3ms]
│
├── Phase 5: COMBAT & ECONOMY
│   ├── 9.  CombatSystem        [0.4ms]
│   ├── 10. GatherSystem        [0.2ms]
│   └── 11. ProductionSystem    [0.2ms]
│
├── Phase 6: CLEANUP
│   └── 12. DeathSystem          [0.1ms]
│
├── Phase 7: PRESENTATION
│   ├── 13. FogOfWarSystem      [0.3ms]   (runs 5x/sec, amortized)
│   ├── 14. RenderSyncSystem    [0.3ms]
│   ├── 15. UISystem            [0.2ms]
│   └── 16. MinimapSystem       [0.1ms]   (runs 5x/sec, amortized)
│
└── renderer.render(scene, camera)         [2-4ms]
```

**Totaal system budget: ~3.8ms + ~3ms render = ~6.8ms (ruim onder 16.6ms)**

### 4.2 System Details

#### 1. InputSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | Geen ECS query -- leest DOM events |
| **Schrijft** | `InputState` singleton (mouseX/Y, keys, dragRect, scrollDelta) |
| **Leest** | DOM event buffer (gevuld door InputHandler) |
| **Complexiteit** | Laag -- alleen state copy |

Wat het doet: Flush de input event buffer naar de InputState singleton. Reset per-frame flags (scrollDelta, click events). InputHandler vangt DOM events continu op -- InputSystem snapt die 1x per frame.

#### 2. CameraSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | Geen ECS query |
| **Schrijft** | CameraController (position, target, zoom) |
| **Leest** | InputState (WASD keys, scrollDelta, mouse position voor edge scroll) |
| **Complexiteit** | Laag |

Wat het doet: WASD/arrow keys panning (velocity * dt), edge scroll detectie (mouse binnen 20px van schermrand), zoom via scrollDelta. Clamp camera position aan map bounds [0, mapSize]. Smooth lerp op zoom.

#### 3. SelectionSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, Selected, IsUnit])` |
| **Schrijft** | `Selected.by` component (255=niet geselecteerd, 0=geselecteerd door speler) |
| **Leest** | InputState (leftClick, shiftDown, dragRect), CameraController (voor raycasting) |
| **Complexiteit** | Medium -- raycaster + box select |

Wat het doet:
- **Click select**: Three.js Raycaster van camera door muis positie. Hit test tegen alle unit meshes. Dichtsbijzijnde hit met Faction.id === playerFaction -> set Selected.by = 0. Zonder shift: clear alle andere selecties.
- **Box select**: Als drag aktief (>5px), converteer screen rect naar world-space frustum. Alle units wiens screen-space positie binnen de rect valt: select. Alleen eigen factie.
- **Shift+click**: append aan huidige selectie (toggle Selected.by).

#### 4. CommandSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Selected, Position, IsUnit])` -- gefilterd op Selected.by === 0 |
| **Schrijft** | Movement (targetX/Z, hasTarget), UnitAI (state, targetEid), Gatherer (state, targetEid), NeedsPathfinding tag |
| **Leest** | InputState (rightClick, mouseWorldX/Z), SpatialGrid (wat staat op de klik-positie?) |
| **Complexiteit** | Medium -- contextgevoelig commando |

Wat het doet:
- **Right-click**: Raycaster om te bepalen wat er geklikt is:
  - Op terrein (geen entity hit) -> MOVE commando: set Movement.targetX/Z, Movement.hasTarget=1, UnitAI.state=MOVING, add NeedsPathfinding
  - Op vijandelijke unit (andere Faction.id) -> ATTACK commando: set UnitAI.targetEid, UnitAI.state=ATTACKING
  - Op Resource entity -> GATHER commando (alleen voor workers): set Gatherer.targetEid, Gatherer.state=MOVING_TO_RESOURCE, add NeedsPathfinding
- **Alle geselecteerde units krijgen hetzelfde commando** (move naar zelfde punt -- geen formation in PoC)

#### 5. AISystem (Unit-level)

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, UnitAI, Health, IsUnit])` |
| **Schrijft** | UnitAI (state, targetEid), Movement (targetX/Z, hasTarget), NeedsPathfinding tag |
| **Leest** | Position, Attack, Faction, Health, SpatialGrid |
| **Complexiteit** | Hoog -- FSM met meerdere states |

Wat het doet per entity (FSM transitions):

```
State: IDLE
  -> scan SpatialGrid voor vijanden binnen aggroRange
  -> als vijand gevonden: state = ATTACKING, targetEid = dichtsbijzijnde vijand

State: MOVING
  -> als Movement.hasTarget === 0: state = IDLE (aangekomen)

State: ATTACKING
  -> als target dood of removed: state = IDLE
  -> als target buiten attack range: set Movement target naar target positie
  -> als target buiten leash range: state = IDLE, move naar leash origin

State: GATHERING (workers)
  -> delegate naar GatherSystem (geen transition hier)

State: DEAD
  -> skip (DeathSystem handelt af)
```

Max 3 state transitions per entity per frame (infinite loop preventie).

#### 6. StrategicAISystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Building, Faction, IsBuilding])` -- AI buildings |
| **Schrijft** | Production (unitType, queue), spawnt nieuwe entities (buildings) via archetypes |
| **Leest** | AI resources (aparte teller in AIController), BuildOrder, elapsed time |
| **Complexiteit** | Hoog -- decision tree |

Wat het doet (1x per seconde):
1. Loop door BuildOrder stappen
2. Check of resources beschikbaar zijn voor volgende stap
3. Train units: zet Production.unitType op AI barracks
4. Build gebouwen: spawn building entity op voorbepaalde locatie
5. Attack decision: als elapsedTime > 300s (5 min) OF armySize > 15: verzamel alle AI units, set Movement target naar player Town Hall positie

#### 7. PathfindingSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, Movement, NeedsPathfinding, IsUnit])` |
| **Schrijft** | Path component (waypointIndex, waypointCount, pathId), verwijdert NeedsPathfinding tag |
| **Leest** | Position, Movement (targetX/Z), PathfindingManager |
| **Complexiteit** | Medium -- delegeert naar recast |

Wat het doet:
- Voor elke entity met NeedsPathfinding: roep PathfindingManager.findPath(pos.x, pos.z, target.x, target.z) aan
- Sla waypoints op in PathBuffer
- Schrijf pathId en waypointCount naar Path component
- Verwijder NeedsPathfinding tag
- **Throttle**: max 8 path requests per frame (voorkom spike bij mass-move)

#### 8. MovementSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, Movement, Rotation, IsUnit])` -- gefilterd op Movement.hasTarget === 1 |
| **Schrijft** | Position (x, y, z), Rotation (y) |
| **Leest** | Path (waypoints), Movement (speed), Terrain (getHeightAt) |
| **Complexiteit** | Medium |

Wat het doet:
1. Lees huidige waypoint uit PathBuffer (via Path.pathId + Path.waypointIndex)
2. Bereken richting naar waypoint: `dx = wpX - pos.x, dz = wpZ - pos.z`
3. Normaliseer, vermenigvuldig met speed * dt
4. Update Position.x += vx, Position.z += vz
5. Snap Position.y = Terrain.getHeightAt(Position.x, Position.z)
6. Update Rotation.y = atan2(dx, dz)
7. Als afstand tot waypoint < 0.5: increment waypointIndex
8. Als waypointIndex >= waypointCount: arrived -> Movement.hasTarget = 0, free path in PathBuffer

#### 9. CombatSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, Attack, Health, UnitAI, IsUnit])` |
| **Schrijft** | Health.current (target), Attack.timer, IsDead tag |
| **Leest** | Position (voor range check), Attack, Armor, Faction, UnitAI (state, targetEid) |
| **Complexiteit** | Medium |

Wat het doet:
1. Filter entities met UnitAI.state === ATTACKING
2. Check of target in attack range: `distance(pos, targetPos) <= Attack.range`
3. Als buiten range: doe niets (AISystem zal movement command geven)
4. Als binnen range: tick Attack.timer -= dt
5. Als timer <= 0: fire attack
   - `effectiveDamage = Attack.damage - Armor.value[target] * 0.5`
   - `effectiveDamage = max(1, effectiveDamage)`
   - Ranged units: check Attack.range > 1 -> instant damage (geen projectiel in PoC)
   - `Health.current[target] -= effectiveDamage`
   - Reset timer: `Attack.timer = Attack.cooldown`
6. Als Health.current[target] <= 0: addComponent(IsDead, target)

**Auto-aggro** (idle units):
- Elke idle unit: query SpatialGrid voor vijanden binnen aggroRange
- Als gevonden: UnitAI.state = ATTACKING, UnitAI.targetEid = dichtsbijzijnde

#### 10. GatherSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, Gatherer, IsWorker])` |
| **Schrijft** | Gatherer (carrying, state), Resource (amount), GameState.resources, Movement, NeedsPathfinding |
| **Leest** | Gatherer, Position, Resource |
| **Complexiteit** | Medium |

Wat het doet (state machine):

```
MOVING_TO_RESOURCE:
  if distance(worker, resource) < 1.5 -> state = GATHERING, stop movement

GATHERING:
  harvest rate = 2.0/sec
  carrying += rate * dt (capped at carryCapacity=10 en resource.amount)
  resource.amount -= harvested
  if carrying >= carryCapacity -> state = RETURNING
    set movement target = nearest own TownHall
    add NeedsPathfinding

RETURNING:
  if distance(worker, townHall) < 2.0 -> deposit
    GameState.resources[faction].gold += carrying
    carrying = 0
    state = MOVING_TO_RESOURCE (auto-return)
    set movement target = same resource
    add NeedsPathfinding
```

#### 11. ProductionSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Building, Production, IsBuilding])` |
| **Schrijft** | Production (progress), spawnt entity via archetypes, GameState (resources deducted on queue, population) |
| **Leest** | Production (unitType, duration, queueSlots), Building (complete), Faction |
| **Complexiteit** | Medium |

Wat het doet:
1. Filter buildings met Production.unitType !== 255 en Building.complete === 1
2. Tick: Production.progress += dt / Production.duration
3. Als progress >= 1.0:
   - Spawn unit entity via createWorker/createInfantry/createRanged()
   - Positie = building positie + offset naar rally point
   - Shift queue: slot0=slot1, slot1=slot2, etc.
   - Als queue niet leeg: start volgende unit (check resources)
   - Als queue leeg: Production.unitType = 255

#### 12. DeathSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([IsDead])` |
| **Schrijft** | Verwijdert entities (removeEntity), verwijdert meshes (EntityMeshManager) |
| **Leest** | IsDead tag, een interne death timer per entity |
| **Complexiteit** | Laag |

Wat het doet:
1. Query alle IsDead entities
2. Eerste keer: start 2s death timer, scale mesh down (visuele "death")
3. Na 2s: removeEntity(world, eid), EntityMeshManager.removeMesh(eid), emit "unit-died" event

#### 13. FogOfWarSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, Visibility, Faction])` -- gefilterd op Faction.id === playerFaction |
| **Schrijft** | FogOfWarRenderer (texture update) |
| **Leest** | Position, Visibility.range |
| **Complexiteit** | Medium |

Wat het doet (5x per seconde, accumuleer dt):
1. Verzamel alle player entities met Visibility component
2. Voor elke entity: `{ x: Position.x[eid], z: Position.z[eid], range: Visibility.range[eid] }`
3. Roep FogOfWarRenderer.update(entities) aan
4. Renderer stampt circles in visibility buffer, merget explored, update texture

#### 14. RenderSyncSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, Rotation, RenderRef])` |
| **Schrijft** | Three.js Object3D.position, Object3D.rotation |
| **Leest** | Position (x,y,z), Rotation (y), RenderRef (meshId) |
| **Complexiteit** | Laag -- simpele data copy |

Wat het doet:
1. Voor elke entity met RenderRef: haal Object3D op uit EntityMeshManager
2. Set object3d.position.set(Position.x, Position.y, Position.z)
3. Set object3d.rotation.y = Rotation.y
4. **Fog of War visibility**: als entity niet van player faction en positie in fog -> object3d.visible = false, anders true

#### 15. UISystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Selected, IsUnit])`, `defineQuery([Selected, Building, IsBuilding])` |
| **Schrijft** | HTML DOM (via HUD.ts) |
| **Leest** | GameState (resources, population), Selected entities (health, type, faction), Production (queue, progress) |
| **Complexiteit** | Medium -- DOM manipulation |

Wat het doet:
- Update resource display: `Gold: ${resources.gold}`
- Update population: `Pop: ${currentPop}/${maxPop}`
- Selected units panel: toon icons + HP bars voor alle geselecteerde units (max 12 in panel)
- Selected building: toon production queue + progress bar + train buttons
- Health bar rendering: trigger HealthBarRenderer update voor geselecteerde + damaged units

#### 16. MinimapSystem

| Eigenschap | Waarde |
|-----------|--------|
| **Query** | `defineQuery([Position, Faction, IsUnit])`, `defineQuery([Position, Faction, IsBuilding])` |
| **Schrijft** | MinimapRenderer (canvas redraw) |
| **Leest** | Position, Faction, CameraController (viewport rect) |
| **Complexiteit** | Medium |

Wat het doet (5x per seconde):
1. Clear minimap canvas
2. Draw terrain background (pre-rendered, cached)
3. For each unit: draw dot (groen=player, rood=AI) op proportionele positie
4. For each building: draw rect (kleur per faction)
5. Draw camera viewport rectangle (wit)
6. **Click handler**: als muis op minimap canvas -> bereken world positie -> CameraController.setTarget()

---

## 5. Data Flow

### 5.1 Player Command Flow

```
User clicks right-click on terrain
        │
        ▼
InputHandler.ts ──── mousedown event, buttons=2
        │
        ▼
InputState.ts ────── rightClickX/Y = mousePos, rightClicked = true
        │
        ▼
InputSystem.ts ───── (snapshot, geen transformatie)
        │
        ▼
CommandSystem.ts ─── Raycaster: hit test against ground plane
        │              │
        │              ▼ hit = terrain (geen entity)
        │              Action: MOVE
        │
        ├── Voor elke geselecteerde unit:
        │     Movement.targetX = hitPoint.x
        │     Movement.targetZ = hitPoint.z
        │     Movement.hasTarget = 1
        │     UnitAI.state = MOVING
        │     addComponent(NeedsPathfinding)
        │
        ▼
PathfindingSystem.ts ── Query NeedsPathfinding entities
        │                  findPath(currentPos, targetPos)
        │                  Schrijf waypoints naar PathBuffer
        │                  Path.pathId = bufferSlot
        │                  removeComponent(NeedsPathfinding)
        │
        ▼
MovementSystem.ts ──── Volg waypoints
        │               Position.x += direction.x * speed * dt
        │               Position.z += direction.z * speed * dt
        │               Position.y = terrain.getHeightAt(x, z)
        │
        ▼
RenderSyncSystem.ts ── Object3D.position = (Position.x, Position.y, Position.z)
        │
        ▼
renderer.render(scene, camera) ── Unit beweegt op scherm
```

### 5.2 Attack Flow

```
User right-clicks enemy unit
        │
        ▼
CommandSystem.ts ─── Raycaster hit = entity met andere Faction.id
        │              Action: ATTACK
        │
        ├── Voor elke geselecteerde unit:
        │     UnitAI.state = ATTACKING
        │     UnitAI.targetEid = enemy entity
        │     if distance > Attack.range:
        │       Movement.targetX = enemy.Position.x
        │       Movement.targetZ = enemy.Position.z
        │       Movement.hasTarget = 1
        │       addComponent(NeedsPathfinding)
        │
        ▼
AISystem.ts ────── State: ATTACKING
        │           if target alive AND in range: do nothing (CombatSystem fires)
        │           if target alive AND out of range: update move target
        │           if target dead: state = IDLE
        │           if target out of leash: state = IDLE, return to origin
        │
        ▼
CombatSystem.ts ── state === ATTACKING AND distance <= Attack.range
        │           Attack.timer -= dt
        │           if timer <= 0:
        │             damage = Attack.damage - Armor.value[target] * 0.5
        │             damage = max(1, damage)
        │             Health.current[target] -= damage
        │             Attack.timer = Attack.cooldown
        │             if Health.current[target] <= 0:
        │               addComponent(IsDead, target)
        │
        ▼
DeathSystem.ts ─── IsDead entity:
        │           start death timer (2s)
        │           scale mesh to 0
        │           after 2s: removeEntity()
        │           emit "unit-died" event
        │
        ▼
EventBus ────── "unit-died" -> StrategicAISystem luistert (army count update)
                "unit-died" -> UISystem luistert (clear selection als geselecteerd)
```

### 5.3 Gather-Return-Gather Loop

```
User right-clicks Gold Mine with worker selected
        │
        ▼
CommandSystem.ts ─── Hit entity met IsResource tag
        │              Action: GATHER
        │
        ├── Worker entity:
        │     Gatherer.targetEid = goldMine
        │     Gatherer.resourceType = 0 (gold)
        │     Gatherer.state = MOVING_TO_RESOURCE
        │     Movement.targetX = goldMine.Position.x
        │     Movement.targetZ = goldMine.Position.z
        │     Movement.hasTarget = 1
        │     addComponent(NeedsPathfinding)
        │
        ▼ (PathfindingSystem + MovementSystem brengen worker naar mine)
        │
        ▼
GatherSystem.ts ── state = MOVING_TO_RESOURCE, distance < 1.5
        │           state = GATHERING
        │           Movement.hasTarget = 0
        │
        │          (elke frame)
        │           carrying += 2.0 * dt
        │           Resource.amount[mine] -= 2.0 * dt
        │
        │          carrying >= 10 (carryCapacity)
        │           state = RETURNING
        │           Movement.target = nearest TownHall
        │           addComponent(NeedsPathfinding)
        │
        ▼ (MovementSystem brengt worker naar TownHall)
        │
        │          distance to TownHall < 2.0
        │           GameState.resources[faction].gold += 10
        │           carrying = 0
        │           state = MOVING_TO_RESOURCE (auto-return)
        │           Movement.target = same goldMine
        │           addComponent(NeedsPathfinding)
        │
        └── Loop herhaalt tot mine leeg of worker gestoord
```

### 5.4 Building Production Flow

```
Player clicks "Train Carnavalvierder" button in UI
        │
        ▼
UISystem.ts ──── Button click handler
        │          Check: GameState.resources.gold >= 75
        │          Check: GameState.population.current < GameState.population.max
        │          Deduct: GameState.resources.gold -= 75
        │          Write: Production.queueSlot[next empty] = 1 (Infantry)
        │          If no current production: Production.unitType = 1, progress = 0
        │
        ▼
ProductionSystem.ts ── Building has Production.unitType !== 255
        │                Production.progress += dt / Production.duration
        │                (18 seconden voor Carnavalvierder)
        │
        │                progress >= 1.0:
        │                  entity = createInfantry(world, rallyX, rallyZ)
        │                  Faction.id[entity] = building's faction
        │                  GameState.population.current += 1
        │                  Shift queue
        │                  If queue has more: start next
        │
        ▼
RenderSyncSystem ── Nieuwe unit mesh verschijnt bij rally point
```

### 5.5 AI Decision Flow

```
StrategicAISystem.ts (1x per seconde)
        │
        ├── Phase: OPENING (0-180s)
        │     Loop door BuildOrder:
        │       Step "train worker x4": check AI.resources >= 50 per worker
        │         -> Production.unitType = Worker op AI TownHall
        │       Step "build barracks": check AI.resources >= 200
        │         -> createBarracks() op voorbepaalde positie
        │       Step "train infantry x5": check AI.resources >= 75 per unit
        │         -> Production.unitType = Infantry op AI Barracks
        │
        ├── Phase: MIDGAME (180-300s)
        │     Continue BuildOrder
        │     Train mix van infantry + ranged
        │
        └── Phase: ATTACK (>300s of armySize > 15)
              Verzamel alle AI combat units (niet workers)
              Voor elke unit:
                UnitAI.state = ATTACKING
                Movement.targetX = player TownHall.Position.x
                Movement.targetZ = player TownHall.Position.z
                Movement.hasTarget = 1
                addComponent(NeedsPathfinding)
```

---

## 6. Render Architectuur

### 6.1 Scene Graph (PoC)

```
THREE.Scene
├── AmbientLight (intensity: 0.6, color: 0xffffff)
├── DirectionalLight (intensity: 0.8, color: 0xfff4e6, position: [50, 80, 50])
├── TerrainGroup
│   └── TerrainMesh (PlaneGeometry 128x128, vertex-colored, displaced)
├── EntityGroup
│   ├── [dynamisch] Mesh per unit entity (BoxGeometry/CylinderGeometry/ConeGeometry)
│   └── [dynamisch] Mesh per building entity (BoxGeometry, groter)
├── ResourceGroup
│   └── [dynamisch] Mesh per gold mine (DodecahedronGeometry, geel)
├── SelectionGroup
│   └── [dynamisch] RingGeometry per geselecteerde unit (flat, groen/rood)
├── HealthBarGroup
│   └── [dynamisch] Sprite per visible health bar (canvas texture)
├── FogOfWarGroup
│   └── FogOfWarMesh (PlaneGeometry 128x128, boven terrain, CanvasTexture, transparent blend)
└── BoxSelectOverlay (HTML div, geen Three.js)
```

### 6.2 Unit Rendering (Simpele Geometrie)

In het PoC gebruiken we primitieve geometrieen in plaats van GLB modellen. Dit elimineert de asset pipeline als blocker.

```typescript
// EntityMeshManager.ts - mesh creation per type

Unit Type       | Geometry                        | Kleur (Brabanders)   | Kleur (AI)
----------------|---------------------------------|---------------------|------------------
Worker (Boer)   | CylinderGeometry(0.3, 0.3, 1)  | 0xE8A839 (goud)     | 0x3498DB (blauw)
Infantry        | BoxGeometry(0.5, 1.2, 0.5)      | 0xE67E22 (oranje)   | 0x2980B9 (blauw)
Ranged          | ConeGeometry(0.3, 1.0, 6)       | 0xD35400 (donker-O) | 0x1F618D (d-blauw)
TownHall        | BoxGeometry(3, 2, 3)            | 0x8B4513 (bruin)    | 0x34495E (grijs-B)
Barracks        | BoxGeometry(2, 1.5, 2)          | 0xA0522D (sienna)   | 0x2C3E50 (d-grijs)
GoldMine        | DodecahedronGeometry(1.2)       | 0xFFD700 (goud)     | --
```

Elke unit mesh heeft een licht `MeshLambertMaterial` met de faction kleur. Geen textures in PoC.

### 6.3 Terrain Rendering

```typescript
// TerrainRenderer.ts

// Stap 1: PlaneGeometry(128, 128, 127, 127) = 16.384 vertices
// Stap 2: Displace Y vertices uit heightmap data
// Stap 3: Bereken vertex colors gebaseerd op hoogte:
//   - y < 0.5  : 0x4A7C3F (donkergroen, laag gras)
//   - y < 3.0  : 0x5B8C4F (groen, gras)
//   - y < 6.0  : 0x8B7355 (bruin, heuvel)
//   - y >= 6.0 : 0x9E9E9E (grijs, rots)
// Stap 4: MeshLambertMaterial met vertexColors: true
// Stap 5: receiveShadow = false (geen shadows in PoC)
```

### 6.4 Selectie-Cirkels

```typescript
// SelectionRenderer.ts

// Per geselecteerde unit: flat ring mesh
// Geometry: RingGeometry(innerRadius=0.4, outerRadius=0.6, thetaSegments=32)
// Material: MeshBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.6 })
// Positie: unit position met y = terrain height + 0.05 (voorkom z-fighting)
// Update: volg unit positie elke frame

// Vijandelijke selectie (als je een vijand klikt voor info):
// Zelfde maar color: 0xFF0000

// Pulsing animatie:
// scale.x = scale.z = 1.0 + Math.sin(time * 4) * 0.05
```

### 6.5 Health Bars

```typescript
// HealthBarRenderer.ts

// Aanpak: Canvas2D-gebaseerde Sprites (billboard)
// Per unit met HP < max OF die geselecteerd is:
//   1. Maak offscreen canvas (64x8 pixels)
//   2. Teken rode balk (achtergrond, volledige breedte)
//   3. Teken groene balk (voorgrond, proportioneel aan HP/maxHP)
//   4. Maak CanvasTexture -> SpriteMaterial -> Sprite
//   5. Positie: unit position + Vector3(0, 1.8, 0) (boven unit)
//   6. Scale: 1.5 breed, 0.2 hoog
//   7. Billboard: sprites zijn altijd camera-facing (Three.js Sprite default)

// Pool: max 50 health bar sprites tegelijk
// Recycling: verberg als unit full HP en niet geselecteerd
```

### 6.6 Minimap

```typescript
// MinimapRenderer.ts

// Offscreen HTMLCanvasElement (200x200 pixels)
// Geplaatst in HUD overlay (bottom-left, position: absolute)

// Render stappen (5x per seconde):
// 1. Draw terrain background (pre-computed: terrain heightmap -> kleur, 128x128 -> scale naar 200x200)
// 2. Draw unit dots:
//    - Eigen units: groene dots (3x3 pixels)
//    - AI units: rode dots (3x3 pixels)
//    - Posities: worldPos / mapSize * canvasSize
// 3. Draw building rects:
//    - Eigen buildings: groene rect (5x5)
//    - AI buildings: rode rect (5x5)
// 4. Draw gold mines: gele dots (4x4)
// 5. Draw camera viewport:
//    - Bereken camera frustum projected op terrain plane
//    - Teken witte rectangle (1px border)

// Interactie:
// Click op minimap canvas -> bereken world positie -> CameraController.setTarget(worldX, worldZ)
```

### 6.7 Fog of War

```typescript
// FogOfWarRenderer.ts

// Offscreen canvas (128x128) = 1:1 met map resolution
// Twee buffers:
//   exploredBuffer: Uint8Array(128*128) - persistent (nooit terug naar 0)
//   visibleBuffer: Uint8Array(128*128) - per-update reset

// Update cycle (5x per sec):
// 1. visibleBuffer.fill(0)
// 2. Voor elke player unit/building met Visibility:
//    stampCircle(pos.x, pos.z, visibility.range) -> set pixels in visibleBuffer
// 3. Merge: exploredBuffer[i] = max(exploredBuffer[i], visibleBuffer[i])
// 4. Render naar canvas:
//    - visibleBuffer[i] > 0: pixel alpha = 0 (transparant, terrein zichtbaar)
//    - exploredBuffer[i] > 0: pixel alpha = 150 (semi-donker)
//    - anders: pixel alpha = 240 (bijna zwart)
// 5. Update CanvasTexture (texture.needsUpdate = true)

// Three.js mesh:
// PlaneGeometry(128, 128) op y = terrain max height + 1
// MeshBasicMaterial met CanvasTexture, transparent: true, depthWrite: false
// Blend mode: multiply of custom (alpha blend met terrain)

// Unit visibility:
// RenderSyncSystem checkt: als entity niet player faction:
//   -> lees fogOfWar texture op entity positie
//   -> als niet visible (visibleBuffer[pos] === 0): mesh.visible = false
//   -> anders: mesh.visible = true
```

---

## 7. Code Patterns

### 7.1 System-to-System Communicatie

Systems communiceren via **drie kanalen**:

| Kanaal | Wanneer gebruiken | Voorbeeld |
|--------|------------------|-----------|
| **ECS Components** | Per-entity state dat andere systems moeten lezen | CommandSystem schrijft `Movement.targetX`, MovementSystem leest het |
| **ECS Tag Components** | Dirty flags, one-shot signalen | CommandSystem adds `NeedsPathfinding`, PathfindingSystem removes het |
| **EventBus** | One-to-many notificaties, niet per-entity | DeathSystem emits `unit-died`, UISystem + StrategicAISystem luisteren |

**Regels:**
1. Systems schrijven NOOIT naar components die een ander system "bezit" (write ownership)
2. Tag components zijn altijd "request" of "flag" -- ze worden door de consumer verwijderd
3. EventBus events zijn fire-and-forget -- geen return values

### 7.2 Component Write Ownership

| Component | Geschreven door | Gelezen door |
|-----------|----------------|-------------|
| Position | MovementSystem | Alle render systems, CombatSystem, AISystem, GatherSystem |
| Rotation | MovementSystem | RenderSyncSystem |
| Movement | CommandSystem, AISystem, GatherSystem, StrategicAISystem | PathfindingSystem, MovementSystem |
| Health | CombatSystem | AISystem, UISystem, DeathSystem, HealthBarRenderer |
| Attack | (init only) | CombatSystem |
| Armor | (init only) | CombatSystem |
| Selected | SelectionSystem | CommandSystem, UISystem, RenderSyncSystem |
| Faction | (init only) | Alle systems (filter) |
| UnitType | (init only) | UISystem, EntityMeshManager |
| UnitAI | AISystem, CommandSystem | CombatSystem, MovementSystem |
| Gatherer | GatherSystem, CommandSystem | GatherSystem |
| Building | ProductionSystem, (init) | ProductionSystem, UISystem |
| Production | ProductionSystem, UISystem (queue add) | ProductionSystem, UISystem |
| Visibility | (init only) | FogOfWarSystem |
| Resource | GatherSystem | GatherSystem, UISystem, MinimapSystem |
| Path | PathfindingSystem | MovementSystem |
| RenderRef | (init only) | RenderSyncSystem |
| NeedsPathfinding | CommandSystem, AISystem, GatherSystem | PathfindingSystem (removes) |
| IsDead | CombatSystem | DeathSystem (removes entity) |

### 7.3 Three.js <-> ECS Koppeling

```typescript
// RenderRef component: koppelt ECS entity aan Three.js Object3D

const RenderRef = defineComponent({
  meshId: Types.u32  // Index in EntityMeshManager.meshes array
});

// EntityMeshManager houdt een sparse array:
class EntityMeshManager {
  private meshes: Map<number, THREE.Object3D> = new Map(); // eid -> Object3D
  private scene: THREE.Group;

  createMesh(eid: number, unitTypeId: number, factionId: number): void {
    const geometry = this.getGeometryForType(unitTypeId);
    const material = this.getMaterialForFaction(factionId, unitTypeId);
    const mesh = new THREE.Mesh(geometry, material);

    this.meshes.set(eid, mesh);
    this.scene.add(mesh);

    // Link in ECS
    RenderRef.meshId[eid] = eid; // Use eid as key
  }

  getMesh(eid: number): THREE.Object3D | undefined {
    return this.meshes.get(eid);
  }

  removeMesh(eid: number): void {
    const mesh = this.meshes.get(eid);
    if (mesh) {
      this.scene.remove(mesh);
      // Dispose geometry/material only if not shared
      this.meshes.delete(eid);
    }
  }
}

// RenderSyncSystem koppelt elke frame:
function renderSyncSystem(world: World): void {
  const entities = renderableQuery(world);
  for (const eid of entities) {
    const mesh = entityMeshManager.getMesh(eid);
    if (!mesh) continue;

    mesh.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
    mesh.rotation.y = Rotation.y[eid];
  }
}
```

### 7.4 Input Handling Pattern

```typescript
// InputHandler registreert DOM events -> schrijft naar InputState
// InputSystem leest InputState 1x per frame
// Andere systems lezen InputState NOOIT direct -- alleen via CommandSystem/SelectionSystem

// InputState is een singleton met per-frame en persistent state:

interface InputStateData {
  // Persistent (houden waarde tot veranderd)
  mouseScreenX: number;      // Screen-space mouse X
  mouseScreenY: number;      // Screen-space mouse Y
  mouseWorldX: number;       // World-space mouse X (raycasted)
  mouseWorldZ: number;       // World-space mouse Z (raycasted)
  keysDown: Set<string>;     // Currently pressed keys
  leftButtonDown: boolean;
  rightButtonDown: boolean;

  // Per-frame (reset na lezen)
  leftClicked: boolean;      // True op frame van mouseup (left)
  rightClicked: boolean;     // True op frame van mouseup (right)
  scrollDelta: number;       // Scroll wheel delta (reset per frame)

  // Drag state
  dragActive: boolean;       // True als links ingedrukt + mouse moved > 5px
  dragStartX: number;        // Screen X waar drag begon
  dragStartY: number;        // Screen Y waar drag begon
  dragEndX: number;          // Current screen X
  dragEndY: number;          // Current screen Y
}

// Na InputSystem: reset per-frame flags
function resetPerFrame(state: InputStateData): void {
  state.leftClicked = false;
  state.rightClicked = false;
  state.scrollDelta = 0;
}
```

### 7.5 Camera Besturing

```typescript
// CameraController.ts

class CameraController {
  private camera: THREE.PerspectiveCamera;
  private targetX: number = 64;   // Map center
  private targetZ: number = 64;
  private height: number = 40;    // Camera hoogte
  private zoom: number = 1.0;     // 1.0 = default
  private minZoom: number = 0.5;  // Ingezoomd
  private maxZoom: number = 2.0;  // Uitgezoomd

  private panSpeed: number = 30;  // World units per seconde
  private zoomSpeed: number = 0.1;
  private edgeScrollMargin: number = 20; // Pixels van schermrand

  // Perspective angle: camera kijkt schuin naar beneden (~60 graden)
  // Camera positie = (targetX, height * zoom, targetZ + offset)
  // Camera lookAt = (targetX, 0, targetZ)

  update(dt: number, input: InputStateData, canvasWidth: number, canvasHeight: number): void {
    let dx = 0, dz = 0;

    // WASD / arrow keys
    if (input.keysDown.has('KeyW') || input.keysDown.has('ArrowUp'))    dz -= 1;
    if (input.keysDown.has('KeyS') || input.keysDown.has('ArrowDown'))  dz += 1;
    if (input.keysDown.has('KeyA') || input.keysDown.has('ArrowLeft'))  dx -= 1;
    if (input.keysDown.has('KeyD') || input.keysDown.has('ArrowRight')) dx += 1;

    // Edge scroll
    if (input.mouseScreenX < this.edgeScrollMargin)                    dx -= 1;
    if (input.mouseScreenX > canvasWidth - this.edgeScrollMargin)      dx += 1;
    if (input.mouseScreenY < this.edgeScrollMargin)                    dz -= 1;
    if (input.mouseScreenY > canvasHeight - this.edgeScrollMargin)     dz += 1;

    // Normalize diagonal
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      dx /= len;
      dz /= len;
    }

    // Apply
    this.targetX += dx * this.panSpeed * this.zoom * dt;
    this.targetZ += dz * this.panSpeed * this.zoom * dt;

    // Zoom
    this.zoom -= input.scrollDelta * this.zoomSpeed;
    this.zoom = clamp(this.zoom, this.minZoom, this.maxZoom);

    // Clamp to map
    this.targetX = clamp(this.targetX, 0, 128);
    this.targetZ = clamp(this.targetZ, 0, 128);

    // Update Three.js camera
    const camOffset = this.height * this.zoom;
    this.camera.position.set(this.targetX, camOffset, this.targetZ + camOffset * 0.6);
    this.camera.lookAt(this.targetX, 0, this.targetZ);
  }

  setTarget(x: number, z: number): void {
    this.targetX = x;
    this.targetZ = z;
  }
}
```

### 7.6 EventBus Pattern

```typescript
// EventBus.ts - Typed event system

type GameEvents = {
  'unit-died':       { eid: number; factionId: number; unitType: number };
  'building-placed': { eid: number; factionId: number; buildingType: number; x: number; z: number };
  'resource-deposited': { factionId: number; resourceType: number; amount: number };
  'unit-trained':    { eid: number; factionId: number; unitType: number };
  'game-over':       { winnerId: number; reason: 'annihilation' | 'surrender' };
};

class EventBus {
  private listeners: Map<string, Function[]> = new Map();

  on<K extends keyof GameEvents>(event: K, callback: (data: GameEvents[K]) => void): void {
    const list = this.listeners.get(event) ?? [];
    list.push(callback);
    this.listeners.set(event, list);
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const list = this.listeners.get(event);
    if (list) {
      for (const cb of list) cb(data);
    }
  }

  off<K extends keyof GameEvents>(event: K, callback: Function): void {
    const list = this.listeners.get(event);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx >= 0) list.splice(idx, 1);
    }
  }
}

// Singleton
export const eventBus = new EventBus();
```

### 7.7 Object Pooling voor Hot Path

```typescript
// Voorkom GC pressure in per-frame systems

// Gedeelde temp objecten (module-level, hergebruikt)
const _v3a = new THREE.Vector3();
const _v3b = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();

// In MovementSystem:
function updatePosition(eid: number, dt: number): void {
  // NOOIT: const dir = new THREE.Vector3(...)
  // WEL:
  _v3a.set(waypointX - Position.x[eid], 0, waypointZ - Position.z[eid]);
  _v3a.normalize().multiplyScalar(Movement.speed[eid] * dt);
  Position.x[eid] += _v3a.x;
  Position.z[eid] += _v3a.z;
}
```

### 7.8 Game Loop Pattern

```typescript
// Game.ts

class Game {
  private world: World;
  private systems: Array<(world: World) => void>;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor() {
    // Init in order: world -> components -> renderer -> systems -> map
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(time: number): void {
    if (!this.running) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.05); // Cap at 50ms (20fps min)
    this.lastTime = time;

    // Update world metadata
    worldMeta.dt = dt;
    worldMeta.time += dt;
    worldMeta.tick++;

    // Run all systems in order
    for (const system of this.systems) {
      system(this.world);
    }

    // Render
    this.renderer.render(this.scene, this.camera);

    // Next frame
    requestAnimationFrame((t) => this.loop(t));
  }

  pause(): void {
    this.running = false;
    worldMeta.gameState = 'paused';
  }

  resume(): void {
    this.running = true;
    this.lastTime = performance.now(); // Prevent dt spike
    worldMeta.gameState = 'playing';
    requestAnimationFrame((t) => this.loop(t));
  }
}
```

---

## 8. Implementatie Volgorde

### Dag 1: Project Setup + Terrein + Camera + Rendering Framework

**Doel**: Een draaiende Three.js scene met terrein, camera controls, en een placeholder unit.

| Volgorde | Bestand | Wat wordt gebouwd |
|----------|---------|------------------|
| 1.1 | `package.json` | npm init, install three, bitecs, recast-navigation, vite, typescript |
| 1.2 | `tsconfig.json` | Strict mode, ES2022 target, paths |
| 1.3 | `vite.config.ts` | Dev server config, base path |
| 1.4 | `.gitignore` | node_modules, dist |
| 1.5 | `src/constants.ts` | MAP_SIZE=128, HEIGHT_SCALE=10, faction kleuren, unit stats |
| 1.6 | `src/utils/math.ts` | clamp, lerp, distance2D |
| 1.7 | `src/utils/SimplexNoise.ts` | 2D simplex noise |
| 1.8 | `src/terrain/Terrain.ts` | Heightmap data class, getHeightAt() |
| 1.9 | `src/terrain/TerrainGenerator.ts` | Generate heightmap met simplex noise |
| 1.10 | `src/renderer/SceneManager.ts` | THREE.Scene, Renderer, Camera, resize handler |
| 1.11 | `src/renderer/CameraController.ts` | Pan, zoom, edge scroll, clamp |
| 1.12 | `src/renderer/TerrainRenderer.ts` | PlaneGeometry + vertex displacement + vertex colors |
| 1.13 | `src/input/InputState.ts` | Input state singleton |
| 1.14 | `src/input/InputHandler.ts` | DOM event listeners, raycaster |
| 1.15 | `src/systems/InputSystem.ts` | Snapshot input state per frame |
| 1.16 | `src/systems/CameraSystem.ts` | Camera update vanuit input |
| 1.17 | `index.html` | Canvas + basic HUD container |
| 1.18 | `src/main.ts` | Bootstrap (simplified, hardcoded loop) |

**Eindresultaat dag 1**: Terrain met heuvels, camera WASD/zoom/edge scroll werkt, je kunt rondkijken over de map.

**Verificatie**:
- [x] Terrain rendered met vertex kleuren
- [x] Camera pan met WASD en edge scroll
- [x] Zoom met scrollwiel
- [x] No console errors

---

### Dag 2: ECS + Units + Selection + Movement

**Doel**: Units op het veld, selecteerbaar met click en box select, beweegbaar met right-click.

| Volgorde | Bestand | Wat wordt gebouwd |
|----------|---------|------------------|
| 2.1 | `src/ecs/components.ts` | Alle PoC components |
| 2.2 | `src/ecs/tags.ts` | IsUnit, IsBuilding, IsResource, IsDead, IsWorker, NeedsPathfinding |
| 2.3 | `src/ecs/world.ts` | createWorld(1024) |
| 2.4 | `src/ecs/queries.ts` | Alle defineQuery calls |
| 2.5 | `src/ecs/archetypes.ts` | createWorker, createInfantry, createRanged (met component values uit constants) |
| 2.6 | `src/renderer/EntityMeshManager.ts` | Mesh creation per unit type, faction kleuren |
| 2.7 | `src/renderer/SelectionRenderer.ts` | Ring mesh onder geselecteerde units |
| 2.8 | `src/systems/SelectionSystem.ts` | Click select + box select |
| 2.9 | `src/systems/CommandSystem.ts` | Right-click move command (simpel, zonder pathfinding -- directe lijn) |
| 2.10 | `src/systems/MovementSystem.ts` | Volg waypoints / directe movement, terrain snap |
| 2.11 | `src/systems/RenderSyncSystem.ts` | ECS Position -> Object3D.position |
| 2.12 | `src/core/EventBus.ts` | Typed event bus |
| 2.13 | `src/core/GameState.ts` | Player resources, population |
| 2.14 | `src/core/Game.ts` | Game loop met system pipeline |
| 2.15 | `src/utils/SpatialGrid.ts` | Spatial hash grid |

**Update main.ts**: Integreer Game class, spawn test units.

**Eindresultaat dag 2**: 6 units op het veld (3 types), selecteerbaar, beweegbaar naar right-click positie. Units volgen directe lijn (pathfinding komt dag 3).

**Verificatie**:
- [x] Units zichtbaar op terrain (juiste kleuren)
- [x] Click select werkt (groen ring verschijnt)
- [x] Box select werkt (meerdere units)
- [x] Shift+click append werkt
- [x] Right-click move: units bewegen naar punt
- [x] Units volgen terrain hoogte

---

### Dag 3: Pathfinding + Resources + Buildings

**Doel**: A* pathfinding om obstakels heen, gold mines om te gatheren, buildings te plaatsen en units te trainen.

| Volgorde | Bestand | Wat wordt gebouwd |
|----------|---------|------------------|
| 3.1 | `src/pathfinding/PathBuffer.ts` | Path storage |
| 3.2 | `src/pathfinding/PathfindingManager.ts` | recast-navigation init, navmesh build, findPath() |
| 3.3 | `src/systems/PathfindingSystem.ts` | NeedsPathfinding -> findPath -> write Path component |
| 3.4 | Update `MovementSystem.ts` | Waypoint following (ipv directe lijn) |
| 3.5 | Update `archetypes.ts` | createTownHall(), createBarracks(), createGoldMine() |
| 3.6 | `src/systems/GatherSystem.ts` | Worker gather loop |
| 3.7 | `src/systems/ProductionSystem.ts` | Building production queue + unit spawning |
| 3.8 | `src/map/MapSetup.ts` | Initial map layout: 2x TownHall, 4-6x GoldMine, start workers |
| 3.9 | `src/ui/HUD.ts` | Resource display, selection panel, train buttons |
| 3.10 | `src/ui/hud.css` | HUD styling |
| 3.11 | Update `CommandSystem.ts` | Right-click on resource = gather, right-click on building = (niets in PoC) |
| 3.12 | Update `index.html` | HUD HTML structuur |

**Eindresultaat dag 3**: Workers gatheren gold, brengen naar TownHall, resources tellen op. Barracks kan infantry/ranged trainen (buttons in HUD). Pathfinding werkt om heuvels/buildings heen.

**Verificatie**:
- [x] Workers lopen naar gold mine en gatheren
- [x] Workers lopen terug naar TownHall en depositen
- [x] Auto-return na deposit
- [x] Resource teller stijgt in HUD
- [x] Train Worker button werkt (unit spawnt)
- [x] Train Infantry/Ranged werkt
- [x] Pathfinding loopt om obstakels heen
- [x] Population teller klopt

---

### Dag 4: Combat + AI

**Doel**: Units kunnen vechten, een AI tegenstander bouwt op en valt aan.

| Volgorde | Bestand | Wat wordt gebouwd |
|----------|---------|------------------|
| 4.1 | `src/systems/CombatSystem.ts` | Damage calculation, attack timer, auto-aggro |
| 4.2 | `src/systems/AISystem.ts` | Unit AI FSM (idle, moving, attacking, gathering) |
| 4.3 | `src/systems/DeathSystem.ts` | Death timer + entity removal |
| 4.4 | `src/ai/BuildOrder.ts` | BRABANDERS_RUSH build order data |
| 4.5 | `src/ai/AIController.ts` | AI resource management, build order execution, attack decision |
| 4.6 | `src/systems/StrategicAISystem.ts` | Wrapper die AIController.update() aanroept |
| 4.7 | `src/renderer/HealthBarRenderer.ts` | HP bars boven units |
| 4.8 | Update `CommandSystem.ts` | Right-click on enemy = attack command |
| 4.9 | Update `MapSetup.ts` | AI start positie, AI workers, AI TownHall |

**Eindresultaat dag 4**: Full combat werkt. AI bouwt economy, traint army, valt na 5 min aan. Player kan verdedigen en terugvechten. Basis win/lose condities (Town Hall vernietigd = game over).

**Verificatie**:
- [x] Right-click vijand = units vallen aan
- [x] Damage berekening klopt (attack - armor*0.5, min 1)
- [x] Units sterven bij HP 0
- [x] Health bars zichtbaar
- [x] AI traint workers en combat units
- [x] AI valt aan na ~5 minuten
- [x] Auto-aggro: idle units vallen nabije vijanden aan
- [x] Win/lose condities

---

### Dag 5: Fog of War + Minimap + UI + Polish

**Doel**: Fog of war, minimap, gepolijste UI, game-ready PoC.

| Volgorde | Bestand | Wat wordt gebouwd |
|----------|---------|------------------|
| 5.1 | `src/renderer/FogOfWarRenderer.ts` | Visibility canvas, circle stamping, texture |
| 5.2 | `src/systems/FogOfWarSystem.ts` | Update fog texture, hide/show vijandelijke units |
| 5.3 | `src/renderer/MinimapRenderer.ts` | Minimap canvas rendering |
| 5.4 | `src/systems/MinimapSystem.ts` | Minimap update + click-to-move-camera |
| 5.5 | `src/systems/UISystem.ts` | Full HUD updates (resources, population, selection panel, production) |
| 5.6 | `src/core/AssetLoader.ts` | Loading screen met progress (voor toekomstig GLB laden) |
| 5.7 | Update `hud.css` | Polish: layout, kleuren, responsive |
| 5.8 | Update `Game.ts` | Win/lose check, pause menu, restart |
| 5.9 | Update `index.html` | Loading screen HTML, game over overlay |
| 5.10 | Update `RenderSyncSystem.ts` | Fog of war visibility filtering |
| 5.11 | Update `CameraSystem.ts` | Minimap click integration |

**Eindresultaat dag 5**: Volledige PoC. Fog of war verbergt vijanden tot je ze scouted. Minimap toont overzicht. UI is functioneel en leesbaar. Game is speelbaar van begin tot eind.

**Verificatie**:
- [x] Fog of war: zwart = onverkend, grijs = verkend, zichtbaar = binnen unit range
- [x] Vijandelijke units onzichtbaar in fog
- [x] Minimap toont terrain, units, buildings, camera rect
- [x] Click op minimap verplaatst camera
- [x] Resources + population teller altijd up-to-date
- [x] Selection panel toont geselecteerde unit info
- [x] Train buttons alleen beschikbaar als resources + pop cap toelaten
- [x] Game over screen bij Town Hall destruction
- [x] Geen console errors / NaN positions
- [x] Stabiel 60fps met 50+ entities

---

## Appendix A: PoC Component Subset

Dit zijn de bitECS components die in het PoC nodig zijn (subset van de volledige SUB-PRD-TECHNICAL):

```typescript
// SPATIAL
Position     { x: f32, y: f32, z: f32 }
Rotation     { y: f32 }

// COMBAT
Health       { current: f32, max: f32 }
Attack       { damage: f32, speed: f32, range: f32, cooldown: f32, timer: f32 }
Armor        { value: f32, type: u8 }

// MOVEMENT
Movement     { speed: f32, targetX: f32, targetZ: f32, hasTarget: u8 }
Path         { waypointIndex: u16, waypointCount: u16, pathId: u32 }

// IDENTITY
Faction      { id: u8 }          // 0=Player, 1=AI
UnitType     { id: u8 }          // 0=Worker, 1=Infantry, 2=Ranged
Selected     { by: u8 }          // 0=selected, 255=not

// ECONOMY
Resource     { type: u8, amount: f32, capacity: f32 }
Gatherer     { carrying: f32, carryCapacity: f32, resourceType: u8, targetEid: u32, returnEid: u32, state: u8 }

// BUILDING
Building     { type: u8, progress: f32, complete: u8, popProvided: u8 }
Production   { unitType: u8, progress: f32, duration: f32, rallyX: f32, rallyZ: f32, queueSlot0-4: u8 }

// VISIBILITY
Visibility   { range: f32 }

// AI
UnitAI       { state: u8, targetEid: u32, aggroRange: f32, leashRange: f32, leashX: f32, leashZ: f32 }

// RENDER BRIDGE
RenderRef    { meshId: u32 }

// TAGS (zero-size)
IsUnit, IsBuilding, IsResource, IsDead, IsWorker, NeedsPathfinding
```

## Appendix B: Unit Stats (PoC)

| Unit | HP | Attack | AtkSpd | Range | Armor | ArmType | Speed | Cost | BuildTime | Pop | Carry | Aggro | Leash | Sight |
|------|----|--------|--------|-------|-------|---------|-------|------|-----------|-----|-------|-------|-------|-------|
| **Worker (Boer)** | 60 | 5 | 1.5s | 1.0 | 0 | None | 5.0 | 50g | 15s | 1 | 10 | 3 | 10 | 6 |
| **Infantry (Carnavalvierder)** | 80 | 10 | 1.2s | 1.5 | 1 | Light | 5.5 | 75g | 18s | 1 | -- | 6 | 15 | 8 |
| **Ranged (Kansen)** | 55 | 12 | 1.8s | 8.0 | 0 | Light | 6.0 | 60g | 22s | 1 | -- | 8 | 15 | 10 |

## Appendix C: Building Stats (PoC)

| Building | HP | Cost | BuildTime | PopProvided | Produces | Sight |
|----------|-----|------|-----------|-------------|----------|-------|
| **Town Hall (Boerderij)** | 1500 | -- | -- | 10 | Worker | 12 |
| **Barracks (Cafe)** | 800 | 200g | 30s | 0 | Infantry, Ranged | 8 |

## Appendix D: AI Build Order (PoC)

```
Step  1: Train Worker x4           (cost: 200g, @TownHall)
Step  2: Build Barracks            (cost: 200g, worker moves to build site)
Step  3: Train Worker x2           (cost: 100g)
Step  4: Train Carnavalvierder x5  (cost: 375g, @Barracks)
Step  5: Train Kansen x3           (cost: 180g, @Barracks)
Step  6: Wait until army >= 8 OR time > 300s
Step  7: ATTACK -- all combat units move to player Town Hall
Step  8: Continue training replacement units during attack
Step  9: If army wiped: rebuild to 10 units, attack again
```

AI resource income: AI workers gather gold identiek aan player. AI start met 3 workers + TownHall + 300g.

## Appendix E: Map Layout (PoC)

```
128x128 map, simplex noise terrain
Heights: 0-10 world units

    (0,0) ────────────────────────── (128,0)
      │                                  │
      │   [Gold Mine 1]                  │
      │        (30, 20)                  │
      │                                  │
      │   [Player TownHall]              │
      │        (20, 20)                  │
      │                                  │
      │           [Gold Mine 2]          │
      │               (50, 40)           │
      │                                  │
      │                                  │
      │        [Gold Mine 3]             │
      │           (64, 64)               │
      │                 (center)         │
      │                                  │
      │           [Gold Mine 4]          │
      │               (78, 88)           │
      │                                  │
      │                [AI TownHall]     │
      │                  (108, 108)      │
      │                                  │
      │               [Gold Mine 5]      │
      │                  (98, 108)       │
      │                                  │
    (0,128) ─────────────────────── (128,128)

Player start: bottom-left area (20, 20)
AI start: top-right area (108, 108)
Contested gold mines: center area
```

Gold mines: 1500 gold elk, max 5 gatherers tegelijk.
