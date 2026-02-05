import { useState, useEffect } from "react";
import { LayoutGroup, MotionConfig } from "framer-motion";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";
import type { AppSettings } from "@/types";
import { appRegistry } from "@/core/registry/FeatureRegistry";
import { eventBus } from "@/core/services/EventBus"; // Import EventBus

const API_BASE = "/api";

function App() {
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const viewIdParam = params.get("viewid");

    // Check for OAuth callbacks first
    if (params.has("success") || params.has("error")) {
      return "settings";
    }

    if (viewIdParam) {
      if (["all", "local", "onedrive", "google"].includes(viewIdParam)) {
        return "docs";
      }
      const feature = appRegistry.get(viewIdParam);
      if (feature) {
        return feature.id;
      }
    }
    return "docs";
  };

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  // Event Bus Listener for Navigation
  useEffect(() => {
    const handleNavigation = (featureId: string) => {
      setActiveTab(featureId);
    };

    eventBus.on("navigation:feature", handleNavigation);

    return () => {
      eventBus.off("navigation:feature", handleNavigation);
    };
  }, []);

  // Update URL Parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    let viewId = "";
    if (activeTab === "docs") {
      // Leave viewid as is if it was set by DocumentsMain (e.g. "local")
      // OR if it's empty, default to "all" is handled by DocumentsMain
      // App.tsx mostly cares about switching features now.
      // If we switched TO docs, we might want to default to "all" if param is missing?
      // But existing params are preserved.
      // Wait, if I switch from Settings to Docs, params might still be `viewid=settings`?
      // Yes.
      if (
        params.get("viewid") !== "local" &&
        params.get("viewid") !== "onedrive" &&
        params.get("viewid") !== "google" &&
        params.get("viewid") !== "all"
      ) {
        viewId = "all";
      }
    } else {
      viewId = activeTab;
    }

    if (viewId) params.set("viewid", viewId);

    // We don't touch 'id' or 'view' params here anymore, feature handles them.
    // Except we might want to clean them up if switching features?
    if (activeTab !== "docs") {
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

  // Update Document Title
  useEffect(() => {
    document.title = appSettings?.app?.name || "DocTracker";
  }, [appSettings?.app?.name]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/settings`);
        setAppSettings(res.data);
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // The "navItems" prop in Sidebar handles the onClick via the Registry/Events or setActiveTab
  // But Sidebar component needs `setActiveTab` to pass to those items IF they are simple links?
  // Our Sidebar implementation calls `setActiveTab` if item.path exists and no onClick.
  // So we just pass setActiveTab.

  return (
    <MotionConfig
      transition={
        appSettings?.app?.animationsEnabled ? undefined : { duration: 0 }
      }
    >
      <div className="flex h-screen w-full overflow-hidden bg-gray-50">
        <Toaster position="top-right" richColors closeButton />
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sourceFilter={null} // Deprecated/Unused by Sidebar now
          setSourceFilter={() => {}} // Deprecated
          setCurrentPath={() => {}} // Deprecated
          navItems={appRegistry.getNavItems()}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          <LayoutGroup>
            {/* 
                We render the active feature's component.
                The FeatureRegistry handles returning the component.
            */}
            <div className="flex flex-1 overflow-hidden relative">
              {appRegistry.get(activeTab)?.viewComponent}
            </div>
          </LayoutGroup>
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
