import { withLocale, type SiteLocale } from "@/config/i18n";

export const launchDirections = [
  {
    href: "/vision-max",
    label: "Vision MAX",
    description: "Private cinema environments and immersive screening systems.",
  },
  {
    href: "/audio",
    label: "Hi-end Audio",
    description: "Loudspeakers, source components, amplification and cable systems.",
  },
  {
    href: "/invisible-display",
    label: "Living Glass",
    description: "Transparent display surfaces for residential and branded interiors.",
  },
  {
    href: "/hologram",
    label: "Hologram",
    description: "Spatial presentation systems for collectible, retail and event contexts.",
  },
  {
    href: "/pictorial-art-display",
    label: "Pictorial Art Display",
    description: "Framed digital art objects with architectural integration.",
  },
  {
    href: "/exhibition-displays",
    label: "Exhibition Displays",
    description: "Embedded touch surfaces for exhibitions, showrooms and guided visitor journeys.",
  },
] as const;

export const audioCategoryRoutes = [
  {
    href: "/audio/speakers",
    label: "Speakers",
    description: "Reference loudspeaker systems for listening rooms with scale and restraint.",
  },
  {
    href: "/audio/streamers",
    label: "Streamers",
    description: "Network source components for a controlled digital front end.",
  },
  {
    href: "/audio/dac",
    label: "DAC",
    description: "Dedicated conversion stages for a luxury digital playback chain.",
  },
  {
    href: "/audio/amplifiers",
    label: "Amplifiers",
    description: "Integrated and separated amplification platforms.",
  },
  {
    href: "/audio/perfect-conductors",
    label: "Perfect Conductors",
    description: "Cable systems and material programs for signal and power delivery.",
  },
] as const;

export const lineRoutes = [
  {
    href: "/audio/perfect-conductors/prima-materia",
    label: "Prima Materia",
    description: "Premium and LUX conductor line for signal, power and loudspeaker paths.",
  },
] as const;

export const editorialRoutes = [
  {
    href: "/brand",
    label: "Brand",
    description: "Montelar quiet luxury: precision, form, material and calm presence in the room.",
  },
  {
    href: "/technology",
    label: "Technology",
    description: "Signal, control, display and integration principles behind Montelar rooms.",
  },
  {
    href: "/craftsmanship",
    label: "Craftsmanship",
    description: "Materials, finishing, installation tolerances and service discipline for systems built to last.",
  },
  {
    href: "/projects",
    label: "Projects",
    description: "Residences, galleries, showrooms and private rooms where image, sound and light become one environment.",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Editorial notes on systems, materials, installations and the culture of quiet luxury.",
  },
  {
    href: "/downloads",
    label: "Downloads",
    description: "Brochures, specifications and project documents for private review.",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Direct contact for private consultation, regional partnership or project conversation.",
  },
] as const;

export const primaryNavigation = [
  { href: "/", label: "Home" },
  ...launchDirections.map(({ href, label }) => ({ href, label })),
  { href: "/brand", label: "Brand" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
] as const;

export const routePreviewProducts = [
  { slug: "vision-max-premium", label: "Vision MAX Premium" },
  { slug: "living-glass-oled", label: "Living Glass OLED" },
  { slug: "prima-materia-lux-speaker", label: "Prima Materia LUX Speaker" },
] as const;

export { withLocale } from "@/config/i18n";

export function productDetailPath(slug: string, locale?: SiteLocale) {
  return withLocale(`/products/${slug}`, locale);
}

export function productRequestPath(productSlug: string, locale?: SiteLocale) {
  return withLocale(`/request/${productSlug}`, locale);
}

export function pageMetadataTitle(title: string) {
  return `${title} | Montelar`;
}
