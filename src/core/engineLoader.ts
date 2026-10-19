/**
 * engineLoader.ts -- lazy-load glue between the menu shell (main.ts) and the
 * engine chunk (engineRuntime.ts).
 *
 * - One shared in-flight promise: the idle prefetch and a "start" click never
 *   import or instantiate the engine twice.
 * - A failed load (network error on the dynamic import, or the engine factory
 *   throwing) clears the cached promise, so the next attempt tries again.
 * - `startWithEngine` is the start-of-match wrapper: it shows a loading label
 *   while the chunk is still coming in and, when loading fails, shows a
 *   message and sends the player back to the main menu.
 */

export const ENGINE_LOADING_LABEL = 'Game-engine laden...';
export const ENGINE_LOAD_ERROR_MESSAGE =
  'De game kon niet worden geladen. Controleer je internetverbinding en probeer het opnieuw. Lukt het dan nog niet, herlaad de pagina.';

export interface EngineLoader<T> {
  /** Import + instantiate (once). Rejects when that fails; a later call retries. */
  load(): Promise<T>;
  /** Fire-and-forget load; failures are only logged (a start retries). */
  prefetch(): void;
  /** The engine instance, or null while it is not loaded yet. */
  readonly current: T | null;
}

export function createEngineLoader<T>(importer: () => Promise<T>): EngineLoader<T> {
  let pending: Promise<T> | null = null;
  let current: T | null = null;

  const load = (): Promise<T> => {
    if (!pending) {
      pending = importer().then(
        (engine) => {
          current = engine;
          return engine;
        },
        (err: unknown) => {
          pending = null;
          throw err;
        },
      );
    }
    return pending;
  };

  return {
    load,
    prefetch(): void {
      load().catch((err) => console.warn('[engine] prefetch failed, retrying on start', err));
    },
    get current() {
      return current;
    },
  };
}

/** Module URL from a failed dynamic import's error message, without query. */
export function failedImportUrl(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : String(err);
  // Chrome: "Failed to fetch dynamically imported module: <url>"
  // Firefox: "error loading dynamically imported module: <url>"
  const m = /\b(https?:\/\/[^\s'"]+?\.[cm]?[jt]s)(?:\?[^\s'"]*)?(?=$|[\s'"])/.exec(msg);
  return m ? m[1] : null;
}

/**
 * Wrap a static `() => import('./x')` so a retry after a network failure
 * actually refetches. Browsers keep a failed module fetch in their module
 * map, so a second `import()` of the same URL fails again without touching
 * the network. After a failure whose error names the chunk URL, the next
 * attempt imports that URL with a `?retry=N` query instead (the chunk's own
 * static imports keep their URLs, so shared modules stay single instances).
 * When the URL is unknown (e.g. Safari's message), the plain import is
 * retried and the on-screen message tells the player to reload.
 */
export function retryableImport<T>(
  importer: () => Promise<T>,
  importUrl: (url: string) => Promise<T> = (url) => import(/* @vite-ignore */ url) as Promise<T>,
): () => Promise<T> {
  let failedUrl: string | null = null;
  let attempt = 0;
  return async () => {
    try {
      return failedUrl ? await importUrl(`${failedUrl}?retry=${++attempt}`) : await importer();
    } catch (err) {
      failedUrl = failedImportUrl(err) ?? failedUrl;
      throw err;
    }
  };
}

/** Thrown by startWithEngine when the engine itself could not be loaded. */
export class EngineLoadError extends Error {
  constructor(cause: unknown) {
    super(ENGINE_LOAD_ERROR_MESSAGE, { cause });
    this.name = 'EngineLoadError';
  }
}

export interface StartWithEngineUi {
  /** Loading-screen label while the engine chunk is still downloading. */
  showLoading(label: string): void;
  /** Show the load-failure message (persists on the main menu). */
  showError(message: string): void;
  /** Clear a previous failure message. */
  clearError(): void;
  /** Return to the main menu. */
  backToMenu(): void;
}

/**
 * Await the engine, then run `fn` with it. Only an engine *load* failure is
 * turned into "message + back to menu" (and rethrown as EngineLoadError so
 * the loading state does not continue into PLAYING). Errors thrown by `fn`
 * (e.g. Game.init) propagate unchanged, exactly as before the split.
 */
export async function startWithEngine<T, R>(
  loader: EngineLoader<T>,
  ui: StartWithEngineUi,
  fn: (engine: T) => Promise<R> | R,
): Promise<R> {
  ui.clearError();
  let engine = loader.current;
  if (!engine) {
    ui.showLoading(ENGINE_LOADING_LABEL);
    try {
      engine = await loader.load();
    } catch (err) {
      console.error('[engine] failed to load the game engine', err);
      ui.showError(ENGINE_LOAD_ERROR_MESSAGE);
      ui.backToMenu();
      throw new EngineLoadError(err);
    }
  }
  return fn(engine);
}
