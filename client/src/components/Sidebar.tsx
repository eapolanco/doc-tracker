import {
  Layout,
  FileText,
  Clock,
  Settings,
  HardDrive,
  Cloud,
} from "lucide-react";

interface SidebarProps {
  activeTab: "docs" | "history" | "settings";
  setActiveTab: (tab: "docs" | "history" | "settings") => void;
  sourceFilter: string | null;
  setSourceFilter: (source: string | null) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  sourceFilter,
  setSourceFilter,
}: SidebarProps) {
  const handleSourceClick = (source: string | null) => {
    setActiveTab("docs");
    setSourceFilter(source);
  };

  return (
    <aside className="sidebar">
      <div className="logo" onClick={() => handleSourceClick(null)} style={{ cursor: "pointer" }}>
        <Layout className="text-accent" />
        DocTracker
      </div>

      <nav className="nav-group">
        <div className="nav-title">OVERVIEW</div>
        <div
          className={`nav-item ${activeTab === "docs" && !sourceFilter ? "active" : ""}`}
          onClick={() => handleSourceClick(null)}
        >
          <FileText />
          All Documents
        </div>
        <div
          className={`nav-item ${activeTab === "history" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("history");
            setSourceFilter(null);
          }}
        >
          <Clock />
          History
        </div>
      </nav>

      <nav className="nav-group">
        <div className="nav-title">STORAGE</div>
        <div
          className={`nav-item ${sourceFilter === "local" ? "active" : ""}`}
          onClick={() => handleSourceClick("local")}
        >
          <HardDrive />
          Local Drive
        </div>
        <div
          className={`nav-item ${sourceFilter === "onedrive" ? "active" : ""}`}
          onClick={() => handleSourceClick("onedrive")}
        >
          <Cloud />
          OneDrive
        </div>
        <div
          className={`nav-item ${sourceFilter === "google" ? "active" : ""}`}
          onClick={() => handleSourceClick("google")}
        >
          <Cloud />
          Google Drive
        </div>
      </nav>

      <div style={{ marginTop: "auto" }}>
        <div
          className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("settings");
            setSourceFilter(null);
          }}
        >
          <Settings />
          Settings
        </div>
      </div>
    </aside>
  );
}
