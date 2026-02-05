import axios from "axios";
import type { HistoryItem } from "@/types";

class HistoryController {
  private readonly baseUrl = "/api/history";

  async fetch(): Promise<HistoryItem[]> {
    const res = await axios.get<HistoryItem[]>(this.baseUrl);
    return res.data;
  }
}

export const historyController = new HistoryController();
