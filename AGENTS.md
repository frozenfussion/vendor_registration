# AGENTS.md — rules for every coding agent in this repo

You are working on **Vendor Registration**, a Phase-1 supplier onboarding app for Enovix (Penang). Owner: Aziz. Developer agents: OpenAI Codex. Reviewer: Claude Code (Opus 5.5). Read this whole file before touching anything.

## 1. Your task is in `docs/tasks/`

- You were started with a task number. Open `docs/tasks/NN-*.md` and do **only** that task.
- The brief lists the files you **own** and the files you must **not touch**. Stay inside your files. If you believe a contract file must change, stop and write the reason at the top of your PR description — do not change it yourself.
- Finish by meeting every item in the brief's **Acceptance criteria**, then run the checks in section 5.

## 2. Contracts are frozen (do not edit)

| File | What it fixes |
|---|---|
| `prisma/schema.prisma` + `prisma/migrations/` | Database shape |
| `lib/validation/*.ts` | Form/API input shapes (Zod). Shared by client and server |
| `lib/status.ts` | Status transitions (PENDING → APPROVED/REJECTED/KIV; KIV → APPROVED/REJECTED; APPROVED/REJECTED terminal) |
| `lib/env.ts` | Environment variables. Read config via `getEnv()`, never `process.env` |
| `lib/db.ts` | The one `prisma` client. Never `new PrismaClient()` elsewhere |
| `lib/storage.ts`, `lib/email/index.ts`, `lib/auth.ts` | Function signatures other tasks call. The owning task fills in the body; the signature stays |
| `docs/API.md` | Route request/response shapes |
| `app/globals.css` | Design tokens (light + dark). Use `bg-background`, `text-muted-foreground`, `bg-status-kiv-soft` etc. Never hard-code hex colours in components |

## 3. Stack facts you must respect

- **Next.js 16.4** App Router, TypeScript strict, **`cacheComponents: false`** (set in `next.config.ts`; do not enable it). The scaffolded `<!-- nextjs-agent-rules -->` block below is kept on purpose: Next 16 differs from your training data — read `node_modules/next/dist/docs/` for anything you are not sure about. `middleware.ts` is deprecated; the file is **`proxy.ts`** exporting `proxy()`.
- Route/layout props are typed with the generated globals `PageProps<"/path">`, `LayoutProps<"/path">`, `RouteContext<"/api/path">`. `params` is a Promise — `await` it.
- **Prisma 7.10** with the `pg` driver adapter. Client is generated to `lib/generated/prisma` (git-ignored; `npm install` regenerates). Import types from `@/lib/generated/prisma/client`, enums from `@/lib/db`. Prisma skills are in `.agents/skills/prisma-*` — consult them for Prisma 7 API shape.
- **Zod 4** (`z.enum([...], { error })`, `z.coerce`, `safeParse`). Use the schemas in `lib/validation`; never re-declare field rules.
- **Tailwind v4 + shadcn/ui** (components in `components/ui`, `cn` from `@/lib/utils`). Add new shadcn components with `npx shadcn@latest add <name>` only if the brief allows it.
- **Auth.js v5** (`next-auth@beta`) credentials provider — task 04 only.
- **Resend** + `@react-email/components` — task 03 only.
- Node 24. npm only (no pnpm/yarn/bun). Never commit `.env`, `node_modules`, `lib/generated`, `uploads/`.

## 4. Conventions

- Server-first: pages are Server Components; use Client Components (`"use client"`) only for interactivity (forms, buttons, theme toggle).
- Route handlers in `app/api/**/route.ts` return `NextResponse.json(...)` with the shapes in `docs/API.md`. Validation failures → `400 { error, issues }`. Auth failures → `401`. Unknown id → `404`.
- Every DB write that changes `Vendor.status` must also create a `StatusHistory` row in the **same transaction**.
- Email sends never throw and never block the response on failure (see `lib/email/index.ts`).
- Uploaded files: only through `lib/storage.ts`. Never build paths from user input.
- Accessibility: real `<label htmlFor>`, `<button type=...>`, keyboard reachable, 4.5:1 contrast (the tokens already pass).
- Copy is in English, Malaysian context (SSM, TIN/SST, MYR, Malaysian states/banks). No lorem ipsum, no invented statistics.
- Keep it simple. Phase 1 is the smallest thing that works end-to-end. No feature flags, no abstractions for hypothetical Phase 2.

## 5. Before you open a PR (all must pass)

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Then:

```bash
git checkout -b feat/<task-slug>        # done at start; one branch per task
git add -A && git commit -m "<task NN>: <what>"
git push -u origin feat/<task-slug>
gh pr create --base main --fill --title "Task NN: <title>" --body-file docs/tasks/PR_TEMPLATE.md
```

Fill in the PR template honestly (what you built, how you tested it, anything you could not finish). Never push to `main`. Never force-push.

## 6. Review (Claude Code)

Reviewer runs `claude` in the repo with the prompt in `docs/tasks/REVIEW_PROMPT.md`. Findings that block a merge: contract file changed, acceptance criterion missed, security issue (path traversal, missing auth, SQL/HTML injection), failing checks. Style nits do not block.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
