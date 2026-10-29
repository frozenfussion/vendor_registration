# Task 02 — Admin dashboard + vendor detail + decision

Branch: `feat/admin-dashboard`

## Goal

A signed-in admin sees all registrations, filters/searches them, opens one, reads everything the vendor submitted, downloads documents, and records a decision (Approve / KIV / Reject) with a remark. The vendor is emailed (via task 03) and the audit trail shows it.

## You own

- `app/(admin)/layout.tsx` — admin shell. Left sidebar (240px, `bg-sidebar`): wordmark, nav ("Registrations" → `/admin/vendors`; "Admin users" → `#` disabled, Phase 2), bottom block with signed-in user initials + name and a Sign out button, plus a theme toggle. Stacks above content below 900px. Calls `requireAdmin()` at the top and passes the session down. **Exception:** the login route must render without this shell — put the shell in a nested route group `app/(admin)/admin/(shell)/layout.tsx` and move `vendors/**` under it, OR check `pathname` — your choice, but `/admin/login` must not require auth and must not show the sidebar.
- `app/(admin)/admin/vendors/page.tsx` (list) and `app/(admin)/admin/vendors/[id]/page.tsx` (detail)
- `app/api/admin/vendors/[id]/action/route.ts`
- `components/admin/**` (`stat-tiles.tsx`, `status-filter.tsx`, `vendor-table.tsx`, `decision-panel.tsx`, `history-list.tsx`, `document-list.tsx`, `sidebar.tsx`, `theme-toggle.tsx`)

## Do not touch

`app/(admin)/admin/login/**`, `app/api/auth/**`, `lib/auth.ts` (task 04); `lib/email/**` (03); `lib/storage.ts`, `app/api/admin/documents/**` (05); everything frozen.

## Design (see Drive log Claude_2026-10-29_1447.md)

**List page** `/admin/vendors`
- H1 "Vendor registrations", subline "N awaiting your review" (PENDING count). "Export CSV" button present but `disabled` with tooltip "Phase 2".
- Four stat tiles (Pending / Kept in view / Approved / Rejected) with counts coloured by `text-status-*`.
- Card containing: filter pills (All / Pending / KIV / Approved / Rejected) driven by `?status=`; search input driven by `?q=` (matches `companyName` or `referenceNo`, case-insensitive `contains`); table columns Reference · Company · Category (label) · Submitted (dd MMM yyyy) · Status (`Badge` with `STATUS_CLASSES`) · "Review →" link; pagination "Showing a–b of n", Previous/Next via `?page=`.
- Parse query with `vendorListQuerySchema`. Default sort `createdAt desc`. Everything server-rendered; pills and search are plain links/forms (GET), no client state needed.

**Detail page** `/admin/vendors/[id]`
- "← Back to registrations". Header: reference, company name H1, "Submitted <date> · <category label>", status badge.
- Two columns on ≥1024px (`flex-wrap`): left = cards Company details / Goods & services / Primary contact / Bank details (definition lists) / Documents (list with type label, original name, size, "Download" → `/api/admin/documents/<id>`); right = **Decision** card + **History** card.
- Decision card (client component): three toggle buttons Approve (green), KIV (blue), Reject (red) using status colours; selecting one highlights it; Remark textarea (label says "(optional)" for Approve, "(required — sent to vendor)" otherwise); confirm button whose label changes ("Confirm approval" / "Confirm KIV and request info" / "Confirm rejection"), disabled until an action is chosen; a `Dialog` confirm step for Reject and Approve (terminal). If the vendor is already terminal (`isTerminal`), render the card read-only with "This application is closed."
- History card: one row per `StatusHistory` (oldest first): dot coloured by `toStatus`, label ("Submitted" for the null→PENDING row, else `STATUS_LABELS[toStatus]`), date-time, actioned-by name or "vendor", and remark if any.

## Server (`app/api/admin/vendors/[id]/action/route.ts`)

Follow `docs/ARCHITECTURE.md` → "Admin decides" and `docs/API.md` exactly. Use `requireAdmin()` from `lib/auth.ts` (stub until task 04 — wrap the call so that if it throws the "not implemented" error you return 401; delete that wrapper once task 04 is merged — note it in your PR). Use `canTransition` and `ACTION_TO_STATUS` from `lib/status.ts`. Transaction for update + history. Then `sendVendorDecision(vendor, remark)`.

After success the client calls `router.refresh()` and `toast.success`.

## Acceptance criteria

- [ ] Counts, filters, search and pagination all work and are reflected in the URL.
- [ ] Detail page shows every field in `prisma/schema.prisma` Vendor model, grouped as above.
- [ ] Approve from PENDING → 200, status badge updates, history gains a row with the admin's name.
- [ ] KIV without a remark → 400 with the Zod message shown under the textarea.
- [ ] Approve an already-APPROVED vendor → 409, toast shows the message.
- [ ] Light/dark, 375px width, keyboard-only operation of the decision panel.
- [ ] Checks pass.

## Testing notes

Seed data: write `prisma/seed-dev.ts`? **No** — `prisma/` is frozen. Instead add `scripts/dev-seed-vendors.ts` (you own `scripts/`) that inserts ~8 vendors across all statuses with history rows, runnable via `npx tsx scripts/dev-seed-vendors.ts`. Never run it in production.
