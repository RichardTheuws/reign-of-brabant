#!/usr/bin/env python3
"""
RoB v0.56.0 — Generate 2 painted-vignette command icons:
  cmd-gather-gold.png  (worker hotkey A → auto-gather nearest gold)
  cmd-gather-wood.png  (worker hotkey S → auto-gather nearest wood)

Anchors: cmd-mov.png + cmd-atk.png (painted-vignette, ornate gold curved frame
baked in, dark moody vignette, single hero-object centered, RTS HUD style).

Pipeline: Flux Dev queue (square_hd 1024x1024) -> curl JPG -> PIL re-encode PNG.
NO BiRefNet — vignette + gold frame ARE the design.

Output to public/assets/ui/commands/cmd-gather-gold.png + cmd-gather-wood.png.
Manifest written to public/assets/ui/commands/_gather-cmds-batch.json.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent  # reign-of-brabant/
GAMES_ROOT = REPO_ROOT.parent  # ~/Documents/games/
ENV_FILE = GAMES_ROOT / ".env"

OUT_DIR = REPO_ROOT / "public" / "assets" / "ui" / "commands"
MANIFEST = OUT_DIR / "_gather-cmds-batch.json"

FAL_SUBMIT = "https://queue.fal.run/fal-ai/flux/dev"
# Note: status/response URLs are returned by the submit response; the actual
# request-base path is `fal-ai/flux/requests/{rid}`, NOT `fal-ai/flux/dev/...`.
# We just use the URLs the API hands us — no template construction.

# --------------------------------------------------------------------------
# Prompts — anchored to combat-verbs template (cmd-mov / cmd-atk style)
# --------------------------------------------------------------------------

ASSETS = [
    {
        "file": "cmd-gather-gold.png",
        "key": "gather-gold",
        "command": "Gather Gold",
        "prompt": (
            "painted RPG card art action icon, a single hero gold ore chunk "
            "with bright glowing yellow-gold veins running through dark stone, "
            "a heavy iron pickaxe leaning against the ore on the right side, "
            "two stacked gleaming gold ingots lying in front of the ore on a "
            "small rocky ledge, polished metallic gold sheen with strong "
            "yellow-gold reflections, painted oil texture, centered on dark "
            "moody vignette background with deep brown-black gradient and "
            "warm yellow-gold accent lighting from below, ornate gold curved "
            "frame border, dramatic chiaroscuro lighting catching the gold "
            "veins and ingots, fantasy game ability icon, oil painting "
            "texture, no text, no dollar sign, no coin emblem, museum quality"
        ),
        "negative_prompt": (
            "cartoon coin, dollar sign, $ symbol, euro symbol, currency "
            "symbol, emoji, flat icon, modern UI flat design, photorealistic "
            "photograph, blurry, watermark, gibberish text, multiple objects "
            "cluttered, cartoony, chibi"
        ),
    },
    {
        "file": "cmd-gather-wood.png",
        "key": "gather-wood",
        "command": "Gather Wood",
        "prompt": (
            "painted RPG card art action icon, a single freshly chopped "
            "wooden log with rich saddle-brown bark and warm tan inner "
            "wood-grain rings exposed at the cut end, a heavy double-bit "
            "woodcutter's axe with dark steel head and oak handle embedded "
            "deep into the top of the log, a few curled wood-shavings and "
            "small split kindling pieces scattered at the base, painted oil "
            "texture, centered on dark moody vignette background with deep "
            "brown-black gradient and warm amber lantern accent lighting, "
            "ornate gold curved frame border, dramatic chiaroscuro lighting "
            "catching the polished axe-blade and the cut wood-grain, fantasy "
            "game ability icon, oil painting texture, no text, no living "
            "tree, no green leaves, no foliage, museum quality"
        ),
        "negative_prompt": (
            "living tree, green leaves, foliage, forest scene, cartoony tree "
            "emoji, saw, chainsaw, modern tool, flat icon, modern UI flat "
            "design, photorealistic photograph, blurry, watermark, gibberish "
            "text, multiple objects cluttered, cartoony, chibi"
        ),
    },
]

# --------------------------------------------------------------------------
# Env + HTTP helpers
# --------------------------------------------------------------------------


def load_fal_key() -> str:
    if not ENV_FILE.exists():
        sys.exit(f"ERROR: {ENV_FILE} not found")
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line.startswith("FAL_AI_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("ERROR: FAL_AI_KEY not in .env")


def http_post_json(url: str, key: str, payload: dict) -> dict:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Key {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def http_get_json(url: str, key: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Key {key}"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def http_get_bytes(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=120) as resp:
        return resp.read()


# --------------------------------------------------------------------------
# Per-asset job
# --------------------------------------------------------------------------


def generate_one(asset: dict, key: str) -> dict:
    """Submit -> poll -> download -> re-encode to PNG. Returns manifest entry."""
    name = asset["file"]
    print(f"[{name}] submit")

    payload = {
        "prompt": asset["prompt"],
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": True,
    }
    if asset.get("negative_prompt"):
        # Flux Dev on fal.ai accepts neg via separate field — pass through the
        # request_logs schema. If unsupported the field is ignored, no harm.
        payload["negative_prompt"] = asset["negative_prompt"]

    submit = http_post_json(FAL_SUBMIT, key, payload)
    rid = submit.get("request_id")
    status_url = submit.get("status_url")
    response_url = submit.get("response_url")
    if not (rid and status_url and response_url):
        raise RuntimeError(f"[{name}] bad submit response: {submit}")
    print(f"[{name}] queued rid={rid}")

    # Poll status until COMPLETED (max ~3 min)
    deadline = time.time() + 180
    status = None
    while time.time() < deadline:
        st = http_get_json(status_url, key)
        status = st.get("status")
        if status == "COMPLETED":
            break
        if status in ("FAILED", "CANCELLED"):
            raise RuntimeError(f"[{name}] terminal status {status}: {st}")
        time.sleep(2)

    if status != "COMPLETED":
        raise RuntimeError(f"[{name}] timed out waiting for COMPLETED")

    result = http_get_json(response_url, key)
    images = result.get("images") or []
    if not images:
        raise RuntimeError(f"[{name}] no images in result: {result}")
    img_url = images[0]["url"]
    seed = result.get("seed")
    print(f"[{name}] flux done seed={seed}")

    # Download + PIL re-encode JPG -> PNG (anchors are ~1MB PNG, no resize)
    raw = http_get_bytes(img_url)
    img = Image.open(BytesIO(raw)).convert("RGB")
    out_path = OUT_DIR / name
    img.save(out_path, format="PNG", optimize=True)
    size_kb = out_path.stat().st_size / 1024.0
    print(f"[{name}] wrote {out_path} ({size_kb:.1f} KB)")

    return {
        "file": name,
        "key": asset["key"],
        "command": asset["command"],
        "size_kb": round(size_kb, 1),
        "model": "fal-ai/flux/dev",
        "image_size": "square_hd",
        "seed": seed,
        "source_url": img_url,
        "prompt": asset["prompt"],
        "negative_prompt": asset.get("negative_prompt"),
    }


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


def main() -> int:
    if not OUT_DIR.exists():
        sys.exit(f"ERROR: output dir does not exist: {OUT_DIR}")

    key = load_fal_key()

    entries = []
    errors = []
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = {pool.submit(generate_one, a, key): a for a in ASSETS}
        for fut in as_completed(futures):
            asset = futures[fut]
            try:
                entries.append(fut.result())
            except Exception as exc:  # noqa: BLE001
                errors.append({"file": asset["file"], "error": str(exc)})
                print(f"[{asset['file']}] ERROR: {exc}", file=sys.stderr)

    # Sort entries by canonical order (gold first)
    order = {a["file"]: i for i, a in enumerate(ASSETS)}
    entries.sort(key=lambda e: order.get(e["file"], 99))

    manifest = {
        "batch": "gather-cmd-icons-v056",
        "generated": time.strftime("%Y-%m-%d"),
        "model": "fal-ai/flux/dev",
        "size": "square_hd (1024x1024)",
        "pipeline": (
            "Flux Dev queue -> PIL re-encode JPG to PNG (no BiRefNet — "
            "vignette + gold frame baked into painting)"
        ),
        "anchor_style": (
            "cmd-mov.png + cmd-atk.png (painted-vignette, ornate gold "
            "curved frame, dark moody vignette, single hero-object centered)"
        ),
        "scope": "worker hotkey command icons (A=gold, S=wood)",
        "assets": entries,
        "errors": errors,
        "cost_estimate_usd": round(0.03 * len(ASSETS), 2),
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"\nManifest: {MANIFEST}")
    print(f"Generated {len(entries)}/{len(ASSETS)} assets")
    if errors:
        print(f"ERRORS: {errors}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
