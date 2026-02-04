import { useState, useEffect, useRef } from "react";
import { X, FileText, Download, ExternalLink } from "lucide-react";
import * as docx from "docx-preview";
import * as XLSX from "xlsx";
import type { Document } from "@/types";

interface Props {
  document: Document;
  onClose: () => void;
}

const API_BASE = "http://localhost:3001/api";

export default function Visualizer({ document, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<any>(null);
  const [type, setType] = useState<string>("");
  const docxRef = useRef<HTMLDivElement>(null);

  const fileUrl = `${API_BASE}/documents/${document.id}/view`;

  useEffect(() => {
    const ext = document.name.split(".").pop()?.toLowerCase();
    setType(ext || "");

    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        setContent(null);

        if (ext === "txt") {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error("Failed to load file");
          const text = await res.text();
          setContent(text);
        } else if (ext === "docx") {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error("Failed to load file");
          const blob = await res.blob();
          setTimeout(async () => {
            if (docxRef.current) {
              const options = {
                className: "docx",
                inWrapper: false,
                ignoreWidth: false,
                ignoreHeight: false,
                breakPages: true,
                useBase64URL: false,
                experimental: false,
              };
              try {
                // Clear previous content
                docxRef.current.innerHTML = "";
                await docx.renderAsync(blob, docxRef.current, undefined, options);
              } catch (e) {
                console.error("DOCX Render error:", e);
                setError("Failed to render DOCX file.");
              }
            }
          }, 100);
        } else if (ext === "xlsx" || ext === "xls") {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error("Failed to load file");
          const ab = await res.arrayBuffer();
          const wb = XLSX.read(ab);
          const firstSheetName = wb.SheetNames[0];
          const worksheet = wb.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          setContent(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Visualizer Error:", err);
        setError("Failed to render document preview.");
        setLoading(false);
      }
    };

    loadContent();
  }, [document.id, document.name, fileUrl]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-center" style={{ height: "300px" }}>
          <div className="spinner" />
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Preparing preview...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-center" style={{ height: "300px", color: "var(--accent)", textAlign: "center", padding: "1rem" }}>
          <FileText size={40} style={{ opacity: 0.2, marginBottom: "1rem" }} />
          <p>{error}</p>
          <a href={fileUrl} download className="btn-primary" style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
            <Download size={16} style={{ marginRight: "0.5rem" }} /> Download File
          </a>
        </div>
      );
    }

    switch (type) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return (
          <img
            src={fileUrl}
            alt={document.name}
            style={{ width: "100%", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
          />
        );
      case "pdf":
        return (
          <iframe
            src={fileUrl}
            style={{ width: "100%", height: "calc(100vh - 200px)", border: "none", borderRadius: "0.5rem" }}
            title={document.name}
          />
        );
      case "txt":
      case "md":
      case "json":
        return (
          <pre
            style={{
              padding: "1rem",
              whiteSpace: "pre-wrap",
              backgroundColor: "white",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontFamily: "monospace",
              fontSize: "0.8125rem",
              color: "var(--text-primary)",
              lineHeight: 1.6,
              overflowX: "auto"
            }}
          >
            {content}
          </pre>
        );
      case "docx":
        return (
          <div
            ref={docxRef}
            className="docx-container"
            style={{
              backgroundColor: "white",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              fontSize: "0.75rem",
              overflowX: "auto"
            }}
          />
        );
      case "xlsx":
      case "xls":
      case "csv":
        return (
          <div style={{ overflowX: "auto", background: "white", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
            <table className="preview-table">
              <tbody>
                {Array.isArray(content) && content.map((row: any, i: number) => (
                  <tr key={i}>
                    {Array.isArray(row) && row.map((cell: any, j: number) => (
                      <td key={j} style={{ border: "1px solid var(--border)", padding: "0.4rem", whiteSpace: "nowrap" }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <div className="flex-center" style={{ height: "300px", textAlign: "center" }}>
            <FileText size={48} style={{ opacity: 0.1, marginBottom: "1rem" }} />
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Preview not available for <b>.{type}</b>
            </p>
            <a href={fileUrl} download className="btn-primary" style={{ fontSize: "0.875rem" }}>
              <Download size={16} style={{ marginRight: "0.5rem" }} /> Download {type.toUpperCase()} File
            </a>
          </div>
        );
    }
  };

  return (
    <>
      <header className="preview-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
          <div style={{
            width: "32px",
            height: "32px",
            backgroundColor: "var(--sidebar-bg)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
            flexShrink: 0
          }}>
            <FileText size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={document.name}>
              {document.name}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {document.category} • {(document.cloudSource || 'local').toUpperCase()}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-icon-sm" title="Open in new tab">
            <ExternalLink size={16} />
          </a>
          <button onClick={onClose} className="btn-icon-sm" title="Close Preview">
            <X size={18} />
          </button>
        </div>
      </header>
      <div className="preview-panel-body">{renderContent()}</div>
    </>
  );
}
