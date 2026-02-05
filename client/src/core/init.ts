import { manifestLoader } from "@/core/manifest/ManifestLoader";

// Import all manifests
// In a production system, this would use Vite's import.meta.glob
// or a build-time script to auto-discover manifests
import { manifest as documentsManifest } from "@/features/documents/manifest";
// TODO: Fix TypeScript module resolution for these manifests
// import { manifest as historyManifest } from "@/features/history/manifest";
// import { manifest as settingsManifest } from "@/features/settings/manifest";
// import { manifest as trashManifest } from "@/features/trash/manifest";
import { manifest as aiProcessorManifest } from "@/features/ai_processor/manifest";

export async function initializeModules() {
  // Load manifests in dependency order
  await manifestLoader.loadManifest(documentsManifest, "/features/documents");
  // await manifestLoader.loadManifest(historyManifest, "/features/history");
  // await manifestLoader.loadManifest(settingsManifest, "/features/settings");
  // await manifestLoader.loadManifest(trashManifest, "/features/trash");

  // Load extension modules
  await manifestLoader.loadManifest(
    aiProcessorManifest,
    "/features/ai_processor",
  );

  console.log("✅ All modules loaded");
  console.log("📊 Registered views:", manifestLoader.getAllManifests().length);
}

// Auto-discovery version (for future implementation)
/*
export async function initializeModules() {
  const manifests = import.meta.glob('/src/features/*\/manifest.ts');
  
  for (const path in manifests) {
    const module = await manifests[path]();
    const basePath = path.replace('/manifest.ts', '');
    await manifestLoader.loadManifest(module.manifest, basePath);
  }
}
*/
