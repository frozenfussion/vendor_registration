// Auth contract. Owned by task 04-auth (Auth.js v5, credentials provider).
// Other tasks import ONLY from this file. Do not call next-auth directly
// elsewhere.

export type AdminSession = {
  user: { id: string; name: string; email: string };
};

/**
 * Returns the current admin session or null. Safe to call in server
 * components, route handlers and server actions.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  throw new Error("getAdminSession not implemented — see docs/tasks/04-auth.md");
}

/**
 * Returns the current admin session or redirects to /admin/login.
 * Use at the top of every admin page and route handler.
 */
export async function requireAdmin(): Promise<AdminSession> {
  throw new Error("requireAdmin not implemented — see docs/tasks/04-auth.md");
}

// Task 04 will also export: signIn, signOut, handlers (for app/api/auth/[...nextauth]/route.ts)
