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
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <Layout className="text-accent" />
        DocTracker
      </div>

      <nav className="nav-group">
        <div className="nav-title">OVERVIEW</div>
        <div
          className={`nav-item ${activeTab === "docs" ? "active" : ""}`}
          onClick={() => setActiveTab("docs")}
        >
          <FileText />
          Documents
        </div>
        <div
          className={`nav-item ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <Clock />
          History
        </div>
      </nav>

      <nav className="nav-group">
        <div className="nav-title">STORAGE</div>
        <div className="nav-item">
          <HardDrive />
          Local Drive
        </div>
        <div className="nav-item">
          <Cloud />
          OneDrive
        </div>
        <div className="nav-item">
          <Cloud />
          Google Drive
        </div>
      </nav>

      <div style={{ marginTop: "auto" }}>
        <div
          className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <Settings />
          Settings
        </div>
      </div>
    </aside>
  );
}
