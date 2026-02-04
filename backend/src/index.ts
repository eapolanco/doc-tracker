import express from "express";
import cors from "cors";
import { db } from "@/db/index.js";
import { documents, documentHistory } from "@/db/schema.js";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import {
  getGoogleAuthUrl,
  getOneDriveAuthUrl,
  handleGoogleCallback,
  handleOneDriveCallback,
} from "./services/cloud.js";
import { cloudAccounts } from "./db/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

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
        
        // Find existing doc by path
        const existingDoc = await db.query.documents.findFirst({
          where: eq(documents.path, fullPath)
        });

        if (!existingDoc) {
          const id = uuidv4();
          await db
            .insert(documents)
            .values({
              id,
              name: entry.name,
              category,
              path: fullPath,
              cloudSource: "local",
              lastModified: stats.mtime,
            });

          await db.insert(documentHistory).values({
            documentId: id,
            action: "sync",
            timestamp: new Date(),
            details: "Initial scan discovery",
          });
        } else if (existingDoc.lastModified.getTime() !== stats.mtime.getTime()) {
          // Update if modified
          await db.update(documents)
            .set({ 
              lastModified: stats.mtime,
              name: entry.name // In case it was renamed
            })
            .where(eq(documents.id, existingDoc.id));

          await db.insert(documentHistory).values({
            documentId: existingDoc.id,
            action: "update",
            timestamp: new Date(),
            details: `Detected local file change at ${fullPath}`,
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

app.listen(PORT, async () => {
  await ensureDirectories();
  console.log(`Server running on http://localhost:${PORT}`);
});
