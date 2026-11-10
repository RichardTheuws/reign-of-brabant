#!/usr/bin/env bash
# Reign of Brabant — static deploy to Hetzner (theuws-prod:/srv/apps/static/reign-of-brabant, since 2026-11-04).
#
# Check out the pushed commit → npm ci → regression gate (typecheck + vitest + UAT) → build → rsync into a staging
# copy next to the live folder → swap the two folders → Cloudflare purge → check that exactly this version is live.
# If that check fails, the previous release is swapped back automatically.
# Building from that checkout (not the working tree) means only reviewed, pushed content goes live; uncommitted work in
# the repo never ships. Shared steps: scripts/deploy-hetzner-lib.sh (template in server-mini-development, update via
# /adopt-tooling). The Cloudflare token comes from the shared credentials file, never from this repo (it is public).
#
#   scripts/deploy.sh               full deploy
#   scripts/deploy.sh --skip-tests  emergency only: skip the regression gate (the build still type-checks)
#   scripts/deploy.sh --dry-run     check out, gate and build locally; change nothing on the server
#   scripts/deploy.sh --skip-purge  leave the Cloudflare cache alone (old flag, kept for the habit)
#
# Zero downtime: the staging copy (<live>-next) starts as a hardlink copy of the live folder (near-free, 370 MB of
# models and audio), rsync replaces changed files by rename, so the live folder is never touched. The swap is two
# renames. Caddy mounts the parent /srv/apps/static, so it follows the rename.
# Rollback: the previous release stays as <live>-prev until the next deploy. By hand:
#   ssh theuws-prod 'cd /srv/apps/static && sudo mv reign-of-brabant reign-of-brabant-failed && sudo mv reign-of-brabant-prev reign-of-brabant'
#   (then purge Cloudflare)
set -euo pipefail

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HZ_HOST="theuws-prod"
HZ_DIR="/srv/apps/static/reign-of-brabant"
HZ_SRC_DIR="$PROJECT"
LIVE="$HZ_DIR"
NEXT="$HZ_DIR-next"
PREV="$HZ_DIR-prev"
URL="https://reign-of-brabant.nl"
CF_ZONE_ID="b49ad07decd377bfe4068f5f1701452e"   # reign-of-brabant.nl (a zone id is not a secret)
# shellcheck source=scripts/deploy-hetzner-lib.sh
source "$PROJECT/scripts/deploy-hetzner-lib.sh"

SKIP_TESTS=false
DRY_RUN=false
SKIP_PURGE=false
for arg in "$@"; do
  case "$arg" in
    --skip-tests) SKIP_TESTS=true ;;
    --dry-run) DRY_RUN=true ;;
    --skip-purge) SKIP_PURGE=true ;;
    -h|--help) sed -n '2,24p' "$0"; exit 0 ;;
    *) hz_die "unknown option: $arg (see --help)" ;;
  esac
done

echo "=== REIGN OF BRABANT DEPLOY ==="
hz_check
cd "$PROJECT"
hz_require_pushed_main

# Resolve the purge token before production changes: a missing token must stop the deploy, not leave a stale cache.
CF_TOKEN=$(hz_cf_token) || hz_die "no Cloudflare token in the credentials file"

# A temporary git worktree of the pushed HEAD instead of hz_export_head: same clean content, but the tests that check
# assets with `git ls-files` need a git checkout.
REVISION=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
SRC="$TMP/rob"
trap 'git -C "$PROJECT" worktree remove --force "$SRC" 2>/dev/null || true; rm -rf "$TMP"; git -C "$PROJECT" worktree prune' EXIT
git worktree add -q --detach "$SRC" HEAD
VERSION=$(node -p "require('$SRC/package.json').version")
hz_log "version $VERSION ($REVISION)"

hz_log "npm ci (in the checkout)"
# --ignore-scripts: no dependency lifecycle scripts on a machine that holds the Cloudflare token and sudo on prod.
(cd "$SRC" && npm ci --ignore-scripts --no-audit --no-fund --loglevel=error)

if [[ "$SKIP_TESTS" == true ]]; then
  hz_log "WARNING: --skip-tests, regression gate skipped"
else
  hz_log "regression gate: typecheck + vitest + UAT"
  (cd "$SRC" && npm run test:all) || hz_die "regression gate failed: nothing deployed"
fi

hz_log "build"
if [[ "$SKIP_TESTS" == true ]]; then
  (cd "$SRC" && npm run build)           # tsc + vite
else
  (cd "$SRC" && npx vite build)          # the gate already ran tsc
fi
STAGE="$SRC/dist"
for f in index.html play/index.html assets/models/v02/brabanders/townhall.glb assets/audio/sfx/click.mp3 \
         assets/audio/music/music_main_menu.mp3 assets/portraits/brabant-worker.png; do
  [[ -f "$STAGE/$f" ]] || hz_die "build is missing $f: nothing deployed"
done
# /play/ loads its models via a relative assets/ path: point it at the shared assets folder (rsync keeps the link).
ln -sfn ../assets "$STAGE/play/assets"
echo "$VERSION" > "$STAGE/VERSION"
echo "$REVISION" > "$STAGE/REVISION"
hz_log "staged $(find "$STAGE" -type f | wc -l | tr -d ' ') files"

if [[ "$DRY_RUN" == true ]]; then
  hz_log "dry run: build checked ($(du -sh "$STAGE" | cut -f1)), nothing changed on $HZ_HOST; the checkout is removed now"
  exit 0
fi

purge() {
  if [[ "$SKIP_PURGE" == true ]]; then hz_log "--skip-purge: Cloudflare cache left alone"; else hz_cf_purge "$CF_ZONE_ID" "$CF_TOKEN"; fi
}

# 1. Staging copy of the live folder (hardlinks), then rsync the new build into it. The live folder is not touched.
hz_ssh sudo rm -rf "$NEXT"
hz_ssh sudo cp -al "$LIVE" "$NEXT"
# --checksum: a fresh build gives every file a new mtime; compare content instead, so unchanged models and audio
# keep their hardlink (and are not sent again).
HZ_DIR="$NEXT" hz_sync "$STAGE" --checksum

# 2. Swap: live → prev, next → live.
hz_ssh sudo rm -rf "$PREV"
hz_ssh sudo mv "$LIVE" "$PREV"
hz_ssh sudo mv "$NEXT" "$LIVE" || { hz_ssh sudo mv "$PREV" "$LIVE"; hz_die "swap failed, previous release restored"; }
hz_log "swapped: $LIVE is now $VERSION ($REVISION), previous release in $PREV"
purge

# 3. Live check, in a subshell so a failure (hz_die exits) lands in the rollback below.
if ! (
  hz_wait_exact "$URL/VERSION" "$VERSION"
  hz_wait_exact "$URL/REVISION" "$REVISION"
  for p in / /play/ /updates/ /play/assets/audio/sfx/click.mp3; do hz_wait_http "$URL$p"; done
); then
  hz_ssh sudo rm -rf "$LIVE-failed"
  hz_ssh sudo mv "$LIVE" "$LIVE-failed"
  hz_ssh sudo mv "$PREV" "$LIVE"
  purge
  hz_die "live check failed: previous release restored, the failed build is in $LIVE-failed"
fi
echo "✅ Live: $URL (v$VERSION, $REVISION)"
echo "=== DEPLOY COMPLETE ==="
