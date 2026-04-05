/**
 * SelectionManager.ts
 * Handles unit selection logic: click select (raycasting), box select
 * (2D rectangle -> 3D frustum test), shift-click append, and deselection.
 */

import * as THREE from 'three';
import type { InputManager, InputSnapshot } from './InputManager';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of units that can be selected at once. */
const MAX_SELECTION = 50;

/** Minimum drag distance in pixels to trigger box select instead of click. */
const BOX_SELECT_MIN_PX = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectableEntity {
  /** ECS entity id. */
  eid: number;
  /** Faction id (0 = player / orange, 1 = AI / blue). */
  factionId: number;
  /** Three.js Object3D root of the unit mesh. */
  object: THREE.Object3D;
  /** Whether this is a unit (true) or building (false). */
  isUnit: boolean;
}

export interface SelectionState {
  /** Currently selected entity ids. */
  selected: number[];
  /** Whether the selection changed this frame. */
  changed: boolean;
}

// ---------------------------------------------------------------------------
// SelectionManager
// ---------------------------------------------------------------------------

export class SelectionManager {
  private inputManager: InputManager;
  /** The faction id of the local player. */
  private playerFactionId: number;

  /** All entities that can be selected (registered by entity spawning code). */
  private selectables: SelectableEntity[] = [];

  /** Current selection. */
  private selected = new Set<number>();
  private selectionChanged = false;

  /** Raycaster for click selection. */
  private raycaster = new THREE.Raycaster();
  private _ndc = new THREE.Vector2();

  /** Cached array to avoid allocations. */
  private _hitTargets: THREE.Object3D[] = [];

  constructor(inputManager: InputManager, playerFactionId: number) {
    this.inputManager = inputManager;
    this.playerFactionId = playerFactionId;
  }

  // -----------------------------------------------------------------------
  // Entity registration
  // -----------------------------------------------------------------------

  /**
   * Register an entity so it can be selected.
   * Called when a unit or building spawns.
   */
  register(entity: SelectableEntity): void {
    // Avoid duplicate registration
    const exists = this.selectables.find((s) => s.eid === entity.eid);
    if (!exists) {
      this.selectables.push(entity);
    }
  }

  /**
   * Unregister an entity (on death / removal).
   * Also removes it from the current selection.
   */
  unregister(eid: number): void {
    const idx = this.selectables.findIndex((s) => s.eid === eid);
    if (idx !== -1) {
      this.selectables.splice(idx, 1);
    }
    if (this.selected.delete(eid)) {
      this.selectionChanged = true;
      this.syncToInputManager();
    }
  }

  // -----------------------------------------------------------------------
  // Per-frame update
  // -----------------------------------------------------------------------

  /**
   * Process input and update the selection state.
   * Call this once per frame after InputManager.snapshot().
   */
  update(input: InputSnapshot): SelectionState {
    this.selectionChanged = false;

    // Escape = deselect all
    if (input.keysDown.has('Escape')) {
      if (this.selected.size > 0) {
        this.selected.clear();
        this.selectionChanged = true;
        this.syncToInputManager();
      }
      return this.getState();
    }

    // Box select (drag)
    if (input.leftClicked && this.wasDrag(input)) {
      this.handleBoxSelect(input);
      return this.getState();
    }

    // Click select
    if (input.leftClicked && !this.wasDrag(input)) {
      this.handleClickSelect(input);
      return this.getState();
    }

    return this.getState();
  }

  // -----------------------------------------------------------------------
  // Click select
  // -----------------------------------------------------------------------

  private handleClickSelect(input: InputSnapshot): void {
    const camera = this.inputManager.getCamera();
    const canvas = this.inputManager.getCanvas();
    const rect = canvas.getBoundingClientRect();

    this._ndc.x = ((input.mouseScreenX - rect.left) / rect.width) * 2 - 1;
    this._ndc.y = -((input.mouseScreenY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this._ndc, camera);

    // Collect all Object3Ds for raycasting
    this._hitTargets.length = 0;
    for (const s of this.selectables) {
      this._hitTargets.push(s.object);
    }

    const intersections = this.raycaster.intersectObjects(this._hitTargets, true);
    const shiftHeld = input.keysDown.has('ShiftLeft') || input.keysDown.has('ShiftRight');

    if (intersections.length > 0) {
      // Find the selectable entity that owns the hit object
      const hit = intersections[0];
      const entity = this.findOwnerEntity(hit.object);

      if (entity) {
        if (shiftHeld) {
          // Toggle in/out of selection
          if (this.selected.has(entity.eid)) {
            this.selected.delete(entity.eid);
          } else if (entity.factionId === this.playerFactionId && this.selected.size < MAX_SELECTION) {
            this.selected.add(entity.eid);
          }
        } else {
          // Replace selection
          this.selected.clear();
          // Allow selecting enemy units (for info display) but only own units for commands
          this.selected.add(entity.eid);
        }
        this.selectionChanged = true;
      }
    } else if (!shiftHeld) {
      // Click on empty ground = deselect all
      if (this.selected.size > 0) {
        this.selected.clear();
        this.selectionChanged = true;
      }
    }

    if (this.selectionChanged) {
      this.syncToInputManager();
    }
  }

  // -----------------------------------------------------------------------
  // Box select
  // -----------------------------------------------------------------------

  private handleBoxSelect(input: InputSnapshot): void {
    const camera = this.inputManager.getCamera();
    const canvas = this.inputManager.getCanvas();
    const rect = canvas.getBoundingClientRect();

    // Compute screen-space bounding box
    const x1 = Math.min(input.dragStartX, input.dragEndX);
    const y1 = Math.min(input.dragStartY, input.dragEndY);
    const x2 = Math.max(input.dragStartX, input.dragEndX);
    const y2 = Math.max(input.dragStartY, input.dragEndY);

    const shiftHeld = input.keysDown.has('ShiftLeft') || input.keysDown.has('ShiftRight');

    if (!shiftHeld) {
      this.selected.clear();
    }

    // Project each selectable entity to screen space and check if inside box
    const _worldPos = new THREE.Vector3();
    const _screenPos = new THREE.Vector3();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;

    for (const entity of this.selectables) {
      // Only select own faction units
      if (entity.factionId !== this.playerFactionId) continue;
      if (!entity.isUnit) continue;
      if (this.selected.size >= MAX_SELECTION) break;

      // Get world position
      entity.object.getWorldPosition(_worldPos);

      // Project to screen
      _screenPos.copy(_worldPos);
      _screenPos.project(camera);
      const sx = (_screenPos.x * halfW) + halfW + rect.left;
      const sy = (-_screenPos.y * halfH) + halfH + rect.top;

      // Check if behind camera
      if (_screenPos.z > 1) continue;

      // Check if inside selection rectangle
      if (sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2) {
        this.selected.add(entity.eid);
      }
    }

    this.selectionChanged = true;
    this.syncToInputManager();
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Walk up the scene hierarchy to find which registered SelectableEntity
   * owns a given intersection target.
   */
  private findOwnerEntity(hitObject: THREE.Object3D): SelectableEntity | null {
    let current: THREE.Object3D | null = hitObject;
    while (current) {
      for (const entity of this.selectables) {
        if (entity.object === current) {
          return entity;
        }
      }
      current = current.parent;
    }
    return null;
  }

  /** Check if the last left-click came from a drag (box select) rather than a click. */
  private wasDrag(input: InputSnapshot): boolean {
    const dx = input.dragEndX - input.dragStartX;
    const dy = input.dragEndY - input.dragStartY;
    return Math.sqrt(dx * dx + dy * dy) > BOX_SELECT_MIN_PX;
  }

  /** Sync the internal selection to the InputManager for other systems to read. */
  private syncToInputManager(): void {
    this.inputManager.setSelectedEntities(Array.from(this.selected));
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Get the current selection state. */
  getState(): SelectionState {
    return {
      selected: Array.from(this.selected),
      changed: this.selectionChanged,
    };
  }

  /** Programmatically set the selection (e.g. from a control group). */
  setSelection(eids: number[]): void {
    this.selected.clear();
    for (const eid of eids) {
      if (this.selected.size >= MAX_SELECTION) break;
      this.selected.add(eid);
    }
    this.selectionChanged = true;
    this.syncToInputManager();
  }

  /** Check if an entity is currently selected. */
  isSelected(eid: number): boolean {
    return this.selected.has(eid);
  }

  /** Deselect all. */
  deselectAll(): void {
    if (this.selected.size > 0) {
      this.selected.clear();
      this.selectionChanged = true;
      this.syncToInputManager();
    }
  }

  /** Get the player faction id. */
  getPlayerFactionId(): number {
    return this.playerFactionId;
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  destroy(): void {
    this.selectables.length = 0;
    this.selected.clear();
  }
}
