import axios from "axios";
import type { CloudAccount, AppSettings } from "@/types";

class SettingsController {
  private readonly baseUrl = "/api";

  async fetchSettings(): Promise<AppSettings> {
    const res = await axios.get<AppSettings>(`${this.baseUrl}/settings`);
    return res.data;
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    await axios.post(`${this.baseUrl}/settings`, settings);
  }

  async fetchAccounts(): Promise<CloudAccount[]> {
    const res = await axios.get<CloudAccount[]>(`${this.baseUrl}/accounts`);
    return res.data;
  }
}

export const settingsController = new SettingsController();
