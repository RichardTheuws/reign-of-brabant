// Structural audit of all 36 campaign missions across 4 factions.
// Catches misconfigurations (unreachable objectives, duplicate IDs, missing
// data) that the existing CampaignManager tests don't surface because they
// only exercise representative missions.
import { describe, expect, it } from 'vitest';

import {
  BRABANDERS_MISSIONS,
  LIMBURGERS_MISSIONS,
  BELGEN_MISSIONS,
  RANDSTAD_MISSIONS,
  type MissionDefinition,
  type ObjectiveType,
} from '../src/campaign/MissionDefinitions';
import { FactionId } from '../src/types/index';

const ALL_CAMPAIGNS: { name: string; missions: readonly MissionDefinition[]; expectedCount: number; expectedFaction: FactionId }[] = [
  { name: 'brabanders', missions: BRABANDERS_MISSIONS, expectedCount: 12, expectedFaction: FactionId.Brabanders },
  { name: 'limburgers', missions: LIMBURGERS_MISSIONS, expectedCount: 8,  expectedFaction: FactionId.Limburgers },
  { name: 'belgen',     missions: BELGEN_MISSIONS,     expectedCount: 8,  expectedFaction: FactionId.Belgen },
  { name: 'randstad',   missions: RANDSTAD_MISSIONS,   expectedCount: 8,  expectedFaction: FactionId.Randstad },
];

const VALID_OBJECTIVE_TYPES: readonly ObjectiveType[] = [
  'gather-gold', 'destroy-building', 'survive-waves', 'train-units',
  'train-workers', 'build-building', 'no-worker-loss', 'no-townhall-loss',
  'have-units-at-end',
];

describe('Mission structure audit — 36 missions across 4 campaigns', () => {
  describe('Campaign roster integrity', () => {
    for (const c of ALL_CAMPAIGNS) {
      it(`${c.name} campaign has exactly ${c.expectedCount} missions`, () => {
        expect(c.missions.length).toBe(c.expectedCount);
      });

      it(`${c.name} campaign mission indices are sequential 0..${c.expectedCount - 1}`, () => {
        const indices = c.missions.map(m => m.missionIndex);
        expect(indices).toEqual(Array.from({ length: c.expectedCount }, (_, i) => i));
      });

      it(`${c.name} campaign all missions are tagged with campaignId='${c.name}'`, () => {
        const offenders = c.missions.filter(m => m.campaignId !== c.name);
        expect(offenders.map(m => m.id)).toEqual([]);
      });

      it(`${c.name} campaign all missions have playerFactionId=${c.expectedFaction}`, () => {
        const offenders = c.missions.filter(m => m.playerFactionId !== c.expectedFaction);
        expect(offenders.map(m => m.id)).toEqual([]);
      });
    }

    it('global mission ID uniqueness across all 4 campaigns', () => {
      const allIds = ALL_CAMPAIGNS.flatMap(c => c.missions.map(m => m.id));
      const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
      expect(dupes).toEqual([]);
    });
  });

  describe('Required-field presence per mission', () => {
    for (const c of ALL_CAMPAIGNS) {
      for (const m of c.missions) {
        it(`${m.id}: title + briefing + map setup are non-empty`, () => {
          expect(m.title.length).toBeGreaterThan(0);
          expect(m.briefingTitle.length).toBeGreaterThan(0);
          expect(m.briefingText.length).toBeGreaterThan(20);
          expect(m.mapSize).toBeGreaterThan(0);
          expect(m.aiFactionIds.length).toBeGreaterThan(0);
          expect(m.objectives.length).toBeGreaterThan(0);
        });

        it(`${m.id}: starting resources are non-negative`, () => {
          expect(m.startingGold).toBeGreaterThanOrEqual(0);
          expect(m.startingGoldAI).toBeGreaterThanOrEqual(0);
        });

        it(`${m.id}: star thresholds are sane (3-star ≤ 2-star)`, () => {
          expect(m.starThresholds.threeStarTime).toBeLessThanOrEqual(m.starThresholds.twoStarTime);
          expect(m.starThresholds.threeStarTime).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('Objective integrity per mission', () => {
    for (const c of ALL_CAMPAIGNS) {
      for (const m of c.missions) {
        it(`${m.id}: every objective has a valid type`, () => {
          const offenders = m.objectives.filter(o => !VALID_OBJECTIVE_TYPES.includes(o.type));
          expect(offenders.map(o => `${o.id}:${o.type}`)).toEqual([]);
        });

        it(`${m.id}: every objective ID is unique within the mission`, () => {
          const ids = m.objectives.map(o => o.id);
          const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
          expect(dupes).toEqual([]);
        });

        it(`${m.id}: numeric-target objectives have targetValue > 0`, () => {
          const numericTypes: readonly ObjectiveType[] = [
            'gather-gold', 'destroy-building', 'survive-waves',
            'train-units', 'train-workers', 'build-building',
            'have-units-at-end',
          ];
          const offenders = m.objectives.filter(
            o => numericTypes.includes(o.type) && o.targetValue <= 0
          );
          expect(offenders.map(o => `${o.id}:${o.targetValue}`)).toEqual([]);
        });

        it(`${m.id}: at least one non-bonus (primary) objective exists`, () => {
          const primary = m.objectives.filter(o => !o.isBonus);
          expect(primary.length).toBeGreaterThan(0);
        });

        it(`${m.id}: '<'-comparator only on train-units (avoid-frustration)`, () => {
          const offenders = m.objectives.filter(
            o => o.comparator === '<' && o.type !== 'train-units'
          );
          expect(offenders.map(o => `${o.id}:${o.type}`)).toEqual([]);
        });
      }
    }
  });

  describe('Trigger + wave consistency', () => {
    for (const c of ALL_CAMPAIGNS) {
      for (const m of c.missions) {
        it(`${m.id}: every trigger has a unique ID`, () => {
          const ids = m.triggers.map(t => t.id);
          const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
          expect(dupes).toEqual([]);
        });

        it(`${m.id}: wave indices are sequential 0..N-1 if waves present`, () => {
          if (m.waves.length === 0) return;
          const indices = [...m.waves.map(w => w.index)].sort((a, b) => a - b);
          expect(indices).toEqual(Array.from({ length: m.waves.length }, (_, i) => i));
        });

        it(`${m.id}: wave spawnTime is non-decreasing in index order`, () => {
          if (m.waves.length < 2) return;
          const sorted = [...m.waves].sort((a, b) => a.index - b.index);
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].spawnTime).toBeGreaterThanOrEqual(sorted[i - 1].spawnTime);
          }
        });

        it(`${m.id}: 'survive-waves' objective targetValue ≤ wave count`, () => {
          const surviveObj = m.objectives.find(o => o.type === 'survive-waves');
          if (!surviveObj) return;
          expect(surviveObj.targetValue).toBeLessThanOrEqual(m.waves.length);
        });
      }
    }
  });
});
