import type { FeatureManifest } from "@/core/manifest/types";
import { viewRegistry } from "@/core/registry/ViewRegistry";

export const manifest: FeatureManifest = {
  name: "ai_processor",
  version: "1.0.0",
  depends: ["documents"],
  navItems: [],
};

// Example: Extend the document list view to add an AI Summary field
viewRegistry.extendView({
  inherit_id: "documents.document_list",
  arch: [
    {
      action: "insert_after",
      xpath: "//field[@name='name']",
      content: {
        name: "ai_summary",
        label: "AI Summary",
        type: "text",
      },
    },
  ],
});
