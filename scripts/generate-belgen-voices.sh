#!/bin/bash
# Generate ALL Belgen faction voice lines via ElevenLabs TTS API
# Total: 120 unit files + 18 generic = 138 files

set -euo pipefail

# Load API key
API_KEY=$(grep ELEVENLABS_API_KEY /Users/richardtheuws/Documents/games/.env | cut -d'=' -f2)
BASE_DIR="/Users/richardtheuws/Documents/games/reign-of-brabant/public/assets/audio/voices/belgen"
MODEL="eleven_multilingual_v2"

# Voice IDs
HANS_VOICE="s7Z6uboUuE4Nd8Q2nye6"
PETRA_VOICE="ANHrhmaFeVN0QJaa0PhL"
WALTER_VOICE="tRyB8BgRzpNUv3o2XWD4"

# Counters
SUCCESS=0
FAIL=0
SKIP=0
TOTAL=138

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

    local response
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
            \"voice_settings\": {
                \"stability\": ${stability},
                \"similarity_boost\": ${similarity},
                \"style\": ${style}
            }
        }")

    if [[ "$http_code" == "200" ]] && [[ -f "$output_path" ]] && [[ $(stat -f%z "$output_path" 2>/dev/null || echo 0) -gt 500 ]]; then
        local size=$(stat -f%z "$output_path")
        echo "  OK: $(basename "$output_path") (${size} bytes)"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  FAIL (HTTP ${http_code}): $(basename "$output_path") - text: ${text}"
        FAIL=$((FAIL + 1))
        # Remove failed file
        rm -f "$output_path"
    fi

    # Rate limit: ~3 requests per second to stay safe
    sleep 0.35
}

echo "======================================"
echo "Belgen Faction Voice Generation"
echo "======================================"
echo "Total files to generate: ${TOTAL}"
echo ""

# ============================================================
# UNIT: frietkraamhouder (Hans Claesen)
# ============================================================
echo "[1/9] frietkraamhouder (Hans Claesen)"
UNIT_DIR="${BASE_DIR}/frietkraamhouder"
VID="${HANS_VOICE}"; ST=0.50; SIM=0.75; STY=0.35

generate_line "$VID" "$ST" "$SIM" "$STY" "Awel?" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik sta hier." "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wa mag 't zijn?" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez, ik ga." "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vooruit dan." "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op weg." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Met de frietschep!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Gij daar!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Een friet in uw oog!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De frituur..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mijn kraam..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Speciale saus!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Stoofvlees!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Frieten bakken." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wie wil er nog?" "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: bierbouwer (Hans Claesen)
# ============================================================
echo ""
echo "[2/9] bierbouwer (Hans Claesen)"
UNIT_DIR="${BASE_DIR}/bierbouwer"

generate_line "$VID" "$ST" "$SIM" "$STY" "Een pintje?" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De brouwer is paraat." "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Zegt het ne keer." "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez, vooruit!" "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik marcheer." "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op weg!" "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Nen dreupel courage!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Aanvallen!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Gij krijgt ervan!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Het bier... vloeit..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Laatste ronde..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Proost!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Schol!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Tijd voor een pint." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De brouwerij wacht." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: chocolatier (Hans Claesen)
# ============================================================
echo ""
echo "[3/9] chocolatier (Hans Claesen)"
UNIT_DIR="${BASE_DIR}/chocolatier"

generate_line "$VID" "$ST" "$SIM" "$STY" "Bonbon?" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De chocolatier luistert." "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Oui?" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Met plezier." "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Elegant." "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op mijn manier." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Praline projectiel!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Chocolade bom!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Smelt!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De chocolade... smelt..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mon dieu..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Truffel!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Bonbon regen!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Even temperen." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De cacao moet rusten." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: frituurridder (Hans Claesen)
# ============================================================
echo ""
echo "[4/9] frituurridder (Hans Claesen)"
UNIT_DIR="${BASE_DIR}/frituurridder"

generate_line "$VID" "$ST" "$SIM" "$STY" "De ridder is er!" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vettig maar sterk!" "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez!" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De ridder rijdt!" "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Uit de weg!" "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vol gas!" "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Frituurslag!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Nen vetten klop!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Frietridder valt aan!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Het vet... stolt..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De frietketel..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Frituurcharge!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vette dreun!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Even uitdruipen." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Het vet moet opwarmen." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: manneken-pis-kanon (Hans Claesen)
# ============================================================
echo ""
echo "[5/9] manneken-pis-kanon (Hans Claesen)"
UNIT_DIR="${BASE_DIR}/manneken-pis-kanon"

generate_line "$VID" "$ST" "$SIM" "$STY" "Het kanon is geladen!" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Manneken Pis paraat!" "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Druk?" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "We verplaatsen!" "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Naar het front!" "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Rollen maar!" "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vuur!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Manneken Pis schiet!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Nat gespoten!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Het kanon... lekt..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Droog..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Volle druk!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Waterkanon!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Even bijvullen." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De druk bouwt op." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: wafelzuster (Petra Vlaams)
# ============================================================
echo ""
echo "[6/9] wafelzuster (Petra Vlaams)"
UNIT_DIR="${BASE_DIR}/wafelzuster"
VID="${PETRA_VOICE}"; ST=0.45; SIM=0.75; STY=0.50

generate_line "$VID" "$ST" "$SIM" "$STY" "Een wafeltje?" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De zuster is hier." "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Oui?" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Met liefde." "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik kom." "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op pad." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Hete wafel!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "In uw gezicht!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wafelijzer!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De wafels... verbranden..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mon dieu..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Genezende wafel!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Suiker helpt!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Even het ijzer opwarmen." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wie lust er een wafel?" "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: dubbele-spion (Hans Claesen)
# ============================================================
echo ""
echo "[7/9] dubbele-spion (Hans Claesen)"
UNIT_DIR="${BASE_DIR}/dubbele-spion"
VID="${HANS_VOICE}"; ST=0.50; SIM=0.75; STY=0.35

generate_line "$VID" "$ST" "$SIM" "$STY" "Welke kant?" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik werk voor iedereen." "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ssst." "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Discreet." "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Niemand ziet mij." "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "In de schaduw." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Verrassing!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Dubbelspel!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Van twee kanten!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ontmaskerd..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Beide kanten... verloren..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Compromis!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Diplomatie!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik observeer." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Beide partijen vertrouwen mij." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: de-frietkoning (Walter)
# ============================================================
echo ""
echo "[8/9] de-frietkoning (Walter)"
UNIT_DIR="${BASE_DIR}/de-frietkoning"
VID="${WALTER_VOICE}"; ST=0.50; SIM=0.75; STY=0.40

generate_line "$VID" "$ST" "$SIM" "$STY" "De Frietkoning spreekt." "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez, wat is er?" "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik luister." "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Het koninkrijk beweegt." "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Voorwaarts!" "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De koning marcheert." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Voor de frieten!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Belgie valt aan!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Koninklijke aanval!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Het koninkrijk... valt..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mijn laatste... frietje..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Koninklijk decreet!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Compromis van de koning!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Een koning rust nooit." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De frituren draaien." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# GENERIC FACTION FALLBACK (Hans Claesen)
# ============================================================
echo ""
echo "[9/9] Generic faction fallback (Hans Claesen)"
VID="${HANS_VOICE}"; ST=0.50; SIM=0.75; STY=0.35

generate_line "$VID" "$ST" "$SIM" "$STY" "Awel?" "${BASE_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Hier." "${BASE_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Zegt het." "${BASE_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez." "${BASE_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op weg." "${BASE_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vooruit." "${BASE_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Aanvallen!" "${BASE_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Gij krijgt ervan!" "${BASE_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez, op ze!" "${BASE_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Non..." "${BASE_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mon dieu..." "${BASE_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Aan 't werk." "${BASE_DIR}/gather_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Verzamelen." "${BASE_DIR}/gather_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Bakken." "${BASE_DIR}/gather_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Allez!" "${BASE_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Nu!" "${BASE_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Rustig hier." "${BASE_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "'t Is stil." "${BASE_DIR}/idle_2.mp3"

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

echo "All voice lines generated successfully!"
