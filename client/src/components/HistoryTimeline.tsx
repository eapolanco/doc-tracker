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
    <div className="card">
      <div className="history-list">
        {history.map((item) => (
          <div key={item.id} className="history-item">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div className="history-dot" />
              <div
                style={{
                  flex: 1,
                  width: "1px",
                  backgroundColor: "var(--border)",
                  margin: "0.5rem 0",
                }}
              />
            </div>

            <div className="history-content">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    backgroundColor: "var(--sidebar-bg)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {getActionIcon(item.action)}
                </span>
                <span className="history-title">
                  {item.action.toUpperCase()}:{" "}
                  {item.document?.name || "Unknown Document"}
                </span>
                <span className="history-time">
                  {format(new Date(item.timestamp), "MMM d, h:mm a")}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  marginLeft: "2rem",
                }}
              >
                {item.details}
              </p>
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-secondary)",
            }}
          >
            <p>No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
