You are reviewing a pull request in this repo. Read AGENTS.md and the task brief named in the PR (docs/tasks/NN-*.md) first. Then run `gh pr diff` and read every changed file.

Review against this checklist and produce a verdict of APPROVE or REQUEST CHANGES with a numbered list of findings. Each finding: file:line, severity (BLOCKER / SHOULD / NIT), what is wrong, what to do instead. BLOCKERs make the verdict REQUEST CHANGES.

BLOCKER checks:
1. Any frozen contract file changed (list in docs/tasks/README.md).
2. Any acceptance criterion in the brief not met or not evidenced in the PR description.
3. Files touched outside the task's "You own" list.
4. Security: path built from user input; missing requireAdmin/requireAdminApi on an admin route; raw SQL with string interpolation; secrets in code; HTML injection in emails; user enumeration in login.
5. A Vendor.status change without a StatusHistory row in the same transaction.
6. Email send that can throw or block the response.
7. `npm run typecheck && npm run lint && npm run test && npm run build` not passing (run them).
8. Next 16 misuse: `middleware.ts` instead of `proxy.ts`; un-awaited `params`; `cacheComponents` enabled; `process.env` read outside lib/env.ts.

SHOULD checks:
- Hard-coded colours instead of tokens; missing dark-mode handling; layout breaks at 375px.
- Missing labels/aria; non-button clickables.
- Copy that is lorem ipsum, invented numbers, or not Malaysian context.
- Over-engineering beyond Phase 1.

Post the review with: gh pr review <number> --approve | --request-changes --body-file <file>
