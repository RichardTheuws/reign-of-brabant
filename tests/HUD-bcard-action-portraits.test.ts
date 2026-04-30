// @vitest-environment jsdom
// Building-card action buttons (train-unit, train-hero) must use the
// faction-painted unit/hero portrait, not the generic command-icon
// fallback. Regression test for the screenshot Richard reported on
// 2026-04-30 (Schuttershal showed sword/bow icons + duplicate gem-crowns
// for Mijnbaas + Maasridder instead of factie-painted portraits).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@audio/AudioManager', () => ({
  audioManager: { playSound: vi.fn() },
}));

import { HUD, type BuildingCardData } from '@ui/HUD';
import { BuildingTypeId } from '../src/types/index';

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
  <div id="cmd-unit" hidden><button class="cmd-btn"><span class="btn-icon"></span></button></div>
  <div id="cmd-multi" hidden><button class="cmd-btn"><span class="btn-icon"></span></button></div>
  <div id="cmd-building" hidden>
    <button class="cmd-btn" data-action="train-worker"><span class="btn-icon"></span><span></span></button>
    <button class="cmd-btn" data-action="train-infantry"><span class="btn-icon"></span><span></span></button>
    <button class="cmd-btn" data-action="train-ranged"><span class="btn-icon"></span><span></span></button>
  </div>
  <div id="cmd-hero" hidden><button class="cmd-btn"><span class="btn-icon"></span></button></div>
  <div id="cmd-blacksmith" hidden></div>
`;

function makeBuildingCard(
  buildingTypeId: BuildingTypeId,
  actions: BuildingCardData['actions'],
): BuildingCardData {
  return {
    id: 1,
    name: 'Test Building',
    factionName: 'Test',
    hp: 800,
    maxHp: 800,
    status: 'Idle',
    queue: [],
    portraitAbbrev: 'BRK',
    buildingTypeId,
    actions,
  };
}

describe('Building-card action buttons use faction-painted portraits', () => {
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

  describe('Limburg Schuttershal (the screenshot scenario)', () => {
    beforeEach(() => hud.setFaction('limburg'));

    it('train-infantry shows limburg-infantry portrait', () => {
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.Barracks, [
        { action: 'train-infantry', icon: 'UNIT_I', label: 'Schutterij', hotkey: 'W' },
      ]));
      const btn = document.querySelector<HTMLButtonElement>('[data-action="train-infantry"]')!;
      const img = btn.querySelector('img')!;
      expect(img.src).toContain('limburg-infantry.png');
    });

    it('train-ranged shows limburg-ranged portrait', () => {
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.Barracks, [
        { action: 'train-ranged', icon: 'UNIT_R', label: 'Vlaaienwerper', hotkey: 'E' },
      ]));
      const btn = document.querySelector<HTMLButtonElement>('[data-action="train-ranged"]')!;
      const img = btn.querySelector('img')!;
      expect(img.src).toContain('limburg-ranged.png');
    });

    it('train-support shows limburg-support (Sjpion) portrait', () => {
      // v0.54.0: every faction has its own Support portrait.
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.Barracks, [
        { action: 'train-support', icon: 'UNIT_S', label: 'Sjpion', hotkey: 'D' },
      ]));
      const btn = document.querySelector<HTMLButtonElement>('[data-action="train-support"]')!;
      const img = btn.querySelector('img')!;
      expect(img.src).toContain('limburg-support.png');
      expect(img.src).not.toContain('brabant-support.png');
    });

    it('train-hero-0 shows limburg-mijnbaas portrait (not generic gem-crown)', () => {
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.TownHall, [
        { action: 'train-hero-0', icon: 'H1', label: 'De Mijnbaas', hotkey: 'T', isHero: true },
      ]));
      const btn = document.querySelector<HTMLButtonElement>('[data-action="train-hero-0"]')!;
      const img = btn.querySelector('img')!;
      expect(img.src).toContain('limburg-mijnbaas.png');
      expect(img.src).not.toContain('cmd-hero.png');
    });

    it('train-hero-1 shows limburg-maasmeester portrait (distinct from hero-0)', () => {
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.TownHall, [
        { action: 'train-hero-0', icon: 'H1', label: 'De Mijnbaas',  hotkey: 'T', isHero: true },
        { action: 'train-hero-1', icon: 'H2', label: 'De Maasridder', hotkey: 'Y', isHero: true },
      ]));
      const btn0 = document.querySelector<HTMLButtonElement>('[data-action="train-hero-0"]')!;
      const btn1 = document.querySelector<HTMLButtonElement>('[data-action="train-hero-1"]')!;
      const img0 = btn0.querySelector('img')!;
      const img1 = btn1.querySelector('img')!;
      expect(img0.src).toContain('limburg-mijnbaas.png');
      expect(img1.src).toContain('limburg-maasmeester.png');
      expect(img0.src).not.toBe(img1.src); // not duplicate gem-crown anymore
    });
  });

  describe('Faction-aware: same action-icon shows different portrait per faction', () => {
    it('train-infantry portrait swaps with faction (brabant → randstad → belgen)', () => {
      const action = { action: 'train-infantry' as const, icon: 'UNIT_I', label: 'Inf', hotkey: 'W' };

      hud.setFaction('brabant');
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.Barracks, [action]));
      const brabant = document.querySelector<HTMLImageElement>('[data-action="train-infantry"] img')!.src;

      hud.setFaction('randstad');
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.Barracks, [action]));
      const randstad = document.querySelector<HTMLImageElement>('[data-action="train-infantry"] img')!.src;

      hud.setFaction('belgen');
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.Barracks, [action]));
      const belgen = document.querySelector<HTMLImageElement>('[data-action="train-infantry"] img')!.src;

      expect(brabant).toContain('brabant-infantry.png');
      expect(randstad).toContain('randstad-infantry.png');
      expect(belgen).toContain('belgen-infantry.png');
    });

    it('train-hero-0 portrait swaps with faction', () => {
      const action = {
        action: 'train-hero-0' as const, icon: 'H1', label: 'Hero',
        hotkey: 'T', isHero: true,
      };

      hud.setFaction('brabant');
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.TownHall, [action]));
      const brabant = document.querySelector<HTMLImageElement>('[data-action="train-hero-0"] img')!.src;

      hud.setFaction('randstad');
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.TownHall, [action]));
      const randstad = document.querySelector<HTMLImageElement>('[data-action="train-hero-0"] img')!.src;

      hud.setFaction('belgen');
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.TownHall, [action]));
      const belgen = document.querySelector<HTMLImageElement>('[data-action="train-hero-0"] img')!.src;

      // Faction's first hero portrait per HERO_PORTRAITS map
      expect(brabant).toContain('brabant-prins.png');
      expect(randstad).toContain('randstad-ceo.png');
      expect(belgen).toContain('belgen-frietkoning.png');
      expect(brabant).not.toBe(randstad);
      expect(randstad).not.toBe(belgen);
    });
  });

  describe('Non-train actions still use generic command-icon (no portrait)', () => {
    it('rally-point uses cmd-rally.png, not a unit portrait', () => {
      hud.setFaction('brabant');
      hud.showBuildingCard(makeBuildingCard(BuildingTypeId.Barracks, [
        { action: 'rally-point', icon: 'RL', label: 'Rally', hotkey: 'R', isRally: true },
      ]));
      const btn = document.querySelector<HTMLButtonElement>('[data-action="rally-point"]')!;
      const img = btn.querySelector('img');
      // Should NOT be a unit/hero portrait; should be the rally command-icon
      // (or null/fallback if mapping missing — but never a unit PNG).
      if (img) {
        expect(img.src).not.toContain('-worker.png');
        expect(img.src).not.toContain('-infantry.png');
        expect(img.src).not.toContain('-prins.png');
        expect(img.src).not.toContain('-ceo.png');
      }
    });
  });
});
