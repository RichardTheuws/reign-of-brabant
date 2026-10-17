/**
 * damage-matrix.test.ts -- AttackType derivation for every archetype + hero,
 * and the AttackType x ArmorType matrix as real spawned units experience it.
 *
 * Bug (pre-fix): deriveAttackType used `range > 0`, so every contact-range
 * unit (range = MINIMUM_MELEE_RANGE = 1.5) and every melee hero got
 * AttackType.Ranged. The matrix then gave them +50% vs Medium instead of
 * +50% vs Light.
 *
 * The oracle below is written independently of deriveAttackType, and it walks
 * the archetype tables, so any archetype added later is checked automatically.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitAI, Attack, Armor, Health, Movement,
} from '../src/ecs/components';
import { IsUnit, IsBuilding } from '../src/ecs/tags';
import {
  FactionId, UnitTypeId, AttackType, ArmorType, UnitAIState, NO_ENTITY,
  MINIMUM_MELEE_RANGE, type UnitArchetype,
} from '../src/types/index';
import {
  UNIT_ARCHETYPES, RANDSTAD_UNIT_ARCHETYPES, LIMBURGERS_UNIT_ARCHETYPES, BELGEN_UNIT_ARCHETYPES,
} from '../src/entities/archetypes';
import { FACTION_UNITS } from '../src/data/factionData';
import { HERO_ARCHETYPES } from '../src/entities/heroArchetypes';
import {
  createFactionUnit, createUnit, deriveAttackType, MELEE_RANGE_MAX,
} from '../src/entities/factories';
import { createHero, resetHeroTracking } from '../src/entities/heroFactory';
import { createCombatSystem } from '../src/systems/CombatSystem';

type World = ReturnType<typeof replaceWorld>;

const FACTIONS = [FactionId.Brabanders, FactionId.Randstad, FactionId.Limburgers, FactionId.Belgen];
const LEGACY: Record<number, readonly UnitArchetype[]> = {
  [FactionId.Brabanders]: UNIT_ARCHETYPES,
  [FactionId.Randstad]: RANDSTAD_UNIT_ARCHETYPES,
  [FactionId.Limburgers]: LIMBURGERS_UNIT_ARCHETYPES,
  [FactionId.Belgen]: BELGEN_UNIT_ARCHETYPES,
};

/** Independent oracle: what the attack type SHOULD be. */
function expectedAttackType(
  explicit: AttackType | undefined,
  typeId: UnitTypeId | null,
  range: number,
): AttackType {
  if (explicit !== undefined) return explicit;
  if (typeId === UnitTypeId.Siege) return AttackType.Siege;
  if (typeId === UnitTypeId.Support || typeId === UnitTypeId.Special) return AttackType.Magic;
  return range <= MINIMUM_MELEE_RANGE ? AttackType.Melee : AttackType.Ranged;
}

beforeEach(() => {
  resetHeroTracking();
});

// ---------------------------------------------------------------------------
// (a) Threshold sanity against the data
// ---------------------------------------------------------------------------

describe('MELEE_RANGE_MAX sits between melee and ranged data', () => {
  const allRanges: { name: string; range: number; explicit?: AttackType; typeId: UnitTypeId | null }[] = [
    ...FACTIONS.flatMap((f) => FACTION_UNITS[f].map((a) => ({ name: a.name, range: a.range, explicit: a.attackType, typeId: a.typeId }))),
    ...FACTIONS.flatMap((f) => LEGACY[f].map((a) => ({ name: a.name, range: a.range, explicit: a.attackType, typeId: a.typeId }))),
    ...HERO_ARCHETYPES.map((h) => ({ name: h.name, range: h.range, explicit: h.attackType, typeId: null })),
  ];

  it('threshold is >= contact range and below the shortest ranged attack', () => {
    expect(MELEE_RANGE_MAX).toBeGreaterThanOrEqual(MINIMUM_MELEE_RANGE);
    const ranged = allRanges.filter((r) => r.range > MINIMUM_MELEE_RANGE).map((r) => r.range);
    expect(Math.min(...ranged)).toBeGreaterThan(MELEE_RANGE_MAX);
  });

  it('no archetype without explicit attackType sits in the ambiguous band (1.5, MELEE_RANGE_MAX]', () => {
    const ambiguous = allRanges.filter(
      (r) => r.explicit === undefined && r.range > MINIMUM_MELEE_RANGE && r.range <= MELEE_RANGE_MAX,
    );
    expect(ambiguous.map((r) => r.name)).toEqual([]);
  });

  it('deriveAttackType boundaries', () => {
    expect(deriveAttackType(UnitTypeId.Infantry, 0)).toBe(AttackType.Melee);
    expect(deriveAttackType(UnitTypeId.Infantry, MINIMUM_MELEE_RANGE)).toBe(AttackType.Melee);
    expect(deriveAttackType(UnitTypeId.Infantry, MELEE_RANGE_MAX)).toBe(AttackType.Melee);
    expect(deriveAttackType(UnitTypeId.Ranged, MELEE_RANGE_MAX + 0.01)).toBe(AttackType.Ranged);
    expect(deriveAttackType(UnitTypeId.Siege, 1.5)).toBe(AttackType.Siege);
    expect(deriveAttackType(UnitTypeId.Support, 1.5)).toBe(AttackType.Magic);
    expect(deriveAttackType(UnitTypeId.Special, 8)).toBe(AttackType.Magic);
    expect(deriveAttackType(null, 1.5)).toBe(AttackType.Melee);
    expect(deriveAttackType(null, 9)).toBe(AttackType.Ranged);
  });
});

// ---------------------------------------------------------------------------
// (a) Every archetype + hero via the real spawn functions
// ---------------------------------------------------------------------------

describe('AttackType per faction archetype (createFactionUnit)', () => {
  for (const f of FACTIONS) {
    for (const arch of FACTION_UNITS[f]) {
      const want = expectedAttackType(arch.attackType, arch.typeId, arch.range);
      it(`${FactionId[f]} ${arch.name} (range ${arch.range}) -> ${AttackType[want]}`, () => {
        const world = replaceWorld();
        const eid = createFactionUnit(world, f, arch.name, 0, 0);
        expect(Attack.attackType[eid]).toBe(want);
      });
    }
  }
});

describe('AttackType per legacy archetype (createUnit)', () => {
  for (const f of FACTIONS) {
    for (const arch of LEGACY[f]) {
      // createUnit resolves factionData first, legacy as fallback: the spawned
      // unit's source archetype is whatever resolves for (faction, typeId).
      const resolved = FACTION_UNITS[f].find((a) => a.typeId === arch.typeId) ?? arch;
      const want = expectedAttackType(resolved.attackType, resolved.typeId, resolved.range);
      it(`${FactionId[f]} ${UnitTypeId[arch.typeId]} -> ${AttackType[want]}`, () => {
        const world = replaceWorld();
        const eid = createUnit(world, arch.typeId, f, 0, 0);
        expect(Attack.attackType[eid]).toBe(want);
      });
    }
  }
});

describe('AttackType per hero (createHero)', () => {
  for (const hero of HERO_ARCHETYPES) {
    const want = expectedAttackType(hero.attackType, null, hero.range);
    it(`${hero.name} (range ${hero.range}) -> ${AttackType[want]}`, () => {
      const world = replaceWorld();
      const eid = createHero(world, hero.heroTypeId, hero.factionId, 0, 0, 0, 0);
      expect(Attack.attackType[eid]).toBe(want);
    });
  }
});

describe('regression: named contact-range units are Melee, archers stay Ranged', () => {
  const MELEE = [
    'Boer', 'Carnavalvierder', 'Muzikant', 'Tractorrijder',
    'Stagiair', 'Corporate Advocaat',
    'Mijnwerker', 'Schutterij', 'Mergelridder', 'Mijnrat',
    'Frietkraamhouder', 'Bierbouwer', 'Frituurridder', 'Dubbele Spion',
  ];
  const RANGED = ['Sluiper', 'Manager', 'Consultant', 'Hipster', 'Influencer', 'Vlaaienwerper', 'Heuvelwacht', 'Chocolatier'];

  const byName = (name: string) => {
    for (const f of FACTIONS) {
      const a = FACTION_UNITS[f].find((u) => u.name === name);
      if (a) return { f, a };
    }
    throw new Error(`unknown unit ${name}`);
  };

  it.each(MELEE)('%s spawns as Melee', (name) => {
    const { f } = byName(name);
    const eid = createFactionUnit(replaceWorld(), f, name, 0, 0);
    expect(Attack.attackType[eid]).toBe(AttackType.Melee);
  });

  it.each(RANGED)('%s spawns as Ranged', (name) => {
    const { f } = byName(name);
    const eid = createFactionUnit(replaceWorld(), f, name, 0, 0);
    expect(Attack.attackType[eid]).toBe(AttackType.Ranged);
  });

  it('melee heroes are Melee, caster/ranged heroes Ranged', () => {
    const melee = HERO_ARCHETYPES.filter((h) => h.range <= MINIMUM_MELEE_RANGE).map((h) => h.name);
    expect(melee.sort()).toEqual(
      ['Boer van Brabant', 'De CEO', 'De Frietkoning', 'De Mijnbaas', 'Prins van Brabant'].sort(),
    );
    for (const hero of HERO_ARCHETYPES) {
      resetHeroTracking();
      const eid = createHero(replaceWorld(), hero.heroTypeId, hero.factionId, 0, 0, 0, 0);
      expect(Attack.attackType[eid]).toBe(
        melee.includes(hero.name) ? AttackType.Melee : AttackType.Ranged,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// (b) Matrix multipliers with real spawned attackers
// Values from CombatSystem.ts DAMAGE_MODIFIERS:
//   Melee  -> Light 1.5, Medium 1.0, Building 1.0
//   Ranged -> Medium 1.5, Heavy 1.0
//   Siege  -> Building 2.0
// ---------------------------------------------------------------------------

const combat = createCombatSystem();

function spawnDummy(world: World, armorType: ArmorType, isBuilding = false): number {
  const eid = addEntity(world);
  for (const c of [Position, Faction, UnitAI, Attack, Armor, Health, Movement]) addComponent(world, eid, c);
  addComponent(world, eid, isBuilding ? IsBuilding : IsUnit);
  Position.x[eid] = 1.0;
  Position.z[eid] = 0;
  Faction.id[eid] = FactionId.Randstad;
  UnitAI.state[eid] = UnitAIState.Idle;
  UnitAI.targetEid[eid] = NO_ENTITY;
  Attack.timer[eid] = 999;
  Armor.value[eid] = 0;
  Armor.type[eid] = armorType;
  Health.current[eid] = 10000;
  Health.max[eid] = 10000;
  return eid;
}

function hit(name: string, faction: FactionId, armorType: ArmorType, isBuilding = false): { dealt: number; base: number } {
  const world = replaceWorld();
  const atk = createFactionUnit(world, faction, name, 0, 0);
  Faction.id[atk] = FactionId.Brabanders;
  const def = spawnDummy(world, armorType, isBuilding);
  UnitAI.state[atk] = UnitAIState.Attacking;
  UnitAI.targetEid[atk] = def;
  Attack.timer[atk] = 0;
  const start = Health.current[def];
  combat(world, 0.016);
  return { dealt: start - Health.current[def], base: Attack.damage[atk] * Attack.siegeBonus[atk] };
}

describe('matrix via real units', () => {
  it('melee (Tractorrijder) gets 1.5x vs Light', () => {
    const { dealt, base } = hit('Tractorrijder', FactionId.Brabanders, ArmorType.Light);
    expect(dealt).toBeCloseTo(base * 1.5, 3);
  });

  it('melee (Tractorrijder) gets no Ranged bonus vs Medium (1.0x)', () => {
    const { dealt, base } = hit('Tractorrijder', FactionId.Brabanders, ArmorType.Medium);
    expect(dealt).toBeCloseTo(base * 1.0, 3);
  });

  it('melee (Carnavalvierder) vs Building is 1.0x', () => {
    const { dealt, base } = hit('Carnavalvierder', FactionId.Brabanders, ArmorType.Building, true);
    expect(dealt).toBeCloseTo(base * 1.0, 3);
  });

  it('ranged (Sluiper) gets 1.5x vs Medium', () => {
    const { dealt, base } = hit('Sluiper', FactionId.Brabanders, ArmorType.Medium);
    expect(dealt).toBeCloseTo(base * 1.5, 3);
  });

  it('ranged (Sluiper) vs Heavy is 1.0x', () => {
    const { dealt, base } = hit('Sluiper', FactionId.Brabanders, ArmorType.Heavy);
    expect(dealt).toBeCloseTo(base * 1.0, 3);
  });

  it('siege (Praalwagen) vs Building is 2x on top of its siegeBonus', () => {
    const { dealt, base } = hit('Praalwagen', FactionId.Brabanders, ArmorType.Building, true);
    expect(dealt).toBeCloseTo(base * 2.0, 3);
  });
});
