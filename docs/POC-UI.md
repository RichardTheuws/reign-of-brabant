# Reign of Brabant -- PoC HUD: Complete UI Specificatie

**Versie**: 0.1.0
**Datum**: 2026-04-05
**Status**: Implementatieklaar
**Parent**: `SUB-PRD-UI-UX.md` v1.0.0

---

## Inhoudsopgave

1. [Overzicht](#1-overzicht)
2. [CSS Variabelen & Theming](#2-css-variabelen--theming)
3. [Complete HTML Structuur](#3-complete-html-structuur)
4. [Complete CSS](#4-complete-css)
5. [TypeScript Interfaces](#5-typescript-interfaces)
6. [Interactie Beschrijvingen](#6-interactie-beschrijvingen)
7. [Implementatie Notities](#7-implementatie-notities)

---

## 1. Overzicht

De PoC HUD is een HTML/CSS overlay die bovenop de Three.js canvas wordt gerenderd. Alle transparante gebieden laten klikken door naar de game world (`pointer-events: none` op de container, `pointer-events: auto` op interactieve elementen).

### Layering (uit SUB-PRD-UI-UX.md)

```
Laag 0: Three.js canvas (z-index: 0)
Laag 1: HUD container (z-index: 10, pointer-events: none)
Laag 2: Interactieve panels (z-index: 20, pointer-events: auto)
Laag 3: Toasts/Alerts (z-index: 30)
Laag 4: Game Over overlay (z-index: 100)
```

### Componenten

| # | Component | Positie | Zichtbaar |
|---|-----------|---------|-----------|
| 1 | Resource Bar | Top-left | Altijd |
| 2 | Minimap | Bottom-left | Altijd |
| 3 | Unit Panel | Bottom-center | Bij selectie |
| 4 | Command Panel | Bottom-right (in unit panel) | Bij selectie |
| 5 | Alerts | Top-center | Tijdelijk |
| 6 | Game Over | Volledig scherm | Einde spel |
| 7 | FPS Counter | Top-left | Dev mode |

---

## 2. CSS Variabelen & Theming

```css
:root {
  /* === Basis kleuren (uit SUB-PRD) === */
  --color-parchment-gold: #D4A853;
  --color-brabant-red: #8B1A1A;
  --color-dark-brown: #3C1F0E;
  --color-cream: #F5E6C8;
  --color-randstad-grey: #4A4A5A;

  /* === Factie kleuren === */
  --faction-brabant: #E07020;
  --faction-randstad: #5A6A7A;
  --faction-limburg: #2D6B3F;
  --faction-belgen: #C42020;

  /* === HUD kleuren === */
  --hud-bg: rgba(20, 12, 8, 0.85);
  --hud-bg-solid: #140C08;
  --hud-border: rgba(212, 168, 83, 0.4);
  --hud-border-hover: rgba(212, 168, 83, 0.8);
  --hud-text: #F5E6C8;
  --hud-text-dim: rgba(245, 230, 200, 0.5);
  --hud-text-bright: #FFFFFF;

  /* === Functie kleuren === */
  --color-hp-high: #4CAF50;
  --color-hp-mid: #FFC107;
  --color-hp-low: #F44336;
  --color-gold-icon: #FFD700;
  --color-alert-warning: #FF6B35;
  --color-alert-info: #4A90D9;
  --color-alert-error: #E53935;
  --color-victory: #FFD700;
  --color-defeat: #8B1A1A;

  /* === Afmetingen === */
  --hud-padding: 12px;
  --hud-gap: 8px;
  --hud-radius: 6px;
  --hud-radius-lg: 10px;
  --minimap-size: 200px;
  --panel-height: 160px;
  --portrait-size: 64px;
  --portrait-sm: 36px;
  --btn-size: 48px;

  /* === Typografie (system fonts voor PoC) === */
  --font-heading: 'Georgia', 'Times New Roman', serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'Menlo', 'Consolas', monospace;

  /* === Animatie === */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}
```

### Factie Thema Switching

Wanneer een factie actief is, worden de accent-kleuren overschreven via een data-attribuut op `<body>` of de HUD-container:

```css
[data-faction="brabant"] {
  --faction-accent: var(--faction-brabant);
  --faction-accent-glow: rgba(224, 112, 32, 0.3);
}

[data-faction="randstad"] {
  --faction-accent: var(--faction-randstad);
  --faction-accent-glow: rgba(90, 106, 122, 0.3);
}

[data-faction="limburg"] {
  --faction-accent: var(--faction-limburg);
  --faction-accent-glow: rgba(45, 107, 63, 0.3);
}

[data-faction="belgen"] {
  --faction-accent: var(--faction-belgen);
  --faction-accent-glow: rgba(196, 32, 32, 0.3);
}
```

---

## 3. Complete HTML Structuur

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reign of Brabant</title>
  <link rel="stylesheet" href="hud.css">
</head>
<body data-faction="brabant">

  <!-- ============================================ -->
  <!-- Three.js Canvas (game engine mount point)    -->
  <!-- ============================================ -->
  <canvas id="game-canvas"></canvas>

  <!-- ============================================ -->
  <!-- HUD OVERLAY CONTAINER                        -->
  <!-- pointer-events: none zodat klikken door de   -->
  <!-- transparante gebieden naar de canvas gaan    -->
  <!-- ============================================ -->
  <div id="hud" class="hud-overlay">

    <!-- ======================================== -->
    <!-- 1. RESOURCE BAR (top-left)               -->
    <!-- ======================================== -->
    <div id="resource-bar" class="hud-panel resource-bar">
      <div class="resource-item" data-resource="gold">
        <span class="resource-icon" aria-label="Goud">&#9935;</span>
        <span class="resource-value" id="res-gold">0</span>
      </div>
      <div class="resource-divider"></div>
      <div class="resource-item" data-resource="population">
        <span class="resource-icon" aria-label="Populatie">&#128100;</span>
        <span class="resource-value">
          <span id="res-pop">0</span>/<span id="res-pop-max">20</span>
        </span>
      </div>
    </div>

    <!-- ======================================== -->
    <!-- 7. FPS COUNTER (top-left, onder resources) -->
    <!-- ======================================== -->
    <div id="fps-counter" class="fps-counter" aria-hidden="true">
      <span id="fps-value">60</span> FPS
    </div>

    <!-- ======================================== -->
    <!-- 5. ALERTS (top-center)                   -->
    <!-- ======================================== -->
    <div id="alert-container" class="alert-container" aria-live="polite">
      <!-- Alerts worden dynamisch toegevoegd -->
      <!-- Template:
      <div class="alert alert--warning" role="alert">
        <span class="alert__icon">&#9888;</span>
        <span class="alert__message">Under attack!</span>
      </div>
      -->
    </div>

    <!-- ======================================== -->
    <!-- 2. MINIMAP (bottom-left)                 -->
    <!-- ======================================== -->
    <div id="minimap-container" class="hud-panel minimap-container">
      <canvas
        id="minimap-canvas"
        class="minimap-canvas"
        width="200"
        height="200"
        aria-label="Minimap: klik om camera te verplaatsen"
        role="img"
        tabindex="0"
      ></canvas>
      <div class="minimap-border"></div>
    </div>

    <!-- ======================================== -->
    <!-- 3 & 4. UNIT PANEL + COMMAND PANEL        -->
    <!-- (bottom-center + bottom-right)           -->
    <!-- ======================================== -->
    <div id="selection-panel" class="hud-panel selection-panel" hidden>

      <!-- 3a. SINGLE UNIT VIEW -->
      <div id="unit-single" class="unit-single" hidden>
        <div class="unit-portrait-wrapper">
          <div class="unit-portrait" id="unit-portrait">
            <span class="portrait-placeholder">?</span>
          </div>
          <div class="unit-level" id="unit-level">1</div>
        </div>

        <div class="unit-info">
          <div class="unit-name" id="unit-name">--</div>
          <div class="unit-hp-bar-container">
            <div class="unit-hp-bar" id="unit-hp-bar" style="width: 100%"></div>
            <span class="unit-hp-text" id="unit-hp-text">-- / --</span>
          </div>
          <div class="unit-stats">
            <div class="stat" title="Aanvalskracht">
              <span class="stat-label">ATK</span>
              <span class="stat-value" id="stat-atk">0</span>
            </div>
            <div class="stat" title="Bepantsering">
              <span class="stat-label">ARM</span>
              <span class="stat-value" id="stat-arm">0</span>
            </div>
            <div class="stat" title="Snelheid">
              <span class="stat-label">SPD</span>
              <span class="stat-value" id="stat-spd">0</span>
            </div>
          </div>
          <div class="unit-status" id="unit-status">Idle</div>
        </div>

        <!-- 4a. COMMAND PANEL: Unit commands -->
        <div class="command-panel" id="cmd-unit">
          <button class="cmd-btn" data-action="move" data-hotkey="Q" title="Verplaatsen (Q)">
            <span class="cmd-hotkey">Q</span>
            <span class="cmd-icon">&#10132;</span>
            <span class="cmd-label">Move</span>
          </button>
          <button class="cmd-btn" data-action="attack" data-hotkey="W" title="Aanvallen (W)">
            <span class="cmd-hotkey">W</span>
            <span class="cmd-icon">&#9876;</span>
            <span class="cmd-label">Attack</span>
          </button>
          <button class="cmd-btn" data-action="stop" data-hotkey="E" title="Stoppen (E)">
            <span class="cmd-hotkey">E</span>
            <span class="cmd-icon">&#9632;</span>
            <span class="cmd-label">Stop</span>
          </button>
          <button class="cmd-btn" data-action="hold" data-hotkey="R" title="Positie houden (R)">
            <span class="cmd-hotkey">R</span>
            <span class="cmd-icon">&#9899;</span>
            <span class="cmd-label">Hold</span>
          </button>
        </div>
      </div>

      <!-- 3b. MULTI UNIT VIEW -->
      <div id="unit-multi" class="unit-multi" hidden>
        <div class="multi-header">
          <span id="multi-count">0</span> eenheden geselecteerd
        </div>
        <div class="multi-grid" id="multi-grid">
          <!-- Dynamisch gevuld met portrait thumbnails -->
          <!-- Template:
          <div class="multi-portrait" data-unit-id="123">
            <span class="portrait-placeholder portrait-placeholder--sm">?</span>
            <div class="multi-hp-bar" style="width: 80%"></div>
          </div>
          -->
        </div>

        <!-- 4a repeated: zelfde command buttons voor multi-select -->
        <div class="command-panel" id="cmd-multi">
          <button class="cmd-btn" data-action="move" data-hotkey="Q" title="Verplaatsen (Q)">
            <span class="cmd-hotkey">Q</span>
            <span class="cmd-icon">&#10132;</span>
            <span class="cmd-label">Move</span>
          </button>
          <button class="cmd-btn" data-action="attack" data-hotkey="W" title="Aanvallen (W)">
            <span class="cmd-hotkey">W</span>
            <span class="cmd-icon">&#9876;</span>
            <span class="cmd-label">Attack</span>
          </button>
          <button class="cmd-btn" data-action="stop" data-hotkey="E" title="Stoppen (E)">
            <span class="cmd-hotkey">E</span>
            <span class="cmd-icon">&#9632;</span>
            <span class="cmd-label">Stop</span>
          </button>
          <button class="cmd-btn" data-action="hold" data-hotkey="R" title="Positie houden (R)">
            <span class="cmd-hotkey">R</span>
            <span class="cmd-icon">&#9899;</span>
            <span class="cmd-label">Hold</span>
          </button>
        </div>
      </div>

      <!-- 3c. BUILDING VIEW -->
      <div id="building-panel" class="building-panel" hidden>
        <div class="unit-portrait-wrapper">
          <div class="unit-portrait building-portrait" id="building-portrait">
            <span class="portrait-placeholder">&#127984;</span>
          </div>
        </div>

        <div class="unit-info">
          <div class="unit-name" id="building-name">--</div>
          <div class="unit-hp-bar-container">
            <div class="unit-hp-bar" id="building-hp-bar" style="width: 100%"></div>
            <span class="unit-hp-text" id="building-hp-text">-- / --</span>
          </div>
          <div class="building-queue" id="building-queue">
            <!-- Productie queue -->
            <div class="queue-progress" hidden>
              <span class="queue-label" id="queue-label">--</span>
              <div class="queue-bar-container">
                <div class="queue-bar" id="queue-bar" style="width: 0%"></div>
              </div>
              <span class="queue-time" id="queue-time">0s</span>
            </div>
          </div>
        </div>

        <!-- 4b. COMMAND PANEL: Building (productie) -->
        <div class="command-panel" id="cmd-building">
          <!-- Barracks voorbeeld -->
          <button class="cmd-btn cmd-btn--build" data-action="train-worker" data-hotkey="Q"
                  title="Train Worker (Q)">
            <span class="cmd-hotkey">Q</span>
            <span class="cmd-icon">&#128119;</span>
            <span class="cmd-label">Worker</span>
          </button>
          <button class="cmd-btn cmd-btn--build" data-action="train-infantry" data-hotkey="W"
                  title="Train Infantry (W)">
            <span class="cmd-hotkey">W</span>
            <span class="cmd-icon">&#9876;</span>
            <span class="cmd-label">Infantry</span>
          </button>
          <button class="cmd-btn cmd-btn--build" data-action="train-ranged" data-hotkey="E"
                  title="Train Ranged (E)">
            <span class="cmd-hotkey">E</span>
            <span class="cmd-icon">&#127993;</span>
            <span class="cmd-label">Ranged</span>
          </button>
          <button class="cmd-btn cmd-btn--build" data-action="rally-point" data-hotkey="R"
                  title="Rally Point (R)">
            <span class="cmd-hotkey">R</span>
            <span class="cmd-icon">&#9873;</span>
            <span class="cmd-label">Rally</span>
          </button>
        </div>

        <!-- 4c. COMMAND PANEL: Worker (gebouwen) -->
        <div class="command-panel" id="cmd-worker" hidden>
          <button class="cmd-btn cmd-btn--build" data-action="build-townhall" data-hotkey="Q"
                  title="Build Town Hall (Q)">
            <span class="cmd-hotkey">Q</span>
            <span class="cmd-icon">&#127984;</span>
            <span class="cmd-label">Town Hall</span>
          </button>
          <button class="cmd-btn cmd-btn--build" data-action="build-barracks" data-hotkey="W"
                  title="Build Barracks (W)">
            <span class="cmd-hotkey">W</span>
            <span class="cmd-icon">&#9961;</span>
            <span class="cmd-label">Barracks</span>
          </button>
        </div>
      </div>

    </div><!-- /selection-panel -->

    <!-- ======================================== -->
    <!-- 6. GAME OVER OVERLAY                     -->
    <!-- ======================================== -->
    <div id="game-over" class="game-over-overlay" hidden>
      <div class="game-over-content">
        <h1 class="game-over-title" id="game-over-title">OVERWINNING!</h1>
        <p class="game-over-subtitle" id="game-over-subtitle">Brabant is veilig!</p>

        <div class="game-over-stats">
          <div class="stat-row">
            <span class="stat-row__label">Speeltijd</span>
            <span class="stat-row__value" id="stat-duration">--:--</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Eenheden getraind</span>
            <span class="stat-row__value" id="stat-produced">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Eenheden verloren</span>
            <span class="stat-row__value" id="stat-lost">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Vijanden verslagen</span>
            <span class="stat-row__value" id="stat-killed">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Gebouwen gebouwd</span>
            <span class="stat-row__value" id="stat-buildings">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Resources verzameld</span>
            <span class="stat-row__value" id="stat-resources">0</span>
          </div>
        </div>

        <div class="game-over-actions">
          <button class="btn btn--primary" id="btn-retry">
            Opnieuw Spelen
          </button>
          <button class="btn btn--secondary" id="btn-menu">
            Hoofdmenu
          </button>
        </div>
      </div>
    </div>

  </div><!-- /hud -->

  <script type="module" src="hud.ts"></script>
</body>
</html>
```

---

## 4. Complete CSS

```css
/* ================================================
   REIGN OF BRABANT -- PoC HUD Stylesheet
   ================================================
   Overlay op Three.js canvas.
   Alle transparante gebieden zijn doorklikbaar.
   ================================================ */

/* --- Reset & Base --------------------------------------- */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
  background: #000;
  font-family: var(--font-body);
  color: var(--hud-text);
  -webkit-font-smoothing: antialiased;
}

/* --- Game Canvas ---------------------------------------- */

#game-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* --- HUD Overlay Container ------------------------------ */

.hud-overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;

  /* CSS Grid voor positionering van alle HUD elementen */
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "resources  alerts     ."
    ".          .          ."
    "minimap    panel      panel";
  gap: 0;
  padding: var(--hud-padding);
}

/* --- Shared Panel Style --------------------------------- */

.hud-panel {
  pointer-events: auto;
  background: var(--hud-bg);
  border: 1px solid var(--hud-border);
  border-radius: var(--hud-radius);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* --- 1. RESOURCE BAR ------------------------------------ */

.resource-bar {
  grid-area: resources;
  align-self: start;
  justify-self: start;

  display: flex;
  align-items: center;
  gap: var(--hud-gap);
  padding: 8px 16px;
  min-height: 44px;

  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  user-select: none;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.resource-icon {
  font-size: 18px;
  line-height: 1;
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.3));
}

.resource-value {
  color: var(--hud-text-bright);
  min-width: 36px;
}

.resource-divider {
  width: 1px;
  height: 20px;
  background: var(--hud-border);
  margin: 0 4px;
}

/* Population warning state */
.resource-item[data-resource="population"].is-capped .resource-value {
  color: var(--color-hp-low);
  animation: pulse-red 1s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* --- 7. FPS COUNTER ------------------------------------- */

.fps-counter {
  position: fixed;
  top: calc(var(--hud-padding) + 52px);
  left: var(--hud-padding);
  z-index: 10;
  pointer-events: none;

  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--hud-text-dim);
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 6px;
  border-radius: 3px;
  user-select: none;
}

.fps-counter[hidden] {
  display: none;
}

/* --- 5. ALERTS ------------------------------------------ */

.alert-container {
  grid-area: alerts;
  align-self: start;
  justify-self: center;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
  pointer-events: none;
  max-width: 400px;
}

.alert {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: var(--hud-radius);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  user-select: none;

  background: var(--hud-bg);
  border: 1px solid var(--hud-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  /* Slide-in animatie */
  animation: alert-in var(--transition-normal) ease forwards;
}

.alert.is-leaving {
  animation: alert-out 200ms ease forwards;
}

.alert--warning {
  border-color: var(--color-alert-warning);
  color: var(--color-alert-warning);
}

.alert--warning .alert__icon {
  color: var(--color-alert-warning);
}

.alert--info {
  border-color: var(--color-alert-info);
  color: var(--color-alert-info);
}

.alert--info .alert__icon {
  color: var(--color-alert-info);
}

.alert--error {
  border-color: var(--color-alert-error);
  color: var(--color-alert-error);
}

.alert--error .alert__icon {
  color: var(--color-alert-error);
}

.alert__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.alert__message {
  font-size: 13px;
}

@keyframes alert-in {
  from {
    opacity: 0;
    transform: translateY(-16px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes alert-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}

/* --- 2. MINIMAP ----------------------------------------- */

.minimap-container {
  grid-area: minimap;
  align-self: end;
  justify-self: start;

  position: relative;
  width: calc(var(--minimap-size) + 2px);
  height: calc(var(--minimap-size) + 2px);
  padding: 0;
  overflow: hidden;
}

.minimap-canvas {
  display: block;
  width: var(--minimap-size);
  height: var(--minimap-size);
  cursor: pointer;
  image-rendering: pixelated;
}

.minimap-border {
  position: absolute;
  inset: 0;
  border: 1px solid var(--hud-border);
  border-radius: var(--hud-radius);
  pointer-events: none;
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.5),
    0 0 12px rgba(0, 0, 0, 0.8);
}

.minimap-container:hover .minimap-border {
  border-color: var(--hud-border-hover);
}

/* --- 3. SELECTION PANEL (unit/building) ----------------- */

.selection-panel {
  grid-area: panel;
  align-self: end;
  justify-self: center;

  display: flex;
  align-items: stretch;
  gap: 0;
  min-width: 500px;
  max-width: 720px;
  width: 100%;
  min-height: var(--panel-height);

  /* Slide-up entree */
  animation: panel-in 200ms ease forwards;
}

.selection-panel[hidden] {
  display: none;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- 3a. Single Unit View ------------------------------- */

.unit-single,
.building-panel {
  display: flex;
  align-items: stretch;
  gap: 0;
  width: 100%;
}

.unit-single[hidden],
.unit-multi[hidden],
.building-panel[hidden] {
  display: none;
}

/* Portrait */

.unit-portrait-wrapper {
  position: relative;
  flex-shrink: 0;
  padding: 12px;
}

.unit-portrait {
  width: var(--portrait-size);
  height: var(--portrait-size);
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid var(--faction-accent, var(--color-parchment-gold));
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.unit-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait-placeholder {
  font-size: 28px;
  color: var(--hud-text-dim);
  user-select: none;
}

.portrait-placeholder--sm {
  font-size: 16px;
}

.building-portrait {
  border-color: var(--color-parchment-gold);
}

.unit-level {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--hud-bg-solid);
  border: 1px solid var(--color-parchment-gold);
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-parchment-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Unit Info */

.unit-info {
  flex: 1;
  min-width: 0;
  padding: 10px 12px 10px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.unit-name {
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 700;
  color: var(--hud-text-bright);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* HP Bar */

.unit-hp-bar-container {
  position: relative;
  width: 100%;
  height: 14px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.unit-hp-bar {
  height: 100%;
  background: var(--color-hp-high);
  border-radius: 3px;
  transition: width var(--transition-fast), background-color var(--transition-fast);
}

/* HP kleur op basis van percentage -- wordt via JS of CSS class gezet */
.unit-hp-bar.hp-high  { background: var(--color-hp-high); }
.unit-hp-bar.hp-mid   { background: var(--color-hp-mid); }
.unit-hp-bar.hp-low   { background: var(--color-hp-low); }

.unit-hp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--hud-text-bright);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

/* Stats */

.unit-stats {
  display: flex;
  gap: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--hud-text-dim);
  letter-spacing: 0.06em;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--hud-text-bright);
  font-variant-numeric: tabular-nums;
}

/* Unit Status */

.unit-status {
  font-size: 11px;
  color: var(--hud-text-dim);
  font-style: italic;
}

/* --- 4. COMMAND PANEL ----------------------------------- */

.command-panel {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
  padding: 10px;
  border-left: 1px solid var(--hud-border);
  align-self: center;
}

.command-panel[hidden] {
  display: none;
}

.cmd-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;

  width: var(--btn-size);
  height: var(--btn-size);
  padding: 4px;

  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--hud-border);
  border-radius: 4px;
  color: var(--hud-text);
  cursor: pointer;
  user-select: none;

  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.cmd-btn:hover {
  background: rgba(212, 168, 83, 0.15);
  border-color: var(--hud-border-hover);
  transform: scale(1.05);
}

.cmd-btn:active {
  transform: scale(0.95);
  background: rgba(212, 168, 83, 0.25);
}

.cmd-btn:focus-visible {
  outline: 2px solid var(--color-parchment-gold);
  outline-offset: 2px;
}

.cmd-btn[disabled] {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.cmd-btn[disabled]:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--hud-border);
  transform: none;
}

.cmd-hotkey {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 9px;
  font-weight: 700;
  color: var(--color-parchment-gold);
  font-family: var(--font-mono);
  line-height: 1;
}

.cmd-icon {
  font-size: 18px;
  line-height: 1;
}

.cmd-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--hud-text-dim);
  line-height: 1;
}

/* Build variant (iets grotere iconen) */
.cmd-btn--build .cmd-icon {
  font-size: 20px;
}

/* --- 3b. Multi Unit View -------------------------------- */

.unit-multi {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.multi-header {
  padding: 8px 12px 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--hud-text);
}

.multi-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 12px 8px;
  max-height: 88px;
  overflow-y: auto;
  flex: 1;

  /* Dunne scrollbar */
  scrollbar-width: thin;
  scrollbar-color: var(--hud-border) transparent;
}

.multi-grid::-webkit-scrollbar {
  width: 4px;
}

.multi-grid::-webkit-scrollbar-thumb {
  background: var(--hud-border);
  border-radius: 2px;
}

.multi-portrait {
  position: relative;
  width: var(--portrait-sm);
  height: var(--portrait-sm);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--hud-border);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.multi-portrait:hover {
  border-color: var(--hud-border-hover);
}

.multi-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.multi-hp-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--color-hp-high);
  border-radius: 0 0 2px 2px;
  transition: width var(--transition-fast);
}

/* Multi-select: command panel naast de grid */
.unit-multi .command-panel {
  border-top: 1px solid var(--hud-border);
  border-left: none;
  justify-self: end;
  align-self: end;
  margin-left: auto;

  /* Horizontaal layout voor multi */
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 1fr;
  padding: 6px 12px 8px;
}

/* --- 3c. Building View (queue) -------------------------- */

.building-queue {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.queue-progress[hidden] {
  display: none;
}

.queue-label {
  flex-shrink: 0;
  color: var(--hud-text);
  font-weight: 500;
  min-width: 60px;
}

.queue-bar-container {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.queue-bar {
  height: 100%;
  background: var(--color-parchment-gold);
  border-radius: 2px;
  transition: width 100ms linear;
}

.queue-time {
  color: var(--hud-text-dim);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 24px;
  text-align: right;
}

/* --- 6. GAME OVER OVERLAY ------------------------------- */

.game-over-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: auto;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  animation: fade-in var(--transition-slow) ease forwards;
}

.game-over-overlay[hidden] {
  display: none;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.game-over-content {
  text-align: center;
  max-width: 480px;
  width: 90%;
  padding: 40px;
  background: var(--hud-bg);
  border: 1px solid var(--hud-border);
  border-radius: var(--hud-radius-lg);
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.5);

  animation: scale-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.game-over-title {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Victory / Defeat kleur-variants */
.game-over-overlay.is-victory .game-over-title {
  color: var(--color-victory);
  text-shadow:
    0 0 20px rgba(255, 215, 0, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

.game-over-overlay.is-defeat .game-over-title {
  color: var(--color-defeat);
  text-shadow:
    0 0 20px rgba(139, 26, 26, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

.game-over-overlay.is-defeat .game-over-content {
  border-color: rgba(139, 26, 26, 0.4);
}

.game-over-overlay.is-victory .game-over-content {
  border-color: rgba(255, 215, 0, 0.3);
}

.game-over-subtitle {
  font-family: var(--font-heading);
  font-size: 16px;
  font-style: italic;
  color: var(--hud-text-dim);
  margin-bottom: 28px;
}

/* Stats tabel */

.game-over-stats {
  text-align: left;
  margin-bottom: 28px;
  border-top: 1px solid var(--hud-border);
  padding-top: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 5px 0;
  border-bottom: 1px solid rgba(212, 168, 83, 0.1);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row__label {
  font-size: 13px;
  color: var(--hud-text);
}

.stat-row__value {
  font-size: 15px;
  font-weight: 700;
  color: var(--hud-text-bright);
  font-variant-numeric: tabular-nums;
}

/* Knoppen */

.game-over-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: 1px solid var(--hud-border);
  border-radius: var(--hud-radius);
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  user-select: none;

  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.btn:focus-visible {
  outline: 2px solid var(--color-parchment-gold);
  outline-offset: 2px;
}

.btn--primary {
  background: var(--color-parchment-gold);
  color: var(--hud-bg-solid);
  border-color: var(--color-parchment-gold);
}

.btn--primary:hover {
  background: #E0B864;
  box-shadow: 0 0 16px rgba(212, 168, 83, 0.4);
  transform: translateY(-1px);
}

.btn--primary:active {
  transform: translateY(0);
  box-shadow: none;
}

.btn--secondary {
  background: transparent;
  color: var(--hud-text);
  border-color: var(--hud-border);
}

.btn--secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--hud-border-hover);
  transform: translateY(-1px);
}

.btn--secondary:active {
  transform: translateY(0);
}

/* --- Responsive (1366x768 minimum) ---------------------- */

@media (max-width: 1400px) {
  :root {
    --minimap-size: 170px;
    --panel-height: 140px;
    --portrait-size: 56px;
    --btn-size: 42px;
  }

  .resource-bar {
    font-size: 13px;
    padding: 6px 12px;
  }

  .unit-name {
    font-size: 13px;
  }

  .game-over-title {
    font-size: 28px;
  }

  .selection-panel {
    min-width: 420px;
  }
}

@media (max-width: 1024px) {
  :root {
    --minimap-size: 150px;
    --panel-height: 130px;
    --portrait-size: 48px;
    --portrait-sm: 30px;
    --btn-size: 38px;
    --hud-padding: 8px;
  }

  .selection-panel {
    min-width: 360px;
    max-width: 580px;
  }

  .cmd-label {
    display: none;
  }

  .game-over-content {
    padding: 28px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. TypeScript Interfaces

```typescript
// ============================================================
// Reign of Brabant -- PoC HUD API Types
// ============================================================

// --- Basis Types ---

export type Faction = 'brabant' | 'randstad' | 'limburg' | 'belgen';
export type AlertType = 'warning' | 'info' | 'error';
export type UnitStatus = 'idle' | 'moving' | 'attacking' | 'gathering' | 'building' | 'fleeing';
export type BuildingType = 'townhall' | 'barracks';
export type CommandAction =
  | 'move' | 'attack' | 'stop' | 'hold'
  | 'train-worker' | 'train-infantry' | 'train-ranged' | 'rally-point'
  | 'build-townhall' | 'build-barracks';

// --- Data Structs ---

export interface SelectedUnit {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  arm: number;
  spd: number;
  level: number;
  status: UnitStatus;
  /** URL of portrait image, or null for placeholder */
  portrait: string | null;
}

export interface SelectedBuilding {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  type: BuildingType;
  /** Huidige productie in de queue */
  queue: ProductionQueueItem[];
}

export interface ProductionQueueItem {
  unitName: string;
  progress: number;      // 0-1
  remainingSeconds: number;
}

export interface MinimapData {
  /** Terrain data als ImageData of een CanvasImageSource om direct te blitten */
  terrain: CanvasImageSource | null;
  /** Eigen units: [x, y] genormaliseerd 0-1 */
  friendlyUnits: [number, number][];
  /** Vijandelijke units (alleen zichtbare): [x, y] genormaliseerd 0-1 */
  enemyUnits: [number, number][];
  /** Gebouwen: [x, y, isFriendly] genormaliseerd 0-1 */
  buildings: [number, number, boolean][];
  /** Camera viewport rectangle: [x, y, width, height] genormaliseerd 0-1 */
  viewport: [number, number, number, number];
  /** Fog of war als ImageData (zwart = unexplored, grijs = explored) */
  fog: CanvasImageSource | null;
  /** Rode alert pings: [x, y, ageMs] */
  alertPings: [number, number, number][];
}

export interface GameStats {
  /** Speeltijd in seconden */
  durationSeconds: number;
  unitsProduced: number;
  unitsLost: number;
  enemiesKilled: number;
  buildingsBuilt: number;
  buildingsDestroyed: number;
  resourcesGathered: number;
}

// --- Event Callbacks ---

export interface HUDEvents {
  /** Speler klikt op minimap op genormaliseerde positie */
  onMinimapClick: (x: number, y: number) => void;
  /** Speler klikt op een command button */
  onCommand: (action: CommandAction) => void;
  /** Speler klikt op een unit portrait in multi-select */
  onPortraitClick: (unitId: number) => void;
  /** Speler klikt retry op game over scherm */
  onRetry: () => void;
  /** Speler klikt menu op game over scherm */
  onMenu: () => void;
}

// --- Hoofd API ---

export interface GameUI {
  /**
   * Initialiseer de HUD en bind event listeners.
   * Moet eenmalig aangeroepen worden na DOM ready.
   */
  init(events: HUDEvents): void;

  /**
   * Update de resource bar.
   * @param gold - Huidige hoeveelheid goud
   * @param pop - Huidig aantal population
   * @param maxPop - Maximum population
   */
  updateResources(gold: number, pop: number, maxPop: number): void;

  /**
   * Toon het unit panel voor een of meerdere units.
   * Bij 1 unit: single view met stats.
   * Bij 2+ units: multi view met portrait grid.
   */
  showUnitPanel(units: SelectedUnit[]): void;

  /**
   * Toon het building panel.
   */
  showBuildingPanel(building: SelectedBuilding): void;

  /**
   * Toon worker build commands (Town Hall, Barracks).
   * Wordt aangeroepen wanneer een worker geselecteerd is.
   */
  showWorkerCommands(): void;

  /**
   * Verberg het volledige selection panel (unit + building).
   */
  hideSelectionPanel(): void;

  /**
   * Toon een alert/toast bovenaan het scherm.
   * Verdwijnt automatisch na 3 seconden.
   * @param message - De tekst van de alert
   * @param type - 'warning' | 'info' | 'error'
   */
  showAlert(message: string, type: AlertType): void;

  /**
   * Render de minimap canvas met nieuwe data.
   * Wordt elk frame of elke ~100ms aangeroepen.
   */
  updateMinimap(data: MinimapData): void;

  /**
   * Toon het game over scherm.
   * @param victory - true = overwinning, false = verslagen
   * @param stats - Eindstatistieken
   */
  showGameOver(victory: boolean, stats: GameStats): void;

  /**
   * Verberg het game over scherm.
   */
  hideGameOver(): void;

  /**
   * Update de FPS counter.
   * @param fps - Huidige FPS waarde
   */
  updateFPS(fps: number): void;

  /**
   * Toon/verberg de FPS counter (dev mode toggle).
   */
  setFPSVisible(visible: boolean): void;

  /**
   * Stel de actieve factie in voor theming.
   * Verandert accent-kleuren in de hele HUD.
   */
  setFaction(faction: Faction): void;

  /**
   * Schakel een command button in/uit.
   * @param action - De actie om te togglen
   * @param enabled - true = actief, false = disabled
   */
  setCommandEnabled(action: CommandAction, enabled: boolean): void;

  /**
   * Update de productie queue bar in het building panel.
   * @param progress - 0-1 voortgang
   * @param label - Naam van de unit in productie
   * @param remainingSeconds - Resterende seconden
   */
  updateProductionQueue(progress: number, label: string, remainingSeconds: number): void;

  /**
   * Cleanup: verwijder alle event listeners.
   * Aanroepen bij game dispose.
   */
  destroy(): void;
}
```

---

## 6. Interactie Beschrijvingen

### 6.1 Resource Bar

| Interactie | Actie | Visuele feedback |
|------------|-------|------------------|
| Hover op resource item | Toon tooltip met naam (bijv. "Goud: 450") | Subtiele highlight van het item |
| Population bereikt max | Automatisch | Getal wordt rood, pulseert (CSS `pulse-red` animatie) |
| Resource waarde verandert | Via `updateResources()` | Getal update, geen extra animatie in PoC |

### 6.2 Minimap

| Interactie | Actie | Visuele feedback |
|------------|-------|------------------|
| Linksklik op minimap | `onMinimapClick(x, y)` met genormaliseerde coords (0-1) | Camera verplaatst naar die locatie |
| Hover op minimap | -- | Border kleurt helderder (`hud-border-hover`) |
| Alert ping ontvangen | Via `updateMinimap()` met `alertPings` data | Rode pulserende cirkel op ping locatie |

**Minimap render logica** (in `updateMinimap()`):

1. Clear canvas
2. Draw terrain background (blit `data.terrain`)
3. Draw fog of war overlay (blit `data.fog`, multiply blend)
4. Draw buildings als vierkantjes (4x4px): groen = eigen, rood = vijand
5. Draw friendly units als cirkels (3px radius): `--faction-accent` kleur (oranje default)
6. Draw enemy units als cirkels (3px radius): blauw `#4A90D9`
7. Draw camera viewport als wit wireframe rectangle
8. Draw alert pings: rode cirkels met fade-out op basis van `ageMs`

### 6.3 Unit Panel

| Interactie | Actie | Visuele feedback |
|------------|-------|------------------|
| Unit geselecteerd (1) | `showUnitPanel([unit])` | Panel slide-up, single view |
| Units geselecteerd (2+) | `showUnitPanel(units)` | Panel slide-up, multi view met grid |
| Klik op portrait (multi) | `onPortraitClick(unitId)` | Selectie wisselt naar alleen die unit |
| Deselecteer (ESC) | `hideSelectionPanel()` | Panel verdwijnt |
| HP verandert | Via opnieuw `showUnitPanel()` aanroepen | HP bar breedte + kleur update smooth |

**HP bar kleur logica**:

- `> 60%`: groen (`hp-high`)
- `30% - 60%`: geel (`hp-mid`)
- `< 30%`: rood (`hp-low`)

### 6.4 Command Panel

| Interactie | Actie | Visuele feedback |
|------------|-------|------------------|
| Hover op button | -- | Achtergrond glow, border helder, scale(1.05) |
| Klik op button | `onCommand(action)` | scale(0.95) press feedback |
| Hotkey druk (Q/W/E/R) | Zelfde als klik op corresponderende button | Button kort highlight |
| Button disabled | `setCommandEnabled(action, false)` | Opacity 35%, cursor: not-allowed |

**Hotkey mapping**:

| Hotkey | Unit context | Barracks context | Worker context |
|--------|-------------|------------------|----------------|
| Q | Move | Train Worker | Build Town Hall |
| W | Attack | Train Infantry | Build Barracks |
| E | Stop | Train Ranged | -- |
| R | Hold | Rally Point | -- |

De game engine schakelt de juiste command panel zichtbaar op basis van wat geselecteerd is. De HUD zelf doet geen game logic.

### 6.5 Alerts

| Interactie | Actie | Visuele feedback |
|------------|-------|------------------|
| Alert verschijnt | `showAlert(msg, type)` | Slide-in van boven, type-specifieke kleur |
| Na 3 seconden | Automatisch | Fade-out + slide-up (class `is-leaving`), na 200ms verwijderd uit DOM |
| Meerdere alerts | Stacken verticaal | Nieuwste bovenaan |

**Alert iconen per type**:

- `warning`: `&#9888;` (driehoek met uitroepteken)
- `info`: `&#8505;` (info cirkel)
- `error`: `&#10060;` (kruisje)

### 6.6 Game Over

| Interactie | Actie | Visuele feedback |
|------------|-------|------------------|
| Victory getriggerd | `showGameOver(true, stats)` | Overlay fade-in, gouden titel, stats |
| Defeat getriggerd | `showGameOver(false, stats)` | Overlay fade-in, rode titel, stats |
| Klik "Opnieuw Spelen" | `onRetry()` | Button press feedback |
| Klik "Hoofdmenu" | `onMenu()` | Button press feedback |
| Hover op buttons | -- | Glow + translate(-1px) lift effect |

**Victory vs Defeat verschil**:

| Aspect | Victory | Defeat |
|--------|---------|--------|
| Titel | "OVERWINNING!" | "VERSLAGEN..." |
| Subtitel | "Brabant is veilig!" | "Het worstenbroodje is verloren..." |
| Titel kleur | Goud (#FFD700) met glow | Donkerrood (#8B1A1A) met glow |
| Border kleur | Gouden tint | Rode tint |
| Retry knop label | "Opnieuw Spelen" | "Opnieuw Spelen" |
| Extra knop | -- | -- (Volgende Missie later bij campaign) |

### 6.7 FPS Counter

| Interactie | Actie | Visuele feedback |
|------------|-------|------------------|
| Dev mode aan | `setFPSVisible(true)` | FPS counter verschijnt links boven |
| Dev mode uit | `setFPSVisible(false)` | FPS counter verborgen |
| Elk frame | `updateFPS(fps)` | Getal update |

Geen klik-interactie. Puur informatief. Wordt niet gerenderd in productie tenzij dev mode actief is.

---

## 7. Implementatie Notities

### 7.1 Bestandsstructuur

```
reign-of-brabant/
  src/
    ui/
      hud.html          <-- HTML structuur (embed in main index.html)
      hud.css           <-- Volledige stylesheet
      hud.ts            <-- GameUI implementatie
      hud.types.ts      <-- TypeScript interfaces
```

### 7.2 Integratie met Three.js

De HUD is een puur HTML/CSS layer die bovenop de Three.js `<canvas>` ligt. Er is geen Three.js CSS3DRenderer nodig. De integratie werkt als volgt:

```typescript
// In de game engine main loop:
import { createGameUI } from './ui/hud';

const ui = createGameUI();

ui.init({
  onMinimapClick: (x, y) => {
    camera.position.set(x * mapWidth, camera.position.y, y * mapHeight);
  },
  onCommand: (action) => {
    commandSystem.execute(action, selectedEntities);
  },
  onPortraitClick: (unitId) => {
    selectionSystem.selectSingle(unitId);
  },
  onRetry: () => gameManager.restart(),
  onMenu: () => gameManager.goToMenu(),
});

// In de render loop:
function update(dt: number) {
  ui.updateResources(gold, population, maxPopulation);
  ui.updateFPS(Math.round(1 / dt));
  ui.updateMinimap(minimapData);
}
```

### 7.3 Pointer Events Strategie

De cruciale truc voor een HUD overlay op een game canvas:

```
.hud-overlay        → pointer-events: none   (laat klikken door)
.hud-panel           → pointer-events: auto   (vangt klikken op)
.alert               → pointer-events: auto   (klikbaar)
.game-over-overlay   → pointer-events: auto   (blokkeert alles)
.fps-counter         → pointer-events: none   (niet klikbaar)
.alert-container     → pointer-events: none   (container is transparant)
```

Hierdoor kan de speler door de lege ruimtes van de HUD heen klikken op de 3D wereld, maar interacteren met de panels, buttons en minimap.

### 7.4 Performance

- De minimap canvas wordt met een eigen 2D context gerenderd, los van Three.js
- Minimap update rate: elke ~100ms (10 FPS) is voldoende, niet elk frame
- DOM updates (resources, HP) via `textContent` / `style.width`, geen innerHTML
- Alerts worden na verwijdering echt uit de DOM gehaald, niet verborgen
- CSS `will-change` wordt bewust NIET gebruikt (browser optimaliseert al bij animaties)

### 7.5 Wat NIET in de PoC zit

De volgende elementen uit de SUB-PRD-UI-UX.md zijn bewust weggelaten voor de PoC:

| Element | Reden | Wanneer toevoegen |
|---------|-------|-------------------|
| Control Groups (1-9) | Complexe selectie-logica | Sprint 2 |
| Build Grid Overlay | Vereist 3D raycasting | Sprint 2 |
| Ability cooldowns (radial timer) | Abilities nog niet geimplementeerd | Sprint 3 |
| Resource income (+/- per seconde) | Economy system nog niet af | Sprint 2 |
| Factie-specifieke resource iconen | Alleen Brabanders in PoC | Sprint 3 |
| Tooltip systeem | Nice-to-have | Sprint 2 |
| Pause menu | Geen pause in PoC | Sprint 2 |
| Save/Load | Geen persistence in PoC | Sprint 3 |
| Minimap drag (continue camera) | Simpele klik volstaat voor PoC | Sprint 2 |
| Rechts-klik minimap (unit move) | Klik = camera verplaatsen volstaat | Sprint 2 |

---

**Einde document**
