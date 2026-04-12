/**
 * Tutorial.ts -- Interactieve in-game tutorial systeem.
 *
 * Step-based tutorial that guides the player through:
 * 1. Camera controls (WASD)
 * 2. Selecting a worker
 * 3. Gathering resources
 * 4. Informational step (worker returns resources)
 * 5. Building a barracks
 * 6. Training a unit from barracks
 * 7. Attacking the enemy
 *
 * Each step has a message, a completion condition, and an optional highlight target.
 */

// ---------------------------------------------------------------------------
// TutorialStep interface
// ---------------------------------------------------------------------------

export interface TutorialStep {
  /** Instruction text displayed to the player. */
  readonly message: string;
  /** Returns true when the step is completed. */
  condition: (state: TutorialState) => boolean;
  /** Optional highlight description (for positioning the arrow indicator). */
  readonly highlight?: 'camera' | 'worker' | 'goldmine' | 'barracks' | 'unit' | 'enemy';
  /** If true, this step auto-advances after a delay (no condition needed). */
  readonly autoAdvanceMs?: number;
}

// ---------------------------------------------------------------------------
// State tracked by the tutorial (fed from the game)
// ---------------------------------------------------------------------------

export interface TutorialState {
  cameraMoved: boolean;
  workerSelected: boolean;
  gatheringStarted: boolean;
  barracksBuilt: boolean;
  unitTrained: boolean;
  attackIssued: boolean;
  /** Gold amount for checking thresholds. */
  gold: number;
}

// ---------------------------------------------------------------------------
// Tutorial steps
// ---------------------------------------------------------------------------

const TUTORIAL_STEPS: TutorialStep[] = [
  // 1/8 — Camera
  {
    message: 'Welkom in Reusel! Gebruik WASD of pijltjestoetsen om rond te kijken. Scroll om in en uit te zoomen.',
    condition: (s) => s.cameraMoved,
  },
  // 2/8 — Selecteren
  {
    message: 'Klik op een Boer om hem te selecteren. Rechtsonder verschijnen zijn stats. Sleep een kader om meerdere Boeren te selecteren.',
    condition: (s) => s.workerSelected,
  },
  // 3/8 — Grondstoffen verzamelen (wacht op gold > 20, niet op gatheringStarted)
  {
    message: 'Selecteer je Boeren en rechts-klik op de goudmijn om te gaan verzamelen. Wacht tot je wat goud binnen hebt.',
    condition: (s) => s.gold >= 20,
  },
  // 4/8 — Goud binnenkomt, info over economie
  {
    message: 'Het goud komt binnen! Linksboven zie je je grondstoffen. Stuur al je Boeren naar de mijnen voor meer inkomen.',
    condition: () => true,
    autoAdvanceMs: 6000,
  },
  // 5/8 — Bouwen (B = barracks)
  {
    message: 'Tijd om te bouwen! Selecteer een Boer en druk op B om een Kazerne neer te zetten. Klik dan op de grond om te plaatsen.',
    condition: (s) => s.barracksBuilt,
  },
  // 6/8 — Eenheden trainen (W = infantry)
  {
    message: 'Klik op de Kazerne en druk W om een Carnavalvierder te trainen. Dat is je infanterie. Je kunt er meerdere achter elkaar trainen.',
    condition: (s) => s.unitTrained,
  },
  // 7/8 — Gevecht
  {
    message: 'Selecteer je soldaten en rechts-klik op een vijand om aan te vallen. Tip: A + rechts-klik doet een attack-move.',
    condition: (s) => s.attackIssued,
  },
  // 8/8 — Afsluiting
  {
    message: 'Je kent de basis! Druk ESC voor het pauzemenu met alle hotkeys. Verzamel 500 goud om de missie te voltooien. Succes!',
    condition: () => true,
    autoAdvanceMs: 6000,
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

  /** DOM overlay element. */
  private overlayEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private skipBtn: HTMLElement | null = null;
  private stepCounterEl: HTMLElement | null = null;

  /** Callback when tutorial finishes or is skipped. */
  private onComplete: (() => void) | null = null;

  constructor() {
    this.steps = [...TUTORIAL_STEPS];
  }

  /** Start the tutorial. Creates DOM overlay. */
  start(onComplete: () => void): void {
    this.onComplete = onComplete;
    this.active = true;
    this.completed = false;
    this.skipped = false;
    this.currentStepIndex = 0;
    this.autoAdvanceTimer = 0;
    this.createOverlay();
    this.showCurrentStep();
  }

  /** Stop and clean up. */
  stop(): void {
    this.active = false;
    this.removeOverlay();
  }

  /** Whether the tutorial is currently running. */
  get isActive(): boolean {
    return this.active;
  }

  /** Whether the tutorial was completed or skipped. */
  get isCompleted(): boolean {
    return this.completed || this.skipped;
  }

  /** Current step index (0-based). */
  get stepIndex(): number {
    return this.currentStepIndex;
  }

  /** Total steps. */
  get totalSteps(): number {
    return this.steps.length;
  }

  /** Called every frame with the current tutorial state. */
  update(dt: number, state: TutorialState): void {
    if (!this.active || this.completed) return;

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
    this.removeOverlay();
    this.onComplete?.();
  }

  // -------------------------------------------------------------------------
  // Private methods
  // -------------------------------------------------------------------------

  private advanceStep(): void {
    this.currentStepIndex++;
    this.autoAdvanceTimer = 0;

    if (this.currentStepIndex >= this.steps.length) {
      this.finish();
    } else {
      this.showCurrentStep();
    }
  }

  private finish(): void {
    this.completed = true;
    this.active = false;

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

    setTimeout(() => {
      this.removeOverlay();
      this.onComplete?.();
    }, 2000);
  }

  private showCurrentStep(): void {
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    if (this.messageEl) {
      this.messageEl.textContent = step.message;
    }
    if (this.stepCounterEl) {
      this.stepCounterEl.textContent = `${this.currentStepIndex + 1} / ${this.steps.length}`;
    }
  }

  private createOverlay(): void {
    // Remove existing if any
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
        <button class="tutorial-skip-btn" id="tutorial-skip-btn">Overslaan</button>
      </div>
    `;

    document.getElementById('ui-overlay')?.appendChild(overlay);

    this.overlayEl = overlay;
    this.messageEl = overlay.querySelector('#tutorial-message');
    this.skipBtn = overlay.querySelector('#tutorial-skip-btn');
    this.stepCounterEl = overlay.querySelector('#tutorial-step-counter');

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
    }
  }
}
