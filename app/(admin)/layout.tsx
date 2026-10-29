// Admin shell: sidebar nav + signed-in user + sign out.
// Owned by task 02-admin-dashboard. Must call requireAdmin() from lib/auth
// for every route except /admin/login (handled by task 04 via proxy.ts).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
