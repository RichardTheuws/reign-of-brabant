#!/usr/bin/env python3
"""
Reign of Brabant -- 19 unit-portrait regen in painted-vignette stijl.

Style anchors:
  - public/assets/portraits/randstad-infantry.png (Manager v0.52.0)
  - public/assets/portraits/brabant-support.png   (Boerinne)

Both anchors are 512x512 RGB PNG with vignette + ornate gold filigree frame
PAINTED INTO the image (not transparent). We follow that pattern: NO BiRefNet.
Frame and moody background ARE the design.

Pipeline per portrait:
  1. Flux Dev queue submit (square_hd 1024x1024, 28 steps, guidance 3.5).
  2. Poll until COMPLETED.
  3. Download JPG, PIL LANCZOS resize -> 512x512, save as PNG with optimize=True.
  4. Backup original to <name>.bak.png if not already backed up.
  5. Overwrite final PNG.

Parallel: ThreadPoolExecutor(max_workers=10) for queue submit + poll loop.

Scope: 19 portraits (10 generic units + 8 heroes + 1 randstad-worker).
Excluded: randstad-infantry.png and brabant-support.png (already anchors).

Usage:
  python3 scripts/regen_unit_portraits_v053.py test           # only brabant-worker (validation)
  python3 scripts/regen_unit_portraits_v053.py all            # all 19
  python3 scripts/regen_unit_portraits_v053.py one <name>     # single portrait by file stem
"""
import os, sys, json, time, shutil, urllib.request, urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT = Path("/Users/richardtheuws/Documents/games/reign-of-brabant")
ENV_FILE = Path("/Users/richardtheuws/Documents/games/.env")
PORTRAIT_DIR = PROJECT / "public/assets/portraits"
MANIFEST = PROJECT / "scripts/unit_portraits_v053.json"


def load_key():
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("FAL_AI_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("FAL_AI_KEY missing from .env")

KEY = load_key()
HEADERS_JSON = {"Authorization": f"Key {KEY}", "Content-Type": "application/json"}


# =============================================================================
# UNIVERSAL STYLE SUFFIX -- copied near-verbatim from randstad-infantry (anchor).
# Faction palette is the only varying segment.
# =============================================================================

# Faction palette quotes (used in {palette} slot).
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

# Universal negative prompt baseline.
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
# 19 PORTRAITS -- subject + palette + highlight per file.
# Generics first, heroes second.
# =============================================================================
PORTRAITS = {
    # -------- BRABANT generics --------
    "brabant-worker": dict(
        palette="brabant",
        highlight="the wooden hay-fork shaft and weathered hands",
        subject=(
            "a Brabantian peasant farmer, mid-30s sturdy man in a faded "
            "orange-and-white check linen work-shirt with rolled sleeves, "
            "leather suspenders over a coarse cream apron, holding a "
            "well-worn wooden hay-fork over one shoulder with calloused "
            "hands, wind-tousled chestnut hair, weathered tan complexion "
            "with a few days of stubble, calm steady countryside expression "
            "with a hint of a knowing smile, distinctly rural Dutch farmer "
            "(no carnival costume, no jester elements)"
        ),
        extra_neg="carnival costume, jester hat, festival mask, modern clothing",
    ),
    "brabant-infantry": dict(
        palette="brabant",
        highlight="the worn leather jacket lapels and brass buttons",
        subject=(
            "a Brabantian carnaval-fighter village brawler, mid-20s wiry "
            "man in a battered dark-brown leather jacket with brass "
            "buttons over a faded orange undershirt, a short orange "
            "festival sash diagonally across his chest, knuckle-wrapped "
            "fists, tousled dark hair and a smirking jaw with a small "
            "scar through one eyebrow, defiant village-rebel expression, "
            "lit by warm orange torchlight from below"
        ),
        extra_neg="full carnival costume, jester crown, ornate prince robes",
    ),
    "brabant-ranged": dict(
        palette="brabant",
        highlight="the steel crossbow limbs and orange knit cap",
        subject=(
            "a Brabantian tractor-rider crossbowman, late-20s broad-"
            "shouldered man wearing a hand-knitted bright orange carnival "
            "beanie cap pulled low over weathered brow, sturdy brown "
            "canvas farmer-jacket with leather elbow patches, holding "
            "a heavy hand-cranked steel crossbow at the ready, freckled "
            "face with a determined squint, focused hunter expression"
        ),
        extra_neg="modern firearms, sniper rifle, motorcycle helmet",
    ),

    # -------- RANDSTAD generics --------
    "randstad-worker": dict(
        palette="randstad",
        highlight="the clipboard edges and slightly oversized suit shoulders",
        subject=(
            "a Randstad corporate intern (stagiair), early-20s nervous "
            "thin young man in a slightly oversized off-the-rack charcoal "
            "suit jacket that doesn't quite fit at the shoulders, white "
            "shirt buttoned to the top with a thin navy tie knotted a bit "
            "askew, clutching a brown clipboard with stacked papers tightly "
            "to his chest with both hands, anxious wide-eyed expression "
            "with raised eyebrows and a tense smile, neatly combed but "
            "boyish hair, slate-blue corporate ambience"
        ),
        extra_neg="barista, espresso machine, coffee shop, latte cup, confident posture",
    ),
    "randstad-ranged": dict(
        palette="randstad",
        highlight="the laptop bag strap and silver wire-rim glasses",
        subject=(
            "a Randstad strategy consultant, early-30s sharp-eyed man in "
            "a slim-cut slate-blue two-piece suit with a crisp white shirt "
            "and dark navy tie, thin silver wire-rim glasses, a sleek "
            "leather laptop satchel slung diagonally across his chest, "
            "holding a slim takeaway paper coffee cup in one hand as a "
            "minor character-detail (NOT a barista), neatly slicked-back "
            "dark hair, slightly sceptical half-smile, urban executive "
            "energy"
        ),
        extra_neg="full coffee shop scene, espresso machine, barista apron, rural clothing",
    ),

    # -------- LIMBURG generics --------
    "limburg-worker": dict(
        palette="limburg",
        highlight="the brass mining-helmet lamp glowing warm amber",
        subject=(
            "a Limburg coal miner, mid-30s rugged man in a battered "
            "ochre canvas mining jacket dusted with coal-black streaks "
            "across the shoulders, a brass-rimmed mining helmet with a "
            "small lit oil-lamp glowing warm amber on the front, dark "
            "leather chest-strap holding a pickaxe handle visible at the "
            "shoulder, soot-smudged stubbled face with bright determined "
            "eyes, weathered miner's hands"
        ),
        extra_neg="modern hardhat, fluorescent vest, headphones",
    ),
    "limburg-infantry": dict(
        palette="limburg",
        highlight="the polished mergel-stone shield and iron spear-tip",
        subject=(
            "a Limburg mergel-knight footsoldier, mid-30s broad-shouldered "
            "man in studded dark-leather mining-armour over a coarse cream "
            "tunic, a roughly-hewn pale mergel-limestone shield strapped "
            "to one forearm, gripping a sturdy iron-tipped spear shaft, "
            "a coal-dust streaked face with a stoic stern jaw, short dark "
            "hair under a banded leather cap"
        ),
        extra_neg="shining plate armor, polished knight, modern tactical gear",
    ),
    "limburg-ranged": dict(
        palette="limburg",
        highlight="the wooden baker's peel and flour-dusted apron",
        subject=(
            "a Limburg vlaai-thrower baker-soldier, late-20s burly man "
            "in a flour-dusted cream apron over a rolled-sleeve white "
            "linen shirt, gripping a long wooden baker's peel-paddle "
            "like a polearm in one hand and a small woven basket of "
            "round cherry-vlaai pastries hooked under the other arm, "
            "ruddy cheerful complexion with a determined grin, "
            "flour streaks on his forearms, cherry-red accents on the "
            "vlaai pastries"
        ),
        extra_neg="modern chef hat, kitchen scene, pizza, restaurant",
    ),

    # -------- BELGEN generics --------
    "belgen-worker": dict(
        palette="belgen",
        highlight="the golden frites in the paper cone and ladle",
        subject=(
            "a Belgian frituur-stall owner, late-30s portly jolly man in "
            "a navy-and-white striped apron over a rolled-sleeve white "
            "shirt, holding a paper cone overflowing with golden Belgian "
            "frites in one hand and a long-handled wire frying ladle in "
            "the other, round friendly red-cheeked face with a broad "
            "warm grin and bushy moustache, neatly slicked dark hair, "
            "warm chocolate-brown and golden-yellow tones"
        ),
        extra_neg="thin athletic build, modern fast-food uniform, McDonald's",
    ),
    "belgen-infantry": dict(
        palette="belgen",
        highlight="the steel spatula-sword and Trappist-green tabard accent",
        subject=(
            "a Belgian frituur-knight footsoldier, mid-30s blond stocky "
            "man in a dark-leather jerkin over a Trappist-green tabard "
            "with a small golden lion crest at the chest, gripping a "
            "broad heavy steel kitchen spatula re-forged into a "
            "short-sword in one hand, slightly frizzed blond hair "
            "framing a confident half-smirk, a fine pale-blond moustache, "
            "warm gold and chocolate-brown lighting"
        ),
        extra_neg="Viking horns, full helmet covering face, modern soldier",
    ),
    "belgen-ranged": dict(
        palette="belgen",
        highlight="the polished bronze hand-cannon barrel and red-green sash",
        subject=(
            "a Belgian Brusselian musketeer, late-20s lean man in a "
            "deep-black doublet with a slim red-and-green silk sash "
            "diagonally across the chest as a small national accent, "
            "holding a polished bronze hand-cannon at the ready with "
            "both hands, a wide-brimmed black hat with a small golden "
            "feather, mischievous half-grin, neatly trimmed dark "
            "moustache and goatee"
        ),
        extra_neg="modern rifle, military camouflage, full armor",
    ),

    # -------- BRABANT heroes --------
    "brabant-prins": dict(
        palette="brabant",
        highlight="the gold steek-hat plumes and ermine collar",
        subject=(
            "the Prins van Brabant carnival prince hero, regal mid-40s "
            "man in a deep-orange velvet cape lined with white ermine "
            "fur trim across the shoulders, wearing a tall ornate "
            "gold-embroidered carnival steek-hat (tricorn) crowned with "
            "lush white ostrich plumes, a polished gold sceptre with "
            "carnival ribbons gripped in one hand, regal trimmed dark "
            "beard, jovial confident benevolent expression, royal yet "
            "warm-folk presence"
        ),
        extra_neg="modern king costume, crown of gold gems, chess king",
    ),
    "brabant-boer": dict(
        palette="brabant",
        highlight="the worn pitchfork tines and orange neck-scarf",
        subject=(
            "De Boer hero, an authoritative late-50s old farmer with "
            "weathered tanned face and silver-streaked beard, wearing "
            "a brick-red work-shirt under a heavy dark-brown leather "
            "vest with brass buttons, a faded bright-orange neck-scarf "
            "knotted at the throat, gripping a long-handled iron "
            "pitchfork upright like a staff, deep-set knowing eyes "
            "with crow's feet, broad shoulders, calm patriarch energy "
            "of a village elder"
        ),
        extra_neg="young farmer, smooth face, beardless, modern overalls",
    ),

    # -------- RANDSTAD heroes --------
    "randstad-ceo": dict(
        palette="randstad",
        highlight="the lapel pin and the slim espresso cup edge",
        subject=(
            "De CEO hero, sharp commanding mid-40s man in a flawlessly "
            "tailored slate-blue three-piece pinstripe suit, crisp white "
            "shirt with a deep-navy silk tie and a small gold lapel pin, "
            "holding a slim porcelain espresso cup as a minor "
            "character-detail in one hand, slicked-back salt-and-pepper "
            "hair, piercing pale-blue eyes, slight knowing smirk, "
            "dominant urban executive presence"
        ),
        extra_neg="casual clothes, beard, smiling broadly, t-shirt",
    ),
    "randstad-politicus": dict(
        palette="randstad",
        highlight="the chrome microphone and silver tie-clip",
        subject=(
            "the Stadhouder politician hero, mid-50s polished orator in "
            "a charcoal-grey wool suit with a sky-blue shirt and a "
            "deep-navy silk tie clipped with a silver tie-clip, gripping "
            "a chrome handheld microphone in mid-debate gesture with "
            "one outstretched hand, neatly parted greying hair, "
            "earnest furrowed-brow rhetorical expression, formal "
            "podium-ready presence"
        ),
        extra_neg="casual outfit, wild hair, smiling jovially, sunglasses",
    ),

    # -------- LIMBURG heroes --------
    "limburg-mijnbaas": dict(
        palette="limburg",
        highlight="the heavy brass-buckle leather chest-strap and lamp",
        subject=(
            "De Mijnbaas hero, authoritative late-50s veteran mine-"
            "foreman with deep-tanned coal-streaked face and grey-"
            "streaked thick beard, wearing a heavy dark-leather miner's "
            "coat with a wide brass-buckle chest-strap, a brass-rimmed "
            "miner's helmet tucked under one arm with its small oil-lamp "
            "glowing warm amber, dark-soot smudges on weathered hands, "
            "stern commanding expression with deep-set wise eyes, "
            "gravitas of a lifetime underground"
        ),
        extra_neg="young miner, smooth face, modern industrial gear",
    ),
    "limburg-maasmeester": dict(
        palette="limburg",
        highlight="the long bread-knife blade and flour-dusted apron",
        subject=(
            "De Vlaaibaas Maasmeester hero, kindly late-50s old master-"
            "baker with flour-dusted forearms and a flour-streaked "
            "cream apron over a rolled-sleeve white linen shirt, holding "
            "a long polished bread-knife in one hand and resting the "
            "other on a freshly-baked golden cherry-vlaai on a wooden "
            "tray, full silver beard, ruddy cheeks, warm grandfatherly "
            "knowing smile, eyes crinkled with kindness"
        ),
        extra_neg="modern bakery, white chef hat, electric mixer",
    ),

    # -------- BELGEN heroes --------
    "belgen-frietkoning": dict(
        palette="belgen",
        highlight="the golden frites-crown and paper cone sceptre",
        subject=(
            "De Frietkoning hero, regal jolly mid-40s portly king with "
            "a tall ornate gold-and-deep-red royal robe trimmed with "
            "small embroidered frietzakje motifs along the shoulder, "
            "wearing an ornate stylised crown made of standing golden "
            "frites pieces around a gold band, gripping a large paper "
            "cone of golden frites like a royal sceptre in one hand, "
            "round red-cheeked face with a broad benevolent grin and "
            "bushy reddish-blond moustache, regal yet warmly funny "
            "presence"
        ),
        extra_neg="thin king, dark sinister mood, real Belgian royal family",
    ),
    "belgen-abdijbrouwer": dict(
        palette="belgen",
        highlight="the foaming amber Trappist beer and wooden cross",
        subject=(
            "De Abdijbrouwer hero, devout round-bellied mid-50s Trappist "
            "monk-brewer in a deep-brown wool monk's habit with a hood "
            "draped at the shoulders and a knotted rope cinch at the "
            "waist, holding a tall brown ceramic stein of foaming amber "
            "Trappist abbey beer in one hand and a small worn wooden "
            "cross necklace at his chest, tonsured hair ring around a "
            "balding crown, jolly ruddy cheeks with a warm contemplative "
            "smile, pious yet jovial vibe"
        ),
        extra_neg="modern bartender, thin athletic build, fantasy wizard, witch hat",
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
    """Returns the resulting image URL."""
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


def run_batch(names: list[str], parallel: int = 10) -> dict:
    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    if "assets" not in manifest:
        manifest["assets"] = {}
    manifest["generated"] = time.strftime("%Y-%m-%d")
    manifest["style_anchor"] = [
        "public/assets/portraits/randstad-infantry.png",
        "public/assets/portraits/brabant-support.png",
    ]
    manifest["model"] = "fal-ai/flux/dev"
    manifest["pipeline"] = "Flux Dev square_hd 1024x1024 -> PIL LANCZOS 512x512 -> PNG (NO BiRefNet, vignette+frame is design)"

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
        run_batch(["brabant-worker"], parallel=1)
    elif cmd == "all":
        run_batch(list(PORTRAITS.keys()), parallel=10)
    elif cmd == "one" and len(sys.argv) >= 3:
        n = sys.argv[2]
        if n not in PORTRAITS:
            raise SystemExit(f"unknown portrait '{n}'. Available: {', '.join(PORTRAITS)}")
        run_batch([n], parallel=1)
    else:
        print(__doc__); sys.exit(2)
