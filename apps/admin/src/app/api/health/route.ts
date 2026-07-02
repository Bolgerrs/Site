import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { adminRuntime } from "@/lib/runtime";

export async function GET() {
  await getPayload({ config, cron: true });

  return NextResponse.json(
    {
      status: "ok",
      service: "montelar-admin",
      dbKind: adminRuntime.dbKind,
      uploadsDir: adminRuntime.uploadsDir,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
