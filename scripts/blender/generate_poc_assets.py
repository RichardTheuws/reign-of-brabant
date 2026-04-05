"""
Reign of Brabant -- PoC Asset Generator
========================================
Generates all placeholder 3D assets for the Proof of Concept.

Usage:
    blender --background --python generate_poc_assets.py -- --output ./assets/models/poc/

Blender 5.1 compatible. Exports GLB files for Three.js.
All models use Principled BSDF materials with embedded colors (no textures).

Generated with Claude Code.
"""

import bpy
import bmesh
import sys
import os
import math
import random
import time
from mathutils import Vector, Matrix


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

FACTION_COLORS = {
    "orange": {
        "primary": (0.91, 0.42, 0.10, 1.0),    # #E86C1A
        "accent":  (1.00, 0.70, 0.40, 1.0),     # #FFB366
    },
    "blue": {
        "primary": (0.10, 0.42, 0.91, 1.0),     # #1A6CE8
        "accent":  (0.40, 0.70, 1.00, 1.0),     # #66B3FF
    },
}

COLORS = {
    "skin":         (0.87, 0.72, 0.53, 1.0),
    "dark_brown":   (0.25, 0.15, 0.08, 1.0),
    "brown":        (0.45, 0.30, 0.15, 1.0),
    "light_brown":  (0.60, 0.45, 0.25, 1.0),
    "beige":        (0.85, 0.78, 0.65, 1.0),
    "cream":        (0.93, 0.87, 0.75, 1.0),
    "dark_grey":    (0.20, 0.20, 0.22, 1.0),
    "mid_grey":     (0.50, 0.50, 0.52, 1.0),
    "light_grey":   (0.75, 0.75, 0.77, 1.0),
    "white":        (0.95, 0.95, 0.95, 1.0),
    "gold":         (0.83, 0.69, 0.22, 1.0),
    "gold_bright":  (1.00, 0.84, 0.00, 1.0),
    "green_dark":   (0.15, 0.45, 0.12, 1.0),
    "green_mid":    (0.20, 0.55, 0.18, 1.0),
    "green_light":  (0.30, 0.65, 0.25, 1.0),
    "selection":    (0.00, 1.00, 0.00, 0.70),
    "warm_yellow":  (0.95, 0.85, 0.40, 1.0),
}


# ---------------------------------------------------------------------------
# Utility Functions
# ---------------------------------------------------------------------------

def clear_scene():
    """Remove all objects, materials, meshes from the scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Clean orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)


def create_material(name, color, metallic=0.0, roughness=0.7, emission_strength=0.0):
    """Create a Principled BSDF material with given color."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission_strength > 0:
        bsdf.inputs["Emission Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    # Handle alpha for semi-transparent materials
    if color[3] < 1.0:
        # Blender 5.x: blend_method moved to material surface settings
        if hasattr(mat, 'blend_method'):
            mat.blend_method = 'BLEND'
        if hasattr(mat, 'surface_render_method'):
            mat.surface_render_method = 'BLENDED'
        bsdf.inputs["Alpha"].default_value = color[3]
        if hasattr(mat, 'use_backface_culling'):
            mat.use_backface_culling = True
    return mat


def assign_material(obj, mat_or_color):
    """Assign material to an object, replacing any existing.
    Accepts either a bpy.types.Material or a color tuple (r, g, b, a)."""
    if isinstance(mat_or_color, tuple):
        # Auto-create material from color tuple
        mat = create_material(f"auto_{id(mat_or_color)}", mat_or_color)
    else:
        mat = mat_or_color
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def set_origin_to_bottom(obj):
    """Move object origin to the bottom of its bounding box."""
    bbox = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    min_z = min(v.z for v in bbox)
    offset = Vector((0, 0, -min_z))
    obj.data.transform(Matrix.Translation(offset))
    obj.location.z += min_z


def join_objects(objects, name="Joined"):
    """Join a list of objects into one. Returns the joined object."""
    if not objects:
        return None
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    result = bpy.context.active_object
    result.name = name
    return result


def add_cube(size=(1, 1, 1), location=(0, 0, 0)):
    """Add a cube mesh and return the object."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return obj


def add_cylinder(radius=0.5, depth=1.0, vertices=8, location=(0, 0, 0)):
    """Add a cylinder mesh and return the object."""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth, vertices=vertices, location=location
    )
    obj = bpy.context.active_object
    return obj


def add_cone(radius1=0.5, radius2=0.0, depth=1.0, vertices=8, location=(0, 0, 0)):
    """Add a cone mesh and return the object."""
    bpy.ops.mesh.primitive_cone_add(
        radius1=radius1, radius2=radius2, depth=depth,
        vertices=vertices, location=location
    )
    obj = bpy.context.active_object
    return obj


def add_uv_sphere(radius=0.5, segments=8, ring_count=6, location=(0, 0, 0)):
    """Add a UV sphere and return the object."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, segments=segments, ring_count=ring_count, location=location
    )
    obj = bpy.context.active_object
    return obj


def add_ico_sphere(radius=0.5, subdivisions=2, location=(0, 0, 0)):
    """Add an icosphere and return the object."""
    bpy.ops.mesh.primitive_ico_sphere_add(
        radius=radius, subdivisions=subdivisions, location=location
    )
    obj = bpy.context.active_object
    return obj


def add_torus(major_radius=1.0, minor_radius=0.1, major_segments=32,
              minor_segments=8, location=(0, 0, 0)):
    """Add a torus and return the object."""
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius, minor_radius=minor_radius,
        major_segments=major_segments, minor_segments=minor_segments,
        location=location
    )
    obj = bpy.context.active_object
    return obj


def deform_mesh_random(obj, amount=0.1, seed=42):
    """Randomly displace vertices for organic look."""
    rng = random.Random(seed)
    mesh = obj.data
    for vert in mesh.vertices:
        vert.co.x += rng.uniform(-amount, amount)
        vert.co.y += rng.uniform(-amount, amount)
        vert.co.z += rng.uniform(-amount, amount) * 0.5  # Less vertical


def export_glb(filepath):
    """Export all visible objects as a single GLB file."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_materials='EXPORT',
    )
    size = os.path.getsize(filepath)
    return size


def log(msg):
    """Print a timestamped log message."""
    print(f"[PoC-Assets] {msg}")


# ---------------------------------------------------------------------------
# Unit Generators
# ---------------------------------------------------------------------------

def create_worker(faction_key):
    """
    Generate a worker unit: simple humanoid with pitchfork.
    Target: 80-100 vertices.
    Height: ~1.0m
    """
    clear_scene()
    fc = FACTION_COLORS[faction_key]
    parts = []

    # --- Materials ---
    mat_skin = create_material(f"skin_{faction_key}", COLORS["skin"])
    mat_cloth = create_material(f"cloth_{faction_key}", fc["primary"])
    mat_wood = create_material(f"wood_{faction_key}", COLORS["brown"])
    mat_metal = create_material(f"metal_{faction_key}", COLORS["mid_grey"], metallic=0.6, roughness=0.4)

    # --- Body (torso) ---
    body = add_cube(size=(0.25, 0.15, 0.35), location=(0, 0, 0.55))
    assign_material(body, mat_cloth)
    parts.append(body)

    # --- Head ---
    head = add_uv_sphere(radius=0.12, segments=8, ring_count=6, location=(0, 0, 0.85))
    assign_material(head, mat_skin)
    parts.append(head)

    # --- Legs (2 cylinders) ---
    for x_off in [-0.07, 0.07]:
        leg = add_cylinder(radius=0.05, depth=0.35, vertices=6, location=(x_off, 0, 0.2))
        assign_material(leg, mat_cloth)
        parts.append(leg)

    # --- Feet (2 cubes) ---
    for x_off in [-0.07, 0.07]:
        foot = add_cube(size=(0.06, 0.10, 0.04), location=(x_off, 0.03, 0.02))
        assign_material(foot, COLORS["dark_brown"])
        parts.append(foot)

    # --- Arms (2 cylinders) ---
    for x_off in [-0.17, 0.17]:
        arm = add_cylinder(radius=0.04, depth=0.30, vertices=6, location=(x_off, 0, 0.58))
        assign_material(arm, mat_skin)
        parts.append(arm)

    # --- Pitchfork (right hand) ---
    # Handle
    handle = add_cylinder(radius=0.015, depth=0.7, vertices=6, location=(0.20, 0, 0.70))
    assign_material(handle, mat_wood)
    parts.append(handle)

    # Fork head (horizontal bar)
    fork_bar = add_cube(size=(0.02, 0.12, 0.02), location=(0.20, 0, 1.06))
    assign_material(fork_bar, mat_metal)
    parts.append(fork_bar)

    # Fork tines (3 prongs)
    for y_off in [-0.05, 0.0, 0.05]:
        tine = add_cylinder(radius=0.008, depth=0.12, vertices=4,
                            location=(0.20, y_off, 1.13))
        assign_material(tine, mat_metal)
        parts.append(tine)

    # --- Join all ---
    result = join_objects(parts, name=f"Worker_{faction_key}")
    result.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    # Move origin to bottom
    bbox = [Vector(corner) for corner in result.bound_box]
    min_z = min(v.z for v in bbox)
    result.location.z -= min_z

    return result


def create_infantry(faction_key):
    """
    Generate an infantry unit: humanoid with sword and shield.
    Target: 100-130 vertices.
    Height: ~1.1m
    """
    clear_scene()
    fc = FACTION_COLORS[faction_key]
    parts = []

    mat_skin = create_material(f"skin_{faction_key}", COLORS["skin"])
    mat_cloth = create_material(f"cloth_{faction_key}", fc["primary"])
    mat_accent = create_material(f"accent_{faction_key}", fc["accent"])
    mat_metal = create_material(f"metal_{faction_key}", COLORS["dark_grey"], metallic=0.8, roughness=0.3)
    mat_wood = create_material(f"wood_{faction_key}", COLORS["brown"])

    # --- Body (torso, slightly wider for armor look) ---
    body = add_cube(size=(0.30, 0.18, 0.38), location=(0, 0, 0.60))
    assign_material(body, mat_cloth)
    parts.append(body)

    # --- Shoulder pads ---
    for x_off in [-0.18, 0.18]:
        pad = add_uv_sphere(radius=0.06, segments=6, ring_count=4,
                            location=(x_off, 0, 0.78))
        assign_material(pad, mat_metal)
        parts.append(pad)

    # --- Head ---
    head = add_uv_sphere(radius=0.12, segments=8, ring_count=6, location=(0, 0, 0.92))
    assign_material(head, mat_skin)
    parts.append(head)

    # --- Helmet (half sphere on top) ---
    helmet = add_uv_sphere(radius=0.13, segments=8, ring_count=4, location=(0, 0, 0.96))
    # Cut bottom half by scaling z
    helmet.scale.z = 0.6
    bpy.ops.object.transform_apply(scale=True)
    assign_material(helmet, mat_metal)
    parts.append(helmet)

    # --- Legs ---
    for x_off in [-0.08, 0.08]:
        leg = add_cylinder(radius=0.055, depth=0.38, vertices=6, location=(x_off, 0, 0.22))
        assign_material(leg, mat_cloth)
        parts.append(leg)

    # --- Feet ---
    for x_off in [-0.08, 0.08]:
        foot = add_cube(size=(0.07, 0.11, 0.05), location=(x_off, 0.03, 0.025))
        assign_material(foot, COLORS["dark_brown"])
        parts.append(foot)

    # --- Arms ---
    # Right arm (sword arm)
    r_arm = add_cylinder(radius=0.045, depth=0.32, vertices=6, location=(0.20, 0, 0.62))
    assign_material(r_arm, mat_skin)
    parts.append(r_arm)

    # Left arm (shield arm)
    l_arm = add_cylinder(radius=0.045, depth=0.32, vertices=6, location=(-0.20, 0, 0.62))
    assign_material(l_arm, mat_skin)
    parts.append(l_arm)

    # --- Sword (right hand) ---
    # Blade
    blade = add_cube(size=(0.03, 0.02, 0.45), location=(0.22, 0, 0.70))
    assign_material(blade, mat_metal)
    parts.append(blade)

    # Hilt
    hilt = add_cube(size=(0.02, 0.08, 0.02), location=(0.22, 0, 0.47))
    assign_material(hilt, mat_wood)
    parts.append(hilt)

    # Guard (crosspiece)
    guard = add_cube(size=(0.01, 0.10, 0.02), location=(0.22, 0, 0.49))
    assign_material(guard, mat_metal)
    parts.append(guard)

    # --- Shield (left side) ---
    shield = add_cube(size=(0.03, 0.22, 0.28), location=(-0.24, 0, 0.60))
    assign_material(shield, mat_accent)
    parts.append(shield)

    # Shield boss (center bump)
    boss = add_uv_sphere(radius=0.04, segments=6, ring_count=4, location=(-0.27, 0, 0.60))
    assign_material(boss, mat_metal)
    parts.append(boss)

    # --- Belt ---
    belt = add_cube(size=(0.31, 0.19, 0.03), location=(0, 0, 0.42))
    assign_material(belt, COLORS["dark_brown"])
    parts.append(belt)

    # --- Join all ---
    result = join_objects(parts, name=f"Infantry_{faction_key}")
    result.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [Vector(corner) for corner in result.bound_box]
    min_z = min(v.z for v in bbox)
    result.location.z -= min_z

    return result


def create_ranged(faction_key):
    """
    Generate a ranged unit: humanoid with bow and quiver.
    Target: 90-120 vertices.
    Height: ~1.0m
    """
    clear_scene()
    fc = FACTION_COLORS[faction_key]
    parts = []

    mat_skin = create_material(f"skin_{faction_key}", COLORS["skin"])
    mat_cloth = create_material(f"cloth_{faction_key}", fc["primary"])
    mat_wood = create_material(f"wood_{faction_key}", COLORS["brown"])
    mat_string = create_material(f"string_{faction_key}", COLORS["light_grey"])
    mat_dark = create_material(f"dark_{faction_key}", COLORS["dark_brown"])

    # --- Body (slimmer than infantry) ---
    body = add_cube(size=(0.22, 0.14, 0.34), location=(0, 0, 0.55))
    assign_material(body, mat_cloth)
    parts.append(body)

    # --- Head ---
    head = add_uv_sphere(radius=0.11, segments=8, ring_count=6, location=(0, 0, 0.83))
    assign_material(head, mat_skin)
    parts.append(head)

    # --- Hood/Cape (cone on head) ---
    hood = add_cone(radius1=0.14, radius2=0.0, depth=0.18, vertices=8,
                    location=(0, 0, 0.95))
    assign_material(hood, mat_cloth)
    parts.append(hood)

    # --- Legs ---
    for x_off in [-0.06, 0.06]:
        leg = add_cylinder(radius=0.045, depth=0.35, vertices=6, location=(x_off, 0, 0.20))
        assign_material(leg, mat_cloth)
        parts.append(leg)

    # --- Feet ---
    for x_off in [-0.06, 0.06]:
        foot = add_cube(size=(0.055, 0.09, 0.04), location=(x_off, 0.02, 0.02))
        assign_material(foot, mat_dark)
        parts.append(foot)

    # --- Arms ---
    for x_off in [-0.15, 0.15]:
        arm = add_cylinder(radius=0.035, depth=0.28, vertices=6, location=(x_off, 0, 0.55))
        assign_material(arm, mat_skin)
        parts.append(arm)

    # --- Bow (left side, curved shape using 2 angled cylinders + string) ---
    # Upper limb
    bow_upper = add_cylinder(radius=0.012, depth=0.25, vertices=4,
                             location=(-0.20, -0.05, 0.68))
    bow_upper.rotation_euler = (0.3, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(bow_upper, mat_wood)
    parts.append(bow_upper)

    # Lower limb
    bow_lower = add_cylinder(radius=0.012, depth=0.25, vertices=4,
                             location=(-0.20, -0.05, 0.42))
    bow_lower.rotation_euler = (-0.3, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(bow_lower, mat_wood)
    parts.append(bow_lower)

    # Bow grip (center)
    bow_grip = add_cylinder(radius=0.018, depth=0.06, vertices=4,
                            location=(-0.20, -0.05, 0.55))
    assign_material(bow_grip, mat_dark)
    parts.append(bow_grip)

    # Bowstring (thin cylinder connecting tips)
    string = add_cylinder(radius=0.004, depth=0.48, vertices=4,
                          location=(-0.20, -0.02, 0.55))
    assign_material(string, mat_string)
    parts.append(string)

    # --- Quiver (on back) ---
    quiver = add_cylinder(radius=0.04, depth=0.30, vertices=6,
                          location=(0.05, 0.10, 0.60))
    quiver.rotation_euler = (0.15, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(quiver, mat_dark)
    parts.append(quiver)

    # Arrow tips sticking out of quiver
    for y_off in [-0.02, 0.0, 0.02]:
        tip = add_cone(radius1=0.01, radius2=0.0, depth=0.04, vertices=4,
                       location=(0.05, 0.08 + y_off, 0.78))
        assign_material(tip, COLORS["mid_grey"])
        parts.append(tip)

    # --- Join all ---
    result = join_objects(parts, name=f"Ranged_{faction_key}")
    result.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [Vector(corner) for corner in result.bound_box]
    min_z = min(v.z for v in bbox)
    result.location.z -= min_z

    return result


# ---------------------------------------------------------------------------
# Building Generators
# ---------------------------------------------------------------------------

def create_townhall(faction_key):
    """
    Generate a Town Hall: large farm-like structure.
    Target: 200-300 vertices.
    Dimensions: ~4m x 4m x 3.5m
    """
    clear_scene()
    fc = FACTION_COLORS[faction_key]
    parts = []

    mat_wall = create_material(f"wall_{faction_key}", COLORS["cream"])
    mat_faction = create_material(f"faction_{faction_key}", fc["primary"])
    mat_roof = create_material(f"roof_{faction_key}", COLORS["dark_brown"])
    mat_wood = create_material(f"wood_{faction_key}", COLORS["brown"])
    mat_chimney = create_material(f"chimney_{faction_key}", COLORS["dark_grey"])
    mat_window = create_material(f"window_{faction_key}", COLORS["warm_yellow"],
                                  emission_strength=0.5)
    mat_door = create_material(f"door_{faction_key}", COLORS["dark_brown"])

    # --- Main structure (base walls) ---
    base = add_cube(size=(4.0, 3.5, 2.0), location=(0, 0, 1.0))
    assign_material(base, mat_wall)
    parts.append(base)

    # --- Faction colored band around the base ---
    band = add_cube(size=(4.1, 3.6, 0.15), location=(0, 0, 2.05))
    assign_material(band, mat_faction)
    parts.append(band)

    # --- Roof (pyramid-like, 4-sided) ---
    roof = add_cone(radius1=2.8, radius2=0.1, depth=1.8, vertices=4,
                    location=(0, 0, 2.9))
    roof.rotation_euler = (0, 0, math.pi / 4)  # Align with square base
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(roof, mat_roof)
    parts.append(roof)

    # --- Chimney ---
    chimney = add_cube(size=(0.35, 0.35, 1.2), location=(1.2, 0.8, 2.8))
    assign_material(chimney, mat_chimney)
    parts.append(chimney)

    # Chimney cap
    cap = add_cube(size=(0.45, 0.45, 0.08), location=(1.2, 0.8, 3.42))
    assign_material(cap, mat_chimney)
    parts.append(cap)

    # --- Door (front face, dark rectangle) ---
    door = add_cube(size=(0.6, 0.05, 0.9), location=(0, -1.78, 0.45))
    assign_material(door, mat_door)
    parts.append(door)

    # Door frame
    for x_off in [-0.35, 0.35]:
        frame = add_cube(size=(0.06, 0.06, 1.0), location=(x_off, -1.78, 0.50))
        assign_material(frame, mat_wood)
        parts.append(frame)

    # Door lintel
    lintel = add_cube(size=(0.76, 0.06, 0.06), location=(0, -1.78, 0.96))
    assign_material(lintel, mat_wood)
    parts.append(lintel)

    # --- Windows (front face, 2 windows) ---
    for x_off in [-1.1, 1.1]:
        win = add_cube(size=(0.35, 0.05, 0.30), location=(x_off, -1.78, 1.2))
        assign_material(win, mat_window)
        parts.append(win)

    # Window frames
    for x_off in [-1.1, 1.1]:
        # Horizontal bars
        for z in [1.05, 1.35]:
            bar = add_cube(size=(0.40, 0.04, 0.03), location=(x_off, -1.80, z))
            assign_material(bar, mat_wood)
            parts.append(bar)
        # Vertical bars
        for dx in [-0.18, 0.18]:
            bar = add_cube(size=(0.03, 0.04, 0.34), location=(x_off + dx, -1.80, 1.2))
            assign_material(bar, mat_wood)
            parts.append(bar)

    # --- Side windows ---
    for y_off in [-0.6, 0.6]:
        win = add_cube(size=(0.05, 0.30, 0.30), location=(2.02, y_off, 1.2))
        assign_material(win, mat_window)
        parts.append(win)

    # --- Wooden beams (half-timber look, front) ---
    # Vertical beams
    for x_off in [-2.0, -0.6, 0.6, 2.0]:
        beam = add_cube(size=(0.08, 0.05, 2.0), location=(x_off, -1.78, 1.0))
        assign_material(beam, mat_wood)
        parts.append(beam)

    # Horizontal beam
    h_beam = add_cube(size=(4.1, 0.05, 0.08), location=(0, -1.78, 1.5))
    assign_material(h_beam, mat_wood)
    parts.append(h_beam)

    # --- Foundation step ---
    step = add_cube(size=(4.3, 3.8, 0.1), location=(0, 0, 0.05))
    assign_material(step, COLORS["mid_grey"])
    parts.append(step)

    # --- Faction banner (small flag on roof) ---
    pole = add_cylinder(radius=0.02, depth=0.6, vertices=4, location=(0, 0, 3.8))
    assign_material(pole, mat_wood)
    parts.append(pole)

    flag = add_cube(size=(0.25, 0.02, 0.15), location=(0.13, 0, 4.02))
    assign_material(flag, mat_faction)
    parts.append(flag)

    # --- Join all ---
    result = join_objects(parts, name=f"TownHall_{faction_key}")
    result.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [Vector(corner) for corner in result.bound_box]
    min_z = min(v.z for v in bbox)
    result.location.z -= min_z

    return result


def create_barracks(faction_key):
    """
    Generate a Barracks: military training building.
    Target: 150-200 vertices.
    Dimensions: ~3m x 2.5m x 2.5m
    """
    clear_scene()
    fc = FACTION_COLORS[faction_key]
    parts = []

    mat_wall = create_material(f"wall_{faction_key}", COLORS["beige"])
    mat_faction = create_material(f"faction_{faction_key}", fc["primary"])
    mat_roof = create_material(f"roof_{faction_key}", COLORS["dark_brown"])
    mat_wood = create_material(f"wood_{faction_key}", COLORS["brown"])
    mat_metal = create_material(f"metal_{faction_key}", COLORS["dark_grey"],
                                 metallic=0.7, roughness=0.35)
    mat_door = create_material(f"door_{faction_key}", COLORS["dark_brown"])

    # --- Main structure ---
    base = add_cube(size=(3.0, 2.5, 1.8), location=(0, 0, 0.9))
    assign_material(base, mat_wall)
    parts.append(base)

    # --- Faction band ---
    band = add_cube(size=(3.1, 2.6, 0.1), location=(0, 0, 1.85))
    assign_material(band, mat_faction)
    parts.append(band)

    # --- Roof (lower pitch than town hall, 2-sided gable) ---
    # Left slope
    roof_l = add_cube(size=(3.1, 1.5, 0.08), location=(0, -0.55, 2.25))
    roof_l.rotation_euler = (0.45, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(roof_l, mat_roof)
    parts.append(roof_l)

    # Right slope
    roof_r = add_cube(size=(3.1, 1.5, 0.08), location=(0, 0.55, 2.25))
    roof_r.rotation_euler = (-0.45, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(roof_r, mat_roof)
    parts.append(roof_r)

    # Ridge
    ridge = add_cube(size=(3.2, 0.10, 0.10), location=(0, 0, 2.52))
    assign_material(ridge, mat_wood)
    parts.append(ridge)

    # --- Open doorway (front) ---
    door_frame_l = add_cube(size=(0.08, 0.08, 1.2), location=(-0.45, -1.27, 0.60))
    assign_material(door_frame_l, mat_wood)
    parts.append(door_frame_l)

    door_frame_r = add_cube(size=(0.08, 0.08, 1.2), location=(0.45, -1.27, 0.60))
    assign_material(door_frame_r, mat_wood)
    parts.append(door_frame_r)

    door_lintel = add_cube(size=(0.98, 0.08, 0.08), location=(0, -1.27, 1.22))
    assign_material(door_lintel, mat_wood)
    parts.append(door_lintel)

    # Door interior (dark to suggest open)
    door_bg = add_cube(size=(0.80, 0.03, 1.10), location=(0, -1.24, 0.55))
    assign_material(door_bg, mat_door)
    parts.append(door_bg)

    # --- Weapon rack on front wall (2 crossed swords) ---
    for angle in [0.4, -0.4]:
        sword = add_cube(size=(0.04, 0.03, 0.50), location=(1.0, -1.27, 1.2))
        sword.rotation_euler = (0, angle, 0)
        bpy.ops.object.transform_apply(rotation=True)
        assign_material(sword, mat_metal)
        parts.append(sword)

    # Shield on wall
    wall_shield = add_uv_sphere(radius=0.15, segments=8, ring_count=4,
                                 location=(1.0, -1.27, 0.8))
    wall_shield.scale.y = 0.3
    bpy.ops.object.transform_apply(scale=True)
    assign_material(wall_shield, mat_faction)
    parts.append(wall_shield)

    # --- Training dummy (to the right of building) ---
    # Vertical pole
    dummy_pole = add_cylinder(radius=0.04, depth=1.2, vertices=6,
                              location=(2.0, 0, 0.60))
    assign_material(dummy_pole, mat_wood)
    parts.append(dummy_pole)

    # Horizontal arm
    dummy_arm = add_cylinder(radius=0.03, depth=0.6, vertices=6,
                             location=(2.0, 0, 0.90))
    dummy_arm.rotation_euler = (0, 0, math.pi / 2)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(dummy_arm, mat_wood)
    parts.append(dummy_arm)

    # Dummy head (sphere)
    dummy_head = add_uv_sphere(radius=0.08, segments=6, ring_count=4,
                                location=(2.0, 0, 1.28))
    assign_material(dummy_head, COLORS["light_brown"])
    parts.append(dummy_head)

    # --- Foundation ---
    foundation = add_cube(size=(3.2, 2.7, 0.08), location=(0, 0, 0.04))
    assign_material(foundation, COLORS["mid_grey"])
    parts.append(foundation)

    # --- Join all ---
    result = join_objects(parts, name=f"Barracks_{faction_key}")
    result.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [Vector(corner) for corner in result.bound_box]
    min_z = min(v.z for v in bbox)
    result.location.z -= min_z

    return result


# ---------------------------------------------------------------------------
# Resource Generators
# ---------------------------------------------------------------------------

def create_gold_mine():
    """
    Generate a Gold Mine: rocky mound with gold veins.
    Target: 50-80 vertices.
    Dimensions: ~2m x 2m x 1.5m
    """
    clear_scene()
    parts = []

    mat_rock = create_material("rock_base", COLORS["dark_grey"], roughness=0.9)
    mat_gold = create_material("gold_vein", COLORS["gold"], metallic=0.8, roughness=0.3)
    mat_gold_bright = create_material("gold_bright", COLORS["gold_bright"],
                                       metallic=0.9, roughness=0.2, emission_strength=0.3)
    mat_entrance = create_material("entrance", (0.05, 0.03, 0.02, 1.0))

    # --- Main rock body ---
    rock = add_ico_sphere(radius=1.0, subdivisions=2, location=(0, 0, 0.6))
    rock.scale = (1.0, 0.9, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    deform_mesh_random(rock, amount=0.15, seed=123)
    assign_material(rock, mat_rock)
    parts.append(rock)

    # --- Gold veins (smaller spheres embedded in rock) ---
    gold_positions = [
        (0.4, 0.3, 0.8), (-0.3, -0.5, 0.7), (0.6, -0.2, 0.5),
        (-0.5, 0.4, 0.6), (0.1, 0.6, 0.9),
    ]
    for pos in gold_positions:
        vein = add_ico_sphere(radius=0.12, subdivisions=1, location=pos)
        deform_mesh_random(vein, amount=0.03, seed=int(pos[0] * 100))
        assign_material(vein, mat_gold)
        parts.append(vein)

    # --- Bright gold nugget on top ---
    nugget = add_ico_sphere(radius=0.15, subdivisions=1, location=(0.1, -0.1, 1.15))
    deform_mesh_random(nugget, amount=0.04, seed=456)
    assign_material(nugget, mat_gold_bright)
    parts.append(nugget)

    # --- Mine entrance (dark arch on front) ---
    entrance = add_cube(size=(0.5, 0.15, 0.6), location=(0, -0.85, 0.30))
    assign_material(entrance, mat_entrance)
    parts.append(entrance)

    # Entrance arch top
    arch = add_cylinder(radius=0.25, depth=0.15, vertices=8, location=(0, -0.85, 0.60))
    arch.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    arch.scale.z = 0.5
    bpy.ops.object.transform_apply(scale=True)
    assign_material(arch, mat_entrance)
    parts.append(arch)

    # --- Wooden support beams at entrance ---
    for x_off in [-0.25, 0.25]:
        beam = add_cube(size=(0.06, 0.06, 0.65), location=(x_off, -0.88, 0.32))
        assign_material(beam, COLORS["brown"])
        parts.append(beam)

    beam_top = add_cube(size=(0.56, 0.06, 0.06), location=(0, -0.88, 0.65))
    assign_material(beam_top, COLORS["brown"])
    parts.append(beam_top)

    # --- Join all ---
    result = join_objects(parts, name="GoldMine")
    result.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [Vector(corner) for corner in result.bound_box]
    min_z = min(v.z for v in bbox)
    result.location.z -= min_z

    return result


# ---------------------------------------------------------------------------
# Prop Generators
# ---------------------------------------------------------------------------

def create_tree(variant=0):
    """
    Generate a tree: trunk cylinder + foliage shape.
    3 variants via seed, each with different proportions.
    Target: 30-60 vertices.
    Height: 2.0-3.0m
    """
    clear_scene()

    rng = random.Random(variant * 137 + 42)

    # Variant parameters
    trunk_height = 0.6 + rng.random() * 0.4
    trunk_radius = 0.06 + rng.random() * 0.04
    foliage_height = 1.2 + rng.random() * 0.8
    foliage_radius = 0.5 + rng.random() * 0.3

    greens = [COLORS["green_dark"], COLORS["green_mid"], COLORS["green_light"]]
    green = greens[variant % 3]

    mat_trunk = create_material(f"trunk_v{variant}", COLORS["brown"])
    mat_foliage = create_material(f"foliage_v{variant}", green)

    parts = []

    # --- Trunk ---
    trunk = add_cylinder(radius=trunk_radius, depth=trunk_height, vertices=6,
                         location=(0, 0, trunk_height / 2))
    assign_material(trunk, mat_trunk)
    parts.append(trunk)

    foliage_center_z = trunk_height + foliage_height * 0.4

    if variant == 0:
        # Cone-shaped foliage
        foliage = add_cone(radius1=foliage_radius, radius2=0.0, depth=foliage_height,
                           vertices=8, location=(0, 0, foliage_center_z))
        assign_material(foliage, mat_foliage)
        parts.append(foliage)
    elif variant == 1:
        # Sphere-shaped foliage
        foliage = add_ico_sphere(radius=foliage_radius, subdivisions=2,
                                  location=(0, 0, foliage_center_z))
        foliage.scale.z = foliage_height / (foliage_radius * 2)
        bpy.ops.object.transform_apply(scale=True)
        deform_mesh_random(foliage, amount=0.08, seed=variant)
        assign_material(foliage, mat_foliage)
        parts.append(foliage)
    else:
        # Double-cone (stacked: larger bottom, smaller top)
        lower = add_cone(radius1=foliage_radius, radius2=foliage_radius * 0.6,
                         depth=foliage_height * 0.5, vertices=8,
                         location=(0, 0, trunk_height + foliage_height * 0.25))
        assign_material(lower, mat_foliage)
        parts.append(lower)

        upper = add_cone(radius1=foliage_radius * 0.6, radius2=0.0,
                         depth=foliage_height * 0.5, vertices=8,
                         location=(0, 0, trunk_height + foliage_height * 0.65))
        assign_material(upper, mat_foliage)
        parts.append(upper)

    # --- Join all ---
    result = join_objects(parts, name=f"Tree_v{variant}")
    result.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [Vector(corner) for corner in result.bound_box]
    min_z = min(v.z for v in bbox)
    result.location.z -= min_z

    return result


def create_rock(variant=0):
    """
    Generate a rock: deformed icosphere.
    3 variants via seed.
    Target: 12-20 vertices.
    Height: 0.3-0.8m
    """
    clear_scene()

    rng = random.Random(variant * 257 + 99)

    scale_base = 0.3 + rng.random() * 0.5
    grey_value = 0.4 + rng.random() * 0.2
    color = (grey_value, grey_value, grey_value + 0.02, 1.0)

    mat_rock = create_material(f"rock_v{variant}", color, roughness=0.95)

    rock = add_ico_sphere(radius=scale_base, subdivisions=1, location=(0, 0, scale_base * 0.6))
    # Flatten slightly
    rock.scale.z = 0.5 + rng.random() * 0.3
    rock.scale.x = 0.8 + rng.random() * 0.4
    bpy.ops.object.transform_apply(scale=True)
    deform_mesh_random(rock, amount=scale_base * 0.2, seed=variant * 31)
    assign_material(rock, mat_rock)

    rock.name = f"Rock_v{variant}"
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [Vector(corner) for corner in rock.bound_box]
    min_z = min(v.z for v in bbox)
    rock.location.z -= min_z

    return rock


# ---------------------------------------------------------------------------
# Gameplay Element Generators
# ---------------------------------------------------------------------------

def create_selection_circle():
    """
    Generate a selection circle: flat green torus.
    Target: ~64 vertices.
    Radius: 0.6m
    """
    clear_scene()

    mat_sel = create_material("selection", COLORS["selection"], emission_strength=1.0)

    circle = add_torus(major_radius=0.6, minor_radius=0.02,
                       major_segments=32, minor_segments=4,
                       location=(0, 0, 0.01))
    # Flatten to nearly 2D
    circle.scale.z = 0.3
    bpy.ops.object.transform_apply(scale=True)
    assign_material(circle, mat_sel)

    circle.name = "SelectionCircle"
    return circle


def create_arrow():
    """
    Generate an arrow projectile: shaft + point + fletching.
    Target: ~20 vertices.
    Length: 0.5m, aligned along +Y axis (forward).
    """
    clear_scene()
    parts = []

    mat_shaft = create_material("arrow_shaft", COLORS["brown"])
    mat_point = create_material("arrow_point", COLORS["dark_grey"], metallic=0.7, roughness=0.3)
    mat_fletch = create_material("arrow_fletch", COLORS["white"])

    # --- Shaft (along Y-axis) ---
    shaft = add_cylinder(radius=0.008, depth=0.45, vertices=4, location=(0, 0, 0))
    shaft.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(shaft, mat_shaft)
    parts.append(shaft)

    # --- Arrowhead (cone, pointing +Y) ---
    head = add_cone(radius1=0.02, radius2=0.0, depth=0.06, vertices=4,
                    location=(0, 0.255, 0))
    head.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(head, mat_point)
    parts.append(head)

    # --- Fletching (3 small fins at the back) ---
    for angle in [0, 2.094, 4.189]:  # 0, 120, 240 degrees
        fin = add_cube(size=(0.025, 0.06, 0.003), location=(0, -0.20, 0))
        fin.rotation_euler = (0, angle, 0)
        bpy.ops.object.transform_apply(rotation=True)
        assign_material(fin, mat_fletch)
        parts.append(fin)

    # --- Join all ---
    result = join_objects(parts, name="Arrow")
    result.location = (0, 0, 0)
    # Center origin
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

    return result


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------

def parse_args():
    """Parse command-line arguments after '--'."""
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    output_dir = "./assets/models/poc/"

    i = 0
    while i < len(argv):
        if argv[i] == "--output" and i + 1 < len(argv):
            output_dir = argv[i + 1]
            i += 2
        else:
            i += 1

    return output_dir


def main():
    """Generate all PoC assets and export as GLB."""
    output_dir = parse_args()
    output_dir = os.path.abspath(output_dir)

    log("=" * 60)
    log("Reign of Brabant -- PoC Asset Generator")
    log(f"Output directory: {output_dir}")
    log(f"Blender version: {bpy.app.version_string}")
    log("=" * 60)

    total_start = time.time()
    results = []

    # Define all assets to generate
    assets = []

    # --- Units (2 factions x 3 unit types = 6 GLBs) ---
    for faction in ["orange", "blue"]:
        assets.append({
            "name": f"worker_{faction}",
            "category": "units",
            "generator": lambda f=faction: create_worker(f),
        })
        assets.append({
            "name": f"infantry_{faction}",
            "category": "units",
            "generator": lambda f=faction: create_infantry(f),
        })
        assets.append({
            "name": f"ranged_{faction}",
            "category": "units",
            "generator": lambda f=faction: create_ranged(f),
        })

    # --- Buildings (2 factions x 2 building types = 4 GLBs) ---
    for faction in ["orange", "blue"]:
        assets.append({
            "name": f"townhall_{faction}",
            "category": "buildings",
            "generator": lambda f=faction: create_townhall(f),
        })
        assets.append({
            "name": f"barracks_{faction}",
            "category": "buildings",
            "generator": lambda f=faction: create_barracks(f),
        })

    # --- Resources (1 GLB) ---
    assets.append({
        "name": "gold_mine",
        "category": "resources",
        "generator": create_gold_mine,
    })

    # --- Props (3 trees + 3 rocks = 6 GLBs) ---
    for v in range(3):
        assets.append({
            "name": f"tree_variant_{v}",
            "category": "props",
            "generator": lambda variant=v: create_tree(variant),
        })
    for v in range(3):
        assets.append({
            "name": f"rock_variant_{v}",
            "category": "props",
            "generator": lambda variant=v: create_rock(variant),
        })

    # --- Gameplay elements (2 GLBs) ---
    assets.append({
        "name": "selection_circle",
        "category": "gameplay",
        "generator": create_selection_circle,
    })
    assets.append({
        "name": "arrow",
        "category": "gameplay",
        "generator": create_arrow,
    })

    # --- Generate and export each asset ---
    for i, asset in enumerate(assets):
        asset_start = time.time()
        name = asset["name"]
        category = asset["category"]
        filepath = os.path.join(output_dir, category, f"{name}.glb")

        log(f"[{i+1}/{len(assets)}] Generating {name}...")

        # Generate
        asset["generator"]()

        # Count vertices
        vert_count = 0
        for obj in bpy.context.scene.objects:
            if obj.type == 'MESH':
                vert_count += len(obj.data.vertices)

        # Export
        file_size = export_glb(filepath)
        elapsed = (time.time() - asset_start) * 1000

        result = {
            "name": name,
            "category": category,
            "file": filepath,
            "vertices": vert_count,
            "size_kb": file_size / 1024,
            "time_ms": elapsed,
        }
        results.append(result)

        log(f"  -> {filepath}")
        log(f"     Vertices: {vert_count}, Size: {file_size/1024:.1f} KB, Time: {elapsed:.0f}ms")

    # --- Summary ---
    total_elapsed = time.time() - total_start
    total_verts = sum(r["vertices"] for r in results)
    total_size = sum(r["size_kb"] for r in results)

    log("")
    log("=" * 60)
    log("GENERATION COMPLETE")
    log("=" * 60)
    log(f"Total assets: {len(results)}")
    log(f"Total vertices: {total_verts}")
    log(f"Total size: {total_size:.1f} KB")
    log(f"Total time: {total_elapsed:.2f}s")
    log("")

    # Breakdown by category
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"count": 0, "verts": 0, "size": 0.0}
        categories[cat]["count"] += 1
        categories[cat]["verts"] += r["vertices"]
        categories[cat]["size"] += r["size_kb"]

    log("Breakdown by category:")
    log(f"{'Category':<15} {'Count':>5} {'Vertices':>10} {'Size (KB)':>10}")
    log("-" * 45)
    for cat, data in sorted(categories.items()):
        log(f"{cat:<15} {data['count']:>5} {data['verts']:>10} {data['size']:>10.1f}")

    log("")
    log("All files:")
    for r in results:
        log(f"  {r['category']}/{r['name']}.glb  ({r['vertices']} verts, {r['size_kb']:.1f} KB)")

    log("")
    log("Done. Assets ready for Three.js import.")


if __name__ == "__main__":
    main()
