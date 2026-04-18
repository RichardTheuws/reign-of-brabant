#!/usr/bin/env python3
"""
Cinematic Keyframe Generator — "Het Ontstaan" van Reign of Brabant
Genereert 8 keyframes via fal.ai Flux Pro voor video-productie.
"""

import os
import sys
import json
import time
import base64
import urllib.request
import urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Config
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent  # games/
ENV_FILE = ROOT_DIR / ".env"
OUTPUT_DIR = SCRIPT_DIR / "keyframes"
RICHARD_PHOTO = Path.home() / "Documents" / "richard-podium.jpg"

# Load API key
api_key = None
with open(ENV_FILE) as f:
    for line in f:
        if line.startswith("FAL_AI_KEY="):
            api_key = line.strip().split("=", 1)[1].strip('"').strip("'")
            break

if not api_key:
    print("ERROR: FAL_AI_KEY niet gevonden in .env")
    sys.exit(1)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def fal_request(endpoint, payload, timeout=120):
    """Make a synchronous fal.ai API request."""
    url = f"https://fal.run/{endpoint}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Key {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code}: {body[:500]}")
        return None


def fal_queue_request(endpoint, payload, max_wait=300):
    """Make an async fal.ai API request via queue."""
    # Submit
    url = f"https://queue.fal.run/{endpoint}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Key {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  Submit HTTP {e.code}: {body[:500]}")
        return None

    request_id = result.get("request_id")
    response_url = result.get("response_url")
    if not request_id:
        # Might be a direct response
        return result

    if not response_url:
        response_url = f"https://queue.fal.run/{endpoint}/requests/{request_id}"

    # Poll
    start = time.time()
    while time.time() - start < max_wait:
        time.sleep(3)
        poll_req = urllib.request.Request(
            response_url,
            headers={"Authorization": f"Key {api_key}"},
        )
        try:
            with urllib.request.urlopen(poll_req, timeout=30) as resp:
                poll_result = json.loads(resp.read())
        except Exception:
            continue

        status = poll_result.get("status", "")
        if status == "COMPLETED":
            return poll_result
        elif status == "FAILED":
            print(f"  FAILED: {json.dumps(poll_result)[:300]}")
            return None
        elif not status:
            # No status = might be completed
            if poll_result.get("images") or poll_result.get("image"):
                return poll_result

    print("  TIMEOUT waiting for result")
    return None


def upload_image_to_fal(image_path):
    """Upload an image to fal.ai storage and return the URL."""
    print(f"  Uploading {image_path.name} to fal.ai storage...")

    # Step 1: Initiate upload
    url = "https://fal.ai/api/storage/upload/initiate"
    payload = {
        "file_name": image_path.name,
        "content_type": "image/jpeg",
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Key {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
        upload_url = result.get("upload_url")
        file_url = result.get("file_url")
    except Exception as e:
        print(f"  Upload initiate failed: {e}")
        # Fallback: use base64 data URL
        return image_to_data_url(image_path)

    if not upload_url:
        return image_to_data_url(image_path)

    # Step 2: Upload the file
    with open(image_path, "rb") as f:
        file_data = f.read()

    put_req = urllib.request.Request(
        upload_url,
        data=file_data,
        method="PUT",
        headers={"Content-Type": "image/jpeg"},
    )
    try:
        with urllib.request.urlopen(put_req, timeout=60) as resp:
            pass
        print(f"  Uploaded: {file_url}")
        return file_url
    except Exception as e:
        print(f"  Upload PUT failed: {e}")
        return image_to_data_url(image_path)


def image_to_data_url(image_path):
    """Convert image to base64 data URL as fallback."""
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    return f"data:image/jpeg;base64,{b64}"


def extract_image_url(result):
    """Extract image URL from fal.ai response."""
    if not result:
        return None
    # Standard: images[0].url
    images = result.get("images", [])
    if images and isinstance(images, list):
        return images[0].get("url")
    # BiRefNet: image.url
    img = result.get("image", {})
    if isinstance(img, dict):
        return img.get("url")
    # Output wrapper
    output = result.get("output", {})
    if isinstance(output, dict):
        imgs = output.get("images", [])
        if imgs:
            return imgs[0].get("url")
    return None


def download_image(url, output_path):
    """Download image from URL."""
    urllib.request.urlretrieve(url, output_path)
    size = os.path.getsize(output_path)
    print(f"  Saved: {output_path.name} ({size // 1024}KB)")


def generate_keyframe(name, prompt, model="fal-ai/flux-pro/v1.1", width=1920, height=1080,
                      image_url=None, strength=0.65, use_queue=True):
    """Generate a single keyframe."""
    output_path = OUTPUT_DIR / f"{name}.png"
    print(f"\n{'='*60}")
    print(f"Keyframe: {name}")
    print(f"Model: {model}")
    print(f"Prompt: {prompt[:80]}...")

    if image_url and "image-to-image" in model:
        payload = {
            "prompt": prompt,
            "image_url": image_url,
            "strength": strength,
            "image_size": {"width": width, "height": height},
            "num_images": 1,
            "sync_mode": True,
            "enable_safety_checker": False,
        }
    else:
        payload = {
            "prompt": prompt,
            "image_size": {"width": width, "height": height},
            "num_images": 1,
            "sync_mode": True,
            "enable_safety_checker": False,
        }

    if use_queue:
        result = fal_queue_request(model, payload, max_wait=180)
    else:
        result = fal_request(model, payload, timeout=180)

    img_url = extract_image_url(result)
    if img_url:
        download_image(img_url, output_path)
        return output_path
    else:
        print(f"  FAILED — no image URL in response")
        if result:
            print(f"  Response: {json.dumps(result)[:300]}")
        return None


# ============================================================
# KEYFRAME DEFINITIONS
# ============================================================

KEYFRAMES = [
    {
        "name": "01-de-maker",
        "prompt": (
            "A bald muscular man with a grey goatee beard and full sleeve tattoos on both arms, "
            "wearing a black graphic t-shirt, sitting at a desk in a dark room at night. "
            "His face is illuminated by warm orange light from a laptop screen in front of him. "
            "Moody atmospheric lighting, only the laptop glow and faint moonlight from a window. "
            "Photorealistic, cinematic, shallow depth of field, film grain. "
            "Shot on 35mm, wide angle lens, intimate close-up composition."
        ),
        "model": "fal-ai/flux-pro/v1.1",
    },
    {
        "name": "02-de-transformatie",
        "prompt": (
            "A bald muscular man with grey goatee and tattooed arms wearing a black t-shirt, "
            "sitting at an ancient wooden table inside a grand gothic cathedral. "
            "The modern room is transforming around him — walls cracking open to reveal medieval stone walls, "
            "golden light pouring through the cracks, stained glass windows materializing. "
            "His laptop has transformed into a glowing illuminated manuscript. "
            "Magical realism, volumetric golden light rays, dust particles, "
            "cinematic wide shot, epic fantasy atmosphere, photorealistic."
        ),
        "model": "fal-ai/flux-pro/v1.1",
    },
    {
        "name": "03-het-gouden-worstenbroodje",
        "prompt": (
            "A magnificent golden sausage roll sitting on an ornate stone altar inside a gothic cathedral. "
            "The sausage roll emits a warm sacred golden aura and soft divine light. "
            "Dozens of candles surround the altar, medieval stone columns rise into darkness above. "
            "Stained glass windows cast colored light patterns on the floor. "
            "Sacred, reverent atmosphere like a holy relic. "
            "Cinematic, volumetric light, shallow depth of field, warm golden color palette, photorealistic."
        ),
        "model": "fal-ai/flux-pro/v1.1",
    },
    {
        "name": "04-de-diefstal",
        "prompt": (
            "A man's hand in a crisp blue business suit sleeve reaching out to grab a glowing golden object "
            "from a stone altar in a dark cathedral. Dramatic lighting contrast: "
            "cold blue light on the business suit hand versus warm golden light from the sacred object. "
            "A white business card lies on the altar. "
            "Cinematic close-up, tension, thriller atmosphere, shallow depth of field, "
            "film noir meets medieval, photorealistic."
        ),
        "model": "fal-ai/flux-pro/v1.1",
    },
    {
        "name": "05-brabanders-rijzen",
        "prompt": (
            "A heroic medieval army leader standing on a green hill at golden sunrise, "
            "holding a golden ceremonial scepter high above his head. "
            "Behind him hundreds of medieval warriors with pitchforks, colorful carnival costumes and orange banners. "
            "Confetti and streamers fly through the air. "
            "Dutch Brabant countryside landscape with windmills in the background. "
            "Orange and gold dominant color palette, epic hero pose silhouette against sunrise. "
            "Low-poly stylized 3D aesthetic, RTS game cinematic quality, volumetric light rays."
        ),
        "model": "fal-ai/flux-pro/v1.1",
    },
    {
        "name": "06-limburgers-verschijnen",
        "prompt": (
            "Armored miners emerging from a massive stone cave entrance in a misty hillside. "
            "The lead figure carries a heavy mining pickaxe on his shoulder, wearing stone-grey armor. "
            "Behind him rows of soldiers carrying flags and lanterns emerge from underground tunnels. "
            "Dense fog rolls out of the cave. Grey-green color palette, mysterious atmosphere. "
            "Limestone hills, dark forest backdrop. "
            "Low-poly stylized 3D aesthetic, RTS game cinematic quality, volumetric fog, dramatic backlighting."
        ),
        "model": "fal-ai/flux-pro/v1.1",
    },
    {
        "name": "07-belgen-marcheren",
        "prompt": (
            "A jovial medieval army assembled behind rows of steaming food stalls and beer barrels. "
            "The army leader is a large boisterous man holding up a golden portion of fries like a trophy. "
            "Red, yellow and black medieval banners wave everywhere (Belgian colors). "
            "Soldiers carry beer kegs and chocolate boxes as weapons. A monk with a staff stands beside the leader. "
            "Warm festive golden light, celebration atmosphere. "
            "Low-poly stylized 3D aesthetic, RTS game cinematic quality, rich warm colors."
        ),
        "model": "fal-ai/flux-pro/v1.1",
    },
    {
        "name": "08-richard-op-slagveld",
        "prompt": (
            "A bald muscular man with grey goatee and full sleeve tattoos wearing a black t-shirt, "
            "standing alone on a vast medieval battlefield, viewed from behind in an epic wide shot. "
            "He looks out over a dramatic landscape: a gothic cathedral in the distance, "
            "four armies converging from different directions with colored banners "
            "(orange, grey-green, red-yellow, blue). "
            "Golden hour sunset light, volumetric sun rays breaking through dramatic clouds. "
            "Wind blows across tall grass. Epic scale, one man against a world. "
            "Cinematic crane shot perspective, photorealistic, film grain."
        ),
        "model": "fal-ai/flux-pro/v1.1",
    },
]


def main():
    print("=" * 60)
    print("REIGN OF BRABANT — Cinematic Keyframe Generator")
    print("'Het Ontstaan' — 8 keyframes voor video productie")
    print("=" * 60)

    # Upload Richard's photo for reference (we may need it later for face swap)
    if RICHARD_PHOTO.exists():
        richard_url = upload_image_to_fal(RICHARD_PHOTO)
        print(f"  Richard reference URL ready")
        # Save URL for video generation phase
        with open(SCRIPT_DIR / "richard-reference-url.txt", "w") as f:
            f.write(richard_url)
    else:
        print(f"  WARNING: {RICHARD_PHOTO} not found")
        richard_url = None

    # Generate keyframes (sequentially to avoid rate limits, but could parallel 2-3)
    results = {}
    total = len(KEYFRAMES)

    for i, kf in enumerate(KEYFRAMES, 1):
        print(f"\n[{i}/{total}] Generating: {kf['name']}")
        result = generate_keyframe(
            name=kf["name"],
            prompt=kf["prompt"],
            model=kf.get("model", "fal-ai/flux-pro/v1.1"),
            width=1920,
            height=1080,
        )
        results[kf["name"]] = result

    # Summary
    print("\n" + "=" * 60)
    print("RESULTATEN")
    print("=" * 60)
    success = sum(1 for v in results.values() if v)
    failed = sum(1 for v in results.values() if not v)
    print(f"Succesvol: {success}/{total}")
    if failed:
        print(f"Mislukt: {failed}")
        for name, result in results.items():
            if not result:
                print(f"  - {name}")

    print(f"\nKeyframes opgeslagen in: {OUTPUT_DIR}")
    print("Volgende stap: Video generatie met Seedance 2.0 reference-to-video")


if __name__ == "__main__":
    main()
