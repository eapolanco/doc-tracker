import type { FeatureDefinition, FeatureNavItem } from "./types";
import { eventBus, AppEventBus } from "../services/EventBus";

class FeatureRegistry {
  private features: Map<string, FeatureDefinition> = new Map();
  private initialized = false;

  /**
   * Register a new feature with the application.
   */
  register(feature: FeatureDefinition) {
    if (this.features.has(feature.id)) {
      console.warn(
        `[Registry] Feature "${feature.id}" is already registered. Overwriting.`,
      );
    }
    console.log(`[Registry] Registering feature: ${feature.id}`);
    this.features.set(feature.id, feature);

    // If app is already running, initialize immediately
    if (this.initialized && feature.init) {
      feature.init({ events: eventBus });
    }
  }

  /**
   * Get all registered features.
   */
  getAll(): FeatureDefinition[] {
    return Array.from(this.features.values());
  }

  /**
   * Get a specific feature by ID.
   */
  get(id: string): FeatureDefinition | undefined {
    return this.features.get(id);
  }

  /**
   * Get all navigation items from all features, sorted by order.
   */
  getNavItems(): FeatureNavItem[] {
    return Array.from(this.features.values())
      .flatMap((f) => f.navItems || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Get all routes from all features.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRoutes(): any[] {
    return Array.from(this.features.values()).flatMap((f) => f.routes || []);
  }

  /**
   * Initialize all registered features.
   * Should be called once at app startup.
   */
  initializeFeatures(events: AppEventBus = eventBus) {
    if (this.initialized) return;

    this.features.forEach((feature) => {
      if (feature.init) {
        try {
          feature.init({ events });
        } catch (err) {
          console.error(
            `[Registry] Failed to initialize feature "${feature.id}":`,
            err,
          );
        }
      }
    });

    this.initialized = true;
    console.log("[Registry] All features initialized.");
  }
}

// Singleton instance
export const appRegistry = new FeatureRegistry();
