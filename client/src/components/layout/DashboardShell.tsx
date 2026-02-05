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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {header}
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
