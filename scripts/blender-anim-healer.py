"""
Blender script: Add HEAL/CAST animation to an already-rigged GLB.

Appends a 'Heal' NLA track: raise both arms, channel energy, lower.
Designed for support/healer units casting buffs or healing spells.

Usage:
  blender --background --python blender-anim-healer.py -- <input.glb> <output.glb>

The input GLB must already contain an Armature with the standard 17-bone naming.

Animation: Heal (40 frames, one-shot @ 24fps = ~1.67s)
  Frame  1: Neutral stance — hands at sides
  Frame  8: Preparation — arms begin to rise, head tilts up
  Frame 14: Channel — both arms raised overhead, palms up, spine straight
  Frame 24: Hold — sustained channeling pose (slight oscillation via interpolation)
  Frame 32: Release — arms sweep outward then down, energy disperses
  Frame 40: Return to neutral

The hold phase (frames 14-24) creates a visible window for particle effects
in the game renderer.
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
    print("Usage: blender --background --python blender-anim-healer.py -- <input.glb> <output.glb>")
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
# Animation: HEAL (40 frames, one-shot)
# Raise arms -> channel -> release -> neutral
# ---------------------------------------------------------------------------
print("Creating HEAL animation...")
create_action("Heal")
reset_pose()

# Frame 1: Neutral stance
set_bone_keyframe("Hips", 1, location=(0, 0, 0), rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Chest", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Neck", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Head", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerArm.L", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Hand.L", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerArm.R", 1, rotation_euler=(0, 0, 0))
set_bone_keyframe("Hand.R", 1, rotation_euler=(0, 0, 0))

# Frame 8: Preparation — arms begin to rise, head looks up slightly
set_bone_keyframe("Hips", 8, location=(0, 0, 0.02), rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 8, rotation_euler=(rad(-5), 0, 0))
set_bone_keyframe("Chest", 8, rotation_euler=(rad(-8), 0, 0))
set_bone_keyframe("Neck", 8, rotation_euler=(rad(-5), 0, 0))
set_bone_keyframe("Head", 8, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("UpperArm.L", 8, rotation_euler=(rad(-60), 0, rad(-20)))
set_bone_keyframe("LowerArm.L", 8, rotation_euler=(rad(-30), 0, 0))
set_bone_keyframe("Hand.L", 8, rotation_euler=(rad(-15), 0, rad(10)))
set_bone_keyframe("UpperArm.R", 8, rotation_euler=(rad(-60), 0, rad(20)))
set_bone_keyframe("LowerArm.R", 8, rotation_euler=(rad(-30), 0, 0))
set_bone_keyframe("Hand.R", 8, rotation_euler=(rad(-15), 0, rad(-10)))

# Frame 14: Full channel — arms raised high, palms up, spine extended
set_bone_keyframe("Hips", 14, location=(0, 0, 0.04), rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 14, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Chest", 14, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("Neck", 14, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Head", 14, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 14, rotation_euler=(rad(-140), 0, rad(-25)))
set_bone_keyframe("LowerArm.L", 14, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("Hand.L", 14, rotation_euler=(rad(-30), 0, rad(15)))
set_bone_keyframe("UpperArm.R", 14, rotation_euler=(rad(-140), 0, rad(25)))
set_bone_keyframe("LowerArm.R", 14, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("Hand.R", 14, rotation_euler=(rad(-30), 0, rad(-15)))

# Frame 24: Sustained channel — slight variation from frame 14 for subtle motion
set_bone_keyframe("Hips", 24, location=(0, 0, 0.05), rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 24, rotation_euler=(rad(-12), 0, 0))
set_bone_keyframe("Chest", 24, rotation_euler=(rad(-18), 0, 0))
set_bone_keyframe("Neck", 24, rotation_euler=(rad(-12), 0, 0))
set_bone_keyframe("Head", 24, rotation_euler=(rad(-22), 0, 0))
set_bone_keyframe("UpperArm.L", 24, rotation_euler=(rad(-145), 0, rad(-30)))
set_bone_keyframe("LowerArm.L", 24, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("Hand.L", 24, rotation_euler=(rad(-35), 0, rad(18)))
set_bone_keyframe("UpperArm.R", 24, rotation_euler=(rad(-145), 0, rad(30)))
set_bone_keyframe("LowerArm.R", 24, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("Hand.R", 24, rotation_euler=(rad(-35), 0, rad(-18)))

# Frame 32: Release — arms sweep outward and down, energy disperses
set_bone_keyframe("Hips", 32, location=(0, 0, 0.02), rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 32, rotation_euler=(rad(-5), 0, 0))
set_bone_keyframe("Chest", 32, rotation_euler=(rad(-5), 0, 0))
set_bone_keyframe("Neck", 32, rotation_euler=(rad(-3), 0, 0))
set_bone_keyframe("Head", 32, rotation_euler=(rad(-8), 0, 0))
set_bone_keyframe("UpperArm.L", 32, rotation_euler=(rad(-50), 0, rad(-45)))
set_bone_keyframe("LowerArm.L", 32, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Hand.L", 32, rotation_euler=(rad(-10), 0, rad(5)))
set_bone_keyframe("UpperArm.R", 32, rotation_euler=(rad(-50), 0, rad(45)))
set_bone_keyframe("LowerArm.R", 32, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Hand.R", 32, rotation_euler=(rad(-10), 0, rad(-5)))

# Frame 40: Return to neutral
set_bone_keyframe("Hips", 40, location=(0, 0, 0), rotation_euler=(0, 0, 0))
set_bone_keyframe("Spine", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("Chest", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("Neck", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("Head", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.L", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerArm.L", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("Hand.L", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("UpperArm.R", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("LowerArm.R", 40, rotation_euler=(0, 0, 0))
set_bone_keyframe("Hand.R", 40, rotation_euler=(0, 0, 0))

# ---------------------------------------------------------------------------
# Apply smooth interpolation
# ---------------------------------------------------------------------------
for action in bpy.data.actions:
    if action.name != "Heal":
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
