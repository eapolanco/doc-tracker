import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import DocumentGrid from "@/components/DocumentGrid";
import HistoryTimeline from "@/components/HistoryTimeline";
import Settings from "@/components/Settings";
import Visualizer from "@/components/Visualizer";
import UploadModal from "@/components/UploadModal";
import {
  RefreshCw,
  Upload,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  Home,
  ClipboardCheck,
} from "lucide-react";
import type {
  Document,
  HistoryItem,
  CloudAccount,
  AppSettings,
  FileSystemItem,
  FolderItem,
} from "@/types";

const API_BASE = "/api";

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<"docs" | "history" | "settings">(
    "docs",
  );
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [clipboard, setClipboard] = useState<{
    ids: string[];
    type: "copy" | "move";
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"name" | "date" | "category">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    current: number;
    fileName: string;
  } | null>(null);

  useEffect(() => {
    console.log("Active Tab:", activeTab);
    console.log("Selected Document:", selectedDoc?.name);
  }, [activeTab, selectedDoc]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, histRes, accRes, setRes] = await Promise.all([
        axios.get(`${API_BASE}/documents`),
        axios.get(`${API_BASE}/history`),
        axios.get(`${API_BASE}/accounts`),
        axios.get(`${API_BASE}/settings`),
      ]);
      setDocuments(docsRes.data);
      setHistory(histRes.data);
      setAccounts(accRes.data);
      setAppSettings(setRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (ids: string[], targetPath: string) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/documents/move`, { ids, targetPath });
      await fetchData();
      setClipboard(null);
    } catch (err) {
      console.error("Move error:", err);
      alert("Failed to move documents");
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
      alert("Failed to copy documents");
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

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const pathParts = currentPath.split("/").filter(Boolean);
    const targetCategory =
      pathParts.length > 0 ? pathParts[pathParts.length - 1] : "Personal";

    setLoading(true);
    setUploadProgress({
      total: files.length,
      current: 0,
      fileName: files[0].name,
    });

    let current = 0;
    for (const file of files) {
      setUploadProgress({
        total: files.length,
        current: current + 1,
        fileName: file.name,
      });
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", targetCategory);
        await axios.post(`${API_BASE}/upload`, formData);
      } catch (err) {
        console.error("Upload error:", err);
      }
      current++;
    }

    await axios.post(`${API_BASE}/scan`);
    await fetchData();
    setLoading(false);

    // Clear progress after a delay
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

  useEffect(() => {
    fetchData();

    // Check for OAuth status in URL
    const params = new URLSearchParams(window.location.search);
    if (params.has("success") || params.has("error")) {
      setActiveTab("settings");
    }
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case "docs":
        if (sourceFilter === "local") return "Local Documents";
        if (sourceFilter === "onedrive") return "OneDrive Documents";
        if (sourceFilter === "google") return "Google Drive Documents";
        return "All Documents";
      case "history":
        return "Activity History";
      case "settings":
        return "App Settings";
      default:
        return "";
    }
  };

  const getFileSystemItems = () => {
    // 1. Initial filter based on source only (search is applied differently)
    const filteredBySource = documents.filter((doc) => {
      return sourceFilter ? doc.cloudSource === sourceFilter : true;
    });

    let itemsToProcess: FileSystemItem[] = [];

    if (searchQuery) {
      // GLOBAL SEARCH: Ignore currentPath, return all matching files
      const searchLower = searchQuery.toLowerCase();
      itemsToProcess = filteredBySource
        .filter((doc) => {
          return (
            doc.name.toLowerCase().includes(searchLower) ||
            doc.category.toLowerCase().includes(searchLower) ||
            doc.path.toLowerCase().includes(searchLower)
          );
        })
        .map((doc) => ({ ...doc, type: "file" as const }));
    } else {
      // FOLDER NAVIGATION: Group by currentPath
      const directSubfolders = new Map<string, FolderItem>();
      const files: FileSystemItem[] = [];

      filteredBySource.forEach((doc) => {
        const relPath =
          currentPath === ""
            ? doc.path
            : doc.path.startsWith(currentPath + "/")
              ? doc.path.substring(currentPath.length + 1)
              : null;

        if (relPath === null) return;

        const parts = relPath.split("/");
        if (parts.length > 1) {
          const folderName = parts[0];
          if (!directSubfolders.has(folderName)) {
            directSubfolders.set(folderName, {
              id: `folder-${folderName}`,
              name: folderName,
              path:
                currentPath === ""
                  ? folderName
                  : `${currentPath}/${folderName}`,
              type: "folder",
              cloudSource: doc.cloudSource,
              category: "Folder",
              lastModified: doc.lastModified,
            });
          }
        } else {
          files.push({ ...doc, type: "file" as const });
        }
      });
      itemsToProcess = [...Array.from(directSubfolders.values()), ...files];
    }

    // 2. Consistent Sorting for all views
    return itemsToProcess.sort((a, b) => {
      // Always keep folders at the top
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      const factor = sortOrder === "asc" ? 1 : -1;

      if (sortField === "name") {
        return a.name.localeCompare(b.name) * factor;
      }
      if (sortField === "category") {
        return (a.category || "").localeCompare(b.category || "") * factor;
      }
      if (sortField === "date") {
        return (
          (new Date(a.lastModified).getTime() -
            new Date(b.lastModified).getTime()) *
          factor
        );
      }
      return 0;
    });
  };

  const sortedItems = getFileSystemItems();

  const Breadcrumbs = () => {
    if (searchQuery) {
      return (
        <div className="flex items-center justify-between mb-4">
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
      <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-500 overflow-x-auto whitespace-nowrap pb-2">
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
      className={`flex h-screen w-full overflow-hidden bg-gray-50 transition-colors ${dragOver ? "bg-blue-50/50 outline-2 outline-dashed outline-blue-500 -outline-offset-2" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleGlobalDrop}
    >
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        setCurrentPath={setCurrentPath}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="px-8 pt-8 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
              <p className="text-sm text-gray-500">
                {activeTab === "docs"
                  ? `Managing ${sortedItems.length} items in this view`
                  : activeTab === "history"
                    ? "Recent changes and syncs"
                    : "Manage cloud accounts and preferences"}
              </p>
            </div>

            <div className="flex gap-3 items-center">
              {clipboard && (
                <button
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  onClick={() => {
                    if (clipboard.type === "copy") {
                      handleCopy(clipboard.ids, currentPath);
                    } else {
                      handleMove(clipboard.ids, currentPath);
                    }
                  }}
                >
                  <ClipboardCheck size={16} />
                  Paste Here ({clipboard.ids.length})
                </button>
              )}
              {activeTab === "docs" && (
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
                  <button
                    className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all hover:bg-gray-50"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload size={16} className="mr-2" />
                    Upload Files
                  </button>
                  <button
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all hover:opacity-90 disabled:opacity-50"
                    onClick={handleScan}
                    disabled={loading}
                  >
                    <RefreshCw
                      size={16}
                      className={`mr-2 ${loading ? "animate-spin" : ""}`}
                    />
                    Sync Local
                  </button>

                  <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button
                      className={`p-1.5 rounded-md transition-all ${
                        viewType === "grid"
                          ? "bg-gray-100 text-blue-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setViewType("grid")}
                      title="Grid View"
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      className={`p-1.5 rounded-md transition-all ${
                        viewType === "list"
                          ? "bg-gray-100 text-blue-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setViewType("list")}
                      title="List View"
                    >
                      <List size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          <div className="flex-1 min-w-0 overflow-y-auto px-8 pb-8 transition-all duration-200">
            {activeTab === "docs" && (
              <div className="flex flex-col h-full">
                <Breadcrumbs />
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
                  onSort={(field) => {
                    if (sortField === field) {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortField(field);
                      setSortOrder("asc");
                    }
                  }}
                />
              </div>
            )}
            {activeTab === "history" && <HistoryTimeline history={history} />}
            {activeTab === "settings" && (
              <Settings accounts={accounts} appSettings={appSettings} />
            )}
          </div>

          <aside
            className={`w-[450px] shrink-0 border-l border-gray-200 bg-white flex flex-col transition-all duration-300 ease-out z-10 
              ${selectedDoc ? "mr-0 visible" : "-mr-[450px] invisible"}`}
          >
            {selectedDoc && (
              <Visualizer
                document={selectedDoc}
                onClose={() => setSelectedDoc(null)}
              />
            )}
          </aside>
        </div>

        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={fetchData}
            onProgressUpdate={setUploadProgress}
          />
        )}

        {/* Global Upload Progress Bar */}
        {uploadProgress && (
          <div className="fixed bottom-6 right-6 w-96 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl z-2000 p-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {uploadProgress.current === uploadProgress.total
                    ? "Upload Complete"
                    : `Uploading ${uploadProgress.total} files...`}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {uploadProgress.fileName}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {Math.round(
                  (uploadProgress.current / uploadProgress.total) * 100,
                )}
                %
              </span>
            </div>

            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
                style={{
                  width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                }}
              />
            </div>

            <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400 font-medium">
              <span>
                {uploadProgress.current} of {uploadProgress.total} processed
              </span>
              {uploadProgress.current === uploadProgress.total && (
                <span className="flex items-center gap-1 text-green-600">
                  <ClipboardCheck size={10} /> Syncing directory...
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
