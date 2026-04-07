"""
Diagnostic script: Verify animation clips in a GLB file.

Usage:
  blender --background --python blender-verify-anims.py -- <input.glb>
"""
import bpy
import sys
import json

argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
if len(args) < 1:
    print("Usage: blender --background --python blender-verify-anims.py -- <input.glb>")
    sys.exit(1)

input_glb = args[0]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_glb)

armature_obj = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        armature_obj = obj
        break

animations = []
for action in bpy.data.actions:
    frame_start, frame_end = action.frame_range
    animations.append({
        "name": action.name,
        "frames": int(frame_end - frame_start + 1),
        "range": f"{int(frame_start)}-{int(frame_end)}",
    })

result = {
    "file": input_glb,
    "armature": armature_obj.name if armature_obj else "NONE",
    "bones": len(armature_obj.data.bones) if armature_obj else 0,
    "animations": sorted([a["name"] for a in animations]),
    "details": animations,
}

print(f"VERIFY|{json.dumps(result)}")
