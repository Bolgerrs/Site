import type { Payload } from "payload";

type GenericRecord = Record<string, unknown>;

export type EditableSurfaceOwnerType =
  | "block"
  | "form"
  | "media"
  | "page"
  | "product"
  | "seo"
  | "translation";

export type EditableSurfaceFieldKind =
  | "button"
  | "form"
  | "media"
  | "seo"
  | "status"
  | "text"
  | "translation";

export type EditableSurfaceTarget = {
  fieldPath: string;
  locale?: string;
  ownerId: string;
  ownerType: EditableSurfaceOwnerType;
  pageId?: string;
  sourceId?: string;
};

export type EditableSurfaceField = {
  editHref: string;
  id: string;
  kind: EditableSurfaceFieldKind;
  label: string;
  target: EditableSurfaceTarget;
  valuePreview: string;
};

export type EditableSurfaceBlock = {
  editHref: string;
  fields: EditableSurfaceField[];
  id: string;
  label: string;
  order: number;
  type: string;
  visible: boolean;
};

export type EditableSurfaceRoute = {
  blocks: EditableSurfaceBlock[];
  editHref: string;
  fields: EditableSurfaceField[];
  id: string;
  kind: "contact" | "page" | "product" | "request";
  label: string;
  liveUrl: string;
  locale: string;
  previewUrl: string;
  routePath: string;
  summary: {
    blocks: number;
    buttons: number;
    fields: number;
    forms: number;
    media: number;
    seo: number;
    translations: number;
  };
};

export type EditableSurfaceUsage = {
  blockId?: string;
  blockLabel?: string;
  editHref: string;
  fieldId: string;
  fieldLabel: string;
  id: string;
  kind: EditableSurfaceFieldKind;
  liveUrl: string;
  routeId: string;
  routeLabel: string;
  routePath: string;
  sourceId: string;
  valuePreview: string;
};

export type EditableSurfaceRegistry = {
  generatedAt: string;
  routes: EditableSurfaceRoute[];
  summary: {
    buttons: number;
    fields: number;
    forms: number;
    media: number;
    routes: number;
    seo: number;
    translations: number;
  };
  usageIndex: EditableSurfaceUsage[];
};

type RegistryInput = {
  routePath?: string | null;
  routePaths?: string[] | null;
};

type EditableHrefInput = {
  fieldPath?: string | null;
  ownerId?: number | string | null;
  ownerType: EditableSurfaceOwnerType;
  pageId?: number | string | null;
};

type UsageQuery = {
  kind?: EditableSurfaceFieldKind;
  routePath?: string;
  sourceId?: string;
  value?: string;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function getArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toRecord(value: unknown) {
  return value && typeof value === "object" ? (value as GenericRecord) : null;
}

function getId(value: unknown): number | string | null {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return null;
}

function normalizePath(path: string) {
  const trimmed = path.trim() || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function getPublicSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://89.150.34.66:8093").replace(/\/+$/, "");
}

function normalizeLocalePath(path: string, locale: string) {
  const normalizedPath = normalizePath(path);
  const localePrefix = `/${locale}`;

  if (normalizedPath === localePrefix || normalizedPath.startsWith(`${localePrefix}/`)) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return localePrefix;
  }

  return `${localePrefix}${normalizedPath}`;
}

function getPageRoutePath(page: GenericRecord) {
  return normalizePath(getText(page.routePath) || getText(page.canonicalPath) || "/");
}

function getPageLabel(page: GenericRecord) {
  return getText(page.title) || getText(page.navigationLabel) || getText(page.slug) || "Страница";
}

function getProductLabel(product: GenericRecord) {
  return getText(product.name) || getText(product.publicLabel) || getText(product.slug) || "Продукт";
}

function getProductRoutePath(product: GenericRecord) {
  return normalizePath(getText(product.canonicalPath) || `/products/${getText(product.slug) || getId(product.id) || ""}`);
}

function getRecordKey(record: GenericRecord) {
  return getText(record.slug) || getText(record.internalCode) || String(getId(record.id) ?? "");
}

function normalizeSourceText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function previewValue(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

function createSearchHref(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function getProductEditorPanel(fieldPath: string) {
  switch (fieldPath) {
    case "heroAsset":
    case "coverCardAsset":
    case "media":
      return "media";
    case "inquiryForm":
    case "form":
      return "form";
    case "category":
    case "direction":
    case "line":
      return "category";
    case "seo":
    case "publicationReadiness":
      return "seo";
    case "translation":
    case "translations":
      return "translations";
    case "publication":
    case "status":
    case "checks":
      return "publish";
    default:
      return "";
  }
}

export function buildEditableFieldHref(input: EditableHrefInput) {
  const ownerId = input.ownerId == null ? "" : String(input.ownerId);
  const pageId = input.pageId == null ? "" : String(input.pageId);
  const fieldPath = input.fieldPath?.trim() ?? "";

  switch (input.ownerType) {
    case "page":
      return createSearchHref("/admin/site", { focus: fieldPath, selected: ownerId });
    case "block":
      return createSearchHref("/admin/site", { block: ownerId, focus: fieldPath, selected: pageId });
    case "product":
      return createSearchHref("/admin/products", {
        focus: fieldPath,
        panel: getProductEditorPanel(fieldPath),
        product: ownerId,
      });
    case "form":
      return createSearchHref("/admin/site-admin", { focus: fieldPath, section: "forms", selected: ownerId });
    case "media":
      return createSearchHref("/admin/media", { focus: fieldPath, selected: ownerId });
    case "seo":
      return createSearchHref("/admin/site-admin", { focus: fieldPath, section: "seo", selected: ownerId });
    case "translation":
      return createSearchHref("/admin/translations", { focus: fieldPath, selected: ownerId });
  }
}

function createField(input: {
  id: string;
  kind: EditableSurfaceFieldKind;
  label: string;
  locale?: string;
  ownerId: number | string;
  ownerType: EditableSurfaceOwnerType;
  pageId?: number | string | null;
  sourceId?: string;
  value: string;
}): EditableSurfaceField {
  const ownerId = String(input.ownerId);
  const target = {
    fieldPath: input.id,
    ...(input.locale ? { locale: input.locale } : {}),
    ownerId,
    ownerType: input.ownerType,
    ...(input.pageId != null ? { pageId: String(input.pageId) } : {}),
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
  } satisfies EditableSurfaceTarget;

  return {
    editHref: buildEditableFieldHref({
      fieldPath: input.id,
      ownerId,
      ownerType: input.ownerType,
      ...(input.pageId != null ? { pageId: input.pageId } : {}),
    }),
    id: `${input.ownerType}:${ownerId}:${input.id}`,
    kind: input.kind,
    label: input.label,
    target,
    valuePreview: previewValue(input.value),
  };
}

function addTextField(fields: EditableSurfaceField[], input: Omit<Parameters<typeof createField>[0], "kind" | "sourceId">) {
  const value = input.value.trim();
  if (!value) {
    return;
  }

  fields.push(
    createField({
      ...input,
      kind: "text",
      sourceId: normalizeSourceText(value),
      value,
    }),
  );
}

function addMediaField(
  fields: EditableSurfaceField[],
  input: Omit<Parameters<typeof createField>[0], "kind" | "sourceId" | "value"> & {
    mediaId: number | string | null;
    mediaLabel?: string;
  },
) {
  if (input.mediaId == null) {
    return;
  }

  fields.push(
    createField({
      ...input,
      kind: "media",
      sourceId: String(input.mediaId),
      value: input.mediaLabel || `Media ${input.mediaId}`,
    }),
  );
}

function addButtonField(fields: EditableSurfaceField[], input: Omit<Parameters<typeof createField>[0], "kind" | "sourceId">) {
  const value = input.value.trim();
  if (!value) {
    return;
  }

  fields.push(
    createField({
      ...input,
      kind: "button",
      sourceId: normalizeSourceText(value),
      value,
    }),
  );
}

function summarizeRoute(fields: EditableSurfaceField[], blocks: EditableSurfaceBlock[]) {
  const allFields = [...fields, ...blocks.flatMap((block) => block.fields)];

  return {
    blocks: blocks.length,
    buttons: allFields.filter((field) => field.kind === "button").length,
    fields: allFields.length,
    forms: allFields.filter((field) => field.kind === "form").length,
    media: allFields.filter((field) => field.kind === "media").length,
    seo: allFields.filter((field) => field.kind === "seo").length,
    translations: allFields.filter((field) => field.kind === "translation").length,
  };
}

function buildRouteUsage(route: EditableSurfaceRoute): EditableSurfaceUsage[] {
  const usages: EditableSurfaceUsage[] = [];

  function push(field: EditableSurfaceField, block?: EditableSurfaceBlock) {
    const sourceId =
      field.target.sourceId ||
      (field.kind === "text" || field.kind === "button" ? normalizeSourceText(field.valuePreview) : field.valuePreview);

    usages.push({
      ...(block ? { blockId: block.id, blockLabel: block.label } : {}),
      editHref: field.editHref,
      fieldId: field.id,
      fieldLabel: field.label,
      id: `${route.id}:${field.id}`,
      kind: field.kind,
      liveUrl: route.liveUrl,
      routeId: route.id,
      routeLabel: route.label,
      routePath: route.routePath,
      sourceId,
      valuePreview: field.valuePreview,
    });
  }

  route.fields.forEach((field) => push(field));
  route.blocks.forEach((block) => block.fields.forEach((field) => push(field, block)));

  return usages;
}

function getSectionLabel(section: GenericRecord, index: number) {
  return getText(section.previewLabel) || getText(section.title) || getText(section.sectionKey) || `Блок ${index + 1}`;
}

function getRelationMap(records: GenericRecord[]) {
  const map = new Map<string, GenericRecord>();
  for (const record of records) {
    const id = getId(record.id);
    if (id != null) {
      map.set(String(id), record);
    }
  }
  return map;
}

function makeMediaLabel(mediaById: Map<string, GenericRecord>, id: number | string | null) {
  if (id == null) {
    return "";
  }

  const media = mediaById.get(String(id));
  return getText(media?.assetTitle) || getText(media?.filename) || `Media ${id}`;
}

function findOwnerEntries(records: GenericRecord[], input: {
  ownerIds: Array<number | string | null>;
  ownerKeys: string[];
  ownerType?: string;
}) {
  const ownerIds = new Set(input.ownerIds.filter((id): id is number | string => id != null).map(String));
  const ownerKeys = new Set(input.ownerKeys.filter(Boolean));

  return records.filter((record) => {
    if (input.ownerType && getText(record.ownerType) && getText(record.ownerType) !== input.ownerType) {
      return false;
    }

    for (const value of [record.ownerPage, record.ownerProduct, record.ownerForm, record.ownerCategory]) {
      const id = getId(value);
      if (id != null && ownerIds.has(String(id))) {
        return true;
      }
    }

    const ownerRecordKey = getText(record.ownerRecordKey);
    return ownerRecordKey ? ownerKeys.has(ownerRecordKey) : false;
  });
}

function buildPageBlocks(input: {
  mediaById: Map<string, GenericRecord>;
  page: GenericRecord;
  sectionsById: Map<string, GenericRecord>;
}) {
  const pageId = getId(input.page.id);
  const rows = getArray<GenericRecord>(input.page.sections);

  return rows
    .map((row, index) => {
      const sectionId = getId(row.section);
      if (sectionId == null) {
        return null;
      }

      const section = input.sectionsById.get(String(sectionId));
      if (!section) {
        return null;
      }

      const fields: EditableSurfaceField[] = [];
      const heroContent = toRecord(section.heroContent);
      const ctaContent = toRecord(section.ctaContent);

      addTextField(fields, {
        id: "title",
        label: "Заголовок блока",
        ownerId: sectionId,
        ownerType: "block",
        pageId,
        value: getText(section.title),
      });
      addTextField(fields, {
        id: "lead",
        label: "Короткое описание блока",
        ownerId: sectionId,
        ownerType: "block",
        pageId,
        value: getText(section.lead),
      });
      addTextField(fields, {
        id: "body",
        label: "Основной текст блока",
        ownerId: sectionId,
        ownerType: "block",
        pageId,
        value: getText(section.body),
      });
      addTextField(fields, {
        id: "heroContent.supportingLabel",
        label: "Подпись hero-блока",
        ownerId: sectionId,
        ownerType: "block",
        pageId,
        value: getText(heroContent?.supportingLabel),
      });
      addMediaField(fields, {
        id: "heroContent.heroMedia",
        label: "Изображение блока",
        mediaId: getId(heroContent?.heroMedia),
        mediaLabel: makeMediaLabel(input.mediaById, getId(heroContent?.heroMedia)),
        ownerId: sectionId,
        ownerType: "block",
        pageId,
      });
      addButtonField(fields, {
        id: "ctaContent.primaryLabel",
        label: "Основная кнопка блока",
        ownerId: sectionId,
        ownerType: "block",
        pageId,
        value: getText(ctaContent?.primaryLabel) || getText(ctaContent?.primaryTarget),
      });

      getArray<GenericRecord>(section.galleryItems).forEach((item, galleryIndex) => {
        const assetId = getId(item.asset);
        addMediaField(fields, {
          id: `galleryItems.${galleryIndex}.asset`,
          label: `Галерея ${galleryIndex + 1}`,
          mediaId: assetId,
          mediaLabel: makeMediaLabel(input.mediaById, assetId),
          ownerId: sectionId,
          ownerType: "block",
          pageId,
        });
      });

      return {
        editHref: buildEditableFieldHref({
          fieldPath: "block",
          ownerId: sectionId,
          ownerType: "block",
          pageId,
        }),
        fields,
        id: String(sectionId),
        label: getSectionLabel(section, index),
        order: getNumber(row.order) || index * 10 + 10,
        type: getText(section.sectionType) || "section",
        visible: row.visible !== false,
      } satisfies EditableSurfaceBlock;
    })
    .filter((entry): entry is EditableSurfaceBlock => Boolean(entry))
    .sort((left, right) => left.order - right.order);
}

async function loadRegistryRecords(payload: Payload) {
  const [pagesResult, sectionsResult, productsResult, formsResult, seoResult, translationsResult, mediaResult] =
    await Promise.all([
      payload.find({
        collection: "pages",
        depth: 0,
        limit: 300,
        overrideAccess: true,
        pagination: false,
        sort: "routePath",
      }),
      payload.find({
        collection: "page-sections",
        depth: 0,
        limit: 600,
        overrideAccess: true,
        pagination: false,
        sort: "updatedAt",
      }),
      payload.find({
        collection: "products",
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
        sort: "slug",
      }),
      payload.find({
        collection: "productInquiryForms",
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
        sort: "slug",
      }),
      payload.find({
        collection: "seo-entries",
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
        sort: "routePath",
      }),
      payload.find({
        collection: "translations",
        depth: 0,
        limit: 700,
        overrideAccess: true,
        pagination: false,
        sort: "ownerLabelSnapshot",
      }),
      payload.find({
        collection: "media-assets",
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
        sort: "assetTitle",
      }),
    ]);

  return {
    forms: formsResult.docs as unknown as GenericRecord[],
    media: mediaResult.docs as unknown as GenericRecord[],
    pages: pagesResult.docs as unknown as GenericRecord[],
    products: productsResult.docs as unknown as GenericRecord[],
    sections: sectionsResult.docs as unknown as GenericRecord[],
    seo: seoResult.docs as unknown as GenericRecord[],
    translations: translationsResult.docs as unknown as GenericRecord[],
  };
}

function buildPageRoute(input: {
  forms: GenericRecord[];
  mediaById: Map<string, GenericRecord>;
  page: GenericRecord;
  sectionsById: Map<string, GenericRecord>;
  seo: GenericRecord[];
  translations: GenericRecord[];
}) {
  const pageId = getId(input.page.id);
  if (pageId == null) {
    return null;
  }

  const locale = getText(input.page.primaryLocale) || "en";
  const routePath = getPageRoutePath(input.page);
  const ownerKeys = [getRecordKey(input.page), getText(input.page.internalCode), getText(input.page.slug)];
  const seoEntries = findOwnerEntries(input.seo, {
    ownerIds: [pageId],
    ownerKeys,
    ownerType: "page",
  });
  const translationEntries = findOwnerEntries(input.translations, {
    ownerIds: [pageId],
    ownerKeys,
  });
  const relatedProductIds = new Set(
    getArray<unknown>(input.page.relatedProducts)
      .map(getId)
      .filter((id): id is number | string => id != null)
      .map(String),
  );
  const relatedForms = input.forms.filter((form) => {
    const productId = getId(form.product);
    return productId != null && relatedProductIds.has(String(productId));
  });
  const fields: EditableSurfaceField[] = [];

  addTextField(fields, {
    id: "title",
    label: "Название страницы",
    locale,
    ownerId: pageId,
    ownerType: "page",
    value: getText(input.page.title),
  });
  addTextField(fields, {
    id: "heroSummary",
    label: "Короткое описание страницы",
    locale,
    ownerId: pageId,
    ownerType: "page",
    value: getText(input.page.heroSummary),
  });
  addTextField(fields, {
    id: "introBody",
    label: "Вводный текст страницы",
    locale,
    ownerId: pageId,
    ownerType: "page",
    value: getText(input.page.introBody),
  });
  addButtonField(fields, {
    id: "heroPrimaryCtaLabel",
    label: "Основная кнопка страницы",
    locale,
    ownerId: pageId,
    ownerType: "page",
    value: getText(input.page.heroPrimaryCtaLabel) || getText(input.page.heroPrimaryCtaTarget),
  });
  addButtonField(fields, {
    id: "heroSecondaryCtaLabel",
    label: "Вторая кнопка страницы",
    locale,
    ownerId: pageId,
    ownerType: "page",
    value: getText(input.page.heroSecondaryCtaLabel) || getText(input.page.heroSecondaryCtaTarget),
  });
  addMediaField(fields, {
    id: "heroMedia",
    label: "Главное изображение страницы",
    mediaId: getId(input.page.heroMedia),
    mediaLabel: makeMediaLabel(input.mediaById, getId(input.page.heroMedia)),
    ownerId: pageId,
    ownerType: "page",
  });
  addMediaField(fields, {
    id: "coverMedia",
    label: "Обложка страницы",
    mediaId: getId(input.page.coverMedia),
    mediaLabel: makeMediaLabel(input.mediaById, getId(input.page.coverMedia)),
    ownerId: pageId,
    ownerType: "page",
  });

  for (const form of relatedForms) {
    const formId = getId(form.id);
    if (formId != null) {
      fields.push(
        createField({
          id: "form",
          kind: "form",
          label: "Связанная форма",
          locale,
          ownerId: formId,
          ownerType: "form",
          sourceId: String(formId),
          value: getText(form.title) || getText(form.formTitle) || getText(form.slug) || `Форма ${formId}`,
        }),
      );
    }
  }

  for (const entry of seoEntries) {
    const seoId = getId(entry.id);
    if (seoId != null) {
      fields.push(
        createField({
          id: "metaTitle",
          kind: "seo",
          label: "SEO заголовок",
          locale: getText(entry.locale) || locale,
          ownerId: seoId,
          ownerType: "seo",
          sourceId: String(seoId),
          value: getText(entry.metaTitle) || getText(entry.ownerLabel) || `SEO ${seoId}`,
        }),
      );
    }
  }

  for (const entry of translationEntries) {
    const translationId = getId(entry.id);
    if (translationId != null) {
      fields.push(
        createField({
          id: "translatedText",
          kind: "translation",
          label: "Перевод текста",
          locale: getText(entry.locale) || getText(entry.targetLocale) || locale,
          ownerId: translationId,
          ownerType: "translation",
          sourceId: String(translationId),
          value: getText(entry.ownerLabelSnapshot) || getText(entry.sourceText) || `Перевод ${translationId}`,
        }),
      );
    }
  }

  const blocks = buildPageBlocks({
    mediaById: input.mediaById,
    page: input.page,
    sectionsById: input.sectionsById,
  });
  const route = {
    blocks,
    editHref: buildEditableFieldHref({ fieldPath: "overview", ownerId: pageId, ownerType: "page" }),
    fields,
    id: `page:${pageId}`,
    kind: routePath === "/contact" ? "contact" : "page",
    label: getPageLabel(input.page),
    liveUrl: `${getPublicSiteOrigin()}${normalizeLocalePath(routePath, locale)}`,
    locale,
    previewUrl: `${getPublicSiteOrigin()}${normalizeLocalePath(routePath, locale)}?preview=1`,
    routePath,
    summary: summarizeRoute(fields, blocks),
  } satisfies EditableSurfaceRoute;

  return route;
}

function buildProductRoute(input: {
  forms: GenericRecord[];
  mediaById: Map<string, GenericRecord>;
  product: GenericRecord;
  seo: GenericRecord[];
  translations: GenericRecord[];
}) {
  const productId = getId(input.product.id);
  if (productId == null) {
    return null;
  }

  const locale = getText(input.product.primaryLocale) || "en";
  const routePath = getProductRoutePath(input.product);
  const slug = getText(input.product.slug);
  const fields: EditableSurfaceField[] = [];
  const ownerKeys = [getRecordKey(input.product), getText(input.product.internalCode), slug];
  const seoEntries = findOwnerEntries(input.seo, {
    ownerIds: [productId],
    ownerKeys,
    ownerType: "product",
  });
  const translationEntries = findOwnerEntries(input.translations, {
    ownerIds: [productId],
    ownerKeys,
  });
  const forms = input.forms.filter((form) => {
    const formProductId = getId(form.product);
    return formProductId != null && String(formProductId) === String(productId);
  });

  addTextField(fields, {
    id: "name",
    label: "Название продукта",
    locale,
    ownerId: productId,
    ownerType: "product",
    value: getProductLabel(input.product),
  });
  addTextField(fields, {
    id: "shortDescription",
    label: "Короткое описание продукта",
    locale,
    ownerId: productId,
    ownerType: "product",
    value: getText(input.product.shortDescription),
  });
  addTextField(fields, {
    id: "longDescription",
    label: "Основной текст продукта",
    locale,
    ownerId: productId,
    ownerType: "product",
    value: getText(input.product.longDescription) || getText(input.product.editorialSummary),
  });
  addMediaField(fields, {
    id: "heroAsset",
    label: "Главное изображение продукта",
    mediaId: getId(input.product.heroAsset),
    mediaLabel: makeMediaLabel(input.mediaById, getId(input.product.heroAsset)),
    ownerId: productId,
    ownerType: "product",
  });
  addMediaField(fields, {
    id: "coverCardAsset",
    label: "Карточка продукта",
    mediaId: getId(input.product.coverCardAsset),
    mediaLabel: makeMediaLabel(input.mediaById, getId(input.product.coverCardAsset)),
    ownerId: productId,
    ownerType: "product",
  });
  fields.push(
    createField({
      id: "request",
      kind: "button",
      label: "Кнопка заявки",
      locale,
      ownerId: productId,
      ownerType: "product",
      sourceId: `/request/${slug}`,
      value: `/request/${slug}`,
    }),
  );

  for (const form of forms) {
    const formId = getId(form.id);
    if (formId != null) {
      fields.push(
        createField({
          id: "form",
          kind: "form",
          label: "Форма продукта",
          locale,
          ownerId: formId,
          ownerType: "form",
          sourceId: String(formId),
          value: getText(form.title) || getText(form.formTitle) || getText(form.slug) || `Форма ${formId}`,
        }),
      );
    }
  }

  for (const entry of seoEntries) {
    const seoId = getId(entry.id);
    if (seoId != null) {
      fields.push(
        createField({
          id: "metaTitle",
          kind: "seo",
          label: "SEO заголовок",
          locale: getText(entry.locale) || locale,
          ownerId: seoId,
          ownerType: "seo",
          sourceId: String(seoId),
          value: getText(entry.metaTitle) || getText(entry.ownerLabel) || `SEO ${seoId}`,
        }),
      );
    }
  }

  for (const entry of translationEntries) {
    const translationId = getId(entry.id);
    if (translationId != null) {
      fields.push(
        createField({
          id: "translatedText",
          kind: "translation",
          label: "Перевод продукта",
          locale: getText(entry.locale) || getText(entry.targetLocale) || locale,
          ownerId: translationId,
          ownerType: "translation",
          sourceId: String(translationId),
          value: getText(entry.ownerLabelSnapshot) || getText(entry.sourceText) || `Перевод ${translationId}`,
        }),
      );
    }
  }

  const route = {
    blocks: [],
    editHref: buildEditableFieldHref({ fieldPath: "overview", ownerId: productId, ownerType: "product" }),
    fields,
    id: `product:${productId}`,
    kind: "product",
    label: getProductLabel(input.product),
    liveUrl: `${getPublicSiteOrigin()}${normalizeLocalePath(routePath, locale)}`,
    locale,
    previewUrl: `${getPublicSiteOrigin()}${normalizeLocalePath(routePath, locale)}?preview=1`,
    routePath,
    summary: summarizeRoute(fields, []),
  } satisfies EditableSurfaceRoute;

  return route;
}

export async function getEditableSurfaceRegistry(
  payload: Payload,
  input: RegistryInput = {},
): Promise<EditableSurfaceRegistry> {
  const records = await loadRegistryRecords(payload);
  const sectionsById = getRelationMap(records.sections);
  const mediaById = getRelationMap(records.media);
  const pageRoutes: EditableSurfaceRoute[] = records.pages.flatMap((page) => {
    const route = buildPageRoute({
      forms: records.forms,
      mediaById,
      page,
      sectionsById,
      seo: records.seo,
      translations: records.translations,
    });

    return route ? [route] : [];
  });
  const productRoutes: EditableSurfaceRoute[] = records.products.flatMap((product) => {
    const route = buildProductRoute({
      forms: records.forms,
      mediaById,
      product,
      seo: records.seo,
      translations: records.translations,
    });

    return route ? [route] : [];
  });
  const routes = [...pageRoutes, ...productRoutes].sort((left, right) =>
    left.routePath.localeCompare(right.routePath, "ru"),
  );

  const filterPaths = new Set(
    [input.routePath ?? "", ...(input.routePaths ?? [])]
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => normalizePath(entry)),
  );
  const filteredRoutes = filterPaths.size
    ? routes.filter((route) => filterPaths.has(normalizePath(route.routePath)))
    : routes;
  const usageIndex = filteredRoutes.flatMap(buildRouteUsage);

  return {
    generatedAt: new Date().toISOString(),
    routes: filteredRoutes,
    summary: {
      buttons: filteredRoutes.reduce((total, route) => total + route.summary.buttons, 0),
      fields: filteredRoutes.reduce((total, route) => total + route.summary.fields, 0),
      forms: filteredRoutes.reduce((total, route) => total + route.summary.forms, 0),
      media: filteredRoutes.reduce((total, route) => total + route.summary.media, 0),
      routes: filteredRoutes.length,
      seo: filteredRoutes.reduce((total, route) => total + route.summary.seo, 0),
      translations: filteredRoutes.reduce((total, route) => total + route.summary.translations, 0),
    },
    usageIndex,
  };
}

export function findEditableSurfaceUsage(registry: EditableSurfaceRegistry, query: UsageQuery) {
  const normalizedValue = query.value ? normalizeSourceText(query.value) : "";

  return registry.usageIndex.filter((usage) => {
    if (query.kind && usage.kind !== query.kind) {
      return false;
    }
    if (query.routePath && normalizePath(usage.routePath) !== normalizePath(query.routePath)) {
      return false;
    }
    if (query.sourceId && usage.sourceId !== query.sourceId) {
      return false;
    }
    if (normalizedValue && usage.sourceId !== normalizedValue && !normalizeSourceText(usage.valuePreview).includes(normalizedValue)) {
      return false;
    }

    return true;
  });
}

export function assertNoRawSurfaceRegistryLabels(registry: EditableSurfaceRegistry) {
  const forbidden = /\b(payload|collection|record|schema|relation|raw|route path|ownerRecordKey|productInquiryForms|pageSections)\b/i;
  const labels = [
    ...registry.routes.map((route) => route.label),
    ...registry.routes.flatMap((route) => route.fields.map((field) => field.label)),
    ...registry.routes.flatMap((route) => route.blocks.map((block) => block.label)),
    ...registry.routes.flatMap((route) => route.blocks.flatMap((block) => block.fields.map((field) => field.label))),
  ];

  return labels.filter((label) => forbidden.test(label));
}
