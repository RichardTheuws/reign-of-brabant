# Bundel 2A Design — UpgradeBuilding Research Pakket

**Status**: Design (input voor implementatie-fase) — Bundel 2A v0.37.33
**Repo state verkend**: v0.37.32 (1092 tests groen)

---

## 0. Verkenning-bevindingen

| Aanname | Werkelijkheid in repo |
|---|---|
| Universele range 0-9 vol | Bevestigd. `src/types/index.ts:113-125` heeft alle 10 IDs in gebruik (incl. WoodCarry1=7, WoodCarry2=8, WoodGather=9 uit v0.37.30). |
| Plan zegt T3 IDs 13/14/15/16 | **Conflict.** `UpgradeId.SamenSterk = 13` bestaat al (`types/index.ts:135`, Brabant-range). Voorstel: nieuwe range 50-53 voor T3 universal. |
| Faction-stubs zijn enum-only | Bevestigd. Stubs in enum (10-13/20-23/30-33/40-43) maar NIET in `UPGRADE_DEFINITIONS` array. Faction-unique IDs 14/24/34/44 zijn vrij. |
| `getUpgradeDefinition(id)` werkt | **Probleem.** `TechTreeSystem.ts` doet `UPGRADE_DEFINITIONS[id]` — array-lookup. Nieuwe IDs op 14/24/34/44/50-53 maken array sparse. **Map-refactor vereist.** |
| `canResearch` heeft geen `world` param | Bevestigd. Toevoegen als optional 3e param + null-guard voor backwards-compat. |
| GezeligheidSystem bewerkt `GezeligheidBonus.attackMult` | Bevestigd. Aura-pass kan na tier-loop draaien (na 500ms-throttle). |
| ProductionSystem multipliceert duration | Bevestigd: `duration * bureaucracyMod * ceoBuff`. AI-Opt wordt 4e factor. |
| `applyUpgradeToEntity` filter werkt voor Heavy | Bevestigd. Mergelharnas needs ZERO new code — gebruik `affectsUnitTypes=[UnitTypeId.Heavy]` + `bonusArmor: 3`. |
| CombatSystem damage-roll plek | `processAttacking` én `processHoldPosition`. **Beide patchen**, anders ontwijkt HoldPosition de crit. |
| `Math.random()` is binnen conventie | Bevestigd (Game.ts/ProductionSystem). Crit-roll mag `Math.random()`. |
| `UPGRADE_DEFINITIONS.length` lock | `tests/TechTreeSystem-research-lifecycle.test.ts:81` `toHaveLength(10)`. Wordt 18. |
| UpgradeBuilding archetype × 4 facties | **Bestaat al** (Wagenbouwer/Innovatie Lab/Hoogoven/Diamantslijperij). Hotkey C, tier T2, factionBuildMenus gewired. ZERO archetype-werk. |

---

## 1. ID-strategie + lookup-refactor

**Probleem**: `UPGRADE_DEFINITIONS[id]` met sparse-array (gat 10-13 + 14-23 + ...).

**Voorstel**: refactor naar Map.
```ts
const UPGRADE_DEFINITION_MAP: ReadonlyMap<UpgradeId, UpgradeDefinition> =
  new Map(UPGRADE_DEFINITIONS.map(d => [d.id, d]));
export function getUpgradeDefinition(id: UpgradeId): UpgradeDefinition {
  const def = UPGRADE_DEFINITION_MAP.get(id);
  if (!def) throw new Error(`Unknown UpgradeId: ${id}`);
  return def;
}
```

**Final IDs**:
- `MeleeAttack3 = 50`, `RangedAttack3 = 51`, `ArmorUpgrade3 = 52`, `MoveSpeed2 = 53`
- `Carnavalsvuur = 14` (Brabant), `AIOptimization = 24` (Randstad), `Mergelharnas = 34` (Limburg), `DiamantgloeiendeWapens = 44` (Belgen)

---

## 2. UpgradeId enum-uitbreiding (`src/types/index.ts`)

Comment-update: voeg toe `* 50-59: Universal Tier 3 upgrades (UpgradeBuilding).`

Toevoegen:
- na `SamenSterk = 13`: `Carnavalsvuur = 14`
- na `VergaderingProtocol = 23`: `AIOptimization = 24`
- na `Mijnbouwexplosief = 33`: `Mergelharnas = 34`
- na `FritenvetFundering = 43`: `DiamantgloeiendeWapens = 44`
- voor `}`:
```ts
  // --- Universal Tier 3 upgrades (50-59) ---
  MeleeAttack3 = 50,
  RangedAttack3 = 51,
  ArmorUpgrade3 = 52,
  MoveSpeed2 = 53,
```

---

## 3. UpgradeDefinition interface uitbreiding

Toevoegen na `bonusGatherSpeedFraction?`:
```ts
  /** Vereist complete UpgradeBuilding (T3 + faction-unique gate). */
  readonly requiresUpgradeBuilding?: boolean;
  /** Aura damage-bonus (Carnavalsvuur 0.10). */
  readonly bonusDamageFraction?: number;
  /** Crit chance per attack (DG-Wapens 0.05 → 10x damage). */
  readonly bonusCritChance?: number;
  /** Production speed mult (AI-Opt 0.20 → effectiveDuration *= 1/1.20). */
  readonly bonusProductionSpeedFraction?: number;
```

**Geen** `bonusArmorHeavyOnly` — Mergelharnas via `affectsUnitTypes=[Heavy]` + `bonusArmor: 3`.

---

## 4. UPGRADE_DEFINITIONS extension — 8 entries

**4 T3 universal**:
- `MeleeAttack3` 350g/50s, prereq MeleeAttack2, +3 dmg Infantry
- `RangedAttack3` 350g/50s, prereq RangedAttack2, +3 dmg Ranged
- `ArmorUpgrade3` 400g/55s, prereq ArmorUpgrade2, +1 armor all
- `MoveSpeed2` 300g/45s, prereq MoveSpeed1, +10% speed all
- ALL: `requiresUpgradeBuilding: true`

**4 faction-unique** (alle 500g/60s, geen prereq):
- `Carnavalsvuur` — `bonusDamageFraction: 0.10` (aura via GezeligheidSystem)
- `AIOptimization` — `bonusProductionSpeedFraction: 0.20`
- `Mergelharnas` — `affectsUnitTypes: [Heavy], bonusArmor: 3`
- `DiamantgloeiendeWapens` — `bonusCritChance: 0.05`
- ALL: `requiresUpgradeBuilding: true`

---

## 5. canResearch + startResearch gate-uitbreiding

```ts
canResearch(factionId, upgradeId, world?): boolean {
  // ...existing checks...
  if (def.requiresUpgradeBuilding === true) {
    if (!world) return false;
    if (!this.hasCompleteUpgradeBuilding(factionId, world)) return false;
  }
  return true;
}

private hasCompleteUpgradeBuilding(factionId, world): boolean {
  const buildings = query(world, [Building, Faction, IsBuilding]);
  for (const eid of buildings) {
    if (Faction.id[eid] !== factionId) continue;
    if (hasComponent(world, eid, IsDead)) continue;
    if (Building.typeId[eid] === BuildingTypeId.UpgradeBuilding && Building.complete[eid] === 1) return true;
  }
  return false;
}
```

`startResearch` krijgt zelfde optionele `world` param + zelfde gate (defense-in-depth).

**Call-site updates** (Game.ts) — pass `world` als 3e arg overal waar canResearch wordt aangeroepen.

---

## 6. Effect-system implementaties

### 6.1 Carnavalsvuur — extends GezeligheidSystem

Na tier-loop in 500ms-tick: query Brabander TownHalls, voor elke Brabander unit binnen 8u radius (sq=64) `GezeligheidBonus.attackMult[eid] *= 1.10`. Stack multiplicatief op group-Gezelligheid.

### 6.2 AI Optimization — extends ProductionSystem

```ts
const aiOptMod = techTreeSystem.isResearched(factionId, UpgradeId.AIOptimization) ? (1 / 1.20) : 1.0;
const effectiveDuration = duration * bureaucracyMod * ceoBuff * aiOptMod;
```

### 6.3 Mergelharnas — geen system-wijziging

`applyUpgradeToEntity` filter werkt out-of-box. Stack additief met ArmorUpgrade1+2+3 = +6.

### 6.4 Diamantgloeiende Wapens — extends CombatSystem

In `processAttacking` én `processHoldPosition`, na `effectiveDamage = Math.max(...)`:
```ts
if (Faction.id[eid] === FactionId.Belgen
    && techTreeSystem.isResearched(FactionId.Belgen, UpgradeId.DiamantgloeiendeWapens)
    && Math.random() < 0.05) {
  effectiveDamage *= 10;
  eventBus.emit('combat-crit', { attackerEid: eid, targetEid, damage: effectiveDamage });
}
```

---

## 7. SystemPipeline integratie

GEEN nieuwe systems. Alle 4 effecten zijn extensies van bestaande systems.

---

## 8. UI integratie

`Game.ts` selection-handler: voeg sibling-branch toe na LumberCamp:
```ts
} else if (buildingType === BuildingTypeId.UpgradeBuilding && Building.complete[firstEid] === 1) {
  const cardData = this.buildBuildingCardData(...);
  this.hud.showBuildingCard(cardData);
  this.showUpgradeBuildingResearchUI(firstEid);
}
```

Nieuwe method `showUpgradeBuildingResearchUI(eid)`: filter `UPGRADE_DEFINITIONS` op T3 universal IDs (50-53) + faction-unique ID matching playerFactionId. Re-uses `HUD.showBlacksmithPanel`.

Per-frame refresh: voeg branch toe voor UpgradeBuilding.

---

## 9. Test-coverage spec

**`tests/UpgradeBuildingResearch.test.ts`** (20 tests):
- 12 prereq-chain × 4 T3 universal × (zonder UB → false; met UB → true; T2 mist → false)
- 4 effect-validation: Carnavalsvuur aura, AIOptimization production-mult, Mergelharnas Heavy +3, DG-Wapens crit (mock Math.random)
- 4 duplicate-research-guards

Update `tests/TechTreeSystem-research-lifecycle.test.ts:81`: length 10 → 18.

---

## 10. Open vragen

Allemaal aanbeveling = ja:
1. Map-refactor van getUpgradeDefinition → ja
2. Optionele world param op canResearch/startResearch → ja
3. Carnavalsvuur stack-style multiplicatief → ja
4. AIOptimization factie-restrictie via UI → ja
5. combat-crit event nu emit → ja
6. Mergelharnas armor-stack additief → ja
7. Per-factie naming-overrides T3 → 2B-polish
8. UPGRADE_DEFINITIONS.length 10→18 → ja
9. Crit-multiplier 10x voor PoC → ja
10. Verifieer in implementatie of UpgradeBuilding-name "Gebouw"-fallback heeft

---

## 11. Verwachte impact

| File | +regels |
|---|---|
| types/index.ts | +20 |
| TechTreeSystem.ts | +120 |
| GezeligheidSystem.ts | +30 |
| ProductionSystem.ts | +5 |
| CombatSystem.ts | +20 |
| Game.ts | +60 |
| **Source** | **~255** |
| Tests | +400 |

Tests: 1092 → ~1112 + 1 length-update.

**Einde design-doc.**
