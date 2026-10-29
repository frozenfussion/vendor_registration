# End-to-end tests

Owned by Wave 2 (integration). One smoke test only in Phase 1:
`submit-and-approve.spec.ts` — vendor submits a registration with three PDFs,
admin logs in, approves it, vendor status page shows Approved.

Run against a local dev server: `npm run test:e2e`.
Run against the live site before a demo: `E2E_BASE_URL=https://vendor.faysalaziz.com npm run test:e2e`.
