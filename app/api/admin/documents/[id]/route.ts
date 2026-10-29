// GET /api/admin/documents/[id] — streams a stored document to an admin.
// Owned by task 05-uploads. Contract: docs/API.md#get-apiadmindocumentsid
import { NextResponse } from "next/server";

export async function GET(_req: Request, _ctx: RouteContext<"/api/admin/documents/[id]">) {
  return NextResponse.json({ error: "Not implemented — task 05-uploads" }, { status: 501 });
}
