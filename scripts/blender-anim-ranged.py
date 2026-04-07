"""
Blender script: Add RANGED ATTACK animation to an already-rigged GLB.

Appends a 'RangedAttack' NLA track: draw bow / raise arm -> release/throw -> recover.
Does NOT re-rig; expects an existing armature with the standard 17-bone naming convention.

Usage:
  blender --background --python blender-anim-ranged.py -- <input.glb> <output.glb>

The input GLB must already contain an Armature with bones:
  Hips, Spine, Chest, Neck, Head,
  UpperArm.L/R, LowerArm.L/R, Hand.L/R,
  UpperLeg.L/R, LowerLeg.L/R, Foot.L/R

Bone convention notes:
  - Right arm (UpperArm.R / LowerArm.R / Hand.R) is the draw/throw hand.
  - Left arm (UpperArm.L / LowerArm.L / Hand.L) is the bow/shield hand.

Animation: RangedAttack (28 frames, one-shot @ 24fps = ~1.17s)
  Frame  1: Ready stance (weapon held low)
  Frame  6: Draw / wind-up (right arm pulls back, chest rotates)
  Frame 10: Full draw / aim (hold — anticipation peak)
  Frame 14: Release! (right arm snaps forward, chest whips, slight hip thrust)
  Frame 20: Follow-through (right arm extended, weight shifts forward)
  Frame 28: Recover to ready stance
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
    print("Usage: blender --background --python blender-anim-ranged.py -- <input.glb> <output.glb>")
    sys.exit(1)

input_glb = args[0]
output_glb = args[1]

# ---------------------------------------------------------------------------
# Setup: load existing rigged GLB
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_glb)

# Find the armature
armature_obj = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        armature_obj = obj
        break

if not armature_obj:
    print("ERROR: No armature found in input GLB. Run blender-rig-and-animate.py first.")
    sys.exit(1)

print(f"Found armature: {armature_obj.name} with {len(armature_obj.data.bones)} bones")

# ---------------------------------------------------------------------------
# Animation Helpers
# ---------------------------------------------------------------------------
def rad(degrees):
    return math.radians(degrees)

def create_action(name):
    """Create a new action and assign it to the armature."""
    action = bpy.data.actions.new(name=name)
    armature_obj.animation_data_create()
    armature_obj.animation_data.action = action
    return action

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

# ---------------------------------------------------------------------------
# Animation: RANGED ATTACK (28 frames, one-shot)
# Draw / aim -> release -> recover
# ---------------------------------------------------------------------------
print("Creating RANGED ATTACK animation...")
create_action("RangedAttack")
reset_pose()

# Frame 1: Ready stance — weapon low, slight forward lean
set_bone_keyframe("Hips", 1, rotation_euler=(rad(5), 0, 0))
set_bone_keyframe("Chest", 1, rotation_euler=(rad(5), 0, 0))
set_bone_keyframe("UpperArm.R", 1, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("LowerArm.R", 1, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 1, rotation_euler=(rad(-10), 0, rad(-10)))
set_bone_keyframe("LowerArm.L", 1, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("Head", 1, rotation_euler=(0, 0, 0))

# Frame 6: Draw / wind-up — right arm pulls back, chest rotates to the right
set_bone_keyframe("Hips", 6, rotation_euler=(rad(5), rad(-10), 0))
set_bone_keyframe("Chest", 6, rotation_euler=(rad(10), rad(-25), 0))
set_bone_keyframe("UpperArm.R", 6, rotation_euler=(rad(-60), rad(-25), 0))
set_bone_keyframe("LowerArm.R", 6, rotation_euler=(rad(-90), 0, 0))
set_bone_keyframe("Hand.R", 6, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("UpperArm.L", 6, rotation_euler=(rad(-50), rad(15), rad(-15)))
set_bone_keyframe("LowerArm.L", 6, rotation_euler=(rad(-30), 0, 0))
set_bone_keyframe("Head", 6, rotation_euler=(rad(-5), rad(-15), 0))

# Frame 10: Full draw — maximum tension, aiming pose
set_bone_keyframe("Hips", 10, rotation_euler=(rad(5), rad(-15), 0))
set_bone_keyframe("Chest", 10, rotation_euler=(rad(12), rad(-30), 0))
set_bone_keyframe("UpperArm.R", 10, rotation_euler=(rad(-75), rad(-35), 0))
set_bone_keyframe("LowerArm.R", 10, rotation_euler=(rad(-110), 0, 0))
set_bone_keyframe("Hand.R", 10, rotation_euler=(rad(-25), 0, 0))
set_bone_keyframe("UpperArm.L", 10, rotation_euler=(rad(-60), rad(20), rad(-15)))
set_bone_keyframe("LowerArm.L", 10, rotation_euler=(rad(-10), 0, 0))
set_bone_keyframe("Head", 10, rotation_euler=(rad(-5), rad(-20), 0))

# Frame 14: Release! — right arm snaps forward, chest whips, hip thrust
set_bone_keyframe("Hips", 14, rotation_euler=(rad(-5), rad(10), 0))
set_bone_keyframe("Chest", 14, rotation_euler=(rad(-10), rad(20), 0))
set_bone_keyframe("UpperArm.R", 14, rotation_euler=(rad(30), rad(15), 0))
set_bone_keyframe("LowerArm.R", 14, rotation_euler=(rad(-15), 0, 0))
set_bone_keyframe("Hand.R", 14, rotation_euler=(rad(10), 0, 0))
set_bone_keyframe("UpperArm.L", 14, rotation_euler=(rad(-40), rad(10), rad(-10)))
set_bone_keyframe("LowerArm.L", 14, rotation_euler=(rad(-20), 0, 0))
set_bone_keyframe("Head", 14, rotation_euler=(rad(-3), rad(10), 0))

# Frame 20: Follow-through — right arm extended, weight shifts forward
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
# Apply smooth interpolation (Blender 5.1 Baklava API)
# ---------------------------------------------------------------------------
for action in bpy.data.actions:
    if action.name != "RangedAttack":
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

# Push ALL actions (existing + new) into NLA tracks
for i, action in enumerate(bpy.data.actions):
    # Check if this action already has an NLA track
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
