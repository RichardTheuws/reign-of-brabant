"""
Blender script: Add GATHER animation to an already-rigged GLB.

Appends a 'Gather' NLA track: rhythmic pickaxe/tool swing downward (looping).
Designed for worker units harvesting resources (mining gold, chopping trees).

Usage:
  blender --background --python blender-anim-worker-gather.py -- <input.glb> <output.glb>

The input GLB must already contain an Armature with the standard 17-bone naming.

Animation: Gather (36 frames, looping @ 24fps = 1.5s per swing cycle)
  Frame  1: Tool raised above right shoulder — ready to swing
  Frame  8: Downswing — tool accelerates downward
  Frame 14: Impact! — tool hits resource, body absorbs impact
  Frame 20: Recoil — slight bounce from impact, body recovers
  Frame 28: Tool rising back up — preparing for next swing
  Frame 36: Back to ready (loops to frame 1)

Additionally creates a 'Build' animation (36 frames, looping):
  Hammering motion — forward-facing, smaller swings, different angle.
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
    print("Usage: blender --background --python blender-anim-worker-gather.py -- <input.glb> <output.glb>")
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
# Animation: GATHER (36 frames, looping)
# Rhythmic overhead swing — pickaxe/axe chopping motion
# ---------------------------------------------------------------------------
print("Creating GATHER animation...")
create_action("Gather")
reset_pose()

# Frame 1: Tool raised — arms up, body leaning slightly back
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

# Frame 8: Downswing — arms accelerating down, body leans forward
set_bone_keyframe("Hips", 8, location=(0, 0, -0.03), rotation_euler=(rad(-5), 0, 0))
set_bone_keyframe("Spine", 8, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Chest", 8, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("UpperArm.R", 8, rotation_euler=(rad(-30), rad(-5), 0))
set_bone_keyframe("LowerArm.R", 8, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 8, rotation_euler=(rad(-20), rad(5), 0))
set_bone_keyframe("LowerArm.L", 8, rotation_euler=(rad(-25), 0, 0))
set_bone_keyframe("Head", 8, rotation_euler=(rad(5), 0, 0))

# Frame 14: Impact — tool hits, body absorbs shock, knees bend
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

# Frame 20: Recoil — body bounces up slightly
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

# Frame 28: Rising back — tool coming up for next swing
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

# Frame 36: Full raise — loops back to frame 1
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

# ---------------------------------------------------------------------------
# Animation: BUILD (36 frames, looping)
# Hammering motion — forward-facing, smaller controlled swings
# ---------------------------------------------------------------------------
print("Creating BUILD animation...")
create_action("Build")
reset_pose()

# Frame 1: Ready — right arm at shoulder height, slight forward lean
set_bone_keyframe("Hips", 1, location=(0, 0, 0), rotation_euler=(rad(-5), 0, 0))
set_bone_keyframe("Spine", 1, rotation_euler=(rad(-5), 0, 0))
set_bone_keyframe("Chest", 1, rotation_euler=(rad(-8), 0, 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(rad(-70), rad(-15), 0))
set_bone_keyframe("LowerArm.R", 1, rotation_euler=(rad(-60), 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(rad(-30), rad(10), rad(-10)))
set_bone_keyframe("LowerArm.L", 1, rotation_euler=(rad(-40), 0, 0))
set_bone_keyframe("Head", 1, rotation_euler=(rad(10), 0, 0))

# Frame 10: Hammer raised — right arm up, wrist cocked
set_bone_keyframe("Hips", 10, rotation_euler=(rad(-3), 0, 0))
set_bone_keyframe("Chest", 10, rotation_euler=(rad(5), 0, 0))
set_bone_keyframe("UpperArm.R", 10, rotation_euler=(rad(-100), rad(-10), 0))
set_bone_keyframe("LowerArm.R", 10, rotation_euler=(rad(-70), 0, 0))
set_bone_keyframe("Head", 10, rotation_euler=(rad(5), 0, 0))

# Frame 18: Hammer strike — arm comes down to hit
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

# ---------------------------------------------------------------------------
# Apply smooth interpolation
# ---------------------------------------------------------------------------
for action in bpy.data.actions:
    if action.name not in ("Gather", "Build"):
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
