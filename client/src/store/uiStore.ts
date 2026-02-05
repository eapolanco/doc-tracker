import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ViewType as RegistryViewType } from "@/core/registry/ViewRegistry";
import { manifestLoader } from "@/core/manifest/ManifestLoader";

export type DocumentViewType = "grid" | "list" | "compact";

interface UIState {
  activeTab: string;
  model: string;
  viewType: RegistryViewType; // For the ViewRenderer
  documentViewType: DocumentViewType; // For the DocumentGrid
  sourceFilter: string | null;
  currentPath: string;
  searchQuery: string;

  // Actions
  setViewState: (
    state: Partial<Pick<UIState, "activeTab" | "model" | "viewType">>,
  ) => void;
  setDocumentViewType: (type: DocumentViewType) => void;
  setSourceFilter: (filter: string | null) => void;
  setCurrentPath: (path: string) => void;
  setSearchQuery: (query: string) => void;
  navigate: (featureId: string) => void;
}

const getInitialState = () => {
  const params = new URLSearchParams(window.location.search);
  const viewIdParam = params.get("viewid");

  const state = {
    activeTab: "docs_all",
    model: "document",
    viewType: "main" as RegistryViewType,
    documentViewType: "grid" as DocumentViewType,
    sourceFilter: null as string | null,
    currentPath: "",
    searchQuery: "",
  };

  if (viewIdParam) {
    if (["local", "onedrive", "google", "all"].includes(viewIdParam)) {
      state.activeTab = `docs_${viewIdParam}`;
      if (viewIdParam !== "all") state.sourceFilter = viewIdParam;
    } else {
      const navItems = manifestLoader.getNavItems();
      const match = navItems.find((item) => item.id === viewIdParam);
      if (match && match.action?.type === "view") {
        state.activeTab = match.id;
        state.model = match.action.model || "document";
        state.viewType = (match.action.viewType as RegistryViewType) || "main";
      }
    }
  }

  const idParam = params.get("id");
  if (idParam) {
    const decodedId = decodeURIComponent(idParam);
    if (decodedId.includes("/") || decodedId.startsWith("/")) {
      state.currentPath = decodedId.startsWith("/")
        ? decodedId.substring(1)
        : decodedId;
    }
  }

  return state;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...getInitialState(),

      setViewState: (newState) => set((state) => ({ ...state, ...newState })),

      setDocumentViewType: (type) => set({ documentViewType: type }),

      setSourceFilter: (filter) =>
        set({ sourceFilter: filter, currentPath: "" }),

      setCurrentPath: (path) => set({ currentPath: path }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      navigate: (tabId) => {
        const navItems = manifestLoader.getNavItems();
        let match = navItems.find((item) => item.id === tabId);

        // Fallback for generic 'settings'
        if (!match && tabId === "settings") {
          match = navItems.find((i) => i.id === "settings_main");
        }

        if (match && match.action?.type === "view") {
          set({
            activeTab: match.id,
            model: match.action.model || "document",
            viewType: (match.action.viewType as RegistryViewType) || "main",
            searchQuery: "", // Clear search on navigation
          });

          // Handle source filter automatically if it's a doc view
          if (match.id.startsWith("docs_")) {
            const source = match.id.replace("docs_", "");
            set({ sourceFilter: source === "all" ? null : source });
          }
        }
      },
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        documentViewType: state.documentViewType,
        sourceFilter: state.sourceFilter,
      }),
    },
  ),
);
