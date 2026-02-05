import { type ReactNode } from "react";
import { AppEventBus } from "../services/EventBus";

/**
 * Represents a logical section of the app (e.g., "Documents", "History", "Settings")
 */
export interface FeatureNavItem {
  id: string;
  label: string;
  icon?: ReactNode; // Icon component or element
  path?: string; // URL path (for future router)
  order?: number; // Display order in sidebar
  onClick?: () => void; // Optional handler if not just a link
}

/**
 * Defines a self-contained feature module.
 */
export interface FeatureDefinition {
  id: string; // Unique identifier (e.g., "documents", "auth")
  name?: string;

  /**
   * Navigation items this feature contributes to the Sidebar/Menu
   */
  navItems?: FeatureNavItem[];

  /**
   * Routes this feature handles (preparation for React Router)
   * We use 'any' for now to avoid dependency on react-router-dom types
   * until it is installed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routes?: any[];

  /**
   * Main component to render if this feature takes over the main view
   * (Useful for the current conditional rendering approach)
   */
  viewComponent?: ReactNode;

  /**
   * Global providers this feature needs to wrap the app in
   */
  providers?: React.FC<{ children: ReactNode }>[];

  /**
   * Initialization logic (subscribe to events, etc.)
   */
  init?: (params: { events: AppEventBus }) => void;
}
