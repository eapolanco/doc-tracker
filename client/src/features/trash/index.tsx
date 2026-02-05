import type { FeatureDefinition } from "@/core/registry/types";
import { Trash2 } from "lucide-react";
import TrashMain from "./components/TrashMain";

export const TrashFeature: FeatureDefinition = {
  id: "trash",
  name: "Trash",

  navItems: [
    {
      id: "nav-trash",
      label: "Trash",
      icon: <Trash2 size={20} />,
      order: 90, // Near bottom
      path: "/trash",
    },
  ],

  routes: [
    {
      path: "/trash",
      element: <TrashMain />,
    },
  ],

  viewComponent: <TrashMain />,

  init: () => {
    // Listen for delete events?
  },
};
