# Backlog — bevindingen onderweg

Gestart **2026-04-28** tijdens Bundel 1 sessie. Alles wat we *onderweg* tegenkomen
en niet in scope is van de huidige bundel landt hier, gesorteerd op prioriteit.

Iedere entry: **datum-gevonden | tijdens-bundel | status | beknopte beschrijving**.
Bij oppakken: subject + commit-SHA invullen onder "Resolved".

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

### Chocolaterie heeft verkeerde `typeId` — genereert geen Chocolade
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

### Meshy v6 batch — 12 ontbrekende GLBs (4 facties × 3 building-types) — **PRIO BUMP P2 na v0.37.35**
- **Gevonden**: 2026-04-28 tijdens Belgen-mapping
- **2026-04-28 priority-bump**: Bundel 3 deploy maakt het probleem actief gameplay-relevant. Randstad-speler ziet 3 identieke "Starbucks" meshes voor Starbucks/Havermoutmelkbar/Boardroom — kan ze niet onderscheiden van bovenaf. Boardroom-click vereist visuele identifier.
- **Bundel-fit**: **Bundel 4C** plant dit als mesh-audit *doc* (queue-only). Reële uitvoering = **nieuwe Bundel 5** Meshy-marathon (één sessie, batch-prompting, één BuildingRenderer-rewire-PR).
- **Scope**:
  - **HOOG: UpgradeBuilding × 4** — alle 4 facties gebruiken nu `<faction>/blacksmith.glb` als fallback (speler ziet 2× dezelfde Smederij). Brabant=?, Randstad=?, Limburg=?, Belgen=Diamantslijperij.
  - **HOOG: FactionSpecial1 × 4** — alle 4 gebruiken nu `<faction>/lumbercamp.glb`. Carnavalstent / Boardroom / Vlaaiwinkel / Diplomatiek Salon. Archetypes komen in Bundel 3.
  - **MEDIUM: TertiaryResource × 4** — alle 4 gebruiken nu `<faction>/lumbercamp.glb`. Worstenbroodjeskraam / Havermoutmelkbar / Mijnschacht / Chocolaterie. Brabant-archetype komt in Bundel 4A.
- **Aanpak**: per gebouw concept-art prompt (image generatie) → Meshy v6 production image-to-3D → GLB + faction-aesthetic check → BuildingRenderer.ts:56-70 primary-path update → render-test in skirmish.
- **Volgorde**: na Bundel 4 (alle archetypes + functies LIVE), zodat we tegelijk visueel sluiten.

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
