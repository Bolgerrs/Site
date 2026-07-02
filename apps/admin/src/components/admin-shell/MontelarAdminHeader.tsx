"use client";

import { useAuth } from "@payloadcms/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { MontelarAdminBrand } from "./MontelarAdminBrand.tsx";
import { getAdminNavigationContext } from "@/lib/payload/admin-shell.ts";

function getPrimaryAction(workspaceId: string | undefined) {
  switch (workspaceId) {
    case "pages":
      return { href: "/admin/site", label: "Открыть дерево страниц" };
    case "catalog":
      return { href: "/admin/products", label: "Открыть продукты" };
    case "media":
      return { href: "/admin/media", label: "Открыть медиа" };
    case "leads":
      return { href: "/admin/leads", label: "Открыть заявки" };
    case "translations":
      return { href: "/admin/translations", label: "Открыть переводы" };
    case "seo":
      return { href: "/admin/checks", label: "Открыть проверки" };
    case "settings":
      return { href: "/admin/settings", label: "Открыть настройки" };
    default:
      return { href: "/admin/site", label: "Редактировать сайт" };
  }
}

export function MontelarAdminHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const navigation = getAdminNavigationContext(user?.role ?? null, pathname);
  const primaryAction = getPrimaryAction(navigation?.currentWorkspace.id);

  return (
    <div className="montelar-admin-header">
      <MontelarAdminBrand compact />
      <div className="montelar-admin-header__meta">
        <span>Рабочая область</span>
        <strong>{navigation?.currentWorkspace.label ?? "Панель"}</strong>
        <small>{navigation?.currentWorkspace.summary ?? "Рабочий слой Montelar"}</small>
      </div>
      <div className="montelar-admin-header__actions">
        <Link href="http://89.150.34.66:8093/en" target="_blank">
          Посмотреть сайт
        </Link>
        <Link className="is-primary" href={primaryAction.href}>
          {primaryAction.label}
        </Link>
      </div>
    </div>
  );
}
