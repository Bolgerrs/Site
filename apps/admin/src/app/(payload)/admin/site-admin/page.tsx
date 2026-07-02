import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarSiteAdminWorkspace } from "@/components/admin-shell/MontelarSiteAdminWorkspace.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const siteAdminRoles = ["owner", "admin", "developer"] as const;

export default async function AdminSiteAdminPage() {
  await requireAdminPageAccess("/admin/site-admin", siteAdminRoles);

  return (
    <MontelarAdminAppShell active="settings">
      <MontelarSiteAdminWorkspace />
    </MontelarAdminAppShell>
  );
}
