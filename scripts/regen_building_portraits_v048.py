#!/usr/bin/env python3
"""
Regenerate 24 building portraits (Brabant + Randstad) in painted-vignette style
matching limburg/belgen anchors. Flux Dev queue, parallel via ThreadPoolExecutor.

Style: painted oil-vignette, ornate gold curved frame border at top edge,
dark moody vignette background, dramatic chiaroscuro lighting. NO BiRefNet
(vignette + gold frame ARE the design).

Pipeline: queue.fal.run/fal-ai/flux/dev -> JPG -> PIL re-encode -> PNG.
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
MANIFEST_PATH = OUT_DIR / "_brabant-randstad-v048-batch.json"

# Universal style suffixes per faction
BRABANT_SUFFIX = (
    "centered on dark moody vignette background with deep green-black gradient "
    "and warm orange-red carnival accent lighting, ornate gold curved filigree "
    "frame border at top edge and corners matching painted RPG card style, "
    "dramatic chiaroscuro lighting, oil painting texture, museum quality, "
    "no readable text, no modern logos, no people figures dominating composition"
)

RANDSTAD_SUFFIX = (
    "centered on dark moody vignette background with deep slate-blue-black gradient "
    "and warm yellow desk-lamp accent lighting, ornate gold curved filigree "
    "frame border at top edge and corners matching painted RPG card style, "
    "dramatic chiaroscuro lighting, oil painting texture meets corporate concept art, "
    "museum quality, no readable text, no real-world brand logos, no people figures dominating composition"
)

# 24 portraits
ASSETS = [
    # ---- BRABANT (12) ----
    {
        "file": "brabant-townhall.png",
        "subject": (
            "painted RPG card art, Brabantian town hall (raadhuis), rural-folkloric "
            "fieldstone-and-red-brick building with stepped gable, warm wooden double doors, "
            "small belltower with weathervane, orange-and-yellow festive pennant banners "
            "strung from the eaves, hay bales by the entrance, lit lanterns flanking the door"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-barracks.png",
        "subject": (
            "painted RPG card art, Brabantian barracks (kazerne), sturdy red-brick longhouse "
            "with thatched-and-tile roof, oak training-yard fence in front, wooden weapon rack "
            "with practice halberds and shields, carnival pennants strung above the doorway, "
            "orange-and-red festive accents, warm forge-glow from a side window"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-lumbercamp.png",
        "subject": (
            "painted RPG card art, Brabantian lumber camp (houthakkerskamp), rustic timber "
            "shed with split-log walls and red-brick chimney, large two-handed felling axe "
            "embedded in a chopping block, stacks of split firewood, ox-cart loaded with logs, "
            "small orange carnival pennant on the roof ridge, warm hearth-glow inside"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-blacksmith.png",
        "subject": (
            "painted RPG card art, Brabantian blacksmith forge (smederij), red-brick smithy "
            "with low-slung tile roof, glowing orange forge-fire visible through wide arched "
            "window, anvil and bellows on the porch, hammers and tongs hanging from beam, "
            "iron horseshoe nailed above the door for luck, warm carnival pennant accent"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-housing.png",
        "subject": (
            "painted RPG card art, Brabantian peasant cottages (boerderijen), cluster of two "
            "small red-brick houses with thatched roofs and white-painted shutters, smoke "
            "curling from chimneys, hay stacks beside the wall, wooden cart wheel leaning "
            "against the side, orange-and-yellow carnival flag bunting strung between the "
            "houses, warm window-glow at dusk"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-tertiary.png",
        "subject": (
            "painted RPG card art, Brabantian worstenbroodjes food stall (worstenbroodjeskraam), "
            "warm wooden timber-framed kraam with red-and-orange striped awning, golden-brown "
            "sausage rolls displayed on a wooden counter, copper kettle steaming with coffee, "
            "small chalkboard with no readable text, carnival fairy-lights strung along the "
            "awning, festive rural-Brabant atmosphere"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-upgrade.png",
        "subject": (
            "painted RPG card art, Brabantian upgrade workshop (verbeterwerkplaats), "
            "red-brick artisan hall with tall arched window showing a master craftsman silhouette "
            "at an oak workbench, scattered hammers chisels and folio scrolls, glowing alchemical "
            "vial on a shelf, copper instruments hanging from beam, warm orange forge-glow"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-faction-special-1.png",
        "subject": (
            "painted RPG card art, Brabantian carnival tent (carnavalstent), large festive "
            "circus-style striped tent in orange yellow and red with golden tassel trim, "
            "warm fairy-lights strung along the entrance flap, wooden barrels stacked beside "
            "the entrance, golden cross-and-star Bourgondisch banner hanging above, festive "
            "torch-glow spilling out, no characters dominating"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-faction-special-2.png",
        "subject": (
            "painted RPG card art, Brabantian feestzaal (festive hall), warm timber-framed "
            "long hall with arched red-brick entrance, colorful stained-glass windows showing "
            "abstract carnival motifs, orange-and-yellow streamers crossing the facade, two "
            "wooden beer-barrels flanking the doorway, golden lantern light pouring from "
            "within, festive bunting strung along the eaves"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-defense-tower.png",
        "subject": (
            "painted RPG card art, Brabantian defense tower (verdedigingstoren), squat "
            "red-brick watchtower with crenellated stone top and conical tile roof, narrow "
            "arrow-slit windows, oak reinforced door at base, wooden palisade around the foot, "
            "Bourgondisch orange-and-yellow banner flying from the spire, single lit lantern "
            "at the top window, sturdy fortified appearance"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-siege-workshop.png",
        "subject": (
            "painted RPG card art, Brabantian siege workshop (belegeringswerkplaats), large "
            "open-fronted timber barn with heavy oak beams and red-brick foundation, partially "
            "assembled wooden ballista visible inside, stacks of timber and iron-banded wagon "
            "wheels, blacksmith's anvil at the side, carnival pennant on the roof ridge, "
            "warm forge-glow from interior"
        ),
        "faction": "brabant",
    },
    {
        "file": "brabant-bridge.png",
        "subject": (
            "painted RPG card art, Brabantian stone bridge (brug), arched red-brick bridge "
            "spanning a small canal, mossy stone parapet, two warm-glowing lanterns on iron "
            "posts at each end, wooden cart with hay crossing the span, orange-and-yellow "
            "carnival pennants strung along the parapet, willow trees on the banks, warm "
            "rural-Brabant evening atmosphere"
        ),
        "faction": "brabant",
    },
    # ---- RANDSTAD (12) ----
    {
        "file": "randstad-townhall.png",
        "subject": (
            "painted RPG card art, Randstad corporate headquarters (hoofdkantoor), tall "
            "modern glass-and-steel office tower with sharp geometric facade, slate-blue "
            "spandrel panels and reflective glazing, sleek cantilevered entrance canopy, "
            "minimalist landscaping with low concrete planters, warm yellow window-grid "
            "glow from offices working late, slick anti-folkloric aesthetic"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-barracks.png",
        "subject": (
            "painted RPG card art, Randstad corporate training auditorium (vergaderzaal), "
            "low-rise rectangular concrete-and-glass presentation hall with green sedum roof, "
            "rows of theatre-seating visible through the curtain-wall glass facade, podium "
            "with holographic dashboard display inside, slate-blue accent panels, brushed "
            "steel entrance, sterile efficient corporate atmosphere"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-lumbercamp.png",
        "subject": (
            "painted RPG card art, Randstad sustainable resource processing facility, modern "
            "industrial warehouse with pre-cast concrete panels and tall glass loading-bay "
            "doors, ESG-compliant signage placard with abstract leaf icon (no readable text), "
            "stacked machine-cut timber pallets in neat geometric arrangement, slate-blue "
            "trim, forklift parked outside, sterile efficient corporate-industrial aesthetic"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-blacksmith.png",
        "subject": (
            "painted RPG card art, Randstad CNC fabrication workshop (industriele werkplaats), "
            "modern light-industrial unit with corrugated slate-grey steel siding and large "
            "glass roller-door, orange sparks visible from a robotic welding arm inside, "
            "stacks of machined steel components, slate-blue trim, brushed metal signage, "
            "warm yellow interior workshop lighting, anti-folkloric corporate efficiency"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-housing.png",
        "subject": (
            "painted RPG card art, Randstad mid-rise residential block (woontoren), uniform "
            "modern apartment building with grid of identical balconies in slate-blue and "
            "white concrete, glass railings, geometric stair tower at one end, narrow strip "
            "of corporate landscaping with low boxwood hedges, warm yellow grid of window "
            "glow at dusk, sterile commuter-housing aesthetic"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-tertiary.png",
        "subject": (
            "painted RPG card art, Randstad havermoutmelkbar oat-milk cafe, modern minimalist "
            "glass-fronted corporate cafe storefront with brushed-steel counter visible inside, "
            "abstract geometric crown emblem signage above the door (invented brand mark), "
            "slate-blue interior with warm yellow pendant lights, glass dispensers of pastel-"
            "colored grain bowls on display, NO espresso machine, NO barista, sterile efficient"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-upgrade.png",
        "subject": (
            "painted RPG card art, Randstad innovation R&D lab, modern open-plan corporate "
            "office interior visible through floor-to-ceiling glass facade, holographic KPI "
            "dashboard projection floating mid-air, scrum-board with pastel sticky notes on "
            "the wall (no readable text), slate-blue walls and brushed-steel desks, warm "
            "yellow desk-lamp accents, sterile innovation-theatre atmosphere"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-faction-special-1.png",
        "subject": (
            "painted RPG card art, Randstad executive boardroom (bestuurskamer), corporate "
            "boardroom interior with long obsidian-black conference table reflecting overhead "
            "spotlights, twelve identical leather executive chairs, floor-to-ceiling window "
            "showing a slate-grey skyline at dusk, holographic line-graph dashboard on the "
            "side wall, single warm yellow desk-lamp in corner, anti-folkloric corporate power"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-faction-special-2.png",
        "subject": (
            "painted RPG card art, Randstad multi-storey corporate parking garage "
            "(parkeergarage), open-frame concrete parking structure with horizontal slate-blue "
            "louver panels, ramp spiraling up between levels, rows of identical parked sedans "
            "in neat geometric arrangement, single warm yellow sodium-vapor lamp glow on each "
            "level, ESG-compliant electric-charging station bays, sterile efficient utilitarian"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-defense-tower.png",
        "subject": (
            "painted RPG card art, Randstad corporate security observation tower, modern "
            "monolithic concrete-and-steel observation tower with reflective slate-blue mirror"
            "-glass top floor, surveillance camera arrays mounted at the corners, narrow "
            "horizontal slit windows, sleek geometric base with ID-card access door, single "
            "warm yellow LED beacon at the apex, anti-folkloric corporate panopticon aesthetic"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-siege-workshop.png",
        "subject": (
            "painted RPG card art, Randstad heavy-equipment R&D hangar, large modern industrial "
            "hangar with corrugated steel siding and oversized glass roller-doors, partially "
            "assembled drone-siege-engine on a hydraulic lift inside (modern industrial design, "
            "sleek slate-blue panels, exposed wiring), gantry crane overhead, stacks of crated "
            "components, warm yellow workshop-lamp accents, anti-folkloric corporate-industrial"
        ),
        "faction": "randstad",
    },
    {
        "file": "randstad-bridge.png",
        "subject": (
            "painted RPG card art, Randstad modern highway viaduct (snelwegviaduct), sleek "
            "cable-stayed concrete bridge with single tall slate-blue pylon and steel cables "
            "fanning down to the deck, smooth pre-cast concrete parapet, modern LED roadway "
            "lighting in warm yellow at regular intervals, dual-carriageway visible across "
            "the span, geometric anti-folkloric infrastructure aesthetic, dusk lighting"
        ),
        "faction": "randstad",
    },
]

# Validate count
assert len(ASSETS) == 24, f"Expected 24 assets, got {len(ASSETS)}"

NEGATIVE_PROMPT = (
    "blurry, photorealistic photograph, watermark, signature, gibberish text, "
    "real-world brand logos, recognizable corporate logos, EU flag, national flag, "
    "anime, cartoon, ugly, deformed, multiple buildings cluttered, stick figures"
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
    if asset["faction"] == "brabant":
        suffix = BRABANT_SUFFIX
    else:
        suffix = RANDSTAD_SUFFIX
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
            result = http_get(job["response_url"])
            return result
        if status in ("FAILED", "ERROR"):
            raise RuntimeError(f"job failed: {st}")
        time.sleep(sleep)
    raise TimeoutError(f"timeout for {job['asset']['file']}")


def process_one(asset: dict) -> dict:
    name = asset["file"]
    try:
        # Backup if no .bak.png exists yet
        out_path = OUT_DIR / name
        bak_path = OUT_DIR / name.replace(".png", ".bak.png")
        if out_path.exists() and not bak_path.exists():
            bak_path.write_bytes(out_path.read_bytes())
            print(f"  backed up {name} -> {bak_path.name}")

        # Submit
        job = submit_one(asset)
        print(f"  submitted {name} (request_id={job['request_id'][:8]}...)")

        # Poll
        result = poll_one(job)
        img_url = result["images"][0]["url"]
        seed = result.get("seed")

        # Download
        raw = http_download(img_url)

        # PIL re-encode to PNG
        from PIL import Image
        im = Image.open(BytesIO(raw)).convert("RGB")
        im.save(out_path, format="PNG", optimize=True)
        size = out_path.stat().st_size

        return {
            "file": name,
            "faction": asset["faction"],
            "prompt": job["prompt"],
            "seed": seed,
            "url": img_url,
            "bytes": size,
            "status": "ok",
        }
    except Exception as e:
        return {
            "file": name,
            "faction": asset["faction"],
            "status": "error",
            "error": str(e),
        }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generating {len(ASSETS)} portraits in parallel (max_workers=8)...")
    t0 = time.time()
    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(process_one, a): a for a in ASSETS}
        for fut in as_completed(futs):
            r = fut.result()
            print(f"[{r['status']}] {r['file']}", end="")
            if r["status"] == "ok":
                print(f" ({r['bytes']/1024:.0f}KB, seed={r.get('seed')})")
            else:
                print(f" ERROR: {r.get('error')}")
            results.append(r)
    elapsed = time.time() - t0
    print(f"\nTotal wallclock: {elapsed:.1f}s")

    # Write manifest
    manifest = {
        "generated": time.strftime("%Y-%m-%d"),
        "wallclock_s": round(elapsed, 1),
        "model": "fal-ai/flux/dev",
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "negative_prompt": NEGATIVE_PROMPT,
        "brabant_style_suffix": BRABANT_SUFFIX,
        "randstad_style_suffix": RANDSTAD_SUFFIX,
        "assets": results,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    print(f"Manifest: {MANIFEST_PATH}")

    n_ok = sum(1 for r in results if r["status"] == "ok")
    n_err = len(results) - n_ok
    print(f"Summary: {n_ok}/{len(results)} OK, {n_err} errors")
    if n_err > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
