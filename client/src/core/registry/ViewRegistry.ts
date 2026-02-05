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
  private extensions: ViewExtension[] = [];
  private cachedResolvedViews: Map<string, ViewDefinition> = new Map();

  registerView(view: ViewDefinition) {
    this.baseViews.set(view.id, view);
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
    let resolvedArch = JSON.parse(JSON.stringify(base.arch));
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
    // Find highest priority view for model/type
    const matchingViews = Array.from(this.baseViews.values())
      .filter((v) => v.model === model && v.type === type)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (matchingViews.length === 0) return undefined;
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
