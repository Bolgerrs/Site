export type LeadRoutingLocale = "ru" | "en" | "es" | "fr" | "zh" | "ja" | "de";

export type LeadRoutingRule = {
  assignedTeam?: string;
  assignedToUser?: string | null;
  countries?: string[];
  key: string;
  leadTypes?: string[];
  locales?: LeadRoutingLocale[];
  notificationRecipients?: string[];
  partnerHandoffStatus?:
    | "not-applicable"
    | "pending-review"
    | "approved-to-share"
    | "shared"
    | "partner-accepted"
    | "partner-declined";
  productDirections?: string[];
  requestTypes?: string[];
  routingMode?:
    | "hq-direct"
    | "partner-candidate"
    | "partner-assigned"
    | "service-desk"
    | "manual-review";
};

export type LeadRoutingContext = {
  country: string;
  fallbackAssignedTeam: string;
  fallbackNotificationRecipients: string[];
  leadType: string;
  locale: string;
  productDirection: string | null;
  requestType: string;
};

export type LeadRoutingDecision = {
  assignedTeam: string;
  assignedToUser: string | null;
  matchedCriteria: string[];
  notificationRecipients: string[];
  partnerHandoffStatus: NonNullable<LeadRoutingRule["partnerHandoffStatus"]>;
  routingMode: NonNullable<LeadRoutingRule["routingMode"]>;
  routingRuleKey: string;
  routingSuggestion: string;
  safeTargetApplied: boolean;
};

const defaultRules: LeadRoutingRule[] = [
  {
    assignedTeam: "audio-concierge",
    countries: ["netherlands", "germany", "france", "belgium", "switzerland", "austria", "spain"],
    key: "audio-europe",
    leadTypes: ["private_listening", "system_architecture"],
    locales: ["en", "de", "fr", "es"],
    productDirections: ["hi-end-audio"],
  },
  {
    assignedTeam: "vision-atelier",
    key: "vision-apac",
    leadTypes: ["private_cinema_planning", "site_survey", "demo_content_review"],
    locales: ["ja", "zh"],
    partnerHandoffStatus: "pending-review",
    productDirections: [
      "vision-max",
      "invisible-display",
      "hologram",
      "pictorial-art-display",
      "exhibition-displays",
    ],
    routingMode: "manual-review",
  },
  {
    assignedTeam: "projects",
    key: "exhibition-projects",
    productDirections: ["exhibition-displays"],
    requestTypes: ["consultation", "integration", "support", "service"],
    routingMode: "service-desk",
  },
];

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeList(values: string[] | undefined) {
  return (values ?? []).map((value) => normalizeText(value)).filter(Boolean);
}

function parseCsvEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function parseSafeTargetRecipients() {
  return parseCsvEnv(process.env.MONTELAR_LEAD_NOTIFICATION_SAFE_TARGET);
}

function getFallbackOwner() {
  const owner = process.env.MONTELAR_LEAD_ROUTING_FALLBACK_OWNER?.trim();
  return owner && owner.length ? owner : "owner@montelar.example";
}

function getDefaultRuleOwner(team: string) {
  const envMap: Record<string, string | undefined> = {
    "audio-concierge": process.env.MONTELAR_AUDIO_LEAD_OWNER,
    audio: process.env.MONTELAR_AUDIO_LEAD_OWNER,
    exhibition: process.env.MONTELAR_EXHIBITION_LEAD_OWNER,
    projects: process.env.MONTELAR_EXHIBITION_LEAD_OWNER,
    vision: process.env.MONTELAR_VISION_LEAD_OWNER,
    "vision-atelier": process.env.MONTELAR_VISION_LEAD_OWNER,
  };
  const owner = envMap[team]?.trim();
  return owner && owner.length ? owner : getFallbackOwner();
}

function getDefaultRules() {
  return defaultRules.map((rule) => ({
    ...rule,
    assignedToUser:
      typeof rule.assignedTeam === "string" ? getDefaultRuleOwner(rule.assignedTeam) : getFallbackOwner(),
  }));
}

function parseJsonRules() {
  const raw = process.env.MONTELAR_LEAD_ROUTING_RULES_JSON?.trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => {
        const key = typeof entry.key === "string" ? entry.key.trim() : "";
        if (!key) {
          return null;
        }

        const toStringArray = (value: unknown) =>
          Array.isArray(value)
            ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
            : undefined;

        const rule: LeadRoutingRule = { key };
        const assignedTeam = typeof entry.assignedTeam === "string" ? entry.assignedTeam.trim() : "";
        const assignedToUser =
          typeof entry.assignedToUser === "string" ? entry.assignedToUser.trim() : "";
        const countries = toStringArray(entry.countries);
        const leadTypes = toStringArray(entry.leadTypes);
        const locales = toStringArray(entry.locales) as LeadRoutingLocale[] | undefined;
        const notificationRecipients = toStringArray(entry.notificationRecipients);
        const partnerHandoffStatus =
          typeof entry.partnerHandoffStatus === "string" ? entry.partnerHandoffStatus.trim() : "";
        const productDirections = toStringArray(entry.productDirections);
        const requestTypes = toStringArray(entry.requestTypes);
        const routingMode = typeof entry.routingMode === "string" ? entry.routingMode.trim() : "";

        if (assignedTeam) {
          rule.assignedTeam = assignedTeam;
        }
        if (assignedToUser) {
          rule.assignedToUser = assignedToUser;
        }
        if (countries && countries.length > 0) {
          rule.countries = countries;
        }
        if (leadTypes && leadTypes.length > 0) {
          rule.leadTypes = leadTypes;
        }
        if (locales && locales.length > 0) {
          rule.locales = locales;
        }
        if (notificationRecipients && notificationRecipients.length > 0) {
          rule.notificationRecipients = notificationRecipients;
        }
        if (
          partnerHandoffStatus === "not-applicable" ||
          partnerHandoffStatus === "pending-review" ||
          partnerHandoffStatus === "approved-to-share" ||
          partnerHandoffStatus === "shared" ||
          partnerHandoffStatus === "partner-accepted" ||
          partnerHandoffStatus === "partner-declined"
        ) {
          rule.partnerHandoffStatus = partnerHandoffStatus;
        }
        if (productDirections && productDirections.length > 0) {
          rule.productDirections = productDirections;
        }
        if (requestTypes && requestTypes.length > 0) {
          rule.requestTypes = requestTypes;
        }
        if (
          routingMode === "hq-direct" ||
          routingMode === "partner-candidate" ||
          routingMode === "partner-assigned" ||
          routingMode === "service-desk" ||
          routingMode === "manual-review"
        ) {
          rule.routingMode = routingMode;
        }

        return rule;
      })
      .filter((entry): entry is LeadRoutingRule => entry !== null);
  } catch {
    return [];
  }
}

function getRoutingRules() {
  const configured = parseJsonRules();
  return configured.length > 0 ? configured : getDefaultRules();
}

function matchesRule(rule: LeadRoutingRule, context: LeadRoutingContext) {
  const matchedCriteria: string[] = [];
  const locale = normalizeText(context.locale);
  const country = normalizeText(context.country);
  const leadType = normalizeText(context.leadType);
  const productDirection = normalizeText(context.productDirection);
  const requestType = normalizeText(context.requestType);

  const checks = [
    ["leadType", normalizeList(rule.leadTypes), leadType],
    ["productDirection", normalizeList(rule.productDirections), productDirection],
    ["locale", normalizeList(rule.locales), locale],
    ["country", normalizeList(rule.countries), country],
    ["requestType", normalizeList(rule.requestTypes), requestType],
  ] as const;

  for (const [label, ruleValues, candidate] of checks) {
    if (ruleValues.length === 0) {
      continue;
    }

    if (!ruleValues.includes(candidate)) {
      return null;
    }

    matchedCriteria.push(`${label}:${candidate}`);
  }

  return matchedCriteria;
}

export function resolveLeadRouting(context: LeadRoutingContext): LeadRoutingDecision {
  const fallbackOwner = getFallbackOwner();
  const safeTargetRecipients = parseSafeTargetRecipients();
  const rules = getRoutingRules();

  for (const rule of rules) {
    const matchedCriteria = matchesRule(rule, context);
    if (!matchedCriteria) {
      continue;
    }

    const assignedTeam = rule.assignedTeam?.trim() || context.fallbackAssignedTeam;
    const assignedToUser = rule.assignedToUser?.trim() || getDefaultRuleOwner(assignedTeam) || fallbackOwner;
    const rawRecipients =
      (rule.notificationRecipients ?? []).map((entry) => entry.trim()).filter(Boolean).length > 0
        ? (rule.notificationRecipients ?? []).map((entry) => entry.trim()).filter(Boolean)
        : context.fallbackNotificationRecipients;
    const notificationRecipients = safeTargetRecipients.length > 0 ? safeTargetRecipients : rawRecipients;
    const safeTargetApplied = safeTargetRecipients.length > 0;

    return {
      assignedTeam,
      assignedToUser,
      matchedCriteria,
      notificationRecipients,
      partnerHandoffStatus:
        rule.partnerHandoffStatus ||
        (context.fallbackAssignedTeam === "partner-candidate" ? "pending-review" : "not-applicable"),
      routingMode: rule.routingMode || "hq-direct",
      routingRuleKey: rule.key,
      routingSuggestion: `Rule ${rule.key} matched ${matchedCriteria.join(", ")}; owner ${assignedToUser}.${
        safeTargetApplied ? " Safe target override applied." : ""
      }`,
      safeTargetApplied,
    };
  }

  const fallbackRecipients =
    safeTargetRecipients.length > 0
      ? safeTargetRecipients
      : context.fallbackNotificationRecipients.length > 0
        ? context.fallbackNotificationRecipients
        : [fallbackOwner];

  return {
    assignedTeam: context.fallbackAssignedTeam,
    assignedToUser: fallbackOwner,
    matchedCriteria: ["fallback-owner"],
    notificationRecipients: fallbackRecipients,
    partnerHandoffStatus: "not-applicable",
    routingMode: "manual-review",
    routingRuleKey: "fallback-owner",
    routingSuggestion: `No specific routing rule matched; fallback owner ${fallbackOwner} assigned.${
      safeTargetRecipients.length > 0 ? " Safe target override applied." : ""
    }`,
    safeTargetApplied: safeTargetRecipients.length > 0,
  };
}
