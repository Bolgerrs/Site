"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { formatAdminURL } from "payload/shared";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { MediaWorkspaceSnapshot } from "@/lib/payload/media-workspace.ts";
import { getMediaWorkspaceRoleLabel } from "@/lib/payload/media-workspace.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";

const emptySnapshot: MediaWorkspaceSnapshot = {
  activeApprovalStatus: "all",
  activeAssetType: "all",
  activeContext: "all",
  activeFilter: "all",
  activeLibrary: "all",
  activeLocale: "all",
  activePageId: "",
  activeReferenceOnly: "all",
  activeRightsStatus: "all",
  activeSearch: "",
  activeSourceCategory: "all",
  activeUsage: "any",
  assetDetail: null,
  canUpdate: false,
  cards: [],
  documentDetail: null,
  emptyState: "По текущим фильтрам не найдено ни медиафайлов, ни документов.",
  facets: [],
  filters: [],
  focusLabel: "Все управляемые медиафайлы и документы",
  focusPageHref: null,
  focusPublicUrl: null,
  generatedAt: "",
  libraries: [],
  totalVisibleCards: 0,
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

function buildQuery(searchParams: URLSearchParams, updates: Record<string, string | null>) {
  const next = new URLSearchParams(searchParams);
  for (const [key, value] of Object.entries(updates)) {
    if (!value || value === "all" || value === "any") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  return next.toString();
}

function getTone(warnings: string[]) {
  if (
    warnings.some(
      (warning) =>
        warning.toLowerCase().includes("reference-only") ||
        warning.toLowerCase().includes("референс"),
    )
  ) {
    return "alert";
  }
  if (warnings.length > 0) {
    return "attention";
  }
  return "steady";
}

function getToneLabel(tone: ReturnType<typeof getTone>) {
  switch (tone) {
    case "alert":
      return "Внимание";
    case "attention":
      return "Проверить";
    default:
      return "Готово";
  }
}

function formatBytes(value: number) {
  if (!value) {
    return "Вес не определён";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function getWarningLabel(warning: string) {
  switch (warning) {
    case "License expired or no longer valid for production use.":
      return "Истёк срок лицензии или разрешение больше не действует.";
    case "Heavy file: prepare a lighter export before wide public placement.":
      return "Файл тяжёлый: нужен более лёгкий экспорт перед широким размещением.";
    case "Alt text is missing for a public production-ready asset.":
      return "Не заполнен alt-текст для публичного изображения.";
    case "Public-safe metadata is incomplete: add alt text or caption.":
      return "Не хватает alt-текста или подписи для публичного размещения.";
    case "Reference-only asset is still linked to a publishable production surface.":
      return "Референс всё ещё привязан к поверхности, которую можно опубликовать.";
    case "Unused asset: no current product, page or document linkage detected.":
      return "Файл пока не привязан к странице, продукту или документу.";
    case "Document effective window has expired.":
      return "Срок действия документа истёк.";
    case "Heavy file: compress the PDF or split the pack before public delivery.":
      return "PDF тяжёлый: сожмите файл или разделите пакет перед публикацией.";
    case "Version label is missing for a public or gated document.":
      return "Не заполнена версия публичного документа.";
    case "Reference-only document cannot stay on a public or gated surface.":
      return "Референсный документ нельзя оставлять на публичной поверхности.";
    case "Public/gated document requires a production-safe preview asset.":
      return "Для документа нужно утверждённое превью.";
    case "Document is publishable but not linked from any page or section surface.":
      return "Документ можно публиковать, но он не привязан к странице или секции.";
    default:
      return warning;
  }
}

function getOptionLabel(value: string) {
  switch (value) {
    case "image":
      return "Фото";
    case "motion-poster":
      return "Обложка видео";
    case "video-reference":
      return "Видео";
    case "swatch":
      return "Образец материала";
    case "diagram":
      return "Диаграмма";
    case "logo":
      return "Логотип";
    case "creative-reference":
      return "Креативный референс";
    case "ui-preview":
      return "UI-превью";
    case "hero":
      return "Главный экран";
    case "card":
      return "Карточка / тизер";
    case "gallery-object":
      return "Галерея: предмет";
    case "gallery-context":
      return "Галерея: интерьер";
    case "gallery-detail":
      return "Галерея: деталь";
    case "detail":
      return "Детальный блок";
    case "document-preview":
      return "Превью документа";
    case "admin-preview":
      return "Превью в админке";
    case "listing-card":
      return "Карточка списка";
    case "pdp":
      return "Карточка продукта";
    case "gallery":
      return "Галерея";
    case "detail-panel":
      return "Детальная панель";
    case "pdp-downloads":
      return "Блок загрузок";
    case "variant-panel":
      return "Панель варианта";
    case "after-inquiry":
      return "После заявки";
    case "dealer-pack":
      return "Пакет для дилера";
    case "public":
      return "Публично";
    case "preview-only":
      return "Только предпросмотр";
    case "internal-only":
      return "Только внутри";
    case "gated":
      return "По запросу";
    case "production":
      return "Публикация";
    case "editorial-preview":
      return "Редакторское превью";
    case "creative-review":
      return "Креативная проверка";
    case "supplier-handoff":
      return "Передача поставщику";
    case "direct-download":
      return "Прямое скачивание";
    case "open-viewer":
      return "Открыть просмотр";
    case "request-access":
      return "Запросить доступ";
    case "admin-only":
      return "Только для админки";
    case "reference-only":
      return "Только как референс";
    case "supplier-restricted":
      return "Ограничено поставщиком";
    case "licensed":
      return "Лицензировано";
    case "owned":
      return "Собственный файл";
    case "generated-pending-review":
      return "Сгенерирован, ждёт проверки";
    case "production-approved":
      return "Разрешён для сайта";
    case "pending":
      return "Ожидает";
    case "needs-review":
      return "Нужна проверка";
    case "approved":
      return "Подтверждено";
    case "rejected":
      return "Отклонено";
    case "expired":
      return "Истекло";
    case "blocked":
      return "Заблокировано";
    case "production-ready":
      return "Готово для сайта";
    case "Reference-only":
      return "Только как референс";
    case "Production-safe":
      return "Безопасно для сайта";
    case "Not safe for production":
      return "Нельзя выпускать на сайт";
    case "Preview-only":
      return "Только предпросмотр";
    case "Ready after publish wiring":
      return "Готово после настройки публикации";
    case "draft":
      return "Черновик";
    case "review":
      return "На проверке";
    case "published":
      return "Опубликовано";
    case "archived":
      return "Архив";
    case "commissioned":
      return "Заказной продакшн";
    case "generated":
      return "Сгенерировано";
    case "supplier":
      return "От поставщика";
    case "internal":
      return "Внутренний файл";
    case "reference":
      return "Референс";
    case "owner-provided":
      return "От владельца";
    case "dealer":
      return "Для дилеров";
    case "owner-review":
      return "На проверке владельца";
    case "brochure":
      return "Брошюра";
    case "spec-sheet":
      return "Спецификация";
    case "other":
      return "Другое";
    default:
      return value;
  }
}

function SurfaceTargetsField({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  onToggle: (value: string) => void;
  options: readonly string[];
  selected: readonly string[];
}) {
  return (
    <fieldset className="montelar-media-form__chips">
      <legend>{label}</legend>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            className={active ? "montelar-media-chip is-active" : "montelar-media-chip"}
            key={option}
            onClick={(event) => {
              event.preventDefault();
              onToggle(option);
            }}
            type="button"
          >
            {getOptionLabel(option)}
          </button>
        );
      })}
    </fieldset>
  );
}

function AssetEditor({
  canUpdate,
  detail,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  detail: NonNullable<MediaWorkspaceSnapshot["assetDetail"]>;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState(() => ({
    altText: detail.altText,
    approvalStatus: detail.approvalStatus,
    assetRole: detail.assetRole,
    assetTitle: detail.assetTitle,
    assetType: detail.assetType,
    audienceMode: detail.audienceMode,
    caption: detail.caption,
    creditLine: detail.creditLine,
    editorialSummary: detail.editorialSummary,
    governanceNotes: detail.governanceNotes,
    licenseExpiryAt: detail.licenseExpiryAt,
    publicationReadiness: detail.publicationReadiness,
    referenceOnlyNotProductionAsset: detail.isReferenceOnly,
    rightsStatus: detail.rightsStatus,
    sourceCategory: detail.sourceCategory,
    sourceName: detail.sourceName,
    sourceUrl: detail.sourceUrl,
    status: detail.status,
    usageRestrictions: detail.usageRestrictions,
  }));

  async function save() {
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/media-workspace", {
        body: JSON.stringify({
          targetId: detail.id,
          targetType: "asset",
          ...form,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить файл.");
      }
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось обновить файл.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="montelar-media-panel">
      <div className="montelar-media-panel__topline">
        <span>Карточка файла</span>
        <span>{canUpdate ? "можно редактировать" : "только просмотр"}</span>
      </div>
      <div className="montelar-media-form">
        <label>
          <span>Название файла</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, assetTitle: event.target.value }))} value={form.assetTitle} />
        </label>
        <label>
          <span>Тип файла</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, assetType: event.target.value }))} value={form.assetType}>
            {["image", "motion-poster", "video-reference", "swatch", "diagram", "logo", "document-preview", "creative-reference", "ui-preview", "other"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Роль на сайте</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, assetRole: event.target.value }))} value={form.assetRole} />
        </label>
        <label className="montelar-media-form__full">
          <span>Alt-текст</span>
          <textarea disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, altText: event.target.value }))} rows={3} value={form.altText} />
        </label>
        <label className="montelar-media-form__full">
          <span>Подпись</span>
          <textarea disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} rows={3} value={form.caption} />
        </label>
        <label>
          <span>Подпись источника</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, creditLine: event.target.value }))} value={form.creditLine} />
        </label>
        <label className="montelar-media-form__full">
          <span>Краткое описание</span>
          <textarea disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, editorialSummary: event.target.value }))} rows={4} value={form.editorialSummary} />
        </label>
      </div>
      <details className="montelar-media-accordion">
        <summary>Права, источник и выпуск</summary>
        <div className="montelar-media-form">
          <label>
            <span>Статус записи</span>
            <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} value={form.status}>
              {["draft", "review", "approved", "published", "archived"].map((option) => (
                <option key={option} value={option}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Источник</span>
            <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, sourceCategory: event.target.value }))} value={form.sourceCategory}>
              {["commissioned", "generated", "supplier", "internal", "reference", "owner-provided"].map((option) => (
                <option key={option} value={option}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Статус прав</span>
            <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, rightsStatus: event.target.value }))} value={form.rightsStatus}>
              {["reference-only", "supplier-restricted", "licensed", "owned", "generated-pending-review", "production-approved"].map((option) => (
                <option key={option} value={option}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Статус согласования</span>
            <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, approvalStatus: event.target.value }))} value={form.approvalStatus}>
              {["pending", "needs-review", "approved", "rejected", "expired"].map((option) => (
                <option key={option} value={option}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Готовность</span>
            <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, publicationReadiness: event.target.value }))} value={form.publicationReadiness}>
              {["blocked", "preview-only", "production-ready"].map((option) => (
                <option key={option} value={option}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Аудитория</span>
            <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, audienceMode: event.target.value }))} value={form.audienceMode}>
              {["public", "dealer", "owner-review", "internal-only"].map((option) => (
                <option key={option} value={option}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Срок лицензии</span>
            <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, licenseExpiryAt: event.target.value }))} type="date" value={form.licenseExpiryAt} />
          </label>
          <label>
            <span>Источник / поставщик</span>
            <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, sourceName: event.target.value }))} value={form.sourceName} />
          </label>
          <label className="montelar-media-form__full">
            <span>Ссылка на источник</span>
            <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))} value={form.sourceUrl} />
          </label>
          <label className="montelar-media-form__checkbox">
            <input checked={form.referenceOnlyNotProductionAsset} disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, referenceOnlyNotProductionAsset: event.target.checked }))} type="checkbox" />
            <span>Не выпускать на сайт</span>
          </label>
          <label className="montelar-media-form__full">
            <span>Ограничения использования</span>
            <textarea disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, usageRestrictions: event.target.value }))} rows={3} value={form.usageRestrictions} />
          </label>
          <label className="montelar-media-form__full">
            <span>Примечания</span>
            <textarea disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, governanceNotes: event.target.value }))} rows={4} value={form.governanceNotes} />
          </label>
        </div>
      </details>
      {canUpdate ? (
        <button className="montelar-media-save" disabled={isSaving} onClick={() => void save()} type="button">
          {isSaving ? "Сохраняем файл..." : "Сохранить карточку файла"}
        </button>
      ) : null}
    </section>
  );
}

function PlacementEditor({
  canUpdate,
  detail,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  detail: NonNullable<NonNullable<MediaWorkspaceSnapshot["assetDetail"]>["placementEditor"]>;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState(() => ({
    approvalStatus: detail.approvalStatus,
    rightsStatus: detail.rightsStatus,
    slot: detail.slot,
    status: detail.status,
    surfaceTargets: detail.surfaceTargets,
    usageIntent: detail.usageIntent,
    visibilityMode: detail.visibilityMode,
  }));

  async function save() {
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/media-workspace", {
        body: JSON.stringify({
          targetId: detail.id,
          targetType: "placement",
          ...form,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить размещение.");
      }
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось обновить размещение.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleSurfaceTarget(value: string) {
    setForm((current) => ({
      ...current,
      surfaceTargets: current.surfaceTargets.includes(value)
        ? current.surfaceTargets.filter((entry) => entry !== value)
        : [...current.surfaceTargets, value],
    }));
  }

  return (
    <section className="montelar-media-panel">
      <div className="montelar-media-panel__topline">
        <span>Основное размещение</span>
        <Link href={detail.href}>Открыть служебные поля размещения</Link>
      </div>
      <div className="montelar-media-form">
        <label>
          <span>Состояние</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} value={form.status}>
            {["draft", "review", "approved", "published", "archived"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Слот размещения</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, slot: event.target.value }))} value={form.slot}>
            {["hero", "card", "gallery-object", "gallery-context", "gallery-detail", "detail", "document-preview", "admin-preview"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Видимость</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, visibilityMode: event.target.value }))} value={form.visibilityMode}>
            {["public", "internal-only", "preview-only"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Сценарий использования</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, usageIntent: event.target.value }))} value={form.usageIntent}>
            {["production", "editorial-preview", "creative-review", "supplier-handoff"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Статус прав</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, rightsStatus: event.target.value }))} value={form.rightsStatus}>
            {["reference-only", "supplier-restricted", "licensed", "owned", "generated-pending-review", "production-approved"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Статус согласования</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, approvalStatus: event.target.value }))} value={form.approvalStatus}>
            {["pending", "needs-review", "approved", "rejected", "expired"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <SurfaceTargetsField
        label="Где показывать"
        onToggle={toggleSurfaceTarget}
        options={["listing-card", "pdp", "gallery", "detail-panel", "document-preview", "admin-preview"]}
        selected={form.surfaceTargets}
      />
      {canUpdate ? (
        <button className="montelar-media-save" disabled={isSaving} onClick={() => void save()} type="button">
          {isSaving ? "Сохраняем размещение..." : "Сохранить размещение"}
        </button>
      ) : null}
    </section>
  );
}

function DocumentEditor({
  canUpdate,
  detail,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  detail: NonNullable<MediaWorkspaceSnapshot["documentDetail"]>;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState(() => ({
    approvalStatus: detail.approvalStatus,
    documentTitle: detail.documentTitle,
    downloadBehavior: detail.downloadBehavior,
    publicLabel: detail.publicLabel,
    requiresInquiryContext: detail.requiresInquiryContext,
    rightsStatus: detail.rightsStatus,
    status: detail.status,
    surfaceTargets: detail.surfaceTargets,
    versionLabel: detail.versionLabel,
    visibilityMode: detail.visibilityMode,
  }));

  async function save() {
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/media-workspace", {
        body: JSON.stringify({
          targetId: detail.id,
          targetType: "document",
          ...form,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить документ.");
      }
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось обновить документ.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleSurfaceTarget(value: string) {
    setForm((current) => ({
      ...current,
      surfaceTargets: current.surfaceTargets.includes(value)
        ? current.surfaceTargets.filter((entry) => entry !== value)
        : [...current.surfaceTargets, value],
    }));
  }

  return (
    <section className="montelar-media-panel">
      <div className="montelar-media-panel__topline">
        <span>Карточка документа</span>
        <Link href={detail.href}>Открыть продукт с этим документом</Link>
      </div>
      <div className="montelar-media-form">
        <label>
          <span>Название</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, documentTitle: event.target.value }))} value={form.documentTitle} />
        </label>
        <label>
          <span>Публичная подпись</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, publicLabel: event.target.value }))} value={form.publicLabel} />
        </label>
        <label>
          <span>Версия</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, versionLabel: event.target.value }))} value={form.versionLabel} />
        </label>
        <label>
          <span>Состояние</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} value={form.status}>
            {["draft", "review", "approved", "published", "archived"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Видимость</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, visibilityMode: event.target.value }))} value={form.visibilityMode}>
            {["public", "gated", "preview-only", "internal-only"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Сценарий скачивания</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, downloadBehavior: event.target.value }))} value={form.downloadBehavior}>
            {["direct-download", "open-viewer", "request-access", "admin-only"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Статус прав</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, rightsStatus: event.target.value }))} value={form.rightsStatus}>
            {["reference-only", "supplier-restricted", "licensed", "owned", "generated-pending-review", "production-approved"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Статус согласования</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, approvalStatus: event.target.value }))} value={form.approvalStatus}>
            {["pending", "needs-review", "approved", "rejected", "expired"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="montelar-media-form__checkbox">
          <input checked={form.requiresInquiryContext} disabled={!canUpdate || isSaving} onChange={(event) => setForm((current) => ({ ...current, requiresInquiryContext: event.target.checked }))} type="checkbox" />
          <span>Открывать только в контексте заявки</span>
        </label>
      </div>
      <SurfaceTargetsField
        label="Где показывать документ"
        onToggle={toggleSurfaceTarget}
        options={["pdp-downloads", "variant-panel", "after-inquiry", "dealer-pack", "admin-sidebar"]}
        selected={form.surfaceTargets}
      />
      {canUpdate ? (
        <button className="montelar-media-save" disabled={isSaving} onClick={() => void save()} type="button">
          {isSaving ? "Сохраняем документ..." : "Сохранить карточку документа"}
        </button>
      ) : null}
    </section>
  );
}

type MediaCommandResponse = {
  error?: string;
  snapshot?: MediaWorkspaceSnapshot;
};

function UploadPanel({
  canUpdate,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUpdate || isSaving) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("action", "media.upload");
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/owner-media-commands", {
        body: data,
        credentials: "include",
        method: "POST",
      });
      const payload = (await response.json()) as MediaCommandResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось загрузить файл.");
      }
      form.reset();
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось загрузить файл.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="montelar-media-panel">
      <div className="montelar-media-panel__topline">
        <span>Загрузить файл</span>
        <span>{canUpdate ? "готово к загрузке" : "только просмотр"}</span>
      </div>
      <form className="montelar-media-form" onSubmit={(event) => void submit(event)}>
        <label>
          <span>Файл</span>
          <input disabled={!canUpdate || isSaving} name="file" required type="file" />
        </label>
        <label>
          <span>Название</span>
          <input disabled={!canUpdate || isSaving} name="assetTitle" placeholder="Например: Homepage hero still" />
        </label>
        <label>
          <span>Тип</span>
          <select defaultValue="image" disabled={!canUpdate || isSaving} name="assetType">
            {["image", "motion-poster", "video-reference", "swatch", "diagram", "logo", "creative-reference", "ui-preview", "other"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Alt-текст</span>
          <input disabled={!canUpdate || isSaving} name="altText" />
        </label>
        <button className="montelar-media-save" disabled={!canUpdate || isSaving} type="submit">
          {isSaving ? "Загружаем..." : "Загрузить в медиатеку"}
        </button>
      </form>
    </article>
  );
}

function BatchUploadPanel({
  canUpdate,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUpdate || isSaving) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("action", "media.batch-upload");
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/owner-media-commands", {
        body: data,
        credentials: "include",
        method: "POST",
      });
      const payload = (await response.json()) as MediaCommandResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось загрузить пакет файлов.");
      }
      form.reset();
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось загрузить пакет файлов.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <details className="montelar-media-accordion">
      <summary>Пакетная загрузка</summary>
      <form className="montelar-media-form montelar-media-form--single" onSubmit={(event) => void submit(event)}>
        <label>
          <span>Файлы</span>
          <input disabled={!canUpdate || isSaving} multiple name="files" required type="file" />
        </label>
        <label>
          <span>Тип по умолчанию</span>
          <select defaultValue="image" disabled={!canUpdate || isSaving} name="assetType">
            {["image", "motion-poster", "video-reference", "logo", "creative-reference", "other"].map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <button className="montelar-media-save" disabled={!canUpdate || isSaving} type="submit">
          {isSaving ? "Загружаем пакет..." : "Загрузить выбранные файлы"}
        </button>
      </form>
    </details>
  );
}

function FileReplacePanel({
  canUpdate,
  detail,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  detail: NonNullable<MediaWorkspaceSnapshot["assetDetail"]>;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUpdate || isSaving) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("action", "media.replace");
    data.set("assetId", detail.id);
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/owner-media-commands", {
        body: data,
        credentials: "include",
        method: "POST",
      });
      const payload = (await response.json()) as MediaCommandResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось заменить файл.");
      }
      form.reset();
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось заменить файл.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="montelar-media-panel">
      <div className="montelar-media-panel__topline">
        <span>Заменить файл</span>
        <span>связи сохраняются</span>
      </div>
      <form className="montelar-media-form" onSubmit={(event) => void submit(event)}>
        <label>
          <span>Новый файл</span>
          <input disabled={!canUpdate || isSaving} name="file" required type="file" />
        </label>
        <label>
          <span>Причина замены</span>
          <input disabled={!canUpdate || isSaving} name="changeReason" placeholder="Новый экспорт, цветокоррекция, исходник для телефона" />
        </label>
        <button className="montelar-media-save" disabled={!canUpdate || isSaving} type="submit">
          {isSaving ? "Заменяем..." : "Заменить без потери привязок"}
        </button>
      </form>
    </section>
  );
}

function CropPanel({
  canUpdate,
  detail,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  detail: NonNullable<MediaWorkspaceSnapshot["assetDetail"]>;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [preset, setPreset] = React.useState<"desktop" | "mobile">("desktop");
  const crop = detail.responsiveCrop[preset];
  const [form, setForm] = React.useState(crop);

  React.useEffect(() => {
    setForm(detail.responsiveCrop[preset]);
  }, [detail, preset]);

  async function save() {
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/owner-media-commands", {
        body: JSON.stringify({
          action: "media.crop.save",
          payload: {
            assetId: detail.id,
            crop: form,
            notes: detail.responsiveCrop.notes,
            preset,
          },
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as MediaCommandResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось сохранить crop.");
      }
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось сохранить crop.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateNumber(key: keyof typeof form, value: string) {
    const nextValue = Number(value);
    setForm((current) => ({
      ...current,
      [key]: Number.isFinite(nextValue) ? nextValue : current[key],
    }));
  }

  return (
    <section className="montelar-media-panel">
      <div className="montelar-media-panel__topline">
        <span>Кадрирование для экрана и телефона</span>
        <span>{preset === "desktop" ? "Экран" : "Телефон"}</span>
      </div>
      <div className="montelar-media-toolbar__actions">
        <button className={preset === "desktop" ? "montelar-media-chip is-active" : "montelar-media-chip"} onClick={() => setPreset("desktop")} type="button">
          Экран
        </button>
        <button className={preset === "mobile" ? "montelar-media-chip is-active" : "montelar-media-chip"} onClick={() => setPreset("mobile")} type="button">
          Телефон
        </button>
      </div>
      <div className="montelar-media-form">
        {(["x", "y", "width", "height", "focalX", "focalY"] as const).map((key) => (
          <label key={key}>
            <span>{key}</span>
            <input
              disabled={!canUpdate || isSaving}
              max="1"
              min="0"
              onChange={(event) => updateNumber(key, event.target.value)}
              step="0.01"
              type="number"
              value={form[key]}
            />
          </label>
        ))}
      </div>
      <button className="montelar-media-save" disabled={!canUpdate || isSaving} onClick={() => void save()} type="button">
        {isSaving ? "Сохраняем crop..." : "Сохранить crop"}
      </button>
    </section>
  );
}

function AssignMediaPanel({
  canUpdate,
  detail,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  detail: NonNullable<MediaWorkspaceSnapshot["assetDetail"]>;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [targetType, setTargetType] = React.useState("page");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/owner-media-commands", {
        body: JSON.stringify({
          action: "media.assign",
          payload: {
            blockId: String(data.get("blockId") || ""),
            caption: String(data.get("caption") || ""),
            mediaId: detail.id,
            pageId: String(data.get("pageId") || ""),
            productKey: String(data.get("productKey") || ""),
            productLabel: String(data.get("productLabel") || ""),
            slot: String(data.get("slot") || "hero"),
            targetType,
          },
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as MediaCommandResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось привязать медиа.");
      }
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось привязать медиа.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="montelar-media-panel">
      <div className="montelar-media-panel__topline">
        <span>Привязать к сайту</span>
        <span>страница / блок / продукт</span>
      </div>
      <form className="montelar-media-form" onSubmit={(event) => void submit(event)}>
        <label>
          <span>Куда</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setTargetType(event.target.value)} value={targetType}>
            <option value="page">Страница</option>
            <option value="block">Блок страницы</option>
            <option value="product">Продукт</option>
          </select>
        </label>
        <label>
          <span>Слот</span>
          <select disabled={!canUpdate || isSaving} name="slot">
            <option value="hero">Главный экран</option>
            <option value="cover">Обложка</option>
            <option value="seo">Изображение для поиска</option>
            <option value="gallery">Галерея</option>
            <option value="card">Карточка</option>
          </select>
        </label>
        {targetType === "page" ? (
          <label>
            <span>Номер страницы</span>
            <input disabled={!canUpdate || isSaving} name="pageId" placeholder="Например: 12" />
          </label>
        ) : null}
        {targetType === "block" ? (
          <label>
            <span>Номер блока</span>
            <input disabled={!canUpdate || isSaving} name="blockId" placeholder="Например: 34" />
          </label>
        ) : null}
        {targetType === "product" ? (
          <>
            <label>
              <span>Ключ продукта</span>
              <input disabled={!canUpdate || isSaving} name="productKey" placeholder="vision-max-premium" />
            </label>
            <label>
              <span>Название продукта</span>
              <input disabled={!canUpdate || isSaving} name="productLabel" />
            </label>
          </>
        ) : null}
        <label className="montelar-media-form__full">
          <span>Подпись для gallery</span>
          <input disabled={!canUpdate || isSaving} name="caption" />
        </label>
        <button className="montelar-media-save" disabled={!canUpdate || isSaving} type="submit">
          {isSaving ? "Привязываем..." : "Привязать медиа"}
        </button>
      </form>
    </section>
  );
}

export function MontelarMediaWorkspace() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canReachWorkspace = hasAdminRole(user, ["owner", "admin", "media-manager", "developer"]);
  const [layoutMode, setLayoutMode] = React.useState<"grid" | "list">("list");
  const [reloadToken, setReloadToken] = React.useState(0);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [snapshot, setSnapshot] = React.useState<MediaWorkspaceSnapshot>(emptySnapshot);

  const requestQuery = React.useMemo(() => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("refresh", String(reloadToken));
    return query.toString();
  }, [reloadToken, searchParams]);

  React.useEffect(() => {
    if (!canReachWorkspace) {
      return;
    }

    let cancelled = false;
    async function loadMedia() {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await fetch(`/api/internal/media-workspace?${requestQuery}`, {
          credentials: "include",
          headers: {
            "Cache-Control": "no-store",
          },
        });
        const payload = (await response.json()) as MediaWorkspaceSnapshot;

        if (!response.ok) {
          throw new Error("Не удалось загрузить медиатеку.");
        }

        if (!cancelled) {
          setSnapshot(payload);
        }
      } catch {
        if (!cancelled) {
          setIsError(true);
          setSnapshot(emptySnapshot);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMedia();

    return () => {
      cancelled = true;
    };
  }, [canReachWorkspace, requestQuery]);

  const selectedId = searchParams.get("selected") || "";
  const selectedCard =
    snapshot.cards.find((card) => card.id === selectedId) ??
    snapshot.cards.find((card) => {
      if (!selectedId || selectedId.includes(":")) {
        return false;
      }
      if (snapshot.activeLibrary === "document" || snapshot.activeFilter === "documents") {
        return card.recordType === "document" && card.recordId === selectedId;
      }
      return card.recordType === "asset" && card.recordId === selectedId;
    }) ??
    snapshot.cards.find((card) => card.recordId === selectedId) ??
    snapshot.cards[0] ??
    null;
  const effectiveSelectedId = selectedCard?.id ?? "";
  const selectedAssetDetail = selectedCard?.recordType === "asset" ? snapshot.assetDetail : null;
  const selectedDocumentDetail = selectedCard?.recordType === "document" ? snapshot.documentDetail : null;
  const missingAltCount = snapshot.cards.filter((card) =>
    card.warnings.some((warning) => warning.includes("Alt text is missing")),
  ).length;
  const heavyFileCount = snapshot.cards.filter((card) =>
    card.warnings.some((warning) => warning.toLowerCase().includes("heavy file")),
  ).length;
  const unusedCount = snapshot.cards.filter((card) => card.recordType === "asset" && card.usageLabel === "unused")
    .length;

  function navigate(updates: Record<string, string | null>) {
    const nextQuery = buildQuery(new URLSearchParams(searchParams.toString()), updates);
    router.replace(nextQuery ? `?${nextQuery}` : "?");
  }

  function refreshWorkspace() {
    setReloadToken((current) => current + 1);
  }

  if (!canReachWorkspace) {
    return (
      <section className="montelar-media-workspace montelar-media-workspace--empty">
        <div className="montelar-media-workspace__hero">
          <div>
            <p className="montelar-admin-dashboard__eyebrow">Медиатека Montelar</p>
            <h1>Этот раздел недоступен для текущей роли</h1>
            <p>{getMediaWorkspaceRoleLabel(user?.role ?? null)}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="montelar-media-workspace">
      <div className="montelar-media-workspace__header">
        <div className="montelar-media-workspace__title">
          <p className="montelar-admin-dashboard__eyebrow">Медиатека Montelar</p>
          <h1>Медиа без файловой свалки</h1>
          <p>{snapshot.focusLabel}</p>
          <p>{getMediaWorkspaceRoleLabel(user?.role ?? null)}</p>
        </div>
        <div className="montelar-media-workspace__status">
          <span>{snapshot.filters.find((entry) => entry.id === snapshot.activeFilter)?.label || "Все"}</span>
          <strong>{snapshot.totalVisibleCards}</strong>
          <small>{snapshot.generatedAt ? "Срез медиатеки готов" : "Срез обновляется"}</small>
        </div>
      </div>

      <div className="montelar-media-libraries" role="tablist" aria-label="Разделение медиатеки">
        {snapshot.libraries.map((library) => {
          const active = library.id === snapshot.activeLibrary;
          return (
            <button
              className={active ? "montelar-media-filter is-active" : "montelar-media-filter"}
              key={library.id}
              onClick={() => navigate({ library: library.id === "all" ? null : library.id, selected: null })}
              type="button"
            >
              <span>{library.label}</span>
              <strong>{library.count}</strong>
              <small>{library.description}</small>
            </button>
          );
        })}
      </div>

      <div className="montelar-media-toolbar">
        <form
          className="montelar-media-search"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            navigate({ q: String(data.get("q") || "") || null, selected: null });
          }}
        >
          <input defaultValue={snapshot.activeSearch} name="q" placeholder="Поиск по названию, коду или документу" />
          <button type="submit">Найти</button>
        </form>
        <div className="montelar-media-toolbar__actions">
          <label className="montelar-media-toolbar__select">
            <span>Очередь</span>
            <select
              onChange={(event) => navigate({ filter: event.target.value === "all" ? null : event.target.value, selected: null })}
              value={snapshot.activeFilter}
            >
              {snapshot.filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label} ({filter.count})
                </option>
              ))}
            </select>
          </label>
          <Link href={resolveAdminHref(adminRoute, "/admin/media")}>Сбросить фильтры</Link>
          {snapshot.focusPageHref ? <Link href={resolveAdminHref(adminRoute, snapshot.focusPageHref)}>Открыть страницу</Link> : null}
          {snapshot.focusPublicUrl ? (
            <a href={snapshot.focusPublicUrl} rel="noreferrer" target="_blank">
              Предпросмотр
            </a>
          ) : null}
        </div>
      </div>

      {isError ? <div className="montelar-media-error">Не удалось загрузить медиатеку.</div> : null}

      <div className="montelar-media-workbench">
        <aside className="montelar-media-library-pane" aria-label="Библиотека медиа">
          <UploadPanel canUpdate={snapshot.canUpdate} onError={setError} onSaved={refreshWorkspace} />
          <BatchUploadPanel canUpdate={snapshot.canUpdate} onError={setError} onSaved={refreshWorkspace} />

          <div className="montelar-media-queue-strip">
            <button className="montelar-media-queue" onClick={() => navigate({ filter: "missing-metadata", selected: null })} type="button">
              <span>Alt</span>
              <strong>{missingAltCount}</strong>
            </button>
            <button className="montelar-media-queue" onClick={() => navigate({ filter: "all", selected: null, usage: "unused" })} type="button">
              <span>Не используется</span>
              <strong>{unusedCount}</strong>
            </button>
            <button className="montelar-media-queue" onClick={() => navigate({ filter: "heavy", selected: null })} type="button">
              <span>Тяжёлые</span>
              <strong>{heavyFileCount}</strong>
            </button>
          </div>

          <details className="montelar-media-accordion">
            <summary>Фильтры</summary>
            <div className="montelar-media-facets">
              {snapshot.facets.map((facet) => (
                <label key={facet.id}>
                  <span>{facet.label}</span>
                  <select
                    onChange={(event) =>
                      navigate({
                        [facet.id]: event.target.value === "all" || event.target.value === "any" ? null : event.target.value,
                        selected: null,
                      })
                    }
                    value={
                      facet.id === "assetType"
                        ? snapshot.activeAssetType
                        : facet.id === "sourceCategory"
                          ? snapshot.activeSourceCategory
                          : facet.id === "rightsStatus"
                            ? snapshot.activeRightsStatus
                            : facet.id === "approvalStatus"
                              ? snapshot.activeApprovalStatus
                              : facet.id === "locale"
                                ? snapshot.activeLocale
                                : facet.id === "usage"
                                  ? snapshot.activeUsage
                                  : snapshot.activeReferenceOnly
                    }
                  >
                    {facet.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </details>

          <div className="montelar-media-list-toolbar">
            <strong>Библиотека</strong>
            <div>
              <button className={layoutMode === "list" ? "montelar-media-chip is-active" : "montelar-media-chip"} onClick={() => setLayoutMode("list")} type="button">
                Список
              </button>
              <button className={layoutMode === "grid" ? "montelar-media-chip is-active" : "montelar-media-chip"} onClick={() => setLayoutMode("grid")} type="button">
                Сетка
              </button>
            </div>
          </div>

          <div className={layoutMode === "grid" ? "montelar-media-list montelar-media-list--grid" : "montelar-media-list"}>
            {isLoading ? (
              <article className="montelar-media-card">
                <strong>Загружаем срез медиатеки...</strong>
              </article>
            ) : null}

            {!isLoading && snapshot.cards.length === 0 ? (
              <article className="montelar-media-card">
                <strong>{snapshot.emptyState}</strong>
              </article>
            ) : null}

            {snapshot.cards.map((card) => {
              const tone = getTone(card.warnings);
              return (
                <button
                  className={card.id === effectiveSelectedId ? "montelar-media-card is-selected" : "montelar-media-card"}
                  key={`${card.recordType}-${card.id}`}
                  onClick={() => navigate({ selected: card.id })}
                  type="button"
                >
                  <div className="montelar-media-card__topline">
                    <span>{card.recordType === "asset" ? "Файл" : "Документ"}</span>
                    <span className={`montelar-admin-state montelar-admin-state--${tone}`}>{getToneLabel(tone)}</span>
                  </div>
                  <strong>{card.title}</strong>
                  <p>{card.usageTitle}</p>
                  <div className="montelar-media-card__meta">
                    <span>{getOptionLabel(card.assetType)}</span>
                    <span>{card.locale.toUpperCase()}</span>
                    <span>{card.pageCount + card.placementCount} связей</span>
                    <span>{getOptionLabel(card.approvalStatus)}</span>
                  </div>
                  {card.primaryWarning ? <div className="montelar-media-card__warnings">{getWarningLabel(card.primaryWarning)}</div> : null}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="montelar-media-editor-pane" aria-label="Редактор выбранного медиа">
          {selectedAssetDetail ? (
            <>
              <section className="montelar-media-panel">
                <div className="montelar-media-panel__topline">
                  <span>{getOptionLabel(selectedAssetDetail.assetType)}</span>
                  <span>{selectedAssetDetail.altText ? "Alt заполнен" : "Нужен alt"}</span>
                </div>
                <h2>{selectedAssetDetail.assetTitle}</h2>
                <div className="montelar-media-detail__grid">
                  <div>
                    <dt>Файл</dt>
                    <dd>{selectedAssetDetail.fileMeta.join(" · ") || selectedAssetDetail.primaryPreviewLabel}</dd>
                  </div>
                  <div>
                    <dt>Язык</dt>
                    <dd>{selectedAssetDetail.locale.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt>Использование</dt>
                    <dd>{selectedCard?.usageTitle ?? "Не определено"}</dd>
                  </div>
                  <div>
                    <dt>Готовность</dt>
                    <dd>{getOptionLabel(selectedAssetDetail.publicationReadiness)}</dd>
                  </div>
                  <div>
                    <dt>Вес файла</dt>
                    <dd>{formatBytes(selectedAssetDetail.fileSizeBytes)}</dd>
                  </div>
                  <div>
                    <dt>Оптимизация</dt>
                    <dd>{selectedAssetDetail.optimizationStatus}</dd>
                  </div>
                </div>
              </section>

              <AssetEditor key={`asset-${selectedAssetDetail.id}`} canUpdate={snapshot.canUpdate} detail={selectedAssetDetail} onError={setError} onSaved={refreshWorkspace} />

              {selectedAssetDetail.placementEditor ? (
                <PlacementEditor key={`placement-${selectedAssetDetail.placementEditor.id}`} canUpdate={snapshot.canUpdate} detail={selectedAssetDetail.placementEditor} onError={setError} onSaved={refreshWorkspace} />
              ) : null}
            </>
          ) : null}

          {selectedDocumentDetail ? (
            <>
              <section className="montelar-media-panel">
                <div className="montelar-media-panel__topline">
                  <span>{getOptionLabel(selectedDocumentDetail.documentType)}</span>
                  <span>{selectedDocumentDetail.versionLabel || "нужна версия"}</span>
                </div>
                <h2>{selectedDocumentDetail.documentTitle}</h2>
                <div className="montelar-media-detail__grid">
                  <div>
                    <dt>Продукт</dt>
                    <dd>{selectedDocumentDetail.productLabel}</dd>
                  </div>
                  <div>
                    <dt>Версия</dt>
                    <dd>{selectedDocumentDetail.versionLabel || "Не заполнено"}</dd>
                  </div>
                  <div>
                    <dt>Видимость</dt>
                    <dd>{getOptionLabel(selectedDocumentDetail.visibilityMode)}</dd>
                  </div>
                  <div>
                    <dt>Превью</dt>
                    <dd>{selectedDocumentDetail.previewAssetLabel}</dd>
                  </div>
                  <div>
                    <dt>Вес файла</dt>
                    <dd>{formatBytes(selectedDocumentDetail.fileSizeBytes)}</dd>
                  </div>
                </div>
              </section>

              <DocumentEditor key={`document-${selectedDocumentDetail.id}`} canUpdate={snapshot.canUpdate} detail={selectedDocumentDetail} onError={setError} onSaved={refreshWorkspace} />
            </>
          ) : null}

          {!selectedCard && !isLoading ? (
            <section className="montelar-media-panel montelar-media-panel--empty">
              <h2>Запись не выбрана</h2>
            </section>
          ) : null}

          {error ? <div className="montelar-media-error">{error}</div> : null}
        </main>

        <aside className="montelar-media-inspector" aria-label="Инспектор выбранного медиа">
          {selectedAssetDetail ? (
            <>
              {selectedAssetDetail.warnings.length > 0 ? (
                <section className="montelar-media-panel">
                  <div className="montelar-media-panel__topline">
                    <span>Требует внимания</span>
                    <span>{selectedAssetDetail.warnings.length}</span>
                  </div>
                  <ul className="montelar-media-linked-list">
                    {selectedAssetDetail.warnings.map((warning) => (
                      <li key={warning}>{getWarningLabel(warning)}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <FileReplacePanel canUpdate={snapshot.canUpdate} detail={selectedAssetDetail} onError={setError} onSaved={refreshWorkspace} />
              <CropPanel canUpdate={snapshot.canUpdate} detail={selectedAssetDetail} onError={setError} onSaved={refreshWorkspace} />
              <AssignMediaPanel canUpdate={snapshot.canUpdate} detail={selectedAssetDetail} onError={setError} onSaved={refreshWorkspace} />
              <section className="montelar-media-panel">
                <div className="montelar-media-panel__topline">
                  <span>Где используется</span>
                  <span>{selectedAssetDetail.linkedPlacements.length + selectedAssetDetail.linkedPages.length + selectedAssetDetail.linkedDocuments.length}</span>
                </div>
                <div className="montelar-media-usage-groups">
                  <div>
                    <strong>Продукты</strong>
                    <ul className="montelar-media-linked-list">
                      {selectedAssetDetail.linkedPlacements.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href}>{item.label}</Link>
                          <span>{item.meta}</span>
                        </li>
                      ))}
                      {selectedAssetDetail.linkedPlacements.length === 0 ? <li>Пока нет продуктовых размещений.</li> : null}
                    </ul>
                  </div>
                  <div>
                    <strong>Страницы</strong>
                    <ul className="montelar-media-linked-list">
                      {selectedAssetDetail.linkedPages.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href}>{item.label}</Link>
                          <span>{item.meta}</span>
                        </li>
                      ))}
                      {selectedAssetDetail.linkedPages.length === 0 ? <li>Пока нет ссылок со страниц.</li> : null}
                    </ul>
                  </div>
                  <div>
                    <strong>Документы</strong>
                    <ul className="montelar-media-linked-list">
                      {selectedAssetDetail.linkedDocuments.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href}>{item.label}</Link>
                          <span>{item.meta}</span>
                        </li>
                      ))}
                      {selectedAssetDetail.linkedDocuments.length === 0 ? <li>Пока нет привязанных превью документов.</li> : null}
                    </ul>
                  </div>
                </div>
              </section>
              <details className="montelar-media-accordion">
                <summary>Расширенные права и источник</summary>
                <Link href={selectedAssetDetail.href}>Открыть служебные поля файла</Link>
              </details>
            </>
          ) : null}

          {selectedDocumentDetail ? (
            <>
              {selectedDocumentDetail.warnings.length > 0 ? (
                <section className="montelar-media-panel">
                  <div className="montelar-media-panel__topline">
                    <span>Требует внимания</span>
                    <span>{selectedDocumentDetail.warnings.length}</span>
                  </div>
                  <ul className="montelar-media-linked-list">
                    {selectedDocumentDetail.warnings.map((warning) => (
                      <li key={warning}>{getWarningLabel(warning)}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <section className="montelar-media-panel">
                <div className="montelar-media-panel__topline">
                  <span>Где используется</span>
                  <span>{selectedDocumentDetail.linkedPages.length + selectedDocumentDetail.linkedProducts.length}</span>
                </div>
                <div className="montelar-media-usage-groups">
                  <div>
                    <strong>Продукты</strong>
                    <ul className="montelar-media-linked-list">
                      {selectedDocumentDetail.linkedProducts.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href}>{item.label}</Link>
                          <span>{item.meta}</span>
                        </li>
                      ))}
                      {selectedDocumentDetail.linkedProducts.length === 0 ? <li>Пока нет продуктовой карточки.</li> : null}
                    </ul>
                  </div>
                  <div>
                    <strong>Страницы</strong>
                    <ul className="montelar-media-linked-list">
                      {selectedDocumentDetail.linkedPages.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href}>{item.label}</Link>
                          <span>{item.meta}</span>
                        </li>
                      ))}
                      {selectedDocumentDetail.linkedPages.length === 0 ? <li>Пока нет ссылок со страниц или секций.</li> : null}
                    </ul>
                  </div>
                </div>
              </section>
              <details className="montelar-media-accordion">
                <summary>Расширенные права документа</summary>
                <Link href={selectedDocumentDetail.href}>Открыть служебные поля документа</Link>
              </details>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
