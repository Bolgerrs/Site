export const adminRoleOptions = [
  {
    label: "Owner",
    value: "owner",
  },
  {
    label: "Platform Admin",
    value: "admin",
  },
  {
    label: "Content Editor",
    value: "content-editor",
  },
  {
    label: "Lead Manager",
    value: "lead-manager",
  },
  {
    label: "Translator",
    value: "translator",
  },
  {
    label: "Media Manager",
    value: "media-manager",
  },
  {
    label: "Developer",
    value: "developer",
  },
] as const;

export type AdminRole = (typeof adminRoleOptions)[number]["value"];

export const allAdminRoles = adminRoleOptions.map((option) => option.value);

export const publishingAdminRoles = ["owner", "admin"] as const satisfies readonly AdminRole[];
export const technicalAdminRoles = ["owner", "developer"] as const satisfies readonly AdminRole[];
export const operationalAdminRoles = [
  "owner",
  "admin",
  "content-editor",
  "lead-manager",
  "translator",
  "media-manager",
  "developer",
] as const satisfies readonly AdminRole[];
export const leadPiiAccessRoles = [
  "owner",
  "admin",
  "lead-manager",
  "developer",
] as const satisfies readonly AdminRole[];
export const leadExportRoles = ["owner", "admin"] as const satisfies readonly AdminRole[];
export const mediaOperatorRoles = [
  "owner",
  "admin",
  "media-manager",
  "developer",
] as const satisfies readonly AdminRole[];

export type AdminUserLike =
  | {
      id?: number | string | null;
      role?: AdminRole | null;
    }
  | null
  | undefined;

export function getAdminRole(user: AdminUserLike): AdminRole | null {
  return user?.role ?? null;
}

export function hasAdminRole(
  user: AdminUserLike,
  roles: readonly AdminRole[],
): user is { role: AdminRole } {
  return Boolean(user?.role && roles.includes(user.role));
}
