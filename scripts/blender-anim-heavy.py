"""
Blender script: Add HEAVY ATTACK animation to an already-rigged GLB.

Appends a 'HeavyAttack' NLA track: slow powerful overhead swing with weight shift.
Designed for heavy/cavalry units wielding large weapons (hammers, axes, halberds).

Usage:
  blender --background --python blender-anim-heavy.py -- <input.glb> <output.glb>

The input GLB must already contain an Armature with the standard 17-bone naming.

Animation: HeavyAttack (36 frames, one-shot @ 24fps = 1.5s)
  Frame  1: Stance — weapon lowered, wide stance, weight back
  Frame 10: Wind-up — slow, deliberate raise. Both arms lift weapon overhead.
            Hips rotate, weight shifts to back leg. Exaggerated lean-back.
  Frame 16: Apex — maximum height, brief hold for anticipation
  Frame 20: Strike! — explosive downswing, body commits fully forward,
            weight slams forward, knees bend on impact
  Frame 26: Impact aftershock — ground-pound recoil, knees absorb, slight bounce
  Frame 36: Recover — slow return to stance (heavy weapon = slow recovery)

Design notes:
  - 50% slower than standard Attack (36 vs 24 frames)
  - Exaggerated angles (120+ degree arm rotations) for RTS visibility
  - Deep knee bend on impact to sell the weight of the weapon
  - Asymmetric recovery: right arm recovers slower (weighted weapon)
"""

import bpy
import sys
import math

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------
argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
if len(args) < 2:
    print("Usage: blender --background --python blender-anim-heavy.py -- <input.glb> <output.glb>")
    sys.exit(1)

input_glb = args[0]
output_glb = args[1]

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_glb)

armature_obj = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        armature_obj = obj
        break

if not armature_obj:
    print("ERROR: No armature found in input GLB.")
    sys.exit(1)

print(f"Found armature: {armature_obj.name} with {len(armature_obj.data.bones)} bones")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def rad(degrees):
    return math.radians(degrees)

def create_action(name):
    action = bpy.data.actions.new(name=name)
    armature_obj.animation_data_create()
    armature_obj.animation_data.action = action
    return action

def reset_pose():
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')
    for bone in armature_obj.pose.bones:
        bone.location = (0, 0, 0)
        bone.rotation_mode = 'XYZ'
        bone.rotation_euler = (0, 0, 0)
        bone.scale = (1, 1, 1)
    bpy.ops.object.mode_set(mode='OBJECT')

def set_bone_keyframe(bone_name, frame, location=None, rotation_euler=None):
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

# ---------------------------------------------------------------------------
# Animation: HEAVY ATTACK (36 frames, one-shot)
# Slow, powerful overhead swing with full body commitment
# ---------------------------------------------------------------------------
print("Creating HEAVY ATTACK animation...")
create_action("HeavyAttack")
reset_pose()

# Frame 1: Wide stance — weapon lowered at right side, weight balanced
set_bone_keyframe("Hips", 1, location=(0, 0, 0), rotation_euler=(rad(5), rad(-5), 0))
set_bone_keyframe("Spine", 1, rotation_euler=(rad(5), 0, 0))
set_bone_keyframe("Chest", 1, rotation_euler=(rad(5), rad(-5), 0))
set_bone_keyframe("Head", 1, rotation_euler=(0, rad(-5), 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(rad(-10), rad(-10), 0))
set_bone_keyframe("LowerArm.R", 1, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(rad(-5), 0, rad(-10)))
set_bone_keyframe("LowerArm.L", 1, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("UpperLeg.L", 1, rotation_euler=(rad(-5), 0, rad(-5)))
set_bone_keyframe("UpperLeg.R", 1, rotation_euler=(rad(-5), 0, rad(5)))
set_bone_keyframe("LowerLeg.L", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerLeg.R", 1, rotation_euler=(0, 0, 0))

# Frame 10: Wind-up — slow deliberate raise, lean back, weight on back leg
set_bone_keyframe("Hips", 10, location=(0, 0.05, 0.03), rotation_euler=(rad(20), rad(-15), 0))
set_bone_keyframe("Spine", 10, rotation_euler=(rad(15), rad(-10), 0))
set_bone_keyframe("Chest", 10, rotation_euler=(rad(20), rad(-20), 0))
set_bone_keyframe("Head", 10, rotation_euler=(rad(-10), rad(-10), 0))
set_bone_keyframe("UpperArm.R", 10, rotation_euler=(rad(-130), rad(-25), 0))
set_bone_keyframe("LowerArm.R", 10, rotation_euler=(rad(-50), 0, 0))
set_bone_keyframe("Hand.R", 10, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 10, rotation_euler=(rad(-110), rad(15), rad(-20)))
set_bone_keyframe("LowerArm.L", 10, rotation_euler=(rad(-40), 0, 0))
set_bone_keyframe("UpperLeg.L", 10, rotation_euler=(rad(-3), 0, rad(-5)))
set_bone_keyframe("UpperLeg.R", 10, rotation_euler=(rad(-15), 0, rad(5)))
set_bone_keyframe("LowerLeg.R", 10, rotation_euler=(rad(-15), 0, 0))

# Frame 16: Apex — maximum height, brief hold (anticipation)
set_bone_keyframe("Hips", 16, location=(0, 0.06, 0.04), rotation_euler=(rad(22), rad(-18), 0))
set_bone_keyframe("Spine", 16, rotation_euler=(rad(18), rad(-12), 0))
set_bone_keyframe("Chest", 16, rotation_euler=(rad(25), rad(-25), 0))
set_bone_keyframe("Head", 16, rotation_euler=(rad(-12), rad(-12), 0))
set_bone_keyframe("UpperArm.R", 16, rotation_euler=(rad(-140), rad(-30), 0))
set_bone_keyframe("LowerArm.R", 16, rotation_euler=(rad(-45), 0, 0))
set_bone_keyframe("Hand.R", 16, rotation_euler=(rad(-25), 0, 0))
set_bone_keyframe("UpperArm.L", 16, rotation_euler=(rad(-120), rad(18), rad(-25)))
set_bone_keyframe("LowerArm.L", 16, rotation_euler=(rad(-35), 0, 0))

# Frame 20: STRIKE! — explosive downswing, full body commits forward
set_bone_keyframe("Hips", 20, location=(0, -0.05, -0.1), rotation_euler=(rad(-25), rad(15), 0))
set_bone_keyframe("Spine", 20, rotation_euler=(rad(-20), rad(10), 0))
set_bone_keyframe("Chest", 20, rotation_euler=(rad(-35), rad(20), 0))
set_bone_keyframe("Head", 20, rotation_euler=(rad(15), rad(10), 0))
set_bone_keyframe("UpperArm.R", 20, rotation_euler=(rad(60), rad(20), 0))
set_bone_keyframe("LowerArm.R", 20, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Hand.R", 20, rotation_euler=(rad(15), 0, 0))
set_bone_keyframe("UpperArm.L", 20, rotation_euler=(rad(30), 0, rad(-10)))
set_bone_keyframe("LowerArm.L", 20, rotation_euler=(rad(-15), 0, 0))
# Deep knee bend on impact
set_bone_keyframe("UpperLeg.L", 20, rotation_euler=(rad(-25), 0, rad(-5)))
set_bone_keyframe("LowerLeg.L", 20, rotation_euler=(rad(-30), 0, 0))
set_bone_keyframe("UpperLeg.R", 20, rotation_euler=(rad(-20), 0, rad(5)))
set_bone_keyframe("LowerLeg.R", 20, rotation_euler=(rad(-25), 0, 0))

# Frame 26: Impact aftershock — recoil bounce, slight upward recovery
set_bone_keyframe("Hips", 26, location=(0, -0.02, -0.05), rotation_euler=(rad(-15), rad(8), 0))
set_bone_keyframe("Spine", 26, rotation_euler=(rad(-10), rad(5), 0))
set_bone_keyframe("Chest", 26, rotation_euler=(rad(-15), rad(10), 0))
set_bone_keyframe("Head", 26, rotation_euler=(rad(8), rad(5), 0))
set_bone_keyframe("UpperArm.R", 26, rotation_euler=(rad(35), rad(12), 0))
set_bone_keyframe("LowerArm.R", 26, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("UpperArm.L", 26, rotation_euler=(rad(15), 0, rad(-10)))
set_bone_keyframe("LowerArm.L", 26, rotation_euler=(rad(-12), 0, 0))
set_bone_keyframe("UpperLeg.L", 26, rotation_euler=(rad(-15), 0, rad(-5)))
set_bone_keyframe("LowerLeg.L", 26, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("UpperLeg.R", 26, rotation_euler=(rad(-12), 0, rad(5)))
set_bone_keyframe("LowerLeg.R", 26, rotation_euler=(rad(-12), 0, 0))

# Frame 36: Slow recover to stance (heavy weapon = slow recovery)
set_bone_keyframe("Hips", 36, location=(0, 0, 0), rotation_euler=(rad(5), rad(-5), 0))
set_bone_keyframe("Spine", 36, rotation_euler=(rad(5), 0, 0))
set_bone_keyframe("Chest", 36, rotation_euler=(rad(5), rad(-5), 0))
set_bone_keyframe("Head", 36, rotation_euler=(0, rad(-5), 0))
set_bone_keyframe("UpperArm.R", 36, rotation_euler=(rad(-10), rad(-10), 0))
set_bone_keyframe("LowerArm.R", 36, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 36, rotation_euler=(rad(-5), 0, rad(-10)))
set_bone_keyframe("LowerArm.L", 36, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("UpperLeg.L", 36, rotation_euler=(rad(-5), 0, rad(-5)))
set_bone_keyframe("UpperLeg.R", 36, rotation_euler=(rad(-5), 0, rad(5)))
set_bone_keyframe("LowerLeg.L", 36, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerLeg.R", 36, rotation_euler=(0, 0, 0))

# ---------------------------------------------------------------------------
# Apply smooth interpolation
# ---------------------------------------------------------------------------
for action in bpy.data.actions:
    if action.name != "HeavyAttack":
        continue
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
        if hasattr(action, 'fcurves'):
            for fcurve in action.fcurves:
                for kfp in fcurve.keyframe_points:
                    kfp.interpolation = 'BEZIER'
                    kfp.handle_left_type = 'AUTO_CLAMPED'
                    kfp.handle_right_type = 'AUTO_CLAMPED'

# ---------------------------------------------------------------------------
# Push to NLA and export
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
armature_obj.animation_data_create()

for action in bpy.data.actions:
    existing_track = None
    if armature_obj.animation_data.nla_tracks:
        for track in armature_obj.animation_data.nla_tracks:
            if track.name == action.name:
                existing_track = track
                break
    if not existing_track:
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
file_size = os.path.getsize(output_glb)
print(f"\nExported: {output_glb} ({file_size / 1024:.1f} KB)")
print(f"Animations: {[a.name for a in bpy.data.actions]}")
print("DONE!")
