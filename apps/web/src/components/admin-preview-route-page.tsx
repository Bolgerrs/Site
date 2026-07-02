import Link from "next/link";
import type { Metadata } from "next";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";

type AdminWorkspace = {
  blockers: string;
  href: string;
  label: string;
  note: string;
  ready: string;
};

type AdminQueueItem = {
  action: string;
  href: string;
  label: string;
  meta: string;
  status: string;
};

type AdminLeadItem = {
  assignee: string;
  label: string;
  meta: string;
  nextAction: string;
  priority: string;
  status: string;
};

const workspaces: AdminWorkspace[] = [
  {
    label: "Catalog",
    note: "Directions, categories, lines, products and variants stay in one curated product workspace.",
    blockers: "3 readiness blockers",
    ready: "14/17 products review-ready",
    href: "/products/vision-max-premium",
  },
  {
    label: "Forms",
    note: "Product-specific inquiry forms expose governed fields, consent and translations.",
    blockers: "2 forms need consent review",
    ready: "17 source forms linked",
    href: "/request/vision-max-premium",
  },
  {
    label: "Leads",
    note: "Incoming requests open as qualification cards with owner, next action and consent state.",
    blockers: "1 VIP follow-up missing",
    ready: "5 open leads",
    href: "/contact",
  },
  {
    label: "Translations",
    note: "Locale work is grouped by source freshness, reviewer state, missing pages and publish readiness.",
    blockers: "11 locale gaps",
    ready: "7 launch locales",
    href: "/brand",
  },
  {
    label: "Media and documents",
    note: "Assets surface rights, approval, usage and reference-only rules before public publishing.",
    blockers: "4 rights checks",
    ready: "Candidate bank isolated",
    href: "/downloads",
  },
  {
    label: "Creative",
    note: "Gemini/Stitch/image/video work remains governed as briefs, candidates and owner approvals.",
    blockers: "Asset pack blocked",
    ready: "Briefs and candidates tracked",
    href: "/journal",
  },
];

const queueItems: AdminQueueItem[] = [
  {
    label: "Living Glass OLED",
    meta: "Product page readiness",
    status: "Needs media rights approval",
    action: "Open preview",
    href: "/products/living-glass-oled",
  },
  {
    label: "Vision MAX Premium",
    meta: "Inquiry form",
    status: "Needs Admin publish",
    action: "Review form",
    href: "/request/vision-max-premium",
  },
  {
    label: "German launch locale",
    meta: "Translations",
    status: "Needs source-locale refresh",
    action: "Open queue",
    href: "/brand",
  },
];

const leadItems: AdminLeadItem[] = [
  {
    label: "MNT-2026-0508-004",
    meta: "Vision MAX / private cinema / NL",
    status: "VIP / urgent",
    priority: "P0",
    assignee: "Client advisor",
    nextAction: "Schedule architectural call",
  },
  {
    label: "MNT-2026-0508-003",
    meta: "Prima Materia LUX Speaker / dealer inquiry",
    status: "Partner handoff",
    priority: "P1",
    assignee: "Operator",
    nextAction: "Confirm partner-share consent",
  },
  {
    label: "MNT-2026-0508-002",
    meta: "Hologram Vitrine / showroom concept",
    status: "Needs information",
    priority: "P1",
    assignee: "Unassigned",
    nextAction: "Request project floor plan",
  },
];

export async function generateAdminPreviewMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: "Admin preview | Montelar",
    description: getLocaleCopy(locale, {
      en: "Hidden Montelar owner-console preview for visual review.",
      de: "Verdeckte Montelar Owner-Console Vorschau für visuelle Prüfung.",
      es: "Vista privada de la consola del propietario Montelar para revisión visual.",
      fr: "Aperçu masqué de la console propriétaire Montelar pour revue visuelle.",
      zh: "用于视觉审核的 Montelar 业主控制台隐藏预览。",
      ja: "視覚確認用の Montelar オーナーコンソール非公開プレビュー。",
      ru: "Скрытый предпросмотр панели владельца Montelar для визуальной проверки.",
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export async function AdminPreviewRoutePage() {
  const locale = await getRequestLocale();

  return (
    <section className="admin-preview-page" aria-labelledby="admin-preview-title">
      <div className="admin-preview-hero">
        <div className="admin-preview-copy">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Hidden owner preview", de: "Verdeckte Owner-Vorschau", es: "Vista privada del propietario", fr: "Aperçu propriétaire masqué", zh: "业主隐藏预览", ja: "オーナー非公開プレビュー", ru: "Скрытый предпросмотр" })}</p>
          <h1 id="admin-preview-title">Montelar owner console</h1>
          <p className="route-intro compact">
            {getLocaleCopy(locale, {
              en: "A calm operational screen for the site owner: work first, blockers visible, developer complexity kept out of daily editing.",
              de: "Ein ruhiger Arbeitsbildschirm für den Website-Inhaber: Aufgaben zuerst, Blocker sichtbar, Entwicklerkomplexität aus der täglichen Bearbeitung herausgehalten.",
              es: "Una pantalla operativa serena para el propietario del sitio: trabajo primero, bloqueos visibles y complejidad técnica fuera de la edición diaria.",
              fr: "Un écran opérationnel calme pour le propriétaire du site : travail d'abord, blocages visibles, complexité développeur hors de l'édition quotidienne.",
              zh: "面向网站业主的安静工作屏：任务优先、阻塞可见，日常编辑不暴露开发复杂度。",
              ja: "サイトオーナー向けの落ち着いた運用画面。作業を先に見せ、ブロッカーを可視化し、日常編集から開発者向けの複雑さを外します。",
              ru: "Спокойный рабочий экран владельца: сначала задачи, видимые блокеры и без технической сложности в ежедневном редактировании.",
            })}
          </p>
        </div>

        <div className="admin-preview-status">
          <div>
            <p className="eyebrow">Runtime state</p>
            <strong>Preview only</strong>
            <span>No production admin access is claimed in this preview.</span>
          </div>
          <div>
            <p className="eyebrow">Role lens</p>
            <strong>Admin</strong>
            <span>Owner and Developer settings stay out of the day-to-day screen.</span>
          </div>
        </div>
      </div>

      <div className="admin-overview-grid">
        <section className="admin-panel admin-focus-panel" aria-labelledby="admin-focus-title">
          <div className="admin-panel-heading">
            <p className="eyebrow">Today</p>
            <h2 id="admin-focus-title">Work and blockers</h2>
          </div>
          <div className="admin-focus-list">
            {queueItems.map((item) => (
              <article className="admin-focus-row" key={item.label}>
                <div>
                  <span className="admin-status-chip">{item.status}</span>
                  <h3>{item.label}</h3>
                  <p>{item.meta}</p>
                </div>
                <Link className="admin-action-link" href={withLocale(item.href, locale)}>
                  {item.action}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-readiness-panel" aria-labelledby="admin-readiness-title">
          <div className="admin-panel-heading">
            <p className="eyebrow">Readiness</p>
            <h2 id="admin-readiness-title">Publish rail</h2>
          </div>
          <dl className="admin-readiness-list">
            <div>
              <dt>Hierarchy</dt>
              <dd>Complete</dd>
            </div>
            <div>
              <dt>First screen and media</dt>
              <dd>Needs approved assets</dd>
            </div>
            <div>
              <dt>Primary inquiry form</dt>
              <dd>Linked</dd>
            </div>
            <div>
              <dt>SEO and page path</dt>
              <dd>Review-ready</dd>
            </div>
            <div>
              <dt>Translations</dt>
              <dd>Launch-locale gaps</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="admin-workspace-section" aria-labelledby="admin-workspaces-title">
        <div className="admin-panel-heading">
          <p className="eyebrow">Curated workspaces</p>
          <h2 id="admin-workspaces-title">No raw collection maze</h2>
        </div>
        <div className="admin-workspace-grid">
          {workspaces.map((workspace) => (
            <Link
              className="admin-workspace-card"
              href={withLocale(workspace.href, locale)}
              key={workspace.label}
            >
              <span className="admin-workspace-meta">{workspace.ready}</span>
              <h3>{workspace.label}</h3>
              <p>{workspace.note}</p>
              <span className="admin-blocker-chip">{workspace.blockers}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-panel admin-leads-panel" aria-labelledby="admin-leads-title">
        <div className="admin-panel-heading">
          <p className="eyebrow">Leads inbox</p>
          <h2 id="admin-leads-title">Cards instead of raw rows</h2>
        </div>
        <div className="admin-lead-list">
          {leadItems.map((lead) => (
            <article className="admin-lead-card" key={lead.label}>
              <div>
                <span className="admin-priority-chip">{lead.priority}</span>
                <h3>{lead.label}</h3>
                <p>{lead.meta}</p>
              </div>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>{lead.status}</dd>
                </div>
                <div>
                  <dt>Assignee</dt>
                  <dd>{lead.assignee}</dd>
                </div>
                <div>
                  <dt>Next action</dt>
                  <dd>{lead.nextAction}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
