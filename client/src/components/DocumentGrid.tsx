import { useState, useRef, useEffect } from "react";
import { File, Folder, MoreVertical, ExternalLink, Eye, Trash2, Edit2, Download } from "lucide-react";
import type { Document } from "@/types";
import { format } from "date-fns";

interface Props {
  documents: Document[];
  onPreview: (doc: Document) => void;
}

const API_BASE = "http://localhost:3001/api";

export default function DocumentGrid({ documents, onPreview }: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation(); // explicit stop
    const link = document.createElement("a");
    link.href = `${API_BASE}/documents/${doc.id}/view`;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveMenu(null);
  };

  const handleDelete = (doc: Document) => {
    if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
      console.log("Deleting", doc.id);
    }
    setActiveMenu(null);
  };

  return (
    <div className="doc-grid">
      {documents.map((doc) => (
        <div 
          key={doc.id} 
          className="card doc-card"
          style={{ 
            zIndex: activeMenu === doc.id ? 999 : 1,
            position: 'relative'
          }}
          onClick={() => {
            console.log("Card clicked:", doc.name);
            onPreview(doc);
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "auto",
              position: "relative",
            }}
          >
            <div
              className="doc-icon"
              style={{ cursor: "pointer" }}
            >
              <File size={20} />
            </div>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button
                className="btn-icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Preview btn clicked");
                  onPreview(doc);
                }}
                title="Preview"
              >
                <Eye size={16} />
              </button>
              <button
                className="btn-icon-sm"
                style={{
                  backgroundColor: activeMenu === doc.id ? "var(--sidebar-bg)" : "transparent",
                  color: activeMenu === doc.id ? "var(--text-primary)" : "var(--text-secondary)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Menu toggle clicked", doc.id);
                  setActiveMenu(activeMenu === doc.id ? null : doc.id);
                }}
              >
                <MoreVertical size={16} />
              </button>

              {activeMenu === doc.id && (
                <div
                  ref={menuRef}
                  className="context-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="menu-item" onClick={(e) => {
                     e.stopPropagation();
                     onPreview(doc);
                     setActiveMenu(null);
                  }}>
                    <Eye size={14} /> Preview
                  </div>
                  <div className="menu-item" onClick={(e) => handleDownload(e, doc)}>
                    <Download size={14} /> Download
                  </div>
                  <div className="menu-item disabled">
                    <Edit2 size={14} /> Rename
                  </div>
                  <div className="menu-divider" />
                  <div className="menu-item text-red" onClick={() => handleDelete(doc)}>
                    <Trash2 size={14} /> Delete
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            onClick={() => onPreview(doc)}
            style={{ cursor: "pointer", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}
          >
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
