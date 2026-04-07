# Animation Pipeline — Reign of Brabant

Version: 1.0.0
Last updated: 2026-04-07

---

## Overview

The animation pipeline converts static Meshy v6 GLB models into fully rigged and animated units playable in the Three.js RTS renderer. It uses Blender 5.1 CLI in headless mode with Python scripts that:

1. Create a 17-bone humanoid armature
2. Apply distance-based weight painting with head zone lock and rigid weapon pass
3. Generate animation clips as NLA tracks
4. Export as GLB with embedded skeletal animations

All animations are designed for **RTS zoom level visibility**: exaggerated motion, wide arcs, and clear silhouette changes over subtle detail.

---

## Bone Convention (17 bones)

```
             Head
              |
             Neck
              |
            Chest ---- UpperArm.L --- LowerArm.L --- Hand.L
              |     \-- UpperArm.R --- LowerArm.R --- Hand.R
            Spine
              |
             Hips
           /      \
    UpperLeg.L   UpperLeg.R
        |             |
    LowerLeg.L   LowerLeg.R
        |             |
      Foot.L       Foot.R
```

Bone positions are calculated relative to mesh bounding box:
- Hips: 45% height
- Spine: 55% height
- Chest: 70% height
- Neck: 82% height
- Head: 90-100% height
- Shoulders: 35% of width from center
- Hips: 18% of width from center

---

## Animation Sets per Unit Category

### 1. Melee Infantry (Worker, Infantry)

| Clip Name | Frames | Type | FPS | Duration | Description |
|-----------|--------|------|-----|----------|-------------|
| **Idle** | 60 | Loop | 24 | 2.5s | Breathing: chest rises/falls, subtle arm/head sway |
| **Walk** | 40 | Loop | 24 | 1.67s | Alternating legs, arm swing, hip rotation, forward lean |
| **Attack** | 30 | One-shot | 24 | 1.25s | Wind-up right arm -> overhead swing -> follow-through -> recover |
| **Death** | 40 | One-shot | 24 | 1.67s | Hit stagger -> knees buckle -> collapse to ground (clamp) |

**Script**: `blender-rig-and-animate.py` (base rig script creates all four)

---

### 2. Ranged Units

| Clip Name | Frames | Type | FPS | Duration | Description |
|-----------|--------|------|-----|----------|-------------|
| **Idle** | 60 | Loop | 24 | 2.5s | Standard breathing idle |
| **Walk** | 40 | Loop | 24 | 1.67s | Standard walk cycle |
| **Attack** | 30 | One-shot | 24 | 1.25s | Standard melee fallback |
| **RangedAttack** | 28 | One-shot | 24 | 1.17s | Draw bow/raise arm -> full draw aim -> release snap -> follow-through -> recover |
| **Death** | 40 | One-shot | 24 | 1.67s | Standard death |

**Scripts**: `blender-rig-and-animate.py` + `blender-anim-ranged.py`

**Keyframe Detail — RangedAttack**:
- Frame 1: Ready stance, weapon low
- Frame 6: Right arm pulls back (UpperArm.R -60 X, -25 Y), chest rotates -25 Y
- Frame 10: Full draw (UpperArm.R -75 X, -35 Y), chest -30 Y. Peak anticipation.
- Frame 14: Release! Right arm snaps forward (+30 X), chest whips +20 Y, slight hip thrust
- Frame 20: Follow-through, weight shifts forward
- Frame 28: Recover to ready

---

### 3. Worker Units

| Clip Name | Frames | Type | FPS | Duration | Description |
|-----------|--------|------|-----|----------|-------------|
| **Idle** | 60 | Loop | 24 | 2.5s | Standard breathing idle |
| **Walk** | 40 | Loop | 24 | 1.67s | Standard walk cycle |
| **Attack** | 30 | One-shot | 24 | 1.25s | Standard melee (self-defense) |
| **Gather** | 36 | Loop | 24 | 1.5s | Overhead pickaxe swing: raise tool -> accelerate down -> impact -> recoil -> rise |
| **Build** | 36 | Loop | 24 | 1.5s | Forward-facing hammer strikes: smaller controlled swings |
| **Death** | 40 | One-shot | 24 | 1.67s | Standard death |

**Scripts**: `blender-rig-and-animate.py` + `blender-anim-worker-gather.py`

**Keyframe Detail — Gather**:
- Frame 1: Tool raised (UpperArm.R -120, UpperArm.L -100), body leaning back (+10 hips)
- Frame 8: Downswing, body leans forward aggressively
- Frame 14: IMPACT. Deep knee bend (-15 upper legs, -20 lower legs), chest -25 forward. Hips drop -0.08 Z.
- Frame 20: Recoil bounce, partial recovery
- Frame 28: Tool rising back to overhead
- Frame 36: Full raise (= frame 1, loops)

**Keyframe Detail — Build**:
- Frame 1: Forward lean, right arm at shoulder height with hammer
- Frame 10: Hammer raised higher
- Frame 18: Hammer strike downward, knees dip
- Frame 24: Recoil from strike
- Frame 36: Back to ready (= frame 1, loops)

---

### 4. Support / Healer Units

| Clip Name | Frames | Type | FPS | Duration | Description |
|-----------|--------|------|-----|----------|-------------|
| **Idle** | 60 | Loop | 24 | 2.5s | Standard breathing idle |
| **Walk** | 40 | Loop | 24 | 1.67s | Standard walk cycle |
| **Attack** | 30 | One-shot | 24 | 1.25s | Standard melee fallback |
| **Heal** | 40 | One-shot | 24 | 1.67s | Raise both arms -> channel energy (hold) -> sweep outward release -> neutral |
| **Death** | 40 | One-shot | 24 | 1.67s | Standard death |

**Scripts**: `blender-rig-and-animate.py` + `blender-anim-healer.py`

**Keyframe Detail — Heal**:
- Frame 1: Neutral stance
- Frame 8: Arms begin rising, head tilts up, spine extends
- Frame 14: Full channel. Both arms overhead (UpperArm.L/R -140), palms up, spine extended back.
- Frame 24: Sustained channel. Slight variation from frame 14 for subtle oscillation motion during hold.
- Frame 32: Release. Arms sweep outward (UpperArm.L/R with Z rotation -45/+45) then down.
- Frame 40: Return to neutral.

**Renderer integration**: The hold phase (frames 14-24, ~0.4s) is the window where particle/glow effects should be most visible in UnitRenderer.

---

### 5. Heavy / Cavalry Units

| Clip Name | Frames | Type | FPS | Duration | Description |
|-----------|--------|------|-----|----------|-------------|
| **Idle** | 60 | Loop | 24 | 2.5s | Standard breathing idle |
| **Walk** | 40 | Loop | 24 | 1.67s | Standard walk cycle |
| **Attack** | 30 | One-shot | 24 | 1.25s | Standard melee fallback |
| **HeavyAttack** | 36 | One-shot | 24 | 1.5s | Slow overhead swing: stance -> deliberate wind-up -> apex hold -> explosive strike -> aftershock -> slow recover |
| **Death** | 40 | One-shot | 24 | 1.67s | Standard death |

**Scripts**: `blender-rig-and-animate.py` + `blender-anim-heavy.py`

**Keyframe Detail — HeavyAttack**:
- Frame 1: Wide stance, weapon lowered right side
- Frame 10: SLOW wind-up. Both arms lift weapon overhead (UpperArm.R -130, UpperArm.L -110). Hips rotate back (-15 Y), lean back (+20 X). Weight shifts to back leg.
- Frame 16: Apex. Maximum height, brief hold. Peak anticipation (+22 hip X, -140 arm R).
- Frame 20: STRIKE. Explosive downswing. Full body commits forward (Hips -25 X, Chest -35 X). Deep knee bend (-25 upper legs, -30 lower legs). Arms slam down (UpperArm.R +60).
- Frame 26: Aftershock recoil.
- Frame 36: Slow recover to stance (heavy weapon = deliberate recovery).

**Design**: 50% slower than standard Attack. 120+ degree arm rotations for visibility. Deep knee bend sells weapon weight.

---

### 6. Siege Units

| Clip Name | Frames | Type | FPS | Duration | Description |
|-----------|--------|------|-----|----------|-------------|
| **SiegeIdle** | 48 | Loop | 24 | 2.0s | Crouched ready stance, weight shifting, scanning |
| **Walk** | 40 | Loop | 24 | 1.67s | Standard walk cycle |
| **Attack** | 30 | One-shot | 24 | 1.25s | Standard melee fallback |
| **SiegeAttack** | 40 | One-shot | 24 | 1.67s | Crouch -> load ammo -> aim -> FIRE -> recoil -> settle -> recover |
| **Death** | 40 | One-shot | 24 | 1.67s | Standard death |

**Scripts**: `blender-rig-and-animate.py` + `blender-anim-siege.py`

**Keyframe Detail — SiegeAttack**:
- Frame 1: Crouched ready. Hips lowered (-0.08 Z), knees bent (-20 upper, -25 lower legs). Hands on controls.
- Frame 8: Load. Lean far forward (-25 X hips, -25 chest). Arms reach down to load ammunition.
- Frame 16: Aim. Rise up, arms pull back on firing mechanism. Torso rotates (-10 Y).
- Frame 20: FIRE! Sharp forward thrust. Arms snap forward, hip drives (-15 X hips).
- Frame 26: Recoil. Body rocks backward (+15 hips X). Weapon kickback sells the force.
- Frame 34: Settling. Dampened oscillation.
- Frame 40: Recover to ready.

**SiegeIdle**: Crouched base pose with subtle weight shifting left (f12) -> center (f24) -> right (f36) -> loop.

---

### 7. Hero Units

| Clip Name | Frames | Type | FPS | Duration | Description |
|-----------|--------|------|-----|----------|-------------|
| **Idle** | 60 | Loop | 24 | 2.5s | Standard breathing idle |
| **Walk** | 40 | Loop | 24 | 1.67s | Standard walk cycle |
| **Attack** | 30 | One-shot | 24 | 1.25s | Standard melee attack |
| **HeavyAttack** | 36 | One-shot | 24 | 1.5s | Used for ability Q (power strike) |
| **Heal** | 40 | One-shot | 24 | 1.67s | Used for ability W (buff/heal) |
| **Death** | 40 | One-shot | 24 | 1.67s | Standard death |

**Scripts**: `blender-rig-and-animate.py` + `blender-anim-heavy.py` + `blender-anim-healer.py`

Heroes use existing animation clips mapped to ability slots. Future hero-specific abilities (Q/W/E) can be built as additional one-shot clips following the same pipeline.

---

## Batch Processing

### Single model
```bash
# Add ranged attack to already-rigged model
bash scripts/batch-animate.sh ranged assets/models/v03/brabanders/ranged.glb

# Full pipeline: static model -> rigged + animated
bash scripts/batch-animate.sh --rig-and-animate worker \
  assets/models/v02/brabanders/worker.glb \
  assets/models/v03/brabanders/worker.glb
```

### Per faction
```bash
# All ranged units for brabanders
bash scripts/batch-animate.sh ranged --faction brabanders

# ALL unit types for brabanders (auto-detects category)
bash scripts/batch-animate.sh --all --faction brabanders
```

### Full rebuild
```bash
for faction in brabanders randstad limburgers belgen; do
  bash scripts/batch-animate.sh --all --faction "$faction"
done
```

---

## UnitRenderer Integration Plan

### Current state

`aiStateToAnimName()` maps `UnitAIState` -> clip name:

```typescript
function aiStateToAnimName(state: number | undefined): string {
  switch (state) {
    case AnimUnitAIState.Moving:
    case AnimUnitAIState.MovingToResource:
    case AnimUnitAIState.Returning:
      return 'Walk';
    case AnimUnitAIState.Attacking:
      return 'Attack';
    case AnimUnitAIState.Dead:
      return 'Death';
    case AnimUnitAIState.Idle:
    case AnimUnitAIState.Gathering:
    default:
      return 'Idle';
  }
}
```

### Required changes

**Step 1: Extend `aiStateToAnimName` to be unit-type-aware**

The function needs a second parameter: the unit's `UnitTypeId` (and optionally the available clip names from the template).

```typescript
function aiStateToAnimName(
  state: number | undefined,
  unitTypeId: UnitTypeId,
  availableClips: Set<string>,
): string {
  switch (state) {
    case AnimUnitAIState.Moving:
    case AnimUnitAIState.MovingToResource:
    case AnimUnitAIState.Returning:
      return 'Walk';

    case AnimUnitAIState.Attacking:
      // Category-specific attack clips with fallback chain
      if (unitTypeId === UnitTypeId.Ranged && availableClips.has('RangedAttack'))
        return 'RangedAttack';
      if (unitTypeId === UnitTypeId.Heavy && availableClips.has('HeavyAttack'))
        return 'HeavyAttack';
      if (unitTypeId === UnitTypeId.Siege && availableClips.has('SiegeAttack'))
        return 'SiegeAttack';
      return 'Attack'; // Universal melee fallback

    case AnimUnitAIState.Gathering:
      if (availableClips.has('Gather')) return 'Gather';
      return 'Idle'; // Fallback if model lacks Gather clip

    // New states (requires UnitAIState enum extension):
    // case AnimUnitAIState.Building:
    //   if (availableClips.has('Build')) return 'Build';
    //   return 'Gather'; // Fallback
    //
    // case AnimUnitAIState.Healing:
    //   if (availableClips.has('Heal')) return 'Heal';
    //   return 'Idle';

    case AnimUnitAIState.Dead:
      return 'Death';

    case AnimUnitAIState.Idle:
    default:
      // Siege units have their own idle
      if (unitTypeId === UnitTypeId.Siege && availableClips.has('SiegeIdle'))
        return 'SiegeIdle';
      return 'Idle';
  }
}
```

**Step 2: Track available clips per template**

In `AnimatedTemplate`, add a clip name set:

```typescript
interface AnimatedTemplate {
  scene: THREE.Group;
  clips: THREE.AnimationClip[];
  clipNames: Set<string>;  // NEW: for quick lookup
}
```

Populate on load:
```typescript
this.animatedTemplates.set(cacheKey, {
  scene: root,
  clips: gltf.animations,
  clipNames: new Set(gltf.animations.map(c => c.name)),
});
```

**Step 3: Extend UnitAIState enum**

Add new states to `src/types/index.ts`:

```typescript
export enum UnitAIState {
  Idle = 0,
  Moving = 1,
  Attacking = 2,
  MovingToResource = 3,
  Gathering = 4,
  Returning = 5,
  Dead = 6,
  Stunned = 7,
  Reviving = 8,
  Building = 9,    // NEW: worker constructing a building
  Healing = 10,    // NEW: support unit healing
  Casting = 11,    // NEW: hero using ability
}
```

**Step 4: Pass unit type to animation selection**

In `updateAnimatedUnit`, pass the unit type:

```typescript
// AnimatedUnit needs to store its unitTypeId
interface AnimatedUnit {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentAnim: string;
  prevAnim: string;
  unitTypeId: UnitTypeId;        // NEW
  availableClips: Set<string>;   // NEW
}
```

**Step 5: Configure one-shot vs loop per clip name**

Currently hard-coded to check `Attack` and `Death`. Extend:

```typescript
const ONE_SHOT_CLIPS = new Set([
  'Attack', 'RangedAttack', 'HeavyAttack', 'SiegeAttack',
  'Death', 'Heal',
]);

for (const clip of template.clips) {
  const action = mixer.clipAction(clip);
  if (ONE_SHOT_CLIPS.has(clip.name)) {
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = clip.name === 'Death'; // Only Death clamps
  } else {
    action.setLoop(THREE.LoopRepeat, Infinity);
  }
  actions.set(clip.name, action);
}
```

**Step 6: Handle `finished` events for new one-shot clips**

Extend the mixer `finished` listener:

```typescript
mixer.addEventListener('finished', (e) => {
  const clipName = e.action?.getClip().name;
  if (!clipName) return;
  if (clipName === 'Death') return; // Stay clamped

  // All other one-shots return to Idle
  const unit = this.animatedUnits.get(eid);
  if (unit) {
    const idleClip = unit.availableClips.has('SiegeIdle') &&
                     unit.unitTypeId === UnitTypeId.Siege
      ? 'SiegeIdle' : 'Idle';
    this.crossfadeAnimation(unit, idleClip);
  }
});
```

---

## Performance Considerations

### AnimationMixer count

Each animated unit creates its own `THREE.AnimationMixer`. At RTS scale:

| Scenario | Units | Mixers | Impact |
|----------|-------|--------|--------|
| Early game | ~20 | 20 | Negligible |
| Mid game | ~80 | 80 | ~0.5ms/frame |
| Late game | ~200 | 200 | ~1.5ms/frame |
| Stress test | ~400 | 400 | ~3ms/frame (budget concern) |

**Mitigations**:
1. **LOD animation culling**: Skip `mixer.update()` for units outside camera frustum or far from camera. Save ~60% of mixer updates in typical gameplay.
2. **Shared mixer pooling**: Units of the same type playing the same animation at the same frame can share a single mixer update and copy bone matrices. Requires animation phase synchronization.
3. **Frame skip**: Update distant unit animations at half rate (every other frame). At RTS zoom, 12fps animation is indistinguishable from 24fps for background units.

### GLB file size impact

| Clips per model | Approximate GLB overhead |
|-----------------|--------------------------|
| 4 (base) | ~2-4 KB per clip |
| 6 (worker) | ~3-6 KB additional |
| 7 (hero) | ~4-7 KB additional |

Animation data is lightweight (only rotation/location keyframes on 17 bones). A model with 7 animation clips adds roughly 10-15 KB total to the GLB.

### Memory

Each `AnimatedUnit` clone (via `SkeletonUtils.clone`) duplicates:
- Skeleton (17 bones x 64 bytes = ~1 KB)
- Material clones (~0.5 KB per material)
- AnimationMixer + Actions (~2 KB)

Total per unit: ~4 KB. 200 units = ~800 KB. Well within budget.

---

## File Reference

| File | Purpose |
|------|---------|
| `scripts/blender-rig-and-animate.py` | Base rig: 17-bone armature + Idle/Walk/Attack/Death |
| `scripts/blender-anim-ranged.py` | Adds RangedAttack (draw -> release -> recover) |
| `scripts/blender-anim-worker-gather.py` | Adds Gather (pickaxe swing loop) + Build (hammer loop) |
| `scripts/blender-anim-healer.py` | Adds Heal (raise arms -> channel -> release) |
| `scripts/blender-anim-heavy.py` | Adds HeavyAttack (slow powerful overhead swing) |
| `scripts/blender-anim-siege.py` | Adds SiegeAttack (load -> aim -> fire -> recoil) + SiegeIdle |
| `scripts/batch-animate.sh` | Batch processing: per model, per faction, or full rebuild |
| `src/rendering/UnitRenderer.ts` | Three.js animation playback, crossfade, state mapping |
| `src/types/index.ts` | UnitAIState enum, UnitTypeId enum |

---

## Complete Animation Matrix

| Clip | Melee | Ranged | Worker | Healer | Heavy | Siege | Hero |
|------|:-----:|:------:|:------:|:------:|:-----:|:-----:|:----:|
| Idle | X | X | X | X | X | - | X |
| SiegeIdle | - | - | - | - | - | X | - |
| Walk | X | X | X | X | X | X | X |
| Attack | X | X | X | X | X | X | X |
| RangedAttack | - | X | - | - | - | - | - |
| HeavyAttack | - | - | - | - | X | - | X |
| SiegeAttack | - | - | - | - | - | X | - |
| Gather | - | - | X | - | - | - | - |
| Build | - | - | X | - | - | - | - |
| Heal | - | - | - | X | - | - | X |
| Death | X | X | X | X | X | X | X |
| **Total clips** | **4** | **5** | **6** | **5** | **5** | **5** | **6** |
