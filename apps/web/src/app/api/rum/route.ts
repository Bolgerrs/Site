import { mkdir, appendFile } from "node:fs/promises";
import { dirname } from "node:path";
import { isIP } from "node:net";
import { resolveTxt } from "node:dns/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RUM_LOG_PATH = process.env.MONTELAR_RUM_LOG_PATH || "/var/log/montelar/rum-events.jsonl";
const MAX_BODY_BYTES = 16_384;
const MAX_STRING_LENGTH = 1_200;
const MAX_ARRAY_LENGTH = 20;
const MAX_OBJECT_KEYS = 60;
const ASN_LOOKUP_TIMEOUT_MS = 900;
const asnCache = new Map<string, { expiresAt: number; value: ClientNetwork | null }>();

const allowedTypes = new Set([
  "runtime-error",
  "unhandled-rejection",
  "failed-resource",
  "chunk-load-error",
  "console-error",
  "render-health",
  "slow-page",
  "manual-probe",
]);

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ClientNetwork = {
  ip: string;
  asn: string | null;
  prefix: string | null;
  country: string | null;
  registry: string | null;
  allocated: string | null;
  operator: string | null;
  source: "team-cymru";
};

function sanitizeValue(value: unknown, depth = 0): JsonValue {
  if (depth > 4) return "[depth-limit]";
  if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object" && value) {
    const result: { [key: string]: JsonValue } = {};
    for (const [key, item] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
      result[key] = /password|token|secret|cookie|authorization/i.test(key) ? "[redacted]" : sanitizeValue(item, depth + 1);
    }
    return result;
  }
  return null;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || null;
}

function isPrivateIp(ip: string) {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    /^169\.254\./.test(ip) ||
    /^fc|^fd/i.test(ip)
  );
}

function ipv6ToNibbles(ip: string) {
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const missing = 8 - headParts.length - tailParts.length;
  const parts = [...headParts, ...Array(Math.max(missing, 0)).fill("0"), ...tailParts];
  return parts.map((part) => part.padStart(4, "0")).join("");
}

function getCymruQuery(ip: string) {
  const version = isIP(ip);
  if (version === 4) return `${ip.split(".").reverse().join(".")}.origin.asn.cymru.com`;
  if (version === 6) return `${ipv6ToNibbles(ip).split("").reverse().join(".")}.origin6.asn.cymru.com`;
  return null;
}

async function lookupAsName(asn: string | null) {
  if (!asn || !/^\d+$/.test(asn)) return null;
  const query = `AS${asn}.asn.cymru.com`;
  const lookup = resolveTxt(query).then((records) => {
    const line = records.flat().join(" ").replace(/^"|"$/g, "");
    const parts = line.split("|").map((part) => part.trim());
    return parts.slice(4).join(" | ") || null;
  });
  return Promise.race([
    lookup,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ASN_LOOKUP_TIMEOUT_MS)),
  ]).catch(() => null);
}

async function lookupClientNetwork(ip: string | null): Promise<ClientNetwork | null> {
  if (!ip || !isIP(ip) || isPrivateIp(ip)) return null;
  const cached = asnCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const query = getCymruQuery(ip);
  if (!query) return null;

  const lookup = resolveTxt(query).then(async (records) => {
    const line = records.flat().join(" ").replace(/^"|"$/g, "");
    const [asn, prefix, country, registry, allocated, ...operatorParts] = line.split("|").map((part) => part.trim());
    const directOperator = operatorParts.join(" | ") || null;
    const asName = await lookupAsName(asn || null);
    return {
      ip,
      asn: asn || null,
      prefix: prefix || null,
      country: country || null,
      registry: registry || null,
      allocated: allocated || null,
      operator: directOperator || asName,
      source: "team-cymru" as const,
    };
  });

  const value = await Promise.race([
    lookup,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ASN_LOOKUP_TIMEOUT_MS)),
  ]).catch(() => null);

  asnCache.set(ip, { expiresAt: Date.now() + 6 * 60 * 60 * 1000, value });
  return value;
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });

    const rawPayload = await request.json().catch(() => null);
    const payload = sanitizeValue(rawPayload) as { [key: string]: JsonValue };
    const type = typeof payload.type === "string" ? payload.type : "unknown";

    if (!allowedTypes.has(type)) return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });

    const ip = getClientIp(request);
    const network = await lookupClientNetwork(ip);
    const event = {
      ts: new Date().toISOString(),
      type,
      client: {
        ip,
        network,
        userAgent: request.headers.get("user-agent") || null,
        acceptLanguage: request.headers.get("accept-language") || null,
        referer: request.headers.get("referer") || null,
        host: request.headers.get("host") || null,
        forwardedProto: request.headers.get("x-forwarded-proto") || null,
      },
      payload,
    };

    await mkdir(dirname(RUM_LOG_PATH), { recursive: true });
    await appendFile(RUM_LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[montelar-rum] write failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ ok: true, service: "montelar-rum" });
}
