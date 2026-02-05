import type { FeatureManifest } from "@/core/manifest/types";
import { viewRegistry } from "@/core/registry/ViewRegistry";
import DocumentList from "./views/DocumentList";

export const manifest: FeatureManifest = {
  name: "documents",
  version: "1.0.0",
  depends: ["base"],
  navItems: [
    {
      id: "docs_all",
      label: "All Documents",
      icon: "FileText",
      section: "DOCUMENTS",
      order: 0,
      action: {
        type: "view",
        model: "document",
        viewType: "main",
      },
    },
    {
      id: "docs_local",
      label: "Local Drive",
      icon: "HardDrive",
      section: "STORAGE",
      order: 10,
      action: {
        type: "view",
        model: "document",
        viewType: "main",
      },
    },
    {
      id: "docs_onedrive",
      label: "OneDrive",
      icon: "Cloud",
      section: "STORAGE",
      order: 11,
      action: {
        type: "view",
        model: "document",
        viewType: "main",
      },
    },
    {
      id: "docs_google",
      label: "Google Drive",
      icon: "Cloud",
      section: "STORAGE",
      order: 12,
      action: {
        type: "view",
        model: "document",
        viewType: "main",
      },
    },
  ],
};

// Register the main view (for backward compatibility)
// In the future, this would be a proper list/form view
viewRegistry.registerView({
  id: "documents.document_main",
  model: "document",
  type: "main",
  arch: {
    component: DocumentList,
    props: {},
  },
  priority: 10,
});

// Example: Register a list view for documents
viewRegistry.registerView({
  id: "documents.document_list",
  model: "document",
  type: "list",
  arch: {
    title: "Documents",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "category", label: "Category", type: "text" },
      { name: "lastModified", label: "Modified", type: "date" },
      { name: "status", label: "Status", type: "text" },
    ],
  },
  priority: 10,
});
