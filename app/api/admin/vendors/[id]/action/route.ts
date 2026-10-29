// POST /api/admin/vendors/[id]/action — JSON. Owned by task 02-admin-dashboard.
// Contract: docs/API.md#post-apiadminvendorsidaction
import { NextResponse } from "next/server";

export async function POST(_req: Request, _ctx: RouteContext<"/api/admin/vendors/[id]/action">) {
  return NextResponse.json({ error: "Not implemented — task 02-admin-dashboard" }, { status: 501 });
}
