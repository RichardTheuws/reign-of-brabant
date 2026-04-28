#!/bin/bash
# =============================================================================
# Reign of Brabant -- Bundle 5B: Meshy v6 Image-to-3D batch (11 GLBs)
# =============================================================================
# Generates 11 building GLBs from concept-art PNGs in
# public/assets/concepts/buildings/. Replaces lumbercamp/blacksmith stand-ins.
#
# Pipeline per GLB (proven in generate_v6_models.sh):
#   1. base64 PNG  -> data-URI  -> tmp payload file
#   2. POST sync to https://fal.run/fal-ai/meshy/v6/image-to-3d
#   3. Extract model_glb.url OR model_urls.glb.url (response shape varies)
#   4. Download GLB, sanity check size > 50KB
#   5. Retry once on failure
#
# Usage:  bash scripts/generate_bundle5b.sh           (all 11)
#         bash scripts/generate_bundle5b.sh randstad-tertiary  (single key)
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONCEPTS_DIR="$PROJECT_DIR/public/assets/concepts/buildings"
OUTPUT_DIR="$PROJECT_DIR/public/assets/models/v02"
ENV_FILE="/Users/richardtheuws/Documents/games/.env"
LOG_FILE="$PROJECT_DIR/scripts/bundle5b_generation.log"
STATUS_FILE="$PROJECT_DIR/scripts/bundle5b_status.json"

# Load FAL_AI_KEY (Meshy v6 runs via fal.ai, not direct Meshy API)
if [ -z "${FAL_AI_KEY:-}" ]; then
    if [ -f "$ENV_FILE" ]; then
        FAL_AI_KEY=$(grep '^FAL_AI_KEY=' "$ENV_FILE" | cut -d= -f2)
    fi
fi
if [ -z "${FAL_AI_KEY:-}" ]; then
    echo "ERROR: FAL_AI_KEY not found in env or $ENV_FILE"
    exit 1
fi

# Ensure output dirs exist (folder-naming = brabanders/limburgers plurals)
mkdir -p \
    "$OUTPUT_DIR/brabanders" \
    "$OUTPUT_DIR/randstad" \
    "$OUTPUT_DIR/limburgers" \
    "$OUTPUT_DIR/belgen"

> "$LOG_FILE"
echo "=== Bundle 5B -- Meshy v6 Image-to-3D Generator ==="
echo "API Key: ${FAL_AI_KEY:0:10}..."
echo "Concepts: $CONCEPTS_DIR"
echo "Output:   $OUTPUT_DIR"
echo "Log:      $LOG_FILE"
echo ""

# --- single attempt: returns 0 on success, 1 on fail; sets globals SIZE/SECONDS_TAKEN/RESPONSE_ID ---
SIZE=0
SECONDS_TAKEN=0
RESPONSE_ID=""

attempt_generate() {
    local image_path="$1"
    local output_path="$2"
    local name="$3"
    local prompt="$4"

    if [ ! -f "$image_path" ]; then
        echo "  [$name] ERROR: input PNG not found: $image_path"
        return 1
    fi

    # Build base64 data URI
    local base64_data
    base64_data=$(base64 -i "$image_path")
    local data_uri="data:image/png;base64,${base64_data}"

    # Write payload to temp file (avoid argument-too-long shell limit)
    local tmp_payload="/tmp/bundle5b_payload_${name}_$$.json"
    local tmp_uri="/tmp/bundle5b_uri_${name}_$$.txt"
    printf '%s' "$data_uri" > "$tmp_uri"
    python3 - "$tmp_payload" "$tmp_uri" "$prompt" <<'PYEOF'
import json, sys
out_path = sys.argv[1]
uri_path = sys.argv[2]
prompt = sys.argv[3]
with open(uri_path) as f:
    data_uri = f.read()
payload = {
    "image_url": data_uri,
    "prompt": prompt,
    "art_style": "realistic",
    "target_polycount": 18000,
    "should_remesh": True,
    "should_texture": True
}
with open(out_path, "w") as f:
    json.dump(payload, f)
PYEOF
    rm -f "$tmp_uri"

    local start_ts end_ts
    start_ts=$(date +%s)

    # Synchronous fal.ai endpoint -- blocks 2-5 min until done
    local response_file="/tmp/bundle5b_response_${name}_$$.json"
    local http_code
    http_code=$(curl -s --max-time 600 \
        -o "$response_file" \
        -w "%{http_code}" \
        "https://fal.run/fal-ai/meshy/v6/image-to-3d" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d @"$tmp_payload" 2>/dev/null)

    rm -f "$tmp_payload"
    end_ts=$(date +%s)
    SECONDS_TAKEN=$(( end_ts - start_ts ))

    if [ "$http_code" != "200" ]; then
        echo "  [$name] HTTP $http_code from fal.run (took ${SECONDS_TAKEN}s)"
        head -c 500 "$response_file" 2>/dev/null
        echo ""
        rm -f "$response_file"
        return 1
    fi

    # Extract GLB URL (try both nesting shapes per shared.md memory)
    local glb_url
    glb_url=$(python3 - "$response_file" <<'PYEOF'
import json, sys
try:
    with open(sys.argv[1]) as f:
        data = json.load(f)
except Exception:
    print("")
    sys.exit(0)

url = ""
# Shape A: model_urls.glb.url (nested object)
mu = data.get("model_urls", {})
if isinstance(mu, dict):
    glb = mu.get("glb")
    if isinstance(glb, dict):
        url = glb.get("url", "")
    elif isinstance(glb, str):
        url = glb
# Shape B: model_glb.url
if not url:
    mg = data.get("model_glb", {})
    if isinstance(mg, dict):
        url = mg.get("url", "")
# Shape C: glb_url top-level
if not url:
    url = data.get("glb_url", "") or ""
print(url)
PYEOF
)

    # Capture response request_id for traceability if present
    RESPONSE_ID=$(python3 - "$response_file" <<'PYEOF'
import json, sys
try:
    with open(sys.argv[1]) as f:
        data = json.load(f)
    print(data.get("request_id") or data.get("id") or "")
except Exception:
    print("")
PYEOF
)

    rm -f "$response_file"

    if [ -z "$glb_url" ] || [ "$glb_url" = "None" ]; then
        echo "  [$name] FAILED: no GLB URL in response (took ${SECONDS_TAKEN}s)"
        return 1
    fi

    # Download GLB
    if ! curl -s --max-time 180 -L -o "$output_path" "$glb_url"; then
        echo "  [$name] FAILED to download GLB from $glb_url"
        return 1
    fi

    SIZE=$(stat -f%z "$output_path" 2>/dev/null || echo "0")
    if [ "$SIZE" -lt 51200 ]; then
        echo "  [$name] FAILED size check: ${SIZE} bytes (< 50KB sanity threshold)"
        return 1
    fi

    return 0
}

# --- public wrapper: 1 retry on failure ---
generate_with_retry() {
    local image_path="$1"
    local output_path="$2"
    local name="$3"
    local prompt="$4"

    echo "[$name] image-to-3D start"
    echo "  Image:  $image_path"
    echo "  Output: $output_path"

    if attempt_generate "$image_path" "$output_path" "$name" "$prompt"; then
        echo "  [$name] OK   (size=${SIZE}B  time=${SECONDS_TAKEN}s  id=${RESPONSE_ID:-n/a})"
        echo "OK|$name|${SIZE}|${SECONDS_TAKEN}|${RESPONSE_ID:-}|attempt1" >> "$LOG_FILE"
        echo "$name|OK|${SIZE}|${SECONDS_TAKEN}|attempt1"
        return 0
    fi

    echo "  [$name] retry 1/1 ..."
    if attempt_generate "$image_path" "$output_path" "$name" "$prompt"; then
        echo "  [$name] OK   (size=${SIZE}B  time=${SECONDS_TAKEN}s  id=${RESPONSE_ID:-n/a})  -- after retry"
        echo "OK|$name|${SIZE}|${SECONDS_TAKEN}|${RESPONSE_ID:-}|attempt2" >> "$LOG_FILE"
        echo "$name|OK_RETRY|${SIZE}|${SECONDS_TAKEN}|attempt2"
        return 0
    fi

    echo "  [$name] FAILED after retry"
    echo "FAIL|$name|0|0||giveup" >> "$LOG_FILE"
    echo "$name|FAIL|0|0|giveup"
    return 1
}

# =============================================================================
# Bundle 5B model definitions
#
# Common prompt prefix preserves consistency: stylized low-poly, isometric
# RTS building, clean geometry, painted texture, transparent background not
# required (Meshy ignores it -- concept already cleaned by BiRefNet).
# =============================================================================

# key|input_png|output_glb|prompt
declare -a MODELS=(
"randstad-tertiary|randstad-tertiary.png|randstad/tertiary.glb|3D RTS game building, modern Randstad corporate tertiary structure (e.g. data center / co-working office), cool blue and steel grey palette, glass facade, minimalist corporate architecture, stylized low-poly, clean geometry, painted texture, isometric building"
"limburg-tertiary|limburg-tertiary.png|limburgers/tertiary.glb|3D RTS game building, Limburg countryside tertiary structure (mergel/limestone walls, terracotta roof tiles), warm earthy tones, hilly Burgundian aesthetic, stylized low-poly, clean geometry, painted texture, isometric building"
"belgen-tertiary|belgen-tertiary.png|belgen/tertiary.glb|3D RTS game building, Belgian medieval tertiary structure (brick gabled facade, ornate stepped roof), deep red and ochre palette, Flemish guildhall feel, stylized low-poly, clean geometry, painted texture, isometric building"
"brabant-upgrade|brabant-upgrade.png|brabanders/upgrade.glb|3D RTS game building, Brabant carnival upgrade structure (festive workshop with banners), warm orange-red-yellow carnival theme, Dutch brick farmhouse base, stylized low-poly, clean geometry, painted texture, isometric building"
"randstad-upgrade|randstad-upgrade.png|randstad/upgrade.glb|3D RTS game building, Randstad corporate upgrade tower (R&D lab / glass annex), cool blue steel-grey palette, sharp modernist lines, stylized low-poly, clean geometry, painted texture, isometric building"
"limburg-upgrade|limburg-upgrade.png|limburgers/upgrade.glb|3D RTS game building, Limburg upgrade structure (vlaaibakkerij / mining works with stone chimney), warm Burgundian palette, hilly mergel architecture, stylized low-poly, clean geometry, painted texture, isometric building"
"belgen-upgrade|belgen-upgrade.png|belgen/upgrade.glb|3D RTS game building, Belgian upgrade structure (brewery / chocolate workshop with copper kettles), deep red brick with bronze accents, Flemish industrial heritage, stylized low-poly, clean geometry, painted texture, isometric building"
"brabant-faction1|brabant-faction1.png|brabanders/special1.glb|3D RTS game building, Brabant faction-special structure (carnaval grand stage / prinsenkasteel), bright orange-red-yellow festive palette, Dutch farmhouse meets parade float, stylized low-poly, clean geometry, painted texture, isometric building"
"randstad-faction1|randstad-faction1.png|randstad/special1.glb|3D RTS game building, Randstad faction-special structure (HQ skyscraper with roof helipad), cool blue mirror glass and steel, sleek high-tech corporate, stylized low-poly, clean geometry, painted texture, isometric building"
"limburg-faction1|limburg-faction1.png|limburgers/special1.glb|3D RTS game building, Limburg faction-special structure (basilica / hilltop kasteel), warm sandstone and terracotta, Burgundian splendor, stylized low-poly, clean geometry, painted texture, isometric building"
"belgen-faction1|belgen-faction1.png|belgen/special1.glb|3D RTS game building, Belgian faction-special structure (cathedral hall / Brussels grand-place facade), deep red brick with gold trim, ornate Flemish gothic, stylized low-poly, clean geometry, painted texture, isometric building"
"brabant-tertiary|brabant-tertiary.png|brabanders/worstenbroodjeskraam.glb|3D RTS game building, festive Brabant carnival worstenbroodjes food stall (kraampje), warm wooden frame with awning, sausage rolls on counter, oranje-rood-geel carnival theme with small flag accent, painted detail, stylized low-poly, clean geometry, isometric building"
)

run_one() {
    local entry="$1"
    local name input_rel output_rel prompt
    IFS='|' read -r name input_rel output_rel prompt <<< "$entry"
    local input_abs="$CONCEPTS_DIR/$input_rel"
    local output_abs="$OUTPUT_DIR/$output_rel"
    generate_with_retry "$input_abs" "$output_abs" "$name" "$prompt"
}

# =============================================================================
# Execute -- sequential within batch (fail-isolation, easier credit-monitoring)
# Stops if 3 consecutive failures occur (likely quota/API down).
# =============================================================================

FILTER="${1:-all}"

CONSEC_FAIL=0
TOTAL_OK=0
TOTAL_FAIL=0
SKIPPED_AFTER_STOP=()

for entry in "${MODELS[@]}"; do
    name="${entry%%|*}"

    if [ "$FILTER" != "all" ] && [ "$FILTER" != "$name" ]; then
        continue
    fi

    if [ "$CONSEC_FAIL" -ge 3 ]; then
        echo "[$name] SKIPPED -- 3 consecutive failures, batch halted"
        SKIPPED_AFTER_STOP+=("$name")
        continue
    fi

    if run_one "$entry"; then
        CONSEC_FAIL=0
        TOTAL_OK=$((TOTAL_OK + 1))
    else
        CONSEC_FAIL=$((CONSEC_FAIL + 1))
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
    fi
    echo ""
done

# =============================================================================
# Status report
# =============================================================================
echo ""
echo "=== Bundle 5B Complete ==="
echo "OK:     $TOTAL_OK"
echo "FAIL:   $TOTAL_FAIL"
if [ "${#SKIPPED_AFTER_STOP[@]}" -gt 0 ]; then
    echo "SKIPPED (after consec-fail halt):"
    for s in "${SKIPPED_AFTER_STOP[@]}"; do
        echo "  - $s"
    done
fi
echo ""
echo "Per-GLB log:"
cat "$LOG_FILE"

# Build status JSON for downstream consumption
python3 - "$LOG_FILE" "$STATUS_FILE" <<'PYEOF'
import json, sys, os
log_file, out_file = sys.argv[1], sys.argv[2]
rows = []
with open(log_file) as f:
    for line in f:
        line = line.strip()
        if not line: continue
        parts = line.split("|")
        # OK|name|size|seconds|response_id|attempt
        # FAIL|name|0|0||giveup
        status = parts[0]
        rows.append({
            "name": parts[1] if len(parts) > 1 else "",
            "status": status,
            "size_bytes": int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0,
            "seconds": int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else 0,
            "response_id": parts[4] if len(parts) > 4 else "",
            "attempt": parts[5] if len(parts) > 5 else "",
        })
ok = sum(1 for r in rows if r["status"] == "OK")
fail = sum(1 for r in rows if r["status"] == "FAIL")
total_seconds = sum(r["seconds"] for r in rows)
avg_size = (sum(r["size_bytes"] for r in rows if r["status"] == "OK") / ok) if ok else 0
out = {
    "bundle": "5B",
    "ok": ok,
    "fail": fail,
    "total_api_seconds": total_seconds,
    "avg_glb_bytes_ok": int(avg_size),
    "rows": rows,
}
with open(out_file, "w") as f:
    json.dump(out, f, indent=2)
print(f"Status JSON: {out_file}")
PYEOF

if [ "$TOTAL_FAIL" -gt 0 ] || [ "${#SKIPPED_AFTER_STOP[@]}" -gt 0 ]; then
    exit 2
fi
exit 0
