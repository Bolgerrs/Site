import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarTranslationsWorkspace } from "@/components/admin-shell/MontelarTranslationsWorkspace.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const translationsWorkspaceRoles = ["owner", "admin", "content-editor", "translator", "developer"] as const;

export default async function AdminTranslationsPage() {
  await requireAdminPageAccess("/admin/translations", translationsWorkspaceRoles);

  return (
    <MontelarAdminAppShell active="translations">
      <MontelarTranslationsWorkspace />
    </MontelarAdminAppShell>
  );
}
