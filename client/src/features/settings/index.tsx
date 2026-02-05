import type { FeatureDefinition } from "@/core/registry/types";
import { Settings } from "lucide-react";
import SettingsMain from "./components/SettingsMain";

export const SettingsFeature: FeatureDefinition = {
  id: "settings",
  name: "Settings",

  navItems: [
    {
      id: "nav-settings",
      label: "Settings",
      icon: <Settings size={20} />,
      order: 100, // Bottom
      path: "/settings",
    },
  ],

  routes: [
    {
      path: "/settings",
      element: <SettingsMain />,
    },
  ],

  viewComponent: <SettingsMain />,

  init: () => {
    // Optional: listen for events if needed
  },
};
