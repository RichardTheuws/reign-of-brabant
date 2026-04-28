# Bundel 3A Design — Carnavalstent + Boardroom

**Status**: Design (input voor implementatie-fase) — Bundel 3A v0.37.35
**Repo state verkend**: v0.37.34 (1120 tests groen)

---

## Codebase-bevindingen (verkend)

- Carnavalsvuur-aura zit in `src/systems/GezeligheidSystem.ts:175-200`, in het 500ms-throttled blok NA de tier-loop. Patroon: query Brabant TownHalls (`Building.complete=1`), per Brabander unit dist²-check, multiplicative `attackMult *= 1.10`. Carnavalstent komt vlak ernaast.
- ProductionSystem heeft 4 multiplicatieve duration-mods op `src/systems/ProductionSystem.ts:173-182`: `bureaucracyMod * ceoBuff * aiOptMod`. 5e factor `boardroomMod` past in dezelfde regel.
- `ceoProductionBuff` is module-state in `src/systems/HeroSystem.ts:692-695`, getikt op stap 8. Boardroom volgt dit patroon, maar binnen `BureaucracySystem.ts`.
- `BuildingCardAction` interface op `src/ui/HUD.ts:93-101`. `CommandAction` union op `HUD.ts:59-69` — moet uitgebreid met `'activate-boardroom'`.
- Pipeline: `SystemPipeline.ts:229` (Gezelligheid) en `:241` (Bureaucracy) — beide al in `'faction'`-fase. **GEEN nieuwe pipeline.add nodig**.
- Display-namen al correct: `factionData.ts:1557` (Carnavalstent) en `:1563` (Boardroom).
- Test-helper `spawnBuilding` in `tests/UpgradeBuildingResearch.test.ts:34-41` — herbruikbaar.

---

## 1. Carnavalstent (Brabant) — Aanbeveling: Optie A (attack-mult)

**Plan-tekst dubbelzinnig** ("+20% Gezelligheid in 12u radius"). Aanbeveling **Optie A — attack-mult `*= 1.20`**:
1. Consistent met Carnavalsvuur-pattern (8u, +10% op TownHall) — Carnavalstent is de "grote" gerichte variant (12u, +20%).
2. Direct waarneembaar in combat, simpel testbaar.
3. Optie B (Gezelligheid-resource gen) raakt complexere economie-tests met hoger regressie-risico.

**Mechaniek**:
- `RADIUS_SQ = 144`, `ATTACK_MULT = 1.20`.
- Niet-stapelend tussen meerdere Carnavalstents (`break` na eerste hit) → max 1.20× per unit per tick.
- WEL multiplicatief stapelend met Carnavalsvuur (1.10 × 1.20 = 1.32) en tier-bonus (tier 5: 1.40 × 1.10 × 1.20 = 1.848).

**Code-injectie** in `GezeligheidSystem.ts` na regel 200 (vóór closing brace 500ms-blok):
```ts
const CARNAVALSTENT_RADIUS_SQ = 144;
const CARNAVALSTENT_ATTACK_MULT = 1.20;

const tents: Array<{x:number;z:number}> = [];
for (const bEid of buildings) {
  if (Faction.id[bEid] !== FactionId.Brabanders) continue;
  if (hasComponent(world, bEid, IsDead)) continue;
  if (Building.typeId[bEid] !== BuildingTypeId.FactionSpecial1) continue;
  if (Building.complete[bEid] !== 1) continue;
  tents.push({ x: Position.x[bEid], z: Position.z[bEid] });
}
for (const eid of brabanderUnits) {
  for (const t of tents) {
    const dx = t.x - Position.x[eid], dz = t.z - Position.z[eid];
    if (dx*dx + dz*dz <= CARNAVALSTENT_RADIUS_SQ) {
      GezeligheidBonus.attackMult[eid] *= CARNAVALSTENT_ATTACK_MULT;
      break;
    }
  }
}
```

**Performance**: O(units × tents). 80 units × 5 tents = 400 dist-checks/500ms. Verwaarloosbaar.

**6 tests** (`tests/Bundel3-Carnavalstent.test.ts`):
1. Brabander unit binnen 12u → 1.20-factor toegepast
2. Buiten 12u → geen factor
3. Incomplete tent → geen effect
4. Niet-Brabant unit → geen effect
5. 2 Carnavalstents in overlap → factor blijft 1.20 (break-logica)
6. Carnavalstent + Carnavalsvuur stapelt → 1.10 × 1.20 = 1.32

---

## 2. Boardroom (Randstad) — CEO Kwartaalcijfers

**Mechaniek**:
| Param | Value |
|-------|-------|
| Effect | Randstad producerende buildings: `duration *= 0.667` (+50% speed) |
| Active duration | 30s |
| Cooldown total | 120s (= 90s rest na buff-end) |
| Initial state | cooldown=0, active=false |
| Stack | multiplicatief met CEO-hero/AIOpt/Bureaucracy |

**Scope**: alleen Randstad **producerende buildings** (symmetrisch met bestaande `ceoBuff`-pad).

**State** in `BureaucracySystem.ts` na regel 80:
```ts
export const boardroomBuff = { active: false, remaining: 0, cooldown: 0 };
const BOARDROOM_DURATION = 30;
const BOARDROOM_COOLDOWN = 120;
const BOARDROOM_PRODUCTION_MULT = 0.667;
```

In `bureaucracySystem(world,dt)` na vergaderingCooldown-tick:
```ts
if (boardroomBuff.active) {
  boardroomBuff.remaining -= dt;
  if (boardroomBuff.remaining <= 0) { boardroomBuff.active = false; boardroomBuff.remaining = 0; }
}
if (boardroomBuff.cooldown > 0) {
  boardroomBuff.cooldown -= dt;
  if (boardroomBuff.cooldown < 0) boardroomBuff.cooldown = 0;
}
```

Exports: `activateBoardroom(): boolean`, `isBoardroomReady(): boolean`, `getBoardroomState()`. Toevoegen aan `resetBureaucracy()`.

**ProductionSystem-patch** (regel 182):
```ts
import { boardroomBuff } from './BureaucracySystem';
const boardroomMod = (boardroomBuff.active && factionId === FactionId.Randstad) ? 0.667 : 1.0;
const effectiveDuration = duration * bureaucracyMod * ceoBuff * aiOptMod * boardroomMod;
```

**UI-wiring**:
- `HUD.ts:59-69` CommandAction union: + `'activate-boardroom'`
- `Game.ts:buildBuildingCardData` (regel 2411+): conditional action wanneer `buildingType === FactionSpecial1 && playerFactionId === Randstad`. Label dynamisch: `"Activeer Kwartaalcijfers"` / `"Actief (Xs)"` / `"Cooldown (Xs)"`. Hotkey `T`.
- `Game.ts onCommand`: `case 'activate-boardroom': this.tryActivateBoardroom();`
- Hotkey-scope: alleen card-action — voorkomt conflict met `train-hero-0` op Barracks.

**8 tests** (`tests/Bundel3-Boardroom.test.ts`):
1. Initial state: ready=true, active=false, cooldown=0
2. Activate gelukt → active=true, remaining=30, cooldown=120
3. Activate tijdens active → false, state ongewijzigd
4. Tick 35s → cooldown ~85s
5. Tick 30s → active=false, cooldown ≈ 90
6. Tick 120s → cooldown=0, ready=true
7. ProductionSystem met active buff: `effectiveDuration = duration × 0.667` (Randstad)
8. ProductionSystem zonder buff: factor 1.0

---

## 3. Pipeline + display

GEEN pipeline-changes (al in `'faction'`-fase). GEEN display-name fixes.

---

## 4. File-changes ramping

| File | LoC |
|------|-----|
| `GezeligheidSystem.ts` | +25 |
| `BureaucracySystem.ts` | +35 |
| `ProductionSystem.ts` | +3 |
| `HUD.ts` | +1 |
| `Game.ts` | +30 |
| `tests/Bundel3-Carnavalstent.test.ts` | ~150 |
| `tests/Bundel3-Boardroom.test.ts` | ~200 |

Totaal ~94 prod LoC + ~350 test LoC. Test-suite 1120 → ~1134.

---

## 5. Open vragen → aanbevelingen samengevat

| # | Vraag | Aanbeveling |
|---|-------|-------------|
| 1 | Carnavalstent: attack-mult of resource-gen? | **Attack-mult (A)** |
| 2 | Boardroom-scope: producerende Randstad of globaal? | **Alleen producerende Randstad-buildings** |
| 3 | Boardroom-hotkey | **T binnen-card** (geen globale binding) |
| 4 | Stack-regels | **Multiplicatief 4 factoren** |
| 5 | Multi-Carnavalstent | **Niet-stapelend** (break-after-first) |
