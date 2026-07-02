"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { getVisibleRawAdminCollections } from "@/lib/payload/admin-surfaces.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";

export function MontelarAdminDevLinks() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const pathname = usePathname();

  if (!hasAdminRole(user, ["owner", "developer"]) || !pathname.startsWith("/admin/advanced")) {
    return null;
  }

  const rawCollections = getVisibleRawAdminCollections(user.role ?? null).filter(
    (surface) => surface.classification !== "owner-primary",
  );

  return (
    <section className="montelar-admin-dev-links" aria-labelledby="montelar-admin-dev-links-title">
      <div className="montelar-admin-dev-links__header">
        <span id="montelar-admin-dev-links-title">Raw Payload layer</span>
        <strong>{user.role === "owner" ? "owner / dev" : "dev only"}</strong>
      </div>
      <div className="montelar-admin-dev-links__list">
        {rawCollections.map((surface) => (
          <Link
            href={formatAdminURL({ adminRoute, path: surface.href.replace(/^\/admin\/collections/, "/collections") as `/${string}` })}
            key={surface.slug}
          >
            {surface.labels.plural}
          </Link>
        ))}
      </div>
    </section>
  );
}
