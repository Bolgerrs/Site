import type { AdminLayer } from "./raw-layer.ts";
import type { AdminRole } from "../payload/roles.ts";

export type Action = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  intent: "command" | "navigate" | "preview" | "publish" | "repair";
  method?: "DELETE" | "GET" | "PATCH" | "POST";
  surfaceId?: string;
  tone?: "attention" | "critical" | "neutral" | "positive";
};

export type Issue = {
  id: string;
  actionId?: string;
  description: string;
  severity: "blocker" | "critical" | "info" | "warning";
  status: "open" | "resolved" | "watch";
  surfaceId?: string;
  title: string;
};

export type EditableSurface = {
  description: string;
  href: string;
  id: string;
  kind: "dashboard" | "media" | "page" | "product" | "settings" | "translation" | "workflow";
  label: string;
  layer: AdminLayer;
  primaryActionId?: string;
  roleAccess: readonly AdminRole[];
  status: "available" | "blocked" | "readonly" | "restricted";
};

export type PublishPlanStep = {
  id: string;
  label: string;
  status: "blocked" | "done" | "pending" | "ready";
};

export type PublishPlan = {
  blockers: Issue[];
  id: string;
  label: string;
  status: "blocked" | "clear" | "draft" | "review";
  steps: PublishPlanStep[];
  summary: string;
};

export type InspectorState = {
  actions: Action[];
  facts: Array<{
    label: string;
    value: string;
  }>;
  issues: Issue[];
  summary: string;
  title: string;
  tone: "attention" | "critical" | "neutral" | "positive";
};

export type WorkbenchState = {
  actions: Action[];
  capabilities: Record<string, boolean>;
  currentLayer: AdminLayer;
  generatedAt: string;
  id: string;
  inspector: InspectorState;
  issues: Issue[];
  publishPlan: PublishPlan;
  role: AdminRole;
  surfaces: EditableSurface[];
  summary: string;
  title: string;
  userId: number | string | null;
};
