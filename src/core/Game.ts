/**
 * Game.ts -- Main orchestrator that wires all systems together.
 *
 * This is the integration layer: it creates the ECS world, generates the map,
 * spawns entities, initializes renderers, connects input to commands,
 * and runs the system pipeline each frame.
 */

import * as THREE from 'three';
import { addEntity, addComponent, hasComponent, query, entityExists } from 'bitecs';

import { world, resetGameWorld } from '../ecs/world';
import { Position, Faction, Health, Attack, Armor, Movement, UnitType, UnitAI, Gatherer, Visibility, Building, Resource, Selected, Production, Rotation, GezeligheidBonus, Hero, HeroAbilities, RallyPoint, StatBuff, Stunned, Invincible } from '../ecs/components';
import { IsUnit, IsBuilding, IsResource, IsWorker, IsDead, IsHero } from '../ecs/tags';
import { FactionId, UnitTypeId, BuildingTypeId, HeroTypeId, UpgradeId, ResourceType, MAP_SIZE, MAP_SIZES, RESOURCE_PRESETS, UnitAIState, NO_PRODUCTION, NO_ENTITY, HERO_POPULATION_COST, type UnitArchetype, type MapSizeOption, type ResourcePreset } from '../types/index';
import { UNIT_ARCHETYPES, RANDSTAD_UNIT_ARCHETYPES, LIMBURGERS_UNIT_ARCHETYPES, BELGEN_UNIT_ARCHETYPES, BUILDING_ARCHETYPES } from '../entities/archetypes';
import { HERO_ARCHETYPES, getHeroTypesForFaction, getHeroArchetype } from '../entities/heroArchetypes';
import { getFactionUnitArchetype, getDisplayBuildingName, getDisplayUnitName, getDisplayUpgradeName } from '../data/factionData';
import { getPortraitUrl } from '../data/portraitMap';
import { createHero, isHeroActive } from '../entities/heroFactory';
import { createGamePipeline, type SystemPipeline } from '../systems/SystemPipeline';
import { generateMap, type GeneratedMap, DecoType } from '../world/MapGenerator';
import { remapMapPlayerFaction } from '../world/factionRemap';
import { checkBuildingAffordability, chargeBuildingCost } from '../world/buildingCost';
import { createMapTunnelSystem } from '../systems/MapTunnelSystem';
import { queueCommand } from '../systems/CommandSystem';
import { NavMeshManager } from '../pathfinding/NavMeshManager';
import { AISystem } from '../ai/AISystem';
import { gameConfig } from '../core/GameConfig';
import { UnitRenderer } from '../rendering/UnitRenderer';
import { BuildingRenderer } from '../rendering/BuildingRenderer';
import { PropRenderer } from '../rendering/PropRenderer';
import { SelectionRenderer, type SelectionData } from '../rendering/SelectionRenderer';
import { TowerRangeRenderer } from '../rendering/TowerRangeRenderer';
import { FogOfWarRenderer } from '../rendering/FogOfWarRenderer';
import { visionData } from '../systems/VisionSystem';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import { findEntityAtPosition } from '../core/entityPicking';
import { spawnBuildingEntity } from '../entities/buildingSpawn';
import { HUD, type SelectedUnit, type CommandAction, type HeroAbilityData, type BuildingCardData, type BuildingCardAction } from '../ui/HUD';
import { activateCarnavalsrage, getCarnavalsrageState, getCarnavalsrageConfig, resetAbilitySystem } from '../systems/AbilitySystem';
import { activateHeroAbility, resetHeroSystem } from '../systems/HeroSystem';
import { resetBureaucracy, activateBoardroom, isBoardroomReady, boardroomBuff } from '../systems/BureaucracySystem';
import {
  activateSprintMode, isSprintModeReady, getSprintModeState, SPRINT_MODE_COST,
  activateDeadlineCrunch, isDeadlineCrunchReady, getDeadlineCrunchState, DEADLINE_CRUNCH_COST,
  resetHavermoutmelkBuffs,
} from '../systems/HavermoutmelkSystem';
import {
  activateTrakteerronde, isTrakteerrondeReady, getTrakteerrondeState,
  TRAKTEERRONDE_COST, resetWorstenbroodjeskraamBuffs,
} from '../systems/WorstenbroodjeskraamSystem';
import { resetUpgradeBuildingPassives } from '../systems/UpgradeBuildingPassivesSystem';
import {
  activateCarnavalsoptocht, isCarnavalsoptochtReady, getCarnavalsoptochtState,
  CARNAVALSOPTOCHT_COST, resetCarnavalsoptocht,
} from '../systems/CarnavalsoptochtSystem';
import { resetDiplomacy } from '../systems/DiplomacySystem';
import { audioManager } from '../audio/AudioManager';
import { playUnitVoice } from '../audio/UnitVoices';
import { techTreeSystem, UPGRADE_DEFINITIONS, getUpgradeDefinition } from '../systems/TechTreeSystem';
import { TOWER_RANGE, TOWER_DAMAGE, TOWER_ATTACK_SPEED } from '../systems/TowerSystem';
import { validateBuildingPlacement } from '../systems/BuildSystem';
import { createMusicSystem, type MusicSystem } from '../systems/MusicSystem';
import { getUpkeepPerTick, resetUpkeepTimers } from '../systems/UpkeepSystem';
import { MissionSystem, type MissionCallbacks } from '../campaign/MissionSystem';
import { getMissionById, type MissionDefinition, type MissionUnitSpawn } from '../campaign/MissionDefinitions';
import type { Terrain } from '../world/Terrain';
import type { RTSCamera } from '../camera/RTSCamera';
import type { EventBus as EventBusType } from '../core/EventBus';
import type { ParticleSystem } from '../rendering/ParticleSystem';
import { initAbilityEffects } from '../rendering/AbilityEffects';

const MINIMAP_COLORS: Record<number, string> = {
  [FactionId.Brabanders]: '#FF8C00',
  [FactionId.Randstad]: '#4DA6FF',
  [FactionId.Limburgers]: '#44CC44',
  [FactionId.Belgen]: '#FF4060',
};

const FACTION_DEATH_COLORS: Record<number, number> = {
  [FactionId.Brabanders]: 0xe67e22,
  [FactionId.Randstad]: 0x4a4a5a,
  [FactionId.Limburgers]: 0x3a7d32,
  [FactionId.Belgen]: 0xa01030,
};

function unitTypeName(unitType: number): 'worker' | 'infantry' | 'ranged' | 'heavy' | 'siege' | 'support' {
  if (unitType === UnitTypeId.Worker) return 'worker';
  if (unitType === UnitTypeId.Ranged) return 'ranged';
  if (unitType === UnitTypeId.Heavy) return 'heavy';
  if (unitType === UnitTypeId.Siege) return 'siege';
  if (unitType === UnitTypeId.Support) return 'support';
  return 'infantry';
}

/** UpgradeIds that the Blacksmith hosts (universal T1/T2 combat/armor/speed). */
const BLACKSMITH_UPGRADE_IDS: ReadonlySet<number> = new Set([
  UpgradeId.MeleeAttack1, UpgradeId.MeleeAttack2,
  UpgradeId.RangedAttack1, UpgradeId.RangedAttack2,
  UpgradeId.ArmorUpgrade1, UpgradeId.ArmorUpgrade2,
  UpgradeId.MoveSpeed1,
]);

function isBlacksmithUpgrade(id: number): boolean {
  return BLACKSMITH_UPGRADE_IDS.has(id);
}

/**
 * T1 is auto-hidden once its T2 (e.g. Zwaardvechten II) is researched —
 * the T1 cost-tier is irrelevant after that and the panel slot is reclaimed.
 */
function isObsoleteT1(id: number): boolean {
  const t1ToT2 = new Map<UpgradeId, UpgradeId>([
    [UpgradeId.MeleeAttack1, UpgradeId.MeleeAttack2],
    [UpgradeId.RangedAttack1, UpgradeId.RangedAttack2],
    [UpgradeId.ArmorUpgrade1, UpgradeId.ArmorUpgrade2],
  ]);
  const t2 = t1ToT2.get(id as UpgradeId);
  if (t2 === undefined) return false;
  return techTreeSystem.isResearched(/* any faction works in single-player */ 0, t2)
      || techTreeSystem.isResearched(1, t2)
      || techTreeSystem.isResearched(2, t2)
      || techTreeSystem.isResearched(3, t2);
}

/** Human-readable prerequisite label for the locked-state tooltip. */
function getPrereqText(def: { prerequisite: UpgradeId | null; requiresUpgradeBuilding?: boolean }): string | undefined {
  const parts: string[] = [];
  if (def.prerequisite !== null) {
    try { parts.push(getUpgradeDefinition(def.prerequisite).name); } catch { /* ignore */ }
  }
  if (def.requiresUpgradeBuilding) parts.push('UpgradeBuilding voltooid');
  return parts.length > 0 ? parts.join(' + ') : undefined;
}

function buildUpgradeRow(
  def: { id: number; name: string; description: string; cost: { gold: number }; prerequisite: UpgradeId | null; requiresUpgradeBuilding?: boolean },
  factionId: FactionId,
  ps: typeof playerState,
) {
  return {
    id: def.id as number,
    name: def.name,
    description: def.description,
    costGold: def.cost.gold,
    canAfford: ps.canAfford(factionId, def.cost.gold),
    canResearch: techTreeSystem.canResearch(factionId, def.id, world),
    isResearched: techTreeSystem.isResearched(factionId, def.id),
    prereqText: getPrereqText(def),
  };
}

/** UpgradeIds that the UpgradeBuilding hosts: T3 universal + the faction-unique research. */
function upgradeBuildingResearchIds(factionId: FactionId): UpgradeId[] {
  const ids: UpgradeId[] = [
    UpgradeId.MeleeAttack3, UpgradeId.RangedAttack3,
    UpgradeId.ArmorUpgrade3, UpgradeId.MoveSpeed2,
  ];
  if (factionId === FactionId.Brabanders)  ids.push(UpgradeId.Carnavalsvuur);
  if (factionId === FactionId.Randstad)    ids.push(UpgradeId.AIOptimization);
  if (factionId === FactionId.Limburgers)  ids.push(UpgradeId.Mergelharnas);
  if (factionId === FactionId.Belgen)      ids.push(UpgradeId.DiamantgloeiendeWapens);
  return ids;
}

export class Game {
  private scene: THREE.Scene;
  private terrain: Terrain;
  private camera: RTSCamera;
  private eventBus: EventBusType;
  private particles: ParticleSystem;
  private pipeline: SystemPipeline;
  private map!: GeneratedMap;

  private navMesh: typeof NavMeshManager;
  private unitRenderer: UnitRenderer;
  private buildingRenderer: BuildingRenderer;
  private propRenderer: PropRenderer;
  private selectionRenderer: SelectionRenderer;
  private towerRangeRenderer: TowerRangeRenderer;
  private fogOfWarRenderer: FogOfWarRenderer;
  private selectedEntities: number[] = [];
  private playerState: typeof playerState;
  private hud: HUD | null = null;

  private entityMeshMap = new Map<number, THREE.Object3D>();
  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2();

  // Building placement mode
  private buildMode = false;
  private buildGhostType: string | null = null;

  // Rally point placement mode
  private rallyPointMode = false;
  private rallyPointBuildingEid = -1;

  // Attack-move mode: A key toggles, next click issues attack-move command
  private attackMoveMode = false;

  // Control groups: Ctrl+1..9 to assign, 1..9 to recall
  private controlGroups = new Map<number, Set<number>>();

  // Drag-box selection
  private dragStartX = 0;
  private dragStartY = 0;
  private isDragging = false;
  private dragBoxDiv: HTMLDivElement | null = null;

  // Player's chosen faction (0=Brabanders, 1=Randstad, 2=Limburgers, 3=Belgen)
  private playerFactionId: FactionId = FactionId.Brabanders;
  private difficulty: string = 'normal';

  // Skirmish configuration
  private skirmishPlayerCount: 2 | 3 | 4 = 2;
  private skirmishMapSize: MapSizeOption = 128;
  private skirmishStartingResources: number = 500;
  private skirmishFogOfWar: boolean = true;

  // Game over state
  private gameOver = false;
  private popCapAlertShown = false;

  // HP tracking for damage flash detection
  private lastHpMap = new Map<number, number>();

  // Game elapsed time (seconds)
  private _elapsedTime = 0;

  // Stats tracking
  private stats = {
    unitsProduced: 0,
    unitsLost: 0,
    enemiesKilled: 0,
    buildingsBuilt: 0,
    resourcesGathered: 0,
  };

  // Track which entities we know about for new-unit detection
  private knownUnitEntities = new Set<number>();
  private knownBuildingEntities = new Set<number>();

  // AI refresh timer (don't reconfigure AI every frame)
  private aiRefreshTimer = 0;
  private aiRefreshInterval = 0.5; // every 500ms

  // Music system -- dynamic battle/faction music
  private musicSystem: MusicSystem = createMusicSystem();

  // Campaign mission system
  private missionSystem: MissionSystem | null = null;
  private activeMission: MissionDefinition | null = null;
  private missionMessageTimer = 0;
  private militaryTrainedCount = 0;

  /** Callbacks from campaign UI for victory/defeat */
  public onMissionVictory: ((stars: number, timeSeconds: number, bonusesCompleted: string[]) => void) | null = null;
  public onMissionDefeat: (() => void) | null = null;

  // Track bound listeners for proper cleanup between games/missions
  private boundCanvasListeners: Array<{ el: EventTarget; event: string; handler: EventListenerOrEventListenerObject }> = [];
  private inputSetup = false;
  private eventListenersSetup = false;

  constructor(scene: THREE.Scene, terrain: Terrain, camera: RTSCamera, eventBus: EventBusType, particles: ParticleSystem) {
    this.scene = scene;
    this.terrain = terrain;
    this.camera = camera;
    this.eventBus = eventBus;
    this.particles = particles;

    this.pipeline = createGamePipeline(terrain, import.meta.env.DEV);
    this.navMesh = NavMeshManager;

    // Create render groups and add to scene
    const unitGroup = new THREE.Group(); unitGroup.name = 'units'; scene.add(unitGroup);
    const buildingGroup = new THREE.Group(); buildingGroup.name = 'buildings'; scene.add(buildingGroup);
    const propGroup = new THREE.Group(); propGroup.name = 'props'; scene.add(propGroup);
    const selectionGroup = new THREE.Group(); selectionGroup.name = 'selection'; scene.add(selectionGroup);
    const healthBarGroup = new THREE.Group(); healthBarGroup.name = 'healthbars'; scene.add(healthBarGroup);

    this.unitRenderer = new UnitRenderer(unitGroup);
    this.buildingRenderer = new BuildingRenderer(buildingGroup);
    this.propRenderer = new PropRenderer(propGroup);
    this.selectionRenderer = new SelectionRenderer(selectionGroup, healthBarGroup);
    this.towerRangeRenderer = new TowerRangeRenderer(scene);
    this.fogOfWarRenderer = new FogOfWarRenderer();
    scene.add(this.fogOfWarRenderer.mesh);
    this.playerState = playerState;
  }

  async init(
    playerFaction: number = FactionId.Brabanders,
    mapTemplate: string = 'classic',
    difficulty: string = 'normal',
    playerCount: 2 | 3 | 4 = 2,
    mapSizeName: string = 'medium',
    startingResources: string = 'medium',
    fogOfWar: boolean = true,
  ): Promise<void> {
    this.playerFactionId = playerFaction as FactionId;
    this.difficulty = difficulty;

    // Resolve map size from name
    const mapSize: MapSizeOption = (MAP_SIZES[mapSizeName] ?? MAP_SIZE) as MapSizeOption;

    // Store skirmish config for later use
    this.skirmishPlayerCount = playerCount;
    this.skirmishMapSize = mapSize;
    this.skirmishStartingResources = (RESOURCE_PRESETS[startingResources as ResourcePreset] ?? 500);
    this.skirmishFogOfWar = fogOfWar;

    // 1. Generate map layout
    this.map = generateMap(42, (x, z) => this.terrain.getHeightAt(x, z), playerCount, mapTemplate as any, mapSize);

    // 1b. Rebuild terrain with map-specific features (biome, rivers, bridges, roads, tunnels).
    // Pass mapSize so the geometry resizes for large/huge maps — without this
    // the outer ring beyond ±64 had no mesh ("blank outer ring" v0.37.28 live bug).
    if (this.map.terrainFeatures) {
      this.terrain.rebuild(this.map.terrainFeatures, mapSize);
    }

    // 1c. Register map tunnel system if the map has tunnels
    if (this.map.terrainFeatures?.tunnels.length > 0) {
      this.pipeline.add('MapTunnelSystem', createMapTunnelSystem(this.map.terrainFeatures.tunnels), 'movement');
    }

    // Remap slot 0 to player's chosen faction (swap if needed)
    if (this.playerFactionId !== FactionId.Brabanders) {
      this.remapFactions();
    }

    // Set shared game config so all systems know the player's faction
    gameConfig.setPlayerFaction(this.playerFactionId);
    AISystem.setFaction(this.getAIFactionId(), this.difficulty);

    // 2. Load GLB models (all active factions for performance)
    const activeFactions = new Set<number>(this.map.spawns.map(s => s.factionId));

    window.dispatchEvent(new CustomEvent('loading-progress', {
      detail: { progress: 0.1, label: 'Modellen laden...' },
    }));

    await Promise.all([
      this.unitRenderer.preload(activeFactions, (_loaded, _total) => {
        window.dispatchEvent(new CustomEvent('loading-progress', {
          detail: { progress: 0.1 + (_loaded / _total) * 0.5, label: `Modellen laden... (${_loaded}/${_total})` },
        }));
      }),
      this.buildingRenderer.preload(activeFactions),
      this.propRenderer.preload(),
      this.selectionRenderer.preload(),
    ]);

    // 3. Init navmesh (with fallback)
    window.dispatchEvent(new CustomEvent('loading-progress', {
      detail: { progress: 0.7, label: 'Navigatie berekenen...' },
    }));
    try {
      await this.navMesh.init(this.terrain.mesh);
      console.log('[Game] NavMesh initialized');
    } catch (e) {
      console.warn('[Game] NavMesh failed, using direct movement fallback:', e);
    }

    // 4. Spawn all entities from map definition
    window.dispatchEvent(new CustomEvent('loading-progress', {
      detail: { progress: 0.85, label: 'Eenheden plaatsen...' },
    }));
    this.spawnMapEntities();

    // 5. Place decoration props
    this.spawnProps();

    // 6. Configure AI system
    this.configureAI();

    // 7. Init HUD
    this.initHUD();

    // 8. Setup input handlers
    this.setupInput();

    // 9. Setup event listeners
    this.setupEventListeners();

    // 10. Init audio system + ambient sounds + faction music
    window.dispatchEvent(new CustomEvent('loading-progress', {
      detail: { progress: 0.95, label: 'Audio laden...' },
    }));
    audioManager.init();
    audioManager.startAmbient('ambient_birds');
    audioManager.startAmbient('ambient_wind');
    this.musicSystem.start(this.playerFactionId);

    // 11. Move camera to player base
    const playerSpawn = this.map.spawns.find(s => s.factionId === this.playerFactionId);
    if (playerSpawn) {
      this.camera.setPosition(playerSpawn.x, playerSpawn.z);
    }

    // 12. Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');

    console.log('[Game] Reign of Brabant initialized');
  }

  async initMission(missionId: string): Promise<void> {
    const mission = getMissionById(missionId);
    if (!mission) throw new Error(`Unknown mission: ${missionId}`);

    // Clean up previous game/mission state to prevent listener accumulation
    this.cleanup();

    this.activeMission = mission;
    this.map = generateMap(42, (x, z) => this.terrain.getHeightAt(x, z));

    // Rebuild terrain with map-specific features
    if (this.map.terrainFeatures) {
      this.terrain.rebuild(this.map.terrainFeatures);
    }

    // Only load models for active factions (player + AI) for performance
    const activeFactions = new Set<number>([mission.playerFactionId, ...mission.aiFactionIds]);

    window.dispatchEvent(new CustomEvent('loading-progress', {
      detail: { progress: 0.1, label: 'Modellen laden...' },
    }));

    await Promise.all([
      this.unitRenderer.preload(activeFactions, (_loaded, _total) => {
        window.dispatchEvent(new CustomEvent('loading-progress', {
          detail: { progress: 0.1 + (_loaded / _total) * 0.5, label: `Modellen laden... (${_loaded}/${_total})` },
        }));
      }),
      this.buildingRenderer.preload(activeFactions),
      this.propRenderer.preload(),
      this.selectionRenderer.preload(),
    ]);

    window.dispatchEvent(new CustomEvent('loading-progress', {
      detail: { progress: 0.7, label: 'Navigatie berekenen...' },
    }));
    try { await this.navMesh.init(this.terrain.mesh); } catch { /* fallback */ }

    // Use explicit faction fields from mission definition
    const missionPlayerFaction = mission.playerFactionId;
    this.playerFactionId = missionPlayerFaction;
    gameConfig.setPlayerFaction(missionPlayerFaction);

    // Set starting resources for correct factions
    this.playerState.addGold(missionPlayerFaction, -this.playerState.getGold(missionPlayerFaction));
    this.playerState.addGold(missionPlayerFaction, mission.startingGold);
    // Give starting gold to each AI faction
    for (const aiFaction of mission.aiFactionIds) {
      this.playerState.addGold(aiFaction, -this.playerState.getGold(aiFaction));
      this.playerState.addGold(aiFaction, mission.startingGoldAI);
    }

    window.dispatchEvent(new CustomEvent('loading-progress', {
      detail: { progress: 0.85, label: 'Eenheden plaatsen...' },
    }));
    this._spawnMissionEntities(mission);
    this.spawnProps();

    // Configure AI system: set the primary AI faction and start production if enabled
    if (mission.aiFactionIds.length > 0) {
      const primaryAiFaction = mission.aiFactionIds[0];
      AISystem.setFaction(primaryAiFaction);
    }
    if (mission.hasAIProduction) this.configureAI();

    // Setup input, event listeners, HUD, and mission events (cleanup cleared all flags)
    window.dispatchEvent(new CustomEvent('loading-progress', {
      detail: { progress: 0.95, label: 'Audio laden...' },
    }));
    this.initHUD();
    this.setupInput();
    this.setupEventListeners();
    this._setupMissionEvents();

    const pb = mission.buildings.find(b => b.factionId === missionPlayerFaction);
    if (pb) this.camera.setPosition(pb.x, pb.z);

    this.missionSystem = new MissionSystem();
    const wc = mission.units.filter(u => u.factionId === missionPlayerFaction && u.unitType === UnitTypeId.Worker).length;
    const cb: MissionCallbacks = {
      showMessage: (t) => this._showMsg(t),
      spawnUnits: (u) => this._spawnMissionUnits(u),
      triggerVictory: (s, t, b) => { this.gameOver = true; this.musicSystem.playVictory(); this.onMissionVictory?.(s, t, b); },
      triggerDefeat: () => { this.gameOver = true; this.musicSystem.playDefeat(); this.onMissionDefeat?.(); },
      getPlayerGold: () => this.playerState.getGold(this.playerFactionId),
      hasPlayerBuilding: (bt) => this._hasPlayerBldg(bt),
      getPlayerBuildingCount: (bt) => this._playerBldgCount(bt),
      getPlayerArmyCount: () => this._armyCount(),
      isEnemyBuildingDestroyed: (f, bt) => this._enemyBldgDestroyed(f, bt),
      getDestroyedEnemyBuildingCount: () => this._destroyedEnemyBldgCount(),
      getDestroyedEnemyBuildingCountFiltered: (targetFactionId?: FactionId, targetBuildingType?: BuildingTypeId) => this._destroyedEnemyBldgCountFiltered(targetFactionId, targetBuildingType),
      isEntityAlive: (eid: number) => entityExists(world, eid) && !hasComponent(world, eid, IsDead) && Health.current[eid] > 0,
      getPlayerWorkerCount: () => this._workerCount(),
      isPlayerTownHallAlive: () => this._thAlive(),
      getPlayerTotalUnits: () => this._playerUnits(),
      getAITotalUnits: () => this._aiUnits(),
      getPlayerMilitaryTrained: () => this.militaryTrainedCount,
    };
    this.missionSystem.start(mission, cb, wc);
    this._createMsgOverlay();
    this._createObjHUD();
    // Surrender button removed from HUD -- accessible via pause menu (ESC)

    // Start ambient audio + faction music
    audioManager.init();
    audioManager.startAmbient('ambient_birds');
    audioManager.startAmbient('ambient_wind');
    this.musicSystem.start(missionPlayerFaction);

    console.log(`[Game] Mission "${mission.title}" initialized`);
  }
  private _spawnMissionEntities(m: MissionDefinition): void {
    for (const b of m.buildings) {
      const eid = this.createBuildingEntity(b.buildingType, b.factionId, b.x, b.z);
      Building.complete[eid] = b.complete ? 1 : 0; Building.progress[eid] = b.complete ? 1 : 0;
      const fi = b.factionId;
      const tn = this.getBuildingRendererType(b.buildingType);
      const y = this.terrain.getHeightAt(b.x, b.z);
      const mesh = this.buildingRenderer.addBuilding(eid, tn, fi, b.x, y, b.z, b.complete ? 1.0 : 0.0);
      if (mesh) { mesh.userData.eid = eid; this.entityMeshMap.set(eid, mesh); }
      this.knownBuildingEntities.add(eid);
    }
    for (const u of m.units) {
      const eid = this.createUnitEntity(u.unitType, u.factionId, u.x, u.z);
      const fi = u.factionId;
      const tn = unitTypeName(u.unitType);
      const mesh = this.unitRenderer.addUnit(eid, tn, fi);
      if (mesh) { mesh.position.set(u.x, this.terrain.getHeightAt(u.x, u.z), u.z); mesh.userData.eid = eid; this.entityMeshMap.set(eid, mesh); }
      this.knownUnitEntities.add(eid);
    }
    for (const g of m.goldMines) {
      const eid = this.createGoldMineEntity(g.x, g.z, g.amount);
      const y = this.terrain.getHeightAt(g.x, g.z);
      const mesh = this.propRenderer.addGoldMine(eid, g.x, y, g.z);
      if (mesh) { mesh.userData.eid = eid; this.entityMeshMap.set(eid, mesh); }
    }
    if (m.treeResources) {
      for (const t of m.treeResources) {
        const eid = this.createTreeResourceEntity(t.x, t.z, t.amount);
        const y = this.terrain.getHeightAt(t.x, t.z);
        const mesh = this.propRenderer.addTreeResource(eid, t.x, y, t.z);
        if (mesh) { mesh.userData.eid = eid; this.entityMeshMap.set(eid, mesh); }
      }
    }
  }
  private _spawnMissionUnits(units: MissionUnitSpawn[]): number[] {
    const ids: number[] = [];
    for (const u of units) {
      const eid = this.createUnitEntity(u.unitType, u.factionId, u.x, u.z);
      const fi = u.factionId;
      const tn = unitTypeName(u.unitType);
      const mesh = this.unitRenderer.addUnit(eid, tn, fi);
      if (mesh) { mesh.position.set(u.x, this.terrain.getHeightAt(u.x, u.z), u.z); mesh.userData.eid = eid; this.entityMeshMap.set(eid, mesh); }
      this.knownUnitEntities.add(eid);
      if (u.factionId !== this.playerFactionId) {
        const base = this.getPlayerBasePosition();
        Movement.targetX[eid] = base.x + (Math.random() - 0.5) * 8; Movement.targetZ[eid] = base.z + (Math.random() - 0.5) * 8;
        Movement.hasTarget[eid] = 1; UnitAI.state[eid] = UnitAIState.Moving;
      }
      ids.push(eid);
    }
    return ids;
  }
  private _setupMissionEvents(): void {
    eventBus.on('unit-trained', (ev) => { if (ev.factionId === this.playerFactionId && ev.unitTypeId !== UnitTypeId.Worker) { this.militaryTrainedCount++; this.missionSystem?.onMilitaryTrained(); } });
    eventBus.on('unit-died', (ev) => { if (ev.factionId === this.playerFactionId && ev.unitTypeId === UnitTypeId.Worker) this.missionSystem?.onWorkerLost(); });
    eventBus.on('building-destroyed', (ev) => { if (ev.factionId === this.playerFactionId && ev.buildingTypeId === BuildingTypeId.TownHall) this.missionSystem?.onTownHallLost(); });
  }
  private _hasPlayerBldg(bt: BuildingTypeId): boolean { for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid)) continue; if (Faction.id[eid] === this.playerFactionId && Building.typeId[eid] === bt && Building.complete[eid] === 1) return true; } return false; }
  private _playerBldgCount(bt: BuildingTypeId): number { let c = 0; for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead)) continue; if (Faction.id[eid] === this.playerFactionId && Building.typeId[eid] === bt && Building.complete[eid] === 1) c++; } return c; }
  private _armyCount(): number { let c = 0; for (const eid of this.knownUnitEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead) || Faction.id[eid] !== this.playerFactionId) continue; if (!hasComponent(world, eid, IsWorker)) c++; } return c; }
  private _enemyBldgDestroyed(fid: FactionId, bt: BuildingTypeId): boolean { for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue; if (Faction.id[eid] === fid && Building.typeId[eid] === bt) return false; } return this.activeMission?.buildings.some(b => b.factionId === fid && b.buildingType === bt) ?? false; }
  private _destroyedEnemyBldgCount(): number { let count = 0; if (!this.activeMission) return 0; for (const b of this.activeMission.buildings) { if (b.factionId !== this.playerFactionId) { let alive = false; for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue; if (Faction.id[eid] === b.factionId && Building.typeId[eid] === b.buildingType && Math.abs(Position.x[eid] - b.x) < 2 && Math.abs(Position.z[eid] - b.z) < 2) { alive = true; break; } } if (!alive) count++; } } return count; }
  private _destroyedEnemyBldgCountFiltered(targetFactionId?: FactionId, targetBuildingType?: BuildingTypeId): number { let count = 0; if (!this.activeMission) return 0; for (const b of this.activeMission.buildings) { if (b.factionId === this.playerFactionId) continue; if (targetFactionId !== undefined && b.factionId !== targetFactionId) continue; if (targetBuildingType !== undefined && b.buildingType !== targetBuildingType) continue; let alive = false; for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue; if (Faction.id[eid] === b.factionId && Building.typeId[eid] === b.buildingType && Math.abs(Position.x[eid] - b.x) < 2 && Math.abs(Position.z[eid] - b.z) < 2) { alive = true; break; } } if (!alive) count++; } return count; }
  private _workerCount(): number { let c = 0; for (const eid of this.knownUnitEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead)) continue; if (Faction.id[eid] === this.playerFactionId && hasComponent(world, eid, IsWorker)) c++; } return c; }
  private _thAlive(): boolean { for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue; if (Faction.id[eid] === this.playerFactionId && Building.typeId[eid] === BuildingTypeId.TownHall) return true; } return false; }
  private _playerUnits(): number { let c = 0; for (const eid of this.knownUnitEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead)) continue; if (Faction.id[eid] === this.playerFactionId) c++; } return c; }
  private _aiUnits(): number { let c = 0; for (const eid of this.knownUnitEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead)) continue; if (Faction.id[eid] !== this.playerFactionId) c++; } return c; }
  private _createMsgOverlay(): void {
    if (document.getElementById('mission-message')) return;
    const ov = document.getElementById('ui-overlay'); if (!ov) return;
    const el = document.createElement('div'); el.id = 'mission-message';
    el.style.cssText = 'position:absolute;top:80px;left:50%;transform:translateX(-50%);max-width:500px;width:90vw;padding:14px 24px;background:rgba(20,15,10,0.92);border:2px solid rgba(212,168,83,0.5);border-radius:10px;color:#e8e6e3;font-size:0.95rem;line-height:1.5;text-align:center;z-index:25;box-shadow:0 4px 24px rgba(0,0,0,0.5);transition:opacity 0.4s,transform 0.4s;opacity:0;display:none';
    ov.appendChild(el);
  }
  private _showMsg(text: string): void {
    const el = document.getElementById('mission-message'); if (!el) return;
    el.textContent = text; el.style.display = 'block'; el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(-10px)';
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)'; });
    this.missionMessageTimer = 5.0;
  }
  private _updateMsg(dt: number): void {
    if (this.missionMessageTimer <= 0) return;
    this.missionMessageTimer -= dt;
    if (this.missionMessageTimer <= 0) { const el = document.getElementById('mission-message'); if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(-10px)'; setTimeout(() => { el.style.display = 'none'; }, 400); } }
  }
  private _createObjHUD(): void {
    if (document.getElementById('objectives-hud')) return;
    const ov = document.getElementById('ui-overlay'); if (!ov) return;
    const el = document.createElement('div'); el.id = 'objectives-hud';
    el.style.cssText = 'position:absolute;top:60px;left:8px;max-width:300px;padding:14px 18px 12px;background:linear-gradient(135deg,rgba(20,15,10,0.92) 0%,rgba(30,22,14,0.88) 100%);border:1px solid rgba(212,168,83,0.3);border-top:2px solid rgba(212,168,83,0.5);border-radius:4px 4px 10px 10px;font-size:0.8rem;z-index:10;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,0.4),inset 0 1px 0 rgba(212,168,83,0.08)';
    ov.appendChild(el);
  }
  private _updateObjHUD(): void {
    if (!this.missionSystem?.isActive) return;
    const el = document.getElementById('objectives-hud'); if (!el) return;
    const states = this.missionSystem.getObjectiveStates();
    let h = '<div style="font-family:Cinzel,serif;font-weight:700;font-size:0.75rem;color:#d4a853;margin-bottom:10px;letter-spacing:0.08em;padding-bottom:6px;border-bottom:1px solid rgba(212,168,83,0.2);text-shadow:0 0 8px rgba(212,168,83,0.3)">DOELSTELLINGEN</div>';
    for (const s of states) {
      // Negative objectives (no-worker-loss, no-townhall-loss) that haven't failed yet
      // should show as "active/protected" rather than "completed" -- they are only truly
      // completed when the mission ends. Showing them as completed mid-mission is confusing.
      const isNegativeType = s.objective.type === 'no-worker-loss' || s.objective.type === 'no-townhall-loss';
      const isNegativeActive = isNegativeType && s.completed && !s.failed;

      let ic: string;
      let cl: string;
      let opacity: string;
      let strikethrough = false;

      if (isNegativeActive) {
        // Show as "protected/intact" -- not yet completed, just maintained
        ic = '[OK]';
        cl = '#7ecfcf'; // teal color to distinguish from completed green
        opacity = '1';
      } else if (s.failed) {
        ic = '[X]';
        cl = '#F44336';
        opacity = '.7';
      } else if (s.completed) {
        ic = '[V]';
        cl = '#4CAF50';
        opacity = '.7';
        strikethrough = true;
      } else {
        ic = '[ ]';
        cl = s.objective.isBonus ? '#d4a853' : '#e8e6e3';
        opacity = '1';
      }

      const lb = s.objective.isBonus ? '* ' + s.objective.description : s.objective.description;
      let pr = '';
      if (isNegativeActive) {
        pr = ' \u2014 Beschermd';
      } else if (!s.completed && !s.failed && s.objective.targetValue > 1) {
        pr = ' (' + Math.floor(s.currentValue) + '/' + s.objective.targetValue + ')';
      }
      // Build progress bar for multi-value objectives
      let progressBar = '';
      if (!s.completed && !s.failed && !isNegativeActive && s.objective.targetValue > 1) {
        const pct = Math.min(100, Math.floor((s.currentValue / s.objective.targetValue) * 100));
        progressBar = '<div style="width:100%;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:3px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,' + cl + ',' + cl + 'cc);border-radius:2px;transition:width 0.4s ease"></div></div>';
      }
      h += '<div style="margin-bottom:6px;color:' + cl + ';opacity:' + opacity + (strikethrough ? ';text-decoration:line-through' : '') + '"><div style="display:flex;gap:6px;align-items:center"><span style="font-size:0.65rem;opacity:0.7;flex-shrink:0">' + ic + '</span><span style="font-size:0.78rem;line-height:1.3">' + lb + pr + '</span></div>' + progressBar + '</div>';
    }
    const wp = this.missionSystem.getWaveProgress();
    if (wp.total > 0) h += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(212,168,83,.15);color:#d4a853;font-size:.75rem">Golven: ' + wp.defeated + '/' + wp.total + '</div>';
    el.innerHTML = h;
  }
  // -----------------------------------------------------------------------
  // Surrender button (campaign missions only)
  // -----------------------------------------------------------------------

  private _createSurrenderBtn(): void {
    if (document.getElementById('surrender-btn')) return;
    const ov = document.getElementById('ui-overlay'); if (!ov) return;

    // Button
    const btn = document.createElement('button');
    btn.id = 'surrender-btn';
    btn.className = 'surrender-btn';
    btn.textContent = 'Opgeven';
    btn.addEventListener('click', () => this._showSurrenderConfirm());
    ov.appendChild(btn);
  }

  private _removeSurrenderBtn(): void {
    document.getElementById('surrender-btn')?.remove();
    document.getElementById('surrender-confirm')?.remove();
  }

  private _showSurrenderConfirm(): void {
    if (document.getElementById('surrender-confirm')) return;
    const ov = document.getElementById('ui-overlay'); if (!ov) return;

    const dialog = document.createElement('div');
    dialog.id = 'surrender-confirm';
    dialog.className = 'surrender-confirm';
    dialog.innerHTML =
      '<div class="surrender-confirm__title">Missie opgeven?</div>' +
      '<div class="surrender-confirm__buttons">' +
        '<button class="surrender-confirm__btn surrender-confirm__btn--yes" id="surrender-yes">Ja, opnieuw</button>' +
        '<button class="surrender-confirm__btn surrender-confirm__btn--no" id="surrender-no">Annuleer</button>' +
      '</div>';
    ov.appendChild(dialog);

    document.getElementById('surrender-yes')?.addEventListener('click', () => {
      dialog.remove();
      this.surrenderMission();
    });
    document.getElementById('surrender-no')?.addEventListener('click', () => {
      dialog.remove();
    });
  }

  /** Called when the player surrenders: triggers defeat through MissionSystem. */
  surrenderMission(): void {
    if (!this.missionSystem?.isActive) return;
    this._removeSurrenderBtn();
    this.missionSystem.surrender();
  }

  getActiveMission(): MissionDefinition | null { return this.activeMission; }
  isMissionActive(): boolean { return this.missionSystem?.isActive ?? false; }

  private spawnMapEntities(): void {
    // Spawn buildings (Town Halls)
    for (const b of this.map.buildings) {
      const eid = this.createBuildingEntity(b.buildingType, b.factionId, b.x, b.z);
      const factionIdx = b.factionId;
      const typeName = this.getBuildingRendererType(b.buildingType);
      const y = this.terrain.getHeightAt(b.x, b.z);
      const mesh = this.buildingRenderer.addBuilding(eid, typeName, factionIdx, b.x, y, b.z, 1.0);
      if (mesh) {
        mesh.userData.eid = eid;
        this.entityMeshMap.set(eid, mesh);
      }
      this.knownBuildingEntities.add(eid);
    }

    // Spawn units
    for (const u of this.map.units) {
      const eid = this.createUnitEntity(u.unitType, u.factionId, u.x, u.z);
      const factionIdx = u.factionId;
      const typeName = unitTypeName(u.unitType);
      const mesh = this.unitRenderer.addUnit(eid, typeName, factionIdx);
      if (mesh) {
        mesh.position.set(u.x, this.terrain.getHeightAt(u.x, u.z), u.z);
        mesh.userData.eid = eid;
        this.entityMeshMap.set(eid, mesh);
      }
      this.knownUnitEntities.add(eid);
    }

    // Spawn gold mines
    for (const g of this.map.goldMines) {
      const eid = this.createGoldMineEntity(g.x, g.z, g.amount);
      const y = this.terrain.getHeightAt(g.x, g.z);
      const mesh = this.propRenderer.addGoldMine(eid, g.x, y, g.z);
      if (mesh) {
        mesh.userData.eid = eid;
        this.entityMeshMap.set(eid, mesh);
      }
    }

    // Spawn tree resources
    for (const t of this.map.treeResources) {
      const eid = this.createTreeResourceEntity(t.x, t.z, t.amount);
      const y = this.terrain.getHeightAt(t.x, t.z);
      const mesh = this.propRenderer.addTreeResource(eid, t.x, y, t.z);
      if (mesh) {
        mesh.userData.eid = eid;
        this.entityMeshMap.set(eid, mesh);
      }
    }

    // Starting resources for all active factions (uses skirmish config)
    for (const spawn of this.map.spawns) {
      this.playerState.addGold(spawn.factionId, this.skirmishStartingResources);
    }
  }

  private spawnProps(): void {
    // Place trees from map decorations
    const trees = this.map.decorations
      .filter(d => d.type === DecoType.Tree)
      .map((d, i) => ({
        x: d.x,
        y: this.terrain.getHeightAt(d.x, d.z),
        z: d.z,
        rotY: d.rotationY,
        scale: d.scale,
        variant: i % 3,
      }));

    const rocks = this.map.decorations
      .filter(d => d.type === DecoType.Rock)
      .map((d, i) => ({
        x: d.x,
        y: this.terrain.getHeightAt(d.x, d.z),
        z: d.z,
        rotY: d.rotationY,
        scale: d.scale,
        variant: i % 3,
      }));

    this.propRenderer.placeTrees(trees);
    this.propRenderer.placeRocks(rocks);

    // Add terrain feature visuals (bridges, tunnel entrances) to the scene
    for (const featureMesh of this.terrain.featureMeshes) {
      this.scene.add(featureMesh);
    }
  }

  private configureAI(): void {
    // Initial configuration -- refreshTagArrays() will reconfigure each frame
    this.refreshTagArrays();
  }

  private initHUD(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    try {
      this.hud = new HUD();
      this.hud.init({
        onCommand: (action) => this.handleHUDCommand(action),
        onMinimapClick: (x, y) => this.handleMinimapClick(x, y),
        onPortraitClick: (unitId) => {
          // Focus on specific unit
          this.selectedEntities = [unitId];
          this.onSelectionChanged(this.selectedEntities);
        },
        onRetry: () => window.location.reload(),
        onMenu: () => window.location.reload(),
        onQueueCancel: (buildingId, queueIndex) => this.cancelProductionQueueItem(buildingId, queueIndex),
      });
      const factionNames = ['brabant', 'randstad', 'limburg', 'belgen'] as const;
      this.hud.setFaction(factionNames[this.playerFactionId] ?? 'brabant');

      // Hide gezelligheid bar for non-Brabanders, show tertiary for others
      if (this.playerFactionId !== FactionId.Brabanders) {
        const gezEl = document.querySelector('.gezelligheid-item') as HTMLElement | null;
        if (gezEl) gezEl.style.display = 'none';
      }

      this.hud.updateResources(
        this.playerState.getGold(this.playerFactionId),
        this.playerState.getWood(this.playerFactionId),
        this.playerState.getPopulation(this.playerFactionId),
        this.playerState.getPopulationMax(this.playerFactionId),
        getUpkeepPerTick(this.playerFactionId),
        this.playerState.isInUpkeepDebt(this.playerFactionId),
      );
    } catch (e) {
      console.warn('[Game] HUD init failed:', e);
    }
  }

  private handleHUDCommand(action: CommandAction): void {
    switch (action) {
      case 'move':
        // Already handled via right-click
        break;
      case 'attack':
        // Already handled via right-click on enemy
        break;
      case 'stop':
        queueCommand({ type: 'stop' });
        break;
      case 'hold':
        queueCommand({ type: 'hold' });
        break;
      case 'build-barracks':
        this.enterBuildMode('barracks');
        break;
      case 'build-lumbercamp':
        this.enterBuildMode('lumbercamp');
        break;
      case 'build-blacksmith':
        this.enterBuildMode('blacksmith');
        break;
      case 'build-mijnschacht':
        // Limburgers faction-specific building -- maps to TertiaryResourceBuilding
        this.enterBuildMode('mijnschacht');
        break;
      case 'build-chocolaterie':
        // Belgen faction-specific building -- maps to TertiaryResourceBuilding
        this.enterBuildMode('chocolaterie');
        break;
      case 'build-housing':
        this.enterBuildMode('housing');
        break;
      case 'build-tower':
        this.enterBuildMode('tower');
        break;
      case 'build-tertiary':
        this.enterBuildMode('tertiary');
        break;
      case 'build-upgrade':
        this.enterBuildMode('upgrade');
        break;
      case 'build-faction1':
        this.enterBuildMode('faction1');
        break;
      case 'build-faction2':
        this.enterBuildMode('faction2');
        break;
      case 'build-siege-workshop':
        this.enterBuildMode('siege-workshop');
        break;
      case 'train-worker':
        this.trainFromSelectedBuilding(UnitTypeId.Worker);
        break;
      case 'train-infantry':
        this.trainFromSelectedBuilding(UnitTypeId.Infantry);
        break;
      case 'train-ranged':
        this.trainFromSelectedBuilding(UnitTypeId.Ranged);
        break;
      case 'train-heavy':
        this.trainFromSelectedBuilding(UnitTypeId.Heavy);
        break;
      case 'train-siege':
        this.trainFromSelectedBuilding(UnitTypeId.Siege);
        break;
      case 'train-support':
        this.trainFromSelectedBuilding(UnitTypeId.Support);
        break;
      case 'train-hero-0':
        this.trainFactionHero(0);
        break;
      case 'train-hero-1':
        this.trainFactionHero(1);
        break;
      case 'hero-ability-q':
        this.useHeroAbility(0);
        break;
      case 'hero-ability-w':
        this.useHeroAbility(1);
        break;
      case 'hero-ability-e':
        this.useHeroAbility(2);
        break;
      case 'rally-point':
        this.enterRallyPointMode();
        break;
      case 'research-upgrade':
        this.showTechTreeUI();
        break;
      case 'activate-sprint-mode':
        this.tryActivateSprintMode();
        break;
      case 'activate-deadline-crunch':
        this.tryActivateDeadlineCrunch();
        break;
      case 'activate-trakteerronde':
        this.tryActivateTrakteerronde();
        break;
      case 'activate-carnavalsoptocht':
        this.tryActivateCarnavalsoptocht();
        break;
      case 'activate-boardroom':
        this.tryActivateBoardroom();
        break;
      case 'cancel-queue':
        // Handled via onQueueCancel callback, not via command action
        break;
    }
  }

  /**
   * Activate the Randstad Boardroom CEO Kwartaalcijfers buff: +50% production
   * speed for 30s on a 120s cooldown. Only fires when the player is Randstad
   * and the cooldown is ready.
   */
  private tryActivateBoardroom(): void {
    if (this.playerFactionId !== FactionId.Randstad) return;
    const fired = activateBoardroom();
    if (fired) {
      this.hud?.showAlert('CEO Kwartaalcijfers actief — productie +50% (30s)', 'info');
      audioManager.playSound('click');
    } else {
      this.hud?.showAlert('Boardroom-buff nog op cooldown', 'warning');
    }
  }

  /**
   * Sprint Mode click-action (Randstad Havermoutmelkbar). Spends 30 havermoutmelk
   * for 60s of +20% gather rate AND +20% production speed for all Randstad
   * units/buildings. 90s cooldown.
   */
  private tryActivateSprintMode(): void {
    if (this.playerFactionId !== FactionId.Randstad) return;
    if (this.playerState.getTertiary(FactionId.Randstad) < SPRINT_MODE_COST) {
      this.hud?.showAlert(`Niet genoeg havermoutmelk (${SPRINT_MODE_COST} nodig)`, 'warning');
      return;
    }
    const fired = activateSprintMode();
    if (fired) {
      this.hud?.showAlert('Sprint Mode actief — gather + productie +20% (60s)', 'info');
      audioManager.playSound('click');
    } else {
      this.hud?.showAlert('Sprint Mode nog op cooldown', 'warning');
    }
  }

  /**
   * Deadline Crunch click-action (Randstad Havermoutmelkbar). Spends 50
   * havermoutmelk for 30s of +50% movement speed for Randstad workers
   * (stagiairs). 90s cooldown.
   */
  /**
   * Carnavalsoptocht click-action (Brabant Carnavalstent). Spends 75
   * Gezelligheid for 30s of +25% movement speed for all Brabant units
   * (parade-effect). 90s cooldown.
   */
  private tryActivateCarnavalsoptocht(): void {
    if (this.playerFactionId !== FactionId.Brabanders) return;
    if (this.playerState.getGezelligheid(FactionId.Brabanders) < CARNAVALSOPTOCHT_COST) {
      this.hud?.showAlert(`Niet genoeg Gezelligheid (${CARNAVALSOPTOCHT_COST} nodig)`, 'warning');
      return;
    }
    const fired = activateCarnavalsoptocht();
    if (fired) {
      this.hud?.showAlert('Carnavalsoptocht — Brabant +25% snelheid (30s)', 'info');
      audioManager.playSound('click');
    } else {
      this.hud?.showAlert('Carnavalsoptocht nog op cooldown', 'warning');
    }
  }

  /**
   * Trakteerronde click-action (Brabant Worstenbroodjeskraam). Spends 50
   * Gezelligheid for 30s of +20% movement speed for all Brabant units.
   * 90s cooldown.
   */
  private tryActivateTrakteerronde(): void {
    if (this.playerFactionId !== FactionId.Brabanders) return;
    if (this.playerState.getGezelligheid(FactionId.Brabanders) < TRAKTEERRONDE_COST) {
      this.hud?.showAlert(`Niet genoeg Gezelligheid (${TRAKTEERRONDE_COST} nodig)`, 'warning');
      return;
    }
    const fired = activateTrakteerronde();
    if (fired) {
      this.hud?.showAlert('Trakteerronde — Brabant +20% snelheid (30s)', 'info');
      audioManager.playSound('click');
    } else {
      this.hud?.showAlert('Trakteerronde nog op cooldown', 'warning');
    }
  }

  private tryActivateDeadlineCrunch(): void {
    if (this.playerFactionId !== FactionId.Randstad) return;
    if (this.playerState.getTertiary(FactionId.Randstad) < DEADLINE_CRUNCH_COST) {
      this.hud?.showAlert(`Niet genoeg havermoutmelk (${DEADLINE_CRUNCH_COST} nodig)`, 'warning');
      return;
    }
    const fired = activateDeadlineCrunch();
    if (fired) {
      this.hud?.showAlert('Deadline Crunch — Stagiairs +50% snelheid (30s)', 'info');
      audioManager.playSound('click');
    } else {
      this.hud?.showAlert('Deadline Crunch nog op cooldown', 'warning');
    }
  }

  /**
   * Cancel a production queue item at the given index for a building.
   * Index 0 = currently producing item, 1-5 = queued items.
   * Refunds gold for the cancelled unit.
   */
  private cancelProductionQueueItem(buildingId: number, queueIndex: number): void {
    if (!entityExists(world, buildingId)) return;
    if (!hasComponent(world, buildingId, Production)) return;
    if (Faction.id[buildingId] !== this.playerFactionId) return;

    const fid = Faction.id[buildingId];
    const slots = [Production.queue0, Production.queue1, Production.queue2, Production.queue3, Production.queue4];

    if (queueIndex === 0) {
      // Cancel the currently producing item
      const unitType = Production.unitType[buildingId];
      if (unitType === NO_PRODUCTION) return;

      // Refund gold
      try {
        const arch = getFactionUnitArchetype(fid, unitType);
        this.playerState.addGold(fid, arch.costGold);
      } catch { /* no refund if archetype unknown */ }

      // Shift queue: move next queued item into production
      const nextType = slots[0][buildingId];
      if (nextType !== NO_PRODUCTION) {
        Production.unitType[buildingId] = nextType;
        Production.progress[buildingId] = 0;
        try {
          const arch = getFactionUnitArchetype(fid, nextType);
          Production.duration[buildingId] = arch.buildTime;
        } catch {
          Production.duration[buildingId] = 15;
        }
        for (let i = 0; i < slots.length - 1; i++) {
          slots[i][buildingId] = slots[i + 1][buildingId];
        }
        slots[slots.length - 1][buildingId] = NO_PRODUCTION;
      } else {
        Production.unitType[buildingId] = NO_PRODUCTION;
        Production.progress[buildingId] = 0;
      }

      this.hud?.showAlert('Training geannuleerd', 'info');
    } else {
      // Cancel a queued item (index 1 = queue0, index 2 = queue1, etc.)
      const slotIndex = queueIndex - 1;
      if (slotIndex < 0 || slotIndex >= slots.length) return;

      const unitType = slots[slotIndex][buildingId];
      if (unitType === NO_PRODUCTION) return;

      // Refund gold
      try {
        const arch = getFactionUnitArchetype(fid, unitType);
        this.playerState.addGold(fid, arch.costGold);
      } catch { /* no refund if archetype unknown */ }

      // Remove from queue and shift remaining items down
      for (let i = slotIndex; i < slots.length - 1; i++) {
        slots[i][buildingId] = slots[i + 1][buildingId];
      }
      slots[slots.length - 1][buildingId] = NO_PRODUCTION;

      this.hud?.showAlert('Uit wachtrij verwijderd', 'info');
    }

    // Refresh the building card display
    this.onSelectionChanged(this.selectedEntities);
  }

  /**
   * Show the tech tree panel with current research state.
   */
  private showTechTreeUI(): void {
    if (!this.hud) return;

    // If already visible, toggle off
    if (this.hud.isTechTreeVisible()) {
      this.hud.hideTechTree();
      return;
    }

    const upgrades: Array<{
      id: number;
      name: string;
      description: string;
      costGold: number;
      costWood?: number;
      tier: number;
      isResearched: boolean;
      isAvailable: boolean;
      isLocked: boolean;
    }> = [];

    for (const def of UPGRADE_DEFINITIONS) {
      const isResearched = techTreeSystem.isResearched(this.playerFactionId, def.id);
      const canResearch = techTreeSystem.canResearch(this.playerFactionId, def.id, world);

      // Determine tier based on prerequisites
      let tier = 1;
      if (def.prerequisite !== null) {
        const prereqDef = getUpgradeDefinition(def.prerequisite);
        tier = prereqDef.prerequisite !== null ? 3 : 2;
      }

      upgrades.push({
        id: def.id,
        name: def.name,
        description: def.description,
        costGold: def.cost.gold,
        costWood: def.cost.wood,
        tier,
        isResearched,
        isAvailable: canResearch && !isResearched,
        isLocked: !canResearch && !isResearched,
      });
    }

    this.hud.showTechTree(upgrades);
  }

  private handleMinimapClick(normalizedX: number, normalizedY: number): void {
    const currentMapSize = this.map?.size ?? MAP_SIZE;
    const halfMap = currentMapSize / 2;
    const worldX = (normalizedX - 0.5) * currentMapSize;
    const worldZ = (normalizedY - 0.5) * currentMapSize;
    // Move camera to clicked position
    this.camera.setPosition(worldX, worldZ);
  }

  private enterBuildMode(type: string): void {
    // Check if we have a worker selected
    const hasWorker = this.selectedEntities.some(eid =>
      hasComponent(world, eid, IsWorker) && Faction.id[eid] === this.playerFactionId
    );
    if (!hasWorker) {
      this.hud?.showAlert('Selecteer een worker om te bouwen', 'warning');
      return;
    }
    // Map ghost type to BuildingTypeId
    const buildingTypeId = this.getBuildingTypeIdForGhost(type);

    // Tech tree check
    if (!techTreeSystem.canBuildBuilding(this.playerFactionId, buildingTypeId, world)) {
      this.hud?.showAlert('Vereist een hoger tier gebouw!', 'warning');
      return;
    }

    // Check cost -- use archetype if available, otherwise default 150g
    const arch = buildingTypeId < BUILDING_ARCHETYPES.length ? BUILDING_ARCHETYPES[buildingTypeId] : null;
    const cost = arch?.costGold ?? 150;
    if (!this.playerState.canAfford(this.playerFactionId, cost)) {
      this.hud?.showAlert('Niet genoeg goud!', 'warning');
      return;
    }
    this.buildMode = true;
    this.buildGhostType = type;
    this.hud?.showModeIndicator(`Bouw: ${this.getBuildingLabel(type)}`);
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'crosshair';
  }

  /** Map a build ghost type string to a BuildingTypeId enum. */
  private getBuildingTypeIdForGhost(type: string): BuildingTypeId {
    switch (type) {
      case 'blacksmith': return BuildingTypeId.Blacksmith;
      case 'lumbercamp': return BuildingTypeId.LumberCamp;
      case 'mijnschacht': return BuildingTypeId.TertiaryResourceBuilding;
      case 'chocolaterie': return BuildingTypeId.TertiaryResourceBuilding;
      case 'housing': return BuildingTypeId.Housing;
      case 'tower': return BuildingTypeId.DefenseTower;
      case 'tertiary': return BuildingTypeId.TertiaryResourceBuilding;
      case 'upgrade': return BuildingTypeId.UpgradeBuilding;
      case 'faction1': return BuildingTypeId.FactionSpecial1;
      case 'faction2': return BuildingTypeId.FactionSpecial2;
      case 'siege-workshop': return BuildingTypeId.SiegeWorkshop;
      default: return BuildingTypeId.Barracks;
    }
  }

  /**
   * Faction-aware display label for a building ghost type.
   * Single source of truth: factionData.getDisplayBuildingName.
   */
  private getBuildingLabel(ghostType: string): string {
    const typeId = this.getBuildingTypeIdForGhost(ghostType);
    return getDisplayBuildingName(this.playerFactionId, typeId);
  }

  private exitBuildMode(): void {
    this.buildMode = false;
    this.buildGhostType = null;
    this.buildingRenderer.hideGhost();
    this.hud?.hideModeIndicator();
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'default';
  }

  /**
   * Enter rally point placement mode: next left-click on terrain sets
   * the rally point for the currently selected production building.
   */
  private enterRallyPointMode(): void {
    if (this.selectedEntities.length !== 1) {
      this.hud?.showAlert('Selecteer een enkel gebouw', 'warning');
      return;
    }
    const bEid = this.selectedEntities[0];
    if (!hasComponent(world, bEid, IsBuilding) ||
        Faction.id[bEid] !== this.playerFactionId ||
        !hasComponent(world, bEid, RallyPoint)) {
      this.hud?.showAlert('Dit gebouw kan geen rally point hebben', 'warning');
      return;
    }
    this.rallyPointMode = true;
    this.rallyPointBuildingEid = bEid;
    this.hud?.showModeIndicator('Rally Point plaatsen');
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'crosshair';
    this.hud?.showAlert('Klik op het terrein om rally point te plaatsen', 'info');
  }

  private exitRallyPointMode(): void {
    this.rallyPointMode = false;
    this.rallyPointBuildingEid = -1;
    this.hud?.hideModeIndicator();
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'default';
  }

  // -----------------------------------------------------------------------
  // Attack-move mode
  // -----------------------------------------------------------------------

  private enterAttackMoveMode(): void {
    this.attackMoveMode = true;
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'crosshair';
    this.hud?.showAlert('Attack-move: klik op terrein of vijand', 'info');
    this.hud?.showModeIndicator('Attack-Move');
  }

  private exitAttackMoveMode(): void {
    this.attackMoveMode = false;
    this.hud?.hideModeIndicator();
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'default';
  }

  private handleAttackMoveClick(screenX: number, screenY: number): void {
    const selected = this.selectedEntities;
    if (selected.length === 0) {
      this.exitAttackMoveMode();
      return;
    }

    this.mouseVec.set(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouseVec, this.camera.camera);
    const hits = this.raycaster.intersectObject(this.terrain.mesh);

    if (hits.length > 0) {
      const point = hits[0].point;
      const targetEid = this.findEntityAtPosition(point.x, point.z);

      // If clicked on an enemy, issue a direct attack command
      if (targetEid !== null && Faction.id[targetEid] !== this.playerFactionId &&
          (hasComponent(world, targetEid, IsUnit) || hasComponent(world, targetEid, IsBuilding))) {
        queueCommand({ type: 'attack', targetEid });
      } else {
        // Otherwise issue attack-move to position
        queueCommand({ type: 'attack-move', targetX: point.x, targetZ: point.z });
        this.unitRenderer.showMoveIndicator(point.x, point.y, point.z);
      }

      // Voice + audio feedback
      const voiceEid = selected[0];
      const voiceFaction = hasComponent(world, voiceEid, IsUnit) ? Faction.id[voiceEid] : this.playerFactionId;
      const voiceUnitType = hasComponent(world, voiceEid, IsUnit) ? UnitType.id[voiceEid] : undefined;
      playUnitVoice(voiceFaction, 'attack', voiceUnitType);
    }

    this.exitAttackMoveMode();
  }

  // -----------------------------------------------------------------------
  // Ctrl+Click: select all same unit type
  // -----------------------------------------------------------------------

  /**
   * Select all units of the same type and faction as the clicked unit.
   * Returns array of entity IDs to select.
   */
  private selectAllSameType(clickedEid: number): number[] {
    const clickedType = UnitType.id[clickedEid];
    const clickedFaction = Faction.id[clickedEid];
    const isClickedUnit = hasComponent(world, clickedEid, IsUnit);
    const isClickedBuilding = hasComponent(world, clickedEid, IsBuilding);

    // Only works for units, not buildings
    if (!isClickedUnit) {
      return [clickedEid];
    }

    const result: number[] = [];
    for (const [eid] of this.entityMeshMap) {
      if (!entityExists(world, eid)) continue;
      if (!hasComponent(world, eid, IsUnit)) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      if (Faction.id[eid] !== clickedFaction) continue;
      if (UnitType.id[eid] !== clickedType) continue;
      // Only select player faction units
      if (Faction.id[eid] !== this.playerFactionId) continue;
      result.push(eid);
    }

    return result.length > 0 ? result : [clickedEid];
  }

  // -----------------------------------------------------------------------
  // Control groups
  // -----------------------------------------------------------------------

  /**
   * Assign the current selection to a control group (1-9).
   */
  private assignControlGroup(groupNum: number): void {
    if (this.selectedEntities.length === 0) return;
    this.controlGroups.set(groupNum, new Set(this.selectedEntities));
    this.hud?.showAlert(`Groep ${groupNum} toegewezen (${this.selectedEntities.length} units)`, 'info');
  }

  /**
   * Recall a control group: select all living entities in the group.
   * Centers the camera on the group's center position.
   */
  private recallControlGroup(groupNum: number): void {
    const group = this.controlGroups.get(groupNum);
    if (!group || group.size === 0) return;

    // Filter out dead/removed entities
    const alive: number[] = [];
    for (const eid of group) {
      if (entityExists(world, eid) && !hasComponent(world, eid, IsDead)) {
        alive.push(eid);
      } else {
        group.delete(eid); // Clean up dead entities
      }
    }

    if (alive.length === 0) {
      this.controlGroups.delete(groupNum);
      return;
    }

    // Select the group
    this.selectedEntities = alive;
    this.onSelectionChanged(this.selectedEntities);

    // Center camera on the group's average position
    let sumX = 0, sumZ = 0;
    for (const eid of alive) {
      sumX += Position.x[eid];
      sumZ += Position.z[eid];
    }
    this.camera.setPosition(sumX / alive.length, sumZ / alive.length);
  }

  private trainFromSelectedBuilding(unitType: UnitTypeId): void {
    // Find selected building that can train this unit type
    for (const eid of this.selectedEntities) {
      if (!hasComponent(world, eid, IsBuilding)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (Building.complete[eid] !== 1) continue;

      const buildingType = Building.typeId[eid];
      const arch = BUILDING_ARCHETYPES[buildingType];
      if (!arch.produces.includes(unitType)) continue;

      const factionUnitArch = getFactionUnitArchetype(this.playerFactionId, unitType);
      const goldCost = factionUnitArch.costGold;
      const woodCost = factionUnitArch.costSecondary ?? 0;

      // Pre-flight: give the player a reason if the command will silently reject.
      if (!this.playerState.canAfford(this.playerFactionId, goldCost)) {
        this.hud?.showAlert(`Niet genoeg goud! (${goldCost} nodig)`, 'warning');
        return;
      }
      if (woodCost > 0 && !this.playerState.canAffordWood(this.playerFactionId, woodCost)) {
        this.hud?.showAlert(`Niet genoeg hout! (${woodCost} nodig)`, 'warning');
        return;
      }
      if (!this.playerState.hasPopulationRoom(this.playerFactionId)) {
        this.hud?.showAlert('Populatie vol! Bouw Huusjes.', 'warning');
        return;
      }

      queueCommand({
        type: 'train',
        buildingEid: eid,
        unitTypeId: unitType,
        cost: goldCost,
      });
      return;
    }
    this.hud?.showAlert('Geen geschikt gebouw geselecteerd', 'warning');
  }

  private trainHero(heroTypeId: HeroTypeId): void {
    const arch = HERO_ARCHETYPES[heroTypeId];
    if (!arch) return;
    if (isHeroActive(this.playerFactionId, heroTypeId)) {
      this.hud?.showAlert(`${arch.name} is al in het spel!`, 'warning');
      return;
    }
    if (!this.playerState.canAfford(this.playerFactionId, arch.costGold)) {
      this.hud?.showAlert(`Niet genoeg goud! (${arch.costGold} nodig)`, 'warning');
      return;
    }
    if (!this.playerState.hasPopulationRoom(this.playerFactionId, HERO_POPULATION_COST)) {
      this.hud?.showAlert(`Niet genoeg populatie! (${HERO_POPULATION_COST} nodig)`, 'warning');
      return;
    }
    let barracksEid = -1;
    for (const eid of this.selectedEntities) {
      if (!hasComponent(world, eid, IsBuilding)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (Building.complete[eid] !== 1) continue;
      if (Building.typeId[eid] === BuildingTypeId.Barracks) { barracksEid = eid; break; }
    }
    if (barracksEid < 0) {
      const allBlds = query(world, [Building, IsBuilding]);
      for (const eid of allBlds) {
        if (Faction.id[eid] !== this.playerFactionId) continue;
        if (Building.complete[eid] !== 1) continue;
        if (Building.typeId[eid] === BuildingTypeId.Barracks) { barracksEid = eid; break; }
      }
    }
    if (barracksEid < 0) {
      this.hud?.showAlert('Bouw eerst een Cafe (Barracks)!', 'warning');
      return;
    }
    this.playerState.spend(this.playerFactionId, arch.costGold);
    let thX = Position.x[barracksEid];
    let thZ = Position.z[barracksEid];
    const thBlds = query(world, [Building, IsBuilding]);
    for (const eid of thBlds) {
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (Building.typeId[eid] === BuildingTypeId.TownHall) {
        thX = Position.x[eid]; thZ = Position.z[eid]; break;
      }
    }
    const spawnX = Position.x[barracksEid] + 4;
    const spawnZ = Position.z[barracksEid] + 2;
    const heroEid = createHero(world, heroTypeId, this.playerFactionId, spawnX, spawnZ, thX, thZ);
    if (heroEid >= 0) {
      this.playerState.addPopulation(this.playerFactionId, HERO_POPULATION_COST);
      // Determine hero index within faction (0 = primary, 1 = secondary)
      const factionHeroes = getHeroTypesForFaction(this.playerFactionId);
      const heroIndex = factionHeroes.indexOf(heroTypeId);
      const heroTypeName = heroIndex > 0 ? `hero${heroIndex}` : 'hero0';
      const mesh = this.unitRenderer.addUnit(heroEid, heroTypeName as any, this.playerFactionId);
      if (mesh) {
        const y = this.terrain.getHeightAt(spawnX, spawnZ);
        mesh.position.set(spawnX, y, spawnZ);
        mesh.scale.setScalar(1.8);
        mesh.userData.eid = heroEid;
        this.entityMeshMap.set(heroEid, mesh);
      }
      this.knownUnitEntities.add(heroEid);
      this.hud?.showAlert(`${arch.name} is verschenen! ALAAF!`, 'info');
    }
  }

  private trainFactionHero(index: number): void {
    const heroTypes = getHeroTypesForFaction(this.playerFactionId);
    if (index < 0 || index >= heroTypes.length) return;
    this.trainHero(heroTypes[index]);
  }

  private useHeroAbility(slot: number): void {
    for (const eid of this.selectedEntities) {
      if (!hasComponent(world, eid, IsHero)) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      const success = activateHeroAbility(world, eid, slot);
      if (success) {
        const htId = Hero.heroTypeId[eid] as HeroTypeId;
        const heroArch = HERO_ARCHETYPES[htId];
        const ability = heroArch.abilities[slot];
        this.hud?.showAlert(`${ability.name}!`, 'info');
        this.hud?.flashHeroAbility(slot);
      } else {
        const cd = slot === 0 ? HeroAbilities.ability0Cooldown[eid]
          : slot === 1 ? HeroAbilities.ability1Cooldown[eid]
            : HeroAbilities.ability2Cooldown[eid];
        if (cd > 0) {
          this.hud?.showAlert(`Cooldown: ${Math.ceil(cd)}s`, 'warning');
        } else {
          this.hud?.showAlert('Kan ability niet gebruiken!', 'warning');
        }
      }
      return;
    }
    this.hud?.showAlert('Selecteer eerst een hero!', 'warning');
  }

  private addTrackedListener(el: EventTarget, event: string, handler: EventListenerOrEventListenerObject): void {
    el.addEventListener(event, handler);
    this.boundCanvasListeners.push({ el, event, handler });
  }

  private setupInput(): void {
    if (this.inputSetup) return;
    this.inputSetup = true;

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    // Create drag-box overlay element
    this.dragBoxDiv = document.createElement('div');
    this.dragBoxDiv.style.cssText = 'position:fixed;border:1px solid #d4a853;background:rgba(212,168,83,0.15);pointer-events:none;z-index:50;display:none';
    document.body.appendChild(this.dragBoxDiv);

    // Left mousedown: start drag or build placement or rally point placement or attack-move
    this.addTrackedListener(canvas, 'mousedown', ((e: MouseEvent) => {
      if (e.button !== 0) return;

      // Build mode: place building on click
      if (this.buildMode && this.buildGhostType) {
        this.handleBuildPlacement(e.clientX, e.clientY);
        return;
      }

      // Rally point mode: place rally point on click
      if (this.rallyPointMode && this.rallyPointBuildingEid >= 0) {
        this.handleRallyPointPlacement(e.clientX, e.clientY);
        return;
      }

      // Attack-move mode: issue attack-move command at clicked position
      if (this.attackMoveMode) {
        this.handleAttackMoveClick(e.clientX, e.clientY);
        return;
      }

      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.isDragging = true;
    }) as EventListener);

    // Left mouseup: finish drag-box or single-click select
    this.addTrackedListener(canvas, 'mouseup', ((e: MouseEvent) => {
      if (e.button === 2) {
        // Right click: context command
        if (this.buildMode) {
          this.exitBuildMode();
          return;
        }
        if (this.rallyPointMode) {
          this.exitRallyPointMode();
          return;
        }
        // Right-click cancels attack-move mode
        if (this.attackMoveMode) {
          this.exitAttackMoveMode();
          return;
        }
        this.handleRightClick(e.clientX, e.clientY);
        return;
      }

      if (e.button !== 0 || !this.isDragging) return;
      this.isDragging = false;

      // Hide drag box
      if (this.dragBoxDiv) this.dragBoxDiv.style.display = 'none';

      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        // Drag-box select: find all player units inside the rectangle
        const selected = this.boxSelectUnits(this.dragStartX, this.dragStartY, e.clientX, e.clientY);
        this.selectedEntities = selected;
      } else {
        // Single click select
        let hit = this.raycastEntities(e.clientX, e.clientY);
        // Fallback: if raycasting misses, try position-based detection via terrain click
        if (hit === null) {
          this.mouseVec.set(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
          );
          this.raycaster.setFromCamera(this.mouseVec, this.camera.camera);
          const terrainHits = this.raycaster.intersectObject(this.terrain.mesh);
          if (terrainHits.length > 0) {
            const pt = terrainHits[0].point;
            hit = this.findEntityAtPosition(pt.x, pt.z);
          }
        }
        if (hit !== null && Faction.id[hit] === this.playerFactionId) {
          // Ctrl+click: select ALL units of the same type and faction
          if (e.ctrlKey || e.metaKey) {
            this.selectedEntities = this.selectAllSameType(hit);
          } else {
            this.selectedEntities = [hit];
          }
        } else {
          this.selectedEntities = [];
        }
      }
      this.onSelectionChanged(this.selectedEntities);
    }) as EventListener);

    // Mouse move: build ghost + drag box update
    this.addTrackedListener(canvas, 'mousemove', ((e: MouseEvent) => {
      if (this.buildMode && this.buildGhostType) {
        this.updateBuildGhost(e.clientX, e.clientY);
      }
      // Update drag box overlay
      if (this.isDragging && this.dragBoxDiv) {
        const minX = Math.min(this.dragStartX, e.clientX);
        const minY = Math.min(this.dragStartY, e.clientY);
        const w = Math.abs(e.clientX - this.dragStartX);
        const h = Math.abs(e.clientY - this.dragStartY);
        if (w > 5 || h > 5) {
          this.dragBoxDiv.style.display = 'block';
          this.dragBoxDiv.style.left = `${minX}px`;
          this.dragBoxDiv.style.top = `${minY}px`;
          this.dragBoxDiv.style.width = `${w}px`;
          this.dragBoxDiv.style.height = `${h}px`;
        }
      }
    }) as EventListener);

    // Keyboard shortcuts
    this.addTrackedListener(window, 'keydown', ((e: KeyboardEvent) => {
      // Escape: cancel modes
      if (e.code === 'Escape') {
        if (this.attackMoveMode) { this.exitAttackMoveMode(); return; }
        if (this.rallyPointMode) { this.exitRallyPointMode(); return; }
        if (this.buildMode) { this.exitBuildMode(); return; }
      }

      // --- Control groups: Ctrl+1..9 assigns, 1..9 recalls ---
      const digitMatch = e.code.match(/^(?:Digit|Numpad)([1-9])$/);
      if (digitMatch) {
        const groupNum = parseInt(digitMatch[1], 10);
        const isCtrl = e.ctrlKey || e.metaKey;

        if (isCtrl) {
          // Ctrl+number: assign control group from current selection
          this.assignControlGroup(groupNum);
          e.preventDefault();
          return;
        }

        // Number key without Ctrl: check if hero is selected first (for ability hotkeys)
        const hasHeroSelected = this.selectedEntities.some(eid =>
          hasComponent(world, eid, IsHero) && !hasComponent(world, eid, IsDead) &&
          Faction.id[eid] === this.playerFactionId
        );

        if (hasHeroSelected && groupNum <= 3) {
          // Hero ability hotkeys 1/2/3
          this.useHeroAbility(groupNum - 1);
          return;
        }

        // Recall control group
        this.recallControlGroup(groupNum);
        return;
      }

      // Check if a building is selected for production hotkeys
      const selectedBuilding = this.selectedEntities.length === 1 &&
        hasComponent(world, this.selectedEntities[0], IsBuilding) &&
        Faction.id[this.selectedEntities[0]] === this.playerFactionId
        ? this.selectedEntities[0] : null;

      // Building production hotkeys: dynamically resolved from building card buttons
      // Q=Worker, W=Infantry, E=Ranged, A=Heavy, S=Siege, D=Support, T/Y=Heroes, R=Rally
      if (selectedBuilding && Building.complete[selectedBuilding] === 1) {
        // Find the matching button in the building card by hotkey
        const hotkeyChar = e.code.replace('Key', '');
        const bcardBtn = document.querySelector<HTMLButtonElement>(
          `#building-card:not([hidden]) .bcard-action-btn[data-hotkey="${hotkeyChar}"]`,
        );
        if (bcardBtn && !bcardBtn.hidden && !bcardBtn.disabled) {
          const action = bcardBtn.dataset.action;
          if (action === 'train-worker')   { this.trainFromSelectedBuilding(UnitTypeId.Worker);   return; }
          if (action === 'train-infantry') { this.trainFromSelectedBuilding(UnitTypeId.Infantry); return; }
          if (action === 'train-ranged')   { this.trainFromSelectedBuilding(UnitTypeId.Ranged);   return; }
          if (action === 'train-heavy')    { this.trainFromSelectedBuilding(UnitTypeId.Heavy);    return; }
          if (action === 'train-siege')    { this.trainFromSelectedBuilding(UnitTypeId.Siege);    return; }
          if (action === 'train-support')  { this.trainFromSelectedBuilding(UnitTypeId.Support);  return; }
          if (action === 'rally-point' && hasComponent(world, selectedBuilding, RallyPoint)) {
            this.enterRallyPointMode();
            return;
          }
          if (action?.startsWith('train-hero-')) {
            const heroIdx = parseInt(action.replace('train-hero-', ''), 10);
            if (!isNaN(heroIdx)) { this.trainFactionHero(heroIdx); return; }
          }
        }
        // Fallback for legacy hardcoded hotkeys (T/Y for heroes when no bcard button found)
        if (e.code === 'KeyT') { this.trainFactionHero(0); return; }
        if (e.code === 'KeyY') { this.trainFactionHero(1); return; }
      }

      // A key: enter attack-move mode (only if units are selected)
      if (e.code === 'KeyA' && !this.buildMode && !this.rallyPointMode) {
        if (this.selectedEntities.length > 0 &&
            this.selectedEntities.some(eid =>
              hasComponent(world, eid, IsUnit) && Faction.id[eid] === this.playerFactionId
            )) {
          this.enterAttackMoveMode();
          return;
        }
      }

      // B key for build barracks (when worker selected)
      if (e.code === 'KeyB') {
        const hasWorker = this.selectedEntities.some(eid =>
          hasComponent(world, eid, IsWorker) && Faction.id[eid] === this.playerFactionId
        );
        if (hasWorker) {
          this.enterBuildMode('barracks');
        }
      }
      // V key for Carnavalsrage ability ("Vuur los!")
      if (e.code === 'KeyV') {
        const success = activateCarnavalsrage();
        if (success) {
          this.hud?.showAlert('CARNAVALSRAGE! Alle units +50% attack, +25% speed, +25% armor!', 'info');
        } else {
          const state = getCarnavalsrageState();
          const config = getCarnavalsrageConfig();
          if (state.active) {
            this.hud?.showAlert('Carnavalsrage is al actief!', 'warning');
          } else if (state.cooldownRemaining > 0) {
            this.hud?.showAlert(`Carnavalsrage cooldown: ${Math.ceil(state.cooldownRemaining)}s`, 'warning');
          } else {
            const current = Math.floor(this.playerState.getGezelligheid(this.playerFactionId));
            this.hud?.showAlert(`Niet genoeg Gezelligheid! (${current}/${config.cost})`, 'warning');
          }
        }
      }
    }) as EventListener);
  }

  private setupEventListeners(): void {
    if (this.eventListenersSetup) return;
    this.eventListenersSetup = true;

    // Listen for unit-trained events to track spawned units
    eventBus.on('unit-trained', (event) => {
      this.stats.unitsProduced++;
      // Create mesh for newly trained unit
      const eid = event.entityId;
      if (!this.entityMeshMap.has(eid)) {
        const factionIdx = event.factionId;
        const typeName = unitTypeName(event.unitTypeId);
        const mesh = this.unitRenderer.addUnit(eid, typeName, factionIdx);
        if (mesh) {
          mesh.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
          mesh.userData.eid = eid;
          this.entityMeshMap.set(eid, mesh);
        }
        this.knownUnitEntities.add(eid);

        // Apply completed tech tree upgrades to newly trained unit
        techTreeSystem.applyAllUpgradesToNewUnit(eid, event.factionId);
      }
      // Audio: play faction-specific voice line when unit spawns (player only)
      if (event.factionId === this.playerFactionId) {
        playUnitVoice(event.factionId, 'ready', event.unitTypeId);
      }
    });

    eventBus.on('unit-died', (event) => {
      if (event.factionId === this.playerFactionId) {
        this.stats.unitsLost++;
      } else {
        this.stats.enemiesKilled++;
      }
      // Audio + death particles
      const eid = event.entityId;
      const pos = this.entityMeshMap.get(eid)?.position;
      if (pos) {
        audioManager.playSound('unit_death', { x: pos.x, z: pos.z });
        const factionColor = FACTION_DEATH_COLORS[event.factionId] ?? 0x4a4a5a;
        this.particles.spawnDeathEffect(pos.x, pos.y, pos.z, factionColor);
      }
      // Remove mesh
      this.unitRenderer.removeUnit(eid);
      this.entityMeshMap.delete(eid);
      this.knownUnitEntities.delete(eid);
      // Remove from selection
      this.selectedEntities = this.selectedEntities.filter(e => e !== eid);
    });

    // Hero events
    eventBus.on('hero-died', (event) => {
      const archetype = HERO_ARCHETYPES[event.heroTypeId];
      if (archetype) this.hud?.showAlert(`${archetype.name} is gevallen! Revival in 60s...`, 'warning');
      audioManager.playSound('hero_death');
    });

    eventBus.on('hero-revived', (event) => {
      const eid = event.entityId;
      const archetype = HERO_ARCHETYPES[event.heroTypeId];
      if (archetype) this.hud?.showAlert(`${archetype.name} is terug!`, 'info');
      audioManager.playSound('hero_spawn');
      // Mesh creation is handled by detectAndRenderNewEntities
    });

    // Hero ability + heal visual effects
    initAbilityEffects(this.particles, this.camera);

    // Audio + particles: combat hits
    eventBus.on('combat-hit', (event) => {
      const targetPos = { x: event.x, z: event.z };
      const targetY = this.terrain.getHeightAt(event.x, event.z) + 1.0;
      if (event.isRanged) {
        const attackerPos = { x: Position.x[event.attackerEid], z: Position.z[event.attackerEid] };
        audioManager.playSound('arrow_shoot', attackerPos);
        audioManager.playSound('arrow_impact', targetPos);
      } else {
        audioManager.playSound('sword_hit', targetPos);
      }
      this.particles.spawnCombatHit(event.x, targetY, event.z, event.isRanged);
      // Camera shake on melee hits (subtle)
      if (!event.isRanged) {
        this.camera.shake(0.15, 0.15);
      }
    });

    // Audio + particles: building placed
    eventBus.on('building-placed', (event) => {
      const y = this.terrain.getHeightAt(event.x, event.z);
      this.particles.spawnConstructionDust(event.x, y, event.z);
      if (event.factionId === this.playerFactionId) {
        audioManager.playSound('building_complete', { x: event.x, z: event.z });
        // Housing population toast — provides instant feedback that pop-cap bumped.
        if (event.buildingTypeId === BuildingTypeId.Housing) {
          const arch = BUILDING_ARCHETYPES[BuildingTypeId.Housing];
          const provided = arch?.populationProvided ?? 10;
          const popCur = this.playerState.getPopulation(this.playerFactionId);
          const popMax = this.playerState.getPopulationMax(this.playerFactionId);
          const houseName = getDisplayBuildingName(this.playerFactionId, BuildingTypeId.Housing);
          this.hud?.showAlert(`${houseName} klaar — populatie-cap +${provided} (${popCur}/${popMax})`, 'info');
        }
      }
    });

    // Audio + particles: resource deposited
    eventBus.on('resource-deposited', (event) => {
      if (event.factionId === this.playerFactionId) {
        audioManager.playSound('gold_deposit');
        // Gold sparkle at town hall
        const base = this.getPlayerBasePosition();
        const y = this.terrain.getHeightAt(base.x, base.z) + 1.5;
        this.particles.spawnGoldSparkle(base.x, y, base.z);
      }
    });

    // Audio + particles: carnavalsrage activated
    eventBus.on('carnavalsrage-activated', () => {
      audioManager.playSound('carnavalsrage');
      audioManager.duckMusic(3000);
      // Orange ability burst around player base + heavy shake
      const base = this.getPlayerBasePosition();
      const y = this.terrain.getHeightAt(base.x, base.z) + 0.5;
      this.particles.spawnAbilityBurst(base.x, y, base.z, 0xff6600, 8);
      this.camera.shake(0.6, 0.5);
    });

    // Audio: vergadering ability
    eventBus.on('vergadering', (event) => {
      audioManager.playSound('vergadering', { x: event.x, z: event.z });
    });

    // Tech tree: research completed notification
    eventBus.on('research-completed', (event) => {
      if (event.factionId === this.playerFactionId) {
        this.hud?.showAlert(`Onderzoek voltooid: ${event.upgradeName}`, 'info');
        audioManager.playSound('upgrade_complete');
      }
    });
  }

  private handleBuildPlacement(screenX: number, screenY: number): void {
    if (!this.buildGhostType) return;

    this.mouseVec.set(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouseVec, this.camera.camera);
    const hits = this.raycaster.intersectObject(this.terrain.mesh);

    if (hits.length > 0) {
      const point = hits[0].point;
      const buildingTypeId = this.getBuildingTypeIdForGhost(this.buildGhostType);
      const buildingLabel = this.getBuildingLabel(this.buildGhostType);

      // Placement validation
      const placement = validateBuildingPlacement(world, buildingTypeId, this.playerFactionId, point.x, point.z, this.terrain);
      if (!placement.valid) {
        this.hud?.showAlert(placement.reason ?? 'Kan hier niet bouwen', 'warning');
        return;
      }

      // Affordability check + deduct (extracted to buildingCost helper)
      const cost = checkBuildingAffordability(buildingTypeId, this.playerFactionId, this.playerState);
      if (!cost.ok) {
        const label = cost.missing === 'gold' ? 'goud' : 'hout';
        this.hud?.showAlert(`Niet genoeg ${label}! (${cost.required} nodig)`, 'warning');
        return;
      }
      chargeBuildingCost(cost.goldCost, cost.woodCost, this.playerFactionId, this.playerState);

      // Spawn building
      const eid = this.spawnBuildingAtRuntime(buildingTypeId, this.playerFactionId, point.x, point.z);

      // Send nearest worker to build site
      queueCommand({
        type: 'build',
        buildingTypeId,
        x: point.x,
        z: point.z,
      });

      this.stats.buildingsBuilt++;
      audioManager.playSound('building_place', { x: point.x, z: point.z });
      this.hud?.showAlert(`${buildingLabel} wordt gebouwd!`, 'info');
      this.exitBuildMode();
    }
  }

  private updateBuildGhost(screenX: number, screenY: number): void {
    if (!this.buildGhostType) return;

    this.mouseVec.set(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouseVec, this.camera.camera);
    const hits = this.raycaster.intersectObject(this.terrain.mesh);

    if (hits.length > 0) {
      const point = hits[0].point;
      // Use 'barracks' ghost model for buildings without dedicated model
      const ghostModel = 'barracks';
      this.buildingRenderer.showGhost(
        ghostModel,
        this.playerFactionId,
        point.x,
        point.y,
        point.z,
        true
      );
    }
  }

  /** Spawn a building during gameplay (not from map generation). */
  private spawnBuildingAtRuntime(type: BuildingTypeId, faction: FactionId, x: number, z: number): number {
    const eid = this.createBuildingEntity(type, faction, x, z);

    if (faction !== this.playerFactionId) {
      // AI buildings complete instantly (AI paid gold upfront)
      Building.complete[eid] = 1;
      Building.progress[eid] = 1;
    } else {
      // Player buildings require worker construction
      Building.complete[eid] = 0;
      Building.progress[eid] = 0;
      const arch = BUILDING_ARCHETYPES[type];
      Building.maxProgress[eid] = arch.buildTime;
    }

    const factionIdx = faction;
    const typeName = this.getBuildingRendererType(type);
    const y = this.terrain.getHeightAt(x, z);
    const startProgress = faction !== this.playerFactionId ? 1.0 : 0.0;
    const mesh = this.buildingRenderer.addBuilding(eid, typeName, factionIdx, x, y, z, startProgress);
    if (mesh) {
      mesh.userData.eid = eid;
      this.entityMeshMap.set(eid, mesh);
    }
    this.knownBuildingEntities.add(eid);
    return eid;
  }

  /** Start training a unit from a building. */
  private startTrainingUnit(buildingEid: number, unitType: UnitTypeId): boolean {
    if (!hasComponent(world, buildingEid, IsBuilding)) return false;
    if (Building.complete[buildingEid] !== 1) return false;

    // Ensure Production component exists
    if (!hasComponent(world, buildingEid, Production)) {
      addComponent(world, buildingEid, Production);
      Production.unitType[buildingEid] = NO_PRODUCTION;
      Production.progress[buildingEid] = 0;
      Production.queue0[buildingEid] = NO_PRODUCTION;
      Production.queue1[buildingEid] = NO_PRODUCTION;
      Production.queue2[buildingEid] = NO_PRODUCTION;
      Production.queue3[buildingEid] = NO_PRODUCTION;
      Production.queue4[buildingEid] = NO_PRODUCTION;
    }

    const buildTimes: Record<number, number> = {
      [UnitTypeId.Worker]: 12,
      [UnitTypeId.Infantry]: 18,
      [UnitTypeId.Ranged]: 20,
    };

    if (Production.unitType[buildingEid] === NO_PRODUCTION) {
      Production.unitType[buildingEid] = unitType;
      Production.progress[buildingEid] = 0;
      Production.duration[buildingEid] = buildTimes[unitType] || 15;
      return true;
    }

    // Queue
    const queueSlots = [
      Production.queue0,
      Production.queue1,
      Production.queue2,
      Production.queue3,
      Production.queue4,
    ];
    for (const slot of queueSlots) {
      if (slot[buildingEid] === NO_PRODUCTION) {
        slot[buildingEid] = unitType;
        return true;
      }
    }

    return false; // Queue full
  }

  /** Get all living entity IDs. */
  private getAllLivingEntityIds(): number[] {
    const ids: number[] = [];
    for (const eid of this.knownUnitEntities) {
      if (entityExists(world, eid)) ids.push(eid);
    }
    for (const eid of this.knownBuildingEntities) {
      if (entityExists(world, eid)) ids.push(eid);
    }
    // Add gold mine eids
    for (const [eid] of this.entityMeshMap) {
      if (!ids.includes(eid) && entityExists(world, eid)) {
        ids.push(eid);
      }
    }
    return ids;
  }

  private onSelectionChanged(entityIds: number[]): void {
    this.selectedEntities = entityIds;

    // Empty selection → hide tower range indicator + research panels.
    if (entityIds.length === 0) {
      this.towerRangeRenderer?.hide();
    }

    // Clear old Selected components
    const allUnits = query(world, [Selected]);
    for (const eid of allUnits) {
      Selected.by[eid] = 255; // Deselect
    }

    // Set new Selected components
    for (const eid of entityIds) {
      if (!entityExists(world, eid)) continue;
      if (!hasComponent(world, eid, Selected)) {
        addComponent(world, eid, Selected);
      }
      Selected.by[eid] = 0; // Selected by player
    }

    // Audio: play select sound + voice line when selecting own units
    if (entityIds.length > 0) {
      audioManager.playSound('select_unit');
      const firstEid = entityIds[0];
      if (hasComponent(world, firstEid, IsUnit)) {
        playUnitVoice(Faction.id[firstEid], 'select', UnitType.id[firstEid]);
      }
    }

    // Update HUD
    if (this.hud && entityIds.length > 0) {
      const firstEid = entityIds[0];

      // Check if it's a building
      if (hasComponent(world, firstEid, IsBuilding) && Faction.id[firstEid] === this.playerFactionId) {
        const buildingType = Building.typeId[firstEid];
        const buildingName = this.getBuildingName(buildingType);
        const queueItems = this.getBuildingQueue(firstEid);

        // Hide hero panel -- buildings don't have hero abilities
        const heroPanel = document.getElementById('cmd-hero');
        if (heroPanel) heroPanel.hidden = true;

        // Hide blacksmith panel by default (shown only for Blacksmith selection)
        this.hud.hideBlacksmithPanel();

        // Range-indicator: show only for selected DefenseTower; hide otherwise.
        if (buildingType === BuildingTypeId.DefenseTower && Building.complete[firstEid] === 1) {
          const tx = Position.x[firstEid];
          const tz = Position.z[firstEid];
          this.towerRangeRenderer.show(tx, tz, this.terrain.getHeightAt(tx, tz));
        } else {
          this.towerRangeRenderer.hide();
        }

        if (buildingType === BuildingTypeId.Blacksmith && Building.complete[firstEid] === 1) {
          // Blacksmith: show building card WITHOUT training actions + show research panel
          const cardData = this.buildBuildingCardData(firstEid, buildingType, buildingName, queueItems, true);
          this.hud.showBuildingCard(cardData);
          this.showBlacksmithResearchUI(firstEid);
        } else if (buildingType === BuildingTypeId.LumberCamp && Building.complete[firstEid] === 1) {
          // LumberCamp: show building card + wood-upgrade research panel (re-uses Blacksmith DOM mutex).
          const cardData = this.buildBuildingCardData(firstEid, buildingType, buildingName, queueItems, true);
          this.hud.showBuildingCard(cardData);
          this.showLumberCampResearchUI(firstEid);
        } else if (buildingType === BuildingTypeId.UpgradeBuilding && Building.complete[firstEid] === 1) {
          // UpgradeBuilding: show building card + T3 + faction-unique research panel.
          const cardData = this.buildBuildingCardData(firstEid, buildingType, buildingName, queueItems, true);
          this.hud.showBuildingCard(cardData);
          this.showUpgradeBuildingResearchUI(firstEid);
        } else if (buildingType === BuildingTypeId.FactionSpecial1 && Building.complete[firstEid] === 1) {
          // FactionSpecial1: card with optional boardroom action (Randstad).
          const cardData = this.buildBuildingCardData(firstEid, buildingType, buildingName, queueItems, true);
          this.hud.showBuildingCard(cardData);
        } else {
          // Normal production building: show building card with training actions
          const cardData = this.buildBuildingCardData(firstEid, buildingType, buildingName, queueItems, false);
          this.hud.showBuildingCard(cardData);
        }
      } else if (hasComponent(world, firstEid, IsUnit)) {
        // Unit(s) selected
        const units: SelectedUnit[] = entityIds.map(eid => {
          const fid = Faction.id[eid] as FactionId;
          const utid = UnitType.id[eid] as UnitTypeId;
          const isHeroUnit = hasComponent(world, eid, IsHero);
          const heroTypeId = isHeroUnit ? Hero.heroTypeId[eid] as HeroTypeId : undefined;
          return {
            id: eid,
            name: this.getUnitName(eid),
            hp: Health.current[eid],
            maxHp: Health.max[eid],
            atk: Attack.damage[eid],
            arm: Armor.value[eid],
            spd: Movement.speed[eid],
            level: 1,
            status: this.getUnitStatus(eid),
            portrait: getPortraitUrl(fid, utid, isHeroUnit, heroTypeId),
          };
        });
        this.hud.showUnitPanel(units);
        this.towerRangeRenderer.hide();

        // Show worker commands if a worker is selected
        const hasWorker = entityIds.some(eid => hasComponent(world, eid, IsWorker));
        if (hasWorker) {
          this.hud.showWorkerCommands();
          // Update tier lock state for build buttons
          const unlockedTier = techTreeSystem.getUnlockedTier(this.playerFactionId, world);
          this.hud.updateBuildLocks(unlockedTier);
        }
        // Show hero ability panel if a hero is selected
        const heroEid = entityIds.find(eid => hasComponent(world, eid, IsHero));
        if (heroEid !== undefined) {
          const heroPanel = document.getElementById('cmd-hero');
          if (heroPanel) {
            heroPanel.hidden = false;
            // Hide other command panels
            const otherPanels = ['cmd-unit', 'cmd-multi', 'cmd-worker'];
            for (const id of otherPanels) {
              const el = document.getElementById(id);
              if (el) el.hidden = true;
            }
            // Ability names, cooldowns, costs, and tooltips are updated
            // every frame by updateHeroAbilityBar() in updateHUD().
          }
        }
      }
    } else if (this.hud) {
      this.hud.hideSelectionPanel();
      this.hud.hideBlacksmithPanel();
      // Hide all command panels
      const panels = ['cmd-unit', 'cmd-multi', 'cmd-building', 'cmd-worker', 'cmd-hero', 'cmd-blacksmith'];
      for (const id of panels) {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
      }
    }
  }

  private getBuildingQueue(eid: number): Array<{ unitName: string; progress: number; remainingSeconds: number }> {
    const items: Array<{ unitName: string; progress: number; remainingSeconds: number }> = [];
    if (!hasComponent(world, eid, Production)) return items;
    const fid = Faction.id[eid];

    if (Production.unitType[eid] !== NO_PRODUCTION) {
      const progress = Production.progress[eid];
      const duration = Production.duration[eid];
      const remaining = Math.max(0, duration * (1 - progress));
      items.push({
        unitName: this.getUnitNameByType(Production.unitType[eid], fid),
        progress,
        remainingSeconds: remaining,
      });
    }

    // Add queued items (queue0-queue4)
    const queueSlots = [Production.queue0, Production.queue1, Production.queue2, Production.queue3, Production.queue4];
    for (const slot of queueSlots) {
      const unitType = slot[eid];
      if (unitType !== NO_PRODUCTION) {
        items.push({
          unitName: this.getUnitNameByType(unitType, fid),
          progress: 0,
          remainingSeconds: 0,
        });
      }
    }
    return items;
  }

  private getUnitStatus(eid: number): 'idle' | 'moving' | 'attacking' | 'gathering' | 'building' {
    const state = UnitAI.state[eid];
    switch (state) {
      case UnitAIState.Idle: return 'idle';
      case UnitAIState.Moving: return 'moving';
      case UnitAIState.Attacking: return 'attacking';
      case UnitAIState.MovingToResource:
      case UnitAIState.Gathering:
      case UnitAIState.Returning:
        return 'gathering';
      default: return 'idle';
    }
  }

  private handleRightClick(screenX: number, screenY: number): void {
    const selected = this.selectedEntities;
    if (selected.length === 0) return;

    // Raycast to find world position
    this.mouseVec.set(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouseVec, this.camera.camera);
    const hits = this.raycaster.intersectObject(this.terrain.mesh);

    if (hits.length > 0) {
      const point = hits[0].point;

      // Check if we clicked on an enemy or a resource
      const targetEid = this.findEntityAtPosition(point.x, point.z);

      // Rally point: if a single own production building is selected,
      // right-click sets the rally point instead of issuing a move command
      if (selected.length === 1) {
        const bEid = selected[0];
        if (hasComponent(world, bEid, IsBuilding) &&
            Faction.id[bEid] === this.playerFactionId &&
            Building.complete[bEid] === 1 &&
            hasComponent(world, bEid, RallyPoint)) {
          // Right-click on the building itself clears the rally point
          if (targetEid === bEid) {
            this.clearRallyPoint(bEid);
            return;
          }
          // If right-clicking a resource, set rally point with resource target
          if (targetEid !== null && hasComponent(world, targetEid, IsResource)) {
            this.setRallyPoint(bEid, point.x, point.z, targetEid);
          } else {
            this.setRallyPoint(bEid, point.x, point.z);
          }
          return;
        }
      }

      // Determine unit type of first selected unit for voice lines
      const voiceEid = selected[0];
      const voiceFaction = hasComponent(world, voiceEid, IsUnit) ? Faction.id[voiceEid] : this.playerFactionId;
      const voiceUnitType = hasComponent(world, voiceEid, IsUnit) ? UnitType.id[voiceEid] : undefined;

      if (targetEid !== null && Faction.id[targetEid] !== this.playerFactionId &&
          (hasComponent(world, targetEid, IsUnit) || hasComponent(world, targetEid, IsBuilding))) {
        // Attack enemy unit or building
        queueCommand({ type: 'attack', targetEid });
        playUnitVoice(voiceFaction, 'attack', voiceUnitType);
      } else if (targetEid !== null && hasComponent(world, targetEid, IsResource)) {
        // Gather from resource
        queueCommand({ type: 'gather', targetEid });
        playUnitVoice(voiceFaction, 'gather', voiceUnitType);
      } else {
        // Move to position
        queueCommand({ type: 'move', targetX: point.x, targetZ: point.z });
        // Show green move indicator
        this.unitRenderer.showMoveIndicator(point.x, point.y, point.z);
        playUnitVoice(voiceFaction, 'move', voiceUnitType);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Rally point management
  // -----------------------------------------------------------------------

  /**
   * Set a rally point on a production building.
   * Updates the ECS RallyPoint component and shows a visual flag marker.
   */
  private setRallyPoint(buildingEid: number, x: number, z: number, resourceEid: number = NO_ENTITY): void {
    RallyPoint.x[buildingEid] = x;
    RallyPoint.z[buildingEid] = z;
    RallyPoint.resourceEid[buildingEid] = resourceEid;
    const factionId = Faction.id[buildingEid];
    this.buildingRenderer.setRallyPoint(buildingEid, x, z, factionId);
    audioManager.playSound('click');
  }

  /**
   * Clear the rally point on a production building (reset to default offset).
   */
  private clearRallyPoint(buildingEid: number): void {
    // Reset to default position: offset from building
    RallyPoint.x[buildingEid] = Position.x[buildingEid] + 3;
    RallyPoint.z[buildingEid] = Position.z[buildingEid];
    RallyPoint.resourceEid[buildingEid] = NO_ENTITY;
    this.buildingRenderer.removeRallyPoint(buildingEid);
    this.hud?.showAlert('Rally point gewist', 'info');
  }

  /**
   * Handle left-click during rally point placement mode.
   * Raycasts the terrain and sets the rally point at the clicked position.
   */
  private handleRallyPointPlacement(screenX: number, screenY: number): void {
    this.mouseVec.set(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouseVec, this.camera.camera);
    const hits = this.raycaster.intersectObject(this.terrain.mesh);

    if (hits.length > 0 && this.rallyPointBuildingEid >= 0) {
      const point = hits[0].point;
      const targetEid = this.findEntityAtPosition(point.x, point.z);
      if (targetEid !== null && hasComponent(world, targetEid, IsResource)) {
        this.setRallyPoint(this.rallyPointBuildingEid, point.x, point.z, targetEid);
      } else {
        this.setRallyPoint(this.rallyPointBuildingEid, point.x, point.z);
      }
    }

    this.exitRallyPointMode();
  }

  private raycastEntities(screenX: number, screenY: number): number | null {
    this.mouseVec.set(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouseVec, this.camera.camera);
    const meshes = Array.from(this.entityMeshMap.values());
    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      // Walk up to find the registered root
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj) {
        const eid = obj.userData?.eid;
        if (eid !== undefined) return eid;
        obj = obj.parent;
      }
    }
    return null;
  }

  private findEntityAtPosition(x: number, z: number): number | null {
    return findEntityAtPosition(world, this.entityMeshMap, x, z);
  }

  private boxSelectUnits(x1: number, y1: number, x2: number, y2: number): number[] {
    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
    const selected: number[] = [];
    for (const [eid, mesh] of this.entityMeshMap) {
      if (!hasComponent(world, eid, IsUnit)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      const screenPos = this.camera.worldToScreen(mesh.position);
      if (screenPos.x >= minX && screenPos.x <= maxX && screenPos.y >= minY && screenPos.y <= maxY) {
        selected.push(eid);
      }
    }
    return selected;
  }

  private getUnitName(eid: number): string {
    // Check if hero first
    if (hasComponent(world, eid, IsHero) && hasComponent(world, eid, Hero)) {
      const htId = Hero.heroTypeId[eid] as HeroTypeId;
      const arch = HERO_ARCHETYPES[htId];
      if (arch) return arch.name;
    }
    const type = UnitType.id[eid];
    const factionId = Faction.id[eid];
    return this.getUnitNameByType(type, factionId);
  }

  private getUnitNameByType(type: number, factionId?: number): string {
    const fid = factionId ?? this.playerFactionId;
    try {
      return getDisplayUnitName(fid, type as UnitTypeId);
    } catch {
      return 'Unit';
    }
  }

  private getBuildingName(buildingType: number, factionId?: number): string {
    const fid = factionId ?? this.playerFactionId;
    return getDisplayBuildingName(fid, buildingType as BuildingTypeId);
  }

  private getBuildingHudType(buildingType: number): 'townhall' | 'barracks' | 'lumbercamp' | 'blacksmith' {
    switch (buildingType) {
      case BuildingTypeId.TownHall: return 'townhall';
      case BuildingTypeId.LumberCamp: return 'lumbercamp';
      case BuildingTypeId.Blacksmith: return 'blacksmith';
      default: return 'barracks';
    }
  }

  /** Map BuildingTypeId to BuildingRenderer type name. Falls back to 'barracks' for unknown types. */
  private getBuildingRendererType(buildingType: number): import('../rendering/BuildingRenderer').BuildingTypeName {
    switch (buildingType) {
      case BuildingTypeId.TownHall: return 'townhall';
      case BuildingTypeId.LumberCamp: return 'lumbercamp';
      case BuildingTypeId.Blacksmith: return 'blacksmith';
      case BuildingTypeId.Housing: return 'housing';
      case BuildingTypeId.DefenseTower: return 'tower';
      case BuildingTypeId.FactionSpecial2: return 'advanced';
      case BuildingTypeId.SiegeWorkshop: return 'siege-workshop';
      case BuildingTypeId.TertiaryResourceBuilding: return 'tertiary';
      case BuildingTypeId.UpgradeBuilding: return 'upgrade';
      case BuildingTypeId.FactionSpecial1: return 'special1';
      default: return 'barracks';
    }
  }

  /**
   * Build the BuildingCardData for the new building info card.
   * Gathers building name, faction, HP, status, and available actions.
   */
  private buildBuildingCardData(
    eid: number,
    buildingType: number,
    buildingName: string,
    queueItems: Array<{ unitName: string; progress: number; remainingSeconds: number }>,
    isBlacksmith: boolean,
  ): BuildingCardData {
    // Faction display names
    const factionDisplayNames: Record<number, string> = {
      [FactionId.Brabanders]: 'Brabanders',
      [FactionId.Randstad]: 'Randstad',
      [FactionId.Limburgers]: 'Limburgers',
      [FactionId.Belgen]: 'Belgen',
    };

    // Building portrait abbreviations
    const portraitAbbrevs: Record<number, string> = {
      [BuildingTypeId.TownHall]: 'TH',
      [BuildingTypeId.Barracks]: 'BRK',
      [BuildingTypeId.LumberCamp]: 'LMB',
      [BuildingTypeId.Blacksmith]: 'BSM',
    };

    // Build status string
    let status = 'Idle';
    if (Building.complete[eid] !== 1) {
      status = 'Under construction';
    } else if (queueItems.length > 0) {
      const current = queueItems[0];
      const queueCount = queueItems.length - 1;
      const timeStr = current.remainingSeconds > 0 ? ` (${Math.ceil(current.remainingSeconds)}s)` : '';
      status = queueCount > 0
        ? `Training ${current.unitName}${timeStr} +${queueCount}`
        : `Training ${current.unitName}${timeStr}`;
    } else if (buildingType === BuildingTypeId.UpgradeBuilding) {
      // UpgradeBuilding (Wagenbouwer/Innovatie Lab/Hoogoven/Diamantslijperij)
      // unlocks Tier 3 (FactionSpecial2 + SiegeWorkshop) + hosts T3 research.
      status = 'Tier 3 ontgrendeld — Selecteer voor onderzoek';
    } else if (buildingType === BuildingTypeId.DefenseTower && Building.complete[eid] === 1) {
      status = 'Patrouilleert — schiet automatisch op vijanden';
    }

    // Stats / infoText for non-production buildings
    let stats: { range?: number; dps?: number; armor?: number } | undefined;
    let infoText: string | undefined;
    if (buildingType === BuildingTypeId.DefenseTower) {
      stats = { range: TOWER_RANGE, dps: TOWER_DAMAGE / TOWER_ATTACK_SPEED, armor: 0 };
    } else if (buildingType === BuildingTypeId.Housing) {
      const arch = BUILDING_ARCHETYPES[buildingType];
      const provided = arch?.populationProvided ?? 10;
      infoText = `Biedt +${provided} populatie-cap`;
    }

    // Build actions (only for non-blacksmith production buildings)
    const actions: BuildingCardAction[] = [];

    if (!isBlacksmith) {
      // Faction-specific unit names — single source of truth via factionData.
      // Previously hardcoded inline; live-bug v0.37.27 ("Sloopkogel" vs
      // factionData's "Vastgoedmakelaar" etc.) showed why duplication breaks.
      const fid = this.playerFactionId;
      const tryName = (typeId: UnitTypeId, fallback: string): string => {
        try { return getDisplayUnitName(fid, typeId); } catch { return fallback; }
      };
      const names = {
        worker:   tryName(UnitTypeId.Worker, 'Worker'),
        infantry: tryName(UnitTypeId.Infantry, 'Infantry'),
        ranged:   tryName(UnitTypeId.Ranged, 'Ranged'),
        heavy:    tryName(UnitTypeId.Heavy, 'Heavy'),
        siege:    tryName(UnitTypeId.Siege, 'Siege'),
        support:  tryName(UnitTypeId.Support, 'Support'),
      };

      // Determine what this building can produce
      const arch = BUILDING_ARCHETYPES[buildingType];
      const canProduce = arch ? new Set(arch.produces) : new Set<number>();
      const isBarracks = buildingType === BuildingTypeId.Barracks;
      const isFactionSpecial2 = buildingType === BuildingTypeId.FactionSpecial2;
      const isSiegeWorkshop = buildingType === BuildingTypeId.SiegeWorkshop;

      if (canProduce.has(UnitTypeId.Worker)) {
        actions.push({
          action: 'train-worker',
          icon: 'WRK',
          label: names.worker,
          hotkey: 'Q',
          iconClass: 'btn-icon--train',
        });
      }

      if (canProduce.has(UnitTypeId.Infantry)) {
        actions.push({
          action: 'train-infantry',
          icon: 'INF',
          label: names.infantry,
          hotkey: 'W',
          iconClass: 'btn-icon--attack',
        });
      }

      if (canProduce.has(UnitTypeId.Ranged)) {
        actions.push({
          action: 'train-ranged',
          icon: 'RNG',
          label: names.ranged,
          hotkey: 'E',
          iconClass: 'btn-icon--attack',
        });
      }

      if (canProduce.has(UnitTypeId.Heavy)) {
        actions.push({
          action: 'train-heavy',
          icon: 'HVY',
          label: names.heavy,
          hotkey: isFactionSpecial2 ? 'Q' : 'A',
          iconClass: 'btn-icon--attack',
        });
      }

      if (canProduce.has(UnitTypeId.Siege)) {
        actions.push({
          action: 'train-siege',
          icon: 'SIE',
          label: names.siege,
          hotkey: isSiegeWorkshop ? 'Q' : 'S',
          iconClass: 'btn-icon--attack',
        });
      }

      if (canProduce.has(UnitTypeId.Support)) {
        actions.push({
          action: 'train-support',
          icon: 'SUP',
          label: names.support,
          hotkey: 'D',
          iconClass: 'btn-icon--train',
        });
      }

      // Hero training (only barracks) -- dynamic per faction
      if (isBarracks) {
        const factionHeroTypes = getHeroTypesForFaction(this.playerFactionId);
        for (let i = 0; i < factionHeroTypes.length; i++) {
          const ht = factionHeroTypes[i];
          if (!isHeroActive(this.playerFactionId, ht)) {
            const arch = getHeroArchetype(ht);
            actions.push({
              action: `train-hero-${i}` as CommandAction,
              icon: `H${i + 1}`,
              label: arch.name,
              hotkey: i === 0 ? 'T' : 'Y',
              iconClass: 'btn-icon--hero',
              isHero: true,
            });
          }
        }
      }

      // Rally point (for any production building)
      if (canProduce.size > 0 || isBarracks) {
        actions.push({
          action: 'rally-point',
          icon: 'RLY',
          label: 'Rally',
          hotkey: 'R',
          iconClass: 'btn-icon--rally',
          isRally: true,
        });
      }
    }

    // FactionSpecial1 — passive info-row + click-action per factie (v0.41.0).
    // Elk gebouw toont een (niet-clickable) info-row met passive effect, plus een
    // optionele click-action waar van toepassing. Voor v1.0 perfectie consistent
    // over alle 4 facties.
    if (buildingType === BuildingTypeId.FactionSpecial1
        && Building.complete[eid] === 1) {
      const passiveByFaction: Record<number, { icon: string; label: string }> = {
        [FactionId.Brabanders]: { icon: 'CRN', label: 'Aura: +20% schade Brabant-eenheden in 12u radius' },
        [FactionId.Randstad]:   { icon: 'BRD', label: 'Click-buff: Kwartaalcijfers (zie hieronder)' },
        [FactionId.Limburgers]: { icon: 'VLA', label: 'Aura: +10 HP/5s heal Limburg-eenheden in 10u radius' },
        [FactionId.Belgen]:     { icon: 'DPL', label: 'Diplomatie: passief +1 diplomaat per 10s, click voor Persuasion' },
      };
      const passive = passiveByFaction[this.playerFactionId];
      if (passive) {
        actions.push({
          action: 'noop-info',
          icon: passive.icon,
          label: passive.label,
          hotkey: '',
          iconClass: 'btn-icon--info',
          isInfo: true,
        });
      }
    }

    // Carnavalsoptocht (Brabant Carnavalstent click-action, v0.41.0).
    if (buildingType === BuildingTypeId.FactionSpecial1
        && this.playerFactionId === FactionId.Brabanders
        && Building.complete[eid] === 1) {
      const opt = getCarnavalsoptochtState();
      let label = `Optocht (${CARNAVALSOPTOCHT_COST}g)`;
      if (opt.active) label = `Actief ${Math.ceil(opt.remaining)}s`;
      else if (!isCarnavalsoptochtReady()) label = `CD ${Math.ceil(opt.cooldown)}s`;
      actions.push({
        action: 'activate-carnavalsoptocht',
        icon: 'OPT',
        label,
        hotkey: 'T',
        iconClass: 'btn-icon--research',
      });
    }

    // Boardroom CEO Kwartaalcijfers — only for Randstad FactionSpecial1.
    if (buildingType === BuildingTypeId.FactionSpecial1
        && this.playerFactionId === FactionId.Randstad
        && Building.complete[eid] === 1) {
      let label = 'Kwartaalcijfers';
      if (boardroomBuff.active) label = `Actief ${Math.ceil(boardroomBuff.remaining)}s`;
      else if (!isBoardroomReady()) label = `CD ${Math.ceil(boardroomBuff.cooldown)}s`;
      actions.push({
        action: 'activate-boardroom',
        icon: 'CEO',
        label,
        hotkey: 'T',
        iconClass: 'btn-icon--research',
      });
    }

    // Worstenbroodjeskraam (Brabant TertiaryResource) — Trakteerronde click-action.
    if (buildingType === BuildingTypeId.TertiaryResourceBuilding
        && this.playerFactionId === FactionId.Brabanders
        && Building.complete[eid] === 1) {
      const trakteer = getTrakteerrondeState();
      let label = `Trakteer (${TRAKTEERRONDE_COST}g)`;
      if (trakteer.active) label = `Actief ${Math.ceil(trakteer.remaining)}s`;
      else if (!isTrakteerrondeReady()) label = `CD ${Math.ceil(trakteer.cooldown)}s`;
      actions.push({
        action: 'activate-trakteerronde',
        icon: 'WBR',
        label,
        hotkey: 'T',
        iconClass: 'btn-icon--research',
      });
    }

    // Havermoutmelkbar (Randstad TertiaryResource) — Sprint Mode + Deadline Crunch click-actions.
    if (buildingType === BuildingTypeId.TertiaryResourceBuilding
        && this.playerFactionId === FactionId.Randstad
        && Building.complete[eid] === 1) {
      const sprint = getSprintModeState();
      let sprintLabel = `Sprint (${SPRINT_MODE_COST}h)`;
      if (sprint.active) sprintLabel = `Actief ${Math.ceil(sprint.remaining)}s`;
      else if (!isSprintModeReady()) sprintLabel = `CD ${Math.ceil(sprint.cooldown)}s`;
      actions.push({
        action: 'activate-sprint-mode',
        icon: 'SPR',
        label: sprintLabel,
        hotkey: 'T',
        iconClass: 'btn-icon--research',
      });

      const crunch = getDeadlineCrunchState();
      let crunchLabel = `Crunch (${DEADLINE_CRUNCH_COST}h)`;
      if (crunch.active) crunchLabel = `Actief ${Math.ceil(crunch.remaining)}s`;
      else if (!isDeadlineCrunchReady()) crunchLabel = `CD ${Math.ceil(crunch.cooldown)}s`;
      actions.push({
        action: 'activate-deadline-crunch',
        icon: 'DDL',
        label: crunchLabel,
        hotkey: 'Y',
        iconClass: 'btn-icon--research',
      });
    }

    return {
      id: eid,
      name: buildingName,
      factionName: factionDisplayNames[this.playerFactionId] ?? 'Onbekend',
      hp: Health.current[eid],
      maxHp: Health.max[eid],
      status,
      queue: queueItems,
      portraitAbbrev: portraitAbbrevs[buildingType] ?? 'BLD',
      buildingTypeId: buildingType,
      actions,
      stats,
      infoText,
    };
  }

  /**
   * Show the Blacksmith research UI with upgrade buttons and progress.
   */
  private showBlacksmithResearchUI(blacksmithEid: number): void {
    if (!this.hud) return;
    const factionId = this.playerFactionId;

    // Blacksmith hosts the universal T1/T2 combat/armor/speed upgrades (IDs 0-6).
    // Wood-upgrades (7-9) live on LumberCamp; T3 + faction-unique live on UpgradeBuilding.
    // To keep the panel under 6 buttons we hide a T1 once its T2 is researched
    // (the T1 is implicit-prereq-done, no longer actionable).
    const upgrades = UPGRADE_DEFINITIONS
      .filter(def => isBlacksmithUpgrade(def.id as number))
      .filter(def => !isObsoleteT1(def.id as number))
      .map(def => buildUpgradeRow(def, factionId, this.playerState));

    // Get current research progress for this Blacksmith
    const progress = techTreeSystem.getResearchProgress(blacksmithEid, factionId);
    let researchProgress: { name: string; progress: number; remaining: number } | null = null;
    if (progress) {
      const def = getUpgradeDefinition(progress.upgradeId);
      researchProgress = {
        name: def.name,
        progress: progress.progress,
        remaining: progress.remaining,
      };
    }

    this.hud.showBlacksmithPanel(
      upgrades,
      researchProgress,
      (upgradeId: number) => {
        const success = techTreeSystem.startResearch(factionId, blacksmithEid, upgradeId as UpgradeId, world);
        if (success) {
          const def = getUpgradeDefinition(upgradeId as UpgradeId);
          this.hud?.showAlert(`Onderzoek gestart: ${def.name}`, 'info');
          audioManager.playSound('click');
          // Refresh the panel to show progress
          this.showBlacksmithResearchUI(blacksmithEid);
        } else {
          this.hud?.showAlert('Kan onderzoek niet starten!', 'warning');
        }
      },
    );
  }

  /**
   * Show the LumberCamp research UI: 3 wood-upgrade buttons (carry I/II + gather speed),
   * each with the per-faction display name. Re-uses the Blacksmith panel DOM as a mutex.
   */
  private showLumberCampResearchUI(lumberCampEid: number): void {
    if (!this.hud) return;
    const factionId = this.playerFactionId;
    const WOOD_UPGRADE_IDS: UpgradeId[] = [UpgradeId.WoodCarry1, UpgradeId.WoodCarry2, UpgradeId.WoodGather];

    const upgrades = WOOD_UPGRADE_IDS.map(id => {
      const def = getUpgradeDefinition(id);
      const display = getDisplayUpgradeName(factionId, id);
      const row = buildUpgradeRow(def, factionId, this.playerState);
      return { ...row, name: display.name, description: display.description };
    });

    const progress = techTreeSystem.getResearchProgress(lumberCampEid, factionId);
    let researchProgress: { name: string; progress: number; remaining: number } | null = null;
    if (progress) {
      const display = getDisplayUpgradeName(factionId, progress.upgradeId);
      researchProgress = { name: display.name, progress: progress.progress, remaining: progress.remaining };
    }

    this.hud.showBlacksmithPanel(
      upgrades,
      researchProgress,
      (upgradeId: number) => {
        const success = techTreeSystem.startResearch(factionId, lumberCampEid, upgradeId as UpgradeId, world);
        if (success) {
          const display = getDisplayUpgradeName(factionId, upgradeId as UpgradeId);
          this.hud?.showAlert(`Onderzoek gestart: ${display.name}`, 'info');
          audioManager.playSound('click');
          this.showLumberCampResearchUI(lumberCampEid);
        } else {
          this.hud?.showAlert('Kan onderzoek niet starten!', 'warning');
        }
      },
    );
  }

  /**
   * Show the UpgradeBuilding research UI: 4 T3 universal upgrades + 1 faction-unique
   * for the current player faction. Re-uses the Blacksmith panel DOM-mutex.
   */
  private showUpgradeBuildingResearchUI(upgradeBuildingEid: number): void {
    if (!this.hud) return;
    const factionId = this.playerFactionId;
    const ids = upgradeBuildingResearchIds(factionId);

    const upgrades = ids.map(id => {
      const def = getUpgradeDefinition(id);
      const display = getDisplayUpgradeName(factionId, id);
      const row = buildUpgradeRow(def, factionId, this.playerState);
      return { ...row, name: display.name, description: display.description };
    });

    const progress = techTreeSystem.getResearchProgress(upgradeBuildingEid, factionId);
    let researchProgress: { name: string; progress: number; remaining: number } | null = null;
    if (progress) {
      const display = getDisplayUpgradeName(factionId, progress.upgradeId);
      researchProgress = { name: display.name, progress: progress.progress, remaining: progress.remaining };
    }

    this.hud.showBlacksmithPanel(
      upgrades,
      researchProgress,
      (upgradeId: number) => {
        const success = techTreeSystem.startResearch(factionId, upgradeBuildingEid, upgradeId as UpgradeId, world);
        if (success) {
          const display = getDisplayUpgradeName(factionId, upgradeId as UpgradeId);
          this.hud?.showAlert(`Onderzoek gestart: ${display.name}`, 'info');
          audioManager.playSound('click');
          this.showUpgradeBuildingResearchUI(upgradeBuildingEid);
        } else {
          this.hud?.showAlert('Kan onderzoek niet starten!', 'warning');
        }
      },
    );
  }

  update(dt: number): void {
    if (this.gameOver) return;
    this._elapsedTime += dt;

    // Update ECS world metadata
    world.meta.deltaTime = dt;
    world.meta.elapsed += dt;
    world.meta.frame++;

    // Update audio camera position for spatial audio
    audioManager.updateCameraPosition(this.camera.camera.position.x, this.camera.camera.position.z);

    // Periodically refresh AI tag arrays
    this.aiRefreshTimer += dt;
    if (this.aiRefreshTimer >= this.aiRefreshInterval) {
      this.aiRefreshTimer = 0;
      this.refreshTagArrays();
    }

    // Run AI system
    AISystem.update(dt, world.meta.elapsed);

    // Run the system pipeline (movement, combat, gather, production, build, death, vision)
    this.pipeline.update(world, dt);

    // Update music system (battle intensity detection, crossfades)
    this.musicSystem.update(world, dt);

    // Detect newly spawned units (from ProductionSystem) that don't have meshes yet
    this.detectAndRenderNewEntities();

    // Detect HP changes for damage flash
    this.detectDamageFlash();

    // Sync ECS positions to Three.js meshes
    this.syncRenderPositions(dt);

    // Update building progress visuals
    this.syncBuildingProgress(dt);

    // Update selection circles and health bars
    this.updateSelectionVisuals(dt);

    // Update fog of war overlay
    this.fogOfWarRenderer.update(dt);

    // Remove dead entity meshes + tick building destruction animations
    this.cleanupDeadEntities(dt);

    // Update HUD
    this.updateHUD();

    // Update minimap
    this.updateMinimap();

    // Update mission system (campaign mode)
    if (this.missionSystem?.isActive) {
      this.missionSystem.update(dt);
      this._updateObjHUD();
    }
    this._updateMsg(dt);

    // Check win/lose conditions (skirmish only, missions handle their own)
    if (!this.missionSystem?.isActive) {
      this.checkGameOver();
    }
  }

  private refreshTagArrays(): void {
    // Rebuild tag arrays for AI system
    // This is needed because the AI reads isUnit/isBuilding/isResource as arrays
    const allIds = this.getAllLivingEntityIds();
    const isUnitArr = new Uint8Array(1024);
    const isBuildingArr = new Uint8Array(1024);
    const isResourceArr = new Uint8Array(1024);

    for (const eid of allIds) {
      if (hasComponent(world, eid, IsUnit)) isUnitArr[eid] = 1;
      if (hasComponent(world, eid, IsBuilding)) isBuildingArr[eid] = 1;
      if (hasComponent(world, eid, IsResource)) isResourceArr[eid] = 1;
    }

    // Re-configure AI with fresh tag arrays
    const ecsComponents = {
      positionX: Position.x,
      positionY: Position.y,
      positionZ: Position.z,
      movementTargetX: Movement.targetX,
      movementTargetZ: Movement.targetZ,
      movementHasTarget: Movement.hasTarget,
      movementSpeed: Movement.speed,
      factionId: Faction.id,
      unitTypeId: UnitType.id,
      buildingTypeId: Building.typeId,
      healthCurrent: Health.current,
      healthMax: Health.max,
      unitAIState: UnitAI.state,
      unitAITargetEid: UnitAI.targetEid,
      gathererState: Gatherer.state,
      gathererTargetEid: Gatherer.targetEid,
      resourceAmount: Resource.amount,
      productionUnitType: Production.unitType,
      productionProgress: Production.progress,
      productionTime: Production.duration,
      isUnit: isUnitArr,
      isBuilding: isBuildingArr,
      isResource: isResourceArr,
    };

    const callbacks = {
      spawnBuilding: (type: BuildingTypeId, factionId: FactionId, x: number, z: number) => {
        return this.spawnBuildingAtRuntime(type, factionId, x, z);
      },
      startTraining: (buildingEid: number, unitType: UnitTypeId) => {
        return this.startTrainingUnit(buildingEid, unitType);
      },
      deductGold: (amount: number, factionId?: number) => {
        return this.playerState.spend(factionId ?? AISystem.factionId, amount);
      },
      getGold: (factionId?: number) => {
        return this.playerState.getGold(factionId ?? AISystem.factionId);
      },
      getAllEntityIds: () => {
        return this.getAllLivingEntityIds();
      },
    };

    AISystem.configure(ecsComponents, callbacks);
  }

  private detectAndRenderNewEntities(): void {
    // Check for units spawned by ProductionSystem that don't have meshes
    const allUnits = query(world, [Position, IsUnit]);
    for (const eid of allUnits) {
      if (this.entityMeshMap.has(eid)) continue;
      if (hasComponent(world, eid, IsDead)) continue;

      // New unit without a mesh -- create one
      const factionIdx = Faction.id[eid];
      const unitType = UnitType.id[eid];
      const isHeroUnit = hasComponent(world, eid, IsHero);
      let typeName: string = unitTypeName(unitType);
      if (isHeroUnit) {
        const heroTypeId = Hero.heroTypeId[eid] as HeroTypeId;
        const factionHeroes = getHeroTypesForFaction(factionIdx as FactionId);
        const heroIdx = factionHeroes.indexOf(heroTypeId);
        typeName = heroIdx > 0 ? `hero${heroIdx}` : 'hero0';
      }
      const mesh = this.unitRenderer.addUnit(eid, typeName as any, factionIdx);
      if (mesh) {
        mesh.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
        if (isHeroUnit) {
          mesh.scale.setScalar(1.8);
        }
        mesh.userData.eid = eid;
        this.entityMeshMap.set(eid, mesh);
      }
      this.knownUnitEntities.add(eid);

      // Apply completed tech tree upgrades to this newly spawned unit
      techTreeSystem.applyAllUpgradesToNewUnit(eid, Faction.id[eid]);
    }
  }

  /**
   * Detect HP decreases since last frame and trigger damage flash.
   */
  private detectDamageFlash(): void {
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid)) continue;
      if (hasComponent(world, eid, IsDead)) continue;

      const currentHp = Health.current[eid];
      const lastHp = this.lastHpMap.get(eid);

      if (lastHp !== undefined && currentHp < lastHp) {
        this.unitRenderer.triggerDamageFlash(eid);
      }

      this.lastHpMap.set(eid, currentHp);
    }

    // Also check buildings
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      const currentHp = Health.current[eid];
      const lastHp = this.lastHpMap.get(eid);
      this.lastHpMap.set(eid, currentHp);
      // Building damage is handled via tint in BuildingRenderer, no flash needed
    }
  }

  private syncRenderPositions(dt: number): void {
    // Build unit position data for UnitRenderer (includes idle bob, damage flash)
    const unitPositions: Array<{
      eid: number; x: number; y: number; z: number; ry: number;
      selected: boolean; isIdle?: boolean; aiState?: number;
      unitTypeId?: number;
      targetX?: number; targetZ?: number;
      isBuffed?: boolean; isStunned?: boolean; isInvincible?: boolean;
    }> = [];

    for (const [eid, mesh] of this.entityMeshMap) {
      if (Position.x[eid] !== undefined) {
        if (hasComponent(world, eid, IsUnit)) {
          const isIdle = UnitAI.state[eid] === UnitAIState.Idle;
          const hasTarget = Movement.hasTarget[eid] === 1;
          unitPositions.push({
            eid,
            x: Position.x[eid],
            y: Position.y[eid],
            z: Position.z[eid],
            ry: Rotation.y[eid] || 0,
            selected: Selected.by[eid] === 0,
            isIdle,
            aiState: UnitAI.state[eid],
            unitTypeId: UnitType.id[eid],
            targetX: hasTarget ? Movement.targetX[eid] : undefined,
            targetZ: hasTarget ? Movement.targetZ[eid] : undefined,
            isBuffed: hasComponent(world, eid, StatBuff) && StatBuff.duration[eid] > 0,
            isStunned: hasComponent(world, eid, Stunned) && Stunned.duration[eid] > 0,
            isInvincible: hasComponent(world, eid, Invincible) && Invincible.duration[eid] > 0,
          });
        } else if (!hasComponent(world, eid, IsBuilding)) {
          // Resources: position sync with Y offset to prevent terrain clipping
          // Buildings are handled by syncBuildingProgress -> BuildingRenderer.update
          mesh.position.set(Position.x[eid], Position.y[eid] + 0.3, Position.z[eid]);
        }
      }
    }

    // Delegate to UnitRenderer for idle bob, damage flash, blob shadows
    this.unitRenderer.update(dt, unitPositions);
  }

  private syncBuildingProgress(dt: number): void {
    const buildingData: Array<{
      eid: number; x: number; y: number; z: number;
      progress: number; isProducing?: boolean; hpRatio?: number;
    }> = [];

    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      if (!hasComponent(world, eid, IsBuilding)) continue;

      const complete = Building.complete[eid];
      const progress = complete === 1 ? 1.0 : Math.min(Building.progress[eid] / Math.max(Building.maxProgress[eid], 1), 1.0);
      this.buildingRenderer.updateBuildProgress(eid, progress);

      // Check if producing
      const isProducing = hasComponent(world, eid, Production) &&
        Production.unitType[eid] !== NO_PRODUCTION &&
        Building.complete[eid] === 1;

      // HP ratio for damage tint
      const maxHp = Health.max[eid];
      const hpRatio = maxHp > 0 ? Health.current[eid] / maxHp : 1;

      buildingData.push({
        eid,
        x: Position.x[eid],
        y: Position.y[eid],
        z: Position.z[eid],
        progress,
        isProducing,
        hpRatio,
      });
    }

    this.buildingRenderer.update(dt, buildingData);
  }

  private updateSelectionVisuals(dt: number): void {
    const selectionData: SelectionData[] = [];

    for (const eid of this.selectedEntities) {
      if (!entityExists(world, eid)) continue;
      let name: string | undefined;
      if (hasComponent(world, eid, IsBuilding)) {
        name = this.getBuildingName(Building.typeId[eid]);
      } else if (hasComponent(world, eid, IsUnit)) {
        name = this.getUnitName(eid);
      }
      selectionData.push({
        eid,
        x: Position.x[eid],
        y: Position.y[eid],
        z: Position.z[eid],
        selected: true,
        isOwnFaction: Faction.id[eid] === this.playerFactionId,
        hp: Health.current[eid],
        maxHp: Health.max[eid],
        name,
      });
    }

    this.selectionRenderer.update(dt, selectionData);
  }

  private cleanupDeadEntities(dt: number): void {
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid) || hasComponent(world, eid, IsDead)) {
        if (this.entityMeshMap.has(eid)) {
          this.unitRenderer.removeUnit(eid);
          this.entityMeshMap.delete(eid);
        }
        if (!entityExists(world, eid)) {
          this.knownUnitEntities.delete(eid);
        }
      }
    }
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) {
        // Entity removed from ECS — if destruction animation is running, let it finish
        if (this.buildingRenderer.isDestroying(eid)) continue;
        if (this.entityMeshMap.has(eid)) {
          this.buildingRenderer.removeBuilding(eid);
          this.entityMeshMap.delete(eid);
        }
        // Remove rally point flag if building is destroyed
        this.buildingRenderer.removeRallyPoint(eid);
        this.knownBuildingEntities.delete(eid);
      } else if (hasComponent(world, eid, IsDead) && !this.buildingRenderer.isDestroying(eid)) {
        // Building just died — start destruction animation + effects
        this.buildingRenderer.startDestruction(eid);
        const obj = this.buildingRenderer.getObject(eid);
        if (obj) {
          const factionColor = FACTION_DEATH_COLORS[Faction.id[eid]] ?? 0x4a4a5a;
          this.particles.spawnBuildingDestruction(obj.position.x, obj.position.y, obj.position.z, factionColor);
          this.camera.shake(0.8, 0.5);
          audioManager.playSound('building_destroy', { x: obj.position.x, z: obj.position.z });
        }
      }
    }

    // Tick building destruction animations — remove meshes when finished
    const finishedDestructions = this.buildingRenderer.updateDestructions(dt);
    for (const eid of finishedDestructions) {
      if (this.entityMeshMap.has(eid)) {
        this.buildingRenderer.removeBuilding(eid);
        this.entityMeshMap.delete(eid);
      }
      this.buildingRenderer.removeRallyPoint(eid);
      this.knownBuildingEntities.delete(eid);
    }
  }

  private updateHUD(): void {
    if (!this.hud) return;

    this.hud.updateResources(
      this.playerState.getGold(this.playerFactionId),
      this.playerState.getWood(this.playerFactionId),
      this.playerState.getPopulation(this.playerFactionId),
      this.playerState.getPopulationMax(this.playerFactionId),
      getUpkeepPerTick(this.playerFactionId),
      this.playerState.isInUpkeepDebt(this.playerFactionId),
    );

    // Population cap reached alert (one-time)
    this.checkPopulationCapAlert();

    // Update tertiary resource for non-Brabanders factions
    if (this.playerFactionId !== FactionId.Brabanders) {
      const tertiaryEl = document.getElementById('tertiary-resource');
      const tertiaryVal = document.getElementById('res-tertiary');
      const tertiaryIcon = document.getElementById('res-tertiary-icon');
      if (tertiaryEl && tertiaryVal) {
        tertiaryEl.style.display = 'flex';
        tertiaryVal.textContent = String(Math.floor(this.playerState.getTertiary(this.playerFactionId)));
        if (tertiaryIcon && !tertiaryIcon.dataset.iconSet) {
          // Set faction-specific SVG icon for tertiary resource
          tertiaryIcon.className = 'resource-icon';
          if (this.playerFactionId === FactionId.Randstad) {
            // Havermoutmelk - milk carton
            tertiaryIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M8 4h8l2 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9l2-5z" fill="#F5F0E0"/><path d="M8 4h8l2 5H6l2-5z" fill="#E8DCC8"/><rect x="6" y="9" width="12" height="12" rx="0.5" fill="#FAF5E8"/><rect x="9" y="11" width="6" height="4" rx="0.5" fill="#8BC34A" opacity="0.7"/><line x1="6" y1="9" x2="18" y2="9" stroke="#D4C8A8" stroke-width="0.5"/></svg>';
          } else if (this.playerFactionId === FactionId.Limburgers) {
            // Kolen - coal chunk
            tertiaryIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 14l2-6 4-2 5 1 3 5-1 5-4 3-5 0-4-3z" fill="#2C2C2C"/><path d="M8 8l4-2 5 1 1 3-3-1-4 1-3-2z" fill="#404040"/><path d="M6 14l2-2 3 1 2-1 3 1 2-1 1 3-3 2-4 1-4-1z" fill="#1A1A1A"/><path d="M10 9l1.5-0.5 2 0.5" stroke="#555" stroke-width="0.4" opacity="0.6"/><ellipse cx="9" cy="10" rx="1.5" ry="1" fill="#4A4A4A" opacity="0.5"/></svg>';
          } else if (this.playerFactionId === FactionId.Belgen) {
            // Chocolade - chocolate bar
            tertiaryIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><rect x="4" y="7" width="16" height="10" rx="1.5" fill="#5C3317"/><rect x="5" y="8" width="14" height="8" rx="1" fill="#7B4B2A"/><line x1="9.5" y1="8" x2="9.5" y2="16" stroke="#5C3317" stroke-width="0.8"/><line x1="14.5" y1="8" x2="14.5" y2="16" stroke="#5C3317" stroke-width="0.8"/><line x1="5" y1="12" x2="19" y2="12" stroke="#5C3317" stroke-width="0.8"/><rect x="5.5" y="8.5" width="3.5" height="3" rx="0.3" fill="#8B6340" opacity="0.4"/><rect x="14.8" y="12.5" width="3.5" height="3" rx="0.3" fill="#8B6340" opacity="0.4"/></svg>';
          }
          tertiaryIcon.dataset.iconSet = '1';
        }
      }
    }

    // Update Gezelligheid meter (Brabanders only) or hide it
    if (this.playerFactionId === FactionId.Brabanders) {
      const rageState = getCarnavalsrageState();
      const rageConfig = getCarnavalsrageConfig();
      this.hud.updateGezelligheid(
        this.playerState.getGezelligheid(this.playerFactionId),
        rageConfig.cost,
        rageState.active,
        rageState.remainingDuration,
        rageState.cooldownRemaining,
      );
    } else {
      const gezEl = document.querySelector('.gezelligheid-item') as HTMLElement | null;
      if (gezEl) gezEl.style.display = 'none';
    }

    // Update selected unit/building info
    if (this.selectedEntities.length > 0) {
      const firstEid = this.selectedEntities[0];
      if (entityExists(world, firstEid)) {
        if (hasComponent(world, firstEid, IsBuilding)) {
          // Update building card HP and status in real-time
          if (this.hud.isBuildingCardVisible()) {
            this.hud.updateBuildingCardHp(Health.current[firstEid], Health.max[firstEid]);

            // Update status text
            let status = 'Idle';
            if (Building.complete[firstEid] !== 1) {
              status = 'Under construction';
            } else if (hasComponent(world, firstEid, Production) && Production.unitType[firstEid] !== NO_PRODUCTION) {
              const progress = Production.progress[firstEid];
              const duration = Production.duration[firstEid];
              const remaining = Math.max(0, duration * (1 - progress));
              const fid = Faction.id[firstEid];
              const unitName = this.getUnitNameByType(Production.unitType[firstEid], fid);
              const queueSlots = [Production.queue0, Production.queue1, Production.queue2, Production.queue3, Production.queue4];
              const queueCount = queueSlots.filter(s => s[firstEid] !== NO_PRODUCTION).length;
              const timeStr = remaining > 0 ? ` (${Math.ceil(remaining)}s)` : '';
              status = queueCount > 0
                ? `Training ${unitName}${timeStr} +${queueCount}`
                : `Training ${unitName}${timeStr}`;
            }
            this.hud.updateBuildingCardStatus(status);

            // Update production queue display with cancel buttons
            const queueItems = this.getBuildingQueue(firstEid);
            this.hud.updateProductionQueueDisplay(queueItems);
          }

          // Update legacy production queue (backward compat)
          if (hasComponent(world, firstEid, Production) && Production.unitType[firstEid] !== NO_PRODUCTION) {
            const progress = Production.progress[firstEid];
            const duration = Production.duration[firstEid];
            const remaining = Math.max(0, duration * (1 - progress));
            const fid = Faction.id[firstEid];
            const unitName = this.getUnitNameByType(Production.unitType[firstEid], fid);
            // Count queued items
            const queueSlots = [Production.queue0, Production.queue1, Production.queue2, Production.queue3, Production.queue4];
            const queueCount = queueSlots.filter(s => s[firstEid] !== NO_PRODUCTION).length;
            const label = queueCount > 0 ? `${unitName} (+${queueCount})` : unitName;
            this.hud.updateProductionQueue(progress, label, remaining);
          } else if (hasComponent(world, firstEid, Production)) {
            this.hud.updateProductionQueue(0, '', 0);
          }
          // Update Blacksmith / LumberCamp / UpgradeBuilding research progress (refreshes every frame)
          if (Building.complete[firstEid] === 1 && Faction.id[firstEid] === this.playerFactionId) {
            const tid = Building.typeId[firstEid];
            if (tid === BuildingTypeId.Blacksmith) {
              this.showBlacksmithResearchUI(firstEid);
            } else if (tid === BuildingTypeId.LumberCamp) {
              this.showLumberCampResearchUI(firstEid);
            } else if (tid === BuildingTypeId.UpgradeBuilding) {
              this.showUpgradeBuildingResearchUI(firstEid);
            }
          }
        }
      }
    }

    // Update hero ability bar (every frame when a hero is selected)
    this.updateHeroAbilityBar();
  }

  /**
   * Update the hero ability bar with current cooldowns and costs.
   * Called every frame from updateHUD().
   */
  private updateHeroAbilityBar(): void {
    if (!this.hud) return;

    // Find selected hero
    const heroEid = this.selectedEntities.find(eid =>
      entityExists(world, eid) &&
      hasComponent(world, eid, IsHero) &&
      !hasComponent(world, eid, IsDead) &&
      Faction.id[eid] === this.playerFactionId
    );

    if (heroEid === undefined) return;

    const htId = Hero.heroTypeId[heroEid] as HeroTypeId;
    const heroArch = HERO_ARCHETYPES[htId];
    if (!heroArch) return;

    const currentGez = this.playerState.getGezelligheid(this.playerFactionId);
    const abilities: HeroAbilityData[] = [];

    for (let i = 0; i < 3; i++) {
      const abilityDef = heroArch.abilities[i];
      if (!abilityDef) continue;

      const cd = i === 0 ? HeroAbilities.ability0Cooldown[heroEid]
        : i === 1 ? HeroAbilities.ability1Cooldown[heroEid]
          : HeroAbilities.ability2Cooldown[heroEid];

      abilities.push({
        name: abilityDef.name,
        hotkey: String(i + 1),
        description: abilityDef.description,
        cooldown: cd,
        cooldownMax: abilityDef.cooldown,
        gezelligheidCost: abilityDef.gezelligheidCost ?? 0,
        currentGezelligheid: currentGez,
      });
    }

    this.hud.updateHeroAbilities(abilities);
  }

  private checkPopulationCapAlert(): void {
    if (!this.hud) return;
    const pop = this.playerState.getPopulation(this.playerFactionId);
    const maxPop = this.playerState.getPopulationMax(this.playerFactionId);
    if (pop >= maxPop && !this.popCapAlertShown) {
      this.popCapAlertShown = true;
      this.hud.showPopulationCapAlert();
    }
    // Reset when population drops below cap (so it fires again if cap is hit again)
    if (pop < maxPop) {
      this.popCapAlertShown = false;
    }
  }

  private minimapTerrainCache: ImageData | null = null;

  /**
   * Render terrain colors onto a cached ImageData (only done once).
   */
  private buildMinimapTerrainCache(w: number, h: number): ImageData {
    const img = new ImageData(w, h);
    const currentMapSize = this.map?.size ?? MAP_SIZE;
    const halfMap = currentMapSize / 2;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const wx = (px / w) * currentMapSize - halfMap;
        const wz = (py / h) * currentMapSize - halfMap;
        const height = this.terrain.getHeightAt(wx, wz);

        let r: number, g: number, b: number;
        if (height <= 0.05) {
          // Water
          r = 42; g = 100; b = 150;
        } else if (height < 1.0) {
          // Low grass
          r = 74; g = 140; b = 63;
        } else if (height < 2.0) {
          // Darker grass / path
          const t = (height - 1.0) / 1.0;
          r = Math.round(74 + t * 65);
          g = Math.round(140 - t * 25);
          b = Math.round(63 + t * 22);
        } else {
          // Hills / high ground
          r = 106; g = 154; b = 80;
        }

        const idx = (py * w + px) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }

    return img;
  }

  private updateMinimap(): void {
    if (!this.hud) return;
    const canvas = this.hud.getMinimapCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const currentMapSize = this.map?.size ?? MAP_SIZE;
    const halfMap = currentMapSize / 2;

    // Build terrain cache once
    if (!this.minimapTerrainCache || this.minimapTerrainCache.width !== w) {
      this.minimapTerrainCache = this.buildMinimapTerrainCache(w, h);
    }

    // Draw cached terrain
    ctx.putImageData(this.minimapTerrainCache, 0, 0);

    // Apply fog of war overlay
    const visibleBuf = visionData.visibleBuffer;
    const exploredBuf = visionData.exploredBuffer;
    const fowImg = ctx.getImageData(0, 0, w, h);
    const fowData = fowImg.data;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Map minimap pixel to vision buffer
        const bx = Math.floor((px / w) * 128);
        const bz = Math.floor((py / h) * 128);
        const bufIdx = bz * 128 + bx;
        const pixIdx = (py * w + px) * 4;

        if (visibleBuf[bufIdx] > 0) {
          // Fully visible: keep terrain colors as-is
        } else if (exploredBuf[bufIdx] > 0) {
          // Explored but not visible: darken
          fowData[pixIdx] = Math.round(fowData[pixIdx] * 0.4);
          fowData[pixIdx + 1] = Math.round(fowData[pixIdx + 1] * 0.4);
          fowData[pixIdx + 2] = Math.round(fowData[pixIdx + 2] * 0.4);
        } else {
          // Unexplored: black
          fowData[pixIdx] = 0;
          fowData[pixIdx + 1] = 0;
          fowData[pixIdx + 2] = 0;
        }
      }
    }
    ctx.putImageData(fowImg, 0, 0);

    // Helper to convert world -> minimap coords
    const toMiniX = (wx: number) => ((wx + halfMap) / currentMapSize) * w;
    const toMiniY = (wz: number) => ((wz + halfMap) / currentMapSize) * h;

    // Draw resources (gold = yellow, wood = green, fog-filtered)
    for (const [eid] of this.entityMeshMap) {
      if (hasComponent(world, eid, IsResource)) {
        const wx = Position.x[eid];
        const wz = Position.z[eid];
        if (!this.fogOfWarRenderer.isExplored(wx, wz)) continue;
        if (Resource.amount[eid] <= 0) continue;
        const visible = this.fogOfWarRenderer.isVisible(wx, wz);
        ctx.globalAlpha = visible ? 1.0 : 0.4;
        const mx = toMiniX(wx);
        const my = toMiniY(wz);
        ctx.fillStyle = Resource.type[eid] === ResourceType.Wood ? '#228B22' : '#FFD700';
        ctx.fillRect(mx - 2, my - 2, 5, 5);
      }
    }
    ctx.globalAlpha = 1.0;

    // Draw buildings (larger dots, fog-filtered)
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      const wx = Position.x[eid];
      const wz = Position.z[eid];
      const isOwn = Faction.id[eid] === this.playerFactionId;
      if (!isOwn && !this.fogOfWarRenderer.isExplored(wx, wz)) continue;
      const visible = isOwn || this.fogOfWarRenderer.isVisible(wx, wz);
      ctx.globalAlpha = visible ? 1.0 : 0.4;
      const mx = toMiniX(wx);
      const my = toMiniY(wz);
      ctx.fillStyle = MINIMAP_COLORS[Faction.id[eid]] ?? '#888888';
      ctx.fillRect(mx - 3, my - 3, 7, 7);
    }
    ctx.globalAlpha = 1.0;

    // Draw units (only if visible or own faction)
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid)) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      const wx = Position.x[eid];
      const wz = Position.z[eid];
      const isOwn = Faction.id[eid] === this.playerFactionId;
      if (!isOwn && !this.fogOfWarRenderer.isVisible(wx, wz)) continue;
      const mx = toMiniX(wx);
      const my = toMiniY(wz);
      ctx.fillStyle = MINIMAP_COLORS[Faction.id[eid]] ?? '#888888';
      ctx.fillRect(mx - 1, my - 1, 3, 3);
    }

    // Draw camera frustum indicator (white rectangle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    const camPos = this.camera.camera.position;
    const cx = toMiniX(camPos.x);
    const cy = toMiniY(camPos.z);
    ctx.strokeRect(cx - 12, cy - 8, 24, 16);
  }

  private checkGameOver(): void {
    // Don't check win/lose in the first 5 seconds (entities still spawning)
    if (world.meta.elapsed < 5) return;
    if (this.gameOver) return;

    let playerTownHallAlive = false;
    let aiTownHallAlive = false;

    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      if (Health.current[eid] <= 0) continue;
      if (Building.typeId[eid] === BuildingTypeId.TownHall) {
        if (Faction.id[eid] === this.playerFactionId) {
          playerTownHallAlive = true;
        } else {
          aiTownHallAlive = true;
        }
      }
    }

    // Only trigger if we've found at least one town hall ever (game is properly initialized)
    if (this.knownBuildingEntities.size < 2) return;

    if (!playerTownHallAlive) {
      this.triggerGameOver(false);
    } else if (!aiTownHallAlive) {
      this.triggerGameOver(true);
    }
  }

  private triggerGameOver(victory: boolean): void {
    this.gameOver = true;
    // Play victory or defeat stinger
    if (victory) {
      this.musicSystem.playVictory();
    } else {
      this.musicSystem.playDefeat();
    }
    if (this.hud) {
      this.hud.showGameOver(victory, {
        durationSeconds: world.meta.elapsed,
        unitsProduced: this.stats.unitsProduced,
        unitsLost: this.stats.unitsLost,
        enemiesKilled: this.stats.enemiesKilled,
        buildingsBuilt: this.stats.buildingsBuilt,
        buildingsDestroyed: 0,
        resourcesGathered:
          this.playerState.getGoldGathered(this.playerFactionId) +
          this.playerState.getWoodGathered(this.playerFactionId),
      });
    }
  }

  // --- Entity creation helpers ---

  private createUnitEntity(type: UnitTypeId, faction: FactionId, x: number, z: number): number {
    const eid = addEntity(world);
    let arch: UnitArchetype;
    try {
      arch = getFactionUnitArchetype(faction, type);
    } catch {
      switch (faction) {
        case FactionId.Randstad: arch = RANDSTAD_UNIT_ARCHETYPES[type]; break;
        case FactionId.Limburgers: arch = LIMBURGERS_UNIT_ARCHETYPES[type]; break;
        case FactionId.Belgen: arch = BELGEN_UNIT_ARCHETYPES[type]; break;
        default: arch = UNIT_ARCHETYPES[type]; break;
      }
    }
    const y = this.terrain.getHeightAt(x, z);

    addComponent(world, eid, Position); Position.x[eid] = x; Position.y[eid] = y; Position.z[eid] = z;
    addComponent(world, eid, Health); Health.current[eid] = arch.hp; Health.max[eid] = arch.hp;
    addComponent(world, eid, Attack); Attack.damage[eid] = arch.attack; Attack.speed[eid] = arch.attackSpeed; Attack.range[eid] = arch.range; Attack.timer[eid] = 0;
    addComponent(world, eid, Armor); Armor.value[eid] = arch.armor;
    addComponent(world, eid, Movement); Movement.speed[eid] = arch.speed; Movement.hasTarget[eid] = 0;
    addComponent(world, eid, Faction); Faction.id[eid] = faction;
    addComponent(world, eid, UnitType); UnitType.id[eid] = type;
    addComponent(world, eid, UnitAI); UnitAI.state[eid] = UnitAIState.Idle;
    addComponent(world, eid, Visibility); Visibility.range[eid] = arch.sightRange || 10;
    addComponent(world, eid, Rotation);
    addComponent(world, eid, Selected); Selected.by[eid] = 255; // Not selected
    addComponent(world, eid, IsUnit);

    // Gezelligheid bonus component (all units get it; only Brabanders will have non-1.0 values)
    addComponent(world, eid, GezeligheidBonus);
    GezeligheidBonus.nearbyCount[eid] = 0;
    GezeligheidBonus.attackMult[eid] = 1.0;
    GezeligheidBonus.speedMult[eid] = 1.0;
    GezeligheidBonus.armorMult[eid] = 1.0;
    GezeligheidBonus.passiveHeal[eid] = 0;
    GezeligheidBonus.damageReduction[eid] = 0;

    if (type === UnitTypeId.Worker) {
      addComponent(world, eid, IsWorker);
      addComponent(world, eid, Gatherer);
      Gatherer.carryCapacity[eid] = 10;
      Gatherer.previousTarget[eid] = NO_ENTITY;
    }

    this.playerState.addPopulation(faction, 1);

    // Track military units for upkeep
    if (type !== UnitTypeId.Worker) {
      this.playerState.addMilitaryUnit(faction);
    }

    return eid;
  }

  private createBuildingEntity(type: BuildingTypeId, faction: FactionId, x: number, z: number): number {
    // All ECS components (Position, Health, Faction, Building, Visibility,
    // Selected, IsBuilding, Production+RallyPoint for producers) come from
    // the shared helper so every spawn path stays in sync with the contract.
    const eid = spawnBuildingEntity(world, type, faction, x, z, {
      getHeightAt: (px, pz) => this.terrain.getHeightAt(px, pz),
    });

    // Game-level bookkeeping that's not part of the pure ECS spawn.
    const arch = type < BUILDING_ARCHETYPES.length
      ? BUILDING_ARCHETYPES[type]
      : { populationProvided: 5 };
    this.playerState.addPopulationCapacity(faction, arch.populationProvided ?? 5);
    return eid;
  }

  // -------------------------------------------------------------------------
  // Public query methods (for Tutorial + Main integration)
  // -------------------------------------------------------------------------

  /** Get current player gold amount. */
  getPlayerGold(): number {
    return this.playerState.getGold(this.playerFactionId);
  }

  /** Get elapsed game time in seconds. */
  getElapsedTime(): number {
    return this._elapsedTime;
  }

  /** Get game stats for feedback reporting. */
  getStats(): Readonly<typeof this.stats> {
    return this.stats;
  }

  /** Whether the player currently has a worker selected. */
  hasWorkerSelected(): boolean {
    return this.selectedEntities.some(eid =>
      entityExists(world, eid) && hasComponent(world, eid, IsWorker) && Faction.id[eid] === this.playerFactionId
    );
  }

  /** Whether any player worker has started gathering. */
  hasGatheringStarted(): boolean {
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (!hasComponent(world, eid, IsWorker)) continue;
      const state = UnitAI.state[eid];
      if (state === UnitAIState.MovingToResource || state === UnitAIState.Gathering || state === UnitAIState.Returning) {
        return true;
      }
    }
    return false;
  }

  /** Whether the player has built at least one barracks. */
  hasBarracksBuilt(): boolean {
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (Building.typeId[eid] === BuildingTypeId.Barracks && Building.complete[eid] === 1) {
        return true;
      }
    }
    return false;
  }

  /** Whether the player has trained at least one military unit from barracks. */
  hasUnitTrained(): boolean {
    // Check if player has any infantry or ranged units
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      const unitType = UnitType.id[eid];
      if (unitType === UnitTypeId.Infantry || unitType === UnitTypeId.Ranged) {
        return true;
      }
    }
    return false;
  }

  /** Whether the player has issued an attack command against the AI. */
  hasAttackIssued(): boolean {
    // Check if any player unit is currently attacking an AI entity
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (UnitAI.state[eid] === UnitAIState.Attacking) {
        return true;
      }
    }
    return false;
  }

  /** Whether the player has 2+ units selected (box-select detection). */
  hasMultipleUnitsSelected(): boolean {
    let count = 0;
    for (const eid of this.selectedEntities) {
      if (entityExists(world, eid) && hasComponent(world, eid, IsUnit) && Faction.id[eid] === this.playerFactionId) {
        count++;
        if (count >= 2) return true;
      }
    }
    return false;
  }

  /** Whether a barracks has been placed (may still be under construction). */
  hasBarracksPlaced(): boolean {
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (Building.typeId[eid] === BuildingTypeId.Barracks) return true;
    }
    return false;
  }

  /** Whether any player barracks has a unit in production. */
  hasUnitTrainingStarted(): boolean {
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (Building.typeId[eid] !== BuildingTypeId.Barracks) continue;
      if (Building.complete[eid] !== 1) continue;
      if (Production.unitType[eid] !== NO_PRODUCTION) return true;
    }
    return false;
  }

  /** Count living AI units on the map. */
  getAIUnitCount(): number {
    let count = 0;
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid)) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      if (Faction.id[eid] !== this.playerFactionId) count++;
    }
    return count;
  }

  /** Spawn enemy units for tutorial combat steps. */
  spawnTutorialEnemies(count: number): void {
    const base = this.getPlayerBasePosition();
    const spawnDist = 30;
    const angle = Math.PI * 0.25; // spawn from northeast
    const spawnX = base.x + Math.cos(angle) * spawnDist;
    const spawnZ = base.z + Math.sin(angle) * spawnDist;

    const units: import('../campaign/MissionDefinitions').MissionUnitSpawn[] = [];
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 3;
      units.push({
        factionId: FactionId.Randstad,
        unitType: UnitTypeId.Infantry,
        x: spawnX + Math.cos(angle + Math.PI / 2) * offset,
        z: spawnZ + Math.sin(angle + Math.PI / 2) * offset,
      });
    }
    this._spawnMissionUnits(units);
  }

  /** Get position of the player's Town Hall (base). */
  getPlayerBasePosition(): { x: number; z: number } {
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== this.playerFactionId) continue;
      if (Building.typeId[eid] === BuildingTypeId.TownHall) {
        return { x: Position.x[eid], z: Position.z[eid] };
      }
    }
    // Fallback to map spawn
    const playerSpawn = this.map.spawns.find(s => s.factionId === this.playerFactionId);
    return playerSpawn ? { x: playerSpawn.x, z: playerSpawn.z } : { x: 0, z: 0 };
  }

  private remapFactions(): void {
    this.map = remapMapPlayerFaction(this.map, this.playerFactionId);
  }

  private getAIFactionId(): FactionId {
    const aiSpawn = this.map.spawns.find(s => s.factionId !== this.playerFactionId);
    return aiSpawn ? aiSpawn.factionId as FactionId : FactionId.Randstad;
  }

  /**
   * Clean up all event listeners, HUD, and state between games/missions.
   * Must be called before re-initializing to prevent listener accumulation.
   */
  private cleanup(): void {
    // Remove all canvas/window event listeners
    for (const { el, event, handler } of this.boundCanvasListeners) {
      el.removeEventListener(event, handler);
    }
    this.boundCanvasListeners.length = 0;
    this.inputSetup = false;
    this.eventListenersSetup = false;

    // Clear all EventBus listeners (they'll be re-registered in setup)
    eventBus.clear();

    // Destroy HUD (removes its DOM listeners)
    if (this.hud) {
      this.hud.destroy();
      this.hud = null;
    }

    // Remove all entity meshes from renderers
    for (const eid of this.knownUnitEntities) {
      this.unitRenderer.removeUnit(eid);
    }
    for (const eid of this.knownBuildingEntities) {
      this.buildingRenderer.removeBuilding(eid);
    }
    this.entityMeshMap.clear();
    this.knownUnitEntities.clear();
    this.knownBuildingEntities.clear();

    // Reset ECS world (removes all entities and components)
    resetGameWorld();

    // Reset player state (gold, population, resources)
    this.playerState.reset();

    // Reset tech tree research state
    techTreeSystem.reset();

    // Reset upkeep timers
    resetUpkeepTimers();

    // Reset faction-specific systems
    resetAbilitySystem();
    resetHeroSystem();
    resetBureaucracy();
    resetHavermoutmelkBuffs();
    resetWorstenbroodjeskraamBuffs();
    resetUpgradeBuildingPassives();
    resetCarnavalsoptocht();
    resetDiplomacy();

    // Stop music system
    this.musicSystem.stop(500);

    // Reset game state
    this.selectedEntities = [];
    this.lastHpMap.clear();
    this.gameOver = false;
    this.buildMode = false;
    this.buildGhostType = null;
    this.attackMoveMode = false;
    this.controlGroups.clear();
    this.stats = { unitsProduced: 0, unitsLost: 0, enemiesKilled: 0, buildingsBuilt: 0, resourcesGathered: 0 };
    this.missionSystem = null;
    AISystem.reset();
    this.activeMission = null;
    this.missionMessageTimer = 0;
    this.militaryTrainedCount = 0;

    // Remove mission UI elements
    const msgEl = document.getElementById('mission-message');
    if (msgEl) msgEl.remove();
    const objEl = document.getElementById('mission-objectives');
    if (objEl) objEl.remove();
    this._removeSurrenderBtn();
  }

  private createGoldMineEntity(x: number, z: number, amount: number): number {
    const eid = addEntity(world);
    const y = this.terrain.getHeightAt(x, z);

    addComponent(world, eid, Position); Position.x[eid] = x; Position.y[eid] = y; Position.z[eid] = z;
    addComponent(world, eid, Resource); Resource.type[eid] = ResourceType.Gold; Resource.amount[eid] = amount; Resource.maxAmount[eid] = amount;
    addComponent(world, eid, IsResource);
    return eid;
  }

  private createTreeResourceEntity(x: number, z: number, amount: number): number {
    const eid = addEntity(world);
    const y = this.terrain.getHeightAt(x, z);

    addComponent(world, eid, Position); Position.x[eid] = x; Position.y[eid] = y; Position.z[eid] = z;
    addComponent(world, eid, Resource); Resource.type[eid] = ResourceType.Wood; Resource.amount[eid] = amount; Resource.maxAmount[eid] = amount;
    addComponent(world, eid, IsResource);
    return eid;
  }
}
