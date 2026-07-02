import type { Access, CollectionConfig, UploadConfig } from "payload";

import { defineCollection } from "../lib/payload/collections.ts";
import { createAuditNotesField, createPublicationWorkflowFields } from "../lib/payload/fields.ts";
import { authenticatedAccess, roleAccess } from "../lib/payload/access.ts";
import { createStatusAuditHook } from "../lib/payload/audit.ts";
import { mediaOperatorRoles } from "../lib/payload/roles.ts";

const mediaOperatorAccess: Access = roleAccess(mediaOperatorRoles);

export const systemMediaUpload: UploadConfig = {
  displayPreview: true,
  mimeTypes: ["image/*", "application/pdf", "text/plain"],
};

export const SystemMedia: CollectionConfig = defineCollection({
  slug: "system-media",
  access: {
    create: mediaOperatorAccess,
    delete: mediaOperatorAccess,
    read: authenticatedAccess,
    update: mediaOperatorAccess,
  },
  admin: {
    group: "System",
    hidden: true,
    useAsTitle: "filename",
  },
  hooks: {
    afterChange: [
      createStatusAuditHook({
        collection: "system-media",
        labelFields: ["label", "filename"],
        surfaceLabel: "System media",
      }),
    ],
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
    ...createPublicationWorkflowFields(),
    createAuditNotesField("storageNote"),
  ],
  upload: systemMediaUpload,
});
