/**
 * MissionDefinitions-resources.test.ts -- Locks the invariant that every
 * mission must provide enough wood sources OR not require wood at all.
 *
 * P0 incident 2026-04-25: Mission 1 (brabant-1-de-oogst) shipped without
 * any treeResources, but tutorial step 8 forces the player to train a
 * Carnavalvierder (Brabanders Infantry, costGold=75 + costSecondary=25 wood).
 * No wood sources => tutorial deadlocks. Live-test by Richard caught it on
 * v0.37.23. This test prevents the regression class.
 *
 * Invariant: if a mission's playable flow requires wood (because it forces
 * training of a wood-cost unit OR placement of a wood-cost building OR has
 * wood-related objectives), the mission MUST provide treeResources.
 *
 * For tutorial-flagged missions specifically (campaignId='brabanders' AND
 * missionIndex=0 etc.), the tutorial steps hard-code Infantry training, so
 * we lock treeResources non-empty unconditionally for those.
 */
import { describe, it, expect } from 'vitest';
import {
  BRABANDERS_MISSIONS, LIMBURGERS_MISSIONS, BELGEN_MISSIONS, RANDSTAD_MISSIONS,
} from '../src/campaign/MissionDefinitions';
import { getFactionUnitArchetype, getFactionBuildingArchetype } from '../src/data/factionData';
import {
  FactionId, UnitTypeId, BuildingTypeId,
} from '../src/types/index';

const ALL_MISSIONS = [
  ...BRABANDERS_MISSIONS,
  ...LIMBURGERS_MISSIONS,
  ...BELGEN_MISSIONS,
  ...RANDSTAD_MISSIONS,
];

// Tutorial mission (the only one where step 8 forces Infantry training).
const TUTORIAL_MISSION_ID = 'brabant-1-de-oogst';

// Buildings that ALL factions require wood for (data check).
function buildingHasWoodCost(faction: FactionId, typeId: BuildingTypeId): boolean {
  try {
    const arch = getFactionBuildingArchetype(faction, typeId);
    return (arch.costSecondary ?? 0) > 0;
  } catch {
    return false;
  }
}

function unitHasWoodCost(faction: FactionId, typeId: UnitTypeId): boolean {
  try {
    const arch = getFactionUnitArchetype(faction, typeId);
    return (arch.costSecondary ?? 0) > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Tutorial-specific lock
// ---------------------------------------------------------------------------

describe('Mission-1 tutorial — wood sources required (P0 lock)', () => {
  it('brabant-1-de-oogst MUST have non-empty treeResources', () => {
    const m1 = BRABANDERS_MISSIONS.find((m) => m.id === TUTORIAL_MISSION_ID);
    expect(m1, 'mission 1 must exist').toBeDefined();
    expect(m1!.treeResources, 'tutorial step 8 trains Infantry (25 wood) — must have trees')
      .toBeDefined();
    expect(m1!.treeResources!.length).toBeGreaterThan(0);
  });

  it('brabant-1-de-oogst trees must be reachable from spawn (within map bounds)', () => {
    const m1 = BRABANDERS_MISSIONS.find((m) => m.id === TUTORIAL_MISSION_ID)!;
    const half = m1.mapSize / 2;
    for (const t of m1.treeResources!) {
      expect(Math.abs(t.x)).toBeLessThanOrEqual(half);
      expect(Math.abs(t.z)).toBeLessThanOrEqual(half);
      expect(t.amount).toBeGreaterThan(0);
    }
  });

  it('brabant-1 trees must total enough wood for tutorial (>= 50, two infantry worth)', () => {
    const m1 = BRABANDERS_MISSIONS.find((m) => m.id === TUTORIAL_MISSION_ID)!;
    const total = m1.treeResources!.reduce((s, t) => s + t.amount, 0);
    expect(total).toBeGreaterThanOrEqual(50);
  });

  it('brabant-1 has at least one tree within 25 units of player TownHall', () => {
    const m1 = BRABANDERS_MISSIONS.find((m) => m.id === TUTORIAL_MISSION_ID)!;
    const th = m1.buildings.find(
      (b) => b.factionId === FactionId.Brabanders && b.buildingType === BuildingTypeId.TownHall,
    );
    expect(th, 'mission 1 must place a TownHall').toBeDefined();
    const close = m1.treeResources!.some((t) => {
      const dx = t.x - th!.x;
      const dz = t.z - th!.z;
      return Math.sqrt(dx * dx + dz * dz) <= 25;
    });
    expect(close, 'tutorial trees must be reachable from TownHall (<25u)').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Broader invariant: missions with wood-cost objectives need wood sources.
// ---------------------------------------------------------------------------

describe('Mission resources — wood-source invariant (regression class)', () => {
  for (const mission of ALL_MISSIONS) {
    it(`${mission.id}: has wood sources OR tutorial doesn't force wood-cost training`, () => {
      // We can't introspect every objective text, but a sound proxy: if the
      // mission spawns NO trees AND it's the tutorial (the only flow that
      // hard-codes infantry training), it's broken.
      if (mission.id === TUTORIAL_MISSION_ID) {
        expect(
          mission.treeResources && mission.treeResources.length > 0,
          'tutorial trains Brabanders Infantry (25 wood) — needs trees',
        ).toBe(true);
      }

      // Sanity: every mission with treeResources defined has positive amounts.
      if (mission.treeResources) {
        for (const t of mission.treeResources) {
          expect(t.amount).toBeGreaterThan(0);
        }
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Anchor: confirm the cost data the tutorial relies on.
// ---------------------------------------------------------------------------

describe('Tutorial cost-data anchors (informational lock)', () => {
  it('Brabanders Infantry (Carnavalvierder) costs wood — anchors tutorial requirement', () => {
    expect(unitHasWoodCost(FactionId.Brabanders, UnitTypeId.Infantry)).toBe(true);
  });

  it('Brabanders Barracks (Cafe) is gold-only — bonus objective is reachable without wood', () => {
    expect(buildingHasWoodCost(FactionId.Brabanders, BuildingTypeId.Barracks)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Faction-specific naming consistency (user feedback 2026-04-25)
// ---------------------------------------------------------------------------
// Belgen missies gebruiken "Frituur (Kazerne)", Limburgers "Heuvelfort (Kazerne)".
// Brabanders missies moeten ook hun factie-eigen building-naam tonen i.p.v.
// uitsluitend de generieke RTS-term "Kazerne". Voor Brabant: "Cafe".
// We locken de eerste tutorial-/early-game-vermelding van de Barracks per factie.
// ---------------------------------------------------------------------------

describe('Mission text — faction-specific building names (Brabanders)', () => {
  const m1 = BRABANDERS_MISSIONS.find((m) => m.id === TUTORIAL_MISSION_ID)!;

  it('M1 build-barracks objective mentions Cafe', () => {
    const obj = m1.objectives.find((o) => o.id === 'build-barracks');
    expect(obj, 'build-barracks objective must exist').toBeDefined();
    expect(obj!.description).toMatch(/Cafe/i);
  });

  it('M2 (eerste schermutsel) briefing mentions Cafe when telling player to build', () => {
    const m2 = BRABANDERS_MISSIONS.find((m) => m.id === 'brabant-2-eerste-schermutsel')!;
    expect(m2.briefingText).toMatch(/Cafe/i);
  });
});

describe('Mission text — faction-specific building names (Belgen, Limburgers — already correct)', () => {
  it('Belgen mission 1 build-barracks objective mentions Frituur', () => {
    const m = BELGEN_MISSIONS.find((x) => x.missionIndex === 0);
    expect(m).toBeDefined();
    const obj = m!.objectives.find((o) => /barracks/i.test(o.id));
    if (obj) expect(obj.description).toMatch(/Frituur/i);
  });

  it('Limburgers mission with Heuvelfort objective uses faction-name', () => {
    const all = LIMBURGERS_MISSIONS.flatMap((m) => m.objectives);
    const heuvelfortObj = all.find((o) => /Heuvelfort/i.test(o.description));
    expect(heuvelfortObj).toBeDefined();
  });
});
