# Changelog

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
