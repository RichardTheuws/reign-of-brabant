/**
 * Reign of Brabant -- System Pipeline
 *
 * Orchestrates all ECS systems in the correct execution order.
 * Each system is a function: (world: GameWorld, dt: number) => void.
 *
 * Execution order follows the architecture spec:
 *   Phase 1: Input Capture (InputSystem, CameraSystem)
 *   Phase 2: Player Intent (SelectionSystem, CommandSystem)
 *   Phase 3: AI Decisions (AISystem, StrategicAISystem)
 *   Phase 4: Movement (PathfindingSystem, MovementSystem)
 *   Phase 5: Combat & Economy (CombatSystem, GatherSystem, ProductionSystem, BuildSystem)
 *   Phase 6: Cleanup (DeathSystem)
 *   Phase 7: Presentation (VisionSystem, RenderSyncSystem, UISystem, MinimapSystem)
 *
 * This file only registers the game-logic systems (Phase 2-6).
 * Input/camera/render systems are registered externally by Game.ts.
 */

import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SystemFn = (world: GameWorld, dt: number) => void;

interface RegisteredSystem {
  name: string;
  fn: SystemFn;
  /** Phase group for logging/profiling. */
  phase: string;
}

// ---------------------------------------------------------------------------
// Performance profiling (dev mode)
// ---------------------------------------------------------------------------

interface SystemProfile {
  name: string;
  lastMs: number;
  avgMs: number;
  maxMs: number;
  samples: number;
}

// ---------------------------------------------------------------------------
// SystemPipeline
// ---------------------------------------------------------------------------

export class SystemPipeline {
  private systems: RegisteredSystem[] = [];
  private profiles: Map<string, SystemProfile> = new Map();
  private profilingEnabled = false;

  /**
   * Enable or disable per-system timing.
   * When enabled, `getProfiles()` returns timing data.
   */
  setProfiling(enabled: boolean): void {
    this.profilingEnabled = enabled;
    if (enabled) {
      this.profiles.clear();
      for (const sys of this.systems) {
        this.profiles.set(sys.name, {
          name: sys.name,
          lastMs: 0,
          avgMs: 0,
          maxMs: 0,
          samples: 0,
        });
      }
    }
  }

  /**
   * Register a system at the end of the pipeline.
   */
  add(name: string, fn: SystemFn, phase: string = 'default'): void {
    this.systems.push({ name, fn, phase });

    if (this.profilingEnabled) {
      this.profiles.set(name, {
        name,
        lastMs: 0,
        avgMs: 0,
        maxMs: 0,
        samples: 0,
      });
    }
  }

  /**
   * Insert a system at a specific index.
   */
  insertAt(index: number, name: string, fn: SystemFn, phase: string = 'default'): void {
    this.systems.splice(index, 0, { name, fn, phase });
  }

  /**
   * Remove a system by name.
   */
  remove(name: string): boolean {
    const idx = this.systems.findIndex((s) => s.name === name);
    if (idx >= 0) {
      this.systems.splice(idx, 1);
      this.profiles.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Run all registered systems in order.
   */
  update(world: GameWorld, dt: number): void {
    if (this.profilingEnabled) {
      this.updateWithProfiling(world, dt);
    } else {
      this.updateFast(world, dt);
    }
  }

  /**
   * Get profiling data for all systems.
   * Returns empty array if profiling is disabled.
   */
  getProfiles(): SystemProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get total system count.
   */
  get count(): number {
    return this.systems.length;
  }

  /**
   * Get system names in execution order.
   */
  getSystemNames(): string[] {
    return this.systems.map((s) => s.name);
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private updateFast(world: GameWorld, dt: number): void {
    for (let i = 0, len = this.systems.length; i < len; i++) {
      this.systems[i].fn(world, dt);
    }
  }

  private updateWithProfiling(world: GameWorld, dt: number): void {
    for (let i = 0, len = this.systems.length; i < len; i++) {
      const sys = this.systems[i];
      const profile = this.profiles.get(sys.name);

      const t0 = performance.now();
      sys.fn(world, dt);
      const elapsed = performance.now() - t0;

      if (profile) {
        profile.lastMs = elapsed;
        profile.maxMs = Math.max(profile.maxMs, elapsed);
        profile.samples++;
        // Exponential moving average
        const alpha = Math.min(1 / profile.samples, 0.1);
        profile.avgMs = profile.avgMs + alpha * (elapsed - profile.avgMs);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Factory: create a pipeline with all game-logic systems
// ---------------------------------------------------------------------------

import { createCommandSystem } from './CommandSystem';
import { createMovementSystem } from './MovementSystem';
import { createGezeligheidSystem } from './GezeligheidSystem';
import { createAbilitySystem } from './AbilitySystem';
import { createHeroSystem } from './HeroSystem';
import { createCombatSystem } from './CombatSystem';
import { createGatherSystem } from './GatherSystem';
import { createProductionSystem } from './ProductionSystem';
import { createBuildSystem } from './BuildSystem';
import { createTechTreeSystem } from './TechTreeSystem';
import { createBureaucracySystem } from './BureaucracySystem';
import { createTertiaryResourceSystem } from './TertiaryResourceSystem';
import { createHavermoutmelkSystem } from './HavermoutmelkSystem';
import { createWorstenbroodjeskraamSystem } from './WorstenbroodjeskraamSystem';
import { createUpgradeBuildingPassivesSystem } from './UpgradeBuildingPassivesSystem';
import { createUndergroundSystem } from './UndergroundSystem';
import { createDiplomacySystem } from './DiplomacySystem';
import { createSeparationSystem } from './SeparationSystem';
import { createPopulationSystem } from './PopulationSystem';
import { createTowerSystem } from './TowerSystem';
import { createHealingSystem } from './HealingSystem';
import { createVlaaiwinkelSystem } from './VlaaiwinkelSystem';
import { createDiplomatiekSalonSystem } from './DiplomatiekSalonSystem';
import { createUnitAbilitySystem } from './UnitAbilitySystem';
import { createDeathSystem } from './DeathSystem';
import { createUpkeepSystem } from './UpkeepSystem';
import { createVisionSystem } from './VisionSystem';
import type { Terrain } from '../world/Terrain';

/**
 * Create the full system pipeline for the PoC.
 *
 * @param terrain - Terrain instance for height queries in MovementSystem
 * @param devMode - Enable per-system profiling
 * @returns Configured SystemPipeline ready to run
 *
 * Note: Input, camera, selection, AI, pathfinding, and render systems
 * are NOT included here -- they depend on renderer/input subsystems
 * that should be added by Game.ts.
 */
export function createGamePipeline(terrain: Terrain, devMode = false): SystemPipeline {
  const pipeline = new SystemPipeline();

  // Phase 2: Player Intent
  pipeline.add('CommandSystem', createCommandSystem(), 'intent');

  // Phase 4: Movement
  pipeline.add('MovementSystem', createMovementSystem(terrain), 'movement');

  // Phase 4.1: Separation (after movement -- nudge overlapping idle units apart)
  pipeline.add('SeparationSystem', createSeparationSystem(), 'movement');

  // Phase 4.5: Gezelligheid (after movement -- bonuses depend on final positions)
  pipeline.add('GezeligheidSystem', createGezeligheidSystem(), 'faction');

  // Phase 4.6: Abilities (after Gezelligheid -- rage multiplies the computed bonuses)
  pipeline.add('AbilitySystem', createAbilitySystem(), 'abilities');

  // Phase 4.65: Hero System (hero abilities, stuns, invincibility, revivals, summons)
  pipeline.add('HeroSystem', createHeroSystem(), 'heroes');

  // Phase 4.66: Unit Ability System (non-hero unit abilities: actives, passives, auras)
  pipeline.add('UnitAbilitySystem', createUnitAbilitySystem(), 'abilities');

  // Phase 4.7: Bureaucracy (Randstad faction -- runs before economy so werkoverleg pauses are applied)
  pipeline.add('BureaucracySystem', createBureaucracySystem(), 'faction');

  // Phase 4.8: Tertiary resources (Kolen, Chocolade, Havermoutmelk -- generated before faction systems that consume them)
  pipeline.add('TertiaryResourceSystem', createTertiaryResourceSystem(), 'faction');

  // Phase 4.805: Havermoutmelk buffs (Randstad faction -- ticks Sprint Mode + Deadline Crunch buff timers)
  pipeline.add('HavermoutmelkSystem', createHavermoutmelkSystem(), 'faction');

  // Phase 4.806: Worstenbroodjeskraam (Brabant TertiaryResource — passive Gez flux + heal aura + Trakteerronde click)
  pipeline.add('WorstenbroodjeskraamSystem', createWorstenbroodjeskraamSystem(), 'faction');

  // Phase 4.807: UpgradeBuilding passives — caches counts/positions per factie, ticks Brabant Gez bonus
  pipeline.add('UpgradeBuildingPassivesSystem', createUpgradeBuildingPassivesSystem(), 'faction');

  // Phase 4.81: Underground tunnels (Limburgers faction -- needs Kolen from TertiaryResourceSystem)
  pipeline.add('UndergroundSystem', createUndergroundSystem(), 'faction');

  // Phase 4.82: Diplomacy (Belgen faction -- needs Chocolade from TertiaryResourceSystem)
  pipeline.add('DiplomacySystem', createDiplomacySystem(), 'faction');

  // Phase 5: Combat & Economy
  pipeline.add('CombatSystem', createCombatSystem(), 'combat');
  pipeline.add('HealingSystem', createHealingSystem(), 'combat');
  pipeline.add('VlaaiwinkelSystem', createVlaaiwinkelSystem(), 'combat');
  pipeline.add('TowerSystem', createTowerSystem(), 'combat');
  // Phase 4.83 placement (logical, but lives near other faction systems):
  pipeline.add('DiplomatiekSalonSystem', createDiplomatiekSalonSystem(), 'faction');
  pipeline.add('GatherSystem', createGatherSystem(), 'economy');
  pipeline.add('ProductionSystem', createProductionSystem(), 'economy');
  pipeline.add('BuildSystem', createBuildSystem(), 'economy');
  pipeline.add('TechTreeSystem', createTechTreeSystem(), 'economy');
  pipeline.add('UpkeepSystem', createUpkeepSystem(), 'economy');

  // Phase 5.5: Population (before cleanup -- must read building data before DeathSystem removes entities)
  pipeline.add('PopulationSystem', createPopulationSystem(), 'economy');

  // Phase 6: Cleanup
  pipeline.add('DeathSystem', createDeathSystem(), 'cleanup');

  // Phase 7: Presentation (vision only -- render sync is external)
  pipeline.add('VisionSystem', createVisionSystem(), 'presentation');

  if (devMode) {
    pipeline.setProfiling(true);
  }

  return pipeline;
}
