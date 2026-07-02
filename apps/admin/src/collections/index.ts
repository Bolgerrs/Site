import { AdminUsers } from "./AdminUsers.ts";
import { AuditEvents } from "./AuditEvents.ts";
import { Locales } from "./Locales.ts";
import { Leads } from "./Leads.ts";
import { MediaAssets, mediaAssetsUpload } from "./MediaAssets.ts";
import { NavigationMenus } from "./NavigationMenus.ts";
import { Pages } from "./Pages.ts";
import { PageSections } from "./PageSections.ts";
import { ProductCategories } from "./ProductCategories.ts";
import { ProductDocuments, productDocumentsUpload } from "./ProductDocuments.ts";
import { ProductDirections } from "./ProductDirections.ts";
import { ProductInquiryForms } from "./ProductInquiryForms.ts";
import { ProductLines } from "./ProductLines.ts";
import { ProductMedia } from "./ProductMedia.ts";
import { Products } from "./Products.ts";
import { ProductVariants } from "./ProductVariants.ts";
import { SeoEntries } from "./SeoEntries.ts";
import { SiteSettings } from "./SiteSettings.ts";
import { SystemMedia, systemMediaUpload } from "./SystemMedia.ts";
import { Translations } from "./Translations.ts";
import { applyAdminSurfaceProfile } from "../lib/payload/admin-surfaces.ts";

type CreateCoreCollectionsInput = {
  uploadsDir: string;
};

export function createCoreCollections({ uploadsDir }: CreateCoreCollectionsInput) {
  return [
    AdminUsers,
    AuditEvents,
    Locales,
    {
      ...SystemMedia,
      upload: {
        ...systemMediaUpload,
        staticDir: uploadsDir,
      },
    },
    {
      ...MediaAssets,
      upload: {
        ...mediaAssetsUpload,
        staticDir: uploadsDir,
      },
    },
    ProductMedia,
    ProductDirections,
    ProductCategories,
    ProductLines,
    ProductVariants,
    Products,
    ProductInquiryForms,
    Leads,
    PageSections,
    Pages,
    SeoEntries,
    NavigationMenus,
    SiteSettings,
    {
      ...ProductDocuments,
      upload: {
        ...productDocumentsUpload,
        staticDir: uploadsDir,
      },
    },
    Translations,
  ].map((collection) => applyAdminSurfaceProfile(collection));
}
