// Email contract. Owned by task 03-email. Callers (register route, admin
// action route) call ONLY these functions. Every call must write an EmailLog
// row, success or failure, and must never throw — email failure must not fail
// a registration or a decision.

import type { Vendor } from "@/lib/generated/prisma/client";

export type EmailResult = { ok: true; messageId: string } | { ok: false; error: string };

/** To vendor, on submission. Includes referenceNo and status link. */
export async function sendVendorConfirmation(_vendor: Vendor): Promise<EmailResult> {
  return { ok: false, error: "sendVendorConfirmation not implemented — see docs/tasks/03-email.md" };
}

/** To every address in ADMIN_NOTIFY_EMAILS, on submission. */
export async function sendAdminNewRegistration(_vendor: Vendor): Promise<EmailResult> {
  return { ok: false, error: "sendAdminNewRegistration not implemented — see docs/tasks/03-email.md" };
}

/** To vendor, after an admin decision. Remark is included for KIV/REJECTED. */
export async function sendVendorDecision(
  _vendor: Vendor,
  _remark: string,
): Promise<EmailResult> {
  return { ok: false, error: "sendVendorDecision not implemented — see docs/tasks/03-email.md" };
}

/** Public status URL for a vendor, used in templates. */
export function statusUrl(appUrl: string, referenceNo: string): string {
  return `${appUrl}/status/${encodeURIComponent(referenceNo)}`;
}
