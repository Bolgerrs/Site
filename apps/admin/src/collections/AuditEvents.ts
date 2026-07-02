import type { Access, CollectionConfig } from "payload";

import { getAuditEventGroupLabel } from "../lib/payload/audit.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import { ownerOrDeveloperAccess, roleBooleanAccess } from "../lib/payload/access.ts";

const privilegedAuditAccess: Access = ownerOrDeveloperAccess;
const privilegedAuditAdminAccess = roleBooleanAccess(["owner", "developer"]);

export const AuditEvents: CollectionConfig = defineCollection({
  slug: "audit-events",
  access: {
    admin: privilegedAuditAdminAccess,
    create: () => false,
    delete: () => false,
    read: privilegedAuditAccess,
    update: () => false,
  },
  admin: {
    defaultColumns: [
      "happenedAt",
      "eventGroupLabel",
      "actionLabel",
      "targetCollection",
      "targetLabel",
      "actorRole",
    ],
    group: "System",
    useAsTitle: "summary",
  },
  fields: [
    {
      name: "happenedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "eventGroup",
          type: "select",
          admin: {
            description:
              "High-level bucket for the audit trail. Owner-facing history should read as workflow, privacy, access or settings activity instead of raw technical codes.",
          },
          options: [
            "publication-workflow",
            "lead-workflow",
            "media-governance",
            "privacy",
            "access",
            "settings",
          ].map((value) => ({
            label: getAuditEventGroupLabel(value as Parameters<typeof getAuditEventGroupLabel>[0]),
            value,
          })),
          required: true,
        },
        {
          name: "eventGroupLabel",
          type: "text",
          admin: {
            description: "Stored readable label for the event group shown in owner/developer audit history.",
            readOnly: true,
          },
        },
        {
          name: "action",
          admin: {
            description:
              "Stable action code for tooling. Common examples: publish, role-change, lead-export, restore-validation.",
          },
          type: "text",
          required: true,
        },
        {
          name: "actionLabel",
          type: "text",
          admin: {
            description:
              "Human-readable action label for operators. This is the field owners should scan before opening raw details.",
            readOnly: true,
          },
        },
        {
          name: "sensitive",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      name: "summary",
      admin: {
        description:
          "Owner-facing sentence that explains what changed. Role changes, publish moves, lead exports and restore checks should be understandable without reading raw diffs.",
      },
      type: "textarea",
      required: true,
    },
    {
      name: "details",
      admin: {
        description:
          "Optional operator detail for investigation. Use it for narrow diffs or recovery notes, not for replacing the summary.",
      },
      type: "textarea",
    },
    {
      type: "row",
      fields: [
        {
          name: "targetCollection",
          type: "text",
          required: true,
        },
        {
          name: "targetId",
          type: "text",
          required: true,
        },
        {
          name: "targetLabel",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "actorId",
          type: "text",
        },
        {
          name: "actorRole",
          type: "text",
        },
        {
          name: "actorName",
          type: "text",
        },
        {
          name: "actorEmail",
          type: "email",
        },
      ],
    },
    {
      name: "diffs",
      type: "array",
      fields: [
        {
          name: "field",
          type: "text",
          required: true,
        },
        {
          name: "beforeValue",
          type: "textarea",
        },
        {
          name: "afterValue",
          type: "textarea",
        },
      ],
    },
  ],
  versions: false,
});
