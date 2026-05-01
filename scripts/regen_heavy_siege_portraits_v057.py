#!/usr/bin/env python3
"""
Reign of Brabant -- 8 heavy/siege unit-portrait generation in painted-vignette stijl.

Style anchors:
  - public/assets/portraits/brabant-infantry.png  (carnaval-fighter, 350KB)
  - public/assets/portraits/brabant-support.png   (Boerinne)
  - public/assets/portraits/randstad-infantry.png (Manager v0.52.0)

All anchors are 512x512 RGB PNG with vignette + ornate gold filigree frame
PAINTED INTO the image (not transparent). NO BiRefNet -- frame and moody
background ARE the design (memory rule, asset-generator.md line ~193).

Pipeline per portrait (identical to v053 batch):
  1. Flux Dev queue submit (square_hd 1024x1024, 28 steps, guidance 3.5).
  2. Poll until COMPLETED.
  3. Download JPG, PIL LANCZOS resize -> 512x512, save as PNG with optimize=True.
  4. Backup original to <name>.bak.png if not already backed up.
  5. Overwrite final PNG.

Parallel: ThreadPoolExecutor(max_workers=8) for queue submit + poll loop.

Scope: 8 NEW portraits -- Heavy + Siege per faction:
  - brabant-heavy   (Tractorrijder)        - boer met tractor-helm
  - brabant-siege   (Frituurmeester)       - friet-kanon meester
  - randstad-heavy  (Corporate Advocaat)   - business-warrior
  - randstad-siege  (Vastgoedmakelaar)     - makelaar-as-siege
  - limburg-heavy   (Mergelridder)         - mergelsteen ridder
  - limburg-siege   (Kolenbrander)         - kolen-kanon mijnwerker
  - belgen-heavy    (Frituurridder)        - friet-ridder
  - belgen-siege    (Manneken Pis-kanon)   - manneken-pis bronze cannon

Usage:
  python3 scripts/regen_heavy_siege_portraits_v057.py test           # only brabant-heavy (validation)
  python3 scripts/regen_heavy_siege_portraits_v057.py all            # all 8
  python3 scripts/regen_heavy_siege_portraits_v057.py one <name>     # single portrait by file stem
"""
import os, sys, json, time, shutil, urllib.request, urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT = Path("/Users/richardtheuws/Documents/games/reign-of-brabant")
ENV_FILE = Path("/Users/richardtheuws/Documents/games/.env")
PORTRAIT_DIR = PROJECT / "public/assets/portraits"
MANIFEST = PROJECT / "scripts/heavy_siege_portraits_v057.json"


def load_key():
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("FAL_AI_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("FAL_AI_KEY missing from .env")

KEY = load_key()
HEADERS_JSON = {"Authorization": f"Key {KEY}", "Content-Type": "application/json"}


# =============================================================================
# UNIVERSAL STYLE SUFFIX -- copied verbatim from v053 batch (anchor pattern).
# =============================================================================

PALETTE = {
    "brabant": (
        "centered on dark moody vignette background with deep green-black "
        "gradient and warm orange-red carnival accent lighting (Brabant palette)"
    ),
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
# 8 PORTRAITS -- Heavy + Siege per faction.
# Triple anti-pattern guard in subject + extra_neg per memory protocol.
# =============================================================================
PORTRAITS = {
    # ============== BRABANT ==============
    "brabant-heavy": dict(
        palette="brabant",
        highlight="the heavy tractor-helm rim and weathered farmer hands",
        subject=(
            "a Brabantian Tractorrijder tractor-knight, late-30s broad-"
            "shouldered weather-beaten farmer with sun-tanned face and "
            "stubbled jaw, wearing a heavy bolted dark-steel tractor-helm "
            "modeled after a modern tractor-cab roof with a small orange "
            "carnival pennant tied to one rivet, riveted iron pauldrons "
            "over a rugged faded orange-and-white check work-shirt with "
            "rolled sleeves and leather suspenders, calloused hands "
            "gripping the worn wooden steering-handle of an iron-rimmed "
            "tractor-wheel slung across his chest as a shield-prop, "
            "stoic determined countryside expression with a knowing "
            "half-smile, distinctly rural Dutch Brabantian heavy-cavalry "
            "(NOT a medieval knight, NOT a carnival prince, NOT modern "
            "military)"
        ),
        extra_reference=(
            "rugged tractor-themed armor improvised from farm equipment, "
            "small Brabant orange ribbon accents"
        ),
        extra_neg=(
            "polished plate armor, medieval shining knight, sci-fi mecha, "
            "modern military tank uniform, carnival prince robes, jester hat, "
            "ornate noble crown, smooth young face, beardless youth"
        ),
    ),
    "brabant-siege": dict(
        palette="brabant",
        highlight="the open frituur-cannon barrel with golden frites flame and the greasy apron",
        subject=(
            "a Brabantian Frituurmeester frituur-master siege-engineer, "
            "stocky mid-40s mustachioed frituur-cook with ruddy red "
            "cheeks and a sweat-streaked brow, wearing a tall scorched "
            "white cook's hat with a small steel visor pulled down over "
            "the eyes like a chef's combat-helmet, a heavy greasy "
            "leather apron over a rolled-sleeve cream linen shirt with "
            "deep oil-stains, gripping a polished hand-cannon-shaped "
            "frituur-spout barrel by his side with golden flames and "
            "cascading golden frites bursting forward from the muzzle, "
            "small wisps of warm orange flame and oil-smoke curling "
            "around the barrel, fierce determined cook expression with "
            "a wide grin baring teeth, distinctly carnaval-folkloric "
            "Brabantian (NOT a medieval cannoneer, NOT modern fast-food "
            "worker, NOT McDonald's, NOT a wizard)"
        ),
        extra_neg=(
            "wizard hat, magic spell, pixie dust, fantasy mage, modern "
            "fast-food uniform, McDonald's logo, plastic apron, smooth "
            "young face, beardless youth, polished knight"
        ),
    ),

    # ============== RANDSTAD ==============
    "randstad-heavy": dict(
        palette="randstad",
        highlight="the polished steel briefcase corner and silk tie clip",
        subject=(
            "a Randstad Corporate Advocaat corporate-litigator heavy-"
            "warrior, imposing late-30s sharp-jawed power-attorney with "
            "slicked-back dark hair and piercing pale-blue eyes, wearing "
            "a flawlessly tailored black charcoal pinstripe three-piece "
            "suit with a deep-navy silk tie clipped with a polished "
            "silver tie-clip, narrow gold lapel pin, gripping a heavy "
            "polished steel-edged black leather briefcase by the handle "
            "as a war-shield with one hand and a thick rolled legal "
            "scroll-document tucked under the other arm like a baton, "
            "stark glass-and-steel skyscraper silhouettes barely visible "
            "in the deep blue-black background haze, grim contemptuous "
            "courtroom expression with a thin merciless half-smirk, "
            "distinctly corporate-anti-folkloric (NOT a barista, NOT a "
            "rural farmer, NOT carnival, NOT casual)"
        ),
        extra_neg=(
            "casual clothes, t-shirt, beard, smiling broadly, friendly "
            "expression, rural clothing, farmer overalls, carnival hat, "
            "barista apron, espresso machine, jester elements"
        ),
    ),
    "randstad-siege": dict(
        palette="randstad",
        highlight="the held metallic To-Let signage and silver wire-rim glasses",
        subject=(
            "a Randstad Vastgoedmakelaar real-estate-agent siege-engineer, "
            "smug late-30s slick property-broker with neatly slicked-back "
            "dark hair, thin silver wire-rim glasses, and a narrow "
            "calculating smile, wearing an immaculately tailored slim-cut "
            "slate-blue designer two-piece suit with a crisp white shirt "
            "and a thin yellow silk pocket-square, gripping a tall "
            "polished metallic 'TE HUUR' rental-sign post mounted on a "
            "spiked wooden stake by his side like a war-banner held "
            "vertically (sign blank, no readable lettering), a small "
            "ring of brass keys clipped to the belt, sleek glass "
            "skyscraper outlines barely visible in deep blue-black "
            "background haze, condescending arrogant urban-realtor "
            "expression, distinctly corporate-anti-folkloric (NOT a "
            "rural builder, NOT a medieval engineer, NOT a barista, "
            "NOT carnival)"
        ),
        extra_neg=(
            "rural construction worker, hard hat, medieval catapult, "
            "trebuchet wood, tank turret, barista apron, espresso "
            "machine, friendly warm smile, casual t-shirt, jester hat, "
            "any readable text on the sign"
        ),
    ),

    # ============== LIMBURG ==============
    "limburg-heavy": dict(
        palette="limburg",
        highlight="the pale mergel-stone breastplate and chalk-helmet rim",
        subject=(
            "a Limburg Mergelridder mergel-stone heavy-knight, imposing "
            "late-30s broad-shouldered armored knight with a coal-streaked "
            "stoic face and a closely trimmed dark beard, wearing a heavy "
            "carved pale mergel-limestone breastplate over a dark studded-"
            "leather gambeson, a banded mergel-stone helmet with a "
            "chalky pale-yellow patina and a thin slit visor pushed up "
            "to reveal his face, an iron-strapped large mergel-stone "
            "shield resting against his shoulder, a rough hewn iron-tipped "
            "spear shaft visible behind, soft hint of dark Maas-river "
            "water and rocky bluff barely visible in deep brown-black "
            "background haze, grim weathered coal-grimmed expression, "
            "distinctly earthen-Limburg mining-folkloric (NOT a Spanish "
            "conquistador, NOT a polished plate-armor European knight, "
            "NOT a fantasy paladin)"
        ),
        extra_neg=(
            "polished shining plate armor, golden trim everywhere, "
            "Spanish conquistador morion helmet, fantasy paladin halo, "
            "smooth young face, beardless, modern tactical gear, "
            "carnival pennants, Brabant orange beanie"
        ),
    ),
    "limburg-siege": dict(
        palette="limburg",
        highlight="the glowing red-orange coal-cannon mouth and soot-blackened face",
        subject=(
            "a Limburg Kolenbrander coal-burner siege-engineer, weathered "
            "mid-40s veteran miner with a thoroughly soot-blackened face "
            "and silver-streaked unkempt beard caked with coal-dust, "
            "wearing a battered ochre canvas mining jacket dusted with "
            "coal-black streaks across the shoulders and a heavy "
            "leather chest-strap, a brass-rimmed mining helmet with a "
            "small lit oil-lamp glowing warm copper-amber on the front, "
            "gripping a stout cast-iron coal-cannon barrel by his side "
            "with a glowing red-orange ember-mouth and bright cascading "
            "sparks and glowing-orange embers tumbling forward from the "
            "muzzle, swirling thin grey smoke around his shoulders, "
            "fierce intense determined expression with bright bloodshot "
            "eyes contrasting the soot, distinctly earthen-Limburg "
            "mining-folkloric (NOT a fantasy fire-mage, NOT a wizard, "
            "NOT modern industrial worker, NOT cheerful)"
        ),
        extra_neg=(
            "fantasy fire mage, wizard staff, magic spell, modern "
            "hardhat, fluorescent vest, headphones, cheerful smile, "
            "clean face, smooth young face, beardless, carnival "
            "pennants, Belgian frituur"
        ),
    ),

    # ============== BELGEN ==============
    "belgen-heavy": dict(
        palette="belgen",
        highlight="the mayonnaise-glazed steel breastplate and golden frites-banner",
        subject=(
            "a Belgian Frituurridder frituur-knight heavy-cavalryman, "
            "stocky mid-30s blond-bearded knight with a confident "
            "broad grin and a fine waxed pale-blond moustache, wearing "
            "a glossy creamy-white mayonnaise-glazed steel breastplate "
            "with a small embossed golden lion crest at the chest, "
            "deep-black pauldrons trimmed with golden-yellow filigree, "
            "a tall slim banner-pole rising behind one shoulder topped "
            "with a small Belgian frites-cone banner-flag in golden-"
            "yellow and chocolate-brown (no readable text), gripping a "
            "broad heavy steel kitchen-spatula re-forged into a "
            "two-handed long-sword with the blade upright at his side, "
            "a small Trappist-green tabard sash diagonally across the "
            "chest, jovial confident chivalrous expression, distinctly "
            "Belgian frituur-folkloric (NOT a Brabant carnival fighter, "
            "NOT a medieval European paladin, NOT a fantasy hero with "
            "magical weapon)"
        ),
        extra_neg=(
            "real Belgian royal family, glowing magical sword, fantasy "
            "paladin halo, Brabant carnival pennants, orange beanie, "
            "carnival jester elements, smooth beardless youth, plate "
            "armor without any food motif, viking horns"
        ),
    ),
    "belgen-siege": dict(
        palette="belgen",
        highlight="the polished bronze Manneken-Pis statue-cannon and brass wheel-rim",
        subject=(
            "a Belgian Manneken-Pis-kanon bronze siege-cannon, the "
            "absurd centerpiece itself: a polished aged-bronze statue-"
            "cannon shaped EXACTLY like the iconic Brussels little-boy "
            "Manneken-Pis fountain figure standing on a small ornate "
            "stone-carved pedestal mounted on a heavy wooden carriage "
            "with two large iron-rimmed brass cart-wheels visible at "
            "the base, the bronze figure's mouth and outstretched "
            "stream-spout serving as the cannon-muzzle pointing slightly "
            "forward with a wisp of curling grey smoke and a single "
            "small bronze cannonball mid-launch, deep-green Trappist-"
            "patina age-spots and warm bronze highlights catching "
            "chocolate-brown rim-light, blurred Brusselian cobblestone "
            "Grand-Place plaza atmosphere with a hint of guildhall "
            "facade silhouettes barely visible in deep gold-black "
            "background haze, absurd-funny but reverent ceremonial mood, "
            "distinctly Belgian-Brusselian folkloric (NOT a real human "
            "boy, NOT a child portrait, NOT crude or pornographic, NOT "
            "a fantasy golem)"
        ),
        extra_reference=(
            "the centered subject is the bronze STATUE-CANNON itself, "
            "no human soldier in foreground"
        ),
        extra_neg=(
            "real human child, real photograph of a boy, nudity in any "
            "human-skin-rendering, photorealistic skin tones on the "
            "figure, fantasy stone golem, glowing magical aura, modern "
            "tank turret, military camouflage, carnival jester hat, "
            "Brabant orange beanie"
        ),
    ),
}


# =============================================================================
# fal.ai pipeline helpers (identical to v053).
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


def backup(path: Path):
    if path.exists():
        bak = path.with_name(path.stem + ".bak" + path.suffix)
        if not bak.exists():
            shutil.copy2(path, bak)
            return bak.name
    return None


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

    bak_made = backup(out_path)

    try:
        from PIL import Image
        img = Image.open(raw).convert("RGB")
        img = img.resize((512, 512), Image.LANCZOS)
        img.save(out_path, "PNG", optimize=True)
        raw.unlink()
    except ImportError:
        shutil.move(raw, out_path)

    sz = out_path.stat().st_size
    print(f"  [{name}] ok -> {out_path.name} ({sz//1024}KB)" + (f" (backup: {bak_made})" if bak_made else ""))
    return {
        "file": str(out_path.relative_to(PROJECT)),
        "prompt": prompt,
        "negative_prompt": neg,
        "url": url,
        "bytes": sz,
        "size": "512x512",
        "model": "fal-ai/flux/dev",
        "backup": bak_made,
    }


def run_batch(names: list[str], parallel: int = 8) -> dict:
    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    if "assets" not in manifest:
        manifest["assets"] = {}
    manifest["generated"] = time.strftime("%Y-%m-%d")
    manifest["style_anchor"] = [
        "public/assets/portraits/brabant-infantry.png",
        "public/assets/portraits/brabant-support.png",
        "public/assets/portraits/randstad-infantry.png",
    ]
    manifest["model"] = "fal-ai/flux/dev"
    manifest["pipeline"] = "Flux Dev square_hd 1024x1024 -> PIL LANCZOS 512x512 -> PNG (NO BiRefNet, vignette+frame is design)"
    manifest["scope"] = "Heavy + Siege per faction (8 NEW portraits, v0.57)"

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
        run_batch(["brabant-heavy"], parallel=1)
    elif cmd == "all":
        run_batch(list(PORTRAITS.keys()), parallel=8)
    elif cmd == "one" and len(sys.argv) >= 3:
        n = sys.argv[2]
        if n not in PORTRAITS:
            raise SystemExit(f"unknown portrait '{n}'. Available: {', '.join(PORTRAITS)}")
        run_batch([n], parallel=1)
    else:
        print(__doc__); sys.exit(2)
