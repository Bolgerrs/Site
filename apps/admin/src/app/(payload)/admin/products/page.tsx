import { MontelarAdminAppShell } from "@/components/admin-shell/MontelarAdminAppShell.tsx";
import { MontelarProductsWorkspace } from "@/components/admin-shell/MontelarProductsWorkspace.tsx";
import { requireAdminPageAccess } from "@/lib/admin-bff/session.ts";

const activeWorkspace = "products" as const;
const productWorkspaceRoles = ["owner", "admin", "content-editor", "developer"] as const;

export default async function ProductsWorkspacePage() {
  await requireAdminPageAccess("/admin/products", productWorkspaceRoles);

  return (
    <MontelarAdminAppShell active={activeWorkspace}>
      <MontelarProductsWorkspace />
    </MontelarAdminAppShell>
  );
}
