# Reign of Brabant -- POC Technical Setup

**Versie**: 0.1.0
**Datum**: 2026-04-05
**Status**: Ready to implement
**Scope**: Proof of Concept -- 2 facties, 1 map, skirmish vs AI
**Parent**: PRD.md v1.0.0, SUB-PRD-TECHNICAL.md v1.0.0

---

## 1. package.json

```json
{
  "name": "reign-of-brabant",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Browser-based 3D RTS set in medieval Brabant -- Three.js, TypeScript, bitECS",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ --ext .ts",
    "lint:fix": "eslint src/ --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "optimize-assets": "bash scripts/optimize-assets.sh"
  },
  "dependencies": {
    "three": "^0.183.2",
    "@types/three": "^0.183.1",
    "bitecs": "^0.4.0",
    "recast-navigation": "^0.43.1",
    "@recast-navigation/three": "^0.43.0",
    "yuka": "^0.7.8",
    "howler": "^2.2.4",
    "simplex-noise": "^4.0.3",
    "lz-string": "^1.5.0",
    "stats-gl": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^4.1.2",
    "terser": "^5.46.1",
    "@types/howler": "^2.2.12",
    "@types/lz-string": "^1.5.0",
    "eslint": "^9.25.1",
    "@eslint/js": "^9.25.1",
    "typescript-eslint": "^8.31.1",
    "prettier": "^3.5.3",
    "@gltf-transform/cli": "^4.3.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "browserslist": [
    "Chrome >= 113",
    "Firefox >= 115",
    "Safari >= 17",
    "Edge >= 113"
  ]
}
```

### Dependency rationale

| Package | Version | Why |
|---------|---------|-----|
| `three` | 0.183.2 | 3D rendering engine, WebGPU (r170+) + WebGL2 fallback |
| `@types/three` | 0.183.1 | TypeScript type definitions, matched to three version |
| `bitecs` | 0.4.0 | SoA ECS -- 335K ops/s, TypedArray backing, zero GC pressure |
| `recast-navigation` | 0.43.1 | WASM NavMesh pathfinding, crowd simulation, TileCache |
| `@recast-navigation/three` | 0.43.0 | Three.js mesh-to-navmesh conversion helpers |
| `yuka` | 0.7.8 | Steering behaviors, FSM, goal-driven AI, perception |
| `howler` | 2.2.4 | Audio playback, sprite support, 3D spatial, 7KB gzipped |
| `simplex-noise` | 4.0.3 | Terrain generation, procedural noise |
| `lz-string` | 1.5.0 | Save game compression (JSON + LZ-string) |
| `stats-gl` | 4.1.0 | GPU/CPU frame time monitoring overlay |
| `typescript` | 5.8.3 | Type safety, strict mode |
| `vite` | 6.3.5 | Dev server with HMR, ES module bundling, WASM support |
| `vitest` | 4.1.2 | Unit testing framework (Vite-native) |
| `terser` | 5.46.1 | JS minification for production builds |
| `eslint` + `typescript-eslint` | 9.x / 8.x | Linting with TypeScript support (flat config) |
| `prettier` | 3.5.3 | Code formatting |
| `@gltf-transform/cli` | 4.3.0 | GLB optimization (Draco compression, texture resize) |

---

## 2. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "declaration": false,
    "declarationMap": false,
    "sourceMap": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@world/*": ["src/world/*"],
      "@entities/*": ["src/entities/*"],
      "@factions/*": ["src/factions/*"],
      "@combat/*": ["src/combat/*"],
      "@ai/*": ["src/ai/*"],
      "@pathfinding/*": ["src/pathfinding/*"],
      "@camera/*": ["src/camera/*"],
      "@input/*": ["src/input/*"],
      "@rendering/*": ["src/rendering/*"],
      "@ui/*": ["src/ui/*"],
      "@audio/*": ["src/audio/*"],
      "@assets/*": ["src/assets/*"],
      "@types/*": ["src/types/*"]
    },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts"],
  "exclude": ["node_modules", "dist", "scripts"]
}
```

### Key decisions

- **`target: ES2022`**: WebGPU requires top-level await, class static blocks, and other ES2022 features. All target browsers support this.
- **`moduleResolution: bundler`**: Required for Vite. Allows `import.meta.url`, `import.meta.env`, bare specifiers resolved by Vite.
- **`lib: WebWorker`**: Pathfinding runs in a Web Worker; we need `self.onmessage`, `postMessage` etc.
- **`isolatedModules: true`**: Required by Vite (esbuild transpiles each file independently).
- **`strict: true`**: Full strict mode -- no implicit any, strict null checks, strict property initialization.
- **Path aliases**: Every `src/` subfolder gets an `@alias` for clean imports: `import { Position } from '@core/components'` instead of `../../core/components`.
- **`noEmit: true`**: TypeScript is only used for type checking. Vite handles transpilation.

---

## 3. vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/games/reign-of-brabant/' : '/',

  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@world': resolve(__dirname, 'src/world'),
      '@entities': resolve(__dirname, 'src/entities'),
      '@factions': resolve(__dirname, 'src/factions'),
      '@combat': resolve(__dirname, 'src/combat'),
      '@ai': resolve(__dirname, 'src/ai'),
      '@pathfinding': resolve(__dirname, 'src/pathfinding'),
      '@camera': resolve(__dirname, 'src/camera'),
      '@input': resolve(__dirname, 'src/input'),
      '@rendering': resolve(__dirname, 'src/rendering'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@audio': resolve(__dirname, 'src/audio'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },

  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,   // Keep console.warn/error for error reporting
        drop_debugger: true,
        passes: 2,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core engine (always loaded first)
          engine: [
            'three',
            'bitecs',
            'recast-navigation',
            '@recast-navigation/three',
          ],
          // Audio (lazy-loadable)
          audio: ['howler'],
          // AI library (lazy-loadable)
          'game-ai': ['yuka'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // KB
  },

  worker: {
    format: 'es',
  },

  // Include binary asset types for import resolution
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ogg', '**/*.mp3', '**/*.ktx2', '**/*.wasm'],

  optimizeDeps: {
    include: ['three', 'bitecs', 'yuka'],
    exclude: ['recast-navigation'], // WASM -- let Vite handle natively
  },

  server: {
    port: 3000,
    open: true,
    headers: {
      // Required for SharedArrayBuffer (Web Workers + WASM)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  preview: {
    port: 4173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
}));
```

### Key decisions

- **Dynamic `base`**: Dev uses `/`, production uses `/games/reign-of-brabant/` to match the deployment path on theuws.com.
- **COOP/COEP headers**: Required for `SharedArrayBuffer` which recast-navigation WASM may use. Both dev server and preview server set these.
- **Manual chunks**: `engine` chunk keeps three/bitecs/recast together (~800KB gzipped). `audio` and `game-ai` are separate so they can lazy-load after the main menu renders.
- **Worker format `es`**: Web Workers use ES modules (`type: 'module'`), enabling tree-shaking inside workers and `import` statements.
- **`assetsInclude`**: GLB, audio, KTX2, and WASM files are recognized as importable assets. Vite will emit them with content-hash filenames.
- **`optimizeDeps.exclude: recast-navigation`**: This package ships WASM binaries. Pre-bundling can break WASM loading. Let Vite handle it natively.

---

## 4. Project Folder Structure

```
reign-of-brabant/
├── src/
│   ├── main.ts                         # Application entry point
│   ├── types/
│   │   ├── game.ts                     # Core game types, enums, interfaces
│   │   ├── factions.ts                 # Faction IDs, faction data interface
│   │   ├── units.ts                    # Unit types, archetype data interface
│   │   ├── buildings.ts                # Building types, archetype data interface
│   │   ├── resources.ts                # Resource types
│   │   ├── abilities.ts                # Ability IDs, ability data interface
│   │   ├── combat.ts                   # Armor types, damage types, attack types
│   │   └── env.d.ts                    # Vite env type declarations
│   ├── core/
│   │   ├── game.ts                     # Main Game class: init, loop, state machine
│   │   ├── world.ts                    # bitECS world creation, WorldMeta singleton
│   │   ├── components.ts              # ALL bitECS component definitions (~35 components)
│   │   ├── systems.ts                  # System execution pipeline (ordered array)
│   │   ├── spatial-hash.ts            # SpatialHashGrid for proximity queries
│   │   ├── events.ts                   # Game event bus (typed EventTarget wrapper)
│   │   └── registries.ts              # Unit/building/ability archetype data registries
│   ├── world/
│   │   ├── terrain.ts                  # Terrain mesh, heightmap, splat shader material
│   │   ├── map-loader.ts              # Map JSON parser, entity spawner, navmesh trigger
│   │   ├── fog-of-war.ts              # FogOfWarRenderer (canvas texture, 5-10fps update)
│   │   └── water.ts                    # Water plane (transparent, UV-animated)
│   ├── entities/
│   │   ├── unit-factory.ts            # createUnit(world, factionId, unitSubId, x, z)
│   │   ├── building-factory.ts        # createBuilding(world, factionId, buildingType, x, z)
│   │   ├── resource-factory.ts        # createResource(world, type, x, z, amount)
│   │   ├── projectile-factory.ts      # createProjectile(world, source, target, config)
│   │   └── entity-pool.ts             # EntityPool: recycle/acquire dead entities
│   ├── factions/
│   │   ├── brabanders/
│   │   │   ├── index.ts               # Faction data: unit archetypes, building archetypes, tech tree
│   │   │   ├── gezelligheid.ts        # GezelligheidsSystem: proximity bonus calculation
│   │   │   └── carnavalsrage.ts       # Faction-specific ability implementation
│   │   └── randstad/
│   │       ├── index.ts               # Faction data: unit archetypes, building archetypes, tech tree
│   │       ├── bureaucratie.ts        # BureaucratieSystem: efficiency stacks, werkoverleg pause
│   │       └── vergadering.ts         # Faction-specific ability implementation
│   ├── combat/
│   │   ├── damage.ts                   # calculateDamage(): base damage, armor reduction, type bonuses
│   │   ├── combat-system.ts           # CombatSystem: attack timer, target acquisition, death marking
│   │   ├── projectile-system.ts       # ProjectileSystem: move projectiles, impact, AoE
│   │   ├── ability-system.ts          # AbilitySystem: cooldown ticks, activation, deactivation
│   │   ├── status-effects.ts          # StatusEffectSystem: tick durations, remove expired
│   │   ├── aura-system.ts             # AuraSystem: apply/remove buffs based on proximity
│   │   └── heal-system.ts             # HealSystem: auto-heal for support units
│   ├── ai/
│   │   ├── unit-ai.ts                  # Unit FSM: Idle, Moving, Attacking, Gathering, etc.
│   │   ├── strategic-ai.ts            # StrategicAI: opponent build orders, attack decisions
│   │   ├── build-orders.ts            # Predefined build order sequences per faction per difficulty
│   │   ├── threat-map.ts              # ThreatMap: spatial threat assessment for AI decisions
│   │   └── difficulty.ts              # Difficulty presets: resource bonuses, reaction time, cheats
│   ├── pathfinding/
│   │   ├── pathfinding-manager.ts     # PathfindingManager: crowd + individual path requests
│   │   ├── pathfinding.worker.ts      # Web Worker: off-thread path computation
│   │   ├── formation.ts               # FormationManager: box, line, column, wedge formations
│   │   ├── dynamic-obstacles.ts       # DynamicObstacleManager: TileCache building add/remove
│   │   └── navmesh-builder.ts         # NavMesh generation from terrain + static obstacles
│   ├── camera/
│   │   ├── rts-camera.ts              # RTSCamera: pan, zoom, rotate, edge scroll, bounds
│   │   └── minimap.ts                 # Minimap: offscreen canvas renderer, click-to-move
│   ├── input/
│   │   ├── input-manager.ts           # Keyboard + mouse state tracking, event normalization
│   │   ├── selection.ts               # Box select, click select, shift-select, double-click type-select
│   │   ├── commands.ts                # Right-click context commands (move, attack, gather, build)
│   │   ├── control-groups.ts          # Ctrl+1-9 assign, 1-9 recall, double-tap center
│   │   └── hotkeys.ts                 # Ability hotkeys (Q/W/E/R), building hotkeys, global hotkeys
│   ├── rendering/
│   │   ├── renderer.ts                # WebGPU/WebGL2 init, feature detection, render call
│   │   ├── instanced-meshes.ts        # InstancedMeshManager: register, allocate, free, updateTransform
│   │   ├── lod-system.ts              # LODSystem: 3-level LOD based on camera distance
│   │   ├── health-bars.ts             # Billboarded health bar quads (InstancedMesh)
│   │   ├── selection-circles.ts       # Selection ring rendering (InstancedMesh, pulsing)
│   │   ├── particles.ts               # ParticleSystem: confetti, vlaai splash, dust trails
│   │   ├── render-sync.ts             # RenderSyncSystem: ECS Position/Rotation -> Three.js matrices
│   │   └── adaptive-quality.ts        # Auto-quality: measure FPS, adjust shadows/LOD/particles
│   ├── ui/
│   │   ├── hud.ts                      # Main HUD controller: coordinates all UI panels
│   │   ├── resource-panel.ts          # Top bar: resource counts, population, game time
│   │   ├── unit-panel.ts              # Bottom: selected unit portrait, stats, abilities
│   │   ├── command-card.ts            # Action buttons: train, build, research, ability
│   │   ├── minimap-ui.ts             # Minimap HTML overlay (canvas element + click handlers)
│   │   ├── main-menu.ts              # Start screen: play, settings, load game
│   │   ├── settings-menu.ts          # Graphics quality, audio volume, keybindings
│   │   ├── save-load-menu.ts         # Save/load UI with IndexedDB backend
│   │   └── notifications.ts          # In-game notifications (unit trained, under attack, etc.)
│   ├── audio/
│   │   ├── audio-manager.ts           # Howler.js wrapper: sound pools, 3D positional audio
│   │   ├── music-manager.ts           # Music track management: crossfade, adaptive intensity
│   │   └── voice-manager.ts           # Voice line playback: cooldowns, priority queue
│   └── assets/
│       ├── asset-loader.ts            # GLB/texture/audio loader with retry, progress callback
│       ├── asset-manifest.ts          # Generated asset manifest for cache busting
│       └── model-manager.ts           # Model instance management, geometry/material cache
├── assets/
│   ├── models/
│   │   ├── brabanders/                # GLB files: worker.glb, infantry.glb, ranged.glb, ...
│   │   ├── randstad/                  # GLB files: stagiair.glb, accountant.glb, ...
│   │   └── shared/                    # Trees, rocks, fences, gold mine, town hall props
│   ├── textures/
│   │   ├── terrain/                   # heightmap.png, splatmap.png, grass.jpg, dirt.jpg, stone.jpg, sand.jpg
│   │   └── effects/                   # Particle textures: confetti.png, dust.png, ring.png
│   ├── audio/
│   │   ├── music/                     # Background tracks (OGG, ~3MB each)
│   │   ├── sfx/                       # Sound effects sprite sheet (OGG)
│   │   └── voice/                     # Voice lines per faction (OGG)
│   ├── icons/                         # Unit portraits (128x128 PNG), ability icons (64x64 PNG)
│   ├── maps/
│   │   └── de-kempen.json             # POC map definition: spawn points, resources, terrain config
│   └── ui/                            # Logo, OG image, menu backgrounds
├── public/
│   └── index.html                     # Root HTML: canvas + UI overlay containers
├── scripts/
│   ├── blender/
│   │   └── generate_rts_assets.py     # Procedural Blender asset generation script
│   ├── optimize-assets.sh             # GLB/texture/audio optimization pipeline
│   ├── balance-test.ts                # Headless AI vs AI balance testing
│   ├── perf-test.ts                   # Performance regression testing
│   └── generate-manifest.js           # Asset manifest generator
├── tests/
│   ├── unit/                          # Vitest unit tests (*.test.ts)
│   ├── integration/                   # ECS integration tests
│   └── screenshots/                   # Visual regression baselines
├── docs/
│   ├── SUB-PRD-TECHNICAL.md
│   ├── SUB-PRD-AUDIO.md
│   ├── SUB-PRD-CAMPAIGN.md
│   ├── SUB-PRD-KLAPPER.md
│   ├── SUB-PRD-MULTIPLAYER.md
│   ├── SUB-PRD-UI-UX.md
│   └── POC-TECH-SETUP.md             # This document
├── PRD.md
├── CHANGELOG.md
├── VERSION
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc
├── .editorconfig
└── .gitignore
```

### Folder details

| Folder | Purpose | POC scope |
|--------|---------|-----------|
| `src/types/` | Shared TypeScript enums, interfaces, type definitions. No runtime code -- pure types. | All enums/interfaces defined in section 6 |
| `src/core/` | Engine core: Game class (init + loop + state machine), bitECS world setup, all 35 component definitions, system execution pipeline, spatial hash grid, typed event bus, archetype registries. This is the heart of the engine. | Full implementation |
| `src/world/` | Map/world construction: terrain mesh from heightmap + splat shader, map JSON loading (spawn points, resource positions), fog of war renderer, water plane. | Terrain + map loader + fog of war |
| `src/entities/` | Entity factory functions. Each factory bundles the correct components and sets initial values from archetype data. Entity pool for recycling dead entities (reduces GC). | All 4 factories + pool |
| `src/factions/` | Faction-specific data and systems. Each faction subfolder exports unit/building archetypes and unique mechanics. POC: only Brabanders + Randstad. | 2 factions |
| `src/combat/` | Combat logic: damage calculation, combat system (attack timers, target selection), projectile movement, abilities, status effects, auras, healing. All pure ECS systems -- no rendering. | Core damage + combat + projectile |
| `src/ai/` | AI: unit-level FSM (idle, move, attack, gather, build, flee) and strategic AI (opponent build orders, attack timing). | Unit FSM + basic strategic AI |
| `src/pathfinding/` | Pathfinding: recast-navigation integration, Web Worker for off-thread path computation, crowd simulation, formation movement, dynamic obstacles (buildings). | NavMesh + crowd + worker |
| `src/camera/` | RTS camera controller (pan/zoom/rotate/edge scroll/bounds) and minimap renderer. | Full implementation |
| `src/input/` | Input handling: mouse/keyboard state, box select, click select, right-click commands, control groups, hotkeys. | Core selection + commands |
| `src/rendering/` | Three.js rendering bridge: renderer init (WebGPU/WebGL2), InstancedMesh manager, LOD system, health bars, selection circles, particles, ECS-to-Three.js sync, adaptive quality. | Renderer + instanced meshes + render sync + health bars + selection |
| `src/ui/` | HTML/CSS game UI: HUD controller, resource panel, unit panel, command card, minimap overlay, menus, notifications. No canvas UI -- all DOM-based for performance. | HUD + resource panel + unit panel + command card + minimap |
| `src/audio/` | Audio: Howler.js wrapper with sound pools, music manager with crossfade, voice line manager. | Basic SFX + music |
| `src/assets/` | Asset loading: GLB/texture/audio loader with retry logic, asset manifest, model instance cache. | Loader + model manager |

---

## 5. Entry Point (src/main.ts)

```typescript
/**
 * Reign of Brabant -- Entry Point
 *
 * Boot sequence:
 * 1. Feature detection (WebGL2 minimum)
 * 2. Initialize Three.js renderer (WebGPU with WebGL2 fallback)
 * 3. Initialize bitECS world
 * 4. Initialize core managers (pathfinding, audio, input, assets)
 * 5. Show main menu
 * 6. On "Play": load map, build terrain, generate navmesh, spawn entities
 * 7. Start game loop (requestAnimationFrame)
 */

import { Game } from '@core/game';
import { checkBrowserSupport } from '@rendering/renderer';

async function main(): Promise<void> {
  // ── 1. Feature detection ──────────────────────────────────────
  const support = checkBrowserSupport();
  if (!support.webgl2) {
    document.getElementById('app')!.innerHTML = `
      <div class="error-screen">
        <h1>Browser Not Supported</h1>
        <p>Reign of Brabant requires WebGL 2.0.</p>
        <p>Please use Chrome 113+, Firefox 115+, Safari 17+, or Edge 113+.</p>
      </div>
    `;
    return;
  }

  // ── 2. Create and initialize game ─────────────────────────────
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const game = new Game(canvas);

  try {
    await game.init();
  } catch (error) {
    console.error('[Boot] Failed to initialize game:', error);
    document.getElementById('app')!.innerHTML = `
      <div class="error-screen">
        <h1>Initialization Error</h1>
        <p>Failed to start the game engine. Please refresh the page.</p>
        <p class="error-detail">${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `;
    return;
  }

  // ── 3. Show main menu ─────────────────────────────────────────
  game.showMainMenu();

  // stats-gl overlay (dev only)
  if (import.meta.env.DEV) {
    const { default: Stats } = await import('stats-gl');
    const stats = new Stats({ minimal: false });
    document.body.appendChild(stats.dom);
    game.setStats(stats);
  }
}

// Boot
main().catch(console.error);
```

### Game class boot sequence (src/core/game.ts)

```typescript
class Game {
  async init(): Promise<void> {
    // Phase 1: Renderer
    this.renderer = await initRenderer(this.canvas);
    this.scene = new THREE.Scene();
    this.setupLighting();

    // Phase 2: ECS World
    this.world = createWorld({ maxEntities: 2048 });
    this.worldMeta = { tick: 0, dt: 0, time: 0, mapSize: [256, 256], playerFaction: 0, gameState: 'loading' };

    // Phase 3: Core managers (no map-specific data yet)
    this.eventBus = new GameEventBus();
    this.inputManager = new InputManager(this.canvas, this.eventBus);
    this.audioManager = new AudioManager();
    this.assetLoader = new AssetLoader();
    this.instancedMeshManager = new InstancedMeshManager(this.scene);

    // Phase 4: UI
    this.hud = new HUD();
  }

  async startGame(mapId: string, playerFaction: FactionId): Promise<void> {
    this.worldMeta.gameState = 'loading';

    // Phase 5: Load map data
    const mapData = await this.assetLoader.loadMap(mapId);

    // Phase 6: Build terrain
    this.terrain = new Terrain(this.scene, mapData.heightmap, mapData.splatmap);
    await this.terrain.init();

    // Phase 7: Initialize pathfinding (WASM)
    await initRecast();
    this.pathfindingManager = new PathfindingManager();
    await this.pathfindingManager.buildNavMesh(this.terrain.getMesh());

    // Phase 8: Load faction assets
    await this.assetLoader.loadFactionAssets(playerFaction);
    await this.assetLoader.loadFactionAssets(this.getOpponentFaction(playerFaction));

    // Phase 9: Camera
    this.camera = new RTSCamera(this.canvas, mapData.mapSize);

    // Phase 10: Fog of war
    this.fogOfWar = new FogOfWarRenderer(mapData.mapSize[0]);

    // Phase 11: Spawn starting entities from map data
    this.spawnStartingEntities(mapData, playerFaction);

    // Phase 12: Initialize AI
    this.strategicAI = new StrategicAI(this.getOpponentFaction(playerFaction), mapData.difficulty);

    // Phase 13: Build ECS system pipeline
    this.systems = buildSystemPipeline(this.world, this.worldMeta, {
      pathfinding: this.pathfindingManager,
      terrain: this.terrain,
      instancedMeshes: this.instancedMeshManager,
      camera: this.camera,
      input: this.inputManager,
      audio: this.audioManager,
      fogOfWar: this.fogOfWar,
      hud: this.hud,
      eventBus: this.eventBus,
    });

    // Phase 14: Start game loop
    this.worldMeta.gameState = 'playing';
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop(now: number): void {
    if (this.worldMeta.gameState !== 'playing') return;
    this.rafId = requestAnimationFrame((t) => this.loop(t));

    // Delta time (capped at 100ms to prevent spiral of death)
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.worldMeta.dt = dt;
    this.worldMeta.time += dt;
    this.worldMeta.tick++;

    // Run all ECS systems in order
    for (const system of this.systems) {
      system(this.world);
    }

    // Render
    this.renderer.render(this.scene, this.camera.getCamera());

    // Stats (dev only)
    this.stats?.update();
  }
}
```

### requestAnimationFrame cycle (per frame, ~9.3ms budget)

```
requestAnimationFrame(loop)
  |
  +-- Calculate delta time (cap at 100ms)
  +-- Update world metadata (dt, time, tick)
  |
  +-- ECS System Pipeline (in order):
  |   01. InputSystem              [0.2ms]  mouse/keyboard -> commands
  |   02. CommandSystem             [0.1ms]  commands -> ECS writes
  |   03. AISystem (unit FSM)      [1.5ms]  state transitions, auto-attack
  |   04. StrategicAISystem        [0.5ms]  (1x/sec) build orders, attacks
  |   05. AbilitySystem            [0.3ms]  cooldowns, activation
  |   06. StatusEffectSystem       [0.2ms]  tick durations, expire
  |   07. AuraSystem               [0.3ms]  proximity buff/debuff
  |   08. PathfindingSystem        [1.0ms]  consume NeedsPathfinding, write Path
  |   09. SteeringSystem           [0.5ms]  follow waypoints -> Velocity
  |   10. FormationSystem          [0.2ms]  offset velocity for slots
  |   11. MovementSystem           [0.3ms]  integrate velocity -> Position
  |   12. CollisionSystem          [0.5ms]  soft unit-unit separation
  |   13. CombatSystem             [0.5ms]  attack timer, damage, death
  |   14. ProjectileSystem         [0.3ms]  move, impact, AoE
  |   15. HealSystem               [0.1ms]  auto-heal
  |   16. ProductionSystem         [0.2ms]  building train progress
  |   17. ResourceSystem           [0.2ms]  passive gen, gather delivery
  |   18. GezelligheidsSystem      [0.3ms]  Brabanders proximity bonus
  |   19. BureaucratieSystem       [0.1ms]  Randstad efficiency stacks
  |   20. DeathSystem              [0.2ms]  process IsDead, trigger anim
  |   21. CleanupSystem            [0.1ms]  remove expired entities
  |   22. VisibilitySystem         [0.8ms]  (5-10fps) fog of war update
  |   23. LODSystem                [0.1ms]  camera distance -> LOD level
  |   24. RenderSyncSystem         [0.5ms]  ECS Position -> InstancedMesh matrix
  |   25. AnimationSystem          [0.3ms]  animation mixer updates
  |   26. CameraSystem             [0.1ms]  camera from input
  |   27. MinimapSystem            [0.2ms]  minimap canvas update
  |   28. UISystem                 [0.3ms]  HTML HUD update
  |   29. AudioSystem              [0.2ms]  trigger/stop sounds
  |
  +-- renderer.render(scene, camera)
  +-- stats.update() (dev only)
```

---

## 6. Type Definitions (src/types/)

### src/types/game.ts

```typescript
/** Core game state interface. Non-ECS singleton data. */
export interface GameState {
  tick: number;
  dt: number;
  time: number;
  mapSize: [number, number];
  playerFaction: FactionId;
  gameState: 'loading' | 'menu' | 'playing' | 'paused' | 'ended';
  winner: FactionId | null;
}

/** Game speed multiplier */
export enum GameSpeed {
  SLOW = 0.5,
  NORMAL = 1.0,
  FAST = 1.5,
  FASTEST = 2.0,
}

/** Difficulty levels */
export enum Difficulty {
  EASY = 0,
  NORMAL = 1,
  HARD = 2,
}

/** Map definition loaded from JSON */
export interface MapDefinition {
  id: string;
  name: string;
  mapSize: [number, number];
  heightmapPath: string;
  splatmapPath: string;
  spawnPoints: SpawnPoint[];
  resourceNodes: ResourceNode[];
  staticObstacles: ObstacleDefinition[];
  ambientSounds: string[];
  musicTrack: string;
  difficulty: Difficulty;
}

export interface SpawnPoint {
  factionSlot: number;     // 0 = player, 1 = opponent
  x: number;
  z: number;
  startingUnits: Array<{ unitSubId: number; offsetX: number; offsetZ: number }>;
  townHallPosition: { x: number; z: number };
}

export interface ResourceNode {
  type: ResourceType;
  x: number;
  z: number;
  amount: number;
  maxGatherers: number;
}

export interface ObstacleDefinition {
  x: number;
  z: number;
  width: number;
  depth: number;
  rotation: number;
  modelPath: string;
}
```

### src/types/factions.ts

```typescript
/** Faction identifiers. Maps to bitECS Faction.id component. */
export enum FactionId {
  BRABANDERS = 0,
  RANDSTAD = 1,
  LIMBURGERS = 2,   // v1.0
  BELGEN = 3,        // v2.0
  NEUTRAL = 255,
}

/** Faction display data */
export interface FactionData {
  id: FactionId;
  name: string;
  color: number;              // Hex color for tinting (e.g., 0xff8800)
  accentColor: number;
  resourceNames: {
    primary: string;          // "Worstenbroodjes" or "LinkedIn Connections"
    secondary: string;        // "Brabants Bier" or "Budget"
  };
  startingResources: {
    primary: number;
    secondary: number;
  };
  maxPopulation: number;      // Base max (before housing)
  uniqueMechanic: string;
  musicTheme: string;
}
```

### src/types/units.ts

```typescript
/** Unit archetype categories. Maps to bitECS UnitType.id component. */
export enum UnitTypeId {
  WORKER = 0,
  INFANTRY = 1,
  RANGED = 2,
  HEAVY = 3,
  SIEGE = 4,
  SUPPORT = 5,
  SPECIAL = 6,
  HERO = 7,
  SCOUT = 8,
}

/** Complete unit archetype data. Loaded from faction registry. */
export interface UnitArchetype {
  id: number;                 // Unique ID (faction + subId combo)
  factionId: FactionId;
  unitTypeId: UnitTypeId;
  subId: number;              // Faction-specific sub-ID
  name: string;
  displayName: string;        // Localized display name
  description: string;

  // Stats
  health: number;
  armor: number;
  armorType: ArmorType;
  moveSpeed: number;
  sightRange: number;
  aggroRange: number;
  leashRange: number;

  // Attack
  attackDamage: number;
  attackSpeed: number;        // Interval in seconds
  attackRange: number;        // 0 = melee
  attackBonuses: {
    vsLight: number;          // Multiplier (1.0 = no bonus)
    vsMedium: number;
    vsHeavy: number;
    vsBuilding: number;
  };

  // Economy
  cost: { primary: number; secondary: number };
  buildTime: number;          // Seconds
  populationCost: number;     // Usually 1

  // Gathering (workers only)
  carryCapacity?: number;
  gatherRatePrimary?: number;
  gatherRateSecondary?: number;

  // Healing (support only)
  healAmount?: number;
  healSpeed?: number;
  healRange?: number;

  // Abilities
  abilities: number[];        // Ability IDs (max 4)

  // Rendering
  modelPath: string;          // Path to GLB file
  iconPath: string;           // Path to portrait PNG
  boundingRadius: number;
  scale: number;              // Model scale multiplier

  // Audio
  selectSounds: string[];     // Sound IDs for selection
  moveSounds: string[];       // Sound IDs for move command
  attackSounds: string[];     // Sound IDs for attack
  deathSounds: string[];      // Sound IDs for death
}
```

### src/types/buildings.ts

```typescript
/** Building archetype categories. Maps to bitECS Building.type component. */
export enum BuildingTypeId {
  TOWN_HALL = 0,
  BARRACKS = 1,
  RESOURCE_GEN = 2,
  TECH = 3,
  TOWER = 4,
  ADVANCED = 5,
  HOUSING = 6,
  SPECIAL = 7,
}

/** Complete building archetype data. */
export interface BuildingArchetype {
  id: number;
  factionId: FactionId;
  buildingTypeId: BuildingTypeId;
  name: string;
  displayName: string;
  description: string;

  // Stats
  health: number;
  armor: number;
  sightRange: number;

  // Economy
  cost: { primary: number; secondary: number };
  buildTime: number;          // Seconds
  populationProvided: number; // Housing = 8, Town Hall = 10, others = 0

  // Production
  trains: number[];           // Unit subIds this building can train
  researches: number[];       // Tech IDs this building can research

  // Passive resource generation
  resourceGenType?: ResourceType;
  resourceGenRate?: number;   // Amount per 10 seconds

  // Defense
  attackDamage?: number;      // Towers only
  attackRange?: number;
  attackSpeed?: number;

  // Size
  width: number;              // Grid cells
  depth: number;
  modelPath: string;
  iconPath: string;

  // Requirements
  requires: number[];         // Building type IDs that must exist first
}
```

### src/types/resources.ts

```typescript
/** Resource types. Maps to bitECS Resource.type and Gatherer.resourceType. */
export enum ResourceType {
  PRIMARY = 0,     // Gold / Worstenbroodjes / LinkedIn Connections
  SECONDARY = 1,   // Lumber / Brabants Bier / Budget
}

/** Player resource state (non-ECS, per faction). */
export interface PlayerResources {
  primary: number;
  secondary: number;
  population: number;
  maxPopulation: number;
}
```

### src/types/combat.ts

```typescript
/** Armor types. Maps to bitECS Armor.type component. */
export enum ArmorType {
  NONE = 0,
  LIGHT = 1,
  MEDIUM = 2,
  HEAVY = 3,
  BUILDING = 4,
}

/** AI states. Maps to bitECS UnitAI.state component. */
export enum AIState {
  IDLE = 0,
  MOVING = 1,
  ATTACKING = 2,
  GATHERING = 3,
  RETURNING = 4,
  BUILDING = 5,
  FLEEING = 6,
  PATROLLING = 7,
  HOLD_POSITION = 8,
  ATTACK_MOVE = 9,
  DEAD = 10,
  GUARD_POSITION = 11,
}

/** Gatherer sub-states. Maps to bitECS Gatherer.state component. */
export enum GatherState {
  IDLE = 0,
  MOVING_TO_RESOURCE = 1,
  GATHERING = 2,
  RETURNING = 3,
}

/** Formation types for group movement. */
export enum FormationType {
  BOX = 0,
  LINE = 1,
  COLUMN = 2,
  WEDGE = 3,
}

/** LOD levels. */
export enum LODLevel {
  HIGH = 0,     // < 40 units from camera
  MEDIUM = 1,   // 40-80 units
  LOW = 2,      // > 80 units
}

/** Animation clip IDs for AnimationState component. */
export enum AnimationClip {
  IDLE = 0,
  WALK = 1,
  ATTACK = 2,
  DEATH = 3,
  GATHER = 4,
  ABILITY = 5,
}
```

### src/types/abilities.ts

```typescript
/** Ability data definition. */
export interface AbilityDefinition {
  id: number;
  name: string;
  displayName: string;
  description: string;
  iconPath: string;
  cooldown: number;           // Seconds
  manaCost?: number;          // Future: mana system
  range: number;              // 0 = self-cast, >0 = targeted
  duration: number;           // Effect duration in seconds
  targetType: AbilityTarget;
  hotkey: string;             // 'Q', 'W', 'E', 'R'
  soundId: string;
}

export enum AbilityTarget {
  SELF = 0,
  ALLY = 1,
  ENEMY = 2,
  GROUND = 3,
  AOE = 4,
}
```

### src/types/env.d.ts

```typescript
/// <reference types="vite/client" />

declare module '*.glb' {
  const src: string;
  export default src;
}

declare module '*.gltf' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.ktx2' {
  const src: string;
  export default src;
}
```

---

## 7. Build & Run Commands

```bash
# Initial setup
cd /Users/richardtheuws/Documents/games/reign-of-brabant
npm install

# Development (hot reload, http://localhost:3000)
npm run dev

# Type checking (no emit, strict mode)
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Unit tests
npm run test             # Single run
npm run test:watch       # Watch mode
npm run test:coverage    # With V8 coverage

# Production build (typecheck + vite build)
npm run build

# Preview production build (http://localhost:4173)
npm run preview

# Asset optimization (requires ffmpeg, gltf-transform)
npm run optimize-assets

# Deploy to theuws.com (from games root)
cd /Users/richardtheuws/Documents/games
bash deploy-ftp.sh reign-of-brabant
```

### First-time setup checklist

```bash
# 1. Ensure Node.js >= 20
node --version  # v20.x or v22.x

# 2. Install dependencies
npm install

# 3. Verify TypeScript compiles
npm run typecheck

# 4. Start dev server
npm run dev
# Opens http://localhost:3000

# 5. Verify COOP/COEP headers (check browser console for SharedArrayBuffer availability)
# DevTools > Console: typeof SharedArrayBuffer !== 'undefined' should be true
```

---

## 8. Browser Compatibility

### Minimum browser versions

| Browser | Minimum | WebGPU | WebGL2 | Notes |
|---------|---------|--------|--------|-------|
| **Chrome** | 113+ | Yes (113+) | Yes | Primary target, best WebGPU support |
| **Edge** | 113+ | Yes (113+) | Yes | Chromium-based, same as Chrome |
| **Firefox** | 115+ | Partial (Nightly) | Yes | WebGL2 fallback in stable |
| **Safari** | 17+ | Yes (17.4+) | Yes | WebGPU via Metal backend |
| **Mobile Chrome** | 120+ | No | Yes | WebGL2 only, 30fps target |
| **Mobile Safari** | 17+ | Partial | Yes | WebGL2 recommended |

### Required Web APIs

| API | Used for | Fallback |
|-----|----------|----------|
| **WebGL 2.0** | 3D rendering (fallback) | None -- hard requirement |
| **WebGPU** | 3D rendering (preferred) | WebGL 2.0 |
| **Web Workers** | Pathfinding off-thread | Main thread (performance hit) |
| **WASM** | recast-navigation | None -- hard requirement |
| **SharedArrayBuffer** | WASM threading (optional) | Single-threaded WASM |
| **IndexedDB** | Save/load game | localStorage fallback |
| **Pointer Events** | Mouse input, touch | MouseEvent fallback |
| **ResizeObserver** | Canvas resize | window.onresize |
| **Performance.now()** | Frame timing | Date.now() |
| **requestAnimationFrame** | Game loop | setTimeout (not recommended) |
| **AudioContext** | Web Audio (Howler backend) | None for audio |

### Feature detection (src/rendering/renderer.ts)

```typescript
export interface BrowserSupport {
  webgl2: boolean;
  webgpu: boolean;
  wasm: boolean;
  workers: boolean;
  sharedArrayBuffer: boolean;
  indexedDB: boolean;
  pointerEvents: boolean;
}

export function checkBrowserSupport(): BrowserSupport {
  const canvas = document.createElement('canvas');
  return {
    webgl2: !!canvas.getContext('webgl2'),
    webgpu: 'gpu' in navigator,
    wasm: typeof WebAssembly === 'object',
    workers: typeof Worker !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    indexedDB: 'indexedDB' in window,
    pointerEvents: 'PointerEvent' in window,
  };
}
```

### Polyfills

No polyfills are included. The minimum browser targets (Chrome 113+, Firefox 115+, Safari 17+) natively support all required APIs including ES2022. If a browser fails `checkBrowserSupport()`, the user sees a fallback error screen.

---

## 9. .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment & secrets
.env
.env.local
.env.production

# TypeScript
*.tsbuildinfo

# Test coverage
coverage/

# Logs
*.log
npm-debug.log*

# Generated assets (large binaries)
# GLB/OGG/MP3 files ARE tracked in git (they are game assets)
# Only ignore generated/temporary files:
assets/models/**/*.blend1
assets/models/**/*.blend2
scripts/blender/__pycache__/

# Asset optimization output (rebuild from source)
assets/**/*.ktx2

# Vite
*.local

# Debug
.stats-gl/
```

### What IS tracked in git

- All source code (`src/`)
- Game assets (`assets/` -- GLB, OGG, PNG, JSON)
- Configuration files (package.json, tsconfig.json, vite.config.ts, etc.)
- Documentation (`docs/`, PRD.md, CHANGELOG.md)
- Scripts (`scripts/`)
- Tests (`tests/`)

### What is NOT tracked

- `node_modules/` -- installed via `npm install`
- `dist/` -- built via `npm run build`
- `.env` files -- contain API keys (fal.ai, etc.)
- IDE-specific settings
- OS files (.DS_Store)
- Blender backup files (.blend1, .blend2)
- Coverage reports

---

## 10. Development Tooling

### ESLint (eslint.config.js) -- Flat config format

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript strict
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-readonly': 'error',

      // Game-specific relaxations
      '@typescript-eslint/no-magic-numbers': 'off',  // Game constants everywhere
      '@typescript-eslint/prefer-enum-initializers': 'off',

      // Performance-critical: allow bitwise ops and parameter reassignment
      'no-bitwise': 'off',                           // SpatialHash, ControlGroup bitmask
      'no-param-reassign': 'off',                    // ECS component writes: Position.x[eid] = ...

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'scripts/**', '*.config.*'],
  }
);
```

### Prettier (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### EditorConfig (.editorconfig)

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.json]
indent_size = 2
```

### Vitest (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@world': resolve(__dirname, 'src/world'),
      '@entities': resolve(__dirname, 'src/entities'),
      '@factions': resolve(__dirname, 'src/factions'),
      '@combat': resolve(__dirname, 'src/combat'),
      '@ai': resolve(__dirname, 'src/ai'),
      '@pathfinding': resolve(__dirname, 'src/pathfinding'),
      '@camera': resolve(__dirname, 'src/camera'),
      '@input': resolve(__dirname, 'src/input'),
      '@rendering': resolve(__dirname, 'src/rendering'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@audio': resolve(__dirname, 'src/audio'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/core/**', 'src/combat/**', 'src/ai/**', 'src/entities/**'],
      exclude: ['src/**/*.test.ts', 'src/types/**'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```

### VS Code recommended settings (.vscode/settings.json) -- Optional

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "files.exclude": {
    "node_modules": true,
    "dist": true
  }
}
```

---

## Appendix: public/index.html

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reign of Brabant</title>
  <meta name="description" content="Een 3D browser-based RTS game waarin vier facties strijden om de controle over Brabant." />
  <meta property="og:title" content="Reign of Brabant" />
  <meta property="og:description" content="Browser-based 3D RTS set in medieval Brabant" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/games/reign-of-brabant/assets/ui/og-image.jpg" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a0a; }
    #app {
      width: 100%; height: 100%;
      position: relative;
    }
    #game-canvas {
      width: 100%; height: 100%;
      display: block;
      position: absolute; top: 0; left: 0;
      z-index: 0;
    }
    #ui-overlay {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 1;
    }
    #ui-overlay > * { pointer-events: auto; }
    .error-screen {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      width: 100%; height: 100%;
      color: #fff; font-family: system-ui, sans-serif;
      text-align: center; padding: 2rem;
    }
    .error-screen h1 { margin-bottom: 1rem; }
    .error-detail { color: #f44; font-family: monospace; margin-top: 1rem; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div id="app">
    <canvas id="game-canvas"></canvas>
    <div id="ui-overlay">
      <!-- HUD panels injected by src/ui/ modules -->
    </div>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

---

*This document defines the exact technical setup for the Reign of Brabant POC. All configuration files are copy-paste ready. Run `npm install` followed by `npm run dev` to start development.*
