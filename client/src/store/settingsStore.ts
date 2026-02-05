import { create } from "zustand";
import axios from "axios";
import type { AppSettings } from "@/types";

interface SettingsState {
  appSettings: AppSettings | null;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: AppSettings) => void;
}

const API_BASE = "/api";

export const useSettingsStore = create<SettingsState>((set) => ({
  appSettings: null,
  loading: false,
  fetchSettings: async () => {
    set({ loading: true });
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      set({ appSettings: res.data, loading: false });
    } catch (err) {
      console.error("Error fetching settings:", err);
      set({ loading: false });
    }
  },
  updateSettings: (settings) => set({ appSettings: settings }),
}));
