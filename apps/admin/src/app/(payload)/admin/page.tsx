import { MontelarAdminDashboard } from "@/components/admin-shell/MontelarAdminDashboard.tsx";
import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";
import { operationalAdminRoles } from "@/lib/payload/roles.ts";

export default async function AdminDashboardPage() {
  await requireAdminPageAccess("/admin", operationalAdminRoles);

  return (
    <MontelarAdminAppShell active="overview">
      <MontelarAdminDashboard />
    </MontelarAdminAppShell>
  );
}
