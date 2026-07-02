import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const guardedFiles = [
  "src/components/admin-shell/MontelarAdminDashboard.tsx",
  "src/components/admin-shell/MontelarLeadsInbox.tsx",
  "src/components/admin-shell/MontelarMediaWorkspace.tsx",
  "src/components/admin-shell/MontelarOwnerSettingsWorkspace.tsx",
  "src/components/admin-shell/MontelarProductsWorkspace.tsx",
  "src/components/admin-shell/MontelarSiteAdminWorkspace.tsx",
  "src/components/admin-shell/MontelarSiteWorkspace.tsx",
  "src/components/admin-shell/MontelarTranslationsWorkspace.tsx",
  "src/components/category-editor/CategoryEditorWorkspaceField.tsx",
  "src/components/forms-editor/FormsEditorWorkspaceField.tsx",
  "src/components/page-editor/PageEditorWorkspaceField.tsx",
  "src/components/product-editor/ProductEditorWorkspaceField.tsx",
  "src/lib/payload/admin-dashboard.ts",
  "src/lib/payload/category-editor.ts",
  "src/lib/payload/checks-workspace.ts",
  "src/lib/payload/forms-editor.ts",
  "src/lib/payload/media-workspace.ts",
  "src/lib/payload/owner-products.ts",
  "src/lib/payload/owner-settings-workspace.ts",
  "src/lib/payload/owner-site-block.ts",
  "src/lib/payload/page-editor.ts",
  "src/lib/payload/product-editor.ts",
  "src/lib/payload/site-admin-workspace.ts",
  "src/lib/payload/site-workspace.ts",
  "src/lib/payload/translations-workspace.ts",
] as const;

const directRawHrefPattern = /\/admin\/collections(?:\/|(?=["'`?#]))/g;

function scanFile(path: string) {
  const content = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  const matches = [...content.matchAll(directRawHrefPattern)];

  if (matches.length === 0) {
    return [];
  }

  return matches.map((match) => {
    const offset = match.index ?? 0;
    const line = content.slice(0, offset).split("\n").length;
    return `${path}:${line}`;
  });
}

function run() {
  const hits = guardedFiles.flatMap(scanFile);

  assert.equal(
    hits.length,
    0,
    `raw-layer-scan: direct /admin/collections leak(s) in guarded owner/site-admin files:\n${hits.join("\n")}`,
  );

  console.log("raw-layer-scan: ok");
}

run();
