import {
  Layout,
  FileText,
  Clock,
  Settings,
  HardDrive,
  Cloud,
} from "lucide-react";
import { version } from "../../package.json";

interface SidebarProps {
  activeTab: "docs" | "history" | "settings";
  setActiveTab: (tab: "docs" | "history" | "settings") => void;
  sourceFilter: string | null;
  setSourceFilter: (source: string | null) => void;
  setCurrentPath: (path: string) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  sourceFilter,
  setSourceFilter,
  setCurrentPath,
}: SidebarProps) {
  const handleSourceClick = (source: string | null) => {
    setActiveTab("docs");
    setSourceFilter(source);
    setCurrentPath("");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div
        className="p-6 border-b border-gray-200 flex items-center gap-3 cursor-pointer"
        onClick={() => handleSourceClick(null)}
      >
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
          <Layout size={20} />
        </div>
        <span className="text-xl font-bold text-gray-900">DocTracker</span>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            OVERVIEW
          </div>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "docs" && !sourceFilter
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => handleSourceClick(null)}
          >
            <FileText size={18} />
            All Documents
          </button>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => {
              setActiveTab("history");
              setSourceFilter(null);
            }}
          >
            <Clock size={18} />
            History
          </button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            STORAGE
          </div>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              sourceFilter === "local"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => handleSourceClick("local")}
          >
            <HardDrive size={18} />
            Local Drive
          </button>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              sourceFilter === "onedrive"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => handleSourceClick("onedrive")}
          >
            <Cloud size={18} />
            OneDrive
          </button>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              sourceFilter === "google"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => handleSourceClick("google")}
          >
            <Cloud size={18} />
            Google Drive
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "settings"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
          onClick={() => {
            setActiveTab("settings");
            setSourceFilter(null);
          }}
        >
          <Settings size={18} />
          Settings
        </button>
        <div className="mt-2 text-[0.7rem] text-gray-400 px-3 opacity-50">
          v{version}
        </div>
      </div>
    </aside>
  );
}
