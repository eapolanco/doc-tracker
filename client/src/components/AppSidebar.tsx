import * as React from "react";
import {
  Layout,
  FileText,
  HardDrive,
  Cloud,
  Clock,
  Settings,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { version } from "../../package.json";
import type { NavItemDefinition } from "@/core/manifest/types";
import { useUIStore } from "@/store/uiStore";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const IconMap: Record<string, React.ReactNode> = {
  FileText: <FileText />,
  HardDrive: <HardDrive />,
  Cloud: <Cloud />,
  Clock: <Clock />,
  Settings: <Settings />,
  Trash2: <Trash2 />,
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems: NavItemDefinition[];
}

export function AppSidebar({ navItems, ...props }: AppSidebarProps) {
  const { activeTab } = useUIStore();

  const sections: Record<string, NavItemDefinition[]> = {};
  navItems.forEach((item) => {
    const sec = item.section || "General";
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(item);
  });

  const sectionOrder = ["DOCUMENTS", "STORAGE", "HISTORY", "SYSTEM", "General"];
  const existingSections = Object.keys(sections);
  const orderedSections = [
    ...sectionOrder.filter((s) => existingSections.includes(s)),
    ...existingSections.filter((s) => !sectionOrder.includes(s)),
  ];

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/app?viewid=docs_all">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-sidebar-primary-foreground">
                  <Layout className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">DocTracker</span>
                  <span className="truncate text-xs">v{version}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {orderedSections.map((sectionName) => (
          <SidebarGroup key={sectionName}>
            {sectionName !== "General" && (
              <SidebarGroupLabel>{sectionName}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {sections[sectionName]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={activeTab === item.id}
                        tooltip={item.label}
                      >
                        <Link to={`/app?viewid=${item.id}`}>
                          {item.icon && IconMap[item.icon] ? (
                            IconMap[item.icon]
                          ) : (
                            <FileText />
                          )}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>{/* Footer content if needed */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
