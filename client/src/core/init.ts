import { manifestLoader } from "@/core/manifest/ManifestLoader";

// Import all manifests
// In a production system, this would use Vite's import.meta.glob
// or a build-time script to auto-discover manifests
import { manifest as documentsManifest } from "@/features/documents/manifest";
import { manifest as historyManifest } from "@/features/history/manifest";
import { manifest as settingsManifest } from "@/features/settings/manifest";
import { manifest as trashManifest } from "@/features/trash/manifest";
import { manifest as aiProcessorManifest } from "@/features/ai_processor/manifest";

export async function initializeModules() {
  const coreManifests = [
    { m: documentsManifest, path: "/features/documents" },
    { m: historyManifest, path: "/features/history" },
    { m: settingsManifest, path: "/features/settings" },
    { m: trashManifest, path: "/features/trash" },
    { m: aiProcessorManifest, path: "/features/ai_processor" },
  ];

  for (const item of coreManifests) {
    try {
      console.log(`[init] Loading module: ${item.m.name}`);
      await manifestLoader.loadManifest(item.m, item.path);
    } catch (err) {
      console.error(
        `[init] Failed to load module ${item.m?.name || item.path}:`,
        err,
      );
    }
  }

  console.log("✅ All modules initialized");
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
