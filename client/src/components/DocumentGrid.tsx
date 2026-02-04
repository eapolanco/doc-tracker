import { useState, useRef, useEffect } from "react";
import {
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
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

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return { icon: FileText, color: "text-red-500", bg: "bg-red-50" };
    case "doc":
    case "docx":
      return { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" };
    case "xls":
    case "xlsx":
    case "csv":
      return {
        icon: FileSpreadsheet,
        color: "text-green-500",
        bg: "bg-green-50",
      };
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
      return { icon: FileImage, color: "text-purple-500", bg: "bg-purple-50" };
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
      return { icon: FileVideo, color: "text-orange-500", bg: "bg-orange-50" };
    case "mp3":
    case "wav":
    case "ogg":
      return { icon: FileAudio, color: "text-pink-500", bg: "bg-pink-50" };
    case "js":
    case "ts":
    case "tsx":
    case "jsx":
    case "py":
    case "html":
    case "css":
    case "json":
      return { icon: FileCode, color: "text-cyan-500", bg: "bg-cyan-50" };
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return { icon: FileArchive, color: "text-amber-500", bg: "bg-amber-50" };
    case "txt":
    case "md":
      return { icon: FileText, color: "text-gray-500", bg: "bg-gray-50" };
    default:
      return { icon: File, color: "text-blue-600", bg: "bg-blue-50" };
  }
};

export default function DocumentGrid({
  documents,
  onPreview,
  onRefresh,
  viewType,
}: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  // Clear selection when documents length changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [documents.length]);

  const toggleSelect = (
    e: React.MouseEvent | React.ChangeEvent,
    id: string,
  ) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((doc) => doc.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (
      confirm(`Are you sure you want to delete ${selectedIds.size} documents?`)
    ) {
      try {
        await axios.post(`${API_BASE}/documents/bulk-delete`, {
          ids: Array.from(selectedIds),
        });
        onRefresh();
        setSelectedIds(new Set());
      } catch (err) {
        console.error("Failed to delete documents", err);
        alert("Failed to delete documents");
      }
    }
  };

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

  const bulkActionsBar = selectedIds.size > 0 && (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
      <span className="text-sm font-medium border-r border-gray-700 pr-6">
        {selectedIds.size} items selected
      </span>
      <div className="flex items-center gap-4">
        <button
          onClick={handleBulkDelete}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 size={16} />
          Delete
        </button>
        <button
          onClick={() => setSelectedIds(new Set())}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );

  if (viewType === "list") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
          <div className="w-10 flex items-center justify-center">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={
                selectedIds.size === documents.length && documents.length > 0
              }
              onChange={toggleSelectAll}
            />
          </div>
          <div className="w-10"></div>
          <div className="flex-1">Name</div>
          <div className="w-40">Category</div>
          <div className="w-40">Last Modified</div>
          <div className="w-32">Source</div>
          <div className="w-10 text-right">Actions</div>
        </div>
        {documents.map((doc) => {
          const { icon: Icon, color, bg } = getFileIcon(doc.name);
          const isSelected = selectedIds.has(doc.id);
          return (
            <div
              key={doc.id}
              className={`group flex items-center rounded-lg border p-4 cursor-pointer transition-all duration-200 relative
                ${
                  isSelected
                    ? "bg-blue-50/50 border-blue-500/50 shadow-sm"
                    : "bg-white border-gray-200 hover:shadow-md hover:border-blue-500/30"
                }`}
              style={{ zIndex: activeMenu === doc.id ? 999 : 1 }}
              onClick={() => {
                if (renamingId !== doc.id) {
                  onPreview(doc);
                }
              }}
            >
              <div
                className="w-10 flex items-center justify-center"
                onClick={(e) => toggleSelect(e, doc.id)}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={isSelected}
                  onChange={() => {}} // Handled by div click
                />
              </div>

              <div className="w-10">
                <div
                  className={`w-8 h-8 ${bg} rounded flex items-center justify-center ${color}`}
                >
                  <Icon size={16} />
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
          );
        })}
        {bulkActionsBar}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 relative">
      {documents.map((doc) => {
        const { icon: Icon, color, bg } = getFileIcon(doc.name);
        const isSelected = selectedIds.has(doc.id);
        return (
          <div
            key={doc.id}
            className={`group rounded-xl border p-6 flex flex-col gap-4 cursor-pointer transition-all duration-200 relative
              ${
                isSelected
                  ? "bg-blue-50/50 border-blue-500/50 shadow-lg"
                  : "bg-white border-gray-200 hover:shadow-lg hover:border-blue-500/30"
              }`}
            style={{ zIndex: activeMenu === doc.id ? 999 : 1 }}
            onClick={() => {
              if (renamingId !== doc.id) {
                onPreview(doc);
              }
            }}
          >
            <div className="flex justify-between items-start mb-auto relative">
              <div className="flex items-start gap-3">
                <div className="pt-1" onClick={(e) => toggleSelect(e, doc.id)}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ opacity: isSelected ? 1 : undefined }}
                    checked={isSelected}
                    onChange={() => {}}
                  />
                </div>
                <div
                  className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center ${color}`}
                >
                  <Icon size={20} />
                </div>
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
        );
      })}
      {bulkActionsBar}
    </div>
  );
}
