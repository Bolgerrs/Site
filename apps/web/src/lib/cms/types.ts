import type { SiteLocale } from "@/config/i18n";

export type CmsStatus = "draft" | "review" | "published" | "hidden" | "archived";

export type CmsNavigationLink = {
  id: string;
  label: string;
  href: string;
};

export type CmsSeoEntry = {
  title: string;
  description: string;
  routePath: string;
  locale: SiteLocale;
};

export type CmsMediaAsset = {
  id: string;
  src: string;
  altText?: string;
  caption?: string;
};

export type CmsProductDirection = {
  id: string;
  slug: string;
  name: string;
  publicLabel?: string;
  navigationLabel?: string;
  tagline?: string;
  shortDescription: string;
  positioningStatement?: string;
  signatureUseCases?: string[];
  keyDifferentiators?: string[];
  heroMedia?: CmsMediaAsset;
  coverCardMedia?: CmsMediaAsset;
  routePath: string;
  order: number;
  status: CmsStatus;
  seo: CmsSeoEntry;
};

export type CmsProductCategory = {
  id: string;
  slug: string;
  directionSlug: string;
  label: string;
  description: string;
  routePath: string;
  order: number;
  status: CmsStatus;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  navigationLabel?: string;
  eyebrow?: string;
  heroSummary?: string;
  introBody?: string;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaTarget?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaTarget?: string;
  routePath: string;
  pageFamily: string;
  showInHeader: boolean;
  showInFooter: boolean;
  navigationOrder: number;
  sectionPlan?: Array<{
    sectionKey: string;
    expectedType?: string;
  }>;
  sections?: CmsPageSection[];
  status: CmsStatus;
  seo: CmsSeoEntry;
};

export type CmsPageSection = {
  id: string;
  sectionKey: string;
  sectionType: string;
  previewLabel: string;
  visible: boolean;
  order: number;
  previewAnchor?: string;
  title?: string;
  eyebrow?: string;
  lead?: string;
  body?: string;
  heroContent?: {
    supportingLabel?: string;
  };
  productGridContent?: {
    gridMode?: string;
    maxItems?: number;
    directionSlugs?: string[];
    productSlugs?: string[];
  };
  proofModules?: Array<{
    label: string;
    body: string;
  }>;
  materialsStory?: Array<{
    material: string;
    narrative: string;
  }>;
  ctaContent?: {
    primaryLabel: string;
    primaryTarget: string;
    secondaryLabel?: string;
    secondaryTarget?: string;
  };
  journalDownloadsContent?: {
    linkLabel?: string;
    linkTarget?: string;
  };
  heroMedia?: CmsMediaAsset;
};

export type CmsProduct = {
  id: string;
  slug: string;
  name: string;
  publicLabel?: string;
  navigationLabel?: string;
  subtitle?: string;
  tagline?: string;
  shortDescription: string;
  positioningStatement?: string;
  heroMedia?: CmsMediaAsset;
  coverCardMedia?: CmsMediaAsset;
  directionSlug: string;
  categorySlug?: string;
  lineSlug?: string;
  routePath: string;
  inquiryRoutePath: string;
  availabilityMode: string;
  pdpSectionPlan: string[];
  status: CmsStatus;
  seo: CmsSeoEntry;
};

export type CmsProductInquiryFieldOption = {
  value: string;
  label: string;
};

export type CmsProductInquiryFieldType =
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

export type CmsProductInquiryField = {
  fieldKey: string;
  fieldType: CmsProductInquiryFieldType;
  label: string;
  leadMappingKey?: string;
  helperText?: string;
  placeholder?: string;
  required: boolean;
  width?: "full" | "half" | "third";
  options?: CmsProductInquiryFieldOption[];
};

export type CmsProductInquirySubmissionChannel =
  | "cms-lead"
  | "cms-lead-plus-email"
  | "email-only-temp";

export type CmsProductInquiryForm = {
  id: string;
  slug: string;
  productSlug: string;
  locale: SiteLocale;
  formMode: string;
  submissionChannel: CmsProductInquirySubmissionChannel;
  notificationEmails: string[];
  notificationTemplateKey?: string;
  consentProfile: string;
  consentText: string;
  title: string;
  description: string;
  submitLabel: string;
  successTitle: string;
  successMessage: string;
  fields: CmsProductInquiryField[];
  fieldKeys: string[];
  status: CmsStatus;
};

export type CmsClient = {
  getPrimaryNavigation(locale: SiteLocale): Promise<CmsNavigationLink[]>;
  listLaunchDirections(locale: SiteLocale): Promise<CmsProductDirection[]>;
  getDirectionBySlug(slug: string, locale: SiteLocale): Promise<CmsProductDirection | null>;
  listEditorialPages(locale: SiteLocale): Promise<CmsPage[]>;
  getEditorialPageBySlug(slug: string, locale: SiteLocale): Promise<CmsPage | null>;
  getPageByRoutePath(routePath: string, locale: SiteLocale): Promise<CmsPage | null>;
  listDirectionCategories(directionSlug: string, locale: SiteLocale): Promise<CmsProductCategory[]>;
  getCategoryBySlug(
    directionSlug: string,
    categorySlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductCategory | null>;
  listProductsByDirection(directionSlug: string, locale: SiteLocale): Promise<CmsProduct[]>;
  listProductsByCategory(
    directionSlug: string,
    categorySlug: string,
    locale: SiteLocale,
  ): Promise<CmsProduct[]>;
  listFeaturedProducts(locale: SiteLocale): Promise<CmsProduct[]>;
  getProductBySlug(slug: string, locale: SiteLocale): Promise<CmsProduct | null>;
  getProductInquiryFormByProductSlug(
    productSlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductInquiryForm | null>;
  getProductInquiryFormOpsByProductSlug(
    productSlug: string,
    locale: SiteLocale,
  ): Promise<CmsProductInquiryForm | null>;
};
