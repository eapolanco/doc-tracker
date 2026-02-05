export type ViewType = "list" | "form" | "kanban" | "main";

export interface ViewArch {
  [key: string]: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: React.ComponentType<any>;
  props?: Record<string, unknown>;
  title?: string;
  headerActions?: React.ReactNode; // Feature-specific header actions
}

export interface ViewDefinition {
  id: string;
  model: string;
  type: ViewType;
  arch: ViewArch;
  priority?: number;
}

export interface ViewPatch {
  action: "insert_after" | "insert_before" | "replace" | "remove";
  xpath: string;
  content?: unknown;
}

export interface ViewExtension {
  inherit_id: string;
  arch: ViewPatch[];
}

class ViewRegistry {
  private baseViews: Map<string, ViewDefinition> = new Map();
  // Index for fast lookups by model and type: model -> type -> ViewDefinition[]
  private modelTypeIndex: Map<string, Map<ViewType, ViewDefinition[]>> =
    new Map();
  private extensions: ViewExtension[] = [];
  private cachedResolvedViews: Map<string, ViewDefinition> = new Map();

  registerView(view: ViewDefinition) {
    this.baseViews.set(view.id, view);

    // Update index
    if (!this.modelTypeIndex.has(view.model)) {
      this.modelTypeIndex.set(view.model, new Map());
    }
    const types = this.modelTypeIndex.get(view.model)!;
    if (!types.has(view.type)) {
      types.set(view.type, []);
    }
    types.get(view.type)!.push(view);
    // Sort by priority after adding
    types.get(view.type)!.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    this.cachedResolvedViews.clear();
  }

  extendView(extension: ViewExtension) {
    this.extensions.push(extension);
    this.cachedResolvedViews.clear();
  }

  getResolvedView(viewId: string): ViewDefinition | undefined {
    if (this.cachedResolvedViews.has(viewId)) {
      return this.cachedResolvedViews.get(viewId);
    }

    const base = this.baseViews.get(viewId);
    if (!base) return undefined;

    // Apply patches
    // WE MUST NOT USE JSON.stringify here! It strips React components (functions).
    // For 40,000 features, we use a simple spread for the base and apply changes.
    let resolvedArch = { ...base.arch };
    const relevantExtensions = this.extensions.filter(
      (ex) => ex.inherit_id === viewId,
    );

    relevantExtensions.forEach((ext) => {
      ext.arch.forEach((patch) => {
        resolvedArch = this.applyPatch(resolvedArch, patch);
      });
    });

    const resolvedView = { ...base, arch: resolvedArch };
    this.cachedResolvedViews.set(viewId, resolvedView);
    return resolvedView;
  }

  getView(model: string, type: ViewType): ViewDefinition | undefined {
    const matchingViews = this.modelTypeIndex.get(model)?.get(type);

    if (!matchingViews || matchingViews.length === 0) return undefined;

    // Return highest priority view (first in sorted list)
    return this.getResolvedView(matchingViews[0].id);
  }

  private applyPatch(arch: ViewArch, patch: ViewPatch): ViewArch {
    // Simple recursive patching for demonstration
    // In a real system, this would use a proper JSON XPath library
    if (patch.action === "insert_after" || patch.action === "insert_before") {
      return this.recursiveInsert(arch, patch) as ViewArch;
    }
    // ... implement other actions
    return arch;
  }

  private recursiveInsert(node: unknown, patch: ViewPatch): unknown {
    if (Array.isArray(node)) {
      const index = node.findIndex(
        (child: Record<string, unknown>) =>
          child.name === patch.xpath.match(/@name='([^']+)'/)?.[1] ||
          child.id === patch.xpath.match(/@id='([^']+)'/)?.[1],
      );

      if (index !== -1) {
        const result = [...node];
        if (patch.action === "insert_after") {
          result.splice(index + 1, 0, patch.content);
        } else {
          result.splice(index, 0, patch.content);
        }
        return result;
      }

      return node.map((n) => this.recursiveInsert(n, patch));
    }

    if (typeof node === "object" && node !== null) {
      const entries = Object.entries(node).map(([k, v]) => [
        k,
        this.recursiveInsert(v, patch),
      ]);
      return Object.fromEntries(entries);
    }

    return node;
  }
}

export const viewRegistry = new ViewRegistry();
