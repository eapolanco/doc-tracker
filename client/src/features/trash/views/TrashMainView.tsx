import { useState } from "react";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DocumentGrid from "@/components/DocumentGrid";
import Page from "@/components/Page";
import { createConditionalActions } from "@/hooks/useFeatureActions";
import LayoutSwitcher from "@/components/LayoutSwitcher";
import { useViewOptions } from "@/hooks/useViewOptions"; // Verify import path
import Button from "@/components/Button";
import { trashController } from "../controllers/TrashController";

export default function TrashMainView() {
  const queryClient = useQueryClient();
  const { viewType, setViewType, sortField, sortOrder, handleSort } =
    useViewOptions("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Data fetching
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["trash"],
    queryFn: () => trashController.fetch(),
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => trashController.restore(id)));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      // Also invalidate documents main list if we had that key, usually "documents"
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`Restored ${ids.length} documents`);
      setSelectedIds(new Set());
    },
    onError: () => {
      toast.error("Failed to restore items");
    },
  });

  // Empty trash mutation
  const emptyTrashMutation = useMutation({
    mutationFn: () => trashController.empty(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Trash emptied");
    },
    onError: () => {
      toast.error("Failed to empty trash");
    },
  });

  const [clipboard, setClipboard] = useState<{
    ids: string[];
    type: "copy" | "move";
  } | null>(null);

  // Trash actions
  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) return;
    restoreMutation.mutate(Array.from(selectedIds));
  };

  const handleRestoreAll = async () => {
    if (
      !confirm(
        `Are you sure you want to restore all ${documents.length} items from the Trash?`,
      )
    )
      return;
    restoreMutation.mutate(documents.map((d) => d.id));
  };

  const handleEmptyTrash = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete all items in the Trash?",
      )
    )
      return;
    emptyTrashMutation.mutate();
  };

  const isLoadingAction =
    restoreMutation.isPending || emptyTrashMutation.isPending || isLoading;

  // Define feature-specific header actions using the decoupled pattern
  const headerActions =
    documents.length > 0 &&
    createConditionalActions([
      {
        condition: selectedIds.size > 0,
        action: (
          <Button
            variant="primary"
            icon={RefreshCcw}
            onClick={handleRestoreSelected}
            loading={isLoadingAction}
          >
            Restore Selected ({selectedIds.size})
          </Button>
        ),
      },
      {
        condition: true,
        action: (
          <Button
            variant="success"
            icon={RefreshCcw}
            onClick={handleRestoreAll}
            loading={isLoadingAction}
          >
            Restore All
          </Button>
        ),
      },
      {
        condition: true,
        action: (
          <Button
            variant="danger"
            onClick={handleEmptyTrash}
            loading={isLoadingAction}
          >
            Empty Trash
          </Button>
        ),
      },
      {
        condition: true,
        action: (
          <LayoutSwitcher
            viewType={viewType}
            onViewChange={setViewType}
            className="ml-2"
          />
        ),
      },
    ]);

  return (
    <Page title="Trash Bin" actions={headerActions}>
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <DocumentGrid
          documents={documents}
          onPreview={() => {}} // No preview in trash usually, or read-only
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["trash"] })
          }
          viewType={viewType}
          isSearching={false}
          onMove={async () => {}}
          onSetClipboard={setClipboard}
          clipboardStatus={clipboard}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          isTrash={true}
          animationsEnabled={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </Page>
  );
}
