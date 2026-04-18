#!/usr/bin/env python3
"""
Cinematic Video Generator — "Het Ontstaan" van Reign of Brabant
Genereert videoclips van keyframes via fal.ai Kling v3 image-to-video.
"""

import json
import urllib.request
import urllib.error
import base64
import os
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent
KEYFRAMES_DIR = SCRIPT_DIR / "keyframes"
CLIPS_DIR = SCRIPT_DIR / "clips"
CLIPS_DIR.mkdir(parents=True, exist_ok=True)

# Load API key
api_key = None
with open(ROOT_DIR / ".env") as f:
    for line in f:
        if line.startswith("FAL_AI_KEY="):
            api_key = line.strip().split("=", 1)[1].strip('"').strip("'")

if not api_key:
    print("ERROR: FAL_AI_KEY niet gevonden")
    sys.exit(1)


def image_to_data_url(path):
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    ext = path.suffix.lstrip(".")
    mime = "image/png" if ext == "png" else "image/jpeg"
    return f"data:{mime};base64,{b64}"


def submit_video(endpoint, payload):
    """Submit a video generation request to fal.ai queue."""
    url = f"https://queue.fal.run/{endpoint}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Key {api_key}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  Submit ERROR HTTP {e.code}: {body[:300]}")
        return None


def poll_result(response_url, max_wait=600):
    """Poll for video generation result."""
    start = time.time()
    last_log = start
    while time.time() - start < max_wait:
        time.sleep(5)
        try:
            req = urllib.request.Request(response_url, headers={
                "Authorization": f"Key {api_key}",
            })
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read())
        except urllib.error.HTTPError:
            continue
        except Exception:
            continue

        status = result.get("status", "")

        # Log progress every 30 seconds
        now = time.time()
        if now - last_log > 30:
            elapsed = int(now - start)
            print(f"    [{elapsed}s] Status: {status or 'processing'}...")
            last_log = now

        if status == "COMPLETED":
            return result
        elif status == "FAILED":
            error = result.get("error", "unknown")
            print(f"    FAILED: {error}")
            return None

        # No status field = might be direct result
        if not status and (result.get("video") or result.get("output")):
            return result

    print(f"    TIMEOUT after {max_wait}s")
    return None


def extract_video_url(result):
    """Extract video URL from fal.ai response."""
    if not result:
        return None
    # Kling: video.url
    video = result.get("video", {})
    if isinstance(video, dict) and video.get("url"):
        return video["url"]
    # Alternative: output.video_url
    output = result.get("output", {})
    if isinstance(output, dict):
        if output.get("video_url"):
            return output["video_url"]
        if output.get("video", {}).get("url"):
            return output["video"]["url"]
    # Seedance/other: data.video.url or similar
    data = result.get("data", {})
    if isinstance(data, dict) and data.get("video", {}).get("url"):
        return data["video"]["url"]
    return None


def download_video(url, output_path):
    """Download video from URL."""
    urllib.request.urlretrieve(url, output_path)
    size = os.path.getsize(output_path)
    print(f"    Saved: {output_path.name} ({size // 1024}KB)")
    return output_path


# ============================================================
# CLIP DEFINITIONS
# ============================================================

CLIPS = [
    {
        "name": "clip-01-de-maker",
        "keyframe": "01-de-maker.png",
        "duration": "5",
        "prompt": (
            "Slow cinematic push-in camera movement towards man's face, "
            "subtle laptop screen light flickers warmly on his skin, "
            "his fingers gently type on keyboard then pause, he leans back slightly, "
            "atmospheric moody night lighting, film grain, steady smooth camera"
        ),
    },
    {
        "name": "clip-02-de-transformatie",
        "keyframe": "02-de-transformatie.png",
        "duration": "5",
        "prompt": (
            "Camera slowly pulls back to reveal grand gothic cathedral interior around the man, "
            "golden magical particles and sparks rise from the glowing manuscript on the table, "
            "volumetric golden light rays shift through stained glass windows, "
            "dust motes float in the air, mystical atmosphere, cinematic"
        ),
    },
    {
        "name": "clip-03-het-worstenbroodje",
        "keyframe": "03-het-gouden-worstenbroodje.png",
        "duration": "5",
        "prompt": (
            "Slow upward camera tilt revealing sacred golden sausage roll on altar, "
            "candle flames flicker gently, golden divine aura pulsates and glows brighter, "
            "light particles rise upward, sacred reverent atmosphere, "
            "volumetric light beams, cinematic slow motion"
        ),
    },
    {
        "name": "clip-04-de-diefstal",
        "keyframe": "04-de-diefstal.png",
        "duration": "5",
        "prompt": (
            "A hand in blue business suit reaches forward and grabs the glowing golden object "
            "from stone altar with a swift decisive motion, the golden light dies as it is taken, "
            "a white business card falls onto the altar, candles blow out from sudden wind, "
            "dramatic tension, cold blue light replaces warm gold, cinematic thriller"
        ),
    },
    {
        "name": "clip-05-brabanders",
        "keyframe": "05-brabanders-rijzen.png",
        "duration": "5",
        "prompt": (
            "Epic medieval hero holds golden scepter high on hilltop, "
            "orange confetti and streamers blow in strong wind, "
            "massive army behind cheers and raises weapons, "
            "orange banners wave dramatically, windmills turn in background, "
            "golden sunrise light, epic triumphant atmosphere"
        ),
    },
    {
        "name": "clip-06-limburgers",
        "keyframe": "06-limburgers-verschijnen.png",
        "duration": "5",
        "prompt": (
            "Armored miners march forward out of massive stone cave into daylight, "
            "thick fog rolls out of the tunnel behind them, "
            "lead warrior with pickaxe walks steadily forward, "
            "lanterns swing, flags unfurl in the wind, "
            "mysterious atmospheric lighting, epic emergence"
        ),
    },
    {
        "name": "clip-07-belgen",
        "keyframe": "07-belgen-marcheren.png",
        "duration": "5",
        "prompt": (
            "Boisterous medieval king raises golden portion of fries triumphantly to the sky, "
            "huge crowd of warriors cheers behind him, "
            "red yellow and black banners wave in wind, "
            "festive warm golden atmosphere, celebratory energy, "
            "camera slowly pushes in on the leader"
        ),
    },
    {
        "name": "clip-08-randstad",
        "keyframe": "09-randstad-ceo.png",
        "duration": "5",
        "prompt": (
            "Sinister corporate figure in dark suit holds glowing golden trophy high "
            "in glass skyscraper office, city lights pulse below, "
            "cold blue neon reflections in glass, "
            "he smirks arrogantly, dark clouds swirl outside windows, "
            "corporate dystopia, dramatic low angle, cinematic"
        ),
    },
    {
        "name": "clip-09-richard-slagveld",
        "keyframe": "08-richard-op-slagveld.png",
        "duration": "5",
        "prompt": (
            "Epic slow camera crane movement upward and backward, "
            "revealing vast medieval battlefield landscape, "
            "man in black t-shirt stands alone looking at distant cathedral, "
            "wind blows through tall golden grass, colored army banners visible in distance, "
            "golden hour sunset rays break through dramatic clouds, "
            "one man against an epic world, cinematic crane shot"
        ),
    },
]


def main():
    print("=" * 60)
    print("REIGN OF BRABANT — Cinematic Video Generator")
    print("'Het Ontstaan' — 9 clips via Kling v3 image-to-video")
    print("=" * 60)

    # Check existing test result first
    existing_request = "019d851a-ec5b-7292-a3cd-98332b2df4f9"
    existing_url = f"https://queue.fal.run/fal-ai/kling-video/requests/{existing_request}"

    print(f"\nChecking earlier test clip (clip-01)...")
    test_result = poll_result(existing_url, max_wait=10)
    if test_result:
        video_url = extract_video_url(test_result)
        if video_url:
            print(f"  Test clip already done!")
            download_video(video_url, CLIPS_DIR / "clip-01-de-maker.mp4")
            # Skip clip 01 in generation
            clips_to_generate = [c for c in CLIPS if c["name"] != "clip-01-de-maker"]
        else:
            clips_to_generate = CLIPS
    else:
        print("  Test clip still processing or not found, will regenerate")
        clips_to_generate = CLIPS

    # Submit all clips
    endpoint = "fal-ai/kling-video/v3/standard/image-to-video"
    jobs = {}

    for clip in clips_to_generate:
        keyframe_path = KEYFRAMES_DIR / clip["keyframe"]
        if not keyframe_path.exists():
            print(f"\n  SKIP {clip['name']}: keyframe {clip['keyframe']} not found")
            continue

        print(f"\nSubmitting: {clip['name']}...")
        data_url = image_to_data_url(keyframe_path)

        payload = {
            "image_url": data_url,
            "prompt": clip["prompt"],
            "duration": clip["duration"],
            "aspect_ratio": "16:9",
        }

        result = submit_video(endpoint, payload)
        if result and result.get("request_id"):
            response_url = result.get("response_url", "")
            jobs[clip["name"]] = {
                "request_id": result["request_id"],
                "response_url": response_url,
            }
            print(f"  Queued: {result['request_id']}")
        else:
            print(f"  FAILED to submit")

        # Small delay between submissions to avoid rate limits
        time.sleep(1)

    print(f"\n{'=' * 60}")
    print(f"All {len(jobs)} clips submitted. Polling for results...")
    print(f"Video generation takes 2-5 minutes per clip.")
    print(f"{'=' * 60}")

    # Poll all jobs
    completed = {}
    failed = []

    start_time = time.time()
    max_total_wait = 600  # 10 minutes max

    while jobs and (time.time() - start_time < max_total_wait):
        for name, job in list(jobs.items()):
            try:
                req = urllib.request.Request(
                    job["response_url"],
                    headers={"Authorization": f"Key {api_key}"},
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    result = json.loads(resp.read())
            except Exception:
                continue

            status = result.get("status", "")

            if status == "COMPLETED" or (not status and result.get("video")):
                video_url = extract_video_url(result)
                if video_url:
                    print(f"\n  DONE: {name}")
                    output_path = CLIPS_DIR / f"{name}.mp4"
                    download_video(video_url, output_path)
                    completed[name] = output_path
                else:
                    print(f"\n  DONE but no video URL: {name}")
                    print(f"  Keys: {list(result.keys())}")
                    failed.append(name)
                del jobs[name]
            elif status == "FAILED":
                print(f"\n  FAILED: {name}")
                error = result.get("error", "unknown")
                print(f"  Error: {str(error)[:200]}")
                failed.append(name)
                del jobs[name]

        if jobs:
            elapsed = int(time.time() - start_time)
            remaining = list(jobs.keys())
            print(f"  [{elapsed}s] Waiting for {len(remaining)} clips: {', '.join(r.split('-', 2)[-1] for r in remaining)}...", end="\r")
            time.sleep(10)

    # Final summary
    print(f"\n\n{'=' * 60}")
    print("RESULTATEN")
    print(f"{'=' * 60}")
    print(f"Voltooid: {len(completed)}/{len(CLIPS)}")
    for name, path in sorted(completed.items()):
        size = os.path.getsize(path) // 1024
        print(f"  {name}: {size}KB")

    if failed:
        print(f"\nMislukt: {len(failed)}")
        for name in failed:
            print(f"  - {name}")

    if jobs:
        print(f"\nNog bezig (timeout): {len(jobs)}")
        for name in jobs:
            print(f"  - {name}")

    print(f"\nClips opgeslagen in: {CLIPS_DIR}")


if __name__ == "__main__":
    main()
