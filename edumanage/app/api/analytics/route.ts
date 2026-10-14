import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-guard";
import { getAnalyticsData } from "@/lib/analytics";

/** GET /api/analytics — admin overview: counts, attendance %, fee collection. */
export async function GET() {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;
  const data = await getAnalyticsData();
  return NextResponse.json(data);
}
