import type { FeatureManifest, NavItemDefinition } from "./types";

class ManifestLoader {
  private manifests: Map<string, FeatureManifest> = new Map();
  private deferredManifests: Map<string, string> = new Map(); // name -> url/path
  private loadOrder: string[] = [];
  private loadingPromises: Map<string, Promise<void>> = new Map();

  /**
   * Registers a manifest that will be loaded only when needed.
   */
  registerDeferredManifest(name: string, path: string) {
    this.deferredManifests.set(name, path);
  }

  async loadManifest(manifest: FeatureManifest, basePath: string) {
    // Check dependencies
    for (const dep of manifest.depends) {
      if (!this.manifests.has(dep)) {
        if (this.deferredManifests.has(dep)) {
          console.log(`Auto-loading deferred dependency: ${dep}`);
          await this.ensureLoaded(dep);
        } else {
          console.warn(
            `Module ${manifest.name} depends on ${dep} which is not loaded`,
          );
        }
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

    // Add to load order if not already there
    if (!this.loadOrder.includes(manifest.name)) {
      this.loadOrder.push(manifest.name);
    }
  }

  /**
   * Ensures a specific module is loaded, triggerring a dynamic import if deferred.
   */
  async ensureLoaded(moduleName: string): Promise<void> {
    if (this.manifests.has(moduleName)) return;

    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    const path = this.deferredManifests.get(moduleName);
    if (!path) {
      throw new Error(`Module ${moduleName} is not registered`);
    }

    const loadPromise = (async () => {
      try {
        // Use Vite's dynamic import pattern
        const module = await import(/* @vite-ignore */ `${path}/manifest.ts`);
        await this.loadManifest(module.manifest, path);
      } catch (err) {
        console.error(`Failed to load deferred module ${moduleName}:`, err);
        throw err;
      } finally {
        this.loadingPromises.delete(moduleName);
      }
    })();

    this.loadingPromises.set(moduleName, loadPromise);
    return loadPromise;
  }

  private async loadViewDefinition(basePath: string, viewPath: string) {
    try {
      // Logic for dynamic view registration could go here
      // For now, we assume views register themselves when the manifest is processed
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

  /**
   * For 40,000 items, we would likely fetch nav items from an API
   * or use a virtualized menu. This getter returns currently active ones.
   */
  getNavItems(): Array<NavItemDefinition & { module: string }> {
    const allItems: Array<NavItemDefinition & { module: string }> = [];
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
