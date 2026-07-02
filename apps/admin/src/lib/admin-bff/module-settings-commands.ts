import type { Payload, PayloadRequest } from "payload";

import { getAdminUser } from "../payload/access.ts";
import { createAuditEvent } from "../payload/audit.ts";
import { hasAdminRole, type AdminRole } from "../payload/roles.ts";
import {
  getSiteModuleRegistry,
  type SiteModuleDefinition,
  type SiteModuleRegistrySnapshot,
} from "./site-module-registry.ts";

type GenericRecord = Record<string, unknown>;
type PayloadLike = Payload;

const moduleSettingsRoles = ["owner", "admin", "developer"] as const satisfies readonly AdminRole[];
const moduleSettingsCommandPath = "/api/internal/module-settings";

class ModuleSettingsCommandError extends Error {
  code: "forbidden" | "invalid-input" | "unauthorized";

  constructor(code: ModuleSettingsCommandError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

type ModuleSettingsCommandAction = "module-settings.mark-ready" | "module-settings.save-draft";

type ModuleTargetKind = "category" | "page" | "product" | "url";
type ModulePosition = "bottom" | "center" | "left" | "right" | "top";
type ReducedMotionMode = "fade-only" | "static-first-frame" | "still-image";
type HeroSceneDesktopHoverBehavior = "focus-label" | "highlight-contour" | "quiet";
type HeroSceneMobileBehavior = "auto-cycle" | "tap-only";
type HeaderDesktopLayoutMode = "brand-left-actions-right" | "centered-brand" | "route-specific";
type HeaderLanguageDisplayMode = "current-locale-label" | "short-code" | "short-code-with-name";
type HeaderMegaMenuGrouping = "direction-category-product" | "direction-product" | "category-product";
type HeaderMenuCloseBehavior = "after-selection" | "manual-only";
type HeaderMenuOpenBehavior = "hover-and-click" | "click-only";
type HeaderMobileLayoutMode = "logo-center-actions-sides" | "logo-left-drawer-right";
type HeaderMobileLogoTransition = "crossfade-center" | "slide-to-center" | "static";

export type HeroSceneHotspotPatch = {
  autoHighlightDurationMs?: number | null;
  displayName?: string | null;
  easing?: string | null;
  height?: number | null;
  hitAreaPath?: string | null;
  id: string;
  linkedCategoryId?: number | string | null;
  linkedPageId?: number | string | null;
  linkedProductId?: number | string | null;
  mobileCycleOrder?: number | null;
  targetKind?: ModuleTargetKind | null;
  visible?: boolean | null;
  visualContourPath?: string | null;
  width?: number | null;
  x?: number | null;
  y?: number | null;
};

export type HeroSceneSettingsPatch = {
  brandText?: string | null;
  ctaButtonHref?: string | null;
  ctaButtonLabel?: string | null;
  ctaText?: string | null;
  ctaTitle?: string | null;
  ctaVisible?: boolean | null;
  desktopHoverBehavior?: HeroSceneDesktopHoverBehavior | null;
  desktopMediaId?: number | string | null;
  desktopVideoMediaId?: number | string | null;
  focalDesktopX?: number | null;
  focalDesktopY?: number | null;
  focalMobileX?: number | null;
  focalMobileY?: number | null;
  hotspots?: HeroSceneHotspotPatch[];
  mobileBehavior?: HeroSceneMobileBehavior | null;
  mobileCycleDurationMs?: number | null;
  mobileEasing?: string | null;
  mobileMediaId?: number | string | null;
  mobileVideoMediaId?: number | string | null;
  reducedMotionFallback?: ReducedMotionMode | null;
  sloganText?: string | null;
};

export type HeaderMenuLanguageSettingsPatch = {
  closeBehavior?: HeaderMenuCloseBehavior | null;
  consultationCtaHref?: string | null;
  consultationCtaLabel?: string | null;
  consultationCtaVisible?: boolean | null;
  defaultLanguageCode?: string | null;
  desktopLayoutMode?: HeaderDesktopLayoutMode | null;
  enabledLanguageCodes?: string[] | null;
  languageOrder?: string[] | null;
  languageSwitcherDisplay?: HeaderLanguageDisplayMode | null;
  logoAlignmentNote?: string | null;
  logoAssetId?: number | string | null;
  logoTransitionDurationMs?: number | null;
  logoTransitionEasing?: string | null;
  megaMenuGrouping?: HeaderMegaMenuGrouping | null;
  menuOpenBehavior?: HeaderMenuOpenBehavior | null;
  menuRevealDurationMs?: number | null;
  menuRevealEasing?: string | null;
  mobileLayoutMode?: HeaderMobileLayoutMode | null;
  mobileLogoTransition?: HeaderMobileLogoTransition | null;
  phoneButtonLabel?: string | null;
  phoneButtonVisible?: boolean | null;
  reducedMotionMode?: ReducedMotionMode | null;
  routeAlignmentNotes?: string | null;
  stableColumnCount?: number | null;
};

export type ModuleSettingsPatch = {
  buttonHref?: string | null;
  buttonLabel?: string | null;
  desktopCropX?: number | null;
  desktopCropY?: number | null;
  desktopPosition?: ModulePosition | null;
  headerMenuLanguage?: HeaderMenuLanguageSettingsPatch;
  heroScene?: HeroSceneSettingsPatch;
  linkedCategoryId?: number | string | null;
  linkedMediaId?: number | string | null;
  linkedPageId?: number | string | null;
  linkedProductId?: number | string | null;
  mobileCropX?: number | null;
  mobileCropY?: number | null;
  mobilePosition?: ModulePosition | null;
  motionDurationMs?: number | null;
  motionEnabled?: boolean | null;
  ownerNotes?: string | null;
  reducedMotionMode?: ReducedMotionMode | null;
  targetKind?: ModuleTargetKind | null;
  text?: string | null;
  title?: string | null;
  visible?: boolean | null;
};

export type ModuleSettingsCommandInput = {
  action: ModuleSettingsCommandAction;
  locale?: string | null;
  moduleId: string;
  settings?: ModuleSettingsPatch;
};

export type ModuleSettingsState = {
  buttonHref: string;
  buttonLabel: string;
  commandGroups: string[];
  crop: {
    desktop: { x: number | null; y: number | null };
    mobile: { x: number | null; y: number | null };
  };
  headerMenuLanguage: HeaderMenuLanguageSettingsState | null;
  heroScene: HeroSceneSettingsState | null;
  linkedTarget: {
    categoryId: string | null;
    mediaId: string | null;
    pageId: string | null;
    productId: string | null;
    targetKind: ModuleTargetKind;
  };
  motion: {
    durationMs: number | null;
    enabled: boolean;
    reducedMotionMode: ReducedMotionMode;
  };
  ownerNotes: string;
  position: {
    desktop: ModulePosition;
    mobile: ModulePosition;
  };
  publicationState: "draft" | "ready-for-publish";
  text: string;
  title: string;
  visible: boolean;
};

export type HeaderMenuLanguageSettingsState = {
  consultationCta: {
    href: string;
    label: string;
    visible: boolean;
  };
  desktopLayoutMode: HeaderDesktopLayoutMode;
  languageSwitcher: {
    defaultLanguageCode: string;
    displayMode: HeaderLanguageDisplayMode;
    enabledLanguageCodes: string[];
    order: string[];
  };
  logo: {
    alignmentNote: string;
    assetId: string | null;
    mobileTransition: HeaderMobileLogoTransition;
    transitionDurationMs: number | null;
    transitionEasing: string;
  };
  megaMenu: {
    closeBehavior: HeaderMenuCloseBehavior;
    grouping: HeaderMegaMenuGrouping;
    openBehavior: HeaderMenuOpenBehavior;
    stableColumnCount: number | null;
  };
  mobileLayoutMode: HeaderMobileLayoutMode;
  motion: {
    menuRevealDurationMs: number | null;
    menuRevealEasing: string;
    reducedMotionMode: ReducedMotionMode;
  };
  phoneButton: {
    label: string;
    visible: boolean;
  };
  routeAlignmentNotes: string;
  warnings: string[];
};

export type HeroSceneHotspotState = {
  autoHighlightDurationMs: number | null;
  displayName: string;
  easing: string;
  geometry: {
    height: number | null;
    width: number | null;
    x: number | null;
    y: number | null;
  };
  hitAreaPath: string;
  id: string;
  linkedTarget: {
    categoryId: string | null;
    pageId: string | null;
    productId: string | null;
    targetKind: ModuleTargetKind;
  };
  mobileCycleOrder: number | null;
  visible: boolean;
  visualContourPath: string;
  warnings: string[];
};

export type HeroSceneSettingsState = {
  behavior: {
    desktopHoverBehavior: HeroSceneDesktopHoverBehavior;
    mobileBehavior: HeroSceneMobileBehavior;
    mobileCycleDurationMs: number | null;
    mobileEasing: string;
    reducedMotionFallback: ReducedMotionMode;
  };
  brandText: string;
  ctaPlaque: {
    buttonHref: string;
    buttonLabel: string;
    text: string;
    title: string;
    visible: boolean;
  };
  focal: {
    desktop: { x: number | null; y: number | null };
    mobile: { x: number | null; y: number | null };
  };
  hotspots: HeroSceneHotspotState[];
  media: {
    desktopImageId: string | null;
    desktopVideoId: string | null;
    mobileImageId: string | null;
    mobileVideoId: string | null;
  };
  preview: {
    publicPage: string;
    usage: string;
  };
  sloganText: string;
  warnings: string[];
};

export type ModuleSettingsReadModel = {
  actions: Array<{
    id: ModuleSettingsCommandAction;
    label: string;
    method: "POST";
    path: string;
  }>;
  description: string;
  label: string;
  moduleId: string;
  publicRoutes: string[];
  settings: ModuleSettingsState;
  validation: {
    errors: string[];
    publishReady: boolean;
    summary: string;
  };
};

export type ModuleSettingsSnapshot = {
  canUpdate: boolean;
  generatedAt: string;
  locale: string;
  modules: ModuleSettingsReadModel[];
  registrySummary: SiteModuleRegistrySnapshot["summary"];
  selectedModule: ModuleSettingsReadModel | null;
  selectedModuleId: string | null;
  successMessage?: string;
};

function getText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function getBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getArray<T = GenericRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toRecord(value: unknown): GenericRecord {
  return value && typeof value === "object" ? (value as GenericRecord) : {};
}

function getRelationId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "number" || typeof id === "string") {
      return String(id);
    }
  }

  return null;
}

function toPayloadRelationId(value: string | null) {
  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  if (Number.isInteger(numberValue) && String(numberValue) === value) {
    return numberValue;
  }

  return value;
}

function requireModuleSettingsAccess(req: PayloadRequest) {
  const user = getAdminUser(req.user);

  if (!user?.role) {
    throw new ModuleSettingsCommandError("unauthorized");
  }

  if (!hasAdminRole(user, moduleSettingsRoles)) {
    throw new ModuleSettingsCommandError("forbidden");
  }

  return user;
}

function normalizeLocale(value: unknown) {
  return getText(value, "ru") || "ru";
}

function normalizePath(value: unknown) {
  const text = getText(value);

  if (!text) {
    return "";
  }

  if (text.startsWith("/") || text.startsWith("https://") || text.startsWith("http://") || text.startsWith("#")) {
    return text;
  }

  return `/${text}`;
}

function normalizePosition(value: unknown): ModulePosition {
  const text = getText(value) as ModulePosition;
  return ["bottom", "center", "left", "right", "top"].includes(text) ? text : "center";
}

function normalizeReducedMotionMode(value: unknown): ReducedMotionMode {
  const text = getText(value) as ReducedMotionMode;
  return ["fade-only", "static-first-frame", "still-image"].includes(text) ? text : "static-first-frame";
}

function normalizeTargetKind(value: unknown): ModuleTargetKind {
  const text = getText(value) as ModuleTargetKind;
  return ["category", "page", "product", "url"].includes(text) ? text : "url";
}

function normalizeCrop(value: unknown) {
  const numberValue = getNumber(value);

  if (numberValue === null) {
    return null;
  }

  return Math.max(0, Math.min(100, numberValue));
}

function normalizeDuration(value: unknown) {
  const numberValue = getNumber(value);

  if (numberValue === null) {
    return null;
  }

  return Math.max(0, Math.min(10000, Math.round(numberValue)));
}

function normalizeOrder(value: unknown) {
  const numberValue = getNumber(value);

  if (numberValue === null) {
    return null;
  }

  return Math.max(0, Math.min(24, Math.round(numberValue)));
}

function normalizeDesktopHoverBehavior(value: unknown): HeroSceneDesktopHoverBehavior {
  const text = getText(value) as HeroSceneDesktopHoverBehavior;
  return ["focus-label", "highlight-contour", "quiet"].includes(text) ? text : "highlight-contour";
}

function normalizeMobileBehavior(value: unknown): HeroSceneMobileBehavior {
  const text = getText(value) as HeroSceneMobileBehavior;
  return ["auto-cycle", "tap-only"].includes(text) ? text : "auto-cycle";
}

function normalizeEasing(value: unknown, fallback = "cubic-bezier(0.22, 1, 0.36, 1)") {
  const text = getText(value, fallback);

  if (!text) {
    return fallback;
  }

  return text.length > 72 ? text.slice(0, 72) : text;
}

function normalizeStringList(value: unknown) {
  return getArray<unknown>(value)
    .map((item) => getText(item))
    .filter(Boolean);
}

function normalizeStableColumnCount(value: unknown) {
  const numberValue = getNumber(value);

  if (numberValue === null) {
    return null;
  }

  return Math.max(1, Math.min(6, Math.round(numberValue)));
}

function normalizeDesktopLayoutMode(value: unknown): HeaderDesktopLayoutMode {
  const text = getText(value) as HeaderDesktopLayoutMode;
  return ["brand-left-actions-right", "centered-brand", "route-specific"].includes(text)
    ? text
    : "brand-left-actions-right";
}

function normalizeMobileLayoutMode(value: unknown): HeaderMobileLayoutMode {
  const text = getText(value) as HeaderMobileLayoutMode;
  return ["logo-center-actions-sides", "logo-left-drawer-right"].includes(text) ? text : "logo-center-actions-sides";
}

function normalizeLanguageDisplayMode(value: unknown): HeaderLanguageDisplayMode {
  const text = getText(value) as HeaderLanguageDisplayMode;
  return ["current-locale-label", "short-code", "short-code-with-name"].includes(text)
    ? text
    : "short-code";
}

function normalizeMegaMenuGrouping(value: unknown): HeaderMegaMenuGrouping {
  const text = getText(value) as HeaderMegaMenuGrouping;
  return ["direction-category-product", "direction-product", "category-product"].includes(text)
    ? text
    : "direction-category-product";
}

function normalizeMenuCloseBehavior(value: unknown): HeaderMenuCloseBehavior {
  const text = getText(value) as HeaderMenuCloseBehavior;
  return ["after-selection", "manual-only"].includes(text) ? text : "after-selection";
}

function normalizeMenuOpenBehavior(value: unknown): HeaderMenuOpenBehavior {
  const text = getText(value) as HeaderMenuOpenBehavior;
  return ["hover-and-click", "click-only"].includes(text) ? text : "hover-and-click";
}

function normalizeMobileLogoTransition(value: unknown): HeaderMobileLogoTransition {
  const text = getText(value) as HeaderMobileLogoTransition;
  return ["crossfade-center", "slide-to-center", "static"].includes(text) ? text : "crossfade-center";
}

function hasPatchKey<T extends object>(patch: T, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

function assertOwnerSafeHeroScenePatch(role: AdminRole, patch: ModuleSettingsPatch | undefined) {
  if (role !== "owner" || !patch?.heroScene) {
    return;
  }

  const heroScene = patch.heroScene;
  const blockedFields: string[] = [];
  const blockedHeroSceneFields: Array<keyof HeroSceneSettingsPatch> = [
    "desktopHoverBehavior",
    "focalDesktopX",
    "focalDesktopY",
    "focalMobileX",
    "focalMobileY",
    "mobileBehavior",
    "mobileCycleDurationMs",
    "mobileEasing",
    "reducedMotionFallback",
  ];
  const blockedHotspotFields: Array<keyof HeroSceneHotspotPatch> = [
    "autoHighlightDurationMs",
    "easing",
    "height",
    "hitAreaPath",
    "mobileCycleOrder",
    "visualContourPath",
    "width",
    "x",
    "y",
  ];

  for (const field of blockedHeroSceneFields) {
    if (hasPatchKey(heroScene, field)) {
      blockedFields.push(`heroScene.${String(field)}`);
    }
  }

  for (const hotspot of heroScene.hotspots ?? []) {
    const id = getText(hotspot.id, "hotspot");

    for (const field of blockedHotspotFields) {
      if (hasPatchKey(hotspot, field)) {
        blockedFields.push(`heroScene.hotspots.${id}.${String(field)}`);
      }
    }
  }

  if (blockedFields.length > 0) {
    throw new ModuleSettingsCommandError(
      "forbidden",
      `Owner role cannot edit site-admin/developer hero scene tuning fields: ${blockedFields.join(", ")}`,
    );
  }
}

function assertOwnerSafeHeaderMenuLanguagePatch(role: AdminRole, patch: ModuleSettingsPatch | undefined) {
  if (role !== "owner" || !patch?.headerMenuLanguage) {
    return;
  }

  const header = patch.headerMenuLanguage;
  const blockedFields: Array<keyof HeaderMenuLanguageSettingsPatch> = [
    "desktopLayoutMode",
    "logoTransitionDurationMs",
    "logoTransitionEasing",
    "menuOpenBehavior",
    "menuRevealDurationMs",
    "menuRevealEasing",
    "mobileLayoutMode",
    "mobileLogoTransition",
    "reducedMotionMode",
    "routeAlignmentNotes",
    "stableColumnCount",
  ];
  const hits = blockedFields.filter((field) => hasPatchKey(header, field));

  if (hits.length > 0) {
    throw new ModuleSettingsCommandError(
      "forbidden",
      `Owner role cannot edit site-admin/developer header tuning fields: ${hits
        .map((field) => `headerMenuLanguage.${String(field)}`)
        .join(", ")}`,
    );
  }
}

function defaultHeroSceneHotspots(): HeroSceneHotspotState[] {
  return [
    {
      autoHighlightDurationMs: 1800,
      displayName: "Экран Vision MAX",
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      geometry: { height: 36, width: 34, x: 50, y: 34 },
      hitAreaPath: "M34 18 H66 V52 H34 Z",
      id: "vision-screen",
      linkedTarget: { categoryId: null, pageId: null, productId: null, targetKind: "product" },
      mobileCycleOrder: 1,
      visible: true,
      visualContourPath: "M36 20 H64 V50 H36 Z",
      warnings: [],
    },
    {
      autoHighlightDurationMs: 1800,
      displayName: "Акустика",
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      geometry: { height: 44, width: 18, x: 22, y: 54 },
      hitAreaPath: "M13 32 H31 V76 H13 Z",
      id: "left-speaker",
      linkedTarget: { categoryId: null, pageId: null, productId: null, targetKind: "category" },
      mobileCycleOrder: 2,
      visible: true,
      visualContourPath: "M15 34 H29 V74 H15 Z",
      warnings: [],
    },
    {
      autoHighlightDurationMs: 1800,
      displayName: "Электроника",
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      geometry: { height: 16, width: 28, x: 58, y: 70 },
      hitAreaPath: "M44 62 H72 V78 H44 Z",
      id: "electronics-console",
      linkedTarget: { categoryId: null, pageId: null, productId: null, targetKind: "category" },
      mobileCycleOrder: 3,
      visible: true,
      visualContourPath: "M46 64 H70 V76 H46 Z",
      warnings: [],
    },
  ];
}

function normalizeHeroHotspot(value: unknown, fallback?: HeroSceneHotspotState): HeroSceneHotspotState {
  const row = toRecord(value);
  const id = getText(row.hotspotId) || getText(row.id) || fallback?.id || "scene-hotspot";
  const targetKind = normalizeTargetKind(row.targetKind ?? fallback?.linkedTarget.targetKind);
  const geometry = {
    height: normalizeCrop(row.height) ?? fallback?.geometry.height ?? null,
    width: normalizeCrop(row.width) ?? fallback?.geometry.width ?? null,
    x: normalizeCrop(row.x) ?? fallback?.geometry.x ?? null,
    y: normalizeCrop(row.y) ?? fallback?.geometry.y ?? null,
  };

  return {
    autoHighlightDurationMs:
      normalizeDuration(row.autoHighlightDurationMs) ?? fallback?.autoHighlightDurationMs ?? 1800,
    displayName: getText(row.displayName, fallback?.displayName ?? id),
    easing: normalizeEasing(row.easing, fallback?.easing),
    geometry,
    hitAreaPath: getText(row.hitAreaPath, fallback?.hitAreaPath ?? ""),
    id,
    linkedTarget: {
      categoryId: getRelationId(row.linkedCategory) ?? fallback?.linkedTarget.categoryId ?? null,
      pageId: getRelationId(row.linkedPage) ?? fallback?.linkedTarget.pageId ?? null,
      productId: getRelationId(row.linkedProduct) ?? fallback?.linkedTarget.productId ?? null,
      targetKind,
    },
    mobileCycleOrder: normalizeOrder(row.mobileCycleOrder) ?? fallback?.mobileCycleOrder ?? null,
    visible: row.visible !== false,
    visualContourPath: getText(row.visualContourPath, fallback?.visualContourPath ?? ""),
    warnings: [],
  };
}

function buildHeroHotspotWarnings(hotspot: HeroSceneHotspotState) {
  const warnings: string[] = [];
  const { height, width, x, y } = hotspot.geometry;

  if (x === null || y === null || x < 0 || x > 100 || y < 0 || y > 100) {
    warnings.push(`Проверьте координаты зоны "${hotspot.displayName}".`);
  }

  if (width === null || height === null || width <= 0 || height <= 0) {
    warnings.push(`Задайте размер кликабельной зоны "${hotspot.displayName}".`);
  }

  if (hotspot.visible && !hotspot.visualContourPath) {
    warnings.push(`Добавьте визуальный контур для зоны "${hotspot.displayName}".`);
  }

  if (hotspot.visible && !hotspot.hitAreaPath) {
    warnings.push(`Добавьте отдельную область клика для зоны "${hotspot.displayName}".`);
  }

  return warnings;
}

function buildHeroSceneWarnings(scene: HeroSceneSettingsState) {
  const warnings: string[] = [];
  const visibleHotspots = scene.hotspots.filter((hotspot) => hotspot.visible);

  if (!scene.media.desktopImageId && !scene.media.desktopVideoId) {
    warnings.push("Выберите desktop изображение или видео для интерактивной hero сцены.");
  }

  if (scene.ctaPlaque.visible && visibleHotspots.some((hotspot) => (hotspot.geometry.x ?? 100) < 42 && (hotspot.geometry.y ?? 0) > 58)) {
    warnings.push("CTA-плашка может перекрывать важный продукт в нижней левой части сцены.");
  }

  for (const hotspot of visibleHotspots) {
    warnings.push(...hotspot.warnings);
  }

  return warnings;
}

function readHeroSceneSettings(row: GenericRecord, moduleId: string): HeroSceneSettingsState | null {
  if (moduleId !== "homepage.hero-product-scene") {
    return null;
  }

  const sceneRow = toRecord(row.heroScene);
  const storedHotspots = getArray<GenericRecord>(sceneRow.hotspots);
  const fallbackHotspots = defaultHeroSceneHotspots();
  const hotspots = (storedHotspots.length > 0 ? storedHotspots : fallbackHotspots).map((item, index) => {
    const hotspot = normalizeHeroHotspot(item, fallbackHotspots[index]);
    return {
      ...hotspot,
      warnings: buildHeroHotspotWarnings(hotspot),
    };
  });
  const scene: HeroSceneSettingsState = {
    behavior: {
      desktopHoverBehavior: normalizeDesktopHoverBehavior(sceneRow.desktopHoverBehavior),
      mobileBehavior: normalizeMobileBehavior(sceneRow.mobileBehavior),
      mobileCycleDurationMs: normalizeDuration(sceneRow.mobileCycleDurationMs) ?? 2400,
      mobileEasing: normalizeEasing(sceneRow.mobileEasing),
      reducedMotionFallback: normalizeReducedMotionMode(sceneRow.reducedMotionFallback),
    },
    brandText: getText(sceneRow.brandText, "Montelar"),
    ctaPlaque: {
      buttonHref: normalizePath(sceneRow.ctaButtonHref || row.buttonHref || "/contact"),
      buttonLabel: getText(sceneRow.ctaButtonLabel || row.buttonLabel, "Обсудить проект"),
      text: getText(sceneRow.ctaText || row.text, "Персональная настройка изображения, звука и пространства."),
      title: getText(sceneRow.ctaTitle || row.title, "Архитектура изображения, звука и AI дизайна"),
      visible: sceneRow.ctaVisible !== false,
    },
    focal: {
      desktop: {
        x: normalizeCrop(sceneRow.focalDesktopX ?? row.desktopCropX),
        y: normalizeCrop(sceneRow.focalDesktopY ?? row.desktopCropY),
      },
      mobile: {
        x: normalizeCrop(sceneRow.focalMobileX ?? row.mobileCropX),
        y: normalizeCrop(sceneRow.focalMobileY ?? row.mobileCropY),
      },
    },
    hotspots,
    media: {
      desktopImageId: getRelationId(sceneRow.desktopMedia),
      desktopVideoId: getRelationId(sceneRow.desktopVideoMedia),
      mobileImageId: getRelationId(sceneRow.mobileMedia),
      mobileVideoId: getRelationId(sceneRow.mobileVideoMedia),
    },
    preview: {
      publicPage: "/",
      usage: "Первый экран главной: интерактивная сцена с продуктами, CTA и подсветкой зон.",
    },
    sloganText: getText(sceneRow.sloganText, "Тихая роскошь"),
    warnings: [],
  };

  return {
    ...scene,
    warnings: buildHeroSceneWarnings(scene),
  };
}

function isHeaderMenuLanguageModule(moduleId: string) {
  return [
    "global.header-desktop",
    "global.products-mega-menu",
    "global.mobile-menu-language-logo",
  ].includes(moduleId);
}

function buildHeaderMenuLanguageWarnings(settings: HeaderMenuLanguageSettingsState) {
  const warnings: string[] = [];

  if (!settings.languageSwitcher.enabledLanguageCodes.includes(settings.languageSwitcher.defaultLanguageCode)) {
    warnings.push("Default language must be enabled in the public switcher.");
  }

  if (settings.languageSwitcher.order.some((code) => !settings.languageSwitcher.enabledLanguageCodes.includes(code))) {
    warnings.push("Language order contains a language hidden from the switcher.");
  }

  if (settings.megaMenu.stableColumnCount !== null && settings.megaMenu.stableColumnCount < 2) {
    warnings.push("Mega menu should keep at least two stable columns or use automatic grouping.");
  }

  if (settings.motion.menuRevealDurationMs !== null && settings.motion.menuRevealDurationMs < 120) {
    warnings.push("Menu reveal timing should stay calm: use 120 ms or more.");
  }

  return warnings;
}

function readHeaderMenuLanguageSettings(row: GenericRecord, moduleId: string): HeaderMenuLanguageSettingsState | null {
  if (!isHeaderMenuLanguageModule(moduleId)) {
    return null;
  }

  const headerRow = toRecord(row.headerMenuLanguage);
  const languageOrder = normalizeStringList(headerRow.languageOrder);
  const enabledLanguageCodes = normalizeStringList(headerRow.enabledLanguageCodes);
  const fallbackEnabledLanguages = enabledLanguageCodes.length > 0 ? enabledLanguageCodes : ["ru", "en", "es", "fr", "de", "zh", "ja"];
  const fallbackOrder = languageOrder.length > 0 ? languageOrder : fallbackEnabledLanguages;
  const settings: HeaderMenuLanguageSettingsState = {
    consultationCta: {
      href: normalizePath(headerRow.consultationCtaHref || row.buttonHref || "/contact"),
      label: getText(headerRow.consultationCtaLabel || row.buttonLabel, "Обсудить проект"),
      visible: headerRow.consultationCtaVisible !== false,
    },
    desktopLayoutMode: normalizeDesktopLayoutMode(headerRow.desktopLayoutMode),
    languageSwitcher: {
      defaultLanguageCode: getText(headerRow.defaultLanguageCode, fallbackOrder[0] ?? "ru"),
      displayMode: normalizeLanguageDisplayMode(headerRow.languageSwitcherDisplay),
      enabledLanguageCodes: fallbackEnabledLanguages,
      order: fallbackOrder,
    },
    logo: {
      alignmentNote: getText(headerRow.logoAlignmentNote, "Desktop brand mark stays compact; mobile mark remains optically centered."),
      assetId: getRelationId(headerRow.logoAsset),
      mobileTransition: normalizeMobileLogoTransition(headerRow.mobileLogoTransition),
      transitionDurationMs: normalizeDuration(headerRow.logoTransitionDurationMs) ?? 360,
      transitionEasing: normalizeEasing(headerRow.logoTransitionEasing),
    },
    megaMenu: {
      closeBehavior: normalizeMenuCloseBehavior(headerRow.closeBehavior),
      grouping: normalizeMegaMenuGrouping(headerRow.megaMenuGrouping),
      openBehavior: normalizeMenuOpenBehavior(headerRow.menuOpenBehavior),
      stableColumnCount: normalizeStableColumnCount(headerRow.stableColumnCount) ?? 3,
    },
    mobileLayoutMode: normalizeMobileLayoutMode(headerRow.mobileLayoutMode),
    motion: {
      menuRevealDurationMs: normalizeDuration(headerRow.menuRevealDurationMs) ?? 420,
      menuRevealEasing: normalizeEasing(headerRow.menuRevealEasing),
      reducedMotionMode: normalizeReducedMotionMode(headerRow.reducedMotionMode || row.reducedMotionMode),
    },
    phoneButton: {
      label: getText(headerRow.phoneButtonLabel, "Позвонить"),
      visible: headerRow.phoneButtonVisible !== false,
    },
    routeAlignmentNotes: getText(
      headerRow.routeAlignmentNotes,
      "Route-specific optical shifts must preserve approved header composition and language placement.",
    ),
    warnings: [],
  };

  return {
    ...settings,
    warnings: buildHeaderMenuLanguageWarnings(settings),
  };
}

function readStoredSettings(record: GenericRecord | null, moduleId: string): ModuleSettingsState {
  const row =
    getArray<GenericRecord>(record?.customModuleSettings).find((item) => getText(item.moduleId) === moduleId) ?? {};

  return {
    buttonHref: getText(row.buttonHref),
    buttonLabel: getText(row.buttonLabel),
    commandGroups: [
      "Видимость",
      "Текст и кнопка",
      "Медиа и ссылка",
      "Кадрирование",
      "Движение",
      "Reduced motion",
      ...(moduleId === "homepage.hero-product-scene"
        ? ["Hero сцена", "CTA-плашка", "Продуктовые зоны", "Mobile auto-highlight"]
        : []),
      ...(isHeaderMenuLanguageModule(moduleId)
        ? ["Header layout", "Menu behavior", "Language switcher", "Logo motion", "Reduced motion"]
        : []),
    ],
    crop: {
      desktop: {
        x: normalizeCrop(row.desktopCropX),
        y: normalizeCrop(row.desktopCropY),
      },
      mobile: {
        x: normalizeCrop(row.mobileCropX),
        y: normalizeCrop(row.mobileCropY),
      },
    },
    headerMenuLanguage: readHeaderMenuLanguageSettings(row, moduleId),
    heroScene: readHeroSceneSettings(row, moduleId),
    linkedTarget: {
      categoryId: getRelationId(row.linkedCategory),
      mediaId: getRelationId(row.linkedMedia),
      pageId: getRelationId(row.linkedPage),
      productId: getRelationId(row.linkedProduct),
      targetKind: normalizeTargetKind(row.targetKind),
    },
    motion: {
      durationMs: normalizeDuration(row.motionDurationMs),
      enabled: row.motionEnabled !== false,
      reducedMotionMode: normalizeReducedMotionMode(row.reducedMotionMode),
    },
    ownerNotes: getText(row.ownerNotes),
    position: {
      desktop: normalizePosition(row.desktopPosition),
      mobile: normalizePosition(row.mobilePosition),
    },
    publicationState: getText(row.publicationState) === "ready-for-publish" ? "ready-for-publish" : "draft",
    text: getText(row.text),
    title: getText(row.title),
    visible: row.visible !== false,
  };
}

function mergeHeroHotspot(
  current: HeroSceneHotspotState,
  patch: HeroSceneHotspotPatch,
): HeroSceneHotspotState {
  const targetKind = normalizeTargetKind(patch.targetKind ?? current.linkedTarget.targetKind);
  const hotspot: HeroSceneHotspotState = {
    ...current,
    autoHighlightDurationMs:
      typeof patch.autoHighlightDurationMs === "undefined"
        ? current.autoHighlightDurationMs
        : normalizeDuration(patch.autoHighlightDurationMs),
    displayName: typeof patch.displayName === "undefined" ? current.displayName : getText(patch.displayName),
    easing: typeof patch.easing === "undefined" ? current.easing : normalizeEasing(patch.easing),
    geometry: {
      height: typeof patch.height === "undefined" ? current.geometry.height : normalizeCrop(patch.height),
      width: typeof patch.width === "undefined" ? current.geometry.width : normalizeCrop(patch.width),
      x: typeof patch.x === "undefined" ? current.geometry.x : normalizeCrop(patch.x),
      y: typeof patch.y === "undefined" ? current.geometry.y : normalizeCrop(patch.y),
    },
    hitAreaPath: typeof patch.hitAreaPath === "undefined" ? current.hitAreaPath : getText(patch.hitAreaPath),
    linkedTarget: {
      categoryId:
        typeof patch.linkedCategoryId === "undefined"
          ? current.linkedTarget.categoryId
          : getRelationId(patch.linkedCategoryId),
      pageId:
        typeof patch.linkedPageId === "undefined" ? current.linkedTarget.pageId : getRelationId(patch.linkedPageId),
      productId:
        typeof patch.linkedProductId === "undefined"
          ? current.linkedTarget.productId
          : getRelationId(patch.linkedProductId),
      targetKind,
    },
    mobileCycleOrder:
      typeof patch.mobileCycleOrder === "undefined"
        ? current.mobileCycleOrder
        : normalizeOrder(patch.mobileCycleOrder),
    visible: typeof patch.visible === "undefined" ? current.visible : getBoolean(patch.visible, current.visible),
    visualContourPath:
      typeof patch.visualContourPath === "undefined" ? current.visualContourPath : getText(patch.visualContourPath),
  };

  return {
    ...hotspot,
    warnings: buildHeroHotspotWarnings(hotspot),
  };
}

function mergeHeroSceneSettings(
  current: HeroSceneSettingsState | null,
  patch: HeroSceneSettingsPatch | undefined,
): HeroSceneSettingsState | null {
  if (!current) {
    return null;
  }

  if (!patch) {
    return current;
  }

  const currentHotspots = new Map(current.hotspots.map((hotspot) => [hotspot.id, hotspot]));
  const patchedHotspots = patch.hotspots
    ? patch.hotspots.map((item) => {
        const id = getText(item.id);
        const fallback =
          currentHotspots.get(id) ??
          ({
            autoHighlightDurationMs: 1800,
            displayName: id || "Новая зона",
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            geometry: { height: null, width: null, x: null, y: null },
            hitAreaPath: "",
            id: id || "scene-hotspot",
            linkedTarget: { categoryId: null, pageId: null, productId: null, targetKind: "url" },
            mobileCycleOrder: null,
            visible: true,
            visualContourPath: "",
            warnings: [],
          } satisfies HeroSceneHotspotState);

        return mergeHeroHotspot(fallback, item);
      })
    : current.hotspots;
  const scene: HeroSceneSettingsState = {
    ...current,
    behavior: {
      desktopHoverBehavior:
        typeof patch.desktopHoverBehavior === "undefined"
          ? current.behavior.desktopHoverBehavior
          : normalizeDesktopHoverBehavior(patch.desktopHoverBehavior),
      mobileBehavior:
        typeof patch.mobileBehavior === "undefined"
          ? current.behavior.mobileBehavior
          : normalizeMobileBehavior(patch.mobileBehavior),
      mobileCycleDurationMs:
        typeof patch.mobileCycleDurationMs === "undefined"
          ? current.behavior.mobileCycleDurationMs
          : normalizeDuration(patch.mobileCycleDurationMs),
      mobileEasing:
        typeof patch.mobileEasing === "undefined" ? current.behavior.mobileEasing : normalizeEasing(patch.mobileEasing),
      reducedMotionFallback:
        typeof patch.reducedMotionFallback === "undefined"
          ? current.behavior.reducedMotionFallback
          : normalizeReducedMotionMode(patch.reducedMotionFallback),
    },
    brandText: typeof patch.brandText === "undefined" ? current.brandText : getText(patch.brandText),
    ctaPlaque: {
      buttonHref:
        typeof patch.ctaButtonHref === "undefined" ? current.ctaPlaque.buttonHref : normalizePath(patch.ctaButtonHref),
      buttonLabel:
        typeof patch.ctaButtonLabel === "undefined" ? current.ctaPlaque.buttonLabel : getText(patch.ctaButtonLabel),
      text: typeof patch.ctaText === "undefined" ? current.ctaPlaque.text : getText(patch.ctaText),
      title: typeof patch.ctaTitle === "undefined" ? current.ctaPlaque.title : getText(patch.ctaTitle),
      visible:
        typeof patch.ctaVisible === "undefined" ? current.ctaPlaque.visible : getBoolean(patch.ctaVisible, true),
    },
    focal: {
      desktop: {
        x: typeof patch.focalDesktopX === "undefined" ? current.focal.desktop.x : normalizeCrop(patch.focalDesktopX),
        y: typeof patch.focalDesktopY === "undefined" ? current.focal.desktop.y : normalizeCrop(patch.focalDesktopY),
      },
      mobile: {
        x: typeof patch.focalMobileX === "undefined" ? current.focal.mobile.x : normalizeCrop(patch.focalMobileX),
        y: typeof patch.focalMobileY === "undefined" ? current.focal.mobile.y : normalizeCrop(patch.focalMobileY),
      },
    },
    hotspots: patchedHotspots,
    media: {
      desktopImageId:
        typeof patch.desktopMediaId === "undefined" ? current.media.desktopImageId : getRelationId(patch.desktopMediaId),
      desktopVideoId:
        typeof patch.desktopVideoMediaId === "undefined"
          ? current.media.desktopVideoId
          : getRelationId(patch.desktopVideoMediaId),
      mobileImageId:
        typeof patch.mobileMediaId === "undefined" ? current.media.mobileImageId : getRelationId(patch.mobileMediaId),
      mobileVideoId:
        typeof patch.mobileVideoMediaId === "undefined"
          ? current.media.mobileVideoId
          : getRelationId(patch.mobileVideoMediaId),
    },
    sloganText: typeof patch.sloganText === "undefined" ? current.sloganText : getText(patch.sloganText),
  };

  return {
    ...scene,
    warnings: buildHeroSceneWarnings(scene),
  };
}

function mergeHeaderMenuLanguageSettings(
  current: HeaderMenuLanguageSettingsState | null,
  patch: HeaderMenuLanguageSettingsPatch | undefined,
): HeaderMenuLanguageSettingsState | null {
  if (!current) {
    return null;
  }

  if (!patch) {
    return current;
  }

  const settings: HeaderMenuLanguageSettingsState = {
    ...current,
    consultationCta: {
      href:
        typeof patch.consultationCtaHref === "undefined"
          ? current.consultationCta.href
          : normalizePath(patch.consultationCtaHref),
      label:
        typeof patch.consultationCtaLabel === "undefined"
          ? current.consultationCta.label
          : getText(patch.consultationCtaLabel),
      visible:
        typeof patch.consultationCtaVisible === "undefined"
          ? current.consultationCta.visible
          : getBoolean(patch.consultationCtaVisible, current.consultationCta.visible),
    },
    desktopLayoutMode:
      typeof patch.desktopLayoutMode === "undefined"
        ? current.desktopLayoutMode
        : normalizeDesktopLayoutMode(patch.desktopLayoutMode),
    languageSwitcher: {
      defaultLanguageCode:
        typeof patch.defaultLanguageCode === "undefined"
          ? current.languageSwitcher.defaultLanguageCode
          : getText(patch.defaultLanguageCode, current.languageSwitcher.defaultLanguageCode),
      displayMode:
        typeof patch.languageSwitcherDisplay === "undefined"
          ? current.languageSwitcher.displayMode
          : normalizeLanguageDisplayMode(patch.languageSwitcherDisplay),
      enabledLanguageCodes:
        typeof patch.enabledLanguageCodes === "undefined"
          ? current.languageSwitcher.enabledLanguageCodes
          : normalizeStringList(patch.enabledLanguageCodes),
      order:
        typeof patch.languageOrder === "undefined"
          ? current.languageSwitcher.order
          : normalizeStringList(patch.languageOrder),
    },
    logo: {
      alignmentNote:
        typeof patch.logoAlignmentNote === "undefined" ? current.logo.alignmentNote : getText(patch.logoAlignmentNote),
      assetId: typeof patch.logoAssetId === "undefined" ? current.logo.assetId : getRelationId(patch.logoAssetId),
      mobileTransition:
        typeof patch.mobileLogoTransition === "undefined"
          ? current.logo.mobileTransition
          : normalizeMobileLogoTransition(patch.mobileLogoTransition),
      transitionDurationMs:
        typeof patch.logoTransitionDurationMs === "undefined"
          ? current.logo.transitionDurationMs
          : normalizeDuration(patch.logoTransitionDurationMs),
      transitionEasing:
        typeof patch.logoTransitionEasing === "undefined"
          ? current.logo.transitionEasing
          : normalizeEasing(patch.logoTransitionEasing),
    },
    megaMenu: {
      closeBehavior:
        typeof patch.closeBehavior === "undefined"
          ? current.megaMenu.closeBehavior
          : normalizeMenuCloseBehavior(patch.closeBehavior),
      grouping:
        typeof patch.megaMenuGrouping === "undefined"
          ? current.megaMenu.grouping
          : normalizeMegaMenuGrouping(patch.megaMenuGrouping),
      openBehavior:
        typeof patch.menuOpenBehavior === "undefined"
          ? current.megaMenu.openBehavior
          : normalizeMenuOpenBehavior(patch.menuOpenBehavior),
      stableColumnCount:
        typeof patch.stableColumnCount === "undefined"
          ? current.megaMenu.stableColumnCount
          : normalizeStableColumnCount(patch.stableColumnCount),
    },
    mobileLayoutMode:
      typeof patch.mobileLayoutMode === "undefined"
        ? current.mobileLayoutMode
        : normalizeMobileLayoutMode(patch.mobileLayoutMode),
    motion: {
      menuRevealDurationMs:
        typeof patch.menuRevealDurationMs === "undefined"
          ? current.motion.menuRevealDurationMs
          : normalizeDuration(patch.menuRevealDurationMs),
      menuRevealEasing:
        typeof patch.menuRevealEasing === "undefined"
          ? current.motion.menuRevealEasing
          : normalizeEasing(patch.menuRevealEasing),
      reducedMotionMode:
        typeof patch.reducedMotionMode === "undefined"
          ? current.motion.reducedMotionMode
          : normalizeReducedMotionMode(patch.reducedMotionMode),
    },
    phoneButton: {
      label: typeof patch.phoneButtonLabel === "undefined" ? current.phoneButton.label : getText(patch.phoneButtonLabel),
      visible:
        typeof patch.phoneButtonVisible === "undefined"
          ? current.phoneButton.visible
          : getBoolean(patch.phoneButtonVisible, current.phoneButton.visible),
    },
    routeAlignmentNotes:
      typeof patch.routeAlignmentNotes === "undefined" ? current.routeAlignmentNotes : getText(patch.routeAlignmentNotes),
  };

  return {
    ...settings,
    warnings: buildHeaderMenuLanguageWarnings(settings),
  };
}

function mergeSettings(current: ModuleSettingsState, patch: ModuleSettingsPatch = {}): ModuleSettingsState {
  const targetKind = normalizeTargetKind(patch.targetKind ?? current.linkedTarget.targetKind);

  return {
    ...current,
    buttonHref:
      typeof patch.buttonHref === "undefined" ? current.buttonHref : normalizePath(patch.buttonHref),
    buttonLabel:
      typeof patch.buttonLabel === "undefined" ? current.buttonLabel : getText(patch.buttonLabel),
    crop: {
      desktop: {
        x: typeof patch.desktopCropX === "undefined" ? current.crop.desktop.x : normalizeCrop(patch.desktopCropX),
        y: typeof patch.desktopCropY === "undefined" ? current.crop.desktop.y : normalizeCrop(patch.desktopCropY),
      },
      mobile: {
        x: typeof patch.mobileCropX === "undefined" ? current.crop.mobile.x : normalizeCrop(patch.mobileCropX),
        y: typeof patch.mobileCropY === "undefined" ? current.crop.mobile.y : normalizeCrop(patch.mobileCropY),
      },
    },
    linkedTarget: {
      categoryId:
        typeof patch.linkedCategoryId === "undefined"
          ? current.linkedTarget.categoryId
          : getRelationId(patch.linkedCategoryId),
      mediaId:
        typeof patch.linkedMediaId === "undefined"
          ? current.linkedTarget.mediaId
          : getRelationId(patch.linkedMediaId),
      pageId:
        typeof patch.linkedPageId === "undefined" ? current.linkedTarget.pageId : getRelationId(patch.linkedPageId),
      productId:
        typeof patch.linkedProductId === "undefined"
          ? current.linkedTarget.productId
          : getRelationId(patch.linkedProductId),
      targetKind,
    },
    headerMenuLanguage: mergeHeaderMenuLanguageSettings(current.headerMenuLanguage, patch.headerMenuLanguage),
    heroScene: mergeHeroSceneSettings(current.heroScene, patch.heroScene),
    motion: {
      durationMs:
        typeof patch.motionDurationMs === "undefined"
          ? current.motion.durationMs
          : normalizeDuration(patch.motionDurationMs),
      enabled:
        typeof patch.motionEnabled === "undefined"
          ? current.motion.enabled
          : getBoolean(patch.motionEnabled, current.motion.enabled),
      reducedMotionMode:
        typeof patch.reducedMotionMode === "undefined"
          ? current.motion.reducedMotionMode
          : normalizeReducedMotionMode(patch.reducedMotionMode),
    },
    ownerNotes: typeof patch.ownerNotes === "undefined" ? current.ownerNotes : getText(patch.ownerNotes),
    position: {
      desktop:
        typeof patch.desktopPosition === "undefined"
          ? current.position.desktop
          : normalizePosition(patch.desktopPosition),
      mobile:
        typeof patch.mobilePosition === "undefined" ? current.position.mobile : normalizePosition(patch.mobilePosition),
    },
    text: typeof patch.text === "undefined" ? current.text : getText(patch.text),
    title: typeof patch.title === "undefined" ? current.title : getText(patch.title),
    visible: typeof patch.visible === "undefined" ? current.visible : getBoolean(patch.visible, current.visible),
  };
}

function validateModuleSettings(module: SiteModuleDefinition, settings: ModuleSettingsState) {
  const errors: string[] = [];

  if (!settings.visible) {
    return errors;
  }

  if (settings.buttonLabel && !settings.buttonHref) {
    errors.push("Укажите ссылку для кнопки модуля.");
  }

  if (settings.linkedTarget.targetKind === "product" && !settings.linkedTarget.productId) {
    errors.push("Выберите товар для клика по усилителю.");
  }

  if (settings.linkedTarget.targetKind === "category" && !settings.linkedTarget.categoryId) {
    errors.push("Выберите категорию, куда должен вести модуль.");
  }

  if (settings.linkedTarget.targetKind === "page" && !settings.linkedTarget.pageId) {
    errors.push("Выберите страницу, куда должен вести модуль.");
  }

  if (settings.motion.enabled && settings.motion.durationMs !== null && settings.motion.durationMs < 120) {
    errors.push("Задайте спокойную длительность движения от 120 мс или отключите движение.");
  }

  if (module.id === "routes.banner-media-crops" && settings.linkedTarget.mediaId === null && settings.title) {
    errors.push("Выберите изображение для баннера или уберите заголовок настройки.");
  }

  if (module.id === "homepage.hero-product-scene") {
    const scene = settings.heroScene;

    if (!scene) {
      errors.push("Откройте настройки интерактивной hero сцены.");
      return errors;
    }

    if (!scene.media.desktopImageId && !scene.media.desktopVideoId) {
      errors.push("Выберите desktop изображение или видео для интерактивной hero сцены.");
    }

    if (scene.ctaPlaque.visible && scene.ctaPlaque.buttonLabel && !scene.ctaPlaque.buttonHref) {
      errors.push("Укажите ссылку для кнопки CTA в hero сцене.");
    }

    const hotspotIds = new Set<string>();

    for (const hotspot of scene.hotspots.filter((item) => item.visible)) {
      if (hotspotIds.has(hotspot.id)) {
        errors.push(`Уберите дубль зоны "${hotspot.displayName}".`);
      }

      hotspotIds.add(hotspot.id);

      if (!hotspot.displayName) {
        errors.push("Назовите каждую продуктовую зону.");
      }

      if (hotspot.geometry.x === null || hotspot.geometry.y === null) {
        errors.push(`Проверьте координаты зоны "${hotspot.displayName || hotspot.id}".`);
      }

      if (hotspot.linkedTarget.targetKind === "product" && !hotspot.linkedTarget.productId) {
        errors.push(`Выберите товар для зоны "${hotspot.displayName}".`);
      }

      if (hotspot.linkedTarget.targetKind === "category" && !hotspot.linkedTarget.categoryId) {
        errors.push(`Выберите категорию для зоны "${hotspot.displayName}".`);
      }

      if (hotspot.linkedTarget.targetKind === "page" && !hotspot.linkedTarget.pageId) {
        errors.push(`Выберите страницу для зоны "${hotspot.displayName}".`);
      }

      if (hotspot.displayName.length > 48) {
        errors.push(`Сократите название зоны "${hotspot.displayName}".`);
      }
    }
  }

  if (isHeaderMenuLanguageModule(module.id)) {
    const headerSettings = settings.headerMenuLanguage;

    if (!headerSettings) {
      errors.push("Откройте настройки шапки, меню и языков.");
      return errors;
    }

    if (headerSettings.consultationCta.visible && !headerSettings.consultationCta.href) {
      errors.push("Укажите ссылку для консультационной кнопки в шапке.");
    }

    if (!headerSettings.languageSwitcher.enabledLanguageCodes.includes(headerSettings.languageSwitcher.defaultLanguageCode)) {
      errors.push("Выберите default язык из включенных языков переключателя.");
    }

    if (headerSettings.languageSwitcher.order.length === 0) {
      errors.push("Задайте порядок языков переключателя.");
    }

    if (headerSettings.motion.menuRevealDurationMs !== null && headerSettings.motion.menuRevealDurationMs < 120) {
      errors.push("Задайте спокойное открытие меню от 120 мс или отключите движение через reduced-motion поведение.");
    }
  }

  return errors;
}

function buildValidation(module: SiteModuleDefinition, settings: ModuleSettingsState) {
  const errors = validateModuleSettings(module, settings);

  return {
    errors,
    publishReady: errors.length === 0,
    summary: errors.length === 0 ? "Настройки можно готовить к публикации." : errors[0] ?? "Проверьте настройки.",
  };
}

function ownerText(value: string) {
  return value
    .replace(/\broutes?\b/gi, "pages")
    .replace(/\bcomponents?\b/gi, "site parts")
    .replace(/\btemplates?\b/gi, "layouts")
    .replace(/\brecords?\b/gi, "items")
    .replace(/\bcollections?\b/gi, "sections");
}

function buildReadModel(
  module: SiteModuleDefinition,
  settings: ModuleSettingsState,
): ModuleSettingsReadModel {
  return {
    actions: [
      {
        id: "module-settings.save-draft",
        label: "Сохранить черновик",
        method: "POST",
        path: moduleSettingsCommandPath,
      },
      {
        id: "module-settings.mark-ready",
        label: "Проверить и подготовить к публикации",
        method: "POST",
        path: moduleSettingsCommandPath,
      },
    ],
    description: ownerText(module.description),
    label: ownerText(module.label),
    moduleId: module.id,
    publicRoutes: module.routePaths,
    settings,
    validation: buildValidation(module, settings),
  };
}

async function findPublicSettings(payload: PayloadLike, locale: string) {
  const exact = await payload.find({
    collection: "site-settings",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          settingsScope: {
            equals: "public-site",
          },
        },
        {
          locale: {
            equals: locale,
          },
        },
      ],
    },
  });
  const exactRecord = (exact.docs as unknown as GenericRecord[])[0] ?? null;

  if (exactRecord) {
    return exactRecord;
  }

  const fallback = await payload.find({
    collection: "site-settings",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      settingsScope: {
        equals: "public-site",
      },
    },
  });

  return (fallback.docs as unknown as GenericRecord[])[0] ?? null;
}

async function requirePublicSettings(payload: PayloadLike, locale: string) {
  const settings = await findPublicSettings(payload, locale);

  if (!settings?.id) {
    throw new ModuleSettingsCommandError("invalid-input", "Сначала создайте публичные настройки сайта.");
  }

  return settings;
}

function findModule(registry: SiteModuleRegistrySnapshot, moduleId: string) {
  const module = registry.modules.find((item) => item.id === moduleId);

  if (!module) {
    throw new ModuleSettingsCommandError("invalid-input", "Выберите существующий модуль сайта.");
  }

  return module;
}

function serializeHeroHotspot(hotspot: HeroSceneHotspotState) {
  return {
    autoHighlightDurationMs: hotspot.autoHighlightDurationMs,
    displayName: hotspot.displayName,
    easing: hotspot.easing,
    height: hotspot.geometry.height,
    hitAreaPath: hotspot.hitAreaPath,
    hotspotId: hotspot.id,
    linkedCategory: toPayloadRelationId(hotspot.linkedTarget.categoryId),
    linkedPage: toPayloadRelationId(hotspot.linkedTarget.pageId),
    linkedProduct: toPayloadRelationId(hotspot.linkedTarget.productId),
    mobileCycleOrder: hotspot.mobileCycleOrder,
    targetKind: hotspot.linkedTarget.targetKind,
    visible: hotspot.visible,
    visualContourPath: hotspot.visualContourPath,
    width: hotspot.geometry.width,
    x: hotspot.geometry.x,
    y: hotspot.geometry.y,
  };
}

function serializeHeroSceneSettings(scene: HeroSceneSettingsState | null) {
  if (!scene) {
    return undefined;
  }

  return {
    brandText: scene.brandText,
    ctaButtonHref: scene.ctaPlaque.buttonHref,
    ctaButtonLabel: scene.ctaPlaque.buttonLabel,
    ctaText: scene.ctaPlaque.text,
    ctaTitle: scene.ctaPlaque.title,
    ctaVisible: scene.ctaPlaque.visible,
    desktopHoverBehavior: scene.behavior.desktopHoverBehavior,
    desktopMedia: toPayloadRelationId(scene.media.desktopImageId),
    desktopVideoMedia: toPayloadRelationId(scene.media.desktopVideoId),
    focalDesktopX: scene.focal.desktop.x,
    focalDesktopY: scene.focal.desktop.y,
    focalMobileX: scene.focal.mobile.x,
    focalMobileY: scene.focal.mobile.y,
    hotspots: scene.hotspots.map(serializeHeroHotspot),
    mobileBehavior: scene.behavior.mobileBehavior,
    mobileCycleDurationMs: scene.behavior.mobileCycleDurationMs,
    mobileEasing: scene.behavior.mobileEasing,
    mobileMedia: toPayloadRelationId(scene.media.mobileImageId),
    mobileVideoMedia: toPayloadRelationId(scene.media.mobileVideoId),
    reducedMotionFallback: scene.behavior.reducedMotionFallback,
    sloganText: scene.sloganText,
  };
}

function serializeHeaderMenuLanguageSettings(settings: HeaderMenuLanguageSettingsState | null) {
  if (!settings) {
    return undefined;
  }

  return {
    closeBehavior: settings.megaMenu.closeBehavior,
    consultationCtaHref: settings.consultationCta.href,
    consultationCtaLabel: settings.consultationCta.label,
    consultationCtaVisible: settings.consultationCta.visible,
    defaultLanguageCode: settings.languageSwitcher.defaultLanguageCode,
    desktopLayoutMode: settings.desktopLayoutMode,
    enabledLanguageCodes: settings.languageSwitcher.enabledLanguageCodes,
    languageOrder: settings.languageSwitcher.order,
    languageSwitcherDisplay: settings.languageSwitcher.displayMode,
    logoAlignmentNote: settings.logo.alignmentNote,
    logoAsset: toPayloadRelationId(settings.logo.assetId),
    logoTransitionDurationMs: settings.logo.transitionDurationMs,
    logoTransitionEasing: settings.logo.transitionEasing,
    megaMenuGrouping: settings.megaMenu.grouping,
    menuOpenBehavior: settings.megaMenu.openBehavior,
    menuRevealDurationMs: settings.motion.menuRevealDurationMs,
    menuRevealEasing: settings.motion.menuRevealEasing,
    mobileLayoutMode: settings.mobileLayoutMode,
    mobileLogoTransition: settings.logo.mobileTransition,
    phoneButtonLabel: settings.phoneButton.label,
    phoneButtonVisible: settings.phoneButton.visible,
    reducedMotionMode: settings.motion.reducedMotionMode,
    routeAlignmentNotes: settings.routeAlignmentNotes,
    stableColumnCount: settings.megaMenu.stableColumnCount,
  };
}

function serializeSettingsRow(module: SiteModuleDefinition, settings: ModuleSettingsState) {
  return {
    buttonHref: settings.buttonHref,
    buttonLabel: settings.buttonLabel,
    desktopCropX: settings.crop.desktop.x,
    desktopCropY: settings.crop.desktop.y,
    desktopPosition: settings.position.desktop,
    headerMenuLanguage: serializeHeaderMenuLanguageSettings(settings.headerMenuLanguage),
    heroScene: serializeHeroSceneSettings(settings.heroScene),
    linkedCategory: toPayloadRelationId(settings.linkedTarget.categoryId),
    linkedMedia: toPayloadRelationId(settings.linkedTarget.mediaId),
    linkedPage: toPayloadRelationId(settings.linkedTarget.pageId),
    linkedProduct: toPayloadRelationId(settings.linkedTarget.productId),
    mobileCropX: settings.crop.mobile.x,
    mobileCropY: settings.crop.mobile.y,
    mobilePosition: settings.position.mobile,
    moduleId: module.id,
    moduleLabel: module.label,
    motionDurationMs: settings.motion.durationMs,
    motionEnabled: settings.motion.enabled,
    ownerNotes: settings.ownerNotes,
    publicationState: settings.publicationState,
    reducedMotionMode: settings.motion.reducedMotionMode,
    targetKind: settings.linkedTarget.targetKind,
    text: settings.text,
    title: settings.title,
    visible: settings.visible,
  };
}

async function updateModuleSettingsRow(
  payload: PayloadLike,
  settingsRecord: GenericRecord,
  module: SiteModuleDefinition,
  settings: ModuleSettingsState,
) {
  const update = (input: Record<string, unknown>) => payload.update(input as never) as Promise<unknown>;
  const rows = getArray<GenericRecord>(settingsRecord.customModuleSettings).filter(
    (item) => getText(item.moduleId) !== module.id,
  );
  const nextRows = [...rows, serializeSettingsRow(module, settings)];

  return (await update({
    collection: "site-settings",
    data: {
      customModuleSettings: nextRows,
    },
    id: settingsRecord.id as number | string,
    overrideAccess: true,
    showHiddenFields: true,
  })) as unknown as GenericRecord;
}

async function writeAudit(
  req: PayloadRequest,
  input: {
    action: string;
    details: string;
    module: SiteModuleDefinition;
    settingsId: number | string;
  },
) {
  await createAuditEvent(req, {
    action: input.action,
    details: input.details,
    eventGroup: "settings",
    summary: `Настройки модуля "${input.module.label}" обновлены через guided API.`,
    target: {
      collection: "site-settings",
      id: input.settingsId,
      label: input.module.label,
    },
  });
}

export async function getModuleSettingsSnapshot(
  payload: PayloadLike,
  req: PayloadRequest,
  options: { locale?: string | null; moduleId?: string | null; successMessage?: string } = {},
): Promise<ModuleSettingsSnapshot> {
  requireModuleSettingsAccess(req);

  const locale = normalizeLocale(options.locale);
  const [registry, settingsRecord] = await Promise.all([
    getSiteModuleRegistry(payload),
    findPublicSettings(payload, locale),
  ]);
  const modules = registry.modules.map((module) => buildReadModel(module, readStoredSettings(settingsRecord, module.id)));
  const selectedModuleId = getText(options.moduleId) || modules[0]?.moduleId || null;
  const selectedModule = modules.find((module) => module.moduleId === selectedModuleId) ?? modules[0] ?? null;
  const snapshot: ModuleSettingsSnapshot = {
    canUpdate: true,
    generatedAt: new Date().toISOString(),
    locale,
    modules,
    registrySummary: registry.summary,
    selectedModule,
    selectedModuleId: selectedModule?.moduleId ?? null,
  };

  if (options.successMessage) {
    snapshot.successMessage = options.successMessage;
  }

  return snapshot;
}

export async function executeModuleSettingsCommand(
  payload: PayloadLike,
  req: PayloadRequest,
  input: ModuleSettingsCommandInput,
): Promise<ModuleSettingsSnapshot> {
  const user = requireModuleSettingsAccess(req);
  const locale = normalizeLocale(input.locale);
  const moduleId = getText(input.moduleId);

  if (!moduleId) {
    throw new ModuleSettingsCommandError("invalid-input", "Выберите модуль сайта.");
  }

  const [registry, settingsRecord] = await Promise.all([
    getSiteModuleRegistry(payload),
    requirePublicSettings(payload, locale),
  ]);
  const module = findModule(registry, moduleId);
  const currentSettings = readStoredSettings(settingsRecord, module.id);
  assertOwnerSafeHeroScenePatch(user.role, input.settings);
  assertOwnerSafeHeaderMenuLanguagePatch(user.role, input.settings);
  const mergedSettings = mergeSettings(currentSettings, input.settings);
  const validation = buildValidation(module, mergedSettings);

  if (input.action === "module-settings.mark-ready" && !validation.publishReady) {
    throw new ModuleSettingsCommandError("invalid-input", validation.errors[0] ?? "Проверьте настройки модуля.");
  }

  if (input.action !== "module-settings.save-draft" && input.action !== "module-settings.mark-ready") {
    throw new ModuleSettingsCommandError("invalid-input", "Выберите действие для настроек модуля.");
  }

  const nextSettings: ModuleSettingsState = {
    ...mergedSettings,
    publicationState: input.action === "module-settings.mark-ready" ? "ready-for-publish" : "draft",
  };
  await updateModuleSettingsRow(payload, settingsRecord, module, nextSettings);
  await writeAudit(req, {
    action: input.action === "module-settings.mark-ready" ? "module-settings-ready" : "module-settings-save-draft",
    details: `role=${user.role}; locale=${locale}; publishReady=${validation.publishReady}`,
    module,
    settingsId: settingsRecord.id as number | string,
  });

  return getModuleSettingsSnapshot(payload, req, {
    locale,
    moduleId: module.id,
    successMessage:
      input.action === "module-settings.mark-ready"
        ? "Настройки проверены и готовы к публикации."
        : "Черновик настроек модуля сохранен.",
  });
}

function ownerVisibleStrings(snapshot: ModuleSettingsSnapshot) {
  return snapshot.modules.flatMap((module) => [
    module.label,
    module.description,
    module.validation.summary,
    ...module.validation.errors,
    ...module.actions.map((action) => action.label),
    ...module.settings.commandGroups,
  ]);
}

export function assertNoRawModuleSettingsOutput(snapshot: ModuleSettingsSnapshot) {
  const forbiddenText = /\b(payload|collection|record|schema|raw|route|template|component file)\b/i;
  const failures: string[] = [];

  for (const value of ownerVisibleStrings(snapshot)) {
    if (forbiddenText.test(value)) {
      failures.push(value);
    }
  }

  return failures;
}
