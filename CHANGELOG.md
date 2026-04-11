# Changelog

## [0.22.0] - 2026-04-11

### Added
- **Social share buttons** -- WhatsApp, Facebook, LinkedIn, Telegram, X op steun, het-verhaal en bedankt pagina's
- **/deel/ pagina** -- Social sharing hub met kant-en-klare berichten per platform en UTM tracking
- **Heavy unit type** -- UnitTypeId.Heavy volledig werkend met faction-specifieke archetypes (Tractorrijder, Corporate Advocaat, Mergelridder, Frituurridder)
- **Heavy model rendering** -- UnitRenderer model mappings voor heavy_0-3 (infantry fallback)
- **Social media profielfoto's** -- 3 unieke 1080x1080 karakterportretten (Prins, CEO, Frietkoning) via Flux Pro
- **Cinematic images** -- Landscape (1920x1080) en portrait (1080x1920) key art voor social media
- **Deploy validatie gate** -- Pre-deploy check: public/dist file parity, minimum asset counts, entry point verificatie
- **Post-deploy HTTP verificatie** -- Automatische 200-check op 5 kritieke URLs na deploy
- **Server architectuur documentatie** -- docs/server-architecture.md met volledige M4 topology

### Fixed
- **Play page OG image** -- Gebruikte hero-banner.webp i.p.v. og-play, nu correct
- **Heavy unit crash** -- Missie "Vijandige Overname" (Randstad) hing op 85% door UnitTypeId.Heavy zonder archetype
- **Out-of-bounds missie coordinaten** -- 5 missies (randstad-3/5, brabant-10/11/12) geschaald naar map bounds (max +/-62)
- **OG images te groot voor WhatsApp** -- PNG (994KB) geconverteerd naar JPG (226KB), WhatsApp previews werken nu
- **Missende assets na deploy** -- Stale dist/ veroorzaakte 251 ontbrekende bestanden, opgelost door clean build pipeline

### Changed
- **OG meta tags** -- og:locale (nl_NL) en og:site_name (Reign of Brabant) toegevoegd aan alle 12 pagina's
- **OG images formaat** -- PNG naar JPG voor alle 9 OG images (70-80% kleiner)
- **Bedankt pagina share buttons** -- WhatsApp + Facebook + LinkedIn toegevoegd naast bestaande X + Copy
- **Deploy script** -- Altijd clean build (rm -rf dist), validatie gate, HTTP verificatie, veilige rsync
- **Mollie betaalsleutel** -- Test key vervangen door live key, betalingen actief
- **Game.ts createUnitEntity** -- Gebruikt nu getFactionUnitArchetype() met legacy fallback i.p.v. directe UNIT_ARCHETYPES index
- **factionData.ts** -- Heavy units (4 facties) typeId gecorrigeerd van Infantry naar Heavy

### Documentation
- **Social media strategie** -- research/social-media-strategy.md (4-weken plan, 5 platforms)
- **Social content drafts** -- research/social-content-ready.md (kant-en-klare posts)
- **Social image checklist** -- research/social-image-checklist.md (65 assets, 10 screenshot momenten)
- **itch.io + IndieDB drafts** -- research/listings/itch-indiedb-draft.md + Reddit posts
- **Server architectuur** -- docs/server-architecture.md

## [0.21.0] - 2026-04-11

### Added
- **Hero portrait images** -- 8 unique hero portraits (Prins, Boer, CEO, Politicus, Mijnbaas, Maasmeester, Frietkoning, Abdijbrouwer) via fal.ai Flux Dev
- **Unit portrait images** -- 12 faction-specific unit portraits (worker/infantry/ranged x 4 factions) in consistent RTS painted art style
- **Portrait mapping module** -- `src/data/portraitMap.ts` maps faction + unit type to portrait URL with hero support
- **HUD portrait integration** -- Selected units now show portrait images instead of text abbreviations; UNIT_ABBREV fallback preserved
- **Terrain variatie** -- Heightmap verhoogd (2.0 -> 4.5), plateaus, kliffen, 4 biomes (meadow/urban/aquatic/arid) per map template
- **Rivieren en bruggen** -- Rivieren als natuurlijke barrières met bruggen als strategische choke points
- **Rotswanden** -- Onpasseerbare rotsformaties die routes forceren
- **Wegen** -- Visuele paden tussen bases met 35% speed bonus voor units
- **Map Tunnel System** -- Bidirectioneel warp-systeem met travelTime, neutraal of faction-owned, 3D visuele ingangen
- **20 map variatie tests** -- Biome assignment, rivers, bridges, tunnels, roads, rock walls per template
- **Nieuwe OG image** -- Episch RTS slagveld key art voor og-main/og-landing/og-play
- **Limburg + Belgen heroes** -- 4 nieuwe hero archetypes: Mijnbaas (Tank/Siege), Maasmeester (Support/Healer), Frietkoning (Melee/Diplomaat), Abdijbrouwer (Support/Buffer)
- **Factie-specifieke hero training** -- Heroes dynamisch per factie via T/Y hotkeys, niet meer hardcoded Brabant
- **8 unieke hero 3D modellen** -- Meshy v6 image-to-3D met Blender auto-rig, 17-bone armature, 4-5 animaties (idle/walk/attack/death/rangedAttack)
- **Hero model rendering** -- UnitRenderer laadt hero-specifieke GLB modellen met skeletal animatie, 1.8x schaal
- **Tunnel visuele upgrade** -- Van primitieve torus naar herkenbare grot-ingang met stenen boog, lantaarns en grondmarkering

### Changed
- **Het Verhaal pagina** -- Herschreven van technisch spec-document naar verhalende projectpagina met PoC framing
- **Steun pagina** -- Content geüpdatet met ongoing PoC framing, eerlijke kostenverantwoording (honderden EUR/maand)
- **Map templates verrijkt** -- Classic (rivier+bruggen+tunnels), Crossroads (ruïnes+wegennet), Islands (4 eilanden+4 bruggen), Arena (rotsring+radiale wegen)

## [0.19.0] - 2026-04-10

### Added
- **Umami Analytics** — Self-hosted op analytics.reign-of-brabant.nl (M4 Docker)
- **Mollie Payment Server** — iDEAL, Creditcard, Bancontact, PayPal via /api/payment
- **Live donatie-teller** — /api/donations/stats endpoint, worstenbroodjes counter op steun pagina
- **Crypto wallets** — BTC + ETH Kraken deposit adressen met QR codes op /steun/
- **robots.txt + sitemap.xml** — 10 URLs, Disallow /api/ en /assets/audio|models/
- **Structured data (JSON-LD)** — VideoGame, Organization, BreadcrumbList schema
- **8 OG images** — Unieke 1200x630 images per pagina via fal.ai Flux Pro
- **Twitter cards** — summary_large_image op alle pagina's
- **Canonical URLs + hreflang** — nl op alle pagina's
- **Floating CTA** — Sticky "Doe mee" bar op /steun/ na 30% scroll
- **Custom tracking events** — play_click, steun_page_visit, donate_click

### Changed
- **Loading 50% sneller** — Selective faction loading (2 ipv 4 facties, ~150MB ipv 400MB+)
- **Echte loading progress** — Bar toont daadwerkelijke model download voortgang, geen fake fases
- **og:image absolute URLs** — Relatieve paden gefixt naar https://reign-of-brabant.nl/...
- **Payment buttons** — Van placeholder links naar echte Mollie API checkout calls

### Fixed
- **Payment minimum** — Server accepteert nu EUR 1.00+ (was 2.50, maar 1 broodje = EUR 2)

## [0.18.0] - 2026-04-10

### Added
- **reign-of-brabant.nl** — Eigen domein live op Mac mini M4 in Bladel (Cloudflare Tunnel + Caddy)
- **deploy-rob.sh** — rsync deploy script (build → backup → rsync → cache purge → health check)
- **Faction-specifieke unit costs** — getFactionUnitArchetype() vervangt hardcoded cost tabellen
- **MINIMUM_MELEE_RANGE constant** — 1.5 range op alle melee archetypes, workarounds verwijderd
- **Worker auto-assign** — Nieuw getrainde workers gaan automatisch nearest resource gatheren
- **Rally point op resources** — Rechts-klik resource met gebouw geselecteerd → workers auto-gather
- **Minimap fog-of-war** — Enemy units/buildings gefilterd op visibility, explored = 40% alpha
- **Hero ability UX panel** — Visuele Q/W/E knoppen, cooldown sweep, tooltips, click-to-cast
- **Late-game scaling** — Unit upkeep (1g/15s per militair), diminishing returns (<25% = 70% gather), AI scaling (+10%/+20% na 10/20 min)
- **Population tier warnings** — Geel 60%, oranje 80%, rood 100% + alert
- **UpkeepSystem** — Nieuw ECS systeem in Phase 5 (economy)
- **26 nieuwe tests** — UpkeepSystem (5), LateGameScaling (11), PlayerState military tracking (10)
- **/steun/ crowdfunding pagina** — Worstenbroodjes-economie, iDEAL + crypto, Konami code easter egg
- **/steun/bedankt/ pagina** — Canvas badge generator, confetti, social share
- **13 fal.ai visual assets** — Hero banner, world map, 4 factie scenes, 4 hero portraits, concepts
- **2 Kling cinematic previews** — Image-to-video (3.0 Pro) + text-to-video (2.5 Turbo)
- **Landing page** — Ubergave root page met parallax, factie showcase, cinematic embed, bio Richard
- **"Nie Fokke Mee Brabant"** tagline op landing + steun pagina

### Changed
- **vite.config.ts** — base: '/' (was '/games/reign-of-brabant/'), multi-page rollupOptions
- **deploy-ftp.sh** — Hardcoded FTP wachtwoord verwijderd, --clean flag, upload counter

### Fixed
- **Symlink play/assets → assets** op server (game laadt assets relatief vanuit /play/)
- **Voice sample paden** op steun pagina (correcte bestanden per factie)

## [0.17.0] - 2026-04-07

### Added
- **Randstad Campaign — "De Grote Overname"**: 5 missions teaching Randstad mechanics progressively
  - R1: "De Eerste Vergadering" — Tutorial: gather PowerPoints, recruit Stagiairs, survive Brabander protest
  - R2: "Het Consultancy Rapport" — Build Vergaderzaal, train Managers/Consultants, destroy Brabander outpost
  - R3: "De Vijandige Overname" — Two-front attack on Limburger mining operations, AI production enabled
  - R4: "Gentrificatie" — Survive 4 waves of Belgen counter-attacks while building up the corporate district
  - R5: "De Boardroom Beslissing" — Epic finale: defeat all 3 factions (Brabanders, Limburgers, Belgen) on a 256-size map
- **Randstad campaign tab active**: Previously showed "SOON" badge, now fully playable with 5 missions

## [0.16.3] - 2026-04-07

### Added
- **10 unique Meshy 3D models** for Limburgers and Belgen factions — faction-specific unit meshes replace Brabanders fallback models
- **Auto-defend system**: Workers self-defend when enemies enter SELF_DEFENSE_RANGE (6 units). Idle units auto-aggro within AGGRO_RANGE (12 units). Damaged units retaliate against their attacker
- **Camera intro**: Cinematic zoom arc at mission start (3.5s duration)
- **Pause menu**: ESC hotkey with hotkey reference overlay
- **Drag box multi-select**: Click-and-drag rectangle selection for units
- **Dynamic production panel**: Per-building/faction production buttons and queue display with queued items count
- **Fullscreen tip**: Shown on game start to encourage fullscreen mode
- **Meshy parallel generation script**: `scripts/meshy_parallel_generate.py` for batch 3D model generation
- **Victory confirmation delay**: 0.5s delay before victory triggers, prevents same-frame victory/objective-update race condition
- **Multi-faction campaign support**: MissionSystem detects player faction, campaigns work for all 4 factions
- **Faction music themes**: MusicSystem supports themes for all 4 factions

### Changed
- **Terrain overhaul**: 256 segments (was 128), height 2.0, slope-based color blending, spawn area flattening for building placement
- **Water rendering**: Depth gradient coloring, increased metalness, 3-wave animation system
- **-ansen purge**: 40+ occurrences of fake "-ansen" dialect suffix removed across 12 files — replaced with authentic Brabants dialect
- **Faction-aware unit system**: Unit names, costs, and production options vary per faction in HUD and production panels
- **Building/prop Y-offsets**: Fixed sinking into terrain — correct per-model vertical offsets applied
- **Selection renderer**: Updated selection circles and health bars for new terrain heights
- **Unit renderer**: Faction-specific model paths, improved instanced rendering for 4-faction support
- **Design bible**: Updated to v0.16.3 with current game state

### Fixed
- **Victory/defeat race condition**: Guard on required objectives count (must be > 0) prevents instant victory on missions with no required objectives
- **Victory on incomplete objectives**: handleVictory() now re-evaluates objectives and blocks if any required objective is incomplete
- **Defeat on tutorial mission**: TownHall destruction defeat check skipped for missionIndex 0 (tutorial)
- **Campaign faction detection**: CampaignUI and MissionSystem correctly identify player faction for non-Brabanders campaigns

## [0.11.0] - 2026-04-07

### Added
- **Map template selector in skirmish menu**: Players choose from 4 battlefield layouts before starting — Klassiek (classic), Kruispunt (crossroads), Eilanden (islands), Arena. Selection flows from menu through to MapGenerator
- **MapTemplateChoice type**: Exported from MenuScreens for type-safe map template selection

### Changed
- **Faction selection callback**: `onFactionSelected` now includes `mapTemplate` parameter, propagated through Game init and main entry point

## [0.10.0] - 2026-04-06

### Added
- **3 skirmish map templates**: 'crossroads' (edge spawns, intersection resources), 'islands' (peninsula bases, open center), 'arena' (close-quarters ring, fast-paced). All support 2-4 players
- **Belgen Campaign — "Het Compromis"**: 3 missions (De Eerste Frituur, Het Chocolade Verdrag, De Commissievergadering) teaching Belgen mechanics progressively
- **Faction campaign tabs**: CampaignUI now shows 4 faction tabs with "SOON" badges for unavailable campaigns
- **Faction-specific HUD commands**: Workers show faction-specific build buttons (Mijnschacht for Limburgers, Chocolaterie for Belgen, renamed buildings for Randstad)
- **Faction unit names in HUD**: Units display faction-appropriate names (Stagiair/Manager/Consultant for Randstad, Mijnwerker/Schutterij for Limburgers, etc.)
- **MapTemplate type**: Exported for future skirmish mode map selection

### Changed
- **Balance pass across all 4 factions**: Asymmetric design — Brabanders (group synergy), Randstad (expensive powerhouse), Limburgers (tanky/slow), Belgen (glass cannon). Adjusted HP/ATK/ARM/SPD/Cost for 30+ unit types and 40+ building types
- **Limburgers tankiest**: Mergelridder 280 HP / 6 armor (highest in game), Mergelhoeve 1800 HP TownHall
- **Belgen most fragile**: Bierbouwer 0 armor, Chocolatier 40 HP, Stadhuis 1400 HP (lowest TownHall)
- **All healers**: Explicit healRate values added (Boerinne 7, HR-Medewerker 8, Sjpion 7, Wafelzuster 7)
- **All siege units**: Explicit siegeBonus values (3.0-4.0x) for building damage

## [0.9.2] - 2026-04-06

### Fixed
- **CRITICAL: Tertiary resource field mismatch** — UndergroundSystem and DiplomacySystem read `getGezelligheid()` instead of `getTertiary()`. Kolen and Chocolade accumulated but were never consumed. Tunnels always shut down, Compromis always failed
- **HIGH: HUD.setFaction() never called** — CSS faction theming (accent colors, glows) was dead code. Now called in initHUD() with correct faction mapping
- **HIGH: AI hero timer += 2 per tick** — Heroes trained every ~0.08s instead of every 5s. Fixed timer to use frame-based counting
- **MEDIUM: Attack wave spam** — `lastArmySize = 0` overwrite caused AI to re-issue attack commands to all units every 2s. Removed erroneous reset
- **MEDIUM: Gezelligheid bar flash** — Non-Brabanders players saw gezelligheid bar briefly before first HUD update. Now hidden at init

## [0.9.1] - 2026-04-06

### Fixed
- **CRITICAL: VisionSystem hardcoded to Brabanders** — Non-Brabanders players got no fog-of-war vision. Now uses shared `gameConfig.playerFactionId`
- **CRITICAL: CommandSystem hardcoded to Brabanders** — Non-Brabanders players could not issue move/attack/gather commands. Now uses `gameConfig.isPlayerFaction()`
- **CRITICAL: AISystem.setFaction() never called** — AI controlled wrong faction when player picked Randstad (faction swap). Now called in `Game.init()` after remap
- **HIGH: TechTreeSystem only initialized 2 factions** — Limburgers/Belgen had no tech tree state. Now initializes all 4 factions

### Added
- **GameConfig singleton** (`src/core/GameConfig.ts`) — Shared runtime config for player faction, accessible by all ECS systems
- **53 automated tests** — MapGenerator (13), PlayerState (24), AIController (16) via Vitest

## [0.9.0] - 2026-04-06

### Added
- **4 playable factions**: Limburgers and Belgen now fully selectable in faction chooser alongside Brabanders and Randstad
- **Faction systems wired into pipeline**: UndergroundSystem (Limburgers tunnels), DiplomacySystem (Belgen compromis), TertiaryResourceSystem (Kolen/Chocolade/Havermoutmelk) now active in game loop
- **Multi-player map generator**: Supports 2-4 player spawns with balanced resource distribution, 4-corner spawn positions
- **Faction-aware AI**: Per-faction strategies — Brabanders (Gezelligheid rush), Randstad (Corporate expansion), Limburgers (Underground ambush), Belgen (Diplomatic siege)
- **4-faction rendering**: Limburgers (dark green #3a7d32) and Belgen (burgundy #a01030) faction tint colors in UnitRenderer and BuildingRenderer, model path entries with fallback to Brabanders models
- **Player faction choice**: Selected faction flows from menu → game init, all game systems use playerFactionId instead of hardcoded Brabanders
- **Faction-specific HUD**: Tertiary resource display for non-Brabanders, Gezelligheid hidden for non-Brabanders, death particles colored per faction
- **PlayerState 4-player support**: Expanded from 2 to 4 player slots
- **Faction remap system**: Player's chosen faction swapped into slot 0 for consistent spawn positions

### Changed
- **Game.ts refactored**: ~60 hardcoded `FactionId.Brabanders` references replaced with dynamic `playerFactionId`
- **Binary faction mapping removed**: All `FACTION_ORANGE`/`FACTION_BLUE` ternaries replaced with direct factionId usage
- **AI opponent detection**: Game-over check now uses "not player faction" instead of hardcoded FactionId.AI
- **Building completion**: AI building instant-complete now checks "not player faction" instead of FactionId.AI

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
