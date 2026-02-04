import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@/db/schema.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "../../../");
const dbPath = path.join(rootDir, "backend/data.db");
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
