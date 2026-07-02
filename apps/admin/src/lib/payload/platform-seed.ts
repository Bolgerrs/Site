import type { Payload } from "payload";

import { adminRoleOptions } from "./roles.ts";
import { type AdminLocale, launchLocaleSeeds, syncLaunchLocales } from "./locales.ts";

type RolePresetSeed = {
  canAccessLeadPii: boolean;
  canPublishPublicContent: boolean;
  label: string;
  ownedWorkspaces: string[];
  role: (typeof adminRoleOptions)[number]["value"];
  technicalAccess: boolean;
};

type SiteSettingsSeed = {
  addressShort: string;
  brandName: string;
  brandShortName: string;
  contactEmail: string;
  contactFallbackLocale: AdminLocale;
  contactHeadline: string;
  contactPhoneDisplay: string;
  contactPhoneE164: string;
  contactPrimaryHref: string;
  contactPrimaryLabel: string;
  contactTelegramUrl: string;
  contactWhatsappLabel: string;
  contactWhatsappUrl: string;
  footerCopyright: string;
  footerLegalName: string;
  internalCode: string;
  locale: AdminLocale;
  primaryLocale: AdminLocale;
  settingsScope: "public-site";
  showroomCity: string;
  showroomCountry: string;
  showroomLabel: string;
  siteConcept: string;
  siteTagline: string;
  socialLinks: Array<{ href: string; label: string }>;
  sourceOfTruthArtifact: string;
  status: "published";
  visitNote: string;
};

type SeedSummaryEntry = {
  id: number | string;
  locale?: AdminLocale;
  operation: "created" | "updated";
};

export const rolePresetSeeds: RolePresetSeed[] = [
  {
    canAccessLeadPii: true,
    canPublishPublicContent: true,
    label: "Owner",
    ownedWorkspaces: ["publishing", "leads", "settings", "users", "technical"],
    role: "owner",
    technicalAccess: true,
  },
  {
    canAccessLeadPii: true,
    canPublishPublicContent: true,
    label: "Platform Admin",
    ownedWorkspaces: ["publishing", "leads", "forms", "localization", "media"],
    role: "admin",
    technicalAccess: false,
  },
  {
    canAccessLeadPii: false,
    canPublishPublicContent: false,
    label: "Content Editor",
    ownedWorkspaces: ["catalog", "pages", "forms-copy", "seo-copy"],
    role: "content-editor",
    technicalAccess: false,
  },
  {
    canAccessLeadPii: true,
    canPublishPublicContent: false,
    label: "Lead Manager",
    ownedWorkspaces: ["leads", "routing", "follow-up"],
    role: "lead-manager",
    technicalAccess: false,
  },
  {
    canAccessLeadPii: false,
    canPublishPublicContent: false,
    label: "Translator",
    ownedWorkspaces: ["localization", "seo-locales", "form-labels"],
    role: "translator",
    technicalAccess: false,
  },
  {
    canAccessLeadPii: false,
    canPublishPublicContent: false,
    label: "Media Manager",
    ownedWorkspaces: ["media", "documents", "rights"],
    role: "media-manager",
    technicalAccess: false,
  },
  {
    canAccessLeadPii: true,
    canPublishPublicContent: false,
    label: "Developer",
    ownedWorkspaces: ["technical", "integrations", "schema", "debug"],
    role: "developer",
    technicalAccess: true,
  },
] as const;

const siteSettingsSourceArtifact =
  "docs/strategy/artifacts/MNT-CMS-025-cms-seed-content-plan.md";

const sharedSiteSettings = {
  addressShort: "Private showroom by appointment",
  brandName: "Montelar",
  brandShortName: "Montelar",
  contactEmail: "concierge@montelar.example",
  contactFallbackLocale: "en" as const,
  contactPhoneDisplay: "+31 20 555 0100",
  contactPhoneE164: "+31205550100",
  contactPrimaryHref: "/contact",
  contactTelegramUrl: "",
  contactWhatsappUrl: "",
  footerCopyright: "Montelar. All rights reserved.",
  footerLegalName: "Montelar B.V.",
  primaryLocale: "en" as const,
  settingsScope: "public-site" as const,
  showroomCity: "Amsterdam",
  showroomCountry: "Netherlands",
  sourceOfTruthArtifact: siteSettingsSourceArtifact,
  status: "published" as const,
} as const;

export const siteSettingsSeeds: SiteSettingsSeed[] = [
  {
    ...sharedSiteSettings,
    contactHeadline: "Private consultation",
    contactPrimaryLabel: "Request a consultation",
    contactWhatsappLabel: "WhatsApp",
    internalCode: "SETTINGS_PUBLIC_RU",
    locale: "ru",
    showroomLabel: "Private showroom",
    siteConcept: "Тихая роскошь",
    siteTagline: "Архитектура изображения, звука и AI дизайна",
    socialLinks: [],
    visitNote: "Визит согласовывается заранее через concierge-команду Montelar.",
  },
  {
    ...sharedSiteSettings,
    contactHeadline: "Private consultation",
    contactPrimaryLabel: "Request a consultation",
    contactWhatsappLabel: "WhatsApp",
    internalCode: "SETTINGS_PUBLIC_EN",
    locale: "en",
    showroomLabel: "Private showroom",
    siteConcept: "Quiet luxury",
    siteTagline: "Architecture of image, sound and AI design",
    socialLinks: [],
    visitNote: "Visits are scheduled in advance through the Montelar concierge team.",
  },
  {
    ...sharedSiteSettings,
    contactHeadline: "Consulta privada",
    contactPrimaryLabel: "Solicitar una consulta",
    contactWhatsappLabel: "WhatsApp",
    internalCode: "SETTINGS_PUBLIC_ES",
    locale: "es",
    showroomLabel: "Showroom privado",
    siteConcept: "Lujo silencioso",
    siteTagline: "Arquitectura de imagen, sonido y diseño con IA",
    socialLinks: [],
    visitNote: "Las visitas se programan con antelación a través del equipo concierge de Montelar.",
  },
  {
    ...sharedSiteSettings,
    contactHeadline: "Consultation privée",
    contactPrimaryLabel: "Demander une consultation",
    contactWhatsappLabel: "WhatsApp",
    internalCode: "SETTINGS_PUBLIC_FR",
    locale: "fr",
    showroomLabel: "Showroom privé",
    siteConcept: "Luxe discret",
    siteTagline: "Architecture de l'image, du son et du design IA",
    socialLinks: [],
    visitNote: "Les visites se planifient à l'avance avec l'équipe concierge Montelar.",
  },
  {
    ...sharedSiteSettings,
    contactHeadline: "专属咨询",
    contactPrimaryLabel: "预约咨询",
    contactWhatsappLabel: "WhatsApp",
    internalCode: "SETTINGS_PUBLIC_ZH",
    locale: "zh",
    showroomLabel: "私享展厅",
    siteConcept: "静奢",
    siteTagline: "图像、声音与 AI 设计的架构",
    socialLinks: [],
    visitNote: "参观需提前通过 Montelar 礼宾团队预约。",
  },
  {
    ...sharedSiteSettings,
    contactHeadline: "プライベート相談",
    contactPrimaryLabel: "相談を申し込む",
    contactWhatsappLabel: "WhatsApp",
    internalCode: "SETTINGS_PUBLIC_JA",
    locale: "ja",
    showroomLabel: "プライベートショールーム",
    siteConcept: "静かなラグジュアリー",
    siteTagline: "映像・音・AIデザインのアーキテクチャ",
    socialLinks: [],
    visitNote: "来訪は Montelar コンシェルジュチームとの事前調整制です。",
  },
  {
    ...sharedSiteSettings,
    contactHeadline: "Private Beratung",
    contactPrimaryLabel: "Beratung anfragen",
    contactWhatsappLabel: "WhatsApp",
    internalCode: "SETTINGS_PUBLIC_DE",
    locale: "de",
    showroomLabel: "Privater Showroom",
    siteConcept: "Stille Luxus",
    siteTagline: "Architektur von Bild, Klang und KI-Design",
    socialLinks: [],
    visitNote: "Besuche werden vorab mit dem Montelar-Concierge-Team abgestimmt.",
  },
];

async function upsertSiteSettingsSeed(payload: Payload, seed: SiteSettingsSeed) {
  const existing = await payload.find({
    collection: "site-settings",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          settingsScope: {
            equals: seed.settingsScope,
          },
        },
        {
          locale: {
            equals: seed.locale,
          },
        },
      ],
    },
  });

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: "site-settings",
      data: seed,
      id: existing.docs[0].id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return {
      id: updated.id,
      locale: seed.locale,
      operation: "updated" as const,
    };
  }

  const created = await payload.create({
    collection: "site-settings",
    data: seed,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return {
    id: created.id,
    locale: seed.locale,
    operation: "created" as const,
  };
}

export async function syncWaveZeroPlatform(payload: Payload) {
  const localeOperations = await syncLaunchLocales(payload);
  const siteSettingsOperations: SeedSummaryEntry[] = [];

  for (const seed of siteSettingsSeeds) {
    siteSettingsOperations.push(await upsertSiteSettingsSeed(payload, seed));
  }

  return {
    localeCount: launchLocaleSeeds.length,
    localeOperations,
    rolePresetCount: rolePresetSeeds.length,
    rolePresets: rolePresetSeeds,
    siteSettingsCount: siteSettingsSeeds.length,
    siteSettingsOperations,
  };
}
