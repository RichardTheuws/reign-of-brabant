/**
 * Reign of Brabant -- Unit Ability Registry
 *
 * Static definitions for all non-hero unit abilities.
 * Each ability is identified by a numeric ID (index in the registry array).
 * Units reference abilities by this ID via the UnitAbility ECS component.
 *
 * Three ability types:
 * - Active: manually triggered (auto for AI), has cooldown + duration
 * - Passive: always-on stat modifier, processed each frame
 * - Aura: radius-based buff/debuff, always active when alive
 */

import { UnitAbilityType, AbilityTargetType } from '../types/index';

// ---------------------------------------------------------------------------
// Ability effect types
// ---------------------------------------------------------------------------

export interface AbilityEffect {
  /** Damage dealt (to enemies). */
  readonly damage?: number;
  /** Healing applied (to allies). */
  readonly heal?: number;
  /** Stat multiplier: attack. */
  readonly attackMult?: number;
  /** Stat multiplier: speed. */
  readonly speedMult?: number;
  /** Stat multiplier: armor. */
  readonly armorMult?: number;
  /** Attack speed multiplier. */
  readonly attackSpeedMult?: number;
  /** Stun duration in seconds. */
  readonly stunDuration?: number;
  /** Speed debuff multiplier (e.g., 0.7 = -30% speed). */
  readonly speedDebuff?: number;
  /** Speed debuff duration. */
  readonly speedDebuffDuration?: number;
  /** Gezelligheid generated. */
  readonly gezelligheidGenerated?: number;
  /** Number of units to summon. */
  readonly summonCount?: number;
  /** Knockback distance. */
  readonly knockback?: number;
  /** Self-disable duration after use. */
  readonly selfDisableDuration?: number;
  /** Invisibility duration. */
  readonly invisDuration?: number;
  /** Damage per second (DoT/zone). */
  readonly dps?: number;
  /** Production speed modifier on enemy buildings. */
  readonly productionDebuff?: number;
}

// ---------------------------------------------------------------------------
// Ability definition
// ---------------------------------------------------------------------------

export interface UnitAbilityDef {
  /** Unique ability ID (kebab-case). */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Ability activation type. */
  readonly type: UnitAbilityType;
  /** Targeting mode. */
  readonly targetType: AbilityTargetType;
  /** Cooldown in seconds (0 for passives/auras). */
  readonly cooldown: number;
  /** Effect duration in seconds (0 for instant). */
  readonly duration: number;
  /** Effect radius (0 for single target). */
  readonly radius: number;
  /** Range to activate (0 = self). */
  readonly range: number;
  /** Effect parameters. */
  readonly effect: AbilityEffect;
  /** Minimum nearby allies to trigger (e.g., Polonaise needs 5). */
  readonly minNearbyAllies?: number;
  /** Description for UI tooltip. */
  readonly description: string;
}

// ---------------------------------------------------------------------------
// Registry -- indexed by ability ID number
// ---------------------------------------------------------------------------

export const UNIT_ABILITY_REGISTRY: readonly UnitAbilityDef[] = [
  // =========================================================================
  // 0: Polonaise (Carnavalvierder / Brabanders Infantry)
  // When 5+ Carnavalvierders are nearby: +30% speed, +20% attack, 8s forced march
  // =========================================================================
  {
    id: 'polonaise',
    name: 'Polonaise',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 30,
    duration: 8,
    radius: 10,
    range: 0,
    effect: {
      speedMult: 1.3,
      attackMult: 1.2,
    },
    minNearbyAllies: 5,
    description: '5+ Carnavalvierders vormen een polonaise: +30% speed, +20% attack voor 8s.',
  },

  // =========================================================================
  // 1: Smokkelroute (Kansen / Brabanders Ranged)
  // Invisible for 10s, can move but not attack
  // =========================================================================
  {
    id: 'smokkelroute',
    name: 'Smokkelroute',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.Self,
    cooldown: 45,
    duration: 10,
    radius: 0,
    range: 0,
    effect: {
      invisDuration: 10,
    },
    description: 'Wordt onzichtbaar voor 10s. Kan bewegen maar niet aanvallen.',
  },

  // =========================================================================
  // 2: Koffie met Gebak (Boerinne / Brabanders Support)
  // AoE heal 25 HP + generates 5 Gezelligheid
  // =========================================================================
  {
    id: 'koffie-met-gebak',
    name: 'Koffie met Gebak',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 30,
    duration: 0,
    radius: 8,
    range: 0,
    effect: {
      heal: 25,
      gezelligheidGenerated: 5,
    },
    description: 'AoE heal (25 HP) + genereert 5 Gezelligheid. Radius: 8.',
  },

  // =========================================================================
  // 3: Opzwepende Marsmuziek (Muzikansen / Brabanders Special)
  // Aura: allies in radius 10 get +25% attack speed
  // =========================================================================
  {
    id: 'opzwepende-marsmuziek',
    name: 'Opzwepende Marsmuziek',
    type: UnitAbilityType.Aura,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 0,
    duration: 0,
    radius: 10,
    range: 0,
    effect: {
      attackSpeedMult: 0.75, // 25% faster = multiply attack speed by 0.75
    },
    description: 'Allies in radius 10 krijgen +25% attack speed.',
  },

  // =========================================================================
  // 4: Carnavalskraker (Muzikansen / Brabanders Special)
  // Enemies in radius 8 stunned 3s
  // =========================================================================
  {
    id: 'carnavalskraker',
    name: 'Carnavalskraker',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 40,
    duration: 0,
    radius: 8,
    range: 0,
    effect: {
      stunDuration: 3,
    },
    description: 'Vijandelijke units in radius 8 stoppen 3 seconden.',
  },

  // =========================================================================
  // 5: Valse Nansen (Muzikansen / Brabanders Special)
  // Passive debuff: enemies in radius 8 get -20% accuracy
  // =========================================================================
  {
    id: 'valse-nansen',
    name: 'Valse Nansen',
    type: UnitAbilityType.Aura,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 0,
    duration: 0,
    radius: 8,
    range: 0,
    effect: {
      // -20% accuracy = 20% chance to miss = effectively -20% damage
      attackMult: 0.8,
    },
    description: 'Vijanden in radius 8 krijgen -20% accuracy.',
  },

  // =========================================================================
  // 6: Volgas (Tractorrijder / Brabanders Heavy)
  // Charge 20 units, 40 dmg + knockback, 5s self-disable
  // =========================================================================
  {
    id: 'volgas',
    name: 'Volgas',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.Line,
    cooldown: 25,
    duration: 0,
    radius: 2,
    range: 20,
    effect: {
      damage: 40,
      knockback: 5,
      selfDisableDuration: 5,
    },
    description: 'Charge in rechte lijn (20 units), 40 dmg + knockback. 5s disabled daarna.',
  },

  // =========================================================================
  // 7: Modder (Tractorrijder / Brabanders Heavy)
  // Passive: leaves mud trail that slows enemies -30% speed for 5s
  // =========================================================================
  {
    id: 'modder',
    name: 'Modder',
    type: UnitAbilityType.Passive,
    targetType: AbilityTargetType.Self,
    cooldown: 0,
    duration: 5,
    radius: 2,
    range: 0,
    effect: {
      speedDebuff: 0.7,
      speedDebuffDuration: 5,
    },
    description: 'Laat modderspoor achter dat vijanden vertraagt (-30% speed, 5s).',
  },

  // =========================================================================
  // 8: Frikandel Speciaal (Frituurmeester / Brabanders Siege)
  // AoE ground fire: 10 DPS for 8s, radius 4
  // =========================================================================
  {
    id: 'frikandel-speciaal',
    name: 'Frikandel Speciaal',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.PositionAoE,
    cooldown: 35,
    duration: 8,
    radius: 4,
    range: 10,
    effect: {
      dps: 10,
    },
    description: 'AoE brandplek op targetlocatie. 10 DPS voor 8s, radius 4.',
  },

  // =========================================================================
  // RANDSTAD ABILITIES (9-19)
  // =========================================================================

  // 9: Performance Review (Manager / Randstad Infantry)
  {
    id: 'performance-review',
    name: 'Performance Review',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.TargetEnemy,
    cooldown: 25,
    duration: 10,
    radius: 0,
    range: 6,
    effect: {
      attackMult: 0.7, // -30% attack
    },
    description: 'Target vijand: -30% attack voor 10s.',
  },

  // 10: Administratieve Last (Manager / Randstad Infantry)
  {
    id: 'administratieve-last',
    name: 'Administratieve Last',
    type: UnitAbilityType.Passive,
    targetType: AbilityTargetType.Self,
    cooldown: 0,
    duration: 10,
    radius: 0,
    range: 0,
    effect: {
      speedDebuff: 0.95, // -5% per stack, handled in system
      speedDebuffDuration: 10,
    },
    description: 'Elke hit: -5% speed (stacks tot -50%, 10s per stack).',
  },

  // 11: Adviesrapport (Consultant / Randstad Ranged)
  {
    id: 'adviesrapport',
    name: 'Adviesrapport',
    type: UnitAbilityType.Aura,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 0,
    duration: 0,
    radius: 10,
    range: 0,
    effect: {
      productionDebuff: 0.7, // -30% production speed
    },
    description: 'Vijandelijke gebouwen in radius 10: -30% productie.',
  },

  // 12: Reorganisatie (Consultant / Randstad Ranged)
  {
    id: 'reorganisatie',
    name: 'Reorganisatie',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.TargetEnemy,
    cooldown: 15,
    duration: 5,
    radius: 0,
    range: 8,
    effect: {
      stunDuration: 5,
    },
    description: 'Target worker stopt 5s.',
  },

  // 13: Teambuilding (HR-medewerker / Randstad Support)
  {
    id: 'teambuilding',
    name: 'Teambuilding',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 35,
    duration: 10,
    radius: 8,
    range: 0,
    effect: {
      attackMult: 1.2,
      speedMult: 1.2,
      armorMult: 1.2,
    },
    description: 'AoE +20% alle stats voor 10s. 3s cast (units immobile).',
  },

  // 14: Juridische Procedure (Corporate Advocaat / Randstad Heavy)
  {
    id: 'juridische-procedure',
    name: 'Juridische Procedure',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.TargetEnemy,
    cooldown: 45,
    duration: 0,
    radius: 0,
    range: 8,
    effect: {
      stunDuration: 6,
    },
    description: 'Target hero stunned 6s.',
  },

  // 15: Viral Post (Influencer / Randstad Ranged)
  {
    id: 'viral-post',
    name: 'Viral Post',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 20,
    duration: 0,
    radius: 6,
    range: 0,
    effect: {
      damage: 5, // 5 dmg to 3 nearby units
    },
    description: 'Spreading attack: 5 dmg naar 3 nabije vijandelijke units.',
  },

  // 16: Bod boven Vraagprijs (Vastgoedmakelaar / Randstad Siege)
  {
    id: 'bod-boven-vraagprijs',
    name: 'Bod boven Vraagprijs',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.TargetEnemy,
    cooldown: 120,
    duration: 0,
    radius: 0,
    range: 8,
    effect: {},
    description: 'Instant capture vijandelijk resource gebouw.',
  },

  // =========================================================================
  // LIMBURGER ABILITIES (17-22)
  // =========================================================================

  // 17: Vaandelzwaaien (Schutterij / Limburgers Infantry)
  {
    id: 'vaandelzwaaien',
    name: 'Vaandelzwaaien',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.SelfAoE,
    cooldown: 30,
    duration: 10,
    radius: 8,
    range: 0,
    effect: {
      attackMult: 1.15,
      armorMult: 1.15,
    },
    description: 'Allies in radius 8: +15% attack en armor voor 10s.',
  },

  // 18: Zoet (Vlaaienwerper / Limburgers Ranged)
  {
    id: 'zoet-debuff',
    name: 'Zoet',
    type: UnitAbilityType.Passive,
    targetType: AbilityTargetType.Self,
    cooldown: 0,
    duration: 0,
    radius: 0,
    range: 0,
    effect: {
      speedDebuff: 0.8, // -20% speed on hit
      speedDebuffDuration: 5,
    },
    description: 'Hit debuff: -20% speed.',
  },

  // 19: Steenhuid (Mergelridder / Limburgers Heavy)
  {
    id: 'steenhuid',
    name: 'Steenhuid',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.Self,
    cooldown: 30,
    duration: 5,
    radius: 0,
    range: 0,
    effect: {},
    description: '5s damage immunity.',
  },

  // 20: Heuvelvoordeel (Heuvelwacht / Limburgers Scout)
  {
    id: 'heuvelvoordeel',
    name: 'Heuvelvoordeel',
    type: UnitAbilityType.Passive,
    targetType: AbilityTargetType.Self,
    cooldown: 0,
    duration: 0,
    radius: 0,
    range: 0,
    effect: {
      speedMult: 1.5, // +50% speed on hills
    },
    description: '+50% speed op heuvels.',
  },

  // =========================================================================
  // BELGEN ABILITIES (21-25)
  // =========================================================================

  // 21: Praline Surprise (Chocolatier / Belgen Ranged)
  {
    id: 'praline-surprise',
    name: 'Praline Surprise',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.PositionAoE,
    cooldown: 30,
    duration: 5,
    radius: 4,
    range: 8,
    effect: {
      dps: 8,
    },
    description: 'AoE poison zone, 8 DPS voor 5s.',
  },

  // 22: Charge + Slow (Frituurridder / Belgen Heavy)
  {
    id: 'frituur-charge',
    name: 'Frituurcharge',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.Line,
    cooldown: 25,
    duration: 0,
    radius: 2,
    range: 15,
    effect: {
      damage: 30,
      speedDebuff: 0.7,
      speedDebuffDuration: 5,
    },
    description: 'Charge + slow debuff (-30% speed, 5s).',
  },

  // 23: Disguise (Dubbele Spion / Belgen Special)
  {
    id: 'disguise',
    name: 'Vermomming',
    type: UnitAbilityType.Active,
    targetType: AbilityTargetType.Self,
    cooldown: 60,
    duration: 30,
    radius: 0,
    range: 0,
    effect: {},
    description: 'Vermomt zich als vijandelijke unit.',
  },

  // 24: Speed Boost na Kill (Bierbouwer / Belgen Infantry)
  {
    id: 'bierfurie',
    name: 'Bierfurie',
    type: UnitAbilityType.Passive,
    targetType: AbilityTargetType.Self,
    cooldown: 0,
    duration: 5,
    radius: 0,
    range: 0,
    effect: {
      speedMult: 1.3,
    },
    description: 'Speed boost na kill (+30% speed, 5s).',
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Get ability definition by registry index. */
export function getAbilityDef(abilityId: number): UnitAbilityDef | undefined {
  return UNIT_ABILITY_REGISTRY[abilityId];
}

/** Find ability index by string ID. */
export function findAbilityIndex(id: string): number {
  return UNIT_ABILITY_REGISTRY.findIndex((a) => a.id === id);
}
