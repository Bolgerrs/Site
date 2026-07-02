import assert from "node:assert/strict";

import {
  type AdminDashboardSnapshot,
  getAdminDashboardSnapshot,
  getVisibleAdminDashboardQuickActions,
  getVisibleAdminDashboardWidgets,
} from "../lib/payload/admin-dashboard.ts";
import { getAdminDashboardBffSnapshot } from "../lib/admin-bff/dashboard.ts";
import { isRawAdminHref } from "../lib/admin-bff/raw-layer.ts";

async function main() {
  const counts = {
    blockedForms: 2,
    blockedPages: 3,
    blockedProducts: 4,
    blockedSeo: 1,
    creativeApprovals: 5,
    mediaRights: 4,
    newLeads: 7,
    overdueFollowups: 2,
    staleTranslations: 6,
    todayForms: 2,
    todayPages: 5,
    todayProducts: 4,
    todayTranslations: 3,
  } as const;

  const recentLeads = [
    {
      createdAt: "2026-05-11T10:25:00.000Z",
      email: "owner@montelar.test",
      fullName: "Анна Орлова",
      id: "lead-1",
      productLabelSnapshot: "Vision MAX Premium",
      status: "new",
    },
    {
      companyName: "Atelier Lumiere",
      createdAt: "2026-05-11T09:10:00.000Z",
      id: "lead-2",
      sourceChannel: "dealer-page",
      status: "reviewed",
      title: "Запрос по дилерству",
    },
  ] as const;

  const latestPages = [
    {
      id: "page-home",
      routePath: "/",
      status: "review",
      title: "Главная",
      updatedAt: "2026-05-11T11:45:00.000Z",
    },
  ] as const;

  const latestProducts = [
    {
      id: "product-1",
      name: "Vision MAX Premium",
      status: "draft",
      updatedAt: "2026-05-11T11:20:00.000Z",
    },
  ] as const;

  const latestForms = [
    {
      formTitle: "Форма Vision MAX",
      id: "form-1",
      status: "review",
      updatedAt: "2026-05-11T10:40:00.000Z",
    },
  ] as const;

  const latestTranslations = [
    {
      id: "translation-1",
      ownerCollection: "pages",
      ownerLabelSnapshot: "Главная / EN",
      status: "review",
      updatedAt: "2026-05-11T10:10:00.000Z",
    },
  ] as const;

  const payload = {
    find: async ({
      collection,
      pagination,
      sort,
      where,
    }: {
      collection: string;
      pagination?: boolean;
      sort?: string;
      where?: Record<string, unknown>;
    }) => {
      const serializedWhere = JSON.stringify(where);

      if (collection === "leads" && pagination === false && sort === "-createdAt") {
        return { docs: recentLeads };
      }

      if (collection === "leads" && serializedWhere.includes('"status":{"equals":"new"}')) {
        return { totalDocs: counts.newLeads };
      }

      if (collection === "leads" && serializedWhere.includes('"nextActionAt":{"less_than"')) {
        return { totalDocs: counts.overdueFollowups };
      }

      if (collection === "pages") {
        if (pagination === false && sort === "-updatedAt") {
          return { docs: latestPages };
        }

        if (serializedWhere.includes('"status":{"in":["draft","review"]}')) {
          return { totalDocs: counts.blockedPages + 1 };
        }

        if (serializedWhere.includes('"updatedAt":{"greater_than_equal"')) {
          return { totalDocs: counts.todayPages };
        }

        return { totalDocs: counts.blockedPages };
      }

      if (collection === "products") {
        if (pagination === false && sort === "-updatedAt") {
          return { docs: latestProducts };
        }

        if (serializedWhere.includes('"status":{"in":["draft","review"]}')) {
          return { totalDocs: counts.blockedProducts + 1 };
        }

        if (serializedWhere.includes('"updatedAt":{"greater_than_equal"')) {
          return { totalDocs: counts.todayProducts };
        }

        return { totalDocs: counts.blockedProducts };
      }

      if (collection === "productInquiryForms") {
        if (pagination === false && sort === "-updatedAt") {
          return { docs: latestForms };
        }

        if (serializedWhere.includes('"status":{"in":["draft","review"]}')) {
          return { totalDocs: counts.blockedForms + 1 };
        }

        if (serializedWhere.includes('"updatedAt":{"greater_than_equal"')) {
          return { totalDocs: counts.todayForms };
        }

        return { totalDocs: counts.blockedForms };
      }

      if (collection === "seo-entries") {
        return { totalDocs: counts.blockedSeo };
      }

      if (collection === "translations") {
        if (pagination === false && sort === "-updatedAt") {
          return { docs: latestTranslations };
        }

        if (serializedWhere.includes('"updatedAt":{"greater_than_equal"')) {
          return { totalDocs: counts.todayTranslations };
        }

        return { totalDocs: counts.staleTranslations };
      }

      if (collection === "media-assets" && serializedWhere.includes('"creativeReviewRequired":{"equals":true}')) {
        return { totalDocs: counts.creativeApprovals };
      }

      if (collection === "media-assets") {
        return { totalDocs: counts.mediaRights };
      }

      throw new Error(`Unexpected dashboard query for collection ${collection}.`);
    },
  } as unknown as Parameters<typeof getAdminDashboardSnapshot>[0];

  const snapshot: AdminDashboardSnapshot = await getAdminDashboardSnapshot(payload);
  const bffSnapshot = await getAdminDashboardBffSnapshot(payload, {
    role: "owner",
    routePath: "/admin",
    userId: "owner-fixture",
  });
  const byId = new Map(snapshot.widgets.map((widget) => [widget.id, widget]));

  assert.equal(snapshot.widgets.length, 6, "Dashboard should expose six operational widgets.");
  assert.equal(snapshot.latestLeads.length, recentLeads.length, "Dashboard should expose recent leads.");
  assert.ok(snapshot.latestChanges.length >= 4, "Dashboard should expose a recent changes feed.");
  assert.equal(snapshot.statusCards.length, 3, "Dashboard should expose three owner-facing status cards.");
  assert.equal(snapshot.releaseActions.length, 3, "Dashboard should expose preview and release actions.");
  assert.equal(snapshot.healthItems.length, 3, "Dashboard should expose simple health items.");

  for (const widget of snapshot.widgets) {
    assert.ok(widget.count >= 0, `${widget.id} should never return a negative count.`);
    assert.ok(widget.actions.length >= 1, `${widget.id} should provide at least one drill-down link.`);

    for (const action of widget.actions) {
      assert.ok(
        action.href.startsWith("/admin/collections/") ||
          action.href.startsWith("/admin/site") ||
          action.href.startsWith("/admin/products") ||
          action.href.startsWith("/admin/checks") ||
          action.href.startsWith("/admin/translations") ||
          action.href.startsWith("/admin/leads") ||
          action.href.startsWith("/admin/media"),
        `${widget.id} action ${action.label} must link into an admin workspace.`,
      );
    }
  }

  assert.equal(byId.get("new-leads")?.count, counts.newLeads);
  assert.equal(
    byId.get("blocked-publishes")?.count,
    counts.blockedPages + counts.blockedProducts + counts.blockedForms + counts.blockedSeo,
  );
  assert.equal(byId.get("media-rights")?.count, counts.mediaRights);
  assert.equal(byId.get("creative-approvals")?.count, counts.creativeApprovals);
  assert.deepEqual(
    getVisibleAdminDashboardWidgets("lead-manager", snapshot.widgets).map((widget) => widget.id),
    ["new-leads", "overdue-followups"],
    "Lead Manager should only see lead queues.",
  );
  assert.deepEqual(
    getVisibleAdminDashboardWidgets("translator", snapshot.widgets).map((widget) => widget.id),
    ["stale-translations"],
    "Translator should only see translation backlog.",
  );
  assert.ok(
    getVisibleAdminDashboardWidgets("owner", snapshot.widgets).some(
      (widget) => widget.id === "blocked-publishes",
    ),
    "Owner should see publishing blockers.",
  );
  assert.ok(
    getVisibleAdminDashboardWidgets("admin", snapshot.widgets).some(
      (widget) => widget.id === "media-rights",
    ),
    "Admin should see cross-workspace media governance queue.",
  );
  assert.ok(
    byId.get("blocked-publishes")?.actions.some((action) => action.label === "SEO"),
    "Blocked publishes should drill into SEO as one of the publish queues.",
  );
  assert.ok(
    byId.get("blocked-publishes")?.actions.some((action) => action.label === "Продукты"),
    "Blocked publishes should drill into products as one of the publish queues.",
  );

  const ownerQuickActions = getVisibleAdminDashboardQuickActions("owner", snapshot.widgets);
  const leadQuickActions = getVisibleAdminDashboardQuickActions("lead-manager", snapshot.widgets);
  const translatorQuickActions = getVisibleAdminDashboardQuickActions("translator", snapshot.widgets);

  assert.ok(
    ownerQuickActions.some((action) => action.id === "homepage"),
    "Owner should get a direct homepage quick action.",
  );
  assert.ok(
    ownerQuickActions.some((action) => action.id === "page-edit"),
    "Owner should get a direct page-edit quick action.",
  );
  assert.ok(
    ownerQuickActions.some((action) => action.id === "products-catalog"),
    "Owner should get a direct existing-products quick action.",
  );
  assert.ok(
    ownerQuickActions.some((action) => action.id === "product-create"),
    "Owner should get a direct add-product quick action.",
  );
  assert.deepEqual(
    leadQuickActions.map((action) => action.id),
    ["leads"],
    "Lead manager should only get the leads quick action.",
  );
  assert.equal(
    leadQuickActions[0]?.href,
    "/admin/leads?filter=overdue",
    "Lead quick action should prioritize overdue follow-up when present.",
  );
  assert.equal(
    leadQuickActions[0]?.value,
    "2 overdue · 7 new",
    "Lead quick action should surface overdue and new counts together.",
  );
  assert.deepEqual(
    translatorQuickActions.map((action) => action.id),
    ["translations"],
    "Translator should only get the translations quick action.",
  );
  assert.equal(
    snapshot.statusCards.find((card) => card.id === "drafts")?.value,
    "12 черновиков",
    "Draft status card should combine draft/review work across pages, products and forms.",
  );
  assert.ok(
    snapshot.releaseActions.some((action) => action.id === "site-preview"),
    "Dashboard should include a site preview action.",
  );
  assert.ok(
    snapshot.healthItems.some((item) => item.id === "publishing"),
    "Dashboard should include publishing health.",
  );
  assert.equal(bffSnapshot.workbench.id, "dashboard-workbench", "Dashboard BFF should attach a workbench DTO.");
  assert.equal(bffSnapshot.workbench.role, "owner", "Dashboard BFF should keep the authenticated role.");
  assert.ok(
    bffSnapshot.workbench.surfaces.some((surface) => surface.id === "site"),
    "Dashboard BFF should expose editable surfaces.",
  );
  assert.ok(
    bffSnapshot.workbench.actions.length >= bffSnapshot.workbench.surfaces.length,
    "Dashboard BFF should expose shared actions for shell/workbench consumers.",
  );
  assert.ok(
    !bffSnapshot.workbench.actions.some((action) => action.href && isRawAdminHref(action.href)),
    "Dashboard BFF actions must not expose direct raw collection hrefs.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
