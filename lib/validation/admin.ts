// Admin-side contracts: login, decision action, list filters.
import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const VENDOR_ACTIONS = ["APPROVE", "KIV", "REJECT"] as const;
export type VendorAction = (typeof VENDOR_ACTIONS)[number];

/**
 * POST /api/admin/vendors/[id]/action body.
 * Remark is optional for APPROVE, required for KIV and REJECT (it is emailed
 * to the vendor, so they must be told why).
 */
export const vendorActionSchema = z
  .object({
    action: z.enum(VENDOR_ACTIONS),
    remark: z.string().trim().max(2000, "Remark is too long").optional().default(""),
  })
  .superRefine((val, ctx) => {
    if (val.action !== "APPROVE" && val.remark.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["remark"],
        message: "A remark is required for KIV and Reject — it is sent to the vendor",
      });
    }
  });
export type VendorActionInput = z.infer<typeof vendorActionSchema>;

export const VENDOR_STATUS_FILTERS = ["ALL", "PENDING", "KIV", "APPROVED", "REJECTED"] as const;

export const vendorListQuerySchema = z.object({
  status: z.enum(VENDOR_STATUS_FILTERS).default("ALL"),
  q: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type VendorListQuery = z.infer<typeof vendorListQuerySchema>;
