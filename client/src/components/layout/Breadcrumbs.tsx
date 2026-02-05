import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useUIStore } from "@/store/uiStore";
import { manifestLoader } from "@/core/manifest/ManifestLoader";

/**
 * Breadcrumbs - Navigation breadcrumb component
 *
 * Displays the current location in the app hierarchy
 * Essential for SaaS dashboards to provide context
 */
export function Breadcrumbs() {
  const { activeTab } = useUIStore();

  const navItems = manifestLoader.getNavItems();
  const currentItem = navItems.find((item) => item.id === activeTab);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        to="/app?viewid=docs_all"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {currentItem && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{currentItem.label}</span>
        </>
      )}
    </div>
  );
}
