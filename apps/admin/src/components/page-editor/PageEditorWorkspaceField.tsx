import React from "react";

import {
  canPublishPage,
  getPageEditorSnapshot,
  getPagePreviewUrl,
  getPageWorkspaceRoleLabel,
} from "../../lib/payload/page-editor.ts";
import { getAdminUser } from "../../lib/payload/access.ts";

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRelationLabel(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as { altText?: unknown; assetTitle?: unknown; title?: unknown };
  return getText(record.assetTitle) || getText(record.title) || getText(record.altText);
}

function getSurface(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : "overview";
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

function getChecklistReadyCount(
  checklist: Array<{
    state: string;
  }>,
) {
  return checklist.filter((item) => item.state === "ready").length;
}

function getFieldValue(value: string, fallback: string) {
  return value.length > 0 ? value : fallback;
}

export async function PageEditorWorkspaceField({
  data,
  field,
  req,
  payload,
}: {
  data: Record<string, unknown>;
  field: { admin?: { custom?: { surface?: string } } };
  payload: Parameters<typeof getPageEditorSnapshot>[0];
  req: Parameters<typeof getPagePreviewUrl>[1];
}) {
  const surface = getSurface(field.admin?.custom?.surface);
  const snapshot = await getPageEditorSnapshot(payload, data);
  const role = getAdminUser(req.user)?.role ?? null;
  const status = getText(data.status) || "draft";
  const previewUrl = await getPagePreviewUrl(data, req);
  const publishAllowed = await canPublishPage(req.user, req);
  const readyCount = getChecklistReadyCount(snapshot.checklist);
  const blockerHref = snapshot.blockers[0]?.href || snapshot.linkedWorkspaces[2]?.href || snapshot.listViews[0]?.href || "#";
  const eyebrow = getText(data.eyebrow);
  const heroSummary = getText(data.heroSummary);
  const introBody = getText(data.introBody);
  const primaryCtaLabel = getText(data.heroPrimaryCtaLabel);
  const primaryCtaTarget = getText(data.heroPrimaryCtaTarget);
  const secondaryCtaLabel = getText(data.heroSecondaryCtaLabel);
  const secondaryCtaTarget = getText(data.heroSecondaryCtaTarget);
  const heroMediaLabel = getRelationLabel(data.heroMedia);
  const coverMediaLabel = getRelationLabel(data.coverMedia);
  const visibleSections = snapshot.sectionSummaries.filter((section) => section.visible);

  if (surface === "sections") {
    return (
      <section className="montelar-page-editor-card">
        <div className="montelar-page-editor-card__eyebrow">Блоки страницы</div>
        <p className="montelar-page-editor-card__note">
          Здесь управляется порядок блоков и их видимость на публичной странице. Каждый блок хранится
          в отдельной библиотеке, поэтому менеджер не редактирует HTML или код в записи страницы.
        </p>
        <div className="montelar-page-editor-card__metrics">
          <article>
            <strong>{snapshot.sectionCount}</strong>
            <span>подключено блоков</span>
          </article>
          <article>
            <strong>{snapshot.visibleSectionCount}</strong>
            <span>видно на странице</span>
          </article>
        </div>
        {snapshot.sectionSummaries.length > 0 ? (
          <div className="montelar-page-editor-sections">
            {snapshot.sectionSummaries.map((section) => (
              <a href={section.href} key={section.id}>
                <div>
                  <strong>
                    {section.order}. {section.label}
                  </strong>
                  <span>
                    {section.type} · {section.visible ? "показан на странице" : "скрыт"} · {section.status}
                  </span>
                </div>
                <b>
                  {section.mediaCount} media / {section.documentCount} docs
                </b>
              </a>
            ))}
          </div>
        ) : (
          <p className="montelar-page-editor-card__note">
            Сохраните страницу или привяжите блоки, чтобы открыть библиотеку и управлять порядком показа.
          </p>
        )}
        <div className="montelar-page-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "sections")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.description}</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "relations") {
    return (
      <section className="montelar-page-editor-card">
        <div className="montelar-page-editor-card__eyebrow">Связанные рабочие поверхности</div>
        <div className="montelar-page-editor-card__metrics">
          <article>
            <strong>{snapshot.linkedMediaCount}</strong>
            <span>медиа-привязок</span>
          </article>
          <article>
            <strong>{snapshot.documentCount}</strong>
            <span>документных привязок</span>
          </article>
          <article>
            <strong>{snapshot.seoCount}</strong>
            <span>SEO-записей</span>
          </article>
          <article>
            <strong>{snapshot.translationCount}</strong>
            <span>переводов</span>
          </article>
        </div>
        <div className="montelar-page-editor-workspaces">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id !== "sections")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.description}</span>
                <b>{entry.count}</b>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "navigation") {
    return (
      <section className="montelar-page-editor-card">
        <div className="montelar-page-editor-card__eyebrow">Маршруты и публикационный контекст</div>
        <p className="montelar-page-editor-card__note">
          Эти быстрые входы помогают открыть точную страницу, то же семейство маршрутов или ту же очередь публикации
          без поиска по raw коллекции.
        </p>
        <div className="montelar-page-editor-workspaces">
          {snapshot.listViews.map((entry) => (
            <a href={entry.href} key={entry.id}>
              <strong>{entry.label}</strong>
              <span>{entry.description}</span>
            </a>
          ))}
        </div>
      </section>
    );
  }

  if (surface === "notes") {
    return (
      <section className="montelar-page-editor-card">
        <div className="montelar-page-editor-card__eyebrow">Рабочие заметки</div>
        <p className="montelar-page-editor-card__note">{getPageWorkspaceRoleLabel(role)}</p>
        <p className="montelar-page-editor-card__note">
          Здесь остаются заметки менеджера, комментарии к выпуску и публикационные подсказки. Визуальная композиция,
          motion и код страницы остаются разработческим слоем.
        </p>
      </section>
    );
  }

  return (
    <section className="montelar-page-editor-hero">
      <div>
        <div className="montelar-page-editor-card__eyebrow">Первый экран и текст страницы</div>
        <h2>{getText(data.title) || "Новый черновик страницы"}</h2>
        <p className="montelar-page-editor-card__note">
          Сначала меняйте заголовок, короткую подпись, основной текст, hero-медиа и кнопки. Структура страницы и
          служебные настройки остаются ниже или в расширенном слое.
        </p>
        <div className="montelar-page-editor-card__metrics">
          <article>
            <strong>{visibleSections.length}</strong>
            <span>видно блоков на странице</span>
          </article>
          <article>
            <strong>{Math.max(snapshot.sectionCount - visibleSections.length, 0)}</strong>
            <span>скрыто или еще не подключено</span>
          </article>
          <article>
            <strong>{readyCount}</strong>
            <span>проверок уже готовы</span>
          </article>
          <article>
            <strong>{snapshot.blockers.length}</strong>
            <span>вопросов перед live</span>
          </article>
        </div>
        <div className="montelar-page-editor-inline-meta">
          <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(status)}`}>{getStatusLabel(status)}</span>
          <span>{visibleSections.length > 0 ? "контент собран" : "нужно собрать экран"}</span>
          <span>{status === "published" ? "страница уже открыта на сайте" : "сначала проверьте preview"}</span>
        </div>
      </div>
      <div className="montelar-page-editor-links">
        <a href={previewUrl || "#"} rel="noreferrer" target="_blank">
          <strong>Открыть предпросмотр</strong>
          <span>Безопасная черновая версия перед live-публикацией</span>
        </a>
        <a
          href={status === "published" ? snapshot.publicUrl : blockerHref}
          rel={status === "published" ? "noreferrer" : undefined}
          target={status === "published" ? "_blank" : undefined}
        >
          <strong>{status === "published" ? "Открыть live-страницу" : "Убрать блокеры публикации"}</strong>
          <span>
            {status === "published"
              ? "Текущая открытая страница на сайте"
              : snapshot.blockers.length > 0
                ? "Откройте первую блокирующую зависимость"
                : publishAllowed
                  ? "Preview, SEO и план блоков выглядят готовыми к выпуску"
                  : "Публикация доступна только Owner/Admin"}
          </span>
        </a>
      </div>
      <div className="montelar-page-editor-summary-grid">
        <article className="montelar-page-editor-summary-card">
          <span>Заголовок</span>
          <strong>{getFieldValue(getText(data.title), "Добавьте публичный заголовок страницы")}</strong>
        </article>
        <article className="montelar-page-editor-summary-card">
          <span>Короткая подпись</span>
          <strong>{getFieldValue(eyebrow, "Добавьте короткую подпись над заголовком")}</strong>
        </article>
        <article className="montelar-page-editor-summary-card">
          <span>Основной текст</span>
          <strong>{getFieldValue(heroSummary, "Опишите, что видит клиент в первом экране")}</strong>
        </article>
        <article className="montelar-page-editor-summary-card">
          <span>Вступительный абзац</span>
          <strong>{getFieldValue(introBody, "Добавьте спокойное вводное описание страницы")}</strong>
        </article>
        <article className="montelar-page-editor-summary-card">
          <span>Hero-медиа</span>
          <strong>{getFieldValue(heroMediaLabel || coverMediaLabel, "Подберите изображение или видео для первого экрана")}</strong>
        </article>
        <article className="montelar-page-editor-summary-card">
          <span>Кнопки</span>
          <strong>
            {primaryCtaLabel
              ? `${primaryCtaLabel}${primaryCtaTarget ? ` -> ${primaryCtaTarget}` : ""}`
              : "Добавьте основную кнопку и ссылку"}
            {secondaryCtaLabel
              ? ` / ${secondaryCtaLabel}${secondaryCtaTarget ? ` -> ${secondaryCtaTarget}` : ""}`
              : ""}
          </strong>
        </article>
      </div>
      <div className="montelar-page-editor-card">
        <div className="montelar-page-editor-card__eyebrow">Какие блоки сейчас видит посетитель</div>
        {visibleSections.length > 0 ? (
          <div className="montelar-page-editor-sections">
            {visibleSections.slice(0, 4).map((section) => (
              <a href={section.href} key={section.id}>
                <div>
                  <strong>
                    {section.order}. {section.label}
                  </strong>
                  <span>{section.type} · {section.status}</span>
                </div>
                <b>{section.mediaCount} media</b>
              </a>
            ))}
          </div>
        ) : (
          <p className="montelar-page-editor-card__note">
            Видимые блоки еще не собраны. Откройте вкладку `Блоки`, чтобы выбрать состав страницы и порядок показа.
          </p>
        )}
      </div>
      <div className="montelar-page-editor-workspaces">
        {snapshot.linkedWorkspaces
          .filter((entry) => ["sections", "media", "translations"].includes(entry.id))
          .map((entry) => (
            <a href={entry.href} key={entry.id}>
              <strong>{entry.label}</strong>
              <span>{entry.description}</span>
              <b>{entry.count}</b>
            </a>
          ))}
      </div>
    </section>
  );
}
