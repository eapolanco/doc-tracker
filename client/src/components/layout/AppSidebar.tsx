import * as React from "react";
import {
  FileText,
  HardDrive,
  Cloud,
  Clock,
  Settings,
  Trash2,
  type LucideIcon,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";

const IconMap: Record<string, LucideIcon> = {
  FileText: FileText,
  HardDrive: HardDrive,
  Cloud: Cloud,
  Clock: Clock,
  Settings: Settings,
  Trash2: Trash2,
};

// Mock user data - in a real app this would come from a store
const data = {
  user: {
    name: "Demo User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "DocTracker Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
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
        <TeamSwitcher teams={data.teams} />
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
                  .map((item) => {
                    const IconComponent =
                      item.icon && IconMap[item.icon]
                        ? IconMap[item.icon]
                        : FileText;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeTab === item.id}
                          tooltip={item.label}
                        >
                          <Link to={`/app?viewid=${item.id}`}>
                            <IconComponent />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
