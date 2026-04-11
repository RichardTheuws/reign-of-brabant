"""Diagnose which bones influence the top 20% of the mesh (head zone)."""
import bpy
import sys
from mathutils import Vector

argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
glb_path = args[0]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb_path)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 100:
        mesh_obj = obj
        break

mesh = mesh_obj.data

# Get bounds
min_z = float('inf')
max_z = float('-inf')
for v in mesh.vertices:
    wv = mesh_obj.matrix_world @ v.co
    min_z = min(min_z, wv.z)
    max_z = max(max_z, wv.z)

height = max_z - min_z
neck_threshold = min_z + height * 0.78  # Top 22%

print(f"Model height: {height:.3f}, neck_threshold Z: {neck_threshold:.3f}")
print(f"Checking vertices above Z={neck_threshold:.3f} (top 22% = head zone)")
print()

# Find all vertices in head zone and their bone weights
head_zone_bones = {}  # bone_name -> count of head-zone vertices
head_zone_total = 0

for v in mesh.vertices:
    wv = mesh_obj.matrix_world @ v.co
    if wv.z < neck_threshold:
        continue

    head_zone_total += 1
    for g in v.groups:
        if g.weight > 0.01:
            vg_name = mesh_obj.vertex_groups[g.group].name
            if vg_name not in head_zone_bones:
                head_zone_bones[vg_name] = {'count': 0, 'total_weight': 0, 'max_weight': 0}
            head_zone_bones[vg_name]['count'] += 1
            head_zone_bones[vg_name]['total_weight'] += g.weight
            head_zone_bones[vg_name]['max_weight'] = max(head_zone_bones[vg_name]['max_weight'], g.weight)

print(f"Head zone vertices: {head_zone_total}")
print(f"\nBones influencing head zone (sorted by vertex count):")
for name, data in sorted(head_zone_bones.items(), key=lambda x: -x[1]['count']):
    avg_w = data['total_weight'] / data['count'] if data['count'] > 0 else 0
    print(f"  {name:20s}: {data['count']:5d} verts, avg_weight={avg_w:.3f}, max_weight={data['max_weight']:.3f}")

# Also check the right side specifically
print(f"\n--- RIGHT SIDE of head zone (X < center) ---")
cx = sum((mesh_obj.matrix_world @ v.co).x for v in mesh.vertices) / len(mesh.vertices)
right_head_bones = {}
right_count = 0

for v in mesh.vertices:
    wv = mesh_obj.matrix_world @ v.co
    if wv.z < neck_threshold or wv.x > cx:
        continue

    right_count += 1
    for g in v.groups:
        if g.weight > 0.01:
            vg_name = mesh_obj.vertex_groups[g.group].name
            if vg_name not in right_head_bones:
                right_head_bones[vg_name] = {'count': 0, 'total_weight': 0}
            right_head_bones[vg_name]['count'] += 1
            right_head_bones[vg_name]['total_weight'] += g.weight

print(f"Right-side head vertices: {right_count}")
for name, data in sorted(right_head_bones.items(), key=lambda x: -x[1]['count']):
    avg_w = data['total_weight'] / data['count'] if data['count'] > 0 else 0
    print(f"  {name:20s}: {data['count']:5d} verts, avg_weight={avg_w:.3f}")
