/**
 * CampaignManager.ts -- Tracks campaign progress and persistence.
 *
 * Responsibilities:
 * - Track which missions are completed (every mission is playable: no locks)
 * - Pick the recommended next mission per campaign (story order)
 * - Store star ratings per mission
 * - Persist to localStorage
 * - Provide mission list for the campaign select screen
 */

import { BRABANDERS_MISSIONS, LIMBURGERS_MISSIONS, BELGEN_MISSIONS, RANDSTAD_MISSIONS, type MissionDefinition } from './MissionDefinitions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Every mission is playable from the start (project rule: no progressive
 * locks). 'locked' only exists in saves written before that rule; normalize()
 * turns it into 'available' on load.
 */
export type MissionStatus = 'available' | 'completed';

export interface MissionProgress {
  readonly missionId: string;
  status: MissionStatus;
  stars: number; // 0-3
  bestTimeSeconds: number; // 0 = not attempted
  bonusesCompleted: string[]; // IDs of completed bonus objectives
}

export interface CampaignProgress {
  campaignId: string;
  missions: MissionProgress[];
}

export interface CampaignSaveData {
  version: number;
  campaigns: CampaignProgress[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'rob-campaign-progress';
const SAVE_VERSION = 2;

/** Mission ids renamed since save v1 (old id -> current id). */
const RENAMED_MISSION_IDS: Readonly<Record<string, string>> = {
  'brabant-8-het-beleg-van-eindhansen': 'brabant-8-het-beleg-van-eindhoven',
  'brabant-9-de-brabantse-nansen': 'brabant-9-de-brabantse-raad',
};

const CAMPAIGN_MISSIONS: ReadonlyArray<readonly [string, readonly MissionDefinition[]]> = [
  ['brabanders', BRABANDERS_MISSIONS],
  ['limburgers', LIMBURGERS_MISSIONS],
  ['belgen', BELGEN_MISSIONS],
  ['randstad', RANDSTAD_MISSIONS],
];

// ---------------------------------------------------------------------------
// CampaignManager
// ---------------------------------------------------------------------------

export class CampaignManager {
  private data: CampaignSaveData;

  constructor() {
    this.data = this.load();
  }

  // -----------------------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------------------

  private load(): CampaignSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CampaignSaveData;
        if (parsed && typeof parsed.version === 'number' && parsed.version <= SAVE_VERSION) {
          // Migrate older saves instead of discarding player progress.
          const migrated = this.normalize(parsed);
          if (parsed.version !== SAVE_VERSION) {
            this.data = migrated;
            this.save();
          }
          return migrated;
        }
      }
    } catch {
      console.warn('[CampaignManager] Failed to load save data, creating fresh.');
    }
    return this.createFreshSaveData();
  }

  /**
   * Rebuild progress against the current mission definitions: match by id,
   * map renamed ids, drop unknown ids, add missing missions. Old 'locked'
   * entries become 'available': all missions are open, progress is kept.
   */
  private normalize(saved: CampaignSaveData): CampaignSaveData {
    const savedById = new Map<string, MissionProgress>();
    for (const campaign of Array.isArray(saved.campaigns) ? saved.campaigns : []) {
      for (const m of Array.isArray(campaign?.missions) ? campaign.missions : []) {
        if (!m || typeof m.missionId !== 'string') continue;
        savedById.set(RENAMED_MISSION_IDS[m.missionId] ?? m.missionId, m);
      }
    }

    return {
      version: SAVE_VERSION,
      campaigns: CAMPAIGN_MISSIONS.map(([campaignId, definitions]) => {
        const missions: MissionProgress[] = definitions.map((def) => {
          const old = savedById.get(def.id);
          return {
            missionId: def.id,
            status: old?.status === 'completed' ? 'completed' : 'available',
            stars: typeof old?.stars === 'number' ? old.stars : 0,
            bestTimeSeconds: typeof old?.bestTimeSeconds === 'number' ? old.bestTimeSeconds : 0,
            bonusesCompleted: Array.isArray(old?.bonusesCompleted) ? [...old.bonusesCompleted] : [],
          };
        });
        return { campaignId, missions };
      }),
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      console.warn('[CampaignManager] Failed to save progress.');
    }
  }

  private createFreshSaveData(): CampaignSaveData {
    return {
      version: SAVE_VERSION,
      campaigns: [
        this.createCampaignProgress('brabanders', BRABANDERS_MISSIONS),
        this.createCampaignProgress('limburgers', LIMBURGERS_MISSIONS),
        this.createCampaignProgress('belgen', BELGEN_MISSIONS),
        this.createCampaignProgress('randstad', RANDSTAD_MISSIONS),
      ],
    };
  }

  private createCampaignProgress(campaignId: string, missions: readonly MissionDefinition[]): CampaignProgress {
    return {
      campaignId,
      missions: missions.map((m) => ({
        missionId: m.id,
        status: 'available',
        stars: 0,
        bestTimeSeconds: 0,
        bonusesCompleted: [],
      })),
    };
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  /** Get the progress data for a specific campaign. */
  getCampaignProgress(campaignId: string): CampaignProgress | undefined {
    return this.data.campaigns.find(c => c.campaignId === campaignId);
  }

  /** Get progress for a specific mission. */
  getMissionProgress(missionId: string): MissionProgress | undefined {
    for (const campaign of this.data.campaigns) {
      const mission = campaign.missions.find(m => m.missionId === missionId);
      if (mission) return mission;
    }
    return undefined;
  }

  /** Get all mission definitions with their progress for a campaign. */
  getMissionsWithProgress(campaignId: string): Array<{ definition: MissionDefinition; progress: MissionProgress }> {
    const campaign = this.getCampaignProgress(campaignId);
    if (!campaign) return [];

    const definitions = campaignId === 'brabanders' ? BRABANDERS_MISSIONS : campaignId === 'limburgers' ? LIMBURGERS_MISSIONS : campaignId === 'belgen' ? BELGEN_MISSIONS : campaignId === 'randstad' ? RANDSTAD_MISSIONS : [];
    return definitions.map((def) => ({
      definition: def,
      progress: campaign.missions.find(m => m.missionId === def.id) ?? {
        missionId: def.id,
        status: 'available' as MissionStatus,
        stars: 0,
        bestTimeSeconds: 0,
        bonusesCompleted: [],
      },
    }));
  }

  /** Every known mission is playable (no progressive locks). */
  isMissionAvailable(missionId: string): boolean {
    return this.getMissionProgress(missionId) !== undefined;
  }

  /**
   * The mission we suggest playing next: the first mission in story order that
   * is not completed yet. Only drives the 'Aanbevolen' label, never access.
   * Returns null when the campaign is unknown or fully completed.
   */
  getRecommendedMissionId(campaignId: string): string | null {
    const campaign = this.getCampaignProgress(campaignId);
    if (!campaign) return null;
    return campaign.missions.find(m => m.status !== 'completed')?.missionId ?? null;
  }

  /** Get total stars earned across all missions in a campaign. */
  getTotalStars(campaignId: string): number {
    const campaign = this.getCampaignProgress(campaignId);
    if (!campaign) return 0;
    return campaign.missions.reduce((sum, m) => sum + m.stars, 0);
  }

  /** Get max possible stars in a campaign. */
  getMaxStars(campaignId: string): number {
    const campaign = this.getCampaignProgress(campaignId);
    if (!campaign) return 0;
    return campaign.missions.length * 3;
  }

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  /** Complete a mission with a given rating (keeps the best stars and time). */
  completeMission(
    missionId: string,
    stars: number,
    timeSeconds: number,
    bonusesCompleted: string[],
  ): void {
    for (const campaign of this.data.campaigns) {
      const missionIndex = campaign.missions.findIndex(m => m.missionId === missionId);
      if (missionIndex === -1) continue;

      const mission = campaign.missions[missionIndex];

      // Update progress (keep best)
      mission.status = 'completed';
      mission.stars = Math.max(mission.stars, stars);
      if (mission.bestTimeSeconds === 0 || timeSeconds < mission.bestTimeSeconds) {
        mission.bestTimeSeconds = timeSeconds;
      }
      // Merge bonuses
      for (const bonus of bonusesCompleted) {
        if (!mission.bonusesCompleted.includes(bonus)) {
          mission.bonusesCompleted.push(bonus);
        }
      }

      this.save();
      return;
    }
    console.warn(`[CampaignManager] Mission not found: ${missionId}`);
  }

  /** Reset all progress (for debugging). */
  resetAll(): void {
    this.data = this.createFreshSaveData();
    this.save();
  }

  /** Reset a specific campaign. */
  resetCampaign(campaignId: string): void {
    const idx = this.data.campaigns.findIndex(c => c.campaignId === campaignId);
    if (idx >= 0) {
      const missions = campaignId === 'brabanders' ? BRABANDERS_MISSIONS : campaignId === 'limburgers' ? LIMBURGERS_MISSIONS : campaignId === 'belgen' ? BELGEN_MISSIONS : campaignId === 'randstad' ? RANDSTAD_MISSIONS : [];
      this.data.campaigns[idx] = this.createCampaignProgress(campaignId, missions);
      this.save();
    }
  }
}
