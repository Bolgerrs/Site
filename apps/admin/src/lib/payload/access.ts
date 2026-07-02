import type { Access, Where } from "payload";

import {
  hasAdminRole,
  leadExportRoles,
  leadPiiAccessRoles,
  operationalAdminRoles,
  publishingAdminRoles,
  technicalAdminRoles,
  type AdminRole,
  type AdminUserLike,
} from "./roles.ts";

const publishedStatusWhere = {
  status: {
    equals: "published",
  },
} as const satisfies Where;

const publicProductionMediaWhere = {
  and: [
    publishedStatusWhere,
    {
      approvalStatus: {
        equals: "approved",
      },
    },
    {
      publicationReadiness: {
        equals: "production-ready",
      },
    },
    {
      audienceMode: {
        equals: "public",
      },
    },
    {
      referenceOnlyNotProductionAsset: {
        not_equals: true,
      },
    },
  ],
} as const satisfies Where;

export function getAdminUser(value: unknown): AdminUserLike {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as AdminUserLike;
}

function getSelfScope(user: AdminUserLike): Where | false {
  if (!user?.id) {
    return false;
  }

  return {
    id: {
      equals: user.id,
    },
  };
}

export const denyAccess: Access = () => false;
export const authenticatedAccess: Access = ({ req }) => Boolean(req.user);
export const publicDenyAccess = denyAccess;

export function roleAccess(roles: readonly AdminRole[]): Access {
  return ({ req }) => hasAdminRole(getAdminUser(req.user), roles);
}

export function roleBooleanAccess(roles: readonly AdminRole[]) {
  return ({ req }: { req: { user: unknown } }) =>
    hasAdminRole(getAdminUser(req.user), roles);
}

export function roleOrSelfAccess(roles: readonly AdminRole[]): Access {
  return ({ req }) => {
    const user = getAdminUser(req.user);

    if (hasAdminRole(user, roles)) {
      return true;
    }

    return getSelfScope(user);
  };
}

export function authenticatedOrPublishedReadAccess(
  roles: readonly AdminRole[] = [],
): Access {
  return ({ req }) => {
    const user = getAdminUser(req.user);

    if (roles.length > 0 && hasAdminRole(user, roles)) {
      return true;
    }

    if (user) {
      return true;
    }

    return publishedStatusWhere;
  };
}

export function authenticatedOrProductionMediaReadAccess(
  roles: readonly AdminRole[] = [],
): Access {
  return ({ req }) => {
    const user = getAdminUser(req.user);

    if (roles.length > 0 && hasAdminRole(user, roles)) {
      return true;
    }

    if (user) {
      return true;
    }

    return publicProductionMediaWhere;
  };
}

export const ownerOnlyAccess = roleAccess(["owner"]);
export const ownerOrDeveloperAccess = roleAccess(technicalAdminRoles);
export const auditHistoryAccess = roleAccess(["owner", "developer"]);
export const publishingAccess = roleAccess(publishingAdminRoles);
export const operationalAdminAccess = roleAccess(operationalAdminRoles);
export const leadPiiAccess = roleAccess(leadPiiAccessRoles);
export const leadWorkflowAccess = roleAccess(["owner", "admin", "lead-manager", "developer"]);
export const exportSensitiveAccess = roleAccess(leadExportRoles);
export const workflowOperatorAccess = roleAccess([
  "owner",
  "admin",
  "content-editor",
  "translator",
  "media-manager",
  "developer",
]);
