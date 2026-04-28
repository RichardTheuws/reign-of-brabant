/**
 * UpgradeBuildingPassivesSystem — passive auras voor de 4 UpgradeBuildings.
 *
 * Live-bug v0.37.40 (Richard 2026-04-28): UpgradeBuildings hadden alleen
 * "research panel + T3 gate" als functie. Per v1.0 perfectie regel
 * (`feedback_v1_perfection_multi_function`) elk specialty-gebouw 2-3 functies.
 * v0.40.0 voegt passieve aura per factie toe.
 *
 * Pre-tests bewijzen:
 *  - Brabant Wagenbouwerij — direct Gez flux per actieve Wagenbouwer.
 *  - Randstad Innovatie Boost — speed-mult per actief Lab, cap +20%.
 *  - Limburg Kolenrook — armor-bonus per Hoogoven binnen 10u, cap +3.
 *  - Belgen Geslepen Wapens — crit-chance per Diamantslijperij binnen 8u, cap +15%.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { replaceWorld } from '../src/ecs/world';
import { Position, Faction, Building } from '../src/ecs/components';
import { IsBuilding } from '../src/ecs/tags';
import { playerState } from '../src/core/PlayerState';
import { FactionId, BuildingTypeId } from '../src/types/index';
import {
  createUpgradeBuildingPassivesSystem,
  resetUpgradeBuildingPassives,
  getWagenbouwerCount,
  getInnovatieBoostSpeedMult,
  getKolenrookArmorAt,
  getGeslepenCritAt,
  WAGENBOUWERIJ_GEZ_PER_SEC,
  INNOVATIE_PER_LAB, INNOVATIE_CAP,
  KOLENROOK_RADIUS, KOLENROOK_ARMOR_PER, KOLENROOK_CAP,
  GESLEPEN_RADIUS, GESLEPEN_CRIT_PER, GESLEPEN_CAP,
} from '../src/systems/UpgradeBuildingPassivesSystem';

type World = ReturnType<typeof replaceWorld>;

const tickSystem = createUpgradeBuildingPassivesSystem();
function tick(world: World, dt: number) { tickSystem(world, dt); }

function spawnUpgradeBuilding(
  world: World, x: number, z: number, faction: number, complete = 1,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  addComponent(world, eid, Faction);
  addComponent(world, eid, Building);
  addComponent(world, eid, IsBuilding);
  Position.x[eid] = x; Position.y[eid] = 0; Position.z[eid] = z;
  Faction.id[eid] = faction;
  Building.typeId[eid] = BuildingTypeId.UpgradeBuilding;
  Building.complete[eid] = complete;
  return eid;
}

beforeEach(() => {
  playerState.reset();
  resetUpgradeBuildingPassives();
});

// ---------------------------------------------------------------------------
// Brabant Wagenbouwerij — direct Gez flux per Wagenbouwer
// ---------------------------------------------------------------------------
describe('UpgradeBuildingPassives — Brabant Wagenbouwerij', () => {
  it('initial cache is empty', () => {
    expect(getWagenbouwerCount()).toBe(0);
  });

  it('counts complete Brabant Wagenbouwers (caches after tick)', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Brabanders);
    spawnUpgradeBuilding(world, 10, 0, FactionId.Brabanders);
    tick(world, 1.0);
    expect(getWagenbouwerCount()).toBe(2);
  });

  it('skips incomplete Wagenbouwers', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Brabanders, /*complete*/ 0);
    tick(world, 1.0);
    expect(getWagenbouwerCount()).toBe(0);
  });

  it('skips non-Brabant UpgradeBuildings', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(getWagenbouwerCount()).toBe(0);
  });

  it('adds +0.3 Gezelligheid/sec per Wagenbouwer (linear scaling)', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Brabanders);
    spawnUpgradeBuilding(world, 10, 0, FactionId.Brabanders);
    spawnUpgradeBuilding(world, 20, 0, FactionId.Brabanders);
    tick(world, 1.0);
    expect(playerState.getGezelligheid(FactionId.Brabanders))
      .toBeCloseTo(3 * WAGENBOUWERIJ_GEZ_PER_SEC, 5);
  });
});

// ---------------------------------------------------------------------------
// Randstad Innovatie Boost — speed mult per Lab
// ---------------------------------------------------------------------------
describe('UpgradeBuildingPassives — Randstad Innovatie Boost', () => {
  it('1.0 mult zonder labs', () => {
    expect(getInnovatieBoostSpeedMult(FactionId.Randstad)).toBe(1.0);
  });

  it('+5% per actief Lab (linear tot cap)', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Randstad);
    spawnUpgradeBuilding(world, 10, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(getInnovatieBoostSpeedMult(FactionId.Randstad))
      .toBeCloseTo(1 + 2 * INNOVATIE_PER_LAB, 5);
  });

  it('caps op INNOVATIE_CAP (+20%) bij 5+ labs', () => {
    const world = replaceWorld();
    for (let i = 0; i < 6; i++) spawnUpgradeBuilding(world, i * 10, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(getInnovatieBoostSpeedMult(FactionId.Randstad))
      .toBeCloseTo(1 + INNOVATIE_CAP, 5);
  });

  it('1.0 voor non-Randstad facties zelfs als labs bestaan', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(getInnovatieBoostSpeedMult(FactionId.Brabanders)).toBe(1.0);
    expect(getInnovatieBoostSpeedMult(FactionId.Limburgers)).toBe(1.0);
    expect(getInnovatieBoostSpeedMult(FactionId.Belgen)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Limburg Kolenrook — proximity armor bonus
// ---------------------------------------------------------------------------
describe('UpgradeBuildingPassives — Limburg Kolenrook', () => {
  it('0 armor zonder Hoogoven', () => {
    expect(getKolenrookArmorAt(FactionId.Limburgers, 0, 0)).toBe(0);
  });

  it('+1 armor binnen 10u radius van 1 Hoogoven', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Limburgers);
    tick(world, 1.0);
    expect(getKolenrookArmorAt(FactionId.Limburgers, 5, 0)).toBe(KOLENROOK_ARMOR_PER);
  });

  it('+0 armor buiten 10u radius', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Limburgers);
    tick(world, 1.0);
    expect(getKolenrookArmorAt(FactionId.Limburgers, 11, 0)).toBe(0);
  });

  it('stacks per Hoogoven binnen radius (cap +3)', () => {
    const world = replaceWorld();
    // 4 Hoogovens binnen 10u van (0,0)
    spawnUpgradeBuilding(world, 0, 0, FactionId.Limburgers);
    spawnUpgradeBuilding(world, 5, 0, FactionId.Limburgers);
    spawnUpgradeBuilding(world, 0, 5, FactionId.Limburgers);
    spawnUpgradeBuilding(world, 5, 5, FactionId.Limburgers);
    tick(world, 1.0);
    expect(getKolenrookArmorAt(FactionId.Limburgers, 0, 0)).toBe(KOLENROOK_CAP);
  });

  it('returns 0 voor non-Limburg facties', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Limburgers);
    tick(world, 1.0);
    expect(getKolenrookArmorAt(FactionId.Brabanders, 0, 0)).toBe(0);
    expect(getKolenrookArmorAt(FactionId.Randstad, 0, 0)).toBe(0);
    expect(getKolenrookArmorAt(FactionId.Belgen, 0, 0)).toBe(0);
  });

  it('radius is exactly KOLENROOK_RADIUS (10u)', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Limburgers);
    tick(world, 1.0);
    // Exactly on the edge — sq dist = 100, RADIUS_SQ = 100 → inside
    expect(getKolenrookArmorAt(FactionId.Limburgers, KOLENROOK_RADIUS, 0)).toBe(KOLENROOK_ARMOR_PER);
    // Just outside
    expect(getKolenrookArmorAt(FactionId.Limburgers, KOLENROOK_RADIUS + 0.01, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Belgen Geslepen Wapens — proximity crit-chance bonus
// ---------------------------------------------------------------------------
describe('UpgradeBuildingPassives — Belgen Geslepen Wapens', () => {
  it('0 crit zonder Diamantslijperij', () => {
    expect(getGeslepenCritAt(FactionId.Belgen, 0, 0)).toBe(0);
  });

  it('+5% crit binnen 8u radius van 1 Diamantslijperij', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Belgen);
    tick(world, 1.0);
    expect(getGeslepenCritAt(FactionId.Belgen, 4, 0)).toBeCloseTo(GESLEPEN_CRIT_PER, 5);
  });

  it('stacks per Slijperij (cap +15%)', () => {
    const world = replaceWorld();
    // 5 Slijperijen binnen 8u — zou +25% geven, maar caps op +15%
    spawnUpgradeBuilding(world, 0, 0, FactionId.Belgen);
    spawnUpgradeBuilding(world, 1, 0, FactionId.Belgen);
    spawnUpgradeBuilding(world, 0, 1, FactionId.Belgen);
    spawnUpgradeBuilding(world, 2, 0, FactionId.Belgen);
    spawnUpgradeBuilding(world, 0, 2, FactionId.Belgen);
    tick(world, 1.0);
    expect(getGeslepenCritAt(FactionId.Belgen, 0, 0)).toBeCloseTo(GESLEPEN_CAP, 5);
  });

  it('returns 0 voor non-Belgen facties', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Belgen);
    tick(world, 1.0);
    expect(getGeslepenCritAt(FactionId.Randstad, 0, 0)).toBe(0);
  });

  it('radius is exactly GESLEPEN_RADIUS (8u)', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Belgen);
    tick(world, 1.0);
    expect(getGeslepenCritAt(FactionId.Belgen, GESLEPEN_RADIUS, 0)).toBeCloseTo(GESLEPEN_CRIT_PER, 5);
    expect(getGeslepenCritAt(FactionId.Belgen, GESLEPEN_RADIUS + 0.01, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Throttle + reset
// ---------------------------------------------------------------------------
describe('UpgradeBuildingPassives — meta', () => {
  it('throttles via 1.0s update interval', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Brabanders);
    tick(world, 0.4);
    tick(world, 0.4);
    expect(getWagenbouwerCount()).toBe(0); // not yet ticked
    tick(world, 0.3); // now > 1.0 total
    expect(getWagenbouwerCount()).toBe(1);
  });

  it('resetUpgradeBuildingPassives clears all caches', () => {
    const world = replaceWorld();
    spawnUpgradeBuilding(world, 0, 0, FactionId.Brabanders);
    spawnUpgradeBuilding(world, 0, 0, FactionId.Limburgers);
    spawnUpgradeBuilding(world, 0, 0, FactionId.Belgen);
    spawnUpgradeBuilding(world, 0, 0, FactionId.Randstad);
    tick(world, 1.0);
    expect(getWagenbouwerCount()).toBe(1);
    expect(getInnovatieBoostSpeedMult(FactionId.Randstad)).toBeGreaterThan(1.0);
    expect(getKolenrookArmorAt(FactionId.Limburgers, 0, 0)).toBeGreaterThan(0);
    expect(getGeslepenCritAt(FactionId.Belgen, 0, 0)).toBeGreaterThan(0);

    resetUpgradeBuildingPassives();

    expect(getWagenbouwerCount()).toBe(0);
    expect(getInnovatieBoostSpeedMult(FactionId.Randstad)).toBe(1.0);
    expect(getKolenrookArmorAt(FactionId.Limburgers, 0, 0)).toBe(0);
    expect(getGeslepenCritAt(FactionId.Belgen, 0, 0)).toBe(0);
  });
});
