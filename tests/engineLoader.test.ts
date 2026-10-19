/**
 * engineLoader.test.ts -- lazy-load glue for the /play/ engine chunk.
 *
 * The menu shell (main.ts) imports the engine (three.js + Game) with a
 * dynamic import(). These tests pin down the contract:
 * - prefetch and start share one import + one instantiation;
 * - a failed import is not cached: the next start retries;
 * - at match start the loading screen shows a label while the chunk loads;
 * - a load failure shows a message and returns to the menu, and never runs
 *   the start callback (so LOADING cannot continue into PLAYING);
 * - errors from the start callback itself (Game.init) propagate unchanged;
 * - a retry after a failed chunk fetch imports a cache-busted URL, because
 *   browsers keep the failed module in their module map.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createEngineLoader,
  failedImportUrl,
  retryableImport,
  startWithEngine,
  EngineLoadError,
  ENGINE_LOAD_ERROR_MESSAGE,
  ENGINE_LOADING_LABEL,
  type StartWithEngineUi,
} from '../src/core/engineLoader';

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function fakeUi(): StartWithEngineUi & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    showLoading: (label) => calls.push(`loading:${label}`),
    showError: (message) => calls.push(`error:${message}`),
    clearError: () => calls.push('clear'),
    backToMenu: () => calls.push('menu'),
  };
}

describe('createEngineLoader', () => {
  it('imports and instantiates once for concurrent prefetch + load', async () => {
    const d = deferred<{ id: number }>();
    const importer = vi.fn(() => d.promise);
    const loader = createEngineLoader(importer);

    expect(loader.current).toBeNull();
    loader.prefetch();
    const a = loader.load();
    const b = loader.load();
    expect(importer).toHaveBeenCalledTimes(1);

    d.resolve({ id: 1 });
    const [ra, rb] = await Promise.all([a, b]);
    expect(ra).toBe(rb);
    expect(loader.current).toBe(ra);

    await loader.load();
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed import: the next load retries', async () => {
    const engine = { id: 2 };
    const importer = vi
      .fn<() => Promise<typeof engine>>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'))
      .mockResolvedValueOnce(engine);
    const loader = createEngineLoader(importer);

    await expect(loader.load()).rejects.toThrow('Failed to fetch');
    expect(loader.current).toBeNull();
    await expect(loader.load()).resolves.toBe(engine);
    expect(importer).toHaveBeenCalledTimes(2);
    expect(loader.current).toBe(engine);
  });

  it('prefetch failure is swallowed (logged) and a later start still loads', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = { id: 3 };
    const importer = vi
      .fn<() => Promise<typeof engine>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(engine);
    const loader = createEngineLoader(importer);

    loader.prefetch();
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    await expect(loader.load()).resolves.toBe(engine);
    warn.mockRestore();
  });
});

describe('startWithEngine', () => {
  it('shows the loading label while the engine chunk is still loading, then runs fn', async () => {
    const engine = { game: 'g' };
    const loader = createEngineLoader(async () => engine);
    const ui = fakeUi();
    const fn = vi.fn(async (e: typeof engine) => e.game);

    await expect(startWithEngine(loader, ui, fn)).resolves.toBe('g');
    expect(fn).toHaveBeenCalledWith(engine);
    expect(ui.calls).toEqual(['clear', `loading:${ENGINE_LOADING_LABEL}`]);
  });

  it('skips the loading label when the engine was already prefetched', async () => {
    const loader = createEngineLoader(async () => ({ game: 'g' }));
    await loader.load();
    const ui = fakeUi();

    await startWithEngine(loader, ui, async () => undefined);
    expect(ui.calls).toEqual(['clear']);
  });

  it('on a network error: message, back to menu, EngineLoadError, fn never runs', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new TypeError('Failed to fetch dynamically imported module: /assets/engineRuntime-x.js');
    const loader = createEngineLoader<{ game: string }>(() => Promise.reject(cause));
    const ui = fakeUi();
    const fn = vi.fn(async () => undefined);

    const p = startWithEngine(loader, ui, fn);
    await expect(p).rejects.toBeInstanceOf(EngineLoadError);
    await expect(p).rejects.toMatchObject({ cause, message: ENGINE_LOAD_ERROR_MESSAGE });
    expect(fn).not.toHaveBeenCalled();
    expect(ui.calls).toEqual([
      'clear',
      `loading:${ENGINE_LOADING_LABEL}`,
      `error:${ENGINE_LOAD_ERROR_MESSAGE}`,
      'menu',
    ]);
    err.mockRestore();
  });

  it('a retry after a failed load clears the message and starts the match', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const engine = { game: 'g' };
    const importer = vi
      .fn<() => Promise<typeof engine>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(engine);
    const loader = createEngineLoader(importer);
    const ui = fakeUi();
    const fn = vi.fn(async () => 'started');

    await expect(startWithEngine(loader, ui, fn)).rejects.toBeInstanceOf(EngineLoadError);
    ui.calls.length = 0;
    await expect(startWithEngine(loader, ui, fn)).resolves.toBe('started');
    expect(ui.calls[0]).toBe('clear');
    expect(ui.calls).not.toContain('menu');
    expect(fn).toHaveBeenCalledTimes(1);
    err.mockRestore();
  });

  it('errors thrown by fn (e.g. Game.init) propagate as-is, without menu fallback', async () => {
    const loader = createEngineLoader(async () => ({ game: 'g' }));
    const ui = fakeUi();
    const boom = new Error('init failed');

    await expect(startWithEngine(loader, ui, async () => { throw boom; })).rejects.toBe(boom);
    expect(ui.calls).not.toContain('menu');
    expect(ui.calls.some((c) => c.startsWith('error:'))).toBe(false);
  });

  it('error message contains no emoji or pictographic symbols', () => {
    expect(ENGINE_LOAD_ERROR_MESSAGE).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(ENGINE_LOADING_LABEL).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('failedImportUrl', () => {
  it('extracts the chunk URL from Chrome and Firefox messages, without query', () => {
    expect(failedImportUrl(new TypeError('Failed to fetch dynamically imported module: https://reign-of-brabant.nl/assets/engineRuntime-DEPlZ3PN.js')))
      .toBe('https://reign-of-brabant.nl/assets/engineRuntime-DEPlZ3PN.js');
    expect(failedImportUrl(new TypeError('error loading dynamically imported module: http://localhost:5292/assets/engineRuntime-x.js?retry=2')))
      .toBe('http://localhost:5292/assets/engineRuntime-x.js');
    expect(failedImportUrl(new TypeError('Failed to fetch dynamically imported module: http://localhost:5173/src/engineRuntime.ts')))
      .toBe('http://localhost:5173/src/engineRuntime.ts');
  });

  it('returns null when the message has no URL (Safari)', () => {
    expect(failedImportUrl(new TypeError('Importing a module script failed.'))).toBeNull();
    expect(failedImportUrl('nope')).toBeNull();
  });
});

describe('retryableImport', () => {
  const URL_ = 'https://reign-of-brabant.nl/assets/engineRuntime-abc.js';

  it('first attempt uses the static import; success never touches the URL path', async () => {
    const mod = { ok: true };
    const importer = vi.fn(async () => mod);
    const importUrl = vi.fn(async () => mod);
    const load = retryableImport(importer, importUrl);
    await expect(load()).resolves.toBe(mod);
    expect(importer).toHaveBeenCalledTimes(1);
    expect(importUrl).not.toHaveBeenCalled();
  });

  it('after a network failure the retry imports a cache-busted chunk URL', async () => {
    const mod = { ok: true };
    const importer = vi.fn(async () => { throw new TypeError(`Failed to fetch dynamically imported module: ${URL_}`); });
    const importUrl = vi
      .fn<(url: string) => Promise<typeof mod>>()
      .mockRejectedValueOnce(new TypeError(`Failed to fetch dynamically imported module: ${URL_}?retry=1`))
      .mockResolvedValueOnce(mod);
    const load = retryableImport(importer, importUrl);

    await expect(load()).rejects.toThrow('Failed to fetch');
    await expect(load()).rejects.toThrow('Failed to fetch');
    await expect(load()).resolves.toBe(mod);
    expect(importer).toHaveBeenCalledTimes(1);
    expect(importUrl.mock.calls.map((c) => c[0])).toEqual([`${URL_}?retry=1`, `${URL_}?retry=2`]);
  });

  it('without a URL in the error it retries the plain import', async () => {
    const mod = { ok: true };
    const importer = vi
      .fn<() => Promise<typeof mod>>()
      .mockRejectedValueOnce(new TypeError('Importing a module script failed.'))
      .mockResolvedValueOnce(mod);
    const importUrl = vi.fn(async () => mod);
    const load = retryableImport(importer, importUrl);

    await expect(load()).rejects.toThrow();
    await expect(load()).resolves.toBe(mod);
    expect(importUrl).not.toHaveBeenCalled();
  });

  it('composes with the loader: start after a failed prefetch refetches', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = { ok: true };
    const importer = vi.fn(async (): Promise<typeof mod> => { throw new TypeError(`Failed to fetch dynamically imported module: ${URL_}`); });
    const importUrl = vi.fn(async () => mod);
    const loader = createEngineLoader(retryableImport(importer, importUrl));

    loader.prefetch();
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    await expect(loader.load()).resolves.toBe(mod);
    expect(importUrl).toHaveBeenCalledWith(`${URL_}?retry=1`);
    warn.mockRestore();
  });
});
