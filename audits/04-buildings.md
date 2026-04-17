# Audit 04 — Building Behavior per Factie

**Versie**: RoB v0.37.2 | **Datum**: 2026-04-17 | **Scope**: Elk building-type × 4 facties (Brabanders, Randstad, Limburgers, Belgen)

---

## 1. Executive Summary

Placement werkt voor standaard-gevallen (zie audit 01). Core issues zitten in **productie-configuratie** en **ontbrekende feature-systems**:

- `SiegeWorkshop` heeft **menu-buttons maar geen building-data** voor meerdere facties → ghost-feature.
- `FactionSpecial2` produceert **Infantry/Ranged** terwijl PRD Heavy/Siege voorschrijft → tier 3 advanced units unreachable.
- **Garrison, Repair, Walls, Gates, Bridges** bestaan niet als mechanic.
- **Faction-specifieke upgrades** zijn als enum gedefinieerd maar ontbreken in `UPGRADE_DEFINITIONS`.

---

## 2. Existence Matrix (factie × building)

| Building | Brabanders | Randstad | Limburgers | Belgen | Tier | Cost match |
|----------|------------|----------|------------|--------|------|------------|
| TownHall | ✅ Boerderij | ✅ Hoofdkantoor | ✅ Mergelhoeve | ✅ Stadhuis | T1 | ✅ |
| Barracks | ✅ Cafe | ✅ Vergaderzaal | ✅ Schuttershal | ✅ Frituur | T1 | ✅ |
| LumberCamp | ✅ Houtzagerij | ✅ Starbucks | ✅ Vlaaibakkerij | ✅ Frietfabriek | T1 | ✅ |
| Blacksmith | ✅ Kermistent | ✅ Coworking | ✅ Klooster | ✅ EU-Parlement | T1 | ✅ |
| Housing | ✅ Boerenhoeve | ✅ Vinex-wijk | ✅ Huuske | ✅ Brusselse Woning | T2 | ✅ |
| DefenseTower | ✅ Kerk | ✅ Kantoortoren | ✅ Wachttoren | ✅ Commissiegebouw | T2 | ✅ |
| TertiaryResource | ❌ | ❌ | ✅ Mijnschacht | ✅ Chocolaterie | T2 | ⚠️ |
| UpgradeBuilding | ❌ | ❌ | ❌ | ❌ | T2 | ❌ |
| FactionSpecial1 | ✅ Dorpsweide | ❌ | ❌ | ❌ | T1/T2 | ⚠️ |
| FactionSpecial2 | ✅ Feestzaal | ✅ Parkeergarage | ✅ Mijnwerkerskamp | ✅ Rijschool | T3 | ✅ |
| SiegeWorkshop | ✅ Tractorschuur | ✅ Sloopwerf | ✅ Steengroeve | ✅ Frituurkanon | T3 | ✅ (in labels) |

Bron: `src/data/factionData.ts:799-1320`, `src/ui/HUD.ts:246-285`.

---

## 3. Findings per Categorie

### 3.1 Economy

**LumberCamp (resource generator)**
- Alle 4 facties gedefinieerd.
- Kosten/bouwtijd matchen PRD.
- `produces: []` — passief inkomen aangenomen, geen active production. OK.
- **Issue**: alle resource-buildings gebruiken dezelfde `BuildingTypeId.LumberCamp` slot — er is geen onderscheid tussen primair (wood) en secundair (bier/frietvet) per factie. Data is factie-gelabeld maar typeId is monolithisch.

**Housing**
- Alle 4 facties gedefinieerd.
- Pop-cap formule onduidelijk. Geen expliciete `+N population` per Housing zichtbaar in `PlayerState.ts`. **Verificatie nodig**.

**TertiaryResource**
- Alleen Limburgers (Mijnschacht) + Belgen (Chocolaterie).
- **PRD vereist**: Brabanders (Gezelligheid), Randstad (Havermoutmelk) — ontbreken volledig.

### 3.2 Military

**Barracks**
- Alle facties, `produces: [Infantry, Ranged]`, werkt.
- Queue-systeem: `ProductionSystem.ts:154-203` implementeert progress, spawn, shiftQueue, pop-cap check.
- **Gap**: geen pause-UI persistence, geen auto-cancel bij resource-verlies, geen refund on cancel in HUD.

**FactionSpecial2 (tier 3 advanced)**
- Alle facties bestaan met correcte kosten/tijd.
- **KRITIEK**: `produces: [Infantry, Ranged]` — zelfde als Barracks! PRD schrijft Heavy/Siege-tier voor (Tractorrijder, Hipster, Mergelridder, Frituurridder, etc.).
- Gevolg: alle Heavy/Siege units zijn **unreachable** via productie (zie audit 03, 18+ units).

**SiegeWorkshop**
- HUD heeft buttons (`HUD.ts:246,255,264,274`) met labels per factie en hotkey G.
- **Geen building-entry in `FACTION_BUILDINGS`** voor meerdere facties.
- Klik op button → geen spawn. **Ghost feature**.

### 3.3 Support / Defense

**DefenseTower**
- Alle facties gedefinieerd. `TowerSystem.ts:49-133` — range 14, damage 15, cooldown 1.5s.
- **Hard-coded stats**: geen tier-scaling, geen upgrade-impact, faction-identiek.
- **Geen garrison-integration** (zie 3.5).
- **Placement-bug** (zie audit 01): zou op river moeten maar geen check.

**FactionSpecial1 — Dorpsweide (Brabanders)**
- Cost 150/100, 20s.
- PRD: "Gezelligheid burst bij 20+ units in range".
- **Code**: `GezeligheidSystem.ts` bestaat, maar `Dorpsweide` heeft geen ability-hook. Passieve building.
- Andere facties hebben geen FactionSpecial1 — waarschijnlijk gap in data.

**Wafelkraam (Belgen, PRD)**
- PRD: "Support (mobile heal)".
- **Code**: niet gevonden in `FACTION_BUILDINGS`. Of: bestaat als Barracks-variant, niet als aparte building.

### 3.4 Town

**TownHall**
- Alle facties, kosten 0, instant build (spawn-only, niet herbouwbaar).
- HP-asymmetrie: 1500/1700/1800/1400 per PRD.
- Sight: 11-12 per factie.
- `produces: [Worker]` — werkt.
- Resource drop-off: niet expliciet gevonden in deze scan — waarschijnlijk in `GatherSystem`, vereist verdere check.

### 3.5 Ontbrekende Systems

| Feature | Status | Impact |
|---------|--------|--------|
| Garrison | ❌ component + system ontbreekt | Towers/houses niet defensief bruikbaar |
| Repair | ❌ geen command, geen worker-assignment | Beschadigde gebouwen herstellen niet |
| Walls | ❌ geen BuildingTypeId | PRD §2.2 belooft ze |
| Gates | ❌ idem | Idem |
| Bridges | ❌ geen eigen type (zie audit 01, 06) | Overlapt met DefenseTower-bug |

---

## 4. Tier-Lock

`TechTreeSystem.ts:174-195` definieert:
- T1 = TownHall, Barracks, LumberCamp, Blacksmith
- T2 = Housing, DefenseTower, TertiaryResource, FactionSpecial1, UpgradeBuilding
- T3 = FactionSpecial2, SiegeWorkshop

Gate-logic:
- T2 gate = completed Blacksmith (line 298).
- T3 gate = completed UpgradeBuilding (line 305+).

**Issue**: `UpgradeBuilding` staat zelf in T2 terwijl T3 het vereist — circulair. Geen factie heeft `UpgradeBuilding` in `FACTION_BUILDINGS` → de gate is onbereikbaar.

**Gevolg**: T3 buildings (FactionSpecial2, SiegeWorkshop) zijn in praktijk ofwel altijd-gelocked, ofwel de check valt stilzwijgend weg (vereist verificatie).

---

## 5. Research / Upgrades

`UPGRADE_DEFINITIONS` (`TechTreeSystem.ts:71-163`):
- 7 universele upgrades: MeleeAttack 1-2, RangedAttack 1-2, ArmorUpgrade 1-2, MoveSpeed 1.
- Cost 150-300, duur 30-50s.

**Gaps**:
1. Factie-specifieke upgrades uit `types/index.ts:120-157` (GezelligheidsBoost, CarnavalsRage, etc.) **staan niet in UPGRADE_DEFINITIONS**.
2. Geen per-building research panel zichtbaar. HUD heeft `'research-upgrade'` command (HUD.ts:62) maar geen UI-entry bij Blacksmith.
3. Retroactieve toepassing op bestaande units: `getCompleted()` bestaat (line 261) maar applicatie in `CombatSystem` is niet expliciet geverifieerd.

---

## 6. Production Queue (detail)

- `Production` component, max 5 slots (`types/index.ts:279 MAX_QUEUE_SLOTS`).
- Progress: `dt / effectiveDuration`.
- Completion: `shiftQueue()`.
- Rally offset: `RALLY_OFFSET = 3.0`, scatter ±1.5.
- `RallyPoint` component aan TH/Barracks (`factories.ts:502, 538, 733`).

**Gaps**:
- `onQueueCancel(buildingId, queueIndex)` callback aanwezig (HUD.ts:142) → implementatie niet gevonden. Geen refund.
- Pause-state niet expliciet.
- Rally point is vast ingesteld; user-adjustable zit in `Game.ts:2146` (rally-mode) maar resource-targeting faalt (zie audit 02).

---

## 7. Faction-Special Ability Status

| Factie | Special1 | Special2 | Ability | Status |
|--------|----------|----------|---------|--------|
| Brabanders | Dorpsweide | Feestzaal | Carnavalsrage | ⚠️ data aanwezig, geen hook |
| Randstad | ❌ | Parkeergarage | Eindeloze Vergadering | ⚠️ geen hook |
| Limburgers | ❌ | Mijnwerkerskamp | ? | ❌ niet gespec |
| Belgen | ❌ | Rijschool | ? | ❌ niet gespec |

---

## 8. PRD ↔ Data ↔ Runtime Inconsistenties

| Issue | PRD | Data | Runtime | Fix-niveau |
|-------|-----|------|---------|------------|
| SiegeWorkshop buildings ontbreken | ✅ | ❌ | ❌ | Data toevoegen |
| TertiaryResource Brab+Rand | ✅ | ❌ | ❌ | Data toevoegen |
| FactionSpecial2 unit-produce wrong | Heavy/Siege | Infantry/Ranged | Wrong units | Data fix |
| Factie upgrades missen | ✅ | enum alleen | ❌ | UPGRADE_DEFINITIONS aanvullen |
| Garrison | ✅ | ❌ | ❌ | Nieuw system + component |
| Repair | ✅ | ❌ | ❌ | Nieuw command + worker AI |
| Walls/Gates | ✅ | ❌ | ❌ | Nieuwe building types |

---

## 9. Prioritized Fix Approach

**P0 — Unblock progressie**
1. `FactionSpecial2.produces` → Heavy/Siege unit-ids per factie.
2. SiegeWorkshop: voeg `FACTION_BUILDINGS` entries toe met `produces: [siege units]`.
3. T3 gate: vervang `UpgradeBuilding`-gate door FactionSpecial1 of TownHall-upgrade, of voeg UpgradeBuilding data toe.

**P1 — Feature completeness**
4. Garrison-component + GarrisonSystem (enter/exit, garrisoned-counter-attack, heal-inside).
5. Repair-command + worker-AI state `REPAIRING`.
6. TertiaryResource voor Brab+Rand.

**P2 — Polish**
7. Faction-upgrades in `UPGRADE_DEFINITIONS`.
8. Queue cancel-with-refund, pause-state, UI.
9. DefenseTower stats schaalbaar via upgrades.
10. Walls/Gates basic implementation.

---

## 10. Files Audited

- `src/data/factionData.ts`
- `src/systems/BuildSystem.ts`
- `src/systems/ProductionSystem.ts`
- `src/systems/TechTreeSystem.ts`
- `src/systems/TowerSystem.ts`
- `src/systems/GezeligheidSystem.ts`
- `src/ui/HUD.ts`
- `src/ui/BuildingPortraits.ts`
- `src/types/index.ts`
- `PRD-v1.0.md`

---

**Einde audit 04.**
