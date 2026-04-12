/**
 * CampaignUI.ts -- DOM controllers for campaign select and briefing screens.
 *
 * Creates and manages two overlay screens:
 * 1. Campaign Select: list of missions with status (locked/available/completed + stars)
 * 2. Briefing: mission description + objectives + start button
 *
 * All text is in Dutch.
 */

import { CampaignManager, type MissionProgress } from '../campaign/CampaignManager';
import { type MissionDefinition } from '../campaign/MissionDefinitions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignUIEvents {
  onMissionSelected: (missionId: string) => void;
  onStartMission: (missionId: string) => void;
  onBackToMenu: () => void;
  onBackToCampaignSelect: () => void;
}

// ---------------------------------------------------------------------------
// CampaignUI
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Faction campaign tab definitions
// ---------------------------------------------------------------------------

interface FactionCampaignTab {
  id: string;
  label: string;
  icon: string;
  subtitle: string;
  available: boolean;
  missionCount: number;
  comingSoonLabel?: string;
}

const FACTION_CAMPAIGN_TABS: FactionCampaignTab[] = [
  {
    id: 'brabanders',
    label: 'Brabanders',
    icon: 'B',
    subtitle: 'Het Gouden Worstenbroodje',
    available: true,
    missionCount: 12,
  },
  {
    id: 'limburgers',
    label: 'Limburgers',
    icon: 'L',
    subtitle: 'De Mijn van Valkenburg',
    available: true,
    missionCount: 5,
  },
  {
    id: 'belgen',
    label: 'Belgen',
    icon: 'V',
    subtitle: 'Het Compromis',
    available: true,
    missionCount: 3,
  },
  {
    id: 'randstad',
    label: 'Randstad',
    icon: 'R',
    subtitle: 'De Grote Overname',
    available: true,
    missionCount: 5,
  },
];

export class CampaignUI {
  private events: CampaignUIEvents | null = null;
  private campaignManager: CampaignManager;
  private campaignSelectEl: HTMLElement | null = null;
  private briefingEl: HTMLElement | null = null;
  private currentMissionId: string | null = null;
  private activeFactionTab: string = 'brabanders';

  constructor(campaignManager: CampaignManager) {
    this.campaignManager = campaignManager;
  }

  init(events: CampaignUIEvents): void {
    this.events = events;
    this.createCampaignSelectDOM();
    this.createBriefingDOM();
  }

  // -----------------------------------------------------------------------
  // Campaign Select Screen
  // -----------------------------------------------------------------------

  showCampaignSelect(): void {
    this.refreshMissionList();
    if (this.campaignSelectEl) {
      this.campaignSelectEl.style.display = 'flex';
    }
  }

  hideCampaignSelect(): void {
    if (this.campaignSelectEl) {
      this.campaignSelectEl.style.display = 'none';
    }
  }

  // -----------------------------------------------------------------------
  // Briefing Screen
  // -----------------------------------------------------------------------

  showBriefing(missionId: string): void {
    this.currentMissionId = missionId;
    this.renderBriefing(missionId);
    if (this.briefingEl) {
      this.briefingEl.style.display = 'flex';
    }
  }

  hideBriefing(): void {
    if (this.briefingEl) {
      this.briefingEl.style.display = 'none';
    }
  }

  // -----------------------------------------------------------------------
  // DOM creation: Campaign Select
  // -----------------------------------------------------------------------

  private createCampaignSelectDOM(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    const el = document.createElement('div');
    el.id = 'campaign-select';
    el.style.cssText = `
      position: absolute; inset: 0; z-index: 60; display: none;
      flex-direction: column; align-items: center; justify-content: flex-start;
      background: linear-gradient(135deg, rgba(10,8,6,0.94) 0%, rgba(20,15,10,0.90) 100%);
      padding: 32px 24px; overflow-y: auto;
    `;

    el.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px; width: 100%; max-width: 700px; margin-bottom: 24px;">
        <button id="campaign-back-btn" style="
          background: none; border: 1px solid rgba(212,168,83,0.35); color: #e8e6e3;
          padding: 8px 16px; border-radius: 6px; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 0.9rem; transition: background 0.15s;
        ">&larr; Terug</button>
        <h2 id="campaign-title" style="
          font-family: 'Cinzel', serif; font-size: clamp(1.3rem,3vw,2rem);
          color: #d4a853; flex: 1; text-align: center; margin: 0;
        ">Campagne: Het Gouden Worstenbroodje</h2>
        <div style="width: 80px;"></div>
      </div>

      <div id="campaign-faction-tabs" style="
        display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
        width: 100%; max-width: 700px; margin-bottom: 20px;
      "></div>

      <div id="campaign-subtitle" style="
        color: #a0a0a0; font-size: 0.85rem; font-style: italic; text-align: center;
        max-width: 600px; margin-bottom: 20px; line-height: 1.5;
      ">
        Van boerendorp tot de poorten van de Randstad — de reis van een volk dat niet wist dat het helden kon zijn.
      </div>

      <div style="
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 24px; color: #d4a853; font-size: 0.9rem;
      ">
        <span id="campaign-stars-display">0 / 9</span>
        <span style="color: #d4a853;">&#9733;</span>
      </div>

      <div id="campaign-mission-list" style="
        width: 100%; max-width: 700px; display: flex; flex-direction: column; gap: 12px;
        flex: 1; min-height: 0; overflow-y: auto; padding-bottom: 40px;
      "></div>
    `;

    overlay.appendChild(el);
    this.campaignSelectEl = el;

    // Build faction tabs
    this.buildFactionTabs();

    // Bind back button
    el.querySelector('#campaign-back-btn')?.addEventListener('click', () => {
      this.events?.onBackToMenu();
    });
    el.querySelector('#campaign-back-btn')?.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.background = 'rgba(212,168,83,0.25)';
    });
    el.querySelector('#campaign-back-btn')?.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.background = 'none';
    });
  }

  // -----------------------------------------------------------------------
  // Faction campaign tabs
  // -----------------------------------------------------------------------

  private buildFactionTabs(): void {
    const container = document.getElementById('campaign-faction-tabs');
    if (!container) return;
    container.innerHTML = '';

    for (const tab of FACTION_CAMPAIGN_TABS) {
      const btn = document.createElement('button');
      btn.dataset.factionTab = tab.id;
      btn.style.cssText = `
        display: flex; align-items: center; gap: 8px;
        padding: 10px 18px; border-radius: 8px; cursor: pointer;
        font-family: 'Cinzel', serif; font-size: 0.9rem; font-weight: 600;
        transition: background 0.15s, border-color 0.2s, transform 0.15s;
        border: 2px solid ${tab.id === this.activeFactionTab ? '#d4a853' : 'rgba(212,168,83,0.25)'};
        background: ${tab.id === this.activeFactionTab ? 'rgba(212,168,83,0.15)' : 'rgba(20,15,10,0.6)'};
        color: ${tab.id === this.activeFactionTab ? '#d4a853' : (tab.available ? '#e8e6e3' : '#666')};
        opacity: ${tab.available ? '1' : '0.6'};
      `;

      btn.innerHTML = `
        <span style="font-size: 1.2rem;">${tab.icon}</span>
        <span>${tab.label}</span>
        ${!tab.available ? '<span style="font-size: 0.6rem; padding: 2px 6px; border-radius: 8px; background: rgba(100,100,100,0.3); color: #888; margin-left: 2px;">SOON</span>' : ''}
      `;

      btn.addEventListener('click', () => {
        this.selectFactionTab(tab.id);
      });
      btn.addEventListener('mouseenter', () => {
        if (tab.id !== this.activeFactionTab) {
          btn.style.borderColor = 'rgba(212,168,83,0.5)';
          btn.style.background = 'rgba(212,168,83,0.08)';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (tab.id !== this.activeFactionTab) {
          btn.style.borderColor = 'rgba(212,168,83,0.25)';
          btn.style.background = 'rgba(20,15,10,0.6)';
        }
      });

      container.appendChild(btn);
    }
  }

  private selectFactionTab(factionId: string): void {
    this.activeFactionTab = factionId;

    // Update tab button styles
    const container = document.getElementById('campaign-faction-tabs');
    if (container) {
      const buttons = container.querySelectorAll<HTMLButtonElement>('[data-faction-tab]');
      for (const btn of buttons) {
        const isActive = btn.dataset.factionTab === factionId;
        const tabDef = FACTION_CAMPAIGN_TABS.find(t => t.id === btn.dataset.factionTab);
        btn.style.borderColor = isActive ? '#d4a853' : 'rgba(212,168,83,0.25)';
        btn.style.background = isActive ? 'rgba(212,168,83,0.15)' : 'rgba(20,15,10,0.6)';
        btn.style.color = isActive ? '#d4a853' : (tabDef?.available ? '#e8e6e3' : '#666');
      }
    }

    // Update title and subtitle
    const tab = FACTION_CAMPAIGN_TABS.find(t => t.id === factionId);
    if (tab) {
      const titleEl = document.getElementById('campaign-title');
      if (titleEl) titleEl.textContent = `Campagne: ${tab.subtitle}`;

      const subtitleEl = document.getElementById('campaign-subtitle');
      if (subtitleEl) {
        subtitleEl.textContent = this.getFactionSubtitleText(factionId);
      }
    }

    // Refresh mission list for the selected faction
    this.refreshMissionList();
  }

  private getFactionSubtitleText(factionId: string): string {
    switch (factionId) {
      case 'brabanders':
        return 'Van boerendorp tot de poorten van de Randstad \u2014 de reis van een volk dat niet wist dat het helden kon zijn.';
      case 'limburgers':
        return 'Diep in de heuvels van het zuiden broedt een volk dat al eeuwen zijn eigen weg gaat.';
      case 'belgen':
        return 'In een land verdeeld door taal, maar verenigd door friet, rijst een onverwachte macht.';
      case 'randstad':
        return 'Van vergaderzaal tot slagveld \u2014 de corporate machine draait op volle toeren.';
      default:
        return '';
    }
  }

  private refreshMissionList(): void {
    const listEl = document.getElementById('campaign-mission-list');
    if (!listEl) return;

    const factionId = this.activeFactionTab;
    const tab = FACTION_CAMPAIGN_TABS.find(t => t.id === factionId);

    listEl.innerHTML = '';

    // If the faction campaign is not yet available, show "coming soon" placeholder
    if (tab && !tab.available) {
      const totalStars = 0;
      const maxStars = 0;
      const starsDisplay = document.getElementById('campaign-stars-display');
      if (starsDisplay) starsDisplay.textContent = `${totalStars} / ${maxStars}`;

      const placeholder = document.createElement('div');
      placeholder.style.cssText = `
        text-align: center; padding: 48px 24px; color: #a0a0a0;
        border: 2px dashed rgba(212,168,83,0.2); border-radius: 12px;
        background: rgba(20,15,10,0.4);
      `;
      placeholder.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;">${tab.icon}</div>
        <div style="
          font-family: 'Cinzel', serif; font-size: 1.3rem; font-weight: 700;
          color: #d4a853; margin-bottom: 8px;
        ">${tab.label} Campagne</div>
        <div style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px;">
          ${tab.comingSoonLabel ?? 'Binnenkort beschikbaar'}
        </div>
        <div style="font-size: 0.8rem; color: #666;">
          ${tab.missionCount > 0 ? `${tab.missionCount} missies gepland` : 'Missies worden nog ontworpen'}
        </div>
      `;
      listEl.appendChild(placeholder);
      return;
    }

    const missionsWithProgress = this.campaignManager.getMissionsWithProgress(factionId);
    const totalStars = this.campaignManager.getTotalStars(factionId);
    const maxStars = this.campaignManager.getMaxStars(factionId);

    // Update stars display
    const starsDisplay = document.getElementById('campaign-stars-display');
    if (starsDisplay) starsDisplay.textContent = `${totalStars} / ${maxStars}`;

    for (const { definition, progress } of missionsWithProgress) {
      const card = this.createMissionCard(definition, progress);
      listEl.appendChild(card);
    }
  }

  private createMissionCard(def: MissionDefinition, progress: MissionProgress): HTMLElement {
    const card = document.createElement('div');
    const isLocked = progress.status === 'locked';
    const isCompleted = progress.status === 'completed';
    const isAvailable = progress.status === 'available';

    card.style.cssText = `
      display: flex; align-items: center; gap: 16px; padding: 16px 20px;
      border: 2px solid ${isLocked ? 'rgba(100,100,100,0.2)' : isCompleted ? 'rgba(76,175,80,0.4)' : 'rgba(212,168,83,0.4)'};
      border-radius: 10px;
      background: ${isLocked ? 'rgba(30,25,20,0.6)' : 'rgba(20,15,10,0.88)'};
      cursor: ${isLocked ? 'not-allowed' : 'pointer'};
      opacity: ${isLocked ? '0.45' : '1'};
      transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
    `;

    if (!isLocked) {
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = '#d4a853';
        card.style.transform = 'translateX(4px)';
        card.style.boxShadow = '0 2px 16px rgba(212,168,83,0.15)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = isCompleted ? 'rgba(76,175,80,0.4)' : 'rgba(212,168,83,0.4)';
        card.style.transform = 'translateX(0)';
        card.style.boxShadow = 'none';
      });
      card.addEventListener('click', () => {
        this.events?.onMissionSelected(def.id);
      });
    }

    // Mission number
    const numEl = document.createElement('div');
    numEl.style.cssText = `
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Cinzel', serif; font-weight: 700; font-size: 1.2rem;
      background: ${isLocked ? 'rgba(100,100,100,0.15)' : isCompleted ? 'rgba(76,175,80,0.2)' : 'rgba(212,168,83,0.15)'};
      color: ${isLocked ? '#666' : isCompleted ? '#4CAF50' : '#d4a853'};
      border: 2px solid ${isLocked ? 'rgba(100,100,100,0.2)' : isCompleted ? 'rgba(76,175,80,0.3)' : 'rgba(212,168,83,0.3)'};
    `;
    numEl.textContent = isLocked ? '?' : `${def.missionIndex + 1}`;

    // Info container
    const infoEl = document.createElement('div');
    infoEl.style.cssText = 'flex: 1; min-width: 0;';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-family: 'Cinzel', serif; font-weight: 700; font-size: 1.05rem;
      color: ${isLocked ? '#666' : '#e8e6e3'}; margin-bottom: 4px;
    `;
    titleEl.textContent = isLocked ? 'Vergrendeld' : def.title;

    const descEl = document.createElement('div');
    descEl.style.cssText = 'font-size: 0.8rem; color: #a0a0a0; line-height: 1.4;';
    if (isLocked) {
      descEl.textContent = 'Voltooi de vorige missie om deze te ontgrendelen.';
    } else {
      // Short description from briefing (first sentence)
      const firstSentence = def.briefingText.split('.')[0] + '.';
      descEl.textContent = firstSentence.length > 80 ? firstSentence.slice(0, 77) + '...' : firstSentence;
    }

    infoEl.appendChild(titleEl);
    infoEl.appendChild(descEl);

    // Best time
    if (isCompleted && progress.bestTimeSeconds > 0) {
      const timeEl = document.createElement('div');
      timeEl.style.cssText = 'font-size: 0.7rem; color: #a0a0a0; margin-top: 4px;';
      const mins = Math.floor(progress.bestTimeSeconds / 60);
      const secs = Math.floor(progress.bestTimeSeconds % 60);
      timeEl.textContent = `Beste tijd: ${mins}:${secs.toString().padStart(2, '0')}`;
      infoEl.appendChild(timeEl);
    }

    // Stars
    const starsEl = document.createElement('div');
    starsEl.style.cssText = 'flex-shrink: 0; font-size: 1.3rem; letter-spacing: 2px;';
    if (isLocked) {
      starsEl.innerHTML = '<span style="color: #333;">&#9733;&#9733;&#9733;</span>';
    } else {
      let starsHtml = '';
      for (let i = 0; i < 3; i++) {
        starsHtml += `<span style="color: ${i < progress.stars ? '#d4a853' : '#333'};">&#9733;</span>`;
      }
      starsEl.innerHTML = starsHtml;
    }

    card.appendChild(numEl);
    card.appendChild(infoEl);
    card.appendChild(starsEl);

    return card;
  }

  // -----------------------------------------------------------------------
  // DOM creation: Briefing Screen
  // -----------------------------------------------------------------------

  private createBriefingDOM(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    const el = document.createElement('div');
    el.id = 'campaign-briefing';
    el.style.cssText = `
      position: absolute; inset: 0; z-index: 60; display: none;
      flex-direction: column; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(10,8,6,0.96) 0%, rgba(20,15,10,0.92) 100%);
      padding: 24px; overflow-y: auto;
    `;

    el.innerHTML = `
      <div id="briefing-content" style="
        max-width: 600px; width: 100%;
        background: rgba(20,15,10,0.88); border: 2px solid rgba(212,168,83,0.35);
        border-radius: 12px; padding: 32px; position: relative;
      ">
        <div id="briefing-header" style="
          font-family: 'Cinzel', serif; font-weight: 700; font-size: 1.5rem;
          color: #d4a853; margin-bottom: 8px; text-align: center;
        "></div>

        <div style="
          width: 60px; height: 2px; background: rgba(212,168,83,0.4);
          margin: 0 auto 20px; border-radius: 1px;
        "></div>

        <div id="briefing-text" style="
          font-size: 0.95rem; line-height: 1.7; color: #e8e6e3; white-space: pre-line;
          margin-bottom: 24px;
        "></div>

        <div style="
          font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.85rem;
          color: #d4a853; margin-bottom: 10px; letter-spacing: 0.05em;
        ">DOELSTELLINGEN</div>

        <div id="briefing-objectives" style="
          display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;
        "></div>

        <div style="
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
        ">
          <button id="briefing-back-btn" style="
            padding: 12px 28px; border: 2px solid rgba(212,168,83,0.35); border-radius: 8px;
            background: transparent; color: #a0a0a0;
            font-family: 'Cinzel', serif; font-size: 0.95rem; font-weight: 600;
            cursor: pointer; transition: background 0.15s, color 0.15s;
          ">&larr; Terug</button>
          <button id="briefing-start-btn" style="
            padding: 12px 36px; border: 2px solid #d4a853; border-radius: 8px;
            background: rgba(212,168,83,0.12); color: #d4a853;
            font-family: 'Cinzel', serif; font-size: 1rem; font-weight: 700;
            cursor: pointer; transition: background 0.2s, transform 0.15s;
          ">Start Missie &rarr;</button>
        </div>
      </div>
    `;

    overlay.appendChild(el);
    this.briefingEl = el;

    // Bind buttons
    el.querySelector('#briefing-back-btn')?.addEventListener('click', () => {
      this.events?.onBackToCampaignSelect();
    });
    el.querySelector('#briefing-back-btn')?.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.background = 'rgba(212,168,83,0.1)';
      (e.target as HTMLElement).style.color = '#e8e6e3';
    });
    el.querySelector('#briefing-back-btn')?.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.background = 'transparent';
      (e.target as HTMLElement).style.color = '#a0a0a0';
    });

    el.querySelector('#briefing-start-btn')?.addEventListener('click', () => {
      if (this.currentMissionId) {
        this.events?.onStartMission(this.currentMissionId);
      }
    });
    el.querySelector('#briefing-start-btn')?.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.background = 'rgba(212,168,83,0.25)';
      (e.target as HTMLElement).style.transform = 'scale(1.02)';
    });
    el.querySelector('#briefing-start-btn')?.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.background = 'rgba(212,168,83,0.12)';
      (e.target as HTMLElement).style.transform = 'scale(1)';
    });
  }

  private renderBriefing(missionId: string): void {
    const missionsWithProgress = this.campaignManager.getMissionsWithProgress(this.activeFactionTab);
    const entry = missionsWithProgress.find(m => m.definition.id === missionId);
    if (!entry) return;

    const { definition: def, progress } = entry;

    const headerEl = document.getElementById('briefing-header');
    if (headerEl) headerEl.textContent = def.briefingTitle;

    const textEl = document.getElementById('briefing-text');
    if (textEl) textEl.textContent = def.briefingText;

    const objEl = document.getElementById('briefing-objectives');
    if (objEl) {
      objEl.innerHTML = '';
      for (const obj of def.objectives) {
        const row = document.createElement('div');
        row.style.cssText = `
          display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px;
          border-radius: 6px; font-size: 0.9rem;
          background: ${obj.isBonus ? 'rgba(212,168,83,0.06)' : 'rgba(76,175,80,0.06)'};
          border: 1px solid ${obj.isBonus ? 'rgba(212,168,83,0.15)' : 'rgba(76,175,80,0.15)'};
        `;

        const iconSpan = document.createElement('span');
        iconSpan.style.cssText = 'flex-shrink: 0; font-size: 1rem; margin-top: 1px;';

        // Check if this bonus was already completed in a previous run
        const wasCompleted = progress.bonusesCompleted.includes(obj.id);
        if (wasCompleted) {
          iconSpan.textContent = '[OK]';
        } else {
          iconSpan.textContent = obj.isBonus ? '[*]' : '[-]';
        }

        const textSpan = document.createElement('span');
        textSpan.style.cssText = `color: ${obj.isBonus ? '#d4a853' : '#e8e6e3'};`;
        textSpan.textContent = obj.isBonus ? `Bonus: ${obj.description}` : obj.description;

        row.appendChild(iconSpan);
        row.appendChild(textSpan);
        objEl.appendChild(row);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Victory overlay (shown after mission win)
  // -----------------------------------------------------------------------

  showVictoryOverlay(stars: number, timeSeconds: number, bonuses: string[], missionTitle: string): void {
    // Remove existing victory overlay if any
    const existing = document.getElementById('mission-victory');
    if (existing) existing.remove();

    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    const el = document.createElement('div');
    el.id = 'mission-victory';
    el.style.cssText = `
      position: absolute; inset: 0; z-index: 55;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.85); animation: fadeIn 0.5s ease-out;
    `;

    const mins = Math.floor(timeSeconds / 60);
    const secs = Math.floor(timeSeconds % 60);

    let starsHtml = '';
    for (let i = 0; i < 3; i++) {
      starsHtml += `<span style="
        font-size: 3rem; margin: 0 4px;
        color: ${i < stars ? '#d4a853' : '#333'};
        text-shadow: ${i < stars ? '0 0 20px rgba(212,168,83,0.5)' : 'none'};
        animation: ${i < stars ? `starPop 0.3s ease-out ${0.3 + i * 0.15}s both` : 'none'};
      ">&#9733;</span>`;
    }

    el.innerHTML = `
      <style>
        @keyframes starPop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      </style>
      <div style="
        font-family: 'Cinzel', serif; font-size: 2.5rem; font-weight: 700;
        color: #d4a853; text-shadow: 0 0 30px rgba(212,168,83,0.5);
        margin-bottom: 8px;
      ">MISSIE VOLTOOID!</div>
      <div style="
        font-size: 1.1rem; color: #a0a0a0; margin-bottom: 20px;
      ">${missionTitle}</div>
      <div style="margin-bottom: 24px;">${starsHtml}</div>
      <div style="
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 32px;
        font-size: 0.9rem; margin-bottom: 32px;
      ">
        <div style="display: flex; justify-content: space-between; gap: 16px;">
          <span style="color: #a0a0a0;">Tijd</span>
          <span style="font-weight: 600;">${mins}:${secs.toString().padStart(2, '0')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 16px;">
          <span style="color: #a0a0a0;">Sterren</span>
          <span style="font-weight: 600; color: #d4a853;">${stars}/3</span>
        </div>
      </div>
      ${bonuses.length > 0 ? `
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="font-size: 0.8rem; color: #d4a853; margin-bottom: 8px;">BONUSSEN BEHAALD</div>
          ${bonuses.map(b => `<div style="font-size: 0.85rem; color: #4CAF50;">[V] ${b}</div>`).join('')}
        </div>
      ` : ''}
      <div style="display: flex; gap: 16px;">
        <button id="victory-campaign-btn" style="
          padding: 12px 28px; border: 2px solid #d4a853; border-radius: 6px;
          background: transparent; color: #d4a853; font-family: 'Cinzel', serif;
          font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.15s;
        ">Campagne Overzicht</button>
      </div>
    `;

    overlay.appendChild(el);

    el.querySelector('#victory-campaign-btn')?.addEventListener('click', () => {
      el.remove();
      this.events?.onBackToCampaignSelect();
    });
    el.querySelector('#victory-campaign-btn')?.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.background = 'rgba(212,168,83,0.2)';
    });
    el.querySelector('#victory-campaign-btn')?.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.background = 'transparent';
    });
  }

  /** Show defeat overlay with retry option. */
  showDefeatOverlay(missionTitle: string): void {
    const existing = document.getElementById('mission-defeat');
    if (existing) existing.remove();

    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    const el = document.createElement('div');
    el.id = 'mission-defeat';
    el.style.cssText = `
      position: absolute; inset: 0; z-index: 55;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.85); animation: fadeIn 0.5s ease-out;
    `;

    el.innerHTML = `
      <div style="
        font-family: 'Cinzel', serif; font-size: 2.5rem; font-weight: 700;
        color: #F44336; text-shadow: 0 0 30px rgba(244,67,54,0.5);
        margin-bottom: 8px;
      ">MISSIE MISLUKT</div>
      <div style="
        font-size: 1.1rem; color: #a0a0a0; margin-bottom: 32px;
      ">${missionTitle} - Brabant heeft je nodig!</div>
      <div style="display: flex; gap: 16px;">
        <button id="defeat-retry-btn" style="
          padding: 12px 28px; border: 2px solid #d4a853; border-radius: 6px;
          background: rgba(212,168,83,0.12); color: #d4a853; font-family: 'Cinzel', serif;
          font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.15s;
        ">Opnieuw Proberen</button>
        <button id="defeat-campaign-btn" style="
          padding: 12px 28px; border: 2px solid rgba(212,168,83,0.35); border-radius: 6px;
          background: transparent; color: #a0a0a0; font-family: 'Cinzel', serif;
          font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.15s;
        ">Campagne Overzicht</button>
      </div>
    `;

    overlay.appendChild(el);

    el.querySelector('#defeat-retry-btn')?.addEventListener('click', () => {
      el.remove();
      if (this.currentMissionId) {
        this.events?.onStartMission(this.currentMissionId);
      }
    });
    el.querySelector('#defeat-campaign-btn')?.addEventListener('click', () => {
      el.remove();
      this.events?.onBackToCampaignSelect();
    });
  }

  destroy(): void {
    this.campaignSelectEl?.remove();
    this.briefingEl?.remove();
    document.getElementById('mission-victory')?.remove();
    document.getElementById('mission-defeat')?.remove();
    this.events = null;
  }
}
