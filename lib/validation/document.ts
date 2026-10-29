// Upload contract. Required document types, accepted MIME types, size cap.
import { z } from "zod";

export const DOCUMENT_TYPES = ["SSM_CERT", "BANK_PROOF", "TAX_REG", "OTHER"] as const;
export type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number];

export const REQUIRED_DOCUMENT_TYPES: readonly DocumentTypeValue[] = [
  "SSM_CERT",
  "BANK_PROOF",
  "TAX_REG",
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeValue, { label: string; hint: string }> = {
  SSM_CERT: { label: "SSM certificate", hint: "Form 9 / Section 17 or latest SSM profile" },
  BANK_PROOF: { label: "Bank account proof", hint: "Bank statement header or bank confirmation letter" },
  TAX_REG: { label: "Tax registration", hint: "TIN / SST registration document" },
  OTHER: { label: "Other (optional)", hint: "ISO certificates, licences, company profile" },
};

export const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"] as const;

/** Multipart field name convention: `doc_<TYPE>` e.g. `doc_SSM_CERT`. */
export const documentFieldName = (type: DocumentTypeValue) => `doc_${type}` as const;

export const documentMetaSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  originalName: z.string().min(1).max(255),
  mimeType: z.enum(ACCEPTED_MIME_TYPES, { error: "Only PDF, JPG or PNG files are accepted" }),
  sizeBytes: z.number().int().positive(),
});

export type DocumentMeta = z.infer<typeof documentMetaSchema>;
