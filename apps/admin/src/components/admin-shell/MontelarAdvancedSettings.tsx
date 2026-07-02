"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";
import Link from "next/link";
import React from "react";

import { getVisibleRawAdminCollections } from "@/lib/payload/admin-surfaces.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";
import {
  advancedAccessRoles,
  advancedToolGroups,
} from "@/lib/payload/site-admin-workspace.ts";

function resolveAdminHref(adminRoute: string, href: string) {
  const advancedRawPrefix = "/admin/advanced?";
  if (href.startsWith(advancedRawPrefix)) {
    const rawHref = new URLSearchParams(href.slice(advancedRawPrefix.length)).get("raw");

    if (rawHref?.startsWith("/admin/collections/")) {
      return resolveAdminHref(adminRoute, rawHref);
    }
  }

  if (href.startsWith("/admin")) {
    const [rawPath, rawSearch = ""] = href.replace(/^\/admin/, "").split("?", 2);
    const path = (rawPath || "/") as `/${string}`;
    const resolved = formatAdminURL({ adminRoute, path });

    return rawSearch ? `${resolved}?${rawSearch}` : resolved;
  }

  return href;
}

export function MontelarAdvancedSettings() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();

  if (!hasAdminRole(user, advancedAccessRoles)) {
    return (
      <section className="montelar-admin-dashboard" aria-labelledby="montelar-advanced-title">
        <article className="montelar-admin-dashboard__card montelar-admin-dashboard__card--placeholder">
          <span>Расширенные настройки</span>
          <strong id="montelar-advanced-title">Доступ ограничен</strong>
          <p>Этот слой открыт только владельцу и разработчику.</p>
        </article>
      </section>
    );
  }

  const rawCollections = getVisibleRawAdminCollections(user?.role ?? null);

  return (
    <section className="montelar-advanced" aria-labelledby="montelar-advanced-title">
      <div className="montelar-advanced__hero">
        <span>Расширенные настройки</span>
        <h1 id="montelar-advanced-title">Глубокий слой отдельно от обычной админки</h1>
        <p>
          Повседневная работа остается в owner и site-admin слоях. Здесь лежат raw Payload fallback,
          доступы, технические diagnostics и служебные режимы, которые не должны попадать в обычный
          workflow менеджера.
        </p>
      </div>

      <div className="montelar-advanced__sections">
        {advancedToolGroups.map((group) => (
          <section className="montelar-advanced__section" id={group.id} key={group.id}>
            <div className="montelar-advanced__section-title">{group.label}</div>
            <p className="montelar-advanced__section-copy">{group.description}</p>
            <div className="montelar-advanced__grid">
              {group.items.map((module) => (
                  <Link
                    className="montelar-advanced__tile"
                    href={resolveAdminHref(adminRoute, module.href)}
                    key={module.id}
                  >
                    <strong>{module.label}</strong>
                    <p>{module.description}</p>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>

      <details className="montelar-advanced__raw">
        <summary>Все raw Payload collections</summary>
        <div className="montelar-advanced__raw-grid">
          {rawCollections.map((surface) => (
            <Link
              href={formatAdminURL({
                adminRoute,
                path: surface.href.replace(/^\/admin\/collections/, "/collections") as `/${string}`,
              })}
              key={surface.slug}
            >
              <strong>{surface.labels.plural}</strong>
              <span>{surface.summary}</span>
            </Link>
          ))}
        </div>
      </details>
    </section>
  );
}
