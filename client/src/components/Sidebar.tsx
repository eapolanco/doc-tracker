import { Layout } from "lucide-react";
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
  navItems,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div
        className="p-6 border-b border-gray-200 flex items-center gap-3 cursor-pointer"
        onClick={() => setActiveTab("docs")}
      >
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
          <Layout size={20} />
        </div>
        <span className="text-xl font-bold text-gray-900">DocTracker</span>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Grouped Dynamic Feature Items */}
        {(() => {
          const sections: Record<string, FeatureNavItem[]> = {};
          // Group by section
          navItems.forEach((item) => {
            const sec = item.section || "General"; // Default to General if undefined
            if (!sections[sec]) sections[sec] = [];
            sections[sec].push(item);
          });

          // Define section order
          const sectionOrder = ["OVERVIEW", "STORAGE", "SYSTEM", "General"];
          // Get all unique sections, prioritizing order, then appending others
          const existingSections = Object.keys(sections);
          const orderedSections = [
            ...sectionOrder.filter((s) => existingSections.includes(s)),
            ...existingSections.filter((s) => !sectionOrder.includes(s)),
          ];

          return orderedSections.map((sectionName) => (
            <div key={sectionName} className="mb-6">
              {sectionName !== "General" && (
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                  {sectionName}
                </div>
              )}
              {sections[sectionName]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((item) => (
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
                        const tabName = item.path.startsWith("/")
                          ? item.path.substring(1)
                          : item.path;
                        setActiveTab(tabName);
                        // Default simple routing - we don't have setSourceFilter here anymore
                        // Features relying on filters must handle it via events or other means
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
          ));
        })()}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="mt-2 text-[0.7rem] text-gray-400 px-3 opacity-50">
          v{version}
        </div>
      </div>
    </aside>
  );
}
