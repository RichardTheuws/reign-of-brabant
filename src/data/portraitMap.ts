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

import { FactionId, UnitTypeId, HeroTypeId } from '../types/index';

// ---------------------------------------------------------------------------
// Base path (relative to public root, Vite resolves this at build time)
// ---------------------------------------------------------------------------

const PORTRAIT_BASE = '/assets/portraits';

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
