"""
Blender script: Add SIEGE ATTACK animation to an already-rigged GLB.

Appends a 'SiegeAttack' NLA track: crouch -> load -> fire with recoil.
Designed for siege units (catapults, ballistae, cannon operators).

Usage:
  blender --background --python blender-anim-siege.py -- <input.glb> <output.glb>

The input GLB must already contain an Armature with the standard 17-bone naming.

Animation: SiegeAttack (40 frames, one-shot @ 24fps = ~1.67s)
  Frame  1: Ready stance — slightly crouched behind siege weapon
  Frame  8: Load — lean forward, arms reach down to load/crank
  Frame 16: Aim — rise up, arms pull back, torso rotates to aim
  Frame 20: FIRE! — sharp forward thrust, arms snap forward, hip drives
  Frame 26: Recoil — body rocks backward from weapon kickback
  Frame 34: Settling — oscillation dampens
  Frame 40: Recover to ready stance

Also creates a 'SiegeIdle' animation (48 frames, looping):
  Crouched ready stance with subtle weight shifting and scanning.
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
    print("Usage: blender --background --python blender-anim-siege.py -- <input.glb> <output.glb>")
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
# Animation: SIEGE ATTACK (40 frames, one-shot)
# Crouch -> load -> aim -> FIRE -> recoil -> settle -> recover
# ---------------------------------------------------------------------------
print("Creating SIEGE ATTACK animation...")
create_action("SiegeAttack")
reset_pose()

# Frame 1: Ready — crouched behind weapon, hands on controls
set_bone_keyframe("Hips", 1, location=(0, 0, -0.08), rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Spine", 1, rotation_euler=(rad(-8), 0, 0))
set_bone_keyframe("Chest", 1, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Head", 1, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(rad(-30), rad(-10), 0))
set_bone_keyframe("LowerArm.R", 1, rotation_euler=(rad(-40), 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(rad(-30), rad(10), 0))
set_bone_keyframe("LowerArm.L", 1, rotation_euler=(rad(-40), 0, 0))
set_bone_keyframe("UpperLeg.L", 1, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("LowerLeg.L", 1, rotation_euler=(rad(-25), 0, 0))
set_bone_keyframe("UpperLeg.R", 1, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("LowerLeg.R", 1, rotation_euler=(rad(-25), 0, 0))

# Frame 8: Load — lean forward deeply, arms reach down to load ammunition
set_bone_keyframe("Hips", 8, location=(0, -0.05, -0.15), rotation_euler=(rad(-25), 0, 0))
set_bone_keyframe("Spine", 8, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("Chest", 8, rotation_euler=(rad(-25), 0, 0))
set_bone_keyframe("Head", 8, rotation_euler=(rad(20), 0, 0))
set_bone_keyframe("UpperArm.R", 8, rotation_euler=(rad(20), rad(-5), 0))
set_bone_keyframe("LowerArm.R", 8, rotation_euler=(rad(-50), 0, 0))
set_bone_keyframe("Hand.R", 8, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 8, rotation_euler=(rad(20), rad(5), 0))
set_bone_keyframe("LowerArm.L", 8, rotation_euler=(rad(-50), 0, 0))
set_bone_keyframe("Hand.L", 8, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperLeg.L", 8, rotation_euler=(rad(-30), 0, 0))
set_bone_keyframe("LowerLeg.L", 8, rotation_euler=(rad(-35), 0, 0))
set_bone_keyframe("UpperLeg.R", 8, rotation_euler=(rad(-30), 0, 0))
set_bone_keyframe("LowerLeg.R", 8, rotation_euler=(rad(-35), 0, 0))

# Frame 16: Aim — rise up, arms pull back on firing mechanism, torso rotates
set_bone_keyframe("Hips", 16, location=(0, 0.02, -0.05), rotation_euler=(rad(-5), rad(-10), 0))
set_bone_keyframe("Spine", 16, rotation_euler=(rad(-3), rad(-5), 0))
set_bone_keyframe("Chest", 16, rotation_euler=(rad(-5), rad(-10), 0))
set_bone_keyframe("Head", 16, rotation_euler=(rad(5), rad(-15), 0))
set_bone_keyframe("UpperArm.R", 16, rotation_euler=(rad(-50), rad(-20), 0))
set_bone_keyframe("LowerArm.R", 16, rotation_euler=(rad(-60), 0, 0))
set_bone_keyframe("Hand.R", 16, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("UpperArm.L", 16, rotation_euler=(rad(-40), rad(15), rad(-15)))
set_bone_keyframe("LowerArm.L", 16, rotation_euler=(rad(-45), 0, 0))
set_bone_keyframe("UpperLeg.L", 16, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("LowerLeg.L", 16, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("UpperLeg.R", 16, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("LowerLeg.R", 16, rotation_euler=(rad(-15), 0, 0))

# Frame 20: FIRE! — sharp forward thrust, arms snap forward, hip drives
set_bone_keyframe("Hips", 20, location=(0, -0.08, -0.08), rotation_euler=(rad(-15), rad(10), 0))
set_bone_keyframe("Spine", 20, rotation_euler=(rad(-12), rad(8), 0))
set_bone_keyframe("Chest", 20, rotation_euler=(rad(-20), rad(15), 0))
set_bone_keyframe("Head", 20, rotation_euler=(rad(8), rad(8), 0))
set_bone_keyframe("UpperArm.R", 20, rotation_euler=(rad(15), rad(10), 0))
set_bone_keyframe("LowerArm.R", 20, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("Hand.R", 20, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("UpperArm.L", 20, rotation_euler=(rad(10), 0, rad(-10)))
set_bone_keyframe("LowerArm.L", 20, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("Hand.L", 20, rotation_euler=(rad(5), 0, 0))
set_bone_keyframe("UpperLeg.L", 20, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("LowerLeg.L", 20, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperLeg.R", 20, rotation_euler=(rad(-18), 0, 0))
set_bone_keyframe("LowerLeg.R", 20, rotation_euler=(rad(-18), 0, 0))

# Frame 26: Recoil — body rocks backward from weapon kickback
set_bone_keyframe("Hips", 26, location=(0, 0.08, -0.05), rotation_euler=(rad(15), rad(-5), 0))
set_bone_keyframe("Spine", 26, rotation_euler=(rad(10), rad(-3), 0))
set_bone_keyframe("Chest", 26, rotation_euler=(rad(12), rad(-5), 0))
set_bone_keyframe("Head", 26, rotation_euler=(rad(-5), rad(-5), 0))
set_bone_keyframe("UpperArm.R", 26, rotation_euler=(rad(-40), rad(-15), 0))
set_bone_keyframe("LowerArm.R", 26, rotation_euler=(rad(-35), 0, 0))
set_bone_keyframe("UpperArm.L", 26, rotation_euler=(rad(-30), rad(10), rad(-10)))
set_bone_keyframe("LowerArm.L", 26, rotation_euler=(rad(-30), 0, 0))
set_bone_keyframe("UpperLeg.L", 26, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("LowerLeg.L", 26, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("UpperLeg.R", 26, rotation_euler=(rad(-12), 0, 0))
set_bone_keyframe("LowerLeg.R", 26, rotation_euler=(rad(-12), 0, 0))

# Frame 34: Settling — dampened oscillation
set_bone_keyframe("Hips", 34, location=(0, 0.01, -0.07), rotation_euler=(rad(-5), rad(2), 0))
set_bone_keyframe("Spine", 34, rotation_euler=(rad(-5), 0, 0))
set_bone_keyframe("Chest", 34, rotation_euler=(rad(-8), rad(2), 0))
set_bone_keyframe("Head", 34, rotation_euler=(rad(8), 0, 0))
set_bone_keyframe("UpperArm.R", 34, rotation_euler=(rad(-28), rad(-8), 0))
set_bone_keyframe("LowerArm.R", 34, rotation_euler=(rad(-38), 0, 0))
set_bone_keyframe("UpperArm.L", 34, rotation_euler=(rad(-28), rad(8), 0))
set_bone_keyframe("LowerArm.L", 34, rotation_euler=(rad(-38), 0, 0))

# Frame 40: Recover to ready stance
set_bone_keyframe("Hips", 40, location=(0, 0, -0.08), rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Spine", 40, rotation_euler=(rad(-8), 0, 0))
set_bone_keyframe("Chest", 40, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Head", 40, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("UpperArm.R", 40, rotation_euler=(rad(-30), rad(-10), 0))
set_bone_keyframe("LowerArm.R", 40, rotation_euler=(rad(-40), 0, 0))
set_bone_keyframe("UpperArm.L", 40, rotation_euler=(rad(-30), rad(10), 0))
set_bone_keyframe("LowerArm.L", 40, rotation_euler=(rad(-40), 0, 0))
set_bone_keyframe("UpperLeg.L", 40, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("LowerLeg.L", 40, rotation_euler=(rad(-25), 0, 0))
set_bone_keyframe("UpperLeg.R", 40, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("LowerLeg.R", 40, rotation_euler=(rad(-25), 0, 0))

# ---------------------------------------------------------------------------
# Animation: SIEGE IDLE (48 frames, looping)
# Crouched ready stance with subtle weight shifting and scanning
# ---------------------------------------------------------------------------
print("Creating SIEGE IDLE animation...")
create_action("SiegeIdle")
reset_pose()

# Frame 1 & 48: Crouched ready (same pose, loop point)
for f in (1, 48):
    set_bone_keyframe("Hips", f, location=(0, 0, -0.08), rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("Spine", f, rotation_euler=(rad(-8), 0, 0))
    set_bone_keyframe("Chest", f, rotation_euler=(rad(-10), 0, 0))
    set_bone_keyframe("Head", f, rotation_euler=(rad(10), 0, 0))
    set_bone_keyframe("UpperArm.R", f, rotation_euler=(rad(-30), rad(-10), 0))
    set_bone_keyframe("LowerArm.R", f, rotation_euler=(rad(-40), 0, 0))
    set_bone_keyframe("UpperArm.L", f, rotation_euler=(rad(-30), rad(10), 0))
    set_bone_keyframe("LowerArm.L", f, rotation_euler=(rad(-40), 0, 0))
    set_bone_keyframe("UpperLeg.L", f, rotation_euler=(rad(-20), 0, 0))
    set_bone_keyframe("LowerLeg.L", f, rotation_euler=(rad(-25), 0, 0))

# Frame 12: Weight shift left
set_bone_keyframe("Hips", 12, location=(0, 0, -0.07), rotation_euler=(rad(-10), 0, rad(-3)))
set_bone_keyframe("Head", 12, rotation_euler=(rad(8), rad(-10), 0))
set_bone_keyframe("Chest", 12, rotation_euler=(rad(-8), rad(-5), 0))

# Frame 24: Center, slight rise (breathing peak)
set_bone_keyframe("Hips", 24, location=(0, 0, -0.06), rotation_euler=(rad(-8), 0, 0))
set_bone_keyframe("Chest", 24, rotation_euler=(rad(-7), 0, 0))
set_bone_keyframe("Head", 24, rotation_euler=(rad(8), rad(5), 0))

# Frame 36: Weight shift right
set_bone_keyframe("Hips", 36, location=(0, 0, -0.07), rotation_euler=(rad(-10), 0, rad(3)))
set_bone_keyframe("Head", 36, rotation_euler=(rad(8), rad(10), 0))
set_bone_keyframe("Chest", 36, rotation_euler=(rad(-8), rad(5), 0))

# ---------------------------------------------------------------------------
# Apply smooth interpolation
# ---------------------------------------------------------------------------
for action in bpy.data.actions:
    if action.name not in ("SiegeAttack", "SiegeIdle"):
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
