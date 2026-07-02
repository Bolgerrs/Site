#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "docs/strategy/artifacts/visual-bank/creative-bank-manifest.json");
const EXPLODED_SPEAKER_REFERENCE = "/opt/codex-telegram-agent/data/photo_929755726_AQAD_xZrG1hVgEh8.jpg";
const ALLOWED_PUBLIC_STATUSES = new Set(["approved", "current_runtime_governed"]);
const SOURCE_EXTENSIONS = /\.(tsx?|jsx?|css|scss|mdx?)$/i;
const PUBLIC_ASSET_PATTERN = /(?:["'(]|\burl\(["']?)(\/(?:images|videos)\/[^"')\s]+)/g;

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relFromRoot(absPath) {
  if (!absPath.startsWith(ROOT)) return absPath;
  return toPosix(path.relative(ROOT, absPath));
}

function walkSource(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      out.push(...walkSource(full));
      continue;
    }
    if (entry.isFile() && SOURCE_EXTENSIONS.test(entry.name)) out.push(full);
  }
  return out;
}

function collectPublicRefs() {
  const refs = new Map();
  for (const file of walkSource(path.join(ROOT, "apps/web/src"))) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(PUBLIC_ASSET_PATTERN)) {
      const publicPath = match[1].split("?")[0];
      const sourcePath = `apps/web/public/${publicPath.replace(/^\//, "")}`;
      const usedBy = refs.get(sourcePath) || new Set();
      usedBy.add(relFromRoot(file));
      refs.set(sourcePath, usedBy);
    }
  }
  return refs;
}

function fail(message, details = {}) {
  return { level: "fail", message, ...details };
}

function warn(message, details = {}) {
  return { level: "warn", message, ...details };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const assetsByPath = new Map(manifest.assets.map((asset) => [asset.source_path, asset]));
const refs = collectPublicRefs();
const findings = [];

for (const [sourcePath, usedBy] of refs.entries()) {
  const absPath = path.join(ROOT, sourcePath);
  if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
    continue;
  }

  const asset = assetsByPath.get(sourcePath);
  if (!asset) {
    findings.push(fail("public asset reference missing from creative-bank manifest", { sourcePath, usedBy: [...usedBy].sort() }));
    continue;
  }
  if (!ALLOWED_PUBLIC_STATUSES.has(asset.publication_status) || asset.publication_allowed !== true) {
    findings.push(fail("public source references an asset blocked by media-rights gate", {
      sourcePath,
      publicationStatus: asset.publication_status,
      usage: asset.usage,
      usedBy: [...usedBy].sort(),
    }));
  }
}

for (const asset of manifest.assets) {
  if (asset.used_by?.length && asset.usage === "rejected_do_not_use") {
    findings.push(fail("rejected asset is referenced by public source", {
      sourcePath: asset.source_path,
      usedBy: asset.used_by,
    }));
  }
  if (asset.publication_allowed && asset.lineage?.required && asset.lineage.status !== "lineage_recorded") {
    findings.push(fail("publication-allowed generated asset is missing prompt/source lineage", {
      sourcePath: asset.source_path,
      publicationStatus: asset.publication_status,
    }));
  }
}

const exploded = assetsByPath.get(EXPLODED_SPEAKER_REFERENCE);
if (!exploded) {
  findings.push(fail("exploded-speaker reference is missing from creative-bank manifest", {
    sourcePath: EXPLODED_SPEAKER_REFERENCE,
  }));
} else if (exploded.publication_allowed || exploded.used_by?.length) {
  findings.push(fail("exploded-speaker reference must remain prompt/motion reference only", {
    sourcePath: exploded.source_path,
    publicationStatus: exploded.publication_status,
    usedBy: exploded.used_by || [],
  }));
} else {
  findings.push(warn("exploded-speaker reference is recorded as non-public prompt/motion input", {
    sourcePath: exploded.source_path,
    publicationStatus: exploded.publication_status,
    usage: exploded.usage,
  }));
}

const lineagesMissing = manifest.lineage_missing_assets?.length || 0;
if (lineagesMissing > 0) {
  findings.push(warn("generated-like candidate lineage gaps remain blocked from publication", {
    count: lineagesMissing,
  }));
}

const fails = findings.filter((item) => item.level === "fail");
const summary = {
  task: "MNT-SITE-VIS-030",
  manifest: relFromRoot(MANIFEST_PATH),
  publicReferencesChecked: refs.size,
  currentSiteAssets: manifest.current_site_assets?.length || 0,
  blockedPublicationAssets: manifest.blocked_publication_assets?.length || 0,
  lineageMissingAssets: lineagesMissing,
  findings,
  result: fails.length ? "fail" : "pass",
};

console.log(JSON.stringify(summary, null, 2));

if (fails.length) {
  process.exit(1);
}
