import config from "@payload-config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createPayloadRequest, type PayloadRequest } from "payload";

import { getAdminUser } from "@/lib/payload/access.ts";
import { hasAdminRole, type AdminRole } from "@/lib/payload/roles.ts";

export class AdminAuthError extends Error {
  code: "forbidden" | "invalid-input" | "no-op" | "unauthorized" | "unknown";

  constructor(code: AdminAuthError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

function getRequestOrigin(headersStore: Headers) {
  const protocol = headersStore.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  const host =
    headersStore.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headersStore.get("host")?.trim() ||
    "127.0.0.1:3002";

  return `${protocol}://${host}`;
}

function cloneHeaderStore(headersStore: Headers) {
  const result = new Headers();
  headersStore.forEach((value, key) => {
    result.append(key, value);
  });
  return result;
}

export function buildAdminLoginHref(redirectTarget: string) {
  const params = new URLSearchParams();
  params.set("redirect", redirectTarget);
  return `/admin/login?${params.toString()}`;
}

export async function createAdminPayloadRequest(request: Request) {
  return createPayloadRequest({
    canSetHeaders: true,
    config: Promise.resolve(config),
    request,
  });
}

export async function createAdminPagePayloadRequest(pathnameWithSearch: string) {
  const headerStore = await headers();
  const origin = getRequestOrigin(headerStore);
  const request = new Request(`${origin}${pathnameWithSearch}`, {
    headers: cloneHeaderStore(headerStore),
  });

  return createAdminPayloadRequest(request);
}

export function withAdminAuthHeaders(response: NextResponse, req: PayloadRequest) {
  if (req.responseHeaders) {
    req.responseHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export function getAdminAuthErrorCode(error: unknown): AdminAuthError["code"] {
  if (error instanceof AdminAuthError) {
    return error.code;
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    ["forbidden", "invalid-input", "no-op", "unauthorized", "unknown"].includes(String((error as { code?: unknown }).code))
  ) {
    return (error as { code: AdminAuthError["code"] }).code;
  }

  const message = error instanceof Error ? error.message : "unknown";

  switch (message) {
    case "forbidden":
    case "invalid-input":
    case "no-op":
    case "unauthorized":
      return message;
    default:
      return "unknown";
  }
}

export function requireAuthenticatedAdmin(
  req: PayloadRequest,
  roles?: readonly AdminRole[],
): { id?: number | string | null; role: AdminRole } {
  const user = getAdminUser(req.user);

  if (!user?.role) {
    throw new AdminAuthError("unauthorized");
  }

  if (roles && !hasAdminRole(user, roles)) {
    throw new AdminAuthError("forbidden");
  }

  return user as { id?: number | string | null; role: AdminRole };
}

export async function requireAdminPageAccess(
  pathnameWithSearch: string,
  roles?: readonly AdminRole[],
) {
  const req = await createAdminPagePayloadRequest(pathnameWithSearch);
  const user = getAdminUser(req.user);

  if (!user?.role) {
    redirect(buildAdminLoginHref(pathnameWithSearch));
  }

  if (roles && !hasAdminRole(user, roles)) {
    redirect("/admin?denied=1");
  }

  return { req, user };
}

export function createAdminApiErrorResponse(
  error: unknown,
  req: PayloadRequest,
  messages: {
    default: string;
    forbidden?: string;
    invalidInput?: string;
    noOp?: string;
    unauthorized?: string;
  },
) {
  const code = getAdminAuthErrorCode(error);
  const status =
    code === "unauthorized"
      ? 401
      : code === "forbidden"
        ? 403
        : code === "invalid-input" || code === "no-op"
          ? 400
          : 500;

  const message =
    code === "unauthorized"
      ? (messages.unauthorized ?? "Unauthorized.")
      : code === "forbidden"
        ? (messages.forbidden ?? "Forbidden.")
        : code === "invalid-input"
          ? (messages.invalidInput ?? messages.default)
          : code === "no-op"
            ? (messages.noOp ?? messages.default)
            : messages.default;

  return withAdminAuthHeaders(NextResponse.json({ error: message }, { status }), req);
}
