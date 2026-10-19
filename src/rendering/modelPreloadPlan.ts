/**
 * modelPreloadPlan.ts -- which unit/building models a match waits for.
 *
 * Loading screen -> HUD only waits for the CRITICAL set: the models of the
 * entities that exist at the start (start Town Halls and start workers of
 * every faction, plus whatever a mission places up front) and the AI's
 * opening buildings. The AI places Housing and Barracks within seconds of
 * the start and its buildings appear finished at once; measured on Fast 4G,
 * warming them in the background still left them empty for ~12s. Terrain,
 * props and the selection ring are loaded alongside by their own renderers.
 *
 * The WARM set starts downloading at the same time, one model at a time per
 * renderer, but the HUD does not wait for it: infantry/ranged of every side
 * (AI first), the player's first buildings and the player's heroes (bought
 * instantly, no train time to hide a download behind).
 *
 * Everything else loads on demand: when a building is placed (or its ghost
 * is shown), when a unit enters a production queue (Game prefetches queued
 * types) or, at the latest, when it spawns. A unit or building that appears
 * before its model has arrived is not drawn until the model is there -- no
 * placeholder geometry (see UnitRenderer.addUnit / BuildingRenderer.addBuilding).
 *
 * Pure data, no three.js: imported by Game and by tests.
 */

/** Unit types warmed for every faction in the match (AI factions first). */
export const WARM_UNIT_TYPES: readonly string[] = ['infantry', 'ranged'];
/** Unit types warmed for the player's faction only. */
export const WARM_PLAYER_UNIT_TYPES: readonly string[] = ['hero0', 'hero1'];
/** Building types the AI places right at the start (AIController: Housing, Barracks). */
export const AI_OPENING_BUILDING_TYPES: readonly string[] = ['housing', 'barracks'];
/** Building types the player usually places first. */
export const WARM_PLAYER_BUILDING_TYPES: readonly string[] = ['housing', 'barracks', 'lumbercamp'];

export interface StartEntity {
  /** Renderer type name: 'worker', 'townhall', ... */
  type: string;
  factionId: number;
}

export interface ModelKeySet {
  units: string[];
  buildings: string[];
}

function keysOf(entities: readonly StartEntity[]): string[] {
  return [...new Set(entities.map((e) => `${e.type}_${e.factionId}`))];
}

/**
 * Model keys of everything that is on the map when the match starts, plus
 * the opening buildings of every faction an AI builds for.
 */
export function criticalModelKeys(
  units: readonly StartEntity[],
  buildings: readonly StartEntity[],
  aiFactions: Iterable<number> = [],
): ModelKeySet {
  const opening = [...new Set(aiFactions)].flatMap((f) => AI_OPENING_BUILDING_TYPES.map((type) => ({ type, factionId: f })));
  return { units: keysOf(units), buildings: keysOf([...buildings, ...opening]) };
}

/**
 * Background set (download order = array order), minus what is critical.
 * AI factions first, then the player.
 */
export function warmModelKeys(factions: Iterable<number>, playerFaction: number, critical: ModelKeySet): ModelKeySet {
  const ai = [...new Set(factions)].filter((f) => f !== playerFaction);
  const units = [
    ...WARM_UNIT_TYPES.flatMap((t) => ai.map((f) => `${t}_${f}`)),
    ...WARM_UNIT_TYPES.map((t) => `${t}_${playerFaction}`),
    ...WARM_PLAYER_UNIT_TYPES.map((t) => `${t}_${playerFaction}`),
  ];
  const buildings = WARM_PLAYER_BUILDING_TYPES.map((t) => `${t}_${playerFaction}`);
  const skipU = new Set(critical.units);
  const skipB = new Set(critical.buildings);
  return {
    units: [...new Set(units)].filter((k) => !skipU.has(k)),
    buildings: [...new Set(buildings)].filter((k) => !skipB.has(k)),
  };
}
