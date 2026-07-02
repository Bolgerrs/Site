import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarMediaWorkspace } from "@/components/admin-shell/MontelarMediaWorkspace.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const mediaWorkspaceRoles = ["owner", "admin", "media-manager", "developer"] as const;

export default async function AdminMediaPage() {
  await requireAdminPageAccess("/admin/media", mediaWorkspaceRoles);

  return (
    <MontelarAdminAppShell active="media">
      <MontelarMediaWorkspace />
    </MontelarAdminAppShell>
  );
}
