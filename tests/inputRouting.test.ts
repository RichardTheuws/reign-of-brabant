// @vitest-environment jsdom
/**
 * inputRouting.test.ts — locks the shared key-routing rules used by
 * main.ts (camera + Escape), Game.ts (gameplay keys) and HUD.ts (panel
 * hotkeys):
 *   - typing in a text field never triggers game actions
 *   - a visible panel button with the pressed hotkey claims the key
 *     (no camera pan / no attack-move); hidden panels don't
 *   - Escape does exactly one thing: close overlay > cancel mode > pause
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  isTypingTarget,
  hotkeyCharFromCode,
  findCommandPanelButton,
  findBuildingCardButton,
  panelClaimsKey,
  routeEscape,
} from '../src/ui/inputRouting';

describe('isTypingTarget', () => {
  it('flags INPUT, TEXTAREA and SELECT', () => {
    for (const tag of ['input', 'textarea', 'select']) {
      expect(isTypingTarget(document.createElement(tag))).toBe(true);
    }
  });

  it('flags contenteditable elements and their descendants', () => {
    const host = document.createElement('div');
    host.setAttribute('contenteditable', 'true');
    const child = document.createElement('span');
    host.appendChild(child);
    document.body.appendChild(host);
    expect(isTypingTarget(host)).toBe(true);
    expect(isTypingTarget(child)).toBe(true);
    host.remove();
  });

  it('does not flag contenteditable="false", buttons, body, window or null', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'false');
    expect(isTypingTarget(div)).toBe(false);
    expect(isTypingTarget(document.createElement('button'))).toBe(false);
    expect(isTypingTarget(document.body)).toBe(false);
    expect(isTypingTarget(window)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('hotkeyCharFromCode', () => {
  it('maps letter codes and rejects others', () => {
    expect(hotkeyCharFromCode('KeyA')).toBe('A');
    expect(hotkeyCharFromCode('KeyS')).toBe('S');
    expect(hotkeyCharFromCode('Digit1')).toBeNull();
    expect(hotkeyCharFromCode('ArrowLeft')).toBeNull();
    expect(hotkeyCharFromCode('Escape')).toBeNull();
  });
});

describe('panel hotkey claim', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="building-card" hidden>
        <button class="bcard-action-btn" data-hotkey="A" data-action="train-heavy"></button>
      </div>
      <div class="command-panel" id="cmd-unit" hidden>
        <button class="cmd-btn" data-action="attack" data-hotkey="W"></button>
      </div>
      <div class="command-panel" id="cmd-worker" hidden>
        <button class="cmd-btn" data-action="move" data-hotkey="W"></button>
        <button class="cmd-btn" data-action="gather-nearest-gold" data-hotkey="A"></button>
        <button class="cmd-btn" data-action="gather-nearest-wood" data-hotkey="S"></button>
      </div>`;
  });

  const show = (id: string) => { document.getElementById(id)!.hidden = false; };

  it('nothing visible: WASD stays free for the camera / attack-move', () => {
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) {
      expect(panelClaimsKey(code)).toBe(false);
    }
  });

  it('worker panel visible: A/S resolve to gather buttons and claim the key', () => {
    show('cmd-worker');
    expect(findCommandPanelButton('A')?.dataset.action).toBe('gather-nearest-gold');
    expect(findCommandPanelButton('S')?.dataset.action).toBe('gather-nearest-wood');
    expect(panelClaimsKey('KeyA')).toBe(true);
    expect(panelClaimsKey('KeyS')).toBe(true);
    expect(panelClaimsKey('KeyD')).toBe(false);
  });

  it('a hidden button inside a visible panel does not claim', () => {
    show('cmd-worker');
    (document.querySelector('[data-action="gather-nearest-gold"]') as HTMLElement).hidden = true;
    expect(panelClaimsKey('KeyA')).toBe(false);
  });

  it('building card visible: production hotkey claims, but is not a command-panel button', () => {
    show('building-card');
    expect(findBuildingCardButton('A')?.dataset.action).toBe('train-heavy');
    expect(findCommandPanelButton('A')).toBeNull();
    expect(panelClaimsKey('KeyA')).toBe(true);
  });

  it('pointer-only move/attack buttons (W) do not claim: W keeps panning the camera', () => {
    show('cmd-unit');
    expect(findCommandPanelButton('W')).toBeNull();
    expect(panelClaimsKey('KeyW')).toBe(false);
    show('cmd-worker');
    expect(panelClaimsKey('KeyW')).toBe(false);
    expect(panelClaimsKey('KeyA')).toBe(true);
  });

  it('disabled buttons do not claim (unaffordable production / locked build)', () => {
    show('building-card');
    (document.querySelector('.bcard-action-btn') as HTMLButtonElement).disabled = true;
    expect(panelClaimsKey('KeyA')).toBe(false);
    show('cmd-worker');
    (document.querySelector('[data-action="gather-nearest-wood"]') as HTMLButtonElement).disabled = true;
    expect(panelClaimsKey('KeyS')).toBe(false);
  });

  it('non-letter codes are never claimed', () => {
    show('cmd-worker');
    expect(panelClaimsKey('ArrowLeft')).toBe(false);
  });
});

describe('routeEscape', () => {
  it('closes an overlay before anything else', () => {
    expect(routeEscape({ playing: true, overlayOpen: true, modeActive: true })).toBe('close-overlay');
  });
  it('cancels an active mode instead of pausing', () => {
    expect(routeEscape({ playing: true, overlayOpen: false, modeActive: true })).toBe('cancel-mode');
  });
  it('toggles pause only when no overlay and no mode', () => {
    expect(routeEscape({ playing: true, overlayOpen: false, modeActive: false })).toBe('toggle-pause');
  });
  it('ignores Escape outside of gameplay', () => {
    expect(routeEscape({ playing: false, overlayOpen: false, modeActive: false })).toBe('ignore');
  });
});
