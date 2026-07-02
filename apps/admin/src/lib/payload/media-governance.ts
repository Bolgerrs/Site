import type { PayloadRequest } from "payload";

type RelationValue = number | string | { id: number | string } | null | undefined;

type PublicSafeMediaLike = {
  approvalStatus?: string | null;
  publicationReadiness?: string | null;
  referenceOnlyNotProductionAsset?: boolean | null;
  rightsStatus?: string | null;
};

export const mediaAssetTypeOptions = [
  "image",
  "motion-poster",
  "video-reference",
  "swatch",
  "diagram",
  "logo",
  "document-preview",
  "creative-reference",
  "ui-preview",
  "other",
] as const;

export const mediaAssetSourceCategoryOptions = [
  "commissioned",
  "generated",
  "supplier",
  "internal",
  "reference",
  "owner-provided",
] as const;

export const governanceRightsStatusOptions = [
  "reference-only",
  "supplier-restricted",
  "licensed",
  "owned",
  "generated-pending-review",
  "production-approved",
] as const;

export const governanceApprovalStatusOptions = [
  "pending",
  "needs-review",
  "approved",
  "rejected",
  "expired",
] as const;

export const publicationReadinessOptions = [
  "blocked",
  "preview-only",
  "production-ready",
] as const;

export function getRelationId(value: RelationValue) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    return value.id;
  }

  return null;
}

export function isProductionSafeRightsStatus(value: string | null | undefined) {
  return value === "licensed" || value === "owned" || value === "production-approved";
}

export function isProductionSafeMediaAsset(asset: PublicSafeMediaLike | null | undefined) {
  if (!asset) {
    return false;
  }

  return (
    asset.approvalStatus === "approved" &&
    asset.publicationReadiness === "production-ready" &&
    asset.referenceOnlyNotProductionAsset !== true &&
    isProductionSafeRightsStatus(asset.rightsStatus)
  );
}

export function hasExpiredDate(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < Date.now();
}

export function requireSourceAttributionWhenReference(data: {
  sourceCategory?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}) {
  if (
    data.sourceCategory === "reference" &&
    !data.sourceName?.trim() &&
    !data.sourceUrl?.trim()
  ) {
    throw new Error(
      "Media governance validation failed: reference assets require sourceName or sourceUrl.",
    );
  }
}

export function requireReferenceGuardrail(data: {
  publicationReadiness?: string | null;
  referenceOnlyNotProductionAsset?: boolean | null;
  rightsStatus?: string | null;
}) {
  if (data.rightsStatus !== "reference-only") {
    return;
  }

  if (data.referenceOnlyNotProductionAsset !== true) {
    throw new Error(
      "Media governance validation failed: reference-only records must stay marked as non-production assets.",
    );
  }

  if (data.publicationReadiness === "production-ready") {
    throw new Error(
      "Media governance validation failed: reference-only records cannot be production-ready.",
    );
  }
}

export function requireApprovedBeforeProductionReady(data: {
  approvalStatus?: string | null;
  publicationReadiness?: string | null;
}) {
  if (
    data.publicationReadiness === "production-ready" &&
    data.approvalStatus !== "approved"
  ) {
    throw new Error(
      "Media governance validation failed: production-ready records require approvalStatus=approved.",
    );
  }
}

export function requireNoExpiredApproval(data: {
  approvalStatus?: string | null;
  expiryDate?: string | null;
  licenseExpiryAt?: string | null;
  publicationReadiness?: string | null;
}) {
  const expired = hasExpiredDate(data.expiryDate) || hasExpiredDate(data.licenseExpiryAt);

  if (!expired) {
    return;
  }

  if (data.approvalStatus !== "expired") {
    throw new Error(
      "Media governance validation failed: expired records must carry approvalStatus=expired.",
    );
  }

  if (data.publicationReadiness === "production-ready") {
    throw new Error(
      "Media governance validation failed: expired records cannot remain production-ready.",
    );
  }
}

export function requirePublicAudienceSafety(data: {
  audienceMode?: string | null;
  referenceOnlyNotProductionAsset?: boolean | null;
}) {
  if (data.audienceMode === "public" && data.referenceOnlyNotProductionAsset === true) {
    throw new Error(
      "Media governance validation failed: public audience assets cannot stay marked reference-only.",
    );
  }
}

export async function requireLinkedMediaAssetToBeProductionSafe(
  req: PayloadRequest,
  mediaAsset: RelationValue,
  message: string,
) {
  const mediaAssetId = getRelationId(mediaAsset);

  if (mediaAssetId === null) {
    return;
  }

  const asset = await req.payload.findByID({
    collection: "media-assets",
    id: mediaAssetId,
    overrideAccess: true,
  });

  if (!isProductionSafeMediaAsset(asset)) {
    throw new Error(message);
  }
}
