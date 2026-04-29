#!/bin/bash
# Generate ALL Limburgers faction voice lines via ElevenLabs TTS API
# Voice: Reinoud "De nasale limburger" (5tiZStRJQ98Xw420MFFx)
# Total: 8 units × 20 lines + 20 generic = 180 files
# Tone: Limburgs dialect — ich/dich, neet, waat, mèt, sjoen, hajje, Gluck auf!
# Style: gewichtig, traag, melodisch, korte zinnen (2-8 woorden)

set -euo pipefail

# Load API key
set -a
source /Users/richardtheuws/Documents/games/.env
set +a
API_KEY="${ELEVENLABS_API_KEY}"

BASE_DIR="/Users/richardtheuws/Documents/games/reign-of-brabant/public/assets/audio/voices/limburgers"
MODEL="eleven_multilingual_v2"
VOICE_ID="5tiZStRJQ98Xw420MFFx"

# Voice settings — Reinoud nasale rust: hogere stability voor consistentie
STABILITY=0.45
SIMILARITY=0.85
STYLE=0.55

# Counters
SUCCESS=0
FAIL=0
SKIP=0
TOTAL=180

generate_line() {
    local text="$1"
    local output_path="$2"

    local http_code
    http_code=$(curl -s -w "%{http_code}" -o "$output_path" \
        -X POST "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
        -H "xi-api-key: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -H "Accept: audio/mpeg" \
        -d "{
            \"text\": \"${text}\",
            \"model_id\": \"${MODEL}\",
            \"language_code\": \"nl\",
            \"apply_text_normalization\": \"off\",
            \"voice_settings\": {
                \"stability\": ${STABILITY},
                \"similarity_boost\": ${SIMILARITY},
                \"style\": ${STYLE},
                \"use_speaker_boost\": true
            }
        }")

    if [[ "$http_code" == "200" ]] && [[ -f "$output_path" ]] && [[ $(stat -f%z "$output_path" 2>/dev/null || echo 0) -gt 500 ]]; then
        local size=$(stat -f%z "$output_path")
        echo "  OK: $(basename "$(dirname "$output_path")")/$(basename "$output_path") (${size} bytes)"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  FAIL (HTTP ${http_code}): $output_path - text: ${text}"
        FAIL=$((FAIL + 1))
        rm -f "$output_path"
    fi

    sleep 0.35
}

echo "======================================"
echo "Limburgers Voice Regeneration (Reinoud)"
echo "======================================"
echo "Voice: ${VOICE_ID}"
echo "Total files: ${TOTAL}"
echo ""

# ============================================================
# UNIT: mijnwerker (worker — humble, hardworking)
# ============================================================
echo "[1/8] mijnwerker"
UNIT_DIR="${BASE_DIR}/mijnwerker"
generate_line "Gluck auf!" "${UNIT_DIR}/select_1.mp3"
generate_line "Ich bin der." "${UNIT_DIR}/select_2.mp3"
generate_line "Waat motte vandaag?" "${UNIT_DIR}/select_3.mp3"
generate_line "Naor de mien." "${UNIT_DIR}/move_1.mp3"
generate_line "Ich loop al." "${UNIT_DIR}/move_2.mp3"
generate_line "Komt good." "${UNIT_DIR}/move_3.mp3"
generate_line "Mèt de pikhouwiel!" "${UNIT_DIR}/attack_1.mp3"
generate_line "Doow vraag um klop!" "${UNIT_DIR}/attack_2.mp3"
generate_line "Hajje, plet!" "${UNIT_DIR}/attack_3.mp3"
generate_line "De sjacht... duusterk..." "${UNIT_DIR}/death_1.mp3"
generate_line "Mam... ich kom thoes neet..." "${UNIT_DIR}/death_2.mp3"
generate_line "Ich graaf deeper!" "${UNIT_DIR}/ability_1.mp3"
generate_line "Veurraod gevonge!" "${UNIT_DIR}/ability_2.mp3"
generate_line "Effe noa de boterham." "${UNIT_DIR}/idle_1.mp3"
generate_line "Stof in de longe." "${UNIT_DIR}/idle_2.mp3"
generate_line "Aan de gang." "${UNIT_DIR}/gather_1.mp3"
generate_line "Kole haole." "${UNIT_DIR}/gather_2.mp3"
generate_line "Mergel, sjoen mergel." "${UNIT_DIR}/gather_3.mp3"
generate_line "Gluck auf, kameroad!" "${UNIT_DIR}/ready_1.mp3"
generate_line "Reej veur de sjacht." "${UNIT_DIR}/ready_2.mp3"

# ============================================================
# UNIT: schutterij (infantry — fierce defender, ceremonial pride)
# ============================================================
echo ""
echo "[2/8] schutterij"
UNIT_DIR="${BASE_DIR}/schutterij"
generate_line "Sint Sebastianus paraat." "${UNIT_DIR}/select_1.mp3"
generate_line "De schutterij sjteit." "${UNIT_DIR}/select_2.mp3"
generate_line "Bevel, kapitein?" "${UNIT_DIR}/select_3.mp3"
generate_line "Mèt vendel veurop." "${UNIT_DIR}/move_1.mp3"
generate_line "Wae marsjere." "${UNIT_DIR}/move_2.mp3"
generate_line "Aan de orde, mannen." "${UNIT_DIR}/move_3.mp3"
generate_line "Veur Sint Sebastianus!" "${UNIT_DIR}/attack_1.mp3"
generate_line "Doow weurst neergesjote!" "${UNIT_DIR}/attack_2.mp3"
generate_line "Geweer aan de sjouwer!" "${UNIT_DIR}/attack_3.mp3"
generate_line "Het vendel... velt..." "${UNIT_DIR}/death_1.mp3"
generate_line "Veur eer en land..." "${UNIT_DIR}/death_2.mp3"
generate_line "Salvo!" "${UNIT_DIR}/ability_1.mp3"
generate_line "Eresalvo!" "${UNIT_DIR}/ability_2.mp3"
generate_line "Wae waachte." "${UNIT_DIR}/idle_1.mp3"
generate_line "Kruut blief drueg." "${UNIT_DIR}/idle_2.mp3"
generate_line "Munitie haole." "${UNIT_DIR}/gather_1.mp3"
generate_line "Veur de kompenie." "${UNIT_DIR}/gather_2.mp3"
generate_line "Aan 't werk." "${UNIT_DIR}/gather_3.mp3"
generate_line "Gemeld bie de schutterij." "${UNIT_DIR}/ready_1.mp3"
generate_line "Veur eer en plicht." "${UNIT_DIR}/ready_2.mp3"

# ============================================================
# UNIT: vlaaienwerper (ranged — bakker-with-violence)
# ============================================================
echo ""
echo "[3/8] vlaaienwerper"
UNIT_DIR="${BASE_DIR}/vlaaienwerper"
generate_line "Versje vlaai!" "${UNIT_DIR}/select_1.mp3"
generate_line "Bakker mèt geweld." "${UNIT_DIR}/select_2.mp3"
generate_line "Kruusbessenvlaai?" "${UNIT_DIR}/select_3.mp3"
generate_line "De oven mit me mei." "${UNIT_DIR}/move_1.mp3"
generate_line "Ich loop naor 't sjlachveld." "${UNIT_DIR}/move_2.mp3"
generate_line "Doog noa, ich kom." "${UNIT_DIR}/move_3.mp3"
generate_line "Hete vlaai!" "${UNIT_DIR}/attack_1.mp3"
generate_line "Recht in de smoel!" "${UNIT_DIR}/attack_2.mp3"
generate_line "Pak aan, kruusbessen!" "${UNIT_DIR}/attack_3.mp3"
generate_line "De oven... is uut..." "${UNIT_DIR}/death_1.mp3"
generate_line "Mien deeg... versjroeit..." "${UNIT_DIR}/death_2.mp3"
generate_line "Vlaaienregen!" "${UNIT_DIR}/ability_1.mp3"
generate_line "Drie vlaaien tegelijk!" "${UNIT_DIR}/ability_2.mp3"
generate_line "Ich bak nog effe." "${UNIT_DIR}/idle_1.mp3"
generate_line "De vulling moot kaud." "${UNIT_DIR}/idle_2.mp3"
generate_line "Bloem haole." "${UNIT_DIR}/gather_1.mp3"
generate_line "Sukker veur de vlaai." "${UNIT_DIR}/gather_2.mp3"
generate_line "Mèl en boter." "${UNIT_DIR}/gather_3.mp3"
generate_line "Versj uut de oven." "${UNIT_DIR}/ready_1.mp3"
generate_line "Vlaaien klaor." "${UNIT_DIR}/ready_2.mp3"

# ============================================================
# UNIT: mergelridder (heavy — minimalistic, strong, stone-like)
# ============================================================
echo ""
echo "[4/8] mergelridder"
UNIT_DIR="${BASE_DIR}/mergelridder"
generate_line "Mergel." "${UNIT_DIR}/select_1.mp3"
generate_line "Steen sjpreekt." "${UNIT_DIR}/select_2.mp3"
generate_line "Ja." "${UNIT_DIR}/select_3.mp3"
generate_line "Ich loop." "${UNIT_DIR}/move_1.mp3"
generate_line "Sjwaor sjtaap." "${UNIT_DIR}/move_2.mp3"
generate_line "Op weeg." "${UNIT_DIR}/move_3.mp3"
generate_line "Brek." "${UNIT_DIR}/attack_1.mp3"
generate_line "Mergel velt." "${UNIT_DIR}/attack_2.mp3"
generate_line "Hajje." "${UNIT_DIR}/attack_3.mp3"
generate_line "Sjteen... versjplinterd..." "${UNIT_DIR}/death_1.mp3"
generate_line "De groef... duusterk..." "${UNIT_DIR}/death_2.mp3"
generate_line "Mergelmuur." "${UNIT_DIR}/ability_1.mp3"
generate_line "Onbreekbaar." "${UNIT_DIR}/ability_2.mp3"
generate_line "Ich waacht." "${UNIT_DIR}/idle_1.mp3"
generate_line "Sjtil." "${UNIT_DIR}/idle_2.mp3"
generate_line "Steen haole." "${UNIT_DIR}/gather_1.mp3"
generate_line "Mergel, mergel." "${UNIT_DIR}/gather_2.mp3"
generate_line "Voort." "${UNIT_DIR}/gather_3.mp3"
generate_line "Geharnasd." "${UNIT_DIR}/ready_1.mp3"
generate_line "Reej." "${UNIT_DIR}/ready_2.mp3"

# ============================================================
# UNIT: kolenbrander (siege — fire, smoke, slow industrial menace)
# ============================================================
echo ""
echo "[5/8] kolenbrander"
UNIT_DIR="${BASE_DIR}/kolenbrander"
generate_line "De oven gluit." "${UNIT_DIR}/select_1.mp3"
generate_line "Kole brand." "${UNIT_DIR}/select_2.mp3"
generate_line "Roek opsjtieg." "${UNIT_DIR}/select_3.mp3"
generate_line "Wae rolle." "${UNIT_DIR}/move_1.mp3"
generate_line "De toren beweeg." "${UNIT_DIR}/move_2.mp3"
generate_line "Sjwaor maar zeker." "${UNIT_DIR}/move_3.mp3"
generate_line "Vier!" "${UNIT_DIR}/attack_1.mp3"
generate_line "Kolengluit op uw kop!" "${UNIT_DIR}/attack_2.mp3"
generate_line "Brand, alles brandt!" "${UNIT_DIR}/attack_3.mp3"
generate_line "De oven... duuf..." "${UNIT_DIR}/death_1.mp3"
generate_line "Aas... in de wind..." "${UNIT_DIR}/death_2.mp3"
generate_line "Vol gloed!" "${UNIT_DIR}/ability_1.mp3"
generate_line "Kolesalvo!" "${UNIT_DIR}/ability_2.mp3"
generate_line "Ich sjtook bie." "${UNIT_DIR}/idle_1.mp3"
generate_line "De oven moot heit." "${UNIT_DIR}/idle_2.mp3"
generate_line "Kole bie haole." "${UNIT_DIR}/gather_1.mp3"
generate_line "Brandsjtof." "${UNIT_DIR}/gather_2.mp3"
generate_line "Hout en mergel." "${UNIT_DIR}/gather_3.mp3"
generate_line "De oven gluit." "${UNIT_DIR}/ready_1.mp3"
generate_line "Reej te brande." "${UNIT_DIR}/ready_2.mp3"

# ============================================================
# UNIT: sjpion (support — sneaky-Limburgs, soft-spoken)
# ============================================================
echo ""
echo "[6/8] sjpion"
UNIT_DIR="${BASE_DIR}/sjpion"
generate_line "Ssjt." "${UNIT_DIR}/select_1.mp3"
generate_line "Niemand zuut mich." "${UNIT_DIR}/select_2.mp3"
generate_line "Ich luuster." "${UNIT_DIR}/select_3.mp3"
generate_line "In de sjduuster." "${UNIT_DIR}/move_1.mp3"
generate_line "Geen geluud." "${UNIT_DIR}/move_2.mp3"
generate_line "Ich glij voorbij." "${UNIT_DIR}/move_3.mp3"
generate_line "Verrassing!" "${UNIT_DIR}/attack_1.mp3"
generate_line "Doow zoogst mich neet." "${UNIT_DIR}/attack_2.mp3"
generate_line "Mes in de rug." "${UNIT_DIR}/attack_3.mp3"
generate_line "Ontmasjkerd..." "${UNIT_DIR}/death_1.mp3"
generate_line "Sjduuster... pak mich..." "${UNIT_DIR}/death_2.mp3"
generate_line "Ich verdwien." "${UNIT_DIR}/ability_1.mp3"
generate_line "Onsjbaar." "${UNIT_DIR}/ability_2.mp3"
generate_line "Ich kiek mit." "${UNIT_DIR}/idle_1.mp3"
generate_line "Ich onthouw alles." "${UNIT_DIR}/idle_2.mp3"
generate_line "Geheimen haole." "${UNIT_DIR}/gather_1.mp3"
generate_line "Sjtil bezig." "${UNIT_DIR}/gather_2.mp3"
generate_line "In de sjaduw." "${UNIT_DIR}/gather_3.mp3"
generate_line "Onzichtbaar paraat." "${UNIT_DIR}/ready_1.mp3"
generate_line "Reej, mees." "${UNIT_DIR}/ready_2.mp3"

# ============================================================
# UNIT: mijnrat (special — schalks, giecheling, mischievous)
# ============================================================
echo ""
echo "[7/8] mijnrat"
UNIT_DIR="${BASE_DIR}/mijnrat"
generate_line "Hihihi!" "${UNIT_DIR}/select_1.mp3"
generate_line "De rat is hee!" "${UNIT_DIR}/select_2.mp3"
generate_line "Waat motte?" "${UNIT_DIR}/select_3.mp3"
generate_line "Door de tunnels!" "${UNIT_DIR}/move_1.mp3"
generate_line "Ich kruup vlot!" "${UNIT_DIR}/move_2.mp3"
generate_line "Snel snel snel!" "${UNIT_DIR}/move_3.mp3"
generate_line "Hap!" "${UNIT_DIR}/attack_1.mp3"
generate_line "In dien enkel!" "${UNIT_DIR}/attack_2.mp3"
generate_line "Bijte, hihihi!" "${UNIT_DIR}/attack_3.mp3"
generate_line "Piep..." "${UNIT_DIR}/death_1.mp3"
generate_line "De val... is dicht..." "${UNIT_DIR}/death_2.mp3"
generate_line "Tunnelsjprong!" "${UNIT_DIR}/ability_1.mp3"
generate_line "Verdwijntruuk!" "${UNIT_DIR}/ability_2.mp3"
generate_line "Ich knabbel." "${UNIT_DIR}/idle_1.mp3"
generate_line "Sjnoepe in 't donker." "${UNIT_DIR}/idle_2.mp3"
generate_line "Kruumkes haole." "${UNIT_DIR}/gather_1.mp3"
generate_line "Sjnuffel sjnuffel." "${UNIT_DIR}/gather_2.mp3"
generate_line "Vondsj!" "${UNIT_DIR}/gather_3.mp3"
generate_line "Rat paraat, hihihi!" "${UNIT_DIR}/ready_1.mp3"
generate_line "Reej veur 't kwaod." "${UNIT_DIR}/ready_2.mp3"

# ============================================================
# UNIT: de-mijnbaas (hero — minimalisme = kracht, pauzes, gezag)
# ============================================================
echo ""
echo "[8/8] de-mijnbaas"
UNIT_DIR="${BASE_DIR}/de-mijnbaas"
generate_line "De Mijnbaas." "${UNIT_DIR}/select_1.mp3"
generate_line "Sjpreek." "${UNIT_DIR}/select_2.mp3"
generate_line "Ich huur." "${UNIT_DIR}/select_3.mp3"
generate_line "Ich loop." "${UNIT_DIR}/move_1.mp3"
generate_line "De sjacht ruup." "${UNIT_DIR}/move_2.mp3"
generate_line "Veurwaarts." "${UNIT_DIR}/move_3.mp3"
generate_line "Veur Limburg." "${UNIT_DIR}/attack_1.mp3"
generate_line "Doow valt." "${UNIT_DIR}/attack_2.mp3"
generate_line "Hajje. Plet." "${UNIT_DIR}/attack_3.mp3"
generate_line "De mien... duusterk..." "${UNIT_DIR}/death_1.mp3"
generate_line "Mien volk... vergaef mich..." "${UNIT_DIR}/death_2.mp3"
generate_line "Gluck auf!" "${UNIT_DIR}/ability_1.mp3"
generate_line "Bevel van de baas." "${UNIT_DIR}/ability_2.mp3"
generate_line "Ich denk noa." "${UNIT_DIR}/idle_1.mp3"
generate_line "Sjtilte... sjpreek." "${UNIT_DIR}/idle_2.mp3"
generate_line "Veurraod tellen." "${UNIT_DIR}/gather_1.mp3"
generate_line "Mien volk werk." "${UNIT_DIR}/gather_2.mp3"
generate_line "De sjacht geef." "${UNIT_DIR}/gather_3.mp3"
generate_line "De Mijnbaas is reej." "${UNIT_DIR}/ready_1.mp3"
generate_line "Volg mich." "${UNIT_DIR}/ready_2.mp3"

# ============================================================
# GENERIC FACTION FALLBACK
# ============================================================
echo ""
echo "[generic] Limburgers fallback"
generate_line "Gluck auf!" "${BASE_DIR}/select_1.mp3"
generate_line "Ich bin der." "${BASE_DIR}/select_2.mp3"
generate_line "Sjpreek mèt mich." "${BASE_DIR}/select_3.mp3"
generate_line "Naor de mien." "${BASE_DIR}/move_1.mp3"
generate_line "Ich loop." "${BASE_DIR}/move_2.mp3"
generate_line "Op weeg." "${BASE_DIR}/move_3.mp3"
generate_line "Veur Limburg!" "${BASE_DIR}/attack_1.mp3"
generate_line "Doow krijg ervan!" "${BASE_DIR}/attack_2.mp3"
generate_line "Hajje, plet!" "${BASE_DIR}/attack_3.mp3"
generate_line "De sjacht..." "${BASE_DIR}/death_1.mp3"
generate_line "Tot de mergel..." "${BASE_DIR}/death_2.mp3"
generate_line "Aan 't werk." "${BASE_DIR}/gather_1.mp3"
generate_line "Kole en mergel." "${BASE_DIR}/gather_2.mp3"
generate_line "Veurraod haole." "${BASE_DIR}/gather_3.mp3"
generate_line "Nuuj!" "${BASE_DIR}/ability_1.mp3"
generate_line "Volle krach!" "${BASE_DIR}/ability_2.mp3"
generate_line "Sjtil hee." "${BASE_DIR}/idle_1.mp3"
generate_line "De wind in de mergel." "${BASE_DIR}/idle_2.mp3"
generate_line "Reej." "${BASE_DIR}/ready_1.mp3"
generate_line "Gemeld." "${BASE_DIR}/ready_2.mp3"

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

echo "All Limburgers voice lines regenerated with Reinoud (5tiZStRJQ98Xw420MFFx)!"
