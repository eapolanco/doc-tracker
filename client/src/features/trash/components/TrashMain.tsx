import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import DocumentGrid from "@/components/DocumentGrid";
import type { Document } from "@/types";
import Page from "@/components/Page";

const API_BASE = "/api";

export default function TrashMain() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<"name" | "date" | "category">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [clipboard, setClipboard] = useState<{
    ids: string[];
    type: "copy" | "move";
  } | null>(null);

  // Fetch trash items
  const fetchTrash = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/documents?trash=true`);
      setDocuments(res.data);
    } catch (err) {
      console.error("Error fetching trash:", err);
      toast.error("Failed to load trash items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  // Trash actions

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
      fetchTrash();
    } catch (err) {
      console.error("Error emptying trash:", err);
      toast.error("Failed to empty trash");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="Trash Bin"
      actions={
        documents.length > 0 && (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all hover:bg-red-700"
            onClick={handleEmptyTrash}
            disabled={loading}
          >
            Empty Trash
          </button>
        )
      }
    >
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <DocumentGrid
          documents={documents}
          onPreview={() => {}} // No preview in trash usually, or read-only
          onRefresh={fetchTrash}
          viewType={viewType}
          isSearching={false}
          // No move/copy allowed IN trash usually, but maybe restore move?
          // We'll pass handlers to satisfy typescript
          onMove={async () => {}}
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
          isTrash={true}
          animationsEnabled={true} // Defaults
        />
      </div>
    </Page>
  );
}
