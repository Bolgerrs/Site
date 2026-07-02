import type { Payload, Where } from "payload";

import type { AdminLocale } from "./locales.ts";
import {
  getPublicNavigationMenu,
  getPublicSiteSettings,
  listPublicSeoEntries,
  type PublicNavigationMenu,
  type PublicSeoEntry,
  type PublicSiteSettings,
} from "./public-site.ts";

export type PublicCmsMediaAsset = {
  altText?: string;
  caption?: string;
  id: string;
  src: string;
};

export type PublicCmsDirection = {
  coverCardMedia?: PublicCmsMediaAsset;
  heroMedia?: PublicCmsMediaAsset;
  id: string;
  keyDifferentiators?: string[];
  name: string;
  navigationLabel?: string;
  order: number;
  positioningStatement?: string;
  publicLabel?: string;
  routePath: string;
  seo: {
    description: string;
    locale: string;
    routePath: string;
    title: string;
  };
  shortDescription: string;
  signatureUseCases?: string[];
  slug: string;
  status: "published";
  tagline?: string;
};

export type PublicCmsCategory = {
  description: string;
  directionSlug: string;
  id: string;
  label: string;
  order: number;
  routePath: string;
  slug: string;
  status: "published";
};

export type PublicCmsPageSection = {
  body?: string;
  ctaContent?: {
    primaryLabel: string;
    primaryTarget: string;
    secondaryLabel?: string;
    secondaryTarget?: string;
  };
  eyebrow?: string;
  heroContent?: {
    supportingLabel?: string;
  };
  heroMedia?: PublicCmsMediaAsset;
  id: string;
  journalDownloadsContent?: {
    linkLabel?: string;
    linkTarget?: string;
  };
  lead?: string;
  materialsStory?: Array<{
    material: string;
    narrative: string;
  }>;
  order: number;
  previewAnchor?: string;
  previewLabel: string;
  productGridContent?: {
    directionSlugs?: string[];
    gridMode?: string;
    maxItems?: number;
    productSlugs?: string[];
  };
  proofModules?: Array<{
    body: string;
    label: string;
  }>;
  sectionKey: string;
  sectionType: string;
  title?: string;
  visible: boolean;
};

export type PublicCmsPage = {
  eyebrow?: string;
  heroMedia?: PublicCmsMediaAsset;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaTarget?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaTarget?: string;
  heroSummary?: string;
  id: string;
  introBody?: string;
  navigationLabel?: string;
  navigationOrder: number;
  pageFamily: string;
  routePath: string;
  sectionPlan?: Array<{
    expectedType?: string;
    sectionKey: string;
  }>;
  sections?: PublicCmsPageSection[];
  seo: {
    description: string;
    locale: string;
    routePath: string;
    title: string;
  };
  showInFooter: boolean;
  showInHeader: boolean;
  slug: string;
  status: "published";
  title: string;
};

export type PublicCmsProduct = {
  availabilityMode: string;
  categorySlug?: string;
  coverCardMedia?: PublicCmsMediaAsset;
  directionSlug: string;
  heroMedia?: PublicCmsMediaAsset;
  id: string;
  inquiryRoutePath: string;
  lineSlug?: string;
  name: string;
  navigationLabel?: string;
  pdpSectionPlan: string[];
  positioningStatement?: string;
  publicLabel?: string;
  routePath: string;
  seo: {
    description: string;
    locale: string;
    routePath: string;
    title: string;
  };
  shortDescription: string;
  slug: string;
  status: "published";
  subtitle?: string;
  tagline?: string;
};

export type PublicCmsInquiryField = {
  fieldKey: string;
  fieldType:
    | "text"
    | "textarea"
    | "email"
    | "phone"
    | "select"
    | "multi-select"
    | "radio"
    | "checkbox"
    | "number"
    | "date"
    | "file-placeholder"
    | "hidden-context"
    | "consent";
  helperText?: string;
  label: string;
  leadMappingKey?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
  placeholder?: string;
  required: boolean;
  width?: "full" | "half" | "third";
};

export type PublicCmsInquiryForm = {
  consentProfile: string;
  consentText: string;
  description: string;
  fieldKeys: string[];
  fields: PublicCmsInquiryField[];
  formMode: string;
  id: string;
  locale: string;
  notificationEmails?: string[];
  notificationTemplateKey?: string;
  productSlug: string;
  slug: string;
  status: "published";
  submissionChannel: "cms-lead" | "cms-lead-plus-email" | "email-only-temp";
  submitLabel: string;
  successMessage: string;
  successTitle: string;
  title: string;
};

export type PublicCmsSnapshot = {
  categories: PublicCmsCategory[];
  directions: PublicCmsDirection[];
  inquiryForms: PublicCmsInquiryForm[];
  locale: string;
  navigationMenus: PublicNavigationMenu[];
  pages: PublicCmsPage[];
  products: PublicCmsProduct[];
  seoEntries: PublicSeoEntry[];
  siteSettings: PublicSiteSettings | null;
};

type PayloadMediaDoc = {
  approvalStatus?: string;
  altText?: string;
  audienceMode?: string;
  caption?: string;
  id?: number | string;
  publicationReadiness?: string;
  referenceOnlyNotProductionAsset?: boolean;
  rightsStatus?: string;
  status?: string;
  url?: string;
};

type PayloadDirectionDoc = {
  canonicalPath?: string;
  coverCardAsset?: PayloadMediaDoc | string | null;
  heroAsset?: PayloadMediaDoc | string | null;
  id?: string;
  keyDifferentiators?: Array<{ title?: string }>;
  name?: string;
  navigationLabel?: string;
  order?: number;
  positioningStatement?: string;
  publicLabel?: string;
  seo?: {
    description?: string;
    metaDescription?: string;
    metaTitle?: string;
    routePath?: string;
    title?: string;
  };
  shortDescription?: string;
  signatureUseCases?: Array<{ title?: string }>;
  slug?: string;
  tagline?: string;
};

type PayloadCategoryDoc = {
  canonicalPath?: string;
  description?: string;
  direction?: { canonicalPath?: string; slug?: string } | string;
  id?: string;
  name?: string;
  navigationLabel?: string;
  order?: number;
  publicLabel?: string;
  shortDescription?: string;
  slug?: string;
};

type PayloadPageSectionDoc = {
  body?: string;
  ctaContent?: {
    primaryLabel?: string;
    primaryTarget?: string;
    secondaryLabel?: string;
    secondaryTarget?: string;
  };
  eyebrow?: string;
  heroContent?: {
    heroMedia?: PayloadMediaDoc | string | null;
    supportingLabel?: string;
  };
  id?: string;
  journalDownloadsContent?: {
    linkLabel?: string;
    linkTarget?: string;
  };
  lead?: string;
  materialsStory?: Array<{
    material?: string;
    narrative?: string;
  }>;
  previewLabel?: string;
  productGridContent?: {
    directions?: Array<{ slug?: string } | string>;
    gridMode?: string;
    maxItems?: number;
    products?: Array<{ slug?: string } | string>;
  };
  proofModules?: Array<{
    body?: string;
    label?: string;
  }>;
  sectionKey?: string;
  sectionType?: string;
  title?: string;
};

type PayloadPageDoc = {
  eyebrow?: string;
  heroMedia?: PayloadMediaDoc | string | null;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaTarget?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaTarget?: string;
  heroSummary?: string;
  id?: string;
  introBody?: string;
  navigationLabel?: string;
  navigationOrder?: number;
  pageFamily?: string;
  routePath?: string;
  sectionPlan?: Array<{
    expectedType?: string;
    sectionKey?: string;
  }>;
  sections?: Array<{
    order?: number;
    previewAnchor?: string;
    section?: PayloadPageSectionDoc | string;
    visible?: boolean;
  }>;
  seo?: {
    description?: string;
    metaDescription?: string;
    metaTitle?: string;
    routePath?: string;
    title?: string;
  };
  showInFooter?: boolean;
  showInHeader?: boolean;
  slug?: string;
  title?: string;
};

type PayloadProductDoc = {
  availabilityMode?: string;
  canonicalPath?: string;
  category?: { slug?: string } | string | null;
  coverCardAsset?: PayloadMediaDoc | string | null;
  direction?: { slug?: string } | string;
  heroAsset?: PayloadMediaDoc | string | null;
  id?: string;
  line?: { slug?: string } | string | null;
  name?: string;
  navigationLabel?: string;
  pdpSectionPlan?: Array<string | { sectionKey?: string }>;
  positioningStatement?: string;
  publicLabel?: string;
  seo?: {
    description?: string;
    metaDescription?: string;
    metaTitle?: string;
    routePath?: string;
    title?: string;
  };
  shortDescription?: string;
  slug?: string;
  subtitle?: string;
  tagline?: string;
};

type PayloadFormDoc = {
  consentProfile?: string;
  consentText?: string;
  description?: string;
  fields?: Array<{
    fieldKey?: string;
    fieldType?: PublicCmsInquiryField["fieldType"];
    helperText?: string;
    label?: string;
    leadMappingKey?: string;
    options?: Array<{ label?: string; value?: string }>;
    placeholder?: string;
    required?: boolean;
    width?: "full" | "half" | "third";
  }>;
  formMode?: string;
  id?: string;
  locale?: string;
  notificationEmails?: Array<string | { email?: string }>;
  notificationTemplateKey?: string;
  product?: { slug?: string } | string;
  slug?: string;
  submissionChannel?: PublicCmsInquiryForm["submissionChannel"];
  submitLabel?: string;
  successMessage?: string;
  successTitle?: string;
  title?: string;
};

type PayloadListResponse<T> = {
  docs: T[];
};

type PublicCollection =
  | "product-directions"
  | "product-categories"
  | "pages"
  | "products"
  | "productInquiryForms";

const publicMenuKeys = ["primary-header", "products-mega", "footer-legal", "contact-surfaces"] as const;

function getSlug(value: { slug?: string } | string | null | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return value?.slug ?? "";
}

function getRelationPath(value: { canonicalPath?: string } | string | null | undefined) {
  if (!value || typeof value === "string") {
    return "";
  }

  return value.canonicalPath ?? "";
}

function getSeoRoutePath(
  seo:
    | {
        canonicalPath?: string;
        routePath?: string;
      }
    | undefined,
  fallback: string,
) {
  return seo?.canonicalPath || seo?.routePath || fallback;
}

function getSeoTitle(
  seo:
    | {
        title?: string;
        metaTitle?: string;
      }
    | undefined,
  fallback: string,
) {
  return seo?.title || seo?.metaTitle || fallback;
}

function getSeoDescription(
  seo:
    | {
        description?: string;
        metaDescription?: string;
      }
    | undefined,
  fallback: string,
) {
  return seo?.description || seo?.metaDescription || fallback;
}

function getTextArray(value: Array<{ title?: string }> | undefined) {
  return value?.map((entry) => entry.title?.trim() ?? "").filter(Boolean) ?? [];
}

function normalizePublicPath(path: string | undefined, fallback: string) {
  if (!path?.trim()) {
    return fallback;
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function isPublicSafeMediaAsset(
  asset: PayloadMediaDoc | string | null | undefined,
): asset is PayloadMediaDoc {
  if (!asset || typeof asset === "string") {
    return false;
  }

  if ((asset.status?.trim() ?? "") !== "published") {
    return false;
  }

  if ((asset.approvalStatus?.trim() ?? "") !== "approved") {
    return false;
  }

  if ((asset.publicationReadiness?.trim() ?? "") !== "production-ready") {
    return false;
  }

  if ((asset.rightsStatus?.trim() ?? "") === "reference-only") {
    return false;
  }

  if (asset.referenceOnlyNotProductionAsset === true) {
    return false;
  }

  if ((asset.audienceMode?.trim() ?? "") !== "public") {
    return false;
  }

  return true;
}

function mapMediaAsset(
  asset: PayloadMediaDoc | string | null | undefined,
): PublicCmsMediaAsset | null {
  if (!isPublicSafeMediaAsset(asset)) {
    return null;
  }

  const src = asset.url?.trim() ?? "";

  if (!src) {
    return null;
  }

  return {
    id: String(asset.id ?? src),
    src,
    ...(asset.altText ? { altText: asset.altText } : {}),
    ...(asset.caption ? { caption: asset.caption } : {}),
  };
}

function mapDirection(doc: PayloadDirectionDoc, locale: string): PublicCmsDirection {
  const routePath = doc.canonicalPath || getSeoRoutePath(doc.seo, `/${doc.slug ?? ""}`);
  const heroMedia = mapMediaAsset(doc.heroAsset);
  const coverCardMedia = mapMediaAsset(doc.coverCardAsset);

  return {
    id: doc.id ?? doc.slug ?? routePath,
    slug: doc.slug ?? "",
    name: doc.name ?? doc.slug ?? "Untitled direction",
    ...(doc.publicLabel ? { publicLabel: doc.publicLabel } : {}),
    ...(doc.navigationLabel ? { navigationLabel: doc.navigationLabel } : {}),
    ...(doc.tagline ? { tagline: doc.tagline } : {}),
    shortDescription: doc.shortDescription ?? "",
    ...(doc.positioningStatement ? { positioningStatement: doc.positioningStatement } : {}),
    ...(doc.signatureUseCases?.length
      ? { signatureUseCases: getTextArray(doc.signatureUseCases) }
      : {}),
    ...(doc.keyDifferentiators?.length
      ? { keyDifferentiators: getTextArray(doc.keyDifferentiators) }
      : {}),
    ...(heroMedia ? { heroMedia } : {}),
    ...(coverCardMedia ? { coverCardMedia } : {}),
    routePath,
    order: doc.order ?? 0,
    status: "published",
    seo: {
      title: getSeoTitle(doc.seo, `${doc.name ?? "Direction"} | Montelar`),
      description: getSeoDescription(doc.seo, doc.shortDescription ?? ""),
      routePath,
      locale,
    },
  };
}

function mapPageSection(
  item: NonNullable<PayloadPageDoc["sections"]>[number],
): PublicCmsPageSection | null {
  const sectionDoc =
    item.section && typeof item.section === "object"
      ? (item.section as PayloadPageSectionDoc)
      : null;

  if (!sectionDoc?.sectionKey || !sectionDoc.sectionType) {
    return null;
  }

  const heroMedia = mapMediaAsset(sectionDoc.heroContent?.heroMedia);

  return {
    id: sectionDoc.id ?? sectionDoc.sectionKey,
    sectionKey: sectionDoc.sectionKey,
    sectionType: sectionDoc.sectionType,
    previewLabel: sectionDoc.previewLabel ?? sectionDoc.title ?? sectionDoc.sectionKey,
    visible: item.visible ?? true,
    order: item.order ?? 0,
    ...(item.previewAnchor ? { previewAnchor: item.previewAnchor } : {}),
    ...(sectionDoc.title ? { title: sectionDoc.title } : {}),
    ...(sectionDoc.eyebrow ? { eyebrow: sectionDoc.eyebrow } : {}),
    ...(sectionDoc.lead ? { lead: sectionDoc.lead } : {}),
    ...(sectionDoc.body ? { body: sectionDoc.body } : {}),
    ...(sectionDoc.heroContent?.supportingLabel
      ? {
          heroContent: {
            supportingLabel: sectionDoc.heroContent.supportingLabel,
          },
        }
      : {}),
    ...(heroMedia ? { heroMedia } : {}),
    ...(sectionDoc.productGridContent
      ? {
          productGridContent: {
            ...(sectionDoc.productGridContent.gridMode
              ? { gridMode: sectionDoc.productGridContent.gridMode }
              : {}),
            ...(typeof sectionDoc.productGridContent.maxItems === "number"
              ? { maxItems: sectionDoc.productGridContent.maxItems }
              : {}),
            ...(sectionDoc.productGridContent.directions?.length
              ? {
                  directionSlugs: sectionDoc.productGridContent.directions
                    .map((entry) => getSlug(entry))
                    .filter(Boolean),
                }
              : {}),
            ...(sectionDoc.productGridContent.products?.length
              ? {
                  productSlugs: sectionDoc.productGridContent.products
                    .map((entry) => getSlug(entry))
                    .filter(Boolean),
                }
              : {}),
          },
        }
      : {}),
    ...(sectionDoc.proofModules?.length
      ? {
          proofModules: sectionDoc.proofModules
            .filter((module) => module.label && module.body)
            .map((module) => ({
              body: module.body as string,
              label: module.label as string,
            })),
        }
      : {}),
    ...(sectionDoc.materialsStory?.length
      ? {
          materialsStory: sectionDoc.materialsStory
            .filter((story) => story.material && story.narrative)
            .map((story) => ({
              material: story.material as string,
              narrative: story.narrative as string,
            })),
        }
      : {}),
    ...(sectionDoc.ctaContent?.primaryLabel && sectionDoc.ctaContent.primaryTarget
      ? {
          ctaContent: {
            primaryLabel: sectionDoc.ctaContent.primaryLabel,
            primaryTarget: normalizePublicPath(sectionDoc.ctaContent.primaryTarget, "/contact"),
            ...(sectionDoc.ctaContent.secondaryLabel
              ? { secondaryLabel: sectionDoc.ctaContent.secondaryLabel }
              : {}),
            ...(sectionDoc.ctaContent.secondaryTarget
              ? {
                  secondaryTarget: normalizePublicPath(
                    sectionDoc.ctaContent.secondaryTarget,
                    "/",
                  ),
                }
              : {}),
          },
        }
      : {}),
    ...(sectionDoc.journalDownloadsContent
      ? {
          journalDownloadsContent: {
            ...(sectionDoc.journalDownloadsContent.linkLabel
              ? { linkLabel: sectionDoc.journalDownloadsContent.linkLabel }
              : {}),
            ...(sectionDoc.journalDownloadsContent.linkTarget
              ? {
                  linkTarget: normalizePublicPath(
                    sectionDoc.journalDownloadsContent.linkTarget,
                    "/downloads",
                  ),
                }
              : {}),
          },
        }
      : {}),
  };
}

function mapPage(doc: PayloadPageDoc, locale: string): PublicCmsPage {
  const routePath = doc.routePath ?? `/${doc.slug ?? ""}`;
  const heroMedia = mapMediaAsset(doc.heroMedia);
  const sections =
    doc.sections
      ?.map((item) => mapPageSection(item))
      .filter((item): item is PublicCmsPageSection => item !== null)
      .sort((left, right) => left.order - right.order) ?? [];
  const sectionPlan =
    doc.sectionPlan
      ?.filter((entry) => entry.sectionKey)
      .map((entry) => ({
        sectionKey: entry.sectionKey as string,
        ...(entry.expectedType ? { expectedType: entry.expectedType } : {}),
      })) ?? [];

  return {
    id: doc.id ?? doc.slug ?? routePath,
    slug: doc.slug ?? "",
    title: doc.title ?? doc.slug ?? "Untitled page",
    ...(doc.navigationLabel ? { navigationLabel: doc.navigationLabel } : {}),
    ...(doc.eyebrow ? { eyebrow: doc.eyebrow } : {}),
    ...(doc.heroSummary ? { heroSummary: doc.heroSummary } : {}),
    ...(doc.introBody ? { introBody: doc.introBody } : {}),
    ...(doc.heroPrimaryCtaLabel ? { heroPrimaryCtaLabel: doc.heroPrimaryCtaLabel } : {}),
    ...(doc.heroPrimaryCtaTarget
      ? { heroPrimaryCtaTarget: normalizePublicPath(doc.heroPrimaryCtaTarget, "/contact") }
      : {}),
    ...(doc.heroSecondaryCtaLabel ? { heroSecondaryCtaLabel: doc.heroSecondaryCtaLabel } : {}),
    ...(doc.heroSecondaryCtaTarget
      ? { heroSecondaryCtaTarget: normalizePublicPath(doc.heroSecondaryCtaTarget, "/") }
      : {}),
    ...(heroMedia ? { heroMedia } : {}),
    routePath,
    pageFamily: doc.pageFamily ?? "page",
    showInHeader: doc.showInHeader ?? false,
    showInFooter: doc.showInFooter ?? false,
    navigationOrder: doc.navigationOrder ?? 0,
    ...(sectionPlan.length ? { sectionPlan } : {}),
    ...(sections.length ? { sections } : {}),
    status: "published",
    seo: {
      title: getSeoTitle(doc.seo, `${doc.title ?? "Page"} | Montelar`),
      description: getSeoDescription(doc.seo, doc.heroSummary ?? ""),
      routePath,
      locale,
    },
  };
}

function mapProduct(doc: PayloadProductDoc, locale: string): PublicCmsProduct {
  const routePath = doc.canonicalPath ?? getSeoRoutePath(doc.seo, `/products/${doc.slug ?? ""}`);
  const productSlug = doc.slug ?? "";
  const heroMedia = mapMediaAsset(doc.heroAsset);
  const coverCardMedia = mapMediaAsset(doc.coverCardAsset);

  return {
    id: doc.id ?? productSlug,
    slug: productSlug,
    name: doc.name ?? productSlug,
    ...(doc.publicLabel ? { publicLabel: doc.publicLabel } : {}),
    ...(doc.navigationLabel ? { navigationLabel: doc.navigationLabel } : {}),
    ...(doc.subtitle ? { subtitle: doc.subtitle } : {}),
    ...(doc.tagline ? { tagline: doc.tagline } : {}),
    shortDescription: doc.shortDescription ?? "",
    ...(doc.positioningStatement ? { positioningStatement: doc.positioningStatement } : {}),
    ...(heroMedia ? { heroMedia } : {}),
    ...(coverCardMedia ? { coverCardMedia } : {}),
    directionSlug: getSlug(doc.direction),
    ...(getSlug(doc.category) ? { categorySlug: getSlug(doc.category) } : {}),
    ...(getSlug(doc.line) ? { lineSlug: getSlug(doc.line) } : {}),
    routePath,
    inquiryRoutePath: `/request/${productSlug}`,
    availabilityMode: doc.availabilityMode ?? "by-request",
    pdpSectionPlan:
      doc.pdpSectionPlan?.map((section) =>
        typeof section === "string" ? section : section.sectionKey ?? "section",
      ) ?? [],
    status: "published",
    seo: {
      title: getSeoTitle(doc.seo, `${doc.name ?? "Product"} | Montelar`),
      description: getSeoDescription(doc.seo, doc.shortDescription ?? ""),
      routePath,
      locale,
    },
  };
}

function mapPublicInquiryForm(doc: PayloadFormDoc, locale: string): PublicCmsInquiryForm {
  const fields =
    doc.fields?.map((field) => {
      const options =
        field.options
          ?.filter((option) => option.value && option.label)
          .map((option) => ({
            value: option.value as string,
            label: option.label as string,
          })) ?? [];

      return {
        fieldKey: field.fieldKey ?? "field",
        fieldType: field.fieldType ?? "text",
        label: field.label ?? field.fieldKey ?? "Field",
        required: field.required ?? false,
        ...(field.helperText ? { helperText: field.helperText } : {}),
        ...(field.placeholder ? { placeholder: field.placeholder } : {}),
        ...(field.width ? { width: field.width } : {}),
        ...(options.length ? { options } : {}),
      };
    }) ?? [];

  return {
    id: doc.id ?? doc.slug ?? "form",
    slug: doc.slug ?? "",
    productSlug: getSlug(doc.product),
    locale,
    formMode: doc.formMode ?? "product-inquiry",
    submissionChannel:
      doc.submissionChannel === "cms-lead-plus-email" || doc.submissionChannel === "email-only-temp"
        ? doc.submissionChannel
        : "cms-lead",
    consentProfile: doc.consentProfile ?? "product-inquiry-default",
    consentText: doc.consentText ?? "I agree to the privacy review and advisory follow-up.",
    title: doc.title ?? "Request information",
    description: doc.description ?? "",
    submitLabel: doc.submitLabel ?? "Submit",
    successTitle: doc.successTitle ?? "Submitted",
    successMessage: doc.successMessage ?? "",
    fields,
    fieldKeys: fields.map((field) => field.fieldKey),
    status: "published",
  };
}

function mapInternalInquiryForm(doc: PayloadFormDoc, locale: string): PublicCmsInquiryForm {
  const publicForm = mapPublicInquiryForm(doc, locale);
  const fields =
    doc.fields?.map((field) => {
      const options =
        field.options
          ?.filter((option) => option.value && option.label)
          .map((option) => ({
            value: option.value as string,
            label: option.label as string,
          })) ?? [];

      return {
        fieldKey: field.fieldKey ?? "field",
        fieldType: field.fieldType ?? "text",
        label: field.label ?? field.fieldKey ?? "Field",
        required: field.required ?? false,
        ...(field.leadMappingKey ? { leadMappingKey: field.leadMappingKey } : {}),
        ...(field.helperText ? { helperText: field.helperText } : {}),
        ...(field.placeholder ? { placeholder: field.placeholder } : {}),
        ...(field.width ? { width: field.width } : {}),
        ...(options.length ? { options } : {}),
      };
    }) ?? [];

  return {
    ...publicForm,
    fields,
    fieldKeys: fields.map((field) => field.fieldKey),
    notificationEmails:
      doc.notificationEmails
        ?.map((entry) => (typeof entry === "string" ? entry : entry.email ?? ""))
        .filter(Boolean) ?? [],
    ...(doc.notificationTemplateKey
      ? { notificationTemplateKey: doc.notificationTemplateKey }
      : {}),
  };
}

async function findPublishedDocs<T>(
  payload: Payload,
  collection: PublicCollection,
  locale: string,
  where?: Where,
): Promise<T[]> {
  const result = (await payload.find({
    collection,
    depth: 2,
    draft: false,
    limit: 500,
    locale: locale as AdminLocale,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          status: {
            equals: "published",
          },
        },
        ...(where ? [where] : []),
      ],
    },
  })) as unknown as PayloadListResponse<T>;

  return result.docs;
}

async function listPublicNavigationMenus(
  payload: Payload,
  locale: string,
): Promise<PublicNavigationMenu[]> {
  const menus = await Promise.all(
    publicMenuKeys.map((menuKey) => getPublicNavigationMenu(payload, locale, menuKey)),
  );

  return menus.filter((menu): menu is PublicNavigationMenu => menu !== null);
}

export async function getPublicCmsSnapshot(
  payload: Payload,
  locale: string,
): Promise<PublicCmsSnapshot> {
  const [siteSettings, navigationMenus, seoEntries, directions, categories, pages, products, inquiryForms] =
    await Promise.all([
      getPublicSiteSettings(payload, locale),
      listPublicNavigationMenus(payload, locale),
      listPublicSeoEntries(payload, locale),
      findPublishedDocs<PayloadDirectionDoc>(payload, "product-directions", locale),
      findPublishedDocs<PayloadCategoryDoc>(payload, "product-categories", locale),
      findPublishedDocs<PayloadPageDoc>(payload, "pages", locale),
      findPublishedDocs<PayloadProductDoc>(payload, "products", locale),
      findPublishedDocs<PayloadFormDoc>(payload, "productInquiryForms", locale, {
        approvalStatus: {
          equals: "approved",
        },
      }),
    ]);

  return {
    locale,
    siteSettings,
    navigationMenus,
    seoEntries,
    directions: directions.map((doc) => mapDirection(doc, locale)).sort((left, right) => left.order - right.order),
    categories: categories
      .map((doc) => ({
        id: doc.id ?? doc.slug ?? "",
        slug: doc.slug ?? "",
        directionSlug: getSlug(doc.direction),
        label: doc.navigationLabel ?? doc.publicLabel ?? doc.name ?? doc.slug ?? "Untitled category",
        description: doc.description ?? doc.shortDescription ?? "",
        routePath: doc.canonicalPath ?? `${getRelationPath(doc.direction) || "/audio"}/${doc.slug ?? ""}`,
        order: doc.order ?? 0,
        status: "published" as const,
      }))
      .sort((left, right) => left.order - right.order),
    pages: pages.map((doc) => mapPage(doc, locale)).sort((left, right) => left.navigationOrder - right.navigationOrder),
    products: products.map((doc) => mapProduct(doc, locale)),
    inquiryForms: inquiryForms.map((doc) => mapPublicInquiryForm(doc, locale)),
  };
}

export async function getInternalProductInquiryForm(
  payload: Payload,
  locale: string,
  productSlug: string,
): Promise<PublicCmsInquiryForm | null> {
  const forms = await findPublishedDocs<PayloadFormDoc>(payload, "productInquiryForms", locale, {
    and: [
      {
        approvalStatus: {
          equals: "approved",
        },
      },
      {
        isPrimaryForLocale: {
          equals: true,
        },
      },
    ],
  });

  const form = forms.find((entry) => getSlug(entry.product) === productSlug) ?? null;

  return form ? mapInternalInquiryForm(form, locale) : null;
}
