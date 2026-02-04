import type { HistoryItem } from "@/types";
import { format } from "date-fns";
import { FileText, RefreshCw, Trash2, Plus } from "lucide-react";

interface Props {
  history: HistoryItem[];
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "create":
      return <Plus size={14} />;
    case "update":
      return <RefreshCw size={14} />;
    case "delete":
      return <Trash2 size={14} />;
    case "sync":
      return <RefreshCw size={14} />;
    default:
      return <FileText size={14} />;
  }
};

export default function HistoryTimeline({ history }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex flex-col">
        {history.map((item, index) => (
          <div key={item.id} className="flex gap-4 p-4 border-b border-gray-100 last:border-0 relative">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              {index !== history.length - 1 && (
                <div className="flex-1 w-px bg-gray-200 my-1" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-500">
                  {getActionIcon(item.action)}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {item.action.toUpperCase()}:{" "}
                  {item.document?.name || "Unknown Document"}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {format(new Date(item.timestamp), "MMM d, h:mm a")}
                </span>
              </div>
              <p className="text-xs text-gray-500 ml-8">
                {item.details}
              </p>
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center p-8 text-gray-400">
            <p>No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
