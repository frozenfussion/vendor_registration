# Task 05 — Document storage + authenticated download

Branch: `feat/uploads`

## Goal

Implement `lib/storage.ts` (write/read files on local disk safely) and `GET /api/admin/documents/[id]` (stream a file to a signed-in admin).

## You own

- `lib/storage.ts` — replace stub bodies; keep every exported signature and `StorageError`.
- `lib/storage.test.ts` — tests using a temp dir (`fs.mkdtemp`) and `UPLOAD_DIR` overridden via `process.env` before importing (or inject via a small internal `resolveUploadDir()` you can stub).
- `app/api/admin/documents/[id]/route.ts`

## Do not touch

Everything else.

## `storeFile({ vendorId, documentId, type, file })`

1. Validate: `file.size > 0`, `file.size <= getEnv().UPLOAD_MAX_BYTES` else `StorageError("…", "TOO_LARGE")`; `file.type` in `ACCEPTED_MIME_TYPES` else `StorageError("…", "BAD_TYPE")`. Also sniff magic bytes (`%PDF-`, `\xFF\xD8\xFF`, `\x89PNG`) and reject on mismatch with `BAD_TYPE` — do not trust the declared MIME.
2. Extension from MIME: `application/pdf→pdf`, `image/jpeg→jpg`, `image/png→png`.
3. Path: `<UPLOAD_DIR>/<vendorId>/<documentId>.<ext>`. `vendorId`/`documentId` are cuids (validate `/^[a-z0-9]+$/i`), never from the user directly. `fs.mkdir(recursive)`, write with `0o640`, directory `0o750`.
4. Return `{ storedPath: "<vendorId>/<documentId>.<ext>", mimeType, sizeBytes }`.
5. Any fs error → `StorageError(message, "IO")`.

## `openStoredFile(storedPath)`

- Reject if `storedPath` contains `..`, starts with `/`, or resolves outside `UPLOAD_DIR` (`path.resolve` + `startsWith(uploadDir + path.sep)`).
- `fs.stat` → size; `fs.createReadStream` → convert to web `ReadableStream` (`Readable.toWeb`). Missing file → `StorageError("…", "IO")`.

## Route `GET /api/admin/documents/[id]`

Follow `docs/API.md`. Use `requireAdminApi()` if task 04 has merged, else `requireAdmin()` wrapped to return 401 on the not-implemented error (note the wrapper in your PR; task 04's PR explains the final form). Load `prisma.document.findUnique({ where: { id } })` → 404. `openStoredFile` → on `IO` error 404. Respond `new Response(stream, { headers })` with `Content-Type: doc.mimeType`, `Content-Length`, `Content-Disposition: attachment; filename="<sanitised originalName>"` (strip everything except `[A-Za-z0-9._-]`, fall back to `document.<ext>`), `Cache-Control: private, no-store`.

## Acceptance criteria

- [ ] Tests: stores a PDF and returns the relative path; rejects oversize (TOO_LARGE); rejects `.exe` renamed to `.pdf` (magic bytes); `openStoredFile("../etc/passwd")` throws; missing file → IO.
- [ ] Manual: with a real vendor row, `curl -b <cookie> /api/admin/documents/<id> -o out.pdf` yields the file; unauthenticated → 401.
- [ ] No absolute paths or user-provided names end up on disk or in the DB.
- [ ] Checks pass.
