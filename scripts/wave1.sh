#!/usr/bin/env bash
# Wave 1 kickoff — run ONCE from the dev clone on the Droplet:
#   bash scripts/wave1.sh
#
# What it does (idempotent where it matters):
#   1. Installs PostgreSQL 16 if missing; creates a DEV role + database.
#   2. Writes .env for local dev (never overwrites an existing one).
#   3. npm install, applies migrations, seeds the first admin.
#   4. Creates one git worktree + branch per task (01,02,04,05,06; 03 = email is deferred).
#   5. Launches one `codex exec` per task IN PARALLEL, logs to ~/projects/vr-logs/.
#   6. Each Codex session commits, pushes and opens its PR itself.
# Re-running skips tasks whose branch already has a PR.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WT_ROOT="$HOME/projects/vr-worktrees"
LOG_DIR="$HOME/projects/vr-logs"
DEV_DB="vendor_registration_dev"
DEV_ROLE="vendor_dev"
TASKS=("01:registration-form" "02:admin-dashboard" "04:auth" "05:uploads" "06:server-cicd")

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

cd "$REPO_DIR"

# ---------- 0. preconditions ----------
say "Checking preconditions"
command -v codex >/dev/null || die "codex not found"
command -v gh >/dev/null || die "gh not found"
gh auth status >/dev/null 2>&1 || die "gh is not logged in"
codex login status 2>/dev/null | grep -qi "logged in" || die "codex is not logged in"
[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || die "run this from the main branch"
git pull --ff-only origin main
codex exec --help 2>/dev/null | grep -q -- "--dangerously-bypass-approvals-and-sandbox" \
  || die "this codex version has no --dangerously-bypass-approvals-and-sandbox flag; run 'codex exec --help' and update scripts/wave1.sh"

# ---------- 1. PostgreSQL ----------
if ! command -v psql >/dev/null; then
  say "Installing PostgreSQL 16"
  sudo apt-get update -qq
  sudo apt-get install -y -qq postgresql-16 postgresql-contrib
fi
sudo systemctl enable --now postgresql >/dev/null

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DEV_ROLE'" | grep -q 1; then
  say "Creating dev role $DEV_ROLE"
  DEV_PW="$(openssl rand -hex 16)"
  sudo -u postgres psql -qc "CREATE ROLE $DEV_ROLE LOGIN PASSWORD '$DEV_PW';"
  echo "$DEV_PW" > "$HOME/.vr-dev-db-password"; chmod 600 "$HOME/.vr-dev-db-password"
else
  [ -f "$HOME/.vr-dev-db-password" ] || die "role $DEV_ROLE exists but ~/.vr-dev-db-password is missing"
  DEV_PW="$(cat "$HOME/.vr-dev-db-password")"
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DEV_DB'" | grep -q 1; then
  say "Creating dev database $DEV_DB"
  sudo -u postgres psql -qc "CREATE DATABASE $DEV_DB OWNER $DEV_ROLE;"
fi

# ---------- 2. .env ----------
if [ ! -f .env ]; then
  say "Writing .env (dev)"
  cat > .env <<EOF
NODE_ENV=development
DATABASE_URL="postgresql://$DEV_ROLE:$DEV_PW@localhost:5432/$DEV_DB?schema=public"
APP_URL="http://localhost:3000"
AUTH_SECRET="$(openssl rand -base64 32)"
RESEND_API_KEY="re_not_configured_yet"
EMAIL_FROM="Enovix Vendor Registration <vendor@faysalaziz.com>"
ADMIN_NOTIFY_EMAILS="$(git config user.email)"
UPLOAD_DIR="$REPO_DIR/uploads"
UPLOAD_MAX_BYTES=10485760
EOF
  chmod 600 .env
fi
mkdir -p "$REPO_DIR/uploads"

# ---------- 3. deps, migrate, seed ----------
say "npm install + migrate"
npm install --no-audit --no-fund
npx prisma migrate deploy
if [ ! -f "$HOME/.vr-admin-password" ]; then
  openssl rand -base64 18 > "$HOME/.vr-admin-password"; chmod 600 "$HOME/.vr-admin-password"
fi
ADMIN_EMAIL="$(grep ADMIN_NOTIFY_EMAILS .env | cut -d'"' -f2 | cut -d, -f1)"
say "Seeding admin $ADMIN_EMAIL (password in ~/.vr-admin-password)"
SEED_ADMIN_EMAIL="$ADMIN_EMAIL" SEED_ADMIN_PASSWORD="$(cat "$HOME/.vr-admin-password")" SEED_ADMIN_NAME="Aziz" npm run db:seed

# ---------- 4+5. worktrees + codex ----------
mkdir -p "$WT_ROOT" "$LOG_DIR"
PIDS=()
for entry in "${TASKS[@]}"; do
  NUM="${entry%%:*}"; SLUG="${entry#*:}"; BRANCH="feat/$SLUG"; WT="$WT_ROOT/$SLUG"
  BRIEF="$(ls docs/tasks/${NUM}-*.md)"

  if gh pr list --head "$BRANCH" --state all --json number --jq 'length' | grep -q '^[1-9]'; then
    say "Task $NUM: PR already exists for $BRANCH — skipping"; continue
  fi
  if [ ! -d "$WT" ]; then
    say "Task $NUM: creating worktree $WT on $BRANCH"
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git worktree add "$WT" "$BRANCH" >/dev/null
    else
      git worktree add -b "$BRANCH" "$WT" main >/dev/null
    fi
    cp .env "$WT/.env"
    ( cd "$WT" && npm install --no-audit --no-fund >/dev/null 2>&1 ) &
  fi
done
wait

say "Launching Codex sessions (logs: $LOG_DIR)"
for entry in "${TASKS[@]}"; do
  NUM="${entry%%:*}"; SLUG="${entry#*:}"; BRANCH="feat/$SLUG"; WT="$WT_ROOT/$SLUG"
  [ -d "$WT" ] || continue
  if gh pr list --head "$BRANCH" --state all --json number --jq 'length' | grep -q '^[1-9]'; then continue; fi
  BRIEF="$(ls "$WT"/docs/tasks/${NUM}-*.md | xargs -n1 basename)"
  PROMPT="You are a Codex developer agent in this repository. First read AGENTS.md completely, then docs/tasks/README.md, then your brief docs/tasks/$BRIEF. Implement task $NUM fully and ONLY task $NUM, staying inside the files you own. Task 03 (email) is deferred: the email functions in lib/email/index.ts stay as stubs; call them as documented and ignore their result. The dev database is already migrated and seeded; DATABASE_URL is in .env. You are on branch $BRANCH in a git worktree; do not switch branches. When every acceptance criterion passes and 'npm run typecheck && npm run lint && npm run test && npm run build' is green, commit with a descriptive message, push with 'git push -u origin $BRANCH', and open the PR with: gh pr create --base main --head $BRANCH --title 'Task $NUM: <title>' --body-file /tmp/pr-$NUM.md  (write the filled-in docs/tasks/PR_TEMPLATE.md to /tmp/pr-$NUM.md first). If something in the brief is impossible, do the rest, and explain the gap in the PR body. Never edit frozen files. Never touch main."
  (
    cd "$WT"
    codex exec --dangerously-bypass-approvals-and-sandbox -C "$WT" "$PROMPT" > "$LOG_DIR/$SLUG.log" 2>&1
    echo "EXIT=$?" >> "$LOG_DIR/$SLUG.log"
  ) &
  PIDS+=($!)
  echo "  task $NUM → $BRANCH (pid $!)"
done

say "All sessions running. Follow along with:  tail -f $LOG_DIR/*.log"
wait "${PIDS[@]}" || true

say "Done. Open PRs:"
gh pr list --state open
echo
echo "Next: bash scripts/review-pr.sh <number>   (Claude Code review, one PR at a time)"
