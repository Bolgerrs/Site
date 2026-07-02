import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

type Hit = {
  file: string;
  line: number;
  rule: string;
  text: string;
};

const defaultTargets = ["docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-015A"];

const forbiddenRules: Array<{ name: string; pattern: RegExp; snapshotOnly?: boolean }> = [
  { name: "Payload brand in owner text", pattern: /\bPayload\b/i },
  { name: "BFF in owner text", pattern: /\bBFF\b/i },
  { name: "DTO in owner text", pattern: /\bDTO\b/i },
  { name: "direct raw collection URL", pattern: /\/admin\/collections/i },
  { name: "raw layer vocabulary", pattern: /\braw\b|сыр(?:ой|ые|ая|ую)\s+коллекц/i },
  { name: "database collection vocabulary", pattern: /\bcollections?\b|коллекц/i },
  { name: "database record vocabulary", pattern: /\brecords?\b|полная запись|служебные записи|SEO-запис/i },
  { name: "schema vocabulary", pattern: /\bschema\b|схем/i },
  { name: "route-path vocabulary", pattern: /\broute path\b|Правило маршрута|Публичный маршрут/i },
  { name: "surface registry vocabulary", pattern: /surface registry|editable surface|workbench state/i },
  { name: "internal field key", pattern: /ownerRecordKey|productInquiryForms|pageSections/i },
  { name: "implementation action copy", pattern: /guided API|product-admin|API command/i },
  { name: "scaffold filler", pattern: /\bscaffold\b|production-ready/i },
  { name: "fixture QA label in owner text", pattern: /Browser QA|Internal seed sample|INTERNAL TEST/i, snapshotOnly: true },
  { name: "placeholder copy in owner text", pattern: /\bplaceholder\b/i, snapshotOnly: true },
  { name: "raw status token in owner text", pattern: /^steady$/i, snapshotOnly: true },
  { name: "English site-admin label", pattern: /\bCTA\b|Header CTA|footer links|navigation menus|protected header behavior rows/i, snapshotOnly: true },
  { name: "technical media label", pattern: /motion reference|Метадата/i, snapshotOnly: true },
  { name: "technical product loading copy", pattern: /\bCMS\b|service-looking/i, snapshotOnly: true },
  { name: "English media count label", pattern: /\bassets?\b/i, snapshotOnly: true },
  { name: "raw product status token", pattern: /^(planned|active|private-consultation)$/i, snapshotOnly: true },
];

const allowedSourceFiles = [
  /MontelarAdvancedSettings\.tsx$/,
  /MontelarAdminDevLinks\.tsx$/,
  /site-admin-workspace\.ts$/,
  /raw-layer/i,
];

const allowedSnapshotFiles = [
  /(^|\/)advanced-[^/]+\.txt$/,
  /(^|\/)(forms-editor|page-editor|secondary-page-editor|seo-editor)-[^/]+\.txt$/,
  /(^|\/)public-preview-[^/]+\.txt$/,
  /(^|\/)capture-summary\.json$/,
  /(^|\/)owner-ui-language-capture-summary\.json$/,
  /(^|\/)browser-fixture\.json$/,
];

function isTextTarget(filePath: string) {
  return /\.(ts|tsx|mjs|js|txt|json|md)$/.test(filePath);
}

function collectFiles(target: string): string[] {
  if (!existsSync(target)) {
    return [];
  }

  const stats = statSync(target);
  if (stats.isFile()) {
    return isTextTarget(target) ? [target] : [];
  }

  return readdirSync(target).flatMap((entry) => collectFiles(path.join(target, entry)));
}

function isAllowedFile(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/");

  if (allowedSnapshotFiles.some((rule) => rule.test(normalized))) {
    return true;
  }

  if (normalized.includes("docs/strategy/artifacts/visual-qa/")) {
    return false;
  }

  return allowedSourceFiles.some((rule) => rule.test(normalized));
}

function isSnapshotFile(filePath: string) {
  return filePath.replace(/\\/g, "/").includes("docs/strategy/artifacts/visual-qa/");
}

function isCommentOnly(line: string) {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

function scanFile(filePath: string): Hit[] {
  if (isAllowedFile(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const hits: Hit[] = [];

  lines.forEach((line, index) => {
    if (isCommentOnly(line)) {
      return;
    }

    for (const rule of forbiddenRules) {
      if (rule.snapshotOnly && !isSnapshotFile(filePath)) {
        continue;
      }
      if (rule.pattern.test(line)) {
        hits.push({
          file: filePath,
          line: index + 1,
          rule: rule.name,
          text: line.trim().slice(0, 220),
        });
      }
    }
  });

  return hits;
}

const targets = process.argv.slice(2);
const files = (targets.length > 0 ? targets : defaultTargets)
  .flatMap(collectFiles)
  .filter((filePath, index, all) => all.indexOf(filePath) === index);

const hits = files.flatMap(scanFile);

if (hits.length > 0) {
  console.error("owner-ui-language-scan: forbidden first-layer vocabulary found");
  for (const hit of hits.slice(0, 80)) {
    console.error(`${hit.file}:${hit.line}: ${hit.rule}: ${hit.text}`);
  }
  if (hits.length > 80) {
    console.error(`...and ${hits.length - 80} more hit(s)`);
  }
  process.exit(1);
}

console.log(`owner-ui-language-scan: ok files=${files.length}`);
