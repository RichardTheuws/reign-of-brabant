/**
 * Tutorial.ts -- Scenario-driven 12-step tutorial systeem.
 *
 * Guides the player through a complete learning path:
 *  1. Camera bewegen (WASD/arrows + scroll)
 *  2. Unit selecteren (click worker)
 *  3. Meerdere units selecteren (drag box-select)
 *  4. Resources verzamelen (right-click gold mine)
 *  5. Wachten op gold (50) — pause overlay
 *  6. Gebouw plaatsen (B key, Barracks)
 *  7. Wachten op constructie — pause overlay
 *  8. Unit trainen (W key)
 *  9. Wachten op training — pause overlay
 * 10. Aanvallen (right-click enemy)
 * 11. Verdedigen (survive attack wave)
 * 12. Missie voltooien (200 gold)
 *
 * Features:
 * - Input lock per step (blocks irrelevant actions)
 * - Visual highlight ring + arrow indicator
 * - Pause overlay for informational steps
 * - Skip button visible from step 8+
 * - Progress dots at the bottom
 * - Tooltip system for hotkeys
 */

// ---------------------------------------------------------------------------
// AllowedAction type
// ---------------------------------------------------------------------------

export type AllowedAction =
  | 'camera'       // WASD/arrows/scroll
  | 'select'       // Click to select
  | 'box-select'   // Drag to box-select
  | 'right-click'  // Right-click commands (gather, attack, move)
  | 'build'        // B key to open build menu
  | 'train'        // Production hotkeys (W, E, etc.)
  | 'hotkey'       // Any hotkey
  | 'all';         // Everything allowed

// ---------------------------------------------------------------------------
// TutorialStep interface
// ---------------------------------------------------------------------------

export interface TutorialStep {
  /** Instruction text displayed to the player. */
  readonly message: string;
  /** Returns true when the step is completed. */
  condition: (state: TutorialState) => boolean;
  /** Optional highlight target for visual indicator (ring + arrow). */
  readonly highlight?: 'camera' | 'worker' | 'workers' | 'goldmine' | 'barracks' | 'unit' | 'enemy' | 'b-button' | 'w-button';
  /** If set, auto-advance after this many milliseconds. */
  readonly autoAdvanceMs?: number;
  /** Set of allowed actions during this step (input lock). */
  readonly allowedActions: ReadonlySet<AllowedAction>;
  /** If true, show a pause overlay before the step starts. */
  readonly pauseOnEntry?: boolean;
  /** Optional hotkey to show as a tooltip at first use. */
  readonly hotkey?: string;
}

// ---------------------------------------------------------------------------
// State tracked by the tutorial (fed from the game via main.ts)
// ---------------------------------------------------------------------------

export interface TutorialState {
  cameraMoved: boolean;
  workerSelected: boolean;
  multiSelectDone: boolean;
  gatheringStarted: boolean;
  gold: number;
  barracksPlaced: boolean;
  barracksComplete: boolean;
  unitTrainingStarted: boolean;
  unitTrained: boolean;
  attackIssued: boolean;
  defendSurvived: boolean;
}

// ---------------------------------------------------------------------------
// Tutorial steps definition
// ---------------------------------------------------------------------------

const TUTORIAL_STEPS: TutorialStep[] = [
  // Step 1/12 — Camera bewegen
  {
    message: 'Welkom in Reusel! Gebruik WASD of de pijltjestoetsen om de camera te bewegen. Scroll om in en uit te zoomen.',
    condition: (s) => s.cameraMoved,
    allowedActions: new Set<AllowedAction>(['camera']),
  },
  // Step 2/12 — Unit selecteren
  {
    message: 'Goed zo! Klik nu op een van je Boeren om hem te selecteren. Rechtsonder verschijnen zijn stats.',
    condition: (s) => s.workerSelected,
    highlight: 'worker',
    allowedActions: new Set<AllowedAction>(['camera', 'select']),
  },
  // Step 3/12 — Meerdere units selecteren (box-select)
  {
    message: 'Je kunt meerdere eenheden selecteren door een kader te slepen. Probeer het \u2014 sleep een kader om al je Boeren.',
    condition: (s) => s.multiSelectDone,
    highlight: 'workers',
    allowedActions: new Set<AllowedAction>(['camera', 'select', 'box-select']),
  },
  // Step 4/12 — Resources verzamelen
  {
    message: 'Selecteer je Boeren en rechts-klik op de goudmijn om grondstoffen te verzamelen.',
    condition: (s) => s.gatheringStarted,
    highlight: 'goldmine',
    allowedActions: new Set<AllowedAction>(['camera', 'select', 'box-select', 'right-click']),
  },
  // Step 5/12 — Wachten op gold (50) — pause overlay
  {
    message: 'Het goud komt binnen! Linksboven zie je je grondstoffen. Wacht tot je 50 goud hebt \u2014 dan kun je bouwen.',
    condition: (s) => s.gold >= 50,
    pauseOnEntry: true,
    allowedActions: new Set<AllowedAction>(['camera', 'select', 'box-select', 'right-click']),
  },
  // Step 6/12 — Gebouw plaatsen (Barracks)
  {
    message: 'Tijd om te bouwen! Druk op B om het bouwmenu te openen en kies de Kazerne. Klik dan op een open plek om te plaatsen.',
    condition: (s) => s.barracksPlaced,
    highlight: 'b-button',
    hotkey: 'B',
    allowedActions: new Set<AllowedAction>(['camera', 'select', 'box-select', 'right-click', 'build']),
  },
  // Step 7/12 — Wachten op constructie — pause overlay
  {
    message: 'De Kazerne wordt gebouwd. Je Boer bouwt automatisch \u2014 hoe meer Boeren helpen, hoe sneller het gaat.',
    condition: (s) => s.barracksComplete,
    pauseOnEntry: true,
    allowedActions: new Set<AllowedAction>(['camera', 'select', 'box-select', 'right-click', 'build']),
  },
  // Step 8/12 — Unit trainen
  {
    message: 'De Kazerne is klaar! Klik erop en druk W om een Carnavalvierder te trainen.',
    condition: (s) => s.unitTrainingStarted,
    highlight: 'barracks',
    hotkey: 'W',
    allowedActions: new Set<AllowedAction>(['camera', 'select', 'box-select', 'right-click', 'build', 'train']),
  },
  // Step 9/12 — Wachten op training — pause overlay
  {
    message: 'Je eerste soldaat wordt getraind! Je kunt meerdere eenheden in de wachtrij zetten.',
    condition: (s) => s.unitTrained,
    pauseOnEntry: true,
    allowedActions: new Set<AllowedAction>(['camera', 'select', 'box-select', 'right-click', 'build', 'train']),
  },
  // Step 10/12 — Aanvallen
  {
    message: 'Vijanden naderen! Selecteer je soldaat en rechts-klik op een vijand om aan te vallen. Tip: A + klik doet een attack-move.',
    condition: (s) => s.attackIssued,
    highlight: 'enemy',
    hotkey: 'A',
    allowedActions: new Set<AllowedAction>(['all']),
  },
  // Step 11/12 — Verdedigen
  {
    message: 'Meer vijanden! Verdedig je dorp. Train extra soldaten als dat nodig is.',
    condition: (s) => s.defendSurvived,
    allowedActions: new Set<AllowedAction>(['all']),
  },
  // Step 12/12 — Missie voltooien (200 gold)
  {
    message: 'Uitstekend! Verzamel nu 200 goud om de missie te voltooien. Je kent de basis \u2014 succes, opzichter!',
    condition: (s) => s.gold >= 200,
    allowedActions: new Set<AllowedAction>(['all']),
  },
];

// ---------------------------------------------------------------------------
// Tutorial Manager
// ---------------------------------------------------------------------------

export class Tutorial {
  private steps: TutorialStep[];
  private currentStepIndex = 0;
  private active = false;
  private completed = false;
  private skipped = false;

  /** Auto-advance timer (ms remaining). */
  private autoAdvanceTimer = 0;

  /** Pause overlay state: true = waiting for player to click "Doorgaan". */
  private paused = false;

  /** DOM elements. */
  private overlayEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private skipBtn: HTMLElement | null = null;
  private stepCounterEl: HTMLElement | null = null;
  private progressEl: HTMLElement | null = null;
  private highlightRingEl: HTMLElement | null = null;
  private arrowEl: HTMLElement | null = null;
  private pauseOverlayEl: HTMLElement | null = null;
  private tooltipEl: HTMLElement | null = null;

  /** Tooltip auto-hide timer. */
  private tooltipTimer: ReturnType<typeof setTimeout> | null = null;

  /** Tracks which hotkeys have already been shown (no repeat). */
  private shownHotkeys = new Set<string>();

  /** Callback when tutorial finishes or is skipped. */
  private onComplete: (() => void) | null = null;

  /** Callback to request game pause (dt=0 from main loop). */
  private onPauseRequest: ((paused: boolean) => void) | null = null;

  /** Callback when enemies should be spawned for combat steps. */
  private onSpawnEnemies: ((count: number) => void) | null = null;

  constructor() {
    this.steps = [...TUTORIAL_STEPS];
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Start the tutorial. Creates DOM overlay.
   * @param onComplete Called when tutorial finishes or is skipped.
   * @param onPauseRequest Called with true/false to request game pause.
   * @param onSpawnEnemies Called when combat steps need enemies spawned.
   */
  start(
    onComplete: () => void,
    onPauseRequest?: (paused: boolean) => void,
    onSpawnEnemies?: (count: number) => void,
  ): void {
    this.onComplete = onComplete;
    this.onPauseRequest = onPauseRequest ?? null;
    this.onSpawnEnemies = onSpawnEnemies ?? null;
    this.active = true;
    this.completed = false;
    this.skipped = false;
    this.paused = false;
    this.currentStepIndex = 0;
    this.autoAdvanceTimer = 0;
    this.shownHotkeys.clear();
    this.createOverlay();
    this.enterStep();
  }

  /** Stop and clean up. */
  stop(): void {
    this.active = false;
    this.paused = false;
    this.removeOverlay();
    this.removeHighlight();
    this.removeTooltip();
    this.removePauseOverlay();
  }

  /** Whether the tutorial is currently running. */
  get isActive(): boolean {
    return this.active;
  }

  /** Whether the tutorial was completed or skipped. */
  get isCompleted(): boolean {
    return this.completed || this.skipped;
  }

  /** Whether the tutorial is in a paused state (waiting for "Doorgaan" click). */
  get isPaused(): boolean {
    return this.paused;
  }

  /** Current step index (0-based). */
  get stepIndex(): number {
    return this.currentStepIndex;
  }

  /** Total steps. */
  get totalSteps(): number {
    return this.steps.length;
  }

  /** Current step definition (or undefined if out of range). */
  get currentStep(): TutorialStep | undefined {
    return this.steps[this.currentStepIndex];
  }

  /**
   * Check if an action is allowed by the current tutorial step.
   * If the tutorial is not active, all actions are allowed.
   */
  isActionAllowed(action: AllowedAction): boolean {
    if (!this.active || this.completed || this.skipped) return true;
    if (this.paused) return false;
    const step = this.steps[this.currentStepIndex];
    if (!step) return true;
    if (step.allowedActions.has('all')) return true;
    return step.allowedActions.has(action);
  }

  /**
   * Update the position of the highlight ring and arrow.
   * Called from main.ts with screen coordinates of the highlighted target.
   * @param x Screen X coordinate (center of target)
   * @param y Screen Y coordinate (center of target)
   */
  updateHighlightPosition(x: number, y: number): void {
    if (this.highlightRingEl) {
      this.highlightRingEl.style.left = `${x}px`;
      this.highlightRingEl.style.top = `${y}px`;
      this.highlightRingEl.style.display = 'block';
    }
    if (this.arrowEl) {
      this.arrowEl.style.left = `${x}px`;
      this.arrowEl.style.top = `${y - 48}px`;
      this.arrowEl.style.display = 'block';
    }
  }

  /**
   * Update the tooltip position for hotkey hints.
   * @param x Screen X coordinate
   * @param y Screen Y coordinate
   */
  updateTooltipPosition(x: number, y: number): void {
    if (this.tooltipEl) {
      this.tooltipEl.style.left = `${x}px`;
      this.tooltipEl.style.top = `${y}px`;
    }
  }

  /** Called every frame with the current tutorial state. */
  update(dt: number, state: TutorialState): void {
    if (!this.active || this.completed || this.paused) return;

    const step = this.steps[this.currentStepIndex];
    if (!step) {
      this.finish();
      return;
    }

    // Check auto-advance
    if (step.autoAdvanceMs !== undefined) {
      this.autoAdvanceTimer += dt * 1000;
      if (this.autoAdvanceTimer >= step.autoAdvanceMs) {
        this.advanceStep();
        return;
      }
    }

    // Check condition
    if (step.condition(state)) {
      this.advanceStep();
    }
  }

  /** Skip the tutorial entirely. */
  skip(): void {
    this.skipped = true;
    this.active = false;
    this.paused = false;
    this.onPauseRequest?.(false);
    this.removeOverlay();
    this.removeHighlight();
    this.removeTooltip();
    this.removePauseOverlay();
    this.onComplete?.();
  }

  // -----------------------------------------------------------------------
  // Private — step management
  // -----------------------------------------------------------------------

  private advanceStep(): void {
    this.removeHighlight();
    this.removeTooltip();
    this.removePauseOverlay();
    this.currentStepIndex++;
    this.autoAdvanceTimer = 0;

    if (this.currentStepIndex >= this.steps.length) {
      this.finish();
    } else {
      this.enterStep();
    }
  }

  /** Enter the current step — show message, handle pauseOnEntry, highlights, hotkeys. */
  private enterStep(): void {
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    // Spawn enemies for combat steps
    if (this.currentStepIndex === 9 && this.onSpawnEnemies) {
      // Step 10: 3 enemies appear
      this.onSpawnEnemies(3);
    } else if (this.currentStepIndex === 10 && this.onSpawnEnemies) {
      // Step 11: 5 enemies appear
      this.onSpawnEnemies(5);
    }

    // Handle pause overlay (shown BEFORE the step message)
    if (step.pauseOnEntry) {
      this.paused = true;
      this.onPauseRequest?.(true);
      this.showPauseOverlay(step.message, () => {
        this.paused = false;
        this.onPauseRequest?.(false);
        this.removePauseOverlay();
        this.showCurrentStep();
      });
      // Also update the panel behind the overlay
      this.updatePanelDisplay();
      return;
    }

    this.showCurrentStep();
  }

  private showCurrentStep(): void {
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    // Update panel
    this.updatePanelDisplay();

    // Show highlight if applicable
    if (step.highlight) {
      this.showHighlight();
    } else {
      this.removeHighlight();
    }

    // Show hotkey tooltip (only first time for each key)
    if (step.hotkey && !this.shownHotkeys.has(step.hotkey)) {
      this.shownHotkeys.add(step.hotkey);
      this.showTooltip(step.hotkey);
    } else {
      this.removeTooltip();
    }
  }

  /** Update panel message, counter, progress, and skip button visibility. */
  private updatePanelDisplay(): void {
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    if (this.messageEl) {
      this.messageEl.textContent = step.message;
    }
    if (this.stepCounterEl) {
      this.stepCounterEl.textContent = `${this.currentStepIndex + 1} / ${this.steps.length}`;
    }

    // Skip button: hidden for steps 1-7 (index 0-6), visible from step 8 (index 7)
    if (this.skipBtn) {
      this.skipBtn.style.display = this.currentStepIndex >= 7 ? 'inline-block' : 'none';
    }

    // Update progress dots
    this.updateProgressDots();
  }

  private finish(): void {
    this.completed = true;
    this.active = false;
    this.paused = false;
    this.onPauseRequest?.(false);

    // Show completion message briefly
    if (this.messageEl) {
      this.messageEl.textContent = 'Tutorial voltooid! Veel succes, opzichter!';
    }
    if (this.skipBtn) {
      this.skipBtn.style.display = 'none';
    }
    if (this.stepCounterEl) {
      this.stepCounterEl.style.display = 'none';
    }
    if (this.progressEl) {
      // All dots completed
      const dots = this.progressEl.querySelectorAll('.tutorial-progress-dot');
      dots.forEach(dot => {
        dot.classList.remove('current');
        dot.classList.add('completed');
      });
    }

    this.removeHighlight();
    this.removeTooltip();
    this.removePauseOverlay();

    setTimeout(() => {
      this.removeOverlay();
      this.onComplete?.();
    }, 2500);
  }

  // -----------------------------------------------------------------------
  // Private — DOM: main overlay
  // -----------------------------------------------------------------------

  private createOverlay(): void {
    this.removeOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.innerHTML = `
      <div class="tutorial-panel">
        <div class="tutorial-header">
          <span class="tutorial-title">Tutorial</span>
          <span class="tutorial-step-counter" id="tutorial-step-counter">1 / ${this.steps.length}</span>
        </div>
        <div class="tutorial-message" id="tutorial-message"></div>
        <button class="tutorial-skip-btn" id="tutorial-skip-btn" style="display:none">Overslaan</button>
        <div class="tutorial-progress" id="tutorial-progress"></div>
      </div>
    `;

    // Create progress dots
    const progressContainer = overlay.querySelector('#tutorial-progress') as HTMLElement;
    if (progressContainer) {
      for (let i = 0; i < this.steps.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'tutorial-progress-dot';
        dot.dataset.step = String(i);
        progressContainer.appendChild(dot);
      }
    }

    document.getElementById('ui-overlay')?.appendChild(overlay);

    this.overlayEl = overlay;
    this.messageEl = overlay.querySelector('#tutorial-message');
    this.skipBtn = overlay.querySelector('#tutorial-skip-btn');
    this.stepCounterEl = overlay.querySelector('#tutorial-step-counter');
    this.progressEl = overlay.querySelector('#tutorial-progress');

    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.skip());
    }
  }

  private removeOverlay(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
      this.messageEl = null;
      this.skipBtn = null;
      this.stepCounterEl = null;
      this.progressEl = null;
    }
  }

  // -----------------------------------------------------------------------
  // Private — DOM: progress dots
  // -----------------------------------------------------------------------

  private updateProgressDots(): void {
    if (!this.progressEl) return;
    const dots = this.progressEl.querySelectorAll('.tutorial-progress-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('completed', i < this.currentStepIndex);
      dot.classList.toggle('current', i === this.currentStepIndex);
    });
  }

  // -----------------------------------------------------------------------
  // Private — DOM: highlight ring + arrow
  // -----------------------------------------------------------------------

  private showHighlight(): void {
    this.removeHighlight();
    const uiOverlay = document.getElementById('ui-overlay');
    if (!uiOverlay) return;

    // Create highlight ring
    this.highlightRingEl = document.createElement('div');
    this.highlightRingEl.className = 'tutorial-highlight-ring';
    this.highlightRingEl.style.display = 'none'; // hidden until position is set
    uiOverlay.appendChild(this.highlightRingEl);

    // Create arrow indicator
    this.arrowEl = document.createElement('div');
    this.arrowEl.className = 'tutorial-arrow';
    this.arrowEl.style.display = 'none';
    uiOverlay.appendChild(this.arrowEl);
  }

  private removeHighlight(): void {
    if (this.highlightRingEl) {
      this.highlightRingEl.remove();
      this.highlightRingEl = null;
    }
    if (this.arrowEl) {
      this.arrowEl.remove();
      this.arrowEl = null;
    }
  }

  // -----------------------------------------------------------------------
  // Private — DOM: pause overlay
  // -----------------------------------------------------------------------

  private showPauseOverlay(message: string, onContinue: () => void): void {
    this.removePauseOverlay();
    const uiOverlay = document.getElementById('ui-overlay');
    if (!uiOverlay) return;

    const pauseEl = document.createElement('div');
    pauseEl.className = 'tutorial-pause-overlay';
    pauseEl.innerHTML = `
      <div class="tutorial-pause-message">${this.escapeHTML(message)}</div>
      <button class="tutorial-continue-btn">Doorgaan</button>
    `;

    const continueBtn = pauseEl.querySelector('.tutorial-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', onContinue, { once: true });
    }

    uiOverlay.appendChild(pauseEl);
    this.pauseOverlayEl = pauseEl;
  }

  private removePauseOverlay(): void {
    if (this.pauseOverlayEl) {
      this.pauseOverlayEl.remove();
      this.pauseOverlayEl = null;
    }
  }

  // -----------------------------------------------------------------------
  // Private — DOM: hotkey tooltip
  // -----------------------------------------------------------------------

  private showTooltip(hotkey: string): void {
    this.removeTooltip();
    const uiOverlay = document.getElementById('ui-overlay');
    if (!uiOverlay) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';
    tooltip.innerHTML = `<span class="tutorial-tooltip-key">${this.escapeHTML(hotkey)}</span> Sneltoets`;

    // Position initially at bottom-right of the panel; main.ts can update via updateTooltipPosition
    tooltip.style.left = '50%';
    tooltip.style.top = '140px';
    tooltip.style.transform = 'translateX(-50%)';

    uiOverlay.appendChild(tooltip);
    this.tooltipEl = tooltip;

    // Auto-hide after 10 seconds
    this.tooltipTimer = setTimeout(() => {
      this.removeTooltip();
    }, 10000);
  }

  private removeTooltip(): void {
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
    }
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  // -----------------------------------------------------------------------
  // Private — utility
  // -----------------------------------------------------------------------

  private escapeHTML(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
