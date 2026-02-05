import { useEffect, useMemo } from "react";
import { LayoutGroup, MotionConfig } from "framer-motion";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";
import { manifestLoader } from "@/core/manifest/ManifestLoader";
import ViewRenderer from "@/components/views/ViewRenderer";
import { eventBus } from "@/core/services/EventBus";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";

function App() {
  const { appSettings } = useSettingsStore(); // fetchSettings removed, handled by React Query in components or here
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
      <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Toaster position="top-right" richColors closeButton />
        <Sidebar navItems={navItems} />

        <main className="flex-1 overflow-hidden flex flex-col">
          <LayoutGroup>
            <div className="flex flex-1 overflow-hidden relative">
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/app?viewid=docs_all" replace />}
                />
                <Route
                  path="/app"
                  element={
                    <ViewRenderer
                      key={activeTab}
                      model={model}
                      type={viewType}
                    />
                  }
                />
                {/* Add more specific routes if needed, but the modular arch loves the dynamic ViewRenderer */}
              </Routes>
            </div>
          </LayoutGroup>
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
