"use client";

import React from "react";

type BrandProps = {
  compact?: boolean;
};

export function MontelarAdminBrand({ compact = false }: BrandProps) {
  return (
    <div className={compact ? "montelar-admin-brand montelar-admin-brand--compact" : "montelar-admin-brand"}>
      <span className="montelar-admin-brand__mark" aria-hidden="true">
        M
      </span>
      <div className="montelar-admin-brand__copy">
        <strong>Montelar</strong>
        <span>панель владельца</span>
      </div>
    </div>
  );
}

export function MontelarAdminIcon() {
  return (
    <div className="montelar-admin-icon" aria-hidden="true">
      <span>M</span>
    </div>
  );
}

export function MontelarAdminLogo() {
  return (
    <div className="montelar-admin-logo">
      <MontelarAdminBrand />
      <p>Простая рабочая оболочка для сайта, продуктов, заявок, медиа и переводов.</p>
    </div>
  );
}
