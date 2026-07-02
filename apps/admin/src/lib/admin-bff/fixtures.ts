import type { EditableSurface } from "./dtos.ts";
import type { AdminRole } from "../payload/roles.ts";

export type AdminBffRoleFixture = {
  defaultSurfaceId: string;
  label: string;
  role: AdminRole;
  surfaceIds: readonly EditableSurface["id"][];
};

export const adminBffRoleFixtures = [
  {
    defaultSurfaceId: "dashboard",
    label: "Owner",
    role: "owner",
    surfaceIds: ["dashboard", "site", "products", "media", "leads", "translations", "checks", "settings", "advanced"],
  },
  {
    defaultSurfaceId: "dashboard",
    label: "Admin",
    role: "admin",
    surfaceIds: ["dashboard", "site", "products", "media", "leads", "translations", "checks", "settings"],
  },
  {
    defaultSurfaceId: "site",
    label: "Content editor",
    role: "content-editor",
    surfaceIds: ["dashboard", "site", "products", "translations", "checks"],
  },
  {
    defaultSurfaceId: "leads",
    label: "Lead manager",
    role: "lead-manager",
    surfaceIds: ["dashboard", "leads"],
  },
  {
    defaultSurfaceId: "translations",
    label: "Translator",
    role: "translator",
    surfaceIds: ["dashboard", "site", "translations", "checks"],
  },
  {
    defaultSurfaceId: "media",
    label: "Media manager",
    role: "media-manager",
    surfaceIds: ["dashboard", "media"],
  },
  {
    defaultSurfaceId: "dashboard",
    label: "Developer",
    role: "developer",
    surfaceIds: ["dashboard", "site", "products", "media", "leads", "translations", "checks", "settings", "advanced"],
  },
] as const satisfies readonly AdminBffRoleFixture[];

export function getAdminBffRoleFixture(role: AdminRole): AdminBffRoleFixture {
  return adminBffRoleFixtures.find((fixture) => fixture.role === role) ?? adminBffRoleFixtures[0]!;
}
