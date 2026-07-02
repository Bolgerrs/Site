"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { getAdminNavigationContext, getRoleBadgeLabel } from "@/lib/payload/admin-shell.ts";

function resolveWorkspaceHref(role: string | null | undefined, href: string) {
  if (href === "/admin/settings" && (role === "admin" || role === "developer")) {
    return "/admin/site-admin";
  }

  return href;
}

function resolveAdminHref(adminRoute: string, href: string) {
  if (href.startsWith("/admin")) {
    const nextHref = href.replace(/^\/admin/, "") || "/";
    const [rawPath, hash = ""] = nextHref.split("#", 2);
    const path = (rawPath || "/") as `/${string}`;
    const resolved = formatAdminURL({ adminRoute, path });

    return hash ? `${resolved}#${hash}` : resolved;
  }

  return href;
}

export function MontelarAdminNav() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const pathname = usePathname();
  const navigation = getAdminNavigationContext(user?.role ?? null, pathname);

  if (!navigation) {
    return null;
  }

  const primaryWorkspaces = navigation.compactWorkspaces;
  const primaryWorkspaceIds = new Set(primaryWorkspaces.map((workspace) => workspace.id));
  const supportGroups = navigation.groups
    .map((group) => ({
      ...group,
      workspaces: group.workspaces.filter((workspace) => !primaryWorkspaceIds.has(workspace.id)),
    }))
    .filter((group) => group.workspaces.length > 0);

  return (
    <section className="montelar-admin-shell montelar-admin-shell--product" aria-labelledby="montelar-admin-shell-title">
      <div className="montelar-admin-shell__workspace">
        <span id="montelar-admin-shell-title">Montelar Admin</span>
        <strong>{navigation.currentWorkspace.label}</strong>
        <p>{navigation.currentWorkspace.summary}</p>
      </div>

      <nav className="montelar-admin-shell__menu" aria-label="Основные разделы">
        <div className="montelar-admin-shell__menu-list">
          {primaryWorkspaces.map((workspace) => {
            const href = resolveAdminHref(adminRoute, resolveWorkspaceHref(user?.role ?? null, workspace.href));
            const isActive =
              workspace.id === navigation.currentWorkspace.id ||
              pathname === href ||
              (workspace.href === "/admin" && pathname === formatAdminURL({ adminRoute, path: "/" }));

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "montelar-admin-menu-link is-active" : "montelar-admin-menu-link"}
                href={href}
                key={`menu-${workspace.id}`}
              >
                <span className="montelar-admin-menu-link__label">{workspace.label}</span>
                <span className="montelar-admin-menu-link__summary">{workspace.summary}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {supportGroups.length > 0 ? (
        <div className="montelar-admin-shell__support" aria-label="Связанные потоки">
          {supportGroups.map((group) => (
            <section
              className="montelar-admin-shell__support-group"
              aria-labelledby={`montelar-admin-shell-group-${group.id}`}
              key={group.id}
            >
              <div className="montelar-admin-shell__support-header">
                <strong id={`montelar-admin-shell-group-${group.id}`}>{group.label}</strong>
              </div>

              <div className="montelar-admin-shell__support-list">
                {group.workspaces.map((workspace) => {
                  const href = resolveAdminHref(adminRoute, resolveWorkspaceHref(user?.role ?? null, workspace.href));
                  const isActive =
                    workspace.id === navigation.currentWorkspace.id ||
                    pathname === href ||
                    (workspace.href === "/admin" && pathname === formatAdminURL({ adminRoute, path: "/" }));

                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "montelar-admin-support-link",
                        isActive ? "is-active" : "",
                        workspace.state === "restricted" ? "is-advanced" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      href={href}
                      key={workspace.id}
                    >
                      <strong>{workspace.label}</strong>
                      <span>{workspace.summary}</span>
                      {workspace.state === "restricted" ? <em>расширенный слой</em> : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <div className="montelar-admin-shell__role">
        <span>{getRoleBadgeLabel(user)}</span>
        <p>{navigation.roleLead}</p>
      </div>
    </section>
  );
}
