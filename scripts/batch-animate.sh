#!/usr/bin/env bash
#
# batch-animate.sh — Batch animation pipeline for Reign of Brabant unit models.
#
# Runs the appropriate Blender animation scripts based on unit category,
# processing a single model or all models for a faction.
#
# Usage:
#   bash scripts/batch-animate.sh <category> <input.glb> [output.glb]
#   bash scripts/batch-animate.sh <category> --faction <faction_name>
#   bash scripts/batch-animate.sh --all --faction <faction_name>
#   bash scripts/batch-animate.sh --rig-and-animate <category> <input.glb> [output.glb]
#
# Categories:
#   melee    — Idle, Walk, Attack (sword swing), Death  [base rig script]
#   ranged   — Idle, Walk, Attack + RangedAttack, Death
#   worker   — Idle, Walk, Attack, Gather, Build, Death
#   healer   — Idle, Walk, Attack, Heal, Death
#   heavy    — Idle, Walk, Attack + HeavyAttack, Death
#   siege    — Idle + SiegeIdle, Walk, Attack + SiegeAttack, Death
#   hero     — Idle, Walk, Attack, HeavyAttack, Heal, Death (all combat anims)
#
# Examples:
#   # Add ranged attack to a single already-rigged model
#   bash scripts/batch-animate.sh ranged assets/models/v03/brabanders/ranged.glb
#
#   # Full rig + animate pipeline for a worker model (static -> animated)
#   bash scripts/batch-animate.sh --rig-and-animate worker assets/models/v02/brabanders/worker.glb assets/models/v03/brabanders/worker.glb
#
#   # Process all ranged units for brabanders faction
#   bash scripts/batch-animate.sh ranged --faction brabanders
#
#   # Process ALL unit types for a faction (auto-detects category per unit type)
#   bash scripts/batch-animate.sh --all --faction brabanders

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Blender path — prefer system Blender, fall back to Applications
BLENDER="${BLENDER:-$(command -v blender 2>/dev/null || echo "/Applications/Blender.app/Contents/MacOS/Blender")}"

# Validate Blender exists
if [ ! -x "$BLENDER" ]; then
    echo "ERROR: Blender not found. Set BLENDER env var or install Blender."
    echo "  brew install --cask blender"
    exit 1
fi

# Animation script paths
RIG_SCRIPT="$SCRIPT_DIR/blender-rig-and-animate.py"
RANGED_SCRIPT="$SCRIPT_DIR/blender-anim-ranged.py"
WORKER_SCRIPT="$SCRIPT_DIR/blender-anim-worker-gather.py"
HEALER_SCRIPT="$SCRIPT_DIR/blender-anim-healer.py"
HEAVY_SCRIPT="$SCRIPT_DIR/blender-anim-heavy.py"
SIEGE_SCRIPT="$SCRIPT_DIR/blender-anim-siege.py"

# v02 (static) and v03 (animated) model directories
V02_DIR="$PROJECT_DIR/assets/models/v02"
V03_DIR="$PROJECT_DIR/assets/models/v03"

FACTIONS=(brabanders randstad limburgers belgen)

# Unit type -> category mapping
declare -A UNIT_CATEGORY_MAP
UNIT_CATEGORY_MAP[worker]=worker
UNIT_CATEGORY_MAP[infantry]=melee
UNIT_CATEGORY_MAP[ranged]=ranged
# Future types (not yet modeled):
UNIT_CATEGORY_MAP[heavy]=heavy
UNIT_CATEGORY_MAP[siege]=siege
UNIT_CATEGORY_MAP[support]=healer
UNIT_CATEGORY_MAP[hero]=hero

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

usage() {
    echo "Usage:"
    echo "  $0 <category> <input.glb> [output.glb]"
    echo "  $0 <category> --faction <faction_name>"
    echo "  $0 --all --faction <faction_name>"
    echo "  $0 --rig-and-animate <category> <input.glb> [output.glb]"
    echo ""
    echo "Categories: melee, ranged, worker, healer, heavy, siege, hero"
    echo "Factions: brabanders, randstad, limburgers, belgen"
    exit 1
}

run_blender() {
    local script="$1"
    local input="$2"
    local output="$3"
    local script_name
    script_name="$(basename "$script" .py)"

    echo "  [BLENDER] $script_name: $input -> $output"
    "$BLENDER" --background --python "$script" -- "$input" "$output" 2>&1 | \
        grep -E "^(Found|Bounds|Armature|Manual|Rigid|Creating|Created|Exported|Animations|DONE|ERROR)" || true
}

# Run the base rig script (creates Idle, Walk, Attack, Death)
rig_base() {
    local input="$1"
    local output="$2"
    echo "[STEP 1/N] Base rig + animations (Idle, Walk, Attack, Death)"
    run_blender "$RIG_SCRIPT" "$input" "$output"
}

# Add category-specific animations on top of an already-rigged model
add_category_anims() {
    local category="$1"
    local input="$2"    # already-rigged GLB
    local output="$3"

    case "$category" in
        melee)
            echo "[INFO] Melee category uses only base animations (Idle, Walk, Attack, Death)."
            echo "       No additional animations needed."
            if [ "$input" != "$output" ]; then
                cp "$input" "$output"
            fi
            ;;
        ranged)
            echo "[STEP] Adding RangedAttack animation"
            run_blender "$RANGED_SCRIPT" "$input" "$output"
            ;;
        worker)
            echo "[STEP] Adding Gather + Build animations"
            # First add Gather, then Build (worker-gather script creates both)
            run_blender "$WORKER_SCRIPT" "$input" "$output"
            ;;
        healer)
            echo "[STEP] Adding Heal animation"
            run_blender "$HEALER_SCRIPT" "$input" "$output"
            ;;
        heavy)
            echo "[STEP] Adding HeavyAttack animation"
            run_blender "$HEAVY_SCRIPT" "$input" "$output"
            ;;
        siege)
            echo "[STEP] Adding SiegeAttack + SiegeIdle animations"
            run_blender "$SIEGE_SCRIPT" "$input" "$output"
            ;;
        hero)
            # Heroes get ALL combat animations for maximum flexibility
            echo "[STEP] Adding hero animations (HeavyAttack + Heal)"
            local tmp1
            tmp1="$(mktemp /tmp/hero_step1_XXXXXX.glb)"
            run_blender "$HEAVY_SCRIPT" "$input" "$tmp1"
            run_blender "$HEALER_SCRIPT" "$tmp1" "$output"
            rm -f "$tmp1"
            ;;
        *)
            echo "ERROR: Unknown category '$category'"
            usage
            ;;
    esac
}

# Process a single model: full pipeline (rig + category anims)
process_single_rig_and_animate() {
    local category="$1"
    local input="$2"
    local output="${3:-}"

    if [ -z "$output" ]; then
        # Default: write to v03 path mirroring v02 structure
        output="${input/v02/v03}"
    fi

    # Ensure output directory exists
    mkdir -p "$(dirname "$output")"

    local tmp_rigged
    tmp_rigged="$(mktemp /tmp/rigged_XXXXXX.glb)"

    echo ""
    echo "=== Full Rig + Animate Pipeline ==="
    echo "Category: $category"
    echo "Input:    $input"
    echo "Output:   $output"
    echo ""

    # Step 1: Base rig
    rig_base "$input" "$tmp_rigged"

    # Step 2: Category-specific animations
    add_category_anims "$category" "$tmp_rigged" "$output"

    rm -f "$tmp_rigged"

    echo ""
    echo "=== DONE: $output ==="
    echo ""
}

# Process a single model: add animations to already-rigged GLB
process_single_add_anims() {
    local category="$1"
    local input="$2"
    local output="${3:-$input}"

    echo ""
    echo "=== Adding $category Animations ==="
    echo "Input:  $input"
    echo "Output: $output"
    echo ""

    add_category_anims "$category" "$input" "$output"

    echo ""
    echo "=== DONE: $output ==="
    echo ""
}

# Process all models for a faction with a specific category
process_faction() {
    local category="$1"
    local faction="$2"

    echo ""
    echo "========================================"
    echo " Processing faction: $faction"
    echo " Category: $category"
    echo "========================================"
    echo ""

    # Determine which unit types to process for this category
    local unit_types=()
    for unit_type in "${!UNIT_CATEGORY_MAP[@]}"; do
        if [ "${UNIT_CATEGORY_MAP[$unit_type]}" = "$category" ]; then
            unit_types+=("$unit_type")
        fi
    done

    if [ ${#unit_types[@]} -eq 0 ]; then
        echo "WARNING: No unit types mapped to category '$category'"
        return
    fi

    local count=0
    for unit_type in "${unit_types[@]}"; do
        local v03_path="$V03_DIR/$faction/$unit_type.glb"
        if [ -f "$v03_path" ]; then
            echo "--- Processing $faction/$unit_type (already rigged, adding anims) ---"
            add_category_anims "$category" "$v03_path" "$v03_path"
            ((count++))
        else
            local v02_path="$V02_DIR/$faction/$unit_type.glb"
            if [ -f "$v02_path" ]; then
                echo "--- Processing $faction/$unit_type (full rig + animate) ---"
                process_single_rig_and_animate "$category" "$v02_path" "$v03_path"
                ((count++))
            else
                echo "SKIP: No model found for $faction/$unit_type"
            fi
        fi
    done

    echo ""
    echo "Processed $count model(s) for $faction/$category"
}

# Process ALL unit types for a faction (auto-detect category)
process_all_faction() {
    local faction="$1"

    echo ""
    echo "========================================"
    echo " Processing ALL unit types for: $faction"
    echo "========================================"
    echo ""

    # Check v03 directory for existing rigged models
    local v03_faction_dir="$V03_DIR/$faction"
    if [ ! -d "$v03_faction_dir" ]; then
        mkdir -p "$v03_faction_dir"
    fi

    for unit_type in worker infantry ranged heavy siege support hero; do
        local category="${UNIT_CATEGORY_MAP[$unit_type]:-melee}"
        local v03_path="$V03_DIR/$faction/$unit_type.glb"
        local v02_path="$V02_DIR/$faction/$unit_type.glb"

        if [ -f "$v03_path" ]; then
            echo "--- $faction/$unit_type ($category) — adding category animations ---"
            add_category_anims "$category" "$v03_path" "$v03_path"
        elif [ -f "$v02_path" ]; then
            echo "--- $faction/$unit_type ($category) — full rig + animate ---"
            process_single_rig_and_animate "$category" "$v02_path" "$v03_path"
        else
            echo "SKIP: $faction/$unit_type — no model file"
        fi
    done
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if [ $# -lt 1 ]; then
    usage
fi

# Parse mode
MODE="add"  # default: add anims to already-rigged model
CATEGORY=""
INPUT=""
OUTPUT=""
FACTION=""

case "$1" in
    --rig-and-animate)
        MODE="rig"
        shift
        if [ $# -lt 2 ]; then usage; fi
        CATEGORY="$1"
        INPUT="$2"
        OUTPUT="${3:-}"
        ;;
    --all)
        MODE="all-faction"
        shift
        if [ "$1" = "--faction" ]; then
            shift
            FACTION="$1"
        else
            usage
        fi
        ;;
    -h|--help)
        usage
        ;;
    *)
        CATEGORY="$1"
        shift
        if [ $# -eq 0 ]; then usage; fi

        if [ "$1" = "--faction" ]; then
            MODE="faction"
            shift
            FACTION="$1"
        else
            INPUT="$1"
            OUTPUT="${2:-}"
        fi
        ;;
esac

# Execute
case "$MODE" in
    rig)
        process_single_rig_and_animate "$CATEGORY" "$INPUT" "$OUTPUT"
        ;;
    add)
        process_single_add_anims "$CATEGORY" "$INPUT" "$OUTPUT"
        ;;
    faction)
        process_faction "$CATEGORY" "$FACTION"
        ;;
    all-faction)
        process_all_faction "$FACTION"
        ;;
esac

echo ""
echo "Batch animation complete."
