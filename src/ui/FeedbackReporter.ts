/**
 * FeedbackReporter.ts -- In-game feedback system.
 *
 * 3-step modal: category → form → confirmation.
 * Auto-captures game state + canvas screenshot.
 * POSTs to /api/feedback server endpoint which creates GitHub Issues.
 */

declare const __APP_VERSION__: string;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeedbackCategory = 'bug' | 'balance' | 'feature' | 'praise';

interface GameStateSnapshot {
  version: string;
  faction: string;
  difficulty: string;
  elapsedSeconds: number;
  mission: string | null;
  stats: {
    unitsProduced: number;
    unitsLost: number;
    enemiesKilled: number;
    buildingsBuilt: number;
    resourcesGathered: number;
  };
  browser: {
    userAgent: string;
    resolution: string;
  };
}

interface FeedbackPayload {
  title: string;
  description: string;
  category: FeedbackCategory;
  gameState: GameStateSnapshot | null;
  screenshot: string | null;
}

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------

const CATEGORY_TITLES: Record<FeedbackCategory, string> = {
  bug: 'Bug / Issue',
  balance: 'Balans Feedback',
  feature: 'Idee / Feature',
  praise: 'Compliment',
};

const CATEGORY_PLACEHOLDERS: Record<FeedbackCategory, { title: string; desc: string }> = {
  bug: {
    title: 'bijv. Eenheden lopen vast bij de brug',
    desc: 'Beschrijf wat je deed en wat er mis ging...',
  },
  balance: {
    title: 'bijv. Limburgers Heavy unit is te sterk',
    desc: 'Wat voelt niet juist? Welke factie/unit/mechanic?',
  },
  feature: {
    title: 'bijv. Multiplayer modus',
    desc: 'Beschrijf wat je zou willen zien in de game...',
  },
  praise: {
    title: 'bijv. De voice acting is geweldig',
    desc: 'Wat vond je vet? We horen het graag!',
  },
};

// ---------------------------------------------------------------------------
// FeedbackReporter
// ---------------------------------------------------------------------------

export class FeedbackReporter {
  private modal: HTMLElement | null = null;
  private selectedCategory: FeedbackCategory | null = null;
  private getGameState: (() => GameStateSnapshot) | null = null;
  private getScreenshot: (() => Promise<string | null>) | null = null;
  private onClose: (() => void) | null = null;

  /**
   * Initialize the feedback reporter.
   * @param getGameState Function to capture current game state.
   * @param getScreenshot Function to capture canvas screenshot as base64.
   * @param onClose Callback when feedback modal closes.
   */
  init(
    getGameState: () => GameStateSnapshot,
    getScreenshot: () => Promise<string | null>,
    onClose: () => void,
  ): void {
    this.getGameState = getGameState;
    this.getScreenshot = getScreenshot;
    this.onClose = onClose;

    this.modal = document.getElementById('feedback-modal');
    if (!this.modal) return;

    // Category buttons
    const catButtons = this.modal.querySelectorAll('.feedback-cat');
    catButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedCategory = (btn as HTMLElement).dataset.cat as FeedbackCategory;
        this.showStep2();
      });
    });

    // Cancel
    document.getElementById('feedback-cancel')?.addEventListener('click', () => this.close());

    // Back
    document.getElementById('feedback-back')?.addEventListener('click', () => this.showStep1());

    // Submit
    document.getElementById('feedback-submit')?.addEventListener('click', () => this.submit());

    // Done
    document.getElementById('feedback-done')?.addEventListener('click', () => this.close());

    // Feedback button in pause menu
    document.getElementById('btn-feedback')?.addEventListener('click', () => this.open());
  }

  /** Open the feedback modal. */
  open(): void {
    if (!this.modal) return;
    this.selectedCategory = null;
    this.showStep1();
    this.modal.hidden = false;
    // Hide pause menu
    const pause = document.getElementById('pause-overlay');
    if (pause) pause.hidden = true;
  }

  /** Close the feedback modal. */
  close(): void {
    if (!this.modal) return;
    this.modal.hidden = true;
    this.selectedCategory = null;
    // Clear form
    const titleInput = document.getElementById('feedback-title-input') as HTMLInputElement;
    const descInput = document.getElementById('feedback-desc-input') as HTMLTextAreaElement;
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    this.onClose?.();
  }

  // -------------------------------------------------------------------------
  // Step navigation
  // -------------------------------------------------------------------------

  private showStep1(): void {
    this.setStepVisible(1);
  }

  private showStep2(): void {
    if (!this.selectedCategory) return;
    this.setStepVisible(2);

    // Update form title and placeholders
    const formTitle = document.getElementById('feedback-form-title');
    if (formTitle) formTitle.textContent = CATEGORY_TITLES[this.selectedCategory];

    const ph = CATEGORY_PLACEHOLDERS[this.selectedCategory];
    const titleInput = document.getElementById('feedback-title-input') as HTMLInputElement;
    const descInput = document.getElementById('feedback-desc-input') as HTMLTextAreaElement;
    if (titleInput) titleInput.placeholder = ph.title;
    if (descInput) descInput.placeholder = ph.desc;

    // Focus title input
    setTimeout(() => titleInput?.focus(), 100);
  }

  private showStep3(message: string): void {
    this.setStepVisible(3);
    const text = document.getElementById('feedback-confirm-text');
    if (text) text.textContent = message;
  }

  private showLoading(): void {
    this.setStepVisible('loading');
  }

  private setStepVisible(step: 1 | 2 | 3 | 'loading'): void {
    const s1 = document.getElementById('feedback-step-1');
    const s2 = document.getElementById('feedback-step-2');
    const s3 = document.getElementById('feedback-step-3');
    const sl = document.getElementById('feedback-loading');
    if (s1) s1.hidden = step !== 1;
    if (s2) s2.hidden = step !== 2;
    if (s3) s3.hidden = step !== 3;
    if (sl) sl.hidden = step !== 'loading';
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  private async submit(): Promise<void> {
    if (!this.selectedCategory) return;

    const titleInput = document.getElementById('feedback-title-input') as HTMLInputElement;
    const descInput = document.getElementById('feedback-desc-input') as HTMLTextAreaElement;
    const screenshotCheck = document.getElementById('feedback-screenshot') as HTMLInputElement;
    const gamestateCheck = document.getElementById('feedback-gamestate') as HTMLInputElement;

    const title = titleInput?.value.trim() ?? '';
    const description = descInput?.value.trim() ?? '';

    if (!title && this.selectedCategory !== 'praise') {
      titleInput?.focus();
      return;
    }

    this.showLoading();

    // Capture game state and screenshot
    let gameState: GameStateSnapshot | null = null;
    let screenshot: string | null = null;

    if (gamestateCheck?.checked && this.getGameState) {
      gameState = this.getGameState();
    }

    if (screenshotCheck?.checked && this.getScreenshot) {
      try {
        screenshot = await this.getScreenshot();
      } catch {
        // Screenshot capture failed, continue without
      }
    }

    const payload: FeedbackPayload = {
      title: title || `${CATEGORY_TITLES[this.selectedCategory]} feedback`,
      description,
      category: this.selectedCategory,
      gameState,
      screenshot,
    };

    try {
      const response = await fetch('/api/feedback/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const issueNum = data.issueNumber ? ` (#${data.issueNumber})` : '';
        this.showStep3(`Je feedback is ontvangen${issueNum}. Dankjewel! We kijken ernaar.`);
      } else {
        this.showStep3('Feedback opgeslagen. Bedankt voor je hulp!');
      }
    } catch {
      // Network error -- still thank the user
      this.showStep3('Kon de feedback niet verzenden (geen verbinding). Probeer het later opnieuw.');
    }
  }
}
