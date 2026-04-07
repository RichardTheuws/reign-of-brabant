"""Check if a GLB has proper skin data (armature + vertex groups + animations)."""
import bpy, sys
argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args[0])

has_armature = False
has_skinned_mesh = False
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        has_armature = True
        print(f"ARMATURE: {obj.name}, bones={len(obj.data.bones)}")
    elif obj.type == 'MESH':
        vg = len(obj.vertex_groups)
        has_mod = any(m.type == 'ARMATURE' for m in obj.modifiers)
        has_skinned_mesh = vg > 0 and has_mod
        print(f"MESH: {obj.name}, verts={len(obj.data.vertices)}, vertex_groups={vg}, armature_mod={has_mod}, parent={obj.parent}")

anims = bpy.data.actions
print(f"ANIMATIONS: {len(anims)} — {[a.name for a in anims]}")
print(f"SKINNED: {'YES' if (has_armature and has_skinned_mesh) else 'NO'}")
