/**
 * HUD.ts
 * Pure HTML/CSS overlay HUD manager.
 * Implements the GameUI interface from POC-UI.md.
 * All communication with the game goes through typed callbacks (HUDEvents).
 */

import { audioManager } from '../audio/AudioManager';

// ---------------------------------------------------------------------------
// Types (from POC-UI.md section 5)
// ---------------------------------------------------------------------------

export type Faction = 'brabant' | 'randstad' | 'limburg' | 'belgen';
export type AlertType = 'warning' | 'info' | 'error';

export interface MinimapData {
  mapSize: number;
  units: Array<{ x: number; z: number; factionId: number; isHero: boolean }>;
  buildings: Array<{ x: number; z: number; factionId: number }>;
  resources: Array<{ x: number; z: number }>;
  cameraX: number;
  cameraZ: number;
  cameraViewWidth: number;
  cameraViewHeight: number;
}
export type UnitStatus = 'idle' | 'moving' | 'attacking' | 'gathering' | 'building' | 'fleeing';
export type BuildingType = 'townhall' | 'barracks' | 'lumbercamp' | 'blacksmith';
export type CommandAction =
  | 'move' | 'attack' | 'stop' | 'hold'
  | 'train-worker' | 'train-infantry' | 'train-ranged' | 'rally-point'
  | 'build-townhall' | 'build-barracks' | 'build-lumbercamp' | 'build-blacksmith'
  | 'train-hero-prins' | 'train-hero-boer'
  | 'hero-ability-q' | 'hero-ability-w' | 'hero-ability-e'
  | 'research-upgrade';

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
  portrait: string | null;
}

export interface SelectedBuilding {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  type: BuildingType;
  queue: ProductionQueueItem[];
}

export interface ProductionQueueItem {
  unitName: string;
  progress: number;
  remainingSeconds: number;
}

export interface GameStats {
  durationSeconds: number;
  unitsProduced: number;
  unitsLost: number;
  enemiesKilled: number;
  buildingsBuilt: number;
  buildingsDestroyed: number;
  resourcesGathered: number;
}

export interface HUDEvents {
  onMinimapClick: (x: number, y: number) => void;
  onCommand: (action: CommandAction) => void;
  onPortraitClick: (unitId: number) => void;
  onRetry: () => void;
  onMenu: () => void;
}

// ---------------------------------------------------------------------------
// Emoji map for unit portraits
// ---------------------------------------------------------------------------

const UNIT_EMOJI: Record<string, string> = {
  worker: '\u{1F9D1}\u200D\u{1F33E}',   // farmer
  infantry: '\u2694\uFE0F',               // swords
  ranged: '\u{1F3F9}',                     // bow
  townhall: '\u{1F3F0}',                  // castle
  barracks: '\u2694\uFE0F',               // fallback
  blacksmith: '\u2692\uFE0F',             // hammer and pick
  smederij: '\u2692\uFE0F',              // hammer and pick (Dutch)
  prins: '\u{1F451}',                      // crown
  boer: '\u{1F33E}',                       // ear of rice
  ceo: '\u{1F4BC}',                        // briefcase
  politicus: '\u{1F3DB}\uFE0F',           // classical building
  hero: '\u2B50',                          // star (fallback hero)
};

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

export class HUD {
  // DOM element cache
  private resGold!: HTMLElement;
  private resWood!: HTMLElement;
  private resPop!: HTMLElement;
  private resPopMax!: HTMLElement;
  private resPopItem!: HTMLElement;
  private fpsValue!: HTMLElement;
  private fpsCounter!: HTMLElement;
  private alertContainer!: HTMLElement;
  private selectionPanel!: HTMLElement;
  private unitSingle!: HTMLElement;
  private unitMulti!: HTMLElement;
  private buildingPanel!: HTMLElement;
  private gameOverOverlay!: HTMLElement;
  private gameOverTitle!: HTMLElement;
  private gameOverSubtitle!: HTMLElement;
  private minimapCanvas!: HTMLCanvasElement;
  private minimapCtx!: CanvasRenderingContext2D;

  // Gezelligheid elements
  private resGezelligheid!: HTMLElement;
  private rageBtn!: HTMLButtonElement;
  private rageCooldown!: HTMLElement;
  private rageDuration!: HTMLElement;

  // Single unit elements
  private unitPortrait!: HTMLElement;
  private unitLevel!: HTMLElement;
  private unitName!: HTMLElement;
  private unitHpBar!: HTMLElement;
  private unitHpText!: HTMLElement;
  private statAtk!: HTMLElement;
  private statArm!: HTMLElement;
  private statSpd!: HTMLElement;
  private unitStatus!: HTMLElement;

  // Building elements
  private buildingPortrait!: HTMLElement;
  private buildingName!: HTMLElement;
  private buildingHpBar!: HTMLElement;
  private buildingHpText!: HTMLElement;
  private queueProgress!: HTMLElement;
  private queueLabel!: HTMLElement;
  private queueBar!: HTMLElement;
  private queueTime!: HTMLElement;

  // Multi-select elements
  private multiCount!: HTMLElement;
  private multiGrid!: HTMLElement;

  // Game over stats
  private statDuration!: HTMLElement;
  private statProduced!: HTMLElement;
  private statLost!: HTMLElement;
  private statKilled!: HTMLElement;
  private statBuildings!: HTMLElement;
  private statResources!: HTMLElement;

  // Command panels
  private cmdUnit!: HTMLElement;
  private cmdMulti!: HTMLElement;
  private cmdBuilding!: HTMLElement;
  private cmdWorker!: HTMLElement;

  // Callbacks
  private events: HUDEvents | null = null;

  // Bound handlers for cleanup
  private boundHandlers: Array<{ el: HTMLElement | Document; event: string; handler: EventListener }> = [];

  // Alert auto-dismiss timers
  private alertTimers: number[] = [];

  // -----------------------------------------------------------------------
  // Initialization
  // -----------------------------------------------------------------------

  init(events: HUDEvents): void {
    this.events = events;

    // Cache all DOM references
    this.resGold = this.el('res-gold');
    this.resWood = this.el('res-wood');
    this.resPop = this.el('res-pop');
    this.resPopMax = this.el('res-pop-max');
    this.resPopItem = document.querySelector('.resource-item[data-resource="population"]') as HTMLElement;
    this.fpsValue = this.el('fps-value');
    this.fpsCounter = this.el('fps-counter');
    this.alertContainer = this.el('alert-container');
    this.selectionPanel = this.el('selection-panel');
    this.unitSingle = this.el('unit-single');
    this.unitMulti = this.el('unit-multi');
    this.buildingPanel = this.el('building-panel');
    this.gameOverOverlay = this.el('game-over');
    this.gameOverTitle = this.el('game-over-title');
    this.gameOverSubtitle = this.el('game-over-subtitle');
    this.minimapCanvas = this.el('minimap-canvas') as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;

    // Gezelligheid
    this.resGezelligheid = this.el('res-gezelligheid');
    this.rageBtn = this.el('rage-btn') as HTMLButtonElement;
    this.rageCooldown = this.el('rage-cooldown');
    this.rageDuration = this.el('rage-duration');

    // Single unit
    this.unitPortrait = this.el('unit-portrait');
    this.unitLevel = this.el('unit-level');
    this.unitName = this.el('unit-name');
    this.unitHpBar = this.el('unit-hp-bar');
    this.unitHpText = this.el('unit-hp-text');
    this.statAtk = this.el('stat-atk');
    this.statArm = this.el('stat-arm');
    this.statSpd = this.el('stat-spd');
    this.unitStatus = this.el('unit-status');

    // Building
    this.buildingPortrait = this.el('building-portrait');
    this.buildingName = this.el('building-name');
    this.buildingHpBar = this.el('building-hp-bar');
    this.buildingHpText = this.el('building-hp-text');
    this.queueProgress = document.querySelector('.queue-progress') as HTMLElement;
    this.queueLabel = this.el('queue-label');
    this.queueBar = this.el('queue-bar');
    this.queueTime = this.el('queue-time');

    // Multi
    this.multiCount = this.el('multi-count');
    this.multiGrid = this.el('multi-grid');

    // Game over stats
    this.statDuration = this.el('stat-duration');
    this.statProduced = this.el('stat-produced');
    this.statLost = this.el('stat-lost');
    this.statKilled = this.el('stat-killed');
    this.statBuildings = this.el('stat-buildings');
    this.statResources = this.el('stat-resources');

    // Command panels
    this.cmdUnit = this.el('cmd-unit');
    this.cmdMulti = this.el('cmd-multi');
    this.cmdBuilding = this.el('cmd-building');
    this.cmdWorker = this.el('cmd-worker');

    // Bind event listeners
    this.bindCommandButtons();
    this.bindMinimapClick();
    this.bindGameOverButtons();
    this.bindHotkeys();
    this.bindRageButton();
    this.bindMuteButton();
  }

  // -----------------------------------------------------------------------
  // Resource bar
  // -----------------------------------------------------------------------

  updateResources(gold: number, wood: number, pop: number, maxPop: number): void {
    this.resGold.textContent = String(Math.floor(gold));
    this.resWood.textContent = String(Math.floor(wood));
    this.resPop.textContent = String(pop);
    this.resPopMax.textContent = String(maxPop);

    // Population cap warning
    if (this.resPopItem) {
      if (pop >= maxPop) {
        this.resPopItem.classList.add('is-capped');
      } else {
        this.resPopItem.classList.remove('is-capped');
      }
    }
  }

  // -----------------------------------------------------------------------
  // Gezelligheid meter
  // -----------------------------------------------------------------------

  updateGezelligheid(
    current: number,
    rageCost: number,
    rageActive: boolean,
    rageDurationRemaining: number,
    rageCooldownRemaining: number,
  ): void {
    this.resGezelligheid.textContent = String(Math.floor(current));

    // Update rage button state
    if (this.rageBtn) {
      if (rageActive) {
        this.rageBtn.disabled = true;
        this.rageBtn.classList.add('is-active');
        this.rageBtn.classList.remove('is-cooldown');
      } else if (rageCooldownRemaining > 0) {
        this.rageBtn.disabled = true;
        this.rageBtn.classList.remove('is-active');
        this.rageBtn.classList.add('is-cooldown');
      } else if (current >= rageCost) {
        this.rageBtn.disabled = false;
        this.rageBtn.classList.remove('is-active', 'is-cooldown');
      } else {
        this.rageBtn.disabled = true;
        this.rageBtn.classList.remove('is-active', 'is-cooldown');
      }
    }

    // Update duration/cooldown displays
    if (this.rageDuration) {
      if (rageActive) {
        this.rageDuration.textContent = `${Math.ceil(rageDurationRemaining)}s`;
        this.rageDuration.hidden = false;
      } else {
        this.rageDuration.hidden = true;
      }
    }

    if (this.rageCooldown) {
      if (!rageActive && rageCooldownRemaining > 0) {
        this.rageCooldown.textContent = `${Math.ceil(rageCooldownRemaining)}s`;
        this.rageCooldown.hidden = false;
      } else {
        this.rageCooldown.hidden = true;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Unit panel
  // -----------------------------------------------------------------------

  showUnitPanel(units: SelectedUnit[]): void {
    this.selectionPanel.hidden = false;
    this.buildingPanel.hidden = true;
    this.cmdWorker.hidden = true;

    if (units.length === 0) {
      this.hideSelectionPanel();
      return;
    }

    if (units.length === 1) {
      this.showSingleUnit(units[0]);
    } else {
      this.showMultiUnit(units);
    }
  }

  private showSingleUnit(unit: SelectedUnit): void {
    this.unitSingle.hidden = false;
    this.unitMulti.hidden = true;
    this.cmdUnit.hidden = false;
    this.cmdMulti.hidden = true;

    // Portrait
    const placeholder = this.unitPortrait.querySelector('.portrait-placeholder') as HTMLElement;
    const existing = this.unitPortrait.querySelector('img');
    if (unit.portrait) {
      if (existing) {
        existing.src = unit.portrait;
      } else {
        const img = document.createElement('img');
        img.src = unit.portrait;
        img.alt = unit.name;
        this.unitPortrait.appendChild(img);
        if (placeholder) placeholder.style.display = 'none';
      }
    } else {
      if (existing) existing.remove();
      if (placeholder) {
        placeholder.style.display = '';
        placeholder.textContent = this.getUnitEmoji(unit.name);
      }
    }

    this.unitLevel.textContent = String(unit.level);
    this.unitName.textContent = unit.name;

    // HP bar
    const ratio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
    this.unitHpBar.style.width = `${ratio * 100}%`;
    this.unitHpBar.className = 'unit-hp-bar ' + this.getHpClass(ratio);
    this.unitHpText.textContent = `${Math.ceil(unit.hp)} / ${unit.maxHp}`;

    // Stats
    this.statAtk.textContent = String(unit.atk);
    this.statArm.textContent = String(unit.arm);
    this.statSpd.textContent = String(unit.spd);
    this.unitStatus.textContent = this.capitalise(unit.status);
  }

  private showMultiUnit(units: SelectedUnit[]): void {
    this.unitSingle.hidden = true;
    this.unitMulti.hidden = false;
    this.cmdUnit.hidden = true;
    this.cmdMulti.hidden = false;

    this.multiCount.textContent = String(units.length);

    // Clear and repopulate portrait grid
    this.multiGrid.innerHTML = '';
    const max = Math.min(units.length, MAX_MULTI_PORTRAITS);
    for (let i = 0; i < max; i++) {
      const unit = units[i];
      const div = document.createElement('div');
      div.className = 'multi-portrait';
      div.dataset.unitId = String(unit.id);

      if (unit.portrait) {
        const img = document.createElement('img');
        img.src = unit.portrait;
        img.alt = unit.name;
        div.appendChild(img);
      } else {
        const span = document.createElement('span');
        span.className = 'portrait-placeholder portrait-placeholder--sm';
        span.textContent = this.getUnitEmoji(unit.name);
        div.appendChild(span);
      }

      // Mini HP bar
      const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
      const hpBar = document.createElement('div');
      hpBar.className = 'multi-hp-bar';
      hpBar.style.width = `${hpRatio * 100}%`;
      hpBar.style.background = this.getHpColor(hpRatio);
      div.appendChild(hpBar);

      // Click handler
      div.addEventListener('click', () => {
        this.events?.onPortraitClick(unit.id);
      });

      this.multiGrid.appendChild(div);
    }
  }

  showWorkerCommands(): void {
    this.cmdWorker.hidden = false;
    this.cmdUnit.hidden = true;
  }

  // -----------------------------------------------------------------------
  // Building panel
  // -----------------------------------------------------------------------

  showBuildingPanel(building: SelectedBuilding): void {
    this.selectionPanel.hidden = false;
    this.unitSingle.hidden = true;
    this.unitMulti.hidden = true;
    this.buildingPanel.hidden = false;
    this.cmdUnit.hidden = true;
    this.cmdMulti.hidden = true;
    this.cmdWorker.hidden = true;
    this.cmdBuilding.hidden = false;

    this.buildingName.textContent = building.name;

    // HP bar
    const ratio = building.maxHp > 0 ? building.hp / building.maxHp : 0;
    this.buildingHpBar.style.width = `${ratio * 100}%`;
    this.buildingHpBar.className = 'unit-hp-bar ' + this.getHpClass(ratio);
    this.buildingHpText.textContent = `${Math.ceil(building.hp)} / ${building.maxHp}`;

    // Production queue
    if (building.queue.length > 0) {
      const current = building.queue[0];
      this.queueProgress.hidden = false;
      this.queueLabel.textContent = current.unitName;
      this.queueBar.style.width = `${current.progress * 100}%`;
      this.queueTime.textContent = `${Math.ceil(current.remainingSeconds)}s`;
    } else {
      this.queueProgress.hidden = true;
    }
  }

  updateProductionQueue(progress: number, label: string, remainingSeconds: number): void {
    if (!this.queueProgress) return;
    this.queueProgress.hidden = false;
    this.queueLabel.textContent = label;
    this.queueBar.style.width = `${Math.min(progress, 1) * 100}%`;
    this.queueTime.textContent = `${Math.ceil(remainingSeconds)}s`;
  }

  // -----------------------------------------------------------------------
  // Blacksmith research panel
  // -----------------------------------------------------------------------

  /**
   * Show upgrade buttons for a selected Blacksmith.
   * @param upgrades - Array of upgrade data to show as buttons
   * @param researchProgress - Current research in progress (or null)
   * @param onResearch - Callback when player clicks an upgrade button
   */
  showBlacksmithPanel(
    upgrades: Array<{
      id: number;
      name: string;
      description: string;
      costGold: number;
      canAfford: boolean;
      canResearch: boolean;
      isResearched: boolean;
    }>,
    researchProgress: { name: string; progress: number; remaining: number } | null,
    onResearch: (upgradeId: number) => void,
  ): void {
    const panel = document.getElementById('cmd-blacksmith');
    if (!panel) return;

    panel.hidden = false;
    panel.innerHTML = '';

    // If currently researching, show progress bar
    if (researchProgress) {
      const progressDiv = document.createElement('div');
      progressDiv.className = 'blacksmith-research-progress';
      progressDiv.innerHTML = `
        <div class="research-label">\u2692\uFE0F ${this.escapeHtml(researchProgress.name)}</div>
        <div class="research-bar-container">
          <div class="research-bar" style="width:${Math.min(researchProgress.progress, 1) * 100}%"></div>
        </div>
        <div class="research-time">${Math.ceil(researchProgress.remaining)}s</div>
      `;
      panel.appendChild(progressDiv);
    }

    // Upgrade buttons
    for (const upg of upgrades) {
      const btn = document.createElement('button');
      btn.className = 'cmd-btn cmd-btn--research';
      btn.disabled = !upg.canResearch || !upg.canAfford || upg.isResearched || researchProgress !== null;

      if (upg.isResearched) {
        btn.classList.add('is-researched');
      }
      if (!upg.canResearch && !upg.isResearched) {
        btn.classList.add('is-locked');
      }

      btn.innerHTML = `
        <span class="btn-icon">\u2692\uFE0F</span>
        <span class="research-name">${this.escapeHtml(upg.name)}</span>
        <span class="research-cost">${upg.isResearched ? '\u2714' : upg.costGold + 'g'}</span>
      `;
      btn.title = `${upg.name}\n${upg.description}\nKosten: ${upg.costGold} goud`;

      if (!upg.isResearched && upg.canResearch) {
        btn.addEventListener('click', () => {
          audioManager.playSound('click');
          onResearch(upg.id);
        });
      }

      panel.appendChild(btn);
    }
  }

  /** Hide the Blacksmith research panel. */
  hideBlacksmithPanel(): void {
    const panel = document.getElementById('cmd-blacksmith');
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }
  }

  // -----------------------------------------------------------------------
  // Selection panel visibility
  // -----------------------------------------------------------------------

  hideSelectionPanel(): void {
    this.selectionPanel.hidden = true;
    this.unitSingle.hidden = true;
    this.unitMulti.hidden = true;
    this.buildingPanel.hidden = true;
  }

  // -----------------------------------------------------------------------
  // Alerts
  // -----------------------------------------------------------------------

  showAlert(message: string, type: AlertType = 'info'): void {
    // Audio feedback based on alert type
    if (type === 'warning' || type === 'error') {
      audioManager.playSound('error');
    }

    const alert = document.createElement('div');
    alert.className = `alert alert--${type}`;
    alert.setAttribute('role', 'alert');

    const iconMap: Record<AlertType, string> = {
      warning: '\u26A0\uFE0F',
      info: '\u2139\uFE0F',
      error: '\u274C',
    };

    alert.innerHTML = `
      <span class="alert__icon">${iconMap[type]}</span>
      <span class="alert__message">${this.escapeHtml(message)}</span>
    `;

    this.alertContainer.appendChild(alert);

    // Auto-dismiss after 3 seconds
    const timer = window.setTimeout(() => {
      alert.classList.add('is-leaving');
      window.setTimeout(() => {
        alert.remove();
      }, 250);
    }, 3000);
    this.alertTimers.push(timer);
  }

  // -----------------------------------------------------------------------
  // Minimap
  // -----------------------------------------------------------------------

  getMinimapCanvas(): HTMLCanvasElement {
    return this.minimapCanvas;
  }

  updateMinimap(data: MinimapData): void {
    const ctx = this.minimapCtx;
    if (!ctx) return;

    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const mapSize = data.mapSize || 1;

    // 1. Background (terrain)
    ctx.fillStyle = '#2a4a28';
    ctx.fillRect(0, 0, w, h);

    // Precompute scale factors
    const sx = w / mapSize;
    const sy = h / mapSize;

    // 2. Resources (gold mines) - yellow dots
    ctx.fillStyle = '#f0d060';
    for (let i = 0, len = data.resources.length; i < len; i++) {
      const r = data.resources[i];
      const mx = r.x * sx;
      const my = r.z * sy;
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, TWO_PI);
      ctx.fill();
    }

    // 3. Buildings - larger squares (4x4 px)
    for (let i = 0, len = data.buildings.length; i < len; i++) {
      const b = data.buildings[i];
      ctx.fillStyle = b.factionId === 0 ? '#ff8830' : '#4070bb';
      const mx = b.x * sx;
      const my = b.z * sy;
      ctx.fillRect(mx - 2, my - 2, 4, 4);
    }

    // 4. Units - small dots
    for (let i = 0, len = data.units.length; i < len; i++) {
      const u = data.units[i];
      const isPlayer = u.factionId === 0;
      const color = isPlayer ? '#ff8830' : '#4070bb';
      const mx = u.x * sx;
      const my = u.z * sy;

      if (u.isHero && isPlayer) {
        // Hero: larger dot with white outline
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, TWO_PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, TWO_PI);
        ctx.fill();
      }
    }

    // 5. Camera viewport - white rectangle outline
    const camX = data.cameraX * sx;
    const camY = data.cameraZ * sy;
    const camW = data.cameraViewWidth * sx;
    const camH = data.cameraViewHeight * sy;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      camX - camW * 0.5,
      camY - camH * 0.5,
      camW,
      camH,
    );
  }

  // -----------------------------------------------------------------------
  // Game over
  // -----------------------------------------------------------------------

  showGameOver(victory: boolean, stats: GameStats): void {
    this.gameOverOverlay.hidden = false;
    this.gameOverOverlay.classList.toggle('is-victory', victory);
    this.gameOverOverlay.classList.toggle('is-defeat', !victory);

    this.gameOverTitle.textContent = victory ? 'OVERWINNING!' : 'VERSLAGEN';
    this.gameOverSubtitle.textContent = victory ? 'Brabant is veilig!' : 'Brabant is gevallen...';

    this.statDuration.textContent = this.formatTime(stats.durationSeconds);
    this.statProduced.textContent = String(stats.unitsProduced);
    this.statLost.textContent = String(stats.unitsLost);
    this.statKilled.textContent = String(stats.enemiesKilled);
    this.statBuildings.textContent = String(stats.buildingsBuilt);
    this.statResources.textContent = String(stats.resourcesGathered);
  }

  hideGameOver(): void {
    this.gameOverOverlay.hidden = true;
    this.gameOverOverlay.classList.remove('is-victory', 'is-defeat');
  }

  // -----------------------------------------------------------------------
  // FPS counter
  // -----------------------------------------------------------------------

  updateFPS(fps: number): void {
    this.fpsValue.textContent = String(Math.round(fps));
  }

  setFPSVisible(visible: boolean): void {
    this.fpsCounter.hidden = !visible;
  }

  // -----------------------------------------------------------------------
  // Faction theming
  // -----------------------------------------------------------------------

  setFaction(faction: Faction): void {
    document.body.dataset.faction = faction;
  }

  // -----------------------------------------------------------------------
  // Command enable/disable
  // -----------------------------------------------------------------------

  setCommandEnabled(action: CommandAction, enabled: boolean): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`);
    for (const btn of buttons) {
      btn.disabled = !enabled;
    }
  }

  // -----------------------------------------------------------------------
  // Event binding (private)
  // -----------------------------------------------------------------------

  private bindCommandButtons(): void {
    const allButtons = document.querySelectorAll<HTMLButtonElement>('.cmd-btn');
    for (const btn of allButtons) {
      const action = btn.dataset.action as CommandAction | undefined;
      if (!action) continue;
      const handler = () => {
        audioManager.playSound('click');
        this.events?.onCommand(action);
      };
      btn.addEventListener('click', handler);
      this.boundHandlers.push({ el: btn, event: 'click', handler: handler as EventListener });
    }
  }

  private bindMinimapClick(): void {
    const handler = (e: Event) => {
      const me = e as MouseEvent;
      const rect = this.minimapCanvas.getBoundingClientRect();
      const x = (me.clientX - rect.left) / rect.width;
      const y = (me.clientY - rect.top) / rect.height;
      this.events?.onMinimapClick(x, y);
    };
    this.minimapCanvas.addEventListener('click', handler as EventListener);
    this.boundHandlers.push({ el: this.minimapCanvas, event: 'click', handler: handler as EventListener });
  }

  private bindRageButton(): void {
    if (this.rageBtn) {
      const handler = () => {
        // Simulate pressing R key -- Game.ts handles the actual activation
        const event = new KeyboardEvent('keydown', { code: 'KeyR', bubbles: true });
        window.dispatchEvent(event);
      };
      this.rageBtn.addEventListener('click', handler);
      this.boundHandlers.push({ el: this.rageBtn, event: 'click', handler: handler as EventListener });
    }
  }

  private bindMuteButton(): void {
    const muteBtn = document.getElementById('audio-mute-btn');
    if (muteBtn) {
      const handler = () => {
        const muted = audioManager.toggleMute();
        muteBtn.textContent = muted ? '\u{1F507}' : '\u{1F50A}';
        muteBtn.classList.toggle('is-muted', muted);
      };
      muteBtn.addEventListener('click', handler);
      this.boundHandlers.push({ el: muteBtn, event: 'click', handler: handler as EventListener });

      // Also bind M key for mute toggle
      const keyHandler = (e: Event) => {
        if ((e as KeyboardEvent).code === 'KeyM') {
          handler();
        }
      };
      document.addEventListener('keydown', keyHandler);
      this.boundHandlers.push({ el: document as unknown as HTMLElement, event: 'keydown', handler: keyHandler as EventListener });
    }
  }

  private bindGameOverButtons(): void {
    const retry = document.getElementById('btn-retry');
    const menu = document.getElementById('btn-menu');

    if (retry) {
      const handler = () => this.events?.onRetry();
      retry.addEventListener('click', handler);
      this.boundHandlers.push({ el: retry, event: 'click', handler: handler as EventListener });
    }

    if (menu) {
      const handler = () => this.events?.onMenu();
      menu.addEventListener('click', handler);
      this.boundHandlers.push({ el: menu, event: 'click', handler: handler as EventListener });
    }
  }

  private bindHotkeys(): void {
    // Note: Q/W/E/R conflict with WASD camera controls.
    // We only bind non-conflicting keys.
    const hotkeyMap: Record<string, CommandAction> = {
      KeyQ: this.getHotkeyAction('Q'),
      KeyE: this.getHotkeyAction('E'),
      // KeyR now reserved for Carnavalsrage ability (handled by Game.ts)
      // KeyW intentionally excluded -- conflicts with camera forward
    };

    const handler = (e: Event) => {
      const ke = e as KeyboardEvent;
      // Only fire hotkeys when not in a text input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const action = hotkeyMap[ke.code];
      if (action) {
        this.events?.onCommand(action);
        // Visual feedback: briefly highlight the button
        this.flashHotkeyButton(ke.code);
      }
    };
    document.addEventListener('keydown', handler as EventListener);
    this.boundHandlers.push({ el: document as unknown as HTMLElement, event: 'keydown', handler: handler as EventListener });
  }

  /**
   * Map keyboard code to the currently-visible command action.
   * The hotkey depends on which command panel is visible.
   */
  private getHotkeyAction(hotkey: string): CommandAction {
    // Default mapping (unit context)
    const map: Record<string, CommandAction> = {
      Q: 'move',
      W: 'attack',
      E: 'stop',
      R: 'hold',
    };
    return map[hotkey] ?? 'stop';
  }

  private flashHotkeyButton(keyCode: string): void {
    const hotkeyChar = keyCode.replace('Key', '');
    const btn = document.querySelector<HTMLButtonElement>(`.cmd-btn[data-hotkey="${hotkeyChar}"]`);
    if (btn && !btn.hidden) {
      btn.style.background = 'rgba(212, 168, 83, 0.25)';
      window.setTimeout(() => {
        btn.style.background = '';
      }, 120);
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private el(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`[HUD] Element with id "${id}" not found`);
      return document.createElement('span'); // fallback
    }
    return element;
  }

  private getHpClass(ratio: number): string {
    if (ratio > 0.6) return 'hp-high';
    if (ratio > 0.3) return 'hp-mid';
    return 'hp-low';
  }

  private getHpColor(ratio: number): string {
    if (ratio > 0.6) return 'var(--color-hp-high)';
    if (ratio > 0.3) return 'var(--color-hp-mid)';
    return 'var(--color-hp-low)';
  }

  private getUnitEmoji(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(UNIT_EMOJI)) {
      if (lower.includes(key)) return emoji;
    }
    return '?';
  }

  private capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  destroy(): void {
    for (const { el, event, handler } of this.boundHandlers) {
      el.removeEventListener(event, handler);
    }
    this.boundHandlers.length = 0;

    for (const timer of this.alertTimers) {
      window.clearTimeout(timer);
    }
    this.alertTimers.length = 0;

    this.events = null;
  }
}

// ---------------------------------------------------------------------------
// Constants used in the module
// ---------------------------------------------------------------------------

const MAX_MULTI_PORTRAITS = 24;
const TWO_PI = Math.PI * 2;
