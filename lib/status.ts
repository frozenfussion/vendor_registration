// Status state machine. Pure functions, no I/O. Unit-tested in lib/status.test.ts.
import type { VendorStatus } from "@/lib/generated/prisma/enums";
import type { VendorAction } from "@/lib/validation/admin";

export const ACTION_TO_STATUS: Record<VendorAction, VendorStatus> = {
  APPROVE: "APPROVED",
  KIV: "KIV",
  REJECT: "REJECTED",
};

/** Allowed transitions. APPROVED and REJECTED are terminal in Phase 1. */
const TRANSITIONS: Record<VendorStatus, readonly VendorStatus[]> = {
  PENDING: ["APPROVED", "REJECTED", "KIV"],
  KIV: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export function canTransition(from: VendorStatus, to: VendorStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(status: VendorStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export const STATUS_LABELS: Record<VendorStatus, string> = {
  PENDING: "Pending review",
  KIV: "Kept in view",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/** Tailwind classes per status, matching the design tokens in globals.css. */
export const STATUS_CLASSES: Record<VendorStatus, string> = {
  PENDING: "bg-status-pending-soft text-status-pending",
  KIV: "bg-status-kiv-soft text-status-kiv",
  APPROVED: "bg-status-approved-soft text-status-approved",
  REJECTED: "bg-status-rejected-soft text-status-rejected",
};
