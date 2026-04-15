import { describe, it, expect, beforeEach } from 'vitest';
import { MissionSystem, type MissionCallbacks } from '../src/campaign/MissionSystem';
import type { MissionDefinition } from '../src/campaign/MissionDefinitions';
import { FactionId, BuildingTypeId } from '../src/types/index';

// ---------------------------------------------------------------------------
// Helpers: mock mission definitions and callbacks
// ---------------------------------------------------------------------------

function createMinimalMission(overrides: Partial<MissionDefinition> = {}): MissionDefinition {
  return {
    id: 'test-mission',
    campaignId: 'brabanders',
    missionIndex: 1,
    title: 'Test Mission',
    briefingTitle: 'Test Briefing',
    briefingText: 'Test text',
    mapSize: 64,
    startingGold: 100,
    startingGoldAI: 100,
    buildings: [],
    units: [],
    goldMines: [],
    objectives: [
      {
        id: 'obj-gather',
        type: 'gather-gold',
        description: 'Gather 200 gold',
        targetValue: 200,
        isBonus: false,
      },
    ],
    triggers: [],
    waves: [],
    hasAIProduction: false,
    starThresholds: {
      threeStarTime: 120,
      twoStarTime: 300,
      allBonusesGrants3Stars: true,
    },
    ...overrides,
  };
}

function createMockCallbacks(overrides: Partial<MissionCallbacks> = {}): MissionCallbacks {
  return {
    showMessage: () => {},
    spawnUnits: () => [],
    triggerVictory: () => {},
    triggerDefeat: () => {},
    getPlayerGold: () => 100,
    hasPlayerBuilding: () => false,
    getPlayerBuildingCount: () => 0,
    getPlayerArmyCount: () => 0,
    isEnemyBuildingDestroyed: () => false,
    getDestroyedEnemyBuildingCount: () => 0,
    getDestroyedEnemyBuildingCountFiltered: () => 0,
    isEntityAlive: () => true,
    getPlayerWorkerCount: () => 3,
    isPlayerTownHallAlive: () => true,
    getPlayerTotalUnits: () => 6,
    getAITotalUnits: () => 5,
    getPlayerMilitaryTrained: () => 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CampaignManager — MissionSystem Lifecycle', () => {
  let ms: MissionSystem;

  beforeEach(() => {
    ms = new MissionSystem();
  });

  it('starts inactive', () => {
    expect(ms.isActive).toBe(false);
  });

  it('becomes active after start()', () => {
    const mission = createMinimalMission();
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);
    expect(ms.isActive).toBe(true);
  });

  it('becomes inactive after stop()', () => {
    const mission = createMinimalMission();
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);
    ms.stop();
    expect(ms.isActive).toBe(false);
  });

  it('elapsed time starts at 0', () => {
    const mission = createMinimalMission();
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);
    expect(ms.elapsedTime).toBe(0);
  });

  it('elapsed time increments with update()', () => {
    const mission = createMinimalMission();
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);
    ms.update(1.0);
    expect(ms.elapsedTime).toBe(1.0);
    ms.update(0.5);
    expect(ms.elapsedTime).toBe(1.5);
  });
});

describe('CampaignManager — Objective Tracking', () => {
  let ms: MissionSystem;

  beforeEach(() => {
    ms = new MissionSystem();
  });

  it('initializes objective states from mission definition', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather gold', targetValue: 200, isBonus: false },
        { id: 'obj2', type: 'train-units', description: 'Train units', targetValue: 5, isBonus: true },
      ],
    });
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);

    const states = ms.getObjectiveStates();
    expect(states).toHaveLength(2);
    expect(states[0].completed).toBe(false);
    expect(states[0].failed).toBe(false);
    expect(states[1].completed).toBe(false);
  });

  it('gather-gold objective completes when gold reaches target', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({ getPlayerGold: () => 250 });
    ms.start(mission, callbacks, 3);
    ms.update(0.1);

    const states = ms.getObjectiveStates();
    expect(states[0].completed).toBe(true);
    expect(states[0].currentValue).toBe(250);
  });

  it('gather-gold objective stays incomplete below target', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({ getPlayerGold: () => 150 });
    ms.start(mission, callbacks, 3);
    ms.update(0.1);

    const states = ms.getObjectiveStates();
    expect(states[0].completed).toBe(false);
    expect(states[0].currentValue).toBe(150);
  });

  it('destroy-building objective tracks destroyed count', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'destroy-building', description: 'Destroy 2 buildings', targetValue: 2, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({ getDestroyedEnemyBuildingCountFiltered: () => 2 });
    ms.start(mission, callbacks, 3);
    ms.update(0.1);

    expect(ms.getObjectiveStates()[0].completed).toBe(true);
  });

  it('train-units objective tracks military trained count', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'train-units', description: 'Train 5 military units', targetValue: 5, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({ getPlayerMilitaryTrained: () => 5 });
    ms.start(mission, callbacks, 3);
    ms.update(0.1);

    expect(ms.getObjectiveStates()[0].completed).toBe(true);
  });

  it('build-building objective checks for barracks', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'build-building', description: 'Build a barracks', targetValue: 1, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({
      hasPlayerBuilding: (bt: BuildingTypeId) => bt === BuildingTypeId.Barracks,
      getPlayerBuildingCount: (bt: BuildingTypeId) => bt === BuildingTypeId.Barracks ? 1 : 0,
    });
    ms.start(mission, callbacks, 3);
    ms.update(0.1);

    expect(ms.getObjectiveStates()[0].completed).toBe(true);
  });

  it('no-worker-loss objective fails when a worker dies', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'no-worker-loss', description: 'No worker losses', targetValue: 0, isBonus: true },
      ],
    });
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);

    ms.onWorkerLost();
    ms.update(0.1);

    const states = ms.getObjectiveStates();
    expect(states[0].failed).toBe(true);
    expect(states[0].completed).toBe(false);
  });

  it('no-worker-loss objective stays completed with no losses', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'no-worker-loss', description: 'No worker losses', targetValue: 0, isBonus: true },
      ],
    });
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);
    ms.update(0.1);

    expect(ms.getObjectiveStates()[0].completed).toBe(true);
  });

  it('no-townhall-loss objective fails when TownHall is destroyed', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'no-townhall-loss', description: 'Keep TownHall alive', targetValue: 0, isBonus: true },
      ],
    });
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);

    ms.onTownHallLost();
    ms.update(0.1);

    expect(ms.getObjectiveStates()[0].failed).toBe(true);
  });

  it('have-units-at-end objective tracks total units', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'have-units-at-end', description: 'Have 6 units', targetValue: 6, isBonus: true },
      ],
    });
    const callbacks = createMockCallbacks({ getPlayerTotalUnits: () => 8 });
    ms.start(mission, callbacks, 3);
    ms.update(0.1);

    expect(ms.getObjectiveStates()[0].completed).toBe(true);
  });
});

describe('CampaignManager — Victory Conditions', () => {
  let ms: MissionSystem;

  beforeEach(() => {
    ms = new MissionSystem();
  });

  it('does not trigger victory immediately when objectives complete (confirmation delay)', () => {
    let victoryTriggered = false;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => 300,
      triggerVictory: () => { victoryTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    ms.update(0.1); // objectives complete, but delay not yet elapsed
    expect(victoryTriggered).toBe(false);
  });

  it('triggers victory after confirmation delay (0.5s)', () => {
    let victoryTriggered = false;
    let victoryStar = 0;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => 300,
      triggerVictory: (stars) => { victoryTriggered = true; victoryStar = stars; },
    });

    ms.start(mission, callbacks, 3);
    // Run enough updates to pass the 0.5s confirmation delay
    for (let i = 0; i < 10; i++) {
      ms.update(0.1);
    }
    expect(victoryTriggered).toBe(true);
  });

  it('does not trigger victory when TownHall is dead', () => {
    let victoryTriggered = false;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => 300,
      isPlayerTownHallAlive: () => false,
      triggerVictory: () => { victoryTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    for (let i = 0; i < 10; i++) {
      ms.update(0.1);
    }
    expect(victoryTriggered).toBe(false);
  });

  it('requires at least one required objective for auto-victory', () => {
    let victoryTriggered = false;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'no-worker-loss', description: 'No losses', targetValue: 0, isBonus: true },
      ],
    });
    const callbacks = createMockCallbacks({
      triggerVictory: () => { victoryTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    for (let i = 0; i < 20; i++) {
      ms.update(0.1);
    }
    // No required objectives means no auto-victory
    expect(victoryTriggered).toBe(false);
  });

  it('does not double-trigger victory', () => {
    let victoryCount = 0;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => 300,
      triggerVictory: () => { victoryCount++; },
    });

    ms.start(mission, callbacks, 3);
    for (let i = 0; i < 30; i++) {
      ms.update(0.1);
    }
    expect(victoryCount).toBe(1);
  });
});

describe('CampaignManager — Defeat Conditions', () => {
  let ms: MissionSystem;

  beforeEach(() => {
    ms = new MissionSystem();
  });

  it('triggers defeat when TownHall is destroyed (missionIndex > 0)', () => {
    let defeatTriggered = false;
    const mission = createMinimalMission({
      missionIndex: 1,
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({
      isPlayerTownHallAlive: () => false,
      triggerDefeat: () => { defeatTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    ms.update(0.1);
    expect(defeatTriggered).toBe(true);
  });

  it('does NOT trigger defeat for tutorial mission (missionIndex 0)', () => {
    let defeatTriggered = false;
    const mission = createMinimalMission({
      missionIndex: 0,
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({
      isPlayerTownHallAlive: () => false,
      triggerDefeat: () => { defeatTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    ms.update(0.1);
    expect(defeatTriggered).toBe(false);
  });

  it('triggers defeat when all units dead and gold < 50 (after grace period)', () => {
    let defeatTriggered = false;
    const mission = createMinimalMission();
    const callbacks = createMockCallbacks({
      getPlayerTotalUnits: () => 0,
      getPlayerGold: () => 10,
      triggerDefeat: () => { defeatTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    // Advance past the 10s grace period
    for (let i = 0; i < 120; i++) {
      ms.update(0.1);
    }
    expect(defeatTriggered).toBe(true);
  });

  it('does NOT defeat during grace period (first 3 seconds)', () => {
    let defeatTriggered = false;
    const mission = createMinimalMission();
    const callbacks = createMockCallbacks({
      getPlayerTotalUnits: () => 0,
      getPlayerGold: () => 10,
      triggerDefeat: () => { defeatTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    // Only advance 2 seconds (within 3s grace period)
    for (let i = 0; i < 20; i++) {
      ms.update(0.1);
    }
    expect(defeatTriggered).toBe(false);
  });

  it('no defeat if player has enough gold to rebuild (>= 50)', () => {
    let defeatTriggered = false;
    const mission = createMinimalMission();
    const callbacks = createMockCallbacks({
      getPlayerTotalUnits: () => 0,
      getPlayerGold: () => 100,
      triggerDefeat: () => { defeatTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    for (let i = 0; i < 120; i++) {
      ms.update(0.1);
    }
    expect(defeatTriggered).toBe(false);
  });

  it('defeat cancels pending victory', () => {
    let victoryTriggered = false;
    let defeatTriggered = false;
    const mission = createMinimalMission({
      missionIndex: 1,
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => 300,
      isPlayerTownHallAlive: () => false,
      triggerVictory: () => { victoryTriggered = true; },
      triggerDefeat: () => { defeatTriggered = true; },
    });

    ms.start(mission, callbacks, 3);
    for (let i = 0; i < 20; i++) {
      ms.update(0.1);
    }
    expect(defeatTriggered).toBe(true);
    expect(victoryTriggered).toBe(false);
  });
});

describe('CampaignManager — Star Rating', () => {
  let ms: MissionSystem;

  beforeEach(() => {
    ms = new MissionSystem();
  });

  it('awards 3 stars for fast completion', () => {
    let receivedStars = 0;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
      starThresholds: { threeStarTime: 120, twoStarTime: 300, allBonusesGrants3Stars: false },
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => 300,
      triggerVictory: (stars) => { receivedStars = stars; },
    });

    ms.start(mission, callbacks, 3);
    // Complete in 1 second total (well under 120s threshold)
    for (let i = 0; i < 10; i++) {
      ms.update(0.1);
    }
    expect(receivedStars).toBe(3);
  });

  it('awards 2 stars for moderate time', () => {
    let receivedStars = 0;
    // Gold starts below target; after 8s we switch to above-target
    let goldAmount = 100;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
      starThresholds: { threeStarTime: 5, twoStarTime: 300, allBonusesGrants3Stars: false },
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => goldAmount,
      triggerVictory: (stars) => { receivedStars = stars; },
    });

    ms.start(mission, callbacks, 3);
    // Run 8 seconds with gold below target
    for (let i = 0; i < 80; i++) ms.update(0.1);
    // Now provide enough gold — objective completes, victory after 0.5s delay
    goldAmount = 300;
    for (let i = 0; i < 10; i++) ms.update(0.1);
    // Total elapsed: ~9s (over 5s three-star, under 300s two-star)
    expect(receivedStars).toBe(2);
  });

  it('awards 1 star for slow completion', () => {
    let receivedStars = 0;
    let goldAmount = 100;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
      ],
      starThresholds: { threeStarTime: 1, twoStarTime: 2, allBonusesGrants3Stars: false },
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => goldAmount,
      triggerVictory: (stars) => { receivedStars = stars; },
    });

    ms.start(mission, callbacks, 3);
    // Run 8 seconds with gold below target
    for (let i = 0; i < 80; i++) ms.update(0.1);
    // Now provide enough gold — objective completes, victory after 0.5s delay
    goldAmount = 300;
    for (let i = 0; i < 10; i++) ms.update(0.1);
    // Total elapsed: ~9s (over both thresholds 1s and 2s)
    expect(receivedStars).toBe(1);
  });

  it('awards 3 stars when all bonuses completed (if allBonusesGrants3Stars)', () => {
    let receivedStars = 0;
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'gather-gold', description: 'Gather 200 gold', targetValue: 200, isBonus: false },
        { id: 'obj2', type: 'no-worker-loss', description: 'No losses', targetValue: 0, isBonus: true },
      ],
      starThresholds: { threeStarTime: 1, twoStarTime: 2, allBonusesGrants3Stars: true },
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => 300,
      triggerVictory: (stars) => { receivedStars = stars; },
    });

    ms.start(mission, callbacks, 3);
    // Complete after ~10 seconds (slow, but all bonuses done)
    for (let i = 0; i < 110; i++) {
      ms.update(0.1);
    }
    expect(receivedStars).toBe(3);
  });
});

describe('CampaignManager — Wave Management', () => {
  let ms: MissionSystem;

  beforeEach(() => {
    ms = new MissionSystem();
  });

  it('wave progress starts at 0 defeated', () => {
    const mission = createMinimalMission({
      waves: [
        { index: 0, spawnTime: 10, units: [], message: 'Wave 1' },
        { index: 1, spawnTime: 20, units: [], message: 'Wave 2' },
      ],
    });
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);

    const progress = ms.getWaveProgress();
    expect(progress.total).toBe(2);
    expect(progress.defeated).toBe(0);
    expect(progress.currentWaveActive).toBe(false);
  });

  it('survive-waves objective tracks defeated waves', () => {
    const mission = createMinimalMission({
      objectives: [
        { id: 'obj1', type: 'survive-waves', description: 'Survive 2 waves', targetValue: 2, isBonus: false },
      ],
      waves: [
        { index: 0, spawnTime: 0, units: [{ factionId: FactionId.Randstad, unitType: 1, x: 10, z: 10 }] },
        { index: 1, spawnTime: 5, units: [{ factionId: FactionId.Randstad, unitType: 1, x: 10, z: 10 }] },
      ],
    });
    const callbacks = createMockCallbacks();
    ms.start(mission, callbacks, 3);
    ms.update(0.1);

    // Waves not spawned via triggers yet, so objective is incomplete
    expect(ms.getObjectiveStates()[0].completed).toBe(false);
  });
});

describe('CampaignManager — Trigger System', () => {
  let ms: MissionSystem;

  beforeEach(() => {
    ms = new MissionSystem();
  });

  it('fires time-based trigger at correct time', () => {
    let messageShown = '';
    const mission = createMinimalMission({
      triggers: [
        {
          id: 'trigger-1',
          condition: { type: 'time', seconds: 5 },
          actions: [{ type: 'message', text: 'Five seconds passed!' }],
          once: true,
        },
      ],
    });
    const callbacks = createMockCallbacks({
      showMessage: (text) => { messageShown = text; },
    });

    ms.start(mission, callbacks, 3);
    // 4 seconds: trigger should not fire
    for (let i = 0; i < 40; i++) ms.update(0.1);
    expect(messageShown).toBe('');

    // 2 more seconds (total ~6, safely past 5s threshold accounting for float imprecision)
    for (let i = 0; i < 20; i++) ms.update(0.1);
    expect(messageShown).toBe('Five seconds passed!');
  });

  it('once trigger only fires once', () => {
    let messageCount = 0;
    const mission = createMinimalMission({
      triggers: [
        {
          id: 'trigger-once',
          condition: { type: 'time', seconds: 1 },
          actions: [{ type: 'message', text: 'Hello' }],
          once: true,
        },
      ],
    });
    const callbacks = createMockCallbacks({
      showMessage: () => { messageCount++; },
    });

    ms.start(mission, callbacks, 3);
    for (let i = 0; i < 50; i++) ms.update(0.1);
    expect(messageCount).toBe(1);
  });

  it('gold-reached trigger fires when gold is sufficient', () => {
    let triggered = false;
    const mission = createMinimalMission({
      triggers: [
        {
          id: 'gold-trigger',
          condition: { type: 'gold-reached', amount: 150 },
          actions: [{ type: 'message', text: 'Rich!' }],
          once: true,
        },
      ],
    });
    const callbacks = createMockCallbacks({
      getPlayerGold: () => 200,
      showMessage: () => { triggered = true; },
    });

    ms.start(mission, callbacks, 3);
    ms.update(0.1);
    expect(triggered).toBe(true);
  });

  it('building-built trigger fires when building exists', () => {
    let triggered = false;
    const mission = createMinimalMission({
      triggers: [
        {
          id: 'build-trigger',
          condition: { type: 'building-built', buildingType: BuildingTypeId.Barracks },
          actions: [{ type: 'message', text: 'Barracks built!' }],
          once: true,
        },
      ],
    });
    const callbacks = createMockCallbacks({
      hasPlayerBuilding: (bt: BuildingTypeId) => bt === BuildingTypeId.Barracks,
      showMessage: () => { triggered = true; },
    });

    ms.start(mission, callbacks, 3);
    ms.update(0.1);
    expect(triggered).toBe(true);
  });

  it('army-count trigger fires when army is large enough', () => {
    let triggered = false;
    const mission = createMinimalMission({
      triggers: [
        {
          id: 'army-trigger',
          condition: { type: 'army-count', count: 5 },
          actions: [{ type: 'message', text: 'Army ready!' }],
          once: true,
        },
      ],
    });
    const callbacks = createMockCallbacks({
      getPlayerArmyCount: () => 6,
      showMessage: () => { triggered = true; },
    });

    ms.start(mission, callbacks, 3);
    ms.update(0.1);
    expect(triggered).toBe(true);
  });

  it('update does nothing when not active', () => {
    ms.update(1.0);
    expect(ms.elapsedTime).toBe(0);
  });
});
