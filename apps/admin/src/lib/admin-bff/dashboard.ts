import type { Payload } from "payload";

import type { WorkbenchState } from "./dtos.ts";
import { createDashboardWorkbenchState } from "./workbench.ts";
import {
  getAdminDashboardSnapshot,
  type AdminDashboardSnapshot,
} from "../payload/admin-dashboard.ts";
import type { AdminRole } from "../payload/roles.ts";

export type AdminDashboardBffSnapshot = AdminDashboardSnapshot & {
  workbench: WorkbenchState;
};

export async function getAdminDashboardBffSnapshot(
  payload: Payload,
  input: {
    role: AdminRole;
    routePath?: string;
    userId?: number | string | null;
  },
): Promise<AdminDashboardBffSnapshot> {
  const dashboard = await getAdminDashboardSnapshot(payload);
  const workbench = createDashboardWorkbenchState({
    dashboard,
    role: input.role,
    ...(input.routePath ? { routePath: input.routePath } : {}),
    ...(typeof input.userId === "undefined" ? {} : { userId: input.userId }),
  });

  return {
    ...dashboard,
    workbench,
  };
}
