/**
 * buildingCost.ts -- Pure helpers for building affordability + payment.
 *
 * Extracted from `Game.handleBuildPlacement` so the cost-check + deduct
 * flow can be unit-tested without spinning up the full game (DOM, raycaster,
 * HUD). Game.ts now uses these helpers and turns the result into a HUD
 * alert; the maths/decision logic lives here.
 *
 * Why this matters: forgetting to deduct one of the two resources is a
 * recurring class of bug. v0.37.16 fixed it for unit-training (Bug 12 —
 * `costSecondary` / wood was never deducted, units were half-free). The
 * placement path was always correct, but it was buried in a 50-line
 * method tangled with raycasting and audio. These helpers make the
 * "two-resource deduct" contract explicit and machine-verifiable.
 */
import { BUILDING_ARCHETYPES } from '../entities/archetypes';
import { BuildingTypeId } from '../types/index';

/** Default fallback when an archetype is missing (defensive). */
const FALLBACK_GOLD_COST = 150;

/**
 * Town Hall build-cost (player-built expansion). Het archetype zelf staat op
 * 0/0 want het is start-spawn — die hoeft niet te kosten. Wanneer een speler
 * een tweede TownHall bouwt (gold-mine in startbase opgedroogd) is de cost
 * fors zodat het strategisch is, niet spammable.
 */
export const TOWNHALL_BUILD_GOLD = 400;
export const TOWNHALL_BUILD_WOOD = 250;

/** Minimal slice of PlayerState the cost helpers need (for testability). */
export interface BuildingCostPlayerState {
  canAfford(factionId: number, gold: number): boolean;
  canAffordWood(factionId: number, wood: number): boolean;
  spend(factionId: number, gold: number): void;
  spendWood(factionId: number, wood: number): void;
}

export interface BuildingCost {
  goldCost: number;
  woodCost: number;
}

export type BuildingAffordResult =
  | { ok: true; goldCost: number; woodCost: number }
  | { ok: false; missing: 'gold' | 'wood'; goldCost: number; woodCost: number; required: number };

/** Look up the gold + wood cost of a building from its archetype. */
export function getBuildingCost(buildingTypeId: BuildingTypeId): BuildingCost {
  // TownHall override: archetype = 0/0 (start-spawn), build-mode = 400/250.
  if (buildingTypeId === BuildingTypeId.TownHall) {
    return { goldCost: TOWNHALL_BUILD_GOLD, woodCost: TOWNHALL_BUILD_WOOD };
  }
  const arch = buildingTypeId < BUILDING_ARCHETYPES.length ? BUILDING_ARCHETYPES[buildingTypeId] : null;
  return {
    goldCost: arch?.costGold ?? FALLBACK_GOLD_COST,
    woodCost: arch?.costWood ?? 0,
  };
}

/**
 * Check whether the player can afford a building. Does NOT mutate state.
 * Returns ok=true with the resolved costs, or ok=false with the resource
 * that was insufficient and how much was required.
 */
export function checkBuildingAffordability(
  buildingTypeId: BuildingTypeId,
  factionId: number,
  state: BuildingCostPlayerState,
): BuildingAffordResult {
  const { goldCost, woodCost } = getBuildingCost(buildingTypeId);

  if (!state.canAfford(factionId, goldCost)) {
    return { ok: false, missing: 'gold', goldCost, woodCost, required: goldCost };
  }
  if (woodCost > 0 && !state.canAffordWood(factionId, woodCost)) {
    return { ok: false, missing: 'wood', goldCost, woodCost, required: woodCost };
  }
  return { ok: true, goldCost, woodCost };
}

/**
 * Deduct both resources from PlayerState. Caller must have already verified
 * affordability via `checkBuildingAffordability` — calling this when the
 * player can't afford either resource will leave PlayerState in an
 * inconsistent state (one resource deducted, the other not).
 */
export function chargeBuildingCost(
  goldCost: number,
  woodCost: number,
  factionId: number,
  state: BuildingCostPlayerState,
): void {
  state.spend(factionId, goldCost);
  if (woodCost > 0) state.spendWood(factionId, woodCost);
}
