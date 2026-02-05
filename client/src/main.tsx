import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Core Architecture
import { initializeModules } from "@/core/init";

async function root() {
  // Initialize modular architecture
  await initializeModules();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

root();
