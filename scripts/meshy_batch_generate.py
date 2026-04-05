#!/usr/bin/env python3
"""
Meshy Batch Model Generator for Reign of Brabant v0.1
=====================================================
Submits all models to Meshy API and polls for completion.
Downloads GLB files when ready.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

API_KEY = "msy_YcImnRXoFgoVIbN3F1mHRAFdZgUHnIElaSC7"
BASE_URL = "https://api.meshy.ai/openapi/v2/text-to-3d"
PROJECT_DIR = "/Users/richardtheuws/Documents/games/reign-of-brabant"
OUTPUT_DIR = f"{PROJECT_DIR}/assets/models/v01"

# Model definitions: (key, subfolder, filename, prompt)
MODELS = [
    # Brabanders
    ("brab_worker", "brabanders", "worker.glb",
     "Low poly stylized medieval Dutch farmer, simple overalls, pitchfork, straw hat, warm earth brown tones, game character, isometric view, clean geometry"),
    ("brab_infantry", "brabanders", "infantry.glb",
     "Low poly stylized carnival warrior character, colorful costume with orange and red, holding party horn weapon, festive medieval armor, game character"),
    ("brab_ranged", "brabanders", "ranged.glb",
     "Low poly stylized medieval Dutch smuggler character, dark hooded cloak, throwing pose with beer mug, sneaky stance, game character"),
    ("brab_townhall", "brabanders", "townhall.glb",
     "Low poly stylized Dutch farmhouse building, red brick walls, steep gabled roof with chimney, small windmill attachment, warm tones, isometric game building"),
    ("brab_barracks", "brabanders", "barracks.glb",
     "Low poly stylized Dutch brown cafe bar building, warm glowing windows, wooden beer sign above door, cozy pub exterior, isometric game building"),
    # Randstad
    ("rand_worker", "randstad", "worker.glb",
     "Low poly stylized young intern character, oversized business suit, holding laptop and coffee cup, nervous expression, blue grey colors, game character"),
    ("rand_infantry", "randstad", "infantry.glb",
     "Low poly stylized corporate manager character, sharp business suit, throwing stack of papers, stern face, blue tie, game character"),
    ("rand_ranged", "randstad", "ranged.glb",
     "Low poly stylized hipster character on bicycle, man bun hairstyle, beard, carrying vinyl records, trendy urban clothes, game character"),
    ("rand_townhall", "randstad", "townhall.glb",
     "Low poly stylized modern glass office tower building, corporate headquarters, cold blue glass facade, minimalist design, isometric game building"),
    ("rand_barracks", "randstad", "barracks.glb",
     "Low poly stylized corporate meeting room building exterior, glass walls, conference table visible inside, grey steel frame, isometric game building"),
    # Shared
    ("shared_goldmine", "shared", "goldmine.glb",
     "Low poly stylized gold mine entrance, wooden support beams, golden glowing rocks and ore, medieval mining cart, isometric game prop"),
    ("shared_tree", "shared", "tree_pine.glb",
     "Low poly stylized pine tree, simple triangular cone shape, dark green foliage, brown trunk, clean geometry, game prop"),
]

# Already submitted tree task
EXISTING_TASKS = {
    "shared_tree": "019d5de7-d437-70c7-ae8e-01162681a739"
}


def api_request(url, data=None, method="GET"):
    """Make API request to Meshy."""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    if data:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
    else:
        req = urllib.request.Request(url, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"  HTTP {e.code}: {body[:200]}")
        return {"error": body, "status_code": e.code}
    except Exception as e:
        print(f"  Request error: {e}")
        return {"error": str(e)}


def submit_task(prompt):
    """Submit a text-to-3d preview task."""
    payload = {
        "mode": "preview",
        "prompt": prompt,
        "art_style": "realistic",
        "should_remesh": True,
    }
    return api_request(BASE_URL, data=payload)


def check_task(task_id):
    """Check task status."""
    return api_request(f"{BASE_URL}/{task_id}")


def download_file(url, output_path):
    """Download file from URL."""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=120) as resp:
            with open(output_path, "wb") as f:
                f.write(resp.read())
        return os.path.getsize(output_path)
    except Exception as e:
        print(f"  Download error: {e}")
        return 0


def main():
    print("=" * 60)
    print("Meshy Batch Model Generator - Reign of Brabant v0.1")
    print("=" * 60)
    print()

    # Ensure output dirs
    for sub in ["brabanders", "randstad", "shared"]:
        os.makedirs(f"{OUTPUT_DIR}/{sub}", exist_ok=True)

    # Track all tasks
    tasks = {}  # key -> {"task_id": ..., "subfolder": ..., "filename": ..., "status": ...}

    # Submit all models
    print("--- Submitting models ---")
    for key, subfolder, filename, prompt in MODELS:
        output_path = f"{OUTPUT_DIR}/{subfolder}/{filename}"

        # Skip if already submitted
        if key in EXISTING_TASKS:
            task_id = EXISTING_TASKS[key]
            tasks[key] = {
                "task_id": task_id,
                "subfolder": subfolder,
                "filename": filename,
                "output_path": output_path,
                "status": "PENDING",
            }
            print(f"  [EXISTING] {key} -> {task_id}")
            continue

        result = submit_task(prompt)
        task_id = result.get("result", "")

        if not task_id:
            print(f"  [FAILED]   {key}: {result}")
            tasks[key] = {"status": "SUBMIT_FAILED", "error": str(result)}
            continue

        tasks[key] = {
            "task_id": task_id,
            "subfolder": subfolder,
            "filename": filename,
            "output_path": output_path,
            "status": "PENDING",
        }
        print(f"  [OK]       {key} -> {task_id}")

        # Small delay to avoid rate limiting
        time.sleep(1.5)

    print()
    submitted = sum(1 for t in tasks.values() if t.get("task_id"))
    print(f"Submitted: {submitted} / {len(MODELS)}")
    print()

    if submitted == 0:
        print("ERROR: No models submitted")
        return

    # Poll for completion
    print("--- Polling for completion (max 10 min per model) ---")
    print()

    max_wait = 600  # 10 minutes
    poll_interval = 15  # seconds
    start_time = time.time()

    while True:
        pending = {k: v for k, v in tasks.items()
                   if v.get("task_id") and v["status"] in ("PENDING", "IN_PROGRESS")}

        if not pending:
            break

        elapsed = int(time.time() - start_time)
        if elapsed > max_wait:
            print(f"\nGLOBAL TIMEOUT after {elapsed}s")
            for k in pending:
                tasks[k]["status"] = "TIMEOUT"
            break

        for key, info in pending.items():
            result = check_task(info["task_id"])
            status = result.get("status", "UNKNOWN")
            progress = result.get("progress", 0)

            if status == "SUCCEEDED":
                glb_url = result.get("model_urls", {}).get("glb", "")
                if glb_url:
                    filesize = download_file(glb_url, info["output_path"])
                    tasks[key]["status"] = "COMPLETED"
                    tasks[key]["filesize"] = filesize
                    print(f"  [DONE]     {key}: {filesize:,} bytes -> {info['filename']}")
                else:
                    tasks[key]["status"] = "NO_GLB"
                    print(f"  [NO GLB]   {key}: model_urls = {result.get('model_urls', {})}")
            elif status in ("FAILED", "EXPIRED"):
                tasks[key]["status"] = "FAILED"
                error = result.get("task_error", "unknown")
                print(f"  [FAILED]   {key}: {error}")
            else:
                tasks[key]["status"] = status
                # Only print progress updates occasionally
                if progress % 25 == 0 or progress > 90:
                    print(f"  [{status:12s}] {key}: {progress}%")

            time.sleep(0.5)  # small delay between status checks

        time.sleep(poll_interval)

    # Summary
    print()
    print("=" * 60)
    print("GENERATION SUMMARY")
    print("=" * 60)

    completed = failed = timeout = 0
    for key, info in tasks.items():
        status = info["status"]
        if status == "COMPLETED":
            completed += 1
            size = info.get("filesize", 0)
            print(f"  OK    {key:20s} -> {info.get('filename', '?'):20s} ({size:>10,} bytes)")
        elif status in ("FAILED", "SUBMIT_FAILED", "NO_GLB"):
            failed += 1
            print(f"  FAIL  {key:20s}: {info.get('error', status)}")
        elif status == "TIMEOUT":
            timeout += 1
            print(f"  TIME  {key:20s}: timed out")
        else:
            print(f"  ???   {key:20s}: {status}")

    print()
    print(f"Total:     {len(MODELS)}")
    print(f"Completed: {completed}")
    print(f"Failed:    {failed}")
    print(f"Timeout:   {timeout}")
    print()

    # Write results to JSON for reference
    results_file = f"{PROJECT_DIR}/scripts/meshy_results.json"
    with open(results_file, "w") as f:
        json.dump(tasks, f, indent=2, default=str)
    print(f"Results saved to: {results_file}")

    return completed


if __name__ == "__main__":
    completed = main()
    sys.exit(0 if completed and completed > 0 else 1)
