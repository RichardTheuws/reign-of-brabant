## Improvement backlog (hotspots → impact/effort → rung)

### Rendering / animation (`src/rendering/UnitRenderer.ts`)
- **Animated mixer count**: Add distance-based animation culling / frame-skip for far units.
  - **Impact**: smoother late-game
  - **Effort**: medium
  - **Rung**: €10k
- **Instancing limits** (`MAX_INSTANCES_PER_BUCKET = 128`): raise cap or shard buckets by chunk.
  - **Impact**: larger armies possible
  - **Effort**: medium/high
  - **Rung**: €10k–€25k

### Pathfinding robustness (`src/pathfinding/NavMeshManager.ts`)
- **TileCache obstacles**: switch maps/buildings to use `initWithTileCache` + obstacles update.
  - **Impact**: fewer stuck units around buildings
  - **Effort**: high
  - **Rung**: €10k–€25k
- **Fallback parity**: improve direct-movement fallback (avoid clumping; basic steering).
  - **Impact**: playable even when WASM fails
  - **Effort**: medium
  - **Rung**: €10k

### Audio consistency (`src/audio/AudioManager.ts`)
- **Volume defaults + settings**: ensure UI sliders persist (localStorage) + apply on init.
  - **Impact**: better UX
  - **Effort**: low/medium
  - **Rung**: €1k
- **Music routing**: make track IDs explicit (avoid implicit `${id}.mp3` surprises).
  - **Impact**: fewer missing-audio issues in production
  - **Effort**: low
  - **Rung**: €1k

### Asset pipeline (`docs/ANIMATION-PIPELINE.md` + scripts)
- **Validation script**: detect missing clips (Idle/Walk/Attack/Death), mismatched naming, file size spikes.
  - **Impact**: fewer broken releases
  - **Effort**: medium
  - **Rung**: €25k

