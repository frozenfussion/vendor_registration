# Task 03 — Transactional email (Resend + React Email)

Branch: `feat/email`

## Goal

Implement the three functions in `lib/email/index.ts` so that every send goes through Resend, is logged to `EmailLog`, and never throws.

## You own

- `lib/email/index.ts` — replace the stub bodies. **Keep every exported signature exactly as it is.**
- `lib/email/resend.ts` — singleton `new Resend(getEnv().RESEND_API_KEY)`.
- `lib/email/send.ts` — one internal `send({ vendorId, to, subject, template, react })` helper that calls Resend, writes the `EmailLog` row (`providerMessageId` on success, `error` on failure), and returns `EmailResult`. Catch everything.
- `lib/email/templates/*.tsx` — `vendor-confirmation.tsx`, `admin-new-registration.tsx`, `vendor-decision.tsx`, plus `layout.tsx` (shared shell).
- `lib/email/index.test.ts` — unit tests with Resend mocked (`vi.mock("resend")`) and prisma mocked.

## Do not touch

Anything outside `lib/email/`.

## Templates (React Email, `@react-email/components`)

Plain, single-column, max 600px, system font stack, light background only (email clients). Header: "Enovix Vendor Registration". Footer: "This is an automated message from the Enovix vendor registration portal." No images, no external assets.

1. **vendor-confirmation** — to `vendor.contactEmail`. Subject `Registration received — <referenceNo>`. Body: thanks, company name, reference number in a highlighted box, "track your application" button → `statusUrl(APP_URL, referenceNo)`, what happens next (procurement reviews, you will be emailed).
2. **admin-new-registration** — to each of `adminNotifyEmails()`. Subject `New vendor registration: <companyName> (<referenceNo>)`. Body: company, category label, contact name/email, submitted time (Asia/Kuala_Lumpur), button "Review in admin" → `${APP_URL}/admin/vendors/${vendor.id}`.
3. **vendor-decision** — to `vendor.contactEmail`. Subject by status: `Approved — <ref>` / `Additional information required — <ref>` / `Registration not approved — <ref>`. Body per status:
   - APPROVED: congratulations, you are now an approved supplier, procurement will be in touch.
   - KIV: we need more information, the remark in a bordered box, "Reply to this email with the requested information", status link.
   - REJECTED: regret, the remark in a box, "You may submit a new registration in future."
   `sendVendorDecision` reads `vendor.status` to pick the variant; if status is PENDING it must return `{ ok: false, error: "No decision to send" }` and log nothing.

Use `getEnv().EMAIL_FROM` as the from address. `replyTo` = first admin notify email on vendor-facing mails.

## Behaviour rules

- Never throw. Network/Resend/prisma failures → `{ ok: false, error }` and an `EmailLog` row with `error` set (if even the log write fails, `console.error` and return).
- `admin-new-registration` to multiple recipients = one Resend call with `to: string[]`, one EmailLog row with `to` joined by `, `.
- Time formatting: `Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })`.

## Acceptance criteria

- [ ] Unit tests cover: success path writes EmailLog with messageId; Resend rejection writes EmailLog with error and returns ok:false; PENDING vendor → no send; multi-recipient admin mail.
- [ ] `npx tsx -e "..."` manual send to Aziz's address works once `RESEND_API_KEY` and a verified domain are set (document the exact one-liner in your PR).
- [ ] Templates render without runtime errors (`render()` in a test).
- [ ] Checks pass.

## Domain setup (Aziz, not the agent)

Resend dashboard → Domains → add `faysalaziz.com` → add the SPF/DKIM/DMARC records shown to the DNS → verify. Until verified, Resend only delivers to the account owner's address.
