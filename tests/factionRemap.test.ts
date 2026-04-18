/**
 * factionRemap.test.ts -- Locks in the spawn-slot-0 contract.
 *
 * MapGenerator always returns Brabanders at slot 0. When the player picks
 * any other faction, remapMapPlayerFaction must swap that faction into
 * slot 0 and demote Brabanders to whatever slot the chosen faction
 * originally occupied. All other slots are untouched, and every reference
 * (spawns, buildings, units) is updated consistently.
 *
 * Audit context: full-playthrough audit Fase 2 stap 8 — "player-factie op
 * slot 0, AI-facties op andere slots."
 */
import { describe, it, expect } from 'vitest';
import { generateMap } from '../src/world/MapGenerator';
import { remapMapPlayerFaction } from '../src/world/factionRemap';
import { FactionId } from '../src/types/index';

describe('remapMapPlayerFaction', () => {
  it('returns the same map when player picks Brabanders (no-op for slot 0)', () => {
    const map = generateMap(42, () => 0, 4);
    const remapped = remapMapPlayerFaction(map, FactionId.Brabanders);
    expect(remapped).toBe(map);
  });

  it('puts Belgen in slot 0 when player picks Belgen, Brabanders into Belgen-slot', () => {
    const original = generateMap(42, () => 0, 4);
    const belgenSlot = original.spawns.findIndex(s => s.factionId === FactionId.Belgen);
    expect(belgenSlot).toBeGreaterThan(0);

    const remapped = remapMapPlayerFaction(original, FactionId.Belgen);

    expect(remapped.spawns[0].factionId).toBe(FactionId.Belgen);
    expect(remapped.spawns[belgenSlot].factionId).toBe(FactionId.Brabanders);
  });

  it('preserves the (x, z) coordinates of every slot — only factionId moves', () => {
    const original = generateMap(42, () => 0, 4);
    const remapped = remapMapPlayerFaction(original, FactionId.Limburgers);

    for (let i = 0; i < original.spawns.length; i++) {
      expect(remapped.spawns[i].x).toBe(original.spawns[i].x);
      expect(remapped.spawns[i].z).toBe(original.spawns[i].z);
    }
  });

  it('remaps building factionIds in lockstep with spawns', () => {
    const original = generateMap(42, () => 0, 4);
    const remapped = remapMapPlayerFaction(original, FactionId.Randstad);

    // Each spawn's faction must match the building at that position
    for (const sp of remapped.spawns) {
      const matching = remapped.buildings.find(b =>
        Math.abs(b.x - sp.x) < 0.001 && Math.abs(b.z - sp.z) < 0.001,
      );
      expect(matching).toBeDefined();
      expect(matching!.factionId).toBe(sp.factionId);
    }
  });

  it('remaps unit factionIds in lockstep with spawns', () => {
    const original = generateMap(42, () => 0, 4);
    const remapped = remapMapPlayerFaction(original, FactionId.Limburgers);

    // Total units per faction is preserved (3 workers per spawn)
    const countByFaction = new Map<number, number>();
    for (const u of remapped.units) {
      countByFaction.set(u.factionId, (countByFaction.get(u.factionId) ?? 0) + 1);
    }
    for (const sp of remapped.spawns) {
      expect(countByFaction.get(sp.factionId)).toBe(3);
    }
  });

  it('does not mutate the input map (returns a fresh object)', () => {
    const original = generateMap(42, () => 0, 4);
    const originalSpawn0Faction = original.spawns[0].factionId;
    remapMapPlayerFaction(original, FactionId.Belgen);
    expect(original.spawns[0].factionId).toBe(originalSpawn0Faction);
  });

  it('preserves the faction set — no faction is lost or duplicated by the swap', () => {
    const original = generateMap(42, () => 0, 4);
    const originalFactions = new Set(original.spawns.map(s => s.factionId));

    const remapped = remapMapPlayerFaction(original, FactionId.Limburgers);
    const newFactions = new Set(remapped.spawns.map(s => s.factionId));

    expect(newFactions).toEqual(originalFactions);
  });

  it('handles 2-player maps where the chosen faction may not be on the map (no-op)', () => {
    // Default 2-player map has Brabanders + Randstad. Picking Belgen has
    // no Belgen-slot to swap into, so the function must remain consistent.
    const original = generateMap(42, () => 0, 2);
    const remapped = remapMapPlayerFaction(original, FactionId.Belgen);

    // Slot 0 still belongs to whatever was there if Belgen is not present.
    // The swap function should still produce a valid map (same length).
    expect(remapped.spawns).toHaveLength(2);
    expect(remapped.buildings).toHaveLength(2);
    expect(remapped.units).toHaveLength(6);
  });

  it('works for every (template × playerFaction) combination', () => {
    const templates = ['classic', 'crossroads', 'islands', 'arena', 'fortress', 'river-valley', 'canyon', 'archipelago'] as const;
    const factions = [FactionId.Brabanders, FactionId.Randstad, FactionId.Limburgers, FactionId.Belgen];

    for (const template of templates) {
      for (const playerFaction of factions) {
        const map = generateMap(42, () => 0, 4, template);
        const remapped = remapMapPlayerFaction(map, playerFaction);

        // Slot 0 must be the chosen faction
        expect(remapped.spawns[0].factionId).toBe(playerFaction);

        // All 4 factions still present
        const factionSet = new Set(remapped.spawns.map(s => s.factionId));
        expect(factionSet.size).toBe(4);
      }
    }
  });
});
