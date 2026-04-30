#!/bin/bash
# Reign of Brabant -- Manager voice re-cast (v0.52.0 re-vamp).
#
# Generates 6 generic events (select 1-3, move 1-3) for the Randstad Manager
# using a NEW ElevenLabs voice ("Daniel" — authoritative British male) that
# carries more "manager-energy" (corporate-jargon, KPI/alignment/deliverables
# language) than the previous Antoni cut. Antoni stays the default Randstad
# voice for other units; Daniel is Manager-only.
#
# Output: public/assets/audio/voices/randstad/manager/{select,move}_N.mp3
# Backup: existing files moved to .bak.mp3 before overwrite.
#
# Requires ELEVENLABS_API_KEY in /Users/richardtheuws/Documents/games/.env

set -euo pipefail

ENV_FILE="/Users/richardtheuws/Documents/games/.env"
PROJECT="/Users/richardtheuws/Documents/games/reign-of-brabant"
OUTPUT_DIR="$PROJECT/public/assets/audio/voices/randstad/manager"

# ---------------------------------------------------------------------------
# Voice cast
# ---------------------------------------------------------------------------
# Daniel — authoritative British male, corporate boardroom presence.
# ElevenLabs preset voice ID. Mid-stability for variation across takes,
# higher style so the corporate-cadence punches through.
MANAGER_VOICE_ID="onwK4e9ZLuTAKqWW03F9"   # Daniel
STAB=0.45
SIM=0.78
STYLE=0.55

# ---------------------------------------------------------------------------
# Load API key
# ---------------------------------------------------------------------------
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env not found at $ENV_FILE" >&2; exit 1
fi
ELEVENLABS_API_KEY="$(grep '^ELEVENLABS_API_KEY=' "$ENV_FILE" | cut -d= -f2)"
[[ -z "$ELEVENLABS_API_KEY" ]] && { echo "ERROR: missing ELEVENLABS_API_KEY" >&2; exit 1; }

mkdir -p "$OUTPUT_DIR"

# ---------------------------------------------------------------------------
# Generate one voice line. Backs up an existing file as <name>.bak.mp3.
# ---------------------------------------------------------------------------
generate_voice() {
  local text="$1"
  local out="$2"

  if [[ -f "$out" && ! -f "${out%.mp3}.bak.mp3" ]]; then
    cp "$out" "${out%.mp3}.bak.mp3"
    echo "  backup: $(basename "${out%.mp3}.bak.mp3")"
  fi

  curl -fsS -X POST \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: audio/mpeg" \
    --data @<(cat <<JSON
{
  "text": $(printf '%s' "$text" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))'),
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": $STAB,
    "similarity_boost": $SIM,
    "style": $STYLE,
    "use_speaker_boost": true
  }
}
JSON
) \
    "https://api.elevenlabs.io/v1/text-to-speech/$MANAGER_VOICE_ID" \
    -o "$out"

  local sz; sz=$(stat -f%z "$out" 2>/dev/null || echo 0)
  if [[ "$sz" -lt 5000 ]]; then
    echo "  WARN: $out only ${sz}B"
  else
    printf "  ok   %-40s %dKB\n" "$(basename "$out")" "$((sz/1024))"
  fi
}

# ---------------------------------------------------------------------------
# Lines — corporate manager-energy. KPI / alignment / deliverables / stakeholder
# vocabulary. Length parity with Consultant lines (15-25 words).
# ---------------------------------------------------------------------------
echo "Generating Manager voice lines (Daniel, $MANAGER_VOICE_ID)..."

# select_1-3: corporate boardroom presence, summons-from-meeting energy
generate_voice "Wat zijn de deliverables?"               "$OUTPUT_DIR/select_1.mp3"
generate_voice "Heb je het op de roadmap staan?"         "$OUTPUT_DIR/select_2.mp3"
generate_voice "Laten we even alignen op de KPI's."      "$OUTPUT_DIR/select_3.mp3"

# move_1-3: assertive corporate movement, agenda-driven
generate_voice "Ik schuif door naar het volgende overleg." "$OUTPUT_DIR/move_1.mp3"
generate_voice "We pakken het strategisch aan, even off-site." "$OUTPUT_DIR/move_2.mp3"
generate_voice "Ik briefte de stakeholders ter plaatse."  "$OUTPUT_DIR/move_3.mp3"

echo
echo "Done. Files in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/select_*.mp3 "$OUTPUT_DIR"/move_*.mp3 2>/dev/null
