# Map/Terrain System Audit — RoB v0.37.2

## 1. Architecture Overview

### Map Generation Pipeline
- **Entry**: `src/core/Game.ts:224` calls `generateMap()` with seed + playerCount + mapTemplate
- **Generator**: `src/world/MapGenerator.ts` — pure procedural generation (8 templates)
- **Render**: `src/world/Terrain.ts` constructor + `rebuild()` applies terrainFeatures to 3D mesh
- **NavMesh**: `src/pathfinding/NavMeshManager.ts` built from terrain mesh after carving

### Terrain Types
TerrainFeatures (`src/types/index.ts:868–926`):
- **rivers**: Array of RiverSpawn (path + width) — carved into terrain, lowered to WATER_LEVEL (-1)
- **bridges**: Array of BridgeSpawn (x, z, rotation, width, length) — 3D models placed, exclude river carving
- **rockWalls**: Raised terrain formations (impassable)
- **roads**: Marked on vertices (speed bonus via ROAD_SPEED_BONUS = 1.35)
- **tunnels**: Entrance/exit pairs with faction ownership
- **flattenPositions**: Areas to flatten for bases/features

### Coordinate System
- World: ±(mapSize/2), e.g. ±64 for 128×128 map
- Grid: Terrain vertices indexed as `(iz * stride + ix)`, stride = segments+1
- Conversion: `worldX = (ix / segments) * mapSize - halfSize` (line Terrain.ts:694)
- **Consistent**: Yes, bijective mapping maintained throughout

---

## 2. River & Bridge Spawning — ROOT CAUSE ANALYSIS

### Intended Design (Code Intent)
```
Bridge = Structure that SPANS a river
∴ Bridge should only spawn where river exists at that location
```

### Reality: **Bridges Are Template-Agnostic**
All 8 templates define bridges in their feature generators:
1. **classic** (generateClassicFeatures): 2 bridges, tied to NW→SE diagonal river ✓
2. **river-valley** (generateRiverValley): 5 bridges along horizontal river ✓
3. **crossroads**: 0 bridges (no rivers) ✓
4. **islands**: 0 bridges (no rivers) ✓
5. **arena**: 0 bridges (no rivers) ✓
6. **fortress**: 0 bridges (0 rivers) ✓
7. **canyon**: 0 bridges (0 rivers) ✓
8. **archipelago**: Multiple bridges tied to ring + radial rivers ✓

**Problem**: Template selection is deterministic (`mapTemplate` param in `Game.ts:224`), but:
- If player/UI allows selecting **'classic'** template → 2 bridges spawn over the NW→SE river ✓
- If UI bug or fallback loads **wrong template** → bridges appear with no river

### Terrain Carving: Bridge Exclusion Works
`src/world/Terrain.ts:676–747` (`carveRivers()` method):
- Line 684: Loads all bridges from features
- Lines 700–718: For each vertex, checks if within oriented bridge rectangle
- **If yes**: Skips river carving (`continue` at line 719)
- **Result**: River bed NOT carved under bridges, water level stays high
- **Status**: ✓ Correct — prevents river from flowing under bridge

### Bridge Rendering: Placement is Always Executed
`src/world/Terrain.ts:831–860` (`buildFeatureVisuals()` method):
- Line 838: `for (const bridge of this.features.bridges)`
- Lines 844–845: Places GLB model at `(bridge.x, yPos, bridge.z)` with bridge.rotation
- **No validation**: Bridge is placed even if:
  - No river exists at (x, z)
  - River is not close to bridge location
  - Bridge rotation doesn't align with any river

### **ROOT CAUSE: Bridges rendered independently of rivers**
- Bridges come from `this.features.bridges` (TerrainFeatures array)
- Rivers come from `this.features.rivers` (separate TerrainFeatures array)
- **No runtime check** that each bridge is on a river
- **No validation** that bridge position/rotation aligns with river path direction

---

## 3. River Detection Status

### Detection Exists (But Limited)
- **In-code detection**: `src/world/Terrain.ts:354–360` (`isRiver()` method)
  - Checks `riverMask` array at world position
  - Returns true/false for any (x, z)
- **Usage**: Fallback pathfinding in `NavMeshManager.ts:103–125`
  - If recast-navigation WASM fails, `terrainRef.isRiver()` blocks direct movement
  
### Missing: Pre-spawn Validation
**No function validates**:
- Bridge (x, z) is within min distance of any river path
- Bridge rotation aligns with river flow direction
- Bridge width/length covers the river width at that location

**Lines not found**: No `validateBridge()`, `isValidBridgePosition()`, or equivalent

### Recommendation
Before bridge renders (Terrain.ts:838), validate:
```typescript
for (const bridge of this.features.bridges) {
  const riverAtBridge = findNearestRiver(bridge.x, bridge.z, this.features.rivers);
  if (!riverAtBridge || distanceToRiver(bridge, riverAtBridge) > 2.0) {
    console.warn(`Bridge at (${bridge.x}, ${bridge.z}) has no river`);
    // Skip rendering or log error
  }
}
```

---

## 4. Resource Spawning — Assessment

### Density & Distribution
**Classic template (default, 128×128 map, 2 players)**:
- **Gold mines**: 2 per player (base) + 2 contested centre = 6 total
  - Amount: 2000 (base) × 2, 3000 (contested) × 2
  - Placement: `src/world/MapGenerator.ts:517–548` (deterministic offsets)
- **Trees**: 
  - Grove count: 4 (2 per player, 2 contested)
  - Trees per grove: 3–5 (random)
  - Placement: scattered ±GROVE_SPREAD (3 units)
- **Decorations**: 120 trees + 60 rocks, procedurally scattered
  - `src/world/MapGenerator.ts:663–667` (`generateDecorations()`)

### Minimum Distance from TC
**LumberCamp only**: Must be within 20 units of tree resource
- Enforced in `src/systems/BuildSystem.ts:101–122` (validateBuildingPlacement)
- **All other resources**: No TC proximity constraint
- **Town Hall**: Spawned at player bases (predefined), no conflict check

### River Validation
**Active**: Resources nudged away from rivers
- `src/world/MapGenerator.ts:649–657`: Mines/trees validated with `nudgeFromRiver()`
- Line 1770: minRiverDist = 36 (6-unit minimum from river center path points)
- Fallback offsets: ±8, ±10, ±12 units (lines 1817–1823)
- **Status**: ✓ Resources avoid rivers correctly

### Balance Assessment
- **Gold per player**: 4000 (2 × 2000 base) + contested access → adequate for early game
- **Wood availability**: 4–20 trees per grove × 300 each = 1200–6000 per grove
  - 4 groves total → 4800–24k wood (overkill, but respects player scatter)
- **Density**: No gridlock, resources clustered but not overlapping
- **Fairness**: Symmetric placement (reflection across map center)

---

## 5. Navigation Integrity

### River Blocking
**Mechanism**: `src/world/Terrain.ts:354–360` sets `riverMask[idx] = 1` for all vertices in river
- **NavMesh integration**: recast-navigation reads terrain mesh + carved geometry
  - If vertex Y is lowered (river carving), recast treats as obstacle
  - Walkable slope check (NAV_MESH_CONFIG.walkableSlopeAngle = 45°) blocks steep banks
  - **Result**: Rivers ARE blocked in NavMesh ✓

### Bridge Passthrough
**Problem**: Bridges DO NOT SET walkable geometry
- Bridge is a 3D visual GLB model (Terrain.ts:844)
- Bridge does NOT add walkable vertices to NavMesh
- **Units cannot pathfind across bridges** (even though visual shows them)

**Root**: NavMesh built ONCE at init (Game.ts:268), before dynamic bridge data
- `NavMeshManager.init()` called with `terrainMesh` only
- Bridge GLB not added to NavMesh build
- No `addObstacle()` or `addWalkableArea()` for bridges post-init

### Fallback Pathfinding
If recast-navigation WASM fails (NavMeshManager.ts:116):
- `isFallback = true` → direct movement enabled
- `terrainRef.isRiver()` checked to block river crossing (line 124–125)
- **Fallback does NOT respect bridges** (no bridge awareness in fallback pathfinding)

### Result: **Nav Mesh Integrity = BROKEN**
- Rivers block (correct)
- Bridges do NOT provide passage (units cannot use them)
- Fallback mode ignores bridges entirely

---

## 6. Potential Related Bugs

### Bug #1: Unreachable Resources
If tree grove spawns on island (archipelago), but no bridge connects to it:
- Units cannot harvest (island is carving-blocked in river)
- No indication to player why resource is inaccessible
- **Impact**: Campaign/skirmish deadlock if TC surrounded

### Bug #2: Bridge Visual ≠ Playable
Bridge renders at (x, z) but units path around it (fallback) or through walls (recast):
- Player places unit, expects it to use bridge, it doesn't
- Confusion about "does this bridge work?"
- **Impact**: Core RTS mechanic broken

### Bug #3: Random Bridges (Original Issue)
If `mapTemplate` param is randomized or UI allows invalid selection:
- Bridge spawns with no corresponding river
- No error message
- Floating bridge or bridge over grass
- **Likely cause of reported "random bridges"**

### Bug #4: No Validation of Template Consistency
`generateMap()` doesn't check if bridges align with rivers:
```typescript
// MISSING:
for (const bridge of bridges) {
  assert(findNearestRiver(bridge, rivers) !== null, 
    `Bridge at (${bridge.x}, ${bridge.z}) has no river`);
}
```

---

## 7. Specific File:Line References

| Issue | File | Line(s) | Problem |
|-------|------|---------|---------|
| **Bridge render (no validation)** | Terrain.ts | 838 | Loop places all bridges, no river check |
| **River carving (correct)** | Terrain.ts | 676–747 | Properly excludes bridge areas |
| **Bridge visual placement** | Terrain.ts | 844–845 | Positions bridge at (x,z) unconditionally |
| **River detection exists** | Terrain.ts | 354–360 | `isRiver()` works, but not called for bridges |
| **Resource nudging (good)** | MapGenerator.ts | 1789–1838 | `nudgeFromRiver()` correctly avoids rivers |
| **Validation missing** | MapGenerator.ts | 2015–2059 | `generateClassicFeatures()` no bridge↔river check |
| **NavMesh init** | Game.ts | 268 | Built without bridge walkability |
| **NavMesh build** | NavMeshManager.ts | 139–172 | Recast takes terrain only, no bridges |
| **Bridge type definition** | types/index.ts | 886–896 | BridgeSpawn has no river reference |
| **Template selection** | Game.ts | 224 | Accepts template but no validation |

---

## 8. Summary & Recommendations

### Status: **Partially Broken**
- ✓ Rivers render and block correctly
- ✓ Resources avoid rivers
- ✗ Bridges render without validation to rivers
- ✗ Bridges not walkable in NavMesh
- ✗ No template consistency checks

### Critical Fixes (Priority Order)
1. **Add bridge validation** before Terrain.ts:838 
   - Check each bridge is within 2–4 units of river path
   - Log/skip invalid bridges
   
2. **Add bridges to NavMesh**
   - Rebuild NavMesh after bridge placement, OR
   - Pre-compute walkable zones under each bridge during terrain rebuild
   
3. **Template validation**
   - Assert bridges.length > 0 iff rivers.length > 0
   - Warn if rivers exist but no bridges cross them
   
4. **Fallback pathfinding**
   - Add bridge-aware collision in fallback mode
   - Check if unit position is under bridge (allow passage)

### Investigation Steps
1. Check Game.ts to see how `mapTemplate` is set (hardcoded vs. user-selected)
2. Test if selecting non-'classic' templates causes "random bridge" reports
3. Verify if bridges are actually unreachable in gameplay (unit can't walk on them)

---

**Audit completed**: v0.37.2, root cause identified as **missing bridge→river validation + NavMesh walkability gap**.
