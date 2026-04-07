"""
Blender script: Rig a static Meshy GLB with a humanoid armature + create animations.
Outputs an animated GLB ready for Three.js.

Usage: blender --background --python blender-rig-and-animate.py -- <input.glb> <output.glb> [category]

Categories:
  infantry (default) — 4 animations: Idle, Walk, Attack, Death
  worker             — 6 animations: Idle, Walk, Attack, Death, Gather, Build
  ranged             — 5 animations: Idle, Walk, Attack, Death, RangedAttack
"""
import bpy
import sys
import math
from mathutils import Vector, Euler

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------
argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
if len(args) < 2:
    print("Usage: blender --background --python blender-rig-and-animate.py -- <input.glb> <output.glb> [category]")
    sys.exit(1)

input_glb = args[0]
output_glb = args[1]
unit_category = args[2] if len(args) > 2 else 'infantry'  # 'infantry', 'worker', or 'ranged'

print(f"Unit category: {unit_category}")

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_glb)

# Find the mesh object
mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break

if not mesh_obj:
    print("ERROR: No mesh found")
    sys.exit(1)

print(f"Found mesh: {mesh_obj.name}, {len(mesh_obj.data.vertices)} verts")

# Get mesh bounds for positioning bones
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
center_x = (min_co.x + max_co.x) / 2
center_y = (min_co.y + max_co.y) / 2
bottom_z = min_co.z
height = dims.z
width = dims.x

print(f"Bounds: {min_co} -> {max_co}, height={height:.3f}, width={width:.3f}")

# ---------------------------------------------------------------------------
# Create Humanoid Armature
# ---------------------------------------------------------------------------
# Bone positions relative to model (Blender Z-up)
# Model is centered at origin, bottom at min_co.z

hip_z = bottom_z + height * 0.45
spine_z = bottom_z + height * 0.55
chest_z = bottom_z + height * 0.70
neck_z = bottom_z + height * 0.82
head_z = bottom_z + height * 0.90
head_top_z = bottom_z + height * 1.0

shoulder_width = width * 0.35
hip_width = width * 0.18
elbow_drop = height * 0.12
hand_drop = height * 0.24

knee_z = bottom_z + height * 0.22
ankle_z = bottom_z + height * 0.05
toe_z = bottom_z

bpy.ops.object.armature_add(enter_editmode=True, location=(center_x, center_y, 0))
armature_obj = bpy.context.active_object
armature_obj.name = "Armature"
arm = armature_obj.data
arm.name = "Armature"

# Remove default bone
bpy.ops.armature.select_all(action='SELECT')
bpy.ops.armature.delete()

# Helper function
def add_bone(name, head, tail, parent_name=None, roll=0):
    bone = arm.edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    bone.roll = roll
    if parent_name and parent_name in arm.edit_bones:
        bone.parent = arm.edit_bones[parent_name]
        bone.use_connect = (bone.head - bone.parent.tail).length < 0.01
    return bone

# Spine chain
add_bone("Hips", (center_x, center_y, hip_z), (center_x, center_y, spine_z))
add_bone("Spine", (center_x, center_y, spine_z), (center_x, center_y, chest_z), "Hips")
add_bone("Chest", (center_x, center_y, chest_z), (center_x, center_y, neck_z), "Spine")
add_bone("Neck", (center_x, center_y, neck_z), (center_x, center_y, head_z), "Chest")
add_bone("Head", (center_x, center_y, head_z), (center_x, center_y, head_top_z), "Neck")

# Left arm
add_bone("UpperArm.L", (center_x + shoulder_width, center_y, chest_z),
         (center_x + shoulder_width + width * 0.2, center_y, chest_z - elbow_drop), "Chest")
add_bone("LowerArm.L", (center_x + shoulder_width + width * 0.2, center_y, chest_z - elbow_drop),
         (center_x + shoulder_width + width * 0.38, center_y, chest_z - hand_drop), "UpperArm.L")
add_bone("Hand.L", (center_x + shoulder_width + width * 0.38, center_y, chest_z - hand_drop),
         (center_x + shoulder_width + width * 0.45, center_y, chest_z - hand_drop - height * 0.04), "LowerArm.L")

# Right arm
add_bone("UpperArm.R", (center_x - shoulder_width, center_y, chest_z),
         (center_x - shoulder_width - width * 0.2, center_y, chest_z - elbow_drop), "Chest")
add_bone("LowerArm.R", (center_x - shoulder_width - width * 0.2, center_y, chest_z - elbow_drop),
         (center_x - shoulder_width - width * 0.38, center_y, chest_z - hand_drop), "UpperArm.R")
add_bone("Hand.R", (center_x - shoulder_width - width * 0.38, center_y, chest_z - hand_drop),
         (center_x - shoulder_width - width * 0.45, center_y, chest_z - hand_drop - height * 0.04), "LowerArm.R")

# Left leg
add_bone("UpperLeg.L", (center_x + hip_width, center_y, hip_z),
         (center_x + hip_width, center_y, knee_z), "Hips")
add_bone("LowerLeg.L", (center_x + hip_width, center_y, knee_z),
         (center_x + hip_width, center_y, ankle_z), "UpperLeg.L")
add_bone("Foot.L", (center_x + hip_width, center_y, ankle_z),
         (center_x + hip_width, center_y + width * 0.15, toe_z), "LowerLeg.L")

# Right leg
add_bone("UpperLeg.R", (center_x - hip_width, center_y, hip_z),
         (center_x - hip_width, center_y, knee_z), "Hips")
add_bone("LowerLeg.R", (center_x - hip_width, center_y, knee_z),
         (center_x - hip_width, center_y, ankle_z), "UpperLeg.R")
add_bone("Foot.R", (center_x - hip_width, center_y, ankle_z),
         (center_x - hip_width, center_y + width * 0.15, toe_z), "LowerLeg.R")

bpy.ops.object.mode_set(mode='OBJECT')

print(f"Armature created: {len(arm.bones)} bones")

# ---------------------------------------------------------------------------
# Parent mesh to armature + manual distance-based weight painting
# ---------------------------------------------------------------------------

# 1. Set parent without auto-weights (just parent)
mesh_obj.parent = armature_obj
mesh_obj.parent_type = 'ARMATURE'

# 2. Add Armature modifier
mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
mod.object = armature_obj

# 3. Create vertex groups for each bone
for bone in armature_obj.data.bones:
    if bone.name not in mesh_obj.vertex_groups:
        mesh_obj.vertex_groups.new(name=bone.name)

print(f"Vertex groups created: {len(mesh_obj.vertex_groups)}")

# 4. Manual distance-based weight assignment
# For each vertex, find which bone segment it's closest to and weight accordingly
import numpy as np
from mathutils import Vector

def point_to_segment_dist(p, a, b):
    """Distance from point p to line segment a-b."""
    ab = b - a
    ap = p - a
    t = max(0, min(1, ap.dot(ab) / max(ab.dot(ab), 1e-8)))
    closest = a + ab * t
    return (p - closest).length

# Collect bone segments in world space
bpy.context.view_layer.objects.active = armature_obj
bone_segments = {}
for bone in armature_obj.data.bones:
    head_world = armature_obj.matrix_world @ bone.head_local
    tail_world = armature_obj.matrix_world @ bone.tail_local
    bone_segments[bone.name] = (head_world, tail_world)

# Weight parameters
DEFAULT_RADIUS = height * 0.25  # How far bone influence reaches
SMOOTH_FACTOR = 2.0  # Higher = sharper falloff

# Per-bone radius overrides: tighter for head/neck to prevent face bleed
BONE_RADIUS_OVERRIDE = {
    'Head': height * 0.10,
    'Neck': height * 0.12,
}

# Bones allowed above neck height — everything else is excluded
HEAD_ZONE_BONES = {'Head', 'Neck'}

verts_weighted = 0
for v in mesh_obj.data.vertices:
    world_co = mesh_obj.matrix_world @ v.co

    # Calculate distance to each bone
    bone_weights = {}
    # Use a lower cutoff than neck_z to protect the full head+hat area
    head_cutoff_z = bottom_z + height * 0.72
    is_head_zone = world_co.z > head_cutoff_z
    for bone_name, (head, tail) in bone_segments.items():
        # Above neck: ONLY Head and Neck bones allowed
        if is_head_zone and bone_name not in HEAD_ZONE_BONES:
            continue
        radius = BONE_RADIUS_OVERRIDE.get(bone_name, DEFAULT_RADIUS)
        dist = point_to_segment_dist(world_co, head, tail)
        if dist < radius:
            # Inverse distance weight with smooth falloff
            w = max(0, 1.0 - (dist / radius)) ** SMOOTH_FACTOR
            bone_weights[bone_name] = w

    if not bone_weights:
        # If no bone is close enough, assign to nearest ALLOWED bone
        min_dist = float('inf')
        nearest_bone = None
        for bone_name, (head, tail) in bone_segments.items():
            # Respect the head zone filter in fallback too
            if is_head_zone and bone_name not in HEAD_ZONE_BONES:
                continue
            dist = point_to_segment_dist(world_co, head, tail)
            if dist < min_dist:
                min_dist = dist
                nearest_bone = bone_name
        if nearest_bone:
            bone_weights[nearest_bone] = 1.0

    # Normalize weights
    total = sum(bone_weights.values())
    if total > 0:
        for bone_name, w in bone_weights.items():
            normalized_w = w / total
            if normalized_w > 0.01:  # Skip tiny weights
                vg = mesh_obj.vertex_groups[bone_name]
                vg.add([v.index], normalized_w, 'REPLACE')
        verts_weighted += 1

print(f"Manual weight painting: {verts_weighted}/{len(mesh_obj.data.vertices)} vertices weighted")

# ---------------------------------------------------------------------------
# Rigid object pass: lock extremity vertices to a single arm bone
# ---------------------------------------------------------------------------
# Vertices far from the body center are likely weapons/shields/accessories.
# These should NOT deform — lock them to the nearest arm/hand bone only.

RIGID_THRESHOLD_X = width * 0.38   # distance from center X to be considered "extremity"
RIGID_THRESHOLD_Y = height * 0.28  # distance from center Y (front/back protrusions)

ARM_BONE_NAMES_L = ['Hand.L', 'LowerArm.L', 'UpperArm.L']
ARM_BONE_NAMES_R = ['Hand.R', 'LowerArm.R', 'UpperArm.R']

rigid_count = 0
for v in mesh_obj.data.vertices:
    world_co = mesh_obj.matrix_world @ v.co
    dx = abs(world_co.x - center_x)
    dy_front = center_y - world_co.y  # positive = in front
    dy_back = world_co.y - center_y   # positive = behind

    # Skip head zone vertices (already handled)
    head_cutoff_z = bottom_z + height * 0.72
    if world_co.z > head_cutoff_z:
        continue

    is_extremity = dx > RIGID_THRESHOLD_X or dy_front > RIGID_THRESHOLD_Y or dy_back > RIGID_THRESHOLD_Y

    if not is_extremity:
        continue

    # Find nearest arm bone (prefer hand > lower arm > upper arm)
    if world_co.x > center_x:
        candidate_bones = ARM_BONE_NAMES_L  # character's left side
    else:
        candidate_bones = ARM_BONE_NAMES_R  # character's right side

    # Find closest arm bone
    best_bone = None
    best_dist = float('inf')
    for bone_name in candidate_bones:
        if bone_name not in bone_segments:
            continue
        head, tail = bone_segments[bone_name]
        dist = point_to_segment_dist(world_co, head, tail)
        if dist < best_dist:
            best_dist = dist
            best_bone = bone_name

    if best_bone:
        # Clear all existing weights for this vertex
        for vg in mesh_obj.vertex_groups:
            try:
                vg.remove([v.index])
            except RuntimeError:
                pass
        # Assign 100% to the single nearest arm bone
        mesh_obj.vertex_groups[best_bone].add([v.index], 1.0, 'REPLACE')
        rigid_count += 1

print(f"Rigid object pass: {rigid_count} extremity vertices locked to single bones")

# ---------------------------------------------------------------------------
# Animation Helper
# ---------------------------------------------------------------------------
def create_action(name, frame_count):
    """Create a new action and assign it to the armature."""
    action = bpy.data.actions.new(name=name)
    armature_obj.animation_data_create()
    armature_obj.animation_data.action = action
    return action

def set_bone_keyframe(bone_name, frame, location=None, rotation_euler=None):
    """Set a keyframe on a pose bone."""
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')
    bone = armature_obj.pose.bones.get(bone_name)
    if not bone:
        return
    if location is not None:
        bone.location = location
        bone.keyframe_insert(data_path="location", frame=frame)
    if rotation_euler is not None:
        bone.rotation_mode = 'XYZ'
        bone.rotation_euler = rotation_euler
        bone.keyframe_insert(data_path="rotation_euler", frame=frame)
    bpy.ops.object.mode_set(mode='OBJECT')

def reset_pose():
    """Reset all pose bones to rest position."""
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')
    for bone in armature_obj.pose.bones:
        bone.location = (0, 0, 0)
        bone.rotation_mode = 'XYZ'
        bone.rotation_euler = (0, 0, 0)
        bone.scale = (1, 1, 1)
    bpy.ops.object.mode_set(mode='OBJECT')

# Shorthand for degrees to radians
def rad(degrees):
    return math.radians(degrees)

# ---------------------------------------------------------------------------
# Animation 1: IDLE (60 frames, looping)
# Subtle breathing: chest rises/falls, slight sway
# ---------------------------------------------------------------------------
print("Creating IDLE animation...")
create_action("Idle", 60)
reset_pose()

# Frame 1 & 60: rest
set_bone_keyframe("Chest", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Hips", 1, location=(0, 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Head", 1, rotation_euler=(0, 0, 0))

# Frame 30: inhale peak
set_bone_keyframe("Chest", 30, rotation_euler=(rad(-3), 0, 0))
set_bone_keyframe("Hips", 30, location=(0, 0, 0.01))
set_bone_keyframe("UpperArm.L", 30, rotation_euler=(rad(2), 0, rad(-2)))
set_bone_keyframe("UpperArm.R", 30, rotation_euler=(rad(2), 0, rad(2)))
set_bone_keyframe("Head", 30, rotation_euler=(rad(-2), rad(3), 0))

# Frame 60: back to rest (loop)
set_bone_keyframe("Chest", 60, rotation_euler=(0, 0, 0))
set_bone_keyframe("Hips", 60, location=(0, 0, 0))
set_bone_keyframe("UpperArm.L", 60, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 60, rotation_euler=(0, 0, 0))
set_bone_keyframe("Head", 60, rotation_euler=(0, 0, 0))

# ---------------------------------------------------------------------------
# Animation 2: WALK (40 frames, looping)
# Alternating legs, arm swing, hip rotation
# ---------------------------------------------------------------------------
print("Creating WALK animation...")
create_action("Walk", 40)
reset_pose()

walk_leg_angle = 25   # degrees forward/back
walk_arm_angle = 20
walk_hip_sway = 3
walk_lean = 5

# Contact L forward (frame 1)
set_bone_keyframe("Hips", 1, location=(0, 0, -0.02), rotation_euler=(rad(walk_lean), 0, rad(-walk_hip_sway)))
set_bone_keyframe("UpperLeg.L", 1, rotation_euler=(rad(-walk_leg_angle), 0, 0))
set_bone_keyframe("LowerLeg.L", 1, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("UpperLeg.R", 1, rotation_euler=(rad(walk_leg_angle), 0, 0))
set_bone_keyframe("LowerLeg.R", 1, rotation_euler=(rad(-35), 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(rad(walk_arm_angle), 0, 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(rad(-walk_arm_angle), 0, 0))
set_bone_keyframe("Spine", 1, rotation_euler=(0, 0, rad(walk_hip_sway)))

# Passing (frame 10)
set_bone_keyframe("Hips", 10, location=(0, 0, 0.02), rotation_euler=(rad(walk_lean), 0, 0))
set_bone_keyframe("UpperLeg.L", 10, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerLeg.L", 10, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperLeg.R", 10, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerLeg.R", 10, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.L", 10, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 10, rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 10, rotation_euler=(0, 0, 0))

# Contact R forward (frame 20)
set_bone_keyframe("Hips", 20, location=(0, 0, -0.02), rotation_euler=(rad(walk_lean), 0, rad(walk_hip_sway)))
set_bone_keyframe("UpperLeg.L", 20, rotation_euler=(rad(walk_leg_angle), 0, 0))
set_bone_keyframe("LowerLeg.L", 20, rotation_euler=(rad(-35), 0, 0))
set_bone_keyframe("UpperLeg.R", 20, rotation_euler=(rad(-walk_leg_angle), 0, 0))
set_bone_keyframe("LowerLeg.R", 20, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("UpperArm.L", 20, rotation_euler=(rad(-walk_arm_angle), 0, 0))
set_bone_keyframe("UpperArm.R", 20, rotation_euler=(rad(walk_arm_angle), 0, 0))
set_bone_keyframe("Spine", 20, rotation_euler=(0, 0, rad(-walk_hip_sway)))

# Passing (frame 30)
set_bone_keyframe("Hips", 30, location=(0, 0, 0.02), rotation_euler=(rad(walk_lean), 0, 0))
set_bone_keyframe("UpperLeg.L", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerLeg.L", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperLeg.R", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerLeg.R", 30, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 30, rotation_euler=(0, 0, 0))

# Loop back to frame 1 (frame 40)
set_bone_keyframe("Hips", 40, location=(0, 0, -0.02), rotation_euler=(rad(walk_lean), 0, rad(-walk_hip_sway)))
set_bone_keyframe("UpperLeg.L", 40, rotation_euler=(rad(-walk_leg_angle), 0, 0))
set_bone_keyframe("LowerLeg.L", 40, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("UpperLeg.R", 40, rotation_euler=(rad(walk_leg_angle), 0, 0))
set_bone_keyframe("LowerLeg.R", 40, rotation_euler=(rad(-35), 0, 0))
set_bone_keyframe("UpperArm.L", 40, rotation_euler=(rad(walk_arm_angle), 0, 0))
set_bone_keyframe("UpperArm.R", 40, rotation_euler=(rad(-walk_arm_angle), 0, 0))
set_bone_keyframe("Spine", 40, rotation_euler=(0, 0, rad(walk_hip_sway)))

# ---------------------------------------------------------------------------
# Animation 3: ATTACK MELEE (30 frames, one-shot)
# Wind up right arm, swing forward, recover
# ---------------------------------------------------------------------------
print("Creating ATTACK animation...")
create_action("Attack", 30)
reset_pose()

# Frame 1: Ready stance
set_bone_keyframe("Hips", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Chest", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerArm.R", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(0, 0, 0))

# Frame 8: Wind up — lean back, right arm raised
set_bone_keyframe("Hips", 8, rotation_euler=(rad(10), rad(-15), 0))
set_bone_keyframe("Chest", 8, rotation_euler=(rad(15), rad(-20), 0))
set_bone_keyframe("UpperArm.R", 8, rotation_euler=(rad(-90), rad(-30), 0))
set_bone_keyframe("LowerArm.R", 8, rotation_euler=(rad(-60), 0, 0))
set_bone_keyframe("UpperArm.L", 8, rotation_euler=(rad(-20), 0, rad(-15)))

# Frame 14: Strike! — lean forward, arm swings down
set_bone_keyframe("Hips", 14, rotation_euler=(rad(-15), rad(10), 0))
set_bone_keyframe("Chest", 14, rotation_euler=(rad(-25), rad(15), 0))
set_bone_keyframe("UpperArm.R", 14, rotation_euler=(rad(50), rad(15), 0))
set_bone_keyframe("LowerArm.R", 14, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("UpperArm.L", 14, rotation_euler=(rad(10), 0, rad(-10)))

# Frame 20: Follow through
set_bone_keyframe("Hips", 20, rotation_euler=(rad(-5), rad(5), 0))
set_bone_keyframe("Chest", 20, rotation_euler=(rad(-10), rad(8), 0))
set_bone_keyframe("UpperArm.R", 20, rotation_euler=(rad(30), rad(10), 0))
set_bone_keyframe("LowerArm.R", 20, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("UpperArm.L", 20, rotation_euler=(rad(5), 0, 0))

# Frame 30: Return to ready
set_bone_keyframe("Hips", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("Chest", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerArm.R", 30, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.L", 30, rotation_euler=(0, 0, 0))

# ---------------------------------------------------------------------------
# Animation 4: DEATH (40 frames, one-shot)
# Stagger back, collapse to ground
# ---------------------------------------------------------------------------
print("Creating DEATH animation...")
create_action("Death", 40)
reset_pose()

# Frame 1: Standing
set_bone_keyframe("Hips", 1, location=(0, 0, 0), rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Chest", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Head", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperLeg.L", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperLeg.R", 1, rotation_euler=(0, 0, 0))

# Frame 8: Hit reaction — stagger back
set_bone_keyframe("Hips", 8, location=(0, 0.05, 0), rotation_euler=(rad(15), 0, rad(5)))
set_bone_keyframe("Spine", 8, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("Chest", 8, rotation_euler=(rad(15), 0, 0))
set_bone_keyframe("Head", 8, rotation_euler=(rad(20), 0, rad(-10)))
set_bone_keyframe("UpperArm.L", 8, rotation_euler=(rad(-30), 0, rad(-20)))
set_bone_keyframe("UpperArm.R", 8, rotation_euler=(rad(-20), 0, rad(25)))

# Frame 18: Knees buckling
set_bone_keyframe("Hips", 18, location=(0, 0.1, -0.3), rotation_euler=(rad(30), 0, rad(8)))
set_bone_keyframe("Spine", 18, rotation_euler=(rad(20), 0, rad(-5)))
set_bone_keyframe("Chest", 18, rotation_euler=(rad(25), 0, 0))
set_bone_keyframe("Head", 18, rotation_euler=(rad(30), rad(-15), 0))
set_bone_keyframe("UpperArm.L", 18, rotation_euler=(rad(-50), 0, rad(-30)))
set_bone_keyframe("UpperArm.R", 18, rotation_euler=(rad(-40), 0, rad(35)))
set_bone_keyframe("UpperLeg.L", 18, rotation_euler=(rad(-30), 0, 0))
set_bone_keyframe("LowerLeg.L", 18, rotation_euler=(rad(-50), 0, 0))
set_bone_keyframe("UpperLeg.R", 18, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("LowerLeg.R", 18, rotation_euler=(rad(-40), 0, 0))

# Frame 30: Collapse to ground
set_bone_keyframe("Hips", 30, location=(0, 0.2, -0.7), rotation_euler=(rad(80), 0, rad(10)))
set_bone_keyframe("Spine", 30, rotation_euler=(rad(15), 0, rad(-5)))
set_bone_keyframe("Chest", 30, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("Head", 30, rotation_euler=(rad(-20), rad(-20), 0))
set_bone_keyframe("UpperArm.L", 30, rotation_euler=(rad(-70), rad(20), rad(-40)))
set_bone_keyframe("UpperArm.R", 30, rotation_euler=(rad(-60), rad(-15), rad(50)))
set_bone_keyframe("UpperLeg.L", 30, rotation_euler=(rad(-10), 0, rad(-15)))
set_bone_keyframe("LowerLeg.L", 30, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperLeg.R", 30, rotation_euler=(rad(5), 0, rad(10)))
set_bone_keyframe("LowerLeg.R", 30, rotation_euler=(rad(-15), 0, 0))

# Frame 40: Final resting position (settled)
set_bone_keyframe("Hips", 40, location=(0, 0.25, -0.75), rotation_euler=(rad(85), 0, rad(10)))
set_bone_keyframe("Spine", 40, rotation_euler=(rad(15), 0, rad(-5)))
set_bone_keyframe("Chest", 40, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("Head", 40, rotation_euler=(rad(-25), rad(-20), 0))
set_bone_keyframe("UpperArm.L", 40, rotation_euler=(rad(-70), rad(20), rad(-40)))
set_bone_keyframe("UpperArm.R", 40, rotation_euler=(rad(-60), rad(-15), rad(50)))
set_bone_keyframe("UpperLeg.L", 40, rotation_euler=(rad(-10), 0, rad(-15)))
set_bone_keyframe("LowerLeg.L", 40, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperLeg.R", 40, rotation_euler=(rad(5), 0, rad(10)))
set_bone_keyframe("LowerLeg.R", 40, rotation_euler=(rad(-15), 0, 0))

# ---------------------------------------------------------------------------
# Category-specific animations
# ---------------------------------------------------------------------------

if unit_category == 'worker':
    # -----------------------------------------------------------------------
    # Animation 5: GATHER (36 frames, looping)
    # Rhythmic overhead swing -- pickaxe/axe chopping motion
    # -----------------------------------------------------------------------
    print("Creating GATHER animation...")
    create_action("Gather", 36)
    reset_pose()

    # Frame 1: Tool raised -- arms up, body leaning slightly back
    set_bone_keyframe("Hips", 1, location=(0, 0, 0), rotation_euler=(rad(10), 0, 0))
    set_bone_keyframe("Spine", 1, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("Chest", 1, rotation_euler=(rad(10), 0, 0))
    set_bone_keyframe("UpperArm.R", 1, rotation_euler=(rad(-120), rad(-10), 0))
    set_bone_keyframe("LowerArm.R", 1, rotation_euler=(rad(-40), 0, 0))
    set_bone_keyframe("UpperArm.L", 1, rotation_euler=(rad(-100), rad(10), 0))
    set_bone_keyframe("LowerArm.L", 1, rotation_euler=(rad(-50), 0, 0))
    set_bone_keyframe("Head", 1, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("UpperLeg.L", 1, rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("UpperLeg.R", 1, rotation_euler=(rad(-5), 0, 0))

    # Frame 8: Downswing -- arms accelerating down, body leans forward
    set_bone_keyframe("Hips", 8, location=(0, 0, -0.03), rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("Spine", 8, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("Chest", 8, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("UpperArm.R", 8, rotation_euler=(rad(-30), rad(-5), 0))
    set_bone_keyframe("LowerArm.R", 8, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("UpperArm.L", 8, rotation_euler=(rad(-20), rad(5), 0))
    set_bone_keyframe("LowerArm.L", 8, rotation_euler=(rad(-25), 0, 0))
    set_bone_keyframe("Head", 8, rotation_euler=(rad(5), 0, 0))

    # Frame 14: Impact -- tool hits, body absorbs shock, knees bend
    set_bone_keyframe("Hips", 14, location=(0, 0, -0.08), rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("Spine", 14, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("Chest", 14, rotation_euler=(rad(-25), 0, 0))
    set_bone_keyframe("UpperArm.R", 14, rotation_euler=(rad(20), rad(5), 0))
    set_bone_keyframe("LowerArm.R", 14, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("UpperArm.L", 14, rotation_euler=(rad(10), 0, 0))
    set_bone_keyframe("LowerArm.L", 14, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("Head", 14, rotation_euler=(rad(15), 0, 0))
    set_bone_keyframe("UpperLeg.L", 14, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("LowerLeg.L", 14, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("UpperLeg.R", 14, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("LowerLeg.R", 14, rotation_euler=(rad(-20), 0, 0))

    # Frame 20: Recoil -- body bounces up slightly
    set_bone_keyframe("Hips", 20, location=(0, 0, -0.02), rotation_euler=(rad(-8), 0, 0))
    set_bone_keyframe("Spine", 20, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("Chest", 20, rotation_euler=(rad(-12), 0, 0))
    set_bone_keyframe("UpperArm.R", 20, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("LowerArm.R", 20, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("UpperArm.L", 20, rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("LowerArm.L", 20, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("Head", 20, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("UpperLeg.L", 20, rotation_euler=(rad(-8), 0, 0))
    set_bone_keyframe("LowerLeg.L", 20, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("UpperLeg.R", 20, rotation_euler=(rad(-8), 0, 0))
    set_bone_keyframe("LowerLeg.R", 20, rotation_euler=(rad(-10), 0, 0))

    # Frame 28: Rising back -- tool coming up for next swing
    set_bone_keyframe("Hips", 28, location=(0, 0, 0), rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("Spine", 28, rotation_euler=(rad(3), 0, 0))
    set_bone_keyframe("Chest", 28, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("UpperArm.R", 28, rotation_euler=(rad(-80), rad(-8), 0))
    set_bone_keyframe("LowerArm.R", 28, rotation_euler=(rad(-35), 0, 0))
    set_bone_keyframe("UpperArm.L", 28, rotation_euler=(rad(-60), rad(8), 0))
    set_bone_keyframe("LowerArm.L", 28, rotation_euler=(rad(-40), 0, 0))
    set_bone_keyframe("Head", 28, rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("UpperLeg.L", 28, rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("LowerLeg.L", 28, rotation_euler=(0, 0, 0))
    set_bone_keyframe("UpperLeg.R", 28, rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("LowerLeg.R", 28, rotation_euler=(0, 0, 0))

    # Frame 36: Full raise -- loops back to frame 1
    set_bone_keyframe("Hips", 36, location=(0, 0, 0), rotation_euler=(rad(10), 0, 0))
    set_bone_keyframe("Spine", 36, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("Chest", 36, rotation_euler=(rad(10), 0, 0))
    set_bone_keyframe("UpperArm.R", 36, rotation_euler=(rad(-120), rad(-10), 0))
    set_bone_keyframe("LowerArm.R", 36, rotation_euler=(rad(-40), 0, 0))
    set_bone_keyframe("UpperArm.L", 36, rotation_euler=(rad(-100), rad(10), 0))
    set_bone_keyframe("LowerArm.L", 36, rotation_euler=(rad(-50), 0, 0))
    set_bone_keyframe("Head", 36, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("UpperLeg.L", 36, rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("UpperLeg.R", 36, rotation_euler=(rad(-5), 0, 0))

    # -----------------------------------------------------------------------
    # Animation 6: BUILD (36 frames, looping)
    # Hammering motion -- forward-facing, smaller controlled swings
    # -----------------------------------------------------------------------
    print("Creating BUILD animation...")
    create_action("Build", 36)
    reset_pose()

    # Frame 1: Ready -- right arm at shoulder height, slight forward lean
    set_bone_keyframe("Hips", 1, location=(0, 0, 0), rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("Spine", 1, rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("Chest", 1, rotation_euler=(rad(-8), 0, 0))
    set_bone_keyframe("UpperArm.R", 1, rotation_euler=(rad(-70), rad(-15), 0))
    set_bone_keyframe("LowerArm.R", 1, rotation_euler=(rad(-60), 0, 0))
    set_bone_keyframe("UpperArm.L", 1, rotation_euler=(rad(-30), rad(10), rad(-10)))
    set_bone_keyframe("LowerArm.L", 1, rotation_euler=(rad(-40), 0, 0))
    set_bone_keyframe("Head", 1, rotation_euler=(rad(10), 0, 0))

    # Frame 10: Hammer raised -- right arm up, wrist cocked
    set_bone_keyframe("Hips", 10, rotation_euler=(rad(-3), 0, 0))
    set_bone_keyframe("Chest", 10, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("UpperArm.R", 10, rotation_euler=(rad(-100), rad(-10), 0))
    set_bone_keyframe("LowerArm.R", 10, rotation_euler=(rad(-70), 0, 0))
    set_bone_keyframe("Head", 10, rotation_euler=(rad(5), 0, 0))

    # Frame 18: Hammer strike -- arm comes down to hit
    set_bone_keyframe("Hips", 18, location=(0, 0, -0.03), rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("Chest", 18, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("UpperArm.R", 18, rotation_euler=(rad(-20), rad(-5), 0))
    set_bone_keyframe("LowerArm.R", 18, rotation_euler=(rad(-25), 0, 0))
    set_bone_keyframe("Head", 18, rotation_euler=(rad(15), 0, 0))

    # Frame 24: Recoil from strike
    set_bone_keyframe("Hips", 24, location=(0, 0, -0.01), rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("Chest", 24, rotation_euler=(rad(-8), 0, 0))
    set_bone_keyframe("UpperArm.R", 24, rotation_euler=(rad(-40), rad(-8), 0))
    set_bone_keyframe("LowerArm.R", 24, rotation_euler=(rad(-40), 0, 0))
    set_bone_keyframe("Head", 24, rotation_euler=(rad(10), 0, 0))

    # Frame 36: Back to ready (loop)
    set_bone_keyframe("Hips", 36, location=(0, 0, 0), rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("Spine", 36, rotation_euler=(rad(-5), 0, 0))
    set_bone_keyframe("Chest", 36, rotation_euler=(rad(-8), 0, 0))
    set_bone_keyframe("UpperArm.R", 36, rotation_euler=(rad(-70), rad(-15), 0))
    set_bone_keyframe("LowerArm.R", 36, rotation_euler=(rad(-60), 0, 0))
    set_bone_keyframe("UpperArm.L", 36, rotation_euler=(rad(-30), rad(10), rad(-10)))
    set_bone_keyframe("LowerArm.L", 36, rotation_euler=(rad(-40), 0, 0))
    set_bone_keyframe("Head", 36, rotation_euler=(rad(10), 0, 0))

elif unit_category == 'ranged':
    # -----------------------------------------------------------------------
    # Animation 5: RANGED ATTACK (28 frames, one-shot)
    # Draw / aim -> release -> recover
    # -----------------------------------------------------------------------
    print("Creating RANGED ATTACK animation...")
    create_action("RangedAttack", 28)
    reset_pose()

    # Frame 1: Ready stance -- weapon low, slight forward lean
    set_bone_keyframe("Hips", 1, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("Chest", 1, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("UpperArm.R", 1, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("LowerArm.R", 1, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("UpperArm.L", 1, rotation_euler=(rad(-10), 0, rad(-10)))
    set_bone_keyframe("LowerArm.L", 1, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("Head", 1, rotation_euler=(0, 0, 0))

    # Frame 6: Draw / wind-up -- right arm pulls back, chest rotates
    set_bone_keyframe("Hips", 6, rotation_euler=(rad(5), rad(-10), 0))
    set_bone_keyframe("Chest", 6, rotation_euler=(rad(10), rad(-25), 0))
    set_bone_keyframe("UpperArm.R", 6, rotation_euler=(rad(-60), rad(-25), 0))
    set_bone_keyframe("LowerArm.R", 6, rotation_euler=(rad(-90), 0, 0))
    set_bone_keyframe("Hand.R", 6, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("UpperArm.L", 6, rotation_euler=(rad(-50), rad(15), rad(-15)))
    set_bone_keyframe("LowerArm.L", 6, rotation_euler=(rad(-30), 0, 0))
    set_bone_keyframe("Head", 6, rotation_euler=(rad(-5), rad(-15), 0))

    # Frame 10: Full draw -- maximum tension, aiming pose
    set_bone_keyframe("Hips", 10, rotation_euler=(rad(5), rad(-15), 0))
    set_bone_keyframe("Chest", 10, rotation_euler=(rad(12), rad(-30), 0))
    set_bone_keyframe("UpperArm.R", 10, rotation_euler=(rad(-75), rad(-35), 0))
    set_bone_keyframe("LowerArm.R", 10, rotation_euler=(rad(-110), 0, 0))
    set_bone_keyframe("Hand.R", 10, rotation_euler=(rad(-25), 0, 0))
    set_bone_keyframe("UpperArm.L", 10, rotation_euler=(rad(-60), rad(20), rad(-15)))
    set_bone_keyframe("LowerArm.L", 10, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("Head", 10, rotation_euler=(rad(-5), rad(-20), 0))

    # Frame 14: Release! -- right arm snaps forward, chest whips, hip thrust
    set_bone_keyframe("Hips", 14, rotation_euler=(rad(-5), rad(10), 0))
    set_bone_keyframe("Chest", 14, rotation_euler=(rad(-10), rad(20), 0))
    set_bone_keyframe("UpperArm.R", 14, rotation_euler=(rad(30), rad(15), 0))
    set_bone_keyframe("LowerArm.R", 14, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("Hand.R", 14, rotation_euler=(rad(10), 0, 0))
    set_bone_keyframe("UpperArm.L", 14, rotation_euler=(rad(-40), rad(10), rad(-10)))
    set_bone_keyframe("LowerArm.L", 14, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("Head", 14, rotation_euler=(rad(-3), rad(10), 0))

    # Frame 20: Follow-through -- right arm extended, weight shifts forward
    set_bone_keyframe("Hips", 20, rotation_euler=(rad(-3), rad(5), 0))
    set_bone_keyframe("Chest", 20, rotation_euler=(rad(-5), rad(10), 0))
    set_bone_keyframe("UpperArm.R", 20, rotation_euler=(rad(15), rad(10), 0))
    set_bone_keyframe("LowerArm.R", 20, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("Hand.R", 20, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("UpperArm.L", 20, rotation_euler=(rad(-20), 0, rad(-10)))
    set_bone_keyframe("LowerArm.L", 20, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("Head", 20, rotation_euler=(0, rad(5), 0))

    # Frame 28: Recover to ready stance
    set_bone_keyframe("Hips", 28, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("Chest", 28, rotation_euler=(rad(5), 0, 0))
    set_bone_keyframe("UpperArm.R", 28, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("LowerArm.R", 28, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("UpperArm.L", 28, rotation_euler=(rad(-10), 0, rad(-10)))
    set_bone_keyframe("LowerArm.L", 28, rotation_euler=(rad(-15), 0, 0))
    set_bone_keyframe("Head", 28, rotation_euler=(0, 0, 0))

# ---------------------------------------------------------------------------
# Make all actions have nice interpolation (Blender 5.1 Baklava API)
# ---------------------------------------------------------------------------
for action in bpy.data.actions:
    try:
        # Blender 5.1+ Baklava layered action system
        for layer in action.layers:
            for strip in layer.strips:
                for channelbag in strip.channelbags:
                    for fcurve in channelbag.fcurves:
                        for kfp in fcurve.keyframe_points:
                            kfp.interpolation = 'BEZIER'
                            kfp.handle_left_type = 'AUTO_CLAMPED'
                            kfp.handle_right_type = 'AUTO_CLAMPED'
    except (AttributeError, TypeError):
        # Fallback for older Blender versions
        if hasattr(action, 'fcurves'):
            for fcurve in action.fcurves:
                for kfp in fcurve.keyframe_points:
                    kfp.interpolation = 'BEZIER'
                    kfp.handle_left_type = 'AUTO_CLAMPED'
                    kfp.handle_right_type = 'AUTO_CLAMPED'

print(f"Created {len(bpy.data.actions)} animations: {[a.name for a in bpy.data.actions]}")

# ---------------------------------------------------------------------------
# Export as GLB with all animations
# ---------------------------------------------------------------------------
# Select everything for export
bpy.ops.object.select_all(action='SELECT')

# Push all actions into NLA tracks so they export
armature_obj.animation_data_create()
for i, action in enumerate(bpy.data.actions):
    track = armature_obj.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, int(action.frame_range[0]), action)
    strip.name = action.name

# Clear the active action so NLA tracks are used
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
    # Blender 5.1+ may have different parameter names
    bpy.ops.export_scene.gltf(
        filepath=output_glb,
        export_format='GLB',
        export_animations=True,
        export_skins=True,
        export_normals=True,
    )

import os
file_size = os.path.getsize(output_glb)
print(f"\nExported: {output_glb} ({file_size / 1024:.1f} KB)")
print(f"Animations: {[a.name for a in bpy.data.actions]}")
print("DONE!")
