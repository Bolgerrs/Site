import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarChecksWorkspace } from "@/components/admin-shell/MontelarChecksWorkspace.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const checksWorkspaceRoles = ["owner", "admin", "content-editor", "translator", "developer"] as const;

export default async function AdminChecksPage() {
  await requireAdminPageAccess("/admin/checks", checksWorkspaceRoles);

  return (
    <MontelarAdminAppShell active="checks">
      <MontelarChecksWorkspace />
    </MontelarAdminAppShell>
  );
}
