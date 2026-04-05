/**
 * InputManager.ts
 * Centralized input handling: mouse, keyboard, raycasting.
 * Captures DOM events and exposes clean per-frame state for game systems.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAG_THRESHOLD_PX = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputSnapshot {
  // Persistent state
  mouseScreenX: number;
  mouseScreenY: number;
  mouseWorldX: number;
  mouseWorldZ: number;
  keysDown: ReadonlySet<string>;
  leftButtonDown: boolean;
  rightButtonDown: boolean;

  // Per-frame events (true only on the frame they fire)
  leftClicked: boolean;
  rightClicked: boolean;
  scrollDelta: number;

  // Drag state
  dragActive: boolean;
  dragStartX: number;
  dragStartY: number;
  dragEndX: number;
  dragEndY: number;
}

// ---------------------------------------------------------------------------
// InputManager
// ---------------------------------------------------------------------------

export class InputManager {
  // DOM target
  private canvas: HTMLCanvasElement;
  private camera: THREE.PerspectiveCamera;
  private terrainPlane: THREE.Plane;
  private raycaster = new THREE.Raycaster();

  // Mouse state
  private _mouseScreenX = 0;
  private _mouseScreenY = 0;
  private _mouseWorldX = 0;
  private _mouseWorldZ = 0;
  private _leftButtonDown = false;
  private _rightButtonDown = false;
  private _leftClicked = false;
  private _rightClicked = false;
  private _scrollDelta = 0;

  // Keyboard state
  private _keysDown = new Set<string>();

  // Drag state
  private _dragActive = false;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragEndX = 0;
  private _dragEndY = 0;
  private _leftPressX = 0;
  private _leftPressY = 0;

  // Selected entities (managed by SelectionManager, stored here for convenience)
  private _selectedEntities: number[] = [];

  // Reusable objects
  private _ndc = new THREE.Vector2();
  private _intersection = new THREE.Vector3();

  // Bound handlers (for removal)
  private handleMouseDown: (e: MouseEvent) => void;
  private handleMouseUp: (e: MouseEvent) => void;
  private handleMouseMove: (e: MouseEvent) => void;
  private handleWheel: (e: WheelEvent) => void;
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;
  private handleContextMenu: (e: MouseEvent) => void;
  private handleBlur: () => void;

  constructor(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera) {
    this.canvas = canvas;
    this.camera = camera;
    // Terrain ground plane at y=0 for raycasting
    this.terrainPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Bind event handlers
    this.handleMouseDown = this.onMouseDown.bind(this);
    this.handleMouseUp = this.onMouseUp.bind(this);
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleWheel = this.onWheel.bind(this);
    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleKeyUp = this.onKeyUp.bind(this);
    this.handleContextMenu = this.onContextMenu.bind(this);
    this.handleBlur = this.onBlur.bind(this);

    this.bindEvents();
  }

  // -----------------------------------------------------------------------
  // Event binding
  // -----------------------------------------------------------------------

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('blur', this.handleBlur);
  }

  private unbindEvents(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('blur', this.handleBlur);
  }

  // -----------------------------------------------------------------------
  // DOM event handlers
  // -----------------------------------------------------------------------

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this._leftButtonDown = true;
      this._leftPressX = e.clientX;
      this._leftPressY = e.clientY;
      this._dragStartX = e.clientX;
      this._dragStartY = e.clientY;
      this._dragEndX = e.clientX;
      this._dragEndY = e.clientY;
      this._dragActive = false;
    } else if (e.button === 2) {
      this._rightButtonDown = true;
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this._leftButtonDown = false;
      if (!this._dragActive) {
        this._leftClicked = true;
      }
      this._dragActive = false;
    } else if (e.button === 2) {
      this._rightButtonDown = false;
      this._rightClicked = true;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    this._mouseScreenX = e.clientX;
    this._mouseScreenY = e.clientY;

    // Update world position via raycasting
    this.updateWorldPosition();

    // Check for drag start
    if (this._leftButtonDown && !this._dragActive) {
      const dx = e.clientX - this._leftPressX;
      const dy = e.clientY - this._leftPressY;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) {
        this._dragActive = true;
      }
    }

    if (this._dragActive) {
      this._dragEndX = e.clientX;
      this._dragEndY = e.clientY;
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this._scrollDelta += e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Prevent browser defaults for game keys
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Escape'].includes(e.code)) {
      e.preventDefault();
    }
    this._keysDown.add(e.code);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this._keysDown.delete(e.code);
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
  }

  private onBlur(): void {
    // Clear all held keys/buttons when window loses focus
    this._keysDown.clear();
    this._leftButtonDown = false;
    this._rightButtonDown = false;
    this._dragActive = false;
  }

  // -----------------------------------------------------------------------
  // Raycasting
  // -----------------------------------------------------------------------

  private updateWorldPosition(): void {
    const rect = this.canvas.getBoundingClientRect();
    this._ndc.x = ((this._mouseScreenX - rect.left) / rect.width) * 2 - 1;
    this._ndc.y = -((this._mouseScreenY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this._ndc, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.terrainPlane, this._intersection);
    if (hit) {
      this._mouseWorldX = this._intersection.x;
      this._mouseWorldZ = this._intersection.z;
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Get the current mouse world position (raycasted onto terrain plane). */
  getMouseWorldPosition(): THREE.Vector3 {
    return this._intersection.clone();
  }

  /** Get the list of currently selected entity ids. */
  getSelectedEntities(): number[] {
    return this._selectedEntities;
  }

  /** Set selected entities (called by SelectionManager). */
  setSelectedEntities(eids: number[]): void {
    this._selectedEntities = eids;
  }

  /** Check if a key is currently held down (use KeyboardEvent.code values). */
  isKeyDown(code: string): boolean {
    return this._keysDown.has(code);
  }

  /** Get the THREE.Raycaster for external use (e.g. unit picking). */
  getRaycaster(): THREE.Raycaster {
    const rect = this.canvas.getBoundingClientRect();
    this._ndc.x = ((this._mouseScreenX - rect.left) / rect.width) * 2 - 1;
    this._ndc.y = -((this._mouseScreenY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this._ndc, this.camera);
    return this.raycaster;
  }

  /**
   * Take a snapshot of the current input state.
   * This is the canonical way for systems to read input.
   */
  snapshot(): InputSnapshot {
    return {
      mouseScreenX: this._mouseScreenX,
      mouseScreenY: this._mouseScreenY,
      mouseWorldX: this._mouseWorldX,
      mouseWorldZ: this._mouseWorldZ,
      keysDown: new Set(this._keysDown),
      leftButtonDown: this._leftButtonDown,
      rightButtonDown: this._rightButtonDown,
      leftClicked: this._leftClicked,
      rightClicked: this._rightClicked,
      scrollDelta: this._scrollDelta,
      dragActive: this._dragActive,
      dragStartX: this._dragStartX,
      dragStartY: this._dragStartY,
      dragEndX: this._dragEndX,
      dragEndY: this._dragEndY,
    };
  }

  /**
   * Reset per-frame flags. Must be called once at the end of each frame
   * after all systems have consumed the snapshot.
   */
  resetPerFrame(): void {
    this._leftClicked = false;
    this._rightClicked = false;
    this._scrollDelta = 0;
  }

  /** Get the canvas element (needed by SelectionManager for coordinate math). */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /** Get the camera (needed by SelectionManager for projection). */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  destroy(): void {
    this.unbindEvents();
    this._keysDown.clear();
    this._selectedEntities.length = 0;
  }
}
