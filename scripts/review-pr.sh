#!/usr/bin/env bash
# Review one PR with Claude Code (Opus 5.5, medium) non-interactively and post the review.
#   bash scripts/review-pr.sh <pr-number>
# Uses a dedicated worktree so your main checkout is untouched.

set -euo pipefail
PR="${1:?usage: review-pr.sh <pr-number>}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WT="$HOME/projects/vr-review"

cd "$REPO_DIR"
command -v claude >/dev/null || { echo "claude not found"; exit 1; }

if [ ! -d "$WT" ]; then
  git worktree add --detach "$WT" main >/dev/null
fi
cd "$WT"
gh pr checkout "$PR" --force
cp "$REPO_DIR/.env" .env 2>/dev/null || true
npm install --no-audit --no-fund >/dev/null 2>&1

PROMPT="$(cat docs/tasks/REVIEW_PROMPT.md)

You are reviewing PR #$PR. The branch is already checked out in this directory. Run the checks, write your review to /tmp/review-$PR.md, then post it with exactly one of:
  gh pr review $PR --approve --body-file /tmp/review-$PR.md
  gh pr review $PR --request-changes --body-file /tmp/review-$PR.md
Finish by printing the verdict line."

claude -p "$PROMPT" \
  --model claude-opus-5-5 --effort medium \
  --permission-mode dontAsk \
  --allowedTools "Read,Grep,Glob,Bash(npm run *),Bash(npx *),Bash(gh pr *),Bash(gh api *),Bash(git *),Write(/tmp/*)"

echo
gh pr view "$PR" --json reviews --jq '.reviews[-1] | "\(.author.login): \(.state)"'
