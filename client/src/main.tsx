import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Core Architecture
import { appRegistry } from "@/core/registry/FeatureRegistry";
import { HistoryFeature } from "@/features/history";
import { SettingsFeature } from "@/features/settings";
import { TrashFeature } from "@/features/trash";
import { DocumentsFeature } from "@/features/documents";

// 1. Register Features
appRegistry.register(DocumentsFeature);
appRegistry.register(HistoryFeature);
appRegistry.register(SettingsFeature);
appRegistry.register(TrashFeature);

// 2. Initialize Features (if needed at startup)
appRegistry.initializeFeatures();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
