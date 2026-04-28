#!/bin/bash
# gen-building-concepts.sh -- Genereer 11 isometrische 3/4 top-down concept-art images
# voor Reign of Brabant Bundel 5B (Meshy v6 image-to-3D input).
#
# Pipeline per image:
#   1. Flux Dev call (1024x1024, isometric template + factie palet)
#   2. BiRefNet remove-bg op resulterende URL
#   3. Save als transparent PNG naar public/assets/concepts/buildings/<key>.png
#
# Spot-check per image gebeurt visueel achteraf (one building, 3/4 view, transparent).

set -e

ROOT_DIR="/Users/richardtheuws/Documents/games"
ENV_FILE="$ROOT_DIR/.env"
OUT_DIR="$ROOT_DIR/reign-of-brabant/public/assets/concepts/buildings"
LOG_FILE="$OUT_DIR/_generation-log.json"

source "$ENV_FILE"

if [ -z "$FAL_AI_KEY" ]; then
    echo "FAL_AI_KEY ontbreekt"
    exit 1
fi

mkdir -p "$OUT_DIR"

# Factie-paletten
PALETTE_BRABANT="warm orange red yellow tones, carnival theme, festive flag accents"
PALETTE_RANDSTAD="cool blue glass and steel modern corporate, transparent material accents"
PALETTE_LIMBURG="warm brown mergel-stone and timber tones, mining and bakery feel"
PALETTE_BELGEN="black gold and burgundy art-deco luxury formal tones"

NEGATIVE="blurry, photorealistic render, text, watermark, multiple buildings, characters, ugly"

# Image specs: key|subject|palette
IMAGES=(
    "randstad-tertiary|modern juice bar and oat-milk bar facade, glass storefront, plant decoration, small awning|$PALETTE_RANDSTAD"
    "limburg-tertiary|small mining shaft tower with wooden support beams, mergel-stone base, mine cart on rails next to it|$PALETTE_LIMBURG"
    "belgen-tertiary|Belgian chocolaterie storefront, ornate display window with chocolates visible, dark wood facade with gold accents|$PALETTE_BELGEN"
    "brabant-upgrade|rustic farmhouse workshop wagon-builder, wooden cart wheels stacked outside, hay-thatched roof, anvil and tools|$PALETTE_BRABANT"
    "randstad-upgrade|futuristic glass cube innovation lab, server racks visible through window, sleek steel framing, slight neon accent|$PALETTE_RANDSTAD"
    "limburg-upgrade|industrial blast furnace hoogoven with tall brick chimney, mergel-stone outer wall, glowing fire visible at base|$PALETTE_LIMBURG"
    "belgen-upgrade|art-deco diamond cutting workshop, polished black marble facade with gold trim, large display window with diamond|$PALETTE_BELGEN"
    "brabant-faction1|festive carnival tent carnavalstent, orange and red striped canvas, bright flag on top, wooden support poles|$PALETTE_BRABANT"
    "randstad-faction1|modern corporate boardroom pavilion, large glass facade, sleek silver framing, single conference table visible inside|$PALETTE_RANDSTAD"
    "limburg-faction1|cozy Limburgse vlaai bakery, wooden awning, pies displayed in front window, warm brown timber facade|$PALETTE_LIMBURG"
    "belgen-faction1|classical diplomatic salon ambassade, white columns at entrance, ornate front door, small flag flying|$PALETTE_BELGEN"
)

build_prompt() {
    local subject="$1"
    local palette="$2"
    echo "isometric 3/4 top-down view game asset, single building ${subject}, centered on transparent background, low-poly stylized fantasy RTS art, painted clean linework, soft directional lighting, no characters, no text, no people, ${palette}"
}

call_flux() {
    local prompt="$1"
    local body
    body=$(python3 -c "import json,sys; print(json.dumps({'prompt': sys.argv[1], 'image_size': {'width': 1024, 'height': 1024}, 'num_images': 1, 'negative_prompt': sys.argv[2]}))" "$prompt" "$NEGATIVE")

    local resp
    resp=$(curl -s -X POST "https://queue.fal.run/fal-ai/flux/dev" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d "$body")

    local req_id
    req_id=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('request_id',''))" 2>/dev/null)
    local resp_url
    resp_url=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response_url',''))" 2>/dev/null)

    if [ -z "$req_id" ]; then
        echo "FLUX_FAIL:$resp" >&2
        return 1
    fi

    [ -z "$resp_url" ] && resp_url="https://queue.fal.run/fal-ai/flux/dev/requests/$req_id"

    for i in $(seq 1 60); do
        local r
        r=$(curl -s "$resp_url" -H "Authorization: Key $FAL_AI_KEY")
        local status
        status=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null)
        if [ "$status" = "COMPLETED" ]; then
            echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); imgs=d.get('images',[]); print(imgs[0]['url'] if imgs else '')"
            return 0
        elif [ "$status" = "FAILED" ]; then
            echo "FLUX_FAIL:$r" >&2
            return 1
        fi
        # Sometimes status missing but result already there
        if [ -z "$status" ]; then
            local maybe_url
            maybe_url=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); imgs=d.get('images',[]); print(imgs[0]['url'] if imgs else '')" 2>/dev/null)
            if [ -n "$maybe_url" ]; then
                echo "$maybe_url"
                return 0
            fi
        fi
        sleep 2
    done

    echo "FLUX_TIMEOUT" >&2
    return 1
}

call_rembg() {
    local image_url="$1"
    local body
    body=$(python3 -c "import json,sys; print(json.dumps({'image_url': sys.argv[1]}))" "$image_url")

    local resp
    resp=$(curl -s -X POST "https://queue.fal.run/fal-ai/birefnet" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d "$body")

    local req_id
    req_id=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('request_id',''))" 2>/dev/null)
    local resp_url
    resp_url=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response_url',''))" 2>/dev/null)

    if [ -z "$req_id" ]; then
        echo "REMBG_FAIL:$resp" >&2
        return 1
    fi

    [ -z "$resp_url" ] && resp_url="https://queue.fal.run/fal-ai/birefnet/requests/$req_id"

    for i in $(seq 1 60); do
        local r
        r=$(curl -s "$resp_url" -H "Authorization: Key $FAL_AI_KEY")
        local status
        status=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null)
        if [ "$status" = "COMPLETED" ]; then
            echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); im=d.get('image',{}); print(im.get('url','') if isinstance(im,dict) else '')"
            return 0
        elif [ "$status" = "FAILED" ]; then
            echo "REMBG_FAIL:$r" >&2
            return 1
        fi
        if [ -z "$status" ]; then
            local maybe_url
            maybe_url=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); im=d.get('image',{}); print(im.get('url','') if isinstance(im,dict) else '')" 2>/dev/null)
            if [ -n "$maybe_url" ]; then
                echo "$maybe_url"
                return 0
            fi
        fi
        sleep 2
    done

    echo "REMBG_TIMEOUT" >&2
    return 1
}

START_TS=$(date +%s)
RESULTS=()

for entry in "${IMAGES[@]}"; do
    KEY=$(echo "$entry" | cut -d'|' -f1)
    SUBJECT=$(echo "$entry" | cut -d'|' -f2)
    PALETTE=$(echo "$entry" | cut -d'|' -f3)
    PROMPT=$(build_prompt "$SUBJECT" "$PALETTE")
    OUT_FILE="$OUT_DIR/$KEY.png"

    echo ""
    echo "=== [$KEY] ==="
    echo "Prompt: $PROMPT"
    IMG_START=$(date +%s)

    # 1. Flux Dev
    FLUX_URL=$(call_flux "$PROMPT" || echo "")
    if [ -z "$FLUX_URL" ]; then
        echo "FLUX FAILED for $KEY"
        RESULTS+=("$KEY|FAILED|flux-error")
        continue
    fi
    echo "Flux URL: $FLUX_URL"

    # 2. Remove BG
    CLEAN_URL=$(call_rembg "$FLUX_URL" || echo "")
    if [ -z "$CLEAN_URL" ]; then
        echo "REMBG FAILED for $KEY -- saving raw flux as fallback"
        curl -s -o "$OUT_FILE" "$FLUX_URL"
        RESULTS+=("$KEY|PARTIAL|rembg-failed")
        continue
    fi
    echo "Clean URL: $CLEAN_URL"

    # 3. Download
    curl -s -o "$OUT_FILE" "$CLEAN_URL"
    SIZE=$(ls -l "$OUT_FILE" | awk '{print $5}')
    IMG_END=$(date +%s)
    ELAPSED=$((IMG_END - IMG_START))

    echo "OK [$KEY] ${SIZE}b in ${ELAPSED}s"
    RESULTS+=("$KEY|OK|${ELAPSED}s|${SIZE}b")
done

END_TS=$(date +%s)
TOTAL=$((END_TS - START_TS))

echo ""
echo "================================="
echo "TOTAAL: ${TOTAL}s"
echo "================================="
for r in "${RESULTS[@]}"; do
    echo "$r"
done

# Write log JSON
python3 <<PYEOF
import json, os
results_raw = """$(printf '%s\n' "${RESULTS[@]}")"""
out = []
for line in results_raw.strip().split("\n"):
    if not line: continue
    parts = line.split("|")
    out.append({
        "key": parts[0],
        "status": parts[1] if len(parts) > 1 else "",
        "info": "|".join(parts[2:]) if len(parts) > 2 else ""
    })
with open("$LOG_FILE", "w") as f:
    json.dump({"generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "total_seconds": $TOTAL, "results": out}, f, indent=2)
print("Log written to $LOG_FILE")
PYEOF
