import type { CollectionBeforeChangeHook, CollectionConfig, PayloadRequest } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  normalizeSlugLikeValue,
  validateSourceArtifactPath,
} from "../lib/payload/catalog.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import {
  createAuditNotesField,
  createLocaleField,
  createStatusField,
} from "../lib/payload/fields.ts";
import {
  fetchSourceDocument,
  getSourceId,
  getSourceLabel,
  getSourcePath,
  getText,
  navigationItemSourceTypeOptions,
  navigationMenuKeyOptions,
  navigationPlacementOptions,
  normalizePublicPath,
} from "../lib/payload/site-governance.ts";

type NavigationMenuBeforeChangeArgs = {
  data?: Record<string, unknown> | null;
  operation: "create" | "update";
  originalDoc?: Record<string, unknown> | null;
  req: PayloadRequest;
};

const sourceRelationFields = {
  page: "sourcePage",
  "product-direction": "sourceDirection",
  "product-category": "sourceCategory",
  "product-line": "sourceLine",
  product: "sourceProduct",
} as const;

type MenuItemRecord = Record<string, unknown>;

async function resolveMenuItem(
  item: MenuItemRecord,
  req: PayloadRequest,
  fallbackKey: string,
) {
  const sourceType = getText(item.sourceType) as (typeof navigationItemSourceTypeOptions)[number];
  const itemKey = normalizeSlugLikeValue(item.itemKey, fallbackKey) || fallbackKey;
  const visible = item.visible !== false;
  const useSourceLabel = item.useSourceLabel !== false;
  const useSourceHref = item.useSourceHref !== false;
  let resolvedLabel = getText(item.overrideLabel);
  let resolvedHref = normalizePublicPath(item.overrideHref, "/");

  if (sourceType === "custom-url") {
    resolvedLabel = resolvedLabel || getText(item.label);
    resolvedHref = normalizePublicPath(item.href, resolvedHref || "/");

    if (!resolvedLabel || !resolvedHref) {
      throw new Error("Navigation menu validation failed: custom-url items require label and href.");
    }
  } else if (sourceType in sourceRelationFields) {
    const relationField = sourceRelationFields[sourceType as keyof typeof sourceRelationFields];
    const sourceId = getSourceId(item[relationField]);

    if (!sourceId) {
      throw new Error(
        `Navigation menu validation failed: ${relationField} is required for sourceType ${sourceType}.`,
      );
    }

    const sourceDocument = await fetchSourceDocument(req.payload, sourceType, sourceId);

    if (!sourceDocument) {
      throw new Error("Navigation menu validation failed: source document was not found.");
    }

    const sourceLabel = getSourceLabel(sourceType, sourceDocument);
    const sourceHref = getSourcePath(sourceType, sourceDocument);

    resolvedLabel = useSourceLabel ? sourceLabel : resolvedLabel || sourceLabel;
    resolvedHref = useSourceHref ? sourceHref : normalizePublicPath(item.overrideHref, sourceHref || "/");
  } else {
    throw new Error("Navigation menu validation failed: sourceType is invalid.");
  }

  const children = Array.isArray(item.children) ? item.children : [];
  const normalizedChildren = [];

  for (let index = 0; index < children.length; index += 1) {
    normalizedChildren.push(
      await resolveMenuChild(
        (children[index] ?? {}) as MenuItemRecord,
        req,
        `${itemKey}-${index + 1}`,
      ),
    );
  }

  return {
    ...item,
    children: normalizedChildren,
    itemKey,
    resolvedHref,
    resolvedLabel,
    visible,
  };
}

async function resolveMenuChild(
  item: MenuItemRecord,
  req: PayloadRequest,
  fallbackKey: string,
) {
  const sourceType = getText(item.sourceType) as (typeof navigationItemSourceTypeOptions)[number];
  const itemKey = normalizeSlugLikeValue(item.itemKey, fallbackKey) || fallbackKey;
  const visible = item.visible !== false;
  const useSourceLabel = item.useSourceLabel !== false;
  const useSourceHref = item.useSourceHref !== false;
  let resolvedLabel = getText(item.overrideLabel);
  let resolvedHref = normalizePublicPath(item.overrideHref, "/");

  if (sourceType === "custom-url") {
    resolvedLabel = resolvedLabel || getText(item.label);
    resolvedHref = normalizePublicPath(item.href, resolvedHref || "/");

    if (!resolvedLabel || !resolvedHref) {
      throw new Error(
        "Navigation menu validation failed: custom-url child items require label and href.",
      );
    }
  } else if (sourceType in sourceRelationFields) {
    const relationField = sourceRelationFields[sourceType as keyof typeof sourceRelationFields];
    const sourceId = getSourceId(item[relationField]);

    if (!sourceId) {
      throw new Error(
        `Navigation menu validation failed: ${relationField} is required for child sourceType ${sourceType}.`,
      );
    }

    const sourceDocument = await fetchSourceDocument(req.payload, sourceType, sourceId);

    if (!sourceDocument) {
      throw new Error("Navigation menu validation failed: child source document was not found.");
    }

    const sourceLabel = getSourceLabel(sourceType, sourceDocument);
    const sourceHref = getSourcePath(sourceType, sourceDocument);

    resolvedLabel = useSourceLabel ? sourceLabel : resolvedLabel || sourceLabel;
    resolvedHref = useSourceHref ? sourceHref : normalizePublicPath(item.overrideHref, sourceHref || "/");
  } else {
    throw new Error("Navigation menu validation failed: child sourceType is invalid.");
  }

  return {
    ...item,
    itemKey,
    resolvedHref,
    resolvedLabel,
    visible,
  };
}

export const validateNavigationMenu: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}: NavigationMenuBeforeChangeArgs) => {
  const currentData = {
    ...(operation === "update" ? (originalDoc as Record<string, unknown> | undefined) : {}),
    ...((data ?? {}) as Record<string, unknown>),
  };

  const internalCode = getText(currentData.internalCode);
  const title = getText(currentData.title);
  const menuKey = getText(currentData.menuKey);
  const locale = getText(currentData.locale);
  const primaryLocale = getText(currentData.primaryLocale) || locale;
  const items = Array.isArray(currentData.items) ? currentData.items : [];
  const normalizedItems = [];

  if (!internalCode || !title || !menuKey || !locale) {
    throw new Error("Navigation menu validation failed: internalCode, title, menuKey and locale are required.");
  }

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Navigation menu validation failed: sourceOfTruthArtifact",
  );

  for (let index = 0; index < items.length; index += 1) {
    normalizedItems.push(
      await resolveMenuItem(
        (items[index] ?? {}) as MenuItemRecord,
        req,
        `item-${index + 1}`,
      ),
    );
  }

  return {
    ...currentData,
    items: normalizedItems,
    locale,
    primaryLocale,
  };
};

const childMenuItemFields: CollectionConfig["fields"] = [
  {
    name: "itemKey",
    type: "text",
  },
  {
    type: "row",
    fields: [
      {
        name: "sourceType",
        type: "select",
        options: navigationItemSourceTypeOptions.map((value) => ({ label: value, value })),
        required: true,
      },
      {
        name: "visible",
        type: "checkbox",
        defaultValue: true,
      },
      {
        name: "opensInNewTab",
        type: "checkbox",
        defaultValue: false,
      },
    ],
  },
  {
    type: "row",
    fields: [
      {
        name: "sourcePage",
        type: "relationship",
        admin: {
          condition: (_, siblingData) => siblingData.sourceType === "page",
        },
        relationTo: "pages",
      },
      {
        name: "sourceDirection",
        type: "relationship",
        admin: {
          condition: (_, siblingData) => siblingData.sourceType === "product-direction",
        },
        relationTo: "product-directions",
      },
      {
        name: "sourceCategory",
        type: "relationship",
        admin: {
          condition: (_, siblingData) => siblingData.sourceType === "product-category",
        },
        relationTo: "product-categories",
      },
    ],
  },
  {
    type: "row",
    fields: [
      {
        name: "sourceLine",
        type: "relationship",
        admin: {
          condition: (_, siblingData) => siblingData.sourceType === "product-line",
        },
        relationTo: "product-lines",
      },
      {
        name: "sourceProduct",
        type: "relationship",
        admin: {
          condition: (_, siblingData) => siblingData.sourceType === "product",
        },
        relationTo: "products",
      },
      {
        name: "href",
        type: "text",
        admin: {
          condition: (_, siblingData) => siblingData.sourceType === "custom-url",
        },
      },
    ],
  },
  {
    type: "row",
    fields: [
      {
        name: "useSourceLabel",
        type: "checkbox",
        defaultValue: true,
      },
      {
        name: "overrideLabel",
        type: "text",
      },
      {
        name: "label",
        type: "text",
        admin: {
          condition: (_, siblingData) => siblingData.sourceType === "custom-url",
        },
      },
    ],
  },
  {
    type: "row",
    fields: [
      {
        name: "useSourceHref",
        type: "checkbox",
        defaultValue: true,
      },
      {
        name: "overrideHref",
        type: "text",
      },
      {
        name: "summary",
        type: "text",
      },
    ],
  },
  {
    name: "resolvedLabel",
    type: "text",
    admin: {
      hidden: true,
      readOnly: true,
    },
  },
  {
    name: "resolvedHref",
    type: "text",
    admin: {
      hidden: true,
      readOnly: true,
    },
  },
];

export const NavigationMenus: CollectionConfig = defineCollection({
  slug: "navigation-menus",
  admin: {
    defaultColumns: ["internalCode", "title", "menuKey", "locale", "status"],
    group: "SEO",
    useAsTitle: "title",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validateNavigationMenu],
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
          name: "menuKey",
          type: "select",
          options: navigationMenuKeyOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "placement",
          type: "select",
          options: navigationPlacementOptions.map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "derivedFromHierarchy",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "publicDescription",
          type: "text",
        },
      ],
    },
    {
      name: "items",
      type: "array",
      fields: [
        ...childMenuItemFields,
        {
          name: "children",
          type: "array",
          fields: childMenuItemFields,
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
