import type { Payload } from "payload";

import { productSeeds } from "./catalog-seed.ts";

type ProductSeed = (typeof productSeeds)[number];

type SeedOperation = {
  id: number | string;
  operation: "created" | "updated";
  slug: string;
};

type LeadSeedOperation = {
  id: number | string;
  operation: "created" | "updated";
  referenceCode: string;
};

type InquiryFieldSeed = {
  fieldKey: string;
  fieldType:
    | "text"
    | "textarea"
    | "email"
    | "phone"
    | "select"
    | "multi-select"
    | "radio"
    | "number"
    | "file-placeholder"
    | "consent";
  helperText?: string;
  label: string;
  leadMappingKey: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required: boolean;
  width?: "full" | "half" | "third";
};

type InquiryFieldConfig = {
  helperText?: string;
  leadMappingKey?: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  width?: "full" | "half" | "third";
};

type InquiryFormSeed = {
  approvalStatus: "approved";
  autoReplyEnabled: boolean;
  autoReplyTemplateKey: string;
  consentProfile: string;
  consentText: string;
  contextSnapshotKeys: Array<{ key: string }>;
  description: string;
  documentContextMode: "none";
  fieldDefinitionsVersion: string;
  fieldGroups: Array<{
    groupKey: string;
    groupType: "contact" | "project" | "system" | "preferences" | "consent";
    summary: string;
    title: string;
  }>;
  fields: InquiryFieldSeed[];
  formMode: "product-inquiry" | "consultation-request" | "private-demo";
  governanceNotes: string;
  internalCode: string;
  isPrimaryForLocale: true;
  layoutMode: "split-sections";
  locale: "en";
  marketAvailabilityNotes: string;
  notificationEmails: Array<{ email: string }>;
  notificationTemplateKey: string;
  preselectedIntent: string;
  privacyNoticeLinkMode: "global-policy";
  productSlug: string;
  publicationNotes: string;
  rateLimitProfile: string;
  secondaryCtaLabel: string;
  shortLabel: string;
  slug: string;
  sourceOfTruthArtifact: string;
  status: "published";
  submissionChannel: "cms-lead";
  submissionTags: Array<{ tag: string }>;
  submitLabel: string;
  successMessage: string;
  successRedirectMode: "inline-message";
  successTitle: string;
  title: string;
};

type SampleLeadSeed = {
  assignedTeam: string;
  city: string;
  company: string;
  consentAcceptedAt: string;
  country: string;
  createdAt: string;
  displayName: string;
  email: string;
  internalTags: Array<{ tag: string }>;
  latestActivitySummary: string;
  message: string;
  notificationRecipients: Array<{ email: string }>;
  phone: string;
  preferredContactMethod: string;
  priority: "normal" | "high" | "vip" | "urgent";
  productSlug: string;
  qualificationSnapshot?: Array<{
    key: string;
    valueList?: Array<{ value: string }>;
    valueText?: string;
  }>;
  referenceCode: string;
  requestType: string;
  routingMode: "hq-direct" | "partner-candidate" | "partner-assigned" | "service-desk" | "manual-review";
  sourceChannel: "product-page" | "dealer-page" | "contact-page" | "admin-manual";
  sourcePagePath: string;
  sourcePageTitle: string;
  status: "new" | "reviewed" | "contacted" | "qualified" | "closed";
  statusHistory: Array<{
    changedAt: string;
    changedBy: string;
    fromStatus: string | null;
    note?: string;
    reason: string;
    source: string;
    toStatus: "new" | "reviewed" | "contacted" | "qualified" | "closed";
  }>;
  submissionFingerprint: string;
  timeline?: string;
  updatedAt: string;
};

const inquirySeedSourceArtifact =
  "docs/strategy/artifacts/MNT-ADMIN-020-inquiry-forms-and-sample-leads-seed.md";

const formFieldVersion = "mnt-admin-020-v1";

const publicProductSeeds = productSeeds.filter((product) => product.status === "review");

function option(value: string, label: string) {
  return { label, value };
}

function field(
  fieldKey: string,
  label: string,
  fieldType: InquiryFieldSeed["fieldType"],
  config: InquiryFieldConfig = {},
): InquiryFieldSeed {
  const result: InquiryFieldSeed = {
    fieldKey,
    fieldType,
    label,
    leadMappingKey: config.leadMappingKey ?? fieldKey,
    required: config.required ?? false,
    width: config.width ?? "full",
  };

  if (config.helperText) {
    result.helperText = config.helperText;
  }

  if (config.options) {
    result.options = config.options;
  }

  if (config.placeholder) {
    result.placeholder = config.placeholder;
  }

  return result;
}

function identityFields(): InquiryFieldSeed[] {
  return [
    field("fullName", "Full name", "text", { required: true, width: "half" }),
    field("email", "Email", "email", { required: true, width: "half" }),
    field("phone", "Phone", "phone", { width: "half" }),
    field("country", "Country", "text", { required: true, width: "half" }),
    field("city", "City", "text", { width: "half" }),
    field("company", "Company / studio / integrator", "text", {
      width: "half",
      placeholder: "Optional company, studio or integrator name",
    }),
    field("preferredLanguage", "Preferred language", "select", {
      width: "half",
      options: [
        option("en", "English"),
        option("ru", "Russian"),
        option("es", "Spanish"),
        option("fr", "French"),
        option("zh", "Chinese"),
        option("ja", "Japanese"),
        option("de", "German"),
      ],
    }),
  ];
}

function budgetBandField() {
  return field("budgetBand", "Indicative investment band", "select", {
    width: "half",
    options: [
      option("under-25k", "Under EUR 25k"),
      option("25k-75k", "EUR 25k - 75k"),
      option("75k-150k", "EUR 75k - 150k"),
      option("150k-plus", "EUR 150k+"),
      option("undisclosed", "Prefer to discuss privately"),
    ],
  });
}

function timelineField() {
  return field("timeline", "Project timeline", "select", {
    width: "half",
    options: [
      option("0-3-months", "0-3 months"),
      option("3-6-months", "3-6 months"),
      option("6-12-months", "6-12 months"),
      option("planning", "Planning phase"),
    ],
  });
}

function dealerPreferenceField() {
  return field("dealerPreference", "Routing preference", "radio", {
    width: "half",
    options: [
      option("direct-montelar", "Direct Montelar follow-up"),
      option("local-partner", "Local partner if available"),
      option("undecided", "Undecided"),
    ],
  });
}

function consentField(label: string) {
  return field("consent", label, "consent", {
    leadMappingKey: "consent",
    required: true,
    width: "full",
  });
}

function attachmentField(label: string) {
  return field("attachments", label, "file-placeholder", { width: "full" });
}

function toInternalCode(slug: string) {
  return `FORM_${slug.toUpperCase().replace(/-/g, "_")}_EN`;
}

function getFormMode(product: ProductSeed): InquiryFormSeed["formMode"] {
  if (product.primaryInquiryType === "private-demo") {
    return "private-demo";
  }

  if (product.primaryInquiryType === "consultation-request") {
    return "consultation-request";
  }

  return "product-inquiry";
}

function getRoutingMailbox(product: ProductSeed) {
  if (product.directionSlug === "vision-max" || product.directionSlug === "living-glass") {
    return "vision.concierge@montelar.example";
  }

  if (product.directionSlug === "pictorial-art-display") {
    return "creative.concierge@montelar.example";
  }

  if (product.directionSlug === "display-for-exhibition") {
    return "projects.concierge@montelar.example";
  }

  return "audio.concierge@montelar.example";
}

function buildFieldGroups(product: ProductSeed) {
  return [
    {
      groupKey: "contact",
      groupType: "contact" as const,
      summary: "Core identity and preferred communication channel.",
      title: "Contact",
    },
    {
      groupKey: "project",
      groupType: "project" as const,
      summary: `Project or system context for ${product.name}.`,
      title: "Project context",
    },
    {
      groupKey: "preferences",
      groupType: "preferences" as const,
      summary: "Routing and follow-up preferences for the advisory team.",
      title: "Preferences",
    },
    {
      groupKey: "consent",
      groupType: "consent" as const,
      summary: "Privacy and follow-up confirmation.",
      title: "Consent",
    },
  ];
}

function buildProductFields(product: ProductSeed): InquiryFieldSeed[] {
  if (product.directionSlug === "vision-max") {
    return [
      ...identityFields(),
      field("roomType", "Room type", "select", {
        required: true,
        width: "half",
        options: [
          option("dedicated-cinema", "Dedicated cinema"),
          option("media-salon", "Media salon"),
          option("hybrid-lounge", "Hybrid lounge"),
          option("new-build", "New build / shell"),
        ],
      }),
      field("roomScale", "Approximate room scale", "text", {
        required: true,
        width: "half",
        placeholder: "Area, ceiling height or seating envelope",
      }),
      field("seatingPlan", "Seating count", "number", { width: "half" }),
      field("projectStage", "Project stage", "radio", {
        required: true,
        width: "half",
        options: [
          option("concept", "Concept"),
          option("construction", "Construction"),
          option("fit-out", "Fit-out"),
          option("upgrade", "Upgrade"),
        ],
      }),
      field("experiencePriorities", "Experience priorities", "multi-select", {
        width: "full",
        options: [
          option("cinema-performance", "Cinema performance"),
          option("interior-integration", "Interior integration"),
          option("acoustic-comfort", "Acoustic comfort"),
          option("automation", "Automation and control"),
          option("family-use", "Family use"),
        ],
      }),
      field("architectOrIntegrator", "Architect / integrator involved", "text", { width: "half" }),
      budgetBandField(),
      timelineField(),
      field("projectBrief", "Room, usage and aesthetic brief", "textarea", {
        required: true,
        width: "full",
        placeholder: "Describe the room, project intent, expected screening use and decision timing",
      }),
      attachmentField("Plans, renderings or room references"),
      dealerPreferenceField(),
      consentField(
        "I agree that Montelar may review this internal test request and contact me about a private cinema consultation.",
      ),
    ];
  }

  if (product.directionSlug === "living-glass") {
    return [
      ...identityFields(),
      field("installationContext", "Installation context", "select", {
        required: true,
        width: "half",
        options: [
          option("residential", "Residential"),
          option("hospitality", "Hospitality"),
          option("retail", "Retail"),
          option("boardroom", "Boardroom"),
        ],
      }),
      field("glassType", "Existing or planned glazing", "text", {
        width: "half",
        placeholder: "Facade glass, partition wall, mirror surface...",
      }),
      field("contentUse", "Primary content use", "multi-select", {
        width: "half",
        options: [
          option("brand-film", "Brand film"),
          option("wayfinding", "Wayfinding"),
          option("ambient-art", "Ambient art"),
          option("information-layer", "Information layer"),
          option("private-screening", "Private screening"),
        ],
      }),
      field("transparencyPriority", "Transparency priority", "radio", {
        width: "half",
        options: [
          option("glass-first", "Glass-first presence"),
          option("balanced", "Balanced glass and image"),
          option("image-priority", "Image priority"),
        ],
      }),
      budgetBandField(),
      timelineField(),
      field("designNotes", "Architectural and coordination notes", "textarea", {
        required: true,
        width: "full",
        placeholder: "Share facade constraints, viewing conditions, lighting and installation ownership",
      }),
      attachmentField("Glass elevations, moodboards or site photos"),
      dealerPreferenceField(),
      consentField(
        "I agree that Montelar may review this internal test request and contact me about a transparent-display consultation.",
      ),
    ];
  }

  if (product.directionSlug === "pictorial-art-display") {
    return [
      ...identityFields(),
      field("placementContext", "Placement context", "text", {
        required: true,
        width: "half",
        placeholder: "Residence, salon, gallery, suite...",
      }),
      field("artMode", "Content mode", "radio", {
        required: true,
        width: "half",
        options: [
          option("still-art", "Still art"),
          option("motion-art", "Curated motion"),
          option("mixed", "Mixed program"),
        ],
      }),
      field("wallConditions", "Wall conditions", "text", {
        width: "half",
        placeholder: "Wall width, mounting depth, lighting constraints",
      }),
      field("controlPreference", "Control preference", "select", {
        width: "half",
        options: [
          option("discreet-local", "Discreet local control"),
          option("app", "App-based control"),
          option("integrated-automation", "Integrated automation"),
          option("undecided", "Undecided"),
        ],
      }),
      budgetBandField(),
      timelineField(),
      field("curationBrief", "Curation and interior brief", "textarea", {
        required: true,
        width: "full",
        placeholder: "Describe the intended art rhythm, room mood and ownership expectations",
      }),
      attachmentField("Wall references, artwork palette or interior moodboard"),
      dealerPreferenceField(),
      consentField(
        "I agree that Montelar may review this internal test request and contact me about a pictorial-art consultation.",
      ),
    ];
  }

  if (product.directionSlug === "display-for-exhibition") {
    return [
      ...identityFields(),
      field("venueType", "Venue type", "select", {
        required: true,
        width: "half",
        options: [
          option("museum", "Museum"),
          option("gallery", "Gallery"),
          option("showroom", "Showroom"),
          option("brand-space", "Brand space"),
          option("traveling-exhibition", "Traveling exhibition"),
        ],
      }),
      field("interactionMode", "Interaction mode", "multi-select", {
        required: true,
        width: "half",
        options: [
          option("touch-navigation", "Touch navigation"),
          option("guided-story", "Guided story"),
          option("multilingual-layer", "Multilingual layer"),
          option("object-lookup", "Object lookup"),
          option("staff-assisted", "Staff-assisted use"),
        ],
      }),
      field("visitorFlow", "Visitor flow and duty cycle", "textarea", {
        width: "full",
        placeholder: "Expected audience density, session rhythm and durability requirements",
      }),
      field("contentOperation", "Content operation owner", "text", {
        width: "half",
        placeholder: "Curator, museum team, integrator, brand team...",
      }),
      field("controlStack", "Control or CMS context", "text", { width: "half" }),
      budgetBandField(),
      timelineField(),
      field("installationBrief", "Installation and integration brief", "textarea", {
        required: true,
        width: "full",
        placeholder: "Share fixture context, service access, environmental notes and launch date",
      }),
      attachmentField("Plans, elevations or exhibition references"),
      dealerPreferenceField(),
      consentField(
        "I agree that Montelar may review this internal test request and contact me about an exhibition-display consultation.",
      ),
    ];
  }

  const connectionField =
    product.slug.includes("digital")
      ? field("signalInterface", "Primary digital interface", "select", {
          required: true,
          width: "half",
          options: [
            option("usb", "USB"),
            option("aes-ebu", "AES/EBU"),
            option("coaxial", "Coaxial"),
            option("network", "Network / streaming"),
            option("undecided", "Undecided"),
          ],
        })
      : product.slug.includes("power")
        ? field("powerRegion", "Power region", "select", {
            required: true,
            width: "half",
            options: [
              option("eu-230v", "EU 230V"),
              option("uk-230v", "UK 230V"),
              option("us-120v", "US 120V"),
              option("mixed", "Mixed estate"),
            ],
          })
        : product.slug.includes("speaker")
          ? field("speakerTermination", "Speaker termination preference", "select", {
              required: true,
              width: "half",
              options: [
                option("banana", "Banana"),
                option("spade", "Spade"),
                option("mixed", "Mixed / undecided"),
              ],
            })
          : field("connectionStandard", "Connection standard", "select", {
              required: true,
              width: "half",
              options: [
                option("xlr", "XLR"),
                option("rca", "RCA"),
                option("mixed", "Mixed / undecided"),
              ],
            });

  return [
    ...identityFields(),
    field("systemRole", "System role", "select", {
      required: true,
      width: "half",
      options: [
        option("source-front-end", "Source front end"),
        option("reference-stereo", "Reference stereo"),
        option("hybrid-cinema", "Hybrid cinema / stereo"),
        option("dealer-showroom", "Dealer / showroom"),
      ],
    }),
    connectionField,
    field("currentComponents", "Current or planned components", "textarea", {
      required: true,
      width: "full",
      placeholder: "List source, DAC, amplifier, loudspeakers and any relevant infrastructure",
    }),
    field("cableLength", "Approximate run length", "text", {
      width: "half",
      placeholder: "Per run or total estimate",
    }),
    field("finishRouting", "Finish, routing or installation notes", "textarea", {
      width: "half",
      placeholder: "Visible run, equipment rack, concealed install, furniture constraint...",
    }),
    budgetBandField(),
    timelineField(),
    field("advisoryGoal", "Advisory goal", "textarea", {
      required: true,
      width: "full",
      placeholder: "System voicing, infrastructure cleanup, dedicated upgrade or specification support",
    }),
    attachmentField("Rack photo, system diagram or installation notes"),
    dealerPreferenceField(),
    consentField(
      "I agree that Montelar may review this internal test request and contact me about a product consultation.",
    ),
  ];
}

function buildInquiryFormSeed(product: ProductSeed): InquiryFormSeed {
  const routingMailbox = getRoutingMailbox(product);
  const formMode = getFormMode(product);
  const fields = buildProductFields(product);

  return {
    approvalStatus: "approved",
    autoReplyEnabled: false,
    autoReplyTemplateKey: `autoreply-${product.slug}`,
    consentProfile: "product-inquiry-default",
    consentText: `Internal seed baseline for ${product.name}. Montelar may review the request and use the captured details for advisory follow-up.`,
    contextSnapshotKeys: [
      { key: "productSlug" },
      { key: "sourcePagePath" },
      { key: "locale" },
      { key: "requestType" },
    ],
    description: product.shortDescription,
    documentContextMode: "none",
    fieldDefinitionsVersion: formFieldVersion,
    fieldGroups: buildFieldGroups(product),
    fields,
    formMode,
    governanceNotes:
      "Seeded under MNT-ADMIN-020 as a source-locale primary form for the current public product baseline. Keep editable in admin.",
    internalCode: toInternalCode(product.slug),
    isPrimaryForLocale: true,
    layoutMode: "split-sections",
    locale: "en",
    marketAvailabilityNotes: `${product.availabilityMode} product seeded for advisory and inbox verification.`,
    notificationEmails: [{ email: routingMailbox }],
    notificationTemplateKey: `lead-${product.slug}`,
    preselectedIntent: product.primaryInquiryType,
    privacyNoticeLinkMode: "global-policy",
    productSlug: product.slug,
    publicationNotes:
      "Seed-safe public baseline only. Final localized copy and routing refinements remain editable in admin.",
    rateLimitProfile: "product-inquiry-default",
    secondaryCtaLabel: "Contact Montelar",
    shortLabel: product.publicLabel,
    slug: `${product.slug}-en`,
    sourceOfTruthArtifact: inquirySeedSourceArtifact,
    status: "published",
    submissionChannel: "cms-lead",
    submissionTags: [
      { tag: "seeded-source-locale" },
      { tag: product.directionSlug },
      { tag: product.primaryInquiryType },
    ],
    submitLabel:
      formMode === "private-demo"
        ? "Request private consultation"
        : formMode === "consultation-request"
          ? "Request consultation"
          : "Send inquiry",
    successMessage:
      formMode === "private-demo"
        ? "The request was saved for a private Montelar consultation."
        : "The request was saved for a guided Montelar follow-up.",
    successRedirectMode: "inline-message",
    successTitle: formMode === "private-demo" ? "Consultation request captured" : "Inquiry captured",
    title:
      formMode === "private-demo"
        ? `Request ${product.name} consultation`
        : `Discuss ${product.name}`,
  };
}

const inquiryFormSeeds = publicProductSeeds.map(buildInquiryFormSeed);

function findPublicProductSeed(slug: string) {
  const product = publicProductSeeds.find((entry) => entry.slug === slug);

  if (!product) {
    throw new Error(`Inquiry seed failed: no public product seed found for ${slug}.`);
  }

  return product;
}

function findFormSeed(slug: string) {
  const form = inquiryFormSeeds.find((entry) => entry.productSlug === slug);

  if (!form) {
    throw new Error(`Inquiry seed failed: no form seed found for ${slug}.`);
  }

  return form;
}

function buildSampleLeadSeeds(): SampleLeadSeed[] {
  return [
    {
      assignedTeam: "vision-concierge",
      city: "Amsterdam",
      company: "Private Cinema Studio",
      consentAcceptedAt: "2026-05-10T09:00:00.000Z",
      country: "Netherlands",
      createdAt: "2026-05-10T09:00:00.000Z",
      displayName: "Анна ван дер Меер",
      email: "internal-test+vision-max@montelar.example",
      internalTags: [{ tag: "internal-test-data" }, { tag: "seed-sample" }, { tag: "do-not-analytics" }],
      latestActivitySummary: "Нужно согласовать частный показ и уточнить стадию строительства.",
      message: "Клиент планирует отдельный кинозал и просит консультацию по Vision MAX Premium.",
      notificationRecipients: [{ email: "vision.concierge@montelar.example" }],
      phone: "+31 20 555 0101",
      preferredContactMethod: "email",
      priority: "vip",
      productSlug: "vision-max-premium",
      qualificationSnapshot: [
        { key: "roomType", valueText: "dedicated-cinema" },
        { key: "projectStage", valueText: "construction" },
      ],
      referenceCode: "LD-20260510-TEST01",
      requestType: "private-demo",
      routingMode: "hq-direct",
      sourceChannel: "product-page",
      sourcePagePath: "/en/request/vision-max-premium",
      sourcePageTitle: "Request Vision MAX Premium",
      status: "new",
      statusHistory: [
        {
          changedAt: "2026-05-10T09:00:00.000Z",
          changedBy: "seed-script",
          fromStatus: null,
          reason: "Seeded internal preview sample.",
          source: "seed-script",
          toStatus: "new",
        },
      ],
      submissionFingerprint: "seed-vision-max-01",
      timeline: "3-6-months",
      updatedAt: "2026-05-10T09:00:00.000Z",
    },
    {
      assignedTeam: "audio-concierge",
      city: "Munich",
      company: "Аудиосалон Schwarzraum",
      consentAcceptedAt: "2026-05-10T09:20:00.000Z",
      country: "Germany",
      createdAt: "2026-05-10T09:20:00.000Z",
      displayName: "Маркус Вебер",
      email: "internal-test+prima-speaker@montelar.example",
      internalTags: [{ tag: "internal-test-data" }, { tag: "seed-sample" }, { tag: "partner-route" }],
      latestActivitySummary: "Нужно уточнить систему клиента и длины кабельных трасс.",
      message: "Дилер просит помочь подобрать кабельную связку Prima Materia для демонстрационной системы.",
      notificationRecipients: [{ email: "audio.concierge@montelar.example" }],
      phone: "+49 89 555 0102",
      preferredContactMethod: "email",
      priority: "high",
      productSlug: "prima-materia-lux-speaker",
      qualificationSnapshot: [
        { key: "systemRole", valueText: "reference-stereo" },
        { key: "speakerTermination", valueText: "spade" },
      ],
      referenceCode: "LD-20260510-TEST02",
      requestType: "product-inquiry",
      routingMode: "partner-candidate",
      sourceChannel: "dealer-page",
      sourcePagePath: "/en/request/prima-materia-lux-speaker",
      sourcePageTitle: "Prima Materia LUX Speaker",
      status: "reviewed",
      statusHistory: [
        {
          changedAt: "2026-05-10T09:20:00.000Z",
          changedBy: "seed-script",
          fromStatus: null,
          reason: "Seeded internal preview sample.",
          source: "seed-script",
          toStatus: "new",
        },
        {
          changedAt: "2026-05-10T10:15:00.000Z",
          changedBy: "seed-script",
          fromStatus: "new",
          note: "Held in reviewed state so the inbox is not empty beyond new items.",
          reason: "Internal routing sample.",
          source: "seed-script",
          toStatus: "reviewed",
        },
      ],
      submissionFingerprint: "seed-prima-speaker-02",
      timeline: "planning",
      updatedAt: "2026-05-10T10:15:00.000Z",
    },
    {
      assignedTeam: "vision-concierge",
      city: "Dubai",
      company: "Atelier Lumiere",
      consentAcceptedAt: "2026-05-10T09:40:00.000Z",
      country: "United Arab Emirates",
      createdAt: "2026-05-10T09:40:00.000Z",
      displayName: "Лина Хаддад",
      email: "internal-test+living-glass@montelar.example",
      internalTags: [{ tag: "internal-test-data" }, { tag: "seed-sample" }, { tag: "routed-case" }],
      latestActivitySummary: "Нужно согласовать размеры стекла, освещение и ответственного интегратора.",
      message: "Архитектурное бюро готовит проект с прозрачным экраном Living Glass для зоны приёма.",
      notificationRecipients: [{ email: "vision.concierge@montelar.example" }],
      phone: "+971 4 555 0103",
      preferredContactMethod: "phone",
      priority: "urgent",
      productSlug: "living-glass-oled",
      qualificationSnapshot: [
        { key: "installationContext", valueText: "hospitality" },
        { key: "contentUse", valueList: [{ value: "brand-film" }, { value: "ambient-art" }] },
      ],
      referenceCode: "LD-20260510-TEST03",
      requestType: "consultation-request",
      routingMode: "partner-assigned",
      sourceChannel: "contact-page",
      sourcePagePath: "/en/request/living-glass-oled",
      sourcePageTitle: "Living Glass OLED",
      status: "qualified",
      statusHistory: [
        {
          changedAt: "2026-05-10T09:40:00.000Z",
          changedBy: "seed-script",
          fromStatus: null,
          reason: "Seeded internal preview sample.",
          source: "seed-script",
          toStatus: "new",
        },
        {
          changedAt: "2026-05-10T11:00:00.000Z",
          changedBy: "seed-script",
          fromStatus: "new",
          reason: "Qualified routed sample for inbox filters.",
          source: "seed-script",
          toStatus: "qualified",
        },
      ],
      submissionFingerprint: "seed-living-glass-03",
      timeline: "6-12-months",
      updatedAt: "2026-05-10T11:00:00.000Z",
    },
    {
      assignedTeam: "projects-concierge",
      city: "Paris",
      company: "Galerie Marceau",
      consentAcceptedAt: "2026-05-10T10:00:00.000Z",
      country: "France",
      createdAt: "2026-05-10T10:00:00.000Z",
      displayName: "Клер Дюпон",
      email: "internal-test+exhibition-wall@montelar.example",
      internalTags: [{ tag: "internal-test-data" }, { tag: "seed-sample" }, { tag: "service-case" }],
      latestActivitySummary: "Клиент ждёт план обслуживания и сроки обновления контента.",
      message: "Музейная команда уточняет сервисное сопровождение интерактивной стены для новой экспозиции.",
      notificationRecipients: [{ email: "projects.concierge@montelar.example" }],
      phone: "+33 1 55 50 0104",
      preferredContactMethod: "email",
      priority: "normal",
      productSlug: "exhibition-wall",
      qualificationSnapshot: [
        { key: "venueType", valueText: "museum" },
        { key: "interactionMode", valueList: [{ value: "guided-story" }] },
      ],
      referenceCode: "LD-20260510-TEST04",
      requestType: "service-follow-up",
      routingMode: "service-desk",
      sourceChannel: "admin-manual",
      sourcePagePath: "/en/request/exhibition-wall",
      sourcePageTitle: "Exhibition Wall",
      status: "contacted",
      statusHistory: [
        {
          changedAt: "2026-05-10T10:00:00.000Z",
          changedBy: "seed-script",
          fromStatus: null,
          reason: "Seeded internal preview sample.",
          source: "seed-script",
          toStatus: "new",
        },
        {
          changedAt: "2026-05-10T12:10:00.000Z",
          changedBy: "seed-script",
          fromStatus: "new",
          reason: "Contacted service-style sample for inbox state coverage.",
          source: "seed-script",
          toStatus: "contacted",
        },
      ],
      submissionFingerprint: "seed-exhibition-wall-04",
      timeline: "0-3-months",
      updatedAt: "2026-05-10T12:10:00.000Z",
    },
  ];
}

const sampleLeadSeeds = buildSampleLeadSeeds();

async function findProductBySlug(payload: Payload, slug: string) {
  const result = await payload.find({
    collection: "products",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  return (result.docs[0] as { id?: number | string } | undefined) ?? null;
}

async function findInquiryFormByInternalCode(payload: Payload, internalCode: string) {
  const result = await payload.find({
    collection: "productInquiryForms",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      internalCode: {
        equals: internalCode,
      },
    },
  });

  return (result.docs[0] as { id?: number | string } | undefined) ?? null;
}

async function findLeadByReferenceCode(payload: Payload, referenceCode: string) {
  const result = await payload.find({
    collection: "leads",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    showHiddenFields: true,
    where: {
      referenceCode: {
        equals: referenceCode,
      },
    },
  });

  return (result.docs[0] as { id?: number | string } | undefined) ?? null;
}

function requireDocumentId(value: { id?: number | string } | null, label: string) {
  if (!value || (typeof value.id !== "number" && typeof value.id !== "string")) {
    throw new Error(`Inquiry seed failed: missing ${label}.`);
  }

  return value.id;
}

async function upsertInquiryForm(payload: Payload, seed: InquiryFormSeed): Promise<SeedOperation> {
  const product = await findProductBySlug(payload, seed.productSlug);
  const productId = requireDocumentId(product, `product ${seed.productSlug}`);
  const existing = await findInquiryFormByInternalCode(payload, seed.internalCode);
  const data = {
    approvalStatus: seed.approvalStatus,
    autoReplyEnabled: seed.autoReplyEnabled,
    autoReplyTemplateKey: seed.autoReplyTemplateKey,
    consentProfile: seed.consentProfile,
    consentText: seed.consentText,
    contextSnapshotKeys: seed.contextSnapshotKeys,
    description: seed.description,
    documentContextMode: seed.documentContextMode,
    fieldDefinitionsVersion: seed.fieldDefinitionsVersion,
    fieldGroups: seed.fieldGroups,
    fields: seed.fields,
    formMode: seed.formMode,
    governanceNotes: seed.governanceNotes,
    internalCode: seed.internalCode,
    isPrimaryForLocale: seed.isPrimaryForLocale,
    layoutMode: seed.layoutMode,
    locale: seed.locale,
    marketAvailabilityNotes: seed.marketAvailabilityNotes,
    notificationEmails: seed.notificationEmails,
    notificationTemplateKey: seed.notificationTemplateKey,
    preselectedIntent: seed.preselectedIntent,
    privacyNoticeLinkMode: seed.privacyNoticeLinkMode,
    product: productId,
    primaryLocale: seed.locale,
    publicationNotes: seed.publicationNotes,
    rateLimitProfile: seed.rateLimitProfile,
    secondaryCtaLabel: seed.secondaryCtaLabel,
    shortLabel: seed.shortLabel,
    slug: seed.slug,
    sourceOfTruthArtifact: seed.sourceOfTruthArtifact,
    status: seed.status,
    submissionChannel: seed.submissionChannel,
    submissionTags: seed.submissionTags,
    submitLabel: seed.submitLabel,
    successMessage: seed.successMessage,
    successRedirectMode: seed.successRedirectMode,
    successTitle: seed.successTitle,
    title: seed.title,
  };

  if (existing) {
    const updated = (await payload.update({
      collection: "productInquiryForms",
      data: data as never,
      id: requireDocumentId(existing, `form ${seed.internalCode}`),
      overrideAccess: true,
      showHiddenFields: true,
    } as never)) as unknown as { id: number | string };

    return { id: updated.id, operation: "updated", slug: seed.slug };
  }

  const created = (await payload.create({
    collection: "productInquiryForms",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  } as never)) as unknown as { id: number | string };

  return { id: created.id, operation: "created", slug: seed.slug };
}

function buildSubmittedFieldSnapshot(form: InquiryFormSeed, seed: SampleLeadSeed) {
  const values = new Map<string, { valueBoolean?: boolean; valueList?: Array<{ value: string }>; valueText?: string }>([
    ["fullName", { valueText: seed.displayName }],
    ["email", { valueText: seed.email }],
    ["phone", { valueText: seed.phone }],
    ["country", { valueText: seed.country }],
    ["city", { valueText: seed.city }],
    ["company", { valueText: seed.company }],
    ["timeline", { valueText: seed.timeline ?? "" }],
    ["consent", { valueBoolean: true }],
  ]);

  for (const item of seed.qualificationSnapshot ?? []) {
    const nextValue: {
      valueBoolean?: boolean;
      valueList?: Array<{ value: string }>;
      valueText?: string;
    } = {};

    if (item.valueList) {
      nextValue.valueList = item.valueList;
    }

    if (item.valueText) {
      nextValue.valueText = item.valueText;
    }

    values.set(item.key, nextValue);
  }

  return form.fields
    .filter((entry) => values.has(entry.fieldKey))
    .map((entry) => {
      const value = values.get(entry.fieldKey) ?? {};

      return {
        fieldKey: entry.fieldKey,
        fieldType: entry.fieldType,
        label: entry.label,
        leadMappingKey: entry.leadMappingKey,
        valueBoolean: value.valueBoolean,
        valueList: value.valueList,
        valueText: value.valueText,
      };
    });
}

async function upsertSampleLead(payload: Payload, seed: SampleLeadSeed): Promise<LeadSeedOperation> {
  const product = findPublicProductSeed(seed.productSlug);
  const form = findFormSeed(seed.productSlug);
  const existing = await findLeadByReferenceCode(payload, seed.referenceCode);
  const submittedFieldSnapshot = buildSubmittedFieldSnapshot(form, seed);
  const data = {
    assignedTeam: seed.assignedTeam,
    city: seed.city,
    company: seed.company,
    consentAcceptedAt: seed.consentAcceptedAt,
    consentLocale: "en",
    consentProfile: form.consentProfile,
    consentTextSnapshot: form.consentText,
    consentVersion: formFieldVersion,
    contextSnapshot: [
      { key: "productSlug", value: seed.productSlug },
      { key: "sourcePagePath", value: seed.sourcePagePath },
      { key: "seedType", value: "internal-test-data" },
    ],
    country: seed.country,
    createdAt: seed.createdAt,
    displayName: seed.displayName,
    email: seed.email,
    form: form.slug,
    individualOrOrganization: "organization",
    internalTags: seed.internalTags,
    lastStatusChangedAt: seed.statusHistory[seed.statusHistory.length - 1]?.changedAt ?? seed.updatedAt,
    latestActivitySummary: seed.latestActivitySummary,
    leadType: seed.requestType,
    locale: "en",
    message: seed.message,
    notificationDeliveryMode: "seed-sample",
    notificationRecipients: seed.notificationRecipients,
    notificationStatus: "seeded-sample",
    ownerNotes:
      "Internal seeded sample lead. Do not contact externally. Exclude from analytics and reporting.",
    partnerHandoffStatus:
      seed.routingMode === "partner-assigned"
        ? "shared"
        : seed.routingMode === "partner-candidate"
          ? "pending-review"
          : "not-applicable",
    phone: seed.phone,
    preferredContactMethod: seed.preferredContactMethod,
    preferredLanguage: "en",
    priority: seed.priority,
    product: seed.productSlug,
    productCategory: product.categorySlug,
    productDirection: product.directionSlug,
    productLine: product.lineSlug,
    qualificationSnapshot: seed.qualificationSnapshot,
    referenceCode: seed.referenceCode,
    requestType: seed.requestType,
    resolution: seed.status === "closed" ? "support-complete" : "open",
    routingMode: seed.routingMode,
    routingRuleKey: "seed-internal-sample",
    routingSuggestion:
      seed.routingMode === "service-desk"
        ? "Hold as service-style sample coverage."
        : "Hold as internal seeded workflow coverage.",
    sourceChannel: seed.sourceChannel,
    sourceOfTruthArtifact: inquirySeedSourceArtifact,
    sourcePagePath: seed.sourcePagePath,
    sourcePageTitle: seed.sourcePageTitle,
    spamReviewState: "internal-test-data",
    status: seed.status,
    statusHistory: seed.statusHistory,
    submittedFieldSnapshot,
    submissionFingerprint: seed.submissionFingerprint,
    updatedAt: seed.updatedAt,
  };

  if (seed.routingMode === "partner-assigned") {
    (data as Record<string, unknown>).assignedPartnerLabel = "Internal seed partner route";
  }

  if (seed.status === "new") {
    (data as Record<string, unknown>).nextActionAt = "2026-05-12T10:00:00.000Z";
  }

  if (seed.timeline) {
    (data as Record<string, unknown>).timeline = seed.timeline;
  }

  if (existing) {
    const updated = (await payload.update({
      collection: "leads",
      data: data as never,
      id: requireDocumentId(existing, `lead ${seed.referenceCode}`),
      overrideAccess: true,
      showHiddenFields: true,
    } as never)) as unknown as { id: number | string };

    return {
      id: updated.id,
      operation: "updated",
      referenceCode: seed.referenceCode,
    };
  }

  const created = (await payload.create({
    collection: "leads",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  } as never)) as unknown as { id: number | string };

  return {
    id: created.id,
    operation: "created",
    referenceCode: seed.referenceCode,
  };
}

export async function syncInquiryFormsAndSampleLeads(payload: Payload) {
  const formOperations: SeedOperation[] = [];
  const leadOperations: LeadSeedOperation[] = [];

  for (const seed of inquiryFormSeeds) {
    formOperations.push(await upsertInquiryForm(payload, seed));
  }

  for (const seed of sampleLeadSeeds) {
    leadOperations.push(await upsertSampleLead(payload, seed));
  }

  return {
    formCount: inquiryFormSeeds.length,
    formOperations,
    publicProductCount: publicProductSeeds.length,
    sampleLeadCount: sampleLeadSeeds.length,
    leadOperations,
  };
}
