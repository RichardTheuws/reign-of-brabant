/**
 * CommandIcons.ts
 * SVG-based icon rendering for HUD command buttons.
 * All icons are drawn with SVG path data — no emoji, no unicode, no text placeholders.
 *
 * Each icon function returns an SVGSVGElement that can be appended to a button.
 * Icons use currentColor so they inherit the btn-icon color classes.
 */

// ---------------------------------------------------------------------------
// Icon registry — maps icon abbreviation keys to SVG path draw functions
// ---------------------------------------------------------------------------

type IconDrawFn = (svg: SVGSVGElement, size: number) => void;

const ICON_REGISTRY: Record<string, IconDrawFn> = {
  MOV: drawMoveIcon,
  ATK: drawAttackIcon,
  STP: drawStopIcon,
  HLD: drawHoldIcon,
  WRK: drawWorkerIcon,
  INF: drawInfantryIcon,
  RNG: drawRangedIcon,
  BLD: drawBuildIcon,
  H1:  drawHero1Icon,
  H2:  drawHero2Icon,
  RLY: drawRallyIcon,
  UPG: drawUpgradeIcon,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create an SVG icon element for the given command abbreviation.
 * Falls back to text if the icon key is not registered.
 *
 * @param iconKey - The icon abbreviation (MOV, ATK, STP, etc.)
 * @param size - Icon size in pixels (default 20)
 * @returns An SVGSVGElement ready to append, or null if no icon found
 */
export function createCommandIcon(iconKey: string, size: number = 20): SVGSVGElement | null {
  const drawFn = ICON_REGISTRY[iconKey];
  if (!drawFn) return null;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.display = 'block';
  svg.style.flexShrink = '0';

  drawFn(svg, 24);
  return svg;
}

/**
 * Replace textContent of a .btn-icon or .bcard-action-icon span with an SVG icon.
 * Preserves the span's classes (color styling) and clears its text.
 */
export function replaceIconText(span: HTMLElement): void {
  const iconKey = span.textContent?.trim() ?? '';
  const svg = createCommandIcon(iconKey);
  if (svg) {
    span.textContent = '';
    span.appendChild(svg);
  }
  // If no icon found, leave text as-is (fallback)
}

// ---------------------------------------------------------------------------
// Helper: create an SVG path element
// ---------------------------------------------------------------------------

function path(svg: SVGSVGElement, d: string, opts?: {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: string;
  strokeLinejoin?: string;
}): SVGPathElement {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  if (opts?.fill) p.setAttribute('fill', opts.fill);
  else p.setAttribute('fill', 'none');
  if (opts?.stroke) p.setAttribute('stroke', opts.stroke);
  else p.setAttribute('stroke', 'currentColor');
  if (opts?.strokeWidth) p.setAttribute('stroke-width', String(opts.strokeWidth));
  else p.setAttribute('stroke-width', '2');
  if (opts?.strokeLinecap) p.setAttribute('stroke-linecap', opts.strokeLinecap);
  else p.setAttribute('stroke-linecap', 'round');
  if (opts?.strokeLinejoin) p.setAttribute('stroke-linejoin', opts.strokeLinejoin);
  else p.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(p);
  return p;
}

function circle(svg: SVGSVGElement, cx: number, cy: number, r: number, opts?: {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}): SVGCircleElement {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', String(cx));
  c.setAttribute('cy', String(cy));
  c.setAttribute('r', String(r));
  c.setAttribute('fill', opts?.fill ?? 'none');
  c.setAttribute('stroke', opts?.stroke ?? 'currentColor');
  c.setAttribute('stroke-width', String(opts?.strokeWidth ?? 2));
  svg.appendChild(c);
  return c;
}

function text(svg: SVGSVGElement, x: number, y: number, content: string, opts?: {
  fontSize?: number;
  fontWeight?: string;
  fill?: string;
}): SVGTextElement {
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', String(x));
  t.setAttribute('y', String(y));
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('dominant-baseline', 'central');
  t.setAttribute('font-size', String(opts?.fontSize ?? 10));
  t.setAttribute('font-weight', opts?.fontWeight ?? '700');
  t.setAttribute('fill', opts?.fill ?? 'currentColor');
  t.setAttribute('font-family', 'sans-serif');
  t.textContent = content;
  svg.appendChild(t);
  return t;
}

// ---------------------------------------------------------------------------
// Icon draw functions — all work within a 24x24 viewBox
// ---------------------------------------------------------------------------

/** MOV: Arrow pointing right (move command) */
function drawMoveIcon(svg: SVGSVGElement): void {
  // Arrow shaft
  path(svg, 'M4 12 L18 12', { strokeWidth: 2.5 });
  // Arrow head
  path(svg, 'M14 6 L20 12 L14 18', { strokeWidth: 2.5 });
}

/** ATK: Crossed swords (attack command) */
function drawAttackIcon(svg: SVGSVGElement): void {
  // Sword 1: bottom-left to top-right
  path(svg, 'M5 19 L19 5', { strokeWidth: 2 });
  // Sword 1 guard
  path(svg, 'M7 14 L10 17', { strokeWidth: 2.5 });
  // Sword 1 tip
  path(svg, 'M17 3 L21 3 L21 7', { strokeWidth: 2 });

  // Sword 2: bottom-right to top-left
  path(svg, 'M19 19 L5 5', { strokeWidth: 2 });
  // Sword 2 guard
  path(svg, 'M14 17 L17 14', { strokeWidth: 2.5 });
  // Sword 2 tip
  path(svg, 'M3 7 L3 3 L7 3', { strokeWidth: 2 });
}

/** STP: Octagonal stop sign (stop command) */
function drawStopIcon(svg: SVGSVGElement): void {
  // Octagon
  path(svg, 'M8 2 L16 2 L22 8 L22 16 L16 22 L8 22 L2 16 L2 8 Z', {
    fill: 'currentColor',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  });
  // Inner square (raised hand / stop visual)
  const inner = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  inner.setAttribute('x', '8');
  inner.setAttribute('y', '8');
  inner.setAttribute('width', '8');
  inner.setAttribute('height', '8');
  inner.setAttribute('rx', '1');
  inner.setAttribute('fill', 'rgba(20, 15, 10, 0.9)');
  inner.setAttribute('stroke', 'none');
  svg.appendChild(inner);
}

/** HLD: Shield (hold position) */
function drawHoldIcon(svg: SVGSVGElement): void {
  // Shield shape
  path(svg, 'M12 2 L20 6 L20 12 C20 17 16 21 12 22 C8 21 4 17 4 12 L4 6 Z', {
    fill: 'currentColor',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  });
  // Inner chevron for depth
  path(svg, 'M12 8 L15 12 L12 16 L9 12 Z', {
    fill: 'rgba(20, 15, 10, 0.7)',
    stroke: 'rgba(20, 15, 10, 0.7)',
    strokeWidth: 1,
  });
}

/** WRK: Pickaxe (train worker) */
function drawWorkerIcon(svg: SVGSVGElement): void {
  // Pickaxe handle (diagonal)
  path(svg, 'M6 20 L16 10', { strokeWidth: 2.5 });
  // Pickaxe head (curved)
  path(svg, 'M12 6 L18 4 L20 6 L18 8', { strokeWidth: 2 });
  // Pick point
  path(svg, 'M12 6 L14 4', { strokeWidth: 2 });
  // Flat end
  path(svg, 'M18 8 L20 10', { strokeWidth: 2 });
}

/** INF: Upright sword (train infantry) */
function drawInfantryIcon(svg: SVGSVGElement): void {
  // Blade
  path(svg, 'M12 3 L12 16', { strokeWidth: 2.5 });
  // Blade tip
  path(svg, 'M10 5 L12 2 L14 5', { fill: 'currentColor', stroke: 'currentColor', strokeWidth: 1.5 });
  // Crossguard
  path(svg, 'M7 14 L17 14', { strokeWidth: 2.5 });
  // Grip
  path(svg, 'M12 16 L12 20', { strokeWidth: 3 });
  // Pommel
  circle(svg, 12, 21, 1.5, { fill: 'currentColor', stroke: 'currentColor', strokeWidth: 1 });
}

/** RNG: Bow with arrow (train ranged) */
function drawRangedIcon(svg: SVGSVGElement): void {
  // Bow arc
  path(svg, 'M6 4 C2 10 2 14 6 20', { strokeWidth: 2 });
  // Bowstring
  path(svg, 'M6 4 L6 20', { strokeWidth: 1.5 });
  // Arrow shaft
  path(svg, 'M6 12 L21 12', { strokeWidth: 2 });
  // Arrow head
  path(svg, 'M18 9 L22 12 L18 15', { fill: 'currentColor', stroke: 'currentColor', strokeWidth: 1.5 });
  // Arrow fletching
  path(svg, 'M6 10 L3 12 L6 14', { strokeWidth: 1.5 });
}

/** BLD: House/building silhouette (build command) */
function drawBuildIcon(svg: SVGSVGElement): void {
  // Roof
  path(svg, 'M3 12 L12 4 L21 12', { strokeWidth: 2 });
  // Walls
  path(svg, 'M5 12 L5 21 L19 21 L19 12', { strokeWidth: 2 });
  // Door
  path(svg, 'M10 21 L10 16 L14 16 L14 21', { strokeWidth: 1.5 });
  // Window
  const win = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  win.setAttribute('x', '8');
  win.setAttribute('y', '12.5');
  win.setAttribute('width', '3');
  win.setAttribute('height', '2.5');
  win.setAttribute('fill', 'currentColor');
  win.setAttribute('stroke', 'none');
  win.setAttribute('rx', '0.5');
  svg.appendChild(win);
  const win2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  win2.setAttribute('x', '13');
  win2.setAttribute('y', '12.5');
  win2.setAttribute('width', '3');
  win2.setAttribute('height', '2.5');
  win2.setAttribute('fill', 'currentColor');
  win2.setAttribute('stroke', 'none');
  win2.setAttribute('rx', '0.5');
  svg.appendChild(win2);
}

/** H1: Crown with "1" (train hero 1) */
function drawHero1Icon(svg: SVGSVGElement): void {
  // Crown base
  path(svg, 'M3 16 L3 8 L7 12 L12 6 L17 12 L21 8 L21 16 Z', {
    fill: 'currentColor',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  });
  // Crown band
  path(svg, 'M3 16 L21 16', { stroke: 'currentColor', strokeWidth: 2 });
  // Number
  text(svg, 12, 20, '1', { fontSize: 7, fill: 'currentColor' });
}

/** H2: Crown with "2" (train hero 2) */
function drawHero2Icon(svg: SVGSVGElement): void {
  // Crown base
  path(svg, 'M3 16 L3 8 L7 12 L12 6 L17 12 L21 8 L21 16 Z', {
    fill: 'currentColor',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  });
  // Crown band
  path(svg, 'M3 16 L21 16', { stroke: 'currentColor', strokeWidth: 2 });
  // Number
  text(svg, 12, 20, '2', { fontSize: 7, fill: 'currentColor' });
}

/** RLY: Flag on pole (rally point) */
function drawRallyIcon(svg: SVGSVGElement): void {
  // Pole
  path(svg, 'M6 3 L6 22', { strokeWidth: 2 });
  // Flag (triangular pennant)
  path(svg, 'M6 3 L20 7 L6 11 Z', {
    fill: 'currentColor',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  });
  // Ground base
  path(svg, 'M3 22 L9 22', { strokeWidth: 2 });
}

/** UPG: Anvil with arrow up (research/upgrade) */
function drawUpgradeIcon(svg: SVGSVGElement): void {
  // Upward arrow
  path(svg, 'M12 3 L12 14', { strokeWidth: 2.5 });
  path(svg, 'M8 7 L12 3 L16 7', { strokeWidth: 2.5 });
  // Anvil body
  path(svg, 'M4 18 L4 16 L8 14 L16 14 L20 16 L20 18', {
    fill: 'currentColor',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  });
  // Anvil base
  path(svg, 'M6 18 L18 18', { strokeWidth: 2.5 });
  // Anvil foot
  path(svg, 'M8 18 L8 21 L16 21 L16 18', { strokeWidth: 2 });
}
