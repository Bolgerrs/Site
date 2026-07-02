import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarAdvancedSettings } from "@/components/admin-shell/MontelarAdvancedSettings.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";
import { technicalAdminRoles } from "@/lib/payload/roles.ts";

export default async function AdvancedSettingsPage() {
  await requireAdminPageAccess("/admin/advanced", technicalAdminRoles);

  return (
    <MontelarAdminAppShell active="settings" layer="raw">
      <MontelarAdvancedSettings />
    </MontelarAdminAppShell>
  );
}
