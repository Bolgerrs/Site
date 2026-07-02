"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import type {
  OwnerProductCard,
  OwnerProductHierarchy,
  OwnerProductsSnapshot,
} from "@/lib/payload/owner-products.ts";

const emptySnapshot: OwnerProductsSnapshot = {
  canRead: false,
  cards: [],
  commandEndpoint: "/api/internal/owner-product-commands",
  generatedAt: "",
  hierarchy: {
    categories: [],
    directions: [],
    lines: [],
  },
  mediaOptions: [],
  selectedProduct: null,
  selectedProductId: null,
  totals: {
    missingCategory: 0,
    missingForm: 0,
    missingHero: 0,
    missingSeo: 0,
    published: 0,
    total: 0,
  },
};

function statusLabel(value: string) {
  switch (value) {
    case "published":
      return "Опубликован";
    case "review":
      return "На проверке";
    case "hidden":
      return "Скрыт";
    case "archived":
      return "Архив";
    default:
      return "Черновик";
  }
}

function statusTone(value: string) {
  switch (value) {
    case "published":
      return "ready";
    case "review":
      return "review";
    case "hidden":
    case "archived":
      return "quiet";
    default:
      return "attention";
  }
}

function launchStageLabel(value: string) {
  switch (value) {
    case "concept":
      return "Концепт";
    case "active":
      return "В работе";
    case "signature":
      return "Флагман";
    case "limited":
      return "Лимитированная серия";
    case "ready-for-review":
      return "Готовится к проверке";
    case "launched":
      return "Запущен";
    case "planned":
    default:
      return "Планируется";
  }
}

function availabilityModeLabel(value: string) {
  switch (value) {
    case "made-to-order":
      return "Изготавливается под заказ";
    case "limited-series":
      return "Ограниченная серия";
    case "dealer-only":
      return "Через партнера";
    case "private-consultation":
    case "consultation-required":
      return "Через консультацию";
    case "limited":
      return "Ограниченно";
    case "on-request":
    default:
      return "По запросу";
  }
}

function issueState(card: OwnerProductCard) {
  if (card.issueLabels.length === 0) {
    return "ready";
  }

  if (!card.hasHero || !card.hasForm) {
    return "attention";
  }

  return "review";
}

function nextActionLabel(card: OwnerProductCard) {
  if (!card.hasHero) {
    return "Добавить фото";
  }

  if (!card.hasForm) {
    return "Привязать форму";
  }

  if (card.status !== "published") {
    return "Проверить перед выпуском";
  }

  return "Открыть карточку";
}

function createSearchText(card: OwnerProductCard) {
  return [
    card.label,
    card.description,
    card.directionLabel,
    card.categoryLabel,
    card.availabilityMode,
    card.launchStage,
    card.locale,
  ]
    .join(" ")
    .toLowerCase();
}

function ProductListRow({
  card,
  isBulkSelected,
  isSelected,
  onBulkToggle,
  onSelect,
}: {
  card: OwnerProductCard;
  isBulkSelected: boolean;
  isSelected: boolean;
  onBulkToggle: () => void;
  onSelect: () => void;
}) {
  const currentIssueState = issueState(card);

  return (
    <article className={isSelected ? "montelar-products-row is-selected" : "montelar-products-row"}>
      <button
        className="montelar-products-row__select"
        onClick={onSelect}
        type="button"
      >
        <div className="montelar-products-row__media">
          {card.previewMedia ? (
            <img alt={card.previewMedia.alt} src={card.previewMedia.src} />
          ) : (
            <span>{card.label.slice(0, 1)}</span>
          )}
        </div>

        <div className="montelar-products-row__identity">
          <span>
            {card.locale} · {card.directionLabel}
          </span>
          <strong>{card.label}</strong>
          <p>{card.description}</p>
        </div>
      </button>

      <label className="montelar-products-row__bulk">
        <input
          checked={isBulkSelected}
          onChange={onBulkToggle}
          type="checkbox"
        />
        <span>В пакет</span>
      </label>

      <div className="montelar-products-row__meta">
        <div>
          <span>Категория</span>
          <strong>{card.categoryLabel}</strong>
        </div>
        <div>
          <span>Стадия</span>
          <strong>{launchStageLabel(card.launchStage)}</strong>
        </div>
      </div>

      <div className="montelar-products-row__signals">
        <span className={`montelar-products-status montelar-products-status--${statusTone(card.status)}`}>
          {statusLabel(card.status)}
        </span>
        <span className={card.hasHero ? "montelar-products-pill is-ok" : "montelar-products-pill is-warn"}>
          {card.hasHero ? "Фото готово" : "Нет фото"}
        </span>
        <span className={card.hasForm ? "montelar-products-pill is-ok" : "montelar-products-pill is-warn"}>
          {card.hasForm ? "Форма готова" : "Нет формы"}
        </span>
        <span className={card.hasSeo ? "montelar-products-pill is-ok" : "montelar-products-pill is-warn"}>
          {card.hasSeo ? "SEO готово" : "Нет SEO"}
        </span>
        <span className={`montelar-products-pill montelar-products-pill--${currentIssueState}`}>
          {card.issueLabels.length === 0 ? "Готов к выпуску" : `${card.issueLabels.length} задачи`}
        </span>
      </div>

      <div className="montelar-products-row__actions">
        <button className="montelar-products-action is-primary" onClick={onSelect} type="button">
          {nextActionLabel(card)}
        </button>
        <Link className="montelar-products-action" href={card.editorHref}>
          Редактор
        </Link>
        <a className="montelar-products-action" href={card.publicHref} rel="noreferrer" target="_blank">
          Сайт
        </a>
      </div>
    </article>
  );
}

type ProductCommandResult = {
  error?: string;
  products?: OwnerProductsSnapshot;
  selectedProductId?: string | null;
};

type ProductEditorTab =
  | "content"
  | "media"
  | "specs"
  | "category"
  | "form"
  | "seo"
  | "translations"
  | "history"
  | "publish";

const productEditorTabs: Array<{ id: ProductEditorTab; label: string }> = [
  { id: "content", label: "Контент" },
  { id: "media", label: "Медиа" },
  { id: "specs", label: "Характеристики" },
  { id: "category", label: "Категория" },
  { id: "form", label: "Форма" },
  { id: "seo", label: "SEO" },
  { id: "translations", label: "Переводы" },
  { id: "history", label: "История" },
  { id: "publish", label: "Выпуск" },
];

function normalizeProductTab(value: string | null): ProductEditorTab {
  const normalized = value === "photo" ? "media" : value;

  return productEditorTabs.some((tab) => tab.id === normalized)
    ? (normalized as ProductEditorTab)
    : "content";
}

function ProductContentTab({
  card,
  isSaving,
  onCommand,
}: {
  card: OwnerProductCard;
  isSaving: boolean;
  onCommand: (input: { action: string; payload: Record<string, unknown> }) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState({
    availabilityMode: card.availabilityMode || "on-request",
    launchStage: card.launchStage || "planned",
    name: card.label,
    shortDescription: card.description,
  });

  React.useEffect(() => {
    setDraft({
      availabilityMode: card.availabilityMode || "on-request",
      launchStage: card.launchStage || "planned",
      name: card.label,
      shortDescription: card.description,
    });
  }, [card.availabilityMode, card.description, card.id, card.label, card.launchStage]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCommand({
      action: "product.core.save",
      payload: {
        availabilityMode: draft.availabilityMode,
        launchStage: draft.launchStage,
        name: draft.name,
        productId: card.id,
        publicLabel: draft.name,
        shortDescription: draft.shortDescription,
      },
    });
  }

  return (
    <form className="montelar-products-editor-form" onSubmit={save}>
      <label>
        <span>Название</span>
        <input
          data-montelar-products-name
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          required
          value={draft.name}
        />
      </label>
      <label>
        <span>Короткое описание</span>
        <textarea
          data-montelar-products-description
          onChange={(event) => setDraft((current) => ({ ...current, shortDescription: event.target.value }))}
          required
          value={draft.shortDescription}
        />
      </label>
      <div className="montelar-products-editor-form__grid">
        <label>
          <span>Стадия</span>
          <select
            onChange={(event) => setDraft((current) => ({ ...current, launchStage: event.target.value }))}
            value={draft.launchStage}
          >
            <option value="planned">Планируется</option>
            <option value="concept">Концепт</option>
            <option value="active">В работе</option>
            <option value="signature">Флагман</option>
            <option value="limited">Лимитированная серия</option>
          </select>
        </label>
        <label>
          <span>Наличие</span>
          <select
            onChange={(event) => setDraft((current) => ({ ...current, availabilityMode: event.target.value }))}
            value={draft.availabilityMode}
          >
            <option value="on-request">По запросу</option>
            <option value="made-to-order">Изготавливается под заказ</option>
            <option value="limited-series">Ограниченная серия</option>
            <option value="dealer-only">Через партнера</option>
            <option value="private-consultation">Через консультацию</option>
          </select>
        </label>
      </div>
      <button className="montelar-products-action is-primary" data-montelar-products-save-core disabled={isSaving} type="submit">
        {isSaving ? "Сохраняю..." : "Сохранить продукт"}
      </button>
    </form>
  );
}

function ProductCategoryTab({
  card,
  hierarchy,
  isSaving,
  onCommand,
}: {
  card: OwnerProductCard;
  hierarchy: OwnerProductHierarchy;
  isSaving: boolean;
  onCommand: (input: { action: string; payload: Record<string, unknown> }) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState({
    categoryId: card.categoryId,
    directionId: card.directionId,
    lineId: card.lineId,
  });

  React.useEffect(() => {
    setDraft({
      categoryId: card.categoryId,
      directionId: card.directionId,
      lineId: card.lineId,
    });
  }, [card.categoryId, card.directionId, card.id, card.lineId]);

  const categoryOptions = hierarchy.categories.filter(
    (category) => !draft.directionId || category.directionId === draft.directionId,
  );
  const lineOptions = hierarchy.lines.filter(
    (line) =>
      (!draft.directionId || line.directionId === draft.directionId) &&
      (!draft.categoryId || line.categoryId === draft.categoryId),
  );

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCommand({
      action: "product.category.assign",
      payload: {
        categoryId: draft.categoryId || null,
        directionId: draft.directionId,
        lineId: draft.lineId || null,
        productId: card.id,
      },
    });
  }

  return (
    <form className="montelar-products-editor-form" onSubmit={save}>
      <div className="montelar-products-editor-form__grid">
        <label>
          <span>Направление</span>
          <select
            data-montelar-products-direction
            onChange={(event) => {
              const directionId = event.target.value;
              setDraft((current) => ({
                ...current,
                categoryId: "",
                directionId,
                lineId: "",
              }));
            }}
            required
            value={draft.directionId}
          >
            <option value="">Выберите направление</option>
            {hierarchy.directions.map((direction) => (
              <option key={direction.id} value={direction.id}>
                {direction.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Категория</span>
          <select
            data-montelar-products-category
            onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value, lineId: "" }))}
            value={draft.categoryId}
          >
            <option value="">Без категории</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Семейство</span>
          <select
            onChange={(event) => setDraft((current) => ({ ...current, lineId: event.target.value }))}
            value={draft.lineId}
          >
            <option value="">Без семейства</option>
            {lineOptions.map((line) => (
              <option key={line.id} value={line.id}>
                {line.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="montelar-products-action is-primary" data-montelar-products-save-category disabled={isSaving} type="submit">
        {isSaving ? "Сохраняю..." : "Сохранить место в каталоге"}
      </button>
    </form>
  );
}

function ProductMediaTab({
  card,
  isSaving,
  mediaOptions,
  onCommand,
}: {
  card: OwnerProductCard;
  isSaving: boolean;
  mediaOptions: OwnerProductsSnapshot["mediaOptions"];
  onCommand: (input: { action: string; payload: Record<string, unknown> }) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState({
    coverCardAssetId: card.coverCardAssetId,
    heroAssetId: card.heroAssetId,
  });
  const [selectedAssetId, setSelectedAssetId] = React.useState(card.heroAssetId || card.coverCardAssetId || "");
  const [uploadSlot, setUploadSlot] = React.useState<"hero" | "card" | "gallery-object">("hero");
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [replaceFile, setReplaceFile] = React.useState<File | null>(null);
  const [altText, setAltText] = React.useState("");
  const [selectedDocumentId, setSelectedDocumentId] = React.useState("");
  const [documentFile, setDocumentFile] = React.useState<File | null>(null);
  const [cropPreset, setCropPreset] = React.useState<"desktop" | "mobile">("desktop");
  const [crop, setCrop] = React.useState({ focalX: "0.5", focalY: "0.5", height: "1", width: "1", x: "0", y: "0" });
  const selectedAssetLabel = mediaOptions.find((asset) => asset.id === selectedAssetId)?.label ?? "";
  const selectedProductMedia = card.productMedia.find((item) => item.assetId === selectedAssetId) ?? null;
  const selectedMediaOption = mediaOptions.find((asset) => asset.id === selectedAssetId) ?? null;
  const selectedDocument = card.productDocuments.find((document) => document.id === selectedDocumentId) ?? null;
  const selectedCurrentFileUrl = selectedProductMedia?.fileUrl || selectedMediaOption?.src || "";

  React.useEffect(() => {
    setDraft({
      coverCardAssetId: card.coverCardAssetId,
      heroAssetId: card.heroAssetId,
    });
    setSelectedAssetId(card.heroAssetId || card.coverCardAssetId || "");
    setSelectedDocumentId(card.productDocuments[0]?.id ?? "");
    setAltText(card.productMedia.find((item) => item.assetId === (card.heroAssetId || card.coverCardAssetId))?.altText ?? "");
  }, [card.coverCardAssetId, card.heroAssetId, card.id, card.productDocuments, card.productMedia]);

  async function refreshProductMedia() {
    await onCommand({
      action: "product.media.save",
      payload: {
        coverCardAssetId: draft.coverCardAssetId || null,
        heroAssetId: draft.heroAssetId || null,
        productId: card.id,
      },
    });
  }

  async function save(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await refreshProductMedia();
  }

  async function runMediaJsonCommand(action: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/internal/owner-media-commands", {
      body: JSON.stringify({ action, payload }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { assetId?: string | null; error?: string; ok?: boolean };
    if (!response.ok || result.ok !== true) {
      throw new Error(result.error || "Не удалось сохранить медиа.");
    }
    return result;
  }

  async function runMediaFileCommand(action: string, file: File, payload: Record<string, string>) {
    const form = new FormData();
    form.set("action", action);
    form.set("file", file);
    for (const [key, value] of Object.entries(payload)) {
      if (value) {
        form.set(key, value);
      }
    }

    const response = await fetch("/api/internal/owner-media-commands", {
      body: form,
      credentials: "include",
      method: "POST",
    });
    const result = (await response.json()) as { assetId?: string | null; documentId?: string | null; error?: string; ok?: boolean };
    if (!response.ok || result.ok !== true) {
      throw new Error(result.error || "Не удалось загрузить файл.");
    }
    return result;
  }

  async function uploadAndAttach() {
    if (!uploadFile) {
      return;
    }

    const upload = await runMediaFileCommand("media.upload", uploadFile, {
      altText,
      assetRole: uploadSlot === "gallery-object" ? "Product gallery" : uploadSlot === "card" ? "Product card cover" : "Product hero",
      assetTitle: `${card.label} ${uploadSlot}`,
      assetType: "image",
    });
    const assetId = upload.assetId;
    if (!assetId) {
      throw new Error("Не удалось получить ID загруженного файла.");
    }

    if (uploadSlot === "hero" || uploadSlot === "card") {
      const nextDraft = {
        coverCardAssetId: uploadSlot === "card" ? assetId : draft.coverCardAssetId,
        heroAssetId: uploadSlot === "hero" ? assetId : draft.heroAssetId,
      };
      setDraft(nextDraft);
      setSelectedAssetId(assetId);
      await onCommand({
        action: "product.media.save",
        payload: {
          coverCardAssetId: nextDraft.coverCardAssetId || null,
          heroAssetId: nextDraft.heroAssetId || null,
          productId: card.id,
        },
      });
    } else {
      await runMediaJsonCommand("media.assign", {
        mediaId: assetId,
        productKey: card.productKey || card.id,
        productLabel: card.label,
        slot: "gallery-object",
        surfaceTargets: ["gallery", "pdp"],
        targetType: "product",
      });
      setSelectedAssetId(assetId);
      await refreshProductMedia();
    }
    setUploadFile(null);
  }

  async function replaceSelectedAsset() {
    if (!replaceFile || !selectedAssetId) {
      return;
    }

    await runMediaFileCommand("media.replace", replaceFile, {
      assetId: selectedAssetId,
      changeReason: `Product editor replacement for ${card.label}`,
    });
    await refreshProductMedia();
    setReplaceFile(null);
  }

  async function saveAltAndCrop() {
    if (!selectedAssetId) {
      return;
    }

    await runMediaJsonCommand("media.metadata.save", {
      altText,
      assetId: selectedAssetId,
    });
    await runMediaJsonCommand("media.crop.save", {
      assetId: selectedAssetId,
      crop: {
        focalX: Number(crop.focalX),
        focalY: Number(crop.focalY),
        height: Number(crop.height),
        width: Number(crop.width),
        x: Number(crop.x),
        y: Number(crop.y),
      },
      preset: cropPreset,
    });
    await refreshProductMedia();
  }

  async function uploadDocument() {
    if (!documentFile) {
      return;
    }

    const documentToReplace = selectedDocumentId.trim();
    const result = await runMediaFileCommand(documentToReplace ? "document.replace" : "document.upload", documentFile, {
      documentId: documentToReplace,
      documentTitle: `${card.label} document`,
      documentType: "brochure",
      productKey: card.productKey || card.id,
      productLabel: card.label,
      publicLabel: `${card.label} PDF`,
    });
    if (!result.documentId) {
      throw new Error("Не удалось получить ID документа.");
    }

    if (!documentToReplace) {
      await runMediaJsonCommand("media.assign", {
        documentId: result.documentId,
        productKey: card.productKey || card.id,
        productLabel: card.label,
        slot: "document",
        surfaceTargets: ["pdp-downloads"],
        targetType: "product",
      });
    }

    await refreshProductMedia();
    setDocumentFile(null);
    setSelectedDocumentId("");
  }

  return (
    <div className="montelar-products-editor-form" data-montelar-product-media-editor>
      <section className="montelar-product-current-preview" data-montelar-product-current-preview>
        <div className="montelar-product-current-preview__frame">
          {(selectedProductMedia?.previewUrl || selectedMediaOption?.src) ? (
            <img
              alt={selectedProductMedia?.altText || selectedMediaOption?.alt || selectedProductMedia?.label || selectedMediaOption?.label || card.label}
              src={selectedProductMedia?.previewUrl || selectedMediaOption?.src}
            />
          ) : (
            <span>{selectedAssetId ? "Превью файла недоступно" : "Файл не выбран"}</span>
          )}
        </div>
        <div className="montelar-product-current-preview__body">
          <span>Текущий файл продукта перед заменой</span>
          <strong>{selectedProductMedia?.label || selectedMediaOption?.label || "Файл не выбран"}</strong>
          <p>{selectedProductMedia ? `${selectedProductMedia.slot} · ${statusLabel(selectedProductMedia.status)}${selectedProductMedia.fileName ? ` · ${selectedProductMedia.fileName}` : ""}${selectedProductMedia.fileSizeLabel ? ` · ${selectedProductMedia.fileSizeLabel}` : ""}` : selectedMediaOption ? `Выбранный файл · ${statusLabel(selectedMediaOption.status)}` : "Выберите hero, обложку или файл галереи."}</p>
          <p>{selectedProductMedia?.altText ? "Alt заполнен" : selectedAssetId ? "Alt не заполнен" : "Нет файла для alt/crop"}</p>
          <p>Crop: экран и телефон сохраняются ниже</p>
          {selectedCurrentFileUrl ? (
            <a href={selectedCurrentFileUrl} rel="noreferrer" target="_blank">Открыть текущий файл</a>
          ) : null}
          {uploadFile ? <em>Новый файл готов к загрузке: {uploadFile.name}</em> : null}
          {replaceFile ? <em>Файл замены выбран: {replaceFile.name}</em> : null}
        </div>
      </section>
      <div className="montelar-products-media-picker">
        {mediaOptions.slice(0, 6).map((asset) => (
          <button
            className={draft.heroAssetId === asset.id ? "montelar-products-media-option is-active" : "montelar-products-media-option"}
            key={asset.id}
            onClick={() => setDraft((current) => ({ ...current, heroAssetId: asset.id }))}
            type="button"
          >
            {asset.src ? <img alt={asset.alt} src={asset.src} /> : <span>{asset.label.slice(0, 1)}</span>}
            <strong>{asset.label}</strong>
          </button>
        ))}
      </div>
      <form onSubmit={save}>
        <div className="montelar-products-editor-form__grid">
          <label>
            <span>Hero фото</span>
            <select
              data-montelar-products-hero
              onChange={(event) => {
                setDraft((current) => ({ ...current, heroAssetId: event.target.value }));
                setSelectedAssetId(event.target.value || selectedAssetId);
                setAltText(card.productMedia.find((item) => item.assetId === event.target.value)?.altText ?? "");
              }}
              value={draft.heroAssetId}
            >
              <option value="">Не выбрано</option>
              {mediaOptions.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label} ({asset.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Фото карточки</span>
            <select
              data-montelar-products-cover
              onChange={(event) => {
                setDraft((current) => ({ ...current, coverCardAssetId: event.target.value }));
                setSelectedAssetId(event.target.value || selectedAssetId);
                setAltText(card.productMedia.find((item) => item.assetId === event.target.value)?.altText ?? "");
              }}
              value={draft.coverCardAssetId}
            >
              <option value="">Не выбрано</option>
              {mediaOptions.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label} ({asset.status})
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="montelar-products-action is-primary" data-montelar-products-save-media disabled={isSaving || mediaOptions.length === 0} type="submit">
          {isSaving ? "Сохраняю..." : "Сохранить hero и обложку"}
        </button>
      </form>

      <section className="montelar-products-media-owned">
        <div className="montelar-products-detail__section-head">
          <strong>Загрузить или добавить фото</strong>
          <span>остаемся в карточке продукта</span>
        </div>
        <div className="montelar-products-editor-form__grid">
          <label>
            <span>Куда поставить</span>
            <select data-montelar-products-upload-slot onChange={(event) => setUploadSlot(event.target.value as "hero" | "card" | "gallery-object")} value={uploadSlot}>
              <option value="hero">Hero продукта</option>
              <option value="card">Фото карточки</option>
              <option value="gallery-object">Галерея PDP</option>
            </select>
          </label>
          <label>
            <span>Файл изображения</span>
            <input data-montelar-products-upload-file onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} type="file" />
          </label>
          <label className="montelar-products-editor-form__full">
            <span>Alt-текст</span>
            <input data-montelar-products-alt onChange={(event) => setAltText(event.target.value)} value={altText} />
          </label>
        </div>
        <button className="montelar-products-action" data-montelar-products-upload-attach disabled={isSaving || !uploadFile} onClick={() => void uploadAndAttach()} type="button">
          Загрузить и поставить в продукт
        </button>
      </section>

      <section className="montelar-products-media-owned">
        <div className="montelar-products-detail__section-head">
          <strong>Заменить файл, alt и crop</strong>
          <span>{selectedAssetLabel ? `выбран: ${selectedAssetLabel}` : "выберите файл"}</span>
        </div>
        <div className="montelar-products-editor-form__grid">
          <label>
            <span>Выбранный файл</span>
            <select data-montelar-products-selected-asset onChange={(event) => {
              setSelectedAssetId(event.target.value);
              setAltText(card.productMedia.find((item) => item.assetId === event.target.value)?.altText ?? "");
            }} value={selectedAssetId}>
              <option value="">Не выбрано</option>
              {mediaOptions.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label} ({asset.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Файл для замены</span>
            <input data-montelar-products-replace-file onChange={(event) => setReplaceFile(event.target.files?.[0] ?? null)} type="file" />
          </label>
          <label>
            <span>Crop</span>
            <select data-montelar-products-crop-preset onChange={(event) => setCropPreset(event.target.value as "desktop" | "mobile")} value={cropPreset}>
              <option value="desktop">Экран</option>
              <option value="mobile">Телефон</option>
            </select>
          </label>
          {(["x", "y", "width", "height", "focalX", "focalY"] as const).map((field) => (
            <label key={field}>
              <span>{field}</span>
              <input
                data-montelar-products-crop-field={field}
                max="1"
                min="0"
                onChange={(event) => setCrop((current) => ({ ...current, [field]: event.target.value }))}
                step="0.01"
                type="number"
                value={crop[field]}
              />
            </label>
          ))}
        </div>
        <div className="montelar-products-row__actions">
          <button className="montelar-products-action" data-montelar-products-replace-asset disabled={isSaving || !replaceFile || !selectedAssetId} onClick={() => void replaceSelectedAsset()} type="button">
            Заменить выбранный файл
          </button>
          <button className="montelar-products-action" data-montelar-products-save-alt-crop disabled={isSaving || !selectedAssetId} onClick={() => void saveAltAndCrop()} type="button">
            Сохранить alt и crop
          </button>
        </div>
      </section>

      <section className="montelar-products-media-owned">
        <div className="montelar-products-detail__section-head">
          <strong>PDF и документы продукта</strong>
          <span>привязка без медиараздела</span>
        </div>
        <div className="montelar-product-document-preview" data-montelar-product-document-preview>
          <span>Текущий PDF/документ</span>
          <strong>{selectedDocument?.label ?? "Файл не выбран"}</strong>
          <p>{selectedDocument ? `${selectedDocument.type} · ${statusLabel(selectedDocument.status)}${selectedDocument.fileName ? ` · ${selectedDocument.fileName}` : ""}${selectedDocument.fileSizeLabel ? ` · ${selectedDocument.fileSizeLabel}` : ""}` : "Добавьте документ в карточку продукта."}</p>
          {selectedDocument?.fileUrl ? (
            <a href={selectedDocument.fileUrl} rel="noreferrer" target="_blank">Открыть текущий документ</a>
          ) : null}
          {documentFile ? <em>Новый документ выбран: {documentFile.name}</em> : null}
        </div>
        <div className="montelar-products-editor-form__grid">
          <label>
            <span>Текущий PDF</span>
            <select data-montelar-products-document-select onChange={(event) => setSelectedDocumentId(event.target.value)} value={selectedDocumentId}>
              <option value="">Загрузить как новый PDF</option>
              {card.productDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.label} ({statusLabel(document.status)})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>PDF / файл документа</span>
            <input data-montelar-products-document-file onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} type="file" />
          </label>
        </div>
        <div className="montelar-products-row__actions">
          <button className="montelar-products-action" data-montelar-products-upload-document disabled={isSaving || !documentFile} onClick={() => void uploadDocument()} type="button">
            {selectedDocumentId ? "Заменить выбранный PDF" : "Загрузить PDF здесь"}
          </button>
        </div>
      </section>

      <section className="montelar-products-media-owned">
        <div className="montelar-products-detail__section-head">
          <strong>Сейчас в продукте</strong>
          <span>{card.productMedia.length} медиа · {card.productDocuments.length} документов</span>
        </div>
        <div className="montelar-products-owned-list">
          {card.productMedia.map((item) => (
            <a href={item.href} key={item.id}>
              <strong>{item.slot}</strong>
              <span>{item.label} · {statusLabel(item.status)}</span>
            </a>
          ))}
          {card.productDocuments.map((item) => (
            <a href={item.href} key={item.id}>
              <strong>{item.type}</strong>
              <span>{item.label} · {statusLabel(item.status)}</span>
            </a>
          ))}
        </div>
      </section>
      {mediaOptions.length === 0 ? <p className="montelar-products-detail__ready">В медиабиблиотеке пока нет доступных файлов.</p> : null}
    </div>
  );
}

function ProductFormTab({
  card,
  isSaving,
  onCommand,
}: {
  card: OwnerProductCard;
  isSaving: boolean;
  onCommand: (input: { action: string; payload: Record<string, unknown> }) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState({
    status: card.formStatus || "draft",
    title: card.formTitle || `${card.label} inquiry`,
  });

  React.useEffect(() => {
    setDraft({
      status: card.formStatus || "draft",
      title: card.formTitle || `${card.label} inquiry`,
    });
  }, [card.formStatus, card.formTitle, card.id, card.label]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCommand({
      action: "product.form.save",
      payload: {
        formId: card.formId || undefined,
        productId: card.id,
        status: draft.status,
        title: draft.title,
      },
    });
  }

  return (
    <form className="montelar-products-editor-form" onSubmit={save}>
      <div className="montelar-products-editor-form__grid">
        <label>
          <span>Название формы</span>
          <input
            data-montelar-products-form-title
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            required
            value={draft.title}
          />
        </label>
        <label>
          <span>Статус формы</span>
          <select
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
            value={draft.status}
          >
            <option value="draft">Черновик</option>
            <option value="review">На проверке</option>
          </select>
        </label>
      </div>
      <button className="montelar-products-action is-primary" data-montelar-products-save-form disabled={isSaving} type="submit">
        {isSaving ? "Сохраняю..." : card.hasForm ? "Сохранить форму" : "Создать форму заявки"}
      </button>
    </form>
  );
}

function ProductSeoTab({
  card,
  isSaving,
  onCommand,
}: {
  card: OwnerProductCard;
  isSaving: boolean;
  onCommand: (input: { action: string; payload: Record<string, unknown> }) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState({
    metaDescription: card.seoDescription || card.description,
    metaTitle: card.seoTitle || card.label,
  });

  React.useEffect(() => {
    setDraft({
      metaDescription: card.seoDescription || card.description,
      metaTitle: card.seoTitle || card.label,
    });
  }, [card.description, card.id, card.label, card.seoDescription, card.seoTitle]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCommand({
      action: "product.seo.save",
      payload: {
        metaDescription: draft.metaDescription,
        metaTitle: draft.metaTitle,
        productId: card.id,
      },
    });
  }

  return (
    <form className="montelar-products-editor-form" onSubmit={save}>
      <label>
        <span>SEO title</span>
        <input
          data-montelar-products-seo-title
          onChange={(event) => setDraft((current) => ({ ...current, metaTitle: event.target.value }))}
          required
          value={draft.metaTitle}
        />
      </label>
      <label>
        <span>SEO description</span>
        <textarea
          data-montelar-products-seo-description
          onChange={(event) => setDraft((current) => ({ ...current, metaDescription: event.target.value }))}
          required
          value={draft.metaDescription}
        />
      </label>
      <button className="montelar-products-action is-primary" data-montelar-products-save-seo disabled={isSaving} type="submit">
        {isSaving ? "Сохраняю..." : "Сохранить SEO"}
      </button>
    </form>
  );
}

function ProductPublishTab({
  card,
  isSaving,
  onCommand,
}: {
  card: OwnerProductCard;
  isSaving: boolean;
  onCommand: (input: { action: string; payload: Record<string, unknown> }) => Promise<void>;
}) {
  return (
    <div className="montelar-products-editor-form">
      <div className="montelar-products-publish-row">
        <a className="montelar-products-action" href={card.publicHref} rel="noreferrer" target="_blank">
          Открыть предпросмотр
        </a>
        <button
          className="montelar-products-action is-primary"
          data-montelar-products-ready-review
          disabled={isSaving}
          onClick={() =>
            onCommand({
              action: "product.visibility.set",
              payload: {
                productId: card.id,
                status: "review",
                visible: true,
              },
            })
          }
          type="button"
        >
          Подготовить к выпуску
        </button>
        <button
          className="montelar-products-action"
          disabled={isSaving}
          onClick={() =>
            onCommand({
              action: "product.visibility.set",
              payload: {
                productId: card.id,
                visible: false,
              },
            })
          }
          type="button"
        >
          Скрыть из каталога
        </button>
      </div>
      <p className="montelar-products-detail__ready">
        Выпуск остается управляемым: если форма или SEO не готовы, инспектор справа покажет конкретную задачу.
      </p>
    </div>
  );
}

function ProductCategoryTree({
  cards,
  hierarchy,
  onCategorySelect,
  selectedCategoryLabel,
}: {
  cards: OwnerProductCard[];
  hierarchy: OwnerProductHierarchy;
  onCategorySelect: (label: string) => void;
  selectedCategoryLabel: string;
}) {
  return (
    <section className="montelar-products-tree" data-montelar-products-category-tree>
      <div className="montelar-products-table__head">
        <strong>Дерево каталога</strong>
        <span>{hierarchy.categories.length} категорий</span>
      </div>
      <div className="montelar-products-tree__list">
        {hierarchy.directions.map((direction) => {
          const directionCategories = hierarchy.categories.filter((category) => category.directionId === direction.id);
          const directionCount = cards.filter((card) => card.directionId === direction.id).length;

          return (
            <div className="montelar-products-tree__branch" key={direction.id}>
              <button
                className={selectedCategoryLabel === "all" ? "montelar-products-tree__direction" : "montelar-products-tree__direction"}
                onClick={() => onCategorySelect("all")}
                type="button"
              >
                <strong>{direction.label}</strong>
                <span>{directionCount}</span>
              </button>
              {directionCategories.map((category) => {
                const productCount = cards.filter((card) => card.categoryId === category.id).length;

                return (
                  <button
                    className={selectedCategoryLabel === category.label ? "montelar-products-tree__item is-active" : "montelar-products-tree__item"}
                    key={category.id}
                    onClick={() => onCategorySelect(category.label)}
                    type="button"
                  >
                    <span>{category.label}</span>
                    <small>{productCount}</small>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProductBulkPanel({
  hierarchy,
  isSaving,
  onApplyCategory,
  onApplyStatus,
  selectedCount,
}: {
  hierarchy: OwnerProductHierarchy;
  isSaving: boolean;
  onApplyCategory: (categoryId: string) => Promise<void>;
  onApplyStatus: (status: string, visible: boolean) => Promise<void>;
  selectedCount: number;
}) {
  const [categoryId, setCategoryId] = React.useState("");
  const [status, setStatus] = React.useState("review");

  return (
    <section className="montelar-products-bulk" data-montelar-products-bulk>
      <div>
        <strong>Пакетные действия</strong>
        <span>{selectedCount > 0 ? `Выбрано: ${selectedCount}` : "Выберите продукты в строках списка"}</span>
      </div>
      <label>
        <span>Категория</span>
        <select onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
          <option value="">Выберите категорию</option>
          {hierarchy.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <button
        className="montelar-products-action"
        disabled={isSaving || selectedCount === 0 || !categoryId}
        onClick={() => onApplyCategory(categoryId)}
        type="button"
      >
        Назначить категорию
      </button>
      <label>
        <span>Статус</span>
        <select onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="review">На проверку</option>
          <option value="published">Опубликовать</option>
          <option value="draft">Скрыть</option>
        </select>
      </label>
      <button
        className="montelar-products-action"
        disabled={isSaving || selectedCount === 0}
        onClick={() => onApplyStatus(status, status !== "draft")}
        type="button"
      >
        Применить статус
      </button>
    </section>
  );
}

function ProductDetailPanel({
  activeTab,
  card,
  commandError,
  hierarchy,
  isSaving,
  mediaOptions,
  onCommand,
  onTabChange,
}: {
  activeTab: ProductEditorTab;
  card: OwnerProductCard | null;
  commandError: string;
  hierarchy: OwnerProductHierarchy;
  isSaving: boolean;
  mediaOptions: OwnerProductsSnapshot["mediaOptions"];
  onCommand: (input: { action: string; payload: Record<string, unknown> }) => Promise<void>;
  onTabChange: (tab: ProductEditorTab) => void;
}) {
  if (!card) {
    return (
      <aside className="montelar-products-detail montelar-products-detail--empty">
        <span>Продукт</span>
        <strong>Выберите позицию из списка</strong>
        <p>Справа появятся состояние карточки, ближайшее действие и быстрые переходы в связанные рабочие зоны.</p>
      </aside>
    );
  }

  return (
    <section className="montelar-products-detail" data-montelar-products-editor>
      <div className="montelar-products-detail__hero">
        <div className="montelar-products-detail__media">
          {card.previewMedia ? (
            <img alt={card.previewMedia.alt} src={card.previewMedia.src} />
          ) : (
            <span>{card.label.slice(0, 1)}</span>
          )}
        </div>

        <div className="montelar-products-detail__copy">
          <span>
            {card.locale} · {card.directionLabel}
          </span>
          <h2>{card.label}</h2>
          <p>{card.description}</p>
        </div>
      </div>

      <dl className="montelar-products-detail__facts">
        <div>
          <dt>Категория</dt>
          <dd>{card.categoryLabel}</dd>
        </div>
        <div>
          <dt>Статус</dt>
          <dd>{statusLabel(card.status)}</dd>
        </div>
        <div>
          <dt>Стадия</dt>
          <dd>{launchStageLabel(card.launchStage)}</dd>
        </div>
        <div>
          <dt>Наличие</dt>
          <dd>{availabilityModeLabel(card.availabilityMode)}</dd>
        </div>
      </dl>

      <section className="montelar-products-detail__section">
        <div className="montelar-products-detail__section-head">
          <strong>Редактор продукта</strong>
          <span>{statusLabel(card.status)}</span>
        </div>
        <div className="montelar-products-tabs" role="tablist" aria-label="Разделы карточки продукта">
          {productEditorTabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "montelar-products-tab is-active" : "montelar-products-tab"}
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="montelar-products-tab-panel" role="tabpanel">
          {activeTab === "content" ? <ProductContentTab card={card} isSaving={isSaving} onCommand={onCommand} /> : null}
          {activeTab === "media" ? (
            <ProductMediaTab card={card} isSaving={isSaving} mediaOptions={mediaOptions} onCommand={onCommand} />
          ) : null}
          {activeTab === "specs" ? (
            <div className="montelar-products-editor-form">
              <div className="montelar-products-detail__facts">
                <div>
                  <dt>Наличие</dt>
                  <dd>{availabilityModeLabel(card.availabilityMode)}</dd>
                </div>
                <div>
                  <dt>Семейство</dt>
                  <dd>{card.lineLabel || "Не выбрано"}</dd>
                </div>
              </div>
              <p className="montelar-products-detail__ready">
                Подробные спецификации остаются в карточке продукта, но owner flow не уводит в служебные разделы для базовой готовности.
              </p>
            </div>
          ) : null}
          {activeTab === "category" ? (
            <ProductCategoryTab card={card} hierarchy={hierarchy} isSaving={isSaving} onCommand={onCommand} />
          ) : null}
          {activeTab === "form" ? <ProductFormTab card={card} isSaving={isSaving} onCommand={onCommand} /> : null}
          {activeTab === "seo" ? <ProductSeoTab card={card} isSaving={isSaving} onCommand={onCommand} /> : null}
          {activeTab === "translations" ? (
            <div className="montelar-products-editor-form">
              <p className="montelar-products-detail__ready">
                Переводы этого продукта привязаны к выбранной карточке. Глобальная очередь остается списком задач и должна возвращать сюда.
              </p>
            </div>
          ) : null}
          {activeTab === "history" ? (
            <div className="montelar-products-editor-form">
              <p className="montelar-products-detail__ready">
                История изменений пишется через audit events при сохранении продукта, формы, SEO, медиа и статуса.
              </p>
            </div>
          ) : null}
          {activeTab === "publish" ? <ProductPublishTab card={card} isSaving={isSaving} onCommand={onCommand} /> : null}
          {commandError ? <p className="montelar-products-detail__ready">{commandError}</p> : null}
        </div>
      </section>
    </section>
  );
}

export function MontelarProductsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = React.useState<OwnerProductsSnapshot>(emptySnapshot);
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const [activeEditorTab, setActiveEditorTab] = React.useState<ProductEditorTab>(
    normalizeProductTab(searchParams.get("panel") ?? searchParams.get("focus")),
  );
  const [bulkProductIds, setBulkProductIds] = React.useState<Set<string>>(() => new Set());
  const [searchValue, setSearchValue] = React.useState("");
  const [directionFilter, setDirectionFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [issueFilter, setIssueFilter] = React.useState("all");
  const [createDraft, setCreateDraft] = React.useState({
    categoryId: "",
    directionId: "",
    name: "",
    shortDescription: "",
  });
  const [isError, setIsError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [isSavingProduct, setIsSavingProduct] = React.useState(false);
  const [commandError, setCommandError] = React.useState("");
  const createMode = searchParams.get("mode") === "create";
  const requestedProductId = searchParams.get("product") ?? searchParams.get("selected") ?? "";
  const requestedProductKey = searchParams.get("productKey") ?? "";

  React.useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await fetch("/api/internal/owner-products", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-store",
          },
        });
        const payload = (await response.json()) as OwnerProductsSnapshot;

        if (!response.ok) {
          throw new Error("Unable to load owner products.");
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

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    setActiveEditorTab(normalizeProductTab(searchParams.get("panel") ?? searchParams.get("focus")));
  }, [searchParams]);

  const directionOptions = [
    "all",
    ...new Set(snapshot.cards.map((card) => card.directionLabel).filter(Boolean)),
  ];
  const categoryOptions = [
    "all",
    ...new Set(snapshot.cards.map((card) => card.categoryLabel).filter(Boolean)),
  ];

  const filteredCards = snapshot.cards.filter((card) => {
    if (directionFilter !== "all" && card.directionLabel !== directionFilter) {
      return false;
    }

    if (categoryFilter !== "all" && card.categoryLabel !== categoryFilter) {
      return false;
    }

    if (statusFilter !== "all" && card.status !== statusFilter) {
      return false;
    }

    if (issueFilter === "ready" && card.issueLabels.length > 0) {
      return false;
    }

    if (issueFilter === "attention" && card.issueLabels.length === 0) {
      return false;
    }

    if (!searchValue.trim()) {
      return true;
    }

    return createSearchText(card).includes(searchValue.trim().toLowerCase());
  });

  React.useEffect(() => {
    if (requestedProductKey) {
      const cardByKey = snapshot.cards.find((card) => card.productKey === requestedProductKey || card.productKey.toLowerCase() === requestedProductKey.toLowerCase());
      if (cardByKey) {
        setSelectedProductId(cardByKey.id);
        return;
      }
    }

    if (requestedProductId && snapshot.cards.some((card) => card.id === requestedProductId)) {
      setSelectedProductId(requestedProductId);
      return;
    }

    if (filteredCards.length === 0) {
      if (selectedProductId) {
        setSelectedProductId("");
      }
      return;
    }

    if (!filteredCards.some((card) => card.id === selectedProductId)) {
      setSelectedProductId(filteredCards[0]?.id ?? "");
    }
  }, [filteredCards, requestedProductId, requestedProductKey, selectedProductId, snapshot.cards]);

  const selectedCard =
    snapshot.cards.find((card) => card.id === selectedProductId) ??
    filteredCards[0] ??
    null;

  function selectProduct(productId: string, tab: ProductEditorTab = activeEditorTab) {
    setSelectedProductId(productId);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("mode");
    next.set("product", productId);
    next.set("panel", tab);
    router.push(`/admin/products?${next.toString()}`);
  }

  function selectEditorTab(tab: ProductEditorTab) {
    setActiveEditorTab(tab);

    if (!selectedCard) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("mode");
    next.set("product", selectedCard.id);
    next.set("panel", tab);
    router.push(`/admin/products?${next.toString()}`);
  }

  function toggleBulkProduct(productId: string) {
    setBulkProductIds((current) => {
      const next = new Set(current);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  }

  function openCreateFlow() {
    const next = new URLSearchParams(searchParams.toString());
    next.set("mode", "create");
    router.push(`/admin/products?${next.toString()}`);
  }

  function closeCreateFlow() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("mode");
    const query = next.toString();
    router.push(query ? `/admin/products?${query}` : "/admin/products");
  }

  async function runProductCommand(input: { action: string; payload: Record<string, unknown> }) {
    setCommandError("");

    try {
      const response = await fetch(snapshot.commandEndpoint, {
        body: JSON.stringify(input),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as ProductCommandResult;

      if (!response.ok || !result.products) {
        throw new Error(result.error || "Не удалось выполнить действие.");
      }

      setSnapshot(result.products);
      setSelectedProductId(result.selectedProductId ?? "");
      return result;
    } catch (error) {
      setCommandError(error instanceof Error ? error.message : "Не удалось выполнить действие.");
      throw error;
    }
  }

  async function createProductDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingDraft(true);

    try {
      await runProductCommand({
        action: "product.create",
        payload: {
          categoryId: createDraft.categoryId || undefined,
          directionId: createDraft.directionId,
          name: createDraft.name,
          publicLabel: createDraft.name,
          shortDescription: createDraft.shortDescription,
        },
      });
      setCreateDraft({
        categoryId: "",
        directionId: "",
        name: "",
        shortDescription: "",
      });
      closeCreateFlow();
    } catch {
      // Error text is already surfaced by runProductCommand.
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function applyProductCommand(input: { action: string; payload: Record<string, unknown> }) {
    setIsSavingProduct(true);

    try {
      await runProductCommand(input);
    } catch {
      // Error text is already surfaced by runProductCommand.
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function applyBulkCategory(categoryId: string) {
    const category = snapshot.hierarchy.categories.find((entry) => entry.id === categoryId);

    if (!category) {
      return;
    }

    setIsSavingProduct(true);

    try {
      for (const productId of bulkProductIds) {
        await runProductCommand({
          action: "product.category.assign",
          payload: {
            categoryId,
            directionId: category.directionId,
            productId,
          },
        });
      }
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function applyBulkStatus(status: string, visible: boolean) {
    setIsSavingProduct(true);

    try {
      for (const productId of bulkProductIds) {
        await runProductCommand({
          action: "product.visibility.set",
          payload: {
            productId,
            status,
            visible,
          },
        });
      }
    } finally {
      setIsSavingProduct(false);
    }
  }

  return (
    <section className="montelar-products-workspace">
      <header className="montelar-owner-simple-page__hero">
        <span>Продукты</span>
        <h1>Каталог, карточки и готовность к публикации</h1>
        <p>
          Первый слой работает как понятный каталог: слева список с фильтрами,
          справа выбранная карточка и ближайшие действия без перехода в служебные разделы.
        </p>
      </header>

      <div className="montelar-products-summary">
        <div className="montelar-products-stats">
          <div>
            <span>Всего продуктов</span>
            <strong>{isLoading ? "..." : snapshot.totals.total}</strong>
          </div>
          <div>
            <span>Опубликовано</span>
            <strong>{isLoading ? "..." : snapshot.totals.published}</strong>
          </div>
          <div>
            <span>Без фото</span>
            <strong>{isLoading ? "..." : snapshot.totals.missingHero}</strong>
          </div>
          <div>
            <span>Без формы</span>
            <strong>{isLoading ? "..." : snapshot.totals.missingForm}</strong>
          </div>
        </div>

        <div className="montelar-products-toolbar">
          <label className="montelar-products-search">
            <span>Поиск</span>
            <input
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Название, направление, категория"
              type="search"
              value={searchValue}
            />
          </label>

          <div className="montelar-products-toolbar__actions">
            <button className="montelar-products-action" onClick={openCreateFlow} type="button">
              Новый продукт
            </button>
            <Link className="montelar-products-action" href="/admin/site-admin">
              Формы заявок
            </Link>
            <Link className="montelar-products-action" href="/admin/checks">
              Проверки выпуска
            </Link>
          </div>
        </div>
      </div>

      <div className="montelar-products-filterbar">
        <div className="montelar-products-filtergroup" role="tablist" aria-label="Фильтр по направлению">
          {directionOptions.map((option) => (
            <button
              className={directionFilter === option ? "montelar-products-filter is-active" : "montelar-products-filter"}
              key={option}
              onClick={() => setDirectionFilter(option)}
              type="button"
            >
              {option === "all" ? "Все направления" : option}
            </button>
          ))}
        </div>

        <div className="montelar-products-filterbar__selects">
          <label>
            <span>Категория</span>
            <select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Все категории" : option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Статус</span>
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="review">На проверке</option>
              <option value="published">Опубликован</option>
              <option value="hidden">Скрыт</option>
              <option value="archived">Архив</option>
            </select>
          </label>

          <label>
            <span>Готовность</span>
            <select onChange={(event) => setIssueFilter(event.target.value)} value={issueFilter}>
              <option value="all">Все позиции</option>
              <option value="attention">Требуют действия</option>
              <option value="ready">Готовы</option>
            </select>
          </label>
        </div>
      </div>

      <ProductBulkPanel
        hierarchy={snapshot.hierarchy}
        isSaving={isSavingProduct}
        onApplyCategory={applyBulkCategory}
        onApplyStatus={applyBulkStatus}
        selectedCount={bulkProductIds.size}
      />

      {isError ? <div className="montelar-products-notice">Не удалось загрузить каталог. Попробуйте обновить страницу.</div> : null}

      {createMode ? (
        <section className="montelar-products-detail">
          <div className="montelar-products-detail__hero">
            <div className="montelar-products-detail__copy">
              <span>Новый продукт</span>
              <h2>Создание без поиска по служебным разделам</h2>
              <p>
                Сначала зафиксируйте направление, категорию и имя, затем откройте полную карточку,
                чтобы заполнить фото, форму заявки и публикацию.
              </p>
            </div>
          </div>

          <section className="montelar-products-detail__section">
            <div className="montelar-products-detail__section-head">
              <strong>Черновик продукта</strong>
              <span>Создание по шагам</span>
            </div>
            <ol className="montelar-products-create-steps" data-montelar-products-create-wizard>
              <li>1. Семейство каталога</li>
              <li>2. Название и роль</li>
              <li>3. Открыть карточку и закрыть фото, форму, SEO</li>
            </ol>
            <form className="montelar-products-detail__actions" onSubmit={createProductDraft}>
              <label>
                <span>Направление</span>
                <select
                  onChange={(event) => setCreateDraft((current) => ({ ...current, directionId: event.target.value }))}
                  required
                  value={createDraft.directionId}
                >
                  <option value="">Выберите направление</option>
                  {snapshot.hierarchy.directions.map((direction) => (
                    <option key={direction.id} value={direction.id}>
                      {direction.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Категория</span>
                <select
                  onChange={(event) => setCreateDraft((current) => ({ ...current, categoryId: event.target.value }))}
                  value={createDraft.categoryId}
                >
                  <option value="">Назначить позже</option>
                  {snapshot.hierarchy.categories
                    .filter((category) => !createDraft.directionId || category.directionId === createDraft.directionId)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>Название</span>
                <input
                  onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Montelar product name"
                  required
                  value={createDraft.name}
                />
              </label>
              <label>
                <span>Короткое описание</span>
                <textarea
                  onChange={(event) => setCreateDraft((current) => ({ ...current, shortDescription: event.target.value }))}
                  placeholder="Что это за продукт и для какого сценария"
                  required
                  value={createDraft.shortDescription}
                />
              </label>
              {commandError ? <p className="montelar-products-detail__ready">{commandError}</p> : null}
              <button className="montelar-products-action is-primary" disabled={isSavingDraft} type="submit">
                {isSavingDraft ? "Создаю..." : "Создать черновик"}
              </button>
              <button className="montelar-products-action" onClick={closeCreateFlow} type="button">
                Вернуться к каталогу
              </button>
            </form>
          </section>
        </section>
      ) : null}

      <div className="montelar-products-layout">
        <section className="montelar-products-table">
          <ProductCategoryTree
            cards={snapshot.cards}
            hierarchy={snapshot.hierarchy}
            onCategorySelect={setCategoryFilter}
            selectedCategoryLabel={categoryFilter}
          />

          <div className="montelar-products-table__toolbar">
            <div className="montelar-products-table__head">
              <strong>Список продуктов</strong>
              <span>
                {isLoading
                  ? "Загрузка каталога"
                  : `Показано ${filteredCards.length} из ${snapshot.cards.length}`}
              </span>
            </div>
            <p>
              В каждой строке сразу видно фото, форму заявки, статус и следующее действие.
            </p>
          </div>

          {isLoading ? (
            <div className="montelar-products-empty">
              <strong>Загружаю каталог</strong>
              <p>Загружаю карточки продуктов, чтобы показать рабочий список без пустого экрана.</p>
            </div>
          ) : null}

          {!isLoading && filteredCards.length === 0 ? (
            <div className="montelar-products-empty">
              <strong>
                {snapshot.cards.length === 0 ? "Каталог действительно пуст" : "По текущим фильтрам ничего не найдено"}
              </strong>
              <p>
                {snapshot.cards.length === 0
                  ? "Когда появятся продукты, здесь откроется рабочий список с фото, формами и действиями."
                  : "Сбросьте фильтры или поиск, чтобы вернуться ко всем позициям каталога."}
              </p>
              {snapshot.cards.length > 0 ? (
                <button
                  className="montelar-products-action is-primary"
                  onClick={() => {
                    setSearchValue("");
                    setDirectionFilter("all");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setIssueFilter("all");
                  }}
                  type="button"
                >
                  Сбросить фильтры
                </button>
              ) : null}
            </div>
          ) : null}

          {filteredCards.map((card) => (
            <ProductListRow
              card={card}
              isBulkSelected={bulkProductIds.has(card.id)}
              isSelected={card.id === selectedCard?.id}
              key={card.id}
              onBulkToggle={() => toggleBulkProduct(card.id)}
              onSelect={() => selectProduct(card.id)}
            />
          ))}
        </section>

        <ProductDetailPanel
          activeTab={activeEditorTab}
          card={selectedCard}
          commandError={commandError}
          hierarchy={snapshot.hierarchy}
          isSaving={isSavingProduct}
          mediaOptions={snapshot.mediaOptions}
          onCommand={applyProductCommand}
          onTabChange={selectEditorTab}
        />
      </div>
    </section>
  );
}
