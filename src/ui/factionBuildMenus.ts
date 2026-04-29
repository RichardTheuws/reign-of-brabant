/**
 * factionBuildMenus.ts -- Worker build menu data per faction.
 *
 * Extracted from HUD.ts so the menu structure (hotkey grid, tier ordering,
 * building-type mapping) is testable without pulling in the full DOM-tied
 * HUD module. HUD.ts re-imports these constants.
 *
 * Design contract enforced by tests in `tests/factionBuildMenus.test.ts`:
 *   - Every faction has Q/E/R hotkeys for tier-1 buildings (Barracks,
 *     LumberCamp, Blacksmith).
 *   - Every faction has T/F hotkeys for tier-2 (Housing, DefenseTower)
 *     and G/Z for tier-3 (FactionSpecial2, SiegeWorkshop).
 *   - Every non-Brabanders faction has X-hotkey for TertiaryResourceBuilding
 *     (Brabanders skips because their tertiary resource — Gezelligheid —
 *     is generated proximity-based by GezeligheidSystem, not buildings).
 *   - Hotkey-to-buildingTypeId is identical across factions for the same
 *     hotkey letter (only the cosmetic `label` differs per faction).
 */
import { BuildingTypeId } from '../types/index';
import type { Faction, CommandAction } from './HUD';

export interface WorkerBuildCmd {
  action: CommandAction;
  icon: string;
  label: string;
  hotkey?: string;
  iconClass?: string;
}

export interface WorkerBuildCmdExt extends WorkerBuildCmd {
  buildingTypeId?: BuildingTypeId;
  tier?: 1 | 2 | 3;
}

/** Always-available worker commands (movement, stop). */
export const BASE_WORKER_CMDS: WorkerBuildCmd[] = [
  { action: 'move', icon: 'MOV', label: '', hotkey: 'W', iconClass: 'btn-icon--move' },
  { action: 'stop', icon: 'STP', label: '', hotkey: 'E', iconClass: 'btn-icon--stop' },
];

/** Tier requirement labels for locked-building tooltips. */
export const TIER_REQUIREMENT_LABELS: Record<number, string> = {
  2: 'Smederij',                // Requires completed Blacksmith
  3: 'Geavanceerde Smederij',   // Requires completed UpgradeBuilding
};

// Hotkey grid avoids WASD (camera): Q/E/R (row 1), T/F/G (row 2), Z/X (row 3).
// Tier: 1=always, 2=requires Blacksmith, 3=requires UpgradeBuilding.
export const FACTION_WORKER_BUILDS: Record<Faction, WorkerBuildCmdExt[]> = {
  brabant: [
    { action: 'build-townhall',        icon: 'TH',  label: 'Hoofdkantoor',    hotkey: 'H', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.TownHall,                  tier: 1 },
    { action: 'build-barracks',        icon: 'BRK', label: 'Kazerne',         hotkey: 'Q', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Barracks,                 tier: 1 },
    { action: 'build-lumbercamp',      icon: 'LMB', label: 'Houtzagerij',     hotkey: 'E', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.LumberCamp,               tier: 1 },
    { action: 'build-blacksmith',      icon: 'BSM', label: 'Smederij',        hotkey: 'R', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Blacksmith,                tier: 1 },
    { action: 'build-housing',         icon: 'HSE', label: 'Boerenhoeve',     hotkey: 'T', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Housing,                   tier: 2 },
    { action: 'build-tower',           icon: 'TWR', label: 'Kerktoren',       hotkey: 'F', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.DefenseTower,              tier: 2 },
    { action: 'build-upgrade',         icon: 'UPG', label: 'Wagenbouwer',     hotkey: 'C', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.UpgradeBuilding,           tier: 2 },
    { action: 'build-faction1',        icon: 'SP1', label: 'Carnavalstent',   hotkey: 'V', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.FactionSpecial1,           tier: 2 },
    { action: 'build-faction2',        icon: 'ADV', label: 'Feestzaal',       hotkey: 'G', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.FactionSpecial2,           tier: 3 },
    { action: 'build-siege-workshop',  icon: 'SWK', label: 'Tractorschuur',   hotkey: 'Z', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.SiegeWorkshop,             tier: 3 },
    // Worstenbroodjeskraam (Bundel 4A v0.37.40): Brabant TertiaryResource — passive +0.5 Gez/sec
    // + heal-aura (8u) + Trakteerronde click-action. Vult de X-slot in.
    { action: 'build-tertiary',        icon: 'TRT', label: 'Worstenbroodjeskraam', hotkey: 'X', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.TertiaryResourceBuilding, tier: 2 },
  ],
  randstad: [
    { action: 'build-townhall',        icon: 'TH',  label: 'Hoofdkantoor',    hotkey: 'H', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.TownHall,                  tier: 1 },
    { action: 'build-barracks',        icon: 'BRK', label: 'Vergaderzaal',    hotkey: 'Q', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Barracks,                 tier: 1 },
    { action: 'build-lumbercamp',      icon: 'LMB', label: 'Starbucks',       hotkey: 'E', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.LumberCamp,               tier: 1 },
    { action: 'build-blacksmith',      icon: 'BSM', label: 'CoworkingSpace',  hotkey: 'R', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Blacksmith,                tier: 1 },
    { action: 'build-housing',         icon: 'HSE', label: 'Vinex-wijk',      hotkey: 'T', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Housing,                   tier: 2 },
    { action: 'build-tower',           icon: 'TWR', label: 'Kantoor-toren',   hotkey: 'F', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.DefenseTower,              tier: 2 },
    { action: 'build-upgrade',         icon: 'UPG', label: 'Innovatie Lab',   hotkey: 'C', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.UpgradeBuilding,           tier: 2 },
    { action: 'build-faction1',        icon: 'SP1', label: 'Boardroom',        hotkey: 'V', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.FactionSpecial1,           tier: 2 },
    { action: 'build-faction2',        icon: 'ADV', label: 'Parkeergarage',   hotkey: 'G', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.FactionSpecial2,           tier: 3 },
    { action: 'build-siege-workshop',  icon: 'SWK', label: 'Sloopwerf',       hotkey: 'Z', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.SiegeWorkshop,             tier: 3 },
    // F5-fix (v0.37.20): Randstad tertiary-resource building (Havermoutmelkbar).
    // TertiaryResourceSystem already generates 2.0 Havermoutmelk/sec per
    // completed TertiaryResourceBuilding for FactionId.Randstad, but the UI
    // had no hotkey to actually place one — so Randstad players could never
    // accumulate Havermoutmelk despite mission text expecting it.
    { action: 'build-tertiary',        icon: 'TRT', label: 'Havermoutmelkbar', hotkey: 'X', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.TertiaryResourceBuilding,  tier: 2 },
  ],
  limburg: [
    { action: 'build-townhall',        icon: 'TH',  label: 'Mergelhoeve',     hotkey: 'H', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.TownHall,                  tier: 1 },
    { action: 'build-barracks',        icon: 'BRK', label: 'Schuttershal',    hotkey: 'Q', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Barracks,                 tier: 1 },
    { action: 'build-lumbercamp',      icon: 'LMB', label: 'Vlaaibakkerij',   hotkey: 'E', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.LumberCamp,               tier: 1 },
    { action: 'build-blacksmith',      icon: 'BSM', label: 'Klooster',        hotkey: 'R', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Blacksmith,                tier: 1 },
    { action: 'build-housing',         icon: 'HSE', label: 'Huuske',          hotkey: 'T', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Housing,                   tier: 2 },
    { action: 'build-tower',           icon: 'TWR', label: 'Wachttoren',      hotkey: 'F', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.DefenseTower,              tier: 2 },
    { action: 'build-upgrade',         icon: 'UPG', label: 'Hoogoven',        hotkey: 'C', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.UpgradeBuilding,           tier: 2 },
    { action: 'build-faction1',        icon: 'SP1', label: 'Vlaaiwinkel',     hotkey: 'V', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.FactionSpecial1,           tier: 2 },
    { action: 'build-faction2',        icon: 'ADV', label: 'Mijnwerkerskamp', hotkey: 'G', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.FactionSpecial2,           tier: 3 },
    { action: 'build-siege-workshop',  icon: 'SWK', label: 'Steengroeve',     hotkey: 'Z', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.SiegeWorkshop,             tier: 3 },
    { action: 'build-mijnschacht',     icon: 'TRT', label: 'Mijnschacht',     hotkey: 'X', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.TertiaryResourceBuilding,  tier: 2 },
  ],
  belgen: [
    { action: 'build-townhall',        icon: 'TH',  label: 'Stadhuis',        hotkey: 'H', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.TownHall,                  tier: 1 },
    { action: 'build-barracks',        icon: 'BRK', label: 'Frituur',         hotkey: 'Q', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Barracks,                 tier: 1 },
    { action: 'build-lumbercamp',      icon: 'LMB', label: 'Frietfabriek',    hotkey: 'E', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.LumberCamp,               tier: 1 },
    { action: 'build-blacksmith',      icon: 'BSM', label: 'EU-Parlement',    hotkey: 'R', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Blacksmith,                tier: 1 },
    { action: 'build-housing',         icon: 'HSE', label: 'Brusselse Woning', hotkey: 'T', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.Housing,                  tier: 2 },
    { action: 'build-tower',           icon: 'TWR', label: 'Commissiegebouw', hotkey: 'F', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.DefenseTower,              tier: 2 },
    { action: 'build-upgrade',         icon: 'UPG', label: 'Diamantslijperij', hotkey: 'C', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.UpgradeBuilding,          tier: 2 },
    { action: 'build-faction1',        icon: 'SP1', label: 'Diplomatiek Salon', hotkey: 'V', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.FactionSpecial1,         tier: 2 },
    { action: 'build-faction2',        icon: 'ADV', label: 'Rijschool',       hotkey: 'G', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.FactionSpecial2,           tier: 3 },
    { action: 'build-siege-workshop',  icon: 'SWK', label: 'Frituurkanon-werkplaats', hotkey: 'Z', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.SiegeWorkshop,    tier: 3 },
    { action: 'build-chocolaterie',    icon: 'TRT', label: 'Chocolaterie',    hotkey: 'X', iconClass: 'btn-icon--build', buildingTypeId: BuildingTypeId.TertiaryResourceBuilding,  tier: 2 },
  ],
};

/** Faction-specific labels for the train panel (worker/infantry/ranged/heavy/siege/support). */
export const FACTION_BUILDING_LABELS: Record<Faction, { worker: string; infantry: string; ranged: string; heavy: string; siege: string; support: string }> = {
  brabant:  { worker: 'Boer',               infantry: 'Carnavalvierder', ranged: 'Sluiper',        heavy: 'Tractorrijder',     siege: 'Frituurmeester',  support: 'Boerinneke' },
  randstad: { worker: 'Stagiair',           infantry: 'Manager',         ranged: 'Consultant',     heavy: 'CorporateAdvocaat', siege: 'Sloopkogel',      support: 'HR-Medewerker' },
  limburg:  { worker: 'Mijnwerker',         infantry: 'Schutterij',      ranged: 'Vlaaienwerper',  heavy: 'Mergelridder',      siege: 'Mijnkarretje',    support: 'Heuvelwacht' },
  belgen:   { worker: 'Frietkraamhouder',   infantry: 'Bierbouwer',      ranged: 'Chocolatier',    heavy: 'Rijexaminator',     siege: 'Frituurkanon',    support: 'Pralinemaker' },
};
