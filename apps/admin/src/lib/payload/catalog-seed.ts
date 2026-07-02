import type { Payload } from "payload";

import { syncWaveZeroPlatform } from "./platform-seed.ts";

type DirectionSeed = {
  canonicalPath: string;
  defaultInquiryType: string;
  directionFamily: "audio" | "vision" | "art-objects" | "projects";
  indexable: boolean;
  internalCode: string;
  name: string;
  navigationLabel?: string;
  order: number;
  positioningStatement: string;
  primaryLocale: "en";
  publicLabel: string;
  routeSegment: string;
  shortDescription: string;
  slug: string;
  sourceOfTruthArtifact: string;
  status: "published";
  translationPriority: "high" | "normal";
  visibilityInNavigation: boolean;
};

type CategorySeed = {
  categoryKind: "hardware-family" | "technology-family" | "material-program" | "solution-family";
  canonicalPath: string;
  defaultInquiryType: string;
  directionSlug: string;
  indexable: boolean;
  internalCode: string;
  name: string;
  order: number;
  positioningStatement: string;
  primaryLocale: "en";
  productLineMode: "not-used" | "optional" | "required";
  publicLabel: string;
  routeSegment: string;
  shortDescription: string;
  slug: string;
  sourceOfTruthArtifact: string;
  status: "published";
  translationPriority: "high" | "normal";
  visibilityInNavigation: boolean;
};

type ProductLineSeed = {
  canonicalPath: string;
  categorySlug: string;
  defaultInquiryType: string;
  directionSlug: string;
  indexable: boolean;
  internalCode: string;
  lineKind: "tier" | "series" | "platform" | "family" | "program";
  lineNarrativeMode: "editorial" | "comparison" | "catalog" | "project-led";
  name: string;
  order: number;
  positioningStatement: string;
  primaryLocale: "en";
  productCountHint: number;
  publicLabel: string;
  routeSegment: string;
  shortDescription: string;
  slug: string;
  sourceOfTruthArtifact: string;
  status: "published";
  translationPriority: "high" | "normal";
  visibilityInNavigation: boolean;
};

type ProductSeed = {
  availabilityMode:
    | "on-request"
    | "made-to-order"
    | "limited-series"
    | "dealer-only"
    | "private-consultation";
  canonicalPath: string;
  categorySlug?: string;
  directionSlug: string;
  indexable: boolean;
  internalCode: string;
  launchStage: "concept" | "planned" | "active" | "signature" | "limited";
  lineSlug?: string;
  name: string;
  order: number;
  ownerReviewRequired?: boolean;
  positioningStatement: string;
  primaryInquiryType: string;
  primaryLocale: "en";
  productKind: "physical-product" | "system" | "installation-solution" | "service-led-offer";
  publicLabel: string;
  publicationNotes?: string;
  routeSegment: string;
  shortDescription: string;
  slug: string;
  sourceOfTruthArtifact: string;
  status: "draft" | "review";
  subtitle?: string;
  translationPriority: "high" | "normal";
  variantReadiness: {
    blockedPublicClaims: number;
    publishedVariants: number;
    readinessState: "no-variants";
    reviewVariants: number;
    totalVariants: number;
    validatedPublicClaims: number;
  };
  visibilityInFilters: boolean;
  visibilityInNavigation: boolean;
};

type SeedOperation = {
  id: number | string;
  operation: "created" | "updated";
  slug: string;
};

export const catalogSeedSourceArtifact =
  "docs/strategy/artifacts/MNT-ADMIN-018-catalog-hierarchy-seed.md";

export const productDirectionSeeds: DirectionSeed[] = [
  {
    canonicalPath: "/vision-max",
    defaultInquiryType: "private-demo",
    directionFamily: "vision",
    indexable: true,
    internalCode: "DIR_VISION_MAX",
    name: "Vision MAX",
    order: 10,
    positioningStatement:
      "Private cinema architecture designed as a room-first Montelar program rather than an equipment list.",
    primaryLocale: "en",
    publicLabel: "Vision MAX",
    routeSegment: "vision-max",
    shortDescription: "Private cinema environments and immersive screening systems.",
    slug: "vision-max",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-031-vision-max-product-strategy.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
  {
    canonicalPath: "/audio",
    defaultInquiryType: "product-inquiry",
    directionFamily: "audio",
    indexable: true,
    internalCode: "DIR_HI_END_AUDIO",
    name: "Hi-end Audio",
    order: 20,
    positioningStatement:
      "Reference listening systems, source components, amplification and cable architecture under one restrained audio direction.",
    primaryLocale: "en",
    publicLabel: "Hi-end Audio",
    routeSegment: "audio",
    shortDescription: "Loudspeakers, source components, amplification and cable systems.",
    slug: "hi-end-audio",
    sourceOfTruthArtifact: "docs/strategy/04-product-taxonomy.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
  {
    canonicalPath: "/invisible-display",
    defaultInquiryType: "consultation-request",
    directionFamily: "vision",
    indexable: true,
    internalCode: "DIR_LIVING_GLASS",
    name: "Living Glass",
    order: 30,
    positioningStatement:
      "Transparent display surfaces that behave like architectural glass until image is intentionally introduced.",
    primaryLocale: "en",
    publicLabel: "Living Glass",
    routeSegment: "invisible-display",
    shortDescription: "Transparent display surfaces for residential and branded interiors.",
    slug: "living-glass",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-044-product-naming-consistency-pass.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
  {
    canonicalPath: "/hologram",
    defaultInquiryType: "consultation-request",
    directionFamily: "vision",
    indexable: true,
    internalCode: "DIR_HOLOGRAM",
    name: "Hologram",
    order: 40,
    positioningStatement:
      "Spatial presentation systems for collectible, retail and event contexts where theatrical image volume matters.",
    primaryLocale: "en",
    publicLabel: "Hologram",
    routeSegment: "hologram",
    shortDescription: "Spatial presentation systems for collectible, retail and event contexts.",
    slug: "hologram",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-044-product-naming-consistency-pass.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
  {
    canonicalPath: "/pictorial-art-display",
    defaultInquiryType: "consultation-request",
    directionFamily: "art-objects",
    indexable: true,
    internalCode: "DIR_PICTORIAL_ART_DISPLAY",
    name: "Pictorial Art Display",
    order: 50,
    positioningStatement:
      "Digital art objects treated as compositional interior elements rather than commodity screens.",
    primaryLocale: "en",
    publicLabel: "Pictorial Art Display",
    routeSegment: "pictorial-art-display",
    shortDescription: "Framed digital art objects with architectural integration.",
    slug: "pictorial-art-display",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-044-product-naming-consistency-pass.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
  {
    canonicalPath: "/exhibition-displays",
    defaultInquiryType: "consultation-request",
    directionFamily: "projects",
    indexable: true,
    internalCode: "DIR_DISPLAY_FOR_EXHIBITION",
    name: "Display for Exhibition",
    navigationLabel: "Exhibition Displays",
    order: 60,
    positioningStatement:
      "Embedded touch surfaces and guided interpretation layers for premium exhibition and showroom programs.",
    primaryLocale: "en",
    publicLabel: "Display for Exhibition",
    routeSegment: "exhibition-displays",
    shortDescription: "Embedded touch surfaces for premium exhibition and showroom programs.",
    slug: "display-for-exhibition",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-044-product-naming-consistency-pass.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
];

export const productCategorySeeds: CategorySeed[] = [
  {
    categoryKind: "hardware-family",
    canonicalPath: "/audio/speakers",
    defaultInquiryType: "product-inquiry",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "CAT_AUDIO_SPEAKERS",
    name: "Speakers",
    order: 10,
    positioningStatement: "Reference loudspeaker programs and room-scaled acoustic statements.",
    primaryLocale: "en",
    productLineMode: "optional",
    publicLabel: "Speakers",
    routeSegment: "speakers",
    shortDescription: "Reference loudspeaker programs and room-scaled acoustic statements.",
    slug: "speakers",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-025-cms-seed-content-plan.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
  {
    categoryKind: "technology-family",
    canonicalPath: "/audio/streamers",
    defaultInquiryType: "product-inquiry",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "CAT_AUDIO_STREAMERS",
    name: "Streamers",
    order: 20,
    positioningStatement: "Network source components for a controlled digital front end.",
    primaryLocale: "en",
    productLineMode: "optional",
    publicLabel: "Streamers",
    routeSegment: "streamers",
    shortDescription: "Network source components for a controlled digital front end.",
    slug: "streamers",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-025-cms-seed-content-plan.md",
    status: "published",
    translationPriority: "normal",
    visibilityInNavigation: true,
  },
  {
    categoryKind: "technology-family",
    canonicalPath: "/audio/dac",
    defaultInquiryType: "product-inquiry",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "CAT_AUDIO_DAC",
    name: "DAC",
    order: 30,
    positioningStatement: "Dedicated conversion stages for a luxury digital playback chain.",
    primaryLocale: "en",
    productLineMode: "optional",
    publicLabel: "DAC",
    routeSegment: "dac",
    shortDescription: "Dedicated conversion stages for a luxury digital playback chain.",
    slug: "dac",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-025-cms-seed-content-plan.md",
    status: "published",
    translationPriority: "normal",
    visibilityInNavigation: true,
  },
  {
    categoryKind: "hardware-family",
    canonicalPath: "/audio/amplifiers",
    defaultInquiryType: "product-inquiry",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "CAT_AUDIO_AMPLIFIERS",
    name: "Amplifiers",
    order: 40,
    positioningStatement: "Integrated and separated amplification platforms.",
    primaryLocale: "en",
    productLineMode: "optional",
    publicLabel: "Amplifiers",
    routeSegment: "amplifiers",
    shortDescription: "Integrated and separated amplification platforms.",
    slug: "amplifiers",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-025-cms-seed-content-plan.md",
    status: "published",
    translationPriority: "normal",
    visibilityInNavigation: true,
  },
  {
    categoryKind: "material-program",
    canonicalPath: "/audio/perfect-conductors",
    defaultInquiryType: "product-inquiry",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "CAT_AUDIO_PERFECT_CONDUCTORS",
    name: "Perfect Conductors",
    order: 50,
    positioningStatement: "Cable systems and material programs for signal and power delivery.",
    primaryLocale: "en",
    productLineMode: "required",
    publicLabel: "Perfect Conductors",
    routeSegment: "perfect-conductors",
    shortDescription: "Cable systems and material programs for signal and power delivery.",
    slug: "perfect-conductors",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-020-prima-materia-strategy.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
];

export const productLineSeeds: ProductLineSeed[] = [
  {
    canonicalPath: "/audio/perfect-conductors/prima-materia-premium",
    categorySlug: "perfect-conductors",
    defaultInquiryType: "product-inquiry",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "LINE_PRIMA_MATERIA_PREMIUM",
    lineKind: "program",
    lineNarrativeMode: "catalog",
    name: "Prima Materia Premium",
    order: 10,
    positioningStatement:
      "The core Montelar luxury cable line for composed system matching and installation.",
    primaryLocale: "en",
    productCountHint: 5,
    publicLabel: "Prima Materia Premium",
    routeSegment: "prima-materia-premium",
    shortDescription: "Core luxury cable line for signal, power and system delivery.",
    slug: "prima-materia-premium",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-020-prima-materia-strategy.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
  {
    canonicalPath: "/audio/perfect-conductors/prima-materia-lux",
    categorySlug: "perfect-conductors",
    defaultInquiryType: "product-inquiry",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "LINE_PRIMA_MATERIA_LUX",
    lineKind: "program",
    lineNarrativeMode: "catalog",
    name: "Prima Materia LUX",
    order: 20,
    positioningStatement:
      "Upper Prima Materia expression with stricter matching workflow, finish and configuration discipline.",
    primaryLocale: "en",
    productCountHint: 5,
    publicLabel: "Prima Materia LUX",
    routeSegment: "prima-materia-lux",
    shortDescription: "Upper cable line for reference systems and elevated matching service.",
    slug: "prima-materia-lux",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-020-prima-materia-strategy.md",
    status: "published",
    translationPriority: "high",
    visibilityInNavigation: true,
  },
];

const noVariants = {
  blockedPublicClaims: 0,
  publishedVariants: 0,
  readinessState: "no-variants" as const,
  reviewVariants: 0,
  totalVariants: 0,
  validatedPublicClaims: 0,
};

export const productSeeds: ProductSeed[] = [
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-premium-interconnect",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "PROD_PRIMA_MATERIA_PREMIUM_INTERCONNECT",
    launchStage: "active",
    lineSlug: "prima-materia-premium",
    name: "Prima Materia Premium Interconnect",
    order: 10,
    positioningStatement: "Core analog signal link inside the Prima Materia Premium line.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia Premium Interconnect",
    routeSegment: "prima-materia-premium-interconnect",
    shortDescription: "Analog signal link for source, DAC, preamplifier and integrated systems.",
    slug: "prima-materia-premium-interconnect",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-021-prima-materia-premium-interconnect-skeleton.md",
    status: "review",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-premium-power",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "PROD_PRIMA_MATERIA_PREMIUM_POWER",
    launchStage: "active",
    lineSlug: "prima-materia-premium",
    name: "Prima Materia Premium Power",
    order: 20,
    positioningStatement: "Core power-delivery cable for refined component and amplifier contexts.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia Premium Power",
    routeSegment: "prima-materia-premium-power",
    shortDescription: "Power cable for source, DAC, preamplifier and amplifier contexts.",
    slug: "prima-materia-premium-power",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-022-prima-materia-premium-power-skeleton.md",
    status: "review",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-premium-speaker",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "PROD_PRIMA_MATERIA_PREMIUM_SPEAKER",
    launchStage: "active",
    lineSlug: "prima-materia-premium",
    name: "Prima Materia Premium Speaker",
    order: 30,
    positioningStatement:
      "Core speaker cable pair for composed loudspeaker and amplifier matching.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia Premium Speaker",
    routeSegment: "prima-materia-premium-speaker",
    shortDescription: "Speaker cable pair linking amplifier and passive loudspeakers.",
    slug: "prima-materia-premium-speaker",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-023-prima-materia-premium-speaker-skeleton.md",
    status: "review",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-premium-digital",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "PROD_PRIMA_MATERIA_PREMIUM_DIGITAL",
    launchStage: "active",
    lineSlug: "prima-materia-premium",
    name: "Prima Materia Premium Digital",
    order: 40,
    positioningStatement:
      "Core digital-signal cable family for controlled source and DAC pathways.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia Premium Digital",
    routeSegment: "prima-materia-premium-digital",
    shortDescription: "Digital cable family for USB, network, coaxial and AES/EBU pathways.",
    slug: "prima-materia-premium-digital",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-024-prima-materia-premium-digital-skeleton.md",
    status: "review",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-premium-blackrok",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: false,
    internalCode: "PROD_PRIMA_MATERIA_PREMIUM_BLACKROK",
    launchStage: "planned",
    lineSlug: "prima-materia-premium",
    name: "Prima Materia Premium Blackrok",
    order: 50,
    ownerReviewRequired: true,
    positioningStatement:
      "Guarded special-purpose system-stability layer pending final technical and naming proof.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia Premium Blackrok",
    publicationNotes:
      "Draft until owner/proof checkpoint confirms the public role and naming of Blackrok.",
    routeSegment: "prima-materia-premium-blackrok",
    shortDescription:
      "Special-purpose system layer kept in draft until technical role and naming are confirmed.",
    slug: "prima-materia-premium-blackrok",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-025-prima-materia-premium-blackrok-skeleton.md",
    status: "draft",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: false,
    visibilityInNavigation: false,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-lux-interconnect",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "PROD_PRIMA_MATERIA_LUX_INTERCONNECT",
    launchStage: "active",
    lineSlug: "prima-materia-lux",
    name: "Prima Materia LUX Interconnect",
    order: 60,
    positioningStatement:
      "Upper analog signal link for refined matching and finish-sensitive systems.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia LUX Interconnect",
    routeSegment: "prima-materia-lux-interconnect",
    shortDescription:
      "Upper analog signal link with refined construction and matching workflow.",
    slug: "prima-materia-lux-interconnect",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-026-prima-materia-lux-interconnect-skeleton.md",
    status: "review",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-lux-power",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "PROD_PRIMA_MATERIA_LUX_POWER",
    launchStage: "active",
    lineSlug: "prima-materia-lux",
    name: "Prima Materia LUX Power",
    order: 70,
    positioningStatement:
      "Upper power cable for current-sensitive reference systems and elevated installation discipline.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia LUX Power",
    routeSegment: "prima-materia-lux-power",
    shortDescription:
      "Upper power cable for reference systems and current-sensitive components.",
    slug: "prima-materia-lux-power",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-027-prima-materia-lux-power-skeleton.md",
    status: "review",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-lux-speaker",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "PROD_PRIMA_MATERIA_LUX_SPEAKER",
    launchStage: "active",
    lineSlug: "prima-materia-lux",
    name: "Prima Materia LUX Speaker",
    order: 80,
    positioningStatement:
      "Upper speaker cable pair for reference loudspeaker and amplifier combinations.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia LUX Speaker",
    routeSegment: "prima-materia-lux-speaker",
    shortDescription:
      "Reference speaker cable positioned inside the Prima Materia LUX line.",
    slug: "prima-materia-lux-speaker",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-028-prima-materia-lux-speaker-skeleton.md",
    status: "review",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-lux-digital",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: true,
    internalCode: "PROD_PRIMA_MATERIA_LUX_DIGITAL",
    launchStage: "active",
    lineSlug: "prima-materia-lux",
    name: "Prima Materia LUX Digital",
    order: 90,
    positioningStatement:
      "Upper digital-signal cable family for reference source, server and DAC pathways.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia LUX Digital",
    routeSegment: "prima-materia-lux-digital",
    shortDescription: "Upper digital cable family for reference source and DAC paths.",
    slug: "prima-materia-lux-digital",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-029-prima-materia-lux-digital-skeleton.md",
    status: "review",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "made-to-order",
    canonicalPath: "/products/prima-materia-lux-blackrok",
    categorySlug: "perfect-conductors",
    directionSlug: "hi-end-audio",
    indexable: false,
    internalCode: "PROD_PRIMA_MATERIA_LUX_BLACKROK",
    launchStage: "planned",
    lineSlug: "prima-materia-lux",
    name: "Prima Materia LUX Blackrok",
    order: 100,
    ownerReviewRequired: true,
    positioningStatement:
      "Upper Blackrok expression held in draft until public technical framing is validated.",
    primaryInquiryType: "product-inquiry",
    primaryLocale: "en",
    productKind: "physical-product",
    publicLabel: "Prima Materia LUX Blackrok",
    publicationNotes:
      "Draft until owner/proof checkpoint confirms the public role and naming of Blackrok.",
    routeSegment: "prima-materia-lux-blackrok",
    shortDescription:
      "Draft upper Blackrok layer awaiting confirmed technical story and naming approval.",
    slug: "prima-materia-lux-blackrok",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-030-prima-materia-lux-blackrok-skeleton.md",
    status: "draft",
    translationPriority: "normal",
    variantReadiness: noVariants,
    visibilityInFilters: false,
    visibilityInNavigation: false,
  },
  {
    availabilityMode: "private-consultation",
    canonicalPath: "/products/vision-max-premium",
    directionSlug: "vision-max",
    indexable: true,
    internalCode: "PROD_VISION_MAX_PREMIUM",
    launchStage: "active",
    name: "Vision MAX Premium",
    order: 110,
    positioningStatement:
      "Room-first private cinema program for serious screening spaces and refined residential integration.",
    primaryInquiryType: "private-demo",
    primaryLocale: "en",
    productKind: "system",
    publicLabel: "Vision MAX Premium",
    routeSegment: "vision-max-premium",
    shortDescription:
      "Private cinema environment for immersive screening with a premium integration profile.",
    slug: "vision-max-premium",
    sourceOfTruthArtifact:
      "docs/strategy/artifacts/MNT-PROD-032-vision-max-premium-skeleton.md",
    status: "review",
    subtitle: "Private cinema architecture",
    translationPriority: "high",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "private-consultation",
    canonicalPath: "/products/vision-max-lux",
    directionSlug: "vision-max",
    indexable: false,
    internalCode: "PROD_VISION_MAX_LUX",
    launchStage: "planned",
    name: "Vision MAX LUX",
    order: 120,
    ownerReviewRequired: true,
    positioningStatement:
      "Highest-expression private cinema program kept in draft while final owner scope and story surfaces mature.",
    primaryInquiryType: "private-demo",
    primaryLocale: "en",
    productKind: "system",
    publicLabel: "Vision MAX LUX",
    publicationNotes:
      "Draft while the upper-tier Vision MAX narrative, imagery and owner checkpoint remain incomplete.",
    routeSegment: "vision-max-lux",
    shortDescription:
      "Upper private cinema expression held in draft until final storytelling and media layers are ready.",
    slug: "vision-max-lux",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-033-vision-max-lux-skeleton.md",
    status: "draft",
    subtitle: "Upper private cinema program",
    translationPriority: "high",
    variantReadiness: noVariants,
    visibilityInFilters: false,
    visibilityInNavigation: false,
  },
  {
    availabilityMode: "private-consultation",
    canonicalPath: "/products/living-glass-oled",
    directionSlug: "living-glass",
    indexable: true,
    internalCode: "PROD_LIVING_GLASS_OLED",
    launchStage: "active",
    name: "Living Glass OLED",
    order: 130,
    positioningStatement:
      "Transparent display surface for residential and branded interiors where image should appear only on demand.",
    primaryInquiryType: "consultation-request",
    primaryLocale: "en",
    productKind: "installation-solution",
    publicLabel: "Living Glass OLED",
    routeSegment: "living-glass-oled",
    shortDescription: "Transparent display surface for residential and branded interiors.",
    slug: "living-glass-oled",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-035-living-glass-oled-skeleton.md",
    status: "review",
    translationPriority: "high",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "private-consultation",
    canonicalPath: "/products/hologram-vitrine",
    directionSlug: "hologram",
    indexable: false,
    internalCode: "PROD_HOLOGRAM_VITRINE",
    launchStage: "planned",
    name: "Hologram Vitrine",
    order: 140,
    ownerReviewRequired: true,
    positioningStatement:
      "Spatial presentation vitrine kept in draft until final public proof and media language are tighter.",
    primaryInquiryType: "consultation-request",
    primaryLocale: "en",
    productKind: "installation-solution",
    publicLabel: "Hologram Vitrine",
    publicationNotes:
      "Draft until public proof, motion references and owner-approved storytelling are ready for release.",
    routeSegment: "hologram-vitrine",
    shortDescription: "Spatial presentation vitrine for collectible, retail and event contexts.",
    slug: "hologram-vitrine",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-037-hologram-vitrine-skeleton.md",
    status: "draft",
    translationPriority: "high",
    variantReadiness: noVariants,
    visibilityInFilters: false,
    visibilityInNavigation: false,
  },
  {
    availabilityMode: "on-request",
    canonicalPath: "/products/pictorial-canvas",
    directionSlug: "pictorial-art-display",
    indexable: true,
    internalCode: "PROD_PICTORIAL_CANVAS",
    launchStage: "active",
    name: "Pictorial Canvas",
    order: 150,
    positioningStatement:
      "Framed digital-art object with architectural wall integration and curated still/motion behavior.",
    primaryInquiryType: "consultation-request",
    primaryLocale: "en",
    productKind: "installation-solution",
    publicLabel: "Pictorial Canvas",
    routeSegment: "pictorial-canvas",
    shortDescription:
      "Framed digital-art object for architectural wall integration and curated motion stills.",
    slug: "pictorial-canvas",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-039-pictorial-canvas-skeleton.md",
    status: "review",
    translationPriority: "high",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "private-consultation",
    canonicalPath: "/products/exhibition-wall",
    directionSlug: "display-for-exhibition",
    indexable: true,
    internalCode: "PROD_EXHIBITION_WALL",
    launchStage: "active",
    name: "Exhibition Wall",
    order: 160,
    positioningStatement:
      "Embedded touch display wall for premium exhibitions, brand spaces and guided narratives.",
    primaryInquiryType: "consultation-request",
    primaryLocale: "en",
    productKind: "installation-solution",
    publicLabel: "Exhibition Wall",
    routeSegment: "exhibition-wall",
    shortDescription:
      "Embedded touch display wall for premium exhibitions, brand spaces and guided narratives.",
    slug: "exhibition-wall",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-041-exhibition-wall-skeleton.md",
    status: "review",
    translationPriority: "high",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "private-consultation",
    canonicalPath: "/products/exhibition-table",
    directionSlug: "display-for-exhibition",
    indexable: true,
    internalCode: "PROD_EXHIBITION_TABLE",
    launchStage: "active",
    name: "Exhibition Table",
    order: 170,
    positioningStatement:
      "Furniture-grade multitouch storytelling table for galleries, salons and premium showrooms.",
    primaryInquiryType: "consultation-request",
    primaryLocale: "en",
    productKind: "installation-solution",
    publicLabel: "Exhibition Table",
    routeSegment: "exhibition-table",
    shortDescription:
      "Furniture-grade multitouch storytelling table for galleries, salons and premium showrooms.",
    slug: "exhibition-table",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-042-exhibition-table-skeleton.md",
    status: "review",
    translationPriority: "high",
    variantReadiness: noVariants,
    visibilityInFilters: true,
    visibilityInNavigation: true,
  },
  {
    availabilityMode: "private-consultation",
    canonicalPath: "/products/exhibition-rail",
    directionSlug: "display-for-exhibition",
    indexable: false,
    internalCode: "PROD_EXHIBITION_RAIL",
    launchStage: "planned",
    name: "Exhibition Rail",
    order: 180,
    ownerReviewRequired: true,
    positioningStatement:
      "Embedded interpretation strip kept in draft while naming and public framing stay open.",
    primaryInquiryType: "consultation-request",
    primaryLocale: "en",
    productKind: "installation-solution",
    publicLabel: "Exhibition Rail",
    publicationNotes:
      "Draft while owner checkpoint still allows a broader embedded-interpretation rename.",
    routeSegment: "exhibition-rail",
    shortDescription:
      "Embedded interpretation strip for multilingual object, wall and route guidance.",
    slug: "exhibition-rail",
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-PROD-043-exhibition-rail-skeleton.md",
    status: "draft",
    translationPriority: "high",
    variantReadiness: noVariants,
    visibilityInFilters: false,
    visibilityInNavigation: false,
  },
];

type CollectionName =
  | "product-directions"
  | "product-categories"
  | "product-lines"
  | "products";

async function findBySlug(payload: Payload, collection: CollectionName, slug: string) {
  const existing = await payload.find({
    collection,
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

  return existing.docs[0] ?? null;
}

function requireNumericId(id: unknown, context: string) {
  if (typeof id !== "number") {
    throw new Error(`Catalog seed failed: expected numeric id for ${context}.`);
  }

  return id;
}

async function upsertDirection(payload: Payload, seed: DirectionSeed): Promise<SeedOperation> {
  const existing = await findBySlug(payload, "product-directions", seed.slug);

  if (existing) {
    const existingId = requireNumericId(existing.id, `direction ${seed.slug}`);
    const updated = await payload.update({
      collection: "product-directions",
      data: seed,
      id: existingId,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, operation: "updated", slug: seed.slug };
  }

  const created = await payload.create({
    collection: "product-directions",
    data: seed,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, operation: "created", slug: seed.slug };
}

async function upsertCategory(payload: Payload, seed: CategorySeed): Promise<SeedOperation> {
  const direction = await findBySlug(payload, "product-directions", seed.directionSlug);

  if (!direction) {
    throw new Error(`Catalog seed failed: missing direction ${seed.directionSlug} for category ${seed.slug}.`);
  }

  const existing = await findBySlug(payload, "product-categories", seed.slug);
  const directionId = requireNumericId(direction.id, `direction ${seed.directionSlug}`);
  const data = { ...seed, direction: directionId } as Record<string, unknown>;
  delete data.directionSlug;

  if (existing) {
    const existingId = requireNumericId(existing.id, `category ${seed.slug}`);
    const updated = await payload.update({
      collection: "product-categories",
      data: data as never,
      id: existingId,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, operation: "updated", slug: seed.slug };
  }

  const created = await payload.create({
    collection: "product-categories",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, operation: "created", slug: seed.slug };
}

async function upsertProductLine(payload: Payload, seed: ProductLineSeed): Promise<SeedOperation> {
  const direction = await findBySlug(payload, "product-directions", seed.directionSlug);
  const category = await findBySlug(payload, "product-categories", seed.categorySlug);

  if (!direction) {
    throw new Error(`Catalog seed failed: missing direction ${seed.directionSlug} for line ${seed.slug}.`);
  }

  if (!category) {
    throw new Error(`Catalog seed failed: missing category ${seed.categorySlug} for line ${seed.slug}.`);
  }

  const existing = await findBySlug(payload, "product-lines", seed.slug);
  const directionId = requireNumericId(direction.id, `direction ${seed.directionSlug}`);
  const categoryId = requireNumericId(category.id, `category ${seed.categorySlug}`);
  const data = {
    ...seed,
    category: categoryId,
    direction: directionId,
  } as Record<string, unknown>;
  delete data.categorySlug;
  delete data.directionSlug;

  if (existing) {
    const existingId = requireNumericId(existing.id, `line ${seed.slug}`);
    const updated = await payload.update({
      collection: "product-lines",
      data: data as never,
      id: existingId,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, operation: "updated", slug: seed.slug };
  }

  const created = await payload.create({
    collection: "product-lines",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, operation: "created", slug: seed.slug };
}

async function upsertProduct(payload: Payload, seed: ProductSeed): Promise<SeedOperation> {
  const direction = await findBySlug(payload, "product-directions", seed.directionSlug);
  const category = seed.categorySlug
    ? await findBySlug(payload, "product-categories", seed.categorySlug)
    : null;
  const line = seed.lineSlug ? await findBySlug(payload, "product-lines", seed.lineSlug) : null;

  if (!direction) {
    throw new Error(`Catalog seed failed: missing direction ${seed.directionSlug} for product ${seed.slug}.`);
  }

  if (seed.categorySlug && !category) {
    throw new Error(`Catalog seed failed: missing category ${seed.categorySlug} for product ${seed.slug}.`);
  }

  if (seed.lineSlug && !line) {
    throw new Error(`Catalog seed failed: missing line ${seed.lineSlug} for product ${seed.slug}.`);
  }

  const existing = await findBySlug(payload, "products", seed.slug);
  const directionId = requireNumericId(direction.id, `direction ${seed.directionSlug}`);
  const data = {
    ...seed,
    category: category ? requireNumericId(category.id, `category ${seed.categorySlug}`) : null,
    direction: directionId,
    line: line ? requireNumericId(line.id, `line ${seed.lineSlug}`) : null,
  } as Record<string, unknown>;
  delete data.categorySlug;
  delete data.directionSlug;
  delete data.lineSlug;

  if (existing) {
    const existingId = requireNumericId(existing.id, `product ${seed.slug}`);
    const updated = await payload.update({
      collection: "products",
      data: data as never,
      id: existingId,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, operation: "updated", slug: seed.slug };
  }

  const created = await payload.create({
    collection: "products",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, operation: "created", slug: seed.slug };
}

export async function syncCatalogHierarchyAndProducts(payload: Payload) {
  const waveZero = await syncWaveZeroPlatform(payload);
  const directionOperations: SeedOperation[] = [];
  const categoryOperations: SeedOperation[] = [];
  const lineOperations: SeedOperation[] = [];
  const productOperations: SeedOperation[] = [];

  for (const seed of productDirectionSeeds) {
    directionOperations.push(await upsertDirection(payload, seed));
  }

  for (const seed of productCategorySeeds) {
    categoryOperations.push(await upsertCategory(payload, seed));
  }

  for (const seed of productLineSeeds) {
    lineOperations.push(await upsertProductLine(payload, seed));
  }

  for (const seed of productSeeds) {
    productOperations.push(await upsertProduct(payload, seed));
  }

  return {
    ...waveZero,
    categoryCount: productCategorySeeds.length,
    categoryOperations,
    directionCount: productDirectionSeeds.length,
    directionOperations,
    lineCount: productLineSeeds.length,
    lineOperations,
    productCount: productSeeds.length,
    productOperations,
    productStatusBreakdown: productSeeds.reduce<Record<string, number>>((acc, seed) => {
      acc[seed.status] = (acc[seed.status] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
