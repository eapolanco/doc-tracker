import axios from "axios";
import { DocumentModel } from "../models/DocumentModel";
import type { AppSettings, Document } from "@/types";

const API_BASE = "/api";

export class DocumentController {
  async search(): Promise<{
    documents: DocumentModel[];
    settings: AppSettings;
  }> {
    const [docsRes, setRes] = await Promise.all([
      axios.get(`${API_BASE}/documents`),
      axios.get(`${API_BASE}/settings`),
    ]);

    return {
      documents: (docsRes.data || []).map(
        (d: Document) => new DocumentModel(d),
      ),
      settings: setRes.data,
    };
  }

  async move(ids: string[], targetPath: string): Promise<void> {
    await axios.post(`${API_BASE}/documents/move`, { ids, targetPath });
  }

  async copy(ids: string[], targetPath: string): Promise<void> {
    await axios.post(`${API_BASE}/documents/copy`, { ids, targetPath });
  }

  async scan(): Promise<void> {
    await axios.post(`${API_BASE}/scan`);
  }

  async createFolder(name: string, parentPath: string): Promise<void> {
    await axios.post(`${API_BASE}/folders`, {
      name,
      parentPath,
    });
  }

  async upload(
    files: File[],
    category: string,
    onProgress?: (current: number, total: number) => void,
  ): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("category", category);

    await axios.post(`${API_BASE}/upload`, formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(progressEvent.loaded, progressEvent.total);
        }
      },
    });
    // Note: Progress handling with axios is possible but keeping it simple for now as the original code handled it inside the component slightly differently or didn't use axios onUploadProgress in the simplest way in handleGlobalDrop
    // Wait, handleGlobalDrop just set state manually: `setUploadProgress({...})` then awaited axios.
    // It didn't actually track real upload progress events.
  }

  async delete(id: string): Promise<void> {
    console.log("Delete not implemented", id);
  }
}

export const documentController = new DocumentController();
