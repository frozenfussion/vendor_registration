# Task 01 — Vendor registration form + status page

Branch: `feat/registration-form`

## Goal

A vendor can open `/register`, fill in the five sections, upload the three required documents, accept the declaration, submit, and land on `/status/<ref>` showing their new reference number. Anyone with a reference can open `/status/<ref>`.

## You own

- `app/(public)/layout.tsx` — header (wordmark "Enovix Vendor Registration", link to `/status`), footer, theme-aware. A small theme toggle (sun/moon, `next-themes`) in the header.
- `app/(public)/register/page.tsx`
- `app/(public)/status/[ref]/page.tsx` and `app/(public)/status/page.tsx` (NEW: a page with just the reference input that redirects to `/status/<ref>`)
- `app/api/register/route.ts`
- `components/public/**` (create as needed: `registration-form.tsx`, `document-field.tsx`, `status-timeline.tsx`, `status-badge.tsx`, `theme-toggle.tsx`)

## Do not touch

Everything else. In particular: `lib/validation/*`, `lib/storage.ts`, `lib/email/*`, `prisma/*`, `app/globals.css`, `components/ui/*`.

## Design (match these — see Drive log Claude_2026-10-29_1447.md for the mockup)

- Max width 960px, centred, page background `bg-background`, each section a `Card` with a numbered circle (1–5) and heading: **Company details**, **Goods / services supplied**, **Primary contact**, **Bank details**, **Supporting documents**.
- Two-column grid on ≥768px, single column below. Inputs 44px tall. Labels 13px/500. Required fields marked `*`.
- Selects use the option lists exported from `lib/validation/vendor.ts` (`BUSINESS_TYPES`, `MALAYSIAN_STATES`, `MALAYSIAN_BANKS`, `SUPPLY_CATEGORIES` with `SUPPLY_CATEGORY_LABELS`). Default state: Pulau Pinang.
- Document section: one dashed row per type from `DOCUMENT_TYPE_LABELS` with label + hint + a file input (styled as a "Choose file" button, shows chosen filename). Accepts `ACCEPTED_EXTENSIONS`.
- Declaration checkbox (text in the mockup: "I confirm the information provided is true and accurate, and I consent to Enovix processing it for the purpose of vendor evaluation.").
- Buttons: secondary "Clear form", primary "Submit registration" (disabled while submitting, shows spinner).
- Inline field errors under each input, red text, from Zod issues (client-side `safeParse` before submit AND server issues mapped back by path).
- Status page: card with reference, company name, status badge (`STATUS_LABELS`, `STATUS_CLASSES` from `lib/status.ts`), vertical timeline of `StatusHistory` rows (newest last), the latest remark shown in a bordered box only when status is KIV or REJECTED, and a "Questions? contact [PROCUREMENT EMAIL]" line (literal placeholder text for now).

## Server (`app/api/register/route.ts`)

Follow `docs/ARCHITECTURE.md` → "Vendor submits" and `docs/API.md` → `POST /api/register` exactly.

- Parse `await req.formData()`. Build a plain object of text fields; `declarationAccepted` arrives as `"true"` — convert to boolean before `safeParse`.
- Files: for each `DOCUMENT_TYPES` entry read `formData.getAll(documentFieldName(type))`. Required types must have exactly one `File` with size > 0. Validate `type`/`size` with `documentMetaSchema`. Collect issues with path `["documents", type]`.
- Transaction: `nextReferenceNo(tx)` → `tx.vendor.create` → `tx.document.createMany` with a temporary `storedPath` of `""` → `tx.statusHistory.create({ fromStatus: null, toStatus: "PENDING" })`.
- After commit: for each document call `storeFile({ vendorId, documentId, type, file })` and `prisma.document.update({ storedPath, mimeType, sizeBytes })`. On any `StorageError`/throw: `prisma.vendor.delete({ where: { id } })` (cascades) and return 413 for `TOO_LARGE`, 400 for `BAD_TYPE`, else 500.
- Then `await sendVendorConfirmation(vendor)` and `await sendAdminNewRegistration(vendor)` (both are safe to call; they return not-implemented until task 03 merges — ignore the result).
- Return `201 { referenceNo }`.

## Client submit

`fetch("/api/register", { method: "POST", body: formData })`. On 201 → `router.push("/status/" + referenceNo)` and `toast.success`. On 400/413 → map `issues` to fields. On 500 → `toast.error`.

## Acceptance criteria

- [ ] `/register` renders all fields from the schema; nothing is hard-coded that the schema exports.
- [ ] Submitting an empty form shows inline errors without a network call.
- [ ] A valid submission (use any 3 small PDFs) returns 201 and redirects to the status page showing `VR-<year>-0001` on a fresh DB. (Needs task 05 for real files; until then, the route may return 500 after creating and deleting the vendor — that is expected and must leave no orphan rows.)
- [ ] `/status/VR-2026-0001` shows the vendor; `/status/nonsense` shows the not-found page; `/status/VR-2026-9999` (unknown) shows "No application found for this reference".
- [ ] Status page never renders bank, contact or document data.
- [ ] Light and dark both look right (toggle in header).
- [ ] Works at 375px width.
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` pass.

## Testing notes

Local Postgres is needed: `docker` is not available on the Droplet, so use the shared dev database on the box (`DATABASE_URL` in `.env`; ask Aziz) or `npx prisma dev` if it works on your machine. Run `npm run db:migrate` once.
