/**
 * CampaignManager.ts -- Tracks campaign progress and persistence.
 *
 * Responsibilities:
 * - Track which missions are completed, locked, or available
 * - Store star ratings per mission
 * - Persist to localStorage
 * - Provide mission list for the campaign select screen
 */

import { BRABANDERS_MISSIONS, LIMBURGERS_MISSIONS, BELGEN_MISSIONS, RANDSTAD_MISSIONS, type MissionDefinition } from './MissionDefinitions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MissionStatus = 'locked' | 'available' | 'completed';

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
const SAVE_VERSION = 1;

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
        if (parsed.version === SAVE_VERSION) {
          return parsed;
        }
      }
    } catch {
      console.warn('[CampaignManager] Failed to load save data, creating fresh.');
    }
    return this.createFreshSaveData();
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
      missions: missions.map((m, i) => ({
        missionId: m.id,
        status: i === 0 ? 'available' : 'locked',
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
    return definitions.map((def, i) => ({
      definition: def,
      progress: campaign.missions[i] ?? {
        missionId: def.id,
        status: 'locked' as MissionStatus,
        stars: 0,
        bestTimeSeconds: 0,
        bonusesCompleted: [],
      },
    }));
  }

  /** Check if a specific mission is available to play. */
  isMissionAvailable(missionId: string): boolean {
    const progress = this.getMissionProgress(missionId);
    return progress !== undefined && (progress.status === 'available' || progress.status === 'completed');
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

  /**
   * Complete a mission with a given rating.
   * Unlocks the next mission if applicable.
   */
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

      // Unlock next mission
      if (missionIndex + 1 < campaign.missions.length) {
        const next = campaign.missions[missionIndex + 1];
        if (next.status === 'locked') {
          next.status = 'available';
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
