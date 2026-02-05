import { useState, useEffect, useRef } from "react";
import { FileText, Download, X, ExternalLink } from "lucide-react";
import * as docx from "docx-preview";
import * as XLSX from "xlsx";
import type { Document } from "@/types";

interface Props {
  document: Document;
  onClose: () => void;
}

const API_BASE = "/api";

type SheetCell = string | number | boolean | null;
type SheetRow = SheetCell[];
type SheetData = SheetRow[];

export default function Visualizer({ document, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | SheetData | null>(null);
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
                await docx.renderAsync(
                  blob,
                  docxRef.current,
                  undefined,
                  options,
                );
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
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as SheetData;
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
            className="w-full rounded-lg shadow-sm"
          />
        );
      case "pdf":
        return (
          <iframe
            src={fileUrl}
            className="w-full h-[calc(100vh-200px)] border-0 rounded-lg"
            title={document.name}
          />
        );
      case "txt":
      case "md":
      case "json":
        return (
          <pre className="p-4 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg font-mono text-sm text-gray-900 leading-relaxed overflow-x-auto">
            {content}
          </pre>
        );
      case "docx":
        return (
          <div
            ref={docxRef}
            className="docx-container bg-white p-4 rounded-lg border border-gray-200 text-xs overflow-x-auto"
          />
        );
      case "xlsx":
      case "xls":
      case "csv":
        return (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {Array.isArray(content) &&
                  content.map((row: SheetRow, i: number) => (
                    <tr key={i}>
                      {Array.isArray(row) &&
                        row.map((cell: SheetCell, j: number) => (
                          <td
                            key={j}
                            className="border border-gray-200 p-2 whitespace-nowrap"
                          >
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
          <div className="flex flex-col items-center justify-center text-center h-[300px]">
            <FileText size={48} className="text-gray-900 opacity-10 mb-4" />
            <p className="text-gray-500 mb-6 font-normal">
              Preview not available for <b>.{type}</b>
            </p>
            <a
              href={fileUrl}
              download
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all hover:opacity-90"
            >
              <Download size={16} className="mr-2" /> Download{" "}
              {type.toUpperCase()} File
            </a>
          </div>
        );
    }
  };

  return (
    <>
      <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white z-20 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-blue-600 shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <h2
              className="text-sm font-semibold truncate"
              title={document.name}
            >
              {document.name}
            </h2>
            <p className="text-xs text-gray-500">
              {document.category} •{" "}
              {(document.cloudSource || "local").toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center"
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center"
            title="Close Preview"
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-4 text-gray-500 text-sm">Preparing preview...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
            <FileText size={40} className="text-blue-600 opacity-20 mb-4" />
            <p className="text-blue-600 mb-4">{error}</p>
            <a
              href={fileUrl}
              download
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all hover:opacity-90"
            >
              <Download size={16} className="mr-2" /> Download File
            </a>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </>
  );
}
