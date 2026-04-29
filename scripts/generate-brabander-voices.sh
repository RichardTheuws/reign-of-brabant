#!/bin/bash
# Generate ALL Brabander faction voice lines via ElevenLabs TTS API
# Voice: Richard (KJMAev3goFD3WOh1hVBT) — Zuid-Oost Brabants dialect
# Total: 8 units * 15 lines + 18 generic = 138 files

set -uo pipefail

# Load API key
set -a && source /Users/richardtheuws/Documents/games/.env && set +a
API_KEY="${ELEVENLABS_API_KEY}"
BASE_DIR="/Users/richardtheuws/Documents/games/reign-of-brabant/public/assets/audio/voices/brabanders"
MODEL="eleven_multilingual_v2"

# Voice IDs
RICHARD_VOICE="KJMAev3goFD3WOh1hVBT"

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

    # Ensure dir
    mkdir -p "$(dirname "$output_path")"

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
        echo "  OK: $(basename "$(dirname "$output_path")")/$(basename "$output_path") (${size} bytes) — \"${text}\""
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  FAIL (HTTP ${http_code}): $output_path — text: \"${text}\""
        FAIL=$((FAIL + 1))
        rm -f "$output_path"
    fi

    sleep 0.35
}

echo "======================================"
echo "Brabander Faction Voice Generation"
echo "Voice: Richard (${RICHARD_VOICE})"
echo "======================================"
echo "Total files to generate: ${TOTAL}"
echo ""

VID="${RICHARD_VOICE}"

# ============================================================
# UNIT: boer (worker — calm, grounded)
# ============================================================
echo "[1/9] boer (worker — calm, grounded)"
UNIT_DIR="${BASE_DIR}/boer"
ST=0.50; SIM=0.85; STY=0.40

generate_line "$VID" "$ST" "$SIM" "$STY" "Goeiendag." "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den boer stao klaor." "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wa moet er gebeuren?" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik gao." "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Komt voor mekaor." "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Onderweg." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Met de schup!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ge krijgt er ene!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Hier hedde'm!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den akker..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Och kjeere..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Schup uit den grond!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Veul wèrk gemokt!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Effe pauze." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den dag is lang." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: carnavalvierder (infantry — loud, euphoric)
# ============================================================
echo ""
echo "[2/9] carnavalvierder (infantry — loud, euphoric)"
UNIT_DIR="${BASE_DIR}/carnavalvierder"
ST=0.35; SIM=0.85; STY=0.70

generate_line "$VID" "$ST" "$SIM" "$STY" "ALAAF!" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den hèèl is begonnen!" "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Tjoep, daar bende ge!" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op naar de optocht!" "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Hossen!" "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vurraf, vurraf!" "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Voor Den Prins!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Recht op de bek!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "ALAAF, slao toe!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mun pilske..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den hèèl is op..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Polonaise!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "ALAAF, alleman!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Effe un pilske vatte." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Tonpraot, alaaf!" "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: sluiper (ranged — whispery, sneaky)
# ============================================================
echo ""
echo "[3/9] sluiper (ranged — whispery, sneaky)"
UNIT_DIR="${BASE_DIR}/sluiper"
ST=0.55; SIM=0.85; STY=0.45

generate_line "$VID" "$ST" "$SIM" "$STY" "Ssjt." "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Stillekes." "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Niemand ziet mun." "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Door de struiken." "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op kousen." "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ge hoort mun nie." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ge ziet 't nie aankomen." "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Recht in de rug." "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vat 'm." "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Verraod..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Gezien..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Onzichtbaar." "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mes uit den schee." "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik wacht." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "In de schaduw." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: tractorrijder (heavy — boer-met-attitude, brommig)
# ============================================================
echo ""
echo "[4/9] tractorrijder (heavy — boer-met-attitude)"
UNIT_DIR="${BASE_DIR}/tractorrijder"
ST=0.45; SIM=0.85; STY=0.50

generate_line "$VID" "$ST" "$SIM" "$STY" "De trekker brult." "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wa wilde gij?" "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Diesel staot in." "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Aan de kant!" "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vol gas, alleman!" "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den trekker rolt." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Onder de banden!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ge wordt platgereje!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Boem, daar gao'm!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mun trekker..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Motor draait nie meer..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Tractor charge!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Volle dieselbak!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Effe draaien op den dorpel." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De motor staot stationair." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: frituurmeester (siege — friet trots, vet)
# ============================================================
echo ""
echo "[5/9] frituurmeester (siege — friet, vet, trots)"
UNIT_DIR="${BASE_DIR}/frituurmeester"
ST=0.45; SIM=0.85; STY=0.55

generate_line "$VID" "$ST" "$SIM" "$STY" "De frituur stao klaor!" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wa magget zen?" "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "'t Vet is heet!" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De kar rolt!" "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Naor 't dorpsplein!" "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den frietkraom op pad." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Hete frieten in de smoel!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Frikandel speciaal!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vet recht in 't gezicht!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den frituurpan..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "'t Vet is op..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Volle bak frieten!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mayonaise-aanval!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vet moet opwarmen." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wie wilt'er nog patatten?" "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: boerinne (support — vrouwelijk, warm, Brabants)
# ============================================================
echo ""
echo "[6/9] boerinne (support — vrouwelijk, warm)"
UNIT_DIR="${BASE_DIR}/boerinne"
ST=0.45; SIM=0.85; STY=0.50

generate_line "$VID" "$ST" "$SIM" "$STY" "Schôn jong, hier ben ik." "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Wa hedde noddig?" "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De boerinne luistert." "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik kom d'r aan." "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Met liefde, jong." "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op pad." "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Met de hooivork!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ge krijgt er van langs!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Niemand komt aan munne hof!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Och kjeere..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den hof valt..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Een wèrm bord soep!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Worstebrood voor allemaal!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Effe in 't huiske." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De koffie stao klaor." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: praalwagen (special — feestelijk, optocht)
# ============================================================
echo ""
echo "[7/9] praalwagen (special — feest, optocht)"
UNIT_DIR="${BASE_DIR}/praalwagen"
ST=0.40; SIM=0.85; STY=0.65

generate_line "$VID" "$ST" "$SIM" "$STY" "De praalwagen rolt!" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Op de wagen, alleman!" "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "ALAAF, optocht begint!" "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Door de straot!" "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Confetti naor links en rechts!" "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De wagen rolt deur!" "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Confetti-bom!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "ALAAF, recht in de smoel!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Onder de praalwagen!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De wagen wankelt..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De optocht is gedaon..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Volle confetti-storm!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Worstebrood-regen!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Effe stilstaon, foto!" "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De muziek speelt deur." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# UNIT: prins-van-brabant (hero — leider, charismatisch)
# ============================================================
echo ""
echo "[8/9] prins-van-brabant (hero — leider)"
UNIT_DIR="${BASE_DIR}/prins-van-brabant"
ST=0.45; SIM=0.85; STY=0.60

generate_line "$VID" "$ST" "$SIM" "$STY" "Den Prins is hier!" "${UNIT_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Spreek, mun volk." "${UNIT_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik luister." "${UNIT_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den Prins gao voorop!" "${UNIT_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Volg munne wagen!" "${UNIT_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Naor de overwinning!" "${UNIT_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Voor heel Brabant!" "${UNIT_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den Prins slao toe!" "${UNIT_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ge hebt 't tegen mun!" "${UNIT_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Mun volk..." "${UNIT_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "De steek valt..." "${UNIT_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Bij munne kroon!" "${UNIT_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den Prins beveelt!" "${UNIT_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Den Prins waakt." "${UNIT_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Brabant rust nie." "${UNIT_DIR}/idle_2.mp3"

# ============================================================
# GENERIC FACTION FALLBACK (warm Brabants, neutraal)
# ============================================================
echo ""
echo "[9/9] Generic faction fallback"
ST=0.45; SIM=0.85; STY=0.45

generate_line "$VID" "$ST" "$SIM" "$STY" "Jao?" "${BASE_DIR}/select_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Hier bende." "${BASE_DIR}/select_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Zegt 't moar." "${BASE_DIR}/select_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ik gao." "${BASE_DIR}/move_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Onderweg." "${BASE_DIR}/move_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Komt voor mekaor." "${BASE_DIR}/move_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Pak 'm vast!" "${BASE_DIR}/attack_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Ge krijgt er van!" "${BASE_DIR}/attack_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Voor Brabant!" "${BASE_DIR}/attack_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Och nee..." "${BASE_DIR}/death_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Verloren..." "${BASE_DIR}/death_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Aan 't wèrk." "${BASE_DIR}/gather_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Verzamelen alleman." "${BASE_DIR}/gather_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Volop bezig." "${BASE_DIR}/gather_3.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Vurraf!" "${BASE_DIR}/ability_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Nou!" "${BASE_DIR}/ability_2.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "Effe wachten." "${BASE_DIR}/idle_1.mp3"
generate_line "$VID" "$ST" "$SIM" "$STY" "'t Is rustig." "${BASE_DIR}/idle_2.mp3"

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
