import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const appRoot = path.resolve(dirname, "../..");
const tempDir = path.resolve(appRoot, ".tmp");
const defaultSqlitePath = path.resolve(tempDir, "payload-dev.db");
const defaultSqliteUrl = `file:${defaultSqlitePath}`;
const uploadsDir =
  process.env.MONTELAR_UPLOADS_DIR?.trim() || path.resolve(appRoot, ".uploads");
const databaseUrl = process.env.DATABASE_URL?.trim() || defaultSqliteUrl;
const dbKind =
  databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")
    ? "postgres"
    : "sqlite";

export const adminRuntime = {
  appRoot,
  databaseUrl,
  dbKind,
  defaultSqlitePath,
  defaultSqliteUrl,
  payloadSecret:
    process.env.PAYLOAD_SECRET?.trim() || "montelar-dev-secret-change-me",
  previewSecret:
    process.env.MONTELAR_PREVIEW_SECRET?.trim() ||
    "montelar-preview-dev-secret-change-me",
  tempDir,
  uploadsDir,
} as const;

export function createDatabaseAdapter() {
  if (adminRuntime.dbKind === "postgres") {
    return postgresAdapter({
      pool: {
        connectionString: adminRuntime.databaseUrl,
      },
    });
  }

  return sqliteAdapter({
    client: {
      url: adminRuntime.databaseUrl,
    },
  });
}
