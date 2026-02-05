import express from "express";
import https from "https";
import selfsigned from "selfsigned";
import cors from "cors";
import multer from "multer";
import { db } from "@/db/index.js";
import { documents, documentHistory } from "@/db/schema.js";
import { eq, desc } from "drizzle-orm";
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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings" });
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
            status: status,
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
  const docs = await db.query.documents.findMany({
    where: eq(documents.deleted, false),
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

    if (doc.encrypted) {
      try {
        const decipherStream = await getDecipherStream(fullPath);
        // Set headers manually since we are streaming
        res.setHeader("Content-Type", "application/octet-stream"); // Or try to guess mime type
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
      res.sendFile(fullPath);
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
    await db
      .update(documents)
      .set({
        name: name,
        path: newRelativePath,
        lastModified: new Date(),
      })
      .where(eq(documents.id, id));

    await db.insert(documentHistory).values({
      documentId: id,
      action: "rename",
      timestamp: new Date(),
      details: `Renamed from "${doc.name}" to "${name}"`,
    });

    res.json({ success: true, name, path: newRelativePath });
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({ error: "Failed to rename document" });
  }
});

app.delete("/api/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;

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

    await db.insert(documentHistory).values({
      documentId: id,
      action: "delete",
      timestamp: new Date(),
      details: `Deleted document "${doc.name}"`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete document" });
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

app.post("/api/documents/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No document IDs provided" });
    }

    await db.transaction((tx) => {
      for (const id of ids) {
        const docResults = tx
          .select()
          .from(documents)
          .where(eq(documents.id, id))
          .all();
        const doc = docResults[0];

        if (doc) {
          tx.update(documents)
            .set({ deleted: true })
            .where(eq(documents.id, id))
            .run();

          tx.insert(documentHistory)
            .values({
              documentId: id,
              action: "delete",
              timestamp: new Date(),
              details: `Deleted document "${doc.name}" (Bulk)`,
            })
            .run();
        }
      }
    });

    res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ error: "Failed to delete documents" });
  }
});

// File upload endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const category = req.body.category || "Personal";
    const fileName = req.file.originalname;

    // Determine destination
    const uploadDir = path.join(DOCUMENTS_ROOT, category);
    await fs.mkdir(uploadDir, { recursive: true });

    const encryptedBuffer = encryptBuffer(req.file.buffer);

    // Write encrypted file
    // We keep the original extension to avoid confusing the file system walker,
    // but the content is encrypted.
    const fullPath = path.join(uploadDir, fileName);
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
      lastModified: new Date(),
    });

    await db.insert(documentHistory).values({
      documentId: id,
      action: "create",
      timestamp: new Date(),
      details: "Uploaded encrypted document",
    });

    res.json({
      success: true,
      file: {
        name: fileName,
        category,
        path: relativePath,
        size: encryptedBuffer.length,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
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
      JSON.stringify({ appName: "DocTracker" }, null, 2),
    );
    console.log("✓ Created default settings.json");
  }
}

const TLS_ENABLED = process.env.TLS_ENABLED === "true";

async function startServer() {
  await ensureDirectories();

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
