# Vendor Registration

Phase-1 supplier onboarding portal for **Enovix** (Penang). Vendors register and upload documents; Enovix admins approve, reject or keep-in-view, and the vendor is notified by email.

- Live: https://vendor.faysalaziz.com
- Owner: Aziz (@frozenfussion)
- Planning logs: Google Drive folder `Logs` (ask Aziz) — every decision is recorded there, newest file wins.

## Stack

Next.js 16 (App Router, TS) · Tailwind v4 + shadcn/ui · Prisma 7 + PostgreSQL 16 · Zod 4 · Auth.js v5 · Resend · Caddy + systemd on a DigitalOcean Droplet (Ubuntu 24.04).

## Working on this repo

Humans and agents: read **[AGENTS.md](AGENTS.md)** first, then **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** and **[docs/API.md](docs/API.md)**. Work is split into self-contained briefs in **[docs/tasks/](docs/tasks/)**.

```bash
cp .env.example .env        # fill in
npm install                 # also generates the Prisma client
npm run db:migrate          # applies prisma/migrations to DATABASE_URL
npm run db:seed             # SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
npm run dev
```

Checks: `npm run typecheck && npm run lint && npm run test && npm run build`.
