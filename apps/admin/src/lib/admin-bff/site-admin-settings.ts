import type { Payload, PayloadRequest } from "payload";

import { buildAdvancedCollectionHref } from "./raw-layer.ts";
import { getAdminUser } from "../payload/access.ts";
import { createAuditEvent } from "../payload/audit.ts";
import { adminRoleOptions, hasAdminRole, type AdminRole } from "../payload/roles.ts";
import { siteAdminAccessRoles } from "../payload/site-admin-workspace.ts";

type GenericRecord = Record<string, unknown>;
type PayloadLike = Payload;

type SiteAdminDomainId =
  | "forms"
  | "header-footer"
  | "import-export"
  | "integrations"
  | "languages"
  | "media-settings"
  | "security"
  | "seo"
  | "service-pages"
  | "site-structure"
  | "users";

type SiteAdminActionId =
  | "forms.save-routing"
  | "languages.save-order"
  | "navigation.save-menu-items"
  | "seo.save-entry"
  | "settings.save-contact"
  | "users.save-role";

type SiteAdminCommandBase = {
  action: SiteAdminActionId;
};

export type SiteAdminSettingsCommandInput =
  | (SiteAdminCommandBase & {
      action: "forms.save-routing";
      formId: number | string;
      notificationEmails: string[];
      successMessage?: string;
      successTitle?: string;
    })
  | (SiteAdminCommandBase & {
      action: "languages.save-order";
      fallbackLocale?: string;
      items: Array<{
        hiddenFromSwitcher?: boolean;
        id: number | string;
        launchOrder: number;
        publicSiteEnabled?: boolean;
        status?: string;
      }>;
    })
  | (SiteAdminCommandBase & {
      action: "navigation.save-menu-items";
      items: Array<{
        href: string;
        label: string;
        opensInNewTab?: boolean;
        visible?: boolean;
      }>;
      menuId: number | string;
      title?: string;
    })
  | (SiteAdminCommandBase & {
      action: "seo.save-entry";
      entryId: number | string;
      includeInSitemap?: boolean;
      indexingMode?: string;
      metaDescription: string;
      metaTitle: string;
    })
  | (SiteAdminCommandBase & {
      action: "settings.save-contact";
      contactEmail?: string;
      contactPhoneDisplay?: string;
      contactPrimaryHref?: string;
      contactPrimaryLabel?: string;
      locale: string;
    })
  | (SiteAdminCommandBase & {
      action: "users.save-role";
      role: AdminRole;
      userId: number | string;
    });

export type SiteAdminGuidedAction = {
  description: string;
  id: SiteAdminActionId | "blocked" | "documented-command" | "read-only";
  label: string;
  method?: "GET" | "POST";
  path?: string;
};

export type SiteAdminDomainSnapshot = {
  advancedHandoffHref?: string;
  commandPath?: string;
  description: string;
  guidedActions: SiteAdminGuidedAction[];
  href: string;
  id: SiteAdminDomainId;
  items: GenericRecord[];
  label: string;
  primaryAction: SiteAdminGuidedAction;
  readPath: string;
  status: "blocked" | "configured" | "empty" | "needs-attention";
  summary: string;
};

export type SiteAdminSettingsSnapshot = {
  canUpdate: boolean;
  domains: SiteAdminDomainSnapshot[];
  generatedAt: string;
  selectedSection: SiteAdminDomainId;
  successMessage?: string;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRecordId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === "number" || typeof id === "string") {
      return String(id);
    }
  }

  return "";
}

function getArray<T = GenericRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeEmailList(value: unknown) {
  return getArray<string>(value)
    .map((entry) => getText(entry).toLowerCase())
    .filter(Boolean)
    .map((email) => ({ email }));
}

function normalizeSection(value: unknown): SiteAdminDomainId {
  const section = getText(value) as SiteAdminDomainId;

  switch (section) {
    case "forms":
    case "header-footer":
    case "import-export":
    case "integrations":
    case "languages":
    case "media-settings":
    case "security":
    case "seo":
    case "service-pages":
    case "site-structure":
    case "users":
      return section;
    default:
      return "header-footer";
  }
}

function requireSiteAdminAccess(req: PayloadRequest) {
  const user = getAdminUser(req.user);

  if (!user?.role) {
    throw new Error("unauthorized");
  }

  if (!hasAdminRole(user, siteAdminAccessRoles)) {
    throw new Error("forbidden");
  }

  return user;
}

function summarizeStatus(count: number): SiteAdminDomainSnapshot["status"] {
  return count > 0 ? "configured" : "empty";
}

function normalizeMenuItems(items: SiteAdminSettingsCommandInput & { action: "navigation.save-menu-items" }) {
  return items.items.map((item, index) => ({
    itemKey: `guided-${index + 1}`,
    sourceType: "custom-url" as const,
    label: getText(item.label),
    href: getText(item.href) || "/",
    overrideLabel: getText(item.label),
    overrideHref: getText(item.href) || "/",
    opensInNewTab: item.opensInNewTab === true,
    useSourceHref: false,
    useSourceLabel: false,
    visible: item.visible !== false,
    children: [],
  }));
}

async function updatePayload(payload: PayloadLike, options: Record<string, unknown>) {
  return (payload.update as (input: Record<string, unknown>) => Promise<unknown>)(options) as Promise<GenericRecord>;
}

async function writeSiteAdminSettingsAudit(
  req: PayloadRequest,
  input: {
    action: string;
    details?: string;
    eventGroup?: "access" | "settings";
    sensitive?: boolean;
    summary: string;
    target: {
      collection: string;
      id: number | string;
      label?: string | null;
    };
  },
) {
  await createAuditEvent(req, {
    action: input.action,
    details: input.details ?? null,
    eventGroup: input.eventGroup ?? "settings",
    sensitive: input.sensitive === true,
    summary: input.summary,
    target: input.target,
  });
}

async function loadSiteAdminRecords(payload: PayloadLike) {
  const [
    navigation,
    forms,
    locales,
    settings,
    seoEntries,
    users,
    pages,
    media,
    auditEvents,
  ] = await Promise.all([
    payload.find({
      collection: "navigation-menus",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "placement",
    }),
    payload.find({
      collection: "productInquiryForms",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    payload.find({
      collection: "locales",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "launchOrder",
    }),
    payload.find({
      collection: "site-settings",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "locale",
    }),
    payload.find({
      collection: "seo-entries",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "routePath",
    }),
    payload.find({
      collection: "admin-users",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "fullName",
    }),
    payload.find({
      collection: "pages",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "routePath",
    }),
    payload.find({
      collection: "media-assets",
      depth: 0,
      limit: 25,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    payload.find({
      collection: "audit-events",
      depth: 0,
      limit: 25,
      overrideAccess: true,
      pagination: false,
      sort: "-happenedAt",
    }),
  ]);

  return {
    auditEvents: (auditEvents.docs as unknown as GenericRecord[]) ?? [],
    forms: (forms.docs as unknown as GenericRecord[]) ?? [],
    locales: (locales.docs as unknown as GenericRecord[]) ?? [],
    media: (media.docs as unknown as GenericRecord[]) ?? [],
    navigation: (navigation.docs as unknown as GenericRecord[]) ?? [],
    pages: (pages.docs as unknown as GenericRecord[]) ?? [],
    seoEntries: (seoEntries.docs as unknown as GenericRecord[]) ?? [],
    settings: (settings.docs as unknown as GenericRecord[]) ?? [],
    users: (users.docs as unknown as GenericRecord[]) ?? [],
  };
}

function action(
  id: SiteAdminGuidedAction["id"],
  label: string,
  description: string,
  method: SiteAdminGuidedAction["method"] = "POST",
): SiteAdminGuidedAction {
  return {
    description,
    id,
    label,
    method,
    path: "/api/internal/site-admin-settings",
  };
}

function mapMenuRecord(record: GenericRecord) {
  return {
    id: getRecordId(record.id),
    itemsCount: getArray(record.items).length,
    locale: getText(record.locale),
    menuKey: getText(record.menuKey),
    placement: getText(record.placement),
    status: getText(record.status),
    title: getText(record.title),
  };
}

function mapFormRecord(record: GenericRecord) {
  return {
    id: getRecordId(record.id),
    fieldsCount: getArray(record.fields).length,
    locale: getText(record.locale),
    notificationEmails: getArray<GenericRecord>(record.notificationEmails)
      .map((entry) => getText(entry.email))
      .filter(Boolean),
    status: getText(record.status),
    successTitle: getText(record.successTitle),
    title: getText(record.title),
  };
}

function mapLocaleRecord(record: GenericRecord) {
  return {
    id: getRecordId(record.id),
    code: getText(record.code),
    hiddenFromSwitcher: record.hiddenFromSwitcher === true,
    launchOrder: Number(record.launchOrder ?? 0),
    label: getText(record.nativeLabel) || getText(record.englishLabel),
    publicSiteEnabled: record.publicSiteEnabled !== false,
    routePrefix: getText(record.routePrefix),
    status: getText(record.status),
  };
}

function mapHeaderMenuLanguageSettings(records: GenericRecord[]) {
  return records.flatMap((record) =>
    getArray<GenericRecord>(record.customModuleSettings)
      .filter((row) =>
        [
          "global.header-desktop",
          "global.products-mega-menu",
          "global.mobile-menu-language-logo",
        ].includes(getText(row.moduleId)),
      )
      .map((row) => {
        const settings = row.headerMenuLanguage && typeof row.headerMenuLanguage === "object"
          ? (row.headerMenuLanguage as GenericRecord)
          : {};

        return {
          closeBehavior: getText(settings.closeBehavior),
          defaultLanguageCode: getText(settings.defaultLanguageCode),
          languageSwitcherDisplay: getText(settings.languageSwitcherDisplay),
          menuOpenBehavior: getText(settings.menuOpenBehavior),
          mobileLogoTransition: getText(settings.mobileLogoTransition),
          moduleId: getText(row.moduleId),
          moduleLabel: getText(row.moduleLabel),
          publicLocale: getText(record.locale),
          stableColumnCount: settings.stableColumnCount ?? null,
        };
      }),
  );
}

function mapSeoRecord(record: GenericRecord) {
  return {
    id: getRecordId(record.id),
    includeInSitemap: record.includeInSitemap !== false,
    indexingMode: getText(record.indexingMode),
    locale: getText(record.locale),
    metaTitle: getText(record.metaTitle),
    ownerLabel: getText(record.ownerLabel),
    routePath: getText(record.routePath),
    status: getText(record.status),
  };
}

function mapUserRecord(record: GenericRecord) {
  return {
    id: getRecordId(record.id),
    email: getText(record.email),
    fullName: getText(record.fullName),
    role: getText(record.role),
  };
}

function buildDomainSnapshots(records: Awaited<ReturnType<typeof loadSiteAdminRecords>>) {
  const readPath = "/api/internal/site-admin-settings";

  return [
    {
      id: "site-structure",
      label: "Структура сайта",
      description: "Карта страниц, служебных разделов и порядка публикации без служебных таблиц.",
      href: "/admin/site-admin?section=site-structure",
      items: records.pages.slice(0, 12).map((page) => ({
        id: getRecordId(page.id),
        routePath: getText(page.routePath),
        status: getText(page.status),
        title: getText(page.title),
      })),
      primaryAction: action("read-only", "Открыть структуру", "Порядок страниц редактируется в разделе сайта.", "GET"),
      guidedActions: [
        action("read-only", "Показать дерево страниц", "Показывает адреса, статусы и порядок страниц.", "GET"),
      ],
      readPath,
      status: summarizeStatus(records.pages.length),
      summary: `${records.pages.length} страниц доступно в рабочем разделе сайта.`,
    },
    {
      id: "header-footer",
      label: "Шапка и подвал",
      description: "Логотип, телефон, кнопки, всплывающее меню и ссылки подвала в одном месте.",
      href: "/admin/site-admin?section=header-footer",
      items: [
        ...records.navigation.map(mapMenuRecord),
        ...mapHeaderMenuLanguageSettings(records.settings),
      ],
      primaryAction: action("navigation.save-menu-items", "Сохранить меню", "Обновить название меню и пользовательские ссылки."),
      guidedActions: [
        action("navigation.save-menu-items", "Обновить пункты меню", "Сохраняет пункты меню без открытия служебного слоя."),
        action("documented-command", "Открыть настройки шапки", "Поведение шапки редактируется в настройках визуальных блоков.", "GET"),
      ],
      readPath,
      status: summarizeStatus(records.navigation.length),
      summary: `${records.navigation.length} меню и ${mapHeaderMenuLanguageSettings(records.settings).length} настроек поведения шапки готовы к проверке.`,
    },
    {
      id: "seo",
      label: "SEO",
      description: "Заголовки, описания, канонические адреса, карта сайта и индексация.",
      href: "/admin/site-admin?section=seo",
      items: records.seoEntries.map(mapSeoRecord),
      primaryAction: action("seo.save-entry", "Сохранить SEO", "Обновить title, description, карту сайта и режим индексации."),
      guidedActions: [
        action("seo.save-entry", "Обновить SEO", "Сохраняет основные SEO-поля без служебного списка."),
      ],
      readPath,
      status: summarizeStatus(records.seoEntries.length),
      summary: `${records.seoEntries.length} SEO-настроек доступно для редактирования.`,
    },
    {
      id: "forms",
      label: "Формы",
      description: "Поля, текст после отправки, получатели и уведомления для форм заявок.",
      href: "/admin/site-admin?section=forms",
      items: records.forms.map(mapFormRecord),
      primaryAction: action("forms.save-routing", "Сохранить получателей", "Обновить получателей и текст после отправки."),
      guidedActions: [
        action("forms.save-routing", "Обновить получателей", "Сохраняет email-адреса и текст после отправки."),
      ],
      readPath,
      status: summarizeStatus(records.forms.length),
      summary: `${records.forms.length} форм заявок доступно в понятных настройках.`,
    },
    {
      id: "languages",
      label: "Языки",
      description: "Включённые языки, порядок, резервный язык и настройки переключателя.",
      href: "/admin/site-admin?section=languages",
      items: [
        ...records.locales.map(mapLocaleRecord),
        ...mapHeaderMenuLanguageSettings(records.settings)
          .filter((item) => item.moduleId === "global.mobile-menu-language-logo")
          .map((item) => ({
            defaultLanguageCode: item.defaultLanguageCode,
            languageSwitcherDisplay: item.languageSwitcherDisplay,
            moduleId: item.moduleId,
            publicLocale: item.publicLocale,
          })),
      ],
      primaryAction: action("languages.save-order", "Сохранить порядок языков", "Обновить порядок, видимость и включение на сайте."),
      guidedActions: [
        action("languages.save-order", "Обновить языки", "Сохраняет порядок языков и настройки переключателя."),
      ],
      readPath,
      status: summarizeStatus(records.locales.length),
      summary: `${records.locales.length} языков настроено для запуска сайта.`,
    },
    {
      id: "users",
      label: "Пользователи",
      description: "Basic user role management without opening admin-users as the primary action.",
      href: "/admin/site-admin?section=users",
      items: records.users.map(mapUserRecord),
      primaryAction: action("users.save-role", "Сохранить роль", "Изменить роль пользователя через понятное действие."),
      guidedActions: [
        action("users.save-role", "Обновить роль", "Сохраняет роль после проверки прав владельца или администратора."),
      ],
      readPath,
      status: summarizeStatus(records.users.length),
      summary: `${records.users.length} пользователей доступно в базовом управлении ролями.`,
      advancedHandoffHref: buildAdvancedCollectionHref("admin-users", { label: "Пользователь для разработчика" }),
    },
    {
      id: "import-export",
      label: "Импорт и экспорт",
      description: "Documented command layer for controlled imports, exports and rollback checkpoints.",
      href: "/admin/site-admin?section=import-export",
      items: [
        {
          commandPath: "scripts/admin-backup.sh",
          label: "CMS backup export",
          mode: "documented-command",
        },
        {
          commandPath: "scripts/admin-restore-validate.sh --skip-http",
          label: "Restore validation",
          mode: "documented-command",
        },
      ],
      primaryAction: action("documented-command", "Открыть инструкцию", "Импорт и экспорт остаются редкими операциями по инструкции.", "GET"),
      guidedActions: [
        action("documented-command", "Показать правила", "Показывает поддержанный порядок действий.", "GET"),
      ],
      readPath,
      status: "configured",
      summary: "Импорт и экспорт описаны как редкая операция; прямой запуск скрыт от обычной работы.",
    },
    {
      id: "security",
      label: "Безопасность",
      description: "История действий, защищённые настройки и предупреждения доступа.",
      href: "/admin/site-admin?section=security",
      items: records.auditEvents.slice(0, 12).map((event) => ({
        action: getText(event.action),
        actorRole: getText(event.actorRole),
        id: getRecordId(event.id),
        summary: getText(event.summary),
      })),
      primaryAction: action("read-only", "Review audit", "Security is read-only in this task; restore commands are handled by publish-history.", "GET"),
      guidedActions: [
        action("read-only", "Показать историю", "Показывает последние действия без служебного журнала.", "GET"),
      ],
      readPath,
      status: summarizeStatus(records.auditEvents.length),
      summary: `${records.auditEvents.length} последних действий доступно для проверки.`,
      commandPath: "scripts/admin-backup.sh",
    },
    {
      id: "integrations",
      label: "Интеграции",
      description: "Email, Telegram, аналитика и внешние уведомления из форм и настроек сайта.",
      href: "/admin/site-admin?section=integrations",
      items: records.forms.map((form) => ({
        id: getRecordId(form.id),
        notificationEmails: getArray<GenericRecord>(form.notificationEmails)
          .map((entry) => getText(entry.email))
          .filter(Boolean),
        notificationTemplateKey: getText(form.notificationTemplateKey),
        title: getText(form.title),
      })),
      primaryAction: action("forms.save-routing", "Сохранить уведомления", "Настройки уведомлений сохраняются через форму заявки."),
      guidedActions: [
        action("forms.save-routing", "Обновить получателей", "Email и Telegram настраиваются через формы заявок."),
      ],
      readPath,
      status: summarizeStatus(records.forms.length),
      summary: "Основные интеграции видны здесь; глубокая диагностика вынесена в расширенный слой.",
    },
    {
      id: "media-settings",
      label: "Медиа-настройки",
      description: "Правила загрузки, кадрирования, документов и временных визуалов из медиатеки.",
      href: "/admin/site-admin?section=media-settings",
      items: records.media.map((item) => ({
        fileCategory: getText(item.fileCategory),
        id: getRecordId(item.id),
        title: getText(item.title),
        usageRightsStatus: getText(item.usageRightsStatus),
      })),
      primaryAction: action("read-only", "Показать правила медиа", "Операции с файлами выполняются в медиатеке.", "GET"),
      guidedActions: [
        action("read-only", "Показать правила", "Показывает настройки и ведёт к редактированию в медиатеке.", "GET"),
      ],
      readPath,
      status: summarizeStatus(records.media.length),
      summary: `${records.media.length} файлов учтено для проверки правил медиатеки.`,
      commandPath: "/api/internal/media-workspace",
    },
    {
      id: "service-pages",
      label: "Сервисные страницы",
      description: "404, privacy, cookies, страницы после заявки и технические разделы.",
      href: "/admin/site-admin?section=service-pages",
      items: records.pages
        .filter((page) => ["404", "privacy", "cookies", "thank"].some((key) => getText(page.routePath).includes(key)))
        .map((page) => ({
          id: getRecordId(page.id),
          routePath: getText(page.routePath),
          status: getText(page.status),
          title: getText(page.title),
        })),
      primaryAction: action("read-only", "Показать сервисные страницы", "Сервисные страницы редактируются в разделе сайта.", "GET"),
      guidedActions: [
        action("read-only", "Показать страницы", "Показывает покрытие и ведёт к редактированию страниц.", "GET"),
      ],
      readPath,
      status: "configured",
      summary: "Сервисные страницы показаны для проверки; правки выполняются через редактор страниц.",
      commandPath: "/api/internal/owner-site-commands",
    },
  ] satisfies SiteAdminDomainSnapshot[];
}

export async function getSiteAdminSettingsSnapshot(
  payload: PayloadLike,
  req: PayloadRequest,
  options: { section?: string | null; successMessage?: string } = {},
): Promise<SiteAdminSettingsSnapshot> {
  requireSiteAdminAccess(req);

  const records = await loadSiteAdminRecords(payload);
  const domains = buildDomainSnapshots(records);

  const snapshot: SiteAdminSettingsSnapshot = {
    canUpdate: true,
    domains,
    generatedAt: new Date().toISOString(),
    selectedSection: normalizeSection(options.section),
  };

  if (options.successMessage) {
    snapshot.successMessage = options.successMessage;
  }

  return snapshot;
}

function assertObject(value: unknown): asserts value is GenericRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid-input");
  }
}

function assertValidRole(value: unknown): asserts value is AdminRole {
  const role = getText(value);

  if (!adminRoleOptions.some((option) => option.value === role)) {
    throw new Error("invalid-input");
  }
}

export async function executeSiteAdminSettingsCommand(
  payload: PayloadLike,
  req: PayloadRequest,
  input: SiteAdminSettingsCommandInput,
) {
  requireSiteAdminAccess(req);
  assertObject(input);

  switch (input.action) {
    case "navigation.save-menu-items": {
      const updated = await updatePayload(payload, {
        collection: "navigation-menus",
        id: input.menuId,
        data: {
          ...(input.title ? { title: getText(input.title) } : {}),
          derivedFromHierarchy: false,
          items: normalizeMenuItems(input),
        },
        overrideAccess: true,
        showHiddenFields: true,
      });
      await writeSiteAdminSettingsAudit(req, {
        action: "site-admin-navigation-save",
        details: `${input.items.length} menu items submitted.`,
        summary: "Site-admin updated a header/footer navigation menu.",
        target: {
          collection: "navigation-menus",
          id: input.menuId,
          label: getText(updated.title) || getText(input.title) || String(input.menuId),
        },
      });

      return getSiteAdminSettingsSnapshot(payload, req, {
        section: "header-footer",
        successMessage: "Меню обновлено.",
      });
    }
    case "forms.save-routing": {
      const updated = await updatePayload(payload, {
        collection: "productInquiryForms",
        id: input.formId,
        data: {
          notificationEmails: normalizeEmailList(input.notificationEmails),
          ...(input.successTitle ? { successTitle: getText(input.successTitle) } : {}),
          ...(input.successMessage ? { successMessage: getText(input.successMessage) } : {}),
        },
        overrideAccess: true,
        showHiddenFields: true,
      });
      await writeSiteAdminSettingsAudit(req, {
        action: "site-admin-form-routing-save",
        details: `${normalizeEmailList(input.notificationEmails).length} notification recipients submitted.`,
        summary: "Site-admin updated form recipients and success copy.",
        target: {
          collection: "productInquiryForms",
          id: input.formId,
          label: getText(updated.title) || String(input.formId),
        },
      });

      return getSiteAdminSettingsSnapshot(payload, req, {
        section: "forms",
        successMessage: "Получатели и success text формы обновлены.",
      });
    }
    case "languages.save-order": {
      for (const item of input.items) {
        await updatePayload(payload, {
          collection: "locales",
          id: item.id,
          data: {
            hiddenFromSwitcher: item.hiddenFromSwitcher === true,
            launchOrder: Number(item.launchOrder),
            publicSiteEnabled: item.publicSiteEnabled !== false,
            ...(item.status ? { status: getText(item.status) } : {}),
          },
          overrideAccess: true,
          showHiddenFields: true,
        });
      }

      if (input.fallbackLocale) {
        const settings = await payload.find({
          collection: "site-settings",
          depth: 0,
          limit: 50,
          overrideAccess: true,
          pagination: false,
          sort: "locale",
        });

        for (const record of (settings.docs as unknown as GenericRecord[]) ?? []) {
          const id = getRecordId(record.id);

          if (id) {
            await updatePayload(payload, {
              collection: "site-settings",
              data: {
                contactFallbackLocale: getText(input.fallbackLocale),
              },
              id,
              overrideAccess: true,
              showHiddenFields: true,
            });
          }
        }
      }
      await writeSiteAdminSettingsAudit(req, {
        action: "site-admin-language-order-save",
        details: `${input.items.length} locales submitted; fallback ${getText(input.fallbackLocale) || "unchanged"}.`,
        summary: "Site-admin updated language order, visibility or fallback.",
        target: {
          collection: "locales",
          id: input.items[0]?.id ?? "locales",
          label: "Настройки переключателя языков",
        },
      });

      return getSiteAdminSettingsSnapshot(payload, req, {
        section: "languages",
        successMessage: "Порядок и видимость языков обновлены.",
      });
    }
    case "seo.save-entry": {
      const updated = await updatePayload(payload, {
        collection: "seo-entries",
        id: input.entryId,
        data: {
          includeInSitemap: input.includeInSitemap !== false,
          indexingMode: getText(input.indexingMode) || "index,follow",
          metaDescription: getText(input.metaDescription),
          metaTitle: getText(input.metaTitle),
        },
        overrideAccess: true,
        showHiddenFields: true,
      });
      await writeSiteAdminSettingsAudit(req, {
        action: "site-admin-seo-save",
        summary: "Site-admin updated SEO metadata.",
        target: {
          collection: "seo-entries",
          id: input.entryId,
          label: getText(updated.ownerLabel) || getText(updated.routePath) || String(input.entryId),
        },
      });

      return getSiteAdminSettingsSnapshot(payload, req, {
        section: "seo",
      successMessage: "SEO-настройки обновлены.",
      });
    }
    case "settings.save-contact": {
      const settings = await payload.find({
        collection: "site-settings",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          locale: {
            equals: getText(input.locale),
          },
        },
      });
      const record = (settings.docs as unknown as GenericRecord[])[0];
      const id = getRecordId(record?.id);

      if (!id) {
        throw new Error("invalid-input");
      }

      const updated = await updatePayload(payload, {
        collection: "site-settings",
        data: {
          ...(input.contactEmail ? { contactEmail: getText(input.contactEmail) } : {}),
          ...(input.contactPhoneDisplay ? { contactPhoneDisplay: getText(input.contactPhoneDisplay) } : {}),
          ...(input.contactPrimaryHref ? { contactPrimaryHref: getText(input.contactPrimaryHref) } : {}),
          ...(input.contactPrimaryLabel ? { contactPrimaryLabel: getText(input.contactPrimaryLabel) } : {}),
        },
        id,
        overrideAccess: true,
        showHiddenFields: true,
      });
      await writeSiteAdminSettingsAudit(req, {
        action: "site-admin-contact-settings-save",
        details: getText(input.locale),
        summary: "Site-admin updated contact and integration settings.",
        target: {
          collection: "site-settings",
          id,
          label: getText(updated.locale) || getText(input.locale) || id,
        },
      });

      return getSiteAdminSettingsSnapshot(payload, req, {
        section: "integrations",
        successMessage: "Контактные настройки обновлены.",
      });
    }
    case "users.save-role": {
      assertValidRole(input.role);
      const updated = await updatePayload(payload, {
        collection: "admin-users",
        data: {
          role: input.role,
        },
        id: input.userId,
        overrideAccess: true,
        showHiddenFields: true,
      });
      await writeSiteAdminSettingsAudit(req, {
        action: "site-admin-user-role-save",
        eventGroup: "access",
        sensitive: true,
        summary: "Site-admin updated an admin user role.",
        target: {
          collection: "admin-users",
          id: input.userId,
          label: getText(updated.email) || getText(updated.fullName) || String(input.userId),
        },
      });

      return getSiteAdminSettingsSnapshot(payload, req, {
        section: "users",
        successMessage: "Роль пользователя обновлена.",
      });
    }
    default:
      throw new Error("invalid-input");
  }
}
