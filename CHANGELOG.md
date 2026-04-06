# Changelog

## [0.8.0] - 2026-04-06

### Added
- **Entity factory 4-faction support**: `createFactionUnit()` by name, `createFactionUnitByExtendedId()` by enum, faction-aware archetype resolution with legacy fallback
- **Underground System** (Limburgers): Tunnel network with max 4 endpoints, 3s transit, 12 unit capacity, Kolen maintenance, +25% surprise attack buff, emergency surface spawn on building destruction
- **Diplomacy System** (Belgen): 4 Compromis types (Wapenstilstand, Handelsovereenkomst, Culturele Uitwisseling, Niet-aanvalspact), Chocolade-Overtuiging (unit conversion), Commissie Oprichten (15% production slowdown), Damage Split (40% excess redirect)
- **Tertiary Resource System**: Generic per-building generation for Havermoutmelk (2/s), Kolen (1.5/s), Chocolade (1.5/s). PlayerState extended with tertiary field + spend/add/get methods
- **New exported helpers**: `isCeasefireActive()`, `getProductionSlowdown()`, `getTradeBonus()`, `isNonAggressionActive()`, `activateCompromis()`, `persuadeUnit()`

## [0.7.0] - 2026-04-06

### Added
- **4-faction type system**: FactionId enum extended with Limburgers (2) and Belgen (3), full FactionConfig constants with colors, resource names, and tertiary resource configs
- **Tertiary resources**: Gezelligheid (Brabanders), Kolen (Limburgers), Chocolade (Belgen), Havermoutmelk (Randstad) added to ResourceType enum with TertiaryResourceConfig interfaces
- **Faction data tables**: New `src/data/factionData.ts` (1461 LOC) — 31 unit archetypes and 41 building archetypes across all 4 factions with helper functions
- **Extended unit/building types**: UnitTypeId expanded (Heavy, Siege, Support, Special, Hero), BuildingTypeId expanded (Housing, TertiaryResourceBuilding, UpgradeBuilding, FactionSpecial)
- **Campaign missions 10-12**: "De Raad van Brabant" (alliance), "De Slag om de A2" (384x384 XL map, 6 waves), "Het Gouden Worstenbroodje" (3-ring finale, CEO boss fight). Brabanders campaign now complete (12 missions)
- **Instanced rendering**: UnitRenderer refactored from clone-per-entity to InstancedMesh — 6 draw calls total, supports 768 units at 60 FPS
- **Limburgers faction spec**: SUB-PRD-LIMBURGERS.md — 10 units, 10 buildings, underground network mechanic, 156 voice lines in Limburgs dialect
- **Belgen faction spec**: SUB-PRD-BELGEN.md — 9 units, 12 buildings, diplomatie/compromis mechanic, 135 voice lines in Vlaams dialect
- **Campaign 10-12 design doc**: CAMPAIGN-MISSIONS-10-12.md with full briefings, map layouts, and narrative events

### Changed
- **Voice lines rewritten**: All Brabanders voice lines purged of fake "-ansen" suffix dialect, replaced with authentic Brabants ("ge", "hedde", "nie", "moar"). Unit renames: Kansen→Sluiper, Muzikansen→Muzikant, Prins van Brabansen→Prins van Brabant
- **Faction-specific upgrade ranges**: UpgradeId enum now uses non-overlapping ranges per faction (Brabanders 10-13, Randstad 20-23, Limburgers 30-33, Belgen 40-43)

### Fixed
- **36 `any` types** replaced with proper types across NavMeshManager, ProductionSystem, DeathSystem, BuildSystem
- **Dead imports** cleaned from 15 source files
- **Removed unused `yuka` dependency** from package.json

### Performance
- **Instanced rendering**: Draw calls reduced from N (one per unit) to 6 (one per unit-type×faction bucket). Projected 60 FPS at 200+ units (was ~45 FPS at 100 units)

## [0.6.1] - 2026-04-06

### Fixed
- **Mission 4 bonus objective**: "Verlies geen Kansen" was unloseable (tracked worker deaths but mission has no workers). Changed to "Houd je hele commando-team in leven" (have-units-at-end with targetValue 6)

## [0.6.0] - 2026-04-06

### Added
- **Music Integration System**: Dynamic battle intensity music (3 levels), faction themes (Brabanders/Randstad/Limburgers/Belgen), menu music, victory/defeat stingers, boss battle theme, crossfade transitions
- **Wood as 2nd resource**: Tree resource nodes on map, Lumber Camp building (Houtzagerij), workers gather wood from trees, HUD shows wood count
- **Tech Tree & Upgrades**: Blacksmith building with 7 researches — Zwaardvechten I/II, Boogschieten I/II, Bepantsering I/II, Snelle Mars I. Prerequisites, progress bars, retroactive application to existing units
- **Campaign missions 7-9**: "De Markt van Brabant" (economy+defense), "Het Beleg van Eindhansen" (siege warfare), "De Brabantse Nansen" (epic 2-front finale with CEO boss wave)
- **10 Suno music tracks**: Main menu, 4 faction themes, battle low/high, victory, defeat, boss battle

### Fixed
- **HERO_ARCHETYPES null check**: hero-died/hero-revived events now guard against invalid heroTypeId preventing potential crash
- **Defeat track trimmed**: 3:31 → 1:10 with fade-out (appropriate length for defeat stinger)

## [0.5.2] - 2026-04-05

### Fixed
- **Double Y-offset on buildings**: `syncRenderPositions` no longer positions buildings (was fighting with `BuildingRenderer.update`). Buildings now exclusively positioned by their renderer with correct per-model offset.
- **Movement Y-jitter**: Units now lerp to terrain height (`dt * 12` rate) instead of snapping, eliminating vertical stutter on micro-bumps.

## [0.5.1] - 2026-04-05

### Fixed
- **CRITICAL**: `destroy-building` objective now counts ALL destroyed enemy buildings, not just TownHalls. Fixes Mission 4 bonus objective "Vernietig de 2 bevoorradingsdepots" which was impossible to complete.
- **Division by zero guard**: MovementSystem uses `Math.max(_dist, 0.001)` to prevent NaN propagation if unit spawns exactly on target position.

## [0.5.0] - 2026-04-05

### Added
- **Campaign missions 4-6**: "De Binnendieze" (stealth commando), "Heuvelland Diplomatie" (survive Limburgse tests), "De Boerenopstand" (free tractors, destroy garrison)
- **51 ElevenLabs voice lines**: Per-unit-type voices for Boer (calm farmer), Carnavalvierder (euphoric party animal), Kansen (whispery stealth) + Randstad generics
- **Voice line integration**: `playUnitVoice()` triggered on select, move, attack, gather with unit-type-specific personality
- **Per-unit voice settings**: Different ElevenLabs stability/style per unit type for distinct personalities
- **Failed path tracking**: Voice system silently skips missing audio files without console spam

### Changed
- **UnitVoices.ts refactored**: From flat faction-only to `faction/unitType/action_n.mp3` hierarchy with fallback to generic
- **Building Y-offset**: v02 models lifted +0.6, v01 +0.3 to prevent sinking into terrain
- **Building update loop**: Consistent Y-offset applied via `userData.buildingYOffset` during frame updates

### Fixed
- **Building sinking**: Town Hall and Barracks no longer clip into terrain on hilly maps

## [0.4.0] - 2026-04-05

### Added
- **Post-processing pipeline**: EffectComposer with bloom (strength 0.3, threshold 0.85) and green selection outlines (OutlinePass)
- **Procedural walk animation**: Units bob, sway, and lean forward when moving, with smooth idle-to-walk transitions
- **Meshy v6 model generation script**: `scripts/generate_v6_models.sh` — image-to-3D using concept art references, production quality
- **v02 model set**: New Meshy v6 production models replacing v2 preview blobs (in progress)

### Changed
- Minimap now renders with proper terrain cache, fog of war overlay, faction-colored units, and camera viewport indicator
- HUD minimap data interface exported for type-safe updates

## [0.3.0] - 2026-04-05

### Added
- **Sky dome**: Procedural gradient sky (deep blue → sky blue → golden horizon haze)
- **Atmospheric fog**: Exponential fog for depth and distance haze
- **Shadow mapping**: PCFSoft shadows from sun light (2048x2048 shadow map)
- **Dust particles**: 200 floating golden dust motes for atmosphere
- **Particle effects system**: 500-particle pool with 5 effect types:
  - Gold sparkle on resource deposit
  - Construction dust on building placement
  - Combat hit sparks (melee red/orange, ranged blue/white)
  - Death effect with faction-colored smoke
  - Ability burst ring (carnavalsrage orange ring)
- **Ambient audio**: Birds and wind loops auto-start on game init

### Changed
- **Terrain**: MeshStandardMaterial (was Lambert), richer 9-color palette with ±10% micro-variation, max height 5 (was 3), receiveShadow enabled
- **Water**: MeshStandardMaterial with roughness 0.2, metalness 0.3, reflections
- **Units**: 1.5x scale, shadow casting, larger blob shadows (1.2 radius), red damage flash, bigger idle bob (0.08), larger move indicators
- **Buildings**: 1.8x scale, shadow casting, larger production gear indicator
- **Props**: Trees 1.5x scale, rocks 1.3x scale, shadow casting on all
- **Selection circles**: 1.5x scale, health bars 2.0x0.3 (was 1.5x0.2), Y offset 2.5 (was 1.8)
- **HUD**: Always-visible resource bar (gold/pop/gezelligheid), restyled minimap (180x180, gold border), command panel bottom-center with 44px buttons, selection panel bottom-right, slide-in alert toasts, polished game-over screen

## [0.2.1] - 2026-04-05

### Fixed
- **CRITICAL**: Duplicate event listeners for `unit-trained` and `unit-died` — both `_setupMissionEvents()` and `setupEventListeners()` registered handlers, causing double audio, double mesh creation, and double stat tracking
- **CRITICAL**: Event listener accumulation between missions — canvas click/mouseup/mousemove and window keydown listeners were never removed, causing input lag and memory leaks on replay
- **CRITICAL**: No ECS world reset between missions — dead entities from previous missions persisted in bitECS world, degrading performance
- **WARNING**: HUD listener accumulation — `initHUD()` created new HUD instances without destroying the old one
- Dead imports removed: `IsSummon`, `getHeroTypesForFaction`, `resetHeroTracking`, `setAbilityTarget`, `getPendingRevivals` (Game.ts), `audioManager` (GameStates.ts)

### Added
- `cleanup()` method on Game class — properly tears down event listeners, EventBus, HUD, entity meshes, and ECS world between games/missions
- `addTrackedListener()` helper for automatic canvas/window listener tracking and removal
- Idempotency guards on `setupInput()` and `setupEventListeners()` to prevent double registration

### Changed
- `initMission()` now calls `cleanup()` before re-initializing, ensuring clean state
- `initMission()` reformatted from compressed one-liners to readable multi-line code

## [0.2.0] - 2026-04-05

### Added
- Initial release: 2 playable factions, 4 heroes, 3 campaign missions
- Three.js rendering, bitECS ECS, recast-navigation pathfinding
- Fog of War, minimap, tutorial, main menu
- 15 SFX (ElevenLabs), 12 Meshy 3D models
