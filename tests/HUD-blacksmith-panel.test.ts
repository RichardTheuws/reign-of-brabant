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

  it('hidden locked-research buttons (canResearch=false) do not appear', () => {
    const upgrades = [
      { id: 0, name: 'A', description: '', costGold: 100,
        canAfford: true, canResearch: true, isResearched: false },
      { id: 1, name: 'B', description: '', costGold: 100,
        canAfford: true, canResearch: false, isResearched: false },
    ];
    hud.showBlacksmithPanel(upgrades, null, onResearch);
    const visible = document.querySelectorAll(
      '#cmd-blacksmith button:not([hidden])',
    );
    expect(visible.length).toBe(1);
    expect((visible[0] as HTMLElement).dataset.researchId).toBe('0');
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
});
