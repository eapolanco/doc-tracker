import { FileText, HardDrive, Cloud } from "lucide-react";
import DocumentList from "./views/DocumentList";
import type { FeatureDefinition } from "@/core/registry/types";
import { eventBus } from "@/core/services/EventBus";

export const DocumentsFeature: FeatureDefinition = {
  id: "docs",
  name: "Documents",
  navItems: [
    {
      id: "all-docs",
      label: "All Documents",
      icon: <FileText size={18} />,
      section: "OVERVIEW",
      order: 10,
      onClick: () => {
        eventBus.emit("docs:filter", null);
        eventBus.emit("navigation:feature", "docs");
      },
    },
    {
      id: "local",
      label: "Local Drive",
      icon: <HardDrive size={18} />,
      section: "STORAGE",
      order: 10,
      onClick: () => {
        eventBus.emit("docs:filter", "local");
        eventBus.emit("navigation:feature", "docs");
      },
    },
    {
      id: "onedrive",
      label: "OneDrive",
      icon: <Cloud size={18} />,
      section: "STORAGE",
      order: 20,
      onClick: () => {
        eventBus.emit("docs:filter", "onedrive");
        eventBus.emit("navigation:feature", "docs");
      },
    },
    {
      id: "google",
      label: "Google Drive",
      icon: <Cloud size={18} />,
      section: "STORAGE",
      order: 30,
      onClick: () => {
        eventBus.emit("docs:filter", "google");
        eventBus.emit("navigation:feature", "docs");
      },
    },
  ],
  viewComponent: <DocumentList />,
};
