import { NextResponse } from "next/server";
import { getSession, loadSessionUser } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null });
  const full = await loadSessionUser(session);
  return NextResponse.json({ user: full });
}
