import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import {
  executePublishHistoryCommand,
  getPublishHistorySnapshot,
} from "../lib/admin-bff/publish-history.ts";
import { syncPublicCmsBaseline } from "../lib/payload/public-cms-baseline.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-publish-history-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function getRecordId(record: Record<string, unknown>) {
  const id = record.id;
  assert.ok(typeof id === "number" || typeof id === "string", "record id should exist");
  return id;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });
  const req = {
    payload,
    user: {
      email: "owner@example.com",
      fullName: "Owner",
      id: "owner-smoke",
      role: "owner",
    },
  } as never;

  try {
    await syncPublicCmsBaseline(payload);

    const page = (
      await payload.find({
        collection: "pages",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          pageFamily: {
            equals: "home",
          },
        },
      })
    ).docs[0] as unknown as Record<string, unknown>;
    const pageId = getRecordId(page);
    await payload.update({
      collection: "pages",
      data: {
        approvalStatus: "approved",
        heroSummary: "Publish history smoke draft summary.",
        status: "review",
      },
      depth: 0,
      id: pageId,
      overrideAccess: true,
      req,
    });

    const pageSnapshot = await getPublishHistorySnapshot(payload, req, {
      targetId: pageId,
      targetType: "page",
    });
    assert.equal(pageSnapshot.selectedTarget?.targetType, "page");
    assert.equal(pageSnapshot.plan.status, "clear");
    assert.ok(pageSnapshot.plan.steps.find((step) => step.id === "seo"));

    const pagePublish = await executePublishHistoryCommand(payload, req, {
      action: "publish.commit",
      payload: {
        targetId: pageId,
        targetType: "page",
      },
    });
    assert.equal(pagePublish.successMessage, "Published 1 target(s).");
    assert.ok(pagePublish.auditTrail.some((event) => event.action === "owner-publish-commit"));

    const pageHistory = await executePublishHistoryCommand(payload, req, {
      action: "history.list",
      payload: {
        targetId: pageId,
        targetType: "page",
      },
    });
    assert.ok(pageHistory.versions.length >= 1, "page history should expose Payload versions");
    const firstPageVersion = pageHistory.versions[0];
    assert.ok(firstPageVersion, "page history should expose first version");
    assert.ok(firstPageVersion.diff.length >= 1, "page history should include diff data");
    const pageVersionId = firstPageVersion.id;
    assert.ok(pageVersionId, "page history should expose a restorable version id");

    const pageCompare = await executePublishHistoryCommand(payload, req, {
      action: "history.compare",
      payload: {
        targetId: pageId,
        targetType: "page",
        versionId: pageVersionId,
      },
    });
    assert.ok(pageCompare.compare, "compare command should return compare data when versions exist");

    await executePublishHistoryCommand(payload, req, {
      action: "history.restore",
      payload: {
        targetId: pageId,
        targetType: "page",
        versionId: pageVersionId,
      },
    });

    const product = (
      await payload.find({
        collection: "products",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          slug: {
            equals: "vision-max-premium",
          },
        },
      })
    ).docs[0] as unknown as Record<string, unknown>;
    const productId = getRecordId(product);
    const productPlan = await executePublishHistoryCommand(payload, req, {
      action: "publish.plan",
      payload: {
        targetId: productId,
        targetType: "product",
      },
    });
    assert.equal(productPlan.selectedTarget?.targetType, "product");
    assert.equal(productPlan.plan.status, "clear");

    const settings = (
      await payload.find({
        collection: "site-settings",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
      })
    ).docs[0] as unknown as Record<string, unknown>;
    const settingsId = getRecordId(settings);
    await payload.update({
      collection: "site-settings",
      data: {
        contactPrimaryHref: "/contact",
        contactPrimaryLabel: "Publish history smoke contact",
        status: "review",
      },
      depth: 0,
      id: settingsId,
      overrideAccess: true,
      req,
    });
    const settingsPublish = await executePublishHistoryCommand(payload, req, {
      action: "publish.commit",
      payload: {
        targetId: settingsId,
        targetType: "settings",
      },
    });
    assert.equal(settingsPublish.selectedTarget?.targetType, "settings");
    assert.equal(settingsPublish.plan.status, "clear");
    assert.ok(settingsPublish.revalidation.paths.includes("/"));

    const auditEvents = await payload.find({
      collection: "audit-events",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "-happenedAt",
    });
    assert.ok(
      auditEvents.docs.some((event) => event.action === "owner-version-restore"),
      "restore command should write an audit event",
    );
    assert.ok(
      auditEvents.docs.some((event) => event.action === "owner-publish-commit"),
      "publish command should write an audit event",
    );

    console.log("publish-history-smoke: ok");
  } finally {
    await payload.db.destroy?.();
    await rm(localSmokeDatabasePath, { force: true });
    await rm(`${localSmokeDatabasePath}-journal`, { force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
