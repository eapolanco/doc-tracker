import {
  Layout,
  FileText,
  HardDrive,
  Cloud,
  Clock,
  Settings,
  Trash2,
} from "lucide-react";
import { version } from "../../package.json";
import type { NavItemDefinition } from "@/core/manifest/types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navItems: NavItemDefinition[];
}

const IconMap: Record<string, React.ReactNode> = {
  FileText: <FileText size={18} />,
  HardDrive: <HardDrive size={18} />,
  Cloud: <Cloud size={18} />,
  Clock: <Clock size={18} />,
  Settings: <Settings size={18} />,
  Trash2: <Trash2 size={18} />,
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  navItems,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col dark:bg-slate-900 dark:border-slate-800">
      <div
        className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3 cursor-pointer"
        onClick={() => setActiveTab("docs_all")}
      >
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40">
          <Layout size={20} />
        </div>
        <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
          DocTracker
        </span>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto space-y-6">
        {(() => {
          const sections: Record<string, NavItemDefinition[]> = {};
          navItems.forEach((item) => {
            const sec = item.section || "General";
            if (!sections[sec]) sections[sec] = [];
            sections[sec].push(item);
          });

          const sectionOrder = [
            "DOCUMENTS",
            "STORAGE",
            "HISTORY",
            "SYSTEM",
            "General",
          ];
          const existingSections = Object.keys(sections);
          const orderedSections = [
            ...sectionOrder.filter((s) => existingSections.includes(s)),
            ...existingSections.filter((s) => !sectionOrder.includes(s)),
          ];

          return orderedSections.map((sectionName) => (
            <div key={sectionName}>
              {sectionName !== "General" && (
                <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-3">
                  {sectionName}
                </div>
              )}
              <div className="space-y-1">
                {sections[sectionName]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((item) => (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                        activeTab === item.id
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      {item.icon && IconMap[item.icon] ? (
                        <span className="shrink-0">{IconMap[item.icon]}</span>
                      ) : (
                        <FileText size={18} className="shrink-0" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>
          ));
        })()}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-slate-800">
        <div className="text-[10px] font-bold text-gray-400 dark:text-slate-600 px-3 uppercase tracking-widest">
          Version {version}
        </div>
      </div>
    </aside>
  );
}
