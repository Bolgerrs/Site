import type { CmsProductInquiryForm } from "@/lib/cms/types";
import type { StoredLead } from "@/lib/leads/lead-types";
import {
  dispatchLeadNotificationEvent,
  type LeadNotificationAttempt,
} from "./lead-notification-core";

export type LeadNotificationResult = LeadNotificationAttempt & {
  templateKey: string | null;
};

export async function dispatchLeadNotification(
  lead: StoredLead,
  form: CmsProductInquiryForm,
): Promise<LeadNotificationResult> {
  const templateKey = form.notificationTemplateKey ?? null;
  const result = await dispatchLeadNotificationEvent({
    assignedTeam: lead.assignedTeam,
    assignedToUser: lead.assignedToUser,
    leadPath: lead.storagePath,
    leadType: lead.leadType,
    locale: lead.locale,
    notificationRecipients: lead.notificationRecipients,
    product: lead.product,
    referenceCode: lead.referenceCode,
    requestType: lead.requestType,
    routingRuleKey: lead.routingRuleKey,
    safeTargetApplied: lead.internalTags.includes("safe-target"),
    sourcePagePath: lead.sourcePagePath,
    submissionChannel: form.submissionChannel,
    templateKey,
  });

  return {
    ...result,
    templateKey,
  };
}
