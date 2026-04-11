/**
 * Reign of Brabant -- Hero Archetypes
 *
 * Stat data for all hero units.
 * 4 heroes: 2 per faction (Brabanders + Randstad).
 * Heroes are unique (max 1 per type per player), cost 5 pop,
 * and revive at Town Hall after 60s.
 */

import {
  HeroTypeId,
  FactionId,
  ArmorType,
  AbilitySlot,
  AbilityTargetType,
  MINIMUM_MELEE_RANGE,
  type HeroArchetype,
} from '../types/index';

// ---------------------------------------------------------------------------
// Brabanders Heroes
// ---------------------------------------------------------------------------

const PRINS_VAN_BRABANT: HeroArchetype = {
  heroTypeId: HeroTypeId.PrinsVanBrabant,
  name: 'Prins van Brabant',
  factionId: FactionId.Brabanders,
  hp: 500,
  attack: 25,
  attackSpeed: 1.5,
  armor: 5,
  armorType: ArmorType.Heavy,
  speed: 5.0,
  range: MINIMUM_MELEE_RANGE,
  costGold: 350,
  costSecondary: 200,
  population: 5,
  sightRange: 12,
  buildTime: 30,
  abilities: [
    {
      id: 'prins-toespraak',
      name: 'Prinselijke Toespraak',
      slot: AbilitySlot.Q,
      cooldown: 60,
      targetType: AbilityTargetType.SelfAoE,
      radius: 12,
      range: 0,
      duration: 20,
      description: 'Allies in radius 12 krijgen +30% alle stats, 20s',
    },
    {
      id: 'prins-dans',
      name: 'Drie Dwaze Dansen',
      slot: AbilitySlot.W,
      cooldown: 45,
      targetType: AbilityTargetType.SelfAoE,
      radius: 8,
      range: 0,
      duration: 4,
      description: 'AoE stun radius 8, vijanden dansen 4s (stun)',
    },
    {
      id: 'prins-alaaf',
      name: 'ALAAF!',
      slot: AbilitySlot.E,
      cooldown: 180,
      targetType: AbilityTargetType.Self,
      radius: 999,     // map-wide
      range: 0,
      duration: 8,
      description: 'Alle Brabandse units invincible 8s. Kost 50 Gezelligheid.',
      gezelligheidCost: 50,
    },
  ],
};

const BOER_VAN_BRABANT: HeroArchetype = {
  heroTypeId: HeroTypeId.BoerVanBrabant,
  name: 'Boer van Brabant',
  factionId: FactionId.Brabanders,
  hp: 600,
  attack: 20,
  attackSpeed: 1.8,
  armor: 6,
  armorType: ArmorType.Heavy,
  speed: 4.5,
  range: MINIMUM_MELEE_RANGE,
  costGold: 400,
  costSecondary: 250,
  population: 5,
  sightRange: 10,
  buildTime: 35,
  abilities: [
    {
      id: 'boer-mestverspreider',
      name: 'Mestverspreider',
      slot: AbilitySlot.Q,
      cooldown: 20,
      targetType: AbilityTargetType.Cone,
      radius: 10,        // cone range
      range: 10,
      duration: 6,        // slow duration
      description: 'Cone AoE, 30 dmg + -40% speed 6s',
    },
    {
      id: 'boer-opstand',
      name: 'Opstand',
      slot: AbilitySlot.W,
      cooldown: 60,
      targetType: AbilityTargetType.Self,
      radius: 3,          // militia spawn radius
      range: 0,
      duration: 30,       // militia lifespan
      description: 'Roept 6 militia-boeren op (60 HP, 8 ATK, 30s levensduur)',
    },
    {
      id: 'boer-tractorcharge',
      name: 'Tractorcharge',
      slot: AbilitySlot.E,
      cooldown: 120,
      targetType: AbilityTargetType.Line,
      radius: 2,          // charge width
      range: 25,          // charge distance
      duration: 0,
      description: 'Charge 25 units afstand, 80 dmg + knockback',
    },
  ],
};

// ---------------------------------------------------------------------------
// Randstad Heroes
// ---------------------------------------------------------------------------

const DE_CEO: HeroArchetype = {
  heroTypeId: HeroTypeId.DeCEO,
  name: 'De CEO',
  factionId: FactionId.Randstad,
  hp: 450,
  attack: 20,
  attackSpeed: 1.8,
  armor: 4,
  armorType: ArmorType.Heavy,
  speed: 4.5,
  range: MINIMUM_MELEE_RANGE,
  costGold: 400,
  costSecondary: 250,
  population: 5,
  sightRange: 10,
  buildTime: 30,
  abilities: [
    {
      id: 'ceo-kwartaalcijfers',
      name: 'Kwartaalcijfers',
      slot: AbilitySlot.Q,
      cooldown: 60,
      targetType: AbilityTargetType.Self,
      radius: 999,        // all Randstad buildings
      range: 0,
      duration: 20,
      description: 'Randstad gebouwen +50% productie, 20s',
    },
    {
      id: 'ceo-goldenhandshake',
      name: 'Golden Handshake',
      slot: AbilitySlot.W,
      cooldown: 60,
      targetType: AbilityTargetType.TargetEnemy,
      radius: 0,
      range: 6,
      duration: 8,
      description: 'Target hero disabled 8s',
    },
    {
      id: 'ceo-vijandige-overname',
      name: 'Vijandige Overname',
      slot: AbilitySlot.E,
      cooldown: 180,
      targetType: AbilityTargetType.TargetEnemy,
      radius: 0,
      range: 8,
      duration: 0,
      description: 'Capture vijandelijk gebouw <50% HP',
    },
  ],
};

const DE_POLITICUS: HeroArchetype = {
  heroTypeId: HeroTypeId.DePoliticus,
  name: 'De Politicus',
  factionId: FactionId.Randstad,
  hp: 350,
  attack: 15,
  attackSpeed: 2.0,
  armor: 2,
  armorType: ArmorType.Medium,
  speed: 5.0,
  range: 9,
  costGold: 350,
  costSecondary: 300,
  population: 5,
  sightRange: 12,
  buildTime: 35,
  abilities: [
    {
      id: 'politicus-verkiezingsbelofte',
      name: 'Verkiezingsbelofte',
      slot: AbilitySlot.Q,
      cooldown: 30,
      targetType: AbilityTargetType.SelfAoE,
      radius: 10,
      range: 0,
      duration: 15,
      description: 'Allies in radius 10 krijgen +40% alle stats, 15s',
    },
    {
      id: 'politicus-lobby',
      name: 'Lobby',
      slot: AbilitySlot.W,
      cooldown: 45,
      targetType: AbilityTargetType.TargetEnemy,
      radius: 0,
      range: 12,
      duration: 30,
      description: 'Target vijandelijk tech-gebouw: research 50% langer, 30s',
    },
    {
      id: 'politicus-kamerdebat',
      name: 'Kamerdebat',
      slot: AbilitySlot.E,
      cooldown: 180,
      targetType: AbilityTargetType.SelfAoE,
      radius: 20,
      range: 0,
      duration: 12,
      description: 'Alle units (vriend EN vijand) in radius 20 stoppen met vechten 12s. Randstad-units herstellen HP.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Limburgers Heroes
// ---------------------------------------------------------------------------

const DE_MIJNBAAS: HeroArchetype = {
  heroTypeId: HeroTypeId.DeMijnwerker,
  name: 'De Mijnbaas',
  factionId: FactionId.Limburgers,
  hp: 650,
  attack: 28,
  attackSpeed: 2.0,
  armor: 8,
  armorType: ArmorType.Heavy,
  speed: 4.0,
  range: MINIMUM_MELEE_RANGE,
  costGold: 450,
  costSecondary: 300,
  population: 5,
  sightRange: 9,
  buildTime: 35,
  abilities: [
    {
      id: 'mijnbaas-mergelstorm',
      name: 'Mergelstorm',
      slot: AbilitySlot.Q,
      cooldown: 30,
      targetType: AbilityTargetType.SelfAoE,
      radius: 8,
      range: 0,
      duration: 3,
      description: 'AoE ground slam, 40 dmg + 3s stun, radius 8',
    },
    {
      id: 'mijnbaas-tunnelnetwerk',
      name: 'Tunnelnetwerk',
      slot: AbilitySlot.W,
      cooldown: 60,
      targetType: AbilityTargetType.Self,
      radius: 3,
      range: 0,
      duration: 25,
      description: 'Roept 4 mijnwerkers op (80 HP, 10 ATK, 25s levensduur)',
    },
    {
      id: 'mijnbaas-instorting',
      name: 'Instorting',
      slot: AbilitySlot.E,
      cooldown: 180,
      targetType: AbilityTargetType.SelfAoE,
      radius: 6,
      range: 0,
      duration: 15,
      description: 'AoE terrein collapse, 120 dmg + terrein impassable 15s, radius 6',
    },
  ],
};

const DE_MAASMEESTER: HeroArchetype = {
  heroTypeId: HeroTypeId.DeVlaaibaas,
  name: 'De Maasmeester',
  factionId: FactionId.Limburgers,
  hp: 380,
  attack: 14,
  attackSpeed: 2.2,
  armor: 3,
  armorType: ArmorType.Medium,
  speed: 5.0,
  range: 10,
  costGold: 350,
  costSecondary: 350,
  population: 5,
  sightRange: 14,
  buildTime: 30,
  abilities: [
    {
      id: 'maasmeester-mergelgenezing',
      name: 'Mergelgenezing',
      slot: AbilitySlot.Q,
      cooldown: 25,
      targetType: AbilityTargetType.SelfAoE,
      radius: 10,
      range: 0,
      duration: 8,
      description: 'Heal allies in radius 10, 80 HP over 8s',
    },
    {
      id: 'maasmeester-maasvloek',
      name: 'Maasvloek',
      slot: AbilitySlot.W,
      cooldown: 45,
      targetType: AbilityTargetType.TargetEnemy,
      radius: 0,
      range: 12,
      duration: 10,
      description: 'Target enemy -50% speed + -30% ATK 10s',
    },
    {
      id: 'maasmeester-rivier',
      name: 'De Rivier Herinnert',
      slot: AbilitySlot.E,
      cooldown: 120,
      targetType: AbilityTargetType.Line,
      radius: 4,
      range: 20,
      duration: 0,
      description: 'AoE water surge, 60 dmg + knockback, line 20 range width 4',
    },
  ],
};

// ---------------------------------------------------------------------------
// Belgen Heroes
// ---------------------------------------------------------------------------

const DE_FRIETKONING: HeroArchetype = {
  heroTypeId: HeroTypeId.DeChocolatier,
  name: 'De Frietkoning',
  factionId: FactionId.Belgen,
  hp: 480,
  attack: 22,
  attackSpeed: 1.6,
  armor: 5,
  armorType: ArmorType.Heavy,
  speed: 4.8,
  range: MINIMUM_MELEE_RANGE,
  costGold: 400,
  costSecondary: 280,
  population: 5,
  sightRange: 11,
  buildTime: 30,
  abilities: [
    {
      id: 'frietkoning-frietenregen',
      name: 'Frietenregen',
      slot: AbilitySlot.Q,
      cooldown: 35,
      targetType: AbilityTargetType.SelfAoE,
      radius: 8,
      range: 0,
      duration: 0,
      description: 'AoE 50 dmg + heal allies 30 HP, radius 8',
    },
    {
      id: 'frietkoning-compromis',
      name: 'Diplomatiek Compromis',
      slot: AbilitySlot.W,
      cooldown: 90,
      targetType: AbilityTargetType.TargetEnemy,
      radius: 0,
      range: 8,
      duration: 30,
      description: 'Convert enemy non-hero unit to ally 30s',
    },
    {
      id: 'frietkoning-frietkot',
      name: 'Frietkot Supreme',
      slot: AbilitySlot.E,
      cooldown: 180,
      targetType: AbilityTargetType.Self,
      radius: 3,
      range: 0,
      duration: 60,
      description: 'Summon frietkot building 60s, generates 3 chocolatiers',
    },
  ],
};

const DE_ABDIJBROUWER: HeroArchetype = {
  heroTypeId: HeroTypeId.DeFrituur,
  name: 'De Abdijbrouwer',
  factionId: FactionId.Belgen,
  hp: 400,
  attack: 12,
  attackSpeed: 2.0,
  armor: 3,
  armorType: ArmorType.Light,
  speed: 4.5,
  range: 9,
  costGold: 380,
  costSecondary: 320,
  population: 5,
  sightRange: 12,
  buildTime: 35,
  abilities: [
    {
      id: 'abdijbrouwer-trappistenzegen',
      name: 'Trappistenzegen',
      slot: AbilitySlot.Q,
      cooldown: 40,
      targetType: AbilityTargetType.SelfAoE,
      radius: 10,
      range: 0,
      duration: 15,
      description: 'Buff allies radius 10, +25% ATK + heal 5 HP/s 15s',
    },
    {
      id: 'abdijbrouwer-dubbelbock',
      name: 'Dubbelbock',
      slot: AbilitySlot.W,
      cooldown: 60,
      targetType: AbilityTargetType.TargetAlly,
      radius: 0,
      range: 8,
      duration: 10,
      description: 'Target friendly hero +100% ATK -50% speed 10s',
    },
    {
      id: 'abdijbrouwer-wapenstilstand',
      name: 'Abdijwapenstilstand',
      slot: AbilitySlot.E,
      cooldown: 180,
      targetType: AbilityTargetType.SelfAoE,
      radius: 15,
      range: 0,
      duration: 10,
      description: 'ALL units in radius 15 cannot attack 10s, allies regen 50 HP',
    },
  ],
};

// ---------------------------------------------------------------------------
// Hero Archetype Array -- indexed by HeroTypeId
// ---------------------------------------------------------------------------

export const HERO_ARCHETYPES: readonly HeroArchetype[] = [
  PRINS_VAN_BRABANT,    // HeroTypeId.PrinsVanBrabant = 0
  BOER_VAN_BRABANT,     // HeroTypeId.BoerVanBrabant = 1
  DE_CEO,               // HeroTypeId.DeCEO = 2
  DE_POLITICUS,         // HeroTypeId.DePoliticus = 3
  DE_MIJNBAAS,          // HeroTypeId.DeMijnwerker = 4
  DE_MAASMEESTER,       // HeroTypeId.DeVlaaibaas = 5
  DE_FRIETKONING,       // HeroTypeId.DeChocolatier = 6
  DE_ABDIJBROUWER,      // HeroTypeId.DeFrituur = 7
] as const;

/**
 * Get hero archetype by HeroTypeId.
 */
export function getHeroArchetype(heroTypeId: HeroTypeId): HeroArchetype {
  const arch = HERO_ARCHETYPES[heroTypeId];
  if (!arch) throw new Error(`Unknown HeroTypeId: ${heroTypeId}`);
  return arch;
}

/**
 * Get all hero types available for a faction.
 */
export function getHeroTypesForFaction(factionId: FactionId): HeroTypeId[] {
  return HERO_ARCHETYPES
    .filter(a => a.factionId === factionId)
    .map(a => a.heroTypeId);
}
