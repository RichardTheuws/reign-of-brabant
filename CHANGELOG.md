# Changelog

## [0.37.26] - 2026-04-25 — Audit Fase 5 (tech tree) — stappen 24-26 + audit-04 fix

### Audit
- Fase 5 stappen 24 (Blacksmith upgrade-paneel + retroactief), 25 (Tier 2 unlock-gate), 26 (Tier 3 gate). Audit-04 finding bevestigd voor alle 4 facties: `BuildingTypeId.UpgradeBuilding` ontbrak compleet, waardoor Tier 3 (FactionSpecial2 + SiegeWorkshop) permanent vergrendeld was. Heavy units en Siege units waren in praktijk onbereikbaar.

### Fixed (audit-04 §3.2 + §4 — circulair Tier 3 gate)
- **`src/data/factionData.ts`**: per factie een `BuildingTypeId.UpgradeBuilding` archetype toegevoegd in `FACTION_BUILDINGS`:
  - **Brabanders**: Wagenbouwer (350g + 200 secondary, hp 600, 50s)
  - **Randstad**: Innovatie Lab (400g + 225, hp 700, 55s)
  - **Limburgers**: Hoogoven (350g + 200, hp 800, 55s)
  - **Belgen**: Diamantslijperij (375g + 225, hp 600, 55s)
- **`src/ui/factionBuildMenus.ts`**: hotkey **C** ('build-upgrade') per factie toegevoegd. Tier=2 (zichtbaar/buildbaar zodra Blacksmith complete is). Brabanders skipt geen letter meer.

### Added (test coverage, +46 tests, 908 → 954)
- `tests/TechTreeSystem-research-lifecycle.test.ts` (+18) — UPGRADE_DEFINITIONS structuur (7 universele upgrades, prerequisite-chains MeleeAttack1→2, RangedAttack1→2, ArmorUpgrade1→2). startResearch validation: gold-deduct + 'research-started' event, refuses bij geen-goud / geen-prerequisite / al-busy / al-onderzocht. **Retroactief**: completed MeleeAttack1 voegt direct +2 dmg toe op bestaande Brabanders Infantry; affectsUnitTypes-filter (Ranged niet beïnvloed); ArmorUpgrade1 raakt ALLE units (null filter); MoveSpeed1 vermenigvuldigt speed * 1.10; faction-filter (vijandelijke units onaangetast). applyAllUpgradesToNewUnit: nieuw-getrainde unit krijgt cumulatieve stack. Blacksmith destroyed mid-research → cancel.
- `tests/TechTreeSystem-tier-gates.test.ts` (+28) — T2-gate per BuildingType (Housing/DefenseTower/TertiaryResource/FactionSpecial1/UpgradeBuilding) blokkeert zonder Blacksmith, blokkeert met INCOMPLETE Blacksmith, opent met complete. Cross-faction-filter: vijandelijk Blacksmith ontgrendelt niets. T3-gate (FactionSpecial2/SiegeWorkshop): blokkeert met alleen Blacksmith, opent met UpgradeBuilding complete. **Audit-04 lock**: alle 4 facties MOETEN een UpgradeBuilding archetype hebben in FACTION_BUILDINGS — zodra dit ontbreekt is Tier 3 onbereikbaar.

### Notes
- Tutorial step 8 (Carnavalvierder training) blijft Brabant-Infantry-only — geen wijziging in flow.
- Volgende fase: Fase 6 (advanced units + heroes), met test-suite groei tot ~1100 verwacht.

## [0.37.25] - 2026-04-25 — Audit-finding fix: HoldPosition retaliation respects state

### Fixed (audit-finding uit v0.37.23 fase 4)
- **`CombatSystem.ts:209-225`** — Retaliation-logic flipte ELKE geraakte non-Attacking-non-Dead unit naar `Attacking`, ongeacht of die op HoldPosition stond. Dit brak het "hold respects state, never chases"-contract: een hold-positioned unit ging chasen zodra ie geraakt werd.
- **Fix**: `HoldPosition` toegevoegd aan exclusion-list. Nieuwe gedrag: hold-units verkrijgen wel het attacker-target (zodat `processHoldPosition` volgende tick kan terugschieten) maar verlaten NOOIT HoldPosition state. Movement.hasTarget blijft 0 → geen chase.

### Tests updated (KNOWN GAP → contract)
- `tests/CombatSystem-hold-position.test.ts` — De voormalige "AUDIT FINDING" test die het bug-gedrag locked, is geflipt naar de nieuwe contract-eis: hold-unit blijft in HoldPosition na hit. Tweede contract-test toegevoegd: hold-unit chase-t niet wanneer attacker terugtrekt. Test-suite: 907 → 908 (+1).

## [0.37.24] - 2026-04-25 — P0 fix: Mission 1 hout-deadlock + Brabant building-naming

### Fixed (P0 game-breaker, gemeld door Richard live op v0.37.23)
- **Mission 1 (`brabant-1-de-oogst`) had geen `treeResources` ingedefinieerd**, terwijl Tutorial stap 8 forceert dat de speler een Carnavalvierder traint (Brabanders Infantry, costGold=75 + costSecondary=25 hout). Geen bomen → geen hout → tutorial onhaalbaar. Vijf bomen toegevoegd rond TownHall (-20,-20), totaal 1000 hout, alle binnen 25u afstand van de TownHall.
- **Brabant missies/tutorial gebruikten generiek "Kazerne" i.p.v. de factie-naam "Cafe"**, terwijl Belgen al "Frituur (Kazerne)" en Limburgers "Heuvelfort (Kazerne)" hanteren. Voor consistentie nu ook Brabant: "Cafe (Kazerne)" als hint, daarna "Cafe". Aangepast in M1 build-barracks objective, M2 briefing, M2 hint-triggers, M3 hint, en Tutorial.ts step 5/6/7/8.
- **Tutorial step 8 bericht uitgebreid** met expliciete waarschuwing dat 25 hout nodig is — "stuur een Boer naar de bomen als je nog geen hout hebt".

### Added (regression class lock, +46 tests, 861 → 907)
- `tests/MissionDefinitions-resources.test.ts` — locks per missie:
  - **Tutorial-mission lock**: `brabant-1-de-oogst` MOET `treeResources.length>0`, totaal hout ≥ 50 (twee Carnavalvierders), minstens één boom binnen 25u van player TownHall, alle bomen binnen mapSize-bounds.
  - **Regression-class lock**: alle missies — als `treeResources` is gezet moeten amounts > 0; tutorial-mission speciaal: trees zijn verplicht.
  - **Cost-data anchors**: Brabanders Infantry kost wood (anchor voor tutorial-eis), Brabanders Barracks (Cafe) kost geen wood (anchor voor bonus-objective haalbaarheid).
  - **Faction-naming locks**: M1 build-barracks objective bevat "Cafe", M2 briefing bevat "Cafe", Belgen M1 bevat "Frituur", Limburgers heeft Heuvelfort-objective. Voorkomt dat per-factie naming naar "Kazerne" terugfaalt.

### Notes
- Test-suite groei deze sessie: 861 → 907 (+46, +5%). Volledig groen via pre-deploy gate.
- Originele cause: tutorial-mission was nooit speelbaar getest met de bonus-objective gedwongen Infantry training. Nieuwe locks dwingen volgende tutorial-missies (andere facties) ook tot tree-coverage.

## [0.37.23] - 2026-04-25 — Audit Fase 4 (combat) — stappen 18-22

### Audit
- Fase 4 (combat, 5 stappen 18-22) afgerond. CombatSystem had vóór deze sessie ALLEEN pure formule-tests. Nu ook integratie-coverage tegen `createCombatSystem()` met echte bitecs world.

### Added (test coverage, +64 tests, 797 → 861)
- `tests/CombatSystem-attack-move.test.ts` (+11) — A-key contract: Movement.hasTarget=1, UnitAI.state=Idle (zodat auto-aggro fires), originX/Z als leash, NeedsPathfinding tag, worker Gatherer-reset, niet-Selected guard. Auto-aggro lock: closest-enemy keuze, AGGRO_RANGE filter, geen friendly fire, dode targets genegeerd.
- `tests/CombatSystem-hold-position.test.ts` (+11) — Hold cmd writes (Movement.hasTarget=0, state=HoldPosition), processHoldPosition scant alleen binnen Attack.range, NIET binnen AGGRO_RANGE, geen state-transitie naar Attacking, drop-target bij range-loss. **Patrol-cmd gap-lock** (bestaat niet in CommandSystem, gedocumenteerd).
- `tests/CombatSystem-damage-matrix.test.ts` (+25) — Volledige 4×5 DAMAGE_MODIFIERS matrix gevalideerd via echte CombatSystem (niet pure functie). MIN_DAMAGE clamp, Attack.siegeBonus stack met Siege→Building 2x → 6x totaal, ARMOR_FACTOR=0.5 subtractie, multiplier vóór armor-aftrek.
- `tests/DeathSystem.test.ts` (+11) — DeathTimer init op eerste tick, Health-clamp, geen event-emit voor cleanup-deadline. DEATH_TIMER=2.0s gedrag. unit-died/building-destroyed events met correcte payload. Worker decrementeert populatie maar NIET militaire telling; non-worker decrementeert beide; Hero gebruikt PopulationCost.cost. CombatSystem.processAttacking → clearAttackAndSeekNew bij IsDead-target.
- `tests/CombatSystem-building-destruction.test.ts` (+6) — HP drain via processAttacking met Siege→Building 2x bonus. IsDead tag automatisch op buildings bij HP<=0. Auto-aggro pickup van enemy buildings. Splash damage hits gebouwen binnen radius met linear falloff, geen friendly fire.
- `uat/02-skirmish-quickstart.spec.ts` — Playwright e2e: main menu → btn-play → faction-select → Brabanders kiezen → confirm → wacht op stateMachine.currentId === 'PLAYING'. 15s round-trip, console-guard actief.

### AUDIT FINDING (locked, niet gefixt)
- **HoldPosition retaliation gap** — `CombatSystem.ts:218-220` doet auto-retaliate door state op `Attacking` te zetten en `targetEid` te overschrijven, ongeacht of de target HoldPosition stond. Hierdoor breaks het "hold respects state, never chases"-contract zodra een hold-positioned unit geraakt wordt. Vastgelegd in `CombatSystem-hold-position.test.ts` als `KNOWN GAP` test. Fix-voorstel: lijn 212 conditie uitbreiden met `&& targetState !== UnitAIState.HoldPosition`.

### Added (UAT infra)
- **`window.__rob` test hook** — In `src/main.ts` (DEV-only, `import.meta.env.DEV`): `globalThis.__rob = { game, eventBus, stateMachine }`. Maakt deterministische UAT-state-checks mogelijk zonder DOM-polling.

### Notes
- 25 abilities in UnitAbilitySystem + 24 hero-cases verkend via combat-map agent: ALLE hebben non-stub implementaties (audit 03-claim "20+ dead handlers" was te scherp; mogelijk dun, niet leeg). Stat-balans audit vindt plaats in fase 6 (heroes/abilities).
- F4 leverde 1 audit finding (HoldPosition retaliation), 0 P0/P1 bugs. Test-suite groei sessie: 797 → 861 (+64, +8%).

## [0.37.22] - 2026-04-25 — UAT scaffold + pre-deploy regression gate

### Added
- **Playwright UAT-suite** (`uat/` + `playwright.config.ts`) — eerste smoke `01-boot.spec.ts` valideert dat `/play/` boot, canvas + main-menu rendert, en geen onverwachte console errors gooit. Eigen `uat/tsconfig.json` om types-conflict met three.js te voorkomen.
- **Console-guard helper** (`uat/helpers/console-guard.ts`) — collecteert console errors + pageerrors, met allow-list voor verwachte ruis (favicon, vite HMR, Umami, three deprecation).
- **`vitest.config.ts`** — expliciete include `tests/**/*.test.ts` + exclude `uat/`, voorkomt dat vitest de Playwright specs oppakt.
- **npm scripts**: `test:uat`, `test:uat:headed`, `test:all` (typecheck → vitest → UAT), `predeploy`.

### Changed
- **`deploy-rob.sh`** — STEP 0 regression gate ingevoegd: vóór elke deploy draait `npm run test:all`. Faalt iets → deploy abort. Nieuwe `--skip-tests` flag voor noodgevallen (NOT recommended).

### Removed (F6/F7 dead metadata cleanup)
- **`src/types/index.ts`** — `FACTION_CONFIGS` const + `FactionConfig` + `TertiaryResourceConfig` interfaces verwijderd. Volledig dood: 0 imports buiten de definitie. `generationMethod` veld lag uitsluitend in deze dode struct. -123 regels.

### Notes
- Pre-deploy gate verifieerd: typecheck + 797 vitest + 1 UAT smoke groen.
- Volgende sessie-doel: **Fase 4 Combat audit** (stappen 18-22). UAT-suite groeit per fase mee.

## [0.37.21] - 2026-04-18 — Audit Fase 3b (training) — ProductionSystem + CommandSystem reset

### Audit
- Fase 3b (training, 3 stappen) afgerond. Geen P0/P1 bugs. Opnieuw gaten gedicht: **ProductionSystem werd alleen via geëxtraheerde pure functies getest, niet de daadwerkelijke createProductionSystem(). Bug 7 patroon (Gatherer.state reset) werd alleen voor handleBuild getest, niet voor de andere 6 command-handlers.**

### Added (test coverage)
- `tests/ProductionSystem-actual.test.ts` (+14 tests) — runt het echte `createProductionSystem()` tegen een bitecs world: progress accumulatie (Brabanders + Randstad bureaucracy slowdown), unit-spawning (entity-creatie + `unit-trained` event payload + populatie-increment), populatie-cap (clamp op 1.0 zonder spawn), guards (incomplete/dood/idle/duration<=0), queue-shift (next unit promoted, queue empty → NO_PRODUCTION), worker auto-assign naar nearest resource.
- `tests/CommandSystem-gatherer-reset.test.ts` (+10 tests) — locks de Bug 7 contract over ALLE command-types via de publieke `commandSystem` dispatch:
  - move/attack/attack-move/stop/hold → reset Gatherer.state naar NONE
  - gather → naar MOVING_TO_RESOURCE (de enige uitzondering)
  - selection-filter: niet-Selected workers en vijandelijke factie-units worden NIET gecommand
  - non-worker units behouden hun Gatherer.state (de `if (hasComponent(IsWorker))` guard werkt)
  - move clears UnitAI.targetEid (worker losgekoppeld van oude target)

### Notes
- **Test-suite groei deze sessie: 287 → 797 (+510 tests, +178%)**.
- Stap 17 ook gevalideerd: voice-lines bij command zit in audio-laag (`audioManager.playSound`), draait synchroon met `eventBus.emit('unit-trained')` etc. Niet apart getest — de events zijn al gelocked.

## [0.37.20] - 2026-04-18 — Audit Fase 3 follow-ups: F5 Havermoutmelkbar + buildingCost helper

### Fixed
- **F5 — Randstad missing X-hotkey (P1 game-breaker)**: Bij het vorige audit-rondje ontdekt dat `TertiaryResourceSystem` Randstad in `BUILDING_FACTIONS` heeft staan met rate 2.0 Havermoutmelk/sec per voltooide `TertiaryResourceBuilding`, maar dat de UI Randstad players geen enkele manier gaf om er één te plaatsen. Mission-text "vergeet de Havermoutmelk niet" (`MissionDefinitions.ts:4294`) was onhaalbaar. **Fix**: Randstad krijgt nu een X-hotkey "Havermoutmelkbar" (tier 2), identieke pattern als Limburg's Mijnschacht en Belgen's Chocolaterie. Brabanders blijft terecht uitgesloten — Gezelligheid is proximity-based via `GezeligheidSystem`.

### Refactored
- **`src/ui/factionBuildMenus.ts` (nieuw)** — `FACTION_WORKER_BUILDS`, `FACTION_BUILDING_LABELS`, `BASE_WORKER_CMDS`, `TIER_REQUIREMENT_LABELS` en bijbehorende types geëxtraheerd uit `HUD.ts` (2900-regel monoliet) zodat ze testbaar zijn zonder DOM. HUD.ts re-importeert.
- **`src/world/buildingCost.ts` (nieuw)** — `getBuildingCost`, `checkBuildingAffordability`, `chargeBuildingCost` geëxtraheerd uit `Game.handleBuildPlacement`. De 25-regel inline cost+spend logic is nu één pure helper-call. Alert-message blijft in Game.ts (UI-laag).

### Added (test coverage)
- `tests/factionBuildMenus.test.ts` (+77 tests) — hotkey grid coverage per factie (Q/E/R/T/F/G/Z verplicht voor allemaal, X verplicht voor non-Brabanders), cross-faction consistency (zelfde hotkey → zelfde `BuildingTypeId` overal), F5-regression-guard (Randstad MOET een X-hotkey TertiaryResourceBuilding hebben), tier validatie, faction-label sanity.
- `tests/buildingCost.test.ts` (+14 tests) — `getBuildingCost` archetype-lookup + fallback, `checkBuildingAffordability` ok/fail-gold/fail-wood/no-mutation/short-circuit, `chargeBuildingCost` deductie + de regression-guard "BEIDE resources worden afgetrokken bij gemixte cost" (precies de Bug 12 categorie die unit-training in v0.37.16 raakte).

### Notes
- **Test-suite groei deze sessie: 287 → 773 (+486 tests, +169%)**.
- Volgende fases (4 t/m 7 — combat, tier 2/3, endgame) wachten op groen licht.

## [0.37.19] - 2026-04-18 — Audit Fase 3 (economy tier 1) — GatherSystem + BuildSystem covered

### Audit
- Fase 3 (economy tier 1, 5 stappen) afgerond. Geen P0/P1 bugs. **GatherSystem en BuildSystem hadden ZERO directe test-coverage** — beide zijn nu volledig getest. Plus stap 12-14 was al gedekt door eerdere bug-fix tests (placement-river, placement-lumbercamp, worker-build-resets-gather).

### Added (test coverage)
- `tests/GatherSystem.test.ts` (+20 tests) — locks de complete worker-gather state machine:
  - State transitions: NONE → MOVING_TO_RESOURCE → GATHERING (op arrival distance) → RETURNING (bij volle carry) → MOVING (auto-resume zelfde resource na deposit).
  - Harvesting math: HARVEST_RATE per seconde, decrement van resource amount, carry-cap (max CARRY_CAPACITY), diminishing returns onder DIMINISHING_RETURNS_THRESHOLD.
  - Resource-uitputting: depleted-met-carry → RETURNING, depleted-zonder-carry → zoek volgende of idle, alle resources op → state NONE.
  - Deposit routing: gold naar TownHall, wood prefereert LumberCamp en valt terug op TownHall, vijandelijk gebouw telt niet, incompleet gebouw telt niet, geen deposit → state NONE.
  - End-to-end round trip: arrive → harvest → fill → return → deposit → +CARRY_CAPACITY gold in PlayerState.
- `tests/BuildSystem.test.ts` (+16 tests) — locks construction-progress accumulation:
  - 1/2/5 workers stacken lineair (BUILD_SPEED × workerCount × dt).
  - Worker buiten BUILD_RANGE telt niet; worker exact op de grens telt wel (boundary inclusive).
  - Vijandige factie-workers tellen niet; mixed crowd telt alleen eigen factie.
  - Dode workers tellen niet (IsDead component).
  - Completion: progress >= maxProgress → `complete=1`, `building-placed` event met juiste payload, geen re-emit op vervolg-ticks, progress wordt geclamped op maxProgress.
  - Defensieve guards: complete buildings worden geskipt, maxProgress<=0 wordt geskipt, dode buildings worden geskipt, geen workers in range → geen progress.

### Notes
- **Test-suite groei deze sessie: 287 → 682 (+395 tests in 1 dag, +138%)**.
- Building-cost-deduction (gold + wood spend bij placement) zit in `Game.handleBuildPlacement` en is correct, maar tied aan DOM raycaster + HUD — extractie naar pure helper is een aparte refactor (follow-up).
- Brabanders/Randstad hebben geen `X` hotkey-binding voor TertiaryResourceBuilding (alleen Limburgers + Belgen). Mogelijk intentioneel — to confirm.

## [0.37.18] - 2026-04-18 — Audit Fase 2 (map &amp; spawn) — +359 tests, factionRemap geëxtraheerd

### Audit
- Fase 2 (map &amp; spawn, 4 stappen) afgerond. Geen P0/P1 bugs. Test-coverage massief uitgebreid: **287 → 646 tests** in 1 sessie (+359 tests, +2 testbestanden).

### Added (test coverage)
- `tests/MapGenerator-templates.test.ts` (+330 tests) — vult de gap voor `fortress`, `river-valley`, `canyon`, `archipelago` (4 templates die geen directe coverage hadden). Plus een cross-template invariants suite die voor elke combinatie van **8 templates × 3 player counts** valideert: spawns/townhalls/workers counts, building↔spawn position-match, spawn-bounds binnen ±halfMap, faction-uniqueness, biome-validatie en defined terrainFeatures arrays. Plus robustness-suite: 7 weird seeds (0, 1, -1, 42, MAX_INT, MIN_INT, 1234567890) crashen geen template. Plus determinisme-tests (zelfde seed → identieke layout) en map-size scaling (80/128/192).
- `tests/factionRemap.test.ts` (+9 tests) — locks het slot-0-contract: na remap zit player-factie altijd in slot 0, oude slot-0-factie verschuift naar de slot van player's keuze. Spawns/buildings/units worden in lockstep ge-remapped, coordinaten blijven onaangetast, input wordt niet gemuteerd. Voor elke template × elke factie.
- `tests/RTSCamera.test.ts` (+20 tests) — pan (WASD + arrows), edge-scroll (mouse aan rand), zoom-clamp (MIN_ZOOM=8, MAX_ZOOM=80), map-bounds clamping, `setPosition` snap, `screenToWorld` raycast (zowel hit als legitiem null bij sky), resize, en shake decay.

### Changed (kleine refactor)
- `src/world/factionRemap.ts` (nieuw) — pure helper `remapMapPlayerFaction(map, newPlayerFaction)`. `Game.remapFactions` is nu een 1-liner die het helper aanroept i.p.v. inline-logica met `as any` cast op `this.map`. Geen gedragsverandering, wel directe testbaarheid van het slot-0-contract.

## [0.37.17] - 2026-04-18 — Audit Fase 1 (boot &amp; menu) + dead-code opruimen

### Audit
- Systematische full-playthrough audit gestart (33 stappen, 7 fases). Fase 1 (boot &amp; menu, 5 stappen) afgerond — geen P0/P1 bugs, 4 dead-code findings opgelost.

### Removed (dead code uit v0.31.x periode)
- `vite.config.ts`: `define: { __APP_VERSION__ }` block + `readFileSync`/`pkg` JSON-load. Werd vervangen door directe `import pkgJson from '../package.json'` in `main.ts` (CHANGELOG v0.31.2), maar de oude define + bijbehorende `declare const __APP_VERSION__` in `FeedbackReporter.ts` bleven achter.
- `src/main.ts`: dead `case 'tutorial'` (tutorial draait sinds v0.32.x in eerste campagnemissie, geen menu-knop meer) en `case 'settings'` (settings opent direct via `MenuScreens.showSettings()`, niet via `onMenuAction`).
- `src/ui/MenuScreens.ts`: `btn-tutorial` lookup + listener (DOM-element bestaat niet meer); `MenuAction` type krimpt naar `'play' | 'campaign'`.

### Tooling
- `tsconfig.json`: exclude macOS Finder duplicaten (`* 2.ts`, `* [0-9].ts`) zodat `tsc --noEmit` niet struikelt over per ongeluk gesynchroniseerde `index 2.html` / `main 2.ts` rommel.

## [0.37.16] - 2026-04-18 — Boerinneke, wood-deductie, Kerktoren, Smederij-paneel

### Fixed
- **Bug 11 — Boerinneke i.p.v. Boerinne**: ondersteuner rename (Brabants dialect) in factionData, HUD labels, Game.ts labels, unitAbilityMap. Portret-card toonde alleen "SUP" placeholder zonder kosten; nu:
  - Asset Generator heeft `cmd-heavy.png`, `cmd-siege.png`, `cmd-support.png` gegenereerd (Flux Dev + BiRefNet transparency, 256x256). Ingewired in `COMMAND_ICON_IMAGES`.
  - `getInlineUnitCost` gebruikt nu `getFactionUnitArchetype()` i.p.v. de legacy `UNIT_ARCHETYPES` array die maar tot Heavy (index 3) liep. Heavy/Siege/Support krijgen nu hun echte kosten getoond.
- **Bug 12 — Training trekt nu ook hout af**: `CommandSystem.handleTrain` riep alleen `playerState.spend()` (gold). `costSecondary` (hout) werd nooit afgeschreven. Nieuwe `getUnitWoodCostForFaction`-helper + `canAffordWood` + `spendWood` + wood-refund bij full-queue. `Game.ts::trainFromSelectedBuilding` doet nu een pre-flight check zodat speler direct hoort wat er ontbreekt (gold / wood / populatie). +3 red→green tests in `training-deducts-wood.test.ts`.
- **Bug 13 — Kerk → Kerktoren**: label hernoemd in HUD + factionData zodat speler direct herkent dat het een verdedigings-toren is. Noot: de GLB `tower.glb` voor Brabanders lijkt volgens user-feedback een windmolen; een nieuwe Meshy-regeneratie voor dit model is een aparte P2 follow-up.
- **Bug 14 — Smederij upgrade-paneel**: paneelstyling compleet herzien. Upgrade-buttons (160x56, horizontale flex met icoon + naam + kosten) zitten nu netjes binnen het paneel i.p.v. afgesneden aan de bovenkant. Progress-bar + research-timer stylen als gouden highlight. Paneelpositie verhoogd naar `bottom: 230px` wanneer het building-card zichtbaar is, zodat beide compleet zichtbaar zijn.

### Notes
- Upgrade-effecten op bestaande units (retroactieve stat-buffs na voltooide research) zijn nog niet volledig gevalideerd — zie audit 04 §5 voor follow-up.

## [0.37.15] - 2026-04-18 — FoW toggle label + bruggen schalen met rivier

### Fixed
- **Fog of War toggle** stond op "Aan" en liet na een klik de button in not-selected stijl staan terwijl `textContent` de span verving. Nu blijft de toggle altijd in de actieve (gouden) stijl en flipt alleen de `.diff-label` span tussen "Aan" en "Uit".
- **Bruggen op archipelago/river-valley waren visueel te smal** voor brede rivieren — user: "de bruggen zouden opgeschaald en juist gepositioneerd moeten worden om natuurlijk met de waterpartijen te werken". `snapBridgeToRivers` (voorheen `snapBridgeToRiver`) accepteert nu de volledige `rivers` array en schaalt de bridge-width dynamisch naar `riverWidth * 1.35 + 2` met een shore-marge. In archipelago kiest elke bridge de dichtstbijzijnde kanaal (ring of radial) i.p.v. altijd aan te nemen dat de ringPath correct is. 15 bridge-alignment tests blijven groen.

## [0.37.14] - 2026-04-18 — ECHTE root cause: globale wheel-preventDefault

### Fixed
- **Scroll in alle UI-menus werkte niet** (niet alleen skirmish) omdat `main.ts` een `window.addEventListener('wheel', e => e.preventDefault(), { passive: false })` had staan — bedoeld voor RTS camera-zoom, maar het blokkeerde élke wheel-event in de hele pagina inclusief scroll in menus, HUD-panels en tech-tree viewer. De DevTools screenshot van de gebruiker bevestigde dit: `.faction-scroll` had correct `overflow-y: auto` + `pointer-events: auto` + `touch-action: pan-y`, maar scroll kwam nooit aan omdat `preventDefault` op window-niveau al gedaan was.
- Fix: listener verplaatst van `window` naar `canvas` (het game-canvas element). Camera-zoom werkt nog steeds boven het game-veld; alle UI-menus en scrollable panels scrollen nu natief.

## [0.37.13] - 2026-04-18 — Safari wheel/trackpad claim

### Fixed
- **Skirmish menu scroll bleef niet werken in Safari** zelfs met `min-height: 0` + inner wrapper. User's Web-Inspector box model bevestigde dat `.faction-scroll` wel degelijk overflow had (content 248.91px in 218px container), maar scroll-events bereikten 'm niet. Root cause: `#ui-overlay` heeft `pointer-events: none` zodat het game-canvas eronder klikken ontvangt; direct children krijgen `pointer-events: auto` terug, maar Safari respecteert die inheritance niet altijd voor wheel-events op genest elements. Fix: expliciete `pointer-events: auto` + `touch-action: pan-y` op `.faction-scroll` + expliciete `::-webkit-scrollbar` styling. Scroll-container is nu ook pure `display: block` (i.p.v. flex) zodat scroll-gedrag identiek is aan standard scroll-containers, minder browser-bug-oppervlak.

## [0.37.12] - 2026-04-18 — echte scroll-container, Safari-proof

### Fixed
- **Scroll werkte niet in Safari**: `#faction-select` was tegelijk de flex-container én de scroll-container. Safari heeft bekende issues met flex-item scrolling zonder `min-height: 0`; onze `overflow-y: auto` op de absolute flex-column werd genegeerd. Opgelost via de "klassieke app-layout": een inner `.faction-scroll` wrapper met `flex: 1 1 auto; min-height: 0; overflow-y: auto`. Header (`.faction-header`) en confirm-bar (`.faction-confirm-area`) blijven vast buiten het scrollgebied. Werkt in Safari, Chrome en Firefox.

## [0.37.11] - 2026-04-18 — skirmish scroll + dichter gepakte layout

### Fixed
- **Skirmish menu scrolde niet op Safari Mac** bij smalle viewport-hoogte: `position: fixed` op de Start Gevecht-bar blokkeerde scroll-events op de flex-container. Terug naar `position: sticky; bottom: 0` binnen de scrollbare `#faction-select` container + opaque background + schaduw + `overscroll-behavior: contain`. Alle opties (Spelers, Kaartgrootte, Startgoud, Moeilijkheid, Fog of War) zijn weer bereikbaar door te scrollen.
- **Compacter layout** voor verticaal beperkte schermen: preview-image 180→180→140×180, card-portret 80→64px, padding-bottom rondom header/preview/cards verlaagd. Meer opties tegelijk zichtbaar zonder scrollen.

## [0.37.10] - 2026-04-17 — skirmish menu polish + version-display fix

### Fixed — Bug 10
- **Faction preview image laadde niet** — `FACTIONS` array in MenuScreens.ts gebruikte relatieve paden (`assets/factions/...`) terwijl de game op `/play/` draait. Paden nu absoluut (`/assets/factions/...`).
- **Start Gevecht-knop overlapte de onderste opties** — sticky positioning mengde met inhoud; nu vast positioneerd onderaan viewport met backdrop-blur + extra padding-bottom op scrollable container zodat alle opties vrij bereikbaar zijn.
- **Broken-image "?" placeholder** vervangen door een styled fallback (factie-initiaal in goud) voor als een portret-bestand ontbreekt. Geen browser-native placeholder iconen meer.
- **Versie op game-scherm toonde v0.31.1** terwijl package.json al weken verder was. Vite's `define: { __APP_VERSION__ }` werkte niet betrouwbaar in dev-serve hier; vervangen door directe JSON-import van `package.json`, wat in zowel dev als build altijd de actuele waarde levert.

### Added — nieuwe factie-portretten
- Vier hi-res factie-leader portretten gegenereerd via fal.ai Flux Pro (oil-painting, Rembrandt style, 768x1024, ornate gold frames). Gewired in de skirmish preview: `brabanders-prins-v2.png`, `randstad-ceo-v2.png`, `limburgers-mijnbaas-v2.png`, `belgen-frietkoning-v2.png`.

## [0.37.9] - 2026-04-17 — shader crash gefixt

### Fixed — Critical
- **Terrain fragment shader compileerde niet** in Three.js r183: "`vUv` undeclared identifier". `Terrain.createTerrainMaterial` gebruikte `vUv` in een `onBeforeCompile` injection, maar sinds Three.js r150+ wordt `vUv` alleen auto-gedeclareerd als bepaalde UV-features actief zijn — iets dat we niet kunnen garanderen. Opgelost door onze eigen `vTerrainUv` varying te declareren in vertex + fragment injectie. Shader compileert nu betrouwbaar ongeacht welke materiaal-features actief zijn.
- Dit kan ook Bug 9 (skirmish selectie onduidelijk) verklaren: bij een half-kapotte render-pass is raycasting en selectie-rendering inconsistent.

## [0.37.8] - 2026-04-17 — browser-feedback ronde 1 (284/284 groen)

### Fixed
- **Bug 7 — worker bouwt nu daadwerkelijk af** i.p.v. direct weer harvesten. `CommandSystem.handleBuild` reset nu `Gatherer.state` naar NONE (parallel aan move/attack). Voorheen hield de worker z'n gather-state, GatherSystem sleepte hem terug naar de boom en het gebouw kwam nooit af.
- **Bug 8 — rally-button werkt op alle productiegebouwen** (ook skirmish-pre-placed). `createBuildingEntity` in Game.ts miste de `RallyPoint` component (alleen `Production` werd toegevoegd); de `factories.ts`-pad deed het wel. Opgelost door een shared `spawnBuildingEntity` helper die beide paden garandeert te synchroniseren. Regressie-test (`building-spawn-rally-contract.test.ts`) lockt dat beide paden het contract respecteren.
- **+13 contract-tests** (RallyPoint, building spawn) en **+3 gather-reset tests** (Bug 7). Totaal: 284/284 groen.

### Pending diagnostiek
- **Bug 9 (skirmish: klikken voelt maar selectie onduidelijk/commands werken niet)** — geen reproduceerbare root cause zonder browser-console-logs. Fix volgt na meer diagnostiek.

## [0.37.7] - 2026-04-17 — user's map-brug-bug gefixt (268/268 groen)

### Fixed — P1 Bug 6 (map-gen)
- **Pre-gegenereerde bruggen snappen nu naar river-paths** in `river-valley` en `archipelago` templates. Voorheen werden bruggen geplaatst op aangenomen coördinaten (`z=0` of `centerIslandRadius`), terwijl de werkelijke river-paths per RNG wiggleden — resultaat: bruggen naast in plaats van over de rivier.
- Nieuwe helper `snapBridgeToRiver()` kiest voor elke brug het dichtstbijzijnde river-path-punt en berekent de rotation loodrecht op de river-tangent, zodat bruggen visueel en functioneel kloppen.
- **15 nieuwe tests** (`map-bridge-river-alignment.test.ts`): asserteren dat elke brug ≤ 4 units van z'n dichtstbijzijnde river-path ligt, over meerdere seeds + playercounts, plus een regressieguard dat geen template bruggen zonder rivieren mag shippen.
- Hiermee is de user-gemelde bug "bruggen random verdeeld over het terrein" volledig afgedekt.

## [0.37.6] - 2026-04-17 — P0 SWEEP COMPLEET (253/253 groen)

### Fixed — P0 Fase 3 (UX-transparantie)
- **Bug 3 — LumberCamp placement-feedback toont distance**. `PlacementResult` heeft nu optional `code` + `details` (`nearestWoodEid`, `nearestWoodDistance`, `nearestWoodPosition`, `requiredMaxDistance`). De error-message die de speler ziet is upgraded van *"Houtkamp moet binnen 20 eenheden van bomen staan"* naar *"Houtkamp moet binnen 20 eenheden van bomen staan (dichtste: 34)"* — en een aparte `LUMBERCAMP_NO_WOOD_ON_MAP` code voor kaarten zonder wood.
- **4 RED tests → GREEN** (placement-lumbercamp-structured). **Volledige suite: 253/253 groen.**

### Samenvatting P0 Sweep (v0.37.3 → v0.37.6)
| Bug | Status | Speler-effect |
|-----|--------|---------------|
| 1. Rally-point pickt resource | GREEN | Right-click op boom/mine werkt nu |
| 2. Bridge op rivier | GREEN | `BuildingTypeId.Bridge` + river-rule |
| 3. LumberCamp error met context | GREEN | Speler ziet afstand tot dichtste boom |
| 4. FactionSpecial2 produceert Heavy | GREEN | T3 Heavy units nu trainbaar |
| 5. SiegeWorkshop data-parity | GREEN | Siege-button is geen ghost meer |

### Follow-ups genoteerd
- **Bug 6 (P1)**: Pre-gegenereerde map-bridges in MapGenerator moeten aan river-paths gekoppeld worden (user-gemeld "bruggen random verdeeld").
- **UX quick-win (P1)**: Ghost-placement-preview met groen/rood + nearby-wood highlight (audit 05 #1). De `details.nearestWoodPosition` uit Bug 3-fix levert al de data-hook.

## [0.37.5] - 2026-04-17

### Fixed — P0 Fase 2 (core feel)
- **Bug 1 — Rally-point pickt resource correct** bij right-click. `findEntityAtPosition` gebruikt nu `Position.x/z[eid]` uit de ECS world, niet `mesh.position` (die lagged tijdens frame-interpolatie en deed rally-targets missen).
- **Bug 2 — Bridge-placement respecteert river-tiles**. Nieuw: `BuildingTypeId.Bridge = 11`. `validateBuildingPlacement` accepteert nu optional `terrain.isRiver(x,z)` en blokkeert bridge-placement op alles behalve river-tiles. Andere gebouwen rejecteren rivers als bouwgrond (net als water).
- **6 RED tests → GREEN** (rally-point-resource + placement-river-constraint). Totaal: 250/253 groen. Alleen Bug 3 resteert.

### Notes
- DefenseTower placement ongewijzigd (blijft toegestaan op land) — river-constraint is nu expliciet Bridge-only, niet `DefenseTower-als-placeholder-voor-bridge`.
- **Bug 6 (follow-up, P1)**: pre-gegenereerde map-bridges in `MapGenerator.ts` / `Terrain.ts:838` staan nog los van river-paths. User-gemelde "bruggen random verdeeld" wordt in aparte commit aangepakt.

## [0.37.4] - 2026-04-17

### Fixed — P0 Fase 1 (data-unlock)
- **Bug 4 — FactionSpecial2 produceert nu Heavy units** per factie (was Infantry/Ranged = duplicaat van Barracks). Entries Feestzaal / Parkeergarage / Mijnwerkerskamp / Rijschool kregen ook de correcte `typeId: FactionSpecial2` (was ten onrechte `Barracks`). Rijschool buildTime bijgetuned naar 42s om T3 pricing-gate te halen.
- **Bug 5 — SiegeWorkshop data-entries toegevoegd** voor alle 4 facties (Tractorschuur / Sloopwerf / Steengroeve / Frituurkanon-werkplaats). Produceren Siege units, T3 prijs, HUD-labels in sync met data.name. Ghost-button werkt nu als echt gebouw.
- **37 RED tests → GREEN** in `faction-special2-produces.test.ts` + `siege-workshop-data-parity.test.ts`. Totaal: 245/253 groen.

### Impact
- T3-progressie eindelijk speelbaar: spelers kunnen nu Heavy + Siege units trainen.
- HUD-buttons voor SiegeWorkshop zijn geen ghost meer.

## [0.37.3] - 2026-04-17

### Added
- **Audit suite** (`audits/01-08.md`): parallelle gameplay-audit (6 diepgaande rapporten + test-inventaris + red-test recepten) op basis van 3 beta-bugs. Resultaat: 5 geprioriteerde P0 bugs (rally-target-pick, bridge/river, lumbercamp-UX, FactionSpecial2-produces, SiegeWorkshop-ghost).
- **5 nieuwe RED test-bestanden** (45 falende tests, 38 expects): `rally-point-resource`, `placement-river-constraint`, `placement-lumbercamp-structured`, `faction-special2-produces`, `siege-workshop-data-parity`. Lock de post-fix contracten voor iteratie 2.

### Changed
- **`findEntityAtPosition` geextraheerd** uit `Game.ts` naar `src/core/entityPicking.ts` zodat entity-picking unit-testbaar is zonder volledige Game-instance. Geen gedragswijziging in deze commit — logica-fix (Position-component i.p.v. mesh.position) komt in iter-2 green.

### Notes
- 208 bestaande test-cases blijven groen. Typecheck schoon.
- Test-telling eerder genoteerd als "618 tests" in memory was fout: werkelijk 206 `it()` blocks / 253 vitest test-cases / 277 expects (pre-iter-1). Memory gecorrigeerd.

## [0.37.2] - 2026-04-16

### Fixed
- **Tier lock UI**: Tier 2 (housing, tower) en tier 3 (feestzaal, siege workshop) buildings nu visueel gegreyed out met lock icoon als prerequisites niet voldaan. Tooltip toont "Vereist: Smederij" / "Vereist: Geavanceerde Smederij"
- **Building renderer mappings**: FactionSpecial2, SiegeWorkshop, TertiaryResource, UpgradeBuilding, FactionSpecial1 renderen nu correct (fallback modellen totdat Meshy modellen klaar zijn)
- **Meshy 3D modellen**: Feestzaal, Tractorschuur, Parkeergarage, Sloopwerf, Mijnwerkerskamp, Steengroeve, Rijschool, Frituurkanon-werkplaats + verbeterd Randstad Manager model gegenereerd

## [0.37.1] - 2026-04-15

### Fixed
- **Worker build menu**: Uitgebreid van 3 naar 7-8 buildings per factie — housing, feestzaal/parkeergarage (heavy units), siege workshop, defense tower nu beschikbaar
- **Building portraits**: Elk building type heeft nu een uniek canvas-drawn icoon i.p.v. generiek 'BLD' label
- **Kosten zichtbaar**: Inline kosten op worker build buttons en building train buttons (bijv. "200g+150h")
- **Heavy/Siege/Support productie**: Units waren niet trainbaar — train-heavy/train-siege/train-support commando's toegevoegd, Barracks produceert nu Support, FactionSpecial2 produceert Heavy, SiegeWorkshop produceert Siege
- **Tooltip systeem**: Alle building types en unit types worden nu herkend met volledige stats + kosten
- **Blacksmith panel UI**: Verbeterde layout, hover effecten, goud kostprijs badges, progress bar styling
- **Menu responsive scaling**: Sticky "Start Gevecht" button, breakpoints voor tablets/kleine schermen, faction select scrollbaar
- **Hotkey systeem**: Dynamische building card hotkeys, geen WASD camera conflict, build hotkeys Q/E/R/T/F/G/Z/X
- **BuildingPortraits**: DefenseTower en SiegeWorkshop portraits toegevoegd

## [0.37.0] - 2026-04-15

### Fixed
- **[S1] destroy-building global counter** — Objectives now filter by targetFactionId + targetBuildingType. 7 missies (incl. 4 finales) waren instant winbaar door 1 building te vernietigen — gefixed
- **[S2] Military count** — Heavy, Support en Siege units tellen nu mee voor train-units objectives en army-count triggers
- **[S3] Wave defeat tracking** — Waves worden nu per-entity getrackt i.p.v. globale AI count. Missies met pre-placed enemies + waves werken nu correct
- **[S4] AI state leak** — AISystem.reset() toegevoegd aan cleanup, voorkomt stale AI behavior na game switch
- **[S5] Terrain dynamic mapSize** — Terrain accepteert nu dynamische map grootte (80-192), niet meer hardcoded 128x128
- **[S7] Inverted bonus logic** — Mission 11 "low losses" bonus gebruikt nu comparator '<' (train minder dan 20 = succes)
- **[H1] Victory messages** — 6 missies (incl. 4 campaign finales) hebben nu narratieve victory messages i.p.v. stille auto-victory
- **[H2] Premature victory triggers** — M9 en M10 victory triggers geconverteerd naar message-only, auto-victory handelt de echte win af
- **[H3] build-building defaults** — B2 (TertiaryResourceBuilding), B3 (FactionSpecial1), R4 (Barracks) hebben nu correcte targetBuildingType
- **[H4] R1 train-workers** — Objective description gecorrigeerd naar "militaire eenheden"
- **[H5] Defeat priority** — Trigger-based victory checkt nu TownHall status voordat victory fires. Post-victory triggers worden onderdrukt
- **[H6] Fallback river collision** — NavMesh fallback movement checkt nu isRiver() met slide-along-edge physics
- **[H7] M10 saboteurs** — Verplaatst naar wave 2 units array zodat ze correct getrackt worden
- **[H8] M7 survive-raids** — Nu required objective (was bonus), voorkomt instant-win via gold gathering
- **[H9] Bridge carving** — Oriented rectangle check i.p.v. circulaire check, respecteert bridge length + rotation
- **[H10] Resource river validation** — Gold mines en trees worden nu gevalideerd tegen river paths, met nudge-away fallback
- **Grace period** — Defeat grace period 10s→3s, voorkomt soft-lock in commando missies
- **Test updates** — Mock callbacks uitgebreid, grace period tests aangepast

## [0.36.0] - 2026-04-15

### Changed
- **Siege unit balance** — Praalwagen attack 60→15, siegeBonus 4→8 (building DPS 30, was 60; anti-unit DPS 3.75, was 15). Manneken Pis-kanon attack 55→12, siegeBonus 4→6 (building DPS 24, was 73; anti-unit DPS 4, was 18). Siege units zijn nu dedicated building destroyers, niet ook anti-unit monsters
- **Kamerdebat nerf** — De Politicus E ability: radius 20→14, duur 12s→8s. Was een instant-win button in mid-game fights
- **Verkiezingsbelofte nerf** — De Politicus Q ability: cooldown 30s→50s. Uptime van 50% naar 30%, vergelijkbaar met andere buff abilities
- **Gezelligheid 20+ tier nerf** — Max bonus 50%→40% attack/speed/armor, damage reduction 20%→15%. Deathball-strategie nog steeds sterk maar niet meer dominantnit

### Fixed
- **archetypes.ts data sync** — Brabanders Infantry (attack 9→10, attackSpeed 1.3→1.2), Ranged (attack 14→12), Heavy (attack 20→22, armor 3→4) gesynchroniseerd met canonieke factionData.ts waarden
- **Vastgoedmakelaar comment** — "5x siegeBonus" comment gecorrigeerd naar "4x siegeBonus" (code was al correct)

## [0.35.1] - 2026-04-15

### Fixed
- **Tutorial goud-thresholds** — Stap 5 vroeg om 50 goud voor een kazerne die 200 kost; nu wacht stap 5 op 200 goud. Einddoel verhoogd van 200 naar 500 zodat de missie niet eindigt voordat je door alle tutorial-stappen heen bent

## [0.35.0] - 2026-04-14

### Added
- **Building destruction animation** — Gebouwen kantelen, zakken weg en vervagen over 1.8s bij vernietiging, met debris + vuurparticles en camera shake
- **Hero ability visual effects** — Alle 24 hero abilities (8 heroes x Q/W/E) hebben nu visuele particle effects: AoE rings, cone sprays, line trails, teleport flashes, heal aura's
- **Heal visual feedback** — Support unit heal ticks tonen groene opwaartse particles op het doelwit
- **Buff/debuff/invincible indicators** — Units gloeien goudkleurig bij buff, grijs bij stun, helder goud bij invincibility (zowel instanced als animated units)
- **Stun stars** — Draaiende gele ster-particles boven gestunde units
- **New particle types** — `spawnBuildingDestruction()`, `spawnHealEffect()`, `spawnBuffAura()`, `spawnStunStars()`, `spawnConeEffect()`, `spawnLineTrail()`, `spawnTeleportFlash()` toegevoegd aan ParticleSystem
- **AbilityEffects module** — Nieuwe `src/rendering/AbilityEffects.ts` koppelt `hero-ability-used` en `unit-healed` events aan visuele effecten
- **Siege projectile type** — ProjectileRenderer ondersteunt nu `'siege'` type: 2.5x groter, hogere arc, voorbereiding voor siege unit rendering

### Changed
- **BuildingRenderer** — Destruction animation systeem: `startDestruction()`, `updateDestructions()`, `isDestroying()` methoden
- **UnitRenderer** — Instance color priority: damage flash > selected > invincible > stunned > buffed > default
- **Game.ts** — Dead entity cleanup nu met destruction animation integratie, dt parameter doorgegeven

## [0.34.0] - 2026-04-14

### Added
- **3-tier tech tree** — Building prerequisites: T1 (TownHall/Barracks/LumberCamp) altijd beschikbaar, T2 (Housing/Tower/Tertiary/FactionSpecial1) vereist Blacksmith, T3 (FactionSpecial2/SiegeWorkshop) vereist UpgradeBuilding
- **PopulationSystem** — Housing geeft +10 pop cap, dynamische cap-reductie bij vernietiging van gebouwen
- **TowerSystem** — Defense Towers vallen automatisch vijanden aan binnen bereik (14 units, 15 dmg, 1.5s cooldown)
- **Placement validatie** — Collision check (4x4 footprint), water check, minimum afstand vijandelijke gebouwen (8 units), LumberCamp bomenproximiteit (20 units)
- **7 nieuwe gebouwtypes** — Housing, TertiaryResourceBuilding, UpgradeBuilding, FactionSpecial1/2, DefenseTower, SiegeWorkshop met volledige archetypes
- **Build menu uitgebreid** — Alle 11 gebouwtypes bouwbaar via HUD commando's met factie-specifieke labels

### Changed
- **BuildingTypeId enum** — Uitgebreid met DefenseTower (9) en SiegeWorkshop (10)
- **Population cap** — TownHall geeft 10, Housing geeft 10, overige gebouwen 5 (via archetype `populationProvided`)
- **PlayerState** — Nieuwe `removePopulationCapacity()` methode voor dynamische cap bij gebouwvernietiging

## [0.33.0] - 2026-04-14

### Added
- **12-step tutorial system** — Volledig herschreven tutorial met scenario-gedreven leerpad: camera → selectie → box-select → verzamelen → bouwen → trainen → gevecht → verdediging → overwinning
- **Input lock per stap** — Blokkeert irrelevante acties zodat spelers niet vooruit kunnen skippen; progressief ontgrendeld per tutorial stap
- **Pause overlay** — Informatieve stappen (5, 7, 9) pauzeren het spel met "Doorgaan" knop
- **Tutorial highlights** — Pulserende gouden ring + pijl-indicator wijzen naar tutorial targets (workers, goudmijn, kazerne, vijanden)
- **Hotkey tooltips** — Automatische sneltoets-hints bij B (bouwen), W (trainen), A (attack-move) met auto-hide na 10s
- **Progress dots** — 12 voortgangspunten onder het tutorial paneel (voltooid/huidig/toekomstig)
- **Tutorial enemy spawning** — Vijanden verschijnen alleen bij stap 10 (3 vijanden) en 11 (5 vijanden), niet meer op timer
- **Meshy concept art plan** — Voorbereidingsdocument voor 26 nieuwe 3D modellen (Sprint 2-6) met fal.ai prompts

### Changed
- **Tutorial missie "De Eerste Oogst"** — Hernoemt van "De Oogst", goud-doel 500→200, wolf-spawn verwijderd, ruimere star thresholds (600s/900s), bonus objective "Bouw een Kazerne"
- **Skip button** — Pas zichtbaar vanaf stap 8 (was altijd zichtbaar)

### Technical
- **6 nieuwe Game.ts query methods** — `hasMultipleUnitsSelected()`, `hasBarracksPlaced()`, `hasUnitTrainingStarted()`, `getAIUnitCount()`, `spawnTutorialEnemies()` voor tutorial state tracking
- **TutorialState interface** — Uitgebreid van 6 naar 11 velden voor 12-step tracking
- **AllowedAction type** — Nieuw type-systeem voor per-stap input filtering

## [0.32.0] - 2026-04-14

### Improved
- **Fog density reduced** — Exponential fog density 0.012 → 0.003, veel minder waas zodat het slagveld helder zichtbaar is
- **Action panel icons** — 6 fal.ai geschilderde WarCraft-stijl command icons (worker, infantry, ranged, hero, rally, upgrade) vervangen SVG iconen
- **Action hotkey badges** — Hotkeys (Q/W/E/R/T/Y) nu als duidelijke badges met achtergrond over de action buttons
- **Objectives panel redesign** — Gradient achtergrond, gold top-border, header separator met text-shadow, progress bars voor multi-value objectives
- **Version/FPS overlay** — Verplaatst van rechts-boven (overlap met SND/pause) naar rechts-onder, subtielere styling

### Added
- **Bridge GLB model** — Meshy v6 3D model van stenen boogbrug vervangt procedurele BoxGeometry
- **Tunnel entrance GLB model** — Meshy v6 3D mijnschacht-ingang vervangt complexe procedurele geometry (torus + stenen + lantaarns)
- **GLB fallback system** — Terrain laadt GLB modellen met automatische fallback naar procedurele geometry als bestanden niet beschikbaar zijn

## [0.31.1] - 2026-04-14

### Improved
- **"Het Ontstaan" cinematic v2** -- Volledig opnieuw geproduceerd met LoRA face model (geen face-swap meer), hybride Seedance/Kling pipeline, nieuwe keyframes

## [0.31.0] - 2026-04-13

### Improved
- **Command button icons** — 12 tekst-afkortingen (MOV/ATK/STP/etc.) vervangen door SVG icons: zwaarden, schild, boog, kroon, vlag, aambeeld
- **Building portraits** — 9 canvas-drawn gebouw-portretten (Town Hall, Barracks, Blacksmith, LumberCamp, Housing, Mine, Tower, Temples) i.p.v. tekst-afkortingen
- **Resource bar icons** — CSS gradient shapes vervangen door inline SVG: gouden munt, houtblok, persoon silhouet, bierpul, factie-specifieke tertiaire resources (kolen/chocolade/havermoutmelk)

### Fixed
- **Design-bible emoji fallbacks** — 4 gebroken image paden geremapt naar bestaande bestanden, 11 onerror emoji SVG handlers verwijderd, CSS gradient fallback toegevoegd

## [0.30.0] - 2026-04-13

### Fixed
- **Goudmijn zinkt in terrein** -- v02 goldmine model kreeg nu correcte scale (2.8) en Y-offset (2.5), consistent met andere buildings

### Added
- **Tunnels tutorial** -- Limburger Mission 1 leert spelers tunnel mechanics: pre-placed Mijnschacht, objective voor tweede endpoint, 4 tutorial triggers met uitleg over transit, surprise bonus en onderhoud
- **`building-count` trigger type** -- Nieuw mission objective type dat checkt op aantal gebouwen van een specifiek type

### Improved
- **Terrein rendering upgrade** -- Procedurele normal map (1024x1024) met 3 octaves simplex noise, roughness map met terrain-aware zones, custom shader met 4-octave FBM noise, 8 height zones (was 5), slope-based AO, valley darkening
- **Water rendering** -- Meer transparantie, scherpere reflecties, hogere envMapIntensity

## [0.29.0] - 2026-04-13

### Added
- **"Het Ontstaan" AI cinematic** -- 30 seconden origin story cinematic, volledig AI-gegenereerd
- **Cinematic pipeline** -- Flux Pro keyframes, face-swap (fal.ai), Kling v3 + Seedance 2.0 video, MMAudio V2 SFX
- **Voice-over** -- Brabantse narration door Richard
- **Epische audio** -- "Storm Over Low Fields" score, 12 SFX (oorlogshoorn, strijdkreet, troepen, kerkklok, bass drop)
- **Steun pagina** -- cinematics sectie geüpgraded met volledige cinematic + productie-details
- **Updates pagina** -- v0.29.0 entry met embedded video player

## [0.28.2] - 2026-04-12

### Added
- **Feedback knop in hoofdmenu** -- "Feedback geven" knop onder de navigatie, zichtbaar voor alle spelers bij het opstarten
- **Updates pagina v0.25-v0.28** -- 4 nieuwe entries met interactief goldmine 3D model, schermutsel hero portraits, feedback systeem beschrijving

### Removed
- **HUD feedback knop** -- was te druk rechtsboven naast FPS/SND/Opgeven, feedback nu via hoofdmenu + pauzemenu
- **Opgeven knop uit HUD** -- was redundant, surrender zit al in het pauzemenu (ESC)

## [0.28.0] - 2026-04-12

### Added
- **In-game feedback systeem** -- "Feedback geven" knop in pauzemenu met 3-staps modal (categorie → formulier → bevestiging)
- **4 feedback categorieën** -- Bug/Issue, Balans, Idee/Feature, Compliment -- elk met eigen placeholder tekst
- **Auto-capture** -- Game state (versie, factie, difficulty, speeltijd, unit stats) + canvas screenshot automatisch meegestuurd
- **Server-side feedback API** -- Node.js endpoint op M4 (port 3007) die GitHub Issues aanmaakt met speler-rapporten
- **FeedbackReporter.ts** -- Client-side TypeScript module met screenshot capture, game state serialisatie, POST naar /api/feedback
- **Game.getElapsedTime()** -- Publieke getter voor speeltijd
- **Game.getStats()** -- Publieke getter voor game statistieken (feedback reporting)
- **Docker setup** -- Dockerfile + docker-compose.yml voor rob-feedback-api container

## [0.27.0] - 2026-04-12

### Added
- **Schermutsel UI overhaul** -- Faction cards met hero portraits (was letters B/R/L/V), map selector met 6 visuele kaarten en beschrijvingen, difficulty selector (Makkelijk/Normaal/Moeilijk)
- **AI difficulty systeem** -- Easy: +50% attack threshold, +60% force attack time. Hard: -30% attack threshold, -40% force attack time, extra worker
- **Fort map template** -- Centraal fort met 8 rotswand-segmenten, 4 poorten, 2 tunnels, approach roads. Arid biome
- **Rivierdal map template** -- Brede rivier met 5 bruggen, north/south spawns, rock walls bij bruggen. Aquatic biome
- **Map selector visuele kaarten** -- 6 kaarten (Klassiek, Kruispunt, Eilanden, Arena, Fort, Rivierdal) met beschrijvingen

### Fixed
- **Broken faction images** -- Limburgers (mijnwerker→mijnbaas) en Belgen (diplomaat→frietkoning) image references gecorrigeerd
- **Schermutsel modus** -- Faction select scherm was onzichtbaar door CSS display conflict

## [0.26.2] - 2026-04-12

### Fixed
- **Tutorial hotkeys** -- B voor barracks (was fout: Q), W voor infantry
- **Tutorial stap-skipping** -- Gathering check gebruikt nu `gold >= 20` i.p.v. `gatheringStarted` (auto-gather skipte stappen)
- **Tutorial timing** -- Start 4s na camera intro, state reset vlak voor start
- **Tutorial arrow** -- Broken arrow element verwijderd (had geen positioneringslogica)
- **Tutorial volgorde** -- 8 heldere stappen (was 10 met verwarrende volgorde)
- **Unit spawn sound** -- Generiek `unit_trained.mp3` vervangen door faction-specifieke voice lines via `playUnitVoice('ready')`

## [0.26.0] - 2026-04-12

### Added
- **Goldmine model upgrade** -- Nieuw Meshy v6 text-to-3D model (4.6MB) vervangt oud V02 model (3.6MB). Stenen boog met goudaders, houten balken en mijnkarretje.
- **Tutorial in eerste missie** -- "De Oogst" is nu een volledige 10-staps guided tutorial: camera, minimap, selectie, grondstoffen, bouwen, trainen, gevecht, hotkeys
- **Campaign missie scroll** -- Mission list is nu scrollbaar (flex overflow fix). Alle 12 Brabanders missies bereikbaar.

### Changed
- **"Hoe Te Spelen" knop verwijderd** -- Aparte tutorial knop uit hoofdmenu gehaald. Tutorial is nu geïntegreerd in de eerste campaign missie.
- **Missie 1 briefing** -- Titel "Tutorial: De Oogst", briefing tekst vermeldt nu expliciet dat dit een tutorial is

### Fixed
- **Campaign scroll bug** -- #campaign-mission-list container had geen height constraint, latere missies waren onbereikbaar

## [0.25.0] - 2026-04-12

### Added
- **/updates/ visuele changelog pagina** -- Timeline met versie-cards, 3D model viewers (model-viewer web component), hero portraits, cinematic images, tags per entry
- **Interactieve 3D model showcase** -- Heavy units (Tractorrijder, CorporateAdvocaat, Mergelridder, Frituurridder) en hero models direct draaibaar en zoombaar in de browser
- **Updates link in navigatie** -- Toegevoegd aan root, steun, het-verhaal en roadmap pagina's
- **/updates/ in sitemap.xml** -- Weekly changefreq, priority 0.7

### Changed
- **Kosten-tekst verwijderd** -- Alle "honderden euro's per maand" en kostenverantwoording verwijderd uit steun en het-verhaal pagina's. Toon is nu "we bouwen de vetste game" i.p.v. "kijk wat het kost"
- **"Eerlijk over kosten" card** -- Vervangen door "100% Solo Dev" card op het-verhaal pagina
- **FAQ "Waar gaat het geld naartoe?"** -- Herschreven: focus op meer modellen/stemmen/features i.p.v. opsomming tool-kosten
- **Steun disclaimer** -- "passieproject met serieuze lopende kosten" → "de vetste browser-RTS die ooit gebouwd is"

## [0.24.0] - 2026-04-11

### Added
- **Heavy unit 3D modellen** -- 4 unieke Meshy v6 GLBs (image-to-3D, rigged):
  - Tractorrijder (Brabanders, 11MB) -- gepantserde boer op tractor
  - CorporateAdvocaat (Randstad, 6.8MB) -- advocaat in pak met stalen pantserplaten
  - Mergelridder (Limburgers, 8.1MB) -- ridder in mergelsteen-armor
  - Frituurridder (Belgen, 9.1MB) -- ridder met frituur-thema armor

### Changed
- **UnitRenderer model mappings** -- heavy_0-3 wijzen nu naar dedicated heavy.glb per factie (alle quality tiers)

## [0.23.0] - 2026-04-11

### Added
- **HUD mode indicators** -- Persistent top-center bar toont actieve modus (Bouw/Rally Point/Attack-Move) met ESC-hint
- **Tooltip system** -- Hover tooltips op bouw- en trainingsknoppen met archetype stats (HP, Attack, DPS, Armor, kosten)
- **Mission surrender** -- "Opgeven" knop tijdens campaign missies met bevestigingsdialoog, voorkomt softlocks
- **Heavy base archetype** -- UNIT_ARCHETYPES en RANDSTAD_UNIT_ARCHETYPES uitgebreid met Heavy (Tractorrijder/CorporateAdvocaat)
- **Discord + Reddit share buttons** -- Toegevoegd aan steun pagina share sectie
- **Mollie badge** -- "Betaling via Mollie -- veilig en vertrouwd" onder payment methods

### Fixed
- **Hero revive indexOf bug** -- Fragiele `=== 1` check vervangen door `hero${index}` template literal (Game.ts:1035+2322)
- **AudioManager duckTimer leak** -- `clearTimeout(duckTimer)` toegevoegd aan `dispose()`
- **Stale public/index.html** -- Overschreef Vite-processed landing page bij builds, hernoemd naar .bak
- **Steun FAQ GitHub link** -- "GitHub" en "roadmap" nu echte hyperlinks i.p.v. plain text
- **URL trailing slashes** -- 11 inconsistente links (/doneer, /roadmap, /press) gefixt in 5 bestanden
- **Community Discord placeholder** -- Professionelere "binnenkort" tekst met roadmap link

### Changed
- **Donation flow vereenvoudigd** -- 2-stap checkout (Afrekenen → methode) → 1-stap (methodes direct zichtbaar)
- **Perk tiers verduidelijkt** -- Subtitle "elke tier bevat alles van de vorige" + "+ alles van vorige tiers" per card
- **Mobile donation buttons** -- 3-kolom grid layout op mobile i.p.v. wrapping row
- **Infantry/Ranged DPS rebalance** -- Infantry 10atk/1.2s→9/1.3s, Ranged 12atk→14atk, Consultant 3atk→5atk
- **OG images opgeschoond** -- 9 ongebruikte PNG backups verwijderd (~9MB bespaard)

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
