#!/usr/bin/env python3
"""
Reign of Brabant -- Regenerate Randstad Barracks (auditorium variant).

Pipeline:
  1. Generate 3 isometric concept variants via Flux Pro v1.1 (queue endpoint).
  2. Save concepts side-by-side for review.
  3. Submit chosen concept to Meshy v6 image-to-3d (fal.run sync, 2-5 min).
  4. Generate painted-vignette portrait via Flux Dev (square_hd).
  5. Write manifest + log.

Usage:
  python3 scripts/regen_randstad_barracks.py concepts   # generate 3 concept variants
  python3 scripts/regen_randstad_barracks.py mesh <variant_idx>   # mesh chosen variant (0/1/2)
  python3 scripts/regen_randstad_barracks.py portrait   # generate portrait
"""
import os, sys, json, time, base64, urllib.request, urllib.error, threading
from pathlib import Path

PROJECT = Path("/Users/richardtheuws/Documents/games/reign-of-brabant")
ENV_FILE = Path("/Users/richardtheuws/Documents/games/.env")
CONCEPTS_DIR = PROJECT / "public/assets/concepts/buildings"
MODELS_DIR = PROJECT / "public/assets/models/v02/randstad"
PORTRAITS_DIR = PROJECT / "public/assets/portraits/buildings"
MANIFEST = PROJECT / "scripts/randstad_barracks_regen.json"

CONCEPT_KEY = "randstad-barracks-concept"
PORTRAIT_KEY = "randstad-barracks-portrait"

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

def queue_submit_and_wait(endpoint, payload, label, max_wait_s=120):
    """Submit to queue.fal.run, poll until COMPLETED."""
    submit = http_post(f"https://queue.fal.run/{endpoint}", payload)
    req_id = submit["request_id"]
    status_url = submit["status_url"]
    response_url = submit["response_url"]
    print(f"  [{label}] submitted req={req_id}")
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
    with urllib.request.urlopen(req, timeout=120) as r:
        path.write_bytes(r.read())
    return path.stat().st_size

# ============================================================
# CONCEPT GENERATION (3 variants)
# ============================================================
CONCEPT_BASE_NEG = "office tower, skyscraper, generic high-rise, blurry, photorealistic, text, watermark, multiple buildings, characters, people, ugly, cluttered"

CONCEPT_VARIANTS = [
    {
        "name": "auditorium-glass-amphitheater",
        "prompt": (
            "isometric 3/4 top-down view game asset, single modern Dutch corporate "
            "training auditorium building, low circular amphitheater shape with curved "
            "tiered glass-and-steel facade wrapping the perimeter, large skylight oculus "
            "in the centre of the flat-circular roof, low-rise (clearly NOT a tower, "
            "footprint wider than tall), entrance plaza with glass double-doors, slate "
            "grey concrete plinth, copper-blue tinted reflective glass panels, "
            "centered on transparent background, low-poly stylized fantasy RTS art, "
            "painted clean linework, soft directional lighting, no characters, no text, "
            "Randstad palette (slate-blue, white, warm yellow desk-lamp accents), "
            "distinct silhouette top-down (round disk shape, NOT a square block, NOT a tower)"
        ),
    },
    {
        "name": "presentation-hall-greenroof",
        "prompt": (
            "isometric 3/4 top-down view game asset, single modern Dutch corporate "
            "presentation hall building, long rectangular two-storey low-rise structure "
            "with a sloping greenery roof covered in grass and small trees (groendak), "
            "full-height glass curtain walls along the long side showing rows of theatre "
            "seating inside, raised stage visible through glass, slate-grey steel frame, "
            "wide entrance canopy, centered on transparent background, "
            "low-poly stylized fantasy RTS art, painted clean linework, soft directional "
            "lighting, no characters, no text, Randstad palette (slate-blue, white, "
            "warm yellow accents, lush green roof), distinct silhouette top-down "
            "(long horizontal slab with green roof, NOT a tower)"
        ),
    },
    {
        "name": "training-arena-dome",
        "prompt": (
            "isometric 3/4 top-down view game asset, single modern Dutch corporate "
            "training facility, low geodesic glass-dome structure surrounded by a wide "
            "ring of slate-grey concrete plinth, glass panels segmented in hexagonal "
            "pattern on the dome, small atrium courtyard with a single tree visible "
            "through the glass, clean steel structural ribs, centered on transparent "
            "background, low-poly stylized fantasy RTS art, painted clean linework, "
            "soft directional lighting, no characters, no text, Randstad palette "
            "(slate-blue, white, warm yellow accents), distinct silhouette top-down "
            "(round dome, NOT a tower, NOT a square block)"
        ),
    },
]

def gen_concepts():
    CONCEPTS_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    def worker(idx, variant):
        try:
            payload = {
                "prompt": variant["prompt"],
                "image_size": "square_hd",
                "num_inference_steps": 28,
                "guidance_scale": 3.5,
                "num_images": 1,
                "enable_safety_checker": False,
                "output_format": "jpeg",
            }
            res = queue_submit_and_wait("fal-ai/flux-pro/v1.1", payload,
                                         label=f"concept-{idx}-{variant['name']}",
                                         max_wait_s=120)
            url = res["images"][0]["url"]
            out = CONCEPTS_DIR / f"randstad-barracks-v2-{idx}-{variant['name']}.png"
            sz = download(url, out)
            results.append({
                "idx": idx, "name": variant["name"], "prompt": variant["prompt"],
                "url": url, "file": str(out.relative_to(PROJECT)), "bytes": sz,
            })
            print(f"  [concept-{idx}] OK {sz//1024}KB -> {out.name}")
        except Exception as e:
            print(f"  [concept-{idx}] FAIL: {e}")
            results.append({"idx": idx, "name": variant["name"], "error": str(e)})
    threads = [threading.Thread(target=worker, args=(i, v)) for i, v in enumerate(CONCEPT_VARIANTS)]
    for t in threads: t.start()
    for t in threads: t.join()
    results.sort(key=lambda r: r["idx"])
    MANIFEST.write_text(json.dumps({"concepts": results}, indent=2))
    print(f"\nManifest: {MANIFEST}")
    print("Inspect concepts and pick best variant idx (0/1/2), then run:")
    print(f"  python3 {sys.argv[0]} mesh <idx>")

# ============================================================
# MESHY v6 IMAGE-TO-3D
# ============================================================
def gen_mesh(variant_idx):
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {"concepts": []}
    chosen = next((c for c in manifest.get("concepts", []) if c["idx"] == variant_idx), None)
    if not chosen or "file" not in chosen:
        raise SystemExit(f"No valid concept idx={variant_idx} in manifest")
    img_path = PROJECT / chosen["file"]
    print(f"Mesh from concept: {img_path}")
    b64 = base64.b64encode(img_path.read_bytes()).decode()
    data_uri = f"data:image/png;base64,{b64}"
    mesh_prompt = (
        "Modern Dutch corporate training auditorium / presentation hall, "
        "low-rise glass-and-steel architecture with distinctive non-tower silhouette, "
        "Randstad slate-blue and warm yellow accents, clean PBR materials, "
        "RTS game building scale"
    )
    payload = {
        "image_url": data_uri,
        "prompt": mesh_prompt,
        "art_style": "realistic",
        "target_polycount": 18000,
        "should_remesh": True,
        "should_texture": True,
    }
    print("Submitting to Meshy v6 (fal.run sync, 2-5 min)...")
    t0 = time.time()
    req = urllib.request.Request(
        "https://fal.run/fal-ai/meshy/v6/image-to-3d",
        data=json.dumps(payload).encode(),
        headers=HEADERS_JSON,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=600) as r:
        res = json.loads(r.read())
    elapsed = int(time.time() - t0)
    # Parse GLB URL: response shape varies
    glb_url = None
    if isinstance(res.get("model_urls"), dict):
        g = res["model_urls"].get("glb")
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
    out_glb = MODELS_DIR / "barracks.glb"
    sz = download(glb_url, out_glb)
    print(f"Wrote {out_glb} ({sz//1024}KB) in {elapsed}s")
    if sz < 200_000:
        raise SystemExit(f"GLB too small ({sz}B) -- likely broken")
    manifest["mesh"] = {
        "from_concept_idx": variant_idx,
        "concept_file": str(img_path.relative_to(PROJECT)),
        "prompt": mesh_prompt,
        "glb_url": glb_url,
        "out_file": str(out_glb.relative_to(PROJECT)),
        "bytes": sz,
        "elapsed_s": elapsed,
        "polycount_target": 18000,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"Manifest updated: {MANIFEST}")

# ============================================================
# PORTRAIT (painted-vignette, 1024x1024 -> 512x512)
# ============================================================
PORTRAIT_PROMPT = (
    "painted RPG card art, modern Dutch corporate training auditorium / presentation hall "
    "(Randstad faction), low-rise glass-and-steel amphitheater with curved tiered glass facade "
    "and a green-roof oculus skylight at the top, slate-blue and white panels with warm "
    "yellow desk-lamp window-glow accents, low circular silhouette clearly NOT a high-rise "
    "tower, evening blue-hour atmosphere, "
    "centered on dark moody vignette background with deep blue-black gradient, "
    "ornate gold curved frame border at top edge, dramatic chiaroscuro lighting, "
    "warm yellow desk-lamp accents and neon sticky-note color highlights, "
    "oil painting texture meets corporate concept art, fantasy game card icon, "
    "no readable text, no real-world brand logos, museum quality"
)
PORTRAIT_NEG = "skyscraper, office tower, high-rise tower, generic glass tower, identical to townhall, blurry, multiple buildings, text, brand logos, real corporate logo"

def gen_portrait():
    PORTRAITS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "prompt": PORTRAIT_PROMPT,
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
    }
    res = queue_submit_and_wait("fal-ai/flux/dev", payload, label="portrait", max_wait_s=120)
    url = res["images"][0]["url"]
    raw = PORTRAITS_DIR / "_randstad-barracks-raw.jpg"
    download(url, raw)
    # Resize to 512x512 PNG via PIL
    try:
        from PIL import Image
        img = Image.open(raw).convert("RGB")
        img = img.resize((512, 512), Image.LANCZOS)
        out = PORTRAITS_DIR / "randstad-barracks.png"
        img.save(out, "PNG", optimize=True)
        sz = out.stat().st_size
        print(f"Portrait: {out} ({sz//1024}KB)")
        raw.unlink()
    except ImportError:
        print("PIL missing, saved raw JPG only")
        sz = raw.stat().st_size
        out = raw
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    manifest["portrait"] = {
        "prompt": PORTRAIT_PROMPT, "url": url,
        "out_file": str(out.relative_to(PROJECT)), "bytes": sz,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2))

# ============================================================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(0)
    cmd = sys.argv[1]
    if cmd == "concepts":
        gen_concepts()
    elif cmd == "mesh":
        gen_mesh(int(sys.argv[2]))
    elif cmd == "portrait":
        gen_portrait()
    else:
        print(f"Unknown cmd: {cmd}"); sys.exit(1)
