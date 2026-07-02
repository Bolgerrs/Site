import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const taskId = "MNT-SITE-VIS-021A";
const defaultArtifactDir = join(
  repoRoot,
  "docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-021A/creative-pack-closure-gate-20260524",
);
const artifactDir = process.env.MONTELAR_QA_ARTIFACT_DIR || defaultArtifactDir;

const paths = {
  hub: join(repoRoot, "apps/web/src/app/creative-pack-proof/page.tsx"),
  routeRoot: join(repoRoot, "apps/web/src/app/creative-pack-proof"),
  publicAssets: join(repoRoot, "apps/web/public/images/site-vis-021a"),
  handoff: join(
    repoRoot,
    "docs/strategy/artifacts/visual-modernization-2026-05-21/MNT-SITE-VIS-021A/production-creative-pack-handoff.md",
  ),
  ledger: join(
    repoRoot,
    "docs/strategy/artifacts/visual-modernization-2026-05-21/MNT-SITE-VIS-021A/asset-approval-ledger.json",
  ),
  ownerFeedback: join(repoRoot, "docs/strategy/OWNER_FEEDBACK_LIVE.md"),
  task: join(repoRoot, "docs/tasks/MNT-SITE-VIS-021A-production-creative-pack-flow-generation-and-approval.md"),
};

function read(path) {
  return readFileSync(path, "utf8");
}

function unique(items) {
  return [...new Set(items)];
}

function extractProofRoutes(hubSource) {
  return unique([...hubSource.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]))
    .filter((href) => href.startsWith("/creative-pack-proof/"))
    .sort();
}

function extractOpenOwnerBlocks(ownerFeedback) {
  const blocks = ownerFeedback.split(/\n### /).map((block, index) => (index === 0 ? block : `### ${block}`));
  return blocks
    .filter((block) => block.includes("Status: open") && block.includes(taskId))
    .map((block) => {
      const title = (block.match(/^###\s+(.+)$/m) || [])[1] || "Untitled open correction";
      const artifacts = [...block.matchAll(/^- `?([^`\n]+?)`?$/gm)].map((match) => match[1]).slice(0, 8);
      return { title, artifacts };
    });
}

function routeSlug(route) {
  return route.replace("/creative-pack-proof/", "");
}

function checkRoute(route) {
  const slug = routeSlug(route);
  const routePage = join(paths.routeRoot, slug, "page.tsx");
  const publicDir = join(paths.publicAssets, slug);
  return {
    route,
    slug,
    routePage,
    routePageExists: existsSync(routePage),
    publicDir,
    publicDirExists: existsSync(publicDir),
  };
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function extractPositiveRolloutApprovalLines(source) {
  const negativeContext = /\b(not|neither|missing|without|cannot|can't|do not|must not|unless|until|rejected|reference-only|caveat|needs-regeneration)\b/i;
  return source
    .split("\n")
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => /\b(?:approved-for-rollout|rollout-approved)\b/.test(line))
    .filter(({ line }) => !negativeContext.test(line));
}

const hubSource = read(paths.hub);
const handoff = read(paths.handoff);
const ledger = JSON.parse(read(paths.ledger));
const ownerFeedback = read(paths.ownerFeedback);
const task = read(paths.task);

const proofRoutes = extractProofRoutes(hubSource);
const routeChecks = proofRoutes.map(checkRoute);
const openOwnerCorrections = extractOpenOwnerBlocks(ownerFeedback);
const positiveRolloutApprovalLines = extractPositiveRolloutApprovalLines(handoff);
const statusPhrases = {
  notRolloutApproved: countMatches(handoff, /not-rollout-approved/g),
  positiveRolloutApproved: positiveRolloutApprovalLines.length,
  rolloutApprovalCaveatMentions: countMatches(handoff, /approved-for-rollout|rollout-approved/g),
  native1376: countMatches(handoff, /native-1376x768/g),
  reviewOnlyUpscale: countMatches(handoff, /review-only upscale|review-only upscales|2K review-only/g),
  telegramHandoff: countMatches(handoff, /Telegram handoff|Telegram full-current handoff|Telegram:/g),
};

const ledgerAssets = Array.isArray(ledger.assets) ? ledger.assets : [];
const ledgerEntries = Array.isArray(ledger.entries) ? ledger.entries : [];
const ledgerRejected = Array.isArray(ledger.rejected) ? ledger.rejected : [];

const failures = [];
for (const route of routeChecks) {
  if (!route.routePageExists) failures.push(`Missing proof route page: ${route.routePage}`);
  if (!route.publicDirExists) failures.push(`Missing proof asset folder: ${route.publicDir}`);
}
if (proofRoutes.length < 12) failures.push(`Expected at least 12 proof routes; found ${proofRoutes.length}`);
if (openOwnerCorrections.length === 0) failures.push("No open owner corrections found for MNT-SITE-VIS-021A; closure gate may be stale.");
if (positiveRolloutApprovalLines.length > 0) {
  failures.push(`Unexpected positive rollout approval lines found: ${positiveRolloutApprovalLines.map((entry) => entry.lineNumber).join(", ")}`);
}
if (statusPhrases.notRolloutApproved < 20) failures.push("Handoff does not repeatedly preserve not-rollout-approved caveats.");
if (statusPhrases.native1376 < 10) failures.push("Handoff does not record enough native-1376x768 low-resolution caveats.");
if (statusPhrases.telegramHandoff < 10) failures.push("Handoff does not record enough Telegram handoff evidence.");
if (!task.includes("in_progress")) failures.push("Task file no longer records in_progress status.");

const report = {
  task: taskId,
  generatedAt: new Date().toISOString(),
  closureReady: false,
  falseGreenProtected: failures.length === 0,
  reason: "Owner/reviewer acceptance, native 2K or explicit exception, and final rollout gates remain open.",
  proofRoutes: routeChecks,
  openOwnerCorrections,
  statusPhrases,
  positiveRolloutApprovalLines,
  ledgerSummary: {
    assets: ledgerAssets.length,
    entries: ledgerEntries.length,
    rejected: ledgerRejected.length,
    latestProgress: ledger.latest_progress || null,
  },
  failures,
};

mkdirSync(artifactDir, { recursive: true });
writeFileSync(join(artifactDir, "creative-pack-closure-gate-report.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  join(artifactDir, "creative-pack-closure-gate-summary.md"),
  [
    `# ${taskId} Creative Pack Closure Gate`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Closure ready: ${report.closureReady}`,
    `False-green protected: ${report.falseGreenProtected}`,
    "",
    "## Route Coverage",
    "",
    ...routeChecks.map((route) => `- ${route.route}: route=${route.routePageExists ? "ok" : "missing"}, assets=${route.publicDirExists ? "ok" : "missing"}`),
    "",
    "## Open Owner Corrections",
    "",
    ...openOwnerCorrections.map((entry) => `- ${entry.title}`),
    "",
    "## Status Counters",
    "",
    `- not-rollout-approved caveats: ${statusPhrases.notRolloutApproved}`,
    `- positive rollout approval lines: ${statusPhrases.positiveRolloutApproved}`,
    `- rollout approval caveat mentions: ${statusPhrases.rolloutApprovalCaveatMentions}`,
    `- native-1376x768 caveats: ${statusPhrases.native1376}`,
    `- review-only upscale caveats: ${statusPhrases.reviewOnlyUpscale}`,
    `- Telegram handoff mentions: ${statusPhrases.telegramHandoff}`,
    "",
    "## Result",
    "",
    failures.length
      ? `Gate failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`
      : "Gate passed as a false-green protection check: the proof hub is covered and the task remains correctly not rollout-approved.",
    "",
  ].join("\n"),
);

console.log(JSON.stringify({
  task: report.task,
  closureReady: report.closureReady,
  falseGreenProtected: report.falseGreenProtected,
  proofRouteCount: proofRoutes.length,
  openOwnerCorrectionCount: openOwnerCorrections.length,
  artifactDir,
  failures,
}, null, 2));

if (failures.length) process.exit(1);
