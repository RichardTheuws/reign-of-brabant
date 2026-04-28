/**
 * per-building-smoke.test.ts -- Bundle 4B end-to-end spawn validation.
 *
 * For ELKE (Faction × BuildingType) combinatie controleren we de drie
 * fundamentele eisen die nodig zijn om een gebouw te kunnen spawnen:
 *
 *   1. Display-name resolutie levert NOOIT 'Gebouw' op
 *      (factionData archetype OF FACTION_BUILDING_NAME_FALLBACKS).
 *   2. BUILDING_MODEL_PATHS heeft een GLB-pad voor `<typeKey>_<factionId>`.
 *   3. Het GLB-bestand bestaat fysiek op disk in `public/`.
 *
 * Daarnaast checken we per (factie × buildable type) dat het build-menu
 * (FACTION_WORKER_BUILDS) een entry heeft. TownHall is start-spawn en niet
 * buildable, dus daar slaan we de menu-test over.
 *
 * Resultaat: 4 facties × 11 types = 44 combinaties, elk met 3 individuele
 * tests + 40 build-menu entry tests = 132 + 40 = 172 tests totaal.
 *
 * Bridge (BuildingTypeId 11) wordt expliciet uitgesloten — dat is een
 * speciaal placement-type op rivier-tiles, geen normaal worker-build gebouw.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { BuildingTypeId, FactionId } from '../src/types/index';
import {
  getDisplayBuildingName,
  getFactionBuildingArchetype,
} from '../src/data/factionData';
import { BUILDING_MODEL_PATHS } from '../src/rendering/BuildingRenderer';
import { FACTION_WORKER_BUILDS } from '../src/ui/factionBuildMenus';
import type { Faction } from '../src/ui/HUD';

// ---------------------------------------------------------------------------
// Test matrix configuratie
// ---------------------------------------------------------------------------

interface FactionEntry {
  readonly id: FactionId;
  /** Slug zoals gebruikt in BUILDING_MODEL_PATHS (suffix `_${id}`). */
  readonly slug: string;
  /** Faction-key zoals gebruikt in FACTION_WORKER_BUILDS. */
  readonly menuKey: Faction;
}

const FACTIONS: readonly FactionEntry[] = [
  { id: FactionId.Brabanders, slug: 'brabanders', menuKey: 'brabant' },
  { id: FactionId.Randstad,   slug: 'randstad',   menuKey: 'randstad' },
  { id: FactionId.Limburgers, slug: 'limburgers', menuKey: 'limburg' },
  { id: FactionId.Belgen,     slug: 'belgen',     menuKey: 'belgen' },
] as const;

const TYPES: readonly BuildingTypeId[] = [
  BuildingTypeId.TownHall,
  BuildingTypeId.Barracks,
  BuildingTypeId.LumberCamp,
  BuildingTypeId.Blacksmith,
  BuildingTypeId.Housing,
  BuildingTypeId.DefenseTower,
  BuildingTypeId.TertiaryResourceBuilding,
  BuildingTypeId.UpgradeBuilding,
  BuildingTypeId.FactionSpecial1,
  BuildingTypeId.FactionSpecial2,
  BuildingTypeId.SiegeWorkshop,
] as const;

/**
 * Mapping van BuildingTypeId naar de string-key zoals gebruikt in
 * BUILDING_MODEL_PATHS (`<typeKey>_<factionId>`).
 *
 * VERIFIED tegen `Game.ts:getBuildingTypeIdForGhost` (Game.ts:1206-1221) en
 * tegen de feitelijke keys in `BuildingRenderer.ts:BUILDING_MODEL_PATHS`.
 *
 * Belangrijk: FactionSpecial2 mapt op de string `advanced` — niet `faction2`.
 * In Game.ts heet de ghost wel `faction2`, maar de GLB-key is `advanced`.
 */
const TYPE_KEY: Record<BuildingTypeId, string> = {
  [BuildingTypeId.TownHall]: 'townhall',
  [BuildingTypeId.Barracks]: 'barracks',
  [BuildingTypeId.LumberCamp]: 'lumbercamp',
  [BuildingTypeId.Blacksmith]: 'blacksmith',
  [BuildingTypeId.Housing]: 'housing',
  [BuildingTypeId.DefenseTower]: 'tower',
  [BuildingTypeId.TertiaryResourceBuilding]: 'tertiary',
  [BuildingTypeId.UpgradeBuilding]: 'upgrade',
  [BuildingTypeId.FactionSpecial1]: 'special1',
  [BuildingTypeId.FactionSpecial2]: 'advanced',
  [BuildingTypeId.SiegeWorkshop]: 'siege-workshop',
  // Bridge is een placement-special op rivier-tiles, niet meegenomen in deze suite.
  [BuildingTypeId.Bridge]: 'bridge',
};

/** TownHall is een start-spawn; geen build-menu entry verwacht. */
const NON_BUILDABLE: ReadonlySet<BuildingTypeId> = new Set([
  BuildingTypeId.TownHall,
]);

const projectRoot = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Per-building smoke (4 facties × 11 types = 44 combinaties)', () => {
  for (const f of FACTIONS) {
    describe(`${f.slug} (FactionId.${FactionId[f.id]})`, () => {
      for (const t of TYPES) {
        const typeName = BuildingTypeId[t];
        const typeKey = TYPE_KEY[t];

        // -------------------------------------------------------------------
        // 1. Display-name resolutie — NOOIT generic 'Gebouw' fallback.
        // -------------------------------------------------------------------
        it(`${typeName} heeft een factie-specifieke display-naam (geen 'Gebouw' fallback)`, () => {
          const name = getDisplayBuildingName(f.id, t);
          expect(name).toBeDefined();
          expect(typeof name).toBe('string');
          expect(name.length).toBeGreaterThan(0);
          // Cruciale invariant: de generic 'Gebouw' default mag NIET voorkomen.
          // Elk gebouw moet ofwel via FACTION_BUILDINGS archetype of via
          // FACTION_BUILDING_NAME_FALLBACKS een echte naam hebben.
          expect(name).not.toBe('Gebouw');
        });

        // -------------------------------------------------------------------
        // 2. BUILDING_MODEL_PATHS heeft een entry.
        // -------------------------------------------------------------------
        it(`${typeName} heeft een GLB-pad in BUILDING_MODEL_PATHS (key: ${typeKey}_${f.id})`, () => {
          const key = `${typeKey}_${f.id}`;
          const path = BUILDING_MODEL_PATHS[key];
          expect(path, `Missing BUILDING_MODEL_PATHS["${key}"]`).toBeDefined();
          expect(typeof path).toBe('string');
          expect(path).toMatch(/\.glb$/);
        });

        // -------------------------------------------------------------------
        // 3. GLB-bestand bestaat fysiek op disk.
        // -------------------------------------------------------------------
        // Note: Bundle 4A heeft Brabant TertiaryResource (Worstenbroodjeskraam)
        // toegevoegd als archetype + naam-fallback, maar de dedicated
        // `brabanders/tertiary.glb` mesh komt pas met de parallel-running
        // asset-generator agent. In de huidige BUILDING_MODEL_PATHS hergebruikt
        // `tertiary_0` nog `lumbercamp.glb` — dat bestand bestaat dus deze
        // test slaagt. Zodra de echte GLB komt, mag dit naar `tertiary.glb`
        // wijzen en blijft de existence-test werken.
        it(`${typeName} GLB-bestand bestaat op disk`, () => {
          const key = `${typeKey}_${f.id}`;
          const relPath = BUILDING_MODEL_PATHS[key];
          expect(relPath, `BUILDING_MODEL_PATHS["${key}"] ontbreekt`).toBeDefined();
          // Paden in BUILDING_MODEL_PATHS beginnen met `/assets/...` en zijn
          // relatief aan de Vite `public/` root.
          const absPath = resolve(projectRoot, 'public' + relPath);
          expect(
            existsSync(absPath),
            `GLB ontbreekt op disk: ${absPath}`,
          ).toBe(true);
        });

        // -------------------------------------------------------------------
        // 4. (Optioneel, alleen voor buildable types) build-menu entry.
        //     TownHall slaat over (= start-spawn, niet buildable).
        // -------------------------------------------------------------------
        if (!NON_BUILDABLE.has(t)) {
          it(`${typeName} heeft een build-menu entry in FACTION_WORKER_BUILDS[${f.menuKey}]`, () => {
            const menu = FACTION_WORKER_BUILDS[f.menuKey];
            expect(menu, `FACTION_WORKER_BUILDS[${f.menuKey}] ontbreekt`).toBeDefined();
            const entry = menu.find((cmd) => cmd.buildingTypeId === t);
            expect(
              entry,
              `Build-menu mist entry voor ${typeName} in factie ${f.menuKey}. ` +
                `Beschikbare types: ${menu.map((c) => c.buildingTypeId).join(', ')}`,
            ).toBeDefined();
            expect(entry!.label).toBeDefined();
            expect(entry!.label.length).toBeGreaterThan(0);
            expect(entry!.hotkey).toBeDefined();
          });
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // Sanity-check op de matrix zelf — vangt schrijffouten in de testopzet.
  // -------------------------------------------------------------------------
  describe('Test matrix sanity', () => {
    it('dekt alle 4 facties', () => {
      expect(FACTIONS).toHaveLength(4);
    });

    it('dekt alle 11 building-types (TownHall t/m SiegeWorkshop)', () => {
      expect(TYPES).toHaveLength(11);
    });

    it('FACTIONS slug + menuKey zijn uniek', () => {
      expect(new Set(FACTIONS.map((f) => f.slug)).size).toBe(FACTIONS.length);
      expect(new Set(FACTIONS.map((f) => f.menuKey)).size).toBe(FACTIONS.length);
    });

    it('TYPE_KEY bevat een entry voor elke BuildingTypeId in TYPES', () => {
      for (const t of TYPES) {
        expect(TYPE_KEY[t], `Missing TYPE_KEY[${BuildingTypeId[t]}]`).toBeDefined();
      }
    });

    it('archetype-helper werkt of throws op verwachte manier (cross-check display-name resolutie)', () => {
      // Voor combinaties zonder archetype gooit getFactionBuildingArchetype.
      // De display-name-test (hierboven) dekt fallback-pad af; deze test
      // documenteert het contract.
      let archetypeHits = 0;
      let fallbackHits = 0;
      for (const f of FACTIONS) {
        for (const t of TYPES) {
          try {
            getFactionBuildingArchetype(f.id, t);
            archetypeHits++;
          } catch {
            fallbackHits++;
          }
        }
      }
      // 44 combinaties totaal, samen moet dat kloppen.
      expect(archetypeHits + fallbackHits).toBe(44);
      // Tenminste de 4 TownHalls + 4 Barracks + 4 LumberCamps + 4 Blacksmiths
      // + 4 SiegeWorkshops + 4 FactionSpecial1 + 4 FactionSpecial2 hebben
      // een archetype (28 minimaal). Rest mag fallback zijn.
      expect(archetypeHits).toBeGreaterThanOrEqual(28);
    });
  });
});
