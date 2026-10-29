// Typed, validated environment. Import `env` from here; never read
// process.env directly elsewhere so a missing variable fails at startup
// with a clear message instead of deep inside a request.
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),

  // Public origin of the app, no trailing slash. Used in emails and auth.
  APP_URL: z.string().url(),

  // Auth.js
  AUTH_SECRET: z.string().min(32),

  // Resend
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1), // e.g. "Enovix Vendor Registration <vendor@faysalaziz.com>"
  // Comma-separated list of admin inboxes that receive "new registration" emails.
  ADMIN_NOTIFY_EMAILS: z.string().min(1),

  // Absolute directory where uploaded documents are stored.
  UPLOAD_DIR: z.string().min(1),
  // Max upload size per file in bytes (default 10 MB).
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function adminNotifyEmails(): string[] {
  return getEnv()
    .ADMIN_NOTIFY_EMAILS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
