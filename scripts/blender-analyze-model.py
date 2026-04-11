"""
Blender script: Analyze a GLB model for rigging potential.
Reports mesh topology, vertex count, bounding box, and structure.

Usage: blender --background --python blender-analyze-model.py -- <path-to-glb>
"""
import bpy
import sys
import json
from mathutils import Vector

# Get GLB path from command line args (after --)
argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
glb_path = args[0] if args else None

if not glb_path:
    print("ERROR: No GLB path provided")
    sys.exit(1)

# Clear default scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import GLB
bpy.ops.import_scene.gltf(filepath=glb_path)

# Analyze scene
report = {
    "file": glb_path,
    "objects": [],
    "total_vertices": 0,
    "total_faces": 0,
    "has_armature": False,
    "has_animations": False,
    "materials": [],
    "bounding_box": None,
}

min_corner = Vector((float('inf'), float('inf'), float('inf')))
max_corner = Vector((float('-inf'), float('-inf'), float('-inf')))

for obj in bpy.data.objects:
    obj_info = {
        "name": obj.name,
        "type": obj.type,
    }

    if obj.type == 'MESH':
        mesh = obj.data
        verts = len(mesh.vertices)
        faces = len(mesh.polygons)
        edges = len(mesh.edges)
        obj_info["vertices"] = verts
        obj_info["faces"] = faces
        obj_info["edges"] = edges
        report["total_vertices"] += verts
        report["total_faces"] += faces

        # Bounding box
        for v in mesh.vertices:
            world_v = obj.matrix_world @ v.co
            min_corner.x = min(min_corner.x, world_v.x)
            min_corner.y = min(min_corner.y, world_v.y)
            min_corner.z = min(min_corner.z, world_v.z)
            max_corner.x = max(max_corner.x, world_v.x)
            max_corner.y = max(max_corner.y, world_v.y)
            max_corner.z = max(max_corner.z, world_v.z)

        # Check vertex groups (indicates existing rigging)
        if obj.vertex_groups:
            obj_info["vertex_groups"] = [vg.name for vg in obj.vertex_groups]

        # Materials
        for mat_slot in obj.material_slots:
            if mat_slot.material:
                mat_info = {"name": mat_slot.material.name}
                report["materials"].append(mat_info)

    elif obj.type == 'ARMATURE':
        report["has_armature"] = True
        arm = obj.data
        obj_info["bones"] = [bone.name for bone in arm.bones]
        obj_info["bone_count"] = len(arm.bones)

    report["objects"].append(obj_info)

# Check for animations
if bpy.data.actions:
    report["has_animations"] = True
    report["animations"] = [{"name": a.name, "frames": a.frame_range[1] - a.frame_range[0]} for a in bpy.data.actions]

# Bounding box dimensions
if min_corner.x != float('inf'):
    dims = max_corner - min_corner
    report["bounding_box"] = {
        "min": [round(min_corner.x, 3), round(min_corner.y, 3), round(min_corner.z, 3)],
        "max": [round(max_corner.x, 3), round(max_corner.y, 3), round(max_corner.z, 3)],
        "dimensions": [round(dims.x, 3), round(dims.y, 3), round(dims.z, 3)],
        "height": round(dims.z, 3),
    }

# Print report
print("\n" + "=" * 60)
print("MODEL ANALYSIS REPORT")
print("=" * 60)
print(json.dumps(report, indent=2))
print("=" * 60)
