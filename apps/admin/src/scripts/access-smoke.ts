import assert from "node:assert/strict";

import type { PayloadRequest } from "payload";

import { AdminUsers, assignBootstrapOwnerRole } from "../collections/AdminUsers.ts";
import { SystemMedia } from "../collections/SystemMedia.ts";
import {
  auditHistoryAccess,
  exportSensitiveAccess,
  getAdminUser,
  leadPiiAccess,
  publishingAccess,
} from "../lib/payload/access.ts";
import {
  applyAdminSurfaceProfile,
  getAdminCollectionSurface,
  getVisibleRawAdminCollections,
} from "../lib/payload/admin-surfaces.ts";
import {
  getAdminNavigationContext,
  getPrimaryAdminWorkspace,
  resolveAdminWorkspaceIdFromPath,
} from "../lib/payload/admin-shell.ts";

function createReq(user: unknown) {
  return { user } as PayloadRequest;
}

function createHookReq(totalDocs: number) {
  return {
    payload: {
      count: async () => ({
        totalDocs,
      }),
    },
  } as unknown as PayloadRequest;
}

async function run() {
  const profiledAdminUsers = applyAdminSurfaceProfile(AdminUsers);
  const adminUsersReadAccess = AdminUsers.access?.read;
  const adminUsersCreateAccess = AdminUsers.access?.create;
  const adminUsersAdminAccess = profiledAdminUsers.access?.admin;
  const systemMediaReadAccess = SystemMedia.access?.read;

  assert.equal(typeof adminUsersReadAccess, "function");
  assert.equal(typeof adminUsersCreateAccess, "function");
  assert.equal(typeof adminUsersAdminAccess, "function");
  assert.equal(typeof systemMediaReadAccess, "function");

  assert.equal(await adminUsersReadAccess?.({ req: createReq(null) }), false);
  assert.equal(await systemMediaReadAccess?.({ req: createReq(null) }), false);
  assert.equal(await adminUsersCreateAccess?.({ req: createReq({ id: 1, role: "owner" }) }), true);
  assert.equal(await adminUsersCreateAccess?.({ req: createReq({ id: 2, role: "admin" }) }), false);
  assert.equal(
    await adminUsersAdminAccess?.({
      req: { user: { collection: "admin-users", id: 21, role: "lead-manager" }, url: "/admin" } as PayloadRequest,
    }),
    true,
  );
  assert.equal(
    await adminUsersAdminAccess?.({
      req: {
        user: { collection: "admin-users", id: 22, role: "lead-manager" },
        url: "/admin/collections/admin-users",
      } as PayloadRequest,
    }),
    false,
  );
  assert.equal(getAdminCollectionSurface("admin-users")?.classification, "developer-only");
  assert.equal(getAdminCollectionSurface("products")?.classification, "owner-primary");
  assert.deepEqual(
    getVisibleRawAdminCollections("owner").map((surface) => surface.slug),
    [
      "products",
      "product-directions",
      "product-categories",
      "product-lines",
      "pages",
      "page-sections",
      "productInquiryForms",
      "leads",
      "translations",
      "media-assets",
      "product-documents",
      "seo-entries",
      "locales",
      "product-variants",
      "product-media",
      "navigation-menus",
      "site-settings",
      "admin-users",
      "audit-events",
      "system-media",
    ],
  );
  assert.deepEqual(
    getAdminNavigationContext("content-editor", "/admin/collections/pages/1")?.compactWorkspaces.map(
      (workspace) => workspace.id,
    ),
    ["pages", "catalog", "translations", "seo"],
  );
  assert.deepEqual(
    getAdminNavigationContext("lead-manager", "/admin/leads")?.groups.map((group) => group.label),
    ["Клиентский поток", "Контекст"],
  );
  assert.deepEqual(
    getAdminNavigationContext("translator", "/admin/translations")?.compactWorkspaces.map(
      (workspace) => workspace.id,
    ),
    ["translations", "overview", "pages", "seo"],
  );
  assert.equal(getAdminNavigationContext("owner", "/admin/leads?filter=all")?.currentWorkspace.id, "leads");
  assert.equal(getPrimaryAdminWorkspace("lead-manager")?.id, "leads");
  assert.equal(getPrimaryAdminWorkspace("content-editor")?.id, "pages");
  assert.equal(resolveAdminWorkspaceIdFromPath("/admin/site"), "pages");
  assert.equal(resolveAdminWorkspaceIdFromPath("/admin/collections/productInquiryForms/12"), "leads");
  assert.equal(resolveAdminWorkspaceIdFromPath("/admin/collections/site-settings/3"), "settings");

  assert.deepEqual(
    await adminUsersReadAccess?.({ req: createReq({ id: 9, role: "content-editor" }) }),
    {
      id: {
        equals: 9,
      },
    },
  );
  assert.equal(await adminUsersReadAccess?.({ req: createReq({ id: 3, role: "developer" }) }), true);
  assert.equal(await auditHistoryAccess({ req: createReq({ id: 3, role: "developer" }) }), true);
  assert.equal(await auditHistoryAccess({ req: createReq({ id: 4, role: "admin" }) }), false);
  assert.equal(await publishingAccess({ req: createReq({ id: 4, role: "admin" }) }), true);
  assert.equal(await publishingAccess({ req: createReq({ id: 5, role: "translator" }) }), false);
  assert.equal(await leadPiiAccess({ req: createReq({ id: 6, role: "lead-manager" }) }), true);
  assert.equal(await leadPiiAccess({ req: createReq({ id: 7, role: "content-editor" }) }), false);
  assert.equal(await exportSensitiveAccess({ req: createReq({ id: 8, role: "owner" }) }), true);
  assert.equal(await exportSensitiveAccess({ req: createReq({ id: 8, role: "lead-manager" }) }), false);
  const ownerPrimaryProducts = applyAdminSurfaceProfile({
    slug: "products",
    admin: {},
    fields: [],
  }).access?.admin;
  const developerOnlyUsers = applyAdminSurfaceProfile({
    slug: "admin-users",
    admin: {},
    fields: [],
  }).access?.admin;

  assert.equal(typeof ownerPrimaryProducts, "function");
  assert.equal(typeof developerOnlyUsers, "function");
  assert.equal(await ownerPrimaryProducts?.({ req: createReq({ id: 11, role: "content-editor" }) }), true);
  assert.equal(await ownerPrimaryProducts?.({ req: createReq({ id: 12, role: "lead-manager" }) }), false);
  assert.equal(await developerOnlyUsers?.({ req: createReq({ id: 13, role: "owner" }) }), true);
  assert.equal(await developerOnlyUsers?.({ req: createReq({ id: 14, role: "admin" }) }), false);

  const bootstrapUser = await assignBootstrapOwnerRole({
    collection: {} as never,
    context: {} as never,
    data: {
      role: "admin",
    },
    operation: "create",
    req: createHookReq(0),
  });
  const laterUser = await assignBootstrapOwnerRole({
    collection: {} as never,
    context: {} as never,
    data: {
      role: "admin",
    },
    operation: "create",
    req: createHookReq(2),
  });

  assert.equal(bootstrapUser?.role, "owner");
  assert.equal(laterUser?.role, "admin");
  assert.equal(getAdminUser(null), null);
  assert.deepEqual(getAdminUser({ id: 1, role: "owner" }), {
    id: 1,
    role: "owner",
  });

  console.log("admin-access-smoke: ok");
}

void run();
