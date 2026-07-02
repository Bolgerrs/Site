import type { AdminRole } from "./roles.ts";
import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";

export type SiteAdminCard = {
  description: string;
  href: string;
  id: string;
  items: readonly string[];
  label: string;
  tone: "guided" | "technical-handoff";
};

export type AdvancedToolCard = {
  description: string;
  href: string;
  id: string;
  label: string;
};

export type AdvancedToolGroup = {
  description: string;
  id: string;
  items: readonly AdvancedToolCard[];
  label: string;
};

export const siteAdminAccessRoles: readonly AdminRole[] = ["owner", "admin", "developer"];
export const advancedAccessRoles: readonly AdminRole[] = ["owner", "developer"];

export const siteAdminCards: readonly SiteAdminCard[] = [
  {
    id: "site-structure",
    label: "Структура сайта",
    description: "Карта сайта, порядок страниц и страницы правил без погружения в таблицы данных.",
    href: "/admin/site",
    items: ["Дерево страниц", "Порядок и типы", "Глобальные блоки и страницы правил"],
    tone: "guided",
  },
  {
    id: "header-footer",
    label: "Шапка и подвал",
    description: "Логотип, телефон, кнопки, всплывающее меню и ссылки подвала в одном месте.",
    href: "/admin/site-admin?section=header-footer",
    items: ["Главное меню", "Кнопка в шапке и контакты", "Меню подвала и правовые ссылки"],
    tone: "guided",
  },
  {
    id: "visual-modules",
    label: "Визуальные блоки",
    description: "Карта публичных визуальных зон: главный экран, шапка, меню, языки, баннеры и подвал.",
    href: "/admin/site-modules",
    items: ["Где используется", "Что редактируется", "Что требует связки"],
    tone: "guided",
  },
  {
    id: "seo",
    label: "SEO",
    description: "Проверка title, description, slug, OG и публикационных блокеров по страницам и продуктам.",
    href: "/admin/checks?check=seo-problems",
    items: ["SEO проблемы", "Адреса и индексация", "Сломанные ссылки и карта сайта"],
    tone: "guided",
  },
  {
    id: "forms",
    label: "Формы",
    description: "Поля, обязательность, тексты после отправки, получатели и правила уведомлений для заявок.",
    href: "/admin/site-admin?section=forms",
    items: ["Поля и порядок", "Текст после отправки и ошибки", "Email и Telegram получатели"],
    tone: "guided",
  },
  {
    id: "languages",
    label: "Языки",
    description: "Порядок языков, резервный язык, статус переводов и массовые языковые проверки.",
    href: "/admin/translations",
    items: ["Статусы переводов", "Резервный язык и переключатель", "Пустые и устаревшие поля"],
    tone: "guided",
  },
  {
    id: "users",
    label: "Пользователи",
    description: "Роли, доступы по разделам, приглашения и восстановление пароля без сложных терминов.",
    href: "/admin/site-admin?section=users",
    items: ["Роли и права", "Пригласить или заблокировать", "Сессии и доступы"],
    tone: "guided",
  },
  {
    id: "import-export",
    label: "Импорт и экспорт",
    description: "Редкий операционный слой. Обычный администратор читает правила здесь, а низкоуровневые действия открывает отдельно.",
    href: "/admin/site-admin?section=import-export",
    items: ["Импорт продуктов и медиа", "Экспорт заявок и переводов", "Предпросмотр перед применением"],
    tone: "technical-handoff",
  },
  {
    id: "security",
    label: "Безопасность",
    description: "История действий, резервные копии, проверки доступа и системные предупреждения для админ-уровня.",
    href: "/admin/site-admin?section=security",
    items: ["История изменений", "Резервные копии и восстановление", "Предупреждения доступа"],
    tone: "guided",
  },
  {
    id: "integrations",
    label: "Интеграции",
    description: "Email, Telegram, аналитика, согласия и внешние связи с ясной границей между настройкой и диагностикой.",
    href: "/admin/site-admin?section=integrations",
    items: ["Email и Telegram", "Аналитика, пиксель и согласия", "Внешние связи"],
    tone: "guided",
  },
  {
    id: "media-settings",
    label: "Медиа-настройки",
    description: "Правила загрузки, кадрирования, документов, видео и пустых состояний без системных файлов на виду.",
    href: "/admin/site-admin?section=media-settings",
    items: ["Правила фото и видео", "Ограничения загрузки и кадрирование", "Документы и пустые состояния"],
    tone: "guided",
  },
  {
    id: "service-pages",
    label: "Сервисные страницы",
    description: "404, privacy, cookies, thank-you и технические страницы в отдельном административном разделе.",
    href: "/admin/site-admin?section=service-pages",
    items: ["404 и privacy", "Thank-you / form error", "Технические страницы"],
    tone: "guided",
  },
] as const;

export const advancedToolGroups: readonly AdvancedToolGroup[] = [
  {
    id: "raw-cms",
    label: "Raw CMS",
    description: "Прямой доступ к коллекциям и версиям, если guided layer не покрывает редкий случай.",
    items: [
      {
        id: "raw-pages",
        label: "Страницы и секции",
        description: "Raw records для pages и page sections.",
        href: buildAdvancedCollectionHref("pages", {
          label: "Страницы и секции",
          query: "sort=routePath",
        }),
      },
      {
        id: "raw-products",
        label: "Продукты и категории",
        description: "Каталог, категории, линии и связанные raw product records.",
        href: buildAdvancedCollectionHref("products", {
          label: "Продукты и категории",
          query: "sort=order&limit=25",
        }),
      },
      {
        id: "raw-settings",
        label: "Site settings и меню",
        description: "Полные записи глобальных настроек и меню сайта.",
        href: buildAdvancedCollectionHref("site-settings", {
          label: "Site settings и меню",
          query: "sort=locale",
        }),
      },
    ],
  },
  {
    id: "api-integrations",
    label: "API и интеграции",
    description: "Диагностика notification routes и integration-bearing records без маскировки под owner UI.",
    items: [
      {
        id: "api-forms",
        label: "Формы и получатели",
        description: "Notification recipients, autoresponder и integration hooks внутри form records.",
        href: buildAdvancedCollectionHref("productInquiryForms", {
          label: "Формы и получатели",
          query: "sort=-updatedAt",
        }),
      },
      {
        id: "api-leads",
        label: "Лиды и source fields",
        description: "Проверка входящих payload fields, routing mode и source snapshots.",
        href: buildAdvancedCollectionHref("leads", {
          label: "Лиды и source fields",
          query: "sort=-updatedAt",
        }),
      },
    ],
  },
  {
    id: "schemas-access",
    label: "Схемы и доступ",
    description: "Роли, чувствительные действия и surface-level permission checks.",
    items: [
      {
        id: "schema-users",
        label: "Admin users",
        description: "Аккаунты, роли и доступы.",
        href: buildAdvancedCollectionHref("admin-users", {
          label: "Admin users",
          query: "sort=fullName",
        }),
      },
      {
        id: "schema-audit",
        label: "Audit trail",
        description: "Чувствительные изменения, publish actions и protected updates.",
        href: buildAdvancedCollectionHref("audit-events", {
          label: "Audit trail",
          query: "sort=-happenedAt&limit=25",
        }),
      },
    ],
  },
  {
    id: "data-migrations",
    label: "Данные и миграции",
    description: "Импортные записи, cleanup и raw maintenance paths для разработчика.",
    items: [
      {
        id: "data-translations",
        label: "Переводы и локали",
        description: "Raw translation records и locale controls для массовых исправлений.",
        href: buildAdvancedCollectionHref("translations", {
          label: "Переводы и локали",
          query: "sort=-updatedAt",
        }),
      },
      {
        id: "data-variants",
        label: "Варианты и product links",
        description: "Поддерживающие product records, которые обычно скрыты из owner flow.",
        href: buildAdvancedCollectionHref("product-variants", {
          label: "Варианты и product links",
          query: "sort=-updatedAt",
        }),
      },
    ],
  },
  {
    id: "files-media",
    label: "Файлы и медиа",
    description: "Системные файлы, служебные uploads и привязки, которые не должны быть ежедневным media UI.",
    items: [
      {
        id: "files-system-media",
        label: "System media",
        description: "Технические assets и служебные файлы.",
        href: buildAdvancedCollectionHref("system-media", {
          label: "System media",
        }),
      },
      {
        id: "files-product-media",
        label: "Product media links",
        description: "Raw media placements и технические привязки.",
        href: buildAdvancedCollectionHref("product-media", {
          label: "Product media links",
          query: "sort=-updatedAt",
        }),
      },
    ],
  },
  {
    id: "runtime-devops",
    label: "Runtime / DevOps",
    description: "Смоки, health signals и release-facing diagnostics для технического режима.",
    items: [
      {
        id: "runtime-checks",
        label: "Health и blockers",
        description: "Быстрый вход в проверки публикации и operational blockers.",
        href: "/admin/checks?check=unpublished-changes",
      },
      {
        id: "runtime-logs",
        label: "История публикаций",
        description: "Аудит публикации и след изменений как safe runtime signal.",
        href: buildAdvancedCollectionHref("audit-events", {
          label: "История публикаций",
          query: "sort=-happenedAt&limit=25",
        }),
      },
    ],
  },
  {
    id: "seo-internals",
    label: "SEO internals",
    description: "Низкоуровневые SEO records и системные проверки, если guided checks недостаточно.",
    items: [
      {
        id: "seo-records",
        label: "SEO entries",
        description: "Raw metadata records для страниц, категорий и продуктов.",
        href: buildAdvancedCollectionHref("seo-entries", {
          label: "SEO entries",
          query: "sort=-updatedAt",
        }),
      },
      {
        id: "seo-checks",
        label: "SEO diagnostics",
        description: "Проблемы индексации и broken links через guided checks.",
        href: "/admin/checks?check=seo-problems",
      },
    ],
  },
  {
    id: "qa-diagnostics",
    label: "QA и диагностика",
    description: "Smokes, visual QA и developer diagnostics отдельно от owner workflow.",
    items: [
      {
        id: "qa-checks",
        label: "Checks workspace",
        description: "Guided QA центр для блокеров публикации, форм и медиа.",
        href: "/admin/checks",
      },
      {
        id: "qa-leads",
        label: "Лиды для диагностики",
        description: "Проверка intake routing и client history на raw data уровне.",
        href: "/admin/leads?filter=all",
      },
    ],
  },
] as const;
