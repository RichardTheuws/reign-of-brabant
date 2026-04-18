/**
 * factionRemap.ts -- Pure helper that swaps the player's chosen faction
 * into spawn slot 0 of a generated map.
 *
 * MapGenerator always returns Brabanders at slot 0 (it is faction-agnostic
 * about the player's choice). When the player picks any other faction, this
 * helper swaps that faction into slot 0 and pushes Brabanders into whatever
 * slot the chosen faction originally occupied. All other slots are
 * untouched.
 *
 * The result is a fresh map object (no mutation) so callers can swap in
 * a single assignment.
 */
import type { GeneratedMap } from './MapGenerator';

export function remapMapPlayerFaction(
  map: GeneratedMap,
  newPlayerFaction: number,
): GeneratedMap {
  const oldPlayerFaction = map.spawns[0]?.factionId;
  if (oldPlayerFaction === undefined || oldPlayerFaction === newPlayerFaction) {
    return map;
  }

  const remap = (fid: number): number => {
    if (fid === oldPlayerFaction) return newPlayerFaction;
    if (fid === newPlayerFaction) return oldPlayerFaction;
    return fid;
  };

  return {
    ...map,
    spawns: map.spawns.map(s => ({ ...s, factionId: remap(s.factionId) })),
    buildings: map.buildings.map(b => ({ ...b, factionId: remap(b.factionId) })),
    units: map.units.map(u => ({ ...u, factionId: remap(u.factionId) })),
  };
}
