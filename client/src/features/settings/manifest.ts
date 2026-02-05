import type { FeatureManifest } from "@/core/manifest/types";
import { viewRegistry } from "@/core/registry/ViewRegistry";
import SettingsMain from "./components/SettingsMain";

export const manifest: FeatureManifest = {
  name: "settings",
  version: "1.0.0",
  depends: ["base"],
  navItems: [
    {
      id: "settings",
      label: "Settings",
      icon: "Settings",
      section: "MODULES",
      order: 30,
      action: {
        type: "view",
        model: "settings",
        viewType: "main",
      },
    },
  ],
};

viewRegistry.registerView({
  id: "settings.settings_main",
  model: "settings",
  type: "main",
  arch: {
    component: SettingsMain,
    props: {},
  },
  priority: 10,
});
