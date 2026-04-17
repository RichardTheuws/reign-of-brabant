# Audit 08 — RED Test Reproductie-Recepten (P0 Bugs)

**Versie**: RoB v0.37.2 | **Datum**: 2026-04-17 | **Doel**: Copy-paste recepten voor iteratie 1 (RED tests).

Elke recipe bevat: preconditie (ECS setup) · actie · verwachte uitkomst (assertion) · huidige manifestatie · test-skeleton · mocks · file location.

Alle recepten gebruiken **echte** exports uit de codebase. Kolom-importpaden zijn geverifieerd via grep.

---

## Bug 1 — Rally-point faalt bij resource-target (findEntityAtPosition)

**Hoofdverdachte**: `src/core/Game.ts:2212-2227` — `findEntityAtPosition()` itereert `entityMeshMap` en vergelijkt `mesh.position.{x,z}` ipv `Position.x/z[eid]`. Bij desync (mesh animatie-interpolatie, uncommitted position write) kiest het de verkeerde eid of mist het de resource volledig → `setRallyPoint()` krijgt `null` → `resourceEid` blijft `NO_ENTITY` → worker spawnt en gaat niet gathering.

### Preconditie
ECS wereld met:
- 1 resource-entity (tree): `Position(x=10, z=0)`, `Resource{type:Wood, amount:100}`, tag `IsResource`.
- 1 eigen Barracks/TownHall (niet nodig voor de pure unit-test; voor de integratietest wel).
- `entityMeshMap` waarbij de mesh voor de tree op `position.x=15, z=0` staat (2m desync, maar tree-eid Position zegt x=10).

### Actie
Speler klikt right-click op world-point (10, 0) — precies op de ECS-positie van de tree.

### Verwachte uitkomst (post-fix)
`findEntityAtPosition(10, 0)` retourneert de tree-eid (omdat Position component zegt dat die entity daar staat). Na fix moet de functie de **ECS Position component** lezen, niet `mesh.position`.

```ts
expect(findEntityAtPosition(world, 10, 0)).toBe(treeEid);
```

### Huidige manifestatie
`findEntityAtPosition(10, 0)` retourneert `null` (mesh staat op 15, buiten 5-unit radius) → `handleRallyPointPlacement` zet rally zónder resourceEid → ProductionSystem spawnt worker idle ipv gathering.

### Test-skeleton

```ts
// tests/rally-point-resource.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import * as THREE from 'three';
import { replaceWorld, world } from '../src/ecs/world';
import { Position, Resource } from '../src/ecs/components';
import { IsResource } from '../src/ecs/tags';
import { ResourceType } from '../src/types/index';

// Bug 1 recipe requires extracting findEntityAtPosition from Game.ts into a
// testable module OR testing it via a pure helper. Current impl is private;
// the fix should lift it to src/core/entityPicking.ts and accept
// (world, entityMeshMap, x, z) so it can be tested without a full Game.

// Expected post-fix signature:
import { findEntityAtPosition } from '../src/core/entityPicking';

describe('Bug 1 — findEntityAtPosition uses ECS Position, not mesh.position', () => {
  beforeEach(() => replaceWorld());

  function spawnTree(x: number, z: number): number {
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    addComponent(world, eid, Resource);
    addComponent(world, eid, IsResource);
    Position.x[eid] = x;
    Position.z[eid] = z;
    Resource.type[eid] = ResourceType.Wood;
    Resource.amount[eid] = 100;
    Resource.maxAmount[eid] = 100;
    return eid;
  }

  it('finds resource at its ECS Position even when mesh position drifted', () => {
    const treeEid = spawnTree(10, 0);
    const meshMap = new Map<number, THREE.Object3D>();
    const mesh = new THREE.Object3D();
    mesh.position.set(15, 0, 0); // 5 units off from ECS truth
    meshMap.set(treeEid, mesh);

    // Click on the ECS-truth position
    const hit = findEntityAtPosition(world, meshMap, 10, 0);
    expect(hit).toBe(treeEid);
  });

  it('returns null when no entity is within 5 unit radius of ECS position', () => {
    spawnTree(100, 100);
    const meshMap = new Map<number, THREE.Object3D>();
    const hit = findEntityAtPosition(world, meshMap, 0, 0);
    expect(hit).toBeNull();
  });

  it('prefers closest entity by ECS Position distance', () => {
    const close = spawnTree(2, 0);
    const far = spawnTree(4, 0);
    const meshMap = new Map<number, THREE.Object3D>();
    // Put far mesh CLOSER than close mesh — test that ECS wins
    const closeMesh = new THREE.Object3D(); closeMesh.position.set(20, 0, 0);
    const farMesh = new THREE.Object3D(); farMesh.position.set(0.1, 0, 0);
    meshMap.set(close, closeMesh);
    meshMap.set(far, farMesh);
    expect(findEntityAtPosition(world, meshMap, 0, 0)).toBe(close);
  });
});
```

### Mocks/stubs
- `THREE.Object3D` → real (tests already use three via MapGenerator).
- `entityMeshMap` → plain `Map<number, THREE.Object3D>`.
- Geen camera/raycaster nodig — we testen de picking-functie direct.

### File location
`tests/rally-point-resource.test.ts` (new).
Fix-locatie: extract `findEntityAtPosition` naar `src/core/entityPicking.ts` zodat het importeerbaar is zonder full Game-instantie.

---

## Bug 2 — Bruggen / DefenseTower negeren rivier-check

**Hoofdverdachte**: `src/systems/BuildSystem.ts:53-125` — `validateBuildingPlacement` accepteert DefenseTower (en een toekomstige `Bridge`) op elke niet-water tile. `Terrain.isRiver(x,z)` bestaat (`Terrain.ts:354-360`) maar wordt nooit aangeroepen.

### Preconditie
Terrain-mock met:
- `isRiver(x, z)` retourneert `true` voor `x ∈ [20, 30], z=0`, anders `false`.
- `getHeightAt(x, z)` retourneert altijd `1.0` (niet onder water).
- `isWater` kan optional zijn of ook mocken.

Lege ECS wereld (geen bestaande gebouwen, geen resources).

### Actie
Twee plaatsings-aanroepen voor DefenseTower (en/of de nieuw te introduceren `Bridge`-typeId):
1. `validateBuildingPlacement(world, DefenseTower, Brabanders, 50, 0, terrain)` → niet-rivier.
2. `validateBuildingPlacement(world, DefenseTower, Brabanders, 25, 0, terrain)` → middenin rivier.

### Verwachte uitkomst (post-fix)
1. Placement op land (niet-rivier) → **invalid** voor een echte Bridge-type (moet op rivier). Voor DefenseTower met rivier-constraint: eveneens invalid. Reason bevat `'rivier'` of structured code `'MUST_BE_ON_RIVER'`.
2. Placement op rivier → **valid** (bridge kan alleen op rivier staan; tower als constraint bestaat ook).

```ts
expect(result1.valid).toBe(false);
expect(result1.reason).toMatch(/rivier/i);
expect(result2.valid).toBe(true);
```

Omdat `Bridge` momenteel geen eigen `BuildingTypeId` heeft (zie audit 01 §5) mag de test ook de toekomstige enum-toevoeging forceren: `BuildingTypeId.Bridge = 11` (of via een separate check op DefenseTower).

### Huidige manifestatie
Beide calls retourneren `{valid:true}`. Tower/bridge-placering op gras is toegestaan. De bestaande water-fallback (`getHeightAt < 0.1`) vuurt niet omdat rivieren op terrain-niveau 0.5-1.0 liggen.

### Test-skeleton

```ts
// tests/placement-river-constraint.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { replaceWorld, world } from '../src/ecs/world';
import { validateBuildingPlacement } from '../src/systems/BuildSystem';
import { BuildingTypeId, FactionId } from '../src/types/index';

describe('Bug 2 — DefenseTower/Bridge requires river tile', () => {
  beforeEach(() => replaceWorld());

  const terrainStub = {
    getHeightAt: (_x: number, _z: number) => 1.0,
    isWater: (_x: number, _z: number) => false,
    // Fix must also expose this on the passed-in terrain:
    isRiver: (x: number, _z: number) => x >= 20 && x <= 30,
  };

  it('rejects DefenseTower/Bridge on land when river-constraint is active', () => {
    // NOTE: after fix, DefenseTower gains MUST_BE_ON_RIVER (or a dedicated
    // Bridge type is introduced). This test locks the behaviour.
    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.DefenseTower,
      FactionId.Brabanders,
      50, 0,
      terrainStub,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/rivier/i);
  });

  it('accepts Bridge placement when tile is a river', () => {
    const result = validateBuildingPlacement(
      world,
      BuildingTypeId.DefenseTower, // swap to BuildingTypeId.Bridge once enum added
      FactionId.Brabanders,
      25, 0,
      terrainStub,
    );
    expect(result.valid).toBe(true);
  });

  it('calls terrain.isRiver() during validation (regression guard)', () => {
    let called = false;
    const spy = {
      ...terrainStub,
      isRiver: (x: number, z: number) => { called = true; return terrainStub.isRiver(x, z); },
    };
    validateBuildingPlacement(world, BuildingTypeId.DefenseTower, FactionId.Brabanders, 50, 0, spy);
    expect(called).toBe(true);
  });
});
```

### Mocks/stubs
- `terrain` → plain object dat signature satisfieert: `{getHeightAt, isWater, isRiver}`.
- `isRiver` moet toegevoegd worden aan het `terrain`-parameter type in `validateBuildingPlacement` (zie `BuildSystem.ts:59`).

### File location
`tests/placement-river-constraint.test.ts` (new).
Fix raakt: `BuildSystem.ts` (add rivier-rule), `types/index.ts` (optioneel `Bridge` toevoegen aan `BuildingTypeId`).

---

## Bug 3 — Mill wood-proximity rule zonder structured reason (UX-blocker)

**Hoofdverdachte**: `src/systems/BuildSystem.ts:119-121` — returnt alleen string `'Houtkamp moet binnen 20 eenheden van bomen staan'`. De HUD kan geen context tonen (dichtste boom-positie, afstand). Test forceert structured API zodat ghost-renderer in P1 kan hooken.

### Preconditie
ECS wereld met:
- 1 wood-resource op `Position(34, 0)`, `Resource{type:Wood}`, tag `IsResource`.
- Geen wood binnen 20 units van de placement (34 > 20).

### Actie
`validateBuildingPlacement(world, LumberCamp, Brabanders, 0, 0, terrain)`.

### Verwachte uitkomst (post-fix)
`PlacementResult` bevat naast `reason` een structured veld, bv:

```ts
{
  valid: false,
  reason: 'Houtkamp moet binnen 20 eenheden van bomen staan',
  code: 'LUMBERCAMP_TOO_FAR_FROM_WOOD',
  details: {
    nearestWoodEid: <treeEid>,
    nearestWoodDistance: 34,
    nearestWoodPosition: { x: 34, z: 0 },
    requiredMaxDistance: 20,
  },
}
```

Assertion:
```ts
expect(result.valid).toBe(false);
expect(result.code).toBe('LUMBERCAMP_TOO_FAR_FROM_WOOD');
expect(result.details?.nearestWoodDistance).toBeCloseTo(34, 0);
expect(result.details?.nearestWoodPosition).toEqual({ x: 34, z: 0 });
```

### Huidige manifestatie
`result` is `{valid:false, reason:string}`. HUD toont alert zonder afstand of nearest-tree hint.

### Test-skeleton

```ts
// tests/placement-lumbercamp-structured.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld, world } from '../src/ecs/world';
import { Position, Resource } from '../src/ecs/components';
import { IsResource } from '../src/ecs/tags';
import { validateBuildingPlacement } from '../src/systems/BuildSystem';
import { BuildingTypeId, FactionId, ResourceType } from '../src/types/index';

describe('Bug 3 — LumberCamp validation returns structured PlacementResult', () => {
  beforeEach(() => replaceWorld());

  const terrain = {
    getHeightAt: () => 1.0,
    isWater: () => false,
    isRiver: () => false,
  };

  function spawnTree(x: number, z: number): number {
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    addComponent(world, eid, Resource);
    addComponent(world, eid, IsResource);
    Position.x[eid] = x;
    Position.z[eid] = z;
    Resource.type[eid] = ResourceType.Wood;
    Resource.amount[eid] = 100;
    Resource.maxAmount[eid] = 100;
    return eid;
  }

  it('returns structured reason with nearestWood distance when too far', () => {
    const tree = spawnTree(34, 0);
    const result = validateBuildingPlacement(
      world, BuildingTypeId.LumberCamp, FactionId.Brabanders, 0, 0, terrain,
    );
    expect(result.valid).toBe(false);
    expect(result.code).toBe('LUMBERCAMP_TOO_FAR_FROM_WOOD');
    expect(result.details?.nearestWoodEid).toBe(tree);
    expect(result.details?.nearestWoodDistance).toBeCloseTo(34, 0);
    expect(result.details?.nearestWoodPosition).toEqual({ x: 34, z: 0 });
    expect(result.details?.requiredMaxDistance).toBe(20);
  });

  it('returns valid=true with no details when a tree is in range', () => {
    spawnTree(15, 0);
    const result = validateBuildingPlacement(
      world, BuildingTypeId.LumberCamp, FactionId.Brabanders, 0, 0, terrain,
    );
    expect(result.valid).toBe(true);
    expect(result.code).toBeUndefined();
  });

  it('picks the NEAREST wood when multiple are out of range', () => {
    spawnTree(50, 0);
    const closer = spawnTree(25, 0);
    const result = validateBuildingPlacement(
      world, BuildingTypeId.LumberCamp, FactionId.Brabanders, 0, 0, terrain,
    );
    expect(result.details?.nearestWoodEid).toBe(closer);
    expect(result.details?.nearestWoodDistance).toBeCloseTo(25, 0);
  });
});
```

### Mocks/stubs
- `terrain` → minimal stub (hoogte/water/river checks niet geraakt bij LumberCamp-rule).

### File location
`tests/placement-lumbercamp-structured.test.ts` (new).
Fix raakt: `BuildSystem.ts` `PlacementResult` interface + return logic in de LumberCamp-rule. HUD hookt later op `details` voor ghost-preview.

---

## Bug 4 — FactionSpecial2 produceert Infantry/Ranged ipv Heavy/Siege

**Hoofdverdachte**: `src/data/factionData.ts:886,1012,1150,1252` — Feestzaal / Parkeergarage / Mijnwerkerskamp / Rijschool hebben allemaal `produces: [UnitTypeId.Infantry, UnitTypeId.Ranged]`. PRD §3 schrijft `Heavy` + `Siege` voor (Tractorrijder, CorporateAdvocaat, Mergelridder, Frituurridder, etc.). Secundair bug: alle 4 deze buildings gebruiken `typeId: BuildingTypeId.Barracks` in plaats van `BuildingTypeId.FactionSpecial2` → ze zijn überhaupt niet onderscheidbaar van gewone Barracks.

### Preconditie
Statische data — geen ECS setup nodig. Importeer `FACTION_BUILDINGS` en `ExtendedFactionId` uit `factionData.ts`.

### Actie
Voor elke van de 4 facties: zoek de FactionSpecial2-entry op in `FACTION_BUILDINGS[factionId]`.

### Verwachte uitkomst (post-fix)
Voor elke factie moet er een entry zijn met `typeId === BuildingTypeId.FactionSpecial2` en `produces` bevat tenminste één van `UnitTypeId.Heavy` of `UnitTypeId.Siege`, en bevat **geen** `UnitTypeId.Worker`. Tier-mapping in `TechTreeSystem.ts` gate naar T3.

```ts
const entry = FACTION_BUILDINGS[factionId]
  .find(b => b.typeId === BuildingTypeId.FactionSpecial2);
expect(entry).toBeDefined();
expect(entry!.produces).toEqual(
  expect.arrayContaining([UnitTypeId.Heavy]) // of Siege, per factie
);
expect(entry!.produces).not.toContain(UnitTypeId.Worker);
```

### Huidige manifestatie
`FACTION_BUILDINGS[factionId].find(b => b.typeId === BuildingTypeId.FactionSpecial2)` retourneert `undefined` omdat de data als `Barracks` is gelabeld. Zelfs als je op naam zoekt (Feestzaal etc.) is `produces = [Infantry, Ranged]`.

### Test-skeleton

```ts
// tests/faction-special2-produces.test.ts
import { describe, it, expect } from 'vitest';
import { FACTION_BUILDINGS, ExtendedFactionId } from '../src/data/factionData';
import { BuildingTypeId, UnitTypeId } from '../src/types/index';

describe('Bug 4 — FactionSpecial2 produces Heavy/Siege units', () => {
  const factions = [
    ExtendedFactionId.Brabanders,
    ExtendedFactionId.Randstad,
    ExtendedFactionId.Limburgers,
    ExtendedFactionId.Belgen,
  ] as const;

  for (const factionId of factions) {
    describe(`faction ${ExtendedFactionId[factionId]}`, () => {
      it('has exactly one FactionSpecial2 building', () => {
        const entries = FACTION_BUILDINGS[factionId]
          .filter(b => b.typeId === BuildingTypeId.FactionSpecial2);
        expect(entries.length).toBe(1);
      });

      it('produces Heavy or Siege tier units (not plain Infantry/Ranged)', () => {
        const entry = FACTION_BUILDINGS[factionId]
          .find(b => b.typeId === BuildingTypeId.FactionSpecial2);
        expect(entry).toBeDefined();
        const advanced = [UnitTypeId.Heavy, UnitTypeId.Siege];
        const hasAdvanced = entry!.produces.some(u => advanced.includes(u));
        expect(hasAdvanced).toBe(true);
      });

      it('does not duplicate Barracks produce list', () => {
        const entry = FACTION_BUILDINGS[factionId]
          .find(b => b.typeId === BuildingTypeId.FactionSpecial2);
        const barracks = FACTION_BUILDINGS[factionId]
          .find(b => b.typeId === BuildingTypeId.Barracks);
        expect(entry!.produces).not.toEqual(barracks!.produces);
      });

      it('is tier 3 (costGold >= 250)', () => {
        const entry = FACTION_BUILDINGS[factionId]
          .find(b => b.typeId === BuildingTypeId.FactionSpecial2);
        expect(entry!.costGold).toBeGreaterThanOrEqual(250);
      });
    });
  }
});
```

### Mocks/stubs
Geen. Pure data-assertions.

### File location
`tests/faction-special2-produces.test.ts` (new).
Fix raakt: `src/data/factionData.ts` — 4 entries updaten (typeId + produces).

---

## Bug 5 — SiegeWorkshop ghost feature: HUD-button bestaat, data ontbreekt

**Hoofdverdachte**: `src/ui/HUD.ts:246,255,264,274` rendert SiegeWorkshop-knoppen (Tractorschuur / Sloopwerf / Steengroeve / Frituurkanon-werkplaats). Grep op `FACTION_BUILDINGS` (factionData.ts:799-1312) vindt **geen** entries met `typeId: BuildingTypeId.SiegeWorkshop` voor ANY factie. Klik → BuildSystem accepteert placement (generic), maar ProductionSystem heeft geen produce-list → building doet niets.

### Preconditie
Statische data — importeer `FACTION_BUILDINGS` en controleer elke factie.

### Actie
`FACTION_BUILDINGS[factionId].find(b => b.typeId === BuildingTypeId.SiegeWorkshop)` voor elke factie.

### Verwachte uitkomst (post-fix)
Voor elke factie bestaat een entry met:
- `typeId === BuildingTypeId.SiegeWorkshop`
- `produces` bevat `UnitTypeId.Siege` (en evt. `Heavy`)
- `costGold >= 300` (T3 gating)
- `buildTime >= 40`

```ts
for (const factionId of allFactions) {
  const siege = FACTION_BUILDINGS[factionId]
    .find(b => b.typeId === BuildingTypeId.SiegeWorkshop);
  expect(siege, `faction ${factionId} missing SiegeWorkshop`).toBeDefined();
  expect(siege!.produces).toContain(UnitTypeId.Siege);
}
```

### Huidige manifestatie
`siege` is `undefined` voor alle 4 facties. HUD-button triggert `enterBuildMode(SiegeWorkshop)` → placement wordt toegestaan (generic validatie), maar building heeft geen production-lookup → ghost feature.

### Test-skeleton

```ts
// tests/siege-workshop-data-parity.test.ts
import { describe, it, expect } from 'vitest';
import { FACTION_BUILDINGS, ExtendedFactionId } from '../src/data/factionData';
import { BuildingTypeId, UnitTypeId } from '../src/types/index';

describe('Bug 5 — SiegeWorkshop data exists for every faction (HUD/data parity)', () => {
  const factions = [
    ExtendedFactionId.Brabanders,
    ExtendedFactionId.Randstad,
    ExtendedFactionId.Limburgers,
    ExtendedFactionId.Belgen,
  ] as const;

  for (const factionId of factions) {
    describe(`faction ${ExtendedFactionId[factionId]}`, () => {
      it('has a SiegeWorkshop entry in FACTION_BUILDINGS', () => {
        const siege = FACTION_BUILDINGS[factionId]
          .find(b => b.typeId === BuildingTypeId.SiegeWorkshop);
        expect(siege, `SiegeWorkshop missing for faction ${factionId}`).toBeDefined();
      });

      it('produces at least Siege units', () => {
        const siege = FACTION_BUILDINGS[factionId]
          .find(b => b.typeId === BuildingTypeId.SiegeWorkshop);
        expect(siege!.produces).toContain(UnitTypeId.Siege);
      });

      it('is tier 3 priced (costGold >= 300, buildTime >= 40)', () => {
        const siege = FACTION_BUILDINGS[factionId]
          .find(b => b.typeId === BuildingTypeId.SiegeWorkshop);
        expect(siege!.costGold).toBeGreaterThanOrEqual(300);
        expect(siege!.buildTime).toBeGreaterThanOrEqual(40);
      });

      it('has a faction-flavoured name (not empty, not default)', () => {
        const siege = FACTION_BUILDINGS[factionId]
          .find(b => b.typeId === BuildingTypeId.SiegeWorkshop);
        expect(siege!.name).toBeTruthy();
        expect(siege!.name.length).toBeGreaterThan(2);
      });
    });
  }

  // HUD label consistency check (the labels defined at HUD.ts:246-274 must
  // match the data `name` field per faction):
  it('HUD label per faction matches data.name (parity guard)', () => {
    const expected: Record<number, string> = {
      [ExtendedFactionId.Brabanders]: 'Tractorschuur',
      [ExtendedFactionId.Randstad]: 'Sloopwerf',
      [ExtendedFactionId.Limburgers]: 'Steengroeve',
      [ExtendedFactionId.Belgen]: 'Frituurkanon-werkplaats',
    };
    for (const [fid, label] of Object.entries(expected)) {
      const siege = FACTION_BUILDINGS[Number(fid)]
        .find(b => b.typeId === BuildingTypeId.SiegeWorkshop);
      expect(siege!.name).toBe(label);
    }
  });
});
```

### Mocks/stubs
Geen. Pure data-assertions.

### File location
`tests/siege-workshop-data-parity.test.ts` (new).
Fix raakt: `src/data/factionData.ts` — 4 nieuwe entries toevoegen (één per factie) met juiste typeId, produces, kosten, bouwtijd, naam.

---

## Samenvatting — File-layout na iteratie 1

| Test file | Bug | Nieuwe test-entry points |
|-----------|-----|--------------------------|
| `tests/rally-point-resource.test.ts` | 1 | `findEntityAtPosition(world, meshMap, x, z)` — extracted helper |
| `tests/placement-river-constraint.test.ts` | 2 | `validateBuildingPlacement` met `terrain.isRiver` mock |
| `tests/placement-lumbercamp-structured.test.ts` | 3 | `PlacementResult.{code, details}` uitgebreid interface |
| `tests/faction-special2-produces.test.ts` | 4 | data-driven asserts over `FACTION_BUILDINGS` |
| `tests/siege-workshop-data-parity.test.ts` | 5 | data-driven asserts + HUD-label parity |

---

## Source-code impact (voor iteratie 2 green)

| File | Wijziging | Bug |
|------|----------|-----|
| `src/core/entityPicking.ts` (new) | extract `findEntityAtPosition` uit Game.ts, gebruik `Position.x/z[eid]` | 1 |
| `src/core/Game.ts:2212-2227` | vervang privé method door import uit entityPicking | 1 |
| `src/systems/BuildSystem.ts:53-125` | `terrain` type uitbreiden met `isRiver`; rivier-rule toevoegen voor Bridge/DefenseTower; LumberCamp-rule → structured return met `code` + `details`; `PlacementResult` interface uitgebreid | 2, 3 |
| `src/types/index.ts` | optioneel `BuildingTypeId.Bridge = 11`; `PlacementResult` interface (als re-export) | 2, 3 |
| `src/data/factionData.ts:876-934 / 1002-1036 / 1138-1162 / 1240-1276` | FactionSpecial2 entries: typeId=FactionSpecial2, produces=[Heavy, Siege per factie]; 4 nieuwe SiegeWorkshop entries toevoegen | 4, 5 |

---

**Einde audit 08.**
