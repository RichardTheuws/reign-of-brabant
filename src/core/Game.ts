/**
 * Game.ts -- Main orchestrator that wires all systems together.
 *
 * This is the integration layer: it creates the ECS world, generates the map,
 * spawns entities, initializes renderers, connects input to commands,
 * and runs the system pipeline each frame.
 */

import * as THREE from 'three';
import { addEntity, addComponent, hasComponent, query, entityExists } from 'bitecs';

import { world, resetGameWorld, type GameWorld } from '../ecs/world';
import { Position, Faction, Health, Attack, Armor, Movement, UnitType, UnitAI, Gatherer, Visibility, Building, Resource, Selected, Production, Rotation, GezeligheidBonus, Hero, HeroAbilities } from '../ecs/components';
import { IsUnit, IsBuilding, IsResource, IsWorker, IsDead, IsHero } from '../ecs/tags';
import { FactionId, UnitTypeId, BuildingTypeId, HeroTypeId, MAP_SIZE, UnitAIState, NO_PRODUCTION, HERO_POPULATION_COST } from '../types/index';
import { UNIT_ARCHETYPES, BUILDING_ARCHETYPES } from '../entities/archetypes';
import { HERO_ARCHETYPES } from '../entities/heroArchetypes';
import { createHero, isHeroActive } from '../entities/heroFactory';
import { createGamePipeline, type SystemPipeline } from '../systems/SystemPipeline';
import { generateMap, type GeneratedMap, DecoType } from '../world/MapGenerator';
import { queueCommand } from '../systems/CommandSystem';
import { NavMeshManager } from '../pathfinding/NavMeshManager';
import { AISystem } from '../ai/AISystem';
import { UnitRenderer, FACTION_ORANGE, FACTION_BLUE } from '../rendering/UnitRenderer';
import { BuildingRenderer } from '../rendering/BuildingRenderer';
import { PropRenderer } from '../rendering/PropRenderer';
import { SelectionRenderer, type SelectionData } from '../rendering/SelectionRenderer';
import { FogOfWarRenderer } from '../rendering/FogOfWarRenderer';
import { visionData } from '../systems/VisionSystem';
import { playerState } from '../core/PlayerState';
import { eventBus } from '../core/EventBus';
import { HUD, type SelectedUnit, type SelectedBuilding, type CommandAction } from '../ui/HUD';
import { activateCarnavalsrage, getCarnavalsrageState, getCarnavalsrageConfig } from '../systems/AbilitySystem';
import { activateHeroAbility } from '../systems/HeroSystem';
import { audioManager } from '../audio/AudioManager';
import { MissionSystem, type MissionCallbacks } from '../campaign/MissionSystem';
import { getMissionById, type MissionDefinition, type MissionUnitSpawn } from '../campaign/MissionDefinitions';
import type { Terrain } from '../world/Terrain';
import type { RTSCamera } from '../camera/RTSCamera';
import type { EventBus as EventBusType } from '../core/EventBus';

export class Game {
  private scene: THREE.Scene;
  private terrain: Terrain;
  private camera: RTSCamera;
  private eventBus: EventBusType;
  private pipeline: SystemPipeline;
  private map!: GeneratedMap;

  private navMesh: typeof NavMeshManager;
  private unitRenderer: UnitRenderer;
  private buildingRenderer: BuildingRenderer;
  private propRenderer: PropRenderer;
  private selectionRenderer: SelectionRenderer;
  private fogOfWarRenderer: FogOfWarRenderer;
  private selectedEntities: number[] = [];
  private playerState: typeof playerState;
  private hud: HUD | null = null;

  private entityMeshMap = new Map<number, THREE.Object3D>();
  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2();

  // Building placement mode
  private buildMode = false;
  private buildGhostType: 'barracks' | null = null;

  // Game over state
  private gameOver = false;

  // HP tracking for damage flash detection
  private lastHpMap = new Map<number, number>();

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

  constructor(scene: THREE.Scene, terrain: Terrain, camera: RTSCamera, eventBus: EventBusType) {
    this.scene = scene;
    this.terrain = terrain;
    this.camera = camera;
    this.eventBus = eventBus;

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
    this.fogOfWarRenderer = new FogOfWarRenderer();
    scene.add(this.fogOfWarRenderer.mesh);
    this.playerState = playerState;
  }

  async init(): Promise<void> {
    // 1. Generate map layout
    this.map = generateMap(42, (x, z) => this.terrain.getHeightAt(x, z));

    // 2. Load all GLB models
    await Promise.all([
      this.unitRenderer.preload(),
      this.buildingRenderer.preload(),
      this.propRenderer.preload(),
      this.selectionRenderer.preload(),
    ]);

    // 3. Init navmesh (with fallback)
    try {
      await this.navMesh.init(this.terrain.mesh);
      console.log('[Game] NavMesh initialized');
    } catch (e) {
      console.warn('[Game] NavMesh failed, using direct movement fallback:', e);
    }

    // 4. Spawn all entities from map definition
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

    // 10. Init audio system
    audioManager.init();

    // 11. Move camera to player base
    const playerSpawn = this.map.spawns.find(s => s.factionId === FactionId.Brabanders);
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
    await Promise.all([
      this.unitRenderer.preload(),
      this.buildingRenderer.preload(),
      this.propRenderer.preload(),
      this.selectionRenderer.preload(),
    ]);
    try { await this.navMesh.init(this.terrain.mesh); } catch { /* fallback */ }

    // Set starting resources
    this.playerState.addGold(0, -this.playerState.getGold(0));
    this.playerState.addGold(0, mission.startingGold);
    this.playerState.addGold(1, -this.playerState.getGold(1));
    this.playerState.addGold(1, mission.startingGoldAI);

    this._spawnMissionEntities(mission);
    this.spawnProps();
    if (mission.hasAIProduction) this.configureAI();

    // Setup input, event listeners, HUD, and mission events (cleanup cleared all flags)
    this.initHUD();
    this.setupInput();
    this.setupEventListeners();
    this._setupMissionEvents();

    const pb = mission.buildings.find(b => b.factionId === FactionId.Brabanders);
    if (pb) this.camera.setPosition(pb.x, pb.z);

    this.missionSystem = new MissionSystem();
    const wc = mission.units.filter(u => u.factionId === FactionId.Brabanders && u.unitType === UnitTypeId.Worker).length;
    const cb: MissionCallbacks = {
      showMessage: (t) => this._showMsg(t),
      spawnUnits: (u) => this._spawnMissionUnits(u),
      triggerVictory: (s, t, b) => { this.gameOver = true; this.onMissionVictory?.(s, t, b); },
      triggerDefeat: () => { this.gameOver = true; this.onMissionDefeat?.(); },
      getPlayerGold: () => this.playerState.getGold(FactionId.Brabanders),
      hasPlayerBuilding: (bt) => this._hasPlayerBldg(bt),
      getPlayerArmyCount: () => this._armyCount(),
      isEnemyBuildingDestroyed: (f, bt) => this._enemyBldgDestroyed(f, bt),
      getPlayerWorkerCount: () => this._workerCount(),
      isPlayerTownHallAlive: () => this._thAlive(),
      getPlayerTotalUnits: () => this._playerUnits(),
      getAITotalUnits: () => this._aiUnits(),
      getPlayerMilitaryTrained: () => this.militaryTrainedCount,
    };
    this.missionSystem.start(mission, cb, wc);
    this._createMsgOverlay();
    this._createObjHUD();
    console.log(`[Game] Mission "${mission.title}" initialized`);
  }
  private _spawnMissionEntities(m: MissionDefinition): void {
    for (const b of m.buildings) {
      const eid = this.createBuildingEntity(b.buildingType, b.factionId, b.x, b.z);
      Building.complete[eid] = b.complete ? 1 : 0; Building.progress[eid] = b.complete ? 1 : 0;
      const fi = b.factionId === FactionId.Brabanders ? FACTION_ORANGE : FACTION_BLUE;
      const tn = b.buildingType === BuildingTypeId.TownHall ? 'townhall' : 'barracks';
      const y = this.terrain.getHeightAt(b.x, b.z);
      const mesh = this.buildingRenderer.addBuilding(eid, tn, fi, b.x, y, b.z, b.complete ? 1.0 : 0.0);
      if (mesh) { mesh.userData.eid = eid; this.entityMeshMap.set(eid, mesh); }
      this.knownBuildingEntities.add(eid);
    }
    for (const u of m.units) {
      const eid = this.createUnitEntity(u.unitType, u.factionId, u.x, u.z);
      const fi = u.factionId === FactionId.Brabanders ? FACTION_ORANGE : FACTION_BLUE;
      const tn = u.unitType === UnitTypeId.Worker ? 'worker' : u.unitType === UnitTypeId.Infantry ? 'infantry' : 'ranged';
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
  }
  private _spawnMissionUnits(units: MissionUnitSpawn[]): number[] {
    const ids: number[] = [];
    for (const u of units) {
      const eid = this.createUnitEntity(u.unitType, u.factionId, u.x, u.z);
      const fi = u.factionId === FactionId.Brabanders ? FACTION_ORANGE : FACTION_BLUE;
      const tn = u.unitType === UnitTypeId.Worker ? 'worker' : u.unitType === UnitTypeId.Infantry ? 'infantry' : 'ranged';
      const mesh = this.unitRenderer.addUnit(eid, tn, fi);
      if (mesh) { mesh.position.set(u.x, this.terrain.getHeightAt(u.x, u.z), u.z); mesh.userData.eid = eid; this.entityMeshMap.set(eid, mesh); }
      this.knownUnitEntities.add(eid);
      if (u.factionId === FactionId.AI) {
        const base = this.getPlayerBasePosition();
        Movement.targetX[eid] = base.x + (Math.random() - 0.5) * 8; Movement.targetZ[eid] = base.z + (Math.random() - 0.5) * 8;
        Movement.hasTarget[eid] = 1; UnitAI.state[eid] = UnitAIState.Moving;
      }
      ids.push(eid);
    }
    return ids;
  }
  private _setupMissionEvents(): void {
    eventBus.on('unit-trained', (ev) => { if (ev.factionId === FactionId.Brabanders && (ev.unitTypeId === UnitTypeId.Infantry || ev.unitTypeId === UnitTypeId.Ranged)) { this.militaryTrainedCount++; this.missionSystem?.onMilitaryTrained(); } });
    eventBus.on('unit-died', (ev) => { if (ev.factionId === FactionId.Brabanders && ev.unitTypeId === UnitTypeId.Worker) this.missionSystem?.onWorkerLost(); });
    eventBus.on('building-destroyed', (ev) => { if (ev.factionId === FactionId.Brabanders && ev.buildingTypeId === BuildingTypeId.TownHall) this.missionSystem?.onTownHallLost(); });
  }
  private _hasPlayerBldg(bt: BuildingTypeId): boolean { for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid)) continue; if (Faction.id[eid] === FactionId.Brabanders && Building.typeId[eid] === bt && Building.complete[eid] === 1) return true; } return false; }
  private _armyCount(): number { let c = 0; for (const eid of this.knownUnitEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead) || Faction.id[eid] !== FactionId.Brabanders) continue; const ut = UnitType.id[eid]; if (ut === UnitTypeId.Infantry || ut === UnitTypeId.Ranged) c++; } return c; }
  private _enemyBldgDestroyed(fid: FactionId, bt: BuildingTypeId): boolean { for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue; if (Faction.id[eid] === fid && Building.typeId[eid] === bt) return false; } return this.activeMission?.buildings.some(b => b.factionId === fid && b.buildingType === bt) ?? false; }
  private _workerCount(): number { let c = 0; for (const eid of this.knownUnitEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead)) continue; if (Faction.id[eid] === FactionId.Brabanders && hasComponent(world, eid, IsWorker)) c++; } return c; }
  private _thAlive(): boolean { for (const eid of this.knownBuildingEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead) || Health.current[eid] <= 0) continue; if (Faction.id[eid] === FactionId.Brabanders && Building.typeId[eid] === BuildingTypeId.TownHall) return true; } return false; }
  private _playerUnits(): number { let c = 0; for (const eid of this.knownUnitEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead)) continue; if (Faction.id[eid] === FactionId.Brabanders) c++; } return c; }
  private _aiUnits(): number { let c = 0; for (const eid of this.knownUnitEntities) { if (!entityExists(world, eid) || hasComponent(world, eid, IsDead)) continue; if (Faction.id[eid] === FactionId.AI) c++; } return c; }
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
    el.style.cssText = 'position:absolute;top:60px;left:8px;max-width:280px;padding:12px 16px;background:rgba(20,15,10,0.85);border:1px solid rgba(212,168,83,0.25);border-radius:8px;font-size:0.8rem;z-index:10;pointer-events:none';
    ov.appendChild(el);
  }
  private _updateObjHUD(): void {
    if (!this.missionSystem?.isActive) return;
    const el = document.getElementById('objectives-hud'); if (!el) return;
    const states = this.missionSystem.getObjectiveStates();
    let h = '<div style="font-family:Cinzel,serif;font-weight:700;font-size:0.75rem;color:#d4a853;margin-bottom:8px;letter-spacing:0.05em">DOELSTELLINGEN</div>';
    for (const s of states) {
      const ic = s.completed ? '\u2705' : s.failed ? '\u274C' : '\u25CB';
      const cl = s.completed ? '#4CAF50' : s.failed ? '#F44336' : s.objective.isBonus ? '#d4a853' : '#e8e6e3';
      const lb = s.objective.isBonus ? '\u2B50 ' + s.objective.description : s.objective.description;
      let pr = ''; if (!s.completed && !s.failed && s.objective.targetValue > 1) pr = ' (' + Math.floor(s.currentValue) + '/' + s.objective.targetValue + ')';
      h += '<div style="display:flex;gap:6px;margin-bottom:4px;color:' + cl + ';opacity:' + (s.completed || s.failed ? '.7' : '1') + (s.completed ? ';text-decoration:line-through' : '') + '"><span>' + ic + '</span><span>' + lb + pr + '</span></div>';
    }
    const wp = this.missionSystem.getWaveProgress();
    if (wp.total > 0) h += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(212,168,83,.15);color:#d4a853;font-size:.75rem">Golven: ' + wp.defeated + '/' + wp.total + '</div>';
    el.innerHTML = h;
  }
  getActiveMission(): MissionDefinition | null { return this.activeMission; }
  isMissionActive(): boolean { return this.missionSystem?.isActive ?? false; }

  private spawnMapEntities(): void {
    // Spawn buildings (Town Halls)
    for (const b of this.map.buildings) {
      const eid = this.createBuildingEntity(b.buildingType, b.factionId, b.x, b.z);
      const factionIdx = b.factionId === FactionId.Brabanders ? FACTION_ORANGE : FACTION_BLUE;
      const typeName = b.buildingType === BuildingTypeId.TownHall ? 'townhall' : 'barracks';
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
      const factionIdx = u.factionId === FactionId.Brabanders ? FACTION_ORANGE : FACTION_BLUE;
      const typeName = u.unitType === UnitTypeId.Worker ? 'worker' : u.unitType === UnitTypeId.Infantry ? 'infantry' : 'ranged';
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

    // Starting resources
    this.playerState.addGold(0, 200);  // Player starts with 200 gold
    this.playerState.addGold(1, 200);  // AI starts with 200 gold
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
      });
      this.hud.updateResources(
        this.playerState.getGold(0),
        this.playerState.getPopulation(0),
        this.playerState.getPopulationMax(0)
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
      case 'build-barracks':
        this.enterBuildMode('barracks');
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
      case 'train-hero-prins':
        this.trainHero(HeroTypeId.PrinsVanBrabansen);
        break;
      case 'train-hero-boer':
        this.trainHero(HeroTypeId.BoerVanBrabansen);
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
    }
  }

  private handleMinimapClick(normalizedX: number, normalizedY: number): void {
    const halfMap = MAP_SIZE / 2;
    const worldX = (normalizedX - 0.5) * MAP_SIZE;
    const worldZ = (normalizedY - 0.5) * MAP_SIZE;
    // Move camera to clicked position
    this.camera.setPosition(worldX, worldZ);
  }

  private enterBuildMode(type: 'barracks'): void {
    // Check if we have a worker selected
    const hasWorker = this.selectedEntities.some(eid =>
      hasComponent(world, eid, IsWorker) && Faction.id[eid] === FactionId.Brabanders
    );
    if (!hasWorker) {
      this.hud?.showAlert('Selecteer een worker om te bouwen', 'warning');
      return;
    }
    // Check cost
    const cost = BUILDING_ARCHETYPES[BuildingTypeId.Barracks].costGold;
    if (!this.playerState.canAfford(FactionId.Brabanders, cost)) {
      this.hud?.showAlert('Niet genoeg goud!', 'warning');
      return;
    }
    this.buildMode = true;
    this.buildGhostType = type;
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'crosshair';
  }

  private exitBuildMode(): void {
    this.buildMode = false;
    this.buildGhostType = null;
    this.buildingRenderer.hideGhost();
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) canvas.style.cursor = 'default';
  }

  private trainFromSelectedBuilding(unitType: UnitTypeId): void {
    // Find selected building that can train this unit type
    for (const eid of this.selectedEntities) {
      if (!hasComponent(world, eid, IsBuilding)) continue;
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
      if (Building.complete[eid] !== 1) continue;

      const buildingType = Building.typeId[eid];
      const arch = BUILDING_ARCHETYPES[buildingType];
      if (!arch.produces.includes(unitType)) continue;

      const unitArch = UNIT_ARCHETYPES[unitType];
      queueCommand({
        type: 'train',
        buildingEid: eid,
        unitTypeId: unitType,
        cost: unitArch.costGold,
      });
      return;
    }
    this.hud?.showAlert('Geen geschikt gebouw geselecteerd', 'warning');
  }

  private trainHero(heroTypeId: HeroTypeId): void {
    const arch = HERO_ARCHETYPES[heroTypeId];
    if (!arch) return;
    if (isHeroActive(FactionId.Brabanders, heroTypeId)) {
      this.hud?.showAlert(`${arch.name} is al in het spel!`, 'warning');
      return;
    }
    if (!this.playerState.canAfford(FactionId.Brabanders, arch.costGold)) {
      this.hud?.showAlert(`Niet genoeg goud! (${arch.costGold} nodig)`, 'warning');
      return;
    }
    if (!this.playerState.hasPopulationRoom(FactionId.Brabanders, HERO_POPULATION_COST)) {
      this.hud?.showAlert(`Niet genoeg populatie! (${HERO_POPULATION_COST} nodig)`, 'warning');
      return;
    }
    let barracksEid = -1;
    for (const eid of this.selectedEntities) {
      if (!hasComponent(world, eid, IsBuilding)) continue;
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
      if (Building.complete[eid] !== 1) continue;
      if (Building.typeId[eid] === BuildingTypeId.Barracks) { barracksEid = eid; break; }
    }
    if (barracksEid < 0) {
      const allBlds = query(world, [Building, IsBuilding]);
      for (const eid of allBlds) {
        if (Faction.id[eid] !== FactionId.Brabanders) continue;
        if (Building.complete[eid] !== 1) continue;
        if (Building.typeId[eid] === BuildingTypeId.Barracks) { barracksEid = eid; break; }
      }
    }
    if (barracksEid < 0) {
      this.hud?.showAlert('Bouw eerst een Cafe (Barracks)!', 'warning');
      return;
    }
    this.playerState.spend(FactionId.Brabanders, arch.costGold);
    let thX = Position.x[barracksEid];
    let thZ = Position.z[barracksEid];
    const thBlds = query(world, [Building, IsBuilding]);
    for (const eid of thBlds) {
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
      if (Building.typeId[eid] === BuildingTypeId.TownHall) {
        thX = Position.x[eid]; thZ = Position.z[eid]; break;
      }
    }
    const spawnX = Position.x[barracksEid] + 4;
    const spawnZ = Position.z[barracksEid] + 2;
    const heroEid = createHero(world, heroTypeId, FactionId.Brabanders, spawnX, spawnZ, thX, thZ);
    if (heroEid >= 0) {
      this.playerState.addPopulation(FactionId.Brabanders, HERO_POPULATION_COST);
      const mesh = this.unitRenderer.addUnit(heroEid, 'infantry', FACTION_ORANGE);
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

  private useHeroAbility(slot: number): void {
    for (const eid of this.selectedEntities) {
      if (!hasComponent(world, eid, IsHero)) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
      const success = activateHeroAbility(world, eid, slot);
      if (success) {
        const htId = Hero.heroTypeId[eid] as HeroTypeId;
        const heroArch = HERO_ARCHETYPES[htId];
        const ability = heroArch.abilities[slot];
        this.hud?.showAlert(`${ability.name}!`, 'info');
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

    // Left click: select unit/building via raycasting, or place building
    this.addTrackedListener(canvas, 'click', ((e: MouseEvent) => {
      if (e.button !== 0) return;

      // Build mode: place building
      if (this.buildMode && this.buildGhostType) {
        this.handleBuildPlacement(e.clientX, e.clientY);
        return;
      }

      const hit = this.raycastEntities(e.clientX, e.clientY);
      if (hit !== null && Faction.id[hit] === FactionId.Brabanders) {
        this.selectedEntities = [hit];
      } else {
        this.selectedEntities = [];
      }
      this.onSelectionChanged(this.selectedEntities);
    }) as EventListener);

    // Right click: context command
    this.addTrackedListener(canvas, 'mouseup', ((e: MouseEvent) => {
      if (e.button === 2) {
        if (this.buildMode) {
          this.exitBuildMode();
          return;
        }
        this.handleRightClick(e.clientX, e.clientY);
      }
    }) as EventListener);

    // Mouse move for build ghost
    this.addTrackedListener(canvas, 'mousemove', ((e: MouseEvent) => {
      if (this.buildMode && this.buildGhostType) {
        this.updateBuildGhost(e.clientX, e.clientY);
      }
    }) as EventListener);

    // Keyboard shortcuts
    this.addTrackedListener(window, 'keydown', ((e: KeyboardEvent) => {
      if (e.code === 'Escape' && this.buildMode) {
        this.exitBuildMode();
      }
      // B key for build barracks (when worker selected)
      if (e.code === 'KeyB') {
        const hasWorker = this.selectedEntities.some(eid =>
          hasComponent(world, eid, IsWorker) && Faction.id[eid] === FactionId.Brabanders
        );
        if (hasWorker) {
          this.enterBuildMode('barracks');
        }
      }
      // R key for Carnavalsrage ability
      if (e.code === 'KeyR') {
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
            const current = Math.floor(this.playerState.getGezelligheid(FactionId.Brabanders));
            this.hud?.showAlert(`Niet genoeg Gezelligheid! (${current}/${config.cost})`, 'warning');
          }
        }
      }

      // Hero ability hotkeys: 1/2/3 when hero is selected
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        this.useHeroAbility(0);
      }
      if (e.code === 'Digit2' || e.code === 'Numpad2') {
        this.useHeroAbility(1);
      }
      if (e.code === 'Digit3' || e.code === 'Numpad3') {
        this.useHeroAbility(2);
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
        const factionIdx = event.factionId === FactionId.Brabanders ? FACTION_ORANGE : FACTION_BLUE;
        const typeName = event.unitTypeId === UnitTypeId.Worker ? 'worker'
          : event.unitTypeId === UnitTypeId.Infantry ? 'infantry' : 'ranged';
        const mesh = this.unitRenderer.addUnit(eid, typeName, factionIdx);
        if (mesh) {
          mesh.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
          mesh.userData.eid = eid;
          this.entityMeshMap.set(eid, mesh);
        }
        this.knownUnitEntities.add(eid);
      }
      // Audio: play unit trained horn (only for player units)
      if (event.factionId === FactionId.Brabanders) {
        audioManager.playSound('unit_trained');
      }
    });

    eventBus.on('unit-died', (event) => {
      if (event.factionId === FactionId.Brabanders) {
        this.stats.unitsLost++;
      } else {
        this.stats.enemiesKilled++;
      }
      // Audio: play death sound at unit position
      const eid = event.entityId;
      const pos = this.entityMeshMap.get(eid)?.position;
      if (pos) {
        audioManager.playSound('unit_death', { x: pos.x, z: pos.z });
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
      this.hud?.showAlert(`${HERO_ARCHETYPES[event.heroTypeId].name} is gevallen! Revival in 60s...`, 'warning');
    });

    eventBus.on('hero-revived', (event) => {
      const eid = event.entityId;
      this.hud?.showAlert(`${HERO_ARCHETYPES[event.heroTypeId].name} is terug!`, 'info');
      // Mesh creation is handled by detectAndRenderNewEntities
    });

    // Audio: combat hits (sword for melee, arrow for ranged)
    eventBus.on('combat-hit', (event) => {
      const targetPos = { x: event.x, z: event.z };
      if (event.isRanged) {
        // Play arrow shoot from attacker, impact at target
        const attackerPos = { x: Position.x[event.attackerEid], z: Position.z[event.attackerEid] };
        audioManager.playSound('arrow_shoot', attackerPos);
        audioManager.playSound('arrow_impact', targetPos);
      } else {
        audioManager.playSound('sword_hit', targetPos);
      }
    });

    // Audio: building placed (construction start)
    eventBus.on('building-placed', (event) => {
      if (event.factionId === FactionId.Brabanders) {
        audioManager.playSound('building_complete', { x: event.x, z: event.z });
      }
    });

    // Audio: resource deposited (gold jingle)
    eventBus.on('resource-deposited', (event) => {
      if (event.factionId === FactionId.Brabanders) {
        audioManager.playSound('gold_deposit');
      }
    });

    // Audio: carnavalsrage activated
    eventBus.on('carnavalsrage-activated', () => {
      audioManager.playSound('carnavalsrage');
      audioManager.duckMusic(3000);
    });

    // Audio: vergadering ability
    eventBus.on('vergadering', (event) => {
      audioManager.playSound('vergadering', { x: event.x, z: event.z });
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
      const cost = BUILDING_ARCHETYPES[BuildingTypeId.Barracks].costGold;

      if (!this.playerState.canAfford(FactionId.Brabanders, cost)) {
        this.hud?.showAlert('Niet genoeg goud!', 'warning');
        return;
      }

      // Deduct gold
      this.playerState.spend(FactionId.Brabanders, cost);

      // Spawn building
      const eid = this.spawnBuildingAtRuntime(BuildingTypeId.Barracks, FactionId.Brabanders, point.x, point.z);

      // Send nearest worker to build site
      queueCommand({
        type: 'build',
        buildingTypeId: BuildingTypeId.Barracks,
        x: point.x,
        z: point.z,
      });

      this.stats.buildingsBuilt++;
      audioManager.playSound('building_place', { x: point.x, z: point.z });
      this.hud?.showAlert('Barracks wordt gebouwd!', 'info');
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
      this.buildingRenderer.showGhost(
        'barracks',
        FACTION_ORANGE,
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

    if (faction === FactionId.AI) {
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

    const factionIdx = faction === FactionId.Brabanders ? FACTION_ORANGE : FACTION_BLUE;
    const typeName = type === BuildingTypeId.TownHall ? 'townhall' : 'barracks';
    const y = this.terrain.getHeightAt(x, z);
    const startProgress = faction === FactionId.AI ? 1.0 : 0.0;
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

    // Audio: play select sound when selecting own units
    if (entityIds.length > 0) {
      audioManager.playSound('select_unit');
    }

    // Update HUD
    if (this.hud && entityIds.length > 0) {
      const firstEid = entityIds[0];

      // Check if it's a building
      if (hasComponent(world, firstEid, IsBuilding) && Faction.id[firstEid] === FactionId.Brabanders) {
        const buildingType = Building.typeId[firstEid];
        const buildingName = buildingType === BuildingTypeId.TownHall ? 'Boerderij' : 'Cafe';
        const queueItems = this.getBuildingQueue(firstEid);

        this.hud.showBuildingPanel({
          id: firstEid,
          name: buildingName,
          hp: Health.current[firstEid],
          maxHp: Health.max[firstEid],
          type: buildingType === BuildingTypeId.TownHall ? 'townhall' : 'barracks',
          queue: queueItems,
        });

        // Show building command panel
        const cmdBuilding = document.getElementById('cmd-building');
        if (cmdBuilding) cmdBuilding.hidden = false;
      } else if (hasComponent(world, firstEid, IsUnit)) {
        // Unit(s) selected
        const units: SelectedUnit[] = entityIds.map(eid => ({
          id: eid,
          name: this.getUnitName(eid),
          hp: Health.current[eid],
          maxHp: Health.max[eid],
          atk: Attack.damage[eid],
          arm: Armor.value[eid],
          spd: Movement.speed[eid],
          level: 1,
          status: this.getUnitStatus(eid),
          portrait: null,
        }));
        this.hud.showUnitPanel(units);

        // Show worker commands if a worker is selected
        const hasWorker = entityIds.some(eid => hasComponent(world, eid, IsWorker));
        if (hasWorker) {
          this.hud.showWorkerCommands();
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
            // Update ability button labels
            const htId = Hero.heroTypeId[heroEid] as HeroTypeId;
            const heroArch = HERO_ARCHETYPES[htId];
            for (let i = 0; i < 3; i++) {
              const btn = heroPanel.querySelector(`[data-slot="${i}"]`) as HTMLButtonElement;
              if (btn && heroArch.abilities[i]) {
                const nameEl = btn.querySelector('.ability-name');
                if (nameEl) nameEl.textContent = heroArch.abilities[i].name;
                const cdEl = btn.querySelector('.ability-cd');
                const cd = i === 0 ? HeroAbilities.ability0Cooldown[heroEid]
                  : i === 1 ? HeroAbilities.ability1Cooldown[heroEid]
                    : HeroAbilities.ability2Cooldown[heroEid];
                if (cdEl) {
                  cdEl.textContent = cd > 0 ? `${Math.ceil(cd)}s` : '';
                }
                btn.disabled = cd > 0;
              }
            }
          }
        }
      }
    } else if (this.hud) {
      this.hud.hideSelectionPanel();
      // Hide all command panels
      const panels = ['cmd-unit', 'cmd-multi', 'cmd-building', 'cmd-worker', 'cmd-hero'];
      for (const id of panels) {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
      }
    }
  }

  private getBuildingQueue(eid: number): Array<{ unitName: string; progress: number; remainingSeconds: number }> {
    const items: Array<{ unitName: string; progress: number; remainingSeconds: number }> = [];
    if (!hasComponent(world, eid, Production)) return items;

    if (Production.unitType[eid] !== NO_PRODUCTION) {
      const progress = Production.progress[eid];
      const duration = Production.duration[eid];
      const remaining = Math.max(0, duration * (1 - progress));
      items.push({
        unitName: this.getUnitNameByType(Production.unitType[eid]),
        progress,
        remainingSeconds: remaining,
      });
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

      if (targetEid !== null && Faction.id[targetEid] !== FactionId.Brabanders &&
          (hasComponent(world, targetEid, IsUnit) || hasComponent(world, targetEid, IsBuilding))) {
        // Attack enemy unit or building
        queueCommand({ type: 'attack', targetEid });
      } else if (targetEid !== null && hasComponent(world, targetEid, IsResource)) {
        // Gather from resource
        queueCommand({ type: 'gather', targetEid });
      } else {
        // Move to position
        queueCommand({ type: 'move', targetX: point.x, targetZ: point.z });
        // Show green move indicator
        this.unitRenderer.showMoveIndicator(point.x, point.y, point.z);
      }
    }
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
    let closest: number | null = null;
    let closestDist = 3.0; // 3 unit click radius

    for (const [eid, mesh] of this.entityMeshMap) {
      const dx = mesh.position.x - x;
      const dz = mesh.position.z - z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < closestDist) {
        closestDist = dist;
        closest = eid;
      }
    }

    return closest;
  }

  private getUnitName(eid: number): string {
    // Check if hero first
    if (hasComponent(world, eid, IsHero) && hasComponent(world, eid, Hero)) {
      const htId = Hero.heroTypeId[eid] as HeroTypeId;
      const arch = HERO_ARCHETYPES[htId];
      if (arch) return arch.name;
    }
    const type = UnitType.id[eid];
    return this.getUnitNameByType(type);
  }

  private getUnitNameByType(type: number): string {
    switch (type) {
      case UnitTypeId.Worker: return 'Boer';
      case UnitTypeId.Infantry: return 'Carnavalvierder';
      case UnitTypeId.Ranged: return 'Kansen';
      default: return 'Unit';
    }
  }

  update(dt: number): void {
    if (this.gameOver) return;

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

    // Remove dead entity meshes
    this.cleanupDeadEntities();

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
      deductGold: (amount: number) => {
        return this.playerState.spend(FactionId.AI, amount);
      },
      getGold: () => {
        return this.playerState.getGold(FactionId.AI);
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
      const factionIdx = Faction.id[eid] === FactionId.Brabanders ? FACTION_ORANGE : FACTION_BLUE;
      const unitType = UnitType.id[eid];
      const typeName = unitType === UnitTypeId.Worker ? 'worker'
        : unitType === UnitTypeId.Infantry ? 'infantry' : 'ranged';
      const mesh = this.unitRenderer.addUnit(eid, typeName, factionIdx);
      if (mesh) {
        mesh.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
        // Scale heroes larger so they're VISIBLY stronger
        if (hasComponent(world, eid, IsHero)) {
          mesh.scale.setScalar(1.8);
        }
        mesh.userData.eid = eid;
        this.entityMeshMap.set(eid, mesh);
      }
      this.knownUnitEntities.add(eid);
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
      selected: boolean; isIdle?: boolean; targetX?: number; targetZ?: number;
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
            targetX: hasTarget ? Movement.targetX[eid] : undefined,
            targetZ: hasTarget ? Movement.targetZ[eid] : undefined,
          });
        } else {
          // Buildings & resources: simple position sync
          mesh.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
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
      selectionData.push({
        eid,
        x: Position.x[eid],
        y: Position.y[eid],
        z: Position.z[eid],
        selected: true,
        isOwnFaction: Faction.id[eid] === FactionId.Brabanders,
        hp: Health.current[eid],
        maxHp: Health.max[eid],
      });
    }

    this.selectionRenderer.update(dt, selectionData);
  }

  private cleanupDeadEntities(): void {
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
        if (this.entityMeshMap.has(eid)) {
          this.buildingRenderer.removeBuilding(eid);
          this.entityMeshMap.delete(eid);
        }
        this.knownBuildingEntities.delete(eid);
      }
    }
  }

  private updateHUD(): void {
    if (!this.hud) return;

    this.hud.updateResources(
      this.playerState.getGold(0),
      this.playerState.getPopulation(0),
      this.playerState.getPopulationMax(0)
    );

    // Update Gezelligheid meter and Carnavalsrage state
    const rageState = getCarnavalsrageState();
    const rageConfig = getCarnavalsrageConfig();
    this.hud.updateGezelligheid(
      this.playerState.getGezelligheid(FactionId.Brabanders),
      rageConfig.cost,
      rageState.active,
      rageState.remainingDuration,
      rageState.cooldownRemaining,
    );

    // Update selected unit/building info
    if (this.selectedEntities.length > 0) {
      const firstEid = this.selectedEntities[0];
      if (entityExists(world, firstEid)) {
        if (hasComponent(world, firstEid, IsBuilding)) {
          // Update building production progress
          if (hasComponent(world, firstEid, Production) && Production.unitType[firstEid] !== NO_PRODUCTION) {
            const progress = Production.progress[firstEid];
            const duration = Production.duration[firstEid];
            const remaining = Math.max(0, duration * (1 - progress));
            this.hud.updateProductionQueue(
              progress,
              this.getUnitNameByType(Production.unitType[firstEid]),
              remaining
            );
          }
        }
      }
    }
  }

  private minimapTerrainCache: ImageData | null = null;

  /**
   * Render terrain colors onto a cached ImageData (only done once).
   */
  private buildMinimapTerrainCache(w: number, h: number): ImageData {
    const img = new ImageData(w, h);
    const halfMap = MAP_SIZE / 2;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const wx = (px / w) * MAP_SIZE - halfMap;
        const wz = (py / h) * MAP_SIZE - halfMap;
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
    const halfMap = MAP_SIZE / 2;

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
    const toMiniX = (wx: number) => ((wx + halfMap) / MAP_SIZE) * w;
    const toMiniY = (wz: number) => ((wz + halfMap) / MAP_SIZE) * h;

    // Draw gold mines (bright yellow dots, only if explored)
    for (const [eid] of this.entityMeshMap) {
      if (hasComponent(world, eid, IsResource)) {
        const wx = Position.x[eid];
        const wz = Position.z[eid];
        if (!this.fogOfWarRenderer.isExplored(wx, wz)) continue;
        const mx = toMiniX(wx);
        const my = toMiniY(wz);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(mx - 2, my - 2, 5, 5);
      }
    }

    // Draw buildings (larger dots, only if explored)
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      const wx = Position.x[eid];
      const wz = Position.z[eid];
      if (!this.fogOfWarRenderer.isExplored(wx, wz)) continue;
      const mx = toMiniX(wx);
      const my = toMiniY(wz);
      // Brighter faction colors on minimap
      ctx.fillStyle = Faction.id[eid] === FactionId.Brabanders ? '#FF8C00' : '#4DA6FF';
      ctx.fillRect(mx - 3, my - 3, 7, 7);
    }

    // Draw units (only if visible or own faction)
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid)) continue;
      if (hasComponent(world, eid, IsDead)) continue;
      const wx = Position.x[eid];
      const wz = Position.z[eid];
      const isOwn = Faction.id[eid] === FactionId.Brabanders;
      // Only show enemy units if they're currently visible
      if (!isOwn && !this.fogOfWarRenderer.isVisible(wx, wz)) continue;
      const mx = toMiniX(wx);
      const my = toMiniY(wz);
      // Bright orange for Brabanders, bright blue for Randstad
      ctx.fillStyle = isOwn ? '#FFA500' : '#4488FF';
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
        if (Faction.id[eid] === FactionId.Brabanders) {
          playerTownHallAlive = true;
        } else if (Faction.id[eid] === FactionId.AI) {
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
    if (this.hud) {
      this.hud.showGameOver(victory, {
        durationSeconds: world.meta.elapsed,
        unitsProduced: this.stats.unitsProduced,
        unitsLost: this.stats.unitsLost,
        enemiesKilled: this.stats.enemiesKilled,
        buildingsBuilt: this.stats.buildingsBuilt,
        buildingsDestroyed: 0,
        resourcesGathered: this.stats.resourcesGathered,
      });
    }
  }

  // --- Entity creation helpers ---

  private createUnitEntity(type: UnitTypeId, faction: FactionId, x: number, z: number): number {
    const eid = addEntity(world);
    const arch = UNIT_ARCHETYPES[type];
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
    }

    this.playerState.addPopulation(faction, 1);
    return eid;
  }

  private createBuildingEntity(type: BuildingTypeId, faction: FactionId, x: number, z: number): number {
    const eid = addEntity(world);
    const arch = BUILDING_ARCHETYPES[type];
    const y = this.terrain.getHeightAt(x, z);

    addComponent(world, eid, Position); Position.x[eid] = x; Position.y[eid] = y; Position.z[eid] = z;
    addComponent(world, eid, Health); Health.current[eid] = arch.hp; Health.max[eid] = arch.hp;
    addComponent(world, eid, Faction); Faction.id[eid] = faction;
    addComponent(world, eid, Building); Building.typeId[eid] = type; Building.complete[eid] = 1;
    addComponent(world, eid, Visibility); Visibility.range[eid] = arch.sightRange || 12;
    addComponent(world, eid, Selected); Selected.by[eid] = 255;
    addComponent(world, eid, IsBuilding);

    // Add Production component to buildings that can produce
    if (arch.produces.length > 0) {
      addComponent(world, eid, Production);
      Production.unitType[eid] = NO_PRODUCTION;
      Production.progress[eid] = 0;
      Production.queue0[eid] = NO_PRODUCTION;
      Production.queue1[eid] = NO_PRODUCTION;
      Production.queue2[eid] = NO_PRODUCTION;
      Production.queue3[eid] = NO_PRODUCTION;
      Production.queue4[eid] = NO_PRODUCTION;
    }

    this.playerState.addPopulationCapacity(faction, type === BuildingTypeId.TownHall ? 10 : 5);
    return eid;
  }

  // -------------------------------------------------------------------------
  // Public query methods (for Tutorial + Main integration)
  // -------------------------------------------------------------------------

  /** Get current player gold amount. */
  getPlayerGold(): number {
    return this.playerState.getGold(FactionId.Brabanders);
  }

  /** Whether the player currently has a worker selected. */
  hasWorkerSelected(): boolean {
    return this.selectedEntities.some(eid =>
      entityExists(world, eid) && hasComponent(world, eid, IsWorker) && Faction.id[eid] === FactionId.Brabanders
    );
  }

  /** Whether any player worker has started gathering. */
  hasGatheringStarted(): boolean {
    for (const eid of this.knownUnitEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
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
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
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
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
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
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
      if (UnitAI.state[eid] === UnitAIState.Attacking) {
        return true;
      }
    }
    return false;
  }

  /** Get position of the player's Town Hall (base). */
  getPlayerBasePosition(): { x: number; z: number } {
    for (const eid of this.knownBuildingEntities) {
      if (!entityExists(world, eid)) continue;
      if (Faction.id[eid] !== FactionId.Brabanders) continue;
      if (Building.typeId[eid] === BuildingTypeId.TownHall) {
        return { x: Position.x[eid], z: Position.z[eid] };
      }
    }
    // Fallback to map spawn
    const playerSpawn = this.map.spawns.find(s => s.factionId === FactionId.Brabanders);
    return playerSpawn ? { x: playerSpawn.x, z: playerSpawn.z } : { x: 0, z: 0 };
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

    // Reset game state
    this.selectedEntities = [];
    this.lastHpMap.clear();
    this.gameOver = false;
    this.buildMode = false;
    this.buildGhostType = null;
    this.stats = { unitsProduced: 0, unitsLost: 0, enemiesKilled: 0, buildingsBuilt: 0, resourcesGathered: 0 };
    this.missionSystem = null;
    this.activeMission = null;
    this.missionMessageTimer = 0;
    this.militaryTrainedCount = 0;

    // Remove mission UI elements
    const msgEl = document.getElementById('mission-message');
    if (msgEl) msgEl.remove();
    const objEl = document.getElementById('mission-objectives');
    if (objEl) objEl.remove();
  }

  private createGoldMineEntity(x: number, z: number, amount: number): number {
    const eid = addEntity(world);
    const y = this.terrain.getHeightAt(x, z);

    addComponent(world, eid, Position); Position.x[eid] = x; Position.y[eid] = y; Position.z[eid] = z;
    addComponent(world, eid, Resource); Resource.amount[eid] = amount;
    addComponent(world, eid, IsResource);
    return eid;
  }
}
