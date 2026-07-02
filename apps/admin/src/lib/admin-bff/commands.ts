import { NextResponse } from "next/server";
import type { PayloadRequest } from "payload";

import type { WorkbenchState } from "./dtos.ts";
import {
  AdminAuthError,
  createAdminApiErrorResponse,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "./session.ts";
import { hasAdminRole, type AdminRole } from "../payload/roles.ts";

export type CommandAuditDraft = {
  action: string;
  actorRole: AdminRole;
  entityId?: number | string | null;
  entityType: string;
  summary: string;
};

export async function parseCommandJson<T extends Record<string, unknown>>(request: Request): Promise<T> {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AdminAuthError("invalid-input", "Command body must be an object.");
    }

    return body as T;
  } catch (error) {
    if (error instanceof AdminAuthError) {
      throw error;
    }

    throw new AdminAuthError("invalid-input", "Command body must be valid JSON.");
  }
}

export function requireCommandRole(req: PayloadRequest, roles: readonly AdminRole[]) {
  const user = requireAuthenticatedAdmin(req);

  if (!hasAdminRole(user, roles)) {
    throw new AdminAuthError("forbidden");
  }

  return user;
}

export function validateCommandObject(value: unknown, label = "Command input"): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminAuthError("invalid-input", `${label} must be an object.`);
  }
}

export function createCommandAuditDraft(input: CommandAuditDraft) {
  return {
    action: input.action,
    actorRole: input.actorRole,
    entityId: input.entityId ?? null,
    entityType: input.entityType,
    summary: input.summary,
  } satisfies CommandAuditDraft;
}

export function createCommandErrorResponse(
  error: unknown,
  req: PayloadRequest,
  messages: Parameters<typeof createAdminApiErrorResponse>[2],
) {
  return createAdminApiErrorResponse(error, req, messages);
}

export function createUpdatedStateResponse<T extends object>(
  req: PayloadRequest,
  state: T,
  workbench?: WorkbenchState,
) {
  const body = workbench ? { ...state, workbench } : state;

  return withAdminAuthHeaders(
    NextResponse.json(body, {
      headers: {
        "Cache-Control": "no-store",
      },
    }),
    req,
  );
}
