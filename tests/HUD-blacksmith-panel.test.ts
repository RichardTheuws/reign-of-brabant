// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@audio/AudioManager', () => ({
  audioManager: { playSound: vi.fn() },
}));

import { HUD } from '@ui/HUD';

const SKELETON = `
  <div id="alert-container"></div>
  <div id="selection-panel" hidden></div>
  <div id="unit-single" hidden></div>
  <div id="unit-multi" hidden></div>
  <div id="building-panel" hidden></div>
  <div id="game-over" hidden></div>
  <div id="game-over-title"></div>
  <div id="game-over-subtitle"></div>
  <canvas id="minimap-canvas" width="200" height="200"></canvas>
  <div id="res-gold"></div><div id="res-wood"></div>
  <div id="res-pop"></div><div id="res-pop-max"></div>
  <div class="resource-item" data-resource="population"></div>
  <div id="fps-value"></div><div id="fps-counter"></div>
  <div id="res-gezelligheid"></div>
  <button id="rage-btn"></button>
  <div id="rage-cooldown"></div><div id="rage-duration"></div>
  <div id="unit-portrait"></div><div id="unit-level"></div>
  <div id="unit-name"></div><div id="unit-hp-bar"></div>
  <div id="unit-hp-text"></div><div id="stat-atk"></div>
  <div id="stat-arm"></div><div id="stat-spd"></div>
  <div id="unit-status"></div>
  <div id="cmd-blacksmith" hidden></div>
`;

const ALL_ELIGIBLE = [
  { id: 0, name: 'Zwaardvechten I', description: 'Inf +2 atk', costGold: 100,
    canAfford: true, canResearch: true, isResearched: false },
  { id: 2, name: 'Boogschieten I',  description: 'Rng +2 atk', costGold: 100,
    canAfford: true, canResearch: true, isResearched: false },
];

describe('HUD blacksmith panel — click survives per-frame rebuild', () => {
  let hud: HUD;
  let onResearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = SKELETON;
    hud = new HUD();
    onResearch = vi.fn();
  });

  afterEach(() => {
    hud.destroy();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('fires onResearch when a button is clicked after a fresh render', () => {
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, onResearch);
    const panel = document.getElementById('cmd-blacksmith')!;
    const btn = panel.querySelector('button') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(onResearch).toHaveBeenCalledWith(0);
  });

  it('still fires onResearch on click after the panel is re-rendered (per-frame call)', () => {
    // Simulate Game.ts:2981 calling showBlacksmithResearchUI every frame.
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, onResearch);
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, onResearch);
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, onResearch);

    const panel = document.getElementById('cmd-blacksmith')!;
    const btn = panel.querySelector('button[data-research-id="2"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(onResearch).toHaveBeenCalledWith(2);
  });

  it('uses the most recent onResearch callback after re-render', () => {
    const oldCb = vi.fn();
    const newCb = vi.fn();
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, oldCb);
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, newCb);

    const btn = document.querySelector(
      '#cmd-blacksmith button[data-research-id="0"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(oldCb).not.toHaveBeenCalled();
    expect(newCb).toHaveBeenCalledWith(0);
  });

  it('disabled button (researchProgress active) does not fire onResearch', () => {
    hud.showBlacksmithPanel(
      ALL_ELIGIBLE,
      { name: 'Zwaardvechten I', progress: 0.4, remaining: 18 },
      onResearch,
    );
    const btn = document.querySelector(
      '#cmd-blacksmith button[data-research-id="0"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    btn.click();
    expect(onResearch).not.toHaveBeenCalled();
  });

  it('locked-research buttons render with is-locked class + disabled (no longer hidden)', () => {
    const upgrades = [
      { id: 0, name: 'A', description: '', costGold: 100,
        canAfford: true, canResearch: true, isResearched: false },
      { id: 1, name: 'B', description: '', costGold: 100,
        canAfford: true, canResearch: false, isResearched: false,
        prereqText: 'Vereist Zwaardvechten II' },
    ];
    hud.showBlacksmithPanel(upgrades, null, onResearch);
    const all = document.querySelectorAll<HTMLButtonElement>('#cmd-blacksmith button[data-research-id]');
    expect(all.length).toBe(2);
    const lockedBtn = document.querySelector(
      '#cmd-blacksmith button[data-research-id="1"]',
    ) as HTMLButtonElement;
    expect(lockedBtn.disabled).toBe(true);
    expect(lockedBtn.classList.contains('is-locked')).toBe(true);
    expect(lockedBtn.title).toContain('Vereist Zwaardvechten II');
    // Click should still be ignored
    lockedBtn.click();
    expect(onResearch).not.toHaveBeenCalled();
  });

  it('researched button has is-researched class and OK cost-text', () => {
    const upgrades = [
      { id: 0, name: 'A', description: '', costGold: 100,
        canAfford: true, canResearch: false, isResearched: true },
    ];
    hud.showBlacksmithPanel(upgrades, null, onResearch);
    const btn = document.querySelector(
      '#cmd-blacksmith button[data-research-id="0"]',
    ) as HTMLButtonElement;
    expect(btn.classList.contains('is-researched')).toBe(true);
    expect(btn.querySelector('.bcard-action-cost')?.textContent).toBe('OK');
  });

  it('does NOT accumulate listeners across re-renders (single fire per click)', () => {
    for (let i = 0; i < 10; i++) {
      hud.showBlacksmithPanel(ALL_ELIGIBLE, null, onResearch);
    }
    const btn = document.querySelector(
      '#cmd-blacksmith button[data-research-id="0"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(onResearch).toHaveBeenCalledTimes(1);
  });

  it('skips DOM rebuild when state is unchanged (button instance is preserved)', () => {
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, onResearch);
    const firstBtn = document.querySelector(
      '#cmd-blacksmith button[data-research-id="0"]',
    ) as HTMLButtonElement;
    // Per-frame call with identical state.
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, onResearch);
    const secondBtn = document.querySelector(
      '#cmd-blacksmith button[data-research-id="0"]',
    ) as HTMLButtonElement;
    expect(secondBtn).toBe(firstBtn); // same DOM node — no rebuild
  });

  it('rebuilds when state changes (canAfford flip toggles disabled)', () => {
    hud.showBlacksmithPanel(ALL_ELIGIBLE, null, onResearch);
    const cantAfford = ALL_ELIGIBLE.map(u => ({ ...u, canAfford: false }));
    hud.showBlacksmithPanel(cantAfford, null, onResearch);
    const btn = document.querySelector(
      '#cmd-blacksmith button[data-research-id="0"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('progress bar fills inline without DOM rebuild between frames', () => {
    hud.showBlacksmithPanel(
      ALL_ELIGIBLE,
      { name: 'Zwaardvechten I', progress: 0.1, remaining: 27 },
      onResearch,
    );
    const firstBar = document.querySelector('#cmd-blacksmith .research-bar') as HTMLElement;
    expect(firstBar.style.width).toBe('10%');
    hud.showBlacksmithPanel(
      ALL_ELIGIBLE,
      { name: 'Zwaardvechten I', progress: 0.5, remaining: 15 },
      onResearch,
    );
    const secondBar = document.querySelector('#cmd-blacksmith .research-bar') as HTMLElement;
    expect(secondBar).toBe(firstBar); // same node, just inline-updated
    expect(secondBar.style.width).toBe('50%');
  });
});
