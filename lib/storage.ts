// File storage contract. Owned by task 05-uploads. Other tasks call these
// functions and must not reimplement file I/O.
//
// Rules the implementation must honour:
// - Files live under getEnv().UPLOAD_DIR / <vendorId> / <documentId>.<ext>
// - `storedPath` saved in the DB is RELATIVE to UPLOAD_DIR.
// - Never trust originalName for the on-disk name; derive ext from mimeType.
// - Reject anything not in ACCEPTED_MIME_TYPES or above UPLOAD_MAX_BYTES.

import type { DocumentTypeValue } from "@/lib/validation/document";

export type StoredFile = {
  /** Relative path under UPLOAD_DIR. */
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
};

export type StoreFileArgs = {
  vendorId: string;
  documentId: string;
  type: DocumentTypeValue;
  file: File; // Web File from multipart form data
};

/** Validate and persist one uploaded file. Throws StorageError on rejection. */
export async function storeFile(_args: StoreFileArgs): Promise<StoredFile> {
  throw new Error("storeFile not implemented — see docs/tasks/05-uploads.md");
}

/** Open a stored file for streaming to an authenticated admin. */
export async function openStoredFile(
  _storedPath: string,
): Promise<{ stream: ReadableStream<Uint8Array>; sizeBytes: number }> {
  throw new Error("openStoredFile not implemented — see docs/tasks/05-uploads.md");
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: "TOO_LARGE" | "BAD_TYPE" | "IO",
  ) {
    super(message);
    this.name = "StorageError";
  }
}
