/**
 * Game-new-match-cleanup.test.ts — "new game starts on top of the previous match".
 *
 * Confirmed bug family (2026-10-16):
 *  1. Game.init() (skirmish) never called cleanup(); only initMission() did.
 *     Menu → skirmish kept old world/units/meshes and doubled HUD key handlers
 *     (one keypress → two trainings).
 *  2. main.ts only ran game.init() when !gameInitialized, and that flag was only
 *     reset by the pause-menu button. Mission victory/defeat → campaign → menu →
 *     skirmish skipped setup entirely and the old mission kept running.
 *  3. resetHeroTracking() was never called → a hero alive at match end stayed
 *     "active" and could not be trained next match ("is al in het spel!").
 *  4. PopulationSystem's processed-eid set survived world resets (see
 *     PopulationSystem-reset.test.ts for the behavioral test).
 *  5. init() appended a new MapTunnelSystem every time without removing the
 *     old one → stacked teleports from previous maps.
 *  6. Gold mine / tree resource meshes were never cleared → ghost mines (see
 *     PropRenderer-clear-resource-props.test.ts for the behavioral test).
 *
 * Game.ts / main.ts need WebGL + a full DOM to instantiate, so the wiring is
 * locked at source level (same approach as Game-getBuildingLabel test); the
 * extracted pieces are tested behaviorally in their own files.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isHeroActive, markHeroActive, resetHeroTracking } from '../src/entities/heroFactory';
import { FactionId } from '../src/types/index';

const gameSource = readFileSync(resolve(__dirname, '..', 'src', 'core', 'Game.ts'), 'utf-8');
const mainSource = readFileSync(resolve(__dirname, '..', 'src', 'main.ts'), 'utf-8');

function extractMethod(source: string, name: string): string {
  const re = new RegExp(`\\n\\s*(?:private |public |protected )?(?:async )?${name}\\s*\\(`);
  const match = re.exec(source);
  if (!match) throw new Error(`method ${name} definition not found in source`);
  // Skip the parameter list (it may contain default values but no braces).
  const closeParen = source.indexOf(')', source.indexOf('(', match.index));
  const openBrace = source.indexOf('{', closeParen);
  let depth = 0;
  for (let i = openBrace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(openBrace, i + 1);
    }
  }
  throw new Error(`unbalanced braces for ${name}`);
}

/** Strip line comments so commented-out calls don't satisfy the contract. */
function code(src: string): string {
  return src.replace(/\/\/.*$/gm, '');
}

describe('Game.init — resets the previous match first', () => {
  it('calls this.cleanup() before generating the new map', () => {
    const body = code(extractMethod(gameSource, 'init'));
    const cleanupIdx = body.indexOf('this.cleanup()');
    const mapIdx = body.indexOf('generateMap(');
    expect(cleanupIdx, 'init() must call this.cleanup()').toBeGreaterThanOrEqual(0);
    expect(cleanupIdx).toBeLessThan(mapIdx);
  });

  it('initMission still calls cleanup()', () => {
    expect(code(extractMethod(gameSource, 'initMission'))).toContain('this.cleanup()');
  });
});

describe('Game.cleanup — resets per-match state that outlives the ECS world', () => {
  const body = code(extractMethod(gameSource, 'cleanup'));

  it('resets hero tracking', () => {
    expect(body).toMatch(/resetHeroTracking\(\)/);
  });

  it('resets the PopulationSystem processed set', () => {
    expect(body).toMatch(/resetPopulationSystem\(\)/);
  });

  it('removes the map tunnel system from the pipeline', () => {
    expect(body).toMatch(/this\.pipeline\.remove\(\s*'MapTunnelSystem'\s*\)/);
  });

  it('clears gold mine / tree resource props', () => {
    expect(body).toMatch(/this\.propRenderer\.clearResourceProps\(\)/);
  });
});

describe('heroFactory.resetHeroTracking', () => {
  beforeEach(() => resetHeroTracking());

  it('makes a hero trainable again after reset', () => {
    markHeroActive(FactionId.Brabanders, 0);
    expect(isHeroActive(FactionId.Brabanders, 0)).toBe(true);
    resetHeroTracking();
    expect(isHeroActive(FactionId.Brabanders, 0)).toBe(false);
  });
});

describe('main.ts — gameInitialized is reset on every return to the menu', () => {
  it('resets gameInitialized from a state-machine onChange listener on MENU', () => {
    const src = code(mainSource);
    const m = /stateMachine\.onChange\(([\s\S]*?)\n\}\);/.exec(src);
    expect(m, 'expected a stateMachine.onChange listener').not.toBeNull();
    const listener = m![1];
    expect(listener).toContain('GameStateId.MENU');
    expect(listener).toMatch(/gameInitialized\s*=\s*false/);
  });
});
