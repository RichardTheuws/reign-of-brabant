#!/bin/bash
# Generate Limburgs female generic pool via Nick origineel
# Voice: Nick "transgender Limburger" framing (PrYUlaJFEdOSVy6jaEaG)
# Total: 22 files in public/assets/audio/voices/limburgers/female/
# Tone: vrouwelijk-toned Limburgs dialect — "Miene leef", "Hajje", "Joa",
#       "Glück auf", "ich kom", "veurspring"
# Per UnitVoices.ts FEMALE_GENERIC_VOICE_LINES[2] expected counts:
#   select 3, move 3, attack 3, gather 3, death 2, ability 3, idle 2, ready 3

set -euo pipefail

# Load API key
set -a
source /Users/richardtheuws/Documents/games/.env
set +a
API_KEY="${ELEVENLABS_API_KEY}"

BASE_DIR="/Users/richardtheuws/Documents/games/reign-of-brabant/public/assets/audio/voices/limburgers/female"
MODEL="eleven_multilingual_v2"

# Voice ID — Nick origineel ("transgender Limburger" framing als female pool)
NICK_VOICE="PrYUlaJFEdOSVy6jaEaG"

# Voice settings — softer/expressive tilt for vrouwelijk timbre
ST=0.30
SIM=0.85
STY=0.65

# Counters
SUCCESS=0
FAIL=0
SKIP=0
TOTAL=22

mkdir -p "${BASE_DIR}"

generate_line() {
    local text="$1"
    local output_path="$2"

    # Skip if already exists and has content
    if [[ -f "$output_path" ]] && [[ $(stat -f%z "$output_path" 2>/dev/null || echo 0) -gt 1000 ]]; then
        echo "  SKIP (exists): $(basename "$output_path")"
        SKIP=$((SKIP + 1))
        return 0
    fi

    local http_code
    http_code=$(curl -s -w "%{http_code}" -o "$output_path" \
        -X POST "https://api.elevenlabs.io/v1/text-to-speech/${NICK_VOICE}" \
        -H "xi-api-key: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -H "Accept: audio/mpeg" \
        -d "{
            \"text\": \"${text}\",
            \"model_id\": \"${MODEL}\",
            \"language_code\": \"nl\",
            \"apply_text_normalization\": \"off\",
            \"voice_settings\": {
                \"stability\": ${ST},
                \"similarity_boost\": ${SIM},
                \"style\": ${STY},
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
echo "Limburgers FEMALE pool — Nick origineel"
echo "======================================"
echo "Voice: ${NICK_VOICE}"
echo "Total files: ${TOTAL}"
echo "Output: ${BASE_DIR}"
echo ""

# select (3) — vrouwelijk-Limburgs, zacht en zelfverzekerd
generate_line "Glück auf, miene leef." "${BASE_DIR}/select_1.mp3"
generate_line "Ich sjtaon klaor, jong." "${BASE_DIR}/select_2.mp3"
generate_line "Wat moot er gebäure?" "${BASE_DIR}/select_3.mp3"

# move (3) — onderweg, vrouwelijk perspectief
generate_line "Joa, ich gaon." "${BASE_DIR}/move_1.mp3"
generate_line "Hajje, ich kom." "${BASE_DIR}/move_2.mp3"
generate_line "Onderweg de berg in." "${BASE_DIR}/move_3.mp3"

# attack (3) — kordaat, vrouwelijk-stoer
generate_line "Joa veurspring!" "${BASE_DIR}/attack_1.mp3"
generate_line "Doe krijgs er ein!" "${BASE_DIR}/attack_2.mp3"
generate_line "Mèt mèl en al!" "${BASE_DIR}/attack_3.mp3"

# gather (3) — werkend, mergel-vocab
generate_line "Aan 't werk, jong." "${BASE_DIR}/gather_1.mp3"
generate_line "Mergel haole." "${BASE_DIR}/gather_2.mp3"
generate_line "Volop bezig." "${BASE_DIR}/gather_3.mp3"

# death (2) — vrouwelijk-Limburgs sterven, moeke-referentie
generate_line "Och nei... moeke..." "${BASE_DIR}/death_1.mp3"
generate_line "De berg neemt mich op..." "${BASE_DIR}/death_2.mp3"

# ability (3) — Glück auf + vrouwelijk-magisch
generate_line "Glück auf!" "${BASE_DIR}/ability_1.mp3"
generate_line "Bij mien moeder de berg!" "${BASE_DIR}/ability_2.mp3"
generate_line "Volle krach, kindere!" "${BASE_DIR}/ability_3.mp3"

# idle (2) — wachten, rustig
generate_line "Effe wachte." "${BASE_DIR}/idle_1.mp3"
generate_line "'t Is rustig in de berg." "${BASE_DIR}/idle_2.mp3"

# ready (3) — paraat, vrouwelijk-vriendelijk
generate_line "Get ich noemt sjpisser?" "${BASE_DIR}/ready_1.mp3"
generate_line "Ich bin reej, jong." "${BASE_DIR}/ready_2.mp3"
generate_line "Gemeld, miene leef." "${BASE_DIR}/ready_3.mp3"

# ============================================================
# SUMMARY
# ============================================================
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

echo "Limburgs female pool generated via Nick origineel (${NICK_VOICE})!"
echo "Run scripts/normalize-voices.sh --all to normalize loudness."
