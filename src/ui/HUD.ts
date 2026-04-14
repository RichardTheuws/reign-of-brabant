/**
 * HUD.ts
 * Pure HTML/CSS overlay HUD manager.
 * Implements the GameUI interface from POC-UI.md.
 * All communication with the game goes through typed callbacks (HUDEvents).
 */

import { audioManager } from '../audio/AudioManager';
import {
  UNIT_ARCHETYPES,
  BUILDING_ARCHETYPES,
} from '../entities/archetypes';
import { UnitTypeId, BuildingTypeId } from '../types/index';
import { createCommandIcon, replaceIconText } from './CommandIcons';
import { createBuildingPortraitImg } from './BuildingPortraits';

// ---------------------------------------------------------------------------
// Command icon image mapping — fal.ai generated painted icons
// ---------------------------------------------------------------------------

const COMMAND_ICON_IMAGES: Record<string, string> = {
  WRK: '/assets/ui/commands/cmd-worker.png',
  INF: '/assets/ui/commands/cmd-infantry.png',
  RNG: '/assets/ui/commands/cmd-ranged.png',
  H1:  '/assets/ui/commands/cmd-hero.png',
  H2:  '/assets/ui/commands/cmd-hero.png',
  RLY: '/assets/ui/commands/cmd-rally.png',
  UPG: '/assets/ui/commands/cmd-upgrade.png',
};

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
  | 'build-mijnschacht' | 'build-chocolaterie'
  | 'train-hero-0' | 'train-hero-1'
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

export interface BuildingCardAction {
  action: CommandAction;
  icon: string;       // Short abbreviation (WRK, INF, RNG, etc.)
  label: string;      // Full unit/action name
  hotkey: string;      // Keyboard shortcut letter
  iconClass?: string;  // Optional color class (btn-icon--train, etc.)
  isHero?: boolean;    // Hero training button
  isRally?: boolean;   // Rally point button
}

export interface BuildingCardData {
  id: number;
  name: string;
  factionName: string;
  hp: number;
  maxHp: number;
  status: string;       // 'Idle', 'Training Infantry (12s)', etc.
  portraitAbbrev: string; // Short building type abbreviation (TH, BRK, etc.) -- legacy fallback
  buildingTypeId: number; // BuildingTypeId for canvas-drawn portrait
  actions: BuildingCardAction[];
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

export interface HeroAbilityData {
  name: string;
  hotkey: string;
  description: string;
  cooldown: number;
  cooldownMax: number;
  gezelligheidCost: number;
  currentGezelligheid: number;
}

export interface HUDEvents {
  onMinimapClick: (x: number, y: number) => void;
  onCommand: (action: CommandAction) => void;
  onPortraitClick: (unitId: number) => void;
  onRetry: () => void;
  onMenu: () => void;
}

// ---------------------------------------------------------------------------
// Text-based abbreviations for unit portraits (no emoji allowed)
// ---------------------------------------------------------------------------

const UNIT_ABBREV: Record<string, string> = {
  worker: 'WRK',
  infantry: 'INF',
  ranged: 'RNG',
  townhall: 'TH',
  barracks: 'BRK',
  blacksmith: 'BSM',
  smederij: 'BSM',
  prins: 'H1',
  boer: 'WRK',
  ceo: 'H1',
  politicus: 'H2',
  hero: 'HRO',
  // Randstad
  stagiair: 'WRK',
  manager: 'INF',
  consultant: 'RNG',
  // Limburgers
  mijnwerker: 'WRK',
  schutterij: 'INF',
  vlaaienwerper: 'RNG',
  // Belgen
  frietkraamhouder: 'WRK',
  bierbouwer: 'INF',
  chocolatier: 'RNG',
};

// ---------------------------------------------------------------------------
// Faction-specific unit display names (Worker / Infantry / Ranged)
// ---------------------------------------------------------------------------

const FACTION_UNIT_NAMES: Record<Faction, { worker: string; infantry: string; ranged: string }> = {
  brabant:  { worker: 'Boer',               infantry: 'Carnavalvierder', ranged: 'Sluiper' },
  randstad: { worker: 'Stagiair',           infantry: 'Manager',         ranged: 'Consultant' },
  limburg:  { worker: 'Mijnwerker',         infantry: 'Schutterij',      ranged: 'Vlaaienwerper' },
  belgen:   { worker: 'Frietkraamhouder',   infantry: 'Bierbouwer',      ranged: 'Chocolatier' },
};

// ---------------------------------------------------------------------------
// Faction-specific worker build commands
// ---------------------------------------------------------------------------

interface WorkerBuildCmd {
  action: CommandAction;
  icon: string;
  label: string;
  hotkey?: string;
  iconClass?: string;
}

const BASE_WORKER_CMDS: WorkerBuildCmd[] = [
  { action: 'move', icon: 'MOV', label: '', hotkey: 'W', iconClass: 'btn-icon--move' },
  { action: 'stop', icon: 'STP', label: '', hotkey: 'E', iconClass: 'btn-icon--stop' },
];

const FACTION_WORKER_BUILDS: Record<Faction, WorkerBuildCmd[]> = {
  brabant: [
    { action: 'build-barracks',    icon: 'BLD', label: 'Kazerne',      hotkey: 'Q', iconClass: 'btn-icon--build' },
    { action: 'build-lumbercamp',  icon: 'BLD', label: 'Houtzagerij',               iconClass: 'btn-icon--build' },
    { action: 'build-blacksmith',  icon: 'BLD', label: 'Smederij',     hotkey: 'R', iconClass: 'btn-icon--build' },
  ],
  randstad: [
    { action: 'build-barracks',    icon: 'BLD', label: 'Vergaderzaal',  hotkey: 'Q', iconClass: 'btn-icon--build' },
    { action: 'build-lumbercamp',  icon: 'BLD', label: 'Starbucks',                  iconClass: 'btn-icon--build' },
    { action: 'build-blacksmith',  icon: 'BLD', label: 'CoworkingSpace', hotkey: 'R', iconClass: 'btn-icon--build' },
  ],
  limburg: [
    { action: 'build-barracks',    icon: 'BLD', label: 'Schuttershal',  hotkey: 'Q', iconClass: 'btn-icon--build' },
    { action: 'build-lumbercamp',  icon: 'BLD', label: 'Vlaaibakkerij',              iconClass: 'btn-icon--build' },
    { action: 'build-blacksmith',  icon: 'BLD', label: 'Klooster',     hotkey: 'R',  iconClass: 'btn-icon--build' },
    { action: 'build-mijnschacht', icon: 'BLD', label: 'Mijnschacht',                iconClass: 'btn-icon--build' },
  ],
  belgen: [
    { action: 'build-barracks',    icon: 'BLD', label: 'Frituur',       hotkey: 'Q', iconClass: 'btn-icon--build' },
    { action: 'build-lumbercamp',  icon: 'BLD', label: 'Frietfabriek',               iconClass: 'btn-icon--build' },
    { action: 'build-blacksmith',  icon: 'BLD', label: 'EU-Parlement',  hotkey: 'R', iconClass: 'btn-icon--build' },
    { action: 'build-chocolaterie', icon: 'BLD', label: 'Chocolaterie',              iconClass: 'btn-icon--build' },
  ],
};

// Faction-specific building command labels (train panel)
const FACTION_BUILDING_LABELS: Record<Faction, { worker: string; infantry: string; ranged: string }> = {
  brabant:  { worker: 'Boer',               infantry: 'Infanterie', ranged: 'Sluiper' },
  randstad: { worker: 'Stagiair',           infantry: 'Manager',    ranged: 'Consultant' },
  limburg:  { worker: 'Mijnwerker',         infantry: 'Schutterij', ranged: 'Vlaaienwerper' },
  belgen:   { worker: 'Frietkraamhouder',   infantry: 'Bierbouwer', ranged: 'Chocolatier' },
};

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

export class HUD {
  // Current faction (used for faction-specific labels)
  private currentFaction: Faction = 'brabant';

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

  // Building card elements
  private buildingCard!: HTMLElement;
  private bcardPortrait!: HTMLElement;
  private bcardName!: HTMLElement;
  private bcardFaction!: HTMLElement;
  private bcardHpBar!: HTMLElement;
  private bcardHpText!: HTMLElement;
  private bcardStatus!: HTMLElement;
  private bcardActions!: HTMLElement;

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

  // Tooltip element
  private tooltipEl: HTMLDivElement | null = null;

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

    // Building (legacy panel)
    this.buildingPortrait = this.el('building-portrait');
    this.buildingName = this.el('building-name');
    this.buildingHpBar = this.el('building-hp-bar');
    this.buildingHpText = this.el('building-hp-text');
    this.queueProgress = document.querySelector('.queue-progress') as HTMLElement;
    this.queueLabel = this.el('queue-label');
    this.queueBar = this.el('queue-bar');
    this.queueTime = this.el('queue-time');

    // Building card (new unified card)
    this.buildingCard = this.el('building-card');
    this.bcardPortrait = this.el('bcard-portrait');
    this.bcardName = this.el('bcard-name');
    this.bcardFaction = this.el('bcard-faction');
    this.bcardHpBar = this.el('bcard-hp-bar');
    this.bcardHpText = this.el('bcard-hp-text');
    this.bcardStatus = this.el('bcard-status');
    this.bcardActions = this.el('bcard-actions');

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

    // Replace text-based icons with SVG icons on all static command buttons
    this.replaceStaticButtonIcons();

    // Bind event listeners
    this.bindCommandButtons();
    this.bindMinimapClick();
    this.bindGameOverButtons();
    this.bindHotkeys();
    this.bindRageButton();
    this.bindMuteButton();
  }

  /**
   * Replace text icon labels on all static HTML command buttons with SVG icons.
   * Targets .btn-icon spans in cmd-unit, cmd-multi, cmd-building, and cmd-hero panels.
   */
  private replaceStaticButtonIcons(): void {
    const iconSpans = document.querySelectorAll<HTMLElement>(
      '#cmd-unit .btn-icon, #cmd-multi .btn-icon, #cmd-building .btn-icon, #cmd-hero .btn-icon'
    );
    for (const span of iconSpans) {
      replaceIconText(span);
    }
  }

  // -----------------------------------------------------------------------
  // Resource bar
  // -----------------------------------------------------------------------

  updateResources(gold: number, wood: number, pop: number, maxPop: number, upkeepPerTick: number = 0, inUpkeepDebt: boolean = false): void {
    // Gold display with upkeep cost indicator
    if (upkeepPerTick > 0) {
      this.resGold.textContent = `${Math.floor(gold)} (-${upkeepPerTick})`;
    } else {
      this.resGold.textContent = String(Math.floor(gold));
    }

    // Upkeep debt visual: gold text turns red when in debt
    if (this.resGold.parentElement) {
      if (inUpkeepDebt) {
        this.resGold.parentElement.classList.add('is-upkeep-debt');
      } else {
        this.resGold.parentElement.classList.remove('is-upkeep-debt');
      }
    }

    this.resWood.textContent = String(Math.floor(wood));
    this.resPop.textContent = String(pop);
    this.resPopMax.textContent = String(maxPop);

    // Population tier warnings
    if (this.resPopItem) {
      const ratio = maxPop > 0 ? pop / maxPop : 0;
      this.resPopItem.classList.remove('is-capped', 'is-pop-warning', 'is-pop-danger');
      if (pop >= maxPop) {
        this.resPopItem.classList.add('is-capped');
      } else if (ratio >= 0.80) {
        this.resPopItem.classList.add('is-pop-danger');
      } else if (ratio >= 0.60) {
        this.resPopItem.classList.add('is-pop-warning');
      }
    }
  }

  /**
   * Show a one-time population cap reached alert.
   * Called by Game.ts when population first hits 100%.
   */
  showPopulationCapAlert(): void {
    this.showAlert('Population cap reached', 'warning');
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
  // Central command panel visibility
  // -----------------------------------------------------------------------

  /**
   * Hide ALL command panels at once. Called at the start of showUnitPanel()
   * and showBuildingPanel() to ensure stale panels (e.g. cmd-hero) never
   * linger when the selection changes.
   */
  private hideAllCommandPanels(): void {
    this.cmdUnit.hidden = true;
    this.cmdMulti.hidden = true;
    this.cmdWorker.hidden = true;
    this.cmdBuilding.hidden = true;

    const heroPanel = document.getElementById('cmd-hero');
    if (heroPanel) heroPanel.hidden = true;

    const blacksmithPanel = document.getElementById('cmd-blacksmith');
    if (blacksmithPanel) blacksmithPanel.hidden = true;
  }

  // -----------------------------------------------------------------------
  // Unit panel
  // -----------------------------------------------------------------------

  showUnitPanel(units: SelectedUnit[]): void {
    this.hideAllCommandPanels();
    this.hideBuildingCard();
    this.selectionPanel.hidden = false;
    this.buildingPanel.hidden = true;

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
        placeholder.textContent = this.getUnitAbbrev(unit.name);
      }
    }

    this.unitLevel.textContent = String(unit.level);
    this.unitName.textContent = this.getFactionUnitName(unit.name);

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
        span.textContent = this.getUnitAbbrev(unit.name);
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
    this.hideAllCommandPanels();
    this.selectionPanel.hidden = false;
    this.unitSingle.hidden = true;
    this.unitMulti.hidden = true;
    this.buildingPanel.hidden = false;
    this.cmdBuilding.hidden = false;

    this.buildingName.textContent = building.name;

    // Canvas-drawn building portrait (replaces text placeholder)
    const buildingTypeId = this.buildingTypeToId(building.type);
    const placeholder = this.buildingPortrait.querySelector('.portrait-placeholder') as HTMLElement | null;
    const existingImg = this.buildingPortrait.querySelector('img');
    if (existingImg) existingImg.remove();
    const pxSize = 88;
    const img = createBuildingPortraitImg(buildingTypeId, pxSize, pxSize);
    img.style.borderRadius = '4px';
    this.buildingPortrait.appendChild(img);
    if (placeholder) placeholder.style.display = 'none';

    // HP bar
    const ratio = building.maxHp > 0 ? building.hp / building.maxHp : 0;
    this.buildingHpBar.style.width = `${ratio * 100}%`;
    this.buildingHpBar.className = 'unit-hp-bar ' + this.getHpClass(ratio);
    this.buildingHpText.textContent = `${Math.ceil(building.hp)} / ${building.maxHp}`;

    // Production queue
    if (building.queue.length > 0) {
      const current = building.queue[0];
      const queueCount = building.queue.length - 1;
      this.queueProgress.hidden = false;
      this.queueLabel.textContent = queueCount > 0
        ? `${current.unitName} (+${queueCount} in wachtrij)`
        : current.unitName;
      this.queueBar.style.width = `${current.progress * 100}%`;
      this.queueTime.textContent = `${Math.ceil(current.remainingSeconds)}s`;
    } else {
      this.queueProgress.hidden = true;
    }
  }

  updateProductionQueue(progress: number, label: string, remainingSeconds: number): void {
    if (!this.queueProgress) return;

    // Hide the queue bar when there is no active production
    if (!label || remainingSeconds <= 0) {
      this.queueProgress.hidden = true;
      return;
    }

    this.queueProgress.hidden = false;
    this.queueLabel.textContent = label;
    this.queueBar.style.width = `${Math.min(progress, 1) * 100}%`;
    this.queueTime.textContent = `${Math.ceil(remainingSeconds)}s`;
  }

  // -----------------------------------------------------------------------
  // Building Card (unified info card with actions)
  // -----------------------------------------------------------------------

  /**
   * Show the new building info card with health, status, and action grid.
   * This replaces the old building-panel + cmd-building for building selection.
   */
  showBuildingCard(data: BuildingCardData): void {
    this.hideAllCommandPanels();
    this.selectionPanel.hidden = true;
    this.buildingPanel.hidden = true;
    this.buildingCard.hidden = false;

    // Canvas-drawn building portrait (replaces text abbreviation)
    const portraitText = this.bcardPortrait.querySelector('.bcard-portrait-text');
    const existingImg = this.bcardPortrait.querySelector('img');
    if (existingImg) existingImg.remove();

    // Portrait container is 44x44 CSS px; draw at 2x for retina
    const pxSize = 88;
    const img = createBuildingPortraitImg(data.buildingTypeId as BuildingTypeId, pxSize, pxSize);
    img.style.borderRadius = '4px';
    this.bcardPortrait.appendChild(img);
    if (portraitText) (portraitText as HTMLElement).style.display = 'none';

    // Name and faction
    this.bcardName.textContent = data.name;
    this.bcardFaction.textContent = data.factionName;

    // HP bar
    this.updateBuildingCardHp(data.hp, data.maxHp);

    // Status
    this.bcardStatus.textContent = data.status;

    // Build action buttons (hide grid + preceding divider when no actions)
    this.bcardActions.innerHTML = '';
    const actionDivider = this.bcardActions.previousElementSibling;
    if (data.actions.length === 0) {
      this.bcardActions.hidden = true;
      if (actionDivider?.classList.contains('bcard-divider')) {
        (actionDivider as HTMLElement).hidden = true;
      }
    } else {
      this.bcardActions.hidden = false;
      if (actionDivider?.classList.contains('bcard-divider')) {
        (actionDivider as HTMLElement).hidden = false;
      }
    }
    for (const act of data.actions) {
      const btn = document.createElement('button');
      btn.className = 'bcard-action-btn';
      if (act.isHero) btn.classList.add('bcard-action-btn--hero');
      if (act.isRally) btn.classList.add('bcard-action-btn--rally');
      btn.dataset.action = act.action;
      btn.dataset.hotkey = act.hotkey;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'bcard-action-icon';
      if (act.iconClass) iconSpan.classList.add(act.iconClass);
      const imgSrc = COMMAND_ICON_IMAGES[act.icon];
      if (imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = act.label;
        img.draggable = false;
        iconSpan.appendChild(img);
      } else {
        const svgIcon = createCommandIcon(act.icon, 20);
        if (svgIcon) {
          iconSpan.appendChild(svgIcon);
        } else {
          iconSpan.textContent = act.icon;
        }
      }
      btn.appendChild(iconSpan);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'bcard-action-label';
      labelSpan.textContent = act.label;
      btn.appendChild(labelSpan);

      const hotkeySpan = document.createElement('span');
      hotkeySpan.className = 'bcard-action-hotkey';
      hotkeySpan.textContent = act.hotkey;
      btn.appendChild(hotkeySpan);

      // Wire click to command handler
      btn.addEventListener('click', () => {
        audioManager.playSound('click');
        this.events?.onCommand(act.action);
      });

      // Attach tooltip for unit training / rally actions
      const actAction = act.action;
      const actLabel = act.label;
      const actHotkey = act.hotkey;
      this.attachTooltipHandlers(btn, () => {
        // Rally point has no archetype data
        if (act.isRally) {
          return { name: 'Rally Point', desc: 'Stel een verzamelpunt in voor nieuwe eenheden.', hotkey: actHotkey };
        }
        // Unit training buttons
        const unitTT = this.getUnitTooltipData(actAction, actLabel, actHotkey);
        if (unitTT) return unitTT;
        // Hero or unknown -- minimal tooltip
        return { name: actLabel, hotkey: actHotkey };
      });

      this.bcardActions.appendChild(btn);
    }
  }

  /**
   * Update only the HP portion of the building card (called each frame).
   */
  updateBuildingCardHp(hp: number, maxHp: number): void {
    const ratio = maxHp > 0 ? hp / maxHp : 0;
    this.bcardHpBar.style.width = `${ratio * 100}%`;

    // Color based on HP ratio
    if (ratio > 0.6) {
      this.bcardHpBar.style.backgroundColor = 'var(--color-hp-high)';
    } else if (ratio > 0.3) {
      this.bcardHpBar.style.backgroundColor = 'var(--color-hp-mid)';
    } else {
      this.bcardHpBar.style.backgroundColor = 'var(--color-hp-low)';
    }

    this.bcardHpText.textContent = `${Math.ceil(hp)}/${maxHp}`;
  }

  /**
   * Update the status text on the building card (called each frame).
   */
  updateBuildingCardStatus(status: string): void {
    this.bcardStatus.textContent = status;
  }

  /**
   * Hide the building card.
   */
  hideBuildingCard(): void {
    this.buildingCard.hidden = true;
  }

  /**
   * Check if the building card is currently visible.
   */
  isBuildingCardVisible(): boolean {
    return !this.buildingCard.hidden;
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
        <div class="research-label">${this.escapeHtml(researchProgress.name)}</div>
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
        btn.hidden = true; // Hide locked research — prerequisites not met
        continue;
      }

      btn.innerHTML = `
        <span class="btn-icon btn-icon--research"></span>
        <span class="research-name">${this.escapeHtml(upg.name)}</span>
        <span class="research-cost">${upg.isResearched ? 'OK' : upg.costGold + 'g'}</span>
      `;
      const upgIconSpan = btn.querySelector('.btn-icon') as HTMLElement;
      if (upgIconSpan) {
        const upgSvg = createCommandIcon('UPG', 18);
        if (upgSvg) upgIconSpan.appendChild(upgSvg);
        else upgIconSpan.textContent = 'UPG';
      }
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
    this.hideBuildingCard();
    this.hideAllCommandPanels();
  }

  // -----------------------------------------------------------------------
  // Hero ability bar
  // -----------------------------------------------------------------------

  /**
   * Update the hero ability panel with current cooldowns, costs, and state.
   * Called every frame when a hero is selected.
   * @param abilities - Array of 3 ability data objects (Q, W, E)
   */
  updateHeroAbilities(abilities: HeroAbilityData[]): void {
    const heroPanel = document.getElementById('cmd-hero');
    if (!heroPanel || heroPanel.hidden) return;

    const slotActions = ['hero-ability-q', 'hero-ability-w', 'hero-ability-e'];
    const hotkeyLabels = ['1', '2', '3'];

    for (let i = 0; i < 3; i++) {
      const btn = heroPanel.querySelector(`[data-slot="${i}"]`) as HTMLButtonElement;
      if (!btn) continue;
      const ability = abilities[i];
      if (!ability) continue;

      // Update name
      const nameEl = btn.querySelector('.ability-name');
      if (nameEl) nameEl.textContent = ability.name;

      // Update cost
      const costEl = btn.querySelector('.ability-cost');
      if (costEl) {
        if (ability.gezelligheidCost > 0) {
          costEl.textContent = `${ability.gezelligheidCost} Gez`;
          costEl.classList.toggle('is-insufficient', ability.currentGezelligheid < ability.gezelligheidCost);
        } else {
          costEl.textContent = '';
          costEl.classList.remove('is-insufficient');
        }
      }

      // Update cooldown text and overlay
      const cdEl = btn.querySelector('.ability-cd');
      const cdOverlay = btn.querySelector(`[data-cd-overlay="${i}"]`) as HTMLElement;

      const isOnCooldown = ability.cooldown > 0;
      const canAfford = ability.gezelligheidCost <= 0 || ability.currentGezelligheid >= ability.gezelligheidCost;

      if (isOnCooldown) {
        if (cdEl) cdEl.textContent = `${Math.ceil(ability.cooldown)}s`;
        if (cdOverlay) {
          cdOverlay.hidden = false;
          // Cooldown sweep: reveal from bottom to top as cooldown ticks down
          const fraction = ability.cooldownMax > 0
            ? ability.cooldown / ability.cooldownMax
            : 0;
          cdOverlay.style.clipPath = `inset(${(1 - fraction) * 100}% 0 0 0)`;
        }
      } else {
        if (cdEl) cdEl.textContent = '';
        if (cdOverlay) cdOverlay.hidden = true;
      }

      // Button state
      btn.disabled = isOnCooldown || !canAfford;
      btn.classList.toggle('is-on-cooldown', isOnCooldown);
      btn.classList.toggle('is-no-resource', !isOnCooldown && !canAfford);

      // Update tooltip
      const ttTitle = btn.querySelector('[data-tt-title]');
      const ttHotkey = btn.querySelector('[data-tt-hotkey]');
      const ttDesc = btn.querySelector('[data-tt-desc]');
      const ttMeta = btn.querySelector('[data-tt-meta]');

      if (ttTitle) ttTitle.textContent = ability.name;
      if (ttHotkey) ttHotkey.textContent = `Hotkey: ${hotkeyLabels[i]}`;
      if (ttDesc) ttDesc.textContent = ability.description;
      if (ttMeta) {
        let meta = `Cooldown: ${ability.cooldownMax}s`;
        if (ability.gezelligheidCost > 0) {
          meta += `\nKost: ${ability.gezelligheidCost} Gezelligheid`;
        }
        ttMeta.innerHTML = meta.split('\n').map(s => `<span>${this.escapeHtml(s)}</span>`).join('');
      }
    }
  }

  /**
   * Flash an ability button to indicate successful activation.
   * @param slot - Ability slot (0=Q, 1=W, 2=E)
   */
  flashHeroAbility(slot: number): void {
    const heroPanel = document.getElementById('cmd-hero');
    if (!heroPanel) return;
    const btn = heroPanel.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
    if (!btn) return;

    btn.classList.remove('is-activated');
    // Force reflow to restart animation
    void btn.offsetWidth;
    btn.classList.add('is-activated');
    window.setTimeout(() => {
      btn.classList.remove('is-activated');
    }, 350);
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
      warning: '!',
      info: 'i',
      error: 'X',
    };

    alert.innerHTML = `
      <span class="alert__icon" style="font-weight:900;font-size:0.85rem;">${iconMap[type]}</span>
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
  // Mode Indicator
  // -----------------------------------------------------------------------

  showModeIndicator(text: string): void {
    this.hideModeIndicator();
    const indicator = document.createElement('div');
    indicator.id = 'mode-indicator';
    indicator.innerHTML = `<span class="mode-indicator__text">${this.escapeHtml(text)}</span><span class="mode-indicator__hint">ESC om te annuleren</span>`;
    document.getElementById('hud')?.appendChild(indicator);
  }

  hideModeIndicator(): void {
    document.getElementById('mode-indicator')?.remove();
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
    const factionNames: Record<string, string> = { brabant: 'Brabant', randstad: 'De Randstad', limburg: 'Limburg', belgen: 'België' };
    const name = factionNames[document.body.dataset.faction ?? 'brabant'] ?? 'Brabant';
    this.gameOverSubtitle.textContent = victory ? `${name} is veilig!` : `${name} is gevallen...`;

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
    this.currentFaction = faction;
    document.body.dataset.faction = faction;
    this.rebuildWorkerCommands(faction);
    this.rebuildBuildingLabels(faction);
  }

  /**
   * Rebuild the worker command panel buttons based on the active faction.
   * This replaces the static HTML buttons with faction-specific build options.
   */
  private rebuildWorkerCommands(faction: Faction): void {
    if (!this.cmdWorker) return;
    this.cmdWorker.innerHTML = '';

    const builds = FACTION_WORKER_BUILDS[faction] ?? FACTION_WORKER_BUILDS.brabant;
    const baseCmds = BASE_WORKER_CMDS;

    // Faction-specific build buttons first
    for (const cmd of builds) {
      const btn = this.createCommandButton(cmd);
      this.cmdWorker.appendChild(btn);
    }

    // Then generic move/stop
    for (const cmd of baseCmds) {
      const btn = this.createCommandButton(cmd);
      this.cmdWorker.appendChild(btn);
    }
  }

  /**
   * Update the building (production) command panel labels based on faction.
   * Worker/Infantry/Ranged train buttons get faction-specific unit names.
   */
  private rebuildBuildingLabels(faction: Faction): void {
    const labels = FACTION_BUILDING_LABELS[faction] ?? FACTION_BUILDING_LABELS.brabant;

    const workerBtn = this.cmdBuilding.querySelector<HTMLButtonElement>('[data-action="train-worker"]');
    const infantryBtn = this.cmdBuilding.querySelector<HTMLButtonElement>('[data-action="train-infantry"]');
    const rangedBtn = this.cmdBuilding.querySelector<HTMLButtonElement>('[data-action="train-ranged"]');

    if (workerBtn) {
      const labelSpan = workerBtn.querySelector('span:nth-child(2)');
      if (labelSpan) labelSpan.textContent = labels.worker;
    }
    if (infantryBtn) {
      const labelSpan = infantryBtn.querySelector('span:nth-child(2)');
      if (labelSpan) labelSpan.textContent = labels.infantry;
    }
    if (rangedBtn) {
      const labelSpan = rangedBtn.querySelector('span:nth-child(2)');
      if (labelSpan) labelSpan.textContent = labels.ranged;
    }
  }

  /**
   * Create a command button element matching the existing cmd-btn pattern.
   */
  private createCommandButton(cmd: WorkerBuildCmd): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'cmd-btn';
    btn.dataset.action = cmd.action;
    if (cmd.hotkey) btn.dataset.hotkey = cmd.hotkey;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'btn-icon' + (cmd.iconClass ? ` ${cmd.iconClass}` : '');
    const svgIcon = createCommandIcon(cmd.icon, 20);
    if (svgIcon) {
      iconSpan.appendChild(svgIcon);
    } else {
      iconSpan.textContent = cmd.icon;
    }
    btn.appendChild(iconSpan);

    if (cmd.label) {
      const labelSpan = document.createElement('span');
      labelSpan.textContent = cmd.label;
      btn.appendChild(labelSpan);
    }

    if (cmd.hotkey) {
      const hotkeySpan = document.createElement('span');
      hotkeySpan.className = 'hotkey';
      hotkeySpan.textContent = cmd.hotkey;
      btn.appendChild(hotkeySpan);
    }

    // Bind click handler
    const handler = () => {
      audioManager.playSound('click');
      this.events?.onCommand(cmd.action);
    };
    btn.addEventListener('click', handler);
    this.boundHandlers.push({ el: btn, event: 'click', handler: handler as EventListener });

    // Attach tooltip for building commands
    const cmdAction = cmd.action;
    const cmdLabel = cmd.label;
    const cmdHotkey = cmd.hotkey;
    this.attachTooltipHandlers(btn, () => this.getBuildingTooltipData(cmdAction, cmdLabel, cmdHotkey));

    return btn;
  }

  // -----------------------------------------------------------------------
  // Command enable/disable (hide instead of gray out)
  // -----------------------------------------------------------------------

  setCommandEnabled(action: CommandAction, enabled: boolean): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`);
    for (const btn of buttons) {
      btn.hidden = !enabled;
    }
  }

  /**
   * Show only the specified actions in a command panel, hiding all others.
   * This ensures unavailable actions are hidden instead of grayed out.
   */
  setVisibleActions(panelId: string, visibleActions: Set<CommandAction>): void {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const buttons = panel.querySelectorAll<HTMLButtonElement>('.cmd-btn');
    for (const btn of buttons) {
      const action = btn.dataset.action as CommandAction | undefined;
      if (action) {
        btn.hidden = !visibleActions.has(action);
      }
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

      // Attach tooltips to static training / building command buttons
      const btnAction = action;
      const btnLabel = btn.querySelector('span:nth-child(2)')?.textContent ?? '';
      const btnHotkey = btn.dataset.hotkey;
      if (btnAction.startsWith('train-')) {
        this.attachTooltipHandlers(btn, () => this.getUnitTooltipData(btnAction, btnLabel, btnHotkey));
      } else if (btnAction === 'rally-point') {
        this.attachTooltipHandlers(btn, () => ({
          name: 'Rally Point',
          desc: 'Stel een verzamelpunt in voor nieuwe eenheden.',
          hotkey: btnHotkey,
        }));
      }
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
        // Simulate pressing V key -- Game.ts handles the actual activation
        const event = new KeyboardEvent('keydown', { code: 'KeyV', bubbles: true });
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
        muteBtn.textContent = muted ? 'OFF' : 'SND';
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
    // Hotkeys are resolved dynamically based on which command panel is visible.
    // Q/E/R are context-sensitive: unit, worker, or building panel.
    // W is excluded — conflicts with WASD camera forward.
    // V is handled by Game.ts for Carnavalsrage.
    const hotkeyCodes = ['KeyQ', 'KeyE', 'KeyR'];

    const handler = (e: Event) => {
      const ke = e as KeyboardEvent;
      // Only fire hotkeys when not in a text input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (!hotkeyCodes.includes(ke.code)) return;

      const hotkeyChar = ke.code.replace('Key', '');
      const action = this.getHotkeyAction(hotkeyChar);
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
   * Map hotkey character to the currently-visible command action.
   * The action depends on which command panel is active:
   *   - Unit panel (cmd-unit): Q=move, E=stop, R=hold
   *   - Worker panel (cmd-worker): Q=build-barracks, R=build-blacksmith (faction-specific)
   *   - Building panel (cmd-building): Q=train-worker, E=train-ranged, R=rally-point
   *   - Multi-unit panel (cmd-multi): Q=move, E=stop (no R action)
   */
  private getHotkeyAction(hotkey: string): CommandAction | null {
    // Find the visible button with this hotkey in any visible command panel.
    // NOTE: Building card hotkeys are NOT resolved here -- they are handled
    // directly by Game.ts's keyboard handler to avoid double-firing.
    const btn = document.querySelector<HTMLButtonElement>(
      `.command-panel:not([hidden]) .cmd-btn[data-hotkey="${hotkey}"]:not([hidden])`,
    );
    if (btn) {
      return (btn.dataset.action as CommandAction) ?? null;
    }
    return null;
  }

  private flashHotkeyButton(keyCode: string): void {
    const hotkeyChar = keyCode.replace('Key', '');
    // Flash in building card buttons if visible, otherwise command panel buttons
    const bcardBtn = document.querySelector<HTMLButtonElement>(
      `#building-card:not([hidden]) .bcard-action-btn[data-hotkey="${hotkeyChar}"]`,
    );
    const btn = bcardBtn ?? document.querySelector<HTMLButtonElement>(`.cmd-btn[data-hotkey="${hotkeyChar}"]`);
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

  private buildingTypeToId(type: BuildingType): BuildingTypeId {
    switch (type) {
      case 'townhall': return BuildingTypeId.TownHall;
      case 'barracks': return BuildingTypeId.Barracks;
      case 'lumbercamp': return BuildingTypeId.LumberCamp;
      case 'blacksmith': return BuildingTypeId.Blacksmith;
      default: return BuildingTypeId.TownHall;
    }
  }

  private getUnitAbbrev(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, abbrev] of Object.entries(UNIT_ABBREV)) {
      if (lower.includes(key)) return abbrev;
    }
    return '?';
  }

  /**
   * Map a base unit name (from Game.ts, always Brabanders names) to the
   * faction-specific display name based on the currently active faction.
   * Hero names and unknown names are passed through unchanged.
   */
  private getFactionUnitName(baseName: string): string {
    const names = FACTION_UNIT_NAMES[this.currentFaction];
    if (!names) return baseName;

    const lower = baseName.toLowerCase();
    // Map Brabanders base names to faction equivalents
    if (lower === 'boer' || lower === 'worker') return names.worker;
    if (lower === 'carnavalvierder' || lower === 'infantry') return names.infantry;
    if (lower === 'sluiper' || lower === 'ranged') return names.ranged;
    // Pass through hero names and any others unchanged
    return baseName;
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
  // Tooltip system
  // -----------------------------------------------------------------------

  private createTooltipElement(): HTMLDivElement {
    if (this.tooltipEl) return this.tooltipEl;
    const el = document.createElement('div');
    el.className = 'game-tooltip';
    document.getElementById('hud')?.appendChild(el);
    this.tooltipEl = el;
    return el;
  }

  private showTooltip(
    x: number,
    y: number,
    data: {
      name: string;
      cost?: string;
      stats?: Array<[string, string]>;
      desc?: string;
      hotkey?: string;
    },
  ): void {
    const el = this.createTooltipElement();
    let html = `<div class="game-tooltip__name">${this.escapeHtml(data.name)}</div>`;
    if (data.cost) html += `<div class="game-tooltip__cost">${this.escapeHtml(data.cost)}</div>`;
    if (data.stats && data.stats.length > 0) {
      html += '<div class="game-tooltip__stats">';
      for (const [label, val] of data.stats) {
        html += `<span class="game-tooltip__stat-label">${this.escapeHtml(label)}</span><span>${this.escapeHtml(val)}</span>`;
      }
      html += '</div>';
    }
    if (data.desc) html += `<div class="game-tooltip__desc">${this.escapeHtml(data.desc)}</div>`;
    if (data.hotkey) html += `<div class="game-tooltip__hotkey">[${this.escapeHtml(data.hotkey)}]</div>`;
    el.innerHTML = html;

    // Position: prefer above-right of cursor, shift if off-screen
    let left = x + 12;
    let top = y - 12;
    if (left + 260 > window.innerWidth) left = x - 270;
    if (top < 0) top = y + 20;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.classList.add('is-visible');
  }

  private hideTooltip(): void {
    this.tooltipEl?.classList.remove('is-visible');
  }

  /**
   * Build tooltip data for a unit training action (train-worker, train-infantry, etc.).
   * Looks up the unit archetype to display stats.
   */
  private getUnitTooltipData(action: string, label: string, hotkey?: string): {
    name: string; cost?: string; stats?: Array<[string, string]>; desc?: string; hotkey?: string;
  } | null {
    let typeId: UnitTypeId | null = null;
    if (action === 'train-worker') typeId = UnitTypeId.Worker;
    else if (action === 'train-infantry') typeId = UnitTypeId.Infantry;
    else if (action === 'train-ranged') typeId = UnitTypeId.Ranged;

    if (typeId === null) return null;

    const arch = UNIT_ARCHETYPES[typeId];
    if (!arch) return null;

    const dps = (arch.attack / arch.attackSpeed).toFixed(1);
    return {
      name: label || arch.brabantName,
      cost: `${arch.costGold} goud`,
      stats: [
        ['HP', String(arch.hp)],
        ['Aanval', String(arch.attack)],
        ['DPS', dps],
        ['Pantser', String(arch.armor)],
        ['Snelheid', String(arch.speed)],
        ['Bouw', `${arch.buildTime}s`],
      ],
      desc: typeId === UnitTypeId.Worker
        ? 'Verzamelt grondstoffen en bouwt gebouwen.'
        : typeId === UnitTypeId.Infantry
          ? 'Melee gevechtsunit. Sterk tegen schutters.'
          : 'Afstandsunit. Sterk op afstand, zwak in melee.',
      hotkey,
    };
  }

  /**
   * Build tooltip data for a building construction action.
   */
  private getBuildingTooltipData(action: string, label: string, hotkey?: string): {
    name: string; cost?: string; stats?: Array<[string, string]>; desc?: string; hotkey?: string;
  } | null {
    let typeId: BuildingTypeId | null = null;
    if (action === 'build-barracks') typeId = BuildingTypeId.Barracks;
    else if (action === 'build-lumbercamp') typeId = BuildingTypeId.LumberCamp;
    else if (action === 'build-blacksmith') typeId = BuildingTypeId.Blacksmith;
    else if (action === 'build-townhall') typeId = BuildingTypeId.TownHall;

    if (typeId === null) return null;

    const arch = BUILDING_ARCHETYPES[typeId];
    if (!arch) return null;

    const producesNames: string[] = [];
    for (const unitType of arch.produces) {
      const uArch = UNIT_ARCHETYPES[unitType];
      if (uArch) producesNames.push(uArch.brabantName);
    }

    const desc = producesNames.length > 0
      ? `Traint: ${producesNames.join(', ')}.`
      : typeId === BuildingTypeId.Blacksmith
        ? 'Onderzoekt upgrades voor je leger.'
        : typeId === BuildingTypeId.LumberCamp
          ? 'Hout afzetpunt. Versnelt hout verzamelen.'
          : '';

    return {
      name: label || arch.brabantName,
      cost: arch.costGold > 0 ? `${arch.costGold} goud` : 'Gratis',
      stats: [
        ['HP', String(arch.hp)],
        ['Bouw', `${arch.buildTime}s`],
      ],
      desc: desc || undefined,
      hotkey,
    };
  }

  /**
   * Attach tooltip mouseenter/mouseleave/mousemove handlers to a button element.
   * The tooltipDataFn is called on mouseenter to get the current tooltip data.
   */
  private attachTooltipHandlers(
    btn: HTMLElement,
    tooltipDataFn: () => { name: string; cost?: string; stats?: Array<[string, string]>; desc?: string; hotkey?: string } | null,
  ): void {
    const onEnter = (e: MouseEvent) => {
      const data = tooltipDataFn();
      if (data) this.showTooltip(e.clientX, e.clientY, data);
    };
    const onMove = (e: MouseEvent) => {
      if (this.tooltipEl?.classList.contains('is-visible')) {
        const data = tooltipDataFn();
        if (data) this.showTooltip(e.clientX, e.clientY, data);
      }
    };
    const onLeave = () => this.hideTooltip();

    btn.addEventListener('mouseenter', onEnter as EventListener);
    btn.addEventListener('mousemove', onMove as EventListener);
    btn.addEventListener('mouseleave', onLeave as EventListener);
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

    // Remove tooltip element
    this.tooltipEl?.remove();
    this.tooltipEl = null;

    this.events = null;
  }
}

// ---------------------------------------------------------------------------
// Constants used in the module
// ---------------------------------------------------------------------------

const MAX_MULTI_PORTRAITS = 24;
const TWO_PI = Math.PI * 2;
