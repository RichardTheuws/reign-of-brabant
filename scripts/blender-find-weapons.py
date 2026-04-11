"""Find weapon/shield vertex clusters by detecting outlier vertices far from body center."""
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
verts_world = [mesh_obj.matrix_world @ v.co for v in mesh.vertices]

# Get body center and dimensions
min_co = Vector((min(v.x for v in verts_world), min(v.y for v in verts_world), min(v.z for v in verts_world)))
max_co = Vector((max(v.x for v in verts_world), max(v.y for v in verts_world), max(v.z for v in verts_world)))
center = (min_co + max_co) / 2
dims = max_co - min_co
H = dims.z

# Body core: vertices within a narrow cylinder around center
# Anything far from center X or Y is likely a weapon/shield/accessory
core_radius_x = dims.x * 0.30  # 30% of width from center
core_radius_y = dims.y * 0.35

print(f"Model: {len(verts_world)} verts, dims={dims}")
print(f"Center: {center}")
print(f"Core radius: X={core_radius_x:.3f}, Y={core_radius_y:.3f}")
print()

# Find outlier vertices (outside core)
outliers = []
for i, v in enumerate(verts_world):
    dx = abs(v.x - center.x)
    dy = abs(v.y - center.y)
    if dx > core_radius_x or dy > core_radius_y:
        outliers.append((i, v))

print(f"Outlier vertices (outside body core): {len(outliers)}")

# Cluster outliers by spatial proximity
# Simple approach: split by X side (left/right) and height zones
left_outliers = [(i, v) for i, v in outliers if v.x > center.x]  # positive X
right_outliers = [(i, v) for i, v in outliers if v.x < center.x]  # negative X
front_outliers = [(i, v) for i, v in outliers if v.y < center.y - core_radius_y]
back_outliers = [(i, v) for i, v in outliers if v.y > center.y + core_radius_y]

print(f"\nLeft side (X > center): {len(left_outliers)} verts")
if left_outliers:
    lmin = Vector((min(v.x for _, v in left_outliers), min(v.y for _, v in left_outliers), min(v.z for _, v in left_outliers)))
    lmax = Vector((max(v.x for _, v in left_outliers), max(v.y for _, v in left_outliers), max(v.z for _, v in left_outliers)))
    ldims = lmax - lmin
    print(f"  Bounds: {lmin} -> {lmax}")
    print(f"  Dims: {ldims} (aspect: {'tall/thin=SPEAR' if ldims.z > ldims.x * 3 else 'wide=SHIELD' if ldims.x > ldims.z else 'other'})")

print(f"\nRight side (X < center): {len(right_outliers)} verts")
if right_outliers:
    rmin = Vector((min(v.x for _, v in right_outliers), min(v.y for _, v in right_outliers), min(v.z for _, v in right_outliers)))
    rmax = Vector((max(v.x for _, v in right_outliers), max(v.y for _, v in right_outliers), max(v.z for _, v in right_outliers)))
    rdims = rmax - rmin
    print(f"  Bounds: {rmin} -> {rmax}")
    print(f"  Dims: {rdims} (aspect: {'tall/thin=SPEAR' if rdims.z > rdims.x * 3 else 'wide=SHIELD' if rdims.x > rdims.z else 'other'})")

print(f"\nFront (Y < center): {len(front_outliers)} verts")
if front_outliers:
    fmin = Vector((min(v.x for _, v in front_outliers), min(v.y for _, v in front_outliers), min(v.z for _, v in front_outliers)))
    fmax = Vector((max(v.x for _, v in front_outliers), max(v.y for _, v in front_outliers), max(v.z for _, v in front_outliers)))
    fdims = fmax - fmin
    print(f"  Bounds: {fmin} -> {fmax}")
    print(f"  Dims: {fdims} (aspect: {'tall/thin=SPEAR' if fdims.z > max(fdims.x, fdims.y) * 2.5 else 'flat=SHIELD' if max(fdims.x, fdims.z) > fdims.y * 3 else 'other'})")

print(f"\nBack (Y > center): {len(back_outliers)} verts")
if back_outliers:
    bkmin = Vector((min(v.x for _, v in back_outliers), min(v.y for _, v in back_outliers), min(v.z for _, v in back_outliers)))
    bkmax = Vector((max(v.x for _, v in back_outliers), max(v.y for _, v in back_outliers), max(v.z for _, v in back_outliers)))
    bkdims = bkmax - bkmin
    print(f"  Bounds: {bkmin} -> {bkmax}")
    print(f"  Dims: {bkdims}")

# Height distribution of all outliers
print(f"\nOutlier height distribution:")
for zone_name, zone_min, zone_max in [("feet 0-20%", 0, 0.2), ("legs 20-45%", 0.2, 0.45),
                                        ("torso 45-70%", 0.45, 0.70), ("upper 70-100%", 0.70, 1.0)]:
    z_lo = min_co.z + H * zone_min
    z_hi = min_co.z + H * zone_max
    count = sum(1 for _, v in outliers if z_lo <= v.z < z_hi)
    print(f"  {zone_name}: {count} verts")
