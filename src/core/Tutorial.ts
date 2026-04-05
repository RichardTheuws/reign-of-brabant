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
  {
    message: 'Welkom in Brabant! Gebruik WASD of de pijltjestoetsen om rond te kijken.',
    condition: (s) => s.cameraMoved,
    highlight: 'camera',
  },
  {
    message: 'Goed zo! Klik nu op een Boer om hem te selecteren.',
    condition: (s) => s.workerSelected,
    highlight: 'worker',
  },
  {
    message: 'Klik met rechts op de goudmijn om te verzamelen.',
    condition: (s) => s.gatheringStarted,
    highlight: 'goldmine',
  },
  {
    message: 'Uitstekend! Je Boer brengt nu worstenbroodjes naar de Boerderij.',
    condition: () => true,
    autoAdvanceMs: 4000,
  },
  {
    message: 'Je hebt genoeg goud! Selecteer een Boer en druk op B om een Kazerne te bouwen.',
    condition: (s) => s.barracksBuilt,
    highlight: 'barracks',
  },
  {
    message: 'Selecteer de Kazerne en train een Carnavalvierder (klik op het zwaard-icoon).',
    condition: (s) => s.unitTrained,
    highlight: 'barracks',
  },
  {
    message: 'Selecteer je leger en val de vijand aan! Rechts-klik op hun gebouw.',
    condition: (s) => s.attackIssued,
    highlight: 'enemy',
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
  private arrowEl: HTMLElement | null = null;
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
    if (this.arrowEl) {
      this.arrowEl.style.display = 'none';
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
    if (this.arrowEl) {
      if (step.highlight) {
        this.arrowEl.style.display = 'block';
        this.arrowEl.dataset.target = step.highlight;
      } else {
        this.arrowEl.style.display = 'none';
      }
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
          <span class="tutorial-icon">&#x1F4D6;</span>
          <span class="tutorial-title">Tutorial</span>
          <span class="tutorial-step-counter" id="tutorial-step-counter">1 / ${this.steps.length}</span>
        </div>
        <div class="tutorial-message" id="tutorial-message"></div>
        <button class="tutorial-skip-btn" id="tutorial-skip-btn">Overslaan</button>
      </div>
      <div class="tutorial-arrow" id="tutorial-arrow" style="display: none;">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <polygon points="16,4 28,28 16,20 4,28" fill="#d4a853" stroke="#8B6914" stroke-width="1.5"/>
        </svg>
      </div>
    `;

    document.getElementById('ui-overlay')?.appendChild(overlay);

    this.overlayEl = overlay;
    this.messageEl = overlay.querySelector('#tutorial-message');
    this.arrowEl = overlay.querySelector('#tutorial-arrow');
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
      this.arrowEl = null;
      this.skipBtn = null;
      this.stepCounterEl = null;
    }
  }
}
