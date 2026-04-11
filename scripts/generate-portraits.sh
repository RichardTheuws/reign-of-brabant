#!/bin/bash
# generate-portraits.sh — Batch generate all 20 unit/hero portraits via fal.ai
# Uses Flux Dev for consistent RTS-style portrait generation
# Compatible with bash 3 (macOS)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENV_FILE="$ROOT_DIR/.env"
OUTPUT_DIR="$SCRIPT_DIR/../public/assets/portraits"

source "$ENV_FILE"

if [ -z "$FAL_AI_KEY" ]; then
    echo "FAL_AI_KEY not found in .env"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

MODEL="fal-ai/flux/dev"
IMAGE_SIZE='{"width": 512, "height": 512}'

# Style prefix for consistency
STYLE="RTS game unit portrait, head and shoulders close-up, painted digital art style, dark background with golden ornate frame border, dramatic lighting, fantasy medieval theme, square format"

# Function to generate a single portrait
generate_portrait() {
    local FILENAME="$1"
    local PROMPT="$2"
    local OUTPUT_FILE="$OUTPUT_DIR/${FILENAME}.png"

    # Skip if already exists
    if [ -f "$OUTPUT_FILE" ]; then
        echo "SKIP: $FILENAME (already exists)"
        return 0
    fi

    echo "GENERATING: $FILENAME"

    # Escape prompt for JSON
    ESCAPED_PROMPT=$(echo "$PROMPT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))")
    BODY="{\"prompt\": $ESCAPED_PROMPT, \"image_size\": $IMAGE_SIZE, \"num_images\": 1}"

    RESPONSE=$(curl -s -X POST "https://queue.fal.run/$MODEL" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d "$BODY")

    REQUEST_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('request_id',''))" 2>/dev/null)
    RESP_URL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response_url',''))" 2>/dev/null)

    if [ -z "$REQUEST_ID" ]; then
        echo "  ERROR: No request ID for $FILENAME"
        return 1
    fi

    if [ -z "$RESP_URL" ]; then
        RESP_URL="https://queue.fal.run/$MODEL/requests/$REQUEST_ID"
    fi

    # Poll for result
    for attempt in $(seq 1 60); do
        RESULT=$(curl -s "$RESP_URL" -H "Authorization: Key $FAL_AI_KEY")
        STATUS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null)

        if [ "$STATUS" = "COMPLETED" ] || [ -z "$STATUS" ]; then
            IMAGE_URL=$(echo "$RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
imgs = d.get('images', [])
if imgs and isinstance(imgs, list):
    print(imgs[0].get('url', ''))
else:
    print('')
" 2>/dev/null)

            if [ -n "$IMAGE_URL" ]; then
                curl -s -o "$OUTPUT_FILE" "$IMAGE_URL"
                echo "  DONE: $FILENAME"
                return 0
            fi
        fi

        if [ "$STATUS" = "FAILED" ]; then
            echo "  FAILED: $FILENAME"
            return 1
        fi

        sleep 2
    done

    echo "  TIMEOUT: $FILENAME"
    return 1
}

echo "Generating 20 portraits via fal.ai Flux Dev..."
echo "Output: $OUTPUT_DIR"
echo ""

COUNT=0
TOTAL=20

# Heroes
generate_portrait "brabant-prins" "a noble carnival prince with golden crown and ceremonial scepter, ornate golden outfit, confident smile, warm eyes, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "brabant-boer" "a weathered Dutch farmer with strong jaw and calloused hands, straw hat, holding a pitchfork, stern but kind expression, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "randstad-ceo" "a corporate CEO in expensive suit with bluetooth headset, slicked back hair, cold calculating eyes, power tie, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "randstad-politicus" "a smooth Dutch politician, perfectly groomed, fake smile, expensive watch, political pin on lapel, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "limburg-mijnbaas" "a rugged mine boss with coal-dusted face, hard hat with lamp, muscular build, thick mustache, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "limburg-maasmeester" "a mysterious water mage with flowing robes, blue-green mystical eyes, river symbols on clothing, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "belgen-frietkoning" "a large Belgian fry king with thick curled mustache, chef hat shaped like a fry cone, proud expression, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "belgen-abdijbrouwer" "a Belgian monk brewer with brown robes and rope belt, holding a chalice of golden beer, wise eyes, $STYLE" && COUNT=$((COUNT+1))

# Brabant units
generate_portrait "brabant-worker" "a simple Dutch farmer worker with overalls, cap, carrying a bucket, humble appearance, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "brabant-infantry" "a festive carnival soldier with colorful outfit, face paint, wooden shield, jovial expression, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "brabant-ranged" "a stealthy Brabant scout in dark green cloak, crossbow, sharp eyes, half-hidden in shadows, $STYLE" && COUNT=$((COUNT+1))

# Randstad units
generate_portrait "randstad-worker" "a young intern in ill-fitting suit, carrying coffee cups, nervous expression, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "randstad-infantry" "a middle manager in business casual, clipboard as shield, aggressive posture, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "randstad-ranged" "a corporate consultant with laptop bag, throwing spreadsheets, smug expression, $STYLE" && COUNT=$((COUNT+1))

# Limburg units
generate_portrait "limburg-worker" "a coal miner with pickaxe, headlamp, dust-covered face, determined look, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "limburg-infantry" "a Limburg marksman with historical rifle, traditional shooting guild uniform, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "limburg-ranged" "a pie thrower with stack of Limburg vlaai pies, apron, flour-dusted, mischievous grin, $STYLE" && COUNT=$((COUNT+1))

# Belgen units
generate_portrait "belgen-worker" "a Belgian fry stand operator with apron, holding a fry scoop, friendly expression, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "belgen-infantry" "a burly Belgian beer builder with barrel armor, mug as weapon, red cheeks, $STYLE" && COUNT=$((COUNT+1))
generate_portrait "belgen-ranged" "a Belgian chocolatier in white chef coat, throwing chocolate truffles, precise and elegant, $STYLE" && COUNT=$((COUNT+1))

echo ""
echo "Complete! Generated $COUNT/$TOTAL portraits."
ls -la "$OUTPUT_DIR/"
