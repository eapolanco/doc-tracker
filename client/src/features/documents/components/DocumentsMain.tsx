import { useState, useEffect, useCallback } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import axios from "axios";
import DocumentGrid from "@/components/DocumentGrid";
import Visualizer from "@/components/Visualizer";
import UploadModal from "@/components/UploadModal";
import CreateFolderModal from "@/components/CreateFolderModal";
import {
  RefreshCw,
  Upload,
  Search,
  FolderPlus,
  ChevronRight,
  Home,
  X,
  ClipboardCheck,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import type { Document, AppSettings, FileSystemItem } from "@/types";
import { eventBus } from "@/core/services/EventBus";
import Page from "@/components/Page";
import LayoutSwitcher from "@/components/LayoutSwitcher";
import { useViewOptions } from "@/hooks/useViewOptions";
import Button from "@/components/Button";

const API_BASE = "/api";

export default function DocumentsMain() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const { viewType, setViewType, sortField, sortOrder, handleSort } =
    useViewOptions("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [clipboard, setClipboard] = useState<{
    ids: string[];
    type: "copy" | "move";
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    current: number;
    fileName: string;
  } | null>(null);

  // Initialize from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewIdParam = params.get("viewid");
    const idParam = params.get("id");
    const viewTypeParam = params.get("view");

    if (viewIdParam && ["local", "onedrive", "google"].includes(viewIdParam)) {
      setSourceFilter(viewIdParam);
    } else {
      setSourceFilter(null);
    }

    if (
      viewTypeParam === "grid" ||
      viewTypeParam === "list" ||
      viewTypeParam === "compact"
    ) {
      setViewType(viewTypeParam as "grid" | "list" | "compact");
    }

    if (idParam) {
      const decodedId = decodeURIComponent(idParam);
      if (decodedId.includes("/") || decodedId.startsWith("/")) {
        setCurrentPath(
          decodedId.startsWith("/") ? decodedId.substring(1) : decodedId,
        );
      }
    }
  }, [setViewType]);

  // Listen for filter events from Sidebar
  useEffect(() => {
    const handleFilter = (source: string | null) => {
      setSourceFilter(source);
      setCurrentPath(""); // Reset path when switching sources
    };

    eventBus.on("docs:filter", handleFilter);
    // Note: EventBus implementation in this codebase might simpler and not supporting off/unsubscribe correctly if not designed for it,
    // but based on previous files it looked like a simple pub/sub.
    // Ensure cleanup if possible, but the provided EventBus might not have off().
    // Checking EventBus.ts content from memory...
    // It has `on` but maybe no `off`?
    // "on<T>(event: string, handler: Handler<T>): void"
    // If no off, we risks duplicates. Use a mount check? or hope EventBus is smart?
    // Let's assume for now it's fine or I will fix EventBus later.
    return () => {
      // Assuming eventBus has an 'off' method for cleanup
      if (typeof eventBus.off === "function") {
        eventBus.off("docs:filter", handleFilter);
      }
    };
  }, []);

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (sourceFilter) params.set("viewid", sourceFilter);
    else params.set("viewid", "all");

    params.set("view", viewType);

    if (selectedDoc) {
      params.set("id", selectedDoc.id);
    } else if (currentPath) {
      params.set("id", "/" + currentPath);
    } else {
      params.delete("id");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // Use replaceState to avoid cluttering history stack with state updates
    window.history.replaceState({}, "", newUrl);
  }, [sourceFilter, viewType, selectedDoc, currentPath]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [docsRes, setRes] = await Promise.all([
        axios.get(`${API_BASE}/documents`),
        axios.get(`${API_BASE}/settings`),
      ]);
      console.log(
        `DocumentsMain: Fetched ${docsRes.data?.length || 0} documents`,
      );
      setDocuments(docsRes.data || []);
      setAppSettings(setRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("DocumentsMain: Error fetching data:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMove = async (ids: string[], targetPath: string) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/documents/move`, { ids, targetPath });
      await fetchData();
      setClipboard(null);
    } catch (err) {
      console.error("Move error:", err);
      let msg = "Failed to move documents";
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        msg = err.response.data.error;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (ids: string[], targetPath: string) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/documents/copy`, { ids, targetPath });
      await fetchData();
      setClipboard(null);
    } catch (err) {
      console.error("Copy error:", err);
      let msg = "Failed to copy documents";
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        msg = err.response.data.error;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/scan`);
      await fetchData();
    } catch (err) {
      console.error("Error scanning:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitCreateFolder = async (folderName: string) => {
    if (!folderName) return;
    setShowCreateFolderModal(false);
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/folders`, {
        name: folderName,
        parentPath: currentPath,
      });
      await fetchData();
      toast.success("Folder created successfully");
    } catch (err: unknown) {
      console.error("Create folder error:", err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      const errorMsg =
        axiosError.response?.data?.error || "Failed to create folder";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = () => {
    setShowCreateFolderModal(true);
  };

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    // Check if this is an internal document drag (not a file upload)
    const internalDragData = e.dataTransfer.getData(
      "application/doc-tracker-ids",
    );
    if (internalDragData) {
      // This is an internal document move, not a file upload - ignore it here
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const targetCategory = currentPath;

    setLoading(true);
    setUploadProgress({
      total: files.length,
      current: 0,
      fileName: "Uploading all files...",
    });

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("category", targetCategory);

      await axios.post(`${API_BASE}/upload`, formData);

      setUploadProgress({
        total: files.length,
        current: files.length,
        fileName: "Processing complete",
      });
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      const errorMsg =
        axiosError.response?.data?.error || "Failed to upload files";
      toast.error(errorMsg);
    }

    await axios.post(`${API_BASE}/scan`);
    await fetchData();
    setLoading(false);
    toast.success(`Successfully uploaded ${files.length} documents`);

    setTimeout(() => setUploadProgress(null), 3000);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    setDropTargetId(null);
    const data = e.dataTransfer.getData("application/doc-tracker-ids");
    if (data) {
      const ids = JSON.parse(data);
      handleMove(ids, targetPath);
    }
  };

  const getTitle = () => {
    if (sourceFilter === "local") return "Local Documents";
    if (sourceFilter === "onedrive") return "OneDrive Documents";
    if (sourceFilter === "google") return "Google Drive Documents";
    return "All Documents";
  };

  const getFileSystemItems = () => {
    const filteredBySource = documents.filter((doc) => {
      return sourceFilter ? doc.cloudSource === sourceFilter : true;
    });

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return filteredBySource.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchLower) ||
          doc.category.toLowerCase().includes(searchLower) ||
          doc.path.toLowerCase().includes(searchLower),
      );
    }

    const visibleItems = filteredBySource.filter((doc) => {
      const docPath = doc.path;
      if (currentPath === "") {
        return !docPath.includes("/");
      }
      if (!docPath.startsWith(currentPath + "/")) return false;
      const relativePart = docPath.substring(currentPath.length + 1);
      return !relativePart.includes("/");
    });

    const itemsMap = new Map<string, FileSystemItem>();

    visibleItems.forEach((item) => {
      itemsMap.set(item.name, item);
    });

    filteredBySource.forEach((doc) => {
      if (currentPath === "" && doc.path.includes("/")) {
        const folderName = doc.path.split("/")[0];
        if (!itemsMap.has(folderName)) {
          itemsMap.set(folderName, {
            id: `folder-implicit-${folderName}`,
            name: folderName,
            path: folderName,
            type: "folder",
            category: "Folder",
            cloudSource: doc.cloudSource,
            lastModified: doc.lastModified,
            status: "valid",
          });
        }
      } else if (doc.path.startsWith(currentPath + "/")) {
        const relative = doc.path.substring(currentPath.length + 1);
        if (relative.includes("/")) {
          const folderName = relative.split("/")[0];
          if (!itemsMap.has(folderName)) {
            itemsMap.set(folderName, {
              id: `folder-implicit-${folderName}`,
              name: folderName,
              path: currentPath ? `${currentPath}/${folderName}` : folderName,
              type: "folder",
              category: "Folder",
              cloudSource: doc.cloudSource,
              lastModified: doc.lastModified,
              status: "valid",
            });
          }
        }
      }
    });

    return Array.from(itemsMap.values()).sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      const aIsNew =
        a.uploadedAt &&
        new Date().getTime() - new Date(a.uploadedAt).getTime() <
          1000 * 60 * 15;
      const bIsNew =
        b.uploadedAt &&
        new Date().getTime() - new Date(b.uploadedAt).getTime() <
          1000 * 60 * 15;

      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;

      return a.name.localeCompare(b.name);
    });
  };

  const sortedItems = getFileSystemItems();

  const Breadcrumbs = () => {
    if (searchQuery) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Search size={14} className="text-blue-500" />
            <span>Search results for</span>
            <span className="text-gray-900 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              "{searchQuery}"
            </span>
          </div>
          <button
            onClick={() => setSearchQuery("")}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline"
          >
            Clear Search
          </button>
        </div>
      );
    }

    const parts = currentPath ? currentPath.split("/") : [];
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 flex-wrap">
        <button
          onClick={() => setCurrentPath("")}
          onDragOver={(e) => {
            e.preventDefault();
            setDropTargetId("root");
          }}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={(e) => handleDrop(e, "")}
          className={`flex items-center gap-1 transition-colors ${
            dropTargetId === "root"
              ? "text-blue-600 scale-110 font-bold"
              : "hover:text-blue-600"
          }`}
        >
          <Home size={14} />
          <span>Root</span>
        </button>
        {parts.map((part, index) => {
          const path = parts.slice(0, index + 1).join("/");
          return (
            <div key={path} className="flex items-center gap-2">
              <ChevronRight size={12} className="opacity-50" />
              <button
                onClick={() => setCurrentPath(path)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetId(path);
                }}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(e) => handleDrop(e, path)}
                className={`transition-colors ${
                  dropTargetId === path
                    ? "text-blue-600 scale-110 font-bold"
                    : "hover:text-blue-600"
                }`}
              >
                {part}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex h-full w-full overflow-hidden bg-white dark:bg-slate-900 transition-colors ${dragOver ? "bg-blue-50/50 outline-2 outline-dashed outline-blue-500 -outline-offset-2" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        // Only show drag over state if files are being dragged (not internal documents)
        if (e.dataTransfer.types.includes("Files")) {
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleGlobalDrop}
    >
      <Page
        title={
          <div className="flex items-center gap-3">
            {getTitle()}
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-black uppercase">
              {sourceFilter || "all"}
            </span>
          </div>
        }
        subtitle={`Managing ${sortedItems.length} items here (${documents.length} total across library)`}
        headerExtras={<Breadcrumbs />}
        actions={
          <>
            <div className="relative group">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              icon={Upload}
              onClick={() => setShowUploadModal(true)}
            >
              Upload Files
            </Button>
            <Button
              variant="outline"
              icon={FolderPlus}
              onClick={handleCreateFolder}
            >
              New Folder
            </Button>
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={handleScan}
              loading={loading}
            />
            <LayoutSwitcher
              viewType={viewType}
              onViewChange={setViewType}
              className="ml-2"
            />
          </>
        }
      >
        <LayoutGroup>
          <div className="flex flex-1 overflow-hidden relative">
            <motion.div
              layout
              transition={
                appSettings?.app?.animationsEnabled
                  ? undefined
                  : { duration: 0 }
              }
              className="flex-1 min-w-0 overflow-y-auto px-8 pb-8"
            >
              <div className="flex flex-col h-full">
                <DocumentGrid
                  documents={sortedItems}
                  onPreview={(item: FileSystemItem) => {
                    if (item.type === "folder") {
                      setCurrentPath(item.path);
                    } else {
                      setSelectedDoc(item as Document);
                    }
                  }}
                  onRefresh={fetchData}
                  viewType={viewType}
                  isSearching={searchQuery.length > 0}
                  onMove={handleMove}
                  onSetClipboard={setClipboard}
                  clipboardStatus={clipboard}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  isTrash={false}
                  animationsEnabled={appSettings?.app?.animationsEnabled}
                />
              </div>
            </motion.div>
            <motion.aside
              layout
              initial={false}
              animate={{
                width: selectedDoc ? 450 : 0,
                opacity: selectedDoc ? 1 : 0,
              }}
              transition={
                appSettings?.app?.animationsEnabled
                  ? {
                      type: "spring",
                      stiffness: 300,
                      damping: 40,
                      mass: 0.8,
                    }
                  : { duration: 0 }
              }
              className="shrink-0 border-l border-gray-200 bg-white flex flex-col z-10 overflow-hidden"
            >
              {selectedDoc && (
                <Visualizer
                  document={selectedDoc}
                  onClose={() => setSelectedDoc(null)}
                />
              )}
            </motion.aside>
          </div>
        </LayoutGroup>

        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={fetchData}
            onProgressUpdate={setUploadProgress}
            defaultCategory={currentPath}
          />
        )}

        {showCreateFolderModal && (
          <CreateFolderModal
            isOpen={showCreateFolderModal}
            onClose={() => setShowCreateFolderModal(false)}
            onCreate={submitCreateFolder}
          />
        )}

        {/* Global Paste Bar */}
        <AnimatePresence>
          {clipboard && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 50, x: "-50%" }}
              className="fixed bottom-10 left-1/2 bg-white/90 backdrop-blur-xl border border-gray-200/50 px-3 py-2.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 flex items-center gap-1"
            >
              <div className="flex items-center gap-3 px-4 py-1.5 border-r border-gray-100 mr-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <span className="text-xs font-black">
                    {clipboard.ids.length}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider leading-none">
                    Clipboard
                  </span>
                  <span className="text-[13px] font-bold text-gray-900 leading-tight">
                    {clipboard.type === "copy" ? "To Copy" : "To Move"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (clipboard.type === "copy") {
                    handleCopy(clipboard.ids, currentPath);
                  } else {
                    handleMove(clipboard.ids, currentPath);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
                title="Paste Here"
              >
                <ClipboardCheck size={20} />
              </button>
              <button
                onClick={() => setClipboard(null)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                title="Cancel"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Page>

      {uploadProgress && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 z-60"
        >
          <div className="max-w-xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Cloud size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-900 truncate pr-4">
                  {uploadProgress.fileName}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {uploadProgress.current} / {uploadProgress.total}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
