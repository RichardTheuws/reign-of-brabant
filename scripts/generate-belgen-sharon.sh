#!/bin/bash
# Generate Sharon Vlaams (2nd female Belgen voice) generic pool
# Total: 20 files in public/assets/audio/voices/belgen/sharon/
# Tone: Vlaams (ge/gij, "amai", "allez", "voila"), articulate young lady

set -euo pipefail

# Load API key (use ELEVENLABS_API_KEY from .env)
set -a
source /Users/richardtheuws/Documents/games/.env
set +a
API_KEY="${ELEVENLABS_API_KEY}"

BASE_DIR="/Users/richardtheuws/Documents/games/reign-of-brabant/public/assets/audio/voices/belgen/sharon"
MODEL="eleven_multilingual_v2"

# Voice ID — Sharon Vlaams (Articulate News Reporter)
SHARON_VOICE="g7B5PNoscIXomLNUmHAb"

# Voice settings (per spec)
ST=0.40
SIM=0.85
STY=0.55

# Counters
SUCCESS=0
FAIL=0
SKIP=0
TOTAL=20

mkdir -p "${BASE_DIR}"

generate_line() {
    local voice_id="$1"
    local stability="$2"
    local similarity="$3"
    local style="$4"
    local text="$5"
    local output_path="$6"

    # Skip if already exists and has content
    if [[ -f "$output_path" ]] && [[ $(stat -f%z "$output_path" 2>/dev/null || echo 0) -gt 1000 ]]; then
        echo "  SKIP (exists): $(basename "$output_path")"
        SKIP=$((SKIP + 1))
        return 0
    fi

    local http_code
    http_code=$(curl -s -w "%{http_code}" -o "$output_path" \
        -X POST "https://api.elevenlabs.io/v1/text-to-speech/${voice_id}" \
        -H "xi-api-key: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -H "Accept: audio/mpeg" \
        -d "{
            \"text\": \"${text}\",
            \"model_id\": \"${MODEL}\",
            \"language_code\": \"nl\",
            \"apply_text_normalization\": \"off\",
            \"voice_settings\": {
                \"stability\": ${stability},
                \"similarity_boost\": ${similarity},
                \"style\": ${style},
                \"use_speaker_boost\": true
            }
        }")

    if [[ "$http_code" == "200" ]] && [[ -f "$output_path" ]] && [[ $(stat -f%z "$output_path" 2>/dev/null || echo 0) -gt 500 ]]; then
        local size=$(stat -f%z "$output_path")
        echo "  OK: $(basename "$output_path") (${size} bytes)"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  FAIL (HTTP ${http_code}): $(basename "$output_path") - text: ${text}"
        FAIL=$((FAIL + 1))
        rm -f "$output_path"
    fi

    sleep 0.35
}

echo "======================================"
echo "Sharon Vlaams Generic Belgen Pool"
echo "======================================"
echo "Voice: ${SHARON_VOICE}"
echo "Total files to generate: ${TOTAL}"
echo "Output: ${BASE_DIR}"
echo ""

VID="${SHARON_VOICE}"

# select (3)
generate_line "$VID" "$ST" "$SIM" "$STY" "Voila, hier ben ik." "${BASE_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez, wat is er?" "${BASE_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik luister, meneer." "${BASE_DIR}/select_3.mp3"

# move (3)
generate_line "$VID" "$ST" "$SIM" "$STY" "Met plezier, allez." "${BASE_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Voila, ik ga." "${BASE_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op weg, mijnheer." "${BASE_DIR}/move_3.mp3"

# attack (3)
generate_line "$VID" "$ST" "$SIM" "$STY" "Amai, gij vraagt erom!" "${BASE_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez, op hen!" "${BASE_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Gij krijgt ervan!" "${BASE_DIR}/attack_3.mp3"

# gather (3)
generate_line "$VID" "$ST" "$SIM" "$STY" "Aan 't werk, voila." "${BASE_DIR}/gather_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik verzamel." "${BASE_DIR}/gather_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez, oogsten." "${BASE_DIR}/gather_3.mp3"

# death (2)
generate_line "$VID" "$ST" "$SIM" "$STY" "Amai... voila..." "${BASE_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez, 't is gedaan..." "${BASE_DIR}/death_2.mp3"

# ability (2)
generate_line "$VID" "$ST" "$SIM" "$STY" "Voila, het compromis!" "${BASE_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Amai, kijk eens!" "${BASE_DIR}/ability_2.mp3"

# idle (2)
generate_line "$VID" "$ST" "$SIM" "$STY" "'t Is rustig, allez." "${BASE_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik wacht geduldig." "${BASE_DIR}/idle_2.mp3"

# ready (2)
generate_line "$VID" "$ST" "$SIM" "$STY" "Voila, ik ben klaar." "${BASE_DIR}/ready_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Paraat, mijnheer." "${BASE_DIR}/ready_2.mp3"

echo ""
echo "======================================"
echo "GENERATION COMPLETE"
echo "======================================"
echo "Success: ${SUCCESS}"
echo "Failed:  ${FAIL}"
echo "Skipped: ${SKIP}"
echo "Total:   $((SUCCESS + FAIL + SKIP)) / ${TOTAL}"
echo ""

if [[ $FAIL -gt 0 ]]; then
    echo "WARNING: ${FAIL} files failed to generate!"
    exit 1
fi

echo "All Sharon voice lines generated successfully!"
