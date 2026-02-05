import type { FeatureManifest } from "@/core/manifest/types";
import { viewRegistry } from "@/core/registry/ViewRegistry";
import HistoryMainView from "./views/HistoryMainView";

export const manifest: FeatureManifest = {
  name: "history",
  version: "1.0.0",
  depends: ["base"],
  navItems: [
    {
      id: "history",
      label: "History",
      icon: "Clock",
      section: "MODULES",
      order: 20,
      action: {
        type: "view",
        model: "history",
        viewType: "main",
      },
    },
  ],
};

viewRegistry.registerView({
  id: "history.history_main",
  model: "history",
  type: "main",
  arch: {
    component: HistoryMainView,
    props: {},
  },
  priority: 10,
});
