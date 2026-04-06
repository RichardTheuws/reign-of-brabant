/**
 * Reign of Brabant -- Data Module Barrel Export
 *
 * Re-exports all faction data, enums, and helpers from the data layer.
 */

export {
  // Enums
  ExtendedUnitTypeId,
  ExtendedBuildingTypeId,
  ExtendedFactionId,
  // Data maps
  FACTION_UNITS,
  FACTION_BUILDINGS,
  // Helper functions
  getUnitsForFaction,
  getBuildingsForFaction,
  getFactionUnitByName,
  getFactionUnitArchetype,
  getFactionBuildingByName,
  getFactionBuildingArchetype,
  getAllWorkers,
  getTownHall,
  getBarracks,
} from './factionData';
