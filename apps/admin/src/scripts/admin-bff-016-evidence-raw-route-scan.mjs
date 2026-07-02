import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd().endsWith(`${path.sep}apps${path.sep}admin`)
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const evidenceRoot = path.resolve(
  projectRoot,
  process.argv[2] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-016",
);
const taskBriefPath = path.resolve(
  projectRoot,
  process.env.MNT_ADMIN_BFF_000_TZ || "docs/strategy/artifacts/MNT-ADMIN-BFF-000-full-plug-play-modernization-tz.md",
);

const failures = [];

function readJson(relativePath) {
  const filePath = path.join(evidenceRoot, relativePath);

  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath}: missing`);
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isRawAdminRoute(value) {
  if (typeof value !== "string" || !value.includes("/admin/collections")) {
    return false;
  }

  try {
    const parsed = value.startsWith("http") ? new URL(value) : new URL(value, "http://localhost");

    return parsed.pathname === "/admin/collections" || parsed.pathname.startsWith("/admin/collections/");
  } catch {
    return value.includes("/admin/collections");
  }
}

function scanStrings(value, context) {
  if (typeof value === "string") {
    if (isRawAdminRoute(value)) {
      failures.push(`${context}: ${value}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanStrings(item, `${context}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      scanStrings(item, `${context}.${key}`);
    }
  }
}

function readAcceptanceJourneys() {
  if (!fs.existsSync(taskBriefPath)) {
    failures.push(`${path.relative(projectRoot, taskBriefPath)}: missing`);
    return [];
  }

  const brief = fs.readFileSync(taskBriefPath, "utf8");
  const match = brief.match(/## Full Acceptance Journeys\n(?<body>[\s\S]*?)(?:\n## |\n### |$)/);
  const body = match?.groups?.body ?? "";

  return body
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(\d+)\.\s+(.+?)\s*$/))
    .filter(Boolean)
    .map((matchLine) => ({
      id: Number(matchLine?.[1]),
      text: matchLine?.[2] ?? "",
    }));
}

const fixture = readJson("browser-fixture.json");
if (fixture?.routes) {
  for (const [label, route] of Object.entries(fixture.routes)) {
    if (label === "advanced") {
      continue;
    }
    if (isRawAdminRoute(route)) {
      failures.push(`browser-fixture.routes.${label}: ${route}`);
    }
  }

  for (const label of [
    "headerMotionSettings",
    "homepageUnifiedEditor",
    "homepageSeoEditor",
    "homepageTranslationsEditor",
    "globalCheckReturn",
    "globalMediaReturn",
    "globalTranslationReturn",
  ]) {
    if (!fixture.routes[label]) {
      failures.push(`browser-fixture.routes.${label}: missing required BFF-016 journey 22-24 route`);
    }
  }
}

const captureSummary = readJson("browser-capture/capture-summary.json");
if (Array.isArray(captureSummary)) {
  for (const entry of captureSummary) {
    if (entry?.label === "advanced") {
      continue;
    }
    if (isRawAdminRoute(entry?.finalUrl)) {
      failures.push(`capture-summary.${entry?.variant ?? "unknown"}.${entry?.label ?? "unknown"}: ${entry.finalUrl}`);
    }
  }
}

const clickPathEvidence = readJson("click-path-core/browser-click-path-evidence.json");
if (clickPathEvidence) {
  scanStrings(clickPathEvidence, "click-path-evidence");
  for (const label of ["journey22", "journey23", "journey24"]) {
    if (!clickPathEvidence[label]) {
      failures.push(`click-path-evidence.${label}: missing required BFF-016 journey 22-24 evidence`);
    }
  }
}

const acceptanceJourneys = readAcceptanceJourneys();
const acceptanceCount = acceptanceJourneys.length;
if (acceptanceCount < 24) {
  failures.push(`MNT-ADMIN-BFF-000 Full Acceptance Journeys: expected at least 24, found ${acceptanceCount}`);
}

const reportPath = path.join(evidenceRoot, "acceptance-report.md");
if (!fs.existsSync(reportPath)) {
  failures.push("acceptance-report.md: missing");
} else {
  const report = fs.readFileSync(reportPath, "utf8");
  const routeEvidenceLines = report
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- ") || line.startsWith("| "))
    .filter((line) => /\/admin(?:\/|\?|#|`|\s|$)/.test(line));

  for (const [index, line] of routeEvidenceLines.entries()) {
    if (isRawAdminRoute(line)) {
      failures.push(`acceptance-report route line ${index + 1}: ${line}`);
    }
  }

  for (const journey of acceptanceJourneys) {
    const rowPattern = new RegExp(`^\\|\\s*${journey.id}\\s*\\|`, "m");
    if (!rowPattern.test(report)) {
      failures.push(`acceptance-report journey ${journey.id}: missing matrix row`);
    }
  }

  if (acceptanceCount > 0 && !new RegExp(`contains\\s+${acceptanceCount}\\s+journeys`, "i").test(report)) {
    failures.push(`acceptance-report verdict: missing current journey count ${acceptanceCount}`);
  }

  if (!/journeys?\s+22-24/i.test(report) || !/stale-TZ journey-count/i.test(report)) {
    failures.push("acceptance-report Block Gate: missing explicit journeys 22-24 stale-TZ coverage");
  }
}

if (failures.length > 0) {
  console.error("admin-bff-016-evidence-raw-route-scan: forbidden raw owner/site-admin evidence routes found:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("admin-bff-016-evidence-raw-route-scan: ok");
