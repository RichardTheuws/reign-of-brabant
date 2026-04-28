#!/bin/bash
# gen-brabant-tertiary-concept.sh -- Single-image concept-art generator voor
# Brabant Worstenbroodjeskraam (TertiaryResource). Volgt het Bundle 5B patroon
# (Flux Dev 1024x1024 -> BiRefNet remove-bg -> transparent PNG).
#
# Pipeline:
#   1. Flux Dev call (queue.fal.run/fal-ai/flux/dev) -- ~8s
#   2. BiRefNet remove-bg op resulterende URL (queue.fal.run/fal-ai/birefnet) -- ~2s
#   3. Save naar public/assets/concepts/buildings/brabant-tertiary.png

set -e

ROOT_DIR="/Users/richardtheuws/Documents/games"
ENV_FILE="$ROOT_DIR/.env"
OUT_DIR="$ROOT_DIR/reign-of-brabant/public/assets/concepts/buildings"
OUT_FILE="$OUT_DIR/brabant-tertiary.png"

source "$ENV_FILE"

if [ -z "$FAL_AI_KEY" ]; then
    echo "FAL_AI_KEY ontbreekt"
    exit 1
fi

mkdir -p "$OUT_DIR"

PROMPT="isometric 3/4 top-down view game asset, single building festive Brabant worstenbroodjes food stall (kraampje), warm wooden frame with small awning, sausage rolls visible on counter, oranje-rood-geel carnaval color palette with small flag accent, painted clean linework, low-poly stylized fantasy RTS art, soft directional lighting, no characters, no text, no people"

NEGATIVE="blurry, photorealistic render, text, watermark, multiple buildings, characters, ugly"

echo "=== brabant-tertiary concept-art ==="
echo "Prompt: $PROMPT"
START_TS=$(date +%s)

# 1. Flux Dev
BODY=$(python3 -c "import json,sys; print(json.dumps({'prompt': sys.argv[1], 'image_size': {'width': 1024, 'height': 1024}, 'num_images': 1, 'negative_prompt': sys.argv[2]}))" "$PROMPT" "$NEGATIVE")

RESP=$(curl -s -X POST "https://queue.fal.run/fal-ai/flux/dev" \
    -H "Authorization: Key $FAL_AI_KEY" \
    -H "Content-Type: application/json" \
    -d "$BODY")

REQ_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('request_id',''))" 2>/dev/null || echo "")
RESP_URL=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response_url',''))" 2>/dev/null || echo "")

if [ -z "$REQ_ID" ]; then
    echo "FLUX_FAIL: $RESP"
    exit 1
fi
[ -z "$RESP_URL" ] && RESP_URL="https://queue.fal.run/fal-ai/flux/dev/requests/$REQ_ID"

FLUX_URL=""
for i in $(seq 1 60); do
    R=$(curl -s "$RESP_URL" -H "Authorization: Key $FAL_AI_KEY")
    STATUS=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
    if [ "$STATUS" = "COMPLETED" ]; then
        FLUX_URL=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); imgs=d.get('images',[]); print(imgs[0]['url'] if imgs else '')")
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo "FLUX_FAIL: $R"
        exit 1
    fi
    if [ -z "$STATUS" ]; then
        MAYBE=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); imgs=d.get('images',[]); print(imgs[0]['url'] if imgs else '')" 2>/dev/null || echo "")
        if [ -n "$MAYBE" ]; then
            FLUX_URL="$MAYBE"
            break
        fi
    fi
    sleep 2
done

if [ -z "$FLUX_URL" ]; then
    echo "FLUX_TIMEOUT or no URL"
    exit 1
fi

FLUX_TS=$(date +%s)
FLUX_ELAPSED=$((FLUX_TS - START_TS))
echo "Flux URL ($FLUX_ELAPSED s): $FLUX_URL"

# 2. BiRefNet remove-bg
BG_BODY=$(python3 -c "import json,sys; print(json.dumps({'image_url': sys.argv[1]}))" "$FLUX_URL")

BG_RESP=$(curl -s -X POST "https://queue.fal.run/fal-ai/birefnet" \
    -H "Authorization: Key $FAL_AI_KEY" \
    -H "Content-Type: application/json" \
    -d "$BG_BODY")

BG_REQ_ID=$(echo "$BG_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('request_id',''))" 2>/dev/null || echo "")
BG_RESP_URL=$(echo "$BG_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response_url',''))" 2>/dev/null || echo "")

if [ -z "$BG_REQ_ID" ]; then
    echo "REMBG_FAIL: $BG_RESP"
    echo "Saving raw flux as fallback"
    curl -s -o "$OUT_FILE" "$FLUX_URL"
    exit 1
fi
[ -z "$BG_RESP_URL" ] && BG_RESP_URL="https://queue.fal.run/fal-ai/birefnet/requests/$BG_REQ_ID"

CLEAN_URL=""
for i in $(seq 1 60); do
    R=$(curl -s "$BG_RESP_URL" -H "Authorization: Key $FAL_AI_KEY")
    STATUS=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
    if [ "$STATUS" = "COMPLETED" ]; then
        CLEAN_URL=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); im=d.get('image',{}); print(im.get('url','') if isinstance(im,dict) else '')")
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo "REMBG_FAIL: $R"
        echo "Saving raw flux as fallback"
        curl -s -o "$OUT_FILE" "$FLUX_URL"
        exit 1
    fi
    if [ -z "$STATUS" ]; then
        MAYBE=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); im=d.get('image',{}); print(im.get('url','') if isinstance(im,dict) else '')" 2>/dev/null || echo "")
        if [ -n "$MAYBE" ]; then
            CLEAN_URL="$MAYBE"
            break
        fi
    fi
    sleep 2
done

if [ -z "$CLEAN_URL" ]; then
    echo "REMBG_TIMEOUT -- saving raw flux as fallback"
    curl -s -o "$OUT_FILE" "$FLUX_URL"
    exit 1
fi

REMBG_TS=$(date +%s)
REMBG_ELAPSED=$((REMBG_TS - FLUX_TS))
echo "Clean URL ($REMBG_ELAPSED s): $CLEAN_URL"

# 3. Download
curl -s -o "$OUT_FILE" "$CLEAN_URL"
SIZE=$(stat -f%z "$OUT_FILE" 2>/dev/null || echo "0")
END_TS=$(date +%s)
TOTAL=$((END_TS - START_TS))

echo ""
echo "OK: $OUT_FILE"
echo "Size: $SIZE bytes"
echo "Total: ${TOTAL}s (flux ${FLUX_ELAPSED}s + rembg ${REMBG_ELAPSED}s)"
