import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-storage-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { adminRuntime } = await import("../lib/runtime.ts");
  const { default: config } = await import("../payload.config.ts");
  const probeFilePath = path.resolve(adminRuntime.tempDir, "storage-smoke.png");
  let createdId: number | string | null = null;
  let payload:
    | Awaited<ReturnType<typeof getPayload>>
    | null = null;

  try {
    await mkdir(adminRuntime.tempDir, { recursive: true });
    await mkdir(adminRuntime.uploadsDir, { recursive: true });
    payload = await getPayload({ config, cron: true });

    await writeFile(
      probeFilePath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=",
        "base64",
      ),
    );

    const dbProbe = await payload.find({
      collection: "admin-users",
      limit: 1,
      overrideAccess: true,
    });

    const created = await payload.create({
      collection: "system-media",
      data: {
        label: "Montelar storage smoke",
      },
      draft: true,
      filePath: probeFilePath,
      overrideAccess: true,
      showHiddenFields: true,
    });

    createdId = created.id;

    const storedFilename =
      typeof created.filename === "string" ? created.filename : null;

    if (!storedFilename) {
      throw new Error("Storage smoke failed: uploaded file has no filename.");
    }

    const storedPath = path.resolve(adminRuntime.uploadsDir, storedFilename);
    const storedContents = await readFile(storedPath);
    const readBack = await payload.findByID({
      collection: "system-media",
      id: created.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    console.log(
      JSON.stringify(
        {
          db: {
            adapter: adminRuntime.dbKind,
            databaseUrl:
              adminRuntime.dbKind === "postgres"
                ? "postgres://configured"
                : adminRuntime.defaultSqlitePath,
            adminUsersVisible: dbProbe.docs.length,
          },
          upload: {
            collection: "system-media",
            fileExists: true,
            filename: storedFilename,
            bytes: storedContents.byteLength,
            id: readBack.id,
            storageDir: adminRuntime.uploadsDir,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    if (payload && createdId !== null) {
      await payload.delete({
        collection: "system-media",
        id: createdId,
        overrideAccess: true,
      });
    }

    await rm(probeFilePath, { force: true });
    if (process.env.DATABASE_URL === `file:${localSmokeDatabasePath}`) {
      await rm(localSmokeDatabasePath, { force: true });
    }
    await payload?.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
