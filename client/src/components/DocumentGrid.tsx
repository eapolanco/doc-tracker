import { File, Folder, MoreVertical, ExternalLink } from "lucide-react";
import type { Document } from "@/types";
import { format } from "date-fns";

interface Props {
  documents: Document[];
}

export default function DocumentGrid({ documents }: Props) {
  return (
    <div className="doc-grid">
      {documents.map((doc) => (
        <div key={doc.id} className="card doc-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div className="doc-icon">
              <File size={20} />
            </div>
            <button
              style={{ padding: "0.25rem", color: "var(--text-secondary)" }}
            >
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="doc-name" title={doc.name}>
            {doc.name}
          </div>

          <div className="doc-meta">
            <span className="badge badge-blue">{doc.category}</span>
            <span style={{ marginTop: "0.5rem" }}>
              Modified {format(new Date(doc.lastModified), "MMM d, yyyy")}
            </span>
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <ExternalLink size={12} />
              {doc.cloudSource}
            </span>
          </div>
        </div>
      ))}

      {documents.length === 0 && (
        <div
          style={{
            gridColumn: "1/-1",
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-secondary)",
          }}
        >
          <Folder size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
          <p>No documents found. Click Sync to scan your directory.</p>
        </div>
      )}
    </div>
  );
}
