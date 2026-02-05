import { RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import HistoryTimeline from "@/components/HistoryTimeline"; // For now, import the shared one
import Page from "@/components/Page";
import Button from "@/components/Button";
import { historyController } from "../controllers/HistoryController";

export default function HistoryMainView() {
  const {
    data: history = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["history"],
    queryFn: () => historyController.fetch(),
  });

  // Define feature-specific header actions
  const headerActions = (
    <Button
      variant="primary"
      icon={RefreshCw}
      onClick={() => refetch()}
      loading={isLoading || isRefetching}
    >
      Refresh
    </Button>
  );

  if (isLoading) {
    return (
      <Page title="History" actions={headerActions}>
        <div className="p-8 text-center text-gray-500">Loading history...</div>
      </Page>
    );
  }

  if (isError) {
    return (
      <Page title="History" actions={headerActions}>
        <div className="p-8 text-center text-red-500">
          Failed to load history: {(error as Error).message}
        </div>
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
