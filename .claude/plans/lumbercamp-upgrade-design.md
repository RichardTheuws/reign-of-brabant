# LumberCamp Wood-Upgrades — Implementation Design

**Status**: Design (geen code edits) — input voor Bundel 1B implementatie-fase
**Target version**: v0.37.30
**Repo state verkend**: v0.37.29 (1059 tests groen)

---

## 0. Verkenning-bevindingen (geen wishful thinking)

| Aanname uit plan-spec | Werkelijke staat in repo |
|---|---|
| "vergelijkbare bestaande upgrade-pipeline ... `src/data/upgradeDefinitions.ts` of soortgelijk" | **Bestaat NIET als apart bestand.** Alle upgrade-data staat in `src/systems/TechTreeSystem.ts:71-163` als `UPGRADE_DEFINITIONS`. |
| "WoodCarry1=10, WoodCarry2=11, WoodGather=12" | **CONFLICT.** `UpgradeId` enum heeft al `GezelligheidsBoost=10`, `Carnavalsrage=11`, `BrabantseVlijt=12` (faction-specifiek, range 10-19 = Brabanders). Wood-upgrades zijn universeel -> moeten in een **vrije range**. Voorstel: `WoodCarry1=7, WoodCarry2=8, WoodGather=9` (verlenging van universele 0-6 range; range 7-9 is vrij). |
| "Per-factie naming via `getDisplayUpgradeName(faction, upgradeId)`" | **Bestaat NIET.** Pattern in repo is `FACTION_BUILDING_NAME_FALLBACKS` (factionData.ts:1550-1575) + `getDisplayBuildingName()`. Helper voor upgrades moet **nieuw aangemaakt** worden in dezelfde stijl. |
| "Gatherer component al gemodelleerd voor carry/gather mods" | **Niet voldoende.** Velden zijn `state, targetEid, carrying, carryCapacity, resourceType, previousTarget` (components.ts:117-124). Geen `carryBonus`, geen `gatherSpeedMult`. Toevoegen vereist. |
| "Blacksmith UI panel herbruiken" | **Direct herbruikbaar.** `HUD.showBlacksmithPanel()` (HUD.ts:1009-1078) verwacht een generieke `upgrades[]` array — geen Blacksmith-specifieke logica. Element-id `cmd-blacksmith` zit in DOM als single panel; voor LumberCamp hergebruiken (mutex selection). |

---

## 1. Exacte file-locaties (per wijziging)

| # | File | Lijn (~) | Wijziging |
|---|------|----------|-----------|
| 1 | `src/types/index.ts` | 119 (na `MoveSpeed1=6`) | 3 nieuwe `UpgradeId` waarden: `WoodCarry1=7, WoodCarry2=8, WoodGather=9` |
| 2 | `src/ecs/components.ts` | 117-124 | `Gatherer`: 2 velden toevoegen (`carryBonus`, `gatherSpeedMult`) |
| 3 | `src/systems/TechTreeSystem.ts` | 48-65 | `UpgradeDefinition` interface: 2 optional velden (`bonusCarry?`, `bonusGatherSpeedFraction?`) |
| 4 | `src/systems/TechTreeSystem.ts` | 71-163 (eind van array, na index 6) | 3 entries appenden voor WoodCarry1/2 + WoodGather |
| 5 | `src/systems/TechTreeSystem.ts` | 450-465 | `applyUpgradeToEntity`: 2 nieuwe branches voor `bonusCarry` en `bonusGatherSpeedFraction` |
| 6 | `src/systems/GatherSystem.ts` | 121-123 | `processGathering`: lees `Gatherer.carryBonus[eid]` voor effective capacity |
| 7 | `src/systems/GatherSystem.ts` | 116-121 | `processGathering`: vermenigvuldig `effectiveRate *= Gatherer.gatherSpeedMult[eid] || 1` |
| 8 | `src/data/factionData.ts` | na 1575 | Nieuwe const `FACTION_UPGRADE_NAME_OVERRIDES` + `getDisplayUpgradeName()` helper |
| 9 | `src/entities/factories.ts` | Worker spawn-pad | Init `Gatherer.carryBonus[eid]=0, gatherSpeedMult[eid]=1` |
| 10 | `src/core/Game.ts` | 1972-1984 (Blacksmith branch) | Sibling-branch: `if buildingType === LumberCamp && complete` -> `showLumberCampResearchUI` |
| 11 | `src/core/Game.ts` | 2477-2523 | Nieuwe method `showLumberCampResearchUI(eid)` — filter op IDs 7/8/9, gebruik `getDisplayUpgradeName` |
| 12 | `src/core/Game.ts` | 2977-2982 | Per-frame refresh-branch: ook voor LumberCamp |
| 13 | `tests/LumberCampUpgrades.test.ts` | NIEUW | 18 tests (zie sectie 8) |

---

## 2. Component-uitbreiding — `Gatherer`

**File**: `src/ecs/components.ts`
**Huidige definitie (lijn 117-124)**:

```ts
export const Gatherer = {
  state: u8(),          // UnitAIState
  targetEid: u32(),     // entity id of resource node
  carrying: f32(),      // current amount carried
  carryCapacity: f32(), // max carry (typically 10)
  resourceType: u8(),   // ResourceType enum
  previousTarget: u32(),
};
```

**Toevoegen na `previousTarget`**:

```ts
  carryBonus: f32(),       // additive bonus to carryCapacity from upgrades (default 0)
  gatherSpeedMult: f32(),  // multiplicative tick-rate modifier from upgrades (default 1.0)
```

**Init-locaties die ook geraakt worden**:
- `src/entities/factories.ts` — bij elke `addComponent(world, eid, Gatherer)` voor Workers: `Gatherer.carryBonus[eid] = 0` en `Gatherer.gatherSpeedMult[eid] = 1` expliciet zetten (Float32Array begint 0; multiplier moet 1).
- `src/systems/CommandSystem.ts` — als ergens `Gatherer.*` per task-reset wordt, deze 2 velden NIET meeresetten (unit-lifetime, niet per-task).

---

## 3. UPGRADE_DEFINITIONS extension

**File**: `src/systems/TechTreeSystem.ts`

**Bestaande structuur — voorbeeld (lijn 73-84, MeleeAttack1)**:

```ts
{
  id: UpgradeId.MeleeAttack1,
  name: 'Zwaardvechten I',
  description: 'Infanterie krijgt +2 aanval.',
  cost: { gold: 150 },
  researchTime: 30,
  prerequisite: null,
  affectsUnitTypes: [UnitTypeId.Infantry],
  bonusDamage: 2,
  bonusArmor: 0,
  bonusSpeedFraction: 0,
},
```

**Interface uitbreiding (lijn 48-65)**:

```ts
export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly name: string;
  readonly description: string;
  readonly cost: UpgradeCost;
  readonly researchTime: number;
  readonly prerequisite: UpgradeId | null;
  readonly affectsUnitTypes: readonly UnitTypeId[] | null;
  readonly bonusDamage: number;
  readonly bonusArmor: number;
  readonly bonusSpeedFraction: number;
  /** Additive bonus to Gatherer.carryCapacity (workers only). */
  readonly bonusCarry?: number;
  /** Multiplicative bonus to Gatherer harvest tick-rate (e.g., 0.25 = +25%). */
  readonly bonusGatherSpeedFraction?: number;
}
```

**3 nieuwe entries (append na MoveSpeed1, lijn ~163)**:

```ts
// UpgradeId.WoodCarry1 = 7
{
  id: UpgradeId.WoodCarry1,
  name: 'Houtdraagkracht I',
  description: 'Werkers dragen +5 hout per trip.',
  cost: { gold: 100 },
  researchTime: 30,
  prerequisite: null,
  affectsUnitTypes: [UnitTypeId.Worker],
  bonusDamage: 0, bonusArmor: 0, bonusSpeedFraction: 0,
  bonusCarry: 5,
},
// UpgradeId.WoodCarry2 = 8
{
  id: UpgradeId.WoodCarry2,
  name: 'Houtdraagkracht II',
  description: 'Werkers dragen nog +5 hout per trip (stapelt).',
  cost: { gold: 175 },
  researchTime: 45,
  prerequisite: UpgradeId.WoodCarry1,
  affectsUnitTypes: [UnitTypeId.Worker],
  bonusDamage: 0, bonusArmor: 0, bonusSpeedFraction: 0,
  bonusCarry: 5,
},
// UpgradeId.WoodGather = 9
{
  id: UpgradeId.WoodGather,
  name: 'Snelle Kap',
  description: 'Werkers verzamelen hout 25% sneller.',
  cost: { gold: 200 },
  researchTime: 40,
  prerequisite: null,
  affectsUnitTypes: [UnitTypeId.Worker],
  bonusDamage: 0, bonusArmor: 0, bonusSpeedFraction: 0,
  bonusGatherSpeedFraction: 0.25,
},
```

**Conflict-resolutie**: ID 7/8/9 ipv 10/11/12 — zie sectie 0. Plan-spec moet bijgewerkt of range 7-9 goedgekeurd. Universele upgrades horen in 0-9 range volgens enum-comment in types/index.ts:105.

---

## 4. Per-factie naming-mechanisme

**Pattern in repo**: `FACTION_BUILDING_NAME_FALLBACKS` (factionData.ts:1550-1575) — `Record<factionId, Partial<Record<BuildingTypeId, string>>>`, geconsumeerd door `getDisplayBuildingName()` (factionData.ts:1587-1597).

**Volg dezelfde pattern voor upgrades** — toevoegen aan `src/data/factionData.ts` na lijn 1575:

```ts
const FACTION_UPGRADE_NAME_OVERRIDES: Record<number, Partial<Record<UpgradeId, { name: string; description: string }>>> = {
  [ExtendedFactionId.Brabanders]: {
    [UpgradeId.WoodCarry1]: { name: 'Stevigere Manden', description: 'Bakkers dragen +5 bier per trip.' },
    [UpgradeId.WoodCarry2]: { name: 'Volkoren Brood',   description: 'Bakkers dragen nog +5 bier per trip.' },
    [UpgradeId.WoodGather]: { name: 'Snellere Bakker',  description: 'Bakkers verzamelen 25% sneller.' },
  },
  [ExtendedFactionId.Randstad]: {
    [UpgradeId.WoodCarry1]: { name: 'Latte Capacity',   description: "Barista's dragen +5 LinkedIn per trip." },
    [UpgradeId.WoodCarry2]: { name: 'Cold Brew Bonus',  description: "Barista's dragen nog +5 LinkedIn per trip." },
    [UpgradeId.WoodGather]: { name: 'Caffeine Kick',    description: "Barista's verzamelen 25% sneller." },
  },
  [ExtendedFactionId.Limburgers]: {
    [UpgradeId.WoodCarry1]: { name: 'Grotere Vlaai',    description: 'Vlaaibakkers dragen +5 mergel per trip.' },
    [UpgradeId.WoodCarry2]: { name: 'Suiker-Boost',     description: 'Vlaaibakkers dragen nog +5 mergel per trip.' },
    [UpgradeId.WoodGather]: { name: 'Snellere Oven',    description: 'Vlaaibakkers verzamelen 25% sneller.' },
  },
  [ExtendedFactionId.Belgen]: {
    [UpgradeId.WoodCarry1]: { name: 'XL Patatzak',      description: 'Frietboeren dragen +5 trappist per trip.' },
    [UpgradeId.WoodCarry2]: { name: 'Mayo-Reserve',     description: 'Frietboeren dragen nog +5 trappist per trip.' },
    [UpgradeId.WoodGather]: { name: 'Snel Frituren',    description: 'Frietboeren verzamelen 25% sneller.' },
  },
};

export function getDisplayUpgradeName(factionId: number, upgradeId: UpgradeId): { name: string; description: string } {
  const override = FACTION_UPGRADE_NAME_OVERRIDES[factionId]?.[upgradeId];
  if (override) return override;
  const def = getUpgradeDefinition(upgradeId);
  return { name: def.name, description: def.description };
}
```

**Imports** in factionData.ts: `UpgradeId` uit types, `getUpgradeDefinition` uit `../systems/TechTreeSystem`. **Cyclische import-risico**: TechTreeSystem importeert al uit types (niet uit factionData), dus factionData -> TechTreeSystem is veilig. Verifieer met `tsc --noEmit` na implementatie.

---

## 5. GatherSystem integration

**File**: `src/systems/GatherSystem.ts`, function `processGathering` (lijn 97-144)

**Pseudo-diff (rond lijn 116-123)**:

```ts
  let effectiveRate = HARVEST_RATE;
  const maxAmount = Resource.maxAmount[targetEid];
  if (maxAmount > 0 && Resource.amount[targetEid] / maxAmount < DIMINISHING_RETURNS_THRESHOLD) {
    effectiveRate *= DIMINISHING_RETURNS_GATHER_MULT;
  }
+ const speedMult = Gatherer.gatherSpeedMult[eid];
+ if (speedMult > 0) effectiveRate *= speedMult;
  const harvestAmount = effectiveRate * dt;
- const capacity = Gatherer.carryCapacity[eid] || CARRY_CAPACITY;
+ const baseCapacity = Gatherer.carryCapacity[eid] || CARRY_CAPACITY;
+ const capacity = baseCapacity + (Gatherer.carryBonus[eid] || 0);
  const remaining = capacity - Gatherer.carrying[eid];
```

Lijn 131 (`if (Gatherer.carrying[eid] >= capacity)`) gebruikt nu de samengestelde `capacity` automatisch.

**Edge case**: `gatherSpeedMult` start op 0 voor nieuwe Float32Array -> eerste worker zonder upgrade krijgt 0x harvest. Mitigatie: factory-init op 1 PLUS guard `speedMult > 0` (defense-in-depth).

---

## 6. TechTreeSystem.applyUpgradeToEntity

**File**: `src/systems/TechTreeSystem.ts`, lijn 450-465

**Bestaande structuur**:

```ts
private applyUpgradeToEntity(eid: number, def: UpgradeDefinition): void {
  const unitType = UnitType.id[eid] as UnitTypeId;
  if (def.affectsUnitTypes !== null && !def.affectsUnitTypes.includes(unitType)) return;
  if (def.bonusDamage !== 0) Attack.damage[eid] += def.bonusDamage;
  if (def.bonusArmor !== 0) Armor.value[eid] += def.bonusArmor;
  if (def.bonusSpeedFraction !== 0) Movement.speed[eid] *= (1 + def.bonusSpeedFraction);
}
```

**Filter `affectsUnitTypes=[Worker]`**: werkt al via guard op lijn 454. **Geen wijziging daar.**

**Toevoegen** (na lijn 463):

```ts
  if (def.bonusCarry !== undefined && def.bonusCarry !== 0) {
    Gatherer.carryBonus[eid] += def.bonusCarry;
  }
  if (def.bonusGatherSpeedFraction !== undefined && def.bonusGatherSpeedFraction !== 0) {
    const current = Gatherer.gatherSpeedMult[eid] || 1;
    Gatherer.gatherSpeedMult[eid] = current * (1 + def.bonusGatherSpeedFraction);
  }
```

Plus import `Gatherer` (regel 16-23). 

**Ontwerpkeuze**: directe array-write zonder `hasComponent`-check. bitECS-conventie — Float32Arrays zijn pre-allocated MAX_ENTITIES; schrijven naar non-Worker entity is harmless want `affectsUnitTypes=[Worker]` guard filtert al. Geen `world` parameter nodig -> minimale call-site impact.

---

## 7. LumberCamp UI panel

**Hergebruik mechanisme**: `HUD.showBlacksmithPanel()` (HUD.ts:1009-1078) is generiek — accepteert generieke `upgrades[]` + progress + callback. DOM `cmd-blacksmith` is single mutex panel.

**Aanbeveling**: hergebruik dezelfde method + DOM element. Selectie van complete LumberCamp toont dezelfde panel met gefilterde upgrades.

**Wijzigingen in `Game.ts`**:

A. **Selection-handler** (lijn 1972-1984):

```ts
        this.hud.hideBlacksmithPanel();

        if (buildingType === BuildingTypeId.Blacksmith && Building.complete[firstEid] === 1) {
          const cardData = this.buildBuildingCardData(firstEid, buildingType, buildingName, queueItems, true);
          this.hud.showBuildingCard(cardData);
          this.showBlacksmithResearchUI(firstEid);
+       } else if (buildingType === BuildingTypeId.LumberCamp && Building.complete[firstEid] === 1) {
+         const cardData = this.buildBuildingCardData(firstEid, buildingType, buildingName, queueItems, true);
+         this.hud.showBuildingCard(cardData);
+         this.showLumberCampResearchUI(firstEid);
        } else {
          ...
        }
```

B. **Nieuwe method** (na `showBlacksmithResearchUI`, lijn ~2523):

```ts
  private showLumberCampResearchUI(lumberCampEid: number): void {
    if (!this.hud) return;
    const factionId = this.playerFactionId;
    const WOOD_UPGRADE_IDS = [UpgradeId.WoodCarry1, UpgradeId.WoodCarry2, UpgradeId.WoodGather];

    const upgrades = WOOD_UPGRADE_IDS.map(id => {
      const def = getUpgradeDefinition(id);
      const display = getDisplayUpgradeName(factionId, id);
      return {
        id: def.id as number,
        name: display.name,
        description: display.description,
        costGold: def.cost.gold,
        canAfford: this.playerState.canAfford(factionId, def.cost.gold),
        canResearch: techTreeSystem.canResearch(factionId, def.id),
        isResearched: techTreeSystem.isResearched(factionId, def.id),
      };
    });

    const progress = techTreeSystem.getResearchProgress(lumberCampEid, factionId);
    let researchProgress: { name: string; progress: number; remaining: number } | null = null;
    if (progress) {
      const display = getDisplayUpgradeName(factionId, progress.upgradeId);
      researchProgress = { name: display.name, progress: progress.progress, remaining: progress.remaining };
    }

    this.hud.showBlacksmithPanel(upgrades, researchProgress, (upgradeId: number) => {
      const success = techTreeSystem.startResearch(factionId, lumberCampEid, upgradeId as UpgradeId);
      if (success) {
        const display = getDisplayUpgradeName(factionId, upgradeId as UpgradeId);
        this.hud?.showAlert(`Onderzoek gestart: ${display.name}`, 'info');
        audioManager.playSound('click');
        this.showLumberCampResearchUI(lumberCampEid);
      } else {
        this.hud?.showAlert('Kan onderzoek niet starten!', 'warning');
      }
    });
  }
```

C. **Per-frame refresh** (lijn 2977-2982): branch óók voor `BuildingTypeId.LumberCamp`. Splits naar `showBlacksmithResearchUI` óf `showLumberCampResearchUI` op typeId.

D. **TechTreeSystem.startResearch tier-gate**: huidige implementatie heeft GEEN building-type validatie. UI is gatekeeper. Voor v0.37.30 niet uitbreiden; later optioneel `validBuildings: BuildingTypeId[]` veld toevoegen.

---

## 8. Test-coverage spec — `tests/LumberCampUpgrades.test.ts`

**Locatie**: `/Users/richardtheuws/Documents/games/reign-of-brabant/tests/LumberCampUpgrades.test.ts`

**Setup**: hergebruik helpers uit `tests/TechTreeSystem-research-lifecycle.test.ts` (spawnBlacksmith) + nieuwe `spawnLumberCamp` + `spawnWorker(world, faction)` met Gatherer + IsWorker.

| # | Test | 1-regel beschrijving |
|---|------|----------------------|
| 1 | WoodCarry1 cost-deduct | `startResearch(WoodCarry1)` debiteert 100g, emits `research-started` event. |
| 2 | WoodCarry2 cost-deduct | `startResearch(WoodCarry2)` debiteert 175g (na prereq WoodCarry1 done). |
| 3 | WoodGather cost-deduct | `startResearch(WoodGather)` debiteert 200g, geen prereq. |
| 4 | WoodCarry1 retroactive | Spawn Worker met `carryBonus=0`, complete WoodCarry1 -> `Gatherer.carryBonus[eid] === 5`. |
| 5 | WoodCarry2 retroactive | Spawn Worker, complete WoodCarry1+WoodCarry2 -> `carryBonus === 10`. |
| 6 | WoodGather retroactive | Spawn Worker met `gatherSpeedMult=1`, complete WoodGather -> `gatherSpeedMult === 1.25`. |
| 7 | WoodCarry1 new-spawn | Complete WoodCarry1, spawn nieuwe Worker -> `applyAllUpgradesToNewUnit` zet `carryBonus=5`. |
| 8 | WoodCarry2 new-spawn | Complete WoodCarry1+2, spawn -> `carryBonus=10`. |
| 9 | WoodGather new-spawn | Complete WoodGather, spawn -> `gatherSpeedMult=1.25`. |
| 10 | WoodCarry1 non-Worker | Complete WoodCarry1 met Infantry alive -> `Gatherer.carryBonus[infantryEid]` ongewijzigd (0). |
| 11 | WoodCarry2 non-Worker | Idem voor Ranged unit. |
| 12 | WoodGather non-Worker | Complete WoodGather met Infantry alive -> `gatherSpeedMult` ongewijzigd. |
| 13 | Brabant naming-lock | `getDisplayUpgradeName(Brabanders, WoodCarry1).name === 'Stevigere Manden'`. |
| 14 | Randstad naming-lock | `getDisplayUpgradeName(Randstad, WoodCarry1).name === 'Latte Capacity'`. |
| 15 | Limburg naming-lock | `getDisplayUpgradeName(Limburgers, WoodGather).name === 'Snellere Oven'`. |
| 16 | Belgen naming-lock | `getDisplayUpgradeName(Belgen, WoodCarry2).name === 'Mayo-Reserve'`. |
| 17 | Stack: WoodCarry1+2 = +10 | Sequentieel research -> `carryBonus === 10`, niet 5 (geen override). |
| 18 | WoodGather geen dubbele apply | Apply WoodGather 2x defensief -> `gatherSpeedMult === 1.25` (Set in TechTreeSystem voorkomt dubbele completion). |

Optioneel: snapshot-test voor de hele `FACTION_UPGRADE_NAME_OVERRIDES` table tegen accidentele rename.

---

## 9. Verwachte runtime + side-effects

### Code-volume schatting

| File | +regels |
|------|---------|
| `src/types/index.ts` | +6 |
| `src/ecs/components.ts` | +2 |
| `src/systems/TechTreeSystem.ts` | +50 (interface +2, 3 entries, applyUpgradeToEntity +6, import +1) |
| `src/systems/GatherSystem.ts` | +5 |
| `src/data/factionData.ts` | +50 (FACTION_UPGRADE_NAME_OVERRIDES + helper) |
| `src/entities/factories.ts` | +2 (init defaults) |
| `src/core/Game.ts` | +55 (showLumberCampResearchUI + selection-branches) |
| **Totaal source** | **~170 regels** |
| `tests/LumberCampUpgrades.test.ts` | +320 regels (18 tests met setup) |

### Breaking-change risk

- **Geen** breaking change voor save-states (geen save-system in v0.37.29).
- **Geen** breaking voor bestaande tests (UpgradeDefinition uitgebreid met **optional** velden).
- **Subtle risk**: Float32Array `gatherSpeedMult` start op 0. Workers gespawned vóór factory-init-fix zouden 0x harvest hebben. **Mitigatie**: factory-init verplicht + GatherSystem guard (`speedMult > 0 ? speedMult : 1`).
- **UI-mutex**: `cmd-blacksmith` panel-id wordt voor zowel Blacksmith als LumberCamp gebruikt. Bij snel switchen tussen 2 buildings van verschillend type moet `hideBlacksmithPanel()` worden aangeroepen — bestaande code op Game.ts:1973 doet dit al.

### Test-impact

- 1059 -> ~1077 tests (1059 + 18). Naming-tests zijn 4 (één per factie), niet 12 — daarom 18 ipv 23.
- Geen UAT-update verplicht voor v0.37.30 (UAT-04 voor LumberCamp is **bundel-2 scope** volgens plan-spec).

### Deploy-runtime

- Pre-deploy gate (test:all): ~30s typecheck + ~25s vitest + ~60s playwright -> ~2min totaal.
- Build + rsync deploy: ~5s.
- **~2.5min van commit tot LIVE**.

---

## 10. Open vragen voor implementatie-fase

1. **UpgradeId range goedkeuring**: 7/8/9 (universeel) ipv 10/11/12 (collision met Brabant range)? **Aanbeveling**: ja, 7-9.
2. **`world`-parameter aan `applyUpgradeToEntity`**: nodig of skip met directe array-writes? **Aanbeveling**: skip — bitECS conventie.
3. **`validBuildings` veld in UpgradeDefinition**: nu of later? **Aanbeveling**: later — UI gatekeeping is genoeg voor v0.37.30.
4. **Cyclische import factionData -> TechTreeSystem**: verifieer met `tsc --noEmit`. Alternatief: verplaats `getDisplayUpgradeName` naar `src/data/upgradeDisplay.ts` als import-cycle optreedt.

---

**Einde design-doc.** Implementatie-fase kan dit doc gebruiken zonder aanvullende verkenning.
