import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteLocale } from "@/config/i18n";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";

type RouteItem = {
  href: string;
  label: string;
  description: string;
};

type RoutePageTemplateProps = {
  eyebrow: string;
  title: string;
  intro: string;
  status: string;
  nextTask: string;
  notes: string[];
  links?: readonly RouteItem[] | undefined;
  linksTitle?: string;
  heroMedia?: ReactNode;
  heroAction?: ReactNode;
  childrenPlacement?: "beforeGrid" | "afterGrid";
  children?: ReactNode;
  locale?: SiteLocale;
};

export function RoutePageTemplate({
  eyebrow,
  title,
  intro,
  status,
  nextTask,
  notes,
  links,
  linksTitle = "Related sections",
  heroMedia,
  heroAction,
  childrenPlacement = "afterGrid",
  children,
  locale,
}: RoutePageTemplateProps) {
  const primaryThoughtLabel = getLocaleCopy(locale ?? "en", {
    en: "First thought",
    de: "Erster Gedanke",
    es: "Primera idea",
    fr: "Première intention",
    ja: "最初の視点",
    ru: "Главная мысль",
    zh: "第一判断",
  });
  const decisionNotesLabel = getLocaleCopy(locale ?? "en", {
    en: "Decision notes",
    de: "Hinweise zur Entscheidung",
    es: "Notas para decidir",
    fr: "Repères de décision",
    ja: "検討の要点",
    ru: "Ориентиры выбора",
    zh: "决策要点",
  });

  return (
    <section className="route-page">
      <div className="route-hero">
        <div className="route-copy">
          <div className="route-title-row">
            <div className="route-title-lockup">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
            </div>
            {heroAction ? <div className="route-title-action">{heroAction}</div> : null}
          </div>
          <p className="route-intro">{intro}</p>
        </div>

        <div className="route-hero-aside">
          {heroMedia}
          <aside className="status-card route-status-card">
            <p className="eyebrow">{primaryThoughtLabel}</p>
            <p className="route-status">{status}</p>
            <p className="route-next-task">{nextTask}</p>
          </aside>
        </div>
      </div>

      {childrenPlacement === "beforeGrid" ? children : null}

      <div className="route-grid">
        <div className="route-panel">
          <p className="eyebrow">{decisionNotesLabel}</p>
          <ul className="status-list">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>

        {links ? (
          <div className="route-panel">
            <p className="eyebrow">{linksTitle}</p>
            <div className="route-link-list">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className="route-link-card"
                  href={withLocale(link.href, locale)}
                >
                  <span className="route-link-label">{link.label}</span>
                  <span className="route-link-description">{link.description}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {childrenPlacement === "afterGrid" ? children : null}
    </section>
  );
}
