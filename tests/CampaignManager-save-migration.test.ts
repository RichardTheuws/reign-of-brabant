import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CampaignManager } from '../src/campaign/CampaignManager';
import {
  BRABANDERS_MISSIONS,
  LIMBURGERS_MISSIONS,
  BELGEN_MISSIONS,
  RANDSTAD_MISSIONS,
} from '../src/campaign/MissionDefinitions';

// ---------------------------------------------------------------------------
// Helpers: in-memory localStorage stub (vitest runs in node)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'rob-campaign-progress';
let store: Map<string, string>;
const originalLocalStorage = (globalThis as { localStorage?: Storage }).localStorage;

beforeEach(() => {
  store = new Map();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
  };
});

afterEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = originalLocalStorage;
});

function entry(missionId: string, status: string, stars = 0, bestTimeSeconds = 0) {
  return { missionId, status, stars, bestTimeSeconds, bonusesCompleted: [] as string[] };
}

/** Old v1 save: old Brabant ids for 8/9, 5 Limburg + 3 Belgen missions, no Randstad. */
function v1Save() {
  return {
    version: 1,
    campaigns: [
      {
        campaignId: 'brabanders',
        missions: [
          entry('brabant-1-de-oogst', 'completed', 3, 100),
          entry('brabant-2-eerste-schermutsel', 'completed', 2, 200),
          entry('brabant-3-de-verdediging', 'completed', 3, 300),
          entry('brabant-4-de-binnendieze', 'completed', 1, 400),
          entry('brabant-5-heuvelland-diplomatie', 'completed', 2, 500),
          entry('brabant-6-de-boerenopstand', 'completed', 3, 600),
          entry('brabant-7-de-markt', 'completed', 3, 700),
          entry('brabant-8-het-beleg-van-eindhansen', 'completed', 2, 800),
          entry('brabant-9-de-brabantse-nansen', 'available'),
        ],
      },
      {
        campaignId: 'limburgers',
        missions: [
          entry('limburgers-1-de-eerste-schacht', 'completed', 3, 111),
          entry('limburgers-2-duisternis-beneden', 'completed', 2, 222),
          entry('limburgers-3-de-vlaaiproductie', 'completed', 2, 333),
          entry('limburgers-4-verrassingsaanval', 'completed', 1, 444),
          entry('limburgers-5-de-mergelmuren', 'completed', 3, 555),
        ],
      },
      {
        campaignId: 'belgen',
        missions: [
          entry('belgen-1-de-eerste-frituur', 'completed', 3, 99),
          entry('belgen-2-het-chocolade-verdrag', 'available'),
          entry('belgen-3-de-commissievergadering', 'locked'),
          entry('belgen-obsolete-mission', 'completed', 3, 1),
        ],
      },
    ],
  };
}

function loadManagerWith(save: unknown): CampaignManager {
  store.set(STORAGE_KEY, JSON.stringify(save));
  return new CampaignManager();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CampaignManager v1 save migration', () => {
  it('preserves completed missions with stars and best time', () => {
    const cm = loadManagerWith(v1Save());
    const m1 = cm.getMissionProgress('brabant-1-de-oogst');
    expect(m1?.status).toBe('completed');
    expect(m1?.stars).toBe(3);
    expect(m1?.bestTimeSeconds).toBe(100);
    expect(cm.getMissionProgress('limburgers-5-de-mergelmuren')?.status).toBe('completed');
  });

  it('maps renamed Brabant mission ids to the new ids', () => {
    const cm = loadManagerWith(v1Save());
    expect(cm.getMissionProgress('brabant-8-het-beleg-van-eindhansen')).toBeUndefined();
    const m8 = cm.getMissionProgress('brabant-8-het-beleg-van-eindhoven');
    expect(m8?.status).toBe('completed');
    expect(m8?.stars).toBe(2);
    expect(m8?.bestTimeSeconds).toBe(800);
    expect(cm.getMissionProgress('brabant-9-de-brabantse-raad')?.status).toBe('available');
    expect(cm.isMissionAvailable('brabant-9-de-brabantse-raad')).toBe(true);
  });

  it('unlocks the mission after the last completed one for extended campaigns', () => {
    const cm = loadManagerWith(v1Save());
    expect(cm.getMissionProgress('limburgers-6-tunneloorlog')?.status).toBe('available');
    expect(cm.getMissionProgress('limburgers-7-de-grote-sjtoelgang')?.status).toBe('locked');
    expect(cm.getMissionProgress('belgen-2-het-chocolade-verdrag')?.status).toBe('available');
    expect(cm.getMissionProgress('belgen-4-wafeltjeswar')?.status).toBe('locked');
  });

  it('creates entries for every current mission and drops obsolete ids', () => {
    const cm = loadManagerWith(v1Save());
    expect(cm.getMissionProgress('belgen-obsolete-mission')).toBeUndefined();
    const pairs: Array<[string, readonly { id: string }[]]> = [
      ['brabanders', BRABANDERS_MISSIONS],
      ['limburgers', LIMBURGERS_MISSIONS],
      ['belgen', BELGEN_MISSIONS],
      ['randstad', RANDSTAD_MISSIONS],
    ];
    for (const [campaignId, defs] of pairs) {
      const ids = cm.getCampaignProgress(campaignId)?.missions.map(m => m.missionId);
      expect(ids).toEqual(defs.map(d => d.id));
    }
  });

  it('makes the first Randstad mission available', () => {
    const cm = loadManagerWith(v1Save());
    expect(cm.getMissionProgress('randstad-1-de-eerste-vergadering')?.status).toBe('available');
    expect(cm.getMissionProgress('randstad-2-het-consultancy-rapport')?.status).toBe('locked');
    const withProgress = cm.getMissionsWithProgress('randstad');
    expect(withProgress).toHaveLength(RANDSTAD_MISSIONS.length);
    expect(withProgress[0].progress.status).toBe('available');
  });

  it('matches getMissionsWithProgress by id, not array position', () => {
    const save = v1Save();
    // Shuffle stored order: progress must still line up with definitions by id.
    save.campaigns[0].missions.reverse();
    const cm = loadManagerWith(save);
    for (const { definition, progress } of cm.getMissionsWithProgress('brabanders')) {
      expect(progress.missionId).toBe(definition.id);
    }
  });

  it('completing a renamed mission unlocks the next one', () => {
    const save = v1Save();
    save.campaigns[0].missions[7] = entry('brabant-8-het-beleg-van-eindhansen', 'available');
    save.campaigns[0].missions[8] = entry('brabant-9-de-brabantse-nansen', 'locked');
    const cm = loadManagerWith(save);
    expect(cm.getMissionProgress('brabant-8-het-beleg-van-eindhoven')?.status).toBe('available');
    cm.completeMission('brabant-8-het-beleg-van-eindhoven', 2, 900, []);
    expect(cm.getMissionProgress('brabant-9-de-brabantse-raad')?.status).toBe('available');
  });

  it('persists the migrated save as version 2', () => {
    loadManagerWith(v1Save());
    const persisted = JSON.parse(store.get(STORAGE_KEY) ?? '{}');
    expect(persisted.version).toBe(2);
    expect(persisted.campaigns.find((c: { campaignId: string }) => c.campaignId === 'randstad')).toBeDefined();
  });

  it('starts fresh on corrupt save data without throwing', () => {
    store.set(STORAGE_KEY, '{not json');
    const cm = new CampaignManager();
    expect(cm.getMissionProgress('brabant-1-de-oogst')?.status).toBe('available');
  });
});
