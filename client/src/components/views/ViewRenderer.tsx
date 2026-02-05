import { useState, useEffect } from "react";
import { viewRegistry } from "@/core/registry/ViewRegistry";
import type { ViewType } from "@/core/registry/ViewRegistry";
import ListView from "./ListView";
import FormView from "./FormView";
import KanbanView from "./KanbanView";
import MainView from "./MainView";

interface ViewRendererProps {
  model: string;
  type: ViewType;
  context?: Record<string, unknown>;
}

export default function ViewRenderer({
  model,
  type,
  context = {},
}: ViewRendererProps) {
  const [isLoading] = useState(false);

  const viewDef = viewRegistry.getView(model, type);
  console.log(
    `ViewRenderer: [${model}/${type}] -> ${viewDef ? viewDef.id : "NOT FOUND"}`,
  );

  // If view is not found, it might be in a deferred module
  useEffect(() => {
    if (!viewDef && !isLoading) {
      // In a 40k+ feature system, this is where we'd call manifestLoader.ensureLoaded(moduleName)
      // after resolving which module contains this specific view metadata.
    }
  }, [model, type, viewDef, isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!viewDef) {
    return (
      <div className="p-8 text-center text-gray-500 font-sans">
        <p className="font-bold text-gray-400">
          No {type} view found for model: {model}
        </p>
        <p className="mt-2 text-sm italic text-gray-400 opacity-60">
          The $O(1)$ registry index is active but this specific metadata is
          missing.
        </p>
      </div>
    );
  }

  // Map the metadata architecture to the actual implementation
  switch (viewDef.type) {
    case "list":
      return <ListView arch={viewDef.arch} model={model} context={context} />;
    case "form":
      return <FormView arch={viewDef.arch} model={model} context={context} />;
    case "kanban":
      return <KanbanView arch={viewDef.arch} model={model} context={context} />;
    case "main":
      return <MainView arch={viewDef.arch} model={model} context={context} />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Unknown view type: {viewDef.type}
        </div>
      );
  }
}
