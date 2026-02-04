import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import DocumentGrid from "@/components/DocumentGrid";
import HistoryTimeline from "@/components/HistoryTimeline";
import Settings from "@/components/Settings";
import { RefreshCw } from "lucide-react";
import type { Document, HistoryItem, CloudAccount, AppSettings } from "@/types";

const API_BASE = "http://localhost:3001/api";

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<"docs" | "history" | "settings">(
    "docs",
  );
  const [loading, setLoading] = useState(false);

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
        return "Documents";
      case "history":
        return "Activity History";
      case "settings":
        return "App Settings";
      default:
        return "";
    }
  };

  return (
    <>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {getTitle()}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {activeTab === "docs"
                ? `Managing ${documents.length} documents`
                : activeTab === "history"
                  ? "Recent changes and syncs"
                  : "Manage cloud accounts and preferences"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {activeTab === "docs" && (
              <button
                className="btn-primary"
                onClick={handleScan}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  style={{
                    marginRight: "0.5rem",
                    animation: loading ? "spin 1s linear infinite" : "none",
                  }}
                />
                Sync Local
              </button>
            )}
          </div>
        </header>

        {activeTab === "docs" && <DocumentGrid documents={documents} />}
        {activeTab === "history" && <HistoryTimeline history={history} />}
        {activeTab === "settings" && (
          <Settings accounts={accounts} appSettings={appSettings} />
        )}
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default App;
