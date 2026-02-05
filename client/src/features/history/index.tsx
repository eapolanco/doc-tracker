import type { FeatureDefinition } from "@/core/registry/types";
import { Clock } from "lucide-react";
import HistoryMain from "./components/HistoryMain";
import { AppEventBus } from "@/core/services/EventBus";

export const HistoryFeature: FeatureDefinition = {
  id: "history",
  name: "Audit History",

  // Navigation for the Sidebar
  navItems: [
    {
      id: "nav-history",
      label: "History",
      icon: <Clock size={20} />,
      order: 30, // Position in sidebar
      path: "/history",
    },
  ],

  // Route definition (future-proof)
  routes: [
    {
      path: "/history",
      element: <HistoryMain />,
    },
  ],

  // Component to render in the current "Tabs" architecture
  viewComponent: <HistoryMain />,

  // Initialization: Listen for events to refresh history
  init: ({ events }: { events: AppEventBus }) => {
    // If a document is uploaded or deleted, we should probably invalidate cache or refresh
    // For now, we just log it. In a real app, we might trigger a refetch if we used a global store (like React Query).
    events.on("DOCUMENT_UPLOADED", () => {
      console.log(
        "[HistoryFeature] Document uploaded, history view might need refresh.",
      );
    });
  },
};
