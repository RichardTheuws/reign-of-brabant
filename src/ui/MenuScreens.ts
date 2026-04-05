/**
 * MenuScreens.ts -- DOM controllers for main menu, faction select, and loading screens.
 *
 * Each screen is a section in index.html, shown/hidden by the GameState machine.
 * All text is in Dutch as specified.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FactionChoice = 'brabanders' | 'randstad';
export type MenuAction = 'play' | 'campaign' | 'tutorial' | 'settings';

export interface MenuScreenEvents {
  onMenuAction: (action: MenuAction) => void;
  onFactionSelected: (faction: FactionChoice, startTutorial: boolean) => void;
}

// ---------------------------------------------------------------------------
// Loading tips (10 from the 50 in SUB-PRD-UI-UX.md)
// ---------------------------------------------------------------------------

const LOADING_TIPS: string[] = [
  'Boeren kunnen ook vechten in noodgevallen \u2014 maar ze zijn er niet blij mee.',
  'Je kunt meerdere workers op dezelfde resource zetten voor sneller verzamelen.',
  'Gebouwen blokkeren het pad van je eenheden. Plan je basis-layout!',
  'Brabantse eenheden krijgen tot +50% stats als ze bij elkaar blijven.',
  'De Randstad Werkoverleg pauzeert alle productie elke 5 minuten. Het perfecte moment om aan te vallen!',
  'Scouts zijn cruciaal in de vroege game. Ken het terrein voordat je vijand dat doet.',
  'Het Gouden Worstenbroodje werd volgens de legende gesmeed in de ovens van de Sint-Janskathedraal.',
  'Een gemixte legermacht is sterker dan een leger van alleen hetzelfde type.',
  'Ranged eenheden achter melee eenheden plaatsen is een klassieke RTS-strategie die ook hier werkt.',
  'Er zijn verborgen achievements. Blijf experimenteren om ze te ontdekken!',
];

// ---------------------------------------------------------------------------
// Faction data
// ---------------------------------------------------------------------------

interface FactionData {
  id: FactionChoice;
  name: string;
  subtitle: string;
  description: string;
  traits: string[];
  image: string;
  available: boolean;
}

const FACTIONS: FactionData[] = [
  {
    id: 'brabanders',
    name: 'Brabanders',
    subtitle: 'De Gezelligen',
    description: 'Gezelligheid maakt sterk. Brabantse eenheden worden sterker naarmate ze dichter bij elkaar staan. Tot +50% stats bij 20+ units samen.',
    traits: ['Gezelligheid', 'Sterk in groep', 'Carnaval'],
    image: 'assets/factions/brabanders-prins.png',
    available: true,
  },
  {
    id: 'randstad',
    name: 'Randstad',
    subtitle: 'De Efficienten',
    description: 'Bureaucratie overwint alles. Elke actie bouwt Efficientie-stacks op. Na 20 acties zijn ze sneller dan alle andere facties.',
    traits: ['Bureaucratie', 'Efficientie', 'Werkoverleg'],
    image: 'assets/factions/randstad-ceo.png',
    available: true,
  },
];

const LOCKED_FACTIONS = [
  { name: 'Limburgers', version: 'v1.0' },
  { name: 'Belgen', version: 'v2.0' },
];

// ---------------------------------------------------------------------------
// MenuScreens controller
// ---------------------------------------------------------------------------

export class MenuScreens {
  private events: MenuScreenEvents | null = null;
  private selectedFaction: FactionChoice | null = null;
  private currentTipIndex = 0;
  private tipIntervalId = 0;
  private loadingProgress = 0;

  init(events: MenuScreenEvents): void {
    this.events = events;
    this.bindMainMenu();
    this.bindFactionSelect();
  }

  // -----------------------------------------------------------------------
  // Main Menu
  // -----------------------------------------------------------------------

  showMainMenu(): void {
    this.setScreen('main-menu', true);
    this.setScreen('faction-select', false);
    this.setScreen('loading-screen', false);
    // Show HUD-related elements hidden during menu
    this.setGameHUDVisible(false);
  }

  hideMainMenu(): void {
    this.setScreen('main-menu', false);
  }

  // -----------------------------------------------------------------------
  // Faction Select
  // -----------------------------------------------------------------------

  showFactionSelect(): void {
    this.setScreen('main-menu', false);
    this.setScreen('faction-select', true);
    this.setScreen('loading-screen', false);
    this.selectedFaction = null;
    this.updateFactionPreview();
  }

  hideFactionSelect(): void {
    this.setScreen('faction-select', false);
  }

  // -----------------------------------------------------------------------
  // Loading Screen
  // -----------------------------------------------------------------------

  showLoadingScreen(): void {
    this.setScreen('main-menu', false);
    this.setScreen('faction-select', false);

    const el = document.getElementById('loading-screen');
    if (el) {
      el.classList.remove('hidden');
      el.style.display = 'flex';
    }

    this.loadingProgress = 0;
    this.updateLoadingProgress(0, 'Terrein genereren...');

    // Start tip rotation
    this.currentTipIndex = Math.floor(Math.random() * LOADING_TIPS.length);
    this.updateLoadingTip();
    this.tipIntervalId = window.setInterval(() => this.updateLoadingTip(), 5000);
  }

  hideLoadingScreen(): void {
    const el = document.getElementById('loading-screen');
    if (el) {
      el.classList.add('hidden');
      // Actually hide after transition
      setTimeout(() => {
        if (el.classList.contains('hidden')) {
          el.style.display = 'none';
        }
      }, 600);
    }
    if (this.tipIntervalId) {
      clearInterval(this.tipIntervalId);
      this.tipIntervalId = 0;
    }
  }

  updateLoadingProgress(progress: number, label?: string): void {
    this.loadingProgress = progress;
    const bar = document.getElementById('loading-bar-fill');
    const pct = document.getElementById('loading-percentage');
    const lbl = document.getElementById('loading-label');

    if (bar) bar.style.width = `${Math.min(progress * 100, 100)}%`;
    if (pct) pct.textContent = `${Math.floor(progress * 100)}%`;
    if (lbl && label) lbl.textContent = label;
  }

  // -----------------------------------------------------------------------
  // Game HUD visibility
  // -----------------------------------------------------------------------

  setGameHUDVisible(visible: boolean): void {
    const hud = document.getElementById('game-hud');
    if (hud) hud.style.display = visible ? '' : 'none';
  }

  // -----------------------------------------------------------------------
  // Private: Main menu bindings
  // -----------------------------------------------------------------------

  private bindMainMenu(): void {
    const btnPlay = document.getElementById('btn-play');
    const btnCampaign = document.getElementById('btn-campaign');
    const btnTutorial = document.getElementById('btn-tutorial');
    const btnSettings = document.getElementById('btn-settings');

    btnPlay?.addEventListener('click', () => this.events?.onMenuAction('play'));
    btnCampaign?.addEventListener('click', () => this.events?.onMenuAction('campaign'));
    btnTutorial?.addEventListener('click', () => this.events?.onMenuAction('tutorial'));
    btnSettings?.addEventListener('click', () => this.events?.onMenuAction('settings'));
  }

  // -----------------------------------------------------------------------
  // Private: Faction select bindings
  // -----------------------------------------------------------------------

  private bindFactionSelect(): void {
    const backBtn = document.getElementById('faction-back-btn');
    backBtn?.addEventListener('click', () => {
      this.hideFactionSelect();
      this.showMainMenu();
    });

    // Bind faction cards
    for (const faction of FACTIONS) {
      const card = document.getElementById(`faction-card-${faction.id}`);
      card?.addEventListener('click', () => {
        if (!faction.available) return;
        this.selectedFaction = faction.id;
        this.updateFactionPreview();
        this.updateFactionCardSelection();
      });
    }

    // Confirm button
    const confirmBtn = document.getElementById('faction-confirm-btn');
    confirmBtn?.addEventListener('click', () => {
      if (this.selectedFaction) {
        this.events?.onFactionSelected(this.selectedFaction, false);
      }
    });
  }

  private updateFactionCardSelection(): void {
    const cards = document.querySelectorAll('.faction-card');
    for (const card of cards) {
      const el = card as HTMLElement;
      el.classList.toggle('is-selected', el.dataset.faction === this.selectedFaction);
    }
    const confirmBtn = document.getElementById('faction-confirm-btn') as HTMLButtonElement;
    if (confirmBtn) {
      confirmBtn.disabled = !this.selectedFaction;
    }
  }

  private updateFactionPreview(): void {
    const preview = document.getElementById('faction-preview');
    if (!preview) return;

    if (!this.selectedFaction) {
      preview.innerHTML = '<p class="faction-preview-placeholder">Kies een factie om details te zien</p>';
      return;
    }

    const faction = FACTIONS.find(f => f.id === this.selectedFaction);
    if (!faction) return;

    preview.innerHTML = `
      <div class="faction-preview-content">
        <div class="faction-preview-image">
          <img src="${faction.image}" alt="${faction.name}" />
        </div>
        <div class="faction-preview-info">
          <h3 class="faction-preview-name">${faction.name}</h3>
          <p class="faction-preview-subtitle">"${faction.subtitle}"</p>
          <p class="faction-preview-description">${faction.description}</p>
          <div class="faction-preview-traits">
            ${faction.traits.map(t => `<span class="trait-badge">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private updateLoadingTip(): void {
    const tipEl = document.getElementById('loading-tip');
    if (!tipEl) return;
    tipEl.style.opacity = '0';
    setTimeout(() => {
      this.currentTipIndex = (this.currentTipIndex + 1) % LOADING_TIPS.length;
      tipEl.textContent = LOADING_TIPS[this.currentTipIndex];
      tipEl.style.opacity = '1';
    }, 300);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private setScreen(id: string, visible: boolean): void {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = visible ? '' : 'none';
    }
  }

  destroy(): void {
    if (this.tipIntervalId) {
      clearInterval(this.tipIntervalId);
      this.tipIntervalId = 0;
    }
    this.events = null;
  }
}
