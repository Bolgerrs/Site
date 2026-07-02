import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarLeadsInbox } from "@/components/admin-shell/MontelarLeadsInbox.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const leadsWorkspaceRoles = ["owner", "admin", "content-editor", "lead-manager", "translator", "developer"] as const;

export default async function AdminLeadsPage() {
  await requireAdminPageAccess("/admin/leads", leadsWorkspaceRoles);

  return (
    <MontelarAdminAppShell active="leads">
      <MontelarLeadsInbox />
    </MontelarAdminAppShell>
  );
}
