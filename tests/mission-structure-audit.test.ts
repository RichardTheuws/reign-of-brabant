// Structural audit of all 36 campaign missions across 4 factions.
// Catches misconfigurations (unreachable objectives, duplicate IDs, missing
// data) that the existing CampaignManager tests don't surface because they
// only exercise representative missions.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getAllMissionUnitSpawns,
  getMissionFactionIds,
  MISSION_STRUCTURE_MAX_ABS_COORD,
  MISSION_UNIT_MAX_ABS_COORD,
  BRABANDERS_MISSIONS,
  LIMBURGERS_MISSIONS,
  BELGEN_MISSIONS,
  RANDSTAD_MISSIONS,
  type MissionDefinition,
  type ObjectiveType,
} from '../src/campaign/MissionDefinitions';
import { FactionId, BuildingTypeId, UnitTypeId, MAP_SIZE } from '../src/types/index';
import { getUnitsForFaction } from '../src/data/factionData';
import { FACTION_WORKER_BUILDS } from '../src/ui/factionBuildMenus';
import type { Faction } from '../src/ui/HUD';

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

// ---------------------------------------------------------------------------
// Map bounds: every coordinate must sit on the real terrain. initMission()
// always builds the default MAP_SIZE terrain (+-64) and ignores mission.mapSize,
// so a spawn at (80,80) (Belgen 1, Randstad 4) was unreachable and
// 'all-waves-defeated' could never fire.
// ---------------------------------------------------------------------------

describe('Mission coordinates lie within playable map bounds', () => {
  it('bounds constants match the terrain the game actually builds', () => {
    expect(MISSION_UNIT_MAX_ABS_COORD).toBeLessThan(MAP_SIZE / 2);
    expect(MISSION_STRUCTURE_MAX_ABS_COORD).toBeLessThanOrEqual(MISSION_UNIT_MAX_ABS_COORD);
  });

  for (const c of ALL_CAMPAIGNS) {
    for (const m of c.missions) {
      it(`${m.id}: every unit spawn (start, waves, scripted) is within +-${MISSION_UNIT_MAX_ABS_COORD}`, () => {
        const lim = MISSION_UNIT_MAX_ABS_COORD;
        const offenders = getAllMissionUnitSpawns(m)
          .filter(u => !(Math.abs(u.x) <= lim && Math.abs(u.z) <= lim))
          .map(u => `f${u.factionId}/u${u.unitType}@(${u.x.toFixed(1)},${u.z.toFixed(1)})`);
        expect(offenders).toEqual([]);
      });

      it(`${m.id}: buildings, gold mines and trees are within bounds`, () => {
        const sLim = MISSION_STRUCTURE_MAX_ABS_COORD;
        const uLim = MISSION_UNIT_MAX_ABS_COORD;
        const out = (x: number, z: number, lim: number) => !(Math.abs(x) <= lim && Math.abs(z) <= lim);
        const offenders = [
          ...m.buildings.filter(b => out(b.x, b.z, sLim)).map(b => `building f${b.factionId}/b${b.buildingType}@(${b.x},${b.z})`),
          ...m.goldMines.filter(g => out(g.x, g.z, sLim)).map(g => `gold@(${g.x},${g.z})`),
          ...(m.treeResources ?? []).filter(t => out(t.x, t.z, uLim)).map(t => `tree@(${t.x},${t.z})`),
        ];
        expect(offenders).toEqual([]);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Model preload: initMission() preloads getMissionFactionIds(mission). Every
// faction that is spawned must be in that set, or addUnit() returns null and
// the units are invisible (Belgen 3 spawns Randstad waves vs a Brabant AI).
// ---------------------------------------------------------------------------

describe('Mission model preload covers every spawned faction', () => {
  for (const c of ALL_CAMPAIGNS) {
    for (const m of c.missions) {
      it(`${m.id}: preload set includes player, AI and all spawn/building factions`, () => {
        const preload = getMissionFactionIds(m);
        const used = new Set<number>([
          m.playerFactionId,
          ...m.aiFactionIds,
          ...m.buildings.map(b => b.factionId),
          ...getAllMissionUnitSpawns(m).map(u => u.factionId),
        ]);
        const missing = [...used].filter(f => !preload.has(f));
        expect(missing).toEqual([]);
      });
    }
  }

  it('belgen-3 preloads Randstad (wave faction outside aiFactionIds)', () => {
    const b3 = BELGEN_MISSIONS.find(m => m.id === 'belgen-3-de-commissievergadering')!;
    expect(b3.aiFactionIds).not.toContain(FactionId.Randstad);
    expect(getAllMissionUnitSpawns(b3).some(u => u.factionId === FactionId.Randstad)).toBe(true);
    expect(getMissionFactionIds(b3).has(FactionId.Randstad)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Game-data references: objectives/triggers must reference things that exist.
// ---------------------------------------------------------------------------

const FACTION_MENU_KEY: Record<number, Faction> = {
  [FactionId.Brabanders]: 'brabant',
  [FactionId.Randstad]: 'randstad',
  [FactionId.Limburgers]: 'limburg',
  [FactionId.Belgen]: 'belgen',
};

function playerCanBuild(faction: FactionId, bt: BuildingTypeId): boolean {
  return FACTION_WORKER_BUILDS[FACTION_MENU_KEY[faction]].some(cmd => cmd.buildingTypeId === bt);
}

describe('Mission references to game data', () => {
  for (const c of ALL_CAMPAIGNS) {
    for (const m of c.missions) {
      it(`${m.id}: every spawned unit type exists for its faction`, () => {
        const offenders = getAllMissionUnitSpawns(m)
          .filter(u => !getUnitsForFaction(u.factionId).some(a => a.typeId === u.unitType))
          .map(u => `f${u.factionId}/${UnitTypeId[u.unitType]}`);
        expect([...new Set(offenders)]).toEqual([]);
      });

      it(`${m.id}: 'build-building' objectives and build triggers target player-buildable types`, () => {
        const offenders: string[] = [];
        for (const o of m.objectives) {
          if (o.type !== 'build-building') continue;
          const bt = o.targetBuildingType ?? BuildingTypeId.Barracks;
          if (!playerCanBuild(m.playerFactionId, bt)) offenders.push(`obj ${o.id}: ${BuildingTypeId[bt]}`);
        }
        for (const t of m.triggers) {
          const cond = t.condition;
          if ((cond.type === 'building-built' || cond.type === 'building-count') && !playerCanBuild(m.playerFactionId, cond.buildingType)) {
            offenders.push(`trigger ${t.id}: ${BuildingTypeId[cond.buildingType]}`);
          }
        }
        expect(offenders).toEqual([]);
      });

      it(`${m.id}: 'destroy-building' objectives have enough matching enemy buildings spawned`, () => {
        const offenders: string[] = [];
        for (const o of m.objectives) {
          if (o.type !== 'destroy-building') continue;
          const available = m.buildings.filter(b =>
            b.factionId !== m.playerFactionId
            && (o.targetFactionId === undefined || b.factionId === o.targetFactionId)
            && (o.targetBuildingType === undefined || b.buildingType === o.targetBuildingType),
          ).length;
          if (available < o.targetValue) offenders.push(`${o.id}: need ${o.targetValue}, spawned ${available}`);
        }
        expect(offenders).toEqual([]);
      });

      it(`${m.id}: 'building-destroyed' triggers reference a spawned building`, () => {
        const offenders = m.triggers
          .filter(t => t.condition.type === 'building-destroyed')
          .filter(t => {
            const cond = t.condition as { factionId: FactionId; buildingType: BuildingTypeId };
            return !m.buildings.some(b => b.factionId === cond.factionId && b.buildingType === cond.buildingType);
          })
          .map(t => t.id);
        expect(offenders).toEqual([]);
      });

      it(`${m.id}: wave references (spawn-wave / wave-defeated) point at defined waves`, () => {
        const waveIdx = new Set(m.waves.map(w => w.index));
        const offenders: string[] = [];
        for (const t of m.triggers) {
          if (t.condition.type === 'wave-defeated' && !waveIdx.has(t.condition.waveIndex)) offenders.push(`${t.id}: wave-defeated ${t.condition.waveIndex}`);
          for (const a of t.actions) {
            if (a.type === 'spawn-wave' && !waveIdx.has(a.waveIndex)) offenders.push(`${t.id}: spawn-wave ${a.waveIndex}`);
          }
        }
        expect(offenders).toEqual([]);
      });

      it(`${m.id}: 'all-waves-defeated' trigger only used when waves exist`, () => {
        const usesAllWaves = m.triggers.some(t => t.condition.type === 'all-waves-defeated');
        if (usesAllWaves) expect(m.waves.length).toBeGreaterThan(0);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// No unicode symbols / emoji in campaign UI or mission text (project rule:
// shapes are drawn, not glyphs). Letters with diacritics and typographic
// dashes/quotes are allowed.
// ---------------------------------------------------------------------------

// Allowed non-ASCII: Latin-1 letters (accented a-z), en/em dash, curly quotes, ellipsis.
const ALLOWED_NON_ASCII = /[\u00C0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/;

function symbolOffenders(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    if (ch.charCodeAt(0) < 0x80) continue;
    if (ALLOWED_NON_ASCII.test(ch)) continue;
    out.push(`U+${ch.codePointAt(0)!.toString(16).toUpperCase()}`);
  }
  return [...new Set(out)];
}

describe('No unicode symbols in campaign UI and mission text', () => {
  for (const c of ALL_CAMPAIGNS) {
    for (const m of c.missions) {
      it(`${m.id}: titles, briefing, objectives, messages contain no symbol glyphs`, () => {
        const texts: string[] = [m.title, m.briefingTitle, m.briefingText];
        for (const o of m.objectives) texts.push(o.description);
        for (const w of m.waves) if (w.message) texts.push(w.message);
        for (const t of m.triggers) for (const a of t.actions) if (a.type === 'message') texts.push(a.text);
        expect(symbolOffenders(texts.join('\n'))).toEqual([]);
      });
    }
  }

  it('CampaignUI.ts has no symbol glyphs or symbol HTML entities (stars/arrows are drawn)', () => {
    const src = readFileSync(resolve(__dirname, '../src/ui/CampaignUI.ts'), 'utf8');
    expect(symbolOffenders(src)).toEqual([]);
    expect(src.match(/&#\d+;|&#x[0-9a-f]+;|&(larr|rarr|uarr|darr|harr|times|check|bull|hearts|star|starf);/gi) ?? []).toEqual([]);
  });
});
