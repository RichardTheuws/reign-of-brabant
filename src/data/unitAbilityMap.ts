/**
 * Reign of Brabant -- Unit Ability Map
 *
 * Maps faction + unit name combinations to their ability registry indices.
 * Used by factories to assign the correct ability when spawning units.
 *
 * Units can have:
 * - 1 active ability (stored in UnitAbility component, has cooldown)
 * - Multiple passive/aura abilities (processed by system based on unit name)
 */

import { FactionId } from '../types/index';
import { findAbilityIndex } from './unitAbilityRegistry';

// ---------------------------------------------------------------------------
// Unit ability assignments: [activeAbilityId, ...passiveAbilityIds]
// activeAbilityId = -1 means no active ability (only passives/auras)
// ---------------------------------------------------------------------------

export interface UnitAbilityAssignment {
  /** Active ability index (from UNIT_ABILITY_REGISTRY). -1 = none. */
  readonly activeAbility: number;
  /** Passive/aura ability indices (processed by system each frame). */
  readonly passiveAbilities: readonly number[];
}

// Build the map lazily to avoid circular dependency issues
let _abilityMap: Map<string, UnitAbilityAssignment> | null = null;

function buildMap(): Map<string, UnitAbilityAssignment> {
  const m = new Map<string, UnitAbilityAssignment>();

  // Key format: "factionId:unitName"
  // Brabanders
  m.set(`${FactionId.Brabanders}:Carnavalvierder`, {
    activeAbility: findAbilityIndex('polonaise'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Brabanders}:Sluiper`, {
    activeAbility: findAbilityIndex('smokkelroute'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Brabanders}:Boerinne`, {
    activeAbility: findAbilityIndex('koffie-met-gebak'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Brabanders}:Muzikant`, {
    activeAbility: findAbilityIndex('carnavalskraker'),
    passiveAbilities: [
      findAbilityIndex('opzwepende-marsmuziek'),
      findAbilityIndex('valse-nansen'),
    ],
  });
  m.set(`${FactionId.Brabanders}:Tractorrijder`, {
    activeAbility: findAbilityIndex('volgas'),
    passiveAbilities: [findAbilityIndex('modder')],
  });
  m.set(`${FactionId.Brabanders}:Frituurmeester`, {
    activeAbility: findAbilityIndex('frikandel-speciaal'),
    passiveAbilities: [],
  });

  // Randstad
  m.set(`${FactionId.Randstad}:Manager`, {
    activeAbility: findAbilityIndex('performance-review'),
    passiveAbilities: [findAbilityIndex('administratieve-last')],
  });
  m.set(`${FactionId.Randstad}:Consultant`, {
    activeAbility: findAbilityIndex('reorganisatie'),
    passiveAbilities: [findAbilityIndex('adviesrapport')],
  });
  m.set(`${FactionId.Randstad}:HR-Medewerker`, {
    activeAbility: findAbilityIndex('teambuilding'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Randstad}:Corporate Advocaat`, {
    activeAbility: findAbilityIndex('juridische-procedure'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Randstad}:Influencer`, {
    activeAbility: findAbilityIndex('viral-post'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Randstad}:Vastgoedmakelaar`, {
    activeAbility: findAbilityIndex('bod-boven-vraagprijs'),
    passiveAbilities: [],
  });

  // Limburgers
  m.set(`${FactionId.Limburgers}:Schutterij`, {
    activeAbility: findAbilityIndex('vaandelzwaaien'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Limburgers}:Vlaaienwerper`, {
    activeAbility: -1,
    passiveAbilities: [findAbilityIndex('zoet-debuff')],
  });
  m.set(`${FactionId.Limburgers}:Mergelridder`, {
    activeAbility: findAbilityIndex('steenhuid'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Limburgers}:Heuvelwacht`, {
    activeAbility: -1,
    passiveAbilities: [findAbilityIndex('heuvelvoordeel')],
  });

  // Belgen
  m.set(`${FactionId.Belgen}:Bierbouwer`, {
    activeAbility: -1,
    passiveAbilities: [findAbilityIndex('bierfurie')],
  });
  m.set(`${FactionId.Belgen}:Chocolatier`, {
    activeAbility: findAbilityIndex('praline-surprise'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Belgen}:Frituurridder`, {
    activeAbility: findAbilityIndex('frituur-charge'),
    passiveAbilities: [],
  });
  m.set(`${FactionId.Belgen}:Dubbele Spion`, {
    activeAbility: findAbilityIndex('disguise'),
    passiveAbilities: [],
  });

  return m;
}

/**
 * Get the ability assignment for a specific faction + unit name.
 * Returns undefined if the unit has no abilities.
 */
export function getUnitAbilities(factionId: FactionId, unitName: string): UnitAbilityAssignment | undefined {
  if (!_abilityMap) _abilityMap = buildMap();
  return _abilityMap.get(`${factionId}:${unitName}`);
}
