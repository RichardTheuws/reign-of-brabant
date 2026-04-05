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
import type { GoldMineSpawn } from '../types/index';

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

export type ObjectiveType = 'gather-gold' | 'destroy-building' | 'survive-waves' | 'train-units' | 'build-building' | 'no-worker-loss' | 'no-townhall-loss' | 'have-units-at-end';

export interface MissionObjective {
  readonly id: string;
  readonly type: ObjectiveType;
  readonly description: string;
  readonly targetValue: number;
  readonly isBonus: boolean;
}

export type TriggerCondition =
  | { type: 'time'; seconds: number }
  | { type: 'gold-reached'; amount: number }
  | { type: 'building-built'; buildingType: BuildingTypeId }
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
  readonly buildings: readonly MissionBuildingSpawn[];
  readonly units: readonly MissionUnitSpawn[];
  readonly goldMines: readonly GoldMineSpawn[];
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
}

// ---------------------------------------------------------------------------
// Missie 1: "De Oogst" (Tutorial)
// ---------------------------------------------------------------------------

const MISSION_1_DE_OOGST: MissionDefinition = {
  id: 'brabant-1-de-oogst',
  campaignId: 'brabanders',
  missionIndex: 0,
  title: 'De Oogst',
  briefingTitle: 'Missie 1: De Oogst',
  briefingText:
    'Welkom in Reusel, het hart van Brabant. Het is een rustige ochtend — de vogels zingen, ' +
    'de koeien loeien, en de geur van versgebakken worstenbroodjes hangt in de lucht.\n\n' +
    'Jij bent de nieuwe opzichter van de boerderij. Leer de basis: verzamel grondstoffen, ' +
    'beheer je boeren, en bescherm het dorp tegen onverwachte gasten.\n\n' +
    'Niets kan deze dag verpesten... toch?',

  mapSize: 64,
  startingGold: 0,
  startingGoldAI: 0,

  buildings: [
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -20, z: -20, complete: true },
  ],

  units: [
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -17, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -15, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -13, z: -18 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -17, z: -16 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -15, z: -16 },
  ],

  goldMines: [
    { x: -10, z: -20, amount: 1500 },
    { x: -20, z: -10, amount: 1500 },
  ],

  objectives: [
    { id: 'gather-500', type: 'gather-gold', description: 'Verzamel 500 goud', targetValue: 500, isBonus: false },
    { id: 'no-worker-loss', type: 'no-worker-loss', description: 'Verlies geen boeren', targetValue: 0, isBonus: true },
  ],

  triggers: [
    {
      id: 'tip-60s',
      condition: { type: 'time', seconds: 60 },
      actions: [{ type: 'message', text: 'Goed bezig! Stuur je Boeren naar de goudmijnen om sneller goud te verzamelen.' }],
      once: true,
    },
    {
      id: 'wolf-spawn',
      condition: { type: 'time', seconds: 120 },
      actions: [
        { type: 'message', text: 'Wolven gesignaleerd bij de rand van het dorp! Bescherm je boeren!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 25, z: 25 },
            { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 27, z: 23 },
            { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 23, z: 27 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'victory-gold',
      condition: { type: 'gold-reached', amount: 500 },
      actions: [
        { type: 'message', text: 'Uitstekend! Je hebt voldoende goud verzameld. De oogst is binnen!' },
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
// Missie 2: "De Eerste Schermutsel"
// ---------------------------------------------------------------------------

const MISSION_2_EERSTE_SCHERMUTSEL: MissionDefinition = {
  id: 'brabant-2-eerste-schermutsel',
  campaignId: 'brabanders',
  missionIndex: 1,
  title: 'De Eerste Schermutsel',
  briefingTitle: 'Missie 2: De Eerste Schermutsel',
  briefingText:
    'Onbekende indringers zijn gesignaleerd aan de rand van het dorp. Ze dragen pakken en ' +
    'praten over "synergien" en "kwartaalcijfers". Dit zijn geen gewone reizigers.\n\n' +
    'Bouw een Kazerne en train soldaten om het dorp te verdedigen. De vijand heeft een ' +
    'klein kamp opgeslagen in het noordoosten — vernietig hun Hoofdkantoor!\n\n' +
    'Brabant rekent op je.',

  mapSize: 96,
  startingGold: 200,
  startingGoldAI: 0,

  buildings: [
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -35, z: -35, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall, x: 35, z: 35, complete: true },
  ],

  units: [
    // Player: 3 workers
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -32, z: -33 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -30, z: -33 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Worker, x: -28, z: -33 },
    // Enemy: 3 infantry (static defenders, no AI production)
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 33, z: 33 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 35, z: 37 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 37, z: 35 },
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
      actions: [{ type: 'message', text: 'Bouw een Kazerne om soldaten te trainen. Selecteer een Boer en druk B.' }],
      once: true,
    },
    {
      id: 'barracks-built',
      condition: { type: 'building-built', buildingType: BuildingTypeId.Barracks },
      actions: [{ type: 'message', text: 'Goed! De Kazerne staat. Train nu Carnavalvierders om de vijand aan te vallen.' }],
      once: true,
    },
    {
      id: 'army-3',
      condition: { type: 'army-count', count: 3 },
      actions: [{ type: 'message', text: 'Je leger groeit! Tijd om de vijand aan te vallen. Klik rechts op het vijandelijke gebouw.' }],
      once: true,
    },
    {
      id: 'victory-destroy',
      condition: { type: 'building-destroyed', factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall },
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

function createWaveUnits(count: number, type: UnitTypeId, baseX: number, baseZ: number, spread: number): MissionUnitSpawn[] {
  const units: MissionUnitSpawn[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    units.push({
      factionId: FactionId.AI,
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
      actions: [{ type: 'message', text: 'De vijand komt eraan! Bouw extra Kazernes en train zo snel mogelijk eenheden.' }],
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
// Exports
// ---------------------------------------------------------------------------

export const BRABANDERS_MISSIONS: readonly MissionDefinition[] = [
  MISSION_1_DE_OOGST,
  MISSION_2_EERSTE_SCHERMUTSEL,
  MISSION_3_VERDEDIGING,
];

/** Get a mission by its id. */
export function getMissionById(id: string): MissionDefinition | undefined {
  return BRABANDERS_MISSIONS.find(m => m.id === id);
}

/** Get all missions for a campaign. */
export function getCampaignMissions(campaignId: string): readonly MissionDefinition[] {
  return BRABANDERS_MISSIONS.filter(m => m.campaignId === campaignId);
}
