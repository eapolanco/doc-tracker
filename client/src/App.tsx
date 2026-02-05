import { useState, useEffect, useCallback } from "react";
import {
  motion,
  LayoutGroup,
  AnimatePresence,
  MotionConfig,
} from "framer-motion";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import DocumentGrid from "@/components/DocumentGrid";
import Settings from "@/components/Settings";
import Visualizer from "@/components/Visualizer";
import UploadModal from "@/components/UploadModal";
import CreateFolderModal from "@/components/CreateFolderModal";
import {
  RefreshCw,
  Upload,
  LayoutGrid,
  List,
  Search,
  FolderPlus,
  Trash2,
  ChevronRight,
  Home,
  ClipboardCheck,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import type {
  Document,
  CloudAccount,
  AppSettings,
  FileSystemItem,
} from "@/types";
import { appRegistry } from "@/core/registry/FeatureRegistry";

const API_BASE = "/api";

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  // History state managed by feature now
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<string>("docs");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
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

  // Parse URL Parameters on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const viewIdParam = params.get("viewid");

    if (viewIdParam) {
      if (viewIdParam === "history") {
        setActiveTab("history");
        setSourceFilter(null);
      } else if (viewIdParam === "settings") {
        setActiveTab("settings");
        setSourceFilter(null);
      } else if (["all", "local", "onedrive", "google"].includes(viewIdParam)) {
        setActiveTab("docs");
        setSourceFilter(viewIdParam === "all" ? null : viewIdParam);
      } else if (viewIdParam === "grid" || viewIdParam === "list") {
        setViewType(viewIdParam);
      }
    }

    if (idParam) {
      const decodedId = decodeURIComponent(idParam);
      // If it looks like a path (contains slashes or starts with /)
      if (decodedId.includes("/") || decodedId.startsWith("/")) {
        // Remove leading slash if it exists for consistent internal path matching
        setCurrentPath(
          decodedId.startsWith("/") ? decodedId.substring(1) : decodedId,
        );
      } else {
        // Likely a document UUID, will be handled once documents load
      }
    }
  }, []);

  // Update URL Parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Update viewid based on active tab and filter
    let viewId = "";
    if (activeTab === "history") viewId = "history";
    else if (activeTab === "settings") viewId = "settings";
    else {
      if (!sourceFilter) viewId = "all";
      else viewId = sourceFilter;
    }

    if (viewId) params.set("viewid", viewId);

    // Always include viewType as well (could be a separate param or integrated)
    // The user specifically asked for viewid=...
    // If they want viewid to point to specific database views, we might need more.
    // For now, let's treat viewid as the "section" and add 'view' for layout.
    params.set("view", viewType);

    // Update id based on current selection or path
    if (selectedDoc) {
      params.set("id", selectedDoc.id);
    } else if (currentPath) {
      // Prepend / to path as in user example
      params.set("id", "/" + currentPath);
    } else {
      params.delete("id");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [activeTab, sourceFilter, currentPath, selectedDoc, viewType]);

  // Handle document selection from ID after loading
  useEffect(() => {
    if (documents.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get("id");
      if (idParam && !idParam.includes("/") && !idParam.startsWith("/")) {
        const doc = documents.find((d) => d.id === idParam);
        if (doc) {
          // 1. Set the selected document for the Visualizer
          setSelectedDoc(doc);

          // 2. Ensure we are on the "docs" tab to see it
          if (activeTab !== "docs") {
            setActiveTab("docs");
          }

          // 3. Set current path to the folder containing the document
          // doc.path is something like "Finance/Taxes/doc.pdf"
          const pathParts = doc.path.split("/");
          if (pathParts.length > 1) {
            const parentPath = pathParts.slice(0, -1).join("/");
            if (currentPath !== parentPath) {
              setCurrentPath(parentPath);
            }
          } else {
            if (currentPath !== "") {
              setCurrentPath("");
            }
          }
        }
      }
    }
  }, [documents, activeTab, currentPath]);

  useEffect(() => {
    console.log("Active Tab:", activeTab);
    console.log("Selected Document:", selectedDoc?.name);
  }, [activeTab, selectedDoc]);

  // Close preview panel when navigating to a different folder
  useEffect(() => {
    if (selectedDoc) {
      setSelectedDoc(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  // Close preview panel when changing tabs or source filter
  useEffect(() => {
    if (selectedDoc) {
      setSelectedDoc(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sourceFilter]);

  // Apply Theme
  useEffect(() => {
    if (appSettings?.app?.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [appSettings?.app?.theme]);

  // Update Document Title
  useEffect(() => {
    document.title = appSettings?.app?.name || "DocTracker";
  }, [appSettings?.app?.name]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const isTrash = activeTab === "trash";
      const [docsRes, accRes, setRes] = await Promise.all([
        axios.get(`${API_BASE}/documents${isTrash ? "?trash=true" : ""}`),
        // History now fetched by the feature itself
        axios.get(`${API_BASE}/accounts`),
        axios.get(`${API_BASE}/settings`),
      ]);
      setDocuments(docsRes.data);
      // setHistory(histRes.data); // Removed
      setAccounts(accRes.data);
      setAppSettings(setRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

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

  const handleEmptyTrash = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete all items in the Trash?",
      )
    )
      return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/documents/trash/empty`);
      toast.success("Trash emptied");
      await fetchData();
    } catch (err) {
      console.error("Error emptying trash:", err);
      toast.error("Failed to empty trash");
    } finally {
      setLoading(false);
    }
  };

  const submitCreateFolder = async (folderName: string) => {
    if (!folderName) return;

    // Close modal first
    setShowCreateFolderModal(false);

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/folders`, {
        name: folderName,
        parentPath: currentPath,
      });
      await fetchData();
      toast.success("Folder created successfully");
    } catch (err) {
      console.error("Create folder error:", err);
      toast.error("Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      // Optimistically update state
      setAppSettings(newSettings);
      await axios.post(`${API_BASE}/settings`, newSettings);
      toast.success("Settings saved");
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings");
      // Revert on error - fetching data again
      fetchData();
    }
  };

  const handleCreateFolder = () => {
    setShowCreateFolderModal(true);
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
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
    }

    await axios.post(`${API_BASE}/scan`);
    await fetchData();
    setLoading(false);
    toast.success(`Successfully uploaded ${files.length} documents`);

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
  }, [fetchData]);

  useEffect(() => {
    // Check for OAuth status in URL
    const params = new URLSearchParams(window.location.search);
    if (params.has("success") || params.has("error")) {
      setActiveTab("settings");
    }
  }, []);

  const getTitle = () => {
    if (activeTab === "docs") {
      if (sourceFilter === "local") return "Local Documents";
      if (sourceFilter === "onedrive") return "OneDrive Documents";
      if (sourceFilter === "google") return "Google Drive Documents";
      return "All Documents";
    }
    if (activeTab === "history") return "Activity History";
    if (activeTab === "settings") return "App Settings";
    if (activeTab === "trash") return "Trash";
    return appRegistry.get(activeTab)?.name || "";
  };

  // Modify getFileSystemItems to use the DB type if available and avoid duplicates
  // This replaces the previous implementation
  const getFileSystemItems = () => {
    const filteredBySource = documents.filter((doc) => {
      return sourceFilter ? doc.cloudSource === sourceFilter : true;
    });

    if (searchQuery) {
      // Global search returns everything matching
      const searchLower = searchQuery.toLowerCase();
      return filteredBySource.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchLower) ||
          doc.category.toLowerCase().includes(searchLower) ||
          doc.path.toLowerCase().includes(searchLower),
      );
    }

    // Combine DB folders and inferred folders (for backward compatibility or untracked files)
    // Ideally we trust 'type' from DB now.

    // Filter items to show only direct children of currentPath
    const visibleItems = filteredBySource.filter((doc) => {
      const docPath = doc.path;
      if (currentPath === "") {
        // Show items at root (no slashes)
        return !docPath.includes("/");
      }
      // Show items directly in currentPath
      // e.g. current="Finance", doc="Finance/doc.pdf" -> OK
      // doc="Finance/Taxes/doc.pdf" -> NO (it's in subfolder)
      if (!docPath.startsWith(currentPath + "/")) return false;

      const relativePart = docPath.substring(currentPath.length + 1);
      return !relativePart.includes("/");
    });

    // Also need to find implicit folders if they haven't been scanned as objects yet?
    // With the new scan logic, folders should exist as objects.
    // Let's rely on that for now, but if we need implicit folders we can add logic back.
    // Actually, let's keep the implicit logic for robustness in case DB isn't fully synced or manual files dropped.

    // MAP of items to return
    const itemsMap = new Map<string, FileSystemItem>();

    // Add explicit items first
    visibleItems.forEach((item) => {
      itemsMap.set(item.name, item);
    });

    // Add implicit folders (look at all files deeper than current path)
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
              path: `${currentPath}/${folderName}`,
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
      // Folders always first
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      // Then recently uploaded (within 15 minutes)
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

      // Default sort by name
      return a.name.localeCompare(b.name);
    });
  };

  const sortedItems = getFileSystemItems();

  const Breadcrumbs = () => {
    if (searchQuery) {
      return (
        <div className="flex items-center justify-between mt-4">
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
      <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-500 flex-wrap">
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
          <Home size={14} /> // You might need to add Home to imports if it was
          removed in my replacement content instructions, checking... Home was
          in original imports? Yes, line 23. My replacement removed it? // Wait,
          I replaced lines 1-max. I need to ensure Home and others are kept. //
          I will use a different strategy for imports if I can't see them all.
          // Wait, I see the imports in my replacement content. I removed Home!
          I need to put it back.
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
  // Wait, I am overwriting the whole top section basically. I need to be careful with imports.
  // The original imports included 'Home' and 'ChevronRight'. I need to include them.

  return (
    <MotionConfig
      transition={
        appSettings?.app?.animationsEnabled ? undefined : { duration: 0 }
      }
    >
      <div
        className={`flex h-screen w-full overflow-hidden bg-gray-50 transition-colors ${dragOver ? "bg-blue-50/50 outline-2 outline-dashed outline-blue-500 -outline-offset-2" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleGlobalDrop}
      >
        <Toaster position="top-right" richColors closeButton />
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          setCurrentPath={setCurrentPath}
          navItems={appRegistry.getNavItems()}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          <header className="px-8 pt-8 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getTitle()}
                </h1>
                <p className="text-sm text-gray-500">
                  {activeTab === "docs" || activeTab === "trash"
                    ? `Managing ${sortedItems.length} items in this view`
                    : activeTab === "history"
                      ? "Recent changes and syncs"
                      : "Manage cloud accounts and preferences"}
                </p>
              </div>

              <div className="flex gap-3 items-center">
                {(activeTab === "docs" || activeTab === "trash") && (
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
                      className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all hover:bg-gray-50"
                      onClick={handleCreateFolder}
                    >
                      <FolderPlus size={16} className="mr-2" />
                      New Folder
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

                    {activeTab === "trash" && (
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all hover:bg-red-700"
                        onClick={handleEmptyTrash}
                        disabled={loading || sortedItems.length === 0}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Empty Trash
                      </button>
                    )}

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
                {(activeTab === "docs" || activeTab === "trash") && (
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
                      isTrash={activeTab === "trash"}
                      animationsEnabled={appSettings?.app?.animationsEnabled}
                    />
                  </div>
                )}
                {/* Dynamic Feature Rendering */}
                {appRegistry.get(activeTab)?.viewComponent}

                {activeTab === "settings" && (
                  <Settings
                    accounts={accounts}
                    appSettings={appSettings}
                    onSaveSettings={handleSaveSettings}
                  />
                )}
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
              defaultCategory={
                currentPath.split("/").filter(Boolean).pop() || "Personal"
              }
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 group"
                >
                  <ClipboardCheck size={18} />
                  Paste Here
                </button>

                <button
                  onClick={() => setClipboard(null)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Clear Clipboard"
                >
                  <X size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global Upload Progress Bar */}
          <AnimatePresence>
            {uploadProgress !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed bottom-6 right-6 w-96 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl z-2000 p-4"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
