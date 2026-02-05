import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Copy,
  Scissors,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  RefreshCcw,
  Lock,
} from "lucide-react";
import type { Document, FileSystemItem } from "@/types";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import ConfirmModal from "./ConfirmModal";

interface Props {
  documents: FileSystemItem[];
  onPreview: (doc: FileSystemItem) => void;
  onRefresh: () => void;
  viewType: "grid" | "list";
  isSearching: boolean;
  onMove?: (ids: string[], targetPath: string) => void;
  onSetClipboard?: (
    clipboard: { ids: string[]; type: "copy" | "move" } | null,
  ) => void;
  clipboardStatus?: { ids: string[]; type: "copy" | "move" } | null;
  sortField?: "name" | "date" | "category";
  sortOrder?: "asc" | "desc";
  onSort?: (field: "name" | "date" | "category") => void;
  isTrash?: boolean;
}

const API_BASE = "/api";

const getFileIcon = (item: FileSystemItem) => {
  if (item.type === "folder") {
    return { icon: Folder, color: "text-amber-500", bg: "bg-amber-50" };
  }
  const ext = item.name.split(".").pop()?.toLowerCase();

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
const formatFileSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return "";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const isRecentlyUploaded = (uploadedAt?: string) => {
  if (!uploadedAt) return false;
  const now = new Date();
  const uploaded = new Date(uploadedAt);
  const diffInMinutes = (now.getTime() - uploaded.getTime()) / (1000 * 60);
  return diffInMinutes < 15; // Within 15 minutes
};

const shouldPulse = (uploadedAt?: string) => {
  if (!uploadedAt) return false;
  const now = new Date();
  const uploaded = new Date(uploadedAt);
  const diffInMinutes = (now.getTime() - uploaded.getTime()) / (1000 * 60);
  return diffInMinutes < 1; // Within 1 minute
};

export default function DocumentGrid({
  documents,
  onPreview,
  onRefresh,
  viewType,
  isSearching,
  onMove,
  onSetClipboard,
  clipboardStatus,
  sortField,
  sortOrder,
  onSort,
  isTrash = false,
}: Props) {
  // ... (rest of the state and handlers)

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.size > 0 && selectedIds.size < documents.length;
    }
  }, [selectedIds, documents]);

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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    const ids = selectedIds.has(id) ? Array.from(selectedIds) : [id];
    e.dataTransfer.setData("application/doc-tracker-ids", JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (
    e: React.DragEvent,
    id: string,
    isFolder: boolean,
  ) => {
    if (isFolder) {
      e.preventDefault();
      setDropTargetId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    setDropTargetId(null);
    const data = e.dataTransfer.getData("application/doc-tracker-ids");
    if (data && onMove) {
      const ids = JSON.parse(data);
      onMove(ids, targetPath);
    }
  };

  const handleBulkDelete = async () => {
    setConfirmConfig({
      isOpen: true,
      title: isTrash
        ? "Permanently Delete Documents"
        : "Delete Multiple Documents",
      message: isTrash
        ? `Are you sure you want to permanently delete ${selectedIds.size} documents? This cannot be undone.`
        : `Are you sure you want to delete ${selectedIds.size} documents? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          if (isTrash) {
            // Bulk permanent delete - iterate for now as API might not support bulk permanent yet?
            // Or better, let's assume we can loop or add a bulk permanent endpoint.
            // For safety/simplicity, let's loop parallel requests for now or add bulk-permanent-delete endpoint.
            // Wait, I updated index.ts but didn't add bulk permanent delete.
            // I added `POST /api/documents/trash/empty`.
            // I'll loop for now or simple solution: loop.
            await Promise.all(
              Array.from(selectedIds).map((id) =>
                axios.delete(`${API_BASE}/documents/${id}/permanent`),
              ),
            );
            toast.success(`Permanently deleted ${selectedIds.size} documents`);
          } else {
            await axios.post(`${API_BASE}/documents/bulk-delete`, {
              ids: Array.from(selectedIds),
            });
            toast.success(`Moved ${selectedIds.size} documents to trash`);
          }
          onRefresh();
          setSelectedIds(new Set());
        } catch (err) {
          console.error("Failed to delete documents", err);
          toast.error("Failed to delete documents");
        }
      },
    });
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          axios.post(`${API_BASE}/documents/${id}/restore`),
        ),
      );
      toast.success(`Restored ${selectedIds.size} documents`);
      onRefresh();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to restore documents", err);
      toast.error("Failed to restore documents");
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
    setConfirmConfig({
      isOpen: true,
      title: "Delete Document",
      message: `Are you sure you want to delete "${doc.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE}/documents/${doc.id}`);
          toast.success("Document deleted successfully");
          onRefresh();
        } catch (err) {
          console.error("Failed to delete", err);
          toast.error("Failed to delete document");
        }
      },
    });
    setActiveMenu(null);
  };

  const handlePermanentDelete = async (doc: Document) => {
    setConfirmConfig({
      isOpen: true,
      title: "Permanently Delete Document",
      message: `Are you sure you want to permanently delete "${doc.name}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE}/documents/${doc.id}/permanent`);
          toast.success("Document permanently deleted");
          onRefresh();
        } catch (err) {
          console.error("Failed to delete", err);
          toast.error("Failed to delete document");
        }
      },
    });
    setActiveMenu(null);
  };

  const handleRestore = async (doc: Document) => {
    try {
      await axios.post(`${API_BASE}/documents/${doc.id}/restore`);
      toast.success("Document restored");
      onRefresh();
    } catch (err) {
      console.error("Failed to restore", err);
      toast.error("Failed to restore document");
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
      toast.success("Document renamed successfully");
    } catch (err) {
      console.error("Failed to rename", err);
      toast.error("Failed to rename document");
    } finally {
      setRenamingId(null);
    }
  };

  const renderActionsMenu = (doc: FileSystemItem) => {
    if (doc.type === "folder") return <div className="w-8" />;
    const fileDoc = doc as Document;

    if (isTrash) {
      return (
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
              className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl min-w-[180px] z-50 flex flex-col p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestore(fileDoc);
                }}
              >
                <RefreshCcw size={14} /> Restore
              </div>
              <div className="h-px bg-gray-200 my-1" />
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-md cursor-pointer hover:bg-red-50"
                onClick={() => handlePermanentDelete(fileDoc)}
              >
                <Trash2 size={14} /> Delete Forever
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
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
            className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl min-w-[180px] z-50 flex flex-col p-1.5"
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
              onClick={(e) => handleDownload(e, fileDoc)}
            >
              <Download size={14} /> Download
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                startRename(fileDoc);
              }}
            >
              <Edit2 size={14} /> Rename
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                if (onSetClipboard)
                  onSetClipboard({ ids: [doc.id], type: "copy" });
                setActiveMenu(null);
              }}
            >
              <Copy size={14} /> Copy
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                if (onSetClipboard)
                  onSetClipboard({ ids: [doc.id], type: "move" });
                setActiveMenu(null);
              }}
            >
              <Scissors size={14} /> Cut
            </div>
            <div className="h-px bg-gray-200 my-1" />
            <div
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-md cursor-pointer hover:bg-red-50"
              onClick={() => handleDelete(fileDoc)}
            >
              <Trash2 size={14} /> Delete
            </div>
          </div>
        )}
      </div>
    );
  };

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
        {isSearching ? (
          <p>No documents match your search criteria.</p>
        ) : (
          <p>No documents found. Click Sync to scan your directory.</p>
        )}
      </div>
    );
  }

  const bulkActionsBar = selectedIds.size > 0 && (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
      <span className="text-sm font-medium border-r border-gray-700 pr-6">
        {selectedIds.size} items selected
      </span>
      <div className="flex items-center gap-4">
        {!isTrash && (
          <>
            <button
              onClick={() => {
                if (onSetClipboard)
                  onSetClipboard({
                    ids: Array.from(selectedIds),
                    type: "copy",
                  });
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Copy size={16} />
              Copy
            </button>
            <button
              onClick={() => {
                if (onSetClipboard)
                  onSetClipboard({
                    ids: Array.from(selectedIds),
                    type: "move",
                  });
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Scissors size={16} />
              Cut
            </button>
            <div className="w-px h-4 bg-gray-700 mx-2" />
          </>
        )}

        {isTrash && (
          <>
            <button
              onClick={handleBulkRestore}
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <RefreshCcw size={16} />
              Restore
            </button>
            <div className="w-px h-4 bg-gray-700 mx-2" />
          </>
        )}

        <button
          onClick={handleBulkDelete}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 size={16} />
          {isTrash ? "Delete Forever" : "Delete"}
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
              ref={selectAllRef}
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={
                selectedIds.size === documents.length && documents.length > 0
              }
              onChange={toggleSelectAll}
            />
          </div>
          <div className="w-10"></div>
          <div
            className="flex-1 cursor-pointer hover:text-gray-900 flex items-center gap-1 group/header"
            onClick={() => onSort?.("name")}
          >
            Name
            {sortField === "name" &&
              (sortOrder === "asc" ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              ))}
          </div>
          <div className="w-32">Tags</div>
          <div
            className="w-24 px-2 cursor-pointer hover:text-gray-900 flex items-center gap-1 group/header text-right justify-end"
            onClick={() => onSort?.("name")} // Reuse sort or add size sort later
          >
            Size
          </div>
          <div
            className="w-40 cursor-pointer hover:text-gray-900 flex items-center gap-1 group/header"
            onClick={() => onSort?.("category")}
          >
            Category
            {sortField === "category" &&
              (sortOrder === "asc" ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              ))}
          </div>
          <div
            className="w-40 cursor-pointer hover:text-gray-900 flex items-center gap-1 group/header"
            onClick={() => onSort?.("date")}
          >
            Last Modified
            {sortField === "date" &&
              (sortOrder === "asc" ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              ))}
          </div>
          <div className="w-32">Source</div>
          <div className="w-10 text-right">Actions</div>
        </div>
        {documents.map((doc) => {
          const { icon: Icon, color, bg } = getFileIcon(doc);
          const isSelected = selectedIds.has(doc.id);
          const isNew = isRecentlyUploaded(doc.uploadedAt);

          return (
            <div
              key={doc.id}
              draggable={doc.type !== "folder"}
              onDragStart={(e) => handleDragStart(e, doc.id)}
              onDragOver={(e) =>
                handleDragOver(e, doc.id, doc.type === "folder")
              }
              onDragLeave={() => setDropTargetId(null)}
              onDrop={(e) => doc.type === "folder" && handleDrop(e, doc.path)}
              className={`group flex items-center rounded-lg border p-4 cursor-pointer transition-all duration-200 relative
                ${
                  isSelected
                    ? "bg-blue-50/50 border-blue-500/50 shadow-sm"
                    : dropTargetId === doc.id
                      ? "bg-amber-50 border-amber-500 shadow-md scale-[1.02]"
                      : "bg-white border-gray-200 hover:shadow-md hover:border-blue-500/30"
                } ${clipboardStatus?.ids.includes(doc.id) && clipboardStatus.type === "move" ? "opacity-30 grayscale" : ""}`}
              style={{ zIndex: activeMenu === doc.id ? 999 : 1 }}
              onClick={() => {
                if (renamingId !== doc.id) {
                  if ((doc as Document).status === "corrupted") {
                    toast.error("This file is corrupted and cannot be opened");
                    return;
                  }
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
                  {(doc as Document).status === "corrupted" ? (
                    <AlertTriangle size={16} className="text-red-500" />
                  ) : (
                    <Icon size={16} />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-4">
                {renamingId === doc.id ? (
                  renderRenameInput(doc as Document)
                ) : (
                  <div className="flex flex-col">
                    <div
                      className="text-sm font-semibold text-gray-900 truncate"
                      title={doc.name}
                    >
                      {doc.name}
                      {isNew && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white animate-in zoom-in-50 duration-300">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-32 flex flex-wrap gap-1">
                {(() => {
                  try {
                    const tagsArray = JSON.parse(doc.tags || "[]");
                    return tagsArray.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200"
                      >
                        {tag}
                      </span>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </div>

              <div className="w-24 text-right px-2 text-xs text-gray-500 font-mono">
                {formatFileSize((doc as Document).fileSize)}
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
    <motion.div
      layout
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
      }}
      className="flex flex-wrap gap-6 py-4 relative items-stretch"
    >
      <AnimatePresence mode="popLayout">
        {documents.map((doc) => {
          const { icon: Icon, color, bg } = getFileIcon(doc);
          const isSelected = selectedIds.has(doc.id);
          const isFolder = doc.type === "folder";
          const isNew = isRecentlyUploaded(doc.uploadedAt);
          const isPulsing = shouldPulse(doc.uploadedAt);

          return (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 1,
                },
                opacity: { duration: 0.2 },
              }}
              key={doc.id}
              style={{
                flex: "1 1 280px",
                maxWidth: "min(450px, 100%)",
                zIndex: activeMenu === doc.id ? 999 : 1,
              }}
              draggable={doc.type !== "folder"}
              /* eslint-disable @typescript-eslint/no-explicit-any */
              onDragStart={(e: any) => handleDragStart(e, doc.id)}
              onDragOver={(e: any) =>
                handleDragOver(e, doc.id, doc.type === "folder")
              }
              onDragLeave={() => setDropTargetId(null)}
              onDrop={(e: any) =>
                doc.type === "folder" && handleDrop(e, doc.path)
              }
              /* eslint-enable @typescript-eslint/no-explicit-any */
              className={`group rounded-3xl border p-6 flex flex-col gap-4 cursor-pointer transition-all duration-300 relative
                ${
                  isSelected
                    ? "bg-blue-50/90 border-blue-200 shadow-lg ring-2 ring-blue-500/20"
                    : dropTargetId === doc.id
                      ? "bg-amber-50 border-amber-500 shadow-xl scale-[1.02] z-20"
                      : "bg-white/80 backdrop-blur-sm border-gray-100/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-blue-200/50 hover:bg-white"
                } ${clipboardStatus?.ids.includes(doc.id) && clipboardStatus.type === "move" ? "opacity-30 grayscale" : ""} ${isPulsing ? "animate-pulse-blue border-blue-400 ring-4 ring-blue-500/10" : ""}`}
              onClick={() => {
                if (renamingId !== doc.id) {
                  if ((doc as Document).status === "corrupted") {
                    toast.error("This file is corrupted and cannot be opened");
                    return;
                  }
                  onPreview(doc);
                }
              }}
            >
              {/* Selection Overlay Background when Selected */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/5 rounded-3xl pointer-events-none" />
              )}

              <div className="flex justify-between items-start mb-auto relative">
                <div className="flex items-start gap-4 w-full">
                  <div
                    className="pt-1.5"
                    onClick={(e) => toggleSelect(e, doc.id)}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center
                      ${isSelected ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30" : "border-gray-200 bg-white group-hover:border-blue-400/50 opacity-40 group-hover:opacity-100 shadow-sm"}
                     `}
                    >
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => {}}
                    />
                  </div>

                  <div
                    className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center ${color} relative shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    {(doc as Document).status === "corrupted" && (
                      <div className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-1 border-2 border-white shadow-md z-20 animate-bounce">
                        <AlertTriangle size={12} className="text-white" />
                      </div>
                    )}
                    <Icon size={32} strokeWidth={1.5} />
                  </div>

                  <div className="ml-auto">{renderActionsMenu(doc)}</div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4 relative">
                {renamingId === doc.id ? (
                  renderRenameInput(doc as Document)
                ) : (
                  <div className="flex flex-col gap-1">
                    <div
                      className="text-[17px] font-bold text-gray-900 truncate leading-tight group-hover:text-blue-600 transition-colors flex items-center gap-2"
                      title={doc.name}
                    >
                      <span className="truncate">{doc.name}</span>
                      {isNew && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white animate-bounce-subtle shadow-lg shadow-blue-500/30">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="truncate max-w-[120px]">
                          {doc.category || "General"}
                        </span>
                        {doc.cloudSource && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/30" />
                            <span className="capitalize text-blue-500/80">
                              {doc.cloudSource}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100/80 mt-auto">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-gray-500 font-medium">
                      {format(new Date(doc.lastModified), "MMM d, yyyy")}
                    </div>
                    {doc.type === "file" && (
                      <div className="text-[11px] text-gray-900/40 font-mono">
                        {formatFileSize((doc as Document).fileSize)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {isFolder ? (
                      <div className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                        Folder
                      </div>
                    ) : (
                      doc.encrypted && (
                        <div className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                          <Lock size={12} className="opacity-80" />
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Tags in Grid View */}
                {doc.tags && doc.tags !== "[]" && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(() => {
                      try {
                        const tagsArray = JSON.parse(doc.tags || "[]");
                        return (
                          <>
                            {tagsArray
                              .slice(0, 3)
                              .map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-bold border border-gray-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors"
                                >
                                  #{tag}
                                </span>
                              ))}
                            {tagsArray.length > 3 && (
                              <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded-lg">
                                +{tagsArray.length - 3}
                              </span>
                            )}
                          </>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <AnimatePresence>{bulkActionsBar}</AnimatePresence>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </motion.div>
  );
}
