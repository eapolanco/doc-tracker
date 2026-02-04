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
    const baseDocs = documents.filter((doc) => {
      const matchesSource = sourceFilter
        ? doc.cloudSource === sourceFilter
        : true;
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSource && matchesSearch;
    });

    if (searchQuery) {
      return baseDocs.map((doc) => ({ ...doc, type: "file" as const }));
    }

    const items: FileSystemItem[] = [];
    const directSubfolders = new Map<string, FolderItem>();

    baseDocs.forEach((doc) => {
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
              currentPath === "" ? folderName : `${currentPath}/${folderName}`,
            type: "folder",
            cloudSource: doc.cloudSource,
            category: "Folder",
            lastModified: doc.lastModified,
          });
        }
      } else {
        items.push({ ...doc, type: "file" as const });
      }
    });

    return [...Array.from(directSubfolders.values()), ...items];
  };

  const filteredItems = getFileSystemItems();

  const Breadcrumbs = () => {
    const parts = currentPath ? currentPath.split("/") : [];
    return (
      <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-500 overflow-x-auto whitespace-nowrap pb-2">
        <button
          onClick={() => setCurrentPath("")}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
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
                className="hover:text-blue-600 transition-colors"
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
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
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
                  ? `Managing ${filteredItems.length} items in this view`
                  : activeTab === "history"
                    ? "Recent changes and syncs"
                    : "Manage cloud accounts and preferences"}
              </p>
            </div>

            <div className="flex gap-3 items-center">
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
                  documents={filteredItems}
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
          />
        )}
      </main>
    </div>
  );
}

export default App;
