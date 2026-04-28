/**
 * TechTreeSystem-research-lifecycle.test.ts -- Locks F5-stap 24:
 * Blacksmith upgrade-paneel + retroactieve toepassing op bestaande units.
 *
 * Audit-context: full-playthrough audit Fase 5 stap 24. Audit-04 §5 noemde
 * dat retroactieve upgrade-applicatie op bestaande units geen test had.
 * `TechTreeSystem.applyUpgradeToExistingUnits` bestaat (line 438-445) maar
 * was nooit gevalideerd.
 *
 * Contract:
 *  - 7 universele upgrade-definities aanwezig met juiste cost/duration/affects.
 *  - startResearch deducts gold, emits 'research-started', refuses if no gold,
 *    refuses if prerequisite missing, refuses if blacksmith already busy.
 *  - update() tikt elapsed; bij completion → 'research-completed' event +
 *    Set<UpgradeId>.completed bevat de upgrade.
 *  - **Retroactive**: upon completion, bestaande Faction-units krijgen direct
 *    Attack.damage/Armor.value/Movement.speed bonussen toegepast.
 *  - applyAllUpgradesToNewUnit injecteert de cumulatieve upgrade-stack in een
 *    nieuw entity dat na completion gespawned wordt.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import {
  Position, Faction, UnitType, Attack, Armor, Movement, Health, Building,
} from '../src/ecs/components';
import { IsUnit, IsBuilding } from '../src/ecs/tags';
import {
  techTreeSystem, UPGRADE_DEFINITIONS, getUpgradeDefinition,
} from '../src/systems/TechTreeSystem';
import { playerState } from '../src/core/PlayerState';
import { eventBus } from '../src/core/EventBus';
import {
  FactionId, UnitTypeId, BuildingTypeId, UpgradeId,
} from '../src/types/index';

type World = ReturnType<typeof replaceWorld>;

function spawnBlacksmith(world: World, faction = FactionId.Brabanders, complete = true): number {
  const eid = addEntity(world);
  [Position, Faction, Building, IsBuilding].forEach((c) => addComponent(world, eid, c));
  Faction.id[eid] = faction;
  Building.typeId[eid] = BuildingTypeId.Blacksmith;
  Building.complete[eid] = complete ? 1 : 0;
  return eid;
}

function spawnInfantry(world: World, faction = FactionId.Brabanders): number {
  const eid = addEntity(world);
  [Position, Faction, UnitType, Attack, Armor, Movement, Health, IsUnit].forEach((c) =>
    addComponent(world, eid, c),
  );
  Faction.id[eid] = faction;
  UnitType.id[eid] = UnitTypeId.Infantry;
  Attack.damage[eid] = 10;
  Armor.value[eid] = 2;
  Movement.speed[eid] = 4;
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  return eid;
}

function spawnRanged(world: World, faction = FactionId.Brabanders): number {
  const eid = spawnInfantry(world, faction);
  UnitType.id[eid] = UnitTypeId.Ranged;
  return eid;
}

beforeEach(() => {
  techTreeSystem.reset();
  playerState.reset();
  eventBus.clear();
});

// ---------------------------------------------------------------------------
// 7 upgrade definitions
// ---------------------------------------------------------------------------

describe('F5-stap 24 — UPGRADE_DEFINITIONS table', () => {
  it('has the 10 universal upgrades (7 combat/armor/speed + 3 LumberCamp wood)', () => {
    expect(UPGRADE_DEFINITIONS).toHaveLength(10);
  });

  it('Zwaardvechten II requires Zwaardvechten I (chain)', () => {
    const v2 = getUpgradeDefinition(UpgradeId.MeleeAttack2);
    expect(v2.prerequisite).toBe(UpgradeId.MeleeAttack1);
  });

  it('Boogschieten II requires Boogschieten I', () => {
    const r2 = getUpgradeDefinition(UpgradeId.RangedAttack2);
    expect(r2.prerequisite).toBe(UpgradeId.RangedAttack1);
  });

  it('Bepantsering II requires Bepantsering I', () => {
    const a2 = getUpgradeDefinition(UpgradeId.ArmorUpgrade2);
    expect(a2.prerequisite).toBe(UpgradeId.ArmorUpgrade1);
  });

  it('Tier 1 upgrades have no prerequisite', () => {
    expect(getUpgradeDefinition(UpgradeId.MeleeAttack1).prerequisite).toBeNull();
    expect(getUpgradeDefinition(UpgradeId.RangedAttack1).prerequisite).toBeNull();
    expect(getUpgradeDefinition(UpgradeId.ArmorUpgrade1).prerequisite).toBeNull();
    expect(getUpgradeDefinition(UpgradeId.MoveSpeed1).prerequisite).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// startResearch validation
// ---------------------------------------------------------------------------

describe('F5-stap 24 — startResearch validation', () => {
  it('deducts gold and emits research-started', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    const before = playerState.getGold(FactionId.Brabanders);
    playerState.addGold(FactionId.Brabanders, 500);

    const events: any[] = [];
    eventBus.on('research-started', (e: any) => { events.push(e); });

    const ok = techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);

    expect(ok).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0].upgradeId).toBe(UpgradeId.MeleeAttack1);
    expect(playerState.getGold(FactionId.Brabanders)).toBe(before + 500 - 150);
  });

  it('refuses if insufficient gold', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    // PlayerState.reset() gives 100 starting gold. Spend it down to 50 so we
    // are below the 150-cost MeleeAttack1.
    playerState.spend(FactionId.Brabanders, 50);
    const before = playerState.getGold(FactionId.Brabanders);
    expect(before).toBeLessThan(150);

    const ok = techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    expect(ok).toBe(false);
    expect(playerState.getGold(FactionId.Brabanders)).toBe(before); // not deducted
  });

  it('refuses if prerequisite not researched', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    playerState.addGold(FactionId.Brabanders, 1000);

    const ok = techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack2);
    expect(ok).toBe(false); // prerequisite (MeleeAttack1) not done
  });

  it('refuses if blacksmith already researching', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    playerState.addGold(FactionId.Brabanders, 1000);

    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    const second = techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.RangedAttack1);
    expect(second).toBe(false);
  });

  it('refuses if upgrade already researched', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    playerState.addGold(FactionId.Brabanders, 1000);

    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    techTreeSystem.update(world, 30); // complete (researchTime=30)

    const again = techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    expect(again).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Retroactive upgrade application (audit-04 §5 fix)
// ---------------------------------------------------------------------------

describe('F5-stap 24 — retroactive upgrade application on existing units', () => {
  it('completes MeleeAttack1 → existing Brabanders Infantry get +2 damage', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    const inf = spawnInfantry(world, FactionId.Brabanders);
    const baseDmg = Attack.damage[inf];
    playerState.addGold(FactionId.Brabanders, 500);

    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    techTreeSystem.update(world, 30); // crosses researchTime

    expect(Attack.damage[inf]).toBeCloseTo(baseDmg + 2, 4);
  });

  it('MeleeAttack1 does NOT affect Ranged units (affectsUnitTypes filter)', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    const ranged = spawnRanged(world, FactionId.Brabanders);
    const baseDmg = Attack.damage[ranged];
    playerState.addGold(FactionId.Brabanders, 500);

    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    techTreeSystem.update(world, 30);

    expect(Attack.damage[ranged]).toBe(baseDmg);
  });

  it('ArmorUpgrade1 affects ALL units (null affectsUnitTypes)', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    const inf = spawnInfantry(world);
    const ranged = spawnRanged(world);
    playerState.addGold(FactionId.Brabanders, 500);

    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.ArmorUpgrade1);
    techTreeSystem.update(world, 35);

    expect(Armor.value[inf]).toBeCloseTo(2 + 1, 4);
    expect(Armor.value[ranged]).toBeCloseTo(2 + 1, 4);
  });

  it('MoveSpeed1 multiplies Movement.speed by 1.10 (10% boost)', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    const inf = spawnInfantry(world);
    playerState.addGold(FactionId.Brabanders, 500);

    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MoveSpeed1);
    techTreeSystem.update(world, 40);

    expect(Movement.speed[inf]).toBeCloseTo(4 * 1.10, 4);
  });

  it('does NOT apply to other-faction units (faction filter)', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world, FactionId.Brabanders);
    const ownInf = spawnInfantry(world, FactionId.Brabanders);
    const enemyInf = spawnInfantry(world, FactionId.Randstad);
    playerState.addGold(FactionId.Brabanders, 500);

    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    techTreeSystem.update(world, 30);

    expect(Attack.damage[ownInf]).toBeCloseTo(12, 4);
    expect(Attack.damage[enemyInf]).toBe(10); // unchanged
  });
});

// ---------------------------------------------------------------------------
// applyAllUpgradesToNewUnit (newly-spawned entity gets cumulative stack)
// ---------------------------------------------------------------------------

describe('F5-stap 24 — applyAllUpgradesToNewUnit covers newly-trained units', () => {
  it('a unit spawned AFTER research completion still gets the bonus', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    playerState.addGold(FactionId.Brabanders, 500);
    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    techTreeSystem.update(world, 30);

    // Spawn a fresh infantry AFTER research. Game.ts calls
    // applyAllUpgradesToNewUnit when training completes.
    const newInf = spawnInfantry(world, FactionId.Brabanders);
    techTreeSystem.applyAllUpgradesToNewUnit(newInf, FactionId.Brabanders);

    expect(Attack.damage[newInf]).toBeCloseTo(12, 4);
  });

  it('cumulative MeleeAttack1+2 stacks +4 dmg on new units', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    playerState.addGold(FactionId.Brabanders, 1000);

    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    techTreeSystem.update(world, 30);
    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack2);
    techTreeSystem.update(world, 45);

    const newInf = spawnInfantry(world, FactionId.Brabanders);
    techTreeSystem.applyAllUpgradesToNewUnit(newInf, FactionId.Brabanders);

    expect(Attack.damage[newInf]).toBeCloseTo(14, 4); // 10 + 2 + 2
  });
});

// ---------------------------------------------------------------------------
// Cancellation if Blacksmith dies mid-research (gold lost is acceptable)
// ---------------------------------------------------------------------------

describe('F5-stap 24 — Blacksmith destroyed mid-research', () => {
  it('cancels research if Blacksmith no longer exists', () => {
    const world = replaceWorld();
    const bs = spawnBlacksmith(world);
    playerState.addGold(FactionId.Brabanders, 500);
    techTreeSystem.startResearch(FactionId.Brabanders, bs, UpgradeId.MeleeAttack1);
    expect(techTreeSystem.isResearching(bs, FactionId.Brabanders)).toBe(true);

    // Mark blacksmith incomplete (proxy for destroyed/under-construction)
    Building.complete[bs] = 0;
    techTreeSystem.update(world, 1);

    expect(techTreeSystem.isResearching(bs, FactionId.Brabanders)).toBe(false);
    expect(techTreeSystem.isResearched(FactionId.Brabanders, UpgradeId.MeleeAttack1)).toBe(false);
  });
});
