/**
 * MissionDefinitions.ts -- Data definitions for all campaign missions.
 *
 * Each mission defines:
 * - Map setup (size, spawns, gold mines, starting units/buildings/resources)
 * - Objectives (primary + bonus)
 * - Triggers (time-based, event-based, condition-based)
 * - Briefing text (Dutch)
 * - Victory/defeat conditions
 * - Star rating thresholds
 */

import { FactionId, UnitTypeId, BuildingTypeId } from '../types/index';
import type { GoldMineSpawn, TreeResourceSpawn } from '../types/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MissionUnitSpawn {
  readonly factionId: FactionId;
  readonly unitType: UnitTypeId;
  readonly x: number;
  readonly z: number;
}

export interface MissionBuildingSpawn {
  readonly factionId: FactionId;
  readonly buildingType: BuildingTypeId;
  readonly x: number;
  readonly z: number;
  readonly complete: boolean;
}

export type ObjectiveType = 'gather-gold' | 'destroy-building' | 'survive-waves' | 'train-units' | 'train-workers' | 'build-building' | 'no-worker-loss' | 'no-townhall-loss' | 'have-units-at-end';

export interface MissionObjective {
  readonly id: string;
  readonly type: ObjectiveType;
  readonly description: string;
  readonly targetValue: number;
  readonly isBonus: boolean;
  /** For 'build-building' objectives: which building type to check. Defaults to Barracks if omitted. */
  readonly targetBuildingType?: BuildingTypeId;
  /** For 'build-building' objectives: how many of this building the player needs. Defaults to 1. */
  readonly targetBuildingCount?: number;
  /** For 'destroy-building' objectives: filter by faction (disambiguate multi-faction destroy). */
  readonly targetFactionId?: FactionId;
  /** For 'train-units' objectives: '<' means below target is success, '>=' means at-or-above (default). */
  readonly comparator?: '<' | '>=';
}

export type TriggerCondition =
  | { type: 'time'; seconds: number }
  | { type: 'gold-reached'; amount: number }
  | { type: 'building-built'; buildingType: BuildingTypeId }
  | { type: 'building-count'; buildingType: BuildingTypeId; count: number }
  | { type: 'army-count'; count: number }
  | { type: 'building-destroyed'; factionId: FactionId; buildingType: BuildingTypeId }
  | { type: 'wave-defeated'; waveIndex: number }
  | { type: 'all-waves-defeated' };

export type TriggerAction =
  | { type: 'message'; text: string }
  | { type: 'spawn-units'; units: MissionUnitSpawn[] }
  | { type: 'victory' }
  | { type: 'spawn-wave'; waveIndex: number };

export interface MissionTrigger {
  readonly id: string;
  readonly condition: TriggerCondition;
  readonly actions: readonly TriggerAction[];
  readonly once: boolean;
}

export interface WaveDefinition {
  readonly index: number;
  readonly spawnTime: number; // seconds from start
  readonly units: MissionUnitSpawn[];
  readonly message?: string;
}

export interface MissionDefinition {
  readonly id: string;
  readonly campaignId: string;
  readonly missionIndex: number;
  readonly title: string;
  readonly briefingTitle: string;
  readonly briefingText: string;
  readonly mapSize: number;
  readonly startingGold: number;
  readonly startingGoldAI: number;
  /** The faction the player controls in this mission. */
  readonly playerFactionId: FactionId;
  /**
   * The faction(s) controlled by the AI in this mission.
   * Supports multiple AI factions for multi-front battles (e.g. Boardroom Beslissing).
   * The first entry is the "primary" AI faction used for AI production when hasAIProduction is true.
   */
  readonly aiFactionIds: readonly FactionId[];
  readonly buildings: readonly MissionBuildingSpawn[];
  readonly units: readonly MissionUnitSpawn[];
  readonly goldMines: readonly GoldMineSpawn[];
  readonly treeResources?: readonly TreeResourceSpawn[];
  readonly objectives: readonly MissionObjective[];
  readonly triggers: readonly MissionTrigger[];
  readonly waves: readonly WaveDefinition[];
  readonly hasAIProduction: boolean;
  readonly starThresholds: {
    /** Seconds under which you get 3 stars */
    readonly threeStarTime: number;
    /** Seconds under which you get 2 stars */
    readonly twoStarTime: number;
    /** All bonuses completed also grants 3 stars regardless of time */
    readonly allBonusesGrants3Stars: boolean;
  };
  /** If true, mission has no player TownHall (commando missions). Skips TownHall defeat check. */
  readonly noPlayerTownHall?: boolean;
}

// ---------------------------------------------------------------------------
// Missie 1: "De Eerste Oogst" (Tutorial — 12 stappen)
// ---------------------------------------------------------------------------

const MISSION_1_DE_OOGST: MissionDefinition = {
  id: 'brabant-1-de-oogst',
  campaignId: 'brabanders',
  missionIndex: 0,
  title: 'De Eerste Oogst',
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Tutorial: De Eerste Oogst',
  briefingText:
    'Welkom in Reusel, het hart van Brabant. Het is een rustige ochtend — de vogels zingen, ' +
    'de koeien loeien, en de geur van versgebakken worstenbroodjes hangt in de lucht.\n\n' +
    'Jij bent de nieuwe opzichter van de boerderij. Stap voor stap leer je alles wat je ' +
    'moet weten: camera besturen, grondstoffen verzamelen, gebouwen neerzetten, eenheden ' +
    'trainen en je eerste gevecht winnen.\n\n' +
    'Neem de tijd — er is geen haast. Niets kan deze dag verpesten... toch?',

  mapSize: 64,
  startingGold: 0,
  startingGoldAI: 0,

  buildings: [
    // Player: TownHall centraal
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -20, z: -20, complete: true },
  ],

  units: [
    // Player: 5 workers
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -17, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -15, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -13, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -17, z: -16 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -15, z: -16 },
    // NO enemy units at start — they are spawned by tutorial steps 10 and 11
  ],

  goldMines: [
    // Closer gold mine for easy gathering
    { x: -10, z: -20, amount: 1500 },
    { x: -20, z: -10, amount: 1500 },
  ],

  // Tutorial step 8 forces training of a Carnavalvierder (Infantry, 25 wood),
  // so the player needs reachable trees from the start. Cluster around the
  // TownHall (-20,-20) on the side opposite the gold mines.
  treeResources: [
    { x: -28, z: -22, amount: 200 },
    { x: -26, z: -25, amount: 200 },
    { x: -24, z: -28, amount: 200 },
    { x: -22, z: -30, amount: 200 },
    { x: -30, z: -18, amount: 200 },
  ],

  objectives: [
    // Primary: gather 500 gold — gives room to build barracks (200g), train units, fight, then finish
    { id: 'gather-500', type: 'gather-gold', description: 'Verzamel 500 goud', targetValue: 500, isBonus: false },
    // Bonus: don't lose any workers
    { id: 'no-worker-loss', type: 'no-worker-loss', description: 'Verlies geen boeren', targetValue: 0, isBonus: true },
    // Bonus: build a barracks
    { id: 'build-barracks', type: 'build-building', description: 'Bouw een Cafe (Kazerne)', targetValue: 1, isBonus: true },
  ],

  triggers: [
    // NO time-based wolf spawn (was at 120s — removed!)
    // Enemy spawns are handled by the tutorial system at steps 10 and 11

    // Victory when 500 gold reached — enough room to build barracks (200g), train, fight, then finish
    {
      id: 'victory-gold',
      condition: { type: 'gold-reached', amount: 500 },
      actions: [
        { type: 'message', text: 'Uitstekend! Je hebt de eerste oogst binnengehaald. Brabant is trots op je!' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 600,   // 10 min (generous for tutorial)
    twoStarTime: 900,     // 15 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 2: "De Eerste Schermutsel"
// ---------------------------------------------------------------------------

const MISSION_2_EERSTE_SCHERMUTSEL: MissionDefinition = {
  id: 'brabant-2-eerste-schermutsel',
  campaignId: 'brabanders',
  missionIndex: 1,
  title: 'De Eerste Schermutsel',
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 2: De Eerste Schermutsel',
  briefingText:
    'Onbekende indringers zijn gesignaleerd aan de rand van het dorp. Ze dragen pakken en ' +
    'praten over "synergien" en "kwartaalcijfers". Dit zijn geen gewone reizigers.\n\n' +
    'Bouw een Cafe (de Brabantse Kazerne) en train soldaten om het dorp te verdedigen. De vijand heeft een ' +
    'klein kamp opgeslagen in het noordoosten — vernietig hun Hoofdkantoor!\n\n' +
    'Brabant rekent op je.',

  mapSize: 96,
  startingGold: 200,
  startingGoldAI: 0,

  buildings: [
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -35, z: -35, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 35, z: 35, complete: true },
  ],

  units: [
    // Player: 3 workers
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -32, z: -33 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -30, z: -33 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -28, z: -33 },
    // Enemy: 3 infantry (static defenders, no AI production)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 33, z: 33 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 35, z: 37 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 37, z: 35 },
  ],

  goldMines: [
    { x: -25, z: -35, amount: 2000 },
    { x: -35, z: -25, amount: 2000 },
    { x: 0, z: 0, amount: 2500 },
  ],

  objectives: [
    { id: 'destroy-enemy-th', type: 'destroy-building', description: 'Vernietig het vijandelijke Hoofdkantoor', targetValue: 1, isBonus: false },
    { id: 'train-5-units', type: 'train-units', description: 'Train minstens 5 militaire eenheden', targetValue: 5, isBonus: true },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Boerderij niet', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'tip-start',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'Bouw een Cafe (Brabantse Kazerne) om soldaten te trainen. Selecteer een Boer → klik op het hamer-icoon → klik op een open plek.' }],
      once: true,
    },
    {
      id: 'barracks-built',
      condition: { type: 'building-built', buildingType: BuildingTypeId.Barracks },
      actions: [{ type: 'message', text: 'Goed bezig! Klik nu op het Cafe en train Carnavalvierders (W) of Sluipers (E). Je hebt minstens 3 soldaten nodig om aan te vallen!' }],
      once: true,
    },
    {
      id: 'army-3',
      condition: { type: 'army-count', count: 3 },
      actions: [{ type: 'message', text: 'Je leger groeit! Selecteer je soldaten (klik of sleep een kader) en klik met rechts op het vijandelijke gebouw in het noordoosten om aan te vallen!' }],
      once: true,
    },
    {
      id: 'victory-destroy',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Het vijandelijke Hoofdkantoor is vernietigd! De indringers vluchten!' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 360,  // 6 min
    twoStarTime: 600,    // 10 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 3: "De Verdediging"
// ---------------------------------------------------------------------------

function createWaveUnits(count: number, type: UnitTypeId, baseX: number, baseZ: number, spread: number, faction: FactionId = FactionId.Randstad): MissionUnitSpawn[] {
  const units: MissionUnitSpawn[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    units.push({
      factionId: faction,
      unitType: type,
      x: baseX + Math.cos(angle) * spread,
      z: baseZ + Math.sin(angle) * spread,
    });
  }
  return units;
}

const WAVE_SPAWN_X = 40;
const WAVE_SPAWN_Z = 40;

const MISSION_3_VERDEDIGING: MissionDefinition = {
  id: 'brabant-3-de-verdediging',
  campaignId: 'brabanders',
  missionIndex: 2,
  title: 'De Verdediging',
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 3: De Verdediging',
  briefingText:
    'De Randstad heeft ons gevonden. Verkenners melden dat er meerdere golven aanvallers ' +
    'op weg zijn naar ons dorp. Ze komen van het noordoosten.\n\n' +
    'Bouw je verdediging op, train een leger, en bereid je voor op het ergste. ' +
    'Je moet 5 aanvalsgolven overleven om het dorp te redden.\n\n' +
    'Dit wordt de zwaarste dag die Brabant ooit heeft meegemaakt. Maar samen staan we sterk.',

  mapSize: 96,
  startingGold: 400,
  startingGoldAI: 0,

  buildings: [
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -30, z: -30, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -22, z: -30, complete: true },
  ],

  units: [
    // 5 Workers
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -27, z: -28 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -25, z: -28 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -23, z: -28 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -27, z: -26 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -25, z: -26 },
    // 3 Infantry
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -20, z: -28 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -18, z: -28 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -19, z: -26 },
  ],

  goldMines: [
    { x: -20, z: -30, amount: 2000 },
    { x: -30, z: -20, amount: 2000 },
    { x: -10, z: -25, amount: 2000 },
    { x: -25, z: -10, amount: 2000 },
  ],

  objectives: [
    { id: 'survive-waves', type: 'survive-waves', description: 'Overleef 5 aanvalsgolven', targetValue: 5, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Boerderij niet', targetValue: 0, isBonus: true },
    { id: 'have-20-units', type: 'have-units-at-end', description: 'Heb 20+ eenheden aan het einde', targetValue: 20, isBonus: true },
  ],

  triggers: [
    {
      id: 'tip-start',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De vijand komt eraan! Bouw extra Cafes en train zo snel mogelijk eenheden.' }],
      once: true,
    },
    {
      id: 'wave-1-warning',
      condition: { type: 'time', seconds: 45 },
      actions: [{ type: 'message', text: 'Verkenners melden: eerste golf nadert! Bereid je voor!' }],
      once: true,
    },
    {
      id: 'wave-1-spawn',
      condition: { type: 'time', seconds: 60 },
      actions: [
        { type: 'message', text: 'GOLF 1! Drie vijandelijke soldaten naderen!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'wave-2-warning',
      condition: { type: 'time', seconds: 165 },
      actions: [{ type: 'message', text: 'Meer vijanden in aantocht... dit wordt groter.' }],
      once: true,
    },
    {
      id: 'wave-2-spawn',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'GOLF 2! Vijf soldaten! Houd stand!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'wave-3-warning',
      condition: { type: 'time', seconds: 285 },
      actions: [{ type: 'message', text: 'Ze sturen nu ook boogschutters... wees voorzichtig!' }],
      once: true,
    },
    {
      id: 'wave-3-spawn',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'GOLF 3! Gemengde eenheden — infanterie en ranged!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'wave-4-warning',
      condition: { type: 'time', seconds: 405 },
      actions: [{ type: 'message', text: 'De grootste golf tot nu toe nadert...' }],
      once: true,
    },
    {
      id: 'wave-4-spawn',
      condition: { type: 'time', seconds: 420 },
      actions: [
        { type: 'message', text: 'GOLF 4! Ze geven niet op! Verdedig de Boerderij!' },
        { type: 'spawn-wave', waveIndex: 3 },
      ],
      once: true,
    },
    {
      id: 'wave-5-warning',
      condition: { type: 'time', seconds: 525 },
      actions: [{ type: 'message', text: 'LAATSTE GOLF nadert! Alles of niets!' }],
      once: true,
    },
    {
      id: 'wave-5-spawn',
      condition: { type: 'time', seconds: 540 },
      actions: [
        { type: 'message', text: 'LAATSTE GOLF! Dit is het! HOUD STAND VOOR BRABANT!' },
        { type: 'spawn-wave', waveIndex: 4 },
      ],
      once: true,
    },
    {
      id: 'all-waves-victory',
      condition: { type: 'all-waves-defeated' },
      actions: [
        { type: 'message', text: 'Brabant houdt stand! Alle golven verslagen! De vijand trekt zich terug!' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=60s): 3 Infantry
    {
      index: 0,
      spawnTime: 60,
      units: createWaveUnits(3, UnitTypeId.Infantry, WAVE_SPAWN_X, WAVE_SPAWN_Z, 3),
      message: 'Golf 1 van 5',
    },
    // Wave 2 (T=180s): 5 Infantry
    {
      index: 1,
      spawnTime: 180,
      units: createWaveUnits(5, UnitTypeId.Infantry, WAVE_SPAWN_X, WAVE_SPAWN_Z, 4),
      message: 'Golf 2 van 5',
    },
    // Wave 3 (T=300s): 4 Infantry + 2 Ranged
    {
      index: 2,
      spawnTime: 300,
      units: [
        ...createWaveUnits(4, UnitTypeId.Infantry, WAVE_SPAWN_X, WAVE_SPAWN_Z, 3),
        ...createWaveUnits(2, UnitTypeId.Ranged, WAVE_SPAWN_X + 4, WAVE_SPAWN_Z + 4, 2),
      ],
      message: 'Golf 3 van 5',
    },
    // Wave 4 (T=420s): 6 Infantry + 3 Ranged
    {
      index: 3,
      spawnTime: 420,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, WAVE_SPAWN_X, WAVE_SPAWN_Z, 4),
        ...createWaveUnits(3, UnitTypeId.Ranged, WAVE_SPAWN_X + 5, WAVE_SPAWN_Z + 5, 3),
      ],
      message: 'Golf 4 van 5',
    },
    // Wave 5 (T=540s): 8 Infantry + 4 Ranged
    {
      index: 4,
      spawnTime: 540,
      units: [
        ...createWaveUnits(8, UnitTypeId.Infantry, WAVE_SPAWN_X, WAVE_SPAWN_Z, 5),
        ...createWaveUnits(4, UnitTypeId.Ranged, WAVE_SPAWN_X + 6, WAVE_SPAWN_Z + 6, 3),
      ],
      message: 'LAATSTE GOLF!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 660,  // 11 min
    twoStarTime: 900,    // 15 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 4: "De Binnendieze" (Stealth commando — no base building)
// ---------------------------------------------------------------------------

const MISSION_4_BINNENDIEZE: MissionDefinition = {
  id: 'brabant-4-de-binnendieze',
  campaignId: 'brabanders',
  missionIndex: 3,
  title: 'De Binnendieze',
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 4: De Binnendieze',
  briefingText:
    'Den Bosch. Het hart van Brabant. Volgens onze Belgische vrienden ligt hier ergens ' +
    'een geheim Randstad-archief met de blauwdruk van "Project Gentrificatie".\n\n' +
    'De stad is zwaar bewaakt, maar Den Bosch heeft een geheim: de Binnendieze — een ' +
    'ondergrondse watergang die zich door de hele stad slingert.\n\n' +
    'Schakel de bewakingsposten een voor een uit. Neem het zuiden, dan het westen, ' +
    'en werk je een weg naar het archief in het noordoosten. Verlies niemand.',

  mapSize: 144, // Grotere map zodat vijandgroepen ver uit elkaar staan
  startingGold: 0,
  startingGoldAI: 0,

  buildings: [
    // No player Town Hall — this is a commando mission
    // Archief (TownHall proxy) in NE corner, far from start
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 55, z: 55, complete: true },
    // Outpost Zuid (eerste encounter, dichtbij start)
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -10, z: -30, complete: true },
    // Outpost West (tweede encounter)
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -40, z: 25, complete: true },
  ],

  // Tree resources als natuurlijke barrières / "stadsmuren"
  treeResources: [
    // Bomenrij zuid (scheidt start van outpost zuid)
    { x: -25, z: -20, amount: 300 },
    { x: -20, z: -18, amount: 300 },
    { x: -15, z: -20, amount: 300 },
    // Bomenrij midden (scheidt zuid van west sector)
    { x: -30, z: 0, amount: 300 },
    { x: -25, z: 2, amount: 300 },
    { x: -20, z: -2, amount: 300 },
    { x: -15, z: 1, amount: 300 },
    // Bomenrij noord (scheidt west van archief sector)
    { x: 10, z: 30, amount: 300 },
    { x: 15, z: 32, amount: 300 },
    { x: 20, z: 28, amount: 300 },
    { x: 25, z: 30, amount: 300 },
    // Flankering archief
    { x: 45, z: 40, amount: 300 },
    { x: 40, z: 45, amount: 300 },
  ],

  units: [
    // Player: 5 Sluipers (all ranged, stealth squad)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -55, z: -55 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -53, z: -55 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -55, z: -53 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -53, z: -53 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -54, z: -51 },

    // === Encounter 1: Outpost Zuid (2 guards, easy) ===
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -12, z: -32 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -8, z: -28 },

    // === Encounter 2: Outpost West (3 guards, medium) ===
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -42, z: 23 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -38, z: 27 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -40, z: 20 },

    // === Encounter 3: Archief (4 heavy guards, hard) ===
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 53, z: 53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 57, z: 53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 55, z: 57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 52, z: 57 },
  ],

  goldMines: [], // No economy in commando mission

  objectives: [
    // Primary: destroy ALL 3 buildings (2 outposts + archief). Victory fires via trigger when TownHall dies.
    { id: 'destroy-all', type: 'destroy-building', description: 'Vernietig het archief en beide bewakingsposten', targetValue: 3, isBonus: false },
    { id: 'keep-team-alive', type: 'have-units-at-end', description: 'Houd alle 5 Sluipers in leven', targetValue: 5, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Sint-Janskathedraal torent boven je uit in het maanlicht. In de verte zie je de bewakingsposten van de Randstad.' }],
      once: true,
    },
    {
      id: 'tip-approach',
      condition: { type: 'time', seconds: 12 },
      actions: [{ type: 'message', text: 'Neem de bewakingsposten een voor een uit. Focus je vuur — vijf Sluipers samen verslaan elke patrouille voordat ze alarm kunnen slaan.' }],
      once: true,
    },
    {
      id: 'outpost-south-cleared',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks },
      actions: [{ type: 'message', text: 'Eerste post uitgeschakeld! De westelijke bewakingspost is je volgende doel. Beweeg je team door de bomenrij.' }],
      once: true,
    },
    {
      id: 'alarm-reinforcements',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'ALARM! De Randstad heeft jullie gedetecteerd! Extra bewaking onderweg naar het archief!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 60, z: 50 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 50, z: 60 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 58, z: 58 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'victory-archief',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Documenten gevonden! "Project Gentrificatie — Elke stad een Vinex-wijk, elke kroeg een Starbucks." Dit is veel groter dan een Worstenbroodje...' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  noPlayerTownHall: true,

  starThresholds: {
    threeStarTime: 240,  // 4 min — aggressive clear
    twoStarTime: 420,    // 7 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 5: "Heuvelland Diplomatie" (Survive Limburgse tests)
// ---------------------------------------------------------------------------

const LIMBURG_SPAWN_X = 40;
const LIMBURG_SPAWN_Z = 0;

const MISSION_5_HEUVELLAND: MissionDefinition = {
  id: 'brabant-5-heuvelland-diplomatie',
  campaignId: 'brabanders',
  missionIndex: 4,
  title: 'Heuvelland Diplomatie',
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Limburgers],
  briefingTitle: 'Missie 5: Heuvelland Diplomatie',
  briefingText:
    'De Limburgers. Mysterieus, nors, en beroemd om hun vlaai. Ze leven in de heuvels ' +
    'en grotten van het zuiden, en ze vertrouwen niemand — vooral geen Brabanders.\n\n' +
    'Maar de documenten uit Den Bosch laten zien dat Project Gentrificatie ook HUN ' +
    'grotten bedreigt. Reis naar het Heuvelland, overleef hun "tests", en overtuig ' +
    'de Mijnbaas om een alliantie te vormen.\n\n' +
    'Ze zullen je aanvallen. Verdedig je, maar vernietig hun thuisbasis niet — dat zou onbeleefd zijn.',

  mapSize: 128,
  startingGold: 300,
  startingGoldAI: 0,

  buildings: [
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -50, z: 0, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -42, z: 0, complete: true },
  ],

  units: [
    // Player: workers + starting army
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -47, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -45, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -43, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -47, z: 2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -45, z: 2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -40, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -38, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -40, z: 2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -38, z: 2 },
  ],

  goldMines: [
    { x: -45, z: -10, amount: 2500 },
    { x: -45, z: 10, amount: 2500 },
    { x: -30, z: 0, amount: 2000 },
  ],

  objectives: [
    { id: 'survive-tests', type: 'survive-waves', description: 'Overleef 3 Limburgse "tests"', targetValue: 3, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Boerderij niet', targetValue: 0, isBonus: true },
    { id: 'have-15-units', type: 'have-units-at-end', description: 'Heb 15+ eenheden na de tests', targetValue: 15, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'Het Heuvelland. Hier hebben de Limburgers eeuwenlang de buitenwereld buitengehouden. Letterlijk.' }],
      once: true,
    },
    {
      id: 'tip-build',
      condition: { type: 'time', seconds: 10 },
      actions: [{ type: 'message', text: 'Bouw je verdediging op. De Limburgers zullen je "testen" om te zien of je sterk genoeg bent als bondgenoot.' }],
      once: true,
    },
    {
      id: 'wave-1-warning',
      condition: { type: 'time', seconds: 90 },
      actions: [{ type: 'message', text: 'Trompetgeschal uit de heuvels! De Limburgse Schutterij marcheert... ze testen je verdediging.' }],
      once: true,
    },
    {
      id: 'wave-1-spawn',
      condition: { type: 'time', seconds: 105 },
      actions: [
        { type: 'message', text: 'TEST 1! Limburgse troepen naderen vanuit het oosten!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'wave-2-warning',
      condition: { type: 'time', seconds: 255 },
      actions: [{ type: 'message', text: 'De grond trilt... ze sturen nu zwaardere eenheden.' }],
      once: true,
    },
    {
      id: 'wave-2-spawn',
      condition: { type: 'time', seconds: 270 },
      actions: [
        { type: 'message', text: 'TEST 2! Mergelridders en Schutterij! Dit wordt zwaarder!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'wave-3-warning',
      condition: { type: 'time', seconds: 435 },
      actions: [{ type: 'message', text: 'De Mijnbaas zelf komt eraan met zijn elite troepen. Dit is de laatste test!' }],
      once: true,
    },
    {
      id: 'wave-3-spawn',
      condition: { type: 'time', seconds: 450 },
      actions: [
        { type: 'message', text: 'FINALE TEST! De Mijnbaas: "Als jullie DIT overleven, geloof ik dat jullie de Randstad aankunnen."' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'all-waves-victory',
      condition: { type: 'all-waves-defeated' },
      actions: [
        { type: 'message', text: 'De Mijnbaas stopt het gevecht. "Genoeg. Jullie zijn sterker dan ik dacht. Ze willen onze grotten vullen met... een PARKEERGARAGE." De alliantie is gesmeed!' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Test 1 (T=105s): 6 Infantry + 2 Ranged (Schutterij)
    {
      index: 0,
      spawnTime: 105,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, LIMBURG_SPAWN_X, LIMBURG_SPAWN_Z, 4, FactionId.Limburgers),
        ...createWaveUnits(2, UnitTypeId.Ranged, LIMBURG_SPAWN_X + 3, LIMBURG_SPAWN_Z + 3, 2, FactionId.Limburgers),
      ],
      message: 'Limburgse Test 1 van 3',
    },
    // Test 2 (T=270s): 4 Infantry (heavy) + 4 Ranged + 2 Infantry flanking
    {
      index: 1,
      spawnTime: 270,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, LIMBURG_SPAWN_X, LIMBURG_SPAWN_Z - 5, 4, FactionId.Limburgers),
        ...createWaveUnits(4, UnitTypeId.Ranged, LIMBURG_SPAWN_X, LIMBURG_SPAWN_Z + 5, 3, FactionId.Limburgers),
        // Flank from south
        ...createWaveUnits(2, UnitTypeId.Infantry, 0, LIMBURG_SPAWN_X, 2, FactionId.Limburgers),
      ],
      message: 'Limburgse Test 2 van 3',
    },
    // Test 3 (T=450s): The Mijnbaas + elite — 10 Infantry + 5 Ranged
    {
      index: 2,
      spawnTime: 450,
      units: [
        ...createWaveUnits(10, UnitTypeId.Infantry, LIMBURG_SPAWN_X, LIMBURG_SPAWN_Z, 6, FactionId.Limburgers),
        ...createWaveUnits(5, UnitTypeId.Ranged, LIMBURG_SPAWN_X + 5, LIMBURG_SPAWN_Z, 4, FactionId.Limburgers),
      ],
      message: 'FINALE TEST — De Mijnbaas!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 540,   // 9 min
    twoStarTime: 720,     // 12 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 6: "De Boerenopstand" (Destroy garrison + free tractors)
// ---------------------------------------------------------------------------

const MISSION_6_BOERENOPSTAND: MissionDefinition = {
  id: 'brabant-6-de-boerenopstand',
  campaignId: 'brabanders',
  missionIndex: 5,
  title: 'De Boerenopstand',
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 6: De Boerenopstand',
  briefingText:
    'De boeren van het Groene Woud zijn woedend. De Randstad heeft hun landbouwgrond ' +
    'geconfisqueerd voor een nieuw "woonwijk-concept". Tractors zijn in beslag genomen, ' +
    'koeien onteigend.\n\n' +
    'Leid de boerenopstand! Bevrijd de confisqueerde tractors door hun bewakers te ' +
    'verslaan, rekruteer een groot leger, en verdrijf de Randstad-garnizoensbasis ' +
    'uit het Groene Woud.\n\n' +
    'Een Brabantse boer zonder tractor is als carnaval zonder bier. Onaanvaardbaar.',

  mapSize: 128,
  startingGold: 400,
  startingGoldAI: 600,

  buildings: [
    // Player: full Tier 1 base
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -50, z: -50, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -42, z: -50, complete: true },
    // Enemy garrison (north)
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 45, z: 45, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 37, z: 45, complete: true },
    // 3 "tractor" outposts (Barracks as proxy for confiscated tractors)
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 0, z: -20, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -20, z: 15, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 20, z: 5, complete: true },
  ],

  units: [
    // Player: 6 workers + 4 infantry + Prins-equivalent (infantry)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -47, z: -48 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -45, z: -48 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -43, z: -48 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -47, z: -46 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -45, z: -46 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -43, z: -46 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -40, z: -48 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -38, z: -48 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -40, z: -46 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -38, z: -46 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -36, z: -48 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -36, z: -46 },
    // Tractor outpost 1 guards (center-south)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -2, z: -22 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 2, z: -22 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 0, z: -18 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 0, z: -24 },
    // Tractor outpost 2 guards (west)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -22, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -18, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -20, z: 17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -20, z: 11 },
    // Tractor outpost 3 guards (east)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 18, z: 3 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 22, z: 3 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 20, z: 7 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 20, z: 1 },
    // Main garrison defenders
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 43, z: 43 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 47, z: 43 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 43, z: 47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 47, z: 47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 45, z: 43 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 45, z: 47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 45 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 50, z: 45 },
  ],

  goldMines: [
    { x: -40, z: -50, amount: 3000 },
    { x: -50, z: -40, amount: 3000 },
    { x: -25, z: -25, amount: 2000 },
    { x: 0, z: 0, amount: 2000 },
  ],

  objectives: [
    { id: 'destroy-garrison', type: 'destroy-building', description: 'Vernietig de Randstad-garnizoensbasis', targetValue: 1, isBonus: false },
    { id: 'train-20-units', type: 'train-units', description: 'Rekruteer minstens 20 eenheden', targetValue: 20, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Boerderij niet', targetValue: 0, isBonus: true },
    { id: 'have-25-units', type: 'have-units-at-end', description: 'Heb 25+ eenheden aan het einde', targetValue: 25, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-boer',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'Opzichter! Ze hebben mijn tractor afgepakt! Mijn TRACTOR! Dat is alsof je een man z\'n ziel afpakt!' }],
      once: true,
    },
    {
      id: 'tip-tractors',
      condition: { type: 'time', seconds: 15 },
      actions: [{ type: 'message', text: 'Bevrijd de 3 confisqueerde tractors door hun bewakers uit te schakelen. Vernietig daarna de garnizoensbasis in het noorden.' }],
      once: true,
    },
    {
      id: 'army-10',
      condition: { type: 'army-count', count: 10 },
      actions: [{ type: 'message', text: 'Je leger groeit! De boeren van het Groene Woud sluiten zich aan!' }],
      once: true,
    },
    {
      id: 'counterattack-warning',
      condition: { type: 'time', seconds: 480 },
      actions: [{ type: 'message', text: 'WAARSCHUWING: De Randstad stuurt een aanvalsgolf vanuit het garnizoen!' }],
      once: true,
    },
    {
      id: 'counterattack',
      condition: { type: 'time', seconds: 510 },
      actions: [
        { type: 'message', text: 'Corporate Advocaat: "U betreedt verboden terrein! Hier is het bestemmingsplan!"' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(6, UnitTypeId.Infantry, 35, 35, 4),
            ...createWaveUnits(3, UnitTypeId.Ranged, 38, 35, 3),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'second-counterattack',
      condition: { type: 'time', seconds: 780 },
      actions: [
        { type: 'message', text: 'Nog meer Randstad-troepen! Ze geven niet op!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(8, UnitTypeId.Infantry, 35, 35, 5),
            ...createWaveUnits(4, UnitTypeId.Ranged, 40, 35, 3),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'victory-garrison',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Het garnizoen is gevallen! Het Groene Woud is bevrijd! De boeren vieren feest — de frituurmeester bakt de eerste friet van de overwinning!' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 600,   // 10 min
    twoStarTime: 900,     // 15 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 7: "De Markt van Brabant" (Economy + defense)
// ---------------------------------------------------------------------------

const M7_RAID_NE_X = 30;
const M7_RAID_NE_Z = 30;
const M7_RAID_NW_X = -30;
const M7_RAID_NW_Z = 30;
const M7_RAID_SE_X = 30;
const M7_RAID_SE_Z = -30;

const MISSION_7_MARKT: MissionDefinition = {
  id: 'brabant-7-de-markt',
  campaignId: 'brabanders',
  missionIndex: 6,
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  title: 'De Markt van Brabant',
  briefingTitle: 'Missie 7: De Markt van Brabant',
  briefingText:
    'Na de Boerenopstand bloeit de handel weer in Brabant. Worstenbroodjes, bier, ' +
    'en verdacht goede friet — de marktkooplui hebben hun kramen opgeslagen en het goud ' +
    'stroomt als bier uit een vat.\n\n' +
    'Maar de Randstad is niet blij. "Economische zelfstandigheid is in strijd met ' +
    'het Centraal Beleid!" Ze sturen raiding parties om de handelsroutes te verstoren.\n\n' +
    'Bescherm de markt, verzamel 500 goud, en laat zien dat Brabant z\'n eigen ' +
    'boontjes kan doppen. Of z\'n eigen worstenbroodjes kan bakken. Hedde da!',

  mapSize: 80,
  startingGold: 150,
  startingGoldAI: 0,

  buildings: [
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: 0, z: 0, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 8, z: 0, complete: true },
  ],

  units: [
    // 4 workers
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -3, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 1, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 3, z: -2 },
    // 2 infantry
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: 2 },
  ],

  goldMines: [
    { x: -20, z: 15, amount: 2000 },
    { x: 20, z: 15, amount: 2000 },
    { x: 0, z: -25, amount: 2500 },
  ],

  objectives: [
    { id: 'gather-500', type: 'gather-gold', description: 'Verzamel 500 goud voor de markteconomie', targetValue: 500, isBonus: false },
    { id: 'survive-raids', type: 'survive-waves', description: 'Overleef alle 3 Randstad-raids', targetValue: 3, isBonus: false },
    { id: 'no-building-loss', type: 'no-townhall-loss', description: 'Verlies geen enkel gebouw', targetValue: 0, isBonus: true },
    { id: 'have-10-units', type: 'have-units-at-end', description: 'Heb 10+ eenheden aan het einde', targetValue: 10, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-markt',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De markt is open! De frituurmeester heeft de olie al heet staan. Stuur je Boeren naar de goudmijnen — we moeten Brabant\'s economie opbouwen.' }],
      once: true,
    },
    {
      id: 'tip-defense',
      condition: { type: 'time', seconds: 30 },
      actions: [{ type: 'message', text: 'Verkenners melden Randstad-activiteit in het noordoosten. Train extra eenheden en bereid je voor op raids.' }],
      once: true,
    },
    {
      id: 'raid-1-warning',
      condition: { type: 'time', seconds: 90 },
      actions: [{ type: 'message', text: 'Een Randstad-konvooi is gesignaleerd! Ze komen vanuit het noordoosten!' }],
      once: true,
    },
    {
      id: 'raid-1-spawn',
      condition: { type: 'time', seconds: 105 },
      actions: [
        { type: 'message', text: 'RAID 1! "Wij komen uw marktvergunningen controleren!" — Randstad-inspecteur' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'raid-2-warning',
      condition: { type: 'time', seconds: 240 },
      actions: [{ type: 'message', text: 'Meer vijanden naderen... dit keer vanuit het noordwesten! Ze proberen ons te omsingelen!' }],
      once: true,
    },
    {
      id: 'raid-2-spawn',
      condition: { type: 'time', seconds: 255 },
      actions: [
        { type: 'message', text: 'RAID 2! Zwaardere eenheden! "Dit pand is in strijd met het bestemmingsplan!"' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'raid-3-warning',
      condition: { type: 'time', seconds: 390 },
      actions: [{ type: 'message', text: 'GROTE AANVAL in aantocht vanuit het zuidoosten! Alles op alles — verdedig de markt!' }],
      once: true,
    },
    {
      id: 'raid-3-spawn',
      condition: { type: 'time', seconds: 405 },
      actions: [
        { type: 'message', text: 'RAID 3! De CEO persoonlijk: "Als jullie niet stoppen met die worstenbroodjes, ga ik de NVWA bellen!"' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'all-raids-survived',
      condition: { type: 'all-waves-defeated' },
      actions: [
        { type: 'message', text: 'Alle raids afgeslagen! De Randstad druipt af. De frituurmeester: "En nu... feest! Gratis bitterballen voor iedereen!"' },
      ],
      once: true,
    },
    {
      id: 'victory-gold',
      condition: { type: 'gold-reached', amount: 500 },
      actions: [
        { type: 'message', text: 'De markteconomie bloeit! 500 goud verzameld! Brabant is niet te stoppen!' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Raid 1 (T=105s): Small — 4 Infantry from NE
    {
      index: 0,
      spawnTime: 105,
      units: createWaveUnits(4, UnitTypeId.Infantry, M7_RAID_NE_X, M7_RAID_NE_Z, 3),
      message: 'Raid 1 van 3 — Noordoost',
    },
    // Raid 2 (T=255s): Medium — 5 Infantry + 2 Ranged from NW
    {
      index: 1,
      spawnTime: 255,
      units: [
        ...createWaveUnits(5, UnitTypeId.Infantry, M7_RAID_NW_X, M7_RAID_NW_Z, 4),
        ...createWaveUnits(2, UnitTypeId.Ranged, M7_RAID_NW_X + 3, M7_RAID_NW_Z + 3, 2),
      ],
      message: 'Raid 2 van 3 — Noordwest',
    },
    // Raid 3 (T=405s): Large — 6 Infantry + 4 Ranged from SE
    {
      index: 2,
      spawnTime: 405,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, M7_RAID_SE_X, M7_RAID_SE_Z, 5),
        ...createWaveUnits(4, UnitTypeId.Ranged, M7_RAID_SE_X + 4, M7_RAID_SE_Z + 4, 3),
      ],
      message: 'Raid 3 van 3 — Zuidoost (ZWAAR)',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 480,   // 8 min
    twoStarTime: 720,     // 12 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 8: "Het Beleg van Eindhoven" (Full siege warfare)
// ---------------------------------------------------------------------------

const MISSION_8_BELEG: MissionDefinition = {
  id: 'brabant-8-het-beleg-van-eindhoven',
  campaignId: 'brabanders',
  missionIndex: 7,
  title: 'Het Beleg van Eindhoven',
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 8: Het Beleg van Eindhoven',
  briefingText:
    'Eindhoven — ooit het technologisch hart van Brabant. Maar de Randstad heeft er een ' +
    'vesting van gemaakt. Bewakingscamera\'s op elke hoek, vergaderzalen in elke straat, ' +
    'en het ergste van alles: de friettenten zijn vervangen door sushi-bars.\n\n' +
    'De Prins van Brabant leidt het offensief. "Jongens, dit is het moment. We jagen ' +
    'die bureaucraten eruit!" Twee aanvalsroutes zijn beschikbaar: frontaal via ' +
    'de snelweg, of sluipend door het Stratumseind.\n\n' +
    'Verover Eindhoven. Voor de friet. Voor Brabant.',

  mapSize: 96,
  startingGold: 350,
  startingGoldAI: 800,

  buildings: [
    // Player: base in SW
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -38, z: -38, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -30, z: -38, complete: true },
    // Enemy: fortified base in NE
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 38, z: 38, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 30, z: 38, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 38, z: 30, complete: true },
  ],

  units: [
    // Player: 6 infantry, 4 ranged (the army), + 3 workers for economy
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -35, z: -36 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -33, z: -36 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -31, z: -36 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -28, z: -36 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -26, z: -36 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -24, z: -36 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -28, z: -34 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -26, z: -34 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -24, z: -34 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -28, z: -32 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -26, z: -32 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -24, z: -32 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -22, z: -32 },
    // Enemy: heavy defense around TownHall
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 36, z: 36 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 36 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 36, z: 40 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 40 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 38, z: 34 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 34, z: 38 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 38, z: 42 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 42, z: 38 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 36, z: 42 },
    // Barracks 1 guards
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 28, z: 36 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 32, z: 36 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 30, z: 40 },
    // Barracks 2 guards
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 36, z: 28 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 28 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 38, z: 32 },
    // Forward patrol in center
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 10, z: 10 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 12, z: 8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 8, z: 12 },
  ],

  goldMines: [
    { x: -35, z: -25, amount: 3000 },
    { x: -25, z: -38, amount: 2500 },
    { x: 0, z: -10, amount: 2000 },
    { x: 35, z: 25, amount: 2000 }, // Near enemy — risky
  ],

  objectives: [
    { id: 'destroy-eindhoven-th', type: 'destroy-building', description: 'Vernietig het Randstad-hoofdkantoor in Eindhoven', targetValue: 1, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Houd de Prins in leven (verlies je Boerderij niet)', targetValue: 0, isBonus: true },
    { id: 'train-15-units', type: 'train-units', description: 'Train 15 extra eenheden', targetValue: 15, isBonus: true },
  ],

  triggers: [
    {
      id: 'prins-speech',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'Prins van Brabant: "Sluipers! Carnavalvierders! Vandaag bevrijden we onze stad! ALAAF!"' }],
      once: true,
    },
    {
      id: 'tip-routes',
      condition: { type: 'time', seconds: 15 },
      actions: [{ type: 'message', text: 'Twee routes naar de vesting: frontaal aanvallen via het centrum, of sluipen door het bos in het zuiden. Kies wijs.' }],
      once: true,
    },
    {
      id: 'forward-patrol',
      condition: { type: 'time', seconds: 60 },
      actions: [{ type: 'message', text: 'Vijandelijke patrouille gespot in het centrum. Ze bewaken de toegangsweg naar de vesting.' }],
      once: true,
    },
    {
      id: 'ai-reinforcements-1',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'Randstad-versterkingen arriveren vanuit het noorden! Ze geven Eindhoven niet zomaar op!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(4, UnitTypeId.Infantry, 38, 44, 3),
            ...createWaveUnits(2, UnitTypeId.Ranged, 42, 44, 2),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'ai-reinforcements-2',
      condition: { type: 'time', seconds: 540 },
      actions: [
        { type: 'message', text: 'Nog een golf Randstad-troepen! "We hebben een vergadering gehad en besloten jullie te stoppen!"' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(5, UnitTypeId.Infantry, 44, 38, 4),
            ...createWaveUnits(3, UnitTypeId.Ranged, 44, 42, 3),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'army-10',
      condition: { type: 'army-count', count: 10 },
      actions: [{ type: 'message', text: 'Het leger is sterk genoeg! Tijd om de aanval in te zetten op de vesting!' }],
      once: true,
    },
    {
      id: 'victory-eindhoven',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Eindhoven is bevrijd! De Prins plant de Brabantse vlag op het dak van het hoofdkantoor. "En als eerste maatregel: alle sushi-bars worden weer friettenten!"' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 600,   // 10 min
    twoStarTime: 900,     // 15 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 9: "De Brabantse Raad" (Epic two-front finale)
// ---------------------------------------------------------------------------

const M9_NE_BASE_X = 42;
const M9_NE_BASE_Z = 42;
const M9_NW_BASE_X = -42;
const M9_NW_BASE_Z = 42;

const MISSION_9_RAAD: MissionDefinition = {
  id: 'brabant-9-de-brabantse-raad',
  campaignId: 'brabanders',
  missionIndex: 8,
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  title: 'De Brabantse Raad',
  briefingTitle: 'Missie 9: De Brabantse Raad',
  briefingText:
    'Dit is het. De CEO van de Randstad Ontwikkelingsmaatschappij heeft zijn laatste troef ' +
    'gespeeld. Twee legers marcheren naar het hart van Brabant — een vanuit het noordoosten, ' +
    'een vanuit het noordwesten. Pincerbeweging. Klassiek management-tactiek.\n\n' +
    'Maar wij hebben iets wat zij niet hebben: de Prins van Brabant EN de Boer van Brabant. ' +
    'Twee helden, een volk, en genoeg worstenbroodjes om een maand te overleven.\n\n' +
    '"Jongens, het is tijd voor de Brabantse Raad! We pakken ze aan op twee fronten!" ' +
    '— Prins van Brabant\n\n' +
    'Vernietig beide vijandelijke basissen. Red Brabant. En moge de frituurolie met ons zijn.',

  mapSize: 112,
  startingGold: 500,
  startingGoldAI: 1000,

  buildings: [
    // Player: full base in south-center
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: 0, z: -42, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 8, z: -42, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -8, z: -42, complete: true },
    // Enemy base 1: NE
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: M9_NE_BASE_X, z: M9_NE_BASE_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M9_NE_BASE_X - 8, z: M9_NE_BASE_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M9_NE_BASE_X, z: M9_NE_BASE_Z - 8, complete: true },
    // Enemy base 2: NW
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: M9_NW_BASE_X, z: M9_NW_BASE_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M9_NW_BASE_X + 8, z: M9_NW_BASE_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M9_NW_BASE_X, z: M9_NW_BASE_Z - 8, complete: true },
  ],

  units: [
    // Player: 6 workers
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -3, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 1, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 3, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -3, z: -38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -38 },
    // Player army: 5 infantry + 3 ranged (Prins side)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 8, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 10, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 8, z: -38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 12, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 12, z: -38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 10, z: -38 },
    // Player: 3 infantry + 2 ranged (Boer side)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -6, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -8, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -10, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -12, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -12, z: -38 },
    // NE base defenders
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 40 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 44, z: 40 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 44 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 44, z: 44 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 38, z: 42 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 42, z: 46 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 46, z: 42 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 42, z: 38 },
    // NW base defenders
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -40, z: 40 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -44, z: 40 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -40, z: 44 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -44, z: 44 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -38, z: 42 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -42, z: 46 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -46, z: 42 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -42, z: 38 },
    // Forward scouting parties (center map)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 15, z: 10 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -15, z: 10 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 0, z: 15 },
  ],

  goldMines: [
    { x: -15, z: -42, amount: 2500 },
    { x: 15, z: -42, amount: 2500 },
    { x: 0, z: -20, amount: 2000 }, // Center — contested
  ],

  objectives: [
    { id: 'destroy-both-hq', type: 'destroy-building', description: 'Vernietig beide Randstad-hoofdkantoren', targetValue: 2, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Boerderij niet', targetValue: 0, isBonus: true },
    { id: 'train-25-units', type: 'train-units', description: 'Train 25 eenheden totaal', targetValue: 25, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-epic',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'Prins: "Twee vijanden, twee basissen. We moeten ze allebei uitschakelen." Boer: "Ik hak ze om als mais in de oogst!"' }],
      once: true,
    },
    {
      id: 'tip-strategy',
      condition: { type: 'time', seconds: 15 },
      actions: [{ type: 'message', text: 'Resources zijn schaars! Verdeel je leger slim. Vernietig beide Randstad-hoofdkantoren om te winnen.' }],
      once: true,
    },
    {
      id: 'ne-attack-1',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'Het NE-leger marcheert! Randstad-troepen vanuit het noordoosten!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(4, UnitTypeId.Infantry, 30, 25, 3),
            ...createWaveUnits(2, UnitTypeId.Ranged, 33, 25, 2),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'nw-attack-1',
      condition: { type: 'time', seconds: 210 },
      actions: [
        { type: 'message', text: 'Nu ook vanuit het noordwesten! Twee fronten tegelijk!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(4, UnitTypeId.Infantry, -30, 25, 3),
            ...createWaveUnits(2, UnitTypeId.Ranged, -33, 25, 2),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'ne-attack-2',
      condition: { type: 'time', seconds: 420 },
      actions: [
        { type: 'message', text: 'Zwaardere NE-troepen! Ze sturen alles wat ze hebben!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(6, UnitTypeId.Infantry, 30, 20, 4),
            ...createWaveUnits(3, UnitTypeId.Ranged, 34, 22, 3),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'nw-attack-2',
      condition: { type: 'time', seconds: 450 },
      actions: [
        { type: 'message', text: 'Massale NW-aanval! De grond trilt!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(6, UnitTypeId.Infantry, -30, 20, 4),
            ...createWaveUnits(3, UnitTypeId.Ranged, -34, 22, 3),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'ceo-appears',
      condition: { type: 'time', seconds: 660 },
      actions: [
        { type: 'message', text: 'DE CEO VERSCHIJNT! "Genoeg geïnnoveerd in jullie dorpjes. Het is tijd voor een RESTRUCTURING!" Enorm leger vanuit het noorden!' },
        {
          type: 'spawn-units',
          units: [
            // CEO's personal army — massive wave from due north
            ...createWaveUnits(8, UnitTypeId.Infantry, 0, 45, 6),
            ...createWaveUnits(5, UnitTypeId.Ranged, 0, 50, 4),
            // Flanking squads
            ...createWaveUnits(3, UnitTypeId.Infantry, 20, 40, 3),
            ...createWaveUnits(3, UnitTypeId.Infantry, -20, 40, 3),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'army-15',
      condition: { type: 'army-count', count: 15 },
      actions: [{ type: 'message', text: 'Het Brabantse leger groeit! Tijd om de aanval in te zetten!' }],
      once: true,
    },
    {
      id: 'army-25',
      condition: { type: 'army-count', count: 25 },
      actions: [{ type: 'message', text: 'Een machtig Brabants leger! De vijand siddert!' }],
      once: true,
    },
    {
      id: 'victory-both-destroyed',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'BEIDE BASISSEN VERNIETIGD! De CEO vlucht in een Uber! "Ik ga naar een coworking space in Bali!" Brabant is gered! De Prins en de Boer omhelzen elkaar. Vandaag is een dag die nooit vergeten wordt.' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 900,    // 15 min
    twoStarTime: 1200,     // 20 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 10: "De Raad van Brabant" (Alliance forge + sabotage defense)
// ---------------------------------------------------------------------------

const M10_SABOTAGE_NORTH_X = 0;
const M10_SABOTAGE_NORTH_Z = 62;
const M10_SABOTAGE_WEST_X = -50;
const M10_SABOTAGE_WEST_Z = 37;
const M10_SABOTAGE_EAST_X = 50;
const M10_SABOTAGE_EAST_Z = 37;

const MISSION_10_RAAD: MissionDefinition = {
  id: 'brabant-10-de-raad-van-brabant',
  campaignId: 'brabanders',
  missionIndex: 9,
  title: 'De Raad van Brabant',
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 10: De Raad van Brabant',
  briefingText:
    'Na de Mijn van Waarheid is er geen weg meer terug. De Randstad weet dat we de Receptuur ' +
    'hebben. Ze weten dat we komen. En ze bereiden zich voor.\n\n' +
    'Maar wij ook. In Den Bosch — het kloppende hart van Brabant — roepen we de Raad van ' +
    'Brabant bijeen. Brabanders, Limburgers en Belgen aan dezelfde tafel. Voor het eerst ' +
    'in de geschiedenis.\n\n' +
    'Bouw de grootste alliantie die het zuiden ooit heeft gezien. Maar wees gewaarschuwd: ' +
    'de Randstad stuurt saboteurs om de boel te saboteren. Bescherm de kathedraal. ' +
    'Bescherm de alliantie. En bereid je voor op oorlog.',

  mapSize: 128,
  startingGold: 600,
  startingGoldAI: 0,

  buildings: [
    // Player: base south of the cathedral
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: 0, z: -12, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 6, z: -12, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -6, z: -12, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.LumberCamp, x: 0, z: -19, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Blacksmith, x: 6, z: -19, complete: true },
    // Limburgse bondgenoot basis (oost) — represented by AI-friendly barracks
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 50, z: 0, complete: true },
    // Belgische bondgenoot basis (west)
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -50, z: 0, complete: true },
  ],

  units: [
    // Player: 8 workers, 6 infantry (Carnavalvierders), 4 ranged (Sluipers), 2 ranged (Boerinnen equivalent)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -2, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 1, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 2, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -2, z: -10 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -10 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 1, z: -10 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 2, z: -10 },
    // Infantry (Carnavalvierders)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 5, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 7, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 5, z: -10 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -10 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 7, z: -10 },
    // Ranged (Sluipers)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -5, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -6, z: -11 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -5, z: -10 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -6, z: -10 },
    // Limburgse bondgenoot units (oost)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 48, z: -1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 50, z: -1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 51, z: -1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 48, z: 1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 50, z: 1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 51, z: 1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 52, z: 0 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 47, z: 0 },
    // Belgische bondgenoot units (west)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -48, z: -1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -50, z: -1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -51, z: -1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -48, z: 1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -50, z: 1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -51, z: 1 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -52, z: 0 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -47, z: 0 },
  ],

  goldMines: [
    { x: -12, z: -19, amount: 3000 },
    { x: 12, z: -19, amount: 3000 },
    { x: -37, z: 25, amount: 2000 }, // Contested — past de Dieze
    { x: 37, z: 25, amount: 2000 },  // Contested — past de Dieze
  ],

  treeResources: [
    { x: -25, z: -25, amount: 800 },
    { x: 25, z: -25, amount: 800 },
    { x: -19, z: -6, amount: 600 },
    { x: 19, z: -6, amount: 600 },
  ],

  objectives: [
    { id: 'survive-sabotage', type: 'survive-waves', description: 'Bescherm de kathedraal — overleef 3 sabotage-golven', targetValue: 3, isBonus: false },
    { id: 'train-army', type: 'train-units', description: 'Bouw een leger: train 30 militaire eenheden', targetValue: 30, isBonus: false },
    { id: 'gather-alliance-gold', type: 'gather-gold', description: 'Verzamel 800 goud voor de oorlogskas', targetValue: 800, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Boerderij niet', targetValue: 0, isBonus: false },
    { id: 'fast-alliance', type: 'gather-gold', description: 'Voltooi de alliantie snel: verzamel 1000 Worstenbroodjes', targetValue: 1000, isBonus: true },
    { id: 'have-50-units', type: 'have-units-at-end', description: 'Bereik 50 population aan het einde', targetValue: 50, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{
        type: 'message',
        text: 'Er zijn momenten die de geschiedenis veranderen. Niet door zwaarden of kanonnen — maar door handen die elkaar vinden. Dit is zo\'n moment.',
      }],
      once: true,
    },
    {
      id: 'tip-alliance',
      condition: { type: 'time', seconds: 15 },
      actions: [{
        type: 'message',
        text: 'Bouw een leger en versterk je economie. De Limburgers in het oosten en de Belgen in het westen helpen met de verdediging. Samen zijn we sterk.',
      }],
      once: true,
    },
    {
      id: 'alliance-forming',
      condition: { type: 'time', seconds: 60 },
      actions: [{
        type: 'message',
        text: 'Mijnbaas: "Brabander. We zijn begonnen als vreemden. In de Mijn van Waarheid werden we bondgenoten. Vandaag worden we broeders." Prins: "Sta op, vriend. In Brabant knielen we nie. We proosten."',
      }],
      once: true,
    },
    // Sabotage Wave 1 (minute 5 = 300s)
    {
      id: 'wave-1-warning',
      condition: { type: 'time', seconds: 270 },
      actions: [{
        type: 'message',
        text: 'Sluiper-scout: "Beweging bij de bruggen! En... zijn dat Hipsters? Ze proberen de kathedraal te... ze zetten er een pop-up koffiebar IN!"',
      }],
      once: true,
    },
    {
      id: 'wave-1-spawn',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'SABOTAGE GOLF 1! Hipsters en Managers vanuit het noorden over de westbrug!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    // Sabotage Wave 2 (minute 12 = 720s)
    {
      id: 'wave-2-warning',
      condition: { type: 'time', seconds: 690 },
      actions: [{
        type: 'message',
        text: '"Die Stagiaires op het plein — dat zijn GEEN Stagiaires! Ze hebben laptops met RANDSTAD-logo\'s!"',
      }],
      once: true,
    },
    {
      id: 'wave-2-spawn',
      condition: { type: 'time', seconds: 720 },
      actions: [
        { type: 'message', text: 'SABOTAGE GOLF 2! Influencers, Managers en Consultants vanuit alle richtingen!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    // Hidden saboteurs moved into wave 2 unit list so they are tracked as wave entities
    // Sabotage Wave 3 (minute 20 = 1200s) — De Politicus + full assault
    {
      id: 'wave-3-warning',
      condition: { type: 'time', seconds: 1170 },
      actions: [{
        type: 'message',
        text: 'De Politicus zelf komt eraan met een elite-escorte! Dit is de zwaarste golf!',
      }],
      once: true,
    },
    {
      id: 'wave-3-spawn',
      condition: { type: 'time', seconds: 1200 },
      actions: [
        {
          type: 'message',
          text: 'SABOTAGE GOLF 3! Politicus: "Jullie \'alliantie\' is illegaal. Ik heb hier een wet... artikel 47b... lid 3..." Prins: "Artikel dit."',
        },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    // Belgian alliance event
    {
      id: 'belgian-alliance',
      condition: { type: 'gold-reached', amount: 200 },
      actions: [{
        type: 'message',
        text: 'Frietkoning proeft een worstenbroodje. Stilte. Zijn ogen worden groot. "Sacrebleu... dit is... LEKKERDER DAN FRIETEN." Dramatische stilte. "Maar vertel dat aan niemand."',
      }],
      once: true,
    },
    // Victory trigger — all waves survived + enough gold + army
    {
      id: 'all-waves-victory',
      condition: { type: 'all-waves-defeated' },
      actions: [{
        type: 'message',
        text: 'De drie leiders staan samen op het bordes van de kathedraal. Prins: "Morgen marcheren we." Mijnbaas: "Limburg is gereed." Frietkoning: "De frieten zijn warm." De Raad van Brabant is gesmeed!',
      }],
      once: true,
    },
    // Victory: all objectives met (gold + waves + army) — let auto-victory handle actual victory
    {
      id: 'victory-alliance',
      condition: { type: 'gold-reached', amount: 800 },
      actions: [
        {
          type: 'message',
          text: 'De oorlogskas vult zich! De alliantie is gesmeed in vuur en vertrouwen. En de Randstad... de Randstad had geen idee wat er op hen af kwam.',
        },
      ],
      once: true,
    },
  ],

  waves: [
    // Sabotage Wave 1 (T=300s): 6 Infantry (Hipsters) + 4 Infantry (Managers) from north-west
    {
      index: 0,
      spawnTime: 300,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, M10_SABOTAGE_WEST_X + 40, M10_SABOTAGE_NORTH_Z, 5),
        ...createWaveUnits(4, UnitTypeId.Infantry, M10_SABOTAGE_NORTH_X, M10_SABOTAGE_NORTH_Z, 4),
      ],
      message: 'Sabotage Golf 1 van 3',
    },
    // Sabotage Wave 2 (T=720s): 3 Ranged (Influencers) + 8 Infantry (Managers) + 2 Infantry (Consultants) + 2 Saboteurs from all directions
    {
      index: 1,
      spawnTime: 720,
      units: [
        ...createWaveUnits(3, UnitTypeId.Ranged, M10_SABOTAGE_NORTH_X, M10_SABOTAGE_NORTH_Z, 3),
        ...createWaveUnits(4, UnitTypeId.Infantry, M10_SABOTAGE_WEST_X + 20, M10_SABOTAGE_WEST_Z, 4),
        ...createWaveUnits(4, UnitTypeId.Infantry, M10_SABOTAGE_EAST_X - 20, M10_SABOTAGE_EAST_Z, 4),
        ...createWaveUnits(2, UnitTypeId.Ranged, M10_SABOTAGE_EAST_X, M10_SABOTAGE_EAST_Z, 2),
        // Hidden saboteurs (previously a separate T=725s trigger — now tracked as wave entities)
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -3, z: 3 },
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 3, z: 3 },
      ],
      message: 'Sabotage Golf 2 van 3 — VERRAAD! Verborgen saboteurs op het marktplein!',
    },
    // Sabotage Wave 3 (T=1200s): De Politicus + 12 Infantry + 4 Ranged + 2 Infantry (Vastgoedmakelaars)
    {
      index: 2,
      spawnTime: 1200,
      units: [
        // Politicus elite group — represented as strong infantry/ranged mix
        ...createWaveUnits(12, UnitTypeId.Infantry, M10_SABOTAGE_NORTH_X, M10_SABOTAGE_NORTH_Z, 8),
        ...createWaveUnits(4, UnitTypeId.Ranged, M10_SABOTAGE_NORTH_X - 10, M10_SABOTAGE_NORTH_Z, 4),
        ...createWaveUnits(2, UnitTypeId.Infantry, M10_SABOTAGE_NORTH_X + 10, M10_SABOTAGE_NORTH_Z, 2),
      ],
      message: 'SABOTAGE GOLF 3 — De Politicus!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 1500,   // 25 min
    twoStarTime: 2100,     // 35 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 11: "De Slag om de A2" (Massive 6-wave multi-front battle)
// ---------------------------------------------------------------------------

const M11_A2_NORTH_X = 0;
const M11_A2_NORTH_Z = 62;
const M11_WEST_FLANK_X = -44;
const M11_WEST_FLANK_Z = 36;
const M11_EAST_FLANK_X = 44;
const M11_EAST_FLANK_Z = 36;
const M11_FORT_DENBOSCH_X = 0;
const M11_FORT_DENBOSCH_Z = -22;
const M11_FORT_VEGHEL_X = 29;
const M11_FORT_VEGHEL_Z = 7;
const M11_FORT_BEST_X = -29;
const M11_FORT_BEST_Z = 7;

const MISSION_11_A2: MissionDefinition = {
  id: 'brabant-11-de-slag-om-de-a2',
  campaignId: 'brabanders',
  missionIndex: 10,
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  title: 'De Slag om de A2',
  briefingTitle: 'Missie 11: De Slag om de A2',
  briefingText:
    'Ze kwamen bij het ochtendgloren. Langs de A2, in een eindeloze kolonne van pakken en ' +
    'PowerPoints, marcheerde de Randstad naar het zuiden. Meer dan we ooit gezien hadden.\n\n' +
    'Dit is het. De Randstad gooit ALLES in de strijd. De CEO leidt persoonlijk de aanval. ' +
    'De Politicus stuurt de reserves. En achter hen... de hele bureaucratische machine.\n\n' +
    'Maar wij staan niet alleen. Brabant, Limburg en Belgie — zij aan zij. Dit is de dag ' +
    'waarop we laten zien dat het zuiden nie buigt.\n\n' +
    'Win, en de weg naar de Randstad ligt open. Verlies... en er IS geen Brabant meer.',

  mapSize: 128,
  startingGold: 800,
  startingGoldAI: 0,

  buildings: [
    // Fort Den Bosch (south-center) — player main base
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: M11_FORT_DENBOSCH_X, z: M11_FORT_DENBOSCH_Z, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: M11_FORT_DENBOSCH_X + 4, z: M11_FORT_DENBOSCH_Z, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: M11_FORT_DENBOSCH_X - 4, z: M11_FORT_DENBOSCH_Z, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.LumberCamp, x: M11_FORT_DENBOSCH_X, z: M11_FORT_DENBOSCH_Z - 4, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Blacksmith, x: M11_FORT_DENBOSCH_X + 4, z: M11_FORT_DENBOSCH_Z - 4, complete: true },
    // Fort Veghel (center-east) — allied outpost
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: M11_FORT_VEGHEL_X, z: M11_FORT_VEGHEL_Z, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: M11_FORT_VEGHEL_X + 3, z: M11_FORT_VEGHEL_Z, complete: true },
    // Fort Best (center-west) — allied outpost
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: M11_FORT_BEST_X, z: M11_FORT_BEST_Z, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: M11_FORT_BEST_X - 3, z: M11_FORT_BEST_Z, complete: true },
    // Randstad Veldkwartier (mobile HQ — represented as a northern TownHall)
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: M11_A2_NORTH_X, z: 51, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M11_A2_NORTH_X + 4, z: 51, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M11_A2_NORTH_X - 4, z: 51, complete: true },
  ],

  units: [
    // Fort Den Bosch garrison — 10 infantry + 6 ranged + 6 workers
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -21 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 0, z: -21 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 0, z: -22 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 1, z: -21 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -20 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 0, z: -20 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 3, z: -21 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 4, z: -21 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 4, z: -22 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 5, z: -21 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 3, z: -20 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 4, z: -20 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 4, z: -19 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 5, z: -20 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -3, z: -21 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -4, z: -21 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -3, z: -20 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -4, z: -20 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -4, z: -19 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -4, z: -22 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -5, z: -20 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -5, z: -21 },
    // Fort Veghel garrison — 12 infantry + 4 ranged
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 28, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 29, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 30, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 31, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 28, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 29, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 30, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 31, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 28, z: 6 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 31, z: 6 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 28, z: 9 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 30, z: 9 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 29, z: 9 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 31, z: 9 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 28, z: 5 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 31, z: 5 },
    // Fort Best garrison — 10 infantry + 4 ranged
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -28, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -29, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -30, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -31, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -28, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -29, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -30, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -31, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -28, z: 6 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -31, z: 6 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -29, z: 9 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -31, z: 9 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -28, z: 5 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -31, z: 5 },
    // Veldkwartier guards
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -1, z: 50 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 1, z: 50 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -1, z: 52 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 1, z: 52 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -2, z: 51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 2, z: 51 },
  ],

  goldMines: [
    { x: -7, z: -26, amount: 4000 },
    { x: 7, z: -26, amount: 4000 },
    { x: M11_FORT_VEGHEL_X, z: M11_FORT_VEGHEL_Z - 5, amount: 3000 },
    { x: M11_FORT_BEST_X, z: M11_FORT_BEST_Z - 5, amount: 3000 },
    { x: 0, z: 18, amount: 2500 },  // Contested — in no-man's land
  ],

  treeResources: [
    { x: -15, z: -18, amount: 1000 },
    { x: 15, z: -18, amount: 1000 },
    { x: -22, z: 4, amount: 800 },
    { x: 22, z: 4, amount: 800 },
  ],

  objectives: [
    { id: 'survive-6-waves', type: 'survive-waves', description: 'Overleef 6 aanvalsgolven', targetValue: 6, isBonus: false },
    { id: 'destroy-veldkwartier', type: 'destroy-building', description: 'Vernietig het Randstad Veldkwartier', targetValue: 1, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Alle 3 forten moeten overleven', targetValue: 0, isBonus: false },
    { id: 'forts-healthy', type: 'have-units-at-end', description: 'Alle forten boven 50% HP (heb 40+ eenheden over)', targetValue: 40, isBonus: true },
    { id: 'low-losses', type: 'train-units', description: 'Train minder dan 20 vervangende eenheden', targetValue: 20, isBonus: true, comparator: '<' },
  ],

  triggers: [
    {
      id: 'start-epic',
      condition: { type: 'time', seconds: 3 },
      actions: [{
        type: 'message',
        text: 'De A2. Ooit de levensader van Nederland. Vandaag de frontlinie van een oorlog die niemand zag aankomen.',
      }],
      once: true,
    },
    {
      id: 'tip-defense',
      condition: { type: 'time', seconds: 15 },
      actions: [{
        type: 'message',
        text: 'Verdedig de drie forten langs de A2: Den Bosch, Veghel en Best. Vernietig het Randstad Veldkwartier in het noorden om de vijandelijke productie te stoppen.',
      }],
      once: true,
    },
    // Wave 1: Voorhoede (minute 3 = 180s)
    {
      id: 'wave-1-warning',
      condition: { type: 'time', seconds: 150 },
      actions: [{
        type: 'message',
        text: 'Prins: "Daar zijn ze. Brabanders — ge weet waarvoor we vechten. Nie voor grond. Nie voor goud. Maar voor wie we ZIJN."',
      }],
      once: true,
    },
    {
      id: 'wave-1-spawn',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'GOLF 1: VOORHOEDE! Verkenners langs de A2 vanuit het noorden!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    // Wave 2: Westvleugel (minute 8 = 480s)
    {
      id: 'wave-2-warning',
      condition: { type: 'time', seconds: 450 },
      actions: [{
        type: 'message',
        text: 'Verkenners: "Een kolonne vanuit het noordwesten! Ze marcheren op Fort Best!"',
      }],
      once: true,
    },
    {
      id: 'wave-2-spawn',
      condition: { type: 'time', seconds: 480 },
      actions: [
        { type: 'message', text: 'GOLF 2: WESTVLEUGEL! Managers, Consultants en Influencers richting Fort Best!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    // Wave 3: Oostvleugel + CEO (minute 13 = 780s)
    {
      id: 'wave-3-warning',
      condition: { type: 'time', seconds: 750 },
      actions: [{
        type: 'message',
        text: 'CEO op een zwarte tractor: "Ik heb de kwartaalcijfers bekeken. Brabant is een VERLIESPOST. En ik saneer verliesposten."',
      }],
      once: true,
    },
    {
      id: 'wave-3-spawn',
      condition: { type: 'time', seconds: 780 },
      actions: [
        { type: 'message', text: 'GOLF 3: OOSTVLEUGEL! De CEO leidt de aanval op Fort Veghel! Corporate Advocaten voorop!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    // Wave 4: Tang movement (minute 18 = 1080s)
    {
      id: 'wave-4-warning',
      condition: { type: 'time', seconds: 1050 },
      actions: [{
        type: 'message',
        text: 'TANGBEWEGING! De vijand valt tegelijkertijd vanuit het westen EN oosten aan! Verdeel je troepen!',
      }],
      once: true,
    },
    {
      id: 'wave-4-spawn',
      condition: { type: 'time', seconds: 1080 },
      actions: [
        { type: 'message', text: 'GOLF 4: TANGBEWEGING! Twee flankaanvallen tegelijk! Kies: welk fort red je eerst?' },
        { type: 'spawn-wave', waveIndex: 3 },
      ],
      once: true,
    },
    // Wave 5: Hoofdmacht + De Politicus (minute 24 = 1440s)
    {
      id: 'wave-5-warning',
      condition: { type: 'time', seconds: 1410 },
      actions: [{
        type: 'message',
        text: 'Politicus: "In naam van de democratie eisen wij overgave!" Frietkoning: "In naam van de frieten eisen wij dat ge opflikkert!"',
      }],
      once: true,
    },
    {
      id: 'wave-5-spawn',
      condition: { type: 'time', seconds: 1440 },
      actions: [
        { type: 'message', text: 'GOLF 5: HOOFDMACHT! De Politicus met de zwaarste aanval tot nu toe! Alle fronten tegelijk!' },
        { type: 'spawn-wave', waveIndex: 4 },
      ],
      once: true,
    },
    // Wave 6: Alles of niets (minute 30 = 1800s)
    {
      id: 'wave-6-warning',
      condition: { type: 'time', seconds: 1770 },
      actions: [{
        type: 'message',
        text: 'Dit is het. Hun laatste kaart. Als we dit overleven... Prins: "DAN GAAN WE NAAR DE RANDSTAD!" Alle bondgenoten schreeuwen oorlogskreten.',
      }],
      once: true,
    },
    {
      id: 'wave-6-spawn',
      condition: { type: 'time', seconds: 1800 },
      actions: [
        { type: 'message', text: 'GOLF 6: ALLES OF NIETS! CEO + Politicus + ALLES wat de Randstad heeft! HOUD STAND VOOR BRABANT!' },
        { type: 'spawn-wave', waveIndex: 5 },
      ],
      once: true,
    },
    // Fort under pressure warnings
    {
      id: 'army-rally',
      condition: { type: 'army-count', count: 30 },
      actions: [{
        type: 'message',
        text: 'Het leger is sterk! Overweeg een aanval op het Randstad Veldkwartier terwijl het zwak bewaakt is!',
      }],
      once: true,
    },
    // Victory: all waves defeated + veldkwartier destroyed
    {
      id: 'all-waves-victory',
      condition: { type: 'all-waves-defeated' },
      actions: [{
        type: 'message',
        text: 'Alle golven verslagen! Val nu het Randstad Veldkwartier aan om de overwinning te voltooien!',
      }],
      once: true,
    },
    {
      id: 'victory-a2',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        {
          type: 'message',
          text: 'Het Randstad-leger vlucht over de A2! Prins staat op een heuvel: "Rennen maar. Morgen komen WIJ naar de Randstad." Mijnbaas: "Ik hoop dat ze parking hebben." Frietkoning: "En ik neem de frietketel mee."',
        },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=180s): Voorhoede — 12 Infantry + 4 Ranged (scouts) + 2 Infantry (Hipsters) from north
    {
      index: 0,
      spawnTime: 180,
      units: [
        ...createWaveUnits(12, UnitTypeId.Infantry, M11_A2_NORTH_X, M11_A2_NORTH_Z, 3),
        ...createWaveUnits(4, UnitTypeId.Ranged, M11_A2_NORTH_X + 4, M11_A2_NORTH_Z, 2),
        ...createWaveUnits(2, UnitTypeId.Infantry, M11_A2_NORTH_X - 4, M11_A2_NORTH_Z, 1),
      ],
      message: 'Golf 1 van 6 — Voorhoede',
    },
    // Wave 2 (T=480s): Westvleugel — 10 Infantry + 4 Ranged + 3 Ranged (Influencers) + 2 Infantry (HR) targeting Fort Best
    {
      index: 1,
      spawnTime: 480,
      units: [
        ...createWaveUnits(10, UnitTypeId.Infantry, M11_WEST_FLANK_X, M11_WEST_FLANK_Z, 2),
        ...createWaveUnits(4, UnitTypeId.Ranged, M11_WEST_FLANK_X + 4, M11_WEST_FLANK_Z, 2),
        ...createWaveUnits(3, UnitTypeId.Ranged, M11_WEST_FLANK_X + 2, M11_WEST_FLANK_Z - 2, 1),
        ...createWaveUnits(2, UnitTypeId.Infantry, M11_WEST_FLANK_X + 5, M11_WEST_FLANK_Z, 1),
      ],
      message: 'Golf 2 van 6 — Westvleugel naar Fort Best',
    },
    // Wave 3 (T=780s): Oostvleugel + CEO — 12 Infantry + 6 Ranged + 2 Infantry (Vastgoedmakelaars) targeting Fort Veghel
    {
      index: 2,
      spawnTime: 780,
      units: [
        ...createWaveUnits(12, UnitTypeId.Infantry, M11_EAST_FLANK_X, M11_EAST_FLANK_Z, 3),
        ...createWaveUnits(6, UnitTypeId.Ranged, M11_EAST_FLANK_X - 4, M11_EAST_FLANK_Z, 2),
        ...createWaveUnits(2, UnitTypeId.Infantry, M11_EAST_FLANK_X - 2, M11_EAST_FLANK_Z + 2, 1),
      ],
      message: 'Golf 3 van 6 — Oostvleugel + De CEO',
    },
    // Wave 4 (T=1080s): Tang movement — split attack west AND east
    {
      index: 3,
      spawnTime: 1080,
      units: [
        // West pincer
        ...createWaveUnits(8, UnitTypeId.Infantry, M11_WEST_FLANK_X + 7, M11_WEST_FLANK_Z + 7, 2),
        ...createWaveUnits(3, UnitTypeId.Ranged, M11_WEST_FLANK_X + 9, M11_WEST_FLANK_Z + 7, 1),
        // East pincer
        ...createWaveUnits(8, UnitTypeId.Infantry, M11_EAST_FLANK_X - 7, M11_EAST_FLANK_Z + 7, 2),
        ...createWaveUnits(3, UnitTypeId.Ranged, M11_EAST_FLANK_X - 9, M11_EAST_FLANK_Z + 7, 1),
      ],
      message: 'Golf 4 van 6 — Tangbeweging!',
    },
    // Wave 5 (T=1440s): Hoofdmacht — 15 Infantry + 8 Ranged + 4 Infantry + 3 Ranged + 2 Infantry (HR)
    {
      index: 4,
      spawnTime: 1440,
      units: [
        ...createWaveUnits(15, UnitTypeId.Infantry, M11_A2_NORTH_X, M11_A2_NORTH_Z, 4),
        ...createWaveUnits(8, UnitTypeId.Ranged, M11_A2_NORTH_X, M11_A2_NORTH_Z + 4, 2),
        ...createWaveUnits(4, UnitTypeId.Infantry, M11_WEST_FLANK_X + 15, M11_WEST_FLANK_Z + 4, 1),
        ...createWaveUnits(3, UnitTypeId.Ranged, M11_EAST_FLANK_X - 15, M11_EAST_FLANK_Z + 4, 1),
        ...createWaveUnits(2, UnitTypeId.Infantry, M11_A2_NORTH_X + 11, M11_A2_NORTH_Z, 1),
      ],
      message: 'Golf 5 van 6 — HOOFDMACHT!',
    },
    // Wave 6 (T=1800s): Alles of niets — CEO + Politicus + massive army from ALL directions
    {
      index: 5,
      spawnTime: 1800,
      units: [
        // Main A2 push
        ...createWaveUnits(20, UnitTypeId.Infantry, M11_A2_NORTH_X, M11_A2_NORTH_Z, 4),
        ...createWaveUnits(10, UnitTypeId.Ranged, M11_A2_NORTH_X, M11_A2_NORTH_Z + 2, 3),
        // West flank
        ...createWaveUnits(4, UnitTypeId.Infantry, M11_WEST_FLANK_X + 11, M11_WEST_FLANK_Z + 11, 2),
        ...createWaveUnits(2, UnitTypeId.Ranged, M11_WEST_FLANK_X + 13, M11_WEST_FLANK_Z + 11, 1),
        // East flank
        ...createWaveUnits(4, UnitTypeId.Infantry, M11_EAST_FLANK_X - 11, M11_EAST_FLANK_Z + 11, 2),
        ...createWaveUnits(2, UnitTypeId.Ranged, M11_EAST_FLANK_X - 13, M11_EAST_FLANK_Z + 11, 1),
      ],
      message: 'GOLF 6 — ALLES OF NIETS!',
    },
  ],

  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 2400,   // 40 min
    twoStarTime: 3300,     // 55 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Missie 12: "Het Gouden Worstenbroodje" (Finale — 3-ring assault + boss fight)
// ---------------------------------------------------------------------------

const M12_PLAYER_BASE_X = 0;
const M12_PLAYER_BASE_Z = -60;
const M12_RING1_Z = -18;
const M12_RING2_Z = 14;
const M12_RING3_Z = 46;
const M12_TOWER_X = 0;
const M12_TOWER_Z = 55;

const MISSION_12_GOUDEN_WORSTENBROODJE: MissionDefinition = {
  id: 'brabant-12-het-gouden-worstenbroodje',
  campaignId: 'brabanders',
  missionIndex: 11,
  playerFactionId: FactionId.Brabanders,
  aiFactionIds: [FactionId.Randstad],
  title: 'Het Gouden Worstenbroodje',
  briefingTitle: 'Missie 12: Het Gouden Worstenbroodje',
  briefingText:
    'Dit is het, Brabant.\n\n' +
    'Achter ons liggen elf missies, drie allianties en een oorlog die begon met een gestolen ' +
    'worstenbroodje. Voor ons ligt de Randstad. Een stad van glas en staal, waar de zon ' +
    'nauwelijks doorheen komt.\n\n' +
    'Ergens daarbinnen — in de kluis van het Corporate Tower, veertig verdiepingen hoog — ' +
    'ligt het Gouden Worstenbroodje.\n\n' +
    'Het wordt niet makkelijk. De Randstad heeft drie verdedigingsringen. Kantoor-torens op ' +
    'elke hoek. En De CEO wacht op ons op het dak van zijn toren.\n\n' +
    'Maar wij hebben gezelligheid. Wij hebben Limburgse tunnels en Belgische frieten. Wij ' +
    'hebben een Prins die danst in de regen en een Boer die een tractor kan besturen door ' +
    'een kantoorgebouw heen.\n\n' +
    'Haal het Worstenbroodje terug. Beeindig Project Gentrificatie. En laat de Randstad weten: ' +
    'Brabant buigt nie.\n\n' +
    'VOOR HET WORSTENBROODJE!',

  mapSize: 128,
  startingGold: 700,
  startingGoldAI: 2000,

  buildings: [
    // Player base (south — open polder)
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: M12_PLAYER_BASE_X, z: M12_PLAYER_BASE_Z, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: M12_PLAYER_BASE_X + 5, z: M12_PLAYER_BASE_Z, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: M12_PLAYER_BASE_X - 5, z: M12_PLAYER_BASE_Z, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.LumberCamp, x: M12_PLAYER_BASE_X + 5, z: M12_PLAYER_BASE_Z - 5, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Blacksmith, x: M12_PLAYER_BASE_X - 5, z: M12_PLAYER_BASE_Z - 5, complete: true },
    // Ring 1 — Buitenwijken (2 Barracks as Kantoor-torens at city gates)
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -18, z: M12_RING1_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 18, z: M12_RING1_Z, complete: true },
    // Ring 2 — Bedrijventerrein (2 Barracks as Coworking Spaces + Politicus patrol zone)
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -14, z: M12_RING2_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 14, z: M12_RING2_Z, complete: true },
    // Ring 3 — Centrum (TownHall as Corporate Tower, surrounded by Barracks as Kantoor-torens)
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: M12_TOWER_X, z: M12_TOWER_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M12_TOWER_X - 9, z: M12_RING3_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M12_TOWER_X + 9, z: M12_RING3_Z, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: M12_TOWER_X, z: M12_RING3_Z - 7, complete: true },
  ],

  units: [
    // Player starting army: 8 workers + 10 infantry + 6 ranged
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 0, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 0, z: -60 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 1, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -1, z: -58 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 0, z: -58 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 0, z: -57 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 1, z: -58 },
    // Infantry
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 4, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 5, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -60 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 7, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 4, z: -58 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 5, z: -58 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -58 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 6, z: -57 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 7, z: -58 },
    // Ranged
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -4, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -5, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -6, z: -59 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -4, z: -58 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -5, z: -58 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -6, z: -58 },
    // Limburgse bondgenoten (east flank)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 37, z: -51 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 38, z: -51 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 39, z: -51 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 37, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 38, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 39, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 39, z: -52 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 40, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 36, z: -51 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 36, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 37, z: -49 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 38, z: -49 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 39, z: -49 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 40, z: -49 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 40, z: -51 },
    // Belgische bondgenoten (west flank)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -37, z: -51 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -38, z: -51 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -39, z: -51 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -37, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -38, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -39, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -36, z: -51 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -36, z: -50 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -37, z: -49 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -38, z: -49 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -39, z: -49 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -39, z: -52 },

    // --- ENEMY FORCES ---
    // Ring 1 — Buitenwijken: 10 Infantry (Managers) + 4 Ranged (Consultants) + 4 Infantry (Hipsters)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -14, z: -21 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -11, z: -21 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -9, z: -19 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 9, z: -19 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 11, z: -21 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 14, z: -21 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -5, z: -17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 5, z: -17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 0, z: -19 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 2, z: -19 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -16, z: -18 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 16, z: -18 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -7, z: -17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 7, z: -17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -21, z: -17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 21, z: -17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -23, z: -16 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 23, z: -16 },

    // Ring 2 — Bedrijventerrein: 14 Infantry + 6 Ranged (Corporate Advocaten) + 4 Ranged (HR) + 3 Ranged (Influencers)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -11, z: 11 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -9, z: 11 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -7, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -5, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -2, z: 14 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 0, z: 14 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 2, z: 14 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 5, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 7, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 9, z: 11 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 11, z: 11 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -16, z: 14 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 16, z: 14 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 0, z: 16 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -13, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 13, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -9, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 9, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -5, z: 16 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 5, z: 16 },
    // Politicus elite escorte
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -2, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 2, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 0, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -1, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 1, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -7, z: 16 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 7, z: 16 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 0, z: 17 },

    // Ring 3 — Centrum: 12 Infantry + 8 Ranged + 4 Infantry (siege defense)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -7, z: 44 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -5, z: 44 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -2, z: 45 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 0, z: 45 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 2, z: 45 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 5, z: 44 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 7, z: 44 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -9, z: 46 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 9, z: 46 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -7, z: 48 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 7, z: 48 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 0, z: 48 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -8, z: 47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 8, z: 47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -5, z: 47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 5, z: 47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -2, z: 50 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 2, z: 50 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -5, z: 51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 5, z: 51 },
    // Siege defenders (Vastgoedmakelaars)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -10, z: 45 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 10, z: 45 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -10, z: 48 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 10, z: 48 },

    // Corporate Tower guards (CEO bodyguards) — 4 elite Infantry
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -1, z: 54 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 1, z: 54 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -1, z: 56 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 1, z: 56 },
    // CEO himself (represented as Ranged — uses ranged attacks from the tower)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 0, z: 55 },
  ],

  goldMines: [
    { x: M12_PLAYER_BASE_X - 14, z: M12_PLAYER_BASE_Z - 5, amount: 4000 },
    { x: M12_PLAYER_BASE_X + 14, z: M12_PLAYER_BASE_Z - 5, amount: 4000 },
    { x: M12_PLAYER_BASE_X, z: M12_PLAYER_BASE_Z + 9, amount: 3000 },
    { x: 28, z: -37, amount: 2500 },   // Near east flank approach
    { x: -28, z: -37, amount: 2500 },  // Near west flank approach
  ],

  treeResources: [
    { x: -23, z: -60, amount: 1000 },
    { x: 23, z: -60, amount: 1000 },
    { x: -14, z: -51, amount: 800 },
    { x: 14, z: -51, amount: 800 },
  ],

  objectives: [
    { id: 'destroy-corporate-tower', type: 'destroy-building', description: 'Vernietig het Corporate Tower (Randstad HQ)', targetValue: 1, isBonus: false },
    { id: 'destroy-ring-defenses', type: 'destroy-building', description: 'Doorbreek de verdedigingsringen (vernietig 5+ vijandelijke gebouwen)', targetValue: 5, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je eigen basis niet', targetValue: 0, isBonus: false },
    { id: 'total-victory', type: 'destroy-building', description: 'Totale Overwinning: vernietig ALLE vijandelijke gebouwen', targetValue: 8, isBonus: true },
    { id: 'have-30-units', type: 'have-units-at-end', description: 'Win met 30+ eenheden over (geen hero deaths)', targetValue: 30, isBonus: true },
  ],

  triggers: [
    // Opening
    {
      id: 'start-march',
      condition: { type: 'time', seconds: 3 },
      actions: [{
        type: 'message',
        text: 'Prins: "BRABANT! LIMBURG! BELGIE! Vandaag halen we terug wat van ons is. VOOR HET WORSTENBROODJE!" Het hele leger: "VOOR HET WORSTENBROODJE!"',
      }],
      once: true,
    },
    {
      id: 'tip-strategy',
      condition: { type: 'time', seconds: 15 },
      actions: [{
        type: 'message',
        text: 'Doorbreek de drie verdedigingsringen: Buitenwijken, Bedrijventerrein en Centrum. Vernietig het Corporate Tower om de CEO uit te lokken.',
      }],
      once: true,
    },
    // Ring 1 battle events
    {
      id: 'ring1-approach',
      condition: { type: 'army-count', count: 15 },
      actions: [{
        type: 'message',
        text: 'Het Brabantse leger nadert de buitenwijken van de Randstad. Staal en glas torenen boven het weiland uit. Dit is vijandelijk terrein.',
      }],
      once: true,
    },
    // Ring 1 reinforcements
    {
      id: 'ring1-reinforcements',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'Randstad patrouilles vanuit de buitenwijken! Ze verdedigen de stadspoorten!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(6, UnitTypeId.Infantry, -9, -23, 2),
            ...createWaveUnits(3, UnitTypeId.Ranged, 9, -23, 1),
          ],
        },
      ],
      once: true,
    },
    // Ring 2 events
    {
      id: 'ring2-politicus',
      condition: { type: 'time', seconds: 600 },
      actions: [
        {
          type: 'message',
          text: 'Politicus: "Dit is een SCHENDING van het bestuursrecht! Artikel 12! Lid 7! Sub-b!" Frietkoning: "Sub-DIT!" (gooit een friet)',
        },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(8, UnitTypeId.Infantry, 0, 18, 2),
            ...createWaveUnits(4, UnitTypeId.Ranged, 0, 21, 1),
          ],
        },
      ],
      once: true,
    },
    // Reinforcements from Ring 2
    {
      id: 'ring2-reinforcements',
      condition: { type: 'time', seconds: 900 },
      actions: [
        { type: 'message', text: 'Meer vijandelijke eenheden stromen vanuit de coworking spaces! De Randstad geeft niet op!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(6, UnitTypeId.Infantry, -14, 16, 2),
            ...createWaveUnits(6, UnitTypeId.Infantry, 14, 16, 2),
            ...createWaveUnits(3, UnitTypeId.Ranged, 0, 17, 1),
          ],
        },
      ],
      once: true,
    },
    // Ring 3 approach
    {
      id: 'ring3-approach',
      condition: { type: 'time', seconds: 1200 },
      actions: [{
        type: 'message',
        text: 'Camera kijkt omhoog naar het Corporate Tower. CEO (megafoon): "Welkom in MIJN wereld, Brabanders. Maar ik moet jullie teleurstellen: het Worstenbroodje... dat heb ik OMGESMOLTEN." Prins, kalm: "Ge liegt. En dat weten we allebei."',
      }],
      once: true,
    },
    // Ring 3 elite reinforcements
    {
      id: 'ring3-elite',
      condition: { type: 'time', seconds: 1500 },
      actions: [
        { type: 'message', text: 'Elite eenheden vanuit het centrum! De zwaarste troepen van de Randstad!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(8, UnitTypeId.Infantry, 0, 46, 3),
            ...createWaveUnits(4, UnitTypeId.Ranged, -5, 48, 2),
            ...createWaveUnits(4, UnitTypeId.Ranged, 5, 48, 2),
          ],
        },
      ],
      once: true,
    },
    // CEO boss spawns additional guards when tower is under attack
    {
      id: 'boss-phase-1',
      condition: { type: 'time', seconds: 1800 },
      actions: [
        {
          type: 'message',
          text: 'CEO: "BESCHERM HET TOWER! Dat is mijn HYBRIDE WERKPLEK!" Boss fight begint! CEO: "Laat me jullie mijn EXIT-STRATEGIE tonen."',
        },
        {
          type: 'spawn-units',
          units: [
            // Stagiaires shield
            ...createWaveUnits(4, UnitTypeId.Infantry, 0, 53, 1),
          ],
        },
      ],
      once: true,
    },
    // Boss phase 2 — CEO uses desperate measures
    {
      id: 'boss-phase-2',
      condition: { type: 'time', seconds: 2100 },
      actions: [
        {
          type: 'message',
          text: 'CEO: "De kwartaalcijfers spreken voor ZICH! Brabant is een KOSTENPOST!" Prins: "En gij zijt een VERLIESPOST!" De CEO wordt wanhopig!',
        },
        {
          type: 'spawn-units',
          units: [
            // Desperate reinforcements
            ...createWaveUnits(6, UnitTypeId.Infantry, -7, 55, 2),
            ...createWaveUnits(6, UnitTypeId.Infantry, 7, 55, 2),
            ...createWaveUnits(3, UnitTypeId.Ranged, 0, 57, 1),
          ],
        },
      ],
      once: true,
    },
    // Boss phase 3 — final stand
    {
      id: 'boss-phase-3',
      condition: { type: 'time', seconds: 2400 },
      actions: [
        {
          type: 'message',
          text: 'CEO: "IK... BEN... DE... SYNERGIEEEEE!" Laatste wanhopige aanval! Alles op alles!',
        },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(10, UnitTypeId.Infantry, 0, 60, 4),
            ...createWaveUnits(5, UnitTypeId.Ranged, 0, 62, 2),
          ],
        },
      ],
      once: true,
    },
    // Counter-attacks from Ring 2 remnants
    {
      id: 'counterattack-west',
      condition: { type: 'time', seconds: 1050 },
      actions: [
        { type: 'message', text: 'Vijandelijke tegenaanval vanuit het westen! Bescherm je flank!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(5, UnitTypeId.Infantry, -28, 0, 2),
            ...createWaveUnits(2, UnitTypeId.Ranged, -25, 2, 1),
          ],
        },
      ],
      once: true,
    },
    {
      id: 'counterattack-east',
      condition: { type: 'time', seconds: 1350 },
      actions: [
        { type: 'message', text: 'Tegenaanval vanuit het oosten!' },
        {
          type: 'spawn-units',
          units: [
            ...createWaveUnits(5, UnitTypeId.Infantry, 28, 0, 2),
            ...createWaveUnits(2, UnitTypeId.Ranged, 25, 2, 1),
          ],
        },
      ],
      once: true,
    },
    // Victory trigger — Corporate Tower (enemy TownHall) destroyed
    {
      id: 'victory-tower',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        {
          type: 'message',
          text: 'Het Corporate Tower scheurt open! Uit het puin verschijnt een gouden gloed — het Gouden Worstenbroodje! Intact. Stralend. ' +
            'Prins: "HET WORSTENBROODJE IS THUIS!" ' +
            'Dit was nooit het verhaal van een worstenbroodje. Het was het verhaal van een volk dat ontdekte dat het samen sterker was dan alleen. ' +
            'Dat gezelligheid geen zwakte is, maar de grootste kracht die er bestaat.',
        },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 2400,   // 40 min
    twoStarTime: 3300,     // 55 min
    allBonusesGrants3Stars: true,
  },
};

// ===========================================================================
// BELGEN CAMPAIGN — "HET COMPROMIS"
// ===========================================================================

// ---------------------------------------------------------------------------
// Belgen Missie 1: "De Eerste Frituur" (Tutorial)
// ---------------------------------------------------------------------------

const BELGEN_WAVE_SPAWN_X = 80;
const BELGEN_WAVE_SPAWN_Z = 80;

const MISSION_B1_EERSTE_FRITUUR: MissionDefinition = {
  id: 'belgen-1-de-eerste-frituur',
  campaignId: 'belgen',
  missionIndex: 0,
  title: 'De Eerste Frituur',
  playerFactionId: FactionId.Belgen,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 1: De Eerste Frituur',
  briefingText:
    'Welkom in Antwerpen, de poort van Belgie! Ge zijt de nieuwe adviseur van de Frietkoning, ' +
    'en uw eerste opdracht is simpel: bouw een basis, train wat mannen, en — het allerbelangrijkste — ' +
    'produceer Frieten. Veel Frieten.\n\n' +
    'De Randstad heeft al verkenners gestuurd. Ze praten over "synergien met de Antwerpse haven" ' +
    'en drinken havermondmelk. Dat belooft niet veel goeds.\n\n' +
    'Maar geen paniek! In Belgie lossen we alles op met een goede portie friet en een pintje. ' +
    'Bouw uw Frituur, verzamel 500 Frieten, en overleef drie golven Randstad-infiltranten.\n\n' +
    'Ceci n\'est pas une army... maar het is een begin.',

  mapSize: 96,
  startingGold: 100,
  startingGoldAI: 0,

  buildings: [
    // Player base — west side (Antwerp harbour)
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: -35, z: -20, complete: true },
  ],

  units: [
    // 5 Belgian workers (Frietkraamhouders)
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -32, z: -18 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -30, z: -18 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -28, z: -18 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -32, z: -16 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -30, z: -16 },
  ],

  goldMines: [
    // "Frieten" resource nodes near the harbour
    { x: -25, z: -25, amount: 2000 },
    { x: -35, z: -10, amount: 1500 },
    { x: -15, z: -20, amount: 1500 },
  ],

  objectives: [
    { id: 'b1-gather-500', type: 'gather-gold', description: 'Produceer 500 Frieten', targetValue: 500, isBonus: false },
    { id: 'b1-build-barracks', type: 'build-building', description: 'Bouw een Frituur (Kazerne)', targetValue: 1, isBonus: false },
    { id: 'b1-survive-waves', type: 'survive-waves', description: 'Overleef 3 golven Randstad-infiltranten', targetValue: 3, isBonus: false },
    { id: 'b1-gather-1000', type: 'gather-gold', description: 'Produceer 1000 Frieten (Bonus: Extra Knapperig)', targetValue: 1000, isBonus: true },
    { id: 'b1-no-building-dmg', type: 'no-townhall-loss', description: 'Geen enkel Belgisch gebouw verloren', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'b1-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{
        type: 'message',
        text: 'De Frietkoning spreekt: "Welkom in Antwerpen! Stuur uw Frietkraamhouders naar de grondstofbronnen. En bouw een Frituur — zonder Frituur geen leger, en zonder leger geen frieten. Wacht, dat klopt niet helemaal..."',
      }],
      once: true,
    },
    {
      id: 'b1-barracks-tip',
      condition: { type: 'time', seconds: 45 },
      actions: [{
        type: 'message',
        text: 'Tip: Selecteer een Frietkraamhouder en druk B om een Frituur te bouwen. In Belgie duurt alles drie keer langer door de bureaucratie, maar het resultaat is drie keer zo lekker.',
      }],
      once: true,
    },
    {
      id: 'b1-barracks-built',
      condition: { type: 'building-built', buildingType: BuildingTypeId.Barracks },
      actions: [{
        type: 'message',
        text: 'De Frituur staat! Nu kunt ge eenheden trainen. De Frietkoning: "Eindelijk! Na 47 formulieren en 3 vergunningsaanvragen... een Frituur!"',
      }],
      once: true,
    },
    {
      id: 'b1-wave-1-warning',
      condition: { type: 'time', seconds: 90 },
      actions: [{ type: 'message', text: 'Verkenners melden: Hipsters met laptops naderen vanuit het oosten! Ze willen de haven "optimaliseren"!' }],
      once: true,
    },
    {
      id: 'b1-wave-1-spawn',
      condition: { type: 'time', seconds: 105 },
      actions: [
        { type: 'message', text: 'GOLF 1! Vier Hipsters en twee Managers. Ze ruiken naar avocadotoast!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'b1-wave-2-warning',
      condition: { type: 'time', seconds: 225 },
      actions: [{ type: 'message', text: 'Meer Randstedelingen in aantocht. Ze delen flyers uit over "co-working spaces"...' }],
      once: true,
    },
    {
      id: 'b1-wave-2-spawn',
      condition: { type: 'time', seconds: 240 },
      actions: [
        { type: 'message', text: 'GOLF 2! Zes Hipsters en drie Consultants. Ze proberen de Frituur om te bouwen tot een poke bowl bar!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'b1-wave-3-warning',
      condition: { type: 'time', seconds: 375 },
      actions: [{ type: 'message', text: 'LAATSTE GOLF nadert! Een Influencer is gespot — die is gevaarlijk!' }],
      once: true,
    },
    {
      id: 'b1-wave-3-spawn',
      condition: { type: 'time', seconds: 390 },
      actions: [
        { type: 'message', text: 'GOLF 3! Acht Hipsters, vier Managers en een Influencer! Ze livestreamen de aanval op TikTok!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'b1-all-waves-defeated',
      condition: { type: 'all-waves-defeated' },
      actions: [{
        type: 'message',
        text: 'Alle golven verslagen! De Frietkoning: "Magnifique! En nu... frieten voor iedereen. Dat is het Belgische antwoord op alles."',
      }],
      once: true,
    },
    {
      id: 'b1-victory',
      condition: { type: 'gold-reached', amount: 500 },
      actions: [
        {
          type: 'message',
          text: '500 Frieten geproduceerd! De haven is veilig, de Frituur draait, en de Randstad trekt zich terug. Een goede dag voor Belgie!',
        },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=105s): 4 Infantry + 2 Ranged (Hipsters + Managers)
    {
      index: 0,
      spawnTime: 105,
      units: [
        ...createWaveUnits(4, UnitTypeId.Infantry, BELGEN_WAVE_SPAWN_X, BELGEN_WAVE_SPAWN_Z, 3),
        ...createWaveUnits(2, UnitTypeId.Ranged, BELGEN_WAVE_SPAWN_X + 3, BELGEN_WAVE_SPAWN_Z + 3, 2),
      ],
      message: 'Golf 1 van 3',
    },
    // Wave 2 (T=240s): 6 Infantry + 3 Ranged (Hipsters + Consultants)
    {
      index: 1,
      spawnTime: 240,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, BELGEN_WAVE_SPAWN_X, BELGEN_WAVE_SPAWN_Z, 4),
        ...createWaveUnits(3, UnitTypeId.Ranged, BELGEN_WAVE_SPAWN_X + 4, BELGEN_WAVE_SPAWN_Z + 4, 3),
      ],
      message: 'Golf 2 van 3',
    },
    // Wave 3 (T=390s): 8 Infantry + 4 Ranged + 1 Heavy (Hipsters + Managers + Influencer)
    {
      index: 2,
      spawnTime: 390,
      units: [
        ...createWaveUnits(8, UnitTypeId.Infantry, BELGEN_WAVE_SPAWN_X, BELGEN_WAVE_SPAWN_Z, 5),
        ...createWaveUnits(4, UnitTypeId.Ranged, BELGEN_WAVE_SPAWN_X + 5, BELGEN_WAVE_SPAWN_Z + 5, 3),
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: BELGEN_WAVE_SPAWN_X, z: BELGEN_WAVE_SPAWN_Z },
      ],
      message: 'LAATSTE GOLF!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 360,   // 6 min
    twoStarTime: 540,     // 9 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Belgen Missie 2: "Het Chocolade Verdrag"
// ---------------------------------------------------------------------------

const MISSION_B2_CHOCOLADE_VERDRAG: MissionDefinition = {
  // NOTE: hasAIProduction false — no AI barracks, reinforcements come via wave triggers
  id: 'belgen-2-het-chocolade-verdrag',
  campaignId: 'belgen',
  missionIndex: 1,
  playerFactionId: FactionId.Belgen,
  aiFactionIds: [FactionId.Randstad],
  title: 'Het Chocolade Verdrag',
  briefingTitle: 'Missie 2: Het Chocolade Verdrag',
  briefingText:
    'Brugge — de stad van kanalen, pralines en toeristen die verdwalen. De Randstad heeft ' +
    'ontdekt dat Belgische chocolade het geheime wapen is achter onze diplomatie. Zonder chocolade ' +
    'geen compromissen, en zonder compromissen... ja, dan moeten we echt gaan vechten.\n\n' +
    'Bouw een Chocolaterie en produceer genoeg Chocolade om het Chocolade Verdrag te ondertekenen. ' +
    'Maar de Randstad stuurt plundertroepen om onze voorraden te stelen.\n\n' +
    'Gebruik het Belgische Compromis: stel de vijandelijke aanval uit door diplomatieke onderhandelingen ' +
    'te starten. Dat geeft u tijd om een leger op te bouwen.\n\n' +
    'De Frietkoning fluistert: "Diplomatie is als chocolade — zoet aan de buitenkant, maar binnenin ' +
    'zit altijd een verrassing."',

  mapSize: 128,
  startingGold: 300,
  startingGoldAI: 500,

  buildings: [
    // Player base — centre of Brugge (market square)
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: -10, z: -10, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: -5, z: -15, complete: true },
    // Randstad base — north-east
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 50, z: 50, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 45, z: 55, complete: true },
  ],

  units: [
    // Player: 4 workers + 2 infantry
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -7, z: -8 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -5, z: -8 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -3, z: -8 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -7, z: -6 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -2, z: -13 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 0, z: -13 },
    // Enemy: starting defenders + raid groups
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 48, z: 48 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 52, z: 48 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 50, z: 46 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 47, z: 52 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 53, z: 52 },
  ],

  goldMines: [
    // Player-side resource nodes
    { x: -20, z: -15, amount: 2500 },
    { x: -15, z: 5, amount: 2000 },
    // Contested middle
    { x: 15, z: 15, amount: 3000 },
    // Enemy-side
    { x: 40, z: 40, amount: 2000 },
  ],

  objectives: [
    { id: 'b2-build-chocolaterie', type: 'build-building', description: 'Bouw een Chocolaterie (Tertiaire Resource Gebouw)', targetValue: 1, isBonus: false, targetBuildingType: BuildingTypeId.TertiaryResourceBuilding },
    { id: 'b2-gather-800', type: 'gather-gold', description: 'Verzamel 800 Frieten voor het Chocolade Verdrag', targetValue: 800, isBonus: false },
    { id: 'b2-destroy-enemy-th', type: 'destroy-building', description: 'Vernietig het Randstad Hoofdkantoor (als het verdrag mislukt)', targetValue: 1, isBonus: false },
    { id: 'b2-train-10', type: 'train-units', description: 'Train 10 militaire eenheden', targetValue: 10, isBonus: true },
    { id: 'b2-no-th-loss', type: 'no-townhall-loss', description: 'Verlies het Belgisch Raadhuis niet', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'b2-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{
        type: 'message',
        text: 'De Frietkoning: "Brugge! De parel van Belgie! Bouw een Chocolaterie — we hebben Chocolade nodig voor het verdrag. En voor mijn dessert."',
      }],
      once: true,
    },
    {
      id: 'b2-chocolaterie-hint',
      condition: { type: 'time', seconds: 60 },
      actions: [{
        type: 'message',
        text: 'Tip: Bouw een Chocolaterie (Tertiaire Resource Gebouw) met een Frietkraamhouder. De Chocolade versterkt uw diplomatieke positie... en uw moraal.',
      }],
      once: true,
    },
    {
      id: 'b2-chocolaterie-built',
      condition: { type: 'building-built', buildingType: BuildingTypeId.TertiaryResourceBuilding },
      actions: [{
        type: 'message',
        text: 'De Chocolaterie staat! De Frietkoning: "Ah, de geur van pralines! Nu begint de echte Belgische diplomatie. Stap 1: chocolade. Stap 2: compromis. Stap 3: nog meer chocolade."',
      }],
      once: true,
    },
    {
      id: 'b2-compromis-event',
      condition: { type: 'time', seconds: 150 },
      actions: [{
        type: 'message',
        text: 'BELGISCH COMPROMIS GEACTIVEERD! De Frietkoning opent onderhandelingen met de Randstad. "Laten we praten over de situatie... bij een koffie en een praline." De vijand is 120 seconden afgeleid door het diplomatieke proces. Bouw snel uw leger op!',
      }],
      once: true,
    },
    {
      id: 'b2-compromis-fails',
      condition: { type: 'time', seconds: 270 },
      actions: [{
        type: 'message',
        text: 'Het Compromis is mislukt! De Randstad-delegatie: "We eisen 200% belastingverhoging op frieten!" De Frietkoning: "DIT IS OORLOG." De vijand valt aan!',
      }],
      once: true,
    },
    {
      id: 'b2-raid-1',
      condition: { type: 'time', seconds: 285 },
      actions: [
        { type: 'message', text: 'Randstad-plundertroepen naderen! Ze willen de Chocolaterie! Verdedig de pralines!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'b2-raid-2',
      condition: { type: 'time', seconds: 420 },
      actions: [
        { type: 'message', text: 'Nog meer plundertroepen! De Randstad stuurt nu ook Consultants — ze proberen uw Chocolaterie te "restructureren"!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'b2-army-ready',
      condition: { type: 'army-count', count: 10 },
      actions: [{
        type: 'message',
        text: 'Uw leger groeit! De Frietkoning: "Tien man! In Belgische termen is dat een heel kabinet. Tijd om de Randstad een bezoekje te brengen."',
      }],
      once: true,
    },
    {
      id: 'b2-victory-destroy',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        {
          type: 'message',
          text: 'Het Randstad Hoofdkantoor is vernietigd! De Frietkoning: "Het Chocolade Verdrag is getekend — in ONZE voorwaarden. Alle pralines blijven in Belgie. Punt."',
        },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Raid 1 (T=285s): 4 Infantry + 3 Ranged (targeted raid on Chocolaterie)
    {
      index: 0,
      spawnTime: 285,
      units: [
        ...createWaveUnits(4, UnitTypeId.Infantry, 40, 0, 3),
        ...createWaveUnits(3, UnitTypeId.Ranged, 43, 3, 2),
      ],
      message: 'Plundertroepen!',
    },
    // Raid 2 (T=420s): 6 Infantry + 4 Ranged + 1 Heavy
    {
      index: 1,
      spawnTime: 420,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, 40, 0, 4),
        ...createWaveUnits(4, UnitTypeId.Ranged, 44, 4, 3),
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 42, z: 2 },
      ],
      message: 'Meer plundertroepen!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 600,   // 10 min
    twoStarTime: 900,     // 15 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Belgen Missie 3: "De Commissievergadering"
// ---------------------------------------------------------------------------

const MISSION_B3_COMMISSIEVERGADERING: MissionDefinition = {
  id: 'belgen-3-de-commissievergadering',
  campaignId: 'belgen',
  missionIndex: 2,
  playerFactionId: FactionId.Belgen,
  aiFactionIds: [FactionId.Brabanders],
  title: 'De Commissievergadering',
  briefingTitle: 'Missie 3: De Commissievergadering',
  briefingText:
    'Brussel — het kloppend hart van de Europese bureaucratie. De Brabanders rukken op vanuit ' +
    'het zuiden, en ze zijn niet in de stemming voor compromissen. Hun Carnavalvierders maken een ' +
    'hels kabaal en hun Worstenbroodjekanons staan op scherp.\n\n' +
    'Maar wij zijn Belgen. Wij hebben een wapen dat machtiger is dan elk leger: DE COMMISSIE.\n\n' +
    'Richt een Commissie op (via het Raadhuis) om de vijandelijke productie te vertragen. ' +
    'Terwijl de Brabanders verstrikt raken in subcommissies, amendementen en koffiepauzes, ' +
    'bouwt ge uw eigen leger op voor de tegenaanval.\n\n' +
    'De Frietkoning grijnst: "Ze zeggen dat een Belgische commissie sneller een kameel ontwerpt ' +
    'dan een paard. Maar een kameel wint WEL in de woestijn."',

  mapSize: 128,
  startingGold: 400,
  startingGoldAI: 800,

  buildings: [
    // Player base — west (Belgian district of Brussels)
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: -45, z: 0, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: -38, z: -5, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TertiaryResourceBuilding, x: -38, z: 5, complete: true },
    // Enemy base — east (Brabanders encampment)
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: 45, z: 0, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 38, z: -5, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 38, z: 5, complete: true },
  ],

  units: [
    // Player: 5 workers + 3 infantry + 1 ranged
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -42, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -40, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -42, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -40, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -41, z: 0 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -35, z: -3 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -35, z: 0 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -35, z: 3 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -33, z: 0 },
    // Enemy: Brabanders with strong starting force + AI production
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 42, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 42, z: 2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: 44, z: 0 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 36, z: -3 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 36, z: 0 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 36, z: 3 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 34, z: -2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 34, z: 2 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 35, z: -5 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 35, z: 5 },
  ],

  goldMines: [
    // Player-side
    { x: -35, z: -15, amount: 2500 },
    { x: -35, z: 15, amount: 2500 },
    // Contested centre (no man's land)
    { x: 0, z: -10, amount: 3000 },
    { x: 0, z: 10, amount: 3000 },
    // Enemy-side
    { x: 35, z: -15, amount: 2000 },
    { x: 35, z: 15, amount: 2000 },
  ],

  objectives: [
    { id: 'b3-build-special', type: 'build-building', description: 'Richt een Commissie op (Factie Speciaal Gebouw)', targetValue: 1, isBonus: false, targetBuildingType: BuildingTypeId.FactionSpecial1 },
    { id: 'b3-destroy-enemy-th', type: 'destroy-building', description: 'Vernietig de Brabanders Boerderij', targetValue: 1, isBonus: false },
    { id: 'b3-train-15', type: 'train-units', description: 'Train 15 militaire eenheden', targetValue: 15, isBonus: false },
    { id: 'b3-no-worker-loss', type: 'no-worker-loss', description: 'Verlies geen Frietkraamhouders (Bonus: "Frieten voor Iedereen")', targetValue: 0, isBonus: true },
    { id: 'b3-have-20-units', type: 'have-units-at-end', description: 'Heb 20+ eenheden aan het einde', targetValue: 20, isBonus: true },
  ],

  triggers: [
    {
      id: 'b3-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{
        type: 'message',
        text: 'De Frietkoning: "Brussel! De stad waar vergaderen een olympische sport is. De Brabanders naderen, maar wij hebben iets beters dan een leger: een Commissie. Bouw er een via het Raadhuis!"',
      }],
      once: true,
    },
    {
      id: 'b3-commission-hint',
      condition: { type: 'time', seconds: 45 },
      actions: [{
        type: 'message',
        text: 'Tip: Bouw een Factie Speciaal Gebouw om de Commissie op te richten. De Commissie vertraagt vijandelijke productie in een groot gebied. Hoe meer bureaucratie, hoe langzamer de vijand.',
      }],
      once: true,
    },
    {
      id: 'b3-commission-built',
      condition: { type: 'building-built', buildingType: BuildingTypeId.FactionSpecial1 },
      actions: [{
        type: 'message',
        text: 'COMMISSIE OPGERICHT! De Brabanders productie wordt vertraagd! De Frietkoning: "Subcommissie A heeft het amendement op paragraaf 7b doorgestuurd naar Werkgroep C. Verwachte levertijd: wanneer de zon opbrandt."',
      }],
      once: true,
    },
    {
      id: 'b3-early-pressure',
      condition: { type: 'time', seconds: 120 },
      actions: [
        {
          type: 'message',
          text: 'Brabanders verkenners naderen! Ze schreeuwen iets over worstenbroodjes...',
        },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 20, z: -5 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 20, z: 0 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 20, z: 5 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b3-commission-effect',
      condition: { type: 'time', seconds: 180 },
      actions: [{
        type: 'message',
        text: 'De Commissie werkt! Brabanders rapport: "We kunnen niet aanvallen, we zitten vast in een vergadering over de aanvalsplanning. Er is een BEZWAAR op het bezwaar." Gebruik deze tijd om uw leger op te bouwen!',
      }],
      once: true,
    },
    {
      id: 'b3-wave-1',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'De Brabanders hebben eindelijk een besluit genomen! Een aanvalsgolf breekt door! GOLF 1!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'b3-wave-2-warning',
      condition: { type: 'time', seconds: 465 },
      actions: [{ type: 'message', text: 'De Brabanders hergroeperen... ze sturen een grotere golf. De Commissie kan ze niet meer tegenhouden!' }],
      once: true,
    },
    {
      id: 'b3-wave-2',
      condition: { type: 'time', seconds: 480 },
      actions: [
        { type: 'message', text: 'GOLF 2! Carnavalvierders EN Boogschutters! De Frietkoning: "Tijd voor de tegenaanval! Laat zien wat Belgische bureaucratie kan bereiken!"' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'b3-counterattack-tip',
      condition: { type: 'army-count', count: 15 },
      actions: [{
        type: 'message',
        text: 'Vijftien eenheden! De Frietkoning: "Een heel regiment! In Belgie noemen we dat een werkgroep. AANVALLEN!"',
      }],
      once: true,
    },
    {
      id: 'b3-victory',
      condition: { type: 'building-destroyed', factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall },
      actions: [
        {
          type: 'message',
          text: 'De Brabanders Boerderij is gevallen! De Frietkoning: "En DAT is de kracht van Belgische bureaucratie. Ze kwamen met worstenbroodjes, wij kwamen met FORMULIEREN. En een leger. Maar vooral formulieren."',
        },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=300s): 6 Infantry + 3 Ranged (Carnavalvierders + Boogschutters)
    {
      index: 0,
      spawnTime: 300,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, 25, 0, 4),
        ...createWaveUnits(3, UnitTypeId.Ranged, 28, 3, 2),
      ],
      message: 'Golf 1 van 2',
    },
    // Wave 2 (T=480s): 8 Infantry + 5 Ranged + 2 Heavy (full Brabanders assault)
    {
      index: 1,
      spawnTime: 480,
      units: [
        ...createWaveUnits(8, UnitTypeId.Infantry, 25, 0, 5),
        ...createWaveUnits(5, UnitTypeId.Ranged, 29, 4, 3),
        ...createWaveUnits(2, UnitTypeId.Heavy, 27, -3, 2),
      ],
      message: 'Golf 2 van 2 — TEGENAANVAL!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 720,    // 12 min
    twoStarTime: 1080,     // 18 min
    allBonusesGrants3Stars: true,
  },
};

// ===========================================================================
// LIMBURGERS CAMPAIGN — "De Schaduwen van het Heuvelland"
// ===========================================================================

// ---------------------------------------------------------------------------
// Helper: create wave units for Limburgers campaign
// ---------------------------------------------------------------------------

const LIMB_WAVE_EAST_X = 45;
const LIMB_WAVE_EAST_Z = 0;

function createLimbWaveUnits(
  count: number,
  type: UnitTypeId,
  baseX: number,
  baseZ: number,
  spread: number,
  faction: FactionId = FactionId.Randstad,
): MissionUnitSpawn[] {
  const units: MissionUnitSpawn[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    units.push({
      factionId: faction,
      unitType: type,
      x: baseX + Math.cos(angle) * spread,
      z: baseZ + Math.sin(angle) * spread,
    });
  }
  return units;
}

// ---------------------------------------------------------------------------
// Limburgers Missie 1: "De Eerste Schacht" (Tutorial)
// ---------------------------------------------------------------------------

const LIMBURGERS_MISSION_1_EERSTE_SCHACHT: MissionDefinition = {
  id: 'limburgers-1-de-eerste-schacht',
  campaignId: 'limburgers',
  missionIndex: 0,
  title: 'De Eerste Schacht',
  playerFactionId: FactionId.Limburgers,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 1: De Eerste Schacht',
  briefingText:
    'Diep onder Valkenburg trillen de grotten. De Mijnbaas voelt het in zijn botten — ' +
    'iets klopt niet. Maar eerst: de basis moet draaien.\n\n' +
    'Bouw een Mijnschacht om Kolen te winnen, verzamel Vlaai en Mergel, en train je ' +
    'eerste Mijnwerkers. De Limburgse economie draait op wat je uit de grond haalt.\n\n' +
    'Limburgers hebben een unieke kracht: tunnels. Mijnschachten functioneren als ' +
    'tunneluitgangen — bouw er twee en je eenheden kunnen ondergronds reizen.\n\n' +
    'En houd je ogen open. Die trillingen komen niet van een aardbeving.',

  mapSize: 96,
  startingGold: 150,
  startingGoldAI: 0,

  buildings: [
    // Player: Grottentempel (TownHall) in south-center of map
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: -5, z: -35, complete: true },
    // Pre-built Mijnschacht near base — first tunnel endpoint + Kolen production
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TertiaryResourceBuilding, x: 5, z: -30, complete: true },
  ],

  units: [
    // Player: 4 Mijnwerkers (workers)
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -3, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -1, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 1, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -3, z: -31 },
  ],

  goldMines: [
    { x: 5, z: -35, amount: 1500 },   // Close to start
    { x: -15, z: -25, amount: 1500 },  // Medium distance
    { x: 10, z: -10, amount: 2000 },   // North — tunnel helps reach this safely
  ],

  treeResources: [
    { x: -10, z: -30, amount: 800 },
    { x: 0, z: -25, amount: 800 },
    { x: -15, z: -35, amount: 600 },
    { x: 10, z: -30, amount: 600 },
  ],

  objectives: [
    { id: 'gather-400', type: 'gather-gold', description: 'Verzamel 400 Vlaai', targetValue: 400, isBonus: false },
    { id: 'build-mijnschacht', type: 'build-building', description: 'Bouw een tweede Mijnschacht (tunnelnetwerk)', targetValue: 2, isBonus: false, targetBuildingType: BuildingTypeId.TertiaryResourceBuilding, targetBuildingCount: 2 },
    { id: 'build-barracks', type: 'build-building', description: 'Bouw een Heuvelfort (Kazerne)', targetValue: 1, isBonus: false },
    { id: 'train-3-units', type: 'train-units', description: 'Train 3 Schutterij-soldaten', targetValue: 3, isBonus: false },
    { id: 'no-worker-loss', type: 'no-worker-loss', description: 'Verlies geen Mijnwerkers', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'Welkom in de grotten van Valkenburg. De Mijnbaas rekent op je. Stuur je Mijnwerkers naar de Vlaaimijnen en begin met verzamelen.' }],
      once: true,
    },
    {
      id: 'tip-tunnel-intro',
      condition: { type: 'time', seconds: 25 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Zie je die Mijnschacht bij de basis? Die produceert Kolen en is een tunneluitgang. Bouw een tweede Mijnschacht op een strategische plek en je eenheden kunnen ondergronds reizen. Selecteer een Mijnwerker en kies Mijnschacht in het bouwmenu."' }],
      once: true,
    },
    {
      id: 'tip-60s',
      condition: { type: 'time', seconds: 60 },
      actions: [{ type: 'message', text: 'Stuur je Mijnwerkers naar de Vlaaimijnen. In Limburg halen we alles uit de grond — letterlijk.' }],
      once: true,
    },
    {
      id: 'tunnel-network-active',
      condition: { type: 'building-count', buildingType: BuildingTypeId.TertiaryResourceBuilding, count: 2 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Het tunnelnetwerk is actief! Stuur eenheden naar een Mijnschacht — ze reizen ondergronds naar de andere uitgang in 3 seconden. Na aankomst krijgen ze een verrassingsbonus: +25% schade gedurende 3 seconden! Let op: belegeringswapens passen niet door tunnels."' }],
      once: true,
    },
    {
      id: 'tip-tunnel-maintenance',
      condition: { type: 'time', seconds: 100 },
      actions: [{ type: 'message', text: 'Tunneltip: Het netwerk kan maximaal 4 uitgangen hebben en 12 eenheden tegelijk transporteren. Zorg dat je Mijnschachten Kolen blijven produceren — zonder Kolen valt het tunnelnetwerk uit.' }],
      once: true,
    },
    {
      id: 'barracks-built',
      condition: { type: 'building-built', buildingType: BuildingTypeId.Barracks },
      actions: [{ type: 'message', text: 'Het Heuvelfort staat! Train nu Schutterij-soldaten. De grotten zijn niet zo veilig als ze lijken...' }],
      once: true,
    },
    {
      id: 'first-attack-warning',
      condition: { type: 'time', seconds: 180 },
      actions: [{ type: 'message', text: 'De grond trilt! Dat zijn geen aardbevingen... er komt iets van het noorden!' }],
      once: true,
    },
    {
      id: 'first-attack',
      condition: { type: 'time', seconds: 200 },
      actions: [
        { type: 'message', text: 'Randstad-verkenners! Ze hebben onze grotten gevonden! Gebruik je tunnelnetwerk om troepen snel naar het front te sturen!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 20, z: 30 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 22, z: 28 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 18, z: 28 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'gold-milestone',
      condition: { type: 'gold-reached', amount: 400 },
      actions: [
        { type: 'message', text: 'Genoeg Vlaai verzameld! Bouw nu een Heuvelfort en train Schutterij-soldaten om je missie te voltooien.' },
      ],
      once: true,
    },
    {
      id: 'l1-victory-msg',
      condition: { type: 'army-count', count: 3 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "De eerste schacht draait. De tunnels zijn actief. En we hebben een leger. Limburg is klaar voor wat er ook komt."' }],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 300,  // 5 min (extra time for tunnel objective)
    twoStarTime: 480,    // 8 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Limburgers Missie 2: "Duisternis Beneden" (Tunnel network + destroy)
// ---------------------------------------------------------------------------

const LIMBURGERS_MISSION_2_DUISTERNIS_BENEDEN: MissionDefinition = {
  id: 'limburgers-2-duisternis-beneden',
  campaignId: 'limburgers',
  missionIndex: 1,
  playerFactionId: FactionId.Limburgers,
  aiFactionIds: [FactionId.Randstad],
  title: 'Duisternis Beneden',
  briefingTitle: 'Missie 2: Duisternis Beneden',
  briefingText:
    'De Randstad boort tunnels onder de Maas. Maar wij kennen het ondergrondse beter ' +
    'dan wie dan ook. Bouw het Limburgse tunnelnetwerk en gebruik het om je eenheden ' +
    'snel door het Heuvelland te verplaatsen.\n\n' +
    'Verbind drie grotten tot een netwerk, transporteer je troepen ondergronds, en ' +
    'vernietig de Randstad-boorinstallatie voordat ze jouw basis bereiken.\n\n' +
    'Onder de grond zijn wij onverslaanbaar.',

  mapSize: 128,
  startingGold: 250,
  startingGoldAI: 200,

  buildings: [
    // Player: Grottentempel + Heuvelfort (barracks) in southwest
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: -45, z: -40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -37, z: -40, complete: true },
    // Enemy: Boorinstallatie (TownHall proxy) in northeast + barracks
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 40, z: 35, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 35, z: 40, complete: true },
  ],

  units: [
    // Player: 5 workers + 2 infantry
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -43, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -41, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -39, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -43, z: -36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -41, z: -36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -35, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -35, z: -36 },
    // Enemy: static defenders around boorinstallatie
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 38, z: 33 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 42, z: 33 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 37 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 38, z: 37 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 42, z: 37 },
    // Enemy: patrol in center
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 0, z: 0 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 2, z: -2 },
  ],

  goldMines: [
    { x: -35, z: -35, amount: 2000 },  // Near player base
    { x: -40, z: -20, amount: 2000 },  // Second node southwest
    { x: 0, z: -10, amount: 2500 },    // Center, contested
    { x: 30, z: 25, amount: 2000 },    // Near enemy
  ],

  treeResources: [
    { x: -30, z: -30, amount: 1000 },
    { x: -20, z: -20, amount: 800 },
    { x: 10, z: 10, amount: 800 },
    { x: -10, z: 0, amount: 600 },
  ],

  objectives: [
    { id: 'destroy-boorinstallatie', type: 'destroy-building', description: 'Vernietig de Randstad-boorinstallatie', targetValue: 1, isBonus: false },
    { id: 'train-8-units', type: 'train-units', description: 'Train 8 militaire eenheden', targetValue: 8, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Grottentempel niet', targetValue: 0, isBonus: true },
    { id: 'have-12-units', type: 'have-units-at-end', description: 'Heb 12+ eenheden aan het einde', targetValue: 12, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Ze boren. Die Randstedelingen boren recht naar ons toe. Dit stoppen we. NU."' }],
      once: true,
    },
    {
      id: 'tip-tunnels',
      condition: { type: 'time', seconds: 20 },
      actions: [{ type: 'message', text: 'Bouw Grotten (LumberCamp) op strategische punten. Ze functioneren als tunneluitgangen — je eenheden kunnen er snel tussen bewegen.' }],
      once: true,
    },
    {
      id: 'patrol-warning',
      condition: { type: 'time', seconds: 120 },
      actions: [{ type: 'message', text: 'Randstad-patrouilles gesignaleerd in het centrum. Gebruik je tunnelnetwerk om ze te omsingelen!' }],
      once: true,
    },
    {
      id: 'reinforcements-1',
      condition: { type: 'time', seconds: 240 },
      actions: [
        { type: 'message', text: 'Meer Randstad-troepen stromen de tunnel in! Ze versterken de boorinstallatie!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 44, z: 40 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 44, z: 38 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 44, z: 42 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'timer-warning',
      condition: { type: 'time', seconds: 480 },
      actions: [{ type: 'message', text: 'De boormachine komt dichterbij! Vernietig de installatie voordat ze onze basis bereiken!' }],
      once: true,
    },
    {
      id: 'victory-destroy',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'De boorinstallatie is vernietigd! Manager: "Maar de projectleider zei dat dit een risicoloos project was!" De Mijnbaas grijnst.' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 420,  // 7 min
    twoStarTime: 600,    // 10 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Limburgers Missie 3: "De Vlaaiproductie" (Economy + defense)
// ---------------------------------------------------------------------------

const LIMBURGERS_MISSION_3_VLAAIPRODUCTIE: MissionDefinition = {
  id: 'limburgers-3-de-vlaaiproductie',
  campaignId: 'limburgers',
  missionIndex: 2,
  title: 'De Vlaaiproductie',
  playerFactionId: FactionId.Limburgers,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 3: De Vlaaiproductie',
  briefingText:
    'Maastricht heeft honger. De stad vraagt 500 Vlaai om de wintervoorraad te vullen — ' +
    'en jij bent de enige die kan leveren. Maar de Randstad weet dat ook.\n\n' +
    'Ze sturen plunderaars om je Vlaaimijnen te saboteren en je transport te onderscheppen. ' +
    'Bouw een sterke economie, verdedig je Mijnwerkers tegen raids, en lever de Vlaai ' +
    'voordat Maastricht hongert.\n\n' +
    'In Limburg zeggen ze: "Wie de Vlaai beheerst, beheerst het land."',

  mapSize: 128,
  startingGold: 150,
  startingGoldAI: 0,

  buildings: [
    // Player: Grottentempel + LumberCamp (tunnel node) + Barracks in center-west
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: -40, z: 0, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: -32, z: 0, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -40, z: 8, complete: true },
  ],

  units: [
    // Player: 6 workers (economy focus) + 2 infantry + 1 ranged
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -38, z: -2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -36, z: -2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -34, z: -2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -38, z: 2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -36, z: 2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -34, z: 2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -30, z: -2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -30, z: 2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -28, z: 0 },
  ],

  goldMines: [
    { x: -30, z: -10, amount: 2500 },  // Close, southwest
    { x: -30, z: 10, amount: 2500 },   // Close, northwest
    { x: -15, z: 0, amount: 3000 },    // Center, exposed
    { x: 10, z: -15, amount: 2000 },   // Far, near raid spawns
    { x: 10, z: 15, amount: 2000 },    // Far, near raid spawns
  ],

  treeResources: [
    { x: -35, z: -15, amount: 1000 },
    { x: -35, z: 15, amount: 1000 },
    { x: -20, z: -10, amount: 800 },
    { x: -20, z: 10, amount: 800 },
    { x: 0, z: 0, amount: 600 },
  ],

  objectives: [
    { id: 'gather-500', type: 'gather-gold', description: 'Verzamel 500 Vlaai voor Maastricht', targetValue: 500, isBonus: false },
    { id: 'survive-raids', type: 'survive-waves', description: 'Overleef alle 4 Randstad-plunderaarsraids', targetValue: 4, isBonus: false },
    { id: 'no-worker-loss', type: 'no-worker-loss', description: 'Verlies geen Mijnwerkers', targetValue: 0, isBonus: true },
    { id: 'have-15-units', type: 'have-units-at-end', description: 'Heb 15+ eenheden aan het einde', targetValue: 15, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Maastricht hongert. 500 Vlaai. Geen excuses. En pas op — de Randstad wil onze economie ontwrichten."' }],
      once: true,
    },
    {
      id: 'tip-economy',
      condition: { type: 'time', seconds: 30 },
      actions: [{ type: 'message', text: 'Focus op Vlaai-verzameling. Stuur meerdere Mijnwerkers naar elke mijn. Bouw extra tunnels om snel tussen mijnen te wisselen.' }],
      once: true,
    },
    {
      id: 'raid-1-warning',
      condition: { type: 'time', seconds: 75 },
      actions: [{ type: 'message', text: 'Verkenners melden: Randstad-plunderaars naderen vanuit het oosten!' }],
      once: true,
    },
    {
      id: 'raid-1-spawn',
      condition: { type: 'time', seconds: 90 },
      actions: [
        { type: 'message', text: 'RAID 1! Randstad-plunderaars vallen je Mijnwerkers aan! Bescherm de mijnen!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'raid-2-warning',
      condition: { type: 'time', seconds: 195 },
      actions: [{ type: 'message', text: 'Meer plunderaars in aantocht... ze komen van twee kanten!' }],
      once: true,
    },
    {
      id: 'raid-2-spawn',
      condition: { type: 'time', seconds: 210 },
      actions: [
        { type: 'message', text: 'RAID 2! Een grotere groep — ze richten zich op je buitenste mijnen!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'raid-3-warning',
      condition: { type: 'time', seconds: 345 },
      actions: [{ type: 'message', text: 'De Randstad stuurt nu serieuze troepen. Ze willen je economie permanent platleggen.' }],
      once: true,
    },
    {
      id: 'raid-3-spawn',
      condition: { type: 'time', seconds: 360 },
      actions: [
        { type: 'message', text: 'RAID 3! Infanterie en boogschutters! Verdedig de Vlaaiproductie!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'raid-4-warning',
      condition: { type: 'time', seconds: 495 },
      actions: [{ type: 'message', text: 'LAATSTE RAID nadert! Dit is hun grootste poging om je te stoppen!' }],
      once: true,
    },
    {
      id: 'raid-4-spawn',
      condition: { type: 'time', seconds: 510 },
      actions: [
        { type: 'message', text: 'RAID 4! Alles of niets — de Randstad gooit er alles tegenaan!' },
        { type: 'spawn-wave', waveIndex: 3 },
      ],
      once: true,
    },
    {
      id: 'all-raids-survived',
      condition: { type: 'all-waves-defeated' },
      actions: [
        { type: 'message', text: 'Alle raids afgeslagen! Blijf Vlaai verzamelen voor Maastricht.' },
      ],
      once: true,
    },
    {
      id: 'victory-gather',
      condition: { type: 'gold-reached', amount: 500 },
      actions: [
        { type: 'message', text: '500 Vlaai geleverd! Maastricht juicht! De Mijnbaas: "Wie de Vlaai beheerst, beheerst het land. En dat zijn wij."' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Raid 1 (T=90s): 3 Infantry — light raid from east
    {
      index: 0,
      spawnTime: 90,
      units: createLimbWaveUnits(3, UnitTypeId.Infantry, 40, 0, 3),
      message: 'Raid 1 van 4',
    },
    // Raid 2 (T=210s): 4 Infantry + 2 Ranged — two-pronged from northeast/southeast
    {
      index: 1,
      spawnTime: 210,
      units: [
        ...createLimbWaveUnits(2, UnitTypeId.Infantry, 35, -20, 2),
        ...createLimbWaveUnits(2, UnitTypeId.Infantry, 35, 20, 2),
        ...createLimbWaveUnits(1, UnitTypeId.Ranged, 37, -18, 1),
        ...createLimbWaveUnits(1, UnitTypeId.Ranged, 37, 18, 1),
      ],
      message: 'Raid 2 van 4',
    },
    // Raid 3 (T=360s): 5 Infantry + 3 Ranged — main force from east
    {
      index: 2,
      spawnTime: 360,
      units: [
        ...createLimbWaveUnits(5, UnitTypeId.Infantry, LIMB_WAVE_EAST_X, LIMB_WAVE_EAST_Z, 4),
        ...createLimbWaveUnits(3, UnitTypeId.Ranged, LIMB_WAVE_EAST_X + 3, LIMB_WAVE_EAST_Z + 3, 2),
      ],
      message: 'Raid 3 van 4',
    },
    // Raid 4 (T=510s): 7 Infantry + 4 Ranged + 1 Heavy — full assault
    {
      index: 3,
      spawnTime: 510,
      units: [
        ...createLimbWaveUnits(7, UnitTypeId.Infantry, LIMB_WAVE_EAST_X, LIMB_WAVE_EAST_Z, 5),
        ...createLimbWaveUnits(4, UnitTypeId.Ranged, LIMB_WAVE_EAST_X + 4, LIMB_WAVE_EAST_Z + 4, 3),
        ...createLimbWaveUnits(1, UnitTypeId.Heavy, LIMB_WAVE_EAST_X, LIMB_WAVE_EAST_Z, 1),
      ],
      message: 'LAATSTE RAID!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 540,   // 9 min
    twoStarTime: 780,     // 13 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Limburgers Missie 4: "Verrassingsaanval" (Tunnel assault — AI production)
// ---------------------------------------------------------------------------

const LIMBURGERS_MISSION_4_VERRASSINGSAANVAL: MissionDefinition = {
  id: 'limburgers-4-verrassingsaanval',
  campaignId: 'limburgers',
  missionIndex: 3,
  playerFactionId: FactionId.Limburgers,
  aiFactionIds: [FactionId.Randstad],
  title: 'Verrassingsaanval',
  briefingTitle: 'Missie 4: Verrassingsaanval',
  briefingText:
    'De Randstad heeft een voorpost gebouwd in Venlo. Ze bewaken de bruggen en controleren ' +
    'de handelsroutes. Een frontale aanval is zelfmoord — ze hebben te veel troepen.\n\n' +
    'Maar ze vergeten een ding: Limburgers komen niet over de weg. Wij komen van onder de grond.\n\n' +
    'Bouw een tunnelnetwerk tot achter hun linies, sla toe waar ze het niet verwachten, en ' +
    'vernietig het Randstad-Hoofdkantoor voordat ze doorhebben wat er gebeurt.\n\n' +
    'De Mijnbaas: "Laat ze voelen hoe het is als de grond onder hun voeten vandaan wordt gehaald."',

  mapSize: 128,
  startingGold: 350,
  startingGoldAI: 500,

  buildings: [
    // Player: base in southwest with tunnel node
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: -45, z: -40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -37, z: -40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: -45, z: -32, complete: true },
    // Enemy: fortified base in northeast — heavy front defense, weak rear
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 40, z: 35, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 32, z: 35, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 40, z: 27, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Blacksmith, x: 35, z: 30, complete: true },
  ],

  units: [
    // Player: 5 workers + 3 infantry + 2 ranged
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -43, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -41, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -39, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -43, z: -36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -41, z: -36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -35, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -35, z: -36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -33, z: -37 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -33, z: -39 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -33, z: -35 },
    // Enemy: heavy front line (facing southwest — bridge chokepoint)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 20, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 22, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 18, z: 17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 24, z: 15 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 22, z: 17 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 20, z: 13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 21, z: 15 },
    // Enemy: light rear guard (vulnerable to tunnel attack)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 42, z: 38 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 38, z: 38 },
  ],

  goldMines: [
    { x: -35, z: -40, amount: 2500 },  // Near player
    { x: -40, z: -25, amount: 2500 },  // Southwest
    { x: 0, z: 0, amount: 3000 },      // Center — contested, risky
    { x: 35, z: 40, amount: 2000 },    // Behind enemy (reward for tunneling)
  ],

  treeResources: [
    { x: -40, z: -35, amount: 1000 },
    { x: -30, z: -25, amount: 800 },
    { x: -10, z: -10, amount: 600 },
    { x: 20, z: 20, amount: 600 },
  ],

  objectives: [
    { id: 'destroy-enemy-th', type: 'destroy-building', description: 'Vernietig het Randstad-Hoofdkantoor', targetValue: 1, isBonus: false },
    { id: 'train-10-units', type: 'train-units', description: 'Train 10 militaire eenheden', targetValue: 10, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Grottentempel niet', targetValue: 0, isBonus: true },
    { id: 'destroy-all-barracks', type: 'destroy-building', description: 'Vernietig alle vijandelijke Kazernes', targetValue: 2, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "De bruggen zijn bewaakt. Maar wie zegt dat we over bruggen moeten? Graaf tunnels. Sla toe van achteren."' }],
      once: true,
    },
    {
      id: 'tip-tunnels',
      condition: { type: 'time', seconds: 20 },
      actions: [{ type: 'message', text: 'Bouw Grotten achter de vijandelijke linies. Hun front is sterk, maar hun achterkant is onbewaakt. Dat is hun fout.' }],
      once: true,
    },
    {
      id: 'army-5',
      condition: { type: 'army-count', count: 5 },
      actions: [{ type: 'message', text: 'Je leger groeit. Gebruik tunnels om snel achter de vijand te verschijnen. Ze bewaken de bruggen — wij graven eronderdoor.' }],
      once: true,
    },
    {
      id: 'enemy-reinforcements',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'Randstad-versterkingen arriveren bij de bruggen! Hun front wordt sterker — maar de achterkant blijft kwetsbaar!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 16, z: 12 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 24, z: 18 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 20, z: 18 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 20, z: 12 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'enemy-barracks-destroyed',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks },
      actions: [{ type: 'message', text: 'Een vijandelijke Kazerne is vernietigd! Ze kunnen minder troepen trainen. Druk door!' }],
      once: true,
    },
    {
      id: 'victory-destroy',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Het Randstad-Hoofdkantoor ligt in puin! De Mijnbaas: "Venlo is van ons. Ze hadden moeten weten: de Limburger komt altijd van onderen."' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 600,   // 10 min
    twoStarTime: 900,     // 15 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Limburgers Missie 5: "De Mergelmuren" (Fortress defense — 5 waves)
// ---------------------------------------------------------------------------

const LIMB_DEFENSE_SPAWN_NE_X = 45;
const LIMB_DEFENSE_SPAWN_NE_Z = 35;
const LIMB_DEFENSE_SPAWN_NW_X = -20;
const LIMB_DEFENSE_SPAWN_NW_Z = 40;

const LIMBURGERS_MISSION_5_MERGELMUREN: MissionDefinition = {
  id: 'limburgers-5-de-mergelmuren',
  campaignId: 'limburgers',
  missionIndex: 4,
  title: 'De Mergelmuren',
  playerFactionId: FactionId.Limburgers,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 5: De Mergelmuren',
  briefingText:
    'De Randstad is woedend over Venlo. Ze sturen een invasiemacht — de grootste die ' +
    'Limburg ooit heeft gezien. Maar wij zijn voorbereid.\n\n' +
    'De Mergelmuren staan: een verdedigingslinie door de heuvels, versterkt met ' +
    'tunneluitgangen voor snelle hergroepering. Vijf golven komen eraan. ' +
    'Gebruik het terrein, gebruik de tunnels, en gebruik de Vlaai.\n\n' +
    'De Mijnbaas: "Ze denken dat ze kunnen binnenvallen? Laat ze lopen tegen ons mergel. ' +
    'Mergel breekt niet."',

  mapSize: 128,
  startingGold: 500,
  startingGoldAI: 0,

  buildings: [
    // Player: fortified position in south-center with tunnel nodes
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: 0, z: -40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: 8, z: -40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -8, z: -40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Blacksmith, x: 0, z: -48, complete: true },
    // Forward tunnel nodes (LumberCamps as tunnel exits)
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: -20, z: -20, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: 20, z: -20, complete: true },
  ],

  units: [
    // Player: 5 workers + 6 infantry + 3 ranged + 1 heavy
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -2, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 0, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 2, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -2, z: -36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 2, z: -36 },
    // Forward defenders — left flank
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -18, z: -18 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -22, z: -18 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -20, z: -16 },
    // Forward defenders — right flank
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 18, z: -18 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 22, z: -18 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 20, z: -16 },
    // Center reserve
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -2, z: -30 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 2, z: -30 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 0, z: -28 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 0, z: -32 },
  ],

  goldMines: [
    { x: -10, z: -40, amount: 3000 },  // Near base, left
    { x: 10, z: -40, amount: 3000 },   // Near base, right
    { x: 0, z: -50, amount: 2500 },    // Behind base, safe
    { x: -25, z: -30, amount: 2000 },  // Left flank, exposed
    { x: 25, z: -30, amount: 2000 },   // Right flank, exposed
  ],

  treeResources: [
    { x: -15, z: -40, amount: 1000 },
    { x: 15, z: -40, amount: 1000 },
    { x: -5, z: -45, amount: 800 },
    { x: 5, z: -45, amount: 800 },
    { x: -30, z: -25, amount: 600 },
    { x: 30, z: -25, amount: 600 },
  ],

  objectives: [
    { id: 'survive-waves', type: 'survive-waves', description: 'Overleef 5 Randstad-aanvalsgolven', targetValue: 5, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Grottentempel niet', targetValue: 0, isBonus: true },
    { id: 'have-25-units', type: 'have-units-at-end', description: 'Heb 25+ eenheden aan het einde', targetValue: 25, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Mergelmuren staan. De tunnels zijn klaar. Nu wachten we. De Mijnbaas: "Laat ze maar komen."' }],
      once: true,
    },
    {
      id: 'tip-defense',
      condition: { type: 'time', seconds: 15 },
      actions: [{ type: 'message', text: 'Gebruik de tunneluitgangen om troepen snel te hergroeperen. Train meer eenheden — de golven worden steeds groter.' }],
      once: true,
    },
    {
      id: 'wave-1-warning',
      condition: { type: 'time', seconds: 55 },
      actions: [{ type: 'message', text: 'Stof aan de horizon! De eerste golf van de Randstad-invasie nadert vanuit het noordoosten!' }],
      once: true,
    },
    {
      id: 'wave-1-spawn',
      condition: { type: 'time', seconds: 70 },
      actions: [
        { type: 'message', text: 'GOLF 1! Randstad-infanterie! Houd de Mergelmuren!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'wave-2-warning',
      condition: { type: 'time', seconds: 190 },
      actions: [{ type: 'message', text: 'De tweede golf formeert zich... ze sturen nu boogschutters mee.' }],
      once: true,
    },
    {
      id: 'wave-2-spawn',
      condition: { type: 'time', seconds: 210 },
      actions: [
        { type: 'message', text: 'GOLF 2! Gemengde troepen vanuit het noorden! Verdedig beide flanken!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'wave-3-warning',
      condition: { type: 'time', seconds: 345 },
      actions: [{ type: 'message', text: 'De grond dreunt... ze brengen zware eenheden. Gebruik je tunnels om te hergroeperen!' }],
      once: true,
    },
    {
      id: 'wave-3-spawn',
      condition: { type: 'time', seconds: 360 },
      actions: [
        { type: 'message', text: 'GOLF 3! Zware infanterie en boogschutters vanuit twee richtingen!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'wave-4-warning',
      condition: { type: 'time', seconds: 495 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Dit wordt de zwaarste tot nu toe. Iedereen op zijn positie!"' }],
      once: true,
    },
    {
      id: 'wave-4-spawn',
      condition: { type: 'time', seconds: 510 },
      actions: [
        { type: 'message', text: 'GOLF 4! Een massaal offensief! Ze willen de tunnels doorbreken!' },
        { type: 'spawn-wave', waveIndex: 3 },
      ],
      once: true,
    },
    {
      id: 'wave-5-warning',
      condition: { type: 'time', seconds: 645 },
      actions: [{ type: 'message', text: 'LAATSTE GOLF nadert! Alles wat de Randstad heeft stroomt over de heuvels! Dit is het moment van de waarheid!' }],
      once: true,
    },
    {
      id: 'wave-5-spawn',
      condition: { type: 'time', seconds: 660 },
      actions: [
        { type: 'message', text: 'LAATSTE GOLF! DE VOLLEDIGE RANDSTAD-INVASIEMACHT! HOUD STAND VOOR LIMBURG!' },
        { type: 'spawn-wave', waveIndex: 4 },
      ],
      once: true,
    },
    {
      id: 'all-waves-victory',
      condition: { type: 'all-waves-defeated' },
      actions: [
        { type: 'message', text: 'De Randstad trekt zich terug! De Mergelmuren houden stand! De Mijnbaas heft zijn houweel: "Mergel breekt niet. En wij ook niet."' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=70s): 5 Infantry from northeast — probing attack
    {
      index: 0,
      spawnTime: 70,
      units: createLimbWaveUnits(5, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NE_X, LIMB_DEFENSE_SPAWN_NE_Z, 3),
      message: 'Golf 1 van 5',
    },
    // Wave 2 (T=210s): 6 Infantry + 3 Ranged from both flanks
    {
      index: 1,
      spawnTime: 210,
      units: [
        ...createLimbWaveUnits(3, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NE_X, LIMB_DEFENSE_SPAWN_NE_Z, 3),
        ...createLimbWaveUnits(3, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NW_X, LIMB_DEFENSE_SPAWN_NW_Z, 3),
        ...createLimbWaveUnits(2, UnitTypeId.Ranged, LIMB_DEFENSE_SPAWN_NE_X + 3, LIMB_DEFENSE_SPAWN_NE_Z + 3, 2),
        ...createLimbWaveUnits(1, UnitTypeId.Ranged, LIMB_DEFENSE_SPAWN_NW_X - 3, LIMB_DEFENSE_SPAWN_NW_Z + 3, 1),
      ],
      message: 'Golf 2 van 5',
    },
    // Wave 3 (T=360s): 8 Infantry + 4 Ranged + 2 Heavy — serious assault
    {
      index: 2,
      spawnTime: 360,
      units: [
        ...createLimbWaveUnits(4, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NE_X, LIMB_DEFENSE_SPAWN_NE_Z, 4),
        ...createLimbWaveUnits(4, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NW_X, LIMB_DEFENSE_SPAWN_NW_Z, 4),
        ...createLimbWaveUnits(2, UnitTypeId.Ranged, LIMB_DEFENSE_SPAWN_NE_X + 4, LIMB_DEFENSE_SPAWN_NE_Z, 2),
        ...createLimbWaveUnits(2, UnitTypeId.Ranged, LIMB_DEFENSE_SPAWN_NW_X - 4, LIMB_DEFENSE_SPAWN_NW_Z, 2),
        ...createLimbWaveUnits(1, UnitTypeId.Heavy, LIMB_DEFENSE_SPAWN_NE_X, LIMB_DEFENSE_SPAWN_NE_Z - 2, 1),
        ...createLimbWaveUnits(1, UnitTypeId.Heavy, LIMB_DEFENSE_SPAWN_NW_X, LIMB_DEFENSE_SPAWN_NW_Z - 2, 1),
      ],
      message: 'Golf 3 van 5',
    },
    // Wave 4 (T=510s): 10 Infantry + 5 Ranged + 3 Heavy — massive push
    {
      index: 3,
      spawnTime: 510,
      units: [
        ...createLimbWaveUnits(5, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NE_X, LIMB_DEFENSE_SPAWN_NE_Z, 5),
        ...createLimbWaveUnits(5, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NW_X, LIMB_DEFENSE_SPAWN_NW_Z, 5),
        ...createLimbWaveUnits(3, UnitTypeId.Ranged, LIMB_DEFENSE_SPAWN_NE_X + 5, LIMB_DEFENSE_SPAWN_NE_Z, 3),
        ...createLimbWaveUnits(2, UnitTypeId.Ranged, LIMB_DEFENSE_SPAWN_NW_X - 5, LIMB_DEFENSE_SPAWN_NW_Z, 2),
        ...createLimbWaveUnits(2, UnitTypeId.Heavy, LIMB_DEFENSE_SPAWN_NE_X - 2, LIMB_DEFENSE_SPAWN_NE_Z - 2, 2),
        ...createLimbWaveUnits(1, UnitTypeId.Heavy, LIMB_DEFENSE_SPAWN_NW_X + 2, LIMB_DEFENSE_SPAWN_NW_Z - 2, 1),
      ],
      message: 'Golf 4 van 5',
    },
    // Wave 5 (T=660s): 12 Infantry + 6 Ranged + 4 Heavy — all-out invasion
    {
      index: 4,
      spawnTime: 660,
      units: [
        ...createLimbWaveUnits(6, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NE_X, LIMB_DEFENSE_SPAWN_NE_Z, 6),
        ...createLimbWaveUnits(6, UnitTypeId.Infantry, LIMB_DEFENSE_SPAWN_NW_X, LIMB_DEFENSE_SPAWN_NW_Z, 6),
        ...createLimbWaveUnits(3, UnitTypeId.Ranged, LIMB_DEFENSE_SPAWN_NE_X + 5, LIMB_DEFENSE_SPAWN_NE_Z + 3, 3),
        ...createLimbWaveUnits(3, UnitTypeId.Ranged, LIMB_DEFENSE_SPAWN_NW_X - 5, LIMB_DEFENSE_SPAWN_NW_Z + 3, 3),
        ...createLimbWaveUnits(2, UnitTypeId.Heavy, LIMB_DEFENSE_SPAWN_NE_X, LIMB_DEFENSE_SPAWN_NE_Z - 3, 2),
        ...createLimbWaveUnits(2, UnitTypeId.Heavy, LIMB_DEFENSE_SPAWN_NW_X, LIMB_DEFENSE_SPAWN_NW_Z - 3, 2),
      ],
      message: 'LAATSTE GOLF!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 780,   // 13 min
    twoStarTime: 1020,    // 17 min
    allBonusesGrants3Stars: true,
  },
};

// ===========================================================================
// RANDSTAD CAMPAIGN — "DE GROTE OVERNAME"
// ===========================================================================

// ---------------------------------------------------------------------------
// Helper: create wave units for Randstad campaign
// ---------------------------------------------------------------------------

const RAND_WAVE_X = 50;
const RAND_WAVE_Z = 50;

function createRandWaveUnits(
  count: number,
  type: UnitTypeId,
  baseX: number,
  baseZ: number,
  spread: number,
  faction: FactionId = FactionId.Brabanders,
): MissionUnitSpawn[] {
  const units: MissionUnitSpawn[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    units.push({
      factionId: faction,
      unitType: type,
      x: baseX + Math.cos(angle) * spread,
      z: baseZ + Math.sin(angle) * spread,
    });
  }
  return units;
}

// ---------------------------------------------------------------------------
// Randstad Missie 1: "De Eerste Vergadering" (Tutorial)
// ---------------------------------------------------------------------------

const RANDSTAD_MISSION_1_EERSTE_VERGADERING: MissionDefinition = {
  id: 'randstad-1-de-eerste-vergadering',
  campaignId: 'randstad',
  missionIndex: 0,
  title: 'De Eerste Vergadering',
  playerFactionId: FactionId.Randstad,
  aiFactionIds: [FactionId.Brabanders],
  briefingTitle: 'Missie 1: De Eerste Vergadering',
  briefingText:
    'Het is maandagochtend 07:03. De koffie is koud, de printer doet het niet, ' +
    'en de CEO heeft net een all-hands meeting ingepland over "Strategische Expansie ' +
    'naar het Zuiden".\n\n' +
    'Jij bent de pas aangestelde Regional Director voor de Zuidelijke Operaties. ' +
    'Je eerste opdracht: vestig een Hoofdkantoor, rekruteer Stagiairs, en verzamel ' +
    'genoeg PowerPoints om de kwartaalcijfers te halen.\n\n' +
    'De Board verwacht resultaten. En vergeet de Havermoutmelk niet — ' +
    'zonder die draait hier niets.',

  mapSize: 64,
  startingGold: 50,
  startingGoldAI: 0,

  buildings: [
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: -20, z: -20, complete: true },
  ],

  units: [
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -17, z: -18 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -15, z: -18 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -13, z: -18 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -17, z: -16 },
  ],

  goldMines: [
    { x: -10, z: -20, amount: 1500 },
    { x: -20, z: -10, amount: 1500 },
  ],

  treeResources: [
    { x: -15, z: -25, amount: 800 },
    { x: -25, z: -15, amount: 800 },
  ],

  objectives: [
    { id: 'r1-gather-500', type: 'gather-gold', description: 'Verzamel 500 PowerPoints', targetValue: 500, isBonus: false },
    { id: 'r1-train-3-workers', type: 'train-units', description: 'Rekruteer 3 militaire eenheden', targetValue: 3, isBonus: false },
    { id: 'r1-no-worker-loss', type: 'no-worker-loss', description: 'Verlies geen Stagiairs (nul ontslagen)', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'r1-intro',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'Welkom bij de Randstad Corporation. Stuur je Stagiairs naar de PowerPoint-bronnen. Ze worden niet betaald, maar ze doen het voor de "ervaring".' }],
      once: true,
    },
    {
      id: 'r1-tip-60s',
      condition: { type: 'time', seconds: 60 },
      actions: [{ type: 'message', text: 'Vergeet niet extra Stagiairs te produceren. Goedkope arbeidskracht is de backbone van elke multinational.' }],
      once: true,
    },
    {
      id: 'r1-intruders',
      condition: { type: 'time', seconds: 150 },
      actions: [
        { type: 'message', text: 'Brabanders gesignaleerd! Ze protesteren tegen de komst van een nieuw distributiecentrum. Stuur ze weg!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 25, z: 25 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 27, z: 23 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r1-victory',
      condition: { type: 'gold-reached', amount: 500 },
      actions: [
        { type: 'message', text: 'Kwartaaldoelstelling behaald! De Board is tevreden. Er komt zelfs een LinkedIn-post over dit succes.' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 180,  // 3 min
    twoStarTime: 300,    // 5 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Randstad Missie 2: "Het Consultancy Rapport" (Combat intro)
// ---------------------------------------------------------------------------

const RANDSTAD_MISSION_2_CONSULTANCY_RAPPORT: MissionDefinition = {
  id: 'randstad-2-het-consultancy-rapport',
  campaignId: 'randstad',
  missionIndex: 1,
  title: 'Het Consultancy Rapport',
  playerFactionId: FactionId.Randstad,
  aiFactionIds: [FactionId.Brabanders],
  briefingTitle: 'Missie 2: Het Consultancy Rapport',
  briefingText:
    'Het consultancy rapport is binnen: "De Brabantse economie is inefficient, ' +
    'ongestructureerd, en te afhankelijk van worstenbroodjes." Conclusie: vijandige overname.\n\n' +
    'De Brabanders hebben een klein buitenpost in het noordoosten. Bouw een Vergaderzaal, ' +
    'train Consultants en Managers, en vernietig hun Boerderij.\n\n' +
    'Onthoud: in de corporate wereld is aanval de beste verdediging. ' +
    'En de beste aanval is een goed opgestelde PowerPoint.',

  mapSize: 128,
  startingGold: 200,
  startingGoldAI: 100,

  buildings: [
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: -45, z: -45, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: 40, z: 40, complete: true },
  ],

  units: [
    // Player: 4 Stagiairs
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -42, z: -43 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -40, z: -43 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -38, z: -43 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -42, z: -41 },
    // Enemy: 4 Carnavalvierders guarding their TownHall
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 38, z: 38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 42, z: 38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 40, z: 42 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 40, z: 36 },
  ],

  goldMines: [
    { x: -35, z: -45, amount: 2000 },
    { x: -45, z: -35, amount: 2000 },
    { x: 0, z: 0, amount: 2500 },
    { x: 30, z: 35, amount: 1500 },
  ],

  treeResources: [
    { x: -40, z: -35, amount: 800 },
    { x: -35, z: -40, amount: 800 },
    { x: -20, z: -20, amount: 600 },
  ],

  objectives: [
    { id: 'r2-destroy-th', type: 'destroy-building', description: 'Vernietig de Brabantse Boerderij', targetValue: 1, isBonus: false },
    { id: 'r2-train-5', type: 'train-units', description: 'Train minstens 5 militaire eenheden', targetValue: 5, isBonus: true },
    { id: 'r2-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Hoofdkantoor niet', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'r2-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De Board heeft een acquisitie goedgekeurd. Bouw een Vergaderzaal om Managers en Consultants te trainen. De Brabanders in het noordoosten moeten worden "geherstructureerd".' }],
      once: true,
    },
    {
      id: 'r2-barracks-built',
      condition: { type: 'building-built', buildingType: BuildingTypeId.Barracks },
      actions: [{ type: 'message', text: 'De Vergaderzaal is operationeel! Train Managers (W) voor ranged vuurkracht of Consultants (E) voor debuffs. De vijandige overname kan beginnen.' }],
      once: true,
    },
    {
      id: 'r2-army-ready',
      condition: { type: 'army-count', count: 4 },
      actions: [{ type: 'message', text: 'Je taskforce is klaar. Selecteer je eenheden en stuur ze naar de Brabantse Boerderij in het noordoosten. Tijd voor de "reorganisatie".' }],
      once: true,
    },
    {
      id: 'r2-reinforcements',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'De Brabanders sturen versterking! Twee Carnavalvierders en een Sluiper naderen vanuit het oosten!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 50, z: 0 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 52, z: -2 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 48, z: 2 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r2-victory',
      condition: { type: 'building-destroyed', factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Acquisitie voltooid! De Brabantse Boerderij is nu eigendom van Randstad Corp. De worstenbroodjes worden vervangen door quinoa bowls.' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 420,  // 7 min
    twoStarTime: 600,    // 10 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Randstad Missie 3: "De Vijandige Overname" (Limburger mining takeover)
// ---------------------------------------------------------------------------

const RANDSTAD_MISSION_3_VIJANDIGE_OVERNAME: MissionDefinition = {
  id: 'randstad-3-de-vijandige-overname',
  campaignId: 'randstad',
  missionIndex: 2,
  title: 'De Vijandige Overname',
  playerFactionId: FactionId.Randstad,
  aiFactionIds: [FactionId.Limburgers],
  briefingTitle: 'Missie 3: De Vijandige Overname',
  briefingText:
    'Het Board of Directors heeft een nieuw target geidentificeerd: de Limburgse mijnbouw. ' +
    'Hun Vlaai-reserves zijn astronomisch, hun Mergel-voorraden onuitputtelijk. ' +
    'Helaas weigeren ze te luisteren naar ons overnamebod.\n\n' +
    'Plan B: een vijandige overname. De Limburgers hebben twee mijnbouw-operaties in het ' +
    'heuvelland. Neem beide over door hun gebouwen te vernietigen.\n\n' +
    'Let op: Limburgers zijn traag maar taai. Hun Mergelridders hebben meer pantser dan ' +
    'onze jaarcijfers bladzijden hebben. Gebruik Managers op afstand en vermijd direct ' +
    'melee-contact. Dit is geen vergadering — dit is oorlog.',

  mapSize: 128,
  startingGold: 350,
  startingGoldAI: 200,

  buildings: [
    // Player base — southwest corner
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: -59, z: -59, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -52, z: -59, complete: true },
    // Limburger mining operation 1 — center-north
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: 0, z: 34, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: 7, z: 34, complete: true },
    // Limburger mining operation 2 — east
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: 50, z: 0, complete: true },
  ],

  units: [
    // Player: 5 Stagiairs + 2 Managers
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -56, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -54, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -53, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -56, z: -55 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -54, z: -55 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -50, z: -55 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -49, z: -55 },
    // Limburger defenders — operation 1 (north)
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -2, z: 32 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 2, z: 32 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 0, z: 30 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -3, z: 35 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 3, z: 35 },
    // Limburger defenders — operation 2 (east)
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 49, z: -2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 52, z: -2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 50, z: 2 },
  ],

  goldMines: [
    { x: -50, z: -59, amount: 2000 },
    { x: -59, z: -50, amount: 2000 },
    { x: -25, z: -25, amount: 2500 },
    { x: 0, z: 42, amount: 3000 },
    { x: 50, z: 8, amount: 3000 },
  ],

  treeResources: [
    { x: -54, z: -50, amount: 1000 },
    { x: -46, z: -54, amount: 1000 },
    { x: -25, z: -34, amount: 800 },
    { x: 8, z: 25, amount: 800 },
  ],

  objectives: [
    { id: 'r3-destroy-mines', type: 'destroy-building', description: 'Vernietig beide Limburgse mijnschachten', targetValue: 2, isBonus: false, targetFactionId: FactionId.Limburgers, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'r3-gather-1000', type: 'gather-gold', description: 'Verzamel 1000 PowerPoints (marktwaarde aantonen)', targetValue: 1000, isBonus: true },
    { id: 'r3-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Hoofdkantoor niet', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'r3-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'Twee Limburgse mijnbouw-operaties gedetecteerd. De Board wil beide overnemen. Bouw je economie op en stuur taskforces naar het noorden en het oosten.' }],
      once: true,
    },
    {
      id: 'r3-tip-range',
      condition: { type: 'time', seconds: 90 },
      actions: [{ type: 'message', text: 'Tactisch advies: Limburgers zijn traag maar zwaar gepantserd. Gebruik Managers op afstand — hun bereik is ons grootste voordeel. Vermijd melee-gevechten met Mergelridders.' }],
      once: true,
    },
    {
      id: 'r3-limb-counterattack',
      condition: { type: 'time', seconds: 240 },
      actions: [
        { type: 'message', text: 'De Limburgers sturen een tegenaanval! Schutterij vanuit het noorden!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -17, z: 59 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -15, z: 60 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -18, z: 60 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -17, z: 62 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r3-limb-reinforcement',
      condition: { type: 'time', seconds: 480 },
      actions: [
        { type: 'message', text: 'Limburgse versterkingen! Ze hebben hun zwaarste eenheden gestuurd!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 59, z: -25 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 60, z: -23 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 57, z: -23 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 62, z: -25 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 59, z: -22 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r3-victory-msg',
      condition: { type: 'building-destroyed', factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall },
      actions: [{ type: 'message', text: 'Vijandige overname geslaagd! De Limburgse mijnbouw-operaties zijn nu eigendom van Randstad Corporation. De Board applaudisseert.' }],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 540,  // 9 min
    twoStarTime: 780,    // 13 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Randstad Missie 4: "Gentrificatie" (Defend and transform)
// ---------------------------------------------------------------------------

const RAND_GENTRIFY_WAVE_X = 80;
const RAND_GENTRIFY_WAVE_Z = 80;

const RANDSTAD_MISSION_4_GENTRIFICATIE: MissionDefinition = {
  id: 'randstad-4-gentrificatie',
  campaignId: 'randstad',
  missionIndex: 3,
  title: 'Gentrificatie',
  playerFactionId: FactionId.Randstad,
  aiFactionIds: [FactionId.Belgen],
  briefingTitle: 'Missie 4: Gentrificatie',
  briefingText:
    'De Belgen zijn boos. Onze vastgoedprojecten in de grensregio hebben de frietprijzen ' +
    'met 400% verhoogd. Ze noemen het "culturele genocide". Wij noemen het "marktcorrectie".\n\n' +
    'De CEO wil deze regio gentrificeren: bouw een volledig economisch centrum met ' +
    'Hoofdkantoor, Vergaderzaal en minimaal 2 extra gebouwen. Maar de Belgen zullen ' +
    'niet zomaar toekijken.\n\n' +
    'Verwacht minstens 4 golven tegenaanvallen van Belgische verzetstrijders. ' +
    'Ze vechten met frieten en fanatisme. Overleef hun aanvallen en voltooi de gentrificatie.',

  mapSize: 192,
  startingGold: 400,
  startingGoldAI: 0,

  buildings: [
    // Player base — west side
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: -60, z: -10, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -52, z: -10, complete: true },
  ],

  units: [
    // Player: 6 Stagiairs + 3 Managers + 1 Consultant
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -57, z: -8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -55, z: -8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -53, z: -8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -57, z: -6 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -55, z: -6 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -53, z: -6 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -50, z: -8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -50, z: -6 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -50, z: -4 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -48, z: -7 },
  ],

  goldMines: [
    { x: -50, z: -15, amount: 2500 },
    { x: -60, z: 0, amount: 2000 },
    { x: -40, z: -5, amount: 2000 },
    { x: -30, z: 10, amount: 3000 },
  ],

  treeResources: [
    { x: -55, z: 0, amount: 1000 },
    { x: -45, z: -15, amount: 1000 },
    { x: -35, z: 0, amount: 800 },
  ],

  objectives: [
    { id: 'r4-survive-waves', type: 'survive-waves', description: 'Overleef 4 golven Belgische tegenaanvallen', targetValue: 4, isBonus: false },
    { id: 'r4-build-3-buildings', type: 'build-building', description: 'Bouw 3 Vergaderzalen (gentrificatie)', targetValue: 3, isBonus: false, targetBuildingType: BuildingTypeId.Barracks, targetBuildingCount: 3 },
    { id: 'r4-gather-1500', type: 'gather-gold', description: 'Verzamel 1500 PowerPoints (ROI aantonen)', targetValue: 1500, isBonus: true },
    { id: 'r4-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Hoofdkantoor niet', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'r4-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De gentrificatie begint. Bouw je basis uit en bereid je voor op Belgische tegenaanvallen. De Belgen zijn snel maar breekbaar — concentreer je vuur.' }],
      once: true,
    },
    {
      id: 'r4-wave-1-warning',
      condition: { type: 'time', seconds: 75 },
      actions: [{ type: 'message', text: 'Belgische verkenners gespot! Ze dragen schorten en ruiken naar gefrituurde uien. Golf 1 nadert!' }],
      once: true,
    },
    {
      id: 'r4-wave-1-spawn',
      condition: { type: 'time', seconds: 90 },
      actions: [
        { type: 'message', text: 'GOLF 1! Belgische Bierbouwers en een Chocolatier. Ze gooien pralines!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'r4-wave-2-warning',
      condition: { type: 'time', seconds: 225 },
      actions: [{ type: 'message', text: 'Meer Belgen in aantocht. Ze scanderen "Fransen vransen, Hollansen dansen!" Dit wordt serieuzer.' }],
      once: true,
    },
    {
      id: 'r4-wave-2-spawn',
      condition: { type: 'time', seconds: 240 },
      actions: [
        { type: 'message', text: 'GOLF 2! Zeven Bierbouwers en drie Chocolatiers. Ze hebben bier mee.' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'r4-wave-3-warning',
      condition: { type: 'time', seconds: 375 },
      actions: [{ type: 'message', text: 'Een Frituurridder is gesignaleerd! De Belgen sturen hun heavy units. Bereid je voor!' }],
      once: true,
    },
    {
      id: 'r4-wave-3-spawn',
      condition: { type: 'time', seconds: 390 },
      actions: [
        { type: 'message', text: 'GOLF 3! Tien strijders, vier Chocolatiers en een Frituurridder! Ze verdedigen hun culinaire erfgoed!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'r4-wave-4-warning',
      condition: { type: 'time', seconds: 525 },
      actions: [{ type: 'message', text: 'LAATSTE GOLF nadert! De Frietkoning zelf leidt de aanval. Dit wordt het zwaarste gevecht!' }],
      once: true,
    },
    {
      id: 'r4-wave-4-spawn',
      condition: { type: 'time', seconds: 540 },
      actions: [
        { type: 'message', text: 'GOLF 4! De complete Belgische strijdmacht! Frietkoning voorop! HOUD STAND VOOR DE AANDEELHOUDERS!' },
        { type: 'spawn-wave', waveIndex: 3 },
      ],
      once: true,
    },
    {
      id: 'r4-all-waves-defeated',
      condition: { type: 'all-waves-defeated' },
      actions: [
        { type: 'message', text: 'Alle golven afgeslagen! De gentrificatie is een succes. De frietkramen worden vervangen door avocadotoast-bars.' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=90s): 4 Infantry + 2 Ranged
    {
      index: 0,
      spawnTime: 90,
      units: [
        ...createRandWaveUnits(4, UnitTypeId.Infantry, RAND_GENTRIFY_WAVE_X, RAND_GENTRIFY_WAVE_Z, 3, FactionId.Belgen),
        ...createRandWaveUnits(2, UnitTypeId.Ranged, RAND_GENTRIFY_WAVE_X + 3, RAND_GENTRIFY_WAVE_Z + 3, 2, FactionId.Belgen),
      ],
      message: 'Golf 1 van 4',
    },
    // Wave 2 (T=240s): 7 Infantry + 3 Ranged
    {
      index: 1,
      spawnTime: 240,
      units: [
        ...createRandWaveUnits(7, UnitTypeId.Infantry, RAND_GENTRIFY_WAVE_X, RAND_GENTRIFY_WAVE_Z, 4, FactionId.Belgen),
        ...createRandWaveUnits(3, UnitTypeId.Ranged, RAND_GENTRIFY_WAVE_X + 4, RAND_GENTRIFY_WAVE_Z + 4, 3, FactionId.Belgen),
      ],
      message: 'Golf 2 van 4',
    },
    // Wave 3 (T=390s): 10 Infantry + 4 Ranged + 1 Heavy
    {
      index: 2,
      spawnTime: 390,
      units: [
        ...createRandWaveUnits(10, UnitTypeId.Infantry, RAND_GENTRIFY_WAVE_X, RAND_GENTRIFY_WAVE_Z, 5, FactionId.Belgen),
        ...createRandWaveUnits(4, UnitTypeId.Ranged, RAND_GENTRIFY_WAVE_X + 5, RAND_GENTRIFY_WAVE_Z + 5, 3, FactionId.Belgen),
        { factionId: FactionId.Belgen, unitType: UnitTypeId.Heavy, x: RAND_GENTRIFY_WAVE_X, z: RAND_GENTRIFY_WAVE_Z },
      ],
      message: 'Golf 3 van 4',
    },
    // Wave 4 (T=540s): 12 Infantry + 5 Ranged + 2 Heavy
    {
      index: 3,
      spawnTime: 540,
      units: [
        ...createRandWaveUnits(12, UnitTypeId.Infantry, RAND_GENTRIFY_WAVE_X, RAND_GENTRIFY_WAVE_Z, 6, FactionId.Belgen),
        ...createRandWaveUnits(5, UnitTypeId.Ranged, RAND_GENTRIFY_WAVE_X + 6, RAND_GENTRIFY_WAVE_Z + 6, 4, FactionId.Belgen),
        { factionId: FactionId.Belgen, unitType: UnitTypeId.Heavy, x: RAND_GENTRIFY_WAVE_X - 2, z: RAND_GENTRIFY_WAVE_Z },
        { factionId: FactionId.Belgen, unitType: UnitTypeId.Heavy, x: RAND_GENTRIFY_WAVE_X + 2, z: RAND_GENTRIFY_WAVE_Z },
      ],
      message: 'LAATSTE GOLF!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 540,  // 9 min
    twoStarTime: 780,    // 13 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Randstad Missie 5: "De Boardroom Beslissing" (Epic finale vs all 3 factions)
// ---------------------------------------------------------------------------

const RANDSTAD_MISSION_5_BOARDROOM_BESLISSING: MissionDefinition = {
  id: 'randstad-5-de-boardroom-beslissing',
  campaignId: 'randstad',
  missionIndex: 4,
  title: 'De Boardroom Beslissing',
  playerFactionId: FactionId.Randstad,
  aiFactionIds: [FactionId.Brabanders, FactionId.Limburgers, FactionId.Belgen],
  briefingTitle: 'Missie 5: De Boardroom Beslissing',
  briefingText:
    'Dit is het. De ultieme boardroom meeting. De CEO heeft besloten: volledige dominantie ' +
    'over de Lage Landen. Brabanders, Limburgers en Belgen — allemaal moeten ze buigen ' +
    'voor de corporate machine.\n\n' +
    'De drie facties hebben een ongemakkelijke alliantie gesloten tegen ons. Brabanders in ' +
    'het zuidoosten, Limburgers in het noordoosten, en Belgen in het noordwesten. ' +
    'Ze zijn het over niets eens, behalve dat ze ons haten.\n\n' +
    'Bouw een onneembaar corporate imperium, train het ultieme leger, en vernietig alle ' +
    'drie de vijandelijke hoofdkwartieren. De aandeelhouders verwachten niets minder dan ' +
    'totale overwinning.\n\n' +
    'Dit wordt de langste vergadering ooit. Maar aan het einde tekent iedereen.',

  mapSize: 128,
  startingGold: 600,
  startingGoldAI: 400,

  buildings: [
    // Player base — south-center
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 0, z: -59, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 5, z: -59, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -5, z: -59, complete: true },
    // Brabanders base — southeast
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: 52, z: -39, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 57, z: -39, complete: true },
    // Limburgers base — northeast
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: 52, z: 39, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: 57, z: 39, complete: true },
    // Belgen base — northwest
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: -52, z: 39, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: -57, z: 39, complete: true },
  ],

  units: [
    // Player: 8 Stagiairs + 4 Managers + 2 Consultants
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -2, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -1, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 1, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 2, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -2, z: -56 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -1, z: -56 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 1, z: -56 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 2, z: -56 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 7, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 8, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -7, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -8, z: -57 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 7, z: -56 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -7, z: -56 },
    // Brabanders defenders (southeast) — 6 units
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 51, z: -38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 54, z: -38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 52, z: -37 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 51, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 54, z: -40 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: 52, z: -42 },
    // Limburgers defenders (northeast) — 6 units
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 51, z: 38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 54, z: 38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 52, z: 37 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 52, z: 42 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 51, z: 40 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 54, z: 40 },
    // Belgen defenders (northwest) — 5 units
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -51, z: 38 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -54, z: 38 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -52, z: 37 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -51, z: 40 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -54, z: 40 },
  ],

  goldMines: [
    // Player area
    { x: -7, z: -62, amount: 3000 },
    { x: 7, z: -62, amount: 3000 },
    { x: 0, z: -49, amount: 2500 },
    // Center contested
    { x: 0, z: 0, amount: 4000 },
    { x: -20, z: -20, amount: 2500 },
    { x: 20, z: -20, amount: 2500 },
    // Near enemies
    { x: 46, z: -36, amount: 2000 },
    { x: 46, z: 36, amount: 2000 },
    { x: -46, z: 36, amount: 2000 },
  ],

  treeResources: [
    { x: -10, z: -55, amount: 1200 },
    { x: 10, z: -55, amount: 1200 },
    { x: -13, z: -46, amount: 1000 },
    { x: 13, z: -46, amount: 1000 },
    { x: 0, z: -33, amount: 800 },
    { x: -26, z: 0, amount: 800 },
    { x: 26, z: 0, amount: 800 },
  ],

  objectives: [
    { id: 'r5-destroy-brab', type: 'destroy-building', description: 'Vernietig het Brabantse Hoofdkwartier (zuidoost)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Brabanders, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'r5-destroy-limb', type: 'destroy-building', description: 'Vernietig het Limburgse Hoofdkwartier (noordoost)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Limburgers, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'r5-destroy-belg', type: 'destroy-building', description: 'Vernietig het Belgische Hoofdkwartier (noordwest)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Belgen, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'r5-have-30-units', type: 'have-units-at-end', description: 'Heb 30+ eenheden aan het einde (marktdominantie)', targetValue: 30, isBonus: true },
    { id: 'r5-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Hoofdkantoor niet', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'r5-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De finale. Drie vijanden, drie hoofdkwartieren, een corporate imperium. Bouw snel op, train je leger, en sla toe voordat ze zich coordineren.' }],
      once: true,
    },
    {
      id: 'r5-strategy-tip',
      condition: { type: 'time', seconds: 60 },
      actions: [{ type: 'message', text: 'Strategisch advies: de drie facties zijn kwetsbaar als je ze een voor een aanpakt. De Belgen (noordwest) zijn het zwakst — begin daar. De Limburgers (noordoost) zijn het sterkst in verdediging.' }],
      once: true,
    },
    {
      id: 'r5-brab-raid',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'De Brabanders sturen een verkenningsgroep! Carnavalvierders vanuit het zuidoosten!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 39, z: -26 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 38, z: -25 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 40, z: -25 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 39, z: -23 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r5-belg-raid',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'De Belgen openen een tweede front! Bierbouwers en Chocolatiers naderen vanuit het noordwesten!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -39, z: 26 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -38, z: 25 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -40, z: 25 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -38, z: 27 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -40, z: 27 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r5-limb-raid',
      condition: { type: 'time', seconds: 420 },
      actions: [
        { type: 'message', text: 'De Limburgers sturen hun Mergelridders! Zwaar pantser vanuit het noordoosten! Gebruik ranged eenheden!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 39, z: 26 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 38, z: 27 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 37, z: 25 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 40, z: 25 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 39, z: 29 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r5-combined-assault',
      condition: { type: 'time', seconds: 600 },
      actions: [
        { type: 'message', text: 'GECOMBINEERDE AANVAL! Alle drie de facties slaan tegelijk toe! Dit is hun laatste wanhopige poging!' },
        {
          type: 'spawn-units',
          units: [
            // Brabanders van het zuiden
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 26, z: -46 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 27, z: -44 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 25, z: -44 },
            // Belgen van het westen
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -26, z: -13 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -25, z: -12 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -27, z: -12 },
            // Limburgers van het noorden
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 0, z: 33 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -1, z: 31 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 1, z: 31 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r5-victory-msg',
      condition: { type: 'building-destroyed', factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall },
      actions: [{ type: 'message', text: 'De boardroom is van jou! Alle drie de concurrenten zijn uitgeschakeld. De CEO: "Noem het een feestje. Noem het een fusie. Noem het hoe je wilt."' }],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 720,   // 12 min
    twoStarTime: 1080,    // 18 min
    allBonusesGrants3Stars: true,
  },
};

// ===========================================================================
// LIMBURGERS CAMPAIGN — Missions 6-8
// ===========================================================================

// ---------------------------------------------------------------------------
// Limburgers Missie 6: "Tunneloorlog" (Commando tunnel raids)
// ---------------------------------------------------------------------------

const LIMBURGERS_MISSION_6_TUNNELOORLOG: MissionDefinition = {
  id: 'limburgers-6-tunneloorlog',
  campaignId: 'limburgers',
  missionIndex: 5,
  title: 'Tunneloorlog',
  playerFactionId: FactionId.Limburgers,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 6: Tunneloorlog',
  briefingText:
    'De Randstad heeft twee vooruitgeschoven commandoposten gebouwd in ons heuvelland. ' +
    'Ze bewaken elke weg, elke brug, elke oversteekplaats. Boven de grond zijn ze onoverwinnelijk.\n\n' +
    'Maar dit is Limburg. En in Limburg gaat alles ondergronds.\n\n' +
    'Bouw een tunnelnetwerk tot achter hun verdedigingslinies. Sla toe waar ze het niet verwachten. ' +
    'Vernietig beide commandoposten en laat de Randstad zien dat je in het Heuvelland nooit ' +
    'veilig bent — zelfs niet achter muren.\n\n' +
    'De Mijnbaas: "Ze kijken naar de heuvels. Maar het gevaar komt van onder de heuvels."',

  mapSize: 96,
  startingGold: 300,
  startingGoldAI: 400,

  buildings: [
    // Player: base in southwest with tunnel node
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: -35, z: -35, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -28, z: -35, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: -35, z: -28, complete: true },
    // Enemy commandopost 1 — northeast, fortified front
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 30, z: 25, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.DefenseTower, x: 25, z: 20, complete: true },
    // Enemy commandopost 2 — east, fortified front
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 35, z: -10, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.DefenseTower, x: 30, z: -15, complete: true },
  ],

  units: [
    // Player: 4 workers + 4 infantry + 2 ranged
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -33, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -31, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -33, z: -31 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -31, z: -31 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -26, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -26, z: -31 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -24, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -24, z: -31 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -22, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -22, z: -31 },
    // Enemy: commandopost 1 defenders (northeast) — strong front, weak rear
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 22, z: 18 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 24, z: 20 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 20, z: 22 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 22, z: 22 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 23, z: 19 },
    // one lonely guard behind
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 33, z: 28 },
    // Enemy: commandopost 2 defenders (east) — strong front, weak rear
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 28, z: -13 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 30, z: -11 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 27, z: -10 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 32, z: -13 },
    // one lonely guard behind
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 38, z: -8 },
  ],

  goldMines: [
    { x: -30, z: -40, amount: 2000 },  // Near player
    { x: -40, z: -25, amount: 2000 },  // Player side
    { x: 0, z: 0, amount: 2500 },      // Center, contested
    { x: 35, z: 30, amount: 1500 },    // Behind enemy post 1
  ],

  treeResources: [
    { x: -30, z: -25, amount: 800 },
    { x: -25, z: -30, amount: 800 },
    { x: 0, z: -15, amount: 600 },
    { x: 15, z: 10, amount: 600 },
  ],

  objectives: [
    { id: 'l6-destroy-posts', type: 'destroy-building', description: 'Vernietig beide commandoposten', targetValue: 2, isBonus: false, targetFactionId: FactionId.Randstad, targetBuildingType: BuildingTypeId.Barracks },
    { id: 'l6-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Grottentempel niet', targetValue: 0, isBonus: true },
    { id: 'l6-have-15-units', type: 'have-units-at-end', description: 'Heb 15+ eenheden aan het einde', targetValue: 15, isBonus: true },
  ],

  triggers: [
    {
      id: 'l6-intro',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Twee commandoposten. Beide zwaar bewaakt aan de voorkant. Maar de achterkant? Onbeschermd. Tijd voor de Limburgse specialiteit: graaf eronderdoor."' }],
      once: true,
    },
    {
      id: 'l6-tunnel-tip',
      condition: { type: 'time', seconds: 20 },
      actions: [{ type: 'message', text: 'Bouw Mijnschachten achter de vijandelijke commandoposten. Stuur je troepen door de tunnels en sla toe van achteren — daar verwachten ze je niet.' }],
      once: true,
    },
    {
      id: 'l6-first-tunnel',
      condition: { type: 'building-count', buildingType: BuildingTypeId.TertiaryResourceBuilding, count: 1 },
      actions: [{ type: 'message', text: 'De eerste tunneluitgang is klaar! Bouw er nog een achter een commandopost. De verrassingsaanval wacht op het juiste moment.' }],
      once: true,
    },
    {
      id: 'l6-army-ready',
      condition: { type: 'army-count', count: 8 },
      actions: [{ type: 'message', text: 'Je raidsquad is groot genoeg. Stuur ze door de tunnels. Vergeet niet: de verrassingsbonus geeft +25% schade direct na het tunnelen!' }],
      once: true,
    },
    {
      id: 'l6-reinforcements',
      condition: { type: 'time', seconds: 360 },
      actions: [
        { type: 'message', text: 'Randstad-versterkingen arriveren bij de commandoposten! Snelheid is nu essentieel!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 28, z: 28 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 32, z: 27 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 38, z: -12 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 36, z: -6 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'l6-post-destroyed',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks },
      actions: [{ type: 'message', text: 'Een commandopost vernietigd! De Mijnbaas: "Eentje minder. Ze hadden de kelder moeten checken." Vernietig de tweede post!' }],
      once: true,
    },
    {
      id: 'l6-late-assault',
      condition: { type: 'time', seconds: 540 },
      actions: [
        { type: 'message', text: 'De Randstad stuurt een wraakexpeditie naar je basis! Verdedig de Grottentempel!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 45, z: -40 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 43, z: -38 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 44, z: -42 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 46, z: -38 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 45, z: -39 },
          ],
        },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 480,   // 8 min
    twoStarTime: 720,     // 12 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Limburgers Missie 7: "De Grote Sjtoelgang" (Full defense + counter-attack)
// ---------------------------------------------------------------------------

const LIMB_SJTOELGANG_SPAWN_N_X = 0;
const LIMB_SJTOELGANG_SPAWN_N_Z = 60;
const LIMB_SJTOELGANG_SPAWN_E_X = 55;
const LIMB_SJTOELGANG_SPAWN_E_Z = 0;

const LIMBURGERS_MISSION_7_GROTE_SJTOELGANG: MissionDefinition = {
  id: 'limburgers-7-de-grote-sjtoelgang',
  campaignId: 'limburgers',
  missionIndex: 6,
  title: 'De Grote Sjtoelgang',
  playerFactionId: FactionId.Limburgers,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 7: De Grote Sjtoelgang',
  briefingText:
    'De Randstad CEO is woedend. "Die mijnwormen hebben onze commandoposten vernietigd!" ' +
    'Ze stuurt haar volledige invasiemacht naar het Limburgse mijncomplex.\n\n' +
    'Dit is het moment waar we voor hebben gegraven. Het mijncomplex is het hart van ' +
    'Limburg — als dat valt, valt alles. Alle gebouwtypen zijn beschikbaar. Bouw torens, ' +
    'train Mergelridders, versterk de tunnels.\n\n' +
    'Overleef 6 golven. En als de Randstad uitgeput is... dan slaan we terug.\n\n' +
    'De Mijnbaas heft zijn houweel: "Sjtoelgang! De grote storm! Laat ze maar komen. ' +
    'In Limburg overleven we alles — zelfs de Randstad."',

  mapSize: 128,
  startingGold: 600,
  startingGoldAI: 0,

  buildings: [
    // Player: fortified mining complex in south
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: 0, z: -45, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: 8, z: -45, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -8, z: -45, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Blacksmith, x: 0, z: -53, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: -15, z: -35, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: 15, z: -35, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TertiaryResourceBuilding, x: -10, z: -50, complete: true },
    // Enemy: forward operating base in the north for counter-attack target
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 0, z: 55, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 8, z: 55, complete: true },
  ],

  units: [
    // Player: 6 workers + 6 infantry + 4 ranged + 2 heavy
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -3, z: -43 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -1, z: -43 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 1, z: -43 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 3, z: -43 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -2, z: -41 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 2, z: -41 },
    // Left flank defenders
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -13, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -17, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -15, z: -31 },
    // Right flank defenders
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 13, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 17, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 15, z: -31 },
    // Center reserve
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -2, z: -35 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 2, z: -35 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -1, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 1, z: -33 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -1, z: -37 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 1, z: -37 },
    // Enemy base defenders (north)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -2, z: 53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 2, z: 53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 0, z: 51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 0, z: 57 },
  ],

  goldMines: [
    { x: -10, z: -45, amount: 3000 },   // Near base, left
    { x: 10, z: -45, amount: 3000 },    // Near base, right
    { x: 0, z: -55, amount: 2500 },     // Behind base, safe
    { x: -25, z: -35, amount: 2000 },   // Left flank, exposed
    { x: 25, z: -35, amount: 2000 },    // Right flank, exposed
    { x: 0, z: 0, amount: 3000 },       // No man's land
  ],

  treeResources: [
    { x: -18, z: -45, amount: 1200 },
    { x: 18, z: -45, amount: 1200 },
    { x: -5, z: -50, amount: 1000 },
    { x: 5, z: -50, amount: 1000 },
    { x: -30, z: -30, amount: 800 },
    { x: 30, z: -30, amount: 800 },
  ],

  objectives: [
    { id: 'l7-survive-waves', type: 'survive-waves', description: 'Overleef 6 golven Randstad-invasie', targetValue: 6, isBonus: false },
    { id: 'l7-destroy-enemy-th', type: 'destroy-building', description: 'Vernietig de Randstad-operatiebasis (tegenaanval)', targetValue: 1, isBonus: false },
    { id: 'l7-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Grottentempel niet', targetValue: 0, isBonus: true },
    { id: 'l7-have-30-units', type: 'have-units-at-end', description: 'Heb 30+ eenheden aan het einde', targetValue: 30, isBonus: true },
  ],

  triggers: [
    {
      id: 'l7-intro',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Ze komen met alles. Zes golven. Maar na de storm... slaan wij terug. Maak je klaar."' }],
      once: true,
    },
    {
      id: 'l7-defense-tip',
      condition: { type: 'time', seconds: 15 },
      actions: [{ type: 'message', text: 'Bouw Verdedigingstorens en train continu troepen. Gebruik de tunnels om troepen snel te hergroeperen tussen de flanken. Na golf 6 moet je genoeg kracht overhouden voor de tegenaanval.' }],
      once: true,
    },
    {
      id: 'l7-wave-1-warning',
      condition: { type: 'time', seconds: 55 },
      actions: [{ type: 'message', text: 'Stofwolken aan de horizon! De eerste golf nadert vanuit het noorden!' }],
      once: true,
    },
    {
      id: 'l7-wave-1-spawn',
      condition: { type: 'time', seconds: 70 },
      actions: [
        { type: 'message', text: 'GOLF 1! Randstad-verkenners! Licht vuur!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'l7-wave-2-warning',
      condition: { type: 'time', seconds: 175 },
      actions: [{ type: 'message', text: 'Golf 2 formeert zich. Ze sturen boogschutters mee deze keer.' }],
      once: true,
    },
    {
      id: 'l7-wave-2-spawn',
      condition: { type: 'time', seconds: 190 },
      actions: [
        { type: 'message', text: 'GOLF 2! Gemengde troepen vanuit twee richtingen!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'l7-wave-3-warning',
      condition: { type: 'time', seconds: 305 },
      actions: [{ type: 'message', text: 'De grond dreunt. Zware eenheden in aantocht. Hergroepeer via de tunnels!' }],
      once: true,
    },
    {
      id: 'l7-wave-3-spawn',
      condition: { type: 'time', seconds: 320 },
      actions: [
        { type: 'message', text: 'GOLF 3! Zware infanterie! De Randstad stuurt hun beste eenheden!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'l7-wave-4-warning',
      condition: { type: 'time', seconds: 445 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Halverwege! Drie golven achter de rug, drie te gaan. Houd vol!"' }],
      once: true,
    },
    {
      id: 'l7-wave-4-spawn',
      condition: { type: 'time', seconds: 460 },
      actions: [
        { type: 'message', text: 'GOLF 4! Een massaal offensief van twee kanten!' },
        { type: 'spawn-wave', waveIndex: 3 },
      ],
      once: true,
    },
    {
      id: 'l7-wave-5-warning',
      condition: { type: 'time', seconds: 595 },
      actions: [{ type: 'message', text: 'Golf 5! De Randstad gooit er belegeringswapens tegenaan! Verdedig de gebouwen!' }],
      once: true,
    },
    {
      id: 'l7-wave-5-spawn',
      condition: { type: 'time', seconds: 610 },
      actions: [
        { type: 'message', text: 'GOLF 5! Belegeringstroepen en zware eenheden! HOUD DE MIJN!' },
        { type: 'spawn-wave', waveIndex: 4 },
      ],
      once: true,
    },
    {
      id: 'l7-wave-6-warning',
      condition: { type: 'time', seconds: 745 },
      actions: [{ type: 'message', text: 'LAATSTE GOLF! Alles wat de Randstad heeft komt deze kant op! Dit is het moment van de waarheid!' }],
      once: true,
    },
    {
      id: 'l7-wave-6-spawn',
      condition: { type: 'time', seconds: 760 },
      actions: [
        { type: 'message', text: 'GOLF 6! DE VOLLEDIGE RANDSTAD-INVASIEMACHT! HOUD STAND VOOR LIMBURG!' },
        { type: 'spawn-wave', waveIndex: 5 },
      ],
      once: true,
    },
    {
      id: 'l7-all-waves-survived',
      condition: { type: 'all-waves-defeated' },
      actions: [
        { type: 'message', text: 'Alle golven overleefd! De Mijnbaas: "Nu is het ONZE beurt. Vernietig hun operatiebasis in het noorden! TEGENAANVAL!"' },
      ],
      once: true,
    },
    {
      id: 'l7-victory-destroy',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'De Randstad-operatiebasis is vernietigd! De Mijnbaas: "De Sjtoelgang is voorbij. Ze kwamen als een storm. Ze gingen als stof. Limburg staat."' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=70s): 5 Infantry from north
    {
      index: 0,
      spawnTime: 70,
      units: createLimbWaveUnits(5, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z, 3),
      message: 'Golf 1 van 6',
    },
    // Wave 2 (T=190s): 6 Infantry + 3 Ranged from north and east
    {
      index: 1,
      spawnTime: 190,
      units: [
        ...createLimbWaveUnits(3, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z, 3),
        ...createLimbWaveUnits(3, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_E_X, LIMB_SJTOELGANG_SPAWN_E_Z, 3),
        ...createLimbWaveUnits(2, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_N_X + 3, LIMB_SJTOELGANG_SPAWN_N_Z, 2),
        ...createLimbWaveUnits(1, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_E_X, LIMB_SJTOELGANG_SPAWN_E_Z + 3, 1),
      ],
      message: 'Golf 2 van 6',
    },
    // Wave 3 (T=320s): 8 Infantry + 4 Ranged + 2 Heavy
    {
      index: 2,
      spawnTime: 320,
      units: [
        ...createLimbWaveUnits(4, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z, 4),
        ...createLimbWaveUnits(4, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_E_X, LIMB_SJTOELGANG_SPAWN_E_Z, 4),
        ...createLimbWaveUnits(2, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_N_X + 4, LIMB_SJTOELGANG_SPAWN_N_Z, 2),
        ...createLimbWaveUnits(2, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_E_X, LIMB_SJTOELGANG_SPAWN_E_Z + 4, 2),
        ...createLimbWaveUnits(1, UnitTypeId.Heavy, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z - 2, 1),
        ...createLimbWaveUnits(1, UnitTypeId.Heavy, LIMB_SJTOELGANG_SPAWN_E_X - 2, LIMB_SJTOELGANG_SPAWN_E_Z, 1),
      ],
      message: 'Golf 3 van 6',
    },
    // Wave 4 (T=460s): 10 Infantry + 5 Ranged + 3 Heavy — massive push
    {
      index: 3,
      spawnTime: 460,
      units: [
        ...createLimbWaveUnits(5, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z, 5),
        ...createLimbWaveUnits(5, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_E_X, LIMB_SJTOELGANG_SPAWN_E_Z, 5),
        ...createLimbWaveUnits(3, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_N_X + 5, LIMB_SJTOELGANG_SPAWN_N_Z, 3),
        ...createLimbWaveUnits(2, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_E_X, LIMB_SJTOELGANG_SPAWN_E_Z + 5, 2),
        ...createLimbWaveUnits(2, UnitTypeId.Heavy, LIMB_SJTOELGANG_SPAWN_N_X - 2, LIMB_SJTOELGANG_SPAWN_N_Z - 2, 2),
        ...createLimbWaveUnits(1, UnitTypeId.Heavy, LIMB_SJTOELGANG_SPAWN_E_X - 3, LIMB_SJTOELGANG_SPAWN_E_Z - 2, 1),
      ],
      message: 'Golf 4 van 6',
    },
    // Wave 5 (T=610s): 12 Infantry + 6 Ranged + 3 Heavy + 1 Siege
    {
      index: 4,
      spawnTime: 610,
      units: [
        ...createLimbWaveUnits(6, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z, 6),
        ...createLimbWaveUnits(6, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_E_X, LIMB_SJTOELGANG_SPAWN_E_Z, 6),
        ...createLimbWaveUnits(3, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_N_X + 6, LIMB_SJTOELGANG_SPAWN_N_Z + 3, 3),
        ...createLimbWaveUnits(3, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_E_X + 3, LIMB_SJTOELGANG_SPAWN_E_Z + 6, 3),
        ...createLimbWaveUnits(2, UnitTypeId.Heavy, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z - 3, 2),
        ...createLimbWaveUnits(1, UnitTypeId.Heavy, LIMB_SJTOELGANG_SPAWN_E_X - 3, LIMB_SJTOELGANG_SPAWN_E_Z, 1),
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Siege, x: LIMB_SJTOELGANG_SPAWN_N_X, z: LIMB_SJTOELGANG_SPAWN_N_Z + 2 },
      ],
      message: 'Golf 5 van 6',
    },
    // Wave 6 (T=760s): 15 Infantry + 8 Ranged + 4 Heavy + 2 Siege — all-out invasion
    {
      index: 5,
      spawnTime: 760,
      units: [
        ...createLimbWaveUnits(8, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z, 7),
        ...createLimbWaveUnits(7, UnitTypeId.Infantry, LIMB_SJTOELGANG_SPAWN_E_X, LIMB_SJTOELGANG_SPAWN_E_Z, 7),
        ...createLimbWaveUnits(4, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_N_X + 7, LIMB_SJTOELGANG_SPAWN_N_Z + 4, 4),
        ...createLimbWaveUnits(4, UnitTypeId.Ranged, LIMB_SJTOELGANG_SPAWN_E_X + 4, LIMB_SJTOELGANG_SPAWN_E_Z + 7, 4),
        ...createLimbWaveUnits(2, UnitTypeId.Heavy, LIMB_SJTOELGANG_SPAWN_N_X, LIMB_SJTOELGANG_SPAWN_N_Z - 4, 2),
        ...createLimbWaveUnits(2, UnitTypeId.Heavy, LIMB_SJTOELGANG_SPAWN_E_X - 4, LIMB_SJTOELGANG_SPAWN_E_Z, 2),
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Siege, x: LIMB_SJTOELGANG_SPAWN_N_X - 2, z: LIMB_SJTOELGANG_SPAWN_N_Z + 2 },
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Siege, x: LIMB_SJTOELGANG_SPAWN_E_X + 2, z: LIMB_SJTOELGANG_SPAWN_E_Z - 2 },
      ],
      message: 'LAATSTE GOLF!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 900,    // 15 min
    twoStarTime: 1200,     // 20 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Limburgers Missie 8: "Koningin van de Mijn" (Epic finale — multi-front)
// ---------------------------------------------------------------------------

const LIMBURGERS_MISSION_8_KONINGIN_VAN_DE_MIJN: MissionDefinition = {
  id: 'limburgers-8-koningin-van-de-mijn',
  campaignId: 'limburgers',
  missionIndex: 7,
  title: 'Koningin van de Mijn',
  playerFactionId: FactionId.Limburgers,
  aiFactionIds: [FactionId.Brabanders, FactionId.Randstad],
  briefingTitle: 'Missie 8: Koningin van de Mijn',
  briefingText:
    'Dit is het. De finale. Brabanders en Randstad hebben een ongemakkelijke alliantie gesloten. ' +
    'Ze vallen aan vanuit het westen en het oosten. Twee legers, twee fronten, een doel: het Limburgse ' +
    'tunnelnetwerk vernietigen.\n\n' +
    'Maar Limburg geeft niet op. We hebben de diepste tunnels, de sterkste muren, en de beste Vlaai ' +
    'van het land. Dit is het moment om te bewijzen dat de Koningin van de Mijn regeert.\n\n' +
    'Vernietig beide vijandelijke Hoofdkwartieren. Laat de Lage Landen zien wie de echte macht ' +
    'onder de grond is.\n\n' +
    'De Mijnbaas fluistert met trillende stem: "Dit is mijn mijn. Mijn heuvels. Mijn volk. ' +
    'Ze nemen ons niets af. NIETS."',

  mapSize: 128,
  startingGold: 700,
  startingGoldAI: 500,

  buildings: [
    // Player: full base in center-south
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: 0, z: -45, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: 8, z: -45, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -8, z: -45, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Blacksmith, x: 0, z: -53, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: -15, z: -40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.LumberCamp, x: 15, z: -40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TertiaryResourceBuilding, x: -10, z: -50, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.SiegeWorkshop, x: 10, z: -50, complete: true },
    // Brabanders base — west
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -55, z: 10, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -48, z: 10, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -55, z: 17, complete: true },
    // Randstad base — east
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 55, z: 10, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 48, z: 10, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 55, z: 17, complete: true },
  ],

  units: [
    // Player: 7 workers + 6 infantry + 4 ranged + 3 heavy
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -3, z: -43 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -1, z: -43 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 1, z: -43 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 3, z: -43 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: -2, z: -41 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 0, z: -41 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 2, z: -41 },
    // Left flank (facing Brabanders)
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -13, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -17, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -15, z: -36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -15, z: -34 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -13, z: -34 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -15, z: -40 },
    // Right flank (facing Randstad)
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 13, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 17, z: -38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 15, z: -36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 15, z: -34 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 13, z: -34 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 15, z: -40 },
    // Center reserve
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 0, z: -37 },
    // Brabanders defenders (west)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -53, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -50, z: 8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -53, z: 12 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -50, z: 12 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -52, z: 14 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -56, z: 14 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: -52, z: 6 },
    // Randstad defenders (east)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 53, z: 8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 50, z: 8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 53, z: 12 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 50, z: 12 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 52, z: 14 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 56, z: 14 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 52, z: 6 },
  ],

  goldMines: [
    // Player area
    { x: -10, z: -50, amount: 3500 },
    { x: 10, z: -50, amount: 3500 },
    { x: 0, z: -55, amount: 3000 },
    // Contested center
    { x: -20, z: -20, amount: 2500 },
    { x: 20, z: -20, amount: 2500 },
    { x: 0, z: 0, amount: 4000 },
    // Near enemies
    { x: -50, z: 15, amount: 2000 },
    { x: 50, z: 15, amount: 2000 },
  ],

  treeResources: [
    { x: -20, z: -45, amount: 1200 },
    { x: 20, z: -45, amount: 1200 },
    { x: -5, z: -48, amount: 1000 },
    { x: 5, z: -48, amount: 1000 },
    { x: -30, z: -30, amount: 800 },
    { x: 30, z: -30, amount: 800 },
    { x: 0, z: -10, amount: 800 },
  ],

  objectives: [
    { id: 'l8-destroy-brab-th', type: 'destroy-building', description: 'Vernietig de Brabanders Boerderij (west)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Brabanders, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'l8-destroy-rand-th', type: 'destroy-building', description: 'Vernietig het Randstad Hoofdkantoor (oost)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Randstad, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'l8-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Grottentempel niet', targetValue: 0, isBonus: true },
    { id: 'l8-have-35-units', type: 'have-units-at-end', description: 'Heb 35+ eenheden aan het einde (mijnimperium)', targetValue: 35, isBonus: true },
  ],

  triggers: [
    {
      id: 'l8-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De Mijnbaas: "Twee vijanden. Twee fronten. Maar dit is ONS land. Brabanders van het westen, Randstad van het oosten. Vernietig hen beide."' }],
      once: true,
    },
    {
      id: 'l8-strategy-tip',
      condition: { type: 'time', seconds: 30 },
      actions: [{ type: 'message', text: 'Strategisch advies: de Brabanders zijn sterk in melee maar langzaam. De Randstad is snel maar breekbaar. Pak de Randstad eerst aan met tunnelraids, dan de Brabanders met een vol leger.' }],
      once: true,
    },
    {
      id: 'l8-brab-raid',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'Brabantse Carnavalvierders naderen van het westen! Ze schreeuwen over worstenbroodjes!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -40, z: -10 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -38, z: -8 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -42, z: -8 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -40, z: -6 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'l8-rand-raid',
      condition: { type: 'time', seconds: 240 },
      actions: [
        { type: 'message', text: 'Randstad-Managers stormen van het oosten! Ze willen een "hostile takeover" van de mijn!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: -10 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 38, z: -8 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 42, z: -8 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 40, z: -6 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 40, z: -12 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'l8-combined-assault',
      condition: { type: 'time', seconds: 420 },
      actions: [
        { type: 'message', text: 'GECOMBINEERDE AANVAL! Brabanders EN Randstad vallen tegelijk aan! Gebruik de tunnels om snel te schakelen!' },
        {
          type: 'spawn-units',
          units: [
            // Brabanders van het westen
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -45, z: -20 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -43, z: -18 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: -44, z: -22 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -42, z: -20 },
            // Randstad van het oosten
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 45, z: -20 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 43, z: -18 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 44, z: -22 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 42, z: -20 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 44, z: -16 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'l8-late-reinforcements',
      condition: { type: 'time', seconds: 600 },
      actions: [
        { type: 'message', text: 'Nog meer vijandelijke versterkingen! De alliantie wil je verpletteren! Sla terug voordat ze nog sterker worden!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: -50, z: 0 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: -48, z: 2 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -52, z: 2 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 50, z: 0 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 48, z: 2 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 52, z: 2 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'l8-victory-msg',
      condition: { type: 'building-destroyed', factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall },
      actions: [{ type: 'message', text: 'Limburg is bevrijd! De Mijnbaas heft zijn houweel: "Van de grotten tot de heuvels — dit land is van ONS."' }],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 900,    // 15 min
    twoStarTime: 1320,     // 22 min
    allBonusesGrants3Stars: true,
  },
};

// ===========================================================================
// BELGEN CAMPAIGN — Missions 4-8
// ===========================================================================

// ---------------------------------------------------------------------------
// Belgen Missie 4: "Wafeltjeswar" (Wave defense)
// ---------------------------------------------------------------------------

const BELGEN_WAFEL_SPAWN_NE_X = 38;
const BELGEN_WAFEL_SPAWN_NE_Z = 35;
const BELGEN_WAFEL_SPAWN_SE_X = 35;
const BELGEN_WAFEL_SPAWN_SE_Z = -25;

const MISSION_B4_WAFELTJESWAR: MissionDefinition = {
  id: 'belgen-4-wafeltjeswar',
  campaignId: 'belgen',
  missionIndex: 3,
  title: 'Wafeltjeswar',
  playerFactionId: FactionId.Belgen,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 4: Wafeltjeswar',
  briefingText:
    'De Luikse Wafelfabriek is het trots van Belgie. Elke ochtend stroomt de geur van ' +
    'karamel en vanille over het Maasland. En elke ochtend wordt de Randstad jaloerser.\n\n' +
    'Ze hebben een ultimatum gestuurd: "Lever het wafelijzerrecept of we nemen het." ' +
    'De Frietkoning heeft geantwoord met een doos wafels en een middelvinger.\n\n' +
    'Nu komen ze. Vijf golven. Elke golf groter dan de vorige. Verdedig de Wafelfabriek ' +
    'tot de laatste kruimel.\n\n' +
    'De Frietkoning: "Wafels zijn heilig. We verdedigen ze met alles wat we hebben. ' +
    'Dat is geen oorlog — dat is een KWESTIE VAN EER."',

  mapSize: 80,
  startingGold: 350,
  startingGoldAI: 0,

  buildings: [
    // Player: base in west-center with the "waffle factory"
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: -25, z: 0, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: -18, z: -5, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TertiaryResourceBuilding, x: -18, z: 5, complete: true },
  ],

  units: [
    // Player: 5 workers + 4 infantry + 2 ranged
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -22, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -20, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -22, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -20, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -21, z: 0 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -15, z: -3 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -15, z: 0 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -15, z: 3 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -13, z: 0 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -13, z: -3 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -13, z: 3 },
  ],

  goldMines: [
    { x: -30, z: -10, amount: 2000 },
    { x: -30, z: 10, amount: 2000 },
    { x: -10, z: 0, amount: 2500 },
    { x: -20, z: -20, amount: 1500 },
  ],

  treeResources: [
    { x: -28, z: -5, amount: 800 },
    { x: -28, z: 5, amount: 800 },
    { x: -15, z: -15, amount: 600 },
    { x: -15, z: 15, amount: 600 },
  ],

  objectives: [
    { id: 'b4-survive-waves', type: 'survive-waves', description: 'Overleef 5 golven Randstad-aanvallers', targetValue: 5, isBonus: false },
    { id: 'b4-no-th-loss', type: 'no-townhall-loss', description: 'Verlies het Belgisch Raadhuis niet', targetValue: 0, isBonus: true },
    { id: 'b4-have-20-units', type: 'have-units-at-end', description: 'Heb 20+ eenheden aan het einde', targetValue: 20, isBonus: true },
  ],

  triggers: [
    {
      id: 'b4-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De Frietkoning: "De Wafelfabriek is heilig! Vijf golven komen eraan. Bouw verdedigingen, train troepen, en laat NIEMAND aan de wafels komen!"' }],
      once: true,
    },
    {
      id: 'b4-defense-tip',
      condition: { type: 'time', seconds: 20 },
      actions: [{ type: 'message', text: 'Train extra Bierbouwers en Chocolatiers. Bouw een Smidse voor upgrades. De golven worden steeds sterker — je hebt alles nodig.' }],
      once: true,
    },
    {
      id: 'b4-wave-1-warning',
      condition: { type: 'time', seconds: 70 },
      actions: [{ type: 'message', text: 'Hipsters aan de horizon! Ze willen de wafels "instagrammen"... en dan stelen!' }],
      once: true,
    },
    {
      id: 'b4-wave-1-spawn',
      condition: { type: 'time', seconds: 85 },
      actions: [
        { type: 'message', text: 'GOLF 1! Lichte verkenners. Warm-up ronde!' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'b4-wave-2-warning',
      condition: { type: 'time', seconds: 195 },
      actions: [{ type: 'message', text: 'Golf 2 nadert. Ze brengen Managers mee. Ze willen de fabriek "herstructureren".' }],
      once: true,
    },
    {
      id: 'b4-wave-2-spawn',
      condition: { type: 'time', seconds: 210 },
      actions: [
        { type: 'message', text: 'GOLF 2! Meer troepen, nu met ranged ondersteuning!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'b4-wave-3-warning',
      condition: { type: 'time', seconds: 335 },
      actions: [{ type: 'message', text: 'De Randstad escaleert! Ze sturen zware eenheden. De Frietkoning: "Ze durven... zware eenheden tegen WAFELS!"' }],
      once: true,
    },
    {
      id: 'b4-wave-3-spawn',
      condition: { type: 'time', seconds: 350 },
      actions: [
        { type: 'message', text: 'GOLF 3! Zware infanterie verschijnt! Concentreer je vuur!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'b4-wave-4-warning',
      condition: { type: 'time', seconds: 475 },
      actions: [{ type: 'message', text: 'Golf 4! Ze vallen van twee kanten aan! De Frietkoning: "Naar het noordoosten EN het zuidoosten? Ze leren snel..."' }],
      once: true,
    },
    {
      id: 'b4-wave-4-spawn',
      condition: { type: 'time', seconds: 490 },
      actions: [
        { type: 'message', text: 'GOLF 4! Tweerichtingsaanval! Verdeel je troepen!' },
        { type: 'spawn-wave', waveIndex: 3 },
      ],
      once: true,
    },
    {
      id: 'b4-wave-5-warning',
      condition: { type: 'time', seconds: 625 },
      actions: [{ type: 'message', text: 'LAATSTE GOLF nadert! De volledige Randstad-strijdmacht! Dit is het moment van de waarheid!' }],
      once: true,
    },
    {
      id: 'b4-wave-5-spawn',
      condition: { type: 'time', seconds: 640 },
      actions: [
        { type: 'message', text: 'GOLF 5! ALLES WAT DE RANDSTAD HEEFT! VERDEDIG DE WAFELS!' },
        { type: 'spawn-wave', waveIndex: 4 },
      ],
      once: true,
    },
    {
      id: 'b4-all-waves-defeated',
      condition: { type: 'all-waves-defeated' },
      actions: [
        { type: 'message', text: 'Alle golven verslagen! De Frietkoning straalt: "De Wafelfabriek staat! De wafels zijn veilig! En ik heb trek. Iemand een wafel?"' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=85s): 4 Infantry + 1 Ranged from northeast
    {
      index: 0,
      spawnTime: 85,
      units: [
        ...createWaveUnits(4, UnitTypeId.Infantry, BELGEN_WAFEL_SPAWN_NE_X, BELGEN_WAFEL_SPAWN_NE_Z, 3, FactionId.Randstad),
        ...createWaveUnits(1, UnitTypeId.Ranged, BELGEN_WAFEL_SPAWN_NE_X + 3, BELGEN_WAFEL_SPAWN_NE_Z + 3, 1, FactionId.Randstad),
      ],
      message: 'Golf 1 van 5',
    },
    // Wave 2 (T=210s): 6 Infantry + 3 Ranged from northeast
    {
      index: 1,
      spawnTime: 210,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, BELGEN_WAFEL_SPAWN_NE_X, BELGEN_WAFEL_SPAWN_NE_Z, 4, FactionId.Randstad),
        ...createWaveUnits(3, UnitTypeId.Ranged, BELGEN_WAFEL_SPAWN_NE_X + 4, BELGEN_WAFEL_SPAWN_NE_Z + 4, 2, FactionId.Randstad),
      ],
      message: 'Golf 2 van 5',
    },
    // Wave 3 (T=350s): 8 Infantry + 4 Ranged + 1 Heavy from northeast
    {
      index: 2,
      spawnTime: 350,
      units: [
        ...createWaveUnits(8, UnitTypeId.Infantry, BELGEN_WAFEL_SPAWN_NE_X, BELGEN_WAFEL_SPAWN_NE_Z, 5, FactionId.Randstad),
        ...createWaveUnits(4, UnitTypeId.Ranged, BELGEN_WAFEL_SPAWN_NE_X + 5, BELGEN_WAFEL_SPAWN_NE_Z + 5, 3, FactionId.Randstad),
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: BELGEN_WAFEL_SPAWN_NE_X, z: BELGEN_WAFEL_SPAWN_NE_Z },
      ],
      message: 'Golf 3 van 5',
    },
    // Wave 4 (T=490s): Split attack — 5+5 Infantry + 3+2 Ranged + 1 Heavy from NE and SE
    {
      index: 3,
      spawnTime: 490,
      units: [
        ...createWaveUnits(5, UnitTypeId.Infantry, BELGEN_WAFEL_SPAWN_NE_X, BELGEN_WAFEL_SPAWN_NE_Z, 4, FactionId.Randstad),
        ...createWaveUnits(5, UnitTypeId.Infantry, BELGEN_WAFEL_SPAWN_SE_X, BELGEN_WAFEL_SPAWN_SE_Z, 4, FactionId.Randstad),
        ...createWaveUnits(3, UnitTypeId.Ranged, BELGEN_WAFEL_SPAWN_NE_X + 4, BELGEN_WAFEL_SPAWN_NE_Z + 4, 2, FactionId.Randstad),
        ...createWaveUnits(2, UnitTypeId.Ranged, BELGEN_WAFEL_SPAWN_SE_X + 4, BELGEN_WAFEL_SPAWN_SE_Z - 4, 2, FactionId.Randstad),
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: BELGEN_WAFEL_SPAWN_NE_X, z: BELGEN_WAFEL_SPAWN_NE_Z },
      ],
      message: 'Golf 4 van 5',
    },
    // Wave 5 (T=640s): Full assault — 14 Infantry + 6 Ranged + 3 Heavy from both sides
    {
      index: 4,
      spawnTime: 640,
      units: [
        ...createWaveUnits(7, UnitTypeId.Infantry, BELGEN_WAFEL_SPAWN_NE_X, BELGEN_WAFEL_SPAWN_NE_Z, 5, FactionId.Randstad),
        ...createWaveUnits(7, UnitTypeId.Infantry, BELGEN_WAFEL_SPAWN_SE_X, BELGEN_WAFEL_SPAWN_SE_Z, 5, FactionId.Randstad),
        ...createWaveUnits(3, UnitTypeId.Ranged, BELGEN_WAFEL_SPAWN_NE_X + 5, BELGEN_WAFEL_SPAWN_NE_Z + 5, 3, FactionId.Randstad),
        ...createWaveUnits(3, UnitTypeId.Ranged, BELGEN_WAFEL_SPAWN_SE_X + 5, BELGEN_WAFEL_SPAWN_SE_Z - 5, 3, FactionId.Randstad),
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: BELGEN_WAFEL_SPAWN_NE_X - 2, z: BELGEN_WAFEL_SPAWN_NE_Z },
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: BELGEN_WAFEL_SPAWN_SE_X - 2, z: BELGEN_WAFEL_SPAWN_SE_Z },
        { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: BELGEN_WAFEL_SPAWN_NE_X, z: BELGEN_WAFEL_SPAWN_NE_Z - 2 },
      ],
      message: 'LAATSTE GOLF!',
    },
  ],

  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 600,    // 10 min
    twoStarTime: 840,      // 14 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Belgen Missie 5: "De Friettent" (Economy + defense)
// ---------------------------------------------------------------------------

const MISSION_B5_FRIETTENT: MissionDefinition = {
  id: 'belgen-5-de-friettent',
  campaignId: 'belgen',
  missionIndex: 4,
  title: 'De Friettent',
  playerFactionId: FactionId.Belgen,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 5: De Friettent',
  briefingText:
    'De Frietkoning heeft een ambitieus plan: drie Friettenten in het Brusselse. Eentje op ' +
    'de Grote Markt, eentje bij het Atomium, en eentje bij het Justitiepaleis. Een driehoek ' +
    'van gefrituurde glorie.\n\n' +
    'Maar de Randstad wil het gebied "optimaliseren" met een pop-up food court. Ze sturen ' +
    'plunderaars om je bouwprojecten te saboteren.\n\n' +
    'Bouw drie Friettenten (Tertiaire Resource Gebouwen), verdedig ze tegen raids, en produceer ' +
    'genoeg Frieten om Brussel te voeden.\n\n' +
    'De Frietkoning: "Drie Friettenten. Drie keer zoveel eer. En drie keer zoveel mayonaise."',

  mapSize: 96,
  startingGold: 300,
  startingGoldAI: 0,

  buildings: [
    // Player base — center
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: 0, z: 0, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: 7, z: 0, complete: true },
  ],

  units: [
    // Player: 6 workers + 3 infantry + 1 ranged
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -2, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: 0, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: 2, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -2, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: 0, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: 2, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 9, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 9, z: 0 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 9, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 11, z: 0 },
  ],

  goldMines: [
    { x: -10, z: -10, amount: 2000 },
    { x: 10, z: -10, amount: 2000 },
    { x: -10, z: 10, amount: 2000 },
    { x: 10, z: 10, amount: 2000 },
    { x: 0, z: -20, amount: 2500 },
  ],

  treeResources: [
    { x: -8, z: 0, amount: 800 },
    { x: 0, z: 8, amount: 800 },
    { x: 0, z: -8, amount: 800 },
    { x: -15, z: -15, amount: 600 },
    { x: 15, z: -15, amount: 600 },
  ],

  objectives: [
    { id: 'b5-build-3-tertiary', type: 'build-building', description: 'Bouw 3 Friettenten (Tertiaire Resource Gebouwen)', targetValue: 3, isBonus: false, targetBuildingType: BuildingTypeId.TertiaryResourceBuilding, targetBuildingCount: 3 },
    { id: 'b5-gather-1000', type: 'gather-gold', description: 'Produceer 1000 Frieten', targetValue: 1000, isBonus: false },
    { id: 'b5-no-th-loss', type: 'no-townhall-loss', description: 'Verlies het Belgisch Raadhuis niet', targetValue: 0, isBonus: true },
    { id: 'b5-no-worker-loss', type: 'no-worker-loss', description: 'Verlies geen Frietkraamhouders', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'b5-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De Frietkoning: "Drie Friettenten! Dat is het plan. Eentje is een snackbar. Twee is een keten. Drie is een IMPERIUM. Aan de slag!"' }],
      once: true,
    },
    {
      id: 'b5-build-tip',
      condition: { type: 'time', seconds: 30 },
      actions: [{ type: 'message', text: 'Bouw de Friettenten verspreid over de kaart. Ze produceren elk extra Frieten, maar trek ook vijandelijke plunderaars aan. Verdedig ze goed!' }],
      once: true,
    },
    {
      id: 'b5-first-tent',
      condition: { type: 'building-count', buildingType: BuildingTypeId.TertiaryResourceBuilding, count: 1 },
      actions: [{ type: 'message', text: 'De eerste Friettent staat! De Frietkoning: "Ah, de geur! Maar de Randstad ruikt het ook. Verwacht plunderaars."' }],
      once: true,
    },
    {
      id: 'b5-raid-1',
      condition: { type: 'time', seconds: 150 },
      actions: [
        { type: 'message', text: 'Randstad-plunderaars! Ze willen de Friettenten saboteren!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 35 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 42, z: 33 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 38, z: 33 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b5-second-tent',
      condition: { type: 'building-count', buildingType: BuildingTypeId.TertiaryResourceBuilding, count: 2 },
      actions: [{ type: 'message', text: 'Twee Friettenten! De Frietkoning: "Het netwerk groeit! Nog eentje en Brussel ruikt naar friet van oost tot west!"' }],
      once: true,
    },
    {
      id: 'b5-raid-2',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'Meer plunderaars! Ze sturen nu ook Managers — ze willen een "efficiency review" van uw Friettenten!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -40, z: -35 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -38, z: -33 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -42, z: -33 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -40, z: -31 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -38, z: -31 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b5-third-tent',
      condition: { type: 'building-count', buildingType: BuildingTypeId.TertiaryResourceBuilding, count: 3 },
      actions: [{ type: 'message', text: 'DRIE FRIETTENTEN! De Frietkoning danst: "Het Frieten-imperium is compleet! Nu alleen nog genoeg Frieten produceren!"' }],
      once: true,
    },
    {
      id: 'b5-raid-3',
      condition: { type: 'time', seconds: 450 },
      actions: [
        { type: 'message', text: 'GROOT OFFENSIEF! De Randstad stuurt hun beste troepen om ALLE Friettenten tegelijk aan te vallen!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 40, z: 0 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 42, z: 2 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 38, z: -2 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 44, z: 0 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 44, z: -2 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 42, z: -4 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b5-victory',
      condition: { type: 'gold-reached', amount: 1000 },
      actions: [
        { type: 'message', text: '1000 Frieten! Het Frieten-imperium bloeit! De Frietkoning: "Drie tenten, duizend frieten, en nul Randstedelingen in de keuken. Dat is een goede dag voor Belgie!"' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 540,    // 9 min
    twoStarTime: 780,      // 13 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Belgen Missie 6: "Diplomatiek Incident" (Alliance/betrayal)
// ---------------------------------------------------------------------------

const MISSION_B6_DIPLOMATIEK_INCIDENT: MissionDefinition = {
  id: 'belgen-6-diplomatiek-incident',
  campaignId: 'belgen',
  missionIndex: 5,
  title: 'Diplomatiek Incident',
  playerFactionId: FactionId.Belgen,
  aiFactionIds: [FactionId.Limburgers],
  briefingTitle: 'Missie 6: Diplomatiek Incident',
  briefingText:
    'De Limburgers hebben een bondgenootschap voorgesteld. "Samen tegen de Randstad," zeggen ze. ' +
    'De Frietkoning is wantrouwig — Limburgers zijn geslepen als hun eigen Vlaai.\n\n' +
    'Maar de deal is te goed: samen delen we de grondstoffen van het grensgebied. Bouw je ' +
    'economie op en train een leger, want het woord van een Limburger is zo stabiel als ' +
    'hun tunnels.\n\n' +
    'De Frietkoning fluistert: "Vertrouw ze niet. Ik heb een Plan B... en dat Plan B ' +
    'heet extra Chocolatiers."',

  mapSize: 96,
  startingGold: 400,
  startingGoldAI: 350,

  buildings: [
    // Player base — west
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: -35, z: 0, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: -28, z: -5, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.LumberCamp, x: -35, z: 7, complete: true },
    // "Allied" Limburgers — east (become enemies later)
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: 35, z: 0, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: 28, z: -5, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: 35, z: 7, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Blacksmith, x: 28, z: 5, complete: true },
  ],

  units: [
    // Player: 5 workers + 3 infantry + 2 ranged
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -32, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -30, z: -2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -32, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -30, z: 2 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -31, z: 0 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -25, z: -3 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -25, z: 0 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -25, z: 3 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -23, z: -1 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -23, z: 1 },
    // Limburgers — "allied" start force (become hostile at wave 3 trigger)
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 25, z: -3 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 25, z: 0 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 25, z: 3 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 27, z: -5 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 23, z: -1 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 23, z: 1 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 26, z: 0 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 24, z: 3 },
  ],

  goldMines: [
    // Player side
    { x: -30, z: -15, amount: 2000 },
    { x: -30, z: 15, amount: 2000 },
    // Shared center (contested after betrayal)
    { x: 0, z: -10, amount: 3000 },
    { x: 0, z: 10, amount: 3000 },
    // Limburger side
    { x: 30, z: -15, amount: 2000 },
    { x: 30, z: 15, amount: 2000 },
  ],

  treeResources: [
    { x: -25, z: -10, amount: 800 },
    { x: -25, z: 10, amount: 800 },
    { x: -10, z: 0, amount: 600 },
    { x: 10, z: 0, amount: 600 },
  ],

  objectives: [
    { id: 'b6-destroy-limb-th', type: 'destroy-building', description: 'Vernietig de Limburgse Grottentempel (na het verraad)', targetValue: 1, isBonus: false },
    { id: 'b6-survive-waves', type: 'survive-waves', description: 'Overleef de 3 Limburgse aanvalsgolven', targetValue: 3, isBonus: false },
    { id: 'b6-no-th-loss', type: 'no-townhall-loss', description: 'Verlies het Belgisch Raadhuis niet', targetValue: 0, isBonus: true },
    { id: 'b6-have-20-units', type: 'have-units-at-end', description: 'Heb 20+ eenheden aan het einde', targetValue: 20, isBonus: true },
  ],

  triggers: [
    {
      id: 'b6-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De Frietkoning: "De Limburgers zijn onze... bondgenoten. Voorlopig. Bouw je economie op en train troepen. Je weet nooit wanneer een bondgenoot van gedachten verandert."' }],
      once: true,
    },
    {
      id: 'b6-alliance-happy',
      condition: { type: 'time', seconds: 60 },
      actions: [{ type: 'message', text: 'De Mijnbaas stuurt een bericht: "Goed bezig, Belgische vriend! Samen maken we de Randstad kapot!" De Frietkoning grinnikt wantrouwig.' }],
      once: true,
    },
    {
      id: 'b6-tension',
      condition: { type: 'time', seconds: 180 },
      actions: [{ type: 'message', text: 'De Mijnbaas wordt stil. Zijn boodschappen worden korter. De Frietkoning: "Hij broeit op iets. Ik voel het."' }],
      once: true,
    },
    {
      id: 'b6-betrayal-warning',
      condition: { type: 'time', seconds: 270 },
      actions: [{ type: 'message', text: 'ALARMEREND BERICHT van je verkenners: de Limburgers verplaatsen troepen naar het centrum! Dit ziet er niet uit als een gezamenlijke patrouille...' }],
      once: true,
    },
    {
      id: 'b6-betrayal',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'VERRAAD! De Mijnbaas schreeuwt: "De deal is gewijzigd! Alles is van MIJ!" De Limburgers vallen aan! De Frietkoning: "Ik WIST het. Plan B! IEDEREEN PLAN B!"' },
        { type: 'spawn-wave', waveIndex: 0 },
      ],
      once: true,
    },
    {
      id: 'b6-wave-2-warning',
      condition: { type: 'time', seconds: 435 },
      actions: [{ type: 'message', text: 'De Limburgers sturen meer troepen vanuit hun tunnels! Golf 2 nadert!' }],
      once: true,
    },
    {
      id: 'b6-wave-2-spawn',
      condition: { type: 'time', seconds: 450 },
      actions: [
        { type: 'message', text: 'GOLF 2! Mergelridders en Schutterij! De Limburgers zetten alles in!' },
        { type: 'spawn-wave', waveIndex: 1 },
      ],
      once: true,
    },
    {
      id: 'b6-wave-3-warning',
      condition: { type: 'time', seconds: 585 },
      actions: [{ type: 'message', text: 'LAATSTE GOLF! De Mijnbaas stuurt zijn laatste reserves! Overleef dit en sla dan terug!' }],
      once: true,
    },
    {
      id: 'b6-wave-3-spawn',
      condition: { type: 'time', seconds: 600 },
      actions: [
        { type: 'message', text: 'GOLF 3! DE VOLLEDIGE LIMBURGSE STRIJDMACHT! HOUD STAND!' },
        { type: 'spawn-wave', waveIndex: 2 },
      ],
      once: true,
    },
    {
      id: 'b6-counter-tip',
      condition: { type: 'all-waves-defeated' },
      actions: [{ type: 'message', text: 'Alle golven overleefd! De Frietkoning: "Nu is het onze beurt! Vernietig hun Grottentempel! Niemand verraadt Belgie en komt ermee weg!"' }],
      once: true,
    },
    {
      id: 'b6-victory',
      condition: { type: 'building-destroyed', factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'De Limburgse Grottentempel is gevallen! De Frietkoning: "Diplomatie is als Vlaai — zoet aan de bovenkant, maar als je te diep graaft, val je in een tunnel van leugens. Bedankt voor de les, Mijnbaas."' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [
    // Wave 1 (T=300s — betrayal moment): 6 Infantry + 3 Ranged rushing from center
    {
      index: 0,
      spawnTime: 300,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, 10, 0, 4, FactionId.Limburgers),
        ...createWaveUnits(3, UnitTypeId.Ranged, 13, 3, 2, FactionId.Limburgers),
      ],
      message: 'VERRAAD! Golf 1 van 3',
    },
    // Wave 2 (T=450s): 8 Infantry + 4 Ranged + 2 Heavy
    {
      index: 1,
      spawnTime: 450,
      units: [
        ...createWaveUnits(8, UnitTypeId.Infantry, 15, 0, 5, FactionId.Limburgers),
        ...createWaveUnits(4, UnitTypeId.Ranged, 18, 4, 3, FactionId.Limburgers),
        ...createWaveUnits(2, UnitTypeId.Heavy, 12, -3, 2, FactionId.Limburgers),
      ],
      message: 'Golf 2 van 3',
    },
    // Wave 3 (T=600s): 10 Infantry + 5 Ranged + 3 Heavy — all-out betrayal assault
    {
      index: 2,
      spawnTime: 600,
      units: [
        ...createWaveUnits(10, UnitTypeId.Infantry, 15, 0, 6, FactionId.Limburgers),
        ...createWaveUnits(5, UnitTypeId.Ranged, 19, 5, 3, FactionId.Limburgers),
        ...createWaveUnits(3, UnitTypeId.Heavy, 12, -4, 2, FactionId.Limburgers),
      ],
      message: 'LAATSTE GOLF!',
    },
  ],

  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 720,    // 12 min
    twoStarTime: 1020,     // 17 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Belgen Missie 7: "Konvooi naar Brussel" (No-base commando escort)
// ---------------------------------------------------------------------------

const MISSION_B7_KONVOOI_NAAR_BRUSSEL: MissionDefinition = {
  id: 'belgen-7-konvooi-naar-brussel',
  campaignId: 'belgen',
  missionIndex: 6,
  title: 'Konvooi naar Brussel',
  playerFactionId: FactionId.Belgen,
  aiFactionIds: [FactionId.Randstad],
  briefingTitle: 'Missie 7: Konvooi naar Brussel',
  briefingText:
    'De Frietkoning moet naar Brussel. Het Europees Parlement heeft een noodvergadering ' +
    'uitgeschreven over de "Frietencrisis" — de Randstad wil friet illegaal verklaren.\n\n' +
    'Het probleem: de snelwegen zijn geblokkeerd door Randstad-checkpoints. Jullie moeten ' +
    'te voet, door vijandelijk gebied, van het zuiden naar het noorden.\n\n' +
    'Geen basis. Geen versterking. Alleen jullie konvooi en de wil van Belgie.\n\n' +
    'De Frietkoning: "Het lot van de friet ligt in onze handen. Laten we lopen. ' +
    'En als ze ons tegenhouden... laten we VECHTEN."',

  mapSize: 128,
  startingGold: 0,
  startingGoldAI: 0,
  noPlayerTownHall: true,

  buildings: [
    // No player buildings — commando mission
    // Enemy checkpoints along the route
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -10, z: -20, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 15, z: 10, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -5, z: 40, complete: true },
  ],

  units: [
    // Player: escort convoy — 3 Infantry + 3 Ranged + 2 Heavy (diverse squad)
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 0, z: -55 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -2, z: -53 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 2, z: -53 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -3, z: -55 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 3, z: -55 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 0, z: -57 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Heavy, x: -1, z: -57 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Heavy, x: 1, z: -57 },
    // Enemy checkpoint 1 (south) — 3 guards
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -12, z: -22 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -8, z: -18 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -10, z: -16 },
    // Enemy checkpoint 2 (center) — 4 guards
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 13, z: 8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 17, z: 8 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 14, z: 12 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 16, z: 12 },
    // Enemy checkpoint 3 (north) — 5 guards
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -7, z: 38 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -3, z: 38 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -5, z: 42 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -7, z: 42 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -3, z: 42 },
  ],

  goldMines: [], // No economy in commando mission

  treeResources: [
    // Natural barriers and cover
    { x: -15, z: -35, amount: 300 },
    { x: 10, z: -30, amount: 300 },
    { x: -20, z: -5, amount: 300 },
    { x: 20, z: 5, amount: 300 },
    { x: -10, z: 25, amount: 300 },
    { x: 10, z: 30, amount: 300 },
    { x: -15, z: 50, amount: 300 },
    { x: 5, z: 55, amount: 300 },
  ],

  objectives: [
    { id: 'b7-reach-brussels', type: 'have-units-at-end', description: 'Bereik Brussel met minstens 3 eenheden', targetValue: 3, isBonus: false },
    { id: 'b7-all-survive', type: 'have-units-at-end', description: 'Houd alle 8 eenheden in leven', targetValue: 8, isBonus: true },
  ],

  triggers: [
    {
      id: 'b7-intro',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Frietkoning: "Van hier tot Brussel. Drie checkpoints. Geen hulp onderweg. Moge de mayonaise met ons zijn."' }],
      once: true,
    },
    {
      id: 'b7-move-tip',
      condition: { type: 'time', seconds: 10 },
      actions: [{ type: 'message', text: 'Beweeg je konvooi naar het noorden. Schakel elk checkpoint uit. Verlies zo min mogelijk eenheden — je hebt minstens 3 nodig aan het einde.' }],
      once: true,
    },
    {
      id: 'b7-checkpoint-1',
      condition: { type: 'time', seconds: 90 },
      actions: [{ type: 'message', text: 'Checkpoint 1 in zicht! Drie bewakers. De Frietkoning: "Focus je vuur. Snel en efficienter dan een Belgische belastingaangifte."' }],
      once: true,
    },
    {
      id: 'b7-ambush-1',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'HINDERLAAG! Randstad-troepen verschijnen uit de bosjes!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 20, z: -10 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 22, z: -8 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 18, z: -8 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b7-checkpoint-2',
      condition: { type: 'time', seconds: 240 },
      actions: [{ type: 'message', text: 'Checkpoint 2 vooruit! Vier bewakers, waaronder een zware eenheid. De Frietkoning: "Ze worden sterker. Wij ook."' }],
      once: true,
    },
    {
      id: 'b7-ambush-2',
      condition: { type: 'time', seconds: 360 },
      actions: [
        { type: 'message', text: 'NOG EEN HINDERLAAG! Ze wisten dat we zouden komen!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -25, z: 20 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -23, z: 22 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -27, z: 22 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -24, z: 24 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b7-checkpoint-3',
      condition: { type: 'time', seconds: 420 },
      actions: [{ type: 'message', text: 'LAATSTE CHECKPOINT! Vijf bewakers bewaken de toegang tot Brussel. De Frietkoning: "Dit is het. Alles of niets. VOOR DE FRIET!"' }],
      once: true,
    },
    {
      id: 'b7-final-sprint',
      condition: { type: 'time', seconds: 540 },
      actions: [{ type: 'message', text: 'Brussel is in zicht! Doorbreek de laatste verdediging en bereik het Europees Parlement!' }],
      once: true,
    },
    {
      id: 'b7-victory',
      condition: { type: 'time', seconds: 600 },
      actions: [
        { type: 'message', text: 'Brussel bereikt! De Frietkoning stormt het Europees Parlement binnen: "DE FRIET BLIJFT! EN DAT IS FINAAL!" Standing ovation van de Belgische delegatie.' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 420,    // 7 min — fast clear
    twoStarTime: 600,      // 10 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Belgen Missie 8: "Het Laatste Bier" (Epic finale)
// ---------------------------------------------------------------------------

const MISSION_B8_HET_LAATSTE_BIER: MissionDefinition = {
  id: 'belgen-8-het-laatste-bier',
  campaignId: 'belgen',
  missionIndex: 7,
  title: 'Het Laatste Bier',
  playerFactionId: FactionId.Belgen,
  aiFactionIds: [FactionId.Randstad, FactionId.Brabanders],
  briefingTitle: 'Missie 8: Het Laatste Bier',
  briefingText:
    'De finale. De Randstad en de Brabanders hebben een alliantie gesloten — ze willen Belgie ' +
    'opdelen. De Randstad wil onze haven, de Brabanders willen onze frieten.\n\n' +
    'De Frietkoning staat op de muren van Antwerpen en kijkt naar de twee legers aan de horizon. ' +
    'De Randstad van het noorden, de Brabanders van het oosten. Twee fronten, twee vijanden.\n\n' +
    'Maar dit is Belgie. Land van compromissen, bureaucratie, en het beste bier ter wereld. ' +
    'En als het op vechten aankomt... vechten we met alles.\n\n' +
    'De Frietkoning heft zijn laatste pintje: "Dit bier is voor Belgie. Het volgende bier ' +
    'drinken we op de ruines van hun hoofdkwartieren. SANTE!"',

  mapSize: 128,
  startingGold: 700,
  startingGoldAI: 500,

  buildings: [
    // Player: full base in southwest
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: -50, z: -45, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: -43, z: -45, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: -50, z: -38, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Blacksmith, x: -43, z: -38, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TertiaryResourceBuilding, x: -55, z: -50, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.SiegeWorkshop, x: -55, z: -40, complete: true },
    // Randstad base — north
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: -10, z: 50, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -3, z: 50, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -10, z: 57, complete: true },
    // Brabanders base — east
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: 50, z: -10, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 50, z: -3, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 57, z: -10, complete: true },
  ],

  units: [
    // Player: 7 workers + 6 infantry + 4 ranged + 2 heavy
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -48, z: -43 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -46, z: -43 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -48, z: -41 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -46, z: -41 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -47, z: -39 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -49, z: -39 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Worker, x: -45, z: -39 },
    // Left flank (facing north/Randstad)
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -40, z: -35 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -42, z: -33 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -38, z: -33 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -40, z: -31 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -42, z: -31 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Heavy, x: -40, z: -37 },
    // Right flank (facing east/Brabanders)
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -35, z: -40 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -33, z: -42 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: -33, z: -38 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -31, z: -40 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: -31, z: -42 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Heavy, x: -37, z: -40 },
    // Randstad defenders (north)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -12, z: 48 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -8, z: 48 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -10, z: 46 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -12, z: 52 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -8, z: 52 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -10, z: 54 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -6, z: 50 },
    // Brabanders defenders (east)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 48, z: -12 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 48, z: -8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 46, z: -10 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 52, z: -12 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 52, z: -8 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: 54, z: -10 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: 50, z: -6 },
  ],

  goldMines: [
    // Player area
    { x: -55, z: -45, amount: 3500 },
    { x: -45, z: -55, amount: 3500 },
    { x: -55, z: -35, amount: 3000 },
    // Contested center
    { x: -20, z: -20, amount: 3000 },
    { x: 0, z: 0, amount: 4000 },
    // Near enemies
    { x: -15, z: 45, amount: 2000 },
    { x: 45, z: -15, amount: 2000 },
  ],

  treeResources: [
    { x: -50, z: -35, amount: 1200 },
    { x: -40, z: -50, amount: 1200 },
    { x: -45, z: -30, amount: 1000 },
    { x: -30, z: -45, amount: 1000 },
    { x: -25, z: -25, amount: 800 },
    { x: 0, z: -15, amount: 800 },
  ],

  objectives: [
    { id: 'b8-destroy-rand-th', type: 'destroy-building', description: 'Vernietig het Randstad Hoofdkantoor (noord)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Randstad, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'b8-destroy-brab-th', type: 'destroy-building', description: 'Vernietig de Brabanders Boerderij (oost)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Brabanders, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'b8-no-th-loss', type: 'no-townhall-loss', description: 'Verlies het Belgisch Raadhuis niet', targetValue: 0, isBonus: true },
    { id: 'b8-have-35-units', type: 'have-units-at-end', description: 'Heb 35+ eenheden aan het einde (Belgisch imperium)', targetValue: 35, isBonus: true },
  ],

  triggers: [
    {
      id: 'b8-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De Frietkoning: "Twee vijanden. Twee fronten. Maar dit is ONS land. Randstad van het noorden, Brabanders van het oosten. Vernietig ze. Voor het bier. Voor de frieten. Voor BELGIE."' }],
      once: true,
    },
    {
      id: 'b8-strategy-tip',
      condition: { type: 'time', seconds: 30 },
      actions: [{ type: 'message', text: 'Strategisch advies: de Randstad is sterk op afstand maar kwetsbaar in melee. De Brabanders zijn taai maar langzaam. Verdeel je leger slim over twee fronten of pak ze een voor een aan.' }],
      once: true,
    },
    {
      id: 'b8-rand-raid',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'Randstad-managers naderen vanuit het noorden! Ze willen een "culturele due diligence"!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -30, z: 20 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -28, z: 22 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -32, z: 22 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -30, z: 24 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b8-brab-raid',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'Brabantse Carnavalvierders stormen vanuit het oosten! Ze willen onze frietkramen platbranden!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 20, z: -30 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 22, z: -28 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 18, z: -28 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: 20, z: -32 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 22, z: -32 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b8-combined-assault',
      condition: { type: 'time', seconds: 480 },
      actions: [
        { type: 'message', text: 'GECOMBINEERDE AANVAL! Randstad EN Brabanders vallen tegelijk aan! De Frietkoning: "Ze denken dat twee beter is dan een. Maar ze hebben het Belgisch Compromis vergeten: WIJ kunnen met iedereen tegelijk vechten!"' },
        {
          type: 'spawn-units',
          units: [
            // Randstad van het noorden
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -35, z: 10 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -33, z: 12 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -37, z: 12 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -35, z: 14 },
            // Brabanders van het oosten
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 10, z: -35 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 12, z: -33 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: 12, z: -37 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: 14, z: -35 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b8-late-reinforcements',
      condition: { type: 'time', seconds: 660 },
      actions: [
        { type: 'message', text: 'Vijandelijke versterkingen! Nog meer troepen stromen in! Sla nu terug of word overspoeld!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -20, z: 35 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -18, z: 37 },
            { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -22, z: 37 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: 35, z: -20 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 37, z: -18 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 37, z: -22 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'b8-victory-msg',
      condition: { type: 'building-destroyed', factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall },
      actions: [{ type: 'message', text: 'Het laatste bier is getapt — Belgie is vrij! De Frietkoning heft zijn pintje: "SANTE! Dit bier smaakt naar overwinning."' }],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 960,    // 16 min
    twoStarTime: 1380,     // 23 min
    allBonusesGrants3Stars: true,
  },
};

// ===========================================================================
// RANDSTAD CAMPAIGN — Missions 6-8
// ===========================================================================

// ---------------------------------------------------------------------------
// Randstad Missie 6: "Marktmanipulatie" (Economic warfare — time pressure)
// ---------------------------------------------------------------------------

const RANDSTAD_MISSION_6_MARKTMANIPULATIE: MissionDefinition = {
  id: 'randstad-6-marktmanipulatie',
  campaignId: 'randstad',
  missionIndex: 5,
  title: 'Marktmanipulatie',
  playerFactionId: FactionId.Randstad,
  aiFactionIds: [FactionId.Limburgers],
  briefingTitle: 'Missie 6: Marktmanipulatie',
  briefingText:
    'De CEO heeft een briljant plan: een "Flash Sale" — dump al onze PowerPoints op de markt, ' +
    'overspoelt de Limburgse economie, en neem hun basis over voordat ze doorhebben wat er gebeurt.\n\n' +
    'Je begint met enorm veel goud. Maar het loopt snel op — investeringen branden door je budget. ' +
    'Bouw snel, train snel, en val aan VOORDAT je failliet gaat.\n\n' +
    'De CFO waarschuwt: "We hebben 8 minuten voordat de aandeelhouders gaan bellen. ' +
    'Als we dan niet winnen, worden WIJ overgenomen."\n\n' +
    'Dit is geen oorlog. Dit is een beursmanoeuvre met dodelijke gevolgen.',

  mapSize: 96,
  startingGold: 1200,
  startingGoldAI: 400,

  buildings: [
    // Player: base in west — ready for fast production
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: -35, z: 0, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -28, z: -5, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -28, z: 5, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Blacksmith, x: -35, z: 8, complete: true },
    // Enemy: Limburger base in east — fortified
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: 35, z: 0, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: 28, z: -5, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Blacksmith, x: 28, z: 5, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.DefenseTower, x: 22, z: 0, complete: true },
  ],

  units: [
    // Player: 6 workers + 2 infantry (fast economy start)
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -33, z: -2 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -31, z: -2 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -33, z: 2 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -31, z: 2 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -32, z: 0 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -30, z: 0 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -26, z: -3 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -26, z: 3 },
    // Enemy: solid defense force
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 20, z: -2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: 20, z: 2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 22, z: -4 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 22, z: 4 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 24, z: 0 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 30, z: 0 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 33, z: -2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 33, z: 2 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Worker, x: 35, z: 2 },
  ],

  goldMines: [
    { x: -30, z: -15, amount: 1500 },  // Player side — limited!
    { x: -30, z: 15, amount: 1500 },
    { x: 0, z: 0, amount: 2000 },      // Contested center
    { x: 30, z: -15, amount: 2500 },   // Enemy side
    { x: 30, z: 15, amount: 2500 },
  ],

  treeResources: [
    { x: -28, z: -10, amount: 600 },
    { x: -28, z: 10, amount: 600 },
    { x: -15, z: 0, amount: 500 },
    { x: 15, z: 0, amount: 500 },
  ],

  objectives: [
    { id: 'r6-destroy-limb-th', type: 'destroy-building', description: 'Vernietig de Limburgse Grottentempel', targetValue: 1, isBonus: false },
    { id: 'r6-train-12', type: 'train-units', description: 'Train 12 militaire eenheden (snel!)', targetValue: 12, isBonus: false },
    { id: 'r6-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Hoofdkantoor niet', targetValue: 0, isBonus: true },
    { id: 'r6-gather-500', type: 'gather-gold', description: 'Heb aan het einde nog 500 PowerPoints over (bonus: efficienter dan McKinsey)', targetValue: 500, isBonus: true },
  ],

  triggers: [
    {
      id: 'r6-intro',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De CFO: "Flash Sale! Je hebt een berg PowerPoints maar de klok tikt. Train snel, bouw snel, val aan SNEL. Elke seconde kost geld."' }],
      once: true,
    },
    {
      id: 'r6-rush-tip',
      condition: { type: 'time', seconds: 15 },
      actions: [{ type: 'message', text: 'Begin DIRECT met het trainen van eenheden uit beide Vergaderzalen. Je hebt genoeg goud voor een groot leger — maar niet voor altijd. Snelheid is geld!' }],
      once: true,
    },
    {
      id: 'r6-army-5',
      condition: { type: 'army-count', count: 5 },
      actions: [{ type: 'message', text: 'De CFO: "Vijf man. Dat is nog geen startup. DOORTRAINEN!"' }],
      once: true,
    },
    {
      id: 'r6-army-10',
      condition: { type: 'army-count', count: 10 },
      actions: [{ type: 'message', text: 'Tien man! De CFO: "Nu praten we. Stuur ze naar het oosten voordat de Limburgers hun defensie versterken!"' }],
      once: true,
    },
    {
      id: 'r6-timer-warning-1',
      condition: { type: 'time', seconds: 300 },
      actions: [{ type: 'message', text: 'De CFO: "Vijf minuten! De aandeelhouders worden nerveus. De koers daalt. BEWEEG!"' }],
      once: true,
    },
    {
      id: 'r6-limb-counterattack',
      condition: { type: 'time', seconds: 240 },
      actions: [
        { type: 'message', text: 'De Limburgers sturen een tegenaanval! Mergelridders vanuit de tunnels!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 0, z: -20 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: 2, z: -18 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -2, z: -18 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: 0, z: -16 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r6-timer-warning-2',
      condition: { type: 'time', seconds: 420 },
      actions: [{ type: 'message', text: 'De CEO belt persoonlijk: "Waar is mijn overwinning?! Als dit niet in 3 minuten klaar is, bel ik een headhunter!"' }],
      once: true,
    },
    {
      id: 'r6-victory',
      condition: { type: 'building-destroyed', factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Overname voltooid! De Limburgse mijnen zijn nu Randstad-eigendom! De CEO: "Uitstekend. Schrijf het op als een strategische acquisitie. De aandeelhouders zullen dit geweldig vinden."' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 360,    // 6 min — very tight!
    twoStarTime: 540,      // 9 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Randstad Missie 7: "De Reorganisatie" (Commando mission — heavy squad)
// ---------------------------------------------------------------------------

const RANDSTAD_MISSION_7_REORGANISATIE: MissionDefinition = {
  id: 'randstad-7-de-reorganisatie',
  campaignId: 'randstad',
  missionIndex: 6,
  title: 'De Reorganisatie',
  playerFactionId: FactionId.Randstad,
  aiFactionIds: [FactionId.Brabanders],
  briefingTitle: 'Missie 7: De Reorganisatie',
  briefingText:
    'De Board heeft een "Reorganisatie" goedgekeurd. Codetaal voor: stuur een klein eliteteam ' +
    'naar de Brabantse boerderij en maak het met de grond gelijk.\n\n' +
    'Geen basis. Geen backup. Alleen vier Executive Vice Presidents met dure maatpakken ' +
    'en een onbeperkt budget voor geweld.\n\n' +
    'De Brabanders verwachten geen aanval — ze zijn druk met carnaval. Sla toe voordat ' +
    'de muziek stopt.\n\n' +
    'De CEO: "Reorganisatie klinkt netter dan wat we echt gaan doen. Maar het resultaat ' +
    'is hetzelfde: die boerderij wordt een parkeerplaats."',

  mapSize: 80,
  startingGold: 0,
  startingGoldAI: 0,
  noPlayerTownHall: true,

  buildings: [
    // No player buildings — commando mission
    // Enemy base — Brabantse boerderij in center-east
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: 25, z: 0, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 18, z: -5, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: 18, z: 5, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Housing, x: 25, z: 8, complete: true },
  ],

  units: [
    // Player: 4 Heavy + 2 Ranged elite squad
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -33, z: -2 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -33, z: 2 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -35, z: -2 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -35, z: 2 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -37, z: -1 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -37, z: 1 },
    // Enemy: patrol groups and base defenders
    // Patrol 1 — west
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -10, z: -5 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -8, z: -3 },
    // Patrol 2 — center
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 5, z: 5 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 7, z: 3 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 5, z: 7 },
    // Base defenders — inner ring
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 16, z: -3 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 16, z: 3 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 20, z: -7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 20, z: 7 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 23, z: -3 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 23, z: 3 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: 27, z: 0 },
  ],

  goldMines: [], // No economy in commando mission

  treeResources: [
    // Scattered cover
    { x: -20, z: -10, amount: 300 },
    { x: -15, z: 10, amount: 300 },
    { x: 0, z: -10, amount: 300 },
    { x: 10, z: -15, amount: 300 },
    { x: 10, z: 15, amount: 300 },
  ],

  objectives: [
    { id: 'r7-destroy-th', type: 'destroy-building', description: 'Vernietig de Brabantse Boerderij', targetValue: 1, isBonus: false, targetFactionId: FactionId.Brabanders, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'r7-destroy-barracks', type: 'destroy-building', description: 'Vernietig beide Brabantse Kazernes', targetValue: 2, isBonus: false, targetFactionId: FactionId.Brabanders, targetBuildingType: BuildingTypeId.Barracks },
    { id: 'r7-keep-4-alive', type: 'have-units-at-end', description: 'Houd minstens 4 eenheden in leven', targetValue: 4, isBonus: true },
  ],

  triggers: [
    {
      id: 'r7-intro',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De CEO: "Vier EVPs. Twee Consultants. Een missie. Die boerderij wordt een parkeerplaats. Begin bij de buitenposten en werk naar binnen."' }],
      once: true,
    },
    {
      id: 'r7-stealth-tip',
      condition: { type: 'time', seconds: 10 },
      actions: [{ type: 'message', text: 'Je EVPs zijn zwaar gepantserd maar langzaam. Gebruik de Consultants voor ranged ondersteuning. Neem patrouilles uit voordat ze alarm slaan.' }],
      once: true,
    },
    {
      id: 'r7-patrol-contact',
      condition: { type: 'time', seconds: 60 },
      actions: [{ type: 'message', text: 'Patrouilles gespot! De Brabanders vieren carnaval maar hun bewakers zijn alert. Focus je vuur op een groep tegelijk.' }],
      once: true,
    },
    {
      id: 'r7-barracks-destroyed',
      condition: { type: 'building-destroyed', factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks },
      actions: [{ type: 'message', text: 'Kazerne vernietigd! De CEO: "Uitstekend. Dat scheelt weer een afdeling. Door naar de volgende."' }],
      once: true,
    },
    {
      id: 'r7-alarm',
      condition: { type: 'time', seconds: 240 },
      actions: [
        { type: 'message', text: 'ALARM! De Brabanders sturen versterkingen! Carnavalvierders vanuit het noordoosten!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 35, z: 25 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 37, z: 23 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: 33, z: 23 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: 35, z: 27 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r7-victory',
      condition: { type: 'building-destroyed', factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Reorganisatie voltooid! De boerderij is nu officieel een "Randstad Innovation Hub". De CEO op LinkedIn: "Trots op ons team dat deze transformatie mogelijk heeft gemaakt. #Leiderschap #Synergie"' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 240,    // 4 min — aggressive clear
    twoStarTime: 420,      // 7 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Randstad Missie 8: "IPO Day" (Epic finale — 3-way battle)
// ---------------------------------------------------------------------------

const RANDSTAD_MISSION_8_IPO_DAY: MissionDefinition = {
  id: 'randstad-8-ipo-day',
  campaignId: 'randstad',
  missionIndex: 7,
  title: 'IPO Day',
  playerFactionId: FactionId.Randstad,
  aiFactionIds: [FactionId.Brabanders, FactionId.Limburgers, FactionId.Belgen],
  briefingTitle: 'Missie 8: IPO Day',
  briefingText:
    'Het is IPO Day. Randstad Corporation gaat naar de beurs. Maar de voorwaarde van de ' +
    'underwriters is duidelijk: "Totale marktdominantie. Geen concurrentie. Nul."\n\n' +
    'Brabanders in het zuidwesten, Limburgers in het noordwesten, Belgen in het noordoosten — ' +
    'drie facties, drie hoofdkwartieren, drie vijanden die allemaal kapot moeten.\n\n' +
    'De CEO heeft haar beste pak aan. De Board zit in de front row. De hele wereld kijkt mee.\n\n' +
    'De CEO: "Vandaag is de dag dat Randstad Corporation het enige bedrijf wordt dat er toe doet. ' +
    'De IPO gaat door zodra de laatste concurrent is uitgeschakeld. Maak het zo."',

  mapSize: 128,
  startingGold: 800,
  startingGoldAI: 500,

  buildings: [
    // Player base — south-center
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.TownHall, x: 0, z: -55, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: 8, z: -55, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Barracks, x: -8, z: -55, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.Blacksmith, x: 0, z: -62, complete: true },
    { factionId: FactionId.Randstad, buildingType: BuildingTypeId.SiegeWorkshop, x: -10, z: -62, complete: true },
    // Brabanders base — southwest
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -50, z: -20, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -43, z: -20, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -50, z: -13, complete: true },
    // Limburgers base — northwest
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.TownHall, x: -50, z: 40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -43, z: 40, complete: true },
    { factionId: FactionId.Limburgers, buildingType: BuildingTypeId.Barracks, x: -50, z: 47, complete: true },
    // Belgen base — northeast
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall, x: 50, z: 40, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: 43, z: 40, complete: true },
    { factionId: FactionId.Belgen, buildingType: BuildingTypeId.Barracks, x: 50, z: 47, complete: true },
  ],

  units: [
    // Player: 8 workers + 5 infantry + 3 ranged + 2 heavy
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -3, z: -53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -1, z: -53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 1, z: -53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 3, z: -53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: -2, z: -51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 0, z: -51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 2, z: -51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Worker, x: 4, z: -51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 10, z: -53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 10, z: -51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -10, z: -53 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: -10, z: -51 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Infantry, x: 0, z: -49 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 10, z: -49 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: -10, z: -49 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Ranged, x: 0, z: -47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: -5, z: -47 },
    { factionId: FactionId.Randstad, unitType: UnitTypeId.Heavy, x: 5, z: -47 },
    // Brabanders defenders (southwest) — 7 units
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -48, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -45, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -48, z: -22 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -52, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -52, z: -22 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: -47, z: -16 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: -50, z: -24 },
    // Limburgers defenders (northwest) — 7 units
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -48, z: 38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -45, z: 38 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -48, z: 42 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -52, z: 42 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -50, z: 36 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -45, z: 42 },
    { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -52, z: 38 },
    // Belgen defenders (northeast) — 6 units
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 48, z: 38 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 45, z: 38 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 48, z: 42 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 52, z: 38 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 52, z: 42 },
    { factionId: FactionId.Belgen, unitType: UnitTypeId.Heavy, x: 50, z: 36 },
  ],

  goldMines: [
    // Player area
    { x: -8, z: -60, amount: 3500 },
    { x: 8, z: -60, amount: 3500 },
    { x: 0, z: -45, amount: 3000 },
    // Center contested
    { x: 0, z: 0, amount: 4000 },
    { x: -25, z: -25, amount: 2500 },
    { x: 25, z: -15, amount: 2500 },
    // Near enemies
    { x: -45, z: -15, amount: 2000 },
    { x: -45, z: 35, amount: 2000 },
    { x: 45, z: 35, amount: 2000 },
  ],

  treeResources: [
    { x: -12, z: -55, amount: 1200 },
    { x: 12, z: -55, amount: 1200 },
    { x: -15, z: -48, amount: 1000 },
    { x: 15, z: -48, amount: 1000 },
    { x: 0, z: -35, amount: 800 },
    { x: -30, z: 0, amount: 800 },
    { x: 30, z: 10, amount: 800 },
  ],

  objectives: [
    { id: 'r8-destroy-brab', type: 'destroy-building', description: 'Vernietig de Brabantse Boerderij (zuidwest)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Brabanders, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'r8-destroy-limb', type: 'destroy-building', description: 'Vernietig de Limburgse Grottentempel (noordwest)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Limburgers, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'r8-destroy-belg', type: 'destroy-building', description: 'Vernietig het Belgisch Raadhuis (noordoost)', targetValue: 1, isBonus: false, targetFactionId: FactionId.Belgen, targetBuildingType: BuildingTypeId.TownHall },
    { id: 'r8-have-35-units', type: 'have-units-at-end', description: 'Heb 35+ eenheden aan het einde (marktdominantie)', targetValue: 35, isBonus: true },
    { id: 'r8-no-th-loss', type: 'no-townhall-loss', description: 'Verlies je Hoofdkantoor niet', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'r8-intro',
      condition: { type: 'time', seconds: 5 },
      actions: [{ type: 'message', text: 'De CEO: "IPO Day. Drie concurrenten. De beurs wacht. Vernietig elke concurrent en laat de koers stijgen met elk hoofdkwartier dat valt."' }],
      once: true,
    },
    {
      id: 'r8-strategy-tip',
      condition: { type: 'time', seconds: 45 },
      actions: [{ type: 'message', text: 'Strategisch advies: de Belgen (noordoost) zijn het zwakst — begin daar. De Brabanders (zuidwest) zijn dichtbij maar sterk in melee. De Limburgers (noordwest) zijn het gevaarlijkst met hun zware eenheden.' }],
      once: true,
    },
    {
      id: 'r8-brab-raid',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'Brabantse Carnavalvierders! Ze komen vanuit het zuidwesten. Ze ruiken naar bier en worstenbroodjes!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -35, z: -35 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -33, z: -33 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -37, z: -33 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -35, z: -31 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r8-belg-raid',
      condition: { type: 'time', seconds: 300 },
      actions: [
        { type: 'message', text: 'Belgische Bierbouwers naderen vanuit het noordoosten! Ze gooien met pralines!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 35, z: 15 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 33, z: 17 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 37, z: 17 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 35, z: 19 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 33, z: 19 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r8-limb-raid',
      condition: { type: 'time', seconds: 420 },
      actions: [
        { type: 'message', text: 'Limburgse Mergelridders! Zware pantser-eenheden vanuit het noordwesten! Gebruik ranged vuur!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -35, z: 15 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -33, z: 17 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -37, z: 17 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -35, z: 19 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -33, z: 19 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r8-combined-assault',
      condition: { type: 'time', seconds: 600 },
      actions: [
        { type: 'message', text: 'GECOMBINEERDE AANVAL! Alle drie de facties slaan tegelijk toe! De CEO: "Dit is het moment! Wie nu standhoudt, wint de beurs!"' },
        {
          type: 'spawn-units',
          units: [
            // Brabanders van het zuidwesten
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -25, z: -40 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -23, z: -38 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: -27, z: -38 },
            // Limburgers van het noordwesten
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -25, z: 5 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Infantry, x: -23, z: 3 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -27, z: 3 },
            // Belgen van het noordoosten
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 25, z: 5 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 23, z: 3 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 27, z: 3 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r8-late-reinforcements',
      condition: { type: 'time', seconds: 780 },
      actions: [
        { type: 'message', text: 'Laatste vijandelijke versterkingen! De facties geven niet op! Vernietig hun hoofdkwartieren voordat ze nog sterker worden!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Heavy, x: -40, z: -30 },
            { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -38, z: -28 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Heavy, x: -40, z: 30 },
            { factionId: FactionId.Limburgers, unitType: UnitTypeId.Ranged, x: -38, z: 28 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Infantry, x: 40, z: 30 },
            { factionId: FactionId.Belgen, unitType: UnitTypeId.Ranged, x: 38, z: 28 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'r8-victory-msg',
      condition: { type: 'building-destroyed', factionId: FactionId.Belgen, buildingType: BuildingTypeId.TownHall },
      actions: [{ type: 'message', text: 'IPO GESLAAGD! Alle concurrenten zijn uitgeschakeld! De CEO luidt de beursbel. Randstad Corporation is nu de enige macht die ertoe doet.' }],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: true,

  starThresholds: {
    threeStarTime: 900,    // 15 min
    twoStarTime: 1320,     // 22 min
    allBonusesGrants3Stars: true,
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const BRABANDERS_MISSIONS: readonly MissionDefinition[] = [
  MISSION_1_DE_OOGST,
  MISSION_2_EERSTE_SCHERMUTSEL,
  MISSION_3_VERDEDIGING,
  MISSION_4_BINNENDIEZE,
  MISSION_5_HEUVELLAND,
  MISSION_6_BOERENOPSTAND,
  MISSION_7_MARKT,
  MISSION_8_BELEG,
  MISSION_9_RAAD,
  MISSION_10_RAAD,
  MISSION_11_A2,
  MISSION_12_GOUDEN_WORSTENBROODJE,
];

export const LIMBURGERS_MISSIONS: readonly MissionDefinition[] = [
  LIMBURGERS_MISSION_1_EERSTE_SCHACHT,
  LIMBURGERS_MISSION_2_DUISTERNIS_BENEDEN,
  LIMBURGERS_MISSION_3_VLAAIPRODUCTIE,
  LIMBURGERS_MISSION_4_VERRASSINGSAANVAL,
  LIMBURGERS_MISSION_5_MERGELMUREN,
  LIMBURGERS_MISSION_6_TUNNELOORLOG,
  LIMBURGERS_MISSION_7_GROTE_SJTOELGANG,
  LIMBURGERS_MISSION_8_KONINGIN_VAN_DE_MIJN,
];

export const BELGEN_MISSIONS: readonly MissionDefinition[] = [
  MISSION_B1_EERSTE_FRITUUR,
  MISSION_B2_CHOCOLADE_VERDRAG,
  MISSION_B3_COMMISSIEVERGADERING,
  MISSION_B4_WAFELTJESWAR,
  MISSION_B5_FRIETTENT,
  MISSION_B6_DIPLOMATIEK_INCIDENT,
  MISSION_B7_KONVOOI_NAAR_BRUSSEL,
  MISSION_B8_HET_LAATSTE_BIER,
];

export const RANDSTAD_MISSIONS: readonly MissionDefinition[] = [
  RANDSTAD_MISSION_1_EERSTE_VERGADERING,
  RANDSTAD_MISSION_2_CONSULTANCY_RAPPORT,
  RANDSTAD_MISSION_3_VIJANDIGE_OVERNAME,
  RANDSTAD_MISSION_4_GENTRIFICATIE,
  RANDSTAD_MISSION_5_BOARDROOM_BESLISSING,
  RANDSTAD_MISSION_6_MARKTMANIPULATIE,
  RANDSTAD_MISSION_7_REORGANISATIE,
  RANDSTAD_MISSION_8_IPO_DAY,
];

/** All missions across all campaigns. */
const ALL_MISSIONS: readonly MissionDefinition[] = [
  ...BRABANDERS_MISSIONS,
  ...LIMBURGERS_MISSIONS,
  ...BELGEN_MISSIONS,
  ...RANDSTAD_MISSIONS,
];

/** Get a mission by its id. */
export function getMissionById(id: string): MissionDefinition | undefined {
  return ALL_MISSIONS.find(m => m.id === id);
}

/** Get all missions for a campaign. */
export function getCampaignMissions(campaignId: string): readonly MissionDefinition[] {
  return ALL_MISSIONS.filter(m => m.campaignId === campaignId);
}
