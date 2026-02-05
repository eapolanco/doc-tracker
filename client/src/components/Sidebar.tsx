import {
  Layout,
  FileText,
  Settings,
  HardDrive,
  Cloud,
  Trash2,
} from "lucide-react";
import { version } from "../../package.json";
import type { FeatureNavItem } from "../core/registry/types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sourceFilter: string | null;
  setSourceFilter: (source: string | null) => void;
  setCurrentPath: (path: string) => void;
  navItems: FeatureNavItem[];
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  sourceFilter,
  setSourceFilter,
  setCurrentPath,
  navItems,
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

          {/* Dynamic Feature Items */}
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === (item.path?.replace("/", "") || item.id)
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.path) {
                  // Primitive routing: simple state switch
                  // Extract ID from path or use ID.
                  // convention: path "/history" -> tab "history"
                  const tabName = item.path.startsWith("/")
                    ? item.path.substring(1)
                    : item.path;
                  setActiveTab(tabName);
                  setSourceFilter(null);
                }
              }}
            >
              {item.icon && (
                <span className="w-[18px] h-[18px]">{item.icon}</span>
              )}
              {item.label}
            </button>
          ))}
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

        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            SYSTEM
          </div>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "trash"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => {
              setActiveTab("trash");
              setSourceFilter(null);
              setCurrentPath("");
            }}
          >
            <Trash2 size={18} />
            Trash
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
