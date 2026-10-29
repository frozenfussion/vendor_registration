# Task 04 — Admin authentication (Auth.js v5, credentials)

Branch: `feat/auth`

## Goal

Admins sign in at `/admin/login` with email + password. Everything under `/admin/*` and `/api/admin/*` requires a session. Sign out works. `requireAdmin()` / `getAdminSession()` in `lib/auth.ts` return real sessions.

## You own

- `lib/auth.ts` — keep `AdminSession`, `getAdminSession`, `requireAdmin` signatures; add and export `signIn`, `signOut`, `handlers`, `auth` from `NextAuth(...)`.
- `auth.config.ts` (repo root) — the edge-safe part of the config (providers list, `pages`, `callbacks.authorized`) if you split config for the proxy; otherwise skip.
- `proxy.ts` (repo root) — Next 16 proxy (NOT `middleware.ts`): matcher `["/admin/:path*", "/api/admin/:path*"]`; unauthenticated → redirect to `/admin/login?next=<path>` for pages, 401 JSON for `/api/admin/*`; `/admin/login` always allowed; signed-in user hitting `/admin/login` → redirect to `/admin/vendors`.
- `app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers`.
- `app/(admin)/admin/login/page.tsx` + `components/admin/login-form.tsx` (you own this one file inside `components/admin/`; task 02 owns the rest of that folder).
- `lib/auth.test.ts` — unit test for the credentials `authorize()` function (bcrypt compare, unknown email, wrong password, email case-insensitivity).

## Do not touch

`app/(admin)/layout.tsx`, `app/(admin)/admin/vendors/**` (task 02); frozen files.

## Implementation notes

- `next-auth@5 beta`: `import NextAuth from "next-auth"; import Credentials from "next-auth/providers/credentials"`. Session strategy `jwt`. `secret: getEnv().AUTH_SECRET`. `trustHost: true` (we are behind Caddy). `pages: { signIn: "/admin/login" }`.
- `authorize({ email, password })`: validate with `adminLoginSchema`; `prisma.adminUser.findUnique({ where: { email } })`; `bcrypt.compare`; return `{ id, name, email }` or `null`. Constant-time-ish: always run a compare even when the user is missing (compare against a dummy hash) to avoid user enumeration by timing.
- `callbacks.jwt` copies `id`/`name`/`email` into the token; `callbacks.session` exposes them as `session.user`. Session max age 12 h.
- `getAdminSession()` = `await auth()` mapped to `AdminSession | null`. `requireAdmin()` = session or `redirect("/admin/login")` (from `next/navigation`) — inside a route handler `redirect` is wrong, so detect: if called from a route handler, throw a `Response` with 401 instead. Simplest: export two helpers — `requireAdmin()` for pages (redirects) and `requireAdminApi()` for route handlers (returns `AdminSession | NextResponse(401)`). Add `requireAdminApi` to `lib/auth.ts` and document it in your PR; task 02/05 will adopt it.
- The Prisma client uses the `pg` adapter and cannot run in the proxy (edge-like runtime). Keep `proxy.ts` free of Prisma imports: use the split-config pattern (`auth.config.ts` without the provider's `authorize` body, or with a provider whose `authorize` is only used server-side) so the proxy only reads the JWT cookie.
- Login page design (mockup in Drive log 1447): centred 420px card on `bg-background`, wordmark + "Vendor Registration Admin" + "Enovix procurement — authorised staff only", Email, Password (with "Forgot password?" link to `#` — Phase 2), "Sign in" primary button, error line "Invalid email or password" (never say which), footer "Access is logged. Contact IT to request an admin account." Light/dark.
- Seeding the first admin is already handled by `prisma/seed.ts` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).

## Acceptance criteria

- [ ] Visiting `/admin/vendors` signed out → lands on `/admin/login?next=/admin/vendors`; after login returns there.
- [ ] `curl /api/admin/vendors/x/action` signed out → 401 JSON.
- [ ] Wrong password → generic error, no enumeration difference in message.
- [ ] Sign out clears the session.
- [ ] `proxy.ts` does not import Prisma/pg (build must not warn about Node APIs in proxy).
- [ ] Unit tests for `authorize()` pass. Checks pass.
