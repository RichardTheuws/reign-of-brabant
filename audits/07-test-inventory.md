# Audit 07 — Test Inventory & P0 Mapping

**Versie**: RoB v0.37.2 | **Datum**: 2026-04-17 | **Scope**: Test coverage mapping voor 5 P0 bugs uit audits 01-06
**Doel**: Directe input voor Iteratie 1 (RED tests schrijven)

---

## Sectie A — Test-stack & stijl

### Stack
- **Runner**: `vitest@^4.1.2` (ESM, Node env — geen jsdom geconfigureerd)
- **Config**: geen `vitest.config.ts` — defaults, test-glob `tests/*.test.ts`
- **Script**: `npm test` → `vitest run`; `npm run test:watch` → `vitest`
- **Imports**: alleen `describe, it, expect, beforeEach` uit `vitest`. Geen `vi`/mocks, geen snapshots.
- **TypeScript**: `type: module`, path-aliases (`@core`, `@systems`, …) in `vite.config.ts` — maar **tests gebruiken ze niet**; alles via relatieve paden `../src/...`.

### Conventies
1. **Pure logic only**: geen test raakt `three`, `bitecs`, DOM, canvas of assets. ECS world wordt nergens opgezet.
2. **Singleton state**: `playerState` (globale instance) wordt gedeeld; elke `beforeEach` roept `playerState.reset()`.
3. **Hand-rolled mocks**: zie `CampaignManager.test.ts:10-66` — factory + callback-builder met defaults die per test override-able zijn.
4. **Pure-function extraction**: als de System-logica niet geïsoleerd aanroepbaar is, wordt hij letterlijk **herschreven in de testfile** als pure functie (zie `ProductionSystem.test.ts:22-59` `shiftQueue/enqueueUnit`, en `CombatSystem.test.ts:24-42` `calculateDamage`). Elegant maar: **drift-risico** — test valideert een *kopie* van de logica, niet de echte SUT.
5. **Constanten-checks**: veel tests asserten alleen dat enum/constant-waarden niet verschuiven (`MIN_DAMAGE === 1`, `MAX_QUEUE_SLOTS === 5`). Nuttig als regressie-vangnet, beperkt voor gedragsbugs.

### Code-voorbeeld 1 — Singleton reset + canAfford style (PlayerState.test.ts:6-55)
```ts
beforeEach(() => { playerState.reset(); });

it('spend returns false when insufficient gold', () => {
  expect(playerState.spend(FactionId.Brabanders, 200)).toBe(false);
  expect(playerState.getGold(FactionId.Brabanders)).toBe(100);
});
```

### Code-voorbeeld 2 — Mock-factory pattern (CampaignManager.test.ts:45-66)
```ts
function createMockCallbacks(overrides: Partial<MissionCallbacks> = {}): MissionCallbacks {
  return {
    showMessage: () => {},
    getPlayerGold: () => 100,
    hasPlayerBuilding: () => false,
    /* … 13 andere defaults … */
    ...overrides,
  };
}
// Test overridet alleen wat relevant is:
const callbacks = createMockCallbacks({ getPlayerGold: () => 250 });
```

---

## Sectie B — Test-bestanden × scope

| File | LOC | Type | Dekt | Raakt P0? |
|------|-----|------|------|-----------|
| `tests/AIController.test.ts` | 114 | unit (class) | `AIController` constructor, strategy-naam per factie | ❌ |
| `tests/CampaignManager.test.ts` | 759 | integration (mocked callbacks) | `MissionSystem` lifecycle, objectives, victory/defeat, triggers, waves | ❌ |
| `tests/CombatSystem.test.ts` | 270 | unit (pure fn copy) | Damage formula, armor, Gezelligheid mults, range/aggro constants, `UnitAIState` enum | ❌ |
| `tests/LateGameScaling.test.ts` | 77 | unit (constants + 1 fn) | Upkeep debt, diminishing returns, AI HP scaling tiers, pop thresholds | ❌ |
| `tests/MapGenerator.test.ts` | 194 | unit (pure output) | `generateMap()` spawn count, template biomes, river/bridge/tunnel counts | ⚠️ Bug 2 (ziet bridge-count maar niet bridge-vs-river alignment) |
| `tests/PlayerState.test.ts` | 206 | unit (singleton) | gold/wood/food ops per factie, canAfford, reset | ❌ |
| `tests/ProductionSystem.test.ts` | 374 | unit (pure fn copy + singleton) | Queue shift/enqueue, pop-cap, bureaucracy mod, UnitTypeId enum waarden | ❌ |
| `tests/UpkeepSystem.test.ts` | 40 | unit (fn + constants) | `getUpkeepPerTick` per factie, tick interval | ❌ |

**Totaal**: 618 asserts, **0 die een van de 5 P0 bugs dekt**. Greps op `BuildSystem`, `validateBuildingPlacement`, `isRiver`, `Bridge`, `LumberCamp`, `findEntityAtPosition`, `RallyPoint`, `SiegeWorkshop`, `FactionSpecial2`, `FACTION_BUILDINGS`, `FACTION_UNITS`, `bitecs`, `createWorld`: **geen hits**.

---

## Sectie C — P0 Bug → Test-mapping

### Bug 1 — Rally-point `findEntityAtPosition` gebruikt mesh.position ipv Position-component
**File**: `src/core/Game.ts:2212-2230`

- **Bestaande coverage**: geen. Rally/selection/input-systemen hebben nul tests.
- **Gap**:
  - Geen test voor `findEntityAtPosition(x, z)` — functie zit als private method in `Game` en is niet extraheerbaar zonder refactor.
  - Geen test die verifieert dat een resource-entity op Position (px, pz) correct teruggevonden wordt, ongeacht waar `mesh.position` staat.
  - Geen test voor `setRallyPoint(bEid, x, z, resourceEid)` die bevestigt dat `RallyPoint.resourceEid` gezet wordt.
- **Aanbevolen bestand**: **NIEUW** `tests/RallyPointTargeting.test.ts`. `Game.ts` is te zwaar (three/ECS/DOM-gedrag) om direct te instantiëren — extract `findEntityAtPosition` naar een pure helper in bv. `src/utils/entityPicking.ts` (of test via een mini bitECS wereld met een handvol Position-entities). Kies de pure-extraction route — past bij bestaande stijl.
- **Aanbevolen test-namen** (BDD):
  - *given entity with Position(10,5) and stale mesh.position(50,50), when findEntityAtPosition(10,5), then returns that entity*
  - *given two entities within 5u click radius, when picking closest, then returns entity with smallest Position-distance (not mesh-distance)*
  - *given no entity within 5u, when findEntityAtPosition, then returns null*
  - *given Resource entity at (x,z), when setRallyPoint targets it, then RallyPoint.resourceEid is set and RallyPoint.x/z match*

### Bug 2 — Bruggen overal plaatsbaar, `Terrain.isRiver` nooit aangeroepen vanuit `BuildSystem`
**File(s)**: `src/systems/BuildSystem.ts`, `src/world/Terrain.ts:354-360`

- **Bestaande coverage**: gedeeltelijk en indirect.
  - `tests/MapGenerator.test.ts:122-145` checkt dat `classic`/`islands` templates rivers + bridges genereren (counts), maar **niet** of bridges op river-tiles staan.
  - Geen test voor `Terrain.isRiver()`.
  - Geen test voor `BuildSystem.validateBuildingPlacement()`.
- **Gap**:
  - `isRiver()` geen enkele assertie — dode API volgens audit 01.
  - Geen integratie-test "DefenseTower/Bridge op land → afgewezen, op river-tile → toegestaan".
  - Geen validatie dat bridge-spawn-coords overlappen met river-path (audit 06 §3).
- **Aanbevolen bestand**:
  - **NIEUW** `tests/BuildSystemPlacement.test.ts` voor `validateBuildingPlacement()` rules. Pure-extraction-route zoals Combat/Production: lift de validator-body in de test als referentie-implementatie en test met een gemockte `Terrain` stub (`{ isRiver: (x,z)=>boolean, getHeightAt: …, getMapSize: … }`).
  - **Uitbreiden** `tests/MapGenerator.test.ts` met bridge/river alignment-check.
- **Aanbevolen test-namen** (BDD):
  - *given Terrain.isRiver returns true at (x,z), when validateBuildingPlacement(Bridge, x, z), then accepted*
  - *given Terrain.isRiver returns false at (x,z), when validateBuildingPlacement(Bridge, x, z), then rejected with Dutch error mentioning 'rivier'*
  - *given DefenseTower without river-rule, when placed on non-river land, then accepted (baseline — fails if we over-reach)*
  - *given MapGenerator classic template, when inspecting bridges, then every bridge.x/z lies within rivier-path tolerance 2.0u*
  - *given Terrain constructed with a river at (5,5), when isRiver(5,5), then true; when isRiver(50,50), then false*

### Bug 3 — Mill wood-proximity UX gap (logic correct)
**File**: `src/systems/BuildSystem.ts:100-122` + `src/ui/HUD.ts`

- **Bestaande coverage**: geen.
- **Gap**:
  - Logic-test ontbreekt voor de "binnen 20 eenheden van Wood-resource" rule.
  - UX-gap is per definitie niet unit-testbaar (geen jsdom/DOM-env); we kunnen wél een **contract-test** op de error-string en op de afstandsgrens schrijven.
- **Aanbevolen bestand**: toevoegen aan **NIEUW** `tests/BuildSystemPlacement.test.ts` (zelfde file als Bug 2).
- **Aanbevolen test-namen** (BDD):
  - *given LumberCamp placed within 20u of a Wood resource, when validate, then accepted*
  - *given LumberCamp placed exactly 20u from nearest Wood, when validate, then accepted (inclusive boundary)*
  - *given LumberCamp placed at 21u (no wood within 20u), when validate, then rejected with error containing 'Houtkamp' and a distance-hint*
  - *given LumberCamp far from any wood, when validate, then error mentions the nearest-wood distance* (dwingt UX-fix af: error krijgt context)
  - *given non-LumberCamp building, when validate, then wood-proximity rule niet toegepast*

### Bug 4 — `FactionSpecial2.produces = [Infantry, Ranged]` moet Heavy/Siege per factie zijn
**File**: `src/data/factionData.ts:886, 1012, 1150, 1252`

- **Bestaande coverage**: geen directe test op `FACTION_BUILDINGS`. `ProductionSystem.test.ts:295-319` checkt alleen enum-waarden van `UnitTypeId`.
- **Gap**:
  - Geen assertie op inhoud van `FACTION_BUILDINGS[faction][BuildingTypeId.FactionSpecial2].produces`.
  - Geen coverage op de bij-effect-bugs: audit 03 meldt dat Heavy/Siege-units in `FACTION_UNITS` staan maar door géén enkel gebouw geproduceerd worden.
- **Aanbevolen bestand**: **NIEUW** `tests/FactionData.test.ts` — pure data-validatie, past perfect bij bestaande constanten-check-stijl.
- **Aanbevolen test-namen** (BDD):
  - *given Brabanders FactionSpecial2 (Feestzaal), when reading produces, then contains UnitTypeId.Heavy and UnitTypeId.Siege*
  - *given Randstad FactionSpecial2 (Parkeergarage), when reading produces, then contains UnitTypeId.Heavy and UnitTypeId.Siege*
  - *given Limburgers + Belgen FactionSpecial2, idem*
  - *given every faction-unit defined in FACTION_UNITS, when scanning all FACTION_BUILDINGS[*].produces, then unit typeId appears at least once (geen ghost-units)*
  - *given FactionSpecial2 for each factie, when comparing to Barracks.produces, then niet identiek (Barracks=T1, Special2=T3)*

### Bug 5 — `SiegeWorkshop` HUD-buttons zonder `FACTION_BUILDINGS`-entry (ghost feature)
**File(s)**: `src/ui/HUD.ts:246,255,264,274` vs `src/data/factionData.ts`

- **Bestaande coverage**: geen.
- **Gap**:
  - Niet getest of `FACTION_BUILDINGS[faction][BuildingTypeId.SiegeWorkshop]` bestaat per factie.
  - Niet getest of alle HUD-build-commands een matching `FACTION_BUILDINGS` entry hebben (symmetrie-test).
- **Aanbevolen bestand**: uitbreiden **NIEUW** `tests/FactionData.test.ts` (zelfde file als Bug 4).
- **Aanbevolen test-namen** (BDD):
  - *given each of 4 factions, when looking up FACTION_BUILDINGS[f][BuildingTypeId.SiegeWorkshop], then entry exists with non-empty label, cost en buildTime*
  - *given SiegeWorkshop entry per factie, when reading produces, then contains UnitTypeId.Siege (en optioneel Heavy)*
  - *given BuildingTypeId.SiegeWorkshop, when searched across FACTION_BUILDINGS, then found voor alle 4 FactionIds (dekking-matrix)*
  - *given SiegeWorkshop tier, when reading tech-tree entry, then T3-gated (sluit aan op audit 04 §4 tier-lock gap)*

---

## Sectie D — Test-utils: wat bestaat, wat mist

### Beschikbaar
| Util | Herkomst | Herbruikbaarheid |
|------|----------|------------------|
| `playerState.reset()` singleton | `src/core/PlayerState.ts` (prod-code) | ✅ al overal gebruikt in `beforeEach` |
| `createMinimalMission(overrides)` | inline `CampaignManager.test.ts:10-43` | ✅ patroon overneembaar voor andere factories |
| `createMockCallbacks(overrides)` | inline `CampaignManager.test.ts:45-66` | ✅ idem |
| `calculateDamage(…)` pure copy | inline `CombatSystem.test.ts:24-42` | ⚠️ drift-risico; referentie-implementatie |
| `shiftQueue/enqueueUnit` pure copies | inline `ProductionSystem.test.ts:22-59` | ⚠️ idem |
| MapGenerator direct callable | `src/world/MapGenerator.ts` | ✅ pure, deterministisch via seed |

### Ontbreekt
| Missing util | Waarom nodig voor Iter 1 | Voorstel |
|--------------|---------------------------|----------|
| **ECS World factory** | Bug 1 test wil Position-component entities zonder three.js. | `tests/helpers/world.ts` → `createTestWorld()` wrapper rond `bitecs.createWorld()` + `addEntity` helper. |
| **Entity-factory helpers** | Bug 1 → resource-entity met Position; Bug 2 → building entity voor collision tests. | `createResourceAt(world, x, z, type)`, `createBuildingAt(world, x, z, typeId, faction)` — minimaal, alleen de components die de SUT leest. |
| **Terrain stub/mock** | Bug 2 → `validateBuildingPlacement` leest `terrain.isRiver/getHeightAt/getMapSize`. | `tests/helpers/terrainStub.ts` → `makeTerrainStub({ riverAt?: [x,z][], heightAt?: fn, mapSize: 64 })`. Minimale interface, geen three.js dependency. |
| **BuildSystem extract** | `validateBuildingPlacement` is momenteel een methode op de class met Terrain+World state-refs. Nodig: ofwel (a) de klasse constructie zonder three, of (b) een pure export. | Bij voorkeur (b): verplaats de rules-body naar `src/systems/buildPlacementRules.ts` met signature `(world, terrain, buildingTypeId, x, z) → {ok, reason}`. Zelfde patroon als Combat/Production reeds doen. |
| **Game-context stub** | Bug 1 → `findEntityAtPosition` leest `entityMeshMap`. | Na extract naar pure util: niet meer nodig. Anders `makeGameStub({ entities: [{eid, meshPos, componentPos}] })`. |
| **FACTION_BUILDINGS/FACTION_UNITS accessors** | Bug 4+5 — pure data, importeerbaar. | Geen helper nodig, direct importeren uit `src/data/factionData.ts`. |

### Aanbevelingen voor Iter 1 (RED-fase)
1. **Maak `tests/helpers/` dir** (eerste subfolder ooit in `tests/`). Minimaal: `world.ts`, `terrainStub.ts`. Houd het dun — bestaande stijl is "pure logica, geen fixtures".
2. **Voorkeur: pure-fn extract** over world-mock voor Bug 1 en 2. Bestaande tests hebben dat patroon (`calculateDamage`, `shiftQueue`) al genormaliseerd. Minder code, minder three.js import-ruis.
3. **Data-tests vereisen geen helpers** (Bug 4+5) — `FactionData.test.ts` kan direct `import { FACTION_BUILDINGS } from '../src/data/factionData'` en asserten.
4. **Drift-waarschuwing opvolgen**: nieuwe tests die de SUT kopiëren moeten een `// SOURCE: src/…:lines` comment krijgen, zodat reviewers zien waar de referentie-implementatie vandaan komt.

---

## Samenvatting

- Portfolio is **pure-logic testing**: geen DOM, geen ECS-world setup, geen three.js. Dit werkt goed voor Combat/Production/PlayerState/Map, maar **geen van de 5 P0 bugs** heeft bestaande coverage.
- **Twee nieuwe bestanden** dekken alle 5 bugs:
  1. `tests/BuildSystemPlacement.test.ts` — Bug 2 (bridge/river) + Bug 3 (LumberCamp wood-proximity).
  2. `tests/FactionData.test.ts` — Bug 4 (Special2.produces) + Bug 5 (SiegeWorkshop coverage).
  3. `tests/RallyPointTargeting.test.ts` — Bug 1 (findEntityAtPosition + setRallyPoint).
- **Één uitbreiding**: `tests/MapGenerator.test.ts` krijgt bridge-vs-river alignment-assertie.
- **Refactor-voorvereisten** (1x pijn, nu dekking permanent):
  - Extract `validateBuildingPlacement`-body naar pure `src/systems/buildPlacementRules.ts`.
  - Extract `findEntityAtPosition`-body naar pure `src/utils/entityPicking.ts`.
  - Beide volgen al bestaand patroon in CombatSystem (`getAIHPScaling` is geëxporteerd).
- **Minimale helpers** in nieuwe `tests/helpers/`: `terrainStub.ts` + `world.ts`. Niet alles vooraf bouwen — alleen wat de eerste RED tests vereisen.

**Einde audit 07.**
