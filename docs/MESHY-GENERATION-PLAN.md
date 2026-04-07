# Meshy Studio Direct API -- 3D Model Generation Plan

**Created**: 2026-04-07
**Status**: Research complete, ready for execution
**Game**: Reign of Brabant (WarCraft-style RTS)

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication & Setup](#2-authentication--setup)
3. [Endpoint Reference](#3-endpoint-reference)
4. [fal.ai Proxy vs Meshy Studio Direct -- Comparison](#4-falai-proxy-vs-meshy-studio-direct----comparison)
5. [Current Model Inventory & Quality Assessment](#5-current-model-inventory--quality-assessment)
6. [Recommended Parameters for RTS Models](#6-recommended-parameters-for-rts-models)
7. [Priority Generation List](#7-priority-generation-list)
8. [Image-to-3D Workflow with Concept Art](#8-image-to-3d-workflow-with-concept-art)
9. [Shell Script Template](#9-shell-script-template)
10. [Cost Estimation](#10-cost-estimation)
11. [Post-Generation Pipeline](#11-post-generation-pipeline)

---

## 1. API Overview

**Meshy Studio Direct API** is the preferred method for 3D model generation for Reign of Brabant. It provides direct access to the Meshy v6 backend without the fal.ai intermediary, offering higher queue limits (20 concurrent vs 10), higher processing priority, and access to the full API surface including separate rigging and animation endpoints.

**Base URL**: `https://api.meshy.ai/openapi/`
**API Key**: Stored in `/Users/richardtheuws/Documents/games/.env` as `MESHY_STUDIO_API_KEY`
**Key Format**: `msy_<random-string>`
**Protocol**: HTTPS required (HTTP 301 redirects to HTTPS)
**Auth Method**: Bearer token in Authorization header

### Connectivity Verified

A read-only list-tasks call was made during research (2026-04-07) confirming:
- `MESHY_STUDIO_API_KEY` is valid and active
- Both `/openapi/v1/image-to-3d` and `/openapi/v2/text-to-3d` endpoints respond correctly
- Previous tasks (from Limburgers/Belgen generation) are visible in the task history

---

## 2. Authentication & Setup

### Required Header

```
Authorization: Bearer ${MESHY_STUDIO_API_KEY}
Content-Type: application/json
```

### Loading the Key from .env

```bash
# Bash
MESHY_API_KEY=$(grep '^MESHY_STUDIO_API_KEY=' /Users/richardtheuws/Documents/games/.env | cut -d= -f2)

# Python
with open("/Users/richardtheuws/Documents/games/.env") as f:
    for line in f:
        if line.startswith("MESHY_STUDIO_API_KEY="):
            API_KEY = line.strip().split("=", 1)[1]
```

### Quick Connectivity Test (read-only, no credits spent)

```bash
curl -s "https://api.meshy.ai/openapi/v1/image-to-3d?page_num=1&page_size=1" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" | python3 -m json.tool | head -10
```

---

## 3. Endpoint Reference

### 3a. Image-to-3D (Primary -- for models with concept art)

**Endpoint**: `POST https://api.meshy.ai/openapi/v1/image-to-3d`
**Cost**: 20 credits (Meshy-6 mesh) + 10 credits (texture) = 30 credits total
**Processing time**: 3-5 minutes (async with polling)

#### Create Task

```bash
curl -X POST "https://api.meshy.ai/openapi/v1/image-to-3d" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://theuws.com/games/reign-of-brabant/assets/factions/concept-art/limburgers/mijnwerker.png",
    "ai_model": "meshy-6",
    "topology": "triangle",
    "target_polycount": 15000,
    "should_remesh": false,
    "should_texture": true,
    "enable_pbr": true,
    "image_enhancement": true,
    "remove_lighting": true,
    "target_formats": ["glb"],
    "origin_at": "bottom"
  }'
```

**Response**: `{"result": "task-id-uuid"}`

#### Poll for Completion

```bash
curl -s "https://api.meshy.ai/openapi/v1/image-to-3d/${TASK_ID}" \
  -H "Authorization: Bearer ${MESHY_API_KEY}"
```

**Response fields**:
- `status`: PENDING | IN_PROGRESS | SUCCEEDED | FAILED | CANCELED
- `progress`: 0-100
- `model_urls.glb`: Download URL for GLB file
- `thumbnail_url`: Preview image
- `task_error`: Error details if FAILED

#### Parameters Reference

| Parameter | Type | Default | Recommended | Notes |
|-----------|------|---------|-------------|-------|
| `image_url` | string | (required) | URL or base64 data URI | JPG/PNG, publicly accessible |
| `ai_model` | string | `latest` | `meshy-6` | Always use v6 for production |
| `topology` | string | `triangle` | `triangle` | Triangle for web/game use |
| `target_polycount` | int | 30000 | 15000 | Range: 100-300,000 |
| `should_remesh` | bool | false (v6) | `false` | v6 default is already good |
| `should_texture` | bool | true | `true` | We need textures |
| `enable_pbr` | bool | false | `true` | Metallic/roughness/normal maps |
| `symmetry_mode` | string | `auto` | `auto` | Let AI decide |
| `image_enhancement` | bool | true | `true` | v6 only, improves input |
| `remove_lighting` | bool | true | `true` | Cleaner textures |
| `target_formats` | array | all | `["glb"]` | Only GLB needed, faster |
| `origin_at` | string | `bottom` | `bottom` | Ground-level origin |
| `auto_size` | bool | false | `false` | We handle sizing in-game |
| `pose_mode` | string | `""` | `""` | Empty for free pose |

### 3b. Text-to-3D (Secondary -- for models without concept art)

**Endpoint**: `POST https://api.meshy.ai/openapi/v2/text-to-3d`
**Two-stage process**: Preview (20 credits) then Refine (10 credits) = 30 credits total

#### Stage 1: Preview (generates untextured mesh)

```bash
curl -X POST "https://api.meshy.ai/openapi/v2/text-to-3d" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "preview",
    "prompt": "Medieval gold mine entrance with wooden support beams, golden glowing ore, mining cart, stylized game building",
    "ai_model": "meshy-6",
    "topology": "triangle",
    "target_polycount": 15000,
    "should_remesh": false,
    "symmetry_mode": "auto",
    "origin_at": "bottom",
    "target_formats": ["glb"]
  }'
```

#### Stage 2: Refine (adds textures)

```bash
curl -X POST "https://api.meshy.ai/openapi/v2/text-to-3d" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "refine",
    "preview_task_id": "${PREVIEW_TASK_ID}",
    "ai_model": "meshy-6",
    "enable_pbr": true,
    "remove_lighting": true,
    "target_formats": ["glb"]
  }'
```

**IMPORTANT**: `art_style` parameter is DEPRECATED for Meshy-6. Do not include it.

### 3c. Auto-Rigging (for humanoid unit models)

**Endpoint**: `POST https://api.meshy.ai/openapi/v1/rigging`
**Cost**: 5 credits

```bash
curl -X POST "https://api.meshy.ai/openapi/v1/rigging" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input_task_id": "${IMAGE_TO_3D_TASK_ID}",
    "height_meters": 1.7
  }'
```

**Or with a model URL**:

```bash
curl -X POST "https://api.meshy.ai/openapi/v1/rigging" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model_url": "https://assets.meshy.ai/.../model.glb",
    "height_meters": 1.7
  }'
```

**Limitations**:
- Only humanoid models with clear limb structure
- Max 300,000 faces (use Remesh API first if exceeded)
- Must be textured

### 3d. Animation (for rigged models)

**Endpoint**: `POST https://api.meshy.ai/openapi/v1/animations`
**Cost**: 3 credits

```bash
curl -X POST "https://api.meshy.ai/openapi/v1/animations" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "rig_task_id": "${RIG_TASK_ID}",
    "action_id": 1001
  }'
```

**Action IDs** (from Meshy animation library):
- `1001`: Walking
- Other IDs available in the Meshy animation library (check dashboard)

### 3e. Remesh (for polygon reduction)

**Endpoint**: `POST https://api.meshy.ai/openapi/v1/remesh`
**Cost**: 5 credits

```bash
curl -X POST "https://api.meshy.ai/openapi/v1/remesh" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input_task_id": "${TASK_ID}",
    "target_polycount": 15000,
    "topology": "triangle",
    "target_formats": ["glb"]
  }'
```

---

## 4. fal.ai Proxy vs Meshy Studio Direct -- Comparison

| Feature | fal.ai Proxy | Meshy Studio Direct |
|---------|-------------|---------------------|
| **Backend** | Same Meshy v6 | Same Meshy v6 |
| **Auth** | `FAL_AI_KEY` | `MESHY_STUDIO_API_KEY` |
| **Endpoint** | `fal.run/fal-ai/meshy/v6/...` | `api.meshy.ai/openapi/v1/...` |
| **Mode** | Synchronous only (blocks 2-5 min) | Async with polling (submit + poll) |
| **Queue limit** | ~10 concurrent | 20 concurrent (Studio tier) |
| **Priority** | Default | Higher than Pro tier |
| **Rate limit** | Unknown (fal.ai layer) | 20 RPS |
| **Rigging** | `enable_rigging` param in same call | Separate `/v1/rigging` endpoint |
| **Animation** | `enable_animation` param | Separate `/v1/animations` endpoint |
| **Remesh** | Not available | `/v1/remesh` endpoint |
| **Text-to-3D** | Single call (sync) | Two-stage (preview + refine) |
| **Image-to-3D** | Single call (sync) | Single call (async) |
| **Cost** | fal.ai credits (opaque) | Meshy credits (transparent) |
| **art_style** | Still accepts "realistic" | DEPRECATED for v6 |
| **Timeout risk** | High (sync 2-5 min) | Low (async polling) |
| **Parallel gen** | Limited by sync blocking | 20 concurrent tasks |
| **Error handling** | "Downstream unavailable" | Specific error codes |

### Recommendation

**Use Meshy Studio Direct** for all new model generation:

1. **Parallel generation**: Submit 20 models simultaneously, poll for completion -- massive time savings
2. **No timeout risk**: Async polling eliminates the "Downstream service unavailable" errors
3. **Separate rigging**: Can rig after reviewing the base model (vs fal.ai where rigging is all-or-nothing)
4. **Remesh access**: Can reduce polygon count of oversized models without regenerating
5. **Cost transparency**: Know exactly how many credits each operation uses
6. **Higher queue priority**: Studio tier gets processed faster than Pro tier

### When to still use fal.ai

- Quick one-off text-to-3D generation (single sync call vs two-stage)
- When you want rigging in the same API call (`enable_rigging` param)
- For non-Meshy fal.ai models (BiRefNet background removal, Flux image gen)

---

## 5. Current Model Inventory & Quality Assessment

### v02 Models (current production -- in `public/assets/models/v02/`)

| Faction | Model | Size | Quality | Source | Notes |
|---------|-------|------|---------|--------|-------|
| **Brabanders** | worker.glb | 3.5 MB | LOW | fal.ai v6 image-to-3d | Small file = low detail |
| | infantry.glb | 3.7 MB | LOW | fal.ai v6 image-to-3d | Needs regeneration |
| | ranged.glb | 3.1 MB | LOW | fal.ai v6 image-to-3d | Needs regeneration |
| | townhall.glb | 3.9 MB | LOW | fal.ai v6 image-to-3d | Needs regeneration |
| | barracks.glb | 4.2 MB | LOW | fal.ai v6 image-to-3d | Needs regeneration |
| **Randstad** | worker.glb | 3.2 MB | LOW | fal.ai v6 image-to-3d | Small file = low detail |
| | infantry.glb | 2.6 MB | LOW | fal.ai v6 image-to-3d | Needs regeneration |
| | ranged.glb | 3.2 MB | LOW | fal.ai v6 image-to-3d | Needs regeneration |
| | townhall.glb | 3.0 MB | LOW | fal.ai v6 image-to-3d | Needs regeneration |
| | barracks.glb | 2.8 MB | LOW | fal.ai v6 image-to-3d | Needs regeneration |
| **Limburgers** | worker.glb | 20.4 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| | infantry.glb | 16.2 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| | ranged.glb | 20.4 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| | townhall.glb | 34.4 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| | barracks.glb | 33.6 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| **Belgen** | worker.glb | 22.1 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| | infantry.glb | 19.7 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| | ranged.glb | 16.4 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| | townhall.glb | 50.0 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| | barracks.glb | 42.8 MB | HIGH | Meshy Studio image-to-3d | Recent generation |
| **Shared** | goldmine.glb | 3.6 MB | LOW | fal.ai v6 | Needs regeneration |
| | tree_pine.glb | 4.6 MB | LOW | fal.ai v6 | Needs regeneration |

### v03 Models (animated -- in `public/assets/models/v03/`)

| Faction | Units | Size range | Quality | Notes |
|---------|-------|------------|---------|-------|
| **Brabanders** | worker, infantry, ranged | 3.4-3.9 MB | LOW | Low-quality base models with rigging |
| **Randstad** | worker, infantry, ranged | 2.9-3.6 MB | LOW | Low-quality base models with rigging |
| **Limburgers** | worker, infantry, ranged | 20-27 MB | HIGH | High-quality, recently generated |
| **Belgen** | worker, infantry, ranged | 21-29 MB | HIGH | High-quality, recently generated |

### Key Insight

**Brabanders and Randstad models are 5-10x smaller than Limburgers and Belgen**, indicating they were generated with different settings or via fal.ai with lower quality output. These need to be regenerated using the Meshy Studio Direct API to match the quality level of the newer factions.

### Missing Models

The following building types currently reuse the `barracks.glb` model:
- `lumbercamp` (all 4 factions)
- `blacksmith` (all 4 factions)

These should eventually get their own dedicated models.

---

## 6. Recommended Parameters for RTS Models

### Unit Models (humanoid characters)

```json
{
  "ai_model": "meshy-6",
  "topology": "triangle",
  "target_polycount": 15000,
  "should_remesh": false,
  "should_texture": true,
  "enable_pbr": true,
  "image_enhancement": true,
  "remove_lighting": true,
  "target_formats": ["glb"],
  "origin_at": "bottom",
  "symmetry_mode": "auto"
}
```

**Why 15,000 polys**: RTS games render dozens to hundreds of units simultaneously. With instanced rendering, 15K polys provides good visual quality while keeping the total poly budget manageable. The Limburgers/Belgen models at default 30K polys result in 16-50MB files which are too heavy for web -- the 15K target should produce 8-25MB files with good detail.

**Post-generation**: Run through `/v1/rigging` with `height_meters: 1.7` for humanoid animation support.

### Building Models (static structures)

```json
{
  "ai_model": "meshy-6",
  "topology": "triangle",
  "target_polycount": 20000,
  "should_remesh": false,
  "should_texture": true,
  "enable_pbr": true,
  "image_enhancement": true,
  "remove_lighting": true,
  "target_formats": ["glb"],
  "origin_at": "bottom",
  "symmetry_mode": "auto"
}
```

**Why 20,000 polys**: Buildings are larger on screen and fewer in number than units. Higher poly count is acceptable for better architectural detail.

### Prop Models (trees, mines, decorations)

```json
{
  "ai_model": "meshy-6",
  "topology": "triangle",
  "target_polycount": 8000,
  "should_remesh": false,
  "should_texture": true,
  "enable_pbr": true,
  "remove_lighting": true,
  "target_formats": ["glb"],
  "origin_at": "bottom"
}
```

**Why 8,000 polys**: Props are repeated many times (trees, rocks) and should be as lightweight as possible.

---

## 7. Priority Generation List

### Priority 1: Regenerate Brabanders & Randstad (quality parity)

These models are 5-10x smaller than the Limburgers/Belgen equivalents and need regeneration to match quality. Concept art exists for all of these.

| # | Model | Type | Concept Art | Output Path |
|---|-------|------|-------------|-------------|
| 1 | Brabanders worker | unit | `assets/factions/brabanders-boer.png` | `v02/brabanders/worker.glb` |
| 2 | Brabanders infantry | unit | `assets/factions/brabanders-carnavalvierder.png` | `v02/brabanders/infantry.glb` |
| 3 | Brabanders ranged | unit | `assets/factions/brabanders-prins.png` | `v02/brabanders/ranged.glb` |
| 4 | Brabanders townhall | building | `assets/factions/brabanders-boerderij.png` | `v02/brabanders/townhall.glb` |
| 5 | Brabanders barracks | building | `assets/factions/brabanders-cafe.png` | `v02/brabanders/barracks.glb` |
| 6 | Randstad worker | unit | `assets/factions/randstad-stagiair.png` | `v02/randstad/worker.glb` |
| 7 | Randstad infantry | unit | `assets/factions/randstad-manager.png` | `v02/randstad/infantry.glb` |
| 8 | Randstad ranged | unit | `assets/factions/randstad-hipster.png` | `v02/randstad/ranged.glb` |
| 9 | Randstad townhall | building | `assets/factions/randstad-hoofdkantoor.png` | `v02/randstad/townhall.glb` |
| 10 | Randstad barracks | building | `assets/factions/randstad-hoofdkantoor.png` | `v02/randstad/barracks.glb` |

**Estimated credits**: 10 models x 30 credits = 300 credits
**Plus rigging for 6 units**: 6 x 5 credits = 30 credits
**Plus animations for 6 units**: 6 x 3 credits = 18 credits
**Total Priority 1**: ~348 credits

### Priority 2: Regenerate Shared Props

| # | Model | Type | Concept Art | Output Path |
|---|-------|------|-------------|-------------|
| 11 | Gold mine | prop | None (text-to-3D) | `v02/shared/goldmine.glb` |
| 12 | Pine tree | prop | None (text-to-3D) | `v02/shared/tree_pine.glb` |

**Estimated credits**: 2 x 30 credits = 60 credits
**Total Priority 2**: ~60 credits

### Priority 3: New Building Models (eliminate reuse)

These models currently don't exist -- barracks.glb is used as a placeholder.

| # | Model | Type | Concept Art Needed? | Output Path |
|---|-------|------|---------------------|-------------|
| 13-16 | Lumbercamp (all 4 factions) | building | Yes - generate concept art first | `v02/*/lumbercamp.glb` |
| 17-20 | Blacksmith (all 4 factions) | building | Yes - generate concept art first | `v02/*/blacksmith.glb` |

**Estimated credits**: 8 x 30 credits = 240 credits
**Total Priority 3**: ~240 credits

### Priority 4: Optimize Oversized Models

Limburgers and Belgen models (16-50MB) may benefit from remeshing to reduce file size for web deployment while maintaining visual quality.

| Models | Current Size | Target | Method |
|--------|-------------|--------|--------|
| Limburgers (5 models) | 16-36 MB | 8-18 MB | Remesh to 15K polys |
| Belgen (5 models) | 16-52 MB | 8-25 MB | Remesh to 15K polys |

**Estimated credits**: 10 x 5 credits = 50 credits
**Total Priority 4**: ~50 credits

### Grand Total Estimate

| Priority | Models | Credits | Description |
|----------|--------|---------|-------------|
| P1 | 10 + rigging + anim | ~348 | Brabanders & Randstad regeneration |
| P2 | 2 | ~60 | Shared props regeneration |
| P3 | 8 | ~240 | New lumbercamp & blacksmith models |
| P4 | 10 | ~50 | Remesh oversized models |
| **Total** | **30** | **~698** | Full generation run |

---

## 8. Image-to-3D Workflow with Concept Art

### Available Concept Art

```
assets/factions/
  brabanders-boer.png              # Worker
  brabanders-carnavalvierder.png   # Infantry
  brabanders-prins.png             # Ranged
  brabanders-boerderij.png         # Townhall
  brabanders-cafe.png              # Barracks
  randstad-stagiair.png            # Worker
  randstad-manager.png             # Infantry
  randstad-hipster.png             # Ranged
  randstad-hoofdkantoor.png        # Townhall (also used for barracks)
  concept-art/limburgers/
    mijnwerker.png                 # Worker
    schutterij.png                 # Infantry
    vlaaienwerper.png              # Ranged
    grottentempel.png              # Townhall
    heuvelfort.png                 # Barracks
  concept-art/belgen/
    frietkraamhouder.png           # Worker
    bierbouwer.png                 # Infantry
    chocolatier.png                # Ranged
    wafelpaleis.png                # Townhall
    frituurfort.png                # Barracks
```

### Workflow: Local Concept Art to 3D Model

**Option A: Upload to server first (recommended for batch)**

1. Deploy concept art to the game's public URL on theuws.com
2. Use the public URL in the `image_url` parameter

```bash
# The concept art is already deployed at:
# https://theuws.com/games/reign-of-brabant/assets/factions/

curl -X POST "https://api.meshy.ai/openapi/v1/image-to-3d" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://theuws.com/games/reign-of-brabant/assets/factions/brabanders-boer.png",
    "ai_model": "meshy-6",
    "target_polycount": 15000,
    "enable_pbr": true,
    "target_formats": ["glb"],
    "origin_at": "bottom"
  }'
```

**Option B: Base64 data URI (for local/unpublished art)**

```bash
# Convert local image to base64 data URI
IMAGE_PATH="assets/factions/brabanders-boer.png"
BASE64=$(base64 -i "$IMAGE_PATH")
DATA_URI="data:image/png;base64,${BASE64}"

# Write payload to temp file (base64 strings are too long for inline)
cat > /tmp/meshy_payload.json <<EOF
{
  "image_url": "${DATA_URI}",
  "ai_model": "meshy-6",
  "target_polycount": 15000,
  "enable_pbr": true,
  "target_formats": ["glb"],
  "origin_at": "bottom"
}
EOF

curl -X POST "https://api.meshy.ai/openapi/v1/image-to-3d" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @/tmp/meshy_payload.json
```

### Workflow: Generating New Concept Art

For models without existing concept art (lumbercamp, blacksmith), use the Flux image generation pipeline first:

```bash
# Generate concept art via fal.ai Flux
./scripts/generate-asset.sh --type sprite \
  --prompt "Medieval Brabant lumber camp, wooden sawmill with thatched roof, logs stacked, Dutch countryside style, isometric game building, warm earth tones" \
  --output assets/factions/concept-art/brabanders/

# Then use the generated image for Meshy image-to-3D
```

---

## 9. Shell Script Template

### `scripts/meshy_studio_generate.sh`

```bash
#!/bin/bash
# =============================================================================
# Reign of Brabant -- Meshy Studio Direct API Batch Generator
# =============================================================================
# Submits models to Meshy Studio API (async), polls for completion, downloads.
#
# Usage:
#   bash scripts/meshy_studio_generate.sh                    # Generate all P1 models
#   bash scripts/meshy_studio_generate.sh brab_worker        # Single model
#   bash scripts/meshy_studio_generate.sh --status           # Check existing tasks
#   bash scripts/meshy_studio_generate.sh --rig TASK_ID      # Rig a completed model
#
# Requires: curl, python3
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/public/assets/models/v02"
ENV_FILE="/Users/richardtheuws/Documents/games/.env"
LOG_FILE="$PROJECT_DIR/scripts/meshy_studio_generation.log"
TASKS_FILE="$PROJECT_DIR/scripts/meshy_studio_tasks.json"

API_BASE="https://api.meshy.ai/openapi"

# Load API key
MESHY_API_KEY=$(grep '^MESHY_STUDIO_API_KEY=' "$ENV_FILE" | cut -d= -f2)
if [ -z "${MESHY_API_KEY:-}" ]; then
    echo "ERROR: MESHY_STUDIO_API_KEY not found in $ENV_FILE"
    exit 1
fi

# Concept art base URL (publicly accessible after deploy)
CONCEPT_URL="https://theuws.com/games/reign-of-brabant/assets/factions"

# =============================================================================
# Model Definitions
# =============================================================================

declare -A MODEL_IMAGES
declare -A MODEL_OUTPUTS
declare -A MODEL_TYPES
declare -A MODEL_POLYCOUNTS

# Brabanders (image-to-3D with concept art)
MODEL_IMAGES[brab_worker]="$CONCEPT_URL/brabanders-boer.png"
MODEL_OUTPUTS[brab_worker]="$OUTPUT_DIR/brabanders/worker.glb"
MODEL_TYPES[brab_worker]="unit"
MODEL_POLYCOUNTS[brab_worker]=15000

MODEL_IMAGES[brab_infantry]="$CONCEPT_URL/brabanders-carnavalvierder.png"
MODEL_OUTPUTS[brab_infantry]="$OUTPUT_DIR/brabanders/infantry.glb"
MODEL_TYPES[brab_infantry]="unit"
MODEL_POLYCOUNTS[brab_infantry]=15000

MODEL_IMAGES[brab_ranged]="$CONCEPT_URL/brabanders-prins.png"
MODEL_OUTPUTS[brab_ranged]="$OUTPUT_DIR/brabanders/ranged.glb"
MODEL_TYPES[brab_ranged]="unit"
MODEL_POLYCOUNTS[brab_ranged]=15000

MODEL_IMAGES[brab_townhall]="$CONCEPT_URL/brabanders-boerderij.png"
MODEL_OUTPUTS[brab_townhall]="$OUTPUT_DIR/brabanders/townhall.glb"
MODEL_TYPES[brab_townhall]="building"
MODEL_POLYCOUNTS[brab_townhall]=20000

MODEL_IMAGES[brab_barracks]="$CONCEPT_URL/brabanders-cafe.png"
MODEL_OUTPUTS[brab_barracks]="$OUTPUT_DIR/brabanders/barracks.glb"
MODEL_TYPES[brab_barracks]="building"
MODEL_POLYCOUNTS[brab_barracks]=20000

# Randstad (image-to-3D with concept art)
MODEL_IMAGES[rand_worker]="$CONCEPT_URL/randstad-stagiair.png"
MODEL_OUTPUTS[rand_worker]="$OUTPUT_DIR/randstad/worker.glb"
MODEL_TYPES[rand_worker]="unit"
MODEL_POLYCOUNTS[rand_worker]=15000

MODEL_IMAGES[rand_infantry]="$CONCEPT_URL/randstad-manager.png"
MODEL_OUTPUTS[rand_infantry]="$OUTPUT_DIR/randstad/infantry.glb"
MODEL_TYPES[rand_infantry]="unit"
MODEL_POLYCOUNTS[rand_infantry]=15000

MODEL_IMAGES[rand_ranged]="$CONCEPT_URL/randstad-hipster.png"
MODEL_OUTPUTS[rand_ranged]="$OUTPUT_DIR/randstad/ranged.glb"
MODEL_TYPES[rand_ranged]="unit"
MODEL_POLYCOUNTS[rand_ranged]=15000

MODEL_IMAGES[rand_townhall]="$CONCEPT_URL/randstad-hoofdkantoor.png"
MODEL_OUTPUTS[rand_townhall]="$OUTPUT_DIR/randstad/townhall.glb"
MODEL_TYPES[rand_townhall]="building"
MODEL_POLYCOUNTS[rand_townhall]=20000

MODEL_IMAGES[rand_barracks]="$CONCEPT_URL/randstad-hoofdkantoor.png"
MODEL_OUTPUTS[rand_barracks]="$OUTPUT_DIR/randstad/barracks.glb"
MODEL_TYPES[rand_barracks]="building"
MODEL_POLYCOUNTS[rand_barracks]=20000

# =============================================================================
# Functions
# =============================================================================

submit_image_to_3d() {
    local name="$1"
    local image_url="${MODEL_IMAGES[$name]}"
    local polycount="${MODEL_POLYCOUNTS[$name]}"

    local response
    response=$(curl -s --max-time 30 \
        -X POST "$API_BASE/v1/image-to-3d" \
        -H "Authorization: Bearer $MESHY_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"image_url\": \"$image_url\",
            \"ai_model\": \"meshy-6\",
            \"topology\": \"triangle\",
            \"target_polycount\": $polycount,
            \"should_remesh\": false,
            \"should_texture\": true,
            \"enable_pbr\": true,
            \"image_enhancement\": true,
            \"remove_lighting\": true,
            \"target_formats\": [\"glb\"],
            \"origin_at\": \"bottom\"
        }" 2>&1)

    local task_id
    task_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',''))" 2>/dev/null || echo "")

    if [ -n "$task_id" ] && [ "$task_id" != "" ]; then
        echo "$task_id"
    else
        echo "ERROR: $response" >&2
        echo ""
    fi
}

check_status() {
    local task_id="$1"
    curl -s --max-time 15 \
        "$API_BASE/v1/image-to-3d/$task_id" \
        -H "Authorization: Bearer $MESHY_API_KEY"
}

download_glb() {
    local url="$1"
    local output_path="$2"

    mkdir -p "$(dirname "$output_path")"
    curl -s --max-time 120 -L -o "$output_path" "$url"
    stat -f%z "$output_path" 2>/dev/null || echo "0"
}

submit_rigging() {
    local task_id="$1"
    local height="${2:-1.7}"

    curl -s --max-time 30 \
        -X POST "$API_BASE/v1/rigging" \
        -H "Authorization: Bearer $MESHY_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"input_task_id\": \"$task_id\",
            \"height_meters\": $height
        }"
}

# =============================================================================
# Main Logic
# =============================================================================

FILTER="${1:-all}"

if [ "$FILTER" = "--status" ]; then
    # Show status of tracked tasks
    if [ -f "$TASKS_FILE" ]; then
        python3 -c "
import json
with open('$TASKS_FILE') as f:
    tasks = json.load(f)
for name, info in tasks.items():
    print(f'  {name:20s} {info[\"status\"]:15s} {info.get(\"task_id\",\"?\")[:20]}')
"
    else
        echo "No tasks file found at $TASKS_FILE"
    fi
    exit 0
fi

if [ "$FILTER" = "--rig" ]; then
    TASK_ID="${2:?Usage: $0 --rig TASK_ID [height_meters]}"
    HEIGHT="${3:-1.7}"
    echo "Submitting rigging for task $TASK_ID (height: ${HEIGHT}m)..."
    submit_rigging "$TASK_ID" "$HEIGHT"
    exit 0
fi

echo "=============================================="
echo " Meshy Studio Direct API -- Batch Generator"
echo "=============================================="
echo " API Key: ${MESHY_API_KEY:0:10}..."
echo " Output:  $OUTPUT_DIR"
echo ""

# Determine which models to generate
MODELS_TO_GENERATE=()
if [ "$FILTER" = "all" ]; then
    MODELS_TO_GENERATE=(brab_worker brab_infantry brab_ranged brab_townhall brab_barracks \
                        rand_worker rand_infantry rand_ranged rand_townhall rand_barracks)
else
    MODELS_TO_GENERATE=("$FILTER")
fi

echo " Models: ${#MODELS_TO_GENERATE[@]}"
echo ""

# Phase 1: Submit all tasks
echo "[1/3] Submitting tasks..."
declare -A TASK_IDS
SUBMITTED=0

for name in "${MODELS_TO_GENERATE[@]}"; do
    task_id=$(submit_image_to_3d "$name")
    if [ -n "$task_id" ]; then
        TASK_IDS[$name]="$task_id"
        echo "  OK  $name -> ${task_id:0:20}..."
        SUBMITTED=$((SUBMITTED + 1))
    else
        echo "  FAIL $name"
    fi
    sleep 1  # Small delay between submissions
done

echo ""
echo " Submitted: $SUBMITTED/${#MODELS_TO_GENERATE[@]}"

if [ $SUBMITTED -eq 0 ]; then
    echo "ERROR: No tasks submitted"
    exit 1
fi

# Phase 2: Poll for completion
echo ""
echo "[2/3] Polling for completion (max 10 min)..."

MAX_WAIT=600
POLL_INTERVAL=15
START_TIME=$(date +%s)

while true; do
    ELAPSED=$(( $(date +%s) - START_TIME ))
    if [ $ELAPSED -gt $MAX_WAIT ]; then
        echo "  TIMEOUT after ${MAX_WAIT}s"
        break
    fi

    ALL_DONE=true
    for name in "${!TASK_IDS[@]}"; do
        task_id="${TASK_IDS[$name]}"

        # Skip already completed
        if [ -f "${MODEL_OUTPUTS[$name]}" ] && [ "$(stat -f%z "${MODEL_OUTPUTS[$name]}" 2>/dev/null)" -gt 1000000 ]; then
            continue
        fi

        result=$(check_status "$task_id")
        status=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")
        progress=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('progress',0))" 2>/dev/null || echo "0")

        if [ "$status" = "SUCCEEDED" ]; then
            glb_url=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('model_urls',{}).get('glb',''))" 2>/dev/null || echo "")
            if [ -n "$glb_url" ] && [ "$glb_url" != "None" ]; then
                filesize=$(download_glb "$glb_url" "${MODEL_OUTPUTS[$name]}")
                echo "  DONE $name (${filesize} bytes, ${ELAPSED}s)"
                echo "OK|$name|$task_id|$filesize|$(date +%H:%M:%S)" >> "$LOG_FILE"
            fi
        elif [ "$status" = "FAILED" ]; then
            echo "  FAIL $name"
            echo "FAIL|$name|$task_id|$(date +%H:%M:%S)" >> "$LOG_FILE"
        else
            ALL_DONE=false
        fi
    done

    if $ALL_DONE; then
        break
    fi

    sleep $POLL_INTERVAL
done

# Phase 3: Summary
echo ""
echo "[3/3] Generation Complete"
echo "=============================================="
echo "Files:"
for name in "${MODELS_TO_GENERATE[@]}"; do
    output="${MODEL_OUTPUTS[$name]}"
    if [ -f "$output" ]; then
        size=$(stat -f%z "$output" 2>/dev/null || echo "?")
        echo "  $name: $(echo "scale=1; $size/1048576" | bc)MB"
    else
        echo "  $name: MISSING"
    fi
done
echo ""
echo "Log: $LOG_FILE"
echo ""
echo "Next steps:"
echo "  1. Review models visually in the game"
echo "  2. Run rigging: $0 --rig <TASK_ID>"
echo "  3. Copy rigged models to v03/ for animation support"
```

---

## 10. Cost Estimation

### Credits per Operation (Meshy v6)

| Operation | Credits | Notes |
|-----------|---------|-------|
| Image-to-3D mesh (Meshy-6) | 20 | Generates geometry |
| Image-to-3D texture | 10 | Applied when `should_texture: true` |
| Text-to-3D preview (Meshy-6) | 20 | Untextured mesh |
| Text-to-3D refine | 10 | Adds textures |
| Remesh | 5 | Polygon reduction |
| Auto-Rigging | 5 | Humanoid skeleton |
| Animation | 3 | Per animation clip |

### Full Generation Run Estimate

| Phase | Items | Credits Each | Subtotal |
|-------|-------|-------------|----------|
| P1: Brabanders+Randstad (image-to-3D) | 10 models | 30 | 300 |
| P1: Rig unit models | 6 units | 5 | 30 |
| P1: Animate rigged units | 6 units x 2 anims | 3 | 36 |
| P2: Shared props (text-to-3D) | 2 models | 30 | 60 |
| P3: New buildings (image-to-3D) | 8 models | 30 | 240 |
| P4: Remesh oversized models | 10 models | 5 | 50 |
| **Grand Total** | | | **~716** |

### Meshy Studio Pricing Reference

| Plan | Monthly Credits | Price |
|------|----------------|-------|
| Pro | 1,000 | $20/mo |
| Studio | 5,000 | $60/mo |
| Enterprise | Custom | Custom |

The full generation run (~716 credits) fits within a single Studio month allocation.

---

## 11. Post-Generation Pipeline

### Step 1: Generate base models

```bash
bash scripts/meshy_studio_generate.sh
```

### Step 2: Review models in-game

Build and run the game locally to verify model quality before proceeding.

### Step 3: Rig humanoid units

For each successful unit model, submit rigging:

```bash
bash scripts/meshy_studio_generate.sh --rig <TASK_ID>
```

### Step 4: Download rigged models to v03/

Rigged and animated GLB files should be saved to `public/assets/models/v03/<faction>/`.

### Step 5: Remesh oversized models (if needed)

If Limburgers/Belgen models cause performance issues:

```bash
curl -X POST "https://api.meshy.ai/openapi/v1/remesh" \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input_task_id": "<ORIGINAL_TASK_ID>",
    "target_polycount": 15000,
    "topology": "triangle",
    "target_formats": ["glb"]
  }'
```

### Step 6: Deploy

```bash
bash deploy-ftp.sh reign-of-brabant
```

### Step 7: Purge Cloudflare cache

Always purge cache after deploying new model files.

---

## Rate Limits to Be Aware Of

| Limit | Studio Tier |
|-------|------------|
| Requests per second | 20 |
| Concurrent queue tasks | 20 |
| Shared across all API keys | Yes |

**Best practice**: Submit all models (up to 20) simultaneously, then poll. The 1-second delay between submissions in the batch script is a safety margin, not a hard requirement.

---

## API Deprecation Notes (as of April 2026)

- `art_style` parameter is **deprecated** for Meshy-6 -- do not include it
- `negative_prompt` is maintained for backward compatibility only
- `texture_richness` is maintained for backward compatibility only
- `is_a_t_pose` replaced by `pose_mode`
- Meshy-4 AI model has been **retired** -- use `meshy-6` or `latest`
- `should_remesh` defaults to `false` for Meshy-6 (was `true` for older models)
