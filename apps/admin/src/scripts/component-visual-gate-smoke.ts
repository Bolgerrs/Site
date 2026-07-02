import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { getComponentVisualGateSnapshot } from "../lib/admin-bff/component-visual-gate.ts";
import {
  executeChecksRepairAction,
  getChecksWorkspaceSnapshot,
} from "../lib/payload/checks-workspace.ts";
import { syncPublicCmsBaseline } from "../lib/payload/public-cms-baseline.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const repoRoot = path.resolve(appRoot, "../..");
const databasePath = path.resolve(appRoot, ".tmp", "payload-component-visual-gate-smoke.db");
const artifactDir = path.resolve(repoRoot, "docs/strategy/artifacts/MNT-ADMIN-BFF-010E");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${databasePath}`;
}

function ownerReq(payload: Awaited<ReturnType<typeof getPayload>>) {
  return {
    payload,
    user: {
      role: "owner",
    },
  } as never;
}

function markdownReport(snapshot: Awaited<ReturnType<typeof getComponentVisualGateSnapshot>>) {
  const rows = snapshot.modules
    .map(
      (module) =>
        `| ${module.id} | ${module.layer} | ${module.settingState} | ${module.coverage.editableNow} | ${
          module.coverage.plannedCommands + module.coverage.notCmsBacked
        } | ${module.routePaths.join(", ")} |`,
    )
    .join("\n");
  const issueRows = snapshot.issues
    .slice(0, 20)
    .map(
      (issue) =>
        `| ${issue.moduleId} | ${issue.fieldPath} | ${issue.routePath ?? "-"} | ${issue.targetLayer} | ${issue.editorHref} | ${issue.severity} |`,
    )
    .join("\n");

  return `# MNT-ADMIN-BFF-010E Component Visual Gate

Generated: ${snapshot.generatedAt}

## Summary

- Modules: ${snapshot.summary.modules}
- Fully editable now: ${snapshot.summary.fullyEditableNow}
- Open gate signals: ${snapshot.summary.issues}
- Routes mapped: ${snapshot.summary.routes}

## Modules

| Module | Layer | Settings state | Editable now | Later wiring | Routes |
|---|---|---|---:|---:|---|
${rows}

## Issue Mapping

| Module | Field | Page | Target layer | Editor target | Severity |
|---|---|---|---|---|---|
${issueRows || "| - | - | - | - | - | - |"}

## Required Screenshot Evidence

${snapshot.publicEvidenceTargets.map((target) => `- ${target.id}: ${target.label} (${target.routePath})`).join("\n")}
`;
}

async function main() {
  await mkdir(path.dirname(databasePath), { recursive: true });
  await mkdir(artifactDir, { recursive: true });

  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await syncPublicCmsBaseline(payload);

    const req = ownerReq(payload);
    const snapshot = await getComponentVisualGateSnapshot(payload, req, { locale: "ru" });
    const moduleIds = new Set(snapshot.modules.map((module) => module.id));

    assert.equal(snapshot.textFailures.length, 0, `Owner text should stay clean: ${snapshot.textFailures.join(", ")}`);
    assert.ok(moduleIds.has("homepage.hero-product-scene"), "Homepage hero scene must be mapped.");
    assert.ok(moduleIds.has("global.header-desktop"), "Desktop header must be mapped.");
    assert.ok(moduleIds.has("global.products-mega-menu"), "Products menu must be mapped.");
    assert.ok(moduleIds.has("global.mobile-menu-language-logo"), "Mobile menu/language/logo must be mapped.");
    assert.ok(moduleIds.has("routes.banner-media-crops"), "Shared secondary route banner must be mapped.");
    assert.equal(snapshot.publicEvidenceTargets.length, 4, "Gate must name the required public screenshot targets.");
    assert.ok(
      snapshot.modules.every((module) => module.editorTargets.length > 0),
      "Every mapped module needs at least one editor target.",
    );
    assert.ok(
      snapshot.issues.every(
        (issue) => issue.moduleId && issue.fieldPath && issue.editorHref.startsWith("/admin/"),
      ),
      "Every gate issue must map to exact module, field and guided editor target.",
    );
    assert.ok(
      snapshot.issues.some(
        (issue) =>
          issue.moduleId === "homepage.hero-product-scene" &&
          issue.fieldPath === "heroScene.mediaAndCrop" &&
          issue.reason.includes("desktop изображение"),
      ),
      "Hero scene media validation must point to the media/crop guided target.",
    );
    assert.ok(
      snapshot.issues.some(
        (issue) =>
          issue.moduleId === "homepage.hero-product-scene" &&
          issue.fieldPath === "heroScene.hotspots" &&
          (issue.reason.includes("товар для зоны") || issue.reason.includes("категорию для зоны")),
      ),
      "Hero scene hotspot validation must point to the hotspot guided target.",
    );
    assert.ok(
      snapshot.issues.every(
        (issue) =>
          issue.moduleId !== "homepage.hero-product-scene" ||
          !issue.reason.includes("зоны") ||
          issue.fieldPath !== "heroSummary",
      ),
      "Hero scene validation must not fall back to homepage heroSummary.",
    );

    const checks = await getChecksWorkspaceSnapshot(payload, req, { check: "custom-module-settings" });
    const componentCheck = checks.checks.find((check) => check.id === "custom-module-settings");
    assert.ok(componentCheck, "Checks workspace must expose the custom visual block gate.");
    assert.equal(checks.activeCheck, "custom-module-settings");
    assert.ok(
      componentCheck.issues.some(
        (issue) =>
          issue.id.includes("homepage.hero-product-scene:validation") &&
          issue.actions.some((action) => action.target.fieldPath === "heroScene.hotspots"),
      ),
      "Checks workspace must preserve exact hero scene hotspot repair targets.",
    );

    if (componentCheck.issues[0]) {
      const repair = await executeChecksRepairAction(payload, req, {
        actionId: componentCheck.issues[0].actions[0]?.id ?? null,
        checkId: "custom-module-settings",
        issueId: componentCheck.issues[0].id,
      });
      assert.equal(repair.commandContract, "open-guided-editor-target");
      assert.ok(repair.targetHref.startsWith("/admin/"), "Repair target must stay inside guided admin surfaces.");
    }

    await writeFile(
      path.join(artifactDir, "component-visual-gate.json"),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8",
    );
    await writeFile(path.join(artifactDir, "component-visual-gate.md"), markdownReport(snapshot), "utf8");
    await writeFile(
      path.join(artifactDir, "component-visual-gate-text-snapshot.txt"),
      snapshot.modules.map((module) => module.label).join("\n") + "\n",
      "utf8",
    );

    console.log("component-visual-gate-smoke: ok");
  } finally {
    await payload.db.destroy?.();
    await rm(databasePath, { force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
