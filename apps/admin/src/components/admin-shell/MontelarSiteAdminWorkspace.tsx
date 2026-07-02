"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import React from "react";

import { hasAdminRole } from "@/lib/payload/roles.ts";
import { siteAdminAccessRoles, siteAdminCards } from "@/lib/payload/site-admin-workspace.ts";

type SiteAdminSnapshot = {
  domains: Array<{
    id: string;
    items: Array<Record<string, unknown>>;
    summary: string;
  }>;
  successMessage?: string;
};

type EditableMenu = {
  id: string;
  items: Array<{
    href: string;
    label: string;
  }>;
  title: string;
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

function getGuidedActionHref(sectionId: string) {
  switch (sectionId) {
    case "forms":
      return "/admin/site-admin?section=forms";
    case "languages":
      return "/admin/translations";
    case "seo":
    case "security":
      return "/admin/checks";
    case "site-structure":
    case "visual-modules":
      return "/admin/site";
    case "media-settings":
      return "/admin/media";
    default:
      return "/admin/settings";
  }
}

function getGuidedActionLabel(sectionId: string) {
  switch (sectionId) {
    case "forms":
      return "Открыть формы";
    case "languages":
      return "Открыть переводы";
    case "seo":
    case "security":
      return "Открыть проверки";
    case "site-structure":
    case "visual-modules":
      return "Открыть редактор сайта";
    case "media-settings":
      return "Открыть медиатеку";
    default:
      return "Открыть настройки";
  }
}

export function MontelarSiteAdminWorkspace() {
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = React.useState<SiteAdminSnapshot | null>(null);
  const [menuDraft, setMenuDraft] = React.useState<EditableMenu | null>(null);
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const canReachWorkspace = hasAdminRole(user, siteAdminAccessRoles);
  const selectedSection = searchParams.get("section") || "header-footer";
  const selectedCard =
    siteAdminCards.find((card) => card.id === selectedSection) ??
    siteAdminCards.find((card) => card.id === "header-footer") ??
    siteAdminCards[0];
  const selectedDomain = React.useMemo(
    () => snapshot?.domains.find((domain) => domain.id === selectedCard?.id),
    [selectedCard?.id, snapshot],
  );

  React.useEffect(() => {
    if (!canReachWorkspace || !selectedCard) {
      return;
    }

    const controller = new AbortController();

    void fetch(`/api/internal/site-admin-settings?section=${selectedCard.id}`, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: SiteAdminSnapshot | null) => {
        if (!data) {
          return;
        }

        setSnapshot(data);
        const headerDomain = data.domains.find((domain) => domain.id === "header-footer");
        const firstMenu = headerDomain?.items[0];

        if (firstMenu && selectedCard.id === "header-footer") {
          setMenuDraft({
            id: String(firstMenu.id ?? ""),
            items: [
              {
                href: "/contact",
                label: "Contact",
              },
            ],
            title: String(firstMenu.title ?? ""),
          });
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSnapshot(null);
        }
      });

    return () => controller.abort();
  }, [canReachWorkspace, selectedCard]);

  async function saveHeaderFooterMenu() {
    if (!menuDraft?.id) {
      setSaveState("error");
      return;
    }

    setSaveState("saving");

    const response = await fetch("/api/internal/site-admin-settings", {
      body: JSON.stringify({
        action: "navigation.save-menu-items",
        items: menuDraft.items,
        menuId: menuDraft.id,
        title: menuDraft.title,
      }),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      setSaveState("error");
      return;
    }

    const nextSnapshot = (await response.json()) as SiteAdminSnapshot;
    setSnapshot(nextSnapshot);
    setSaveState("saved");
  }

  if (!canReachWorkspace) {
    return (
      <section className="montelar-site-admin montelar-site-admin--empty">
        <h1>Настройки сайта</h1>
        <p>Этот слой открыт только ролям, которые отвечают за структуру сайта.</p>
      </section>
    );
  }

  if (!selectedCard) {
    return null;
  }

  return (
    <section className="montelar-site-admin" aria-labelledby="montelar-site-admin-title">
      <div className="montelar-site-admin__hero">
        <div>
          <span className="montelar-admin-shell__eyebrow">Настройки сайта</span>
          <h1 id="montelar-site-admin-title">Понятные настройки структуры, меню, форм и языков</h1>
          <p>
            Здесь живут структура сайта, меню, SEO, формы, языки, пользователи, безопасность и страницы правил.
            Обычный администратор работает здесь. Редкие действия вынесены в отдельный расширенный раздел.
          </p>
        </div>
        <dl className="montelar-site-admin__hero-rail">
          <div>
            <dt>Разделы настроек</dt>
            <dd>{siteAdminCards.length} разделов</dd>
          </div>
          <div>
            <dt>Повседневный режим</dt>
            <dd>Сначала понятные редакторы, потом редкие расширенные действия</dd>
          </div>
          <div>
            <dt>Простой путь</dt>
            <dd>Повседневные задачи не требуют таблиц данных</dd>
          </div>
        </dl>
      </div>

      <div className="montelar-site-admin__layout">
        <nav className="montelar-site-admin__section-list" aria-label="Настройки сайта">
          {siteAdminCards.map((card) => (
            <Link
              aria-current={card.id === selectedCard.id ? "page" : undefined}
              className={
                card.id === selectedCard.id
                  ? "montelar-site-admin__section-link is-active"
                  : "montelar-site-admin__section-link"
              }
              href={resolveAdminHref(adminRoute, card.href)}
              key={card.id}
            >
              <span>{card.label}</span>
              <small>{card.items.length} блока</small>
            </Link>
          ))}
        </nav>

        <article className="montelar-site-admin__detail">
          <div className="montelar-site-admin__card-topline">
            <span>Выбранный раздел</span>
          </div>
          <strong>{selectedCard.label}</strong>
          <p>{selectedCard.description}</p>
          <ul>
            {selectedCard.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {selectedDomain ? (
            <p className="montelar-site-admin__summary">{selectedDomain.summary}</p>
          ) : null}
          {selectedCard.id === "header-footer" && menuDraft ? (
            <div className="montelar-site-admin__editor">
              <label>
                <span>Название меню</span>
                <input
                  onChange={(event) =>
                    setMenuDraft((draft) => (draft ? { ...draft, title: event.target.value } : draft))
                  }
                  value={menuDraft.title}
                />
              </label>
              <label>
                <span>Первый пункт</span>
                <input
                  onChange={(event) =>
                    setMenuDraft((draft) => {
                      if (!draft) {
                        return draft;
                      }

                      const firstItem = draft.items[0] ?? { href: "/", label: "" };

                      return {
                        ...draft,
                        items: [{ ...firstItem, label: event.target.value }],
                      };
                    })
                  }
                  value={menuDraft.items[0]?.label ?? ""}
                />
              </label>
              <label>
                <span>Ссылка</span>
                <input
                  onChange={(event) =>
                    setMenuDraft((draft) => {
                      if (!draft) {
                        return draft;
                      }

                      const firstItem = draft.items[0] ?? { href: "/", label: "" };

                      return {
                        ...draft,
                        items: [{ ...firstItem, href: event.target.value }],
                      };
                    })
                  }
                  value={menuDraft.items[0]?.href ?? ""}
                />
              </label>
              <button disabled={saveState === "saving"} onClick={saveHeaderFooterMenu} type="button">
                {saveState === "saving" ? "Сохранение" : "Сохранить меню"}
              </button>
              <span aria-live="polite">
                {saveState === "saved"
                  ? (snapshot?.successMessage ?? "Сохранено")
                  : saveState === "error"
                    ? "Не удалось сохранить"
                    : ""}
              </span>
            </div>
          ) : null}
          <div className="montelar-site-admin__actions">
            <Link href={resolveAdminHref(adminRoute, getGuidedActionHref(selectedCard.id))}>
              {getGuidedActionLabel(selectedCard.id)}
            </Link>
            <Link href={resolveAdminHref(adminRoute, "/admin/checks")}>Проверить перед публикацией</Link>
          </div>
        </article>
      </div>

      <section className="montelar-site-admin__note">
        <strong>Как пользоваться слоями</strong>
        <p>
          `Настройки` остаются простым экраном для контактов, главной кнопки и базовых бренд-полей. `Настройки сайта` покрывают
          рабочие административные разделы. Редкие операции держатся отдельно от ежедневного пути владельца.
        </p>
      </section>
    </section>
  );
}
