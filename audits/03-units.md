# Unit Gameplay Audit — Reign of Brabant v0.37.2

**Auditeer**: Gameplay audit per ELK unit type per factie  
**Focusgebied**: Archetype + Factory + Stats + Combat + Abilities + Production + Upgrades + Heroes  
**Scope**: 4 Facties × 7+ unit types (Worker, Infantry, Ranged, Heavy, Siege, Support, Special) + 8 Heroes  
**Audit Date**: 17 Apr 2026  

---

## 1. BEKNOPT RAPPORT PER FACTIE

### 1.1 BRABANDERS
**Status**: GEDEELTELIJK WERKEND (⚠️)

| Unit | Archetype | Factory | Stats | Move | Combat | Abilities | Produce | Upgrades | Notes |
|------|-----------|---------|-------|------|--------|-----------|---------|----------|-------|
| Boer (Worker) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Gather implemented |
| Carnavalvierder (Inf) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Polonaise ability missing |
| Sluiper (Ranged) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Smokkelroute missing |
| Boerinne (Support) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Healer working (healRate=7) |
| Muzikant (Ranged/Buff) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ MISSING | ⚠️ | T2 unit not in barracks |
| Tractorrijder (Heavy) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ MISSING | ⚠️ | T2 unit, no producer |
| Frituurmeester (Siege) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ MISSING | ❌ | T3 unit, SiegeWorkshop not built |
| Praalwagen (SuperSiege) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ MISSING | ❌ | T3 unit, never spawns |
| Prins v.Brabant (Hero) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | N/A | Abilities skeleton only |
| Boer v.Brabant (Hero) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | N/A | Abilities skeleton only |

**Kritieke Gaps**:
- Muzikant: in `FACTION_UNITS` (line 243-261) maar NIET in barracks `produces` (line 826)
- Tractorrijder: in `FACTION_UNITS` (line 262-280) maar NIET in barracks `produces`
- Frituurmeester & Praalwagen: in data maar GEEN gebouw kan ze produceren (SiegeWorkshop missing)
- All unit abilities: mapped in `unitAbilityMap.ts` (lines 35-61) maar handlers NOT in `UnitAbilitySystem.ts`

---

### 1.2 RANDSTAD
**Status**: GEDEELTELIJK WERKEND (⚠️)

| Unit | Archetype | Factory | Stats | Move | Combat | Abilities | Produce | Upgrades | Notes |
|------|-----------|---------|-------|------|--------|-----------|---------|----------|-------|
| Stagiair (Worker) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Worker |
| Manager (Infantry/Ranged) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | Ranged (ATK=9, range=7) |
| Consultant (Debuff) | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | **ATK=0 in data** (intentional per PRD) |
| Hipster (Scout) [T2] | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ MISSING | ❌ | T2 unit, no producer |
| HR-Medewerker (Support) [T2] | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ MISSING | ❌ | T2 unit, no producer |
| CorporateAdvocaat (Heavy) [T2] | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ MISSING | ❌ | T2 unit, no producer |
| Influencer (Ranged/AoE) [T2] | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ MISSING | ❌ | T2 unit, no producer |
| Vastgoedmakelaar (Siege) [T3] | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ MISSING | ❌ | T3 siege, no producer |
| De CEO (Hero) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | N/A | Kwartaalcijfers partially impl |
| De Politicus (Hero) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | N/A | Abilities skeleton only |

**Kritieke Gaps**:
- Hipster, HR-Medewerker, CorporateAdvocaat, Influencer: T2 units in data maar GEEN barracks can produce
- Vastgoedmakelaar: T3 siege in data maar SiegeWorkshop missing
- All T2/T3 units require tech-tree unlock NOT IMPLEMENTED for unit production

---

### 1.3 LIMBURGERS
**Status**: GEDEELTELIJK WERKEND (⚠️)

| Unit | Archetype | Factory | Stats | Move | Combat | Abilities | Produce | Upgrades | Notes |
|------|-----------|---------|-------|------|--------|-----------|---------|----------|-------|
| Mijnwerker (Worker) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Worker + armored (armor=1) |
| Schutterij (Infantry) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Melee, armored |
| Vlaaienwerper (Ranged) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | Debuff ability missing |
| Mergelridder (Heavy) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | Tankiest unit (HP=250, armor=4) |
| Kolenbrander (Siege) [T3] | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ MISSING | ❌ | T3 siege, no producer |
| Sjpion (Support) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Healer (healRate=7) |
| Mijnrat (Sabotage) [T3] | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ MISSING | ❌ | T3 unit, no producer |
| Heuvelwacht (Scout) [T1] | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | Scout (speed=8, range=4) |
| De Mijnbaas (Hero) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | N/A | Abilities skeleton only |
| De Maasridder (Hero) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | N/A | Abilities skeleton only |

**Kritieke Gaps**:
- Mergelridder: in barracks `produces` (line 1066) but typeId = `UnitTypeId.Ranged` (wrong!)
- Kolenbrander & Mijnrat: T3 units NOT producible (SiegeWorkshop missing)
- Heuvelwacht: "Scout" unit but produces = Ranged (line 1066), should be own tier-1 option

---

### 1.4 BELGEN
**Status**: GEDEELTELIJK WERKEND (⚠️)

| Unit | Archetype | Factory | Stats | Move | Combat | Abilities | Produce | Upgrades | Notes |
|------|-----------|---------|-------|------|--------|-----------|---------|----------|-------|
| Frietkraamhouder (Worker) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Worker |
| Bierbouwer (Infantry) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | Fast attacker (attackSpeed=1.2) |
| Chocolatier (Ranged) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | Support ranged |
| Frituurridder (Heavy) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ | T2 heavy, no producer |
| Manneken Pis-kanon (Siege) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ MISSING | ❌ | T3 siege, no producer, highest building DPS |
| Wafelzuster (Support) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Healer (healRate=7) |
| Dubbele Spion (Sabotage) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ MISSING | ❌ | T3 spy, no producer |
| De Frietkoning (Hero) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | N/A | Abilities skeleton only |
| De Abdijbrouwer (Hero) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | N/A | Abilities skeleton only |

**Kritieke Gaps**:
- Frituurridder: T2 heavy but NOT in barracks `produces`
- Manneken Pis-kanon: Highest siege building DPS (6.0x) but UNREACHABLE
- Dubbele Spion: T3 spy not producible

---

## 2. GEDETAILLEERDE FINDINGS

### 2.1 UNIT ARCHETYPES & STATS

**✅ WERKEND**: Alle 38 non-hero units hebben stats in `factionData.ts::FACTION_UNITS` (lines 160-792)
- HP, ATK, speed, range, armor, cost, buildTime allemaal gedefinieerd
- Armor types correct (Unarmored, Light, Medium, Heavy)
- Siege bonus & splash radius voor siege units aanwezig

**⚠️ DATA INCONSISTENCIES**:
1. **Consultant (Randstad Ranged)**: ATK=0 intentioneel (PRD spec) maar CombatSystem will crash or deal MIN_DAMAGE  
   - **File**: `src/data/factionData.ts:370-387`
   - **Issue**: No special handling for zero-damage debuffer
   - **Risk**: Unit is useless in combat (only debuffs matter)

2. **Mergelridder mislabeled**:
   - **In data**: typeId = `UnitTypeId.Heavy` (correct per PRD)
   - **In barracks**: `produces = [UnitTypeId.Ranged]` (line 1066 comment says "Schutterij, Vlaaienwerper, Heuvelwacht")
   - **Issue**: Barracks can't distinguish which Ranged unit to train
   - **File**: `src/data/factionData.ts:1066` Limburgers Schuttershal

3. **Heuvelwacht tier-lock missing**:
   - Data says T1 Scout (no prerequisite)
   - But should be produced from barracks alongside Infantry
   - **File**: `src/data/factionData.ts:629-647`

### 2.2 FACTORIES

**✅ WERKEND**:
- `createUnit()` (line 679): Dispatches to typeId (Worker/Infantry/Ranged/Heavy/Siege/Support)
- `createFactionUnit()` (line 771): Lookup by name works
- Both resolve stats from `factionData` correctly
- `initUnit()` properly initializes all components

**⚠️ PRODUCTION ISSUE**: Units not in `produces` list can never spawn
- No Siege Workshop or Advanced Barracks
- No tier-lock on unit training
- **File**: `src/entities/factories.ts:679-750`

### 2.3 COMBAT SYSTEM

**✅ WERKEND**:
- Attack timer ticking: `src/systems/CombatSystem.ts:151-158`
- Damage formula: `attack - (armor * 0.5)`, min 1 ✅
- Armor type modifiers (rock-paper-scissors): `src/systems/CombatSystem.ts:55-65`
  - Melee vs Light: +50% ✅
  - Ranged vs Medium: +50% ✅
  - Siege vs Building: +200% ✅
  - Magic vs Heavy: +50% ✅
- Siege bonus applied: `src/systems/CombatSystem.ts:168-170`
- Stunned/Invincible checks: `src/systems/CombatSystem.ts:82, 155-160`

**✅ HEALER SYSTEM**:
- Support units heal allies: `src/systems/HealingSystem.ts:36-110`
- healRate component applied correctly: `src/entities/factories.ts:238-244`
- All Support units have healRate > 0 in data ✅

**DPS VERIFIED** (sample):
- Boer (Worker): 5 ATK × 1.5 speed = 3.33 DPS ✓
- Carnavalvierder (Inf): 10 ATK × 1.2 speed = 8.33 DPS ✓
- Sluiper (Ranged): 12 ATK × 1.8 speed = 6.67 DPS ✓
- Boerinne (Healer): 8 ATK × 1.5 speed = 5.33 DPS (+ heal 7 HP/s) ✓

### 2.4 MOVEMENT

**✅ WERKEND**:
- `src/systems/MovementSystem.ts`: Smooth pathfinding
- Speed multipliers applied: base speed × GezeligheidBonus × Road bonus × Upkeep debt
- Arrival threshold: 0.5 units ✓

### 2.5 ABILITIES — CRITICAL GAPS

**Unit Abilities Map** (`src/data/unitAbilityMap.ts:30-135`):
✅ Defined but **handlers missing in UnitAbilitySystem**

| Faction | Unit | Ability ID | Status |
|---------|------|-----------|--------|
| Brabanders | Carnavalvierder | polonaise | ❌ NO HANDLER |
| Brabanders | Sluiper | smokkelroute | ❌ NO HANDLER |
| Brabanders | Boerinne | koffie-met-gebak | ❌ NO HANDLER |
| Brabanders | Muzikant | carnavalskraker (A), opzwepende-marsmuziek (P) | ❌ NO HANDLERS |
| Brabanders | Tractorrijder | volgas (A), modder (P) | ❌ NO HANDLERS |
| Randstad | Manager | performance-review (A), administratieve-last (P) | ❌ NO HANDLERS |
| Randstad | Consultant | reorganisatie (A), adviesrapport (P) | ❌ NO HANDLERS |
| Randstad | HR-Medewerker | teambuilding | ❌ NO HANDLER |
| Randstad | Influencer | viral-post | ❌ NO HANDLER |
| Randstad | Vastgoedmakelaar | bod-boven-vraagprijs | ❌ NO HANDLER |
| Limburgers | Schutterij | vaandelzwaaien | ❌ NO HANDLER |
| Limburgers | Vlaaienwerper | zoet-debuff (P) | ❌ NO HANDLER |
| Limburgers | Mergelridder | steenhuid | ❌ NO HANDLER |
| Limburgers | Heuvelwacht | heuvelvoordeel (P) | ❌ NO HANDLER |
| Belgen | Bierbouwer | bierfurie (P) | ❌ NO HANDLER |
| Belgen | Chocolatier | praline-surprise | ❌ NO HANDLER |
| Belgen | Frituurridder | frituur-charge | ❌ NO HANDLER |
| Belgen | Dubbele Spion | disguise | ❌ NO HANDLER |

**File**: `src/data/unitAbilityRegistry.ts` — registry defined but **no implementations**

### 2.6 HERO SYSTEM

**✅ ARCHETYPE DEFINED**: `src/entities/heroArchetypes.ts` lines 24-400+
- All 8 heroes have 3 abilities each (Q/W/E) with cooldown, targetType, effects
- Spawn & revive mechanics in `HeroSystem.ts` ✅

**⚠️ ABILITY EXECUTION**: 
- Framework in place (`activateHeroAbility()` lines 90-134)
- Switch statement for ability execution (lines 171-400+)
- **Implementations partial**: Some abilities (e.g., Prins-toespraak) apply StatBuff, others skeleton only
- **File**: `src/systems/HeroSystem.ts:161-250`

**Hero-specific findings**:
1. **Prins van Brabant**: Prinselijke Toespraak (AoE buff +30%) PARTIALLY implemented ✅
2. **Boer van Brabant**: Mestverspreider (cone AoE) skeleton only ❌
3. **De CEO**: Kwartaalcijfers (+50% production) partially in `ProductionSystem.ts:172`
4. **De Politicus**: Verkiezingsbelofte skeleton ❌
5. **De Mijnbaas**: Mijnschacht Instorten (stun) skeleton ❌
6. **De Maasridder**: Maasvloed (line AoE) skeleton ❌
7. **De Frietkoning**: Belgisch Decreet (mind control) skeleton ❌
8. **De Abdijbrouwer**: All abilities skeleton ❌

**Revive mechanism**: 60s timer implemented ✅ (`src/systems/HeroSystem.ts:58, 261-280`)

---

## 3. PRODUCTION CHAIN GAPS (CRITICAL)

### 3.1 MISSING BUILDINGS

**Siege Workshop**:
- Required in PRD (line 160) to train Siege units
- NOT in `FACTION_BUILDINGS`
- NO `BuildingTypeId.SiegeWorkshop` spawner
- **Result**: No Siege units can ever be trained

**Advanced Barracks** (for Heavy, T2 units):
- Brabanders: Feestzaal produces Infantry/Ranged (line 886) — should also Heavy/Muzikant
- Randstad: NO advanced barracks
- Limburgers: NO advanced barracks
- Belgen: NO advanced barracks
- **Result**: Tier 2+ units unreachable

### 3.2 UNIT PRODUCTION MATRIX

| Unit | Required Building | Current Building | Status |
|------|------------------|-----------------|--------|
| Carnavalvierder | Barracks | Barracks, Cafe ✅ | ✅ WORKS |
| Sluiper | Barracks | Barracks, Cafe ✅ | ✅ WORKS |
| **Muzikant** | **Advanced Barracks** | **NONE** | ❌ UNREACHABLE |
| **Tractorrijder** | **Advanced Barracks** | **NONE** | ❌ UNREACHABLE |
| **Frituurmeester** | **Siege Workshop** | **NONE** | ❌ UNREACHABLE |
| **Praalwagen** | **Siege Workshop** | **NONE** | ❌ UNREACHABLE |
| **Hipster** | **Advanced Barracks** | **NONE** | ❌ UNREACHABLE |
| **HR-Medewerker** | **Advanced Barracks** | **NONE** | ❌ UNREACHABLE |
| **CorporateAdvocaat** | **Advanced Barracks** | **NONE** | ❌ UNREACHABLE |
| **Influencer** | **Advanced Barracks** | **NONE** | ❌ UNREACHABLE |
| **Vastgoedmakelaar** | **Siege Workshop** | **NONE** | ❌ UNREACHABLE |
| **Mergelridder** | **Advanced Barracks** | **NONE** | ❌ UNREACHABLE |
| **Kolenbrander** | **Siege Workshop** | **NONE** | ❌ UNREACHABLE |
| **Mijnrat** | **Siege Workshop** | **NONE** | ❌ UNREACHABLE |
| **Frituurridder** | **Advanced Barracks** | **NONE** | ❌ UNREACHABLE |
| **Manneken Pis-kanon** | **Siege Workshop** | **NONE** | ❌ UNREACHABLE |
| **Dubbele Spion** | **Siege Workshop** | **NONE** | ❌ UNREACHABLE |

**File**: `src/data/factionData.ts:799-1320` (FACTION_BUILDINGS)

---

## 4. TECH TREE INTEGRATION

**✅ UPGRADES EXIST**: 7 upgrade definitions in `TechTreeSystem.ts:71-163`
- Melee Attack I/II (+2 damage per level)
- Ranged Attack I/II (+2 damage)
- Armor I/II (+1 armor)
- Move Speed I (+10% speed)

**⚠️ UNIT TIER-LOCK MISSING**:
- Upgrades don't restrict unit production
- No "must research T2 to train Heavy" mechanic
- **File**: `src/systems/TechTreeSystem.ts:171-195` defines tier sets but no enforcement

**⚠️ UPGRADE APPLICATION**:
- Upgrades apply to existing units (retroactive) ✅
- But no UI to see which units are affected
- Consultant (ATK=0) will stay ATK=0 even after MeleeAttack upgrade (no melee type)

---

## 5. UNIT ABILITY SYSTEM

**⚠️ CRITICAL**: `UnitAbilitySystem.ts:45-128` processes ability cooldowns & auras but:
1. **Active ability effects NOT implemented** — handlers missing for all 20+ unit abilities
2. **Aura processing** (lines 163-200) stub only — applies StatBuff but effects undefined
3. **AI auto-activate** (lines 134-157) checks for targets but doesn't execute effects

**Example missing implementation**:
```typescript
// unitAbilityMap.ts assigns 'polonaise' to Carnavalvierder
// But UnitAbilitySystem.ts has NO handler for what polonaise DOES
// Result: Unit activates ability, cooldown ticks, but nothing happens
```

**File**: `src/systems/UnitAbilitySystem.ts:45-130`

---

## 6. DEAD CODE & UNREACHABLE PATHS

### 6.1 Units Never Trained
- All T2+ units (7 Brabanders, 5 Randstad, 3 Limburgers, 3 Belgen) = **18 units**
- All Siege units (4 total: Frituurmeester, Vastgoedmakelaar, Kolenbrander, Manneken Pis-kanon) = **4 units**
- Overlap: 8 units unreachable
- **Dead code ratio**: ~20% of unit archetypes are dead

### 6.2 Abilities Mapped But Never Called
- 20+ unit abilities in `unitAbilityMap.ts` mapped to abilities
- 0 handlers in `UnitAbilitySystem.ts` or `AbilityEffectSystem`
- Registry exists but **all ability effects are no-ops**

### 6.3 Hero Abilities Partially Implemented
- 8 heroes × 3 abilities = 24 ability definitions
- ~8 partially implemented (simple buff logic)
- ~16 skeleton only (switch statement but no effect)
- **Missing**: Particle effects, audio cues, actual damage/buff application for 50%

---

## 7. DATA INCONSISTENCIES (PRD vs Code)

| Inconsistency | PRD | Code | File | Severity |
|---------------|-----|------|------|----------|
| Siege Workshop | Required T3 | Missing | N/A | **CRITICAL** |
| Advanced Barracks | Required T2 | Only Feestzaal (Brabanders) | `factionData.ts:876-887` | **CRITICAL** |
| Consultant ATK | "Debuff specialist, 0 direct damage" | ATK=0 in code | `factionData.ts:370` | ⚠️ CORRECT |
| Support healRate | Varies per unit (3-6 HP/s) | Implemented | `factionData.ts` + `HealingSystem.ts` | ✅ OK |
| Siege bonus | 2-8x vs buildings | Implemented (1-6x) | `CombatSystem.ts:168` | ✅ OK |
| Unit speeds | Documented | Correct | `factionData.ts` | ✅ OK |
| Unit HP/ATK | Documented | Correct | `factionData.ts` | ✅ OK |

---

## 8. RECOMMENDATIONS

### Immediate (Blocking v1.0)
1. **Add SiegeWorkshop building** → enable Siege unit training
2. **Add Advanced Barracks** per faction → enable T2 unit training
3. **Implement T2/T3 tier-lock** in TechTreeSystem
4. **Implement all 20+ unit ability handlers** in UnitAbilitySystem or dedicated EffectSystem
5. **Verify Consultant (ATK=0)** doesn't crash; ensure debuff logic handles zero-damage units

### High Priority
6. **Implement remaining 16 hero abilities** (currently skeleton)
7. **Add Healer system tests** (verify all Support units heal correctly)
8. **Test Siege damage multiplier** (unit vs building vs unit)
9. **Verify all unit archetypes spawn with correct stats** (factionData → components)

### Medium Priority
10. Create upgrade UI showing "affects X units" per upgrade
11. Add unit ability UI (cooldown radial, tooltip descriptions)
12. Balance Siege units' DPS vs training time vs cost

---

## 9. TEST COVERAGE

**Tests exist for**:
- `ProductionSystem.test.ts` ✅
- `CombatSystem.test.ts` ✅
- `PlayerState.test.ts` ✅

**Tests missing for**:
- Unit ability activation & effects
- Tier-lock enforcement
- Siege bonus damage
- Support unit healing
- Hero ability execution

---

## SUMMARY TABLE: WORKING ✅ vs BROKEN ❌

| Category | Status | Count | Notes |
|----------|--------|-------|-------|
| **Archetypes** | ✅ | 38 units + 8 heroes | All defined |
| **Factories** | ✅ | 4 factories | createUnit/createBuilding work |
| **Base Stats** | ✅ | 46 entities | HP/ATK/DEF correct |
| **Movement** | ✅ | All units | Pathfinding + speed working |
| **Combat** | ✅ | All combat units | Damage formula + modifiers OK |
| **Healing** | ✅ | 8 support units | HealingSystem active |
| **Abilities (Hero)** | ⚠️ | 8/24 partial | 8 skeletons, 16 unimplemented |
| **Abilities (Unit)** | ❌ | 0/20 | All mapped but unimplemented |
| **Production** | ⚠️ | 18 units unreachable | Missing buildings |
| **Upgrades** | ⚠️ | Tier-lock missing | Upgrades apply but no unlock |
| **Heroes** | ⚠️ | Revive OK, abilities partial | 50% impl |

---

**Report Generated**: 17 Apr 2026 · Reign of Brabant v0.37.2  
**Scope**: Unit gameplay audit  
**Next**: See task #3 in backlog (Unit behavior), task #4 (Building behavior)

