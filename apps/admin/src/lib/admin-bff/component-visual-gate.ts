import type { Payload, PayloadRequest } from "payload";

import { getAdminUser } from "../payload/access.ts";
import { hasAdminRole } from "../payload/roles.ts";

import {
  assertNoRawModuleSettingsOutput,
  getModuleSettingsSnapshot,
  type ModuleSettingsReadModel,
} from "./module-settings-commands.ts";
import {
  assertNoRawSiteModuleRegistryOutput,
  getSiteModuleRegistry,
  type SiteModuleDefinition,
  type SiteModuleEditableField,
  type SiteModuleFieldStatus,
  type SiteModuleGap,
  type SiteModuleLayer,
} from "./site-module-registry.ts";

type PayloadLike = Payload;

export type ComponentVisualGateTarget = {
  editorHref: string;
  fieldLabel: string;
  fieldPath: string;
  layer: SiteModuleLayer;
  moduleId: string;
  moduleLabel: string;
  routePath: string | null;
};

export type ComponentVisualGateModule = {
  coverage: {
    editableNow: number;
    notCmsBacked: number;
    plannedCommands: number;
    readOnly: number;
  };
  editorTargets: ComponentVisualGateTarget[];
  fullyEditableNow: boolean;
  id: string;
  label: string;
  layer: SiteModuleLayer;
  publicUsage: string[];
  routePaths: string[];
  settingState: "ready-for-publish" | "draft" | "not-settings-backed" | "not-readable-for-role";
  validationErrors: string[];
  visualHooks: string[];
};

export type ComponentVisualGateIssue = {
  editorHref: string;
  fieldPath: string;
  id: string;
  moduleId: string;
  moduleLabel: string;
  reason: string;
  routePath: string | null;
  severity: "blocker" | "warning" | "watch";
  targetLayer: SiteModuleLayer;
  title: string;
};

export type ComponentVisualGateSnapshot = {
  generatedAt: string;
  issues: ComponentVisualGateIssue[];
  modules: ComponentVisualGateModule[];
  publicEvidenceTargets: Array<{
    id: string;
    label: string;
    routePath: string;
    state: "required";
  }>;
  summary: {
    fullyEditableNow: number;
    issues: number;
    modules: number;
    notSettingsBacked: number;
    routes: number;
    settingsReadable: boolean;
  };
  textFailures: string[];
};

const settingsReadableRoles = ["owner", "admin", "developer"] as const;
const moduleLabelById: Record<string, string> = {
  "global.contact-cta": "Контакты и консультация",
  "global.footer-legal-contact": "Footer и служебные ссылки",
  "global.header-desktop": "Шапка на desktop",
  "global.mobile-menu-language-logo": "Mobile меню, язык и логотип",
  "global.products-mega-menu": "Меню продуктов",
  "homepage.hero-plaque": "Текст главной и консультационная плашка",
  "homepage.hero-product-scene": "Интерактивная сцена главной",
  "homepage.motion-and-hero-media": "Движение и медиа главной",
  "routes.banner-media-crops": "Баннеры внутренних страниц",
};

const fieldLabelByPath: Record<string, string> = {
  contactPrimaryHref: "Ссылка основной консультации",
  contactPrimaryLabel: "Текст основной консультации",
  contactPhoneDisplay: "Телефон в шапке",
  directionHeroText: "Текст баннера направления",
  footerLegalName: "Юридическое имя в footer",
  footerMenuItems: "Пункты footer",
  headerMenuLanguage: "Настройки шапки, меню и языков",
  "headerMenuLanguage.closeBehavior": "Закрытие меню после выбора",
  "headerMenuLanguage.consultationCta": "Кнопка консультации",
  "headerMenuLanguage.defaultLanguageCode": "Язык по умолчанию",
  "headerMenuLanguage.desktopLayoutMode": "Компоновка desktop шапки",
  "headerMenuLanguage.languageSwitcherDisplay": "Вид переключателя языка",
  "headerMenuLanguage.logoAsset": "Логотип и оптическое выравнивание",
  "headerMenuLanguage.megaMenuGrouping": "Группировка меню продуктов",
  "headerMenuLanguage.menuOpenBehavior": "Открытие меню",
  "headerMenuLanguage.mobileLayoutMode": "Компоновка mobile шапки",
  "headerMenuLanguage.mobileLogoTransition": "Переход логотипа на mobile",
  "headerMenuLanguage.motion": "Спокойное движение шапки",
  "headerMenuLanguage.phoneButton": "Кнопка телефона",
  "headerMenuLanguage.routeAlignmentNotes": "Выравнивание шапки на разных страницах",
  "headerMenuLanguage.stableColumnCount": "Стабильные колонки меню",
  heroMedia: "Главное медиа главной",
  "heroContent.supportingLabel": "Верхняя подпись hero",
  heroPrimaryCtaLabel: "Текст главной кнопки",
  heroPrimaryCtaTarget: "Ссылка главной кнопки",
  heroSummary: "Краткий текст главной",
  "heroScene.ctaPlaque": "CTA-плашка hero сцены",
  "heroScene.hotspots": "Названия и ссылки продуктовых зон",
  "heroScene.hotspots.contours": "Контуры и зоны клика",
  "heroScene.mediaAndCrop": "Медиа и кадрирование сцены",
  localeOrder: "Порядок языков",
  motionTimeline: "Тайминг движения главной",
  navigationBranches: "Пункты навигации",
  productDirectionOrder: "Порядок направлений",
  productMenuItems: "Пункты меню продуктов",
  productStageObject: "Визуальная сцена товара",
  routeHeroMedia: "Медиа внутренних баннеров",
  sloganComposition: "Слоган главной",
};

function humanModuleLabel(module: SiteModuleDefinition) {
  return moduleLabelById[module.id] ?? module.label;
}

function humanFieldLabel(field: SiteModuleEditableField) {
  return fieldLabelByPath[field.fieldPath] ?? field.label;
}

function humanUsage(value: string) {
  return value
    .replace("Homepage first viewport when NEXT_PUBLIC_HOME_PRODUCT_SCENE is not false.", "Первый экран главной с включенной интерактивной сценой.")
    .replace("Homepage hero copy and CTA stack.", "Текстовый слой hero и основные CTA главной.")
    .replace("Homepage reveal and scroll behavior across hero, system story and product sequence.", "Reveal и scroll-поведение главной без изменения утвержденной motion-ДНК.")
    .replace("Rendered by the public shell on all site routes.", "Отображается в публичной оболочке на всех страницах.")
    .replace("Desktop products branch and mobile product branch drilldown.", "Ветка продуктов на desktop и mobile.")
    .replace("Mobile header closed/open states and language dropdown across localized routes.", "Закрытое/открытое mobile меню и переключатель языка.")
    .replace("Direction landing banners use RoutePageTemplate and direction presentation data.", "Баннеры направлений используют общий визуальный слой внутренних страниц.")
    .replace("Header CTA, homepage CTA, contact route and product request routes.", "CTA в шапке, на главной, в контактах и в заявках по продуктам.")
    .replace("Footer navigation, legal text and support links.", "Footer, юридический текст и служебные ссылки.");
}

function countFields(fields: SiteModuleEditableField[], status: SiteModuleFieldStatus) {
  return fields.filter((field) => field.status === status).length;
}

function firstRoute(module: SiteModuleDefinition) {
  return module.routePaths[0] ?? null;
}

function gateHref(module: SiteModuleDefinition, field?: SiteModuleEditableField | null) {
  if (field?.editHref && !field.editHref.startsWith("/api/internal")) {
    return field.editHref;
  }

  const params = new URLSearchParams();
  params.set("module", module.id);
  if (field?.fieldPath) {
    params.set("field", field.fieldPath);
  }

  return `/admin/site-modules?${params.toString()}`;
}

function buildTargets(module: SiteModuleDefinition): ComponentVisualGateTarget[] {
  return module.editableFields.map((field) => ({
    editorHref: gateHref(module, field),
    fieldLabel: humanFieldLabel(field),
    fieldPath: field.fieldPath,
    layer: field.layer,
    moduleId: module.id,
    moduleLabel: humanModuleLabel(module),
    routePath: firstRoute(module),
  }));
}

function findField(module: SiteModuleDefinition, fieldPath: string) {
  return module.editableFields.find((field) => field.fieldPath === fieldPath) ?? null;
}

function findFirstAvailableField(module: SiteModuleDefinition, fieldPaths: string[]) {
  for (const fieldPath of fieldPaths) {
    const field = findField(module, fieldPath);
    if (field) {
      return field;
    }
  }

  return null;
}

function fallbackIssueField(module: SiteModuleDefinition) {
  return (
    module.editableFields.find((field) => field.source === "settings") ??
    module.editableFields.find((field) => field.status === "editable-now") ??
    module.editableFields[0] ??
    null
  );
}

function gapIssueField(module: SiteModuleDefinition, gap: SiteModuleGap) {
  const fieldPathByGapId: Record<string, string[]> = {
    "homepage-motion-settings": ["motionTimeline"],
    "homepage-slogan-component-copy": ["sloganComposition", "heroContent.supportingLabel"],
    "route-banner-product-stage-settings": ["productStageObject", "routeHeroMedia"],
  };

  return findFirstAvailableField(module, fieldPathByGapId[gap.id] ?? []) ?? fallbackIssueField(module);
}

function validationIssueField(module: SiteModuleDefinition, error: string) {
  if (module.id === "homepage.hero-product-scene") {
    if (
      error.includes("desktop изображение") ||
      error.includes("видео") ||
      error.includes("интерактивной hero сцены")
    ) {
      return findFirstAvailableField(module, ["heroScene.mediaAndCrop"]);
    }

    if (error.includes("CTA в hero сцене")) {
      return findFirstAvailableField(module, ["heroScene.ctaPlaque"]);
    }

    if (error.includes("координаты зоны")) {
      return findFirstAvailableField(module, ["heroScene.hotspots.contours", "heroScene.hotspots"]);
    }

    if (
      error.includes("зоны") ||
      error.includes("зону") ||
      error.includes("товар для зоны") ||
      error.includes("категорию для зоны") ||
      error.includes("страницу для зоны")
    ) {
      return findFirstAvailableField(module, ["heroScene.hotspots"]);
    }
  }

  if (module.id.startsWith("global.") && module.editableFields.some((field) => field.fieldPath.startsWith("headerMenuLanguage."))) {
    if (error.includes("консультационной кнопки")) {
      return findFirstAvailableField(module, ["headerMenuLanguage.consultationCta"]);
    }

    if (error.includes("default язык")) {
      return findFirstAvailableField(module, [
        "headerMenuLanguage.defaultLanguageCode",
        "headerMenuLanguage.languageSwitcherDisplay",
      ]);
    }

    if (error.includes("порядок языков")) {
      return findFirstAvailableField(module, [
        "headerMenuLanguage.languageSwitcherDisplay",
        "headerMenuLanguage.defaultLanguageCode",
      ]);
    }

    if (error.includes("открытие меню") || error.includes("reduced-motion")) {
      return findFirstAvailableField(module, [
        "headerMenuLanguage.motion",
        "headerMenuLanguage.menuOpenBehavior",
        "headerMenuLanguage.mobileLogoTransition",
      ]);
    }

    if (error.includes("настройки шапки")) {
      return findFirstAvailableField(module, [
        "headerMenuLanguage.desktopLayoutMode",
        "headerMenuLanguage.megaMenuGrouping",
        "headerMenuLanguage.mobileLayoutMode",
      ]);
    }
  }

  if (error.includes("ссылку для кнопки")) {
    return findFirstAvailableField(module, [
      "contactPrimaryHref",
      "heroPrimaryCtaTarget",
      "heroScene.ctaPlaque",
    ]);
  }

  if (error.includes("товар для клика")) {
    return findFirstAvailableField(module, ["productMenuItems", "productDirectionOrder"]);
  }

  if (error.includes("категорию")) {
    return findFirstAvailableField(module, ["productDirectionOrder", "productMenuItems"]);
  }

  if (error.includes("страницу")) {
    return findFirstAvailableField(module, ["navigationBranches", "footerMenuItems"]);
  }

  if (error.includes("длительность движения")) {
    return findFirstAvailableField(module, ["motionTimeline", "headerMenuLanguage.motion"]);
  }

  if (error.includes("изображение для баннера")) {
    return findFirstAvailableField(module, ["routeHeroMedia"]);
  }

  return fallbackIssueField(module);
}

function statusIssue(
  module: SiteModuleDefinition,
  field: SiteModuleEditableField,
): ComponentVisualGateIssue | null {
  if (field.status === "editable-now") {
    return null;
  }

  const severity = field.status === "not-cms-backed" ? "watch" : "warning";
  return {
    editorHref: gateHref(module, field),
    fieldPath: field.fieldPath,
    id: `component-visual-gate:${module.id}:${field.fieldPath}`,
    moduleId: module.id,
    moduleLabel: humanModuleLabel(module),
    reason:
      field.status === "not-cms-backed"
        ? "Поле описано в карте использования, но ещё требует отдельной задачи связки сайта и админки."
        : "Поле пока не имеет полностью готового экрана правки.",
    routePath: firstRoute(module),
    severity,
    targetLayer: field.layer,
    title: humanFieldLabel(field),
  };
}

function gapIssue(module: SiteModuleDefinition, gap: SiteModuleGap): ComponentVisualGateIssue {
  const field = gapIssueField(module, gap);
  return {
    editorHref: gateHref(module, field),
    fieldPath: field?.fieldPath ?? "module-readiness",
    id: `component-visual-gate:${module.id}:gap:${gap.id}`,
    moduleId: module.id,
    moduleLabel: humanModuleLabel(module),
    reason: `${gap.description} Следующий шаг: ${gap.laterTaskId}.`,
    routePath: firstRoute(module),
    severity: gap.severity === "blocker" ? "blocker" : "watch",
    targetLayer: field?.layer ?? module.layer,
    title: field ? humanFieldLabel(field) : gap.label,
  };
}

function validationIssues(module: SiteModuleDefinition, settings: ModuleSettingsReadModel | null) {
  if (!settings) {
    return [];
  }

  return settings.validation.errors.map((error, index) => {
    const field = validationIssueField(module, error);
    return {
      editorHref: gateHref(module, field),
      fieldPath: field?.fieldPath ?? "module-settings",
      id: `component-visual-gate:${module.id}:validation:${index}`,
      moduleId: module.id,
      moduleLabel: humanModuleLabel(module),
      reason: error,
      routePath: firstRoute(module),
      severity: "warning" as const,
      targetLayer: field?.layer ?? module.layer,
      title: field ? humanFieldLabel(field) : "Проверьте настройки визуального блока",
    };
  });
}

function toGateModule(
  module: SiteModuleDefinition,
  settings: ModuleSettingsReadModel | null,
  settingsReadable: boolean,
): ComponentVisualGateModule {
  const editableNow = countFields(module.editableFields, "editable-now");
  const plannedCommands = countFields(module.editableFields, "planned-command");
  const notCmsBacked = countFields(module.editableFields, "not-cms-backed");
  const readOnly = countFields(module.editableFields, "read-only");
  const validationErrors = settings?.validation.errors ?? [];
  const settingState = settings
    ? settings.settings.publicationState
    : settingsReadable
      ? "not-settings-backed"
      : "not-readable-for-role";

  return {
    coverage: {
      editableNow,
      notCmsBacked,
      plannedCommands,
      readOnly,
    },
    editorTargets: buildTargets(module),
    fullyEditableNow:
      module.gaps.length === 0 &&
      validationErrors.length === 0 &&
      plannedCommands === 0 &&
      readOnly === 0 &&
      notCmsBacked === 0,
    id: module.id,
    label: humanModuleLabel(module),
    layer: module.layer,
    publicUsage: module.publicUsage.map(humanUsage),
    routePaths: module.routePaths,
    settingState,
    validationErrors,
    visualHooks: module.cssHooks,
  };
}

export async function getComponentVisualGateSnapshot(
  payload: PayloadLike,
  req: PayloadRequest,
  options: { locale?: string | null } = {},
): Promise<ComponentVisualGateSnapshot> {
  const registry = await getSiteModuleRegistry(payload);
  const user = getAdminUser(req.user);
  const settingsReadable = hasAdminRole(user, settingsReadableRoles);
  const moduleSettings = settingsReadable
    ? await getModuleSettingsSnapshot(payload, req, { locale: options.locale ?? "ru" })
    : null;
  const settingsByModuleId = new Map(
    (moduleSettings?.modules ?? []).map((module) => [module.moduleId, module]),
  );
  const modules = registry.modules.map((module) =>
    toGateModule(module, settingsByModuleId.get(module.id) ?? null, settingsReadable),
  );
  const issues = registry.modules.flatMap((module) => [
    ...module.editableFields
      .map((field) => statusIssue(module, field))
      .filter((issue): issue is ComponentVisualGateIssue => issue !== null),
    ...module.gaps.map((item) => gapIssue(module, item)),
    ...validationIssues(module, settingsByModuleId.get(module.id) ?? null),
  ]);
  const textFailures = [
    ...assertNoRawSiteModuleRegistryOutput(registry),
    ...(moduleSettings ? assertNoRawModuleSettingsOutput(moduleSettings) : []),
  ];

  return {
    generatedAt: new Date().toISOString(),
    issues,
    modules,
    publicEvidenceTargets: [
      { id: "home-hero-scene", label: "Hero сцена главной", routePath: "/", state: "required" },
      { id: "mobile-header-menu", label: "Mobile шапка и меню", routePath: "/", state: "required" },
      { id: "desktop-header-menu", label: "Desktop шапка и меню", routePath: "/", state: "required" },
      { id: "secondary-shared-banner", label: "Общий баннер внутренней страницы", routePath: "/brand", state: "required" },
    ],
    summary: {
      fullyEditableNow: modules.filter((module) => module.fullyEditableNow).length,
      issues: issues.length,
      modules: modules.length,
      notSettingsBacked: modules.filter((module) => module.settingState === "not-settings-backed").length,
      routes: registry.routes.length,
      settingsReadable,
    },
    textFailures,
  };
}
