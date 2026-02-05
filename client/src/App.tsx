import { useEffect, useMemo } from "react";
import { LayoutGroup, MotionConfig } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";
import { manifestLoader } from "@/core/manifest/ManifestLoader";
import ViewRenderer from "@/components/views/ViewRenderer";
import { eventBus } from "@/core/services/EventBus";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";

function App() {
  const { appSettings, fetchSettings } = useSettingsStore();
  const { activeTab, model, viewType, navigate } = useUIStore();

  // Event Bus Listener for Navigation (Bridge until all components use the store)
  useEffect(() => {
    const handleNavigation = (featureId: string) => {
      navigate(featureId);
    };

    eventBus.on("navigation:feature", handleNavigation);
    return () => eventBus.off("navigation:feature", handleNavigation);
  }, [navigate]);

  // Update URL Parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Legacy viewid handling for documents
    if (activeTab.startsWith("docs_")) {
      params.set("viewid", activeTab.replace("docs_", ""));
    } else {
      params.set("viewid", activeTab);
    }

    // Clean up older params if not in docs
    if (!activeTab.startsWith("docs_")) {
      params.delete("id");
      params.delete("view");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [activeTab]);

  // Apply Theme
  useEffect(() => {
    if (appSettings?.app?.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [appSettings?.app?.theme]);

  // Update Page Title and Meta
  useEffect(() => {
    const appName = appSettings?.app?.name || "DocTracker";
    document.title = `${appName} | Smart Document Management`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      `Manage your documents with ${appName}. Secure, organized, and fast document tracking application.`,
    );
  }, [appSettings?.app?.name]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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
              <ViewRenderer key={activeTab} model={model} type={viewType} />
            </div>
          </LayoutGroup>
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
