import { useUIStore } from "@/store/uiStore";
import { manifestLoader } from "@/core/manifest/ManifestLoader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Breadcrumbs - Navigation breadcrumb component
 *
 * Displays the current location in the app hierarchy
 * Essential for SaaS dashboards to provide context
 * Uses shadcn/ui Breadcrumb components for consistency
 */
export function Breadcrumbs() {
  const { activeTab } = useUIStore();

  const navItems = manifestLoader.getNavItems();
  const currentItem = navItems.find((item) => item.id === activeTab);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/app?viewid=docs_all">
            DocTracker
          </BreadcrumbLink>
        </BreadcrumbItem>
        {currentItem && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentItem.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
