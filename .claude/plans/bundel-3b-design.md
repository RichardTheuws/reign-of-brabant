# Bundel 3B Design — VlaaiwinkelSystem + DiplomatiekSalonSystem

**Status**: Design (input voor implementatie-fase) — Bundel 3B v0.37.35
**Repo state verkend**: v0.37.34 (1120 tests groen)

---

## 0. Repo-anker

| Wat | Waar |
|-----|------|
| Pipeline-bouwer | `src/systems/SystemPipeline.ts:216-276` (`createGamePipeline`) |
| CombatSystem-add | `src/systems/SystemPipeline.ts:253` |
| Heal-pattern referentie | `src/systems/GezeligheidSystem.ts:208-222` (`applyPassiveHeal`) |
| Throttle-pattern | `src/systems/GezeligheidSystem.ts:109-120` |
| `createUnit()` | `src/entities/factories.ts:681-708` |
| `eventBus.emit` type-map | `src/types/index.ts:959-978` |
| PlayerState | `addGold`, `addWood`, `addTertiary` |
| Math.random idiom | `src/systems/CombatSystem.ts:64` |

---

## 1. VlaaiwinkelSystem — heal-pulse 10 HP / 5s in 10u radius

**File**: `src/systems/VlaaiwinkelSystem.ts`. **Pipeline**: phase `'combat'`, na CombatSystem (heal mag combat-damage same-tick reverten).

**Constants**:
```ts
const VLAAIWINKEL_RADIUS_SQ = 100;   // 10u
const VLAAIWINKEL_HEAL_AMOUNT = 10;
const UPDATE_INTERVAL = 5.0;
```

**Algoritme** (factory pattern, `let accumulator = 0`):
1. `accumulator += dt`; if `< 5` return; else `accumulator -= 5`.
2. Scan complete Limburger `BuildingTypeId.FactionSpecial1` buildings — cache `{x,z}` array.
3. Voor elke Limburger unit (`!IsDead`, `Health.current > 0`, `current < max`): tel `pulses` = aantal Vlaaiwinkels binnen `radius_sq`. `Health.current[eid] = min(max, current + 10 * pulses)`.

**Stapel-keuze: STAPELT** (`pulses × 10`). Overlap is zeldzaam, tunable via 1 constante.

**Performance**: 50 buildings × 100 units / 5s = 1000 dist-checks/sec — verwaarloosbaar.

### Tests `tests/VlaaiwinkelSystem.test.ts` (8)

1. Heal binnen radius — 1 Vlaai @ (0,0), Limb Infantry @ (5,0) HP=50 → 60
2. Geen heal buiten radius — unit @ (15,0) → blijft 50
3. Factie-lock — Brabander Infantry @ (5,0) → blijft 50
4. Stapelt — 2 Vlaaiwinkels, unit @ (5,0) HP=50 → 70
5. HP-clamp — HP=95 → 100
6. Throttle — tick(4) → geen heal
7. IsDead-gebouw → 0
8. Incomplete `complete=0` → 0

---

## 2. DiplomatiekSalonSystem — random event 90s

**File**: `src/systems/DiplomatiekSalonSystem.ts`. **Pipeline**: phase `'faction'`, na VlaaiwinkelSystem.

**State** (module-scope):
```ts
const salonState = new Map<number, { cooldown: number }>();
const COOLDOWN_SECONDS = 90;
export function _resetSalonState() { salonState.clear(); }  // test-hook
```

**Algoritme**:
1. Scan complete Belgen FactionSpecial1 → `activeSalonEids[]`.
2. Cleanup state-entries die niet meer in actieve set zitten (handle dead/recycled eids).
3. Voor elke active eid: geen state? → set cooldown=90, continue. Anders `cooldown -= dt`. Bij `<= 0`: roll, fire event, reset 90s.

**Outcomes** (`Math.random()`):
- `< 0.33` → `'chocolade'`: `playerState.addTertiary(Belgen, 50)`
- `< 0.66` → `'resources'`: `addGold(Belgen, 200)` + `addWood(Belgen, 100)`
- `>= 0.66` → `'spawn'`: `createUnit(world, UnitTypeId.Worker, FactionId.Belgen, x+2, z)`

**Vrede vervangen door chocolade**: vrede vereist global state mutation in CombatSystem (te invasief, exploit-prone). Chocolade past in Belgen-economy.

**Spawn-unit type: Worker** (Bierbouwer): pacing + thematisch (Salon trekt economisch verkeer, geen militair).

**Cooldown bij verse spawn: 90s** (geen instant payout bij build-rush).

**Event-emit**:
```ts
export interface DiplomatiekEventEvent {
  outcome: 'chocolade' | 'resources' | 'spawn';
  x: number; z: number; eid: number;
}
// in GameEvents:
'diplomatiek-event': DiplomatiekEventEvent;
```

### Tests `tests/DiplomatiekSalonSystem.test.ts` (10)

`vi.spyOn(Math, 'random').mockReturnValue(X)`. `beforeEach`: `replaceWorld()`, `playerState.reset()`, `eventBus.clear()`, `_resetSalonState()`.

1. Init: tick(0) → state heeft eid met cooldown=90
2. <90s geen event: tick(89) → 0 events
3. ≥90s trigger: tick(0)+tick(90.01), random=0.5 → outcome=resources, gold+200, wood+100
4. Outcome chocolade: random=0.1 → tertiary[Belgen]=50
5. Outcome resources: random=0.5 → gold+200, wood+100
6. Outcome spawn: random=0.9 → nieuwe Belgen Worker
7. 2 Salons onafhankelijk
8. Niet-Belgen FactionSpecial1 → 0 events
9. Dood/incomplete → 0 events
10. Event-payload type-check

---

## 3. SystemPipeline integratie

In `SystemPipeline.ts` factory, na `pipeline.add('CombatSystem', …)`:
```ts
pipeline.add('VlaaiwinkelSystem', createVlaaiwinkelSystem(), 'combat');
pipeline.add('DiplomatiekSalonSystem', createDiplomatiekSalonSystem(), 'faction');
```

---

## 4. Test-helpers

`spawnBuilding`/`spawnUnit` zijn niet-geëxporteerd in `UpgradeBuildingResearch.test.ts` — kopieer naar beide nieuwe test-files. Breid `spawnUnit` uit met optionele HP-args.

---

## 5. Open vragen → aanbevelingen

| # | Vraag | Aanbeveling |
|---|-------|-------------|
| 1 | Vlaaiwinkel stapelt? | **Ja** (`pulses × 10 HP`) |
| 2 | Diplomatie vrede-outcome? | **Vervang met +50 chocolade** |
| 3 | Spawn-unit type? | **Worker (Bierbouwer)** |
| 4 | Cooldown bij verse spawn | **90s** |
| 5 | Outcome-naam | **`'chocolade'`** (factionData-consistent) |

---

## 6. Delta

- 2 nieuwe `src/systems/` files (~80 + ~110 regels)
- 1 type-extensie (`DiplomatiekEventEvent`)
- 2 nieuwe test-files (8 + 10 = 18 tests)
