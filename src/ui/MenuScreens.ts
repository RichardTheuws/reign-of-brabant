/**
 * MenuScreens.ts -- DOM controllers for main menu, faction select, loading screens, and settings.
 *
 * Each screen is a section in index.html, shown/hidden by the GameState machine.
 * All text is in Dutch as specified.
 */

import { audioManager } from '../audio/AudioManager';
import { MUSIC_IDS } from '../systems/MusicSystem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FactionChoice = 'brabanders' | 'randstad' | 'limburgers' | 'belgen';
export type MenuAction = 'play' | 'campaign' | 'tutorial' | 'settings';

export type MapTemplateChoice = 'classic' | 'crossroads' | 'islands' | 'arena' | 'fortress' | 'river-valley';
export type DifficultyChoice = 'easy' | 'normal' | 'hard';

export interface MenuScreenEvents {
  onMenuAction: (action: MenuAction) => void;
  onFactionSelected: (faction: FactionChoice, startTutorial: boolean, mapTemplate: MapTemplateChoice, difficulty: DifficultyChoice) => void;
}

interface MapTemplateData {
  id: MapTemplateChoice;
  name: string;
  description: string;
  features: string[];
}

// ---------------------------------------------------------------------------
// Settings persistence
// ---------------------------------------------------------------------------

const SETTINGS_KEY = 'rob-settings';

interface GameSettings {
  musicVolume: number;   // 0-100
  sfxVolume: number;     // 0-100
  ambientVolume: number; // 0-100
  shadows: boolean;
  bloom: boolean;
  particles: boolean;
  edgeScroll: boolean;
  grid: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 40,
  sfxVolume: 70,
  ambientVolume: 30,
  shadows: true,
  bloom: true,
  particles: true,
  edgeScroll: true,
  grid: false,
};

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch { /* ignore corrupt data */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* storage full / private mode */ }
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
  {
    id: 'limburgers',
    name: 'De Limburgers',
    subtitle: 'Meesters van de Ondergrond',
    description: 'Vanuit hun uitgebreide mijnnetwerk beheersen de Limburgers het ondergrondse. Hun tunnels maken verrassingsaanvallen mogelijk die geen vijand ziet aankomen. Met Kolen als brandstof voor hun industrie bouwen ze een onzichtbaar imperium.',
    traits: ['Tunnelnetwerk', 'Verrassingsaanvallen', 'Kolen-economie', 'Defensief sterk'],
    image: 'assets/factions/limburgers-mijnbaas.png',
    available: true,
  },
  {
    id: 'belgen',
    name: 'De Belgen',
    subtitle: 'Diplomaten en Compromismeesters',
    description: 'Waarom vechten als ge kunt onderhandelen? De Belgen winnen oorlogen met woorden, Chocolade en eindeloos overleg. Hun Commissies vertragen vijanden, hun Compromissen kopen tijd, en hun Chocolade-Overtuiging steelt vijandelijke eenheden.',
    traits: ['Diplomatie', 'Compromis-abilities', 'Chocolade-overtuiging', 'Commissie-sabotage'],
    image: 'assets/factions/belgen-frietkoning.png',
    available: true,
  },
];

const MAP_TEMPLATES: MapTemplateData[] = [
  {
    id: 'classic',
    name: 'Klassiek',
    description: 'Diagonale verdeling met rivier en bruggen. Gebalanceerd voor beginners.',
    features: ['Rivier', '2 Bruggen', 'Tunnels'],
  },
  {
    id: 'crossroads',
    name: 'Kruispunt',
    description: 'Vier wegen kruisen in het midden. Snelle gevechten om controle.',
    features: ['4-weg', 'Stedelijk', 'Tunnels'],
  },
  {
    id: 'islands',
    name: 'Eilanden',
    description: 'Vier eilanden gescheiden door water. Bruggen zijn strategische chokepunten.',
    features: ['Water', '4 Bruggen', 'Tunnels'],
  },
  {
    id: 'arena',
    name: 'Arena',
    description: 'Circulaire arena met rotswanden. Snelle, agressieve gevechten.',
    features: ['Rotsring', 'Compact', 'Snel'],
  },
  {
    id: 'fortress',
    name: 'Fort',
    description: 'Centraal fort met 4 poorten. Beleg of verdedig het hart van de kaart.',
    features: ['Fort', '4 Poorten', 'Beleg'],
  },
  {
    id: 'river-valley',
    name: 'Rivierdal',
    description: 'Brede rivier verdeelt de kaart. Wie de bruggen controleert, wint.',
    features: ['Brede rivier', '5 Bruggen', 'Flanken'],
  },
];

// ---------------------------------------------------------------------------
// MenuScreens controller
// ---------------------------------------------------------------------------

export class MenuScreens {
  private events: MenuScreenEvents | null = null;
  private selectedFaction: FactionChoice | null = null;
  private selectedMap: MapTemplateChoice = 'classic';
  private selectedDifficulty: DifficultyChoice = 'normal';
  private currentTipIndex = 0;
  private tipIntervalId = 0;
  private loadingProgress = 0;
  private settings: GameSettings;

  constructor() {
    this.settings = loadSettings();
  }

  init(events: MenuScreenEvents): void {
    this.events = events;
    this.bindMainMenu();
    this.bindFactionSelect();
    this.bindSettings();
    this.applySettings();
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
    // Play menu music (AudioManager handles crossfade if music already playing)
    audioManager.playMusic(MUSIC_IDS.MAIN_MENU, true, 2000);
  }

  hideMainMenu(): void {
    this.setScreen('main-menu', false);
    // Stop menu music (game will start its own faction theme via MusicSystem)
    audioManager.stopMusic(1500);
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
    if (hud) hud.style.display = visible ? 'block' : 'none';
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
    btnSettings?.addEventListener('click', () => this.showSettings());
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
        this.events?.onFactionSelected(this.selectedFaction, false, this.selectedMap, this.selectedDifficulty);
      }
    });

    // Map template cards
    for (const tpl of MAP_TEMPLATES) {
      const card = document.getElementById(`map-card-${tpl.id}`);
      card?.addEventListener('click', () => {
        this.selectedMap = tpl.id;
        this.updateMapCardSelection();
      });
    }

    // Difficulty buttons
    for (const diff of ['easy', 'normal', 'hard'] as DifficultyChoice[]) {
      const btn = document.getElementById(`diff-${diff}`);
      btn?.addEventListener('click', () => {
        this.selectedDifficulty = diff;
        this.updateDifficultySelection();
      });
    }
  }

  private updateMapCardSelection(): void {
    const cards = document.querySelectorAll('.map-card');
    for (const card of cards) {
      const el = card as HTMLElement;
      el.classList.toggle('is-selected', el.dataset.map === this.selectedMap);
    }
    // Enable confirm if faction also selected
    const confirmBtn = document.getElementById('faction-confirm-btn') as HTMLButtonElement | null;
    if (confirmBtn) confirmBtn.disabled = !this.selectedFaction;
  }

  private updateDifficultySelection(): void {
    for (const diff of ['easy', 'normal', 'hard']) {
      const btn = document.getElementById(`diff-${diff}`);
      btn?.classList.toggle('is-selected', diff === this.selectedDifficulty);
    }
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
  // Settings
  // -----------------------------------------------------------------------

  private showSettings(): void {
    const panel = document.getElementById('settings-panel');
    if (panel) {
      panel.hidden = false;
    }
  }

  private hideSettings(): void {
    const panel = document.getElementById('settings-panel');
    if (panel) {
      panel.hidden = true;
    }
  }

  private bindSettings(): void {
    const backBtn = document.getElementById('settings-back');
    backBtn?.addEventListener('click', () => this.hideSettings());

    // Audio sliders
    this.bindSlider('setting-music', 'setting-music-val', (val) => {
      this.settings.musicVolume = val;
      audioManager.setCategoryVolume('music', val / 100);
      this.persistSettings();
    });
    this.bindSlider('setting-sfx', 'setting-sfx-val', (val) => {
      this.settings.sfxVolume = val;
      audioManager.setCategoryVolume('sfx', val / 100);
      this.persistSettings();
    });
    this.bindSlider('setting-ambient', 'setting-ambient-val', (val) => {
      this.settings.ambientVolume = val;
      audioManager.setCategoryVolume('ambient', val / 100);
      this.persistSettings();
    });

    // Graphics checkboxes
    this.bindCheckbox('setting-shadows', (checked) => {
      this.settings.shadows = checked;
      this.persistSettings();
    });
    this.bindCheckbox('setting-bloom', (checked) => {
      this.settings.bloom = checked;
      this.persistSettings();
    });
    this.bindCheckbox('setting-particles', (checked) => {
      this.settings.particles = checked;
      this.persistSettings();
    });

    // Gameplay checkboxes
    this.bindCheckbox('setting-edge-scroll', (checked) => {
      this.settings.edgeScroll = checked;
      this.persistSettings();
    });
    this.bindCheckbox('setting-grid', (checked) => {
      this.settings.grid = checked;
      this.persistSettings();
    });
  }

  /**
   * Apply persisted settings to UI controls and audio system on init.
   */
  private applySettings(): void {
    const s = this.settings;

    // Sliders
    this.setSliderValue('setting-music', 'setting-music-val', s.musicVolume);
    this.setSliderValue('setting-sfx', 'setting-sfx-val', s.sfxVolume);
    this.setSliderValue('setting-ambient', 'setting-ambient-val', s.ambientVolume);

    // Audio system
    audioManager.setCategoryVolume('music', s.musicVolume / 100);
    audioManager.setCategoryVolume('sfx', s.sfxVolume / 100);
    audioManager.setCategoryVolume('ambient', s.ambientVolume / 100);

    // Checkboxes
    this.setCheckboxValue('setting-shadows', s.shadows);
    this.setCheckboxValue('setting-bloom', s.bloom);
    this.setCheckboxValue('setting-particles', s.particles);
    this.setCheckboxValue('setting-edge-scroll', s.edgeScroll);
    this.setCheckboxValue('setting-grid', s.grid);
  }

  private bindSlider(sliderId: string, labelId: string, onChange: (val: number) => void): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement | null;
    const label = document.getElementById(labelId);
    if (!slider) return;
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      if (label) label.textContent = `${val}%`;
      onChange(val);
    });
  }

  private bindCheckbox(id: string, onChange: (checked: boolean) => void): void {
    const cb = document.getElementById(id) as HTMLInputElement | null;
    if (!cb) return;
    cb.addEventListener('change', () => onChange(cb.checked));
  }

  private setSliderValue(sliderId: string, labelId: string, value: number): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement | null;
    const label = document.getElementById(labelId);
    if (slider) slider.value = String(value);
    if (label) label.textContent = `${value}%`;
  }

  private setCheckboxValue(id: string, checked: boolean): void {
    const cb = document.getElementById(id) as HTMLInputElement | null;
    if (cb) cb.checked = checked;
  }

  private persistSettings(): void {
    saveSettings(this.settings);
  }

  /**
   * Expose current settings for other systems to read (graphics, gameplay).
   */
  getSettings(): Readonly<GameSettings> {
    return this.settings;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private setScreen(id: string, visible: boolean): void {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = visible ? 'flex' : 'none';
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
