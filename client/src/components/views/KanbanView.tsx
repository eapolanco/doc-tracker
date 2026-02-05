import Page from "@/components/Page";

interface KanbanStage {
  id: string;
  name: string;
}

interface KanbanArch {
  title?: string;
  stages?: KanbanStage[];
  [key: string]: unknown;
}

interface KanbanViewProps {
  arch: KanbanArch;
  model: string;
  context?: Record<string, unknown>;
}

export default function KanbanView({ arch, model }: KanbanViewProps) {
  const { title, stages } = arch;

  return (
    <Page title={title || `${model} Kanban`}>
      <div className="flex-1 overflow-x-auto p-8">
        <div className="flex gap-4 h-full">
          {stages?.map((stage) => (
            <div
              key={stage.id}
              className="shrink-0 w-80 bg-gray-50 rounded-xl p-4"
            >
              <h3 className="font-semibold text-gray-900 mb-4">{stage.name}</h3>
              <div className="space-y-3">
                {/* Cards would be rendered here based on records */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500">No items</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
