#!/usr/bin/env bash
# normalize-voices.sh
# Batch-normaliseer ElevenLabs voice MP3's voor consistente loudness en EQ.
#
# Pipeline (ffmpeg, single-pass):
#   loudnorm I=-16 TP=-1 LRA=11   broadcast/game-norm
#   highpass f=80                 verwijdert rumble/hum
#   equalizer 150Hz -2dB          dempt low-mud
#   equalizer 3kHz +1.5dB         presence-boost
#   compand                       milde de-essing
#
# Output gaat NOOIT over de source heen — altijd naar parallelle dir tree.
#
# Modes:
#   --sample   (default) 3 random files per factie -> voices-normalized-sample/
#   --all      volledige batch (~525 files) -> voices-normalized/
#   --single <pad>  1 specifieke file -> voices-normalized-single/
#   --dry-run  print ffmpeg commando's i.p.v. te executen
#
# Caveats:
#   - macOS ffmpeg gebruikt single-pass loudnorm (target ±1 LU). Two-pass voor
#     exacte target zou verdubbeling van runtime betekenen; voor in-game audio
#     is ±1 LU verwaarloosbaar.

set -euo pipefail

# Resolve project root (script dir = <root>/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/public/assets/audio/voices"
LOG_FILE="${SCRIPT_DIR}/normalize-voices.log"

MODE="sample"
DRY_RUN=0
SINGLE_FILE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --sample)  MODE="sample"; shift ;;
        --all)     MODE="all"; shift ;;
        --single)  MODE="single"; SINGLE_FILE="${2:-}"; shift 2 ;;
        --dry-run) DRY_RUN=1; shift ;;
        -h|--help)
            sed -n '2,25p' "$0"
            exit 0
            ;;
        *) echo "Onbekende flag: $1" >&2; exit 1 ;;
    esac
done

case "$MODE" in
    sample) OUT_DIR="${ROOT_DIR}/public/assets/audio/voices-normalized-sample" ;;
    all)    OUT_DIR="${ROOT_DIR}/public/assets/audio/voices-normalized" ;;
    single) OUT_DIR="${ROOT_DIR}/public/assets/audio/voices-normalized-single" ;;
esac

# Sanity checks
if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ERROR: ffmpeg niet gevonden. brew install ffmpeg" >&2; exit 1
fi
if [[ ! -d "$SOURCE_DIR" ]]; then
    echo "ERROR: Source dir niet gevonden: $SOURCE_DIR" >&2; exit 1
fi

# ffmpeg filter chain — één string, comma-separated
FILTER_CHAIN="highpass=f=80,equalizer=f=150:t=h:width=2:g=-2,equalizer=f=3000:t=h:width=2:g=1.5,compand=attacks=0:points=-80/-80|-50/-50|-20/-15:soft-knee=6,loudnorm=I=-16:TP=-1:LRA=11"

# Build file list
FILES=()
case "$MODE" in
    single)
        if [[ -z "$SINGLE_FILE" || ! -f "$SINGLE_FILE" ]]; then
            echo "ERROR: --single vereist geldig pad. Gegeven: '$SINGLE_FILE'" >&2; exit 1
        fi
        FILES=("$SINGLE_FILE")
        ;;
    all)
        while IFS= read -r f; do FILES+=("$f"); done < <(find "$SOURCE_DIR" -type f -name "*.mp3" | sort)
        ;;
    sample)
        for FACTION_DIR in "$SOURCE_DIR"/*/; do
            [[ -d "$FACTION_DIR" ]] || continue
            # 3 random per factie (recursief, alle units onder de factie)
            while IFS= read -r f; do FILES+=("$f"); done < <(
                find "$FACTION_DIR" -type f -name "*.mp3" | awk 'BEGIN{srand()} {print rand()"\t"$0}' | sort | head -3 | cut -f2-
            )
        done
        ;;
esac

TOTAL=${#FILES[@]}
if [[ $TOTAL -eq 0 ]]; then
    echo "Geen MP3's gevonden voor mode=$MODE." >&2; exit 1
fi

echo "Mode:        $MODE"
echo "Source:      $SOURCE_DIR"
echo "Output:      $OUT_DIR"
echo "Bestanden:   $TOTAL"
echo "Dry-run:     $([[ $DRY_RUN -eq 1 ]] && echo ja || echo nee)"
echo "----------------------------------------------------------"

# Reset log
[[ $DRY_RUN -eq 0 ]] && : > "$LOG_FILE"

i=0
SKIPPED=0
SUCCESS=0
SAMPLE_PATHS=()

for SRC in "${FILES[@]}"; do
    i=$((i+1))
    REL="${SRC#"$SOURCE_DIR"/}"
    DST="${OUT_DIR}/${REL}"
    DST_DIR="$(dirname "$DST")"

    printf "[%d/%d] %s\n" "$i" "$TOTAL" "$REL"

    CMD=(ffmpeg -y -hide_banner -loglevel error -i "$SRC" -af "$FILTER_CHAIN" -c:a libmp3lame -q:a 2 "$DST")

    if [[ $DRY_RUN -eq 1 ]]; then
        printf '    DRY: %q ' "${CMD[@]}"; echo
        continue
    fi

    mkdir -p "$DST_DIR"
    if "${CMD[@]}" 2>>"$LOG_FILE"; then
        SUCCESS=$((SUCCESS+1))
        SAMPLE_PATHS+=("$DST")
    else
        SKIPPED=$((SKIPPED+1))
        echo "[SKIP] $SRC — zie $LOG_FILE" >&2
        echo "[$(date '+%F %T')] SKIP $SRC" >> "$LOG_FILE"
    fi
done

echo "----------------------------------------------------------"
echo "Klaar. Succes: $SUCCESS / $TOTAL — overgeslagen: $SKIPPED"
[[ $SKIPPED -gt 0 ]] && echo "Log: $LOG_FILE"

if [[ "$MODE" == "sample" && $DRY_RUN -eq 0 ]]; then
    echo
    echo "A/B test paths (origineel <-> genormaliseerd):"
    for OUT in "${SAMPLE_PATHS[@]}"; do
        REL="${OUT#"$OUT_DIR"/}"
        echo "  ORIG: ${SOURCE_DIR}/${REL}"
        echo "  NORM: ${OUT}"
        echo
    done
fi
