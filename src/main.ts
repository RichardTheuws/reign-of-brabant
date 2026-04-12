import * as THREE from 'three';
import { GameLoop } from './core/GameLoop';
import { EventBus } from './core/EventBus';
import { Terrain } from './world/Terrain';
import { RTSCamera } from './camera/RTSCamera';
import { Game } from './core/Game';
import { GameStateMachine, GameStateId } from './core/GameState';
import { MenuState, FactionSelectState, CampaignSelectState, BriefingState, LoadingState, TutorialState, PlayingState, GameOverState, setGameFlowDeps } from './core/GameStates';
import { MenuScreens } from './ui/MenuScreens';
import { CampaignUI } from './ui/CampaignUI';
import { CampaignManager } from './campaign/CampaignManager';
import { getMissionById } from './campaign/MissionDefinitions';
import { Tutorial } from './core/Tutorial';
import type { TutorialState as TutorialStateData } from './core/Tutorial';
import { initAtmosphere, updateAtmosphere } from './rendering/Atmosphere';
import { updateWater } from './world/Terrain';
import { PostProcessing } from './rendering/PostProcessing';
import { ParticleSystem } from './rendering/ParticleSystem';

// ---------------------------------------------------------------------------
// Version (injected by Vite from package.json)
// ---------------------------------------------------------------------------
declare const __APP_VERSION__: string;
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
document.querySelectorAll('.menu-version, .loading-version').forEach(el => {
  el.textContent = `v${appVersion}`;
});
const debugVersion = document.getElementById('fps-value')?.parentElement;
if (debugVersion) {
  debugVersion.innerHTML = debugVersion.innerHTML.replace(/v__VERSION__/, `v${appVersion}`);
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas #game-canvas not found');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a3a5c);

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();

// Atmosphere: sky dome, fog, shadow-casting sun, dust particles
const sun = initAtmosphere(scene, renderer);
scene.add(sun);

// Ambient: slightly warm for a Brabant afternoon
scene.add(new THREE.AmbientLight(0xfff8e8, 0.55));

// Fill light from opposite side for softer shadows
const fill = new THREE.DirectionalLight(0xccddff, 0.25);
fill.position.set(30, 40, 40);
scene.add(fill);

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------
const terrain = new Terrain();
scene.add(terrain.mesh);
scene.add(terrain.waterMesh);
if (terrain.gridMesh) scene.add(terrain.gridMesh);

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
const rtsCamera = new RTSCamera(terrain.mapSize);

// ---------------------------------------------------------------------------
// Post-processing (bloom + outlines)
// ---------------------------------------------------------------------------
const postProcessing = new PostProcessing(renderer, scene, rtsCamera.camera);

// ---------------------------------------------------------------------------
// Input state
// ---------------------------------------------------------------------------
const keysDown = new Set<string>();
let mouseX = -1, mouseY = -1, scrollDelta = 0;

window.addEventListener('keydown', (e) => {
  keysDown.add(e.code);
  if (e.code === 'Escape' && gameInitialized && stateMachine.currentId === GameStateId.PLAYING) {
    togglePause();
  }
});
window.addEventListener('keyup', (e) => keysDown.delete(e.code));
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('wheel', (e) => { e.preventDefault(); scrollDelta += e.deltaY > 0 ? 1 : -1; }, { passive: false });
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  rtsCamera.resize(window.innerWidth, window.innerHeight);
  postProcessing.resize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// Event bus
// ---------------------------------------------------------------------------
const eventBus = new EventBus();

// ---------------------------------------------------------------------------
// Game instance (created but NOT initialized until loading state)
// ---------------------------------------------------------------------------
const particles = new ParticleSystem(scene);
const game = new Game(scene, terrain, rtsCamera, eventBus, particles);

// ---------------------------------------------------------------------------
// Menu screens controller
// ---------------------------------------------------------------------------
const menuScreens = new MenuScreens();

// ---------------------------------------------------------------------------
// Campaign system
// ---------------------------------------------------------------------------
const campaignManager = new CampaignManager();
const campaignUI = new CampaignUI(campaignManager);
let activeMissionId: string | null = null;
let selectedPlayerFaction: number = 0; // FactionId: 0=Brabanders, 1=Randstad, 2=Limburgers, 3=Belgen
let selectedMapTemplate: string = 'classic';

// ---------------------------------------------------------------------------
// Tutorial
// ---------------------------------------------------------------------------
const tutorial = new Tutorial();
let tutorialActive = false;

// Track tutorial state from game events
const tutorialState: TutorialStateData = {
  cameraMoved: false,
  workerSelected: false,
  gatheringStarted: false,
  barracksBuilt: false,
  unitTrained: false,
  attackIssued: false,
  gold: 0,
};

// Camera tracking for tutorial: detect if camera has been moved
let initialCameraX = 0;
let initialCameraZ = 0;

// ---------------------------------------------------------------------------
// State Machine
// ---------------------------------------------------------------------------
const stateMachine = new GameStateMachine();
let gameInitialized = false;
let gamePaused = false;

function togglePause(): void {
  gamePaused = !gamePaused;
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.hidden = !gamePaused;
}

// Menu camera rotation state
let menuCameraAngle = 0;

// Camera intro state
let cameraIntroActive = false;
let cameraIntroTimer = 0;
const CAMERA_INTRO_DURATION = 3.5;
let cameraIntroStartY = 55;
let cameraIntroTargetX = 0;
let cameraIntroTargetZ = 0;

// ---------------------------------------------------------------------------
// Wire up state machine dependencies
// ---------------------------------------------------------------------------
setGameFlowDeps({
  showMainMenu: () => menuScreens.showMainMenu(),
  hideMainMenu: () => menuScreens.hideMainMenu(),
  showFactionSelect: () => menuScreens.showFactionSelect(),
  hideFactionSelect: () => menuScreens.hideFactionSelect(),
  showCampaignSelect: () => campaignUI.showCampaignSelect(),
  hideCampaignSelect: () => campaignUI.hideCampaignSelect(),
  showBriefing: (missionId) => campaignUI.showBriefing(missionId),
  hideBriefing: () => campaignUI.hideBriefing(),
  showLoadingScreen: () => menuScreens.showLoadingScreen(),
  hideLoadingScreen: () => menuScreens.hideLoadingScreen(),
  setGameHUDVisible: (v) => menuScreens.setGameHUDVisible(v),
  updateLoadingProgress: (p, l) => menuScreens.updateLoadingProgress(p, l),
  isGameInitialized: () => gameInitialized,

  startGame: async (isTutorial: boolean) => {
    if (!gameInitialized) {
      await game.init(selectedPlayerFaction, selectedMapTemplate);
      gameInitialized = true;
    }
    tutorialActive = isTutorial;
    if (isTutorial) {
      // Reset tutorial state
      tutorialState.cameraMoved = false;
      tutorialState.workerSelected = false;
      tutorialState.gatheringStarted = false;
      tutorialState.barracksBuilt = false;
      tutorialState.unitTrained = false;
      tutorialState.attackIssued = false;
    }
  },

  startMission: async (missionId: string) => {
    activeMissionId = missionId;
    await game.initMission(missionId);
    gameInitialized = true;

    // Auto-start tutorial on first campaign mission (De Oogst)
    if (missionId === 'brabant-1-de-oogst') {
      tutorialActive = true;
      tutorialState.cameraMoved = false;
      tutorialState.workerSelected = false;
      tutorialState.gatheringStarted = false;
      tutorialState.barracksBuilt = false;
      tutorialState.unitTrained = false;
      tutorialState.attackIssued = false;
    }

    // Wire up mission victory/defeat callbacks
    game.onMissionVictory = (stars, time, bonuses) => {
      const mission = getMissionById(missionId);
      campaignManager.completeMission(missionId, stars, time, bonuses);
      const bonusDescriptions = bonuses.map(id => {
        const obj = mission?.objectives.find(o => o.id === id);
        return obj?.description ?? id;
      });
      campaignUI.showVictoryOverlay(stars, time, bonusDescriptions, mission?.title ?? 'Missie');
    };
    game.onMissionDefeat = () => {
      const mission = getMissionById(missionId);
      campaignUI.showDefeatOverlay(mission?.title ?? 'Missie');
    };
  },

  updateGame: (dt: number) => {
    if (gamePaused) return;
    // Camera input (only when in-game, not during intro)
    if (!cameraIntroActive) {
      rtsCamera.update(dt, keysDown, mouseX, mouseY, window.innerWidth, window.innerHeight, scrollDelta);
      scrollDelta = 0;

      // Track camera movement for tutorial
      if (tutorialActive && !tutorialState.cameraMoved) {
        const cam = rtsCamera.camera.position;
        const dx = Math.abs(cam.x - initialCameraX);
        const dz = Math.abs(cam.z - initialCameraZ);
        if (dx > 3 || dz > 3) {
          tutorialState.cameraMoved = true;
        }
      }
    }

    game.update(dt);

    // Update tutorial if active
    if (tutorialActive && tutorial.isActive) {
      // Feed game state into tutorial
      tutorialState.gold = game.getPlayerGold();
      tutorialState.workerSelected = game.hasWorkerSelected();
      tutorialState.gatheringStarted = game.hasGatheringStarted();
      tutorialState.barracksBuilt = game.hasBarracksBuilt();
      tutorialState.unitTrained = game.hasUnitTrained();
      tutorialState.attackIssued = game.hasAttackIssued();

      tutorial.update(dt, tutorialState);
    }
  },

  updateMenuCamera: (dt: number) => {
    // Slowly rotate camera around the center of the map
    menuCameraAngle += dt * 0.15;
    const radius = 60;
    const height = 45;
    const cx = Math.cos(menuCameraAngle) * radius;
    const cz = Math.sin(menuCameraAngle) * radius;
    rtsCamera.camera.position.set(cx, height, cz);
    rtsCamera.camera.lookAt(0, 0, 0);
  },

  startCameraIntro: () => {
    cameraIntroActive = true;
    cameraIntroTimer = 0;

    // Start camera high above the map
    const playerBase = game.getPlayerBasePosition();
    cameraIntroTargetX = playerBase.x;
    cameraIntroTargetZ = playerBase.z;
    cameraIntroStartY = 55;

    // Show and fade the black overlay
    const overlay = document.getElementById('camera-intro-overlay');
    if (overlay) {
      overlay.classList.remove('is-hidden');
      overlay.classList.remove('is-fading');
      // Trigger fade after a small delay
      requestAnimationFrame(() => {
        overlay.classList.add('is-fading');
      });
    }

    // Show fullscreen tip after a short delay
    setTimeout(() => {
      const tip = document.getElementById('fullscreen-tip');
      if (tip) {
        tip.hidden = false;
        setTimeout(() => { if (tip) tip.hidden = true; }, 20000);
      }
    }, 2000);

    // Record initial camera position for tutorial tracking
    initialCameraX = cameraIntroTargetX;
    initialCameraZ = cameraIntroTargetZ;

    // Start tutorial if in tutorial mode
    if (tutorialActive) {
      tutorial.start(() => {
        // Tutorial completed -- just continue playing
        tutorialActive = false;
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Register states
// ---------------------------------------------------------------------------
stateMachine.register(new MenuState());
stateMachine.register(new FactionSelectState());
stateMachine.register(new CampaignSelectState());
stateMachine.register(new BriefingState());
stateMachine.register(new LoadingState());
stateMachine.register(new TutorialState());
stateMachine.register(new PlayingState());
stateMachine.register(new GameOverState());

// ---------------------------------------------------------------------------
// Menu screen events
// ---------------------------------------------------------------------------
menuScreens.init({
  onMenuAction: (action) => {
    switch (action) {
      case 'play':
        stateMachine.requestTransition(GameStateId.FACTION_SELECT);
        break;
      case 'campaign':
        stateMachine.requestTransition(GameStateId.CAMPAIGN_SELECT);
        break;
      case 'tutorial':
        // Tutorial is now integrated into first campaign mission (De Oogst)
        stateMachine.requestTransition(GameStateId.CAMPAIGN_SELECT);
        break;
      case 'settings':
        // Settings not implemented yet
        break;
    }
  },
  onFactionSelected: (faction, _startTutorial, mapTemplate) => {
    const factionMap: Record<string, number> = { brabanders: 0, randstad: 1, limburgers: 2, belgen: 3 };
    selectedPlayerFaction = factionMap[faction] ?? 0;
    selectedMapTemplate = mapTemplate ?? 'classic';
    stateMachine.requestTransition(GameStateId.LOADING, { tutorial: false });
  },
});

// ---------------------------------------------------------------------------
// Campaign UI events
// ---------------------------------------------------------------------------
campaignUI.init({
  onMissionSelected: (missionId) => {
    stateMachine.requestTransition(GameStateId.BRIEFING, { missionId });
  },
  onStartMission: (missionId) => {
    stateMachine.requestTransition(GameStateId.LOADING, { missionId });
  },
  onBackToMenu: () => {
    stateMachine.requestTransition(GameStateId.MENU);
  },
  onBackToCampaignSelect: () => {
    stateMachine.requestTransition(GameStateId.CAMPAIGN_SELECT);
  },
});

// ---------------------------------------------------------------------------
// Pause menu buttons
// ---------------------------------------------------------------------------
document.getElementById('btn-resume')?.addEventListener('click', () => togglePause());
document.getElementById('pause-btn')?.addEventListener('click', () => {
  if (gameInitialized) togglePause();
});
document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
  gamePaused = false;
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.hidden = true;
  gameInitialized = false;
  stateMachine.requestTransition(GameStateId.MENU);
});
document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
  const panel = document.getElementById('settings-panel');
  if (panel) panel.hidden = false;
});

// ---------------------------------------------------------------------------
// Stats (dev only)
// ---------------------------------------------------------------------------
let devStats: { update: () => void; dom: HTMLElement } | null = null;

// ---------------------------------------------------------------------------
// Game Loop
// ---------------------------------------------------------------------------
function fixedUpdate(dt: number): void {
  // Camera intro animation
  if (cameraIntroActive) {
    cameraIntroTimer += dt;
    const t = Math.min(cameraIntroTimer / CAMERA_INTRO_DURATION, 1);
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const startHeight = cameraIntroStartY;
    const endHeight = 25;
    const currentHeight = startHeight + (endHeight - startHeight) * eased;

    const arcOffsetX = (1 - eased) * 15;
    const arcOffsetZ = (1 - eased) * 20;
    const offsetZ = 18 * Math.cos(Math.PI / 3.5);

    rtsCamera.camera.position.set(
      cameraIntroTargetX + arcOffsetX,
      currentHeight,
      cameraIntroTargetZ + offsetZ + arcOffsetZ
    );
    rtsCamera.camera.lookAt(
      cameraIntroTargetX + arcOffsetX * 0.3,
      0,
      cameraIntroTargetZ + arcOffsetZ * 0.15
    );

    if (t >= 1) {
      cameraIntroActive = false;
      rtsCamera.setPosition(cameraIntroTargetX, cameraIntroTargetZ);
      const overlay = document.getElementById('camera-intro-overlay');
      if (overlay) {
        setTimeout(() => overlay.classList.add('is-hidden'), 1000);
      }
    }
  }

  // Update state machine (handles all state-specific updates)
  stateMachine.update(dt);
}

let renderElapsed = 0;
function render(_alpha: number): void {
  const dt = 1 / 60;
  renderElapsed += dt;
  updateAtmosphere(dt);
  updateWater(renderElapsed);
  particles.update(dt);
  postProcessing.render();
  devStats?.update();
}

const gameLoop = new GameLoop(fixedUpdate, render);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function boot(): Promise<void> {
  if (import.meta.env.DEV) {
    try {
      const StatsGL = (await import('stats-gl')).default;
      devStats = new StatsGL({ trackGPU: false });
      document.body.appendChild(devStats.dom);
    } catch { /* stats-gl optional */ }
  }

  // Hide loading screen (it shows by default for initial page load)
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      if (loadingScreen.classList.contains('hidden')) {
        loadingScreen.style.display = 'none';
      }
    }, 600);
  }

  // Start game loop (renders terrain even in menu)
  gameLoop.start();

  // Enter the main menu state
  stateMachine.start(GameStateId.MENU);

  console.log('[RoB] Reign of Brabant started -- Main Menu');
}

boot().catch((err) => {
  console.error('[RoB] Boot failed:', err);
  const loading = document.getElementById('loading-screen');
  if (loading) loading.innerHTML = `<h1 style="color:red">Laden mislukt</h1><p>${err.message}</p>`;
});
