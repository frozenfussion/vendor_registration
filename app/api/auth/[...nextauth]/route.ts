// Auth.js route handlers. Owned by task 04-auth.
// Task 04 replaces this with: export const { GET, POST } = handlers (from lib/auth)
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not implemented — task 04-auth" }, { status: 501 });
}
export const POST = GET;
