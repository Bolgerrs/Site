#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BANK_DIR = path.join(ROOT, "docs/strategy/artifacts/visual-bank");
const MANIFEST_PATH = path.join(BANK_DIR, "creative-bank-manifest.json");
const REPORT_PATH = path.join(BANK_DIR, "reports/MNT-SITE-VIS-006-creative-bank-normalization.md");
const OPTIMIZED_DIR = path.join(BANK_DIR, "optimized");
const ORIGINALS_DIR = path.join(BANK_DIR, "originals");
const CONTACT_SHEET_DIR = path.join(BANK_DIR, "reports/contact-sheets");
const EXPLODED_SPEAKER_REFERENCE = "/opt/codex-telegram-agent/data/photo_929755726_AQAD_xZrG1hVgEh8.jpg";

const MEDIA_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp4",
  ".png",
  ".svg",
  ".webm",
  ".webp",
]);

const RASTER_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);

const SOURCE_ROOTS = [
  {
    key: "project_public",
    label: "Current Next.js public media",
    base: path.join(ROOT, "apps/web/public"),
    rights: "Current project runtime asset; keep governed until replaced. Publication rights still depend on source report.",
  },
  {
    key: "legacy_static_reference",
    label: "Root HTML prototype assets",
    base: path.join(ROOT, "assets"),
    rights: "Legacy prototype/reference asset; do not treat as new production source without review.",
  },
  {
    key: "product_extracted_media",
    label: "Extracted product document media",
    base: path.join(ROOT, "docs/strategy/artifacts/product-research-2026-05-14/embedded-media"),
    rights: "Extracted from owner/supplier documents; product research source, rights pending before public use.",
  },
  {
    key: "product_preview_media",
    label: "Rendered product document previews",
    base: path.join(ROOT, "docs/strategy/artifacts/product-research-2026-05-14/previews"),
    rights: "Rendered from owner/supplier documents; reference or review only until rights are confirmed.",
  },
  {
    key: "idea_bank_reference",
    label: "Competitor/reference idea bank",
    base: path.join(ROOT, "docs/strategy/artifacts/idea-bank"),
    rights: "Reference-only competitor/source material. Never publish as Montelar media without explicit rights review.",
  },
  {
    key: "telegram_intake",
    label: "Telegram/owner intake external data",
    base: "/opt/codex-telegram-agent/data",
    rights: "External owner-intake file. Do not copy to production until selected, rights-tagged and promoted.",
    external: true,
  },
  {
    key: "visual_bank_reference",
    label: "Existing visual-bank references",
    base: path.join(BANK_DIR, "references"),
    rights: "Governed reference material; usage depends on per-folder/source notes.",
  },
  {
    key: "visual_bank_candidate",
    label: "Existing generated/still candidates",
    base: path.join(BANK_DIR, "candidates"),
    rights: "Candidate only. Needs scorecard, source-fidelity and rights notes before approval.",
  },
  {
    key: "visual_bank_approved",
    label: "Existing approved creative bank",
    base: path.join(BANK_DIR, "approved"),
    rights: "Approved bank lane, but keep per-asset report as source of truth for publication.",
  },
  {
    key: "visual_bank_rejected",
    label: "Existing rejected creative bank",
    base: path.join(BANK_DIR, "rejected"),
    rights: "Rejected anti-pattern lane. Do not use in public site.",
  },
];

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relFromRoot(absPath) {
  if (!absPath.startsWith(ROOT)) return absPath;
  return toPosix(path.relative(ROOT, absPath));
}

function slugPart(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/giu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54) || "asset";
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  if (!(await exists(dir))) return [];
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
      continue;
    }
    if (entry.isFile() && MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

async function sha256(absPath) {
  const hash = crypto.createHash("sha256");
  const handle = await fs.open(absPath, "r");
  try {
    for await (const chunk of handle.createReadStream()) {
      hash.update(chunk);
    }
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
}

async function mediaMeta(absPath, ext) {
  if (!RASTER_EXTENSIONS.has(ext)) return {};
  try {
    const meta = await sharp(absPath, { animated: false, limitInputPixels: false }).metadata();
    return {
      width: meta.width || null,
      height: meta.height || null,
      format: meta.format || null,
      has_alpha: Boolean(meta.hasAlpha),
    };
  } catch (error) {
    return { metadata_warning: error.message };
  }
}

async function collectUsedPublicAssets() {
  const srcDir = path.join(ROOT, "apps/web/src");
  const files = await walkSource(srcDir);
  const used = new Map();
  const assetPattern = /(?:["'(]|\burl\(["']?)(\/(?:images|videos)\/[^"')\s]+)/g;
  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    for (const match of text.matchAll(assetPattern)) {
      const publicPath = match[1].split("?")[0];
      const abs = path.join(ROOT, "apps/web/public", publicPath.replace(/^\//, ""));
      const refs = used.get(abs) || [];
      refs.push(relFromRoot(file));
      used.set(abs, [...new Set(refs)]);
    }
  }
  return used;
}

async function walkSource(dir) {
  if (!(await exists(dir))) return [];
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      out.push(...(await walkSource(full)));
      continue;
    }
    if (entry.isFile() && /\.(tsx?|jsx?|css|scss|mdx?)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function categoryFor(assetPath) {
  const p = assetPath.toLowerCase();
  if (/(logo|brand|montelar-logo|логотип)/u.test(p)) return "logos";
  if (/(^|\/|-)reject(ed)?($|\/|-)|anti-pattern|bad-photo|bad_photo|failed-candidate|(^|\/|-)анти($|\/|-)/u.test(p)) return "rejected";
  if (/(hero|home|homepage|cinema|room|screen-product-loop|master-room)/u.test(p)) return "hero";
  if (/(speaker|audio|kharma|focal|bowers|bang-olufsen|magico|ascendo|акуст)/u.test(p)) return "audio";
  if (/(amplifier|amplifier-stack|amp-|d-agostino|simaudio|усилител)/u.test(p)) return "amplifiers";
  if (/(cable|prima|siltech|tellurium|tara|audioquest|провод|кабел)/u.test(p)) return "cables";
  if (/(hologram|holo|hypervsn|lookingglass|голог)/u.test(p)) return "holograms";
  if (/(transparent|living-glass|glass|прозрач)/u.test(p)) return "transparent displays";
  if (/(flex|flexible|embedded|touch|display|screen|bondroid|panel|встра|гибк|диспле)/u.test(p)) return "flexible screens";
  if (/(product-scene|series|product|preview|reference|candidate|generated)/u.test(p)) return "product references";
  return "product references";
}

function cropFor(category, meta = {}) {
  if (category === "logos") return "Preserve transparent canvas and full wordmark; no crop.";
  if (category === "hero") return "Prefer 16:9, 21:9 or 4:5 mobile crops with product/environment anchors intact.";
  if (category === "audio" || category === "amplifiers" || category === "cables") {
    return "Keep full object silhouette, terminals/plugs/feet visible; crop only with negative space for editorial layout.";
  }
  if (category === "flexible screens" || category === "transparent displays" || category === "holograms") {
    return "Preserve display edges, mounting context and any interaction surface; avoid crop that hides scale.";
  }
  if (meta.width && meta.height && meta.width / meta.height > 2.4) return "Panoramic crop candidate; check mobile alternate before use.";
  return "Review manually; keep product context and avoid stock-like crops.";
}

function usageFor(root, category, isUsedPublic) {
  if (category === "rejected") return "rejected_do_not_use";
  if (root.key === "visual_bank_rejected") return "rejected_do_not_use";
  if (root.key === "visual_bank_approved") return "approved_bank";
  if (root.key === "visual_bank_candidate") return "candidate_needs_review";
  if (root.key === "idea_bank_reference") return "reference_only";
  if (root.key === "telegram_intake") return "owner_intake_pending";
  if (root.key.startsWith("product_")) return "product_source_reference";
  if (root.key === "project_public" && isUsedPublic) return "current_site_in_use";
  if (root.key === "project_public") return "current_public_unmapped";
  return "reference_or_legacy";
}

function publicationStatusFor({ root, usage, sourcePath }) {
  if (usage === "rejected_do_not_use") return "rejected";
  if (usage === "approved_bank") return "approved";
  if (usage === "current_site_in_use") return "current_runtime_governed";
  if (usage === "current_public_unmapped") return "public_unmapped_pending_review";
  if (usage === "owner_intake_pending") return "owner_uploaded_pending_review";
  if (usage === "candidate_needs_review") return "generated_candidate_needs_lineage";
  if (usage === "product_source_reference") return "supplier_document_source_reference_only";
  if (usage === "reference_only") return "reference_only";
  if (root.key === "legacy_static_reference") return "legacy_reference_only";
  if (/flow|nano|veo|generated|candidate/iu.test(sourcePath)) return "generated_candidate_needs_lineage";
  return "reference_only";
}

function publicationAllowedFor(status) {
  return ["approved", "current_runtime_governed"].includes(status);
}

function usageNotesFor(status) {
  const notes = {
    approved: "May be used in public UI after normal optimization/crop QA; keep source report attached.",
    current_runtime_governed: "Already referenced by the current public runtime; allowed to remain, but replacement still needs lineage and rights notes.",
    public_unmapped_pending_review: "Stored under public assets but not referenced by source; do not add to pages until reviewed.",
    owner_uploaded_pending_review: "Owner/intake material; do not publish directly until the owner selection, rights note and quality check are recorded.",
    generated_candidate_needs_lineage: "Generated/regenerated candidate; needs prompt, source input, candidate selection and usage note before approval.",
    supplier_document_source_reference_only: "Supplier/document material is product-truth evidence only unless licensing or transformed output is recorded.",
    reference_only: "Reference-only material for prompts, direction and product understanding; never publish directly as Montelar media.",
    legacy_reference_only: "Legacy/root prototype asset; keep as brand DNA reference unless explicitly promoted with rights notes.",
    rejected: "Rejected or unsafe asset; public usage is forbidden.",
  };
  return notes[status] || notes.reference_only;
}

function requiresLineageFor(status, sourcePath) {
  if (status === "generated_candidate_needs_lineage") return true;
  return /flow|nano|veo|generated|candidate|scroll-sequence|product-motion/iu.test(sourcePath);
}

async function lineageFilesFor(absPath) {
  const candidates = [];
  let dir = path.dirname(absPath);
  const stop = path.dirname(ROOT);
  const names = [
    "prompt.txt",
    "report.json",
    "gemini-report.json",
    "rejected-old-chat-blob-report.json",
    "motion-spec.md",
    "product-motion-prototype-freeze-2026-05-15.md",
  ];

  for (let depth = 0; depth < 3 && dir && dir !== stop; depth += 1) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (await exists(candidate)) candidates.push(relFromRoot(candidate));
    }
    dir = path.dirname(dir);
  }

  return [...new Set(candidates)].sort();
}

function manualLineageFilesFor(sourcePath) {
  if (sourcePath.endsWith("apps/web/public/images/home/generated/montelar-nano-banana-video-frame.png")) {
    return [
      "docs/strategy/artifacts/visual-bank/candidates/nano-banana-home-video-2026-05-09/report.json",
    ];
  }

  if (sourcePath.includes("apps/web/public/images/product-motion/speaker-pair-premium/")) {
    return [
      "docs/strategy/artifacts/flow-scroll-product-prototype-2026-05-15/motion-spec.md",
      "docs/strategy/artifacts/flow-scroll-product-prototype-2026-05-15/product-motion-prototype-freeze-2026-05-15.md",
    ];
  }

  if (sourcePath.includes("apps/web/public/images/scroll-sequence/")) {
    return [
      "docs/strategy/artifacts/flow-scroll-product-prototype-2026-05-15/motion-spec.md",
      "docs/strategy/artifacts/flow-scroll-product-prototype-2026-05-15/product-motion-prototype-freeze-2026-05-15.md",
    ];
  }

  return [];
}

async function lineageFor({ absPath, sourcePath, status }) {
  const requiresLineage = requiresLineageFor(status, sourcePath);
  const files = [...new Set([...(await lineageFilesFor(absPath)), ...manualLineageFilesFor(sourcePath)])].sort();
  return {
    required: requiresLineage,
    prompt_or_report_files: files,
    status: requiresLineage ? (files.length ? "lineage_recorded" : "lineage_missing") : "not_required",
  };
}

function qualityFor(asset, meta) {
  if (asset.kind === "vector") return "vector_review";
  if (asset.kind === "video") return asset.bytes <= 10_000_000 ? "video_manageable" : "video_heavy_review";
  if (meta.metadata_warning) return "metadata_warning";
  if (meta.width && meta.height && (meta.width < 640 || meta.height < 360)) return "low_resolution_review";
  if (asset.bytes > 2_000_000) return "heavy_original_optimize_before_web";
  if (asset.bytes <= 500_000) return "web_weight_ok";
  return "web_weight_review";
}

function kindFor(ext) {
  if ([".mp4", ".mov", ".webm"].includes(ext)) return "video";
  if (ext === ".svg") return "vector";
  return "image";
}

async function nearestIdeaBankMetadata(absPath) {
  const marker = `${path.sep}docs${path.sep}strategy${path.sep}artifacts${path.sep}idea-bank${path.sep}`;
  if (!absPath.includes(marker)) return null;
  let dir = path.dirname(absPath);
  while (dir.startsWith(path.join(ROOT, "docs/strategy/artifacts/idea-bank"))) {
    const candidate = path.join(dir, "metadata.jsonl");
    if (await exists(candidate)) return relFromRoot(candidate);
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return null;
}

async function optimizeAsset(asset) {
  if (asset.kind !== "image" || asset.ext === ".gif" || asset.ext === ".avif") return null;
  if (!["project_public", "product_extracted_media", "product_preview_media"].includes(asset.origin_key)) return null;
  if (/\/(scroll-sequence|product-motion|home\/generated)\//u.test(asset.source_path)) return null;
  if (/\/images\/brand\/montelar-(symbol|wordmark)-gold-20260515\.png$/u.test(asset.source_path)) return null;

  const sourceAbs = asset.abs_path;
  const categoryDir = path.join(OPTIMIZED_DIR, asset.category.replace(/\s+/g, "-"));
  await fs.mkdir(categoryDir, { recursive: true });

  const baseName = `${asset.sha256.slice(0, 12)}-${slugPart(path.basename(asset.source_path, asset.ext))}.webp`;
  const outAbs = path.join(categoryDir, baseName);
  const resize = {};
  if (asset.width && asset.width > 1800) resize.width = 1800;

  try {
    const pipeline = sharp(sourceAbs, { animated: false, limitInputPixels: false }).rotate();
    if (resize.width) pipeline.resize(resize);
    await pipeline.webp({ quality: 82, effort: 4 }).toFile(outAbs);
    const stat = await fs.stat(outAbs);
    return {
      path: relFromRoot(outAbs),
      bytes: stat.size,
      max_width: resize.width || null,
      format: "webp",
      rule: "sharp webp quality 82, max-width 1800px when source is wider",
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function ensureBankFolders() {
  const folders = [
    ORIGINALS_DIR,
    OPTIMIZED_DIR,
    CONTACT_SHEET_DIR,
    path.join(BANK_DIR, "approved"),
    path.join(BANK_DIR, "rejected"),
    path.join(BANK_DIR, "reports"),
  ];
  for (const folder of folders) {
    await fs.mkdir(folder, { recursive: true });
    const keep = path.join(folder, ".gitkeep");
    if (!(await exists(keep))) await fs.writeFile(keep, "");
  }

  const originalsReadme = path.join(ORIGINALS_DIR, "README.md");
  await fs.writeFile(
    originalsReadme,
    [
      "# Creative bank originals",
      "",
      "This lane records source originals without mutating owner uploads or current runtime assets.",
      "For `MNT-SITE-VIS-006`, originals are referenced by `creative-bank-manifest.json` rather than bulk-copied, so the repo does not duplicate Telegram intake, idea-bank references, or public runtime files.",
      "Promotion into this folder should happen only when an asset is explicitly selected for Montelar production use and has rights notes.",
      "",
    ].join("\n"),
  );
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shortLabel(value, max = 38) {
  const base = path.basename(value);
  return base.length > max ? `${base.slice(0, max - 3)}...` : base;
}

function contactSheetCandidates(items, limit = 36) {
  const byCategory = new Map();
  for (const item of items.filter((asset) => asset.kind !== "video")) {
    const group = byCategory.get(item.category) || [];
    group.push(item);
    byCategory.set(item.category, group);
  }

  const buckets = [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, group]) => group.sort((a, b) => a.source_path.localeCompare(b.source_path)));
  const selected = [];
  while (selected.length < limit && buckets.some((bucket) => bucket.length)) {
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (next) selected.push(next);
      if (selected.length >= limit) break;
    }
  }
  return selected;
}

async function renderTile(asset) {
  const width = 210;
  const imageHeight = 132;
  const labelHeight = 58;
  const height = imageHeight + labelHeight;
  const label = xmlEscape(shortLabel(asset.source_path));
  const meta = xmlEscape(`${asset.category} / ${asset.usage}`);
  const background = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="10" fill="#15120f" stroke="#4a3828"/>
      <rect x="1" y="1" width="${width - 2}" height="${imageHeight - 2}" rx="9" fill="#090806"/>
      <text x="10" y="${imageHeight + 22}" font-family="Arial, sans-serif" font-size="12" fill="#f4ead7">${label}</text>
      <text x="10" y="${imageHeight + 43}" font-family="Arial, sans-serif" font-size="10" fill="#b9a98d">${meta}</text>
    </svg>
  `);

  try {
    const { data, info } = await sharp(asset.abs_path, { animated: false, limitInputPixels: false })
      .rotate()
      .resize({ width: width - 20, height: imageHeight - 20, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });
    return await sharp(background)
      .composite([
        {
          input: data,
          left: Math.round((width - info.width) / 2),
          top: Math.round((imageHeight - info.height) / 2),
        },
      ])
      .png()
      .toBuffer();
  } catch {
    return background;
  }
}

async function renderContactSheet({ key, title, description, assets }) {
  const fileName = `${key}-contact-sheet.png`;
  const outPath = path.join(CONTACT_SHEET_DIR, fileName);
  const selected = contactSheetCandidates(assets);
  const columns = 6;
  const tileWidth = 210;
  const tileHeight = 190;
  const gap = 16;
  const pad = 24;
  const headerHeight = 84;
  const rows = Math.max(1, Math.ceil(selected.length / columns));
  const width = pad * 2 + columns * tileWidth + (columns - 1) * gap;
  const height = headerHeight + pad + rows * tileHeight + Math.max(0, rows - 1) * gap + pad;
  const subtitle = selected.length
    ? `${selected.length} representative assets / total lane count ${assets.length}`
    : `No visual assets currently detected in this lane / total lane count ${assets.length}`;

  const base = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0d0b09"/>
      <text x="${pad}" y="34" font-family="Arial, sans-serif" font-size="22" fill="#f5ead8">${xmlEscape(title)}</text>
      <text x="${pad}" y="58" font-family="Arial, sans-serif" font-size="12" fill="#c8b99c">${xmlEscape(description)}</text>
      <text x="${pad}" y="76" font-family="Arial, sans-serif" font-size="11" fill="#9d8c72">${xmlEscape(subtitle)}</text>
    </svg>
  `);
  const composites = [];

  if (selected.length) {
    const tiles = await Promise.all(selected.map((asset) => renderTile(asset)));
    tiles.forEach((tile, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      composites.push({
        input: tile,
        left: pad + col * (tileWidth + gap),
        top: headerHeight + pad + row * (tileHeight + gap),
      });
    });
  }

  await sharp(base).composite(composites).png({ compressionLevel: 9 }).toFile(outPath);
  const stat = await fs.stat(outPath);
  return {
    key,
    title,
    description,
    path: relFromRoot(outPath),
    assets_shown: selected.length,
    lane_count: assets.length,
    bytes: stat.size,
  };
}

async function writeContactSheetIndex(contactSheets) {
  const indexPath = path.join(CONTACT_SHEET_DIR, "thumbnail-index.md");
  const rows = contactSheets
    .map((sheet) => `| ${sheet.title} | ${sheet.assets_shown}/${sheet.lane_count} | [${path.basename(sheet.path)}](${path.basename(sheet.path)}) |`)
    .join("\n");
  await fs.writeFile(
    indexPath,
    [
      "# MNT-SITE-VIS-006 - Creative Bank Thumbnail Index",
      "",
      "Generated by `scripts/creative-bank-normalize.mjs`.",
      "",
      "These contact sheets make creative-bank lanes visually reviewable without promoting or mutating source originals.",
      "",
      "| Sheet | Assets shown | File |",
      "|---|---:|---|",
      rows,
      "",
    ].join("\n"),
  );
  return relFromRoot(indexPath);
}

async function generateContactSheets(assets) {
  await fs.rm(CONTACT_SHEET_DIR, { recursive: true, force: true });
  await fs.mkdir(CONTACT_SHEET_DIR, { recursive: true });

  const definitions = [
    {
      key: "current-site-assets",
      title: "Current Site Assets",
      description: "Assets currently referenced by apps/web source files.",
      assets: assets.filter((asset) => asset.usage === "current_site_in_use"),
    },
    {
      key: "logo-lane",
      title: "Logo Lane",
      description: "Transparent and runtime logo candidates requiring separate brand review.",
      assets: assets.filter((asset) => asset.category === "logos"),
    },
    {
      key: "candidate-lane",
      title: "Candidate Lane",
      description: "Generated or intake candidates that need Montelar scorecards before approval.",
      assets: assets.filter((asset) => asset.usage === "candidate_needs_review"),
    },
    {
      key: "approved-lane",
      title: "Approved Lane",
      description: "Assets already placed in the governed approved folder.",
      assets: assets.filter((asset) => asset.usage === "approved_bank"),
    },
    {
      key: "rejected-bad-photo-lane",
      title: "Rejected / Bad Photo Lane",
      description: "Rejected anti-patterns and metadata-warning images forbidden for public use.",
      assets: assets.filter((asset) => asset.usage === "rejected_do_not_use" || asset.quality?.includes("metadata_warning")),
    },
    {
      key: "product-source-lane",
      title: "Product Source Lane",
      description: "Owner/supplier document extracts and previews for product truth, rights pending.",
      assets: assets.filter((asset) => asset.usage === "product_source_reference"),
    },
    {
      key: "reference-only-lane",
      title: "Reference Only Lane",
      description: "Idea-bank and competitor references; never publish directly as Montelar media.",
      assets: assets.filter((asset) => asset.usage === "reference_only"),
    },
  ];

  const contactSheets = [];
  for (const definition of definitions) {
    contactSheets.push(await renderContactSheet(definition));
  }
  const thumbnailIndex = await writeContactSheetIndex(contactSheets);
  return { thumbnail_index: thumbnailIndex, sheets: contactSheets };
}

async function main() {
  await ensureBankFolders();
  const usedPublicAssets = await collectUsedPublicAssets();
  const assets = [];
  const seen = new Set();

  for (const root of SOURCE_ROOTS) {
    const files = await walk(root.base);
    for (const absPath of files) {
      const ext = path.extname(absPath).toLowerCase();
      const stat = await fs.stat(absPath);
      const digest = await sha256(absPath);
      const sourcePath = relFromRoot(absPath);
      const dedupeKey = `${digest}:${sourcePath}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const kind = kindFor(ext);
      const meta = await mediaMeta(absPath, ext);
      const category = categoryFor(sourcePath);
      const publicRefs = usedPublicAssets.get(absPath) || [];
      const usage = usageFor(root, category, publicRefs.length > 0);
      const publicationStatus = publicationStatusFor({ root, usage, sourcePath });
      const asset = {
        id: `mnt-asset-${digest.slice(0, 16)}`,
        source_path: sourcePath,
        abs_path: absPath,
        origin_key: root.key,
        origin: root.label,
        external_source: Boolean(root.external),
        ext,
        kind,
        bytes: stat.size,
        sha256: digest,
        category,
        usage,
        publication_status: publicationStatus,
        publication_allowed: publicationAllowedFor(publicationStatus),
        usage_notes: usageNotesFor(publicationStatus),
        quality: null,
        rights_notes: root.rights,
        recommended_crop: cropFor(category, meta),
        used_by: publicRefs,
        source_metadata: await nearestIdeaBankMetadata(absPath),
        lineage: await lineageFor({ absPath, sourcePath, status: publicationStatus }),
        legal_gate: {
          task: "MNT-SITE-VIS-030",
          raw_reference_publication_forbidden: !publicationAllowedFor(publicationStatus),
          flow_nano_veo_lineage_required: requiresLineageFor(publicationStatus, sourcePath),
        },
        ...meta,
      };
      asset.quality = qualityFor(asset, meta);
      assets.push(asset);
    }
  }

  assets.sort((a, b) => a.source_path.localeCompare(b.source_path));

  const optimized = [];
  for (const asset of assets) {
    const result = await optimizeAsset(asset);
    if (result) {
      asset.optimized_derivative = result;
      optimized.push({ asset_id: asset.id, source_path: asset.source_path, ...result });
    }
  }

  const uniqueOptimizedPaths = [...new Set(optimized.filter((item) => item.path).map((item) => item.path))];
  const contactSheets = await generateContactSheets(assets);

  const duplicateGroups = Object.entries(
    assets.reduce((acc, asset) => {
      acc[asset.sha256] ||= [];
      acc[asset.sha256].push(asset.id);
      return acc;
    }, {}),
  )
    .filter(([, ids]) => ids.length > 1)
    .map(([sha, ids]) => ({ sha256: sha, asset_ids: ids }));

  const categories = {};
  const usage = {};
  const publication = {};
  const origins = {};
  for (const asset of assets) {
    categories[asset.category] = (categories[asset.category] || 0) + 1;
    usage[asset.usage] = (usage[asset.usage] || 0) + 1;
    publication[asset.publication_status] = (publication[asset.publication_status] || 0) + 1;
    origins[asset.origin_key] = (origins[asset.origin_key] || 0) + 1;
    delete asset.abs_path;
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    task: "MNT-SITE-VIS-006/MNT-SITE-VIS-030",
    legal_gate: {
      task: "MNT-SITE-VIS-030",
      rule: "Only approved/current governed assets may be published directly. Owner intake, supplier/document, Pinterest/reference, legacy, rejected and generated candidates stay blocked until promoted with rights and lineage notes.",
      public_allowed_statuses: ["approved", "current_runtime_governed"],
      exploded_speaker_reference: {
        path: EXPLODED_SPEAKER_REFERENCE,
        usage: "prompt_motion_reference_only",
        publication_status: "reference_only",
        public_use: "forbidden_until_regenerated_or_owner_approved",
      },
    },
    bank_root: relFromRoot(BANK_DIR),
    folder_contract: {
      originals: relFromRoot(ORIGINALS_DIR),
      optimized: relFromRoot(OPTIMIZED_DIR),
      approved: relFromRoot(path.join(BANK_DIR, "approved")),
      rejected: relFromRoot(path.join(BANK_DIR, "rejected")),
    },
    contact_sheets: contactSheets,
    counts: {
      assets: assets.length,
      optimized_derivatives: uniqueOptimizedPaths.length,
      optimized_asset_links: optimized.length,
      duplicate_groups: duplicateGroups.length,
    },
    categories,
    usage,
    publication,
    origins,
    current_site_assets: assets.filter((asset) => asset.usage === "current_site_in_use").map((asset) => ({
      id: asset.id,
      source_path: asset.source_path,
      category: asset.category,
      publication_status: asset.publication_status,
      publication_allowed: asset.publication_allowed,
      bytes: asset.bytes,
      used_by: asset.used_by,
      optimized_derivative: asset.optimized_derivative || null,
    })),
    bad_or_rejected_assets: assets.filter((asset) => asset.usage === "rejected_do_not_use" || asset.quality.includes("metadata_warning")).map((asset) => ({
      id: asset.id,
      source_path: asset.source_path,
      usage: asset.usage,
      publication_status: asset.publication_status,
      quality: asset.quality,
      rights_notes: asset.rights_notes,
    })),
    blocked_publication_assets: assets.filter((asset) => !asset.publication_allowed).map((asset) => ({
      id: asset.id,
      source_path: asset.source_path,
      usage: asset.usage,
      publication_status: asset.publication_status,
      used_by: asset.used_by,
      lineage_status: asset.lineage.status,
    })),
    lineage_missing_assets: assets.filter((asset) => asset.lineage.status === "lineage_missing").map((asset) => ({
      id: asset.id,
      source_path: asset.source_path,
      usage: asset.usage,
      publication_status: asset.publication_status,
    })),
    duplicate_groups: duplicateGroups,
    optimized,
    assets,
  };

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(REPORT_PATH, renderReport(manifest));

  console.log(
    JSON.stringify(
      {
        task: "MNT-SITE-VIS-006/MNT-SITE-VIS-030",
        assets: manifest.counts.assets,
        optimized_derivatives: manifest.counts.optimized_derivatives,
        duplicate_groups: manifest.counts.duplicate_groups,
        manifest: relFromRoot(MANIFEST_PATH),
        report: relFromRoot(REPORT_PATH),
      },
      null,
      2,
    ),
  );
}

function tableRows(object) {
  return Object.entries(object)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `| ${key} | ${count} |`)
    .join("\n");
}

function contactSheetRows(contactSheets) {
  return contactSheets.sheets
    .map((sheet) => `| ${sheet.title} | ${sheet.assets_shown}/${sheet.lane_count} | [${sheet.path}](${path.relative(path.dirname(REPORT_PATH), path.join(ROOT, sheet.path)).split(path.sep).join("/")}) |`)
    .join("\n");
}

function renderReport(manifest) {
  const optimizedMax = manifest.optimized.reduce((max, asset) => Math.max(max, asset.bytes || 0), 0);
  const heavy = manifest.assets
    .filter((asset) => asset.quality === "heavy_original_optimize_before_web")
    .slice(0, 20)
    .map((asset) => `- ${asset.source_path} (${Math.round(asset.bytes / 1024)} KB, ${asset.category})`)
    .join("\n") || "- None in first managed set.";

  const current = manifest.current_site_assets
    .map((asset) => `- ${asset.source_path} -> ${asset.optimized_derivative?.path || "no derivative"}`)
    .join("\n") || "- None detected.";
  const logos = manifest.assets
    .filter((asset) => asset.category === "logos")
    .slice(0, 24)
    .map((asset) => `- ${asset.source_path} (${asset.usage}, alpha=${asset.has_alpha ?? "unknown"})`)
    .join("\n") || "- None detected.";
  const rejected = manifest.bad_or_rejected_assets
    .map((asset) => `- ${asset.source_path} (${asset.usage}, ${asset.quality})`)
    .join("\n") || "- None detected.";

  return [
    "# MNT-SITE-VIS-006 - Creative Bank Normalization Report",
    "",
    `Generated: ${manifest.generated_at}`,
    "",
    "## Result",
    "",
    `- Manifest: \`${relFromRoot(MANIFEST_PATH)}\``,
    `- Assets indexed: ${manifest.counts.assets}`,
    `- Optimized derivatives: ${manifest.counts.optimized_derivatives}`,
    `- Largest optimized derivative: ${Math.round(optimizedMax / 1024)} KB`,
    `- Duplicate groups: ${manifest.counts.duplicate_groups}`,
    "- Originals were not bulk-copied; the manifest preserves original paths and hashes to avoid duplicating Telegram intake, idea-bank references and current runtime files.",
    "",
    "## Folder Contract",
    "",
    "| Lane | Path | Rule |",
    "|---|---|---|",
    `| originals | \`${manifest.folder_contract.originals}\` | Source-preserving lane; promote only selected rights-reviewed files. |`,
    `| optimized | \`${manifest.folder_contract.optimized}\` | Web derivatives generated from safe project/product-source subset. |`,
    `| approved | \`${manifest.folder_contract.approved}\` | Only assets with scorecard/rights approval. |`,
    `| rejected | \`${manifest.folder_contract.rejected}\` | Anti-patterns and bad photos; public usage forbidden. |`,
    "",
    "## Categories",
    "",
    "| Category | Count |",
    "|---|---:|",
    tableRows(manifest.categories),
    "",
    "## Usage Status",
    "",
    "| Usage | Count |",
    "|---|---:|",
    tableRows(manifest.usage),
    "",
    "## MNT-SITE-VIS-030 Publication Status",
    "",
    `- Legal gate: \`${manifest.legal_gate.rule}\``,
    `- Exploded speaker reference: \`${manifest.legal_gate.exploded_speaker_reference.path}\` -> ${manifest.legal_gate.exploded_speaker_reference.usage}; public use ${manifest.legal_gate.exploded_speaker_reference.public_use}.`,
    "",
    "| Publication status | Count |",
    "|---|---:|",
    tableRows(manifest.publication),
    "",
    "## Visual Review Contact Sheets",
    "",
    `- Thumbnail index: [${manifest.contact_sheets.thumbnail_index}](${path.relative(path.dirname(REPORT_PATH), path.join(ROOT, manifest.contact_sheets.thumbnail_index)).split(path.sep).join("/")})`,
    "- These sheets expose current-site, logo, candidate, approved, rejected/bad-photo, product-source and reference-only lanes for visual review without promoting assets.",
    "",
    "| Sheet | Assets shown / lane count | File |",
    "|---|---:|---|",
    contactSheetRows(manifest.contact_sheets),
    "",
    "## Current Site Assets",
    "",
    current,
    "",
    "## Logo Lane",
    "",
    logos,
    "",
    "## Rejected / Bad Photo Lane",
    "",
    rejected,
    "",
    "## Heavy Originals To Avoid As Direct Web Media",
    "",
    heavy,
    "",
    "## Rights Notes",
    "",
    "- `idea_bank_reference` is reference-only and cannot be published as Montelar media.",
    "- `telegram_intake` remains external/pending until the owner selects files and rights are recorded.",
    "- `product_extracted_media` and `product_preview_media` are supplier/document sources; use for research and product truth until publication rights are confirmed.",
    "- `visual_bank_candidate` needs the Montelar scorecard before approval.",
    "- `current_site_in_use` records runtime assets already referenced by code; replacement decisions should happen in later visual tasks, not this normalization pass.",
    "- Generated/Flow/Nano/Veo-like files need prompt/source/candidate lineage before promotion.",
    "- Only `approved` and `current_runtime_governed` publication statuses are allowed for direct public usage by this gate.",
    "",
    "## Verification",
    "",
    "- Re-run with `node scripts/creative-bank-normalize.mjs`.",
    "- Check folders with `find docs/strategy/artifacts/visual-bank -maxdepth 2 -type d | sort`.",
    "- Check current-site mapping from `creative-bank-manifest.json.current_site_assets`.",
    "",
  ].join("\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
