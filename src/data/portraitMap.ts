/**
 * Reign of Brabant -- Portrait Map
 *
 * Maps faction + unit type (or hero type) to a portrait image URL.
 * Portraits are stored in /assets/portraits/ as PNG files.
 *
 * Usage:
 *   getUnitPortraitUrl(FactionId.Brabanders, UnitTypeId.Worker) => '/assets/portraits/brabant-worker.png'
 *   getHeroPortraitUrl(HeroTypeId.PrinsVanBrabant) => '/assets/portraits/brabant-prins.png'
 */

import { FactionId, UnitTypeId, HeroTypeId, BuildingTypeId } from '../types/index';

// ---------------------------------------------------------------------------
// Base path (relative to public root, Vite resolves this at build time)
// ---------------------------------------------------------------------------

const PORTRAIT_BASE = '/assets/portraits';

/** factionId → URL-safe slug used as filename prefix. */
const FACTION_SLUGS: Record<number, string> = {
  [FactionId.Brabanders]: 'brabant',
  [FactionId.Randstad]: 'randstad',
  [FactionId.Limburgers]: 'limburg',
  [FactionId.Belgen]: 'belgen',
};

/** BuildingTypeId → URL-safe key used as filename suffix. */
const BUILDING_SLUGS: Record<number, string> = {
  [BuildingTypeId.TownHall]: 'townhall',
  [BuildingTypeId.Barracks]: 'barracks',
  [BuildingTypeId.LumberCamp]: 'lumbercamp',
  [BuildingTypeId.Blacksmith]: 'blacksmith',
  [BuildingTypeId.Housing]: 'housing',
  [BuildingTypeId.TertiaryResourceBuilding]: 'tertiary',
  [BuildingTypeId.UpgradeBuilding]: 'upgrade',
  [BuildingTypeId.FactionSpecial1]: 'faction-special-1',
  [BuildingTypeId.FactionSpecial2]: 'faction-special-2',
  [BuildingTypeId.DefenseTower]: 'defense-tower',
  [BuildingTypeId.SiegeWorkshop]: 'siege-workshop',
  [BuildingTypeId.Bridge]: 'bridge',
};

// ---------------------------------------------------------------------------
// Hero portrait filenames indexed by HeroTypeId
// ---------------------------------------------------------------------------

const HERO_PORTRAITS: Record<number, string> = {
  [HeroTypeId.PrinsVanBrabant]: 'brabant-prins',
  [HeroTypeId.BoerVanBrabant]: 'brabant-boer',
  [HeroTypeId.DeCEO]: 'randstad-ceo',
  [HeroTypeId.DePoliticus]: 'randstad-politicus',
  [HeroTypeId.DeMijnwerker]: 'limburg-mijnbaas',
  [HeroTypeId.DeVlaaibaas]: 'limburg-maasmeester',
  [HeroTypeId.DeChocolatier]: 'belgen-frietkoning',
  [HeroTypeId.DeFrituur]: 'belgen-abdijbrouwer',
};

// ---------------------------------------------------------------------------
// Unit portrait filenames indexed by FactionId -> UnitTypeId
// ---------------------------------------------------------------------------

const UNIT_PORTRAITS: Record<number, Record<number, string>> = {
  [FactionId.Brabanders]: {
    [UnitTypeId.Worker]: 'brabant-worker',
    [UnitTypeId.Infantry]: 'brabant-infantry',
    [UnitTypeId.Ranged]: 'brabant-ranged',
  },
  [FactionId.Randstad]: {
    [UnitTypeId.Worker]: 'randstad-worker',
    [UnitTypeId.Infantry]: 'randstad-infantry',
    [UnitTypeId.Ranged]: 'randstad-ranged',
  },
  [FactionId.Limburgers]: {
    [UnitTypeId.Worker]: 'limburg-worker',
    [UnitTypeId.Infantry]: 'limburg-infantry',
    [UnitTypeId.Ranged]: 'limburg-ranged',
  },
  [FactionId.Belgen]: {
    [UnitTypeId.Worker]: 'belgen-worker',
    [UnitTypeId.Infantry]: 'belgen-infantry',
    [UnitTypeId.Ranged]: 'belgen-ranged',
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the portrait URL for a hero by HeroTypeId.
 * Returns null if no portrait is mapped for this hero type.
 */
export function getHeroPortraitUrl(heroTypeId: HeroTypeId): string | null {
  const filename = HERO_PORTRAITS[heroTypeId];
  if (!filename) return null;
  return `${PORTRAIT_BASE}/${filename}.png`;
}

/**
 * Get the portrait URL for a regular unit by faction and unit type.
 * Returns null if no portrait is mapped for this combination.
 */
export function getUnitPortraitUrl(factionId: FactionId, unitTypeId: UnitTypeId): string | null {
  const factionMap = UNIT_PORTRAITS[factionId];
  if (!factionMap) return null;
  const filename = factionMap[unitTypeId];
  if (!filename) return null;
  return `${PORTRAIT_BASE}/${filename}.png`;
}

/**
 * Get the portrait URL for any entity given its faction, unit type, and hero status.
 * This is the main entry point used by Game.ts when building SelectedUnit data.
 */
export function getPortraitUrl(
  factionId: FactionId,
  unitTypeId: UnitTypeId,
  isHero: boolean,
  heroTypeId?: HeroTypeId,
): string | null {
  if (isHero && heroTypeId !== undefined) {
    return getHeroPortraitUrl(heroTypeId);
  }
  return getUnitPortraitUrl(factionId, unitTypeId);
}

/**
 * Get the painted building portrait URL for a faction's specific building type.
 *
 * Naming convention: `/assets/portraits/buildings/<faction>-<building>.png`
 * (e.g. `belgen-faction-special-2.png`). Returns null if either slug is unknown
 * — callers fall back to the canvas-drawn portrait from BuildingPortraits.ts.
 *
 * The PNG may not exist yet (asset is generated lazily); the browser shows a
 * broken image until the canvas-drawn fallback handles it. To preflight we
 * could HEAD the URL but that doubles requests — instead we trust the asset
 * pipeline keeps `public/assets/portraits/buildings/` in sync with this map.
 */
export function getBuildingPortraitUrl(factionId: FactionId, buildingTypeId: BuildingTypeId): string | null {
  const factionSlug = FACTION_SLUGS[factionId];
  const buildingSlug = BUILDING_SLUGS[buildingTypeId];
  if (!factionSlug || !buildingSlug) return null;
  return `${PORTRAIT_BASE}/buildings/${factionSlug}-${buildingSlug}.png`;
}

export function getFactionSlug(factionId: FactionId): string | null {
  return FACTION_SLUGS[factionId] ?? null;
}
