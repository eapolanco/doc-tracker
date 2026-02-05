import { PageHeader } from "@/components/blocks/PageHeader";
import { EmptyState } from "@/components/blocks/EmptyState";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus } from "lucide-react";

/**
 * ExampleDashboardPage - Example of using the new component structure
 *
 * This demonstrates:
 * - PageHeader block for consistent page headers
 * - Card UI components for content containers
 * - Badge UI components for status indicators
 * - EmptyState block for empty data states
 */
export function ExampleDashboardPage() {
  const hasData = false; // Toggle this to see different states

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Welcome to your document management dashboard"
        actions={
          <>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {hasData ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Total Documents</CardTitle>
                  <Badge>Active</Badge>
                </div>
                <CardDescription>
                  All documents in your workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground mt-2">
                  +20% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
                <CardDescription>Documents uploaded this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">56</div>
                <p className="text-xs text-muted-foreground mt-2">
                  +12% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Used</CardTitle>
                <CardDescription>Total storage consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2.4 GB</div>
                <p className="text-xs text-muted-foreground mt-2">
                  24% of 10 GB limit
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Get started by uploading your first document"
            action={{
              label: "Upload Document",
              onClick: () => console.log("Upload clicked"),
            }}
          />
        )}
      </div>
    </div>
  );
}
