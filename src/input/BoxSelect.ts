/**
 * BoxSelect.ts
 * Visual drag-to-select overlay for RTS box selection.
 * Renders a dashed green selection rectangle on the screen and resolves
 * which player-owned entities fall within it using screen-space projection.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum drag distance (px) before we start drawing the selection box. */
const MIN_DRAG_DISTANCE = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectableEntity {
  /** ECS entity id. */
  eid: number;
  /** Projected screen X position. */
  screenX: number;
  /** Projected screen Y position. */
  screenY: number;
  /** Faction id (0 = player, 1 = AI, etc.). */
  factionId: number;
}

// ---------------------------------------------------------------------------
// BoxSelect
// ---------------------------------------------------------------------------

export class BoxSelect {
  private canvas: HTMLCanvasElement;
  private camera: THREE.Camera;
  private terrain: { mesh: THREE.Mesh };
  private getSelectableEntities: () => SelectableEntity[];
  private onSelectionChanged: (eids: number[]) => void;
  private playerFactionId: number;

  /** Whether box-select input handling is active. */
  private enabled = true;

  /** Whether we are currently in a drag gesture. */
  private dragging = false;

  /** Mouse-down start position (screen pixels). */
  private startX = 0;
  private startY = 0;

  /** Current mouse position during drag (screen pixels). */
  private currentX = 0;
  private currentY = 0;

  /** The visible selection rectangle overlay element. */
  private boxEl: HTMLDivElement;

  // Bound handlers (for clean removal)
  private handleMouseDown: (e: MouseEvent) => void;
  private handleMouseMove: (e: MouseEvent) => void;
  private handleMouseUp: (e: MouseEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
    terrain: { mesh: THREE.Mesh },
    getSelectableEntities: () => SelectableEntity[],
    onSelectionChanged: (eids: number[]) => void,
    playerFactionId: number,
  ) {
    this.canvas = canvas;
    this.camera = camera;
    this.terrain = terrain;
    this.getSelectableEntities = getSelectableEntities;
    this.onSelectionChanged = onSelectionChanged;
    this.playerFactionId = playerFactionId;

    // Create the overlay element
    this.boxEl = this.createBoxElement();

    // Bind handlers
    this.handleMouseDown = this.onMouseDown.bind(this);
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleMouseUp = this.onMouseUp.bind(this);

    this.bindEvents();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Enable or disable box-select (e.g. disable during build mode). */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.cancelDrag();
    }
  }

  /** Clean up all DOM elements and event listeners. */
  destroy(): void {
    this.unbindEvents();
    this.boxEl.remove();
  }

  // -----------------------------------------------------------------------
  // Event binding
  // -----------------------------------------------------------------------

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  private unbindEvents(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  // -----------------------------------------------------------------------
  // DOM event handlers
  // -----------------------------------------------------------------------

  private onMouseDown(e: MouseEvent): void {
    // Only respond to left mouse button
    if (e.button !== 0) return;
    if (!this.enabled) return;

    this.startX = e.clientX;
    this.startY = e.clientY;
    this.currentX = e.clientX;
    this.currentY = e.clientY;
    this.dragging = false;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.enabled) return;
    // Only track if left button was pressed on our canvas
    if (this.startX === 0 && this.startY === 0 && !this.dragging) return;

    this.currentX = e.clientX;
    this.currentY = e.clientY;

    const dx = this.currentX - this.startX;
    const dy = this.currentY - this.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!this.dragging && distance >= MIN_DRAG_DISTANCE) {
      this.dragging = true;
    }

    if (this.dragging) {
      this.updateBoxElement();
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button !== 0) return;
    if (!this.enabled) return;

    if (this.dragging) {
      this.resolveSelection();
    }

    this.cancelDrag();
  }

  // -----------------------------------------------------------------------
  // Selection rectangle visual
  // -----------------------------------------------------------------------

  /** Create the overlay div that visualizes the selection box. */
  private createBoxElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.border = '1px dashed rgba(0, 255, 0, 0.8)';
    el.style.background = 'rgba(0, 255, 0, 0.08)';
    el.style.zIndex = '5';
    el.style.pointerEvents = 'none';
    el.style.display = 'none';
    el.style.boxSizing = 'border-box';
    document.body.appendChild(el);
    return el;
  }

  /** Update overlay position and size based on current drag coordinates. */
  private updateBoxElement(): void {
    const x = Math.min(this.startX, this.currentX);
    const y = Math.min(this.startY, this.currentY);
    const w = Math.abs(this.currentX - this.startX);
    const h = Math.abs(this.currentY - this.startY);

    this.boxEl.style.left = `${x}px`;
    this.boxEl.style.top = `${y}px`;
    this.boxEl.style.width = `${w}px`;
    this.boxEl.style.height = `${h}px`;
    this.boxEl.style.display = 'block';
  }

  /** Hide the overlay and reset drag state. */
  private cancelDrag(): void {
    this.dragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.boxEl.style.display = 'none';
  }

  // -----------------------------------------------------------------------
  // Selection resolution
  // -----------------------------------------------------------------------

  /**
   * Project a world position to screen-space pixel coordinates.
   */
  private projectToScreen(worldPos: THREE.Vector3): { x: number; y: number } {
    const v = worldPos.clone().project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  /**
   * Determine which player entities fall within the current selection rectangle
   * and fire the onSelectionChanged callback.
   */
  private resolveSelection(): void {
    // Compute the screen-space bounding box
    const x1 = Math.min(this.startX, this.currentX);
    const y1 = Math.min(this.startY, this.currentY);
    const x2 = Math.max(this.startX, this.currentX);
    const y2 = Math.max(this.startY, this.currentY);

    const entities = this.getSelectableEntities();
    const selectedEids: number[] = [];

    for (const entity of entities) {
      // Only select entities belonging to the local player
      if (entity.factionId !== this.playerFactionId) continue;

      // Check if the entity's screen position falls within the box
      if (
        entity.screenX >= x1 &&
        entity.screenX <= x2 &&
        entity.screenY >= y1 &&
        entity.screenY <= y2
      ) {
        selectedEids.push(entity.eid);
      }
    }

    this.onSelectionChanged(selectedEids);
  }
}
