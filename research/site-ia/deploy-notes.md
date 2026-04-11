## Deploy notes (root hosting)

Goal: host the site at the root of `reign-of-brabant.nl` with:
- `/` landing page (Vite build entry)
- `/play/` game (Vite multi-page entry)
- static pages from `public/` (e.g. `/doneer`, `/press`, `/roadmap`)

### Vite config
Changes applied:
- `base` set to `/` for production (root hosting).
- multi-page inputs configured:
  - `index.html` → landing
  - `play/index.html` → game

File: `vite.config.ts`

### URL mapping (current)
- `/` → `index.html` (landing)
- `/play/` → `play/index.html` (game)
- `/het-verhaal/` → `public/het-verhaal/index.html` (static)
- `/doneer` → `public/doneer/index.html` (static)
- `/thanks` → `public/thanks/index.html` (static)
- `/roadmap` → `public/roadmap/index.html` (static)
- `/press` → `public/press/index.html` (static)
- `/community` → `public/community/index.html` (static)

### Hosting / web server notes
- Ensure your server serves the **built `dist/`** directory as the web root.
- The contents of `public/` are copied into `dist/` at build time by Vite.

### Test checklist (local)
Run:
- `npm run build`
- `npm run preview`

Verify in browser:
- `/` loads and links work.
- `/play/` loads the game and shows menu + HUD (no missing-element console errors).
- `/het-verhaal/`, `/doneer`, `/press`, `/roadmap` load without 404.
- asset paths work from `/play/` (logo, audio/models load as expected).

