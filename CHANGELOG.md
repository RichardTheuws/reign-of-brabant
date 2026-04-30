# Changelog

## [0.54.0] - 2026-04-30 — Support-portrait coverage voor alle 4 facties

### Added — 3 nieuwe Support unit-portraits
v0.53.1 wired faction-painted portraits in voor de building-card train-buttons. Edge case: alleen Brabant had een Support-portrait (`brabant-support.png` voor Boerinneke). Randstad/Limburg/Belgen Support-units (HR-Medewerker / Sjpion / Wafelzuster) vielen daardoor terug op het generieke `UNIT_S` command-icon. Deze bundle vult de gap.

| File | Karakter | Spec | Size |
|---|---|---|---|
| `randstad-support.png` | HR-Medewerker | Late-30s androgynous corporate coach, slate-blue suit, klembord/tablet, sympathetic coaching smile, lapel badge. Triple guard: NOT barista, NOT manager, NOT intern. | 257 KB |
| `limburg-support.png` | Sjpion | Late-20s androgynous mining-scout, hooded brown leather cape met deep face-shadow, brass mining oil-lamp, leather satchel met mergel-stone arrow-tips. Austrian-mining-folkloric. | 293 KB |
| `belgen-support.png` | Wafelzuster | Mid-40s matriarchal waffle-sister healer, cream sister-headcap (NIET strict nun), white linen apron, woven basket met golden waffles, brass oil-lamp. | 287 KB |

Pipeline: 3 × Flux Dev `square_hd` → PIL LANCZOS 512×512 → PNG (parallel, 30s wallclock). Painted gold-frame en vignette IN het beeld matching `brabant-support.png` anchor (geen BiRefNet). Cost: ~$0.09. Geen backups (paths bestonden niet).

### Updated — `portraitMap.ts` Support-mapping uitgebreid
`UNIT_PORTRAITS[FactionId.{Randstad,Limburgers,Belgen}]` heeft nu een `[UnitTypeId.Support]` entry met de juiste filename slug. Brabant ongewijzigd (had `brabant-support` al).

### Tests (+3, geen regressions)
`tests/portrait-asset-coverage.test.ts` `factionUnitTypes` uitgebreid: alle 4 facties testen nu Worker + Infantry + Ranged + Support (was 13 unit-tests, wordt 16). De 3 nieuwe Support-mappings krijgen automatisch een coverage-test (`getUnitPortraitUrl` returns URL én PNG bestaat).

`tests/HUD-bcard-action-portraits.test.ts` "Limburg Schuttershal" scenario: de oude "no Support fallback" test is vervangen door een positieve assertion dat `train-support` nu de `limburg-support.png` portrait krijgt (Sjpion in Schuttershal).

Suite: 1736 → 1739.

### Why MINOR (0.54.0 ipv 0.53.2)
Coverage-uitbreiding via nieuwe assets + portraitMap.ts code-wijziging = bundle conform `versioning.md`. Niet pure bug-fix want we voegen nieuwe asset-mappings toe en breiden het API-contract van `getUnitPortraitUrl` uit (3 nieuwe valid factie+unitType combinaties die voorheen `null` returnden).

### Reproducibility
- Script: `scripts/regen_support_portraits_v0531.py`
- Manifest: `scripts/support_portraits_v0531.json`
- Memory: `.claude/agents/memory/asset-generator.md` (sectie "v0.53.1 Support-portrait trio")

---

## [0.53.1] - 2026-04-30 — Building-card train-buttons gebruiken factie-painted portraits

### Fixed — train-unit + train-hero buttons toonden generieke command-icons
Richard's screenshot 2026-04-30 (Limburg Schuttershal): de "Schutterij/Vlaaienwerper/Sjpion" train-buttons toonden generieke `UNIT_I/UNIT_R/UNIT_S` command-icons (zwaard/boog/elixer) i.p.v. de painted-vignette `limburg-infantry/ranged.png` portraits. De "De Mijnbaas" en "De Maasridder" hero-buttons toonden allebéí dezelfde gem-crown (uit `cmd-hero.png`) — geen onderscheid tussen de 2 heroes.

Root cause: `showBuildingCard()` in `HUD.ts` rendert action-buttons via `COMMAND_ICON_IMAGES[act.icon]` (statische command-icon map). Build-buttons in worker panel gebruikten al `getBuildingPortraitUrl(factionId, buildingTypeId)` (sinds v0.47.0), maar dat code-pad was nooit doorgetrokken naar de building-card train-actions. Hero-icons waren bovendien `H1/H2 → cmd-hero.png` voor BEIDE heroes — geen factie- of hero-specifieke lookup.

### Added — `getActionPortraitUrl(act)` helper
Nieuwe private methode in HUD die voor een `BuildingCardAction` de juiste factie-painted portrait URL teruggeeft:
- `train-worker / -infantry / -ranged / -heavy / -siege / -support` → `getUnitPortraitUrl(currentFactionId, unitTypeId)`
- `train-hero-N` → `getHeroTypesForFaction(currentFactionId)[N]` → `getHeroPortraitUrl(heroTypeId)`
- `rally-point`, `isInfo`, onbekende actions → `null` (caller fallback naar `COMMAND_ICON_IMAGES[act.icon]`)

In `showBuildingCard()` line 941: `paintedUrl ?? fallbackSrc` (zelfde patroon als build-buttons). DOM-level `img.onerror` swap naar `COMMAND_ICON_IMAGES[act.icon]` als painted PNG 404't — voorkomt broken-image als een factie ooit een unit-type heeft zonder portrait (bijv. Limburg Support: geen `limburg-support.png` → de generic UNIT_S icon).

### Imports
`getUnitPortraitUrl` + `getHeroPortraitUrl` toegevoegd aan portraitMap import. `getHeroTypesForFaction` uit `entities/heroArchetypes` voor hero-idx → HeroTypeId resolutie.

### Tests (+8, geen regressions)
`tests/HUD-bcard-action-portraits.test.ts` (8 tests):
- **Limburg Schuttershal screenshot scenario** (4 tests): train-infantry → `limburg-infantry.png`, train-ranged → `limburg-ranged.png`, train-support → niet de verkeerde factie, train-hero-0/1 → `limburg-mijnbaas.png` resp. `limburg-maasmeester.png` (geen duplicate gem-crown meer).
- **Faction-aware swap** (2 tests): zelfde `train-infantry` action toont andere portrait per factie (brabant→randstad→belgen). Idem voor `train-hero-0` (brabant-prins → randstad-ceo → belgen-frietkoning).
- **Non-train fallback** (1 test): `rally-point` (`isRally: true`) gebruikt nooit een unit/hero-portrait — blijft generic command-icon.
- **train-hero-1 distinctness** (1 test): mijnbaas + maasmeester images zijn nu verschillend (regression-lock voor de duplicate-crown bug).

Suite: 1728 → 1736.

### Why patch (0.53.1 ipv 0.54.0)
Pure bug-fix conform `versioning.md` — geen nieuwe features, alleen het bestaande factie-painted portrait code-pad doortrekken naar de building-card train-actions die er per ongeluk niet aan gehangen waren. Assets bestonden al sinds v0.53.0 / heroes v0.46.0.

---

## [0.53.0] - 2026-04-30 — Painted-vignette portrait pass (43 portraits regen)

### Why
Richard's bug-rapport: "al onze karakters en gebouwen hebben eigen HUD afbeeldingen nodig die passen bij de karakters". Coverage was al compleet (alle factie-mappings hadden een PNG), maar de stijl was inconsistent: Limburg/Belgen building-portraits stonden op painted-vignette quality (1.0-1.7 MB), Brabant/Randstad buildings op 243-436 KB (oude generator-pas). Unit-portraits idem: meeste op 62-107 KB old-style, alleen `randstad-infantry` (Manager v0.52.0) en `brabant-support` op painted-vignette quality (272-326 KB). Resultaat: HUD-cards zagen er per factie wisselend uit.

### Asset regen — 24 building portraits (Brabant + Randstad)
Twee parallelle Asset Generator agents via fal.ai Flux Dev `square_hd` (28 steps, ThreadPoolExecutor 8 workers). Elk overschreven origineel als `<file>.bak.png` (idempotent — bestaande backups onaangeroerd). Style anchor: `limburg-barracks.png` + `belgen-barracks.png` als reference.

**Brabant 12** (1.1-1.6 MB): townhall, barracks, lumbercamp, blacksmith, housing, tertiary, upgrade, faction-special-1, faction-special-2, defense-tower, siege-workshop, bridge — ruraal-folkloric warm-orange carnival-flavour, red-brick + thatched roofs, festive pennants, gold filigree corner-frame.

**Randstad 12** (905 KB-1.6 MB): townhall, barracks, lumbercamp, blacksmith, housing, tertiary, upgrade, faction-special-1, faction-special-2, defense-tower, siege-workshop, bridge — corporate slate-blue glass-and-steel, geometric facades, warm yellow window-glow, anti-folkloric. `randstad-tertiary` (havermoutmelkbar) kreeg expliciete `NO espresso machine, NO barista` guard om Flux van koffie-default af te houden. `randstad-faction-special-2` (parkeergarage) als interior-shot voor card-frame fit.

Cost: 24 × Flux Dev = ~$0.72.

### Asset regen — 19 unit + hero portraits
Style anchor: `randstad-infantry.png` (Manager re-vamp v0.52.0) + `brabant-support.png` als references. Pipeline: Flux Dev → PIL LANCZOS 512×512 → PNG (geen BiRefNet — gold-frame en vignette zijn IN het beeld, niet transparent overlay; memory regel "vignette + gold frame IS het design" wint).

**10 generic units** (224-367 KB): brabant-worker/infantry/ranged, randstad-worker/ranged, limburg-worker/infantry/ranged, belgen-worker/infantry/ranged. Stagiair = nervous corporate intern (anti-barista guard). Brabant-units = authentiek-rural (anti-jester guard). Vlaaienwerper = bakker met deeg-spatel + manden.

**8 heroes** (240-362 KB): brabant-prins/boer, randstad-ceo/politicus, limburg-mijnbaas/maasmeester, belgen-frietkoning/abdijbrouwer. Trappist Abdijbrouwer = monk-brewer (first-try). Frietkoning kreeg traditional gem-crown + paper-cone frites-sceptre. Brabant-prins = carnaval-prins met hermelijn-mantel + steek-hoed.

Cost: 19 × Flux Dev = ~$0.57.

### Niet aangeraakt (anchors + buiten scope)
- `randstad-infantry.png` (272 KB) en `brabant-support.png` (326 KB) — gebruikt als style anchors, niet vervangen.
- `limburg-faction-special-1.png` (355 KB) en `belgen-faction-special-1.png` (279 KB) — pre-painted-vignette artifacts uit een eerdere batch. Niet in deze bundle, maar gemarkeerd in `portrait-asset-coverage.test.ts` quality-lock. Toekomstige bundle kan deze 2 ook regen.

### Tests (+71, geen regressions)
`tests/portrait-asset-coverage.test.ts` (71 tests):
- **48 building coverage tests** — voor elke (factie × 12 building-types) combinatie: `getBuildingPortraitUrl()` returned URL én PNG bestaat op disk.
- **13 unit coverage tests** — voor elke (factie × valid unit-type): `getUnitPortraitUrl()` returned URL én PNG bestaat. Brabant heeft 4 types (incl. Support), andere 3.
- **8 hero coverage tests** — voor elke gemapped HeroTypeId: `getHeroPortraitUrl()` returned URL én PNG bestaat.
- **2 quality-lock tests** — alle building portraits ≥ 250 KB en alle unit/hero portraits ≥ 200 KB. Voorkomt dat iemand per ongeluk een tiny placeholder terugzet. Drempels: 250 KB (building) en 200 KB (unit/hero) — toleert de 2 pre-painted-vignette outliers. Tighten naar 800 KB zodra die twee geregen zijn.

Test-suite: 1657 → 1728. `npm test` 4.5s, alle 1728 groen.

### Reproducibility
- Building script: `scripts/regen_building_portraits_v048.py` + manifest `_brabant-randstad-v048-batch.json`
- Unit script: `scripts/regen_unit_portraits_v053.py` + manifest `unit_portraits_v053.json`
- Prompt-templates en faction-palettes geüpdatet in `.claude/agents/memory/asset-generator.md`

### Why MINOR (0.53.0 ipv 0.52.4)
Asset bundle conform `versioning.md` — features/bundles = MINOR-bump, ook bij visuele upgrades zonder code-wijziging in de game-loop. 43 nieuwe portraits + 71 lock-tests = bundle.

---

## [0.52.3] - 2026-04-30 — HUD build-button BEM CSS fix (cost + label visible)

### Fixed — `.cmd-btn__cost`, `.cmd-btn__label`, `.btn-icon`, `.hotkey` now styled
`createCommandButton()` in `HUD.ts` voegt al sinds langer `<span class="cmd-btn__cost">300g</span>` toe aan elke build-button met positieve cost. Maar `hud.css` had alléén CSS-rules voor de oude convention (`.cmd-label`, `.cmd-icon`, `.cmd-hotkey`) — de BEM-klassen die de JS produceert (`cmd-btn__label`, `cmd-btn__cost`, `btn-icon`, `hotkey`) waren ongestyled. Resultaat: cost-text kreeg browser-default rendering (~16px) en overflowde de 48px button — visueel onleesbaar of geclipt. Bug-rapport van Richard 2026-04-30 ("bij de specials staat de 'cost' ook niet zichtbaar in beeld in de HUD").

CSS toegevoegd in `src/ui/hud.css` na `.cmd-btn--build .cmd-icon`:
- **`.cmd-btn .btn-icon`** — flex-shrink:0, 26×26px, centered. Image `object-fit: contain` met 3px radius zodat painted-vignette portraits clean fitten.
- **`.cmd-btn__label`** — 8px uppercase, dim-tekst, ellipsis-overflow.
- **`.cmd-btn__cost`** — 9px mono gold (`var(--color-gold-icon)`), dezelfde stijl als `.cmd-btn--research .research-cost`. Zichtbaar onder de label.
- **`.cmd-btn .hotkey`** — absolute top-right, 9px gold, pointer-events:none zodat clicks doorvallen.

Dit raakt ALLE build-buttons (Barracks, Blacksmith, LumberCamp, FactionSpecial1, FactionSpecial2, Housing, Tower, etc.) — de specials waren het meest opvallend door hun hoogste cost (300g/400g) maar het probleem was generiek.

### Tests (+10, geen regressions)
`tests/HUD-build-cost-display.test.ts` (10 tests):
- Per factie (4 facties × 2 specials = 8 tests): build-faction1 button bevat `.cmd-btn__cost` met "300g", build-faction2 met "400g".
- Per factie (4 tests): build-barracks button bevat een cost-span die matcht `^\d+g(\+\d+h)?$`.
- 1 test: build-barracks button gebruikt `<faction>-barracks.png` als img src (verifieert factie-painted portrait wiring per factie via `getBuildingPortraitUrl`).
- 1 test: factie-switch (limburg → belgen) rebuildt barracks-button met de juiste portrait per factie.

Test-suite: 1647 → 1657. Helper `hud.init({...mocks})` was nodig naast `new HUD()` omdat DOM-refs in `init()` worden geset, niet in de constructor.

### Why patch (0.52.3 ipv 0.53.0)
Pure bug-fix conform `versioning.md` — geen nieuwe features, alleen ontbrekende CSS aanvullen voor reeds-bestaande JS-pad.

---

## [0.52.1] - 2026-04-30 — Limburgs female pool (Nick) + gender-aware UnitVoices

### Added — Gender-flag op `UnitArchetype`
`gender: 'male' | 'female' | 'mixed'` op alle 30 unit-archetypes in `src/data/factionData.ts`. Brabant: Boer/Sluiper/Tractorrijder=male, Boerinneke=female, Carnavalvierder/Praalwagen/Frituurmeester/Muzikant=mixed. Randstad: Manager=male (Serge), de-CEO/Stagiair/etc=mixed. Limburg: Mijnwerker/Schutterij/Mergelridder/Kolenbrander=male, Sjpion/Vlaaienwerper/Mijnrat/Heuvelwacht=mixed. Belgen: Wafelzuster=female, Bierbouwer/Frituurridder/Manneken-Pis-Kanon=male, Frietkraamhouder/Chocolatier/Dubbele-Spion=mixed. Field is `readonly gender?` — defaults to 'mixed' wanneer niet gezet (additief, niet-breaking).

### Added — Gender-aware generic-pool fallback in `UnitVoices.ts`
Refactor `GENERIC_VOICE_LINES` → `MALE_GENERIC_VOICE_LINES` + `FEMALE_GENERIC_VOICE_LINES`. Nieuwe `getGenericPool(factionId, action, gender)` resolver:
- `'male'` → male pool (Reinoud/Nick voor Limburg, Hans/Walter voor Belgen, Richard voor Brabant, Serge voor Randstad).
- `'female'` → female pool. Limburg = Nick origineel female-folder, Belgen = Sharon Vlaams sub-pool. Brabant + Randstad pools zijn leeg → **fallback regel**: `console.warn('[UnitVoices] Female pool empty for faction X action Y — falling back to male pool.')` + return male pool. Warn is de-dup'd per `(factionId, action)` zodat console niet vol-spamt.
- `'mixed'` → union van beide pools; lege pool wordt overgeslagen zodat random-pick niet richting de niet-bestaande pool biased.

`playUnitVoice(factionId, action, unitTypeId?, gender = 'mixed')` accepteert nu een `gender`-parameter. Alle 6 call-sites in `src/core/Game.ts` (select / attack-move / move / attack / gather / ready / death) plumb de unit-gender via de nieuwe helper `getUnitVoiceGender(factionId, unitTypeId)` uit `factionData.ts`. Hero death/revive blijven 'mixed' (geen unitTypeId beschikbaar in event-payload).

### Added — Limburgs female pool via Nick origineel (22 files)
`scripts/generate-limburgers-female-voices.sh` (nieuw) — genereert 22 generic Limburgs female files via ElevenLabs TTS met Nick `PrYUlaJFEdOSVy6jaEaG` ("transgender Limburger" framing). Output: `public/assets/audio/voices/limburgers/female/{select|move|attack|gather|death|ability|idle|ready}_N.mp3`. Voice settings: stability 0.30, similarity 0.85, style 0.65 (zachter timbre dan Reinoud-male). Tone: vrouwelijk-Limburgs ("Glück auf, miene leef.", "Hajje, ich kom.", "Joa veurspring!", "Bij mien moeder de berg!", "Och nei... moeke...", "Get ich noemt sjpisser?"). Kosten: $0 (ElevenLabs unlimited subscription).

### Tests (+16, geen regressions)
`tests/UnitVoices-gender.test.ts` (16 tests, 6 describe-blokken):
1. **(a) male → male pool**: Limburgers/Belgen male geeft geen `/female/` of `/sharon/` paths.
2. **(b) female → female pool**: alle paths onder `/limburgers/female/` resp. `/belgen/sharon/`.
3. **(c) mixed → union**: Limburgs mixed bevat zowel male als female paths; Brabant mixed = male pool (geen female pool).
4. **(d) empty female pool → warn + fallback**: Brabant/Randstad female resolved naar male pool met `console.warn('Female pool empty')`, de-dup per `(factionId, action)`.
5. **(e) `getUnitVoiceGender`**: Boer=male, Boerinneke=female, Wafelzuster=female, Mijnwerker=male, Manager=male, unknown→mixed (graceful, geen throw).
6. **(f) end-to-end via `playUnitVoice`**: female + Limburgers speelt `/limburgers/female/` file; male + Belgen speelt nooit `/sharon/` file.

### Tests-totaal
1618 → 1634 (+16, alle 16 nieuw, alle 1634 groen). Geen regressions.

---

## [0.52.2] - 2026-04-30 — Manager re-vamp (stats + meleeBackup + voice + mesh + portrait)

### Why
Live-test 2026-04-30 + GA-agent rapport: de Randstad Manager was een **categorie-fout**. Geclassificeerd als Infantry, maar gameplay = ranged-harasser (range 7). Voice `select_1.mp3` was 30-50% korter dan andere Randstad units (8.6KB anomalie). Mesh voelde grover/cartoony naast painted-realistic Stagiair/Consultant. Bundle pakt alle vier de assen tegelijk aan. Versie-nummer: 0.52.2 omdat 0.52.1 (gender-aware UnitVoices) parallel werd ingevoerd.

### Stats — hybrid harasser (akkoord van Richard)
- `hp` 70 → **85** (kan een melee-engagement overleven)
- `range` 7 → **5** (mid-range, niet sniper-ver)
- `attack` 9 → **7** (lichter dan oude "strong harasser", compenseert hp + meleeBackup)
- Nieuwe **`meleeBackup: true`** flag op Manager-archetype (factionData.ts + RANDSTAD_UNIT_ARCHETYPES). Andere units ongemoeid (Consultant blijft pure ranged debuffer met range 9).

### New — `meleeBackup` mechanic (CombatSystem)
- Nieuwe ECS-component `MeleeBackup` met cached ranged + melee profielen (`rangedRange/Damage`, `meleeRange/Damage`, `mode`).
- Nieuwe constants `MELEE_BACKUP_THRESHOLD = 2` tiles + `MELEE_BACKUP_HYSTERESIS = 0.5` tiles in `types/index.ts`.
- `CombatSystem.processAttacking` roept `updateMeleeBackupMode(eid, distSq)`: bij target binnen 2 tiles → swap naar melee profile (range = `MINIMUM_MELEE_RANGE`); bij target buiten 2.5 tiles → swap terug naar ranged. Hysteresis voorkomt flicker aan de rand.
- Damage type, projectile-emit, armor-modifier, gezelligheid-bonus blijven zoals ze zijn: ze lezen `Attack.range`/`Attack.damage` die we mutaten — geen tweede pipeline.
- Factory-helper `setupMeleeBackupIfNeeded` in `factories.ts` wordt aangeroepen vanuit zowel `initUnit` als `initUnitFromArchetype`.

### Voice — re-cast (Daniel, ElevenLabs `onwK4e9ZLuTAKqWW03F9`)
6 generic events (select 1-3 + move 1-3) herschreven met meer manager-energy (corporate jargon: deliverables, KPI's, alignment, roadmap, off-site, stakeholders). Gegenereerd via `scripts/regen_manager_voice.sh`. Stab 0.45 / Sim 0.78 / Style 0.55 voor authoritatieve boardroom-cadence. Oude files bewaard als `*.bak.mp3`. select_1.mp3 nu 27KB (was 8.5KB anomalie). Daniel is Manager-only — Antoni / Serge blijven default Randstad voice voor andere units.

### Mesh + Portrait
- `manager.glb` (nieuw, 14000 polycount, PBR) + `infantry-v2.glb` (mirror — UnitRenderer laadt deze voor Randstad Infantry) via Meshy v6 image-to-3d met painted-realistic Flux-Dev concept als referentie. Oude mesh als `infantry-v2.bak.glb`.
- `randstad-infantry.png` regenereerd via Flux Dev painted-vignette template (zelfde stijl als andere Randstad portretten). Backup als `randstad-infantry.bak.png`.
- Pipeline-script: `scripts/regen_manager_mesh_portrait.py` (concept | mesh | portrait | all). Manifest in `scripts/manager_revamp.json`.

### Tests
- Nieuw: `tests/manager-revamp.test.ts` — 13 tests: stats lock-in (hp=85, range=5, attack=7), meleeBackup flag, MeleeBackup-component wiring, CombatSystem mode-switch (in/out, hysteresis), regression Consultant + Carnavalvierder krijgen GEEN MeleeBackup, constants sanity.
- Test count delta op deze bundle: +13. Suite groen.

### Files
- `src/types/index.ts` — `meleeBackup` op `UnitArchetype`, `MELEE_BACKUP_THRESHOLD/HYSTERESIS` constants
- `src/data/factionData.ts` — Manager stats + flag
- `src/entities/archetypes.ts` — RANDSTAD_UNIT_ARCHETYPES Manager stats + flag
- `src/ecs/components.ts` — `MeleeBackup` component
- `src/entities/factories.ts` — `setupMeleeBackupIfNeeded` helper, gewired in beide init-paths
- `src/systems/CombatSystem.ts` — `updateMeleeBackupMode` toggle in processAttacking
- `tests/manager-revamp.test.ts` — nieuw

### Niet in deze bundle
Deploy. Richard test eerst lokaal.

---

## [0.51.3] - 2026-04-30 — Randstad Barracks mesh herontworpen + production rebuild

### Replaced — `randstad-barracks.glb` (greenroof presentation-hall)
Meshy v6 ronde: 3 concept-variants (amphitheater/greenroof-hall/dome), gekozen presentation-hall-greenroof voor TOP-DOWN distinctness vs tower-townhall (groendak + glass curtain walls + theatre seating zichtbaar). 9.4MB GLB, 18000 polycount, PBR. Backup als `barracks.bak.glb`.

### Production rebuild
`npm run build` + rsync dist/ → web root. Alle Voice & Message Pass code (v0.49.0+) + Nick sub-pool + TowerSystem + BuildSystem timer + Randstad Barracks mesh nu live in bundle. **Richard moet hard-refresh** (Cmd+Shift+R) — eerdere bundle was van vóór v0.49.0.

### BACKLOG P1
Manager mesh "grover/cartoony" vs andere Randstad units. v0.52.0 Manager re-vamp bundle (mesh + voice + stats + portrait).

---

## [0.51.2] - 2026-04-30 — Limburgers Nick sub-pool + BuildSystem timer text + Manager audit

### Added — Nick als 2e Limburgers voice (20 generic files)
`public/assets/audio/voices/limburgers/nick/{action}_N.mp3` — 20 Nick-files (`PrYUlaJFEdOSVy6jaEaG`, "Limburgs coaching voice"). Limburgs dialect: "Jao, ich luuster", "Hier, Sjeng", "Hajje!", "Gluck auf!", etc. `subPoolLines` mechanisme in `UnitVoices.ts` mixt Nick met Reinoud in random-select-pool — "transgender Limburger" framing.

### Added — Construction-timer text in Building.status (BACKLOG P2)
Pure helper `formatConstructionStatus(progress, maxProgress, complete)` geëxporteerd uit `src/systems/BuildSystem.ts`. Building-card status toont nu `Under construction (15s)` i.p.v. plain `Under construction` zolang `Building.complete=0` — dezelfde `(Xs)` / `Math.ceil` conventie als trainings-units (`Training X (12s)`). Helper retourneert `null` bij `complete=1` zodat de caller (Game.ts) Idle/Training/etc. kan kiezen. Beide call-sites in `src/core/Game.ts` (`buildBuildingCardData` + per-frame status-refresh) gebruiken nu de helper. 7 lock-tests in `tests/BuildSystem-status-timer.test.ts` (constructing → suffix, complete → null, defensive `maxProgress<=0`, `Math.ceil` rounding, edge `progress==maxProgress`).

### Manager karakter audit (BACKLOG entry, GA-agent rapport)
Diagnose: Manager is een **categorie-fout** — geclassificeerd als Infantry maar gameplay is Ranged-harasser (`range: 7`), `select_1.mp3` 30-50% korter dan andere Randstad-units (8.6KB vs ~12-21KB). Aanbevolen Optie 2 (medium): re-cast voice + stats-rebalance (hp 70→85, range 7→5, attack 9→7) + `meleeBackup: true` flag voor unieke vibe vs Consultant. **NIET geïmplementeerd in deze bump** — Richard akkoord nodig op stats-rebalance.

### Tests
1611 → 1618 (+7 BuildSystem timer tests, eerder al +5 TowerSystem in v0.51.1).

---

## [0.51.1] - 2026-04-29 — TowerSystem sniper-bonus vs Ranged units (BACKLOG P2)

### Added
- `TOWER_RANGED_BONUS = 1.5` constant in `src/systems/TowerSystem.ts`. Watchtowers nu 1.5× damage tegen `UnitTypeId.Ranged` targets (elevated firing platform = natuurlijke counter tegen units die op positionering rekenen i.p.v. armor).
- `tower-attack` event draagt nu de FINALE damage-waarde (incl. bonus) i.p.v. de constante `TOWER_DAMAGE` — downstream consumers (damage popups, particles, audio) reflecteren de bonus correct.

### Tests
- Nieuwe regression-class invariant suite `tests/TowerSystem-sniper-bonus.test.ts` (5 tests):
  1. Tower vs Ranged → 22.5 dmg (1.5×)
  2. Tower vs Worker/Infantry/Heavy → 15 dmg (1.0× baseline)
  3. Tower vs Hero/Special/Siege/Support → 15 dmg (1.0× baseline)
  4. Tower vs entity zonder UnitType component → 15 dmg (graceful fallback)
  5. Event-payload `damage` matcht actual HP-delta voor zowel Ranged als non-Ranged
- Full suite: 1611/1611 (was 1606 baseline — +5 nieuwe tests, geen regressions)

### Implementatie
Conditional in `towerSystem()` na target-selectie:
```ts
let damage = TOWER_DAMAGE;
if (hasComponent(world, closestEid, UnitType) && UnitType.id[closestEid] === UnitTypeId.Ranged) {
  damage *= TOWER_RANGED_BONUS;
}
Health.current[closestEid] -= damage;
eventBus.emit('tower-attack', { towerEid, targetEid: closestEid, damage });
```

Additive — geen breaking changes, 1.0× blijft baseline voor 7 van 8 unit-types + entities zonder UnitType.

## [0.51.0] - 2026-04-30 — Voice-files upload-page LIVE + 7 Brabander slot-fixes

### Added — `https://reign-of-brabant.nl/voice-files/` LIVE
Frontend `public/voice-files/index.html` (vanilla JS + CSS, mobile-first), 7 character-cards (Brabant + 6 nieuwe scripts), per card download-script-button + upload-form (.m4a/.mp3/.wav/.ogg, 50MB cap) + submissions-lijst met play-controls. Style match met `/doneer/` (Cinzel + Inter, gold-on-dark).

### Added — `rob-voices` Docker microservice op M4 (port 3110)
Bun TypeScript native (geen Express), endpoints:
- `POST /voice-uploads/api/submit` (multipart, validatie character/extension/size/email, sanitised submitterName, rate-limit 5/uur/IP, atomic JSON-store)
- `GET /voice-uploads/api/list?character=X` (geen email exposed, optionele filter)
- `GET /voice-uploads/files/:character/:filename` (audio streaming, path-traversal guard)
- `GET /voice-uploads/api/health`

CORS: allow-origin `https://reign-of-brabant.nl` + `http://localhost:5173`.
Storage M4: `/Users/Shared/srv/docker/rob-voices/uploads/`. Caddy route via `handle /voice-uploads/* → reverse_proxy rob-voices:3110` in @rob block. Container restart was nodig om de mount-refresh te krijgen (Docker bind-mount inode-issue op macOS).

### Vite proxy — local dev integratie
`vite.config.ts` server.proxy: `/voice-uploads → http://localhost:3110`. Lokale dev-flow werkt nu end-to-end met Bun-server `bun run services/rob-voices/src/server.ts`.

### Fixed — 7 Brabander slot-issues uit Richard's listening-pass
| Slot | File | Issue | Fix |
|---|---|---|---|
| 45 | sluiper/idle_2 | Begint met spoken "45" (2x take) | Start 220.40 (na 2e 45-take) |
| 47 | tractorrijder/select_2 | Begint met "..veertig" leakage | Start 235.50 |
| 48 | tractorrijder/select_3 | Eindigt met "49"-leak | End 244.80 |
| 73 | frituurmeester/ability_2 | Cut mid-"zalfaanval" door Scribe-merged "wal.Vierenzeventig" | Extend tot 367.10 |
| 131 | death_2 | "verloren" + foute "122"-misspraak | 639.40-641.40 |
| 132 | gather_1 | Start nog binnen 2e "honderdtweeendertig" word | Start 645.30 (na word-end) |
| 133 | gather_2 | Start nog binnen "drieendertig" word | Start 650.10 (na word-end) |

Inzicht: oorspronkelijke split-by-spoken-numbers.py gebruikte word.start als boundary, maar bij re-takes met snelle herhaling staat de actual word END pas later. Fix-overrides hardcoded met word.end + 0.20s buffer.

### Deploy — productie LIVE
- M4: `rob-voices` container running, `docker compose up -d` (image built local op M4)
- Caddy: `Caddyfile.backup-pre-voiceuploads` + `handle /voice-uploads/*` injected, container restart om mount-refresh
- Web: `npm run build` + rsync dist/ → `/Users/Shared/srv/www/reign-of-brabant/`
- Brabander voice-fixes rsync direct naar live web-root

### Smoke-tests groen
- `https://reign-of-brabant.nl/voice-files/` 200
- `https://reign-of-brabant.nl/voice-files/RECORDING-SCRIPT-BRABANDER.md` 200
- `https://reign-of-brabant.nl/voice-uploads/api/health` → `{"ok":true,"submissions":0}`

### Tests
1606/1606 tests groen (geen frontend-tests, microservice handmatig gevalideerd via curl).

---

## [0.50.2] - 2026-04-30 — Recording-scripts complete (7 facties × 138 slots) + audit-pages generator

### Fixed — Brabander split-bug rond slot 131-133
Richard sprak per ongeluk "honderd tweeëntwintig" (slot 122) waar slot 132 hoorde, en herhaalde "honderd tweeëndertig" twee keer. Splitter koos de tweede match → slot 131 (death_2) bevatte het foute 122-nummer, slot 132 (gather_1) startte met de eerste 132-take. Manual re-extract met handmatige boundaries: death_2 [639.30, 641.50], gather_1 [644.40, 648.70], gather_2 [649.30, 654.00].

### Added — 6 nieuwe RECORDING-SCRIPT-*.md files (parallel generated via 6 background agents)
Elk script: 138 genummerde slots in zelfde structuur als RECORDING-SCRIPT-BRABANDER.md, met per-unit karakter-instructies en suggested lines in factie-dialect. Easter-egg appendix per factie.

| Factie | M-script | F-script |
|---|---|---|
| Limburgers | RECORDING-SCRIPT-LIMBURGERS-MALE.md | RECORDING-SCRIPT-LIMBURGERS-FEMALE.md |
| Randstad | RECORDING-SCRIPT-RANDSTAD-MALE.md | RECORDING-SCRIPT-RANDSTAD-FEMALE.md |
| Belgen | RECORDING-SCRIPT-BELGEN-MALE.md | RECORDING-SCRIPT-BELGEN-FEMALE.md |

Brabander script blijft origineel (gender-neutraal voor nu, recorder-voorkeur).

### Added — `scripts/build-audit-page.py` template-generator
Parsed RECORDING-SCRIPT-*.md → genereert `public/voices-audit-<faction>[-gender].html` met alle 138 slots in een speelbare grid. Auto-detecteert factie + gender uit filename. Gebruikt voor 7 audit-pages totaal.

### Audit-pages live (via Vite dev-server)
- `/voices-audit-brabanders.html` (138 slots, Richard's eigen recording)
- `/voices-audit-limburgers-male.html` + `-female`
- `/voices-audit-randstad-male.html` + `-female`
- `/voices-audit-belgen-male.html` + `-female`

Audio-controls falen voor unfilled slots (geen MP3 nog) — verwacht: pas zichtbaar wanneer recordings binnenkomen.

### Tests
1606/1606 groen, geen code-wijzigingen.

### Phase 4 (BACKLOG voor volgende sessie)
Voice-files upload-page op `https://reign-of-brabant.nl/voice-files/` + nieuwe `rob-voices` Docker microservice op M4 (port 3110) met endpoints `/voice-uploads/api/{submit,list}` + `/voice-uploads/files/`. Caddy-route. Architectuur-spec staat in deze session-trace, BACKLOG entry komt apart.

---

## [0.50.1] - 2026-04-30 — Brabander voices: Richard zelf ingesproken (138 files)

### Replaced — 138 Brabander voice-files door Richard zelf
Richard's eigen voice-recording vervangt de ElevenLabs Richard-voice. Reden: ElevenLabs-uitspraak van Brabants dialect bleef onnatuurlijk klinken. Eigen opname is authentieker en biedt vrijheid voor improvisatie.

### Pipeline — `scripts/split-by-spoken-numbers.py`
Eén-recording-naar-138-files via:
1. ElevenLabs **Scribe** STT met word-level timestamps (~$0.04 voor 11 min audio)
2. Vind alle gesproken slot-nummers ("één", "twee"... "honderdachtendertig"); fuzzy matching voor Scribe-quirks (merged words zoals "wal.Vierenzeventig", typos zoals "Einennegentig" vs "Eenennegentig")
3. Audio tussen nummer[N].end en nummer[N+1].start wordt slot[N]; `silenceremove` filter trimt leiding/staart-stilte
4. STT response gecached in `*.stt.json` (one-call-only)

### Cleanup — Boerinne portrait + voice
v0.50.x mid-sessie hotfixes:
- `brabant-support.png` portrait gegenereerd via Flux Dev (boerinne, 512x512, $0.03)
- `UNIT_PORTRAITS[Brabanders][Support] = 'brabant-support'` in portraitMap.ts
- Boerinne 15 voice-files apart geregenereerd via Emma (zal nu vervangen worden door Richard's vrouw/dochter via recording-flow indien gewenst)

### Niet aangeraakt
- 138 Brabander files staan nu klaar voor normalize-batch — Limburgers/Belgen/Randstad blijven op hun bestaande generated voices.
- `RECORDING-SCRIPT-LIMBURGER.md` is nog niet gegenereerd. Aanbevolen: laat een Limburger zelf inspreken voor authenticiteit.

### Tooling
- `scripts/split-by-spoken-numbers.py` herbruikbaar voor andere facties
- `scripts/split-voice-recording.sh` (silence-only versie) blijft beschikbaar als fallback wanneer geen STT beschikbaar
- `_recording/` toegevoegd aan `.gitignore`

### Tests
1606/1606 groen, type-check clean (geen code-wijzigingen, alleen audio + scripts).

---

## [0.50.0] - 2026-04-29 — Voice-pipeline complete swap + audio-normalisatie batch

### Regenerated — Brabander voices (Richard, ~138 fresh files)
Joost/Adam stem volledig vervangen door Richard (`KJMAev3goFD3WOh1hVBT`, native Zuid-Oost Brabants). 8 units × 20+ lines fresh geschreven in echt dialect — **geen "-ansen" antipatroon meer**:
- "un / ne / den" lidwoorden, "-ke" verkleinwoorden, "vat" ipv "pak", "gemokt", "klaor", "stao", "schôn"
- ALAAF alleen bij carnaval-context (carnavalvierder, praalwagen)
- Karakter per unit: boer (calm), carnavalvierder (loud euphoric), sluiper (whispery), tractorrijder (brommig), frituurmeester (trots-vet), boerinne (warm), praalwagen (feestelijk), prins-van-brabant (charismatisch leider)
- Settings per unit aangepast: stability 0.35-0.55, style 0.40-0.70 voor karakter-fit
- Script: `scripts/generate-brabander-voices.sh` (herbruikbaar)

### Regenerated — Limburgers voices (Reinoud, ~180 fresh files)
Luk Balcer stem vervangen door Reinoud (`5tiZStRJQ98Xw420MFFx`, "De nasale limburger"). +40 nieuwe gather/ready files (ontbraken in oude set):
- Limburgs dialect: "ich/dich/doow", "neet/waat/sjoen", "Gluck auf!", "hajje!", "noa/naor", "hoes"
- Mergel-toon, water/mineraal-metaforen voor death-lines
- Mijnbaas houdt minimalisme-regel (max 4 woorden, gezag via stilte)
- Settings: stability 0.45 (hoger voor Reinoud's nasale rust)
- Script: `scripts/generate-limburgers-voices.sh`

### Added — Sharon Vlaams als 2e Belgen vrouwelijke stem (20 generic files)
`g7B5PNoscIXomLNUmHAb` — naast bestaande Petra. Ge-mixed in pool zonder Hans/Walter/Petra te vervangen:
- Nieuwe `subPoolLines(faction, sub, action, count)` helper in `UnitVoices.ts`
- `GENERIC_VOICE_LINES[3]` (Belgen) breidt nu uit met `[...genericLines, ...subPoolLines('belgen', 'sharon', ...)]` per actie
- Random-select-mechanism mixt automatisch
- Vlaams: "voila", "allez", "amai", "ge/gij", droog-Belgisch
- Files in `public/assets/audio/voices/belgen/sharon/{action}_{N}.mp3`
- Script: `scripts/generate-belgen-sharon.sh`

### Normalized — alle 595 voice-files (audio-normalisatie batch)
`scripts/normalize-voices.sh --all` over volledige stack:
- **Loudnorm**: -16 LUFS integrated, peak max -1 dBTP
- **EQ-match**: high-pass 80Hz, low-shelf -2dB onder 200Hz, presence-boost +1.5dB @ 3kHz
- **De-essing**: lichte compand voor sissende stemmen
- **875/875** files succesvol verwerkt, 0 skipped, 0 failed (dubbele path-resolution na .bak cleanup)
- Voices-normalized/ swapped in-place via rsync, oude voices/ vervangen door genormaliseerde versie

### Cleanup — `.bak` folders opgeruimd
`voices/brabanders.bak/` (oude Joost) + `voices/limburgers.bak/` (oude Luk) verwijderd. Git-history bewaart de oude content indien rollback nodig.

### Niet aangeraakt
- Limburgs female pool via Nick → P1 in BACKLOG. Vereist gender-aware code in `UnitVoices.ts` (per-unit gender-mapping + male/female pool-split). Bundel voor v0.51.0.
- Brabander female (Emma) en Belgen Sharon zijn nu mixed-pool ipv gender-aware. Zelfde refactor zal die ook gender-isolatie geven.

### Tests
Geen nieuwe lock-tests (audio-bestanden zelf zijn niet code-testbaar). Bestaande 1606 lock-tests groen, type-check clean.

---

## [0.49.3] - 2026-04-29 — Voice-cast locked + 8 easter-egg signature lines

### Locked — Nieuwe voice-cast (alle 4 facties)
Na uitgebreide ElevenLabs-casting via `voice-cast-preview.html`:
- **Brabanders male**: Richard (`KJMAev3goFD3WOh1hVBT`) vervangt Joost
- **Brabanders female**: Emma natural (`OlBRrVAItyi00MuGMbna`) — nieuwe stem
- **Limburgers male**: Reinoud (`5tiZStRJQ98Xw420MFFx`) vervangt Luk
- **Limburgers female**: Nick (`PrYUlaJFEdOSVy6jaEaG`) origineel — geen pitch-shift, "transgender Limburger" framing voor karakter-variatie
- **Belgen 2e female**: Sharon Vlaams (`g7B5PNoscIXomLNUmHAb`) naast bestaande Petra

Volledige voice-pipeline regeneratie met deze ids staat op P1 in BACKLOG (138 Brabander + 138 Limburgers files te regen, plus nieuwe female pools).

### Added — 8 easter-egg signature lines (5% kans op select/idle/ready)
Warcraft-style flavour: rare random replacement van normale voice-pool. 5% probability, alleen op select/idle/ready actions.

| Factie | Lines |
|---|---|
| **Brabanders** (Richard) | _"Vat anders gewoon urst ekkes een pilske!"_ — _"NAAIT EM!"_ |
| **Randstad** (Serge) | _"IK DOE NIET MEER MEE!"_ — _"Mag ik even iets tegen je aanhouden?"_ |
| **Limburgers** (Reinoud) | _"Neeje da wil ik nie!"_ — _"Ik goa naor hoes!"_ |
| **Belgen** (Hans) | _"Amai!!"_ — _"Een patat is hier een aardappel meneer, het is FRIET"_ |

Files: `public/assets/audio/voices/{faction}/easter-egg/{01,02}-XX.mp3`. Pool kan groeien zonder code-changes.

### Implementation — `src/audio/UnitVoices.ts`
- `EASTER_EGG_LINES` pool per factie + `EASTER_EGG_PROBABILITY = 0.05` + `EASTER_EGG_ACTIONS = {select, idle, ready}`
- `__easterEggRng` hook voor deterministische tests
- 800ms cooldown blijft van toepassing — geen voice-stacking

### Tests — 4 easter-egg lock-tests
`tests/easterEggLines.test.ts`: low-random triggert easter-egg, high-random niet, attack-action triggert nooit, alle 4 facties hebben eigen pool met juiste filenames. Suite: 1602 → 1606.

### Voice-cast-preview pages
`public/voice-cast-preview.html`: alle ronden 1-4 + Reinoud + Sharon-bonus voor toekomstige reviews. Files in `public/_preview/voice-cast/` (gitignored).

---

## [0.49.2] - 2026-04-29 — Themesong "Nie Fokke Mee Brabant" alleen bij Brabander victory

### Fixed — Themesong leakte naar campaign ambient
`music_brabanders.mp3` was byte-identiek aan `cinematic/.../nie-fokke-mee-brabant-v1.mp3`. Brabanders hadden dus géén instrumentale ambient — de themesong met tekst werd voortdurend afgespeeld tijdens campaign en skirmish. Andere facties hadden wél echte instrumentale tracks (`music_randstad.mp3` etc.).

### Changed — Music files reorganisatie
- `public/assets/audio/music/music_brabanders.mp3` → vervangen door `cinematic/music/storm-over-low-fields.mp3` (instrumentale ambient, Brabants tintje)
- `public/assets/audio/music/music_brabanders_2.mp3` → verwijderd (was duplicate themesong)
- `public/assets/audio/music/music_victory_brabanders.mp3` → toegevoegd (= themesong v2, alleen victory-trigger)

### Added — `MUSIC_IDS.VICTORY_BRABANDERS` + `playVictory(winnerFactionId?)`
`MusicSystem.playVictory()` accepteert nu een optionele winnerFactionId. Brabanders → themesong-track, andere facties → generieke `music_victory.mp3`. Backwards-compatible: zonder factionId fallt-back op generic.

### Wired — Game.ts callsites
- `Game.ts:516` mission triggerVictory → `this.playerFactionId` mee
- `Game.ts:3970` skirmish triggerGameOver → `this.playerFactionId` mee

### Tests — 6 themesong lock-tests
`tests/themeSongVictory.test.ts`: 4 facties × victory + no-faction fallback + MUSIC_IDS regressie-signaal. Suite: 1596 → 1602.

### Tooling-bonus — Audio + music preview pages
- `public/audio-ab-preview.html`: A/B luister-page voor genormaliseerde voice-samples
- `public/music-preview.html`: A/B luister-page voor music tracks (themesong / ambient / cinematic candidates)
- `public/_preview/` toegevoegd aan `.gitignore` (lokale browser-only assets)

### Niet aangeraakt
- Latente fallback-bias in `MusicSystem.ts:288` (`return variants ? pickRandom(variants) : MUSIC_IDS.BRABANDERS`) blijft staan — dood-code vandaag (alle 4 facties gemapt). Op BACKLOG voor v1.0 polish.

---

## [0.49.1] - 2026-04-29 — Voice & Message Pass: audio-laag rewire (saaie generics → factie-voice)

### Added — Factie-voice op death + hero-revival events
3 nieuwe `playUnitVoice` callsites in `Game.ts` event-handlers, naast de bestaande generic SFX (positionele cue blijft):
- `unit-died` (Game.ts:1957) → `playUnitVoice(event.factionId, 'death', event.unitTypeId)` — Brabant boer sterft als Brabander, Limburgs mijnwerker als Limburger, etc. Gebruikt unit-type-specifieke voice waar beschikbaar, factie-generic anders.
- `hero-died` (Game.ts:1973) → `playUnitVoice(event.factionId, 'death')` — generieke factie-death-voice voor heroes (heroTypeId mapt niet 1:1 op UnitTypeId, dus generic fallback).
- `hero-revived` (Game.ts:1981) → `playUnitVoice(event.factionId, 'ready')` — held meldt zich met factie-voice na revival.

### Why
525 voice files in `UnitVoices.ts` (4 facties × 8 actions × 8 units + generics) waren nog deels orphaned: select/move/attack/gather/idle waren gewired, death + ready/revival nog niet. Nu wordt dat materiaal echt gebruikt.

### Side-effects
- Voice-cooldown 800ms in `playUnitVoice` voorkomt overload bij massa-deaths in battle.
- Music-ducking 1500ms blijft per voice-trigger.
- Geen tests toegevoegd: het is event-handler wire-up, geen logica om te isoleren. Bestaande 29 lock-tests + suite van 1596 blijven groen.

---

## [0.49.0] - 2026-04-29 — Voice & Message Pass: factie-aware HUD-alerts (ronde 1)

### Added — `src/data/factionMessages.ts` registry
Centrale `getFactionMessage(factionId, eventKey, params)` helper met pools per factie. Vervangt hardcoded NL-strings in 5 hot-spot HUD.showAlert callsites. Placeholder-substitution `{name}` / `{upgrade}` met letterlijke fallback bij ontbrekende keys (regressie-signaal). Random pick over pool zodat toekomstige variatie zonder code-changes kan groeien.

### Fixed — "ALAAF!" leak naar non-Brabant facties
Live-bug: `Game.ts:1633` toonde voor élke held-spawn _"${name} is verschenen! ALAAF!"_, óók voor Randstad CEO en Belgische Frietkoning. Nu factie-specifiek:
- **Brabanders** (Zuid-Oost dialect): _"Den Prins stao d'r — ALAAF!"_, _"Den Prins is gevalle… vat un pilske, jonge."_, _"{name} is klaor — schôn wèrk!"_, _"{upgrade} — gemokt!"_, _"Vol! Bouw d'r un huiske bij."_
- **Randstad** (corporate): _"{name} is gearriveerd. Boardroom open."_, _"{name} offline. ETA 60s. Sprint blijft staan."_, _"{name} opgeleverd. Conform planning."_, _"{upgrade} live. Rolling out."_, _"Capacity reached. Schaal kantoorruimte op."_
- **Limburgers** (mergel-toon): _"{name} is eraan, jong."_, _"{name}… terug naor de steen."_, _"{name} is geboewd. Sjoen."_, _"{upgrade}. Goe doende."_, _"Geen plek mie. Bouw nog ne mergelhof."_
- **Belgen** (theatraal): _"{name} betreedt het slagveld!"_, _"{name} gevallen — de friet huilt."_, _"{name} voltooid — voila!"_, _"{upgrade} ontwikkeld in 't atelier."_, _"Vol! Allez, nog 'n gildehuis erbij."_

### Wired callsites
`Game.ts:1556` (pop-cap), `Game.ts:1633` (hero-spawn), `Game.ts:1970` (hero-death), `Game.ts:2058` (housing-complete), `Game.ts:2093` (research-complete).

### Tests — 29 lock-tests
`tests/factionMessages.test.ts`: 4 facties × 5 events coverage matrix + tone-anchor leakage check (regex per factie) + ALAAF-leakage regression test + placeholder substitution + fallback bij onbekende factionId. Suite: 1567 → 1596 (+29).

### Tone-bron
Brabants-correcties van Richard verwerkt: **un** (vrouwelijk/onzijdig) vs **ne** (mannelijk), **vat** ipv "pak", **gemokt** voor "voor elkaar". Anti-pattern "-ansen" suffix vermeden. Andere facties op basis van scenario-writer agent + `feedback_rob_tone.md`.

---

## [0.48.2] - 2026-04-29 — Towers visibly defend, faction-tinted projectiles

### Fixed — Watchtowers leken niet te verdedigen
Live-bug Richard 2026-04-29: "de wachttorens lijken niet te verdedigen".
Root cause: `TowerSystem` past damage direct toe op de target en emit een `tower-attack` event — maar er was NERGENS een listener voor dat event. ProjectileRenderer bestond als code maar werd niet eens geïnstantieerd. Resultaat: wachttoren staat stil terwijl vijanden binnen range "vanzelf" doodgaan.

### Added — ProjectileRenderer wired in main.ts
- `ProjectileRenderer` krijgt eigen `projectileGroup` aan de scene en wordt geladen via `preload()` op boot.
- Update-tick toegevoegd in main render loop (`projectiles.update(dt)`).
- Game-constructor neemt nu een `ProjectileRenderer` parameter.

### Added — Tower-attack visual + audio chain
`Game` luistert nu op `tower-attack`:
- Spawnt parabolic-arc projectiel van toren-top (terrain Y + 6) naar target body (terrain Y + 1)
- Vluchtduur ~22u/s zodat lange schoten realistisch lang vliegen, korte ~0.2s
- Speelt `arrow_shoot` op de toren-locatie en `arrow_impact` op het doel
- Spawnt `spawnCombatHit` particle puff op target — dezelfde feedback als unit-ranged-hits

### Added — Faction-tinted tower projectiles
`ProjectileSpawnData.tintColor?: number` — RGB hex die de trail-vertex-colors en spark/impact tint stuurt. Per factie:
- **Brabanders** → `#ff8830` warm oranje-rood (Bourgondisch)
- **Randstad** → `#6090ff` corporate blauw
- **Limburgers** → `#d9b766` mergel coal-geel
- **Belgen** → `#ffd24a` Belgisch goud

### Side-effect: alle projectielen zijn nu factie-tintbaar
De extensie van `ProjectileSpawnData` met `tintColor` werkt voor élke projectiel-spawn (niet alleen towers). Toekomstige unit-ranged callers kunnen dezelfde tints hergebruiken.

### Files
- Modified: `src/main.ts` (ProjectileRenderer instance + group + preload + update tick)
- Modified: `src/rendering/ProjectileRenderer.ts` (tintColor field, ActiveProjectile.tintR/G/B, vertex-color tinting)
- Modified: `src/core/Game.ts` (projectiles field + tower-attack listener met factie-tint table)
- Modified: `package.json`, `CHANGELOG.md`

1567 tests blijven groen.

## [0.48.1] - 2026-04-29 — Build-ghost fixes + ability cooldown overlay

### Fixed — Build-ghost preview altijd 'barracks'
`Game.updateBuildGhost` had hardcoded `ghostModel = 'barracks'` als comment "Use 'barracks' ghost model for buildings without dedicated model". Resultaat: elke placement-preview toonde Barracks-mesh, niet het daadwerkelijk geplaatste gebouw. Vervangen door `getBuildingRendererType(getBuildingTypeIdForGhost(...))` zodat de ghost-mesh nu matcht met de target building. Ook de `valid`-tint reflecteert nu de live `validateBuildingPlacement` check (groen kan, rood blokkeert).

### Added — Activity-circle preview tijdens placement
Bij placement van gebouwen met een signature radius wordt nu de aura-ring meegerenderd op de cursor:
- DefenseTower → tower attack range (TowerRangeRenderer, oranje)
- Brabant Worstenbroodjeskraam → 8u heal aura
- Brabant Carnavalstent → 12u damage aura
- Limburg Vlaaiwinkel → 10u heal pulse

Plaatsing van gebouwen zonder bekend aura toont alleen de ghost-mesh. Beide renderers verbergen netjes bij `exitBuildMode`.

### Added — Cooldown sweep overlay op click-action buttons
Building-card click-actions (Sprint Mode / Carnavalsoptocht / Trakteerronde / Vlaai-Trakteer / Kwartaalcijfers / Ploegendienst / Drukvuur / Deadline Crunch) hadden alleen tekst-feedback ("CD 30s" in label). Nu ook visueel:
- `BuildingCardAction` uitgebreid met `buffRemaining` + `cooldownRemaining` + `cooldownMax`
- HUD rendert een `bcard-action-cd-overlay` div met `clip-path: inset(...)` sweep — matcht het bestaande hero-ability patroon
- Tijdens actieve buff: warm-gele tint + glow zodat speler ziet dat het effect nog loopt
- Tijdens cooldown: dark sweep van top-naar-bottom als de timer afloopt
- Nieuwe `HUD.updateBuildingCardActionCooldowns(actions)` updatet overlays in-place per frame zonder DOM rebuild — geen flicker
- Cooldown-constants nu geëxporteerd (BOARDROOM_COOLDOWN, VLAAI_TRAKTEER_COOLDOWN, TRAKTEERRONDE_COOLDOWN, en de nieuwe Mijnschacht/HavermoutmelkSystem cooldowns) zodat HUD ze kan tonen

### Files
- Modified: `src/core/Game.ts` (build-ghost fix, placement aura preview, exitBuildMode cleanup, cooldown fields op alle click-actions, per-frame cooldown refresh)
- Modified: `src/ui/HUD.ts` (BuildingCardAction velden, render-time + tick-time cooldown overlay)
- Modified: `play/index.html` (`.bcard-action-cd-overlay` CSS, `.is-active-buff` styling)
- Modified: `src/systems/BureaucracySystem.ts` (export BOARDROOM_COOLDOWN)

1567 tests blijven groen.

## [0.48.0] - 2026-04-29 — Multi-functie + Polish bundle

### Added — Mijnschacht 2 click-actions (Limburg)
`src/systems/MijnschachtSystem.ts`:
- **Ploegendienst** — 30 kolen → +50% Limburg gather rate voor 60s, 90s CD. Wired in `GatherSystem` via `getLimburgGatherMult()`. Stack multiplicatief met andere mults.
- **Drukvuur** — 50 kolen → tunnel-transit ×0.5 voor 30s, 90s CD. Wired in `UndergroundSystem` via `getLimburgTunnelTransitMult()`. Stack met Geheime Gangen upgrade.
- HUD-knoppen op Mijnschacht (Limburg TertiaryResource) selectie. Hotkeys T/Y. CommandActions `activate-ploegendienst` + `activate-drukvuur`.
- 11 vitest cases (`tests/MijnschachtSystem.test.ts`).

### Added — Chocolaterie passive (Belgen)
`src/systems/ChocolaterieSystem.ts`:
- **Pralines voor Iedereen** — per 100 chocolade in voorraad: +5% duration op alle Belgen-diplomacy-effecten (Compromis Abilities + Persuasion). Cap +25% bij 500+ voorraad.
- Wired in `DiplomacySystem.activateCompromis` (Compromis duration) en `attemptPersuade` (Persuasion duration). Stack additief met Salon-protocol cost-discount uit FactionSpecial1Passives.
- Geen tick-state — pure derived helper. 4 vitest cases.

### Added — FactionSpecial2 sight-range passive (alle 4 facties)
`src/systems/FactionSpecial2Passives.ts`:
- **Gewricht-uitstraling** — per active FactionSpecial2 building (Feestzaal/Parkeergarage/Mijnwerkerskamp/EU-Parlement): +1 sight range voor ALLE friendly units van die factie. Cap +3 per factie.
- Cached counts per UPDATE_INTERVAL=1s. `VisionSystem` leest `getFactionSpecial2SightBonus(factionId)` en stamps de extended radius — geen per-unit Visibility.range mutatie.

### Added — Heal-aura visual ring
`src/rendering/AuraRingRenderer.ts`:
- Translucente groene ring op de grond rond geselecteerde heal-aura source. RingGeometry met BORDER_WIDTH=0.4u, scale-per-call zodat verschillende aura-grootes (Worstenbroodjeskraam 8u, Vlaaiwinkel 10u) dezelfde mesh hergebruiken.
- Game.ts wire: bij select Brabant Worstenbroodjeskraam → 8u ring. Bij select Limburg Vlaaiwinkel → 10u ring. Hide bij andere selecties of unit-selectie.

### Added — TIER_REQUIREMENT_LABELS factie-aware
`src/ui/factionBuildMenus.ts`:
- Nieuwe `getTierRequirementLabel(faction, tier)` — Brabant ziet "Wagenbouwer", Randstad "Innovatie Lab", Limburg "Hoogoven", Belgen "Diamantslijperij" voor T3 (i.p.v. generieke "Geavanceerde Smederij").
- T2-labels ook factie-specifiek (Smederij/Coworking Space/Klooster/Abdij-smederij).
- HUD-tooltip op locked build-buttons gebruikt nu de factie-specifieke label.

### Added — Multi-stat split victory screen
- `play/index.html`: stat-rows voor "Goud" + "Hout" apart i.p.v. samengevoegd "Verzameld" (oude stat-row hidden behouden voor backward-compat van GameStats.resourcesGathered consumers).
- `GameStats` uitgebreid met `goldGathered` + `woodGathered`. `Game.ts` levert beide bij `showGameOver`.

### Files
- Added: `src/systems/MijnschachtSystem.ts`, `src/systems/ChocolaterieSystem.ts`, `src/systems/FactionSpecial2Passives.ts`, `src/rendering/AuraRingRenderer.ts`
- Added: `tests/MijnschachtSystem.test.ts`, `tests/ChocolaterieSystem.test.ts`
- Modified: `src/systems/SystemPipeline.ts` (registratie 2 nieuwe systems)
- Modified: `src/systems/GatherSystem.ts` (Limburg mult)
- Modified: `src/systems/UndergroundSystem.ts` (Drukvuur transit mult)
- Modified: `src/systems/DiplomacySystem.ts` (Pralines duration mult op Compromis + Persuasion)
- Modified: `src/systems/VisionSystem.ts` (FactionSpecial2 sight bonus)
- Modified: `src/ui/HUD.ts` (CommandAction types, getTierRequirementLabel call, multi-stat fields)
- Modified: `src/ui/factionBuildMenus.ts` (FACTION_TIER_LABELS map + helper)
- Modified: `src/core/Game.ts` (Mijnschacht actions in enrichBuildingInfo, dispatch+tryActivate, AuraRingRenderer, multi-stat output)
- Modified: `play/index.html` (Goud/Hout stat-rows)
- Modified: `package.json`, `CHANGELOG.md`

### Tests
1567 tests groen (was 1554 + 13 nieuwe).

## [0.47.0] - 2026-04-29 — Faction-painted building & upgrade portraits

### Added — 84 painted-vignette portraits, factie-flavoured
Volledige factie-pass: elke factie heeft nu 11 unieke building-portraits + 10 unieke upgrade-portrait variants in de RPG card-art stijl. Wegwerken van de canvas-drawn fallback (hoek-icoon op building-card) en de generieke wapens/armor-iconen die in de research-panel stonden — deze waren voorheen identiek over alle facties.

**Per factie 21 portretten** (11 buildings + 10 upgrades = 84 totaal, ~$2.52 fal.ai Flux Dev):
- **Brabanders** (warm oranje-rood, Bourgondisch kruis, gezellig-strijdlustig): keep, café-barracks, bakkerij-lumber, smederij, boerderij-housing, worstenbroodjeskraam, wagenbouwer, feestzaal, kerktoren, tractorschuur, beek-bridge + 10 melee/ranged/armor/move-speed upgrade-variants
- **Randstad** (corporate, blue-grey-white + warm yellow desk-lamp, GEEN koffie-flavour): hoofdkantoor, vergaderzaal, Starbucks-cafe (NO logo), coworkingspace, vinex-rijhuis, havermoutmelkbar, innovatie-lab, parkeergarage, kantoor-toren, sloopwerf, viaduct + 10 corporate-flavoured upgrade-variants (fountain pen, KPI suit, etc.)
- **Limburgers** (mergel yellow-tan + coal-black + cherry-red vlaai): mergelhoeve, schuttershal, vlaaibakkerij, klooster-smederij, mergel-huuske, vlaai-stand, hoogoven, mijnwerkerskamp, mergel-watchtower, mijnkar-werkplaats, stenen-bridge + 10 mining/vlaai-flavoured upgrades (pickaxe, mergel-armor, cherry-stone slingshot)
- **Belgen** (zwart-geel-rood + chocolate-brown + Trappist-green): stadhuis, frituur-barracks, hoeve, abdij-smederij, rijhuis, chocolaterie, diamantslijperij, EU-Parlement (abstracte cocardes — geen echte EU-vlag), belfort, manneken-pis-kanon, kanaalbrug + 10 frieten/diamond/lion-flavoured upgrades

### Refactored — Faction-aware portrait helpers
- `src/data/portraitMap.ts`:
  - Nieuwe `getBuildingPortraitUrl(factionId, buildingTypeId)` → `<faction>-<building>.png` pad of null
  - Nieuwe `getFactionSlug(factionId)` voor cross-module gebruik
  - `FACTION_SLUGS` + `BUILDING_SLUGS` maps centraliseren naming-conventie
- `src/ui/UpgradePortraits.ts`:
  - `getUpgradeImagePath(id, factionId?)` factie-aware
  - `FACTION_FLAVOURED_UPGRADES` set whitelist'd welke generic upgrades factie-variants hebben
  - Factie-specifieke upgrades (Carnavalsvuur, AIOptimization, Mergelharnas, etc.) blijven hun unieke single asset
- `src/ui/HUD.ts`:
  - `factionSlugToId()` helper converteert string-slug → FactionId
  - `showBuildingCard` + `showBuildingPanel` proberen painted PNG eerst, fallback naar canvas-drawn `BuildingPortraits.ts` bij `img.onerror`
  - `createCommandButton` voor `build-*` actions toont factie-painted icon eerst (ipv generieke cmd-th/cmd-brk/etc), valt terug op generic painted, dan canvas, dan SVG, dan tekst
  - Research panel (createResearchBtn) geeft `currentFaction` mee aan getUpgradeImagePath

### Wired
- Building-card top-left portrait: nu painted (bv. EU-Parlement toont de gegenereerde Belgische parlement-painting i.p.v. de canvas-drawn icoon)
- Build-menu cmd-buttons: nu factie-painted (Brabant ziet brabant-keep, Randstad ziet glass-tower, etc.)
- Research panel research-buttons: factie-painted upgrade-variants (Brabantse longsword vs Randstad fountain pen vs Limburg pickaxe vs Belgian rapier voor "Zwaardvechten I")

### Files
- Added: 44 building-portraits + 40 upgrade-variants in `public/assets/portraits/{buildings,upgrades}/`
- Added: 4 batch-manifests (`_brabant-v047-batch.json`, `_randstad-v047-batch.json`, etc.)
- Modified: `src/data/portraitMap.ts` (+ FACTION_SLUGS, BUILDING_SLUGS, getBuildingPortraitUrl, getFactionSlug)
- Modified: `src/ui/UpgradePortraits.ts` (factionId param + FACTION_FLAVOURED_UPGRADES)
- Modified: `src/ui/HUD.ts` (factionSlugToId helper, factie-painted PNG-first in 3 callsites)

### Tests
1554 tests groen — geen regressions. Refactor is backward-compatible: helpers met factionId ongedefinieerd geven generic pad, oude callers blijven werken.

## [0.46.0] - 2026-04-29 — Battle visuals + complete HUD asset pass

### Added — Attack swing animation
`UnitRenderer.triggerAttackSwing(eid, isRanged)` — procedurele forward-lean (melee, peak +0.32rad) of recoil (ranged, peak −0.18rad) op de attacker model.rotation.x. Triangular curve (0→peak in 40%, peak→0 in 60%) over `ATTACK_SWING_DURATION = 0.28s`. Stacks bovenop GLB animation clips; auto-clears wanneer geen swing actief is. Driver: combat-hit event-listener in `Game.ts` roept `triggerAttackSwing(event.attackerEid, event.isRanged)` aan na particle/audio. 2 vitest-cases voor API-contract.

### Added — Floating damage numbers
Nieuwe `src/ui/DamagePopups.ts` — pool van 50 DOM-elements die boven units zweven met "-15" tekst. Pool-grootte voorkomt DOM-explosie bij 200+ units in combat (recycled oudste actieve slot bij vol). World→screen projectie via `RTSCamera.worldToScreen` per frame, fade-up curve 0→60px omhoog over 1.0s, opacity ease-out in laatste 30%. Spawn voor zowel units als gebouwen wanneer Health.current daalt — driver hangt al in `Game.detectDamageFlash`. CSS in `hud.css` met crit/heal data-kind variants (gold-glow voor crit, groen voor heal). 6 vitest-cases dekken pool-bound, kind-attribuut, lifetime-recycle.

### Added — Death animation collapse + fade
`UnitRenderer.applyDeathTween` — animated units krijgen scale-Y collapse 100%→30% over de 2s DEATH_TIMER, met opacity-fade in de laatste 30%. Werkt naast bestaande GLB Death-clip (stacking). Blob-shadow vervaagt mee. `AnimatedUnit.baseScaleY` cached zodat respawn/visibility-wisselen geen scale-bleed geeft. `Game.syncRenderPositions` exposed `deathProgress` per unit (DeathTimer.elapsed / DEATH_TIMER) op data, die UnitRenderer.update doorgeeft naar updateAnimatedUnit.

### Added — Volledige HUD-asset pass: 23 painted-vignette icons
On-brand referentie: `cmd-rally.png` + `cmd-vlaai-trakteer.png` (oil-painting, dark vignette, ornate gold curved frame, dramatic chiaroscuro). Alle nieuwe icons matchen deze stijl — eerste batch transparante glyphs (Brabant + Randstad click-actions) is geregenereerd in painted style.

`COMMAND_ICON_IMAGES` in `HUD.ts` uitgebreid + `createCommandButton` switcht naar PNG-first (canvas-drawn building portraits blijven fallback):

- **6 click-actions** — OPT (Carnavalsoptocht), WBR (Trakteerronde), SPR (Sprint Mode), DDL (Deadline Crunch), CEO (Kwartaalcijfers), VLT (Vlaai-Trakteer)
- **4 combat verbs** — MOV, ATK, STP, HLD (vervangen SVG-fallback)
- **4 FactionSpecial1 passive aura badges** — CRN (Carnavalstent +damage aura), BRD (Boardroom efficiency-cap), VLA (Vlaaiwinkel heal-pulse), DPL (Diplomatiek Salon Persuasion-discount)
- **10 build-menu icons** — TH (TownHall), BRK (Barracks), LMB (LumberCamp), BSM (Blacksmith), HSE (Housing), TWR (DefenseTower), SP1 (FactionSpecial1), SP2/ADV (FactionSpecial2), SWK (SiegeWorkshop), TRT (TertiaryResource). Generic cross-factie — factie-flavour zit in label-tekst.

### Added — 16 ontbrekende upgrade-portraits
Vier Asset Generator subagents parallel (één per factie) genereerden de 16 ontbrekende portretten die `UpgradePortraits.ts` al mapped maar waar geen PNG voor bestond:
- **Brabant**: gezelligheids-boost, carnavalsrage, brabantse-vlijt, samen-sterk
- **Randstad**: efficiency-consultant, agile, powerpoint-mastery, vergadering-protocol
- **Limburg**: diepe-schacht, mergel-pantsering, vlaai-motivatie, mijnbouwexplosief
- **Belgen**: praline-productie, belgische-verzetskracht, trappist-brouwerij, fritenvet-fundering

Stijl matcht bestaande set (painted RPG card-art, gold curved frame, factie-vignette). Manifests per factie in `public/assets/portraits/_<faction>-batch.json`. Totaal 39 nieuwe + 5 geregenereerde assets, ~$1.42 fal.ai.

### Why
Pre-v0.46.0 was gameplay solide maar visueel "stil" — geen feedback op damage of dood. Voor crowdfunding-pitch en eerste-indruk is visuele combat-impact essentieel. Asset-pipeline en hit-flash waren al klaar (DAMAGE_FLASH_COLOR, spawnCombatHit, spawnDeathEffect), missing waren de drie items hierboven plus de 16 portretten waar UpgradePortraits.ts naar verwees.

### Tests
- `tests/DamagePopups.test.ts` (6 cases) — pool grootte, kind-attribuut, lifetime, recycle-cap.
- `tests/UnitRenderer-attack-swing.test.ts` (2 cases) — triggerAttackSwing API + decay.
- Volledige suite: 1554 tests groen (was 1546 + 8).

### Files
- Added: `src/ui/DamagePopups.ts`, `tests/DamagePopups.test.ts`, `tests/UnitRenderer-attack-swing.test.ts`
- Added: 16 upgrade-portraits + 24 command-icons + 8 batch-manifests in `public/assets/`
- Modified: `src/core/Game.ts` (damagePopups field/init, detectDamageFlash spawn-call, syncRenderPositions deathProgress + popup update, triggerAttackSwing in combat-hit listener)
- Modified: `src/rendering/UnitRenderer.ts` (deathProgress in update signature, applyDeathTween, setAnimatedUnitOpacity, AnimatedUnit.baseScaleY, attackSwingTimers + triggerAttackSwing API + procedural rotation in updateAnimatedUnit)
- Modified: `src/ui/HUD.ts` (COMMAND_ICON_IMAGES uitgebreid met 24 nieuwe keys, createCommandButton PNG-first)
- Modified: `src/ui/hud.css` (`.damage-popup-layer`, `.damage-popup`, kind-variants)

## [0.45.1] - 2026-04-29 — docs: updates-page sync v0.41.0 → v0.45.0

### Updated — `public/updates/index.html`
6 nieuwe entries (newest-first): v0.45.0 (Defense alarm), v0.44.0 (Building-card UI uniform), v0.43.0 (Town Halls + info-row CSS), v0.42.0 (FactionSpecial1 second-functies), v0.41.1 (UI fix), v0.41.0 (Carnavalsoptocht). Bestaande tag-classes hergebruikt (`tag--feat` / `tag--fix` / `tag--gameplay` / `tag--ui`). Datum 2026-04-29 op alle 6 entries.

### Notes
- Geen code-changes, alleen docs.
- Voorbereidende commit voor sessie-end. Volgende sessie: zie `project_rob_next_session_plan.md` (memory) — aanbeveling v0.46.0 Battle/damage animaties of polish-bundle alternatief.

## [0.45.0] - 2026-04-29 — Defense alarm: nearby idle defenders retaliate automatisch

### Added — `triggerNearbyDefense` in CombatSystem
Live-feedback Richard 2026-04-29: "het defense mechanism van de troops nu niet optimaal te functioneren als je aangevallen wordt in skirmish". Pre-v0.45.0 retaliation triggerde alleen voor de DIRECT geraakte unit — nearby idle defenders deden niets, speler moest manueel selecteren+commanden.

Fix: bij ELKE damage-resolution scant het systeem nearby friendly combat-units (binnen `ALARM_RADIUS` = 12u) en switcht ze automatisch naar Attacking met de aggressor als target.

### Rules (anti-thrash + anti-stampede)
- **Workers blijven gathering**: `IsWorker` units worden overgeslagen — te kwetsbaar om in te springen, plus gameplay-flow blijft intact.
- **HoldPosition respect**: HoldPosition stance preserved; enkel `targetEid` wordt gezet zodat `processHoldPosition` next tick op de aggressor schiet (geen state-switch, geen movement).
- **Already-Attacking niet gestoord**: units die al een ander target hebben switchen niet (no thrash).
- **Cap `ALARM_MAX` = 5**: max 5 defenders alerted per damage-event. Voorkomt dat één pijl de hele base op één scout laat stormen.
- **Niet-combat skip**: `Attack.damage <= 0` (rare non-combat units) worden overgeslagen.
- **Dead/Stunned skip**: vanzelfsprekend.
- **Enemy faction skip**: alleen units met dezelfde `Faction.id` als de victim.

### Triggers
Aangeroepen in beide combat-paths in `CombatSystem`:
1. Idle/Attacking-state damage resolution (regel ~261).
2. HoldPosition fire-path damage resolution (regel ~456).

Wanneer een building OF unit damage neemt, alarm wordt afgevuurd.

### Added — tests (+9)
- **`tests/CombatSystem-defense-alarm.test.ts`** dekt: alarm switch + target-acquire, ALARM_RADIUS edge (binnen/buiten), worker-skip, enemy-faction-skip, already-Attacking no-thrash, HoldPosition state-preserve+target-set, ALARM_MAX cap, dead-skip, non-combat-skip.

### Notes
- Test-suite: 1537 → 1546 (+9).
- Backlog: visual indicator voor alarm-trigger (groene pulse op victim, rode pulse op aggressor) — kandidaat voor v0.46.0 battle-animations bundel.

## [0.44.0] - 2026-04-29 — Building-card UI uniform pass: research-panel nu binnen building-card

### Changed — `#cmd-blacksmith` is nu een DOM-child van `#building-card`
Live-feedback Richard 2026-04-29: Coworking Space / Starbucks / Boardroom toonden research-cards als drijvend panel boven het building-card kastje (vooral bij Blacksmith / LumberCamp / UpgradeBuilding). Inconsistent met Barracks waar alle actie-knoppen netjes binnen de card zitten.

- **`play/index.html`**: `<div id="cmd-blacksmith">` verplaatst van top-level command-panel-zone naar binnen `<div id="building-card">` (na `bcard-actions`). Modifier-class `bcard-research-panel` toegevoegd voor nested-styling.
- **CSS-override**: `#building-card .bcard-research-panel { position: static; transform: none; left/right/bottom: auto; width: auto; max-width: none; box-shadow: none; border: none; border-top: 1px solid …; border-radius: 0 0 10px 10px; background: rgba(15,12,8,0.6); }` — disable't de drijvende absolute-positioning, geeft het panel een onderste-sectie look.
- **Research-card-grid**: `grid-template-columns: repeat(3, 88px)` → `repeat(3, 1fr)` zodat de grid de full card-width benut. Padding aligned met `bcard-actions` (8px 12px 10px).
- **Verwijderd**: oude regel `#building-card:not([hidden]) ~ #cmd-blacksmith { bottom: 230px; }` — niet meer nodig nu het nested zit.

### Visual impact
Speler ziet nu één samenhangend building-card paneel met:
- Header (icon + faction)
- HP + status
- Action-grid (Barracks-style)
- Research-grid (LumberCamp / Blacksmith / UpgradeBuilding only)

Geen 2 losse drijvende blokken meer. Look-and-feel matcht v1.0 perfectie regel.

### Added — tests (+4)
- **`tests/building-card-research-panel-nested.test.ts`** — source-level invariants: `#cmd-blacksmith` zit binnen `#building-card`, modifier-class aanwezig, geen tweede instance, CSS-override regel met `position: static` aanwezig. Voorkomt regressie naar drijvend panel.

### Notes
- Test-suite: 1533 → 1537 (+4).
- Resterende UI-uniformity items (info-row icon-styling fine-tuning, drijvende sub-panels for non-research building-types als die komen) staan in BACKLOG.

## [0.43.0] - 2026-04-29 — Town Halls bouwbaar + info-row CSS overlap fix

### Added — TownHall buildable feature
Live-feedback Richard 2026-04-29: "we moeten ook zorgen dat we de town halls zelf ook kunnen bouwen, voor als de gold mines opdrogen". Voor v0.43.0 was TownHall alleen start-spawn.

- **`build-townhall`** action toegevoegd aan alle 4 facties (`factionBuildMenus.ts`), hotkey **H**, tier 1 (always available — vereist alleen worker selectie).
- Factie-aware labels: Brabant "Hoofdkantoor" / Randstad "Hoofdkantoor" / Limburg "Mergelhoeve" / Belgen "Stadhuis".
- Build-mode cost: **400 gold + 250 hout** (override op archetype 0/0 dat alleen voor start-spawn geldt). Constants: `TOWNHALL_BUILD_GOLD` / `TOWNHALL_BUILD_WOOD` in `world/buildingCost.ts`.
- `getBuildingCost(BuildingTypeId.TownHall)` heeft een special-case voor TH dat ervoor zorgt dat de archetype-cost (0/0 voor start-spawn) niet onbedoeld als build-cost wordt gebruikt.
- Strategisch: nieuwe TownHall geeft toegang tot expansion mining-clusters wanneer de startbase opdroogt. Cost-balance: 400g+250h is duur genoeg om strategisch te zijn, niet spammable.

### Fixed — info-row CSS icon-overlap
- **Build-card info-row** (FactionSpecial1 passive descriptions toegevoegd in v0.41.0) toonde icon-tekst (BRD/CRN) overlappend met label-tekst — `.bcard-action-icon` erfde `position: absolute` van standaard button-styling waardoor het icon over de label heen werd gerendered.
- Fix: `.bcard-action-btn--info .bcard-action-icon` krijgt expliciet `position: static`, een vaste 28×22px box met dark background-tint, gecenterd icon-letter. Plus `.bcard-action-btn--info .bcard-action-label` ook `position: static` om overerving te resetten.

### Added — tests (+10)
- **`tests/buildingCost.test.ts`** uitgebreid met TownHall override-tests (cost lookup, gold-insufficient gate, wood-insufficient gate, 400/250 charge deducts both). Plus skip-clause in bestaande "wood=0" test (TownHall is uitzondering).
- **`tests/build-townhall-menu.test.ts`** (nieuw) — per-factie hotkey-H entry, factie-aware labels (≥3 unique), hotkey-H uniqueness per factie.

### Changed
- `Game.getBuildingTypeIdForGhost` mapt `'townhall'` → `BuildingTypeId.TownHall` (was niet in de switch — fall-through naar Barracks).
- `Game` switch-case dispatch heeft `case 'build-townhall'` met `enterBuildMode('townhall')`.

### Notes
- Test-suite: 1523 → 1533 (+10).
- Backlog uitgebreid met 5 P1/P2 items uit live-feedback: building-card UI uniformity (Coworking/Starbucks/Boardroom layouts inconsistent met Barracks), Randstad Barracks mesh visueel te similar aan Town Hall, defense mechanism in skirmish niet optimaal, battle/damage animaties drastisch verbeteren, in-game messages factie-audit.

## [0.42.0] - 2026-04-29 — FactionSpecial1 second-functies (Randstad/Limburg/Belgen) + Salon-protocol cost-discount

Sluit de v1.0 perfectie multi-functie audit voor FactionSpecial1 af. Brabant Carnavalstent kreeg z'n second-functie in v0.41.0 (Carnavalsoptocht); deze release voegt de symmetrische second-functies toe voor de overige drie facties. Per `feedback_v1_perfection_multi_function`.

### Added — `FactionSpecial1Passives.ts`

| Factie | Building | Existing | Toegevoegd in v0.42.0 |
|--------|----------|----------|------------------------|
| Randstad | Boardroom | Click Kwartaalcijfers (+50% production 30s) | **Corporate Synergy** passive — per actief Boardroom +1 efficiency-stack-cap. Cap +3 (BUREAUCRACY_MAX_STACKS 20 → 23 max). |
| Limburg | Vlaaiwinkel | Heal aura (+10HP/5s in 10u) | **Vlaai-Trakteerronde** click — kost 100 Kolen → 30s alle Vlaaiwinkels heal-interval halveert (5s → 2.5s). 90s cooldown. Hotkey T. |
| Belgen | Diplomatiek Salon | Diplomats / Persuasion | **Salon-protocol** passive — per Salon -10% Persuasion-cost (Chocolade), cap -30% (3 Salons). |

### Changed — system integration
- **`SystemPipeline.ts`** — `FactionSpecial1PassivesSystem` toegevoegd (faction-phase 4.809). Caches Boardroom + Salon counts elke 1.0s; ticked Vlaai-Trakteer buff every-frame.
- **`PlayerState.addEfficiencyStack`** — gebruikt nu `extraStackCapProvider` (default 0). FactionSpecial1Passives zet de provider naar `getCorporateSynergyExtraCap` bij module-load (setter-pattern voorkomt circular import).
- **`DiplomacySystem.ts`** — Persuasion-cost berekend als `Math.ceil(PERSUASION_COST × getSalonProtocolCostMult())`.
- **`VlaaiwinkelSystem.ts`** — `effectiveInterval = UPDATE_INTERVAL × getVlaaiwinkelIntervalMult()`. Tijdens Vlaai-Trakteer is interval 2.5s ipv 5s.
- **`Game.ts`** — `tryActivateVlaaiTrakteer` handler + Vlaaiwinkel building-card click-action (hotkey T). Reset-hook in `endMatch`.

### Updated — building-card info-rows
Eerder generieke labels nu accuraat:
- Randstad Boardroom info-row: "Passive: per Boardroom +1 efficiency-cap (max +3)" (was placeholder "Click-buff: Kwartaalcijfers (zie hieronder)").
- Belgen Diplomatiek Salon info-row: "Passive: per Salon -10% Persuasion-cost (cap -30%)" (was placeholder).

### Added — tests (+17)
- **`tests/FactionSpecial1Passives.test.ts`** dekt: Boardroom-count caching, Corporate Synergy linear+cap, factie-isolation, PlayerState stack-cap extension, Salon-count + cost-mult linear+cap, Vlaai-Trakteer ready-state, cost-gating, interval-halving, expire+cooldown, reset.

### Notes
- Test-suite: 1506 → 1523 (+17).
- v1.0 perfectie multi-functie status: alle 4 FactionSpecial1's hebben nu 2-functies, alle 4 UpgradeBuildings hebben passive aura, alle 4 TertiaryResources hebben unique mechanics. Volgende: FactionSpecial2 audit (4 gebouwen produceren Heavy/Hero zonder unique mechanics) — kandidaat voor v0.43.0.

## [0.41.1] - 2026-04-29 — UI fix: info-row layout + button-label truncation

### Fixed
- **Info-row** in FactionSpecial1 building-cards rendered als 300px-vierkant met giant CRN-portret in het midden (kreeg `aspect-ratio: 1` + `min-height: 52px` van standaard `.bcard-action-btn`). Nu compact horizontale rij: icon links, label rechts, height auto.
  - CSS-overrides: `aspect-ratio: auto`, `min-height: 0`, `flex-direction: row`, `padding: 6px 8px`.
- **Button-labels** afgekapt op smalle 3-kolom grid (~80px per cell). Verkort:
  - `Carnavalsoptocht (75 Gez)` → `Optocht (75g)`
  - `Trakteerronde (50 Gez)` → `Trakteer (50g)`
  - `Sprint Mode (30h)` → `Sprint (30h)`
  - `Deadline Crunch (50h)` → `Crunch (50h)`
  - `Activeer Kwartaalcijfers` → `Kwartaalcijfers`
- Active/cooldown labels ingekort: `Optocht actief (28s)` → `Actief 28s`, `cooldown (45s)` → `CD 45s`.

## [0.41.0] - 2026-04-28 — Carnavalsoptocht (Brabant click) + FactionSpecial1 info-display rows

### Added — `CarnavalsoptochtSystem.ts`
Live-feedback Richard 2026-04-28 (na v0.40.0): "Bij de carnavalstent zie ik geen mogelijke upgrades / functies". Carnavalstent had alleen passive +20% damage aura (Bundle 3), geen click-action zichtbaar in building-card.

- **Carnavalsoptocht** click-action — kost 75 Gezelligheid → 30s alle Brabant units +25% movement speed (parade-effect). 90s cooldown. Hotkey T op Carnavalstent-selectie. Stapelt multiplicatief met Trakteerronde (Worstenbroodjeskraam): max 1.20 × 1.25 = 1.50.

### Added — FactionSpecial1 passive info-display rows
Op alle 4 FactionSpecial1 building-cards (Carnavalstent / Boardroom / Vlaaiwinkel / Diplomatiek Salon) staat nu een non-clickable info-row die de huidige passive uitlegt. Voorkomt herhaling van "ik zie geen functies" voor de andere 3 facties.

- Brabant Carnavalstent: "Aura: +20% schade Brabant-eenheden in 12u radius"
- Randstad Boardroom: "Click-buff: Kwartaalcijfers (zie hieronder)"
- Limburg Vlaaiwinkel: "Aura: +10 HP/5s heal Limburg-eenheden in 10u radius"
- Belgen Diplomatiek Salon: "Diplomatie: passief +1 diplomaat per 10s, click voor Persuasion"

### Changed
- **`HUD.BuildingCardAction`** — `isInfo?: boolean` veld toegevoegd. Info-rows worden gerenderd als `disabled` button met `bcard-action-btn--info` class.
- **`play/index.html`** — CSS toegevoegd voor `.bcard-action-btn--info` (full-row span, left-aligned label, geen hotkey-display, eigen background-tint).
- **`CommandAction`** type uitgebreid met `'noop-info'` + `'activate-carnavalsoptocht'`.
- **`MovementSystem.ts`** — `effectiveSpeed *= getCarnavalsoptochtSpeedMult(factionId)`.
- **`SystemPipeline.ts`** — `CarnavalsoptochtSystem` toegevoegd in faction-phase (4.808).
- **`Game.ts`** — `tryActivateCarnavalsoptocht` handler + reset-hook in `endMatch`.

### Added — tests (+7)
- **`tests/CarnavalsoptochtSystem.test.ts`** — ready-state, cost-gating, factie-isolation (alleen Brabant), expiration timer, cooldown-block, reset.

### Notes
- Test-suite: 1499 → 1506 (+7).
- Voor v0.42.0: resterende second-functies (Boardroom passive, Vlaaiwinkel click "Vlaai-Trakteerronde", Diplomatiek Salon passive). Per BACKLOG.md.

## [0.40.0] - 2026-04-28 — v1.0 perfectie milestone: UpgradeBuilding passives × 4 + versioning-policy + updates-page sync

### Versioning policy reset
Vóór deze release: alles op patch-counter (0.37.0 → 0.37.41) inclusief grote feature-bundels. Vanaf nu strikt SemVer:
- **MINOR** voor features / nieuwe gameplay-mechanieken / bundel-werk.
- **PATCH** alleen voor pure bug-fixes.
- **MAJOR** voor v1.0 / breaking changes / save-format wijzigingen.

Per `feedback_versioning_policy.md`. v0.37.41 had MINOR moeten zijn — vandaar de jump naar v0.40.0 als duidelijke milestone-marker (0.38 en 0.39 overgeslagen om de verandering visueel te markeren).

### Added — `UpgradeBuildingPassivesSystem.ts` (4 passieve auras, één per factie)
Per v1.0 perfectie regel (`feedback_v1_perfection_multi_function`): elk specialty-gebouw heeft 2-3 functies. UpgradeBuildings hadden alleen "research panel + T3 gate" — deze release voegt een unieke passieve aura per factie toe.

| Factie | Naam | Effect |
|--------|------|--------|
| Brabant | **Wagenbouwerij** | Per actieve Wagenbouwer: +0.3 Gezelligheid/sec direct in voorraad. |
| Randstad | **Innovatie Boost** | Per actief Innovatie Lab: alle Randstad units +5% movement speed (gestapeld, cap +20%). |
| Limburg | **Kolenrook** | Limburg units binnen 10u radius van een Hoogoven: +1 armor (gestapeld, cap +3). |
| Belgen | **Geslepen Wapens** | Belgen units binnen 8u radius van een Diamantslijperij: +5% crit chance (gestapeld, cap +15%). 10× crit-multiplier. Stapelt met Diamantgloeiende-research. |

### Changed — system integration
- **`SystemPipeline.ts`** — `UpgradeBuildingPassivesSystem` toegevoegd in faction-phase (4.807) na WorstenbroodjeskraamSystem. Caches counts + posities elke 1.0s.
- **`MovementSystem.ts`** — `effectiveSpeed *= getInnovatieBoostSpeedMult(factionId)` (Randstad-only).
- **`CombatSystem.ts`** — `targetArmor` in beide combat-paths (idle-attack + hold-position) bevat nu `getKolenrookArmorAt(...)`. Nieuwe `tryGeslepenWapensCrit(eid, dmg, target)` na Diamantgloeiende-crit.
- **`Game.ts`** — `resetUpgradeBuildingPassives()` aangeroepen in `endMatch()`.

### Added — tests (+22)
- **`tests/UpgradeBuildingPassivesSystem.test.ts`** dekt: per factie aparte describe-block met cache-correctness, scaling-linear, cap-clamp, radius-edge cases, factie-isolation, throttle-gedrag, reset.

### Updated — public/updates/index.html
- 7 nieuwe entries (v0.37.36 t/m v0.40.0) toegevoegd via Asset Generator-loze general-purpose agent. Inclusief model-viewer cards voor de Bundle 5 + 4A meshes.
- **Pre-existing CSS-issue gesignaleerd**: `tag--ui` wordt in oudere entries (v0.37.34/33) gebruikt maar is niet in de CSS-block gedefinieerd → silent no-style. Niet gefixt deze patch (out of scope).

### Notes
- Test-suite: 1477 → 1499 (+22).
- Geen save-format changes — runtime-only nieuwe systeem-state, default 0.

## [0.37.41] - 2026-04-28 — Bundel 4 finale: Worstenbroodjeskraam GLB + per-gebouw smoke UAT (4B) + mesh-audit Resolved (4C)

### Added — 12e Meshy v6 GLB (asset-generator agent, parallel run)
- **`public/assets/concepts/buildings/brabant-tertiary.png`** (698KB) — isometrisch concept-art, kraampje met rood-wit luifeltje, worstenbroodjes op counter, oranje-rood-geel carnaval-palet. First-try via Bundle 5 prompt-template (12/12 cumulatief first-try).
- **`public/assets/models/v02/brabanders/worstenbroodjeskraam.glb`** (7.9MB) — Meshy v6 production image-to-3D, 486s, first-try, geen retries.
- **`BuildingRenderer.ts`** — `tertiary_0` flipped van `lumbercamp.glb` fallback naar dedicated `worstenbroodjeskraam.glb`. Brabant heeft nu 11/11 unieke GLBs (was 10).

### Added — Bundle 4B per-gebouw smoke UAT (general-purpose agent)
- **`tests/per-building-smoke.test.ts`** — 177 tests (4 facties × 11 building-types × 3-4 invariants + 5 sanity-checks). Voor elke (factie × type) combinatie:
  1. `getDisplayBuildingName` returns nooit `'Gebouw'` fallback (factionData of FACTION_BUILDING_NAME_FALLBACKS)
  2. `BUILDING_MODEL_PATHS[\`${typeKey}_${factionId}\`]` is gedefinieerd en eindigt op `.glb`
  3. GLB-bestand bestaat fysiek op disk
  4. Build-menu entry bestaat (TownHall uitgesloten — start-spawn)
- Dekt regressie waarbij een toekomstige refactor een (type × factie) combinatie zou kunnen vergeten.

### Changed — `BuildingRenderer-mesh-uniqueness.test.ts`
- Brabanders-test geüpdatet van "10 unique paths (tertiary_0 still maps to lumbercamp until Bundle 4A)" naar "11 unique paths (Bundle 4A v0.37.41 — Worstenbroodjeskraam dedicated)".

### Resolved — Bundel 4C (mesh-audit)
- **`.claude/plans/BACKLOG.md`** — "12-GLB visuele dubbele-meshes" item gemarkeerd als ✅ Resolved (Bundel 5 leverde 11, Bundel 4A integratie levert de 12e). Test-lock: `tests/BuildingRenderer-mesh-uniqueness.test.ts`.

### Notes
- Test-suite: 1300 → 1477 (+177).
- Geen runtime/gameplay-changes — pure asset + test toevoeging.
- Brabant heeft nu visueel volledig unieke building-line-up.

## [0.37.40] - 2026-04-28 — Bundel 4A: Brabant Worstenbroodjeskraam (TertiaryResource archetype + 3 functies)

### Added — archetype + build menu
- **`factionData.ts`** — Brabant TertiaryResourceBuilding archetype (Worstenbroodjeskraam): HP 450, 150g + 100h, 30s build, sight 8.
- **`factionBuildMenus.ts`** — Brabant X-hotkey ingevuld met `build-tertiary` (label "Worstenbroodjeskraam", tier 2). Was eerder bewust leeg ("Gezelligheid is proximity-based") — Bundel 4A vult de slot in met een gebouw dat zowel basis-Gez genereert als proximity-effecten heeft.

### Added — `WorstenbroodjeskraamSystem.ts` (3 concurrent functies)
- **Passive Gez flux** — per voltooide kraam +0.5 Gezelligheid/sec (1.0s tick interval, los van GezeligheidSystem proximity-mechaniek).
- **Trakteerronde** (click-action) — kost 50 Gezelligheid → 30s window waarin alle Brabant units +20% movement speed krijgen. 90s cooldown. Hotkey T op kraam-selection.
- **Heal-aura** (passive) — Brabant units binnen 8u radius van een complete kraam regenereren +0.5 HP/sec. Niet-stapelend (eerste kraam-in-radius wint). Niet voor non-Brabant units.

### Changed — system integration
- **`MovementSystem.ts`** — `effectiveSpeed *= getTrakteerrondeSpeedMult(factionId)` (Brabant units only).
- **`SystemPipeline.ts`** — `WorstenbroodjeskraamSystem` toegevoegd in faction-phase (4.806) na HavermoutmelkSystem.
- **`Game.ts`** — building-card action "Trakteerronde" voor Brabant TertiaryResource selection. `tryActivateTrakteerronde` handler. `resetWorstenbroodjeskraamBuffs` aangeroepen in endMatch.

### Added — tests (+18, +1 updated)
- **`tests/WorstenbroodjeskraamSystem.test.ts`** dekt: Gez-flux per kraam (lineair, complete-only, factie-specifiek, throttle-gedrag), Trakteerronde (cost gating, factie-isolation, expiration, cooldown), heal-aura (radius, full-HP no-overheal, no-stack, non-Brabant skip, max-clamp), reset.
- **`tests/factionBuildMenus.test.ts`** — bestaande "Brabanders skipt X" test omgezet naar "Brabanders X = Worstenbroodjeskraam"; "tier 2 uniform" nu ook over Brabant heen.

### Notes
- Test-suite: 1282 → 1300 (+18).
- Brabant heeft nu alle 11 building-types werkend.

## [0.37.39] - 2026-04-28 — Bug #1a: Randstad Havermoutmelkbar — 3 concurrent functies + naming consistency

### Added — `HavermoutmelkSystem.ts`
Randstad TertiaryResource (Havermoutmelkbar) krijgt drie functies, allemaal alleen actief voor FactionId.Randstad. Per `feedback_v1_perfection_multi_function.md`: voor v1.0 kiezen we voor diepgang ipv minimal-change.

- **Sprint Mode** (click-action) — 30 havermoutmelk → 60s window: +20% gather rate (alle Randstad gatherers) en +20% production speed (alle Randstad gebouwen). 90s cooldown. Stapelt multiplicatief met Boardroom (Bundle 3): 1.20 × 1.50 = 1.80x speed kortstondig haalbaar. Hotkey T.
- **Deadline Crunch** (click-action) — 50 havermoutmelk → 30s window: +50% movement speed voor Randstad workers (Stagiairs, niet Barista's — namen-correctie). 90s cooldown. Hotkey Y.
- **Stagiairsleger** (passive) — per 100 havermoutmelk in voorraad krijgen Randstad gatherers +5% gather rate, cap +25% (op 500+ voorraad). Multiplicatief met Sprint Mode: 1.20 × 1.25 = 1.50 max.

### Changed — system integration
- **`GatherSystem.ts:harvest`** — `effectiveRate *= getRandstadGatherMult(factionId)` (Sprint × Stagiairsleger combined).
- **`ProductionSystem.ts:processBuilding`** — extra `sprintMod` factor naast bureaucracy/ceo/aiOpt/boardroom.
- **`MovementSystem.ts`** — workers (`IsWorker` tag): `effectiveSpeed *= getDeadlineCrunchSpeedMult(factionId)`.
- **`SystemPipeline.ts`** — `HavermoutmelkSystem` toegevoegd in faction-phase (4.805) na BureaucracySystem en vóór UndergroundSystem.
- **`Game.ts`** — building-card actions voor Havermoutmelkbar (Sprint Mode + Deadline Crunch buttons). HUD.BuildingAction-type uitgebreid.

### Fixed — Randstad naming consistency
- **`factionData.ts:1661-1663`** Randstad wood-upgrade overrides hernoemd: "Latte Capacity" → "Grotere Laptoptas", "Cold Brew Bonus" → "Powerpoint Pro", "Caffeine Kick" → "Sprint Velocity". Plus alle "Barista's" referenties → "Stagiairs". Live-namen waren al "Stagiair" (worker), upgrade-flavour was nog koffie-thema. Per `feedback_randstad_stagiair_naming.md`.

### Added — tests (+21)
- **`tests/HavermoutmelkSystem.test.ts`** dekt:
  - Sprint Mode: ready-state, gating op cost+cooldown, activation+cost-spend, expiration timer, production-mod isolation per factie.
  - Deadline Crunch: ready-state, cost-gating, +50% worker speed Randstad-only, expire+cooldown reactivation.
  - Stagiairsleger: 0/100/200/250 voorraad → 0/1/2/2 stacks, cap op MAX_STACKS, voorraad-derived (spending verlaagt direct).
  - Combined: 1.0 baseline, voorraad-only 1.10, full-stack Sprint 1.50, exact SPRINT_GATHER_MULT na cost-spend zonder bonus.
  - Reset: resetHavermoutmelkBuffs zeroes alles.

### Backlog
- `.claude/plans/BACKLOG.md` aangevuld met "🌟 v1.0 PERFECTIE — multi-functie audit per gebouw" sectie. Per gebouw status (✅ /⚠️ /🚫) en concrete kandidaten per factie. Geschat 6-8 toekomstige bundels voor volledige multi-functie roll-out.

### Notes
- Test-suite: 1261 → 1282 (+21).
- Namen-correctie cascade: bestaande `LumberCampUpgrades.test.ts:282` aangepast van "Latte Capacity" → "Grotere Laptoptas".

## [0.37.38] - 2026-04-28 — Bug #3: end-match "Verzameld" stat tracking

### Fixed
- **Game.stats.resourcesGathered** werd geïnitialiseerd op 0 maar nooit geïncrementeerd → victory screen toonde altijd "Goud 0" ongeacht hoeveel grondstoffen verzameld waren (live-bug Richard 2026-04-28 na 9:54 Randstad-skirmish-win).
- **`PlayerState`** — toegevoegd: `goldGathered` + `woodGathered` cumulative counters per factie + `recordGoldGathered` / `recordWoodGathered` API + `getGoldGathered` / `getWoodGathered` getters.
- **`GatherSystem.depositSystem`** — gebruikt nu `recordGoldGathered`/`recordWoodGathered` ipv `addGold`/`addWood` zodat refunds (CommandSystem cancel-build) en mission-grants (Game.startMission) NIET ten onrechte als "verzameld" tellen.
- **`Game.endMatch`** — leest nu `playerState.getGoldGathered + getWoodGathered` ipv het stale `stats.resourcesGathered` veld.
- **`play/index.html`** — stat-row label hernoemd "Goud" → "Verzameld" (de stat is gold + wood combined; "Goud" was misleidend).

### Added — tests (+7)
- **`tests/GatherSystem-stat-tracking.test.ts`** — gold-deposit increments goldGathered (niet woodGathered), wood-deposit andersom, accumulatie over meerdere drop-offs, refund-via-addGold telt NIET, per-factie isolatie, reset() zeroes.

### Notes
- Test-suite: 1254 → 1261 (+7).
- Geen behaviour-change voor save/load (alleen nieuwe runtime-velden, default 0).

## [0.37.37] - 2026-04-28 — Bug #2: building labels via factionData single source of truth

### Fixed
- **`Game.getBuildingLabel`** — verwijderde een hardcoded `factionLabels: Record<number, Record<string, string>>` mapping van 4×11 entries die onafhankelijk van `factionData.ts` werd onderhouden. Negen labels waren gedrift t.o.v. canon (Boardroom→"Starbucks HQ", Carnavalstent→"Dorpsweide", Diplomatiek Salon→"Chocolaterie" (dubbel), Hoogoven→"Geavanceerde Mijn", Vlaaiwinkel→"Mijnschacht", e.a.). Nu één regel: `getDisplayBuildingName(playerFactionId, getBuildingTypeIdForGhost(ghostType))`. Schendt niet langer `feedback_factiondata_single_source.md`.

### Added — tests (+3)
- **`tests/Game-getBuildingLabel-uses-factionData.test.ts`** — source-level invariants: assert dat `getBuildingLabel` `getDisplayBuildingName` aanroept, geen `factionLabels` table herintroduceert, en geen van de 12 oude foute labels bevat. Voorkomt regressie naar parallel-table.

### Notes
- Test-suite: 1251 → 1254 (+3).
- HUD "Bouw: X" indicator + ghost-mode label tonen nu altijd de canonical naam uit `factionData.FACTION_BUILDINGS` of `FACTION_BUILDING_NAME_FALLBACKS`.

## [0.37.36] - 2026-04-28 — Bundel 5: 11 dedicated Meshy v6 GLBs (visuele dubbele-meshes opgeruimd)

### Added (11 unieke GLBs — generated via Meshy v6 image-to-3D)
- **TertiaryResource** (3) — `randstad/tertiary.glb` (havermoutmelkbar), `limburgers/tertiary.glb` (mijnschacht), `belgen/tertiary.glb` (chocolaterie). Brabant uitgesloten — komt in Bundel 4A met Worstenbroodjeskraam-archetype.
- **UpgradeBuilding** (4) — `brabanders/upgrade.glb` (wagenbouwer), `randstad/upgrade.glb` (innovatie lab), `limburgers/upgrade.glb` (hoogoven), `belgen/upgrade.glb` (diamantslijperij).
- **FactionSpecial1** (4) — `brabanders/special1.glb` (carnavalstent), `randstad/special1.glb` (boardroom), `limburgers/special1.glb` (vlaaiwinkel), `belgen/special1.glb` (diplomatiek salon).
- **Pipeline**: 1024×1024 isometric concept-art (Flux Dev + BiRefNet remove-bg) → Meshy v6 image-to-3D production. Concept-art-cost ~$0.33, totale GLB-batch ~13 productie-calls.

### Changed
- **`BuildingRenderer.ts`**: 11 paths in `BUILDING_MODEL_PATHS` geflipt van `lumbercamp.glb`/`blacksmith.glb` fallback naar dedicated `tertiary.glb`/`upgrade.glb`/`special1.glb`. V01 fallback (Safari path) ongemoeid.
- **`BUILDING_MODEL_PATHS`** is nu `export`ed (was module-private) zodat tests over de mesh-mapping kunnen asserten.

### Added — tests (+99)
- **`tests/BuildingRenderer-mesh-uniqueness.test.ts`** — 99 assertions: per-faction unique-paths counts (Brabant 10 / overige 11), cross-faction path-isolation, Bundle 5 wired-slot correctness, fs-existence van elke V02 GLB op disk, en complete (type × faction) coverage. Voorkomt regressies waar fallback-paths sluipenderwijs terugkeren.

### Fixed
- **`scripts/generate_bundle5b.sh`**: data_uri (base64 PNG) gaat nu via tmp-file naar python3 ipv argv. Loste `Argument list too long` af voor PNGs > ~750KB (belgen-tertiary 822KB, belgen-upgrade 793KB faalden eerst).

### Notes
- Test-suite: 1152 → 1251 (+99).
- 12-GLB visuele dubbele-meshes backlog → Resolved (op Brabant tertiary na — Bundel 4A).
- Volgende: Bundel 4 (Brabant Worstenbroodjeskraam archetype + per-gebouw smoke UAT).

## [0.37.35] - 2026-04-28 — Bundel 3: 4 FactionSpecial1 systems (Carnavalstent / Boardroom / Vlaaiwinkel / Diplomatiek Salon)

### Added (4 archetypes — eerste FactionSpecial1 implementatie)
- **Brabant Carnavalstent** — `factionData.ts`: HP 600, 200g+150h, 35s build, sight 9. Tier 2.
- **Randstad Boardroom** — HP 700, 250g+200h, 40s build, sight 10.
- **Limburg Vlaaiwinkel** — HP 700, 200g+150h, 35s build, sight 9.
- **Belgen Diplomatiek Salon** — HP 650, 225g+175h, 40s build, sight 9.
- **`factionBuildMenus.ts`**: 4× nieuwe `'build-faction1'` entry met hotkey **V** (tier 2). Hotkey-mapping uniform over facties (per repo-regel).

### Added (4 effect-systems)
- **Carnavalstent (Brabant aura)** — `GezeligheidSystem.ts` extension: per Brabander unit binnen 12u² (=144) van een complete Carnavalstent → `attackMult *= 1.20`. Multiplicatief stack op Carnavalsvuur (1.10 × 1.20 = 1.32) en tier-bonus. Niet-stapelend tussen meerdere tents (break-after-first).
- **Boardroom (Randstad CEO Kwartaalcijfers)** — `BureaucracySystem.ts`: nieuwe `boardroomBuff = { active, remaining, cooldown }` module-state + `activateBoardroom()` / `isBoardroomReady()` API. `tickBoardroom(dt)` runt voor werkoverleg-cycle. **30s active, 120s cooldown, +50% production speed (duration *= 0.667)**. Click-actie via building-card "Activeer Kwartaalcijfers" knop op Randstad FactionSpecial1, hotkey T. ProductionSystem.processBuilding krijgt 5e duration-factor `boardroomMod` naast bureaucracy/ceo-hero/aiOpt.
- **VlaaiwinkelSystem (Limburg heal)** — nieuwe file `src/systems/VlaaiwinkelSystem.ts`. Pipeline-phase `'combat'` na CombatSystem (heal mag damage same-tick reverten). 5s throttle via accumulator. Per Limburger unit binnen 10u² (=100) van een complete Vlaaiwinkel: +10 HP × aantal Vlaaiwinkels in radius (stacks). HP geclamped op max.
- **DiplomatiekSalonSystem (Belgen random-event)** — nieuwe file `src/systems/DiplomatiekSalonSystem.ts`. Pipeline-phase `'faction'`. Per complete Belgen Salon: 90s cooldown timer in module-scope Map (cleanup voor recycled eids). Bij timer=0 → `Math.random()` outcome:
  - `< 0.33` → `'chocolade'`: +50 tertiary
  - `< 0.66` → `'resources'`: +200 gold + 100 wood
  - `≥ 0.66` → `'spawn'`: 1 free Belgen Worker bij Salon-positie
  - Emits `'diplomatiek-event'` met `{outcome, x, z, eid}` voor HUD/audio-laag.
  - Reset cooldown 90s. Verse spawn start met 90s cooldown (geen instant-payout exploit).

### Added (UI)
- **Selection-handler in Game.ts**: `BuildingTypeId.FactionSpecial1` branch — toont building-card (geen training-actions; Boardroom-button conditional op Randstad).
- **`activate-boardroom`** CommandAction + `tryActivateBoardroom()` handler.
- **`'diplomatiek-event'`** + `DiplomatiekEventEvent` interface in GameEvents.

### Added (assets)
- **4 building-portraits** door Asset Generator (Flux Dev, RPG card-art template met building-interior variant). Files in `public/assets/portraits/buildings/`. 4-voor-4 success-rate. Visueel sterkst: Boardroom (cinematische glazen tafel + skyline) en Vlaaiwinkel (cozy painterly met houten vlaaikast).

### Tests (+32, 1120 → 1152)
- `tests/Bundel3-Carnavalstent.test.ts` (+6): aura applies/no-aura/incomplete/factie-lock/non-stack/Carnavalsvuur-stack
- `tests/Bundel3-Boardroom.test.ts` (+8): state machine (initial/activate/double-fire/30s-tick/120s-ready/snapshot) + ProductionSystem integration (Randstad faster than baseline; Brabanders unaffected)
- `tests/VlaaiwinkelSystem.test.ts` (+8): heal/no-heal/factie-lock/stack/clamp/throttle/incomplete/empty
- `tests/DiplomatiekSalonSystem.test.ts` (+10): timer-cycles/3 outcomes/event-payload/factie-lock/incomplete/2-salons-independent

### Notes
- **Stack-tracking**: 5 multiplicatieve duration-mods op ProductionSystem nu: `bureaucracyMod * ceoBuff * aiOptMod * boardroomMod`. Werkt cumulatief — Boardroom + AI Optimization actief = +50% × +20% = ~80% snellere productie voor Randstad.
- **Boardroom click-target**: hotkey T staat per-card (geen globale binding) — voorkomt conflict met `train-hero-0` op Barracks.
- **Diplomatiek Salon trappist→chocolade**: outcome-naam aligned met factionData (Belgen tertiary = Chocolade). Lore-note: "trappist" was werknaam in plan-spec.
- **Pipeline phases**: VlaaiwinkelSystem in 'combat' (na CombatSystem heal-revert), DiplomatiekSalonSystem in 'faction'. Geen breaking changes voor andere systems.
- **Backlog opportunities** (zie BACKLOG.md): GLB-models voor 4 FactionSpecial1 (nu lumbercamp.glb fallback) — voor Bundel 5 Meshy-marathon. Per-factie portrait-mapping in BuildingPortraits.ts (huidige fallback toont "TH"/"BRK" abbrevs).

## [0.37.34] - 2026-04-28 — Bundel 2.5: ActionCard refactor — research-panels nu in Barracks-stijl

### Added (UI unify — research-panels match Barracks card-look)
- **`src/ui/UpgradePortraits.ts`** — `UpgradeId` → image filename map. Resolves `/assets/portraits/upgrades/<key>.png`.
- **`HUD.renderResearchCard`** — vervangt de oude inline list-render. Card-stijl met:
  - Portrait-image (256x256 PNG, painted RPG card-art) als fill-background, `<img onerror>` fallback naar generieke SVG icon zodat panel niet breekt als image ontbreekt.
  - Cost-badge top-left (`gXg` of `OK` voor researched).
  - Label bottom met dark-gradient overlay.
  - **Locked state** (canResearch=false): greyout (filter grayscale 0.85 + brightness 0.55), rood "X"-badge centraal, `is-locked` class. **Niet meer hidden** — speler ziet wat er straks beschikbaar wordt + tooltip met prereq-naam ("Vereist: Zwaardvechten II + UpgradeBuilding voltooid").
  - **Researched state**: groene border + accent op cost-badge.
- **`Game.buildUpgradeRow`** + **`getPrereqText`** helpers — single source of truth voor de upgrade-row constructie naar de HUD. Prereq-tekst combineert prerequisite-name + UpgradeBuilding-flag.
- **`Game.isObsoleteT1`** — verbergt T1 zodra T2 (zelfde categorie) onderzocht is. Houdt Smederij-paneel onder 6 buttons zonder informatie te verliezen (T1-effect blijft actief, alleen UI-slot vrijgemaakt).

### Added (assets — Asset Generator parallel batch)
- **18 upgrade-portraits** gegenereerd via fal.ai Flux Dev (1024×1024, RPG card-art met groen-zwart vignette + goud frame). Stijl-template gevalideerd 18/18 op eerste poging.
- Bestanden in `public/assets/portraits/upgrades/`: 7 Blacksmith universal + 3 LumberCamp wood + 4 T3 universal + 4 faction-unique. Manifest in `assets-generated.json`.

### Changed
- **`HUD.showBlacksmithPanel`** signature uitgebreid: per upgrade optional `prereqText?: string`. State-key bevat nu prereq-text zodat lock-text wijziging een rebuild forceert.
- **CSS in `play/index.html`**: vervangen oude `.cmd-btn--research` row-stijl door `.research-card-grid` (3-col) + `.bcard-action-btn--research` (88×88 cards). Locked-overlay + researched-glow toegevoegd. `.command-panel--blacksmith` is nu column-flex i.p.v. wrap-flex.

### Tests (+1, 1119 → 1120)
- Update `tests/HUD-blacksmith-panel.test.ts`: locked-research test herzien — buttons zijn niet meer hidden maar `disabled + .is-locked` met prereq-tooltip in `title`. Plus nieuwe test: researched-state shows `OK` cost-text en `.is-researched` class.

### Notes
- Geen breaking change in API: `showBlacksmithPanel` werkt zonder `prereqText` (optional veld). Game.ts geeft het door, maar bestaande tests die zonder gaven werken nog.
- DOM-id `cmd-blacksmith` blijft (mutex tussen Blacksmith/LumberCamp/UpgradeBuilding panels).
- T1-hide-when-T2-done is *visueel-only* — de upgrade blijft researched in TechTreeSystem-state, alleen het slot in de UI verdwijnt.

## [0.37.33] - 2026-04-28 — Bundel 2: UpgradeBuilding research + Watchtower UX + Housing toast

### Added (Bundel 2A — UpgradeBuilding research-pakket)
- **8 nieuwe `UpgradeId`** in `src/types/index.ts`:
  - **T3 universal** (50-53): MeleeAttack3 / RangedAttack3 / ArmorUpgrade3 / MoveSpeed2 — alle prereq T2, alle 350-400g/45-55s.
  - **Faction-unique** (14/24/34/44): Carnavalsvuur (Brabant aura) / AIOptimization (Randstad +20% production) / Mergelharnas (Limburg Heavy +3 armor) / DiamantgloeiendeWapens (Belgen 5% crit voor 10x dmg) — alle 500g/60s, geen prereq.
  - **`requiresUpgradeBuilding: true`** op alle 8 — vereist een complete UpgradeBuilding (Wagenbouwer/Innovatie Lab/Hoogoven/Diamantslijperij).
- **`UpgradeDefinition` interface**: 4 optional velden (`requiresUpgradeBuilding`, `bonusDamageFraction`, `bonusCritChance`, `bonusProductionSpeedFraction`).
- **`getUpgradeDefinition` Map-refactor**: `UPGRADE_DEFINITION_MAP` (was sparse-array lookup) — non-contiguous IDs (14/24/34/44/50-53) werkten niet meer met array-index, throws bij onbekende ID.
- **`canResearch(factionId, upgradeId, world?)` + `startResearch(..., world?)`** — optional `world` param. Zonder `world` faalt de UpgradeBuilding-gate gesloten (defense-in-depth). Nieuwe private `hasCompleteUpgradeBuilding` helper.
- **4 effect-system implementaties** zonder nieuwe SystemPipeline-add (alle extend bestaande systems):
  - **Carnavalsvuur** — `GezeligheidSystem` aura-pass na tier-loop: Brabant-units binnen 8u van complete TownHall krijgen `attackMult *= 1.10`.
  - **AI Optimization** — `ProductionSystem.processBuilding` 4e duration-factor `1/1.20` voor Randstad bij researched.
  - **Mergelharnas** — ZERO nieuwe code: bestaande `affectsUnitTypes=[Heavy]` + `bonusArmor: 3` filter werkt out-of-box. Stack additief met ArmorUpgrade1+2+3.
  - **Diamantgloeiende Wapens** — `CombatSystem` `tryDiamantgloeiendeWapensCrit` helper toegepast in `processAttacking` én `processHoldPosition`. 5% Math.random() roll → 10x damage + nieuw `combat-crit` event.
- **`Game.showUpgradeBuildingResearchUI`** + selection-branch + per-frame refresh-branch in `Game.ts`. Hergebruikt `HUD.showBlacksmithPanel` als generieke render. Helpers `BLACKSMITH_UPGRADE_IDS` set + `upgradeBuildingResearchIds(factionId)` — strikte panel-partitie.

### Added (Bundel 2B — Watchtower UX)
- **`TowerRangeRenderer`** (`src/rendering/TowerRangeRenderer.ts`): translucent oranje ring (RingGeometry, opacity 0.28) op grond rond geselecteerde DefenseTower. Toont op selection, verbergt bij deselect of selectie van ander gebouw-type.
- **`TOWER_RANGE` / `TOWER_DAMAGE` / `TOWER_ATTACK_SPEED`** geëxporteerd uit `TowerSystem.ts` voor display.
- **`BuildingCardData.stats`** (range/dps/armor) + **`BuildingCardData.infoText`** velden. DefenseTower krijgt status `'Patrouilleert — schiet automatisch op vijanden'` + stats-grid (Bereik/DPS/Bepantsering).
- **`HUD.renderBuildingCardExtras`** rendert stats + info-text onder de status-line. Container reset bij elke card-show.

### Added (Bundel 2C — Housing populatie-toast)
- **Toast bij Housing-completion**: `eventBus.on('building-placed')` listener detecteert `buildingTypeId === Housing` en player-faction → `hud.showAlert('Boerenhoeve klaar — populatie-cap +10 (cur/max)', 'info')`.
- **Building card info-text** voor Housing: `'Biedt +10 populatie-cap'` onder de status-line.

### Tests (+27, 1092 → 1119)
- `tests/UpgradeBuildingResearch.test.ts` (+22): definitions × 5, canResearch gate × 8, retroactive effects × 4, duplicate-research × 2, Map-lookup × 3.
- `tests/research-panel-id-separation.test.ts` (+3 herwerkt → +6): partitie-lock voor 4 panel-sets (Blacksmith=7 / LumberCamp=3 / UpgradeBuilding T3=4 / faction-unique=4) — geen overlap, alle 18 IDs gemapt.
- `tests/HousingCompletionToast.test.ts` (+2): building-placed event-shape, toast-text composition.
- Update `tests/TechTreeSystem-research-lifecycle.test.ts:81`: length 10 → 18.

### Notes
- **Geen archetype-werk** voor UpgradeBuilding: de 4 facties hebben al Wagenbouwer/Innovatie Lab/Hoogoven/Diamantslijperij data + hotkey C in `factionBuildMenus.ts`.
- **DiamantgloeiendeWapens crit** gebruikt `Math.random()` — binnen bestaande conventie (Game.ts/ProductionSystem). Niet seeded; OK voor PoC.
- **Mergelharnas** demonstreert dat het bestaande `affectsUnitTypes` + `bonusArmor` pattern flexibel genoeg is om nieuwe faction-unique armor-bonuses te dekken zonder code-uitbreiding.
- Backlog-items uit deze sessie: TowerSystem sniper-bonus tegen ranged units (plan noemt dit, ontbreekt in code), 3D mouseover-tooltip-pattern, Housing-display-name per-factie test, construction-timer in status-text. Zie `.claude/plans/BACKLOG.md`.

## [0.37.32] - 2026-04-28 — P1 hotfix: wood-upgrades lekten in Blacksmith-paneel

### Fixed (P1, Richard hands-on report v0.37.31)
- **Blacksmith-paneel toonde 9 buttons inclusief Houtdraagkracht I/II + Snelle Kap** (vaak als "OK" omdat al voltooid via LumberCamp). Wood-upgrades horen exclusief op het LumberCamp-paneel.
- **Root cause**: `Game.showBlacksmithResearchUI` mapte heel `UPGRADE_DEFINITIONS` (10 entries) zonder filter. LumberCamp-paneel filterde wel op de 3 wood-IDs.
- **Fix**: Blacksmith filtert nu op niet-wood IDs (combat/armor/speed 0-6). LumberCamp blijft op de 3 wood-IDs (7,8,9). Strikte partitie.

### Tests (+4, 1088 → 1092)
- `tests/research-panel-id-separation.test.ts`:
  - UPGRADE_DEFINITIONS partition: elke id is OF combat OF wood.
  - Blacksmith-filter levert exact 7 combat-upgrades.
  - LumberCamp-set levert exact 3 wood-upgrades.
  - Geen overlap tussen combat- en wood-id sets.

## [0.37.31] - 2026-04-28 — P0 hotfix: research-paneel klik werkte STILL niet op v0.37.30

### Fixed (P0, Richard hands-on report 5 min na v0.37.30 deploy)
- **Latte Capacity / Caffeine Kick / alle Blacksmith-buttons reageerden nog steeds niet** ondanks v0.37.30 event-delegation fix.
- **Diepere root cause**: bij per-frame rebuild verschillen `mousedown.target` en `mouseup.target` (oude vs nieuwe DOM-button-instance, beide met `data-research-id`). De browser dispatch het `click` event dan op de **gemeenschappelijke ancestor** (= het panel zelf), niet op de button. `target.closest('button[data-research-id]')` op het panel retourneert `null` → handler exits early → silent.
- **Fix**: state-key diff op upgrades (id/name/cost/canResearch/canAfford/isResearched/researchProgress.name). Per-frame call met identieke key skipt rebuild — buttons blijven dezelfde DOM-nodes → mousedown en mouseup vinden plaats op zelfde element → click fires correct → delegation handler werkt. Progress-bar fill + remaining-time worden inline ge-update zonder rebuild.
- **`hideBlacksmithPanel()`** reset state-key zodat een ander gebouw (bv. switch Blacksmith → LumberCamp) altijd een full rebuild krijgt.

### Tests (+3, 1085 → 1088)
- `tests/HUD-blacksmith-panel.test.ts`:
  - state-key skip: tweede call met identieke state behoudt button DOM-instance.
  - state-change rebuild: canAfford flip → button.disabled flip.
  - progress-bar inline update: zelfde DOM-node, alleen `style.width` muteert.

### Notes
- Symptoom verklaart waarom Bundel 1 vitest-tests groen waren maar live klik dood: vitest's `btn.click()` fired direct op de button (geen mousedown/mouseup race), terwijl de browser de target-divergence detecteert. De nieuwe state-key tests vangen dit nu wel: ze controleren dat de button-INSTANCE behouden blijft, wat de race vooraf elimineert.

## [0.37.30] - 2026-04-28 — Bundel 1: Blacksmith click-fix + LumberCamp wood-upgrades

### Fixed (P0, Richard hands-on report v0.37.29)
- **Blacksmith research-knoppen reageerden niet op clicks.** Root cause: `Game.ts:2981` riep `showBlacksmithResearchUI` elke frame aan zolang een Blacksmith geselecteerd was. Die deed `panel.innerHTML = ''` → buttons + per-button addEventListener werden iedere frame vernietigd en hercreëerd. Browsers fire `'click'` alleen wanneer mousedown + mouseup op hetzelfde DOM-element plaatsvinden — tussendoor was het element al vervangen, dus geen click.
- **Fix**: event delegation. Eén `'click'` listener op `#cmd-blacksmith` parent (overleeft `innerHTML=''` want parent zelf wordt niet verwijderd), buttons krijgen `data-research-id` attribute, callback wordt in `this.blacksmithOnResearch` instance-var bewaard zodat re-renders de nieuwste callback gebruiken.

### Added (LumberCamp wood-upgrades — 3 universele upgrades + per-factie naming)
- **3 nieuwe `UpgradeId`** in `src/types/index.ts`:
  - `WoodCarry1=7` — werkers dragen +5 hout per trip (100g, 30s, geen prereq).
  - `WoodCarry2=8` — nog +5 hout, stapelt (175g, 45s, vereist WoodCarry1).
  - `WoodGather=9` — verzamelen 25% sneller (200g, 40s, geen prereq).
- **`Gatherer` component**: 2 nieuwe Float32Array velden (`carryBonus`, `gatherSpeedMult`). Factories initialiseren `carryBonus=0` en `gatherSpeedMult=1` op alle 3 worker-spawn-paden (Float32Array-zero zou `gatherSpeedMult=0` betekenen → harvest×0 bug; expliciete init + GatherSystem `>0` guard).
- **`UpgradeDefinition` interface**: 2 optional velden (`bonusCarry?`, `bonusGatherSpeedFraction?`).
- **`TechTreeSystem.applyUpgradeToEntity`**: 2 nieuwe branches voor carry/gather mods. `affectsUnitTypes=[UnitTypeId.Worker]` guard verzekert non-Workers ongewijzigd blijven.
- **`GatherSystem.processGathering`**: leest `gatherSpeedMult` voor effective rate, `carryBonus` voor effective capacity.
- **`getDisplayUpgradeName(factionId, upgradeId)`** in `factionData.ts` — pattern parallel aan `getDisplayBuildingName`. Per-factie overrides 3 upgrades × 4 facties: Brabanders (Stevigere Manden / Volkoren Brood / Snellere Bakker), Randstad (Latte Capacity / Cold Brew Bonus / Caffeine Kick), Limburgers (Grotere Vlaai / Suiker-Boost / Snellere Oven), Belgen (XL Patatzak / Mayo-Reserve / Snel Frituren).
- **`Game.showLumberCampResearchUI`** + selection-branch + per-frame refresh-branch in `Game.ts`. Hergebruikt `HUD.showBlacksmithPanel` als generieke render (DOM-mutex op `#cmd-blacksmith`).

### Tests (+26, 1059 → 1085)
- `tests/HUD-blacksmith-panel.test.ts` (+6, jsdom env): click survives per-frame rebuild; latest callback wins; disabled blocks click; locked-research hidden; geen listener-accumulatie.
- `tests/LumberCampUpgrades.test.ts` (+20): 3 definitions × cost/prereq/effect, 3 cost-deduct + research-started events, 3 retroactive-apply, 1 stacking, 3 new-spawn-inherits, 3 non-Worker-isolation, 4 per-faction naming-locks, 1 double-research guard.
- Bestaande `TechTreeSystem-research-lifecycle.test.ts`: `UPGRADE_DEFINITIONS.length` aanname 7 → 10.

### Notes
- HUD.ts staat nu onder jsdom-test → eerste UI-laag coverage in suite.
- Geen breaking change: `bonusCarry` / `bonusGatherSpeedFraction` zijn optional; bestaande upgrades onaangetast.
- `cmd-blacksmith` DOM-id wordt nu gedeeld door Blacksmith én LumberCamp panel (mutex via `hideBlacksmithPanel()` op selection-change, al aanwezig op `Game.ts:1973`).

## [0.37.29] - 2026-04-25 — P1 fix: terrain blanco buitenring op grote skirmish-maps

### Fixed (P1, gemeld door Richard live op v0.37.28)
- **`Terrain.rebuild()` paste alleen `features` aan, nooit de geometry-grootte.** Bij selectie van large skirmish-map (192) bleef de mesh op default 128 staan → buiten ±64 was er geen mesh, geen heightmap, geen vertex colors → bruine "blanco" buitenring waar geen gebouwen geplaatst konden worden, terrain leek bovendien grof omdat de logische placement-coördinaten verder reikten dan de mesh.
- **Fix**: `rebuild(features, mapSize?)` neemt nu een optionele nieuwe mapSize. Bij verandering: dispose oude PlaneGeometry, nieuwe `mapSize × SEGMENTS_PER_UNIT(2)` segments, heightmap/detail/river/road masks resized, water-plane (1.5×) en grid-overlay meegeschaald. `Terrain.mapSize` is nu schrijfbaar (was readonly).
- **`Game.startSkirmishGame`**: geeft `mapSize` mee aan `terrain.rebuild()`.

### Added (regression-class lock, +7 tests, 1052 → 1059)
- `tests/Terrain-rebuild-mapsize.test.ts` (jsdom env via `// @vitest-environment jsdom`):
  - Default mapSize 128.
  - rebuild met 192 → geometry width/height = 192, segments = 384 (2 per unit).
  - rebuild met 80 → geometry 80×80.
  - rebuild zonder mapSize-arg behoudt huidige waarde (backwards-compat).
  - getHeightAt op (-90, -90) is finite na resize naar 192 (was undefined).
  - water plane resized 1.5× mapSize.
- `jsdom` toegevoegd als devDependency voor terrain-tests.

### Notes
- BUG 3 (gebouwen kloppen niet allemaal + functies/upgrades) — dit is een feature-uitbreiding (per-gebouw audit + research/training-implementatie). Wordt apart gepakt in een follow-up sessie.
- Test-suite: 1052 → 1059 (+7, +0.7%).

## [0.37.28] - 2026-04-25 — P1 fix: factie-namen voor T2/T3-gebouwen + Heavy/Siege/Support units

### Fixed (P1, gemeld door Richard live op v0.37.27)
- **`Game.getBuildingName`** had hardcoded mapping voor alleen TownHall/Barracks/LumberCamp/Blacksmith → fallback "Gebouw" voor Housing/DefenseTower/TertiaryResource/UpgradeBuilding/FactionSpecial1/FactionSpecial2/SiegeWorkshop. Nu via `getDisplayBuildingName()` uit factionData met fallback-tabel voor types zonder full archetype.
- **`Game.getUnitNameByType`** had hardcoded mapping voor alleen Worker/Infantry/Ranged → fallback "Unit" voor Heavy/Siege/Support. Nu via `getDisplayUnitName()` uit factionData.
- **`Game.buildBuildingCardData` inline `unitNames`** was uit sync met factionData ("Sloopkogel" vs werkelijke "Vastgoedmakelaar", "Heuvelwacht" vs "Sjpion", "Pralinemaker" vs "Wafelzuster", "CorporateAdvocaat" zonder spatie). Nu ook via `getDisplayUnitName()` — single source of truth.
- **UpgradeBuilding tonen status "Tier 3 ontgrendeld — Bouw nu Feestzaal/Tractorschuur"** zodat speler ziet dat het gebouw functie heeft (research-koppeling is een follow-up).

### Added
- **`getDisplayBuildingName(factionId, typeId)`** in `src/data/factionData.ts` — primary lookup via FACTION_BUILDINGS, fallback naar nieuwe `FACTION_BUILDING_NAME_FALLBACKS` tabel voor types die archetype-data missen (Housing/DefenseTower/TertiaryResource/FactionSpecial1).
- **`getDisplayUnitName(factionId, typeId)`** — delegeert naar `getFactionUnitArchetype`. Gooit als unit-data ontbreekt; caller (Game.ts) vangt via try/catch en fallt terug op "Unit".

### Tests (+75, 977 → 1052)
- `tests/display-names-faction-aware.test.ts` — Voor ALLE 4 facties × 11 building types + 4 facties × 6 unit types: naam mag niet "Gebouw"/"Unit" zijn, moet > 2 chars. Specifieke locks voor UpgradeBuilding/Barracks/Blacksmith/Heavy/Siege/Support per factie zodat factie-naming niet meer kan wegwaaien.

### Notes
- BuildingRenderer 'upgrade' typeId mapt nog naar Blacksmith.glb als visuele fallback (`src/rendering/BuildingRenderer.ts:62-65`). Eigen mesh per factie is een aparte Meshy-job — voor nu krijgt UpgradeBuilding visueel een Smederij-look maar wel de juiste naam.
- Test-suite groei: 977 → 1052 (+75, +7.7%).

## [0.37.27] - 2026-04-25 — P1 fix: ProductionSystem silent-fail voor Heavy/Siege/Support

### Fixed (P1 game-breaker, gemeld door Richard live op v0.37.26)
- **`ProductionSystem.spawnUnit` had alleen UNIT_TEMPLATES voor Worker/Infantry/Ranged.** Voor Heavy/Siege/Support/Special/Hero retourneerde `templates[unitTypeId] = undefined` → silent `return` na resource-deduct → resources verdwenen, geen unit, geen `unit-trained` event. Dit raakte ALLE D-hotkey (Support), A-hotkey (Heavy via FactionSpecial2), en S-hotkey (Siege via SiegeWorkshop) trainings. Heroes (T/Y) gingen via een aparte `trainHero()` flow en bleven werken.
- **Fix**: `spawnUnit` delegeert nu naar `factories.createUnit()` voor types die geen UNIT_TEMPLATE hebben. Dat lost via `getFactionUnitArchetype()` de juiste factionData stats op (HP/attack/range/cost). Worker/Infantry/Ranged behouden de bestaande template-driven path zodat balance en Randstad-overrides intact blijven.

### Added (regression-class lock, +23 tests, 954 → 977)
- `tests/CommandSystem-train-support.test.ts` — Per factie (Brabanders/Randstad/Limburgers/Belgen):
  - **Anchor**: Support archetype data bestaat met juiste namen (Boerinneke, HR-Medewerker, Sjpion, Wafelzuster).
  - **CommandSystem**: queueCommand zet Production.unitType=Support, Production.duration=archetype.buildTime, deducts gold + wood, refuses bij wood-tekort.
  - **ProductionSystem-completion**: Heavy ENESupport ENSiege spawnen via createUnit pad → `unit-trained` event vuurt met juiste payload. Houdt rekening met Randstad bureaucracy slowdown (1.5x dt).

### Notes
- Test-suite groei: 954 → 977 (+23, +2.4%). Volledig groen via gate.
- Randstad heeft een ingebouwde 1.2x productie-slowdown (bureaucracy); dit was geen bug maar genoeg om mijn eerste test-tick te kort te maken — UAT-tests lossen dit op met `buildTime * 1.5 + 1` dt-budget.

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
