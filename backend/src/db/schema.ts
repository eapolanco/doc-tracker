import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  path: text("path").notNull(),
  cloudSource: text("cloud_source"), // 'google' | 'onedrive' | 'local'
  lastModified: integer("last_modified", { mode: "timestamp" }).notNull(),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
});

export const documentHistory = sqliteTable("document_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: text("document_id").references(() => documents.id),
  action: text("action").notNull(), // 'create' | 'update' | 'delete' | 'sync'
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  details: text("details"),
});

export const cloudAccounts = sqliteTable("cloud_accounts", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(), // 'google' | 'onedrive'
  email: text("email").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  lastSync: integer("last_sync", { mode: "timestamp" }),
});

export const documentsRelations = relations(documents, ({ many }) => ({
  history: many(documentHistory),
}));

export const historyRelations = relations(documentHistory, ({ one }) => ({
  document: one(documents, {
    fields: [documentHistory.documentId],
    references: [documents.id],
  }),
}));

export const cloudAccountsRelations = relations(cloudAccounts, ({ many }) => ({
  // Potential for sync logs if needed later
}));
