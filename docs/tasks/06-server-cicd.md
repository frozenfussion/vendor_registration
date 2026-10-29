# Task 06 — Droplet setup + CI/CD

Branch: `feat/server-cicd`

## Goal

Everything needed to run the app on `vendor.faysalaziz.com` and to redeploy automatically on every push to `main`. Nothing in this task touches app code.

## You own

- `deploy/setup-droplet.sh` — idempotent, run once by Aziz as `aziz` with sudo. Installs and configures Postgres 16, Caddy, the systemd unit, firewall, directories. Prints what it did. Safe to re-run.
- `deploy/Caddyfile` — `vendor.faysalaziz.com { encode gzip; reverse_proxy 127.0.0.1:3000; header { X-Content-Type-Options nosniff; Referrer-Policy strict-origin-when-cross-origin; X-Frame-Options DENY } ; request_body { max_size 50MB } }`.
- `deploy/vendor-registration.service` — systemd unit: `User=aziz`, `WorkingDirectory=/srv/vendor_registration`, `EnvironmentFile=/etc/vendor-registration/.env`, `ExecStart=/usr/bin/npm run start`, `Restart=always`, `Environment=NODE_ENV=production PORT=3000`, hardening (`NoNewPrivileges=true`, `ProtectSystem=strict`, `ReadWritePaths=/var/lib/vendor-registration /srv/vendor_registration/.next`).
- `deploy/deploy.sh` — what CI runs over SSH: `cd /srv/vendor_registration && git fetch origin main && git reset --hard origin/main && npm ci && npm run db:deploy && npm run build && sudo systemctl restart vendor-registration && curl -fsS http://127.0.0.1:3000/register > /dev/null && echo DEPLOY_OK`.
- `deploy/sudoers-vendor-registration` — allows `aziz` to run `systemctl restart vendor-registration` without a password (installed by setup script to `/etc/sudoers.d/`).
- `.github/workflows/deploy.yml` — on `push` to `main` (and `workflow_dispatch`): checkout, `npm ci`, `npm run typecheck && npm run lint && npm run test && npm run build` (CI needs a `DATABASE_URL` only for `prisma generate`, which doesn't connect — set a dummy), then `appleboy/ssh-action` (or plain `ssh` with a key from secrets) to run `deploy/deploy.sh`. Secrets: `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`.
- `.github/workflows/ci.yml` — on `pull_request`: same checks, no deploy.
- `deploy/README.md` — step-by-step for Aziz: run setup script; create `/etc/vendor-registration/.env` from `.env.example` with production values (`APP_URL=https://vendor.faysalaziz.com`, `UPLOAD_DIR=/var/lib/vendor-registration/uploads`, real `AUTH_SECRET`, `RESEND_API_KEY`); generate a deploy SSH keypair, put the public key in `~/.ssh/authorized_keys`, private key in the GitHub secret; seed the first admin; first manual deploy; how to check logs (`journalctl -u vendor-registration -f`), restart, roll back (`git reset --hard <sha>` + redeploy).

## setup-droplet.sh must

1. `apt install postgresql-16 postgresql-contrib caddy ufw` (Caddy from its official apt repo: https://caddyserver.com/docs/install#debian-ubuntu-raspbian).
2. Create DB role `vendor` with a generated password (printed once, also written to `/etc/vendor-registration/.env` as `DATABASE_URL` if the file does not exist yet) and database `vendor_registration`.
3. `mkdir -p /srv/vendor_registration /var/lib/vendor-registration/uploads /etc/vendor-registration`; `chown aziz:aziz` on the first two; `/etc/vendor-registration/.env` mode `0640`, owner `root:aziz`.
4. Clone the repo into `/srv/vendor_registration` if empty (`gh repo clone frozenfussion/vendor_registration /srv/vendor_registration` as aziz).
5. Install Caddyfile to `/etc/caddy/Caddyfile`, `systemctl reload caddy`.
6. Install the systemd unit, `daemon-reload`, `enable`.
7. `ufw allow OpenSSH; ufw allow 80; ufw allow 443; ufw --force enable`.
8. Install sudoers file with `visudo -cf` check.
9. Do **not** run `npm install`/`build`/`migrate` — `deploy.sh` does that.

## Do not touch

Any file outside `deploy/` and `.github/`.

## Acceptance criteria

- [ ] `bash -n` and `shellcheck` clean on all scripts.
- [ ] `setup-droplet.sh` is idempotent (second run makes no changes, exits 0).
- [ ] `ci.yml` runs green on your PR.
- [ ] After Aziz runs setup + first deploy: `https://vendor.faysalaziz.com/register` serves over valid TLS and `systemctl status vendor-registration` is active.
- [ ] `deploy.yml` redeploys on push to `main` and fails loudly if the health check fails.

## Note

DigitalOcean blocks outbound SMTP; we use Resend over HTTPS, so no mail ports are needed. Keep the firewall to 22/80/443.
