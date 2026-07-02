import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { defineCollection } from "../lib/payload/collections.ts";
import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  roleAccess,
} from "../lib/payload/access.ts";
import { adminLocaleOptions } from "../lib/payload/locales.ts";
import type { Locale } from "../payload-types.ts";

const localePolicyAccess = roleAccess(["owner", "admin", "developer"]);

async function assertSingleBooleanFlag(
  req: Parameters<CollectionBeforeChangeHook<Locale>>[0]["req"],
  originalId: number | string | undefined,
  fieldName: "isDefaultAdminLocale" | "isDefaultPublicLocale" | "isSourceLocale",
  label: string,
) {
  const existing = await req.payload.find({
    collection: "locales",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          [fieldName]: {
            equals: true,
          },
        },
        ...(originalId
          ? [
              {
                id: {
                  not_equals: originalId,
                },
              },
            ]
          : []),
      ],
    },
  });

  if (existing.docs[0]) {
    throw new Error(`Locale validation failed: only one record may be marked as ${label}.`);
  }
}

export const validateLocalePolicy: CollectionBeforeChangeHook<Locale> = async ({
  data,
  originalDoc,
  req,
}) => {
  const routePrefix =
    typeof data.routePrefix === "string" && data.routePrefix.trim().length > 0
      ? data.routePrefix.trim()
      : `/${data.code}`;
  const normalizedRoutePrefix = routePrefix.startsWith("/") ? routePrefix : `/${routePrefix}`;
  const nextData = {
    ...data,
    routePrefix: normalizedRoutePrefix,
  };

  if (nextData.isDefaultAdminLocale === true) {
    await assertSingleBooleanFlag(
      req,
      originalDoc?.id,
      "isDefaultAdminLocale",
      "the default admin locale",
    );
  }

  if (nextData.isDefaultPublicLocale === true) {
    await assertSingleBooleanFlag(
      req,
      originalDoc?.id,
      "isDefaultPublicLocale",
      "the default public locale",
    );
  }

  if (nextData.isSourceLocale === true) {
    await assertSingleBooleanFlag(req, originalDoc?.id, "isSourceLocale", "the source locale");
  }

  return nextData;
};

export const Locales: CollectionConfig = defineCollection({
  slug: "locales",
  admin: {
    defaultColumns: ["nativeLabel", "code", "status", "routePrefix", "translationReadiness"],
    group: "Localization",
    useAsTitle: "nativeLabel",
  },
  access: {
    create: localePolicyAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: localePolicyAccess,
  },
  hooks: {
    beforeChange: [validateLocalePolicy],
  },
  fields: [
    {
      name: "code",
      type: "select",
      admin: {
        position: "sidebar",
      },
      index: true,
      options: adminLocaleOptions.map((locale) => ({
        label: locale.englishLabel,
        value: locale.code,
      })),
      required: true,
      unique: true,
    },
    {
      name: "bcp47Tag",
      type: "text",
      admin: {
        position: "sidebar",
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "nativeLabel",
      type: "text",
      required: true,
    },
    {
      name: "englishLabel",
      type: "text",
      required: true,
    },
    {
      name: "switcherShortLabel",
      type: "text",
    },
    {
      name: "direction",
      type: "select",
      defaultValue: "ltr",
      options: [
        {
          label: "Left to right",
          value: "ltr",
        },
        {
          label: "Right to left",
          value: "rtl",
        },
      ],
      required: true,
    },
    {
      name: "launchOrder",
      type: "number",
      admin: {
        position: "sidebar",
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "status",
      type: "select",
      admin: {
        position: "sidebar",
      },
      defaultValue: "active",
      index: true,
      options: [
        {
          label: "Planned",
          value: "planned",
        },
        {
          label: "Active",
          value: "active",
        },
        {
          label: "Hidden",
          value: "hidden",
        },
        {
          label: "Deprecated",
          value: "deprecated",
        },
      ],
      required: true,
    },
    {
      name: "routePrefix",
      type: "text",
      admin: {
        position: "sidebar",
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "publicSiteEnabled",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "hiddenFromSwitcher",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "samePageSwitchEnabled",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "seoEnabled",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "formsEnabled",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "documentsEnabled",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "xDefaultEligible",
      type: "checkbox",
      defaultValue: false,
    },
    {
      type: "row",
      fields: [
        {
          name: "isDefaultPublicLocale",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "isDefaultAdminLocale",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "isSourceLocale",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      name: "sourceLocale",
      type: "relationship",
      admin: {
        description:
          "Configurable source locale for translation workflows when this locale is not the source.",
      },
      relationTo: "locales",
    },
    {
      name: "translationReadiness",
      type: "select",
      defaultValue: "partial",
      options: [
        {
          label: "Not started",
          value: "not-started",
        },
        {
          label: "Partial",
          value: "partial",
        },
        {
          label: "Ready",
          value: "ready",
        },
        {
          label: "Blocked",
          value: "blocked",
        },
      ],
      required: true,
    },
    {
      name: "labelLengthRisk",
      type: "select",
      defaultValue: "low",
      options: [
        {
          label: "Low",
          value: "low",
        },
        {
          label: "Medium",
          value: "medium",
        },
        {
          label: "High",
          value: "high",
        },
      ],
      required: true,
    },
    {
      name: "qualityFlags",
      type: "select",
      hasMany: true,
      options: [
        {
          label: "Missing font QA",
          value: "missing-font-qa",
        },
        {
          label: "Legal copy pending",
          value: "legal-copy-pending",
        },
        {
          label: "Document gap",
          value: "document-gap",
        },
        {
          label: "SEO gap",
          value: "seo-gap",
        },
      ],
    },
    {
      name: "editorialNotes",
      type: "textarea",
    },
    {
      name: "sourceOfTruthArtifact",
      type: "text",
    },
    {
      name: "changeReason",
      type: "textarea",
    },
  ],
  versions: false,
});
