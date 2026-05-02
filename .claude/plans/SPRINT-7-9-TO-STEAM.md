# Plan — Sprint 7-9 → Steam Launch

**Status**: Public Beta LIVE (v0.59.0 op reign-of-brabant.nl)
**Doel**: Sprint 7-9 afronden → daarna Steam release (Electron wrapper + auto-deploy via SteamPipe)
**Constraint**: ZERO downtime op productie tijdens hele traject
**Geschat resterend**: 6-9 dev-sessies + 3-4 weken Steam-pijplijn (deels parallel)

---

## 0. Production-safety pact (geldt voor élke sessie)

Public Beta loopt — elke deploy moet veilig zijn. Regels:

1. **Branch discipline**: alle Sprint 7-9 werk gaat naar `main` per bundle (zoals v0.52.x→v0.59.x), maar **grote multi-sessie features** (campagnes, multiplayer-skirmish, balance-rewerks) krijgen eerst een **feature-flag** in `gameConfig` zodat onaffe code niet zichtbaar is voor beta-spelers.
2. **Deploy gate** = `npm run test:all` (typecheck + 1767+ vitest + Playwright UAT) MOET groen vóór `deploy-rob.sh`. `--skip-tests` is verboden tenzij Richard expliciet OK geeft.
3. **Zero-downtime via `deploy-rob.sh`**: server build + atomic swap + HTTP verify + Cloudflare purge. Bij falen → instant rollback (`PROD ↔ OLD` mv).
4. **Save-game compat**: elke wijziging aan ECS-componenten of localStorage-keys MOET een migration of explicit reset hebben. Beta-spelers hebben saves; we mogen die niet stilletjes corrupten.
5. **Performance regression gate**: vóór elke release een 200-unit smoke-test (FPS in `?stats=1` mode). Bij <50 FPS → blocker.
6. **Hotfix-pad blijft open**: tijdens Sprint 7 mission-design-werk mag een spelende beta-er een P0-bug rapporteren — die fix gaat vóór nieuwe campagne-content.

---

## 1. Sprint 7 — Mission Design & Campaign (~~3-4 sessies~~ → **1.5-2 sessies**)

**REVISIE 2026-05-02**: bij inventarisatie blijkt Sprint 7 grotendeels al af.
- ✅ **36 missies bestaan** in `src/campaign/MissionDefinitions.ts`: Brabanders 12 + Limburgers 8 + Belgen 8 + Randstad 8
- ✅ **449 audit-tests** (`tests/mission-structure-audit.test.ts`) valideren roster, required fields, objective-types, trigger/wave consistency, ID-uniciteit
- ✅ Voice-lines, portraits, painted-vignette assets compleet (v0.52-v0.59)

**Wat resteert in Sprint 7-territorium**:
1. **Gameplay-verificatie** (audit-tests checken structuur, niet of het LEUK is)
2. **Progressieve unlock-spec verifiëren**: PRD belooft "max 1 nieuw building/unit per missie" — moet handmatig per missie gechecked
3. **AI difficulty curve match PRD-tabel**: grace-period 180s→60s, waves 1→8, productie traag→snel — eventueel rebalance
4. **Narrative-arc per trio**: per 3 missies een verhaal-boog — script/dialoog-pass

**Doel**: 12-missie Brabanders campagne herstructureren + 3 andere facties op minimaal 8 missies. Dit is veruit het grootste blok. ~~veruit grootste blok~~ — blijkt grotendeels reeds gerealiseerd; resterende werk is **verifiëren + tunen**, niet nieuwbouw.

### 1.1 Sprint 7.1 — Progressie & Difficulty Audit (Sessie A — 1 sessie)
**Risk**: low — analyse + tuning, geen nieuwe content

**Sub-tasks** (in volgorde):

**a. Feature-flag systeem (FIRST — alles rijdt hier op)**
- Nieuwe file `src/config/featureFlags.ts`:
  ```ts
  export const featureFlags = {
    isBeta: typeof localStorage !== 'undefined' && localStorage.getItem('rob-beta') === '1',
    // Toekomstige WIP-flags hier toevoegen
  };
  ```
- Update `src/main.ts`: `?beta=1` → set localStorage + redirect naar clean URL; `?beta=0` → clear
- Geen UI-toggle in productie-menu (bewust — voorkomt random expose)
- **Test**: `tests/featureFlags.test.ts` — query-param parsing, localStorage flow, default-off

**b. Progressie-audit script**
- `scripts/audit-mission-progression.ts` — voor elke campagne loop missies door en check:
  - Welke buildings/units beschikbaar zijn per missie (afgeleid uit `aiFactionIds` + starting-resources + objectives)
  - Per missie-overgang: max 1 nieuw building/unit type tov vorige missie?
- Output: `audits/mission-progression-2026-05.md` met tabel per campagne + flags
- **Niet auto-fixen** — Richard reviewt en wij tunen handmatig waar nodig

**c. AI difficulty curve check**
- Voor elke campagne: extracteer per missie `gracePeriodSeconds`, wave-count, AI-productie-flag
- Match tegen PRD-tabel (Tutorial=∞ grace, M1-2=180s, M3-4=150s, M5-6=120s, M7-8=90s, M9-11=60s)
- Output appendix in `audits/mission-progression-2026-05.md`
- Tunes implementeren als afwijkingen gevonden → bundle v0.60.0

**d. Bundle deploy**
- v0.60.0: feature-flags + audit-output + eventuele difficulty-tunes
- Productie-deploy via `deploy-rob.sh`, feature-flag UIT (default)
- Beta-spelers met `?beta=1` flow valideren in next sessie

### 1.2 Sprint 7.2 — Narrative-arc & dialoog QA (Sessie B — 0.5-1 sessie)
**Risk**: low — content-pass, geen engine

- Per factie: lees `briefingText` van alle missies achter elkaar
- Check: vertelt elk trio (M0-M2, M3-M5, M6-M8, M9-M11) een coherente verhaal-boog?
- Inconsistenties → tweaks aan briefingText + mission-end messages
- Voice-lines voor briefings (ElevenLabs) — eventueel waar nog niet bestaan
- **Asset cost**: ~$0.20-0.50 voor extra voice-clips
- Bundle v0.61.0

### 1.3 Sprint 7.3 — Speeldoorloop human-QA (Sessie C — 0.5 sessie of Richard solo)
**Risk**: laag — pure speeltest

- Richard speelt alle 4 campagnes door (kan in eigen tempo, niet binnen sessie)
- Bug-rapport in `audits/campaign-playthrough-2026-05.md`
- Fixes als P1 hotfixes, anderen → backlog

**Sprint 7 totaal**: ~1.5-2 sessies (was 3-4), ~$0.50 asset cost, +20-40 tests (auditscripts)

---

## 2. Sprint 8 — Maps & Game Modes (1-2 sessies)

### 2.1 Variable map sizes + skirmish 2-4 spelers (Sessie E — 1 sessie)
**Risk**: medium — multiplayer-AI-pathing kan FPS-impact hebben

- Map sizes: 80×80 / 128×128 / 192×192 (klein/medium/groot)
- Skirmish menu: AI count (1-3), difficulty per AI, fog-of-war toggle, starting-resources (low/med/high)
- Victory condition: laatste TownHall staand wint (multi-team support)
- **Performance gate**: 192×192 + 4 AI's + 200 units MOET ≥ 30 FPS
- **Test**: `tests/skirmish/multi-ai.test.ts` — 4 AI's, 60s headless sim, geen crashes
- **Deploy**: gewone bundle, geen feature-flag (additive — bestaande 2-player skirmish blijft werken)

### 2.2 Map templates `canyon` + `archipelago` (Sessie F — 0.5 sessie)
**Risk**: low — pure data + terrain-generator-tweaks

- `canyon`: smalle vallei, choke points (verticale gevechten via siege-richtingen)
- `archipelago`: meerdere eilanden, smalle bruggen (pathing-test), water als barrier
- **Test**: navmesh-generation passes, beide spawn-points bereikbaar
- **Asset**: 2 minimap-thumbnails (~$0.10)

**Sprint 8 totaal**: ~1.5 sessies, ~$0.10 asset cost

---

## 3. Sprint 9 — Balance & QA (2-3 sessies)

### 3.1 Unit balance matrix verifiëren (Sessie G — 1 sessie)
**Risk**: hoog op feel/gameplay — laag op code

- Rock-paper-scissors check: Infantry→Ranged, Ranged→Heavy, Heavy→Infantry, Siege→Buildings (200%), Support→heal
- Combat-sim test: voor elk paar `tests/balance/matchup-<a>-vs-<b>.test.ts` met N=10 runs, gemiddelde uitkomst moet binnen 40-60% van verwachte winnaar zijn
- Output: rapport `BALANCE-REPORT.md` met heatmap → tunes per unit
- **Deploy**: stat-tweaks bundeled in 1 release. Save-compat: stats zitten niet in saves, geen migratie nodig

### 3.2 Performance audit @ 500 units (Sessie H — 1 sessie)
**Risk**: medium — kan engine-werk vereisen

- Headless test: spawn 500 units, meet FPS via `stats-gl`
- Targets uit PRD: 30 FPS @ 500 units, <500MB memory, <2MB JS bundle
- Profiel-tools: Chrome perf, `?stats=1`, `?bench=1`
- Mogelijke optimisaties: instanced rendering voor units, frustum culling check, system-frequency tuning (path-finding op 10Hz ipv 60Hz?), spatial-grid voor proximity queries
- **Test**: regression gate `tests/perf/500-units.test.ts` — fail bij <25 FPS

### 3.3 QA pass + bug-bash (Sessie I — 0.5-1 sessie)
- Volledige campagne speel-doorloop (4 facties × 8-12 missies = full sweep)
- Edge cases: pause-mid-build, save-mid-mission, alt-tab gedrag
- Beta-feedback verzamelen + triëren
- Updates-page final v1.0 entry

**Sprint 9 totaal**: ~2.5 sessies

---

## 4. Pre-Steam: v1.0 release (Sessie J — 0.5 sessie)

**Mijlpaal**: alle 3 sprints klaar → beta wordt v1.0.0
- VERSION: 1.0.0
- CHANGELOG sectie [1.0.0]
- Updates-page: prominent "Out of Beta" entry
- BETA-badge weg uit UI (BETA badge feature-flag → false)
- Cloudflare purge

---

## 5. Steam pipeline (parallel + post-1.0)

Steam Direct paperwork kan **parallel** met Sprint 7 starten — heeft geen code-impact.

### 5.1 Paperwork (kan vandaag al, ~3-7 kalenderdagen)
- $100 Steam Direct fee betalen
- Partner agreement, W-8BEN tax doc, bank info
- App-ID aanvragen, default Windows depot
- Builder sub-account aanmaken voor CI 2FA

### 5.2 Electron wrapper PoC (Sessie K — 1 sessie, kan parallel met Sprint 7-8)
**Risk**: voor Steam-build, NIET voor productie web-versie

- **Aparte map**: `reign-of-brabant-electron/` — los van web-build, eigen `package.json`
- Electron + `electron-builder` + `steamworks.js` (Koffi FFI)
- Wrapper laadt `dist/` van web-build (zelfde Vite-output)
- Init Steamworks SDK, achievements stubs, cloud-save mapping (localStorage → Remote Storage API)
- Test: lokaal Steam-overlay werkt, achievement triggert

### 5.3 SteamPipe CI/CD (Sessie L — 0.5 sessie, na PoC werkend)
- GitHub Actions workflow: bij tag `steam-v*` → build Electron → upload via `game-ci/steam-deploy@v3`
- Push naar Steam `beta` branch (niet `default`) — handmatige promotie naar live
- Secrets: `STEAM_USERNAME`, `STEAM_CONFIG_VDF` (base64 na 1× lokale 2FA-login), `STEAM_APP_ID`

### 5.4 Store-page assets (parallel, ~2-4 dagen werk)
- Capsule images (header 460×215, library 600×900, page-background)
- Trailer (60s, gameplay highlights)
- 5-10 screenshots
- Store-page tekst (NL + EN), feature-list, system requirements
- 2-week mandatory store-page-public window start zodra reviews door zijn

### 5.5 Steam Deck readiness (optional, post-launch)
- Ship Windows-only first → Proton draait het = "Playable" status
- "Verified" vereist controller mapping + 16px+ text + 1280×800 default → backlog post-launch

---

## 6. Tijdlijn (kalender)

```
Week 1   ┃ Sprint 7.1 Brabanders rework  + Steam paperwork start
Week 2   ┃ Sprint 7.2 Limburgers + Belgen
Week 3   ┃ Sprint 7.3 Randstad + 7.4 release
         ┃ + Electron PoC (parallel)
Week 4   ┃ Sprint 8 Maps & Game Modes
         ┃ + Store-page assets
Week 5   ┃ Sprint 9 Balance + Performance
Week 6   ┃ Sprint 9 QA + v1.0 release
         ┃ + SteamPipe CI/CD
Week 7   ┃ Steam build review + 2-week public store
Week 8-9 ┃ Wachten op store-window
Week 10  ┃ STEAM LAUNCH
```

**Totaal kalender**: ~10 weken (~2.5 maanden) bij 2-3 sessies/week
**Totaal dev-werk**: ~9 sessies (Sprint) + 1.5 sessies (Steam) = ~10-11 sessies
**Totaal cost**: $100 Steam Direct + ~$2-3 asset gen + optional $200 Windows code-sign cert

---

## 7. Risico-register

| Risico | Kans | Impact | Mitigatie |
|--------|------|--------|-----------|
| Save-corruption door campagne-rework | Medium | Hoog | Migration + fallback-test, feature-flag default off |
| Performance crash bij 4 AI's + 192×192 map | Medium | Hoog | Performance gate vóór release, bench-test in CI |
| Steam build review afgekeurd | Laag | Medium | Volg Steamworks checklist exact, geen DRM-experimenten |
| Beta-spelers verliezen progressie | Laag | Hoog | localStorage-keys NIET hernoemen, alleen additief uitbreiden |
| Asset-bloat (1.4GB dist) faalt Steam-upload | Medium | Medium | Pre-Steam: texture compression + audio bitrate-pass = aparte mini-bundle voor v0.99.0 |
| Electron wrapper FPS lager dan browser | Laag | Medium | PoC valideert vóór commit; fallback: NW.js |

---

## 8. Concrete starting move (volgende sessie)

**Voorgestelde sessie-1 doel**: Sprint 7.1 — Brabanders campagne rework.

**Stappen**:
1. Lees `reign-of-brabant/PRD-v1.0.md` §9 (mission-tabel) + memory `games/reign-of-brabant/campaign_missions.md`
2. Inventariseer huidige `src/data/missions/` of equivalent — welke missies bestaan al, wat is de structuur?
3. Maak `gameConfig.useNewBrabantCampaign` feature-flag (default false in production-config, true in dev)
4. Schrijf 12 nieuwe `MissionData` entries volgens PRD-tabel
5. Test-suite: per missie load + 60s simulate
6. Bundle als v0.60.0, deploy met flag UIT
7. Open opt-in toggle in skirmish-menu voor Richard's eigen testen

**Out of scope sessie 1**: andere 3 facties (sessies B+C), UI-redesign campaign-select (sessie D).

---

## 9. Beslissingen — vastgelegd 2026-05-02

### 9.1 Beta opt-in: `?beta=1` → localStorage-flag (hybride)
**Hoe het werkt**:
- Eerste bezoek met `?beta=1` zet `localStorage['rob-beta'] = '1'` en redirect naar clean URL
- Daarna persistent per-browser, geen URL-vervuiling, deelbaar via shortlink
- Reset via `?beta=0` of devtools (`localStorage.removeItem('rob-beta')`)
- Feature-flag-plumbing: `gameConfig.isBeta = localStorage['rob-beta'] === '1'`
- Productie-default voor alle WIP-flags is `false`; beta-spelers krijgen `true`
- Geen UI-toggle in productie-menu (voorkomt dat random beta-spelers per ongeluk WIP-content zien)

**Waarom niet de andere opties**: pure query-param vergeet je, pure UI-toggle pollueert productie-UX, pure localStorage-flag is niet deelbaar.

### 9.2 Campagne-volgorde: gefaseerd in beta, alle 4 in Steam v1.0
**In public beta (web)**:
- v0.60.x: Brabanders rework eerst publiek (anchor-factie met meeste polish + voice + dialect)
- v0.61.x: Limburgers + Belgen (parallel ontwikkeld, samen gereleased)
- v0.62.x: Randstad
- Reden: Brabanders valideert het mission-format; eventuele structurele fouten ontdekken we vóór 24 missies herwerk

**Voor Steam v1.0**: alle 4 campagnes verplicht aanwezig. Een Steam-page met "1 campagne, 3 komen later" leest dun in reviews. Tijdlijn (week 10) geeft genoeg ruimte.

### 9.3 Steam tier: Early Access + Next Fest demo
**Early Access** is de juiste fit:
- Past bij "we hebben publieke beta, updaten regelmatig" verhaal
- Lagere review-verwachtingen (spelers begrijpen WIP)
- Toestaat post-launch sprints zonder reputatie-risk
- PWYW-model rechtvaardigt EA-status ("nog in ontwikkeling")
- Beloofde scope helder zetten op Steam-page: campagnes + skirmish + Steam Workshop (later) + balance-iteraties

**Steam Next Fest demo**: gratis 1-week store-visibility window. Eerstvolgende Next Fest na launch-readiness aanmelden. Demo = tutorial-missie + 1 skirmish-map. Levert ~10-50k impressions zonder ad-spend.

**Niet gewone full release**: te risicovol — één wave slechte reviews bij launch is permanent. EA → 1.0 transitie geeft een tweede kans op visibility.

### 9.4 Pricing: Free + Supporter DLC tiers + externe donate-link
Steam ondersteunt geen pure PWYW. Cleanste vertaling van jouw donatiemodel:

**Op Steam**:
- **Base game: Free-to-Play** — volledige game, geen paywall, geen ads
- **Supporter DLC tiers** (cosmetic-only, geen gameplay-voordeel):
  - **Steunpilaar** €4.99 — naam in credits, "Steunpilaar" badge in main menu
  - **Brabander voor het Leven** €9.99 — bovenstaande + dev-commentary audio-track + golden-worstenbroodje cursor cosmetic
  - **Hertog van Brabant** €24.99 — bovenstaande + naam in een in-game NPC of building-banner + early-access patch-notes
- Geen pay-to-win, geen lootboxes, geen abonnement (Steam-richtlijnen + jouw waarden)

**Externe donate-link in main-menu**:
- Ko-fi of GitHub Sponsors (max-vrijheid, geen platform-cut zoals Patreon)
- "Doneer wat je wilt" knop direct naast Steam Supporter DLC menu
- Voor web-versie (reign-of-brabant.nl) is dit de primaire monetisatie-kanaal

**Crowdfunding-plan in memory**: blijft van toepassing voor pre-launch fundraising (voice-acting, Meshy-credits). Post-launch monetisatie verschuift naar Supporter DLC + donaties.

### 9.5 Code-signing: SKIP voor Steam, herevalueer bij standalone .exe
**Beslissing**: geen €200/jr cert nu.

**Rationale**:
- Steam-distributie levert binaries via `steam.exe` client → SmartScreen triggert nauwelijks
- SmartScreen-warning treft alleen directe-download .exe distributie buiten Steam
- Als we later besluiten een standalone Windows-build aan te bieden (itch.io, directe download), heroverwegen
- $200/jr × 2-3 jaar = $400-600 = ongeveer 80-120 Steunpilaar-DLC's. Pas zinvol als we standalone-distributie als kanaal kiezen

**Alternatief op middellange termijn**: Microsoft Store certified app (gratis cert, vereist UWP-wrapping) — niet relevant voor v1.0 maar in P3-backlog.

---

## 10. Implicaties van beslissingen op het plan

- Sprint 7.1 moet feature-flag systeem `gameConfig.isBeta` + `gameConfig.useNewBrabantCampaign` opzetten als FIRST sub-task → alle volgende WIP-content rijdt hierop mee.
- Steam app-aanvraag wordt **Early Access** vanaf dag 1 — dat is een keuze in de Steamworks app-config, niet last-minute switchbaar.
- Steam app-config heeft Free-to-Play + DLC structuur → minimaal 4 app-entries (base + 3 DLC) bij Steam Direct ($100 dekt base, DLC's zijn gratis sub-entries onder dezelfde app).
- Externe donate-link werk: Ko-fi-account + button-integratie in `index.html` main-menu vóór v1.0 release.
- Supporter DLC content (cosmetics, dev-commentary track, NPC-naam-slot) is werk: schat **+1 sessie** in tijdens of na Sprint 9. Zet als Sprint 10 = "Monetisation polish".

**Bijgewerkte tijdlijn**: ~10 weken kalender blijft, week 6 wordt nu "v1.0 + Sprint 10 monetisation polish" (Supporter DLC content + Ko-fi integratie).
