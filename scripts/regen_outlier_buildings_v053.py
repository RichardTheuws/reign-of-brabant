#!/usr/bin/env python3
"""
Regen 2 outlier building portraits (limburg + belgen faction-special-1) to
match painted-vignette quality of brabant (1.2MB) + randstad (971KB) anchors.

Style: painted oil-vignette, ornate gold curved filigree frame border at top
edge, dark moody vignette background, dramatic chiaroscuro lighting. NO
BiRefNet (vignette + gold frame ARE the design). Output stays at 1024x1024
to hit >=800KB byte target — anchors are also 1024x1024 PNG optimize=True.

Pipeline: queue.fal.run/fal-ai/flux/dev -> PIL re-encode PNG (no resize).
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

# Load API key from .env
ENV_PATH = Path("/Users/richardtheuws/Documents/games/.env")
api_key = None
for line in ENV_PATH.read_text().splitlines():
    if line.startswith("FAL_AI_KEY="):
        api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
        break
if not api_key:
    print("ERROR: FAL_AI_KEY not found in .env")
    sys.exit(1)

OUT_DIR = Path("/Users/richardtheuws/Documents/games/reign-of-brabant/public/assets/portraits/buildings")
MANIFEST_PATH = OUT_DIR / "_outlier-buildings-v053-batch.json"

# Faction-specific style suffixes (matching v048 anchors but tuned for limburg + belgen palettes)
LIMBURG_SUFFIX = (
    "centered on dark moody vignette background with deep slate-grey-black gradient "
    "and warm pale-yellow chalky candlelight accent, ornate gold curved filigree "
    "frame border at top edge and corners matching painted RPG card style, "
    "dramatic chiaroscuro lighting, oil painting texture, museum quality, "
    "no readable text, no modern logos, no people figures dominating composition"
)

BELGEN_SUFFIX = (
    "centered on dark moody vignette background with deep oxblood-black gradient "
    "and warm golden-yellow gaslight chandelier accent, ornate gold curved filigree "
    "frame border at top edge and corners matching painted RPG card style, "
    "dramatic chiaroscuro lighting, oil painting texture meets classical Flemish "
    "salon concept art, museum quality, no readable text, no real-world brand logos, "
    "no people figures dominating composition"
)

ASSETS = [
    {
        "file": "limburg-faction-special-1.png",
        "subject": (
            "painted RPG card art, Limburgian vlaaiwinkel (vlaai bakery shop), "
            "warm timber-and-mergel-limestone storefront with low arched doorway "
            "and tall arched display window, golden-glazed Limburgse vlaaien "
            "(round open-faced fruit pies with lattice tops) arranged on tiered "
            "wooden display planks in the vitrine, small Limburgse blauw-en-geel "
            "(blue and yellow) festive pennants strung above the awning, small "
            "wooden signboard hanging from an iron bracket (no readable text), "
            "warm honey-glow from the interior pouring through the window, "
            "chalky pale mergel-stone facade contrasted with dark oak window-frames"
        ),
        "faction": "limburg",
    },
    {
        "file": "belgen-faction-special-1.png",
        "subject": (
            "painted RPG card art, Belgian diplomatic salon interior (diplomatiek "
            "salon), opulent Brusselian art-nouveau reception room with curved dark-"
            "walnut wood-paneled walls and brass sinuous floral inlays, ornate "
            "crystal-and-brass chandelier hanging mid-frame casting warm amber light, "
            "two deep cognac-brown buttoned-leather Chesterfield fauteuil chairs "
            "flanking a small inlaid round side-table with a silver carafe, tall "
            "vertical zwart-geel-rood (black-yellow-red) Belgian heraldic banner "
            "hanging on the back wall, polished dark parquet floor reflecting the "
            "chandelier, classical Belgian diplomatic-grandeur atmosphere"
        ),
        "faction": "belgen",
    },
]

NEGATIVE_PROMPT = (
    "blurry, photorealistic photograph, watermark, signature, gibberish text, "
    "real-world brand logos, recognizable corporate logos, EU flag, national flag "
    "draped flat, anime, cartoon, ugly, deformed, multiple buildings cluttered, "
    "stick figures, dominant human figure, people in foreground"
)

FLUX_SUBMIT_URL = "https://queue.fal.run/fal-ai/flux/dev"
HEADERS = {
    "Authorization": f"Key {api_key}",
    "Content-Type": "application/json",
}


def http_post(url: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_get(url: str) -> dict:
    req = urllib.request.Request(url, headers=HEADERS, method="GET")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_download(url: str) -> bytes:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def build_prompt(asset: dict) -> str:
    suffix = LIMBURG_SUFFIX if asset["faction"] == "limburg" else BELGEN_SUFFIX
    return f"{asset['subject']}, {suffix}"


def submit_one(asset: dict) -> dict:
    prompt = build_prompt(asset)
    payload = {
        "prompt": prompt,
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": True,
    }
    resp = http_post(FLUX_SUBMIT_URL, payload)
    return {
        "asset": asset,
        "prompt": prompt,
        "request_id": resp.get("request_id"),
        "status_url": resp.get("status_url"),
        "response_url": resp.get("response_url"),
    }


def poll_one(job: dict, max_attempts: int = 40, sleep: float = 2.5) -> dict:
    for attempt in range(max_attempts):
        try:
            st = http_get(job["status_url"])
        except urllib.error.HTTPError as e:
            print(f"  poll error {job['asset']['file']}: HTTP {e.code}, retry...")
            time.sleep(sleep)
            continue
        status = st.get("status")
        if status == "COMPLETED":
            return http_get(job["response_url"])
        if status in ("FAILED", "ERROR"):
            raise RuntimeError(f"job failed: {st}")
        time.sleep(sleep)
    raise TimeoutError(f"timeout for {job['asset']['file']}")


def process_one(asset: dict, attempt_idx: int = 1) -> dict:
    name = asset["file"]
    try:
        out_path = OUT_DIR / name
        bak_path = OUT_DIR / name.replace(".png", ".bak.png")
        if out_path.exists() and not bak_path.exists():
            bak_path.write_bytes(out_path.read_bytes())
            print(f"  backed up {name} -> {bak_path.name}")

        job = submit_one(asset)
        print(f"  submitted {name} attempt {attempt_idx} (request_id={job['request_id'][:8]}...)")

        result = poll_one(job)
        img_url = result["images"][0]["url"]
        seed = result.get("seed")

        raw = http_download(img_url)

        from PIL import Image
        im = Image.open(BytesIO(raw)).convert("RGB")
        # Keep 1024x1024 — anchors (brabant 1.2MB, randstad 994KB) are 1024x1024.
        im.save(out_path, format="PNG", optimize=True)
        size = out_path.stat().st_size

        return {
            "file": name,
            "faction": asset["faction"],
            "prompt": job["prompt"],
            "seed": seed,
            "url": img_url,
            "bytes": size,
            "attempt": attempt_idx,
            "status": "ok",
        }
    except Exception as e:
        return {
            "file": name,
            "faction": asset["faction"],
            "attempt": attempt_idx,
            "status": "error",
            "error": str(e),
        }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generating {len(ASSETS)} outlier portraits in parallel...")
    t0 = time.time()
    results = []
    iterations = {a["file"]: 0 for a in ASSETS}
    THRESHOLD = 800 * 1024  # 800KB
    MAX_ATTEMPTS = 3

    pending = list(ASSETS)
    while pending:
        with ThreadPoolExecutor(max_workers=len(pending)) as ex:
            futs = {}
            for a in pending:
                iterations[a["file"]] += 1
                futs[ex.submit(process_one, a, iterations[a["file"]])] = a
            batch_results = []
            for fut in as_completed(futs):
                r = fut.result()
                print(f"[{r['status']}] {r['file']} attempt {r['attempt']}", end="")
                if r["status"] == "ok":
                    print(f" ({r['bytes']/1024:.0f}KB, seed={r.get('seed')})")
                else:
                    print(f" ERROR: {r.get('error')}")
                batch_results.append(r)

        # Check which ones need retry: error OR under threshold
        retry = []
        for r in batch_results:
            if r["status"] != "ok":
                if r["attempt"] < MAX_ATTEMPTS:
                    retry.append(next(a for a in ASSETS if a["file"] == r["file"]))
                else:
                    results.append(r)
            elif r["bytes"] < THRESHOLD:
                if r["attempt"] < MAX_ATTEMPTS:
                    print(f"  {r['file']} below threshold ({r['bytes']/1024:.0f}KB < 800KB), retrying...")
                    retry.append(next(a for a in ASSETS if a["file"] == r["file"]))
                else:
                    print(f"  {r['file']} below threshold after {MAX_ATTEMPTS} attempts, accepting best")
                    results.append(r)
            else:
                results.append(r)

        pending = retry

    elapsed = time.time() - t0
    print(f"\nTotal wallclock: {elapsed:.1f}s")

    manifest = {
        "generated": time.strftime("%Y-%m-%d"),
        "wallclock_s": round(elapsed, 1),
        "model": "fal-ai/flux/dev",
        "image_size": "square_hd (1024x1024 retained, no resize)",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "negative_prompt": NEGATIVE_PROMPT,
        "limburg_style_suffix": LIMBURG_SUFFIX,
        "belgen_style_suffix": BELGEN_SUFFIX,
        "byte_threshold": 800 * 1024,
        "max_attempts": MAX_ATTEMPTS,
        "iterations_per_file": iterations,
        "assets": results,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    print(f"Manifest: {MANIFEST_PATH}")

    n_ok = sum(1 for r in results if r["status"] == "ok")
    n_err = len(results) - n_ok
    n_passed = sum(1 for r in results if r["status"] == "ok" and r.get("bytes", 0) >= 800 * 1024)
    print(f"Summary: {n_ok}/{len(results)} OK, {n_passed} above 800KB threshold, {n_err} errors")


if __name__ == "__main__":
    main()
