import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarSiteModulesGate } from "@/components/admin-shell/MontelarSiteModulesGate.tsx";
import { getComponentVisualGateSnapshot } from "@/lib/admin-bff/component-visual-gate.ts";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const siteModulesRoles = ["owner", "admin", "developer"] as const;

export default async function AdminSiteModulesPage() {
  const { req } = await requireAdminPageAccess("/admin/site-modules", siteModulesRoles);
  const snapshot = await getComponentVisualGateSnapshot(req.payload, req, { locale: "ru" });

  return (
    <MontelarAdminAppShell active="settings">
      <MontelarSiteModulesGate snapshot={snapshot} />
    </MontelarAdminAppShell>
  );
}
