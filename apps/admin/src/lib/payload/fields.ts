import type { Field } from "payload";

import { adminLocaleOptions, defaultAdminLocale } from "./locales.ts";

export const publicationStatusOptions = [
  {
    label: "Draft",
    value: "draft",
  },
  {
    label: "Review",
    value: "review",
  },
  {
    label: "Published",
    value: "published",
  },
  {
    label: "Hidden",
    value: "hidden",
  },
  {
    label: "Archived",
    value: "archived",
  },
] as const;

export type PublicationStatus = (typeof publicationStatusOptions)[number]["value"];

export function createStatusField(name = "status"): Field {
  return {
    name,
    type: "select",
    admin: {
      position: "sidebar",
    },
    defaultValue: "draft",
    index: true,
    options: publicationStatusOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
    required: true,
  };
}

export function createLocaleField(name = "locale"): Field {
  return {
    name,
    type: "select",
    admin: {
      position: "sidebar",
    },
    defaultValue: defaultAdminLocale,
    index: true,
    options: adminLocaleOptions.map((locale) => ({
      label: locale.englishLabel,
      value: locale.code,
    })),
    required: true,
  };
}

export function createOwnerField(name = "owner"): Field {
  return {
    name,
    type: "relationship",
    admin: {
      position: "sidebar",
    },
    relationTo: "admin-users",
  };
}

export function createReviewerField(name = "reviewer"): Field {
  return {
    name,
    type: "relationship",
    admin: {
      position: "sidebar",
    },
    relationTo: "admin-users",
  };
}

export function createAuditNotesField(name = "auditNotes"): Field {
  return {
    name,
    type: "textarea",
    admin: {
      description:
        "Short internal note for review, rights, privacy, or publish decisions.",
    },
  };
}

export function createSeoField(name = "seo"): Field {
  return {
    name,
    type: "group",
    fields: [
      {
        name: "title",
        type: "text",
      },
      {
        name: "description",
        type: "textarea",
      },
      {
        name: "canonicalPath",
        type: "text",
      },
      {
        name: "robots",
        type: "select",
        defaultValue: "index,follow",
        options: [
          {
            label: "index,follow",
            value: "index,follow",
          },
          {
            label: "noindex,follow",
            value: "noindex,follow",
          },
          {
            label: "noindex,nofollow",
            value: "noindex,nofollow",
          },
        ],
      },
    ],
  };
}

export function createPublicationWorkflowFields(): Field[] {
  return [
    createStatusField(),
    createLocaleField(),
    createOwnerField(),
    createReviewerField(),
    {
      name: "reviewRequestedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "reviewedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "hiddenAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "archivedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    createAuditNotesField(),
    createSeoField(),
  ];
}
