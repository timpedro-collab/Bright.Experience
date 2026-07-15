/** API route for cross-event aggregate metrics — consumed by DashboardTabs client component. */
import { NextRequest, NextResponse } from "next/server";
import { getAggregateMetrics } from "@/lib/queries/aggregate-metrics";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get("accountId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!accountId || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Customers may only aggregate their own account — never trust the query
  // param alone. Internal roles can query any account for portfolio views.
  if (!isInternalRole(user.role)) {
    if (!user.accountId || user.accountId !== accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const data = await getAggregateMetrics(accountId, startDate, endDate);
  return NextResponse.json(data);
}
