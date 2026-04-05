#!/bin/bash
# =============================================================================
# Reign of Brabant -- Meshy v6 Image-to-3D Model Generator
# =============================================================================
# Uses concept art as reference for high-quality 3D model generation.
# Meshy v6 via fal.ai synchronous endpoint.
#
# Usage: bash scripts/generate_v6_models.sh [model_key]
#   No args = generate all models
#   With arg = generate specific model (e.g., "brab_worker")
#
# Requires: curl, jq, base64
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/assets/models/v02"
FACTIONS_DIR="$PROJECT_DIR/assets/factions"
ENV_FILE="/Users/richardtheuws/Documents/games/.env"
LOG_FILE="$PROJECT_DIR/scripts/meshy_v6_generation.log"

# Load API key
if [ -z "${FAL_AI_KEY:-}" ]; then
    if [ -f "$ENV_FILE" ]; then
        FAL_AI_KEY=$(grep '^FAL_AI_KEY=' "$ENV_FILE" | cut -d= -f2)
    fi
fi

if [ -z "${FAL_AI_KEY:-}" ]; then
    echo "ERROR: FAL_AI_KEY not found"
    exit 1
fi

# Create output dirs
mkdir -p "$OUTPUT_DIR/brabanders" "$OUTPUT_DIR/randstad" "$OUTPUT_DIR/shared"
> "$LOG_FILE"

echo "=== Meshy v6 Image-to-3D Generator ==="
echo "API Key: ${FAL_AI_KEY:0:10}..."
echo "Output: $OUTPUT_DIR"
echo ""

# Function: generate model from concept art image
generate_from_image() {
    local image_path="$1"
    local output_path="$2"
    local name="$3"
    local prompt="$4"

    echo "[$name] Starting image-to-3D generation..."
    echo "  Image: $image_path"
    echo "  Prompt: $prompt"

    # Convert image to base64 data URI
    local mime_type="image/png"
    local base64_data
    base64_data=$(base64 -i "$image_path")
    local data_uri="data:${mime_type};base64,${base64_data}"

    # Write payload to temp file (base64 can be very long)
    local tmp_payload
    tmp_payload=$(mktemp /tmp/meshy_payload_XXXXXX.json)
    cat > "$tmp_payload" <<PAYLOAD_EOF
{
    "image_url": "$data_uri",
    "prompt": "$prompt",
    "art_style": "realistic",
    "target_polycount": 15000
}
PAYLOAD_EOF

    # Call Meshy v6 via fal.ai (synchronous — blocks until done, 2-5 min)
    local response
    response=$(curl -s --max-time 600 \
        "https://fal.run/fal-ai/meshy/v6/image-to-3d" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d @"$tmp_payload" 2>&1)

    rm -f "$tmp_payload"

    # Extract GLB URL
    local glb_url
    glb_url=$(echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
# Try multiple possible response structures
url = ''
if 'model_glb' in data and isinstance(data['model_glb'], dict):
    url = data['model_glb'].get('url', '')
elif 'model_urls' in data and isinstance(data['model_urls'], dict):
    url = data['model_urls'].get('glb', '')
if not url and 'glb_url' in data:
    url = data['glb_url']
print(url)
" 2>/dev/null || echo "")

    if [ -n "$glb_url" ] && [ "$glb_url" != "None" ] && [ "$glb_url" != "" ]; then
        echo "  [$name] Downloading GLB..."
        curl -s --max-time 120 -L -o "$output_path" "$glb_url"
        local filesize
        filesize=$(stat -f%z "$output_path" 2>/dev/null || echo "0")
        echo "  [$name] DONE ($filesize bytes)"
        echo "OK|$name|$filesize|$(date +%H:%M:%S)" >> "$LOG_FILE"
        return 0
    else
        echo "  [$name] FAILED - no GLB URL in response"
        echo "$response" | python3 -m json.tool 2>/dev/null | head -15 || echo "$response" | head -5
        echo "FAILED|$name|$(date +%H:%M:%S)|$response" >> "$LOG_FILE"
        return 1
    fi
}

# Function: generate model from text prompt only
generate_from_text() {
    local output_path="$1"
    local name="$2"
    local prompt="$3"

    echo "[$name] Starting text-to-3D generation..."

    local response
    response=$(curl -s --max-time 600 \
        "https://fal.run/fal-ai/meshy/v6/text-to-3d" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"prompt\": \"$prompt\",
            \"art_style\": \"realistic\",
            \"target_polycount\": 15000
        }" 2>&1)

    local glb_url
    glb_url=$(echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
url = ''
if 'model_glb' in data and isinstance(data['model_glb'], dict):
    url = data['model_glb'].get('url', '')
elif 'model_urls' in data and isinstance(data['model_urls'], dict):
    url = data['model_urls'].get('glb', '')
if not url and 'glb_url' in data:
    url = data['glb_url']
print(url)
" 2>/dev/null || echo "")

    if [ -n "$glb_url" ] && [ "$glb_url" != "None" ] && [ "$glb_url" != "" ]; then
        curl -s --max-time 120 -L -o "$output_path" "$glb_url"
        local filesize
        filesize=$(stat -f%z "$output_path" 2>/dev/null || echo "0")
        echo "  [$name] DONE ($filesize bytes)"
        echo "OK|$name|$filesize|$(date +%H:%M:%S)" >> "$LOG_FILE"
        return 0
    else
        echo "  [$name] FAILED"
        echo "$response" | head -5
        echo "FAILED|$name|$(date +%H:%M:%S)" >> "$LOG_FILE"
        return 1
    fi
}

# =============================================================================
# Model Definitions — image-to-3D with concept art references
# =============================================================================

FILTER="${1:-all}"

run_model() {
    local key="$1"
    if [ "$FILTER" != "all" ] && [ "$FILTER" != "$key" ]; then
        return 0
    fi

    case "$key" in
        # ---- BRABANDERS ----
        brab_worker)
            generate_from_image \
                "$FACTIONS_DIR/brabanders-boer.png" \
                "$OUTPUT_DIR/brabanders/worker.glb" \
                "brab_worker" \
                "3D game character, medieval Dutch farmer with pitchfork and straw hat, stylized low-poly, warm orange-brown colors, isometric RTS unit"
            ;;
        brab_infantry)
            generate_from_image \
                "$FACTIONS_DIR/brabanders-carnavalvierder.png" \
                "$OUTPUT_DIR/brabanders/infantry.glb" \
                "brab_infantry" \
                "3D game character, carnival warrior with festive orange-red costume, holding party weapon, stylized low-poly, isometric RTS unit"
            ;;
        brab_ranged)
            generate_from_image \
                "$FACTIONS_DIR/brabanders-prins.png" \
                "$OUTPUT_DIR/brabanders/ranged.glb" \
                "brab_ranged" \
                "3D game character, carnival prince with cape and scepter, colorful outfit, stylized low-poly, isometric RTS unit"
            ;;
        brab_townhall)
            generate_from_image \
                "$FACTIONS_DIR/brabanders-boerderij.png" \
                "$OUTPUT_DIR/brabanders/townhall.glb" \
                "brab_townhall" \
                "3D game building, Dutch farmhouse with red brick and steep gabled roof, warm tones, stylized low-poly, isometric RTS building"
            ;;
        brab_barracks)
            generate_from_image \
                "$FACTIONS_DIR/brabanders-cafe.png" \
                "$OUTPUT_DIR/brabanders/barracks.glb" \
                "brab_barracks" \
                "3D game building, cozy Dutch brown cafe pub exterior, warm glowing windows, stylized low-poly, isometric RTS building"
            ;;
        # ---- RANDSTAD ----
        rand_worker)
            generate_from_image \
                "$FACTIONS_DIR/randstad-stagiair.png" \
                "$OUTPUT_DIR/randstad/worker.glb" \
                "rand_worker" \
                "3D game character, young corporate intern in oversized suit with laptop, blue-grey colors, stylized low-poly, isometric RTS unit"
            ;;
        rand_infantry)
            generate_from_image \
                "$FACTIONS_DIR/randstad-manager.png" \
                "$OUTPUT_DIR/randstad/infantry.glb" \
                "rand_infantry" \
                "3D game character, stern corporate manager in sharp business suit, blue tie, stylized low-poly, isometric RTS unit"
            ;;
        rand_ranged)
            generate_from_image \
                "$FACTIONS_DIR/randstad-hipster.png" \
                "$OUTPUT_DIR/randstad/ranged.glb" \
                "rand_ranged" \
                "3D game character, hipster on bicycle with man bun and beard, trendy clothes, stylized low-poly, isometric RTS unit"
            ;;
        rand_townhall)
            generate_from_image \
                "$FACTIONS_DIR/randstad-hoofdkantoor.png" \
                "$OUTPUT_DIR/randstad/townhall.glb" \
                "rand_townhall" \
                "3D game building, modern glass office tower, cold blue facade, minimalist corporate, stylized low-poly, isometric RTS building"
            ;;
        rand_barracks)
            generate_from_image \
                "$FACTIONS_DIR/randstad-hoofdkantoor.png" \
                "$OUTPUT_DIR/randstad/barracks.glb" \
                "rand_barracks" \
                "3D game building, corporate meeting room with glass walls, grey steel frame, stylized low-poly, isometric RTS building"
            ;;
        # ---- SHARED ----
        shared_goldmine)
            generate_from_text \
                "$OUTPUT_DIR/shared/goldmine.glb" \
                "shared_goldmine" \
                "3D game prop, medieval gold mine entrance with wooden beams and golden ore, glowing rocks, mining cart, stylized low-poly, isometric"
            ;;
        shared_tree)
            generate_from_text \
                "$OUTPUT_DIR/shared/tree_pine.glb" \
                "shared_tree" \
                "3D game prop, stylized pine tree with dark green triangular foliage, brown trunk, clean geometry, isometric game asset"
            ;;
        *)
            echo "Unknown model key: $key"
            return 1
            ;;
    esac
}

# =============================================================================
# Execute
# =============================================================================

if [ "$FILTER" = "all" ]; then
    echo "Generating ALL 12 models (this will take 25-60 minutes)..."
    echo ""
    for key in brab_worker brab_infantry brab_ranged brab_townhall brab_barracks \
               rand_worker rand_infantry rand_ranged rand_townhall rand_barracks \
               shared_goldmine shared_tree; do
        run_model "$key" || true
        echo ""
    done
else
    run_model "$FILTER"
fi

echo ""
echo "=== Generation Complete ==="
echo "Results in: $OUTPUT_DIR"
echo "Log: $LOG_FILE"
cat "$LOG_FILE"
