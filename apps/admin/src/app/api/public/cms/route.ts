import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { getPublicCmsSnapshot } from "@/lib/payload/public-cms";

function getLocale(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale")?.trim();
  return locale || "en";
}

export async function GET(request: Request) {
  const payload = await getPayload({ config, cron: true });
  const locale = getLocale(request);
  const snapshot = await getPublicCmsSnapshot(payload, locale);

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}
