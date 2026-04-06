#!/bin/bash
# =============================================================================
# sync-voice-recordings.sh — Sync approved Voice Studio recordings to the game
# =============================================================================
#
# Downloads approved (and optionally recorded) voice lines from the M4 server
# (Voice Studio) and places them in the correct game asset directory structure.
#
# Pipeline:
#   1. SSH to M4, fetch recordings.json and voice-lines.json
#   2. Filter entries by status (approved, optionally recorded)
#   3. Optionally filter by faction
#   4. Download matching MP3 files via scp
#   5. Rename from flat naming (brabanders-boer-select-1.mp3) to game
#      directory structure (brabanders/boer/select_1.mp3)
#   6. Report: new, updated, skipped, missing
#
# Usage:
#   ./scripts/sync-voice-recordings.sh                        # approved only
#   ./scripts/sync-voice-recordings.sh --include-recorded     # + recorded
#   ./scripts/sync-voice-recordings.sh --faction brabanders   # one faction
#   ./scripts/sync-voice-recordings.sh --dry-run              # preview only
#
# Requirements:
#   - SSH access to server-mini (M4)
#   - jq installed locally
#   - Voice Studio running on M4 with data in /Users/Shared/srv/voice-studio/data/
#
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VOICES_DIR="$PROJECT_ROOT/assets/audio/voices"
TMP_DIR="$(mktemp -d)"

# Remote (M4 server)
REMOTE="server-mini"
REMOTE_DATA="/Users/Shared/srv/voice-studio/data"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
INCLUDE_RECORDED=false
FACTION_FILTER=""
DRY_RUN=false

# Counters
COUNT_NEW=0
COUNT_UPDATED=0
COUNT_SKIPPED=0
COUNT_MISSING=0

# ---------------------------------------------------------------------------
# Cleanup on exit
# ---------------------------------------------------------------------------
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --include-recorded)
      INCLUDE_RECORDED=true
      shift
      ;;
    --faction)
      if [[ -z "${2:-}" ]]; then
        echo "ERROR: --faction requires a value"
        exit 1
      fi
      FACTION_FILTER="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --include-recorded   Also sync recordings with status 'recorded' (not yet approved)"
      echo "  --faction <name>     Only sync a specific faction (e.g. brabanders, randstad)"
      echo "  --dry-run            Show what would be synced without downloading"
      echo "  -h, --help           Show this help message"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option: $1"
      echo "Run '$0 --help' for usage"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Verify dependencies
# ---------------------------------------------------------------------------
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed. Install with: brew install jq"
  exit 1
fi

# ---------------------------------------------------------------------------
# Status banner
# ---------------------------------------------------------------------------
echo "=========================================="
echo " Voice Studio → Reign of Brabant Sync"
echo "=========================================="
echo ""
echo "Remote:           $REMOTE:$REMOTE_DATA"
echo "Target:           $VOICES_DIR"
echo "Include recorded: $INCLUDE_RECORDED"
echo "Faction filter:   ${FACTION_FILTER:-all}"
echo "Dry run:          $DRY_RUN"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Fetch recordings.json and voice-lines.json from M4
# ---------------------------------------------------------------------------
echo "[1/4] Fetching data from $REMOTE..."

scp -q "$REMOTE:$REMOTE_DATA/recordings.json" "$TMP_DIR/recordings.json"
scp -q "$REMOTE:$REMOTE_DATA/voice-lines.json" "$TMP_DIR/voice-lines.json"

echo "      recordings.json: $(jq 'length' "$TMP_DIR/recordings.json") entries"
echo "      voice-lines.json: $(jq 'length' "$TMP_DIR/voice-lines.json") lines"
echo ""

# ---------------------------------------------------------------------------
# Step 2: Build list of line IDs to sync
# ---------------------------------------------------------------------------
echo "[2/4] Filtering voice lines..."

# Build jq filter for status
if [[ "$INCLUDE_RECORDED" == "true" ]]; then
  STATUS_FILTER='.status == "approved" or .status == "recorded"'
  echo "      Status filter: approved + recorded"
else
  STATUS_FILTER='.status == "approved"'
  echo "      Status filter: approved only"
fi

# Get all line IDs that match our status filter from recordings.json
# Output format: one lineId per line
MATCHING_IDS=$(jq -r \
  --arg status_filter "$STATUS_FILTER" \
  'to_entries[] | select(.value | ('"$STATUS_FILTER"')) | .key' \
  "$TMP_DIR/recordings.json")

if [[ -z "$MATCHING_IDS" ]]; then
  echo ""
  echo "No recordings match the status filter. Nothing to sync."
  exit 0
fi

# For each matching ID, look up the voice-lines.json entry to get faction, unit, action, variant
# Build a manifest: lineId|faction|unit|action|variant|outputPath
MANIFEST=""
while IFS= read -r line_id; do
  # Look up this line in voice-lines.json
  LINE_DATA=$(jq -r \
    --arg id "$line_id" \
    '.[] | select(.id == $id) | "\(.faction)|\(.unit)|\(.action)|\(.variant)|\(.outputPath // "")"' \
    "$TMP_DIR/voice-lines.json")

  if [[ -z "$LINE_DATA" ]]; then
    # Line ID exists in recordings but not in voice-lines — skip
    continue
  fi

  FACTION=$(echo "$LINE_DATA" | cut -d'|' -f1)

  # Apply faction filter if set
  if [[ -n "$FACTION_FILTER" && "$FACTION" != "$FACTION_FILTER" ]]; then
    continue
  fi

  MANIFEST+="${line_id}|${LINE_DATA}"$'\n'
done <<< "$MATCHING_IDS"

# Remove trailing newline
MANIFEST=$(echo -n "$MANIFEST" | sed '/^$/d')

if [[ -z "$MANIFEST" ]]; then
  echo ""
  echo "No recordings match the filters. Nothing to sync."
  exit 0
fi

TOTAL_LINES=$(echo "$MANIFEST" | wc -l | tr -d ' ')
echo "      Found $TOTAL_LINES recordings to process"
echo ""

# ---------------------------------------------------------------------------
# Step 3: Download and place MP3 files
# ---------------------------------------------------------------------------
echo "[3/4] Syncing MP3 files..."
echo ""

while IFS='|' read -r LINE_ID FACTION UNIT ACTION VARIANT OUTPUT_PATH; do
  # Determine target path
  if [[ -n "$OUTPUT_PATH" && "$OUTPUT_PATH" != "null" ]]; then
    # Use the outputPath from voice-lines.json directly
    TARGET_FILE="$VOICES_DIR/$OUTPUT_PATH"
  else
    # Fallback: construct from components
    TARGET_FILE="$VOICES_DIR/$FACTION/$UNIT/${ACTION}_${VARIANT}.mp3"
  fi

  REMOTE_FILE="$REMOTE_DATA/mp3/${LINE_ID}.mp3"
  STATUS=$(jq -r --arg id "$LINE_ID" '.[$id].status' "$TMP_DIR/recordings.json")

  # Check if remote file exists (cache this check)
  if ! ssh -q "$REMOTE" "test -f '$REMOTE_FILE'" 2>/dev/null; then
    echo "  MISSING  $LINE_ID (MP3 not found on server)"
    ((COUNT_MISSING++)) || true
    continue
  fi

  # Get remote file modification time (epoch)
  REMOTE_MTIME=$(ssh -q "$REMOTE" "stat -f '%m' '$REMOTE_FILE'" 2>/dev/null || echo "0")

  # Check if local file exists and compare
  if [[ -f "$TARGET_FILE" ]]; then
    LOCAL_MTIME=$(stat -f '%m' "$TARGET_FILE" 2>/dev/null || echo "0")

    # Skip if local file is newer or same age
    if [[ "$LOCAL_MTIME" -ge "$REMOTE_MTIME" ]]; then
      echo "  SKIP     $LINE_ID → $(echo "$TARGET_FILE" | sed "s|$PROJECT_ROOT/||") (local is up to date)"
      ((COUNT_SKIPPED++)) || true
      continue
    fi

    ACTION_LABEL="UPDATE"
    ((COUNT_UPDATED++)) || true
  else
    ACTION_LABEL="NEW"
    ((COUNT_NEW++)) || true
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  $ACTION_LABEL    $LINE_ID [$STATUS] → $(echo "$TARGET_FILE" | sed "s|$PROJECT_ROOT/||") (dry run)"
  else
    # Create target directory
    TARGET_DIR=$(dirname "$TARGET_FILE")
    mkdir -p "$TARGET_DIR"

    # Download the file
    scp -q "$REMOTE:$REMOTE_FILE" "$TARGET_FILE"
    echo "  $ACTION_LABEL    $LINE_ID [$STATUS] → $(echo "$TARGET_FILE" | sed "s|$PROJECT_ROOT/||")"
  fi

done <<< "$MANIFEST"

echo ""

# ---------------------------------------------------------------------------
# Step 4: Report
# ---------------------------------------------------------------------------
echo "[4/4] Sync complete"
echo "=========================================="
echo "  New:      $COUNT_NEW"
echo "  Updated:  $COUNT_UPDATED"
echo "  Skipped:  $COUNT_SKIPPED"
echo "  Missing:  $COUNT_MISSING"
echo "=========================================="

TOTAL_SYNCED=$((COUNT_NEW + COUNT_UPDATED))
if [[ "$DRY_RUN" == "true" && $TOTAL_SYNCED -gt 0 ]]; then
  echo ""
  echo "This was a dry run. Run without --dry-run to apply changes."
elif [[ $TOTAL_SYNCED -gt 0 ]]; then
  echo ""
  echo "Synced $TOTAL_SYNCED voice line(s) to $VOICES_DIR"
fi

if [[ $COUNT_MISSING -gt 0 ]]; then
  echo ""
  echo "WARNING: $COUNT_MISSING recording(s) have status entries but no MP3 file on the server."
  echo "         This may mean ffmpeg conversion hasn't finished yet."
fi
