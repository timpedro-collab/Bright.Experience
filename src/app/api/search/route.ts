/** Global search API — returns events, accounts, tasks, and (for internal users) profiles. */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isInternalRole } from "@/lib/roles";
import type { UserRole } from "@/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "customer_user") as UserRole;
  const internal = isInternalRole(role);
  const pattern = `%${q}%`;

  const [eventsRes, tasksRes, accountsRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, accounts!inner(name)")
      .ilike("name", pattern)
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, event_id, target_path, events!inner(name)")
      .ilike("title", pattern)
      .limit(5),
    internal
      ? supabase
          .from("accounts")
          .select("id, name")
          .ilike("name", pattern)
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const events = (eventsRes.data ?? []).map((e: Record<string, unknown>) => {
    const acct = e.accounts as { name: string } | null;
    return { id: e.id, name: e.name, accountName: acct?.name ?? null };
  });

  const tasks = (tasksRes.data ?? []).map((t: Record<string, unknown>) => {
    const evt = t.events as { name: string } | null;
    return {
      id: t.id,
      title: t.title,
      eventId: t.event_id,
      eventName: evt?.name ?? null,
      targetPath: t.target_path ?? "actions",
    };
  });

  const accounts = (
    (accountsRes as { data: Record<string, unknown>[] | null }).data ?? []
  ).map((a: Record<string, unknown>) => ({
    id: a.id,
    name: a.name,
  }));

  return NextResponse.json({ events, accounts, tasks });
}
