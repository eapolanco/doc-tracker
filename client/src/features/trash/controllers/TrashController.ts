import axios from "axios";
import type { Document } from "@/types";

class TrashController {
  private readonly baseUrl = "/api";

  async fetch(): Promise<Document[]> {
    const res = await axios.get<Document[]>(
      `${this.baseUrl}/documents?trash=true`,
    );
    return res.data;
  }

  async restore(id: string): Promise<void> {
    await axios.post(`${this.baseUrl}/documents/${id}/restore`);
  }

  async empty(): Promise<void> {
    await axios.post(`${this.baseUrl}/documents/trash/empty`);
  }
}

export const trashController = new TrashController();
