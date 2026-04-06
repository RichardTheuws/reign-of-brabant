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
// Missie 4: "De Binnendieze" (Stealth commando — no base building)
// ---------------------------------------------------------------------------

const MISSION_4_BINNENDIEZE: MissionDefinition = {
  id: 'brabant-4-de-binnendieze',
  campaignId: 'brabanders',
  missionIndex: 3,
  title: 'De Binnendieze',
  briefingTitle: 'Missie 4: De Binnendieze',
  briefingText:
    'Den Bosch. Het hart van Brabant. Volgens onze Belgische vrienden ligt hier ergens ' +
    'een geheim Randstad-archief met de blauwdruk van "Project Gentrificatie".\n\n' +
    'De stad is zwaar bewaakt, maar Den Bosch heeft een geheim: de Binnendieze — een ' +
    'ondergrondse watergang die zich door de hele stad slingert.\n\n' +
    'Stuur je Kansen-spionnen door de tunnels. Vind het archief. Vernietig de bewaking. ' +
    'En kom levend terug.',

  mapSize: 96,
  startingGold: 0,
  startingGoldAI: 0,

  buildings: [
    // No player Town Hall — this is a commando mission
    // Enemy: archief (TownHall as proxy) + 2 outposts (Barracks)
    { factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall, x: 30, z: 30, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: 10, z: -15, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: -15, z: 20, complete: true },
  ],

  units: [
    // Player: 3 Kansen (Ranged) + 2 Carnavalvierders (backup)
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -38, z: -38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -36, z: -38 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Ranged, x: -37, z: -36 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -40, z: -36 },
    { factionId: FactionId.Brabanders, unitType: UnitTypeId.Infantry, x: -40, z: -38 },
    // Enemy: patrols and defenders
    // Outpost 1 guards
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 8, z: -13 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 12, z: -17 },
    // Outpost 2 guards
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -17, z: 18 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -13, z: 22 },
    // Archief heavy guard
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 28, z: 28 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 32, z: 28 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 30, z: 32 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 28, z: 32 },
    // Roaming patrol
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 0, z: 0 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 2, z: 0 },
  ],

  goldMines: [], // No economy in commando mission

  objectives: [
    { id: 'destroy-archief', type: 'destroy-building', description: 'Vernietig het Randstad-archief', targetValue: 1, isBonus: false },
    { id: 'destroy-outposts', type: 'destroy-building', description: 'Vernietig de 2 bevoorradingsdepots', targetValue: 2, isBonus: true },
    { id: 'keep-team-alive', type: 'have-units-at-end', description: 'Houd je hele commando-team in leven', targetValue: 6, isBonus: true },
  ],

  triggers: [
    {
      id: 'start-narrator',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'De Sint-Janskathedraal torent boven je uit in het maanlicht. Ergens in deze stad liggen de antwoorden.' }],
      once: true,
    },
    {
      id: 'tip-stealth',
      condition: { type: 'time', seconds: 15 },
      actions: [{ type: 'message', text: 'Gebruik je Kansen om vijanden uit te schakelen voordat ze alarm slaan. Neem de depots uit om de verdediging te verzwakken.' }],
      once: true,
    },
    {
      id: 'alarm-reinforcements',
      condition: { type: 'time', seconds: 180 },
      actions: [
        { type: 'message', text: 'ALARM! De Randstad stuurt versterkingen! Haast je naar het archief!' },
        {
          type: 'spawn-units',
          units: [
            { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 40, z: 40 },
            { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 42, z: 38 },
            { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 38, z: 42 },
            { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 40, z: 42 },
          ],
        },
      ],
      once: true,
    },
    {
      id: 'victory-archief',
      condition: { type: 'building-destroyed', factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Documenten gevonden! "Project Gentrificatie — Elke stad een Vinex-wijk, elke kroeg een Starbucks." Dit is veel groter dan een Worstenbroodje...' },
        { type: 'victory' },
      ],
      once: true,
    },
  ],

  waves: [],
  hasAIProduction: false,

  starThresholds: {
    threeStarTime: 180,  // 3 min — stealth speed run
    twoStarTime: 360,    // 6 min
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
        ...createWaveUnits(6, UnitTypeId.Infantry, LIMBURG_SPAWN_X, LIMBURG_SPAWN_Z, 4),
        ...createWaveUnits(2, UnitTypeId.Ranged, LIMBURG_SPAWN_X + 3, LIMBURG_SPAWN_Z + 3, 2),
      ],
      message: 'Limburgse Test 1 van 3',
    },
    // Test 2 (T=270s): 4 Infantry (heavy) + 4 Ranged + 2 Infantry flanking
    {
      index: 1,
      spawnTime: 270,
      units: [
        ...createWaveUnits(6, UnitTypeId.Infantry, LIMBURG_SPAWN_X, LIMBURG_SPAWN_Z - 5, 4),
        ...createWaveUnits(4, UnitTypeId.Ranged, LIMBURG_SPAWN_X, LIMBURG_SPAWN_Z + 5, 3),
        // Flank from south
        ...createWaveUnits(2, UnitTypeId.Infantry, 0, LIMBURG_SPAWN_X, 2),
      ],
      message: 'Limburgse Test 2 van 3',
    },
    // Test 3 (T=450s): The Mijnbaas + elite — 10 Infantry + 5 Ranged
    {
      index: 2,
      spawnTime: 450,
      units: [
        ...createWaveUnits(10, UnitTypeId.Infantry, LIMBURG_SPAWN_X, LIMBURG_SPAWN_Z, 6),
        ...createWaveUnits(5, UnitTypeId.Ranged, LIMBURG_SPAWN_X + 5, LIMBURG_SPAWN_Z, 4),
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
    { factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall, x: 45, z: 45, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: 37, z: 45, complete: true },
    // 3 "tractor" outposts (Barracks as proxy for confiscated tractors)
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: 0, z: -20, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: -20, z: 15, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: 20, z: 5, complete: true },
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
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -2, z: -22 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 2, z: -22 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 0, z: -18 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 0, z: -24 },
    // Tractor outpost 2 guards (west)
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -22, z: 13 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -18, z: 13 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -20, z: 17 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: -20, z: 11 },
    // Tractor outpost 3 guards (east)
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 18, z: 3 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 22, z: 3 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 20, z: 7 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 20, z: 1 },
    // Main garrison defenders
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 43, z: 43 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 47, z: 43 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 43, z: 47 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 47, z: 47 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 45, z: 43 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 45, z: 47 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 40, z: 45 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 50, z: 45 },
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
      condition: { type: 'building-destroyed', factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall },
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
    { id: 'survive-raids', type: 'survive-waves', description: 'Overleef alle 3 Randstad-raids', targetValue: 3, isBonus: true },
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
// Missie 8: "Het Beleg van Eindhansen" (Full siege warfare)
// ---------------------------------------------------------------------------

const MISSION_8_BELEG: MissionDefinition = {
  id: 'brabant-8-het-beleg-van-eindhansen',
  campaignId: 'brabanders',
  missionIndex: 7,
  title: 'Het Beleg van Eindhansen',
  briefingTitle: 'Missie 8: Het Beleg van Eindhansen',
  briefingText:
    'Eindhansen — ooit het technologisch hart van Brabant. Maar de Randstad heeft er een ' +
    'vesting van gemaakt. Bewakingscamera\'s op elke hoek, vergaderzalen in elke straat, ' +
    'en ergste van alles: de friettenten zijn vervangen door sushi-bars.\n\n' +
    'De Prins van Brabansen leidt het offensief. "Mansen, dit is het moment. We gansen ' +
    'die bureaucraten eruit jansen!" Twee aanvalsroutes zijn beschikbaar: frontaal via ' +
    'de snelweg, of sluipend door het Stratumseind.\n\n' +
    'Verover Eindhansen. Voor de friet. Voor Brabant.',

  mapSize: 96,
  startingGold: 350,
  startingGoldAI: 800,

  buildings: [
    // Player: base in SW
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.TownHall, x: -38, z: -38, complete: true },
    { factionId: FactionId.Brabanders, buildingType: BuildingTypeId.Barracks, x: -30, z: -38, complete: true },
    // Enemy: fortified base in NE
    { factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall, x: 38, z: 38, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: 30, z: 38, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: 38, z: 30, complete: true },
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
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 36, z: 36 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 40, z: 36 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 36, z: 40 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 40, z: 40 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 38, z: 34 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 34, z: 38 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 38, z: 42 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 42, z: 38 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 36, z: 42 },
    // Barracks 1 guards
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 28, z: 36 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 32, z: 36 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 30, z: 40 },
    // Barracks 2 guards
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 36, z: 28 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 40, z: 28 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 38, z: 32 },
    // Forward patrol in center
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 10, z: 10 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 12, z: 8 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 8, z: 12 },
  ],

  goldMines: [
    { x: -35, z: -25, amount: 3000 },
    { x: -25, z: -38, amount: 2500 },
    { x: 0, z: -10, amount: 2000 },
    { x: 35, z: 25, amount: 2000 }, // Near enemy — risky
  ],

  objectives: [
    { id: 'destroy-eindhansen-th', type: 'destroy-building', description: 'Vernietig het Randstad-hoofdkantoor in Eindhansen', targetValue: 1, isBonus: false },
    { id: 'no-th-loss', type: 'no-townhall-loss', description: 'Houd de Prins in leven (verlies je Boerderij niet)', targetValue: 0, isBonus: true },
    { id: 'train-15-units', type: 'train-units', description: 'Train 15 extra eenheden', targetValue: 15, isBonus: true },
  ],

  triggers: [
    {
      id: 'prins-speech',
      condition: { type: 'time', seconds: 3 },
      actions: [{ type: 'message', text: 'Prins van Brabansen: "Kansen! Carnavalvierders! Vandansen nansen wansen da\'t vansen Brabansen ansen!" *[vrij vertaald: vandaag bevrijden we onze stad]*' }],
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
        { type: 'message', text: 'Randstad-versterkingen arriveren vanuit het noorden! Ze geven Eindhansen niet zomaar op!' },
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
      id: 'victory-eindhansen',
      condition: { type: 'building-destroyed', factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'Eindhansen is bevrijd! De Prins plant de Brabantse vlag op het dak van het hoofdkantoor. "En als eerste maatregel: alle sushi-bars worden weer friettenten!"' },
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
// Missie 9: "De Brabantse Nansen" (Epic two-front finale)
// ---------------------------------------------------------------------------

const M9_NE_BASE_X = 42;
const M9_NE_BASE_Z = 42;
const M9_NW_BASE_X = -42;
const M9_NW_BASE_Z = 42;

const MISSION_9_NANSEN: MissionDefinition = {
  id: 'brabant-9-de-brabantse-nansen',
  campaignId: 'brabanders',
  missionIndex: 8,
  title: 'De Brabantse Nansen',
  briefingTitle: 'Missie 9: De Brabantse Nansen',
  briefingText:
    'Dit is het. De CEO van de Randstad Ontwikkelingsmaatschappij heeft zijn laatste troef ' +
    'gespeeld. Twee legers marcheren naar het hart van Brabant — een vanuit het noordoosten, ' +
    'een vanuit het noordwesten. Pincerbeweging. Klassiek management-tactiek.\n\n' +
    'Maar wij hebben iets wat zij niet hebben: de Prins van Brabansen EN de Boer van Brabansen. ' +
    'Twee helden, een volk, en genoeg worstenbroodjes om een maand te overleven.\n\n' +
    '"Jansen, mansen, het is tijd voor de Brabantse Nansen! Ze gansen allebei eransen!" ' +
    '— Prins van Brabansen\n\n' +
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
    { factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall, x: M9_NE_BASE_X, z: M9_NE_BASE_Z, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: M9_NE_BASE_X - 8, z: M9_NE_BASE_Z, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: M9_NE_BASE_X, z: M9_NE_BASE_Z - 8, complete: true },
    // Enemy base 2: NW
    { factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall, x: M9_NW_BASE_X, z: M9_NW_BASE_Z, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: M9_NW_BASE_X + 8, z: M9_NW_BASE_Z, complete: true },
    { factionId: FactionId.AI, buildingType: BuildingTypeId.Barracks, x: M9_NW_BASE_X, z: M9_NW_BASE_Z - 8, complete: true },
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
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 40, z: 40 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 44, z: 40 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 40, z: 44 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 44, z: 44 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 38, z: 42 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 42, z: 46 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 46, z: 42 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 42, z: 38 },
    // NW base defenders
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -40, z: 40 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -44, z: 40 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -40, z: 44 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -44, z: 44 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -38, z: 42 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: -42, z: 46 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: -46, z: 42 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: -42, z: 38 },
    // Forward scouting parties (center map)
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: 15, z: 10 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Infantry, x: -15, z: 10 },
    { factionId: FactionId.AI, unitType: UnitTypeId.Ranged, x: 0, z: 15 },
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
      condition: { type: 'building-destroyed', factionId: FactionId.AI, buildingType: BuildingTypeId.TownHall },
      actions: [
        { type: 'message', text: 'BEIDE BASISSEN VERNIETIGD! De CEO vlucht in een Uber! "Ik ga naar een coworking space in Bali!" Brabant is gered! De Prins en de Boer omhelzen elkaar. Vandaag is een dag die nooit vergeten wordt.' },
        { type: 'victory' },
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
  MISSION_9_NANSEN,
];

/** Get a mission by its id. */
export function getMissionById(id: string): MissionDefinition | undefined {
  return BRABANDERS_MISSIONS.find(m => m.id === id);
}

/** Get all missions for a campaign. */
export function getCampaignMissions(campaignId: string): readonly MissionDefinition[] {
  return BRABANDERS_MISSIONS.filter(m => m.campaignId === campaignId);
}
