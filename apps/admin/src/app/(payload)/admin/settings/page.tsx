import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarOwnerSettingsWorkspace } from "@/components/admin-shell/MontelarOwnerSettingsWorkspace.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const ownerSettingsRoles = ["owner", "admin", "developer"] as const;

export default async function AdminSettingsPage() {
  await requireAdminPageAccess("/admin/settings", ownerSettingsRoles);

  return (
    <MontelarAdminAppShell active="settings">
      <MontelarOwnerSettingsWorkspace />
    </MontelarAdminAppShell>
  );
}
