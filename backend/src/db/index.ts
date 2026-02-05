import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@/db/schema.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine DB path: use env var if set, otherwise fallback to local logic
let dbPath = process.env.DATABASE_URL;

if (!dbPath) {
  // Fallback for local development
  const rootDir = path.join(__dirname, "../../../");
  // Try to place it in a sensible location relative to project root
  // backend/data.db or just data/data.db
  dbPath = path.join(rootDir, "backend/data.db");
}

// Ensure proper resolution if it's a relative path (better-sqlite3 treats relative paths relative to CWD)
// But we want it relative to our resolved path if we calculated it.
// If it came from env var and is absolute, it's fine.
// If it came from env var and is relative, it will be relative to CWD (which is /app/backend in docker).
// In Docker, DATABASE_URL=/app/data/data.db (Absolute).

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
