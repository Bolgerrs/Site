import { cache } from "react";
import { draftMode } from "next/headers";
import type { SiteLocale } from "@/config/i18n";
import {
  createMockCategories,
  createMockDirections,
  createMockInquiryForms,
  createMockPages,
  createMockProducts,
} from "@/lib/cms/mock-data";
import { localizeInquiryFormRuntimeCopy } from "@/lib/forms/product-inquiry-copy";
import type {
  CmsClient,
  CmsMediaAsset,
  CmsNavigationLink,
  CmsPage,
  CmsPageSection,
  CmsProduct,
  CmsProductCategory,
  CmsProductDirection,
  CmsProductInquiryField,
  CmsProductInquiryForm,
  CmsProductInquirySubmissionChannel,
} from "@/lib/cms/types";

type CmsProvider = "mock" | "payload";

type PayloadListResponse<T> = {
  docs?: T[];
};

type PayloadPublicSnapshotResponse = {
  categories: CmsProductCategory[];
  directions: CmsProductDirection[];
  inquiryForms: CmsProductInquiryForm[];
  pages: CmsPage[];
  products: CmsProduct[];
};

type PreviewDocumentType = "direction" | "form" | "page" | "product";

type PayloadDirectionDoc = {
  id?: string;
  slug?: string;
  name?: string;
  publicLabel?: string;
  navigationLabel?: string;
  tagline?: string;
  shortDescription?: string;
  positioningStatement?: string;
  signatureUseCases?: Array<{ title?: string }>;
  keyDifferentiators?: Array<{ title?: string }>;
  heroAsset?: PayloadMediaDoc | string | null;
  coverCardAsset?: PayloadMediaDoc | string | null;
  canonicalPath?: string;
  order?: number;
  status?: string;
  seo?: {
    title?: string;
    description?: string;
    canonicalPath?: string;
    metaTitle?: string;
    metaDescription?: string;
    routePath?: string;
  };
};

type PayloadPageDoc = {
  id?: string;
  slug?: string;
  title?: string;
  navigationLabel?: string;
  eyebrow?: string;
  heroSummary?: string;
  introBody?: string;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaTarget?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaTarget?: string;
  heroMedia?: PayloadMediaDoc | string | null;
  routePath?: string;
  pageFamily?: string;
  showInHeader?: boolean;
  showInFooter?: boolean;
  navigationOrder?: number;
  sectionPlan?: Array<{
    sectionKey?: string;
    expectedType?: string;
  }>;
  sections?: Array<{
    order?: number;
    previewAnchor?: string;
    visible?: boolean;
    section?: PayloadPageSectionDoc | string;
  }>;
  status?: string;
  seo?: {
    title?: string;
    description?: string;
    canonicalPath?: string;
    metaTitle?: string;
    metaDescription?: string;
    routePath?: string;
  };
};

type PayloadPageSectionDoc = {
  id?: string;
  sectionKey?: string;
  sectionType?: string;
  previewLabel?: string;
  title?: string;
  eyebrow?: string;
  lead?: string;
  body?: string;
  heroContent?: {
    supportingLabel?: string;
    heroMedia?: PayloadMediaDoc | string | null;
  };
  productGridContent?: {
    gridMode?: string;
    products?: Array<{ slug?: string } | string>;
    directions?: Array<{ slug?: string } | string>;
    maxItems?: number;
  };
  proofModules?: Array<{
    label?: string;
    body?: string;
  }>;
  materialsStory?: Array<{
    material?: string;
    narrative?: string;
  }>;
  ctaContent?: {
    primaryLabel?: string;
    primaryTarget?: string;
    secondaryLabel?: string;
    secondaryTarget?: string;
  };
  journalDownloadsContent?: {
    linkLabel?: string;
    linkTarget?: string;
  };
};

type PayloadProductDoc = {
  id?: string;
  slug?: string;
  name?: string;
  publicLabel?: string;
  navigationLabel?: string;
  subtitle?: string;
  tagline?: string;
  shortDescription?: string;
  positioningStatement?: string;
  heroAsset?: PayloadMediaDoc | string | null;
  coverCardAsset?: PayloadMediaDoc | string | null;
  canonicalPath?: string;
  direction?: { slug?: string } | string;
  category?: { slug?: string } | string | null;
  line?: { slug?: string } | string | null;
  availabilityMode?: string;
  pdpSectionPlan?: Array<string | { sectionKey?: string }>;
  status?: string;
  seo?: {
    title?: string;
    description?: string;
    canonicalPath?: string;
    metaTitle?: string;
    metaDescription?: string;
    routePath?: string;
  };
};

type PayloadMediaDoc = {
  id?: number | string;
  url?: string;
  filename?: string;
  altText?: string;
  caption?: string;
};

type PayloadFormDoc = {
  id?: string;
  slug?: string;
  locale?: string;
  product?: { slug?: string } | string;
  formMode?: string;
  submissionChannel?: string;
  notificationEmails?: Array<string | { email?: string }>;
  notificationTemplateKey?: string;
  consentProfile?: string;
  consentText?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  successTitle?: string;
  successMessage?: string;
  fields?: Array<{
    fieldKey?: string;
    fieldType?: string;
    label?: string;
    helperText?: string;
    placeholder?: string;
    required?: boolean;
    width?: string;
    options?: Array<{ value?: string; label?: string }>;
  }>;
  status?: string;
};

const supportedFormFieldTypes = new Set<CmsProductInquiryField["fieldType"]>([
  "text",
  "textarea",
  "email",
  "phone",
  "select",
  "multi-select",
  "radio",
  "checkbox",
  "number",
  "date",
  "file-placeholder",
  "hidden-context",
  "consent",
]);

function getCmsProvider(): CmsProvider {
  const rawProvider = process.env.MONTELAR_CMS_PROVIDER?.trim().toLowerCase();

  if (rawProvider === "mock") {
    return "mock";
  }

  if (rawProvider === "payload") {
    return "payload";
  }

  return getPayloadBaseUrl() ? "payload" : "mock";
}

function getPayloadBaseUrl() {
  return (
    process.env.MONTELAR_PAYLOAD_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_ADMIN_URL?.trim() ??
    ""
  );
}

function getInternalCmsToken() {
  return process.env.MONTELAR_PREVIEW_SECRET?.trim() ?? "";
}

function toStatus(value: string | undefined): CmsProduct["status"] {
  if (value === "draft" || value === "review" || value === "published" || value === "hidden" || value === "archived") {
    return value;
  }

  return "draft";
}

function getSlug(value: { slug?: string } | string | null | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return value?.slug ?? "";
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

function mapMediaAsset(
  asset: PayloadMediaDoc | string | null | undefined,
): CmsMediaAsset | null {
  if (!asset || typeof asset === "string") {
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

class MockCmsClient implements CmsClient {
  async getPrimaryNavigation(locale: SiteLocale): Promise<CmsNavigationLink[]> {
    const directions = await this.listLaunchDirections(locale);
    const pages = await this.listEditorialPages(locale);

    return [
      { id: "nav-home", label: "Home", href: "/" },
      ...directions.map((direction) => ({
        id: `nav-${direction.slug}`,
        label: direction.navigationLabel ?? direction.name,
        href: direction.routePath,
      })),
      ...pages
        .filter((page) => page.showInHeader)
        .sort((left, right) => left.navigationOrder - right.navigationOrder)
        .map((page) => ({
          id: `nav-${page.slug}`,
          label: page.navigationLabel ?? page.title,
          href: page.routePath,
        })),
    ];
  }

  async listLaunchDirections(locale: SiteLocale): Promise<CmsProductDirection[]> {
    return createMockDirections(locale).sort((left, right) => left.order - right.order);
  }

  async getDirectionBySlug(slug: string, locale: SiteLocale): Promise<CmsProductDirection | null> {
    return createMockDirections(locale).find((direction) => direction.slug === slug) ?? null;
  }

  async listEditorialPages(locale: SiteLocale): Promise<CmsPage[]> {
    return createMockPages(locale).sort((left, right) => left.navigationOrder - right.navigationOrder);
  }

  async getEditorialPageBySlug(slug: string, locale: SiteLocale): Promise<CmsPage | null> {
    return createMockPages(locale).find((page) => page.slug === slug) ?? null;
  }

  async getPageByRoutePath(routePath: string, locale: SiteLocale): Promise<CmsPage | null> {
    return (
      createMockPages(locale).find((page) => page.routePath === routePath) ?? null
    );
  }

  async listDirectionCategories(directionSlug: string, locale: SiteLocale): Promise<CmsProductCategory[]> {
    return createMockCategories(locale)
      .filter((category) => category.directionSlug === directionSlug)
      .sort((left, right) => left.order - right.order);
  }

  async getCategoryBySlug(
    directionSlug: string,
    categorySlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductCategory | null> {
    return (
      createMockCategories(locale).find(
        (category) =>
          category.directionSlug === directionSlug && category.slug === categorySlug,
      ) ?? null
    );
  }

  async listProductsByDirection(directionSlug: string, locale: SiteLocale): Promise<CmsProduct[]> {
    return createMockProducts(locale).filter((product) => product.directionSlug === directionSlug);
  }

  async listProductsByCategory(
    directionSlug: string,
    categorySlug: string,
    locale: SiteLocale,
  ): Promise<CmsProduct[]> {
    return createMockProducts(locale).filter(
      (product) =>
        product.directionSlug === directionSlug && product.categorySlug === categorySlug,
    );
  }

  async listFeaturedProducts(locale: SiteLocale): Promise<CmsProduct[]> {
    return createMockProducts(locale);
  }

  async getProductBySlug(slug: string, locale: SiteLocale): Promise<CmsProduct | null> {
    return createMockProducts(locale).find((product) => product.slug === slug) ?? null;
  }

  async getProductInquiryFormByProductSlug(
    productSlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductInquiryForm | null> {
    return (
      createMockInquiryForms(locale).find((form) => form.productSlug === productSlug) ?? null
    );
  }

  async getProductInquiryFormOpsByProductSlug(
    productSlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductInquiryForm | null> {
    return this.getProductInquiryFormByProductSlug(productSlug, locale);
  }
}

class PayloadCmsClient implements CmsClient {
  private readonly internalFormCache = new Map<string, Promise<CmsProductInquiryForm | null>>();
  private readonly publicSnapshotCache = new Map<SiteLocale, Promise<PayloadPublicSnapshotResponse>>();

  constructor(private readonly baseUrl: string) {}

  private async isPreviewEnabled() {
    const previewState = await draftMode();
    return previewState.isEnabled;
  }

  private async getPreviewDocument<T>(
    type: PreviewDocumentType,
    locale: SiteLocale,
    params: Record<string, string>,
  ): Promise<T | null> {
    const token = getInternalCmsToken();

    if (!token) {
      return null;
    }

    const searchParams = new URLSearchParams({
      locale,
      type,
      ...params,
    });

    const response = await fetch(
      `${this.baseUrl}/api/internal/preview-document?${searchParams.toString()}`,
      {
        cache: "no-store",
        headers: {
          "x-montelar-internal-token": token,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Payload preview request failed for ${type}: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private async getPublicSnapshot(locale: SiteLocale): Promise<PayloadPublicSnapshotResponse> {
    const cached = this.publicSnapshotCache.get(locale);

    if (cached) {
      return cached;
    }

    const request = (async () => {
    const searchParams = new URLSearchParams({
      locale,
    });
    const response = await fetch(`${this.baseUrl}/api/public/cms?${searchParams.toString()}`, {
      next: {
        revalidate: 60,
      },
    });

    if (!response.ok) {
      throw new Error(`Payload public snapshot request failed: ${response.status}`);
    }

      return (await response.json()) as PayloadPublicSnapshotResponse;
    })();

    this.publicSnapshotCache.set(locale, request);

    return request;
  }

  private async getInternalInquiryForm(
    productSlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductInquiryForm | null> {
    const cacheKey = `${locale}:${productSlug}`;
    const cached = this.internalFormCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const request = (async () => {
    const token = getInternalCmsToken();

    if (!token) {
      return null;
    }

    const searchParams = new URLSearchParams({
      locale,
      productSlug,
    });
    const response = await fetch(
      `${this.baseUrl}/api/internal/product-inquiry-form?${searchParams.toString()}`,
      {
        cache: "no-store",
        headers: {
          "x-montelar-internal-token": token,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Payload internal inquiry form request failed: ${response.status}`);
    }

      return (await response.json()) as CmsProductInquiryForm;
    })();

    this.internalFormCache.set(cacheKey, request);

    return request;
  }

  private async listCollection<T>(collection: string, locale: SiteLocale) {
    const searchParams = new URLSearchParams({
      depth: "1",
      draft: "false",
      locale,
      limit: "100",
      "where[status][equals]": "published",
    });

    const response = await fetch(`${this.baseUrl}/api/${collection}?${searchParams.toString()}`, {
      next: {
        revalidate: 60,
      },
    });

    if (!response.ok) {
      throw new Error(`Payload request failed for ${collection}: ${response.status}`);
    }

    const payload = (await response.json()) as PayloadListResponse<T>;

    return payload.docs ?? [];
  }

  private mapPageSection(
    item: NonNullable<PayloadPageDoc["sections"]>[number],
  ): CmsPageSection | null {
    const sectionDoc =
      item.section && typeof item.section === "object"
        ? (item.section as PayloadPageSectionDoc)
        : null;

    if (!sectionDoc?.sectionKey || !sectionDoc.sectionType) {
      return null;
    }

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
      ...(mapMediaAsset(sectionDoc.heroContent?.heroMedia)
        ? { heroMedia: mapMediaAsset(sectionDoc.heroContent?.heroMedia) as CmsMediaAsset }
        : {}),
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
              .filter((item) => item.material && item.narrative)
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

  private mapDirection(doc: PayloadDirectionDoc, locale: SiteLocale): CmsProductDirection {
    const routePath = doc.canonicalPath || getSeoRoutePath(doc.seo, `/${doc.slug ?? ""}`);

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
      ...(mapMediaAsset(doc.heroAsset)
        ? { heroMedia: mapMediaAsset(doc.heroAsset) as CmsMediaAsset }
        : {}),
      ...(mapMediaAsset(doc.coverCardAsset)
        ? { coverCardMedia: mapMediaAsset(doc.coverCardAsset) as CmsMediaAsset }
        : {}),
      routePath,
      order: doc.order ?? 0,
      status: toStatus(doc.status),
      seo: {
        title: getSeoTitle(doc.seo, `${doc.name ?? "Direction"} | Montelar`),
        description: getSeoDescription(doc.seo, doc.shortDescription ?? ""),
        routePath,
        locale,
      },
    };
  }

  private mapPage(doc: PayloadPageDoc, locale: SiteLocale): CmsPage {
    const routePath = doc.routePath ?? `/${doc.slug ?? ""}`;
    const sections =
      doc.sections
        ?.map((item) => this.mapPageSection(item))
        .filter((item): item is CmsPageSection => Boolean(item))
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
      ...(mapMediaAsset(doc.heroMedia)
        ? { heroMedia: mapMediaAsset(doc.heroMedia) as CmsMediaAsset }
        : {}),
      routePath,
      pageFamily: doc.pageFamily ?? "page",
      showInHeader: doc.showInHeader ?? false,
      showInFooter: doc.showInFooter ?? false,
      navigationOrder: doc.navigationOrder ?? 0,
      ...(sectionPlan.length ? { sectionPlan } : {}),
      ...(sections.length ? { sections } : {}),
      status: toStatus(doc.status),
      seo: {
        title: getSeoTitle(doc.seo, `${doc.title ?? "Page"} | Montelar`),
        description: getSeoDescription(doc.seo, doc.heroSummary ?? ""),
        routePath,
        locale,
      },
    };
  }

  private mapProduct(doc: PayloadProductDoc, locale: SiteLocale): CmsProduct {
    const routePath = doc.canonicalPath ?? getSeoRoutePath(doc.seo, `/products/${doc.slug ?? ""}`);
    const productSlug = doc.slug ?? "";

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
      ...(mapMediaAsset(doc.heroAsset)
        ? { heroMedia: mapMediaAsset(doc.heroAsset) as CmsMediaAsset }
        : {}),
      ...(mapMediaAsset(doc.coverCardAsset)
        ? { coverCardMedia: mapMediaAsset(doc.coverCardAsset) as CmsMediaAsset }
        : {}),
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
      status: toStatus(doc.status),
      seo: {
        title: getSeoTitle(doc.seo, `${doc.name ?? "Product"} | Montelar`),
        description: getSeoDescription(doc.seo, doc.shortDescription ?? ""),
        routePath,
        locale,
      },
    };
  }

  private mapForm(doc: PayloadFormDoc, locale: SiteLocale): CmsProductInquiryForm {
    const fields: CmsProductInquiryField[] =
      doc.fields?.map((field) => {
        const fieldType = supportedFormFieldTypes.has(
          field.fieldType as CmsProductInquiryField["fieldType"],
        )
          ? (field.fieldType as CmsProductInquiryField["fieldType"])
          : "text";
        const width =
          field.width === "half" || field.width === "third" || field.width === "full"
            ? field.width
            : undefined;
        const options =
          field.options
            ?.filter((option) => option.value && option.label)
            .map((option) => ({
              value: option.value as string,
              label: option.label as string,
            })) ?? [];

        return {
          fieldKey: field.fieldKey ?? "field",
          fieldType,
          label: field.label ?? field.fieldKey ?? "Field",
          ...(field.fieldKey ? { leadMappingKey: field.fieldKey } : {}),
          required: field.required ?? false,
          ...(field.helperText ? { helperText: field.helperText } : {}),
          ...(field.placeholder ? { placeholder: field.placeholder } : {}),
          ...(width ? { width } : {}),
          ...(options.length ? { options } : {}),
        };
      }) ?? [];

    const submissionChannel: CmsProductInquirySubmissionChannel =
      doc.submissionChannel === "cms-lead-plus-email" || doc.submissionChannel === "email-only-temp"
        ? doc.submissionChannel
        : "cms-lead";
    const consentField = fields.find((field) => field.fieldType === "consent");

    return localizeInquiryFormRuntimeCopy({
      id: doc.id ?? doc.slug ?? "form",
      slug: doc.slug ?? "",
      productSlug: getSlug(doc.product),
      locale,
      formMode: doc.formMode ?? "product-inquiry",
      submissionChannel,
      notificationEmails:
        doc.notificationEmails
          ?.map((entry) => (typeof entry === "string" ? entry : entry.email ?? ""))
          .filter(Boolean) ?? [],
      ...(doc.notificationTemplateKey
        ? { notificationTemplateKey: doc.notificationTemplateKey }
        : {}),
      consentProfile: doc.consentProfile ?? "product-inquiry-default",
      consentText: doc.consentText ?? consentField?.label ?? "I agree to the privacy review and advisory follow-up.",
      title: doc.title ?? "Request information",
      description: doc.description ?? "",
      submitLabel: doc.submitLabel ?? "Submit",
      successTitle: doc.successTitle ?? "Submitted",
      successMessage: doc.successMessage ?? "",
      fields,
      fieldKeys: fields.map((field) => field.fieldKey),
      status: toStatus(doc.status),
    }, locale);
  }

  async getPrimaryNavigation(locale: SiteLocale): Promise<CmsNavigationLink[]> {
    const snapshot = await this.getPublicSnapshot(locale);
    const directions = snapshot.directions;
    const pages = snapshot.pages
      .filter((page) => page.pageFamily !== "direction-landing" && page.pageFamily !== "category-landing");

    return [
      { id: "nav-home", label: "Home", href: "/" },
      ...directions.map((direction) => ({
        id: `nav-${direction.slug}`,
        label: direction.navigationLabel ?? direction.name,
        href: direction.routePath,
      })),
      ...pages
        .filter((page) => page.showInHeader)
        .sort((left, right) => left.navigationOrder - right.navigationOrder)
        .map((page) => ({
          id: `nav-${page.slug}`,
          label: page.navigationLabel ?? page.title,
          href: page.routePath,
        })),
    ];
  }

  async listLaunchDirections(locale: SiteLocale): Promise<CmsProductDirection[]> {
    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.directions.sort((left, right) => left.order - right.order);
  }

  async getDirectionBySlug(slug: string, locale: SiteLocale): Promise<CmsProductDirection | null> {
    if (await this.isPreviewEnabled()) {
      const previewDoc = await this.getPreviewDocument<PayloadDirectionDoc>("direction", locale, {
        slug,
      });

      if (previewDoc) {
        return this.mapDirection(previewDoc, locale);
      }
    }

    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.directions.find((direction) => direction.slug === slug) ?? null;
  }

  async listEditorialPages(locale: SiteLocale): Promise<CmsPage[]> {
    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.pages
      .filter((page) => page.pageFamily !== "direction-landing" && page.pageFamily !== "category-landing")
      .sort((left, right) => left.navigationOrder - right.navigationOrder);
  }

  async getEditorialPageBySlug(slug: string, locale: SiteLocale): Promise<CmsPage | null> {
    const snapshot = await this.getPublicSnapshot(locale);
    return (
      snapshot.pages.find(
        (page) =>
          page.slug === slug &&
          page.pageFamily !== "direction-landing" &&
          page.pageFamily !== "category-landing",
      ) ?? null
    );
  }

  async getPageByRoutePath(routePath: string, locale: SiteLocale): Promise<CmsPage | null> {
    if (await this.isPreviewEnabled()) {
      const previewDoc = await this.getPreviewDocument<PayloadPageDoc>("page", locale, {
        routePath,
      });

      if (previewDoc) {
        return this.mapPage(previewDoc, locale);
      }
    }

    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.pages.find((page) => page.routePath === routePath) ?? null;
  }

  async listDirectionCategories(directionSlug: string, locale: SiteLocale): Promise<CmsProductCategory[]> {
    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.categories
      .filter((category) => category.directionSlug === directionSlug)
      .sort((left, right) => left.order - right.order);
  }

  async getCategoryBySlug(
    directionSlug: string,
    categorySlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductCategory | null> {
    const categories = await this.listDirectionCategories(directionSlug, locale);

    return categories.find((category) => category.slug === categorySlug) ?? null;
  }

  async listProductsByDirection(directionSlug: string, locale: SiteLocale): Promise<CmsProduct[]> {
    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.products.filter((product) => product.directionSlug === directionSlug);
  }

  async listProductsByCategory(
    directionSlug: string,
    categorySlug: string,
    locale: SiteLocale,
  ): Promise<CmsProduct[]> {
    const products = await this.listProductsByDirection(directionSlug, locale);

    return products.filter((product) => product.categorySlug === categorySlug);
  }

  async listFeaturedProducts(locale: SiteLocale): Promise<CmsProduct[]> {
    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.products.slice(0, 6);
  }

  async getProductBySlug(slug: string, locale: SiteLocale): Promise<CmsProduct | null> {
    if (await this.isPreviewEnabled()) {
      const previewDoc = await this.getPreviewDocument<PayloadProductDoc>("product", locale, {
        slug,
      });

      if (previewDoc) {
        return this.mapProduct(previewDoc, locale);
      }
    }

    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.products.find((product) => product.slug === slug) ?? null;
  }

  async getProductInquiryFormByProductSlug(
    productSlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductInquiryForm | null> {
    if (await this.isPreviewEnabled()) {
      const previewDoc = await this.getPreviewDocument<PayloadFormDoc>("form", locale, {
        productSlug,
      });

      if (previewDoc) {
        return this.mapForm(previewDoc, locale);
      }
    }

    const snapshot = await this.getPublicSnapshot(locale);
    return snapshot.inquiryForms.find((form) => form.productSlug === productSlug) ?? null;
  }

  async getProductInquiryFormOpsByProductSlug(
    productSlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductInquiryForm | null> {
    const internalForm = await this.getInternalInquiryForm(productSlug, locale);

    if (internalForm) {
      return internalForm;
    }

    return this.getProductInquiryFormByProductSlug(productSlug, locale);
  }
}

function createCmsClient(): CmsClient {
  const provider = getCmsProvider();

  if (provider === "payload") {
    const baseUrl = getPayloadBaseUrl();

    if (!baseUrl) {
      return new MockCmsClient();
    }

    return new PayloadCmsClient(baseUrl);
  }

  return new MockCmsClient();
}

export const getCmsClient = cache(createCmsClient);
