# Architecture

Phase 1. Single Next.js app, single Postgres, single Ubuntu box. Nothing clever.

## Runtime topology (production)

```
Internet ──443──▶ Caddy (auto TLS, vendor.faysalaziz.com)
                    │ reverse_proxy 127.0.0.1:3000
                    ▼
               next start  (systemd: vendor-registration.service, user: aziz)
                    │ pg driver adapter
                    ▼
               PostgreSQL 16 (localhost:5432, db vendor_registration)

Uploads: /var/lib/vendor-registration/uploads/<vendorId>/<documentId>.<ext>
Email:   Resend API (HTTPS egress only; the Droplet cannot send SMTP)
```

Directories on the Droplet:

| Path | Purpose | Written by |
|---|---|---|
| `~/projects/vendor_registration` | Dev clone. Codex + Claude Code work here | agents |
| `/srv/vendor_registration` | Live checkout served by systemd | GitHub Actions only |
| `/var/lib/vendor-registration/uploads` | Vendor documents | the app |
| `/etc/vendor-registration/.env` | Production secrets | Aziz by hand |

## Request flows

### Vendor submits

```
POST /api/register (multipart)
  ├─ parse fields → vendorRegistrationSchema.safeParse → 400 on failure
  ├─ validate files (required types present, mime, size) → 400 on failure
  ├─ prisma.$transaction
  │    ├─ referenceNo = nextReferenceNo(tx)
  │    ├─ Vendor.create (status PENDING)
  │    ├─ Document.create × n   (storedPath filled after storeFile)
  │    └─ StatusHistory.create (null → PENDING, actionedBy null)
  ├─ storeFile × n (disk)       — if this fails, delete the Vendor row and 500
  ├─ sendVendorConfirmation      (never throws; EmailLog row)
  ├─ sendAdminNewRegistration    (never throws; EmailLog row)
  └─ 201 { referenceNo }
```

Why write DB first then disk: a reference number must exist before the file name is final (`documentId`). If disk fails the vendor row is removed so the vendor can resubmit cleanly.

### Vendor checks status

```
GET /status/[ref]  (server component)
  ├─ referenceNoSchema.safeParse → not-found page on failure
  ├─ prisma.vendor.findUnique({ referenceNo }, include latest StatusHistory)
  └─ render: company, status badge, timeline, latest remark (only for KIV/REJECTED)
```

Public page shows **no** bank details, contact details or documents — only company name, reference, status and remarks.

### Admin decides

```
POST /api/admin/vendors/[id]/action  (JSON)
  ├─ requireAdmin() → 401
  ├─ vendorActionSchema.safeParse → 400
  ├─ load vendor → 404
  ├─ canTransition(vendor.status, ACTION_TO_STATUS[action]) → 409 if not allowed
  ├─ prisma.$transaction
  │    ├─ Vendor.update status
  │    └─ StatusHistory.create (from → to, remark, actionedById)
  ├─ sendVendorDecision(vendor, remark)   (never throws; EmailLog row)
  └─ 200 { status }
```

### Admin downloads a document

```
GET /api/admin/documents/[id]
  ├─ requireAdmin() → 401
  ├─ prisma.document.findUnique → 404
  ├─ openStoredFile(doc.storedPath)
  └─ stream with Content-Type, Content-Length, Content-Disposition: attachment
```

## Auth

Auth.js v5, credentials provider, JWT session cookie, bcrypt (cost 12). `proxy.ts` redirects unauthenticated requests under `/admin/*` (except `/admin/login`) to `/admin/login`. Route handlers under `/api/admin/*` additionally call `requireAdmin()` — the proxy is a convenience, not the security boundary.

## Data

See `prisma/schema.prisma`. Invariants:

- `Vendor.referenceNo` unique, format `VR-YYYY-NNNN`, allocated inside the create transaction under an advisory lock (`lib/reference.ts`).
- Every status change writes `StatusHistory` in the same transaction.
- `Document.storedPath` is relative to `UPLOAD_DIR` and never derived from user input.
- `EmailLog` records every send attempt.

## Theming

Tokens in `app/globals.css` (`:root` light, `.dark` dark). `next-themes` toggles the `dark` class; default follows the OS. Status colours are exposed as `bg-status-*`/`text-status-*` utilities. Font: Inter.

## Folder map

```
app/
  (public)/            vendor-facing, no auth        → task 01
    register/, status/[ref]/
  (admin)/admin/       auth required                 → task 02 (login page → task 04)
    login/, vendors/, vendors/[id]/
  api/
    register/                                        → task 01
    admin/vendors/[id]/action/                       → task 02
    admin/documents/[id]/                            → task 05
    auth/[...nextauth]/                              → task 04
components/
  ui/        shadcn primitives (shared, do not edit)
  public/    task 01 components
  admin/     task 02 components
lib/
  validation/  Zod contracts (frozen)
  email/       task 03 (templates/ + index.ts)
  auth.ts      task 04
  storage.ts   task 05
  db.ts, env.ts, status.ts, reference.ts  (frozen)
prisma/        schema + migrations (frozen), seed.ts
deploy/        Caddyfile, systemd unit, setup script  → task 06
.github/workflows/deploy.yml                          → task 06
e2e/           Playwright smoke test                  → Wave 2
docs/          this file, API.md, tasks/
```
