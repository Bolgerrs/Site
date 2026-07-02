import type { CollectionBeforeChangeHook, CollectionConfig, PayloadRequest, Where } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import { createFieldChangeAuditHook, createStatusAuditHook } from "../lib/payload/audit.ts";
import { validateSourceArtifactPath } from "../lib/payload/catalog.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import {
  createAuditNotesField,
  createLocaleField,
  createStatusField,
} from "../lib/payload/fields.ts";
import {
  getSourceId,
  getText,
  normalizePublicPath,
  siteSettingsScopeOptions,
} from "../lib/payload/site-governance.ts";

type SiteSettingsBeforeChangeArgs = {
  data?: Record<string, unknown> | null;
  operation: "create" | "update";
  originalDoc?: Record<string, unknown> | null;
  req: PayloadRequest;
};

function buildDuplicateScopeLocaleWhere(
  settingsScope: string,
  locale: string,
  originalDocId: string | number | null,
): Where {
  const clauses: Where[] = [
    {
      settingsScope: {
        equals: settingsScope,
      },
    },
    {
      locale: {
        equals: locale,
      },
    },
  ];

  if (originalDocId != null) {
    clauses.push({
      id: {
        not_equals: originalDocId,
      },
    });
  }

  return {
    and: clauses,
  };
}

export const validateSiteSettings: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}: SiteSettingsBeforeChangeArgs) => {
  const currentData = {
    ...(operation === "update" ? (originalDoc as Record<string, unknown> | undefined) : {}),
    ...((data ?? {}) as Record<string, unknown>),
  };

  const internalCode = getText(currentData.internalCode);
  const locale = getText(currentData.locale);
  const primaryLocale = getText(currentData.primaryLocale) || locale;
  const settingsScope = getText(currentData.settingsScope) || "public-site";

  if (!internalCode || !locale) {
    throw new Error("Site settings validation failed: internalCode and locale are required.");
  }

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Site settings validation failed: sourceOfTruthArtifact",
  );

  const duplicate = await req.payload.find({
    collection: "site-settings",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: buildDuplicateScopeLocaleWhere(settingsScope, locale, getSourceId(originalDoc?.id)),
  });

  if (duplicate.docs[0]) {
    throw new Error("Site settings validation failed: one settings record is allowed per scope-locale pair.");
  }

  const socialLinks = Array.isArray(currentData.socialLinks) ? currentData.socialLinks : [];

  return {
    ...currentData,
    contactPrimaryHref: normalizePublicPath(currentData.contactPrimaryHref, "/contact"),
    locale,
    primaryLocale,
    settingsScope,
    socialLinks: socialLinks.map((link) => ({
      ...(typeof link === "object" && link ? link : {}),
      href: normalizePublicPath((link as { href?: unknown } | null)?.href, "/"),
      label: getText((link as { label?: unknown } | null)?.label),
    })),
  };
};

export const SiteSettings: CollectionConfig = defineCollection({
  slug: "site-settings",
  admin: {
    defaultColumns: ["internalCode", "settingsScope", "locale", "brandName", "status"],
    group: "SEO",
    useAsTitle: "brandName",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    afterChange: [
      createStatusAuditHook({
        collection: "site-settings",
        labelFields: ["brandName", "internalCode"],
        surfaceLabel: "Site settings",
      }),
      createFieldChangeAuditHook({
        action: "protected-settings-update",
        collection: "site-settings",
        detailBuilder: (diffs) =>
          diffs
            .map((entry) => `${entry.field}: ${entry.beforeValue ?? "empty"} -> ${entry.afterValue ?? "empty"}`)
            .join("\n"),
        eventGroup: "settings",
        fields: [
          "brandName",
          "siteTagline",
          "contactPrimaryHref",
          "contactEmail",
          "contactPhoneE164",
          "contactWhatsappUrl",
          "contactTelegramUrl",
          "contactFallbackLocale",
          "defaultSeoImage",
        ],
        labelFields: ["brandName", "internalCode"],
        summaryBuilder: (diffs) =>
          `Protected site settings updated (${diffs.map((entry) => entry.field).join(", ")}).`,
      }),
    ],
    beforeChange: [validateSiteSettings],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "internalCode",
          type: "text",
          required: true,
          unique: true,
        },
        createStatusField(),
        createLocaleField(),
      ],
    },
    {
      type: "row",
      fields: [
        createLocaleField("primaryLocale"),
        {
          name: "settingsScope",
          type: "select",
          defaultValue: "public-site",
          options: siteSettingsScopeOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "brandName",
          type: "text",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "brandShortName",
          type: "text",
        },
        {
          name: "siteTagline",
          type: "text",
        },
        {
          name: "siteConcept",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "contactPrimaryLabel",
          type: "text",
        },
        {
          name: "contactPrimaryHref",
          type: "text",
        },
        {
          name: "contactHeadline",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "contactEmail",
          type: "email",
        },
        {
          name: "contactPhoneDisplay",
          type: "text",
        },
        {
          name: "contactPhoneE164",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "contactWhatsappLabel",
          type: "text",
        },
        {
          name: "contactWhatsappUrl",
          type: "text",
        },
        {
          name: "contactTelegramUrl",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "showroomLabel",
          type: "text",
        },
        {
          name: "showroomCity",
          type: "text",
        },
        {
          name: "showroomCountry",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "addressShort",
          type: "text",
        },
        {
          name: "visitNote",
          type: "textarea",
        },
        {
          name: "footerLegalName",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "footerCopyright",
          type: "text",
        },
        {
          name: "defaultSeoImage",
          type: "relationship",
          relationTo: "media-assets",
        },
        {
          name: "contactFallbackLocale",
          type: "select",
          options: [
            { label: "ru", value: "ru" },
            { label: "en", value: "en" },
            { label: "es", value: "es" },
            { label: "fr", value: "fr" },
            { label: "zh", value: "zh" },
            { label: "ja", value: "ja" },
            { label: "de", value: "de" },
          ],
        },
      ],
    },
    {
      name: "socialLinks",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "href",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "customModuleSettings",
      type: "array",
      dbName: "mod_set",
      admin: {
        description:
          "Guided BFF storage for public module settings. Edited through owner-safe commands, not as a primary raw workflow.",
      },
      fields: [
        {
          name: "moduleId",
          type: "text",
          required: true,
        },
        {
          name: "moduleLabel",
          type: "text",
        },
        {
          name: "visible",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "title",
          type: "text",
        },
        {
          name: "text",
          type: "textarea",
        },
        {
          name: "buttonLabel",
          type: "text",
        },
        {
          name: "buttonHref",
          type: "text",
        },
        {
          name: "targetKind",
          type: "select",
          dbName: "tk",
          defaultValue: "url",
          options: [
            { label: "URL", value: "url" },
            { label: "Product", value: "product" },
            { label: "Category", value: "category" },
            { label: "Page", value: "page" },
          ],
        },
        {
          name: "linkedMedia",
          type: "relationship",
          relationTo: "media-assets",
        },
        {
          name: "linkedProduct",
          type: "relationship",
          relationTo: "products",
        },
        {
          name: "linkedCategory",
          type: "relationship",
          relationTo: "product-categories",
        },
        {
          name: "linkedPage",
          type: "relationship",
          relationTo: "pages",
        },
        {
          type: "row",
          fields: [
            {
              name: "desktopCropX",
              type: "number",
              min: 0,
              max: 100,
            },
            {
              name: "desktopCropY",
              type: "number",
              min: 0,
              max: 100,
            },
            {
              name: "mobileCropX",
              type: "number",
              min: 0,
              max: 100,
            },
            {
              name: "mobileCropY",
              type: "number",
              min: 0,
              max: 100,
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "desktopPosition",
              type: "select",
              dbName: "dp",
              options: [
                { label: "Center", value: "center" },
                { label: "Top", value: "top" },
                { label: "Bottom", value: "bottom" },
                { label: "Left", value: "left" },
                { label: "Right", value: "right" },
              ],
            },
            {
              name: "mobilePosition",
              type: "select",
              dbName: "mp",
              options: [
                { label: "Center", value: "center" },
                { label: "Top", value: "top" },
                { label: "Bottom", value: "bottom" },
                { label: "Left", value: "left" },
                { label: "Right", value: "right" },
              ],
            },
            {
              name: "motionEnabled",
              type: "checkbox",
              defaultValue: true,
            },
            {
              name: "motionDurationMs",
              type: "number",
              min: 0,
              max: 10000,
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "reducedMotionMode",
              type: "select",
              dbName: "rm",
              options: [
                { label: "Static first frame", value: "static-first-frame" },
                { label: "Fade only", value: "fade-only" },
                { label: "Use still image", value: "still-image" },
              ],
            },
            {
              name: "publicationState",
              type: "select",
              dbName: "ps",
              defaultValue: "draft",
              options: [
                { label: "Draft", value: "draft" },
                { label: "Ready for publish", value: "ready-for-publish" },
              ],
            },
          ],
        },
        {
          name: "ownerNotes",
          type: "textarea",
        },
        {
          name: "headerMenuLanguage",
          type: "group",
          admin: {
            description:
              "Protected header, menu, language switcher and motion settings. Public runtime wiring stays in explicit web tasks.",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "desktopLayoutMode",
                  type: "select",
                  options: [
                    { label: "Brand left, actions right", value: "brand-left-actions-right" },
                    { label: "Centered brand", value: "centered-brand" },
                    { label: "Route-specific", value: "route-specific" },
                  ],
                },
                {
                  name: "mobileLayoutMode",
                  type: "select",
                  options: [
                    { label: "Logo centered, actions on sides", value: "logo-center-actions-sides" },
                    { label: "Logo left, drawer right", value: "logo-left-drawer-right" },
                  ],
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "logoAsset",
                  type: "relationship",
                  relationTo: "media-assets",
                },
                {
                  name: "logoAlignmentNote",
                  type: "text",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "phoneButtonVisible",
                  type: "checkbox",
                  defaultValue: true,
                },
                {
                  name: "phoneButtonLabel",
                  type: "text",
                },
                {
                  name: "consultationCtaVisible",
                  type: "checkbox",
                  defaultValue: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "consultationCtaLabel",
                  type: "text",
                },
                {
                  name: "consultationCtaHref",
                  type: "text",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "enabledLanguageCodes",
                  type: "text",
                  admin: {
                    description: "Comma-separated locale codes for guided BFF storage.",
                  },
                  hasMany: true,
                },
                {
                  name: "languageOrder",
                  type: "text",
                  admin: {
                    description: "Switcher order as locale codes.",
                  },
                  hasMany: true,
                },
                {
                  name: "defaultLanguageCode",
                  type: "text",
                },
              ],
            },
            {
              name: "languageSwitcherDisplay",
              type: "select",
              options: [
                { label: "Short code", value: "short-code" },
                { label: "Current language label", value: "current-locale-label" },
                { label: "Code with language name", value: "short-code-with-name" },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "megaMenuGrouping",
                  type: "select",
                  options: [
                    { label: "Direction, category, product", value: "direction-category-product" },
                    { label: "Direction, product", value: "direction-product" },
                    { label: "Category, product", value: "category-product" },
                  ],
                },
                {
                  name: "stableColumnCount",
                  type: "number",
                  min: 1,
                  max: 6,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "closeBehavior",
                  type: "select",
                  options: [
                    { label: "Close after choosing", value: "after-selection" },
                    { label: "Manual close only", value: "manual-only" },
                  ],
                },
                {
                  name: "menuOpenBehavior",
                  type: "select",
                  options: [
                    { label: "Hover and click", value: "hover-and-click" },
                    { label: "Click only", value: "click-only" },
                  ],
                },
                {
                  name: "mobileLogoTransition",
                  type: "select",
                  options: [
                    { label: "Crossfade centered", value: "crossfade-center" },
                    { label: "Slide to center", value: "slide-to-center" },
                    { label: "Static", value: "static" },
                  ],
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "menuRevealDurationMs",
                  type: "number",
                  min: 0,
                  max: 10000,
                },
                {
                  name: "menuRevealEasing",
                  type: "text",
                },
                {
                  name: "logoTransitionDurationMs",
                  type: "number",
                  min: 0,
                  max: 10000,
                },
                {
                  name: "logoTransitionEasing",
                  type: "text",
                },
              ],
            },
            {
              name: "reducedMotionMode",
              type: "select",
              options: [
                { label: "Static first frame", value: "static-first-frame" },
                { label: "Fade only", value: "fade-only" },
                { label: "Use still image", value: "still-image" },
              ],
            },
            {
              name: "routeAlignmentNotes",
              type: "textarea",
            },
          ],
        },
        {
          name: "heroScene",
          type: "group",
          admin: {
            description:
              "Interactive homepage hero scene settings. Owner-safe BFF commands are the primary editing surface.",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "desktopMedia",
                  type: "relationship",
                  relationTo: "media-assets",
                },
                {
                  name: "mobileMedia",
                  type: "relationship",
                  relationTo: "media-assets",
                },
                {
                  name: "desktopVideoMedia",
                  type: "relationship",
                  relationTo: "media-assets",
                },
                {
                  name: "mobileVideoMedia",
                  type: "relationship",
                  relationTo: "media-assets",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "focalDesktopX",
                  type: "number",
                  min: 0,
                  max: 100,
                },
                {
                  name: "focalDesktopY",
                  type: "number",
                  min: 0,
                  max: 100,
                },
                {
                  name: "focalMobileX",
                  type: "number",
                  min: 0,
                  max: 100,
                },
                {
                  name: "focalMobileY",
                  type: "number",
                  min: 0,
                  max: 100,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "brandText",
                  type: "text",
                },
                {
                  name: "sloganText",
                  type: "text",
                },
                {
                  name: "ctaVisible",
                  type: "checkbox",
                  defaultValue: true,
                },
              ],
            },
            {
              name: "ctaTitle",
              type: "text",
            },
            {
              name: "ctaText",
              type: "textarea",
            },
            {
              type: "row",
              fields: [
                {
                  name: "ctaButtonLabel",
                  type: "text",
                },
                {
                  name: "ctaButtonHref",
                  type: "text",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "desktopHoverBehavior",
                  type: "select",
                  options: [
                    { label: "Highlight contour", value: "highlight-contour" },
                    { label: "Focus label", value: "focus-label" },
                    { label: "Quiet", value: "quiet" },
                  ],
                },
                {
                  name: "mobileBehavior",
                  type: "select",
                  options: [
                    { label: "Auto cycle", value: "auto-cycle" },
                    { label: "Tap only", value: "tap-only" },
                  ],
                },
                {
                  name: "mobileCycleDurationMs",
                  type: "number",
                  min: 0,
                  max: 10000,
                },
                {
                  name: "mobileEasing",
                  type: "text",
                },
              ],
            },
            {
              name: "reducedMotionFallback",
              type: "select",
              options: [
                { label: "Static first frame", value: "static-first-frame" },
                { label: "Fade only", value: "fade-only" },
                { label: "Use still image", value: "still-image" },
              ],
            },
            {
              name: "hotspots",
              type: "array",
              fields: [
                {
                  name: "hotspotId",
                  type: "text",
                  required: true,
                },
                {
                  name: "displayName",
                  type: "text",
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "x",
                      type: "number",
                      min: 0,
                      max: 100,
                    },
                    {
                      name: "y",
                      type: "number",
                      min: 0,
                      max: 100,
                    },
                    {
                      name: "width",
                      type: "number",
                      min: 0,
                      max: 100,
                    },
                    {
                      name: "height",
                      type: "number",
                      min: 0,
                      max: 100,
                    },
                  ],
                },
                {
                  name: "visualContourPath",
                  type: "textarea",
                },
                {
                  name: "hitAreaPath",
                  type: "textarea",
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "targetKind",
                      type: "select",
                      options: [
                        { label: "Product", value: "product" },
                        { label: "Category", value: "category" },
                        { label: "Page", value: "page" },
                        { label: "URL", value: "url" },
                      ],
                    },
                    {
                      name: "linkedProduct",
                      type: "relationship",
                      relationTo: "products",
                    },
                    {
                      name: "linkedCategory",
                      type: "relationship",
                      relationTo: "product-categories",
                    },
                    {
                      name: "linkedPage",
                      type: "relationship",
                      relationTo: "pages",
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "mobileCycleOrder",
                      type: "number",
                      min: 0,
                      max: 24,
                    },
                    {
                      name: "autoHighlightDurationMs",
                      type: "number",
                      min: 0,
                      max: 10000,
                    },
                    {
                      name: "easing",
                      type: "text",
                    },
                    {
                      name: "visible",
                      type: "checkbox",
                      defaultValue: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "sourceOfTruthArtifact",
      type: "text",
    },
    createAuditNotesField(),
  ],
});
