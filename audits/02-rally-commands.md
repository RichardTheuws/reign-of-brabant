# Rally Points & Unit Command Flows — Gameplay Audit v0.37.2

**Date:** 2026-04-17  
**Scope:** Complete audit of rally-point UI/UX and unit command dispatch flows  
**Status:** ROOT CAUSE & GAP ANALYSIS (no fixes applied)

---

## 1. Command Dispatch Flowchart (Textual)

```
INPUT LAYER (InputManager.ts:46-324)
├─ Mouse: leftClicked, rightClicked, dragActive
├─ Keyboard: keysDown (Q,W,E for hotkeys)
├─ Raycasting: terrain & entity picking
└─ Canvas events: mousedown, mouseup, mousemove, contextmenu

         ↓ (snapshot each frame)

GAME EVENT HANDLER (Game.ts:1376-1496)
├─ Left-click: 
│  ├─ [if dragActive] → boxSelectUnits() → SelectionManager
│  ├─ [if rallyPointMode] → handleRallyPointPlacement() → setRallyPoint()
│  ├─ [if buildMode] → handleBuildMode()
│  └─ [else] → raycastEntities() → selection update
├─ Right-click:
│  ├─ [if buildMode] → exitBuildMode()
│  ├─ [if rallyPointMode] → exitRallyPointMode()
│  ├─ [if selected building + RallyPoint component] → handleRallyPointPlacement()
│  └─ [else] → handleRightClick() → issue commands
└─ Keyboard:
   ├─ Q,W,E,R → HUD button callbacks
   └─ Spacebar, Escape → UI navigation

         ↓

HUD COMMAND ROUTING (HUD.ts:1813-1875)
├─ Training: onCommand('train-worker'|'train-infantry'|...)
├─ Building: onCommand('build-...')
├─ Rally: onCommand('rally-point') → enterRallyPointMode()
├─ Stop/Hold: onCommand('stop'|'hold')
└─ Hotkeys: dynamic binding from KeyDown events

         ↓

GAME COMMAND HANDLER (Game.ts:767-862)
├─ 'rally-point' → enterRallyPointMode() (Game.ts:1071-1089)
├─ 'move'/'attack'/'gather'/etc → queueCommand()
├─ Train commands → trainFromSelectedBuilding()
└─ Build commands → enterBuildMode()

         ↓

COMMAND QUEUE & VALIDATION (CommandSystem.ts:88-166)
├─ queueCommand(cmd) → push to commandBuffer[]
├─ commandSystem(world) processes each frame:
│  ├─ Get selected units (Selected.by[eid] === 0)
│  ├─ Switch on cmd.type:
│  │  ├─ 'move' → handleMove() [formation offsets, set Movement.targetX/Z]
│  │  ├─ 'attack' → handleAttack() [validate target exists, set UnitAI.state]
│  │  ├─ 'gather' → handleGather() [workers only, set Gatherer.state]
│  │  ├─ 'build' → handleBuild() [find nearest worker, move to site]
│  │  ├─ 'train' → handleTrain() [cost check, population check, queue unit]
│  │  ├─ 'attack-move' → handleAttackMove() [move with auto-aggro enabled]
│  │  ├─ 'stop' → handleStop() [clear targets, set Idle]
│  │  └─ 'hold' → handleHold() [set HoldPosition state]
│  └─ Clear commandBuffer at end of frame

         ↓

ECS SYSTEM PIPELINE (SystemPipeline.ts)
├─ MovementSystem: Position.x/z += Movement.speed * dt toward target
├─ GatherSystem: Gatherer.state machine (MOVING→GATHERING→RETURNING)
├─ CombatSystem: auto-aggro, attack cooldown, apply damage
├─ ProductionSystem: unit training, RALLY-POINT SPAWN (ProductionSystem.ts:212-350)
│  ├─ spawnUnit() positions at default RALLY_OFFSET (3.0 units)
│  ├─ assignWorkerToResource() checks RallyPoint.resourceEid
│  │  ├─ If valid → sendWorkerToGather()
│  │  └─ If invalid → fall back to nearest resource OR custom rally point
│  └─ Non-workers: move to custom rally point if set
└─ PathfindingSystem: NavMesh pathfinding for NeedsPathfinding-tagged units

         ↓

RENDERING LAYER
└─ BuildingRenderer.setRallyPoint(): visual flag marker at position
```

---

## 2. Rally-Point Flow Detail

### UI Entry Points
| Action | Trigger | Handler | Code |
|--------|---------|---------|------|
| **Rally UI Button** | Click "RLY" button on building card | HUD.onCommand('rally-point') | HUD.ts:1813-1819 |
| **Right-click Terrain** | Right-click empty terrain with building selected | handleRightClick() → setRallyPoint() | Game.ts:2073-2110 |
| **Right-click Resource** | Right-click mine/tree with building selected | setRallyPoint(bEid, x, z, resourceEid) | Game.ts:2105-2106 |
| **Right-click Building** | Right-click building itself (clear rally) | clearRallyPoint(bEid) | Game.ts:2101 |

### State Machine: `rallyPointMode` (Game.ts:106-107)

```
[Normal] 
  ↓ (click rally button OR right-click with building selected)
[Rally Mode Active]
  ├─ Cursor: crosshair
  ├─ HUD: "Klik op het terrein om rally point te plaatsen"
  ├─ ModeIndicator: "Rally Point plaatsen"
  └─ Left-click → handleRallyPointPlacement()
     ├─ Raycast terrain mesh
     ├─ If hit:
     │  ├─ findEntityAtPosition(x, z) → check for resource
     │  ├─ If resource found → setRallyPoint(bEid, x, z, resourceEid)
     │  └─ Else → setRallyPoint(bEid, x, z) [position only]
     └─ exitRallyPointMode()
[Normal] (sound plays, flag appears on terrain)
```

### RallyPoint Component (components.ts:154-158)

```typescript
export const RallyPoint = {
  x: f32(),              // world X coordinate
  z: f32(),              // world Z coordinate
  resourceEid: u32(),    // target resource entity (NO_ENTITY = none)
};
```

**Default Rally Point:** Building position + offset (RALLY_OFFSET = 3.0)  
**Custom Rally Point:** Player-set via setRallyPoint()

---

## 3. Command Execution Status Matrix

| Command | Worker | Infantry | Ranged | Heavy | Siege | Support | Hero | Idle | Moving | Attacking | Gathering | Notes |
|---------|--------|----------|--------|-------|-------|---------|------|------|--------|-----------|-----------|-------|
| **MOVE** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | → Moving | ✅ interrupt | ✅ interrupt | ✅ interrupt | handleMove(), resets Gatherer |
| **ATTACK** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | → Attacking | → Attacking | → Attacking | → Attacking | handleAttack(), validates target exists |
| **GATHER** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | → MovingToResource | ✅ | → interrupt | → interrupt | Workers only; handleGather() |
| **ATTACK-MOVE** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | → Idle (auto-aggro) | → Idle | → Idle | ✅ | handleAttackMove(), CombatSystem.processAutoAggro |
| **STOP** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | idle | → Idle | → Idle | → Idle | handleStop(), clears Gatherer |
| **HOLD** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | → HoldPosition | → HoldPosition | → HoldPosition | → HoldPosition | handleHold(), no chase |
| **PATROL** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | N/A | N/A | N/A | N/A | **NOT IMPLEMENTED** |
| **GARRISON** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | N/A | N/A | N/A | N/A | **NOT IMPLEMENTED** |
| **REPAIR** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | N/A | N/A | N/A | N/A | **NOT IMPLEMENTED** |
| **BUILD** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | → Moving (to site) | N/A | N/A | N/A | Workers only; handleBuild() |
| **TRAIN** | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A | Buildings only; handleTrain() + ProductionSystem |
| **RALLY** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Buildings only; setRallyPoint() |

---

## 4. Rally-Point Behavior by Unit Type

### Workers (UnitTypeId.Worker)

**Spawn Behavior (ProductionSystem.ts:312-327):**
1. Try `assignWorkerToResource()` → check `RallyPoint.resourceEid`
2. If RallyPoint targeting valid resource → `sendWorkerToGather(resourceEid)`
3. Else if no resource → check if custom rally point set
4. If custom → move to rally position; else idle near building

**Right-Click During Gather:**
- Right-click empty terrain: MOVE command (CommandSystem.ts:136)
- Right-click resource: GATHER command (Game.ts:2124-2127)
- Interrupts current gathering, clears `Gatherer.state`

### Military Units (Infantry, Ranged, Heavy, Siege, Support)

**Spawn Behavior (ProductionSystem.ts:328-341):**
1. Check if custom rally point set
2. If custom → move to rally position
3. Else idle near building

**Right-Click Behavior:**
- Right-click position: MOVE command
- Right-click enemy: ATTACK command
- Right-click resource: GATHER command (errors for non-workers in handleGather — just skips)

### Heroes

**Spawn Behavior:** Heroes bypass rally-point system (spawned manually via mission/ability)

---

## 5. Root Cause Analysis: Rally-Point Bug

### Issue Summary
Players report: "Rally-point UI exists but setting target fails with error message."

### Investigation

**Code Paths Analyzed:**
- ✅ HUD.ts: Rally button creates command → onCommand('rally-point')
- ✅ Game.ts:852: handleHUDCommand routes to enterRallyPointMode()
- ✅ Game.ts:1071: enterRallyPointMode() validates building has RallyPoint component
- ✅ Game.ts:2171: handleRallyPointPlacement() raycasts terrain, finds entity at position
- ✅ Game.ts:2146: setRallyPoint() writes to RallyPoint component

**NO VALIDATION ERRORS FOUND in CommandSystem or setRallyPoint().**

### Hypothesis: UI-Only Bug (Alert Message Path)

**When enterRallyPointMode() fails** (Game.ts:1080):
```typescript
if (!hasComponent(world, bEid, RallyPoint)) {
  this.hud?.showAlert('Dit gebouw kan geen rally point hebben', 'warning');
  return;
}
```

**Possible Causes:**
1. Building spawned **without RallyPoint component** → game doesn't attach it during building creation
2. RallyPoint component exists but validation logic broken
3. Right-click before building placement complete → Building.complete[bEid] !== 1

**Affected Building Types:**
Check which building archetypes get RallyPoint component at spawn:

| Building Type | Has RallyPoint? | Code |
|---------------|-----------------|------|
| TownHall | ❓ | entities/factories.ts (NOT CHECKED) |
| Barracks | ❓ | entities/factories.ts (NOT CHECKED) |
| LumberCamp | ❓ | entities/factories.ts (NOT CHECKED) |
| Blacksmith | ❓ | entities/factories.ts (NOT CHECKED) |
| Others | ❓ | entities/factories.ts (NOT CHECKED) |

**CRITICAL GAP:** `factories.ts` must be audited to confirm RallyPoint component attachment.

### Secondary Issue: findEntityAtPosition() Precision

**Code (Game.ts:2212-2230):**
```typescript
private findEntityAtPosition(x: number, z: number): number | null {
  let closest: number | null = null;
  let closestDist = 5.0; // 5 unit click radius

  for (const [eid, mesh] of this.entityMeshMap) {
    const dx = mesh.position.x - x;
    const dz = mesh.position.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < closestDist) {
      closestDist = dist;
      closest = eid;
    }
  }
  return closest;
}
```

**Issue:** Uses mesh position, not actual entity Position component. If mesh position out of sync → wrong entity selected.

---

## 6. Broken Command Flows

### NOT IMPLEMENTED (Missing Code)
- ❌ **PATROL** — No UnitAIState.Patrolling, no waypoint system
- ❌ **GARRISON** — No garrison slots, no entry logic
- ❌ **REPAIR** — Workers cannot repair buildings
- ❌ **CAST-ABILITY** — Only hero abilities via Q/W/E work; unit abilities incomplete

### PARTIALLY BROKEN (Logic Issues)

| Issue | Symptoms | Root Cause | File:Line |
|-------|----------|-----------|-----------|
| **Right-click on resource during rally mode** | Unclear if resource target stored correctly | `findEntityAtPosition()` uses mesh.position vs Position component | Game.ts:2181-2183 |
| **Worker gather on dead resource** | Worker still tries to harvest | GatherSystem doesn't check Resource.maxAmount on GATHERING state | GatherSystem.ts:118 |
| **Invalid pathfinding for resource targets** | Worker gets stuck moving to resource | Resources may spawn on unwalkable terrain (no NavMesh check) | MapGenerator.ts (unaudited) |
| **Rally point on incomplete building** | Command succeeds but unit spawns incorrectly | ProductionSystem checks Building.complete but setRallyPoint() doesn't | Game.ts:2098 vs ProductionSystem.ts:158 |
| **Attack-move with isolated units** | Units don't attack each other (no friendly-fire logic) | CombatSystem.processAutoAggro only checks enemy faction | CombatSystem.ts (unaudited) |

---

## 7. Prioritized Fix Approach

### P0 (Critical — Blocks Rally-Point Feature)
1. **Audit entities/factories.ts** — Confirm RallyPoint component attached to all production buildings (TownHall, Barracks, etc.)
   - If missing → add RallyPoint component in building factory functions
2. **Test rally-point button** — Verify HUD message appears & mode activates
3. **Test right-click on resource** — Confirm resource entity detected & rally.resourceEid set correctly
   - If failing: fix findEntityAtPosition() mesh vs Position sync issue

### P1 (High — Improves Reliability)
1. **Lock rally-point UI until building complete** — Add Building.complete[bEid] === 1 check in HUD card rendering
2. **Validate resourceEid existence before spawn** — ProductionSystem.ts:420 already does this; ensure no races
3. **Add debug logs** — Log to console when rally-point commands succeed/fail for player debugging

### P2 (Medium — Polish)
1. Implement PATROL command (waypoint system)
2. Implement GARRISON (building slot management)
3. Add right-click context menu for unit commands (instead of implicit behaviors)

### P3 (Future)
1. REPAIR command for workers
2. Unit ability system (non-hero)
3. Multi-target commands (drag to create patrol path)

---

## 8. Test Cases (Manual Verification)

```
TEST: Rally Worker → Mine
Preconditions: Mine nearby, Barracks/TownHall built
Steps:
  1. Select TownHall/Barracks
  2. Right-click mine (or use Rally button → click mine)
  3. Train worker
Expected: Worker spawns, moves to mine, gathers

TEST: Rally Infantry → Position
Preconditions: Barracks built
Steps:
  1. Select Barracks
  2. Click Rally button
  3. Click empty terrain
  4. Train infantry
Expected: Infantry spawns, moves to marked position

TEST: Rally then Retarget
Preconditions: Rally already set
Steps:
  1. Re-click Rally button
  2. Click new position
Expected: New spawn target, old flag removed, new flag appears

TEST: Right-Click Building to Clear Rally
Preconditions: Rally point set
Steps:
  1. Select building
  2. Right-click building itself
Expected: Rally point flag removed, "Rally point gewist" message
```

---

## 9. Files to Audit Next

- `src/entities/factories.ts` — Building creation & component attachment
- `src/world/MapGenerator.ts` — Resource spawn validation (walkability)
- `src/systems/CombatSystem.ts` — Auto-aggro & friendly-fire logic
- `src/rendering/BuildingRenderer.ts` — Rally flag rendering
- `src/ecs/tags.ts` — Tag definitions for components


---

## APPENDIX: Factories.ts Verification

### RallyPoint Component Attachment ✅ CONFIRMED

**TownHall (createTownHall, factories.ts:502-517):**
```typescript
addComponent(world, eid, RallyPoint);
RallyPoint.x[eid] = x + 4;
RallyPoint.z[eid] = z;
RallyPoint.resourceEid[eid] = NO_ENTITY;
```
Status: ✅ **HAS RallyPoint**

**Barracks (createBarracks, factories.ts:538-553):**
```typescript
addComponent(world, eid, RallyPoint);
RallyPoint.x[eid] = x + 3;
RallyPoint.z[eid] = z;
RallyPoint.resourceEid[eid] = NO_ENTITY;
```
Status: ✅ **HAS RallyPoint**

**LumberCamp (createLumberCamp, factories.ts:662):**
Comment: "Lumber Camp does not produce units -- no Production/RallyPoint components needed"
Status: ❌ **NO RallyPoint** (correct, non-producing)

**Blacksmith (createBlacksmith, factories.ts:571):**
Comment: "Blacksmith does not produce units -- no Production/RallyPoint components needed"
Status: ❌ **NO RallyPoint** (correct, non-producing)

**Generic createBuilding (factories.ts:730-746):**
```typescript
if (buildingTypeId === BuildingTypeId.TownHall || buildingTypeId === BuildingTypeId.Barracks) {
  addComponent(world, eid, RallyPoint);
  RallyPoint.x[eid] = x + 3;
  RallyPoint.z[eid] = z;
  RallyPoint.resourceEid[eid] = NO_ENTITY;
}
```
Status: ✅ **HAS RallyPoint (for TownHall/Barracks)**

### Revised Root Cause Assessment

**Original Hypothesis:** Building doesn't have RallyPoint component
**Revised Finding:** ✅ RallyPoint IS properly attached to TownHall & Barracks

**NEW ROOT CAUSE CANDIDATES:**
1. **UI Button Binding Failure** — HUD rally button not wired to onCommand callback
   - Check: HUD.ts:1813-1819 button click handler assignment
2. **Mode Entry Validation Bug** — enterRallyPointMode() guards too strict
   - Check: Game.ts:1077-1079 hasComponent() call on uninitialized eid
3. **Raycasting Mesh-Entity Sync** — findEntityAtPosition() returns wrong eid
   - Likely cause: entityMeshMap out of sync with ECS world
4. **Right-Click Handler Timing** — Event fired before building fully selected
   - Check: Game.ts:2093-2098 selection validation order

### Revised Test Procedure

**Phase 1: UI Entry**
```
1. Open browser devtools console
2. Select TownHall/Barracks with mouse
3. Look for: "Selected entities: [eid]" debug output
4. Click Rally button
5. Expected: Cursor changes to crosshair, mode indicator appears
6. If fails: Check HUD.ts button handler binding
```

**Phase 2: Placement**
```
1. (Rally mode active from Phase 1)
2. Move mouse over mine/tree
3. Expected: Raycaster finds entity, console logs "Resource at X,Z"
4. Click on mine
5. Expected: Rally flag appears, mode exits
6. If fails: Check Game.ts:2181 findEntityAtPosition() logic
```

**Phase 3: Unit Spawn**
```
1. (Rally point set to mine from Phase 2)
2. Train worker
3. Expected: Worker appears, moves to mine, gathers
4. Check Console for errors in ProductionSystem/GatherSystem
5. If fails: Check ProductionSystem.ts:420 rallyResEid validation
```

