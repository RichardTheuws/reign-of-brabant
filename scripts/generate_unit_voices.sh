#!/bin/bash
# Generate unit voice lines via ElevenLabs Text-to-Speech API
#
# Usage: bash scripts/generate_unit_voices.sh
#
# Generates short voice clips for Brabander and Randstad unit responses.
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

mkdir -p "$OUTPUT_DIR/brabanders" "$OUTPUT_DIR/randstad"

# ---------------------------------------------------------------------------
# ElevenLabs voice IDs (pre-made multilingual voices)
# Adam  = warm, friendly male — perfect for Brabanders
# Antoni = more formal, measured male — perfect for Randstad
# ---------------------------------------------------------------------------

BRABANT_VOICE_ID="pNInz6obpgDQGcFmaJgB"   # Adam
RANDSTAD_VOICE_ID="ErXwobaYiN019PkySvjV"   # Antoni

# ---------------------------------------------------------------------------
# Generation function
# ---------------------------------------------------------------------------

GENERATED=0
FAILED=0

generate_voice() {
  local text="$1"
  local output="$2"
  local voice_id="$3"

  # Skip if file already exists and is > 1KB (likely valid)
  if [[ -f "$output" ]]; then
    local existing_size
    existing_size=$(stat -f%z "$output" 2>/dev/null || echo "0")
    if [[ "$existing_size" -gt 1024 ]]; then
      echo "  SKIP (exists): $output ($existing_size bytes)"
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
        \"stability\": 0.5,
        \"similarity_boost\": 0.75,
        \"style\": 0.3
      }
    }" \
    --output "$output")

  if [[ "$http_code" != "200" ]]; then
    echo "  FAIL ($http_code): $output — text: \"$text\""
    rm -f "$output"
    FAILED=$((FAILED + 1))
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
}

# ---------------------------------------------------------------------------
# Brabanders — warm, Brabants dialect
# ---------------------------------------------------------------------------

echo ""
echo "=== Brabanders voices (Adam — warm male) ==="
echo ""

# Select responses
generate_voice "Ja?"           "$OUTPUT_DIR/brabanders/select_1.mp3" "$BRABANT_VOICE_ID"
generate_voice "Zeg het maar"  "$OUTPUT_DIR/brabanders/select_2.mp3" "$BRABANT_VOICE_ID"
generate_voice "Houdoe!"       "$OUTPUT_DIR/brabanders/select_3.mp3" "$BRABANT_VOICE_ID"

# Move responses
generate_voice "Ik ga!"        "$OUTPUT_DIR/brabanders/move_1.mp3"   "$BRABANT_VOICE_ID"
generate_voice "Op weg!"       "$OUTPUT_DIR/brabanders/move_2.mp3"   "$BRABANT_VOICE_ID"
generate_voice "Komt goed!"    "$OUTPUT_DIR/brabanders/move_3.mp3"   "$BRABANT_VOICE_ID"

# Attack responses
generate_voice "Aanvallen!"    "$OUTPUT_DIR/brabanders/attack_1.mp3" "$BRABANT_VOICE_ID"
generate_voice "D'r op!"       "$OUTPUT_DIR/brabanders/attack_2.mp3" "$BRABANT_VOICE_ID"
generate_voice "Voor Brabant!" "$OUTPUT_DIR/brabanders/attack_3.mp3" "$BRABANT_VOICE_ID"

# Gather responses
generate_voice "Goud!"         "$OUTPUT_DIR/brabanders/gather_1.mp3" "$BRABANT_VOICE_ID"
generate_voice "Ik pak het"    "$OUTPUT_DIR/brabanders/gather_2.mp3" "$BRABANT_VOICE_ID"
generate_voice "Mooi zo"       "$OUTPUT_DIR/brabanders/gather_3.mp3" "$BRABANT_VOICE_ID"

# ---------------------------------------------------------------------------
# Randstad — corporate, stiff/formal
# ---------------------------------------------------------------------------

echo ""
echo "=== Randstad voices (Antoni — formal male) ==="
echo ""

# Select responses
generate_voice "Ja, wat is het?"  "$OUTPUT_DIR/randstad/select_1.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Moment..."        "$OUTPUT_DIR/randstad/select_2.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Ik luister"       "$OUTPUT_DIR/randstad/select_3.mp3" "$RANDSTAD_VOICE_ID"

# Move responses
generate_voice "Dat kan ik doen"  "$OUTPUT_DIR/randstad/move_1.mp3"   "$RANDSTAD_VOICE_ID"
generate_voice "Actie!"           "$OUTPUT_DIR/randstad/move_2.mp3"   "$RANDSTAD_VOICE_ID"
generate_voice "Richting bepaald" "$OUTPUT_DIR/randstad/move_3.mp3"   "$RANDSTAD_VOICE_ID"

# Attack responses
generate_voice "Offensief!"             "$OUTPUT_DIR/randstad/attack_1.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Strategie uitvoeren"    "$OUTPUT_DIR/randstad/attack_2.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Aanpakken!"             "$OUTPUT_DIR/randstad/attack_3.mp3" "$RANDSTAD_VOICE_ID"

# Gather responses
generate_voice "Resources!"    "$OUTPUT_DIR/randstad/gather_1.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Investering"   "$OUTPUT_DIR/randstad/gather_2.mp3" "$RANDSTAD_VOICE_ID"
generate_voice "Begroting"     "$OUTPUT_DIR/randstad/gather_3.mp3" "$RANDSTAD_VOICE_ID"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "========================================="
echo "  Voice generation complete"
echo "  Generated: $GENERATED"
echo "  Failed:    $FAILED"
echo "========================================="
echo ""
echo "Brabanders:"
ls -la "$OUTPUT_DIR/brabanders/" 2>/dev/null || echo "  (no files)"
echo ""
echo "Randstad:"
ls -la "$OUTPUT_DIR/randstad/" 2>/dev/null || echo "  (no files)"
