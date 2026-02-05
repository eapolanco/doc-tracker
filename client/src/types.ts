export interface Document {
  id: string;
  name: string;
  category: string;
  path: string;
  cloudSource: string;
  status: "valid" | "corrupted" | "missing"; // Status of the file
  lastModified: string;
  type: "file" | "folder"; // Now mandatory as it comes from DB, defaulting to file if missing in old records
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  type: "folder";
  cloudSource: string;
  category: string;
  lastModified: string;
  status: "valid" | "corrupted" | "missing";
}

export type FileSystemItem = Document | FolderItem;

export interface HistoryItem {
  id: number;
  documentId: string;
  action: string;
  timestamp: string;
  details: string;
  document?: Document;
}

export interface CloudAccount {
  id: string;
  provider: string;
  email: string;
  lastSync: string | null;
}

export interface AppSettings {
  app: {
    name: string;
    theme: string;
    autoScan: boolean;
    scanIntervalHours: number;
  };
  storage: {
    localEnabled: boolean;
    googleDriveEnabled: boolean;
    oneDriveEnabled: boolean;
  };
  notifications: {
    enabled: boolean;
    email: string;
  };
}
