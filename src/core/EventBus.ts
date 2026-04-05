type Listener<T = unknown> = (data: T) => void;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export class EventBus<EventMap = Record<string, unknown>> {
  private listeners = new Map<keyof EventMap, Set<Listener>>();

  on<K extends keyof EventMap>(event: K, callback: Listener<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Listener);
  }

  off<K extends keyof EventMap>(event: K, callback: Listener<EventMap[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as Listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        cb(data);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton instance typed with game events
// ---------------------------------------------------------------------------

import type { GameEvents } from '../types/index';

/** Global event bus for cross-system communication. */
export const eventBus = new EventBus<GameEvents>();
