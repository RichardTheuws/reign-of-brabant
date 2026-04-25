# Volgende sessie: gebouwen volledig functioneel maken

**Versie target**: v0.37.30 — v0.37.40 (~10 atomic deploys via gate)
**Voorbereiding**: 2026-04-25 (na v0.37.29 terrain-fix)
**Aanpak**: stap-voor-stap. Elke stap = red-test → fix → groene UAT-uitbreiding → atomic commit + deploy.
**Werkwijze**: pre-deploy regression gate (`npm run test:all`) blokkeert breakage. Per stap een version-bump.

---

## Doel

Elk gebouw in het portfolio moet voldoen aan:
1. **Functie**: doet iets nuttigs (training / research / resource gen / combat / population / Tier-gate).
2. **Naam**: factie-specifiek (geen "Gebouw" fallback) — al gefixt in v0.37.28.
3. **Mesh**: 3D-model dat past bij de factie. Fallback acceptabel als visueel niet broken.
4. **UI-feedback**: tooltip + selectie-paneel laat duidelijk zien wat dit gebouw doet.
5. **Test-coverage**: red-test → fix → permanente lock (regression-class).

---

## Pre-flight: blocker-diagnose

### Stap 0 — Blacksmith research live debug

**Vraag aan Richard**: bij selectie van Kermistent/Coworking Space/Klooster/EU-Parlement…
- Verschijnt het paneel met 7 upgrade-knoppen?
- Click op knop: hoor je sound, verandert gold?
- Progress-bar: tikt die?

Drie scenario's:
- **Paneel verschijnt niet** → bug in `Game.ts:1979 showBlacksmithResearchUI` of `HUD.showBlacksmithPanel`. Diagnose via Playwright UAT die `cmd-blacksmith` panel-visibility checkt na Blacksmith-selectie.
- **Knop click → niets** → onClick handler niet bound, of `techTreeSystem.startResearch` faalt silently. Voeg console-logs of vitest-integratie-test toe die DOM-click → research-started event valideert.
- **Knop werkt, geen progress** → `getResearchProgress` kapot, of HUD update-tick mist. Check `update()` loop.

**Output**: 1 commit met debug-fix + UAT-03 die Blacksmith-flow eind-tot-eind dekt. v0.37.30.

---

## Stap-voor-stap implementatie

### A. Stap 1 — Blacksmith UI fix + UAT-03 (als debug-resultaat aanwijst)

- **Red-test (vitest)**: integratie test die DOM-click op `[data-action="research-X"]` triggert en `research-started` event verifieert.
- **Red-test (UAT)**: Playwright `uat/03-blacksmith-research.spec.ts` — start skirmish, bouw Cafe → Kermistent → wacht complete → klik upgrade → assert HUD toont progress-bar.
- **Fix**: per debug-resultaat.
- **Lock**: panel altijd zichtbaar als Blacksmith complete + selected; click-handler altijd bound; progress tikt elke frame.
- **Deploy**: v0.37.30.

### B. Stap 2 — LumberCamp upgrades (3 per factie)

LumberCamp is nu pure drop-off. Klassieke RTS hebben hier upgrades. Voorstel per factie 3 wood-upgrades:

| Upgrade | Effect | Cost | Time |
|---------|--------|------|------|
| Bijl I | Workers carry +5 wood | 100g | 30s |
| Bijl II | Workers carry +5 wood (stacks) | 175g | 45s |
| Snelle Kap | Wood gather rate +25% | 200g | 40s |

**Per-factie naming** (factionData.ts brabantName field):
- Brabant Bakkerij: "Stevigere Manden" / "Volkoren Brood" / "Snellere Bakker"
- Randstad Starbucks: "Latte Capacity" / "Cold Brew Bonus" / "Caffeine Kick"
- Limburg Vlaaibakkerij: "Grotere Vlaai" / "Suiker-Boost" / "Snellere Oven"
- Belgen Frietfabriek: "XL Patatzak" / "Mayo-Reserve" / "Snel Frituren"

**Implementatie**:
- Voeg 3 nieuwe UpgradeId enum-waarden toe (Wood1/Wood2/WoodSpeed).
- Extend `UPGRADE_DEFINITIONS` met affectsUnitTypes=[Worker] en bonusCarry/bonusGatherSpeed velden.
- New components: `WorkerUpgrades { carryBonus, gatherSpeedMult }`.
- TechTreeSystem.applyUpgradeToEntity ondersteunt nu carry/gather mods.
- LumberCamp's selection-panel toont 3 research-buttons (analoog aan Blacksmith).
- **Tier classificatie**: LumberCamp-upgrades zijn **Tier 1** (geen Blacksmith vereist). Direct beschikbaar.

**Tests**: +18 (3 upgrades × 4 facties × cost-deduct + retroactive-apply + new-unit-apply + worker-carry-test).
**Deploy**: v0.37.31.

### C. Stap 3 — Watchtower visualisatie + tooltip

TowerSystem werkt al (auto-attack range 10, dmg 15). Issue: speler ziet niet wat het doet.

- **Range-indicator** bij selectie: cirkel rond toren in tower-color. Fade-in/out op selectie.
- **Tooltip op mouseover**: "Auto-attack vijanden binnen 10u — 15 dmg/2.0s — sniper-bonus tegen ranged".
- **Status-text in selectie-paneel**: "Patrolling | Targets enemies in range".
- **Building card stat-display**: HP / Range / DPS / Armor.

**Geen functionele wijziging — alleen UX/feedback**.
**Tests**: UAT-04 — bouw Watchtower → selecteer → assert range-indicator visible + tooltip-text bevat "Auto-attack".
**Deploy**: v0.37.32.

### D. Stap 4 — Housing visuele feedback + populatie-toast

Housing werkt (Game.ts:3326 `addPopulationCapacity(+8)`). Issue: geen feedback bij plaatsing.

- **Toast bij completion**: "Huuske klaar — populatie-cap +8 (now 18/35)".
- **Selectie-paneel**: "Provides +8 population (Limburg)".
- **HUD-icoon**: kleine badge die bij population-counter verschijnt voor elk Housing.

**Tests**: vitest-test dat building-completion event de PopulationCapacity bumpt + toast-event vuurt.
**Deploy**: v0.37.33.

### E. Stap 5 — UpgradeBuilding research-pakket

UpgradeBuilding is alleen Tier-3 gate. Voorstel:
- **Tier-2 versies** van de 7 universele upgrades (Zwaardvechten III, Boogschieten III, Bepantsering III, Snelle Mars II) — affectsUnitTypes overerft van Tier-1, costs 1.5×, prerequisite=Tier-2-versie.
- **1 unieke faction-upgrade** per factie:
  - Brabant Wagenbouwer: "Carnavalsvuur" — alle units +10% damage in 8u radius rond eigen TownHall (Aura).
  - Randstad Innovatie Lab: "AI Optimization" — building production speed +20%.
  - Limburg Hoogoven: "Mergelharnas" — Heavy units +3 armor.
  - Belgen Diamantslijperij: "Diamantgloeiende Wapens" — alle units krit-chance 5%.

**Implementatie**:
- 4 nieuwe UpgradeId enum-waarden + 4 Tier-2 stat-versies van de bestaande 4.
- TechTreeSystem ondersteunt prerequisite-check op Tier-1 → Tier-2 chain.
- UpgradeBuilding selectie-paneel toont research-buttons (analoog Blacksmith).
- TIER_2_UPGRADES set + canResearch check: vereist UpgradeBuilding complete.

**Tests**: +20 (4 facties × 5 upgrades + chain-validation + retroactive-apply).
**Deploy**: v0.37.34.

### F. Stap 6 — FactionSpecial1 design + implementatie

Niets van bestaande data. Ontwerp + bouwen vanaf nul.

**Ontwerp per factie**:

| Factie | Naam | Functie | Cost | HP | BuildTime | Tier |
|--------|------|---------|------|----|-----------|------|
| Brabant | **Carnavalstent** | Aura: +20% Gezelligheid in 12u radius | 200g+150h | 600 | 35s | T2 (na Kermistent) |
| Randstad | **Boardroom** | CEO Kwartaalcijfers — production +50% globaal 30s, 2 min cooldown | 250g+200h | 700 | 40s | T2 |
| Limburg | **Vlaaiwinkel** | Periodic heal-pulse (10 HP/5s) op alle units in 10u radius | 200g+150h | 700 | 35s | T2 |
| Belgen | **Diplomatiek Salon** | Spawn random "diplomatie-events" (vrede met 1 vijand 30s, of bonus-resources) | 225g+175h | 650 | 40s | T2 |

**Implementatie**:
- Voeg per factie FactionSpecial1 archetype toe in factionData.ts.
- Voeg `'build-faction1'` met hotkey `V` (free) toe in factionBuildMenus.ts.
- Per factie een aparte system-trigger:
  - Brabant: extend `GezeligheidSystem` met `Carnavalstent`-aura.
  - Randstad: extend `BureaucracySystem` met `BoardroomBuff`.
  - Limburg: nieuwe `VlaaiwinkelSystem` (heal pulses, query Position+Faction in radius).
  - Belgen: nieuwe `DiplomatiekSalonSystem` (random event-trigger met cooldown).
- BuildingRenderer mapping voor 'special1' (4 modellen — Meshy-job, voor nu fallback naar lumbercamp.glb).

**Tests**: +24 (4 facties × archetype-data + tier-gate + system-effect-validation).
**Deploy**: v0.37.35.

### G. Stap 7 — TertiaryResource clarification (Brabant)

Brabant heeft géén TertiaryResourceBuilding (Gezelligheid is proximity-based via GezeligheidSystem). Andere facties hebben er wel een. Issue: speler verwacht het misschien voor Brabant ook.

- **Optie A**: Voeg "Worstenbroodjeskraam" toe voor Brabant (+1 Gezelligheid passive, niet proximity). Vergroot Brabant's strategische opties.
- **Optie B**: Document de afwezigheid in tooltip + tutorial-tekst.

**Voorstel**: A — Worstenbroodjeskraam (X-hotkey, 175g+125h, 500 HP, +0.5 Gezelligheid/sec). Past bij theme.

**Tests**: +6 (Brabant Worstenbroodjeskraam archetype + X-hotkey + Gezelligheid-rate test).
**Deploy**: v0.37.36.

### H. Stap 8 — Per-gebouw 3D mesh audit

Voor elk type per factie (16 modellen): bestaat het GLB? Past het bij faction-flavour? Audit:

- TownHall × 4 ✅ (bestaand)
- Barracks × 4 ✅
- LumberCamp × 4 ✅
- Blacksmith × 4 ✅
- Housing × 4 — check
- DefenseTower × 4 — check
- TertiaryResource × 4 — gebruikt LumberCamp.glb fallback (Game.ts) — visueel toe te wijzen?
- UpgradeBuilding × 4 — fallback Blacksmith.glb (we wisten dat) — Meshy-job
- FactionSpecial1 × 4 — fallback (Meshy-job na stap 6)
- FactionSpecial2 × 4 ✅
- SiegeWorkshop × 4 ✅

**Output**: `docs/MESHY-BUILDING-GAPS.md` met prioriteitslijst voor Meshy v6 batch (UpgradeBuilding 4× + FactionSpecial1 4× = 8 modellen × 5min = 40 min werk).
**Deploy**: geen code-deploy — alleen documentatie + Meshy-jobs queueen.

### I. Stap 9 — Per-gebouw smoke UAT (groeit suite)

Eindfase: één Playwright UAT per gebouw-type die de complete flow valideert:
- Selecteer worker → bouw gebouw via hotkey → wacht complete → selecteer → assert juiste paneel + functies.

**Tests**: 11 buildings × 4 facties = 44 UAT-tests, gebundeld als `uat/04-buildings/` dir. Verwachte runtime: ~3 min totaal.
**Deploy**: v0.37.37.

---

## Beslis-momenten voor Richard

Voor we starten:

1. **Blacksmith debug**: zie je het paneel of niet? (Bepaalt of we stap 1 echt nodig hebben.)
2. **FactionSpecial1 designs**: akkoord met Carnavalstent/Boardroom/Vlaaiwinkel/Diplomatiek Salon? Of liever andere ideeën?
3. **TertiaryResource voor Brabant**: optie A (Worstenbroodjeskraam) of B (alleen documenteren)?
4. **Tempo**: 1 deploy per stap (10 deploys), of bundelen tot 3-4 deploys?

---

## Verwachte impact

- **Code**: ~1500 regels src/ + ~600 regels tests.
- **Test-suite groei**: 1059 → ~1170 (+~110, +10%).
- **UAT-suite groei**: 2 → ~46.
- **3D-modellen via Meshy**: 8-16 nieuwe (fase H apart).
- **Sessieduur**: 4-6 uur als parallel agents goed schalen, anders 8-10 uur.

---

## Werkvolgorde-aanbeveling (start hier)

1. Spawn 3 parallel agents: Blacksmith-debug + LumberCamp-upgrade-design + FactionSpecial1-system-architecture.
2. Wacht op alle 3 → werk synthese in dit plan in.
3. Stap 1 → 9 chronologisch, version-bump per stap.
4. Na elke deploy: Richard live-test 1 specifieke flow om te confirmeren.
