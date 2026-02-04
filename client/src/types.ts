export interface Document {
  id: string;
  name: string;
  category: string;
  path: string;
  cloudSource: string;
  lastModified: string;
}

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
