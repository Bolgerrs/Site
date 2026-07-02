import { NextResponse } from "next/server";
import { submitProductLead } from "@/lib/leads/lead-intake";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Lead submission payload must be valid JSON.",
      },
      { status: 400 },
    );
  }

  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const result = await submitProductLead((payload ?? {}) as Record<string, unknown>, {
      clientIp: forwardedFor ? forwardedFor.split(",")[0]?.trim() ?? null : null,
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    });

    return NextResponse.json(result, { status: result.status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Lead submission failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
