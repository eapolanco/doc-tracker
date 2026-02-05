console.log("STARTING SERVER WITH LATEST CODE - V2");
import "dotenv/config";
import express from "express";
import https from "https";
import selfsigned from "selfsigned";
import cors from "cors";
import multer from "multer";
import { db } from "@/db/index.js";
import { documents, documentHistory } from "@/db/schema.js";
import { eq, desc, inArray, or, like, sql, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  getGoogleAuthUrl,
  getOneDriveAuthUrl,
  handleGoogleCallback,
  handleOneDriveCallback,
} from "./services/cloud.js";
import { encryptBuffer, getDecipherStream } from "./services/crypto.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCUMENTS_ROOT = path.resolve(__dirname, "../../documents");

// Helper to get absolute path from DB path
const getAbsolutePath = (dbPath: string) => {
  if (path.isAbsolute(dbPath)) return dbPath;
  return path.join(DOCUMENTS_ROOT, dbPath);
};

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/version", (req, res) => res.send("v-debug-1"));

// Configure multer for file uploads
// Use memory storage to process file (encrypt) before writing to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes =
      /\.(pdf|doc|docx|txt|jpg|jpeg|png|xlsx|xls|pptx|md|json)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Serve static files from frontend if in production
const frontendPath = path.join(__dirname, "../../client/dist");
app.use(express.static(frontendPath));

// Settings Routes
const SETTINGS_PATH = path.join(__dirname, "../../data/settings.json");

let scanInterval: ReturnType<typeof setInterval> | null = null;

async function updateScanSchedule() {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }

  try {
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data);

    if (settings.app?.autoScan) {
      const hours = settings.app.scanIntervalHours || 1;
      const ms = hours * 60 * 60 * 1000;
      console.log(`Setting up auto-scan every ${hours} hours (${ms}ms)`);

      scanInterval = setInterval(() => {
        console.log("Running scheduled scan...");
        const rootDir = path.join(__dirname, "../../documents");
        scanDirectory(rootDir);
      }, ms);
    } else {
      console.log("Auto-scan disabled");
    }
  } catch (err) {
    console.error("Failed to configure auto-scan:", err);
  }
}

app.get("/api/settings", async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(404).json({ error: "Settings not found" });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(req.body, null, 2));
    await updateScanSchedule();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

app.post("/api/folders", async (req, res) => {
  try {
    const { name, parentPath } = req.body;
    if (!name)
      return res.status(400).json({ error: "Folder name is required" });

    const relativePath = parentPath ? `${parentPath}/${name}` : name;
    const fullPath = path.join(DOCUMENTS_ROOT, relativePath);

    // Check if it already exists
    if (fsSync.existsSync(fullPath)) {
      return res.status(400).json({ error: "Folder already exists on disk" });
    }

    await fs.mkdir(fullPath, { recursive: true });

    // Determine category from path
    const pathParts = relativePath.split("/").filter(Boolean);
    const category =
      pathParts.length > 0 ? pathParts[pathParts.length - 1] : "General";

    const id = `folder-${uuidv4()}`;
    await db.insert(documents).values({
      id,
      name,
      category,
      path: relativePath,
      cloudSource: "local",
      type: "folder",
      status: "valid",
      fileSize: null,
      tags: "[]",
      uploadedAt: new Date(),
      lastModified: new Date(),
    });

    res.json({ success: true, folder: { id, name, path: relativePath } });
  } catch (error) {
    console.error("Create folder error:", error);
    res.status(500).json({
      error: `Failed to create folder: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

// Cloud Accounts Routes
app.get("/api/accounts", async (req, res) => {
  const accounts = await db.query.cloudAccounts.findMany();
  res.json(accounts);
});

app.get("/api/auth/google", (req, res) => {
  res.redirect(getGoogleAuthUrl());
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    await handleGoogleCallback(code as string);
    res.redirect("http://localhost:5173/settings?success=google");
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.redirect("http://localhost:5173/settings?error=google");
  }
});

app.get("/api/auth/onedrive", async (req, res) => {
  const url = await getOneDriveAuthUrl();
  res.redirect(url);
});

app.get("/api/auth/onedrive/callback", async (req, res) => {
  const { code } = req.query;
  try {
    await handleOneDriveCallback(code as string);
    res.redirect("http://localhost:5173/settings?success=onedrive");
  } catch (err) {
    console.error("OneDrive Auth Error:", err);
    res.redirect("http://localhost:5173/settings?error=onedrive");
  }
});

// Helper to scan directory
async function scanDirectory(dir: string, category: string = "General") {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip common large folders
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        // Create/Update folder in DB
        const relativeFolderPath = path
          .relative(DOCUMENTS_ROOT, fullPath)
          .replace(/\\/g, "/");

        const folderStats = await fs.stat(fullPath);

        const existingFolder = await db.query.documents.findFirst({
          where: eq(documents.path, relativeFolderPath),
        });

        if (!existingFolder) {
          const fid = `folder-${uuidv4()}`; // Use prefix to distinguish or just uuid
          await db.insert(documents).values({
            id: fid,
            name: entry.name,
            category: category,
            path: relativeFolderPath,
            cloudSource: "local",
            type: "folder",
            status: "valid",
            fileSize: null, // Folders don't have a size
            tags: "[]", // Empty tags array
            uploadedAt: new Date(),
            lastModified: folderStats.mtime,
          });
        }

        await scanDirectory(fullPath, entry.name);
      } else {
        const stats = await fs.stat(fullPath);
        const relativePath = path
          .relative(DOCUMENTS_ROOT, fullPath)
          .replace(/\\/g, "/");

        const status = stats.size === 0 ? "corrupted" : "valid";

        // Find existing doc by path
        const existingDoc = await db.query.documents.findFirst({
          where: eq(documents.path, relativePath),
        });

        if (!existingDoc) {
          const id = uuidv4();
          await db.insert(documents).values({
            id,
            name: entry.name,
            category,
            path: relativePath,
            cloudSource: "local",
            type: "file",
            status: status,
            fileSize: stats.size, // Store file size in bytes
            tags: "[]", // Empty tags array
            uploadedAt: new Date(), // First time we see this file
            lastModified: stats.mtime,
          });

          await db.insert(documentHistory).values({
            documentId: id,
            action: "sync",
            timestamp: new Date(),
            details: "Initial scan discovery",
          });
        } else if (
          existingDoc.lastModified.getTime() !== stats.mtime.getTime()
        ) {
          // Update if modified
          await db
            .update(documents)
            .set({
              lastModified: stats.mtime,
              status: status,
              name: entry.name, // In case it was renamed
            })
            .where(eq(documents.id, existingDoc.id));

          await db.insert(documentHistory).values({
            documentId: existingDoc.id,
            action: "update",
            timestamp: new Date(),
            details: `Detected local file change at ${relativePath}`,
          });
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err);
  }
}

// Routes
app.get("/api/documents", async (req, res) => {
  const { trash } = req.query;
  const isTrash = trash === "true";

  const docs = await db.query.documents.findMany({
    where: eq(documents.deleted, isTrash),
    orderBy: [desc(documents.lastModified)],
  });
  res.json(docs);
});

app.get("/api/history", async (req, res) => {
  const history = await db.query.documentHistory.findMany({
    with: {
      document: true,
    },
    orderBy: [desc(documentHistory.timestamp)],
    limit: 50,
  });
  res.json(history);
});

app.get("/api/documents/:id/view", async (req, res) => {
  try {
    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, req.params.id),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const fullPath = getAbsolutePath(doc.path);

    // Determine MIME type based on file extension
    const ext = path.extname(doc.name).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".json": "application/json",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    if (doc.encrypted) {
      try {
        const decipherStream = await getDecipherStream(fullPath);
        // Set headers manually since we are streaming
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${doc.name}"`);
        decipherStream.pipe(res);
        decipherStream.on("error", (err) => {
          console.error("Decryption stream error:", err);
          res.end();
        });
      } catch (err) {
        console.error("Decryption error:", err);
        res.status(500).json({ error: "Failed to decrypt document" });
      }
    } else {
      // Set Content-Type and Content-Disposition to inline so files preview instead of download
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${doc.name}"`);

      // Use createReadStream instead of sendFile to ensure headers aren't overridden
      const fileStream = fsSync.createReadStream(fullPath);
      fileStream.pipe(res);
      fileStream.on("error", (err) => {
        console.error("File stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to load document" });
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to load document" });
  }
});

app.put("/api/documents/:id/rename", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "New name is required" });
    }

    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const oldPath = getAbsolutePath(doc.path);
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, name);
    const newRelativePath = path
      .relative(DOCUMENTS_ROOT, newPath)
      .replace(/\\/g, "/");

    // Rename file on disk
    try {
      await fs.rename(oldPath, newPath);
    } catch (fsError) {
      console.error("File system rename error:", fsError);
      return res.status(500).json({ error: "Failed to rename file on disk" });
    }

    // Update DB
    await db.transaction(async (tx) => {
      await tx
        .update(documents)
        .set({
          name: name,
          path: newRelativePath,
          lastModified: new Date(),
        })
        .where(eq(documents.id, id));

      if (doc.type === "folder") {
        // Update all items inside this folder
        const oldPrefix = `${doc.path}/`;
        const newPrefix = `${newRelativePath}/`;

        // We can use a raw SQL update for efficiency with prefixes or a find + loop
        // Let's use raw SQL to replace the prefix in the path
        await tx.run(
          sql`UPDATE documents SET path = ${newPrefix} || SUBSTR(path, ${oldPrefix.length + 1}) WHERE path LIKE ${oldPrefix + "%"}`,
        );

        // Also update the category if needed? The system seems to use base folder name as category.
        // Let's update category for immediate children if they match the old folder name.
        await tx
          .update(documents)
          .set({ category: name })
          .where(eq(documents.category, doc.name));
      }
    });

    await db.insert(documentHistory).values({
      documentId: id,
      action: "rename",
      timestamp: new Date(),
      details: `Renamed from "${doc.name}" to "${name}"`,
    });

    res.json({ success: true, name, path: newRelativePath });
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({
      error: `Failed to rename: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

app.delete("/api/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (id.startsWith("folder-implicit-")) {
      const folderPath = id.replace("folder-implicit-", "");
      await db
        .update(documents)
        .set({ deleted: true })
        .where(
          or(
            like(documents.path, `${folderPath}/%`),
            eq(documents.path, folderPath),
          ),
        );
      return res.json({
        success: true,
        message: "Folder items moved to trash",
      });
    }

    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Soft delete in DB
    await db
      .update(documents)
      .set({ deleted: true })
      .where(eq(documents.id, id));

    // If it's a real folder record, also delete its contents
    if (doc.type === "folder") {
      await db
        .update(documents)
        .set({ deleted: true })
        .where(
          or(
            like(documents.path, `${doc.path}/%`),
            eq(documents.path, doc.path),
          ),
        );
    }

    await db.insert(documentHistory).values({
      documentId: id,
      action: "delete",
      timestamp: new Date(),
      details: `Moved document "${doc.name}" to trash`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

app.post("/api/documents/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No document IDs provided" });
    }

    const realIds: string[] = [];
    const folderPaths: string[] = [];

    for (const id of ids) {
      if (id.startsWith("folder-implicit-")) {
        folderPaths.push(id.replace("folder-implicit-", ""));
      } else if (id.startsWith("folder-")) {
        // Need to find the path of this folder
        const folderDoc = await db.query.documents.findFirst({
          where: eq(documents.id, id),
        });
        if (folderDoc) {
          folderPaths.push(folderDoc.path);
          realIds.push(id);
        }
      } else {
        realIds.push(id);
      }
    }

    await db.transaction(async (tx) => {
      // Delete real IDs
      if (realIds.length > 0) {
        await tx
          .update(documents)
          .set({ deleted: true })
          .where(inArray(documents.id, realIds));
      }

      // Delete items inside folder paths
      for (const folderPath of folderPaths) {
        await tx
          .update(documents)
          .set({ deleted: true })
          .where(
            or(
              like(documents.path, `${folderPath}/%`),
              eq(documents.path, folderPath),
            ),
          );
      }
    });

    res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ error: "Failed to perform bulk delete" });
  }
});

app.post("/api/documents/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(documents)
        .set({ deleted: false })
        .where(eq(documents.id, id));

      if (doc.type === "folder") {
        await tx
          .update(documents)
          .set({ deleted: false })
          .where(
            or(
              like(documents.path, `${doc.path}/%`),
              eq(documents.path, doc.path),
            ),
          );
      }
    });

    await db.insert(documentHistory).values({
      documentId: id,
      action: "restore",
      timestamp: new Date(),
      details: `Restored document "${doc.name}" ${doc.type === "folder" ? "and its contents " : ""}from trash`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).json({ error: "Failed to restore document" });
  }
});

app.post("/api/documents/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    const shareToken = uuidv4();

    console.log(`[share] Generating share for doc: ${id}`);
    await db
      .update(documents)
      .set({ isShared: true, shareToken })
      .where(eq(documents.id, id));

    await db.insert(documentHistory).values({
      documentId: id,
      action: "update",
      timestamp: new Date(),
      details: "Enabled public sharing",
    });

    res.json({ success: true, shareToken });
  } catch (error: any) {
    const errorMsg = `[share] Error sharing document ${req.params.id}: ${error.message || error}\n`;
    console.error(errorMsg);
    try {
      fsSync.appendFileSync("server_error.log", errorMsg);
    } catch (e) {
      console.error("Failed to write to error log", e);
    }

    res
      .status(500)
      .json({ error: "Failed to share document", details: error.message });
  }
});

app.delete("/api/documents/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    await db
      .update(documents)
      .set({ isShared: false, shareToken: null })
      .where(eq(documents.id, id));

    await db.insert(documentHistory).values({
      documentId: id,
      action: "update",
      timestamp: new Date(),
      details: "Disabled public sharing",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Remove share error:", error);
    res.status(500).json({ error: "Failed to remove share" });
  }
});

app.get("/api/share/:token", async (req, res) => {
  try {
    const doc = await db.query.documents.findFirst({
      where: and(
        eq(documents.shareToken, req.params.token),
        eq(documents.isShared, true),
      ),
    });

    if (!doc) {
      return res.status(404).send("Document not found or link expired");
    }

    const fullPath = getAbsolutePath(doc.path);
    const ext = path.extname(doc.name).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".json": "application/json",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    if (doc.encrypted) {
      try {
        const decipherStream = await getDecipherStream(fullPath);
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${doc.name}"`);
        decipherStream.pipe(res);
        decipherStream.on("error", (err) => {
          console.error("Public decryption stream error:", err);
          res.end();
        });
      } catch (err) {
        console.error("Public decryption error:", err);
        res.status(500).send("Failed to decrypt shared document");
      }
    } else {
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${doc.name}"`);

      const fileStream = fsSync.createReadStream(fullPath);
      fileStream.pipe(res);
      fileStream.on("error", (err) => {
        console.error("Public file stream error:", err);
        if (!res.headersSent) {
          res.status(500).send("Failed to load shared document");
        }
      });
    }
  } catch (err) {
    res.status(500).send("Error loading shared document");
  }
});

app.delete("/api/documents/:id/permanent", async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete file from disk
    try {
      if (doc.type !== "folder") {
        const fullPath = getAbsolutePath(doc.path);
        await fs.unlink(fullPath);
      } else {
        // For folders, we'd need to delete recursively or ensure it's empty.
        // For now, let's assume we just remove it from DB or try rmdir.
        // Simplest: only allow deleting if it's a file, or handle folder delete.
        const fullPath = getAbsolutePath(doc.path);
        await fs.rm(fullPath, { recursive: true, force: true });
      }
    } catch (fsError) {
      console.warn(
        "File system delete error (might already be gone):",
        fsError,
      );
    }

    // Delete from DB (Hard delete)
    await db.transaction(async (tx) => {
      if (doc.type === "folder") {
        // Find all children IDs to clean history
        const children = await tx.query.documents.findMany({
          where: or(
            like(documents.path, `${doc.path}/%`),
            eq(documents.path, doc.path),
          ),
        });
        const childIds = children.map((c) => c.id);

        if (childIds.length > 0) {
          await tx
            .delete(documentHistory)
            .where(inArray(documentHistory.documentId, childIds));
          await tx.delete(documents).where(inArray(documents.id, childIds));
        }
      } else {
        await tx
          .delete(documentHistory)
          .where(eq(documentHistory.documentId, id));
        await tx.delete(documents).where(eq(documents.id, id));
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Permanent delete error:", error);
    res.status(500).json({ error: "Failed to permanently delete document" });
  }
});

app.post("/api/documents/trash/empty", async (req, res) => {
  try {
    const trashDocs = await db.query.documents.findMany({
      where: eq(documents.deleted, true),
    });

    let count = 0;
    for (const doc of trashDocs) {
      // Delete from disk
      try {
        const fullPath = getAbsolutePath(doc.path);
        if (doc.type === "folder") {
          await fs.rm(fullPath, { recursive: true, force: true });
        } else {
          await fs.unlink(fullPath);
        }
      } catch (e) {
        console.warn(`Failed to delete file ${doc.path} from disk:`, e);
      }

      // Delete from DB
      await db
        .delete(documentHistory)
        .where(eq(documentHistory.documentId, doc.id));
      await db.delete(documents).where(eq(documents.id, doc.id));
      count++;
    }

    res.json({ success: true, count });
  } catch (error) {
    console.error("Empty trash error:", error);
    res.status(500).json({ error: "Failed to empty trash" });
  }
});

app.post("/api/documents/move", async (req, res) => {
  try {
    const { ids, targetPath } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No document IDs provided" });
    }

    const fullTargetDir = path.join(DOCUMENTS_ROOT, targetPath);
    await fs.mkdir(fullTargetDir, { recursive: true });

    // Determine category from targetPath
    const pathParts = targetPath.split("/").filter(Boolean);
    const targetCategory =
      pathParts.length > 0 ? pathParts[pathParts.length - 1] : "General";

    await db.transaction((tx) => {
      for (const id of ids) {
        if (id.startsWith("folder-")) continue;

        const docResults = tx
          .select()
          .from(documents)
          .where(eq(documents.id, id))
          .all();
        const doc = docResults[0];

        if (doc) {
          const oldAbsPath = getAbsolutePath(doc.path);
          const newAbsPath = path.join(fullTargetDir, doc.name);
          const newRelativePath = path
            .relative(DOCUMENTS_ROOT, newAbsPath)
            .replace(/\\/g, "/");

          if (oldAbsPath !== newAbsPath) {
            // Check for conflict at destination
            try {
              fsSync.accessSync(newAbsPath);
              // If it exists, we could add a suffix or error.
              // For simplicity and matching user request for 'duplicating', let's just rename here too if conflict.
              let movedName = doc.name;
              const ext = path.extname(movedName);
              const base = path.basename(movedName, ext);
              let counter = 1;
              let finalAbsPath = newAbsPath;
              while (true) {
                try {
                  fsSync.accessSync(finalAbsPath);
                  movedName = `${base} (Moved ${counter})${ext}`;
                  finalAbsPath = path.join(fullTargetDir, movedName);
                  counter++;
                } catch {
                  break;
                }
              }
              fsSync.renameSync(oldAbsPath, finalAbsPath);
              const finalRelativePath = path
                .relative(DOCUMENTS_ROOT, finalAbsPath)
                .replace(/\\/g, "/");

              tx.update(documents)
                .set({
                  name: movedName,
                  path: finalRelativePath,
                  category: targetCategory,
                  lastModified: new Date(),
                })
                .run();

              // Use standard db.insert syntax if needed, but tx.insert is correct
              tx.insert(documentHistory)
                .values({
                  documentId: id,
                  action: "move",
                  timestamp: new Date(),
                  details: `Moved from "${doc.path}" to "${newRelativePath}"`,
                })
                .run();
            } catch {
              // No conflict, just rename
              fsSync.renameSync(oldAbsPath, newAbsPath);
              tx.update(documents)
                .set({
                  path: newRelativePath,
                  category: targetCategory,
                  lastModified: new Date(),
                })
                .where(eq(documents.id, id))
                .run();
            }

            tx.insert(documentHistory)
              .values({
                documentId: id,
                action: "move",
                timestamp: new Date(),
                details: `Moved from "${doc.path}" to "${newRelativePath}"`,
              })
              .run(); // Ensure run() is called for side effects if needed, though insert/update usually return result objects in sync driver
          }
        }
      }
    });

    res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Move error:", error);
    res.status(500).json({
      error: `Failed to move: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

app.post("/api/documents/copy", async (req, res) => {
  try {
    const { ids, targetPath } = req.body;
    console.log(`Copy request: ${ids?.length} items to "${targetPath}"`);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No document IDs provided" });
    }

    // Ensure target path doesn't have leading slash for join
    // Ensure target path defaults to empty string if undefined and remove leading slash
    const safeTargetPath = targetPath || "";
    const cleanTargetPath = safeTargetPath.startsWith("/")
      ? safeTargetPath.substring(1)
      : safeTargetPath;
    const fullTargetDir = path.resolve(DOCUMENTS_ROOT, cleanTargetPath);

    console.log(`Resolved target dir: ${fullTargetDir}`);
    await fs.mkdir(fullTargetDir, { recursive: true });

    // Determine category from targetPath
    const pathParts = cleanTargetPath.split("/").filter(Boolean);
    const targetCategory =
      pathParts.length > 0 ? pathParts[pathParts.length - 1] : "General";

    let copyCount = 0;
    await db.transaction((tx) => {
      for (const id of ids) {
        // Skip virtual folder IDs
        if (typeof id !== "string" || id.startsWith("folder-")) continue;

        const docResults = tx
          .select()
          .from(documents)
          .where(eq(documents.id, id))
          .all();
        const doc = docResults[0];
        console.log("DEBUG COPY: Retrieved doc:", doc);

        if (doc) {
          if (!doc.path) {
            throw new Error("Document path is missing or undefined");
          }
          const oldAbsPath = getAbsolutePath(doc.path);
          console.log(`Processing copy for ${doc.name}. Source: ${oldAbsPath}`);

          // Verify source file exists
          try {
            fsSync.accessSync(oldAbsPath);
          } catch (err) {
            console.warn(`Source file not found for copy: ${oldAbsPath}`);
            continue; // Skip this one
          }

          let newName = doc.name;
          const ext = path.extname(newName);
          const base = path.basename(newName, ext);
          let newAbsPath = path.resolve(fullTargetDir, newName);

          // Handle duplicate names / same folder copy
          let counter = 1;
          while (true) {
            try {
              fsSync.accessSync(newAbsPath);
              // If we reach here, file exists, need a new name
              newName = `${base} (Copy ${counter})${ext}`;
              newAbsPath = path.resolve(fullTargetDir, newName);
              counter++;
            } catch {
              // File doesn't exist, we can use this path
              break;
            }
          }

          const newRelativePath = path
            .relative(DOCUMENTS_ROOT, newAbsPath)
            .replace(/\\/g, "/");

          console.log(`Copying ${oldAbsPath} -> ${newAbsPath}`);
          fsSync.copyFileSync(oldAbsPath, newAbsPath);

          const newId = uuidv4();
          tx.insert(documents)
            .values({
              id: newId,
              name: newName,
              category: targetCategory,
              path: newRelativePath,
              cloudSource: doc.cloudSource,
              type: doc.type,
              status: doc.status,
              encrypted: doc.encrypted,
              fileSize: doc.fileSize, // Preserve file size
              tags: doc.tags, // Preserve tags
              uploadedAt: new Date(), // New upload timestamp for the copy
              lastModified: new Date(),
            })
            .run();

          tx.insert(documentHistory)
            .values({
              documentId: newId,
              action: "copy",
              timestamp: new Date(),
              details: `Copied from "${doc.path}" to "${newRelativePath}"`,
            })
            .run();
          copyCount++;
        }
      }
    });

    res.json({ success: true, count: copyCount });
  } catch (error) {
    console.error("CRITICAL COPY ERROR:", error);
    res.status(500).json({
      error: `Failed to copy: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

// File upload endpoint
// File upload endpoint (Bulk)
app.post("/api/upload", upload.array("files"), async (req, res) => {
  try {
    // Multer puts files in req.files if using array()
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    let category = req.body.category;
    if (category === undefined || category === null) {
      category = "Personal";
    }

    console.log(`[UPLOAD] Starting upload to category: "${category}"`);
    const uploadDir = path.join(DOCUMENTS_ROOT, category);
    console.log(`[UPLOAD] Resolved upload directory: ${uploadDir}`);
    await fs.mkdir(uploadDir, { recursive: true });

    const results = [];

    for (const file of files) {
      try {
        const fileName = file.originalname;
        console.log(
          `[UPLOAD] Processing file: ${fileName} (${file.size} bytes)`,
        );
        const encryptedBuffer = encryptBuffer(file.buffer);
        const fullPath = path.join(uploadDir, fileName);
        console.log(`[UPLOAD] Target path: ${fullPath}`);

        // Write encrypted file
        await fs.writeFile(fullPath, encryptedBuffer);

        const relativePath = path
          .relative(DOCUMENTS_ROOT, fullPath)
          .replace(/\\/g, "/");

        console.log(`Uploaded (Encrypted): ${fileName} to ${category}`);

        // Insert into DB with encrypted=true
        const id = uuidv4();
        await db.insert(documents).values({
          id,
          name: fileName,
          category,
          path: relativePath,
          cloudSource: "upload",
          status: "valid",
          encrypted: true,
          fileSize: file.size, // Original file size before encryption
          tags: "[]", // Empty tags array
          uploadedAt: new Date(), // Track when file was uploaded
          lastModified: new Date(),
        });

        await db.insert(documentHistory).values({
          documentId: id,
          action: "create",
          timestamp: new Date(),
          details: `Uploaded encrypted document to ${category}`,
        });

        results.push({
          name: fileName,
          status: "success",
          path: relativePath,
        });
      } catch (fileErr) {
        console.error(`Error processing file ${file.originalname}:`, fileErr);
        results.push({
          name: file.originalname,
          status: "failed",
          error: "Processing error",
        });
      }
    }
    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: `Failed to upload files: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

app.post("/api/folders", async (req, res) => {
  try {
    const { name, parentPath } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    // Sanitize name to prevent directory traversal
    const safeName = path.basename(name);

    // Resolve parent path
    const safeParentPath = parentPath ? parentPath.replace(/^\//, "") : "";
    const targetDir = path.join(DOCUMENTS_ROOT, safeParentPath, safeName);

    // Create directory
    await fs.mkdir(targetDir, { recursive: true });

    // Insert into DB
    const relativePath = path
      .relative(DOCUMENTS_ROOT, targetDir)
      .replace(/\\/g, "/");

    const category = safeParentPath.split("/")[0] || safeName;

    const id = `folder-${uuidv4()}`;
    await db.insert(documents).values({
      id,
      name: safeName,
      category,
      path: relativePath,
      cloudSource: "local",
      type: "folder",
      status: "valid",
      fileSize: null, // Folders don't have a size
      tags: "[]", // Empty tags array
      uploadedAt: new Date(),
      lastModified: new Date(),
    });

    await db.insert(documentHistory).values({
      documentId: id,
      action: "create",
      timestamp: new Date(),
      details: `Created folder "${safeName}"`,
    });

    res.json({ success: true, path: relativePath, id });
  } catch (err) {
    console.error("Create folder error:", err);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// Update document tags
app.put("/api/documents/:id/tags", async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: "Tags must be an array" });
    }

    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Update tags
    await db
      .update(documents)
      .set({ tags: JSON.stringify(tags) })
      .where(eq(documents.id, id));

    await db.insert(documentHistory).values({
      documentId: id,
      action: "update",
      timestamp: new Date(),
      details: `Updated tags to: ${tags.join(", ")}`,
    });

    res.json({ success: true, tags });
  } catch (error) {
    console.error("Update tags error:", error);
    res.status(500).json({ error: "Failed to update tags" });
  }
});

app.post("/api/scan", async (req, res) => {
  const rootDir = path.join(__dirname, "../../documents");
  await scanDirectory(rootDir);
  res.json({ message: "Scan complete" });
});

const PORT = process.env.PORT || 3001;

async function ensureDirectories() {
  const rootDir = path.join(__dirname, "../../");
  const dataDir = path.join(rootDir, "data");
  const documentsDir = path.join(rootDir, "documents");

  const foldersToEnsure = [
    dataDir,
    documentsDir,
    ...[
      "Career",
      "Career/Certifications",
      "Career/Contracts",
      "Career/CV",
      "Education",
      "Finance",
      "Finance/Banking",
      "Finance/Bills",
      "Finance/Retirement",
      "Finance/Taxes",
      "Health",
      "Health/Appointments",
      "Health/Insurance",
      "Health/Lab_Results",
      "Housing",
      "Legal",
      "Legal/IDs",
      "Legal/Passports",
      "Legal/Properties",
      "Personal",
      "Projects",
      "Transportation",
      "Travel",
    ].map((f) => path.join(documentsDir, f)),
  ];

  for (const folder of foldersToEnsure) {
    try {
      await fs.mkdir(folder, { recursive: true });
      console.log(`✓ Ensured directory: ${path.relative(rootDir, folder)}`);
    } catch (err) {
      console.error(`× Failed to ensure directory ${folder}:`, err);
    }
  }

  // Ensure settings.json exists if dataDir was just created
  try {
    await fs.access(SETTINGS_PATH);
  } catch {
    await fs.writeFile(
      SETTINGS_PATH,
      JSON.stringify(
        {
          appName: "DocTracker",
          app: {
            autoScan: true,
            scanIntervalHours: 1,
            animationsEnabled: true,
            theme: "light",
          },
        },
        null,
        2,
      ),
    );
    console.log("✓ Created default settings.json");
  }
}

const TLS_ENABLED = process.env.TLS_ENABLED === "true";

async function startServer() {
  await ensureDirectories();

  // Perform initial scan to populate DB with folders
  console.log("Performing initial scan...");
  const rootDir = path.join(__dirname, "../../documents");
  await scanDirectory(rootDir);
  console.log("Initial scan complete.");

  await updateScanSchedule();

  if (TLS_ENABLED) {
    const keyPath =
      process.env.SSL_KEY_PATH || path.join(__dirname, "../certs/key.pem");
    const certPath =
      process.env.SSL_CERT_PATH || path.join(__dirname, "../certs/cert.pem");

    try {
      let key, cert;

      // Check if certs exist
      if (fsSync.existsSync(keyPath) && fsSync.existsSync(certPath)) {
        key = await fs.readFile(keyPath);
        cert = await fs.readFile(certPath);
      } else {
        console.log(
          "TLS enabled but no certificates found. Generating self-signed certificates...",
        );
        // Ensure certs directory exists
        const certDir = path.dirname(keyPath);
        await fs.mkdir(certDir, { recursive: true });

        const attrs = [{ name: "commonName", value: "localhost" }];
        const pems = await selfsigned.generate(attrs, { algorithm: "sha256" });

        key = pems.private;
        cert = pems.cert;

        await fs.writeFile(keyPath, key);
        await fs.writeFile(certPath, cert);
        console.log(
          `Self-signed certificates generated and saved to ${certDir}`,
        );
      }

      const options = {
        key,
        cert,
      };

      https.createServer(options, app).listen(PORT, () => {
        console.log(`Server running securely on https://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("Failed to start HTTPS server:", err);
      process.exit(1);
    }
  } else {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
