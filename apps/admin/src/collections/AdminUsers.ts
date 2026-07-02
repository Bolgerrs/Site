import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  FieldAccess,
} from "payload";

import { defineCollection } from "../lib/payload/collections.ts";
import { adminRoleOptions, hasAdminRole, operationalAdminRoles } from "../lib/payload/roles.ts";
import {
  getAdminUser,
  ownerOnlyAccess,
  ownerOrDeveloperAccess,
  roleBooleanAccess,
  roleOrSelfAccess,
} from "../lib/payload/access.ts";
import { createAuditEvent } from "../lib/payload/audit.ts";
import type { AdminUser } from "../payload-types.ts";

const privilegedUserReadAccess = roleOrSelfAccess(["owner", "admin", "developer"]);
const adminPanelAccess = roleBooleanAccess(operationalAdminRoles);
const roleFieldReadAccess: FieldAccess<AdminUser> = ({ req, doc, id }) => {
  const user = getAdminUser(req.user);

  if (hasAdminRole(user, ["owner", "admin", "developer"])) {
    return true;
  }

  const targetId = doc?.id ?? id;

  return Boolean(user?.id && targetId && user.id === targetId);
};

export const assignBootstrapOwnerRole: CollectionBeforeChangeHook<AdminUser> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== "create") {
    return data;
  }

  const { totalDocs } = await req.payload.count({
    collection: "admin-users",
    overrideAccess: true,
  });

  if (totalDocs > 0) {
    return data;
  }

  return {
    ...data,
    role: "owner",
  };
};

const auditAdminRoleChange: CollectionAfterChangeHook<AdminUser> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== "update") {
    return doc;
  }

  const previousRole = typeof previousDoc?.role === "string" ? previousDoc.role : "";
  const nextRole = typeof doc.role === "string" ? doc.role : "";

  if (!previousRole || !nextRole || previousRole === nextRole) {
    return doc;
  }

  await createAuditEvent(req, {
    action: "role-change",
    diffs: [
      {
        afterValue: nextRole,
        beforeValue: previousRole,
        field: "role",
      },
    ],
    eventGroup: "access",
    sensitive: true,
    summary: `Operator role changed: ${previousRole} -> ${nextRole}.`,
    target: {
      collection: "admin-users",
      id: doc.id,
      label: doc.email || doc.fullName || null,
    },
  });

  return doc;
};

export const AdminUsers: CollectionConfig = defineCollection({
  slug: "admin-users",
  admin: {
    defaultColumns: ["fullName", "email", "role", "updatedAt"],
    useAsTitle: "email",
  },
  access: {
    admin: adminPanelAccess,
    create: ownerOrDeveloperAccess,
    delete: ownerOnlyAccess,
    read: privilegedUserReadAccess,
    readVersions: privilegedUserReadAccess,
    unlock: ownerOrDeveloperAccess,
    update: privilegedUserReadAccess,
  },
  auth: true,
  hooks: {
    afterChange: [auditAdminRoleChange],
    beforeChange: [assignBootstrapOwnerRole],
  },
  fields: [
    {
      name: "fullName",
      type: "text",
      required: true,
    },
    {
      name: "role",
      access: {
        create: adminPanelAccess,
        read: roleFieldReadAccess,
        update: adminPanelAccess,
      },
      admin: {
        description:
          "First registered account is forced to Owner. Later role changes stay restricted to Owner or Developer.",
      },
      saveToJWT: true,
      type: "select",
      defaultValue: "admin",
      options: adminRoleOptions.map((option) => ({
        label: option.label,
        value: option.value,
      })),
      required: true,
    },
  ],
});
