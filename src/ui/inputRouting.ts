/**
 * Reign of Brabant -- Input routing helpers
 *
 * Small, DOM-light helpers shared by main.ts (camera keys + Escape/pause),
 * Game.ts (gameplay keys) and HUD.ts (command-panel hotkeys) so every key
 * handler applies the same rules:
 *
 *  1. Keys typed into a text field (INPUT / TEXTAREA / SELECT /
 *     contenteditable) never trigger game actions.
 *  2. When the visible command panel (or building card) has a button with
 *     the pressed hotkey, that panel hotkey wins: the key must not also pan
 *     the camera or trigger attack-move. Otherwise legacy behaviour stays
 *     (WASD camera pan, A = attack-move).
 *  3. Escape closes an open overlay first, then cancels an active input mode
 *     (build / rally / attack-move), and only toggles pause when neither
 *     applies.
 */

/** True when the event target is a text-entry element (or inside one). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).tagName !== 'string') return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  // jsdom (and detached nodes) don't compute isContentEditable — check the attribute chain.
  const editable = typeof el.closest === 'function'
    ? el.closest('[contenteditable]')
    : null;
  if (editable) {
    const v = editable.getAttribute('contenteditable');
    return v !== 'false';
  }
  return false;
}

/** 'KeyA' -> 'A'; non-letter codes return null. */
export function hotkeyCharFromCode(code: string): string | null {
  const m = /^Key([A-Z])$/.exec(code);
  return m ? m[1] : null;
}

function isShown(el: Element): boolean {
  return el.closest('[hidden]') === null;
}

/**
 * Command actions that only work via the mouse (right-click to move/attack):
 * Game.handleHUDCommand treats them as no-ops, so their hotkey (W) must not
 * swallow the key — W keeps panning the camera.
 */
const POINTER_ONLY_ACTIONS: ReadonlySet<string> = new Set(['move', 'attack']);

/**
 * Visible `.cmd-btn` in a visible `.command-panel` carrying this hotkey.
 * Building-card buttons are excluded (Game.ts resolves those itself), and
 * so are pointer-only actions (move/attack) whose hotkey does nothing.
 */
export function findCommandPanelButton(
  hotkeyChar: string,
  root: ParentNode = document,
): HTMLButtonElement | null {
  const candidates = root.querySelectorAll<HTMLButtonElement>(
    `.command-panel .cmd-btn[data-hotkey="${hotkeyChar}"]`,
  );
  for (const btn of candidates) {
    if (isShown(btn) && !POINTER_ONLY_ACTIONS.has(btn.dataset.action ?? '')) return btn;
  }
  return null;
}

/** Visible building-card action button carrying this hotkey. */
export function findBuildingCardButton(
  hotkeyChar: string,
  root: ParentNode = document,
): HTMLButtonElement | null {
  const candidates = root.querySelectorAll<HTMLButtonElement>(
    `#building-card .bcard-action-btn[data-hotkey="${hotkeyChar}"]`,
  );
  for (const btn of candidates) {
    if (isShown(btn)) return btn;
  }
  return null;
}

/**
 * True when a visible, actionable panel button (command panel or building
 * card) owns this key code. Such keys must not pan the camera or start
 * attack-move. Disabled buttons (unaffordable production, locked builds)
 * don't claim — Game.ts ignores them too — so the key keeps its default.
 */
export function panelClaimsKey(code: string, root: ParentNode = document): boolean {
  const ch = hotkeyCharFromCode(code);
  if (!ch) return false;
  const cmdBtn = findCommandPanelButton(ch, root);
  if (cmdBtn && !cmdBtn.disabled) return true;
  const cardBtn = findBuildingCardButton(ch, root);
  return cardBtn !== null && !cardBtn.disabled;
}

export type EscapeAction = 'close-overlay' | 'cancel-mode' | 'toggle-pause' | 'ignore';

/** Decide what a single Escape press should do. Exactly one action per press. */
export function routeEscape(state: {
  playing: boolean;
  overlayOpen: boolean;
  modeActive: boolean;
}): EscapeAction {
  if (state.overlayOpen) return 'close-overlay';
  if (!state.playing) return 'ignore';
  if (state.modeActive) return 'cancel-mode';
  return 'toggle-pause';
}
