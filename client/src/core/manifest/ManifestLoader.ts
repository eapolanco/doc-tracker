import { FeatureManifest } from "./types";
import { viewRegistry } from "@/core/registry/ViewRegistry";

class ManifestLoader {
  private manifests: Map<string, FeatureManifest> = new Map();
  private loadOrder: string[] = [];

  async loadManifest(manifest: FeatureManifest, basePath: string) {
    // Check dependencies
    for (const dep of manifest.depends) {
      if (!this.manifests.has(dep)) {
        console.warn(
          `Module ${manifest.name} depends on ${dep} which is not loaded`,
        );
      }
    }

    // Store manifest
    this.manifests.set(manifest.name, manifest);

    // Load views
    if (manifest.views) {
      for (const viewPath of manifest.views) {
        await this.loadViewDefinition(basePath, viewPath);
      }
    }

    // Add to load order
    this.loadOrder.push(manifest.name);
  }

  private async loadViewDefinition(basePath: string, viewPath: string) {
    try {
      // In a real implementation, this would dynamically import the view file
      // For now, we'll assume views are registered programmatically
      console.log(`Loading view from ${basePath}/${viewPath}`);
    } catch (err) {
      console.error(`Failed to load view ${viewPath}:`, err);
    }
  }

  getManifest(name: string): FeatureManifest | undefined {
    return this.manifests.get(name);
  }

  getAllManifests(): FeatureManifest[] {
    return this.loadOrder.map((name) => this.manifests.get(name)!);
  }

  getNavItems() {
    const allItems: any[] = [];
    for (const manifest of this.manifests.values()) {
      if (manifest.navItems) {
        allItems.push(
          ...manifest.navItems.map((item) => ({
            ...item,
            module: manifest.name,
          })),
        );
      }
    }
    return allItems.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export const manifestLoader = new ManifestLoader();
