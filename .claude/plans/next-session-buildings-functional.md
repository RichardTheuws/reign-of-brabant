# Volgende sessie: gebouwen volledig functioneel maken

**Versie target**: v0.37.30 → v0.37.33 (4 atomic bundels via gate)
**Voorbereiding**: 2026-04-25 (na v0.37.29 terrain-fix), Richard akkoord 2026-04-28
**Aanpak**: 4 grote bundels. Elke bundel = parallel red-tests → fixes → groene UAT-uitbreiding → atomic commit + deploy.
**Werkwijze**: pre-deploy regression gate (`npm run test:all`) blokkeert breakage. Per bundel een version-bump + live-test-window.

---

## Richards beslissingen (2026-04-28)

1. **Blacksmith bug** — Paneel verschijnt, **maar click → geen sound, geen gold-deduct, geen progress-bar**. Click-handler fires not / niet bound. Top prioriteit Bundel 1.
2. **FactionSpecial1 designs** — AKKOORD: Carnavalstent / Boardroom / Vlaaiwinkel / Diplomatiek Salon.
3. **Brabant TertiaryResource** — AKKOORD: Worstenbroodjeskraam (X-hotkey, +0.5 Gezelligheid/sec passief).
4. **Tempo** — Bundelen naar 3-4 deploys. Plan herzien tot **4 bundels**.

---

## Bundel 1 — v0.37.30: Blacksmith fix + LumberCamp upgrades

**Focus**: research-flow eind-tot-eind werkend voor 2 gebouwtypes.

### 1A. Blacksmith UI click-handler debug + fix (PRIO 1)

**Diagnose-hypothesen** (in priority order — check eerst de meest waarschijnlijke):
- (a) `HUD.showBlacksmithPanel()` rendert knoppen maar bind nooit `addEventListener('click', ...)`. Waarschijnlijk: ja, gezien click → niets.
- (b) Knoppen zijn `disabled` ondanks `canResearch=true` + `canAfford=true` (CSS pointer-events:none of disabled-attr).
- (c) Click bind WEL maar `events.onCommand` callback gaat naar verkeerd action-id.
- (d) `techTreeSystem.startResearch()` returnt `false` silent (no-error pad). Maar dan zou er `'Kan onderzoek niet starten!'` toast verschijnen — Richard meldt totaal geen feedback.

**Aanpak**:
1. Lees `HUD.showBlacksmithPanel()` volledig — zoek de button-render-loop en check `addEventListener` call.
2. Schrijf vitest-integratie-test: `HUD.showBlacksmithPanel(upgrades, null, mockClick)` → simuleer DOM-click op button[data-research-id=0] → assert `mockClick` called met id=0.
3. Fix per gevonden bug.
4. UAT-03 `uat/03-blacksmith-research.spec.ts`: skirmish start → bouw Cafe → bouw Kermistent → wacht complete → klik upgrade → assert progress-bar toont en gold deducts.

### 1B. LumberCamp wood-upgrades (3 per factie)

**Tier 1 upgrades** — beschikbaar zodra LumberCamp staat (geen Blacksmith vereist):

| Upgrade | Effect | Cost | Time |
|---------|--------|------|------|
| Bijl I | Workers carry +5 wood | 100g | 30s |
| Bijl II | Workers carry +5 wood (stacks) | 175g | 45s |
| Snelle Kap | Wood gather rate +25% | 200g | 40s |

**Per-factie naming**:
- Brabant Bakkerij: "Stevigere Manden" / "Volkoren Brood" / "Snellere Bakker"
- Randstad Starbucks: "Latte Capacity" / "Cold Brew Bonus" / "Caffeine Kick"
- Limburg Vlaaibakkerij: "Grotere Vlaai" / "Suiker-Boost" / "Snellere Oven"
- Belgen Frietfabriek: "XL Patatzak" / "Mayo-Reserve" / "Snel Frituren"

**Implementatie**:
- 3 nieuwe `UpgradeId` enum-waarden (WoodCarry1=10, WoodCarry2=11, WoodGather=12).
- Extend `UPGRADE_DEFINITIONS` met `bonusCarry?` en `bonusGatherSpeedFraction?` velden.
- New `Gatherer.carryBonus` field (Float32Array) — modifies effective carry-capacity in GatherSystem.
- New `Gatherer.gatherSpeedMult` field — modifies tick-rate.
- TechTreeSystem.applyUpgradeToEntity ondersteunt nu carry/gather mods voor Workers (filter `affectsUnitTypes=[Worker]`).
- LumberCamp's selection-panel toont 3 research-buttons (analoog Blacksmith — herbruik component).
- Per factie unieke `name` + `description` strings — lookup via factie-id × upgrade-id.

**Tests**: +18 — 3 upgrades × (cost-deduct + retroactive-apply-Worker + new-spawn-stack + non-Worker-not-affected) + 4 facties × naming-lock.

**Deploy v0.37.30** — Blacksmith fix + LumberCamp upgrades. Verwacht runtime: ~30s gate, ~5s deploy.

---

## Bundel 2 — v0.37.31: UpgradeBuilding + Watchtower + Housing UX

**Focus**: T2/T3 buildings volledig functioneel + UX-feedback voor bestaande T2's.

### 2A. UpgradeBuilding research-pakket

**Tier-2 versies** van de 7 universele upgrades:

| ID | Naam | Cost | Effect | Prerequisite |
|----|------|------|--------|--------------|
| 13 | Zwaardvechten III | 350g | Infantry +3 dmg | MeleeAttack2 |
| 14 | Boogschieten III | 350g | Ranged +3 dmg | RangedAttack2 |
| 15 | Bepantsering III | 400g | All +1 armor | ArmorUpgrade2 |
| 16 | Snelle Mars II | 300g | All +10% speed | MoveSpeed1 |

Plus **1 unieke faction-research** per factie:

| Factie | Naam | Effect | Cost | Time |
|--------|------|--------|------|------|
| Brabant | Carnavalsvuur | Aura: alle units +10% dmg in 8u radius rond TownHall | 500g | 60s |
| Randstad | AI Optimization | Building production speed +20% globaal | 500g | 60s |
| Limburg | Mergelharnas | Heavy units +3 armor (extra van Bepantsering) | 500g | 60s |
| Belgen | Diamantgloeiende Wapens | Alle units krit-chance 5% | 500g | 60s |

**Tier-classificatie**:
- T2-versies: `requiresUpgradeBuilding=true` (canResearch valideert UpgradeBuilding complete).
- Faction-uniek: idem.

**Implementatie**:
- Extend `UPGRADE_DEFINITIONS` met 4 + 4 = 8 nieuwe upgrades.
- TechTreeSystem.canResearch: extra check `requiresUpgradeBuilding` veld → query world voor complete UpgradeBuilding.
- UpgradeBuilding selectie-paneel toont research-buttons via dezelfde component als Blacksmith (refactor zodat herbruikbaar).
- New entity-attribute systems voor effecten:
  - Carnavalsvuur: extend GezeligheidSystem met TownHall-radius dmg-mult.
  - AI Optimization: factor in ProductionSystem.update via faction-mult (analoog bureaucracyMod).
  - Mergelharnas: applyUpgradeToEntity affectsUnitTypes=[Heavy], bonusArmor=3.
  - Diamantgloeiende Wapens: extend CombatSystem.processAttacking met krit-roll vóór final damage.

**Tests**: +20 — 4 facties × (T2-prerequisite-chain + UpgradeBuilding-gate + uniek-effect-validation).

### 2B. Watchtower visualisatie

TowerSystem werkt al. Issue: speler ziet niet wat het doet.

- **Range-indicator** bij selectie: cirkel rond toren in tower-color. Fade-in/out op selectie.
- **Tooltip op mouseover**: "Auto-attack vijanden binnen 10u — 15 dmg/2.0s — sniper-bonus tegen ranged".
- **Status-text in selectie-paneel**: "Patrolling — Targets enemies in range".
- **Building card stat-display**: HP / Range / DPS / Armor.

**Tests**: UAT-04 — bouw Watchtower → selecteer → assert range-indicator-element visible + tooltip-text bevat "Auto-attack".

### 2C. Housing populatie-feedback

Housing werkt (`addPopulationCapacity(+8)`). Issue: geen feedback.

- **Toast bij completion**: "Huuske klaar — populatie-cap +8 (now 18/35)".
- **Selectie-paneel**: "Provides +8 population (Limburg)".
- **HUD-icoon**: kleine badge die bij population-counter verschijnt.

**Tests**: vitest-test dat building-completion event de PopulationCapacity bumpt + 'population-changed' event vuurt + toast-event.

**Deploy v0.37.31** — UpgradeBuilding research-pakket + Watchtower UX + Housing toast.

---

## Bundel 3 — v0.37.32: FactionSpecial1 (4 facties)

**Focus**: 4 nieuwe systems, niet-triviaal werk.

### 3A. Archetype data + factionBuildMenus

| Factie | Naam | Cost | HP | BuildTime | Tier | Hotkey |
|--------|------|------|----|-----------|------|--------|
| Brabant | **Carnavalstent** | 200g+150h | 600 | 35s | T2 (na Kermistent) | V |
| Randstad | **Boardroom** | 250g+200h | 700 | 40s | T2 | V |
| Limburg | **Vlaaiwinkel** | 200g+150h | 700 | 35s | T2 | V |
| Belgen | **Diplomatiek Salon** | 225g+175h | 650 | 40s | T2 | V |

- Voeg per factie FactionSpecial1 archetype toe in `factionData.ts FACTION_BUILDINGS`.
- Voeg `'build-faction1'` met hotkey `V` toe in `factionBuildMenus.ts` per factie (tier=2).
- BuildingRenderer fallback voor 'special1' (tijdelijk lumbercamp.glb per factie — Meshy-job apart).

### 3B. Vier system-implementaties

| Factie | Effect | System |
|--------|--------|--------|
| Brabant — Carnavalstent | +20% Gezelligheid in 12u radius (aura) | extend `GezeligheidSystem.ts` met building-source nearestCarnavalstent check |
| Randstad — Boardroom | "CEO Kwartaalcijfers" — production +50% globaal 30s, 2 min cooldown. Activeer via klik op gebouw | extend `BureaucracySystem.ts` met BoardroomBuff timer |
| Limburg — Vlaaiwinkel | Periodic heal-pulse 10 HP/5s op alle units in 10u radius | nieuwe `VlaaiwinkelSystem.ts` (query Position+Faction in radius, increment Health.current) |
| Belgen — Diplomatiek Salon | Random "diplomatie-event" elke 90s: vrede met 1 willekeurige vijand 30s, OF +200g/+100h, OF spawn 1 free Bierbouwer | nieuwe `DiplomatiekSalonSystem.ts` met RNG event-trigger + cooldown |

**Wiring**:
- SystemPipeline.add() per nieuwe system (Phase 4.7).
- Boardroom: klik-actie via building-card "Activeer Kwartaalcijfers" knop wanneer cooldown ready.

### 3C. Tests + UAT

**Tests**: +24
- 4 facties × archetype-data ✓
- 4 facties × hotkey V → place ✓
- 4 facties × tier-gate (T1 only after Blacksmith) ✓
- Per factie effect-validation (aura applies / heal-pulse fires / event-trigger / production-buff)

**Deploy v0.37.32** — FactionSpecial1 voor 4 facties.

---

## Bundel 4 — v0.37.33: Worstenbroodjeskraam + per-gebouw smoke UAT + mesh-audit

**Focus**: laatste gat dichten + comprehensive UAT-coverage.

### 4A. Brabant Worstenbroodjeskraam

- factionData.ts: voeg TertiaryResourceBuilding archetype toe voor Brabant. Cost 175g+125h, HP 500, buildTime 30s.
- factionBuildMenus.ts: hotkey X voor Brabant (was leeg, niet meer "skip" — line 58 comment update).
- TertiaryResourceSystem: add Brabant case → +0.5 Gezelligheid/sec passive per voltooide Worstenbroodjeskraam (los van GezeligheidSystem proximity-bonus).
- Display name lock in `getDisplayBuildingName(Brabanders, TertiaryResourceBuilding)` → "Worstenbroodjeskraam".

**Tests**: +6 — Brabant TertiaryResource archetype + X-hotkey + Gezelligheid-rate test (1 building → +0.5/s, 2 buildings → +1.0/s, dood building stopt).

### 4B. Per-gebouw smoke UAT-suite

Eind-fase: één Playwright UAT per gebouw-type per factie. Bundeled in `uat/04-buildings/` dir.

- 11 building types × 4 facties = 44 UAT-tests.
- Per test: select worker → bouw via hotkey → wacht complete (max 60s buildtime) → selecteer → assert juiste paneel + minstens 1 functioneel element (training-button OF research-button OF info-text).
- Runtime budget: 3-4 min totaal (parallel-friendly).

**Slim aanpak**: helper `buildAndSelect(page, faction, hotkey, expectedName)` om duplicatie te vermijden.

### 4C. 3D mesh audit doc

`docs/MESHY-BUILDING-GAPS.md` met:
- Per type per factie: bestaat GLB? Visueel passend?
- Prioriteitslijst voor Meshy v6 batch:
  - **HOOG**: UpgradeBuilding × 4 (nu Blacksmith.glb fallback) — speler ziet 2x dezelfde Smederij.
  - **HOOG**: FactionSpecial1 × 4 (nu lumbercamp.glb fallback).
  - **MEDIUM**: TertiaryResource × 4 voor non-LumberCamp lookalikes.
- Concept-art briefs (AI-prompt template per faction-aesthetic).
- Geen code-deploy, alleen documentatie + queue voor latere Meshy-job.

**Deploy v0.37.33** — Worstenbroodjeskraam + per-gebouw smoke UAT + mesh-audit doc.

---

## Verwachte impact (totaal 4 bundels)

| Metric | Voor | Na | Delta |
|--------|------|-----|-------|
| Test-suite | 1059 | ~1170 | +111 (+10%) |
| UAT-suite | 2 | ~46 | +44 |
| Code (src/) | huidig | +~1500 lines | |
| Tests (tests/) | huidig | +~600 lines | |
| Sessie-runtime | — | 4-6 uur (parallel agents) | |
| Deploys | — | 4 (gate-gated) | |

---

## Werkvolgorde (start hier bij sessie-begin)

### Pre-flight (5 min)
1. `/session-start` — laadt context, runt UAT/typecheck baseline.
2. Lees deze plan-file.
3. `npm test` — bevestig 1059 groen.

### Bundel 1 (~90 min)
4. **Spawn parallel agents**:
   - Explore-agent → `HUD.showBlacksmithPanel()` volledig mappen (welke listeners, welke selectors, hoe is click bound).
   - General-purpose → LumberCamp-upgrade design-doc met exacte UpgradeId values + factie-naming-tabel.
5. Wacht op beide agents.
6. Schrijf red-tests (Blacksmith click + LumberCamp upgrade-flow).
7. Fix Blacksmith → groen.
8. Implementeer LumberCamp upgrades → groen.
9. Run gate → deploy v0.37.30 → live-test (Richard).

### Bundel 2 (~90 min)
10. Bouwt voort op v0.37.30. UpgradeBuilding research-pakket + UX-tweaks.
11. Run gate → deploy v0.37.31 → live-test.

### Bundel 3 (~120 min)
12. FactionSpecial1 — meeste werk vanwege 4 system-implementaties.
13. Run gate → deploy v0.37.32 → live-test.

### Bundel 4 (~60 min)
14. Worstenbroodjeskraam + UAT-coverage + mesh-doc.
15. Run gate → deploy v0.37.33 → live-test.

### Sessie-end
16. `/session-end` — werk bevindingen in memory in.

---

## Risico's + mitigaties

| Risico | Mitigatie |
|--------|-----------|
| Blacksmith-bug zit dieper dan UI-laag | Spawn diepere debug-agent, plan kan in worst case bundel-1 splitsen in twee deploys |
| FactionSpecial1 systems botsen met bestaande pipeline | Per system aparte test-file + integration-test in SystemPipeline-execution-order |
| 44 UAT-tests overschrijden Playwright timeout | Run sequential per faction-batch, meet runtime in stap 1 voor extrapolatie |
| Live-test toont onverwacht gedrag (zoals 0.37.27 silent-fail) | Per bundel een dedicated "speel mission 1 + skirmish small map" check-list voor Richard |

---

## Huidige tasks (status)

- #20 [pending] **F5 follow-up — UpgradeBuilding functionaliteit** → opgelost in Bundel 2.
- #22 [pending] **F5 follow-up — Per-gebouw audit (visueel + functie)** → opgelost gedurende alle 4 bundels.

Beide markeren als completed na v0.37.33.
