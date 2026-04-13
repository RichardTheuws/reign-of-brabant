/**
 * Reign of Brabant -- Canvas-drawn Building Portraits
 *
 * Replaces text-based abbreviations (TH, BRK, BSM, etc.) with hand-drawn
 * building icons using Canvas 2D API. Each building type gets a unique
 * silhouette drawn in warm gold/brown/stone colours that match the game's
 * medieval-RTS aesthetic.
 *
 * Portraits are cached as data URLs after first draw to avoid repeated
 * canvas operations.
 */

import { BuildingTypeId } from '../types/index';

// ---------------------------------------------------------------------------
// Colour palette (warm medieval tones)
// ---------------------------------------------------------------------------

const C = {
  gold:       '#ffd700',
  goldDark:   '#b8960f',
  goldLight:  '#ffe66d',
  brown:      '#8b4513',
  brownLight: '#a0522d',
  brownDark:  '#5c3317',
  stone:      '#8a8378',
  stoneDark:  '#5a5550',
  stoneLight: '#b0a898',
  wood:       '#6b4226',
  woodLight:  '#8b6914',
  roof:       '#7a3b2e',
  roofDark:   '#5c2d22',
  sky:        '#1a1a2e',
  flag:       '#cc3333',
  flagDark:   '#991a1a',
  anvil:      '#3a3a3a',
  anvilLight: '#5a5a5a',
  smoke:      'rgba(180, 170, 160, 0.6)',
  white:      '#e8e0d0',
  pick:       '#aaa8a0',
  sword:      '#c0c0c0',
  swordDark:  '#808080',
  shield:     '#2255aa',
  shieldDark: '#163d7a',
  green:      '#4a7a3a',
  greenDark:  '#2d5a1e',
  crystal:    '#6eb5ff',
  crystalDark:'#4888cc',
};

// ---------------------------------------------------------------------------
// Cache: BuildingTypeId -> data URL (per size key)
// ---------------------------------------------------------------------------

const portraitCache = new Map<string, string>();

function cacheKey(type: BuildingTypeId, w: number, h: number): string {
  return `${type}-${w}x${h}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a data URL for a building portrait of the given type and size.
 * The result is cached, so repeated calls are cheap.
 */
export function getBuildingPortraitDataUrl(
  buildingType: BuildingTypeId,
  width: number,
  height: number,
): string {
  const key = cacheKey(buildingType, width, height);
  const cached = portraitCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  drawBuildingPortrait(ctx, buildingType, width, height);

  const url = canvas.toDataURL('image/png');
  portraitCache.set(key, url);
  return url;
}

/**
 * Create an <img> element with the building portrait pre-rendered.
 */
export function createBuildingPortraitImg(
  buildingType: BuildingTypeId,
  width: number,
  height: number,
): HTMLImageElement {
  const img = document.createElement('img');
  img.src = getBuildingPortraitDataUrl(buildingType, width, height);
  img.alt = getBuildingTypeName(buildingType);
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  return img;
}

/**
 * Draw a building portrait directly onto a canvas context.
 * This is the core rendering function. Each building type has a unique icon.
 */
export function drawBuildingPortrait(
  ctx: CanvasRenderingContext2D,
  buildingType: BuildingTypeId,
  width: number,
  height: number,
): void {
  // Clear with dark background
  ctx.fillStyle = C.sky;
  ctx.fillRect(0, 0, width, height);

  // Scale-independent drawing: work in a normalised coordinate space
  ctx.save();

  switch (buildingType) {
    case BuildingTypeId.TownHall:
      drawTownHall(ctx, width, height);
      break;
    case BuildingTypeId.Barracks:
      drawBarracks(ctx, width, height);
      break;
    case BuildingTypeId.LumberCamp:
      drawLumberCamp(ctx, width, height);
      break;
    case BuildingTypeId.Blacksmith:
      drawBlacksmith(ctx, width, height);
      break;
    case BuildingTypeId.Housing:
      drawHousing(ctx, width, height);
      break;
    case BuildingTypeId.TertiaryResourceBuilding:
      drawTertiaryResource(ctx, width, height);
      break;
    case BuildingTypeId.UpgradeBuilding:
      drawUpgradeBuilding(ctx, width, height);
      break;
    case BuildingTypeId.FactionSpecial1:
      drawFactionSpecial1(ctx, width, height);
      break;
    case BuildingTypeId.FactionSpecial2:
      drawFactionSpecial2(ctx, width, height);
      break;
    default:
      drawGenericBuilding(ctx, width, height);
      break;
  }

  ctx.restore();

  // Subtle gold border glow
  ctx.strokeStyle = 'rgba(212, 168, 83, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

// ---------------------------------------------------------------------------
// Building type display names
// ---------------------------------------------------------------------------

function getBuildingTypeName(type: BuildingTypeId): string {
  switch (type) {
    case BuildingTypeId.TownHall: return 'Town Hall';
    case BuildingTypeId.Barracks: return 'Barracks';
    case BuildingTypeId.LumberCamp: return 'Lumber Camp';
    case BuildingTypeId.Blacksmith: return 'Blacksmith';
    case BuildingTypeId.Housing: return 'Housing';
    case BuildingTypeId.TertiaryResourceBuilding: return 'Resource Building';
    case BuildingTypeId.UpgradeBuilding: return 'Upgrade Building';
    case BuildingTypeId.FactionSpecial1: return 'Special Building';
    case BuildingTypeId.FactionSpecial2: return 'Special Building';
    default: return 'Building';
  }
}

// ---------------------------------------------------------------------------
// Individual building draw functions
// ---------------------------------------------------------------------------

/**
 * Town Hall: Grand building with central tower, banner/flag, arched entrance.
 */
function drawTownHall(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Main building body
  ctx.fillStyle = C.stone;
  ctx.fillRect(w * 0.12, h * 0.40, w * 0.76, h * 0.48);

  // Stone detail lines
  ctx.strokeStyle = C.stoneDark;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.55);
  ctx.lineTo(w * 0.88, h * 0.55);
  ctx.moveTo(w * 0.12, h * 0.70);
  ctx.lineTo(w * 0.88, h * 0.70);
  ctx.stroke();

  // Central tower
  ctx.fillStyle = C.stoneLight;
  ctx.fillRect(cx - w * 0.12, h * 0.12, w * 0.24, h * 0.56);

  // Tower roof (pointed)
  ctx.fillStyle = C.roof;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.02);
  ctx.lineTo(cx + w * 0.16, h * 0.16);
  ctx.lineTo(cx - w * 0.16, h * 0.16);
  ctx.closePath();
  ctx.fill();

  // Tower roof highlight
  ctx.fillStyle = C.roofDark;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.02);
  ctx.lineTo(cx + w * 0.16, h * 0.16);
  ctx.lineTo(cx, h * 0.14);
  ctx.closePath();
  ctx.fill();

  // Side roofs
  ctx.fillStyle = C.roof;
  // Left roof
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.40);
  ctx.lineTo(w * 0.50, h * 0.32);
  ctx.lineTo(w * 0.50, h * 0.40);
  ctx.lineTo(w * 0.06, h * 0.40);
  ctx.closePath();
  ctx.fill();
  // Right roof
  ctx.beginPath();
  ctx.moveTo(w * 0.94, h * 0.40);
  ctx.lineTo(w * 0.50, h * 0.32);
  ctx.lineTo(w * 0.50, h * 0.40);
  ctx.lineTo(w * 0.94, h * 0.40);
  ctx.closePath();
  ctx.fill();

  // Arched entrance (center bottom)
  ctx.fillStyle = C.brownDark;
  ctx.beginPath();
  ctx.arc(cx, h * 0.72, w * 0.08, Math.PI, 0);
  ctx.lineTo(cx + w * 0.08, h * 0.88);
  ctx.lineTo(cx - w * 0.08, h * 0.88);
  ctx.closePath();
  ctx.fill();

  // Windows (left and right of entrance)
  ctx.fillStyle = C.goldLight;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(w * 0.20, h * 0.50, w * 0.06, h * 0.08);
  ctx.fillRect(w * 0.74, h * 0.50, w * 0.06, h * 0.08);
  // Tower window
  ctx.fillRect(cx - w * 0.03, h * 0.22, w * 0.06, h * 0.08);
  ctx.globalAlpha = 1.0;

  // Flag on tower
  ctx.fillStyle = C.gold;
  ctx.fillRect(cx + w * 0.02, h * 0.02, w * 0.02, h * -0.01); // pole tiny
  // Flag pole extends up from tower peak
  ctx.strokeStyle = C.goldDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.02);
  ctx.lineTo(cx, h * -0.04);
  ctx.stroke();
  // Flag triangle
  ctx.fillStyle = C.flag;
  ctx.beginPath();
  ctx.moveTo(cx, h * -0.04);
  ctx.lineTo(cx + w * 0.12, h * -0.01);
  ctx.lineTo(cx, h * 0.02);
  ctx.closePath();
  ctx.fill();

  // Ground line
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Barracks: Military building with sword & shield emblem, crenellated roof.
 */
function drawBarracks(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Main building body (wider, lower)
  ctx.fillStyle = C.stone;
  ctx.fillRect(w * 0.08, h * 0.38, w * 0.84, h * 0.50);

  // Crenellations (battlements along top)
  ctx.fillStyle = C.stoneDark;
  const crenelW = w * 0.10;
  const crenelH = h * 0.08;
  for (let i = 0; i < 5; i++) {
    const x = w * 0.08 + i * (w * 0.84 / 5) + (w * 0.84 / 10 - crenelW / 2);
    ctx.fillRect(x, h * 0.30, crenelW, crenelH);
  }

  // Shield emblem (center)
  ctx.fillStyle = C.shield;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.42);
  ctx.lineTo(cx + w * 0.12, h * 0.50);
  ctx.lineTo(cx + w * 0.10, h * 0.66);
  ctx.lineTo(cx, h * 0.72);
  ctx.lineTo(cx - w * 0.10, h * 0.66);
  ctx.lineTo(cx - w * 0.12, h * 0.50);
  ctx.closePath();
  ctx.fill();

  // Shield border
  ctx.strokeStyle = C.goldDark;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Crossed swords on shield
  ctx.strokeStyle = C.sword;
  ctx.lineWidth = 2;
  // Sword 1 (\ direction)
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.08, h * 0.46);
  ctx.lineTo(cx + w * 0.08, h * 0.68);
  ctx.stroke();
  // Sword 2 (/ direction)
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.08, h * 0.46);
  ctx.lineTo(cx - w * 0.08, h * 0.68);
  ctx.stroke();

  // Sword hilts (small crosses)
  ctx.lineWidth = 1.5;
  // Hilt 1
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.11, h * 0.48);
  ctx.lineTo(cx - w * 0.05, h * 0.44);
  ctx.stroke();
  // Hilt 2
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.11, h * 0.48);
  ctx.lineTo(cx + w * 0.05, h * 0.44);
  ctx.stroke();

  // Side windows
  ctx.fillStyle = C.goldLight;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(w * 0.14, h * 0.52, w * 0.06, h * 0.10);
  ctx.fillRect(w * 0.80, h * 0.52, w * 0.06, h * 0.10);
  ctx.globalAlpha = 1.0;

  // Ground
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Lumber Camp: Log cabin with stacked wood, axe leaning against it.
 */
function drawLumberCamp(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Stacked logs (background decoration, right side)
  ctx.fillStyle = C.wood;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(w * 0.82, h * (0.72 + i * 0.06), w * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  // Log cross-section rings
  ctx.strokeStyle = C.woodLight;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(w * 0.82, h * (0.72 + i * 0.06), w * 0.02, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Main cabin body (log-textured)
  ctx.fillStyle = C.brownLight;
  ctx.fillRect(w * 0.14, h * 0.42, w * 0.60, h * 0.46);

  // Log horizontal lines
  ctx.strokeStyle = C.brownDark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h * (0.48 + i * 0.08));
    ctx.lineTo(w * 0.74, h * (0.48 + i * 0.08));
    ctx.stroke();
  }

  // Triangular roof
  ctx.fillStyle = C.brownDark;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.42);
  ctx.lineTo(cx - w * 0.02, h * 0.18);
  ctx.lineTo(w * 0.80, h * 0.42);
  ctx.closePath();
  ctx.fill();

  // Roof highlight
  ctx.fillStyle = C.brown;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.42);
  ctx.lineTo(cx - w * 0.02, h * 0.18);
  ctx.lineTo(cx - w * 0.02, h * 0.42);
  ctx.closePath();
  ctx.fill();

  // Axe (leaning against left side)
  // Handle
  ctx.strokeStyle = C.woodLight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.50);
  ctx.lineTo(w * 0.18, h * 0.86);
  ctx.stroke();
  // Blade
  ctx.fillStyle = C.pick;
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.48);
  ctx.lineTo(w * 0.12, h * 0.44);
  ctx.lineTo(w * 0.12, h * 0.54);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(cx - w * 0.06, h * 0.68, w * 0.12, h * 0.20);

  // Ground
  ctx.fillStyle = C.greenDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Blacksmith: Anvil silhouette with hammer, chimney with smoke.
 */
function drawBlacksmith(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Main building body (stone)
  ctx.fillStyle = C.stoneDark;
  ctx.fillRect(w * 0.14, h * 0.40, w * 0.72, h * 0.48);

  // Roof
  ctx.fillStyle = C.roofDark;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.40);
  ctx.lineTo(cx, h * 0.22);
  ctx.lineTo(w * 0.92, h * 0.40);
  ctx.closePath();
  ctx.fill();

  // Chimney (right side)
  ctx.fillStyle = C.stone;
  ctx.fillRect(w * 0.72, h * 0.12, w * 0.10, h * 0.28);

  // Smoke from chimney
  ctx.fillStyle = C.smoke;
  ctx.beginPath();
  ctx.arc(w * 0.77, h * 0.08, w * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.80, h * 0.03, w * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // Forge glow (window / opening)
  ctx.fillStyle = '#ff6600';
  ctx.globalAlpha = 0.6;
  ctx.fillRect(w * 0.22, h * 0.56, w * 0.14, h * 0.14);
  ctx.globalAlpha = 1.0;
  // Inner glow
  ctx.fillStyle = '#ffaa00';
  ctx.globalAlpha = 0.4;
  ctx.fillRect(w * 0.25, h * 0.59, w * 0.08, h * 0.08);
  ctx.globalAlpha = 1.0;

  // Anvil (center-right)
  ctx.fillStyle = C.anvil;
  // Anvil body
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.02, h * 0.68);
  ctx.lineTo(cx + w * 0.20, h * 0.66);
  ctx.lineTo(cx + w * 0.22, h * 0.70);
  ctx.lineTo(cx + w * 0.18, h * 0.72);
  ctx.lineTo(cx + w * 0.18, h * 0.78);
  ctx.lineTo(cx + w * 0.20, h * 0.80);
  ctx.lineTo(cx - w * 0.02, h * 0.80);
  ctx.lineTo(cx, h * 0.78);
  ctx.lineTo(cx, h * 0.72);
  ctx.lineTo(cx - w * 0.02, h * 0.70);
  ctx.closePath();
  ctx.fill();
  // Anvil highlight
  ctx.fillStyle = C.anvilLight;
  ctx.fillRect(cx + w * 0.02, h * 0.68, w * 0.14, h * 0.02);

  // Hammer (above anvil)
  ctx.strokeStyle = C.woodLight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.06, h * 0.54);
  ctx.lineTo(cx + w * 0.14, h * 0.64);
  ctx.stroke();
  // Hammer head
  ctx.fillStyle = C.anvilLight;
  ctx.fillRect(cx + w * 0.03, h * 0.52, w * 0.08, h * 0.04);

  // Ground
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Housing: Simple cosy cottage with thatched roof and chimney.
 */
function drawHousing(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Main house body
  ctx.fillStyle = C.stoneLight;
  ctx.fillRect(w * 0.18, h * 0.48, w * 0.64, h * 0.40);

  // Thatched roof (rounded)
  ctx.fillStyle = C.brownLight;
  ctx.beginPath();
  ctx.moveTo(w * 0.10, h * 0.48);
  ctx.quadraticCurveTo(cx, h * 0.18, w * 0.90, h * 0.48);
  ctx.closePath();
  ctx.fill();

  // Roof highlight
  ctx.strokeStyle = C.brown;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.20, h * 0.48);
  ctx.quadraticCurveTo(cx, h * 0.24, w * 0.80, h * 0.48);
  ctx.stroke();

  // Chimney
  ctx.fillStyle = C.stone;
  ctx.fillRect(w * 0.68, h * 0.28, w * 0.08, h * 0.16);

  // Small smoke puff
  ctx.fillStyle = C.smoke;
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.24, w * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // Door
  ctx.fillStyle = C.wood;
  ctx.fillRect(cx - w * 0.06, h * 0.66, w * 0.12, h * 0.22);
  // Door handle
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(cx + w * 0.03, h * 0.76, w * 0.015, 0, Math.PI * 2);
  ctx.fill();

  // Window (left of door)
  ctx.fillStyle = C.goldLight;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(w * 0.24, h * 0.58, w * 0.10, h * 0.10);
  ctx.globalAlpha = 1.0;
  // Window cross
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.29, h * 0.58);
  ctx.lineTo(w * 0.29, h * 0.68);
  ctx.moveTo(w * 0.24, h * 0.63);
  ctx.lineTo(w * 0.34, h * 0.63);
  ctx.stroke();

  // Ground with grass
  ctx.fillStyle = C.green;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Tertiary Resource Building: Mine shaft with ore cart and crystal/resource glow.
 */
function drawTertiaryResource(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Mine entrance frame (wooden A-frame)
  ctx.fillStyle = C.brownDark;
  // Dark cave opening
  ctx.beginPath();
  ctx.moveTo(w * 0.20, h * 0.88);
  ctx.lineTo(w * 0.30, h * 0.40);
  ctx.lineTo(w * 0.70, h * 0.40);
  ctx.lineTo(w * 0.80, h * 0.88);
  ctx.closePath();
  ctx.fill();

  // Wooden frame beams
  ctx.strokeStyle = C.woodLight;
  ctx.lineWidth = 3;
  // Left beam
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.88);
  ctx.lineTo(w * 0.32, h * 0.36);
  ctx.stroke();
  // Right beam
  ctx.beginPath();
  ctx.moveTo(w * 0.82, h * 0.88);
  ctx.lineTo(w * 0.68, h * 0.36);
  ctx.stroke();
  // Top beam
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.28, h * 0.38);
  ctx.lineTo(w * 0.72, h * 0.38);
  ctx.stroke();

  // Headframe tower (above entrance)
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 2;
  // A-frame peak
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h * 0.38);
  ctx.lineTo(cx, h * 0.10);
  ctx.lineTo(w * 0.64, h * 0.38);
  ctx.stroke();
  // Cross beam
  ctx.beginPath();
  ctx.moveTo(w * 0.40, h * 0.28);
  ctx.lineTo(w * 0.60, h * 0.28);
  ctx.stroke();

  // Ore cart (small, bottom center)
  ctx.fillStyle = C.stoneDark;
  ctx.fillRect(cx - w * 0.10, h * 0.74, w * 0.20, h * 0.10);
  // Cart wheels
  ctx.fillStyle = C.brownDark;
  ctx.beginPath();
  ctx.arc(cx - w * 0.06, h * 0.86, w * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + w * 0.06, h * 0.86, w * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Glowing ore in cart
  ctx.fillStyle = C.crystal;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.06, h * 0.72);
  ctx.lineTo(cx - w * 0.02, h * 0.66);
  ctx.lineTo(cx + w * 0.02, h * 0.70);
  ctx.lineTo(cx + w * 0.06, h * 0.66);
  ctx.lineTo(cx + w * 0.08, h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Resource glow inside cave
  ctx.fillStyle = C.goldLight;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(cx, h * 0.60, w * 0.10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Ground
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Upgrade Building: Tower with scrolls/book and glowing window (library/research).
 */
function drawUpgradeBuilding(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Tall tower body
  ctx.fillStyle = C.stone;
  ctx.fillRect(w * 0.24, h * 0.28, w * 0.52, h * 0.60);

  // Stone brick lines
  ctx.strokeStyle = C.stoneDark;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 6; i++) {
    const y = h * (0.35 + i * 0.08);
    ctx.beginPath();
    ctx.moveTo(w * 0.24, y);
    ctx.lineTo(w * 0.76, y);
    ctx.stroke();
  }

  // Conical roof
  ctx.fillStyle = C.roof;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.06);
  ctx.lineTo(w * 0.80, h * 0.30);
  ctx.lineTo(w * 0.20, h * 0.30);
  ctx.closePath();
  ctx.fill();

  // Roof highlight
  ctx.fillStyle = C.roofDark;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.06);
  ctx.lineTo(w * 0.80, h * 0.30);
  ctx.lineTo(cx, h * 0.26);
  ctx.closePath();
  ctx.fill();

  // Large glowing window (arcane/research glow)
  ctx.fillStyle = '#4466cc';
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(cx, h * 0.46, w * 0.08, Math.PI, 0);
  ctx.lineTo(cx + w * 0.08, h * 0.58);
  ctx.lineTo(cx - w * 0.08, h * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Inner glow
  ctx.fillStyle = '#88aaff';
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(cx, h * 0.48, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Scroll/book icon on building (below window)
  ctx.fillStyle = C.white;
  // Book shape
  ctx.fillRect(cx - w * 0.08, h * 0.66, w * 0.16, h * 0.10);
  // Book spine
  ctx.strokeStyle = C.goldDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.66);
  ctx.lineTo(cx, h * 0.76);
  ctx.stroke();
  // Book cover colour
  ctx.fillStyle = C.roofDark;
  ctx.fillRect(cx - w * 0.08, h * 0.65, w * 0.16, h * 0.02);

  // Finial on top
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(cx, h * 0.04, w * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Ground
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Faction Special 1: Ornate building with banner and faction crest.
 */
function drawFactionSpecial1(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Main building body (ornate)
  ctx.fillStyle = C.stoneLight;
  ctx.fillRect(w * 0.14, h * 0.42, w * 0.72, h * 0.46);

  // Decorative columns (left and right)
  ctx.fillStyle = C.stone;
  ctx.fillRect(w * 0.14, h * 0.38, w * 0.06, h * 0.50);
  ctx.fillRect(w * 0.80, h * 0.38, w * 0.06, h * 0.50);

  // Column capitals
  ctx.fillStyle = C.goldDark;
  ctx.fillRect(w * 0.12, h * 0.36, w * 0.10, h * 0.04);
  ctx.fillRect(w * 0.78, h * 0.36, w * 0.10, h * 0.04);

  // Triangular pediment
  ctx.fillStyle = C.stone;
  ctx.beginPath();
  ctx.moveTo(w * 0.10, h * 0.38);
  ctx.lineTo(cx, h * 0.18);
  ctx.lineTo(w * 0.90, h * 0.38);
  ctx.closePath();
  ctx.fill();

  // Pediment border
  ctx.strokeStyle = C.goldDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.10, h * 0.38);
  ctx.lineTo(cx, h * 0.18);
  ctx.lineTo(w * 0.90, h * 0.38);
  ctx.stroke();

  // Star/crest in pediment
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  const starCx = cx;
  const starCy = h * 0.30;
  const outerR = w * 0.06;
  const innerR = w * 0.025;
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    if (i === 0) {
      ctx.moveTo(starCx + outerR * Math.cos(outerAngle), starCy + outerR * Math.sin(outerAngle));
    } else {
      ctx.lineTo(starCx + outerR * Math.cos(outerAngle), starCy + outerR * Math.sin(outerAngle));
    }
    ctx.lineTo(starCx + innerR * Math.cos(innerAngle), starCy + innerR * Math.sin(innerAngle));
  }
  ctx.closePath();
  ctx.fill();

  // Central door (grand arch)
  ctx.fillStyle = C.brownDark;
  ctx.beginPath();
  ctx.arc(cx, h * 0.66, w * 0.10, Math.PI, 0);
  ctx.lineTo(cx + w * 0.10, h * 0.88);
  ctx.lineTo(cx - w * 0.10, h * 0.88);
  ctx.closePath();
  ctx.fill();

  // Side windows
  ctx.fillStyle = C.goldLight;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(w * 0.24, h * 0.52, w * 0.08, h * 0.10);
  ctx.fillRect(w * 0.68, h * 0.52, w * 0.08, h * 0.10);
  ctx.globalAlpha = 1.0;

  // Ground
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Faction Special 2: Unique domed building with spire.
 */
function drawFactionSpecial2(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Main body (wide base)
  ctx.fillStyle = C.stone;
  ctx.fillRect(w * 0.16, h * 0.50, w * 0.68, h * 0.38);

  // Dome
  ctx.fillStyle = C.goldDark;
  ctx.beginPath();
  ctx.arc(cx, h * 0.50, w * 0.34, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // Dome highlight
  ctx.fillStyle = C.gold;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(cx - w * 0.06, h * 0.42, w * 0.14, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Spire on top of dome
  ctx.fillStyle = C.goldDark;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.08);
  ctx.lineTo(cx + w * 0.04, h * 0.20);
  ctx.lineTo(cx - w * 0.04, h * 0.20);
  ctx.closePath();
  ctx.fill();

  // Finial
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(cx, h * 0.07, w * 0.02, 0, Math.PI * 2);
  ctx.fill();

  // Central arched window
  ctx.fillStyle = C.goldLight;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(cx, h * 0.56, w * 0.06, Math.PI, 0);
  ctx.lineTo(cx + w * 0.06, h * 0.68);
  ctx.lineTo(cx - w * 0.06, h * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Side arches
  ctx.fillStyle = C.brownDark;
  ctx.beginPath();
  ctx.arc(cx - w * 0.22, h * 0.66, w * 0.05, Math.PI, 0);
  ctx.lineTo(cx - w * 0.17, h * 0.78);
  ctx.lineTo(cx - w * 0.27, h * 0.78);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx + w * 0.22, h * 0.66, w * 0.05, Math.PI, 0);
  ctx.lineTo(cx + w * 0.27, h * 0.78);
  ctx.lineTo(cx + w * 0.17, h * 0.78);
  ctx.closePath();
  ctx.fill();

  // Ground
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Generic building: Simple house silhouette (fallback for unmapped types).
 */
function drawGenericBuilding(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;

  // Simple house body
  ctx.fillStyle = C.stone;
  ctx.fillRect(w * 0.18, h * 0.48, w * 0.64, h * 0.40);

  // Simple triangular roof
  ctx.fillStyle = C.roof;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.48);
  ctx.lineTo(cx, h * 0.24);
  ctx.lineTo(w * 0.88, h * 0.48);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(cx - w * 0.06, h * 0.68, w * 0.12, h * 0.20);

  // Window
  ctx.fillStyle = C.goldLight;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(w * 0.26, h * 0.56, w * 0.10, h * 0.10);
  ctx.globalAlpha = 1.0;

  // Ground
  ctx.fillStyle = C.brownDark;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}
