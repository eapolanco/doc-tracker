import { type ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import type { NavItemDefinition } from "@/core/manifest/types";
import { AppSidebar } from "./AppSidebar";

interface DashboardShellProps {
  navItems: NavItemDefinition[];
  children: ReactNode;
  header?: ReactNode;
}

/**
 * DashboardShell - The foundational layout component for the SaaS dashboard
 *
 * This component implements the recommended shadcn/ui "Shell" pattern:
 * - SidebarProvider: Manages collapsible state
 * - AppSidebar: Custom sidebar with navigation
 * - SidebarInset: Creates the modern "framed" SaaS look
 * - Header: Contains trigger, breadcrumbs, and actions
 */
export function DashboardShell({
  navItems,
  children,
  header,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar navItems={navItems} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {header}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
