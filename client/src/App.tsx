import { useEffect, useMemo } from "react";
import { LayoutGroup, MotionConfig } from "framer-motion";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { manifestLoader } from "@/core/manifest/ManifestLoader";
import ViewRenderer from "@/components/views/ViewRenderer";
import { eventBus } from "@/core/services/EventBus";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { DashboardShell } from "@/components/layout";
import { Breadcrumbs } from "@/components/layout";

function App() {
  const { appSettings } = useSettingsStore();
  const { activeTab, model, viewType, navigate } = useUIStore();
  const location = useLocation();

  // Sync Router with Store
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let viewId = params.get("viewid");

    // Normalize viewid for documents (all, local, etc -> docs_all, docs_local)
    if (viewId && ["all", "local", "onedrive", "google"].includes(viewId)) {
      viewId = `docs_${viewId}`;
    }

    if (viewId && viewId !== activeTab) {
      navigate(viewId);
    }
  }, [location, navigate, activeTab]);

  // Event Bus Listener (Bridge)
  useEffect(() => {
    const handleNavigation = (featureId: string) => navigate(featureId);
    eventBus.on("navigation:feature", handleNavigation);
    return () => eventBus.off("navigation:feature", handleNavigation);
  }, [navigate]);

  // Apply Theme
  useEffect(() => {
    if (appSettings?.app?.theme === "dark")
      document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [appSettings?.app?.theme]);

  const navItems = useMemo(() => manifestLoader.getNavItems(), []);

  return (
    <MotionConfig
      transition={
        appSettings?.app?.animationsEnabled ? undefined : { duration: 0 }
      }
    >
      <Toaster position="top-right" richColors closeButton />
      <DashboardShell navItems={navItems} header={<Breadcrumbs />}>
        <LayoutGroup>
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/app?viewid=docs_all" replace />}
            />
            <Route
              path="/app"
              element={
                <ViewRenderer key={activeTab} model={model} type={viewType} />
              }
            />
          </Routes>
        </LayoutGroup>
      </DashboardShell>
    </MotionConfig>
  );
}

export default App;
