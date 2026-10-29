# API contract

All responses are JSON unless stated. Errors use `{ "error": string, "issues"?: ZodIssue[] }`.

## POST /api/register

Public. `multipart/form-data`.

**Fields** — every key of `vendorRegistrationSchema` (`lib/validation/vendor.ts`) as text fields, plus `declarationAccepted=true`.

**Files** — field name `doc_<TYPE>` (`documentFieldName()`): `doc_SSM_CERT`, `doc_BANK_PROOF`, `doc_TAX_REG` required; `doc_OTHER` optional (may repeat). PDF/JPG/PNG, ≤ `UPLOAD_MAX_BYTES` each.

| Status | Body |
|---|---|
| 201 | `{ "referenceNo": "VR-2026-0042" }` |
| 400 | `{ "error": "Validation failed", "issues": [...] }` — field issues use the Zod path; file issues use path `["documents", "<TYPE>"]` |
| 413 | `{ "error": "File too large", "issues": [...] }` |
| 500 | `{ "error": "Could not save registration" }` |

Side effects: Vendor + Documents + StatusHistory rows; files on disk; confirmation email to vendor; notification email to admins.

## GET /status/[ref]

Public **page** (not JSON). `ref` must match `referenceNoSchema`; otherwise 404 page. Shows company name, reference, current status, timeline, and the latest remark only when status is KIV or REJECTED.

## POST /api/admin/vendors/[id]/action

Admin only (`requireAdmin()`). `application/json`.

```json
{ "action": "APPROVE" | "KIV" | "REJECT", "remark": "string (required for KIV/REJECT)" }
```

| Status | Body |
|---|---|
| 200 | `{ "status": "APPROVED" \| "KIV" \| "REJECTED" }` |
| 400 | validation failed |
| 401 | `{ "error": "Unauthorized" }` |
| 404 | `{ "error": "Vendor not found" }` |
| 409 | `{ "error": "Cannot move from <from> to <to>" }` |

Side effects: Vendor.status updated + StatusHistory row (same transaction); decision email to vendor.

## GET /api/admin/documents/[id]

Admin only. Streams the file.

| Status | Response |
|---|---|
| 200 | body = file bytes; headers `Content-Type`, `Content-Length`, `Content-Disposition: attachment; filename="<originalName sanitised>"` |
| 401 | JSON error |
| 404 | JSON error (no such document, or file missing on disk) |

## /api/auth/[...nextauth]

Auth.js handlers (GET/POST). Credentials provider: `email`, `password`. Not called directly by our code — use `signIn("credentials", …)` / `signOut()` from `lib/auth.ts`.

## Admin pages (server-rendered, not JSON)

| Route | Reads | Notes |
|---|---|---|
| `/admin/login` | — | redirects to `/admin/vendors` if already signed in |
| `/admin/vendors?status=&q=&page=` | `vendorListQuerySchema` | counts per status + paginated table |
| `/admin/vendors/[id]` | vendor + documents + statusHistory (with actionedBy) | decision panel posts to the action route |
