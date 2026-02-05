import { create } from "zustand";
import type { DocumentModel } from "@/features/documents/models/DocumentModel";

interface Clipboard {
  ids: string[];
  type: "copy" | "move";
}

interface DocumentState {
  selectedDoc: DocumentModel | null;
  clipboard: Clipboard | null;

  // Actions
  setSelectedDoc: (doc: DocumentModel | null) => void;
  setClipboard: (cb: Clipboard | null) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  selectedDoc: null,
  clipboard: null,

  setSelectedDoc: (doc) => set({ selectedDoc: doc }),
  setClipboard: (cb) => set({ clipboard: cb }),
}));
