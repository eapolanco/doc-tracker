import type { FeatureManifest } from "@/core/manifest/types";
import { viewRegistry } from "@/core/registry/ViewRegistry";
import TrashMain from "./components/TrashMain";

export const manifest: FeatureManifest = {
  name: "trash",
  version: "1.0.0",
  depends: ["base"],
  navItems: [
    {
      id: "trash",
      label: "Trash",
      icon: "Trash2",
      section: "MODULES",
      order: 40,
      action: {
        type: "view",
        model: "trash",
        viewType: "main",
      },
    },
  ],
};

viewRegistry.registerView({
  id: "trash.trash_main",
  model: "trash",
  type: "main",
  arch: {
    component: TrashMain,
    props: {},
  },
  priority: 10,
});
