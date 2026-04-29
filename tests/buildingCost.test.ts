/**
 * buildingCost.test.ts -- Locks the gold + wood deduction contract for
 * building placement.
 *
 * Companion to training-deducts-wood.test.ts (which guards the same
 * contract for unit-training, where Bug 12 in v0.37.16 had units half-free
 * because woodCost was never deducted). The placement path was always
 * correct, but it was buried in Game.ts:1759-1812 entangled with raycaster
 * and HUD calls. Now extracted to a pure helper and tested directly.
 *
 * Two-resource invariant: a building costs gold AND optionally wood. Both
 * checks must pass before either is deducted, and both must be deducted
 * atomically when they pass. Forgetting one deduction is the recurring
 * class of bug.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBuildingCost,
  checkBuildingAffordability,
  chargeBuildingCost,
  type BuildingCostPlayerState,
} from '../src/world/buildingCost';
import { BuildingTypeId, FactionId } from '../src/types/index';
import { BUILDING_ARCHETYPES } from '../src/entities/archetypes';

// Minimal in-memory PlayerState stub that records every call.
function makeState(initialGold: number, initialWood: number): BuildingCostPlayerState & {
  gold: number;
  wood: number;
  spendCalls: Array<{ resource: 'gold' | 'wood'; amount: number }>;
} {
  const state = {
    gold: initialGold,
    wood: initialWood,
    spendCalls: [] as Array<{ resource: 'gold' | 'wood'; amount: number }>,
    canAfford(_factionId: number, n: number) { return state.gold >= n; },
    canAffordWood(_factionId: number, n: number) { return state.wood >= n; },
    spend(_factionId: number, n: number) {
      state.gold -= n;
      state.spendCalls.push({ resource: 'gold', amount: n });
    },
    spendWood(_factionId: number, n: number) {
      state.wood -= n;
      state.spendCalls.push({ resource: 'wood', amount: n });
    },
  };
  return state;
}

// ---------------------------------------------------------------------------
// getBuildingCost
// ---------------------------------------------------------------------------

describe('getBuildingCost', () => {
  it('returns the archetype gold + wood costs', () => {
    const cost = getBuildingCost(BuildingTypeId.Barracks);
    const arch = BUILDING_ARCHETYPES[BuildingTypeId.Barracks];
    expect(cost.goldCost).toBe(arch.costGold);
    expect(cost.woodCost).toBe(arch.costWood ?? 0);
  });

  it('returns wood=0 for buildings without a wood cost', () => {
    // Find any archetype with costWood undefined/0. Skip TownHall — it
    // has a build-mode override (400/250) for player-built expansion.
    const cheapType = BUILDING_ARCHETYPES.findIndex(
      (a, idx) => !a.costWood && idx !== BuildingTypeId.TownHall,
    );
    if (cheapType >= 0) {
      const cost = getBuildingCost(cheapType as BuildingTypeId);
      expect(cost.woodCost).toBe(0);
    }
  });

  it('falls back to FALLBACK_GOLD_COST=150 for an unknown buildingTypeId', () => {
    const cost = getBuildingCost(9999 as BuildingTypeId);
    expect(cost.goldCost).toBe(150);
    expect(cost.woodCost).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// checkBuildingAffordability — pure check, never mutates state
// ---------------------------------------------------------------------------

describe('checkBuildingAffordability', () => {
  it('returns ok=true when player has enough gold + wood', () => {
    const state = makeState(10000, 10000);
    const result = checkBuildingAffordability(BuildingTypeId.Barracks, FactionId.Brabanders, state);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.goldCost).toBeGreaterThan(0);
    }
  });

  it('returns ok=false missing=gold when player lacks gold', () => {
    const state = makeState(0, 10000);
    const result = checkBuildingAffordability(BuildingTypeId.Barracks, FactionId.Brabanders, state);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toBe('gold');
      expect(result.required).toBe(result.goldCost);
    }
  });

  it('returns ok=false missing=wood when player has gold but lacks wood', () => {
    // Find a building that requires both
    const both = BUILDING_ARCHETYPES.findIndex(a => a.costWood && a.costWood > 0);
    if (both < 0) return; // no two-resource buildings: skip silently
    const state = makeState(10000, 0);
    const result = checkBuildingAffordability(both as BuildingTypeId, FactionId.Brabanders, state);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toBe('wood');
      expect(result.required).toBe(result.woodCost);
    }
  });

  it('does NOT mutate player state', () => {
    const state = makeState(0, 0);
    checkBuildingAffordability(BuildingTypeId.Barracks, FactionId.Brabanders, state);
    expect(state.gold).toBe(0);
    expect(state.wood).toBe(0);
    expect(state.spendCalls).toHaveLength(0);
  });

  it('checks gold first, wood second (gold-failure short-circuits)', () => {
    // Player has neither — should report 'gold' missing, not 'wood'
    const state = makeState(0, 0);
    const both = BUILDING_ARCHETYPES.findIndex(a => a.costWood && a.costWood > 0);
    if (both < 0) return;
    const result = checkBuildingAffordability(both as BuildingTypeId, FactionId.Brabanders, state);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missing).toBe('gold');
  });
});

// ---------------------------------------------------------------------------
// chargeBuildingCost — deducts both resources
// ---------------------------------------------------------------------------

describe('chargeBuildingCost', () => {
  it('deducts gold from PlayerState', () => {
    const state = makeState(1000, 1000);
    chargeBuildingCost(150, 0, FactionId.Brabanders, state);
    expect(state.gold).toBe(850);
  });

  it('deducts wood when woodCost > 0', () => {
    const state = makeState(1000, 1000);
    chargeBuildingCost(150, 50, FactionId.Brabanders, state);
    expect(state.wood).toBe(950);
  });

  it('does NOT call spendWood when woodCost = 0', () => {
    const state = makeState(1000, 1000);
    chargeBuildingCost(150, 0, FactionId.Brabanders, state);
    expect(state.spendCalls.find(c => c.resource === 'wood')).toBeUndefined();
  });

  it('records BOTH spend calls when both costs > 0 (the regression we are guarding)', () => {
    const state = makeState(1000, 1000);
    chargeBuildingCost(150, 75, FactionId.Brabanders, state);
    const goldCall = state.spendCalls.find(c => c.resource === 'gold');
    const woodCall = state.spendCalls.find(c => c.resource === 'wood');
    expect(goldCall?.amount).toBe(150);
    expect(woodCall?.amount).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// End-to-end: check → charge round trip
// ---------------------------------------------------------------------------

describe('checkBuildingAffordability + chargeBuildingCost — together', () => {
  beforeEach(() => { /* makeState is fresh per test */ });

  it('happy path: check→charge deducts exactly once for each resource', () => {
    const state = makeState(10000, 10000);
    const result = checkBuildingAffordability(BuildingTypeId.Barracks, FactionId.Brabanders, state);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const goldBefore = state.gold;
      const woodBefore = state.wood;
      chargeBuildingCost(result.goldCost, result.woodCost, FactionId.Brabanders, state);
      expect(state.gold).toBe(goldBefore - result.goldCost);
      expect(state.wood).toBe(woodBefore - result.woodCost);
    }
  });

  it('insufficient gold → check fails → charge is never called → state unchanged', () => {
    const state = makeState(10, 10000);
    const result = checkBuildingAffordability(BuildingTypeId.Barracks, FactionId.Brabanders, state);
    expect(result.ok).toBe(false);
    // Caller pattern: only charge if check passed. State must still be 10/10000.
    expect(state.gold).toBe(10);
    expect(state.wood).toBe(10000);
  });
});

// ---------------------------------------------------------------------------
// TownHall build-cost override (v0.43.0)
//
// Live-bug Richard 2026-04-29: speler kan geen tweede TownHall bouwen wanneer
// startbase gold-mines opdrogen. Fix: TownHall is buildable via factionBuild-
// Menus.{factie} met hotkey H. Archetype heeft costGold=0 (start-spawn), maar
// build-mode-cost is hardcoded 400/250.
// ---------------------------------------------------------------------------
describe('TownHall — build-mode cost override', () => {
  it('getBuildingCost(TownHall) returns 400 gold + 250 wood (NOT archetype 0/0)', () => {
    const cost = getBuildingCost(BuildingTypeId.TownHall);
    expect(cost.goldCost).toBe(400);
    expect(cost.woodCost).toBe(250);
  });

  it('TownHall affordability: 399 gold = insufficient', () => {
    const state = makeState(399, 1000);
    const result = checkBuildingAffordability(BuildingTypeId.TownHall, FactionId.Brabanders, state);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toBe('gold');
      expect(result.required).toBe(400);
    }
  });

  it('TownHall affordability: 400 gold + 249 wood = insufficient (wood)', () => {
    const state = makeState(400, 249);
    const result = checkBuildingAffordability(BuildingTypeId.TownHall, FactionId.Brabanders, state);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toBe('wood');
      expect(result.required).toBe(250);
    }
  });

  it('TownHall affordability: 400/250 = ok, charging deducts both', () => {
    const state = makeState(500, 300);
    const result = checkBuildingAffordability(BuildingTypeId.TownHall, FactionId.Brabanders, state);
    expect(result.ok).toBe(true);
    if (result.ok) {
      chargeBuildingCost(result.goldCost, result.woodCost, FactionId.Brabanders, state);
      expect(state.gold).toBe(100); // 500 - 400
      expect(state.wood).toBe(50);  // 300 - 250
    }
  });
});
