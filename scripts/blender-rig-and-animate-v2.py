"""
Blender script v2: Improved rigging + animation for Meshy GLB models.
Fixes: asymmetric weights, tighter falloff, better bone placement, smoother animations.

Usage: blender --background --python blender-rig-and-animate-v2.py -- <input.glb> <output.glb>
"""
import bpy
import sys
import math
from mathutils import Vector

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------
argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
if len(args) < 2:
    print("Usage: blender --background --python blender-rig-and-animate-v2.py -- <input.glb> <output.glb>")
    sys.exit(1)

input_glb = args[0]
output_glb = args[1]

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_glb)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break

if not mesh_obj:
    print("ERROR: No mesh found")
    sys.exit(1)

# Get mesh bounds
min_co = Vector((float('inf'),) * 3)
max_co = Vector((float('-inf'),) * 3)
for v in mesh_obj.data.vertices:
    wv = mesh_obj.matrix_world @ v.co
    min_co.x = min(min_co.x, wv.x)
    min_co.y = min(min_co.y, wv.y)
    min_co.z = min(min_co.z, wv.z)
    max_co.x = max(max_co.x, wv.x)
    max_co.y = max(max_co.y, wv.y)
    max_co.z = max(max_co.z, wv.z)

dims = max_co - min_co
cx = (min_co.x + max_co.x) / 2
cy = (min_co.y + max_co.y) / 2
bottom = min_co.z
H = dims.z  # total height
W = dims.x  # total width

print(f"Mesh: {mesh_obj.name}, {len(mesh_obj.data.vertices)} verts, H={H:.3f}, W={W:.3f}")

# ---------------------------------------------------------------------------
# Analyze mesh to find actual limb centers (vertex clustering)
# ---------------------------------------------------------------------------
# Split vertices into height zones to better estimate body proportions
zones = {'feet': [], 'legs': [], 'hips': [], 'torso': [], 'shoulders': [], 'head': []}
for v in mesh_obj.data.vertices:
    wv = mesh_obj.matrix_world @ v.co
    rel_h = (wv.z - bottom) / H  # 0=feet, 1=top of head
    if rel_h < 0.08:
        zones['feet'].append(wv)
    elif rel_h < 0.45:
        zones['legs'].append(wv)
    elif rel_h < 0.52:
        zones['hips'].append(wv)
    elif rel_h < 0.72:
        zones['torso'].append(wv)
    elif rel_h < 0.85:
        zones['shoulders'].append(wv)
    else:
        zones['head'].append(wv)

def zone_center_x(zone_verts, side='left'):
    """Get average X of vertices on one side."""
    if not zone_verts:
        return cx
    if side == 'left':
        filtered = [v for v in zone_verts if v.x > cx]
    elif side == 'right':
        filtered = [v for v in zone_verts if v.x < cx]
    else:
        filtered = zone_verts
    if not filtered:
        return cx
    return sum(v.x for v in filtered) / len(filtered)

def zone_width(zone_verts):
    """Get X spread of vertices."""
    if len(zone_verts) < 2:
        return W * 0.3
    xs = [v.x for v in zone_verts]
    return max(xs) - min(xs)

# Measure actual body widths
shoulder_w = zone_width(zones['shoulders']) if zones['shoulders'] else W * 0.8
hip_w = zone_width(zones['hips']) if zones['hips'] else W * 0.4
leg_w = zone_width(zones['legs']) if zones['legs'] else W * 0.35

print(f"Body proportions: shoulder_w={shoulder_w:.3f}, hip_w={hip_w:.3f}, leg_w={leg_w:.3f}")

# ---------------------------------------------------------------------------
# Create Armature with improved bone positioning
# ---------------------------------------------------------------------------
# Key positions (Z = height from bottom)
hip_z = bottom + H * 0.47
spine_z = bottom + H * 0.55
chest_z = bottom + H * 0.68
neck_z = bottom + H * 0.82
head_z = bottom + H * 0.88
head_top_z = bottom + H * 0.98

# Limb offsets based on actual mesh measurements
shoulder_off = shoulder_w * 0.40  # slightly inward from edge
hip_off = hip_w * 0.35

# Arm lengths proportional to height
upper_arm_len = H * 0.17
lower_arm_len = H * 0.15
hand_len = H * 0.05

# Leg positions
knee_z = bottom + H * 0.25
ankle_z = bottom + H * 0.06

bpy.ops.object.armature_add(enter_editmode=True, location=(cx, cy, 0))
armature_obj = bpy.context.active_object
armature_obj.name = "Armature"
arm = armature_obj.data
arm.name = "Armature"

bpy.ops.armature.select_all(action='SELECT')
bpy.ops.armature.delete()

def add_bone(name, head, tail, parent_name=None):
    bone = arm.edit_bones.new(name)
    bone.head = Vector(head)
    bone.tail = Vector(tail)
    if parent_name and parent_name in arm.edit_bones:
        bone.parent = arm.edit_bones[parent_name]
        bone.use_connect = (bone.head - bone.parent.tail).length < 0.02
    return bone

# --- Spine chain ---
add_bone("Hips",  (cx, cy, hip_z),   (cx, cy, spine_z))
add_bone("Spine", (cx, cy, spine_z),  (cx, cy, chest_z), "Hips")
add_bone("Chest", (cx, cy, chest_z),  (cx, cy, neck_z),  "Spine")
add_bone("Neck",  (cx, cy, neck_z),   (cx, cy, head_z),  "Chest")
add_bone("Head",  (cx, cy, head_z),   (cx, cy, head_top_z), "Neck")

# --- Left arm (positive X) ---
shoulder_x_l = cx + shoulder_off
add_bone("UpperArm.L",
    (shoulder_x_l, cy, chest_z + H * 0.02),
    (shoulder_x_l + upper_arm_len * 0.85, cy, chest_z - upper_arm_len * 0.35),
    "Chest")
elbow_l = arm.edit_bones["UpperArm.L"].tail.copy()
add_bone("LowerArm.L",
    elbow_l,
    (elbow_l.x + lower_arm_len * 0.7, cy, elbow_l.z - lower_arm_len * 0.5),
    "UpperArm.L")
wrist_l = arm.edit_bones["LowerArm.L"].tail.copy()
add_bone("Hand.L",
    wrist_l,
    (wrist_l.x + hand_len, cy, wrist_l.z - hand_len * 0.3),
    "LowerArm.L")

# --- Right arm (negative X) — mirror of left ---
shoulder_x_r = cx - shoulder_off
add_bone("UpperArm.R",
    (shoulder_x_r, cy, chest_z + H * 0.02),
    (shoulder_x_r - upper_arm_len * 0.85, cy, chest_z - upper_arm_len * 0.35),
    "Chest")
elbow_r = arm.edit_bones["UpperArm.R"].tail.copy()
add_bone("LowerArm.R",
    elbow_r,
    (elbow_r.x - lower_arm_len * 0.7, cy, elbow_r.z - lower_arm_len * 0.5),
    "UpperArm.R")
wrist_r = arm.edit_bones["LowerArm.R"].tail.copy()
add_bone("Hand.R",
    wrist_r,
    (wrist_r.x - hand_len, cy, wrist_r.z - hand_len * 0.3),
    "LowerArm.R")

# --- Left leg ---
add_bone("UpperLeg.L", (cx + hip_off, cy, hip_z),     (cx + hip_off, cy, knee_z), "Hips")
add_bone("LowerLeg.L", (cx + hip_off, cy, knee_z),    (cx + hip_off, cy, ankle_z), "UpperLeg.L")
add_bone("Foot.L",     (cx + hip_off, cy, ankle_z),   (cx + hip_off, cy + W * 0.12, bottom), "LowerLeg.L")

# --- Right leg (mirror) ---
add_bone("UpperLeg.R", (cx - hip_off, cy, hip_z),     (cx - hip_off, cy, knee_z), "Hips")
add_bone("LowerLeg.R", (cx - hip_off, cy, knee_z),    (cx - hip_off, cy, ankle_z), "UpperLeg.R")
add_bone("Foot.R",     (cx - hip_off, cy, ankle_z),   (cx - hip_off, cy + W * 0.12, bottom), "LowerLeg.R")

bpy.ops.object.mode_set(mode='OBJECT')
print(f"Armature: {len(arm.bones)} bones")

# ---------------------------------------------------------------------------
# Distance-based weight painting (improved: tighter falloff, better symmetry)
# ---------------------------------------------------------------------------
mesh_obj.parent = armature_obj
mesh_obj.parent_type = 'ARMATURE'

mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
mod.object = armature_obj

for bone in armature_obj.data.bones:
    if bone.name not in mesh_obj.vertex_groups:
        mesh_obj.vertex_groups.new(name=bone.name)

# Collect bone segments
bone_segments = {}
for bone in armature_obj.data.bones:
    head_world = armature_obj.matrix_world @ bone.head_local
    tail_world = armature_obj.matrix_world @ bone.tail_local
    bone_segments[bone.name] = (head_world, tail_world)

def point_to_segment_dist(p, a, b):
    ab = b - a
    ap = p - a
    t = max(0, min(1, ap.dot(ab) / max(ab.dot(ab), 1e-8)))
    closest = a + ab * t
    return (p - closest).length

# Per-bone falloff radius: tighter for extremities, wider for torso
BONE_RADIUS = {
    'Hips': H * 0.18,
    'Spine': H * 0.18,
    'Chest': H * 0.16,
    'Neck': H * 0.10,
    'Head': H * 0.12,
    'UpperArm.L': H * 0.12, 'UpperArm.R': H * 0.12,
    'LowerArm.L': H * 0.10, 'LowerArm.R': H * 0.10,
    'Hand.L': H * 0.08, 'Hand.R': H * 0.08,
    'UpperLeg.L': H * 0.14, 'UpperLeg.R': H * 0.14,
    'LowerLeg.L': H * 0.10, 'LowerLeg.R': H * 0.10,
    'Foot.L': H * 0.10, 'Foot.R': H * 0.10,
}

SMOOTH_POWER = 2.5  # Sharper falloff than v1

verts_weighted = 0
for v in mesh_obj.data.vertices:
    world_co = mesh_obj.matrix_world @ v.co

    bone_weights = {}
    for bone_name, (head, tail) in bone_segments.items():
        radius = BONE_RADIUS.get(bone_name, H * 0.15)
        dist = point_to_segment_dist(world_co, head, tail)
        if dist < radius:
            w = max(0, 1.0 - (dist / radius)) ** SMOOTH_POWER
            bone_weights[bone_name] = w

    # Fallback: always assign to nearest bone
    if not bone_weights:
        min_dist = float('inf')
        nearest = None
        for bone_name, (head, tail) in bone_segments.items():
            dist = point_to_segment_dist(world_co, head, tail)
            if dist < min_dist:
                min_dist = dist
                nearest = bone_name
        if nearest:
            bone_weights[nearest] = 1.0

    # Normalize and assign
    total = sum(bone_weights.values())
    if total > 0:
        for bone_name, w in bone_weights.items():
            nw = w / total
            if nw > 0.005:
                mesh_obj.vertex_groups[bone_name].add([v.index], nw, 'REPLACE')
        verts_weighted += 1

print(f"Weighted: {verts_weighted}/{len(mesh_obj.data.vertices)} vertices")

# Print per-bone stats
for vg in mesh_obj.vertex_groups:
    count = sum(1 for v in mesh_obj.data.vertices
                for g in v.groups if g.group == vg.index and g.weight > 0.01)
    print(f"  {vg.name}: {count} verts")

# ---------------------------------------------------------------------------
# Animation helpers
# ---------------------------------------------------------------------------
def rad(d):
    return math.radians(d)

def create_action(name):
    action = bpy.data.actions.new(name=name)
    armature_obj.animation_data_create()
    armature_obj.animation_data.action = action
    return action

def kf(bone_name, frame, loc=None, rot=None):
    """Set keyframe on pose bone. rot = (x,y,z) in degrees."""
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')
    bone = armature_obj.pose.bones.get(bone_name)
    if not bone:
        bpy.ops.object.mode_set(mode='OBJECT')
        return
    bone.rotation_mode = 'XYZ'
    if loc is not None:
        bone.location = loc
        bone.keyframe_insert(data_path="location", frame=frame)
    if rot is not None:
        bone.rotation_euler = (rad(rot[0]), rad(rot[1]), rad(rot[2]))
        bone.keyframe_insert(data_path="rotation_euler", frame=frame)
    bpy.ops.object.mode_set(mode='OBJECT')

def reset_pose():
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')
    for b in armature_obj.pose.bones:
        b.location = (0, 0, 0)
        b.rotation_mode = 'XYZ'
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)
    bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------------------
# IDLE — 48 frames, looping, subtle breathing + weight shift
# ---------------------------------------------------------------------------
print("Anim: Idle")
create_action("Idle")
reset_pose()

for f in [1, 48]:  # start+end identical for loop
    kf("Hips",  f, loc=(0,0,0), rot=(0,0,0))
    kf("Spine", f, rot=(0,0,0))
    kf("Chest", f, rot=(0,0,0))
    kf("Head",  f, rot=(0,0,0))
    kf("UpperArm.L", f, rot=(0,0,0))
    kf("UpperArm.R", f, rot=(0,0,0))
    kf("UpperLeg.L", f, rot=(0,0,0))
    kf("UpperLeg.R", f, rot=(0,0,0))

# Breathe in + slight weight shift (frame 24)
kf("Hips",  24, loc=(0,0,0.008), rot=(-1, 0, 1.5))
kf("Spine", 24, rot=(-2, 0, -1))
kf("Chest", 24, rot=(-3, 0, 0))
kf("Head",  24, rot=(-1.5, 2, 0))
kf("UpperArm.L", 24, rot=(2, 0, -3))
kf("UpperArm.R", 24, rot=(2, 0, 3))
kf("UpperLeg.L", 24, rot=(0, 0, 0))
kf("UpperLeg.R", 24, rot=(0, 0, 0))

# ---------------------------------------------------------------------------
# WALK — 32 frames, looping, more exaggerated
# ---------------------------------------------------------------------------
print("Anim: Walk")
create_action("Walk")
reset_pose()

L = 30   # leg swing angle
A = 25   # arm swing
K = 40   # knee bend on back leg
lean = 8

# Frame 1: L foot contact
kf("Hips", 1, loc=(0,0,-0.015), rot=(lean, 0, -3))
kf("Spine", 1, rot=(0, 0, 3))
kf("Chest", 1, rot=(-2, 0, 2))
kf("UpperLeg.L",  1, rot=(-L, 0, 0))
kf("LowerLeg.L",  1, rot=(15, 0, 0))
kf("Foot.L",      1, rot=(5, 0, 0))
kf("UpperLeg.R",  1, rot=(L, 0, 0))
kf("LowerLeg.R",  1, rot=(-K, 0, 0))
kf("Foot.R",      1, rot=(-10, 0, 0))
kf("UpperArm.L",  1, rot=(A, 0, 0))
kf("LowerArm.L",  1, rot=(-15, 0, 0))
kf("UpperArm.R",  1, rot=(-A, 0, 0))
kf("LowerArm.R",  1, rot=(-25, 0, 0))

# Frame 8: passing (L leg lifts)
kf("Hips", 8, loc=(0,0,0.015), rot=(lean, 0, 0))
kf("Spine", 8, rot=(0, 0, 0))
kf("Chest", 8, rot=(-2, 0, 0))
kf("UpperLeg.L",  8, rot=(5, 0, 0))
kf("LowerLeg.L",  8, rot=(-30, 0, 0))
kf("Foot.L",      8, rot=(-15, 0, 0))
kf("UpperLeg.R",  8, rot=(-5, 0, 0))
kf("LowerLeg.R",  8, rot=(-5, 0, 0))
kf("Foot.R",      8, rot=(0, 0, 0))
kf("UpperArm.L",  8, rot=(0, 0, 0))
kf("LowerArm.L",  8, rot=(-5, 0, 0))
kf("UpperArm.R",  8, rot=(0, 0, 0))
kf("LowerArm.R",  8, rot=(-5, 0, 0))

# Frame 16: R foot contact (mirror of 1)
kf("Hips", 16, loc=(0,0,-0.015), rot=(lean, 0, 3))
kf("Spine", 16, rot=(0, 0, -3))
kf("Chest", 16, rot=(-2, 0, -2))
kf("UpperLeg.L",  16, rot=(L, 0, 0))
kf("LowerLeg.L",  16, rot=(-K, 0, 0))
kf("Foot.L",      16, rot=(-10, 0, 0))
kf("UpperLeg.R",  16, rot=(-L, 0, 0))
kf("LowerLeg.R",  16, rot=(15, 0, 0))
kf("Foot.R",      16, rot=(5, 0, 0))
kf("UpperArm.L",  16, rot=(-A, 0, 0))
kf("LowerArm.L",  16, rot=(-25, 0, 0))
kf("UpperArm.R",  16, rot=(A, 0, 0))
kf("LowerArm.R",  16, rot=(-15, 0, 0))

# Frame 24: passing (R leg lifts)
kf("Hips", 24, loc=(0,0,0.015), rot=(lean, 0, 0))
kf("Spine", 24, rot=(0, 0, 0))
kf("Chest", 24, rot=(-2, 0, 0))
kf("UpperLeg.L",  24, rot=(-5, 0, 0))
kf("LowerLeg.L",  24, rot=(-5, 0, 0))
kf("Foot.L",      24, rot=(0, 0, 0))
kf("UpperLeg.R",  24, rot=(5, 0, 0))
kf("LowerLeg.R",  24, rot=(-30, 0, 0))
kf("Foot.R",      24, rot=(-15, 0, 0))
kf("UpperArm.L",  24, rot=(0, 0, 0))
kf("LowerArm.L",  24, rot=(-5, 0, 0))
kf("UpperArm.R",  24, rot=(0, 0, 0))
kf("LowerArm.R",  24, rot=(-5, 0, 0))

# Frame 32: loop = frame 1
kf("Hips", 32, loc=(0,0,-0.015), rot=(lean, 0, -3))
kf("Spine", 32, rot=(0, 0, 3))
kf("Chest", 32, rot=(-2, 0, 2))
kf("UpperLeg.L",  32, rot=(-L, 0, 0))
kf("LowerLeg.L",  32, rot=(15, 0, 0))
kf("Foot.L",      32, rot=(5, 0, 0))
kf("UpperLeg.R",  32, rot=(L, 0, 0))
kf("LowerLeg.R",  32, rot=(-K, 0, 0))
kf("Foot.R",      32, rot=(-10, 0, 0))
kf("UpperArm.L",  32, rot=(A, 0, 0))
kf("LowerArm.L",  32, rot=(-15, 0, 0))
kf("UpperArm.R",  32, rot=(-A, 0, 0))
kf("LowerArm.R",  32, rot=(-25, 0, 0))

# ---------------------------------------------------------------------------
# ATTACK MELEE — 24 frames, one-shot, powerful overhead swing
# ---------------------------------------------------------------------------
print("Anim: Attack")
create_action("Attack")
reset_pose()

# Frame 1: ready stance, weight back
kf("Hips", 1, rot=(0, 0, 0))
kf("Chest", 1, rot=(0, 0, 0))
kf("UpperArm.R", 1, rot=(0, 0, 0))
kf("LowerArm.R", 1, rot=(0, 0, 0))
kf("UpperArm.L", 1, rot=(0, 0, 0))
kf("UpperLeg.L", 1, rot=(0, 0, 0))
kf("UpperLeg.R", 1, rot=(0, 0, 0))

# Frame 4: anticipation — crouch + pull arm back
kf("Hips", 4, loc=(0, 0, -0.03), rot=(5, -8, 0))
kf("Chest", 4, rot=(10, -15, 0))
kf("UpperArm.R", 4, rot=(-110, -20, 0))
kf("LowerArm.R", 4, rot=(-80, 0, 0))
kf("UpperArm.L", 4, rot=(-15, 10, -20))
kf("UpperLeg.L", 4, rot=(-10, 0, 0))
kf("UpperLeg.R", 4, rot=(-5, 0, 0))

# Frame 8: STRIKE! — explosive forward
kf("Hips", 8, loc=(0, -0.02, 0.02), rot=(-12, 12, 0))
kf("Chest", 8, rot=(-30, 20, 0))
kf("UpperArm.R", 8, rot=(60, 10, 0))
kf("LowerArm.R", 8, rot=(-10, 0, 0))
kf("UpperArm.L", 8, rot=(15, 0, -15))
kf("UpperLeg.L", 8, rot=(-15, 0, 0))
kf("UpperLeg.R", 8, rot=(10, 0, 0))

# Frame 12: follow-through
kf("Hips", 12, loc=(0, -0.01, 0.01), rot=(-8, 8, 0))
kf("Chest", 12, rot=(-15, 12, 0))
kf("UpperArm.R", 12, rot=(40, 5, 0))
kf("LowerArm.R", 12, rot=(-5, 0, 0))
kf("UpperArm.L", 12, rot=(10, 0, -10))
kf("UpperLeg.L", 12, rot=(-8, 0, 0))
kf("UpperLeg.R", 12, rot=(5, 0, 0))

# Frame 24: return to rest
kf("Hips", 24, loc=(0,0,0), rot=(0, 0, 0))
kf("Chest", 24, rot=(0, 0, 0))
kf("UpperArm.R", 24, rot=(0, 0, 0))
kf("LowerArm.R", 24, rot=(0, 0, 0))
kf("UpperArm.L", 24, rot=(0, 0, 0))
kf("UpperLeg.L", 24, rot=(0, 0, 0))
kf("UpperLeg.R", 24, rot=(0, 0, 0))

# ---------------------------------------------------------------------------
# DEATH — 36 frames, one-shot, dramatic collapse
# ---------------------------------------------------------------------------
print("Anim: Death")
create_action("Death")
reset_pose()

# Frame 1: standing
kf("Hips", 1, loc=(0,0,0), rot=(0,0,0))
kf("Spine", 1, rot=(0,0,0))
kf("Chest", 1, rot=(0,0,0))
kf("Head",  1, rot=(0,0,0))
kf("UpperArm.L", 1, rot=(0,0,0))
kf("UpperArm.R", 1, rot=(0,0,0))
kf("UpperLeg.L", 1, rot=(0,0,0))
kf("UpperLeg.R", 1, rot=(0,0,0))
kf("LowerLeg.L", 1, rot=(0,0,0))
kf("LowerLeg.R", 1, rot=(0,0,0))

# Frame 5: hit impact — jolt back
kf("Hips", 5, loc=(0, 0.03, -0.02), rot=(12, 0, 5))
kf("Spine", 5, rot=(8, 0, 3))
kf("Chest", 5, rot=(15, 0, 0))
kf("Head",  5, rot=(20, -10, 5))
kf("UpperArm.L", 5, rot=(-25, 0, -25))
kf("UpperArm.R", 5, rot=(-20, 0, 30))

# Frame 12: stagger, knees buckling
kf("Hips", 12, loc=(0, 0.06, -0.15), rot=(25, 5, 8))
kf("Spine", 12, rot=(15, -5, 5))
kf("Chest", 12, rot=(20, 0, -3))
kf("Head",  12, rot=(25, -15, 8))
kf("UpperArm.L", 12, rot=(-45, 15, -35))
kf("UpperArm.R", 12, rot=(-35, -10, 40))
kf("UpperLeg.L", 12, rot=(-25, 0, -5))
kf("LowerLeg.L", 12, rot=(-45, 0, 0))
kf("UpperLeg.R", 12, rot=(-15, 0, 5))
kf("LowerLeg.R", 12, rot=(-35, 0, 0))

# Frame 22: falling backward
kf("Hips", 22, loc=(0, 0.15, -0.5), rot=(70, 0, 8))
kf("Spine", 22, rot=(12, -3, 3))
kf("Chest", 22, rot=(8, 0, 0))
kf("Head",  22, rot=(-15, -15, 5))
kf("UpperArm.L", 22, rot=(-65, 25, -45))
kf("UpperArm.R", 22, rot=(-55, -20, 50))
kf("UpperLeg.L", 22, rot=(-15, 0, -10))
kf("LowerLeg.L", 22, rot=(-25, 0, 0))
kf("UpperLeg.R", 22, rot=(0, 0, 8))
kf("LowerLeg.R", 22, rot=(-15, 0, 0))

# Frame 30: landed on ground
kf("Hips", 30, loc=(0, 0.2, -0.65), rot=(85, 0, 5))
kf("Spine", 30, rot=(10, -3, 3))
kf("Chest", 30, rot=(5, 0, 0))
kf("Head",  30, rot=(-20, -12, 3))
kf("UpperArm.L", 30, rot=(-70, 30, -50))
kf("UpperArm.R", 30, rot=(-60, -25, 55))
kf("UpperLeg.L", 30, rot=(-10, 0, -12))
kf("LowerLeg.L", 30, rot=(-15, 0, 0))
kf("UpperLeg.R", 30, rot=(5, 0, 10))
kf("LowerLeg.R", 30, rot=(-10, 0, 0))

# Frame 36: settled (hold)
kf("Hips", 36, loc=(0, 0.2, -0.65), rot=(85, 0, 5))
kf("Spine", 36, rot=(10, -3, 3))
kf("Chest", 36, rot=(5, 0, 0))
kf("Head",  36, rot=(-20, -12, 3))
kf("UpperArm.L", 36, rot=(-70, 30, -50))
kf("UpperArm.R", 36, rot=(-60, -25, 55))
kf("UpperLeg.L", 36, rot=(-10, 0, -12))
kf("LowerLeg.L", 36, rot=(-15, 0, 0))
kf("UpperLeg.R", 36, rot=(5, 0, 10))
kf("LowerLeg.R", 36, rot=(-10, 0, 0))

# ---------------------------------------------------------------------------
# Smooth interpolation (Blender 5.1 Baklava API)
# ---------------------------------------------------------------------------
for action in bpy.data.actions:
    try:
        for layer in action.layers:
            for strip in layer.strips:
                for channelbag in strip.channelbags:
                    for fcurve in channelbag.fcurves:
                        for kfp in fcurve.keyframe_points:
                            kfp.interpolation = 'BEZIER'
                            kfp.handle_left_type = 'AUTO_CLAMPED'
                            kfp.handle_right_type = 'AUTO_CLAMPED'
    except (AttributeError, TypeError):
        pass

print(f"Animations: {[a.name for a in bpy.data.actions]}")

# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='SELECT')

armature_obj.animation_data_create()
for i, action in enumerate(bpy.data.actions):
    track = armature_obj.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, int(action.frame_range[0]), action)
    strip.name = action.name

armature_obj.animation_data.action = None

try:
    bpy.ops.export_scene.gltf(
        filepath=output_glb,
        export_format='GLB',
        export_animations=True,
        export_skins=True,
        export_normals=True,
        export_materials='EXPORT',
        export_extras=True,
        export_nla_strips=True,
        export_animation_mode='NLA_TRACKS',
    )
except TypeError:
    bpy.ops.export_scene.gltf(
        filepath=output_glb,
        export_format='GLB',
        export_animations=True,
        export_skins=True,
        export_normals=True,
    )

import os
print(f"\nExported: {output_glb} ({os.path.getsize(output_glb) / 1024:.1f} KB)")
print("DONE!")
