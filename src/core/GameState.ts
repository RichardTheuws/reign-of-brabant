/**
 * GameState.ts -- Finite State Machine for game flow.
 *
 * States: MENU → FACTION_SELECT → LOADING → TUTORIAL / PLAYING → GAME_OVER → MENU
 * Only one state is active at a time.
 * Each state has enter(), update(dt), exit() lifecycle hooks.
 * Transitions are triggered via the transition() method.
 */

// ---------------------------------------------------------------------------
// State enum
// ---------------------------------------------------------------------------

export enum GameStateId {
  MENU = 'MENU',
  FACTION_SELECT = 'FACTION_SELECT',
  CAMPAIGN_SELECT = 'CAMPAIGN_SELECT',
  BRIEFING = 'BRIEFING',
  LOADING = 'LOADING',
  TUTORIAL = 'TUTORIAL',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

export interface IGameState {
  readonly id: GameStateId;
  enter(context: GameStateContext): void;
  update(dt: number, context: GameStateContext): void;
  exit(context: GameStateContext): void;
}

// ---------------------------------------------------------------------------
// Context passed to every state
// ---------------------------------------------------------------------------

export interface GameStateContext {
  /** Request a state transition. */
  transition(to: GameStateId, data?: Record<string, unknown>): void;
  /** Transition data from the previous state. */
  transitionData: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// State Machine
// ---------------------------------------------------------------------------

export class GameStateMachine {
  private states = new Map<GameStateId, IGameState>();
  private currentState: IGameState | null = null;
  private _currentId: GameStateId | null = null;
  private transitionData: Record<string, unknown> = {};
  private pendingTransition: { to: GameStateId; data: Record<string, unknown> } | null = null;

  private context: GameStateContext;

  /** Listeners notified on state change. */
  private listeners: Array<(from: GameStateId | null, to: GameStateId) => void> = [];

  constructor() {
    this.context = {
      transition: (to, data) => this.requestTransition(to, data ?? {}),
      transitionData: this.transitionData,
    };
  }

  /** Register a state implementation. */
  register(state: IGameState): void {
    this.states.set(state.id, state);
  }

  /** Get currently active state id. */
  get currentId(): GameStateId | null {
    return this._currentId;
  }

  /** Subscribe to state changes. */
  onChange(listener: (from: GameStateId | null, to: GameStateId) => void): void {
    this.listeners.push(listener);
  }

  /** Immediately enter a state (used for initial boot). */
  start(initialState: GameStateId): void {
    const state = this.states.get(initialState);
    if (!state) throw new Error(`[GameStateMachine] Unknown state: ${initialState}`);
    this._currentId = initialState;
    this.currentState = state;
    this.context.transitionData = {};
    state.enter(this.context);
    for (const listener of this.listeners) listener(null, initialState);
  }

  /** Called every frame -- delegates to current state + processes pending transitions. */
  update(dt: number): void {
    // Process pending transition (deferred to avoid mid-update issues)
    if (this.pendingTransition) {
      const { to, data } = this.pendingTransition;
      this.pendingTransition = null;
      this.doTransition(to, data);
    }

    if (this.currentState) {
      this.currentState.update(dt, this.context);
    }
  }

  /** Request a transition (processed at start of next update). */
  requestTransition(to: GameStateId, data: Record<string, unknown> = {}): void {
    this.pendingTransition = { to, data };
  }

  /** Execute the transition. */
  private doTransition(to: GameStateId, data: Record<string, unknown>): void {
    const nextState = this.states.get(to);
    if (!nextState) {
      console.error(`[GameStateMachine] Unknown state: ${to}`);
      return;
    }

    const from = this._currentId;

    // Exit current
    if (this.currentState) {
      this.currentState.exit(this.context);
    }

    // Enter next
    this.transitionData = data;
    this.context.transitionData = data;
    this._currentId = to;
    this.currentState = nextState;
    nextState.enter(this.context);

    for (const listener of this.listeners) listener(from, to);
    console.log(`[GameState] ${from ?? 'null'} → ${to}`);
  }
}
