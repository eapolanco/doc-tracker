import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";
import DocumentGrid from "@/components/DocumentGrid";
import type { Document } from "@/types";
import Page from "@/components/Page";
import { createConditionalActions } from "@/hooks/useFeatureActions";

const API_BASE = "/api";

export default function TrashMain() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<"name" | "date" | "category">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Clear selection when documents change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [documents.length]);

  // Trash actions
  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          axios.post(`${API_BASE}/documents/${id}/restore`),
        ),
      );
      toast.success(`Restored ${selectedIds.size} documents`);
      setSelectedIds(new Set());
      fetchTrash();
    } catch (err) {
      console.error("Error restoring selected:", err);
      toast.error("Failed to restore selected items");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreAll = async () => {
    if (
      !confirm(
        `Are you sure you want to restore all ${documents.length} items from the Trash?`,
      )
    )
      return;
    try {
      setLoading(true);
      await Promise.all(
        documents.map((doc) =>
          axios.post(`${API_BASE}/documents/${doc.id}/restore`),
        ),
      );
      toast.success(`Restored ${documents.length} documents`);
      fetchTrash();
    } catch (err) {
      console.error("Error restoring all:", err);
      toast.error("Failed to restore all items");
    } finally {
      setLoading(false);
    }
  };

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

  // Define feature-specific header actions using the decoupled pattern
  const headerActions =
    documents.length > 0 &&
    createConditionalActions([
      {
        condition: selectedIds.size > 0,
        action: (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-blue-700"
            onClick={handleRestoreSelected}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Restore Selected ({selectedIds.size})
          </button>
        ),
      },
      {
        condition: true,
        action: (
          <button
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-emerald-700"
            onClick={handleRestoreAll}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Restore All
          </button>
        ),
      },
      {
        condition: true,
        action: (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all hover:bg-red-700"
            onClick={handleEmptyTrash}
            disabled={loading}
          >
            Empty Trash
          </button>
        ),
      },
    ]);

  return (
    <Page title="Trash Bin" actions={headerActions}>
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
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </Page>
  );
}
