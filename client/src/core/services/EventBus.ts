import { ReactNode } from "react";

/**
 * Simple typed Event Bus implementation.
 * Allows features to communicate without direct dependencies.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler<T = any> = (payload: T) => void;

export class AppEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<string, Handler<any>[]> = new Map();

  /**
   * Subscribe to an event
   */
  on<T>(event: string, handler: Handler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)?.push(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off<T>(event: string, handler: Handler<T>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event with data
   */
  emit<T>(event: string, payload: T): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(
            `[EventBus] Error in handler for event "${event}":`,
            error,
          );
        }
      });
    }
  }
}

// Singleton instance
export const eventBus = new AppEventBus();
