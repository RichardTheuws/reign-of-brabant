#!/bin/bash
# Generate unit voice lines via ElevenLabs Text-to-Speech API
#
# Usage: bash scripts/generate_unit_voices.sh
#
# Generates per-unit-type voice clips with distinct personalities:
#   - Boer (worker): calm, grounded farmer
#   - Carnavalvierder (infantry): loud, euphoric party animal
#   - Kansen (ranged): whispery, conspiratorial stealth unit
#   + generic faction fallback lines
#
# Requires ELEVENLABS_API_KEY in the parent .env file.

set -euo pipefail

ENV_FILE="/Users/richardtheuws/Documents/games/.env"
OUTPUT_DIR="assets/audio/voices"

# ---------------------------------------------------------------------------
# Load API key
# ---------------------------------------------------------------------------

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

ELEVENLABS_API_KEY=$(grep '^ELEVENLABS_API_KEY=' "$ENV_FILE" | cut -d= -f2)

if [[ -z "$ELEVENLABS_API_KEY" ]]; then
  echo "ERROR: ELEVENLABS_API_KEY not found in $ENV_FILE"
  exit 1
fi

echo "API key loaded (${#ELEVENLABS_API_KEY} chars)"

# ---------------------------------------------------------------------------
# Output directories
# ---------------------------------------------------------------------------

mkdir -p "$OUTPUT_DIR/brabanders/boer"
mkdir -p "$OUTPUT_DIR/brabanders/carnavalvierder"
mkdir -p "$OUTPUT_DIR/brabanders/kansen"
mkdir -p "$OUTPUT_DIR/brabanders"
mkdir -p "$OUTPUT_DIR/randstad/stagiair"
mkdir -p "$OUTPUT_DIR/randstad/manager"
mkdir -p "$OUTPUT_DIR/randstad/consultant"
mkdir -p "$OUTPUT_DIR/randstad"

# ---------------------------------------------------------------------------
# ElevenLabs voice IDs
# Adam  = warm, friendly male — Brabanders
# Antoni = formal, measured male — Randstad
# ---------------------------------------------------------------------------

BRABANT_VOICE_ID="pNInz6obpgDQGcFmaJgB"   # Adam
RANDSTAD_VOICE_ID="ErXwobaYiN019PkySvjV"   # Antoni

# ---------------------------------------------------------------------------
# Generation function — with configurable voice settings per unit personality
# ---------------------------------------------------------------------------

GENERATED=0
FAILED=0
SKIPPED=0

generate_voice() {
  local text="$1"
  local output="$2"
  local voice_id="$3"
  local stability="${4:-0.5}"
  local similarity="${5:-0.75}"
  local style="${6:-0.3}"

  # Skip if file already exists and is > 1KB (likely valid)
  if [[ -f "$output" ]]; then
    local existing_size
    existing_size=$(stat -f%z "$output" 2>/dev/null || echo "0")
    if [[ "$existing_size" -gt 1024 ]]; then
      echo "  SKIP (exists): $output ($existing_size bytes)"
      SKIPPED=$((SKIPPED + 1))
      return 0
    fi
  fi

  local http_code
  http_code=$(curl -s -w "%{http_code}" --max-time 30 \
    "https://api.elevenlabs.io/v1/text-to-speech/$voice_id" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"$text\",
      \"model_id\": \"eleven_multilingual_v2\",
      \"voice_settings\": {
        \"stability\": $stability,
        \"similarity_boost\": $similarity,
        \"style\": $style
      }
    }" \
    --output "$output")

  if [[ "$http_code" != "200" ]]; then
    echo "  FAIL ($http_code): $output — text: \"$text\""
    rm -f "$output"
    FAILED=$((FAILED + 1))
    # Rate limit: wait on 429
    if [[ "$http_code" == "429" ]]; then
      echo "  Rate limited, waiting 10s..."
      sleep 10
    fi
    return 1
  fi

  local size
  size=$(stat -f%z "$output" 2>/dev/null || echo "0")

  if [[ "$size" -lt 100 ]]; then
    echo "  FAIL (too small): $output — $size bytes"
    rm -f "$output"
    FAILED=$((FAILED + 1))
    return 1
  fi

  echo "  OK: $output ($size bytes)"
  GENERATED=$((GENERATED + 1))
  # Small delay to respect rate limits
  sleep 0.5
}

# ===========================================================================
# BRABANDERS — Per Unit Type
# ===========================================================================

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  BRABANDERS — Unit Voice Generation              ║"
echo "╚══════════════════════════════════════════════════╝"

# ---------------------------------------------------------------------------
# Boer (Worker) — calm, grounded, nuchter
# Voice settings: stability 0.5, similarity 0.75, style 0.3
# ---------------------------------------------------------------------------

echo ""
echo "--- Boer (Worker) — calm farmer ---"
B_STAB=0.5; B_SIM=0.75; B_STYLE=0.3

generate_voice "Ja?"                          "$OUTPUT_DIR/brabanders/boer/select_1.mp3"  "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE
generate_voice "Zeg het maar"                 "$OUTPUT_DIR/brabanders/boer/select_2.mp3"  "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE
generate_voice "Ik luister, jansen"           "$OUTPUT_DIR/brabanders/boer/select_3.mp3"  "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE

generate_voice "Ok!"                          "$OUTPUT_DIR/brabanders/boer/move_1.mp3"    "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE
generate_voice "Is goed"                      "$OUTPUT_DIR/brabanders/boer/move_2.mp3"    "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE
generate_voice "Ik ga al, rustig aan"         "$OUTPUT_DIR/brabanders/boer/move_3.mp3"    "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE

generate_voice "Moet dat?!"                   "$OUTPUT_DIR/brabanders/boer/attack_1.mp3"  "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE
generate_voice "Vooruit dan maar..."          "$OUTPUT_DIR/brabanders/boer/attack_2.mp3"  "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE
generate_voice "Mansen, ge vraagt het erom!"  "$OUTPUT_DIR/brabanders/boer/attack_3.mp3"  "$BRABANT_VOICE_ID" $B_STAB $B_SIM $B_STYLE

# ---------------------------------------------------------------------------
# Carnavalvierder (Infantry) — loud, euphoric, drunk
# Voice settings: stability 0.35, similarity 0.75, style 0.6 (more expressive)
# ---------------------------------------------------------------------------

echo ""
echo "--- Carnavalvierder (Infantry) — party animal ---"
C_STAB=0.35; C_SIM=0.75; C_STYLE=0.6

generate_voice "ALAAF!"                       "$OUTPUT_DIR/brabanders/carnavalvierder/select_1.mp3"  "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE
generate_voice "Nog eentje dan!"              "$OUTPUT_DIR/brabanders/carnavalvierder/select_2.mp3"  "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE
generate_voice "Waar is de bar?"              "$OUTPUT_DIR/brabanders/carnavalvierder/select_3.mp3"  "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE

generate_voice "Op naar het feest!"           "$OUTPUT_DIR/brabanders/carnavalvierder/move_1.mp3"    "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE
generate_voice "Ik dans ernaartoe!"           "$OUTPUT_DIR/brabanders/carnavalvierder/move_2.mp3"    "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE
generate_voice "Polonaise door de modder!"    "$OUTPUT_DIR/brabanders/carnavalvierder/move_3.mp3"    "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE

generate_voice "Pansen erop!"                 "$OUTPUT_DIR/brabanders/carnavalvierder/attack_1.mp3"  "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE
generate_voice "Brabant vergeet niet!"        "$OUTPUT_DIR/brabanders/carnavalvierder/attack_2.mp3"  "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE
generate_voice "ALAAF op je muil!"            "$OUTPUT_DIR/brabanders/carnavalvierder/attack_3.mp3"  "$BRABANT_VOICE_ID" $C_STAB $C_SIM $C_STYLE

# ---------------------------------------------------------------------------
# Kansen (Ranged/Stealth) — whispery, conspiratorial
# Voice settings: stability 0.3, similarity 0.8, style 0.2 (subdued)
# ---------------------------------------------------------------------------

echo ""
echo "--- Kansen (Ranged) — stealth operative ---"
K_STAB=0.3; K_SIM=0.8; K_STYLE=0.2

generate_voice "Ik ken iemansen die iemansen kent..."  "$OUTPUT_DIR/brabanders/kansen/select_1.mp3"  "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE
generate_voice "Niks gezien, niks gehoord"             "$OUTPUT_DIR/brabanders/kansen/select_2.mp3"  "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE
generate_voice "Psst... hier, jansen"                  "$OUTPUT_DIR/brabanders/kansen/select_3.mp3"  "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE

generate_voice "Sssst, ik ga al"                       "$OUTPUT_DIR/brabanders/kansen/move_1.mp3"    "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE
generate_voice "Via het sluipweggetje"                  "$OUTPUT_DIR/brabanders/kansen/move_2.mp3"    "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE
generate_voice "Niemansen hoeft dit te weten"           "$OUTPUT_DIR/brabanders/kansen/move_3.mp3"    "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE

generate_voice "Vansen de vrachtansen gevallen!"        "$OUTPUT_DIR/brabanders/kansen/attack_1.mp3"  "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE
generate_voice "Surprise, klansen!"                     "$OUTPUT_DIR/brabanders/kansen/attack_2.mp3"  "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE
generate_voice "Ze hebben niks gezien..."               "$OUTPUT_DIR/brabanders/kansen/attack_3.mp3"  "$BRABANT_VOICE_ID" $K_STAB $K_SIM $K_STYLE

# ---------------------------------------------------------------------------
# Brabanders — Generic fallback (used when no per-unit file exists)
# ---------------------------------------------------------------------------

echo ""
echo "--- Brabanders generic fallback ---"

generate_voice "Ja?"           "$OUTPUT_DIR/brabanders/select_1.mp3" "$BRABANT_VOICE_ID"
generate_voice "Zeg het maar"  "$OUTPUT_DIR/brabanders/select_2.mp3" "$BRABANT_VOICE_ID"
generate_voice "Houdoe!"       "$OUTPUT_DIR/brabanders/select_3.mp3" "$BRABANT_VOICE_ID"

generate_voice "Ik ga!"        "$OUTPUT_DIR/brabanders/move_1.mp3"   "$BRABANT_VOICE_ID"
generate_voice "Op weg!"       "$OUTPUT_DIR/brabanders/move_2.mp3"   "$BRABANT_VOICE_ID"
generate_voice "Komt goed!"    "$OUTPUT_DIR/brabanders/move_3.mp3"   "$BRABANT_VOICE_ID"

generate_voice "Aanvallen!"    "$OUTPUT_DIR/brabanders/attack_1.mp3" "$BRABANT_VOICE_ID"
generate_voice "D'r op!"       "$OUTPUT_DIR/brabanders/attack_2.mp3" "$BRABANT_VOICE_ID"
generate_voice "Voor Brabant!" "$OUTPUT_DIR/brabanders/attack_3.mp3" "$BRABANT_VOICE_ID"

generate_voice "Goud!"         "$OUTPUT_DIR/brabanders/gather_1.mp3" "$BRABANT_VOICE_ID"
generate_voice "Ik pak het"    "$OUTPUT_DIR/brabanders/gather_2.mp3" "$BRABANT_VOICE_ID"
generate_voice "Mooi zo"       "$OUTPUT_DIR/brabanders/gather_3.mp3" "$BRABANT_VOICE_ID"

# ===========================================================================
# RANDSTAD — Generic (per-unit coming later)
# ===========================================================================

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  RANDSTAD — Unit Voice Generation                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

generate_voice "Ja, wat is het?"  "$OUTPUT_DIR/randstad/select_1.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Moment..."        "$OUTPUT_DIR/randstad/select_2.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Ik luister"       "$OUTPUT_DIR/randstad/select_3.mp3" "$RANDSTAD_VOICE_ID"

generate_voice "Dat kan ik doen"  "$OUTPUT_DIR/randstad/move_1.mp3"   "$RANDSTAD_VOICE_ID"
generate_voice "Actie!"           "$OUTPUT_DIR/randstad/move_2.mp3"   "$RANDSTAD_VOICE_ID"
generate_voice "Richting bepaald" "$OUTPUT_DIR/randstad/move_3.mp3"   "$RANDSTAD_VOICE_ID"

generate_voice "Offensief!"             "$OUTPUT_DIR/randstad/attack_1.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Strategie uitvoeren"    "$OUTPUT_DIR/randstad/attack_2.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Aanpakken!"             "$OUTPUT_DIR/randstad/attack_3.mp3" "$RANDSTAD_VOICE_ID"

generate_voice "Resources!"    "$OUTPUT_DIR/randstad/gather_1.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Investering"   "$OUTPUT_DIR/randstad/gather_2.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Begroting"     "$OUTPUT_DIR/randstad/gather_3.mp3" "$RANDSTAD_VOICE_ID"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Voice generation complete                       ║"
echo "║  Generated: $GENERATED                              ║"
echo "║  Skipped:   $SKIPPED                              ║"
echo "║  Failed:    $FAILED                               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Files:"
find "$OUTPUT_DIR" -name "*.mp3" | sort | while read -r f; do
  size=$(stat -f%z "$f" 2>/dev/null || echo "?")
  echo "  $f ($size bytes)"
done
