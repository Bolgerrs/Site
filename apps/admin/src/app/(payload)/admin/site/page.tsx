import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarSiteWorkspace } from "@/components/admin-shell/MontelarSiteWorkspace.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const siteWorkspaceRoles = ["owner", "admin", "content-editor", "translator", "developer"] as const;

export default async function AdminSiteWorkspacePage() {
  await requireAdminPageAccess("/admin/site", siteWorkspaceRoles);

  return (
    <MontelarAdminAppShell active="site">
      <MontelarSiteWorkspace />
    </MontelarAdminAppShell>
  );
}
