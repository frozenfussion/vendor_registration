# Task board — Wave 1

Six independent tasks. Each runs in its own Codex session on its own branch (git worktree). They share **no files** except the frozen contracts (read-only). **Task 03 (email) is deferred** — the stubs in `lib/email/index.ts` stay until Aziz sets up Resend.

**Fast path:** `bash scripts/wave1.sh` sets up the dev DB, seeds the admin, creates the worktrees and launches tasks 01/02/04/05/06 in parallel. Then `bash scripts/review-pr.sh <n>` per PR.

| # | Task | Branch | Owns |
|---|---|---|---|
| 01 | [Registration form + status page](01-registration-form.md) | `feat/registration-form` | `app/(public)/**`, `app/api/register/`, `components/public/**` |
| 02 | [Admin dashboard + decision](02-admin-dashboard.md) | `feat/admin-dashboard` | `app/(admin)/layout.tsx`, `app/(admin)/admin/vendors/**`, `app/api/admin/vendors/**`, `components/admin/**` (except `login-form.tsx`), `scripts/dev-seed-vendors.ts` |
| 03 | [Email](03-email.md) | `feat/email` | `lib/email/**` |
| 04 | [Admin auth](04-auth.md) | `feat/auth` | `lib/auth.ts`, `proxy.ts`, `app/(admin)/admin/login/**`, `app/api/auth/**`, `components/admin/login-form.tsx`, `auth.config.ts` |
| 05 | [Uploads + download](05-uploads.md) | `feat/uploads` | `lib/storage.ts`, `app/api/admin/documents/**` |
| 06 | [Server + CI/CD](06-server-cicd.md) | `feat/server-cicd` | `deploy/**`, `.github/workflows/**` |

**Frozen (nobody edits):** `prisma/**` (except `seed.ts`), `lib/validation/**`, `lib/status.ts`, `lib/env.ts`, `lib/db.ts`, `lib/reference.ts`, `app/globals.css`, `app/layout.tsx`, `components/ui/**`, `docs/API.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`, `next.config.ts`, `package.json` (ask first if you need a dependency).

Stubs in `lib/storage.ts`, `lib/email/index.ts`, `lib/auth.ts` throw or return `not implemented`. Tasks 01 and 02 call them as-is; when 03/04/05 merge, everything lights up. Until then, test your own task with the stubs (01/02 may temporarily mock them in a test, never in app code).

## How to start a task (Codex)

```bash
cd ~/projects/vendor_registration
git checkout main && git pull
git checkout -b feat/<branch>
codex   # then: "Read AGENTS.md and docs/tasks/NN-*.md. Implement task NN fully."
```

## How to review a PR (Claude Code)

```bash
cd ~/projects/vendor_registration
gh pr checkout <number>
claude   # then paste docs/tasks/REVIEW_PROMPT.md
```

## Merge order

Any order; all are independent. After all six are merged → **Wave 2** (integration run-through on the Droplet, e2e smoke test, demo data).

## Wave 2 (after Wave 1 merges)

- Run the full flow on the live site: register → emails arrive → admin login → approve → status page.
- `e2e/submit-and-approve.spec.ts` (Playwright).
- Fix integration bugs. Theme toggle in admin header if task 02 didn't add one.
