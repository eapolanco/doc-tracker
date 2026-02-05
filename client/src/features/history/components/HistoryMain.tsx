import { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw } from "lucide-react";
import HistoryTimeline from "@/components/HistoryTimeline"; // For now, import the shared one
import type { HistoryItem } from "@/types";
import Page from "@/components/Page";
import Button from "@/components/Button";

const API_BASE = "/api";

export default function HistoryMain() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  // Define feature-specific header actions
  const headerActions = (
    <Button
      variant="primary"
      icon={RefreshCw}
      onClick={fetchHistory}
      loading={loading}
    >
      Refresh
    </Button>
  );

  if (loading && history.length === 0) {
    return (
      <Page title="History" actions={headerActions}>
        <div className="p-8 text-center text-gray-500">Loading history...</div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="History" actions={headerActions}>
        <div className="p-8 text-center text-red-500">{error}</div>
      </Page>
    );
  }

  return (
    <Page title="History" actions={headerActions}>
      <div className="h-full overflow-y-auto p-8">
        <HistoryTimeline history={history} />
      </div>
    </Page>
  );
}
