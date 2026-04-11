## Milestone ladder (draft, donation-funded)

Goal: tie donations to *concrete* improvements with scope-safety.

### €1k — “Polish & stability”
- **Deliverables**
  - Performance pass: stable frame time target on mid-range laptop
  - UX pass: clearer onboarding (how-to-play, tooltips, defaults)
  - Basic bugfix backlog burn-down (top 10 issues)
- **Non-goals**
  - Multiplayer
  - New faction
- **Acceptance**
  - No critical console errors during a 15-minute skirmish
  - Loading screen completes reliably; assets load without 404s
- **Risks**
  - Performance improvements can regress visuals

### €5k — “Skirmish foundation”
- **Deliverables**
  - AI basics: clearer attack/move behavior, fewer stuck units
  - Input: hotkeys baseline and selectable control scheme
  - UI: command panel consistency (unit/building/hero)
- **Non-goals**
  - Campaign
- **Acceptance**
  - Units reach targets without frequent cancel/retry
  - 1 skirmish can be played start-to-finish without “softlocks”
- **Risks**
  - AI tuning can become endless; hard timebox per sub-feature

### €10k — “Combat depth + perf targets”
- **Deliverables**
  - Combat readability improvements (VFX/audio feedback, selection clarity)
  - Pathfinding robustness pass (navmesh generation & fallback behavior)
  - Performance targets documented + measured (baseline scene)
- **Non-goals**
  - Full content expansion
- **Acceptance**
  - Fallback movement still feels playable if WASM fails
  - Profiling notes captured for future optimizations

### €25k — “Content pipeline & tooling”
- **Deliverables**
  - Asset pipeline reliability (models/animations/voices)
  - Tooling scripts to validate assets (size, naming, missing files)
  - New map templates + variation
- **Non-goals**
  - Multiplayer “shipping feature” (only prototype gate)
- **Acceptance**
  - Adding a new unit/model follows a repeatable checklist

### €50k — “Campaign slice”
- **Deliverables**
  - 1 short campaign slice (tutorial + 1 mission)
  - Narrative UI polish + save/continue basics (if applicable)
- **Non-goals**
  - Full campaign
- **Acceptance**
  - Players can complete the slice without external instructions

