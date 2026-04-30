#!/usr/bin/env python3
"""
Reign of Brabant -- 3 Support-unit portrait generation in painted-vignette stijl.

Style anchors:
  - public/assets/portraits/brabant-support.png   (Boerinneke, 326KB)  <-- support-anchor
  - public/assets/portraits/randstad-infantry.png (Manager v0.52.0, 272KB)

Both anchors are 512x512 RGB PNG with vignette + ornate gold filigree frame
PAINTED INTO the image. We follow the v0.53.0 unit-portrait batch pipeline:
NO BiRefNet -- vignette + gold-frame ARE the design.

Pipeline per portrait:
  1. Flux Dev queue submit (square_hd 1024x1024, 28 steps, guidance 3.5).
  2. Poll until COMPLETED.
  3. Download JPG, PIL LANCZOS resize -> 512x512, save as PNG with optimize=True.
  4. Save manifest entry.

Parallel: ThreadPoolExecutor(max_workers=3).

Scope: 3 NEW Support portraits (no existing files to back up).
  - randstad-support.png  (HR-Medewerker)
  - limburg-support.png   (Sjpion / mijnwerker-scout-healer)
  - belgen-support.png    (Wafelzuster)

Excluded: brabant-support.png (anchor, do NOT touch).

Usage:
  python3 scripts/regen_support_portraits_v0531.py test           # only randstad-support (validation)
  python3 scripts/regen_support_portraits_v0531.py all            # all 3
  python3 scripts/regen_support_portraits_v0531.py one <name>     # single portrait
"""
import os, sys, json, time, shutil, urllib.request, urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT = Path("/Users/richardtheuws/Documents/games/reign-of-brabant")
ENV_FILE = Path("/Users/richardtheuws/Documents/games/.env")
PORTRAIT_DIR = PROJECT / "public/assets/portraits"
MANIFEST = PROJECT / "scripts/support_portraits_v0531.json"


def load_key():
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("FAL_AI_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("FAL_AI_KEY missing from .env")

KEY = load_key()
HEADERS_JSON = {"Authorization": f"Key {KEY}", "Content-Type": "application/json"}


# =============================================================================
# UNIVERSAL STYLE SUFFIX -- copied verbatim from v0.53.0 unit-portrait batch.
# =============================================================================

PALETTE = {
    "randstad": (
        "centered on dark moody vignette background with deep blue-black "
        "gradient and warm yellow desk-lamp accent lighting (Randstad palette)"
    ),
    "limburg": (
        "centered on dark moody vignette background with brown-black "
        "gradient and warm copper-amber lantern glow (earthen Limburg "
        "mergel-yellow + coal-black + iron-grey palette)"
    ),
    "belgen": (
        "centered on dark moody vignette background with deep gold-black "
        "gradient and warm chocolate-brown accent lighting (Belgian palette: "
        "deep black, golden yellow, accent red, Trappist abbey green)"
    ),
}

STYLE_SUFFIX = (
    "oil painting texture, shoulder-up framing centered in composition, "
    "{palette}, ornate gold curved filigree frame border at top edge and "
    "corners matching painted RPG card style, dramatic chiaroscuro lighting "
    "catching {highlight}, museum quality oil painting, "
    "no readable text, no real-world brand logos, no cartoon proportions"
)

NEG_BASE = (
    "cartoon, chibi, exaggerated proportions, blurry, multiple figures, "
    "text, watermark, brand logos, real corporate logo, ugly, cluttered "
    "background, full body, distant shot"
)


def build_prompt(subject: str, palette_key: str, highlight: str) -> str:
    return (
        f"painted RPG card art portrait of {subject}, "
        + STYLE_SUFFIX.format(palette=PALETTE[palette_key], highlight=highlight)
    )


# =============================================================================
# 3 SUPPORT-UNIT PORTRAITS -- subject + palette + highlight per file.
# Each Support unit signals HEALER/AID role through props (clipboard, bandages,
# basket of waffles) and warm, sympathetic expressions, distinct from the
# combat-focused infantry/ranged units.
# =============================================================================
PORTRAITS = {
    # -------- RANDSTAD support: HR-Medewerker --------
    # Corporate, NOT barista. Distinct from CEO (older, dominant) and
    # Stagiair (nervous, intern). HR = sympathetic, warm authority.
    "randstad-support": dict(
        palette="randstad",
        highlight="the slim tablet edge and the warm rim-light on the cheekbones",
        subject=(
            "a Randstad HR-Medewerker corporate human-resources coach, "
            "approachable late-30s androgynous professional with neatly "
            "tied-back medium-brown hair and gentle empathetic eyes, "
            "wearing a well-fitted slate-blue corporate suit jacket over "
            "a cream blouse with a small slim badge clipped to the lapel, "
            "holding a thin matte-black tablet against the chest with one "
            "hand and a slim silver stylus pen tucked behind one ear, "
            "calm sympathetic coaching expression with a small reassuring "
            "smile and a slight understanding tilt of the head, soft warm "
            "rim-light catching the side of the face suggesting gentle "
            "authority, refined corporate-healer presence (NOT a barista, "
            "NOT a manager dominant pose, NOT a nervous intern)"
        ),
        extra_neg=(
            "barista, espresso machine, coffee shop, latte cup, latte art, "
            "wave hairstyle, dominant power pose, executive arrogance, "
            "anxious posture, oversized suit"
        ),
    ),

    # -------- LIMBURG support: Sjpion --------
    # Reserved analytical scout-healer with mining-folkloric heritage.
    # Hooded leather cape + mining lamp + small medical bandage roll.
    "limburg-support": dict(
        palette="limburg",
        highlight=(
            "the partial face shadow under the hood and the small mining-"
            "lamp glow on the cheekbone"
        ),
        subject=(
            "a Limburg Sjpion mountain-scout healer-spy, reserved late-20s "
            "androgynous figure of mining-folkloric heritage, wearing a "
            "wide hooded dark-brown leather cape pulled forward to cast "
            "a deep shadow across half the face, only one eye visible "
            "below the hood with a sharp analytical gaze, fine ash-streaks "
            "of coal-dust on the visible cheekbone, a small brass-rimmed "
            "miner's oil-lamp clipped to the cape's collar emitting a "
            "soft warm copper-amber glow, holding a small tightly-rolled "
            "white linen medical bandage in one gloved hand as a healer "
            "detail, the other hand resting on a leather satchel at the "
            "hip with small mergel-stone arrow-tips visible, mysterious "
            "reserved analytical expression, austrian-mining-folkloric "
            "feel (NOT cheerful, NOT carnival, NOT Belgian frituur)"
        ),
        extra_neg=(
            "cheerful smile, carnival costume, jester elements, frituur, "
            "waffle, full face visible, no hood, modern hardhat, "
            "fluorescent vest, headphones, Brabantian orange beanie"
        ),
    ),

    # -------- BELGEN support: Wafelzuster --------
    # Female matriarchal healer-figure. Warm waffle-baker with mild
    # sister-cap (NOT a strict nun habit, NOT a young girl).
    "belgen-support": dict(
        palette="belgen",
        highlight=(
            "the golden waffles in the woven basket and the small oil-lamp "
            "flame"
        ),
        subject=(
            "a Belgian Wafelzuster matriarchal waffle-sister healer, warm "
            "matriarchal mid-40s woman with kind round rosy cheeks and "
            "a calm motherly expression, wearing a soft cream sister's "
            "headcap framing the face (mild sister, NOT a strict nun "
            "habit), a clean white linen apron over a warm chocolate-"
            "brown and deep-red bodice with small golden-yellow trim at "
            "the cuffs, cradling a small woven wicker basket against the "
            "hip filled with fresh golden Belgian waffles dusted with "
            "powdered sugar, a tiny brass oil-lamp with a soft warm flame "
            "set on a small ledge at her side casting warm chocolate-"
            "brown rim-light, gentle warm motherly healer presence "
            "(NOT a strict nun, NOT a young girl, NOT a caricature)"
        ),
        extra_neg=(
            "strict nun habit, full black habit, young girl, child, "
            "teenager, McDonald's, modern fast-food uniform, sexualized, "
            "thin glamour pose, full-body distant shot"
        ),
    ),
}


# =============================================================================
# fal.ai pipeline helpers.
# =============================================================================

def http_post(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=HEADERS_JSON, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def http_get(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Key {KEY}"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def queue_submit(prompt: str, label: str) -> dict:
    payload = {
        "prompt": prompt,
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
    }
    res = http_post("https://queue.fal.run/fal-ai/flux/dev", payload)
    return {
        "label": label,
        "status_url": res["status_url"],
        "response_url": res["response_url"],
        "request_id": res["request_id"],
    }


def queue_wait(handle: dict, max_wait_s=180) -> str:
    deadline = time.time() + max_wait_s
    while time.time() < deadline:
        st = http_get(handle["status_url"])
        s = st.get("status")
        if s == "COMPLETED":
            res = http_get(handle["response_url"])
            return res["images"][0]["url"]
        if s in ("FAILED", "ERROR"):
            raise RuntimeError(f"[{handle['label']}] FAILED: {st}")
        time.sleep(3)
    raise TimeoutError(f"[{handle['label']}] timed out after {max_wait_s}s")


def download(url, path):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=240) as r:
        path.write_bytes(r.read())
    return path.stat().st_size


# =============================================================================
# Per-portrait generation.
# =============================================================================

def gen_one(name: str, spec: dict) -> dict:
    out_path = PORTRAIT_DIR / f"{name}.png"
    prompt = build_prompt(spec["subject"], spec["palette"], spec["highlight"])
    neg = NEG_BASE + ", " + spec.get("extra_neg", "")

    handle = queue_submit(prompt, label=name)
    print(f"  [{name}] submitted req={handle['request_id'][:8]}...")
    url = queue_wait(handle)
    raw = out_path.with_name(f"_{name}-raw.jpg")
    download(url, raw)

    try:
        from PIL import Image
        img = Image.open(raw).convert("RGB")
        img = img.resize((512, 512), Image.LANCZOS)
        img.save(out_path, "PNG", optimize=True)
        raw.unlink()
    except ImportError:
        shutil.move(raw, out_path)

    sz = out_path.stat().st_size
    print(f"  [{name}] ok -> {out_path.name} ({sz//1024}KB)")
    return {
        "file": str(out_path.relative_to(PROJECT)),
        "prompt": prompt,
        "negative_prompt": neg,
        "url": url,
        "bytes": sz,
        "size": "512x512",
        "model": "fal-ai/flux/dev",
    }


def run_batch(names: list, parallel: int = 3) -> dict:
    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {"assets": {}}
    manifest["generated"] = time.strftime("%Y-%m-%d")
    manifest["style_anchor"] = [
        "public/assets/portraits/brabant-support.png",
        "public/assets/portraits/randstad-infantry.png",
    ]
    manifest["model"] = "fal-ai/flux/dev"
    manifest["pipeline"] = (
        "Flux Dev square_hd 1024x1024 -> PIL LANCZOS 512x512 -> PNG "
        "(NO BiRefNet, vignette+frame is design)"
    )

    errors = {}
    with ThreadPoolExecutor(max_workers=parallel) as ex:
        futures = {ex.submit(gen_one, n, PORTRAITS[n]): n for n in names}
        for fut in as_completed(futures):
            n = futures[fut]
            try:
                manifest["assets"][n] = fut.result()
            except Exception as e:
                errors[n] = repr(e)
                print(f"  [{n}] ERROR: {e}")

    MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"\nManifest -> {MANIFEST.relative_to(PROJECT)}")
    if errors:
        print(f"\nErrors: {len(errors)}")
        for n, err in errors.items():
            print(f"  {n}: {err}")
    return manifest


# =============================================================================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(0)
    cmd = sys.argv[1]
    if cmd == "test":
        run_batch(["randstad-support"], parallel=1)
    elif cmd == "all":
        run_batch(list(PORTRAITS.keys()), parallel=3)
    elif cmd == "one" and len(sys.argv) >= 3:
        n = sys.argv[2]
        if n not in PORTRAITS:
            raise SystemExit(f"unknown portrait '{n}'. Available: {', '.join(PORTRAITS)}")
        run_batch([n], parallel=1)
    else:
        print(__doc__); sys.exit(2)
