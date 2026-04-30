#!/bin/bash
# Split a single voice recording into per-slot MP3 files.
#
# Usage: bash scripts/split-voice-recording.sh <recording.wav|m4a|mp3> <RECORDING-SCRIPT.md>
#
# Workflow:
#   1. ffmpeg silence-detection identifies all non-silent segments.
#   2. Segments are paired sequentially with line-numbers from the markdown
#      script. If there are MORE segments than expected (= hertakes), the LAST
#      segment per slot wins.
#   3. Each segment is exported as a normalized MP3 to the right faction folder.
#
# Tunables (env vars):
#   SILENCE_DB     -- threshold for silence detection (default -34dB)
#   SILENCE_DUR    -- min silence duration to split (default 0.8s)
#   FACTION_DIR    -- output base dir (auto-detected from script-name if unset)
#
set -euo pipefail

INPUT="${1:?Usage: $0 <recording-file> <script.md>}"
SCRIPT_MD="${2:?Need RECORDING-SCRIPT.md path}"

if [[ ! -f "$INPUT" ]]; then
    echo "ERROR: input file not found: $INPUT" >&2
    exit 1
fi
if [[ ! -f "$SCRIPT_MD" ]]; then
    echo "ERROR: recording-script not found: $SCRIPT_MD" >&2
    exit 1
fi

SILENCE_DB="${SILENCE_DB:--34dB}"
SILENCE_DUR="${SILENCE_DUR:-0.8}"

# Auto-detect faction dir from script filename
SCRIPT_BASE=$(basename "$SCRIPT_MD")
case "$SCRIPT_BASE" in
    *BRABANDER*) FACTION="brabanders" ;;
    *LIMBURG*)   FACTION="limburgers" ;;
    *RANDSTAD*)  FACTION="randstad" ;;
    *BELGEN*)    FACTION="belgen" ;;
    *) echo "ERROR: cannot detect faction from $SCRIPT_BASE" >&2; exit 1 ;;
esac
FACTION_DIR="${FACTION_DIR:-public/assets/audio/voices/$FACTION}"

# Parse expected slots from markdown table (column "Slot" → unit/action)
# Lines look like:  | 1 | select_1 | Goeiendag. |
#                   | 121 | select_1 | Jao? |   (generic, no preceding unit-section)
TMP_SLOTS=$(mktemp)
CURRENT_UNIT=""
while IFS= read -r line; do
    # Detect unit-headers: lines starting with "## boer" "## generic" etc.
    if [[ "$line" =~ ^\#\#[[:space:]]+([a-z-]+) ]]; then
        unit="${BASH_REMATCH[1]}"
        # "generic" stays at faction root, others become subfolder
        if [[ "$unit" == "generic" ]]; then
            CURRENT_UNIT=""
        else
            CURRENT_UNIT="$unit"
        fi
        continue
    fi
    # Table rows:  | <num> | <slot> | <text> |
    if [[ "$line" =~ ^\|[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*([a-z]+_[0-9])[[:space:]]*\| ]]; then
        num="${BASH_REMATCH[1]}"
        slot="${BASH_REMATCH[2]}"
        if [[ -n "$CURRENT_UNIT" ]]; then
            echo "$num|$CURRENT_UNIT/$slot" >> "$TMP_SLOTS"
        else
            echo "$num|$slot" >> "$TMP_SLOTS"
        fi
    fi
done < "$SCRIPT_MD"

EXPECTED=$(wc -l < "$TMP_SLOTS" | tr -d ' ')
echo "Expected slots: $EXPECTED (from $SCRIPT_BASE)"
echo "Output base   : $FACTION_DIR"
echo "Silence       : ${SILENCE_DB} for ${SILENCE_DUR}s"
echo ""

# ---------------------------------------------------------------------------
# Phase 1: silence-detect to get segment timestamps
# ---------------------------------------------------------------------------
echo "[1/3] Detecting silence..."
SILENCE_LOG=$(mktemp)
ffmpeg -hide_banner -nostats -i "$INPUT" \
    -af "silencedetect=noise=${SILENCE_DB}:d=${SILENCE_DUR}" \
    -f null - 2> "$SILENCE_LOG"

# Extract silence_start / silence_end / silence_duration lines
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT")

# Build segment-list: each segment = [start, end] of NON-silence
SEGMENTS=$(mktemp)
python3 - "$SILENCE_LOG" "$DURATION" "$SEGMENTS" <<'PY'
import sys, re
log_path, total_dur, out_path = sys.argv[1], float(sys.argv[2]), sys.argv[3]
silences = []
with open(log_path) as f:
    txt = f.read()
for m in re.finditer(r'silence_start:\s*([\d.]+).*?silence_end:\s*([\d.]+)', txt, re.S):
    s, e = float(m.group(1)), float(m.group(2))
    silences.append((s, e))
# Compute non-silence segments
segs = []
cursor = 0.0
for s_start, s_end in silences:
    if s_start > cursor + 0.05:
        segs.append((cursor, s_start))
    cursor = s_end
if cursor < total_dur - 0.05:
    segs.append((cursor, total_dur))
# Filter very short blips (< 0.25s)
segs = [(a, b) for (a, b) in segs if b - a >= 0.25]
with open(out_path, 'w') as f:
    for a, b in segs:
        f.write(f"{a:.3f} {b:.3f}\n")
print(f"  Detected {len(segs)} non-silent segments")
PY

NUM_SEGS=$(wc -l < "$SEGMENTS" | tr -d ' ')
echo ""

# ---------------------------------------------------------------------------
# Phase 2: assign segments to slots
# ---------------------------------------------------------------------------
echo "[2/3] Assigning segments to slots..."
if (( NUM_SEGS < EXPECTED )); then
    echo "  WARNING: detected $NUM_SEGS segments, expected $EXPECTED."
    echo "  Probable cause: silence threshold too strict, or skipped slots."
    echo "  Aborting — adjust SILENCE_DB (try -30dB or -28dB) and rerun."
    rm -f "$TMP_SLOTS" "$SILENCE_LOG" "$SEGMENTS"
    exit 1
fi

EXTRA=$((NUM_SEGS - EXPECTED))
if (( EXTRA > 0 )); then
    echo "  Detected $EXTRA extra segments — interpreting as hertakes."
    echo "  Strategy: distribute extras as 'last-take-wins' starting from the END."
fi

# Distribution: simplest correct interpretation — caller said
# "elke slot can have an extra take, take the LAST one before the next slot's number-prefix".
# Without STT we use a simpler heuristic: when EXTRA segments exist, we pair
# greedily and let the LAST-N segments collapse onto the last N slots.
# In practice if Richard re-takes uniformly (every slot once or twice), the
# silence-pattern is: [num][text] [num][text] [num]...  -> 1 segment per slot
# OR [num][text][text] [num] -> 1 long segment (no internal silence) per slot.
# So the splitter primarily relies on segment-count == slot-count.
#
# If retakes did create separate segments, we ASSUME the user respected the
# "leave 1+ second of silence between number-blocks" rule, so retakes within
# a slot have shorter silences (still under our threshold). For SAFETY we
# only proceed when NUM_SEGS == EXPECTED — otherwise the user reruns with
# adjusted SILENCE_DUR.

if (( NUM_SEGS != EXPECTED )); then
    echo "  Refusing to auto-distribute mismatched counts."
    echo "  Tweak SILENCE_DUR up (longer required silence between slot-numbers)"
    echo "  or down (more aggressive splitting)."
    rm -f "$TMP_SLOTS" "$SILENCE_LOG" "$SEGMENTS"
    exit 1
fi

# ---------------------------------------------------------------------------
# Phase 3: extract each segment to its target file
# ---------------------------------------------------------------------------
echo "[3/3] Extracting segments..."
i=0
while IFS=' ' read -r START END; do
    i=$((i + 1))
    SLOT=$(sed -n "${i}p" "$TMP_SLOTS" | cut -d'|' -f2)
    OUT="$FACTION_DIR/$SLOT.mp3"
    mkdir -p "$(dirname "$OUT")"
    DUR=$(python3 -c "print(f'{${END}-${START}:.3f}')")
    ffmpeg -y -hide_banner -loglevel error \
        -ss "$START" -t "$DUR" -i "$INPUT" \
        -c:a libmp3lame -q:a 2 \
        "$OUT"
    echo "  [$i/$EXPECTED] $SLOT.mp3 (${DUR}s)"
done < "$SEGMENTS"

rm -f "$TMP_SLOTS" "$SILENCE_LOG" "$SEGMENTS"

echo ""
echo "DONE. $i files written to $FACTION_DIR/"
echo "Next: bash scripts/normalize-voices.sh --all"
echo "Then: open http://localhost:5173/voices-audit-brabant.html to verify"
