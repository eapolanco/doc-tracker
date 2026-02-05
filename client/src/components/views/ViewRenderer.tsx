import { viewRegistry, ViewType } from "@/core/registry/ViewRegistry";
import ListView from "./ListView";
import FormView from "./FormView";
import KanbanView from "./KanbanView";
import MainView from "./MainView";

interface ViewRendererProps {
  model: string;
  type: ViewType;
  context?: any;
}

export default function ViewRenderer({
  model,
  type,
  context = {},
}: ViewRendererProps) {
  const viewDef = viewRegistry.getView(model, type);

  if (!viewDef) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>
          No {type} view found for model: {model}
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
