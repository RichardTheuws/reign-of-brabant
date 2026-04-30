# Backlog — bevindingen onderweg

Gestart **2026-04-28** tijdens Bundel 1 sessie. Alles wat we *onderweg* tegenkomen
en niet in scope is van de huidige bundel landt hier, gesorteerd op prioriteit.

---

## 🆕 v1.0 PERFECTIE — sessie 2026-04-29 deel 3 (Voice & Message Pass)

### ✅ RESOLVED v0.49.2 — Theme-song "Nie Fokke Mee Brabant" alleen bij Brabander victory
- **Gevonden**: 2026-04-29 (Richard tijdens v0.49.0 fase A)
- **Resolved**: 2026-04-29 commit pending — Music-rewire bundel:
  - `music_brabanders.mp3` was byte-identiek aan themesong `nie-fokke-mee-brabant-v1.mp3` → vervangen door `cinematic/storm-over-low-fields.mp3` (instrumentale ambient, Brabants tintje).
  - `music_victory_brabanders.mp3` toegevoegd (= themesong v2) — speelt alleen bij Brabander victory.
  - `music_brabanders_2.mp3` verwijderd (was duplicate themesong).
  - `MUSIC_IDS.VICTORY_BRABANDERS` toegevoegd, `playVictory(winnerFactionId?)` switch.
  - 2 Game.ts callsites (mission triggerVictory + skirmish triggerGameOver) → playerFactionId.
  - 6 lock-tests in `tests/themeSongVictory.test.ts`. Suite 1596 → 1602.

### ✅ RESOLVED v0.50.0 — Audio-normalisatie pipeline voor 525 voice files
- **Gevonden**: 2026-04-29 (Richard: "audio moet heel goed normaliseren zodat alle zinnen even duidelijk uitgesproken worden")
- **Issue**: voice-clips uit ElevenLabs op verschillende dagen/met verschillende stem-IDs hebben ongelijke loudness en EQ-balance. In-game voelt sommige stem te zacht, andere te scherp.
- **Voorstel**:
  - `scripts/normalize-voices.sh` — batch ffmpeg loudnorm pass over alle `public/assets/audio/voices/{faction}/{unit}/*.mp3`
  - Target: **-16 LUFS integrated, peak max -1 dBTP** (broadcast game-norm)
  - EQ-match: high-pass 80Hz, low-shelf -2dB onder 200Hz, presence-boost +1.5dB bij 3kHz
  - De-essing voor scherpere stemmen (Limburgers Luk had sissen op preview)
  - A/B vergelijking: 3 random clips per factie voor/na, Richard luistert
- **Bundel-fit**: aparte v0.49.x of v0.50.0 polish bundle. Geen content-werk.

### 🟠 P2 — Voice & Message pool-uitbreiding ronde 2 (Warcraft-context-clicks)
- **Gevonden**: 2026-04-29 (na v0.49.0 fase A)
- **Issue**: huidige `factionMessages.ts` pools hebben **1 zin per event**. Saai bij herhaling. Warcraft-flavour vereist 3-5 varianten per event zodat je niet steeds dezelfde zin hoort.
- **Scope**:
  - 5 events × 4 facties × 5 zinnen = **100 nieuwe zinnen**
  - Richard schrijft Brabants zelf (toon-anchor); andere facties via scenario-writer subagent + Richard-keuring
  - ElevenLabs voor audio-versies (we hebben subscription, geen budget-cap meer)
  - Eventueel context-click pattern: 3x klikken op held → 3e zin is grap (Warcraft 3 idiom)
- **Bundel-fit**: v0.50.0 of later, na audio-laag rewire (fase C) en normalisatie.

### ✅ RESOLVED v0.49.1 — Generic SFX → factie-specifieke voice rewire
- **Gevonden**: 2026-04-29 (Richard: "we hebben nog een aantal hele saaie generic sounds")
- **Status**: **IN PROGRESS** sessie 2026-04-29 deel 3.
- **Scope**: `playSound('unit_death' | 'arrow_shoot' | 'arrow_impact' | 'sword_hit' | 'building_complete' | 'building_destroy' | 'gold_deposit' | 'upgrade_complete' | 'select_unit' | 'hero_death' | 'hero_spawn')` callsites in `Game.ts`/`AbilityEffects.ts` → `playUnitVoice(factionId, action, unitTypeId)` waar mogelijk.
- **Discovery in fase A**: 525 voice files staan klaar in `UnitVoices.ts` — generic events maken er nog geen gebruik van.
- **Bundel-fit**: v0.49.1 of v0.49.2.

### 🟢 P3 — Vrouwelijke voice-stemmen Brabanders + Limburgers
- **Gevonden**: 2026-04-29 (asset-inventaris fase A)
- **Issue**: Belgen heeft Petra Vlaams (vrouw, goedgekeurd). Brabanders + Limburgers: vrouwelijke stem-pogingen Roos / Melanie afgekeurd. Voor diversiteit mannelijke + vrouwelijke units per factie nodig.
- **Bundel-fit**: ElevenLabs-casting-ronde, Richard goedkeuring per voice. v0.50.0+.

### 🔒 LOCKED — Voice-cast keuzes (sessie 2026-04-29)
- **Brabanders male**: ✅ **Richard** (`KJMAev3goFD3WOh1hVBT`) — vervangt Joost
- **Brabanders female**: ✅ **Emma natural** (`OlBRrVAItyi00MuGMbna`) — nieuwe stem
- **Limburgers male**: ✅ **Reinoud** (`5tiZStRJQ98Xw420MFFx`, "De nasale limburger") — vervangt Luk
- **Limburgers female**: ✅ **Nick** (`PrYUlaJFEdOSVy6jaEaG`) origineel — geen pitch-shift, "transgender Limburger" framing
- **Belgen female (2e)**: ✅ **Sharon Vlaams** (`g7B5PNoscIXomLNUmHAb`) — naast bestaande Petra
- **Randstad male**: ✅ Serge de Beer (bestaand, blijft)
- **Belgen male**: ✅ Hans Claesen + Walter (bestaand, blijft)

### ✅ RESOLVED v0.50.0 — Voice-pipeline regeneratie (Brabander + Limburgers + Sharon)
- **Resolved**: 2026-04-29 — drie parallel ElevenLabs-agents:
  - **Brabander** (Richard `KJMAev3goFD3WOh1hVBT`): 138 fresh files in echt Zuid-Oost Brabants (geen "-ansen"), `scripts/generate-brabander-voices.sh`
  - **Limburgers** (Reinoud `5tiZStRJQ98Xw420MFFx`): 180 files (140 + 40 nieuwe gather/ready) in Limburgs dialect, `scripts/generate-limburgers-voices.sh`
  - **Belgen Sharon Vlaams** (`g7B5PNoscIXomLNUmHAb`): 20 generic files toegevoegd aan pool, `scripts/generate-belgen-sharon.sh`. UnitVoices.ts `subPoolLines` helper toegevoegd, ge-mixed in random-select via `GENERIC_VOICE_LINES[3]`.
- Backups intact: `voices/brabanders.bak/` + `voices/limburgers.bak/`
- Daarna `scripts/normalize-voices.sh --all` over 722+ files

### ✅ RESOLVED v0.51.0 — Voice-files upload-page MVP LIVE
- Frontend op https://reign-of-brabant.nl/voice-files/ met 7 factie-cards (Brabant + 6 gender-scripts)
- Backend `rob-voices` Docker microservice op M4 port 3110
- Caddy `/voice-uploads/*` route, container restart was nodig voor mount-refresh
- **Status**: MVP werkt voor file-upload-per-factie/gender. Wordt pas inzet bij crowdfunding-launch. Tot dan: feature-paused.

### 🟠 P2 — Voice-files page V2 (PRE-CROWDFUNDING uitbreiding)
- **Trigger**: voor crowdfunding launch. Richard's vrienden moeten dit makkelijk kunnen gebruiken.
- **Uitbreidingen tov MVP**:
  1. **Karakters volledig opsplitsen** — niet 7 cards (factie+gender), maar **32 personage-cards** (8 units × 4 facties; gender-variants als sub-options):
     - Brabant: boer, carnavalvierder, sluiper, tractorrijder, frituurmeester, boerinne, praalwagen, prins-van-brabant
     - Randstad: stagiair, manager, consultant, corporate-advocaat, vastgoedmakelaar, hr-medewerker, influencer, de-ceo
     - Limburg: mijnwerker, schutterij, vlaaienwerper, mergelridder, kolenbrander, sjpion, mijnrat, de-mijnbaas
     - Belgen: frietkraamhouder, bierbouwer, chocolatier, frituurridder, manneken-pis-kanon, wafelzuster, dubbele-spion, de-frietkoning
  2. **Karakter-uitleg per kaart**: korte beschrijving van persoonlijkheid + tone-instructie (bv "Stagiair Randstad — onderdanig, beetje slijmerig, LinkedIn-jargon, onzekere zinnetjes met opvolgende 'trouwens'").
  3. **Voorbeeld in-game audio** — play-button per personage die de huidige in-game stem laat horen (uit `/assets/audio/voices/{faction}/{unit}/select_1.mp3`). Toont "zo klinkt het nu, kan jij het beter?"
  4. **On-screen lines lezen (geen .md download)** — kaart heeft accordion of modal die de 15 regels toont:
     - Per regel: **nummer + tekst + audio-preview-button** (current in-game versie als referentie)
     - Recorder kan zo direct lezen vanaf screen, geen MD-export nodig
  5. **Browser-recording optie** — naast file-upload: `MediaRecorder` API in browser. "Druk Record → lees alle 15 lines met spaties → druk Stop → upload." Geen Voice Memos / QuickTime nodig.
  6. **Per-personage upload** ipv per-factie — submissions zijn al gegroepeerd per character → easier audit
  7. **Anonieme submissions toestaan** — name optional. Privacy-vriendelijker.
- **Implementatie-stappen**:
  - JSON-config `voice-files-characters.json` met alle 32 personages + tone + line-list (genereer uit RECORDING-SCRIPT-*.md)
  - Frontend refactor: card-grid 32 personages, accordion-modal voor lines, MediaRecorder + Audio playback
  - Backend: minor adjustments — accept new character-IDs in submit-endpoint
- **Bundel-fit**: PRE-crowdfunding, ~4-6 uur werk. Aparte v0.6x.0 bundel.

### 🟢 P3 — Splitter robustheid: re-take detection
Inzicht uit Brabander recording (v0.51.0): split-by-spoken-numbers.py gebruikte word.start als boundary, maar bij re-takes ("eenenveertig... vijfenveertig... 45 .. 45") staat de actual word END pas na meerdere number-utterances. 7 slots moesten manual gefixt.
- **Fix**: detecteer consecutive same-number words (re-takes) en gebruik LAATSTE als boundary
- **Fix**: detecteer "honderd X" patterns die GEEN expected number matchen → filter als false-takes uit slot-content
- **Fix**: word.end + 0.20s buffer ipv word.start als take_start basis

### 🔴 P1 — Limburgs female pool via Nick + gender-aware UnitVoices.ts (volgende bundel)
- Nick origineel (`PrYUlaJFEdOSVy6jaEaG`) als Limburgs female gepland (zie 2026-04-29 sessie, "transgender Limburger" framing)
- Vereist gender-mapping in `UnitVoices.ts`:
  - Per UNIT_TYPE een `gender: 'male' | 'female' | 'mixed'` flag (boer = male, boerinne = female, mixed = random pick)
  - Voice-pool selection: `MALE_VOICE_LINES[fid][unit]` vs `FEMALE_VOICE_LINES[fid][unit]`, met fallback
- Genereer ~24 generic Limburgs female files via Nick voor pool
- Optioneel: Brabander female (Emma) + Belgen Sharon ook gender-aware ipv mixed-pool
- **Bundel-fit**: v0.51.0 of dedicated gender-refactor

### ✅ RESOLVED v0.50.1 — Brabander mannelijke voice opnieuw casten
- **Gevonden**: 2026-04-29 (Richard A/B luistertest van voices-normalized-sample/)
- **Issue**: huidige Brabander stem (Joost) klinkt niet enthousiast en heeft geen mooie stemkleur volgens Richard ("ikzelf ook niet"). Gevolg: 138 Brabander voice-files moeten opnieuw worden gegenereerd zodra nieuwe stem is gekozen. Limburgers/Randstad/Belgen voices zijn WEL goedgekeurd.
- **Scope**:
  - ElevenLabs casting-ronde voor nieuwe Brabander mannelijke stem (enthousiast, mooie stemkleur, Brabants accent — voorbeeld referentie nodig: zoek Brabantse stand-up comedians of muziek die de juiste vibe vangt)
  - Richard kiest 2-3 candidates uit ElevenLabs library + custom-voice mogelijk
  - Re-generate alle 138 Brabander voice-lines: `scripts/generate_unit_voices.sh` (bestaat al) met nieuwe voice-id
  - **Volgorde-impact**: dit moet GEBEUREN voordat audio-normalisatie `--all` run zinvol is — anders dubbel werk
- **Bundel-fit**: v0.50.0 of v0.49.x. Wachten op Richard's voice-cast keuze.

### 🟠 P2 — Brabander vrouwelijke voice (Roos afgekeurd, opnieuw casten)
- Richard wil ook Brabander vrouwenstem in pipeline (samen met de Brabander herkast hierboven). Voor 8 unit-types waar Brabander vrouwelijke variant past (boerinne specifiek, plus generieke fallbacks).
- **Bundel-fit**: combineren met Brabander mannelijke recast — dezelfde sessie ElevenLabs-flow.

### ✅ RESOLVED v0.50.0 — Audio-normalize `--all` run uitvoeren na Brabander recast
- Sample-normalisatie heeft Limburgers/Randstad/Belgen goedgekeurd. Brabander wordt opnieuw gegenereerd → normalisatie nu zou dubbel werk zijn.
- Wachten op Brabander-recast voltooiing, dan `bash scripts/normalize-voices.sh --all`.



Iedere entry: **datum-gevonden | tijdens-bundel | status | beknopte beschrijving**.
Bij oppakken: subject + commit-SHA invullen onder "Resolved".

---

## 🌟 v1.0 PERFECTIE — gesignaleerd onderweg (sessie 2026-04-29 deel 2)

### 🔴 P1 — Building-card UI is niet uniform over building-types
- **Gevonden**: 2026-04-29 (Richard live-test na v0.42.0)
- **Issue**: Barracks/Vergaderzaal toont een mooie **3-koloms portrait-grid** met train-actions (Manager/Consultant/HR-Medewerker) + bottom-row research-actions (CEO/Politicus/Rally). Andere gebouwen tonen wildly verschillende layouts:
  - **Coworking Space (Blacksmith)**: research-cards drijven boven het gebouw-kaart-blokje, niet inside the card.
  - **Starbucks (LumberCamp)**: kleine drijvende research-grid bovenop, gebouw-kaart eronder los.
  - **Boardroom (FactionSpecial1)**: info-row text overlapt met icon-letters (BRD overlay) — CSS-bug uit v0.41.0.
- **Doel**: ALLE building-cards uniform layout zoals Barracks: header + HP/status + grid van portrait-action-buttons (train + research + click-buffs + info-rows allemaal in dezelfde grid). Geen drijvende sub-panels meer.
- **Voorstel**: refactor `Game.enrichBuildingInfo` zodat alle action-types via dezelfde array lopen. Research-panel-component en info-row als grid-cells in `bcard-actions`. Deprecate de drijvende research-panel.
- **Bundel-fit**: kandidaat voor v0.43.0 of v0.44.0 — fundamenteel voor v1.0.

### 🔴 P1 — Town Halls niet bouwbaar (gold mine deplete = stuck)
- **Gevonden**: 2026-04-29 (Richard live-test)
- **Issue**: Speler kan geen nieuwe TownHall bouwen. Wanneer alle gold mines opdrogen heb je geen manier om naar een nieuw mining-cluster te expanderen — economy dries up.
- **Voorstel**:
  - `factionBuildMenus.ts`: voeg `build-townhall` action toe aan alle 4 facties (tier 3 of vereist UpgradeBuilding-complete? Of beschikbaar from start?).
  - Cost: 400 gold + 250 hout (RTS-conventie: nieuwe TH duur).
  - Hotkey: B (vrij) of via menu-toggle.
  - PlayerState/PopulationMax behoeft check: meerdere TH's stapelen pop-cap of niet?
- **Bundel-fit**: v0.43.0 — gameplay-blocker.

### 🟠 P2 — Defense mechanism in skirmish niet optimaal
- **Gevonden**: 2026-04-29 (Richard live-test)
- **Issue**: bij aanval op base reageren units niet optimaal — retaliation/idle-defense lijkt te traag of te passief. Test-cases in `CombatSystem-attack-move.test.ts` bestaan, maar live-gedrag voelt niet juist.
- **Onderzoek nodig**: zelf-verdedigingstrigger: damage triggert retaliation alleen als unit `UnitAI.state` == Idle? Anders genegeerd? Hold-position juist gedrag? AI-units detecten threats binnen sight-range automatisch?
- **Bundel-fit**: gameplay-bug, 1-2 dedicated debug-sessies. v0.43.0 of v0.44.0.

### ✅ RESOLVED v0.46.0 — Battle/damage animaties (DamagePopups + death-anim + attack swing)
- **Gevonden**: 2026-04-29 (Richard live-test)
- **Issue**: huidige damage-feedback minimaal: alleen HP-bars, geen visual punch. Voor v1.0 nodig:
  - Hit-flash (rood tint op target-mesh ~0.1s).
  - Damage-popup-numbers (-15 floating text upward).
  - Attack swing-animation (melee: idle → attack → idle clip; ranged: bow-pull projectile).
  - Death animation (collapse + fade-out, niet instant despawn).
  - Splash-FX voor siege/AoE.
- **Bundel-fit**: visual-polish bundle, eigen MINOR (v0.44.0 of v0.45.0). Vereist Asset Generator agent voor sprite-sheets / particle textures.

### ✅ RESOLVED v0.51.3 — Randstad Barracks mesh herontworpen
- Concept-variants: amphitheater / presentation-hall-greenroof / training-arena-dome
- Gekozen: **presentation-hall-greenroof** (rechthoek + groendak + theatre-seating glass-curtain) — top-down distinctness vs. tower-townhall
- Meshy v6 image-to-3d, 18000 polycount, PBR, 9.4MB GLB
- LIVE in productie via rebuild+rsync
- Backups bewaard tot Richard in-game verifieert

### 🔴 P1 — Manager mesh "grover en cartoony" vs andere units (Richard's live-test 2026-04-30)
- **Issue**: Manager mesh wijkt **visueel-stijl** af — voelt grover/cartoony terwijl andere Randstad-units painted-realistic zijn
- **Scope**: regen Manager (`randstad-infantry.glb` of bedoelde unit-mesh) via Meshy v6 met explicit "match style of randstad-stagiair / randstad-consultant" prompt-anchor
- **Combineer met Manager voice/stats audit**: re-record `select_1.mp3` (8.6KB anomalie) + categorie-mismatch oplossen (Infantry-slot + Ranged gameplay)
- **Bundel**: v0.52.0 mogelijk — Manager re-vamp = mesh + voice + stats + portrait alignment
- **Gevonden**: 2026-04-29 (Richard "barracks is hetzelfde gebouw als town hall")
- **Issue**: file MD5 verschilt (barracks.glb 2.9MB vs townhall.glb 3.1MB), dus het zijn echt verschillende meshes. Maar Meshy v6 genereerde beide als kantoor-stijl — visueel onvoldoende onderscheidend in-game vanuit top-down view.
- **Voorstel**: regenerate Randstad barracks concept-art met explicit "auditorium" / "presentation hall" / "amphitheater"-feel ipv generic kantoor. Daarna Meshy v6 → flip path.
- **Bundel-fit**: kleine asset-batch, 1 concept + 1 GLB. Combineren met andere mesh-regens als die opkomen.

### ✅ RESOLVED v0.49.0 — Complete audit van in-game meldingen voor factie-specificiteit
- **Gevonden**: 2026-04-29 (Richard live-test na v0.41.1)
- **Issue**: meerdere in-game messages zijn niet factie-aware. Voorbeelden:
  - Lumberjack "ready" / drop-off-callouts spreken algemene tekst, niet factie-flavoured (Brabant houtzager moet Brabants klinken, Randstad stagiair corporate, Limburg vlaaibakker dialect, Belgen frietboer Vlaams).
  - Randstad hero "ready"-bericht zegt "Alaaf" — dat is Brabant carnaval-jargon, klopt niet voor Randstad CEO.
- **Scope**: audit alle eventBus-emits, audio-callouts (UnitVoices.ts), HUD.showAlert calls, Building/Unit completion messages. Per locatie checken of factie-id wordt gebruikt voor flavour-keuze.
- **Voorstel**: nieuwe `tests/factie-message-audit.test.ts` die per (factie × event-type) controleert dat de gekozen string uit een factie-specifieke pool komt. Plus refactor zodat alle messages via een `getFactionMessage(factionId, eventKey)` helper lopen.
- **Bundel-fit**: kandidaat voor eigen MINOR (v0.43.0 of later "Bundel: Voice & Message Pass").

### Info-row CSS niet perfect (CRN icon overlap)
- **Gevonden**: 2026-04-29 (na v0.41.1 deploy)
- **Issue**: in de info-row van de FactionSpecial1 building-card overlapt de icon-letter (CRN) gedeeltelijk met de label-tekst — icon zit niet correct uitgelijnd ernaast maar achter/onder de eerste paar letters van het label.
- **Voorstel**: icon `display: flex` + `align-items: center` + `flex: 0 0 22px`; plus expliciete `gap` of `margin-right`. Mogelijk dat het container `.bcard-action-icon` standaard z-index of position-styling heeft die het info-row-context verstoort. Eigen audit nodig.
- **Bundel-fit**: kleine UI-polish, kan in volgende patch (v0.41.2) of geïntegreerd in volgende minor.

---

## 🌟 v1.0 PERFECTIE — gesignaleerd onderweg (sessie 2026-04-28)

Items die deze sessie zichtbaar werden bij Bundel 5 + Bug-fix-sweep + Bundel 4A. Niet allemaal blokkers, maar in v1.0 perfectie-kader allemaal aan te pakken.

### ✅ RESOLVED v0.48.0 — Multi-stat splitsing op victory screen
- **Gevonden**: 2026-04-28 (na Bug #3 fix v0.37.38)
- **Issue**: stat-row "Verzameld" toont nu `goldGathered + woodGathered` als één getal. Voor speler-inzicht (en eventuele OKR/leaderboard-stats) zou aparte "Goud" + "Hout" beter zijn.
- **Voorstel**: 7e stat-row toevoegen of 2-kolom layout aanpassen. PlayerState heeft de getters al (`getGoldGathered`/`getWoodGathered`).

### ✅ RESOLVED v0.48.0 — TIER_REQUIREMENT_LABELS factie-aware
- **Gevonden**: 2026-04-28 tijdens Bug #2 refactor
- **Issue**: `factionBuildMenus.ts:44` heeft `TIER_REQUIREMENT_LABELS[3] = 'Geavanceerde Smederij'`. Voor Brabant-spelers leest de tooltip "Vereist Geavanceerde Smederij" terwijl het Wagenbouwer is. Zelfde voor andere facties (Innovatie Lab / Hoogoven / Diamantslijperij).
- **Voorstel**: `getTierRequirementLabel(factionId, tier)` helper in factionData.ts die de juiste UpgradeBuilding-naam returnt per factie.

### ✅ RESOLVED v0.48.0 — Heal-aura visual feedback
- **Gevonden**: 2026-04-28 (na Bundel 4A v0.37.40)
- **Issue**: Worstenbroodjeskraam heeft passive heal-aura (+0.5 HP/sec in 8u radius), maar geen visuele indicator. Speler ziet niet welke units worden geheeld.
- **Voorstel**: groene tint op unit-mesh tijdens heal-tick, of subtle particle-pulse. Idem voor Vlaaiwinkel heal (Bundel 3) — die heeft ook geen visual.
- **Bredere scope**: alle aura-effects (Carnavalstent attack-aura, Carnavalsvuur damage-aura, Worstenbroodjeskraam heal-aura, Vlaaiwinkel heal) verdienen een visuele radius-indicator wanneer de bron-bouw geselecteerd is.

### Stat-tracking voor non-player factions
- **Gevonden**: 2026-04-28 (na Bug #3 fix)
- **Issue**: `recordGoldGathered/recordWoodGathered` werken voor ALLE facties, maar de stats worden alleen voor de player getoond bij endMatch. Voor leaderboard/replay-data zou per-faction tracking ook nuttig zijn.
- **Voorstel**: minimaal tracking blijft in PlayerState; bij endMatch logging naar GitHub feedback API of analytics (Umami custom-event).

---

## 🌟 v1.0 PERFECTIE — multi-functie audit per gebouw

Per `feedback_v1_perfection_multi_function.md`: voor v1.0 streven we naar **2-3 functies per "specialty"-gebouw** (TertiaryResource / UpgradeBuilding / FactionSpecial1+2). Niet alleen één click-action of passive, maar een combinatie. Status na v0.37.39:

### TertiaryResource (4 gebouwen)
- ✅ **Randstad Havermoutmelkbar** — Sprint Mode (click), Deadline Crunch (click), Stagiairsleger (passive). v0.37.39.
- ⚠️ **Limburg Mijnschacht** — heeft Kolen-generation + UndergroundSystem tunnels, maar **geen click-action** voor strategische play. Kandidaten: "Ploegendienst" (kost 30 kolen → +50% mining speed 60s) + "Drukvuur" (kost 50 kolen → tunnel opens 50% sneller voor 30s).
- ⚠️ **Belgen Chocolaterie** — chocolade-generation + DiplomacySystem persuasion. **Geen passive bonus**. Kandidaat: "Pralines voor Iedereen" (per 100 chocolade in voorraad = +5% diplomacy-effectiviteit, cap +25%).
- 🚫 **Brabant Worstenbroodjeskraam** — archetype ontbreekt nog (Bundel 4A pending). Plan: passive +0.5 Gezelligheid/sec + click-action "Carnavalsmaal" (massa Gezelligheid burst).

### UpgradeBuilding (4 gebouwen) — alle 4 hebben research, maar geen click-acties of unique passives
- ⚠️ **Brabant Wagenbouwer** — research-panel + T3 gate. Kandidaat: "Carnaval-prep" passive (terwijl gebouwd = +5% Gezelligheid-generation rondom).
- ⚠️ **Randstad Innovatie Lab** — research + T3 gate. Kandidaat: "OneDrive Sync" passive (alle Randstad gebouwen +5% efficiency stack-cap zolang Lab leeft).
- ⚠️ **Limburg Hoogoven** — research + T3 gate. Kandidaat: "Kolenrook" passive (binnen 10u rondom: +1 armor voor Limburg-units).
- ⚠️ **Belgen Diamantslijperij** — research + T3 gate. Kandidaat: "Geslepen Wapens" passive (Belgen-units in 8u radius: +5% crit chance).

### FactionSpecial1 (4 gebouwen) — Bundle 3 reeds 1 functie elk
- ✅ **Brabant Carnavalstent** — +20% damage aura. Kandidaat tweede: click-action "Carnavalsoptocht" (kost Gezelligheid → 30s alle units +20% movement).
- ✅ **Randstad Boardroom** — Kwartaalcijfers click (+50% production 30s). Kandidaat passive: per Boardroom +1 efficiency-stack-cap.
- ✅ **Limburg Vlaaiwinkel** — heal aura. Kandidaat tweede: click-action "Limburgse Trakteerronde" (kost 100 kolen → 60s passive heal-rate +100%).
- ✅ **Belgen Diplomatiek Salon** — diplomats/persuasion. Kandidaat passive: per Salon -10% gold-cost voor diplomatie-acties.

### FactionSpecial2 (4 gebouwen) — produceren Heavy/Hero, geen unique mechanics
- ⚠️ Alle 4: kandidaat — passive "Gewricht-uitstraling" (+1 sight range voor alle units in faction).
- Of unieke per factie afgestemde click-actions ("Gemobiliseerd!" / "Opening Bid" / "Steenhouwersfeest" / "Diplomatieke Spil").

**Werkvolgorde**: per bundel 1-2 gebouwen oppakken (multi-functie audit + impl + tests). Geschat 6-8 toekomstige bundels om dit volledig af te ronden voor v1.0.

---

## 🔴 P0 / P1 — game-breakers of wrong-state bugs

### ✅ RESOLVED — Chocolaterie typeId fix (live, ChocolaterieSystem actief, DiplomacySystem importeert getPralinesDurationMult)
- **Gevonden**: 2026-04-28 tijdens Belgen-mapping (post-Bundel 1)
- **Bundel-fit**: Bundel 4A (Brabant Worstenbroodjeskraam adds Brabant TertiaryResource case — natuurlijke plek om Belgen te fixen).
- **Bug**: `factionData.ts:1296` — Chocolaterie archetype heeft `typeId: BuildingTypeId.LumberCamp` ipv `BuildingTypeId.TertiaryResourceBuilding`. Hij genereert geen Chocolade omdat TertiaryResourceSystem (regel 41) op typeId filtert.
- **Verificatie nodig**: idem check voor Randstad Havermoutmelkbar + Limburg Mijnschacht — mogelijk dezelfde bug.
- **Test-lock**: nieuwe `tests/tertiary-resource-archetype.test.ts` die voor elk van de 4 facties asserteert dat de TertiaryResource-naamgeving (`Worstenbroodjeskraam`/`Havermoutmelkbar`/`Mijnschacht`/`Chocolaterie`) hoort bij `BuildingTypeId.TertiaryResourceBuilding`.

---

## 🟡 P2 — kwaliteitsverbeteringen / tooling

### Game-deployer agent memory niet bijgewerkt na 3D-landing restore
- **Gevonden**: 2026-04-28 (sessie-start, na Game Deployer agent run)
- **Bundel-fit**: post-deploy housekeeping, geen bundel-blokker.
- **Issue**: `.claude/agents/memory/game-deployer.md` permission-denied tijdens agent-run. Mist nu (a) deploy-entry van 3D landing restore, (b) waarschuwing dat `--landing-page` flag de 3D versie destructief overschrijft.
- **Actie**: handmatige update van die memory file.

### `deploy-ftp.sh --landing-page` is een footgun
- **Gevonden**: 2026-04-28 (sessie-start, oorzaak van 3D-landing verlies)
- **Bundel-fit**: tooling-cleanup, los van game-bundels.
- **Issue**: `--landing-page` flag (deploy-ftp.sh:60) uploadt de lokale statische `landing-page.html` als `index.html`, wat de 3D Game World destructief overschrijft. Geen waarschuwing, geen confirm, geen versiecheck.
- **Voorstel**: óf rename naar `--legacy-landing` met confirm-prompt, óf vervang door `--3d-landing` flag die `3d-landing/dist/` deployt. Bespreken met Richard.

---

## 🟢 P3 — visuele upgrades / mesh-batch

### ~~Meshy v6 batch — 12 ontbrekende GLBs~~ ✅ RESOLVED (Bundel 5 + 4A integratie)
- **Gevonden**: 2026-04-28 tijdens Belgen-mapping
- **Resolved**: 2026-04-28
  - Bundel 5 (v0.37.36) — 11 dedicated GLBs voor 3 randstad/limburgers/belgen × tertiary/upgrade/special1 + brabant upgrade/special1.
  - Bundel 4A integratie (v0.37.41 — pending) — 12e GLB voor Brabant Worstenbroodjeskraam (TertiaryResource).
- **Test-lock**: `tests/BuildingRenderer-mesh-uniqueness.test.ts` — per factie 11 unique paden (Brabant 10 → 11 na 4A integratie). Plus fs-existence per V02 path. Voorkomt regressie naar fallback-paths.

---

## 🟡 P2 — kwaliteits / coverage gaten (Bundel 2 sessie)

### TowerSystem sniper-bonus tegen ranged units niet geïmplementeerd
- **Gevonden**: 2026-04-28 (Bundel 2B-explore)
- **Bundel-fit**: kleine gameplay-bug, kan in Bundel 5 of latere sweep.
- **Issue**: plan-spec Bundel 2B noemt "sniper-bonus tegen ranged units" maar `TowerSystem.processAttacking` heeft geen bonus-logic. Range / damage / attack-speed werken wel.
- **Voorstel**: damage * 1.5 als target heeft `UnitType.id === Ranged`. Of extra range tegen Ranged. Test-lock erbij.

### Housing display-name per factie test gap
- **Gevonden**: 2026-04-28 (Bundel 2C-explore)
- **Bundel-fit**: coverage uitbreiding — `tests/display-names-faction-aware.test.ts` mist Housing-specifieke factie-namen (Boerenhoeve / Vinex-wijk / Huuske / Brusselse Woning).

### 3D mouseover-tooltip pattern ontbreekt
- **Gevonden**: 2026-04-28 (Bundel 2B-explore)
- **Bundel-fit**: UX polish, future bundle. Raycaster bestaat (per click) maar geen mousemove-tooltip-binding voor 3D buildings.
- **Voorstel**: throttle 100ms raycaster + DOM tooltip-div met building-info.

### Construction-timer in `Building.status` text
- **Gevonden**: 2026-04-28 (Bundel 2B-explore)
- **Bundel-fit**: kleine UX-polish. Status zegt `'Under construction'` maar toont geen "(15s)" remaining-tijd zoals trainings-units doen.

---

## 🟢 P3 — V1.0 visual perfection (factie-specifiek, on-brand)

### V1.0 perfectie: ALLES factie-specifiek + per-functie unique HUD-images
- **Gevonden**: 2026-04-28 (na Bundel 2.5 deploy — Richard live-confirmation)
- **Bundel-fit**: groot, gefaseerd. Niet één bundel — eigen track parallel aan gameplay-bundels of gespreid over Bundel 5/6/7.
- **Scope** — drie image-categorieën, allemaal moeten on-brand worden:

  **A. Upgrade-portraits (18 → 4×18 = 72 versies)**
  - Huidig (v0.37.34): 18 generic painted portraits (Flux Dev, RPG card-art template).
  - Doel: per upgrade × per factie een eigen versie.
  - Voorbeeld: WoodCarry1 generic = bakker met mand. Brabant-versie = Brabantse boer met worstenbroodjeskraam-mand. Randstad-versie = Starbucks-barista met latte-tray. Limburg-versie = vlaaibakker met mergel-vlaai-stapel. Belgen-versie = frietboer met patatzak.
  - Per factie eigen color-palette + symboliek (Brabant oranje/rood, Randstad blauw/glas, Limburg bruin/mergel, Belgen geel/zwart/rood).

  **B. Building-portraits (HUD command-bar + selection-card)**
  - Huidig: tekst-abbrev (TH/BRK/LMB/BSM) + canvas-drawn fallback voor T2/T3 (zie screenshot — "Vergaderzaal", "Sloopwerf" etc. tonen generieke icoontjes met emoji-look).
  - Doel: per factie × per building-type een eigen painted portrait.
  - 11 building-types × 4 facties = 44 building-portraits.
  - Stijl: zelfde RPG card-art template als upgrade-portraits voor consistentie.

  **C. Unit-portraits — review bestaande set**
  - Huidig: `public/assets/portraits/` heeft per factie 5-6 unit-portraits (al on-brand, maar coverage incompleet).
  - Doel: bevestig 100% coverage voor alle UnitTypeIds (Worker/Infantry/Ranged/Heavy/Siege/Support/Hero) per factie = 7 × 4 = 28 portraits.
  - Audit nodig: welke ontbreken? Welke zijn off-brand?

  **D. FactionSpecial1/2 + TertiaryResource portraits (incremental)**
  - Volgt op A+B+C als die fundament staat.

- **Volgorde-voorstel** (gespreid):
  1. Audit: welke building-portraits zijn er nu / zijn ze on-brand? (1 sessie, Asset Generator agent)
  2. Mass-batch B (44 building-portraits) via Asset Generator — kan zelfde RPG-template als upgrade-portraits, maar per factie color-palette aanpassen
  3. Mass-batch A (72 upgrade-versies, 4 per upgrade) — per factie variant. UpgradePortraits.ts moet dan worden uitgebreid met `getUpgradeImagePath(factionId, upgradeId)`.
  4. C audit + gap-fill
  5. D special-functions
- **Code-impact**: minimaal voor A (UpgradePortraits.ts factie-aware lookup). B+C+D vereisen wel canvas-fallback removal en image-loaders. Zou een dedicated **Bundel 6 — Visual Perfectie** kunnen zijn.
- **Asset-cost** schatting (Flux Dev op 1024×1024, ~10s per generation): 72+44+~10 fixes = ~130 generations = ~22min API-tijd.
- **Quality-bar**: GEEN emoji-fallback (zie generic ascii-look op Sloopwerf-screenshot — onaanvaardbaar voor v1.0). On-brand of niet shippen.

### Sub-bevinding: Sloopwerf canvas-fallback toont ascii/emoji-look
- **Gevonden**: 2026-04-28 (zelfde sessie, screenshot 15:11)
- **Bundel-fit**: cosmetisch, opgenomen in V1.0 perfectie scope hierboven (item B).
- **Issue**: Randstad Sloopwerf (UpgradeBuilding) toont in selection-card een crude canvas-drawn icon (rood truckje op simpele garage). Speel het scherm — dit is `createBuildingPortraitImg` fallback.
- **Voorstel**: vervang canvas-fallback met factie-specifieke painted portrait via Asset Generator zodra V1.0 visual sweep gepland is.

---

## ✅ Resolved

(leeg — vul in bij oppakken met datum + commit-SHA)

---

## 🛒 Plan-discipline-regel (afgesproken 2026-04-28)

> **"Plan respecteren + alle 'extra' findings → direct in deze backlog, oppakken zodra we er aan toe komen."**

Niet onderweg uitbreiden van de huidige bundel-scope; ander werk blokkeert
momentum. Backlog wordt elke bundel-end-of-session geconsulteerd.
