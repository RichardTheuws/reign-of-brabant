#!/usr/bin/env python3
"""
Reign of Brabant -- Manager mesh + portrait regen (v0.52.0).

Pipeline:
  1. Generate Flux Dev concept reference (1024x1024) of a Randstad Manager
     in PAINTED-REALISTIC style matching Stagiair / Consultant — explicit
     "match style" anchors so the new mesh isn't grover/cartoony anymore.
  2. Submit reference to Meshy v6 image-to-3d (fal.run sync) for the GLB.
  3. Generate painted-vignette portrait (Flux Dev `square_hd` -> 512x512 PNG)
     using the same painted-RPG-card-art template as the other Randstad
     unit portraits (`randstad-worker.png`, `randstad-ranged.png`).

Output:
  - public/assets/models/v02/randstad/manager.glb        (new GLB)
  - public/assets/models/v02/randstad/infantry-v2.glb    (overwrite — this
    is the path UnitRenderer.ts loads for Randstad Infantry)
  - public/assets/portraits/randstad-infantry.png        (overwrite, this is
    the path portraitMap.ts resolves for Randstad Manager)

Backups: existing files are copied to `<name>.bak.<ext>` before overwrite.

Usage:
  python3 scripts/regen_manager_mesh_portrait.py concept   # Flux Dev concept
  python3 scripts/regen_manager_mesh_portrait.py mesh      # Meshy v6
  python3 scripts/regen_manager_mesh_portrait.py portrait  # Flux Dev portrait
  python3 scripts/regen_manager_mesh_portrait.py all       # all three in sequence
"""
import os, sys, json, time, base64, shutil, urllib.request, urllib.error
from pathlib import Path

PROJECT = Path("/Users/richardtheuws/Documents/games/reign-of-brabant")
ENV_FILE = Path("/Users/richardtheuws/Documents/games/.env")
CONCEPT_DIR = PROJECT / "public/assets/concepts/units"
MODELS_DIR = PROJECT / "public/assets/models/v02/randstad"
PORTRAIT_PATH = PROJECT / "public/assets/portraits/randstad-infantry.png"
MANIFEST = PROJECT / "scripts/manager_revamp.json"

CONCEPT_FILE = CONCEPT_DIR / "randstad-manager-v2.png"
MESH_PRIMARY = MODELS_DIR / "manager.glb"
MESH_RENDERED = MODELS_DIR / "infantry-v2.glb"


def load_key():
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("FAL_AI_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("FAL_AI_KEY missing from .env")

KEY = load_key()
HEADERS_JSON = {"Authorization": f"Key {KEY}", "Content-Type": "application/json"}


def http_post(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=HEADERS_JSON, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def http_get(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Key {KEY}"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def queue_submit_and_wait(endpoint, payload, label, max_wait_s=180):
    submit = http_post(f"https://queue.fal.run/{endpoint}", payload)
    status_url = submit["status_url"]
    response_url = submit["response_url"]
    print(f"  [{label}] submitted req={submit['request_id']}")
    deadline = time.time() + max_wait_s
    while time.time() < deadline:
        st = http_get(status_url)
        s = st.get("status")
        if s == "COMPLETED":
            return http_get(response_url)
        if s in ("FAILED", "ERROR"):
            raise RuntimeError(f"  [{label}] FAILED: {st}")
        time.sleep(3)
    raise TimeoutError(f"  [{label}] TIMEOUT after {max_wait_s}s")


def download(url, path):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=240) as r:
        path.write_bytes(r.read())
    return path.stat().st_size


def backup(path: Path, suffix=".bak"):
    if path.exists():
        bak = path.with_name(path.stem + suffix + path.suffix)
        if not bak.exists():
            shutil.copy2(path, bak)
            print(f"  backup: {bak.name}")


# ============================================================
# CONCEPT (Flux Dev painted-realistic, matches stagiair / consultant)
# ============================================================
CONCEPT_PROMPT = (
    "single full-body T-pose character concept art, modern Dutch corporate "
    "Randstad Manager, mid-30s authoritative man in a tailored slate-blue "
    "suit jacket with crisp white shirt and slim navy tie, polished black "
    "Oxford shoes, holding a thin leather-bound presentation folder under "
    "one arm and pointing assertively with the other hand, confident "
    "boardroom posture, painted-realistic concept-art style with clean "
    "cinematic lighting, soft directional desk-lamp warm-yellow rim light, "
    "centered on plain neutral grey background, low-poly stylized fantasy "
    "RTS art style, painted clean linework, shoulders squared, "
    "matching style of Randstad Stagiair and Consultant unit references, "
    "no text, no logo, no carnival costume, no cartoon proportions, "
    "Randstad palette (slate-blue suit, white shirt, warm yellow accents), "
    "single character only, no extra figures"
)
CONCEPT_NEG = (
    "cartoon, exaggerated proportions, big head, chibi, low-quality, "
    "blurry, photorealistic photograph, multiple characters, text, "
    "watermark, brand logos, ugly, cluttered background"
)


def gen_concept():
    CONCEPT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "prompt": CONCEPT_PROMPT,
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
        "output_format": "jpeg",
    }
    res = queue_submit_and_wait("fal-ai/flux/dev", payload, label="manager-concept")
    url = res["images"][0]["url"]
    raw = CONCEPT_DIR / "_manager-concept-raw.jpg"
    download(url, raw)
    # Re-encode to PNG so Meshy and downstream tools accept it cleanly.
    try:
        from PIL import Image
        img = Image.open(raw).convert("RGB")
        img.save(CONCEPT_FILE, "PNG", optimize=True)
        raw.unlink()
    except ImportError:
        shutil.move(raw, CONCEPT_FILE)
    sz = CONCEPT_FILE.stat().st_size
    print(f"  ok concept -> {CONCEPT_FILE} ({sz//1024}KB)")
    _update_manifest({"concept": {
        "prompt": CONCEPT_PROMPT,
        "neg": CONCEPT_NEG,
        "url": url,
        "file": str(CONCEPT_FILE.relative_to(PROJECT)),
        "bytes": sz,
    }})


# ============================================================
# MESHY v6 IMAGE-TO-3D
# ============================================================
MESH_PROMPT = (
    "Modern Dutch corporate Randstad Manager character, mid-30s authoritative "
    "man in tailored slate-blue suit, white shirt, slim navy tie, polished "
    "black Oxford shoes, presentation folder, clean PBR materials, "
    "painted-realistic style matching other Randstad units (Stagiair, "
    "Consultant), full body T-pose, RTS unit scale, NOT cartoon, NOT chibi"
)


def gen_mesh():
    if not CONCEPT_FILE.exists():
        raise SystemExit(f"Concept not found at {CONCEPT_FILE}; run `concept` first")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    backup(MESH_PRIMARY)
    backup(MESH_RENDERED)
    b64 = base64.b64encode(CONCEPT_FILE.read_bytes()).decode()
    data_uri = f"data:image/png;base64,{b64}"
    payload = {
        "image_url": data_uri,
        "prompt": MESH_PROMPT,
        "art_style": "realistic",
        "target_polycount": 14000,  # < 15000 budget
        "should_remesh": True,
        "should_texture": True,
    }
    print("Submitting to Meshy v6 (fal.run sync, 2-7 min)...")
    t0 = time.time()
    req = urllib.request.Request(
        "https://fal.run/fal-ai/meshy/v6/image-to-3d",
        data=json.dumps(payload).encode(),
        headers=HEADERS_JSON,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=900) as r:
        res = json.loads(r.read())
    elapsed = int(time.time() - t0)

    glb_url = None
    mu = res.get("model_urls")
    if isinstance(mu, dict):
        g = mu.get("glb")
        if isinstance(g, dict):
            glb_url = g.get("url")
        elif isinstance(g, str):
            glb_url = g
    if not glb_url:
        m = res.get("model_glb")
        if isinstance(m, dict):
            glb_url = m.get("url")
        elif isinstance(m, str):
            glb_url = m
    if not glb_url:
        print(json.dumps(res, indent=2)[:1500])
        raise SystemExit("No GLB url in response")
    print(f"Meshy completed in {elapsed}s, downloading {glb_url}")

    sz = download(glb_url, MESH_PRIMARY)
    if sz < 100_000:
        raise SystemExit(f"GLB too small ({sz}B) — likely broken")
    # Mirror to the path UnitRenderer actually loads for Randstad Infantry.
    shutil.copy2(MESH_PRIMARY, MESH_RENDERED)
    print(f"  ok mesh -> {MESH_PRIMARY.name} ({sz//1024}KB), mirrored to {MESH_RENDERED.name}")

    _update_manifest({"mesh": {
        "prompt": MESH_PROMPT,
        "from_concept": str(CONCEPT_FILE.relative_to(PROJECT)),
        "glb_url": glb_url,
        "primary_file": str(MESH_PRIMARY.relative_to(PROJECT)),
        "rendered_file": str(MESH_RENDERED.relative_to(PROJECT)),
        "bytes": sz,
        "elapsed_s": elapsed,
        "polycount_target": 14000,
    }})


# ============================================================
# PORTRAIT (Flux Dev painted-vignette, 1024x1024 -> 512x512)
# ============================================================
PORTRAIT_PROMPT = (
    "painted RPG card art portrait of a Randstad Manager, "
    "mid-30s authoritative corporate man in a tailored slate-blue suit "
    "and crisp white shirt with slim navy tie, holding a leather-bound "
    "presentation folder, confident boardroom expression with a slight "
    "knowing smirk, oil painting texture, shoulder-up framing centered "
    "in composition, centered on dark moody vignette background with "
    "deep blue-black gradient and warm yellow desk-lamp accent lighting "
    "(Randstad palette), ornate gold curved filigree frame border at "
    "top edge and corners matching painted RPG card style, "
    "dramatic chiaroscuro lighting catching the lapels and tie pin, "
    "museum quality oil painting meets corporate concept art, "
    "no readable text, no real-world brand logos, no carnival, "
    "no cartoon proportions"
)
PORTRAIT_NEG = (
    "cartoon, chibi, exaggerated proportions, blurry, multiple figures, "
    "text, watermark, brand logos, real corporate logo, carnival costume"
)


def gen_portrait():
    PORTRAIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    backup(PORTRAIT_PATH)
    payload = {
        "prompt": PORTRAIT_PROMPT,
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
    }
    res = queue_submit_and_wait("fal-ai/flux/dev", payload, label="manager-portrait")
    url = res["images"][0]["url"]
    raw = PORTRAIT_PATH.with_name("_manager-portrait-raw.jpg")
    download(url, raw)
    try:
        from PIL import Image
        img = Image.open(raw).convert("RGB")
        img = img.resize((512, 512), Image.LANCZOS)
        img.save(PORTRAIT_PATH, "PNG", optimize=True)
        raw.unlink()
    except ImportError:
        shutil.move(raw, PORTRAIT_PATH)
    sz = PORTRAIT_PATH.stat().st_size
    print(f"  ok portrait -> {PORTRAIT_PATH.name} ({sz//1024}KB)")
    _update_manifest({"portrait": {
        "prompt": PORTRAIT_PROMPT,
        "neg": PORTRAIT_NEG,
        "url": url,
        "file": str(PORTRAIT_PATH.relative_to(PROJECT)),
        "bytes": sz,
    }})


def _update_manifest(entry):
    m = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    m.update(entry)
    MANIFEST.write_text(json.dumps(m, indent=2))


# ============================================================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(0)
    cmd = sys.argv[1]
    if cmd == "concept":
        gen_concept()
    elif cmd == "mesh":
        gen_mesh()
    elif cmd == "portrait":
        gen_portrait()
    elif cmd == "all":
        gen_concept(); gen_mesh(); gen_portrait()
    else:
        print(__doc__); sys.exit(2)
