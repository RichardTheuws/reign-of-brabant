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

/**
 * Every building type a faction can place, in the order the player usually
 * reaches them. Used to warm the player's whole build menu after the HUD.
 */
export const PLAYER_BUILDING_TYPES: readonly string[] = [
  'housing', 'barracks', 'lumbercamp', 'blacksmith', 'tower', 'tertiary',
  'upgrade', 'special1', 'advanced', 'siege-workshop', 'townhall',
];

/**
 * The rest of the player's own build menu: every building of the player's
 * faction that is neither critical nor already in the warm set. Game starts
 * this after the critical set, in the same one-at-a-time building queue, so
 * the first Tower / Blacksmith ghost usually has its model already.
 */
export function playerBuildingTailKeys(playerFaction: number, critical: ModelKeySet, warm: ModelKeySet): string[] {
  const skip = new Set([...critical.buildings, ...warm.buildings]);
  return PLAYER_BUILDING_TYPES.map((t) => `${t}_${playerFaction}`).filter((k) => !skip.has(k));
}

/** A failed model is tried again on the next request after this delay (ms). */
export const MODEL_RETRY_DELAY_MS = 15_000;
/** Downloads per model per match (first try + retries) before giving up. */
export const MODEL_MAX_LOAD_ATTEMPTS = 3;

/**
 * Failure memo for model loads (UnitRenderer / BuildingRenderer). A load that
 * failed is not retried on every frame's request, but after a backoff
 * (MODEL_RETRY_DELAY_MS) on the next request, up to MODEL_MAX_LOAD_ATTEMPTS
 * per match. A new match calls reset(): every failed key gets a fresh start.
 * Successful loads never come here; they stay cached in the renderer.
 */
export class ModelLoadFailures {
  private failures = new Map<string, { at: number; attempts: number; retrying: boolean }>();

  constructor(private readonly now: () => number = () => performance.now()) {}

  recordFailure(key: string): void {
    const prev = this.failures.get(key);
    this.failures.set(key, { at: this.now(), attempts: (prev?.attempts ?? 0) + 1, retrying: false });
  }

  /** A retry of `key` started: no second retry until this one has settled. */
  markRetrying(key: string): void {
    const f = this.failures.get(key);
    if (f) f.retrying = true;
  }

  recordSuccess(key: string): void {
    this.failures.delete(key);
  }

  hasFailed(key: string): boolean {
    return this.failures.has(key);
  }

  /** True when `key` failed, its backoff has passed and attempts remain. */
  canRetry(key: string): boolean {
    const f = this.failures.get(key);
    return !!f && !f.retrying && f.attempts < MODEL_MAX_LOAD_ATTEMPTS && this.now() - f.at >= MODEL_RETRY_DELAY_MS;
  }

  /** Forget all failures (new match); returns the keys that had failed. */
  reset(): string[] {
    const keys = [...this.failures.keys()];
    this.failures.clear();
    return keys;
  }
}
