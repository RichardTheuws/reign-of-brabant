// @vitest-environment jsdom
/**
 * Campaign select: every mission is playable (no progressive locks), progress
 * stays visible, and the next mission in story order is marked 'Aanbevolen'.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CampaignManager } from '../src/campaign/CampaignManager';
import { CampaignUI, type CampaignUIEvents } from '../src/ui/CampaignUI';
import {
  BRABANDERS_MISSIONS,
  LIMBURGERS_MISSIONS,
  BELGEN_MISSIONS,
  RANDSTAD_MISSIONS,
} from '../src/campaign/MissionDefinitions';

const STORAGE_KEY = 'rob-campaign-progress';

function mount(): { ui: CampaignUI; events: CampaignUIEvents } {
  document.body.innerHTML = '<div id="ui-overlay"></div>';
  const events: CampaignUIEvents = {
    onMissionSelected: vi.fn(),
    onStartMission: vi.fn(),
    onBackToMenu: vi.fn(),
    onBackToCampaignSelect: vi.fn(),
  };
  const ui = new CampaignUI(new CampaignManager());
  ui.init(events);
  ui.showCampaignSelect();
  return { ui, events };
}

function cards(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('#campaign-mission-list [data-mission-id]')];
}

function selectTab(id: string): void {
  document.querySelector<HTMLElement>(`[data-faction-tab="${id}"]`)!.click();
}

// Node's own (flag-less) localStorage global shadows jsdom's: use a map stub.
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
  };
});

describe('CampaignUI — all missions open', () => {
  it('fresh save: every mission of every faction is startable', () => {
    const { ui, events } = mount();
    const factions: Array<[string, readonly { id: string }[]]> = [
      ['brabanders', BRABANDERS_MISSIONS],
      ['limburgers', LIMBURGERS_MISSIONS],
      ['belgen', BELGEN_MISSIONS],
      ['randstad', RANDSTAD_MISSIONS],
    ];
    for (const [factionId, defs] of factions) {
      selectTab(factionId);
      const list = cards();
      expect(list.map(c => c.dataset.missionId)).toEqual(defs.map(d => d.id));
      for (const card of list) {
        expect(card.style.cursor).toBe('pointer');
        expect(card.style.opacity === '' || card.style.opacity === '1').toBe(true);
        expect(card.textContent).not.toMatch(/vergrendeld|ontgrendel/i);
      }
    }

    // Start the last Brabant mission straight from a fresh save.
    selectTab('brabanders');
    const last = BRABANDERS_MISSIONS[BRABANDERS_MISSIONS.length - 1].id;
    cards().find(c => c.dataset.missionId === last)!.click();
    expect(events.onMissionSelected).toHaveBeenCalledWith(last);
    ui.showBriefing(last);
    document.getElementById('briefing-start-btn')!.click();
    expect(events.onStartMission).toHaveBeenCalledWith(last);
  });

  it('fresh save: only the first mission per faction is recommended', () => {
    mount();
    for (const [factionId, defs] of [
      ['brabanders', BRABANDERS_MISSIONS],
      ['randstad', RANDSTAD_MISSIONS],
    ] as const) {
      selectTab(factionId);
      const recommended = cards().filter(c => c.dataset.recommended === 'true');
      expect(recommended.map(c => c.dataset.missionId)).toEqual([defs[0].id]);
      expect(recommended[0].textContent).toContain('Aanbevolen');
      expect(cards().filter(c => c.textContent?.includes('Aanbevolen'))).toHaveLength(1);
    }
  });

  it('old v2 save with locked entries keeps progress visible and opens the rest', () => {
    const ids = BRABANDERS_MISSIONS.map(m => m.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      campaigns: [{
        campaignId: 'brabanders',
        missions: ids.map((missionId, i) => ({
          missionId,
          status: i < 2 ? 'completed' : i === 2 ? 'available' : 'locked',
          stars: i < 2 ? 3 - i : 0,
          bestTimeSeconds: i === 0 ? 125 : i === 1 ? 300 : 0,
          bonusesCompleted: [],
        })),
      }],
    }));
    mount();
    const list = cards();
    expect(list).toHaveLength(ids.length);
    expect(list[0].textContent).toContain('Beste tijd: 2:05');
    expect(list[1].textContent).toContain('Beste tijd: 5:00');
    // Earned stars stay visible (gold fill) on completed missions.
    const goldStars = (card: HTMLElement) =>
      [...card.querySelectorAll('polygon')].filter(p => p.getAttribute('fill') === '#d4a853').length;
    expect(goldStars(list[0])).toBe(3);
    expect(goldStars(list[1])).toBe(2);
    expect(goldStars(list[2])).toBe(0);
    // Recommendation = first uncompleted in story order.
    expect(list.filter(c => c.dataset.recommended === 'true').map(c => c.dataset.missionId)).toEqual([ids[2]]);
    // Formerly locked missions are now plain, clickable cards with their title.
    const formerlyLocked = list[5];
    expect(formerlyLocked.textContent).toContain(BRABANDERS_MISSIONS[5].title);
    expect(formerlyLocked.style.cursor).toBe('pointer');
  });
});
