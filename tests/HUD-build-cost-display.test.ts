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
  <div id="multi-grid"></div>
  <div id="multi-count"></div>
  <div id="building-panel" hidden></div>
  <div id="building-card" hidden></div>
  <div id="bcard-portrait"></div>
  <div id="bcard-name"></div>
  <div id="bcard-faction"></div>
  <div id="bcard-hp-bar"></div>
  <div id="bcard-hp-text"></div>
  <div id="bcard-status"></div>
  <div id="bcard-actions"></div>
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
  <div id="stat-duration"></div><div id="stat-produced"></div>
  <div id="stat-lost"></div><div id="stat-killed"></div>
  <div id="stat-buildings"></div><div id="stat-resources"></div>
  <div id="stat-gold"></div><div id="stat-wood"></div>
  <div id="building-name"></div>
  <div id="building-portrait"></div>
  <div id="building-hp-bar"></div>
  <div id="building-hp-text"></div>
  <div class="queue-progress" hidden></div>
  <div id="queue-label"></div>
  <div id="queue-bar"></div>
  <div id="queue-time"></div>
  <div id="cmd-worker" hidden></div>
  <div id="cmd-unit" hidden>
    <button class="cmd-btn"><span class="btn-icon"></span></button>
  </div>
  <div id="cmd-multi" hidden>
    <button class="cmd-btn"><span class="btn-icon"></span></button>
  </div>
  <div id="cmd-building" hidden>
    <button class="cmd-btn" data-action="train-worker"><span class="btn-icon"></span><span></span></button>
    <button class="cmd-btn" data-action="train-infantry"><span class="btn-icon"></span><span></span></button>
    <button class="cmd-btn" data-action="train-ranged"><span class="btn-icon"></span><span></span></button>
  </div>
  <div id="cmd-hero" hidden>
    <button class="cmd-btn"><span class="btn-icon"></span></button>
  </div>
  <div id="cmd-blacksmith" hidden></div>
`;

describe('HUD build buttons — cost is rendered as .cmd-btn__cost span', () => {
  let hud: HUD;

  beforeEach(() => {
    document.body.innerHTML = SKELETON;
    hud = new HUD();
    hud.init({
      onMinimapClick: vi.fn(),
      onCommand: vi.fn(),
      onPortraitClick: vi.fn(),
      onRetry: vi.fn(),
      onMenu: vi.fn(),
      onQueueCancel: vi.fn(),
    });
  });

  afterEach(() => {
    hud.destroy();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  for (const faction of ['brabant', 'randstad', 'limburg', 'belgen'] as const) {
    it(`renders cost spans for build-faction1 + build-faction2 buttons (${faction})`, () => {
      hud.setFaction(faction);

      const worker = document.getElementById('cmd-worker')!;
      const buttons = Array.from(worker.querySelectorAll<HTMLButtonElement>('button.cmd-btn'));

      const special1Btn = buttons.find((b) => b.dataset.action === 'build-faction1');
      const special2Btn = buttons.find((b) => b.dataset.action === 'build-faction2');

      expect(special1Btn, `build-faction1 button missing for ${faction}`).toBeDefined();
      expect(special2Btn, `build-faction2 button missing for ${faction}`).toBeDefined();

      const cost1 = special1Btn!.querySelector('.cmd-btn__cost');
      const cost2 = special2Btn!.querySelector('.cmd-btn__cost');

      expect(cost1, `Special1 cost span missing for ${faction}`).not.toBeNull();
      expect(cost2, `Special2 cost span missing for ${faction}`).not.toBeNull();

      // FactionSpecial1 = 300g, FactionSpecial2 = 400g per archetypes.ts
      expect(cost1!.textContent).toBe('300g');
      expect(cost2!.textContent).toBe('400g');
    });

    it(`renders cost span for build-barracks button (${faction})`, () => {
      hud.setFaction(faction);

      const worker = document.getElementById('cmd-worker')!;
      const barracksBtn = Array.from(worker.querySelectorAll<HTMLButtonElement>('button.cmd-btn'))
        .find((b) => b.dataset.action === 'build-barracks');

      expect(barracksBtn, `build-barracks missing for ${faction}`).toBeDefined();
      const cost = barracksBtn!.querySelector('.cmd-btn__cost');
      expect(cost, `Barracks cost span missing for ${faction}`).not.toBeNull();
      expect(cost!.textContent).toMatch(/^\d+g(?:\+\d+h)?$/);
    });
  }

  it('build-faction button uses faction-painted barracks portrait img src', () => {
    hud.setFaction('brabant');
    const worker = document.getElementById('cmd-worker')!;
    const barracksBtn = Array.from(worker.querySelectorAll<HTMLButtonElement>('button.cmd-btn'))
      .find((b) => b.dataset.action === 'build-barracks');

    const img = barracksBtn!.querySelector('img');
    expect(img, 'barracks button should have an img element').not.toBeNull();
    expect(img!.src).toContain('brabant-barracks.png');
  });

  it('switching faction rebuilds barracks button with that faction portrait', () => {
    hud.setFaction('limburg');
    const limburgImg = document.getElementById('cmd-worker')!
      .querySelector<HTMLButtonElement>('button[data-action="build-barracks"]')!
      .querySelector('img')!;
    expect(limburgImg.src).toContain('limburg-barracks.png');

    hud.setFaction('belgen');
    const belgenImg = document.getElementById('cmd-worker')!
      .querySelector<HTMLButtonElement>('button[data-action="build-barracks"]')!
      .querySelector('img')!;
    expect(belgenImg.src).toContain('belgen-barracks.png');
  });
});
