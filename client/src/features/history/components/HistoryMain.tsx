import { useState, useEffect } from "react";
import axios from "axios";
import HistoryTimeline from "@/components/HistoryTimeline"; // For now, import the shared one
import type { HistoryItem } from "@/types";

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
      const res = await axios.get(`${API_BASE}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading history...</div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Use the existing component, but now it's powered by this feature's own state */}
      <HistoryTimeline history={history} />
    </div>
  );
}
