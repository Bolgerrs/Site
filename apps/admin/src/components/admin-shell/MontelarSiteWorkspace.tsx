"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import React from "react";

import type {
  OwnerSiteBlockFields,
  OwnerSiteBlockSnapshot,
} from "@/lib/payload/owner-site-block.ts";
import type {
  SiteWorkspaceBlockCard,
  SiteWorkspaceMediaItem,
  SiteWorkspacePageContent,
  SiteWorkspacePageSeo,
  SiteWorkspacePageSummary,
  SiteWorkspaceSnapshot,
} from "@/lib/payload/site-workspace.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";

const emptySnapshot: SiteWorkspaceSnapshot = {
  canPublish: false,
  canRead: false,
  canUpdate: false,
  emptyState: "Страницы сайта пока недоступны.",
  generatedAt: "",
  groups: [],
  pages: [],
  selectedPage: null,
  selectedPageId: null,
  surfaceRegistry: null,
};

const emptyBlockFields: OwnerSiteBlockFields = {
  body: "",
  eyebrow: "",
  lead: "",
  previewLabel: "",
  previewNotes: "",
  primaryLabel: "",
  primaryTarget: "",
  secondaryLabel: "",
  secondaryTarget: "",
  supportingLabel: "",
  title: "",
};

const ownerSitePanels = [
  "content",
  "blocks",
  "media",
  "buttons",
  "forms",
  "translations",
  "seo",
  "checks",
  "history",
] as const;

type OwnerSitePanel = (typeof ownerSitePanels)[number];

type OwnerSiteCommandResponse = {
  error?: string;
  ok?: true;
  siteWorkspace?: SiteWorkspaceSnapshot;
};

type SiteMediaCommandResponse = {
  assetId?: string | null;
  documentId?: string | null;
  error?: string;
  ok?: true;
};

function resolveAdminHref(adminRoute: string, href: string) {
  if (href.startsWith("/admin")) {
    const [rawPath, rawSearch = ""] = href.replace(/^\/admin/, "").split("?", 2);
    const path = (rawPath || "/") as `/${string}`;
    const resolved = formatAdminURL({ adminRoute, path });
    return rawSearch ? `${resolved}?${rawSearch}` : resolved;
  }

  return href;
}

function getStatusTone(status: string) {
  switch (status) {
    case "published":
      return "steady";
    case "review":
      return "attention";
    case "hidden":
    case "archived":
      return "alert";
    default:
      return "planned";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "черновик";
    case "review":
      return "на проверке";
    case "published":
      return "опубликовано";
    case "hidden":
      return "скрыто";
    case "archived":
      return "архив";
    default:
      return status;
  }
}

function getBlockStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "черновик";
    case "review":
      return "на проверке";
    case "published":
      return "опубликовано";
    case "hidden":
      return "скрыт";
    default:
      return status;
  }
}

function getPageTreeLead(page: SiteWorkspacePageSummary) {
  const parts = [`${page.visibleSectionCount}/${page.sectionCount} блоков`, getStatusLabel(page.status)];

  if (page.approvalStatus === "pending") {
    parts.push("нужна проверка");
  }

  return parts.join(" · ");
}

function getSitePanelFromFocus(focus: string | null, blockId: string | null): OwnerSitePanel {
  if (blockId) {
    return "blocks";
  }

  switch (focus) {
    case "media":
    case "heroMedia":
    case "coverMedia":
    case "seoOgImage":
    case "documents":
      return "media";
    case "buttons":
    case "cta":
      return "buttons";
    case "forms":
      return "forms";
    case "translations":
      return "translations";
    case "seo":
      return "seo";
    case "history":
      return "history";
    default:
      return "content";
  }
}

type OwnerSiteSection = {
  description: string;
  id: string;
  label: string;
  pages: SiteWorkspacePageSummary[];
  primaryPage: SiteWorkspacePageSummary | null;
};

function findPageByRoute(pages: SiteWorkspacePageSummary[], routePath: string) {
  return pages.find((page) => page.routePath === routePath) ?? null;
}

function sortPages(pages: SiteWorkspacePageSummary[]) {
  return pages.slice().sort((left, right) => {
    if (left.navigationOrder !== right.navigationOrder) {
      return left.navigationOrder - right.navigationOrder;
    }

    return left.routePath.localeCompare(right.routePath, "ru");
  });
}

function buildOwnerSiteSections(pages: SiteWorkspacePageSummary[]) {
  const home = findPageByRoute(pages, "/") ?? pages.find((page) => page.groupId === "home") ?? null;
  const coreRoutes = [
    "/brand",
    "/technology",
    "/craftsmanship",
    "/projects",
    "/journal",
    "/downloads",
    "/contact",
    "/dealer-partner",
  ];
  const core = pages.filter((page) =>
    coreRoutes.includes(page.routePath),
  );
  const directions = pages.filter((page) => page.groupId === "directions");
  const categories = pages.filter((page) => page.groupId === "categories");
  const products = pages.filter((page) => page.groupId === "requests");
  const service = pages.filter((page) =>
    ["/privacy-policy", "/preview/admin-preview"].includes(page.routePath) ||
    (page.groupId === "service" && !coreRoutes.includes(page.routePath)),
  );
  const sections: OwnerSiteSection[] = [
    {
      description: "Первый экран, слоган, баннеры, кнопки и главные блоки.",
      id: "home",
      label: "Главная",
      pages: home ? [home] : [],
      primaryPage: home,
    },
    {
      description: "Бренд, технологии, проекты, журнал, загрузки и контакты.",
      id: "core",
      label: "Основные страницы",
      pages: sortPages(core),
      primaryPage: core[0] ?? null,
    },
    {
      description: "Страницы направлений, которые открывают продуктовые миры.",
      id: "directions",
      label: "Направления",
      pages: sortPages(directions),
      primaryPage: directions[0] ?? null,
    },
    {
      description: "Категории внутри Hi-end Audio и смежные подуровни каталога.",
      id: "categories",
      label: "Категории",
      pages: sortPages(categories),
      primaryPage: categories[0] ?? null,
    },
    {
      description: "Товарные страницы заявки и связанные точки запроса.",
      id: "products",
      label: "Продукты",
      pages: sortPages(products),
      primaryPage: products[0] ?? null,
    },
    {
      description: "Служебные, юридические и скрытые страницы. Изменения здесь лучше делать осознанно.",
      id: "service",
      label: "Служебные",
      pages: sortPages(service),
      primaryPage: service[0] ?? null,
    },
  ];

  return sections.filter((section) => section.pages.length > 0 || section.primaryPage);
}

function OwnerSiteSectionTree({
  activePageId,
  onSelect,
  section,
}: {
  activePageId: string | null;
  onSelect: (page: SiteWorkspacePageSummary) => void;
  section: OwnerSiteSection;
}) {
  const hasActivePage = section.pages.some((page) => page.id === activePageId);

  return (
    <details className={hasActivePage ? "montelar-site-tree-group is-active" : "montelar-site-tree-group"} open={hasActivePage || section.id === "home"}>
      <summary>
        <div>
          <strong>{section.label}</strong>
          <span>{section.description}</span>
        </div>
        <b>{section.pages.length}</b>
      </summary>
        <div className="montelar-site-tree-group__list">
          {section.pages.map((page) => (
            <button
            className={page.id === activePageId ? "montelar-site-page-pick is-active" : "montelar-site-page-pick"}
            key={page.id}
            onClick={() => onSelect(page)}
            type="button"
            >
              <strong>{page.title}</strong>
              <span>{getPageTreeLead(page)}</span>
            </button>
          ))}
        </div>
    </details>
  );
}

function PageQuickEditor({
  canUpdate,
  content,
  onSnapshot,
  pageId,
  seo,
}: {
  canUpdate: boolean;
  content: SiteWorkspacePageContent;
  onSnapshot: (snapshot: SiteWorkspaceSnapshot) => void;
  pageId: string;
  seo: SiteWorkspacePageSeo;
}) {
  const [fields, setFields] = React.useState(content);
  const [seoFields, setSeoFields] = React.useState(seo);
  const [isSavingContent, setIsSavingContent] = React.useState(false);
  const [isSavingSeo, setIsSavingSeo] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    setFields(content);
    setSeoFields(seo);
    setMessage("");
  }, [content, pageId, seo]);

  function updateField(key: keyof SiteWorkspacePageContent, value: string) {
    setFields((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateSeoField(key: keyof SiteWorkspacePageSeo, value: boolean | string) {
    setSeoFields((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function runCommand(action: "page.content.save" | "page.seo.save", payload: Record<string, unknown>) {
    const response = await fetch("/api/internal/owner-site-commands", {
      body: JSON.stringify({
        action,
        payload: {
          pageId,
          ...payload,
        },
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const result = (await response.json()) as OwnerSiteCommandResponse;

    if (!response.ok || !result.siteWorkspace) {
      throw new Error(result.error || "Не удалось сохранить изменения страницы.");
    }

    onSnapshot(result.siteWorkspace);
  }

  async function saveContent() {
    setIsSavingContent(true);
    setMessage("");

    try {
      await runCommand("page.content.save", fields);
      setMessage("Текст и кнопки страницы сохранены. Проверьте предпросмотр перед публикацией.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить контент страницы.");
    } finally {
      setIsSavingContent(false);
    }
  }

  async function saveSeo() {
    setIsSavingSeo(true);
    setMessage("");

    try {
      await runCommand("page.seo.save", {
        indexable: seoFields.indexable,
        locale: seoFields.locale,
        metaDescription: seoFields.description,
        metaTitle: seoFields.title,
      });
      setMessage("SEO для выбранной страницы сохранено.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить SEO.");
    } finally {
      setIsSavingSeo(false);
    }
  }

  return (
    <section className="montelar-site-page-editor">
      <div className="montelar-site-page-editor__content" id="page-content-panel">
        <div className="montelar-site-editor-section__head">
          <strong>Контент страницы</strong>
          <span>текст, подписи и кнопки выбранной страницы</span>
        </div>
        {message ? <p className="montelar-owner-editor__message">{message}</p> : null}
        <div className="montelar-owner-editor__form">
          <label>
            <span>Главный заголовок</span>
            <input
              disabled={!canUpdate || isSavingContent}
              onChange={(event) => updateField("title", event.target.value)}
              value={fields.title}
            />
          </label>
          <label>
            <span>Короткое название в меню</span>
            <input
              disabled={!canUpdate || isSavingContent}
              onChange={(event) => updateField("navigationLabel", event.target.value)}
              value={fields.navigationLabel}
            />
          </label>
          <label className="montelar-owner-editor__full">
            <span>Основной текст первого экрана</span>
            <textarea
              disabled={!canUpdate || isSavingContent}
              onChange={(event) => updateField("heroSummary", event.target.value)}
              rows={3}
              value={fields.heroSummary}
            />
          </label>
          <label className="montelar-owner-editor__full">
            <span>Вступительный текст</span>
            <textarea
              disabled={!canUpdate || isSavingContent}
              onChange={(event) => updateField("introBody", event.target.value)}
              rows={3}
              value={fields.introBody}
            />
          </label>
          <label>
            <span>Текст основной кнопки страницы</span>
            <input
              disabled={!canUpdate || isSavingContent}
              onChange={(event) => updateField("heroPrimaryCtaLabel", event.target.value)}
              value={fields.heroPrimaryCtaLabel}
            />
          </label>
          <label>
            <span>Ссылка основной кнопки страницы</span>
            <input
              disabled={!canUpdate || isSavingContent}
              onChange={(event) => updateField("heroPrimaryCtaTarget", event.target.value)}
              value={fields.heroPrimaryCtaTarget}
            />
          </label>
          <label>
            <span>Текст второй кнопки страницы</span>
            <input
              disabled={!canUpdate || isSavingContent}
              onChange={(event) => updateField("heroSecondaryCtaLabel", event.target.value)}
              value={fields.heroSecondaryCtaLabel}
            />
          </label>
          <label>
            <span>Ссылка второй кнопки страницы</span>
            <input
              disabled={!canUpdate || isSavingContent}
              onChange={(event) => updateField("heroSecondaryCtaTarget", event.target.value)}
              value={fields.heroSecondaryCtaTarget}
            />
          </label>
        </div>
        <div className="montelar-site-page-editor__actions">
          <button disabled={!canUpdate || isSavingContent} onClick={() => void saveContent()} type="button">
            {isSavingContent ? "Сохраняю..." : "Сохранить текст и кнопки"}
          </button>
        </div>
      </div>

      <div className="montelar-site-page-editor__seo" id="page-seo-panel">
        <div className="montelar-site-editor-section__head">
          <strong>Короткое SEO</strong>
          <span>заголовок, описание и индексирование</span>
        </div>
        <div className="montelar-owner-editor__form">
          <label>
            <span>SEO-заголовок</span>
            <input
              disabled={!canUpdate || isSavingSeo}
              onChange={(event) => updateSeoField("title", event.target.value)}
              value={seoFields.title}
            />
          </label>
          <label>
            <span>Язык SEO</span>
            <input
              disabled={!canUpdate || isSavingSeo}
              onChange={(event) => updateSeoField("locale", event.target.value)}
              value={seoFields.locale}
            />
          </label>
          <label className="montelar-owner-editor__full">
            <span>SEO-описание</span>
            <textarea
              disabled={!canUpdate || isSavingSeo}
              onChange={(event) => updateSeoField("description", event.target.value)}
              rows={3}
              value={seoFields.description}
            />
          </label>
          <div className="montelar-owner-editor__toggle">
            <span>Поиск</span>
            <div>
              <input
                checked={seoFields.indexable}
                disabled={!canUpdate || isSavingSeo}
                onChange={(event) => updateSeoField("indexable", event.target.checked)}
                type="checkbox"
              />
              <b>{seoFields.indexable ? "Показывать в поиске" : "Скрыть из поиска"}</b>
            </div>
          </div>
        </div>
        <div className="montelar-site-page-editor__actions">
          <button disabled={!canUpdate || isSavingSeo} onClick={() => void saveSeo()} type="button">
            {isSavingSeo ? "Сохраняю..." : "Сохранить SEO"}
          </button>
        </div>
      </div>
    </section>
  );
}

function SiteInlineMediaEditor({
  canUpdate,
  mediaItems,
  onDone,
  ownerId,
  ownerType,
}: {
  canUpdate: boolean;
  mediaItems: SiteWorkspaceMediaItem[];
  onDone: () => void;
  ownerId: string;
  ownerType: "block" | "page";
}) {
  const assignSlots = ownerType === "page"
    ? [
        { label: "Главное медиа", value: "hero" },
        { label: "Обложка", value: "cover" },
        { label: "Видео / motion poster", value: "video" },
        { label: "SEO-изображение", value: "seo" },
        { label: "PDF / документ", value: "document" },
      ]
    : [
        { label: "Главное медиа блока", value: "hero" },
        { label: "Видео блока", value: "video" },
        { label: "Добавить в галерею", value: "gallery" },
        { label: "PDF / документ блока", value: "document" },
      ];
  const editableMediaItems = mediaItems.filter((item) => item.type === "image" || item.type === "video");
  const documentItems = mediaItems.filter((item) => item.type === "document");
  const [selectedAssetId, setSelectedAssetId] = React.useState(editableMediaItems[0]?.id ?? "");
  const [selectedDocumentId, setSelectedDocumentId] = React.useState(documentItems[0]?.id ?? "");
  const [slot, setSlot] = React.useState(assignSlots[0]?.value ?? "hero");
  const [assetType, setAssetType] = React.useState<"image" | "motion-poster" | "video-reference">("image");
  const [altText, setAltText] = React.useState(editableMediaItems[0]?.altText ?? "");
  const [documentIdInput, setDocumentIdInput] = React.useState("");
  const [documentFile, setDocumentFile] = React.useState<File | null>(null);
  const [newFile, setNewFile] = React.useState<File | null>(null);
  const [replacementFile, setReplacementFile] = React.useState<File | null>(null);
  const [cropPreset, setCropPreset] = React.useState<"desktop" | "mobile">("desktop");
  const [focalX, setFocalX] = React.useState("0.5");
  const [focalY, setFocalY] = React.useState("0.5");
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const selectedMediaItem = editableMediaItems.find((item) => item.id === selectedAssetId) ?? editableMediaItems[0] ?? null;
  const selectedDocumentItem = documentItems.find((item) => item.id === selectedDocumentId) ?? documentItems[0] ?? null;

  React.useEffect(() => {
    const nextAssetId = editableMediaItems[0]?.id ?? "";
    setSelectedAssetId(nextAssetId);
    setSelectedDocumentId(documentItems[0]?.id ?? "");
    setAltText(editableMediaItems[0]?.altText ?? "");
    setDocumentIdInput("");
    setMessage("");
  }, [ownerId, editableMediaItems[0]?.id, documentItems[0]?.id]);

  async function runJsonMediaCommand(action: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/internal/owner-media-commands", {
      body: JSON.stringify({ action, payload }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const result = (await response.json()) as SiteMediaCommandResponse;

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Не удалось сохранить медиа.");
    }

    return result;
  }

  async function runMultipartMediaCommand(formData: FormData) {
    const response = await fetch("/api/internal/owner-media-commands", {
      body: formData,
      credentials: "include",
      method: "POST",
    });
    const result = (await response.json()) as SiteMediaCommandResponse;

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Не удалось сохранить медиа.");
    }

    return result;
  }

  async function uploadAndAssign() {
    if (!newFile) {
      setMessage("Выберите файл для загрузки.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("action", "media.upload");
      formData.set("file", newFile);
      formData.set("assetTitle", newFile.name);
      formData.set("assetType", assetType);
      formData.set("assetRole", ownerType === "page" ? "page-owned media" : "block-owned media");
      formData.set("altText", altText);
      const upload = await runMultipartMediaCommand(formData);
      const mediaId = upload.assetId;
      if (!mediaId) {
        throw new Error("Загрузка не вернула ID медиа.");
      }

      await runJsonMediaCommand("media.assign", {
        mediaId,
        slot,
        targetType: ownerType,
        ...(ownerType === "page" ? { pageId: ownerId } : { blockId: ownerId }),
      });
      setSelectedAssetId(mediaId);
      setNewFile(null);
      setMessage("Изображение или видео загружено и поставлено в выбранное место страницы.");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось поставить файл на страницу.");
    } finally {
      setIsSaving(false);
    }
  }

  async function replaceSelectedFile() {
    if (!selectedAssetId || !replacementFile) {
      setMessage("Выберите текущий файл и новый файл для замены.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("action", "media.replace");
      formData.set("assetId", selectedAssetId);
      formData.set("file", replacementFile);
      formData.set("changeReason", "Site workspace owner replacement");
      formData.set("altText", altText);
      await runMultipartMediaCommand(formData);
      setReplacementFile(null);
      setMessage("Файл заменен без потери привязки к странице или блоку.");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось заменить файл.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAltAndCrop() {
    if (!selectedAssetId) {
      setMessage("Сначала выберите медиа на этой странице или в этом блоке.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      await runJsonMediaCommand("media.metadata.save", {
        altText,
        assetId: selectedAssetId,
      });
      await runJsonMediaCommand("media.crop.save", {
        assetId: selectedAssetId,
        crop: {
          focalX: Number(focalX),
          focalY: Number(focalY),
          height: 1,
          width: 1,
          x: 0,
          y: 0,
        },
        preset: cropPreset,
      });
      setMessage("Alt и crop сохранены в контексте выбранной страницы.");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить alt и crop.");
    } finally {
      setIsSaving(false);
    }
  }

  async function attachDocument() {
    const nextDocumentId = documentIdInput.trim();
    if (!nextDocumentId) {
      setMessage("Введите ID PDF/документа.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      await runJsonMediaCommand("media.assign", {
        documentId: nextDocumentId,
        replaceDocumentId: selectedDocumentId || undefined,
        slot: "document",
        targetType: ownerType,
        ...(ownerType === "page" ? { pageId: ownerId } : { blockId: ownerId }),
      });
      setSelectedDocumentId(nextDocumentId);
      setDocumentIdInput("");
      setMessage("PDF/документ привязан внутри выбранной страницы или блока.");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось привязать PDF/документ.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadDocumentAndAttach() {
    if (!documentFile) {
      setMessage("Выберите PDF/документ для загрузки.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("action", selectedDocumentId ? "document.replace" : "document.upload");
      formData.set("file", documentFile);
      formData.set("documentId", selectedDocumentId);
      formData.set("documentTitle", `${ownerType === "page" ? "Page" : "Block"} document ${ownerId}`);
      formData.set("documentType", "brochure");
      formData.set("productKey", `site-${ownerType}-${ownerId}`);
      formData.set("productLabel", ownerType === "page" ? "Site page document" : "Site block document");
      formData.set("publicLabel", documentFile.name);
      const upload = await runMultipartMediaCommand(formData);
      const nextDocumentId = upload.documentId;
      if (!nextDocumentId) {
        throw new Error("Загрузка не вернула документ.");
      }

      await runJsonMediaCommand("media.assign", {
        documentId: nextDocumentId,
        replaceDocumentId: selectedDocumentId || undefined,
        slot: "document",
        targetType: ownerType,
        ...(ownerType === "page" ? { pageId: ownerId } : { blockId: ownerId }),
      });
      setSelectedDocumentId(nextDocumentId);
      setDocumentIdInput(nextDocumentId);
      setDocumentFile(null);
      setMessage("PDF/документ загружен и привязан внутри выбранного редактора.");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить PDF/документ.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="montelar-site-inline-media" data-montelar-site-media-editor={ownerType}>
      <div className="montelar-site-inline-media__head">
        <div>
          <strong>{ownerType === "page" ? "Медиа выбранной страницы" : "Медиа выбранного блока"}</strong>
          <span>замена, alt, desktop/mobile crop и постановка файла без ухода в глобальную медиатеку</span>
        </div>
      </div>
      {message ? <p className="montelar-owner-editor__message">{message}</p> : null}
      <div className="montelar-current-media-preview" data-montelar-current-media-preview>
        <div className="montelar-current-media-preview__frame">
          {selectedMediaItem?.previewUrl ? (
            selectedMediaItem.type === "video" ? (
              <video controls muted preload="metadata" src={selectedMediaItem.previewUrl} />
            ) : (
              <img alt={selectedMediaItem.altText || selectedMediaItem.label} src={selectedMediaItem.previewUrl} />
            )
          ) : (
            <span>{selectedMediaItem ? "Превью файла недоступно" : "Файл не выбран"}</span>
          )}
        </div>
        <div className="montelar-current-media-preview__body">
          <span>Текущий файл перед заменой</span>
          <strong>{selectedMediaItem?.label ?? "Файл не выбран"}</strong>
          <p>{selectedMediaItem ? `${selectedMediaItem.slot} · ${selectedMediaItem.type}${selectedMediaItem.fileName ? ` · ${selectedMediaItem.fileName}` : ""}${selectedMediaItem.fileSizeLabel ? ` · ${selectedMediaItem.fileSizeLabel}` : ""}` : "Добавьте медиа в выбранную страницу или блок."}</p>
          <p>{selectedMediaItem?.altText ? "Alt заполнен" : selectedMediaItem ? "Alt не заполнен" : "Нет файла для alt/crop"}</p>
          <p>Crop: экран и телефон сохраняются ниже</p>
          {selectedMediaItem?.fileUrl ? (
            <a href={selectedMediaItem.fileUrl} rel="noreferrer" target="_blank">Открыть текущий файл</a>
          ) : null}
          {newFile ? <em>Новый файл готов к загрузке: {newFile.name}</em> : null}
          {replacementFile ? <em>Файл замены выбран: {replacementFile.name}</em> : null}
        </div>
      </div>
      <div className="montelar-site-media-list">
        {mediaItems.length > 0 ? mediaItems.map((item) => (
          <button
            className={(item.type === "document" ? selectedDocumentId : selectedAssetId) === item.id ? "is-active" : ""}
            key={`${item.type}-${item.slot}-${item.id}`}
            onClick={() => {
              if (item.type === "document") {
                setSelectedDocumentId(item.id);
                setDocumentIdInput(item.id);
              } else {
                setSelectedAssetId(item.id);
                setAltText(item.altText);
              }
            }}
            type="button"
          >
            <strong>{item.label}</strong>
            <span>{item.type === "document" ? `PDF/документ · ${item.fileName || item.label}` : `${item.slot} · ${item.type} · ${item.fileName || item.label}`}</span>
          </button>
        )) : (
          <p>На этой поверхности пока нет привязанных файлов. Загрузите файл и поставьте его в нужный слот.</p>
        )}
      </div>
      <div className="montelar-owner-editor__form">
        <label>
          <span>Куда поставить новый файл</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setSlot(event.target.value)} value={slot}>
            {assignSlots.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Тип нового медиа</span>
          <select disabled={!canUpdate || isSaving || slot === "document"} onChange={(event) => setAssetType(event.target.value as "image" | "motion-poster" | "video-reference")} value={assetType}>
            <option value="image">Изображение</option>
            <option value="video-reference">Видео</option>
            <option value="motion-poster">Motion poster</option>
          </select>
        </label>
        <label>
          <span>Текущий файл для alt/crop/replace</span>
          <select disabled={!canUpdate || isSaving || editableMediaItems.length === 0} onChange={(event) => setSelectedAssetId(event.target.value)} value={selectedAssetId}>
            {editableMediaItems.map((item) => (
              <option key={`${item.type}-${item.slot}-${item.id}`} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="montelar-owner-editor__full">
          <span>Alt text</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setAltText(event.target.value)} value={altText} />
        </label>
        <label>
          <span>Новый файл для страницы/блока</span>
          <input disabled={!canUpdate || isSaving || slot === "document"} onChange={(event) => setNewFile(event.target.files?.[0] ?? null)} type="file" />
        </label>
        <label>
          <span>Файл для замены текущего</span>
          <input disabled={!canUpdate || isSaving || !selectedAssetId} onChange={(event) => setReplacementFile(event.target.files?.[0] ?? null)} type="file" />
        </label>
        <label>
          <span>Crop preset</span>
          <select disabled={!canUpdate || isSaving || !selectedAssetId} onChange={(event) => setCropPreset(event.target.value as "desktop" | "mobile")} value={cropPreset}>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
        </label>
        <label>
          <span>Фокус X</span>
          <input disabled={!canUpdate || isSaving || !selectedAssetId} max="1" min="0" onChange={(event) => setFocalX(event.target.value)} step="0.01" type="number" value={focalX} />
        </label>
        <label>
          <span>Фокус Y</span>
          <input disabled={!canUpdate || isSaving || !selectedAssetId} max="1" min="0" onChange={(event) => setFocalY(event.target.value)} step="0.01" type="number" value={focalY} />
        </label>
      </div>
      <div className="montelar-owner-editor__form montelar-site-document-editor">
        <div className="montelar-current-document-preview" data-montelar-current-document-preview>
          <span>Текущий PDF/документ</span>
          <strong>{selectedDocumentItem?.label ?? "Файл не выбран"}</strong>
          <p>{selectedDocumentItem ? `${selectedDocumentItem.fileName || selectedDocumentItem.label}${selectedDocumentItem.fileSizeLabel ? ` · ${selectedDocumentItem.fileSizeLabel}` : ""}` : "Добавьте документ в этот редактор."}</p>
          {selectedDocumentItem?.fileUrl ? (
            <a href={selectedDocumentItem.fileUrl} rel="noreferrer" target="_blank">Открыть текущий документ</a>
          ) : null}
          {documentFile ? <em>Новый документ выбран: {documentFile.name}</em> : null}
        </div>
        <label>
          <span>Текущий PDF/документ</span>
          <select disabled={!canUpdate || isSaving || documentItems.length === 0} onChange={(event) => {
            setSelectedDocumentId(event.target.value);
            setDocumentIdInput(event.target.value);
          }} value={selectedDocumentId}>
            {documentItems.map((item) => (
              <option key={`${item.slot}-${item.id}`} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Выбранный документ из библиотеки</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setDocumentIdInput(event.target.value)} placeholder="оставьте текущий или выберите через список выше" value={documentIdInput} />
        </label>
        <label>
          <span>Новый PDF/документ</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} type="file" />
        </label>
      </div>
      <div className="montelar-site-page-editor__actions">
        <button disabled={!canUpdate || isSaving || slot === "document"} onClick={() => void uploadAndAssign()} type="button">
          Загрузить изображение/видео здесь
        </button>
        <button disabled={!canUpdate || isSaving || !selectedAssetId} onClick={() => void replaceSelectedFile()} type="button">
          Заменить выбранный файл
        </button>
        <button disabled={!canUpdate || isSaving || !selectedAssetId} onClick={() => void saveAltAndCrop()} type="button">
          Сохранить alt и crop
        </button>
        <button disabled={!canUpdate || isSaving || !documentIdInput.trim()} onClick={() => void attachDocument()} type="button">
          Привязать выбранный PDF
        </button>
        <button disabled={!canUpdate || isSaving || !documentFile} onClick={() => void uploadDocumentAndAttach()} type="button">
          Загрузить PDF здесь
        </button>
      </div>
    </section>
  );
}

function BlockQuickEditor({
  adminRoute,
  block,
  pageId,
  onSaved,
}: {
  adminRoute: string;
  block: SiteWorkspaceBlockCard | null;
  onSaved: () => void;
  pageId: string | null;
}) {
  const [fields, setFields] = React.useState<OwnerSiteBlockFields>(emptyBlockFields);
  const [snapshot, setSnapshot] = React.useState<OwnerSiteBlockSnapshot | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [visibleOnPage, setVisibleOnPage] = React.useState(true);

  React.useEffect(() => {
    if (!block) {
      queueMicrotask(() => {
        setSnapshot(null);
        setFields(emptyBlockFields);
        setMessage("");
        setVisibleOnPage(true);
      });
      return;
    }

    let cancelled = false;
    const blockId = block.id;

    async function loadBlock() {
      setIsLoading(true);
      setMessage("");

      try {
        const query = new URLSearchParams();
        if (pageId) {
          query.set("pageId", pageId);
        }

        const response = await fetch(
          `/api/internal/owner-site-blocks/${encodeURIComponent(blockId)}${query.size > 0 ? `?${query.toString()}` : ""}`,
          {
            credentials: "include",
            headers: {
              "Cache-Control": "no-store",
            },
          },
        );
        const payload = (await response.json()) as OwnerSiteBlockSnapshot & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Не удалось открыть блок.");
        }

        if (!cancelled) {
          setSnapshot(payload);
          setFields(payload.fields);
          setVisibleOnPage(payload.visibleOnPage ?? true);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Не удалось открыть блок.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBlock();

    return () => {
      cancelled = true;
    };
  }, [block, pageId]);

  function updateField(key: keyof OwnerSiteBlockFields, value: string) {
    setFields((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveBlock() {
    if (!block) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/internal/owner-site-blocks/${encodeURIComponent(block.id)}`, {
        body: JSON.stringify({
          fields,
          pageId: pageId ?? undefined,
          visibleOnPage,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as OwnerSiteBlockSnapshot & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось сохранить блок.");
      }

      setSnapshot(payload);
      setFields(payload.fields);
      setVisibleOnPage(payload.visibleOnPage ?? true);
      setMessage("Сохранено. Откройте предпросмотр страницы и проверьте публикационный статус.");
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить блок.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!block) {
    return (
      <section className="montelar-owner-editor">
        <span>Редактор блока</span>
        <strong>Блок не выбран</strong>
        <p>Выберите блок страницы, чтобы поменять текст, кнопку, медиа-путь и видимость.</p>
      </section>
    );
  }

  return (
    <section className="montelar-owner-editor">
      <div className="montelar-owner-editor__head">
        <div>
          <span>Редактор блока</span>
          <strong>{block.label}</strong>
          <p>
            Меняйте текст, кнопки, видимость и связанные материалы для выбранного блока.
          </p>
        </div>
        <button
          disabled={isLoading || isSaving || snapshot?.canUpdate === false}
          onClick={() => void saveBlock()}
          type="button"
        >
          {isSaving ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>

      <div className="montelar-owner-editor__rail">
        <div className="montelar-owner-editor__chips">
          <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(snapshot?.status || block.status)}`}>
            {getBlockStatusLabel(snapshot?.status || block.status)}
          </span>
          <span>{snapshot?.mediaSummary ?? `${block.mediaCount} медиа · ${block.documentCount} документов`}</span>
          <span>{snapshot?.visibleOnPage === false ? "скрыт на странице" : "виден на странице"}</span>
        </div>
        <div className="montelar-owner-editor__links">
          <a href="#block-media-editor">Медиа в этом блоке</a>
          <Link href={resolveAdminHref(adminRoute, snapshot?.pageEditorHref ?? "/admin/site")}>Страница</Link>
          <Link href={resolveAdminHref(adminRoute, snapshot?.rawEditorHref ?? "/admin/advanced")}>
            Расширенные
          </Link>
        </div>
      </div>

      {message ? <p className="montelar-owner-editor__message">{message}</p> : null}

      <div id="block-media-editor">
        <SiteInlineMediaEditor
          canUpdate={snapshot?.canUpdate !== false}
          mediaItems={block.mediaItems}
          onDone={onSaved}
          ownerId={block.id}
          ownerType="block"
        />
      </div>

      <div className="montelar-owner-editor__form">
        <label>
          <span>Имя блока в админке</span>
          <input
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("previewLabel", event.target.value)}
            value={fields.previewLabel}
          />
        </label>
        <div className="montelar-owner-editor__toggle">
          <span>Видимость</span>
          <div>
            <input
              checked={visibleOnPage}
              disabled={isLoading || snapshot?.canToggleVisibility === false}
              onChange={(event) => setVisibleOnPage(event.target.checked)}
              type="checkbox"
            />
            <b>{visibleOnPage ? "Показывать на странице" : "Скрыть на странице"}</b>
          </div>
        </div>
        <label>
          <span>Надзаголовок</span>
          <input
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("eyebrow", event.target.value)}
            value={fields.eyebrow}
          />
        </label>
        <label>
          <span>Подпись рядом с hero</span>
          <input
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("supportingLabel", event.target.value)}
            value={fields.supportingLabel}
          />
        </label>
        <label className="montelar-owner-editor__full">
          <span>Заголовок</span>
          <input
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("title", event.target.value)}
            value={fields.title}
          />
        </label>
        <label className="montelar-owner-editor__full">
          <span>Короткое описание</span>
          <textarea
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("lead", event.target.value)}
            rows={3}
            value={fields.lead}
          />
        </label>
        <label className="montelar-owner-editor__full">
          <span>Основной текст</span>
          <textarea
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("body", event.target.value)}
            rows={5}
            value={fields.body}
          />
        </label>
        <label>
          <span>Текст основной кнопки</span>
          <input
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("primaryLabel", event.target.value)}
            value={fields.primaryLabel}
          />
        </label>
        <label>
          <span>Ссылка основной кнопки</span>
          <input
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("primaryTarget", event.target.value)}
            value={fields.primaryTarget}
          />
        </label>
        <label>
          <span>Текст второй кнопки</span>
          <input
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("secondaryLabel", event.target.value)}
            value={fields.secondaryLabel}
          />
        </label>
        <label>
          <span>Ссылка второй кнопки</span>
          <input
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("secondaryTarget", event.target.value)}
            value={fields.secondaryTarget}
          />
        </label>
        <label className="montelar-owner-editor__full">
          <span>Заметка для менеджера</span>
          <textarea
            disabled={isLoading || snapshot?.canUpdate === false}
            onChange={(event) => updateField("previewNotes", event.target.value)}
            rows={3}
            value={fields.previewNotes}
          />
        </label>
      </div>
    </section>
  );
}

export function MontelarSiteWorkspace() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = React.useState(searchParams.get("selected") ?? "");
  const [selectedBlockId, setSelectedBlockId] = React.useState(searchParams.get("block") ?? "");
  const [snapshot, setSnapshot] = React.useState<SiteWorkspaceSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [reloadToken, setReloadToken] = React.useState(0);
  const [activePanel, setActivePanel] = React.useState<OwnerSitePanel>(
    getSitePanelFromFocus(searchParams.get("focus"), searchParams.get("block")),
  );
  const isAuthLoading = typeof user === "undefined";
  const canReachWorkspace = hasAdminRole(user, [
    "owner",
    "admin",
    "content-editor",
    "translator",
    "developer",
  ]);

  React.useEffect(() => {
    if (user === null) {
      router.replace("/admin/login?redirect=%2Fadmin%2Fsite");
      return;
    }

  }, [router, searchParams, user]);

  React.useEffect(() => {
    const nextSelected = searchParams.get("selected");
    const nextBlock = searchParams.get("block");
    const nextPanel = getSitePanelFromFocus(searchParams.get("focus"), nextBlock);

    if (nextSelected) {
      setSelected(nextSelected);
    }
    if (nextBlock) {
      setSelectedBlockId(nextBlock);
    }
    setActivePanel(nextPanel);
  }, [searchParams]);

  React.useEffect(() => {
    if (!canReachWorkspace) {
      return;
    }

    let cancelled = false;

    async function loadSnapshot() {
      setIsLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        if (selected) {
          query.set("selected", selected);
        }
        query.set("refresh", String(reloadToken));

        const response = await fetch(`/api/internal/site-workspace?${query.toString()}`, {
          credentials: "include",
          headers: {
            "Cache-Control": "no-store",
          },
        });
        const payload = (await response.json()) as SiteWorkspaceSnapshot & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Не удалось открыть раздел «Сайт».");
        }

        if (!cancelled) {
          setSnapshot(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось открыть раздел «Сайт».");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [canReachWorkspace, reloadToken, selected]);

  function selectPage(page: SiteWorkspacePageSummary) {
    setSelected(page.id);
    setSelectedBlockId("");
    setActivePanel("content");
  }

  function selectBlock(blockId: string) {
    setSelectedBlockId(blockId);
    setActivePanel("blocks");
  }

  if (isAuthLoading) {
    return (
      <section className="montelar-site-workspace montelar-site-workspace--empty">
        <h1>Сайт</h1>
        <p>Проверяю сессию администратора...</p>
      </section>
    );
  }

  if (!canReachWorkspace) {
    return (
      <section className="montelar-site-workspace montelar-site-workspace--empty">
        <h1>Сайт</h1>
        <p>
          {user
            ? "У текущего пользователя нет доступа к редактированию сайта."
            : "Перенаправляю на вход в админку..."}
        </p>
      </section>
    );
  }

  const selectedPage = snapshot.selectedPage;
  const ownerSections = buildOwnerSiteSections(snapshot.pages);
  const selectedBlock =
    selectedPage?.blocks.find((block) => block.id === selectedBlockId) ?? selectedPage?.blocks[0] ?? null;
  const panelTabs = selectedPage?.tabs.filter((tab) =>
    ["content", "blocks", "media", "buttons", "forms", "translations", "seo", "history"].includes(tab.id),
  ) ?? [];
  const translationsHref = selectedPage
    ? `/admin/translations?ownerCollection=pages&ownerKey=${encodeURIComponent(selectedPage.translationOwnerKey)}`
    : "/admin/translations";
  const checksHref = selectedPage
    ? `/admin/checks?owner=page&pageId=${encodeURIComponent(selectedPage.id)}`
    : "/admin/checks";
  const selectedPanelLabel =
    panelTabs.find((tab) => tab.id === activePanel)?.label ?? (activePanel === "checks" ? "Проверки" : "Контент");

  return (
    <section
      className={
        snapshot.pages.length === 0
          ? "montelar-site-workspace montelar-site-product montelar-site-workspace--empty"
          : "montelar-site-workspace montelar-site-product"
      }
    >
      <header className="montelar-site-product__toolbar">
        <div>
          <span>Сайт</span>
          <h1>{selectedPage ? selectedPage.title : "Страницы сайта"}</h1>
          <p>
            {selectedPage
              ? "Выберите, что поменять на странице: контент, блоки, медиа, кнопки, предпросмотр или публикацию."
              : "Выберите страницу, затем блок, поменяйте текст, кнопку или видимость, проверьте предпросмотр и публикуйте."}
          </p>
        </div>
        <div className="montelar-site-product__toolbar-actions">
          <Link href={resolveAdminHref(adminRoute, "/admin/site-admin")}>Структура и служебные</Link>
          {selectedPage ? (
            <>
              <Link href={resolveAdminHref(adminRoute, selectedPage.previewHref)}>Предпросмотр</Link>
              <Link className="is-primary" href={resolveAdminHref(adminRoute, checksHref)}>
                Проверить и опубликовать
              </Link>
            </>
          ) : null}
        </div>
      </header>

      {isLoading ? <p className="montelar-site-workspace__status">Загружаю страницы и действия для выбранной страницы…</p> : null}
      {error ? <p className="montelar-site-workspace__status is-error">{error}</p> : null}
      {!isLoading && !error && snapshot.pages.length === 0 ? <p className="montelar-site-workspace__status">{snapshot.emptyState}</p> : null}

      {!isLoading && !error && snapshot.pages.length > 0 ? (
        <div className="montelar-site-product__layout">
          <aside className="montelar-site-product__tree" aria-label="Разделы сайта">
            <div className="montelar-site-product__tree-head">
              <strong>Дерево страниц</strong>
              <span>{snapshot.pages.length} страниц</span>
            </div>
            <div className="montelar-site-owner-flow">
              {ownerSections.map((section) => (
                <OwnerSiteSectionTree
                  activePageId={snapshot.selectedPageId}
                  key={section.id}
                  onSelect={selectPage}
                  section={section}
                />
              ))}
            </div>
            <div className="montelar-site-owner-advanced">
              <Link href={resolveAdminHref(adminRoute, "/admin/site-admin")}>
                Открыть структуру, порядок и расширенные настройки
              </Link>
            </div>
          </aside>

          <main className="montelar-site-product__editor">
            {selectedPage ? (
              <>
                <section className="montelar-site-page-spotlight">
                  <div>
                    <span>Вы выбрали</span>
                    <strong>{selectedPage.title}</strong>
                    <p>{selectedPage.summary}</p>
                  </div>
                  <div className="montelar-site-page-spotlight__meta">
                    <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(selectedPage.status)}`}>
                      {getStatusLabel(selectedPage.status)}
                    </span>
                    <span>{selectedPage.blocks.length} блоков на странице</span>
                    <span>{selectedBlock ? `блок: ${selectedBlock.label}` : "блок не выбран"}</span>
                  </div>
                </section>

                <section className="montelar-site-editor-section">
                  <div className="montelar-site-editor-section__head">
                    <strong>Что редактируем</strong>
                    <span>{selectedPanelLabel}: действие остается внутри выбранной страницы</span>
                  </div>
                  <div className="montelar-site-editor-tabs" role="tablist" aria-label="Разделы выбранной страницы">
                    {panelTabs.map((item) => (
                      <button
                        aria-selected={activePanel === item.id}
                        className={activePanel === item.id ? "is-active" : ""}
                        id={`page-${item.id}`}
                        key={item.id}
                        onClick={() => setActivePanel(item.id as OwnerSitePanel)}
                        role="tab"
                        type="button"
                      >
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </button>
                    ))}
                    <button
                      aria-selected={activePanel === "checks"}
                      className={activePanel === "checks" ? "is-active" : ""}
                      id="page-checks"
                      onClick={() => setActivePanel("checks")}
                      role="tab"
                      type="button"
                    >
                      <strong>Проверки</strong>
                      <span>задачи до публикации</span>
                    </button>
                  </div>
                </section>

                {["content", "buttons", "seo"].includes(activePanel) ? (
                  <PageQuickEditor
                    canUpdate={snapshot.canUpdate}
                    content={selectedPage.content}
                    onSnapshot={setSnapshot}
                    pageId={selectedPage.id}
                    seo={selectedPage.seo}
                  />
                ) : null}

                {activePanel === "media" ? (
                  <section className="montelar-site-editor-section montelar-site-context-panel" id="page-media-panel">
                    <div className="montelar-site-editor-section__head">
                      <strong>Медиа этой страницы</strong>
                      <span>фото, видео, PDF, alt и использование</span>
                    </div>
                    <p>Page-owned media редактируется здесь: загрузка, замена, alt и crop остаются внутри выбранной страницы. Глобальная медиатека служит для массовой загрузки и аудита.</p>
                    <SiteInlineMediaEditor
                      canUpdate={snapshot.canUpdate}
                      mediaItems={selectedPage.mediaItems}
                      onDone={() => setReloadToken((current) => current + 1)}
                      ownerId={selectedPage.id}
                      ownerType="page"
                    />
                  </section>
                ) : null}

                {activePanel === "forms" ? (
                  <section className="montelar-site-editor-section montelar-site-context-panel" id="page-forms-panel">
                    <div className="montelar-site-editor-section__head">
                      <strong>Формы на странице</strong>
                      <span>заявка, текст до формы и thank-you сценарий</span>
                    </div>
                    <p>Формы остаются привязаны к выбранной странице и товару; массовая библиотека форм не заменяет редактор страницы.</p>
                    <div className="montelar-site-context-panel__actions">
                      <Link href={resolveAdminHref(adminRoute, "/admin/checks?check=forms-without-product")}>Проверить формы</Link>
                    </div>
                  </section>
                ) : null}

                {activePanel === "translations" ? (
                  <section className="montelar-site-editor-section montelar-site-context-panel" id="page-translations-panel">
                    <div className="montelar-site-editor-section__head">
                      <strong>Переводы страницы</strong>
                      <span>пустые и устаревшие тексты с возвратом на страницу</span>
                    </div>
                    <p>Очередь переводов открывается с привязкой к этой странице, чтобы переводчик вернулся в тот же редактор и блок.</p>
                    <div className="montelar-site-context-panel__actions">
                      <Link className="is-primary" href={resolveAdminHref(adminRoute, translationsHref)}>Открыть переводы этой страницы</Link>
                    </div>
                  </section>
                ) : null}

                {activePanel === "checks" ? (
                  <section className="montelar-site-editor-section montelar-site-context-panel" id="page-checks-panel">
                    <div className="montelar-site-editor-section__head">
                      <strong>Проверки перед публикацией</strong>
                      <span>проблема, место исправления, сохранение</span>
                    </div>
                    <p>Проверки открываются как список задач по выбранной странице: SEO, пустые изображения, alt, переводы, кнопки и публикация.</p>
                    <div className="montelar-site-context-panel__actions">
                      <Link className="is-primary" href={resolveAdminHref(adminRoute, checksHref)}>Открыть проверки страницы</Link>
                    </div>
                  </section>
                ) : null}

                {activePanel === "history" ? (
                  <section className="montelar-site-editor-section montelar-site-context-panel" id="page-history">
                    <div className="montelar-site-editor-section__head">
                      <strong>История страницы</strong>
                      <span>кто менял текст, медиа и публикацию</span>
                    </div>
                    <p>История остается частью выбранной страницы, чтобы владелец видел изменения без перехода в служебные журналы.</p>
                    <div className="montelar-site-context-panel__actions">
                      <Link href={resolveAdminHref(adminRoute, selectedPage.historyHref)}>Открыть историю изменений</Link>
                    </div>
                  </section>
                ) : null}

                {activePanel === "blocks" ? (
                  <section className="montelar-site-editor-section montelar-site-editor-section--blocks">
                  <div className="montelar-site-editor-section__head">
                    <strong>Блоки страницы</strong>
                    <span>выберите строку и сразу меняйте текст, кнопку или видимость</span>
                  </div>
                  <div className="montelar-site-block-table">
                    {selectedPage.blocks.map((block) => (
                      <article
                        className={selectedBlock?.id === block.id ? "montelar-site-block-row is-active" : "montelar-site-block-row"}
                        id={`block-${block.id}`}
                        key={block.id}
                      >
                        <button className="montelar-site-block-row__main" onClick={() => selectBlock(block.id)} type="button">
                          <span>
                            {block.order}. {block.type}
                          </span>
                          <strong>{block.label}</strong>
                          <p>{block.description}</p>
                        </button>
                        <div className="montelar-site-block-row__signals">
                          <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(block.status)}`}>
                            {getBlockStatusLabel(block.status)}
                          </span>
                          <span>{block.visible ? "виден на странице" : "скрыт"}</span>
                          <span>{block.mediaCount} медиа</span>
                          <span>{block.documentCount} документов</span>
                        </div>
                        <div className="montelar-site-block-row__actions">
                          <button onClick={() => selectBlock(block.id)} type="button">
                            Редактировать
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
                ) : null}

                {activePanel === "blocks" ? (
                  <div id="block-editor">
                  <BlockQuickEditor
                    adminRoute={adminRoute}
                    block={selectedBlock}
                    onSaved={() => setReloadToken((current) => current + 1)}
                    pageId={selectedPage.id}
                  />
                </div>
                ) : null}
              </>
            ) : (
              <section className="montelar-site-editor-section">
                <h2>Выберите страницу слева</h2>
                <p>После выбора вы увидите дерево, блоки, контентные переходы и редактор выбранного блока.</p>
              </section>
            )}
          </main>

          {selectedPage ? (
            <aside className="montelar-site-product__inspector" aria-label="Предпросмотр и публикация">
              <div className="montelar-site-inspector-card">
                <span>Инспектор страницы</span>
                <strong>{selectedPage.title}</strong>
                <p>{selectedPage.publicationLead}</p>
                <div className="montelar-site-inspector-card__actions">
                  <Link href={resolveAdminHref(adminRoute, selectedPage.previewHref)}>Предпросмотр</Link>
                  <Link className="is-primary" href={resolveAdminHref(adminRoute, checksHref)}>Проверить и опубликовать</Link>
                </div>
              </div>
              <div className="montelar-site-inspector-card">
                <span>Сейчас открыт блок</span>
                <strong>{selectedBlock?.label ?? "Блок не выбран"}</strong>
                <div className="montelar-site-inspector-checks">
                  <div>
                    <b>Статус страницы</b>
                    <p>{getStatusLabel(selectedPage.status)} · {selectedPage.primaryLocale}</p>
                  </div>
                  <div>
                    <b>Медиа</b>
                    <p>{selectedBlock ? `${selectedBlock.mediaCount} файлов в выбранном блоке` : "Выберите блок"}</p>
                  </div>
                  <div>
                    <b>SEO</b>
                    <p>{selectedPage.seo.title ? "Короткий SEO-блок заполнен" : "Нужно заполнить SEO"}</p>
                  </div>
                  <div>
                    <b>Переводы и проверки</b>
                    <p>Открываются из этой страницы с сохраненным контекстом.</p>
                  </div>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
