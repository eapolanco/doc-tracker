import { useState, useRef, useEffect } from "react";
import {
  File,
  Folder,
  MoreVertical,
  ExternalLink,
  Eye,
  Trash2,
  Edit2,
  Download,
  Check,
  X,
} from "lucide-react";
import type { Document } from "@/types";
import { format } from "date-fns";
import axios from "axios";

interface Props {
  documents: Document[];
  onPreview: (doc: Document) => void;
  onRefresh: () => void;
  viewType: "grid" | "list";
}

const API_BASE = "/api";

export default function DocumentGrid({
  documents,
  onPreview,
  onRefresh,
  viewType,
}: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
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
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = `${API_BASE}/documents/${doc.id}/view`;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveMenu(null);
  };

  const handleDelete = async (doc: Document) => {
    if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
      try {
        await axios.delete(`${API_BASE}/documents/${doc.id}`);
        onRefresh();
      } catch (err) {
        console.error("Failed to delete", err);
        alert("Failed to delete document");
      }
    }
    setActiveMenu(null);
  };

  const startRename = (doc: Document) => {
    setRenamingId(doc.id);
    setRenameValue(doc.name);
    setActiveMenu(null);
  };

  const submitRename = async (doc: Document) => {
    if (!renameValue.trim() || renameValue === doc.name) {
      setRenamingId(null);
      return;
    }
    try {
      await axios.put(`${API_BASE}/documents/${doc.id}/rename`, {
        name: renameValue,
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to rename", err);
      alert("Failed to rename document");
    } finally {
      setRenamingId(null);
    }
  };

  const renderActionsMenu = (doc: Document) => (
    <div className="relative">
      <button
        className={`p-1.5 rounded-md transition-colors ${
          activeMenu === doc.id
            ? "bg-gray-100 text-gray-900"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setActiveMenu(activeMenu === doc.id ? null : doc.id);
        }}
      >
        <MoreVertical size={16} />
      </button>

      {activeMenu === doc.id && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[160px] z-50 flex flex-col p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(doc);
              setActiveMenu(null);
            }}
          >
            <Eye size={14} /> Preview
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
            onClick={(e) => handleDownload(e, doc)}
          >
            <Download size={14} /> Download
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              startRename(doc);
            }}
          >
            <Edit2 size={14} /> Rename
          </div>
          <div className="h-px bg-gray-200 my-1" />
          <div
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-md cursor-pointer hover:bg-red-50"
            onClick={() => handleDelete(doc)}
          >
            <Trash2 size={14} /> Delete
          </div>
        </div>
      )}
    </div>
  );

  const renderRenameInput = (doc: Document) => (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={renameValue}
        onChange={(e) => setRenameValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitRename(doc);
          if (e.key === "Escape") setRenamingId(null);
        }}
        className="flex-1 border border-blue-500 rounded px-2 py-1 text-sm outline-none ring-2 ring-blue-500/20"
        autoFocus
      />
      <button
        onClick={() => submitRename(doc)}
        className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100"
      >
        <Check size={14} />
      </button>
      <button
        onClick={() => setRenamingId(null)}
        className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
      >
        <X size={14} />
      </button>
    </div>
  );

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Folder size={48} className="mx-auto mb-4 opacity-20" />
        <p>No documents found. Click Sync to scan your directory.</p>
      </div>
    );
  }

  if (viewType === "list") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
          <div className="w-10"></div>
          <div className="flex-1">Name</div>
          <div className="w-40">Category</div>
          <div className="w-40">Last Modified</div>
          <div className="w-32">Source</div>
          <div className="w-10 text-right">Actions</div>
        </div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex items-center bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-500/30 transition-all duration-200 relative"
            style={{ zIndex: activeMenu === doc.id ? 999 : 1 }}
            onClick={() => {
              if (renamingId !== doc.id) {
                onPreview(doc);
              }
            }}
          >
            <div className="w-10">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-blue-600">
                <File size={16} />
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-4">
              {renamingId === doc.id ? (
                renderRenameInput(doc)
              ) : (
                <div
                  className="text-sm font-semibold text-gray-900 truncate"
                  title={doc.name}
                >
                  {doc.name}
                </div>
              )}
            </div>

            <div className="w-40">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                {doc.category}
              </span>
            </div>

            <div className="w-40 text-xs text-gray-500">
              {format(new Date(doc.lastModified), "MMM d, yyyy")}
            </div>

            <div className="w-32 flex items-center gap-1.5 text-xs text-gray-500 capitalize">
              <ExternalLink size={12} className="opacity-50" />
              {doc.cloudSource}
            </div>

            <div className="w-10 flex justify-end">
              {renderActionsMenu(doc)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 cursor-pointer hover:shadow-lg hover:border-blue-500/30 transition-all duration-200 relative"
          style={{ zIndex: activeMenu === doc.id ? 999 : 1 }}
          onClick={() => {
            if (renamingId !== doc.id) {
              onPreview(doc);
            }
          }}
        >
          <div className="flex justify-between items-start mb-auto relative">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-blue-600">
              <File size={20} />
            </div>
            {renderActionsMenu(doc)}
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {renamingId === doc.id ? (
              renderRenameInput(doc)
            ) : (
              <div
                className="text-base font-semibold text-gray-900 truncate"
                title={doc.name}
              >
                {doc.name}
              </div>
            )}

            <div className="flex flex-col gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                {doc.category}
              </span>
              <span className="mt-2 text-[10px]">
                Modified {format(new Date(doc.lastModified), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1 capitalize">
                <ExternalLink size={12} />
                {doc.cloudSource}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
