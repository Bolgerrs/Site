import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

type GuardrailEvent = {
  createdAt: string;
  clientKey: string | null;
  productSlug: string;
  locale: string;
  submissionFingerprint: string;
  outcome: "accepted" | "blocked";
  reason:
    | "accepted"
    | "honeypot"
    | "submit-too-fast"
    | "duplicate-fingerprint"
    | "product-window-rate-limit"
    | "client-window-rate-limit";
  referenceCode: string | null;
};

export type LeadSubmissionGuardrailInput = {
  clientIp: string | null;
  userAgent: string | null;
  productSlug: string;
  locale: string;
  submissionFingerprint: string;
  honeypot: string | null;
  startedAt: number | null;
  now: Date;
};

export type LeadSubmissionGuardrailDecision =
  | { ok: true; clientKey: string | null }
  | {
      ok: false;
      clientKey: string | null;
      status: 400 | 409 | 429;
      error: string;
      reason: GuardrailEvent["reason"];
    };

const guardrailRoot = join(process.cwd(), "..", "..", ".tmp", "lead-intake", "guardrails");
const ledgerPath = join(guardrailRoot, "submissions.jsonl");
const minimumSubmitAgeMs = 3_000;
const duplicateWindowMs = 12 * 60 * 60 * 1_000;
const productWindowMs = 10 * 60 * 1_000;
const clientWindowMs = 60 * 60 * 1_000;
const maxProductWindowSubmissions = 3;
const maxClientWindowSubmissions = 8;

function buildClientKey(clientIp: string | null, userAgent: string | null) {
  const basis = clientIp?.trim() || userAgent?.trim();
  if (!basis) {
    return null;
  }

  return createHash("sha256").update(basis).digest("hex").slice(0, 16);
}

async function ensureGuardrailRoot() {
  await mkdir(guardrailRoot, { recursive: true });
}

async function readGuardrailEvents() {
  try {
    const source = await readFile(ledgerPath, "utf8");

    return source
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as GuardrailEvent)
      .filter((event) => event.createdAt && event.productSlug && event.submissionFingerprint);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function appendGuardrailEvent(event: GuardrailEvent) {
  await ensureGuardrailRoot();
  await appendFile(ledgerPath, `${JSON.stringify(event)}\n`, "utf8");
}

export async function evaluateLeadSubmissionGuardrails(
  input: LeadSubmissionGuardrailInput,
): Promise<LeadSubmissionGuardrailDecision> {
  const clientKey = buildClientKey(input.clientIp, input.userAgent);

  if (input.honeypot && input.honeypot.trim().length > 0) {
    await appendGuardrailEvent({
      createdAt: input.now.toISOString(),
      clientKey,
      productSlug: input.productSlug,
      locale: input.locale,
      submissionFingerprint: input.submissionFingerprint,
      outcome: "blocked",
      reason: "honeypot",
      referenceCode: null,
    });

    return {
      ok: false,
      clientKey,
      status: 400,
      error: "Submission rejected by the anti-spam baseline.",
      reason: "honeypot",
    };
  }

  if (
    typeof input.startedAt === "number" &&
    Number.isFinite(input.startedAt) &&
    input.now.getTime() - input.startedAt < minimumSubmitAgeMs
  ) {
    await appendGuardrailEvent({
      createdAt: input.now.toISOString(),
      clientKey,
      productSlug: input.productSlug,
      locale: input.locale,
      submissionFingerprint: input.submissionFingerprint,
      outcome: "blocked",
      reason: "submit-too-fast",
      referenceCode: null,
    });

    return {
      ok: false,
      clientKey,
      status: 400,
      error: "Submission rejected because it arrived too quickly to trust.",
      reason: "submit-too-fast",
    };
  }

  const events = await readGuardrailEvents();
  const nowMs = input.now.getTime();
  const hasRecentDuplicate = events.some(
    (event) =>
      event.outcome === "accepted" &&
      event.submissionFingerprint === input.submissionFingerprint &&
      nowMs - Date.parse(event.createdAt) < duplicateWindowMs,
  );

  if (hasRecentDuplicate) {
    await appendGuardrailEvent({
      createdAt: input.now.toISOString(),
      clientKey,
      productSlug: input.productSlug,
      locale: input.locale,
      submissionFingerprint: input.submissionFingerprint,
      outcome: "blocked",
      reason: "duplicate-fingerprint",
      referenceCode: null,
    });

    return {
      ok: false,
      clientKey,
      status: 409,
      error: "A similar request was already received recently.",
      reason: "duplicate-fingerprint",
    };
  }

  if (clientKey) {
    const recentClientEvents = events.filter(
      (event) =>
        event.clientKey === clientKey &&
        nowMs - Date.parse(event.createdAt) < clientWindowMs,
    );

    if (recentClientEvents.length >= maxClientWindowSubmissions) {
      await appendGuardrailEvent({
        createdAt: input.now.toISOString(),
        clientKey,
        productSlug: input.productSlug,
        locale: input.locale,
        submissionFingerprint: input.submissionFingerprint,
        outcome: "blocked",
        reason: "client-window-rate-limit",
        referenceCode: null,
      });

      return {
        ok: false,
        clientKey,
        status: 429,
        error: "Too many requests were received from this client. Please retry later.",
        reason: "client-window-rate-limit",
      };
    }

    const recentProductEvents = recentClientEvents.filter(
      (event) =>
        event.productSlug === input.productSlug &&
        event.locale === input.locale &&
        nowMs - Date.parse(event.createdAt) < productWindowMs,
    );

    if (recentProductEvents.length >= maxProductWindowSubmissions) {
      await appendGuardrailEvent({
        createdAt: input.now.toISOString(),
        clientKey,
        productSlug: input.productSlug,
        locale: input.locale,
        submissionFingerprint: input.submissionFingerprint,
        outcome: "blocked",
        reason: "product-window-rate-limit",
        referenceCode: null,
      });

      return {
        ok: false,
        clientKey,
        status: 429,
        error: "Too many recent requests were received for this route. Please retry later.",
        reason: "product-window-rate-limit",
      };
    }
  }

  return {
    ok: true,
    clientKey,
  };
}

export async function recordAcceptedLeadSubmission(input: {
  clientKey: string | null;
  createdAt: string;
  productSlug: string;
  locale: string;
  submissionFingerprint: string;
  referenceCode: string;
}) {
  await appendGuardrailEvent({
    createdAt: input.createdAt,
    clientKey: input.clientKey,
    productSlug: input.productSlug,
    locale: input.locale,
    submissionFingerprint: input.submissionFingerprint,
    outcome: "accepted",
    reason: "accepted",
    referenceCode: input.referenceCode,
  });
}
