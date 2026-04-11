"""Check vertex weight status of the rigged model."""
import bpy
import sys

argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
glb_path = args[0] if args else None

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb_path)

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh = obj.data
        print(f"\nMesh: {obj.name}")
        print(f"  Vertices: {len(mesh.vertices)}")
        print(f"  Vertex groups: {len(obj.vertex_groups)}")
        for vg in obj.vertex_groups:
            # Count vertices with non-zero weight in this group
            count = 0
            for v in mesh.vertices:
                for g in v.groups:
                    if g.group == vg.index and g.weight > 0.001:
                        count += 1
            print(f"    {vg.name}: {count} weighted vertices")

        # Check if mesh has armature modifier
        for mod in obj.modifiers:
            print(f"  Modifier: {mod.name} (type={mod.type})")
            if mod.type == 'ARMATURE':
                print(f"    Object: {mod.object}")

        # Check parent
        print(f"  Parent: {obj.parent}")
        print(f"  Parent type: {obj.parent_type}")

    elif obj.type == 'ARMATURE':
        print(f"\nArmature: {obj.name}")
        print(f"  Bones: {len(obj.data.bones)}")
