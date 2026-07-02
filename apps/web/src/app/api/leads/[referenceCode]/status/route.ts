import { NextResponse } from "next/server";
import { transitionLeadStatus } from "@/lib/leads/lead-admin-workflow";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ referenceCode: string }> },
) {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Lead status payload must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const { referenceCode } = await context.params;

  try {
    const result = await transitionLeadStatus({
      referenceCode,
      status: typeof payload.status === "string" ? payload.status : "",
      changedBy: typeof payload.changedBy === "string" ? payload.changedBy : null,
      reason: typeof payload.reason === "string" ? payload.reason : null,
      note: typeof payload.note === "string" ? payload.note : null,
      nextActionAt: typeof payload.nextActionAt === "string" ? payload.nextActionAt : null,
      assignedTeam: typeof payload.assignedTeam === "string" ? payload.assignedTeam : null,
      assignedToUser:
        typeof payload.assignedToUser === "string" ? payload.assignedToUser : null,
      assignedPartnerLabel:
        typeof payload.assignedPartnerLabel === "string"
          ? payload.assignedPartnerLabel
          : null,
    });

    return NextResponse.json(result, { status: result.status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Lead status update failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
