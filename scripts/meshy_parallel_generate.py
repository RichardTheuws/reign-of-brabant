#!/usr/bin/env python3
"""
Meshy Studio Parallel 3D Model Generator
=========================================
Submits all faction models to Meshy image-to-3d simultaneously,
polls for completion, downloads GLB files.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# Load API key from .env
ENV_PATH = "/Users/richardtheuws/Documents/games/.env"
API_KEY = ""
with open(ENV_PATH) as f:
    for line in f:
        if line.startswith("MESHY_STUDIO_API_KEY="):
            API_KEY = line.strip().split("=", 1)[1]
            break

if not API_KEY:
    print("ERROR: MESHY_STUDIO_API_KEY not found in .env")
    sys.exit(1)

BASE_API = "https://api.meshy.ai/openapi/v1/image-to-3d"
CONCEPT_URL = "https://theuws.com/games/reign-of-brabant/assets/factions/concept-art"
OUTPUT_DIR = "/Users/richardtheuws/Documents/games/reign-of-brabant/assets/models/v02"

# All 10 models to generate
MODELS = [
    # Limburgers units
    {"name": "limb_worker", "faction": "limburgers", "file": "worker.glb",
     "image": f"{CONCEPT_URL}/limburgers/mijnwerker.png"},
    {"name": "limb_infantry", "faction": "limburgers", "file": "infantry.glb",
     "image": f"{CONCEPT_URL}/limburgers/schutterij.png"},
    {"name": "limb_ranged", "faction": "limburgers", "file": "ranged.glb",
     "image": f"{CONCEPT_URL}/limburgers/vlaaienwerper.png"},
    # Limburgers buildings
    {"name": "limb_townhall", "faction": "limburgers", "file": "townhall.glb",
     "image": f"{CONCEPT_URL}/limburgers/grottentempel.png"},
    {"name": "limb_barracks", "faction": "limburgers", "file": "barracks.glb",
     "image": f"{CONCEPT_URL}/limburgers/heuvelfort.png"},
    # Belgen units
    {"name": "belg_worker", "faction": "belgen", "file": "worker.glb",
     "image": f"{CONCEPT_URL}/belgen/frietkraamhouder.png"},
    {"name": "belg_infantry", "faction": "belgen", "file": "infantry.glb",
     "image": f"{CONCEPT_URL}/belgen/bierbouwer.png"},
    {"name": "belg_ranged", "faction": "belgen", "file": "ranged.glb",
     "image": f"{CONCEPT_URL}/belgen/chocolatier.png"},
    # Belgen buildings
    {"name": "belg_townhall", "faction": "belgen", "file": "townhall.glb",
     "image": f"{CONCEPT_URL}/belgen/wafelpaleis.png"},
    {"name": "belg_barracks", "faction": "belgen", "file": "barracks.glb",
     "image": f"{CONCEPT_URL}/belgen/frituurfort.png"},
]


def api_request(url, data=None, method="GET"):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    if data:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        return {"error": body, "status_code": e.code}
    except Exception as e:
        return {"error": str(e)}


def submit_model(model):
    """Submit a single model to Meshy image-to-3d."""
    payload = {
        "image_url": model["image"],
        "enable_pbr": True,
    }
    result = api_request(BASE_API, data=payload)
    if "result" in result:
        return result["result"]
    elif "error" in result:
        print(f"  ERROR submitting {model['name']}: {result['error'][:200]}")
        return None
    return None


def check_status(task_id):
    """Check the status of a Meshy task."""
    return api_request(f"{BASE_API}/{task_id}")


def download_glb(url, output_path):
    """Download a GLB file."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    urllib.request.urlretrieve(url, output_path)


def main():
    print("=" * 50)
    print(" Meshy Studio Parallel 3D Generator")
    print("=" * 50)
    print(f" Models to generate: {len(MODELS)}")
    print(f" Output: {OUTPUT_DIR}")
    print()

    # Create output directories
    for faction in ["limburgers", "belgen"]:
        os.makedirs(f"{OUTPUT_DIR}/{faction}", exist_ok=True)

    # Phase 1: Submit all models simultaneously
    print("[1/3] Submitting all models...")
    tasks = {}
    for model in MODELS:
        task_id = submit_model(model)
        if task_id:
            tasks[model["name"]] = {"id": task_id, "model": model, "status": "PENDING"}
            print(f"  OK {model['name']} → {task_id}")
        else:
            print(f"  FAIL {model['name']}")

    print(f"\n  Submitted: {len(tasks)}/{len(MODELS)}")
    if not tasks:
        print("No tasks submitted. Exiting.")
        return

    # Phase 2: Poll all tasks until complete
    print("\n[2/3] Polling for completion...")
    start_time = time.time()
    max_wait = 600  # 10 minutes max

    while True:
        elapsed = time.time() - start_time
        if elapsed > max_wait:
            print(f"\n  TIMEOUT after {max_wait}s")
            break

        all_done = True
        for name, task in tasks.items():
            if task["status"] in ("SUCCEEDED", "FAILED"):
                continue

            result = check_status(task["id"])
            status = result.get("status", "UNKNOWN")
            task["status"] = status

            if status == "SUCCEEDED":
                # Get GLB URL
                glb_url = result.get("model_urls", {}).get("glb", "")
                if not glb_url:
                    glb_url = result.get("model_url", "")
                task["glb_url"] = glb_url
                print(f"  DONE {name} ({int(elapsed)}s)")
            elif status == "FAILED":
                print(f"  FAIL {name}: {result.get('task_error', {}).get('message', 'unknown')}")
            else:
                all_done = False

        if all_done:
            break

        # Progress bar
        done = sum(1 for t in tasks.values() if t["status"] in ("SUCCEEDED", "FAILED"))
        print(f"  ... {done}/{len(tasks)} complete ({int(elapsed)}s)", end="\r")
        time.sleep(10)

    # Phase 3: Download GLB files
    print("\n\n[3/3] Downloading GLB files...")
    downloaded = 0
    for name, task in tasks.items():
        if task["status"] != "SUCCEEDED" or not task.get("glb_url"):
            continue

        model = task["model"]
        output_path = f"{OUTPUT_DIR}/{model['faction']}/{model['file']}"
        try:
            download_glb(task["glb_url"], output_path)
            size_kb = os.path.getsize(output_path) / 1024
            print(f"  OK {name} → {output_path} ({size_kb:.0f}K)")
            downloaded += 1
        except Exception as e:
            print(f"  FAIL download {name}: {e}")

    # Summary
    print(f"\n{'=' * 50}")
    print(f" COMPLETE: {downloaded}/{len(MODELS)} models generated")
    succeeded = sum(1 for t in tasks.values() if t["status"] == "SUCCEEDED")
    failed = sum(1 for t in tasks.values() if t["status"] == "FAILED")
    pending = sum(1 for t in tasks.values() if t["status"] not in ("SUCCEEDED", "FAILED"))
    print(f"  Succeeded: {succeeded}")
    print(f"  Failed:    {failed}")
    print(f"  Timeout:   {pending}")
    print(f"  Time:      {int(time.time() - start_time)}s")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
