#!/bin/bash
# =============================================================================
# Reign of Brabant -- Meshy v2 Text-to-3D Model Generator
# =============================================================================
# Generates all v0.1 3D models via Meshy API (async with polling).
# Usage: bash scripts/generate_meshy_models.sh
#
# Requires: curl, jq
# API Key: reads from MESHY_API_KEY env var or ../.env
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/assets/models/v01"
ENV_FILE="/Users/richardtheuws/Documents/games/.env"

# Load API key
if [ -z "${MESHY_API_KEY:-}" ]; then
    if [ -f "$ENV_FILE" ]; then
        MESHY_API_KEY=$(grep '^MESHY_API_KEY=' "$ENV_FILE" | cut -d= -f2)
    fi
fi

if [ -z "${MESHY_API_KEY:-}" ]; then
    echo "ERROR: MESHY_API_KEY not found"
    exit 1
fi

echo "=== Meshy Text-to-3D Model Generator ==="
echo "API Key: ${MESHY_API_KEY:0:10}..."
echo "Output: $OUTPUT_DIR"
echo ""

# Create output dirs
mkdir -p "$OUTPUT_DIR/brabanders" "$OUTPUT_DIR/randstad" "$OUTPUT_DIR/shared"

# Log file
LOG_FILE="$PROJECT_DIR/scripts/meshy_generation.log"
> "$LOG_FILE"

# Function to submit a task
submit_task() {
    local prompt="$1"
    local name="$2"

    local response
    response=$(curl -s --max-time 30 "https://api.meshy.ai/openapi/v2/text-to-3d" \
        -H "Authorization: Bearer $MESHY_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"mode\": \"preview\",
            \"prompt\": \"$prompt\",
            \"art_style\": \"realistic\",
            \"should_remesh\": true
        }" 2>&1)

    local task_id
    task_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',''))" 2>/dev/null || echo "")

    if [ -z "$task_id" ]; then
        echo "FAILED to submit: $name"
        echo "Response: $response"
        echo "SUBMIT_FAILED|$name|$response" >> "$LOG_FILE"
        return 1
    fi

    echo "Submitted: $name -> $task_id"
    echo "SUBMITTED|$name|$task_id" >> "$LOG_FILE"
    echo "$task_id"
}

# Function to poll and download a task
poll_and_download() {
    local task_id="$1"
    local output_path="$2"
    local name="$3"
    local max_wait=600  # 10 minutes max
    local elapsed=0
    local interval=10

    while [ $elapsed -lt $max_wait ]; do
        local status_response
        status_response=$(curl -s --max-time 15 "https://api.meshy.ai/openapi/v2/text-to-3d/$task_id" \
            -H "Authorization: Bearer $MESHY_API_KEY" 2>&1)

        local status progress
        status=$(echo "$status_response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")
        progress=$(echo "$status_response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('progress',0))" 2>/dev/null || echo "0")

        if [ "$status" = "SUCCEEDED" ]; then
            # Get GLB URL
            local glb_url
            glb_url=$(echo "$status_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
urls = data.get('model_urls', {})
# Try glb first, then fbx, then obj
url = urls.get('glb', '') or urls.get('fbx', '') or urls.get('obj', '')
print(url)
" 2>/dev/null || echo "")

            if [ -n "$glb_url" ] && [ "$glb_url" != "None" ] && [ "$glb_url" != "" ]; then
                echo "  Downloading $name GLB..."
                curl -s --max-time 120 -L -o "$output_path" "$glb_url"
                local filesize
                filesize=$(stat -f%z "$output_path" 2>/dev/null || echo "0")
                echo "  DONE: $name ($filesize bytes)"
                echo "COMPLETED|$name|$task_id|$filesize" >> "$LOG_FILE"
                return 0
            else
                echo "  WARNING: $name completed but no GLB URL found"
                echo "$status_response" | python3 -m json.tool 2>/dev/null | head -20
                echo "NO_GLB_URL|$name|$task_id" >> "$LOG_FILE"
                return 1
            fi
        elif [ "$status" = "FAILED" ] || [ "$status" = "EXPIRED" ]; then
            local error
            error=$(echo "$status_response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('task_error',{}))" 2>/dev/null || echo "unknown")
            echo "  FAILED: $name ($error)"
            echo "FAILED|$name|$task_id|$error" >> "$LOG_FILE"
            return 1
        fi

        echo "  $name: $status ($progress%) [${elapsed}s]"
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    echo "  TIMEOUT: $name after ${max_wait}s"
    echo "TIMEOUT|$name|$task_id" >> "$LOG_FILE"
    return 1
}

# =============================================================================
# Model Definitions
# =============================================================================

declare -A MODELS
declare -A MODEL_PATHS

# Brabanders
MODELS[brab_worker]="Low poly stylized medieval Dutch farmer, simple overalls, pitchfork, straw hat, warm earth brown tones, game character, isometric view, clean geometry"
MODEL_PATHS[brab_worker]="$OUTPUT_DIR/brabanders/worker.glb"

MODELS[brab_infantry]="Low poly stylized carnival warrior character, colorful costume with orange and red, holding party horn weapon, festive medieval armor, game character"
MODEL_PATHS[brab_infantry]="$OUTPUT_DIR/brabanders/infantry.glb"

MODELS[brab_ranged]="Low poly stylized medieval Dutch smuggler character, dark hooded cloak, throwing pose with beer mug, sneaky stance, game character"
MODEL_PATHS[brab_ranged]="$OUTPUT_DIR/brabanders/ranged.glb"

MODELS[brab_townhall]="Low poly stylized Dutch farmhouse building, red brick walls, steep gabled roof with chimney, small windmill attachment, warm tones, isometric game building"
MODEL_PATHS[brab_townhall]="$OUTPUT_DIR/brabanders/townhall.glb"

MODELS[brab_barracks]="Low poly stylized Dutch brown cafe bar building, warm glowing windows, wooden beer sign above door, cozy pub exterior, isometric game building"
MODEL_PATHS[brab_barracks]="$OUTPUT_DIR/brabanders/barracks.glb"

# Randstad
MODELS[rand_worker]="Low poly stylized young intern character, oversized business suit, holding laptop and coffee cup, nervous expression, blue grey colors, game character"
MODEL_PATHS[rand_worker]="$OUTPUT_DIR/randstad/worker.glb"

MODELS[rand_infantry]="Low poly stylized corporate manager character, sharp business suit, throwing stack of papers, stern face, blue tie, game character"
MODEL_PATHS[rand_infantry]="$OUTPUT_DIR/randstad/infantry.glb"

MODELS[rand_ranged]="Low poly stylized hipster character on bicycle, man bun hairstyle, beard, carrying vinyl records, trendy urban clothes, game character"
MODEL_PATHS[rand_ranged]="$OUTPUT_DIR/randstad/ranged.glb"

MODELS[rand_townhall]="Low poly stylized modern glass office tower building, corporate headquarters, cold blue glass facade, minimalist design, isometric game building"
MODEL_PATHS[rand_townhall]="$OUTPUT_DIR/randstad/townhall.glb"

MODELS[rand_barracks]="Low poly stylized corporate meeting room building exterior, glass walls, conference table visible inside, grey steel frame, isometric game building"
MODEL_PATHS[rand_barracks]="$OUTPUT_DIR/randstad/barracks.glb"

# Shared
MODELS[shared_goldmine]="Low poly stylized gold mine entrance, wooden support beams, golden glowing rocks and ore, medieval mining cart, isometric game prop"
MODEL_PATHS[shared_goldmine]="$OUTPUT_DIR/shared/goldmine.glb"

MODELS[shared_tree]="Low poly stylized pine tree, simple triangular cone shape, dark green foliage, brown trunk, clean geometry, game prop"
MODEL_PATHS[shared_tree]="$OUTPUT_DIR/shared/tree_pine.glb"

# =============================================================================
# Submit all tasks
# =============================================================================

echo "--- Submitting all models ---"
echo ""

declare -A TASK_IDS
SUBMIT_COUNT=0
FAIL_COUNT=0

# Submit with delay between requests to avoid rate limiting
for key in brab_worker brab_infantry brab_ranged brab_townhall brab_barracks \
           rand_worker rand_infantry rand_ranged rand_townhall rand_barracks \
           shared_goldmine shared_tree; do

    task_id=$(submit_task "${MODELS[$key]}" "$key" || echo "FAILED")

    if [ "$task_id" != "FAILED" ] && [ -n "$task_id" ]; then
        TASK_IDS[$key]="$task_id"
        SUBMIT_COUNT=$((SUBMIT_COUNT + 1))
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi

    # Small delay between submissions to avoid rate limit
    sleep 2
done

echo ""
echo "--- Submitted $SUBMIT_COUNT / $((SUBMIT_COUNT + FAIL_COUNT)) models ---"
echo ""

if [ $SUBMIT_COUNT -eq 0 ]; then
    echo "ERROR: No models were submitted successfully"
    exit 1
fi

# =============================================================================
# Poll all tasks for completion
# =============================================================================

echo "--- Polling for completion ---"
echo ""

COMPLETED=0
FAILED=0

for key in "${!TASK_IDS[@]}"; do
    echo "Waiting for: $key (${TASK_IDS[$key]})"
    if poll_and_download "${TASK_IDS[$key]}" "${MODEL_PATHS[$key]}" "$key"; then
        COMPLETED=$((COMPLETED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

# =============================================================================
# Summary
# =============================================================================

echo "========================================="
echo "GENERATION COMPLETE"
echo "========================================="
echo "Submitted:  $SUBMIT_COUNT"
echo "Completed:  $COMPLETED"
echo "Failed:     $FAILED"
echo ""
echo "Output directory: $OUTPUT_DIR"
echo "Log file: $LOG_FILE"
echo ""

# List generated files
echo "Generated files:"
find "$OUTPUT_DIR" -name "*.glb" -exec ls -lh {} \;

echo ""
echo "Done!"
