export interface Document {
  id: string;
  name: string;
  category: string;
  path: string;
  cloudSource: string;
  status: "valid" | "corrupted" | "missing"; // Status of the file
  lastModified: string;
  uploadedAt?: string;
  type: "file" | "folder"; // Now mandatory as it comes from DB, defaulting to file if missing in old records
  fileSize?: number;
  tags?: string; // Stored as JSON string in DB
  encrypted?: boolean;
  isShared?: boolean;
  shareToken?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  type: "folder";
  cloudSource: string;
  category: string;
  lastModified: string;
  uploadedAt?: string;
  status: "valid" | "corrupted" | "missing";
  fileSize?: number;
  tags?: string;
  encrypted?: boolean;
  isShared?: boolean;
  shareToken?: string;
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
    animationsEnabled: boolean;
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
